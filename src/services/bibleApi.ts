/**
 * Bible Service — Local KJV Data
 *
 * Reads Bible data from bundled JSON files (data/bible/Bible-kjv-1611/).
 * Returns the same types the old API service returned so all screens work unchanged.
 */

import type {
  Book,
  Chapter,
  ChapterContent,
  Verse,
} from '../types/bible';
import { BIBLE_BOOKS, getBookById } from '../constants/bibleBooks';

// ---------------------------------------------------------------------------
// JSON shapes (matches the local files)
// ---------------------------------------------------------------------------

interface JsonVerse {
  verse: number;
  text: string;
}

interface JsonChapter {
  chapter: number;
  verses: JsonVerse[];
}

interface JsonBook {
  book: string;
  'chapter-count': string;
  chapters: JsonChapter[];
}

// ---------------------------------------------------------------------------
// ID ↔ filename mapping
// ---------------------------------------------------------------------------

const ID_TO_FILENAME: Record<string, string> = {
  GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers',
  DEU: 'Deuteronomy', JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth',
  '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Kings', '2KI': '2 Kings',
  '1CH': '1 Chronicles', '2CH': '2 Chronicles', EZR: 'Ezra', NEH: 'Nehemiah',
  EST: 'Esther', JOB: 'Job', PSA: 'Psalms', PRO: 'Proverbs',
  ECC: 'Ecclesiastes', SNG: 'Song of Solomon', ISA: 'Isaiah', JER: 'Jeremiah',
  LAM: 'Lamentations', EZK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea',
  JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah',
  MIC: 'Micah', NAM: 'Nahum', HAB: 'Habakkuk', ZEP: 'Zephaniah',
  HAG: 'Haggai', ZEC: 'Zechariah', MAL: 'Malachi',
  MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke', JHN: 'John',
  ACT: 'Acts', ROM: 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians',
  GAL: 'Galatians', EPH: 'Ephesians', PHP: 'Philippians', COL: 'Colossians',
  '1TH': '1 Thessalonians', '2TH': '2 Thessalonians',
  '1TI': '1 Timothy', '2TI': '2 Timothy', TIT: 'Titus', PHM: 'Philemon',
  HEB: 'Hebrews', JAS: 'James', '1PE': '1 Peter', '2PE': '2 Peter',
  '1JN': '1 John', '2JN': '2 John', '3JN': '3 John',
  JUD: 'Jude', REV: 'Revelation',
};

// ---------------------------------------------------------------------------
// Require map — Metro needs static require() calls
// ---------------------------------------------------------------------------

