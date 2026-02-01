from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Optional
from app.models.profile import Profile, ProfileCreate, ProfileUpdate, ProfileResponse
from datetime import datetime


class ProfileService:
    
    @staticmethod
    async def create_profile(db: AsyncSession, profile_data: ProfileCreate, user_id: str) -> Profile:
        # Store quick apply data in JSON field
        quick_apply_data = {
            "first_name": profile_data.first_name,
            "last_name": profile_data.last_name,
            "preferred_first_name": profile_data.preferred_first_name,
            "phone_country": profile_data.phone_country,
            "location": profile_data.location,
            "education": profile_data.education or [],
            "employment": profile_data.employment or [],
            "online_profiles": profile_data.online_profiles or {},
            "voluntary_identification": profile_data.voluntary_identification or {}
        }
        
        profile = Profile(
            user_id=user_id,
            name=profile_data.name,
            email=profile_data.email,
            phone=profile_data.phone,
            address=profile_data.address,
            additional_data=profile_data.additional_data,
            quick_apply_data=quick_apply_data
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        return profile
    
    @staticmethod
    async def create_profile_for_user(db: AsyncSession, user_id: str, profile_data: ProfileCreate) -> Profile:
        existing = await ProfileService.get_profile_by_user_id(db, user_id)
        if existing:
            return existing
        return await ProfileService.create_profile(db, profile_data, user_id)
    
    @staticmethod
    async def get_profile_by_user_id(db: AsyncSession, user_id: str) -> Optional[Profile]:
        result = await db.execute(select(Profile).where(Profile.user_id == user_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_profile(db: AsyncSession, profile_id: str) -> Optional[Profile]:
        result = await db.execute(select(Profile).where(Profile.id == profile_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_all_profiles(db: AsyncSession) -> List[Profile]:
        result = await db.execute(select(Profile).order_by(Profile.created_at.desc()))
        return result.scalars().all()
    
    @staticmethod
    async def update_profile(
        db: AsyncSession,
        profile_id: str,
        profile_data: ProfileUpdate
    ) -> Optional[Profile]:
        profile = await ProfileService.get_profile(db, profile_id)
        if not profile:
            return None
        
        # Use model_dump for Pydantic v2, or dict() for v1
        try:
            # Use exclude_unset=True to only include provided fields
            # Don't exclude None, empty lists, or empty dicts - we want to save all provided values
            update_data = profile_data.model_dump(exclude_unset=True)
        except AttributeError:
            update_data = profile_data.dict(exclude_unset=True)
        
        # Log for debugging
        import json
        print(f"Update data received: {json.dumps(update_data, indent=2, default=str)}")
        
        # Handle quick apply fields separately
        quick_apply_fields = [
            "first_name", "last_name", "preferred_first_name", "phone_country",
            "location", "education", "employment", "online_profiles", "voluntary_identification"
        ]
        
        # Get existing quick_apply_data or initialize - CREATE A NEW DICT to ensure SQLAlchemy detects the change
        existing_quick_apply = profile.quick_apply_data or {}
        quick_apply_data = dict(existing_quick_apply)  # Create a new dictionary
        print(f"Existing quick_apply_data: {json.dumps(existing_quick_apply, indent=2, default=str)}")
        
        # Update quick apply fields
        for field in quick_apply_fields:
            if field in update_data:
                value = update_data.pop(field)
                # Always update the field if it's in update_data (even if None, empty string, empty list, or empty dict)
                # This allows clearing fields and ensures all provided data is saved
                quick_apply_data[field] = value
                print(f"Updated {field}: {json.dumps(value, indent=2, default=str) if isinstance(value, (dict, list)) else value}")
        
        # Update regular fields (name, email, phone, address, additional_data)
        for field, value in update_data.items():
            if value is not None:
                setattr(profile, field, value)
        
        # IMPORTANT: Create a completely NEW dict object (deep copy) to ensure SQLAlchemy detects the change
        # SQLAlchemy uses object identity to detect changes, so we need a new dict object
        import copy
        new_quick_apply_data = copy.deepcopy(quick_apply_data)
        profile.quick_apply_data = new_quick_apply_data
        print(f"Final quick_apply_data (before commit): {json.dumps(profile.quick_apply_data, indent=2, default=str)}")
        
        profile.updated_at = datetime.utcnow()
        
        # Mark as modified - CRITICAL for JSON fields in SQLAlchemy
        # Even with a new dict, we need to flag it as modified
        flag_modified(profile, "quick_apply_data")
        
        try:
            # Flush to ensure changes are tracked before commit
            await db.flush()
            print("✓ Flush successful - changes tracked")
            
            # Commit the transaction
            await db.commit()
            print("✓ Commit successful - data saved to database")
            
            # Refresh to get the latest data from database
            await db.refresh(profile)
            print(f"✓ After refresh quick_apply_data: {json.dumps(profile.quick_apply_data, indent=2, default=str)}")
            
            # Return the updated profile
            return profile
        except Exception as e:
            print(f"✗ Error during commit: {str(e)}")
            print(f"✗ Error type: {type(e).__name__}")
            import traceback
            print(f"✗ Traceback: {traceback.format_exc()}")
            await db.rollback()
            raise
        
    
    @staticmethod
    async def delete_profile(db: AsyncSession, profile_id: str) -> bool:
        profile = await ProfileService.get_profile(db, profile_id)
        if not profile:
            return False
        
        await db.delete(profile)
        await db.commit()
        return True
    
    @staticmethod
    def profile_to_form_data(profile: Profile) -> dict:
        form_data = {}
        
        resume_data = profile.resume_data if profile.resume_data else {}
        quick_apply = profile.quick_apply_data if profile.quick_apply_data else {}
        
        # Use Quick Apply data if available, otherwise fall back to basic profile
        if quick_apply.get("first_name"):
            form_data["First Name"] = quick_apply["first_name"]
            form_data["Name"] = quick_apply["first_name"]
        if quick_apply.get("last_name"):
            form_data["Last Name"] = quick_apply["last_name"]
        if quick_apply.get("preferred_first_name"):
            form_data["Preferred First Name"] = quick_apply["preferred_first_name"]
        
        # Combine first and last name for full name
        if quick_apply.get("first_name") and quick_apply.get("last_name"):
            form_data["Full Name"] = f"{quick_apply['first_name']} {quick_apply['last_name']}"
            form_data["Name"] = form_data["Full Name"]
        else:
            name = profile.name or resume_data.get("name")
            if name:
                form_data["Name"] = name
                form_data["Full Name"] = name
                name_parts = name.split()
                if name_parts:
                    form_data["First Name"] = name_parts[0]
                    if len(name_parts) > 1:
                        form_data["Last Name"] = " ".join(name_parts[1:])
        
        email = profile.email or resume_data.get("email")
        if email:
            form_data["Email"] = email
            form_data["Email Address"] = email
        
        phone = profile.phone or quick_apply.get("phone") or resume_data.get("phone")
        if phone:
            form_data["Phone"] = phone
            form_data["Phone Number"] = phone
            form_data["Mobile"] = phone
        
        if quick_apply.get("location"):
            form_data["Location"] = quick_apply["location"]
            form_data["City"] = quick_apply["location"].split(",")[0] if "," in quick_apply["location"] else quick_apply["location"]
        
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
                    form_data["Zip Code"] = addr["zip"]
                if addr.get("country"):
                    form_data["Country"] = addr["country"]
        elif resume_data.get("address"):
            addr = resume_data["address"]
            if isinstance(addr, dict) and addr.get("full"):
                form_data["Address"] = addr["full"]
        
        if resume_data.get("skills"):
            form_data["Skills"] = ", ".join(resume_data["skills"][:10])
        
        if resume_data.get("summary"):
            form_data["Summary"] = resume_data["summary"][:500]
        
        if profile.additional_data:
            form_data.update(profile.additional_data)
        
        return form_data

