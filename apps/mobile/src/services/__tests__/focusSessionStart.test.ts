import {
  applyShield,
  clearShield,
  getSelectionSummary,
  startSessionMonitoring,
  stopSessionMonitoring,
} from '@/services/focusControl';
import { saveActiveSession } from '@/services/sessionStorage';
import type { FocusSession } from '@/types/session';

import { startFocusSession } from '../focusSessionStart';

// Native Screen Time behavior is covered by the platform module; this test owns the JS flow.
jest.mock('@/services/focusControl', () => ({
  applyShield: jest.fn(),
  clearShield: jest.fn(),
  getSelectionSummary: jest.fn(),
  startSessionMonitoring: jest.fn(),
  stopSessionMonitoring: jest.fn(),
}));

jest.mock('@/services/sessionStorage', () => ({
  saveActiveSession: jest.fn(),
}));

const mockApplyShield = jest.mocked(applyShield);
const mockClearShield = jest.mocked(clearShield);
const mockGetSelectionSummary = jest.mocked(getSelectionSummary);
const mockStartSessionMonitoring = jest.mocked(startSessionMonitoring);
const mockStopSessionMonitoring = jest.mocked(stopSessionMonitoring);
const mockSaveActiveSession = jest.mocked(saveActiveSession);

describe('startFocusSession', () => {
  const now = 1_700_000_000_000;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    mockClearShield.mockResolvedValue('cleared');
    mockSaveActiveSession.mockResolvedValue(undefined);
    mockStartSessionMonitoring.mockResolvedValue('scheduled');
    mockStopSessionMonitoring.mockResolvedValue('stopped');
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

  it('returns no_selection when the native shield reports no selection', async () => {
    mockGetSelectionSummary.mockResolvedValue({
      hasSelection: true,
      applicationCount: 1,
      categoryCount: 0,
      webDomainCount: 0,
    });
    mockApplyShield.mockResolvedValue('noSelection');

    await expect(startFocusSession(60)).resolves.toEqual({
      ok: false,
      reason: 'no_selection',
    });

    expect(mockApplyShield).toHaveBeenCalledTimes(1);
    expect(mockStartSessionMonitoring).not.toHaveBeenCalled();
    expect(mockSaveActiveSession).not.toHaveBeenCalled();
  });

  it('returns shield_failed when the native shield returns a non-noSelection error', async () => {
    mockGetSelectionSummary.mockResolvedValue({
      hasSelection: true,
      applicationCount: 1,
      categoryCount: 0,
      webDomainCount: 0,
    });
    mockApplyShield.mockResolvedValue('notDetermined');

    await expect(startFocusSession(60)).resolves.toEqual({
      ok: false,
      reason: 'shield_failed',
      detail: 'notDetermined',
    });

    expect(mockApplyShield).toHaveBeenCalledTimes(1);
    expect(mockStartSessionMonitoring).not.toHaveBeenCalled();
    expect(mockSaveActiveSession).not.toHaveBeenCalled();
  });

  it('clears the shield and returns monitor_failed when native monitoring is not scheduled', async () => {
    mockGetSelectionSummary.mockResolvedValue({
      hasSelection: true,
      applicationCount: 1,
      categoryCount: 0,
      webDomainCount: 0,
    });
    mockApplyShield.mockResolvedValue('applied');
    mockStartSessionMonitoring.mockResolvedValue('failed');

    await expect(startFocusSession(30)).resolves.toEqual({
      ok: false,
      reason: 'monitor_failed',
      detail: 'failed',
    });

    expect(mockStartSessionMonitoring).toHaveBeenCalledWith(now + 30 * 60 * 1000);
    expect(mockClearShield).toHaveBeenCalledTimes(1);
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
    expect(mockStartSessionMonitoring).toHaveBeenCalledWith(expectedSession.endsAt);
  });

  it('stops monitoring and clears the shield when saving the session fails', async () => {
    mockGetSelectionSummary.mockResolvedValue({
      hasSelection: true,
      applicationCount: 2,
      categoryCount: 1,
      webDomainCount: 0,
    });
    mockApplyShield.mockResolvedValue('applied');
    mockSaveActiveSession.mockRejectedValue(new Error('storage failed'));

    await expect(startFocusSession(90)).rejects.toThrow('storage failed');

    expect(mockStartSessionMonitoring).toHaveBeenCalledWith(now + 90 * 60 * 1000);
    expect(mockStopSessionMonitoring).toHaveBeenCalledTimes(1);
    expect(mockClearShield).toHaveBeenCalledTimes(1);
  });
});
