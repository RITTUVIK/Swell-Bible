# Bible API Integration Guide

## Overview

This app integrates with the [api.bible](https://docs.api.bible/) service to fetch Bible verses, chapters, and books.

## Getting Your API Key

1. Go to [https://scripture.api.bible/](https://scripture.api.bible/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to `src/config/api.ts`:

```typescript
export const BIBLE_API_CONFIG = {
  API_KEY: 'your-actual-api-key-here', // Replace this!
  BASE_URL: 'https://api.scripture.api.bible/v1',
  DEFAULT_BIBLE_ID: '06125adad2d5898a-01', // ESV
};
```

## File Structure

```
src/
├── config/
│   └── api.ts              # API configuration and keys
├── services/
│   ├── bibleApi.ts         # Main API service (fetching)
│   └── bibleStorage.ts     # Offline storage (placeholder)
├── hooks/
│   └── useBible.ts         # React hook for easy usage
├── types/
│   └── bible.ts            # TypeScript types
└── constants/
    └── bibleBooks.ts       # Book names and metadata
```

## Usage Examples

### Basic: Fetch a Chapter

```typescript
import { useBible } from '../hooks/useBible';

function ReadScreen() {
  const { fetchChapter, chapterContent, verses, loadingChapter } = useBible();

  useEffect(() => {
    // Fetch Genesis 1
    fetchChapter('GEN.1');
  }, []);

  if (loadingChapter) return <Text>Loading...</Text>;
  
  return (
    <View>
      {verses.map((verse, index) => (
        <Text key={index}>
          Verse {index + 1}: {verse.content}
        </Text>
      ))}
    </View>
  );
}
```

### Fetch All Books

```typescript
const { fetchBooks, books, loadingBooks } = useBible();

useEffect(() => {
  fetchBooks();
}, []);

// books array contains all 66 books
```

### Fetch Chapters in a Book

```typescript
const { fetchChapters, chapters } = useBible();

useEffect(() => {
  fetchChapters('GEN'); // Get all chapters in Genesis
}, []);

// chapters array contains all 50 chapters
```

## API Methods

### `bibleApi.getBooks()`
Returns all 66 books of the Bible.

### `bibleApi.getChapters(bookId)`
Returns all chapters in a specific book.

### `bibleApi.getChapter(chapterId)`
Returns full chapter content with HTML formatting.

### `bibleApi.parseChapterIntoVerses(chapterContent)`
Parses chapter HTML into individual verse objects.

## Offline Storage (Future)

The `bibleStorage.ts` service is set up with placeholder methods for offline caching:

- `cacheChapter()` - Store chapter locally
- `getCachedChapter()` - Retrieve cached chapter
- `isChapterCached()` - Check if cached
- `clearOldCache()` - Cleanup old data

**TODO:** Implement with AsyncStorage or SQLite when ready.

## Next Steps

1. **Get API Key** - Add your key to `src/config/api.ts`
2. **Test Connection** - Try fetching Genesis 1
3. **Integrate with ReadScreen** - Replace mock verses with real API data
4. **Add Error Handling** - Show user-friendly error messages
5. **Implement Offline Storage** - Cache chapters for offline reading

## Available Bible Versions

Default is ESV. You can change `DEFAULT_BIBLE_ID` in `api.ts`:

- **ESV**: `06125adad2d5898a-01` (default)
- **KJV**: `de4e12af7f28f599-02`
- **NIV**: `9879dbb7cfe39e4d-01`
- **NASB**: `f72b840c855f362c-04`

Get more IDs by calling `bibleApi.getBibles()`.

## Important Notes

- **Rate Limits**: Free tier has rate limits. Cache responses when possible.
- **HTML Content**: API returns HTML-formatted text. We parse it to extract verses.
- **Error Handling**: Always wrap API calls in try-catch blocks.
- **Offline First**: Plan for offline reading - cache frequently accessed chapters.

## Troubleshooting

**"Failed to fetch" error:**
- Check your API key is correct
- Verify internet connection
- Check API key hasn't expired

**Empty verses array:**
- The HTML parser might need adjustment based on actual API response format
- Check `parseChapterIntoVerses()` function

**CORS errors:**
- Shouldn't happen with React Native, but if it does, check API configuration
