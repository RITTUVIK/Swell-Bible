import AsyncStorage from '@react-native-async-storage/async-storage';

const READING_POSITION_KEY = 'swell_bible_reading_position';

export interface ReadingPosition {
  bookId: string;
  chapter: number;
  timestamp: number;
}

export async function saveReadingPosition(bookId: string, chapter: number): Promise<void> {
  try {
    const position: ReadingPosition = { bookId, chapter, timestamp: Date.now() };
    await AsyncStorage.setItem(READING_POSITION_KEY, JSON.stringify(position));
  } catch {
    // Silently fail - not critical
  }
}

export async function getReadingPosition(): Promise<ReadingPosition | null> {
  try {
    const raw = await AsyncStorage.getItem(READING_POSITION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ReadingPosition;
  } catch {
    return null;
  }
}
