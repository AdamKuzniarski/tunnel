import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { Screen } from '@/components/ui/Screen';
import { appendSessionHistoryEntry } from '@/services/sessionHistoryStorage';
import {
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from '@/services/sessionStorage';
import { clearShieldWithRetry } from '@/services/shieldClear';
import { colors, fontFamilies, radius, spacing, typography } from '@/theme';
import type { FocusSession, PendingEmergencyUnlock } from '@/types/session';
import type { EmergencyUnlockReason } from '@/types/sessionHistory';

const HOLD_TO_UNLOCK_DURATION_MS = 5000;

type UnlockStep = 'idle' | 'hold' | 'reason' | 'delay' | 'unlocking';

const UNLOCK_REASON_OPTIONS: {
  value: EmergencyUnlockReason;
  label: string;
}[] = [
  { value: 'urgent', label: 'Something urgent' },
  { value: 'distracted', label: "I'm distracted" },
  { value: 'wrong_blocklist', label: 'Wrong blocklist' },
  { value: 'other', label: 'Other' },
];

const UNLOCK_REASON_VALUES = new Set<EmergencyUnlockReason>(
  UNLOCK_REASON_OPTIONS.map((option) => option.value),
);

function getUnlockDelaySeconds(attemptCount: number): number {
  if (attemptCount <= 1) {
    return 10;
  }

  if (attemptCount === 2) {
    return 30;
  }

  return 60;
}

function getNextUnlockAttemptCount(session: FocusSession): number {
  return (session.unlockAttemptCount ?? 0) + 1;
}

function formatHoldProgress(progressMs: number): string {
  const seconds = Math.min(progressMs / 1000, HOLD_TO_UNLOCK_DURATION_MS / 1000);
  return seconds.toFixed(1);
}
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizePendingEmergencyUnlock(
  pending: FocusSession['pendingEmergencyUnlock'],
): PendingEmergencyUnlock | undefined {
  if (!pending) {
    return undefined;
  }

  if (!UNLOCK_REASON_VALUES.has(pending.reason)) {
    return undefined;
  }

  if (
    !Number.isFinite(pending.delaySeconds) ||
    !Number.isFinite(pending.startedAt) ||
    !Number.isFinite(pending.unlockAt)
  ) {
    return undefined;
  }

  return pending;
}

function normalizeLoadedSession(session: FocusSession): FocusSession {
  return {
    ...session,
    unlockAttemptCount: session.unlockAttemptCount ?? 0,
    pendingEmergencyUnlock: normalizePendingEmergencyUnlock(session.pendingEmergencyUnlock),
  };
}

export default function FocusSessionScreen() {
  const router = useRouter();
  const [session, setSession] = useState<FocusSession | null>(null);
  const [loading, setLoading] = useState(true);
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
  }

  function completeHoldToUnlock() {
    console.log('[unlock] completeHoldToUnlock');
    holdCompletedRef.current = true;
    clearHoldTimer();
    setHoldProgressMs(HOLD_TO_UNLOCK_DURATION_MS);
    setUnlockStep('reason');
  }

  function handleHoldStart() {
    console.log('[unlock] handleHoldStart');
    setError('');
    clearHoldTimer();

    holdCompletedRef.current = false;

    const startedAt = Date.now();
    holdStartedAtRef.current = startedAt;

    setHoldProgressMs(0);
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
  }
  async function runUnlockDelayAndUnlock(
    activeSession: FocusSession,
    pendingUnlock: PendingEmergencyUnlock,
  ) {
    const { delaySeconds, reason, unlockAt } = pendingUnlock;
    console.log('[unlock] runUnlockDelayAndUnlock start', {
      reason,
      delaySeconds,
      attempt: activeSession.unlockAttemptCount ?? 0,
      unlockAt,
    });
    const runId = unlockRunIdRef.current + 1;
    unlockRunIdRef.current = runId;

    setUnlockStep('delay');
    setSelectedUnlockReason(reason);
    while (true) {
      if (unlockRunIdRef.current !== runId) {
        return;
      }

      const remainingMs = unlockAt - Date.now();
      if (remainingMs <= 0) {
        break;
      }

      const secondsLeft = Math.max(1, Math.ceil(remainingMs / 1000));
      setUnlockCountdown(secondsLeft);
      console.log('[unlock] delay tick', secondsLeft);
      await sleep(Math.min(1000, remainingMs));
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

      const nextAttemptCount = getNextUnlockAttemptCount(session);
      const nextDelay = getUnlockDelaySeconds(nextAttemptCount);
      const unlockDelayStartedAt = Date.now();

      const updatedSession: FocusSession = {
        ...session,
        unlockAttemptCount: nextAttemptCount,
        pendingEmergencyUnlock: {
          reason,
          delaySeconds: nextDelay,
          startedAt: unlockDelayStartedAt,
          unlockAt: unlockDelayStartedAt + nextDelay * 1000,
        },
      };

      await saveActiveSession(updatedSession);

      setSession(updatedSession);

      if (updatedSession.pendingEmergencyUnlock) {
        void runUnlockDelayAndUnlock(updatedSession, updatedSession.pendingEmergencyUnlock);
      }
    } catch (err) {
      console.log('handleSelectUnlockReason error', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    }
  }

  function handleCancelEmergencyUnlock() {
    if (unlockStep === 'delay' || unlockStep === 'unlocking') {
      console.log('[unlock] cancel ignored during critical unlock phase', { unlockStep });
      return;
    }

    resetUnlockFlow('user_cancel');
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
      console.log('[unlock] starting emergency unlock');
      console.log('[unlock] reason:', unlockReason);
      console.log('[unlock] attempt count:', activeSession.unlockAttemptCount ?? 0);

      const clearShieldStatus = await clearShieldWithRetry();
      console.log('[unlock] clearShield result:', clearShieldStatus.result);
      console.log('[unlock] clearShield attempts:', clearShieldStatus.attempts);

      if (clearShieldStatus.ok) {
        setSession(null);
        resetUnlockFlow('emergency_unlock_success');

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
            unlockAttemptCount: activeSession.unlockAttemptCount,
          });
          console.log('[unlock] history entry saved');
        } catch (err) {
          console.log('[unlock] appendSessionHistoryEntry error:', err);
        }

        router.replace('/');
      } else {
        const sessionWithoutPendingUnlock: FocusSession = {
          ...activeSession,
          pendingEmergencyUnlock: undefined,
        };
        setSession(sessionWithoutPendingUnlock);
        try {
          await saveActiveSession(sessionWithoutPendingUnlock);
        } catch (err) {
          console.log('[unlock] saveActiveSession error after shield clear failure:', err);
        }
        setError(
          `Shield clear did not confirm success after ${clearShieldStatus.attempts} attempts: ${clearShieldStatus.result}`,
        );
        setUnlockStep('reason');
      }
    } catch (err) {
      console.log('[unlock] performEmergencyUnlock error:', err);
      setError(err instanceof Error ? err.message : JSON.stringify(err));
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

        const storedSession = await loadActiveSession();

        if (!storedSession) {
          router.replace('/');
          return;
        }

        if (storedSession.status !== 'active') {
          setSession(null);
          await clearActiveSession();
          router.replace('/');
          return;
        }

        if (Date.now() >= storedSession.endsAt) {
          const normalizedSession = normalizeLoadedSession(storedSession);
          const clearShieldStatus = await clearShieldWithRetry();

          console.log('[session] expired session clearShield result:', clearShieldStatus.result);
          console.log(
            '[session] expired session clearShield attempts:',
            clearShieldStatus.attempts,
          );

          if (!clearShieldStatus.ok) {
            setSession(normalizedSession);
            setError(
              `Shield clear did not confirm success after ${clearShieldStatus.attempts} attempts: ${clearShieldStatus.result}`,
            );
            return;
          }

          await clearActiveSession();
          setSession(null);
          resetUnlockFlow('initialize_expired_session');
          router.replace('/');
          return;
        }

        const normalizedSession = normalizeLoadedSession(storedSession);

        setSession(normalizedSession);

        if (normalizedSession.pendingEmergencyUnlock) {
          void runUnlockDelayAndUnlock(normalizedSession, normalizedSession.pendingEmergencyUnlock);
          return;
        }
      } catch (err) {
        console.log('initializeSession error', err);
        setError(err instanceof Error ? err.message : JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    };

    void initializeSession();
  }, [router]);

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
        const clearShieldStatus = await clearShieldWithRetry();

        console.log('[session] completed session clearShield result:', clearShieldStatus.result);
        console.log(
          '[session] completed session clearShield attempts:',
          clearShieldStatus.attempts,
        );

        if (!clearShieldStatus.ok) {
          setError(
            `Shield clear did not confirm success after ${clearShieldStatus.attempts} attempts: ${clearShieldStatus.result}`,
          );
          return;
        }

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
        router.replace('/');
      } catch (err) {
        console.log('finishSession error', err);
        setError(err instanceof Error ? err.message : JSON.stringify(err));
      } finally {
        isFinishingSessionRef.current = false;
      }
    };

    void finishSession();
  }, [now, router, session]);

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

  const selectedUnlockReasonLabel = useMemo(() => {
    if (!selectedUnlockReason) {
      return null;
    }

    return (
      UNLOCK_REASON_OPTIONS.find((option) => option.value === selectedUnlockReason)?.label ??
      selectedUnlockReason
    );
  }, [selectedUnlockReason]);

  const holdProgressFraction = Math.min(holdProgressMs / HOLD_TO_UNLOCK_DURATION_MS, 1);
  const needsScroll = unlockStep === 'reason';

  function renderSessionHero() {
    return (
      <View style={styles.centerRegion}>
        <Text style={styles.heroTimer}>{remainingText}</Text>
        <Text style={styles.sessionContext}>{session?.durationMinutes} min</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  function renderContinueFocusingButton() {
    return (
      <AppButton
        label="Continue focusing"
        onPress={handleCancelEmergencyUnlock}
        disabled={loading}
        variant="primary"
      />
    );
  }

  function renderRitualShell({
    children,
    showContinue = true,
    showFraming = true,
  }: {
    children?: ReactNode;
    showContinue?: boolean;
    showFraming?: boolean;
  }) {
    return (
      <View style={styles.ritualSection}>
        <Text style={styles.ritualEyebrow}>Emergency unlock</Text>
        {showFraming ? (
          <Text style={styles.ritualFraming}>
            You can unlock if you need to. Staying in the tunnel is the default.
          </Text>
        ) : null}
        {showContinue ? renderContinueFocusingButton() : null}
        {children ? <View style={styles.ritualPath}>{children}</View> : null}
      </View>
    );
  }

  function renderEmergencyUnlockEntry() {
    if (unlockStep !== 'idle') {
      return null;
    }

    return (
      <AppButton
        label="Emergency unlock"
        onPress={handleOpenEmergencyUnlock}
        disabled={loading}
        variant="danger"
      />
    );
  }

  function renderUnlockFlow() {
    if (unlockStep === 'hold') {
      return renderRitualShell({
        children: (
          <>
            <Text style={styles.stepTitle}>Hold to confirm</Text>
            <Text style={styles.stepSubline}>Hold for 5 seconds. Release to stop.</Text>

            <View style={styles.holdProgressTrack}>
              <View style={[styles.holdProgressFill, { flex: holdProgressFraction }]} />
              <View style={{ flex: 1 - holdProgressFraction }} />
            </View>

            <Pressable
              onPressIn={handleHoldStart}
              onPressOut={handleHoldEnd}
              disabled={loading}
              style={({ pressed }) => [
                styles.holdTarget,
                pressed && styles.holdTargetPressed,
                loading && styles.disabledControl,
              ]}
            >
              <Text style={styles.holdProgressText}>
                {formatHoldProgress(holdProgressMs)} / 5.0s
              </Text>
            </Pressable>
          </>
        ),
      });
    }

    if (unlockStep === 'reason') {
      return renderRitualShell({
        children: (
          <>
            <Text style={styles.stepTitle}>Why are you leaving?</Text>

            <View style={styles.reasonList}>
              {UNLOCK_REASON_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    void handleSelectUnlockReason(option.value);
                  }}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.reasonRow,
                    pressed && styles.reasonRowPressed,
                    loading && styles.disabledControl,
                  ]}
                >
                  <Text style={styles.reasonLabel}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ),
      });
    }

    if (unlockStep === 'delay') {
      const attemptCount = session?.unlockAttemptCount ?? 0;

      return (
        <View style={styles.ritualSection}>
          <Text style={styles.ritualEyebrow}>Emergency unlock</Text>
          <Text style={styles.delayCountdown}>{unlockCountdown}</Text>
          <Text style={styles.delayCountdownUnit}>
            second{unlockCountdown === 1 ? '' : 's'} remaining
          </Text>
          {selectedUnlockReasonLabel ? (
            <Text style={styles.flowMeta}>{selectedUnlockReasonLabel}</Text>
          ) : null}
          {attemptCount > 1 ? (
            <Text style={styles.flowMeta}>
              Attempt {attemptCount}. Longer wait on repeat unlocks.
            </Text>
          ) : null}
        </View>
      );
    }

    if (unlockStep === 'unlocking') {
      return (
        <View style={styles.ritualSection}>
          <Text style={styles.ritualEyebrow}>Emergency unlock</Text>
          <Text style={styles.stepSubline}>Clearing the shield and ending this session...</Text>
        </View>
      );
    }

    return null;
  }

  if (loading || !isSessionActive) {
    return (
      <Screen>
        <View style={styles.loadingRoot}>
          <Text style={styles.statusLabel}>Inside the tunnel</Text>
          {loading ? <Text style={styles.infoText}>Loading...</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll={needsScroll}>
      <View style={styles.root}>
        <View style={styles.topRegion}>
          <Text style={styles.statusLabel}>Inside the tunnel</Text>
        </View>

        {renderSessionHero()}

        <View style={styles.bottomRegion}>
          {renderUnlockFlow()}
          {renderEmergencyUnlockEntry()}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: spacing.lg,
  },
  loadingRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  topRegion: {
    paddingTop: spacing.sm,
  },
  statusLabel: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontFamily: fontFamilies.sans.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centerRegion: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroTimer: {
    color: colors.foreground,
    fontSize: 72,
    fontWeight: '700',
    letterSpacing: -3,
    fontFamily: fontFamilies.mono.medium,
  },
  sessionContext: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontFamily: fontFamilies.sans.regular,
  },
  bottomRegion: {
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  ritualSection: {
    gap: spacing.md,
  },
  ritualEyebrow: {
    color: colors.mutedForeground,
    fontSize: typography.label,
    fontFamily: fontFamilies.sans.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ritualFraming: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
    fontFamily: fontFamilies.sans.regular,
  },
  ritualPath: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  stepTitle: {
    color: colors.foreground,
    fontSize: typography.body,
    fontFamily: fontFamilies.sans.medium,
  },
  stepSubline: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    lineHeight: 22,
    fontFamily: fontFamilies.sans.regular,
  },
  flowMeta: {
    color: colors.mutedForeground,
    fontSize: typography.bodySmall,
    lineHeight: 22,
    fontFamily: fontFamilies.sans.regular,
  },
  delayCountdown: {
    color: colors.foreground,
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -2,
    fontFamily: fontFamilies.mono.medium,
    textAlign: 'center',
  },
  delayCountdownUnit: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    fontFamily: fontFamilies.sans.regular,
    textAlign: 'center',
    marginTop: -spacing.xs,
  },
  holdProgressTrack: {
    flexDirection: 'row',
    height: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  holdProgressFill: {
    backgroundColor: colors.danger,
    borderRadius: radius.sm,
  },
  holdTarget: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  holdTargetPressed: {
    opacity: 0.85,
    borderColor: colors.danger,
  },
  holdProgressText: {
    color: colors.foreground,
    fontSize: typography.body,
    fontFamily: fontFamilies.mono.medium,
  },
  reasonList: {
    gap: spacing.sm,
  },
  reasonRow: {
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  reasonRowPressed: {
    opacity: 0.85,
  },
  reasonLabel: {
    color: colors.foreground,
    fontSize: typography.body,
    fontFamily: fontFamilies.sans.medium,
  },
  disabledControl: {
    opacity: 0.5,
  },
  infoText: {
    color: colors.muted,
    fontSize: typography.bodySmall,
    fontFamily: fontFamilies.sans.regular,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.bodySmall,
    lineHeight: 22,
    fontFamily: fontFamilies.sans.regular,
    textAlign: 'center',
  },
});
