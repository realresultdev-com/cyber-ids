import os
import shutil
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import DetectionJob, DetectionRecord, TrainedModel
from app.models.schemas import DetectionJobResponse
from app.services.detection_service import DetectionService
from app.core.config import settings

router = APIRouter(prefix="/detection", tags=["Intrusion Detection"])

@router.get("/jobs", response_model=List[Dict[str, Any]])
def list_detection_jobs(db: Session = Depends(get_db)):
    jobs = db.query(DetectionJob).order_by(DetectionJob.created_at.desc()).all()
    results = []
    for j in jobs:
        results.append({
            "id": j.id,
            "job_name": j.job_name,
            "model_id": j.model_id,
            "model_name": j.model.name if j.model else "Unknown",
            "filename": j.filename,
            "total_flows": j.total_flows,
            "normal_count": j.normal_count,
            "malicious_count": j.malicious_count,
            "attack_distribution": json.loads(j.attack_distribution or "{}"),
            "status": j.status,
            "duration_seconds": j.duration_seconds,
            "created_at": j.created_at
        })
    return results

@router.post("/run", response_model=DetectionJobResponse)
async def run_detection_job(
    file: UploadFile = File(...),
    model_id: int = Form(...),
    job_name: str = Form(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files can be analyzed.")

    model = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not model or model.status != "TRAINED":
        raise HTTPException(status_code=400, detail="Selected model is invalid or not yet trained.")

    save_path = settings.DATA_DIR / "detection_inputs" / f"{int(os.times()[4])}_{file.filename}"
    save_path.parent.mkdir(parents=True, exist_ok=True)
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        job = DetectionService.run_detection(
            db=db,
            model_id=model_id,
            csv_file_path=save_path,
            job_name=job_name
        )
        return DetectionJobResponse(
            id=job.id,
            job_name=job.job_name,
            model_id=job.model_id,
            filename=job.filename,
            total_flows=job.total_flows,
            normal_count=job.normal_count,
            malicious_count=job.malicious_count,
            attack_distribution=json.loads(job.attack_distribution or "{}"),
            status=job.status,
            duration_seconds=job.duration_seconds,
            created_at=job.created_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection execution failed: {str(e)}")

@router.get("/jobs/{job_id}", response_model=Dict[str, Any])
def get_job_details(
    job_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    malicious_only: bool = Query(False),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    job = db.query(DetectionJob).filter(DetectionJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Detection job not found")

    query = db.query(DetectionRecord).filter(DetectionRecord.job_id == job_id)
    if malicious_only:
        query = query.filter(DetectionRecord.is_malicious == True)
    if search:
        s = f"%{search}%"
        query = query.filter((DetectionRecord.src_ip.like(s)) | (DetectionRecord.dst_ip.like(s)) | (DetectionRecord.predicted_label.like(s)))

    total_records = query.count()
    records = query.offset((page - 1) * limit).limit(limit).all()

    record_items = []
    for r in records:
        record_items.append({
            "id": r.id,
            "flow_id": r.flow_id,
            "src_ip": r.src_ip,
            "dst_ip": r.dst_ip,
            "src_port": r.src_port,
            "dst_port": r.dst_port,
            "protocol": r.protocol,
            "predicted_label": r.predicted_label,
            "confidence": r.confidence,
            "is_malicious": r.is_malicious,
            "timestamp": r.timestamp
        })

    return {
        "job": {
            "id": job.id,
            "job_name": job.job_name,
            "model_name": job.model.name if job.model else "Unknown",
            "filename": job.filename,
            "total_flows": job.total_flows,
            "normal_count": job.normal_count,
            "malicious_count": job.malicious_count,
            "attack_distribution": json.loads(job.attack_distribution or "{}"),
            "duration_seconds": job.duration_seconds,
            "created_at": job.created_at
        },
        "total_records": total_records,
        "page": page,
        "limit": limit,
        "records": record_items
    }

@router.get("/jobs/{job_id}/download")
def download_detection_csv(job_id: int, db: Session = Depends(get_db)):
    job = db.query(DetectionJob).filter(DetectionJob.id == job_id).first()
    if not job or not job.result_csv_path:
        raise HTTPException(status_code=404, detail="Detection results file not available")

    csv_path = Path(job.result_csv_path)
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail="Result file not found on disk")

    return FileResponse(
        path=str(csv_path),
        filename=f"detection_results_{job.job_name.replace(' ', '_')}.csv",
        media_type="text/csv"
    )

