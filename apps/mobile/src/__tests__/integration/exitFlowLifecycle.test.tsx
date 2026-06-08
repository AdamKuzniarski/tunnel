import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import FocusSessionScreen from '../../app/focus-session';

import { nativeCalls, saveRunningSession, setMonitoringSuccess, setProtectionSuccess } from './helpers';

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

async function advance(ms: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

describe('exit flow lifecycle', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' });
    await saveRunningSession();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('clears shield, stops monitoring, writes history, and navigates home on successful exit', async () => {
    setProtectionSuccess();
    setMonitoringSuccess();

    const { getByText, findByText } = render(<FocusSessionScreen />);

    await findByText(/\d+:\d\d/);

    jest.useFakeTimers();

    fireEvent.press(getByText('Emergency unlock'));
    fireEvent(getByText('0.0 / 5.0s'), 'pressIn');
    await advance(5_000);

    fireEvent.press(getByText('Why are you leaving?'));
    fireEvent.press(getByText('Something urgent'));

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem('tunnel:active-session');
      const session = JSON.parse(raw!);
      expect(session.pendingEmergencyUnlock?.reason).toBe('urgent');
    });

    await advance(10_000);

    await waitFor(() => {
      expect(nativeCalls.clearShield).toHaveBeenCalledTimes(1);
    });

    expect(nativeCalls.stopSessionMonitoring).toHaveBeenCalledTimes(1);

    const sessionAfter = await AsyncStorage.getItem('tunnel:active-session');
    expect(sessionAfter).toBeNull();

    const rawHistory = await AsyncStorage.getItem('tunnel:session-history');
    const history = JSON.parse(rawHistory!);
    expect(history[0].outcome).toBe('emergency_unlock');
    expect(history[0].unlockReason).toBe('urgent');

    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('keeps session recoverable and skips history when native cleanup fails', async () => {
    jest.useFakeTimers();
    nativeCalls.clearShield.mockResolvedValue('noSelection');

    const { getByText, findByText } = render(<FocusSessionScreen />);

    await findByText(/\d+:\d\d/);

    fireEvent.press(getByText('Emergency unlock'));
    fireEvent(getByText('0.0 / 5.0s'), 'pressIn');
    await advance(5_000);

    await findByText('Why are you leaving?');
    fireEvent.press(getByText('Something urgent'));

    await advance(10_000);
    await advance(300);
    await advance(300);

    await waitFor(() => {
      expect(nativeCalls.clearShield).toHaveBeenCalledTimes(3);
    });

    expect(nativeCalls.stopSessionMonitoring).not.toHaveBeenCalled();

    const sessionAfter = await AsyncStorage.getItem('tunnel:active-session');
    expect(sessionAfter).not.toBeNull();

    const rawHistory = await AsyncStorage.getItem('tunnel:session-history');
    expect(rawHistory).toBeNull();

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
