# SWELL Bible

**A mobile Bible-reading application with Solana-based SWELL token support.**  
Read Scripture, track progress, and engage with on-chain incentives. Built for the **Solana Seeker Phone** and the broader Solana ecosystem, with a focus on clarity and ship-ready quality.

---

## Overview

SWELL Bible is a cross-platform (Android, iOS, Web) application that combines traditional Bible reading with Solana blockchain integration. **It was built for the Solana Seeker Phone** and provides a clean, focused reading experience while exploring how on-chain tokens can support reading habits and peer-to-peer giving.

**Core principles:**

- **Focused scope** — Bible reading, progress tracking, and SWELL token interactions; no feature bloat.
- **Production-oriented** — Real API integration ([api.bible](https://docs.api.bible/)), Solana logic module, and EAS build configuration.
- **Demo-ready** — Functional MVP suitable for showcases and further iteration.

---

## Features

| Area | Description |
|------|-------------|
| **Bible reading** | Full [api.bible](https://docs.api.bible/) integration for multiple translations (ESV, KJV, NIV, NASB). Verse-by-verse navigation and reading progress. |
| **Library & search** | Browse books and chapters; search across Scripture. |
| **Reading progress** | Local progress tracking with verse-level navigation. |
| **Bookmarks** | Save and manage verse bookmarks (see `src/services/bookmarks.ts`). |
| **SWELL token** | Solana SPL token support: balance checks, transfers, and stewardship flows (logic in `src/solana/`). |
| **Settings** | App preferences and configuration. |

**Navigation:** Home → Read → Library → Search → Stewardship (bottom tabs), with Settings available from the stack.

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| **Framework** | React Native (Expo SDK 51) |
| **Language** | TypeScript |
| **Navigation** | React Navigation (bottom tabs + native stack) |
| **Bible content** | [api.bible](https://docs.api.bible/) (Scripture API) |
| **Blockchain** | Solana — `@solana/web3.js`, `@solana/spl-token` |
| **Build** | EAS (Expo Application Services) |
| **Backend** | None — client-only; Bible API and Solana RPC are external. |

---

## Prerequisites

- **Node.js** 18+ and npm (or yarn)
- **Expo CLI** (optional; `npx expo` is sufficient)
- **api.bible API key** — [Sign up](https://scripture.api.bible/) and add to `src/config/api.ts`
- **Android:** Android Studio / emulator or device  
- **iOS:** Xcode (macOS only)  
- **EAS builds:** Expo account and EAS CLI for cloud builds

---

## Getting Started

### 1. Clone and install

```bash
git clone <repository-url>
cd Swell-Bible
npm install
```

### 2. Configure API key

Edit `src/config/api.ts` and set your [api.bible](https://docs.api.bible/) API key:

```typescript
export const BIBLE_API_CONFIG = {
  API_KEY: 'your-api-key-here',
  BASE_URL: 'https://api.scripture.api.bible/v1',
  DEFAULT_BIBLE_ID: '06125adad2d5898a-01', // ESV
};
```

See **README_BIBLE_API.md** for full API setup and usage.

### 3. Run the app

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run in web browser
npm run web
```

### 4. (Optional) EAS build

For production builds (e.g. Android APK/AAB):

```bash
npx eas build --platform android --profile production
```

Configuration: `eas.json` and `app.json`.

---

## Project Structure

```
Swell-Bible/
├── App.tsx                    # Entry point: fonts, splash, NavigationContainer, tab + stack navigator
├── app.json                   # Expo / EAS config (name, slug, scheme, splash, iOS/Android)
├── eas.json                   # EAS build profiles
├── package.json
├── tsconfig.json
├── src/
│   ├── config/
│   │   └── api.ts             # Bible API key, base URL, default Bible ID
│   ├── constants/
│   │   ├── bibleBooks.ts      # Book metadata (id, name, abbreviation, chapters, testament)
│   │   └── colors.ts         # App color palette
│   ├── hooks/
│   │   └── useBible.ts        # React hook for Bible API (books, chapters, verses)
│   ├── polyfills.ts           # Buffer / crypto polyfills for Solana
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── ReadScreen.tsx
│   │   ├── LibraryScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── StewardshipScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/
│   │   ├── bibleApi.ts        # Bible API client
│   │   ├── bibleStorage.ts    # Offline cache (placeholder)
│   │   ├── bookmarks.ts       # Bookmark handling
│   │   ├── readingProgress.ts # Reading progress persistence
│   │   ├── settings.ts        # App settings
│   │   ├── phantomConnect.ts  # Phantom wallet integration
│   │   └── walletContext.ts   # Wallet state/context
│   ├── solana/                # Solana / SWELL token module
│   │   ├── config.ts          # RPC, commitment, SWELL mint
│   │   ├── connection.ts      # Connection singleton, health check
│   │   ├── account.ts         # Account resolution / ATA
│   │   ├── balance.ts         # Balance fetching
│   │   ├── transfer.ts        # Token transfers
│   │   ├── mint.ts            # Mint utilities
│   │   ├── types.ts           # WalletSigner, errors, etc.
│   │   ├── utils.ts
│   │   ├── errors.ts
│   │   └── index.ts           # Public exports
│   └── types/
│       └── bible.ts           # Bible, Book, Chapter, Verse, etc.
├── README.md                  # This file
├── README_BIBLE_API.md        # Bible API setup and usage
├── PROJECT_OVERVIEW.md        # Detailed architecture and implementation status
└── GIT_COMMANDS.md            # Git workflow reference
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| **README.md** (this file) | Overview, setup, and structure |
| **README_BIBLE_API.md** | api.bible integration, API key, and usage examples |
| **PROJECT_OVERVIEW.md** | Full-stack overview, data flow, implemented vs mocked, Solana module details |
| **GIT_COMMANDS.md** | Git commands and workflow |

---

## Solana / SWELL Module

The `src/solana/` module provides wallet-agnostic logic for SWELL token operations:

- **Balance** — `getSwellBalance(publicKey)`
- **Transfers** — `transferSwell({ sender, recipient, amount })`
- **Account resolution** — resolve or create associated token accounts (ATA)

The UI can be wired to any Solana wallet adapter (e.g. Phantom) that supplies `publicKey` and `signTransaction`. See **PROJECT_OVERVIEW.md** for interfaces and usage.

---

## Status

**Active development (MVP).**  
Core reading, library, search, and Solana logic are in place; some UI flows may still use mock data. Check **PROJECT_OVERVIEW.md** for the current implemented-vs-mocked breakdown.

---

## License

Proprietary. All rights reserved.
