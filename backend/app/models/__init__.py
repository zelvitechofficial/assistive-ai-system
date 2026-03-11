"""Database models package."""

from app.models.user import User
from app.models.translation import Translation
from app.models.sign_mapping import SignMapping
from app.models.user_preference import UserPreference
from app.models.log import Log

__all__ = ['User', 'Translation', 'SignMapping', 'UserPreference', 'Log']


def ensure_indexes():
    """Create MongoDB indexes for all collections."""
    User.ensure_indexes()
    Translation.ensure_indexes()
    SignMapping.ensure_indexes()
    UserPreference.ensure_indexes()
    Log.ensure_indexes()
