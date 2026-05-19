import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { applyShield, clearShield, getSelectionSummary } from '@/services/focusControl';
import { appendSessionHistoryEntry, loadSessionHistory } from '@/services/sessionHistoryStorage';
import {
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from '@/services/sessionStorage';
import { colors, fontFamilies, radius, spacing, typography } from '@/theme';
import type { FocusSession, FocusSessionDurationMinutes } from '@/types/session';
import type { EmergencyUnlockReason } from '@/types/sessionHistory';

import type { TunnelSelectionSummary } from '../../modules/tunnel-focus-control';

const DURATION_OPTIONS: FocusSessionDurationMinutes[] = [30, 60, 90];

const HOLD_TO_UNLOCK_DURATION_MS = 5000;

type UnlockStep = 'idle' | 'hold' | 'reason' | 'delay' | 'unlocking';

const UNLOCK_REASON_OPTIONS: {
  value: EmergencyUnlockReason;
  label: string;
  hint: string;
}[] = [
  {
    value: 'urgent',
    label: 'Something urgent',
    hint: 'I need access for a real reason.',
  },
  {
    value: 'distracted',
    label: 'I am distracted',
    hint: 'I want to leave the tunnel.',
  },
  {
    value: 'wrong_blocklist',
    label: 'Wrong blocklist',
    hint: 'I blocked something I actually need.',
  },
  {
    value: 'other',
    label: 'Other',
    hint: 'Different reason.',
  },
];

function getUnlockDelaySeconds(attemptCount: number): number {
  if (attemptCount <= 1) {
    return 10;
  }

  if (attemptCount === 2) {
    return 30;
  }

  return 60;
}

function formatHoldProgress(progressMs: number): string {
  const seconds = Math.min(progressMs / 1000, HOLD_TO_UNLOCK_DURATION_MS / 1000);
  return seconds.toFixed(1);
}
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function clearShieldWithRetry(): Promise<{ ok: boolean; result: string; attempts: number }> {
  let lastResult = 'unknown';
  const maxAttempts = 3;
  const timeoutMs = 2500;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await Promise.race<string>([
        clearShield(),
        sleep(timeoutMs).then(() => {
          throw new Error(`clearShield timeout after ${timeoutMs}ms`);
        }),
      ]);
      lastResult = result;

      if (result === 'cleared') {
        return { ok: true, result, attempts: attempt };
      }
    } catch (err) {
      lastResult = err instanceof Error ? err.message : JSON.stringify(err);
    }

    if (attempt < maxAttempts) {
      await sleep(300);
    }
  }

  return { ok: false, result: lastResult, attempts: maxAttempts };
}

