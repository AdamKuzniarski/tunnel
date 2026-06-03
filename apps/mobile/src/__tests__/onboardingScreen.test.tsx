import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import {
  applyShield,
  clearShield,
  getAuthorizationStatus,
  getSelectionSummary,
  requestAuthorization,
} from '@/services/focusControl';
import { saveOnboardingCompleted } from '@/services/onBoardingStorage';

import OnboardingScreen from '../app/onboarding';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
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

jest.mock('@/services/focusControl', () => ({
  getAuthorizationStatus: jest.fn(),
  requestAuthorization: jest.fn(),
  getSelectionSummary: jest.fn(),
  applyShield: jest.fn(),
  clearShield: jest.fn(),
}));

jest.mock('@/services/onBoardingStorage', () => ({
  saveOnboardingCompleted: jest.fn(),
}));

const mockGetAuthorizationStatus = jest.mocked(getAuthorizationStatus);
const mockRequestAuthorization = jest.mocked(requestAuthorization);
const mockGetSelectionSummary = jest.mocked(getSelectionSummary);
const mockApplyShield = jest.mocked(applyShield);
const mockClearShield = jest.mocked(clearShield);
const mockSaveOnboardingCompleted = jest.mocked(saveOnboardingCompleted);

const noSelection = {
  hasSelection: false,
  applicationCount: 0,
  categoryCount: 0,
  webDomainCount: 0,
};

