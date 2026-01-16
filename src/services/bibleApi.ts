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
        throw new Error(`Failed to fetch chapter: ${response.statusText}`);
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
      const response = await fetch(
        `${this.baseUrl}/bibles/${id}/verses/${verseId}`,
        {
          headers: getApiHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch verse: ${response.statusText}`);
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
    
    // The API returns content as HTML with verse numbers
    // We'll parse it to extract individual verses
    // This is a simplified parser - you may need to adjust based on actual API response format
    
    const content = chapterContent.content;
    const verseRegex = /<span data-number="(\d+)"[^>]*>(.*?)<\/span>/g;
    let match;
    let verseNumber = 1;

    while ((match = verseRegex.exec(content)) !== null) {
      const verseNum = parseInt(match[1], 10);
      const verseText = match[2]
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .trim();

      verses.push({
        id: `${chapterContent.bookId}.${chapterContent.number}.${verseNum}`,
        bibleId: chapterContent.bibleId,
        bookId: chapterContent.bookId,
        chapterId: chapterContent.id,
        reference: `${chapterContent.bookId} ${chapterContent.number}:${verseNum}`,
        content: verseText,
      });

      verseNumber = verseNum;
    }

    // If regex parsing fails, fallback to splitting by verse numbers
    if (verses.length === 0) {
      const lines = content.split(/\d+/).filter(line => line.trim());
      lines.forEach((line, index) => {
        verses.push({
          id: `${chapterContent.bookId}.${chapterContent.number}.${index + 1}`,
          bibleId: chapterContent.bibleId,
          bookId: chapterContent.bookId,
          chapterId: chapterContent.id,
          reference: `${chapterContent.bookId} ${chapterContent.number}:${index + 1}`,
          content: line.replace(/<[^>]+>/g, '').trim(),
        });
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
