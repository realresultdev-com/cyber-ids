from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import MonitoringSession
from app.models.schemas import MonitoringStartRequest, MonitoringSessionResponse
from app.services.monitoring_service import MonitoringManager

router = APIRouter(prefix="/monitoring", tags=["Real-Time Monitoring"])

@router.get("/interfaces", response_model=List[Dict[str, Any]])
def get_interfaces():
    return MonitoringManager.get_available_interfaces()

@router.post("/start", response_model=MonitoringSessionResponse)
def start_monitoring_session(req: MonitoringStartRequest, db: Session = Depends(get_db)):
    mgr = MonitoringManager.get_instance()
    if mgr.is_running:
        raise HTTPException(status_code=400, detail="Monitoring session already running. Stop the current session first.")

    session = MonitoringSession(
        interface_name=req.interface_name,
        model_id=req.model_id,
        status="RUNNING"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    try:
        mgr.start_monitoring(
            session_id=session.id,
            interface_name=req.interface_name,
            model_id=req.model_id,
            demo_mode=req.demo_mode
        )
    except Exception as e:
        session.status = "STOPPED"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to start monitoring agent: {str(e)}")

    return MonitoringSessionResponse.model_validate(session)

@router.post("/stop")
def stop_monitoring_session(db: Session = Depends(get_db)):
    mgr = MonitoringManager.get_instance()
    if not mgr.is_running:
        return {"message": "No active monitoring session to stop."}

    session_id = mgr.active_session_id
    mgr.stop_monitoring()

    session = db.query(MonitoringSession).filter(MonitoringSession.id == session_id).first() if session_id else None
    return {
        "message": "Monitoring stopped successfully.",
        "session_id": session_id,
        "packets_captured": session.packets_captured if session else 0,
        "flows_analyzed": session.flows_analyzed if session else 0,
        "alerts_generated": session.alerts_generated if session else 0
    }

@router.get("/live", response_model=Dict[str, Any])
def get_live_monitoring_data(db: Session = Depends(get_db)):
    mgr = MonitoringManager.get_instance()
    status_data = mgr.get_live_status()

    session_stats = {"packets_captured": 0, "flows_analyzed": 0, "alerts_generated": 0}
    if status_data["session_id"]:
        sess = db.query(MonitoringSession).filter(MonitoringSession.id == status_data["session_id"]).first()
        if sess:
            session_stats = {
                "packets_captured": sess.packets_captured,
                "flows_analyzed": sess.flows_analyzed,
                "alerts_generated": sess.alerts_generated
            }

    return {
        **status_data,
        **session_stats
    }

@router.get("/sessions", response_model=List[MonitoringSessionResponse])
def get_monitoring_sessions(db: Session = Depends(get_db)):
    sessions = db.query(MonitoringSession).order_by(MonitoringSession.start_time.desc()).limit(20).all()
    return [MonitoringSessionResponse.model_validate(s) for s in sessions]

