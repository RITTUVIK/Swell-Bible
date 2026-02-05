/**
 * SWELL Token Operations
 *
 * Core logic for SWELL SPL token operations on Solana mainnet:
 * - Fetch balance
 * - Resolve/create associated token accounts
 * - Transfer tokens between wallets
 *
 * This module is wallet-agnostic and contains no UI dependencies.
 * All functions accept a WalletSigner interface for signing.
 */

import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  TokenAccountNotFoundError,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

import { getConnection, getLatestBlockhash } from './connection';
import {
  SWELL_MINT,
  SWELL_DECIMALS,
  DEFAULT_PRIORITY_FEE_MICROLAMPORTS,
  DEFAULT_COMPUTE_UNITS,
  getExplorerTxUrl,
} from './config';
import {
  WalletSigner,
  TransferParams,
  TransferResult,
  TokenBalance,
  TokenAccountResult,
  SwellTransferError,
  SwellErrorCode,
} from './types';

// =============================================================================
// BALANCE OPERATIONS
// =============================================================================

/**
 * Get the SWELL token balance for a wallet address.
 *
 * Returns the balance and token account info. If the wallet has never
 * held SWELL, the token account won't exist and balance will be 0.
 *
 * @param walletAddress - The wallet's public key
 * @returns Token balance information
 *
 * @example
 * ```typescript
 * import { getSwellBalance } from './solana/token';
 * import { PublicKey } from '@solana/web3.js';
 *
 * const balance = await getSwellBalance(
 *   new PublicKey('YourWalletAddress...')
 * );
 * console.log(`Balance: ${balance.amount} SWELL`);
 * ```
 */
