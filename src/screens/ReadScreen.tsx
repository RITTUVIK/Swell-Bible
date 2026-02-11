import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBible } from '../hooks/useBible';
import { getBookById, BIBLE_BOOKS } from '../constants/bibleBooks';
import { saveReadingPosition } from '../services/readingProgress';
import { addBookmark } from '../services/bookmarks';
import { getSettings } from '../services/settings';
import { COLORS } from '../constants/colors';

interface ReadScreenProps {
  route?: { params?: { bookId?: string; chapter?: number } };
  navigation?: any;
}

export default function ReadScreen({ route, navigation }: ReadScreenProps) {
  const bookId = route?.params?.bookId || 'JHN';
  const initialChapter = route?.params?.chapter || 1;

  const [currentBookId, setCurrentBookId] = useState(bookId);
  const [currentChapter, setCurrentChapter] = useState(initialChapter);
  const [fontSize, setFontSize] = useState(19);
  const [bibleVersionId, setBibleVersionId] = useState<string | undefined>(undefined);
  const scrollRef = useRef<ScrollView>(null);

  const {
    fetchChapter,
    chapterContent,
    verses,
    loadingChapter,
    error,
    getChapterId,
  } = useBible({ bibleId: bibleVersionId });

  const bookInfo = getBookById(currentBookId);
  const bookName = bookInfo?.name || currentBookId;
  const totalChapters = bookInfo?.chapters || 1;

  // Load settings
  useEffect(() => {
    getSettings().then((s) => {
      setFontSize(s.fontSize);
      setBibleVersionId(s.bibleVersionId);
    });
  }, []);

  // Reload settings when screen is focused
  useEffect(() => {
    const unsub = navigation?.addListener?.('focus', () => {
      getSettings().then((s) => {
        setFontSize(s.fontSize);
        setBibleVersionId(s.bibleVersionId);
      });
    });
    return unsub;
  }, [navigation]);

  const loadChapter = useCallback(() => {
    const chapterId = getChapterId(currentBookId, String(currentChapter));
    fetchChapter(chapterId);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    saveReadingPosition(currentBookId, currentChapter);
  }, [currentBookId, currentChapter, getChapterId, fetchChapter]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  useEffect(() => {
    if (route?.params?.bookId) {
      setCurrentBookId(route.params.bookId);
      setCurrentChapter(route.params.chapter || 1);
    }
  }, [route?.params?.bookId, route?.params?.chapter]);

  const goToNext = () => {
    if (chapterContent?.next) {
      setCurrentBookId(chapterContent.next.bookId);
      setCurrentChapter(parseInt(chapterContent.next.number, 10));
    } else if (currentChapter < totalChapters) {
      setCurrentChapter((prev) => prev + 1);
    } else {
      const idx = BIBLE_BOOKS.findIndex((b) => b.id === currentBookId);
      if (idx < BIBLE_BOOKS.length - 1) {
        setCurrentBookId(BIBLE_BOOKS[idx + 1].id);
        setCurrentChapter(1);
      }
    }
  };

  const goToPrevious = () => {
    if (chapterContent?.previous) {
      setCurrentBookId(chapterContent.previous.bookId);
      setCurrentChapter(parseInt(chapterContent.previous.number, 10));
    } else if (currentChapter > 1) {
      setCurrentChapter((prev) => prev - 1);
    } else {
      const idx = BIBLE_BOOKS.findIndex((b) => b.id === currentBookId);
      if (idx > 0) {
        const prevBook = BIBLE_BOOKS[idx - 1];
        setCurrentBookId(prevBook.id);
        setCurrentChapter(prevBook.chapters);
      }
    }
  };

  const handleVerseLongPress = (verse: typeof verses[0]) => {
    const parts = verse.id.split('.');
    const verseNum = parts[parts.length - 1];
    const ref = `${bookName} ${currentChapter}:${verseNum}`;

    Alert.alert('Bookmark Verse', `Save "${ref}" to bookmarks?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Bookmark',
        onPress: () => {
          addBookmark({
            verseId: verse.id,
            bookId: currentBookId,
            chapterId: verse.chapterId,
            reference: ref,
            content: verse.content,
            timestamp: Date.now(),
          });
        },
      },
    ]);
  };

  const groupVersesIntoParagraphs = (allVerses: typeof verses) => {
    if (allVerses.length === 0) return [];
    const paragraphs: (typeof verses)[] = [];
    let current: typeof verses = [];
    for (let i = 0; i < allVerses.length; i++) {
      current.push(allVerses[i]);
      if (current.length >= 3 || i === allVerses.length - 1) {
        paragraphs.push(current);
        current = [];
      }
    }
    return paragraphs;
  };

  if (loadingChapter) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.red} />
        <Text style={styles.loadingText}>Loading scripture...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Unable to load chapter</Text>
        <Text style={styles.errorHint}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadChapter}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const paragraphs = groupVersesIntoParagraphs(verses);
  const hasPrevious = currentChapter > 1 || BIBLE_BOOKS.findIndex((b) => b.id === currentBookId) > 0;
  const hasNext = currentChapter < totalChapters || BIBLE_BOOKS.findIndex((b) => b.id === currentBookId) < BIBLE_BOOKS.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerTouchable}
          activeOpacity={0.6}
          onPress={() => navigation?.navigate?.('Library')}
        >
          <Text style={styles.headerBookName}>{bookName} {currentChapter}</Text>
          <Ionicons name="chevron-down" size={14} color={COLORS.inkLight} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => navigation?.navigate?.('Settings')}
        >
          <Ionicons name="settings-outline" size={20} color={COLORS.inkLight} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Chapter heading */}
        <View style={styles.chapterHeader}>
          <Text style={[styles.chapterTitle, { fontFamily: 'Lora_700Bold' }]}>
            Chapter {currentChapter}
          </Text>
          <View style={styles.divider} />
        </View>

        {/* Scripture body */}
        <View style={styles.body}>
          {paragraphs.map((paragraph, pIdx) => (
            <Text key={pIdx} style={[styles.paragraph, { fontSize, lineHeight: fontSize * 1.9 }]}>
              {paragraph.map((verse) => {
                const parts = verse.id.split('.');
                const verseNum = parts[parts.length - 1];
                return (
                  <Text
                    key={verse.id}
                    onLongPress={() => handleVerseLongPress(verse)}
                  >
                    <Text style={styles.verseNum}>{verseNum} </Text>
                    <Text style={[styles.verseText, { fontSize, lineHeight: fontSize * 1.9, fontFamily: 'Lora_400Regular' }]}>
                      {verse.content}{' '}
                    </Text>
                  </Text>
                );
              })}
            </Text>
          ))}
        </View>

        {/* Previous / Next */}
        <View style={styles.navRow}>
          {hasPrevious ? (
            <TouchableOpacity activeOpacity={0.5} onPress={goToPrevious}>
              <Text style={styles.navText}>Previous</Text>
            </TouchableOpacity>
          ) : <View />}
          <Text style={styles.navDot}>{'\u25CF'}</Text>
          {hasNext ? (
            <TouchableOpacity activeOpacity={0.5} onPress={goToNext}>
              <Text style={styles.navText}>Next</Text>
            </TouchableOpacity>
          ) : <View />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgLight },
  header: {
    paddingBottom: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.bgLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerTouchable: { flexDirection: 'row', alignItems: 'center' },
  headerBookName: { fontSize: 14, fontWeight: '600', letterSpacing: 1, color: COLORS.ink },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 32, paddingTop: 32, paddingBottom: 40 },
  loadingContainer: { flex: 1, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  loadingText: { marginTop: 16, fontSize: 14, color: COLORS.inkLight, letterSpacing: 1 },
  errorText: { fontSize: 18, fontWeight: '600', color: COLORS.ink, marginBottom: 8 },
  errorHint: { fontSize: 14, color: COLORS.inkLight, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  retryButton: { borderWidth: 1, borderColor: COLORS.ink, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: COLORS.ink },
  chapterHeader: { alignItems: 'center', marginBottom: 40 },
  chapterTitle: { fontSize: 32, fontWeight: '700', color: COLORS.ink, marginBottom: 16 },
  divider: { width: 48, height: 1, backgroundColor: COLORS.red, opacity: 0.3 },
  body: { marginBottom: 40 },
  paragraph: { fontSize: 19, lineHeight: 36, color: COLORS.ink, opacity: 0.9, marginBottom: 24 },
  verseNum: { fontSize: 10, color: COLORS.inkFaint, opacity: 0.5 },
  verseText: { fontSize: 19, lineHeight: 36, color: COLORS.ink, opacity: 0.9 },
  navRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 32, marginTop: 20, marginBottom: 20 },
  navText: { fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: COLORS.inkFaint, opacity: 0.5 },
  navDot: { fontSize: 6, color: COLORS.red, opacity: 0.2 },
});
