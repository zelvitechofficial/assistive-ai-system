"""Authentication API endpoints."""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.auth_service import AuthService
from app.utils.responses import success_response, created_response
from app.utils.errors import APIError

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user.

    Request Body:
        - username (str): Unique username
        - email (str): User email
        - password (str): Plain text password
        - first_name (str, optional): First name
        - last_name (str, optional): Last name

    Returns:
        201: User created with tokens
        400: Validation error
        409: Username/email already exists
    """
    try:
        data = request.get_json()

        if not data:
            raise APIError('Request body is required.', 400)

        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data or not data[field]:
                raise APIError(f'{field} is required.', 400)

        result = AuthService.register(
            username=data['username'].strip(),
            email=data['email'].strip(),
            password=data['password'],
            first_name=data.get('first_name', '').strip() or None,
            last_name=data.get('last_name', '').strip() or None,
        )

        return created_response(result, 'User registered successfully.')

    except APIError as e:
        return e.to_response()
    except Exception as e:
        logger.error(f'Registration error: {str(e)}')
        return jsonify({'success': False, 'message': 'Registration failed.'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user.

    Request Body:
        - email (str): User email
        - password (str): Plain text password

    Returns:
        200: Authentication successful with tokens
        401: Invalid credentials
    """
    try:
        data = request.get_json()

        if not data:
            raise APIError('Request body is required.', 400)

        if not data.get('email') or not data.get('password'):
            raise APIError('Email and password are required.', 400)

        result = AuthService.login(
            email=data['email'].strip(),
            password=data['password'],
        )

        return success_response(result, 'Login successful.')

    except APIError as e:
        return e.to_response()
    except Exception as e:
        logger.error(f'Login error: {str(e)}')
        return jsonify({'success': False, 'message': 'Login failed.'}), 500


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get authenticated user's profile.

    Headers:
        Authorization: Bearer <access_token>

    Returns:
        200: User profile data
        401: Token missing or invalid
    """
    try:
        user_id = get_jwt_identity()
        profile = AuthService.get_profile(user_id)
        return success_response(profile, 'Profile retrieved successfully.')

    except APIError as e:
        return e.to_response()
    except Exception as e:
        logger.error(f'Profile fetch error: {str(e)}')
        return jsonify({'success': False, 'message': 'Failed to fetch profile.'}), 500


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile.

    Headers:
        Authorization: Bearer <access_token>

    Request Body:
        - first_name (str, optional)
        - last_name (str, optional)
        - preferences (dict, optional)

    Returns:
        200: Updated profile
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data:
            raise APIError('Request body is required.', 400)

        profile = AuthService.update_profile(user_id, data)
        return success_response(profile, 'Profile updated successfully.')

    except APIError as e:
        return e.to_response()
    except Exception as e:
        logger.error(f'Profile update error: {str(e)}')
        return jsonify({'success': False, 'message': 'Failed to update profile.'}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client should discard tokens).

    Headers:
        Authorization: Bearer <access_token>

    Returns:
        200: Logout successful
    """
    return success_response(message='Logout successful. Please discard your tokens.')
