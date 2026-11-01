from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import SecurityAlert
from app.models.schemas import AlertResponse, AlertStatusUpdate

router = APIRouter(prefix="/alerts", tags=["Security Alerts"])

@router.get("/", response_model=List[AlertResponse])
def get_alerts(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(SecurityAlert)
    if severity and severity.upper() != "ALL":
        query = query.filter(SecurityAlert.severity == severity.upper())
    if status and status.upper() != "ALL":
        query = query.filter(SecurityAlert.status == status.upper())
    if search:
        s = f"%{search}%"
        query = query.filter(
            (SecurityAlert.src_ip.like(s)) |
            (SecurityAlert.dst_ip.like(s)) |
            (SecurityAlert.attack_category.like(s)) |
            (SecurityAlert.model_name.like(s))
        )

    alerts = query.order_by(SecurityAlert.timestamp.desc()).limit(limit).all()
    return [AlertResponse.model_validate(a) for a in alerts]

@router.put("/{alert_id}/status", response_model=AlertResponse)
def update_alert_status(alert_id: int, status_in: AlertStatusUpdate, db: Session = Depends(get_db)):
    alert = db.query(SecurityAlert).filter(SecurityAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = status_in.status.upper()
    db.commit()
    db.refresh(alert)
    return AlertResponse.model_validate(alert)

@router.delete("/{alert_id}")
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(SecurityAlert).filter(SecurityAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted successfully"}

