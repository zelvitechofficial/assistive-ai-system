"""Translation orchestration service.

Orchestrates the full translation pipeline:
Speech → Text → NLP → Sign Mapping → Animation
"""

import logging
import math
from app.models.translation import Translation
from app.models.log import Log
from app.services.speech_service import SpeechService
from app.services.nlp_service import NLPService
from app.services.sign_language_service import SignLanguageService
from app.services.fingerspelling_service import TLFS23Engine

logger = logging.getLogger(__name__)


class TranslationService:
    """Orchestrates the full speech-to-sign translation pipeline."""

    @staticmethod
    def full_pipeline(user_id: str, audio_base64: str,
                      encoding: str = 'LINEAR16',
                      sample_rate: int = 16000,
                      playback_speed: float = 1.0) -> dict:
        """Execute the full translation pipeline."""
        logger.info(f'Starting full translation pipeline for user {user_id}')

        speech_result = SpeechService.recognize_from_base64(
            audio_base64, encoding, sample_rate
        )

        if speech_result.get('is_empty'):
            return {
                'success': False,
                'message': 'No speech detected in the audio.',
                'speech_result': speech_result,
            }

        tamil_text = speech_result['text']

        nlp_result = NLPService.process_tamil_text(tamil_text)

        animation_result = SignLanguageService.generate_animation_sequence(
            nlp_result['sign_tokens'], playback_speed
        )

        from bson import ObjectId
        translation = Translation(
            user_id=ObjectId(user_id),
            original_text=tamil_text,
            processed_text=nlp_result.get('simplified_text', ''),
            sign_sequence=animation_result,
            confidence_score=speech_result.get('confidence', 0),
            status='completed',
        )
        translation.save()

        log = Log(
            user_id=ObjectId(user_id),
            action='translation_completed',
            details={
                'original_text': tamil_text,
                'total_signs': animation_result.get('total_signs', 0),
                'duration_ms': animation_result.get('total_duration', 0),
            }
        )
        log.save()

        logger.info(f'Translation pipeline completed: {animation_result.get("total_signs", 0)} signs')

        return {
            'success': True,
            'translation_id': str(translation._id),
            'speech': speech_result,
            'nlp': nlp_result,
            'animation': animation_result,
        }

    @staticmethod
    def recognize_speech(audio_base64: str, encoding: str = 'LINEAR16',
                         sample_rate: int = 16000) -> dict:
        """Step 1 only: Speech recognition."""
        return SpeechService.recognize_from_base64(audio_base64, encoding, sample_rate)

    @staticmethod
    def process_nlp(text: str) -> dict:
        """Step 2 only: NLP processing."""
        return NLPService.process_tamil_text(text)

    @staticmethod
    def generate_avatar(sign_tokens: list,
                        playback_speed: float = 1.0) -> dict:
        """Step 3 only: Generate avatar animation."""
        return SignLanguageService.generate_animation_sequence(
            sign_tokens, playback_speed
        )

    @staticmethod
    def generate_fingerspelling(word: str, char_duration: int = 400) -> dict:
        """Generate finger spelling for a single word."""
        return TLFS23Engine.generate_fingerspelling(word, char_duration=char_duration)

    @staticmethod
    def get_user_history(user_id: str, page: int = 1, per_page: int = 20) -> dict:
        """Get translation history for a user."""
        from bson import ObjectId
        items, total = Translation.find_by_user(ObjectId(user_id), page, per_page)

        return {
            'translations': [t.to_dict() for t in items],
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': math.ceil(total / per_page) if total > 0 else 0,
        }
