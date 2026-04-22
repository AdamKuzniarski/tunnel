import * as React from 'react';

import { TunnelFocusControlViewProps } from './TunnelFocusControl.types';

export default function TunnelFocusControlView(props: TunnelFocusControlViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
