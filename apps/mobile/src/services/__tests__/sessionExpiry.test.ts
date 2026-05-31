import { clearShield } from '@/services/focusControl';
import { clearActiveSession, loadActiveSession } from '@/services/sessionStorage';
import type { FocusSession } from '@/types/session';

import { reconcileExpiredActiveSession } from '../sessionExpiry';

jest.mock('@/services/focusControl', () => ({
  clearShield: jest.fn(),
}));

jest.mock('@/services/sessionStorage', () => ({
  clearActiveSession: jest.fn(),
  loadActiveSession: jest.fn(),
}));

const mockClearShield = jest.mocked(clearShield);
const mockClearActiveSession = jest.mocked(clearActiveSession);
const mockLoadActiveSession = jest.mocked(loadActiveSession);

const now = 1_700_000_000_000;

function activeSession(overrides: Partial<FocusSession> = {}): FocusSession {
  return {
    id: 'session-1',
    durationMinutes: 30,
    startedAt: now,
    endsAt: now + 30 * 60 * 1000,
    status: 'active',
    unlockAttemptCount: 0,
    ...overrides,
  };
}

describe('reconcileExpiredActiveSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClearShield.mockResolvedValue('cleared');
    mockClearActiveSession.mockResolvedValue(undefined);
    mockLoadActiveSession.mockResolvedValue(null);
  });

  it('does not clear anything when there is no expired active session', async () => {
    mockLoadActiveSession.mockResolvedValue(activeSession({ endsAt: now + 1_000 }));

    await expect(reconcileExpiredActiveSession(now)).resolves.toEqual({ expired: false });

    expect(mockClearShield).not.toHaveBeenCalled();
    expect(mockClearActiveSession).not.toHaveBeenCalled();
  });

  it('clears the shield and storage for an expired active session', async () => {
    mockLoadActiveSession.mockResolvedValue(activeSession({ endsAt: now }));

    await expect(reconcileExpiredActiveSession(now)).resolves.toEqual({
      expired: true,
      clearShieldStatus: { ok: true, result: 'cleared', attempts: 1 },
    });

    expect(mockClearShield).toHaveBeenCalledTimes(1);
    expect(mockClearActiveSession).toHaveBeenCalledTimes(1);
  });

  it('keeps the session recoverable when shield clearing fails', async () => {
    mockLoadActiveSession.mockResolvedValue(activeSession({ endsAt: now }));
    mockClearShield.mockResolvedValue('unsupported');

    await expect(reconcileExpiredActiveSession(now)).resolves.toEqual({
      expired: true,
      clearShieldStatus: { ok: false, result: 'unsupported', attempts: 3 },
    });

    expect(mockClearShield).toHaveBeenCalledTimes(3);
    expect(mockClearActiveSession).not.toHaveBeenCalled();
  });
});
