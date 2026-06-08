import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import { saveOnboardingCompleted } from '@/services/onBoardingStorage';

import HomeScreen from '../../app/index';

import {
  nativeCalls,
  setMonitoringSuccess,
  setProtectionSuccess,
  setReadySelection,
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

describe('focus-start cleanup: storage save fails', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' });

    await saveOnboardingCompleted();
    setReadySelection();
    setProtectionSuccess();
    setMonitoringSuccess();
  });

  it('stops monitoring and clears the shield when session storage throws, and does not navigate', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));

    const { findByText, getByText } = render(<HomeScreen />);

    await findByText('2 apps ready to block');

    fireEvent.press(getByText('Start focus session'));

    await waitFor(() => {
      expect(nativeCalls.applyShield).toHaveBeenCalledTimes(1);
      expect(nativeCalls.startSessionMonitoring).toHaveBeenCalledTimes(1);
      expect(nativeCalls.stopSessionMonitoring).toHaveBeenCalledTimes(1);
      expect(nativeCalls.clearShield).toHaveBeenCalledTimes(1);
    });

    const raw = await AsyncStorage.getItem('tunnel:active-session');
    expect(raw).toBeNull();

    expect(mockReplace).not.toHaveBeenCalledWith('/focus-session');
  });
});
