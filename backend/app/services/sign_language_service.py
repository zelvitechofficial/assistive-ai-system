"""Sign language mapping and avatar animation service.

This service handles:
1. Looking up signs from the database
2. Generating animation sequences
3. Computing transition timing between signs

The avatar animation is treated as a rendering pipeline:
- Each sign has a set of keyframes (hand position, orientation, facial expression)
- Transitions between signs are computed for smooth animation
- The output is a timed sequence that the mobile renderer can play
"""

import logging
from app.models.sign_mapping import SignMapping

logger = logging.getLogger(__name__)

# Default animation frame data for common signs
# In production, these would come from a motion capture database
DEFAULT_SIGN_ANIMATIONS = {
    'HELLO': {
        'frames': [
            {'time': 0, 'right_hand': 'open', 'position': 'forehead', 'motion': 'wave'},
            {'time': 300, 'right_hand': 'open', 'position': 'forward', 'motion': 'wave'},
            {'time': 600, 'right_hand': 'open', 'position': 'forward', 'motion': 'stop'},
        ],
        'duration': 600,
        'requires_two_hands': False,
        'facial_expression': 'smile',
    },
    'THANK_YOU': {
        'frames': [
            {'time': 0, 'right_hand': 'flat', 'position': 'chin', 'motion': 'touch'},
            {'time': 300, 'right_hand': 'flat', 'position': 'forward_down', 'motion': 'move_forward'},
        ],
        'duration': 300,
        'requires_two_hands': False,
        'facial_expression': 'smile',
    },
    'I': {
        'frames': [
            {'time': 0, 'right_hand': 'index_point', 'position': 'chest', 'motion': 'point_self'},
        ],
        'duration': 200,
        'requires_two_hands': False,
        'facial_expression': 'neutral',
    },
    'YOU': {
        'frames': [
            {'time': 0, 'right_hand': 'index_point', 'position': 'forward', 'motion': 'point_forward'},
        ],
        'duration': 200,
        'requires_two_hands': False,
        'facial_expression': 'neutral',
    },
    'GOOD': {
        'frames': [
            {'time': 0, 'right_hand': 'flat', 'position': 'chin', 'motion': 'touch'},
            {'time': 200, 'right_hand': 'flat', 'position': 'palm_down', 'motion': 'move_down'},
        ],
        'duration': 200,
        'requires_two_hands': False,
        'facial_expression': 'smile',
    },
    'BAD': {
        'frames': [
            {'time': 0, 'right_hand': 'flat', 'position': 'chin', 'motion': 'touch'},
            {'time': 200, 'right_hand': 'flat', 'position': 'palm_down', 'motion': 'flip_down'},
        ],
        'duration': 200,
        'requires_two_hands': False,
        'facial_expression': 'frown',
    },
    'YES': {
        'frames': [
            {'time': 0, 'right_hand': 'fist', 'position': 'front', 'motion': 'nod'},
            {'time': 200, 'right_hand': 'fist', 'position': 'front_down', 'motion': 'nod'},
            {'time': 400, 'right_hand': 'fist', 'position': 'front', 'motion': 'stop'},
        ],
        'duration': 400,
        'requires_two_hands': False,
        'facial_expression': 'nod',
    },
    'NO': {
        'frames': [
            {'time': 0, 'right_hand': 'index_middle', 'position': 'front', 'motion': 'close'},
            {'time': 300, 'right_hand': 'fist', 'position': 'front', 'motion': 'stop'},
        ],
        'duration': 300,
        'requires_two_hands': False,
        'facial_expression': 'head_shake',
    },
    'WHAT': {
        'frames': [
            {'time': 0, 'right_hand': 'open', 'position': 'front', 'motion': 'palm_up_shake'},
            {'time': 400, 'right_hand': 'open', 'position': 'front', 'motion': 'stop'},
        ],
        'duration': 400,
        'requires_two_hands': True,
        'facial_expression': 'question',
    },
    'WHERE': {
        'frames': [
            {'time': 0, 'right_hand': 'index_point', 'position': 'front', 'motion': 'wag'},
            {'time': 400, 'right_hand': 'index_point', 'position': 'front', 'motion': 'stop'},
        ],
        'duration': 400,
        'requires_two_hands': False,
        'facial_expression': 'question',
    },
    'HOW': {
        'frames': [
            {'time': 0, 'right_hand': 'fist_knuckles', 'position': 'together', 'motion': 'roll_open'},
            {'time': 400, 'right_hand': 'open', 'position': 'palms_up', 'motion': 'stop'},
        ],
        'duration': 400,
        'requires_two_hands': True,
        'facial_expression': 'question',
    },
    'QUESTION': {
        'frames': [
            {'time': 0, 'right_hand': 'index_point', 'position': 'front', 'motion': 'draw_question_mark'},
        ],
        'duration': 300,
        'requires_two_hands': False,
        'facial_expression': 'question',
    },
    'PAST': {
        'frames': [
            {'time': 0, 'right_hand': 'open', 'position': 'shoulder', 'motion': 'wave_back'},
        ],
        'duration': 300,
        'requires_two_hands': False,
        'facial_expression': 'neutral',
    },
    'FUTURE': {
        'frames': [
            {'time': 0, 'right_hand': 'open', 'position': 'front', 'motion': 'push_forward'},
        ],
        'duration': 300,
        'requires_two_hands': False,
        'facial_expression': 'neutral',
    },
}

