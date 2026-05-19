import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';

type ScreenProps = PropsWithChildren<{ scroll?: boolean }>;

export function Screen({ children, scroll }: ScreenProps) {
  if (scroll) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={styles.content}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing.xl,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
});
