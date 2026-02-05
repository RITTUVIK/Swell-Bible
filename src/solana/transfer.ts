/**
 * SWELL Transfer Operations
 *
 * Builds SPL transfer transactions, simulates them before sending,
 * and only submits if simulation succeeds. Wallet-agnostic.
 *
 * This module contains no UI dependencies.
 */

import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import { createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { getConnection, getLatestBlockhash } from './connection';
import {
  DEFAULT_PRIORITY_FEE_MICROLAMPORTS,
  DEFAULT_COMPUTE_UNITS,
  getExplorerTxUrl,
} from './config';
import { getSwellBalance } from './balance';
import {
  getSwellTokenAccountAddress,
  doesSwellAccountExist,
  createSwellAccountInstruction,
} from './account';
import { getSwellDecimals } from './mint';
import type { TransferParams, TransferResult, WalletSigner } from './types';
import { SwellTransferError, SwellErrorCode } from './errors';

// =============================================================================
// TRANSFER (BUILD -> SIMULATE -> SIGN -> SEND)
// =============================================================================

/**
 * Transfer SWELL tokens from one wallet to another.
 *
 * Flow:
 * 1. Validate inputs and check sender balance
 * 2. Build transfer transaction (create recipient ATA if needed)
 * 3. Simulate the transaction
 * 4. If simulation fails, throw SwellTransferError with SIMULATION_FAILED
 * 5. If simulation succeeds, sign and send, then confirm
 *
 * @param params - Transfer parameters (sender, recipient, amount, optional priorityFee)
 * @returns Transfer result (signature, slot, blockTime, explorerUrl)
 * @throws SwellTransferError with typed codes (INSUFFICIENT_BALANCE, SIMULATION_FAILED, etc.)
 */
export async function transferSwell(
  params: TransferParams
): Promise<TransferResult> {
  const { sender, recipient, amount, priorityFee } = params;
  const connection = getConnection();

  // -------------------------------------------------------------------------
  // Step 1: Validate inputs
  // -------------------------------------------------------------------------

  if (amount <= 0 || !Number.isFinite(amount)) {
    throw new SwellTransferError(
      'Transfer amount must be a positive number',
      SwellErrorCode.INVALID_AMOUNT
    );
  }

  try {
    recipient.toBase58();
  } catch {
    throw new SwellTransferError(
      'Invalid recipient address',
      SwellErrorCode.INVALID_RECIPIENT
    );
  }

  if (sender.publicKey.equals(recipient)) {
    throw new SwellTransferError(
      'Cannot transfer to yourself',
      SwellErrorCode.INVALID_RECIPIENT
    );
  }

  // -------------------------------------------------------------------------
  // Step 2: Check sender balance and get decimals
  // -------------------------------------------------------------------------

  const [senderBalance, decimals] = await Promise.all([
    getSwellBalance(sender.publicKey),
    getSwellDecimals(),
  ]);

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

  const senderAta = await getSwellTokenAccountAddress(sender.publicKey);
  const recipientAta = await getSwellTokenAccountAddress(recipient);
  const recipientAccountExists = await doesSwellAccountExist(recipient);

  const rawAmount = BigInt(
    Math.floor(amount * Math.pow(10, decimals))
  );

  // -------------------------------------------------------------------------
  // Step 3: Build transaction
  // -------------------------------------------------------------------------

  const { blockhash, lastValidBlockHeight } = await getLatestBlockhash();

  const transaction = new Transaction();
  const priorityFeeAmount = priorityFee ?? DEFAULT_PRIORITY_FEE_MICROLAMPORTS;

  if (priorityFeeAmount > 0) {
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: DEFAULT_COMPUTE_UNITS,
      })
    );
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFeeAmount,
      })
    );
  }

  if (!recipientAccountExists) {
    const createAtaInstruction = await createSwellAccountInstruction(
      sender.publicKey,
      recipient
    );
    transaction.add(createAtaInstruction);
  }

  const transferInstruction = createTransferInstruction(
    senderAta,
    recipientAta,
    sender.publicKey,
    rawAmount,
    [],
    TOKEN_PROGRAM_ID
  );
  transaction.add(transferInstruction);

  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = sender.publicKey;

  // -------------------------------------------------------------------------
  // Step 4: Simulate before sending
  // -------------------------------------------------------------------------

  const simulation = await connection.simulateTransaction(transaction);
  if (simulation.value.err) {
    const errMsg =
      typeof simulation.value.err === 'object'
        ? JSON.stringify(simulation.value.err)
        : String(simulation.value.err);
    throw new SwellTransferError(
      `Transaction simulation failed: ${errMsg}`,
      SwellErrorCode.SIMULATION_FAILED
    );
  }

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
  // Step 6: Send and confirm
  // -------------------------------------------------------------------------

  try {
    const signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    const confirmation = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'confirmed'
    );

    if (confirmation.value.err) {
      throw new SwellTransferError(
        `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
        SwellErrorCode.CONFIRMATION_FAILED
      );
    }

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
    if (error instanceof SwellTransferError) {
      throw error;
    }

    const errorMessage =
      error instanceof Error ? error.message.toLowerCase() : '';

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
