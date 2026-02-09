import { BIBLE_API_CONFIG, getApiHeaders } from '../config/api';
import type {
  Bible,
  Book,
  Chapter,
  ChapterContent,
  Verse,
} from '../types/bible';

/**
 * Bible API Service
 * Handles all interactions with the api.bible API
 * 
 * API Documentation: https://docs.api.bible/
 */

class BibleApiService {
  private baseUrl: string;
  private defaultBibleId: string;

  constructor() {
    this.baseUrl = BIBLE_API_CONFIG.BASE_URL;
    this.defaultBibleId = BIBLE_API_CONFIG.DEFAULT_BIBLE_ID;
  }

  /**
   * Get list of available Bibles
   */
  async getBibles(): Promise<Bible[]> {
    try {
      const response = await fetch(`${this.baseUrl}/bibles`, {
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Bibles: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching Bibles:', error);
      throw error;
    }
  }

  /**
   * Get all books in a Bible
   */
  async getBooks(bibleId?: string): Promise<Book[]> {
    const id = bibleId || this.defaultBibleId;
    
    try {
      const response = await fetch(`${this.baseUrl}/bibles/${id}/books`, {
        headers: getApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  }

  /**
   * Get all chapters in a specific book
   */
  async getChapters(bookId: string, bibleId?: string): Promise<Chapter[]> {
    const id = bibleId || this.defaultBibleId;
    
    try {
      const response = await fetch(
        `${this.baseUrl}/bibles/${id}/books/${bookId}/chapters`,
        {
          headers: getApiHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch chapters: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching chapters:', error);
      throw error;
    }
  }

  /**
   * Get full chapter content with all verses
   * This is the main function you'll use to display Bible text
   */
  async getChapter(
    chapterId: string,
    bibleId?: string,
    includeVerseNumbers: boolean = true
  ): Promise<ChapterContent> {
    const id = bibleId || this.defaultBibleId;
    
    try {
      const params = new URLSearchParams({
        'content-type': 'text',
        'include-notes': 'false',
        'include-titles': 'true',
        'include-chapter-numbers': 'true',
        'include-verse-numbers': includeVerseNumbers.toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/bibles/${id}/chapters/${chapterId}?${params.toString()}`,
        {
          headers: getApiHeaders(),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Chapter API error ${response.status}: ${errorBody}`);
        throw new Error(`Failed to fetch chapter (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching chapter:', error);
      throw error;
    }
  }

  /**
   * Get a specific verse by reference
   * Example: getVerse('GEN.1.1') returns Genesis 1:1
   */
  async getVerse(verseId: string, bibleId?: string): Promise<Verse> {
    const id = bibleId || this.defaultBibleId;

    try {
      const params = new URLSearchParams({
        'content-type': 'text',
        'include-notes': 'false',
        'include-titles': 'false',
        'include-chapter-numbers': 'false',
        'include-verse-numbers': 'false',
      });

      const response = await fetch(
        `${this.baseUrl}/bibles/${id}/verses/${verseId}?${params.toString()}`,
        {
          headers: getApiHeaders(),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Verse API error ${response.status}: ${errorBody}`);
        throw new Error(`Failed to fetch verse (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching verse:', error);
      throw error;
    }
  }

  /**
   * Parse chapter content into individual verses
   * The API returns chapter content as HTML, this parses it into verse objects
   */
  parseChapterIntoVerses(chapterContent: ChapterContent): Verse[] {
    const verses: Verse[] = [];
    const content = chapterContent.content;

    // Try HTML parsing first (if API returned HTML despite text request)
    const htmlRegex = /<span data-number="(\d+)"[^>]*>(.*?)<\/span>/gs;
    let match;

    while ((match = htmlRegex.exec(content)) !== null) {
      const verseNum = parseInt(match[1], 10);
      const verseText = match[2]
        .replace(/<[^>]+>/g, '')
        .trim();

      if (verseText) {
        verses.push({
          id: `${chapterContent.bookId}.${chapterContent.number}.${verseNum}`,
          bibleId: chapterContent.bibleId,
          bookId: chapterContent.bookId,
          chapterId: chapterContent.id,
          reference: `${chapterContent.bookId} ${chapterContent.number}:${verseNum}`,
          content: verseText,
        });
      }
    }

    if (verses.length > 0) return verses;

    // Plain text format: verse numbers appear as [1] or just standalone numbers
    // Try splitting by [number] pattern first
    const bracketParts = content.split(/\[(\d+)\]/);
    if (bracketParts.length > 2) {
      for (let i = 1; i < bracketParts.length; i += 2) {
        const verseNum = parseInt(bracketParts[i], 10);
        const verseText = (bracketParts[i + 1] || '')
          .replace(/<[^>]+>/g, '')
          .trim();
        if (verseText) {
          verses.push({
            id: `${chapterContent.bookId}.${chapterContent.number}.${verseNum}`,
            bibleId: chapterContent.bibleId,
            bookId: chapterContent.bookId,
            chapterId: chapterContent.id,
            reference: `${chapterContent.bookId} ${chapterContent.number}:${verseNum}`,
            content: verseText,
          });
        }
      }
      if (verses.length > 0) return verses;
    }

    // Fallback: split on standalone verse numbers (newline or space then number)
    const cleanContent = content.replace(/<[^>]+>/g, '').trim();
    // Match patterns like "\n1 " or beginning "1 "
    const textParts = cleanContent.split(/(?:^|\n)\s*(\d+)\s+/);
    if (textParts.length > 2) {
      for (let i = 1; i < textParts.length; i += 2) {
        const verseNum = parseInt(textParts[i], 10);
        const verseText = (textParts[i + 1] || '').replace(/\n/g, ' ').trim();
        if (verseText) {
          verses.push({
            id: `${chapterContent.bookId}.${chapterContent.number}.${verseNum}`,
            bibleId: chapterContent.bibleId,
            bookId: chapterContent.bookId,
            chapterId: chapterContent.id,
            reference: `${chapterContent.bookId} ${chapterContent.number}:${verseNum}`,
            content: verseText,
          });
        }
      }
      if (verses.length > 0) return verses;
    }

    // Last resort: treat the whole content as one verse
    const wholeText = cleanContent.trim();
    if (wholeText) {
      verses.push({
        id: `${chapterContent.bookId}.${chapterContent.number}.1`,
        bibleId: chapterContent.bibleId,
        bookId: chapterContent.bookId,
        chapterId: chapterContent.id,
        reference: `${chapterContent.bookId} ${chapterContent.number}:1`,
        content: wholeText,
      });
    }

    return verses;
  }

  /**
   * Helper: Get chapter ID from book and chapter number
   * Example: getChapterId('GEN', '1') returns 'GEN.1'
   */
  getChapterId(bookId: string, chapterNumber: string): string {
    return `${bookId}.${chapterNumber}`;
  }

  /**
   * Helper: Get verse ID from book, chapter, and verse number
   * Example: getVerseId('GEN', '1', '1') returns 'GEN.1.1'
   */
  getVerseId(bookId: string, chapterNumber: string, verseNumber: string): string {
    return `${bookId}.${chapterNumber}.${verseNumber}`;
  }
}

// Export singleton instance
export const bibleApi = new BibleApiService();

// Export for testing/mocking
export default BibleApiService;
