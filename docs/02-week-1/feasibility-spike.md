# Feasibility Spike

## Goal

Understand the main iOS-nativ feasibility risks for tunnel.

## Apple stack
Role:
- authorization
- user-selected app / website / category picking
- privacy-preserving tokens instead of raw app identity

### ManagedSettings
Role:
- apply restrictions and shield behavior
- works together with FamilyControls and DeviceActivity

### DeviceActivity
Role:
- monitor user activity on a schedule
- trigger warnings and threshold events
- extension-based monitoring model