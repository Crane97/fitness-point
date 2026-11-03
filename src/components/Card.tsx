import type { ReactElement, ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, space } from '@/theme';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  /** Buttons rendered below the content, outside the pressable area (no nested buttons). */
  actions?: ReactNode;
  /** Highlight with the accent (current / suggested item). */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export function Card({
  children,
  onPress,
  actions,
  active,
  style,
  testID,
  accessibilityLabel,
}: Props): ReactElement {
  return (
    <View testID={testID} style={[styles.card, active && styles.active, style]}>
      {active ? <View style={styles.bar} /> : null}
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          onPress={onPress}
          style={({ pressed }) => [styles.body, pressed && styles.pressed]}
        >
          {children}
        </Pressable>
      ) : (
        <View style={styles.body}>{children}</View>
      )}
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  body: { padding: space.lg, gap: space.sm },
  active: { borderColor: colors.accent },
  pressed: { backgroundColor: colors.surface2 },
  bar: {
    position: 'absolute',
    left: -1,
    top: -1,
    bottom: -1,
    width: 4,
    backgroundColor: colors.accent,
    zIndex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
    marginTop: -space.xl,
  },
});
