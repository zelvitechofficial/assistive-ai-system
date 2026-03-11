/**
 * Translation Screen - Record and translate Tamil speech.
 * Uses expo-audio for recording + backend Whisper speech-to-text,
 * then maps Tamil words to sign language tokens.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    ActivityIndicator,
    Alert,
    Animated,
    ScrollView,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { File } from 'expo-file-system';
import { useTranslation } from '../context/TranslationContext';
import apiService from '../services/api';

// ─── Tamil → Sign Language Mapping (offline, instant lookup) ──────
const TAMIL_SIGN_MAP = {
    'வணக்கம்': { gloss: 'HELLO', emoji: '👋', desc: 'Wave hand near forehead' },
    'நன்றி': { gloss: 'THANK_YOU', emoji: '🙏', desc: 'Flat hand from chin forward' },
    'நான்': { gloss: 'I', emoji: '👤', desc: 'Point to self' },
    'நீ': { gloss: 'YOU', emoji: '👉', desc: 'Point forward' },
    'நீங்கள்': { gloss: 'YOU_FORMAL', emoji: '👉', desc: 'Point forward respectfully' },
    'அவன்': { gloss: 'HE', emoji: '👤', desc: 'Point to side' },
    'அவள்': { gloss: 'SHE', emoji: '👤', desc: 'Point to side' },
    'என்ன': { gloss: 'WHAT', emoji: '❓', desc: 'Palms up, shrug' },
    'எப்படி': { gloss: 'HOW', emoji: '🤔', desc: 'Knuckles together, twist' },
    'எங்கே': { gloss: 'WHERE', emoji: '📍', desc: 'Index finger wag' },
    'யார்': { gloss: 'WHO', emoji: '❓', desc: 'Circle index near chin' },
    'நல்ல': { gloss: 'GOOD', emoji: '👍', desc: 'Flat hand chin to forward' },
    'கெட்ட': { gloss: 'BAD', emoji: '👎', desc: 'Flat hand chin, twist down' },
    'பெரிய': { gloss: 'BIG', emoji: '🔵', desc: 'Hands spread apart' },
    'சிறிய': { gloss: 'SMALL', emoji: '🔹', desc: 'Hands close together' },
    'வா': { gloss: 'COME', emoji: '🫳', desc: 'Beckon with hand' },
    'போ': { gloss: 'GO', emoji: '👋', desc: 'Wave hand away' },
    'சாப்பிடு': { gloss: 'EAT', emoji: '🍽️', desc: 'Hand to mouth' },
    'குடி': { gloss: 'DRINK', emoji: '🥤', desc: 'C-hand tilt to mouth' },
    'தூக்கம்': { gloss: 'SLEEP', emoji: '😴', desc: 'Head tilt on palms' },
    'வேலை': { gloss: 'WORK', emoji: '💼', desc: 'Fists tap together' },
    'படி': { gloss: 'STUDY', emoji: '📖', desc: 'Open book hand' },
    'பேசு': { gloss: 'SPEAK', emoji: '🗣️', desc: 'Index near mouth, forward' },
    'கேள்': { gloss: 'LISTEN', emoji: '👂', desc: 'Cup hand at ear' },
    'பார்': { gloss: 'SEE', emoji: '👀', desc: 'V-hand from eyes forward' },
    'நேரம்': { gloss: 'TIME', emoji: '⏰', desc: 'Tap wrist' },
    'இன்று': { gloss: 'TODAY', emoji: '📅', desc: 'Palms down, bounce' },
    'நாளை': { gloss: 'TOMORROW', emoji: '➡️', desc: 'Thumb forward from chin' },
    'நேற்று': { gloss: 'YESTERDAY', emoji: '⬅️', desc: 'Thumb back at shoulder' },
    'வீடு': { gloss: 'HOUSE', emoji: '🏠', desc: 'Fingertips form roof' },
    'பள்ளி': { gloss: 'SCHOOL', emoji: '🏫', desc: 'Clap then open' },
    'தண்ணீர்': { gloss: 'WATER', emoji: '💧', desc: 'W-hand tap chin' },
    'உணவு': { gloss: 'FOOD', emoji: '🍛', desc: 'Flat hand to mouth' },
    'அம்மா': { gloss: 'MOTHER', emoji: '👩', desc: 'Open hand tap chin' },
    'அப்பா': { gloss: 'FATHER', emoji: '👨', desc: 'Open hand tap forehead' },
    'நண்பன்': { gloss: 'FRIEND', emoji: '🤝', desc: 'Hook index fingers' },
    'ஆசிரியர்': { gloss: 'TEACHER', emoji: '👩‍🏫', desc: 'Flat hands from temples forward' },
    'மகிழ்ச்சி': { gloss: 'HAPPY', emoji: '😊', desc: 'Flat hands circle up on chest' },
    'வருத்தம்': { gloss: 'SAD', emoji: '😢', desc: 'Hands slide down face' },
    'கோபம்': { gloss: 'ANGRY', emoji: '😠', desc: 'Claw hands up from face' },
    'ஆம்': { gloss: 'YES', emoji: '✅', desc: 'Fist nod forward' },
    'இல்லை': { gloss: 'NO', emoji: '❌', desc: 'Index-middle close on thumb' },
    'சரி': { gloss: 'OK', emoji: '👌', desc: 'O-K hand shape' },
    'தயவுசெய்து': { gloss: 'PLEASE', emoji: '🙏', desc: 'Flat hand circle on chest' },
    'மன்னிக்கவும்': { gloss: 'SORRY', emoji: '🙇', desc: 'Fist circle on chest' },
    'உதவி': { gloss: 'HELP', emoji: '🆘', desc: 'Fist on flat palm push up' },
    'நிறுத்து': { gloss: 'STOP', emoji: '✋', desc: 'Flat hand chop into palm' },
};

/** Map a Tamil sentence to sign tokens instantly (client-side). */
function mapTamilToSigns(tamilText) {
    if (!tamilText) return [];
    const words = tamilText.replace(/[.,!?؟]/g, '').split(/\s+/).filter(Boolean);
    return words.map(word => {
        const mapping = TAMIL_SIGN_MAP[word];
        if (mapping) {
            return { original: word, ...mapping, type: 'mapped', has_sign: true };
        }
        return {
            original: word,
            gloss: `FS(${word})`,
            emoji: '🤟',
            desc: 'Finger spell',
            type: 'fingerspell',
            has_sign: false,
        };
    });
}

