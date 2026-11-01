import os
import json
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import Dataset, PreprocessingPipeline
from app.models.schemas import PreprocessingCreate, PreprocessingResponse
from app.services.preprocessing_service import PreprocessingPipelineRunner
from app.core.config import settings

router = APIRouter(prefix="/preprocessing", tags=["Data Preprocessing"])

@router.get("/", response_model=List[Dict[str, Any]])
def list_preprocessing_pipelines(db: Session = Depends(get_db)):
    pipelines = db.query(PreprocessingPipeline).order_by(PreprocessingPipeline.created_at.desc()).all()
    results = []
    for p in pipelines:
        results.append({
            "id": p.id,
            "dataset_id": p.dataset_id,
            "dataset_name": p.dataset.name if p.dataset else "Unknown",
            "name": p.name,
            "problem_type": p.problem_type,
            "target_column": p.target_column,
            "feature_count": len(json.loads(p.feature_names or "[]")),
            "feature_names": json.loads(p.feature_names or "[]"),
            "train_rows": p.train_rows,
            "test_rows": p.test_rows,
            "original_train_dist": json.loads(p.original_train_dist or "{}"),
            "resampled_train_dist": json.loads(p.resampled_train_dist or "{}"),
            "test_dist": json.loads(p.test_dist or "{}"),
            "config": json.loads(p.config or "{}"),
            "created_at": p.created_at
        })
    return results

@router.post("/run", response_model=PreprocessingResponse)
def run_preprocessing(prep_in: PreprocessingCreate, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == prep_in.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    file_path = Path(dataset.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Dataset file missing on disk")

    output_dir = settings.DATA_DIR / "pipelines" / f"prep_{int(os.times()[4])}"
    
    try:
        runner = PreprocessingPipelineRunner(
            dataset_path=str(file_path),
            target_column=prep_in.target_column,
            problem_type=prep_in.problem_type,
            feature_selection=prep_in.feature_selection,
            missing_strategy=prep_in.missing_strategy,
            scaling_method=prep_in.scaling_method,
            imbalance_method=prep_in.imbalance_method,
            test_size=prep_in.test_size,
            random_state=prep_in.random_state
        )
        run_res = runner.run(output_dir)

        config_dict = {
            "missing_strategy": prep_in.missing_strategy,
            "scaling_method": prep_in.scaling_method,
            "imbalance_method": prep_in.imbalance_method,
            "test_size": prep_in.test_size,
            "random_state": prep_in.random_state
        }

        pipeline_db = PreprocessingPipeline(
            dataset_id=dataset.id,
            name=prep_in.name,
            config=json.dumps(config_dict),
            feature_names=json.dumps(run_res["feature_names"]),
            target_column=prep_in.target_column,
            problem_type=prep_in.problem_type,
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
        db.add(pipeline_db)
        db.commit()
        db.refresh(pipeline_db)

        return PreprocessingResponse(
            id=pipeline_db.id,
            dataset_id=pipeline_db.dataset_id,
            name=pipeline_db.name,
            problem_type=pipeline_db.problem_type,
            target_column=pipeline_db.target_column,
            feature_names=run_res["feature_names"],
            train_rows=pipeline_db.train_rows,
            test_rows=pipeline_db.test_rows,
            original_train_dist=run_res["original_train_dist"],
            resampled_train_dist=run_res["resampled_train_dist"],
            test_dist=run_res["test_dist"],
            created_at=pipeline_db.created_at
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {str(e)}")

@router.get("/{pipeline_id}", response_model=Dict[str, Any])
def get_preprocessing(pipeline_id: int, db: Session = Depends(get_db)):
    pipeline = db.query(PreprocessingPipeline).filter(PreprocessingPipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Preprocessing pipeline not found")

    return {
        "id": pipeline.id,
        "dataset_id": pipeline.dataset_id,
        "dataset_name": pipeline.dataset.name if pipeline.dataset else "Unknown",
        "name": pipeline.name,
        "problem_type": pipeline.problem_type,
        "target_column": pipeline.target_column,
        "feature_names": json.loads(pipeline.feature_names or "[]"),
        "train_rows": pipeline.train_rows,
        "test_rows": pipeline.test_rows,
        "original_train_dist": json.loads(pipeline.original_train_dist or "{}"),
        "resampled_train_dist": json.loads(pipeline.resampled_train_dist or "{}"),
        "test_dist": json.loads(pipeline.test_dist or "{}"),
        "config": json.loads(pipeline.config or "{}"),
        "created_at": pipeline.created_at
    }

