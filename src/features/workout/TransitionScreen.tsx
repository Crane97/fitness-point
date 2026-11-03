import { useEffect, type ReactElement } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Label, Small, Title } from '@/components/Text';
import { demoScenario, useApp } from '@/store';
import { ExerciseIllustration } from '@/illustrations/ExerciseIllustration';
import { colors, space } from '@/theme';

import { exerciseCount, exerciseOrdinal, setTarget } from './model';

const AUTO_ADVANCE_MS = 2200;

export function TransitionScreen(): ReactElement | null {
  const active = useApp((s) => s.active);
  const clear = useApp((s) => s.clearTransition);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const index = active?.transitionTo ?? null;

  useEffect(() => {
    if (index === null || demoScenario) return;
    const id = setTimeout(clear, AUTO_ADVANCE_MS);
    return () => clearTimeout(id);
  }, [index, clear]);

  if (!active || index === null) return null;
  const ex = active.machine.workout.exercises[index]!;
  const size = Math.min(width - space.lg * 2, height * 0.42, 340);
  const first = ex.sets[0];

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, space.lg) },
      ]}
      testID="screen-transition"
    >
      <View style={styles.head}>
        <Label color={colors.accent}>Siguiente ejercicio</Label>
        <Label>
          {exerciseOrdinal(active.machine, index)}/{exerciseCount(active.machine)}
        </Label>
      </View>
      <View style={styles.center}>
        <Animated.View entering={FadeIn.duration(220)} style={styles.illus}>
          <ExerciseIllustration
            illustrationKey={ex.illustrationKey}
            primaryMuscle={ex.primaryMuscle}
            size={size}
          />
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(220).delay(80)} style={{ gap: space.sm }}>
          <Title testID="transition-name">{ex.name}</Title>
          <Small>
            {ex.sets.length} series{first ? ` · ${setTarget(first)}` : ''} · descanso{' '}
            {ex.restBetweenSetsS} s
          </Small>
          {ex.notes ? <Small color={colors.textSecondary}>{ex.notes}</Small> : null}
        </Animated.View>
      </View>
      <Button
        label="Empezar"
        variant="primary"
        size="hero"
        onPress={clear}
        testID="start-exercise"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg },
  head: { height: 56, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', gap: space.xl },
  illus: { alignItems: 'center', borderWidth: 1, borderColor: colors.border },
});
