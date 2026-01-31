from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.api.auth_routes import get_current_user
from app.models.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse
from app.services.application_service import ApplicationService
from typing import List

router = APIRouter()


@router.post("/applications", response_model=ApplicationResponse)
async def create_application(
    application_data: ApplicationCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        application = await ApplicationService.create_application(
            db, current_user.id, application_data
        )
        return ApplicationResponse.model_validate(application)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating application: {str(e)}")


@router.get("/applications", response_model=List[ApplicationResponse])
async def get_my_applications(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        applications = await ApplicationService.get_user_applications(db, current_user.id)
        return [ApplicationResponse.model_validate(app) for app in applications]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting applications: {str(e)}")


@router.get("/applications/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    application = await ApplicationService.get_application(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return ApplicationResponse.model_validate(application)


@router.put("/applications/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: str,
    application_data: ApplicationUpdate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    application = await ApplicationService.get_application(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    updated = await ApplicationService.update_application(db, application_id, application_data)
    return ApplicationResponse.model_validate(updated)


@router.delete("/applications/{application_id}")
async def delete_application(
    application_id: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    application = await ApplicationService.get_application(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = await ApplicationService.delete_application(db, application_id)
    if not success:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"success": True, "message": "Application deleted successfully"}
