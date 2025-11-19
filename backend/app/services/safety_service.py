"""
Safety Service for form filling preview and confirmation
"""
from typing import Dict, List, Any
from app.services.automation_service import AutomationService
from app.utils.field_validator import FieldValidator
from app.utils.field_matcher import FieldMatcher


class SafetyService:
    """Service for safety checks and preview before form filling"""
    
    def __init__(self):
        self.automation_service = AutomationService()
        self.validator = FieldValidator()
        self.matcher = FieldMatcher()
    
    async def preview_actions(self, url: str, form_data: Dict[str, Any], form_structure: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Preview actions that will be performed
        
        Args:
            url: URL of the form
            form_data: Data to fill
            form_structure: Optional form structure (if not provided, will be fetched)
        
        Returns:
            Preview of actions with validation results
        """
        if not form_structure:
            from app.services.html_parser_service import HTMLParserService
            html_parser = HTMLParserService()
            try:
                result = await html_parser.analyze_form_from_url(url)
                form_structure = result.get('form_structure', {})
            except Exception:
                form_structure = {"fields": [], "actions": []}
        
        fields = form_structure.get('fields', [])
        
        matched_data = self.matcher.match_form_data_to_fields(form_data, fields)
        
        is_valid, errors = self.validator.validate_form_data(matched_data, form_structure)
        
        actions = []
        for label, value in matched_data.items():
            field = next((f for f in fields if f['label'] == label), None)
            if field:
                field_type = field.get('type', 'text')
                actions.append({
                    "action": "fill" if field_type != 'select' else "select",
                    "field": label,
                    "type": field_type,
                    "value": str(value),
                    "required": field.get('required', False)
                })
        
        return {
            "url": url,
            "total_fields": len(fields),
            "fields_to_fill": len(actions),
            "actions": actions,
            "validation": {
                "is_valid": is_valid,
                "errors": errors
            },
            "warnings": self._generate_warnings(matched_data, fields)
        }
    
    def _generate_warnings(self, form_data: Dict[str, Any], fields: List[Dict[str, Any]]) -> List[str]:
        """Generate warnings for potential issues"""
        warnings = []
        
        required_fields = [f for f in fields if f.get('required', False)]
        for field in required_fields:
            if field['label'] not in form_data or not form_data[field['label']]:
                warnings.append(f"Required field '{field['label']}' is missing")
        
        for key in form_data:
            if not any(f['label'] == key for f in fields):
                warnings.append(f"Field '{key}' not found in form structure")
        
        return warnings
    
    async def dry_run(self, url: str, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform dry run - detect fields without filling
        
        Args:
            url: URL of the form
            form_data: Data that would be filled
        
        Returns:
            Dry run results
        """
        from app.services.html_parser_service import HTMLParserService
        html_parser = HTMLParserService()
        
        try:
            result = await html_parser.analyze_form_from_url(url)
            form_structure = result.get('form_structure', {})
            
            preview = await self.preview_actions(url, form_data, form_structure)
            
            return {
                "success": True,
                "dry_run": True,
                "form_structure": form_structure,
                "preview": preview,
                "message": "Dry run completed - no data was filled"
            }
        except Exception as e:
            return {
                "success": False,
                "dry_run": True,
                "error": str(e)
            }

