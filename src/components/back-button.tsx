import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

const C = {
  burgundy: '#8B1E3F',
  cream: '#FAF8F6',
  border: '#EAE1E3',
};

export default function BackButton() {
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <Pressable
      onPress={goBack}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>‹ Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 4,
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.cream,
    justifyContent: 'center',
  },
  label: {
    color: C.burgundy,
    fontSize: 12,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.7,
  },
});
