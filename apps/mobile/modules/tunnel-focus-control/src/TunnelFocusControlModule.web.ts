import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './TunnelFocusControl.types';

type TunnelFocusControlModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class TunnelFocusControlModule extends NativeModule<TunnelFocusControlModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(TunnelFocusControlModule, 'TunnelFocusControlModule');
