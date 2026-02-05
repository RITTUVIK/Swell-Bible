/**
 * SWELL Balance Operations
 *
 * Fetches SWELL token balance for a given wallet using chain-derived decimals.
 * No hardcoded token decimals; uses mint module cache.
 *
 * This module is wallet-agnostic and contains no UI dependencies.
 */

import { PublicKey } from '@solana/web3.js';
import { getAccount, TokenAccountNotFoundError, TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { getConnection } from './connection';
import { getSwellTokenAccountAddress } from './account';
import { getSwellDecimals } from './mint';
import type { TokenBalance } from './types';
import { SwellTransferError, SwellErrorCode } from './errors';

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get the SWELL token balance for a wallet address.
 *
 * Returns balance and token account info. If the wallet has never held SWELL,
 * the token account won't exist and balance is 0. Decimals are fetched from
 * the SWELL mint account (cached after first call).
 *
 * @param walletAddress - The wallet's public key
 * @returns Token balance information (amount, rawAmount, tokenAccount, accountExists)
 *
 * @example
 * ```typescript
 * const balance = await getSwellBalance(new PublicKey('...'));
 * console.log(`${balance.amount} SWELL`);
 * ```
 */
export async function getSwellBalance(
  walletAddress: PublicKey
): Promise<TokenBalance> {
  const connection = getConnection();
  const decimals = await getSwellDecimals();

  const tokenAccountAddress = await getSwellTokenAccountAddress(walletAddress);

  try {
    const tokenAccount = await getAccount(
      connection,
      tokenAccountAddress,
      'confirmed',
      TOKEN_PROGRAM_ID
    );

    const rawAmount = tokenAccount.amount;
    const amount = Number(rawAmount) / Math.pow(10, decimals);

    return {
      amount,
      rawAmount,
      tokenAccount: tokenAccountAddress,
      accountExists: true,
    };
  } catch (error) {
    if (error instanceof TokenAccountNotFoundError) {
      return {
        amount: 0,
        rawAmount: BigInt(0),
        tokenAccount: tokenAccountAddress,
        accountExists: false,
      };
    }

    throw new SwellTransferError(
      `Failed to fetch SWELL balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
      SwellErrorCode.NETWORK_ERROR,
      error instanceof Error ? error : undefined
    );
  }
}
