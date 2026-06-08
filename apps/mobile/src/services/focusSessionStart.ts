import {
  applyShield,
  clearShield,
  getSelectionSummary,
  startSessionMonitoring,
  stopSessionMonitoring,
} from '@/services/focusControl';
import { saveActiveSession } from '@/services/sessionStorage';
import type { FocusSession, FocusSessionDurationMinutes } from '@/types/session';

export type StartFocusSessionResult =
  | { ok: true; session: FocusSession }
  | { ok: false; reason: 'no_selection' | 'shield_failed' | 'monitor_failed'; detail?: string };

export async function startFocusSession(
  durationMinutes: FocusSessionDurationMinutes,
): Promise<StartFocusSessionResult> {
  const nativeSelectionSummary = await getSelectionSummary();

  if (!nativeSelectionSummary.hasSelection) {
    return { ok: false, reason: 'no_selection' };
  }

  const startedAt = Date.now();
  const session: FocusSession = {
    id: String(startedAt),
    durationMinutes,
    startedAt,
    endsAt: startedAt + durationMinutes * 60 * 1000,
    status: 'active',
    unlockAttemptCount: 0,
  };

  const shieldResult = await applyShield();

  if (shieldResult === 'noSelection') {
    return { ok: false, reason: 'no_selection' };
  }

  if (shieldResult !== 'applied') {
    return { ok: false, reason: 'shield_failed', detail: shieldResult };
  }

  const monitorResult = await startSessionMonitoring(session.endsAt);

  if (monitorResult !== 'scheduled') {
    await clearShield();
    return { ok: false, reason: 'monitor_failed', detail: monitorResult };
  }

  try {
    await saveActiveSession(session);
  } catch (err) {
    await stopSessionMonitoring();
    await clearShield();
    throw err;
  }

  return { ok: true, session };
}
