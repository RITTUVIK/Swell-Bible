/**
 * Bible Books Constants
 * Standard list of Bible books with their IDs and names
 * These IDs match the api.bible format
 */

export interface BibleBookInfo {
  id: string;
  name: string;
  abbreviation: string;
  chapters: number;
  testament: 'old' | 'new';
}

export const BIBLE_BOOKS: BibleBookInfo[] = [
  // Old Testament
  { id: 'GEN', name: 'Genesis', abbreviation: 'Gen', chapters: 50, testament: 'old' },
  { id: 'EXO', name: 'Exodus', abbreviation: 'Exo', chapters: 40, testament: 'old' },
  { id: 'LEV', name: 'Leviticus', abbreviation: 'Lev', chapters: 27, testament: 'old' },
  { id: 'NUM', name: 'Numbers', abbreviation: 'Num', chapters: 36, testament: 'old' },
  { id: 'DEU', name: 'Deuteronomy', abbreviation: 'Deu', chapters: 34, testament: 'old' },
  { id: 'JOS', name: 'Joshua', abbreviation: 'Jos', chapters: 24, testament: 'old' },
  { id: 'JDG', name: 'Judges', abbreviation: 'Jdg', chapters: 21, testament: 'old' },
  { id: 'RUT', name: 'Ruth', abbreviation: 'Rut', chapters: 4, testament: 'old' },
  { id: '1SA', name: '1 Samuel', abbreviation: '1Sa', chapters: 31, testament: 'old' },
  { id: '2SA', name: '2 Samuel', abbreviation: '2Sa', chapters: 24, testament: 'old' },
  { id: '1KI', name: '1 Kings', abbreviation: '1Ki', chapters: 22, testament: 'old' },
  { id: '2KI', name: '2 Kings', abbreviation: '2Ki', chapters: 25, testament: 'old' },
  { id: '1CH', name: '1 Chronicles', abbreviation: '1Ch', chapters: 29, testament: 'old' },
  { id: '2CH', name: '2 Chronicles', abbreviation: '2Ch', chapters: 36, testament: 'old' },
  { id: 'EZR', name: 'Ezra', abbreviation: 'Ezr', chapters: 10, testament: 'old' },
  { id: 'NEH', name: 'Nehemiah', abbreviation: 'Neh', chapters: 13, testament: 'old' },
  { id: 'EST', name: 'Esther', abbreviation: 'Est', chapters: 10, testament: 'old' },
  { id: 'JOB', name: 'Job', abbreviation: 'Job', chapters: 42, testament: 'old' },
  { id: 'PSA', name: 'Psalms', abbreviation: 'Psa', chapters: 150, testament: 'old' },
  { id: 'PRO', name: 'Proverbs', abbreviation: 'Pro', chapters: 31, testament: 'old' },
  { id: 'ECC', name: 'Ecclesiastes', abbreviation: 'Ecc', chapters: 12, testament: 'old' },
  { id: 'SNG', name: 'Song of Songs', abbreviation: 'Sng', chapters: 8, testament: 'old' },
  { id: 'ISA', name: 'Isaiah', abbreviation: 'Isa', chapters: 66, testament: 'old' },
  { id: 'JER', name: 'Jeremiah', abbreviation: 'Jer', chapters: 52, testament: 'old' },
  { id: 'LAM', name: 'Lamentations', abbreviation: 'Lam', chapters: 5, testament: 'old' },
  { id: 'EZK', name: 'Ezekiel', abbreviation: 'Ezk', chapters: 48, testament: 'old' },
  { id: 'DAN', name: 'Daniel', abbreviation: 'Dan', chapters: 12, testament: 'old' },
  { id: 'HOS', name: 'Hosea', abbreviation: 'Hos', chapters: 14, testament: 'old' },
  { id: 'JOL', name: 'Joel', abbreviation: 'Joe', chapters: 3, testament: 'old' },
  { id: 'AMO', name: 'Amos', abbreviation: 'Amo', chapters: 9, testament: 'old' },
  { id: 'OBA', name: 'Obadiah', abbreviation: 'Oba', chapters: 1, testament: 'old' },
  { id: 'JON', name: 'Jonah', abbreviation: 'Jon', chapters: 4, testament: 'old' },
  { id: 'MIC', name: 'Micah', abbreviation: 'Mic', chapters: 7, testament: 'old' },
  { id: 'NAM', name: 'Nahum', abbreviation: 'Nam', chapters: 3, testament: 'old' },
  { id: 'HAB', name: 'Habakkuk', abbreviation: 'Hab', chapters: 3, testament: 'old' },
  { id: 'ZEP', name: 'Zephaniah', abbreviation: 'Zep', chapters: 3, testament: 'old' },
  { id: 'HAG', name: 'Haggai', abbreviation: 'Hag', chapters: 2, testament: 'old' },
  { id: 'ZEC', name: 'Zechariah', abbreviation: 'Zec', chapters: 14, testament: 'old' },
  { id: 'MAL', name: 'Malachi', abbreviation: 'Mal', chapters: 4, testament: 'old' },
  
  // New Testament
  { id: 'MAT', name: 'Matthew', abbreviation: 'Mat', chapters: 28, testament: 'new' },
  { id: 'MRK', name: 'Mark', abbreviation: 'Mrk', chapters: 16, testament: 'new' },
  { id: 'LUK', name: 'Luke', abbreviation: 'Luk', chapters: 24, testament: 'new' },
  { id: 'JHN', name: 'John', abbreviation: 'Jhn', chapters: 21, testament: 'new' },
  { id: 'ACT', name: 'Acts', abbreviation: 'Act', chapters: 28, testament: 'new' },
  { id: 'ROM', name: 'Romans', abbreviation: 'Rom', chapters: 16, testament: 'new' },
  { id: '1CO', name: '1 Corinthians', abbreviation: '1Co', chapters: 16, testament: 'new' },
  { id: '2CO', name: '2 Corinthians', abbreviation: '2Co', chapters: 14, testament: 'new' },
  { id: 'GAL', name: 'Galatians', abbreviation: 'Gal', chapters: 6, testament: 'new' },
  { id: 'EPH', name: 'Ephesians', abbreviation: 'Eph', chapters: 6, testament: 'new' },
  { id: 'PHP', name: 'Philippians', abbreviation: 'Php', chapters: 4, testament: 'new' },
  { id: 'COL', name: 'Colossians', abbreviation: 'Col', chapters: 4, testament: 'new' },
  { id: '1TH', name: '1 Thessalonians', abbreviation: '1Th', chapters: 5, testament: 'new' },
  { id: '2TH', name: '2 Thessalonians', abbreviation: '2Th', chapters: 3, testament: 'new' },
  { id: '1TI', name: '1 Timothy', abbreviation: '1Ti', chapters: 6, testament: 'new' },
  { id: '2TI', name: '2 Timothy', abbreviation: '2Ti', chapters: 4, testament: 'new' },
  { id: 'TIT', name: 'Titus', abbreviation: 'Tit', chapters: 3, testament: 'new' },
  { id: 'PHM', name: 'Philemon', abbreviation: 'Phm', chapters: 1, testament: 'new' },
  { id: 'HEB', name: 'Hebrews', abbreviation: 'Heb', chapters: 13, testament: 'new' },
  { id: 'JAS', name: 'James', abbreviation: 'Jas', chapters: 5, testament: 'new' },
  { id: '1PE', name: '1 Peter', abbreviation: '1Pe', chapters: 5, testament: 'new' },
  { id: '2PE', name: '2 Peter', abbreviation: '2Pe', chapters: 3, testament: 'new' },
  { id: '1JN', name: '1 John', abbreviation: '1Jn', chapters: 5, testament: 'new' },
  { id: '2JN', name: '2 John', abbreviation: '2Jn', chapters: 1, testament: 'new' },
  { id: '3JN', name: '3 John', abbreviation: '3Jn', chapters: 1, testament: 'new' },
  { id: 'JUD', name: 'Jude', abbreviation: 'Jud', chapters: 1, testament: 'new' },
  { id: 'REV', name: 'Revelation', abbreviation: 'Rev', chapters: 22, testament: 'new' },
];

/**
 * Get book info by ID
 */
export const getBookById = (bookId: string): BibleBookInfo | undefined => {
  return BIBLE_BOOKS.find(book => book.id === bookId);
};

/**
 * Get book info by name
 */
export const getBookByName = (name: string): BibleBookInfo | undefined => {
  return BIBLE_BOOKS.find(
    book => book.name.toLowerCase() === name.toLowerCase() ||
            book.abbreviation.toLowerCase() === name.toLowerCase()
  );
};

/**
 * Get all Old Testament books
 */
export const getOldTestamentBooks = (): BibleBookInfo[] => {
  return BIBLE_BOOKS.filter(book => book.testament === 'old');
};

/**
 * Get all New Testament books
 */
export const getNewTestamentBooks = (): BibleBookInfo[] => {
  return BIBLE_BOOKS.filter(book => book.testament === 'new');
};
