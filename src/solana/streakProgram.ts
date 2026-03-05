/**
 * On-chain Streak Program Client
 *
 * Reads and writes streak data from the swell-streak Solana program.
 * Uses raw @solana/web3.js (no Anchor SDK) for minimal bundle size.
 *
 * Account layout mirrors programs/swell-streak/src/lib.rs — keep in sync.
 */

import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { getConnection, getLatestBlockhash } from './connection';
import { STREAK_PROGRAM_ID, SOLANA_COMMITMENT } from './config';
import type { WalletSigner } from './types';

// ---------------------------------------------------------------------------
// Account layout constants — must match lib.rs StreakAccount
// ---------------------------------------------------------------------------

const MAX_DATES = 120;
const SECONDS_PER_DAY = 86_400;

/** 8-byte Anchor account discriminator for StreakAccount. */
const ACCOUNT_DISCRIMINATOR = Buffer.from([83, 102, 173, 241, 78, 145, 1, 113]);

/** Anchor instruction discriminators (sha256("global:<name>")[0..8]). */
const IX_INITIALIZE   = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);
const IX_RECORD_APP   = Buffer.from([43, 62, 132, 143, 216, 81, 81, 202]);
const IX_RECORD_GUIDED = Buffer.from([206, 219, 194, 239, 108, 184, 102, 25]);

// Account data offsets (after 8-byte discriminator)
const OFF_OWNER            = 8;          // 32
const OFF_BUMP             = 40;         //  1
const OFF_APP_CURRENT      = 41;         //  2
const OFF_APP_BEST         = 43;         //  2
const OFF_GUIDED_CURRENT   = 45;         //  2
const OFF_GUIDED_BEST      = 47;         //  2
const OFF_LAST_APP_DAY     = 49;         //  2
const OFF_LAST_GUIDED_DAY  = 51;         //  2
const OFF_APP_DATES_LEN    = 53;         //  1
const OFF_GUIDED_DATES_LEN = 54;         //  1
const OFF_APP_DATES        = 55;         // 240
const OFF_GUIDED_DATES     = 55 + 240;   // 240
const ACCOUNT_SIZE         = 8 + 32 + 1 + 2 * 6 + 1 * 2 + 240 * 2; // 535

// ---------------------------------------------------------------------------
// Parsed types
// ---------------------------------------------------------------------------

