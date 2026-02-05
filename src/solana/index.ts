/**
 * Solana Module - SWELL Token Operations
 *
 * This module provides all the logic needed for SWELL token operations
 * on Solana mainnet. It is wallet-agnostic and contains no UI dependencies.
 *
 * Usage:
 * ```typescript
 * import {
 *   // Configuration
 *   SWELL_MINT,
 *   SWELL_DECIMALS,
 *   getExplorerTxUrl,
 *
 *   // Connection
 *   getConnection,
 *   isConnectionHealthy,
 *
 *   // Token operations
 *   getSwellBalance,
 *   transferSwell,
 *   resolveOrCreateSwellAccount,
 *
 *   // Types
 *   WalletSigner,
 *   TransferResult,
 *   SwellTransferError,
 * } from './solana';
 * ```
 *
 * @module solana
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

export {
  // Network configuration
  SOLANA_CLUSTER,
  SOLANA_RPC_ENDPOINT,
  SOLANA_COMMITMENT,

  // SWELL token configuration
  SWELL_MINT_ADDRESS,
  SWELL_MINT,
  SWELL_DECIMALS,

  // Transaction configuration
  DEFAULT_PRIORITY_FEE_MICROLAMPORTS,
  DEFAULT_COMPUTE_UNITS,
  TX_CONFIRMATION_TIMEOUT_MS,

  // Explorer utilities
  SOLANA_EXPLORER_URL,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from './config';

// =============================================================================
// CONNECTION
// =============================================================================

export {
  getConnection,
  createConnection,
  resetConnection,
  isConnectionHealthy,
  getCurrentSlot,
  getLatestBlockhash,
} from './connection';

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Wallet types
  WalletSigner,
  WalletSignerWithBatch,

  // Transfer types
  TransferParams,
  TransferResult,

  // Balance types
  TokenBalance,

  // Account types
  TokenAccountResult,
} from './types';

export { SwellTransferError, SwellErrorCode } from './types';

// =============================================================================
// TOKEN OPERATIONS
// =============================================================================

export {
  // Balance operations
  getSwellBalance,

  // Account operations
  getSwellTokenAccountAddress,
  doesSwellAccountExist,
  createSwellAccountInstruction,
  resolveOrCreateSwellAccount,

  // Transfer operations
  transferSwell,

  // Utility functions
  isValidTransferAmount,
  formatSwellAmount,
  toRawAmount,
  fromRawAmount,
} from './token';
