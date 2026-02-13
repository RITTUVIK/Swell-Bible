import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { bibleApi } from '../services/bibleApi';
import { recordGuidedScriptureComplete } from '../services/streaks';

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

export default function GuidedScriptureScreen({ navigation }: any) {
  const [verseText, setVerseText] = useState<string | null>(null);
  const [verseRef, setVerseRef] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [reflection, setReflection] = useState('');

  useEffect(() => {
    loadVerse();
  }, []);

  const loadVerse = async () => {
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

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await recordGuidedScriptureComplete();
      navigation?.goBack?.();
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Guided Scripture</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guided Scripture</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.verseBlock}>
            <Text style={styles.verseText}>{'\u201C'}{verseText}{'\u201D'}</Text>
            <Text style={styles.verseReference}>{verseRef}</Text>
          </View>

          <View style={styles.reflectionBlock}>
            <Text style={styles.reflectionLabel}>Reflect or pray</Text>
            <Text style={styles.reflectionHint}>
              Optional: write a short reflection or prayer. Completing this step counts toward your Guided Scripture streak.
            </Text>
            <TextInput
              style={styles.reflectionInput}
              placeholder="Your reflection..."
              placeholderTextColor={COLORS.inkFaint}
              value={reflection}
              onChangeText={setReflection}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.completeBtn, completing && styles.completeBtnDisabled]}
            onPress={handleComplete}
            disabled={completing}
            activeOpacity={0.7}
          >
            {completing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.completeBtnText}>I've completed today's reflection</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    letterSpacing: 1,
    fontWeight: '600',
    color: COLORS.ink,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
  },
  verseBlock: {
    marginBottom: 32,
  },
  verseText: {
    fontSize: 22,
    lineHeight: 34,
    fontStyle: 'italic',
    fontFamily: 'Lora_400Regular',
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: 12,
  },
  verseReference: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.inkFaint,
    textAlign: 'center',
  },
  reflectionBlock: {
    marginBottom: 32,
  },
  reflectionLabel: {
    fontSize: 13,
    letterSpacing: 1,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: 8,
  },
  reflectionHint: {
    fontSize: 12,
    color: COLORS.inkLight,
    lineHeight: 18,
    marginBottom: 12,
  },
  reflectionInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: COLORS.ink,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  completeBtn: {
    backgroundColor: COLORS.ink,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  completeBtnDisabled: {
    opacity: 0.7,
  },
  completeBtnText: {
    fontSize: 14,
    letterSpacing: 1,
    fontWeight: '600',
    color: COLORS.white,
  },
});
