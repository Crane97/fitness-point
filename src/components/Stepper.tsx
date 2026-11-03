import { useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatKg } from '@/domain/format';
import { tapFeedback } from '@/services/haptics';
import { colors, fonts, radius, space, touch, type as t } from '@/theme';

import { Icon } from './Icon';

interface Props {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  step: number;
  min?: number;
  max?: number;
  /** Values are rounded to this quantum when typed (e.g. 0.5 kg). */
  quantum?: number;
  unit?: string;
  /** Text shown when the value is empty (e.g. "Peso corporal"). Enables empty values. */
  emptyLabel?: string;
  size?: 'md' | 'lg';
  testID?: string;
}

/** Shrinks long values ("102,5") so they never clip between the buttons. */
function valueSize(text: string, size: 'md' | 'lg'): number {
  const base = size === 'lg' ? 40 : 30;
  if (text.length <= 2) return base;
  if (text.length <= 4) return Math.round(base * 0.8);
  return Math.round(base * 0.66);
}

export function parseNumber(text: string): number | undefined {
  const n = Number(text.replace(',', '.').trim());
  return text.trim() === '' || !Number.isFinite(n) ? undefined : n;
}

/** Big −/+ stepper. Tapping the number opens the numeric keyboard. */
export function Stepper({
  label,
  value,
  onChange,
  step,
  min = 0,
  max = 999,
  quantum = step,
  unit,
  emptyLabel,
  size = 'md',
  testID,
}: Props): ReactElement {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const round = (v: number) => Math.round(v / quantum) * quantum;
  const display = value === undefined ? (emptyLabel ?? '—') : formatKg(value);
  const btn = size === 'lg' ? touch.large : touch.min;

  const bump = (dir: 1 | -1) => {
    tapFeedback();
    if (value === undefined) {
      if (dir > 0) onChange(clamp(step));
      return;
    }
    const next = round(value + dir * step);
    if (emptyLabel && next <= 0 && dir < 0) onChange(undefined);
    else onChange(clamp(next));
  };

  const commit = () => {
    setEditing(false);
    const n = parseNumber(text);
    if (n === undefined || n === 0) onChange(emptyLabel ? undefined : clamp(min));
    else onChange(clamp(round(n)));
  };

  return (
    <View style={styles.root} testID={testID}>
      <Text style={[t.labelSmall, styles.label]}>{label}</Text>
      <View style={[styles.row, { height: btn }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Restar ${formatKg(step)} ${unit ?? ''}`.trim()}
          testID={testID ? `${testID}-minus` : undefined}
          onPress={() => bump(-1)}
          style={({ pressed }) => [styles.btn, { width: btn }, pressed && styles.pressed]}
        >
          <Icon name="minus" size={24} />
        </Pressable>
        {editing ? (
          <TextInput
            autoFocus
            value={text}
            onChangeText={(v) => {
              setText(v);
              // Commit valid values while typing: tapping HECHO may not blur the input (iOS).
              const n = parseNumber(v);
              if (n !== undefined && n >= min && n <= max && n !== 0) onChange(round(n));
            }}
            onBlur={commit}
            onSubmitEditing={commit}
            keyboardType="decimal-pad"
            returnKeyType="done"
            selectTextOnFocus
            accessibilityLabel={label}
            testID={testID ? `${testID}-input` : undefined}
            style={[styles.value, styles.input, size === 'lg' && styles.valueLg]}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${display} ${value === undefined ? '' : (unit ?? '')}. Toca para escribir`}
            testID={testID ? `${testID}-value` : undefined}
            onPress={() => {
              setText(value === undefined ? '' : String(value).replace('.', ','));
              setEditing(true);
            }}
            style={styles.center}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.value,
                { fontSize: valueSize(display, size) },
                value === undefined && styles.empty,
              ]}
            >
              {display}
            </Text>
            {unit && value !== undefined ? <Text style={styles.unit}>{unit}</Text> : null}
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sumar ${formatKg(step)} ${unit ?? ''}`.trim()}
          testID={testID ? `${testID}-plus` : undefined}
          onPress={() => bump(1)}
          style={({ pressed }) => [styles.btn, { width: btn }, pressed && styles.pressed]}
        >
          <Icon name="plus" size={24} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: space.xs },
  label: { color: colors.textSecondary },
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  btn: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2 },
  pressed: { backgroundColor: colors.border },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 6,
  },
  value: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  valueLg: { fontSize: 40 },
  empty: { fontFamily: fonts.textSemi, fontSize: 14, color: colors.textSecondary },
  unit: { ...t.labelSmall, color: colors.textSecondary },
  input: { flex: 1, borderRadius: radius.input, padding: 0, backgroundColor: colors.bg },
});
