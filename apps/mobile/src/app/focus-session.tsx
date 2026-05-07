import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { applyShield, clearShield } from '@/services/focusControl';
import {
  clearActiveSession,
  loadActiveSession,
  loadSelectionSummary,
  saveActiveSession,
} from '@/services/sessionStorage';
import { appendSessionHistoryEntry } from '@/services/sessionHistoryStorage';
import type { FocusSession, FocusSessionDurationMinutes } from '@/types/session';
import type { TunnelSelectionSummary } from '../../modules/tunnel-focus-control';
import { colors, radius, spacing, typography, fontFamilies } from '@/theme';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { AppButton } from '@/components/ui/AppButton';

const DURATION_OPTIONS: FocusSessionDurationMinutes[] = [30, 60, 90];

export default function FocusSessionScreen() {
  const [selectedDuration, setSelectedDuration] = useState<FocusSessionDurationMinutes>(30);
  const [session, setSession] = useState<FocusSession | null>(null);
  const [selectionSummary, setSelectionSummary] = useState<TunnelSelectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastAction, setLastAction] = useState('No action yet.');
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [unlockStep, setUnlockStep] = useState<'idle' | 'armed' | 'countdown'>('idle');
  const [unlockCountdown, setUnlockCountdown] = useState(0);
  const isFinishingSessionRef = useRef(false);

  const isSessionActive = session?.status === 'active';

  function resetUnlockFlow() {
    setUnlockStep('idle');
    setUnlockCountdown(0);
  }

  function handleArmEmergencyUnlock() {
    setError('');
    setUnlockStep('armed');
    setLastAction('Emergency unlock armed. Confirm to start the delay.');
  }

  function handleStartEmergencyUnlockCountdown() {
    setError('');
    setUnlockStep('countdown');
    setUnlockCountdown(10);
    setLastAction('Emergency unlock countdown started.');
  }

  function handleCancelEmergencyUnlock() {
    resetUnlockFlow();
    setLastAction('Emergency unlock cancelled.');
  }

  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);
        setError('');

        const [storedSession, storedSelectionSummary] = await Promise.all([
          loadActiveSession(),
          loadSelectionSummary(),
        ]);

        setSelectionSummary(storedSelectionSummary);

        if (!storedSession) {
          setLastAction('No active session found.');
          return;
        }

        if (storedSession.status !== 'active') {
          setSession(null);
          await clearActiveSession();
          setLastAction('Stored session was not active and was cleared.');
          return;
        }

        if (Date.now() >= storedSession.endsAt) {
          await clearShield();
          await clearActiveSession();
          setSession(null);
          resetUnlockFlow();
          setLastAction('Stored session had already ended. Shield cleared.');
          return;
        }

        setSession(storedSession);
        setSelectedDuration(storedSession.durationMinutes);
        setLastAction('Restored active session from storage.');
      } catch (err) {
        console.log('initializeSession error', err);
        setError(err instanceof Error ? err.message : JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    };

    void initializeSession();
  }, []);

  useEffect(() => {
    if (!session || session.status !== 'active') {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session || session.status !== 'active') {
      return;
    }

    if (now < session.endsAt) {
      return;
    }

    if (isFinishingSessionRef.current) {
      return;
    }

    isFinishingSessionRef.current = true;
    const sessionToFinish = session;

    const finishSession = async () => {
      try {
        await clearShield();
        await clearActiveSession();

        await appendSessionHistoryEntry({
          id: `${sessionToFinish.id}-completed`,
          startedAt: sessionToFinish.startedAt,
          endedAt: Date.now(),
          durationMinutes: sessionToFinish.durationMinutes,
          outcome: 'completed',
        });

        setSession(null);
        resetUnlockFlow();
        setLastAction('Session finished. Shield cleared.');
      } catch (err) {
        console.log('finishSession error', err);
        setError(err instanceof Error ? err.message : JSON.stringify(err));
      } finally {
        isFinishingSessionRef.current = false;
      }
    };

    void finishSession();
  }, [now, session]);

  useEffect(() => {
    if (unlockStep !== 'countdown' || unlockCountdown <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      setUnlockCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [unlockStep, unlockCountdown]);

  useEffect(() => {
    if (unlockStep !== 'countdown' || unlockCountdown !== 0) {
      return;
    }

    if (!session || session.status !== 'active') {
      return;
    }

    const activeSession = session;

    async function performEmergencyUnlock() {
      try {
        setLoading(true);
        setError('');

        const result = await clearShield();
        await clearActiveSession();

        await appendSessionHistoryEntry({
          id: `${activeSession.id}-emergency-unlock`,
          startedAt: activeSession.startedAt,
          endedAt: Date.now(),
          durationMinutes: activeSession.durationMinutes,
          outcome: 'emergency_unlock',
        });

        setSession(null);
        resetUnlockFlow();
        setLastAction(`Emergency unlock performed. Clear shield result: ${result}`);
      } catch (err) {
        console.log('performEmergencyUnlock error', err);
        setError(err instanceof Error ? err.message : JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    }

    void performEmergencyUnlock();
  }, [session, unlockStep, unlockCountdown]);

  const remainingMs = useMemo(() => {
    if (!session || session.status !== 'active') {
      return 0;
    }

    return Math.max(session.endsAt - now, 0);
  }, [now, session]);

  const remainingText = useMemo(() => {
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [remainingMs]);

  async function handleStartSession() {
    try {
      setLoading(true);
      setError('');
      resetUnlockFlow();

      const shieldResult = await applyShield();

      if (shieldResult !== 'applied') {
        setLastAction(`Shield result: ${shieldResult}`);
        return;
      }

      const startedAt = Date.now();
      const nextSession: FocusSession = {
        id: String(startedAt),
        durationMinutes: selectedDuration,
        startedAt,
        endsAt: startedAt + selectedDuration * 60 * 1000,
        status: 'active',
      };

      await saveActiveSession(nextSession);
      setSession(nextSession);
      setNow(Date.now());
      setLastAction(`Started ${selectedDuration} minute session.`);
    } catch (err) {
      console.log('handleStartSession error', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }

  const selectionHasEntries = Boolean(selectionSummary?.hasSelection);

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>Session</Text>
          <Text style={styles.title}>Focus Session</Text>
          <Text style={styles.subtitle}>
            {isSessionActive
              ? 'You are inside the tunnel.'
              : 'Start a focused block with your current selection.'}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            isSessionActive ? styles.statusBadgeActive : styles.statusBadgeIdle,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              isSessionActive ? styles.statusBadgeTextActive : styles.statusBadgeTextIdle,
            ]}
          >
            {isSessionActive ? 'ACTIVE' : 'IDLE'}
          </Text>
        </View>
      </View>

      <Card>
        <Text style={styles.cardLabel}>Remaining time</Text>
        <Text style={styles.countdownText}>{isSessionActive ? remainingText : '-- : --'}</Text>
        <Text style={styles.cardHint}>
          {isSessionActive
            ? `Running ${session?.durationMinutes} minute session`
            : `Ready for a ${selectedDuration} minute session`}
        </Text>
      </Card>

      <Card>
        <Text style={styles.cardLabel}>Session length</Text>
        <View style={styles.durationRow}>
          {DURATION_OPTIONS.map((duration) => {
            const selected = selectedDuration === duration;

            return (
              <Pressable
                key={duration}
                onPress={() => setSelectedDuration(duration)}
                disabled={isSessionActive || loading}
                style={({ pressed }) => [
                  styles.durationChip,
                  selected && styles.durationChipSelected,
                  (isSessionActive || loading) && styles.durationChipDisabled,
                  pressed && !isSessionActive && !loading && styles.durationChipPressed,
                ]}
              >
                <Text
                  style={[styles.durationChipText, selected && styles.durationChipTextSelected]}
                >
                  {duration} min
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardLabel}>Current selection</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{selectionSummary?.applicationCount ?? 0}</Text>
            <Text style={styles.metricLabel}>Apps</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{selectionSummary?.categoryCount ?? 0}</Text>
            <Text style={styles.metricLabel}>Categories</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{selectionSummary?.webDomainCount ?? 0}</Text>
            <Text style={styles.metricLabel}>Web</Text>
          </View>
        </View>

        <Text style={styles.cardHint}>
          {selectionHasEntries
            ? 'Your current blocklist is ready for focus mode.'
            : 'No selection stored yet. Go to Current Selection first.'}
        </Text>
      </Card>

      <Card>
        <Text style={styles.cardLabel}>Status</Text>
        <Text style={styles.statusText}>{lastAction}</Text>

        {loading ? <Text style={styles.infoText}>Working...</Text> : null}
        {error ? <Text style={styles.errorText}>Error: {error}</Text> : null}
      </Card>

      <View style={styles.actionsSection}>
        <AppButton
          label="Start Session"
          onPress={handleStartSession}
          disabled={isSessionActive || loading || !selectionHasEntries}
          variant="primary"
        />

        {isSessionActive && unlockStep === 'idle' ? (
          <AppButton
            label="Emergency Unlock"
            onPress={handleArmEmergencyUnlock}
            disabled={loading}
            variant="secondary"
          />
        ) : null}

        {isSessionActive && unlockStep === 'armed' ? (
          <Card>
            <Text style={styles.warningTitle}>Emergency unlock armed</Text>
            <Text style={styles.warningBody}>
              This will clear the shield and end the current session.
            </Text>

            <AppButton
              label="Start 10-second unlock delay"
              onPress={handleStartEmergencyUnlockCountdown}
              disabled={loading}
              variant="danger"
            />

            <AppButton
              label="Cancel"
              onPress={handleCancelEmergencyUnlock}
              disabled={loading}
              variant="secondary"
            />
          </Card>
        ) : null}

        {isSessionActive && unlockStep === 'countdown' ? (
          <Card>
            <Text style={styles.warningTitle}>Emergency unlock countdown</Text>
            <Text style={styles.warningBody}>
              Unlocking in {unlockCountdown} second
              {unlockCountdown === 1 ? '' : 's'}...
            </Text>

            <AppButton
              label="Cancel unlock"
              onPress={handleCancelEmergencyUnlock}
              disabled={loading}
              variant="secondary"
            />
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: spacing['2xl'],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    ...(Platform.OS === 'web' ? { gap: spacing.md } : {}),
  },
  heroCopy: {
    flex: 1,
    ...(Platform.OS === 'web' ? { gap: spacing.xs } : {}),
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
    fontFamily: fontFamilies.sans.semibold,
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
    fontFamily: fontFamilies.sans.regular,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statusBadgeActive: {
    backgroundColor: colors.surface,
    borderColor: colors.success,
  },
  statusBadgeIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  statusBadgeText: {
    fontSize: typography.label,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: colors.success,
  },
  statusBadgeTextIdle: {
    color: colors.muted,
  },
  cardLabel: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontFamily: fontFamilies.sans.medium,
  },
  countdownText: {
    color: colors.foreground,
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -2,
    fontFamily: fontFamilies.mono.medium,
  },
  cardHint: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    ...(Platform.OS === 'web' ? { gap: spacing.sm } : {}),
  },
  durationChip: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  durationChipSelected: {
    borderColor: colors.foreground,
  },
  durationChipDisabled: {
    opacity: 0.5,
  },
  durationChipPressed: {
    opacity: 0.8,
  },
  durationChipText: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
  durationChipTextSelected: {
    color: colors.foreground,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    ...(Platform.OS === 'web' ? { gap: spacing.xs } : {}),
  },
  metricValue: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: '700',
    fontFamily: fontFamilies.mono.medium,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: typography.label,
    fontWeight: '600',
  },
  statusText: {
    color: colors.foreground,
    fontSize: typography.body,
    lineHeight: 24,
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
  actionsSection: {
    ...(Platform.OS === 'web' ? { gap: spacing.md } : {}),
  },
  warningTitle: {
    color: colors.foreground,
    fontSize: typography.sectionTitle,
    fontWeight: '600',
  },
  warningBody: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
  },
});
