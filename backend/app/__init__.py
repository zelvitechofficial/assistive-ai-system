"""Flask application factory."""

import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import config_by_name
from app.extensions import jwt, init_mongo


def create_app(config_name='development'):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # Initialize extensions
    init_mongo(app)
    jwt.init_app(app)

    # CORS
    CORS(app, origins=app.config.get('CORS_ORIGINS', ['*']))

    # Rate Limiter
    Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=[app.config.get('RATELIMIT_DEFAULT', '200/hour')],
        storage_uri=app.config.get('RATELIMIT_STORAGE_URI', 'memory://'),
    )

    # Setup logging
    _setup_logging(app)

    # Register blueprints
    _register_blueprints(app)

    # Register error handlers
    _register_error_handlers(app)

    # JWT callbacks
    _register_jwt_callbacks(app)

    # Ensure MongoDB indexes
    from app.models import ensure_indexes
    ensure_indexes()

    app.logger.info('Application initialized successfully.')
    return app


def _setup_logging(app):
    """Configure application logging."""
    log_level = getattr(logging, app.config.get('LOG_LEVEL', 'INFO').upper(), logging.INFO)

    # Ensure log directory exists
    log_file = app.config.get('LOG_FILE', 'logs/app.log')
    log_dir = os.path.dirname(log_file)
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir, exist_ok=True)

    # File handler
    file_handler = RotatingFileHandler(
        log_file, maxBytes=10 * 1024 * 1024, backupCount=5
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    ))

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    ))

    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(log_level)


def _register_blueprints(app):
    """Register all application blueprints."""
    from app.api.v1.auth import auth_bp
    from app.api.v1.translation import translation_bp
    from app.api.v1.system import system_bp

    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(translation_bp, url_prefix='/api/v1/translate')
    app.register_blueprint(system_bp, url_prefix='/api/v1')


def _register_error_handlers(app):
    """Register global error handlers."""
    from app.utils.errors import (
        handle_400, handle_401, handle_403, handle_404,
        handle_422, handle_429, handle_500
    )

    app.register_error_handler(400, handle_400)
    app.register_error_handler(401, handle_401)
    app.register_error_handler(403, handle_403)
    app.register_error_handler(404, handle_404)
    app.register_error_handler(422, handle_422)
    app.register_error_handler(429, handle_429)
    app.register_error_handler(500, handle_500)


def _register_jwt_callbacks(app):
    """Register JWT callback functions."""

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {
            'success': False,
            'message': 'Token has expired.',
            'error': 'token_expired'
        }, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {
            'success': False,
            'message': 'Invalid token.',
            'error': 'invalid_token'
        }, 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {
            'success': False,
            'message': 'Authorization token is missing.',
            'error': 'authorization_required'
        }, 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return {
            'success': False,
            'message': 'Token has been revoked.',
            'error': 'token_revoked'
        }, 401
