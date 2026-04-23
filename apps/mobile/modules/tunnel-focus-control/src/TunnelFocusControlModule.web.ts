import { registerWebModule, NativeModule } from 'expo';

import {
  TunnelAuthorizationStatus,
  TunnelFocusControlModuleEvents,
} from './TunnelFocusControl.types';

class TunnelFocusControlModule extends NativeModule<TunnelFocusControlModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }

  async getAuthorizationStatus(): Promise<TunnelAuthorizationStatus> {
    // FamilyControls doesn't exist on web; return a stable fallback.
    return 'notDetermined';
  }

  hello() {
    return 'Hello world!';
  }
}

export default registerWebModule(TunnelFocusControlModule, 'TunnelFocusControl');
