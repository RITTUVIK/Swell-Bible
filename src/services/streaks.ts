/**
 * Streak service for SWELL Bible.
 *
 * Two streak types:
 * - App Streak: meaningful app usage at least once per day (read, view verse, or complete guided).
 * - Guided Scripture Streak: full guided scripture experience completed that day.
 *
 * Rules: one completion per day; streak resets if a full day is missed.
 * Data is suitable for future eligibility checks (e.g. token rewards).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSavedWallet } from './walletContext';

const STREAK_STORAGE_PREFIX = 'swell_bible_streaks:';
const STREAK_STORAGE_KEY_LEGACY = 'swell_bible_streaks';
const MAX_DAYS_STORED = 400;

export interface StreakSnapshot {
  current: number;
  best: number;
}

export interface StreakData {
  app: StreakSnapshot;
  guided: StreakSnapshot;
  /** Last date (YYYY-MM-DD) app activity was recorded. For future eligibility. */
  lastAppDate: string | null;
  /** Last date (YYYY-MM-DD) guided scripture was completed. For future eligibility. */
  lastGuidedDate: string | null;
  /** Raw dates with app activity (for eligibility / debugging). */
  appDates: string[];
  /** Raw dates with guided completion (for eligibility / debugging). */
  guidedDates: string[];
  /** Dates user actually read scripture (ReadScreen or guided). For reward eligibility. */
  readDates: string[];
}

