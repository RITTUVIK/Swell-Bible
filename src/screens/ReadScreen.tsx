import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SimpleHeader from '../components/SimpleHeader';
import { COLORS } from '../constants/colors';

const VERSES = [
  'In the beginning God created the heaven and the earth.',
  'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.',
  'And God said, Let there be light: and there was light.',
  'And God saw the light, that it was good: and God divided the light from the darkness.',
  'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.',
];

export default function ReadScreen() {
  const [currentVerse, setCurrentVerse] = useState(1);
  const [progress, setProgress] = useState(1);
  const progressAnim = useRef(new Animated.Value(0.2)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentVerse < VERSES.length) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentVerse(currentVerse + 1);
        setProgress(progress + 1);
        
        Animated.parallel([
          Animated.timing(progressAnim, {
            toValue: (progress + 1) / VERSES.length,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const handlePrevious = () => {
    if (currentVerse > 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentVerse(currentVerse - 1);
        setProgress(progress - 1);
        
        Animated.parallel([
          Animated.timing(progressAnim, {
            toValue: (progress - 1) / VERSES.length,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  return (
    <View style={styles.container}>
      <SimpleHeader balance={135.5} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.chapterHeader}>
          <View>
            <Text style={styles.chapterTitle}>Genesis 1</Text>
            <Text style={styles.chapterSubtitle}>The Creation</Text>
          </View>
          <View style={styles.earnBadge}>
            <Text style={styles.earnText}>Earn</Text>
            <Text style={styles.earnAmount}>+5 SWELL</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Reading Progress</Text>
            <Text style={styles.progressCount}>
              {progress} of {VERSES.length}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>

        <Animated.View style={[styles.verseContainer, { opacity: fadeAnim }]}>
          <Text style={styles.verseLabel}>Verse {currentVerse}</Text>
          <Text style={styles.verseText}>{VERSES[currentVerse - 1]}</Text>
        </Animated.View>

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.navButton, currentVerse === 1 && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentVerse === 1}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={currentVerse === 1 ? COLORS.textLight : COLORS.primary}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.navButtonText,
                currentVerse === 1 && styles.navButtonTextDisabled,
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              currentVerse === VERSES.length && styles.navButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={currentVerse === VERSES.length}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navButtonText,
                styles.nextButtonText,
                currentVerse === VERSES.length && styles.navButtonTextDisabled,
              ]}
            >
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={currentVerse === VERSES.length ? COLORS.textLight : COLORS.white}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>

        {currentVerse === VERSES.length && (
          <View style={styles.completionCard}>
            <View style={styles.completionIcon}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.accent} />
            </View>
            <Text style={styles.completionTitle}>Chapter Complete!</Text>
            <Text style={styles.completionText}>You've earned +5 SWELL tokens</Text>
            <TouchableOpacity style={styles.continueButton} activeOpacity={0.8}>
              <Text style={styles.continueButtonText}>Continue to Next Chapter</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 20,
  },
  chapterTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPurple,
    marginBottom: 4,
  },
  chapterSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  earnBadge: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    alignItems: 'center',
  },
  earnText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  earnAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  progressCard: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPurple,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  verseContainer: {
    marginHorizontal: 20,
    padding: 32,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.secondary,
    minHeight: 200,
    justifyContent: 'center',
    marginBottom: 24,
  },
  verseLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPurple,
    textAlign: 'center',
    marginBottom: 16,
  },
  verseText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: COLORS.textPurple,
    lineHeight: 28,
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginHorizontal: 6,
  },
  navButtonDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  navButtonTextDisabled: {
    color: COLORS.textLight,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
  },
  nextButtonText: {
    color: COLORS.white,
  },
  completionCard: {
    marginHorizontal: 20,
    padding: 32,
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: 'center',
    marginBottom: 30,
  },
  completionIcon: {
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 8,
  },
  completionText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 24,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
