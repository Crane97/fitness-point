import { router } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/Dialog';
import { Screen } from '@/components/Screen';
import { Heading, Label, Small, Title } from '@/components/Text';
import { formatElapsed, greeting, longDate, relativeDay } from '@/domain/dates';
import { formatThousands } from '@/domain/format';
import { completedSetCount, workoutVolume } from '@/domain/history';
import { now } from '@/services/clock';
import { useApp } from '@/store';
import { colors, fonts, space } from '@/theme';

const WEEK = 7 * 86_400_000;

export function HomeScreen(): ReactElement {
  const name = useApp((s) => s.profile.name);
  const history = useApp((s) => s.history);
  const active = useApp((s) => s.active);
  const discard = useApp((s) => s.discardWorkout);
  const [confirm, setConfirm] = useState(false);
  const t = now();
  const last = history.reduce<(typeof history)[number] | null>(
    (best, w) => (!best || w.startedAt > best.startedAt ? w : best),
    null,
  );
  const week = history.filter((w) => w.startedAt > t - WEEK);
  const weekVolume = week.reduce((n, w) => n + workoutVolume(w), 0);

  return (
    <Screen
      testID="screen-home"
      footer={
        <>
          <Button
            label="Entrenar"
            variant="primary"
            size="hero"
            onPress={() => router.push('/entrenar')}
            testID="train"
          />
          <View style={styles.row}>
            <Button
              label="Mis rutinas"
              onPress={() => router.push('/rutinas')}
              style={styles.flex}
              testID="my-routines"
            />
            <Button
              label="Perfil"
              onPress={() => router.push('/perfil')}
              style={styles.flex}
              testID="profile"
            />
          </View>
        </>
      }
    >
      <View style={styles.hello}>
        <Label>{longDate(t)}</Label>
        <Title style={styles.greeting}>
          {greeting(t)},{'\n'}
          {name}
        </Title>
      </View>

      {active ? (
        <Card active testID="resume-card">
          <Label color={colors.accent}>Sesión en curso</Label>
          <Heading>{active.machine.workout.sessionName}</Heading>
          <Small>
            {active.machine.workout.routineName} · {completedSetCount(active.machine.workout)}{' '}
            series hechas
          </Small>
          <View style={styles.row}>
            <Button
              label="Reanudar sesión"
              variant="primary"
              onPress={() => router.push('/sesion/activa')}
              style={styles.flex}
              testID="resume"
            />
            <Button
              label="Descartar"
              variant="ghost"
              onPress={() => setConfirm(true)}
              testID="discard-active"
            />
          </View>
        </Card>
      ) : null}

      <View style={{ gap: space.sm }}>
        <Label>Última sesión</Label>
        {last ? (
          <Card testID="last-session">
            <View style={styles.lastHead}>
              <Heading style={styles.flex} numberOfLines={1}>
                {last.sessionName}
              </Heading>
              <Small>{relativeDay(last.startedAt, t)}</Small>
            </View>
            <Small>{last.routineName}</Small>
            <View style={styles.metrics}>
              <Metric
                label="Duración"
                value={formatElapsed((last.finishedAt ?? last.startedAt) - last.startedAt)}
              />
              <Metric label="Series" value={String(completedSetCount(last))} />
              <Metric label="Volumen" value={`${formatThousands(workoutVolume(last))} kg`} wide />
            </View>
          </Card>
        ) : (
          <Card>
            <Heading>Todavía no has entrenado</Heading>
            <Small>Crea una rutina en «Mis rutinas» y pulsa ENTRENAR.</Small>
          </Card>
        )}
      </View>

      <View style={styles.week}>
        <Metric
          label="Esta semana"
          value={`${week.length} ${week.length === 1 ? 'sesión' : 'sesiones'}`}
        />
        <Metric label="Volumen semanal" value={`${formatThousands(weekVolume)} kg`} />
      </View>

      <ConfirmDialog
        visible={confirm}
        title="¿Descartar la sesión en curso?"
        message="Se perderán las series registradas de esta sesión."
        confirmLabel="Descartar"
        destructive
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          discard();
          setConfirm(false);
        }}
      />
    </Screen>
  );
}

function Metric({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.metric, wide && styles.metricWide]}>
      <Label>{label}</Label>
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: space.sm },
  hello: { gap: space.sm, marginTop: space.xxl },
  greeting: { fontSize: 40, lineHeight: 44, letterSpacing: -1 },
  lastHead: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
  metrics: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
  metric: { flex: 1, gap: 2 },
  metricWide: { flex: 1.5 },
  metricValue: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  week: {
    flexDirection: 'row',
    gap: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.lg,
  },
});
