import { Stack } from 'expo-router';

import { useSessionController } from '@/features/workout/useSessionController';
import { colors } from '@/theme';

export default function SessionLayout() {
  useSessionController();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'fade',
        animationDuration: 160,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
