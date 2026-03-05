import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { bibleApi } from '../services/bibleApi';
import { getReadingPosition, type ReadingPosition } from '../services/readingProgress';
import { getBookById } from '../constants/bibleBooks';
import { getSavedWallet } from '../services/walletContext';
import { recordAppActivity } from '../services/streaks';

// Curated daily verses
const DAILY_VERSES = [
  { id: 'PSA.27.1', reference: 'Psalm 27:1' },
  { id: 'JHN.3.16', reference: 'John 3:16' },
  { id: 'PHP.4.13', reference: 'Philippians 4:13' },
  { id: 'ROM.8.28', reference: 'Romans 8:28' },
  { id: 'ISA.41.10', reference: 'Isaiah 41:10' },
  { id: 'PRO.3.5', reference: 'Proverbs 3:5' },
  { id: 'JER.29.11', reference: 'Jeremiah 29:11' },
  { id: 'PSA.23.1', reference: 'Psalm 23:1' },
  { id: 'MAT.11.28', reference: 'Matthew 11:28' },
  { id: 'GAL.5.22', reference: 'Galatians 5:22' },
  { id: 'HEB.11.1', reference: 'Hebrews 11:1' },
  { id: 'PSA.46.10', reference: 'Psalm 46:10' },
  { id: 'ROM.12.2', reference: 'Romans 12:2' },
  { id: 'PSA.119.105', reference: 'Psalm 119:105' },
  { id: '2CO.5.17', reference: '2 Corinthians 5:17' },
];

function getDailyVerse() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

