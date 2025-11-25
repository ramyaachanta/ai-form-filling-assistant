from PIL import Image
import io
import numpy as np
from typing import Dict, Any
import json
import re
import asyncio

if not hasattr(Image, 'ANTIALIAS'):
    if hasattr(Image, 'Resampling'):
        Image.ANTIALIAS = Image.Resampling.LANCZOS
    elif hasattr(Image, 'LANCZOS'):
        Image.ANTIALIAS = Image.LANCZOS

import easyocr


class OCRService:
    
    def __init__(self):
        self.reader = easyocr.Reader(['en'], gpu=False)
    
    async def analyze_form(self, image_bytes: bytes) -> Dict[str, Any]:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            image_array = np.array(image)
            
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(
                None,
                lambda: self.reader.readtext(image_array)
            )
            
            extracted_text = []
            for (bbox, text, confidence) in results:
                if confidence > 0.5:
                    extracted_text.append(text)
            
            fields = []
            labels = []
            
            field_keywords = ['name', 'email', 'phone', 'address', 'city', 'state', 
                            'zip', 'country', 'password', 'confirm', 'submit', 'button']
            
            for text in extracted_text:
                text_lower = text.lower()
                if any(keyword in text_lower for keyword in field_keywords):
                    labels.append(text)
            
            form_structure = {
                "fields": [],
                "actions": []
            }
            
            for label in labels:
                label_lower = label.lower()
                field_type = "text"
                
                if "email" in label_lower:
                    field_type = "email"
                elif "phone" in label_lower or "tel" in label_lower:
                    field_type = "tel"
                elif "password" in label_lower:
                    field_type = "password"
                elif "date" in label_lower:
                    field_type = "date"
                elif "number" in label_lower or "zip" in label_lower:
                    field_type = "number"
                
                field = {
                    "label": label,
                    "type": field_type,
                    "required": "*" in label or "required" in label_lower,
                    "value": "",
                    "options": []
                }
                form_structure["fields"].append(field)
                
                action = {
                    "type": "type",
                    "target": label,
                    "value": ""
                }
                form_structure["actions"].append(action)
            
            return {
                "success": True,
                "method": "ocr",
                "extracted_text": extracted_text,
                "form_structure": form_structure
            }
            
        except Exception as e:
            raise Exception(f"OCR error: {str(e)}")

