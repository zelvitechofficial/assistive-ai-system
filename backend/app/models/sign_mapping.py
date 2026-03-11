"""Sign mapping model for MongoDB."""

from datetime import datetime, timezone
from app.extensions import get_db

COLLECTION = 'sign_mappings'


class SignMapping:
    """Tamil word to sign language mapping model."""

    def __init__(self, tamil_word, sign_id, animation_data=None,
                 animation_url=None, category=None, description=None,
                 difficulty_level=1, is_active=True,
                 _id=None, created_at=None, updated_at=None):
        self._id = _id
        self.tamil_word = tamil_word
        self.sign_id = sign_id
        self.animation_data = animation_data
        self.animation_url = animation_url
        self.category = category
        self.description = description
        self.difficulty_level = difficulty_level
        self.is_active = is_active
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or datetime.now(timezone.utc)

    def to_doc(self) -> dict:
        doc = {
            'tamil_word': self.tamil_word,
            'sign_id': self.sign_id,
            'animation_data': self.animation_data,
            'animation_url': self.animation_url,
            'category': self.category,
            'description': self.description,
            'difficulty_level': self.difficulty_level,
            'is_active': self.is_active,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
        }
        if self._id:
            doc['_id'] = self._id
        return doc

    def to_dict(self) -> dict:
        return {
            'id': str(self._id) if self._id else None,
            'tamil_word': self.tamil_word,
            'sign_id': self.sign_id,
            'animation_data': self.animation_data,
            'animation_url': self.animation_url,
            'category': self.category,
            'description': self.description,
            'difficulty_level': self.difficulty_level,
            'is_active': self.is_active,
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
    def find_by_tamil_word(word, active_only=True):
        query = {'tamil_word': word}
        if active_only:
            query['is_active'] = True
        doc = get_db()[COLLECTION].find_one(query)
        return SignMapping.from_doc(doc) if doc else None

    @staticmethod
    def find_all_active():
        cursor = get_db()[COLLECTION].find({'is_active': True})
        return [SignMapping.from_doc(doc) for doc in cursor]

    @staticmethod
    def from_doc(doc):
        if not doc:
            return None
        return SignMapping(
            _id=doc['_id'],
            tamil_word=doc['tamil_word'],
            sign_id=doc['sign_id'],
            animation_data=doc.get('animation_data'),
            animation_url=doc.get('animation_url'),
            category=doc.get('category'),
            description=doc.get('description'),
            difficulty_level=doc.get('difficulty_level', 1),
            is_active=doc.get('is_active', True),
            created_at=doc.get('created_at'),
            updated_at=doc.get('updated_at'),
        )

    @staticmethod
    def ensure_indexes():
        get_db()[COLLECTION].create_index('tamil_word', unique=True)
        get_db()[COLLECTION].create_index('sign_id', unique=True)
        get_db()[COLLECTION].create_index('category')

    def __repr__(self):
        return f'<SignMapping {self.tamil_word} -> {self.sign_id}>'
