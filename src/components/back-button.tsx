import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

type BackButtonProps = {
  fallback?: string;
  label?: string;
};

const C = {
  burgundy: '#8B1E3F',
  cream: '#FAF8F6',
  border: '#EAE1E3',
  muted: '#76666C',
};

export default function BackButton({ fallback = '/', label = 'Back' }: BackButtonProps) {
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();

  const goBack = () => {
    const returnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
    const destination = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : fallback;

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(destination as never);
    }
  };

  return (
    <Pressable
      onPress={goBack}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.arrow}>‹</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 6,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cream,
    justifyContent: 'center',
  },
  arrow: {
    color: C.burgundy,
    fontSize: 25,
    lineHeight: 27,
    marginTop: -2,
  },
  label: {
    color: C.burgundy,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.65,
    backgroundColor: '#F1E5E9',
  },
});
