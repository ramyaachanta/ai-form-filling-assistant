from playwright.async_api import Page
from typing import Dict, List, Any, Optional
import asyncio


class MultiStepService:
    
    def __init__(self):
        self.step_indicators = [
            "step", "page", "stage", "part", "section",
            "progress", "wizard", "form-step"
        ]
        self.next_button_texts = [
            "next", "continue", "proceed", "forward", ">",
            "next step", "continue to", "go to next"
        ]
        self.back_button_texts = [
            "back", "previous", "return", "<", "go back"
        ]
    
    async def detect_multi_step_form(self, page: Page) -> bool:
        try:
            step_indicators = await page.query_selector_all(
                "[class*='step'], [class*='page'], [id*='step'], [id*='page'], "
                "[data-step], [data-page], .progress-bar, .wizard-step"
            )
            
            if len(step_indicators) > 0:
                return True
            
            next_buttons = await page.query_selector_all(
                "button:has-text('Next'), button:has-text('Continue'), "
                "a:has-text('Next'), input[value*='Next']"
            )
            
            if len(next_buttons) > 0:
                return True
            
            return False
        except Exception:
            return False
    
    async def find_next_button(self, page: Page) -> Optional[Any]:
        strategies = [
            "button:has-text('Next')",
            "button:has-text('Continue')",
            "button:has-text('Proceed')",
            "button[type='submit']:not([disabled])",
            "input[type='submit'][value*='Next']",
            "input[type='submit'][value*='Continue']",
            "a:has-text('Next')",
            "[class*='next-button']",
            "[id*='next']",
            "[data-action='next']"
        ]
        
        for strategy in strategies:
            try:
                button = await page.query_selector(strategy)
                if button and await button.is_visible():
                    return button
            except Exception:
                continue
        
        return None
    
    async def find_back_button(self, page: Page) -> Optional[Any]:
        strategies = [
            "button:has-text('Back')",
            "button:has-text('Previous')",
            "a:has-text('Back')",
            "[class*='back-button']",
            "[id*='back']",
            "[data-action='back']"
        ]
        
        for strategy in strategies:
            try:
                button = await page.query_selector(strategy)
                if button and await button.is_visible():
                    return button
            except Exception:
                continue
        
        return None
    
    async def get_current_step(self, page: Page) -> Optional[int]:
        try:
            step_elements = await page.query_selector_all(
                "[data-step], [class*='step-'], [id*='step']"
            )
            
            for element in step_elements:
                step_attr = await element.get_attribute("data-step")
                if step_attr:
                    try:
                        return int(step_attr)
                    except ValueError:
                        pass
                
                class_name = await element.get_attribute("class")
                if class_name and "active" in class_name.lower():
                    for part in class_name.split():
                        if "step" in part.lower():
                            try:
                                return int(''.join(filter(str.isdigit, part)))
                            except ValueError:
                                pass
            
            return None
        except Exception:
            return None
    
    async def navigate_to_next_step(self, page: Page) -> Dict[str, Any]:
        try:
            next_button = await self.find_next_button(page)
            
            if not next_button:
                return {
                    "success": False,
                    "error": "Next button not found"
                }
            
            await next_button.scroll_into_view_if_needed()
            await page.wait_for_timeout(500)
            
            await next_button.click()
            await page.wait_for_load_state("networkidle", timeout=10000)
            await page.wait_for_timeout(1000)
            
            current_step = await self.get_current_step(page)
            
            return {
                "success": True,
                "current_step": current_step,
                "message": "Navigated to next step"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def fill_multi_step_form(
        self,
        page: Page,
        form_data: Dict[str, Any],
        max_steps: int = 10
    ) -> Dict[str, Any]:
        executed_actions = []
        errors = []
        current_step_num = 1
        
        try:
            is_multi_step = await self.detect_multi_step_form(page)
            
            if not is_multi_step:
                return {
                    "success": False,
                    "error": "Not a multi-step form"
                }
            
            if isinstance(list(form_data.values())[0] if form_data else None, dict):
                step_data = form_data
            else:
                step_data = {"step1": form_data}
            
            for step_key, step_fields in step_data.items():
                if current_step_num > max_steps:
                    errors.append(f"Maximum steps ({max_steps}) reached")
                    break
                
                for label, value in step_fields.items():
                    try:
                        from app.services.automation_service import AutomationService
                        automation = AutomationService()
                        field = await automation._find_field_by_label(page, label)
                        
                        if not field:
                            errors.append(f"Field not found in step {current_step_num}: {label}")
                            continue
                        
                        await field.scroll_into_view_if_needed()
                        await page.wait_for_timeout(200)
                        
                        tag_name = await field.evaluate("el => el.tagName.toLowerCase()")
                        field_type = await field.get_attribute("type") or ""
                        
                        if tag_name == "select":
                            await field.select_option(value)
                            executed_actions.append(f"Step {current_step_num}: Selected '{value}' in {label}")
                        elif field_type == "checkbox":
                            is_checked = await field.is_checked()
                            if value and not is_checked:
                                await field.check()
                            elif not value and is_checked:
                                await field.uncheck()
                            executed_actions.append(f"Step {current_step_num}: Set checkbox {label}")
                        else:
                            await field.fill(str(value))
                            executed_actions.append(f"Step {current_step_num}: Filled {label}")
                    except Exception as e:
                        errors.append(f"Error filling {label} in step {current_step_num}: {str(e)}")
                
                if step_key != list(step_data.keys())[-1]:
                    nav_result = await self.navigate_to_next_step(page)
                    if not nav_result.get("success"):
                        errors.append(f"Failed to navigate from step {current_step_num}")
                        break
                    current_step_num += 1
            
            return {
                "success": len(errors) == 0,
                "steps_completed": current_step_num,
                "executed_actions": executed_actions,
                "errors": errors
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "executed_actions": executed_actions,
                "errors": errors
            }

