import time
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
import xgboost as xgb

class MLService:
    @staticmethod
    def train_model(
        model_type: str,
        X_train: np.ndarray,
        y_train: np.ndarray,
        class_weights: Dict[int, float] = None,
        hyperparameters: Dict[str, Any] = None
    ) -> Tuple[Any, float]:
        start_time = time.time()
        hyperparameters = hyperparameters or {}
        model_type_upper = model_type.upper()

        clf = None
        if model_type_upper in ["RANDOM_FOREST", "RF"]:
            n_estimators = int(hyperparameters.get("n_estimators", 100))
            max_depth = int(hyperparameters["max_depth"]) if hyperparameters.get("max_depth") else None
            weights = "balanced" if class_weights else None
            clf = RandomForestClassifier(
                n_estimators=n_estimators,
                max_depth=max_depth,
                class_weight=weights,
                random_state=42,
                n_jobs=-1
            )
        elif model_type_upper in ["DECISION_TREE", "DT"]:
            max_depth = int(hyperparameters["max_depth"]) if hyperparameters.get("max_depth") else None
            weights = "balanced" if class_weights else None
            clf = DecisionTreeClassifier(
                max_depth=max_depth,
                class_weight=weights,
                random_state=42
            )
        elif model_type_upper in ["XGBOOST", "XGB"]:
            n_estimators = int(hyperparameters.get("n_estimators", 100))
            learning_rate = float(hyperparameters.get("learning_rate", 0.1))
            max_depth = int(hyperparameters.get("max_depth", 6))
            clf = xgb.XGBClassifier(
                n_estimators=n_estimators,
                learning_rate=learning_rate,
                max_depth=max_depth,
                random_state=42,
                n_jobs=-1,
                eval_metric="logloss"
            )
        elif model_type_upper in ["SVM", "SVC"]:
            kernel = str(hyperparameters.get("kernel", "rbf"))
            C = float(hyperparameters.get("C", 1.0))
            weights = "balanced" if class_weights else None
            # Limit samples for SVM training if dataset is huge for fast snappy convergence
            if len(X_train) > 10000:
                indices = np.random.RandomState(42).choice(len(X_train), 10000, replace=False)
                X_train_sub = X_train[indices]
                y_train_sub = y_train[indices]
            else:
                X_train_sub = X_train
                y_train_sub = y_train

            clf = SVC(
                C=C,
                kernel=kernel,
                probability=True,
                class_weight=weights,
                random_state=42
            )
            clf.fit(X_train_sub, y_train_sub)
            training_time = time.time() - start_time
            return clf, training_time
        else:
            raise ValueError(f"Unsupported ML model type: {model_type}")

        clf.fit(X_train, y_train)
        training_time = time.time() - start_time
        return clf, training_time

    @staticmethod
    def save_model(model: Any, save_path: Path):
        save_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, save_path)

    @staticmethod
    def load_model(save_path: Path) -> Any:
        return joblib.load(save_path)

