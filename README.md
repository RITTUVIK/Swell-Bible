# SWELL Bible

A mobile Bible app with Solana-based SWELL token rewards. Read Scripture daily, track streaks, and earn SWELL on-chain. Built for the Solana Seeker Phone and Monolith hackathon.

## Download

[**Download APK**](https://github.com/RITTUVIK/Swell-Bible/releases/tag/v1.0.0)

## Overview

SWELL Bible is a cross-platform (Android and IOS) app that combines daily Bible reading with Solana. It was built for the **Solana Seeker Phone** and the **Monolith hackathon**. The app supports multiple wallet options (embedded wallet, Phantom deep link, Mobile Wallet Adapter on Android), plus a focused feature set: Bible, progress, streaks, and SWELL token flows.

**Core principles:** Solana Mobile native with full MWA support on Android. Multiple wallet options. Focused scope, no feature bloat.

## Features

| Area | Description |
|------|-------------|
| Bible reading | KJV 1611 bundled locally for offline use. Verse-by-verse navigation and reading progress. |
| Library and search | Browse books and chapters; search across Scripture. |
| Reading streaks | Daily streak tracking for app reading and guided reflections, with calendar view. |
| Daily SWELL rewards | 1 SWELL per day for reading. Client signs claim, server verifies and transfers. Up to 7 unclaimed days can be claimed retroactively. |
| Wallet support | Embedded wallet, Phantom deep link, and Mobile Wallet Adapter (Android). |
| Guided reflections | Daily guided Scripture reflection flow. |
| Stewardship | Balance, claim history, and mission/donation infrastructure. |
| Settings | App preferences. |

**Navigation:** Home, Read, Library, Search, Stewardship (bottom tabs). Settings and Guided Reflection in the stack.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native (Expo SDK 54) |
| Language | TypeScript |
| Navigation | React Navigation (bottom tabs, native stack) |
| Bible content | KJV 1611 JSON in `data/bible/Bible-kjv-1611/` |
| Blockchain | Solana: `@solana/web3.js`, `@solana/spl-token` |
| Mobile wallet | `@solana-mobile/mobile-wallet-adapter-protocol-web3js` (Android MWA) |
| Rewards backend | Vercel serverless + Upstash Redis (claim tracking) |
| Build | EAS |

## Prerequisites

- Node.js 18+ and npm
- Android device or emulator for MWA (native build required)
- EAS account for cloud builds (`npx eas login`)
- Solana wallet app (Phantom or Solflare) on device for MWA

## Getting Started

**1. Clone and install**

```bash
git clone <repository-url>
cd Swell-Bible
npm install
```

**2. Environment**

Create a `.env` in the project root. Required: `EXPO_PUBLIC_SOLANA_RPC_URL` (e.g. Helius RPC). Optional: `EXPO_PUBLIC_REWARDS_API_URL` if you run the rewards server. See Environment Variables below.

**3. Run**

```bash
npm start
npm run android   # Android
npm run web       # Web
```

**4. Native build (for MWA)**

MWA and full wallet features need a native build:

```bash
npx eas build --platform android --profile preview
```

Install the APK on your device.

## Project Structure

```
Swell-Bible/
├── App.tsx
├── app.json
├── app.config.js
├── eas.json
├── metro.config.js
├── package.json
├── tsconfig.json
├── data/bible/Bible-kjv-1611/   # KJV 1611 JSON (bundled)
├── src/
│   ├── config/api.ts            # Rewards API base URL (BIBLE_API_CONFIG unused; Bible is local)
│   ├── constants/
│   │   ├── bibleBooks.ts
│   │   └── colors.ts
│   ├── hooks/useBible.ts
│   ├── polyfills.ts             # Buffer / crypto for Solana
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── ReadScreen.tsx
│   │   ├── LibraryScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── StewardshipScreen.tsx
│   │   ├── GuidedScriptureScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/
│   │   ├── bibleApi.ts          # Local KJV JSON reader (no external API)
│   │   ├── bibleStorage.ts
│   │   ├── bookmarks.ts
│   │   ├── readingProgress.ts
│   │   ├── rewards.ts
│   │   ├── streaks.ts
│   │   ├── settings.ts
│   │   ├── phantomConnect.ts
│   │   ├── mwaConnect.ts
│   │   └── walletContext.ts
│   ├── solana/
│   │   ├── config.ts
│   │   ├── connection.ts
│   │   ├── account.ts
│   │   ├── balance.ts
│   │   ├── transfer.ts
│   │   ├── mint.ts
│   │   ├── types.ts
│   │   ├── utils.ts
│   │   ├── errors.ts
│   │   └── index.ts
│   └── types/bible.ts
├── swell-rewards-server/
│   ├── api/claim-reward.ts
│   ├── api/claim-history.ts
│   └── lib/claimStore.ts
└── README.md
```

## Wallet Integration

**Embedded wallet:** In-app keypair on device. Private key in AsyncStorage; export/backup supported. Full signing and reward claims.

**Phantom deep link:** Connects external Phantom. Address and balance only; cannot sign from app (protocol limitation).

**Mobile Wallet Adapter (MWA):** Android only. Uses intents to open an MWA-compatible wallet for auth and signing. Full reward claims. Connect button hidden on iOS/web. MWA code loaded with dynamic `require()` and try/catch for non-Android.

## Reward System

1. User reads (tracked in `streaks.ts`).
2. User taps "Claim 1 SWELL" on Stewardship.
3. Client signs `swell:claim:{walletAddress}:{date}` (embedded keypair or MWA).
4. Request sent to backend `/api/claim-reward`.
5. Backend verifies ed25519 signature and transfers 1 SWELL on-chain.
6. Claim stored in Upstash Redis to prevent double-claim.

Unclaimed days within the last 7 can be claimed retroactively.

## Solana Module

`src/solana/` exposes wallet-agnostic SWELL logic: balance, transfers, ATA resolution, and a `WalletSigner` interface used by both embedded wallet and MWA.

## Building

**Development (Expo Go):** `npm start`. MWA does not work in Expo Go; use a native build.

**Android APK:** `npx eas build --platform android --profile preview`

**Production:** `npx eas build --platform android --profile production`

## Environment Variables

In project root `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| EXPO_PUBLIC_SOLANA_RPC_URL | Yes | Solana RPC (e.g. Helius). Needed for wallet, balance, transfers. |
| EXPO_PUBLIC_REWARDS_API_URL | No | Rewards server URL. Defaults to `http://localhost:3000`. |

No Bible API key is used; Bible content is local KJV JSON.

The rewards server (`swell-rewards-server/`) has its own env (Solana keypair, Upstash Redis). See that directory.

## License

Proprietary. All rights reserved.
