"""
HTML Parser Service for extracting form fields from HTML
"""
from bs4 import BeautifulSoup
import httpx
from typing import Dict, List, Any, Optional
import re


class HTMLParserService:
    """Service for parsing HTML forms and extracting field structure"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
    
    async def fetch_html(self, url: str) -> str:
        """
        Fetch HTML content from URL
        
        Args:
            url: URL to fetch
        
        Returns:
            HTML content as string
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = await self.client.get(url, headers=headers)
            response.raise_for_status()
            return response.text
        except Exception as e:
            raise Exception(f"Failed to fetch HTML from {url}: {str(e)}")
    
    def parse_form_fields(self, html: str, url: str = "") -> Dict[str, Any]:
        """
        Parse HTML and extract form fields
        
        Args:
            html: HTML content
            url: Source URL (for resolving relative paths)
        
        Returns:
            Dictionary with form structure
        """
        soup = BeautifulSoup(html, 'lxml')
        
        forms = soup.find_all('form')
        if not forms:
            forms = [soup]
        
        all_fields = []
        all_actions = []
        
        for form in forms:
            inputs = form.find_all(['input', 'select', 'textarea'])
            
            for inp in inputs:
                field_info = self._extract_field_info(inp, url)
                if field_info:
                    all_fields.append(field_info['field'])
                    all_actions.append(field_info['action'])
        
        return {
            "fields": all_fields,
            "actions": all_actions
        }
    
    def _extract_field_info(self, element, base_url: str = "") -> Optional[Dict[str, Any]]:
        """
        Extract field information from HTML element
        
        Args:
            element: BeautifulSoup element
            base_url: Base URL for resolving relative paths
        
        Returns:
            Dictionary with field and action info
        """
        tag_name = element.name.lower()
        
        field_type = element.get('type', 'text').lower()
        name = element.get('name', '')
        field_id = element.get('id', '')
        placeholder = element.get('placeholder', '')
        required = element.has_attr('required') or element.get('aria-required') == 'true'
        
        label_text = self._find_label_text(element, field_id, name)
        
        if not label_text:
            label_text = placeholder or name or field_id
        
        if not label_text:
            return None
        
        field = {
            "label": label_text,
            "type": self._determine_field_type(tag_name, field_type, name, label_text),
            "required": required,
            "value": element.get('value', ''),
            "options": []
        }
        
        if tag_name == 'select':
            options = element.find_all('option')
            field['options'] = [opt.get_text(strip=True) for opt in options if opt.get('value')]
        
        action = {
            "type": "type" if tag_name in ['input', 'textarea'] else "select",
            "target": label_text,
            "value": "",
            "selector": self._generate_selector(element, field_id, name)
        }
        
        return {
            "field": field,
            "action": action
        }
    
    def _find_label_text(self, element, field_id: str, name: str) -> str:
        """Find associated label text for a form field"""
        label_text = ""
        
        if field_id:
            label = element.find_previous('label', {'for': field_id})
            if label:
                label_text = label.get_text(strip=True)
        
        if not label_text:
            parent_label = element.find_parent('label')
            if parent_label:
                label_text = parent_label.get_text(strip=True)
        
        if not label_text:
            prev_sibling = element.find_previous_sibling(['label', 'span', 'div'])
            if prev_sibling:
                label_text = prev_sibling.get_text(strip=True)
        
        if not label_text and name:
            label_text = name.replace('_', ' ').replace('-', ' ').title()
        
        return label_text.strip()
    
    def _determine_field_type(self, tag: str, input_type: str, name: str, label: str) -> str:
        """Determine field type from various attributes"""
        if tag == 'select':
            return 'select'
        if tag == 'textarea':
            return 'textarea'
        
        if input_type in ['email', 'password', 'tel', 'number', 'date', 'checkbox', 'radio']:
            return input_type
        
        label_lower = label.lower()
        name_lower = name.lower()
        
        if 'email' in label_lower or 'email' in name_lower:
            return 'email'
        if 'phone' in label_lower or 'tel' in label_lower or 'phone' in name_lower:
            return 'tel'
        if 'password' in label_lower or 'password' in name_lower:
            return 'password'
        if 'date' in label_lower or 'date' in name_lower:
            return 'date'
        if 'number' in label_lower or 'zip' in label_lower or 'number' in name_lower:
            return 'number'
        
        return 'text'
    
    def _generate_selector(self, element, field_id: str, name: str) -> str:
        """Generate CSS selector for the field"""
        if field_id:
            return f"#{field_id}"
        if name:
            return f"[name='{name}']"
        return ""
    
    async def analyze_form_from_url(self, url: str) -> Dict[str, Any]:
        """
        Analyze form from URL
        
        Args:
            url: URL of the form page
        
        Returns:
            Dictionary with form structure
        """
        try:
            html = await self.fetch_html(url)
            form_structure = self.parse_form_fields(html, url)
            
            return {
                "success": True,
                "method": "html_parsing",
                "url": url,
                "form_structure": form_structure
            }
        except Exception as e:
            raise Exception(f"HTML parsing error: {str(e)}")
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

