import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, MaxContentWidth } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild><TabButton>Home</TabButton></TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild><TabButton>Explore</TabButton></TabTrigger>
          <TabTrigger name="messages" href="/messages" asChild><TabButton>Messages</TabButton></TabTrigger>
          <TabTrigger name="account" href="/account" asChild><TabButton>Account</TabButton></TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabPressable, pressed && styles.pressed]}>
      <ThemedView style={[styles.tabButton, isFocused && styles.tabButtonActive]}>
        <ThemedText style={[styles.tabText, { color: isFocused ? Colors.light.primary : Colors.light.textSecondary }]}>{children}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView style={styles.innerContainer}>
        <ThemedText style={styles.brandText}>ADADI</ThemedText>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: { position: 'absolute', bottom: 0, width: '100%', padding: 12, alignItems: 'center' },
  innerContainer: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', gap: 4, width: '100%', maxWidth: MaxContentWidth, backgroundColor: Colors.light.backgroundElement, borderWidth: 1, borderColor: Colors.light.border, elevation: 8 },
  brandText: { color: Colors.light.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginHorizontal: 8 },
  tabPressable: { flexGrow: 1, alignItems: 'center' },
  tabButton: { borderRadius: 20, paddingVertical: 10, paddingHorizontal: 10 },
  tabButtonActive: { backgroundColor: Colors.light.backgroundSelected },
  tabText: { fontSize: 11, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
