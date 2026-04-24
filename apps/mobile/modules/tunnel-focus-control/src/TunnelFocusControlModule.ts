import { NativeModule, requireNativeModule } from 'expo';

import {
  TunnelAuthorizationStatus,
  TunnelFocusControlModuleEvents,
} from './TunnelFocusControl.types';

declare class TunnelFocusControlModule extends NativeModule<TunnelFocusControlModuleEvents> {
  getAuthorizationStatus(): Promise<TunnelAuthorizationStatus>;
  requestAuthorization(): Promise<TunnelAuthorizationStatus>;
}

export default requireNativeModule<TunnelFocusControlModule>('TunnelFocusControl');
