import { useState, useEffect, useCallback } from 'react';
import { bibleApi } from '../services/bibleApi';
import { bibleStorage } from '../services/bibleStorage';
import type { Book, Chapter, ChapterContent, Verse } from '../types/bible';

interface UseBibleOptions {
  bibleId?: string;
  enableCache?: boolean;
}

interface UseBibleReturn {
  // Books
  books: Book[];
  loadingBooks: boolean;
  error: string | null;
  fetchBooks: () => Promise<void>;
  
  // Chapters
  chapters: Chapter[];
  loadingChapters: boolean;
  fetchChapters: (bookId: string) => Promise<void>;
  
  // Chapter Content
  chapterContent: ChapterContent | null;
  verses: Verse[];
  loadingChapter: boolean;
  fetchChapter: (chapterId: string, bookId?: string) => Promise<void>;
  
  // Helpers
  getChapterId: (bookId: string, chapterNumber: string) => string;
  clearError: () => void;
}

/**
 * Custom hook for Bible API interactions
 * Provides easy access to Bible data with loading states and error handling
 * 
 * @example
 * const { fetchChapter, chapterContent, verses, loadingChapter } = useBible();
 * 
 * useEffect(() => {
 *   fetchChapter('GEN.1');
 * }, []);
 */
export const useBible = (options: UseBibleOptions = {}): UseBibleReturn => {
  const { bibleId, enableCache = true } = options;

  // Books state
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Chapters state
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  // Chapter content state
  const [chapterContent, setChapterContent] = useState<ChapterContent | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loadingChapter, setLoadingChapter] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all books in the Bible
   */
  const fetchBooks = useCallback(async () => {
    setLoadingBooks(true);
    setError(null);
    
    try {
      const fetchedBooks = await bibleApi.getBooks(bibleId);
      setBooks(fetchedBooks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch books';
      setError(errorMessage);
      console.error('Error fetching books:', err);
    } finally {
      setLoadingBooks(false);
    }
  }, [bibleId]);

  /**
   * Fetch all chapters in a book
   */
  const fetchChapters = useCallback(async (bookId: string) => {
    setLoadingChapters(true);
    setError(null);
    
    try {
      const fetchedChapters = await bibleApi.getChapters(bookId, bibleId);
      setChapters(fetchedChapters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chapters';
      setError(errorMessage);
      console.error('Error fetching chapters:', err);
    } finally {
      setLoadingChapters(false);
    }
  }, [bibleId]);

  /**
   * Fetch a specific chapter with all its verses
   * This is the main function you'll use in your screens
   */
  const fetchChapter = useCallback(async (chapterId: string, bookId?: string) => {
    setLoadingChapter(true);
    setError(null);
    
    try {
      // TODO: Check cache first if enableCache is true
      // const cached = await bibleStorage.getCachedChapter(chapterId);
      // if (cached) {
      //   setChapterContent({ ...cached, content: cached.content });
      //   setVerses(cached.verses);
      //   setLoadingChapter(false);
      //   return;
      // }

      // Fetch from API
      const content = await bibleApi.getChapter(chapterId, bibleId);
      const parsedVerses = bibleApi.parseChapterIntoVerses(content);

      setChapterContent(content);
      setVerses(parsedVerses);

      // TODO: Cache the chapter if enableCache is true
      // if (enableCache) {
      //   await bibleStorage.cacheChapter(content, parsedVerses);
      // }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chapter';
      setError(errorMessage);
      console.error('Error fetching chapter:', err);
      
      // TODO: Try to load from cache on error
      // const cached = await bibleStorage.getCachedChapter(chapterId);
      // if (cached) {
      //   setChapterContent({ ...cached, content: cached.content });
      //   setVerses(cached.verses);
      // }
    } finally {
      setLoadingChapter(false);
    }
  }, [bibleId, enableCache]);

  /**
   * Helper function to generate chapter ID
   */
  const getChapterId = useCallback((bookId: string, chapterNumber: string): string => {
    return bibleApi.getChapterId(bookId, chapterNumber);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Books
    books,
    loadingBooks,
    fetchBooks,
    
    // Chapters
    chapters,
    loadingChapters,
    fetchChapters,
    
    // Chapter Content
    chapterContent,
    verses,
    loadingChapter,
    fetchChapter,
    
    // Helpers
    getChapterId,
    error,
    clearError,
  };
};
