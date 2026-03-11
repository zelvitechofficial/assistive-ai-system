"""Response helper utilities."""

from flask import jsonify


def success_response(data=None, message='Success', status_code=200):
    """Create a standardized success response."""
    response = {
        'success': True,
        'message': message,
    }
    if data is not None:
        response['data'] = data
    return jsonify(response), status_code


def created_response(data=None, message='Created successfully'):
    """Create a 201 response."""
    return success_response(data, message, 201)


def paginated_response(items, total, page, per_page, message='Success'):
    """Create a paginated response."""
    response = {
        'success': True,
        'message': message,
        'data': items,
        'pagination': {
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page,
        }
    }
    return jsonify(response), 200
