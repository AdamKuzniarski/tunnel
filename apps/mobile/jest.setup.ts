/* eslint-disable @typescript-eslint/no-require-imports */

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Work around Reanimated mock requiring this global in some RN versions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).__reanimatedWorkletInit = () => {};

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', languageTag: 'en-US' }],
}));
