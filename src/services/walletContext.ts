import AsyncStorage from '@react-native-async-storage/async-storage';

const WALLET_KEY = 'swell_bible_wallet';

export interface WalletState {
  address: string | null;
  connected: boolean;
}

export async function getSavedWallet(): Promise<WalletState> {
  try {
    const raw = await AsyncStorage.getItem(WALLET_KEY);
    if (!raw) return { address: null, connected: false };
    return JSON.parse(raw) as WalletState;
  } catch {
    return { address: null, connected: false };
  }
}

export async function saveWallet(address: string): Promise<void> {
  await AsyncStorage.setItem(
    WALLET_KEY,
    JSON.stringify({ address, connected: true })
  );
}

export async function disconnectWallet(): Promise<void> {
  await AsyncStorage.removeItem(WALLET_KEY);
}
