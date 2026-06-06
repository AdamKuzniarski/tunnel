import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { loadSessionHistory } from '@/services/sessionHistoryStorage';
import type { SessionHistoryEntry } from '@/types/sessionHistory';

import HistoryScreen from '../app/history';

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');

  return {
    SafeAreaView: ({ children }: PropsWithChildren) => <View>{children}</View>,
  };
});

jest.mock('@/services/sessionHistoryStorage', () => ({
  loadSessionHistory: jest.fn(),
}));

const mockLoadSessionHistory = jest.mocked(loadSessionHistory);

const now = 1_700_000_000_000;

function completedEntry(overrides: Partial<SessionHistoryEntry> = {}): SessionHistoryEntry {
  return {
    id: 'entry-1',
    startedAt: now,
    endedAt: now + 60 * 60 * 1000,
    durationMinutes: 60,
    outcome: 'completed',
    ...overrides,
  };
}

function emergencyEntry(overrides: Partial<SessionHistoryEntry> = {}): SessionHistoryEntry {
  return {
    id: 'entry-2',
    startedAt: now,
    endedAt: now + 60 * 60 * 1000,
    durationMinutes: 60,
    outcome: 'emergency_unlock',
    unlockReason: 'urgent',
    ...overrides,
  };
}

async function renderLoaded(entries: SessionHistoryEntry[] = [completedEntry()]) {
  mockLoadSessionHistory.mockResolvedValue(entries);
  const screen = render(<HistoryScreen />);
  await act(async () => {
    await Promise.resolve();
  });
  return screen;
}

describe('HistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state while history is loading', () => {
    mockLoadSessionHistory.mockReturnValue(new Promise(() => {}));

    const { getByText } = render(<HistoryScreen />);

    expect(getByText('Loading history...')).toBeTruthy();
  });

  it('disables the refresh button while loading', () => {
    mockLoadSessionHistory.mockReturnValue(new Promise(() => {}));

    const { getByRole } = render(<HistoryScreen />);

    const button = getByRole('button', { name: 'Refreshing...' });
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });

  it('shows empty state when there are no history entries', async () => {
    const { getByText } = await renderLoaded([]);

    expect(getByText('Your completed sessions and unlock events will appear here.')).toBeTruthy();
  });

  it('renders completed session outcome and duration', async () => {
    const { getByText } = await renderLoaded([completedEntry()]);

    expect(getByText('completed')).toBeTruthy();
    expect(getByText('60 min')).toBeTruthy();
  });

  it('renders emergency unlock outcome', async () => {
    const { getByText } = await renderLoaded([emergencyEntry()]);

    expect(getByText('emergency unlock')).toBeTruthy();
  });

  it('renders started and ended timestamps for an entry', async () => {
    const { getByText } = await renderLoaded([completedEntry()]);

    expect(getByText(/Started:/)).toBeTruthy();
    expect(getByText(/Ended:/)).toBeTruthy();
  });
  //
  it('calls loadSessionHistory again when refresh is pressed', async () => {
    const { getByText } = await renderLoaded();

    fireEvent.press(getByText('Refresh history'));

    await waitFor(() => {
      expect(mockLoadSessionHistory).toHaveBeenCalledTimes(2);
    });
  });

  it('shows error message when history fails to load', async () => {
    mockLoadSessionHistory.mockRejectedValue(new Error('storage failed'));
    const screen = render(<HistoryScreen />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Error: storage failed')).toBeTruthy();
  });
});
