import { NativeModule, requireNativeModule } from 'expo';

import {
  TunnelAuthorizationStatus,
  TunnelFocusControlModuleEvents,
  TunnelSelectionSummary,
  TunnelShieldResult,
} from './TunnelFocusControl.types';

declare class TunnelFocusControlModule extends NativeModule<TunnelFocusControlModuleEvents> {
  getAuthorizationStatus(): Promise<TunnelAuthorizationStatus>;
  requestAuthorization(): Promise<TunnelAuthorizationStatus>;
  applyShield(): Promise<TunnelShieldResult>;
  clearShield(): Promise<TunnelShieldResult>;
  getSelectionSummary(): Promise<TunnelSelectionSummary>;
  clearSelection(): Promise<TunnelSelectionSummary>;
}

export default requireNativeModule<TunnelFocusControlModule>('TunnelFocusControl');
