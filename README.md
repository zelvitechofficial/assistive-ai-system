# Assistive AI System for Real-Time Tamil Speech to Tamil Sign Language Translation

A production-grade mobile AI application that converts real-time Tamil speech into Tamil Sign Language (TSL) using animated avatars.

## 🏗 Architecture

```
User Speech → Microphone → Audio Buffer → Flask Backend API
    → Google Cloud Speech API → Tamil Text
    → Tamil NLP Processing → Sign Grammar
    → Sign Language Mapping → Animation Sequence
    → Mobile Avatar Renderer → Visual Output
```

## 📁 Project Structure

```
project-root/
├── backend/                    # Flask Backend
│   ├── app/
│   │   ├── __init__.py         # Application factory
│   │   ├── extensions.py       # Flask extensions
│   │   ├── api/v1/             # API blueprints
│   │   │   ├── auth.py         # Authentication endpoints
│   │   │   ├── translation.py  # Translation endpoints
│   │   │   └── system.py       # Health check
│   │   ├── models/             # SQLAlchemy models
│   │   ├── services/           # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── speech_service.py
│   │   │   ├── nlp_service.py
│   │   │   ├── sign_language_service.py
│   │   │   ├── fingerspelling_service.py
│   │   │   └── translation_service.py
│   │   └── utils/              # Helpers
│   ├── tests/                  # Pytest tests
│   ├── config.py               # Multi-env config
│   ├── run.py                  # Entry point
│   └── requirements.txt
├── frontend/                   # Expo React Native
│   ├── src/
│   │   ├── context/            # React Context providers
│   │   ├── screens/            # App screens
│   │   └── services/           # API client
│   ├── App.js                  # Entry point
│   └── package.json
├── database/
│   ├── schema.sql              # PostgreSQL schema
│   └── seed.py                 # Seed data
├── docker/
│   └── Dockerfile.backend
├── docker-compose.yml
└── docs/
    └── api.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 16+
- Expo CLI

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
cp .env.example .env          # Edit with your settings

# Initialize database
python -c "from app import create_app; create_app()"

# Seed database
python ../database/seed.py

# Run server
python run.py
```

### Frontend Setup

```bash
cd frontend
npm install

# Start Expo dev server
npx expo start
```

### Docker Setup

```bash
docker-compose up --build
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/profile` | Get profile |
| PUT | `/api/v1/auth/profile` | Update profile |
| POST | `/api/v1/auth/logout` | Logout |

### Translation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/translate/speech/recognize` | Speech → Text |
| POST | `/api/v1/translate/nlp/process` | Text → Sign tokens |
| POST | `/api/v1/translate/avatar/generate` | Tokens → Animation |
| POST | `/api/v1/translate/fingerspelling/generate` | Word → Finger spelling |
| POST | `/api/v1/translate/full` | Full pipeline |
| GET | `/api/v1/translate/history` | Translation history |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/healthcheck` | Health check |

## 🧪 Testing

```bash
cd backend
pytest tests/ -v --cov=app
```

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo React Native |
| UI | NativeWind (Tailwind) |
| Backend | Python Flask |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Speech | Google Cloud Speech API |
| NLP | Custom Tamil NLP |
| Animation | Gesture sequencing engine |

## ⚙ Environment Variables

See `backend/.env.example` for all configuration options.

## 📜 License

MIT License
