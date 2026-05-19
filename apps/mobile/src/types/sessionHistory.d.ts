import { FocusSessionDurationMinutes } from '@/types/session';

export type SessionOutcome = 'completed' | 'stopped' | 'emergency_unlock';
export type EmergencyUnlockReason = 'urgent' | 'distracted' | 'wrong_blocklist' | 'other';

export type SessionHistoryEntry = {
  id: string;
  startedAt: number;
  endedAt: number;
  durationMinutes: FocusSessionDurationMinutes;
  outcome: SessionOutcome;
  unlockReason?: EmergencyUnlockReason;
  unlockAttemptCount?: number;
};
