import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';

export default function SettingsScreen() {
  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Settings</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          This area will hold app preferences and product options later.
        </Text>
      </View>

      <Card>
        <Text style={styles.cardLabel}>Current state</Text>
        <Text style={styles.cardValue}>Placeholder</Text>
        <Text style={styles.cardText}>
          tunnel settings are not implemented yet. This screen exists so the app shell already feels
          complete.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: spacing['2xl'],
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.foreground,
    fontSize: typography.title,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
  },
  cardLabel: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardValue: {
    color: colors.foreground,
    fontSize: typography.sectionTitle,
    fontWeight: '700',
  },
  cardText: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
  },
});
