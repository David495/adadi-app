import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = { burgundy: '#8B1E3F', cream: '#FAF8F6', ink: '#24171B', muted: '#76666C', border: '#EAE1E3', white: '#FFFFFF', pink: '#F4E4E9' };

export default function MessagesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.kicker}>STAY IN TOUCH</Text>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Keep your conversations with campus businesses in one place.</Text>
        <View style={styles.card}>
          <View style={styles.icon}><Text style={styles.iconText}>✉</Text></View>
          <Text style={styles.cardTitle}>Your conversations will show up here</Text>
          <Text style={styles.cardBody}>Sign in to access your messages and continue conversations with businesses.</Text>
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>A quick privacy note</Text>
            <Text style={styles.noticeBody}>ADADI messages are not end-to-end encrypted. Avoid sending passwords, bank details or other sensitive information.</Text>
          </View>
          <Text onPress={() => router.push('/account')} style={styles.link}>Go to account →</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  content: { padding: 22, gap: 13, maxWidth: 760, width: '100%', alignSelf: 'center' },
  kicker: { color: C.burgundy, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 12 },
  title: { color: C.ink, fontSize: 30, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 20 },
  card: { marginTop: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 24, padding: 20, gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: C.burgundy, fontSize: 24, fontWeight: '900' },
  cardTitle: { color: C.ink, fontSize: 18, fontWeight: '900', lineHeight: 24 },
  cardBody: { color: C.muted, fontSize: 12, lineHeight: 19 },
  notice: { marginTop: 4, backgroundColor: '#FFF6E0', borderRadius: 15, padding: 14, gap: 5 },
  noticeTitle: { color: '#795B12', fontSize: 12, fontWeight: '900' },
  noticeBody: { color: '#795B12', fontSize: 11, lineHeight: 17 },
  link: { color: C.burgundy, fontSize: 12, fontWeight: '900', paddingTop: 4 },
});
