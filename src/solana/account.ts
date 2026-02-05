/**
 * SWELL Associated Token Account (ATA) Operations
 *
 * Resolve or create SWELL token accounts for wallets. Handles ATA derivation,
 * existence checks, and creation with simulation before send.
 *
 * This module is wallet-agnostic and contains no UI dependencies.
 */

import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

import { getConnection, getLatestBlockhash } from './connection';
import { SWELL_MINT } from './config';
import type { WalletSigner, TokenAccountResult } from './types';
import { SwellTransferError, SwellErrorCode } from './errors';

// =============================================================================
// ATA ADDRESS & EXISTENCE
// =============================================================================

/**
 * Get the associated token account (ATA) address for a wallet and SWELL mint.
 *
 * This derives the deterministic ATA address. The account may or may not exist on-chain.
 *
 * @param walletAddress - The wallet's public key
 * @returns The associated token account address
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
 * Check if a wallet's SWELL token account exists on-chain.
 *
 * @param walletAddress - The wallet's public key
 * @returns True if the token account exists, false otherwise
 */
export async function doesSwellAccountExist(
  walletAddress: PublicKey
): Promise<boolean> {
  const connection = getConnection();
  const ata = await getSwellTokenAccountAddress(walletAddress);

  try {
    await getAccount(connection, ata, 'confirmed', TOKEN_PROGRAM_ID);
    return true;
  } catch (error) {
    if (error instanceof TokenAccountNotFoundError) {
      return false;
    }
    throw error;
  }
}

// =============================================================================
// CREATE ATA INSTRUCTION
// =============================================================================

/**
 * Create instruction to initialize a SWELL associated token account.
 *
 * The payer pays rent (~0.002 SOL). Use this when building a transfer tx
 * that may need to create the recipient's ATA.
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
    payer,
    ata,
    owner,
    SWELL_MINT,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

// =============================================================================
// RESOLVE OR CREATE ATA (WITH SIMULATION)
// =============================================================================

/**
 * Resolve or create a SWELL token account for a wallet.
 *
 * If the account exists, returns its address. If not, builds a create-ATA
 * transaction, simulates it, then signs and sends only if simulation succeeds.
 *
 * @param signer - Wallet that will sign and pay for creation if needed
 * @param targetWallet - Wallet that will own the token account
 * @returns Token account result (address, existed, createSignature if created)
 */
export async function resolveOrCreateSwellAccount(
  signer: WalletSigner,
  targetWallet: PublicKey
): Promise<TokenAccountResult> {
  const connection = getConnection();
  const ata = await getSwellTokenAccountAddress(targetWallet);

  try {
    await getAccount(connection, ata, 'confirmed', TOKEN_PROGRAM_ID);
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

  // Account doesn't exist: build, simulate, then sign and send
  try {
    const { blockhash, lastValidBlockHeight } = await getLatestBlockhash();

    const createInstruction = await createSwellAccountInstruction(
      signer.publicKey,
      targetWallet
    );

    const transaction = new Transaction();
    transaction.add(createInstruction);
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = signer.publicKey;

    // Simulate before sending
    const simulation = await connection.simulateTransaction(transaction);
    if (simulation.value.err) {
      throw new SwellTransferError(
        `ATA creation simulation failed: ${JSON.stringify(simulation.value.err)}`,
        SwellErrorCode.SIMULATION_FAILED
      );
    }

    const signedTx = await signer.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTx.serialize());

    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'confirmed'
    );

    return {
      address: ata,
      existed: false,
      createSignature: signature,
    };
  } catch (error) {
    if (error instanceof SwellTransferError) {
      throw error;
    }

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
