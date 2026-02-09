import AsyncStorage from '@react-native-async-storage/async-storage';
import { Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import type { WalletSigner } from '../solana/types';

const WALLET_KEY = 'swell_bible_wallet';
const KEYPAIR_KEY = 'swell_bible_keypair';

export type WalletType = 'embedded' | 'external';

export interface WalletState {
  address: string | null;
  connected: boolean;
  type: WalletType | null;
}

// =============================================================================
// WALLET STATE (PERSISTED)
// =============================================================================

export async function getSavedWallet(): Promise<WalletState> {
  try {
    const raw = await AsyncStorage.getItem(WALLET_KEY);
    if (!raw) return { address: null, connected: false, type: null };
    return JSON.parse(raw) as WalletState;
  } catch {
    return { address: null, connected: false, type: null };
  }
}

export async function saveWallet(address: string, type: WalletType = 'external'): Promise<void> {
  await AsyncStorage.setItem(
    WALLET_KEY,
    JSON.stringify({ address, connected: true, type })
  );
}

export async function disconnectWallet(): Promise<void> {
  await AsyncStorage.removeItem(WALLET_KEY);
  // Don't remove keypair on disconnect — user might reconnect
}

// =============================================================================
// EMBEDDED WALLET (KEYPAIR GENERATED IN-APP)
// =============================================================================

/**
 * Create a new embedded wallet by generating a fresh Solana keypair.
 * Stores the keypair and returns the public address.
 */
export async function createEmbeddedWallet(): Promise<string> {
  const keypair = Keypair.generate();
  const secretKeyArray = Array.from(keypair.secretKey);
  await AsyncStorage.setItem(KEYPAIR_KEY, JSON.stringify(secretKeyArray));
  const address = keypair.publicKey.toBase58();
  await saveWallet(address, 'embedded');
  return address;
}

/**
 * Import an embedded wallet from a secret key (base58-encoded or Uint8Array JSON).
 */
export async function importEmbeddedWallet(secretKeyArray: number[]): Promise<string> {
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
  await AsyncStorage.setItem(KEYPAIR_KEY, JSON.stringify(secretKeyArray));
  const address = keypair.publicKey.toBase58();
  await saveWallet(address, 'embedded');
  return address;
}

/**
 * Get the stored embedded keypair (if it exists).
 */
export async function getEmbeddedKeypair(): Promise<Keypair | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYPAIR_KEY);
    if (!raw) return null;
    const secretKeyArray = JSON.parse(raw) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
  } catch {
    return null;
  }
}

/**
 * Get the secret key as a base58-encoded string (standard Solana format).
 * This can be imported directly into Phantom, Solflare, etc.
 */
export async function getEmbeddedSecretKey(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYPAIR_KEY);
    if (!raw) return null;
    const secretKeyArray = JSON.parse(raw) as number[];
    return bs58.encode(Uint8Array.from(secretKeyArray));
  } catch {
    return null;
  }
}

/**
 * Get a WalletSigner for the embedded wallet.
 * This can be passed directly to transferSwell() and other Solana operations.
 */
export async function getEmbeddedSigner(): Promise<WalletSigner | null> {
  const keypair = await getEmbeddedKeypair();
  if (!keypair) return null;

  return {
    publicKey: keypair.publicKey,
    signTransaction: async <T extends Transaction | VersionedTransaction>(
      transaction: T
    ): Promise<T> => {
      if (transaction instanceof Transaction) {
        transaction.sign(keypair);
      }
      return transaction;
    },
  };
}

/**
 * Permanently delete the embedded keypair.
 * WARNING: This is irreversible if the user hasn't backed up.
 */
export async function deleteEmbeddedWallet(): Promise<void> {
  await AsyncStorage.removeItem(KEYPAIR_KEY);
  await AsyncStorage.removeItem(WALLET_KEY);
}

// =============================================================================
// EXTERNAL WALLET (PHANTOM DEEP LINK)
// =============================================================================

/**
 * Save an externally connected wallet address (e.g. from Phantom).
 */
export async function saveExternalWallet(address: string): Promise<void> {
  await saveWallet(address, 'external');
}