export async function getSwellBalance(
  walletAddress: PublicKey
): Promise<TokenBalance> {
  const connection = getConnection();

  // Derive the associated token account (ATA) address for this wallet
  const tokenAccountAddress = await getAssociatedTokenAddress(
    SWELL_MINT,
    walletAddress,
    false, // allowOwnerOffCurve = false (standard wallets)
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  try {
    // Try to fetch the token account
    const tokenAccount = await getAccount(
      connection,
      tokenAccountAddress,
      'confirmed',
      TOKEN_PROGRAM_ID
    );

    // Calculate human-readable amount from raw balance
    const rawAmount = tokenAccount.amount;
    const amount = Number(rawAmount) / Math.pow(10, SWELL_DECIMALS);

    return {
      amount,
      rawAmount,
      tokenAccount: tokenAccountAddress,
      accountExists: true,
    };
  } catch (error) {
    // Token account doesn't exist = zero balance
    if (error instanceof TokenAccountNotFoundError) {
      return {
        amount: 0,
        rawAmount: BigInt(0),
        tokenAccount: tokenAccountAddress,
        accountExists: false,
      };
    }

    // Rethrow other errors
    throw new SwellTransferError(
      `Failed to fetch SWELL balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
      SwellErrorCode.NETWORK_ERROR,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Get the raw token account balance (internal helper).
 *
 * @param tokenAccountAddress - The token account address
 * @returns Raw balance as bigint, or 0 if account doesn't exist
 */
async function getRawTokenBalance(
  tokenAccountAddress: PublicKey
): Promise<bigint> {
  const connection = getConnection();

  try {
    const tokenAccount = await getAccount(
      connection,
      tokenAccountAddress,
      'confirmed',
      TOKEN_PROGRAM_ID
    );
    return tokenAccount.amount;
  } catch (error) {
    if (error instanceof TokenAccountNotFoundError) {
      return BigInt(0);
    }
    throw error;
  }
}

// =============================================================================
// TOKEN ACCOUNT OPERATIONS
// =============================================================================

/**
 * Get the associated token account (ATA) address for a wallet.
 *
 * This derives the deterministic ATA address for the SWELL token.
 * The account may or may not exist on-chain.
 *
 * @param walletAddress - The wallet's public key
 * @returns The associated token account address
 *
 * @example
 * ```typescript
 * import { getSwellTokenAccountAddress } from './solana/token';
 *
 * const ata = await getSwellTokenAccountAddress(walletPubkey);
 * console.log(`Token account: ${ata.toBase58()}`);
 * ```
 */
export async function getSwellTokenAccountAddress(
  walletAddress: PublicKey
): Promise<PublicKey> {
  return getAssociatedTokenAddress(
    SWELL_MINT,
    walletAddress,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

/**
 * Check if a wallet's SWELL token account exists.
 *
 * @param walletAddress - The wallet's public key
 * @returns True if the token account exists, false otherwise
 */
export async function doesSwellAccountExist(
  walletAddress: PublicKey
): Promise<boolean> {
  const balance = await getSwellBalance(walletAddress);
  return balance.accountExists;
}

/**
 * Create instruction to initialize a SWELL associated token account.
 *
 * Returns the instruction needed to create an ATA for the recipient.
 * The payer will pay the rent (~0.002 SOL).
 *
 * @param payer - Public key that will pay for account creation
 * @param owner - Public key that will own the token account
 * @returns Transaction instruction for creating the ATA
 */
export async function createSwellAccountInstruction(
  payer: PublicKey,
  owner: PublicKey
): Promise<TransactionInstruction> {
  const ata = await getSwellTokenAccountAddress(owner);

  return createAssociatedTokenAccountInstruction(
    payer, // Payer of the transaction and rent
    ata, // Associated token account to create
    owner, // Owner of the new account
    SWELL_MINT, // Token mint
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

/**
 * Resolve or create a SWELL token account for a wallet.
 *
 * If the account exists, returns its address.
 * If it doesn't exist, creates it and returns the address.
 *
 * The signer wallet pays for account creation (~0.002 SOL rent).
 *
 * @param signer - Wallet that will sign and pay for creation if needed
 * @param targetWallet - Wallet that will own the token account
 * @returns Token account result with address and creation status
 *
 * @example
 * ```typescript
 * import { resolveOrCreateSwellAccount } from './solana/token';
 *
 * // Ensure recipient has a token account before transfer
 * const result = await resolveOrCreateSwellAccount(
 *   senderWallet,
 *   recipientPubkey
 * );
 *
 * if (!result.existed) {
 *   console.log(`Created token account: ${result.createSignature}`);
 * }
 * ```
 */
export async function resolveOrCreateSwellAccount(
  signer: WalletSigner,
  targetWallet: PublicKey
): Promise<TokenAccountResult> {
  const connection = getConnection();
  const ata = await getSwellTokenAccountAddress(targetWallet);

  // Check if account already exists
  try {
    await getAccount(connection, ata, 'confirmed', TOKEN_PROGRAM_ID);

    // Account exists, return it
    return {
      address: ata,
      existed: true,
      createSignature: null,
    };
  } catch (error) {
    if (!(error instanceof TokenAccountNotFoundError)) {
      throw new SwellTransferError(
        `Failed to check token account: ${error instanceof Error ? error.message : 'Unknown error'}`,
        SwellErrorCode.NETWORK_ERROR,
        error instanceof Error ? error : undefined
      );
    }
  }

  // Account doesn't exist, create it
  try {
    const { blockhash, lastValidBlockHeight } = await getLatestBlockhash();

    // Build transaction to create ATA
    const createInstruction = await createSwellAccountInstruction(
      signer.publicKey,
      targetWallet
    );

    const transaction = new Transaction();
    transaction.add(createInstruction);
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = signer.publicKey;

    // Sign the transaction
    const signedTx = await signer.signTransaction(transaction);

    // Send and confirm
    const signature = await connection.sendRawTransaction(signedTx.serialize());

    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed'
    );

    return {
      address: ata,
      existed: false,
      createSignature: signature,
    };
  } catch (error) {
    // Check for user rejection
    const errorMessage =
      error instanceof Error ? error.message.toLowerCase() : '';
    if (
      errorMessage.includes('rejected') ||
      errorMessage.includes('cancelled') ||
      errorMessage.includes('denied')
    ) {
      throw new SwellTransferError(
        'User rejected the transaction',
        SwellErrorCode.USER_REJECTED,
        error instanceof Error ? error : undefined
      );
    }

    throw new SwellTransferError(
      `Failed to create token account: ${error instanceof Error ? error.message : 'Unknown error'}`,
      SwellErrorCode.ACCOUNT_CREATION_FAILED,
      error instanceof Error ? error : undefined
    );
  }
}

// =============================================================================
// TRANSFER OPERATIONS
// =============================================================================

/**
 * Transfer SWELL tokens from one wallet to another.
 *
 * This function handles:
 * 1. Validating the transfer amount
 * 2. Checking sender has sufficient balance
 * 3. Creating recipient's token account if needed
 * 4. Building and signing the transfer transaction
 * 5. Sending and confirming the transaction
 *
 * @param params - Transfer parameters
 * @returns Transfer result with signature and confirmation details
 * @throws SwellTransferError with specific error codes
 *
 * @example
 * ```typescript
 * import { transferSwell } from './solana/token';
 * import { PublicKey } from '@solana/web3.js';
 *
 * // Transfer 10 SWELL to another wallet
 * const result = await transferSwell({
 *   sender: {
 *     publicKey: myWalletPubkey,
 *     signTransaction: mySignFunction,
 *   },
 *   recipient: new PublicKey('RecipientAddress...'),
 *   amount: 10.0,
 * });
 *
 * console.log(`Transfer complete: ${result.explorerUrl}`);
 * ```
 */
export async function transferSwell(
  params: TransferParams
): Promise<TransferResult> {
  const { sender, recipient, amount, priorityFee } = params;
  const connection = getConnection();

  // -------------------------------------------------------------------------
  // Step 1: Validate inputs
  // -------------------------------------------------------------------------

  // Validate amount
  if (amount <= 0 || !Number.isFinite(amount)) {
    throw new SwellTransferError(
      'Transfer amount must be a positive number',
      SwellErrorCode.INVALID_AMOUNT
    );
  }

  // Validate recipient
  try {
    // This will throw if the recipient is not a valid public key
    recipient.toBase58();
  } catch {
    throw new SwellTransferError(
      'Invalid recipient address',
      SwellErrorCode.INVALID_RECIPIENT
    );
  }

  // Prevent self-transfer
  if (sender.publicKey.equals(recipient)) {
    throw new SwellTransferError(
      'Cannot transfer to yourself',
      SwellErrorCode.INVALID_RECIPIENT
    );
  }

  // -------------------------------------------------------------------------
  // Step 2: Check sender's balance
  // -------------------------------------------------------------------------

  const senderBalance = await getSwellBalance(sender.publicKey);

  if (!senderBalance.accountExists) {
    throw new SwellTransferError(
      'Sender does not have a SWELL token account',
      SwellErrorCode.INSUFFICIENT_BALANCE
    );
  }

  if (senderBalance.amount < amount) {
    throw new SwellTransferError(
      `Insufficient SWELL balance. Have: ${senderBalance.amount}, Need: ${amount}`,
      SwellErrorCode.INSUFFICIENT_BALANCE
    );
  }

  // -------------------------------------------------------------------------
  // Step 3: Get token account addresses
  // -------------------------------------------------------------------------

  const senderAta = await getSwellTokenAccountAddress(sender.publicKey);
  const recipientAta = await getSwellTokenAccountAddress(recipient);

  // Check if recipient account exists
  const recipientAccountExists = await doesSwellAccountExist(recipient);

  // -------------------------------------------------------------------------
  // Step 4: Build the transaction
  // -------------------------------------------------------------------------

  const { blockhash, lastValidBlockHeight } = await getLatestBlockhash();

  const transaction = new Transaction();

  // Add compute budget instructions for priority fee
  const priorityFeeAmount = priorityFee ?? DEFAULT_PRIORITY_FEE_MICROLAMPORTS;

  if (priorityFeeAmount > 0) {
    // Set compute unit limit
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: DEFAULT_COMPUTE_UNITS,
      })
    );

    // Set priority fee
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFeeAmount,
      })
    );
  }

  // If recipient doesn't have a token account, create one
  if (!recipientAccountExists) {
    const createAtaInstruction = await createSwellAccountInstruction(
      sender.publicKey, // Sender pays for recipient's account creation
      recipient
    );
    transaction.add(createAtaInstruction);
  }

  // Convert amount to raw token units (with decimals)
  const rawAmount = BigInt(Math.floor(amount * Math.pow(10, SWELL_DECIMALS)));

  // Add the transfer instruction
  const transferInstruction = createTransferInstruction(
    senderAta, // Source token account
    recipientAta, // Destination token account
    sender.publicKey, // Owner of source account
    rawAmount, // Amount in raw units
    [], // No multisig
    TOKEN_PROGRAM_ID
  );

  transaction.add(transferInstruction);

  // Set transaction metadata
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = sender.publicKey;

  // -------------------------------------------------------------------------
  // Step 5: Sign the transaction
  // -------------------------------------------------------------------------

  let signedTx: Transaction;

  try {
    signedTx = await sender.signTransaction(transaction);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message.toLowerCase() : '';

    if (
      errorMessage.includes('rejected') ||
      errorMessage.includes('cancelled') ||
      errorMessage.includes('denied')
    ) {
      throw new SwellTransferError(
        'User rejected the transaction',
        SwellErrorCode.USER_REJECTED,
        error instanceof Error ? error : undefined
      );
    }

    throw new SwellTransferError(
      `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      SwellErrorCode.UNKNOWN,
      error instanceof Error ? error : undefined
    );
  }

  // -------------------------------------------------------------------------
  // Step 6: Send and confirm the transaction
  // -------------------------------------------------------------------------

  try {
    // Send the transaction
    const signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false, // Run preflight checks
      preflightCommitment: 'confirmed',
    });

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed'
    );

    // Check for errors in confirmation
    if (confirmation.value.err) {
      throw new SwellTransferError(
        `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
        SwellErrorCode.CONFIRMATION_FAILED
      );
    }

    // Get transaction details for block time
    const txDetails = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    return {
      signature,
      slot: confirmation.context.slot,
      blockTime: txDetails?.blockTime ?? null,
      explorerUrl: getExplorerTxUrl(signature),
    };
  } catch (error) {
    // Already a SwellTransferError, rethrow
    if (error instanceof SwellTransferError) {
      throw error;
    }

    const errorMessage =
      error instanceof Error ? error.message.toLowerCase() : '';

    // Check for common error conditions
    if (errorMessage.includes('insufficient funds')) {
      throw new SwellTransferError(
        'Insufficient SOL for transaction fees',
        SwellErrorCode.INSUFFICIENT_SOL,
        error instanceof Error ? error : undefined
      );
    }

    if (
      errorMessage.includes('blockhash not found') ||
      errorMessage.includes('expired')
    ) {
      throw new SwellTransferError(
        'Transaction expired. Please try again.',
        SwellErrorCode.CONFIRMATION_FAILED,
        error instanceof Error ? error : undefined
      );
    }

    throw new SwellTransferError(
      `Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      SwellErrorCode.NETWORK_ERROR,
      error instanceof Error ? error : undefined
    );
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validate that an amount is a valid transfer amount.
 *
 * @param amount - Amount to validate
 * @returns True if valid, false otherwise
 */
export function isValidTransferAmount(amount: number): boolean {
  return (
    typeof amount === 'number' &&
    Number.isFinite(amount) &&
    amount > 0 &&
    // Check it doesn't have more decimals than the token supports
    Math.floor(amount * Math.pow(10, SWELL_DECIMALS)) ===
      amount * Math.pow(10, SWELL_DECIMALS)
  );
}

/**
 * Format a raw token amount to human-readable string.
 *
 * @param rawAmount - Raw token amount (bigint or number)
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted string (e.g., "135.50")
 */
export function formatSwellAmount(
  rawAmount: bigint | number,
  decimals: number = 2
): string {
  const amount =
    typeof rawAmount === 'bigint'
      ? Number(rawAmount) / Math.pow(10, SWELL_DECIMALS)
      : rawAmount / Math.pow(10, SWELL_DECIMALS);

  return amount.toFixed(decimals);
}

/**
 * Convert human-readable amount to raw token units.
 *
 * @param amount - Human-readable amount (e.g., 10.5)
 * @returns Raw amount as bigint
 */
export function toRawAmount(amount: number): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, SWELL_DECIMALS)));
}

/**
 * Convert raw token units to human-readable amount.
 *
 * @param rawAmount - Raw amount as bigint
 * @returns Human-readable amount (e.g., 10.5)
 */
export function fromRawAmount(rawAmount: bigint): number {
  return Number(rawAmount) / Math.pow(10, SWELL_DECIMALS);
}
