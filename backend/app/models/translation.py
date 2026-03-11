"""Translation model for MongoDB."""

from datetime import datetime, timezone
from app.extensions import get_db

COLLECTION = 'translations'


class Translation:
    """Translation record model."""

    def __init__(self, user_id, original_text, processed_text=None,
                 sign_sequence=None, audio_duration=None,
                 confidence_score=None, status='pending',
                 _id=None, created_at=None):
        self._id = _id
        self.user_id = user_id
        self.original_text = original_text
        self.processed_text = processed_text
        self.sign_sequence = sign_sequence
        self.audio_duration = audio_duration
        self.confidence_score = confidence_score
        self.status = status
        self.created_at = created_at or datetime.now(timezone.utc)

    def to_doc(self) -> dict:
        doc = {
            'user_id': self.user_id,
            'original_text': self.original_text,
            'processed_text': self.processed_text,
            'sign_sequence': self.sign_sequence,
            'audio_duration': self.audio_duration,
            'confidence_score': self.confidence_score,
            'status': self.status,
            'created_at': self.created_at,
        }
        if self._id:
            doc['_id'] = self._id
        return doc

    def to_dict(self) -> dict:
        return {
            'id': str(self._id) if self._id else None,
            'user_id': str(self.user_id),
            'original_text': self.original_text,
            'processed_text': self.processed_text,
            'sign_sequence': self.sign_sequence,
            'audio_duration': self.audio_duration,
            'confidence_score': self.confidence_score,
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
    def find_by_user(user_id, page=1, per_page=20):
        skip = (page - 1) * per_page
        cursor = get_db()[COLLECTION].find({'user_id': user_id}).sort('created_at', -1).skip(skip).limit(per_page)
        total = get_db()[COLLECTION].count_documents({'user_id': user_id})
        items = [Translation.from_doc(doc) for doc in cursor]
        return items, total

    @staticmethod
    def from_doc(doc):
        if not doc:
            return None
        return Translation(
            _id=doc['_id'],
            user_id=doc['user_id'],
            original_text=doc['original_text'],
            processed_text=doc.get('processed_text'),
            sign_sequence=doc.get('sign_sequence'),
            audio_duration=doc.get('audio_duration'),
            confidence_score=doc.get('confidence_score'),
            status=doc.get('status', 'pending'),
            created_at=doc.get('created_at'),
        )

    @staticmethod
    def ensure_indexes():
        get_db()[COLLECTION].create_index('user_id')
        get_db()[COLLECTION].create_index('status')
        get_db()[COLLECTION].create_index([('created_at', -1)])

    def __repr__(self):
        return f'<Translation {self._id} - {self.status}>'
