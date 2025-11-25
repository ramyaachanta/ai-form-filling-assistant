import os
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.models.profile import ProfileCreate, ProfileUpdate, ProfileResponse
from app.services.profile_service import ProfileService
from app.services.resume_parser_service import ResumeParserService
from app.api.auth_routes import get_current_user

router = APIRouter()


@router.post("/profiles", response_model=ProfileResponse)
async def create_profile(
    profile_data: ProfileCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        profile = await ProfileService.create_profile_for_user(db, current_user.id, profile_data)
        return ProfileResponse.model_validate(profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating profile: {str(e)}")


@router.get("/profiles/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        profile = await ProfileService.get_profile_by_user_id(db, current_user.id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found. Please create your profile.")
        return ProfileResponse.model_validate(profile)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting profile: {str(e)}")


@router.get("/profiles/{profile_id}", response_model=ProfileResponse)
async def get_profile(
    profile_id: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = await ProfileService.get_profile(db, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this profile")
    return ProfileResponse.model_validate(profile)


@router.put("/profiles/me", response_model=ProfileResponse)
async def update_my_profile(
    profile_data: ProfileUpdate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = await ProfileService.get_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please create your profile first.")
    
    updated_profile = await ProfileService.update_profile(db, profile.id, profile_data)
    if not updated_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileResponse.model_validate(updated_profile)


@router.delete("/profiles/me")
async def delete_my_profile(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = await ProfileService.get_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if profile.resume_path:
        resume_file = Path(profile.resume_path)
        if resume_file.exists():
            resume_file.unlink()
    
    success = await ProfileService.delete_profile(db, profile.id)
    if not success:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"success": True, "message": "Profile deleted successfully"}


@router.post("/profiles/me/resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = await ProfileService.get_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please create your profile first.")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ['.pdf', '.docx', '.doc']:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    
    resumes_dir = Path("resumes")
    resumes_dir.mkdir(parents=True, exist_ok=True)
    
    resume_filename = f"{current_user.id}{file_ext}"
    resume_path = resumes_dir / resume_filename
    
    try:
        
        with open(resume_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        resume_data = await ResumeParserService.parse_resume(str(resume_path))
        
        update_data = ProfileUpdate()
        if resume_data.get("name") and not profile.name:
            update_data.name = resume_data["name"]
        if resume_data.get("email") and not profile.email:
            update_data.email = resume_data["email"]
        if resume_data.get("phone") and not profile.phone:
            update_data.phone = resume_data["phone"]
        
        profile.resume_path = str(resume_path.absolute())
        profile.resume_data = resume_data
        
        await db.commit()
        await db.refresh(profile)
        
        return {
            "success": True,
            "message": "Resume uploaded and parsed successfully",
            "profile": ProfileResponse.model_validate(profile),
            "extracted_data": resume_data
        }
    except Exception as e:
        if resume_path.exists():
            resume_path.unlink()
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

