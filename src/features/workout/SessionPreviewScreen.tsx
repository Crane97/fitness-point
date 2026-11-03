import { Redirect, router, useLocalSearchParams } from 'expo-router';
import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Heading, Label, Small, Title } from '@/components/Text';
import { formatSet, lastPerformance, topSet } from '@/domain/history';
import { estimateSessionDurationS, formatDuration } from '@/domain/planning';
import { ExerciseIllustration } from '@/illustrations/ExerciseIllustration';
import { useApp } from '@/store';
import { useCatalog } from '@/store/selectors';
import { colors, fonts, space } from '@/theme';

import { describeSets } from '../routines/describe';

export function SessionPreviewScreen(): ReactElement {
  const { routineId, sessionId } = useLocalSearchParams<{ routineId: string; sessionId: string }>();
  const routine = useApp((s) => s.routines.find((r) => r.id === routineId));
  const history = useApp((s) => s.history);
  const active = useApp((s) => s.active);
  const start = useApp((s) => s.startWorkout);
  const { byId } = useCatalog();
  const session = routine?.sessions.find((s) => s.id === sessionId);
  if (!routine || !session) return <Redirect href="/entrenar" />;

  const sets = session.exercises.reduce((n, e) => n + e.sets.length, 0);

  return (
    <Screen
      header={routine.name}
      back
      testID="screen-preview"
      footer={
        <>
          {active ? (
            <Small color={colors.accent}>
              Ya tienes una sesión en curso: al comenzar se descartará.
            </Small>
          ) : null}
          <Button
            label="Comenzar"
            variant="primary"
            size="hero"
            disabled={session.exercises.length === 0}
            onPress={() => {
              if (start(routine.id, session.id)) router.replace('/sesion/activa');
            }}
            testID="start"
          />
        </>
      }
    >
      <Title>{session.name}</Title>
      <View style={styles.stats}>
        <Stat label="Ejercicios" value={String(session.exercises.length)} />
        <Stat label="Series" value={String(sets)} />
        <Stat label="Duración" value={formatDuration(estimateSessionDurationS(session))} />
      </View>
      <View>
        {session.exercises.map((e, i) => {
          const ex = byId[e.exerciseId];
          const last = lastPerformance(history, e.exerciseId);
          const top = last ? topSet(last.sets) : null;
          return (
            <View key={e.id} style={styles.row} testID={`preview-exercise-${i}`}>
              <View style={styles.thumb}>
                <ExerciseIllustration
                  illustrationKey={ex?.illustrationKey ?? 'generic-core'}
                  primaryMuscle={ex?.primaryMuscle ?? 'core'}
                  secondaryMuscles={ex?.secondaryMuscles}
                  size={60}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Heading numberOfLines={1} style={styles.name}>
                  {ex?.name ?? 'Ejercicio'}
                </Heading>
                <Small numberOfLines={1}>{describeSets(e.sets)}</Small>
                {top ? (
                  <Small numberOfLines={1} color={colors.textMuted}>
                    La última vez: {formatSet(top)}
                  </Small>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
      <Label color={colors.textMuted}>El descanso arranca solo al pulsar HECHO.</Label>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Label>{label}</Label>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border },
  stat: {
    flex: 1,
    padding: space.md,
    gap: 2,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  statValue: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  thumb: { borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 17, lineHeight: 22 },
});
