"""Backend test configuration."""

import pytest
from app import create_app
from app.extensions import get_db


@pytest.fixture(scope='session')
def app():
    """Create application for testing."""
    app = create_app('testing')
    return app


@pytest.fixture(autouse=True)
def clean_db(app):
    """Drop all collections before each test."""
    with app.app_context():
        for name in get_db().list_collection_names():
            get_db().drop_collection(name)
    yield


@pytest.fixture(scope='function')
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture(scope='function')
def auth_headers(client):
    """Create authenticated headers by registering and logging in a test user."""
    import uuid
    uid = uuid.uuid4().hex[:8]

    register_data = {
        'username': f'testuser_{uid}',
        'email': f'test_{uid}@example.com',
        'password': 'TestPass@123',
        'first_name': 'Test',
        'last_name': 'User',
    }
    response = client.post('/api/v1/auth/register', json=register_data)
    data = response.get_json()

    token = data['data']['access_token']
    return {'Authorization': f'Bearer {token}'}
