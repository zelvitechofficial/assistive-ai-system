/**
 * History Screen - View past translations with sign language output and avatar.
 */
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../context/TranslationContext';

// ─── Tamil → Sign Language Mapping (same as TranslationScreen) ──────
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

export default function HistoryScreen({ navigation }) {
    const { loadHistory } = useTranslation();
    const [translations, setTranslations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const result = await loadHistory(page);
            setTranslations(result.translations || []);
        } catch (e) {
            // Demo data
            setTranslations([
                { id: 1, original_text: 'வணக்கம் எப்படி இருக்கீர்கள்', status: 'completed', confidence_score: 0.92, created_at: new Date().toISOString() },
                { id: 2, original_text: 'நான் நலமாக இருக்கிறேன்', status: 'completed', confidence_score: 0.88, created_at: new Date().toISOString() },
                { id: 3, original_text: 'நன்றி வணக்கம்', status: 'completed', confidence_score: 0.95, created_at: new Date().toISOString() },
            ]);
        } finally { setLoading(false); }
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const goToAvatar = (item) => {
        const tokens = mapTamilToSigns(item.original_text);
        navigation.navigate('Avatar', {
            animation: { timeline: [], total_duration: 2000, total_signs: tokens.length },
            speechText: item.original_text,
            signTokens: tokens,
        });
    };

    const renderItem = ({ item }) => {
        const isExpanded = expandedId === item.id;
        const signTokens = isExpanded ? mapTamilToSigns(item.original_text) : [];

        return (
            <View style={s.card}>
                {/* Card Header — tappable to expand */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleExpand(item.id)}
                >
                    <View style={s.cardHeader}>
                        <View style={[s.statusDot, { backgroundColor: item.status === 'completed' ? '#22c55e' : '#f59e0b' }]} />
                        <Text style={s.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                        <View style={{ flex: 1 }} />
                        <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color="#818cf8"
                        />
                    </View>
                    <Text style={s.cardText}>{item.original_text}</Text>
                    <View style={s.cardFooter}>
                        <Text style={s.confidence}>Confidence: {Math.round((item.confidence_score || 0) * 100)}%</Text>
                        <View style={[s.statusBadge, { backgroundColor: item.status === 'completed' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                            <Text style={[s.statusText, { color: item.status === 'completed' ? '#22c55e' : '#f59e0b' }]}>{item.status}</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* ─── EXPANDED: Sign Language Output ─── */}
                {isExpanded && (
                    <View style={s.expandedSection}>
                        {/* Pipeline visualization */}
                        <View style={s.pipelineCard}>
                            <Text style={s.pipelineTitle}>Translation Pipeline</Text>
                            <View style={s.pipelineSteps}>
                                <View style={s.pipelineStep}>
                                    <Ionicons name="mic" size={14} color="#818cf8" />
                                    <Text style={s.pipelineStepText}>Voice</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={12} color="#4b5563" />
                                <View style={s.pipelineStep}>
                                    <Ionicons name="text" size={14} color="#818cf8" />
                                    <Text style={s.pipelineStepText}>Tamil</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={12} color="#4b5563" />
                                <View style={[s.pipelineStep, s.pipelineStepActive]}>
                                    <Ionicons name="hand-left" size={14} color="#22c55e" />
                                    <Text style={[s.pipelineStepText, { color: '#22c55e' }]}>Signs</Text>
                                </View>
                            </View>
                        </View>

                        {/* Sign Tokens */}
                        <View style={s.signTokensSection}>
                            <Text style={s.signLabel}>SIGN LANGUAGE OUTPUT</Text>
                            {signTokens.map((token, index) => (
                                <View
                                    key={`${index}-${token.gloss}`}
                                    style={[
                                        s.signCard,
                                        token.type === 'fingerspell' && s.signCardFS,
                                    ]}
                                >
                                    <View style={s.signCardRow}>
                                        <Text style={s.signEmoji}>{token.emoji}</Text>
                                        <View style={s.signCardText}>
                                            <Text style={s.signGloss}>{token.gloss}</Text>
                                            <Text style={s.signOriginal}>{token.original}</Text>
                                        </View>
                                        <View style={[
                                            s.signTypeBadge,
                                            token.type === 'fingerspell' && s.signTypeBadgeFS,
                                        ]}>
                                            <Text style={[
                                                s.signTypeText,
                                                token.type === 'fingerspell' && s.signTypeTextFS,
                                            ]}>
                                                {token.type === 'fingerspell' ? 'SPELL' : 'SIGN'}
                                            </Text>
                                        </View>
                                    </View>
                                    {token.desc ? (
                                        <Text style={s.signDesc}>
                                            <Ionicons name="hand-left-outline" size={11} color="#9ca3af" />
                                            {'  '}{token.desc}
                                        </Text>
                                    ) : null}
                                </View>
                            ))}
                        </View>

                        {/* Token Summary */}
                        <View style={s.tokenSummary}>
                            {signTokens.map((token, i) => (
                                <View
                                    key={`badge-${i}`}
                                    style={[
                                        s.tokenBadge,
                                        token.type === 'fingerspell' && s.tokenBadgeFS,
                                    ]}
                                >
                                    <Text style={s.tokenText}>{token.emoji} {token.gloss}</Text>
                                </View>
                            ))}
                        </View>

                        {/* View Avatar Button */}
                        <TouchableOpacity style={s.avatarBtn} onPress={() => goToAvatar(item)}>
                            <LinearGradient
                                colors={['#6366f1', '#8b5cf6']}
                                style={s.avatarBtnGradient}
                            >
                                <Ionicons name="body" size={18} color="#fff" />
                                <Text style={s.avatarBtnText}>View 3D Sign Animation</Text>
                                <Ionicons name="arrow-forward" size={16} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <LinearGradient colors={['#0a0a14', '#11111b', '#1e1e2e']} style={s.container}>
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#818cf8" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Translation History</Text>
                <View style={{ width: 44 }} />
            </View>
            {loading ? (
                <View style={s.center}><ActivityIndicator size="large" color="#818cf8" /></View>
            ) : translations.length === 0 ? (
                <View style={s.center}>
                    <Ionicons name="document-text-outline" size={48} color="#4b5563" />
                    <Text style={s.emptyText}>No translations yet</Text>
                    <Text style={s.emptySubtext}>Record or type Tamil text to get started</Text>
                </View>
            ) : (
                <FlatList
                    data={translations}
                    renderItem={renderItem}
                    keyExtractor={(i) => i.id.toString()}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </LinearGradient>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: 'rgba(99,102,241,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#6b7280', fontSize: 16, marginTop: 12 },
    emptySubtext: { color: '#4b5563', fontSize: 13, marginTop: 4 },
    list: { paddingHorizontal: 20, paddingBottom: 30 },

    /* Card */
    card: {
        backgroundColor: 'rgba(30,30,46,0.8)',
        borderRadius: 16, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: 'rgba(99,102,241,0.12)',
    },
    cardHeader: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    cardDate: { fontSize: 12, color: '#9ca3af' },
    cardText: { fontSize: 16, color: '#fff', lineHeight: 24, marginBottom: 10 },
    cardFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    confidence: { fontSize: 12, color: '#9ca3af' },
    statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },

    /* Expanded Section */
    expandedSection: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(99,102,241,0.12)',
    },

    /* Pipeline */
    pipelineCard: {
        backgroundColor: 'rgba(17,17,27,0.6)',
        borderRadius: 12, padding: 12, marginBottom: 12,
        borderWidth: 1, borderColor: 'rgba(99,102,241,0.1)',
    },
    pipelineTitle: {
        fontSize: 11, fontWeight: '700', color: '#818cf8',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
    },
    pipelineSteps: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    pipelineStep: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(99,102,241,0.1)',
        paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8,
    },
    pipelineStepActive: {
        backgroundColor: 'rgba(34,197,94,0.15)',
        borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
    },
    pipelineStepText: { fontSize: 11, color: '#818cf8', fontWeight: '600' },

    /* Sign Tokens */
    signTokensSection: { marginBottom: 12 },
    signLabel: {
        fontSize: 11, fontWeight: '700', color: '#818cf8',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
    },
    signCard: {
        backgroundColor: 'rgba(17,17,27,0.6)',
        borderRadius: 12, padding: 12, marginBottom: 8,
        borderWidth: 1, borderColor: 'rgba(99,102,241,0.12)',
    },
    signCardFS: {
        borderColor: 'rgba(245,158,11,0.2)',
    },
    signCardRow: {
        flexDirection: 'row', alignItems: 'center',
    },
    signEmoji: { fontSize: 22, marginRight: 10 },
    signCardText: { flex: 1 },
    signGloss: { fontSize: 14, fontWeight: '700', color: '#a5b4fc' },
    signOriginal: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
    signDesc: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
    signTypeBadge: {
        backgroundColor: 'rgba(99,102,241,0.15)',
        paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6,
    },
    signTypeBadgeFS: {
        backgroundColor: 'rgba(245,158,11,0.15)',
    },
    signTypeText: { fontSize: 9, fontWeight: '800', color: '#818cf8', letterSpacing: 0.5 },
    signTypeTextFS: { color: '#f59e0b' },

    /* Token Summary */
    tokenSummary: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14,
    },
    tokenBadge: {
        backgroundColor: 'rgba(99,102,241,0.2)',
        paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8,
        borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
    },
    tokenBadgeFS: {
        backgroundColor: 'rgba(245,158,11,0.2)',
        borderColor: 'rgba(245,158,11,0.3)',
    },
    tokenText: { fontSize: 12, color: '#fff', fontWeight: '600' },

    /* Avatar Button */
    avatarBtn: { borderRadius: 14, overflow: 'hidden' },
    avatarBtnGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 14, borderRadius: 14,
    },
    avatarBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
