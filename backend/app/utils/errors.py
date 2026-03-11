"""Global error handlers."""

from flask import jsonify


def _error_response(status_code, message, error_type=None):
    """Create a standardized error response."""
    response = {
        'success': False,
        'message': message,
        'error': error_type or f'http_{status_code}',
    }
    return jsonify(response), status_code


def handle_400(error):
    """Handle 400 Bad Request."""
    return _error_response(400, 'Bad request.', 'bad_request')


def handle_401(error):
    """Handle 401 Unauthorized."""
    return _error_response(401, 'Authentication required.', 'unauthorized')


def handle_403(error):
    """Handle 403 Forbidden."""
    return _error_response(403, 'Access forbidden.', 'forbidden')


def handle_404(error):
    """Handle 404 Not Found."""
    return _error_response(404, 'Resource not found.', 'not_found')


def handle_422(error):
    """Handle 422 Unprocessable Entity."""
    return _error_response(422, 'Unprocessable entity.', 'unprocessable_entity')


def handle_429(error):
    """Handle 429 Too Many Requests."""
    return _error_response(429, 'Rate limit exceeded. Please try again later.', 'rate_limited')


def handle_500(error):
    """Handle 500 Internal Server Error."""
    return _error_response(500, 'Internal server error.', 'internal_error')


class APIError(Exception):
    """Custom API error class."""

    def __init__(self, message, status_code=400, error_type=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_type = error_type or 'api_error'

    def to_response(self):
        """Convert exception to HTTP response."""
        return _error_response(self.status_code, self.message, self.error_type)
