# System Overview

tunnel will be built as an iPhone-first product with a mobile app at the center.

## Main parts

### Mobile app
The mobile app is the main user-facing layer.

Responsibilities:
- screens and navigation
- user flows
- session controls
- app selection UI
- local state
- communication with services

### Services layer
The services layer is the application boundary between UI code and device/platform logic.

Examples:
- focus control service
- NFC service
- storage service
- analytics service

### Native module
The native module will connect TypeScript code to iOS-native functionality.

Responsibilities:
- expose a small JS-friendly API
- call into Swift / iOS frameworks
- keep native-specific complexity out of the UI layer

### iOS native side
This includes iOS frameworks and extension targets.

Possible responsibilities:
- Screen Time related capabilities
- shield configuration
- shield actions
- monitoring and enforcement logic

### Future backend
A backend may exist later, but it is not required to prove the main feasibility of the project.

Possible later responsibilities:
- session sync
- user accounts
- NFC/tag mapping
- subscriptions
- aggregated analytics

## High-level flow

UI -> service -> native bridge -> iOS framework / extension