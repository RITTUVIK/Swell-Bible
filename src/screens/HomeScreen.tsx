import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      {/* Orthodox Cross */}
      <View style={styles.crossContainer}>
        <View style={styles.crossVertical} />
        <View style={styles.crossBarTop} />
        <View style={styles.crossBarMain} />
        <View style={styles.crossBarBottom} />
      </View>

      {/* Daily Verse */}
      <View style={styles.verseContainer}>
        <Text style={styles.verseText}>
          {'\u201C'}The Lord is my light and my salvation; whom shall I fear?
          The Lord is the stronghold of my life.{'\u201D'}
        </Text>
        <Text style={styles.verseReference}>Psalm 27:1</Text>
      </View>

      {/* Continue Reading */}
      <TouchableOpacity
        style={styles.continueButton}
        activeOpacity={0.6}
        onPress={() => navigation?.navigate?.('Read')}
      >
        <Text style={styles.continueText}>Continue Reading</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.stewardshipText}>Stewardship: 42 SWELL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
  },
  verseText: {
    fontSize: 28,
    lineHeight: 42,
    fontStyle: 'italic',
    color: COLORS.ink,
    textAlign: 'center',
    fontWeight: '500',
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
  },
});
