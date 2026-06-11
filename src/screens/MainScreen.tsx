import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  AccessibilityInfo,
  Platform,
  Animated as RNAnimated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppState as RNAppState } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Session } from '@supabase/supabase-js';
import { AppState, getTodayRecord, loadState, logNo } from '../store/storage';
import { cloudLogNo } from '../store/cloudStorage';
import NOButton from '../components/NOButton';
import BloomOverlay, { BloomPhase } from '../components/BloomOverlay';
import BreathTextOverlay from '../components/BreathTextOverlay';
import MilestoneOverlay, { isMilestoneCount } from '../components/MilestoneOverlay';
import { COLORS, ANIM_DURATIONS } from '../constants/noLogAnimation';

type Props = {
  onSlipPress: (todayNOs: number) => void;
  refreshKey: number;
  onNOLogged?: () => void;
  session?: Session | null;
  onSettingsPress?: () => void;
};

export default function MainScreen({ onSlipPress, refreshKey, onNOLogged, session, onSettingsPress }: Props) {
  const [appState, setAppState] = useState<AppState>({ lifetimeNoCount: 0, dailyRecords: [] });
  const [phase, setPhase] = useState<BloomPhase>('IDLE');
  const [celebratingLifetime, setCelebratingLifetime] = useState<number>(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdProgress = useRef(new RNAnimated.Value(0)).current;

  const todayCount = getTodayRecord(appState).noCount;
  const counterScale = useSharedValue(1);
  const [todayLabelTop, setTodayLabelTop] = useState<number | null>(null);
  const todayLabelRef = useRef<Text>(null);

  const reload = useCallback(async () => {
    const s = await loadState();
    setAppState(s);
  }, []);

  useEffect(() => { reload(); }, [refreshKey]);

  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (state) => {
      if (state === 'active') reload();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const mq = (window as any).matchMedia?.('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq?.matches ?? false);
    } else {
      AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    }
  }, []);

  function clearPhaseTimer() {
    if (phaseTimer.current) {
      clearTimeout(phaseTimer.current);
      phaseTimer.current = null;
    }
  }

  function handleHoldStart() {
    if (phase !== 'IDLE') return;
    setPhase('HOLDING');
  }

  function handleHoldCancel() {
    clearPhaseTimer();
    setPhase('IDLE');
  }

  async function handleConfirmed() {
    clearPhaseTimer();
    setPhase('BLOOM');

    // Persist in parallel with bloom animation
    const s = await logNo();
    setAppState(s);
    onNOLogged?.();
    if (session?.user?.id) {
      cloudLogNo(session.user.id).catch(() => {});
    }

    const milestone = isMilestoneCount(s.lifetimeNoCount);

    phaseTimer.current = setTimeout(() => {
      if (milestone) {
        setCelebratingLifetime(s.lifetimeNoCount);
        setPhase('CELEBRATE');
        // No auto-advance — user must dismiss via X
      } else {
        setPhase('DWELL');
        phaseTimer.current = setTimeout(() => {
          setPhase('RECEDE');
          phaseTimer.current = setTimeout(() => {
            setPhase('IDLE');
          }, ANIM_DURATIONS.RECEDE);
        }, ANIM_DURATIONS.DWELL);
      }
    }, ANIM_DURATIONS.BLOOM);

    // Spring-bounce counter: damping ~0.55 → single clean overshoot, ~1 bounce
    if (!reducedMotion) {
      counterScale.value = withSpring(1.3, { damping: 14, stiffness: 200 }, () => {
        'worklet';
        counterScale.value = withSpring(1, { damping: 18, stiffness: 220 });
      });
    }
  }

  function handleMilestoneDismiss() {
    clearPhaseTimer();
    setPhase('RECEDE');
    phaseTimer.current = setTimeout(() => {
      setPhase('IDLE');
      setCelebratingLifetime(0);
    }, ANIM_DURATIONS.RECEDE);
  }

  const counterAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterScale.value }],
  }));

  const locked = phase !== 'IDLE' && phase !== 'HOLDING';

  return (
    <View style={styles.root}>
      <StatusBar barStyle={locked ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Top row */}
          <View style={styles.topRow}>
            <View style={styles.lifetimeBlock}>
              <Text style={styles.lifetimeLabel}>LIFETIME</Text>
              <Text style={styles.lifetimeCount}>{appState.lifetimeNoCount}</Text>
            </View>
            {onSettingsPress && (
              <TouchableOpacity onPress={onSettingsPress} style={styles.accountBtn}>
                <Ionicons name="settings-outline" size={20} color={COLORS.TEXT_FAINT} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.centerBlock}>
            <Text
              ref={todayLabelRef}
              style={styles.todayLabel}
              onLayout={() => {
                todayLabelRef.current?.measureInWindow((_x, y) => {
                  setTodayLabelTop(y);
                });
              }}
            >
              TODAY
            </Text>
            <Animated.Text style={[styles.todayCount, counterAnimStyle]}>
              {todayCount}
            </Animated.Text>
            <View>
              <NOButton
                onHoldStart={handleHoldStart}
                onHoldCancel={handleHoldCancel}
                onConfirmed={handleConfirmed}
                locked={locked}
                holdProgress={holdProgress}
              />
            </View>
            <Text style={styles.hint}>hold 1.5 s to log</Text>
          </View>

          <TouchableOpacity
            style={styles.slipButton}
            onPress={() => onSlipPress(todayCount)}
            activeOpacity={0.6}
            disabled={locked}
          >
            <Text style={styles.slipLabel}>I slipped</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Full-screen bloom overlay — rendered outside SafeAreaView to cover status bar area */}
      <BloomOverlay phase={phase} reducedMotion={reducedMotion} />

      {/* Breath text above bloom */}
      <BreathTextOverlay phase={phase} anchorTop={todayLabelTop} isMilestone={celebratingLifetime > 0} />

      {/* Milestone celebration — sits on top of bloom */}
      <MilestoneOverlay
        phase={phase}
        lifetimeCount={celebratingLifetime}
        onDismiss={handleMilestoneDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.BG_DEFAULT },
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 32 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', width: '100%', paddingHorizontal: 24 },
  lifetimeBlock: { alignItems: 'center', gap: 2, flex: 1 },
  lifetimeLabel: { fontSize: 11, letterSpacing: 3, color: COLORS.TEXT_FAINT, fontWeight: '600' },
  lifetimeCount: { fontSize: 28, color: COLORS.TEXT_DIM, fontWeight: '700' },
  accountBtn: { position: 'absolute', right: 24, top: 4, padding: 4 },
  centerBlock: { alignItems: 'center', gap: 12 },
  todayLabel: { fontSize: 11, letterSpacing: 3, color: COLORS.TEXT_DIM, fontWeight: '600' },
  todayCount: { fontSize: 72, color: COLORS.TEXT_ON_WHITE, fontWeight: '900', lineHeight: 80 },
  hint: { fontSize: 11, color: COLORS.TEXT_FAINT, marginTop: 8, letterSpacing: 1 },
  slipButton: { paddingVertical: 8, paddingHorizontal: 20 },
  slipLabel: { fontSize: 13, color: COLORS.TEXT_DIM, letterSpacing: 1 },
});
