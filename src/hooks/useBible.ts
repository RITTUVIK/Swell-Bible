import { useState, useCallback } from 'react';
import { bibleApi } from '../services/bibleApi';
import { bibleStorage } from '../services/bibleStorage';
import type { Book, Chapter, ChapterContent, Verse } from '../types/bible';

interface UseBibleOptions {
  bibleId?: string;
}

interface UseBibleReturn {
  books: Book[];
  loadingBooks: boolean;
  error: string | null;
  fetchBooks: () => Promise<void>;
  chapters: Chapter[];
  loadingChapters: boolean;
  fetchChapters: (bookId: string) => Promise<void>;
  chapterContent: ChapterContent | null;
  verses: Verse[];
  loadingChapter: boolean;
  fetchChapter: (chapterId: string) => Promise<void>;
  getChapterId: (bookId: string, chapterNumber: string) => string;
  clearError: () => void;
}

export const useBible = (options: UseBibleOptions = {}): UseBibleReturn => {
  const { bibleId } = options;

  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [chapterContent, setChapterContent] = useState<ChapterContent | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    setLoadingBooks(true);
    setError(null);
    try {
      const fetchedBooks = await bibleApi.getBooks(bibleId);
      setBooks(fetchedBooks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
    } finally {
      setLoadingBooks(false);
    }
  }, [bibleId]);

  const fetchChapters = useCallback(async (bookId: string) => {
    setLoadingChapters(true);
    setError(null);
    try {
      const fetchedChapters = await bibleApi.getChapters(bookId, bibleId);
      setChapters(fetchedChapters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chapters');
    } finally {
      setLoadingChapters(false);
    }
  }, [bibleId]);

  const fetchChapter = useCallback(async (chapterId: string) => {
    setLoadingChapter(true);
    setError(null);
    try {
      // Try cache first
      const cached = await bibleStorage.getCachedChapter(chapterId);
      if (cached && cached.bibleId === (bibleId || 'de4e12af7f28f599-02')) {
        setChapterContent({
          id: cached.chapterId,
          bibleId: cached.bibleId,
          bookId: cached.bookId,
          number: cached.chapterNumber,
          content: cached.content,
          reference: '',
          verseCount: cached.verses.length,
          copyright: '',
        });
        setVerses(cached.verses);
        setLoadingChapter(false);
        return;
      }

      // Fetch from API
      const content = await bibleApi.getChapter(chapterId, bibleId);
      const parsedVerses = bibleApi.parseChapterIntoVerses(content);

      setChapterContent(content);
      setVerses(parsedVerses);

      // Cache for offline use
      bibleStorage.cacheChapter(content, parsedVerses);
    } catch (err) {
      // On network error, try loading from cache
      const cached = await bibleStorage.getCachedChapter(chapterId);
      if (cached) {
        setChapterContent({
          id: cached.chapterId,
          bibleId: cached.bibleId,
          bookId: cached.bookId,
          number: cached.chapterNumber,
          content: cached.content,
          reference: '',
          verseCount: cached.verses.length,
          copyright: '',
        });
        setVerses(cached.verses);
        setError(null); // Clear error since we loaded from cache
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch chapter');
      }
    } finally {
      setLoadingChapter(false);
    }
  }, [bibleId]);

  const getChapterId = useCallback((bookId: string, chapterNumber: string): string => {
    return bibleApi.getChapterId(bookId, chapterNumber);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    books,
    loadingBooks,
    fetchBooks,
    chapters,
    loadingChapters,
    fetchChapters,
    chapterContent,
    verses,
    loadingChapter,
    fetchChapter,
    getChapterId,
    error,
    clearError,
  };
};
