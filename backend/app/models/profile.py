from sqlalchemy import Column, String, JSON, DateTime, ForeignKey
from datetime import datetime
import uuid
from app.database import Base
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any


class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(JSON, nullable=True)
    additional_data = Column(JSON, nullable=True)
    resume_path = Column(String, nullable=True)
    resume_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ProfileCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[Dict[str, Any]] = None
    additional_data: Optional[Dict[str, Any]] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[Dict[str, Any]] = None
    additional_data: Optional[Dict[str, Any]] = None


class ProfileResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[Dict[str, Any]] = None
    additional_data: Optional[Dict[str, Any]] = None
    resume_path: Optional[str] = None
    resume_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}

