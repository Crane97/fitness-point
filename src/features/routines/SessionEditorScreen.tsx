import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Controls';
import { ConfirmDialog } from '@/components/Dialog';
import { Screen } from '@/components/Screen';
import { Body, Heading, Label, Small } from '@/components/Text';
import { uid } from '@/domain/id';
import { estimateSessionDurationS, formatDuration } from '@/domain/planning';
import {
  duplicateExercise,
  moveExercise,
  removeExercise,
  renameSession,
} from '@/domain/routineEditing';
import { ExerciseIllustration } from '@/illustrations/ExerciseIllustration';
import { useApp } from '@/store';
import { useCatalog } from '@/store/selectors';
import { colors, space } from '@/theme';

import { describeExercise } from './describe';

export function SessionEditorScreen(): ReactElement {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const draft = useApp((s) => s.draft);
  const update = useApp((s) => s.updateDraft);
  const { byId } = useCatalog();
  const [toDelete, setToDelete] = useState<string | null>(null);

  const session = draft?.routine.sessions.find((s) => s.id === sessionId);
  if (!draft || !session) return <Redirect href="/rutinas/editor" />;

  const sid = session.id;
  const openConfig = (exerciseId: string) =>
    router.push({
      pathname: '/rutinas/editor/[sessionId]/[exerciseId]',
      params: { sessionId: sid, exerciseId },
    });

  return (
    <Screen
      header={draft.routine.name || 'Nueva rutina'}
      back
      testID="screen-session-editor"
      footer={
        <Button
          label="Añadir ejercicio"
          icon="plus"
          variant="primary"
          size="lg"
          onPress={() =>
            router.push({
              pathname: '/rutinas/editor/[sessionId]/catalogo',
              params: { sessionId: sid },
            })
          }
          testID="add-exercise"
        />
      }
    >
      <Field
        label="Nombre de la sesión"
        value={session.name}
        onChangeText={(name) => update((r) => renameSession(r, sid, name))}
        large
        error={session.name.trim() ? undefined : 'La sesión necesita un nombre.'}
        testID="session-name"
      />

      <View style={styles.head}>
        <Label>Ejercicios · {session.exercises.length}</Label>
        {session.exercises.length > 0 ? (
          <Small>≈ {formatDuration(estimateSessionDurationS(session))}</Small>
        ) : null}
      </View>

      {session.exercises.length === 0 ? (
        <Card>
          <Heading>Sesión vacía</Heading>
          <Body color={colors.textSecondary}>Añade al menos un ejercicio del catálogo.</Body>
        </Card>
      ) : null}

      {session.exercises.map((e, i) => {
        const ex = byId[e.exerciseId];
        const name = ex?.name ?? 'Ejercicio';
        return (
          <Card
            key={e.id}
            testID={`exercise-row-${i}`}
            onPress={() => openConfig(e.id)}
            accessibilityLabel={`Configurar ${name}`}
            actions={
              <>
                <IconButton
                  icon="up"
                  label={`Subir ${name}`}
                  disabled={i === 0}
                  onPress={() => update((r) => moveExercise(r, sid, e.id, -1))}
                  testID={`up-${i}`}
                />
                <IconButton
                  icon="down"
                  label={`Bajar ${name}`}
                  disabled={i === session.exercises.length - 1}
                  onPress={() => update((r) => moveExercise(r, sid, e.id, 1))}
                  testID={`down-${i}`}
                />
                <IconButton
                  icon="copy"
                  label={`Duplicar ${name}`}
                  onPress={() => update((r) => duplicateExercise(r, sid, e.id, uid))}
                />
                <IconButton
                  icon="trash"
                  label={`Eliminar ${name}`}
                  onPress={() => setToDelete(e.id)}
                />
              </>
            }
          >
            <View style={styles.row}>
              <View style={styles.thumb}>
                <ExerciseIllustration
                  illustrationKey={ex?.illustrationKey ?? 'generic-core'}
                  primaryMuscle={ex?.primaryMuscle ?? 'core'}
                  secondaryMuscles={ex?.secondaryMuscles}
                  size={64}
                />
              </View>
              <View style={styles.info}>
                <Small color={colors.textMuted}>{String(i + 1).padStart(2, '0')}</Small>
                <Heading numberOfLines={2} style={styles.name}>
                  {name}
                </Heading>
                <Small numberOfLines={1}>{describeExercise(e)}</Small>
              </View>
            </View>
          </Card>
        );
      })}

      <ConfirmDialog
        visible={toDelete !== null}
        title="¿Quitar ejercicio de la sesión?"
        confirmLabel="Quitar"
        destructive
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) update((r) => removeExercise(r, sid, toDelete));
          setToDelete(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  thumb: { borderWidth: 1, borderColor: colors.border },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 18, lineHeight: 22 },
});
