import type { ReactNode } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { colors, type as t } from '@/theme';

interface Props {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  color?: string;
  numberOfLines?: number;
  testID?: string;
}

export function Label({
  children,
  style,
  color = colors.textSecondary,
  numberOfLines,
  testID,
}: Props) {
  return (
    <Text testID={testID} numberOfLines={numberOfLines} style={[t.label, { color }, style]}>
      {children}
    </Text>
  );
}

export function Title({ children, style, color = colors.text, numberOfLines, testID }: Props) {
  return (
    <Text
      testID={testID}
      accessibilityRole="header"
      numberOfLines={numberOfLines}
      style={[t.title, { color }, style]}
    >
      {children}
    </Text>
  );
}

export function Heading({ children, style, color = colors.text, numberOfLines, testID }: Props) {
  return (
    <Text testID={testID} numberOfLines={numberOfLines} style={[t.heading, { color }, style]}>
      {children}
    </Text>
  );
}

export function Body({ children, style, color = colors.text, numberOfLines, testID }: Props) {
  return (
    <Text testID={testID} numberOfLines={numberOfLines} style={[t.body, { color }, style]}>
      {children}
    </Text>
  );
}

export function Small({
  children,
  style,
  color = colors.textSecondary,
  numberOfLines,
  testID,
}: Props) {
  return (
    <Text testID={testID} numberOfLines={numberOfLines} style={[t.small, { color }, style]}>
      {children}
    </Text>
  );
}

export const textStyles = StyleSheet.create({ tabular: { fontVariant: ['tabular-nums'] } });
