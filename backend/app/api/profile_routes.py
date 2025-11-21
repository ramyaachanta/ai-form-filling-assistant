"""
Profile management API routes
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.models.profile import ProfileCreate, ProfileUpdate, ProfileResponse
from app.services.profile_service import ProfileService

router = APIRouter()


@router.post("/profiles", response_model=ProfileResponse)
async def create_profile(
    profile_data: ProfileCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user profile
    
    Args:
        profile_data: Profile data
        db: Database session
    
    Returns:
        Created profile
    """
    try:
        profile = await ProfileService.create_profile(db, profile_data)
        return ProfileResponse.model_validate(profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating profile: {str(e)}")


@router.get("/profiles", response_model=List[ProfileResponse])
async def list_profiles(db: AsyncSession = Depends(get_db)):
    """
    List all user profiles
    
    Args:
        db: Database session
    
    Returns:
        List of profiles
    """
    try:
        profiles = await ProfileService.get_all_profiles(db)
        return [ProfileResponse.model_validate(p) for p in profiles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing profiles: {str(e)}")


@router.get("/profiles/{profile_id}", response_model=ProfileResponse)
async def get_profile(
    profile_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get profile by ID
    
    Args:
        profile_id: Profile ID
        db: Database session
    
    Returns:
        Profile
    """
    profile = await ProfileService.get_profile(db, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileResponse.model_validate(profile)


@router.put("/profiles/{profile_id}", response_model=ProfileResponse)
async def update_profile(
    profile_id: str,
    profile_data: ProfileUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a profile
    
    Args:
        profile_id: Profile ID
        profile_data: Updated profile data
        db: Database session
    
    Returns:
        Updated profile
    """
    profile = await ProfileService.update_profile(db, profile_id, profile_data)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileResponse.model_validate(profile)


@router.delete("/profiles/{profile_id}")
async def delete_profile(
    profile_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a profile
    
    Args:
        profile_id: Profile ID
        db: Database session
    
    Returns:
        Success message
    """
    success = await ProfileService.delete_profile(db, profile_id)
    if not success:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"success": True, "message": "Profile deleted successfully"}

