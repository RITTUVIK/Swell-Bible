import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'swell_bible_settings';

export interface AppSettings {
  fontSize: number;       // 16-28, default 19
  bibleVersionId: string; // api.bible ID
  bibleVersionName: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 19,
  bibleVersionId: 'de4e12af7f28f599-02',  // KJV
  bibleVersionName: 'KJV',
};

export const BIBLE_VERSIONS = [
  { id: 'de4e12af7f28f599-02', name: 'KJV', label: 'King James Version' },
  { id: '06125adad2d5898a-01', name: 'ESV', label: 'English Standard Version' },
  { id: '9879dbb7cfe39e4d-01', name: 'NIV', label: 'New International Version' },
  { id: 'f72b840c855f362c-04', name: 'NASB', label: 'New American Standard' },
  { id: '01b29f4b342acc35-01', name: 'ASV', label: 'American Standard Version' },
  { id: '7142879509583d59-04', name: 'WEB', label: 'World English Bible' },
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
