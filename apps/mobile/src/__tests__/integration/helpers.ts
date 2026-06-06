import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import TunnelFocusControlModule from '../../../modules/tunnel-focus-control';
import type {
  TunnelAuthorizationStatus,
  TunnelSessionMonitorResult,
  TunnelShieldResult,
} from '../../../modules/tunnel-focus-control';

// Typed reference to every mocked native method.
// Each integration test file must declare jest.mock('../../../modules/tunnel-focus-control', ...)
// at module scope before this helper is used.
export const nativeCalls = jest.mocked(TunnelFocusControlModule);

// --- Reset ---

export async function resetTestState(): Promise<void> {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' });
}

// --- Selection presets ---

export function setReadySelection(): void {
  nativeCalls.getSelectionSummary.mockResolvedValue({
    hasSelection: true,
    applicationCount: 2,
    categoryCount: 1,
    webDomainCount: 0,
  });
}

export function setEmptySelection(): void {
  nativeCalls.getSelectionSummary.mockResolvedValue({
    hasSelection: false,
    applicationCount: 0,
    categoryCount: 0,
    webDomainCount: 0,
  });
}

// --- Protection presets ---

export function setProtectionSuccess(): void {
  nativeCalls.applyShield.mockResolvedValue('applied');
  nativeCalls.clearShield.mockResolvedValue('cleared');
}

export function setProtectionFailure(result: TunnelShieldResult = 'noSelection'): void {
  nativeCalls.applyShield.mockResolvedValue(result);
}

// --- Monitoring presets ---

export function setMonitoringSuccess(): void {
  nativeCalls.startSessionMonitoring.mockResolvedValue('scheduled');
  nativeCalls.stopSessionMonitoring.mockResolvedValue('stopped');
}

export function setMonitoringFailure(result: TunnelSessionMonitorResult = 'failed'): void {
  nativeCalls.startSessionMonitoring.mockResolvedValue(result);
}

// --- Authorization presets ---

export function setAuthorizationApproved(): void {
  nativeCalls.getAuthorizationStatus.mockResolvedValue('approved' as TunnelAuthorizationStatus);
  nativeCalls.requestAuthorization.mockResolvedValue('approved' as TunnelAuthorizationStatus);
}

export function setAuthorizationDenied(): void {
  nativeCalls.getAuthorizationStatus.mockResolvedValue('denied' as TunnelAuthorizationStatus);
  nativeCalls.requestAuthorization.mockResolvedValue('denied' as TunnelAuthorizationStatus);
}
