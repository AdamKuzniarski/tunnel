import { applyShield, getSelectionSummary } from '@/services/focusControl';
import { saveActiveSession } from '@/services/sessionStorage';
import type { FocusSession } from '@/types/session';

import { startFocusSession } from '../focusSessionStart';

// Native Screen Time behavior is covered by the platform module; this test owns the JS flow.
jest.mock('@/services/focusControl', () => ({
  applyShield: jest.fn(),
  getSelectionSummary: jest.fn(),
}));

jest.mock('@/services/sessionStorage', () => ({
  saveActiveSession: jest.fn(),
}));

const mockApplyShield = jest.mocked(applyShield);
const mockGetSelectionSummary = jest.mocked(getSelectionSummary);
const mockSaveActiveSession = jest.mocked(saveActiveSession);

describe('startFocusSession', () => {
  const now = 1_700_000_000_000;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    mockSaveActiveSession.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns no_selection when no blocklist exists', async () => {
    mockGetSelectionSummary.mockResolvedValue({
      hasSelection: false,
      applicationCount: 0,
      categoryCount: 0,
      webDomainCount: 0,
    });

    await expect(startFocusSession(30)).resolves.toEqual({
      ok: false,
      reason: 'no_selection',
    });

    expect(mockApplyShield).not.toHaveBeenCalled();
    expect(mockSaveActiveSession).not.toHaveBeenCalled();
  });

  it('returns shield_failed when the native shield is not applied', async () => {
    mockGetSelectionSummary.mockResolvedValue({
      hasSelection: true,
      applicationCount: 1,
      categoryCount: 0,
      webDomainCount: 0,
    });
    mockApplyShield.mockResolvedValue('noSelection');

    await expect(startFocusSession(60)).resolves.toEqual({
      ok: false,
      reason: 'shield_failed',
      detail: 'noSelection',
    });

    expect(mockApplyShield).toHaveBeenCalledTimes(1);
    expect(mockSaveActiveSession).not.toHaveBeenCalled();
  });

  it('creates and saves an active session when the native shield is applied', async () => {
    mockGetSelectionSummary.mockResolvedValue({
      hasSelection: true,
      applicationCount: 2,
      categoryCount: 1,
      webDomainCount: 0,
    });
    mockApplyShield.mockResolvedValue('applied');

    const result = await startFocusSession(90);
    const expectedSession: FocusSession = {
      id: String(now),
      durationMinutes: 90,
      startedAt: now,
      endsAt: now + 90 * 60 * 1000,
      status: 'active',
      unlockAttemptCount: 0,
    };

    expect(result).toEqual({
      ok: true,
      session: expectedSession,
    });
    expect(mockSaveActiveSession).toHaveBeenCalledWith(expectedSession);
    expect(mockSaveActiveSession).toHaveBeenCalledTimes(1);
  });
});
