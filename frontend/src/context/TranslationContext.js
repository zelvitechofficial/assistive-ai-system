/**
 * Translation Context - Manages translation state and pipeline.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const TranslationContext = createContext(null);

export function TranslationProvider({ children }) {
    const [isTranslating, setIsTranslating] = useState(false);
    const [currentTranslation, setCurrentTranslation] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);

    const translateSpeech = useCallback(async (audioBase64, playbackSpeed = 1.0) => {
        setIsTranslating(true);
        setError(null);

        try {
            const response = await api.fullTranslation(audioBase64, playbackSpeed);
            setCurrentTranslation(response.data);
            return response.data;
        } catch (err) {
            setError(err.message || 'Translation failed');
            throw err;
        } finally {
            setIsTranslating(false);
        }
    }, []);

    const recognizeSpeech = useCallback(async (audioBase64) => {
        setIsTranslating(true);
        setError(null);

        try {
            const response = await api.recognizeSpeech(audioBase64);
            return response.data;
        } catch (err) {
            setError(err.message || 'Speech recognition failed');
            throw err;
        } finally {
            setIsTranslating(false);
        }
    }, []);

    const processText = useCallback(async (text) => {
        setError(null);

        try {
            const response = await api.processNLP(text);
            return response.data;
        } catch (err) {
            setError(err.message || 'NLP processing failed');
            throw err;
        }
    }, []);

    const generateAnimation = useCallback(async (signTokens, speed = 1.0) => {
        setError(null);

        try {
            const response = await api.generateAvatar(signTokens, speed);
            return response.data;
        } catch (err) {
            setError(err.message || 'Animation generation failed');
            throw err;
        }
    }, []);

    const loadHistory = useCallback(async (page = 1) => {
        try {
            const response = await api.getTranslationHistory(page);
            setHistory(response.data.translations);
            return response.data;
        } catch (err) {
            setError(err.message || 'Failed to load history');
            throw err;
        }
    }, []);

    const clearTranslation = useCallback(() => {
        setCurrentTranslation(null);
        setError(null);
    }, []);

    const value = {
        isTranslating,
        currentTranslation,
        history,
        error,
        translateSpeech,
        recognizeSpeech,
        processText,
        generateAnimation,
        loadHistory,
        clearTranslation,
    };

    return (
        <TranslationContext.Provider value={value}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
}

export default TranslationContext;
