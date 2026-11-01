import time
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.db_models import TrainedModel, DetectionJob, DetectionRecord
from app.services.dl_service import DLService, PyTorchModelWrapper
from app.services.ml_service import MLService
from app.core.config import settings

class DetectionService:
    @classmethod
    def run_detection(
        cls,
        db: Session,
        model_id: int,
        csv_file_path: Path,
        job_name: str
    ) -> DetectionJob:
        start_time = time.time()
        
        # 1. Fetch trained model and pipeline
        model_record = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
        if not model_record:
            raise ValueError(f"Trained model with id {model_id} not found.")

        preprocessing = model_record.preprocessing
        pipeline = joblib.load(preprocessing.pipeline_path)

        feature_names = pipeline["feature_names"]
        scaler = pipeline["scaler"]
        imputer = pipeline["imputer"]
        label_encoder = pipeline["label_encoder"]
        problem_type = pipeline.get("problem_type", "binary")

        # 2. Read input CSV
        df = pd.read_csv(csv_file_path)
        df.columns = df.columns.str.strip()

        # Extract or create IP/port/protocol columns for network display if present
        src_ips = df["Source IP"].astype(str) if "Source IP" in df.columns else (
            df["src_ip"].astype(str) if "src_ip" in df.columns else ["192.168.1." + str(i % 254 + 1) for i in range(len(df))]
        )
        dst_ips = df["Destination IP"].astype(str) if "Destination IP" in df.columns else (
            df["dst_ip"].astype(str) if "dst_ip" in df.columns else ["10.0.0." + str(i % 50 + 1) for i in range(len(df))]
        )
        src_ports = df["Source Port"].astype(int) if "Source Port" in df.columns else [1024 + (i % 60000) for i in range(len(df))]
        dst_ports = df["Destination Port"].astype(int) if "Destination Port" in df.columns else (
            df["Dst Port"].astype(int) if "Dst Port" in df.columns else [80 if i % 2 == 0 else 443 for i in range(len(df))]
        )
        protocols = df["Protocol"].astype(str) if "Protocol" in df.columns else ["TCP" for _ in range(len(df))]

        # 3. Align features with pipeline
        X_df = pd.DataFrame(index=df.index)
        for feat in feature_names:
            if feat in df.columns:
                X_df[feat] = pd.to_numeric(df[feat], errors="coerce")
            else:
                X_df[feat] = 0.0

        # Replace inf with nan
        X_df = X_df.replace([np.inf, -np.inf], np.nan)
        X_imp = imputer.transform(X_df)
        X_scaled = scaler.transform(X_imp)

        # 4. Load Model and Predict
        model_path = Path(model_record.model_path)
        if model_record.model_type in ["ANN", "LSTM"]:
            model = DLService.load_model(model_path, input_dim=len(feature_names))
        else:
            model = MLService.load_model(model_path)

        predictions_idx = model.predict(X_scaled)
        
        # Calculate confidences
        if hasattr(model, "predict_proba"):
            try:
                probas = model.predict_proba(X_scaled)
                confidences = np.max(probas, axis=1)
            except Exception:
                confidences = np.ones(len(predictions_idx)) * 0.95
        else:
            confidences = np.ones(len(predictions_idx)) * 0.95

        predicted_labels = label_encoder.inverse_transform(predictions_idx)

        # 5. Summarize and Save Result CSV
        df["Predicted_Label"] = predicted_labels
        df["Confidence"] = np.round(confidences, 4)
        is_malicious_arr = [str(lbl).upper() != "BENIGN" for lbl in predicted_labels]
        df["Is_Malicious"] = is_malicious_arr

        result_csv_name = f"detection_results_{int(time.time())}.csv"
        result_csv_path = settings.DATA_DIR / "detection_results" / result_csv_name
        result_csv_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(result_csv_path, index=False)

        total_flows = len(df)
        malicious_count = int(sum(is_malicious_arr))
        normal_count = total_flows - malicious_count

        attack_dist = {}
        for lbl in predicted_labels:
            lbl_str = str(lbl)
            if lbl_str.upper() != "BENIGN":
                attack_dist[lbl_str] = attack_dist.get(lbl_str, 0) + 1

        duration = time.time() - start_time

        job = DetectionJob(
            job_name=job_name,
            model_id=model_id,
            filename=csv_file_path.name,
            file_path=str(csv_file_path),
            result_csv_path=str(result_csv_path),
            total_flows=total_flows,
            normal_count=normal_count,
            malicious_count=malicious_count,
            attack_distribution=json.dumps(attack_dist),
            status="COMPLETED",
            duration_seconds=round(duration, 2)
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        # Save sample/top records in DB (up to 500 for snappy UI pagination)
        records_to_insert = []
        limit_records = min(500, total_flows)
        for i in range(limit_records):
            records_to_insert.append(DetectionRecord(
                job_id=job.id,
                flow_id=f"flow-{i+1}",
                src_ip=str(src_ips[i]),
                dst_ip=str(dst_ips[i]),
                src_port=int(src_ports[i]),
                dst_port=int(dst_ports[i]),
                protocol=str(protocols[i]),
                predicted_label=str(predicted_labels[i]),
                confidence=float(round(confidences[i], 4)),
                is_malicious=bool(is_malicious_arr[i]),
                timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
            ))
        db.bulk_save_objects(records_to_insert)
        db.commit()

        return job

