import { NativeModule, registerWebModule } from 'expo';

import type {
  TunnelAuthorizationStatus,
  TunnelFocusControlModuleEvents,
  TunnelSelectionSummary,
  TunnelShieldResult,
} from './TunnelFocusControl.types';

class TunnelFocusControlModule extends NativeModule<TunnelFocusControlModuleEvents> {
  async getAuthorizationStatus(): Promise<TunnelAuthorizationStatus> {
    return 'unsupported';
  }

  async requestAuthorization(): Promise<TunnelAuthorizationStatus> {
    return 'unsupported';
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
}

export default registerWebModule(TunnelFocusControlModule, 'TunnelFocusControl');
