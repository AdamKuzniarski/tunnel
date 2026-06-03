import type { FocusSession, PendingEmergencyUnlock } from '@/types/session';
import type { EmergencyUnlockReason } from '@/types/sessionHistory';

export const HOLD_TO_UNLOCK_DURATION_MS = 5000;

const UNLOCK_REASON_VALUES = new Set<EmergencyUnlockReason>([
  'urgent',
  'distracted',
  'wrong_blocklist',
  'other',
]);

export function getUnlockDelaySeconds(attemptCount: number): number {
  if (attemptCount <= 1) {
    return 10;
  }

  if (attemptCount === 2) {
    return 30;
  }

  return 60;
}

export function getNextUnlockAttemptCount(session: FocusSession): number {
  return (session.unlockAttemptCount ?? 0) + 1;
}

export function formatHoldProgress(progressMs: number): string {
  const seconds = Math.min(progressMs / 1000, HOLD_TO_UNLOCK_DURATION_MS / 1000);
  return seconds.toFixed(1);
}

export function normalizePendingEmergencyUnlock(
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

export function normalizeLoadedSession(session: FocusSession): FocusSession {
  return {
    ...session,
    unlockAttemptCount: session.unlockAttemptCount ?? 0,
    pendingEmergencyUnlock: normalizePendingEmergencyUnlock(session.pendingEmergencyUnlock),
  };
}
