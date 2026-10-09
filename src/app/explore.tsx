import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Business, fetchBusinesses, isSupabaseConfigured } from '@/lib/supabase-rest';

const C = { burgundy: '#8B1E3F', cream: '#FAF8F6', ink: '#24171B', muted: '#76666C', border: '#EAE1E3', white: '#FFFFFF', pink: '#F4E4E9', gold: '#D4A017' };
const categories = ['All', 'Fashion', 'Beauty', 'Food & drinks', 'Electronics', 'Services'];

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const [search, setSearch] = useState(params.q ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(params.q ?? '');
  const [category, setCategory] = useState(params.category ?? 'All');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.q) setSearch(params.q);
    if (params.category) setCategory(params.category);
  }, [params.q, params.category]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadBusinesses = useCallback(async (signal?: AbortSignal) => {
    setError('');
    try {
      const result = await fetchBusinesses({ search: debouncedSearch, category, limit: 20, offset: 0, signal });
      setBusinesses(result);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : 'Something went wrong while loading businesses.');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [debouncedSearch, category]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void loadBusinesses(controller.signal);
    return () => controller.abort();
  }, [loadBusinesses]);

  const retry = () => {
    setRefreshing(true);
    void loadBusinesses();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹  Back</Text></Pressable>
        <Text style={styles.kicker}>THE CAMPUS DIRECTORY</Text>
        <Text style={styles.title}>Explore ADADI</Text>
        <Text style={styles.subtitle}>Find a business, service or product around the DUFUHS community.</Text>

        <View style={styles.searchWrap}>
          <Text style={styles.searchGlyph}>⌕</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="What are you looking for?"
            placeholderTextColor="#93848A"
            returnKeyType="search"
            style={styles.searchInput}
            accessibilityLabel="Search businesses"
          />
          {search.length > 0 && <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Clear search"><Text style={styles.clear}>×</Text></Pressable>}
        </View>

        <Text style={styles.sectionLabel}>CATEGORIES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categories.map(item => (
            <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]} accessibilityRole="button" accessibilityState={{ selected: category === item }}>
              <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>{category === 'All' ? 'Campus businesses' : category}</Text>
          {!loading && !error && <Text style={styles.count}>{businesses.length} shown</Text>}
        </View>

        {!isSupabaseConfigured() ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Connect ADADI data</Text>
            <Text style={styles.stateBody}>Add your Supabase URL and publishable key to a local .env file using .env.example as the guide, then restart Expo.</Text>
          </View>
        ) : loading ? (
          <View style={styles.stateCard}><ActivityIndicator size="large" color={C.burgundy} /><Text style={styles.stateBody}>Loading campus businesses…</Text></View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Couldn’t load businesses</Text>
            <Text style={styles.stateBody}>{error}</Text>
            <Pressable onPress={retry} disabled={refreshing} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed, refreshing && styles.disabled]}>
              {refreshing ? <ActivityIndicator color={C.white} /> : <Text style={styles.retryText}>Try again</Text>}
            </Pressable>
          </View>
        ) : businesses.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>No matches yet</Text>
            <Text style={styles.stateBody}>Try another search or choose a different category.</Text>
            <Pressable onPress={() => { setSearch(''); setCategory('All'); }} style={styles.resetButton}><Text style={styles.resetText}>Clear filters</Text></Pressable>
          </View>
        ) : (
          <View style={styles.businessList}>
            {businesses.map(business => (
              <View key={business.id} style={styles.businessCard}>
                {business.logo_url ? (
                  <Image source={{ uri: business.logo_url }} style={styles.businessImage} resizeMode="cover" />
                ) : (
                  <View style={styles.imageFallback}><Text style={styles.imageFallbackText}>{business.name.trim().slice(0, 1).toUpperCase()}</Text></View>
                )}
                <View style={styles.businessCopy}>
                  <View style={styles.businessTitleRow}>
                    <Text style={styles.businessName} numberOfLines={1}>{business.name}</Text>
                    <View style={[styles.openPill, business.is_open === false && styles.closedPill]}><Text style={[styles.openText, business.is_open === false && styles.closedText]}>{business.is_open === false ? 'Closed' : 'Open'}</Text></View>
                  </View>
                  <Text style={styles.businessCategory} numberOfLines={1}>{business.category || 'Campus business'}</Text>
                  {!!business.description && <Text style={styles.businessDescription} numberOfLines={2}>{business.description}</Text>}
                  {!!business.address && <Text style={styles.businessAddress} numberOfLines={1}>⌖ {business.address}</Text>}
                </View>
              </View>
            ))}
            <Text style={styles.paginationNote}>Showing up to 20 businesses per request to help save mobile data.</Text>
          </View>
        )}
        <View style={styles.tip}><Text style={styles.tipIcon}>◉</Text><Text style={styles.tipText}>Images are only loaded for businesses in this result list. Listings are limited to approved businesses.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  content: { padding: 20, paddingTop: 12, paddingBottom: 36, gap: 16, maxWidth: 760, width: '100%', alignSelf: 'center' },
  back: { alignSelf: 'flex-start', paddingVertical: 4, paddingRight: 10 },
  backText: { color: C.burgundy, fontSize: 13, fontWeight: '800' },
  kicker: { color: C.burgundy, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 6 },
  title: { color: C.ink, fontSize: 30, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 20, marginTop: -8 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, backgroundColor: C.white, borderRadius: 15, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14 },
  searchGlyph: { color: C.burgundy, fontSize: 24 },
  searchInput: { flex: 1, minWidth: 0, color: C.ink, fontSize: 13, paddingVertical: 12 },
  clear: { color: C.muted, fontSize: 24, paddingHorizontal: 3 },
  sectionLabel: { color: C.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginTop: 5 },
  chips: { gap: 8, paddingBottom: 4 },
  chip: { borderWidth: 1, borderColor: C.border, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.white },
  chipActive: { backgroundColor: C.burgundy, borderColor: C.burgundy },
  chipText: { color: C.muted, fontSize: 11, fontWeight: '700' },
  chipTextActive: { color: C.white },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  resultsTitle: { color: C.ink, fontSize: 17, fontWeight: '900' },
  count: { color: C.muted, fontSize: 10 },
  businessList: { gap: 10 },
  businessCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 12 },
  businessImage: { width: 68, height: 68, borderRadius: 15, backgroundColor: C.pink },
  imageFallback: { width: 68, height: 68, borderRadius: 15, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { color: C.burgundy, fontSize: 25, fontWeight: '900' },
  businessCopy: { flex: 1, minWidth: 0, gap: 4 },
  businessTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  businessName: { flex: 1, minWidth: 0, color: C.ink, fontSize: 13, fontWeight: '900' },
  openPill: { borderRadius: 20, backgroundColor: '#E8F4ED', paddingHorizontal: 7, paddingVertical: 4 },
  closedPill: { backgroundColor: '#F4E4E9' },
  openText: { color: '#26734D', fontSize: 9, fontWeight: '800' },
  closedText: { color: C.burgundy, fontSize: 9, fontWeight: '800' },
  businessCategory: { color: C.burgundy, fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  businessDescription: { color: C.muted, fontSize: 10, lineHeight: 15 },
  businessAddress: { color: C.muted, fontSize: 10 },
  paginationNote: { color: C.muted, fontSize: 10, textAlign: 'center', lineHeight: 15, paddingVertical: 4 },
  stateCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 20, alignItems: 'center', gap: 10, minHeight: 130, justifyContent: 'center' },
  stateTitle: { color: C.ink, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  stateBody: { color: C.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  retryButton: { minWidth: 110, backgroundColor: C.burgundy, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  retryText: { color: C.white, fontSize: 12, fontWeight: '900' },
  resetButton: { paddingHorizontal: 12, paddingVertical: 8 },
  resetText: { color: C.burgundy, fontSize: 11, fontWeight: '900' },
  tip: { flexDirection: 'row', gap: 10, backgroundColor: '#F1E5E9', borderRadius: 16, padding: 14, alignItems: 'flex-start' },
  tipIcon: { color: C.burgundy, fontSize: 17, fontWeight: '900' },
  tipText: { color: C.burgundy, fontSize: 11, lineHeight: 17, flex: 1, fontWeight: '600' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.65 },
});
