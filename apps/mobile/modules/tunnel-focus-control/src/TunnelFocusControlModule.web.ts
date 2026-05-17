import { registerWebModule, NativeModule } from 'expo';

import {
  TunnelAuthorizationStatus,
  TunnelFocusControlModuleEvents,
  TunnelSelectionSummary,
  TunnelShieldResult,
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

  async applyShield(): Promise<TunnelShieldResult> {
    return 'unsupported';
  }

  async clearShield(): Promise<TunnelShieldResult> {
    return 'unsupported';
  }

  async getSelectionSummary(): Promise<TunnelSelectionSummary> {
    return {
      hasSelection: false,
      applicationCount: 0,
      categoryCount: 0,
      webDomainCount: 0,
    };
  }

  async clearSelection(): Promise<TunnelSelectionSummary> {
    return {
      hasSelection: false,
      applicationCount: 0,
      categoryCount: 0,
      webDomainCount: 0,
    };
  }
  hello() {
    return 'Hello world!';
  }
}

export default registerWebModule(TunnelFocusControlModule, 'TunnelFocusControl');
