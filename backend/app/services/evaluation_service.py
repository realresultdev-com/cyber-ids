import time
import numpy as np
from typing import Dict, Any, List, Tuple
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, classification_report
)

class EvaluationService:
    @staticmethod
    def evaluate_model(
        model: Any,
        X_test: np.ndarray,
        y_test: np.ndarray,
        classes: List[str]
    ) -> Dict[str, Any]:
        start_time = time.time()
        y_pred = model.predict(X_test)
        inference_time_total = time.time() - start_time
        inference_time_ms = (inference_time_total / max(1, len(X_test))) * 1000.0

        # Basic metrics
        acc = float(accuracy_score(y_test, y_pred))
        prec_macro = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
        rec_macro = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
        f1_macro = float(f1_score(y_test, y_pred, average="macro", zero_division=0))

        prec_weighted = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
        rec_weighted = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
        f1_weighted = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)
        cm_list = cm.tolist()

        # False positive & false negative rates
        # If binary:
        fpr, fnr = 0.0, 0.0
        if len(classes) == 2 and cm.shape == (2, 2):
            tn, fp, fn, tp = cm.ravel()
            fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
            fnr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0
        else:
            # Macro average across all classes (one-vs-rest)
            fprs, fnrs = [], []
            for i in range(len(classes)):
                tp = cm[i, i]
                fn = np.sum(cm[i, :]) - tp
                fp = np.sum(cm[:, i]) - tp
                tn = np.sum(cm) - (tp + fp + fn)
                fprs.append(float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0)
                fnrs.append(float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0)
            fpr = float(np.mean(fprs))
            fnr = float(np.mean(fnrs))

        # ROC-AUC calculation
        roc_auc = 0.0
        try:
            if hasattr(model, "predict_proba"):
                y_proba = model.predict_proba(X_test)
                if len(classes) == 2:
                    roc_auc = float(roc_auc_score(y_test, y_proba[:, 1]))
                else:
                    roc_auc = float(roc_auc_score(y_test, y_proba, multi_class="ovr", average="macro"))
        except Exception:
            roc_auc = 0.0

        # Detailed per-class classification report
        rep = classification_report(
            y_test,
            y_pred,
            target_names=[str(c) for c in classes],
            output_dict=True,
            zero_division=0
        )
        per_class_metrics = {}
        for c in classes:
            c_str = str(c)
            if c_str in rep:
                per_class_metrics[c_str] = {
                    "precision": round(rep[c_str]["precision"], 4),
                    "recall": round(rep[c_str]["recall"], 4),
                    "f1": round(rep[c_str]["f1-score"], 4),
                    "support": int(rep[c_str]["support"])
                }

        return {
            "accuracy": round(acc, 4),
            "precision_macro": round(prec_macro, 4),
            "recall_macro": round(rec_macro, 4),
            "f1_macro": round(f1_macro, 4),
            "precision_weighted": round(prec_weighted, 4),
            "recall_weighted": round(rec_weighted, 4),
            "f1_weighted": round(f1_weighted, 4),
            "false_positive_rate": round(fpr, 4),
            "false_negative_rate": round(fnr, 4),
            "roc_auc": round(roc_auc, 4),
            "inference_time_ms": round(inference_time_ms, 3),
            "confusion_matrix": cm_list,
            "classes": [str(c) for c in classes],
            "per_class_metrics": per_class_metrics
        }

