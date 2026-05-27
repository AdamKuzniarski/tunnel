/* eslint-disable @typescript-eslint/no-require-imports */

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Work around Reanimated mock requiring this global in some RN versions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).__reanimatedWorkletInit = () => {};

