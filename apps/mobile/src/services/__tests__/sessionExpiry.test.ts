import { stopSessionMonitoring } from '@/services/focusControl';
import { clearActiveSession, loadActiveSession } from '@/services/sessionStorage';
import { clearShieldWithRetry } from '@/services/shieldClear';
import type { FocusSession } from '@/types/session';

import { reconcileExpiredActiveSession } from '../sessionExpiry';

jest.mock('@/services/focusControl', () => ({
  stopSessionMonitoring: jest.fn(),
}));

jest.mock('@/services/sessionStorage', () => ({
  clearActiveSession: jest.fn(),
  loadActiveSession: jest.fn(),
}));

jest.mock('@/services/shieldClear', () => ({
  clearShieldWithRetry: jest.fn(),
}));

const mockStopSessionMonitoring = jest.mocked(stopSessionMonitoring);
const mockClearActiveSession = jest.mocked(clearActiveSession);
const mockLoadActiveSession = jest.mocked(loadActiveSession);
const mockClearShieldWithRetry = jest.mocked(clearShieldWithRetry);

const now = 1_700_000_000_000;
const successfulShieldClear = { ok: true, result: 'cleared', attempts: 1 };
const failedShieldClear = { ok: false, result: 'unsupported', attempts: 3 };

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
    mockClearShieldWithRetry.mockResolvedValue(successfulShieldClear);
    mockStopSessionMonitoring.mockResolvedValue('stopped');
    mockClearActiveSession.mockResolvedValue(undefined);
    mockLoadActiveSession.mockResolvedValue(null);
  });

  it('returns not expired when there is no stored session', async () => {
    mockLoadActiveSession.mockResolvedValue(null);

    await expect(reconcileExpiredActiveSession(now)).resolves.toEqual({ expired: false });

    expect(mockClearShieldWithRetry).not.toHaveBeenCalled();
    expect(mockStopSessionMonitoring).not.toHaveBeenCalled();
    expect(mockClearActiveSession).not.toHaveBeenCalled();
  });

  it('returns not expired when the stored session is not active', async () => {
    mockLoadActiveSession.mockResolvedValue(activeSession({ status: 'completed', endsAt: now }));

    await expect(reconcileExpiredActiveSession(now)).resolves.toEqual({ expired: false });

    expect(mockClearShieldWithRetry).not.toHaveBeenCalled();
    expect(mockStopSessionMonitoring).not.toHaveBeenCalled();
    expect(mockClearActiveSession).not.toHaveBeenCalled();
  });

  it('returns not expired when the active session ends in the future', async () => {
    mockLoadActiveSession.mockResolvedValue(activeSession({ endsAt: now + 1_000 }));

    await expect(reconcileExpiredActiveSession(now)).resolves.toEqual({ expired: false });

    expect(mockClearShieldWithRetry).not.toHaveBeenCalled();
    expect(mockStopSessionMonitoring).not.toHaveBeenCalled();
    expect(mockClearActiveSession).not.toHaveBeenCalled();
  });

  it('clears the shield for an expired active session', async () => {
    mockLoadActiveSession.mockResolvedValue(activeSession({ endsAt: now }));

    await expect(reconcileExpiredActiveSession(now)).resolves.toEqual({
      expired: true,
      clearShieldStatus: successfulShieldClear,
    });

    expect(mockClearShieldWithRetry).toHaveBeenCalledTimes(1);
  });

  it('stops monitoring after a successful shield clear', async () => {
    mockLoadActiveSession.mockResolvedValue(activeSession({ endsAt: now }));

    await reconcileExpiredActiveSession(now);

    expect(mockStopSessionMonitoring).toHaveBeenCalledTimes(1);
  });

  it('clears active session storage after a successful shield clear', async () => {
    mockLoadActiveSession.mockResolvedValue(activeSession({ endsAt: now }));

    await reconcileExpiredActiveSession(now);

    expect(mockClearActiveSession).toHaveBeenCalledTimes(1);
  });

  it('keeps the session recoverable when shield clearing fails', async () => {
    mockLoadActiveSession.mockResolvedValue(activeSession({ endsAt: now }));
    mockClearShieldWithRetry.mockResolvedValue(failedShieldClear);

    await expect(reconcileExpiredActiveSession(now)).resolves.toEqual({
      expired: true,
      clearShieldStatus: failedShieldClear,
    });

    expect(mockClearShieldWithRetry).toHaveBeenCalledTimes(1);
    expect(mockStopSessionMonitoring).not.toHaveBeenCalled();
    expect(mockClearActiveSession).not.toHaveBeenCalled();
  });

  it('swallows stop monitoring errors and still clears active session storage', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    mockLoadActiveSession.mockResolvedValue(activeSession({ endsAt: now }));
    mockStopSessionMonitoring.mockRejectedValue(new Error('monitor stop failed'));

    try {
      await expect(reconcileExpiredActiveSession(now)).resolves.toEqual({
        expired: true,
        clearShieldStatus: successfulShieldClear,
      });

      expect(mockStopSessionMonitoring).toHaveBeenCalledTimes(1);
      expect(mockClearActiveSession).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'stopSessionMonitoring error:',
        expect.any(Error),
      );
    } finally {
      consoleLogSpy.mockRestore();
    }
  });
});
