export type TunnelAuthorizationStatus =
  | 'notDetermined'
  | 'denied'
  | 'approved'
  | 'approvedWithDataAccess'
  | 'unknown'
  | 'unsupported';

export type TunnelFocusControlModuleEvents = {};

export type TunnelSelectionSummary = {
  hasSelection: boolean;
  applicationCount: number;
  categoryCount: number;
  webDomainCount: number;
};
