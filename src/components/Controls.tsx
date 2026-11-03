/** Small form controls: chips, segmented control, toggle row, rest picker, text field. */
import { useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { REST_PRESETS_S } from '@/domain/routineEditing';
import { formatClock } from '@/domain/timer';
import { colors, fonts, radius, space, touch, type as t } from '@/theme';

import { parseNumber } from './Stepper';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}

export function Chip({ label, selected, onPress, testID }: ChipProps): ReactElement {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && !selected && styles.pressed,
      ]}
    >
      <Text style={[t.labelSmall, { color: selected ? colors.onAccent : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

interface SegmentedProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  testID?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  testID,
}: SegmentedProps<T>): ReactElement {
  return (
    <View style={styles.segmented} testID={testID} accessibilityRole="radiogroup">
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            testID={testID ? `${testID}-${o.value}` : undefined}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, i > 0 && styles.segmentBorder, selected && styles.segmentOn]}
          >
            <Text
              numberOfLines={2}
              style={[
                t.labelSmall,
                styles.segmentText,
                { color: selected ? colors.onAccent : colors.text },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  testID?: string;
}

export function ToggleRow({ label, value, onChange, hint, testID }: ToggleProps): ReactElement {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.toggle}
    >
      <View style={{ flex: 1 }}>
        <Text style={[t.bodyStrong, { color: colors.text }]}>{label}</Text>
        {hint ? <Text style={[t.small, { color: colors.textSecondary }]}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.text}
        {...{ activeThumbColor: colors.text, activeTrackColor: colors.accent }}
        accessibilityLabel={label}
      />
    </Pressable>
  );
}

interface RestPickerProps {
  label: string;
  value: number;
  onChange: (s: number) => void;
  testID?: string;
}

/** Quick rest presets (30/60/90/120/180 s) plus a custom value. */
export function RestPicker({ label, value, onChange, testID }: RestPickerProps): ReactElement {
  const isPreset = (REST_PRESETS_S as readonly number[]).includes(value);
  const [custom, setCustom] = useState(!isPreset);
  const [text, setText] = useState(String(value));
  return (
    <View style={{ gap: space.sm }} testID={testID}>
      <View style={styles.restHead}>
        <Text style={[t.labelSmall, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={styles.restValue}>{formatClock(value)}</Text>
      </View>
      <View style={styles.restRow}>
        {REST_PRESETS_S.map((s) => (
          <Chip
            key={s}
            testID={testID ? `${testID}-${s}` : undefined}
            label={`${s}`}
            selected={!custom && value === s}
            onPress={() => {
              setCustom(false);
              onChange(s);
            }}
          />
        ))}
        <Chip
          testID={testID ? `${testID}-custom` : undefined}
          label="Otro"
          selected={custom}
          onPress={() => {
            setCustom(true);
            setText(String(value));
          }}
        />
      </View>
      {custom ? (
        <View style={styles.customRow}>
          <TextInput
            value={text}
            onChangeText={(v) => {
              setText(v);
              const n = parseNumber(v);
              if (n !== undefined) onChange(Math.round(n));
            }}
            keyboardType="number-pad"
            accessibilityLabel={`${label} en segundos`}
            testID={testID ? `${testID}-input` : undefined}
            style={[styles.field, { flex: 1 }]}
          />
          <Text style={[t.labelSmall, { color: colors.textSecondary }]}>SEGUNDOS</Text>
        </View>
      ) : null}
    </View>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  large?: boolean;
  multiline?: boolean;
  error?: string;
  maxLength?: number;
  testID?: string;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  large,
  multiline,
  error,
  maxLength = 60,
  testID,
}: FieldProps): ReactElement {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={[t.labelSmall, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        maxLength={maxLength}
        multiline={multiline}
        style={[
          styles.field,
          large && styles.fieldLarge,
          multiline && styles.fieldMulti,
          error ? styles.fieldError : null,
        ]}
      />
      {error ? <Text style={[t.small, { color: colors.accent }]}>{error}</Text> : null}
    </View>
  );
}

export function ProgressBar({
  progress,
  testID,
}: {
  progress: number;
  testID?: string;
}): ReactElement {
  const p = Math.min(1, Math.max(0, progress));
  return (
    <View
      testID={testID}
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(p * 100) }}
    >
      <View style={[styles.fill, { width: `${p * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    minWidth: 48,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  pressed: { backgroundColor: colors.surface2 },
  segmented: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border },
  segment: {
    flex: 1,
    minHeight: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xs,
  },
  segmentBorder: { borderLeftWidth: 1, borderLeftColor: colors.border },
  segmentOn: { backgroundColor: colors.accent },
  segmentText: { textAlign: 'center' },
  toggle: {
    minHeight: touch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
  },
  restHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  restValue: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  restRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  field: {
    minHeight: touch.min,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: space.md,
    fontFamily: fonts.text,
    fontSize: 16,
  },
  fieldLarge: { fontFamily: fonts.displayBold, fontSize: 26, minHeight: 64 },
  fieldMulti: { minHeight: 88, paddingTop: space.md, textAlignVertical: 'top' },
  fieldError: { borderColor: colors.accent },
  track: { height: 6, backgroundColor: colors.surface2, width: '100%' },
  fill: { height: 6, backgroundColor: colors.accent },
});
