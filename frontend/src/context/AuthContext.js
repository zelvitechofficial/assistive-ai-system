/**
 * Authentication Context - Manages user authentication state.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check for existing session on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (token) {
                const response = await api.getProfile();
                setUser(response.data);
                setIsAuthenticated(true);
            }
        } catch (error) {
            // Token expired or invalid
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('refresh_token');
        } finally {
            setIsLoading(false);
        }
    };

    const login = useCallback(async (email, password) => {
        const response = await api.login(email, password);
        const { user: userData, access_token, refresh_token } = response.data;

        await AsyncStorage.setItem('access_token', access_token);
        await AsyncStorage.setItem('refresh_token', refresh_token);

        setUser(userData);
        setIsAuthenticated(true);

        return userData;
    }, []);

    const register = useCallback(async (username, email, password, firstName, lastName) => {
        const response = await api.register(username, email, password, firstName, lastName);
        const { user: userData, access_token, refresh_token } = response.data;

        await AsyncStorage.setItem('access_token', access_token);
        await AsyncStorage.setItem('refresh_token', refresh_token);

        setUser(userData);
        setIsAuthenticated(true);

        return userData;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.logout();
        } catch (error) {
            // Ignore logout errors
        } finally {
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('refresh_token');
            setUser(null);
            setIsAuthenticated(false);
        }
    }, []);

    const updateProfile = useCallback(async (data) => {
        const response = await api.updateProfile(data);
        setUser(response.data);
        return response.data;
    }, []);

    const value = {
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        updateProfile,
        checkAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
