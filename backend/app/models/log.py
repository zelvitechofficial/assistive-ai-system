"""System log model for MongoDB."""

from datetime import datetime, timezone
from app.extensions import get_db

COLLECTION = 'logs'


class Log:
    """System activity log model."""

    def __init__(self, user_id=None, action='', details=None,
                 ip_address=None, user_agent=None, status='success',
                 _id=None, created_at=None):
        self._id = _id
        self.user_id = user_id
        self.action = action
        self.details = details
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.status = status
        self.created_at = created_at or datetime.now(timezone.utc)

    def to_doc(self) -> dict:
        doc = {
            'user_id': self.user_id,
            'action': self.action,
            'details': self.details,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'status': self.status,
            'created_at': self.created_at,
        }
        if self._id:
            doc['_id'] = self._id
        return doc

    def to_dict(self) -> dict:
        return {
            'id': str(self._id) if self._id else None,
            'user_id': str(self.user_id) if self.user_id else None,
            'action': self.action,
            'details': self.details,
            'ip_address': self.ip_address,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def save(self):
        if self._id:
            get_db()[COLLECTION].update_one({'_id': self._id}, {'$set': self.to_doc()})
        else:
            result = get_db()[COLLECTION].insert_one(self.to_doc())
            self._id = result.inserted_id
        return self

    @staticmethod
    def ensure_indexes():
        get_db()[COLLECTION].create_index('user_id')
        get_db()[COLLECTION].create_index('action')
        get_db()[COLLECTION].create_index([('created_at', -1)])

    def __repr__(self):
        return f'<Log {self.action} - {self.status}>'
