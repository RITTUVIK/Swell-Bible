import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { bibleApi } from '../services/bibleApi';
import { getReadingPosition, type ReadingPosition } from '../services/readingProgress';
import { getBookById } from '../constants/bibleBooks';
import { getSavedWallet } from '../services/walletContext';

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
    } catch {
      setVerseText(
        'The Lord is my light and my salvation; whom shall I fear? The Lord is the stronghold of my life.'
      );
      setVerseRef('Psalm 27:1');
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
      <View style={styles.content}>
        {/* Orthodox Cross */}
        <View style={styles.crossContainer}>
          <View style={styles.crossVertical} />
          <View style={styles.crossBarTop} />
          <View style={styles.crossBarMain} />
          <View style={styles.crossBarBottom} />
        </View>

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

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => navigation?.navigate?.('Stewardship')}
          >
            <Text style={styles.stewardshipText}>
              {walletConnected ? 'Stewardship Ledger' : 'Connect Wallet'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
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
    marginBottom: 48,
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

  // Footer
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  stewardshipText: {
    fontSize: 11,
    letterSpacing: 2,
    color: COLORS.inkFaint,
    opacity: 0.6,
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.border,
  },
});
