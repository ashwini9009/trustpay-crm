from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.models import User, Partner, UserRole
from schemas.schemas import PartnerCreate, PartnerUpdate, PartnerOut, UserOut
from utils.auth import hash_password, require_admin, get_current_user
from services.email_service import send_email, onboarding_template

router = APIRouter(prefix="/api/partners", tags=["Partners"])

@router.post("/", response_model=PartnerOut)
async def create_partner(
    payload: PartnerCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.partner
    )
    db.add(user)
    db.flush()

    partner = Partner(
        user_id=user.id,
        company_name=payload.company_name,
        phone=payload.phone,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        business_type=payload.business_type,
        pan_number=payload.pan_number,
        gst_number=payload.gst_number,
        bank_account=payload.bank_account,
        ifsc_code=payload.ifsc_code,
        notes=payload.notes
    )
    db.add(partner)
    db.commit()
    db.refresh(partner)

    # Send onboarding email in background
    html = onboarding_template(payload.name, payload.email, payload.password, payload.company_name or "")
    background_tasks.add_task(
        send_email,
        to_email=payload.email,
        subject="Welcome to TrustPay Loans Partner Portal! 🎉",
        html_body=html,
        db=db,
        email_type="onboarding"
    )
    return partner

@router.get("/", response_model=List[PartnerOut])
def get_all_partners(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    return db.query(Partner).all()

@router.get("/{partner_id}", response_model=PartnerOut)
def get_partner(
    partner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    # Partners can only view their own profile
    if current_user.role == UserRole.partner and partner.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return partner

@router.put("/{partner_id}", response_model=PartnerOut)
def update_partner(
    partner_id: int,
    payload: PartnerUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    update_data = payload.dict(exclude_unset=True)
    if "name" in update_data:
        partner.user.name = update_data.pop("name")
    for key, value in update_data.items():
        setattr(partner, key, value)
    
    db.commit()
    db.refresh(partner)
    return partner

@router.delete("/{partner_id}")
def delete_partner(
    partner_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    user = partner.user
    db.delete(partner)
    db.delete(user)
    db.commit()
    return {"message": "Partner deleted successfully"}

@router.get("/me/profile", response_model=PartnerOut)
def my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    partner = db.query(Partner).filter(Partner.user_id == current_user.id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner profile not found")
    return partner