const readySelection = {
  hasSelection: true,
  applicationCount: 2,
  categoryCount: 0,
  webDomainCount: 0,
};

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthorizationStatus.mockResolvedValue('unknown');
    mockGetSelectionSummary.mockResolvedValue(noSelection);
    mockRequestAuthorization.mockResolvedValue('approved');
    mockApplyShield.mockResolvedValue('applied');
    mockClearShield.mockResolvedValue('cleared');
    mockSaveOnboardingCompleted.mockResolvedValue(undefined);
  });

  // Step 1 – Permission

  it('shows notDetermined permission copy', async () => {
    mockGetAuthorizationStatus.mockResolvedValue('notDetermined');
    const { findByText } = render(<OnboardingScreen />);
    expect(
      await findByText('tunnel needs Screen Time permission to block selected distractions.'),
    ).toBeTruthy();
  });

  it('shows denied permission copy', async () => {
    mockGetAuthorizationStatus.mockResolvedValue('denied');
    const { findByText } = render(<OnboardingScreen />);
    expect(
      await findByText(
        'Permission was denied. You need Screen Time access before tunnel can block apps.',
      ),
    ).toBeTruthy();
  });

  it('shows approved permission copy', async () => {
    mockGetAuthorizationStatus.mockResolvedValue('approved');
    const { findByText } = render(<OnboardingScreen />);
    expect(await findByText('Screen Time permission is ready.')).toBeTruthy();
  });

  it('disables permission request button when status is unsupported', async () => {
    mockGetAuthorizationStatus.mockResolvedValue('unsupported');
    const { findByText, getByRole } = render(<OnboardingScreen />);
    await findByText('This device does not support the required Screen Time APIs.');
    const button = getByRole('button', { name: 'Request permission' });
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });

  it('requesting permission updates the status copy', async () => {
    mockGetAuthorizationStatus.mockResolvedValue('notDetermined');
    const { findByText, getByRole } = render(<OnboardingScreen />);
    await findByText('tunnel needs Screen Time permission to block selected distractions.');
    fireEvent.press(getByRole('button', { name: 'Request permission' }));
    expect(await findByText('Screen Time permission is ready.')).toBeTruthy();
  });

  // Step 2 – Selection

  it('choose-selection button is disabled until permission is ready', async () => {
    const { findByText, getByRole } = render(<OnboardingScreen />);
    await findByText('Permission status is unknown. Try checking again.');
    const button = getByRole('button', { name: 'Choose selection' });
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });

  it('choose-selection routes to /selection with returnTo=onboarding', async () => {
    mockGetAuthorizationStatus.mockResolvedValue('approved');
    const { findByText, getByRole } = render(<OnboardingScreen />);
    await findByText('Screen Time permission is ready.');
    fireEvent.press(getByRole('button', { name: 'Choose selection' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/selection',
      params: { returnTo: 'onboarding' },
    });
  });

  // Step 3 – Shield test

  it('test shield button is disabled until permission and selection are ready', async () => {
    const { findByText, getByRole } = render(<OnboardingScreen />);
    await findByText('Permission status is unknown. Try checking again.');
    const button = getByRole('button', { name: 'Test shield' });
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });

  it('successful shield test calls applyShield then clearShield', async () => {
    mockGetAuthorizationStatus.mockResolvedValue('approved');
    mockGetSelectionSummary.mockResolvedValue(readySelection);
    const { findByText, getByRole } = render(<OnboardingScreen />);
    await findByText('Screen Time permission is ready.');
    fireEvent.press(getByRole('button', { name: 'Test shield' }));
    await waitFor(() => {
      expect(mockApplyShield).toHaveBeenCalledTimes(1);
      expect(mockClearShield).toHaveBeenCalledTimes(1);
    });
    expect(await findByText('Test status: passed')).toBeTruthy();
  });

  it('failed shield test shows failed state when applyShield returns a non-applied result', async () => {
    mockGetAuthorizationStatus.mockResolvedValue('approved');
    mockGetSelectionSummary.mockResolvedValue(readySelection);
    mockApplyShield.mockResolvedValue('noSelection');
    const { findByText, getByRole } = render(<OnboardingScreen />);
    await findByText('Screen Time permission is ready.');
    fireEvent.press(getByRole('button', { name: 'Test shield' }));
    expect(await findByText('Test status: failed')).toBeTruthy();
  });

  it('failed shield test shows error when applyShield throws', async () => {
    mockGetAuthorizationStatus.mockResolvedValue('approved');
    mockGetSelectionSummary.mockResolvedValue(readySelection);
    mockApplyShield.mockRejectedValue(new Error('bridge error'));
    const { findByText, getByRole } = render(<OnboardingScreen />);
    await findByText('Screen Time permission is ready.');
    fireEvent.press(getByRole('button', { name: 'Test shield' }));
    expect(await findByText('Error: bridge error')).toBeTruthy();
  });

  // Step 4 – Finish setup

  it('finish setup button is disabled until all setup steps are complete', async () => {
    const { findByText, getByRole } = render(<OnboardingScreen />);
    await findByText('Permission status is unknown. Try checking again.');
    const button = getByRole('button', { name: 'Start first 30-minute session' });
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });

  it('finish setup calls saveOnboardingCompleted', async () => {
    mockGetAuthorizationStatus.mockResolvedValue('approved');
    mockGetSelectionSummary.mockResolvedValue(readySelection);
    const { findByText, getByRole } = render(<OnboardingScreen />);
    await findByText('Screen Time permission is ready.');
    fireEvent.press(getByRole('button', { name: 'Test shield' }));
    await findByText('Test status: passed');
    fireEvent.press(getByRole('button', { name: 'Start first 30-minute session' }));
    await waitFor(() => {
      expect(mockSaveOnboardingCompleted).toHaveBeenCalledTimes(1);
    });
  });

  it('finish setup routes to /', async () => {
    mockGetAuthorizationStatus.mockResolvedValue('approved');
    mockGetSelectionSummary.mockResolvedValue(readySelection);
    const { findByText, getByRole } = render(<OnboardingScreen />);
    await findByText('Screen Time permission is ready.');
    fireEvent.press(getByRole('button', { name: 'Test shield' }));
    await findByText('Test status: passed');
    fireEvent.press(getByRole('button', { name: 'Start first 30-minute session' }));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('service errors are shown as Error: message', async () => {
    mockGetAuthorizationStatus.mockRejectedValue(new Error('timeout'));
    const { findByText } = render(<OnboardingScreen />);
    expect(await findByText('Error: timeout')).toBeTruthy();
  });
});