export default function FocusSessionScreen() {
  const [selectedDuration, setSelectedDuration] = useState<FocusSessionDurationMinutes>(30);
  const [session, setSession] = useState<FocusSession | null>(null);
  const [selectionSummary, setSelectionSummary] = useState<TunnelSelectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastAction, setLastAction] = useState('No action yet.');
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  const [unlockStep, setUnlockStep] = useState<UnlockStep>('idle');
  const [unlockCountdown, setUnlockCountdown] = useState(0);
  const [holdProgressMs, setHoldProgressMs] = useState(0);
  const [selectedUnlockReason, setSelectedUnlockReason] = useState<EmergencyUnlockReason | null>(
    null,
  );

  const holdStartedAtRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdCompletedRef = useRef(false);
  const isFinishingSessionRef = useRef(false);
  const isEmergencyUnlockingRef = useRef(false);
  const unlockRunIdRef = useRef(0);

  const isSessionActive = session?.status === 'active';

  function clearHoldTimer() {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }

    holdStartedAtRef.current = null;
  }

  function resetUnlockFlow(reason = 'unknown') {
    console.log('[unlock] resetUnlockFlow', reason);
    unlockRunIdRef.current += 1;

    clearHoldTimer();
    setUnlockStep('idle');
    setUnlockCountdown(0);
    setHoldProgressMs(0);
    setSelectedUnlockReason(null);
    holdCompletedRef.current = false;
  }

  function handleOpenEmergencyUnlock() {
    console.log('[unlock] handleOpenEmergencyUnlock');
    setError('');
    setUnlockStep('hold');
    setHoldProgressMs(0);
    setSelectedUnlockReason(null);
    holdCompletedRef.current = false;
    setLastAction('Emergency unlock ritual started.');
  }

  function completeHoldToUnlock() {
    console.log('[unlock] completeHoldToUnlock');
    holdCompletedRef.current = true;
    clearHoldTimer();
    setHoldProgressMs(HOLD_TO_UNLOCK_DURATION_MS);
    setUnlockStep('reason');
    setLastAction('Hold completed. Choose why you want to leave the tunnel.');
  }

  function handleHoldStart() {
    console.log('[unlock] handleHoldStart');
    setError('');
    clearHoldTimer();

    holdCompletedRef.current = false;

    const startedAt = Date.now();
    holdStartedAtRef.current = startedAt;

    setHoldProgressMs(0);
    setLastAction('Keep holding to unlock.');

    holdIntervalRef.current = setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      const nextProgressMs = Math.min(elapsedMs, HOLD_TO_UNLOCK_DURATION_MS);

      setHoldProgressMs(nextProgressMs);

      if (nextProgressMs >= HOLD_TO_UNLOCK_DURATION_MS) {
        completeHoldToUnlock();
      }
    }, 100);
  }

  function handleHoldEnd() {
    console.log('[unlock] handleHoldEnd');
    if (holdCompletedRef.current) {
      return;
    }

    clearHoldTimer();
    setHoldProgressMs(0);
    setUnlockStep('hold');
    setLastAction('Hold cancelled. Keep holding if you really want to unlock.');
  }
  async function runUnlockDelayAndUnlock(
    activeSession: FocusSession,
    reason: EmergencyUnlockReason,
    delaySeconds: number,
  ) {
    console.log('[unlock] runUnlockDelayAndUnlock start', {
      reason,
      delaySeconds,
      attempt: activeSession.unlockAttemptCount ?? 1,
    });
    const runId = unlockRunIdRef.current + 1;
    unlockRunIdRef.current = runId;

    setUnlockStep('delay');
    setLastAction(`Unlock attempt ${activeSession.unlockAttemptCount ?? 1}. Delay started.`);

    for (let secondsLeft = delaySeconds; secondsLeft > 0; secondsLeft -= 1) {
      if (unlockRunIdRef.current !== runId) {
        return;
      }

      setUnlockCountdown(secondsLeft);
      console.log('[unlock] delay tick', secondsLeft);
      await sleep(1000);
    }

    if (unlockRunIdRef.current !== runId) {
      console.log('[unlock] delay aborted before start of unlock', {
        expectedRunId: runId,
        currentRunId: unlockRunIdRef.current,
      });
      return;
    }

    setUnlockCountdown(0);
    setUnlockStep('unlocking');
    console.log('[unlock] delay complete, calling performEmergencyUnlock');

    await performEmergencyUnlock(activeSession, reason);
  }

  async function handleSelectUnlockReason(reason: EmergencyUnlockReason) {
    console.log('[unlock] handleSelectUnlockReason', reason);
    if (!session || session.status !== 'active') {
      return;
    }

    try {
      setError('');
      setSelectedUnlockReason(reason);

      const history = await loadSessionHistory();
      const previousEmergencyUnlockCount = history.filter(
        (entry) => entry.outcome === 'emergency_unlock',
      ).length;
      const nextAttemptCount = previousEmergencyUnlockCount + 1;
      const nextDelay = getUnlockDelaySeconds(nextAttemptCount);

      const updatedSession: FocusSession = {
        ...session,
        unlockAttemptCount: nextAttemptCount,
      };

      await saveActiveSession(updatedSession);

      setSession(updatedSession);

      void runUnlockDelayAndUnlock(updatedSession, reason, nextDelay);
    } catch (err) {
      console.log('handleSelectUnlockReason error', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    }
  }

  function handleCancelEmergencyUnlock() {
    if (unlockStep === 'delay' || unlockStep === 'unlocking') {
      console.log('[unlock] cancel ignored during critical unlock phase', { unlockStep });
      setLastAction('Unlock in progress. Cancel is disabled in this phase.');
      return;
    }

    resetUnlockFlow('user_cancel');
    setLastAction('Emergency unlock cancelled.');
  }

  async function performEmergencyUnlock(
    activeSession: FocusSession,
    unlockReason: EmergencyUnlockReason,
  ) {
    if (isEmergencyUnlockingRef.current) {
      return;
    }

    isEmergencyUnlockingRef.current = true;

    try {
      setLoading(true);
      setError('');
      setLastAction('Unlocking tunnel...');

      console.log('[unlock] starting emergency unlock');
      console.log('[unlock] reason:', unlockReason);
      console.log('[unlock] attempt count:', activeSession.unlockAttemptCount ?? 1);

      const clearShieldStatus = await clearShieldWithRetry();
      console.log('[unlock] clearShield result:', clearShieldStatus.result);
      console.log('[unlock] clearShield attempts:', clearShieldStatus.attempts);

      setSession(null);
      resetUnlockFlow('emergency_unlock_success_or_terminal');

      try {
        await clearActiveSession();
        console.log('[unlock] active session cleared');
      } catch (err) {
        console.log('[unlock] clearActiveSession error:', err);
      }

      try {
        await appendSessionHistoryEntry({
          id: `${activeSession.id}-emergency-unlock`,
          startedAt: activeSession.startedAt,
          endedAt: Date.now(),
          durationMinutes: activeSession.durationMinutes,
          outcome: 'emergency_unlock',
          unlockReason,
          unlockAttemptCount: activeSession.unlockAttemptCount ?? 1,
        });
        console.log('[unlock] history entry saved');
      } catch (err) {
        console.log('[unlock] appendSessionHistoryEntry error:', err);
      }

      if (clearShieldStatus.ok) {
        setLastAction(`Emergency unlock performed. Clear shield result: ${clearShieldStatus.result}`);
      } else {
        setError(
          `Shield clear did not confirm success after ${clearShieldStatus.attempts} attempts: ${clearShieldStatus.result}`,
        );
        setLastAction('Emergency unlock ended session, but shield clear was not confirmed.');
      }
    } catch (err) {
      console.log('[unlock] performEmergencyUnlock error:', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
      setLastAction('Emergency unlock failed. Try again.');
      setUnlockStep('reason');
    } finally {
      isEmergencyUnlockingRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    return () => {
      clearHoldTimer();
    };
  }, []);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);
        setError('');

        const [storedSession, nativeSelectionSummary] = await Promise.all([
          loadActiveSession(),
          getSelectionSummary(),
        ]);

        setSelectionSummary(nativeSelectionSummary);

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
          resetUnlockFlow('initialize_expired_session');
          setLastAction('Stored session had already ended. Shield cleared.');
          return;
        }

        const normalizedSession: FocusSession = {
          ...storedSession,
          unlockAttemptCount: storedSession.unlockAttemptCount ?? 0,
        };

        setSession(normalizedSession);
        setSelectedDuration(normalizedSession.durationMinutes);
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
        resetUnlockFlow('session_finished');
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
      resetUnlockFlow('start_session');

      const nativeSelectionSummary = await getSelectionSummary();
      setSelectionSummary(nativeSelectionSummary);

      if (!nativeSelectionSummary.hasSelection) {
        setLastAction('No blocklist selected. Go to Current Selection first.');
        return;
      }

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
        unlockAttemptCount: 0,
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
            onPress={handleOpenEmergencyUnlock}
            disabled={loading}
            variant="secondary"
          />
        ) : null}

        {isSessionActive && unlockStep === 'hold' ? (
          <Card>
            <Text style={styles.warningTitle}>Hold to unlock</Text>
            <Text style={styles.warningBody}>
              Keep holding for 5 seconds. Releasing early cancels the unlock.
            </Text>

            <Pressable
              onPressIn={handleHoldStart}
              onPressOut={handleHoldEnd}
              disabled={loading}
              style={({ pressed }) => [
                styles.holdButton,
                pressed && styles.holdButtonPressed,
                loading && styles.durationChipDisabled,
              ]}
            >
              <Text style={styles.holdButtonText}>Hold to unlock</Text>
              <Text style={styles.holdProgressText}>
                {formatHoldProgress(holdProgressMs)} / 5.0s
              </Text>
            </Pressable>

            <AppButton
              label="Cancel"
              onPress={handleCancelEmergencyUnlock}
              disabled={loading}
              variant="secondary"
            />
          </Card>
        ) : null}

        {isSessionActive && unlockStep === 'reason' ? (
          <Card>
            <Text style={styles.warningTitle}>Why are you leaving the tunnel?</Text>
            <Text style={styles.warningBody}>Choose a reason before the unlock delay starts.</Text>

            <View style={styles.reasonGrid}>
              {UNLOCK_REASON_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    void handleSelectUnlockReason(option.value);
                  }}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.reasonOption,
                    pressed && styles.reasonOptionPressed,
                    loading && styles.durationChipDisabled,
                  ]}
                >
                  <Text style={styles.reasonLabel}>{option.label}</Text>
                  <Text style={styles.reasonHint}>{option.hint}</Text>
                </Pressable>
              ))}
            </View>

            <AppButton
              label="Cancel"
              onPress={handleCancelEmergencyUnlock}
              disabled={loading}
              variant="secondary"
            />
          </Card>
        ) : null}

        {isSessionActive && unlockStep === 'delay' ? (
          <Card>
            <Text style={styles.warningTitle}>Unlock delay</Text>
            <Text style={styles.warningBody}>
              Unlocking in {unlockCountdown} second{unlockCountdown === 1 ? '' : 's'}...
            </Text>
            <Text style={styles.delayText}>
              Attempt {session?.unlockAttemptCount ?? 1}. The delay increases when you try again.
            </Text>
            <Text style={styles.warningBody}>Unlock cannot be cancelled during this countdown.</Text>
          </Card>
        ) : null}

        {isSessionActive && unlockStep === 'unlocking' ? (
          <Card>
            <Text style={styles.warningTitle}>Unlocking tunnel</Text>
            <Text style={styles.warningBody}>
              Clearing the shield and ending the current session...
            </Text>
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
  holdButton: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { gap: spacing.xs } : {}),
  },
  holdButtonPressed: {
    opacity: 0.85,
  },
  holdButtonText: {
    color: colors.foreground,
    fontSize: typography.body,
    fontWeight: '700',
  },
  holdProgressText: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    fontFamily: fontFamilies.mono.medium,
  },
  reasonGrid: {
    ...(Platform.OS === 'web' ? { gap: spacing.sm } : {}),
  },
  reasonOption: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reasonOptionPressed: {
    opacity: 0.85,
    borderColor: colors.foreground,
  },
  reasonLabel: {
    color: colors.foreground,
    fontSize: typography.body,
    fontWeight: '700',
  },
  reasonHint: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  delayText: {
    color: colors.mutedForeground,
    fontSize: typography.bodySmall,
    lineHeight: 22,
  },
});
