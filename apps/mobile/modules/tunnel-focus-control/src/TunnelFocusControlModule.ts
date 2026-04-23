import { NativeModule, requireNativeModule } from 'expo';

import {
  TunnelAuthorizationStatus,
  TunnelFocusControlModuleEvents,
} from './TunnelFocusControl.types';

declare class TunnelFocusControlModule extends NativeModule<TunnelFocusControlModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
  getAuthorizationStatus(): Promise<TunnelAuthorizationStatus>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<TunnelFocusControlModule>('TunnelFocusControl');
