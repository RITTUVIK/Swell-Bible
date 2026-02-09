import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BIBLE_BOOKS, type BibleBookInfo } from '../constants/bibleBooks';
import { bibleApi } from '../services/bibleApi';
import { BIBLE_API_CONFIG, getApiHeaders } from '../config/api';
import { COLORS } from '../constants/colors';

interface SearchResult {
  verseId: string;
  reference: string;
  content: string;
  bookId: string;
}

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Filter books by name
  const filteredBooks = query.trim()
    ? BIBLE_BOOKS.filter(
        (book) =>
          book.name.toLowerCase().includes(query.toLowerCase()) ||
          book.abbreviation.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleBookPress = (book: BibleBookInfo) => {
    navigation?.navigate?.('Read', { bookId: book.id, chapter: 1 });
  };

  const handleVersePress = (result: SearchResult) => {
    // Extract book and chapter from verseId like "JHN.3.16"
    const parts = result.verseId.split('.');
    if (parts.length >= 2) {
      navigation?.navigate?.('Read', {
        bookId: parts[0],
        chapter: parseInt(parts[1], 10),
      });
    }
  };

  const handleSearch = async () => {
    if (!query.trim() || query.trim().length < 3) return;
    setSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `${BIBLE_API_CONFIG.BASE_URL}/bibles/${BIBLE_API_CONFIG.DEFAULT_BIBLE_ID}/search?query=${encodeURIComponent(query)}&limit=20`,
        { headers: getApiHeaders() }
      );

      if (!response.ok) {
        setResults([]);
        return;
      }

      const data = await response.json();
      const verses = data.data?.verses || [];
      setResults(
        verses.map((v: any) => ({
          verseId: v.id,
          reference: v.reference,
          content: (v.text || '').replace(/<[^>]+>/g, '').trim(),
          bookId: v.bookId,
        }))
      );
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const isVerseSearch = query.trim().length >= 3 && filteredBooks.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.inkFaint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search books or verses..."
          placeholderTextColor={COLORS.inkFaint}
          value={query}
          onChangeText={(t) => { setQuery(t); setHasSearched(false); }}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}>
            <Ionicons name="close-circle" size={18} color={COLORS.inkFaint} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search verse button */}
      {query.trim().length >= 3 && !hasSearched && (
        <TouchableOpacity style={styles.searchAction} onPress={handleSearch} activeOpacity={0.6}>
          <Ionicons name="search" size={16} color={COLORS.gold} />
          <Text style={styles.searchActionText}>Search verses for "{query}"</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Book results */}
        {filteredBooks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Books</Text>
            {filteredBooks.map((book) => (
              <TouchableOpacity
                key={book.id}
                style={styles.resultRow}
                activeOpacity={0.6}
                onPress={() => handleBookPress(book)}
              >
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{book.name}</Text>
                  <Text style={styles.resultMeta}>
                    {book.testament === 'old' ? 'Old Testament' : 'New Testament'} · {book.chapters} chapters
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.inkFaint} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Verse search results */}
        {searching && (
          <View style={styles.emptyState}>
            <ActivityIndicator size="small" color={COLORS.gold} />
            <Text style={[styles.emptyText, { marginTop: 12 }]}>Searching verses...</Text>
          </View>
        )}

        {hasSearched && !searching && results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Verses ({results.length})</Text>
            {results.map((result, idx) => (
              <TouchableOpacity
                key={result.verseId + idx}
                style={styles.verseResult}
                activeOpacity={0.6}
                onPress={() => handleVersePress(result)}
              >
                <Text style={styles.verseRef}>{result.reference}</Text>
                <Text style={styles.verseContent} numberOfLines={3}>
                  {result.content}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {hasSearched && !searching && results.length === 0 && filteredBooks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No results found for "{query}"</Text>
          </View>
        )}

        {query.trim().length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={40} color={COLORS.border} />
            <Text style={[styles.emptyText, { marginTop: 16 }]}>
              Search for a book by name{'\n'}or search verse text (3+ characters)
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingBottom: 12, paddingHorizontal: 24 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: COLORS.ink },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 8,
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.ink, padding: 0 },
  searchAction: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 24,
    marginBottom: 8, paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: COLORS.white, borderRadius: 8, borderWidth: 1, borderColor: COLORS.goldLight,
  },
  searchActionText: { fontSize: 14, color: COLORS.gold, fontWeight: '500' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  section: { marginTop: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: COLORS.inkFaint, marginBottom: 8 },
  emptyState: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: COLORS.inkFaint, textAlign: 'center', lineHeight: 22 },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 17, fontWeight: '600', color: COLORS.ink, marginBottom: 2 },
  resultMeta: { fontSize: 12, color: COLORS.inkFaint, letterSpacing: 0.5 },
  verseResult: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  verseRef: { fontSize: 13, fontWeight: '700', color: COLORS.gold, letterSpacing: 1, marginBottom: 4 },
  verseContent: { fontSize: 15, lineHeight: 22, color: COLORS.inkLight },
});
