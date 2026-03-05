import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PublicKey } from '@solana/web3.js';
import { getClaimHistory } from '../lib/claimStore';
import { isRateLimited } from '../lib/rateLimit';

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  try {
    const wallet = req.query.wallet as string;
    if (!wallet) {
      return res.status(400).json({ error: 'wallet query parameter is required' });
    }

    try {
      new PublicKey(wallet);
    } catch {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    const history = await getClaimHistory(wallet);

    return res.status(200).json({
      wallet,
      totalClaimed: history.length,
      claims: history,
    });
  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Claim history error:', errMsg);
    return res.status(500).json({ error: 'Failed to fetch claim history', details: errMsg });
  }
}
