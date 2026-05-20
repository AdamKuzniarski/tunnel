---
name: native-ios-expo-module-review
description: Review and safely modify Expo native iOS module code, Swift bridges, Screen Time API integrations, NFC prototypes, and iOS permission/capability setup.
---

Rules:
1. Treat native iOS code as high-risk.
2. Do not change entitlements, capabilities, or app identifiers casually.
3. Keep JS/native bridge contracts explicit and typed.
4. Add graceful fallbacks for simulator and unsupported devices.
5. Separate prototype-only behavior from MVP flow.
6. After changes, explain:
    - Swift files changed
    - JS bridge files changed
    - required iOS config
    - simulator/device limitations