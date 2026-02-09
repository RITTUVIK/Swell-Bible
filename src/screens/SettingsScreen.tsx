import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getSettings, saveSettings, BIBLE_VERSIONS, type AppSettings } from '../services/settings';
import { getBookmarks, removeBookmark, type Bookmark } from '../services/bookmarks';
import { bibleStorage } from '../services/bibleStorage';
import { COLORS } from '../constants/colors';

export default function SettingsScreen({ navigation }: any) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [cacheCount, setCacheCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsub = navigation?.addListener?.('focus', loadData);
    return unsub;
  }, [navigation]);

  const loadData = async () => {
    const [s, bm, cc] = await Promise.all([
      getSettings(),
      getBookmarks(),
      bibleStorage.getCacheSize(),
    ]);
    setSettings(s);
    setBookmarks(bm);
    setCacheCount(cc);
  };

  const handleFontSize = async (delta: number) => {
    if (!settings) return;
    const newSize = Math.min(28, Math.max(14, settings.fontSize + delta));
    const updated = await saveSettings({ fontSize: newSize });
    setSettings(updated);
  };

  const handleVersionSelect = async (versionId: string, versionName: string) => {
    const updated = await saveSettings({ bibleVersionId: versionId, bibleVersionName: versionName });
    setSettings(updated);
  };

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Remove all cached chapters? You\'ll need internet to read them again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await bibleStorage.clearAllCache();
          setCacheCount(0);
        },
      },
    ]);
  };

  const handleRemoveBookmark = (verseId: string) => {
    Alert.alert('Remove Bookmark', 'Remove this bookmark?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeBookmark(verseId);
          setBookmarks((prev) => prev.filter((b) => b.verseId !== verseId));
        },
      },
    ]);
  };

  const handleBookmarkPress = (bm: Bookmark) => {
    const parts = bm.verseId.split('.');
    if (parts.length >= 2) {
      navigation?.navigate?.('Read', {
        bookId: parts[0],
        chapter: parseInt(parts[1], 10),
      });
    }
  };

  if (!settings) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} activeOpacity={0.6}>
          <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Text Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text Size</Text>
          <View style={styles.fontSizeRow}>
            <TouchableOpacity style={styles.fontSizeBtn} onPress={() => handleFontSize(-1)} activeOpacity={0.6}>
              <Text style={styles.fontSizeBtnText}>A-</Text>
            </TouchableOpacity>
            <Text style={styles.fontSizePreview}>{settings.fontSize}pt</Text>
            <TouchableOpacity style={styles.fontSizeBtn} onPress={() => handleFontSize(1)} activeOpacity={0.6}>
              <Text style={[styles.fontSizeBtnText, { fontSize: 20 }]}>A+</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.previewText, { fontSize: settings.fontSize, lineHeight: settings.fontSize * 1.8 }]}>
            In the beginning was the Word, and the Word was with God, and the Word was God.
          </Text>
        </View>

        {/* Bible Version */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bible Version</Text>
          {BIBLE_VERSIONS.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={[styles.versionRow, settings.bibleVersionId === v.id && styles.versionRowActive]}
              onPress={() => handleVersionSelect(v.id, v.name)}
              activeOpacity={0.6}
            >
              <View>
                <Text style={[styles.versionName, settings.bibleVersionId === v.id && styles.versionNameActive]}>
                  {v.name}
                </Text>
                <Text style={styles.versionLabel}>{v.label}</Text>
              </View>
              {settings.bibleVersionId === v.id && (
                <Ionicons name="checkmark" size={20} color={COLORS.gold} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Bookmarks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bookmarks ({bookmarks.length})</Text>
          {bookmarks.length === 0 ? (
            <Text style={styles.emptyText}>No bookmarks yet. Long press any verse to bookmark it.</Text>
          ) : (
            bookmarks.map((bm) => (
              <TouchableOpacity
                key={bm.verseId}
                style={styles.bookmarkRow}
                activeOpacity={0.6}
                onPress={() => handleBookmarkPress(bm)}
                onLongPress={() => handleRemoveBookmark(bm.verseId)}
              >
                <View style={styles.bookmarkContent}>
                  <Text style={styles.bookmarkRef}>{bm.reference}</Text>
                  <Text style={styles.bookmarkText} numberOfLines={2}>{bm.content}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.inkFaint} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Cache */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offline Cache</Text>
          <View style={styles.cacheRow}>
            <Text style={styles.cacheText}>{cacheCount} chapters cached</Text>
            <TouchableOpacity onPress={handleClearCache} activeOpacity={0.6}>
              <Text style={styles.clearCacheText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={[styles.section, { alignItems: 'center', paddingVertical: 32 }]}>
          <Text style={styles.aboutText}>Swell Bible</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: COLORS.ink },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  section: { paddingHorizontal: 24, paddingTop: 28 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: COLORS.inkFaint, marginBottom: 16 },
  fontSizeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 16 },
  fontSizeBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  fontSizeBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.ink },
  fontSizePreview: { fontSize: 16, fontWeight: '500', color: COLORS.inkLight, minWidth: 50, textAlign: 'center' },
  previewText: { color: COLORS.ink, opacity: 0.8, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 16 },
  versionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  versionRowActive: { borderColor: COLORS.gold, backgroundColor: '#FFFDF7' },
  versionName: { fontSize: 16, fontWeight: '700', color: COLORS.ink, marginBottom: 2 },
  versionNameActive: { color: COLORS.gold },
  versionLabel: { fontSize: 13, color: COLORS.inkLight },
  bookmarkRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  bookmarkContent: { flex: 1 },
  bookmarkRef: { fontSize: 13, fontWeight: '700', color: COLORS.gold, letterSpacing: 0.5, marginBottom: 2 },
  bookmarkText: { fontSize: 14, lineHeight: 20, color: COLORS.inkLight },
  emptyText: { fontSize: 14, color: COLORS.inkFaint, fontStyle: 'italic' },
  cacheRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cacheText: { fontSize: 15, color: COLORS.ink },
  clearCacheText: { fontSize: 13, fontWeight: '600', color: COLORS.red },
  aboutText: { fontSize: 16, fontWeight: '600', color: COLORS.ink, marginBottom: 4 },
  aboutVersion: { fontSize: 13, color: COLORS.inkFaint },
});
