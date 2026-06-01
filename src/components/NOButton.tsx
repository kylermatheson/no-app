import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated as RNAnimated,
  Platform,
} from 'react-native';
import WaveRipple from './WaveRipple';

// Haptics only available on native
let Haptics: { impactAsync: (style: any) => void; ImpactFeedbackStyle: { Heavy: any } } | null = null;
if (Platform.OS !== 'web') {
  Haptics = require('expo-haptics');
}

const HOLD_DURATION = 1500;

type Props = {
  onConfirmed: () => void;
};

export default function NOButton({ onConfirmed }: Props) {
  const [rippleVisible, setRippleVisible] = useState(false);
  const progress = useRef(new RNAnimated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scale = useRef(new RNAnimated.Value(1)).current;
  const isHolding = useRef(false);

  function startHold() {
    if (isHolding.current) return;
    isHolding.current = true;
    RNAnimated.timing(scale, { toValue: 0.93, duration: 150, useNativeDriver: true }).start();
    progress.setValue(0);
    RNAnimated.timing(progress, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false,
    }).start();
    holdTimer.current = setTimeout(() => {
      fireConfirmed();
    }, HOLD_DURATION);
  }

  function cancelHold() {
    if (!isHolding.current) return;
    isHolding.current = false;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    progress.stopAnimation();
    progress.setValue(0);
    RNAnimated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  }

  function fireConfirmed() {
    isHolding.current = false;
    RNAnimated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    if (Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (Platform.OS === 'web' && 'vibrate' in navigator) {
      navigator.vibrate(80);
    }
    setRippleVisible(true);
    onConfirmed();
  }

  const ringColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.9)'],
  });

  // Web uses pointer events for reliable cross-browser hold detection
  const webHandlers = Platform.OS === 'web' ? {
    onPointerDown: (e: any) => { e.preventDefault(); startHold(); },
    onPointerUp: () => cancelHold(),
    onPointerLeave: () => cancelHold(),
    onPointerCancel: () => cancelHold(),
    // Block context menu on long-press (mobile browsers)
    onContextMenu: (e: any) => e.preventDefault(),
  } : {};

  // Native uses PanResponder via responder props
  const nativeHandlers = Platform.OS !== 'web' ? {
    onStartShouldSetResponder: () => true,
    onResponderGrant: () => startHold(),
    onResponderRelease: () => cancelHold(),
    onResponderTerminate: () => cancelHold(),
  } : {};

  return (
    <View style={styles.wrapper}>
      <RNAnimated.View style={[styles.outerRing, { borderColor: ringColor }]} />
      <WaveRipple visible={rippleVisible} onDone={() => setRippleVisible(false)} />
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
    backgroundColor: '#1A1A2E',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    // Prevent browser default touch behaviors
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
