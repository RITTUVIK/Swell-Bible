/**
 * Solana Module - SWELL Token Operations
 *
 * Single export surface for all SWELL token logic on Solana mainnet.
 * Wallet-agnostic; no UI dependencies.
 *
 * @module solana
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

export {
  SOLANA_CLUSTER,
  SOLANA_RPC_ENDPOINT,
  SOLANA_COMMITMENT,
  SWELL_MINT_ADDRESS,
  SWELL_MINT,
  DEFAULT_PRIORITY_FEE_MICROLAMPORTS,
  DEFAULT_COMPUTE_UNITS,
  TX_CONFIRMATION_TIMEOUT_MS,
  SOLANA_EXPLORER_URL,
  STREAK_PROGRAM_ID,
  STREAK_PROGRAM_ID_ADDRESS,
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
// ERRORS
// =============================================================================

export { SwellTransferError, SwellErrorCode } from './errors';

// =============================================================================
// TYPES
// =============================================================================

export type {
  WalletSigner,
  WalletSignerWithBatch,
  TransferParams,
  TransferResult,
  TokenBalance,
  TokenAccountResult,
} from './types';

// =============================================================================
// MINT (DECIMALS FROM CHAIN)
// =============================================================================

export {
  getSwellDecimals,
  clearSwellDecimalsCache,
} from './mint';

// =============================================================================
// BALANCE
// =============================================================================

export { getSwellBalance } from './balance';

// =============================================================================
// ACCOUNT (ATA)
// =============================================================================

export {
  getSwellTokenAccountAddress,
  doesSwellAccountExist,
  createSwellAccountInstruction,
  resolveOrCreateSwellAccount,
} from './account';

// =============================================================================
// TRANSFER
// =============================================================================

export { transferSwell } from './transfer';

// =============================================================================
// STREAK PROGRAM
// =============================================================================

export {
  fetchStreakAccount,
  recordAppOnChain,
  recordGuidedOnChain,
  getStreakPDA,
} from './streakProgram';

export type { OnChainStreakData } from './streakProgram';

// =============================================================================
// UTILITIES
// =============================================================================

export {
  isValidTransferAmount,
  formatSwellAmount,
  toRawAmount,
  fromRawAmount,
} from './utils';
