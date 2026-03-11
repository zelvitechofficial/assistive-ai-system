"""Tests for NLP service."""

import pytest
from app.services.nlp_service import NLPService


class TestNLPService:
    """Test NLP service functions."""

    def test_process_greeting(self):
        """Test processing a simple greeting."""
        result = NLPService.process_tamil_text('வணக்கம்')
        assert result['original_text'] == 'வணக்கம்'
        assert len(result['sign_tokens']) > 0

    def test_process_question(self):
        """Test processing a question."""
        result = NLPService.process_tamil_text('எப்படி இருக்கீர்கள்')
        assert result['sentence_type'] == 'question'

    def test_process_empty(self):
        """Test processing empty text."""
        result = NLPService.process_tamil_text('')
        assert result['tokens'] == []
        assert result['sign_tokens'] == []

    def test_is_tamil_text(self):
        """Test Tamil text detection."""
        assert NLPService.is_tamil_text('வணக்கம்') is True
        assert NLPService.is_tamil_text('Hello') is False
        assert NLPService.is_tamil_text('') is False

    def test_get_tamil_chars(self):
        """Test Tamil character splitting."""
        chars = NLPService.get_tamil_chars('நன்றி')
        assert len(chars) > 0

    def test_tense_detection_present(self):
        """Test present tense detection."""
        tokens = ['நான்', 'போகிறேன்']
        tense = NLPService._detect_tense(tokens)
        assert tense == 'present'  # contains 'கிற'

    def test_clean_text(self):
        """Test text cleaning."""
        cleaned = NLPService._clean_text('வணக்கம்! How are you?')
        assert '!' not in cleaned
        assert 'How' not in cleaned

    def test_tokenize(self):
        """Test tokenization."""
        tokens = NLPService._tokenize('நான் நலமாக இருக்கிறேன்')
        assert len(tokens) == 3

    def test_sign_gloss_mapping(self):
        """Test sign gloss mapping."""
        tokens = ['வணக்கம்', 'நான்']
        result = NLPService._map_to_sign_gloss(tokens)
        assert len(result) == 2
        assert result[0]['gloss'] == 'HELLO'
        assert result[1]['gloss'] == 'I'

    def test_unmapped_word_fingerspell(self):
        """Test that unmapped words get marked for finger spelling."""
        tokens = ['unmappedword']
        result = NLPService._map_to_sign_gloss(tokens)
        assert result[0]['type'] == 'fingerspell'
