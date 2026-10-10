import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { getMobileSession, MobileSession } from '@/lib/mobile-auth';

const C = { burgundy: '#8B1E3F', dark: '#64152E', cream: '#FAF8F6', ink: '#24171B', muted: '#76666C', border: '#EAE1E3', white: '#FFFFFF', pink: '#F4E4E9', gold: '#D4A017', green: '#26734D', red: '#B4233D' };
const SITE = 'https://adadi247.com';
const STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'] as const;
type OrderStatus = typeof STATUSES[number];

type Business = {
  id: string; owner_id: string; name: string; slug: string; description: string | null;
  category: string; phone: string | null; address: string | null; status: string;
  is_open: boolean | null; logo_url: string | null; cover_image_url: string | null;
};
type Product = {
  id: string; business_id: string; name: string; slug: string; description: string | null;
  price: number; image_url: string | null; is_available: boolean | null; created_at: string;
};
type OrderItem = { product_name: string; quantity: number; unit_price: number; subtotal: number };
type Order = {
  id: string; order_number: string; total_amount: number; total: number | null; subtotal: number | null;
  delivery_fee: number | null; status: string; order_status: string | null; payment_status: string | null;
  customer_name: string | null; customer_email: string | null; customer_phone: string | null;
  delivery_address: string | null; delivery_method: string | null; created_at: string; order_items?: OrderItem[];
};
type Tab = 'overview' | 'products' | 'orders' | 'profile';

const money = (value: number) => '₦' + Math.round(Number(value) || 0).toLocaleString('en-NG');
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'product';

function getConfig() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('ADADI data is not configured. Add the Supabase URL and publishable key to the app environment.');
  return { url, key };
}

