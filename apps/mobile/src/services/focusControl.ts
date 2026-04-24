import TunnelFocusControlModule from '../../modules/tunnel-focus-control';
import type { TunnelAuthorizationStatus } from '../../modules/tunnel-focus-control/src/TunnelFocusControl.types';

export async function getAuthorizationStatus(): Promise<TunnelAuthorizationStatus> {
  return TunnelFocusControlModule.getAuthorizationStatus();
}

export async function requestAuthorization(): Promise<TunnelAuthorizationStatus> {
  return TunnelFocusControlModule.requestAuthorization();
}
