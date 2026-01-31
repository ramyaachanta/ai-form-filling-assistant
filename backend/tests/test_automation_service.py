import pytest
from app.services.automation_service import AutomationService


@pytest.mark.asyncio
async def test_automation_service_initialization():
    """Test AutomationService initialization"""
    service = AutomationService()
    assert service is not None
    assert service.headless is not None
    assert service.timeout > 0


@pytest.mark.asyncio
async def test_find_field_by_label():
    """Test field finding logic (mocked)"""
    service = AutomationService()
    # This would require a mock page object
    # For now, just test that the method exists
    assert hasattr(service, '_find_field_by_label')


@pytest.mark.asyncio
async def test_browser_cleanup():
    """Test browser cleanup"""
    service = AutomationService()
    # Test that close method exists and can be called
    await service.close()
    assert service.browser is None or service.browser is None
