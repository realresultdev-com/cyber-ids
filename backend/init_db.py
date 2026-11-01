import os
import json
import time
import numpy as np
import pandas as pd
from pathlib import Path

from app.core.config import settings
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.db_models import (
    User, Dataset, PreprocessingPipeline, TrainedModel, ModelEvaluation,
    SecurityAlert, MonitoringSession, DetectionJob, DetectionRecord, SystemSetting
)
from app.services.dataset_service import DatasetService
from app.services.preprocessing_service import PreprocessingPipelineRunner
from app.services.ml_service import MLService
from app.services.dl_service import DLService
from app.services.evaluation_service import EvaluationService

def generate_benchmark_cicids_csv(file_path: Path, num_rows: int = 2500):
    np.random.seed(42)
    # 80% Benign, 20% attacks (heavily imbalanced)
    # Attacks: DoS Hulk (8%), DDoS (6%), PortScan (4%), SSH-Patator (1.5%), Botnet (0.5%)
    classes_weights = [
        ("BENIGN", 0.80),
        ("DoS Hulk", 0.08),
        ("DDoS", 0.06),
        ("PortScan", 0.04),
        ("SSH-Patator", 0.015),
        ("Bot", 0.005)
    ]
    labels = []
    classes = [c[0] for c in classes_weights]
    probs = [c[1] for c in classes_weights]
    labels = np.random.choice(classes, size=num_rows, p=probs)

    data = {
        "Destination Port": [],
        "Flow Duration": [],
        "Total Fwd Packets": [],
        "Total Backward Packets": [],
        "Total Length of Fwd Packets": [],
        "Total Length of Bwd Packets": [],
        "Fwd Packet Length Max": [],
        "Fwd Packet Length Min": [],
        "Fwd Packet Length Mean": [],
        "Fwd Packet Length Std": [],
        "Bwd Packet Length Max": [],
        "Bwd Packet Length Min": [],
        "Bwd Packet Length Mean": [],
        "Bwd Packet Length Std": [],
        "Flow Bytes/s": [],
        "Flow Packets/s": [],
        "Flow IAT Mean": [],
        "Flow IAT Std": [],
        "Flow IAT Max": [],
        "Flow IAT Min": [],
        "Fwd IAT Total": [],
        "Fwd IAT Mean": [],
        "FIN Flag Count": [],
        "SYN Flag Count": [],
        "RST Flag Count": [],
        "PSH Flag Count": [],
        "ACK Flag Count": [],
        "URG Flag Count": [],
        "Average Packet Size": [],
        "Subflow Fwd Packets": [],
        "Subflow Fwd Bytes": [],
        "Subflow Bwd Packets": [],
        "Subflow Bwd Bytes": [],
        "Init_Win_bytes_forward": [],
        "Init_Win_bytes_backward": [],
        "Label": labels
    }

    for lbl in labels:
        if lbl == "BENIGN":
            dst_port = np.random.choice([80, 443, 53, 8080, 21])
            flow_dur = np.random.exponential(scale=350000)
            fwd_pkts = np.random.poisson(lam=8) + 1
            bwd_pkts = np.random.poisson(lam=10) + 1
            syn_flag = 1 if np.random.rand() < 0.2 else 0
            rst_flag = 0
            psh_flag = 1 if np.random.rand() < 0.4 else 0
            ack_flag = 1
        elif lbl == "DoS Hulk":
            dst_port = 80
            flow_dur = np.random.uniform(50000, 200000)
            fwd_pkts = np.random.poisson(lam=25) + 5
            bwd_pkts = np.random.poisson(lam=2) + 1
            syn_flag = 1
            rst_flag = 1 if np.random.rand() < 0.3 else 0
            psh_flag = 1
            ack_flag = 1
        elif lbl == "DDoS":
            dst_port = 80
            flow_dur = np.random.uniform(10000, 80000)
            fwd_pkts = np.random.poisson(lam=45) + 10
            bwd_pkts = np.random.poisson(lam=1)
            syn_flag = 1
            rst_flag = 0
            psh_flag = 0
            ack_flag = 0
        elif lbl == "PortScan":
            dst_port = np.random.randint(20, 1024)
            flow_dur = np.random.uniform(100, 5000)
            fwd_pkts = 1
            bwd_pkts = 0 if np.random.rand() < 0.6 else 1
            syn_flag = 1
            rst_flag = 1 if bwd_pkts == 1 else 0
            psh_flag = 0
            ack_flag = 0
        elif lbl == "SSH-Patator":
            dst_port = 22
            flow_dur = np.random.uniform(100000, 800000)
            fwd_pkts = np.random.poisson(lam=18) + 3
            bwd_pkts = np.random.poisson(lam=16) + 3
            syn_flag = 1
            rst_flag = 0
            psh_flag = 1
            ack_flag = 1
        else:  # Bot
            dst_port = np.random.choice([8080, 6667, 4444])
            flow_dur = np.random.uniform(200000, 1200000)
            fwd_pkts = np.random.poisson(lam=12) + 2
            bwd_pkts = np.random.poisson(lam=8) + 1
            syn_flag = 1
            rst_flag = 0
            psh_flag = 1
            ack_flag = 1

        fwd_bytes = fwd_pkts * np.random.uniform(60, 400)
        bwd_bytes = bwd_pkts * np.random.uniform(60, 900)
        tot_bytes = fwd_bytes + bwd_bytes
        tot_pkts = fwd_pkts + bwd_pkts

        data["Destination Port"].append(dst_port)
        data["Flow Duration"].append(round(flow_dur, 2))
        data["Total Fwd Packets"].append(fwd_pkts)
        data["Total Backward Packets"].append(bwd_pkts)
        data["Total Length of Fwd Packets"].append(round(fwd_bytes, 2))
        data["Total Length of Bwd Packets"].append(round(bwd_bytes, 2))
        data["Fwd Packet Length Max"].append(round(fwd_bytes / fwd_pkts * 1.5, 2))
        data["Fwd Packet Length Min"].append(40.0)
        data["Fwd Packet Length Mean"].append(round(fwd_bytes / fwd_pkts, 2))
        data["Fwd Packet Length Std"].append(round(np.random.uniform(10, 50), 2))
        data["Bwd Packet Length Max"].append(round((bwd_bytes / max(1, bwd_pkts)) * 1.8, 2))
        data["Bwd Packet Length Min"].append(40.0 if bwd_pkts > 0 else 0.0)
        data["Bwd Packet Length Mean"].append(round(bwd_bytes / max(1, bwd_pkts), 2))
        data["Bwd Packet Length Std"].append(round(np.random.uniform(10, 60), 2))
        data["Flow Bytes/s"].append(round(tot_bytes / max(0.001, flow_dur / 1e6), 2))
        data["Flow Packets/s"].append(round(tot_pkts / max(0.001, flow_dur / 1e6), 2))
        data["Flow IAT Mean"].append(round(flow_dur / max(1, tot_pkts), 2))
        data["Flow IAT Std"].append(round(np.random.uniform(500, 20000), 2))
        data["Flow IAT Max"].append(round(flow_dur * 0.4, 2))
        data["Flow IAT Min"].append(10.0)
        data["Fwd IAT Total"].append(round(flow_dur * 0.9, 2))
        data["Fwd IAT Mean"].append(round(flow_dur / max(1, fwd_pkts), 2))
        data["FIN Flag Count"].append(1 if np.random.rand() < 0.2 else 0)
        data["SYN Flag Count"].append(syn_flag)
        data["RST Flag Count"].append(rst_flag)
        data["PSH Flag Count"].append(psh_flag)
        data["ACK Flag Count"].append(ack_flag)
        data["URG Flag Count"].append(0)
        data["Average Packet Size"].append(round(tot_bytes / max(1, tot_pkts), 2))
        data["Subflow Fwd Packets"].append(fwd_pkts)
        data["Subflow Fwd Bytes"].append(round(fwd_bytes, 2))
        data["Subflow Bwd Packets"].append(bwd_pkts)
        data["Subflow Bwd Bytes"].append(round(bwd_bytes, 2))
        data["Init_Win_bytes_forward"].append(8192 if syn_flag else 0)
        data["Init_Win_bytes_backward"].append(8192 if ack_flag else 0)

    df = pd.DataFrame(data)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(file_path, index=False)
    print(f"Generated benchmark dataset at {file_path} with {len(df)} rows.")

