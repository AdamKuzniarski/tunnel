# Manual iOS QA Plan

## Purpose

This plan covers real-device verification of tunnel's native iOS behavior. The Jest suite already covers the JavaScript app layer: session lifecycle, storage, navigation, retry logic, and the mocked native boundary. This document covers what Jest cannot: Screen Time permission dialogs, native blocklist selection, real app shielding, and device-level session expiry.

Run this plan on a physical iPhone using a TestFlight build before each release.

---

## Test Environment

| Field | Value |
|---|---|
| Device | |
| iOS version | |
| TestFlight build # | |
| Date | |
| Tester | |

---

## Pre-test Checklist

- [ ] Install the TestFlight build on a real iPhone (Simulator does not support Screen Time APIs)
- [ ] Go to **Settings → Screen Time** and confirm Screen Time is enabled for the test device
- [ ] If re-testing: delete the app and reinstall to reset onboarding and permission state
- [ ] Have at least two apps installed that you can use as test blocklist targets (e.g. Safari, Photos)
- [ ] Confirm you are not in an active Screen Time downtime or parental control restriction that could interfere

---

## Scenarios

### 1. First launch and permission approval

Steps:
- [ ] Open tunnel for the first time
- [ ] Complete the onboarding flow
- [ ] When prompted, grant Screen Time / FamilyControls permission

Expected result: iOS displays a native Screen Time authorization dialog. After approving, the app proceeds to the home screen. No error banners appear.

---

### 2. Permission denied

Steps:
- [ ] Reinstall the app to reset permission state
- [ ] Complete the onboarding flow
- [ ] When the Screen Time permission dialog appears, tap **Don't Allow**

Expected result: The app reflects the denied state. The user cannot start a focus session. A clear message explains that Screen Time permission is required.

---

### 3. Native blocklist selection

Steps:
- [ ] From the home screen, tap the app selection area
- [ ] The native FamilyActivityPicker opens
- [ ] Select at least one app, one app category, and one web domain
- [ ] Confirm the selection

Expected result: The native picker opens without crashing. After confirming, the home screen shows a selection summary (e.g. "2 apps, 1 category, 1 domain"). No blank or zero counts appear when items were selected.

---

### 4. Selection persists after app restart

Steps:
- [ ] Complete scenario 3 (make a selection)
- [ ] Force-quit tunnel from the app switcher
- [ ] Reopen tunnel

Expected result: The home screen still shows the previous selection summary. Selection is not lost on restart.

---

### 5. Start a focus session

Steps:
- [ ] Confirm a blocklist selection is in place (scenario 3)
- [ ] From the home screen, choose a session duration (30, 60, or 90 minutes)
- [ ] Tap **Start**

Expected result: The app transitions to the focus session screen. A countdown timer is visible and running. The correct duration is shown.

---

### 6. Shield applies to selected apps

Steps:
- [ ] Start a focus session (scenario 5)
- [ ] Press the home button to return to the iOS home screen
- [ ] Tap one of the apps you added to the blocklist

Expected result: The selected app is blocked. iOS displays a Screen Time shield ("Time Limit" or the app's native block screen). The app does not open normally.

---

### 7. Emergency unlock clears shield

Steps:
- [ ] While a focus session is active, open tunnel
- [ ] Tap **Emergency unlock**
- [ ] Hold the confirmation button for the full 5 seconds
- [ ] Select a reason from the picker
- [ ] If a delay is applied, wait it out
- [ ] Confirm the unlock

Expected result: The shield is removed. Previously blocked apps open normally. Session history records the outcome as an emergency unlock with the selected reason. On a second unlock attempt in the same session, a longer delay is applied before unlock is allowed.

---

### 8. Session expires naturally

Steps:
- [ ] Start a 30-minute session (or confirm via a short debug build if available)
- [ ] Keep the app open until the countdown reaches zero

Expected result: At session end, the shield is automatically cleared. The app returns to the home or history screen. Session history shows the session as "completed" with the correct duration.

---

### 9. Session expires while app is backgrounded or closed

Steps:
- [ ] Start a focus session
- [ ] Press the home button to background tunnel
- [ ] Wait until the session end time passes (leave the phone idle)
- [ ] Reopen tunnel

Expected result: The shield is cleared even though the app was backgrounded. Blocked apps are accessible again. When tunnel is reopened, the session is no longer shown as active. Session history records it as "completed".

---

### 10. Clear selection

Steps:
- [ ] Confirm a blocklist selection is in place
- [ ] Navigate to the selection screen or settings
- [ ] Clear the selection

Expected result: The selection summary on the home screen resets to zero. Starting a new session without re-selecting is blocked with a clear message prompting the user to add apps first.

---

## TestFlight Release Sanity Checklist

- [ ] App launches from a cold start without crashing
- [ ] TestFlight build number matches the intended release
- [ ] Onboarding screen appears on first install
- [ ] Home screen loads with correct UI state (no stuck spinner, no error banner)
- [ ] Session duration options are selectable (30 / 60 / 90 min)
- [ ] Session history screen opens and displays past sessions (or empty state)
- [ ] Settings screen opens without crashing
- [ ] No obvious visual regressions on iPhone 15 or equivalent current hardware

---

## Notes / Bugs Found

| Scenario | Pass / Fail | Notes |
|---|---|---|
| 1. Permission approval | | |
| 2. Permission denied | | |
| 3. Native blocklist selection | | |
| 4. Selection persists after restart | | |
| 5. Start focus session | | |
| 6. Shield applies | | |
| 7. Emergency unlock | | |
| 8. Session expires naturally | | |
| 9. Session expires while backgrounded | | |
| 10. Clear selection | | |
| TestFlight sanity | | |
