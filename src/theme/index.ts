/** Design tokens: elegant, serious and square. One accent, no radius, no shadows. */
import type { TextStyle } from 'react-native';

export const colors = {
  bg: '#000000',
  surface: '#0D0D0D',
  surface2: '#161616',
  border: '#262626',
  text: '#FFFFFF',
  textSecondary: '#8A8A8A',
  textMuted: '#4D4D4D',
  accent: '#FF3B1F',
  onAccent: '#000000',
  danger: '#FF3B1F',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { none: 0, input: 2 } as const;

export const border = { width: 1 } as const;

/** Minimum touch target for in-session actions. */
export const touch = { min: 56, large: 72, hero: 88 } as const;

export const fonts = {
  text: 'Inter_400Regular',
  textMedium: 'Inter_500Medium',
  textSemi: 'Inter_600SemiBold',
  textBold: 'Inter_700Bold',
  display: 'InterTight_600SemiBold',
  displayBold: 'InterTight_700Bold',
  displayHeavy: 'InterTight_800ExtraBold',
} as const;

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

export const type = {
  hero: {
    fontFamily: fonts.displayBold,
    fontSize: 112,
    lineHeight: 116,
    fontVariant: tabular,
    letterSpacing: -4,
  },
  display: {
    fontFamily: fonts.displayBold,
    fontSize: 64,
    lineHeight: 68,
    fontVariant: tabular,
    letterSpacing: -2,
  },
  number: {
    fontFamily: fonts.displayBold,
    fontSize: 40,
    lineHeight: 44,
    fontVariant: tabular,
    letterSpacing: -1,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 34, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.textSemi, fontSize: 20, lineHeight: 26 },
  body: { fontFamily: fonts.text, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.textSemi, fontSize: 16, lineHeight: 22 },
  small: { fontFamily: fonts.text, fontSize: 14, lineHeight: 19 },
  label: {
    fontFamily: fonts.textSemi,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  labelSmall: {
    fontFamily: fonts.textSemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  buttonHero: {
    fontFamily: fonts.displayHeavy,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 5,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

/** Illustration constants: shared viewBox and stroke for every exercise drawing. */
export const illustration = {
  viewBox: '0 0 120 120',
  size: 120,
  stroke: 3,
  muscleStroke: 5,
} as const;
