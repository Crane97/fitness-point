import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactElement } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Stepper } from '@/components/Stepper';
import { Heading, Label, Small, Title } from '@/components/Text';
import { formatElapsed } from '@/domain/dates';
import { formatSet, lastPerformance, topSet } from '@/domain/history';
import type { SetPosition } from '@/domain/sessionMachine';
import type { SetLog } from '@/domain/types';
import { useNow } from '@/hooks/useNow';
import { ExerciseIllustration } from '@/illustrations/ExerciseIllustration';
import { now } from '@/services/clock';
import { useApp } from '@/store';
import { colors, fonts, space, type as t } from '@/theme';

import { exerciseCount, exerciseOrdinal, nextExerciseName, setDone, setTarget } from './model';

export function ActiveExerciseScreen(): ReactElement | null {
  const active = useApp((s) => s.active);
  const phase = active?.machine.phase;
  if (!active || phase?.type !== 'performing') return null;
  // Remount (fresh steppers) whenever the current set changes.
  return <ActiveExercise key={`${phase.exerciseIndex}-${phase.setIndex}`} pos={phase} />;
}

function ActiveExercise({ pos }: { pos: SetPosition }): ReactElement {
  const params = useLocalSearchParams<{ editar?: string }>();
  const machine = useApp((s) => s.active!.machine);
  const history = useApp((s) => s.history);
  const dispatch = useApp((s) => s.dispatch);
  const discard = useApp((s) => s.discardWorkout);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const clock = useNow(1000);

  const ex = machine.workout.exercises[pos.exerciseIndex]!;
  const current = ex.sets[pos.setIndex]!;
  const initialEdit = parseEdit(params.editar, ex.sets, pos.setIndex);
  const [editing, setEditing] = useState<number | null>(initialEdit);
  const source = editing !== null ? ex.sets[editing]! : current;
  const [weight, setWeight] = useState<number | undefined>(source.weightKg);
  const [reps, setReps] = useState<number>(source.reps);
  const [menu, setMenu] = useState(false);

  const last = lastPerformance(history, ex.exerciseId);
  const lastTop = last ? topSet(last.sets) : null;
  const next = nextExerciseName(machine, pos.exerciseIndex);
  const ordinal = exerciseOrdinal(machine, pos.exerciseIndex);
  const total = exerciseCount(machine);
  const illus = Math.min(height < 900 ? 140 : 184, width - space.lg * 2);

  const startEdit = (i: number) => {
    const s = ex.sets[i]!;
    setEditing(i);
    setWeight(s.weightKg);
    setReps(s.reps);
  };
  const stopEdit = () => {
    setEditing(null);
    setWeight(current.weightKg);
    setReps(current.reps);
  };

  const onDone = () => {
    if (editing !== null) {
      dispatch({
        type: 'EDIT_SET',
        exerciseIndex: pos.exerciseIndex,
        setIndex: editing,
        reps,
        weightKg: weight ?? null,
      });
      stopEdit();
      return;
    }
    dispatch({ type: 'COMPLETE_SET', reps, weightKg: weight ?? null, now: now() });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="screen-active">
      <View style={styles.bar}>
        <IconButton
          icon="close"
          label="Opciones de la sesión"
          onPress={() => setMenu(true)}
          size={56}
          testID="session-menu"
        />
        <Label color={colors.text} style={styles.flex} testID="exercise-counter">
          Ejercicio {ordinal}/{total}
        </Label>
        <Text style={styles.elapsed} accessibilityLabel="Tiempo de sesión">
          {formatElapsed(clock - machine.workout.startedAt)}
        </Text>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeIn.duration(180)} style={styles.illus}>
          <ExerciseIllustration
            illustrationKey={ex.illustrationKey}
            primaryMuscle={ex.primaryMuscle}
            size={illus}
            testID="active-illustration"
          />
        </Animated.View>
        <View style={{ gap: 4 }}>
          <Title numberOfLines={2} testID="exercise-name">
            {ex.name}
          </Title>
          {ex.notes ? <Small numberOfLines={2}>{ex.notes}</Small> : null}
          <View style={styles.lastRow}>
            <Label>La última vez</Label>
            <Text style={styles.lastValue} testID="last-time">
              {lastTop ? formatSet(lastTop) : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.sets} testID="set-list">
          {ex.sets.map((s, i) => (
            <SetRow
              key={i}
              index={i}
              set={s}
              state={
                editing === i
                  ? 'editing'
                  : i === pos.setIndex && editing === null
                    ? 'current'
                    : s.completedAt !== undefined
                      ? 'done'
                      : 'pending'
              }
              onPress={
                s.completedAt !== undefined
                  ? () => (editing === i ? stopEdit() : startEdit(i))
                  : undefined
              }
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        {editing !== null ? (
          <Label color={colors.accent} testID="editing-label">
            Editando serie {editing + 1}
          </Label>
        ) : null}
        <View style={styles.steppers}>
          <Stepper
            label="Peso"
            value={weight}
            onChange={setWeight}
            step={2.5}
            quantum={0.5}
            max={500}
            unit="kg"
            emptyLabel="Corporal"
            size="lg"
            testID="active-weight"
          />
          <Stepper
            label="Reps"
            value={reps}
            onChange={(v) => setReps(v ?? 1)}
            step={1}
            min={1}
            max={100}
            size="lg"
            testID="active-reps"
          />
        </View>
        {editing !== null ? (
          <View style={styles.editRow}>
            <Button
              label="Cancelar"
              variant="secondary"
              size="lg"
              onPress={stopEdit}
              style={styles.flex}
            />
            <Button
              label="Guardar"
              variant="primary"
              size="lg"
              onPress={onDone}
              style={styles.flex}
              testID="save-edit"
            />
          </View>
        ) : (
          <>
            <Small numberOfLines={1} testID="next-line">
              <Text style={{ color: colors.textMuted }}>SIGUIENTE </Text>
              {pos.setIndex < ex.sets.length - 1
                ? `Serie ${pos.setIndex + 2} · ${setTarget(ex.sets[pos.setIndex + 1]!)}`
                : next
                  ? next
                  : 'Fin de la sesión'}
            </Small>
            <Button
              label="Hecho"
              icon="check"
              variant="primary"
              size="hero"
              onPress={onDone}
              testID="done"
              accessibilityHint="Registra la serie y empieza el descanso"
            />
          </>
        )}
      </View>

      <SessionMenu
        visible={menu}
        onClose={() => setMenu(false)}
        onFinish={() => {
          setMenu(false);
          dispatch({ type: 'FINISH', now: now() });
        }}
        onDiscard={() => {
          setMenu(false);
          discard();
          router.replace('/');
        }}
      />
    </View>
  );
}

function parseEdit(raw: string | undefined, sets: SetLog[], current: number): number | null {
  if (raw === undefined) return null;
  const i = Number(raw);
  return Number.isInteger(i) && i >= 0 && i < current && sets[i]?.completedAt !== undefined
    ? i
    : null;
}

type RowState = 'done' | 'current' | 'pending' | 'editing';

function SetRow({
  index,
  set,
  state,
  onPress,
}: {
  index: number;
  set: SetLog;
  state: RowState;
  onPress?: () => void;
}) {
  const highlighted = state === 'current' || state === 'editing';
  const text = state === 'done' || state === 'editing' ? setDone(set) : setTarget(set);
  return (
    <Pressable
      testID={`set-row-${index}`}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Serie ${index + 1}: ${text}${state === 'done' ? ', completada. Toca para editar' : ''}`}
      accessibilityState={{ selected: highlighted }}
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.setRow,
        highlighted && styles.setRowCurrent,
        state === 'done' && styles.setRowDone,
      ]}
    >
      {highlighted ? <View style={styles.setBar} /> : null}
      <Text
        style={[
          t.labelSmall,
          styles.setIndex,
          { color: highlighted ? colors.accent : colors.textSecondary },
        ]}
      >
        Serie {index + 1}
      </Text>
      <Text
        style={[
          styles.setText,
          state === 'done' && { color: colors.textSecondary },
          state === 'pending' && { color: colors.textMuted },
        ]}
      >
        {text}
      </Text>
      <View style={styles.setIcon}>
        {state === 'done' ? <Icon name="check" size={20} color={colors.textSecondary} /> : null}
        {state === 'editing' ? <Icon name="edit" size={18} color={colors.accent} /> : null}
      </View>
    </Pressable>
  );
}

function SessionMenu({
  visible,
  onClose,
  onFinish,
  onDiscard,
}: {
  visible: boolean;
  onClose: () => void;
  onFinish: () => void;
  onDiscard: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.menu}>
          <Heading>Sesión en curso</Heading>
          <Small>Tu progreso se guarda tras cada serie.</Small>
          <View style={{ gap: space.sm, marginTop: space.md }}>
            <Button
              label="Terminar y ver resumen"
              variant="primary"
              onPress={onFinish}
              testID="finish-session"
            />
            <Button
              label="Descartar sesión"
              variant="danger"
              onPress={onDiscard}
              testID="discard-session"
            />
            <Button label="Seguir entrenando" variant="ghost" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: space.lg,
    gap: space.xs,
  },
  elapsed: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.lg },
  illus: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.sm,
  },
  lastRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, marginTop: space.xs },
  lastValue: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  sets: { borderTopWidth: 1, borderTopColor: colors.border },
  setRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: space.md,
    gap: space.md,
  },
  setRowCurrent: { backgroundColor: colors.surface2 },
  setRowDone: { opacity: 0.85 },
  setBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.accent,
  },
  setIndex: { width: 64 },
  setText: {
    flex: 1,
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  setIcon: { width: 24, alignItems: 'center' },
  bottom: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  steppers: { gap: space.sm },
  editRow: { flexDirection: 'row', gap: space.md },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  menu: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    gap: space.xs,
    paddingBottom: space.xxxl,
  },
});
