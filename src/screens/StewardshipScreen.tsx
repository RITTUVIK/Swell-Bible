import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { getSavedWallet, saveWallet, disconnectWallet } from '../services/walletContext';
import { PublicKey } from '@solana/web3.js';
import { getSwellBalance } from '../solana/balance';

/**
 * Mission / parish data.
 */
const MISSIONS = [
  {
    id: 'paisios',
    title: 'St. Paisios Monastery',
    description: 'Support for the ongoing construction of the main catholicon and housing for the monastic brotherhood.',
    funded: '70%',
    wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', // example recipient
  },
  {
    id: 'orphanage',
    title: 'Hope Orphanage Sustenance',
    description: 'Monthly food and medical supplies for the children of the Holy Cross Mission.',
    funded: '45%',
    wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  },
  {
    id: 'swahili',
    title: 'Swahili Scripture Project',
    description: 'Translation and printing of Orthodox prayer books and the New Testament into Swahili dialects.',
    funded: '25%',
    wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  },
  {
    id: 'manuscript',
    title: 'Ancient Manuscript Preservation',
    description: 'Digital archiving and restorative care for 14th-century liturgical scrolls from Mount Athos.',
    funded: '92%',
    wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  },
];

interface DonateModalState {
  visible: boolean;
  missionTitle: string;
  missionWallet: string;
}

export default function StewardshipScreen({ navigation }: any) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [connectInput, setConnectInput] = useState('');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [donateModal, setDonateModal] = useState<DonateModalState>({
    visible: false,
    missionTitle: '',
    missionWallet: '',
  });
  const [donateAmount, setDonateAmount] = useState('');

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    const unsub = navigation?.addListener?.('focus', loadWallet);
    return unsub;
  }, [navigation]);

  const loadWallet = async () => {
    const wallet = await getSavedWallet();
    if (wallet.connected && wallet.address) {
      setWalletAddress(wallet.address);
      fetchBalance(wallet.address);
    }
  };

  const fetchBalance = async (address: string) => {
    setLoadingBalance(true);
    try {
      const pubkey = new PublicKey(address);
      const result = await getSwellBalance(pubkey);
      setBalance(result.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } catch {
      // Solana RPC may not be available — show 0
      setBalance('0.00');
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleConnect = async () => {
    const address = connectInput.trim();
    if (!address || address.length < 32) {
      Alert.alert('Invalid Address', 'Please enter a valid Solana wallet address.');
      return;
    }
    await saveWallet(address);
    setWalletAddress(address);
    setShowConnectModal(false);
    setConnectInput('');
    fetchBalance(address);
  };

  const handleDisconnect = () => {
    Alert.alert('Disconnect Wallet', 'Remove your wallet from this app?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await disconnectWallet();
          setWalletAddress(null);
          setBalance(null);
        },
      },
    ]);
  };

  const handleDonate = (mission: typeof MISSIONS[0]) => {
    if (!walletAddress) {
      setShowConnectModal(true);
      return;
    }
    setDonateModal({
      visible: true,
      missionTitle: mission.title,
      missionWallet: mission.wallet,
    });
    setDonateAmount('');
  };

  const confirmDonate = () => {
    const amount = parseFloat(donateAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid SWELL amount.');
      return;
    }

    Alert.alert(
      'Confirm Donation',
      `Send ${amount} SWELL to ${donateModal.missionTitle}?\n\nNote: Transaction signing requires the Seeker wallet.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            setDonateModal({ visible: false, missionTitle: '', missionWallet: '' });
            Alert.alert(
              'Wallet Required',
              'SWELL transfers require the Seeker wallet SDK for transaction signing. This feature will be available when running on the Seeker phone.'
            );
          },
        },
      ]
    );
  };

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} activeOpacity={0.6}>
          <Ionicons name="chevron-back" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stewardship Ledger</Text>
        {walletAddress ? (
          <TouchableOpacity onPress={handleDisconnect} activeOpacity={0.6}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.inkLight} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance */}
        <View style={styles.balanceSection}>
          {walletAddress ? (
            <>
              <Text style={styles.balanceLabel}>Current Stewardship Balance</Text>
              {loadingBalance ? (
                <ActivityIndicator size="small" color={COLORS.gold} style={{ marginVertical: 20 }} />
              ) : (
                <Text style={styles.balanceAmount}>{balance || '0.00'}</Text>
              )}
              <Text style={styles.balanceCurrency}>SWELL</Text>
              <Text style={styles.walletBadge}>{shortAddress}</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton} activeOpacity={0.6}>
                  <Text style={styles.actionText}>Deposit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.6}
                  onPress={() => {
                    if (walletAddress) fetchBalance(walletAddress);
                  }}
                >
                  <Text style={styles.actionText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.balanceLabel}>Connect Your Wallet</Text>
              <Text style={styles.connectDesc}>
                Link your Solana wallet to view your SWELL balance and donate to missions.
              </Text>
              <TouchableOpacity
                style={styles.connectButton}
                activeOpacity={0.6}
                onPress={() => setShowConnectModal(true)}
              >
                <Ionicons name="wallet-outline" size={18} color={COLORS.white} />
                <Text style={styles.connectButtonText}>Connect Wallet</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Missions */}
        <View style={styles.missionsSection}>
          <Text style={styles.missionsLabel}>Active Missions & Parishes</Text>

          {MISSIONS.map((mission, idx) => (
            <View
              key={mission.id}
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
                  onPress={() => handleDonate(mission)}
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

      {/* Connect Wallet Modal */}
      <Modal
        visible={showConnectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConnectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Connect Wallet</Text>
            <Text style={styles.modalDesc}>
              Enter your Solana wallet address to view your SWELL balance.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Solana wallet address"
              placeholderTextColor={COLORS.inkFaint}
              value={connectInput}
              onChangeText={setConnectInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowConnectModal(false)}
                activeOpacity={0.6}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleConnect}
                activeOpacity={0.6}
              >
                <Text style={styles.modalConfirmText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Donate Modal */}
      <Modal
        visible={donateModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setDonateModal({ visible: false, missionTitle: '', missionWallet: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Donate SWELL</Text>
            <Text style={styles.modalDesc}>
              Send SWELL tokens to {donateModal.missionTitle}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Amount (e.g. 10.00)"
              placeholderTextColor={COLORS.inkFaint}
              value={donateAmount}
              onChangeText={setDonateAmount}
              keyboardType="decimal-pad"
            />
            {balance && (
              <Text style={styles.modalBalance}>
                Balance: {balance} SWELL
              </Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setDonateModal({ visible: false, missionTitle: '', missionWallet: '' })}
                activeOpacity={0.6}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={confirmDonate}
                activeOpacity={0.6}
              >
                <Text style={styles.modalConfirmText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  walletBadge: {
    fontSize: 11,
    color: COLORS.inkFaint,
    letterSpacing: 1,
    marginTop: 8,
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
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

  // Connect state
  connectDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.inkLight,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.ink,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.white,
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

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.inkLight,
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.ink,
    backgroundColor: COLORS.bg,
    marginBottom: 12,
  },
  modalBalance: {
    fontSize: 12,
    color: COLORS.inkFaint,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalCancel: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.inkLight,
  },
  modalConfirm: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});
