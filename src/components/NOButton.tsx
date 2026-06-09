import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated as RNAnimated,
  Platform,
} from 'react-native';
import { COLORS, ANIM_DURATIONS } from '../constants/noLogAnimation';

// Haptics — native enhancement only
let Haptics: { impactAsync: (style: any) => void; ImpactFeedbackStyle: { Medium: any } } | null = null;
if (Platform.OS !== 'web') {
  try { Haptics = require('expo-haptics'); } catch {}
}

type Props = {
  onHoldStart: () => void;
  onHoldCancel: () => void;
  onConfirmed: () => void;
  locked: boolean;
  holdProgress: RNAnimated.Value;
};

export default function NOButton({ onHoldStart, onHoldCancel, onConfirmed, locked, holdProgress }: Props) {
  const scale = useRef(new RNAnimated.Value(1)).current;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHolding = useRef(false);

  function startHold() {
    if (locked || isHolding.current) return;
    isHolding.current = true;
    RNAnimated.timing(scale, { toValue: 0.93, duration: 150, useNativeDriver: true }).start();
    holdProgress.setValue(0);
    RNAnimated.timing(holdProgress, {
      toValue: 1,
      duration: ANIM_DURATIONS.HOLD,
      useNativeDriver: false,
    }).start();
    onHoldStart();
    holdTimer.current = setTimeout(() => {
      isHolding.current = false;
      RNAnimated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      if (Haptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onConfirmed();
    }, ANIM_DURATIONS.HOLD);
  }

  function cancelHold() {
    if (!isHolding.current) return;
    isHolding.current = false;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    holdProgress.stopAnimation();
    RNAnimated.timing(holdProgress, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    RNAnimated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    onHoldCancel();
  }

  const ringBorderColor = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [`${COLORS.ACCENT_OCEAN}33`, COLORS.ACCENT_OCEAN],
  });

  const webHandlers = Platform.OS === 'web' ? {
    onPointerDown: (e: any) => { e.preventDefault(); startHold(); },
    onPointerUp: () => cancelHold(),
    onPointerLeave: () => cancelHold(),
    onPointerCancel: () => cancelHold(),
    onContextMenu: (e: any) => e.preventDefault(),
  } : {};

  const nativeHandlers = Platform.OS !== 'web' ? {
    onStartShouldSetResponder: () => true,
    onResponderGrant: () => startHold(),
    onResponderRelease: () => cancelHold(),
    onResponderTerminate: () => cancelHold(),
  } : {};

  return (
    <View style={styles.wrapper}>
      <RNAnimated.View style={[styles.outerRing, { borderColor: ringBorderColor }]} />
      <RNAnimated.View
        style={[styles.button, { transform: [{ scale }] }]}
        {...webHandlers}
        {...nativeHandlers}
      >
        <Text style={styles.label} selectable={false}>NO</Text>
      </RNAnimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
  },
  button: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.ACCENT_OCEAN,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.ACCENT_OCEAN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    ...Platform.select({ web: { cursor: 'pointer', touchAction: 'none', WebkitUserSelect: 'none' } as any }),
  },
  label: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
    userSelect: 'none',
  },
  outerRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
  },
});
