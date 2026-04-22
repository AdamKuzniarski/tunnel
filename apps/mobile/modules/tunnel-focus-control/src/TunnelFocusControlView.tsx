import { requireNativeView } from 'expo';
import * as React from 'react';

import { TunnelFocusControlViewProps } from './TunnelFocusControl.types';

const NativeView: React.ComponentType<TunnelFocusControlViewProps> =
  requireNativeView('TunnelFocusControl');

export default function TunnelFocusControlView(props: TunnelFocusControlViewProps) {
  return <NativeView {...props} />;
}
