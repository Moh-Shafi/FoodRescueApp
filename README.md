# FoodRescue — Zero-Waste Food Redistribution Network

**Mobile Programming — Major Project (Tugas Besar), Week 9–15**

> **Topic C: Zero-Waste Food Redistribution Network (SDG 12 — Responsible Consumption)**
>
> A platform that connects restaurants, hotels, and grocery stores with **surplus food that is still safe to eat** to orphanages and communities in need — reducing food waste while fighting hunger.

---

## The Problem

Every day, food businesses discard large amounts of edible surplus food at closing time. At the same time, many communities face food insecurity. FoodRescue bridges that gap with a location-aware mobile app: donors publish surplus listings, receivers find the nearest available food, and couriers handle pickup — all tracked on an interactive map.

## Key Features

| Feature | Status |
|---|---|
| Interactive map of surplus listings (react-native-maps) | ✅ Implemented |
| Real-time location tracking with adaptive sampling | ✅ Implemented |
| Haversine distance calculation & nearest-first matching | ✅ Implemented |
| Custom map markers for food listings | ✅ Implemented |
| Debounced reactive search (RxJS pipeline) | ✅ Implemented |
| Encrypted credential storage (expo-secure-store) | 🔧 Service ready |
| Scoped local document storage (expo-file-system) | 🔧 Service ready |
| Courier tracking & KTP verification | 📋 Planned (Milestone 2+) |
| Impact analytics dashboard | 📋 Planned |
| Backend sync (Firebase/Supabase) | 📋 Planned |

## Tech Stack

- **Framework:** React Native + Expo SDK 58 (Expo Go compatible)
- **Navigation:** Expo Router (file-based, `src/app/`)
- **State management:** Zustand (UDF — single source of truth, selector-based reads)
- **Maps & LBS:** react-native-maps, expo-location
- **Reactive data:** RxJS (`debounceTime`, `distinctUntilChanged`, `switchMap`)
- **Security & storage:** expo-secure-store, expo-file-system, AsyncStorage
- **Performance:** React.memo, useMemo/useCallback, subscription cleanup on unmount
- **Tooling:** TypeScript, ESLint (eslint-config-expo), EAS Build (planned)

## Architecture

```
src/
├── app/                  # Expo Router screens (routes only)
│   ├── _layout.tsx       # Stack navigator + SafeAreaProvider
│   ├── index.tsx         # Map screen: tracking, markers, nearest list
│   ├── search.tsx        # RxJS-powered search
│   └── listing/[id].tsx  # Listing detail + reserve action
├── components/           # Reusable UI (FoodMarker, ListingCard — memoized)
├── data/                 # Mock inventory until backend is wired
├── hooks/                # useLocationTracking (custom hook, adaptive GPS)
├── services/             # secureStore, fileStorage, searchPipeline
├── store/                # Zustand store (immutable updates via actions)
├── types/                # Shared domain types
└── utils/                # geo.ts — Haversine + distance formatting
```

Separation of concerns: **screens** handle UI only, **hooks** own platform side-effects, **services** wrap native/storage APIs, **store** owns state, **utils** hold pure functions (e.g. Haversine — unit-testable).

## Milestone Progress

| Meeting | Milestone | Deliverables | Status |
|---|---|---|---|
| 9 | LBS & Interactive Mapping | react-native-maps + expo-location, `useLocationTracking` with adaptive `distanceInterval`, custom markers, Haversine | ✅ Done |
| 10 | Offline-First & Secure Storage | expo-secure-store, expo-file-system scoped storage, runtime permissions | 🔧 Services ready |
| 11 | Real-Time Data Pipeline | RxJS debounce/distinct/switchMap, WebSocket/Firebase sync, offline fallbacks | 🔧 Pipeline ready |
| 12 | Advanced UI & Responsiveness | useWindowDimensions layout, reanimated micro-interactions, KeyboardAvoidingView, skeleton loaders | 📋 Planned |
| 13 | AI Vibe Coding & 16ms Audit | Refactor pass, Architect's Audit (errors, fallbacks, zero-leak cleanup), memoization profiling | 📋 Planned |
| 14 | Testing & EAS Build | Unit tests for geo/store, component tests, APK via EAS | 📋 Planned |
| 15 | Final Integration & Defense | Clean repo, AIK report, live demo | 📋 Planned |

## Rubric Self-Assessment

- **Architecture & Zustand UDF (20%)** — store uses immutable updates only; components read via precision selectors; screens/components/hooks/services are isolated.
- **Hardware, Security & LBS (25%)** — interactive map, adaptive location tracking, Haversine matching; secure-store and scoped-storage services in place.
- **60 FPS & 16ms Mandate (20%)** — memoized list cards, distanceInterval adapts to speed to save battery, all subscriptions cleaned up on unmount.
- **Vibe Coding & AIK Report (15%)** — iterative AI-assisted development with structured review; AIK reflection report in progress.
- **Testing & Build (10%)** — geo utilities kept pure for unit testing; EAS build planned.
- **Demo & Q&A (10%)** — live demo on physical device.

## AIK Values (Ikhlas, Itqan, Amanah)

- **Ikhlas** — the app is built to serve a real social need, not as a technical exercise.
- **Itqan** — precision in spatial computation (Haversine), adaptive sampling, and clean unsubscribe logic.
- **Amanah** — donor and receiver data handled responsibly; sensitive credentials only in hardware-backed secure storage.

## Getting Started

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (SDK 58). On first launch tap **Enable Tracking** to grant location permission — the map centers on your position and distances update live.

> **Note:** `react-native-maps` requires a physical device for real GPS (web shows a fallback message). Node.js 22+ is recommended by Expo SDK 58; the app runs on Node 20 with warnings only.

## License

Academic project — Mobile Programming, class A.
