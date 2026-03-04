import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'swell_bible_settings';

export interface AppSettings {
  fontSize: number;       // 16-28, default 19
  bibleVersionId: string;
  bibleVersionName: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 19,
  bibleVersionId: 'kjv-1611-local',
  bibleVersionName: 'KJV 1611',
};

export const BIBLE_VERSIONS = [
  { id: 'kjv-1611-local', name: 'KJV 1611', label: 'King James Version (1611)' },
];

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return { ...DEFAULT_SETTINGS, ...settings };
  }
}
