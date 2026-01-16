/**
 * EXAMPLE: How to integrate Bible API into ReadScreen
 * 
 * This shows how to replace mock verses with real API data.
 * Copy this pattern into your actual ReadScreen.tsx
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useBible } from '../hooks/useBible';
import { COLORS } from '../constants/colors';

export default function ReadScreenExample() {
  const {
    fetchChapter,
    chapterContent,
    verses,
    loadingChapter,
    error,
  } = useBible();

  useEffect(() => {
    // Fetch Genesis 1 when component mounts
    fetchChapter('GEN.1');
  }, []);

  if (loadingChapter) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading chapter...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorHint}>
          Make sure you've added your API key to src/config/api.ts
        </Text>
      </View>
    );
  }

  if (!chapterContent || verses.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No chapter data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {chapterContent.reference}
      </Text>
      
      {verses.map((verse, index) => (
        <View key={verse.id} style={styles.verseContainer}>
          <Text style={styles.verseNumber}>{index + 1}</Text>
          <Text style={styles.verseText}>{verse.content}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textLight,
  },
  errorText: {
    color: COLORS.accentRed,
    fontSize: 16,
    marginBottom: 8,
  },
  errorHint: {
    color: COLORS.textLight,
    fontSize: 14,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPurple,
    marginBottom: 20,
  },
  verseContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  verseNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 12,
    minWidth: 30,
  },
  verseText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
});
