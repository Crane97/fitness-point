import type { ReactElement } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/Controls';
import { Heading, Label, Small } from '@/components/Text';
import { formatClock, remainingSeconds, restProgress } from '@/domain/timer';
import { useNow } from '@/hooks/useNow';
import { ExerciseIllustration } from '@/illustrations/ExerciseIllustration';
import { now } from '@/services/clock';
import { useApp } from '@/store';
import { colors, fonts, space } from '@/theme';

import { setTarget } from './model';

export function RestScreen(): ReactElement | null {
  const active = useApp((s) => s.active);
  const dispatch = useApp((s) => s.dispatch);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const t = useNow(250);
  const phase = active?.machine.phase;
  if (!active || phase?.type !== 'resting') return null;

  const nextEx = active.machine.workout.exercises[phase.next.exerciseIndex]!;
  const nextSet = nextEx.sets[phase.next.setIndex]!;
  const left = remainingSeconds(phase.endsAt, t);
  const clockSize = Math.min(150, Math.floor((width - space.lg * 2) / 2.6));

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, space.lg) },
      ]}
      testID="screen-rest"
    >
      <View style={styles.head}>
        <Label color={colors.text}>Descanso</Label>
        <Label>{phase.kind === 'betweenSets' ? 'Entre series' : 'Tras el ejercicio'}</Label>
      </View>

      <View style={styles.center}>
        <Text
          testID="rest-countdown"
          accessibilityRole="timer"
          accessibilityLabel={`Quedan ${left} segundos`}
          style={[styles.clock, { fontSize: clockSize, lineHeight: clockSize * 1.05 }]}
          numberOfLines={1}
        >
          {formatClock(left)}
        </Text>
        <ProgressBar
          progress={restProgress(phase.startedAt, phase.endsAt, t)}
          testID="rest-progress"
        />
        <View style={styles.adjust}>
          <Button
            label="−15 s"
            size="lg"
            onPress={() => dispatch({ type: 'ADJUST_REST', deltaS: -15, now: now() })}
            style={styles.flex}
            testID="rest-minus"
          />
          <Button
            label="+15 s"
            size="lg"
            onPress={() => dispatch({ type: 'ADJUST_REST', deltaS: 15, now: now() })}
            style={styles.flex}
            testID="rest-plus"
          />
        </View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.next} testID="rest-next">
          <View style={styles.thumb}>
            <ExerciseIllustration
              illustrationKey={nextEx.illustrationKey}
              primaryMuscle={nextEx.primaryMuscle}
              size={76}
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Label>
              {phase.kind === 'betweenSets' ? 'Siguiente serie' : 'Siguiente ejercicio'}
            </Label>
            <Heading numberOfLines={2} style={styles.nextName}>
              {nextEx.name}
            </Heading>
            <Small>
              Serie {phase.next.setIndex + 1}/{nextEx.sets.length} · {setTarget(nextSet)}
            </Small>
          </View>
        </View>
        <Button
          label="Saltar"
          variant="primary"
          size="hero"
          onPress={() => dispatch({ type: 'SKIP_REST', now: now() })}
          testID="skip-rest"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg },
  flex: { flex: 1 },
  head: { height: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', gap: space.xl },
  clock: {
    fontFamily: fonts.displayBold,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    letterSpacing: -4,
  },
  adjust: { flexDirection: 'row', gap: space.md },
  bottom: { gap: space.md },
  next: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: space.md,
  },
  thumb: { borderWidth: 1, borderColor: colors.border },
  nextName: { fontSize: 18, lineHeight: 22 },
});
