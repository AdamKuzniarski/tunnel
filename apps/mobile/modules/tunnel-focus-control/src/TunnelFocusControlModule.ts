import { NativeModule, requireNativeModule } from 'expo';

import { TunnelFocusControlModuleEvents } from './TunnelFocusControl.types';

declare class TunnelFocusControlModule extends NativeModule<TunnelFocusControlModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<TunnelFocusControlModule>('TunnelFocusControl');
