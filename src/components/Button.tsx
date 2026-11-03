import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { tapFeedback } from '@/services/haptics';
import { colors, space, touch, type as t } from '@/theme';

import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'md' | 'lg' | 'hero';
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityHint?: string;
}

/** Square button. Primary = accent (only for the main action on a screen). */
export function Button({
  label,
  onPress,
  variant = 'secondary',
  size = 'md',
  icon,
  disabled,
  style,
  testID,
  accessibilityHint,
}: Props): ReactElement {
  const fg =
    variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.accent : colors.text;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        size === 'hero' ? styles.hero : size === 'lg' ? styles.lg : styles.md,
        styles[variant],
        pressed && (variant === 'primary' ? styles.primaryPressed : styles.pressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.row}>
        {icon ? <Icon name={icon} color={fg} size={size === 'hero' ? 28 : 20} /> : null}
        <Text numberOfLines={1} style={[size === 'hero' ? t.buttonHero : t.button, { color: fg }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

interface IconButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  size?: number;
  disabled?: boolean;
  color?: string;
  bordered?: boolean;
  testID?: string;
}

/** Square icon-only button with an accessibility label. */
export function IconButton({
  icon,
  label,
  onPress,
  size = 44,
  disabled,
  color = colors.text,
  bordered = false,
  testID,
}: IconButtonProps): ReactElement {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.icon,
        { width: size, height: size },
        bordered && styles.iconBordered,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Icon name={icon} color={color} size={Math.min(24, size - 16)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  md: { minHeight: touch.min },
  lg: { minHeight: touch.large },
  hero: { minHeight: touch.hero },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  secondary: { backgroundColor: colors.bg, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  danger: { backgroundColor: colors.bg, borderColor: colors.border },
  pressed: { backgroundColor: colors.surface2 },
  primaryPressed: { opacity: 0.85 },
  disabled: { opacity: 0.35 },
  icon: { alignItems: 'center', justifyContent: 'center', borderRadius: 0 },
  iconBordered: { borderWidth: 1, borderColor: colors.border },
});
