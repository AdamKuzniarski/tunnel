import { clearActiveSession, loadActiveSession } from '@/services/sessionStorage';
import { clearShieldWithRetry, type ClearShieldStatus } from '@/services/shieldClear';

type ExpiredSessionReconcileResult =
  | { expired: false }
  | { expired: true; clearShieldStatus: ClearShieldStatus };

export async function reconcileExpiredActiveSession(
  now = Date.now(),
): Promise<ExpiredSessionReconcileResult> {
  const storedSession = await loadActiveSession();

  if (storedSession?.status !== 'active' || storedSession.endsAt > now) {
    return { expired: false };
  }

  const clearShieldStatus = await clearShieldWithRetry();

  if (clearShieldStatus.ok) {
    await clearActiveSession();
  }

  return { expired: true, clearShieldStatus };
}
