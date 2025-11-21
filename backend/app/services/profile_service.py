"""
Profile Service for managing user profiles
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.models.profile import Profile, ProfileCreate, ProfileUpdate, ProfileResponse
from datetime import datetime


class ProfileService:
    """Service for profile CRUD operations"""
    
    @staticmethod
    async def create_profile(db: AsyncSession, profile_data: ProfileCreate) -> Profile:
        """
        Create a new profile
        
        Args:
            db: Database session
            profile_data: Profile data
        
        Returns:
            Created profile
        """
        profile = Profile(
            name=profile_data.name,
            email=profile_data.email,
            phone=profile_data.phone,
            address=profile_data.address,
            additional_data=profile_data.additional_data
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        return profile
    
    @staticmethod
    async def get_profile(db: AsyncSession, profile_id: str) -> Optional[Profile]:
        """
        Get profile by ID
        
        Args:
            db: Database session
            profile_id: Profile ID
        
        Returns:
            Profile or None
        """
        result = await db.execute(select(Profile).where(Profile.id == profile_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_all_profiles(db: AsyncSession) -> List[Profile]:
        """
        Get all profiles
        
        Args:
            db: Database session
        
        Returns:
            List of profiles
        """
        result = await db.execute(select(Profile).order_by(Profile.created_at.desc()))
        return result.scalars().all()
    
    @staticmethod
    async def update_profile(
        db: AsyncSession,
        profile_id: str,
        profile_data: ProfileUpdate
    ) -> Optional[Profile]:
        """
        Update a profile
        
        Args:
            db: Database session
            profile_id: Profile ID
            profile_data: Updated profile data
        
        Returns:
            Updated profile or None
        """
        profile = await ProfileService.get_profile(db, profile_id)
        if not profile:
            return None
        
        update_data = profile_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)
        
        profile.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(profile)
        return profile
    
    @staticmethod
    async def delete_profile(db: AsyncSession, profile_id: str) -> bool:
        """
        Delete a profile
        
        Args:
            db: Database session
            profile_id: Profile ID
        
        Returns:
            True if deleted, False if not found
        """
        profile = await ProfileService.get_profile(db, profile_id)
        if not profile:
            return False
        
        await db.delete(profile)
        await db.commit()
        return True
    
    @staticmethod
    def profile_to_form_data(profile: Profile) -> dict:
        """
        Convert profile to form data dictionary
        
        Args:
            profile: Profile object
        
        Returns:
            Dictionary suitable for form filling
        """
        form_data = {}
        
        if profile.name:
            form_data["Name"] = profile.name
            form_data["First Name"] = profile.name.split()[0] if profile.name else ""
            if len(profile.name.split()) > 1:
                form_data["Last Name"] = " ".join(profile.name.split()[1:])
        
        if profile.email:
            form_data["Email"] = profile.email
        
        if profile.phone:
            form_data["Phone"] = profile.phone
        
        if profile.address:
            addr = profile.address
            if isinstance(addr, dict):
                if addr.get("street"):
                    form_data["Address"] = addr["street"]
                if addr.get("city"):
                    form_data["City"] = addr["city"]
                if addr.get("state"):
                    form_data["State"] = addr["state"]
                if addr.get("zip"):
                    form_data["Zip"] = addr["zip"]
                if addr.get("country"):
                    form_data["Country"] = addr["country"]
        
        if profile.additional_data:
            form_data.update(profile.additional_data)
        
        return form_data

