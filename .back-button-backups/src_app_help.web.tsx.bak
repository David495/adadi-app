import { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

const CHATBASE_URL = 'https://www.chatbase.co/chatbot-iframe/kXzntwa876vWoJ2xDgnhw';
const C = { burgundy: '#8B1E3F', cream: '#FAF8F6', ink: '#24171B', muted: '#76666C', border: '#EAE1E3', white: '#FFFFFF' };

export default function HelpScreen() {
  const [opening, setOpening] = useState(false);
  const openChat = async () => {
    setOpening(true);
    try {
      await WebBrowser.openBrowserAsync(CHATBASE_URL, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN, toolbarColor: C.burgundy, controlsColor: C.burgundy });
    } finally {
      setOpening(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>A</Text></View>
        <Text style={styles.kicker}>ADADI SUPPORT</Text>
        <Text style={styles.title}>How can we help?</Text>
        <Text style={styles.body}>Chat with ADADI’s AI assistant for help with shopping, businesses, and using the marketplace.</Text>
        <Pressable onPress={openChat} disabled={opening} style={({ pressed }) => [styles.button, (pressed || opening) && styles.pressed]} accessibilityRole="button">
          {opening ? <ActivityIndicator color={C.white} /> : <Text style={styles.buttonText}>Open ADADI chat</Text>}
        </Pressable>
        <Text style={styles.note}>For your safety, don’t share passwords, card details, or other sensitive information in chat.</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 14 },
  brandMark: { width: 56, height: 56, borderRadius: 18, backgroundColor: C.burgundy, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: C.white, fontSize: 31, fontWeight: '900' },
  kicker: { color: C.burgundy, fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  title: { color: C.ink, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  body: { color: C.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 340 },
  button: { minHeight: 48, minWidth: 190, alignItems: 'center', justifyContent: 'center', backgroundColor: C.burgundy, borderRadius: 13, paddingHorizontal: 22, marginTop: 8 },
  buttonText: { color: C.white, fontSize: 13, fontWeight: '900' },
  note: { color: C.muted, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 8 },
  pressed: { opacity: 0.75 },
});