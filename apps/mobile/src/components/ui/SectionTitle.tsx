import { PropsWithChildren } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/theme';

export function SectionTitle({ children }: PropsWithChildren) {
  return <Text style={styles.title}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    color: colors.foreground,
    fontSize: typography.sectionTitle,
    fontWeight: '600',
  },
});
