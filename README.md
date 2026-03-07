# SWELL Bible

**A mobile Bible-reading application with Solana-based SWELL token rewards.**
Read Scripture daily, track your streaks, and earn SWELL tokens on-chain. Built for the **Solana Seeker Phone** and the broader Solana ecosystem.

---

## Overview

SWELL Bible is a cross-platform (Android, iOS, Web) application that combines daily Bible reading with Solana blockchain integration. It was built for the **Monolith hackathon** and the **Solana Seeker Phone**, providing a clean reading experience with on-chain token rewards for consistent reading habits.

**Core principles:**

- **Read-to-earn** — Read the Bible each day to earn 1 SWELL token, claimed via on-chain signature verification.
- **Solana Mobile native** — Full Mobile Wallet Adapter (MWA) support for Android, enabling one-tap wallet authorization and message signing through any installed Solana wallet app.
- **Multiple wallet options** — In-app embedded wallet (keypair generated on device), Phantom deep link connection, or MWA for Seeker and other Android devices.
- **Focused scope** — Bible reading, progress tracking, streaks, and SWELL token interactions; no feature bloat.

---

## Features

| Area | Description |
|------|-------------|
| **Bible reading** | KJV 1611 Bible stored locally for offline access. Verse-by-verse navigation and reading progress. |
| **Library and search** | Browse books and chapters; search across Scripture. |
| **Reading streaks** | Daily streak tracking for both app reading and guided reflections, with a full calendar view. |
| **Daily SWELL rewards** | Earn 1 SWELL token per day for reading. Claims are signed client-side and verified server-side. Unclaimed days (up to 7) can be claimed retroactively. |
| **Wallet support** | Three wallet connection methods: in-app embedded wallet, Phantom deep link, and Mobile Wallet Adapter (Android). |
| **Guided reflections** | Daily guided Scripture reflection flow. |
| **Stewardship ledger** | Balance display, claim history, and mission/donation infrastructure. |
| **Settings** | App preferences and configuration. |

**Navigation:** Home, Read, Library, Search, Stewardship (bottom tabs), with Settings and Guided Reflection available from the stack.

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| **Framework** | React Native (Expo SDK 54) |
| **Language** | TypeScript |
| **Navigation** | React Navigation (bottom tabs + native stack) |
| **Bible content** | KJV 1611 JSON (bundled locally) |
| **Blockchain** | Solana — `@solana/web3.js`, `@solana/spl-token` |
| **Mobile wallet** | `@solana-mobile/mobile-wallet-adapter-protocol-web3js` (MWA for Android) |
| **Rewards backend** | Vercel serverless functions with Upstash Redis for claim tracking |
| **Build** | EAS (Expo Application Services) |

---

## Prerequisites

- **Node.js** 18+ and npm
- **Expo CLI** (optional; `npx expo` is sufficient)
- **Android device or emulator** for MWA testing (requires a native build)
- **EAS account** for cloud builds (`npx eas login`)
- **Solana wallet app** (Phantom or Solflare) installed on the Android device for MWA

---

## Getting Started

### 1. Clone and install

```bash
git clone <repository-url>
cd Swell-Bible
npm install
```

### 2. Configure environment

Create a `.env` file (see Environment Variables section below).

### 3. Run the app

