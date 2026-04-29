export type FocusSessionDurationMinutes = 30 | 60 | 90;

export type FocusSessionStatus = 'idle' | 'active' | 'completed' | 'stopped';

export type FocusSession = {
  id: string;
  durationMinutes: FocusSessionDurationMinutes;
  startedAt: number;
  endsAt: number;
  status: FocusSessionStatus;
};
