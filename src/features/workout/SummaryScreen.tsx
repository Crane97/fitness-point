import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Heading, Label, Small, Title } from '@/components/Text';
import { formatElapsed } from '@/domain/dates';
import { formatThousands } from '@/domain/format';
import {
  completedSetCount,
  formatSet,
  improvements,
  totalPlannedSets,
  workoutVolume,
} from '@/domain/history';
import { useApp } from '@/store';
import { colors, fonts, space } from '@/theme';

import { setDone } from './model';

export function SummaryScreen(): ReactElement | null {
  const active = useApp((s) => s.active);
  const history = useApp((s) => s.history);
  const save = useApp((s) => s.saveWorkout);
  if (!active || active.machine.phase.type !== 'finished') return null;
  const w = active.machine.workout;
  const ups = improvements(w, history);
  const duration = (w.finishedAt ?? w.startedAt) - w.startedAt;

  return (
    <Screen
      testID="screen-summary"
      footer={
        <Button
          label="Guardar y salir"
          variant="primary"
          size="hero"
          onPress={save /* the session controller navigates home */}
          testID="save-exit"
        />
      }
    >
      <View style={{ gap: space.xs, marginTop: space.lg }}>
        <Label color={colors.accent}>Sesión completada</Label>
        <Title>{w.sessionName}</Title>
        <Small>{w.routineName}</Small>
      </View>

      <View style={styles.stats}>
        <Stat label="Duración" value={formatElapsed(duration)} testID="stat-duration" />
        <Stat
          label="Series"
          value={`${completedSetCount(w)}/${totalPlannedSets(w)}`}
          testID="stat-sets"
        />
      </View>
      <Stat
        label="Volumen total"
        value={`${formatThousands(workoutVolume(w))} kg`}
        big
        testID="stat-volume"
      />

      <View style={{ gap: space.sm }} testID="improvements">
        <Label>Mejoras respecto a la última vez</Label>
        {ups.length === 0 ? (
          <Small>Sin mejoras esta vez. La constancia también cuenta.</Small>
        ) : (
          ups.map((u) => (
            <View key={u.exerciseId} style={styles.up}>
              <View style={styles.upBar} />
              <View style={{ flex: 1, gap: 2 }}>
                <Heading numberOfLines={1} style={styles.upName}>
                  {u.name}
                </Heading>
                <Text style={styles.upValue}>
                  <Text style={{ color: colors.textSecondary }}>{formatSet(u.previous)}</Text>
                  <Text style={{ color: colors.accent }}> → </Text>
                  {formatSet(u.current)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={{ gap: space.sm }}>
        <Label>Detalle</Label>
        {w.exercises.map((e, i) => (
          <View key={i} style={styles.detail}>
            <Small color={colors.text} numberOfLines={1}>
              {e.name}
            </Small>
            <Small numberOfLines={2}>
              {e.sets
                .filter((s) => !s.skipped)
                .map(setDone)
                .join(' · ') || 'Saltado'}
            </Small>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function Stat({
  label,
  value,
  big,
  testID,
}: {
  label: string;
  value: string;
  big?: boolean;
  testID?: string;
}) {
  return (
    <View style={big ? styles.statBig : styles.stat} testID={testID}>
      <Label>{label}</Label>
      <Text
        style={[styles.statValue, big && styles.statValueBig]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: space.md },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: space.lg,
    gap: space.xs,
  },
  statBig: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: space.lg,
    gap: space.xs,
  },
  statValue: {
    fontFamily: fonts.displayBold,
    fontSize: 36,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  statValueBig: { fontSize: 56, lineHeight: 62 },
  up: {
    flexDirection: 'row',
    gap: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    backgroundColor: colors.surface,
  },
  upBar: { width: 4, backgroundColor: colors.accent },
  upName: { fontSize: 16, lineHeight: 20 },
  upValue: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  detail: {
    flexDirection: 'row',
    gap: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: space.sm,
  },
});
