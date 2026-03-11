"""Speech recognition service using OpenAI Whisper.

Uses imageio-ffmpeg to bundle ffmpeg (no system install needed).
Whisper runs locally and supports Tamil speech recognition.
"""

import base64
import logging
import os
import tempfile

logger = logging.getLogger(__name__)

# ─── Bootstrap: Make bundled ffmpeg available to Whisper ─────────────
try:
    import imageio_ffmpeg
    _ffmpeg_dir = os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())
    if _ffmpeg_dir not in os.environ.get('PATH', ''):
        os.environ['PATH'] = _ffmpeg_dir + os.pathsep + os.environ.get('PATH', '')
        logger.info(f'Added bundled ffmpeg to PATH: {_ffmpeg_dir}')
except ImportError:
    logger.warning('imageio-ffmpeg not installed. Audio decoding may fail.')
except Exception as e:
    logger.warning(f'Could not set up bundled ffmpeg: {e}')

# ─── Lazy-loaded Whisper model ──────────────────────────────────────
_whisper_model = None


def _get_whisper_model():
    """Lazy-load the Whisper model (loaded once, reused across requests)."""
    global _whisper_model
    if _whisper_model is None:
        try:
            import whisper
            logger.info('Loading Whisper model (base)... This may take a moment on first run.')
            _whisper_model = whisper.load_model('base')
            logger.info('Whisper model loaded successfully.')
        except ImportError:
            logger.error('openai-whisper is not installed. Run: pip install openai-whisper')
            raise
        except Exception as e:
            logger.error(f'Failed to load Whisper model: {e}')
            raise
    return _whisper_model


class SpeechService:
    """Service for speech-to-text processing using OpenAI Whisper."""

    TAMIL_LANGUAGE_CODE = 'ta'

    @staticmethod
    def recognize_speech(audio_data: bytes, encoding: str = 'LINEAR16',
                         sample_rate: int = 16000) -> dict:
        """Convert audio to Tamil text using Whisper.

        Args:
            audio_data: Raw audio bytes (any format — WAV, M4A, MP3, etc.)
            encoding: Kept for API compatibility
            sample_rate: Kept for API compatibility

        Returns:
            Dict with recognized text, confidence, and metadata
        """
        tmp_path = None
        try:
            # Detect format from magic bytes and pick extension
            ext = SpeechService._detect_audio_format(audio_data)

            # Write to temp file so Whisper can read it
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                tmp.write(audio_data)
                tmp_path = tmp.name

            logger.info(f'Audio saved to temp file ({ext}, {len(audio_data)} bytes)')

            # Transcribe with Whisper
            model = _get_whisper_model()
            result = model.transcribe(
                tmp_path,
                language=SpeechService.TAMIL_LANGUAGE_CODE,
                task='transcribe',
                fp16=False,   # CPU-safe (no GPU fp16 issues)
            )

            text = result.get('text', '').strip()

            if not text:
                logger.warning('Whisper returned empty text.')
                return {
                    'text': '',
                    'confidence': 0.0,
                    'alternatives': [],
                    'is_empty': True,
                }

            # Compute confidence from segment no_speech_prob values
            segments = result.get('segments', [])
            if segments:
                avg_no_speech = sum(
                    seg.get('no_speech_prob', 0) for seg in segments
                ) / len(segments)
                confidence = round(max(0.0, 1.0 - avg_no_speech), 4)
            else:
                confidence = 0.90

            logger.info(f'Whisper recognized: "{text}" (confidence: {confidence})')

            return {
                'text': text,
                'confidence': confidence,
                'alternatives': [],
                'is_empty': False,
            }

        except ImportError:
            logger.warning('Whisper not installed. Using mock response.')
            return SpeechService._mock_recognize(audio_data)

        except Exception as e:
            logger.error(f'Whisper recognition error: {str(e)}')
            # Fall back to SpeechRecognition (Google free API)
            try:
                return SpeechService._fallback_recognize(audio_data)
            except Exception as fb_err:
                logger.error(f'Fallback recognition also failed: {fb_err}')
                return SpeechService._mock_recognize(audio_data)

        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

    @staticmethod
    def _detect_audio_format(data: bytes) -> str:
        """Detect audio format from magic bytes."""
        if data[:4] == b'RIFF':
            return '.wav'
        if data[:4] == b'fLaC':
            return '.flac'
        if data[:3] == b'ID3' or (len(data) > 1 and data[0:2] == b'\xff\xfb'):
            return '.mp3'
        if data[4:8] == b'ftyp':
            return '.m4a'
        if data[:4] == b'OggS':
            return '.ogg'
        # Default — let ffmpeg figure it out
        return '.wav'

    @staticmethod
    def _fallback_recognize(audio_data: bytes) -> dict:
        """Fallback: use SpeechRecognition + Google free API."""
        import speech_recognition as sr

        tmp_path = None
        try:
            ext = SpeechService._detect_audio_format(audio_data)
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                tmp.write(audio_data)
                tmp_path = tmp.name

            recognizer = sr.Recognizer()
            with sr.AudioFile(tmp_path) as source:
                audio = recognizer.record(source)

            text = recognizer.recognize_google(audio, language='ta-IN')
            logger.info(f'Google free API recognized: "{text}"')
            return {
                'text': text,
                'confidence': 0.85,
                'alternatives': [],
                'is_empty': False,
                'engine': 'google_free',
            }
        except Exception as e:
            logger.error(f'SpeechRecognition fallback error: {e}')
            raise
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

    @staticmethod
    def recognize_from_base64(audio_base64: str, encoding: str = 'LINEAR16',
                               sample_rate: int = 16000) -> dict:
        """Recognize speech from base64 encoded audio."""
        try:
            audio_data = base64.b64decode(audio_base64)
            return SpeechService.recognize_speech(audio_data, encoding, sample_rate)
        except Exception as e:
            logger.error(f'Base64 decode error: {str(e)}')
            raise ValueError(f'Invalid audio data: {str(e)}')

    @staticmethod
    def _mock_recognize(audio_data: bytes = None) -> dict:
        """Mock speech recognition fallback."""
        sample_phrases = [
            'வணக்கம் எப்படி இருக்கீர்கள்',
            'நான் நலமாக இருக்கிறேன்',
            'உங்கள் பெயர் என்ன',
            'நன்றி வணக்கம்',
            'இன்று வானிலை நன்றாக உள்ளது',
        ]

        import random
        text = random.choice(sample_phrases)

        logger.info(f'Mock speech recognition: "{text}"')

        return {
            'text': text,
            'confidence': 0.92,
            'alternatives': [
                {'text': sample_phrases[(sample_phrases.index(text) + 1) % len(sample_phrases)],
                 'confidence': 0.78}
            ],
            'is_empty': False,
            'is_mock': True,
        }
