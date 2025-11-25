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
            
            return {
                "success": len(errors) == 0,
                "url": url,
                "executed_actions": executed_actions,
                "errors": errors,
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
    
    async def close(self):
        if self.browser:
            await self.browser.close()
            self.browser = None

