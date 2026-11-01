import os
import time
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import Report, TrainedModel, Dataset, DetectionJob, SecurityAlert
from app.services.report_service import ReportService
from app.core.config import settings

router = APIRouter(prefix="/reports", tags=["Reports"])

from app.models.schemas import BaseSchema

class ReportGenerateRequest(BaseSchema):
    title: str

    report_type: str  # MODEL_COMPARISON, DETECTION_AUDIT, SECURITY_SUMMARY
    format: str = "PDF"  # PDF or CSV
    model_id: Optional[int] = None
    dataset_id: Optional[int] = None

@router.get("/", response_model=List[Dict[str, Any]])
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    results = []
    for r in reports:
        results.append({
            "id": r.id,
            "title": r.title,
            "report_type": r.report_type,
            "model_id": r.model_id,
            "dataset_id": r.dataset_id,
            "format": r.format,
            "created_at": r.created_at
        })
    return results

@router.post("/generate", response_model=Dict[str, Any])
def generate_report(req: ReportGenerateRequest, db: Session = Depends(get_db)):
    timestamp_str = datetime_str = time.strftime("%Y%m%d_%H%M%S")
    file_ext = "pdf" if req.format.upper() == "PDF" else "csv"
    output_filename = f"ids_report_{req.report_type.lower()}_{timestamp_str}.{file_ext}"
    output_path = settings.REPORTS_DIR / output_filename

    summary_stats = {
        "Report Classification": "CONFIDENTIAL SECURITY RESEARCH",
        "Generated Timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "Report Type": req.report_type,
        "Format": req.format.upper()
    }

    eval_metrics = None
    cm_data = None
    classes = None

    if req.model_id:
        model = db.query(TrainedModel).filter(TrainedModel.id == req.model_id).first()
        if model:
            summary_stats["Trained Model"] = model.name
            summary_stats["Model Architecture"] = model.model_type
            summary_stats["Problem Type"] = model.problem_type
            summary_stats["Training Duration"] = f"{model.training_time_seconds:.2f} seconds"
            
            if model.preprocessing:
                prep = model.preprocessing
                p_config = json.loads(prep.config or "{}")
                summary_stats["Imbalance Strategy"] = p_config.get("imbalance_method", "NONE")
                summary_stats["Feature Count"] = len(json.loads(prep.feature_names or "[]"))
                summary_stats["Source Dataset"] = prep.dataset.name if prep.dataset else "N/A"

            if model.evaluation:
                ev = model.evaluation
                eval_metrics = {
                    "accuracy": ev.accuracy,
                    "precision_macro": ev.precision_macro,
                    "recall_macro": ev.recall_macro,
                    "f1_macro": ev.f1_macro,
                    "false_positive_rate": ev.false_positive_rate,
                    "false_negative_rate": ev.false_negative_rate,
                    "inference_time_ms": ev.inference_time_ms,
                }
                cm_data = json.loads(ev.confusion_matrix or "[]")
                classes = json.loads(ev.classes or "[]")

    if req.format.upper() == "PDF":
        ReportService.generate_pdf_report(
            output_path=output_path,
            title=req.title,
            report_type=req.report_type,
            summary_stats=summary_stats,
            eval_metrics=eval_metrics,
            cm_data=cm_data,
            classes=classes
        )
    else:
        # CSV Export
        headers = ["Section", "Parameter", "Value"]
        rows = []
        for k, v in summary_stats.items():
            rows.append(["Overview", k, v])
        if eval_metrics:
            for k, v in eval_metrics.items():
                rows.append(["Evaluation", k, v])
        ReportService.generate_csv_report(output_path, headers, rows)

    report_db = Report(
        title=req.title,
        report_type=req.report_type,
        model_id=req.model_id,
        dataset_id=req.dataset_id,
        file_path=str(output_path),
        format=req.format.upper()
    )
    db.add(report_db)
    db.commit()
    db.refresh(report_db)

    return {
        "id": report_db.id,
        "title": report_db.title,
        "report_type": report_db.report_type,
        "format": report_db.format,
        "file_name": output_filename,
        "created_at": report_db.created_at
    }

@router.get("/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    p = Path(report.file_path)
    if not p.exists():
        raise HTTPException(status_code=404, detail="Report file not found on disk")

    media_type = "application/pdf" if report.format == "PDF" else "text/csv"
    return FileResponse(path=str(p), filename=p.name, media_type=media_type)
