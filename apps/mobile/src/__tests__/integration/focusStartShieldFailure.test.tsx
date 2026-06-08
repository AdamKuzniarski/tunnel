import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import { saveOnboardingCompleted } from '@/services/onBoardingStorage';

import HomeScreen from '../../app/index';

import {
  nativeCalls,
  setMonitoringSuccess,
  setProtectionFailure,
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

describe('focus-start cleanup: shield fails', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' });

    await saveOnboardingCompleted();
    setReadySelection();
    setProtectionFailure('noSelection');
    setMonitoringSuccess();
  });

  it('does not schedule monitoring or save a session when applyShield returns noSelection', async () => {
    const { findByText, getByText } = render(<HomeScreen />);

    await findByText('2 apps ready to block');

    fireEvent.press(getByText('Start focus session'));

    await waitFor(() => {
      expect(nativeCalls.applyShield).toHaveBeenCalledTimes(1);
    });

    expect(nativeCalls.startSessionMonitoring).not.toHaveBeenCalled();

    const raw = await AsyncStorage.getItem('tunnel:active-session');
    expect(raw).toBeNull();

    expect(mockReplace).not.toHaveBeenCalledWith('/focus-session');

    await findByText('Could not start focus protection. Try again.');
  });
});
