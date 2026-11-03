import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ReactElement } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Controls';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Body, Label, Small } from '@/components/Text';
import { EQUIPMENT_LABEL, MUSCLE_LABEL, filterExercises } from '@/data/exercises';
import { uid } from '@/domain/id';
import { addExercise } from '@/domain/routineEditing';
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '@/domain/types';
import { ExerciseIllustration } from '@/illustrations/ExerciseIllustration';
import { useApp } from '@/store';
import { useCatalog } from '@/store/selectors';
import { colors, fonts, radius, space, type as t } from '@/theme';

const MAX_CONTENT = 560;

export function CatalogScreen(): ReactElement {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const draft = useApp((s) => s.draft);
  const update = useApp((s) => s.updateDraft);
  const { list } = useCatalog();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const { width } = useWindowDimensions();
  const results = useMemo(() => filterExercises(list, query, muscle), [list, query, muscle]);

  const session = draft?.routine.sessions.find((s) => s.id === sessionId);
  if (!draft || !session) return <Redirect href="/rutinas/editor" />;

  const cardWidth = Math.floor((Math.min(width, MAX_CONTENT) - space.lg * 2 - space.md) / 2);

  const pick = (ex: Exercise) => {
    let instanceId = '';
    update((r) => {
      const next = addExercise(r, session.id, ex, () => (instanceId = uid()));
      return next;
    });
    router.replace({
      pathname: '/rutinas/editor/[sessionId]/[exerciseId]',
      params: { sessionId: session.id, exerciseId: instanceId },
    });
  };

  return (
    <Screen header={`Añadir a ${session.name}`} back testID="screen-catalog">
      <View style={styles.search}>
        <Icon name="search" color={colors.textSecondary} size={20} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar ejercicio"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Buscar ejercicio"
          style={styles.searchInput}
          testID="catalog-search"
          autoCorrect={false}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipScroll}
      >
        <Chip
          label="Todos"
          selected={muscle === null}
          onPress={() => setMuscle(null)}
          testID="filter-all"
        />
        {MUSCLE_GROUPS.map((m) => (
          <Chip
            key={m}
            label={MUSCLE_LABEL[m]}
            selected={muscle === m}
            onPress={() => setMuscle(muscle === m ? null : m)}
            testID={`filter-${m}`}
          />
        ))}
      </ScrollView>

      <Label>
        {results.length} {results.length === 1 ? 'ejercicio' : 'ejercicios'}
      </Label>

      <View style={styles.grid}>
        {results.map((ex) => (
          <Pressable
            key={ex.id}
            testID={`catalog-${ex.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Añadir ${ex.name}`}
            onPress={() => pick(ex)}
            style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.pressed]}
          >
            <ExerciseIllustration
              illustrationKey={ex.illustrationKey}
              primaryMuscle={ex.primaryMuscle}
              secondaryMuscles={ex.secondaryMuscles}
              size={cardWidth - 2}
            />
            <View style={styles.cardText}>
              <Body numberOfLines={2} style={styles.cardName}>
                {ex.name}
              </Body>
              <Small numberOfLines={1}>
                {MUSCLE_LABEL[ex.primaryMuscle]} · {EQUIPMENT_LABEL[ex.equipment]}
              </Small>
            </View>
          </Pressable>
        ))}
      </View>

      {results.length === 0 ? (
        <Body color={colors.textSecondary}>Sin resultados para «{query}».</Body>
      ) : null}

      <Button
        label="Crear ejercicio personalizado"
        icon="plus"
        onPress={() =>
          router.push({
            pathname: '/rutinas/editor/[sessionId]/nuevo-ejercicio',
            params: { sessionId: session.id },
          })
        }
        testID="custom-exercise"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    minHeight: 56,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.text, fontSize: 16, minHeight: 54 },
  chipScroll: { marginHorizontal: -space.lg, flexGrow: 0 },
  chips: { gap: space.sm, paddingHorizontal: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  pressed: { borderColor: colors.accent },
  cardText: { padding: space.sm, gap: 2, minHeight: 72 },
  cardName: { ...t.bodyStrong, fontSize: 15, lineHeight: 19 },
});
