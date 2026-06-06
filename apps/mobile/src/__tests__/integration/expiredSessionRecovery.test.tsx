import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import { saveOnboardingCompleted } from '@/services/onBoardingStorage';

import HomeScreen from '../../app/index';

import {
  nativeCalls,
  saveExpiredSession,
  setEmptySelection,
  setMonitoringSuccess,
  setProtectionSuccess,
} from './helpers';

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
const mockPush = jest.fn();
const mockRouter = { replace: mockReplace, push: mockPush };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(callback, [callback]);
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return {
    SafeAreaView: ({ children }: PropsWithChildren) => <View>{children}</View>,
  };
});

describe('expired session recovery', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' });

    await saveOnboardingCompleted();
    setEmptySelection();
    await saveExpiredSession();
  });

  it('clears shield, stops monitoring, and removes stored session on successful expiry recovery', async () => {
    setProtectionSuccess();
    setMonitoringSuccess();

    const { findByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(nativeCalls.clearShield).toHaveBeenCalledTimes(1);
    });

    expect(nativeCalls.stopSessionMonitoring).toHaveBeenCalledTimes(1);

    const raw = await AsyncStorage.getItem('tunnel:active-session');
    expect(raw).toBeNull();

    await findByText('Set up your blocklist first');
    expect(mockReplace).not.toHaveBeenCalledWith('/focus-session');
  });

  it('preserves stored session and shows error when shield cleanup cannot be confirmed', async () => {
    jest.useFakeTimers();
    nativeCalls.clearShield.mockResolvedValue('noSelection');

    const { findByText } = render(<HomeScreen />);

    // Advance past clearShieldWithRetry retry delays (2 × 300ms between 3 attempts)
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });

    await waitFor(() => {
      expect(nativeCalls.clearShield).toHaveBeenCalledTimes(3);
    });

    expect(nativeCalls.stopSessionMonitoring).not.toHaveBeenCalled();

    const raw = await AsyncStorage.getItem('tunnel:active-session');
    expect(raw).not.toBeNull();

    await findByText('Shield clear did not confirm success after 3 attempts: noSelection');

    jest.useRealTimers();
  });
});
