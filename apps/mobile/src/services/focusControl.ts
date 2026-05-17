import TunnelFocusControlModule from '../../modules/tunnel-focus-control';

import type {
  TunnelAuthorizationStatus,
  TunnelSelectionSummary,
  TunnelShieldResult,
} from '../../modules/tunnel-focus-control';

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
  return TunnelFocusControlModule.getSelectionSummary();
}

export async function clearSelection(): Promise<TunnelSelectionSummary> {
  return TunnelFocusControlModule.clearSelection();
}
