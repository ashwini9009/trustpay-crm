from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.models import User, Partner, Target, EmailLog
from utils.auth import require_admin, get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/admin-stats")
def admin_stats(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    total_partners = db.query(Partner).count()
    active_partners = db.query(Partner).filter(Partner.is_active == True).count()
    total_targets = db.query(Target).count()
    completed_targets = db.query(Target).filter(Target.is_completed == True).count()
    emails_sent = db.query(EmailLog).filter(EmailLog.success == True).count()

    # Top performers
    top_partners = []
    partners = db.query(Partner).limit(10).all()
    for p in partners:
        targets = p.targets
        if not targets:
            continue
        avg_pct = sum(
            min((t.achieved_value / t.target_value * 100), 100)
            for t in targets if t.target_value > 0
        ) / len(targets) if targets else 0
        top_partners.append({
            "partner_id": p.id,
            "name": p.user.name,
            "company": p.company_name,
            "completion_pct": round(avg_pct, 1),
            "targets_count": len(targets),
            "completed": sum(1 for t in targets if t.is_completed)
        })
    top_partners.sort(key=lambda x: x["completion_pct"], reverse=True)

    return {
        "total_partners": total_partners,
        "active_partners": active_partners,
        "total_targets": total_targets,
        "completed_targets": completed_targets,
        "emails_sent": emails_sent,
        "completion_rate": round((completed_targets / total_targets * 100) if total_targets > 0 else 0, 1),
        "top_performers": top_partners[:5]
    }

@router.get("/partner-stats")
def partner_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    partner = db.query(Partner).filter(Partner.user_id == current_user.id).first()
    if not partner:
        return {"message": "No partner profile found"}
    
    targets = partner.targets
    total = len(targets)
    completed = sum(1 for t in targets if t.is_completed)
    in_progress = total - completed

    target_details = []
    for t in targets:
        pct = min((t.achieved_value / t.target_value * 100), 100) if t.target_value > 0 else 0
        target_details.append({
            "id": t.id,
            "title": t.title,
            "target_value": t.target_value,
            "achieved_value": t.achieved_value,
            "percentage": round(pct, 1),
            "reward": t.reward,
            "is_completed": t.is_completed,
            "end_date": t.end_date
        })

    return {
        "partner_name": current_user.name,
        "company": partner.company_name,
        "total_targets": total,
        "completed_targets": completed,
        "in_progress": in_progress,
        "targets": target_details
    }
