import type { StyleProp, ViewStyle } from 'react-native';

export type OnLoadEventPayload = {
  url: string;
};

export type TunnelAuthorizationStatus =
  | 'notDetermined'
  | 'denied'
  | 'approved'
  | 'approvedWithDataAccess'
  | 'unknown';

export type TunnelFocusControlModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

export type ChangeEventPayload = {
  value: string;
};

export type TunnelFocusControlViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
