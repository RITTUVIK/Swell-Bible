/**
 * Solana / SWELL Error Definitions
 *
 * Typed error codes and custom error class for all Solana module operations.
 * Enables programmatic handling and user-friendly messages.
 *
 * This module contains no UI dependencies.
 */

// =============================================================================
// ERROR CODES
// =============================================================================

/**
 * Error codes for SWELL and Solana operations.
 * Use these for programmatic handling (e.g. show different UI per code).
 */
export enum SwellErrorCode {
  /** Insufficient SWELL balance for transfer */
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',

  /** Insufficient SOL for transaction fees */
  INSUFFICIENT_SOL = 'INSUFFICIENT_SOL',

  /** Invalid recipient address */
  INVALID_RECIPIENT = 'INVALID_RECIPIENT',

  /** Invalid transfer amount */
  INVALID_AMOUNT = 'INVALID_AMOUNT',

  /** Transaction simulation failed before send */
  SIMULATION_FAILED = 'SIMULATION_FAILED',

  /** Transaction failed to confirm on-chain */
  CONFIRMATION_FAILED = 'CONFIRMATION_FAILED',

  /** User rejected the transaction in wallet */
  USER_REJECTED = 'USER_REJECTED',

  /** RPC or network error */
  NETWORK_ERROR = 'NETWORK_ERROR',

  /** Token account creation failed */
  ACCOUNT_CREATION_FAILED = 'ACCOUNT_CREATION_FAILED',

  /** Mint or token metadata fetch failed */
  MINT_FETCH_FAILED = 'MINT_FETCH_FAILED',

  /** Unknown error */
  UNKNOWN = 'UNKNOWN',
}

// =============================================================================
// CUSTOM ERROR CLASS
// =============================================================================

/**
 * Custom error class for Solana/SWELL operations.
 * Carries a typed code and optional cause for debugging.
 */
export class SwellTransferError extends Error {
  /** Error code for programmatic handling */
  code: SwellErrorCode;

  /** Original error, if this wraps another error */
  cause?: Error;

  constructor(message: string, code: SwellErrorCode, cause?: Error) {
    super(message);
    this.name = 'SwellTransferError';
    this.code = code;
    this.cause = cause;
  }
}
