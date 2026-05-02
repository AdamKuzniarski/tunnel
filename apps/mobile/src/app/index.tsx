import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.brand}>tunnel</Text>
        <Text style={styles.tagline}>Block the noise. Stay in flow.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Today</Text>
        <Text style={styles.cardValue}>Focus-ready</Text>
        <Text style={styles.cardText}>
          Start a session, review your selection, or check recent history
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Main actions</Text>

        <Link href={'/focus-session'} style={styles.linkCard}>
          Start Focus Session
        </Link>

        <Link href={'/selection-test'} style={styles.linkCard}>
          Current Selection
        </Link>

        <Link href={'/history'} style={styles.linkCard}>
          History
        </Link>

        <Link href={'/settings'} style={styles.linkCard}>
          Settings
        </Link>
        {__DEV__ ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer Tools</Text>

            <Link href={'/native-test'} style={styles.devLink}>
              Permission Debug
            </Link>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  hero: {
    marginTop: spacing['3xl'],
    gap: spacing.sm,
  },
  brand: {
    color: colors.foreground,
    fontSize: typography.hero,
    fontWeight: '700',
    letterSpacing: -1,
  },
  tagline: {
    color: colors.muted,
    fontSize: typography.body,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 20,
    gap: spacing.sm,
  },
  cardLabel: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardValue: {
    color: colors.foreground,
    fontSize: typography.title,
    fontWeight: '700',
  },
  cardText: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: typography.sectionTitle,
    fontWeight: '600',
  },
  linkCard: {
    backgroundColor: colors.surface,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    fontSize: typography.body,
    fontWeight: '600',
    overflow: 'hidden',
  },
  devLink: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    paddingVertical: spacing.sm,
  },
});
