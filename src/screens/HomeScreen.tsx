import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { COLORS } from '../constants/colors';

export default function HomeScreen() {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <Header balance={135.5} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.welcomeCard}
          >
            <Text style={styles.welcomeTitle}>Welcome to Scripture Swell</Text>
            <Text style={styles.welcomeText}>
              Read the Bible, earn SWELL tokens, and support the community spreading the Gospel.
            </Text>
            <View style={styles.buttonRow}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>Start Reading</Text>
                </TouchableOpacity>
              </Animated.View>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Support Others</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="book" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Chapters Read</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="flame" size={24} color={COLORS.secondary} />
              </View>
              <Text style={styles.statNumber}>7</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="heart" size={24} color={COLORS.accent} />
              </View>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>People Helped</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How It Works</Text>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="book" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Read Scripture Daily</Text>
                <Text style={styles.featureText}>
                  Engage with the Bible and earn SWELL tokens as you read chapters and complete devotionals.
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="share-social" size={28} color={COLORS.secondary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Share Your Abundance</Text>
                <Text style={styles.featureText}>
                  Donate SWELL tokens to support fellow believers and ministry needs around the world.
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="hand-left" size={28} color={COLORS.accent} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Request Support</Text>
                <Text style={styles.featureText}>
                  In times of need, request help from the community. Transparent, peer-to-peer giving.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.verseCard}>
            <Text style={styles.verseLabel}>Verse of the Day</Text>
            <Text style={styles.verseText}>
              "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."
            </Text>
            <Text style={styles.verseReference}>— John 3:16</Text>
          </View>
        </Animated.View>
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
  welcomeCard: {
    margin: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  primaryButton: {
    backgroundColor: COLORS.secondary,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    marginHorizontal: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPurple,
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 19,
  },
  verseCard: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.secondary,
    marginBottom: 30,
  },
  verseLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPurple,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  verseText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: COLORS.textPurple,
    lineHeight: 24,
    marginBottom: 12,
  },
  verseReference: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'right',
  },
});
