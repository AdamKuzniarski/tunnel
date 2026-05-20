import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { DurationPresetPicker } from '@/components/ui/DurationPresetPicker';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { getSelectionSummary } from '@/services/focusControl';
import { startFocusSession } from '@/services/focusSessionStart';
import { loadOnboardingCompleted } from '@/services/onBoardingStorage';
import { loadActiveSession } from '@/services/sessionStorage';
import { colors, fontFamilies, spacing, typography } from '@/theme';
import type { FocusSessionDurationMinutes } from '@/types/session';

import type { TunnelSelectionSummary } from '../../modules/tunnel-focus-control';

function isActiveSession(session: { status: string; endsAt: number } | null, now: number): boolean {
  return session?.status === 'active' && session.endsAt > now;
}

export default function HomeScreen() {
  const router = useRouter();

  const [selectedDuration, setSelectedDuration] = useState<FocusSessionDurationMinutes>(30);
  const [selectionSummary, setSelectionSummary] = useState<TunnelSelectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [startBlockedMessage, setStartBlockedMessage] = useState('');

  const loadHome = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setStartBlockedMessage('');

      const onboardingCompleted = await loadOnboardingCompleted();

      if (!onboardingCompleted) {
        router.replace('/onboarding');
        return;
      }

      const [storedSession, nativeSelection] = await Promise.all([
        loadActiveSession(),
        getSelectionSummary(),
      ]);

      if (isActiveSession(storedSession, Date.now())) {
        router.replace('/focus-session');
        return;
      }

      setSelectionSummary(nativeSelection);
    } catch (err) {
      console.log('loadHome error:', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void loadHome();
    }, [loadHome]),
  );

  const selectionHasEntries = Boolean(selectionSummary?.hasSelection);

  async function handleStartSession() {
    try {
      setStarting(true);
      setError('');
      setStartBlockedMessage('');

      const result = await startFocusSession(selectedDuration);

      if (!result.ok) {
        if (result.reason === 'no_selection') {
          setStartBlockedMessage('Set up your blocklist before starting a session.');
          return;
        }

        setError('Could not start focus protection. Try again.');
        return;
      }

      router.replace('/focus-session');
    } catch (err) {
      console.log('handleStartSession error:', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setStarting(false);
    }
  }

  const isBusy = loading || starting;

  if (loading) {
    return (
      <Screen>
        <Text style={styles.loadingText}>Loading...</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <PageHeader title="tunnel" description="Block distractions. Focus on what matters." />

      <View style={styles.durationSection}>
        <Text style={styles.durationDisplay}>{selectedDuration} min</Text>
        <DurationPresetPicker
          value={selectedDuration}
          onChange={setSelectedDuration}
          disabled={isBusy}
        />
      </View>

      {selectionHasEntries ? (
        <Text style={styles.readinessReady}>
          {selectionSummary!.applicationCount} app
          {selectionSummary!.applicationCount === 1 ? '' : 's'} ready to block
        </Text>
      ) : (
        <Pressable
          onPress={() => router.push('/selection?returnTo=home')}
          disabled={isBusy}
          style={({ pressed }) => [pressed && styles.linkPressed]}
        >
          <Text style={styles.readinessBlocked}>Set up your blocklist first</Text>
        </Pressable>
      )}

      {startBlockedMessage ? (
        <Text style={styles.blockedMessage}>{startBlockedMessage}</Text>
      ) : null}

      <View style={styles.ctaSection}>
        <AppButton
          label="Start focus session"
          onPress={handleStartSession}
          disabled={isBusy || !selectionHasEntries}
          variant="primary"
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push('/selection?returnTo=home')}
          disabled={isBusy}
          style={({ pressed }) => [pressed && styles.linkPressed]}
        >
          <Text style={styles.footerLink}>Edit blocklist</Text>
        </Pressable>
        <Text style={styles.footerSeparator}>·</Text>
        <Pressable
          onPress={() => router.push('/history')}
          disabled={isBusy}
          style={({ pressed }) => [pressed && styles.linkPressed]}
        >
          <Text style={styles.footerLink}>History</Text>
        </Pressable>
        <Text style={styles.footerSeparator}>·</Text>
        <Pressable
          onPress={() => router.push('/settings')}
          disabled={isBusy}
          style={({ pressed }) => [pressed && styles.linkPressed]}
        >
          <Text style={styles.footerLink}>Settings</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    fontFamily: fontFamilies.sans.regular,
  },
  durationSection: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  durationDisplay: {
    color: colors.foreground,
    fontSize: 64,
    fontFamily: fontFamilies.mono.medium,
    fontWeight: '700',
    letterSpacing: -2,
    textAlign: 'center',
  },
  readinessReady: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    fontFamily: fontFamilies.sans.regular,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  readinessBlocked: {
    color: colors.foreground,
    fontSize: typography.bodySmall,
    fontFamily: fontFamilies.sans.medium,
    textAlign: 'center',
    marginTop: spacing.lg,
    textDecorationLine: 'underline',
  },
  blockedMessage: {
    color: colors.mutedForeground,
    fontSize: typography.bodySmall,
    fontFamily: fontFamilies.sans.regular,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  ctaSection: {
    marginTop: spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  footerLink: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    fontFamily: fontFamilies.sans.medium,
  },
  footerSeparator: {
    color: colors.mutedForeground,
    fontSize: typography.bodySmall,
  },
  linkPressed: {
    opacity: 0.7,
  },
  error: {
    color: colors.danger,
    fontSize: typography.bodySmall,
    fontFamily: fontFamilies.sans.regular,
    marginTop: spacing.md,
  },
});