const BOOK_DATA: Record<string, () => JsonBook> = {
  GEN: () => require('../../data/bible/Bible-kjv-1611/Genesis.json'),
  EXO: () => require('../../data/bible/Bible-kjv-1611/Exodus.json'),
  LEV: () => require('../../data/bible/Bible-kjv-1611/Leviticus.json'),
  NUM: () => require('../../data/bible/Bible-kjv-1611/Numbers.json'),
  DEU: () => require('../../data/bible/Bible-kjv-1611/Deuteronomy.json'),
  JOS: () => require('../../data/bible/Bible-kjv-1611/Joshua.json'),
  JDG: () => require('../../data/bible/Bible-kjv-1611/Judges.json'),
  RUT: () => require('../../data/bible/Bible-kjv-1611/Ruth.json'),
  '1SA': () => require('../../data/bible/Bible-kjv-1611/1 Samuel.json'),
  '2SA': () => require('../../data/bible/Bible-kjv-1611/2 Samuel.json'),
  '1KI': () => require('../../data/bible/Bible-kjv-1611/1 Kings.json'),
  '2KI': () => require('../../data/bible/Bible-kjv-1611/2 Kings.json'),
  '1CH': () => require('../../data/bible/Bible-kjv-1611/1 Chronicles.json'),
  '2CH': () => require('../../data/bible/Bible-kjv-1611/2 Chronicles.json'),
  EZR: () => require('../../data/bible/Bible-kjv-1611/Ezra.json'),
  NEH: () => require('../../data/bible/Bible-kjv-1611/Nehemiah.json'),
  EST: () => require('../../data/bible/Bible-kjv-1611/Esther.json'),
  JOB: () => require('../../data/bible/Bible-kjv-1611/Job.json'),
  PSA: () => require('../../data/bible/Bible-kjv-1611/Psalms.json'),
  PRO: () => require('../../data/bible/Bible-kjv-1611/Proverbs.json'),
  ECC: () => require('../../data/bible/Bible-kjv-1611/Ecclesiastes.json'),
  SNG: () => require('../../data/bible/Bible-kjv-1611/Song of Solomon.json'),
  ISA: () => require('../../data/bible/Bible-kjv-1611/Isaiah.json'),
  JER: () => require('../../data/bible/Bible-kjv-1611/Jeremiah.json'),
  LAM: () => require('../../data/bible/Bible-kjv-1611/Lamentations.json'),
  EZK: () => require('../../data/bible/Bible-kjv-1611/Ezekiel.json'),
  DAN: () => require('../../data/bible/Bible-kjv-1611/Daniel.json'),
  HOS: () => require('../../data/bible/Bible-kjv-1611/Hosea.json'),
  JOL: () => require('../../data/bible/Bible-kjv-1611/Joel.json'),
  AMO: () => require('../../data/bible/Bible-kjv-1611/Amos.json'),
  OBA: () => require('../../data/bible/Bible-kjv-1611/Obadiah.json'),
  JON: () => require('../../data/bible/Bible-kjv-1611/Jonah.json'),
  MIC: () => require('../../data/bible/Bible-kjv-1611/Micah.json'),
  NAM: () => require('../../data/bible/Bible-kjv-1611/Nahum.json'),
  HAB: () => require('../../data/bible/Bible-kjv-1611/Habakkuk.json'),
  ZEP: () => require('../../data/bible/Bible-kjv-1611/Zephaniah.json'),
  HAG: () => require('../../data/bible/Bible-kjv-1611/Haggai.json'),
  ZEC: () => require('../../data/bible/Bible-kjv-1611/Zechariah.json'),
  MAL: () => require('../../data/bible/Bible-kjv-1611/Malachi.json'),
  MAT: () => require('../../data/bible/Bible-kjv-1611/Matthew.json'),
  MRK: () => require('../../data/bible/Bible-kjv-1611/Mark.json'),
  LUK: () => require('../../data/bible/Bible-kjv-1611/Luke.json'),
  JHN: () => require('../../data/bible/Bible-kjv-1611/John.json'),
  ACT: () => require('../../data/bible/Bible-kjv-1611/Acts.json'),
  ROM: () => require('../../data/bible/Bible-kjv-1611/Romans.json'),
  '1CO': () => require('../../data/bible/Bible-kjv-1611/1 Corinthians.json'),
  '2CO': () => require('../../data/bible/Bible-kjv-1611/2 Corinthians.json'),
  GAL: () => require('../../data/bible/Bible-kjv-1611/Galatians.json'),
  EPH: () => require('../../data/bible/Bible-kjv-1611/Ephesians.json'),
  PHP: () => require('../../data/bible/Bible-kjv-1611/Philippians.json'),
  COL: () => require('../../data/bible/Bible-kjv-1611/Colossians.json'),
  '1TH': () => require('../../data/bible/Bible-kjv-1611/1 Thessalonians.json'),
  '2TH': () => require('../../data/bible/Bible-kjv-1611/2 Thessalonians.json'),
  '1TI': () => require('../../data/bible/Bible-kjv-1611/1 Timothy.json'),
  '2TI': () => require('../../data/bible/Bible-kjv-1611/2 Timothy.json'),
  TIT: () => require('../../data/bible/Bible-kjv-1611/Titus.json'),
  PHM: () => require('../../data/bible/Bible-kjv-1611/Philemon.json'),
  HEB: () => require('../../data/bible/Bible-kjv-1611/Hebrews.json'),
  JAS: () => require('../../data/bible/Bible-kjv-1611/James.json'),
  '1PE': () => require('../../data/bible/Bible-kjv-1611/1 Peter.json'),
  '2PE': () => require('../../data/bible/Bible-kjv-1611/2 Peter.json'),
  '1JN': () => require('../../data/bible/Bible-kjv-1611/1 John.json'),
  '2JN': () => require('../../data/bible/Bible-kjv-1611/2 John.json'),
  '3JN': () => require('../../data/bible/Bible-kjv-1611/3 John.json'),
  JUD: () => require('../../data/bible/Bible-kjv-1611/Jude.json'),
  REV: () => require('../../data/bible/Bible-kjv-1611/Revelation.json'),
};

const LOCAL_BIBLE_ID = 'kjv-1611-local';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function loadBook(bookId: string): JsonBook {
  const loader = BOOK_DATA[bookId];
  if (!loader) throw new Error(`Unknown book ID: ${bookId}`);
  return loader();
}

function getNextChapter(bookId: string, chapter: number): { id: string; bookId: string; number: string } | undefined {
  const info = getBookById(bookId);
  if (!info) return undefined;

  if (chapter < info.chapters) {
    return { id: `${bookId}.${chapter + 1}`, bookId, number: String(chapter + 1) };
  }

  const idx = BIBLE_BOOKS.findIndex(b => b.id === bookId);
  if (idx < BIBLE_BOOKS.length - 1) {
    const next = BIBLE_BOOKS[idx + 1];
    return { id: `${next.id}.1`, bookId: next.id, number: '1' };
  }

  return undefined;
}

