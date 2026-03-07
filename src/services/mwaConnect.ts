import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import type { WalletSigner } from '../solana/types';

const APP_IDENTITY = {
  name: 'Swell Bible',
  uri: 'https://swellbible.app',
};

let cachedAuthToken: string | null = null;
let cachedBase64Address: string | null = null;

function getMwaModule() {
  // Dynamic require — this package only works on Android
  return require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
}

/**
 * Decode a base64-encoded public key to a base58 Solana address.
 */
function base64AddressToBase58(base64Addr: string): string {
  const bytes = Buffer.from(base64Addr, 'base64');
  return new PublicKey(bytes).toBase58();
}

/**
 * Authorize or reauthorize within a transact session.
 * Returns the base64-encoded account address from the auth result.
 */
async function authorizeSession(wallet: any): Promise<string> {
  if (cachedAuthToken) {
    try {
      const reauth = await wallet.reauthorize({
        identity: APP_IDENTITY,
        auth_token: cachedAuthToken,
      });
      cachedAuthToken = reauth.auth_token;
      cachedBase64Address = reauth.accounts[0].address;
      return reauth.accounts[0].address;
    } catch {
      // Token expired — fall through to fresh authorize
    }
  }

  const auth = await wallet.authorize({
    identity: APP_IDENTITY,
    cluster: 'mainnet-beta',
  });
  cachedAuthToken = auth.auth_token;
  cachedBase64Address = auth.accounts[0].address;
  return auth.accounts[0].address;
}

/**
 * Connect via Mobile Wallet Adapter (Android only).
 * Opens the user's installed wallet app for authorization.
 * Returns the authorized public key as a base58 string.
 */
export async function connectMwa(): Promise<string> {
  const { transact } = getMwaModule();

  const base64Addr: string = await transact(async (wallet: any) => {
    return await authorizeSession(wallet);
  });

  return base64AddressToBase58(base64Addr);
}

/**
 * Sign an arbitrary message via MWA.
 * Opens a transact session, reauthorizes, and signs the message bytes.
 * Returns the detached ed25519 signature as a base64 string.
 */
export async function signMessageMwa(message: string): Promise<string> {
  const { transact } = getMwaModule();

  const signatureBytes: Uint8Array = await transact(async (wallet: any) => {
    const accountAddr = await authorizeSession(wallet);

    const messageBytes = new TextEncoder().encode(message);
    // The web3js wrapper accepts Uint8Array payloads and returns Uint8Array[]
    const signedPayloads: Uint8Array[] = await wallet.signMessages({
      addresses: [accountAddr],
      payloads: [messageBytes],
    });

    // signMessages returns NaCl signed messages (64-byte signature + original message).
    // Extract the first 64 bytes as the detached signature.
    return signedPayloads[0].slice(0, 64);
  });

  return Buffer.from(signatureBytes).toString('base64');
}

/**
 * Returns a WalletSigner that wraps each signTransaction in a transact() session.
 * MWA sessions are ephemeral — this is the standard pattern.
 */
export function getMwaSigner(pubkeyBase58: string): WalletSigner {
  const publicKey = new PublicKey(pubkeyBase58);
  const { transact } = getMwaModule();

  return {
    publicKey,
    signTransaction: async <T extends Transaction | VersionedTransaction>(
      transaction: T
    ): Promise<T> => {
      const signed = await transact(async (wallet: any) => {
        await authorizeSession(wallet);

        const signedTxs = await wallet.signTransactions({
          transactions: [transaction],
        });
        return signedTxs[0];
      });

      return signed as T;
    },
  };
}

/**
 * Clear cached MWA auth token (disconnect).
 */
export function disconnectMwa(): void {
  cachedAuthToken = null;
  cachedBase64Address = null;
}
