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
from app.services.html_parser_service import HTMLParserService
from app.services.safety_service import SafetyService
from app.utils.field_validator import FieldValidator
from app.utils.field_matcher import FieldMatcher
import io

router = APIRouter()


class FillFormRequest(BaseModel):
    """Request model for form filling"""
    url: Optional[str] = None
    form_data: dict
    screenshot_path: Optional[str] = None
    skip_validation: bool = False


class AnalyzeRequest(BaseModel):
    """Request model for form analysis"""
    url: Optional[str] = None


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-form-filling-assistant"}


@router.post("/analyze")
async def analyze_form(
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = None
):
    """
    Analyze a form and return structured form fields
    
    Can analyze from:
    - URL (HTML parsing) - preferred
    - Screenshot (Vision API + OCR fallback)
    
    Args:
        file: Optional screenshot image file
        url: Optional URL of the form page
    
    Returns:
        JSON structure with detected form fields
    """
    try:
        if url and not file:
            html_parser = HTMLParserService()
            try:
                result = await html_parser.analyze_form_from_url(url)
                await html_parser.close()
                return JSONResponse(content=result)
            except Exception as e:
                await html_parser.close()
                raise HTTPException(status_code=500, detail=f"HTML parsing failed: {str(e)}")
        
        if file:
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
        
        raise HTTPException(status_code=400, detail="Either URL or file must be provided")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing form: {str(e)}")


@router.post("/preview")
async def preview_form(request: FillFormRequest):
    """
    Preview form filling actions without executing
    
    Args:
        request: FillFormRequest with url and form_data
    
    Returns:
        Preview of actions with validation results
    """
    try:
        if not request.url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        safety_service = SafetyService()
        preview = await safety_service.preview_actions(
            url=request.url,
            form_data=request.form_data
        )
        
        return JSONResponse(content=preview)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating preview: {str(e)}")


@router.post("/dry-run")
async def dry_run_form(request: FillFormRequest):
    """
    Perform dry run - detect fields without filling
    
    Args:
        request: FillFormRequest with url and form_data
    
    Returns:
        Dry run results
    """
    try:
        if not request.url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        safety_service = SafetyService()
        result = await safety_service.dry_run(
            url=request.url,
            form_data=request.form_data
        )
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing dry run: {str(e)}")


@router.post("/fill")
async def fill_form(request: FillFormRequest):
    """
    Fill a form using automation
    
    Args:
        request: FillFormRequest with url, form_data, and optional validation skip
    
    Returns:
        Success status and execution details
    """
    try:
        if not request.url:
            raise HTTPException(status_code=400, detail="URL is required for form filling")
        
        if not request.skip_validation:
            html_parser = HTMLParserService()
            try:
                analysis = await html_parser.analyze_form_from_url(request.url)
                form_structure = analysis.get('form_structure', {})
                
                validator = FieldValidator()
                matcher = FieldMatcher()
                
                matched_data = matcher.match_form_data_to_fields(request.form_data, form_structure.get('fields', []))
                is_valid, errors = validator.validate_form_data(matched_data, form_structure)
                
                if not is_valid:
                    await html_parser.close()
                    return JSONResponse(
                        status_code=400,
                        content={
                            "success": False,
                            "validation_errors": errors,
                            "message": "Form data validation failed"
                        }
                    )
                
                request.form_data = matched_data
                await html_parser.close()
            except Exception as e:
                await html_parser.close()
                print(f"Validation warning: {e}")
        
        automation_service = AutomationService()
        result = await automation_service.fill_form(
            url=request.url,
            form_data=request.form_data
        )
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error filling form: {str(e)}")

