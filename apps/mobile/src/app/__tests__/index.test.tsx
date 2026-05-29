import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { clearShield, getSelectionSummary } from '@/services/focusControl';
import { startFocusSession } from '@/services/focusSessionStart';
import { loadOnboardingCompleted } from '@/services/onBoardingStorage';
import { clearActiveSession, loadActiveSession } from '@/services/sessionStorage';
import type { FocusSession } from '@/types/session';

import HomeScreen from '../index';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockRouter = {
  replace: mockReplace,
  push: mockPush,
};

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

jest.mock('@/services/onBoardingStorage', () => ({
  loadOnboardingCompleted: jest.fn(),
}));

jest.mock('@/services/sessionStorage', () => ({
  clearActiveSession: jest.fn(),
  loadActiveSession: jest.fn(),
}));

jest.mock('@/services/focusControl', () => ({
  clearShield: jest.fn(),
  getSelectionSummary: jest.fn(),
}));

jest.mock('@/services/focusSessionStart', () => ({
  startFocusSession: jest.fn(),
}));

const mockLoadOnboardingCompleted = jest.mocked(loadOnboardingCompleted);
const mockLoadActiveSession = jest.mocked(loadActiveSession);
const mockClearActiveSession = jest.mocked(clearActiveSession);
const mockGetSelectionSummary = jest.mocked(getSelectionSummary);
const mockClearShield = jest.mocked(clearShield);
const mockStartFocusSession = jest.mocked(startFocusSession);

const now = 1_700_000_000_000;

const emptySelection = {
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

function activeSession(overrides: Partial<FocusSession> = {}): FocusSession {
  return {
    id: 'session-1',
    durationMinutes: 30,
    startedAt: now,
    endsAt: now + 30 * 60 * 1000,
    status: 'active',
    unlockAttemptCount: 0,
    ...overrides,
  };
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    mockLoadOnboardingCompleted.mockResolvedValue(true);
    mockLoadActiveSession.mockResolvedValue(null);
    mockGetSelectionSummary.mockResolvedValue(emptySelection);
    mockClearShield.mockResolvedValue('cleared');
    mockClearActiveSession.mockResolvedValue(undefined);
    mockStartFocusSession.mockResolvedValue({
      ok: true,
      session: activeSession(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the loading state before home data resolves', () => {
    mockLoadOnboardingCompleted.mockReturnValue(
      new Promise(() => {
        // Keep home loading suspended so the initial state remains visible.
      }),
    );

    const { getByText } = render(<HomeScreen />);

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('redirects to onboarding when onboarding is incomplete', async () => {
    mockLoadOnboardingCompleted.mockResolvedValue(false);

    render(<HomeScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
    });
    expect(mockLoadActiveSession).not.toHaveBeenCalled();
    expect(mockGetSelectionSummary).not.toHaveBeenCalled();
  });

  it('redirects to the focus session when an active session exists', async () => {
    mockLoadActiveSession.mockResolvedValue(activeSession());

    render(<HomeScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/focus-session');
    });
  });

  it('clears shield and storage when an active session is expired', async () => {
    mockLoadActiveSession.mockResolvedValue(activeSession({ endsAt: now }));

    render(<HomeScreen />);

    await waitFor(() => {
      expect(mockClearShield).toHaveBeenCalledTimes(1);
    });
    expect(mockClearActiveSession).toHaveBeenCalledTimes(1);
  });

  it('shows empty blocklist guidance when no selection exists', async () => {
    const { findByText } = render(<HomeScreen />);

    expect(await findByText('Set up your blocklist first')).toBeTruthy();
  });

  it('keeps the start button disabled without a selection', async () => {
    const { findByRole, getByText } = render(<HomeScreen />);

    const startButton = await findByRole('button', { name: 'Start focus session' });

    expect(startButton.props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(getByText('Start focus session'));
    expect(mockStartFocusSession).not.toHaveBeenCalled();
  });

  it('shows selected app count when the blocklist is ready', async () => {
    mockGetSelectionSummary.mockResolvedValue(readySelection);

    const { findByText } = render(<HomeScreen />);

    expect(await findByText('2 apps ready to block')).toBeTruthy();
  });

  it('starts a focus session with the selected duration', async () => {
    mockGetSelectionSummary.mockResolvedValue(readySelection);

    const { findByText, getByText } = render(<HomeScreen />);
    await findByText('2 apps ready to block');

    fireEvent.press(getByText('Start focus session'));

    await waitFor(() => {
      expect(mockStartFocusSession).toHaveBeenCalledWith(30);
    });
  });

  it('redirects to the focus session after a successful start', async () => {
    mockGetSelectionSummary.mockResolvedValue(readySelection);

    const { findByText, getByText } = render(<HomeScreen />);
    await findByText('2 apps ready to block');

    fireEvent.press(getByText('Start focus session'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/focus-session');
    });
  });

  it('shows a helpful message when start fails because selection disappeared', async () => {
    mockGetSelectionSummary.mockResolvedValue(readySelection);
    mockStartFocusSession.mockResolvedValue({ ok: false, reason: 'no_selection' });

    const { findByText, getByText } = render(<HomeScreen />);
    await findByText('2 apps ready to block');

    fireEvent.press(getByText('Start focus session'));

    expect(await findByText('Set up your blocklist before starting a session.')).toBeTruthy();
  });

  it('shows a helpful message when focus protection cannot start', async () => {
    mockGetSelectionSummary.mockResolvedValue(readySelection);
    mockStartFocusSession.mockResolvedValue({
      ok: false,
      reason: 'shield_failed',
      detail: 'restricted',
    });

    const { findByText, getByText } = render(<HomeScreen />);
    await findByText('2 apps ready to block');

    fireEvent.press(getByText('Start focus session'));

    expect(await findByText('Could not start focus protection. Try again.')).toBeTruthy();
  });
});
