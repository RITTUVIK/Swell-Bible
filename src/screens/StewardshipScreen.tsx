import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Clipboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import {
  getSavedWallet,
  disconnectWallet,
  createEmbeddedWallet,
  getEmbeddedSecretKey,
  saveExternalWallet,
  WalletType,
} from '../services/walletContext';
import { connectPhantom, isPhantomInstalled } from '../services/phantomConnect';
import { PublicKey } from '@solana/web3.js';
import { getSwellBalance } from '../solana/balance';
import { getStreakData } from '../services/streaks';
import {
  getRewardEligibility,
  claimTodaysReward,
  type RewardEligibility,
} from '../services/dailyReward';

/**
 * Missions will be fetched from a real backend in the future.
 */
const MISSIONS: { id: string; title: string; description: string; funded: string; wallet: string }[] = [];

interface DonateModalState {
  visible: boolean;
  missionTitle: string;
  missionWallet: string;
}

export default function StewardshipScreen({ navigation }: any) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [connectingPhantom, setConnectingPhantom] = useState(false);
  const [donateModal, setDonateModal] = useState<DonateModalState>({
    visible: false,
    missionTitle: '',
    missionWallet: '',
  });
  const [donateAmount, setDonateAmount] = useState('');
  const [appStreak, setAppStreak] = useState({ current: 0, best: 0 });
  const [guidedStreak, setGuidedStreak] = useState({ current: 0, best: 0 });
  const [appDates, setAppDates] = useState<string[]>([]);
  const [guidedDates, setGuidedDates] = useState<string[]>([]);
  const [displayedYear, setDisplayedYear] = useState(() => new Date().getFullYear());
  const [displayedMonth, setDisplayedMonth] = useState(() => new Date().getMonth());
  const [rewardEligibility, setRewardEligibility] = useState<RewardEligibility | null>(null);
  const [claimingReward, setClaimingReward] = useState(false);
  const [claimSuccessToday, setClaimSuccessToday] = useState(false);
  const [backupKeyModalVisible, setBackupKeyModalVisible] = useState(false);
  const [backupKeyCopied, setBackupKeyCopied] = useState(false);
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
  const backupKeyRef = useRef<string | null>(null);

  useEffect(() => {
    loadWallet();
    loadStreaks();
  }, []);

  useEffect(() => {
    const unsub = navigation?.addListener?.('focus', () => {
      loadWallet();
      loadStreaks();
    });
    return unsub;
  }, [navigation]);

  const loadStreaks = async () => {
    const data = await getStreakData();
    setAppStreak(data.app);
    setGuidedStreak(data.guided);
    setAppDates(data.appDates);
    setGuidedDates(data.guidedDates);
  };

  // Calendar: 6 rows × 7 cols (S M T W T F S). Uses displayed month/year.
  const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const weekLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthGrid = (() => {
    const year = displayedYear;
    const month = displayedMonth;
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startWeekday = first.getDay();
    const daysInMonth = last.getDate();
    const cells: { dayNum: number | null; dateStr: string | null; isToday: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      if (i < startWeekday || i >= startWeekday + daysInMonth) {
        cells.push({ dayNum: null, dateStr: null, isToday: false });
      } else {
        const day = i - startWeekday + 1;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = year === currentYear && month === currentMonth && now.getDate() === day;
        cells.push({ dayNum: day, dateStr, isToday });
      }
    }
    return cells;
  })();
  const appSet = new Set(appDates);
  const guidedSet = new Set(guidedDates);
  const currentMonthLabel = `${monthNames[displayedMonth]} ${displayedYear}`;
  const canGoForward = displayedYear < currentYear || (displayedYear === currentYear && displayedMonth < currentMonth);
  const goPrevMonth = () => {
    if (displayedMonth === 0) {
      setDisplayedMonth(11);
      setDisplayedYear(displayedYear - 1);
    } else {
      setDisplayedMonth(displayedMonth - 1);
    }
  };
  const goNextMonth = () => {
    if (!canGoForward) return;
    if (displayedMonth === 11) {
      setDisplayedMonth(0);
      setDisplayedYear(displayedYear + 1);
    } else {
      setDisplayedMonth(displayedMonth + 1);
    }
  };

  const loadWallet = async () => {
    const wallet = await getSavedWallet();
    if (wallet.connected && wallet.address) {
      setWalletAddress(wallet.address);
      setWalletType(wallet.type);
      fetchBalance(wallet.address);
    } else {
      setWalletAddress(null);
      setWalletType(null);
      setBalance(null);
      setBalanceError(false);
    }
    const eligibility = await getRewardEligibility(wallet.connected && !!wallet.address);
    setRewardEligibility(eligibility);
    setClaimSuccessToday(eligibility.reason === 'already_claimed');
  };

  const fetchBalance = async (address: string) => {
    setLoadingBalance(true);
    setBalanceError(false);
    try {
      const pubkey = new PublicKey(address);
      const result = await getSwellBalance(pubkey);
      setBalance(result.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } catch {
      setBalanceError(true);
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  // ---- Create Embedded Wallet ----
  const handleCreateWallet = useCallback(async () => {
    setCreatingWallet(true);
    try {
      const address = await createEmbeddedWallet();
      setWalletAddress(address);
      setWalletType('embedded');
      setShowConnectModal(false);
      fetchBalance(address);

      // Show backup prompt
      Alert.alert(
        'Wallet Created',
        `Your new wallet address:\n\n${address.slice(0, 16)}...${address.slice(-8)}\n\nIMPORTANT: Back up your private key from Settings to avoid losing access.`,
        [{ text: 'Got it' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create wallet. Please try again.');
    } finally {
      setCreatingWallet(false);
    }
  }, []);

  // ---- Connect Phantom ----
  const handleConnectPhantom = useCallback(async () => {
    setConnectingPhantom(true);
    try {
      const installed = await isPhantomInstalled();
      if (!installed) {
        Alert.alert(
          'Phantom Not Installed',
          'Phantom wallet needs to be installed on a real Android device (not an emulator).\n\nYou can use "Create New Wallet" instead, or install Phantom from the Google Play Store on a physical device.',
          [{ text: 'OK' }]
        );
        return;
      }
      await connectPhantom();
      setShowConnectModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to open Phantom wallet. Please try again.');
    } finally {
      setConnectingPhantom(false);
    }
  }, []);

  // Clipboard that works on web (navigator.clipboard) and native
  const copyToClipboard = useCallback(async (text: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      Clipboard.setString(text);
    }
  }, []);

  // ---- Disconnect (in-app modal on all platforms) ----
  const handleDisconnect = useCallback(() => {
    setDisconnectModalVisible(true);
  }, []);

  const confirmDisconnect = useCallback(async () => {
    await disconnectWallet();
    setWalletAddress(null);
    setWalletType(null);
    setBalance(null);
    setBalanceError(false);
    setDisconnectModalVisible(false);
  }, []);

  const disconnectMessage =
    walletType === 'embedded'
      ? 'Disconnect your wallet? Make sure you have backed up your private key first.'
      : 'Remove this wallet connection from the app?';

  // ---- Copy Address ----
  const handleCopyAddress = useCallback(() => {
    if (walletAddress) {
      copyToClipboard(walletAddress);
      Alert.alert('Copied', 'Wallet address copied to clipboard.');
    }
  }, [walletAddress, copyToClipboard]);

  // ---- Export Key (in-app modal on all platforms) ----
  const handleExportKey = useCallback(async () => {
    if (walletType !== 'embedded') return;
    const secretKey = await getEmbeddedSecretKey();
    if (!secretKey) return;
    backupKeyRef.current = secretKey;
    setBackupKeyCopied(false);
    setBackupKeyModalVisible(true);
  }, [walletType]);

  const handleBackupKeyCopy = useCallback(async () => {
    if (!backupKeyRef.current) return;
    await copyToClipboard(backupKeyRef.current);
    setBackupKeyCopied(true);
  }, [copyToClipboard]);

  const closeBackupKeyModal = useCallback(() => {
    setBackupKeyModalVisible(false);
    backupKeyRef.current = null;
    setBackupKeyCopied(false);
  }, []);

  // ---- Donate ----
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
      `Send ${amount} SWELL to ${donateModal.missionTitle}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            setDonateModal({ visible: false, missionTitle: '', missionWallet: '' });
            if (walletType === 'embedded') {
              Alert.alert('Coming Soon', 'Transaction signing for embedded wallets is coming soon.');
            } else {
              Alert.alert('External Wallet', 'Please confirm the transaction in your wallet app.');
            }
          },
        },
      ]
    );
  };

  const handleClaimReward = useCallback(async () => {
    if (rewardEligibility?.reason !== 'eligible') return;
    setClaimingReward(true);
    try {
      await claimTodaysReward();
      setClaimSuccessToday(true);
      setRewardEligibility(await getRewardEligibility(!!walletAddress));
    } finally {
      setClaimingReward(false);
    }
  }, [rewardEligibility?.reason, walletAddress]);

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
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
              ) : balanceError ? (
                <Text style={styles.balanceError}>Unable to fetch balance</Text>
              ) : (
                <>
                  <Text style={styles.balanceAmount}>{balance ?? '0.00'}</Text>
                  <Text style={styles.balanceCurrency}>SWELL</Text>
                </>
              )}

              <TouchableOpacity onPress={handleCopyAddress} activeOpacity={0.6}>
                <View style={styles.walletBadgeRow}>
                  <Text style={styles.walletBadge}>{shortAddress}</Text>
                  {walletType === 'embedded' && (
                    <View style={styles.walletTypeBadge}>
                      <Text style={styles.walletTypeText}>In-App</Text>
                    </View>
                  )}
                  {walletType === 'external' && (
                    <View style={[styles.walletTypeBadge, styles.walletTypeBadgeExternal]}>
                      <Text style={styles.walletTypeText}>Phantom</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.actionRow}>
                {walletType === 'embedded' && (
                  <TouchableOpacity style={styles.actionButton} activeOpacity={0.6} onPress={handleExportKey}>
                    <Text style={styles.actionText}>Backup Key</Text>
                  </TouchableOpacity>
                )}
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
              <Ionicons name="wallet-outline" size={48} color={COLORS.inkFaint} style={{ marginBottom: 16 }} />
              <Text style={styles.balanceLabel}>Connect Your Wallet</Text>
              <Text style={styles.connectDesc}>
                Create a new wallet or connect an existing one to manage your SWELL tokens.
              </Text>
              <TouchableOpacity
                style={styles.connectButton}
                activeOpacity={0.6}
                onPress={() => setShowConnectModal(true)}
              >
                <Ionicons name="wallet-outline" size={18} color={COLORS.white} />
                <Text style={styles.connectButtonText}>Get Started</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Daily Reading Reward — claim UI only; intro copy lives on Home panel. */}
        <View style={styles.dailyRewardSection}>
          <View style={styles.dailyRewardCard}>
            {rewardEligibility == null ? (
              <ActivityIndicator size="small" color={COLORS.gold} style={{ marginTop: 12 }} />
            ) : rewardEligibility.reason === 'wallet_not_connected' ? (
              <Text style={styles.dailyRewardMessage}>Connect a wallet to claim your reward.</Text>
            ) : rewardEligibility.reason === 'reading_not_completed' ? (
              <Text style={styles.dailyRewardMessage}>Reading completed for today will unlock the claim button.</Text>
            ) : rewardEligibility.reason === 'already_claimed' || claimSuccessToday ? (
              <View style={styles.dailyRewardSuccessRow}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.gold} />
                <Text style={styles.dailyRewardSuccessText}>1 SWELL earned today.</Text>
              </View>
            ) : rewardEligibility.reason === 'eligible' ? (
              <>
                <Text style={styles.dailyRewardMessage}>Reading completed for today.</Text>
                <TouchableOpacity
                  style={styles.dailyRewardClaimButton}
                  onPress={handleClaimReward}
                  disabled={claimingReward}
                  activeOpacity={0.7}
                >
                  {claimingReward ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.dailyRewardClaimButtonText}>Claim Today's SWELL</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>

        {/* Streaks — reference style: pill title, headline, full month calendar, CTA card */}
        <View style={styles.streaksSection}>
          <View style={styles.streaksCard}>
            <View style={styles.streaksPill}>
              <Text style={styles.streaksPillText}>Reading Streaks</Text>
            </View>
            <View style={styles.streaksHeadlineBlock}>
              <View style={styles.streaksHeadlineRow}>
                <View style={styles.streaksHeadlineIcon}>
                  <Ionicons name="flame-outline" size={24} color={COLORS.gold} />
                </View>
                <Text style={styles.streaksHeadlineLine}>
                  App streak: {appStreak.current} day{appStreak.current !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={[styles.streaksHeadlineRow, styles.streaksHeadlineRowLast]}>
                <View style={styles.streaksHeadlineIcon}>
                  <Ionicons name="book-outline" size={24} color={COLORS.inkLight} />
                </View>
                <Text style={styles.streaksHeadlineLine}>
                  Guided streak: {guidedStreak.current} day{guidedStreak.current !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <Text style={styles.streaksCalendarLabel}>Calendar</Text>
            <View style={styles.streaksMonthRow}>
              <TouchableOpacity
                style={styles.streaksMonthArrow}
                onPress={goPrevMonth}
                activeOpacity={0.6}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="chevron-back" size={20} color={COLORS.ink} />
              </TouchableOpacity>
              <Text style={styles.streaksMonthLabel}>{currentMonthLabel}</Text>
              <TouchableOpacity
                style={[styles.streaksMonthArrow, !canGoForward && styles.streaksMonthArrowDisabled]}
                onPress={goNextMonth}
                activeOpacity={0.6}
                disabled={!canGoForward}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="chevron-forward" size={20} color={canGoForward ? COLORS.ink : COLORS.inkFaint} />
              </TouchableOpacity>
            </View>
            <View style={styles.streaksWeekRow}>
              {weekLetters.map((letter, i) => (
                <Text key={i} style={styles.streaksWeekLetter}>{letter}</Text>
              ))}
            </View>
            <View style={styles.streaksGrid}>
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <View key={row} style={styles.streaksGridRow}>
                  {monthGrid.slice(row * 7, row * 7 + 7).map((cell, i) => {
                    const { dayNum, dateStr, isToday } = cell;
                    if (dayNum === null) {
                      return <View key={`empty-${row}-${i}`} style={styles.streaksDayCellEmpty} />;
                    }
                    const appDone = appSet.has(dateStr!);
                    const guidedDone = guidedSet.has(dateStr!);
                    return (
                      <View
                        key={dateStr}
                        style={[styles.streaksDayCell, styles.streaksDayCellPill, isToday && styles.streaksDayCellToday]}
                      >
                        <Text style={[styles.streaksDayNum, appDone && styles.streaksDayNumOnFill]}>
                          {dayNum}
                        </Text>
                        <View style={[styles.streaksDayHalf, styles.streaksDayTop, appDone ? styles.streaksDayDoneApp : null]} />
                        <View style={[styles.streaksDayHalf, styles.streaksDayBottom, guidedDone ? styles.streaksDayDoneGuided : null]} />
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            <View style={styles.streaksFooter}>
              <View style={styles.streaksLegendRow}>
                <View style={styles.streaksLegendItem}>
                  <View style={[styles.streaksLegendBar, styles.streaksLegendApp]} />
                  <Text style={styles.streaksLegendText}>App</Text>
                </View>
                <View style={styles.streaksLegendItem}>
                  <View style={[styles.streaksLegendBar, styles.streaksLegendGuided]} />
                  <Text style={styles.streaksLegendText}>Guided</Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.guidedCtaCard}
            activeOpacity={0.6}
            onPress={() => navigation?.navigate?.('GuidedScripture')}
          >
            <Ionicons name="book-outline" size={20} color={COLORS.gold} />
            <Text style={styles.guidedCtaCardText}>Start guided reflection to extend your streak</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.inkLight} />
          </TouchableOpacity>
        </View>

        {/* Missions */}
        <View style={styles.missionsSection}>
          <Text style={styles.missionsLabel}>Active Missions & Parishes</Text>

          {MISSIONS.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={40} color={COLORS.inkFaint} />
              <Text style={styles.emptyStateTitle}>No Active Missions</Text>
              <Text style={styles.emptyStateDesc}>
                Missions and parishes will appear here once they are available.
              </Text>
            </View>
          ) : (
            MISSIONS.map((mission, idx) => (
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
            ))
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Total Distributed to Date</Text>
        <Text style={styles.footerAmount}>0 SWELL</Text>
      </View>

      {/* ===== CONNECT WALLET MODAL ===== */}
      <Modal
        visible={showConnectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConnectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Connect Wallet</Text>
              <TouchableOpacity onPress={() => setShowConnectModal(false)} activeOpacity={0.6}>
                <Ionicons name="close" size={22} color={COLORS.inkLight} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>
              Choose how you'd like to connect your Solana wallet.
            </Text>

            {/* Option 1: Create Embedded Wallet */}
            <TouchableOpacity
              style={styles.walletOption}
              activeOpacity={0.7}
              onPress={handleCreateWallet}
              disabled={creatingWallet}
            >
              <View style={styles.walletOptionIcon}>
                <Ionicons name="add-circle-outline" size={28} color={COLORS.ink} />
              </View>
              <View style={styles.walletOptionContent}>
                <Text style={styles.walletOptionTitle}>Create New Wallet</Text>
                <Text style={styles.walletOptionDesc}>
                  Generate a new Solana wallet right in the app. No other apps needed.
                </Text>
              </View>
              {creatingWallet ? (
                <ActivityIndicator size="small" color={COLORS.ink} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={COLORS.inkFaint} />
              )}
            </TouchableOpacity>

            {/* Option 2: Connect Phantom */}
            <TouchableOpacity
              style={styles.walletOption}
              activeOpacity={0.7}
              onPress={handleConnectPhantom}
              disabled={connectingPhantom}
            >
              <View style={[styles.walletOptionIcon, styles.phantomIcon]}>
                <Ionicons name="flash-outline" size={28} color="#AB9FF2" />
              </View>
              <View style={styles.walletOptionContent}>
                <Text style={styles.walletOptionTitle}>Connect Phantom</Text>
                <Text style={styles.walletOptionDesc}>
                  Link your existing Phantom wallet via mobile app.
                </Text>
              </View>
              {connectingPhantom ? (
                <ActivityIndicator size="small" color="#AB9FF2" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={COLORS.inkFaint} />
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.modalDivider} />

            <Text style={styles.modalFooterNote}>
              Your keys are stored locally on this device and never shared.
            </Text>
          </View>
        </View>
      </Modal>

      {/* ===== BACKUP KEY MODAL (in-app, no browser confirm) ===== */}
      <Modal
        visible={backupKeyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeBackupKeyModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Private Key Backup</Text>
              <TouchableOpacity onPress={closeBackupKeyModal} activeOpacity={0.6}>
                <Ionicons name="close" size={22} color={COLORS.inkLight} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>
              Your private key will be copied to clipboard. Store it safely and NEVER share it with anyone.
            </Text>
            {backupKeyCopied ? (
              <View style={styles.backupKeySuccessRow}>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.gold} />
                <Text style={styles.backupKeySuccessText}>Copied. Store it somewhere safe.</Text>
              </View>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={closeBackupKeyModal}
                activeOpacity={0.6}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleBackupKeyCopy}
                activeOpacity={0.6}
              >
                <Text style={styles.modalConfirmText}>Copy Key</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== DISCONNECT WALLET MODAL (in-app, no browser confirm) ===== */}
      <Modal
        visible={disconnectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDisconnectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Disconnect Wallet</Text>
              <TouchableOpacity onPress={() => setDisconnectModalVisible(false)} activeOpacity={0.6}>
                <Ionicons name="close" size={22} color={COLORS.inkLight} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>{disconnectMessage}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setDisconnectModalVisible(false)}
                activeOpacity={0.6}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, styles.disconnectConfirm]}
                onPress={confirmDisconnect}
                activeOpacity={0.6}
              >
                <Text style={styles.modalConfirmText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== DONATE MODAL ===== */}
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
            {balanceError ? (
              <Text style={styles.modalBalanceError}>Unable to fetch balance</Text>
            ) : balance != null ? (
              <Text style={styles.modalBalance}>
                Balance: {balance} SWELL
              </Text>
            ) : null}
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

  // Streaks — premium calendar-inspired
  streaksSection: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.bg,
  },
  streaksCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  streaksPill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  streaksPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.gold,
  },
  streaksHeadlineBlock: {
    marginBottom: 24,
  },
  streaksHeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  streaksHeadlineRowLast: {
    marginBottom: 0,
  },
  streaksHeadlineIcon: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streaksHeadlineLine: {
    fontSize: 22,
    fontWeight: '300',
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  streaksCalendarLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 4,
  },
  streaksMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  streaksMonthArrow: {
    padding: 4,
  },
  streaksMonthArrowDisabled: {
    opacity: 0.5,
  },
  streaksMonthLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.inkFaint,
  },
  streaksWeekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  streaksWeekLetter: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.inkFaint,
    textAlign: 'center',
  },
  streaksGrid: {
    marginBottom: 16,
  },
  streaksGridRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  streaksDayCell: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 36,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  streaksDayCellEmpty: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 36,
  },
  streaksDayCellPill: {
    borderRadius: 18,
  },
  streaksDayNum: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.inkLight,
    zIndex: 1,
    textAlign: 'center',
  },
  streaksDayNumOnFill: {
    color: COLORS.white,
  },
  streaksDayCellToday: {
    borderWidth: 2,
    borderColor: COLORS.ink,
  },
  streaksDayHalf: {
    flex: 1,
    minHeight: 2,
  },
  streaksDayTop: {
    backgroundColor: COLORS.borderLight,
  },
  streaksDayBottom: {
    backgroundColor: COLORS.borderLight,
  },
  streaksDayDoneApp: {
    backgroundColor: COLORS.gold,
  },
  streaksDayDoneGuided: {
    backgroundColor: COLORS.inkLight,
  },
  streaksFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  streaksLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streaksLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streaksLegendBar: {
    width: 16,
    height: 8,
    borderRadius: 2,
  },
  streaksLegendApp: {
    backgroundColor: COLORS.gold,
  },
  streaksLegendGuided: {
    backgroundColor: COLORS.inkLight,
  },
  streaksLegendText: {
    fontSize: 11,
    color: COLORS.inkFaint,
  },
  streaksTodayLabel: {
    fontSize: 11,
    color: COLORS.inkFaint,
    fontWeight: '500',
  },
  guidedCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  guidedCtaCardText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.ink,
    fontWeight: '500',
  },
  guidedCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  guidedCtaText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.gold,
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
  balanceError: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.inkLight,
    fontStyle: 'italic',
    marginVertical: 8,
  },
  dailyRewardSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dailyRewardCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dailyRewardMessage: {
    fontSize: 14,
    color: COLORS.ink,
    marginTop: 4,
  },
  dailyRewardSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  dailyRewardSuccessText: {
    fontSize: 14,
    color: COLORS.ink,
    fontWeight: '500',
  },
  dailyRewardClaimButton: {
    marginTop: 16,
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  dailyRewardClaimButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: COLORS.white,
  },
  walletBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  walletBadge: {
    fontSize: 11,
    color: COLORS.inkFaint,
    letterSpacing: 1,
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  walletTypeBadge: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  walletTypeBadgeExternal: {
    backgroundColor: '#AB9FF2',
  },
  walletTypeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.white,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.inkLight,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.inkLight,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.inkFaint,
    textAlign: 'center',
    paddingHorizontal: 24,
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

  // Modal shared
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    marginBottom: 24,
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 16,
  },
  modalFooterNote: {
    fontSize: 12,
    color: COLORS.inkFaint,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Wallet options
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginBottom: 12,
  },
  walletOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  phantomIcon: {
    backgroundColor: '#F0EDFF',
  },
  walletOptionContent: {
    flex: 1,
  },
  walletOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 2,
  },
  walletOptionDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.inkLight,
  },

  // Donate modal inputs
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
  modalBalanceError: {
    fontSize: 12,
    color: COLORS.inkLight,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  backupKeySuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backupKeySuccessText: {
    fontSize: 14,
    color: COLORS.ink,
    fontWeight: '500',
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
  disconnectConfirm: {
    backgroundColor: COLORS.red,
  },
});
