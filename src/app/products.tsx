import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const [searchDraft, setSearchDraft] = useState(params.q ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(params.q ?? '');
  const [filterOpen, setFilterOpen] = useState(false);
  const [minDraft, setMinDraft] = useState('');
  const [maxDraft, setMaxDraft] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [draftColors, setDraftColors] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [filterError, setFilterError] = useState('');
  const [sortOrder, setSortOrder] = useState<'default' | 'low' | 'high'>('default');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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
    const filtered = selectedColors.length === 0 ? products : products.filter(product => {
      const searchable = (product.name + ' ' + (product.description ?? '')).toLowerCase();
      return selectedColors.some(color => searchable.includes(color.toLowerCase()));
    });
    if (sortOrder === 'default') return filtered;
    return [...filtered].sort((a, b) => sortOrder === 'low'
      ? Number(a.price) - Number(b.price)
      : Number(b.price) - Number(a.price));
  }, [products, selectedColors, sortOrder]);

  const activeFilterCount = (minPrice !== undefined ? 1 : 0) + (maxPrice !== undefined ? 1 : 0) + selectedColors.length;

  const toggleDraftColor = (color: string) => {
    setDraftColors(current => current.includes(color) ? current.filter(item => item !== color) : [...current, color]);
  };

  const openFilters = () => {
    setMinDraft(minPrice === undefined ? '' : String(minPrice));
    setMaxDraft(maxPrice === undefined ? '' : String(maxPrice));
    setDraftColors(selectedColors);
    setFilterError('');
    setFilterOpen(true);
  };

  const applyFilters = () => {
    const min = minDraft.trim() ? Number(minDraft.replace(/,/g, '')) : undefined;
    const max = maxDraft.trim() ? Number(maxDraft.replace(/,/g, '')) : undefined;
    if ((min !== undefined && (!Number.isFinite(min) || min < 0)) || (max !== undefined && (!Number.isFinite(max) || max < 0))) {
      setFilterError('Enter a valid price of ₦0 or more.');
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      setFilterError('Minimum price cannot be greater than maximum price.');
      return;
    }
    setFilterError('');
    setMinPrice(min);
    setMaxPrice(max);
    setSelectedColors(draftColors);
    setFilterOpen(false);
  };

  const choosePricePreset = (min: number | undefined, max: number | undefined) => {
    setMinDraft(min === undefined ? '' : String(min));
    setMaxDraft(max === undefined ? '' : String(max));
    setFilterError('');
  };

  const clearFilters = () => {
    setMinDraft('');
    setMaxDraft('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setDraftColors([]);
    setSelectedColors([]);
    setFilterError('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹  Back</Text></Pressable>
        <Text style={styles.kicker}>SHOP THE CAMPUS</Text>
        <Text style={styles.title}>Browse products</Text>
        <Text style={styles.subtitle}>Discover what DUFUHS businesses have available.</Text>

        <View style={styles.searchWrap}>
          <Text style={styles.searchGlyph}>⌕</Text>
          <TextInput value={searchDraft} onChangeText={value => { setSearchDraft(value); setSearch(value); }} placeholder="Search products..." placeholderTextColor="#93848A" returnKeyType="search" style={styles.searchInput} accessibilityLabel="Search products" />
          {searchDraft.length > 0 && <Pressable onPress={() => { setSearchDraft(''); setSearch(''); }} accessibilityRole="button" accessibilityLabel="Clear search"><Text style={styles.clear}>×</Text></Pressable>}
        </View>

        <View style={styles.toolbar}>
          <Pressable onPress={openFilters} style={({ pressed }) => [styles.toolbarButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Open product filters">
            <Text style={styles.toolbarGlyph}>☷</Text>
            <Text style={styles.toolbarText}>Filter</Text>
            {activeFilterCount > 0 && <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilterCount}</Text></View>}
          </Pressable>
          <Pressable onPress={() => setSortOrder(current => current === 'default' ? 'low' : current === 'low' ? 'high' : 'default')} style={({ pressed }) => [styles.toolbarButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Sort products by price">
            <Text style={styles.toolbarGlyph}>↕</Text>
            <Text style={styles.toolbarText}>{sortOrder === 'low' ? 'Price: low first' : sortOrder === 'high' ? 'Price: high first' : 'Sort'}</Text>
          </Pressable>
        </View>

        {(minPrice !== undefined || maxPrice !== undefined || selectedColors.length > 0) && (
          <View style={styles.activeFiltersRow}>
            {minPrice !== undefined && <Text style={styles.activeFilterChip}>Min {money(minPrice)}</Text>}
            {maxPrice !== undefined && <Text style={styles.activeFilterChip}>Max {money(maxPrice)}</Text>}
            {selectedColors.map(color => <Text key={color} style={styles.activeFilterChip}>{color}</Text>)}
            <Pressable onPress={clearFilters} accessibilityRole="button"><Text style={styles.clearActiveText}>Clear all</Text></Pressable>
          </View>
        )}

        <View style={styles.resultsHeader}><Text style={styles.resultsTitle}>Products</Text>{!loading && !error && <Text style={styles.count}>{visibleProducts.length} shown</Text>}</View>

        {!isSupabaseConfigured() ? (
          <View style={styles.stateCard}><Text style={styles.stateTitle}>Connect ADADI data</Text><Text style={styles.stateBody}>Add your Supabase URL and publishable key to .env, then restart Expo.</Text></View>
        ) : loading ? (
          <View style={styles.stateCard}><ActivityIndicator size="large" color={C.burgundy} /><Text style={styles.stateBody}>Finding products…</Text></View>
        ) : error ? (
          <View style={styles.stateCard}><Text style={styles.stateTitle}>Couldn’t load products</Text><Text style={styles.stateBody}>{error}</Text><Pressable onPress={() => { setRefreshing(true); void loadProducts(); }} disabled={refreshing} style={[styles.retryButton, refreshing && styles.disabled]}>{refreshing ? <ActivityIndicator color={C.white} /> : <Text style={styles.retryText}>Try again</Text>}</Pressable></View>
        ) : visibleProducts.length === 0 ? (
          <View style={styles.stateCard}><Text style={styles.stateTitle}>No matching products</Text><Text style={styles.stateBody}>Try a different product name or adjust your filters. You can also search campus businesses.</Text><Pressable onPress={clearFilters} style={styles.clearButton} accessibilityRole="button"><Text style={styles.clearButtonText}>Clear filters</Text></Pressable><Pressable onPress={() => router.push({ pathname: '/explore', params: searchDraft.trim() ? { q: searchDraft.trim() } : {} })} style={styles.clearButton} accessibilityRole="button"><Text style={styles.clearButtonText}>Search businesses instead ↗</Text></Pressable></View>
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
        <Text style={styles.dataNote}>This screen loads up to 30 products per request to help limit data usage.</Text>
      </ScrollView>

      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)} statusBarTranslucent>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setFilterOpen(false)} accessibilityLabel="Close filters" />
          <View style={styles.filterSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View><Text style={styles.sheetTitle}>Filter products</Text><Text style={styles.sheetSubtitle}>Choose a price range and color</Text></View>
              <Pressable onPress={() => setFilterOpen(false)} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close filters"><Text style={styles.closeButtonText}>×</Text></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetScroll}>
              <View style={styles.filterSection}>
                <View style={styles.filterHeadingRow}><Text style={styles.filterTitle}>Price range</Text><Text style={styles.filterHint}>In naira (₦)</Text></View>
                <View style={styles.priceInputs}>
                  <View style={styles.priceField}><Text style={styles.fieldLabel}>MINIMUM</Text><TextInput value={minDraft} onChangeText={value => { setMinDraft(value); setFilterError(''); }} placeholder="₦0" placeholderTextColor="#A99BA0" keyboardType="numeric" style={styles.priceInput} accessibilityLabel="Minimum price" /></View>
                  <Text style={styles.priceDash}>—</Text>
                  <View style={styles.priceField}><Text style={styles.fieldLabel}>MAXIMUM</Text><TextInput value={maxDraft} onChangeText={value => { setMaxDraft(value); setFilterError(''); }} placeholder="No limit" placeholderTextColor="#A99BA0" keyboardType="numeric" style={styles.priceInput} accessibilityLabel="Maximum price" /></View>
                </View>
                <View style={styles.priceChips}>
                  {[
                    { label: 'Under ₦1k', min: undefined, max: 999 },
                    { label: '₦1k–₦2k', min: 1000, max: 2000 },
                    { label: 'Over ₦2k', min: 2001, max: undefined },
                  ].map(preset => {
                    const active = minDraft === (preset.min === undefined ? '' : String(preset.min)) && maxDraft === (preset.max === undefined ? '' : String(preset.max));
                    return <Pressable key={preset.label} onPress={() => choosePricePreset(preset.min, preset.max)} style={[styles.priceChip, active && styles.priceChipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}><Text style={[styles.priceChipText, active && styles.priceChipTextActive]}>{preset.label}</Text></Pressable>;
                  })}
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.filterHeadingRow}><Text style={styles.filterTitle}>Color</Text><Text style={styles.filterHint}>{draftColors.length ? draftColors.length + ' selected' : 'Choose any'}</Text></View>
                <View style={styles.colorGrid}>
                  {colors.map(color => {
                    const active = draftColors.includes(color.name);
                    return <Pressable key={color.name} onPress={() => toggleDraftColor(color.name)} style={styles.colorOption} accessibilityRole="button" accessibilityLabel={color.name} accessibilityState={{ selected: active }}>
                      <View style={[styles.swatch, { backgroundColor: color.hex }, color.name === 'White' && styles.whiteSwatch, active && styles.swatchActive]}>{active && <Text style={[styles.swatchCheck, (color.name === 'White' || color.name === 'Yellow' || color.name === 'Beige') && styles.darkCheck]}>✓</Text>}</View>
                      <Text style={[styles.colorLabel, active && styles.colorLabelActive]}>{color.name}</Text>
                    </Pressable>;
                  })}
                </View>
                <Text style={styles.colorNote}>Color matching uses words in product names and descriptions. Items without a written color may not match.</Text>
              </View>
              {!!filterError && <Text style={styles.filterError}>{filterError}</Text>}
            </ScrollView>
            <View style={styles.sheetActions}>
              <Pressable onPress={clearFilters} style={styles.clearSheetButton} accessibilityRole="button"><Text style={styles.clearSheetText}>Clear all</Text></Pressable>
              <Pressable onPress={applyFilters} style={({ pressed }) => [styles.applyButton, pressed && styles.pressed]} accessibilityRole="button"><Text style={styles.applyText}>Apply filters</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  toolbar: { flexDirection: 'row', gap: 10 },
  toolbarButton: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 13, borderWidth: 1, borderColor: C.border, backgroundColor: C.white, paddingHorizontal: 10 },
  toolbarGlyph: { color: C.burgundy, fontSize: 20, fontWeight: '800' },
  toolbarText: { color: C.ink, fontSize: 12, fontWeight: '800' },
  filterBadge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: C.burgundy },
  filterBadgeText: { color: C.white, fontSize: 10, fontWeight: '900' },
  activeFiltersRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  activeFilterChip: { overflow: 'hidden', color: C.burgundy, backgroundColor: C.pink, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6, fontSize: 10, fontWeight: '800' },
  clearActiveText: { color: C.burgundy, fontSize: 10, fontWeight: '900', paddingHorizontal: 3, paddingVertical: 6 },
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
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20, 10, 14, 0.48)' },
  filterSheet: { maxHeight: '88%', backgroundColor: C.cream, borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 18, gap: 12 },
  sheetHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#D6C9CD', marginBottom: 2 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 4 },
  sheetTitle: { color: C.ink, fontSize: 21, fontWeight: '900' },
  sheetSubtitle: { color: C.muted, fontSize: 11, marginTop: 3 },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  closeButtonText: { color: C.ink, fontSize: 24, lineHeight: 26 },
  sheetScroll: { gap: 14, paddingBottom: 4 },
  filterSection: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 15, gap: 13 },
  filterHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  filterTitle: { color: C.ink, fontSize: 15, fontWeight: '900' },
  filterHint: { color: C.muted, fontSize: 10, fontWeight: '700' },
  priceInputs: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceField: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: C.border, borderRadius: 13, paddingHorizontal: 11, paddingTop: 8, paddingBottom: 4, backgroundColor: '#FFFCFB' },
  fieldLabel: { color: C.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  priceInput: { color: C.ink, fontSize: 13, paddingVertical: 7, minWidth: 0 },
  priceDash: { color: C.muted, fontWeight: '700' },
  priceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priceChip: { borderRadius: 20, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: C.cream },
  priceChipActive: { backgroundColor: C.pink, borderColor: C.burgundy },
  priceChipText: { color: C.muted, fontSize: 10, fontWeight: '800' },
  priceChipTextActive: { color: C.burgundy },
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
  filterError: { color: '#B42318', fontSize: 11, fontWeight: '700', paddingHorizontal: 4 },
  sheetActions: { flexDirection: 'row', gap: 10, paddingTop: 4 },
  clearSheetButton: { flex: 0.8, minHeight: 46, borderWidth: 1, borderColor: C.border, borderRadius: 13, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  clearSheetText: { color: C.burgundy, fontSize: 12, fontWeight: '900' },
  applyButton: { flex: 1.2, minHeight: 46, backgroundColor: C.burgundy, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  applyText: { color: C.white, fontSize: 12, fontWeight: '900' },
});