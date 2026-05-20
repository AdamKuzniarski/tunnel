---
name: expo-react-native-safe-patch
description: Make safe, scoped changes in Expo React Native apps using Expo Router, TypeScript, NativeWind, and Jest. Use for mobile screens, routing, UI polish, and app flow fixes.
---

Rules:
1. Keep screens small and readable.
2. Prefer Expo Router conventions.
3. Do not change navigation structure unless requested.
4. Keep business logic separate from UI polish.
5. Use existing styling conventions.
6. Run:
    - npm run lint if available
    - npm run test:ci if available
    - npm run format:check if available
7. Explain any command that cannot run.