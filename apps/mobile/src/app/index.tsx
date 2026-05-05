import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { loadSelectionSummary, loadActiveSession } from '@/services/sessionStorage';
import { loadSessionHistory } from '@/services/sessionHistoryStorage';
import { FocusSession } from '@/types/session';
import { SessionHistoryEntry } from '@/types/sessionHistory';
import { TunnelSelectionSummary } from '../../modules/tunnel-focus-control';
import { colors, radius, spacing, typography } from '../theme';

function DashboardCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={styles.dashboardCard}>
      <Text style={styles.dashboardCardLabel}>{label}</Text>
      <Text style={styles.dashboardCardValue}>{value}</Text>
      <Text style={styles.dashboardCardHint}>{hint}</Text>
    </View>
  );
}
export default function HomeScreen() {
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [selectionSummary, setSelectionSummary] = useState<TunnelSelectionSummary | null>(null);
  const [history, setHistory] = useState<SessionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [storedSession, storedSelection, storedHistory] = await Promise.all([
        loadActiveSession(),
        loadSelectionSummary(),
        loadSessionHistory(),
      ]);

      setActiveSession(storedSession);
      setSelectionSummary(storedSelection);
      setHistory(storedHistory);
    } catch (err) {
      console.log(`loadDashboard error:`, err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }, []);

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
  },
  content: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: spacing['3xl'],
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
  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroCardLabel: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  heroCardValue: {
    color: colors.foreground,
    fontSize: typography.title,
    fontWeight: '700',
  },
  heroCardText: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
  },
  dashboardGrid: {
    gap: spacing.md,
  },
  dashboardCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  dashboardCardLabel: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dashboardCardValue: {
    color: colors.foreground,
    fontSize: typography.sectionTitle,
    fontWeight: '700',
  },
  dashboardCardHint: {
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
  infoText: {
    color: colors.muted,
    fontSize: typography.bodySmall,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.bodySmall,
    lineHeight: 22,
  },
});
