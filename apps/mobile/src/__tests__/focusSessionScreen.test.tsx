import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { clearShield } from '@/services/focusControl';
import { appendSessionHistoryEntry } from '@/services/sessionHistoryStorage';
import {
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from '@/services/sessionStorage';
import type { FocusSession } from '@/types/session';

import FocusSessionScreen from '../app/focus-session';

const mockReplace = jest.fn();
const mockRouter = {
  replace: mockReplace,
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');

  return {
    SafeAreaView: ({ children }: PropsWithChildren) => <View>{children}</View>,
  };
});

jest.mock('@/services/focusControl', () => ({
  clearShield: jest.fn(),
}));

jest.mock('@/services/sessionHistoryStorage', () => ({
  appendSessionHistoryEntry: jest.fn(),
}));

jest.mock('@/services/sessionStorage', () => ({
  clearActiveSession: jest.fn(),
  loadActiveSession: jest.fn(),
  saveActiveSession: jest.fn(),
}));

const mockClearShield = jest.mocked(clearShield);
const mockAppendSessionHistoryEntry = jest.mocked(appendSessionHistoryEntry);
const mockClearActiveSession = jest.mocked(clearActiveSession);
const mockLoadActiveSession = jest.mocked(loadActiveSession);
const mockSaveActiveSession = jest.mocked(saveActiveSession);

const now = 1_700_000_000_000;
let consoleLogSpy: jest.SpyInstance;

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

async function renderLoadedSession(session: FocusSession | null = activeSession()) {
  mockLoadActiveSession.mockResolvedValue(session);

  const screen = render(<FocusSessionScreen />);

  await act(async () => {
    await Promise.resolve();
  });

  return screen;
}

