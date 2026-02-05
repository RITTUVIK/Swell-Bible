# SWELL Bible - Full-Stack Project Overview

A single-page overview of the entire project: frontend, data layer, external APIs, and what is implemented vs mocked.

---

## 1. High-Level Architecture

```
+------------------------------------------------------------------+
|  React Native (Expo) - Android / iOS / Web                        |
|  App.tsx -> Tab Navigator (Home, Read, Community, Rewards)        |
+-----------------------------+------------------------------------+
                              |
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
+---------------+   +---------------+   +-----------------------+
|  Screens      |   |  Components   |   |  Hooks (useBible)     |
|  HomeScreen   |   |  Header       |   |  -> bibleApi          |
|  ReadScreen   |   |  SimpleHeader |   |  -> bibleStorage      |
|  Community    |   |               |   |  (cache not wired)    |
|  Rewards      |   |               |   +-----------+-----------+
+---------------+   +---------------+               |
                                                    v
                            +-------------------------------------+
                            |  External APIs                       |
                            |  - api.bible (Scripture API)         |
                            |  - Solana mainnet (SWELL token)      |
                            +-------------------------------------+
                            No backend server. No database.
```

- **Frontend only** (React Native + Expo).
- **No app backend** - no Node/Express, no DB, no auth server.
- **External integrations**:
  - [api.bible](https://docs.api.bible/) (Scripture API) for Bible text.
  - Solana mainnet via `@solana/web3.js` + `@solana/spl-token` for SWELL token operations.

---

## 2. Frontend (Full-Stack "Client" Layer)

### 2.1 Framework and Runtime

| Item | Detail |
|------|--------|
| Framework | React Native (Expo SDK ~51) |
| Language | TypeScript |
| Entry | `App.tsx` - sets up `NavigationContainer` + bottom tab navigator |
| Navigation | `@react-navigation/native` + `@react-navigation/bottom-tabs` |
| UI | React Native core + `expo-linear-gradient`, `@expo/vector-icons` |
| Platforms | Android (primary), iOS, Web (`expo start --web`) |

### 2.2 Screens (Tabs)

| Screen | File | Purpose |
|--------|------|--------|
| Home | `src/screens/HomeScreen.tsx` | Welcome, "Start Reading" / "Support Others", stats cards (all static/mocked) |
| Read | `src/screens/ReadScreen.tsx` | Bible reading: hardcoded Genesis 1:1-5, verse nav, progress bar, "+5 SWELL" (mocked) |
| Community | `src/screens/CommunityScreen.tsx` | Donation requests list (name, location, amount SWELL) - all mock data |
| Rewards | `src/screens/RewardsScreen.tsx` | Balance 135.5 SWELL, streak, daily tasks, achievements - all mocked |

### 2.3 Components

| Component | File | Usage |
|-----------|------|--------|
| Header | `src/components/Header.tsx` | Purple bar: logo "Swell", "Read. Earn. Share.", balance (prop) - used on Home |
| SimpleHeader | `src/components/SimpleHeader.tsx` | Cream bar: "Connect Wallet" button, balance - used on Read, Community, Rewards |

### 2.4 Styling and Theming

- **`src/constants/colors.ts`** - single source of colors (e.g. `primary`, `background`, `card`, `text`). Used across screens and components.
- No global theme provider; styles are per-file `StyleSheet.create()`.

### 2.5 State and Data Flow (Frontend)

- **No Redux / Zustand / global store.** Each screen owns its own state.
- **ReadScreen**: `useState` for `currentVerse`, `progress`; `useRef` for `Animated` values. Data source = local `VERSES` array (hardcoded).
- **useBible hook** is **not** used by `ReadScreen`; it is used only in `src/examples/ReadScreenExample.tsx` to show how to plug in the Bible API.
- **Home / Community / Rewards**: static or inline mock arrays; no API calls.

---

## 3. Backend

- **There is no backend.**
- No server, no REST API you host, no WebSockets, no server-side auth, no database (Postgres, MongoDB, etc.).
- All "live" data is either:
  - Fetched from **api.bible** (only when using `useBible` / `bibleApi`), or
  - Fetched from **Solana** (only when using `src/solana/` module), or
  - Hardcoded / mocked in the app.

---

## 4. External API - Bible Content

### 4.1 Provider

- **api.bible** (Scripture API): <https://api.scripture.api.bible/v1>
- API key is stored in **`src/config/api.ts`** (`BIBLE_API_CONFIG.API_KEY`).
- Default Bible version: ESV (`DEFAULT_BIBLE_ID`). Other IDs (KJV, NIV, NASB) are documented in that file.

### 4.2 How the App Uses It

- **`src/services/bibleApi.ts`** - single class that wraps the API:
  - `getBibles()`, `getBooks(bibleId)`, `getChapters(bookId, bibleId)`, `getChapter(chapterId, ...)`, `getVerse(verseId, ...)`
  - `parseChapterIntoVerses(chapterContent)` - parses API HTML into `Verse[]`
  - Uses `fetch` + headers from `config/api.ts`.
- **`src/hooks/useBible.ts`** - React hook that calls `bibleApi`:
  - Exposes `fetchBooks`, `fetchChapters`, `fetchChapter`, plus `books`, `chapters`, `chapterContent`, `verses`, loading and error state.
  - Optional cache is **not** implemented: TODOs for `bibleStorage.getCachedChapter` / `cacheChapter` are present but not wired.
- **`ReadScreen.tsx`** does **not** use `useBible`; it uses a local `VERSES` array. So the "live" Bible API is **available** but **not** used on the main Read tab yet. The intended usage is demonstrated in **`src/examples/ReadScreenExample.tsx`**.

---

## 5. Data Layer (Types, Config, "Storage")

### 5.1 Types (`src/types/bible.ts`)

- **Bible**, **Book**, **Chapter**, **Verse**, **ChapterContent** - match api.bible responses.
- **CachedChapter**, **CachedBook** - for future offline cache (used in `bibleStorage` interface only).

### 5.2 Config (`src/config/api.ts`)

- `BIBLE_API_CONFIG`: `API_KEY`, `BASE_URL`, `DEFAULT_BIBLE_ID`.
- `getApiHeaders()` - returns `api-key` and `Content-Type` for fetch.

### 5.3 "Storage" (`src/services/bibleStorage.ts`)

- **Placeholder only.** Methods: `cacheChapter`, `getCachedChapter`, `isChapterCached`, `getCachedBook`, `clearOldCache`, `getCacheSize`.
- Currently they log TODOs and return `null` / `false` / `0`. No AsyncStorage or SQLite yet. No persistence.

### 5.4 Constants

- **`src/constants/bibleBooks.ts`** - list of 66 books with `id`, `name`, `abbreviation`, `chapters`, `testament` (aligned with api.bible IDs). Used for reference; not yet wired into ReadScreen for book/chapter selection.

---

## 6. What Is Implemented vs Mocked

| Area | Status | Notes |
|------|--------|--------|
| UI - all 4 tabs | Implemented | Navigation, layout, animations work |
| Bible text on Read screen | Mocked | Hardcoded 5 verses (Genesis 1:1-5) |
| Bible API (api.bible) | Implemented | Used only in example; not in main ReadScreen |
| Reading progress (verse index, bar) | Implemented | Local state only, for the 5 mock verses |
| SWELL balance | **Logic ready** | src/solana/token.ts getSwellBalance(); UI still mocked |
| SWELL transfers | **Logic ready** | src/solana/token.ts transferSwell(); UI not wired |
| SWELL rewards ("+5 SWELL") | Mocked | UI only (no on-chain reward logic) |
| Donations / Community requests | Mocked | Static list in CommunityScreen; transfer logic available |
| Offline cache | Not implemented | bibleStorage is stub only |
| Solana / wallet | **Logic ready** | src/solana/ module ready; UI "Connect Wallet" not wired |
| Backend / DB | None | No server, no DB |

---

## 7. Tech Stack Summary

| Layer | Technology |
|-------|------------|
| App | React Native + Expo (~51) |
| Language | TypeScript |
| Navigation | React Navigation (bottom tabs) |
| Bible content | api.bible (Scripture API) |
| Config | `src/config/api.ts` |
| Local persistence | None (storage service is placeholder) |
| Backend | None |
| Blockchain | Solana mainnet via @solana/web3.js + @solana/spl-token |
| Token ops | src/solana/ - balance, transfer, ATA creation (logic only, no UI) |

---

## 8. File Map (Quick Reference)

```
App.tsx
src/
  components/   Header.tsx, SimpleHeader.tsx
  config/      api.ts
  constants/   bibleBooks.ts, colors.ts
  examples/    ReadScreenExample.tsx   <- uses useBible + api.bible
  hooks/       useBible.ts             <- calls bibleApi (and optionally bibleStorage when implemented)
  screens/     HomeScreen, ReadScreen, CommunityScreen, RewardsScreen
  services/    bibleApi.ts, bibleStorage.ts
  solana/      <- SWELL token operations (see below)
    config.ts       RPC, commitment, SWELL mint address
    connection.ts   Solana connection singleton
    types.ts        WalletSigner, TransferResult, errors
    token.ts        getSwellBalance, transferSwell, resolveOrCreateSwellAccount
    index.ts        Clean exports for the entire module
  types/       bible.ts
```

---

## 9. Solana / SWELL Module Details

The `src/solana/` module provides production-ready logic for SWELL token operations:

### Files

| File | Purpose |
|------|---------|
| `config.ts` | RPC endpoint, commitment level, SWELL mint address, explorer URLs |
| `connection.ts` | Singleton `Connection`, health check, blockhash helpers |
| `types.ts` | `WalletSigner` interface, `TransferParams`, `TransferResult`, error types |
| `token.ts` | Core operations: `getSwellBalance`, `transferSwell`, `resolveOrCreateSwellAccount` |
| `index.ts` | Re-exports everything for clean imports |

### Key Functions

```typescript
import {
  getSwellBalance,      // Fetch SWELL balance for any PublicKey
  transferSwell,        // Transfer SWELL between wallets
  resolveOrCreateSwellAccount, // Ensure recipient has ATA
  getConnection,        // Get Solana Connection
  isConnectionHealthy,  // Check RPC health
} from './solana';
```

### WalletSigner Interface

The module is wallet-agnostic. Any wallet that provides `publicKey` and `signTransaction` works:

```typescript
const wallet: WalletSigner = {
  publicKey: connectedWalletPubkey,
  signTransaction: walletAdapter.signTransaction.bind(walletAdapter),
};

await transferSwell({ sender: wallet, recipient, amount: 10 });
```

---

## 10. How to "Go Live" With Real Data (Next Steps)

1. **Install Solana deps** - Run `npm install` to install `@solana/web3.js` and `@solana/spl-token`.
2. **Bible on Read screen** - In `ReadScreen.tsx`, use `useBible()` and `fetchChapter('GEN.1')` instead of the hardcoded `VERSES` array (see `ReadScreenExample.tsx`).
3. **Offline** - Implement `bibleStorage` with AsyncStorage (or SQLite), and in `useBible` call `getCachedChapter` before fetch and `cacheChapter` after a successful fetch.
4. **Wire up wallet UI** - Use a Solana wallet adapter (e.g. `@solana/wallet-adapter-react-native`) to connect wallets, then pass the connected wallet as a `WalletSigner` to `getSwellBalance` and `transferSwell`.
5. **Replace mocked balances** - Call `getSwellBalance(wallet.publicKey)` and display the real amount in headers/Rewards.
6. **Enable donations** - On CommunityScreen, call `transferSwell({ sender, recipient, amount })` when user confirms a donation.
7. **Backend (optional)** - If you need user accounts, saved progress, or donation records, add a backend (e.g. Node + DB); today there is none.

This document reflects the project as it is today: **frontend with Solana logic module**, **one external API (api.bible)**, **no backend server**, **Solana/SWELL logic ready, UI not yet wired.**
