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

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const latestEntry = history[0] ?? null;

  const emergencyUnlockCount = useMemo(() => {
    return history.filter((entry) => entry.outcome === 'emergency_unlock').length;
  }, [history]);

  const sessionStatusValue = useMemo(() => {
    if (!activeSession || activeSession.status !== 'active') {
      return 'idle';
    }
    const remainingMs = Math.max(activeSession.endsAt - Date.now(), 0);
    const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);

    return `${remainingMinutes} minutes left`;
  }, [activeSession]);
  const sessionStatusHint = useMemo(() => {
    if (!activeSession || activeSession.status !== 'active') {
      return 'No focus session is running right now.';
    }

    return `Current session: ${activeSession.durationMinutes} minutes`;
  }, [activeSession]);

  const selectionValue = selectionSummary?.hasSelection
    ? `${selectionSummary.applicationCount} apps`
    : 'Not ready';

  const selectionHint = selectionSummary?.hasSelection
    ? `${selectionSummary.categoryCount} categories • ${selectionSummary.webDomainCount} web domains`
    : 'Choose what tunnel should block first.';

  const latestHistoryValue = latestEntry ? latestEntry.outcome.replace('_', ' ') : 'No history';

  const latestHistoryHint = latestEntry
    ? `${latestEntry.durationMinutes} min • ${new Date(latestEntry.endedAt).toLocaleDateString()}`
    : 'Your recent sessions will appear here.';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.brand}>tunnel</Text>
        <Text style={styles.tagline}>Block the noise. Stay in flow.</Text>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroCardLabel}>Overview</Text>
        <Text style={styles.heroCardValue}>Focus dashboard</Text>
        <Text style={styles.heroCardText}>
          Your current, session, selection, state, and recent activity in one place.
        </Text>
      </View>

      <View style={styles.dashboardGrid}>
        <DashboardCard label={'Session'} value={sessionStatusValue} hint={sessionStatusHint} />
        <DashboardCard label={'Selection'} value={selectionValue} hint={selectionHint} />
        <DashboardCard label={'Latest'} value={latestHistoryValue} hint={latestHistoryHint} />
        <DashboardCard
          label={'Emergency unlocks'}
          value={String(emergencyUnlockCount)}
          hint={'Counted from recorded session history'}
        />
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
      </View>
      {loading ? <Text style={styles.infoText}>Loading dashboard...</Text> : null}
      {error ? <Text style={styles.errorText}>Error: {error}</Text> : null}

      {__DEV__ ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer Tools</Text>

          <Link href={'/native-test'} style={styles.devLink}>
            Permission Debug
          </Link>
        </View>
      ) : null}
    </ScrollView>
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