```bash
# Start Expo dev server
npm start

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

### 4. Build for device testing

MWA and full wallet features require a native build:

```bash
# Android APK via EAS
npx eas build --platform android --profile preview
```

Install the resulting APK on your Android device.

---

## Project Structure

```
Swell-Bible/
├── App.tsx                    # Entry point: fonts, splash, NavigationContainer, tab + stack navigator
├── app.json                   # Expo / EAS config (name, slug, scheme, splash, iOS/Android)
├── app.config.js              # Dynamic Expo config (loads .env, merges app.json)
├── eas.json                   # EAS build profiles
├── metro.config.js            # Metro bundler config
├── package.json
├── tsconfig.json
├── data/bible/                # KJV 1611 Bible JSON data (bundled locally)
├── src/
│   ├── config/
│   │   └── api.ts             # Bible API key, base URL, default Bible ID
│   ├── constants/
│   │   ├── bibleBooks.ts      # Book metadata (id, name, abbreviation, chapters, testament)
│   │   └── colors.ts          # App color palette
│   ├── hooks/
│   │   └── useBible.ts        # React hook for Bible data (books, chapters, verses)
│   ├── polyfills.ts           # Buffer / crypto polyfills for Solana
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── ReadScreen.tsx
│   │   ├── LibraryScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── StewardshipScreen.tsx   # Wallet connect, balance, rewards, streaks
│   │   ├── GuidedScriptureScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/
│   │   ├── bibleApi.ts        # Bible API client
│   │   ├── bibleStorage.ts    # Offline cache (placeholder)
│   │   ├── bookmarks.ts       # Bookmark handling
│   │   ├── readingProgress.ts # Reading progress persistence
│   │   ├── rewards.ts         # Daily SWELL reward claims (sign + submit to backend)
│   │   ├── streaks.ts         # Reading streak tracking and persistence
│   │   ├── settings.ts        # App settings
│   │   ├── phantomConnect.ts  # Phantom wallet deep link integration
│   │   ├── mwaConnect.ts      # Mobile Wallet Adapter (Android) — authorize, sign, signer
│   │   └── walletContext.ts   # Wallet state: embedded, external, and MWA types
│   ├── solana/                # Solana / SWELL token module
│   │   ├── config.ts          # RPC, commitment, SWELL mint
│   │   ├── connection.ts      # Connection singleton, health check
│   │   ├── account.ts         # Account resolution / ATA
│   │   ├── balance.ts         # Balance fetching
│   │   ├── transfer.ts        # Token transfers
│   │   ├── mint.ts            # Mint utilities
│   │   ├── types.ts           # WalletSigner interface, error types
│   │   ├── utils.ts
│   │   ├── errors.ts
│   │   └── index.ts           # Public exports
│   └── types/
│       └── bible.ts           # Bible, Book, Chapter, Verse, etc.
├── swell-rewards-server/      # Vercel serverless backend for reward claims
│   ├── api/
│   │   ├── claim-reward.ts    # POST: verify signature, transfer SWELL on-chain
│   │   └── claim-history.ts   # GET: claim history for a wallet
│   └── lib/
│       └── claimStore.ts      # Upstash Redis claim persistence
├── README.md                  # This file
└── README_BIBLE_API.md        # Bible API setup and usage
```

---

## Wallet Integration

SWELL Bible supports three wallet connection methods:

### Embedded wallet
An in-app Solana keypair generated on the device. Private key is stored in AsyncStorage and can be exported/backed up. Supports full transaction signing and reward claims.

### Phantom deep link
Connects an external Phantom wallet via deep link. Provides address and balance display, but cannot sign messages or claim rewards from within the app (Phantom deep link protocol limitation).

### Mobile Wallet Adapter (MWA)
The standard Solana Mobile protocol for Android. Uses Android intents to open any installed MWA-compatible wallet (Phantom, Solflare, etc.) for authorization and signing. Each operation opens an ephemeral `transact()` session with the wallet app. Supports full reward claims.

MWA is only available on Android. The connect button is hidden on iOS and web via `Platform.OS` guard. All MWA imports use dynamic `require()` with try/catch to prevent crashes on non-Android platforms.

---

## Reward System

The daily reward flow:

1. User reads the Bible (tracked locally via `streaks.ts`)
2. User taps "Claim 1 SWELL" on the Stewardship screen
3. Client signs the message `swell:claim:{walletAddress}:{date}` with the wallet's private key (embedded keypair or MWA)
4. Signed message is sent to the Vercel backend (`/api/claim-reward`)
5. Backend verifies the ed25519 signature against the wallet's public key
6. Backend transfers 1 SWELL token to the wallet on-chain
7. Claim is recorded in Upstash Redis to prevent double-claiming

Unclaimed reading days from the past 7 days can be claimed retroactively.

---

## Solana Module

The `src/solana/` module provides wallet-agnostic logic for SWELL token operations:

- **Balance** — `getSwellBalance(publicKey)`
- **Transfers** — `transferSwell({ sender, recipient, amount })`
- **Account resolution** — resolve or create associated token accounts (ATA)
- **WalletSigner interface** — any wallet that provides `publicKey` and `signTransaction` can be used, including the embedded keypair and MWA signer

---

## Building

### Development (Expo Go)
```bash
npm start
```
Note: MWA features require a native build and will not work in Expo Go.

### Android APK (EAS cloud build)
```bash
npx eas build --platform android --profile preview
```
This produces an APK that can be installed on a real device or emulator. Required for testing MWA.

### Production build
```bash
npx eas build --platform android --profile production
```

---

## Environment Variables

Create a `.env` file in the project root:

```
EXPO_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
EXPO_PUBLIC_REWARDS_API_URL=https://your-vercel-deployment.vercel.app
EXPO_PUBLIC_BIBLE_API_KEY=your-api-bible-key
```

The rewards server (`swell-rewards-server/`) requires its own environment variables for the Solana keypair and Upstash Redis credentials. See the server directory for details.

---

## License

Proprietary. All rights reserved.
