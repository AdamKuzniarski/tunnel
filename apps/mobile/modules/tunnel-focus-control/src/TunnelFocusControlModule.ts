import { NativeModule, requireNativeModule } from 'expo';

import {
  TunnelAuthorizationStatus,
  TunnelFocusControlModuleEvents,
  TunnelSelectionSummary,
  TunnelSessionMonitorResult,
  TunnelShieldResult,
} from './TunnelFocusControl.types';

declare class TunnelFocusControlModule extends NativeModule<TunnelFocusControlModuleEvents> {
  getAuthorizationStatus(): Promise<TunnelAuthorizationStatus>;
  requestAuthorization(): Promise<TunnelAuthorizationStatus>;
  applyShield(): Promise<TunnelShieldResult>;
  clearShield(): Promise<TunnelShieldResult>;
  startSessionMonitoring(endsAt: number): Promise<TunnelSessionMonitorResult>;
  stopSessionMonitoring(): Promise<TunnelSessionMonitorResult>;
  getSelectionSummary(): Promise<TunnelSelectionSummary>;
  clearSelection(): Promise<TunnelSelectionSummary>;
}

export default requireNativeModule<TunnelFocusControlModule>('TunnelFocusControl');
