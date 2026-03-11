"""TLFS23 Tamil Finger Spelling Engine.

This module implements the Tamil Language Finger Spelling system (TLFS23).
It handles character-level finger spelling for Tamil words that don't have
direct sign language mappings.

Tamil script has 247 characters:
- 12 vowels (உயிர்)
- 18 consonants (மெய்)  
- 216 vowel-consonant combinations (உயிர்மெய்)
- 1 special character (ஃ)

Each character maps to a specific hand configuration.
"""

import logging

logger = logging.getLogger(__name__)

# Tamil vowel hand configurations
TAMIL_VOWEL_SIGNS = {
    'அ': {'hand_shape': 'a_shape', 'orientation': 'palm_forward', 'motion': 'none'},
    'ஆ': {'hand_shape': 'aa_shape', 'orientation': 'palm_forward', 'motion': 'down'},
    'இ': {'hand_shape': 'i_shape', 'orientation': 'palm_left', 'motion': 'none'},
    'ஈ': {'hand_shape': 'ii_shape', 'orientation': 'palm_left', 'motion': 'down'},
    'உ': {'hand_shape': 'u_shape', 'orientation': 'palm_forward', 'motion': 'none'},
    'ஊ': {'hand_shape': 'uu_shape', 'orientation': 'palm_forward', 'motion': 'down'},
    'எ': {'hand_shape': 'e_shape', 'orientation': 'palm_forward', 'motion': 'none'},
    'ஏ': {'hand_shape': 'ee_shape', 'orientation': 'palm_forward', 'motion': 'down'},
    'ஐ': {'hand_shape': 'ai_shape', 'orientation': 'palm_forward', 'motion': 'sweep'},
    'ஒ': {'hand_shape': 'o_shape', 'orientation': 'palm_forward', 'motion': 'none'},
    'ஓ': {'hand_shape': 'oo_shape', 'orientation': 'palm_forward', 'motion': 'down'},
    'ஔ': {'hand_shape': 'au_shape', 'orientation': 'palm_forward', 'motion': 'sweep'},
}

# Tamil consonant hand configurations
TAMIL_CONSONANT_SIGNS = {
    'க': {'hand_shape': 'ka_shape', 'orientation': 'palm_forward', 'motion': 'none'},
    'ங': {'hand_shape': 'nga_shape', 'orientation': 'palm_left', 'motion': 'none'},
    'ச': {'hand_shape': 'cha_shape', 'orientation': 'palm_forward', 'motion': 'none'},
    'ஞ': {'hand_shape': 'nya_shape', 'orientation': 'palm_left', 'motion': 'none'},
    'ட': {'hand_shape': 'ta_shape', 'orientation': 'palm_forward', 'motion': 'tap'},
    'ண': {'hand_shape': 'na_hard_shape', 'orientation': 'palm_forward', 'motion': 'none'},
    'த': {'hand_shape': 'tha_shape', 'orientation': 'palm_forward', 'motion': 'none'},
    'ந': {'hand_shape': 'na_shape', 'orientation': 'palm_forward', 'motion': 'none'},
    'ப': {'hand_shape': 'pa_shape', 'orientation': 'palm_forward', 'motion': 'none'},
    'ம': {'hand_shape': 'ma_shape', 'orientation': 'palm_forward', 'motion': 'none'},
    'ய': {'hand_shape': 'ya_shape', 'orientation': 'palm_left', 'motion': 'none'},
    'ர': {'hand_shape': 'ra_shape', 'orientation': 'palm_forward', 'motion': 'flick'},
    'ல': {'hand_shape': 'la_shape', 'orientation': 'palm_forward', 'motion': 'none'},
    'வ': {'hand_shape': 'va_shape', 'orientation': 'palm_forward', 'motion': 'none'},
    'ழ': {'hand_shape': 'zha_shape', 'orientation': 'palm_down', 'motion': 'curl'},
    'ள': {'hand_shape': 'la_hard_shape', 'orientation': 'palm_forward', 'motion': 'none'},
    'ற': {'hand_shape': 'ra_hard_shape', 'orientation': 'palm_forward', 'motion': 'tap'},
    'ன': {'hand_shape': 'na_soft_shape', 'orientation': 'palm_forward', 'motion': 'none'},
}

