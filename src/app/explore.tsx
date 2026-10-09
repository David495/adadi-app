import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = { burgundy: '#8B1E3F', cream: '#FAF8F6', ink: '#24171B', muted: '#76666C', border: '#EAE1E3', white: '#FFFFFF', pink: '#F4E4E9' };
const categories = ['All', 'Food & drinks', 'Barbers & beauty', 'Fashion', 'Accommodation'];

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const [search, setSearch] = useState(params.q ?? '');
  const [category, setCategory] = useState(params.category ?? 'All');

  useEffect(() => {
    if (params.q) setSearch(params.q);
    if (params.category) setCategory(params.category);
  }, [params.q, params.category]);

  const activeCategory = categories.includes(category) ? category : 'All';
  const summary = useMemo(() => {
    const term = search.trim();
    if (term) return 'Showing the search setup for “' + term + '”.';
    if (activeCategory !== 'All') return 'Browse businesses in ' + activeCategory.toLowerCase() + '.';
    return 'Explore services and shops around your campus.';
  }, [search, activeCategory]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹  Back</Text></Pressable>
        <Text style={styles.kicker}>THE CAMPUS DIRECTORY</Text>
        <Text style={styles.title}>Explore ADADI</Text>
        <Text style={styles.subtitle}>Find a business, service or product around the DUFUHS community.</Text>
        <View style={styles.searchWrap}>
          <Text style={styles.searchGlyph}>⌕</Text>
          <TextInput value={search} onChangeText={setSearch} placeholder="What are you looking for?" placeholderTextColor="#93848A" returnKeyType="search" style={styles.searchInput} accessibilityLabel="Search listings" />
          {search.length > 0 && <Pressable onPress={() => setSearch('')} accessibilityRole="button"><Text style={styles.clear}>×</Text></Pressable>}
        </View>
        <Text style={styles.sectionLabel}>CATEGORIES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categories.map(item => (
            <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, activeCategory === item && styles.chipActive]} accessibilityRole="button" accessibilityState={{ selected: activeCategory === item }}>
              <Text style={[styles.chipText, activeCategory === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}><Text style={styles.infoEmoji}>✦</Text></View>
          <Text style={styles.infoTitle}>Your campus, one marketplace.</Text>
          <Text style={styles.infoBody}>{summary}</Text>
          <View style={styles.divider} />
          <Text style={styles.statusLabel}>LIVE LISTINGS CONNECTION</Text>
          <Text style={styles.statusTitle}>Coming in the next setup step</Text>
          <Text style={styles.statusBody}>This screen is ready for the Supabase connection. We’ll load real business data in small pages and cache results to keep mobile data usage low.</Text>
        </View>
        <View style={styles.tip}><Text style={styles.tipIcon}>◉</Text><Text style={styles.tipText}>Data-saving by design: listings will load in batches, and images will only load when needed.</Text></View>
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
  infoCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 24, padding: 20, marginTop: 4, gap: 10 },
  infoIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center' },
  infoEmoji: { color: C.burgundy, fontSize: 24, fontWeight: '900' },
  infoTitle: { color: C.ink, fontSize: 18, fontWeight: '900', marginTop: 3 },
  infoBody: { color: C.muted, fontSize: 12, lineHeight: 18 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 5 },
  statusLabel: { color: C.burgundy, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  statusTitle: { color: C.ink, fontSize: 14, fontWeight: '800' },
  statusBody: { color: C.muted, fontSize: 11, lineHeight: 18 },
  tip: { flexDirection: 'row', gap: 10, backgroundColor: '#F1E5E9', borderRadius: 16, padding: 14, alignItems: 'flex-start' },
  tipIcon: { color: C.burgundy, fontSize: 17, fontWeight: '900' },
  tipText: { color: C.burgundy, fontSize: 11, lineHeight: 17, flex: 1, fontWeight: '600' },
});
