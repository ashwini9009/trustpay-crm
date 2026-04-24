from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    partner = "partner"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.partner)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    partner = relationship("Partner", back_populates="user", uselist=False)

class Partner(Base):
    __tablename__ = "partners"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    company_name = Column(String(200))
    phone = Column(String(20))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    business_type = Column(String(100))
    pan_number = Column(String(20))
    gst_number = Column(String(20))
    bank_account = Column(String(50))
    ifsc_code = Column(String(20))
    joining_date = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="partner")
    targets = relationship("Target", back_populates="partner", cascade="all, delete-orphan")

class Target(Base):
    __tablename__ = "targets"
    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    target_type = Column(String(50))  # loans_count, loan_amount, revenue
    target_value = Column(Float, nullable=False)
    achieved_value = Column(Float, default=0.0)
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    reward = Column(String(500))  # e.g. "Phuket Trip"
    reward_image = Column(String(500))  # uploaded image path
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    partner = relationship("Partner", back_populates="targets")

class EmailLog(Base):
    __tablename__ = "email_logs"
    id = Column(Integer, primary_key=True, index=True)
    recipient_email = Column(String(150))
    subject = Column(String(300))
    body_preview = Column(Text)
    email_type = Column(String(50))  # onboarding, progress, reward
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    success = Column(Boolean, default=True)
    error_msg = Column(Text)

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String(20))  # user / assistant
    message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
