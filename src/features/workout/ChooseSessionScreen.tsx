import { router } from 'expo-router';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Body, Heading, Label, Small, Title } from '@/components/Text';
import { relativeDay } from '@/domain/dates';
import {
  ORGANIZATION_LABEL,
  estimateSessionDurationS,
  formatDuration,
  suggestNextSession,
} from '@/domain/planning';
import { now } from '@/services/clock';
import { useApp } from '@/store';
import { colors, space } from '@/theme';

export function ChooseSessionScreen(): ReactElement {
  const routines = useApp((s) => s.routines);
  const history = useApp((s) => s.history);
  const t = now();

  const lastDone = (routineId: string, sessionId: string) => {
    let best: number | null = null;
    for (const w of history) {
      if (
        w.routineId === routineId &&
        w.sessionId === sessionId &&
        (best === null || w.startedAt > best)
      )
        best = w.startedAt;
    }
    return best;
  };

  return (
    <Screen header="Entrenar" back testID="screen-choose">
      <Title>¿Qué toca hoy?</Title>
      {routines.length === 0 ? (
        <Card>
          <Heading>No tienes rutinas</Heading>
          <Body color={colors.textSecondary}>Crea una para poder entrenar.</Body>
          <Button
            label="Crear rutina"
            variant="primary"
            onPress={() => router.replace('/rutinas')}
          />
        </Card>
      ) : null}
      {routines.map((r) => {
        const suggested = suggestNextSession(r, history);
        return (
          <View key={r.id} style={{ gap: space.sm }} testID={`choose-routine-${r.id}`}>
            <View style={styles.routineHead}>
              <Heading style={{ flex: 1 }} numberOfLines={1}>
                {r.name}
              </Heading>
              <Label>{ORGANIZATION_LABEL[r.organization]}</Label>
            </View>
            {r.sessions.map((s) => {
              const isNext = s.id === suggested;
              const done = lastDone(r.id, s.id);
              return (
                <Card
                  key={s.id}
                  active={isNext}
                  testID={`choose-${s.id}`}
                  accessibilityLabel={`${s.name}${isNext ? ', sugerida' : ''}`}
                  onPress={() =>
                    router.push({
                      pathname: '/entrenar/[routineId]/[sessionId]',
                      params: { routineId: r.id, sessionId: s.id },
                    })
                  }
                >
                  <View style={styles.sessionRow}>
                    <View style={{ flex: 1, gap: 2 }}>
                      {isNext ? <Label color={colors.accent}>Siguiente</Label> : null}
                      <Heading numberOfLines={1}>{s.name}</Heading>
                      <Small>
                        {s.exercises.length} ejercicios ·{' '}
                        {formatDuration(estimateSessionDurationS(s))}
                      </Small>
                      <Small color={colors.textMuted}>
                        {done === null ? 'Nunca realizada' : relativeDay(done, t)}
                      </Small>
                    </View>
                    <Icon name="chevron" color={isNext ? colors.accent : colors.textSecondary} />
                  </View>
                </Card>
              );
            })}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  routineHead: { flexDirection: 'row', alignItems: 'baseline', gap: space.md, marginTop: space.sm },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
