/**
 * Solana Connection Module
 *
 * Provides a singleton Connection instance for interacting with Solana.
 * All RPC calls go through this connection.
 *
 * This module is wallet-agnostic and contains no UI dependencies.
 */

import { Connection, ConnectionConfig } from '@solana/web3.js';
import {
  SOLANA_RPC_ENDPOINT,
  SOLANA_COMMITMENT,
  TX_CONFIRMATION_TIMEOUT_MS,
} from './config';

// =============================================================================
// CONNECTION CONFIGURATION
// =============================================================================

/**
 * Configuration options for the Solana connection.
 */
const connectionConfig: ConnectionConfig = {
  commitment: SOLANA_COMMITMENT,
  confirmTransactionInitialTimeout: TX_CONFIRMATION_TIMEOUT_MS,
};

// =============================================================================
// SINGLETON CONNECTION
// =============================================================================

/**
 * Singleton Connection instance.
 * Reused across all modules to avoid creating multiple connections.
 */
let _connection: Connection | null = null;

/**
 * Get the Solana connection instance.
 *
 * Returns a singleton Connection configured for mainnet.
 * The connection is lazily initialized on first call.
 *
 * @returns Solana Connection instance
 *
 * @example
 * ```typescript
 * import { getConnection } from './solana/connection';
 *
 * const connection = getConnection();
 * const slot = await connection.getSlot();
 * ```
 */
export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(SOLANA_RPC_ENDPOINT, connectionConfig);
  }
  return _connection;
}

/**
 * Create a new Connection instance with custom configuration.
 *
 * Use this when you need a connection with different settings
 * (e.g., different commitment level or RPC endpoint).
 *
 * @param endpoint - Optional custom RPC endpoint
 * @param config - Optional custom connection configuration
 * @returns New Connection instance
 *
 * @example
 * ```typescript
 * import { createConnection } from './solana/connection';
 *
 * const customConnection = createConnection(
 *   'https://my-rpc-provider.com',
 *   { commitment: 'finalized' }
 * );
 * ```
 */
export function createConnection(
  endpoint: string = SOLANA_RPC_ENDPOINT,
  config: ConnectionConfig = connectionConfig
): Connection {
  return new Connection(endpoint, config);
}

/**
 * Reset the singleton connection.
 *
 * Useful for testing or when switching RPC endpoints at runtime.
 * The next call to getConnection() will create a new instance.
 */
export function resetConnection(): void {
  _connection = null;
}

/**
 * Check if the connection is healthy by making a simple RPC call.
 *
 * @returns True if the connection is working, false otherwise
 *
 * @example
 * ```typescript
 * import { isConnectionHealthy } from './solana/connection';
 *
 * if (await isConnectionHealthy()) {
 *   console.log('Solana RPC is reachable');
 * }
 * ```
 */
export async function isConnectionHealthy(): Promise<boolean> {
  try {
    const connection = getConnection();
    await connection.getSlot();
    return true;
  } catch (error) {
    console.error('Solana connection health check failed:', error);
    return false;
  }
}

/**
 * Get the current slot number from the Solana network.
 *
 * @returns Current slot number
 * @throws Error if the RPC call fails
 */
export async function getCurrentSlot(): Promise<number> {
  const connection = getConnection();
  return connection.getSlot();
}

/**
 * Get the current blockhash for transaction building.
 *
 * @returns Object containing blockhash and lastValidBlockHeight
 * @throws Error if the RPC call fails
 */
export async function getLatestBlockhash(): Promise<{
  blockhash: string;
  lastValidBlockHeight: number;
}> {
  const connection = getConnection();
  return connection.getLatestBlockhash(SOLANA_COMMITMENT);
}
