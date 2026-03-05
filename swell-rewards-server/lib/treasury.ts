import { Keypair } from '@solana/web3.js';

let cachedKeypair: Keypair | null = null;

export function getTreasuryKeypair(): Keypair {
  if (cachedKeypair) return cachedKeypair;

  const raw = process.env.TREASURY_KEYPAIR;
  if (!raw) {
    throw new Error('TREASURY_KEYPAIR environment variable is not set');
  }

  const secretKey = new Uint8Array(JSON.parse(raw));
  cachedKeypair = Keypair.fromSecretKey(secretKey);
  return cachedKeypair;
}
