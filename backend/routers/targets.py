from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models.models import User, Partner, Target, UserRole
from schemas.schemas import TargetCreate, TargetUpdate, TargetOut
from utils.auth import require_admin, get_current_user
from services.email_service import send_email, progress_template, reward_template
from config import settings
import os, uuid, aiofiles

router = APIRouter(prefix="/api/targets", tags=["Targets"])

MOTIVATIONAL_QUOTES = [
    "Every step forward is progress — keep going! 🚀",
    "Success is the sum of small efforts repeated every day. You're doing it! 💪",
    "Your dedication is inspiring. TrustPay believes in you! ⭐",
    "Champions are made from something deep inside — a desire, a dream, a vision. Keep climbing! 🏆",
    "The harder you work, the luckier you get. You're almost there! 🌟",
    "Believe in yourself and your potential. Every number counts! 💯",
]

import random

@router.post("/", response_model=TargetOut)
def create_target(
    payload: TargetCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    partner = db.query(Partner).filter(Partner.id == payload.partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    target = Target(**payload.dict())
    db.add(target)
    db.commit()
    db.refresh(target)
    return target

@router.post("/with-image", response_model=TargetOut)
async def create_target_with_image(
    partner_id: int = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    target_type: Optional[str] = Form("loan_amount"),
    target_value: float = Form(...),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    reward: Optional[str] = Form(None),
    reward_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    image_path = None
    if reward_image and reward_image.filename:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = os.path.splitext(reward_image.filename)[-1]
        filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        async with aiofiles.open(file_path, "wb") as f:
            content = await reward_image.read()
            await f.write(content)
        image_path = file_path

    from datetime import datetime
    target = Target(
        partner_id=partner_id,
        title=title,
        description=description,
        target_type=target_type,
        target_value=target_value,
        start_date=datetime.fromisoformat(start_date) if start_date else None,
        end_date=datetime.fromisoformat(end_date) if end_date else None,
        reward=reward,
        reward_image=image_path
    )
    db.add(target)
    db.commit()
    db.refresh(target)
    return target

@router.get("/", response_model=List[TargetOut])
def get_all_targets(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    return db.query(Target).all()

@router.get("/partner/{partner_id}", response_model=List[TargetOut])
def get_partner_targets(
    partner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    if current_user.role == UserRole.partner and partner.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(Target).filter(Target.partner_id == partner_id).all()

@router.get("/me", response_model=List[TargetOut])
def my_targets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    partner = db.query(Partner).filter(Partner.user_id == current_user.id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    return db.query(Target).filter(Target.partner_id == partner.id).all()

@router.put("/{target_id}", response_model=TargetOut)
async def update_target(
    target_id: int,
    payload: TargetUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    old_achieved = target.achieved_value
    update_data = payload.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(target, key, value)

    # Check if newly completed
    new_achieved = target.achieved_value
    partner = target.partner
    user = partner.user

    if new_achieved > old_achieved:
        # Send progress email
        motivation = random.choice(MOTIVATIONAL_QUOTES)
        html = progress_template(user.name, target.title, new_achieved, target.target_value, motivation)
        background_tasks.add_task(
            send_email,
            to_email=user.email,
            subject=f"🚀 Progress Update: {target.title}",
            html_body=html,
            db=db,
            email_type="progress"
        )

    if target.achieved_value >= target.target_value and not target.is_completed:
        target.is_completed = True
        html = reward_template(user.name, target.title, target.reward or "Special Reward", bool(target.reward_image))
        background_tasks.add_task(
            send_email,
            to_email=user.email,
            subject=f"🏆 Congratulations! You've achieved: {target.title}",
            html_body=html,
            db=db,
            email_type="reward",
            image_path=target.reward_image
        )

    db.commit()
    db.refresh(target)
    return target

@router.delete("/{target_id}")
def delete_target(
    target_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    db.delete(target)
    db.commit()
    return {"message": "Target deleted"}
