"""
OCR Service for fallback text extraction when Vision API fails
"""
import easyocr
from PIL import Image
import io
from typing import Dict, Any
import json
import re
import asyncio


class OCRService:
    """Service for OCR-based form analysis as fallback"""
    
    def __init__(self):
        self.reader = easyocr.Reader(['en'], gpu=False)
    
    async def analyze_form(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyze form using OCR to extract text and infer form structure
        
        Args:
            image_bytes: Image file as bytes
        
        Returns:
            Dictionary with form structure extracted via OCR
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(
                None,
                lambda: self.reader.readtext(image)
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

