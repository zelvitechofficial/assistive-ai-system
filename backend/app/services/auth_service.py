"""Authentication service."""

import logging
from flask_jwt_extended import create_access_token, create_refresh_token
from app.models.user import User
from app.models.user_preference import UserPreference
from app.models.log import Log
from app.utils.validators import validate_email, validate_password, validate_username
from app.utils.errors import APIError

logger = logging.getLogger(__name__)


class AuthService:
    """Service for authentication operations."""

    @staticmethod
    def register(username: str, email: str, password: str,
                 first_name: str = None, last_name: str = None) -> dict:
        """Register a new user."""
        valid, msg = validate_username(username)
        if not valid:
            raise APIError(msg, 400)

        if not validate_email(email):
            raise APIError('Invalid email format.', 400)

        valid, msg = validate_password(password)
        if not valid:
            raise APIError(msg, 400)

        if User.find_by_username(username):
            raise APIError('Username already taken.', 409, 'conflict')

        if User.find_by_email(email):
            raise APIError('Email already registered.', 409, 'conflict')

        user = User(
            username=username,
            email=email.lower(),
            first_name=first_name,
            last_name=last_name,
        )
        user.set_password(password)
        user.save()

        preferences = UserPreference(user_id=user._id)
        preferences.save()

        log = Log(user_id=user._id, action='user_registered', details={'username': username})
        log.save()

        access_token = create_access_token(identity=str(user._id))
        refresh_token = create_refresh_token(identity=str(user._id))

        logger.info(f'User registered: {username}')

        return {
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token,
        }

    @staticmethod
    def login(email: str, password: str) -> dict:
        """Authenticate a user."""
        user = User.find_by_email(email.lower())

        if not user or not user.check_password(password):
            raise APIError('Invalid email or password.', 401, 'invalid_credentials')

        if not user.is_active:
            raise APIError('Account is deactivated.', 403, 'account_inactive')

        access_token = create_access_token(identity=str(user._id))
        refresh_token = create_refresh_token(identity=str(user._id))

        log = Log(user_id=user._id, action='user_login')
        log.save()

        logger.info(f'User logged in: {user.username}')

        return {
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token,
        }

    @staticmethod
    def get_profile(user_id: str) -> dict:
        """Get user profile with preferences."""
        user = User.find_by_id(user_id)
        if not user:
            raise APIError('User not found.', 404, 'not_found')

        profile = user.to_dict()
        prefs = UserPreference.find_by_user_id(user._id)
        if prefs:
            profile['preferences'] = prefs.to_dict()

        return profile

    @staticmethod
    def update_profile(user_id: str, data: dict) -> dict:
        """Update user profile."""
        user = User.find_by_id(user_id)
        if not user:
            raise APIError('User not found.', 404, 'not_found')

        allowed_fields = ['first_name', 'last_name']
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])
        user.save()

        if 'preferences' in data:
            prefs = UserPreference.find_by_user_id(user._id)
            if prefs:
                pref_fields = [
                    'avatar_style', 'avatar_skin_tone', 'avatar_gender',
                    'playback_speed', 'theme', 'language', 'notifications_enabled'
                ]
                for field in pref_fields:
                    if field in data['preferences']:
                        setattr(prefs, field, data['preferences'][field])
                prefs.save()

        logger.info(f'Profile updated: {user.username}')

        profile = user.to_dict()
        prefs = UserPreference.find_by_user_id(user._id)
        if prefs:
            profile['preferences'] = prefs.to_dict()

        return profile
