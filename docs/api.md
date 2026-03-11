 # API Documentation

## Base URL
```
Development: http://localhost:5000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## POST /auth/register

Register a new user.

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "StrongPass@123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": { "id": 1, "username": "john_doe", "email": "john@example.com" },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

---

## POST /auth/login

**Request:**
```json
{ "email": "john@example.com", "password": "StrongPass@123" }
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "username": "john_doe" },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

---

## POST /translate/speech/recognize

Convert audio to Tamil text.

**Request:**
```json
{
  "audio": "<base64_encoded_audio>",
  "encoding": "LINEAR16",
  "sample_rate": 16000
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "text": "வணக்கம் எப்படி இருக்கீர்கள்",
    "confidence": 0.92,
    "alternatives": [{ "text": "...", "confidence": 0.78 }]
  }
}
```

---

## POST /translate/nlp/process

Process Tamil text for sign language.

**Request:**
```json
{ "text": "வணக்கம் எப்படி இருக்கீர்கள்" }
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "original_text": "வணக்கம் எப்படி இருக்கீர்கள்",
    "sign_tokens": [
      { "original": "வணக்கம்", "gloss": "HELLO", "type": "mapped", "has_sign": true },
      { "original": "எப்படி", "gloss": "HOW", "type": "mapped", "has_sign": true }
    ],
    "tense": "present",
    "sentence_type": "question"
  }
}
```

---

## POST /translate/avatar/generate

Generate avatar animation.

**Request:**
```json
{
  "sign_tokens": [
    { "original": "வணக்கம்", "gloss": "HELLO", "type": "mapped" }
  ],
  "playback_speed": 1.0
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "type": "sign",
        "gloss": "HELLO",
        "start_time": 0,
        "end_time": 600,
        "frames": [{ "time": 0, "right_hand": "open", "position": "forehead" }],
        "facial_expression": "smile"
      }
    ],
    "total_duration": 600,
    "total_signs": 1
  }
}
```

---

## POST /translate/full

Execute the complete pipeline (speech → text → NLP → animation).

**Request:**
```json
{
  "audio": "<base64_encoded_audio>",
  "playback_speed": 1.0
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "translation_id": 42,
    "speech": { "text": "...", "confidence": 0.92 },
    "nlp": { "sign_tokens": [...], "tense": "present" },
    "animation": { "timeline": [...], "total_duration": 2400 }
  }
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "error_type"
}
```

| Status | Error Type | Description |
|--------|-----------|-------------|
| 400 | bad_request | Invalid input |
| 401 | unauthorized | Missing/invalid token |
| 403 | forbidden | Access denied |
| 404 | not_found | Resource not found |
| 409 | conflict | Duplicate resource |
| 429 | rate_limited | Too many requests |
| 500 | internal_error | Server error |