async function apiRequest<T>(session: MobileSession, table: string, options: {
  method?: string; query?: string; body?: unknown;
} = {}): Promise<T> {
  const { url, key } = getConfig();
  const response = await fetch(url + '/rest/v1/' + table + (options.query ? '?' + options.query : ''), {
    method: options.method ?? 'GET',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + session.access_token,
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options.method === 'POST' || options.method === 'PATCH' ? { Prefer: 'return=representation' } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = typeof payload?.message === 'string' ? payload.message : typeof payload?.hint === 'string' ? payload.hint : typeof payload?.details === 'string' ? payload.details : '';
    if (response.status === 401) throw new Error('Your session expired. Sign in again to manage your business.');
    if (response.status === 403 || response.status === 401) throw new Error('Supabase denied this action. Your account may not have business-owner permissions, or the table policy needs checking.');
    throw new Error(detail || 'ADADI could not complete that request (HTTP ' + response.status + ').');
  }
  return payload as T;
}

const query = (values: Record<string, string>) => new URLSearchParams(values).toString();

export default function BusinessScreen() {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productImage, setProductImage] = useState('');
  const [profileModal, setProfileModal] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const current = await getMobileSession();
      setSession(current);
      if (!current) {
        setBusiness(null); setProducts([]); setOrders([]);
        return;
      }
      const businesses = await apiRequest<Business[]>(current, 'businesses', {
        query: query({ select: 'id,owner_id,name,slug,description,category,phone,address,status,is_open,logo_url,cover_image_url', owner_id: 'eq.' + current.user.id, order: 'created_at.desc', limit: '2' }),
      });
      const owned = businesses[0] ?? null;
      setBusiness(owned);
      if (!owned) { setProducts([]); setOrders([]); return; }
      setBusinessName(owned.name ?? '');
      setCategory(owned.category ?? '');
      setDescription(owned.description ?? '');
      setPhone(owned.phone ?? '');
      setAddress(owned.address ?? '');
      const [productRows, orderRows] = await Promise.all([
        apiRequest<Product[]>(current, 'products', {
          query: query({ select: 'id,business_id,name,slug,description,price,image_url,is_available,created_at', business_id: 'eq.' + owned.id, order: 'created_at.desc', limit: '60' }),
        }),
        apiRequest<Order[]>(current, 'orders', {
          query: query({ select: 'id,order_number,total_amount,total,subtotal,delivery_fee,status,order_status,payment_status,customer_name,customer_email,customer_phone,delivery_address,delivery_method,created_at,order_items(product_name,quantity,unit_price,subtotal)', business_id: 'eq.' + owned.id, order: 'created_at.desc', limit: '30' }),
        }),
      ]);
      setProducts(productRows);
      setOrders(orderRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your business workspace.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const activeProducts = useMemo(() => products.filter(item => item.is_available !== false).length, [products]);
  const pendingOrders = useMemo(() => orders.filter(order => !['completed', 'cancelled'].includes(order.order_status || order.status)).length, [orders]);
  const sales = useMemo(() => orders.filter(order => ['success', 'paid'].includes((order.payment_status || '').toLowerCase())).reduce((sum, order) => sum + Number(order.total ?? order.total_amount ?? 0), 0), [orders]);

  const openNewProduct = () => {
    setEditingProduct(null); setProductName(''); setProductPrice(''); setProductDescription(''); setProductImage('');
    setProductModal(true);
  };
  const openEditProduct = (item: Product) => {
    setEditingProduct(item); setProductName(item.name); setProductPrice(String(item.price));
    setProductDescription(item.description ?? ''); setProductImage(item.image_url ?? ''); setProductModal(true);
  };

  const saveProduct = async () => {
    if (!session || !business) return;
    const price = Number(productPrice.replace(/,/g, '').trim());
    if (!productName.trim()) { Alert.alert('Product name required', 'Enter a name for this product.'); return; }
    if (!productPrice.trim() || !Number.isFinite(price) || price < 0) { Alert.alert('Check the price', 'Enter a valid price in naira.'); return; }
    if (productImage.trim() && !/^https?:\/\/\S+$/i.test(productImage.trim())) { Alert.alert('Check image URL', 'Use a complete https:// or http:// image URL.'); return; }
    setBusy(true);
    try {
      const body = {
        name: productName.trim(),
        slug: editingProduct?.slug || (slugify(productName) + '-' + Date.now().toString(36)),
        description: productDescription.trim() || null,
        price,
        image_url: productImage.trim() || null,
        is_available: editingProduct?.is_available ?? true,
      };
      if (editingProduct) {
        await apiRequest<Product[]>(session, 'products', { method: 'PATCH', query: query({ id: 'eq.' + editingProduct.id, business_id: 'eq.' + business.id, select: 'id' }), body });
      } else {
        await apiRequest<Product[]>(session, 'products', { method: 'POST', query: query({ select: 'id' }), body: { ...body, business_id: business.id } });
      }
      setProductModal(false);
      await load(false);
      Alert.alert('Product saved', 'Your product details have been updated.');
    } catch (err) {
      Alert.alert('Could not save product', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(false); }
  };

  const toggleProduct = async (item: Product) => {
    if (!session || !business) return;
    setBusy(true);
    try {
      await apiRequest<Product[]>(session, 'products', { method: 'PATCH', query: query({ id: 'eq.' + item.id, business_id: 'eq.' + business.id, select: 'id' }), body: { is_available: item.is_available === false } });
      await load(false);
    } catch (err) { Alert.alert('Could not update availability', err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusy(false); }
  };

  const deleteProduct = (item: Product) => {
    if (!session || !business) return;
    Alert.alert('Delete product?', 'This removes ' + item.name + ' from your shop. Orders already placed should remain unchanged.', [
      { text: 'Keep product', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setBusy(true);
        try {
          await apiRequest<unknown>(session, 'products', { method: 'DELETE', query: query({ id: 'eq.' + item.id, business_id: 'eq.' + business.id }) });
          await load(false);
        } catch (err) { Alert.alert('Could not delete product', err instanceof Error ? err.message : 'Please try again.'); }
        finally { setBusy(false); }
      } },
    ]);
  };

  const saveProfile = async () => {
    if (!session || !business) return;
    if (!businessName.trim() || !category.trim()) { Alert.alert('Required fields', 'Business name and category are required.'); return; }
    setBusy(true);
    try {
      await apiRequest<Business[]>(session, 'businesses', {
        method: 'PATCH',
        query: query({ id: 'eq.' + business.id, owner_id: 'eq.' + session.user.id, select: 'id' }),
        body: { name: businessName.trim(), category: category.trim(), description: description.trim() || null, phone: phone.trim() || null, address: address.trim() || null },
      });
      setProfileModal(false);
      await load(false);
      Alert.alert('Business profile saved', 'Your public business details have been updated.');
    } catch (err) { Alert.alert('Could not save profile', err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusy(false); }
  };

  const toggleOpen = async () => {
    if (!session || !business) return;
    setBusy(true);
    try {
      await apiRequest<Business[]>(session, 'businesses', { method: 'PATCH', query: query({ id: 'eq.' + business.id, owner_id: 'eq.' + session.user.id, select: 'id' }), body: { is_open: business.is_open === false } });
      await load(false);
    } catch (err) { Alert.alert('Could not change shop status', err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusy(false); }
  };

  const updateOrderStatus = async (order: Order, next: OrderStatus) => {
    if (!session || !business) return;
    if (next === 'confirmed' || next === 'preparing' || next === 'ready' || next === 'completed') {
      if (!['success', 'paid'].includes((order.payment_status || '').toLowerCase())) {
        Alert.alert('Payment not confirmed', 'This order is not marked as paid. Confirm payment in ADADI before preparing or completing it.');
        return;
      }
    }
    setBusy(true);
    try {
      await apiRequest<Order[]>(session, 'orders', {
        method: 'PATCH',
        query: query({ id: 'eq.' + order.id, business_id: 'eq.' + business.id, select: 'id' }),
        body: { status: next, order_status: next },
      });
      await load(false);
    } catch (err) { Alert.alert('Could not update order', err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusy(false); }
  };

  const launchWebsite = async (path = '/business/dashboard') => {
    try { await Linking.openURL(SITE + path); }
    catch { Alert.alert('Could not open ADADI', 'Visit ' + SITE + path + ' in your browser.'); }
  };

  if (loading) return <SafeAreaView style={styles.safe} edges={['top']}><View style={styles.center}><ActivityIndicator size="large" color={C.burgundy} /><Text style={styles.muted}>Loading your business workspace…</Text></View></SafeAreaView>;

  if (!session) return (
    <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.gate}>
      <Text style={styles.eyebrow}>ADADI FOR SELLERS</Text><Text style={styles.heroTitle}>Run your shop from your phone.</Text>
      <Text style={styles.body}>Sign in with the same ADADI account linked to your business to manage products and incoming orders.</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable onPress={() => router.push('/account')} style={styles.primary}><Text style={styles.primaryText}>Sign in to ADADI →</Text></Pressable>
      <Pressable onPress={() => void launchWebsite('/login')} style={styles.secondary}><Text style={styles.secondaryText}>Open ADADI website</Text></Pressable>
    </ScrollView></SafeAreaView>
  );

  if (!business) return (
    <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.gate} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(false); }} tintColor={C.burgundy} />}>
      <Text style={styles.eyebrow}>SELL ON ADADI</Text><Text style={styles.heroTitle}>Your business starts here.</Text>
      <Text style={styles.body}>You’re signed in, but this account doesn’t have a business linked to it yet. Register your business on ADADI’s website, then return here with the same account.</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable onPress={() => void launchWebsite('/business/register')} style={styles.primary}><Text style={styles.primaryText}>Register a business →</Text></Pressable>
      <Pressable onPress={() => void load()} style={styles.secondary}><Text style={styles.secondaryText}>I already registered — refresh</Text></Pressable>
    </ScrollView></SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(false); }} tintColor={C.burgundy} />} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}><View style={{ flex: 1 }}><Text style={styles.eyebrow}>SELLER WORKSPACE</Text><Text style={styles.title}>{business.name}</Text><Text style={styles.muted}>{business.category || 'Campus business'} · {business.status.replace('_', ' ')}</Text></View><View style={[styles.statusPill, business.is_open === false && styles.closedPill]}><Text style={[styles.statusText, business.is_open === false && styles.closedText]}>{business.is_open === false ? 'CLOSED' : 'OPEN'}</Text></View></View>
        {business.status !== 'approved' && <View style={styles.notice}><Text style={styles.noticeTitle}>Business approval: {business.status.replace('_', ' ')}</Text><Text style={styles.body}>Your listing is not approved yet. You can prepare your catalogue, but customers may not see it until ADADI approves the business.</Text></View>}
        {!!error && <View style={styles.errorCard}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.link}>Retry loading →</Text></Pressable></View>}
        <View style={styles.actionRow}>
          <Pressable onPress={() => void toggleOpen()} disabled={busy} style={[styles.secondary, styles.flexButton, busy && styles.disabled]}>{busy ? <ActivityIndicator color={C.burgundy} /> : <Text style={styles.secondaryText}>{business.is_open === false ? 'Open shop' : 'Close shop'}</Text>}</Pressable>
          <Pressable onPress={() => { setBusinessName(business.name); setCategory(business.category); setDescription(business.description ?? ''); setPhone(business.phone ?? ''); setAddress(business.address ?? ''); setProfileModal(true); }} style={[styles.primary, styles.flexButton]}><Text style={styles.primaryText}>Edit profile</Text></Pressable>
        </View>
        <View style={styles.tabs}>{(['overview', 'products', 'orders', 'profile'] as Tab[]).map(item => <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}><Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item[0].toUpperCase() + item.slice(1)}</Text></Pressable>)}</View>

        {tab === 'overview' && <>
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={styles.statNumber}>{products.length}</Text><Text style={styles.statLabel}>Products</Text></View>
            <View style={styles.statCard}><Text style={styles.statNumber}>{activeProducts}</Text><Text style={styles.statLabel}>Available</Text></View>
            <View style={styles.statCard}><Text style={styles.statNumber}>{pendingOrders}</Text><Text style={styles.statLabel}>Open orders</Text></View>
          </View>
          <View style={styles.salesCard}><Text style={styles.salesLabel}>Paid orders total</Text><Text style={styles.salesValue}>{money(sales)}</Text><Text style={styles.salesHint}>Based on the latest 30 orders loaded.</Text></View>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent orders</Text><Pressable onPress={() => setTab('orders')}><Text style={styles.link}>View all →</Text></Pressable></View>
          {orders.slice(0, 3).map(order => <OrderCard key={order.id} order={order} onStatus={next => void updateOrderStatus(order, next)} busy={busy} />)}
          {orders.length === 0 && <Empty title="No orders yet" body="New customer orders will appear here." />}
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Your catalogue</Text><Pressable onPress={() => setTab('products')}><Text style={styles.link}>Manage →</Text></Pressable></View>
          {products.slice(0, 3).map(item => <ProductRow key={item.id} item={item} onEdit={() => openEditProduct(item)} onToggle={() => void toggleProduct(item)} onDelete={() => deleteProduct(item)} busy={busy} />)}
          <Pressable onPress={openNewProduct} style={styles.primary}><Text style={styles.primaryText}>＋ Add a product</Text></Pressable>
        </>}

        {tab === 'products' && <>
          <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Products</Text><Text style={styles.muted}>{products.length} in your catalogue</Text></View><Pressable onPress={openNewProduct} style={styles.smallPrimary}><Text style={styles.smallPrimaryText}>＋ Add</Text></Pressable></View>
          {products.map(item => <ProductRow key={item.id} item={item} onEdit={() => openEditProduct(item)} onToggle={() => void toggleProduct(item)} onDelete={() => deleteProduct(item)} busy={busy} />)}
          {products.length === 0 && <Empty title="Your catalogue is empty" body="Add your first product so customers can discover it." />}
        </>}

        {tab === 'orders' && <>
          <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Incoming orders</Text><Text style={styles.muted}>Keep customers updated as you prepare their orders.</Text></View></View>
          {orders.map(order => <OrderCard key={order.id} order={order} onStatus={next => void updateOrderStatus(order, next)} busy={busy} />)}
          {orders.length === 0 && <Empty title="No orders yet" body="Orders for your business will show up here." />}
        </>}

        {tab === 'profile' && <>
          <View style={styles.profileCard}><Text style={styles.sectionTitle}>Public business profile</Text><Text style={styles.body}>These details help customers identify and contact your business.</Text>
            <ProfileLine label="Business name" value={business.name} /><ProfileLine label="Category" value={business.category} /><ProfileLine label="Phone" value={business.phone || 'Not added'} /><ProfileLine label="Address" value={business.address || 'Not added'} /><ProfileLine label="Description" value={business.description || 'Not added'} />
            <Pressable onPress={() => void launchWebsite('/business/dashboard')} style={styles.secondary}><Text style={styles.secondaryText}>More business settings on website ↗</Text></Pressable>
          </View>
        </>}
      </ScrollView>

      <Modal visible={productModal} transparent animationType="slide" onRequestClose={() => setProductModal(false)} statusBarTranslucent>
        <View style={styles.modalRoot}><Pressable style={styles.backdrop} onPress={() => setProductModal(false)} /><View style={styles.sheet}>
          <View style={styles.sheetTop}><View><Text style={styles.sheetTitle}>{editingProduct ? 'Edit product' : 'Add a product'}</Text><Text style={styles.muted}>Keep details accurate for customers.</Text></View><Pressable onPress={() => setProductModal(false)}><Text style={styles.close}>×</Text></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
            <Field label="PRODUCT NAME" value={productName} onChangeText={setProductName} placeholder="e.g. Campus meal pack" />
            <Field label="PRICE (₦)" value={productPrice} onChangeText={setProductPrice} placeholder="e.g. 1500" keyboardType="decimal-pad" />
            <Field label="DESCRIPTION" value={productDescription} onChangeText={setProductDescription} placeholder="Describe this product" multiline />
            <Field label="IMAGE URL (OPTIONAL)" value={productImage} onChangeText={setProductImage} placeholder="https://..." keyboardType="url" />
            <Text style={styles.hint}>For now, use an existing public image URL. Image upload from the phone can be added after storage permissions are verified.</Text>
          </ScrollView>
          <Pressable onPress={() => void saveProduct()} disabled={busy} style={[styles.primary, busy && styles.disabled]}>{busy ? <ActivityIndicator color={C.white} /> : <Text style={styles.primaryText}>Save product</Text>}</Pressable>
        </View></View>
      </Modal>

      <Modal visible={profileModal} transparent animationType="slide" onRequestClose={() => setProfileModal(false)} statusBarTranslucent>
        <View style={styles.modalRoot}><Pressable style={styles.backdrop} onPress={() => setProfileModal(false)} /><View style={styles.sheet}>
          <View style={styles.sheetTop}><View><Text style={styles.sheetTitle}>Edit business profile</Text><Text style={styles.muted}>Changes appear on your public listing.</Text></View><Pressable onPress={() => setProfileModal(false)}><Text style={styles.close}>×</Text></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
            <Field label="BUSINESS NAME" value={businessName} onChangeText={setBusinessName} placeholder="Business name" />
            <Field label="CATEGORY" value={category} onChangeText={setCategory} placeholder="e.g. Food & drinks" />
            <Field label="PHONE" value={phone} onChangeText={setPhone} placeholder="Business phone" keyboardType="phone-pad" />
            <Field label="ADDRESS" value={address} onChangeText={setAddress} placeholder="Campus location" />
            <Field label="DESCRIPTION" value={description} onChangeText={setDescription} placeholder="What customers should know" multiline />
          </ScrollView>
          <Pressable onPress={() => void saveProfile()} disabled={busy} style={[styles.primary, busy && styles.disabled]}>{busy ? <ActivityIndicator color={C.white} /> : <Text style={styles.primaryText}>Save business profile</Text>}</Pressable>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'decimal-pad' | 'phone-pad' | 'url'; multiline?: boolean }) {
  return <View style={{ gap: 6 }}><Text style={styles.fieldLabel}>{props.label}</Text><TextInput value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} placeholderTextColor="#A99BA0" keyboardType={props.keyboardType ?? 'default'} autoCapitalize={props.keyboardType === 'url' ? 'none' : 'sentences'} multiline={props.multiline} textAlignVertical={props.multiline ? 'top' : 'center'} style={[styles.input, props.multiline && styles.multiline]} /></View>;
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return <View style={styles.profileLine}><Text style={styles.fieldLabel}>{label}</Text><Text style={styles.profileValue}>{value}</Text></View>;
}