export default function HomeScreen({ navigation }: any) {
  const [verseText, setVerseText] = useState<string | null>(null);
  const [verseRef, setVerseRef] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lastPosition, setLastPosition] = useState<ReadingPosition | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [checklistVisible, setChecklistVisible] = useState(false);

  useEffect(() => {
    loadDailyVerse();
    loadLastPosition();
    loadWallet();
  }, []);

  // Re-check position when screen is focused
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      loadLastPosition();
      loadWallet();
    });
    return unsubscribe;
  }, [navigation]);

  const loadLastPosition = async () => {
    const pos = await getReadingPosition();
    setLastPosition(pos);
  };

  const loadWallet = async () => {
    const wallet = await getSavedWallet();
    setWalletConnected(wallet.connected);
  };

  const loadDailyVerse = async () => {
    const daily = getDailyVerse();
    setVerseRef(daily.reference);

    try {
      const verse = await bibleApi.getVerse(daily.id);
      const cleanText = verse.content
        .replace(/<[^>]+>/g, '')
        .replace(/\[\d+\]\s*/g, '')
        .trim();
      setVerseText(cleanText);
      await recordAppActivity();
    } catch {
      setVerseText(
        'The Lord is my light and my salvation; whom shall I fear? The Lord is the stronghold of my life.'
      );
      setVerseRef('Psalm 27:1');
      await recordAppActivity();
    } finally {
      setLoading(false);
    }
  };

  const handleContinueReading = () => {
    if (lastPosition) {
      navigation?.navigate?.('Read', {
        bookId: lastPosition.bookId,
        chapter: lastPosition.chapter,
      });
    } else {
      navigation?.navigate?.('Read', { bookId: 'GEN', chapter: 1 });
    }
  };

  const continueLabel = lastPosition
    ? `Continue: ${getBookById(lastPosition.bookId)?.name || lastPosition.bookId} ${lastPosition.chapter}`
    : 'Begin Reading';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Orthodox Cross */}
          <View style={styles.crossContainer}>
            <View style={styles.crossVertical} />
            <View style={styles.crossBarTop} />
            <View style={styles.crossBarMain} />
            <View style={styles.crossBarBottom} />
          </View>

          {/* Verse of the Day label */}
          <Text style={styles.verseOfDayLabel}>Verse of the Day</Text>

          {/* Daily Verse */}
          <View style={styles.verseContainer}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.gold} />
            ) : (
              <>
                <Text style={styles.verseText}>
                  {'\u201C'}{verseText}{'\u201D'}
                </Text>
                <Text style={styles.verseReference}>{verseRef}</Text>
              </>
            )}
          </View>

          {/* Continue Reading */}
        <TouchableOpacity
          style={styles.continueButton}
          activeOpacity={0.6}
          onPress={handleContinueReading}
        >
          <Text style={styles.continueText}>{continueLabel}</Text>
        </TouchableOpacity>

        {/* Connect panel — wide; Continue opens checklist modal */}
          <TouchableOpacity
            style={styles.welcomePanel}
            activeOpacity={0.95}
            onPress={() => setChecklistVisible(true)}
          >
            <View style={styles.welcomePanelLeft}>
              <Text style={styles.welcomePanelHeadline}>
                Learn how to connect more with the Word of the Bible.
              </Text>
              <TouchableOpacity
                style={styles.welcomePanelButton}
                activeOpacity={0.7}
                onPress={(e) => {
                  e.stopPropagation();
                  setChecklistVisible(true);
                }}
              >
                <Text style={styles.welcomePanelButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.welcomePanelRight}>
              <View style={styles.welcomePanelIconCircle}>
                <Ionicons name="book-outline" size={32} color={COLORS.gold} />
              </View>
              <Text style={styles.welcomePanelProgress}>1</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Checklist modal — overview of earning SWELL */}
      <Modal
        visible={checklistVisible}
        transparent
        animationType="none"
        onRequestClose={() => setChecklistVisible(false)}
      >
        <Pressable style={styles.checklistOverlay} onPress={() => setChecklistVisible(false)}>
          <Pressable style={styles.checklistCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.checklistSubtitle}>Learn how to connect more with the Word of the Bible.</Text>
            <View style={styles.checklistList}>
              <View style={styles.checklistRow}>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.gold} style={styles.checklistIcon} />
                <Text style={styles.checklistItem}>Complete today’s reading to unlock 1 SWELL.</Text>
              </View>
              <View style={styles.checklistRow}>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.gold} style={styles.checklistIcon} />
                <Text style={styles.checklistItem}>Connect your wallet in Stewardship to claim it.</Text>
              </View>
              <View style={styles.checklistRow}>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.gold} style={styles.checklistIcon} />
                <Text style={styles.checklistItem}>One reward per day — built on discipline.</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.checklistButton}
              activeOpacity={0.7}
              onPress={() => {
                setChecklistVisible(false);
                navigation?.navigate?.('Stewardship');
              }}
            >
              <Text style={styles.checklistButtonText}>Go to Stewardship</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.checklistDismiss}
              onPress={() => setChecklistVisible(false)}
            >
              <Text style={styles.checklistDismissText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    minHeight: 400,
  },

  // Orthodox cross
  crossContainer: {
    width: 24,
    height: 44,
    marginBottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossVertical: {
    position: 'absolute',
    width: 1.5,
    height: '100%',
    backgroundColor: COLORS.ink,
    opacity: 0.7,
  },
  crossBarTop: {
    position: 'absolute',
    width: 12,
    height: 1.5,
    backgroundColor: COLORS.ink,
    opacity: 0.7,
    top: 6,
  },
  crossBarMain: {
    position: 'absolute',
    width: 24,
    height: 1.5,
    backgroundColor: COLORS.ink,
    opacity: 0.7,
    top: 14,
  },
  crossBarBottom: {
    position: 'absolute',
    width: 14,
    height: 1.5,
    backgroundColor: COLORS.ink,
    opacity: 0.7,
    bottom: 8,
    transform: [{ rotate: '-20deg' }],
  },

  verseOfDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: COLORS.inkLight,
    marginBottom: 16,
  },

  // Verse
  verseContainer: {
    alignItems: 'center',
    marginBottom: 48,
    minHeight: 120,
    justifyContent: 'center',
  },
  verseText: {
    fontSize: 28,
    lineHeight: 42,
    fontStyle: 'italic',
    fontFamily: 'Lora_400Regular',
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: 20,
  },
  verseReference: {
    fontSize: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: COLORS.inkFaint,
    fontWeight: '500',
  },

  // Continue
  continueButton: {
    marginBottom: 24,
  },
  continueText: {
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: COLORS.gold,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.goldLight,
    paddingBottom: 4,
  },

  welcomePanel: {
    marginTop: 32,
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8E6E0',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  welcomePanelLeft: {
    flex: 1,
    paddingRight: 16,
  },
  welcomePanelLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.inkLight,
    marginBottom: 6,
  },
  welcomePanelHeadline: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 24,
    marginBottom: 16,
  },
  welcomePanelButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#D8D6D0',
    borderWidth: 1,
    borderColor: COLORS.ink,
  },
  welcomePanelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: COLORS.ink,
  },
  welcomePanelRight: {
    alignItems: 'center',
  },
  welcomePanelIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomePanelProgress: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
    marginTop: 8,
  },

  checklistOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  checklistCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checklistTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.inkLight,
    marginBottom: 6,
  },
  checklistSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
    lineHeight: 24,
    marginBottom: 20,
  },
  checklistList: {
    marginBottom: 24,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  checklistIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  checklistItem: {
    flex: 1,
    fontSize: 14,
    color: COLORS.ink,
    lineHeight: 22,
  },
  checklistButton: {
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  checklistButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: COLORS.white,
  },
  checklistDismiss: {
    alignItems: 'center',
  },
  checklistDismissText: {
    fontSize: 13,
    color: COLORS.inkLight,
    letterSpacing: 1,
  },

});
