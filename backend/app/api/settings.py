from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import SystemSetting

router = APIRouter(prefix="/settings", tags=["Settings"])

DEFAULT_SETTINGS = {
    "anomaly_threshold": "0.75",
    "alert_severity_threshold": "MEDIUM",
    "flow_timeout_seconds": "2.0",
    "enable_live_alerts": "true",
    "theme_mode": "dark",
    "demo_traffic_frequency": "1.0",
    "email_notifications": "false",
    "notification_email": "admin@security.local"
}

@router.get("/", response_model=Dict[str, str])
def get_settings(db: Session = Depends(get_db)):
    rows = db.query(SystemSetting).all()
    results = dict(DEFAULT_SETTINGS)
    for r in rows:
        results[r.key] = r.value
    return results

@router.post("/", response_model=Dict[str, str])
def update_settings(payload: Dict[str, str], db: Session = Depends(get_db)):
    for k, v in payload.items():
        rec = db.query(SystemSetting).filter(SystemSetting.key == k).first()
        if rec:
            rec.value = str(v)
        else:
            rec = SystemSetting(key=k, value=str(v))
            db.add(rec)
    db.commit()
    return get_settings(db)