function ProductRow({ item, onEdit, onToggle, onDelete, busy }: { item: Product; onEdit: () => void; onToggle: () => void; onDelete: () => void; busy: boolean }) {
  return <View style={styles.rowCard}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{item.name}</Text><Text style={styles.rowPrice}>{money(Number(item.price))}</Text><Text style={styles.muted} numberOfLines={2}>{item.description || 'No description added'}</Text><Text style={[styles.miniStatus, item.is_available === false && styles.closedText]}>{item.is_available === false ? 'Unavailable' : 'Available'}</Text><View style={styles.rowActions}><Pressable disabled={busy} onPress={onEdit} style={styles.textAction}><Text style={styles.link}>Edit</Text></Pressable><Pressable disabled={busy} onPress={onToggle} style={styles.textAction}><Text style={styles.link}>{item.is_available === false ? 'Make available' : 'Mark unavailable'}</Text></Pressable><Pressable disabled={busy} onPress={onDelete} style={styles.textAction}><Text style={styles.deleteText}>Delete</Text></Pressable></View></View></View>;
}

function OrderCard({ order, onStatus, busy }: { order: Order; onStatus: (status: OrderStatus) => void; busy: boolean }) {
  const current = (order.order_status || order.status || 'pending').toLowerCase() as OrderStatus;
  const amount = Number(order.total ?? order.total_amount ?? 0);
  const paid = ['success', 'paid'].includes((order.payment_status || '').toLowerCase());
  const nextStatus = STATUSES.filter(item => item !== current && (item !== 'confirmed' && item !== 'preparing' && item !== 'ready' && item !== 'completed' || paid));
  return <View style={styles.orderCard}>
    <View style={styles.orderTop}><View style={{ flex: 1 }}><Text style={styles.rowTitle}>Order {order.order_number || order.id.slice(0, 8)}</Text><Text style={styles.muted}>{new Date(order.created_at).toLocaleDateString()}</Text></View><Text style={styles.rowPrice}>{money(amount)}</Text></View>
    <Text style={styles.orderCustomer}>{order.customer_name || 'Customer'}{order.customer_phone ? ' · ' + order.customer_phone : ''}</Text>
    <Text style={styles.muted}>{order.delivery_method || 'Pickup'}{order.delivery_address ? ' · ' + order.delivery_address : ''}</Text>
    {!!order.order_items?.length && <Text style={styles.itemSummary}>{order.order_items.map(item => item.quantity + '× ' + item.product_name).join(' · ')}</Text>}
    <View style={styles.orderBadges}><Text style={styles.badge}>Order: {current}</Text><Text style={[styles.badge, paid ? styles.paidBadge : styles.unpaidBadge]}>Payment: {order.payment_status || 'pending'}</Text></View>
    <Text style={styles.fieldLabel}>UPDATE ORDER STATUS</Text>
    <View style={styles.statusOptions}>{nextStatus.map(status => <Pressable key={status} disabled={busy} onPress={() => onStatus(status)} style={styles.statusOption}><Text style={styles.statusOptionText}>{status}</Text></Pressable>)}</View>
    {!paid && <Text style={styles.hint}>Payment is not marked successful. Confirm payment before accepting or preparing this order.</Text>}
  </View>;
}

