import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Body, Title } from '@/components/Text';
import { colors, space } from '@/theme';

export default function NotFound() {
  return (
    <Screen>
      <View style={{ gap: space.lg, marginTop: space.xxxl }}>
        <Title>Pantalla no encontrada</Title>
        <Body color={colors.textSecondary}>El enlace no existe o ya no está disponible.</Body>
        <Button label="Ir al inicio" variant="primary" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}
