import { Linking } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const PHANTOM_CONNECT_URL = 'https://phantom.app/ul/v1/connect';
const APP_URL = 'https://swellbible.app';

// Ephemeral keypair for dApp encryption (regenerated each session)
let dappKeyPair: nacl.BoxKeyPair | null = null;

function getDappKeyPair(): nacl.BoxKeyPair {
  if (!dappKeyPair) {
    dappKeyPair = nacl.box.keyPair();
  }
  return dappKeyPair;
}

/**
 * Check if Phantom wallet is installed on the device.
 */
export async function isPhantomInstalled(): Promise<boolean> {
  try {
    return await Linking.canOpenURL('phantom://');
  } catch {
    return false;
  }
}

/**
 * Open Phantom to request a wallet connection.
 * Returns the redirect URL that Phantom will call back to.
 */
export async function connectPhantom(): Promise<void> {
  const keyPair = getDappKeyPair();
  const redirectLink = ExpoLinking.createURL('phantom-connect');

  const params = new URLSearchParams({
    app_url: APP_URL,
    dapp_encryption_public_key: bs58.encode(keyPair.publicKey),
    cluster: 'mainnet-beta',
    redirect_link: redirectLink,
  });

  const url = `${PHANTOM_CONNECT_URL}?${params.toString()}`;

  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    // Phantom not installed — open install page
    await Linking.openURL('https://phantom.app/download');
    return;
  }

  await Linking.openURL(url);
}

/**
 * Parse the Phantom connect response from a deep link URL.
 * Returns the connected wallet's public key as a base58 string, or null if invalid.
 */
export function parsePhantomConnectResponse(url: string): string | null {
  try {
    const parsed = ExpoLinking.parse(url);
    const params = parsed.queryParams;

    if (!params) return null;

    const phantomEncryptionPublicKey = params.phantom_encryption_public_key as string;
    const nonce = params.nonce as string;
    const data = params.data as string;

    if (!phantomEncryptionPublicKey || !nonce || !data) return null;

    const keyPair = getDappKeyPair();
    const sharedSecret = nacl.box.before(
      bs58.decode(phantomEncryptionPublicKey),
      keyPair.secretKey
    );

    const decrypted = nacl.box.open.after(
      bs58.decode(data),
      bs58.decode(nonce),
      sharedSecret
    );

    if (!decrypted) return null;

    const decoded = JSON.parse(new TextDecoder().decode(decrypted));
    return decoded.public_key || null;
  } catch {
    return null;
  }
}

/**
 * Open Phantom app store page for installation.
 */
export async function openPhantomInstallPage(): Promise<void> {
  await Linking.openURL('https://phantom.app/download');
}
