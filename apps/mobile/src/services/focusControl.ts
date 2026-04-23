import TunnelFocusControlModule from '../../modules/tunnel-focus-control';
import type { TunnelAuthorizationStatus } from '../../modules/tunnel-focus-control';

export async function getAuthorizationStatus(): Promise<TunnelAuthorizationStatus> {
  return TunnelFocusControlModule.getAuthorizationStatus();
}
export function requestAuthorization() {
  throw new Error('Not implemented yet.');
}

export function startSession() {
  throw new Error('Not implemented yet.');
}

export function stopSession() {
  throw new Error('Not implemented yet.');
}
