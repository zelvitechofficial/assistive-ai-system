"""Database seed data for development."""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend'))

from app import create_app
from app.extensions import get_db
from app.models.user import User
from app.models.sign_mapping import SignMapping
from app.models.user_preference import UserPreference


def seed_database():
    """Seed the database with initial data."""
    app = create_app('development')

    with app.app_context():
        print('🌱 Starting database seeding...')

        # Seed admin user
        if not User.find_by_username('admin'):
            admin = User(
                username='admin',
                email='admin@tslapp.com',
                first_name='System',
                last_name='Admin',
                is_admin=True,
            )
            admin.set_password('Admin@123')
            admin.save()

            # Admin preferences
            pref = UserPreference(user_id=str(admin._id), avatar_style='default', theme='dark')
            pref.save()
            print('✅ Admin user created. (admin@tslapp.com / Admin@123)')

        # Seed demo user
        if not User.find_by_username('demo_user'):
            demo = User(
                username='demo_user',
                email='demo@tslapp.com',
                first_name='Demo',
                last_name='User',
            )
            demo.set_password('Demo@123')
            demo.save()

            pref = UserPreference(user_id=str(demo._id), avatar_style='default', theme='light')
            pref.save()
            print('✅ Demo user created. (demo@tslapp.com / Demo@123)')

        # Seed sign mappings
        sign_mappings = [
            # Greetings
            {'tamil_word': 'வணக்கம்', 'sign_id': 'TSL_HELLO', 'category': 'greetings',
             'description': 'Hello/Namaste greeting sign',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'open', 'position': 'forehead', 'motion': 'wave'}], 'duration': 600}},
            {'tamil_word': 'நன்றி', 'sign_id': 'TSL_THANK_YOU', 'category': 'greetings',
             'description': 'Thank you sign',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'flat', 'position': 'chin', 'motion': 'forward'}], 'duration': 300}},
            {'tamil_word': 'மன்னிக்கவும்', 'sign_id': 'TSL_SORRY', 'category': 'greetings',
             'description': 'Sorry/Apology sign',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'fist', 'position': 'chest', 'motion': 'circular'}], 'duration': 500}},

            # Pronouns
            {'tamil_word': 'நான்', 'sign_id': 'TSL_I', 'category': 'pronouns',
             'description': 'First person singular - I',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'index_point', 'position': 'chest', 'motion': 'point_self'}], 'duration': 200}},
            {'tamil_word': 'நீ', 'sign_id': 'TSL_YOU', 'category': 'pronouns',
             'description': 'Second person singular - You',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'index_point', 'position': 'forward', 'motion': 'point_forward'}], 'duration': 200}},
            {'tamil_word': 'அவன்', 'sign_id': 'TSL_HE', 'category': 'pronouns',
             'description': 'Third person masculine - He',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'index_point', 'position': 'side_right', 'motion': 'point'}], 'duration': 200}},
            {'tamil_word': 'அவள்', 'sign_id': 'TSL_SHE', 'category': 'pronouns',
             'description': 'Third person feminine - She',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'index_point', 'position': 'side_left', 'motion': 'point'}], 'duration': 200}},

            # Common verbs
            {'tamil_word': 'வா', 'sign_id': 'TSL_COME', 'category': 'verbs',
             'description': 'Come',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'open', 'position': 'forward', 'motion': 'beckon'}], 'duration': 400}},
            {'tamil_word': 'போ', 'sign_id': 'TSL_GO', 'category': 'verbs',
             'description': 'Go',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'index_point', 'position': 'forward', 'motion': 'push_away'}], 'duration': 400}},
            {'tamil_word': 'சாப்பிடு', 'sign_id': 'TSL_EAT', 'category': 'verbs',
             'description': 'Eat',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'pinch', 'position': 'mouth', 'motion': 'to_mouth'}], 'duration': 400}},
            {'tamil_word': 'குடி', 'sign_id': 'TSL_DRINK', 'category': 'verbs',
             'description': 'Drink',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'c_shape', 'position': 'mouth', 'motion': 'tilt'}], 'duration': 400}},
            {'tamil_word': 'பார்', 'sign_id': 'TSL_SEE', 'category': 'verbs',
             'description': 'See/Look',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'v_shape', 'position': 'eyes', 'motion': 'forward'}], 'duration': 300}},

            # Question words
            {'tamil_word': 'என்ன', 'sign_id': 'TSL_WHAT', 'category': 'questions',
             'description': 'What',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'open', 'position': 'front', 'motion': 'palm_up_shake'}], 'duration': 400}},
            {'tamil_word': 'எப்படி', 'sign_id': 'TSL_HOW', 'category': 'questions',
             'description': 'How',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'fist_knuckles', 'position': 'together', 'motion': 'roll_open'}], 'duration': 400}},
            {'tamil_word': 'எங்கே', 'sign_id': 'TSL_WHERE', 'category': 'questions',
             'description': 'Where',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'index_point', 'position': 'front', 'motion': 'wag'}], 'duration': 400}},

            # Common nouns
            {'tamil_word': 'தண்ணீர்', 'sign_id': 'TSL_WATER', 'category': 'nouns',
             'description': 'Water',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'w_shape', 'position': 'chin', 'motion': 'tap'}], 'duration': 300}},
            {'tamil_word': 'உணவு', 'sign_id': 'TSL_FOOD', 'category': 'nouns',
             'description': 'Food',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'flat_pinch', 'position': 'mouth', 'motion': 'to_mouth'}], 'duration': 300}},
            {'tamil_word': 'வீடு', 'sign_id': 'TSL_HOUSE', 'category': 'nouns',
             'description': 'House/Home',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'triangle', 'position': 'top', 'motion': 'roof_shape'}], 'duration': 400}},
            {'tamil_word': 'அம்மா', 'sign_id': 'TSL_MOTHER', 'category': 'family',
             'description': 'Mother',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'open_thumb', 'position': 'chin', 'motion': 'tap'}], 'duration': 300}},
            {'tamil_word': 'அப்பா', 'sign_id': 'TSL_FATHER', 'category': 'family',
             'description': 'Father',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'open_thumb', 'position': 'forehead', 'motion': 'tap'}], 'duration': 300}},

            # Adjectives
            {'tamil_word': 'நல்ல', 'sign_id': 'TSL_GOOD', 'category': 'adjectives',
             'description': 'Good',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'thumbs_up', 'position': 'front', 'motion': 'hold'}], 'duration': 300}},
            {'tamil_word': 'கெட்ட', 'sign_id': 'TSL_BAD', 'category': 'adjectives',
             'description': 'Bad',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'thumbs_down', 'position': 'front', 'motion': 'hold'}], 'duration': 300}},

            # Responses
            {'tamil_word': 'ஆம்', 'sign_id': 'TSL_YES', 'category': 'responses',
             'description': 'Yes',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'fist', 'position': 'front', 'motion': 'nod'}], 'duration': 400}},
            {'tamil_word': 'இல்லை', 'sign_id': 'TSL_NO', 'category': 'responses',
             'description': 'No',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'index_middle', 'position': 'front', 'motion': 'close'}], 'duration': 300}},

            # Emotions
            {'tamil_word': 'மகிழ்ச்சி', 'sign_id': 'TSL_HAPPY', 'category': 'emotions',
             'description': 'Happy',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'open', 'position': 'chest', 'motion': 'circles_up'}], 'duration': 500}},
            {'tamil_word': 'வருத்தம்', 'sign_id': 'TSL_SAD', 'category': 'emotions',
             'description': 'Sad',
             'animation_data': {'frames': [{'time': 0, 'right_hand': 'open', 'position': 'face', 'motion': 'down'}], 'duration': 500}},
        ]

        for mapping_data in sign_mappings:
            if not SignMapping.find_by_tamil_word(mapping_data['tamil_word']):
                mapping = SignMapping(**mapping_data)
                mapping.save()

        print(f'✅ {len(sign_mappings)} sign mappings seeded.')
        print('🎉 Database seeding complete!')


if __name__ == '__main__':
    seed_database()
