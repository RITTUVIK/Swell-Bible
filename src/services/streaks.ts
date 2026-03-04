/**
 * Streak service for SWELL Bible.
 *
 * Storage: Solana blockchain (source of truth) + AsyncStorage (local cache).
 *
 * Two streak types:
 *   - App Streak: meaningful app usage at least once per day.
 *   - Guided Scripture Streak: guided experience completed that day.
 *
 * Write path:
 *   1. Try to write on-chain via the swell-streak program (silent, embedded wallet).
 *   2. Always write to the local cache regardless of chain success.
 *
 * Read path:
 *   1. Return cached data immediately for fast UI.
 *   2. Background-fetch from chain and update cache when a wallet is connected.
 *
 * If no wallet is connected, the service degrades to local-only storage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PublicKey } from '@solana/web3.js';
import {
  fetchStreakAccount,
  recordAppOnChain,
  recordGuidedOnChain,
} from '../solana/streakProgram';
import { getSavedWallet, getEmbeddedSigner } from './walletContext';
import type { WalletSigner } from '../solana/types';

// ---------------------------------------------------------------------------
// Types (public API unchanged)
// ---------------------------------------------------------------------------

export interface StreakSnapshot {
  current: number;
  best: number;
}

export interface StreakData {
  app: StreakSnapshot;
  guided: StreakSnapshot;
  lastAppDate: string | null;
  lastGuidedDate: string | null;
  appDates: string[];
  guidedDates: string[];
}

// ---------------------------------------------------------------------------
// Local cache (AsyncStorage)
// ---------------------------------------------------------------------------

const STREAK_STORAGE_KEY = 'swell_bible_streaks';
const MAX_DAYS_STORED = 400;

interface StoredStreaks {
  appDates: string[];
  guidedDates: string[];
}

async function loadLocal(): Promise<StoredStreaks> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_STORAGE_KEY);
    if (!raw) return { appDates: [], guidedDates: [] };
    const parsed = JSON.parse(raw) as StoredStreaks;
    return {
      appDates: Array.isArray(parsed.appDates) ? parsed.appDates : [],
      guidedDates: Array.isArray(parsed.guidedDates) ? parsed.guidedDates : [],
    };
  } catch {
    return { appDates: [], guidedDates: [] };
  }
}

async function saveLocal(data: StoredStreaks): Promise<void> {
  try {
    await AsyncStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* non-critical */
  }
}

