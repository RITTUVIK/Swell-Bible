import AsyncStorage from '@react-native-async-storage/async-storage';
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { getStreakData } from './streaks';
import { getEmbeddedKeypair, getSavedWallet } from './walletContext';

const CLAIMED_DATES_PREFIX = 'swell_claimed_dates:';
const REWARDS_API_URL = process.env.EXPO_PUBLIC_REWARDS_API_URL || 'http://localhost:3000';

function claimedDatesKey(wallet: string): string {
  return `${CLAIMED_DATES_PREFIX}${wallet}`;
}

async function getCurrentWallet(): Promise<string | null> {
  const wallet = await getSavedWallet();
  return wallet.address;
}

export interface ClaimResult {
  success: boolean;
  signature?: string;
  explorerUrl?: string;
  error?: string;
}

export interface ClaimHistoryEntry {
  date: string;
  signature: string;
}

function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Local claim cache (AsyncStorage)
// ---------------------------------------------------------------------------

export async function getClaimedDates(wallet?: string): Promise<string[]> {
  try {
    const addr = wallet || await getCurrentWallet();
    if (!addr) return [];
    const raw = await AsyncStorage.getItem(claimedDatesKey(addr));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function hasClaimedDate(date: string, wallet?: string): Promise<boolean> {
  const dates = await getClaimedDates(wallet);
  return dates.includes(date);
}

async function saveClaimedDate(date: string, wallet: string): Promise<void> {
  const dates = await getClaimedDates(wallet);
  if (!dates.includes(date)) {
    dates.push(date);
    await AsyncStorage.setItem(claimedDatesKey(wallet), JSON.stringify(dates));
  }
}

// ---------------------------------------------------------------------------
// Claimability check
// ---------------------------------------------------------------------------

export async function isTodayClaimable(): Promise<{ claimable: boolean; reason?: string }> {
  const today = getTodayDateString();

  const claimed = await hasClaimedDate(today);
  if (claimed) {
    return { claimable: false, reason: 'already_claimed' };
  }

  const streakData = await getStreakData();
  const hasReadToday = streakData.readDates.includes(today);
  if (!hasReadToday) {
    return { claimable: false, reason: 'no_reading' };
  }

  return { claimable: true };
}

// ---------------------------------------------------------------------------
// Unclaimed reading days (read but never claimed, within last 7 days)
// ---------------------------------------------------------------------------

export async function getUnclaimedDays(): Promise<string[]> {
  const streakData = await getStreakData();
  const claimedDates = await getClaimedDates();
  const claimedSet = new Set(claimedDates);

  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return streakData.readDates.filter((dateStr) => {
    if (claimedSet.has(dateStr)) return false;
    const d = new Date(dateStr + 'T12:00:00');
    return d >= sevenDaysAgo && d <= today;
  });
}

// ---------------------------------------------------------------------------
// Wallet message signing
// ---------------------------------------------------------------------------

async function signClaimMessage(walletAddress: string, date: string): Promise<string | null> {
  const wallet = await getSavedWallet();

  if (wallet.type === 'embedded') {
    const keypair = await getEmbeddedKeypair();
    if (!keypair) return null;

    const message = `swell:claim:${walletAddress}:${date}`;
    const messageBytes = new TextEncoder().encode(message);
    const sig = nacl.sign.detached(messageBytes, keypair.secretKey);
    return Buffer.from(sig).toString('base64');
  }

  if (wallet.type === 'mwa' || wallet.type === 'external') {
    try {
      const { signMessageMwa } = require('./mwaConnect');
      const message = `swell:claim:${walletAddress}:${date}`;
      return await signMessageMwa(message);
    } catch (err) {
      console.error('[rewards] MWA sign failed:', err);
      return null;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Claim reward
// ---------------------------------------------------------------------------

export async function claimReward(walletAddress: string, date?: string): Promise<ClaimResult> {
  const claimDate = date || getTodayDateString();

  // Sign the claim message
  const walletSignature = await signClaimMessage(walletAddress, claimDate);
  if (!walletSignature) {
    return { success: false, error: 'Could not sign claim. Please approve the signing request in your wallet app, or try disconnecting and reconnecting.' };
  }

  try {
    const response = await fetch(`${REWARDS_API_URL}/api/claim-reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, date: claimDate, signature: walletSignature }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Claim failed' };
    }

    await saveClaimedDate(claimDate, walletAddress);

    return {
      success: true,
      signature: data.signature,
      explorerUrl: data.explorerUrl,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Network error' };
  }
}

// ---------------------------------------------------------------------------
// Claim history (from server)
// ---------------------------------------------------------------------------

export async function fetchClaimHistory(walletAddress: string): Promise<ClaimHistoryEntry[]> {
  try {
    const response = await fetch(
      `${REWARDS_API_URL}/api/claim-history?wallet=${encodeURIComponent(walletAddress)}`,
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.claims || [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Total earned (local cache count)
// ---------------------------------------------------------------------------

export async function getTotalEarned(): Promise<number> {
  const dates = await getClaimedDates();
  return dates.length;
}
