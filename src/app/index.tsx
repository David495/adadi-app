import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
  burgundy: '#8B1E3F',
  burgundyDark: '#64152E',
  cream: '#FAF8F6',
  gold: '#D4A017',
  ink: '#24171B',
  muted: '#76666C',
  border: '#EAE1E3',
  white: '#FFFFFF',
};

const categories = [
  { emoji: '🍲', title: 'Food & drinks', subtitle: 'Meals, snacks and more' },
  { emoji: '💈', title: 'Barbers & beauty', subtitle: 'Fresh cuts and self-care' },
  { emoji: '👕', title: 'Fashion', subtitle: 'Clothes and accessories' },
  { emoji: '🏠', title: 'Accommodation', subtitle: 'Places to stay' },
];

export default function HomeScreen() {
  const [search, setSearch] = useState('');

  const openSearch = () => {
    router.push({ pathname: '/products', params: search.trim() ? { q: search.trim() } : {} });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>A</Text></View>
          <View style={styles.brandCopy}>
            <Text style={styles.brand}>ADADI</Text>
            <Text style={styles.tagline}>YOUR CAMPUS MARKETPLACE</Text>
          </View>
          <View style={styles.campusPill}><View style={styles.liveDot} /><Text style={styles.campusText}>DUFUHS</Text></View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <Text style={styles.eyebrow}>CAMPUS LIFE, MADE EASIER</Text>
          <Text style={styles.heroTitle}>Find what you need.{ '\n' }Support local.</Text>
          <Text style={styles.heroBody}>Discover campus businesses, explore what they offer, and make your next move with ADADI.</Text>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={openSearch}
              placeholder="Search products or businesses..."
              placeholderTextColor="#93848A"
              returnKeyType="search"
              style={styles.searchInput}
              accessibilityLabel="Search products or businesses"
            />
            <Pressable onPress={openSearch} style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Search">
              <Text style={styles.searchButtonText}>Go</Text>
            </Pressable>
          </View>
          <View style={styles.heroFoot}><Text style={styles.heroFootText}>📍 Built for the DUFUHS community</Text><Text style={styles.heroFootText}>✦ Simple. Local. Useful.</Text></View>
        </View>

        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>Explore categories</Text><Text style={styles.sectionSubtitle}>A little bit of everything, close to you.</Text></View>
          <Pressable onPress={() => router.push('/explore')} accessibilityRole="button"><Text style={styles.seeAll}>See all ↗</Text></Pressable>
        </View>

        <Pressable onPress={() => router.push('/products')} style={({ pressed }) => [styles.productsCta, pressed && styles.pressed]} accessibilityRole="button">
          <View><Text style={styles.productsCtaTitle}>Shop campus products</Text><Text style={styles.productsCtaBody}>Compare prices and find your color.</Text></View>
          <Text style={styles.productsCtaArrow}>↗</Text>
        </Pressable>

        <View style={styles.categoryGrid}>
          {categories.map((category, index) => (
            <Pressable
              key={category.title}
              onPress={() => router.push({ pathname: '/explore', params: { category: category.title } })}
              style={({ pressed }) => [styles.categoryCard, index % 2 === 0 && styles.categoryCardTint, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={'Explore ' + category.title}
            >
              <View style={styles.categoryIcon}><Text style={styles.categoryEmoji}>{category.emoji}</Text></View>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
              <Text style={styles.categoryArrow}>↗</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.featurePanel}>
          <View style={styles.featureIcon}><Text style={styles.featureIconText}>✦</Text></View>
          <View style={styles.featureCopy}>
            <Text style={styles.featureTitle}>Own a campus business?</Text>
            <Text style={styles.featureBody}>Get ready to bring your business closer to the people who need it.</Text>
            <Pressable onPress={() => router.push('/account')} style={({ pressed }) => [styles.featureLink, pressed && styles.pressed]} accessibilityRole="button">
              <Text style={styles.featureLinkText}>Business access <Text style={styles.featureLinkArrow}>→</Text></Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}><Text style={styles.footerBrand}>ADADI</Text><Text style={styles.footerText}>Discover. Shop. Sell.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 36, gap: 25, maxWidth: 760, width: '100%', alignSelf: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.burgundy, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: C.white, fontSize: 25, fontWeight: '900' },
  brandCopy: { gap: 2 },
  brand: { color: C.burgundy, fontSize: 19, fontWeight: '900', letterSpacing: 2 },
  tagline: { color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  campusPill: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1E6E9', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.burgundy },
  campusText: { color: C.burgundy, fontWeight: '800', fontSize: 10, letterSpacing: 0.7 },
  hero: { backgroundColor: C.burgundy, borderRadius: 28, padding: 22, overflow: 'hidden', gap: 13 },
  heroGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: '#A93B5B', right: -75, top: -90, opacity: 0.55 },
  eyebrow: { color: '#F0D7DE', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  heroTitle: { color: C.white, fontSize: 33, lineHeight: 38, fontWeight: '900', letterSpacing: -0.8 },
  heroBody: { color: '#F3E4E8', fontSize: 13, lineHeight: 20, maxWidth: 320 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 15, paddingLeft: 13, paddingRight: 5, minHeight: 52, gap: 7, marginTop: 4 },
  searchIcon: { fontSize: 25, color: C.burgundy, marginTop: -3 },
  searchInput: { flex: 1, minWidth: 0, color: C.ink, fontSize: 12, paddingVertical: 10 },
  searchButton: { backgroundColor: C.burgundyDark, borderRadius: 11, paddingHorizontal: 17, paddingVertical: 13 },
  searchButtonText: { color: C.white, fontSize: 12, fontWeight: '800' },
  heroFoot: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 7, marginTop: 2 },
  heroFootText: { color: '#E8C9D2', fontSize: 9, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: C.ink, fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  sectionSubtitle: { color: C.muted, fontSize: 11, marginTop: 4 },
  seeAll: { color: C.burgundy, fontSize: 11, fontWeight: '800' },
  productsCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 17, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  productsCtaTitle: { color: C.burgundy, fontSize: 13, fontWeight: '900' },
  productsCtaBody: { color: C.muted, fontSize: 10, marginTop: 4 },
  productsCtaArrow: { color: C.burgundy, fontSize: 21, fontWeight: '900' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: { width: '48%', flexGrow: 1, flexBasis: '42%', minHeight: 155, backgroundColor: C.white, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: C.border, gap: 7 },
  categoryCardTint: { backgroundColor: '#F8EFF2' },
  categoryIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  categoryEmoji: { fontSize: 21 },
  categoryTitle: { color: C.ink, fontSize: 13, fontWeight: '800' },
  categorySubtitle: { color: C.muted, fontSize: 10, lineHeight: 15 },
  categoryArrow: { position: 'absolute', right: 14, top: 14, color: C.burgundy, fontSize: 14, fontWeight: '800' },
  featurePanel: { flexDirection: 'row', gap: 14, padding: 18, borderRadius: 22, backgroundColor: '#F1E5E9', borderWidth: 1, borderColor: '#E8D4DB' },
  featureIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.burgundy, alignItems: 'center', justifyContent: 'center' },
  featureIconText: { color: C.gold, fontSize: 24, fontWeight: '900' },
  featureCopy: { flex: 1, gap: 6 },
  featureTitle: { color: C.burgundyDark, fontSize: 15, fontWeight: '900' },
  featureBody: { color: C.muted, fontSize: 11, lineHeight: 17 },
  featureLink: { alignSelf: 'flex-start', paddingTop: 3 },
  featureLinkText: { color: C.burgundy, fontSize: 11, fontWeight: '900' },
  featureLinkArrow: { fontSize: 15 },
  footer: { alignItems: 'center', gap: 4, paddingTop: 4 },
  footerBrand: { color: C.burgundy, fontSize: 10, fontWeight: '900', letterSpacing: 3 },
  footerText: { color: C.muted, fontSize: 10 },
  pressed: { opacity: 0.75 },
});
