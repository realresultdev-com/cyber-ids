import os
import time
import json
import threading
import numpy as np
from pathlib import Path
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db, SessionLocal
from app.models.db_models import PreprocessingPipeline, TrainedModel, ModelEvaluation
from app.models.schemas import ModelTrainRequest, ModelResponse
from app.services.ml_service import MLService
from app.services.dl_service import DLService
from app.services.evaluation_service import EvaluationService
from app.core.config import settings

router = APIRouter(prefix="/training", tags=["Model Training"])

def background_train_task(model_id: int):
    db = SessionLocal()
    try:
        model_rec = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
        if not model_rec:
            return

        pipeline_rec = model_rec.preprocessing
        train_data = np.load(pipeline_rec.train_data_path, allow_pickle=True)
        test_data = np.load(pipeline_rec.test_data_path, allow_pickle=True)

        X_train = train_data["X_train"]
        y_train = train_data["y_train"]
        class_weights = train_data["class_weights"].item() if "class_weights" in train_data else None

        X_test = test_data["X_test"]
        y_test = test_data["y_test"]

        hyperparameters = json.loads(model_rec.hyperparameters or "{}")
        model_type = model_rec.model_type.upper()

        model_save_path = settings.MODELS_DIR / f"{model_rec.id}_{model_type.lower()}.joblib"

        if model_type in ["ANN", "LSTM"]:
            model_save_path = settings.MODELS_DIR / f"{model_rec.id}_{model_type.lower()}.pt"
            wrapper, duration, history = DLService.train_model(
                model_type=model_type,
                X_train=X_train,
                y_train=y_train,
                X_val=X_test,
                y_val=y_test,
                class_weights=class_weights,
                hyperparameters=hyperparameters
            )
            DLService.save_model(wrapper, model_save_path)
            model_rec.training_history = json.dumps(history)
            trained_model_obj = wrapper
        else:
            clf, duration = MLService.train_model(
                model_type=model_type,
                X_train=X_train,
                y_train=y_train,
                class_weights=class_weights,
                hyperparameters=hyperparameters
            )
            MLService.save_model(clf, model_save_path)
            trained_model_obj = clf

        # Evaluate model on test set
        label_mapping = json.loads(pipeline_rec.label_mapping or "{}")
        classes = sorted(label_mapping.keys(), key=lambda k: label_mapping[k])

        eval_results = EvaluationService.evaluate_model(
            model=trained_model_obj,
            X_test=X_test,
            y_test=y_test,
            classes=classes
        )

        model_rec.model_path = str(model_save_path)
        model_rec.training_time_seconds = round(duration, 2)
        model_rec.val_accuracy = eval_results["accuracy"]
        model_rec.status = "TRAINED"

        # Create evaluation record
        evaluation = ModelEvaluation(
            model_id=model_rec.id,
            accuracy=eval_results["accuracy"],
            precision_macro=eval_results["precision_macro"],
            recall_macro=eval_results["recall_macro"],
            f1_macro=eval_results["f1_macro"],
            precision_weighted=eval_results["precision_weighted"],
            recall_weighted=eval_results["recall_weighted"],
            f1_weighted=eval_results["f1_weighted"],
            false_positive_rate=eval_results["false_positive_rate"],
            false_negative_rate=eval_results["false_negative_rate"],
            roc_auc=eval_results["roc_auc"],
            inference_time_ms=eval_results["inference_time_ms"],
            confusion_matrix=json.dumps(eval_results["confusion_matrix"]),
            classes=json.dumps(eval_results["classes"]),
            per_class_metrics=json.dumps(eval_results["per_class_metrics"])
        )
        db.add(evaluation)
        db.commit()

    except Exception as e:
        if model_rec:
            model_rec.status = "FAILED"
            model_rec.error_message = str(e)
            db.commit()
    finally:
        db.close()

@router.post("/train", response_model=ModelResponse)
def train_model(
    req: ModelTrainRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    pipeline = db.query(PreprocessingPipeline).filter(PreprocessingPipeline.id == req.preprocessing_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Preprocessing pipeline not found")

    model_rec = TrainedModel(
        preprocessing_id=pipeline.id,
        name=req.name,
        model_type=req.model_type.upper(),
        problem_type=pipeline.problem_type,
        hyperparameters=json.dumps(req.hyperparameters or {}),
        model_path="pending",
        status="TRAINING"
    )
    db.add(model_rec)
    db.commit()
    db.refresh(model_rec)

    # Launch non-blocking background training
    background_tasks.add_task(background_train_task, model_rec.id)

    return ModelResponse(
        id=model_rec.id,
        preprocessing_id=model_rec.preprocessing_id,
        name=model_rec.name,
        model_type=model_rec.model_type,
        problem_type=model_rec.problem_type,
        hyperparameters=req.hyperparameters or {},
        training_time_seconds=0.0,
        train_accuracy=0.0,
        val_accuracy=0.0,
        status="TRAINING",
        error_message=None,
        created_at=model_rec.created_at
    )

@router.get("/status/{model_id}", response_model=Dict[str, Any])
def get_training_status(model_id: int, db: Session = Depends(get_db)):
    model_rec = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not model_rec:
        raise HTTPException(status_code=404, detail="Model not found")

    return {
        "id": model_rec.id,
        "name": model_rec.name,
        "status": model_rec.status,
        "training_time_seconds": model_rec.training_time_seconds,
        "val_accuracy": model_rec.val_accuracy,
        "history": json.loads(model_rec.training_history or "[]"),
        "error_message": model_rec.error_message
    }

