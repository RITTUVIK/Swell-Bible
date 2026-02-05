/**
 * Solana Configuration
 *
 * Contains all constants and configuration for Solana network connectivity
 * and SWELL token operations.
 *
 * This module is wallet-agnostic and contains no UI dependencies.
 */

import { PublicKey, Commitment, clusterApiUrl } from '@solana/web3.js';

// =============================================================================
// NETWORK CONFIGURATION
// =============================================================================

/**
 * Solana network cluster.
 * Set to 'mainnet-beta' for production SWELL token operations.
 */
export const SOLANA_CLUSTER = 'mainnet-beta' as const;

/**
 * RPC endpoint for Solana mainnet.
 *
 * Options:
 * 1. Use Solana's public RPC (rate-limited, not recommended for production)
 * 2. Use a dedicated RPC provider (Helius, QuickNode, Triton, etc.)
 *
 * For production, replace with a dedicated RPC endpoint:
 * e.g., 'https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY'
 */
export const SOLANA_RPC_ENDPOINT: string =
  process.env.SOLANA_RPC_URL || clusterApiUrl(SOLANA_CLUSTER);

/**
 * Transaction commitment level.
 *
 * - 'processed': Fastest, least certainty (may be rolled back)
 * - 'confirmed': Good balance of speed and certainty
 * - 'finalized': Slowest, maximum certainty (irreversible)
 *
 * 'confirmed' is recommended for most use cases.
 */
export const SOLANA_COMMITMENT: Commitment = 'confirmed';

// =============================================================================
// SWELL TOKEN CONFIGURATION
// =============================================================================

/**
 * SWELL token mint address on Solana mainnet.
 * This is the SPL token mint that identifies the SWELL token.
 */
export const SWELL_MINT_ADDRESS = '3L3dY6ZQnZ68MKhFCYVZYhimAdWbuAREdsY5fhebcDao';

/**
 * SWELL token mint as a PublicKey object.
 * Use this when interacting with Solana programs.
 */
export const SWELL_MINT = new PublicKey(SWELL_MINT_ADDRESS);

/**
 * Decimals are fetched from chain via getSwellDecimals() in mint.ts and cached.
 * Do not hardcode decimals here.
 */

// =============================================================================
// TRANSACTION CONFIGURATION
// =============================================================================

/**
 * Default priority fee in microlamports per compute unit.
 * Higher values = faster transaction inclusion during network congestion.
 *
 * 0 = no priority fee (may be slow during congestion)
 * 1000-10000 = reasonable priority fee
 * 100000+ = high priority
 */
export const DEFAULT_PRIORITY_FEE_MICROLAMPORTS = 1000;

/**
 * Default compute unit limit for SWELL transfers.
 * SPL token transfers typically use ~30,000 compute units.
 * Setting a buffer to 100,000 for safety.
 */
export const DEFAULT_COMPUTE_UNITS = 100_000;

/**
 * Transaction confirmation timeout in milliseconds.
 * How long to wait for a transaction to be confirmed.
 */
export const TX_CONFIRMATION_TIMEOUT_MS = 60_000;

// =============================================================================
// EXPLORER CONFIGURATION
// =============================================================================

/**
 * Solana Explorer base URL for mainnet.
 * Used to generate links to view transactions.
 */
export const SOLANA_EXPLORER_URL = 'https://explorer.solana.com';

/**
 * Generate a Solana Explorer URL for a transaction signature.
 *
 * @param signature - Transaction signature
 * @returns Full URL to view the transaction
 */
export function getExplorerTxUrl(signature: string): string {
  return `${SOLANA_EXPLORER_URL}/tx/${signature}`;
}

/**
 * Generate a Solana Explorer URL for an account/address.
 *
 * @param address - Account public key (string or PublicKey)
 * @returns Full URL to view the account
 */
export function getExplorerAddressUrl(address: string | PublicKey): string {
  const addressStr = typeof address === 'string' ? address : address.toBase58();
  return `${SOLANA_EXPLORER_URL}/address/${addressStr}`;
}