async function advanceTimersByTime(ms: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

async function openReasonSelection(screen: ReturnType<typeof render>) {
  fireEvent.press(await screen.findByText('Emergency unlock'));
  fireEvent(screen.getByText('0.0 / 5.0s'), 'pressIn');
  await advanceTimersByTime(5_000);

  expect(await screen.findByText('Why are you leaving?')).toBeTruthy();
}

describe('FocusSessionScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    mockClearShield.mockResolvedValue('cleared');
    mockAppendSessionHistoryEntry.mockResolvedValue(undefined);
    mockClearActiveSession.mockResolvedValue(undefined);
    mockSaveActiveSession.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllTimers();
    consoleLogSpy.mockRestore();
    jest.useRealTimers();
  });

  it('redirects home when there is no saved active session', async () => {
    await renderLoadedSession(null);

    expect(mockReplace).toHaveBeenCalledWith('/');
    expect(mockClearActiveSession).not.toHaveBeenCalled();
    expect(mockClearShield).not.toHaveBeenCalled();
  });

  it('clears storage and redirects home when the saved session is inactive', async () => {
    await renderLoadedSession(activeSession({ status: 'stopped' }));

    expect(mockClearActiveSession).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/');
    expect(mockClearShield).not.toHaveBeenCalled();
  });

  it('clears shield, clears storage, and redirects home when the saved session is expired', async () => {
    await renderLoadedSession(activeSession({ endsAt: now }));

    expect(mockClearShield).toHaveBeenCalledTimes(1);
    expect(mockClearActiveSession).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('renders countdown UI for an active session', async () => {
    const { findByText } = await renderLoadedSession();

    expect(await findByText('Inside the tunnel')).toBeTruthy();
    expect(await findByText('30:00')).toBeTruthy();
    expect(await findByText('30 min')).toBeTruthy();
    expect(await findByText('Emergency unlock')).toBeTruthy();
  });

  it('opens the emergency unlock ritual from the entry button', async () => {
    const screen = await renderLoadedSession();

    fireEvent.press(await screen.findByText('Emergency unlock'));

    expect(await screen.findByText('Hold to confirm')).toBeTruthy();
    expect(await screen.findByText('Hold for 5 seconds. Release to stop.')).toBeTruthy();
  });

  it('progresses from hold-to-unlock to reason selection', async () => {
    const screen = await renderLoadedSession();

    await openReasonSelection(screen);

    expect(screen.getByText('Something urgent')).toBeTruthy();
    expect(screen.getByText("I'm distracted")).toBeTruthy();
    expect(screen.getByText('Wrong blocklist')).toBeTruthy();
    expect(screen.getByText('Other')).toBeTruthy();
  });

  it('saves pending unlock state when an unlock reason is selected', async () => {
    const screen = await renderLoadedSession();
    await openReasonSelection(screen);

    fireEvent.press(screen.getByText('Something urgent'));

    await waitFor(() => {
      expect(mockSaveActiveSession).toHaveBeenCalledWith({
        ...activeSession(),
        unlockAttemptCount: 1,
        pendingEmergencyUnlock: {
          reason: 'urgent',
          delaySeconds: 10,
          startedAt: now + 5_000,
          unlockAt: now + 15_000,
        },
      });
    });
  });

  it('clears the shield after the unlock delay', async () => {
    const screen = await renderLoadedSession();
    await openReasonSelection(screen);

    fireEvent.press(screen.getByText('Something urgent'));

    expect(await screen.findByText('10')).toBeTruthy();

    await advanceTimersByTime(10_000);

    await waitFor(() => {
      expect(mockClearShield).toHaveBeenCalledTimes(1);
    });
  });

  it('clears the active session after a successful emergency unlock', async () => {
    const screen = await renderLoadedSession();
    await openReasonSelection(screen);

    fireEvent.press(screen.getByText('Something urgent'));
    await advanceTimersByTime(10_000);

    await waitFor(() => {
      expect(mockClearActiveSession).toHaveBeenCalledTimes(1);
    });
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('writes an emergency unlock history entry after a successful emergency unlock', async () => {
    const screen = await renderLoadedSession();
    await openReasonSelection(screen);

    fireEvent.press(screen.getByText('Something urgent'));
    await advanceTimersByTime(10_000);

    await waitFor(() => {
      expect(mockAppendSessionHistoryEntry).toHaveBeenCalledWith({
        id: 'session-1-emergency-unlock',
        startedAt: now,
        endedAt: now + 15_000,
        durationMinutes: 30,
        outcome: 'emergency_unlock',
        unlockReason: 'urgent',
        unlockAttemptCount: 1,
      });
    });
  });

  it('shows an error and keeps the session recoverable when shield clearing fails', async () => {
    mockClearShield.mockResolvedValue('unsupported');
    const screen = await renderLoadedSession();
    await openReasonSelection(screen);

    fireEvent.press(screen.getByText('Something urgent'));
    await advanceTimersByTime(10_000);
    await advanceTimersByTime(300);
    await advanceTimersByTime(300);

    expect(
      await screen.findByText('Shield clear did not confirm success after 3 attempts: unsupported'),
    ).toBeTruthy();
    expect(mockClearShield).toHaveBeenCalledTimes(3);
    expect(mockClearActiveSession).not.toHaveBeenCalled();
    expect(mockAppendSessionHistoryEntry).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockSaveActiveSession).toHaveBeenLastCalledWith({
      ...activeSession(),
      unlockAttemptCount: 1,
      pendingEmergencyUnlock: undefined,
    });
  });

  it('writes a completed history entry when the session reaches its end time', async () => {
    const screen = await renderLoadedSession(activeSession({ endsAt: now + 2_000 }));

    expect(await screen.findByText('00:02')).toBeTruthy();

    await advanceTimersByTime(2_000);

    await waitFor(() => {
      expect(mockAppendSessionHistoryEntry).toHaveBeenCalledWith({
        id: 'session-1-completed',
        startedAt: now,
        endedAt: now + 2_000,
        durationMinutes: 30,
        outcome: 'completed',
      });
    });
    expect(mockClearShield).toHaveBeenCalledTimes(1);
    expect(mockClearActiveSession).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
