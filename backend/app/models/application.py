from sqlalchemy import Column, String, JSON, DateTime, ForeignKey, Text
from datetime import datetime
import uuid
from app.database import Base
from pydantic import BaseModel
from typing import Optional, Dict, Any


class Application(Base):
    __tablename__ = "applications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    job_url = Column(String, nullable=False)
    job_title = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    form_data = Column(JSON, nullable=True)
    filled_fields = Column(JSON, nullable=True)  # Fields that were auto-filled
    status = Column(String, default="pending")  # pending, submitted, completed
    submitted_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ApplicationCreate(BaseModel):
    job_url: str
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    form_data: Optional[Dict[str, Any]] = None
    filled_fields: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    submitted_at: Optional[datetime] = None
    notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: str
    user_id: str
    job_url: str
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    form_data: Optional[Dict[str, Any]] = None
    filled_fields: Optional[Dict[str, Any]] = None
    status: str
    submitted_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}
