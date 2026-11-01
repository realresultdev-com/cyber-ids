import json
import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List, Tuple
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.utils.class_weight import compute_class_weight
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from app.core.config import settings

class PreprocessingPipelineRunner:
    def __init__(
        self,
        dataset_path: str,
        target_column: str = "Label",
        problem_type: str = "binary",
        feature_selection: List[str] = None,
        missing_strategy: str = "median",
        scaling_method: str = "standard",
        imbalance_method: str = "SMOTE",
        test_size: float = 0.2,
        random_state: int = 42
    ):
        self.dataset_path = Path(dataset_path)
        self.target_column = target_column
        self.problem_type = problem_type
        self.feature_selection = feature_selection
        self.missing_strategy = missing_strategy
        self.scaling_method = scaling_method
        self.imbalance_method = imbalance_method.upper()
        self.test_size = test_size
        self.random_state = random_state

        self.label_encoder = LabelEncoder()
        self.imputer = None
        self.scaler = None
        self.feature_names = []
        self.label_mapping = {}

    def run(self, output_dir: Path) -> Dict[str, Any]:
        output_dir.mkdir(parents=True, exist_ok=True)

        # 1. Load dataset
        df = pd.read_csv(self.dataset_path)
        df.columns = df.columns.str.strip()

        # Find target column (case-insensitive)
        target_col = None
        for col in df.columns:
            if col.lower() == self.target_column.lower():
                target_col = col
                break
        if not target_col:
            raise ValueError(f"Target column '{self.target_column}' not found in dataset columns: {list(df.columns)}")

        # 2. Clean Target Labels
        df[target_col] = df[target_col].astype(str).str.strip()
        if self.problem_type == "binary":
            # Map benign variations to BENIGN, all others to MALICIOUS
            df[target_col] = df[target_col].apply(
                lambda x: "BENIGN" if x.lower() in ["benign", "normal", "0", "0.0"] else "MALICIOUS"
            )
        else:
            # Group or clean minor dirty strings in labels
            df[target_col] = df[target_col].apply(
                lambda x: "BENIGN" if x.lower() in ["benign", "normal", "0"] else x
            )

        # 3. Handle duplicates
        df = df.drop_duplicates()

        # 4. Feature Selection
        # Separate features and target
        y_raw = df[target_col].values
        X_df = df.drop(columns=[target_col])

        # Remove obvious non-generalizable identifiers if present (Timestamp, Flow ID, Source IP, Destination IP)
        leakage_cols = [
            "flow id", "source ip", "destination ip", "src ip", "dst ip", "timestamp",
            "date", "id", "unnamed: 0", "flow_id", "source_ip", "destination_ip"
        ]
        non_feat_cols = [c for c in X_df.columns if c.lower() in leakage_cols]
        X_df = X_df.drop(columns=non_feat_cols, errors="ignore")

        # Keep only numeric columns or encode categoricals
        numeric_cols = []
        for col in X_df.columns:
            if np.issubdtype(X_df[col].dtype, np.number):
                numeric_cols.append(col)
            else:
                # If low-cardinality categorical (like Protocol or State), label encode
                if X_df[col].nunique() < 50:
                    try:
                        le_cat = LabelEncoder()
                        X_df[col] = le_cat.fit_transform(X_df[col].astype(str))
                        numeric_cols.append(col)
                    except Exception:
                        pass

        if self.feature_selection and len(self.feature_selection) > 0:
            selected = [c for c in self.feature_selection if c in numeric_cols]
            if len(selected) > 0:
                numeric_cols = selected

        X_df = X_df[numeric_cols]
        self.feature_names = numeric_cols

        # Replace infinite values (inf, -inf) with NaN
        X_df = X_df.replace([np.inf, -np.inf], np.nan)

        # 5. Encode Target
        y_encoded = self.label_encoder.fit_transform(y_raw)
        self.label_mapping = {str(cls_): int(idx) for idx, cls_ in enumerate(self.label_encoder.classes_)}

        # 6. Stratified Train/Test Split (No data leakage!)
        X_train_df, X_test_df, y_train, y_test = train_test_split(
            X_df, y_encoded,
            test_size=self.test_size,
            random_state=self.random_state,
            stratify=y_encoded
        )

        # 7. Impute missing values (fit on train ONLY)
        strategy = self.missing_strategy if self.missing_strategy in ["median", "mean"] else "median"
        self.imputer = SimpleImputer(strategy=strategy)
        X_train_imp = self.imputer.fit_transform(X_train_df)
        X_test_imp = self.imputer.transform(X_test_df)

        # 8. Feature Scaling (fit on train ONLY)
        if self.scaling_method == "minmax":
            self.scaler = MinMaxScaler()
        elif self.scaling_method == "robust":
            self.scaler = RobustScaler()
        else:
            self.scaler = StandardScaler()

        X_train_scaled = self.scaler.fit_transform(X_train_imp)
        X_test_scaled = self.scaler.transform(X_test_imp)

        # Calculate original class distributions
        original_train_counts = pd.Series(y_train).value_counts().to_dict()
        original_train_dist = {
            self.label_encoder.classes_[k]: int(v) for k, v in original_train_counts.items()
        }
        test_counts = pd.Series(y_test).value_counts().to_dict()
        test_dist = {
            self.label_encoder.classes_[k]: int(v) for k, v in test_counts.items()
        }

        # 9. Imbalance Handling on Training Set ONLY
        X_train_final = X_train_scaled
        y_train_final = y_train
        class_weights_dict = None

        if self.imbalance_method == "SMOTE":
            # SMOTE requires at least 2 samples per minority class
            min_samples = pd.Series(y_train).value_counts().min()
            k_neighbors = min(5, max(1, min_samples - 1))
            if k_neighbors >= 1 and len(np.unique(y_train)) > 1:
                try:
                    smote = SMOTE(k_neighbors=k_neighbors, random_state=self.random_state)
                    X_train_final, y_train_final = smote.fit_resample(X_train_scaled, y_train)
                except Exception as e:
                    print(f"SMOTE fallback to original: {e}")
        elif self.imbalance_method == "RANDOM_UNDERSAMPLE":
            try:
                rus = RandomUnderSampler(random_state=self.random_state)
                X_train_final, y_train_final = rus.fit_resample(X_train_scaled, y_train)
            except Exception as e:
                print(f"RandomUnderSampler fallback: {e}")
        elif self.imbalance_method == "CLASS_WEIGHT":
            # Compute class weights for loss function / model weight parameter
            classes = np.unique(y_train)
            weights = compute_class_weight(class_weight="balanced", classes=classes, y=y_train)
            class_weights_dict = {int(c): float(w) for c, w in zip(classes, weights)}

        resampled_counts = pd.Series(y_train_final).value_counts().to_dict()
        resampled_train_dist = {
            self.label_encoder.classes_[k]: int(v) for k, v in resampled_counts.items()
        }

        # 10. Persist Preprocessing Pipeline & Transformed Datasets
        pipeline_obj = {
            "feature_names": self.feature_names,
            "target_column": self.target_column,
            "problem_type": self.problem_type,
            "label_encoder": self.label_encoder,
            "label_mapping": self.label_mapping,
            "imputer": self.imputer,
            "scaler": self.scaler,
            "imbalance_method": self.imbalance_method,
            "class_weights": class_weights_dict
        }
        pipeline_path = output_dir / "pipeline.joblib"
        joblib.dump(pipeline_obj, pipeline_path)

        train_data_path = output_dir / "train_data.npz"
        np.savez_compressed(
            train_data_path,
            X_train=X_train_final,
            y_train=y_train_final,
            class_weights=class_weights_dict or {}
        )

        test_data_path = output_dir / "test_data.npz"
        np.savez_compressed(
            test_data_path,
            X_test=X_test_scaled,
            y_test=y_test
        )

        return {
            "pipeline_path": str(pipeline_path),
            "train_data_path": str(train_data_path),
            "test_data_path": str(test_data_path),
            "feature_names": self.feature_names,
            "label_mapping": self.label_mapping,
            "train_rows": len(X_train_final),
            "test_rows": len(X_test_scaled),
            "original_train_dist": original_train_dist,
            "resampled_train_dist": resampled_train_dist,
            "test_dist": test_dist,
            "class_weights": class_weights_dict
        }

