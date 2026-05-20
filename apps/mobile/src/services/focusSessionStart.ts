import { applyShield, getSelectionSummary } from '@/services/focusControl';
import { saveActiveSession } from '@/services/sessionStorage';
import type { FocusSession, FocusSessionDurationMinutes } from '@/types/session';

export type StartFocusSessionResult =
  | { ok: true; session: FocusSession }
  | { ok: false; reason: 'no_selection' | 'shield_failed'; detail?: string };

export async function startFocusSession(
  durationMinutes: FocusSessionDurationMinutes,
): Promise<StartFocusSessionResult> {
  const nativeSelectionSummary = await getSelectionSummary();

  if (!nativeSelectionSummary.hasSelection) {
    return { ok: false, reason: 'no_selection' };
  }

  const shieldResult = await applyShield();

  if (shieldResult !== 'applied') {
    return { ok: false, reason: 'shield_failed', detail: shieldResult };
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

  await saveActiveSession(session);

  return { ok: true, session };
}
