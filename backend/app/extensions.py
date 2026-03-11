"""Flask extension instances."""

from flask_jwt_extended import JWTManager
from pymongo import MongoClient

jwt = JWTManager()
_mongo_client = None
_db = None


def get_db():
    """Return the MongoDB database instance."""
    return _db


def get_mongo_client():
    """Return the MongoDB client instance."""
    return _mongo_client


def init_mongo(app):
    """Initialize MongoDB connection."""
    global _mongo_client, _db
    mongo_uri = app.config.get('MONGO_URI', 'mongodb://localhost:27017/')
    db_name = app.config.get('MONGO_DB_NAME', 'tsl_app')
    _mongo_client = MongoClient(mongo_uri)
    _db = _mongo_client[db_name]
    app.logger.info(f'Connected to MongoDB: {db_name}')
    return _db
