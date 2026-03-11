/**
 * Register Screen
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const updateField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleRegister = async () => {
        const { username, email, password, confirmPassword, firstName, lastName } = formData;

        if (!username.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters long.');
            return;
        }

        setIsLoading(true);
        try {
            await register(
                username.trim(),
                email.trim(),
                password,
                firstName.trim() || undefined,
                lastName.trim() || undefined
            );
        } catch (error) {
            Alert.alert('Registration Failed', error.message || 'Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#0a0a14', '#1e1e2e', '#312e81']} style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#818cf8" />
                        </TouchableOpacity>
                    </View>

                    {/* Logo */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="person-add" size={40} color="#818cf8" />
                        </View>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join TSL Translate today</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formSection}>
                        {/* Name Row */}
                        <View style={styles.row}>
                            <View style={[styles.inputContainer, styles.halfInput]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="First Name"
                                    placeholderTextColor="#6b7280"
                                    value={formData.firstName}
                                    onChangeText={(v) => updateField('firstName', v)}
                                />
                            </View>
                            <View style={[styles.inputContainer, styles.halfInput]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Last Name"
                                    placeholderTextColor="#6b7280"
                                    value={formData.lastName}
                                    onChangeText={(v) => updateField('lastName', v)}
                                />
                            </View>
                        </View>

                        {/* Username */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#818cf8" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Username *"
                                placeholderTextColor="#6b7280"
                                value={formData.username}
                                onChangeText={(v) => updateField('username', v)}
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Email */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#818cf8" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email *"
                                placeholderTextColor="#6b7280"
                                value={formData.email}
                                onChangeText={(v) => updateField('email', v)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Password */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#818cf8" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password *"
                                placeholderTextColor="#6b7280"
                                value={formData.password}
                                onChangeText={(v) => updateField('password', v)}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color="#6b7280"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="shield-checkmark-outline" size={20} color="#818cf8" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password *"
                                placeholderTextColor="#6b7280"
                                value={formData.confirmPassword}
                                onChangeText={(v) => updateField('confirmPassword', v)}
                                secureTextEntry={!showPassword}
                            />
                        </View>

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={['#6366f1', '#8b5cf6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.registerButtonText}>Create Account</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.loginSection}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    keyboardView: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 44 : 20,
        marginBottom: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoSection: { alignItems: 'center', marginBottom: 24 },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 22,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#a5b4fc',
        marginTop: 4,
    },
    formSection: {
        backgroundColor: 'rgba(30, 30, 46, 0.8)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: { flex: 1 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(17, 17, 27, 0.8)',
        borderRadius: 14,
        paddingHorizontal: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.15)',
        height: 54,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: '#fff' },
    registerButton: {
        marginTop: 8,
        borderRadius: 14,
        overflow: 'hidden',
    },
    buttonDisabled: { opacity: 0.7 },
    gradientButton: {
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: 14,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    loginSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginText: { color: '#9ca3af', fontSize: 14 },
    loginLink: { color: '#818cf8', fontSize: 14, fontWeight: '600' },
});
