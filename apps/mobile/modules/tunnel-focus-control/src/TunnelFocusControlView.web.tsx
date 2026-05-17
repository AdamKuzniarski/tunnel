import * as React from 'react';

import { TunnelFocusControlViewProps } from './TunnelFocusControl.types';

export default function TunnelFocusControlView(props: TunnelFocusControlViewProps) {
  React.useEffect(() => {
    props.onSelectionChange?.({
      nativeEvent: {
        hasSelection: false,
        applicationCount: 0,
        categoryCount: 0,
        webDomainCount: 0,
      },
    });
  }, [props.onSelectionChange]);

  return (
    <div style={{ width: '100%', minHeight: 240 }} />
  );
}
