"""
Profile models for user data storage
"""
from sqlalchemy import Column, String, JSON, DateTime
from datetime import datetime
import uuid
from app.database import Base
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any


class Profile(Base):
    """SQLAlchemy model for user profiles"""
    __tablename__ = "profiles"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(JSON, nullable=True)
    additional_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ProfileCreate(BaseModel):
    """Pydantic model for creating a profile"""
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[Dict[str, Any]] = None
    additional_data: Optional[Dict[str, Any]] = None


class ProfileUpdate(BaseModel):
    """Pydantic model for updating a profile"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[Dict[str, Any]] = None
    additional_data: Optional[Dict[str, Any]] = None


class ProfileResponse(BaseModel):
    """Pydantic model for profile response"""
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[Dict[str, Any]] = None
    additional_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}

