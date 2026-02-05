/**
 * Solana Type Definitions
 *
 * Wallet-agnostic types for Solana operations.
 * These types allow the logic to work with any wallet implementation.
 *
 * This module contains no UI dependencies.
 */

import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

// =============================================================================
// WALLET INTERFACE
// =============================================================================

/**
 * Minimal wallet interface required for signing transactions.
 *
 * This is wallet-agnostic: any wallet that provides a publicKey
 * and signTransaction function can be used.
 *
 * Compatible with:
 * - @solana/wallet-adapter (Phantom, Solflare, etc.)
 * - Mobile wallets (Solana Mobile SDK)
 * - Custom wallet implementations
 *
 * @example
 * ```typescript
 * // With Solana wallet adapter
 * const wallet: WalletSigner = {
 *   publicKey: walletAdapter.publicKey!,
 *   signTransaction: walletAdapter.signTransaction.bind(walletAdapter),
 * };
 *
 * // Pass to transfer function
 * await transferSwell(wallet, recipientPubkey, amount);
 * ```
 */
export interface WalletSigner {
  /**
   * The wallet's public key (address).
   */
  publicKey: PublicKey;

  /**
   * Sign a transaction with the wallet's private key.
   *
   * @param transaction - Transaction to sign (legacy or versioned)
   * @returns Signed transaction
   */
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T>;
}

/**
 * Extended wallet interface that also supports signing multiple transactions.
 *
 * Optional: Only needed for batch operations.
 */
export interface WalletSignerWithBatch extends WalletSigner {
  /**
   * Sign multiple transactions at once.
   *
   * @param transactions - Array of transactions to sign
   * @returns Array of signed transactions
   */
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]>;
}

// =============================================================================
// TRANSFER TYPES
// =============================================================================

/**
 * Parameters for a SWELL token transfer.
 */
export interface TransferParams {
  /**
   * Wallet that will sign and pay for the transaction.
   */
  sender: WalletSigner;

  /**
   * Recipient's public key (wallet address).
   */
  recipient: PublicKey;

  /**
   * Amount of SWELL to transfer (in token units, not raw lamports).
   * e.g., 10.5 means 10.5 SWELL tokens.
   */
  amount: number;

  /**
   * Optional: Custom priority fee in microlamports per compute unit.
   * Higher = faster confirmation during congestion.
   */
  priorityFee?: number;
}

/**
 * Result of a successful transfer.
 */
export interface TransferResult {
  /**
   * Transaction signature (can be used to look up on explorer).
   */
  signature: string;

  /**
   * The slot in which the transaction was confirmed.
   */
  slot: number;

  /**
   * Block time of the confirmation (Unix timestamp in seconds).
   * May be null if block time is not available.
   */
  blockTime: number | null;

  /**
   * URL to view the transaction on Solana Explorer.
   */
  explorerUrl: string;
}

// =============================================================================
// BALANCE TYPES
// =============================================================================

/**
 * SWELL token balance information.
 */
export interface TokenBalance {
  /**
   * Balance in token units (human-readable).
   * e.g., 135.5 means 135.5 SWELL tokens.
   */
  amount: number;

  /**
   * Raw balance in smallest units (with decimals).
   * e.g., 135500000000 for 135.5 SWELL (with 9 decimals).
   */
  rawAmount: bigint;

  /**
   * The token account address holding this balance.
   */
  tokenAccount: PublicKey;

  /**
   * Whether the token account exists on-chain.
   * If false, the account needs to be created before receiving tokens.
   */
  accountExists: boolean;
}

// =============================================================================
// ACCOUNT TYPES
// =============================================================================

/**
 * Result of resolving or creating an associated token account.
 */
export interface TokenAccountResult {
  /**
   * The associated token account address.
   */
  address: PublicKey;

  /**
   * Whether the account already existed.
   * If false, it was created as part of this operation.
   */
  existed: boolean;

  /**
   * Transaction signature if account was created.
   * Null if account already existed.
   */
  createSignature: string | null;
}

// Error types (SwellTransferError, SwellErrorCode) live in errors.ts
