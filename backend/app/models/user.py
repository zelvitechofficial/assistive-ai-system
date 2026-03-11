"""User model for MongoDB."""

from datetime import datetime, timezone
import bcrypt
from app.extensions import get_db


COLLECTION = 'users'


class User:
    """User account model."""

    def __init__(self, username, email, password_hash=None,
                 first_name=None, last_name=None,
                 is_active=True, is_admin=False,
                 _id=None, created_at=None, updated_at=None):
        self._id = _id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.first_name = first_name
        self.last_name = last_name
        self.is_active = is_active
        self.is_admin = is_admin
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

    def set_password(self, password: str) -> None:
        salt = bcrypt.gensalt(rounds=12)
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'), salt
        ).decode('utf-8')

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self.password_hash.encode('utf-8')
        )

    def to_doc(self) -> dict:
        """Convert to MongoDB document."""
        doc = {
            'username': self.username,
            'email': self.email,
            'password_hash': self.password_hash,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'is_active': self.is_active,
            'is_admin': self.is_admin,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
        }
        if self._id:
            doc['_id'] = self._id
        return doc

    def to_dict(self) -> dict:
        """Serialize for API response."""
        return {
            'id': str(self._id) if self._id else None,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'is_active': self.is_active,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def save(self):
        """Insert or update in MongoDB."""
        self.updated_at = datetime.now(timezone.utc)
        if self._id:
            get_db()[COLLECTION].update_one(
                {'_id': self._id},
                {'$set': self.to_doc()}
            )
        else:
            result = get_db()[COLLECTION].insert_one(self.to_doc())
            self._id = result.inserted_id
        return self

    @staticmethod
    def find_by_id(user_id):
        from bson import ObjectId
        doc = get_db()[COLLECTION].find_one({'_id': ObjectId(user_id)})
        return User.from_doc(doc) if doc else None

    @staticmethod
    def find_by_username(username):
        doc = get_db()[COLLECTION].find_one({'username': username})
        return User.from_doc(doc) if doc else None

    @staticmethod
    def find_by_email(email):
        doc = get_db()[COLLECTION].find_one({'email': email})
        return User.from_doc(doc) if doc else None

    @staticmethod
    def from_doc(doc):
        if not doc:
            return None
        return User(
            _id=doc['_id'],
            username=doc['username'],
            email=doc['email'],
            password_hash=doc.get('password_hash'),
            first_name=doc.get('first_name'),
            last_name=doc.get('last_name'),
            is_active=doc.get('is_active', True),
            is_admin=doc.get('is_admin', False),
            created_at=doc.get('created_at'),
            updated_at=doc.get('updated_at'),
        )

    @staticmethod
    def ensure_indexes():
        get_db()[COLLECTION].create_index('username', unique=True)
        get_db()[COLLECTION].create_index('email', unique=True)

    def __repr__(self):
        return f'<User {self.username}>'
