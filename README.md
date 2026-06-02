# tunnel 

** Stay focused**

![Expo](https://img.shields.io/badge/Expo-55-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.83-61DAFB?logo=react&logoColor=black)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Swift](https://img.shields.io/badge/Swift-Native%20iOS-FA7343?logo=swift&logoColor=white)
![iOS](https://img.shields.io/badge/iOS-Screen%20Time-111111?logo=apple&logoColor=white)
![Jest](https://img.shields.io/badge/Tests-Jest-C21325?logo=jest&logoColor=white)

tunnel is an iPhone-first productivity app built as a portfolio project to demonstrate how React Native and Swift can work together in a real native iOS feature.

It helps users block selected distractions during timed focus sessions, with intentional friction when they try to quit early.

## Preview

<p align="center">
  <img src="docs/assets/screenshots/home.png" width="220" alt="tunnel home screen" />
  <img src="docs/assets/screenshots/selection.png" width="220" alt="tunnel selection screen" />
  <img src="docs/assets/screenshots/focus-session.png" width="220" alt="tunnel focus session screen" />
 

## What it does

tunnel  helps users create focused work sessions by blocking selected distractions for a chosen duration.

During a session, the app keeps the experience intentionally simple: a countdown, a clear focus state, and an emergency unlock flow that adds friction before quitting early.

## Why this project matters

tunnel is more than a React Native UI demo. It combines a mobile interface with native Swift code to access iOS Screen Time features.

The project demonstrates working across the JavaScript/native boundary, handling platform-specific APIs, and building a complete focus-session flow from setup to history.

## Core Features

- Create timed focus sessions
- Select apps, categories, and web domains to block
- Apply native iOS shielding during active sessions
- Quit early only through an emergency unlock flow
- Add friction with hold-to-confirm, reason selection, and delay
- Save local session history

## Tech Highlights

**React Native**

- Expo app with Expo Router
- TypeScript-first implementation
- Local session state and history persistence

**Native iOS**

- Custom Swift module via Expo Modules
- Native Screen Time authorization flow
- Persistent native blocklist selection
- iOS shielding for apps, categories, and web domains

**Quality**

- Jest tests for core app logic
- Small feature-based app structure
- Clear separation between UI, services, native bridge wrappers, storage, and shared types

## Status

**Distribution-ready portfolio app.**

The app-side implementation is complete and in final testing. The repository demonstrates the full focus flow, including native iOS integration, persistent blocklist selection, timed focus sessions, emergency unlock friction, and local session history.

## Run locally

```bash
cd apps/mobile
npm install
npm run ios
```

```bash
npm test
npm run lint
```

The full focus-blocking flow targets iOS and is best tested on a real iPhone.

## Project Structure

```txt
apps/mobile/
├─ src/
│  ├─ app/        # Expo Router screens
│  ├─ components/ # reusable UI components
│  ├─ services/   # app services, storage, native bridge wrappers
│  └─ types/      # shared TypeScript types
└─ modules/
   └─ tunnel-focus-control/ # custom Expo Module with Swift iOS implementation
```

## Author

Built by Adam Kuzniarski as a mobile portfolio project.

- Portfolio: https://adamkuzniarski.dev
- GitHub: https://github.com/AdamKuzniarski
- LinkedIn: https://linkedin.com/in/adam-kuzniarski/
