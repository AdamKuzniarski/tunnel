import TunnelFocusControlModule, { TunnelShieldResult } from '../../modules/tunnel-focus-control';
import type { TunnelAuthorizationStatus } from '../../modules/tunnel-focus-control/src/TunnelFocusControl.types';

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
