from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.models.application import Application, ApplicationCreate, ApplicationUpdate
from datetime import datetime


class ApplicationService:
    
    @staticmethod
    async def create_application(
        db: AsyncSession,
        user_id: str,
        application_data: ApplicationCreate
    ) -> Application:
        application = Application(
            user_id=user_id,
            job_url=application_data.job_url,
            job_title=application_data.job_title,
            company_name=application_data.company_name,
            form_data=application_data.form_data,
            filled_fields=application_data.filled_fields,
            notes=application_data.notes,
            status="pending"
        )
        db.add(application)
        await db.commit()
        await db.refresh(application)
        return application
    
    @staticmethod
    async def get_application(
        db: AsyncSession,
        application_id: str
    ) -> Optional[Application]:
        result = await db.execute(select(Application).where(Application.id == application_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_applications(
        db: AsyncSession,
        user_id: str
    ) -> List[Application]:
        result = await db.execute(
            select(Application)
            .where(Application.user_id == user_id)
            .order_by(Application.created_at.desc())
        )
        return result.scalars().all()
    
    @staticmethod
    async def update_application(
        db: AsyncSession,
        application_id: str,
        application_data: ApplicationUpdate
    ) -> Optional[Application]:
        application = await ApplicationService.get_application(db, application_id)
        if not application:
            return None
        
        # Use model_dump for Pydantic v2, or dict() for v1
        try:
            update_data = application_data.model_dump(exclude_unset=True)
        except AttributeError:
            update_data = application_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if value is not None:
                setattr(application, field, value)
        
        application.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(application)
        return application
    
    @staticmethod
    async def delete_application(
        db: AsyncSession,
        application_id: str
    ) -> bool:
        application = await ApplicationService.get_application(db, application_id)
        if not application:
            return False
        
        await db.delete(application)
        await db.commit()
        return True
