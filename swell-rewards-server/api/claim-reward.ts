import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  Connection,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getMint,
} from '@solana/spl-token';
import nacl from 'tweetnacl';
import { getTreasuryKeypair } from '../lib/treasury';
import { hasClaimedDate, recordClaim } from '../lib/claimStore';
import { isRateLimited } from '../lib/rateLimit';

// SWELL token mint address (matches src/solana/config.ts)
const SWELL_MINT = new PublicKey('3L3dY6ZQnZ68MKhFCYVZYhimAdWbuAREdsY5fhebcDao');

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  try {
    const { walletAddress, date, signature: walletSignature } = req.body || {};

    // Validate wallet address
    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'walletAddress is required' });
    }

    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(walletAddress);
    } catch {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    // Validate date
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD format' });
    }

    const claimDate = new Date(date + 'T12:00:00Z');
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));

    if (claimDate > today) {
      return res.status(400).json({ error: 'Cannot claim for a future date' });
    }

    const diffDays = Math.floor((today.getTime() - claimDate.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays > 7) {
      return res.status(400).json({ error: 'Cannot claim for dates more than 7 days ago' });
    }

    // Verify wallet signature (proves ownership)
    if (!walletSignature || typeof walletSignature !== 'string') {
      return res.status(400).json({ error: 'signature is required (sign the claim message with your wallet)' });
    }

    const message = `swell:claim:${walletAddress}:${date}`;
    const messageBytes = new TextEncoder().encode(message);
    let signatureBytes: Uint8Array;
    try {
      signatureBytes = Uint8Array.from(Buffer.from(walletSignature, 'base64'));
    } catch {
      return res.status(400).json({ error: 'Invalid signature encoding (expected base64)' });
    }

    const verified = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      recipientPubkey.toBytes(),
    );
    if (!verified) {
      return res.status(401).json({ error: 'Signature verification failed. You must sign with the claiming wallet.' });
    }

    // Check double-claim
    const alreadyClaimed = await hasClaimedDate(walletAddress, date);
    if (alreadyClaimed) {
      return res.status(409).json({ error: 'Reward already claimed for this date' });
    }

    // Build and send transfer
    const treasuryKeypair = getTreasuryKeypair();
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    // Get or create ATAs (treasury pays rent)
    const recipientAta = await getOrCreateAssociatedTokenAccount(
      connection,
      treasuryKeypair,
      SWELL_MINT,
      recipientPubkey,
    );

    const senderAta = await getOrCreateAssociatedTokenAccount(
      connection,
      treasuryKeypair,
      SWELL_MINT,
      treasuryKeypair.publicKey,
    );

    // Fetch decimals from mint account
    const mintInfo = await getMint(connection, SWELL_MINT, 'confirmed');
    const amount = 1 * Math.pow(10, mintInfo.decimals);

    const transaction = new Transaction();

    // Add priority fee for faster confirmation
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5000 }),
    );

    transaction.add(
      createTransferInstruction(
        senderAta.address,
        recipientAta.address,
        treasuryKeypair.publicKey,
        amount,
      ),
    );

    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = treasuryKeypair.publicKey;
    transaction.sign(treasuryKeypair);

    // Send without waiting for full confirmation to avoid timeout
    const txSignature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    // Record claim
    await recordClaim(walletAddress, date, txSignature);

    return res.status(200).json({
      success: true,
      signature: txSignature,
      explorerUrl: `https://solscan.io/tx/${txSignature}`,
    });
  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Claim reward error:', errMsg);
    return res.status(500).json({
      error: 'Failed to process reward claim',
      details: errMsg,
    });
  }
}
