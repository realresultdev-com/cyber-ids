import os
import shutil
import json
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import Dataset
from app.models.schemas import DatasetPreviewResponse
from app.services.dataset_service import DatasetService
from app.core.config import settings

router = APIRouter(prefix="/datasets", tags=["Dataset Management"])

@router.get("/", response_model=List[Dict[str, Any]])
def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).all()
    results = []
    for d in datasets:
        results.append({
            "id": d.id,
            "name": d.name,
            "original_filename": d.original_filename,
            "file_size_bytes": d.file_size_bytes,
            "row_count": d.row_count,
            "column_count": d.column_count,
            "dataset_type": d.dataset_type,
            "target_column": d.target_column,
            "missing_count": d.missing_count,
            "duplicate_count": d.duplicate_count,
            "class_distribution": json.loads(d.class_distribution or "{}"),
            "status": d.status,
            "created_at": d.created_at
        })
    return results

@router.post("/upload", response_model=DatasetPreviewResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV dataset files are supported.")

    file_save_path = settings.UPLOAD_DIR / f"{int(os.times()[4])}_{file.filename}"
    with open(file_save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        dataset = DatasetService.save_and_register_dataset(
            db=db,
            file_path=file_save_path,
            name=name,
            original_filename=file.filename
        )
        analysis = DatasetService.analyze_csv(file_save_path)
        
        return DatasetPreviewResponse(
            id=dataset.id,
            name=dataset.name,
            original_filename=dataset.original_filename,
            file_size_bytes=dataset.file_size_bytes,
            row_count=dataset.row_count,
            column_count=dataset.column_count,
            dataset_type=dataset.dataset_type,
            target_column=dataset.target_column,
            columns_meta=analysis["columns_meta"],
            missing_count=dataset.missing_count,
            duplicate_count=dataset.duplicate_count,
            class_distribution=analysis["class_distribution"],
            sample_rows=analysis["sample_rows"],
            created_at=dataset.created_at
        )
    except Exception as e:
        if file_save_path.exists():
            file_save_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to process CSV dataset: {str(e)}")

@router.get("/{dataset_id}", response_model=DatasetPreviewResponse)
def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    file_path = Path(dataset.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Underlying dataset file is missing")

    analysis = DatasetService.analyze_csv(file_path)

    return DatasetPreviewResponse(
        id=dataset.id,
        name=dataset.name,
        original_filename=dataset.original_filename,
        file_size_bytes=dataset.file_size_bytes,
        row_count=dataset.row_count,
        column_count=dataset.column_count,
        dataset_type=dataset.dataset_type,
        target_column=dataset.target_column,
        columns_meta=analysis["columns_meta"],
        missing_count=dataset.missing_count,
        duplicate_count=dataset.duplicate_count,
        class_distribution=analysis["class_distribution"],
        sample_rows=analysis["sample_rows"],
        created_at=dataset.created_at
    )

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    file_path = Path(dataset.file_path)
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception:
            pass

    db.delete(dataset)
    db.commit()
    return {"message": "Dataset successfully deleted"}

