# iOS Boundaries

This project depends on iOS-specific capabilities.

That means the architecture must clearly separate:
-  JavaScript / TypeScript
-  native bridge
-  iOS-native side

## JavaScript / TypeScript

**This side should handle:**
- screens and navigation
- user actions
- feature flows
- app state
- service interfaces
- non-native logic

**This side should not contain deep iOS assumption**

## Native bridge

This side should:
- expose a small and clean API to TypeScript
- translate app commands into iOS-native calls
- return native status back to the app

*Examples:*
- request authorization
- get auth status
- select apps
- start focus session
- stop focus session
- apply or clear shield state

## iOS-native

**This side should:**
- framework-specific integration
- entitlement-dependent behavior
- extension-specific logic
- native configuration



