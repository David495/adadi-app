import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { fetchProducts, isSupabaseConfigured, Product } from '@/lib/supabase-rest';

const C = { burgundy: '#8B1E3F', burgundyDark: '#64152E', cream: '#FAF8F6', ink: '#24171B', muted: '#76666C', border: '#EAE1E3', white: '#FFFFFF', pink: '#F4E4E9', gold: '#D4A017' };
const colors = [
  { name: 'Black', hex: '#171717' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#D62839' },
  { name: 'Blue', hex: '#2878C8' },
  { name: 'Green', hex: '#258653' },
  { name: 'Pink', hex: '#E9A6BC' },
  { name: 'Brown', hex: '#8B5E3C' },
  { name: 'Beige', hex: '#D8C5A5' },
  { name: 'Purple', hex: '#8256A6' },
  { name: 'Yellow', hex: '#E8C547' },
];

const money = (value: number) => '₦' + Math.round(value).toLocaleString('en-NG');

function businessName(product: Product) {
  const value = product.business;
  return Array.isArray(value) ? value[0]?.name ?? 'Campus business' : value?.name ?? 'Campus business';
}

export default function ProductsScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [search, setSearch] = useState(params.q ?? '');
  const [minDraft, setMinDraft] = useState('');
  const [maxDraft, setMaxDraft] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchDraft, setSearchDraft] = useState(params.q ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(params.q ?? '');

  useEffect(() => {
    if (params.q) {
      setSearch(params.q);
      setSearchDraft(params.q);
      setDebouncedSearch(params.q);
    }
  }, [params.q]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    setError('');
    try {
      const rows = await fetchProducts({ search: debouncedSearch, minPrice, maxPrice, limit: 30, signal });
      setProducts(rows);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : 'Something went wrong while loading products.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [debouncedSearch, minPrice, maxPrice]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void loadProducts(controller.signal);
    return () => controller.abort();
  }, [loadProducts]);

  const visibleProducts = useMemo(() => {
    if (selectedColors.length === 0) return products;
    return products.filter(product => {
      const searchable = (product.name + ' ' + (product.description ?? '')).toLowerCase();
      return selectedColors.some(color => searchable.includes(color.toLowerCase()));
    });
  }, [products, selectedColors]);

  const toggleColor = (color: string) => {
    setSelectedColors(current => current.includes(color) ? current.filter(item => item !== color) : [...current, color]);
  };

  const applyPrice = () => {
    const min = minDraft.trim() ? Number(minDraft.replace(/,/g, '')) : undefined;
    const max = maxDraft.trim() ? Number(maxDraft.replace(/,/g, '')) : undefined;
    if ((min !== undefined && (!Number.isFinite(min) || min < 0)) || (max !== undefined && (!Number.isFinite(max) || max < 0))) {
      setError('Enter a valid price of ₦0 or more.');
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      setError('Minimum price cannot be greater than maximum price.');
      return;
    }
    setMinPrice(min);
    setMaxPrice(max);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchDraft('');
    setMinDraft('');
    setMaxDraft('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSelectedColors([]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹  Back</Text></Pressable>
        <Text style={styles.kicker}>SHOP THE CAMPUS</Text>
        <Text style={styles.title}>Browse products</Text>
        <Text style={styles.subtitle}>Discover what DUFUHS businesses have available, with filters to help you find your fit.</Text>

        <View style={styles.searchWrap}>
          <Text style={styles.searchGlyph}>⌕</Text>
          <TextInput value={searchDraft} onChangeText={value => { setSearchDraft(value); setSearch(value); }} placeholder="Search products..." placeholderTextColor="#93848A" returnKeyType="search" style={styles.searchInput} accessibilityLabel="Search products" />
          {searchDraft.length > 0 && <Pressable onPress={() => { setSearchDraft(''); setSearch(''); }} accessibilityRole="button" accessibilityLabel="Clear search"><Text style={styles.clear}>×</Text></Pressable>}
        </View>

        <View style={styles.filterCard}>
          <View style={styles.filterHeadingRow}><Text style={styles.filterTitle}>Price range</Text><Text style={styles.filterHint}>In naira (₦)</Text></View>
          <View style={styles.priceInputs}>
            <View style={styles.priceField}><Text style={styles.fieldLabel}>MINIMUM</Text><TextInput value={minDraft} onChangeText={setMinDraft} placeholder="₦0" placeholderTextColor="#A99BA0" keyboardType="numeric" style={styles.priceInput} accessibilityLabel="Minimum price" /></View>
            <Text style={styles.priceDash}>—</Text>
            <View style={styles.priceField}><Text style={styles.fieldLabel}>MAXIMUM</Text><TextInput value={maxDraft} onChangeText={setMaxDraft} placeholder="No limit" placeholderTextColor="#A99BA0" keyboardType="numeric" style={styles.priceInput} accessibilityLabel="Maximum price" /></View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.priceChips}>
            {[
              { label: 'Under ₦1k', min: undefined, max: 999 },
              { label: '₦1k–₦2k', min: 1000, max: 2000 },
              { label: 'Over ₦2k', min: 2001, max: undefined },
            ].map(preset => {
              const active = minPrice === preset.min && maxPrice === preset.max;
              return <Pressable key={preset.label} onPress={() => { setMinDraft(preset.min === undefined ? '' : String(preset.min)); setMaxDraft(preset.max === undefined ? '' : String(preset.max)); setMinPrice(preset.min); setMaxPrice(preset.max); }} style={[styles.priceChip, active && styles.priceChipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}><Text style={[styles.priceChipText, active && styles.priceChipTextActive]}>{preset.label}</Text></Pressable>;
            })}
          </ScrollView>
          <Pressable onPress={applyPrice} style={({ pressed }) => [styles.applyButton, pressed && styles.pressed]} accessibilityRole="button"><Text style={styles.applyText}>Apply price range</Text></Pressable>
        </View>

        <View style={styles.filterCard}>
          <View style={styles.filterHeadingRow}><Text style={styles.filterTitle}>Filter by color</Text><Text style={styles.filterHint}>{selectedColors.length ? selectedColors.length + ' selected' : 'Choose any'}</Text></View>
          <View style={styles.colorGrid}>
            {colors.map(color => {
              const active = selectedColors.includes(color.name);
              return <Pressable key={color.name} onPress={() => toggleColor(color.name)} style={styles.colorOption} accessibilityRole="button" accessibilityLabel={color.name} accessibilityState={{ selected: active }}>
                <View style={[styles.swatch, { backgroundColor: color.hex }, color.name === 'White' && styles.whiteSwatch, active && styles.swatchActive]}>{active && <Text style={[styles.swatchCheck, (color.name === 'White' || color.name === 'Yellow' || color.name === 'Beige') && styles.darkCheck]}>✓</Text>}</View>
                <Text style={[styles.colorLabel, active && styles.colorLabelActive]}>{color.name}</Text>
              </Pressable>;
            })}
          </View>
          <Text style={styles.colorNote}>Color matching uses color words in product names and descriptions. Products without a written color may not appear until color details are added to their listings.</Text>
        </View>

        <View style={styles.resultsHeader}><Text style={styles.resultsTitle}>Products</Text>{!loading && !error && <Text style={styles.count}>{visibleProducts.length} shown</Text>}</View>

        {!isSupabaseConfigured() ? (
          <View style={styles.stateCard}><Text style={styles.stateTitle}>Connect ADADI data</Text><Text style={styles.stateBody}>Add your Supabase URL and publishable key to .env, then restart Expo.</Text></View>
        ) : loading ? (
          <View style={styles.stateCard}><ActivityIndicator size="large" color={C.burgundy} /><Text style={styles.stateBody}>Finding products…</Text></View>
        ) : error ? (
          <View style={styles.stateCard}><Text style={styles.stateTitle}>Couldn’t load products</Text><Text style={styles.stateBody}>{error}</Text><Pressable onPress={() => { setRefreshing(true); void loadProducts(); }} disabled={refreshing} style={[styles.retryButton, refreshing && styles.disabled]}>{refreshing ? <ActivityIndicator color={C.white} /> : <Text style={styles.retryText}>Try again</Text>}</Pressable></View>
        ) : visibleProducts.length === 0 ? (
          <View style={styles.stateCard}><Text style={styles.stateTitle}>No matching products</Text><Text style={styles.stateBody}>Try a different search, widen your price range or choose another color.</Text><Pressable onPress={clearFilters} style={styles.clearButton}><Text style={styles.clearButtonText}>Clear all filters</Text></Pressable></View>
        ) : (
          <View style={styles.productGrid}>
            {visibleProducts.map(product => (
              <View key={product.id} style={styles.productCard}>
                {product.image_url ? <Image source={{ uri: product.image_url }} style={styles.productImage} resizeMode="cover" /> : <View style={styles.productImageFallback}><Text style={styles.fallbackEmoji}>🛍️</Text></View>}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <Text style={styles.productPrice}>{money(Number(product.price) || 0)}</Text>
                  <Text style={styles.businessName} numberOfLines={1}>{businessName(product)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.dataNote}>To help save mobile data, this screen loads up to 30 products at a time and only displays their listing images.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  content: { padding: 20, paddingTop: 12, paddingBottom: 40, gap: 15, maxWidth: 760, width: '100%', alignSelf: 'center' },
  back: { alignSelf: 'flex-start', paddingVertical: 4, paddingRight: 10 },
  backText: { color: C.burgundy, fontSize: 13, fontWeight: '800' },
  kicker: { color: C.burgundy, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 6 },
  title: { color: C.ink, fontSize: 30, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 20, marginTop: -8 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, backgroundColor: C.white, borderRadius: 15, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14 },
  searchGlyph: { color: C.burgundy, fontSize: 24 },
  searchInput: { flex: 1, minWidth: 0, color: C.ink, fontSize: 13, paddingVertical: 12 },
  clear: { color: C.muted, fontSize: 24, paddingHorizontal: 3 },
  filterCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 16, gap: 13 },
  filterHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  filterTitle: { color: C.ink, fontSize: 15, fontWeight: '900' },
  filterHint: { color: C.muted, fontSize: 10, fontWeight: '700' },
  priceInputs: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceField: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: C.border, borderRadius: 13, paddingHorizontal: 11, paddingTop: 8, paddingBottom: 4, backgroundColor: '#FFFCFB' },
  fieldLabel: { color: C.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  priceInput: { color: C.ink, fontSize: 13, paddingVertical: 7, minWidth: 0 },
  priceDash: { color: C.muted, fontWeight: '700' },
  priceChips: { gap: 8, paddingBottom: 2 },
  priceChip: { borderRadius: 20, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: C.cream },
  priceChipActive: { backgroundColor: C.pink, borderColor: C.burgundy },
  priceChipText: { color: C.muted, fontSize: 10, fontWeight: '800' },
  priceChipTextActive: { color: C.burgundy },
  applyButton: { backgroundColor: C.burgundy, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', minHeight: 42 },
  applyText: { color: C.white, fontSize: 12, fontWeight: '900' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  colorOption: { alignItems: 'center', width: 54, gap: 6 },
  swatch: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  whiteSwatch: { borderColor: '#D8D0D2' },
  swatchActive: { borderColor: C.burgundy, borderWidth: 3 },
  swatchCheck: { color: C.white, fontSize: 14, fontWeight: '900' },
  darkCheck: { color: C.ink },
  colorLabel: { color: C.muted, fontSize: 9, fontWeight: '700' },
  colorLabelActive: { color: C.burgundy, fontWeight: '900' },
  colorNote: { color: C.muted, fontSize: 10, lineHeight: 15 },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  resultsTitle: { color: C.ink, fontSize: 18, fontWeight: '900' },
  count: { color: C.muted, fontSize: 10 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: { width: '47%', flexGrow: 1, flexBasis: '42%', overflow: 'hidden', borderRadius: 17, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  productImage: { width: '100%', height: 145, backgroundColor: C.pink },
  productImageFallback: { width: '100%', height: 145, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center' },
  fallbackEmoji: { fontSize: 32 },
  productInfo: { padding: 12, gap: 5 },
  productName: { color: C.ink, fontSize: 12, lineHeight: 17, fontWeight: '800', minHeight: 34 },
  productPrice: { color: C.burgundy, fontSize: 15, fontWeight: '900' },
  businessName: { color: C.muted, fontSize: 10 },
  stateCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 20, alignItems: 'center', gap: 10, minHeight: 130, justifyContent: 'center' },
  stateTitle: { color: C.ink, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  stateBody: { color: C.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  retryButton: { minWidth: 110, backgroundColor: C.burgundy, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  retryText: { color: C.white, fontSize: 12, fontWeight: '900' },
  clearButton: { padding: 10 },
  clearButtonText: { color: C.burgundy, fontSize: 11, fontWeight: '900' },
  dataNote: { color: C.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', paddingVertical: 4 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.65 },
});
