import type { ReactElement } from 'react';
import { Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { Small } from '@/components/Text';
import { formatKg } from '@/domain/format';
import { parseDateKey, shortDate } from '@/domain/dates';
import type { BodyMetric } from '@/domain/types';
import { colors, fonts } from '@/theme';

interface Props {
  metrics: readonly BodyMetric[];
  width: number;
}

/** Body weight over time: flat, square data points, accent line. */
export function WeightChart({ metrics, width }: Props): ReactElement {
  const points = metrics.filter((m) => m.weightKg !== undefined);
  if (points.length < 2) {
    return <Small>Registra tu peso al menos dos días para ver la gráfica.</Small>;
  }
  const values = points.map((m) => m.weightKg!);
  const min = Math.floor(Math.min(...values)) - 1;
  const max = Math.ceil(Math.max(...values)) + 1;
  const yAxisWidth = 34;
  const spacing = Math.max(8, (width - yAxisWidth - 24) / (points.length - 1));
  const labelEvery = Math.ceil(points.length / 4);
  const data = points.map((m, i) => ({
    value: m.weightKg!,
    labelComponent:
      i % labelEvery === 0
        ? () => <Text style={labelStyle}>{shortDate(parseDateKey(m.date))}</Text>
        : undefined,
    dataPointText: i === points.length - 1 ? formatKg(m.weightKg!) : undefined,
  }));

  return (
    <View
      testID="weight-chart"
      accessibilityLabel={`Gráfica de peso: de ${formatKg(values[0]!)} a ${formatKg(values.at(-1)!)} kg`}
    >
      <LineChart
        data={data}
        width={width - yAxisWidth - 8}
        height={160}
        spacing={spacing}
        initialSpacing={8}
        endSpacing={16}
        yAxisOffset={min}
        maxValue={max - min}
        noOfSections={4}
        thickness={2}
        color={colors.accent}
        dataPointsShape="rectangular"
        dataPointsWidth={6}
        dataPointsHeight={6}
        dataPointsColor={colors.accent}
        textColor={colors.text}
        textFontSize={12}
        textShiftY={-8}
        textShiftX={-10}
        rulesColor={colors.border}
        rulesType="solid"
        yAxisColor={colors.border}
        xAxisColor={colors.border}
        yAxisLabelWidth={yAxisWidth}
        yAxisTextStyle={{ color: colors.textSecondary, fontFamily: fonts.text, fontSize: 11 }}
        xAxisLabelTextStyle={{
          color: colors.textSecondary,
          fontFamily: fonts.text,
          fontSize: 10,
          width: 48,
        }}
        disableScroll
        isAnimated={false}
      />
    </View>
  );
}

const labelStyle = {
  width: 56,
  color: colors.textSecondary,
  fontFamily: fonts.text,
  fontSize: 10,
} as const;
