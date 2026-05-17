import TunnelFocusControlModule from '../../modules/tunnel-focus-control';
import { Platform } from 'react-native';

import type {
  TunnelAuthorizationStatus,
  TunnelSelectionSummary,
  TunnelShieldResult,
} from '../../modules/tunnel-focus-control';

const EMPTY_SELECTION_SUMMARY: TunnelSelectionSummary = {
  hasSelection: false,
  applicationCount: 0,
  categoryCount: 0,
  webDomainCount: 0,
};

export async function getAuthorizationStatus(): Promise<TunnelAuthorizationStatus> {
  return TunnelFocusControlModule.getAuthorizationStatus();
}

export async function requestAuthorization(): Promise<TunnelAuthorizationStatus> {
  return TunnelFocusControlModule.requestAuthorization();
}

export async function applyShield(): Promise<TunnelShieldResult> {
  return TunnelFocusControlModule.applyShield();
}

export async function clearShield(): Promise<TunnelShieldResult> {
  return TunnelFocusControlModule.clearShield();
}

export async function getSelectionSummary(): Promise<TunnelSelectionSummary> {
  if (Platform.OS === 'android') {
    return EMPTY_SELECTION_SUMMARY;
  }

  return TunnelFocusControlModule.getSelectionSummary();
}

export async function clearSelection(): Promise<TunnelSelectionSummary> {
  if (Platform.OS === 'android') {
    return EMPTY_SELECTION_SUMMARY;
  }

  return TunnelFocusControlModule.clearSelection();
}