# Transition timing constants (milliseconds)
TRANSITION_DURATION = 150  # ms between signs
REST_POSITION_DURATION = 100  # ms to return to rest


class SignLanguageService:
    """Service for sign language mapping and animation generation."""

    @staticmethod
    def get_sign_mapping(tamil_word: str) -> dict:
        """Look up a sign mapping from the database."""
        mapping = SignMapping.find_by_tamil_word(tamil_word)
        if mapping:
            return mapping.to_dict()
        return None

    @staticmethod
    def generate_animation_sequence(sign_tokens: list,
                                     playback_speed: float = 1.0) -> dict:
        """Generate a timed animation sequence from sign tokens.

        This is the gesture sequencing engine - it converts text tokens
        into timed avatar motions, handling transitions between signs.

        Args:
            sign_tokens: List of sign token dicts from NLP processing
            playback_speed: Playback speed multiplier

        Returns:
            Dict with animation timeline and metadata
        """
        timeline = []
        current_time = 0

        for i, token in enumerate(sign_tokens):
            gloss = token.get('gloss', '')
            token_type = token.get('type', '')

            if token_type == 'fingerspell':
                # Generate finger spelling sequence
                fs_sequence = SignLanguageService._generate_fingerspell(
                    token['original'], current_time, playback_speed
                )
                timeline.extend(fs_sequence['frames'])
                current_time = fs_sequence['end_time']

            elif gloss in DEFAULT_SIGN_ANIMATIONS:
                # Get animation from built-in data
                anim = DEFAULT_SIGN_ANIMATIONS[gloss]
                sign_entry = SignLanguageService._create_timeline_entry(
                    gloss, anim, current_time, playback_speed
                )
                timeline.append(sign_entry)
                current_time = sign_entry['end_time']

            else:
                # Check database for custom animations
                db_mapping = None
                try:
                    db_mapping = SignLanguageService.get_sign_mapping(token.get('original', ''))
                except Exception:
                    pass

                if db_mapping and db_mapping.get('animation_data'):
                    sign_entry = SignLanguageService._create_timeline_entry(
                        gloss, db_mapping['animation_data'], current_time, playback_speed
                    )
                    timeline.append(sign_entry)
                    current_time = sign_entry['end_time']
                else:
                    # Fallback: create a generic sign placeholder
                    placeholder = SignLanguageService._create_placeholder(
                        gloss, current_time, playback_speed
                    )
                    timeline.append(placeholder)
                    current_time = placeholder['end_time']

            # Add transition time between signs
            if i < len(sign_tokens) - 1:
                transition_time = int(TRANSITION_DURATION / playback_speed)
                timeline.append({
                    'type': 'transition',
                    'start_time': current_time,
                    'end_time': current_time + transition_time,
                    'duration': transition_time,
                })
                current_time += transition_time

        return {
            'timeline': timeline,
            'total_duration': current_time,
            'total_signs': len([e for e in timeline if e.get('type') != 'transition']),
            'playback_speed': playback_speed,
        }

    @staticmethod
    def _create_timeline_entry(gloss: str, animation_data: dict,
                                start_time: int, speed: float) -> dict:
        """Create a timeline entry for a sign.

        Args:
            gloss: Sign gloss notation
            animation_data: Animation frame data
            start_time: Start time in milliseconds
            speed: Playback speed multiplier

        Returns:
            Timeline entry dict
        """
        base_duration = animation_data.get('duration', 500)
        adjusted_duration = int(base_duration / speed)

        # Adjust frame timings
        frames = []
        for frame in animation_data.get('frames', []):
            adjusted_frame = dict(frame)
            adjusted_frame['time'] = start_time + int(frame.get('time', 0) / speed)
            frames.append(adjusted_frame)

        return {
            'type': 'sign',
            'gloss': gloss,
            'start_time': start_time,
            'end_time': start_time + adjusted_duration,
            'duration': adjusted_duration,
            'frames': frames,
            'requires_two_hands': animation_data.get('requires_two_hands', False),
            'facial_expression': animation_data.get('facial_expression', 'neutral'),
        }

    @staticmethod
    def _create_placeholder(gloss: str, start_time: int, speed: float) -> dict:
        """Create a placeholder animation for unmapped signs."""
        duration = int(500 / speed)
        return {
            'type': 'placeholder',
            'gloss': gloss,
            'start_time': start_time,
            'end_time': start_time + duration,
            'duration': duration,
            'frames': [
                {'time': start_time, 'right_hand': 'open', 'position': 'front',
                 'motion': 'hold'},
            ],
            'requires_two_hands': False,
            'facial_expression': 'neutral',
        }

    @staticmethod
    def _generate_fingerspell(word: str, start_time: int,
                               speed: float) -> dict:
        """Generate finger spelling animation for a Tamil word.

        Uses individual Tamil character animations to spell out
        words that don't have direct sign mappings.

        Args:
            word: Tamil word to finger spell
            start_time: Start time in ms
            speed: Playback speed

        Returns:
            Dict with frames list and end_time
        """
        from app.services.nlp_service import NLPService

        chars = NLPService.get_tamil_chars(word)
        frames = []
        current_time = start_time
        char_duration = int(400 / speed)  # 400ms per character
        transition = int(100 / speed)

        for char in chars:
            frames.append({
                'type': 'fingerspell_char',
                'character': char,
                'gloss': f'FS_{char}',
                'start_time': current_time,
                'end_time': current_time + char_duration,
                'duration': char_duration,
                'frames': [
                    {
                        'time': current_time,
                        'right_hand': 'fingerspell',
                        'character': char,
                        'position': 'front',
                        'motion': 'hold',
                    }
                ],
                'facial_expression': 'neutral',
            })
            current_time += char_duration + transition

        return {
            'frames': frames,
            'end_time': current_time,
            'word': word,
            'char_count': len(chars),
        }

    @staticmethod
    def get_available_signs() -> list:
        """Get list of all available sign mappings."""
        # Combine database mappings with built-in defaults
        builtin_signs = list(DEFAULT_SIGN_ANIMATIONS.keys())

        try:
            db_signs = SignMapping.find_all_active()
            db_sign_list = [s.to_dict() for s in db_signs]
        except Exception:
            db_sign_list = []

        return {
            'builtin_signs': builtin_signs,
            'database_signs': db_sign_list,
            'total': len(builtin_signs) + len(db_sign_list),
        }
