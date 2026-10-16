import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = { burgundy: '#8B1E3F', cream: '#FAF8F6', ink: '#24171B', muted: '#76666C', border: '#EAE1E3', white: '#FFFFFF', pink: '#F4E4E9' };
const STORAGE_KEY = '@adadi/expenses/v1';
const categories = ['Food', 'Transport', 'School', 'Personal', 'Other'] as const;
type ExpenseCategory = typeof categories[number];
type Expense = { id: string; title: string; amount: number; category: ExpenseCategory; date: string };
const money = (value: number) => '₦' + value.toLocaleString('en-NG', { maximumFractionDigits: 2 });
const localDate = () => {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
};

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!active || !stored) return;
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((item): item is Expense =>
            !!item && typeof item.id === 'string' && typeof item.title === 'string' &&
            typeof item.amount === 'number' && Number.isFinite(item.amount) && item.amount > 0 &&
            typeof item.date === 'string' && categories.includes(item.category)
          );
          setExpenses(valid);
        }
      } catch {
        if (active) setError('Could not read saved expenses. Please try reopening this screen.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const total = useMemo(() => expenses.reduce((sum, item) => sum + item.amount, 0), [expenses]);
  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    return expenses.reduce((sum, item) => {
      const date = new Date(item.date + 'T12:00:00');
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() ? sum + item.amount : sum;
    }, 0);
  }, [expenses]);

  const persist = useCallback(async (next: Expense[]) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setExpenses(next);
      setNotice('Saved on this device.');
      return true;
    } catch {
      setError('Could not save this change. Check your phone storage and try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const addExpense = async () => {
    if (saving) return;
    const cleanTitle = title.trim();
    const parsedAmount = Number(amount.replace(/,/g, '').trim());
    if (!cleanTitle) { setError('Enter what you spent money on.'); return; }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) { setError('Enter an amount greater than ₦0.'); return; }
    const item: Expense = {
      id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
      title: cleanTitle.slice(0, 80),
      amount: Math.round(parsedAmount * 100) / 100,
      category,
      date: localDate(),
    };
    if (await persist([item, ...expenses])) {
      setTitle('');
      setAmount('');
    }
  };

  const removeExpense = async (id: string) => {
    if (saving) return;
    await persist(expenses.filter(item => item.id !== id));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>YOUR MONEY, IN ONE PLACE</Text>
        <Text style={styles.title}>Expense tracker</Text>
        <Text style={styles.subtitle}>Keep track of your spending while you navigate campus life.</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>THIS MONTH</Text>
            <Text style={styles.summaryAmount}>{money(thisMonthTotal)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardLight]}>
            <Text style={styles.summaryLabel}>ALL RECORDED</Text>
            <Text style={[styles.summaryAmount, styles.summaryAmountDark]}>{money(total)}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Add an expense</Text>
          <Text style={styles.fieldLabel}>What did you spend on?</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Lunch, printing, transport" placeholderTextColor="#93848A" style={styles.input} maxLength={80} returnKeyType="next" />
          <Text style={styles.fieldLabel}>Amount (₦)</Text>
          <TextInput value={amount} onChangeText={value => setAmount(value.replace(/[^0-9.,]/g, ''))} placeholder="e.g. 1500" placeholderTextColor="#93848A" style={styles.input} keyboardType="decimal-pad" returnKeyType="done" />
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.categoryRow}>
            {categories.map(item => (
              <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, category === item && styles.categoryChipActive]} accessibilityRole="button" accessibilityState={{ selected: category === item }}>
                <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => void addExpense()} disabled={saving || loading} style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonDim, (saving || loading) && styles.buttonDisabled]} accessibilityRole="button">
            {saving ? <ActivityIndicator color={C.white} /> : <Text style={styles.primaryButtonText}>Save expense</Text>}
          </Pressable>
          <Text style={styles.localNote}>Saved on this phone only. Expenses are not synced to your ADADI account or other devices.</Text>
        </View>

        {!!error && <View style={styles.messageError}><Text style={styles.messageText}>{error}</Text></View>}
        {!!notice && !error && <Text style={styles.notice}>{notice}</Text>}

        <View style={styles.listHeader}>
          <Text style={styles.cardTitle}>Recent expenses</Text>
          {!loading && <Text style={styles.count}>{expenses.length} entries</Text>}
        </View>
        {loading ? (
          <View style={styles.emptyCard}><ActivityIndicator color={C.burgundy} /><Text style={styles.emptyText}>Loading your expenses…</Text></View>
        ) : expenses.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyEmoji}>🧾</Text><Text style={styles.emptyTitle}>Nothing recorded yet</Text><Text style={styles.emptyText}>Add your first expense above and your totals will update automatically.</Text></View>
        ) : (
          <View style={styles.expenseList}>
            {expenses.map(item => (
              <View key={item.id} style={styles.expenseItem}>
                <View style={styles.expenseIcon}><Text style={styles.expenseIconText}>{item.category === 'Food' ? '🍲' : item.category === 'Transport' ? '🚌' : item.category === 'School' ? '📚' : item.category === 'Personal' ? '🧴' : '🧾'}</Text></View>
                <View style={styles.expenseCopy}>
                  <Text style={styles.expenseTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.expenseMeta}>{item.category} · {item.date}</Text>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>{money(item.amount)}</Text>
                  <Pressable onPress={() => void removeExpense(item.id)} disabled={saving} accessibilityRole="button" accessibilityLabel={'Delete ' + item.title} hitSlop={8}><Text style={styles.deleteText}>Delete</Text></Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  content: { padding: 20, paddingTop: 16, paddingBottom: 40, gap: 15, maxWidth: 760, width: '100%', alignSelf: 'center' },
  kicker: { color: C.burgundy, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: C.ink, fontSize: 30, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 20, marginTop: -7 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, minWidth: 0, backgroundColor: C.burgundy, borderRadius: 18, padding: 15, gap: 8 },
  summaryCardLight: { backgroundColor: '#F1E5E9', borderWidth: 1, borderColor: '#E8D4DB' },
  summaryLabel: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  summaryAmount: { color: C.white, fontSize: 18, fontWeight: '900' },
  summaryAmountDark: { color: C.burgundy },
  fieldLabel: { color: C.ink, fontSize: 11, fontWeight: '800', marginTop: 3 },
  formCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 17, gap: 10 },
  cardTitle: { color: C.ink, fontSize: 16, fontWeight: '900' },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, color: C.ink, backgroundColor: C.cream, fontSize: 13 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 2 },
  categoryChip: { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: C.cream },
  categoryChipActive: { backgroundColor: C.burgundy, borderColor: C.burgundy },
  categoryText: { color: C.muted, fontSize: 10, fontWeight: '700' },
  categoryTextActive: { color: C.white },
  primaryButton: { backgroundColor: C.burgundy, borderRadius: 13, minHeight: 46, alignItems: 'center', justifyContent: 'center', padding: 12, marginTop: 4 },
  primaryButtonText: { color: C.white, fontSize: 12, fontWeight: '900' },
  buttonDim: { opacity: 0.8 },
  buttonDisabled: { opacity: 0.55 },
  localNote: { color: C.muted, fontSize: 10, lineHeight: 15 },
  messageError: { backgroundColor: '#FCE8E8', borderRadius: 12, padding: 12 },
  messageText: { color: '#8B1E3F', fontSize: 11, lineHeight: 16 },
  notice: { color: C.muted, fontSize: 10 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  count: { color: C.muted, fontSize: 10, fontWeight: '700' },
  emptyCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 22, alignItems: 'center', gap: 9 },
  emptyEmoji: { fontSize: 28 },
  emptyTitle: { color: C.ink, fontSize: 14, fontWeight: '900' },
  emptyText: { color: C.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  expenseList: { gap: 9 },
  expenseItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 12 },
  expenseIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center' },
  expenseIconText: { fontSize: 19 },
  expenseCopy: { flex: 1, minWidth: 0, gap: 4 },
  expenseTitle: { color: C.ink, fontSize: 12, fontWeight: '800' },
  expenseMeta: { color: C.muted, fontSize: 10 },
  expenseRight: { alignItems: 'flex-end', gap: 5 },
  expenseAmount: { color: C.burgundy, fontSize: 12, fontWeight: '900' },
  deleteText: { color: '#9A3B48', fontSize: 10, fontWeight: '800' },
});
