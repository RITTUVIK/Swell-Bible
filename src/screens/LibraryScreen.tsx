import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getOldTestamentBooks,
  getNewTestamentBooks,
  type BibleBookInfo,
} from '../constants/bibleBooks';
import { COLORS } from '../constants/colors';

type Tab = 'old' | 'new';

export default function LibraryScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<Tab>('new');
  const [expandedBook, setExpandedBook] = useState<string | null>(null);

  const books = activeTab === 'old' ? getOldTestamentBooks() : getNewTestamentBooks();

  const handleBookPress = (book: BibleBookInfo) => {
    if (book.chapters === 1) {
      navigation?.navigate?.('Read', { bookId: book.id, chapter: 1 });
      return;
    }
    setExpandedBook(expandedBook === book.id ? null : book.id);
  };

  const handleChapterPress = (bookId: string, chapter: number) => {
    navigation?.navigate?.('Read', { bookId, chapter });
  };

  const renderChapterGrid = (book: BibleBookInfo) => {
    if (expandedBook !== book.id) return null;

    const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

    return (
      <View style={styles.chapterGrid}>
        {chapters.map((ch) => (
          <TouchableOpacity
            key={ch}
            style={styles.chapterCell}
            activeOpacity={0.6}
            onPress={() => handleChapterPress(book.id, ch)}
          >
            <Text style={styles.chapterCellNum}>{ch}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
      </View>

      {/* Quick start: Read from the Beginning */}
      <TouchableOpacity
        style={styles.quickStart}
        activeOpacity={0.6}
        onPress={() => navigation?.navigate?.('Read', { bookId: 'GEN', chapter: 1 })}
      >
        <View style={styles.quickStartLeft}>
          <Ionicons name="book" size={20} color={COLORS.gold} />
          <View style={styles.quickStartText}>
            <Text style={styles.quickStartTitle}>Read from the Beginning</Text>
            <Text style={styles.quickStartSub}>Genesis 1 — Revelation 22</Text>
          </View>
        </View>
        <Ionicons name="arrow-forward" size={18} color={COLORS.gold} />
      </TouchableOpacity>

      {/* Testament Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'old' && styles.tabActive]}
          onPress={() => { setActiveTab('old'); setExpandedBook(null); }}
          activeOpacity={0.6}
        >
          <Text style={[styles.tabText, activeTab === 'old' && styles.tabTextActive]}>
            Old Testament
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'new' && styles.tabActive]}
          onPress={() => { setActiveTab('new'); setExpandedBook(null); }}
          activeOpacity={0.6}
        >
          <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
            New Testament
          </Text>
        </TouchableOpacity>
      </View>

      {/* Book List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {books.map((book) => (
          <View key={book.id}>
            <TouchableOpacity
              style={styles.bookRow}
              activeOpacity={0.6}
              onPress={() => handleBookPress(book)}
            >
              <View style={styles.bookInfo}>
                <Text style={styles.bookName}>{book.name}</Text>
                <Text style={styles.bookChapters}>
                  {book.chapters} {book.chapters === 1 ? 'chapter' : 'chapters'}
                </Text>
              </View>
              {book.chapters > 1 && (
                <Ionicons
                  name={expandedBook === book.id ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.inkFaint}
                />
              )}
            </TouchableOpacity>
            {renderChapterGrid(book)}
            <View style={styles.separator} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: COLORS.bg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.ink,
  },

  // Quick start
  quickStart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickStartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickStartText: {
    gap: 2,
  },
  quickStartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ink,
  },
  quickStartSub: {
    fontSize: 12,
    color: COLORS.inkFaint,
    letterSpacing: 0.5,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 8,
    gap: 24,
  },
  tab: {
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.ink,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.inkFaint,
  },
  tabTextActive: {
    color: COLORS.ink,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // Book rows
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: 2,
  },
  bookChapters: {
    fontSize: 12,
    color: COLORS.inkFaint,
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // Chapter grid
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 16,
    gap: 8,
  },
  chapterCell: {
    width: 44,
    height: 44,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterCellNum: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.ink,
  },
});
