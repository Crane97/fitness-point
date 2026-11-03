import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip, Field } from '@/components/Controls';
import { Screen } from '@/components/Screen';
import { Label, Small } from '@/components/Text';
import { EQUIPMENT_LABEL, MUSCLE_LABEL, genericIllustrationKey } from '@/data/exercises';
import { uid } from '@/domain/id';
import { addExercise } from '@/domain/routineEditing';
import { EQUIPMENT, MUSCLE_GROUPS, type Equipment, type MuscleGroup } from '@/domain/types';
import { ExerciseIllustration } from '@/illustrations/ExerciseIllustration';
import { useApp } from '@/store';
import { colors, space } from '@/theme';

export function CustomExerciseScreen(): ReactElement {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const draft = useApp((s) => s.draft);
  const create = useApp((s) => s.addCustomExercise);
  const update = useApp((s) => s.updateDraft);
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup>();
  const [equipment, setEquipment] = useState<Equipment>();
  const [errors, setErrors] = useState<string[]>([]);

  const session = draft?.routine.sessions.find((s) => s.id === sessionId);
  if (!draft || !session) return <Redirect href="/rutinas/editor" />;

  const onCreate = () => {
    const res = create({ name, primaryMuscle: muscle, equipment });
    setErrors(res.errors);
    if (!res.exercise) return;
    let instanceId = '';
    const ex = res.exercise;
    update((r) => addExercise(r, session.id, ex, () => (instanceId = uid())));
    router.dismissTo({
      pathname: '/rutinas/editor/[sessionId]',
      params: { sessionId: session.id },
    });
    router.push({
      pathname: '/rutinas/editor/[sessionId]/[exerciseId]',
      params: { sessionId: session.id, exerciseId: instanceId },
    });
  };

  return (
    <Screen
      header="Ejercicio personalizado"
      back
      testID="screen-custom-exercise"
      footer={
        <>
          {errors.map((e) => (
            <Small key={e} color={colors.accent}>
              {e}
            </Small>
          ))}
          <Button
            label="Crear y añadir"
            variant="primary"
            size="lg"
            onPress={onCreate}
            testID="create-custom"
          />
        </>
      }
    >
      <View style={styles.preview}>
        <ExerciseIllustration
          illustrationKey={genericIllustrationKey(muscle ?? 'core')}
          primaryMuscle={muscle ?? 'core'}
          size={120}
        />
        <Small style={{ flex: 1 }}>
          Los ejercicios personalizados usan la ilustración genérica de su grupo muscular.
        </Small>
      </View>
      <Field
        label="Nombre"
        value={name}
        onChangeText={setName}
        placeholder="Press Larsen"
        large
        testID="custom-name"
      />
      <View style={{ gap: space.sm }}>
        <Label>Grupo muscular</Label>
        <View style={styles.wrap}>
          {MUSCLE_GROUPS.map((m) => (
            <Chip
              key={m}
              label={MUSCLE_LABEL[m]}
              selected={muscle === m}
              onPress={() => setMuscle(m)}
              testID={`custom-muscle-${m}`}
            />
          ))}
        </View>
      </View>
      <View style={{ gap: space.sm }}>
        <Label>Material</Label>
        <View style={styles.wrap}>
          {EQUIPMENT.map((e) => (
            <Chip
              key={e}
              label={EQUIPMENT_LABEL[e]}
              selected={equipment === e}
              onPress={() => setEquipment(e)}
              testID={`custom-equipment-${e}`}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
