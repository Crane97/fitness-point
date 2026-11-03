import type { ReactElement } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { colors, space } from '@/theme';

import { Button } from './Button';
import { Body, Heading } from './Text';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Cross-platform confirmation (Alert.alert is a no-op on web). */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive,
  onConfirm,
  onCancel,
}: Props): ReactElement {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.box} accessibilityViewIsModal>
          <Heading>{title}</Heading>
          {message ? <Body color={colors.textSecondary}>{message}</Body> : null}
          <View style={{ gap: space.sm, marginTop: space.md }}>
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              testID="dialog-confirm"
            />
            <Button label={cancelLabel} variant="ghost" onPress={onCancel} testID="dialog-cancel" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: space.xl,
  },
  box: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    gap: space.sm,
  },
});
