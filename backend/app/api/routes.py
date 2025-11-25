from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Optional
from pydantic import BaseModel
from app.services.vision_service import VisionService
from app.services.ocr_service import OCRService
from app.services.automation_service import AutomationService
from app.services.html_parser_service import HTMLParserService
from app.services.safety_service import SafetyService
from app.services.multi_step_service import MultiStepService
from app.services.profile_service import ProfileService
from app.utils.field_validator import FieldValidator
from app.utils.field_matcher import FieldMatcher
from app.database import get_db
from app.api.auth_routes import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
import io

router = APIRouter()


class FillFormRequest(BaseModel):
    url: Optional[str] = None
    form_data: Optional[dict] = None
    screenshot_path: Optional[str] = None
    skip_validation: bool = False
    multi_step: bool = False


class AnalyzeRequest(BaseModel):
    url: Optional[str] = None


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-form-filling-assistant"}


@router.post("/analyze")
async def analyze_form(
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = None
):
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
                ocr_result = await ocr_service.analyze_form(image_bytes)
                if isinstance(ocr_result, dict) and "form_structure" in ocr_result:
                    return JSONResponse(content=ocr_result["form_structure"])
                return JSONResponse(content=ocr_result)
        
        raise HTTPException(status_code=400, detail="Either URL or file must be provided")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing form: {str(e)}")


@router.post("/preview")
async def preview_form(request: FillFormRequest):
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
async def fill_form(
    request: FillFormRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        if not request.url:
            raise HTTPException(status_code=400, detail="URL is required for form filling")
        
        form_data = request.form_data.copy() if request.form_data else {}
        
        if not form_data:
            profile = await ProfileService.get_profile_by_user_id(db, current_user.id)
            if profile:
                profile_data = ProfileService.profile_to_form_data(profile)
                form_data.update(profile_data)
            else:
                raise HTTPException(status_code=400, detail="No profile found. Please create your profile first.")
        
        if not form_data:
            raise HTTPException(status_code=400, detail="Form data is required")
        
        if not request.skip_validation:
            html_parser = HTMLParserService()
            try:
                analysis = await html_parser.analyze_form_from_url(request.url)
                form_structure = analysis.get('form_structure', {})
                fields = form_structure.get('fields', [])
                
                if fields:
                    validator = FieldValidator()
                    matcher = FieldMatcher()
                    
                    matched_data = matcher.match_form_data_to_fields(form_data, fields)
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
                    
                    form_data = matched_data
                else:
                    print("No fields found in HTML, skipping validation")
                
                await html_parser.close()
            except Exception as e:
                await html_parser.close()
                print(f"Validation warning: {e}")
        
        automation_service = AutomationService()
        
        if request.multi_step:
            browser = await automation_service._get_browser()
            page = await browser.new_page()
            try:
                await page.goto(request.url, wait_until="domcontentloaded", timeout=automation_service.timeout)
                await page.wait_for_load_state("networkidle", timeout=10000)
                
                multi_step_service = MultiStepService()
                result = await multi_step_service.fill_multi_step_form(page, form_data)
                result["url"] = request.url
                result["profile_used"] = True
            finally:
                await page.close()
        else:
            result = await automation_service.fill_form(
                url=request.url,
                form_data=form_data
            )
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error filling form: {str(e)}")

