import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamilies, spacing, typography } from '@/theme';

type SectionProps = PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  description?: string;
  bordered?: boolean;
}>;

export function Section({ eyebrow, title, description, bordered = false, children }: SectionProps) {
  return (
    <View style={[styles.section, bordered && styles.bordered]}>
      {eyebrow || title || description ? (
        <View style={styles.header}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  bordered: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  header: {
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontFamily: fontFamilies.sans.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.title,
    fontFamily: fontFamilies.sans.semibold,
    letterSpacing: -0.6,
  },
  description: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
    fontFamily: fontFamilies.sans.regular,
  },
});
