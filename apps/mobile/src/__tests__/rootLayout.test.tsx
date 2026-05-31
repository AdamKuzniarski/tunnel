import { act, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { AppState } from 'react-native';

import { reconcileExpiredActiveSession } from '@/services/sessionExpiry';

const mockPreventAutoHideAsync = jest.fn();
const mockHideAsync = jest.fn();
const mockRemoveAppStateListener = jest.fn();
let mockAppStateHandler: ((state: string) => void) | null = null;

jest.mock('expo-router', () => ({
  Stack: () => {
    const { Text } = jest.requireActual('react-native');

    return <Text>Stack</Text>;
  },
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: mockPreventAutoHideAsync,
  hideAsync: mockHideAsync,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: PropsWithChildren) => {
    const { View } = jest.requireActual('react-native');

    return <View>{children}</View>;
  },
}));

jest.mock('@/services/sessionExpiry', () => ({
  reconcileExpiredActiveSession: jest.fn(),
}));

const mockReconcileExpiredActiveSession = jest.mocked(reconcileExpiredActiveSession);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RootLayout = require('../app/_layout').default as typeof import('../app/_layout').default;

describe('RootLayout expiry reconciliation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockAppStateHandler = null;
    mockPreventAutoHideAsync.mockResolvedValue(undefined);
    mockHideAsync.mockResolvedValue(undefined);
    mockReconcileExpiredActiveSession.mockResolvedValue({ expired: false });
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
      mockAppStateHandler = handler;
      return { remove: mockRemoveAppStateListener };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('keeps expiry reconciliation scheduled after the app backgrounds', async () => {
    const { unmount } = render(<RootLayout />);

    await waitFor(() => {
      expect(mockReconcileExpiredActiveSession).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      mockAppStateHandler?.('background');
      jest.advanceTimersByTime(5_000);
    });

    await waitFor(() => {
      expect(mockReconcileExpiredActiveSession).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      mockAppStateHandler?.('active');
    });

    await waitFor(() => {
      expect(mockReconcileExpiredActiveSession).toHaveBeenCalledTimes(3);
    });

    unmount();

    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });

    expect(mockReconcileExpiredActiveSession).toHaveBeenCalledTimes(3);
    expect(mockRemoveAppStateListener).toHaveBeenCalledTimes(1);
  });
});
