from openai import OpenAI
from app.config import settings
import base64
from typing import Dict, List, Any
import json
import asyncio


class VisionService:
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
    
    async def analyze_form(self, image_bytes: bytes) -> Dict[str, Any]:
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        prompt = """Analyze this form screenshot and extract all form fields. 
        Return a JSON structure with the following format:
        {
            "fields": [
                {
                    "label": "field label text",
                    "type": "text|email|password|select|checkbox|radio|textarea|number|tel|date",
                    "required": true/false,
                    "value": "suggested value if visible",
                    "options": ["option1", "option2"] // for select/radio
                }
            ],
            "actions": [
                {
                    "type": "type|click|select|scroll",
                    "target": "field label or description",
                    "value": "value to enter"
                }
            ]
        }
        
        Identify all input fields, dropdowns, checkboxes, and buttons.
        Determine which fields are required (marked with * or 'required' text).
        Extract any visible default values or placeholders.
        For dropdowns and radio buttons, list all available options if visible.
        """
        
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": prompt
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=2000,
                    temperature=0.1
                )
            )
            
            content = response.choices[0].message.content
            
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            form_structure = json.loads(content)
            
            return {
                "success": True,
                "method": "vision",
                "form_structure": form_structure
            }
            
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse JSON response from Vision API: {str(e)}")
        except Exception as e:
            raise Exception(f"Vision API error: {str(e)}")

