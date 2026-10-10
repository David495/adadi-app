import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { displayUserName, getMobileSession, MobileSession, signIn, signOut, signUp } from '@/lib/mobile-auth';
import { router, useFocusEffect } from 'expo-router';

const C = { burgundy: '#8B1E3F', burgundyDark: '#64152E', cream: '#FAF8F6', ink: '#24171B', muted: '#76666C', border: '#EAE1E3', white: '#FFFFFF', pink: '#F4E4E9' };

export default function AccountScreen() {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [error, setError] = useState('');

  const refreshSession = useCallback(async () => {
    setLoadingSession(true);
    try { setSession(await getMobileSession()); }
    finally { setLoadingSession(false); }
  }, []);

  useFocusEffect(useCallback(() => { void refreshSession(); }, [refreshSession]));

  const submit = async () => {
    setError('');
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    if (password.length < 6) { setError('Your password must contain at least 6 characters.'); return; }
    if (mode === 'signup' && !name.trim()) { setError('Enter your name to create an account.'); return; }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const created = await signUp(name, email, password);
        if (!created) {
          Alert.alert('Check your email', 'Your account was created. Confirm your email, then return here and sign in.');
          setMode('signin');
        } else {
          setSession(created);
          Alert.alert('Account ready', 'You are signed in to ADADI.');
        }
      } else {
        setSession(await signIn(email, password));
      }
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not authenticate. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    try { await signOut(); setSession(null); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>YOUR ADADI</Text>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>Sign in to place orders and pay securely through Paystack.</Text>

        {loadingSession ? (
          <View style={styles.loadingCard}><ActivityIndicator color={C.burgundy} /><Text style={styles.body}>Checking your session…</Text></View>
        ) : session ? (
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{displayUserName(session).slice(0, 1).toUpperCase()}</Text></View>
              <View style={styles.profileCopy}>
                <Text style={styles.profileTitle}>{displayUserName(session)}</Text>
                <Text style={styles.profileBody}>{session.user.email}</Text>
                <Text style={styles.signedIn}>Signed in and ready to shop</Text>
              </View>
            </View>
            <Pressable onPress={() => router.push('/cart')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} accessibilityRole="button">
              <Text style={styles.primaryText}>Go to cart and checkout →</Text>
            </Pressable>
            <Pressable onPress={logout} disabled={busy} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, busy && styles.disabled]} accessibilityRole="button">
              {busy ? <ActivityIndicator color={C.burgundy} /> : <Text style={styles.secondaryText}>Sign out</Text>}
            </Pressable>
          </>
        ) : (
          <View style={styles.formCard}>
            <View style={styles.modeRow}>
              <Pressable onPress={() => { setMode('signin'); setError(''); }} style={[styles.modeButton, mode === 'signin' && styles.modeActive]}><Text style={[styles.modeText, mode === 'signin' && styles.modeTextActive]}>Sign in</Text></Pressable>
              <Pressable onPress={() => { setMode('signup'); setError(''); }} style={[styles.modeButton, mode === 'signup' && styles.modeActive]}><Text style={[styles.modeText, mode === 'signup' && styles.modeTextActive]}>Create account</Text></Pressable>
            </View>
            {mode === 'signup' && <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor="#93848A" autoCapitalize="words" style={styles.input} returnKeyType="next" />}
            <TextInput value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor="#93848A" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={styles.input} returnKeyType="next" />
            <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#93848A" secureTextEntry autoCapitalize="none" style={styles.input} returnKeyType="done" onSubmitEditing={() => void submit()} />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Pressable onPress={() => void submit()} disabled={busy} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, busy && styles.disabled]} accessibilityRole="button">
              {busy ? <ActivityIndicator color={C.white} /> : <Text style={styles.primaryText}>{mode === 'signin' ? 'Sign in securely' : 'Create account'}</Text>}
            </Pressable>
            <Text style={styles.privacyNote}>Your sign-in uses ADADI’s existing Supabase authentication. Payment credentials stay on the server.</Text>
          </View>
        )}

        <View style={styles.businessCard}>
          <Text style={styles.businessTitle}>Business owner?</Text>
          <Text style={styles.body}>Business management remains available on the ADADI website while we build the mobile business tools.</Text>
          <Text onPress={() => router.push('/explore')} style={styles.link}>Continue exploring →</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  content: { padding: 22, paddingTop: 18, paddingBottom: 34, gap: 15, maxWidth: 760, width: '100%', alignSelf: 'center' },
  kicker: { color: C.burgundy, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: C.ink, fontSize: 30, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 20, marginTop: -6 },
  loadingCard: { backgroundColor: C.white, borderRadius: 18, padding: 22, alignItems: 'center', gap: 10 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: C.burgundy, borderRadius: 22, padding: 18, marginTop: 5 },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.burgundy, fontSize: 26, fontWeight: '900' },
  profileCopy: { flex: 1, gap: 5 },
  profileTitle: { color: C.white, fontSize: 15, fontWeight: '900' },
  profileBody: { color: '#F0DCE2', fontSize: 11 },
  signedIn: { color: '#F4D7A3', fontSize: 10, fontWeight: '800' },
  formCard: { backgroundColor: C.white, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16, gap: 12 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 3 },
  modeButton: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: C.cream },
  modeActive: { backgroundColor: C.burgundy },
  modeText: { color: C.muted, fontSize: 11, fontWeight: '800' },
  modeTextActive: { color: C.white },
  input: { minHeight: 48, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 13, color: C.ink, backgroundColor: C.cream, fontSize: 13 },
  primaryButton: { minHeight: 48, borderRadius: 13, backgroundColor: C.burgundy, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: C.white, fontSize: 12, fontWeight: '900' },
  secondaryButton: { minHeight: 45, borderRadius: 13, borderWidth: 1, borderColor: C.border, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: C.burgundy, fontSize: 12, fontWeight: '900' },
  error: { color: '#B4233D', fontSize: 11, lineHeight: 17 },
  privacyNote: { color: C.muted, fontSize: 10, lineHeight: 16 },
  businessCard: { backgroundColor: C.pink, borderRadius: 17, padding: 15, gap: 7 },
  businessTitle: { color: C.burgundy, fontSize: 12, fontWeight: '900' },
  body: { color: C.muted, fontSize: 11, lineHeight: 17 },
  link: { color: C.burgundy, fontSize: 12, fontWeight: '900', paddingTop: 3 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.65 },
});
