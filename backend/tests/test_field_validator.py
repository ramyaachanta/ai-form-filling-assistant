import pytest
from app.utils.field_validator import FieldValidator


class TestFieldValidator:
    """Test suite for FieldValidator class"""
    
    def test_validate_email_valid(self):
        """Test email validation with valid emails"""
        valid_emails = [
            "test@example.com",
            "user.name@domain.co.uk",
            "user+tag@example.com",
            "user_name@example-domain.com",
            "123@456.com"
        ]
        for email in valid_emails:
            is_valid, error = FieldValidator.validate_email(email)
            assert is_valid, f"Email {email} should be valid"
            assert error == ""
    
    def test_validate_email_invalid(self):
        """Test email validation with invalid emails"""
        invalid_emails = [
            "invalid",
            "@example.com",
            "user@",
            "user@domain",
            "user name@example.com",
            ""
        ]
        for email in invalid_emails:
            is_valid, error = FieldValidator.validate_email(email)
            assert not is_valid, f"Email {email} should be invalid"
            assert error != ""
    
    def test_validate_phone_valid(self):
        """Test phone validation with valid phone numbers"""
        valid_phones = [
            "1234567890",
            "(123) 456-7890",
            "123-456-7890",
            "+1 123 456 7890",
            "123 456 7890",
            ""  # Phone is optional
        ]
        for phone in valid_phones:
            is_valid, error = FieldValidator.validate_phone(phone)
            assert is_valid, f"Phone {phone} should be valid"
            assert error == ""
    
    def test_validate_phone_invalid(self):
        """Test phone validation with invalid phone numbers"""
        invalid_phones = [
            "123",  # Too short
            "123456789",  # Too short (9 digits)
            "abc1234567",  # Contains letters
            "123-456-789",  # Too short after cleaning
        ]
        for phone in invalid_phones:
            is_valid, error = FieldValidator.validate_phone(phone)
            assert not is_valid, f"Phone {phone} should be invalid"
            assert error != ""
    
    def test_validate_url_valid(self):
        """Test URL validation with valid URLs"""
        valid_urls = [
            "http://example.com",
            "https://example.com",
            "https://www.example.com/path?query=value",
            "http://subdomain.example.com"
        ]
        for url in valid_urls:
            is_valid, error = FieldValidator.validate_url(url)
            assert is_valid, f"URL {url} should be valid"
            assert error == ""
    
    def test_validate_url_invalid(self):
        """Test URL validation with invalid URLs"""
        invalid_urls = [
            "",
            "example.com",  # Missing protocol
            "ftp://example.com",  # Wrong protocol
            "not-a-url"
        ]
        for url in invalid_urls:
            is_valid, error = FieldValidator.validate_url(url)
            assert not is_valid, f"URL {url} should be invalid"
            assert error != ""
    
    def test_validate_required(self):
        """Test required field validation"""
        # Valid cases
        assert FieldValidator.validate_required("value", "field") == (True, "")
        assert FieldValidator.validate_required(123, "field") == (True, "")
        assert FieldValidator.validate_required(0, "field") == (True, "")
        
        # Invalid cases
        is_valid, error = FieldValidator.validate_required(None, "field")
        assert not is_valid
        assert "field is required" in error
        
        is_valid, error = FieldValidator.validate_required("", "field")
        assert not is_valid
        assert "field is required" in error
        
        is_valid, error = FieldValidator.validate_required("   ", "field")
        assert not is_valid
        assert "field is required" in error
    
    def test_validate_field_email(self):
        """Test field validation for email type"""
        # Valid email
        is_valid, error = FieldValidator.validate_field("email", "test@example.com", "Email")
        assert is_valid
        assert error == ""
        
        # Invalid email
        is_valid, error = FieldValidator.validate_field("email", "invalid", "Email")
        assert not is_valid
        assert error != ""
        
        # Required email - empty
        is_valid, error = FieldValidator.validate_field("email", "", "Email", required=True)
        assert not is_valid
        assert error != ""
        
        # Optional email - empty (should pass)
        is_valid, error = FieldValidator.validate_field("email", "", "Email", required=False)
        assert is_valid
        assert error == ""
    
    def test_validate_field_phone(self):
        """Test field validation for phone type"""
        # Valid phone
        is_valid, error = FieldValidator.validate_field("tel", "1234567890", "Phone")
        assert is_valid
        assert error == ""
        
        # Invalid phone
        is_valid, error = FieldValidator.validate_field("tel", "123", "Phone")
        assert not is_valid
        assert error != ""
        
        # Optional phone - empty (should pass)
        is_valid, error = FieldValidator.validate_field("tel", "", "Phone", required=False)
        assert is_valid
        assert error == ""
    
    def test_validate_field_url(self):
        """Test field validation for URL type"""
        # Valid URL
        is_valid, error = FieldValidator.validate_field("url", "https://example.com", "URL")
        assert is_valid
        assert error == ""
        
        # Invalid URL
        is_valid, error = FieldValidator.validate_field("url", "example.com", "URL")
        assert not is_valid
        assert error != ""
        
        # Required URL - empty
        is_valid, error = FieldValidator.validate_field("url", "", "URL", required=True)
        assert not is_valid
        assert error != ""
    
    def test_validate_field_number(self):
        """Test field validation for number type"""
        # Valid numbers
        valid_numbers = ["123", "123.45", "-123", "0", "0.5"]
        for num in valid_numbers:
            is_valid, error = FieldValidator.validate_field("number", num, "Number")
            assert is_valid, f"Number {num} should be valid"
            assert error == ""
        
        # Invalid numbers
        invalid_numbers = ["abc", "12abc", "not-a-number"]
        for num in invalid_numbers:
            is_valid, error = FieldValidator.validate_field("number", num, "Number")
            assert not is_valid, f"Number {num} should be invalid"
            assert "must be a number" in error
        
        # Optional number - empty (should pass)
        is_valid, error = FieldValidator.validate_field("number", "", "Number", required=False)
        assert is_valid
        assert error == ""
    
    def test_validate_field_text(self):
        """Test field validation for text type (default)"""
        # Text fields should always pass validation
        is_valid, error = FieldValidator.validate_field("text", "any text", "Text")
        assert is_valid
        assert error == ""
        
        is_valid, error = FieldValidator.validate_field("text", "", "Text", required=False)
        assert is_valid
        assert error == ""
        
        is_valid, error = FieldValidator.validate_field("text", "", "Text", required=True)
        assert not is_valid
        assert error != ""
    
    def test_validate_form_data_valid(self):
        """Test form data validation with valid data"""
        form_structure = {
            "fields": [
                {"label": "Email", "type": "email", "required": True},
                {"label": "Phone", "type": "tel", "required": False},
                {"label": "Name", "type": "text", "required": True}
            ]
        }
        form_data = {
            "Email": "test@example.com",
            "Phone": "1234567890",
            "Name": "John Doe"
        }
        is_valid, errors = FieldValidator.validate_form_data(form_data, form_structure)
        assert is_valid
        assert len(errors) == 0
    
    def test_validate_form_data_invalid(self):
        """Test form data validation with invalid data"""
        form_structure = {
            "fields": [
                {"label": "Email", "type": "email", "required": True},
                {"label": "Phone", "type": "tel", "required": False},
                {"label": "Name", "type": "text", "required": True}
            ]
        }
        form_data = {
            "Email": "invalid-email",
            "Phone": "123",  # Too short
            "Name": ""  # Required but empty
        }
        is_valid, errors = FieldValidator.validate_form_data(form_data, form_structure)
        assert not is_valid
        assert len(errors) > 0
        assert any("email" in error.lower() or "Email" in error for error in errors)
        assert any("Name" in error and "required" in error for error in errors)
    
    def test_validate_form_data_unknown_field(self):
        """Test form data validation with unknown fields"""
        form_structure = {
            "fields": [
                {"label": "Email", "type": "email", "required": True}
            ]
        }
        form_data = {
            "Email": "test@example.com",
            "UnknownField": "value"
        }
        is_valid, errors = FieldValidator.validate_form_data(form_data, form_structure)
        assert not is_valid
        assert any("Unknown field" in error for error in errors)
    
    def test_validate_form_data_missing_required(self):
        """Test form data validation with missing required fields"""
        form_structure = {
            "fields": [
                {"label": "Email", "type": "email", "required": True},
                {"label": "Name", "type": "text", "required": True},
                {"label": "Phone", "type": "tel", "required": False}
            ]
        }
        form_data = {
            "Email": "test@example.com"
            # Missing Name (required)
        }
        is_valid, errors = FieldValidator.validate_form_data(form_data, form_structure)
        assert not is_valid
        assert any("Name" in error and "required" in error for error in errors)
    
    def test_validate_form_data_empty_structure(self):
        """Test form data validation with empty form structure"""
        form_structure = {"fields": []}
        form_data = {"Email": "test@example.com"}
        is_valid, errors = FieldValidator.validate_form_data(form_data, form_structure)
        assert not is_valid
        assert any("Unknown field" in error for error in errors)
    
    def test_validate_form_data_no_fields_key(self):
        """Test form data validation when form structure has no fields key"""
        form_structure = {}
        form_data = {"Email": "test@example.com"}
        is_valid, errors = FieldValidator.validate_form_data(form_data, form_structure)
        assert not is_valid
        assert any("Unknown field" in error for error in errors)

