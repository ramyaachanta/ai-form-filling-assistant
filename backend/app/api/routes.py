from fastapi import APIRouter, HTTPException, Depends, Form
from fastapi.responses import JSONResponse
from typing import Optional
from pydantic import BaseModel
from app.services.automation_service import AutomationService
from app.services.html_parser_service import HTMLParserService
from app.services.safety_service import SafetyService
from app.services.multi_step_service import MultiStepService
from app.services.profile_service import ProfileService
from app.utils.field_validator import FieldValidator
from app.utils.field_matcher import FieldMatcher
from app.database import get_db
from app.api.auth_routes import get_current_user
from app.utils.logger import logger
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class FillFormRequest(BaseModel):
    url: Optional[str] = None
    form_data: Optional[dict] = None
    skip_validation: bool = False
    multi_step: bool = False


class AnalyzeRequest(BaseModel):
    url: Optional[str] = None


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-form-filling-assistant"}


@router.post("/analyze")
async def analyze_form(
    url: Optional[str] = Form(None)
):
    try:
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        html_parser = HTMLParserService()
        try:
            result = await html_parser.analyze_form_from_url(url)
            await html_parser.close()
            return JSONResponse(content=result)
        except Exception as e:
            await html_parser.close()
            raise HTTPException(status_code=500, detail=f"HTML parsing failed: {str(e)}")
            
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


