import { ViewProps } from 'react-native';

export type TunnelAuthorizationStatus =
  | 'notDetermined'
  | 'denied'
  | 'approved'
  | 'approvedWithDataAccess'
  | 'unknown'
  | 'unsupported';

export type TunnelShieldResult = 'applied' | 'cleared' | 'noSelection' | 'unsupported';

export type TunnelSelectionSummary = {
  hasSelection: boolean;
  applicationCount: number;
  categoryCount: number;
  webDomainCount: number;
};

export type TunnelFocusControlModuleEvents = {};

export type TunnelFocusControlViewProps = ViewProps & {
  onSelectionChange?: (event: { nativeEvent: TunnelSelectionSummary }) => void;
};
