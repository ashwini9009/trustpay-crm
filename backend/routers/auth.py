from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.models import User, UserRole
from schemas.schemas import UserCreate, UserLogin, Token, UserOut
from utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    token = create_access_token({"sub": str(user.id)})  # ✅ Fix: convert to string
    return {"access_token": token, "token_type": "bearer", "role": user.role.value, "user_id": user.id, "name": user.name}

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/create-admin", response_model=UserOut)
def create_admin(payload: UserCreate, db: Session = Depends(get_db)):
    """Used to create the first admin — protect this route in production!"""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.admin
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user