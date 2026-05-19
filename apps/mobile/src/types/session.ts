export type FocusSessionDurationMinutes = 30 | 60 | 90;

export type FocusSessionStatus = 'idle' | 'active' | 'completed' | 'stopped';

export type PendingEmergencyUnlock = {
  reason: 'urgent' | 'distracted' | 'wrong_blocklist' | 'other';
  delaySeconds: number;
  startedAt: number;
  unlockAt: number;
};

export type FocusSession = {
  id: string;
  durationMinutes: FocusSessionDurationMinutes;
  startedAt: number;
  endsAt: number;
  status: FocusSessionStatus;
  unlockAttemptCount?: number;
  pendingEmergencyUnlock?: PendingEmergencyUnlock;
};
