"""Tests for authentication endpoints."""

import pytest
import uuid


def _uid():
    """Generate a short unique ID for test data."""
    return uuid.uuid4().hex[:8]


class TestAuthRegister:
    """Test user registration."""

    def test_register_success(self, client):
        """Test successful registration."""
        uid = _uid()
        data = {
            'username': f'newuser_{uid}',
            'email': f'newuser_{uid}@example.com',
            'password': 'NewPass@123',
            'first_name': 'New',
            'last_name': 'User',
        }
        response = client.post('/api/v1/auth/register', json=data)
        result = response.get_json()

        assert response.status_code == 201
        assert result['success'] is True
        assert 'access_token' in result['data']
        assert 'refresh_token' in result['data']

    def test_register_missing_fields(self, client):
        """Test registration with missing fields."""
        data = {'username': 'incomplete'}
        response = client.post('/api/v1/auth/register', json=data)

        assert response.status_code == 400

    def test_register_invalid_email(self, client):
        """Test registration with invalid email."""
        data = {
            'username': 'user2',
            'email': 'notanemail',
            'password': 'Pass@123',
        }
        response = client.post('/api/v1/auth/register', json=data)

        assert response.status_code == 400

    def test_register_weak_password(self, client):
        """Test registration with weak password."""
        data = {
            'username': 'user3',
            'email': 'user3@example.com',
            'password': '123',
        }
        response = client.post('/api/v1/auth/register', json=data)

        assert response.status_code == 400

    def test_register_duplicate_username(self, client):
        """Test registration with duplicate username."""
        uid = _uid()
        data = {
            'username': f'dupuser_{uid}',
            'email': f'dup1_{uid}@example.com',
            'password': 'Pass@123',
        }
        client.post('/api/v1/auth/register', json=data)

        data['email'] = f'dup2_{uid}@example.com'
        response = client.post('/api/v1/auth/register', json=data)

        assert response.status_code == 409


class TestAuthLogin:
    """Test user login."""

    def test_login_success(self, client):
        """Test successful login."""
        uid = _uid()
        # Register first
        reg_data = {
            'username': f'loginuser_{uid}',
            'email': f'login_{uid}@example.com',
            'password': 'Login@123',
        }
        client.post('/api/v1/auth/register', json=reg_data)

        # Login
        login_data = {
            'email': f'login_{uid}@example.com',
            'password': 'Login@123',
        }
        response = client.post('/api/v1/auth/login', json=login_data)
        result = response.get_json()

        assert response.status_code == 200
        assert result['success'] is True
        assert 'access_token' in result['data']

    def test_login_invalid_credentials(self, client):
        """Test login with wrong password."""
        data = {
            'email': 'login@example.com',
            'password': 'WrongPass@123',
        }
        response = client.post('/api/v1/auth/login', json=data)

        assert response.status_code == 401

    def test_login_missing_fields(self, client):
        """Test login with missing fields."""
        response = client.post('/api/v1/auth/login', json={})

        assert response.status_code == 400


class TestAuthProfile:
    """Test profile operations."""

    def test_get_profile(self, client, auth_headers):
        """Test getting user profile."""
        response = client.get('/api/v1/auth/profile', headers=auth_headers)
        result = response.get_json()

        assert response.status_code == 200
        assert result['success'] is True
        assert 'username' in result['data']

    def test_get_profile_unauthorized(self, client):
        """Test profile access without token."""
        response = client.get('/api/v1/auth/profile')

        assert response.status_code == 401

    def test_update_profile(self, client, auth_headers):
        """Test updating user profile."""
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
        }
        response = client.put('/api/v1/auth/profile', json=data, headers=auth_headers)
        result = response.get_json()

        assert response.status_code == 200
        assert result['data']['first_name'] == 'Updated'


class TestAuthLogout:
    """Test logout."""

    def test_logout(self, client, auth_headers):
        """Test logout."""
        response = client.post('/api/v1/auth/logout', headers=auth_headers)

        assert response.status_code == 200
