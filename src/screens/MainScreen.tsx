import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { AppState as RNAppState } from 'react-native';
import { AppState, getTodayRecord, loadState, logNo } from '../store/storage';
import NOButton from '../components/NOButton';

type Props = {
  onSlipPress: (todayNOs: number) => void;
  refreshKey: number;
  onNOLogged?: () => void;
};

export default function MainScreen({ onSlipPress, refreshKey, onNOLogged }: Props) {
  const [appState, setAppState] = useState<AppState>({ lifetimeNoCount: 0, dailyRecords: [] });
  const todayCount = getTodayRecord(appState).noCount;
  const counterAnim = useRef(new Animated.Value(1)).current;

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

  async function handleNO() {
    const s = await logNo();
    setAppState(s);
    onNOLogged?.();
    Animated.sequence([
      Animated.timing(counterAnim, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.timing(counterAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.lifetimeRow}>
          <Text style={styles.lifetimeLabel}>LIFETIME</Text>
          <Text style={styles.lifetimeCount}>{appState.lifetimeNoCount}</Text>
        </View>

        <View style={styles.centerBlock}>
          <Text style={styles.todayLabel}>TODAY</Text>
          <Animated.Text style={[styles.todayCount, { transform: [{ scale: counterAnim }] }]}>
            {todayCount}
          </Animated.Text>
          <NOButton onConfirmed={handleNO} />
          <Text style={styles.hint}>hold 1.5 s to log</Text>
        </View>

        <TouchableOpacity
          style={styles.slipButton}
          onPress={() => onSlipPress(todayCount)}
          activeOpacity={0.6}
        >
          <Text style={styles.slipLabel}>I slipped</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D1A' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 32 },
  lifetimeRow: { alignItems: 'center', gap: 2 },
  lifetimeLabel: { fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
  lifetimeCount: { fontSize: 28, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
  centerBlock: { alignItems: 'center', gap: 12 },
  todayLabel: { fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  todayCount: { fontSize: 72, color: '#FFFFFF', fontWeight: '900', lineHeight: 80 },
  hint: { fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8, letterSpacing: 1 },
  slipButton: { paddingVertical: 8, paddingHorizontal: 20 },
  slipLabel: { fontSize: 13, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 },
});