interface StoredStreaks {
  appDates: string[];
  guidedDates: string[];
  /** Dates the user actually read scripture (ReadScreen or guided). Used for reward eligibility. */
  readDates?: string[];
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getTodayDateString(): string {
  return formatLocalDate(new Date());
}

/**
 * Compute current streak (consecutive days ending today) and best streak
 * from a sorted list of date strings (YYYY-MM-DD).
 */
function computeStreaks(dates: string[], today: string): StreakSnapshot {
  const set = new Set(dates);
  if (!set.has(today)) {
    // Current streak is 0; walk back to find last run ending yesterday
    let current = 0;
    const dayMs = 24 * 60 * 60 * 1000;
    let d = new Date(today + 'T12:00:00');
    d.setTime(d.getTime() - dayMs);
    for (let i = 0; i < 400; i++) {
      const ds = formatLocalDate(d);
      if (set.has(ds)) {
        current++;
        d.setTime(d.getTime() - dayMs);
      } else {
        break;
      }
    }
    const best = computeBestStreak(dates);
    return { current, best: Math.max(best, current) };
  }

  let current = 0;
  const dayMs = 24 * 60 * 60 * 1000;
  let d = new Date(today + 'T12:00:00');
  for (let i = 0; i < 400; i++) {
    const ds = formatLocalDate(d);
    if (set.has(ds)) {
      current++;
      d.setTime(d.getTime() - dayMs);
    } else {
      break;
    }
  }

  const best = computeBestStreak(dates);
  return {
    current,
    best: Math.max(best, current),
  };
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
    const diffDays = Math.round((curr - prev) / dayMs);
    if (diffDays === 1) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

async function getStorageKey(): Promise<string> {
  const wallet = await getSavedWallet();
  if (wallet.address) return `${STREAK_STORAGE_PREFIX}${wallet.address}`;
  return STREAK_STORAGE_KEY_LEGACY;
}

async function loadStored(): Promise<StoredStreaks> {
  try {
    const key = await getStorageKey();
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return { appDates: [], guidedDates: [] };
    const parsed = JSON.parse(raw) as StoredStreaks;
    return {
      appDates: Array.isArray(parsed.appDates) ? parsed.appDates : [],
      guidedDates: Array.isArray(parsed.guidedDates) ? parsed.guidedDates : [],
      readDates: Array.isArray(parsed.readDates) ? parsed.readDates : [],
    };
  } catch {
    return { appDates: [], guidedDates: [] };
  }
}

async function saveStored(data: StoredStreaks): Promise<void> {
  try {
    const key = await getStorageKey();
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Non-critical
  }
}

function trimToMax(dates: string[]): string[] {
  if (dates.length <= MAX_DAYS_STORED) return dates;
  const sorted = [...dates].sort();
  return sorted.slice(-MAX_DAYS_STORED);
}

/**
 * Record that the user used the app in a meaningful way today
 * (read scripture, viewed a verse, or completed guided scripture).
 * Call once per day from Home (verse viewed), Read (chapter loaded), or Guided (completed).
 * No-op if no wallet is connected (streaks are per-wallet).
 */
export async function recordAppActivity(): Promise<void> {
  const wallet = await getSavedWallet();
  if (!wallet.address) return;
  const today = getTodayDateString();
  const { appDates, guidedDates } = await loadStored();
  if (appDates.includes(today)) return;
  const next = trimToMax([...appDates, today]);
  await saveStored({ appDates: next, guidedDates });
}

/**
 * Record that the user actually read scripture today (loaded a chapter in ReadScreen).
 * This is stricter than recordAppActivity and is used for reward eligibility.
 * No-op if no wallet is connected.
 */
export async function recordReadActivity(): Promise<void> {
  const wallet = await getSavedWallet();
  if (!wallet.address) return;
  const today = getTodayDateString();
  const stored = await loadStored();
  if (stored.readDates?.includes(today)) return;
  const readDates = trimToMax([...(stored.readDates || []), today]);
  const appUpdated = stored.appDates.includes(today) ? stored.appDates : trimToMax([...stored.appDates, today]);
  await saveStored({ ...stored, appDates: appUpdated, readDates });
}

/**
 * Record that the user completed the full guided scripture experience today.
 * Call when they finish the guided flow (verse + reflection/prayer + complete).
 * Also counts as app activity and read activity.
 * No-op if no wallet is connected.
 */
export async function recordGuidedScriptureComplete(): Promise<void> {
  const wallet = await getSavedWallet();
  if (!wallet.address) return;
  const today = getTodayDateString();
  const stored = await loadStored();
  const guidedUpdated = stored.guidedDates.includes(today) ? stored.guidedDates : trimToMax([...stored.guidedDates, today]);
  const appUpdated = stored.appDates.includes(today) ? stored.appDates : trimToMax([...stored.appDates, today]);
  const readUpdated = stored.readDates?.includes(today) ? stored.readDates : trimToMax([...(stored.readDates || []), today]);
  await saveStored({ appDates: appUpdated, guidedDates: guidedUpdated, readDates: readUpdated });
}

/**
 * Get current and best streak for app usage.
 */
export async function getAppStreak(): Promise<StreakSnapshot> {
  const today = getTodayDateString();
  const { appDates } = await loadStored();
  return computeStreaks(appDates, today);
}

/**
 * Get current and best streak for guided scripture.
 */
export async function getGuidedStreak(): Promise<StreakSnapshot> {
  const today = getTodayDateString();
  const { guidedDates } = await loadStored();
  return computeStreaks(guidedDates, today);
}

/**
 * Full streak data for UI and future eligibility (e.g. token rewards).
 * Use lastAppDate / lastGuidedDate and appDates / guidedDates to check
 * "has user maintained N-day streak" without building reward logic now.
 */
/**
 * Migrate legacy (pre-wallet) streak data into the current wallet's key.
 * Call once after a wallet is connected to preserve any reading done before connecting.
 * Merges dates — safe to call multiple times.
 */
export async function migrateStreaksToWallet(): Promise<void> {
  const wallet = await getSavedWallet();
  if (!wallet.address) return;

  const walletKey = `${STREAK_STORAGE_PREFIX}${wallet.address}`;

  try {
    const legacyRaw = await AsyncStorage.getItem(STREAK_STORAGE_KEY_LEGACY);
    if (!legacyRaw) return;

    const legacy = JSON.parse(legacyRaw) as StoredStreaks;
    if (!legacy.appDates?.length && !legacy.guidedDates?.length && !legacy.readDates?.length) return;

    // Load existing wallet streaks
    const existingRaw = await AsyncStorage.getItem(walletKey);
    const existing: StoredStreaks = existingRaw
      ? JSON.parse(existingRaw)
      : { appDates: [], guidedDates: [], readDates: [] };

    // Merge (deduplicate)
    const mergeUnique = (a: string[], b: string[]) => [...new Set([...a, ...b])].sort();

    const merged: StoredStreaks = {
      appDates: trimToMax(mergeUnique(existing.appDates || [], legacy.appDates || [])),
      guidedDates: trimToMax(mergeUnique(existing.guidedDates || [], legacy.guidedDates || [])),
      readDates: trimToMax(mergeUnique(existing.readDates || [], legacy.readDates || [])),
    };

    await AsyncStorage.setItem(walletKey, JSON.stringify(merged));
    // Clear legacy key so we don't migrate again
    await AsyncStorage.removeItem(STREAK_STORAGE_KEY_LEGACY);
  } catch {
    // Non-critical
  }
}

export async function getStreakData(): Promise<StreakData> {
  const today = getTodayDateString();
  const stored = await loadStored();
  const { appDates, guidedDates } = stored;
  const readDates = stored.readDates || [];
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
    readDates,
  };
}
