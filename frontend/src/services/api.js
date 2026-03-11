/**
 * API Service - Handles all HTTP communication with the Flask backend.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this IP to your computer's local network IP (run `ipconfig` to find it)
const API_BASE_URL = __DEV__
    ? 'http://10.252.194.1:5000/api/v1'  // Your computer's WiFi IP
    : 'https://your-production-api.com/api/v1';

class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    /**
     * Get stored auth token.
     */
    async getToken() {
        return await AsyncStorage.getItem('access_token');
    }

    /**
     * Make an authenticated API request.
     */
    async request(endpoint, options = {}) {
        const token = await this.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: data.message || 'Request failed',
                    data,
                };
            }

            return data;
        } catch (error) {
            if (error.status) throw error;
            throw {
                status: 0,
                message: 'Network error. Please check your connection.',
                data: null,
            };
        }
    }

    /**
     * GET request.
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request.
     */
    async post(endpoint, body = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    /**
     * PUT request.
     */
    async put(endpoint, body = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    // ─── Auth Endpoints ───────────────────────────────

    async register(username, email, password, firstName, lastName) {
        return this.post('/auth/register', {
            username,
            email,
            password,
            first_name: firstName,
            last_name: lastName,
        });
    }

    async login(email, password) {
        return this.post('/auth/login', { email, password });
    }

    async getProfile() {
        return this.get('/auth/profile');
    }

    async updateProfile(data) {
        return this.put('/auth/profile', data);
    }

    async logout() {
        return this.post('/auth/logout');
    }

    // ─── Translation Endpoints ────────────────────────

    async recognizeSpeech(audioBase64, encoding = 'LINEAR16', sampleRate = 16000) {
        return this.post('/translate/speech/recognize', {
            audio: audioBase64,
            encoding,
            sample_rate: sampleRate,
        });
    }

    async processNLP(text) {
        return this.post('/translate/nlp/process', { text });
    }

    async generateAvatar(signTokens, playbackSpeed = 1.0) {
        return this.post('/translate/avatar/generate', {
            sign_tokens: signTokens,
            playback_speed: playbackSpeed,
        });
    }

    async generateFingerSpelling(word, charDuration = 400) {
        return this.post('/translate/fingerspelling/generate', {
            word,
            char_duration: charDuration,
        });
    }

    async fullTranslation(audioBase64, playbackSpeed = 1.0) {
        return this.post('/translate/full', {
            audio: audioBase64,
            playback_speed: playbackSpeed,
        });
    }

    async getTranslationHistory(page = 1, perPage = 20) {
        return this.get('/translate/history', { page, per_page: perPage });
    }

    async getAvailableSigns() {
        return this.get('/translate/signs');
    }

    // ─── System Endpoints ─────────────────────────────

    async healthCheck() {
        return this.get('/healthcheck');
    }
}

export default new ApiService();
