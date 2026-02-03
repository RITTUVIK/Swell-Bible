# SWELL Bible

Minimal Android Bible-reading app with Solana-based SWELL token donations.

This project is a simplified MVP built for the Solana ecosystem (Seeker-compatible) to explore how on-chain tokens can be used for reading incentives and peer-to-peer donations.

## Goal

Build something real and shippable, not a bloated Web3 app.

This is NOT:
- A full DAO
- A social network
- A full-featured Bible platform

This IS:
- A clean mobile app
- With basic Bible reading
- And simple SWELL token interactions

## MVP Features

- **Bible reading**: Read screen shows sample Genesis 1 text; full [api.bible](https://docs.api.bible/) integration is in place (see `README_BIBLE_API.md` for setup).
- **Reading progress**: Local progress tracking with verse-by-verse navigation.
- **SWELL rewards**: Earn SWELL for reading (mocked in UI).
- **Donations**: Send SWELL to other users (mocked in Community screen).

App navigation: Home, Read, Community, Rewards (bottom tabs).

Anything beyond this is out of scope.

## Tech Stack

- Frontend: React Native (Expo)
- Platform: Android
- Blockchain: Solana
- Token: SWELL (mocked initially)
- Backend: None

## Project Structure

```
App.tsx                 # Entry point, bottom tab navigator
src/
  components/           # Header, SimpleHeader
  config/              # API keys (api.ts)
  constants/           # bibleBooks, colors
  examples/            # ReadScreenExample (API usage)
  hooks/               # useBible
  screens/             # HomeScreen, ReadScreen, CommunityScreen, RewardsScreen
  services/            # bibleApi, bibleStorage
  types/               # bible.ts
```

## Getting Started

```bash
npm install
npx expo start
```

## Development Philosophy

- Ship fast
- Keep scope tight
- Replace mocks later
- Demo > theory

## Status

In active development (MVP)
