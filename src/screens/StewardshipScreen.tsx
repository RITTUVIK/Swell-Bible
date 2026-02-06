import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

/**
 * Mission / parish data (mock).
 */
const MISSIONS = [
  {
    title: 'St. Paisios Monastery',
    description: 'Support for the ongoing construction of the main catholicon and housing for the monastic brotherhood.',
    funded: '70%',
  },
  {
    title: 'Hope Orphanage Sustenance',
    description: 'Monthly food and medical supplies for the children of the Holy Cross Mission.',
    funded: '45%',
  },
  {
    title: 'Swahili Scripture Project',
    description: 'Translation and printing of Orthodox prayer books and the New Testament into Swahili dialects.',
    funded: '25%',
  },
  {
    title: 'Ancient Manuscript Preservation',
    description: 'Digital archiving and restorative care for 14th-century liturgical scrolls from Mount Athos.',
    funded: '92%',
  },
];

export default function StewardshipScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stewardship Ledger</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Current Stewardship Balance</Text>
          <Text style={styles.balanceAmount}>2,450.00</Text>
          <Text style={styles.balanceCurrency}>SWELL</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.6}>
              <Text style={styles.actionText}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.6}>
              <Text style={styles.actionText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Missions */}
        <View style={styles.missionsSection}>
          <Text style={styles.missionsLabel}>Active Missions & Parishes</Text>

          {MISSIONS.map((mission, idx) => (
            <View
              key={idx}
              style={[
                styles.missionRow,
                idx < MISSIONS.length - 1 && styles.missionBorder,
              ]}
            >
              <View style={styles.missionContent}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <Text style={styles.missionDescription}>
                  {mission.description}
                </Text>
              </View>
              <View style={styles.missionRight}>
                <Text style={styles.fundedText}>{mission.funded} Funded</Text>
                <TouchableOpacity
                  style={styles.donateButton}
                  activeOpacity={0.6}
                >
                  <Text style={styles.donateText}>Donate</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.viewRegistry} activeOpacity={0.5}>
            <Text style={styles.viewRegistryText}>View Full Registry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Total Distributed to Date</Text>
        <Text style={styles.footerAmount}>142,800 SWELL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: COLORS.ink,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Balance
  balanceSection: {
    alignItems: 'center',
    paddingVertical: 48,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: COLORS.inkLight,
    marginBottom: 12,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '300',
    color: COLORS.ink,
    letterSpacing: -1,
  },
  balanceCurrency: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: COLORS.gold,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 32,
  },
  actionButton: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink,
    paddingBottom: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: COLORS.ink,
  },

  // Missions
  missionsSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  missionsLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: COLORS.inkLight,
    marginBottom: 24,
  },
  missionRow: {
    flexDirection: 'row',
    paddingVertical: 20,
  },
  missionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  missionContent: {
    flex: 1,
    paddingRight: 16,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 6,
  },
  missionDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.inkLight,
  },
  missionRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: 12,
  },
  fundedText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.inkLight,
  },
  donateButton: {
    borderWidth: 1,
    borderColor: COLORS.ink,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  donateText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.ink,
  },
  viewRegistry: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  viewRegistryText: {
    fontSize: 12,
    color: COLORS.inkLight,
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.border,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: COLORS.borderLight,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.inkLight,
  },
  footerAmount: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.ink,
  },
});
