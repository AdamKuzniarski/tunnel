export type TunnelAuthorizationStatus =
  | 'notDetermined'
  | 'denied'
  | 'approved'
  | 'approverdWithDataAcces'
  | 'unknown'
  | 'unsupported';

export type TunnelFocusControlModuleEvents = {};

export type TunnelSelectionSummary = {
  hasSelection: boolean;
  applicationCount: number;
  categoryCount: number;
  webDomainCount: number;
};
