import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { clearSelection, getSelectionSummary } from '@/services/focusControl';
import type { TunnelSelectionSummary } from '../../modules/tunnel-focus-control';

import SelectionScreen from '../app/selection';

let mockParams: { returnTo?: string } = {};
const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');

  return {
    SafeAreaView: ({ children }: PropsWithChildren) => <View>{children}</View>,
  };
});

let capturedOnSelectionChange:
  | ((e: { nativeEvent: TunnelSelectionSummary }) => void)
  | undefined;

jest.mock('../../modules/tunnel-focus-control', () => ({
  TunnelFocusControlView: ({ onSelectionChange }: any) => {
    capturedOnSelectionChange = onSelectionChange;
    return null;
  },
}));

jest.mock('@/services/focusControl', () => ({
  getSelectionSummary: jest.fn(),
  clearSelection: jest.fn(),
}));

const mockGetSelectionSummary = jest.mocked(getSelectionSummary);
const mockClearSelection = jest.mocked(clearSelection);

let consoleLogSpy: jest.SpyInstance;

const emptySelection: TunnelSelectionSummary = {
  hasSelection: false,
  applicationCount: 0,
  categoryCount: 0,
  webDomainCount: 0,
};

const readySelection: TunnelSelectionSummary = {
  hasSelection: true,
  applicationCount: 3,
  categoryCount: 1,
  webDomainCount: 2,
};

async function renderLoaded() {
  const screen = render(<SelectionScreen />);
  await act(async () => {
    await Promise.resolve();
  });
  return screen;
}

describe('SelectionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    capturedOnSelectionChange = undefined;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    mockGetSelectionSummary.mockResolvedValue(emptySelection);
    mockClearSelection.mockResolvedValue(emptySelection);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('shows "Not ready" when no native selection exists', async () => {
    const { findByText } = await renderLoaded();

    expect(await findByText('Not ready')).toBeTruthy();
  });

  it('shows "Ready" when a native selection exists', async () => {
    mockGetSelectionSummary.mockResolvedValue(readySelection);

    const { findByText } = await renderLoaded();

    expect(await findByText('Ready')).toBeTruthy();
  });

  it('renders app, category, and web domain counts', async () => {
    mockGetSelectionSummary.mockResolvedValue(readySelection);

    const { findByText } = await renderLoaded();

    expect(await findByText('3')).toBeTruthy();
    expect(await findByText('1')).toBeTruthy();
    expect(await findByText('2')).toBeTruthy();
  });

  it('updates the summary when the native picker fires a selection event', async () => {
    const { findByText } = await renderLoaded();

    expect(await findByText('Not ready')).toBeTruthy();

    await act(async () => {
      capturedOnSelectionChange?.({ nativeEvent: readySelection });
    });

    expect(await findByText('Ready')).toBeTruthy();
  });

  it('disables "Clear selection" when there is no selection', async () => {
    const { getByRole } = await renderLoaded();

    const clearButton = getByRole('button', { name: 'Clear selection' });

    expect(clearButton.props.accessibilityState).toEqual({ disabled: true });
  });

  it('calls clearSelection when "Clear selection" is pressed', async () => {
    mockGetSelectionSummary.mockResolvedValue(readySelection);

    const { findByText } = await renderLoaded();
    fireEvent.press(await findByText('Clear selection'));

    await waitFor(() => {
      expect(mockClearSelection).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the error message when clearSelection fails', async () => {
    mockGetSelectionSummary.mockResolvedValue(readySelection);
    mockClearSelection.mockRejectedValue(new Error('boom'));

    const { findByText } = await renderLoaded();
    fireEvent.press(await findByText('Clear selection'));

    expect(await findByText('Error: boom')).toBeTruthy();
  });

  it('routes to /onboarding when returnTo=onboarding', async () => {
    mockParams = { returnTo: 'onboarding' };

    const { findByText } = await renderLoaded();
    fireEvent.press(await findByText('Done'));

    expect(mockReplace).toHaveBeenCalledWith('/onboarding');
  });

  it('routes to /focus-session when returnTo=focus-session', async () => {
    mockParams = { returnTo: 'focus-session' };

    const { findByText } = await renderLoaded();
    fireEvent.press(await findByText('Done'));

    expect(mockReplace).toHaveBeenCalledWith('/focus-session');
  });

  it('routes to / when no returnTo param is set', async () => {
    const { findByText } = await renderLoaded();
    fireEvent.press(await findByText('Done'));

    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
