// Reexport the native module. On web, it will be resolved to TunnelFocusControlModule.web.ts
// and on native platforms to TunnelFocusControlModule.ts
export { default } from './src/TunnelFocusControlModule';
export { default as TunnelFocusControlView } from './src/TunnelFocusControlView';
export * from  './src/TunnelFocusControl.types';
