import json
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import TrainedModel, ModelEvaluation
from app.models.schemas import ModelResponse, EvaluationResponse

router = APIRouter(prefix="/models", tags=["Models & Evaluation"])

@router.get("/", response_model=List[Dict[str, Any]])
def list_models(db: Session = Depends(get_db)):
    models = db.query(TrainedModel).order_by(TrainedModel.created_at.desc()).all()
    results = []
    for m in models:
        prep_config = json.loads(m.preprocessing.config or "{}") if m.preprocessing else {}
        results.append({
            "id": m.id,
            "name": m.name,
            "model_type": m.model_type,
            "problem_type": m.problem_type,
            "dataset_name": m.preprocessing.dataset.name if m.preprocessing and m.preprocessing.dataset else "N/A",
            "imbalance_method": prep_config.get("imbalance_method", "NONE"),
            "training_time_seconds": m.training_time_seconds,
            "val_accuracy": m.val_accuracy,
            "status": m.status,
            "hyperparameters": json.loads(m.hyperparameters or "{}"),
            "created_at": m.created_at
        })
    return results

@router.get("/comparison", response_model=List[Dict[str, Any]])
def get_model_comparison(db: Session = Depends(get_db)):
    models = db.query(TrainedModel).filter(TrainedModel.status == "TRAINED").all()
    comparison = []

    for m in models:
        eval_rec = m.evaluation
        prep_config = json.loads(m.preprocessing.config or "{}") if m.preprocessing else {}
        
        comparison.append({
            "model_id": m.id,
            "name": m.name,
            "model_type": m.model_type,
            "problem_type": m.problem_type,
            "dataset_name": m.preprocessing.dataset.name if m.preprocessing and m.preprocessing.dataset else "N/A",
            "imbalance_technique": prep_config.get("imbalance_method", "NONE"),
            "accuracy": eval_rec.accuracy if eval_rec else 0.0,
            "precision_macro": eval_rec.precision_macro if eval_rec else 0.0,
            "recall_macro": eval_rec.recall_macro if eval_rec else 0.0,
            "f1_macro": eval_rec.f1_macro if eval_rec else 0.0,
            "precision_weighted": eval_rec.precision_weighted if eval_rec else 0.0,
            "recall_weighted": eval_rec.recall_weighted if eval_rec else 0.0,
            "f1_weighted": eval_rec.f1_weighted if eval_rec else 0.0,
            "false_positive_rate": eval_rec.false_positive_rate if eval_rec else 0.0,
            "false_negative_rate": eval_rec.false_negative_rate if eval_rec else 0.0,
            "roc_auc": eval_rec.roc_auc if eval_rec else 0.0,
            "training_time_seconds": m.training_time_seconds,
            "inference_time_ms": eval_rec.inference_time_ms if eval_rec else 0.0,
        })

    # Sort by macro F1 descending so best balanced models appear first
    comparison.sort(key=lambda x: x["f1_macro"], reverse=True)
    return comparison

@router.get("/{model_id}", response_model=Dict[str, Any])
def get_model(model_id: int, db: Session = Depends(get_db)):
    m = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")

    return {
        "id": m.id,
        "name": m.name,
        "model_type": m.model_type,
        "problem_type": m.problem_type,
        "status": m.status,
        "training_time_seconds": m.training_time_seconds,
        "train_accuracy": m.train_accuracy,
        "val_accuracy": m.val_accuracy,
        "hyperparameters": json.loads(m.hyperparameters or "{}"),
        "training_history": json.loads(m.training_history or "[]"),
        "created_at": m.created_at
    }

@router.get("/{model_id}/evaluation", response_model=EvaluationResponse)
def get_model_evaluation(model_id: int, db: Session = Depends(get_db)):
    evaluation = db.query(ModelEvaluation).filter(ModelEvaluation.model_id == model_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation metrics not found for this model")

    return EvaluationResponse(
        id=evaluation.id,
        model_id=evaluation.model_id,
        accuracy=evaluation.accuracy,
        precision_macro=evaluation.precision_macro,
        recall_macro=evaluation.recall_macro,
        f1_macro=evaluation.f1_macro,
        precision_weighted=evaluation.precision_weighted,
        recall_weighted=evaluation.recall_weighted,
        f1_weighted=evaluation.f1_weighted,
        false_positive_rate=evaluation.false_positive_rate,
        false_negative_rate=evaluation.false_negative_rate,
        roc_auc=evaluation.roc_auc,
        inference_time_ms=evaluation.inference_time_ms,
        confusion_matrix=json.loads(evaluation.confusion_matrix or "[]"),
        classes=json.loads(evaluation.classes or "[]"),
        per_class_metrics=json.loads(evaluation.per_class_metrics or "{}"),
        created_at=evaluation.created_at
    )

@router.delete("/{model_id}")
def delete_model(model_id: int, db: Session = Depends(get_db)):
    m = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")

    if m.model_path and m.model_path != "pending":
        p = Path(m.model_path)
        if p.exists():
            try:
                p.unlink()
            except Exception:
                pass

    db.delete(m)
    db.commit()
    return {"message": "Model deleted successfully"}

