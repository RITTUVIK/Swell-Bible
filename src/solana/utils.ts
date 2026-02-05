/**
 * SWELL Amount Utilities
 *
 * Conversion and validation helpers using chain-derived decimals.
 * All functions that need decimals call getSwellDecimals() (cached).
 *
 * This module contains no UI dependencies.
 */

import { getSwellDecimals } from './mint';

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate that an amount is a valid transfer amount (positive, finite,
 * and within token decimal precision).
 *
 * @param amount - Amount to validate
 * @returns True if valid, false otherwise
 */
export async function isValidTransferAmount(amount: number): Promise<boolean> {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return false;
  }
  const decimals = await getSwellDecimals();
  const factor = Math.pow(10, decimals);
  return Math.floor(amount * factor) === amount * factor;
}

// =============================================================================
// CONVERSION (ASYNC - USE CACHED DECIMALS)
// =============================================================================

/**
 * Format a raw token amount to human-readable string.
 *
 * @param rawAmount - Raw token amount (bigint or number)
 * @param displayDecimals - Number of decimal places to show (default: 2)
 * @returns Formatted string (e.g. "135.50")
 */
export async function formatSwellAmount(
  rawAmount: bigint | number,
  displayDecimals: number = 2
): Promise<string> {
  const decimals = await getSwellDecimals();
  const amount =
    typeof rawAmount === 'bigint'
      ? Number(rawAmount) / Math.pow(10, decimals)
      : rawAmount / Math.pow(10, decimals);
  return amount.toFixed(displayDecimals);
}

/**
 * Convert human-readable amount to raw token units.
 *
 * @param amount - Human-readable amount (e.g. 10.5)
 * @returns Raw amount as bigint
 */
export async function toRawAmount(amount: number): Promise<bigint> {
  const decimals = await getSwellDecimals();
  return BigInt(Math.floor(amount * Math.pow(10, decimals)));
}

/**
 * Convert raw token units to human-readable amount.
 *
 * @param rawAmount - Raw amount as bigint
 * @returns Human-readable amount (e.g. 10.5)
 */
export async function fromRawAmount(rawAmount: bigint): Promise<number> {
  const decimals = await getSwellDecimals();
  return Number(rawAmount) / Math.pow(10, decimals);
}
