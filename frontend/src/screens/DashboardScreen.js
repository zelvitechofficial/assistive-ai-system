/**
 * Dashboard Screen - Main hub after authentication.
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';

const { width } = Dimensions.get('window');

const FEATURES = [
    {
        id: 'translate',
        title: 'Translate Speech',
        subtitle: 'Speak Tamil → See Signs',
        icon: 'mic',
        gradient: ['#6366f1', '#8b5cf6'],
        screen: 'Translation',
    },
    {
        id: 'history',
        title: 'Translation History',
        subtitle: 'View past translations',
        icon: 'time',
        gradient: ['#06b6d4', '#3b82f6'],
        screen: 'History',
    },
    {
        id: 'profile',
        title: 'My Profile',
        subtitle: 'Settings & preferences',
        icon: 'person',
        gradient: ['#f59e0b', '#ef4444'],
        screen: 'Profile',
    },
];

const STATS = [
    { label: 'Translations', value: '—', icon: 'language' },
    { label: 'Signs Available', value: '50+', icon: 'hand-left' },
    { label: 'Accuracy', value: '92%', icon: 'analytics' },
];

export default function DashboardScreen({ navigation }) {
    const { user, logout } = useAuth();
    const { history } = useTranslation();

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <LinearGradient colors={['#0a0a14', '#11111b', '#1e1e2e']} style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{greeting()} 👋</Text>
                        <Text style={styles.userName}>
                            {user?.first_name || user?.username || 'User'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={logout}
                    >
                        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                    </TouchableOpacity>
                </View>

                {/* Hero Card */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('Translation')}
                >
                    <LinearGradient
                        colors={['#4f46e5', '#7c3aed', '#a855f7']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                    >
                        <View style={styles.heroContent}>
                            <View style={styles.heroTextSection}>
                                <Text style={styles.heroTitle}>Start Translating</Text>
                                <Text style={styles.heroSubtitle}>
                                    Speak in Tamil and watch the AI translate your speech into sign language
                                </Text>
                                <View style={styles.heroButton}>
                                    <Text style={styles.heroButtonText}>Begin Now</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </View>
                            </View>
                            <View style={styles.heroIconContainer}>
                                <Ionicons name="hand-left" size={64} color="rgba(255,255,255,0.3)" />
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    {STATS.map((stat, index) => (
                        <View key={index} style={styles.statCard}>
                            <Ionicons name={stat.icon} size={22} color="#818cf8" />
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Features Grid */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.featuresGrid}>
                    {FEATURES.map((feature) => (
                        <TouchableOpacity
                            key={feature.id}
                            style={styles.featureCard}
                            onPress={() => navigation.navigate(feature.screen)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={feature.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.featureGradient}
                            >
                                <Ionicons name={feature.icon} size={28} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.featureTitle}>{feature.title}</Text>
                            <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={22} color="#818cf8" />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoTitle}>How it works</Text>
                        <Text style={styles.infoText}>
                            1. Press "Translate Speech"{'\n'}
                            2. Speak in Tamil{'\n'}
                            3. AI converts your speech to text{'\n'}
                            4. Text is processed for sign grammar{'\n'}
                            5. Watch the avatar perform signs
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 14,
        color: '#9ca3af',
        letterSpacing: 0.5,
    },
    userName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        marginTop: 2,
    },
    logoutButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    heroCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        overflow: 'hidden',
    },
    heroContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heroTextSection: { flex: 1, paddingRight: 16 },
    heroTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 20,
        marginBottom: 16,
    },
    heroButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 12,
        alignSelf: 'flex-start',
        gap: 8,
    },
    heroButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    heroIconContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(30, 30, 46, 0.8)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.15)',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 2,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 16,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    featureCard: {
        width: (width - 52) / 2,
        backgroundColor: 'rgba(30, 30, 46, 0.8)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.12)',
    },
    featureGradient: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    featureSubtitle: {
        fontSize: 12,
        color: '#9ca3af',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.15)',
        gap: 12,
    },
    infoTextContainer: { flex: 1 },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#a5b4fc',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 12,
        color: '#9ca3af',
        lineHeight: 20,
    },
});
