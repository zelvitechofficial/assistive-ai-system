"""Validation utilities."""

import re


def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password(password: str) -> tuple[bool, str]:
    """Validate password strength.
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, 'Password must be at least 8 characters long.'
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter.'
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter.'
    if not re.search(r'\d', password):
        return False, 'Password must contain at least one digit.'
    return True, ''


def validate_username(username: str) -> tuple[bool, str]:
    """Validate username format.
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(username) < 3:
        return False, 'Username must be at least 3 characters long.'
    if len(username) > 80:
        return False, 'Username must be at most 80 characters long.'
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, 'Username can only contain letters, numbers, and underscores.'
    return True, ''


def sanitize_string(value: str) -> str:
    """Sanitize a string by stripping whitespace and control characters."""
    if not isinstance(value, str):
        return ''
    # Strip whitespace and remove control characters
    return re.sub(r'[\x00-\x1f\x7f-\x9f]', '', value.strip())
