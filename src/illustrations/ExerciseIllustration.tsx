import type { ReactElement } from 'react';
import { View } from 'react-native';

import { BUILT_IN_EXERCISES } from '@/data/exercises';
import type { MuscleGroup } from '@/domain/types';

import { ArtSvg, artFor } from './registry';

const SECONDARY: Record<string, readonly MuscleGroup[]> = Object.fromEntries(
  BUILT_IN_EXERCISES.map((e) => [e.id, e.secondaryMuscles]),
);

interface Props {
  illustrationKey: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles?: readonly MuscleGroup[];
  size: number;
  background?: string;
  testID?: string;
}

/** Draws the exercise illustration, falling back to the generic figure of its muscle group. */
export function ExerciseIllustration({
  illustrationKey,
  primaryMuscle,
  secondaryMuscles,
  size,
  background,
  testID,
}: Props): ReactElement {
  return (
    <View testID={testID} accessibilityRole="image" style={{ width: size, height: size }}>
      <ArtSvg
        art={artFor(illustrationKey, primaryMuscle)}
        size={size}
        primary={primaryMuscle}
        secondary={secondaryMuscles ?? SECONDARY[illustrationKey] ?? []}
        background={background}
      />
    </View>
  );
}
