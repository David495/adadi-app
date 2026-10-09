import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = { burgundy: '#8B1E3F', cream: '#FAF8F6', ink: '#24171B', muted: '#76666C', border: '#EAE1E3', white: '#FFFFFF', pink: '#F4E4E9' };

export default function AccountScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.kicker}>YOUR ADADI</Text>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>Your customer account and business tools, together.</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View>
          <View style={styles.profileCopy}>
            <Text style={styles.profileTitle}>Welcome to ADADI</Text>
            <Text style={styles.profileBody}>Sign in or create an account to get started.</Text>
          </View>
        </View>
        <View style={styles.optionCard}>
          <Text style={styles.optionEmoji}>🛍️</Text>
          <View style={styles.optionCopy}><Text style={styles.optionTitle}>Customer account</Text><Text style={styles.optionBody}>Browse listings, manage orders and message businesses.</Text></View>
          <Text style={styles.optionArrow}>›</Text>
        </View>
        <View style={styles.optionCard}>
          <Text style={styles.optionEmoji}>🏪</Text>
          <View style={styles.optionCopy}><Text style={styles.optionTitle}>Business owner</Text><Text style={styles.optionBody}>Manage your business profile, products and customer orders.</Text></View>
          <Text style={styles.optionArrow}>›</Text>
        </View>
        <View style={styles.nextStep}>
          <Text style={styles.nextTitle}>Authentication is next</Text>
          <Text style={styles.nextBody}>We’ll connect sign-in to the existing ADADI Supabase project. Your account data will remain on the server; no service-role credentials will be stored in the app.</Text>
        </View>
        <Text onPress={() => router.push('/explore')} style={styles.link}>Continue exploring without signing in →</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  content: { padding: 22, paddingTop: 18, paddingBottom: 34, gap: 15, maxWidth: 760, width: '100%', alignSelf: 'center' },
  kicker: { color: C.burgundy, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: C.ink, fontSize: 30, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 20, marginTop: -6 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: C.burgundy, borderRadius: 22, padding: 18, marginTop: 5 },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.burgundy, fontSize: 26, fontWeight: '900' },
  profileCopy: { flex: 1, gap: 5 },
  profileTitle: { color: C.white, fontSize: 15, fontWeight: '900' },
  profileBody: { color: '#F0DCE2', fontSize: 11, lineHeight: 17 },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 15 },
  optionEmoji: { fontSize: 24 },
  optionCopy: { flex: 1, gap: 4 },
  optionTitle: { color: C.ink, fontSize: 13, fontWeight: '900' },
  optionBody: { color: C.muted, fontSize: 11, lineHeight: 16 },
  optionArrow: { color: C.burgundy, fontSize: 24 },
  nextStep: { backgroundColor: C.pink, borderRadius: 17, padding: 15, gap: 6, marginTop: 2 },
  nextTitle: { color: C.burgundy, fontSize: 12, fontWeight: '900' },
  nextBody: { color: C.muted, fontSize: 11, lineHeight: 17 },
  link: { color: C.burgundy, fontSize: 12, fontWeight: '900', paddingTop: 3 },
});
