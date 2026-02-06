import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../constants/colors';

/**
 * Verses for John 1:1-14 (KJV), matching the HTML mockup.
 * Each entry is { num, text }.
 */
const VERSES = [
  { num: 1, text: 'In the beginning was the Word, and the Word was with God, and the Word was God.' },
  { num: 2, text: 'The same was in the beginning with God.' },
  { num: 3, text: 'All things were made by him; and without him was not any thing made that was made.' },
  { num: 4, text: 'In him was life; and the life was the light of men.' },
  { num: 5, text: 'And the light shineth in darkness; and the darkness comprehended it not.' },
  { num: 6, text: 'There was a man sent from God, whose name was John.' },
  { num: 7, text: 'The same came for a witness, to bear witness of the Light, that all men through him might believe.' },
  { num: 8, text: 'He was not that Light, but was sent to bear witness of that Light.' },
  { num: 9, text: 'That was the true Light, which lighteth every man that cometh into the world.' },
  { num: 10, text: 'He was in the world, and the world was made by him, and the world knew him not.' },
  { num: 11, text: 'He came unto his own, and his own received him not.' },
  { num: 12, text: 'But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name:' },
  { num: 13, text: 'Which were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God.' },
  { num: 14, text: 'And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.' },
];

/**
 * Group consecutive verses into paragraphs for natural reading flow.
 * Each group is an array of verse objects displayed as one paragraph.
 */
const PARAGRAPHS = [
  VERSES.slice(0, 3),   // v1-3
  VERSES.slice(3, 5),   // v4-5
  VERSES.slice(5, 8),   // v6-8
  VERSES.slice(8, 11),  // v9-11
  VERSES.slice(11, 13), // v12-13
  VERSES.slice(13, 14), // v14
];

export default function ReadScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Chapter heading */}
        <View style={styles.chapterHeader}>
          <Text style={styles.chapterTitle}>Chapter 1</Text>
          <View style={styles.divider} />
        </View>

        {/* Scripture body */}
        <View style={styles.body}>
          {PARAGRAPHS.map((paragraph, pIdx) => (
            <Text key={pIdx} style={styles.paragraph}>
              {paragraph.map((verse) => (
                <Text key={verse.num}>
                  <Text style={styles.verseNum}>{verse.num} </Text>
                  <Text style={styles.verseText}>{verse.text} </Text>
                </Text>
              ))}
            </Text>
          ))}
        </View>

        {/* Previous / Next */}
        <View style={styles.navRow}>
          <TouchableOpacity activeOpacity={0.5}>
            <Text style={styles.navText}>Previous</Text>
          </TouchableOpacity>
          <Text style={styles.navDot}>{'\u25CF'}</Text>
          <TouchableOpacity activeOpacity={0.5}>
            <Text style={styles.navText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Alms floating button */}
      <View style={styles.almsContainer}>
        <TouchableOpacity style={styles.almsButton} activeOpacity={0.7}>
          <Text style={styles.almsIcon}>{'\u2665'}</Text>
          <Text style={styles.almsLabel}>Alms (SWELL)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 120,
  },

  // Chapter heading
  chapterHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  chapterTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 16,
  },
  divider: {
    width: 48,
    height: 1,
    backgroundColor: COLORS.red,
    opacity: 0.3,
  },

  // Scripture body
  body: {
    marginBottom: 40,
  },
  paragraph: {
    fontSize: 19,
    lineHeight: 36,
    color: COLORS.ink,
    opacity: 0.9,
    marginBottom: 24,
  },
  verseNum: {
    fontSize: 10,
    color: COLORS.inkFaint,
    opacity: 0.5,
  },
  verseText: {
    fontSize: 19,
    lineHeight: 36,
    color: COLORS.ink,
    opacity: 0.9,
  },

  // Navigation
  navRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    marginTop: 20,
    marginBottom: 20,
  },
  navText: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: COLORS.inkFaint,
    opacity: 0.5,
  },
  navDot: {
    fontSize: 6,
    color: COLORS.red,
    opacity: 0.2,
  },

  // Alms button
  almsContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  almsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  almsIcon: {
    fontSize: 14,
    color: COLORS.red,
    opacity: 0.7,
  },
  almsLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    color: COLORS.inkLight,
  },
});
