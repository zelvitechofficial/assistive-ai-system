/**
 * Profile Screen - Edit name, photo, toggle dark/light theme.
 */
import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform,
    TextInput, Alert, Switch, Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
    const { user, updateProfile, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [lastName, setLastName] = useState(user?.last_name || '');
    const [speed, setSpeed] = useState(user?.preferences?.playback_speed || 1.0);
    const [notifs, setNotifs] = useState(user?.preferences?.notifications_enabled ?? true);
    const [theme, setTheme] = useState(user?.preferences?.theme || 'dark');
    const [photoUri, setPhotoUri] = useState(user?.photo_url || null);
    const [pickingPhoto, setPickingPhoto] = useState(false);

    const isDark = theme === 'dark';
    const colors = isDark
        ? { bg: ['#0a0a14', '#11111b', '#1e1e2e'], card: 'rgba(30,30,46,0.8)', text: '#fff', sub: '#9ca3af', border: 'rgba(99,102,241,0.15)', accent: '#818cf8' }
        : { bg: ['#f8fafc', '#f1f5f9', '#e2e8f0'], card: 'rgba(255,255,255,0.95)', text: '#1e293b', sub: '#64748b', border: 'rgba(99,102,241,0.2)', accent: '#6366f1' };

    const pickPhoto = useCallback(async () => {
        try {
            const ImagePicker = await import('expo-image-picker');
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Photo library access is needed to change your profile picture.');
                return;
            }
            setPickingPhoto(true);
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });
            if (!result.canceled && result.assets?.length > 0) {
                setPhotoUri(result.assets[0].uri);
            }
        } catch (e) {
            console.log('Image picker not available:', e.message);
            Alert.alert('Info', 'Install expo-image-picker to change photo.\nRun: npx expo install expo-image-picker');
        } finally {
            setPickingPhoto(false);
        }
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile({
                first_name: firstName,
                last_name: lastName,
                preferences: {
                    playback_speed: speed,
                    notifications_enabled: notifs,
                    theme: theme,
                },
            });
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated.');
        } catch (e) {
            Alert.alert('Error', e.message || 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFirstName(user?.first_name || '');
        setLastName(user?.last_name || '');
        setSpeed(user?.preferences?.playback_speed || 1.0);
        setNotifs(user?.preferences?.notifications_enabled ?? true);
        setTheme(user?.preferences?.theme || 'dark');
        setPhotoUri(user?.photo_url || null);
        setIsEditing(false);
    };

    const toggleTheme = () => {
        if (isEditing) setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const initials = (user?.first_name || user?.username || 'U')[0].toUpperCase();

    return (
        <LinearGradient colors={colors.bg} style={st.c}>
            {/* Header */}
            <View style={st.h}>
                <TouchableOpacity style={[st.bb, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)' }]} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.accent} />
                </TouchableOpacity>
                <Text style={[st.ht, { color: colors.text }]}>My Profile</Text>
                {isEditing ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={[st.eb, { backgroundColor: 'rgba(239,68,68,0.15)' }]} onPress={handleCancel}>
                            <Ionicons name="close" size={18} color="#ef4444" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[st.eb, { backgroundColor: 'rgba(34,197,94,0.15)' }]} onPress={handleSave} disabled={saving}>
                            {saving ? <ActivityIndicator size="small" color="#22c55e" /> : <Ionicons name="checkmark" size={18} color="#22c55e" />}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={[st.eb, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)' }]} onPress={() => setIsEditing(true)}>
                        <Text style={[st.et, { color: colors.accent }]}>Edit</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView contentContainerStyle={st.sc}>
                {/* Profile Card */}
                <View style={[st.pc, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity onPress={isEditing ? pickPhoto : undefined} disabled={!isEditing || pickingPhoto} activeOpacity={isEditing ? 0.7 : 1}>
                        <View style={st.photoContainer}>
                            {photoUri ? (
                                <Image source={{ uri: photoUri }} style={st.photoImg} />
                            ) : (
                                <View style={st.ac}><Text style={st.ai}>{initials}</Text></View>
                            )}
                            {isEditing && (
                                <View style={st.cameraOverlay}>
                                    <Ionicons name="camera" size={20} color="#fff" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                    {isEditing ? (
                        <View style={{ alignItems: 'center', marginTop: 12 }}>
                            <TextInput
                                style={[st.nameInput, { color: colors.text, borderColor: colors.border }]}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="First Name"
                                placeholderTextColor={colors.sub}
                                textAlign="center"
                            />
                            <TextInput
                                style={[st.nameInput, { color: colors.text, borderColor: colors.border }]}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Last Name"
                                placeholderTextColor={colors.sub}
                                textAlign="center"
                            />
                        </View>
                    ) : (
                        <>
                            <Text style={[st.pn, { color: colors.text }]}>
                                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
                            </Text>
                            <Text style={[st.pe, { color: colors.sub }]}>{user?.email}</Text>
                        </>
                    )}
                </View>

                {/* Personal Info */}
                <View style={[st.sec, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[st.stt, { color: colors.accent }]}>Personal Info</Text>
                    <View style={[st.fr, { borderBottomColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.12)' }]}>
                        <Text style={[st.fl, { color: colors.sub }]}>Username</Text>
                        <Text style={[st.fv, { color: colors.text }]}>{user?.username}</Text>
                    </View>
                    <View style={[st.fr, { borderBottomColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.12)' }]}>
                        <Text style={[st.fl, { color: colors.sub }]}>Email</Text>
                        <Text style={[st.fv, { color: colors.text }]}>{user?.email}</Text>
                    </View>
                    <View style={[st.fr, { borderBottomColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.12)' }]}>
                        <Text style={[st.fl, { color: colors.sub }]}>First Name</Text>
                        {isEditing ? (
                            <TextInput style={[st.fi, { color: colors.text, borderColor: colors.border }]} value={firstName} onChangeText={setFirstName} placeholderTextColor={colors.sub} />
                        ) : (
                            <Text style={[st.fv, { color: colors.text }]}>{user?.first_name || '—'}</Text>
                        )}
                    </View>
                    <View style={[st.fr, { borderBottomWidth: 0 }]}>
                        <Text style={[st.fl, { color: colors.sub }]}>Last Name</Text>
                        {isEditing ? (
                            <TextInput style={[st.fi, { color: colors.text, borderColor: colors.border }]} value={lastName} onChangeText={setLastName} placeholderTextColor={colors.sub} />
                        ) : (
                            <Text style={[st.fv, { color: colors.text }]}>{user?.last_name || '—'}</Text>
                        )}
                    </View>
                </View>

                {/* Preferences */}
                <View style={[st.sec, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[st.stt, { color: colors.accent }]}>Preferences</Text>

                    {/* Theme Toggle */}
                    <View style={[st.fr, { borderBottomColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.12)' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? '#fbbf24' : '#f59e0b'} />
                            <Text style={[st.fl, { color: colors.sub }]}>Theme</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Text style={{ fontSize: 12, color: colors.sub }}>{isDark ? 'Dark' : 'Light'}</Text>
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                disabled={!isEditing}
                                trackColor={{ false: '#e2e8f0', true: '#4f46e5' }}
                                thumbColor={isDark ? '#818cf8' : '#f8fafc'}
                            />
                        </View>
                    </View>

                    <View style={[st.fr, { borderBottomColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.12)' }]}>
                        <Text style={[st.fl, { color: colors.sub }]}>Speed</Text>
                        <Text style={[st.fv, { color: colors.text }]}>{speed}x</Text>
                    </View>
                    <View style={[st.fr, { borderBottomWidth: 0 }]}>
                        <Text style={[st.fl, { color: colors.sub }]}>Notifications</Text>
                        <Switch value={notifs} onValueChange={isEditing ? setNotifs : undefined} disabled={!isEditing} trackColor={{ false: '#374151', true: '#6366f1' }} />
                    </View>
                </View>

                {/* Logout */}
                <TouchableOpacity style={st.lb} onPress={() => Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Logout', style: 'destructive', onPress: logout }])}>
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" /><Text style={st.lt}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </LinearGradient>
    );
}

const st = StyleSheet.create({
    c: { flex: 1 },
    h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16 },
    bb: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    ht: { fontSize: 18, fontWeight: '700' },
    eb: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
    et: { fontWeight: '600', fontSize: 14 },
    sc: { paddingHorizontal: 20, paddingBottom: 40 },
    pc: { alignItems: 'center', borderRadius: 24, padding: 28, marginBottom: 20, borderWidth: 1 },
    photoContainer: { position: 'relative', marginBottom: 4 },
    photoImg: { width: 90, height: 90, borderRadius: 45 },
    ac: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' },
    ai: { fontSize: 34, fontWeight: '800', color: '#fff' },
    cameraOverlay: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#1e1e2e' },
    nameInput: { fontSize: 18, fontWeight: '700', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, marginBottom: 6, minWidth: 180 },
    pn: { fontSize: 22, fontWeight: '700', marginTop: 12 },
    pe: { fontSize: 14, marginTop: 4 },
    sec: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1 },
    stt: { fontSize: 14, fontWeight: '700', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
    fr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    fl: { fontSize: 14 },
    fv: { fontSize: 14, fontWeight: '500' },
    fi: { fontSize: 14, backgroundColor: 'rgba(17,17,27,0.5)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, minWidth: 150, textAlign: 'right', borderWidth: 1 },
    lb: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
    lt: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
