import { router } from 'expo-router';
import type { ReactElement, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@/theme';

import { IconButton } from './Button';
import { Label } from './Text';

interface Props {
  children: ReactNode;
  /** Small uppercase label next to the back button. */
  header?: string;
  back?: boolean | (() => void);
  right?: ReactNode;
  /** Fixed area at the bottom (main action, in the thumb zone). */
  footer?: ReactNode;
  scroll?: boolean;
  testID?: string;
}

export function Screen({
  children,
  header,
  back,
  right,
  footer,
  scroll = true,
  testID,
}: Props): ReactElement {
  const insets = useSafeAreaInsets();
  const onBack =
    typeof back === 'function'
      ? back
      : () => (router.canGoBack() ? router.back() : router.replace('/'));
  const hasBar = back || header || right;
  const Body = scroll ? ScrollView : View;
  return (
    <View testID={testID} style={[styles.root, { paddingTop: insets.top }]}>
      {hasBar ? (
        <View style={styles.bar}>
          {back ? (
            <IconButton icon="back" label="Volver" onPress={onBack} size={56} testID="back" />
          ) : (
            <View style={styles.barSpacer} />
          )}
          <Label style={styles.barTitle} numberOfLines={1}>
            {header ?? ''}
          </Label>
          <View style={styles.right}>{right}</View>
        </View>
      ) : null}
      <Body
        style={styles.body}
        contentContainerStyle={scroll ? styles.content : undefined}
        keyboardShouldPersistTaps="handled"
      >
        {scroll ? children : <View style={styles.content}>{children}</View>}
      </Body>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          {footer}
        </View>
      ) : (
        <View style={{ height: insets.bottom }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xs,
  },
  barSpacer: { width: space.md },
  barTitle: { flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', minWidth: 56, justifyContent: 'flex-end' },
  body: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.lg },
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    gap: space.sm,
  },
});
