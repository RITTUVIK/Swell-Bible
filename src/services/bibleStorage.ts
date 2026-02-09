import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CachedChapter, ChapterContent, Verse } from '../types/bible';

const CACHE_PREFIX = 'swell_bible_cache_';
const CACHE_INDEX_KEY = 'swell_bible_cache_index';
const MAX_CACHED_CHAPTERS = 100;

class BibleStorageService {
  async cacheChapter(chapter: ChapterContent, verses: Verse[]): Promise<void> {
    try {
      const cached: CachedChapter = {
        chapterId: chapter.id,
        bookId: chapter.bookId,
        chapterNumber: chapter.number,
        content: chapter.content,
        verses,
        cachedAt: Date.now(),
        bibleId: chapter.bibleId,
      };

      await AsyncStorage.setItem(
        CACHE_PREFIX + chapter.id,
        JSON.stringify(cached)
      );

      // Update index
      const index = await this.getCacheIndex();
      if (!index.includes(chapter.id)) {
        index.push(chapter.id);
        // Trim old entries if over limit
        while (index.length > MAX_CACHED_CHAPTERS) {
          const oldest = index.shift()!;
          await AsyncStorage.removeItem(CACHE_PREFIX + oldest);
        }
        await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
      }
    } catch {
      // Silently fail - caching is not critical
    }
  }

  async getCachedChapter(chapterId: string): Promise<CachedChapter | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + chapterId);
      if (!raw) return null;
      return JSON.parse(raw) as CachedChapter;
    } catch {
      return null;
    }
  }

  async isChapterCached(chapterId: string): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + chapterId);
      return raw !== null;
    } catch {
      return false;
    }
  }

  async clearOldCache(keepLastNDays: number = 30): Promise<void> {
    try {
      const index = await this.getCacheIndex();
      const cutoff = Date.now() - keepLastNDays * 86400000;
      const remaining: string[] = [];

      for (const id of index) {
        const raw = await AsyncStorage.getItem(CACHE_PREFIX + id);
        if (raw) {
          const cached = JSON.parse(raw) as CachedChapter;
          if (cached.cachedAt > cutoff) {
            remaining.push(id);
          } else {
            await AsyncStorage.removeItem(CACHE_PREFIX + id);
          }
        }
      }

      await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(remaining));
    } catch {
      // Silently fail
    }
  }

  async getCacheSize(): Promise<number> {
    const index = await this.getCacheIndex();
    return index.length;
  }

  async clearAllCache(): Promise<void> {
    try {
      const index = await this.getCacheIndex();
      for (const id of index) {
        await AsyncStorage.removeItem(CACHE_PREFIX + id);
      }
      await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify([]));
    } catch {
      // Silently fail
    }
  }

  private async getCacheIndex(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }
}

export const bibleStorage = new BibleStorageService();
export default BibleStorageService;
