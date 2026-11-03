import { Redirect, router } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field, Segmented } from '@/components/Controls';
import { ConfirmDialog } from '@/components/Dialog';
import { Screen } from '@/components/Screen';
import { Heading, Label, Small } from '@/components/Text';
import { uid } from '@/domain/id';
import { ORGANIZATION_LABEL, estimateSessionDurationS, formatDuration } from '@/domain/planning';
import {
  addSession,
  duplicateSession,
  moveSession,
  removeSession,
  setOrganization,
} from '@/domain/routineEditing';
import type { ValidationError } from '@/domain/routineValidation';
import type { Organization } from '@/domain/types';
import { useApp } from '@/store';
import { colors, space } from '@/theme';

const ORG_OPTIONS = (['days', 'muscle', 'free'] as const).map((value) => ({
  value,
  label: ORGANIZATION_LABEL[value],
}));

const ORG_HINT: Record<Organization, string> = {
  days: 'Sesiones numeradas: Día 1, Día 2… (puedes renombrarlas).',
  muscle: 'Sesiones por grupo muscular: «Pecho y tríceps», «Pierna»…',
  free: 'Sesiones con el nombre que quieras.',
};

export function RoutineEditorScreen(): ReactElement {
  const draft = useApp((s) => s.draft);
  const update = useApp((s) => s.updateDraft);
  const save = useApp((s) => s.saveDraft);
  const discard = useApp((s) => s.discardDraft);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);

  if (!draft) return <Redirect href="/rutinas" />;
  const r = draft.routine;
  const errorAt = (path: string) => errors.find((e) => e.path === path)?.message;
  const sessionHasError = (i: number) => errors.some((e) => e.path.startsWith(`sessions.${i}.`));

  const onSave = () => {
    const e = save();
    setErrors(e);
    if (e.length === 0) router.replace('/rutinas');
  };

  return (
    <Screen
      header={draft.sourceId ? 'Editar rutina' : 'Nueva rutina'}
      back
      testID="screen-routine-editor"
      footer={
        <>
          {errors.length > 0 ? (
            <View style={styles.errors} testID="routine-errors" accessibilityLiveRegion="polite">
              {errors.slice(0, 3).map((e) => (
                <Small key={e.path + e.message} color={colors.accent}>
                  {e.message}
                </Small>
              ))}
              {errors.length > 3 ? (
                <Small color={colors.accent}>y {errors.length - 3} más…</Small>
              ) : null}
            </View>
          ) : null}
          <Button
            label="Guardar rutina"
            variant="primary"
            size="lg"
            onPress={onSave}
            testID="save-routine"
          />
        </>
      }
    >
      <Field
        label="Nombre de la rutina"
        value={r.name}
        onChangeText={(name) => update((x) => ({ ...x, name }))}
        placeholder="Hipertrofia otoño"
        large
        error={errorAt('name')}
        testID="routine-name"
      />

      <View style={{ gap: space.sm }}>
        <Label>Organización</Label>
        <Segmented
          options={ORG_OPTIONS}
          value={r.organization}
          onChange={(org) => update((x) => setOrganization(x, org))}
          testID="organization"
        />
        <Small>{ORG_HINT[r.organization]}</Small>
      </View>

      <View style={{ gap: space.sm }}>
        <View style={styles.head}>
          <Label>Sesiones · {r.sessions.length}</Label>
          <Small color={colors.textMuted}>Borrador guardado</Small>
        </View>
        {errorAt('sessions') ? <Small color={colors.accent}>{errorAt('sessions')}</Small> : null}
        {r.sessions.map((s, i) => (
          <Card
            key={s.id}
            testID={`session-${i}`}
            onPress={() =>
              router.push({ pathname: '/rutinas/editor/[sessionId]', params: { sessionId: s.id } })
            }
            accessibilityLabel={`Editar sesión ${s.name}`}
            style={sessionHasError(i) ? styles.errorCard : undefined}
            actions={
              <>
                <IconButton
                  icon="up"
                  label={`Subir ${s.name}`}
                  disabled={i === 0}
                  onPress={() => update((x) => moveSession(x, s.id, -1))}
                />
                <IconButton
                  icon="down"
                  label={`Bajar ${s.name}`}
                  disabled={i === r.sessions.length - 1}
                  onPress={() => update((x) => moveSession(x, s.id, 1))}
                />
                <IconButton
                  icon="copy"
                  label={`Duplicar ${s.name}`}
                  onPress={() => update((x) => duplicateSession(x, s.id, uid))}
                />
                <IconButton
                  icon="trash"
                  label={`Eliminar ${s.name}`}
                  onPress={() => setToDelete(s.id)}
                />
              </>
            }
          >
            <View style={styles.sessionRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <Heading numberOfLines={1}>{s.name || `Sesión ${i + 1}`}</Heading>
                <Small>
                  {s.exercises.length} ejercicios
                  {s.exercises.length > 0
                    ? ` · ${formatDuration(estimateSessionDurationS(s))}`
                    : ''}
                </Small>
                {sessionHasError(i) ? (
                  <Small color={colors.accent}>
                    {errors.find((e) => e.path.startsWith(`sessions.${i}.`))?.message}
                  </Small>
                ) : null}
              </View>
            </View>
          </Card>
        ))}
        <Button
          label="Añadir sesión"
          icon="plus"
          onPress={() => update((x) => addSession(x, uid))}
          testID="add-session"
        />
      </View>

      <Button
        label="Descartar cambios"
        variant="ghost"
        onPress={() => setConfirmDiscard(true)}
        testID="discard-draft"
      />

      <ConfirmDialog
        visible={confirmDiscard}
        title="¿Descartar cambios?"
        message="Se perderá el borrador de esta rutina."
        confirmLabel="Descartar"
        destructive
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          discard();
          router.replace('/rutinas');
        }}
      />
      <ConfirmDialog
        visible={toDelete !== null}
        title="¿Eliminar sesión?"
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) update((x) => removeSession(x, toDelete));
          setToDelete(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  errors: { gap: 2 },
  errorCard: { borderColor: colors.accent },
});
