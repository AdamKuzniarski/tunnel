import { FocusSessionDurationMinutes } from '@/types/session';

export type SessionOutcome = 'completed' | 'stopped' | 'emergency_unlock';

export type SessionHistoryEntry = {
  id: string;
  startedAt: number;
  endedAt: number;
  durationMinutes: FocusSessionDurationMinutes;
  outcome: SessionOutcome;
};
