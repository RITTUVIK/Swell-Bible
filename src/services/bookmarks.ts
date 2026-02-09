import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = 'swell_bible_bookmarks';

export interface Bookmark {
  verseId: string;     // e.g. "JHN.3.16"
  bookId: string;
  chapterId: string;
  reference: string;   // e.g. "John 3:16"
  content: string;     // verse text
  timestamp: number;
}

export async function getBookmarks(): Promise<Bookmark[]> {
  try {
    const raw = await AsyncStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Bookmark[];
  } catch {
    return [];
  }
}

export async function addBookmark(bookmark: Bookmark): Promise<void> {
  const bookmarks = await getBookmarks();
  // Don't add duplicates
  if (bookmarks.some((b) => b.verseId === bookmark.verseId)) return;
  bookmarks.unshift(bookmark);
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

export async function removeBookmark(verseId: string): Promise<void> {
  const bookmarks = await getBookmarks();
  const filtered = bookmarks.filter((b) => b.verseId !== verseId);
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
}

export async function isBookmarked(verseId: string): Promise<boolean> {
  const bookmarks = await getBookmarks();
  return bookmarks.some((b) => b.verseId === verseId);
}