export default function TranslationScreen({ navigation }) {
    const { processText, generateAnimation, isTranslating, error } = useTranslation();
    const [isRecording, setIsRecording] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const [interimText, setInterimText] = useState('');
    const [signTokens, setSignTokens] = useState([]);
    const [step, setStep] = useState('idle'); // idle, recording, processing, done
    const [mode, setMode] = useState('voice'); // voice or text
    const [textInput, setTextInput] = useState('');
    const [animationData, setAnimationData] = useState(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scrollRef = useRef(null);
    const recordingUriRef = useRef(null);
    const recordingDoneResolve = useRef(null);

    // expo-audio recorder hook — capture URI when recording finishes
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
        if (status.url) {
            recordingUriRef.current = status.url;
        }
        // Resolve the promise when recording is finished and URL is available
        if (status.isFinished && status.url && recordingDoneResolve.current) {
            recordingDoneResolve.current(status.url);
            recordingDoneResolve.current = null;
        }
    });

    // Pulse animation for recording button
    useEffect(() => {
        if (isRecording) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.3,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording]);

    // ─── Start audio recording with expo-audio ──────────────────
    const startRecording = async () => {
        try {
            const { granted } = await requestRecordingPermissionsAsync();
            if (!granted) {
                Alert.alert('Permission Required', 'Microphone access is needed for speech translation.');
                return;
            }

            setRecognizedText('');
            setInterimText('Listening...');
            setSignTokens([]);
            setAnimationData(null);
            recordingUriRef.current = null;
            recordingDoneResolve.current = null;
            setIsRecording(true);
            setStep('recording');

            await recorder.prepareToRecordAsync();
            recorder.record();
        } catch (err) {
            console.error('Failed to start recording:', err);
            setIsRecording(false);
            setStep('idle');
            Alert.alert('Error', 'Could not start recording. Please try again.');
        }
    };

    const stopRecording = async () => {
        try {
            setIsRecording(false);
            setInterimText('');
            setStep('processing');

            await recorder.stop();

            // Wait for URL from status event if not already available
            let rawUri = recordingUriRef.current || recorder.uri;
            if (!rawUri) {
                // Wait up to 3 seconds for the status event with the URL
                rawUri = await Promise.race([
                    new Promise((resolve) => { recordingDoneResolve.current = resolve; }),
                    new Promise((resolve) => setTimeout(() => resolve(null), 3000)),
                ]);
            }
            // Final fallback: check getStatus
            if (!rawUri) {
                rawUri = recorder.getStatus?.()?.url;
            }

            if (!rawUri) {
                Alert.alert('Error', 'Recording file not found. Please try again.');
                setStep('idle');
                return;
            }

            // Ensure URI has file:// scheme (expo-file-system requires absolute URI)
            const uri = rawUri.startsWith('file://') ? rawUri : `file://${rawUri}`;

            // Read audio file as base64 using expo-file-system File API
            const audioFile = new File(uri);
            const base64Audio = await audioFile.base64();

            if (!base64Audio) {
                Alert.alert('Error', 'Could not read audio file. Please try again.');
                setStep('idle');
                return;
            }

            // Send to backend for Tamil speech recognition
            const result = await apiService.recognizeSpeech(base64Audio);
            const text = result?.data?.text || result?.text || '';

            if (!text) {
                Alert.alert('No Speech Detected', 'Please speak clearly in Tamil and try again.');
                setStep('idle');
                return;
            }

            setRecognizedText(text);
            setSignTokens(mapTamilToSigns(text));
            setStep('done');
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
        } catch (err) {
            console.error('Speech recognition error:', err);
            setStep('idle');
            Alert.alert(
                'Speech Recognition Failed',
                err.message || 'Could not process speech. Check that the backend server is running and try again.',
            );
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    // ─── Navigate to avatar with animation data ─────────
    const goToAvatar = async () => {
        if (!recognizedText && signTokens.length === 0) return;

        let tokens = signTokens;
        let animation = animationData || { timeline: [], total_duration: 2000, total_signs: tokens.length };

        // If no cached animation, fetch from backend
        if (!animationData) {
            try {
                setStep('processing');

                try {
                    const nlpResult = await processText(recognizedText);
                    if (nlpResult?.sign_tokens && nlpResult.sign_tokens.length > 0) {
                        tokens = nlpResult.sign_tokens;
                    }
                } catch (nlpErr) {
                    console.log('NLP processing skipped (using local tokens):', nlpErr.message);
                }

                try {
                    const animResult = await generateAnimation(tokens);
                    if (animResult) {
                        animation = animResult;
                    }
                } catch (animErr) {
                    console.log('Animation generation skipped (using default):', animErr.message);
                }

                animation.total_signs = animation.total_signs || tokens.length;
                animation.total_duration = animation.total_duration || 2000;

            } catch (err) {
                console.error('Avatar preparation error:', err);
            }
            setStep('done');
        }

        navigation.navigate('Avatar', {
            animation,
            speechText: recognizedText,
            signTokens: tokens,
        });
    };

    // Text mode translation — show sign output on screen first
    const handleTextTranslate = async () => {
        if (!textInput.trim()) {
            Alert.alert('Error', 'Please enter Tamil text to translate.');
            return;
        }

        setStep('processing');
        const inputText = textInput.trim();
        // Show instant local mapping first
        const localTokens = mapTamilToSigns(inputText);
        setRecognizedText(inputText);
        setSignTokens(localTokens);

        let tokens = localTokens;
        let animation = { timeline: [], total_duration: 2000, total_signs: tokens.length };

        // Try backend NLP processing (optional enhancement)
        try {
            const nlpResult = await processText(inputText);
            if (nlpResult?.sign_tokens && nlpResult.sign_tokens.length > 0) {
                tokens = nlpResult.sign_tokens;
                setSignTokens(tokens);
            }
        } catch (nlpErr) {
            console.log('NLP processing skipped (using local tokens):', nlpErr.message);
        }

        // Try backend animation generation (optional enhancement)
        try {
            const animResult = await generateAnimation(tokens);
            if (animResult) {
                animation = animResult;
            }
        } catch (animErr) {
            console.log('Animation generation skipped (using default):', animErr.message);
        }

        animation.total_signs = animation.total_signs || tokens.length;
        animation.total_duration = animation.total_duration || 2000;

        // Store animation data so goToAvatar can use it without re-fetching
        setAnimationData(animation);
        setStep('done');
        // Scroll down so user sees the sign language output
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    };

    const simulateDemoTranslation = () => {
        const demoText = 'வணக்கம் எப்படி இருக்கீர்கள்';
        const tokens = mapTamilToSigns(demoText);
        setRecognizedText(demoText);
        setSignTokens(tokens);
        setStep('done');
    };

    const resetTranslation = () => {
        setStep('idle');
        setRecognizedText('');
        setInterimText('');
        setSignTokens([]);
        setTextInput('');
        setAnimationData(null);
    };

    const getStepInfo = () => {
        switch (step) {
            case 'recording':
                return { text: 'Listening...', subtitle: 'Speak in Tamil', color: '#ef4444' };
            case 'processing':
                return { text: 'Processing...', subtitle: 'Translating your speech', color: '#f59e0b' };
            case 'done':
                return { text: 'Done!', subtitle: 'Translation complete', color: '#22c55e' };
            default:
                return { text: 'Ready', subtitle: mode === 'voice' ? 'Tap the mic to begin' : 'Type Tamil text below', color: '#818cf8' };
        }
    };

    const stepInfo = getStepInfo();

    return (
        <LinearGradient colors={['#0a0a14', '#11111b', '#1e1e2e']} style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#818cf8" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Speech Translation</Text>
                {(step === 'done' || recognizedText) ? (
                    <TouchableOpacity style={styles.backButton} onPress={resetTranslation}>
                        <Ionicons name="refresh" size={22} color="#818cf8" />
                    </TouchableOpacity>
                ) : <View style={{ width: 44 }} />}
            </View>

            {/* Mode Tabs */}
            <View style={styles.modeTabs}>
                <TouchableOpacity
                    style={[styles.modeTab, mode === 'voice' && styles.modeTabActive]}
                    onPress={() => { setMode('voice'); resetTranslation(); }}
                >
                    <Ionicons name="mic" size={18} color={mode === 'voice' ? '#fff' : '#818cf8'} />
                    <Text style={[styles.modeTabText, mode === 'voice' && styles.modeTabTextActive]}>Voice (Tamil)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeTab, mode === 'text' && styles.modeTabActive]}
                    onPress={() => { setMode('text'); resetTranslation(); }}
                >
                    <Ionicons name="text" size={18} color={mode === 'text' ? '#fff' : '#818cf8'} />
                    <Text style={[styles.modeTabText, mode === 'text' && styles.modeTabTextActive]}>Text</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Status */}
                <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, { backgroundColor: stepInfo.color }]} />
                    <Text style={styles.statusText}>{stepInfo.text}</Text>
                    <Text style={styles.statusSubtitle}>{stepInfo.subtitle}</Text>
                </View>

                {/* Voice Mode - Mic Button */}
                {mode === 'voice' && (
                    <View style={styles.micSection}>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <TouchableOpacity
                                style={[styles.micButton, isRecording && styles.micButtonRecording]}
                                onPress={toggleRecording}
                                disabled={step === 'processing'}
                            >
                                <LinearGradient
                                    colors={isRecording ? ['#ef4444', '#dc2626'] : ['#6366f1', '#8b5cf6']}
                                    style={styles.micGradient}
                                >
                                    {step === 'processing' ? (
                                        <ActivityIndicator size="large" color="#fff" />
                                    ) : (
                                        <Ionicons name={isRecording ? 'stop' : 'mic'} size={40} color="#fff" />
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                        <Text style={styles.micHint}>
                            {isRecording ? 'Tap to stop' : 'Tap to start recording'}
                        </Text>
                    </View>
                )}

                {/* Live Recognition Card — shows text appearing in real time */}
                {(isRecording || recognizedText || interimText) && mode === 'voice' ? (
                    <View style={styles.liveCard}>
                        <View style={styles.liveHeader}>
                            {isRecording && <View style={styles.liveDot} />}
                            <Text style={styles.liveLabel}>
                                {isRecording ? 'LIVE RECOGNITION' : 'RECOGNIZED TEXT'}
                            </Text>
                        </View>
                        <Text style={styles.tamilText}>
                            {recognizedText}
                            {interimText ? (
                                <Text style={styles.interimText}> {interimText}</Text>
                            ) : null}
                            {!recognizedText && !interimText && isRecording ? (
                                <Text style={styles.interimText}>Listening...</Text>
                            ) : null}
                        </Text>
                    </View>
                ) : null}

                {/* Text Input Mode */}
                {mode === 'text' && step !== 'done' && (
                    <View style={styles.textInputCard}>
                        <Text style={styles.textLabel}>Enter Tamil Text</Text>
                        <TextInput
                            style={styles.tamilInput}
                            value={textInput}
                            onChangeText={setTextInput}
                            placeholder="தமிழில் உரையை உள்ளிடுக..."
                            placeholderTextColor="#6b7280"
                            multiline
                            numberOfLines={3}
                            editable={step !== 'processing'}
                        />
                        <TouchableOpacity
                            style={[styles.translateBtn, (!textInput.trim() || step === 'processing') && styles.translateBtnDisabled]}
                            onPress={handleTextTranslate}
                            disabled={!textInput.trim() || step === 'processing'}
                        >
                            {step === 'processing' ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="language" size={18} color="#fff" />
                                    <Text style={styles.translateBtnText}>Translate to Sign Language</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Show user input text after translation */}
                {mode === 'text' && step === 'done' && recognizedText ? (
                    <View style={styles.textCard}>
                        <Text style={styles.textLabel}>Your Tamil Input</Text>
                        <Text style={styles.tamilText}>{recognizedText}</Text>
                    </View>
                ) : null}

                {/* ─── SIGN LANGUAGE OUTPUT ─── */}
                {signTokens.length > 0 && (
                    <View style={styles.signOutputSection}>
                        {/* Pipeline visualization */}
                        <View style={styles.pipelineCard}>
                            <Text style={styles.pipelineTitle}>Translation Pipeline</Text>
                            <View style={styles.pipelineSteps}>
                                <View style={styles.pipelineStep}>
                                    <Ionicons name="mic" size={16} color="#818cf8" />
                                    <Text style={styles.pipelineStepText}>Voice</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={14} color="#4b5563" />
                                <View style={styles.pipelineStep}>
                                    <Ionicons name="text" size={16} color="#818cf8" />
                                    <Text style={styles.pipelineStepText}>Tamil Text</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={14} color="#4b5563" />
                                <View style={[styles.pipelineStep, styles.pipelineStepActive]}>
                                    <Ionicons name="hand-left" size={16} color="#22c55e" />
                                    <Text style={[styles.pipelineStepText, { color: '#22c55e' }]}>Signs</Text>
                                </View>
                            </View>
                        </View>

                        {/* Sign tokens with gesture descriptions */}
                        <View style={styles.tokensCard}>
                            <Text style={styles.textLabel}>Sign Language Output</Text>
                            {signTokens.map((token, index) => (
                                <View
                                    key={`${index}-${token.gloss}`}
                                    style={[
                                        styles.signCard,
                                        token.type === 'fingerspell' && styles.signCardFS,
                                    ]}
                                >
                                    <View style={styles.signCardHeader}>
                                        <Text style={styles.signEmoji}>{token.emoji}</Text>
                                        <View style={styles.signCardText}>
                                            <Text style={styles.signGloss}>{token.gloss}</Text>
                                            <Text style={styles.signOriginal}>{token.original}</Text>
                                        </View>
                                        <View style={[
                                            styles.signTypeBadge,
                                            token.type === 'fingerspell' && styles.signTypeBadgeFS,
                                        ]}>
                                            <Text style={[
                                                styles.signTypeText,
                                                token.type === 'fingerspell' && styles.signTypeTextFS,
                                            ]}>
                                                {token.type === 'fingerspell' ? 'SPELL' : 'SIGN'}
                                            </Text>
                                        </View>
                                    </View>
                                    {token.desc ? (
                                        <Text style={styles.signDesc}>
                                            <Ionicons name="hand-left-outline" size={12} color="#9ca3af" />
                                            {'  '}{token.desc}
                                        </Text>
                                    ) : null}
                                </View>
                            ))}
                        </View>

                        {/* Token summary bar */}
                        <View style={styles.tokenSummary}>
                            <View style={styles.tokensList}>
                                {signTokens.map((token, index) => (
                                    <View
                                        key={`badge-${index}`}
                                        style={[
                                            styles.tokenBadge,
                                            token.type === 'fingerspell' && styles.tokenBadgeFS,
                                        ]}
                                    >
                                        <Text style={styles.tokenText}>{token.emoji} {token.gloss}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Go to 3D Avatar button */}
                        {step === 'done' && (
                            <TouchableOpacity style={styles.avatarBtn} onPress={goToAvatar}>
                                <LinearGradient
                                    colors={['#6366f1', '#8b5cf6']}
                                    style={styles.avatarBtnGradient}
                                >
                                    <Ionicons name="body" size={20} color="#fff" />
                                    <Text style={styles.avatarBtnText}>View 3D Sign Animation</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Demo Button */}
                {signTokens.length === 0 && (
                    <TouchableOpacity style={styles.demoButton} onPress={simulateDemoTranslation}>
                        <Text style={styles.demoButtonText}>Try Demo Translation</Text>
                    </TouchableOpacity>
                )}
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
        paddingBottom: 12,
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
    modeTabs: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 12,
        backgroundColor: 'rgba(30, 30, 46, 0.8)',
        borderRadius: 14,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.12)',
    },
    modeTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 11,
    },
    modeTabActive: {
        backgroundColor: '#6366f1',
    },
    modeTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#818cf8',
    },
    modeTabTextActive: {
        color: '#fff',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    statusContainer: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginBottom: 8,
    },
    statusText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    statusSubtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 4,
    },
    liveCard: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    liveHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
    },
    liveLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#ef4444',
        letterSpacing: 1.5,
    },
    liveText: {
        fontSize: 18,
        color: '#f9a8a8',
        lineHeight: 26,
    },
    textInputCard: {
        backgroundColor: 'rgba(30, 30, 46, 0.8)',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.15)',
    },
    tamilInput: {
        fontSize: 18,
        color: '#fff',
        backgroundColor: 'rgba(17, 17, 27, 0.8)',
        borderRadius: 12,
        padding: 14,
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
        marginBottom: 12,
    },
    translateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#6366f1',
        borderRadius: 12,
        paddingVertical: 12,
    },
    translateBtnDisabled: {
        opacity: 0.5,
    },
    translateBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    textCard: {
        backgroundColor: 'rgba(30, 30, 46, 0.8)',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        marginBottom: 16,
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
        fontSize: 20,
        color: '#fff',
        lineHeight: 30,
    },
    tokensCard: {
        backgroundColor: 'rgba(30, 30, 46, 0.8)',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.15)',
    },
    tokensList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tokenBadge: {
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    tokenBadgeFS: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    tokenText: {
        fontSize: 13,
        color: '#fff',
        fontWeight: '600',
    },
    micSection: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    micButton: {
        borderRadius: 50,
        overflow: 'hidden',
    },
    micButtonRecording: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    micGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    micHint: {
        fontSize: 13,
        color: '#9ca3af',
        marginTop: 12,
    },
    demoButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        marginTop: 10,
    },
    demoButtonText: {
        color: '#818cf8',
        fontSize: 14,
        fontWeight: '600',
    },
    interimText: {
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    signOutputSection: {
        width: '100%',
    },
    pipelineCard: {
        backgroundColor: 'rgba(30, 30, 46, 0.6)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.1)',
    },
    pipelineTitle: {
        fontSize: 11,
        color: '#6b7280',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        textAlign: 'center',
    },
    pipelineSteps: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    pipelineStep: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    pipelineStepActive: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    pipelineStepText: {
        fontSize: 11,
        color: '#818cf8',
        fontWeight: '600',
    },
    signCard: {
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.15)',
    },
    signCardFS: {
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    signCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    signEmoji: {
        fontSize: 30,
    },
    signCardText: {
        flex: 1,
    },
    signGloss: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    signOriginal: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 2,
    },
    signTypeBadge: {
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    signTypeBadgeFS: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
    },
    signTypeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#818cf8',
        letterSpacing: 1,
    },
    signTypeTextFS: {
        color: '#f59e0b',
    },
    signDesc: {
        fontSize: 13,
        color: '#9ca3af',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    tokenSummary: {
        marginBottom: 16,
    },
    avatarBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 20,
    },
    avatarBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 14,
    },
    avatarBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
