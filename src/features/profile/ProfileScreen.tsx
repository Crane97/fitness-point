import { useState, type ReactElement } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button } from '@/components/Button';
import { ToggleRow } from '@/components/Controls';
import { Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { Label, Small, Title } from '@/components/Text';
import { dateKey, formatElapsed, longDate } from '@/domain/dates';
import { formatKg, formatThousands } from '@/domain/format';
import { completedSetCount, workoutVolume } from '@/domain/history';
import { now } from '@/services/clock';
import { useApp } from '@/store';
import { colors, fonts, space } from '@/theme';

import { WeightChart } from './WeightChart';

export function ProfileScreen(): ReactElement {
  const name = useApp((s) => s.profile.name);
  const metrics = useApp((s) => s.bodyMetrics);
  const history = useApp((s) => s.history);
  const settings = useApp((s) => s.settings);
  const upsert = useApp((s) => s.upsertBodyMetric);
  const setSetting = useApp((s) => s.setSetting);
  const { width } = useWindowDimensions();
  const today = dateKey(now());
  const todayMetric = metrics.find((m) => m.date === today);
  const lastWeight = [...metrics].reverse().find((m) => m.weightKg !== undefined)?.weightKg;
  const lastHeight = [...metrics].reverse().find((m) => m.heightCm !== undefined)?.heightCm;
  const [weight, setWeight] = useState<number | undefined>(todayMetric?.weightKg ?? lastWeight);
  const [height, setHeight] = useState<number | undefined>(todayMetric?.heightCm ?? lastHeight);
  const [saved, setSaved] = useState(false);
  const bmi = weight && height ? weight / (height / 100) ** 2 : null;
  const recent = [...history].sort((a, b) => b.startedAt - a.startedAt).slice(0, 12);
  const chartWidth = Math.min(width, 560) - space.lg * 2;

  return (
    <Screen header="Perfil" back testID="screen-profile">
      <Title>{name}</Title>

      <View style={styles.box}>
        <Label>Hoy · {longDate(now())}</Label>
        <View style={styles.pair}>
          <Stepper
            label="Peso"
            value={weight}
            onChange={(v) => {
              setWeight(v);
              setSaved(false);
            }}
            step={0.1}
            quantum={0.1}
            min={20}
            max={400}
            unit="kg"
            testID="profile-weight"
          />
          <Stepper
            label="Altura"
            value={height}
            onChange={(v) => {
              setHeight(v);
              setSaved(false);
            }}
            step={1}
            min={80}
            max={260}
            unit="cm"
            testID="profile-height"
          />
        </View>
        <View style={styles.saveRow}>
          <Small style={{ flex: 1 }}>
            {bmi ? `IMC ${formatKg(Math.round(bmi * 10) / 10)}` : ' '}
          </Small>
          <Button
            label={saved ? 'Guardado' : 'Guardar'}
            icon={saved ? 'check' : undefined}
            variant={saved ? 'secondary' : 'primary'}
            onPress={() => {
              upsert(today, {
                ...(weight !== undefined ? { weightKg: Math.round(weight * 10) / 10 } : {}),
                ...(height !== undefined ? { heightCm: Math.round(height) } : {}),
              });
              setSaved(true);
            }}
            testID="save-metrics"
          />
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <Label>Peso corporal</Label>
        <WeightChart metrics={metrics} width={chartWidth} />
      </View>

      <View style={{ gap: space.sm }} testID="history">
        <Label>Historial · {history.length} sesiones</Label>
        {recent.length === 0 ? <Small>Aún no hay sesiones registradas.</Small> : null}
        {recent.map((w) => (
          <View key={w.id} style={styles.histRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.histName} numberOfLines={1}>
                {w.sessionName}
              </Text>
              <Small numberOfLines={1}>
                {longDate(w.startedAt)} · {w.routineName}
              </Small>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text style={styles.histValue}>{formatThousands(workoutVolume(w))} kg</Text>
              <Small>
                {completedSetCount(w)} series ·{' '}
                {formatElapsed((w.finishedAt ?? w.startedAt) - w.startedAt)}
              </Small>
            </View>
          </View>
        ))}
      </View>

      <View style={{ gap: space.xs }}>
        <Label>Ajustes</Label>
        <ToggleRow
          label="Pantalla encendida"
          hint="Durante la sesión de entrenamiento"
          value={settings.keepAwake}
          onChange={(v) => setSetting('keepAwake', v)}
          testID="setting-keep-awake"
        />
        <ToggleRow
          label="Sonido al acabar el descanso"
          value={settings.sound}
          onChange={(v) => setSetting('sound', v)}
        />
        <ToggleRow
          label="Vibración"
          hint="Solo en el móvil"
          value={settings.haptics}
          onChange={(v) => setSetting('haptics', v)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: space.lg,
    gap: space.md,
  },
  pair: { gap: space.md },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  histRow: {
    flexDirection: 'row',
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  histName: { fontFamily: fonts.textSemi, fontSize: 16, color: colors.text },
  histValue: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
