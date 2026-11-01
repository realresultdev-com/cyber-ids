import os
import json
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.models.db_models import Dataset
from app.core.config import settings

CICIDS2017_BENCHMARK_COLS = [
    "Destination Port", "Flow Duration", "Total Fwd Packets", "Total Backward Packets",
    "Total Length of Fwd Packets", "Total Length of Bwd Packets", "Fwd Packet Length Max",
    "Fwd Packet Length Min", "Fwd Packet Length Mean", "Fwd Packet Length Std",
    "Bwd Packet Length Max", "Bwd Packet Length Min", "Bwd Packet Length Mean", "Bwd Packet Length Std",
    "Flow Bytes/s", "Flow Packets/s", "Flow IAT Mean", "Flow IAT Std", "Flow IAT Max", "Flow IAT Min",
    "Fwd IAT Total", "Fwd IAT Mean", "Fwd IAT Std", "Fwd IAT Max", "Fwd IAT Min",
    "Bwd IAT Total", "Bwd IAT Mean", "Bwd IAT Std", "Bwd IAT Max", "Bwd IAT Min",
    "Fwd PSH Flags", "Bwd PSH Flags", "Fwd URG Flags", "Bwd URG Flags",
    "Fwd Header Length", "Bwd Header Length", "Fwd Packets/s", "Bwd Packets/s",
    "Min Packet Length", "Max Packet Length", "Packet Length Mean", "Packet Length Std",
    "Packet Length Variance", "FIN Flag Count", "SYN Flag Count", "RST Flag Count",
    "PSH Flag Count", "ACK Flag Count", "URG Flag Count", "CWE Flag Count", "ECE Flag Count",
    "Down/Up Ratio", "Average Packet Size", "Avg Fwd Segment Size", "Avg Bwd Segment Size",
    "Subflow Fwd Packets", "Subflow Fwd Bytes", "Subflow Bwd Packets", "Subflow Bwd Bytes",
    "Init_Win_bytes_forward", "Init_Win_bytes_backward", "act_data_pkt_fwd", "min_seg_size_forward",
    "Active Mean", "Active Std", "Active Max", "Active Min",
    "Idle Mean", "Idle Std", "Idle Max", "Idle Min", "Label"
]

class DatasetService:
    @staticmethod
    def detect_dataset_type(columns: List[str]) -> Tuple[str, str]:
        cols_lower = [c.strip().lower() for c in columns]
        
        # Check target column
        target = "Label"
        if "label" in cols_lower:
            target = columns[cols_lower.index("label")]
        elif "attack_cat" in cols_lower:
            target = columns[cols_lower.index("attack_cat")]
        elif "class" in cols_lower:
            target = columns[cols_lower.index("class")]
        elif "target" in cols_lower:
            target = columns[cols_lower.index("target")]

        # Match dataset types
        if any("flow duration" in c for c in cols_lower) and any("destination port" in c for c in cols_lower):
            return "CICIDS2017", target
        elif any("dst port" in c for c in cols_lower) and any("flow duration" in c for c in cols_lower):
            return "CSE-CIC-IDS2018", target
        elif any("dur" == c for c in cols_lower) and any("proto" == c for c in cols_lower):
            return "UNSW-NB15", target
        
        return "CUSTOM", target

    @classmethod
    def analyze_csv(cls, file_path: Path) -> Dict[str, Any]:
        # Read header and first chunk to determine size and structure safely
        df_sample = pd.read_csv(file_path, nrows=5000)
        # Strip whitespace from column names commonly found in CICIDS2017
        df_sample.columns = df_sample.columns.str.strip()

        # Count total rows
        total_rows = 0
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for _ in f:
                total_rows += 1
        total_rows = max(0, total_rows - 1)

        columns = list(df_sample.columns)
        dataset_type, detected_target = cls.detect_dataset_type(columns)

        # Analyze column metadata
        columns_meta = []
        for col in columns:
            dtype_str = str(df_sample[col].dtype)
            missing = int(df_sample[col].isnull().sum())
            unique_count = int(df_sample[col].nunique())
            columns_meta.append({
                "name": col,
                "dtype": dtype_str,
                "missing": missing,
                "unique": unique_count,
                "is_numeric": bool(np.issubdtype(df_sample[col].dtype, np.number))
            })

        missing_count = int(df_sample.isnull().sum().sum())
        duplicate_count = int(df_sample.duplicated().sum())

        # Target class distribution
        class_dist = {}
        if detected_target in df_sample.columns:
            val_counts = df_sample[detected_target].value_counts().to_dict()
            class_dist = {str(k).strip(): int(v) for k, v in val_counts.items()}
        
        sample_rows = df_sample.head(15).replace({np.nan: None, np.inf: None, -np.inf: None}).to_dict(orient="records")

        return {
            "row_count": total_rows,
            "column_count": len(columns),
            "dataset_type": dataset_type,
            "target_column": detected_target,
            "columns_meta": columns_meta,
            "missing_count": missing_count,
            "duplicate_count": duplicate_count,
            "class_distribution": class_dist,
            "sample_rows": sample_rows
        }

    @classmethod
    def save_and_register_dataset(cls, db: Session, file_path: Path, name: str, original_filename: str) -> Dataset:
        analysis = cls.analyze_csv(file_path)
        file_size = os.path.getsize(file_path)

        dataset = Dataset(
            name=name,
            original_filename=original_filename,
            file_path=str(file_path),
            file_size_bytes=file_size,
            row_count=analysis["row_count"],
            column_count=analysis["column_count"],
            dataset_type=analysis["dataset_type"],
            target_column=analysis["target_column"],
            columns_meta=json.dumps(analysis["columns_meta"]),
            missing_count=analysis["missing_count"],
            duplicate_count=analysis["duplicate_count"],
            class_distribution=json.dumps(analysis["class_distribution"]),
            status="READY"
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        return dataset

