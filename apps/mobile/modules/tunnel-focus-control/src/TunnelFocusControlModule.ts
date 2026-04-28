import { NativeModule, requireNativeModule } from 'expo';

import {
  TunnelAuthorizationStatus,
  TunnelFocusControlModuleEvents,
  TunnelShieldResult,
} from './TunnelFocusControl.types';

declare class TunnelFocusControlModule extends NativeModule<TunnelFocusControlModuleEvents> {
  getAuthorizationStatus(): Promise<TunnelAuthorizationStatus>;
  requestAuthorization(): Promise<TunnelAuthorizationStatus>;
  applyShield(): Promise<TunnelShieldResult>;
  clearShield(): Promise<TunnelShieldResult>;
}

export default requireNativeModule<TunnelFocusControlModule>('TunnelFocusControl');
