"""Translation API endpoints."""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.translation_service import TranslationService
from app.services.nlp_service import NLPService
from app.services.sign_language_service import SignLanguageService
from app.services.fingerspelling_service import TLFS23Engine
from app.utils.responses import success_response
from app.utils.errors import APIError

logger = logging.getLogger(__name__)

translation_bp = Blueprint('translation', __name__)


@translation_bp.route('/speech/recognize', methods=['POST'])
@jwt_required()
def recognize_speech():
    """Recognize Tamil speech from audio.

    Request Body:
        - audio (str): Base64 encoded audio data
        - encoding (str, optional): Audio encoding (default: LINEAR16)
        - sample_rate (int, optional): Sample rate in Hz (default: 16000)

    Returns:
        200: Recognized Tamil text with confidence
    """
    try:
        data = request.get_json()

        if not data or not data.get('audio'):
            raise APIError('Audio data is required.', 400)

        result = TranslationService.recognize_speech(
            audio_base64=data['audio'],
            encoding=data.get('encoding', 'LINEAR16'),
            sample_rate=data.get('sample_rate', 16000),
        )

        return success_response(result, 'Speech recognized successfully.')

    except APIError as e:
        return e.to_response()
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    except Exception as e:
        logger.error(f'Speech recognition error: {str(e)}')
        return jsonify({'success': False, 'message': 'Speech recognition failed.'}), 500


@translation_bp.route('/nlp/process', methods=['POST'])
@jwt_required()
def process_nlp():
    """Process Tamil text through NLP pipeline.

    Request Body:
        - text (str): Tamil text to process

    Returns:
        200: NLP processed results with sign tokens
    """
    try:
        data = request.get_json()

        if not data or 'text' not in data:
            raise APIError('Tamil text is required.', 400)

        result = TranslationService.process_nlp(data['text'])

        return success_response(result, 'NLP processing complete.')

    except APIError as e:
        return e.to_response()
    except Exception as e:
        logger.error(f'NLP processing error: {str(e)}')
        return jsonify({'success': False, 'message': 'NLP processing failed.'}), 500


@translation_bp.route('/avatar/generate', methods=['POST'])
@jwt_required()
def generate_avatar():
    """Generate avatar animation from sign tokens.

    Request Body:
        - sign_tokens (list): Sign tokens from NLP processing
        - playback_speed (float, optional): Speed multiplier (default: 1.0)

    Returns:
        200: Animation timeline with keyframes
    """
    try:
        data = request.get_json()

        if not data or not data.get('sign_tokens'):
            raise APIError('Sign tokens are required.', 400)

        result = TranslationService.generate_avatar(
            sign_tokens=data['sign_tokens'],
            playback_speed=data.get('playback_speed', 1.0),
        )

        return success_response(result, 'Avatar animation generated.')

    except APIError as e:
        return e.to_response()
    except Exception as e:
        logger.error(f'Avatar generation error: {str(e)}')
        return jsonify({'success': False, 'message': 'Avatar generation failed.'}), 500


@translation_bp.route('/fingerspelling/generate', methods=['POST'])
@jwt_required()
def generate_fingerspelling():
    """Generate finger spelling animation for a Tamil word.

    Request Body:
        - word (str): Tamil word to finger spell
        - char_duration (int, optional): Duration per character in ms (default: 400)

    Returns:
        200: Finger spelling animation sequence
    """
    try:
        data = request.get_json()

        if not data or not data.get('word'):
            raise APIError('Tamil word is required.', 400)

        result = TranslationService.generate_fingerspelling(
            word=data['word'],
            char_duration=data.get('char_duration', 400),
        )

        return success_response(result, 'Finger spelling generated.')

    except APIError as e:
        return e.to_response()
    except Exception as e:
        logger.error(f'Finger spelling error: {str(e)}')
        return jsonify({'success': False, 'message': 'Finger spelling generation failed.'}), 500


@translation_bp.route('/full', methods=['POST'])
@jwt_required()
def full_translation():
    """Execute the full translation pipeline.

    Request Body:
        - audio (str): Base64 encoded audio data
        - encoding (str, optional): Audio encoding
        - sample_rate (int, optional): Sample rate
        - playback_speed (float, optional): Avatar speed

    Returns:
        200: Complete translation with speech, NLP, and animation data
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data or not data.get('audio'):
            raise APIError('Audio data is required.', 400)

        result = TranslationService.full_pipeline(
            user_id=user_id,
            audio_base64=data['audio'],
            encoding=data.get('encoding', 'LINEAR16'),
            sample_rate=data.get('sample_rate', 16000),
            playback_speed=data.get('playback_speed', 1.0),
        )

        return success_response(result, 'Translation completed.')

    except APIError as e:
        return e.to_response()
    except Exception as e:
        logger.error(f'Full translation error: {str(e)}')
        return jsonify({'success': False, 'message': 'Translation failed.'}), 500


@translation_bp.route('/history', methods=['GET'])
@jwt_required()
def translation_history():
    """Get user's translation history.

    Query Params:
        - page (int, optional): Page number (default: 1)
        - per_page (int, optional): Items per page (default: 20)

    Returns:
        200: Paginated translation history
    """
    try:
        user_id = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)

        result = TranslationService.get_user_history(user_id, page, per_page)

        return success_response(result, 'Translation history retrieved.')

    except Exception as e:
        logger.error(f'History fetch error: {str(e)}')
        return jsonify({'success': False, 'message': 'Failed to fetch history.'}), 500


@translation_bp.route('/signs', methods=['GET'])
@jwt_required()
def available_signs():
    """Get list of all available sign mappings.

    Returns:
        200: List of available signs
    """
    try:
        result = SignLanguageService.get_available_signs()
        return success_response(result, 'Available signs retrieved.')
    except Exception as e:
        logger.error(f'Signs fetch error: {str(e)}')
        return jsonify({'success': False, 'message': 'Failed to fetch signs.'}), 500


@translation_bp.route('/fingerspelling/characters', methods=['GET'])
@jwt_required()
def supported_characters():
    """Get supported finger spelling characters.

    Returns:
        200: List of supported Tamil characters
    """
    try:
        result = TLFS23Engine.get_supported_characters()
        return success_response(result, 'Supported characters retrieved.')
    except Exception as e:
        logger.error(f'Characters fetch error: {str(e)}')
        return jsonify({'success': False, 'message': 'Failed to fetch characters.'}), 500