function getPreviousChapter(bookId: string, chapter: number): { id: string; bookId: string; number: string } | undefined {
  if (chapter > 1) {
    return { id: `${bookId}.${chapter - 1}`, bookId, number: String(chapter - 1) };
  }

  const idx = BIBLE_BOOKS.findIndex(b => b.id === bookId);
  if (idx > 0) {
    const prev = BIBLE_BOOKS[idx - 1];
    return { id: `${prev.id}.${prev.chapters}`, bookId: prev.id, number: String(prev.chapters) };
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Service class — same public API as the old BibleApiService
// ---------------------------------------------------------------------------

class BibleApiService {
  async getBooks(_bibleId?: string): Promise<Book[]> {
    return BIBLE_BOOKS.map(b => ({
      id: b.id,
      bibleId: LOCAL_BIBLE_ID,
      abbreviation: b.abbreviation,
      name: b.name,
      nameLong: b.name,
    }));
  }

  async getChapters(bookId: string, _bibleId?: string): Promise<Chapter[]> {
    const info = getBookById(bookId);
    if (!info) throw new Error(`Unknown book: ${bookId}`);
    return Array.from({ length: info.chapters }, (_, i) => ({
      id: `${bookId}.${i + 1}`,
      bibleId: LOCAL_BIBLE_ID,
      bookId,
      number: String(i + 1),
    }));
  }

  async getChapter(
    chapterId: string,
    _bibleId?: string,
    _includeVerseNumbers: boolean = true,
  ): Promise<ChapterContent> {
    const [bookId, chapterStr] = chapterId.split('.');
    const chapterNum = parseInt(chapterStr, 10);

    const json = loadBook(bookId);
    const chapter = json.chapters.find(c => c.chapter === chapterNum);
    if (!chapter) throw new Error(`Chapter not found: ${chapterId}`);

    const bookInfo = getBookById(bookId);
    const bookName = bookInfo?.name || ID_TO_FILENAME[bookId] || bookId;
    const verseTexts = chapter.verses.map(v => `[${v.verse}] ${v.text}`).join('\n');

    return {
      id: chapterId,
      bibleId: LOCAL_BIBLE_ID,
      bookId,
      number: chapterStr,
      content: verseTexts,
      reference: `${bookName} ${chapterNum}`,
      verseCount: chapter.verses.length,
      copyright: 'King James Version (1611)',
      next: getNextChapter(bookId, chapterNum),
      previous: getPreviousChapter(bookId, chapterNum),
    };
  }

  async getVerse(verseId: string, _bibleId?: string): Promise<Verse> {
    const parts = verseId.split('.');
    if (parts.length < 3) throw new Error(`Invalid verse ID: ${verseId}`);

    const bookId = parts[0];
    const chapterNum = parseInt(parts[1], 10);
    const verseNum = parseInt(parts[2], 10);

    const json = loadBook(bookId);
    const chapter = json.chapters.find(c => c.chapter === chapterNum);
    if (!chapter) throw new Error(`Chapter not found: ${bookId}.${chapterNum}`);

    const verse = chapter.verses.find(v => v.verse === verseNum);
    if (!verse) throw new Error(`Verse not found: ${verseId}`);

    const bookInfo = getBookById(bookId);
    const bookName = bookInfo?.name || ID_TO_FILENAME[bookId] || bookId;

    return {
      id: verseId,
      bibleId: LOCAL_BIBLE_ID,
      bookId,
      chapterId: `${bookId}.${chapterNum}`,
      reference: `${bookName} ${chapterNum}:${verseNum}`,
      content: verse.text,
    };
  }

  parseChapterIntoVerses(chapterContent: ChapterContent): Verse[] {
    const [bookId, chapterStr] = chapterContent.id.split('.');
    const chapterNum = parseInt(chapterStr, 10);

    const json = loadBook(bookId);
    const chapter = json.chapters.find(c => c.chapter === chapterNum);
    if (!chapter) return [];

    const bookInfo = getBookById(bookId);
    const bookName = bookInfo?.name || ID_TO_FILENAME[bookId] || bookId;

    return chapter.verses.map(v => ({
      id: `${bookId}.${chapterNum}.${v.verse}`,
      bibleId: LOCAL_BIBLE_ID,
      bookId,
      chapterId: chapterContent.id,
      reference: `${bookName} ${chapterNum}:${v.verse}`,
      content: v.text,
    }));
  }

  /**
   * Search all loaded Bible text for a query string.
   * Returns up to `limit` matching verses.
   */
  searchVerses(query: string, limit: number = 20): Verse[] {
    const results: Verse[] = [];
    const lowerQuery = query.toLowerCase();

    for (const bookInfo of BIBLE_BOOKS) {
      if (results.length >= limit) break;
      try {
        const json = loadBook(bookInfo.id);
        for (const chapter of json.chapters) {
          if (results.length >= limit) break;
          for (const v of chapter.verses) {
            if (results.length >= limit) break;
            if (v.text.toLowerCase().includes(lowerQuery)) {
              results.push({
                id: `${bookInfo.id}.${chapter.chapter}.${v.verse}`,
                bibleId: LOCAL_BIBLE_ID,
                bookId: bookInfo.id,
                chapterId: `${bookInfo.id}.${chapter.chapter}`,
                reference: `${bookInfo.name} ${chapter.chapter}:${v.verse}`,
                content: v.text,
              });
            }
          }
        }
      } catch {
        continue;
      }
    }

    return results;
  }

  getChapterId(bookId: string, chapterNumber: string): string {
    return `${bookId}.${chapterNumber}`;
  }

  getVerseId(bookId: string, chapterNumber: string, verseNumber: string): string {
    return `${bookId}.${chapterNumber}.${verseNumber}`;
  }
}

export const bibleApi = new BibleApiService();
export default BibleApiService;
