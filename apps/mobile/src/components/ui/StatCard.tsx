import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { Props } from 'expo-system-ui/plugin/src/withAndroidUserInterfaceStyle';

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  value: {
    color: colors.foreground,
    fontSize: typography.sectionTitle,
    fontWeight: '700',
  },
  hint: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
  },
});
