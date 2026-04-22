# NFC Notes

## Goal

Understand whether is realistic and useful for tunnel to support NFC-based interactions.

## What Apple says

- Core NFC is for reading NFC tags and related tag formats
- NFC requires a supported physical device
- NFC is not available in app extentions
- the app should check whether reading is available 
- NFC usage need a usage description in the info.plist

## What this means for tunnel

- NFC is a real-device feature, *not*-checkable in the simulator
- NFC should stay outside the extention architecture
- NFC is useful as ritual / unlock friction, **not as the core blocker itself** 