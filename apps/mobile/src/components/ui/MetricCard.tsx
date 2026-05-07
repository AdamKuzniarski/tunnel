import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
export function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  metricCard: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  metricValue: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: typography.label,
    fontWeight: '600',
  },
});
