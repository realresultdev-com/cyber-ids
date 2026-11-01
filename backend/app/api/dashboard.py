import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.db_models import DetectionJob, DetectionRecord, SecurityAlert, ModelEvaluation, MonitoringSession
from app.models.schemas import DashboardStatsResponse, AlertResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    # Calculate total flows from actual detection jobs & monitoring sessions
    detection_flows = db.query(func.sum(DetectionJob.total_flows)).scalar() or 0
    monitored_flows = db.query(func.sum(MonitoringSession.flows_analyzed)).scalar() or 0
    total_flows = int(detection_flows + monitored_flows)

    det_normal = db.query(func.sum(DetectionJob.normal_count)).scalar() or 0
    det_malicious = db.query(func.sum(DetectionJob.malicious_count)).scalar() or 0
    
    alert_attacks = db.query(func.count(SecurityAlert.id)).scalar() or 0
    total_malicious = int(det_malicious + alert_attacks)
    total_normal = max(0, total_flows - total_malicious)

    # Average metrics from evaluations
    eval_avg = db.query(
        func.avg(ModelEvaluation.accuracy),
        func.avg(ModelEvaluation.precision_macro),
        func.avg(ModelEvaluation.recall_macro),
        func.avg(ModelEvaluation.f1_macro)
    ).first()

    avg_acc = float(round(eval_avg[0], 4)) if eval_avg and eval_avg[0] is not None else 0.0
    avg_prec = float(round(eval_avg[1], 4)) if eval_avg and eval_avg[1] is not None else 0.0
    avg_rec = float(round(eval_avg[2], 4)) if eval_avg and eval_avg[2] is not None else 0.0
    avg_f1 = float(round(eval_avg[3], 4)) if eval_avg and eval_avg[3] is not None else 0.0

    # Recent Alerts from database
    alerts = db.query(SecurityAlert).order_by(SecurityAlert.timestamp.desc()).limit(8).all()
    recent_alerts = [AlertResponse.model_validate(a) for a in alerts]

    # Traffic distribution
    traffic_distribution = {
        "Normal Traffic": total_normal,
        "Malicious Traffic": total_malicious
    }

    # Attack Category Distribution from database alerts & detection jobs
    attack_category_dist = {}
    db_alerts_cats = db.query(SecurityAlert.attack_category, func.count(SecurityAlert.id)).group_by(SecurityAlert.attack_category).all()
    for cat, count in db_alerts_cats:
        if cat and str(cat).upper() != "BENIGN":
            attack_category_dist[str(cat)] = attack_category_dist.get(str(cat), 0) + int(count)

    jobs = db.query(DetectionJob).all()
    for j in jobs:
        try:
            job_dist = json.loads(j.attack_distribution or "{}")
            for cat, count in job_dist.items():
                if cat and str(cat).upper() != "BENIGN":
                    attack_category_dist[str(cat)] = attack_category_dist.get(str(cat), 0) + int(count)
        except Exception:
            pass

    # Timeline activity (last 7 days or monitoring activity)
    now = datetime.utcnow()
    timeline = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_str = day.strftime("%b %d")
        start_day = datetime(day.year, day.month, day.day)
        end_day = start_day + timedelta(days=1)

        day_alerts = db.query(func.count(SecurityAlert.id)).filter(
            SecurityAlert.timestamp >= start_day,
            SecurityAlert.timestamp < end_day
        ).scalar() or 0

        timeline.append({
            "date": day_str,
            "threats": int(day_alerts),
            "normal_flows": max(0, int(total_flows // 7))
        })

    return DashboardStatsResponse(
        total_flows_analyzed=total_flows,
        normal_traffic_count=total_normal,
        malicious_traffic_count=total_malicious,
        total_detected_attacks=total_malicious,
        detection_accuracy=avg_acc,
        precision_macro=avg_prec,
        recall_macro=avg_rec,
        f1_macro=avg_f1,
        recent_alerts=recent_alerts,
        traffic_distribution=traffic_distribution,
        attack_category_distribution=attack_category_dist,
        timeline_activity=timeline
    )

