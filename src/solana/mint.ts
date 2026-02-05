/**
 * SWELL Mint Info
 *
 * Fetches SWELL token mint metadata from chain (decimals, supply, etc.)
 * and caches it in memory for reuse. No hardcoded decimals.
 *
 * This module is wallet-agnostic and contains no UI dependencies.
 */

import { getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getConnection } from './connection';
import { SWELL_MINT } from './config';
import { SwellTransferError, SwellErrorCode } from './errors';

// =============================================================================
// IN-MEMORY CACHE
// =============================================================================

/**
 * Cached decimals for SWELL mint.
 * Populated on first getSwellDecimals() call, then reused.
 */
let _cachedDecimals: number | null = null;

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get SWELL token decimals from chain and cache in memory.
 *
 * First call fetches the mint account via RPC and caches decimals.
 * Subsequent calls return the cached value (no RPC).
 *
 * SPL mint accounts store decimals in a single byte; this is the
 * standard way to derive human-readable amounts from raw token amounts.
 *
 * @returns Number of decimal places (e.g. 9)
 * @throws SwellTransferError with MINT_FETCH_FAILED if RPC fails or mint invalid
 *
 * @example
 * ```typescript
 * const decimals = await getSwellDecimals();
 * const rawAmount = BigInt(amount * Math.pow(10, decimals));
 * ```
 */
export async function getSwellDecimals(): Promise<number> {
  if (_cachedDecimals !== null) {
    return _cachedDecimals;
  }

  try {
    const connection = getConnection();
    const mintInfo = await getMint(
      connection,
      SWELL_MINT,
      'confirmed',
      TOKEN_PROGRAM_ID
    );

    const decimals = mintInfo.decimals;
    _cachedDecimals = decimals;
    return decimals;
  } catch (error) {
    throw new SwellTransferError(
      `Failed to fetch SWELL mint info: ${error instanceof Error ? error.message : 'Unknown error'}`,
      SwellErrorCode.MINT_FETCH_FAILED,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Clear the cached decimals (e.g. for tests or after mint upgrade).
 * Next getSwellDecimals() will fetch from chain again.
 */
export function clearSwellDecimalsCache(): void {
  _cachedDecimals = null;
}
