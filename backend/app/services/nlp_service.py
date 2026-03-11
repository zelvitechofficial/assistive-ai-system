"""Tamil NLP processing service.

This module handles Tamil grammar analysis and simplification
for sign language translation. Tamil Sign Language (TSL) has
a different grammatical structure than spoken Tamil.

Key transformations:
- Tamil follows SOV (Subject-Object-Verb) order
- TSL follows a topic-comment structure
- Postpositions are simplified
- Tense markers are adjusted
- Complex sentences are broken into simpler units
"""

import re
import logging

logger = logging.getLogger(__name__)


# Tamil Unicode range
TAMIL_UNICODE_START = 0x0B80
TAMIL_UNICODE_END = 0x0BFF

# Tamil vowels (உயிர் எழுத்து)
TAMIL_VOWELS = 'அஆஇஈஉஊஎஏஐஒஓஔ'

# Tamil consonants (மெய் எழுத்து)
TAMIL_CONSONANTS = 'கஙசஞடணதநபமயரலவழளறன'

# Common Tamil stop words that can be simplified in sign language
TAMIL_STOP_WORDS = {
    'ஆனால்', 'அல்லது', 'மற்றும்', 'என்று', 'அது',
    'இது', 'அந்த', 'இந்த', 'ஒரு', 'போல்',
    'உடன்', 'மேல்', 'கீழ்', 'பின்', 'முன்',
    'ஆக', 'என', 'ஆல்', 'இல்', 'உள்',
}

# Tamil tense suffixes
TAMIL_TENSE_MARKERS = {
    'past': ['ந்த', 'ட்ட', 'த்த', 'ன', 'ர்', 'ல்'],
    'present': ['கிற', 'கின்ற', 'கிறா', 'கின்றா'],
    'future': ['வ', 'ப', 'ம்'],
}

# Common Tamil words mapped to simplified sign gloss
TAMIL_TO_SIGN_GLOSS = {
    'வணக்கம்': 'HELLO',
    'நன்றி': 'THANK_YOU',
    'நான்': 'I',
    'நீ': 'YOU',
    'நீங்கள்': 'YOU_FORMAL',
    'அவன்': 'HE',
    'அவள்': 'SHE',
    'அவர்': 'THEY_FORMAL',
    'அவர்கள்': 'THEY',
    'இது': 'THIS',
    'அது': 'THAT',
    'என்ன': 'WHAT',
    'எப்படி': 'HOW',
    'எங்கே': 'WHERE',
    'யார்': 'WHO',
    'எப்போது': 'WHEN',
    'நல்ல': 'GOOD',
    'கெட்ட': 'BAD',
    'பெரிய': 'BIG',
    'சிறிய': 'SMALL',
    'வா': 'COME',
    'போ': 'GO',
    'சாப்பிடு': 'EAT',
    'குடி': 'DRINK',
    'தூக்கம்': 'SLEEP',
    'வேலை': 'WORK',
    'படி': 'STUDY',
    'பேசு': 'SPEAK',
    'கேள்': 'LISTEN',
    'பார்': 'SEE',
    'நேரம்': 'TIME',
    'இன்று': 'TODAY',
    'நாளை': 'TOMORROW',
    'நேற்று': 'YESTERDAY',
    'காலை': 'MORNING',
    'மாலை': 'EVENING',
    'இரவு': 'NIGHT',
    'வீடு': 'HOUSE',
    'பள்ளி': 'SCHOOL',
    'மருத்துவமனை': 'HOSPITAL',
    'கடை': 'SHOP',
    'தண்ணீர்': 'WATER',
    'உணவு': 'FOOD',
    'அம்மா': 'MOTHER',
    'அப்பா': 'FATHER',
    'நண்பன்': 'FRIEND',
    'ஆசிரியர்': 'TEACHER',
    'மகிழ்ச்சி': 'HAPPY',
    'வருத்தம்': 'SAD',
    'கோபம்': 'ANGRY',
    'பயம்': 'FEAR',
    'ஆம்': 'YES',
    'இல்லை': 'NO',
    'சரி': 'OK',
    'தயவுசெய்து': 'PLEASE',
    'மன்னிக்கவும்': 'SORRY',
    'உதவி': 'HELP',
    'நிறுத்து': 'STOP',
    'தொடக்கம்': 'START',
}


