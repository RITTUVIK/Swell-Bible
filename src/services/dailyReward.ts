/**
 * Daily Reading Reward
 *
 * Frontend-only: no real token transfers. Tracks reading completion (time on
 * chapter + scroll near end) and simulated claim. Ready for real SWELL transfer later.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'swell_bible_daily_reward';

function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface StoredDailyReward {
  readingCompletedDates: string[];
  lastClaimDate: string | null;
}

async function load(): Promise<StoredDailyReward> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { readingCompletedDates: [], lastClaimDate: null };
    const parsed = JSON.parse(raw) as StoredDailyReward;
    return {
      readingCompletedDates: Array.isArray(parsed.readingCompletedDates) ? parsed.readingCompletedDates : [],
      lastClaimDate: parsed.lastClaimDate ?? null,
    };
  } catch {
    return { readingCompletedDates: [], lastClaimDate: null };
  }
}

async function save(data: StoredDailyReward): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const MAX_DATES_STORED = 400;

function trimDates(dates: string[]): string[] {
  if (dates.length <= MAX_DATES_STORED) return dates;
  return [...dates].sort().slice(-MAX_DATES_STORED);
}

/**
 * Mark today as having completed reading (chapter open, time on screen, scroll near end).
 * Idempotent per day.
 */
export async function setReadingCompletedForToday(): Promise<void> {
  const today = getTodayDateString();
  const data = await load();
  if (data.readingCompletedDates.includes(today)) return;
  const next = trimDates([...data.readingCompletedDates, today]);
  await save({ ...data, readingCompletedDates: next });
}

export async function isReadingCompletedToday(): Promise<boolean> {
  const today = getTodayDateString();
  const data = await load();
  return data.readingCompletedDates.includes(today);
}

export async function getLastClaimDate(): Promise<string | null> {
  const data = await load();
  return data.lastClaimDate;
}

export async function hasClaimedToday(): Promise<boolean> {
  const today = getTodayDateString();
  const data = await load();
  return data.lastClaimDate === today;
}

/**
 * Simulate claiming today's 1 SWELL. No Solana call. Stores lastClaimDate = today.
 */
export async function claimTodaysReward(): Promise<void> {
  const today = getTodayDateString();
  const data = await load();
  await save({ ...data, lastClaimDate: today });
}

export type RewardEligibilityReason =
  | 'eligible'
  | 'reading_not_completed'
  | 'already_claimed'
  | 'wallet_not_connected';

export interface RewardEligibility {
  canClaim: boolean;
  reason: RewardEligibilityReason;
}

export async function getRewardEligibility(walletConnected: boolean): Promise<RewardEligibility> {
  const today = getTodayDateString();
  const [readingDone, lastClaim] = await Promise.all([
    isReadingCompletedToday(),
    getLastClaimDate(),
  ]);

  if (!walletConnected) {
    return { canClaim: false, reason: 'wallet_not_connected' };
  }
  if (lastClaim === today) {
    return { canClaim: false, reason: 'already_claimed' };
  }
  if (!readingDone) {
    return { canClaim: false, reason: 'reading_not_completed' };
  }
  return { canClaim: true, reason: 'eligible' };
}

export { getTodayDateString };
