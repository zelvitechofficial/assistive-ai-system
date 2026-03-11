/**
 * Avatar Animation Screen - Display sign language avatar.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Animated,
    Dimensions,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = width * 0.7;

// Avatar body part positions (relative to a center point)
const BODY_PARTS = {
    head: { x: 0, y: -120 },
    body: { x: 0, y: -20 },
    leftArm: { x: -80, y: -40 },
    rightArm: { x: 80, y: -40 },
    leftHand: { x: -100, y: 20 },
    rightHand: { x: 100, y: 20 },
};

export default function AvatarScreen({ navigation, route }) {
    const { animation, speechText, signTokens } = route.params || {};
    const [currentSignIndex, setCurrentSignIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

    // Animation values
    const rightHandX = useRef(new Animated.Value(0)).current;
    const rightHandY = useRef(new Animated.Value(0)).current;
    const leftHandX = useRef(new Animated.Value(0)).current;
    const leftHandY = useRef(new Animated.Value(0)).current;
    const bodyRotate = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const filteredTokens = signTokens?.filter(t => t.type !== 'transition') || [];

    useEffect(() => {
        // Fade in, then auto-play the animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start(() => {
            // Auto-start the sign animation after fade-in
            if (filteredTokens.length > 0) {
                setIsPlaying(true);
                setCurrentSignIndex(0);
                animateSign(0);
            }
        });
    }, []);

    const playAnimation = () => {
        if (filteredTokens.length === 0) return;

        setIsPlaying(true);
        setCurrentSignIndex(0);
        animateSign(0);
    };

    const animateSign = (index) => {
        if (index >= filteredTokens.length) {
            setIsPlaying(false);
            resetPosition();
            return;
        }

        setCurrentSignIndex(index);
        const token = filteredTokens[index];
        const gloss = token.gloss;
        const duration = Math.round(800 / playbackSpeed);

        // Get target hand position based on sign type
        const positions = getSignPosition(gloss);

        Animated.parallel([
            Animated.spring(rightHandX, {
                toValue: positions.rightX,
                speed: 12 * playbackSpeed,
                bounciness: 8,
                useNativeDriver: true,
            }),
            Animated.spring(rightHandY, {
                toValue: positions.rightY,
                speed: 12 * playbackSpeed,
                bounciness: 8,
                useNativeDriver: true,
            }),
            Animated.spring(leftHandX, {
                toValue: positions.leftX,
                speed: 12 * playbackSpeed,
                bounciness: 8,
                useNativeDriver: true,
            }),
            Animated.spring(leftHandY, {
                toValue: positions.leftY,
                speed: 12 * playbackSpeed,
                bounciness: 8,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setTimeout(() => {
                animateSign(index + 1);
            }, duration);
        });
    };

    const getSignPosition = (gloss) => {
        // Map sign glosses to hand positions for avatar animation
        const positions = {
            'HELLO': { rightX: 30, rightY: -100, leftX: 0, leftY: 0 },
            'THANK_YOU': { rightX: 20, rightY: -60, leftX: 0, leftY: 0 },
            'I': { rightX: 0, rightY: -20, leftX: 0, leftY: 0 },
            'YOU': { rightX: 60, rightY: -40, leftX: 0, leftY: 0 },
            'YOU_FORMAL': { rightX: 60, rightY: -50, leftX: 0, leftY: 0 },
            'HE': { rightX: 70, rightY: -30, leftX: 0, leftY: 0 },
            'SHE': { rightX: 70, rightY: -30, leftX: 0, leftY: 0 },
            'HOW': { rightX: 40, rightY: -50, leftX: -40, leftY: -50 },
            'WHAT': { rightX: 50, rightY: -30, leftX: -50, leftY: -30 },
            'WHERE': { rightX: 60, rightY: -60, leftX: 0, leftY: 0 },
            'WHO': { rightX: 30, rightY: -70, leftX: 0, leftY: 0 },
            'GOOD': { rightX: 20, rightY: -50, leftX: 0, leftY: 0 },
            'BAD': { rightX: 30, rightY: -30, leftX: 0, leftY: 0 },
            'BIG': { rightX: 70, rightY: -40, leftX: -70, leftY: -40 },
            'SMALL': { rightX: 20, rightY: -40, leftX: -20, leftY: -40 },
            'COME': { rightX: 40, rightY: -30, leftX: 0, leftY: 0 },
            'GO': { rightX: 70, rightY: -20, leftX: 0, leftY: 0 },
            'EAT': { rightX: 20, rightY: -80, leftX: 0, leftY: 0 },
            'DRINK': { rightX: 25, rightY: -90, leftX: 0, leftY: 0 },
            'SLEEP': { rightX: 20, rightY: -100, leftX: -20, leftY: -100 },
            'WORK': { rightX: 30, rightY: -30, leftX: -30, leftY: -30 },
            'STUDY': { rightX: 40, rightY: -50, leftX: -30, leftY: -20 },
            'SPEAK': { rightX: 25, rightY: -75, leftX: 0, leftY: 0 },
            'LISTEN': { rightX: 40, rightY: -90, leftX: 0, leftY: 0 },
            'SEE': { rightX: 30, rightY: -85, leftX: 0, leftY: 0 },
            'TIME': { rightX: -20, rightY: -20, leftX: 0, leftY: 0 },
            'TODAY': { rightX: 30, rightY: -20, leftX: -30, leftY: -20 },
            'TOMORROW': { rightX: 50, rightY: -70, leftX: 0, leftY: 0 },
            'YESTERDAY': { rightX: -40, rightY: -60, leftX: 0, leftY: 0 },
            'HOUSE': { rightX: 30, rightY: -80, leftX: -30, leftY: -80 },
            'SCHOOL': { rightX: 30, rightY: -40, leftX: -30, leftY: -40 },
            'WATER': { rightX: 20, rightY: -70, leftX: 0, leftY: 0 },
            'FOOD': { rightX: 20, rightY: -80, leftX: 0, leftY: 0 },
            'MOTHER': { rightX: 20, rightY: -75, leftX: 0, leftY: 0 },
            'FATHER': { rightX: 20, rightY: -95, leftX: 0, leftY: 0 },
            'FRIEND': { rightX: 35, rightY: -40, leftX: -35, leftY: -40 },
            'TEACHER': { rightX: 30, rightY: -90, leftX: -30, leftY: -90 },
            'HAPPY': { rightX: 25, rightY: -40, leftX: -25, leftY: -40 },
            'SAD': { rightX: 15, rightY: -70, leftX: -15, leftY: -70 },
            'ANGRY': { rightX: 30, rightY: -85, leftX: -30, leftY: -85 },
            'YES': { rightX: 0, rightY: -50, leftX: 0, leftY: 0 },
            'NO': { rightX: 40, rightY: -40, leftX: 0, leftY: 0 },
            'OK': { rightX: 50, rightY: -50, leftX: 0, leftY: 0 },
            'PLEASE': { rightX: 15, rightY: -35, leftX: 0, leftY: 0 },
            'SORRY': { rightX: 10, rightY: -30, leftX: 0, leftY: 0 },
            'HELP': { rightX: 30, rightY: -20, leftX: -20, leftY: -10 },
            'STOP': { rightX: 50, rightY: -50, leftX: -20, leftY: -20 },
            'QUESTION': { rightX: 50, rightY: -70, leftX: 0, leftY: 0 },
            'PAST': { rightX: -40, rightY: -60, leftX: 0, leftY: 0 },
            'FUTURE': { rightX: 60, rightY: -40, leftX: 0, leftY: 0 },
        };

        return positions[gloss] || { rightX: 50, rightY: -40, leftX: 0, leftY: 0 };
    };

    const resetPosition = () => {
        Animated.parallel([
            Animated.spring(rightHandX, { toValue: 0, useNativeDriver: true }),
            Animated.spring(rightHandY, { toValue: 0, useNativeDriver: true }),
            Animated.spring(leftHandX, { toValue: 0, useNativeDriver: true }),
            Animated.spring(leftHandY, { toValue: 0, useNativeDriver: true }),
        ]).start();
    };

    const stopAnimation = () => {
        setIsPlaying(false);
        resetPosition();
    };

    return (
        <LinearGradient colors={['#0a0a14', '#11111b', '#1e1e2e']} style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#818cf8" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sign Language Avatar</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Speech Text */}
                {speechText ? (
                    <View style={styles.textCard}>
                        <Text style={styles.textLabel}>Tamil Text</Text>
                        <Text style={styles.tamilText}>{speechText}</Text>
                    </View>
                ) : null}

                {/* Avatar Area */}
                <Animated.View style={[styles.avatarContainer, { opacity: fadeAnim }]}>
                    <View style={styles.avatarBody}>
                        {/* Head */}
                        <View style={styles.avatarHead}>
                            <View style={styles.headCircle}>
                                <View style={styles.eyeLeft} />
                                <View style={styles.eyeRight} />
                                <View style={[
                                    styles.mouth,
                                    currentSignIndex < filteredTokens.length &&
                                        filteredTokens[currentSignIndex]?.type === 'question_marker'
                                        ? styles.mouthQuestion
                                        : null
                                ]} />
                            </View>
                        </View>

                        {/* Torso */}
                        <View style={styles.torso} />

                        {/* Left Arm + Hand */}
                        <Animated.View
                            style={[
                                styles.leftHand,
                                {
                                    transform: [
                                        { translateX: leftHandX },
                                        { translateY: leftHandY },
                                    ],
                                },
                            ]}
                        >
                            <View style={styles.handCircle}>
                                <Ionicons name="hand-left" size={24} color="#a78bfa" />
                            </View>
                        </Animated.View>

                        {/* Right Arm + Hand */}
                        <Animated.View
                            style={[
                                styles.rightHand,
                                {
                                    transform: [
                                        { translateX: rightHandX },
                                        { translateY: rightHandY },
                                    ],
                                },
                            ]}
                        >
                            <View style={styles.handCircle}>
                                <Ionicons name="hand-right" size={24} color="#a78bfa" />
                            </View>
                        </Animated.View>
                    </View>

                    {/* Current Sign Label */}
                    {isPlaying && currentSignIndex < filteredTokens.length && (
                        <View style={styles.currentSignLabel}>
                            <Text style={styles.currentSignText}>
                                {filteredTokens[currentSignIndex]?.gloss}
                            </Text>
                            <Text style={styles.currentSignOriginal}>
                                {filteredTokens[currentSignIndex]?.original}
                            </Text>
                        </View>
                    )}
                </Animated.View>

                {/* Sign Sequence */}
                <View style={styles.sequenceCard}>
                    <Text style={styles.textLabel}>Sign Sequence</Text>
                    <View style={styles.sequenceList}>
                        {filteredTokens.map((token, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.sequenceItem,
                                    index === currentSignIndex && isPlaying && styles.sequenceItemActive,
                                    token.type === 'fingerspell' && styles.sequenceItemFS,
                                ]}
                            >
                                <Text style={styles.sequenceGloss}>{token.gloss}</Text>
                                <Text style={styles.sequenceOriginal}>{token.original}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => setPlaybackSpeed(Math.max(0.5, playbackSpeed - 0.25))}
                    >
                        <Ionicons name="remove" size={20} color="#818cf8" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={isPlaying ? stopAnimation : playAnimation}
                    >
                        <LinearGradient
                            colors={isPlaying ? ['#ef4444', '#dc2626'] : ['#6366f1', '#8b5cf6']}
                            style={styles.playGradient}
                        >
                            <Ionicons
                                name={isPlaying ? 'stop' : 'play'}
                                size={28}
                                color="#fff"
                            />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => setPlaybackSpeed(Math.min(2.0, playbackSpeed + 0.25))}
                    >
                        <Ionicons name="add" size={20} color="#818cf8" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.speedLabel}>Speed: {playbackSpeed}x</Text>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    textCard: {
        backgroundColor: 'rgba(30, 30, 46, 0.8)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.15)',
    },
    textLabel: {
        fontSize: 12,
        color: '#818cf8',
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tamilText: {
        fontSize: 18,
        color: '#fff',
        lineHeight: 28,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 20,
        minHeight: 280,
        justifyContent: 'center',
    },
    avatarBody: {
        position: 'relative',
        width: 200,
        height: 260,
        alignItems: 'center',
    },
    avatarHead: {
        position: 'absolute',
        top: 0,
        alignItems: 'center',
        zIndex: 2,
    },
    headCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#c4a882',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#a78bfa',
    },
    eyeLeft: {
        position: 'absolute',
        top: 22,
        left: 18,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#1e1e2e',
    },
    eyeRight: {
        position: 'absolute',
        top: 22,
        right: 18,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#1e1e2e',
    },
    mouth: {
        position: 'absolute',
        bottom: 16,
        width: 16,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#1e1e2e',
    },
    mouthQuestion: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    torso: {
        position: 'absolute',
        top: 65,
        width: 80,
        height: 120,
        borderRadius: 20,
        backgroundColor: '#4f46e5',
        zIndex: 1,
    },
    leftHand: {
        position: 'absolute',
        top: 100,
        left: 10,
        zIndex: 3,
    },
    rightHand: {
        position: 'absolute',
        top: 100,
        right: 10,
        zIndex: 3,
    },
    handCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#c4a882',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#a78bfa',
        shadowColor: '#818cf8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    currentSignLabel: {
        marginTop: 16,
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    currentSignText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#a5b4fc',
    },
    currentSignOriginal: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 2,
    },
    sequenceCard: {
        backgroundColor: 'rgba(30, 30, 46, 0.8)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.15)',
    },
    sequenceList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sequenceItem: {
        backgroundColor: 'rgba(17, 17, 27, 0.8)',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.15)',
    },
    sequenceItemActive: {
        backgroundColor: 'rgba(99, 102, 241, 0.3)',
        borderColor: '#818cf8',
    },
    sequenceItemFS: {
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    sequenceGloss: {
        fontSize: 12,
        fontWeight: '700',
        color: '#a5b4fc',
    },
    sequenceOriginal: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 2,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    controlButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    playButton: {
        borderRadius: 35,
        overflow: 'hidden',
    },
    playGradient: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    speedLabel: {
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: 13,
        marginTop: 12,
    },
});
