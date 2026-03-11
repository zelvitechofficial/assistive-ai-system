"""User preference model for MongoDB."""

from datetime import datetime, timezone
from app.extensions import get_db

COLLECTION = 'user_preferences'


class UserPreference:
    """User preference and avatar settings model."""

    def __init__(self, user_id, avatar_style='default',
                 avatar_skin_tone='medium', avatar_gender='neutral',
                 playback_speed=1.0, theme='light', language='ta',
                 notifications_enabled=True,
                 _id=None, created_at=None, updated_at=None):
        self._id = _id
        self.user_id = user_id
        self.avatar_style = avatar_style
        self.avatar_skin_tone = avatar_skin_tone
        self.avatar_gender = avatar_gender
        self.playback_speed = playback_speed
        self.theme = theme
        self.language = language
        self.notifications_enabled = notifications_enabled
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

    def to_doc(self) -> dict:
        doc = {
            'user_id': self.user_id,
            'avatar_style': self.avatar_style,
            'avatar_skin_tone': self.avatar_skin_tone,
            'avatar_gender': self.avatar_gender,
            'playback_speed': self.playback_speed,
            'theme': self.theme,
            'language': self.language,
            'notifications_enabled': self.notifications_enabled,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
        }
        if self._id:
            doc['_id'] = self._id
        return doc

    def to_dict(self) -> dict:
        return {
            'id': str(self._id) if self._id else None,
            'user_id': str(self.user_id),
            'avatar_style': self.avatar_style,
            'avatar_skin_tone': self.avatar_skin_tone,
            'avatar_gender': self.avatar_gender,
            'playback_speed': self.playback_speed,
            'theme': self.theme,
            'language': self.language,
            'notifications_enabled': self.notifications_enabled,
        }

    def save(self):
        self.updated_at = datetime.now(timezone.utc)
        if self._id:
            get_db()[COLLECTION].update_one({'_id': self._id}, {'$set': self.to_doc()})
        else:
            result = get_db()[COLLECTION].insert_one(self.to_doc())
            self._id = result.inserted_id
        return self

    @staticmethod
    def find_by_user_id(user_id):
        doc = get_db()[COLLECTION].find_one({'user_id': user_id})
        return UserPreference.from_doc(doc) if doc else None

    @staticmethod
    def from_doc(doc):
        if not doc:
            return None
        return UserPreference(
            _id=doc['_id'],
            user_id=doc['user_id'],
            avatar_style=doc.get('avatar_style', 'default'),
            avatar_skin_tone=doc.get('avatar_skin_tone', 'medium'),
            avatar_gender=doc.get('avatar_gender', 'neutral'),
            playback_speed=doc.get('playback_speed', 1.0),
            theme=doc.get('theme', 'light'),
            language=doc.get('language', 'ta'),
            notifications_enabled=doc.get('notifications_enabled', True),
            created_at=doc.get('created_at'),
            updated_at=doc.get('updated_at'),
        )

    @staticmethod
    def ensure_indexes():
        get_db()[COLLECTION].create_index('user_id', unique=True)

    def __repr__(self):
        return f'<UserPreference user_id={self.user_id}>'
