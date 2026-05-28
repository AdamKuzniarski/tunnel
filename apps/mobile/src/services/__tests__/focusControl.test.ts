import { Platform } from 'react-native';

import TunnelFocusControlModule from '../../../modules/tunnel-focus-control';
import {
  applyShield,
  clearSelection,
  clearShield,
  getAuthorizationStatus,
  getSelectionSummary,
  requestAuthorization,
} from '../focusControl';

// Screen Time APIs cannot run under Jest; this mock verifies the JS bridge contract only.
jest.mock('../../../modules/tunnel-focus-control', () => ({
  __esModule: true,
  default: {
    getAuthorizationStatus: jest.fn(),
    requestAuthorization: jest.fn(),
    applyShield: jest.fn(),
    clearShield: jest.fn(),
    getSelectionSummary: jest.fn(),
    clearSelection: jest.fn(),
  },
}));

const mockTunnelFocusControlModule = jest.mocked(TunnelFocusControlModule);
const originalPlatformOS = Platform.OS;

function setPlatformOS(os: typeof Platform.OS) {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    get: () => os,
  });
}

describe('focusControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setPlatformOS('ios');
  });

  afterAll(() => {
    setPlatformOS(originalPlatformOS);
  });

  describe('getAuthorizationStatus', () => {
    it('returns the native authorization status', async () => {
      mockTunnelFocusControlModule.getAuthorizationStatus.mockResolvedValue('approved');

      await expect(getAuthorizationStatus()).resolves.toBe('approved');

      expect(mockTunnelFocusControlModule.getAuthorizationStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('requestAuthorization', () => {
    it('returns the native authorization request result', async () => {
      mockTunnelFocusControlModule.requestAuthorization.mockResolvedValue('denied');

      await expect(requestAuthorization()).resolves.toBe('denied');

      expect(mockTunnelFocusControlModule.requestAuthorization).toHaveBeenCalledTimes(1);
    });
  });

  describe('applyShield', () => {
    it('returns the native shield apply result', async () => {
      mockTunnelFocusControlModule.applyShield.mockResolvedValue('applied');

      await expect(applyShield()).resolves.toBe('applied');

      expect(mockTunnelFocusControlModule.applyShield).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearShield', () => {
    it('returns the native shield clear result', async () => {
      mockTunnelFocusControlModule.clearShield.mockResolvedValue('cleared');

      await expect(clearShield()).resolves.toBe('cleared');

      expect(mockTunnelFocusControlModule.clearShield).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSelectionSummary', () => {
    it('returns the native selection summary on iOS', async () => {
      const selectionSummary = {
        hasSelection: true,
        applicationCount: 2,
        categoryCount: 1,
        webDomainCount: 3,
      };
      mockTunnelFocusControlModule.getSelectionSummary.mockResolvedValue(selectionSummary);

      await expect(getSelectionSummary()).resolves.toEqual(selectionSummary);

      expect(mockTunnelFocusControlModule.getSelectionSummary).toHaveBeenCalledTimes(1);
    });

    it('returns an empty summary on Android without calling native selection APIs', async () => {
      setPlatformOS('android');

      await expect(getSelectionSummary()).resolves.toEqual({
        hasSelection: false,
        applicationCount: 0,
        categoryCount: 0,
        webDomainCount: 0,
      });

      expect(mockTunnelFocusControlModule.getSelectionSummary).not.toHaveBeenCalled();
    });
  });

  describe('clearSelection', () => {
    it('returns the native cleared selection summary on iOS', async () => {
      const selectionSummary = {
        hasSelection: false,
        applicationCount: 0,
        categoryCount: 0,
        webDomainCount: 0,
      };
      mockTunnelFocusControlModule.clearSelection.mockResolvedValue(selectionSummary);

      await expect(clearSelection()).resolves.toEqual(selectionSummary);

      expect(mockTunnelFocusControlModule.clearSelection).toHaveBeenCalledTimes(1);
    });

    it('returns an empty summary on Android without calling native selection APIs', async () => {
      setPlatformOS('android');

      await expect(clearSelection()).resolves.toEqual({
        hasSelection: false,
        applicationCount: 0,
        categoryCount: 0,
        webDomainCount: 0,
      });

      expect(mockTunnelFocusControlModule.clearSelection).not.toHaveBeenCalled();
    });
  });
});