@router.post("/check-fillable")
async def check_if_fillable(
    url: str = Form(...),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Check if a form can be filled automatically"""
    try:
        from app.services.html_parser_service import HTMLParserService
        from app.services.automation_service import AutomationService
        
        html_parser = HTMLParserService()
        try:
            analysis = await html_parser.analyze_form_from_url(url)
            form_structure = analysis.get('form_structure', {})
            fields = form_structure.get('fields', [])
            
            fillable = len(fields) > 0
            
            # Get profile data to see how many fields we can match
            profile = await ProfileService.get_profile_by_user_id(db, current_user.id)
            matchable_count = 0
            if profile:
                profile_data = ProfileService.profile_to_form_data(profile)
                from app.utils.field_matcher import FieldMatcher
                matcher = FieldMatcher()
                matched = matcher.match_form_data_to_fields(profile_data, fields)
                matchable_count = len(matched)
            
            await html_parser.close()
            
            return JSONResponse(content={
                "fillable": fillable,
                "total_fields": len(fields),
                "matchable_fields": matchable_count,
                "confidence": "high" if matchable_count >= len(fields) * 0.7 else "medium" if matchable_count > 0 else "low",
                "message": f"Form has {len(fields)} fields. Can match {matchable_count} fields from your profile." if fillable else "Form may not be fillable automatically."
            })
        except Exception as e:
            await html_parser.close()
            return JSONResponse(content={
                "fillable": False,
                "error": str(e),
                "message": "Could not analyze form"
            })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking form: {str(e)}")


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
        resume_path = None
        
        # Get profile to extract form data and resume path
        profile = await ProfileService.get_profile_by_user_id(db, current_user.id)
        if profile:
            if not form_data:
                profile_data = ProfileService.profile_to_form_data(profile)
                form_data.update(profile_data)
            # Get resume path if available
            if profile.resume_path:
                from pathlib import Path
                resume_file = Path(profile.resume_path)
                if resume_file.exists():
                    resume_path = str(resume_file.absolute())
        elif not form_data:
            raise HTTPException(status_code=400, detail="No profile found. Please create your profile first.")
        
        if not form_data:
            raise HTTPException(
                status_code=400, 
                detail="Form data is required. Either provide form_data in request or ensure your profile has data."
            )
        
        # Skip strict validation - we'll fill as much as possible
        if not request.skip_validation:
            html_parser = HTMLParserService()
            try:
                analysis = await html_parser.analyze_form_from_url(request.url)
                form_structure = analysis.get('form_structure', {})
                fields = form_structure.get('fields', [])
                
                if fields:
                    matcher = FieldMatcher()
                    # Match and update form_data, but don't fail on validation errors
                    matched_data = matcher.match_form_data_to_fields(form_data, fields)
                    form_data = matched_data
                    print(f"Matched {len(matched_data)} fields out of {len(fields)} available fields")
                
                await html_parser.close()
            except Exception as e:
                await html_parser.close()
                print(f"Validation warning: {e} - continuing with available data")
        
        # For form filling, always use non-headless mode so user can see and complete
        from playwright.async_api import async_playwright
        playwright = await async_playwright().start()
        browser = None
        page = None
        
        try:
            # Launch browser in non-headless mode for user interaction - prefer Chrome
            try:
                browser = await playwright.chromium.launch(
                    headless=False,
                    channel="chrome",  # Use system Chrome if available
                    args=[
                        '--disable-blink-features=AutomationControlled',
                        '--start-maximized',
                        '--disable-web-security',
                        '--disable-features=IsolateOrigins,site-per-process'
                    ]
                )
            except Exception:
                try:
                    # Try chromium if chrome channel not available
                    browser = await playwright.chromium.launch(
                        headless=False,
                        args=[
                            '--disable-blink-features=AutomationControlled',
                            '--start-maximized'
                        ]
                    )
                except Exception:
                    # Fallback to firefox
                    browser = await playwright.firefox.launch(headless=False)
            
            page = await browser.new_page()
            # Set larger viewport to see more content
            await page.set_viewport_size({"width": 1920, "height": 1080})
            
            await page.goto(request.url, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_load_state("networkidle", timeout=15000)
            await page.wait_for_timeout(3000)  # Wait for dynamic content
            
            # Scroll through page to ensure all content is loaded - scroll all the way to bottom
            try:
                # First, scroll to very bottom to trigger any lazy-loaded content
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await page.wait_for_timeout(2000)
                
                # Now scroll back up in increments to load everything
                viewport_height = await page.evaluate("window.innerHeight")
                total_height = await page.evaluate("document.body.scrollHeight")
                current_position = 0
                scroll_step = viewport_height * 0.7
                
                while current_position < total_height:
                    await page.evaluate(f"window.scrollTo({{ top: {current_position}, behavior: 'smooth' }})")
                    await page.wait_for_timeout(1000)  # Longer wait for content
                    current_position += scroll_step
                    # Re-check total height in case it increased
                    new_height = await page.evaluate("document.body.scrollHeight")
                    if new_height > total_height:
                        total_height = new_height
                        # Scroll to new bottom
                        await page.evaluate(f"window.scrollTo({{ top: {new_height}, behavior: 'smooth' }})")
                        await page.wait_for_timeout(1000)
                
                # Scroll back to top
                await page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })")
                await page.wait_for_timeout(1500)
            except Exception as e:
                logger.warning(f"Scrolling issue: {e}")
                pass
            
            # Try to detect if it's a multi-step form
            multi_step_service = MultiStepService()
            is_multi_step = await multi_step_service.detect_multi_step_form(page)
            
            automation_service = AutomationService()
            
            if is_multi_step and request.multi_step:
                # Use multi-step service
                result = await multi_step_service.fill_multi_step_form(page, form_data, resume_path=resume_path)
                result["url"] = request.url
                result["profile_used"] = not request.form_data
                result["form_type"] = "multi-step"
            else:
                # Use regular form filling - fill as much as possible
                result = await automation_service.fill_form_with_page(page, form_data, resume_path=resume_path)
                result["url"] = request.url
                result["profile_used"] = not request.form_data
                result["form_type"] = "single-page"
                result["fillable"] = result.get("filled_count", 0) > 0
            
            # Save application to database
            try:
                from app.services.application_service import ApplicationService
                from app.models.application import ApplicationCreate
                
                # Extract job title and company from URL if possible
                job_title = None
                company_name = None
                if "greenhouse.io" in request.url:
                    parts = request.url.split("/")
                    if len(parts) > 2:
                        company_name = parts[-2] if parts[-2] != "jobs" else None
                
                application_data = ApplicationCreate(
                    job_url=request.url,
                    job_title=job_title,
                    company_name=company_name,
                    form_data=form_data,
                    filled_fields={
                        "filled_count": result.get("filled_count", 0),
                        "total_fields": len(form_data),
                        "actions": result.get("executed_actions", [])
                    }
                )
                application = await ApplicationService.create_application(
                    db, current_user.id, application_data
                )
                result["application_id"] = application.id
            except Exception as e:
                logger.warning(f"Could not save application: {e}")
            
            # Don't close browser - keep it open for user to complete and submit
            # Browser will stay open until user closes it manually
            result["browser_open"] = True
            result["message"] = f"Browser opened with form. {result.get('message', '')} Please complete remaining fields and submit manually."
            
            return JSONResponse(content=result)
        except Exception as e:
            # Close browser on error
            if page:
                try:
                    await page.close()
                except:
                    pass
            if browser:
                try:
                    await browser.close()
                except:
                    pass
            raise
        # Note: Browser stays open - user will close it manually after submitting
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error filling form: {str(e)}")

