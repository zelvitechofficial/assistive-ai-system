"""System API endpoints."""

import logging
from datetime import datetime, timezone
from flask import Blueprint, jsonify
from app.extensions import get_mongo_client

logger = logging.getLogger(__name__)

system_bp = Blueprint('system', __name__)


@system_bp.route('/healthcheck', methods=['GET'])
def healthcheck():
    """System health check."""
    status = {
        'status': 'healthy',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'version': '1.0.0',
        'services': {}
    }

    # Check database
    try:
        get_mongo_client().admin.command('ping')
        status['services']['database'] = 'connected'
    except Exception as e:
        status['services']['database'] = f'error: {str(e)}'
        status['status'] = 'degraded'
        logger.warning(f'Database health check failed: {str(e)}')

    # Check Google Speech API availability
    try:
        from google.cloud import speech  # noqa: F401
        status['services']['google_speech'] = 'available'
    except Exception:
        status['services']['google_speech'] = 'not_installed (mock mode)'

    http_status = 200 if status['status'] == 'healthy' else 503
    return jsonify(status), http_status
