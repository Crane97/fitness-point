import { router } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/Dialog';
import { Screen } from '@/components/Screen';
import { Body, Heading, Label, Small, Title } from '@/components/Text';
import { ORGANIZATION_LABEL } from '@/domain/planning';
import { useApp } from '@/store';
import { colors, space } from '@/theme';

export function RoutinesScreen(): ReactElement {
  const routines = useApp((s) => s.routines);
  const draft = useApp((s) => s.draft);
  const openDraft = useApp((s) => s.openDraft);
  const discardDraft = useApp((s) => s.discardDraft);
  const duplicate = useApp((s) => s.duplicateRoutine);
  const remove = useApp((s) => s.deleteRoutine);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [replaceWith, setReplaceWith] = useState<string | null | undefined>(undefined);

  const edit = (id: string | null) => {
    if (draft && draft.sourceId !== id) {
      setReplaceWith(id);
      return;
    }
    openDraft(id, 'days');
    router.push('/rutinas/editor');
  };

  const draftName = draft?.routine.name.trim() || 'Rutina sin nombre';

  return (
    <Screen
      header="Mis rutinas"
      back
      testID="screen-routines"
      footer={
        <Button
          label="Nueva rutina"
          icon="plus"
          variant="primary"
          size="lg"
          onPress={() => edit(null)}
          testID="new-routine"
        />
      }
    >
      <Title>Mis rutinas</Title>

      {draft ? (
        <Card active testID="draft-banner">
          <Label color={colors.accent}>Borrador sin guardar</Label>
          <Heading numberOfLines={1}>{draftName}</Heading>
          <View style={styles.row}>
            <Button
              label="Continuar"
              onPress={() => router.push('/rutinas/editor')}
              style={styles.flex}
              testID="draft-continue"
            />
            <Button label="Descartar" variant="ghost" onPress={discardDraft} style={styles.flex} />
          </View>
        </Card>
      ) : null}

      {routines.length === 0 ? (
        <Card>
          <Heading>Aún no tienes rutinas</Heading>
          <Body color={colors.textSecondary}>
            Crea tu primera rutina: ponle nombre, elige cómo organizarla y añade ejercicios del
            catálogo.
          </Body>
        </Card>
      ) : null}

      {routines.map((r) => {
        const exercises = r.sessions.reduce((n, s) => n + s.exercises.length, 0);
        return (
          <Card
            key={r.id}
            testID={`routine-${r.id}`}
            onPress={() => edit(r.id)}
            accessibilityLabel={`Editar ${r.name}`}
            actions={
              <>
                <IconButton
                  icon="edit"
                  label={`Editar ${r.name}`}
                  onPress={() => edit(r.id)}
                  bordered
                />
                <IconButton
                  icon="copy"
                  label={`Duplicar ${r.name}`}
                  onPress={() => duplicate(r.id)}
                  bordered
                  testID={`duplicate-${r.id}`}
                />
                <IconButton
                  icon="trash"
                  label={`Eliminar ${r.name}`}
                  onPress={() => setToDelete(r.id)}
                  bordered
                  testID={`delete-${r.id}`}
                />
              </>
            }
          >
            <Label>{ORGANIZATION_LABEL[r.organization]}</Label>
            <Heading numberOfLines={2}>{r.name}</Heading>
            <Small>
              {r.sessions.length} {r.sessions.length === 1 ? 'sesión' : 'sesiones'} · {exercises}{' '}
              ejercicios
            </Small>
            <Small numberOfLines={1} color={colors.textMuted}>
              {r.sessions.map((s) => s.name).join(' · ')}
            </Small>
          </Card>
        );
      })}

      <ConfirmDialog
        visible={toDelete !== null}
        title="¿Eliminar rutina?"
        message="El historial de sesiones ya registradas se conserva."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove(toDelete);
          setToDelete(null);
        }}
      />
      <ConfirmDialog
        visible={replaceWith !== undefined}
        title="Tienes un borrador sin guardar"
        message="Si continúas, se descartarán sus cambios."
        confirmLabel="Descartar borrador"
        destructive
        onCancel={() => setReplaceWith(undefined)}
        onConfirm={() => {
          discardDraft();
          openDraft(replaceWith ?? null, 'days');
          setReplaceWith(undefined);
          router.push('/rutinas/editor');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
  flex: { flex: 1 },
});
