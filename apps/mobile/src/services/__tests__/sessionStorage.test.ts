import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearActiveSession, loadActiveSession, saveActiveSession } from '../sessionStorage';
import type { FocusSession } from '@/types/session';

const activeSession: FocusSession = {
  id: 'session-1',
  durationMinutes: 60,
  startedAt: 1_700_000_000_000,
  endsAt: 1_700_003_600_000,
  status: 'active',
  unlockAttemptCount: 1,
};

describe('sessionStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('loadActiveSession', () => {
    it('returns null when there is no saved active session', async () => {
      await expect(loadActiveSession()).resolves.toBeNull();
    });

    it('loads a saved active session', async () => {
      await saveActiveSession(activeSession);

      await expect(loadActiveSession()).resolves.toEqual(activeSession);
    });
  });

  describe('saveActiveSession', () => {
    it('saves the active session to storage', async () => {
      await saveActiveSession(activeSession);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'tunnel:active-session',
        JSON.stringify(activeSession),
      );
      await expect(loadActiveSession()).resolves.toEqual(activeSession);
    });
  });

  describe('clearActiveSession', () => {
    it('removes the saved active session', async () => {
      await saveActiveSession(activeSession);

      await clearActiveSession();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('tunnel:active-session');
      await expect(loadActiveSession()).resolves.toBeNull();
    });
  });
});
