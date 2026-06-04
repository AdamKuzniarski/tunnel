import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { PropsWithChildren } from 'react';

import { resetOnboardingCompleted } from '@/services/onBoardingStorage';

import SettingsScreen from '../app/settings';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');

  return {
    SafeAreaView: ({ children }: PropsWithChildren) => <View>{children}</View>,
  };
});

jest.mock('@/services/onBoardingStorage', () => ({
  resetOnboardingCompleted: jest.fn(),
}));

const mockReplace = jest.mocked(router.replace);
const mockResetOnboarding = jest.mocked(resetOnboardingCompleted);

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResetOnboarding.mockResolvedValue(undefined);
  });

  it('shows the settings title', () => {
    const { getByText } = render(<SettingsScreen />);

    expect(getByText('App settings')).toBeTruthy();
  });

  it('shows the placeholder body text', () => {
    const { getByText } = render(<SettingsScreen />);

    expect(getByText(/tunnel settings are not implemented yet/)).toBeTruthy();
  });

  it('shows the Reset onboarding button', () => {
    const { getByText } = render(<SettingsScreen />);

    expect(getByText('Reset onboarding')).toBeTruthy();
  });

  it('pressing Reset onboarding calls resetOnboardingCompleted', async () => {
    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('Reset onboarding'));

    await waitFor(() => {
      expect(mockResetOnboarding).toHaveBeenCalledTimes(1);
    });
  });

  it('pressing Reset onboarding routes to /onboarding', async () => {
    const { getByText } = render(<SettingsScreen />);

    fireEvent.press(getByText('Reset onboarding'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
    });
  });
});
