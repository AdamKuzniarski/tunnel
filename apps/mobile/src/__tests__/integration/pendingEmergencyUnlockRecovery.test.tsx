import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import FocusSessionScreen from '../../app/focus-session';

import { nativeCalls, setMonitoringSuccess, setProtectionSuccess } from './helpers';

jest.mock('../../../modules/tunnel-focus-control', () => ({
  __esModule: true,
  default: {
    getSelectionSummary: jest.fn(),
    applyShield: jest.fn(),
    clearShield: jest.fn(),
    startSessionMonitoring: jest.fn(),
    stopSessionMonitoring: jest.fn(),
    getAuthorizationStatus: jest.fn(),
    requestAuthorization: jest.fn(),
  },
}));

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return {
    SafeAreaView: ({ children }: PropsWithChildren) => <View>{children}</View>,
  };
});

async function savePendingUnlockSession() {
  const now = Date.now();
  const session = {
    id: String(now - 10000),
    durationMinutes: 30,
    startedAt: now - 10000,
    endsAt: now + 20 * 60 * 1000,
    status: 'active',
    unlockAttemptCount: 1,
    pendingEmergencyUnlock: {
      reason: 'urgent',
      delaySeconds: 10,
      startedAt: now - 11000,
      unlockAt: now - 1000,
    },
  };
  await AsyncStorage.setItem('tunnel:active-session', JSON.stringify(session));
}

describe('pending emergency unlock recovery', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' });

    setProtectionSuccess();
    setMonitoringSuccess();
  });

  it('resumes and completes pending emergency unlock when focus session screen loads', async () => {
    await savePendingUnlockSession();

    render(<FocusSessionScreen />);

    await waitFor(
      () => {
        expect(nativeCalls.clearShield).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );

    expect(nativeCalls.stopSessionMonitoring).toHaveBeenCalledTimes(1);

    const sessionAfter = await AsyncStorage.getItem('tunnel:active-session');
    expect(sessionAfter).toBeNull();

    const rawHistory = await AsyncStorage.getItem('tunnel:session-history');
    const history = JSON.parse(rawHistory!);
    expect(history[0].outcome).toBe('emergency_unlock');
    expect(history[0].unlockReason).toBe('urgent');

    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