function Empty({ title, body }: { title: string; body: string }) {
  return <View style={styles.empty}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.muted}>{body}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  content: { padding: 18, paddingTop: 14, paddingBottom: 40, gap: 15, maxWidth: 760, width: '100%', alignSelf: 'center' },
  gate: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 16, maxWidth: 620, width: '100%', alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  eyebrow: { color: C.burgundy, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: C.ink, fontSize: 27, lineHeight: 33, fontWeight: '900', letterSpacing: -0.5 },
  heroTitle: { color: C.ink, fontSize: 32, lineHeight: 38, fontWeight: '900', letterSpacing: -0.8 },
  body: { color: C.muted, fontSize: 12, lineHeight: 19 },
  muted: { color: C.muted, fontSize: 10, lineHeight: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  statusPill: { backgroundColor: '#E4F3EA', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 18 },
  closedPill: { backgroundColor: C.pink },
  statusText: { color: C.green, fontSize: 9, fontWeight: '900' },
  closedText: { color: C.burgundy, fontSize: 9, fontWeight: '900' },
  notice: { backgroundColor: '#FFF4D8', borderColor: '#F0DCA5', borderWidth: 1, borderRadius: 15, padding: 14, gap: 6 },
  noticeTitle: { color: C.dark, fontSize: 12, fontWeight: '900', textTransform: 'capitalize' },
  errorCard: { backgroundColor: '#FCE8EB', borderRadius: 14, padding: 13, gap: 8 },
  error: { color: C.red, fontSize: 11, lineHeight: 17 },
  link: { color: C.burgundy, fontSize: 11, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 9 },
  flexButton: { flex: 1 },
  primary: { minHeight: 46, borderRadius: 13, backgroundColor: C.burgundy, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: C.white, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  secondary: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: C.border, backgroundColor: C.white, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: C.burgundy, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  disabled: { opacity: 0.65 },
  tabs: { flexDirection: 'row', gap: 5, backgroundColor: '#F0E6E9', borderRadius: 14, padding: 5 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: C.burgundy },
  tabText: { color: C.muted, fontSize: 10, fontWeight: '800' },
  tabTextActive: { color: C.white },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 13, gap: 4 },
  statNumber: { color: C.burgundy, fontSize: 23, fontWeight: '900' },
  statLabel: { color: C.muted, fontSize: 9, fontWeight: '700' },
  salesCard: { backgroundColor: C.burgundy, borderRadius: 18, padding: 17, gap: 5 },
  salesLabel: { color: '#F2DCE2', fontSize: 10, fontWeight: '800' },
  salesValue: { color: C.white, fontSize: 27, fontWeight: '900' },
  salesHint: { color: '#E6C6D0', fontSize: 9 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 },
  sectionTitle: { color: C.ink, fontSize: 17, fontWeight: '900' },
  smallPrimary: { backgroundColor: C.burgundy, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
  smallPrimaryText: { color: C.white, fontSize: 10, fontWeight: '900' },
  rowCard: { backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14 },
  rowCopy: { gap: 6 },
  rowTitle: { color: C.ink, fontSize: 12, fontWeight: '900' },
  rowPrice: { color: C.burgundy, fontSize: 14, fontWeight: '900' },
  miniStatus: { color: C.green, fontSize: 9, fontWeight: '900', textTransform: 'capitalize' },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, paddingTop: 3 },
  textAction: { paddingVertical: 4 },
  deleteText: { color: C.red, fontSize: 11, fontWeight: '900' },
  orderCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 17, padding: 14, gap: 9 },
  orderTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderCustomer: { color: C.ink, fontSize: 11, fontWeight: '800' },
  itemSummary: { color: C.dark, fontSize: 10, lineHeight: 16 },
  orderBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { overflow: 'hidden', borderRadius: 20, backgroundColor: C.pink, color: C.burgundy, fontSize: 9, fontWeight: '800', paddingHorizontal: 9, paddingVertical: 6, textTransform: 'capitalize' },
  paidBadge: { backgroundColor: '#E4F3EA', color: C.green },
  unpaidBadge: { backgroundColor: '#FFF4D8', color: C.dark },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statusOption: { borderWidth: 1, borderColor: C.border, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: C.cream },
  statusOptionText: { color: C.burgundy, fontSize: 9, fontWeight: '800', textTransform: 'capitalize' },
  hint: { color: C.muted, fontSize: 9, lineHeight: 15 },
  empty: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 20, gap: 6, alignItems: 'center' },
  profileCard: { backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, gap: 13 },
  profileLine: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, gap: 5 },
  profileValue: { color: C.ink, fontSize: 12, lineHeight: 18 },
  fieldLabel: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  input: { minHeight: 47, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, color: C.ink, backgroundColor: C.white, fontSize: 12 },
  multiline: { minHeight: 90, paddingTop: 12 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,10,14,0.5)' },
  sheet: { maxHeight: '90%', backgroundColor: C.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 19, gap: 15 },
  sheetTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  sheetTitle: { color: C.ink, fontSize: 21, fontWeight: '900' },
  close: { color: C.ink, fontSize: 27, lineHeight: 29, paddingHorizontal: 4 },
  pressed: { opacity: 0.75 },
});

