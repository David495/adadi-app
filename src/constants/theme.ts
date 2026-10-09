import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#24171B',
    background: '#FAF8F6',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F4E4E9',
    textSecondary: '#76666C',
    primary: '#8B1E3F',
    primaryDark: '#64152E',
    accent: '#D4A017',
    border: '#EAE1E3',
    muted: '#F4EEF0',
    success: '#26734D',
  },
  dark: {
    text: '#F9F2F4',
    background: '#171114',
    backgroundElement: '#241A1F',
    backgroundSelected: '#40232E',
    textSecondary: '#C3B1B8',
    primary: '#D85A7C',
    primaryDark: '#8B1E3F',
    accent: '#E7BD4D',
    border: '#3A2B31',
    muted: '#2D2026',
    success: '#69C998',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