export interface OnChainStreakData {
  owner: PublicKey;
  appStreakCurrent: number;
  appStreakBest: number;
  guidedStreakCurrent: number;
  guidedStreakBest: number;
  lastAppDay: number;
  lastGuidedDay: number;
  appDates: string[];     // YYYY-MM-DD
  guidedDates: string[];  // YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function utcDayToDateStr(day: number): string {
  const d = new Date(day * SECONDS_PER_DAY * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Derive the PDA address for a wallet's streak account. */
export async function getStreakPDA(
  walletAddress: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from('streak'), walletAddress.toBuffer()],
    STREAK_PROGRAM_ID,
  );
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Fetch the on-chain streak record for a wallet.
 * Returns null if the account does not exist yet.
 */
export async function fetchStreakAccount(
  walletAddress: PublicKey
): Promise<OnChainStreakData | null> {
  const connection = getConnection();
  const [pda] = await getStreakPDA(walletAddress);

  const info = await connection.getAccountInfo(pda, SOLANA_COMMITMENT);
  if (!info || !info.data || info.data.length < ACCOUNT_SIZE) {
    return null;
  }

  const buf = Buffer.from(info.data);

  // Validate discriminator
  if (!buf.subarray(0, 8).equals(ACCOUNT_DISCRIMINATOR)) {
    return null;
  }

  const owner = new PublicKey(buf.subarray(OFF_OWNER, OFF_OWNER + 32));
  const appStreakCurrent  = buf.readUInt16LE(OFF_APP_CURRENT);
  const appStreakBest     = buf.readUInt16LE(OFF_APP_BEST);
  const guidedStreakCurrent = buf.readUInt16LE(OFF_GUIDED_CURRENT);
  const guidedStreakBest  = buf.readUInt16LE(OFF_GUIDED_BEST);
  const lastAppDay       = buf.readUInt16LE(OFF_LAST_APP_DAY);
  const lastGuidedDay    = buf.readUInt16LE(OFF_LAST_GUIDED_DAY);
  const appDatesLen      = buf.readUInt8(OFF_APP_DATES_LEN);
  const guidedDatesLen   = buf.readUInt8(OFF_GUIDED_DATES_LEN);

  const appDates: string[] = [];
  for (let i = 0; i < Math.min(appDatesLen, MAX_DATES); i++) {
    appDates.push(utcDayToDateStr(buf.readUInt16LE(OFF_APP_DATES + i * 2)));
  }

  const guidedDates: string[] = [];
  for (let i = 0; i < Math.min(guidedDatesLen, MAX_DATES); i++) {
    guidedDates.push(utcDayToDateStr(buf.readUInt16LE(OFF_GUIDED_DATES + i * 2)));
  }

  return {
    owner,
    appStreakCurrent,
    appStreakBest,
    guidedStreakCurrent,
    guidedStreakBest,
    lastAppDay,
    lastGuidedDay,
    appDates,
    guidedDates,
  };
}

// ---------------------------------------------------------------------------
// Write helpers
// ---------------------------------------------------------------------------

async function buildAndSend(
  signer: WalletSigner,
  ixData: Buffer,
  streakPDA: PublicKey,
  needsInit: boolean,
): Promise<string | null> {
  const connection = getConnection();
  const { blockhash, lastValidBlockHeight } = await getLatestBlockhash();
  const transaction = new Transaction();

  if (needsInit) {
    const [, bump] = await getStreakPDA(signer.publicKey);
    void bump; // bump is embedded by Anchor at init time
    transaction.add(
      new TransactionInstruction({
        programId: STREAK_PROGRAM_ID,
        keys: [
          { pubkey: streakPDA, isSigner: false, isWritable: true },
          { pubkey: signer.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: IX_INITIALIZE,
      }),
    );
  }

  transaction.add(
    new TransactionInstruction({
      programId: STREAK_PROGRAM_ID,
      keys: [
        { pubkey: streakPDA, isSigner: false, isWritable: true },
        { pubkey: signer.publicKey, isSigner: true, isWritable: false },
      ],
      data: ixData,
    }),
  );

  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = signer.publicKey;

  const signed = await signer.signTransaction(transaction);
  const sig = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    'confirmed',
  );

  return sig;
}

/**
 * Ensure the streak PDA exists, then send an activity instruction.
 * Returns the tx signature or null if the write was skipped / failed.
 */
async function recordOnChain(
  signer: WalletSigner,
  ixData: Buffer,
): Promise<string | null> {
  const [pda] = await getStreakPDA(signer.publicKey);
  const connection = getConnection();
  const info = await connection.getAccountInfo(pda, SOLANA_COMMITMENT);
  const needsInit = !info || info.data.length === 0;

  return buildAndSend(signer, ixData, pda, needsInit);
}

// ---------------------------------------------------------------------------
// Public write API
// ---------------------------------------------------------------------------

/**
 * Record app activity for today on-chain.
 * Silently creates the streak PDA if it doesn't exist yet.
 */
export async function recordAppOnChain(
  signer: WalletSigner,
): Promise<string | null> {
  return recordOnChain(signer, IX_RECORD_APP);
}

/**
 * Record guided scripture completion for today on-chain.
 * Also counts as app activity (handled by the program).
 */
export async function recordGuidedOnChain(
  signer: WalletSigner,
): Promise<string | null> {
  return recordOnChain(signer, IX_RECORD_GUIDED);
}
