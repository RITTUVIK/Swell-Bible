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

interface CommunityRequestProps {
  name: string;
  location: string;
  time: string;
  category: string;
  description: string;
  amount: string;
  delay: number;
}

const CommunityRequest = ({
  name,
  location,
  time,
  category,
  description,
  amount,
  delay,
}: CommunityRequestProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.requestCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.requestHeader}>
        <View>
          <Text style={styles.requestName}>{name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={COLORS.textLight} />
            <Text style={styles.locationText}>{location}</Text>
            <Ionicons name="time-outline" size={14} color={COLORS.textLight} style={{ marginLeft: 12 }} />
            <Text style={styles.timeText}>{time}</Text>
          </View>
        </View>
        <View>
          <Text style={styles.amountText}>{amount} SWELL</Text>
          <Text style={styles.neededText}>needed</Text>
        </View>
      </View>

      <View style={styles.categoryTag}>
        <Text style={styles.categoryText}>{category}</Text>
      </View>

      <Text style={styles.requestDescription}>{description}</Text>
    </Animated.View>
  );
};

export default function CommunityScreen() {
  const requests = [
    {
      name: 'Sarah M.',
      location: 'Kenya',
      time: '2h ago',
      category: 'Bible Study Materials',
      description: 'Starting a youth Bible study group and need materials for 15 students.',
      amount: '25',
      delay: 0,
    },
    {
      name: 'Pastor John',
      location: 'Philippines',
      time: '5h ago',
      category: 'Church Building Fund',
      description: 'Building a small chapel to serve our growing rural community.',
      amount: '100',
      delay: 100,
    },
    {
      name: 'Maria L.',
      location: 'Brazil',
      time: '1d ago',
      category: 'Mission Trip Support',
      description: 'Traveling to remote villages to share the Gospel and distribute Bibles.',
      amount: '50',
      delay: 200,
    },
  ];

  return (
    <View style={styles.container}>
      <SimpleHeader balance={135.5} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>135.5 SWELL</Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.giveSupportButton} activeOpacity={0.8}>
              <Ionicons name="heart" size={20} color={COLORS.white} />
              <Text style={styles.giveSupportText}>Give Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.requestHelpButton} activeOpacity={0.8}>
              <Ionicons name="hand-left-outline" size={20} color={COLORS.primary} />
              <Text style={styles.requestHelpText}>Request Help</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.requestsSection}>
          <Text style={styles.sectionTitle}>Community Requests</Text>
          {requests.map((request, index) => (
            <CommunityRequest key={index} {...request} />
          ))}
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
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  giveSupportButton: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  giveSupportText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  requestHelpButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  requestHelpText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  requestsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPurple,
    marginBottom: 16,
  },
  requestCard: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPurple,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  timeText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.secondary,
    textAlign: 'right',
  },
  neededText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'right',
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPurple,
  },
  requestDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
});