# Vowel combining marks (dependent vowel signs)
TAMIL_VOWEL_MARKS = {
    '\u0BBE': 'aa',   # ா
    '\u0BBF': 'i',    # ி
    '\u0BC0': 'ii',   # ீ
    '\u0BC1': 'u',    # ு
    '\u0BC2': 'uu',   # ூ
    '\u0BC6': 'e',    # ெ
    '\u0BC7': 'ee',   # ே
    '\u0BC8': 'ai',   # ை
    '\u0BCA': 'o',    # ொ
    '\u0BCB': 'oo',   # ோ
    '\u0BCC': 'au',   # ௌ
    '\u0BCD': 'pulli', # ்  (Pulli - removes inherent vowel)
}


class TLFS23Engine:
    """Tamil Language Finger Spelling Engine (Version 2023).
    
    Converts Tamil text character by character into hand sign configurations
    for finger spelling display.
    """

    @staticmethod
    def generate_fingerspelling(word: str, start_time: int = 0,
                                  char_duration: int = 400,
                                  transition_duration: int = 100) -> dict:
        """Generate a finger spelling sequence for a Tamil word.
        
        Args:
            word: Tamil word to spell
            start_time: Animation start time in ms
            char_duration: Duration per character in ms
            transition_duration: Transition between chars in ms
            
        Returns:
            Dict with character sequence and animation data
        """
        from app.services.nlp_service import NLPService

        chars = NLPService.get_tamil_chars(word)
        sequence = []
        current_time = start_time

        for char in chars:
            sign_config = TLFS23Engine._get_char_sign(char)

            entry = {
                'character': char,
                'sign_config': sign_config,
                'start_time': current_time,
                'end_time': current_time + char_duration,
                'duration': char_duration,
                'animation': {
                    'frames': [
                        {
                            'time': current_time,
                            'hand_shape': sign_config['hand_shape'],
                            'orientation': sign_config['orientation'],
                            'position': 'front_center',
                            'motion': sign_config.get('motion', 'none'),
                        },
                        {
                            'time': current_time + char_duration // 2,
                            'hand_shape': sign_config['hand_shape'],
                            'orientation': sign_config['orientation'],
                            'position': 'front_center',
                            'motion': 'hold',
                        },
                    ],
                },
            }
            sequence.append(entry)
            current_time += char_duration + transition_duration

        result = {
            'word': word,
            'characters': chars,
            'sequence': sequence,
            'total_duration': current_time - start_time,
            'char_count': len(chars),
            'start_time': start_time,
            'end_time': current_time,
        }

        logger.info(f'TLFS23: Generated finger spelling for "{word}" '
                     f'({len(chars)} chars, {current_time - start_time}ms)')

        return result

    @staticmethod
    def _get_char_sign(char: str) -> dict:
        """Get the hand sign configuration for a Tamil character.
        
        Args:
            char: Single Tamil character or syllable
            
        Returns:
            Hand sign configuration dict
        """
        # Check if it's a standalone vowel
        if char in TAMIL_VOWEL_SIGNS:
            return TAMIL_VOWEL_SIGNS[char]

        # Check if it's a consonant
        base_char = char[0] if char else ''
        if base_char in TAMIL_CONSONANT_SIGNS:
            config = dict(TAMIL_CONSONANT_SIGNS[base_char])

            # Check for vowel mark modifiers
            if len(char) > 1:
                for mark_char in char[1:]:
                    if mark_char in TAMIL_VOWEL_MARKS:
                        mark_name = TAMIL_VOWEL_MARKS[mark_char]
                        config['vowel_modifier'] = mark_name
                        config['hand_shape'] = f"{config['hand_shape']}_{mark_name}"

            return config

        # Unknown character - generic sign
        return {
            'hand_shape': 'generic',
            'orientation': 'palm_forward',
            'motion': 'none',
            'character': char,
        }

    @staticmethod
    def get_supported_characters() -> dict:
        """Get all supported finger spelling characters."""
        return {
            'vowels': list(TAMIL_VOWEL_SIGNS.keys()),
            'consonants': list(TAMIL_CONSONANT_SIGNS.keys()),
            'vowel_marks': {k: v for k, v in TAMIL_VOWEL_MARKS.items()},
            'total_base': len(TAMIL_VOWEL_SIGNS) + len(TAMIL_CONSONANT_SIGNS),
        }
