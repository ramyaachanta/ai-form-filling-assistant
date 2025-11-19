"""
Field validation utilities
"""
import re
from typing import Dict, Any, List, Tuple


class FieldValidator:
    """Utility class for validating form field values"""
    
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    PHONE_PATTERN = re.compile(r'^[\d\s\-\+\(\)]+$')
    URL_PATTERN = re.compile(r'^https?://.+')
    
    @staticmethod
    def validate_email(email: str) -> Tuple[bool, str]:
        """
        Validate email format
        
        Args:
            email: Email string to validate
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not email:
            return False, "Email is required"
        if not FieldValidator.EMAIL_PATTERN.match(email):
            return False, "Invalid email format"
        return True, ""
    
    @staticmethod
    def validate_phone(phone: str) -> Tuple[bool, str]:
        """
        Validate phone number format
        
        Args:
            phone: Phone string to validate
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not phone:
            return True, ""
        cleaned = re.sub(r'[\s\-\(\)]', '', phone)
        if not cleaned.isdigit() or len(cleaned) < 10:
            return False, "Invalid phone number format"
        return True, ""
    
    @staticmethod
    def validate_url(url: str) -> Tuple[bool, str]:
        """
        Validate URL format
        
        Args:
            url: URL string to validate
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not url:
            return False, "URL is required"
        if not FieldValidator.URL_PATTERN.match(url):
            return False, "Invalid URL format"
        return True, ""
    
    @staticmethod
    def validate_required(value: Any, field_name: str) -> Tuple[bool, str]:
        """
        Validate required field
        
        Args:
            value: Field value
            field_name: Name of the field
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if value is None or (isinstance(value, str) and not value.strip()):
            return False, f"{field_name} is required"
        return True, ""
    
    @staticmethod
    def validate_field(field_type: str, value: Any, field_name: str, required: bool = False) -> Tuple[bool, str]:
        """
        Validate a field based on its type
        
        Args:
            field_type: Type of field (email, tel, url, etc.)
            value: Field value
            field_name: Name of the field
            required: Whether field is required
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if required:
            is_valid, error = FieldValidator.validate_required(value, field_name)
            if not is_valid:
                return False, error
        
        if not value:
            return True, ""
        
        value_str = str(value)
        
        if field_type == 'email':
            return FieldValidator.validate_email(value_str)
        elif field_type == 'tel':
            return FieldValidator.validate_phone(value_str)
        elif field_type == 'url':
            return FieldValidator.validate_url(value_str)
        elif field_type == 'number':
            try:
                float(value_str)
                return True, ""
            except ValueError:
                return False, f"{field_name} must be a number"
        
        return True, ""
    
    @staticmethod
    def validate_form_data(form_data: Dict[str, Any], form_structure: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate all form data against form structure
        
        Args:
            form_data: Data to fill
            form_structure: Form structure from analysis
        
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        fields = form_structure.get('fields', [])
        
        field_map = {field['label']: field for field in fields}
        
        for field in fields:
            label = field['label']
            field_type = field.get('type', 'text')
            required = field.get('required', False)
            value = form_data.get(label, '')
            
            is_valid, error = FieldValidator.validate_field(field_type, value, label, required)
            if not is_valid:
                errors.append(error)
        
        for key in form_data:
            if key not in field_map:
                errors.append(f"Unknown field: {key}")
        
        return len(errors) == 0, errors

