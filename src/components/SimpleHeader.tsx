import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface SimpleHeaderProps {
  balance?: number;
}

export default function SimpleHeader({ balance = 135.5 }: SimpleHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.connectButton} activeOpacity={0.8}>
        <Ionicons name="wallet-outline" size={18} color={COLORS.primary} />
        <Text style={styles.connectText}>Connect Wallet</Text>
      </TouchableOpacity>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceAmount}>{Math.floor(balance)}</Text>
        <Text style={styles.balanceLabel}>SWELL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.background,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  connectText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPurple,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    marginLeft: 4,
  },
});
