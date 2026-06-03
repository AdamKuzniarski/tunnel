import type { FocusSession } from '@/types/session';

import {
  formatHoldProgress,
  getNextUnlockAttemptCount,
  getUnlockDelaySeconds,
  normalizeLoadedSession,
  normalizePendingEmergencyUnlock,
} from '../unlockRitual';

const baseSession: FocusSession = {
  id: 'session-1',
  durationMinutes: 60,
  startedAt: 1_700_000_000_000,
  endsAt: 1_700_003_600_000,
  status: 'active',
};

describe('getUnlockDelaySeconds', () => {
  it('returns 10 seconds for the first unlock attempt', () => {
    expect(getUnlockDelaySeconds(1)).toBe(10);
  });

  it('returns 10 seconds when attempt count is 0', () => {
    expect(getUnlockDelaySeconds(0)).toBe(10);
  });

  it('returns 30 seconds for the second unlock attempt', () => {
    expect(getUnlockDelaySeconds(2)).toBe(30);
  });

  it('returns 60 seconds for the third unlock attempt', () => {
    expect(getUnlockDelaySeconds(3)).toBe(60);
  });

  it('returns 60 seconds for later unlock attempts', () => {
    expect(getUnlockDelaySeconds(10)).toBe(60);
  });
});

describe('delay ladder via getNextUnlockAttemptCount + getUnlockDelaySeconds', () => {
  it('gives 10 seconds on the first attempt from a fresh session', () => {
    const delay = getUnlockDelaySeconds(getNextUnlockAttemptCount(baseSession));
    expect(delay).toBe(10);
  });

  it('gives 30 seconds on the second attempt', () => {
    const delay = getUnlockDelaySeconds(
      getNextUnlockAttemptCount({ ...baseSession, unlockAttemptCount: 1 }),
    );
    expect(delay).toBe(30);
  });

  it('gives 60 seconds on the third attempt', () => {
    const delay = getUnlockDelaySeconds(
      getNextUnlockAttemptCount({ ...baseSession, unlockAttemptCount: 2 }),
    );
    expect(delay).toBe(60);
  });

  it('gives 60 seconds on all subsequent attempts', () => {
    const delay = getUnlockDelaySeconds(
      getNextUnlockAttemptCount({ ...baseSession, unlockAttemptCount: 5 }),
    );
    expect(delay).toBe(60);
  });
});

describe('getNextUnlockAttemptCount', () => {
  it('returns 1 when unlockAttemptCount is missing', () => {
    expect(getNextUnlockAttemptCount(baseSession)).toBe(1);
  });

  it('increments an existing unlock attempt count', () => {
    expect(getNextUnlockAttemptCount({ ...baseSession, unlockAttemptCount: 2 })).toBe(3);
  });
});

describe('normalizePendingEmergencyUnlock', () => {
  const validPending = {
    reason: 'urgent' as const,
    delaySeconds: 10,
    startedAt: 1_700_000_000_000,
    unlockAt: 1_700_000_010_000,
  };

  it('returns undefined when pending is undefined', () => {
    expect(normalizePendingEmergencyUnlock(undefined)).toBeUndefined();
  });

  it('returns undefined for an invalid reason', () => {
    expect(
      normalizePendingEmergencyUnlock({ ...validPending, reason: 'not_a_reason' as never }),
    ).toBeUndefined();
  });

  it('returns undefined when delaySeconds is not finite', () => {
    expect(
      normalizePendingEmergencyUnlock({ ...validPending, delaySeconds: NaN }),
    ).toBeUndefined();
  });

  it('returns undefined when startedAt is not finite', () => {
    expect(
      normalizePendingEmergencyUnlock({ ...validPending, startedAt: Infinity }),
    ).toBeUndefined();
  });

  it('returns undefined when unlockAt is not finite', () => {
    expect(
      normalizePendingEmergencyUnlock({ ...validPending, unlockAt: NaN }),
    ).toBeUndefined();
  });

  it('returns the object unchanged when valid', () => {
    expect(normalizePendingEmergencyUnlock(validPending)).toEqual(validPending);
  });
});

describe('normalizeLoadedSession', () => {
  it('sets unlockAttemptCount to 0 when missing', () => {
    const result = normalizeLoadedSession(baseSession);
    expect(result.unlockAttemptCount).toBe(0);
  });

  it('sets pendingEmergencyUnlock to undefined when invalid', () => {
    const session: FocusSession = {
      ...baseSession,
      pendingEmergencyUnlock: {
        reason: 'bad_reason' as never,
        delaySeconds: 10,
        startedAt: 1_700_000_000_000,
        unlockAt: 1_700_000_010_000,
      },
    };
    const result = normalizeLoadedSession(session);
    expect(result.pendingEmergencyUnlock).toBeUndefined();
  });

  it('preserves other session fields unchanged', () => {
    const result = normalizeLoadedSession(baseSession);
    expect(result.id).toBe(baseSession.id);
    expect(result.status).toBe(baseSession.status);
    expect(result.startedAt).toBe(baseSession.startedAt);
  });

  it('preserves a valid pendingEmergencyUnlock', () => {
    const pending = {
      reason: 'distracted' as const,
      delaySeconds: 30,
      startedAt: 1_700_000_000_000,
      unlockAt: 1_700_000_030_000,
    };
    const result = normalizeLoadedSession({ ...baseSession, pendingEmergencyUnlock: pending });
    expect(result.pendingEmergencyUnlock).toEqual(pending);
  });
});

describe('formatHoldProgress', () => {
  it('formats progress with one decimal place', () => {
    expect(formatHoldProgress(2300)).toBe('2.3');
  });

  it('does not display above 5.0', () => {
    expect(formatHoldProgress(6000)).toBe('5.0');
  });

  it('returns 0.0 for zero progress', () => {
    expect(formatHoldProgress(0)).toBe('0.0');
  });

  it('returns exactly 5.0 at the cap boundary', () => {
    expect(formatHoldProgress(5000)).toBe('5.0');
  });
});
