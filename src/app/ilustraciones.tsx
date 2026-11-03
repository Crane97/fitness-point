import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BUILT_IN_EXERCISES, MUSCLE_LABEL } from '@/data/exercises';
import { MUSCLE_GROUPS } from '@/domain/types';
import { ExerciseIllustration } from '@/illustrations/ExerciseIllustration';
import { colors, space, type } from '@/theme';

/** Review sheet with every illustration of the catalog (used for screenshots/ilustraciones.png). */
export default function IllustrationSheet() {
  const generic = MUSCLE_GROUPS.map((m) => ({
    id: `generic-${m}`,
    name: `Genérica · ${MUSCLE_LABEL[m]}`,
    primaryMuscle: m,
  }));
  const items = [...BUILT_IN_EXERCISES, ...generic];
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ilustraciones del catálogo</Text>
      <View testID="illustration-grid" style={styles.grid}>
        {items.map((e) => (
          <View key={e.id} style={styles.cell}>
            <ExerciseIllustration
              illustrationKey={e.id}
              primaryMuscle={e.primaryMuscle}
              size={150}
            />
            <Text style={styles.name} numberOfLines={2}>
              {e.name}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl },
  title: { ...type.title, color: colors.text, marginBottom: space.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cell: { width: 152, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  name: { ...type.labelSmall, color: colors.textSecondary, padding: space.sm, minHeight: 44 },
});
