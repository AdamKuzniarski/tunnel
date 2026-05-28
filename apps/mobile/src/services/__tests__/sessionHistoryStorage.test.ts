import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  appendSessionHistoryEntry,
  loadSessionHistory,
  saveSessionHistory,
} from '../sessionHistoryStorage';
import type { SessionHistoryEntry } from '@/types/sessionHistory';

const completedEntry: SessionHistoryEntry = {
  id: 'history-1',
  startedAt: 1_700_000_000_000,
  endedAt: 1_700_003_600_000,
  durationMinutes: 60,
  outcome: 'completed',
};

const stoppedEntry: SessionHistoryEntry = {
  id: 'history-2',
  startedAt: 1_700_010_000_000,
  endedAt: 1_700_010_900_000,
  durationMinutes: 30,
  outcome: 'stopped',
  unlockAttemptCount: 1,
};

const emergencyUnlockEntry: SessionHistoryEntry = {
  id: 'history-3',
  startedAt: 1_700_020_000_000,
  endedAt: 1_700_020_600_000,
  durationMinutes: 90,
  outcome: 'emergency_unlock',
  unlockReason: 'urgent',
  unlockAttemptCount: 2,
};

describe('sessionHistoryStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('loadSessionHistory', () => {
    it('returns an empty array when there is no saved history', async () => {
      await expect(loadSessionHistory()).resolves.toEqual([]);
    });

    it('loads saved session history', async () => {
      const history = [completedEntry, stoppedEntry];

      await saveSessionHistory(history);

      await expect(loadSessionHistory()).resolves.toEqual(history);
    });
  });

  describe('saveSessionHistory', () => {
    it('saves session history to storage', async () => {
      const history = [completedEntry, stoppedEntry];

      await saveSessionHistory(history);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'tunnel:session-history',
        JSON.stringify(history),
      );
      await expect(loadSessionHistory()).resolves.toEqual(history);
    });
  });

  describe('appendSessionHistoryEntry', () => {
    it('adds the first history entry when history is empty', async () => {
      await appendSessionHistoryEntry(completedEntry);

      await expect(loadSessionHistory()).resolves.toEqual([completedEntry]);
    });

    it('prepends new history entries before existing entries', async () => {
      await saveSessionHistory([completedEntry, stoppedEntry]);

      await appendSessionHistoryEntry(emergencyUnlockEntry);

      await expect(loadSessionHistory()).resolves.toEqual([
        emergencyUnlockEntry,
        completedEntry,
        stoppedEntry,
      ]);
    });
  });
});
