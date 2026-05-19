import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/StatCard';
import { getSelectionSummary } from '@/services/focusControl';
import { loadOnboardingCompleted } from '@/services/onBoardingStorage';
import { loadSessionHistory } from '@/services/sessionHistoryStorage';
import { loadActiveSession } from '@/services/sessionStorage';
import { colors, fontFamilies, spacing, typography } from '@/theme';

import type { TunnelSelectionSummary } from '../../modules/tunnel-focus-control';
import type { FocusSession } from '@/types/session';
import type { SessionHistoryEntry } from '@/types/sessionHistory';

export default function HomeScreen() {
  const router = useRouter();

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

      const onboardingCompleted = await loadOnboardingCompleted();

      if (!onboardingCompleted) {
        router.replace('/onboarding');
        return;
      }

      const [storedSession, nativeSelection, storedHistory] = await Promise.all([
        loadActiveSession(),
        getSelectionSummary(),
        loadSessionHistory(),
      ]);

      setActiveSession(storedSession);
      setSelectionSummary(nativeSelection);
      setHistory(storedHistory);
    } catch (err) {
      console.log('loadDashboard error:', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }, [router]);

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
      <Section
        eyebrow="Tunnel"
        title="Stay in flow"
        description="Block the noise and protect focused work."
      >
        <Text style={styles.brand}>tunnel</Text>
      </Section>

      <View style={styles.stats}>
        <StatCard label="Session" value={sessionStatusValue} hint={sessionStatusHint} />
        <StatCard label="Selection" value={selectionValue} hint={selectionHint} />
        <StatCard label="Latest" value={latestHistoryValue} hint={latestHistoryHint} />
        <StatCard
          label="Emergency unlocks"
          value={String(emergencyUnlockCount)}
          hint="Counted from recorded session history"
        />
      </View>

      <Section title="Main actions" bordered>
        <Link href="/focus-session" style={styles.linkItem}>
          Start focus session
        </Link>

        <Link href="/selection" style={styles.linkItem}>
          Current selection
        </Link>

        <Link href="/history" style={styles.linkItem}>
          History
        </Link>

        <Link href="/settings" style={styles.linkItem}>
          Settings
        </Link>
      </Section>

      {loading ? <Text style={styles.info}>Loading dashboard...</Text> : null}
      {error ? <Text style={styles.error}>Error: {error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    color: colors.foreground,
    fontSize: typography.hero,
    fontFamily: fontFamilies.sans.semibold,
    letterSpacing: -1,
  },
  stats: {
    gap: spacing.md,
  },
  linkItem: {
    backgroundColor: colors.surface,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.body,
    fontFamily: fontFamilies.sans.medium,
    overflow: 'hidden',
  },
  info: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    fontFamily: fontFamilies.sans.regular,
  },
  error: {
    color: colors.danger,
    fontSize: typography.bodySmall,
    fontFamily: fontFamilies.sans.regular,
  },
});