def init():
    print("Initializing Database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Create Default Users
    if not db.query(User).filter(User.username == "admin").first():
        admin = User(
            username="admin",
            email="admin@security.local",
            hashed_password=get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin)
        print("Created default admin user: admin / admin123")

    if not db.query(User).filter(User.username == "analyst").first():
        analyst = User(
            username="analyst",
            email="analyst@security.local",
            hashed_password=get_password_hash("analyst123"),
            role="analyst"
        )
        db.add(analyst)
        print("Created default analyst user: analyst / analyst123")

    db.commit()

    # 2. Check or create benchmark datasets
    sample_dataset_path = settings.DATA_DIR / "datasets" / "CICIDS2017_Imbalanced_Benchmark.csv"
    unseen_test_path = settings.DATA_DIR / "datasets" / "Unseen_Network_Traffic_Test.csv"

    if not sample_dataset_path.exists():
        generate_benchmark_cicids_csv(sample_dataset_path, num_rows=2500)
    if not unseen_test_path.exists():
        generate_benchmark_cicids_csv(unseen_test_path, num_rows=400)

    # Register Dataset in DB if not already registered
    dataset_rec = db.query(Dataset).filter(Dataset.name == "CICIDS2017 Benchmark (Imbalanced)").first()
    if not dataset_rec:
        dataset_rec = DatasetService.save_and_register_dataset(
            db=db,
            file_path=sample_dataset_path,
            name="CICIDS2017 Benchmark (Imbalanced)",
            original_filename="CICIDS2017_Imbalanced_Benchmark.csv"
        )
        print("Registered initial benchmark dataset.")

    # 3. Seed Research Preprocessing Pipelines (Baseline vs SMOTE vs Class Weights)
    prep_rec = db.query(PreprocessingPipeline).filter(PreprocessingPipeline.name == "CICIDS2017 SMOTE Pipeline").first()
    if not prep_rec and dataset_rec:
        print("Building research preprocessing pipeline with SMOTE...")
        output_dir = settings.DATA_DIR / "pipelines" / "prep_benchmark_smote"
        runner = PreprocessingPipelineRunner(
            dataset_path=str(sample_dataset_path),
            target_column="Label",
            problem_type="binary",
            missing_strategy="median",
            scaling_method="standard",
            imbalance_method="SMOTE",
            test_size=0.2,
            random_state=42
        )
        run_res = runner.run(output_dir)

        prep_rec = PreprocessingPipeline(
            dataset_id=dataset_rec.id,
            name="CICIDS2017 SMOTE Pipeline",
            config=json.dumps({"imbalance_method": "SMOTE", "scaling_method": "standard", "missing_strategy": "median", "test_size": 0.2}),
            feature_names=json.dumps(run_res["feature_names"]),
            target_column="Label",
            problem_type="binary",
            label_mapping=json.dumps(run_res["label_mapping"]),
            train_rows=run_res["train_rows"],
            test_rows=run_res["test_rows"],
            original_train_dist=json.dumps(run_res["original_train_dist"]),
            resampled_train_dist=json.dumps(run_res["resampled_train_dist"]),
            test_dist=json.dumps(run_res["test_dist"]),
            pipeline_path=run_res["pipeline_path"],
            train_data_path=run_res["train_data_path"],
            test_data_path=run_res["test_data_path"]
        )
        db.add(prep_rec)
        db.commit()
        db.refresh(prep_rec)
        print("Created SMOTE Preprocessing Pipeline.")

        # 4. Train Research Benchmark Models
        # Model 1: Random Forest + SMOTE
        print("Training Random Forest with SMOTE...")
        train_data = np.load(prep_rec.train_data_path, allow_pickle=True)
        test_data = np.load(prep_rec.test_data_path, allow_pickle=True)
        X_train, y_train = train_data["X_train"], train_data["y_train"]
        X_test, y_test = test_data["X_test"], test_data["y_test"]

        classes = ["BENIGN", "MALICIOUS"]

        rf_clf, rf_time = MLService.train_model("RANDOM_FOREST", X_train, y_train, hyperparameters={"n_estimators": 100, "max_depth": 12})
        rf_path = settings.MODELS_DIR / "rf_smote_model.joblib"
        MLService.save_model(rf_clf, rf_path)

        rf_eval = EvaluationService.evaluate_model(rf_clf, X_test, y_test, classes)
        
        m_rf = TrainedModel(
            preprocessing_id=prep_rec.id,
            name="Random Forest (SMOTE Balanced)",
            model_type="RANDOM_FOREST",
            problem_type="binary",
            hyperparameters=json.dumps({"n_estimators": 100, "max_depth": 12}),
            model_path=str(rf_path),
            training_time_seconds=round(rf_time, 2),
            val_accuracy=rf_eval["accuracy"],
            status="TRAINED"
        )
        db.add(m_rf)
        db.commit()
        db.refresh(m_rf)

        ev_rf = ModelEvaluation(
            model_id=m_rf.id,
            accuracy=rf_eval["accuracy"],
            precision_macro=rf_eval["precision_macro"],
            recall_macro=rf_eval["recall_macro"],
            f1_macro=rf_eval["f1_macro"],
            precision_weighted=rf_eval["precision_weighted"],
            recall_weighted=rf_eval["recall_weighted"],
            f1_weighted=rf_eval["f1_weighted"],
            false_positive_rate=rf_eval["false_positive_rate"],
            false_negative_rate=rf_eval["false_negative_rate"],
            roc_auc=rf_eval["roc_auc"],
            inference_time_ms=rf_eval["inference_time_ms"],
            confusion_matrix=json.dumps(rf_eval["confusion_matrix"]),
            classes=json.dumps(rf_eval["classes"]),
            per_class_metrics=json.dumps(rf_eval["per_class_metrics"])
        )
        db.add(ev_rf)

        # Model 2: XGBoost + SMOTE
        print("Training XGBoost with SMOTE...")
        xgb_clf, xgb_time = MLService.train_model("XGBOOST", X_train, y_train, hyperparameters={"n_estimators": 80, "learning_rate": 0.1, "max_depth": 6})
        xgb_path = settings.MODELS_DIR / "xgb_smote_model.joblib"
        MLService.save_model(xgb_clf, xgb_path)
        xgb_eval = EvaluationService.evaluate_model(xgb_clf, X_test, y_test, classes)

        m_xgb = TrainedModel(
            preprocessing_id=prep_rec.id,
            name="XGBoost Classifier (SMOTE Balanced)",
            model_type="XGBOOST",
            problem_type="binary",
            hyperparameters=json.dumps({"n_estimators": 80, "learning_rate": 0.1, "max_depth": 6}),
            model_path=str(xgb_path),
            training_time_seconds=round(xgb_time, 2),
            val_accuracy=xgb_eval["accuracy"],
            status="TRAINED"
        )
        db.add(m_xgb)
        db.commit()
        db.refresh(m_xgb)

        ev_xgb = ModelEvaluation(
            model_id=m_xgb.id,
            accuracy=xgb_eval["accuracy"],
            precision_macro=xgb_eval["precision_macro"],
            recall_macro=xgb_eval["recall_macro"],
            f1_macro=xgb_eval["f1_macro"],
            precision_weighted=xgb_eval["precision_weighted"],
            recall_weighted=xgb_eval["recall_weighted"],
            f1_weighted=xgb_eval["f1_weighted"],
            false_positive_rate=xgb_eval["false_positive_rate"],
            false_negative_rate=xgb_eval["false_negative_rate"],
            roc_auc=xgb_eval["roc_auc"],
            inference_time_ms=xgb_eval["inference_time_ms"],
            confusion_matrix=json.dumps(xgb_eval["confusion_matrix"]),
            classes=json.dumps(xgb_eval["classes"]),
            per_class_metrics=json.dumps(xgb_eval["per_class_metrics"])
        )
        db.add(ev_xgb)

        # Model 3: Deep Learning ANN (MLP)
        print("Training Deep Learning ANN...")
        ann_wrapper, ann_time, ann_hist = DLService.train_model(
            model_type="ANN",
            X_train=X_train,
            y_train=y_train,
            X_val=X_test,
            y_val=y_test,
            hyperparameters={"epochs": 10, "batch_size": 64, "learning_rate": 0.002}
        )
        ann_path = settings.MODELS_DIR / "ann_dl_model.pt"
        DLService.save_model(ann_wrapper, ann_path)
        ann_eval = EvaluationService.evaluate_model(ann_wrapper, X_test, y_test, classes)

        m_ann = TrainedModel(
            preprocessing_id=prep_rec.id,
            name="Deep Neural Network (ANN/MLP)",
            model_type="ANN",
            problem_type="binary",
            hyperparameters=json.dumps({"epochs": 10, "batch_size": 64, "learning_rate": 0.002}),
            training_history=json.dumps(ann_hist),
            model_path=str(ann_path),
            training_time_seconds=round(ann_time, 2),
            val_accuracy=ann_eval["accuracy"],
            status="TRAINED"
        )
        db.add(m_ann)
        db.commit()
        db.refresh(m_ann)

        ev_ann = ModelEvaluation(
            model_id=m_ann.id,
            accuracy=ann_eval["accuracy"],
            precision_macro=ann_eval["precision_macro"],
            recall_macro=ann_eval["recall_macro"],
            f1_macro=ann_eval["f1_macro"],
            precision_weighted=ann_eval["precision_weighted"],
            recall_weighted=ann_eval["recall_weighted"],
            f1_weighted=ann_eval["f1_weighted"],
            false_positive_rate=ann_eval["false_positive_rate"],
            false_negative_rate=ann_eval["false_negative_rate"],
            roc_auc=ann_eval["roc_auc"],
            inference_time_ms=ann_eval["inference_time_ms"],
            confusion_matrix=json.dumps(ann_eval["confusion_matrix"]),
            classes=json.dumps(ann_eval["classes"]),
            per_class_metrics=json.dumps(ann_eval["per_class_metrics"])
        )
        db.add(ev_ann)

        # 5. Seed initial Security Alerts
        alerts_sample = [
            SecurityAlert(
                src_ip="185.220.101.5",
                dst_ip="192.168.1.100",
                src_port=44321,
                dst_port=80,
                protocol="TCP",
                attack_category="DoS Hulk",
                severity="HIGH",
                confidence=0.982,
                model_name="XGBoost Classifier (SMOTE Balanced)",
                status="NEW"
            ),
            SecurityAlert(
                src_ip="198.51.100.42",
                dst_ip="192.168.1.100",
                src_port=52104,
                dst_port=22,
                protocol="TCP",
                attack_category="SSH-Patator",
                severity="MEDIUM",
                confidence=0.941,
                model_name="Random Forest (SMOTE Balanced)",
                status="INVESTIGATING"
            ),
            SecurityAlert(
                src_ip="103.251.167.20",
                dst_ip="192.168.1.100",
                src_port=61002,
                dst_port=8080,
                protocol="TCP",
                attack_category="DDoS",
                severity="CRITICAL",
                confidence=0.995,
                model_name="Deep Neural Network (ANN/MLP)",
                status="NEW"
            )
        ]
        db.bulk_save_objects(alerts_sample)

        # Initial monitoring session
        mon_sess = MonitoringSession(
            interface_name="Controlled Demonstration Mode (Safe / Offline)",
            model_id=m_rf.id,
            status="STOPPED",
            packets_captured=1420,
            flows_analyzed=185,
            alerts_generated=12
        )
        db.add(mon_sess)
        db.commit()
        print("Seeded baseline research models and sample security alerts successfully!")

    db.close()
    print("Database initialization complete.")

if __name__ == "__main__":
    init()

