import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import { saveOnboardingCompleted } from '@/services/onBoardingStorage';

import HomeScreen from '../../app/index';
import SelectionScreen from '../../app/selection';

import { nativeCalls, setEmptySelection } from './helpers';

jest.mock('../../../modules/tunnel-focus-control', () => {
  const { View } = jest.requireActual('react-native');
  return {
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
    TunnelFocusControlView: ({ children }: PropsWithChildren) => <View>{children}</View>,
  };
});

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockRouter = { replace: mockReplace, push: mockPush };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
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

describe('empty native selection protection', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' });

    await saveOnboardingCompleted();
    setEmptySelection();
  });

  it('shows setup guidance, blocks start, and navigates to selection when native selection is empty', async () => {
    const { findByText, findByRole } = render(<HomeScreen />);

    await findByText('Set up your blocklist first');

    const startButton = await findByRole('button', { name: 'Start focus session' });
    expect(startButton.props.accessibilityState).toEqual({ disabled: true });

    expect(nativeCalls.applyShield).not.toHaveBeenCalled();

    fireEvent.press(await findByText('Set up your blocklist first'));

    expect(mockPush).toHaveBeenCalledWith('/selection?returnTo=home');
  });

  it('selection screen renders without crashing', async () => {
    const { findByText } = render(<SelectionScreen />);
    await findByText('Not ready');
  });
});
