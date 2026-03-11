"""Tests for translation endpoints and services."""

import pytest
import base64


class TestSpeechRecognition:
    """Test speech recognition endpoint."""

    def test_recognize_speech_mock(self, client, auth_headers):
        """Test speech recognition with mock audio."""
        # Create dummy base64 audio
        dummy_audio = base64.b64encode(b'\x00' * 1000).decode('utf-8')

        data = {
            'audio': dummy_audio,
            'encoding': 'LINEAR16',
            'sample_rate': 16000,
        }
        response = client.post(
            '/api/v1/translate/speech/recognize',
            json=data,
            headers=auth_headers,
        )
        result = response.get_json()

        assert response.status_code == 200
        assert result['success'] is True
        assert 'text' in result['data']

    def test_recognize_speech_no_audio(self, client, auth_headers):
        """Test speech recognition without audio data."""
        response = client.post(
            '/api/v1/translate/speech/recognize',
            json={},
            headers=auth_headers,
        )

        assert response.status_code == 400


class TestNLPProcessing:
    """Test NLP processing endpoint."""

    def test_process_tamil_text(self, client, auth_headers):
        """Test NLP processing of Tamil text."""
        data = {'text': 'வணக்கம் எப்படி இருக்கீர்கள்'}
        response = client.post(
            '/api/v1/translate/nlp/process',
            json=data,
            headers=auth_headers,
        )
        result = response.get_json()

        assert response.status_code == 200
        assert result['success'] is True
        assert 'sign_tokens' in result['data']
        assert len(result['data']['sign_tokens']) > 0

    def test_process_empty_text(self, client, auth_headers):
        """Test NLP processing with empty text."""
        data = {'text': ''}
        response = client.post(
            '/api/v1/translate/nlp/process',
            json=data,
            headers=auth_headers,
        )

        # Empty text should still succeed but with empty tokens
        assert response.status_code == 200

    def test_process_no_text(self, client, auth_headers):
        """Test NLP processing without text field."""
        response = client.post(
            '/api/v1/translate/nlp/process',
            json={},
            headers=auth_headers,
        )

        assert response.status_code == 400


class TestAvatarGeneration:
    """Test avatar animation generation endpoint."""

    def test_generate_avatar(self, client, auth_headers):
        """Test avatar animation generation."""
        data = {
            'sign_tokens': [
                {'original': 'வணக்கம்', 'gloss': 'HELLO', 'type': 'mapped', 'has_sign': True},
                {'original': 'நான்', 'gloss': 'I', 'type': 'mapped', 'has_sign': True},
            ],
            'playback_speed': 1.0,
        }
        response = client.post(
            '/api/v1/translate/avatar/generate',
            json=data,
            headers=auth_headers,
        )
        result = response.get_json()

        assert response.status_code == 200
        assert result['success'] is True
        assert 'timeline' in result['data']
        assert result['data']['total_signs'] >= 2

    def test_generate_avatar_no_tokens(self, client, auth_headers):
        """Test avatar generation without tokens."""
        response = client.post(
            '/api/v1/translate/avatar/generate',
            json={},
            headers=auth_headers,
        )

        assert response.status_code == 400


class TestFingerSpelling:
    """Test finger spelling endpoint."""

    def test_generate_fingerspelling(self, client, auth_headers):
        """Test finger spelling generation."""
        data = {'word': 'நன்றி'}
        response = client.post(
            '/api/v1/translate/fingerspelling/generate',
            json=data,
            headers=auth_headers,
        )
        result = response.get_json()

        assert response.status_code == 200
        assert result['success'] is True
        assert 'sequence' in result['data']
        assert result['data']['char_count'] > 0

    def test_generate_fingerspelling_no_word(self, client, auth_headers):
        """Test finger spelling without word."""
        response = client.post(
            '/api/v1/translate/fingerspelling/generate',
            json={},
            headers=auth_headers,
        )

        assert response.status_code == 400


class TestFullTranslation:
    """Test full translation pipeline."""

    def test_full_pipeline(self, client, auth_headers):
        """Test the entire speech-to-sign pipeline."""
        dummy_audio = base64.b64encode(b'\x00' * 1000).decode('utf-8')

        data = {
            'audio': dummy_audio,
            'playback_speed': 1.0,
        }
        response = client.post(
            '/api/v1/translate/full',
            json=data,
            headers=auth_headers,
        )
        result = response.get_json()

        assert response.status_code == 200
        assert result['success'] is True
        assert 'speech' in result['data']
        assert 'nlp' in result['data']
        assert 'animation' in result['data']


class TestTranslationHistory:
    """Test translation history endpoint."""

    def test_get_history(self, client, auth_headers):
        """Test getting translation history."""
        response = client.get(
            '/api/v1/translate/history',
            headers=auth_headers,
        )
        result = response.get_json()

        assert response.status_code == 200
        assert result['success'] is True
        assert 'translations' in result['data']


class TestSystemHealth:
    """Test system health endpoint."""

    def test_healthcheck(self, client):
        """Test health check endpoint."""
        response = client.get('/api/v1/healthcheck')
        result = response.get_json()

        assert response.status_code == 200
        assert result['status'] in ['healthy', 'degraded']
        assert 'version' in result
