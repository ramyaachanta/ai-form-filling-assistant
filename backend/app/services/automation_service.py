from playwright.async_api import async_playwright, Page, Browser
from app.config import settings
from typing import Dict, Any, List
import asyncio


class AutomationService:
    
    def __init__(self):
        self.browser: Browser = None
        self.headless = settings.playwright_headless
        self.timeout = settings.playwright_timeout
    
    async def _get_browser(self) -> Browser:
        if self.browser is None:
            playwright = await async_playwright().start()
            try:
                self.browser = await playwright.firefox.launch(headless=self.headless)
            except Exception:
                try:
                    self.browser = await playwright.chromium.launch(
                        headless=self.headless,
                        args=['--disable-blink-features=AutomationControlled', '--no-sandbox']
                    )
                except Exception:
                    self.browser = await playwright.webkit.launch(headless=self.headless)
        return self.browser
    
    async def _find_field_by_label(self, page: Page, label: str) -> Any:
        strategies = [
            f"//label[contains(text(), '{label}')]/following-sibling::input[1]",
            f"//label[contains(text(), '{label}')]/following-sibling::select[1]",
            f"//label[contains(text(), '{label}')]/following-sibling::textarea[1]",
            f"//label[contains(text(), '{label}')]",
            f"//input[contains(@placeholder, '{label}') or contains(@name, '{label}')]",
            f"//select[contains(@name, '{label}')]",
            f"//textarea[contains(@placeholder, '{label}') or contains(@name, '{label}')]",
        ]
        
        for strategy in strategies:
            try:
                element = await page.query_selector(f"xpath={strategy}")
                if element:
                    if await element.evaluate("el => el.tagName.toLowerCase()") == "label":
                        label_for = await element.get_attribute("for")
                        if label_for:
                            element = await page.query_selector(f"#{label_for}")
                        else:
                            element = await element.evaluate_handle("el => el.nextElementSibling")
                    return element
            except Exception:
                continue
        
        return None
    
    async def fill_form(self, url: str, form_data: Dict[str, Any]) -> Dict[str, Any]:
        browser = await self._get_browser()
        page = await browser.new_page()
        
        executed_actions = []
        errors = []
        
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=self.timeout)
            await page.wait_for_load_state("networkidle", timeout=10000)
            await page.wait_for_timeout(1000)
            
            for label, value in form_data.items():
                try:
                    field = await self._find_field_by_label(page, label)
                    
                    if not field:
                        errors.append(f"Field not found: {label}")
                        continue
                    
                    await field.scroll_into_view_if_needed()
                    await page.wait_for_timeout(200)
                    
                    tag_name = await field.evaluate("el => el.tagName.toLowerCase()")
                    field_type = await field.get_attribute("type") or ""
                    
                    is_visible = await field.is_visible()
                    if not is_visible:
                        errors.append(f"Field '{label}' is not visible")
                        continue
                    
                    if tag_name == "select":
                        await field.select_option(value)
                        executed_actions.append(f"Selected '{value}' in {label}")
                    elif field_type == "checkbox":
                        is_checked = await field.is_checked()
                        if value and not is_checked:
                            await field.check()
                        elif not value and is_checked:
                            await field.uncheck()
                        executed_actions.append(f"Set checkbox {label} to {value}")
                    elif field_type == "radio":
                        await field.check()
                        executed_actions.append(f"Selected radio {label}")
                    else:
                        await field.fill(str(value))
                        executed_actions.append(f"Filled {label} with '{value}'")
                    
                except Exception as e:
                    errors.append(f"Error filling {label}: {str(e)}")
            
            await page.wait_for_timeout(1000)
            
            # Try to detect form submission
            try:
                submit_buttons = await page.query_selector_all(
                    "button[type='submit'], input[type='submit'], button:has-text('Submit'), button:has-text('Send')"
                )
                if submit_buttons:
                    # Check if form was submitted by looking for success indicators
                    await page.wait_for_timeout(2000)
                    current_url = page.url
                    page_content = await page.content()
                    
                    # Simple heuristics for submission detection
                    success_indicators = [
                        "thank you", "success", "submitted", "received",
                        "confirmation", "complete"
                    ]
                    if any(indicator in page_content.lower() for indicator in success_indicators):
                        submitted = True
            except Exception:
                pass
            
            return {
                "success": len(errors) == 0,
                "url": url,
                "executed_actions": executed_actions,
                "errors": errors,
                "submitted": submitted,
                "message": "Form filled successfully" if len(errors) == 0 else f"Completed with {len(errors)} errors"
            }
            
        except Exception as e:
            return {
                "success": False,
                "url": url,
                "error": str(e),
                "executed_actions": executed_actions,
                "errors": errors
            }
        finally:
            await page.close()
    
    async def fill_form_with_page(self, page: Page, form_data: Dict[str, Any], resume_path: str = None) -> Dict[str, Any]:
        """Fill form using an existing page instance"""
        executed_actions = []
        errors = []
        submitted = False
        filled_count = 0
        
        try:
            # Ensure all content is loaded and visible
            await self._ensure_page_fully_loaded(page)
            
            # First, try to find and upload resume if available
            if resume_path:
                resume_uploaded = await self._upload_resume_if_present(page, resume_path)
                if resume_uploaded:
                    executed_actions.append("Uploaded resume file")
                    filled_count += 1
            
            for label, value in form_data.items():
                if not value or str(value).strip() == "":
                    continue
                    
                try:
                    # Try multiple strategies to find the field
                    field = await self._find_field_by_label(page, label)
                    
                    if not field:
                        # Try partial label matching
                        field = await self._find_field_by_partial_label(page, label)
                    
                    if not field:
                        errors.append(f"Field not found: {label}")
                        continue
                    
                    # Scroll to field and ensure it's visible - use center alignment
                    try:
                        await field.evaluate("el => el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })")
                        await page.wait_for_timeout(400)
                    except Exception:
                        await field.scroll_into_view_if_needed()
                        await page.wait_for_timeout(400)
                    
                    # Try to expand any collapsed sections/accordions
                    await self._expand_collapsed_sections(page, field)
                    
                    # Force scroll to center of viewport for better visibility
                    try:
                        box = await field.bounding_box()
                        if box:
                            viewport = await page.viewport_size()
                            scroll_y = box['y'] - (viewport['height'] / 2) + (box['height'] / 2)
                            await page.evaluate(f"window.scrollTo({{ top: {max(0, scroll_y)}, behavior: 'smooth' }})")
                            await page.wait_for_timeout(500)
                    except Exception:
                        pass
                    
                    tag_name = await field.evaluate("el => el.tagName.toLowerCase()")
                    field_type = await field.get_attribute("type") or ""
                    
                    is_visible = await field.is_visible()
                    if not is_visible:
                        # Try scrolling more aggressively
                        try:
                            await field.evaluate("el => el.scrollIntoView({ behavior: 'smooth', block: 'center' })")
                            await page.wait_for_timeout(500)
                            is_visible = await field.is_visible()
                        except Exception:
                            pass
                        
                        if not is_visible:
                            errors.append(f"Field '{label}' is not visible")
                            continue
                    
                    is_disabled = await field.is_disabled()
                    if is_disabled:
                        errors.append(f"Field '{label}' is disabled")
                        continue
                    
                    # Handle file upload fields
                    if field_type == "file":
                        # Skip if we already uploaded resume to a resume field
                        if resume_path and self._is_resume_field(label):
                            continue
                        # For other file fields, we can't auto-upload without knowing the file
                        errors.append(f"File upload field '{label}' requires manual upload")
                        continue
                    
                    if tag_name == "select":
                        try:
                            await field.select_option(str(value))
                            executed_actions.append(f"Selected '{value}' in {label}")
                            filled_count += 1
                        except Exception as e:
                            errors.append(f"Could not select '{value}' in {label}: {str(e)}")
                    elif field_type == "checkbox":
                        is_checked = await field.is_checked()
                        if value and not is_checked:
                            await field.check()
                            executed_actions.append(f"Checked {label}")
                            filled_count += 1
                        elif not value and is_checked:
                            await field.uncheck()
                            executed_actions.append(f"Unchecked {label}")
                    elif field_type == "radio":
                        await field.check()
                        executed_actions.append(f"Selected radio {label}")
                        filled_count += 1
                    else:
                        # Clear field first
                        await field.fill("")
                        await field.fill(str(value))
                        executed_actions.append(f"Filled {label} with '{value}'")
                        filled_count += 1
                    
                except Exception as e:
                    errors.append(f"Error filling {label}: {str(e)}")
            
            # After filling all fields, scroll to bottom to show submit button
            try:
                await page.evaluate("window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })")
                await page.wait_for_timeout(1500)
                
                # Also try to find and scroll to submit button specifically
                submit_buttons = await page.query_selector_all(
                    "button[type='submit'], input[type='submit'], button:has-text('Submit'), "
                    "button:has-text('submit'), button:has-text('Send'), button:has-text('Apply'), "
                    "button:has-text('Submit application')"
                )
                if submit_buttons:
                    for btn in submit_buttons:
                        try:
                            if await btn.is_visible():
                                await btn.scroll_into_view_if_needed()
                                await page.wait_for_timeout(500)
                                break
                        except Exception:
                            continue
            except Exception:
                pass
            
            await page.wait_for_timeout(1000)
            
            return {
                "success": filled_count > 0,
                "filled_count": filled_count,
                "total_fields": len(form_data),
                "executed_actions": executed_actions,
                "errors": errors,
                "submitted": submitted,
                "message": f"Filled {filled_count} out of {len(form_data)} fields successfully" if filled_count > 0 else "No fields could be filled"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "executed_actions": executed_actions,
                "errors": errors
            }
    
    def _is_resume_field(self, label: str) -> bool:
        """Check if a label indicates a resume/CV upload field"""
        resume_keywords = ["resume", "cv", "curriculum vitae", "cover letter", "attachment"]
        label_lower = label.lower()
        return any(keyword in label_lower for keyword in resume_keywords)
    
    async def _ensure_page_fully_loaded(self, page: Page):
        """Ensure page is fully loaded, all content is visible, and scroll through the page"""
        try:
            # Wait for network to be idle
            await page.wait_for_load_state("networkidle", timeout=15000)
            await page.wait_for_timeout(2000)  # Extra wait for dynamic content
            
            # First, scroll all the way to bottom to trigger lazy loading
            await page.evaluate("window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })")
            await page.wait_for_timeout(2000)
            
            # Scroll through the entire page to trigger lazy loading
            viewport_height = await page.evaluate("window.innerHeight")
            total_height = await page.evaluate("document.body.scrollHeight")
            
            # Scroll down in increments to load all content
            current_position = 0
            scroll_step = viewport_height * 0.7  # Scroll 70% of viewport at a time
            
            while current_position < total_height:
                await page.evaluate(f"window.scrollTo({{ top: {current_position}, behavior: 'smooth' }})")
                await page.wait_for_timeout(1000)  # Longer wait for content to load
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
            
            # Try to close any modals/overlays that might be blocking content
            try:
                close_buttons = await page.query_selector_all(
                    "button[aria-label*='close' i], button[aria-label*='dismiss' i], "
                    ".modal-close, .close-button, [class*='close'][class*='button'], "
                    "button:has-text('Close'), button:has-text('×')"
                )
                for btn in close_buttons:
                    if await btn.is_visible():
                        await btn.click()
                        await page.wait_for_timeout(500)
            except Exception:
                pass
                
        except Exception as e:
            # Continue even if scrolling fails
            pass
    
    async def _expand_collapsed_sections(self, page: Page, field_element):
        """Try to expand collapsed sections, accordions, or tabs that might contain the field"""
        try:
            # Find parent containers that might be collapsed
            parent = await field_element.evaluate_handle("el => el.closest('.collapse, .accordion, [class*=\"collapse\"], [class*=\"accordion\"], details, [aria-expanded=\"false\"]')")
            
            if parent:
                # Try to expand by clicking
                try:
                    expand_button = await parent.query_selector("button, summary, [role='button']")
                    if expand_button:
                        is_expanded = await parent.get_attribute("aria-expanded")
                        if is_expanded == "false" or not is_expanded:
                            await expand_button.click()
                            await page.wait_for_timeout(500)
                except Exception:
                    pass
                    
                # For details elements, try to set open attribute
                try:
                    tag_name = await parent.evaluate("el => el.tagName.toLowerCase()")
                    if tag_name == "details":
                        await parent.evaluate("el => el.open = true")
                        await page.wait_for_timeout(300)
                except Exception:
                    pass
        except Exception:
            pass
    
    async def _upload_resume_if_present(self, page: Page, resume_path: str) -> bool:
        """Find resume upload field and upload the resume file"""
        from pathlib import Path
        
        resume_file = Path(resume_path)
        if not resume_file.exists():
            return False
        
        # Try to find file upload fields that might be for resume
        try:
            # Strategy 1: Find input[type="file"] with resume-related labels
            file_inputs = await page.query_selector_all('input[type="file"]')
            
            for file_input in file_inputs:
                try:
                    # Check if this field is related to resume
                    # Get associated label
                    field_id = await file_input.get_attribute("id")
                    field_name = await file_input.get_attribute("name")
                    
                    # Try to find label
                    label_text = ""
                    if field_id:
                        label = await page.query_selector(f'label[for="{field_id}"]')
                        if label:
                            label_text = await label.inner_text()
                    
                    # Check placeholder or aria-label
                    placeholder = await file_input.get_attribute("placeholder") or ""
                    aria_label = await file_input.get_attribute("aria-label") or ""
                    
                    # Combine all text to check
                    combined_text = f"{label_text} {field_name} {placeholder} {aria_label}".lower()
                    
                    if self._is_resume_field(combined_text):
                        # Upload the file
                        await file_input.set_input_files(str(resume_file.absolute()))
                        await page.wait_for_timeout(500)  # Wait for file to be processed
                        return True
                except Exception as e:
                    continue
            
            # Strategy 2: If no resume-specific field found, try the first file input
            if file_inputs:
                try:
                    await file_inputs[0].set_input_files(str(resume_file.absolute()))
                    await page.wait_for_timeout(500)
                    return True
                except Exception:
                    pass
                    
        except Exception as e:
            pass
        
        return False
    
    async def _find_field_by_partial_label(self, page: Page, label: str) -> Any:
        """Find field by partial label matching"""
        # Extract key words from label
        label_lower = label.lower()
        key_words = [word for word in label_lower.split() if len(word) > 3]
        
        for word in key_words:
            strategies = [
                f"//label[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{word}')]",
                f"//input[contains(translate(@placeholder, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{word}')]",
                f"//input[contains(translate(@name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{word}')]",
                f"//input[contains(translate(@id, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{word}')]",
            ]
            
            for strategy in strategies:
                try:
                    element = await page.query_selector(f"xpath={strategy}")
                    if element:
                        tag = await element.evaluate("el => el.tagName.toLowerCase()")
                        if tag == "label":
                            label_for = await element.get_attribute("for")
                            if label_for:
                                element = await page.query_selector(f"#{label_for}")
                            else:
                                element = await element.evaluate_handle("el => el.nextElementSibling")
                        if element:
                            return element
                except Exception:
                    continue
        
        return None
    
    async def close(self):
        if self.browser:
            try:
                await self.browser.close()
            except Exception:
                pass
            finally:
                self.browser = None