function trimToMax(dates: string[]): string[] {
  if (dates.length <= MAX_DAYS_STORED) return dates;
  return [...dates].sort().slice(-MAX_DAYS_STORED);
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getTodayDateString(): string {
  return formatLocalDate(new Date());
}

// ---------------------------------------------------------------------------
// Streak computation (used on cached dates)
// ---------------------------------------------------------------------------

function computeStreaks(dates: string[], today: string): StreakSnapshot {
  const set = new Set(dates);
  const dayMs = 24 * 60 * 60 * 1000;

  let current = 0;
  const start = set.has(today)
    ? new Date(today + 'T12:00:00')
    : (() => { const d = new Date(today + 'T12:00:00'); d.setTime(d.getTime() - dayMs); return d; })();

  let d = start;
  for (let i = 0; i < MAX_DAYS_STORED; i++) {
    if (set.has(formatLocalDate(d))) {
      current++;
      d = new Date(d.getTime() - dayMs);
    } else {
      break;
    }
  }

  const best = computeBestStreak(dates);
  return { current, best: Math.max(best, current) };
}

function computeBestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort();
  let best = 1;
  let run = 1;
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00').getTime();
    const curr = new Date(sorted[i] + 'T12:00:00').getTime();
    if (Math.round((curr - prev) / dayMs) === 1) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Wallet / signer helpers
// ---------------------------------------------------------------------------

async function getActiveSigner(): Promise<WalletSigner | null> {
  const wallet = await getSavedWallet();
  if (!wallet.connected || !wallet.address) return null;
  if (wallet.type === 'embedded') {
    return getEmbeddedSigner();
  }
  // External (Phantom) cannot sign silently — skip on-chain write.
  return null;
}

async function getActiveWalletPubkey(): Promise<PublicKey | null> {
  const wallet = await getSavedWallet();
  if (!wallet.connected || !wallet.address) return null;
  try {
    return new PublicKey(wallet.address);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Chain ↔ local sync
// ---------------------------------------------------------------------------

/**
 * Pull the latest streak data from chain and merge into local cache.
 * Chain is authoritative: its dates overwrite local for any overlap.
 */
async function syncFromChain(): Promise<StoredStreaks | null> {
  const pubkey = await getActiveWalletPubkey();
  if (!pubkey) return null;

  try {
    const onChain = await fetchStreakAccount(pubkey);
    if (!onChain) return null;

    const local = await loadLocal();

    const mergedApp = mergeUniqueSorted(local.appDates, onChain.appDates);
    const mergedGuided = mergeUniqueSorted(local.guidedDates, onChain.guidedDates);

    const merged: StoredStreaks = {
      appDates: trimToMax(mergedApp),
      guidedDates: trimToMax(mergedGuided),
    };

    await saveLocal(merged);
    return merged;
  } catch {
    return null;
  }
}

function mergeUniqueSorted(a: string[], b: string[]): string[] {
  const set = new Set([...a, ...b]);
  return [...set].sort();
}

// ---------------------------------------------------------------------------
// Public API — drop-in replacement for the old streaks.ts
// ---------------------------------------------------------------------------

/**
 * Record that the user used the app in a meaningful way today.
 * Writes on-chain (if embedded wallet available) AND to local cache.
 */
export async function recordAppActivity(): Promise<void> {
  const today = getTodayDateString();
  const { appDates, guidedDates } = await loadLocal();
  if (!appDates.includes(today)) {
    await saveLocal({ appDates: trimToMax([...appDates, today]), guidedDates });
  }

  // Fire-and-forget on-chain write
  const signer = await getActiveSigner();
  if (signer) {
    recordAppOnChain(signer).catch(() => {});
  }
}

/**
 * Record that the user completed guided scripture today.
 * Also counts as app activity. Writes on-chain + local.
 */
export async function recordGuidedScriptureComplete(): Promise<void> {
  const today = getTodayDateString();
  const { appDates, guidedDates } = await loadLocal();
  const guidedUpdated = guidedDates.includes(today) ? guidedDates : trimToMax([...guidedDates, today]);
  const appUpdated = appDates.includes(today) ? appDates : trimToMax([...appDates, today]);
  await saveLocal({ appDates: appUpdated, guidedDates: guidedUpdated });

  const signer = await getActiveSigner();
  if (signer) {
    recordGuidedOnChain(signer).catch(() => {});
  }
}

/**
 * Get current and best streak for app usage.
 */
export async function getAppStreak(): Promise<StreakSnapshot> {
  const today = getTodayDateString();
  const { appDates } = await loadLocal();
  return computeStreaks(appDates, today);
}

/**
 * Get current and best streak for guided scripture.
 */
export async function getGuidedStreak(): Promise<StreakSnapshot> {
  const today = getTodayDateString();
  const { guidedDates } = await loadLocal();
  return computeStreaks(guidedDates, today);
}

/**
 * Full streak data for UI and eligibility checks.
 *
 * On first call per session, triggers a background chain sync so the
 * local cache picks up any dates recorded from another device.
 */
let _syncedThisSession = false;

export async function getStreakData(): Promise<StreakData> {
  if (!_syncedThisSession) {
    _syncedThisSession = true;
    syncFromChain().catch(() => {});
  }

  const today = getTodayDateString();
  const { appDates, guidedDates } = await loadLocal();
  const app = computeStreaks(appDates, today);
  const guided = computeStreaks(guidedDates, today);
  const sortedApp = [...appDates].sort();
  const sortedGuided = [...guidedDates].sort();
  return {
    app,
    guided,
    lastAppDate: sortedApp.length > 0 ? sortedApp[sortedApp.length - 1] : null,
    lastGuidedDate: sortedGuided.length > 0 ? sortedGuided[sortedGuided.length - 1] : null,
    appDates,
    guidedDates,
  };
}

/**
 * Force a re-sync from chain. Useful after wallet connect/disconnect.
 */
export async function resyncStreaksFromChain(): Promise<void> {
  _syncedThisSession = false;
  await syncFromChain();
}
