from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models.models import UserRole

# ─── Auth ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[UserRole] = UserRole.partner

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    name: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# ─── Partner ─────────────────────────────────────────────────────────────────

class PartnerCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    company_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    business_type: Optional[str] = None
    pan_number: Optional[str] = None
    gst_number: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = None
    notes: Optional[str] = None

class PartnerUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    business_type: Optional[str] = None
    pan_number: Optional[str] = None
    gst_number: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class PartnerOut(BaseModel):
    id: int
    user_id: int
    company_name: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    business_type: Optional[str]
    pan_number: Optional[str]
    gst_number: Optional[str]
    bank_account: Optional[str]
    ifsc_code: Optional[str]
    joining_date: Optional[datetime]
    is_active: bool
    notes: Optional[str]
    created_at: datetime
    user: Optional[UserOut]
    class Config:
        from_attributes = True

# ─── Target ──────────────────────────────────────────────────────────────────

class TargetCreate(BaseModel):
    partner_id: int
    title: str
    description: Optional[str] = None
    target_type: Optional[str] = "loan_amount"
    target_value: float
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    reward: Optional[str] = None

class TargetUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_value: Optional[float] = None
    achieved_value: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    reward: Optional[str] = None
    is_completed: Optional[bool] = None

class TargetOut(BaseModel):
    id: int
    partner_id: int
    title: str
    description: Optional[str]
    target_type: Optional[str]
    target_value: float
    achieved_value: float
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    reward: Optional[str]
    reward_image: Optional[str]
    is_completed: bool
    created_at: datetime
    updated_at: Optional[datetime]
    class Config:
        from_attributes = True

# ─── Chat ────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    timestamp: datetime
