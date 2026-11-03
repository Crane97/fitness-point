import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Field, RestPicker, ToggleRow } from '@/components/Controls';
import { Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { Heading, Label, Small } from '@/components/Text';
import { EQUIPMENT_LABEL, MUSCLE_LABEL } from '@/data/exercises';
import { isUniform, setUniformSets, updateExercise } from '@/domain/routineEditing';
import { LIMITS, validateSessionExercise } from '@/domain/routineValidation';
import type { SessionExercise, SetTemplate } from '@/domain/types';
import { ExerciseIllustration } from '@/illustrations/ExerciseIllustration';
import { useApp } from '@/store';
import { useCatalog } from '@/store/selectors';
import { colors, space } from '@/theme';

export function ConfigureExerciseScreen(): ReactElement {
  const { sessionId, exerciseId } = useLocalSearchParams<{
    sessionId: string;
    exerciseId: string;
  }>();
  const draft = useApp((s) => s.draft);
  const update = useApp((s) => s.updateDraft);
  const { byId } = useCatalog();
  const session = draft?.routine.sessions.find((s) => s.id === sessionId);
  const item = session?.exercises.find((e) => e.id === exerciseId);
  const [custom, setCustom] = useState(() => (item ? !isUniform(item.sets) : false));

  if (!draft || !session || !item) return <Redirect href="/rutinas/editor" />;

  const ex = byId[item.exerciseId];
  const patch = (p: Partial<SessionExercise>) =>
    update((r) => updateExercise(r, session.id, item.id, p));
  const first: SetTemplate = item.sets[0] ?? { reps: 10 };
  const hasRange = first.repsMax !== undefined;
  const errors = validateSessionExercise(item);

  const setAll = (t: SetTemplate, count = item.sets.length) =>
    patch({ sets: setUniformSets(count, t) });
  const setOne = (i: number, t: Partial<SetTemplate>) =>
    patch({ sets: item.sets.map((s, j) => (j === i ? clean({ ...s, ...t }) : s)) });

  return (
    <Screen
      header={session.name}
      back
      testID="screen-configure"
      footer={
        <>
          {errors.length > 0 ? (
            <Small color={colors.accent} testID="exercise-errors">
              {errors[0]!.message}
            </Small>
          ) : null}
          <Button
            label="Listo"
            variant="primary"
            size="lg"
            disabled={errors.length > 0}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/rutinas/editor'))}
            testID="exercise-done"
          />
        </>
      }
    >
      <View style={styles.top}>
        <View style={styles.thumb}>
          <ExerciseIllustration
            illustrationKey={ex?.illustrationKey ?? 'generic-core'}
            primaryMuscle={ex?.primaryMuscle ?? 'core'}
            secondaryMuscles={ex?.secondaryMuscles}
            size={104}
          />
        </View>
        <View style={{ flex: 1, gap: space.xs }}>
          <Heading numberOfLines={3}>{ex?.name ?? 'Ejercicio'}</Heading>
          {ex ? (
            <Small>
              {MUSCLE_LABEL[ex.primaryMuscle]} · {EQUIPMENT_LABEL[ex.equipment]}
            </Small>
          ) : null}
        </View>
      </View>

      {!custom ? (
        <View style={{ gap: space.lg }}>
          <Stepper
            label="Series"
            value={item.sets.length}
            onChange={(n) => setAll(first, Math.max(1, Math.min(LIMITS.setsMax, n ?? 1)))}
            step={1}
            min={1}
            max={LIMITS.setsMax}
            size="lg"
            testID="sets"
          />
          <View style={styles.pair}>
            <Stepper
              label={hasRange ? 'Reps mín.' : 'Repeticiones'}
              value={first.reps}
              onChange={(n) => setAll(clean({ ...first, reps: n ?? 1 }))}
              step={1}
              min={1}
              max={LIMITS.repsMax}
              size={hasRange ? 'md' : 'lg'}
              testID="reps"
            />
            {hasRange ? (
              <Stepper
                label="Reps máx."
                value={first.repsMax}
                onChange={(n) => setAll(clean({ ...first, repsMax: n ?? first.reps + 1 }))}
                step={1}
                min={first.reps + 1}
                max={LIMITS.repsMax}
                testID="reps-max"
              />
            ) : null}
          </View>
          <ToggleRow
            label="Rango de repeticiones"
            hint="Por ejemplo 8-10"
            value={hasRange}
            onChange={(v) => setAll(clean({ ...first, repsMax: v ? first.reps + 2 : undefined }))}
            testID="toggle-range"
          />
          <Stepper
            label="Peso"
            value={first.weightKg}
            onChange={(w) => setAll(clean({ ...first, weightKg: w }))}
            step={0.5}
            quantum={0.5}
            max={LIMITS.weightMax}
            unit="kg"
            emptyLabel="Peso corporal"
            size="lg"
            testID="weight"
          />
        </View>
      ) : (
        <View style={{ gap: space.md }} testID="custom-sets">
          {item.sets.map((s, i) => (
            <View key={i} style={styles.customSet}>
              <View style={styles.customHead}>
                <Label>Serie {i + 1}</Label>
                <IconButton
                  icon="trash"
                  label={`Eliminar serie ${i + 1}`}
                  disabled={item.sets.length === 1}
                  onPress={() => patch({ sets: item.sets.filter((_, j) => j !== i) })}
                />
              </View>
              <View style={styles.pair}>
                <Stepper
                  label="Reps"
                  value={s.reps}
                  onChange={(n) => setOne(i, { reps: n ?? 1 })}
                  step={1}
                  min={1}
                  max={LIMITS.repsMax}
                  testID={`set-${i}-reps`}
                />
                <Stepper
                  label="Peso"
                  value={s.weightKg}
                  onChange={(w) => setOne(i, { weightKg: w })}
                  step={2.5}
                  quantum={0.5}
                  max={LIMITS.weightMax}
                  unit="kg"
                  emptyLabel="Corporal"
                  testID={`set-${i}-weight`}
                />
              </View>
            </View>
          ))}
          <Button
            label="Añadir serie"
            icon="plus"
            disabled={item.sets.length >= LIMITS.setsMax}
            onPress={() => patch({ sets: [...item.sets, { ...(item.sets.at(-1) ?? first) }] })}
            testID="add-set"
          />
        </View>
      )}

      <ToggleRow
        label="Personalizar series"
        hint="Reps y peso distintos en cada serie (pirámides, descendentes)"
        value={custom}
        onChange={(v) => {
          setCustom(v);
          if (!v) setAll(first);
        }}
        testID="toggle-custom"
      />

      <RestPicker
        label="Descanso entre series"
        value={item.restBetweenSetsS}
        onChange={(s) => patch({ restBetweenSetsS: s })}
        testID="rest-between"
      />
      <RestPicker
        label="Descanso tras el ejercicio"
        value={item.restAfterExerciseS}
        onChange={(s) => patch({ restAfterExerciseS: s })}
        testID="rest-after"
      />

      <Field
        label="Notas"
        value={item.notes}
        onChangeText={(notes) => patch({ notes })}
        placeholder="Técnica, agarre, tempo…"
        multiline
        maxLength={300}
        testID="notes"
      />
    </Screen>
  );
}

/** Removes undefined optional keys so the template stays JSON-clean. */
function clean(t: SetTemplate): SetTemplate {
  return {
    reps: t.reps,
    ...(t.repsMax !== undefined ? { repsMax: t.repsMax } : {}),
    ...(t.weightKg !== undefined ? { weightKg: t.weightKg } : {}),
  };
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  thumb: { borderWidth: 1, borderColor: colors.border },
  pair: { flexDirection: 'row', gap: space.md },
  customSet: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
    backgroundColor: colors.surface,
  },
  customHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
