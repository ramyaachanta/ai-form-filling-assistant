"""
API routes for form analysis and automation
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
from pydantic import BaseModel
from app.services.vision_service import VisionService
from app.services.ocr_service import OCRService
from app.services.automation_service import AutomationService
import io

router = APIRouter()


class FillFormRequest(BaseModel):
    """Request model for form filling"""
    url: Optional[str] = None
    form_data: dict
    screenshot_path: Optional[str] = None


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-form-filling-assistant"}


@router.post("/analyze")
async def analyze_form(
    file: UploadFile = File(...),
    url: Optional[str] = None
):
    """
    Analyze a form screenshot and return structured form fields
    
    Args:
        file: Screenshot image file
        url: Optional URL of the form page
    
    Returns:
        JSON structure with detected form fields
    """
    try:
        image_bytes = await file.read()
        image = io.BytesIO(image_bytes)
        
        vision_service = VisionService()
        try:
            form_structure = await vision_service.analyze_form(image_bytes)
            return JSONResponse(content=form_structure)
        except Exception as e:
            print(f"Vision API failed: {e}, falling back to OCR")
            ocr_service = OCRService()
            form_structure = await ocr_service.analyze_form(image_bytes)
            return JSONResponse(content=form_structure)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing form: {str(e)}")


@router.post("/fill")
async def fill_form(request: FillFormRequest):
    """
    Fill a form using automation
    
    Args:
        request: FillFormRequest with url, form_data, and optional screenshot_path
    
    Returns:
        Success status and execution details
    """
    try:
        if not request.url:
            raise HTTPException(status_code=400, detail="URL is required for form filling")
        
        automation_service = AutomationService()
        result = await automation_service.fill_form(
            url=request.url,
            form_data=request.form_data
        )
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error filling form: {str(e)}")

