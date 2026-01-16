// Bible API Types
export interface Bible {
  id: string;
  dblId: string;
  abbreviation: string;
  abbreviationLocal: string;
  name: string;
  nameLocal: string;
  description: string;
  descriptionLocal: string;
  language: {
    id: string;
    name: string;
    nameLocal: string;
    script: string;
    scriptDirection: string;
  };
  countries: Array<{
    id: string;
    name: string;
    nameLocal: string;
  }>;
  type: string;
  updatedAt: string;
  audioBibles: any[];
}

export interface Book {
  id: string;
  bibleId: string;
  abbreviation: string;
  name: string;
  nameLong: string;
  chapters?: Chapter[];
}

export interface Chapter {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  content?: string;
  verseCount?: number;
  verses?: Verse[];
}

export interface Verse {
  id: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  reference: string;
  content: string;
  verseCount?: number;
}

export interface ChapterContent {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  content: string;
  reference: string;
  verseCount: number;
  copyright: string;
  next?: {
    id: string;
    bookId: string;
    number: string;
  };
  previous?: {
    id: string;
    bookId: string;
    number: string;
  };
}

// Local storage types (for future offline support)
export interface CachedChapter {
  chapterId: string;
  bookId: string;
  chapterNumber: string;
  content: string;
  verses: Verse[];
  cachedAt: number; // timestamp
  bibleId: string;
}

export interface CachedBook {
  bookId: string;
  name: string;
  chapters: CachedChapter[];
  cachedAt: number;
}
