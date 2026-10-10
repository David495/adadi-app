import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { clearCart, getCart, CartItem, updateCartQuantity } from '@/lib/cart';
import { displayUserName, getMobileSession, MobileSession } from '@/lib/mobile-auth';

const API_BASE = 'https://adadi247.com';
const C = { burgundy: '#8B1E3F', burgundyDark: '#64152E', cream: '#FAF8F6', ink: '#24171B', muted: '#76666C', border: '#EAE1E3', white: '#FFFFFF', pink: '#F4E4E9', gold: '#D4A017' };
const money = (value: number) => '₦' + Math.round(value).toLocaleString('en-NG');

export default function CartScreen() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [session, setSession] = useState<MobileSession | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cartItems, currentSession] = await Promise.all([getCart(), getMobileSession()]);
      setItems(cartItems);
      setSession(currentSession);
      if (currentSession) {
        setName(current => current || displayUserName(currentSession));
        setEmail(current => current || currentSession.user.email || '');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const changeQuantity = async (productId: string, quantity: number) => {
    const next = await updateCartQuantity(productId, quantity);
    setItems(next);
  };

  const verifyPayment = async (paymentReference: string) => {
    if (!session) {
      router.push('/account');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch(API_BASE + '/api/paystack/order/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
        body: JSON.stringify({ reference: paymentReference }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success && result.paymentStatus === 'paid') {
        await clearCart();
        setItems([]);
        setReference('');
        Alert.alert('Payment successful', 'Order ' + (result.orderNumber || orderNumber || '') + ' is confirmed. You can track the order from your ADADI account.');
      } else if (response.status === 409) {
        setError('Paystack has not confirmed this payment yet. If you just paid, wait a moment and tap Verify payment again.');
      } else if (response.status === 401) {
        setError('Your session has expired. Sign in again, then verify your payment.');
      } else {
        setError(typeof result.error === 'string' ? result.error : 'We could not confirm this payment yet.');
      }
    } catch {
      setError('Could not contact ADADI to verify payment. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const startPayment = async () => {
    setError('');
    if (!session) {
      Alert.alert('Sign in required', 'Sign in to your ADADI account before checking out.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/account') },
      ]);
      return;
    }
    if (!items.length) { setError('Your cart is empty. Add products before checking out.'); return; }
    if (!name.trim() || !email.trim() || !phone.trim()) { setError('Enter your name, email and phone number.'); return; }
    if (deliveryMethod === 'delivery' && !address.trim()) { setError('Enter the delivery address.'); return; }

    setBusy(true);
    try {
      const response = await fetch(API_BASE + '/api/paystack/order/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
        body: JSON.stringify({
          businessId: items[0].businessId,
          items: items.map(item => ({ productId: item.productId, quantity: item.quantity })),
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          deliveryMethod,
          deliveryAddress: deliveryMethod === 'delivery' ? address.trim() : '',
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || !result.authorizationUrl || !result.reference) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Could not initialize Paystack checkout.');
      }
      setReference(result.reference);
      setOrderNumber(result.orderNumber || '');
      setOrderTotal(Number(result.breakdown?.total) || null);
      await WebBrowser.openBrowserAsync(result.authorizationUrl, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN });
      await verifyPayment(result.reference);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start payment. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹ Back to shopping</Text></Pressable>
        <Text style={styles.kicker}>YOUR ADADI ORDER</Text>
        <Text style={styles.title}>Cart & checkout</Text>
        <Text style={styles.subtitle}>Secure Paystack checkout. Your final amount and business split are calculated by ADADI’s server.</Text>

        {loading ? <View style={styles.stateCard}><ActivityIndicator color={C.burgundy} /><Text style={styles.body}>Loading your cart…</Text></View> : items.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.emptyEmoji}>🛍️</Text>
            <Text style={styles.stateTitle}>Your cart is empty</Text>
            <Text style={styles.body}>Browse products and add items from one business to begin an order.</Text>
            <Pressable onPress={() => router.push('/products')} style={styles.primaryButton}><Text style={styles.primaryText}>Browse products</Text></Pressable>
          </View>
        ) : (
          <>
            <View style={styles.itemsCard}>
              <Text style={styles.sectionTitle}>{items[0].businessName}</Text>
              {items.map(item => (
                <View key={item.productId} style={styles.itemRow}>
                  {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" /> : <View style={styles.itemFallback}><Text>🛍️</Text></View>}
                  <View style={styles.itemCopy}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>{money(item.price)} each</Text>
                    <View style={styles.quantityRow}>
                      <Pressable onPress={() => void changeQuantity(item.productId, item.quantity - 1)} style={styles.quantityButton}><Text style={styles.quantityText}>−</Text></Pressable>
                      <Text style={styles.quantityValue}>{item.quantity}</Text>
                      <Pressable onPress={() => void changeQuantity(item.productId, item.quantity + 1)} style={styles.quantityButton}><Text style={styles.quantityText}>+</Text></Pressable>
                      <Text style={styles.lineTotal}>{money(item.price * item.quantity)}</Text>
                    </View>
                  </View>
                </View>
              ))}
              <View style={styles.subtotalRow}><Text style={styles.body}>Product subtotal</Text><Text style={styles.subtotal}>{money(subtotal)}</Text></View>
              <Text style={styles.feeNote}>The server will calculate the applicable ADADI service fee and delivery fee before payment. Prices are rechecked against the live product records.</Text>
              <Pressable onPress={async () => { await clearCart(); setItems([]); }} style={styles.clearButton}><Text style={styles.clearText}>Clear cart</Text></Pressable>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Customer details</Text>
              {!session && <View style={styles.signInNotice}><Text style={styles.body}>You need an ADADI account to pay.</Text><Pressable onPress={() => router.push('/account')}><Text style={styles.link}>Sign in / create account →</Text></Pressable></View>}
              <Text style={styles.label}>Full name</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#93848A" style={styles.input} />
              <Text style={styles.label}>Email</Text>
              <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#93848A" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
              <Text style={styles.label}>Phone number</Text>
              <TextInput value={phone} onChangeText={setPhone} placeholder="080..." placeholderTextColor="#93848A" keyboardType="phone-pad" style={styles.input} />
              <Text style={styles.label}>How do you want to receive the order?</Text>
              <View style={styles.deliveryRow}>
                <Pressable onPress={() => setDeliveryMethod('pickup')} style={[styles.deliveryChoice, deliveryMethod === 'pickup' && styles.deliverySelected]}><Text style={[styles.deliveryText, deliveryMethod === 'pickup' && styles.deliveryTextSelected]}>Pick up</Text></Pressable>
                <Pressable onPress={() => setDeliveryMethod('delivery')} style={[styles.deliveryChoice, deliveryMethod === 'delivery' && styles.deliverySelected]}><Text style={[styles.deliveryText, deliveryMethod === 'delivery' && styles.deliveryTextSelected]}>Delivery</Text></Pressable>
              </View>
              {deliveryMethod === 'delivery' && <><Text style={styles.label}>Delivery address</Text><TextInput value={address} onChangeText={setAddress} placeholder="Hostel / room / location" placeholderTextColor="#93848A" style={styles.input} /></>}
              {!!error && <Text style={styles.error}>{error}</Text>}
              {orderTotal !== null && <View style={styles.finalTotalRow}><Text style={styles.body}>Last calculated total</Text><Text style={styles.subtotal}>{money(orderTotal)}</Text></View>}
              <Pressable onPress={() => void startPayment()} disabled={busy} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, busy && styles.disabled]}>
                {busy ? <ActivityIndicator color={C.white} /> : <Text style={styles.primaryText}>Pay securely with Paystack →</Text>}
              </Pressable>
              {!!reference && <Pressable onPress={() => void verifyPayment(reference)} disabled={busy} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, busy && styles.disabled]}>{busy ? <ActivityIndicator color={C.burgundy} /> : <Text style={styles.secondaryText}>Verify payment</Text>}</Pressable>}
              <Text style={styles.secureNote}>ADADI never marks an order paid based only on the app. Paystack is verified by the server before your order is confirmed.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  content: { padding: 20, paddingTop: 12, paddingBottom: 38, gap: 15, maxWidth: 760, width: '100%', alignSelf: 'center' },
  back: { alignSelf: 'flex-start', paddingVertical: 4, paddingRight: 10 },
  backText: { color: C.burgundy, fontSize: 12, fontWeight: '900' },
  kicker: { color: C.burgundy, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: C.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { color: C.muted, fontSize: 12, lineHeight: 19 },
  itemsCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 15, gap: 13 },
  sectionTitle: { color: C.ink, fontSize: 14, fontWeight: '900' },
  itemRow: { flexDirection: 'row', gap: 11, paddingVertical: 5 },
  itemImage: { width: 70, height: 70, borderRadius: 13, backgroundColor: C.pink },
  itemFallback: { width: 70, height: 70, borderRadius: 13, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center' },
  itemCopy: { flex: 1, minWidth: 0, gap: 4 },
  itemName: { color: C.ink, fontSize: 12, fontWeight: '800' },
  itemPrice: { color: C.muted, fontSize: 10 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 3 },
  quantityButton: { width: 27, height: 27, borderRadius: 9, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center' },
  quantityText: { color: C.burgundy, fontSize: 17, fontWeight: '900' },
  quantityValue: { color: C.ink, fontSize: 11, fontWeight: '900', minWidth: 12, textAlign: 'center' },
  lineTotal: { color: C.burgundy, fontSize: 11, fontWeight: '900', marginLeft: 'auto' },
  subtotalRow: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subtotal: { color: C.burgundy, fontSize: 16, fontWeight: '900' },
  feeNote: { color: C.muted, fontSize: 10, lineHeight: 16 },
  clearButton: { alignSelf: 'flex-start', paddingVertical: 5 },
  clearText: { color: C.burgundy, fontSize: 10, fontWeight: '900' },
  formCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 15, gap: 10 },
  signInNotice: { backgroundColor: C.pink, borderRadius: 12, padding: 11, gap: 5 },
  label: { color: C.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.5, marginTop: 2 },
  input: { minHeight: 47, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, backgroundColor: C.cream, color: C.ink, fontSize: 12 },
  deliveryRow: { flexDirection: 'row', gap: 9 },
  deliveryChoice: { flex: 1, borderWidth: 1, borderColor: C.border, backgroundColor: C.cream, borderRadius: 12, padding: 12, alignItems: 'center' },
  deliverySelected: { backgroundColor: C.burgundy, borderColor: C.burgundy },
  deliveryText: { color: C.muted, fontSize: 11, fontWeight: '800' },
  deliveryTextSelected: { color: C.white },
  primaryButton: { minHeight: 48, borderRadius: 13, backgroundColor: C.burgundy, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: C.white, fontSize: 12, fontWeight: '900' },
  secondaryButton: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: C.border, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: C.burgundy, fontSize: 12, fontWeight: '900' },
  finalTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  secureNote: { color: C.muted, fontSize: 10, lineHeight: 16, textAlign: 'center' },
  error: { color: '#B4233D', fontSize: 11, lineHeight: 17 },
  link: { color: C.burgundy, fontSize: 11, fontWeight: '900' },
  stateCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 20, alignItems: 'center', gap: 10, minHeight: 150, justifyContent: 'center' },
  emptyEmoji: { fontSize: 28 },
  stateTitle: { color: C.ink, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  body: { color: C.muted, fontSize: 11, lineHeight: 17 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.65 },
});
