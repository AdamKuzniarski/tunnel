import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { loadSelectionSummary, loadActiveSession } from '@/services/sessionStorage';
import { loadSessionHistory } from '@/services/sessionHistoryStorage';
import { FocusSession } from '@/types/session';
import { SessionHistoryEntry } from '@/types/sessionHistory';
import { TunnelSelectionSummary } from '../../modules/tunnel-focus-control';
import { colors, spacing, typography } from '../theme';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { SectionTitle } from '@/components/ui/SectionTitle';

export default function HomeScreen() {
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [selectionSummary, setSelectionSummary] = useState<TunnelSelectionSummary | null>(null);
  const [history, setHistory] = useState<SessionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

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

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const latestEntry = history[0] ?? null;

  const emergencyUnlockCount = useMemo(() => {
    return history.filter((entry) => entry.outcome === 'emergency_unlock').length;
  }, [history]);

  const sessionStatusValue = useMemo(() => {
    if (!activeSession || activeSession.status !== 'active' || activeSession.endsAt <= now) {
      return 'idle';
    }
    const remainingMs = Math.max(activeSession.endsAt - now, 0);
    const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);

    return `${remainingMinutes} minutes left`;
  }, [activeSession, now]);
  const sessionStatusHint = useMemo(() => {
    if (!activeSession || activeSession.status !== 'active' || activeSession.endsAt <= now) {
      return 'No focus session is running right now.';
    }

    return `Current session: ${activeSession.durationMinutes} minutes`;
  }, [activeSession, now]);

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
    <Screen scroll>
      <View style={styles.hero}>
        <Text style={styles.brand}>tunnel</Text>
        <Text style={styles.tagline}>Block the noise. Stay in flow.</Text>
      </View>

      <Card>
        <Text style={styles.cardLabel}>Overview</Text>
        <Text style={styles.cardValue}>Focus dashboard</Text>
        <Text style={styles.cardText}>
          Your current, session, selection, state, and recent activity in one place.
        </Text>
      </Card>

      <View style={styles.stats}>
        <StatCard label={'Session'} value={sessionStatusValue} hint={sessionStatusHint} />
        <StatCard label={'Selection'} value={selectionValue} hint={selectionHint} />
        <StatCard label={'Latest'} value={latestHistoryValue} hint={latestHistoryHint} />
        <StatCard
          label={'Emergency unlocks'}
          value={String(emergencyUnlockCount)}
          hint={'Counted from recorded session history'}
        />
      </View>

      <View style={styles.section}>
        <SectionTitle>Main actions</SectionTitle>

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
      {loading ? <Text style={styles.info}>Loading dashboard...</Text> : null}
      {error ? <Text style={styles.error}>Error: {error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  stats: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
  },
  linkCard: {
    backgroundColor: colors.surface,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    fontSize: typography.body,
    fontWeight: '600',
    overflow: 'hidden',
  },
  info: {
    color: colors.muted,
    fontSize: typography.bodySmall,
  },
  error: {
    color: colors.danger,
    fontSize: typography.bodySmall,
  },
});
