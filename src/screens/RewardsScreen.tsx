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
import SimpleHeader from '../components/SimpleHeader';
import { COLORS } from '../constants/colors';

interface DailyTaskProps {
  title: string;
  reward: string;
  completed: boolean;
  delay: number;
}

interface AchievementProps {
  icon: string;
  title: string;
  description: string;
  reward: string;
  delay: number;
}

const DailyTask = ({ title, reward, completed, delay }: DailyTaskProps) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.taskCard,
        completed && styles.taskCardCompleted,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.taskLeft}>
        <View style={[styles.taskCheckbox, completed && styles.taskCheckboxCompleted]}>
          {completed && <Ionicons name="checkmark" size={18} color={COLORS.white} />}
        </View>
        <Text style={[styles.taskTitle, completed && styles.taskTitleCompleted]}>
          {title}
        </Text>
      </View>
      <Text style={styles.taskReward}>{reward}</Text>
    </Animated.View>
  );
};

const Achievement = ({ icon, title, description, reward, delay }: AchievementProps) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.achievementCard,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={styles.achievementIcon}>
        <Ionicons name={icon as any} size={28} color={COLORS.primary} />
      </View>
      <View style={styles.achievementContent}>
        <Text style={styles.achievementTitle}>{title}</Text>
        <Text style={styles.achievementDescription}>{description}</Text>
      </View>
      <Text style={styles.achievementReward}>{reward}</Text>
    </Animated.View>
  );
};

export default function RewardsScreen() {
  const streakDays = 7;
  const maxStreak = 7;

  return (
    <View style={styles.container}>
      <SimpleHeader balance={135.5} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>135.5 SWELL</Text>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Earned Reading</Text>
              <Text style={styles.breakdownAmount}>60.0</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Donated</Text>
              <Text style={styles.breakdownAmount}>15.0</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <View style={styles.streakIcon}>
              <Ionicons name="flame" size={24} color={COLORS.secondary} />
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakTitle}>Reading Streak</Text>
              <Text style={styles.streakSubtitle}>Keep it going!</Text>
            </View>
            <Text style={styles.streakCount}>{streakDays}</Text>
          </View>
          <View style={styles.streakBars}>
            {[...Array(maxStreak)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.streakBar,
                  i < streakDays && styles.streakBarActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={20} color={COLORS.textPurple} />
            <Text style={styles.sectionTitle}>Daily Tasks</Text>
          </View>

          <DailyTask
            title="Read 1 Chapter"
            reward="+5 SWELL"
            completed={true}
            delay={0}
          />
          <DailyTask
            title="Share a Verse"
            reward="+2 SWELL"
            completed={false}
            delay={100}
          />
          <DailyTask
            title="Support Someone"
            reward="+10 SWELL"
            completed={false}
            delay={200}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={20} color={COLORS.textPurple} />
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>

          <Achievement
            icon="book"
            title="First Chapter"
            description="Read your first chapter"
            reward="+5"
            delay={0}
          />
          <Achievement
            icon="flame"
            title="Week Warrior"
            description="7 day reading streak"
            reward="+25"
            delay={100}
          />
        </View>
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
  balanceCard: {
    margin: 20,
    marginTop: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 24,
  },
  breakdownRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  breakdownAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  streakCard: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    marginBottom: 24,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FEF3C7',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  streakSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  streakCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  streakBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  streakBarActive: {
    backgroundColor: COLORS.secondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPurple,
    marginLeft: 8,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  taskCardCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: COLORS.accent,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskCheckboxCompleted: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  taskTitleCompleted: {
    color: COLORS.accent,
  },
  taskReward: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E9D5FF',
  },
  achievementIcon: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPurple,
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  achievementReward: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
});