class NLPService:
    """Tamil NLP processing service for sign language translation."""

    @staticmethod
    def process_tamil_text(text: str) -> dict:
        """Process Tamil text for sign language translation.
        
        Pipeline:
        1. Tokenize the Tamil text
        2. Remove unnecessary stop words
        3. Detect tense and aspect
        4. Simplify grammar for sign language structure
        5. Map tokens to sign language gloss
        
        Args:
            text: Tamil text string
            
        Returns:
            Dict with processed tokens, sign gloss, and metadata
        """
        if not text or not text.strip():
            return {
                'original_text': text,
                'tokens': [],
                'sign_tokens': [],
                'tense': 'present',
                'sentence_type': 'unknown',
                'simplified_text': '',
            }

        logger.info(f'Processing Tamil text: "{text}"')

        # Step 1: Clean and tokenize
        cleaned = NLPService._clean_text(text)
        tokens = NLPService._tokenize(cleaned)

        # Step 2: Detect sentence type
        sentence_type = NLPService._detect_sentence_type(tokens)

        # Step 3: Detect tense
        tense = NLPService._detect_tense(tokens)

        # Step 4: Remove stop words and simplify
        simplified_tokens = NLPService._simplify_for_sign(tokens)

        # Step 5: Reorder for sign language grammar (topic-comment)
        reordered_tokens = NLPService._reorder_for_sign(simplified_tokens, sentence_type)

        # Step 6: Map to sign gloss
        sign_tokens = NLPService._map_to_sign_gloss(reordered_tokens)

        # Add tense marker if needed
        if tense != 'present':
            sign_tokens.append({
                'original': tense,
                'gloss': tense.upper(),
                'type': 'tense_marker',
                'has_sign': True,
            })

        # For questions, add question marker
        if sentence_type == 'question':
            sign_tokens.append({
                'original': '?',
                'gloss': 'QUESTION',
                'type': 'question_marker',
                'has_sign': True,
            })

        result = {
            'original_text': text,
            'tokens': [t for t in tokens],
            'sign_tokens': sign_tokens,
            'tense': tense,
            'sentence_type': sentence_type,
            'simplified_text': ' '.join(reordered_tokens),
            'total_signs': len(sign_tokens),
            'unsupported_count': sum(
                1 for t in sign_tokens if t.get('type') == 'fingerspell'
            ),
        }

        logger.info(f'NLP processing complete: {len(sign_tokens)} sign tokens')
        return result

    @staticmethod
    def _clean_text(text: str) -> str:
        """Clean text by removing punctuation and normalizing whitespace."""
        # Remove non-Tamil, non-space characters (keep Tamil and spaces)
        cleaned = re.sub(r'[^\u0B80-\u0BFF\s]', '', text)
        # Normalize whitespace
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned

    @staticmethod
    def _tokenize(text: str) -> list:
        """Tokenize Tamil text into words."""
        if not text:
            return []
        return [word.strip() for word in text.split() if word.strip()]

    @staticmethod
    def _detect_sentence_type(tokens: list) -> str:
        """Detect if the sentence is a question, command, or statement."""
        question_words = {'என்ன', 'எப்படி', 'எங்கே', 'யார்', 'எப்போது',
                          'ஏன்', 'எது', 'எவ்வளவு'}

        if any(word in question_words for word in tokens):
            return 'question'

        # Check for imperative forms (commands)
        command_suffixes = ['ங்கள்', 'உங்கள்']
        if tokens and any(tokens[-1].endswith(s) for s in command_suffixes):
            return 'command'

        return 'statement'

    @staticmethod
    def _detect_tense(tokens: list) -> str:
        """Detect the tense of the Tamil sentence.
        
        Present tense markers are checked first because they are
        more specific (e.g., கிற) than past markers (e.g., ன)
        which can cause false positives as substrings.
        """
        text = ' '.join(tokens)

        # Check present first (more specific markers)
        for marker in TAMIL_TENSE_MARKERS['present']:
            if marker in text:
                return 'present'

        # Check past
        for marker in TAMIL_TENSE_MARKERS['past']:
            if marker in text:
                return 'past'

        # Check future
        for marker in TAMIL_TENSE_MARKERS['future']:
            if any(token.endswith(marker) for token in tokens):
                return 'future'

        return 'present'

    @staticmethod
    def _simplify_for_sign(tokens: list) -> list:
        """Remove stop words and simplify tokens for sign language."""
        simplified = []
        for token in tokens:
            if token not in TAMIL_STOP_WORDS:
                # Try to extract root word (basic stemming)
                root = NLPService._basic_stem(token)
                simplified.append(root)
        return simplified

    @staticmethod
    def _basic_stem(word: str) -> str:
        """Basic Tamil stemming - remove common suffixes.
        
        This is a simplified stemmer. A production system would use
        a proper Tamil morphological analyzer.
        """
        suffixes = [
            'களை', 'கள்', 'ல்', 'ன்', 'ம்', 'ர்',
            'ஐ', 'ை', 'ில்', 'ால்', 'ுடன்', 'இடம்',
        ]

        for suffix in sorted(suffixes, key=len, reverse=True):
            if word.endswith(suffix) and len(word) > len(suffix) + 1:
                return word[:-len(suffix)]

        return word

    @staticmethod
    def _reorder_for_sign(tokens: list, sentence_type: str) -> list:
        """Reorder tokens for sign language grammar.
        
        TSL follows topic-comment structure:
        - Topic (what we're talking about) comes first
        - Comment (what we're saying about it) comes after
        - Question words come at the end
        """
        if not tokens:
            return tokens

        question_words = {'என்ன', 'எப்படி', 'எங்கே', 'யார்', 'எப்போது'}
        questions = [t for t in tokens if t in question_words]
        non_questions = [t for t in tokens if t not in question_words]

        # For sign language, question words go at the end
        if sentence_type == 'question':
            return non_questions + questions

        return tokens

    @staticmethod
    def _map_to_sign_gloss(tokens: list) -> list:
        """Map Tamil tokens to sign language gloss notation."""
        sign_tokens = []

        for token in tokens:
            if token in TAMIL_TO_SIGN_GLOSS:
                sign_tokens.append({
                    'original': token,
                    'gloss': TAMIL_TO_SIGN_GLOSS[token],
                    'type': 'mapped',
                    'has_sign': True,
                })
            else:
                # Check if we can find a partial match
                matched = False
                for tamil_word, gloss in TAMIL_TO_SIGN_GLOSS.items():
                    if token.startswith(tamil_word) or tamil_word.startswith(token):
                        sign_tokens.append({
                            'original': token,
                            'gloss': gloss,
                            'type': 'partial_match',
                            'has_sign': True,
                        })
                        matched = True
                        break

                if not matched:
                    # Mark for finger spelling
                    sign_tokens.append({
                        'original': token,
                        'gloss': f'FS({token})',
                        'type': 'fingerspell',
                        'has_sign': False,
                    })

        return sign_tokens

    @staticmethod
    def is_tamil_text(text: str) -> bool:
        """Check if the text contains Tamil characters."""
        for char in text:
            if TAMIL_UNICODE_START <= ord(char) <= TAMIL_UNICODE_END:
                return True
        return False

    @staticmethod
    def get_tamil_chars(word: str) -> list:
        """Split a Tamil word into individual characters/syllables.
        
        Tamil script uses a combination of vowels and consonants where
        consonant+vowel combinations form a single syllable.
        """
        chars = []
        i = 0
        word_list = list(word)

        while i < len(word_list):
            char = word_list[i]

            if TAMIL_UNICODE_START <= ord(char) <= TAMIL_UNICODE_END:
                # Check if next character is a combining mark
                syllable = char
                while (i + 1 < len(word_list) and
                       0x0BBE <= ord(word_list[i + 1]) <= 0x0BCD):
                    i += 1
                    syllable += word_list[i]
                chars.append(syllable)
            else:
                chars.append(char)

            i += 1

        return chars
