import pytest
from app.services.auth_service import AuthService
from app.models.user import UserCreate


@pytest.mark.asyncio
async def test_create_user(test_db):
    """Test user creation"""
    user_data = UserCreate(
        email="test@example.com",
        password="testpassword123"
    )
    user = await AuthService.create_user(test_db, user_data)
    
    assert user is not None
    assert user.email == "test@example.com"
    assert user.hashed_password != "testpassword123"  # Should be hashed
    assert user.id is not None


@pytest.mark.asyncio
async def test_authenticate_user(test_db):
    """Test user authentication"""
    # Create user first
    user_data = UserCreate(
        email="auth@example.com",
        password="password123"
    )
    created_user = await AuthService.create_user(test_db, user_data)
    
    # Test correct password
    authenticated = await AuthService.authenticate_user(
        test_db, "auth@example.com", "password123"
    )
    assert authenticated is not None
    assert authenticated.email == "auth@example.com"
    
    # Test wrong password
    not_authenticated = await AuthService.authenticate_user(
        test_db, "auth@example.com", "wrongpassword"
    )
    assert not_authenticated is None
    
    # Test non-existent user
    not_found = await AuthService.authenticate_user(
        test_db, "nonexistent@example.com", "password123"
    )
    assert not_found is None


@pytest.mark.asyncio
async def test_get_user_by_email(test_db):
    """Test getting user by email"""
    user_data = UserCreate(
        email="getuser@example.com",
        password="password123"
    )
    created_user = await AuthService.create_user(test_db, user_data)
    
    found_user = await AuthService.get_user_by_email(test_db, "getuser@example.com")
    assert found_user is not None
    assert found_user.email == "getuser@example.com"
    
    not_found = await AuthService.get_user_by_email(test_db, "notfound@example.com")
    assert not_found is None


def test_create_access_token():
    """Test JWT token creation"""
    data = {"sub": "user123"}
    token = AuthService.create_access_token(data)
    
    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 0


def test_verify_token():
    """Test JWT token verification"""
    data = {"sub": "user123"}
    token = AuthService.create_access_token(data)
    
    payload = AuthService.verify_token(token)
    assert payload is not None
    assert payload["sub"] == "user123"
    
    # Test invalid token
    invalid_payload = AuthService.verify_token("invalid.token.here")
    assert invalid_payload is None
