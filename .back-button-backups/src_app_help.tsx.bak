import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const CHATBASE_URL = 'https://www.chatbase.co/chatbot-iframe/kXzntwa876vWoJ2xDgnhw';
const C = {
  burgundy: '#8B1E3F',
  burgundyDark: '#64152E',
  cream: '#FAF8F6',
  ink: '#24171B',
  muted: '#76666C',
  border: '#EAE1E3',
  white: '#FFFFFF',
};

export default function HelpScreen() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = () => {
    setFailed(false);
    setLoading(true);
    setReloadKey(value => value + 1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>A</Text></View>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>ADADI SUPPORT</Text>
          <Text style={styles.title}>How can we help?</Text>
          <Text style={styles.subtitle}>Ask our AI assistant about shopping and using ADADI.</Text>
        </View>
      </View>
      <View style={styles.chatFrame}>
        <WebView
          key={reloadKey}
          source={{ uri: CHATBASE_URL }}
          style={styles.webview}
          originWhitelist={['https://*']}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          startInLoadingState={false}
          onLoadStart={() => { setLoading(true); setFailed(false); }}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setFailed(true); }}
          onHttpError={event => {
            if (event.nativeEvent.statusCode >= 400) {
              setLoading(false);
              setFailed(true);
            }
          }}
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          accessibilityLabel="ADADI AI support chat"
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={C.burgundy} />
            <Text style={styles.loadingText}>Opening ADADI support…</Text>
          </View>
        )}
        {failed && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorTitle}>Chat couldn’t load</Text>
            <Text style={styles.errorBody}>Check your internet connection and try again.</Text>
            <Pressable onPress={retry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]} accessibilityRole="button">
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}
      </View>
      <Text style={styles.privacyNote}>For your safety, don’t share passwords, card details, or other sensitive information in chat.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14 },
  brandMark: { width: 43, height: 43, borderRadius: 14, backgroundColor: C.burgundy, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: C.white, fontSize: 25, fontWeight: '900' },
  headingCopy: { flex: 1, gap: 3 },
  kicker: { color: C.burgundy, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: C.ink, fontSize: 21, fontWeight: '900' },
  subtitle: { color: C.muted, fontSize: 11, lineHeight: 16 },
  chatFrame: { flex: 1, marginHorizontal: 12, marginBottom: 8, overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  webview: { flex: 1, backgroundColor: C.white },
  loadingOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.white },
  loadingText: { color: C.muted, fontSize: 12, fontWeight: '700' },
  errorOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10, backgroundColor: C.white },
  errorTitle: { color: C.ink, fontSize: 18, fontWeight: '900' },
  errorBody: { color: C.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  retryButton: { backgroundColor: C.burgundy, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12, marginTop: 4 },
  retryText: { color: C.white, fontSize: 12, fontWeight: '900' },
  privacyNote: { color: C.muted, fontSize: 9, lineHeight: 14, paddingHorizontal: 18, paddingBottom: 8, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});