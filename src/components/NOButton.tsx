import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated as RNAnimated,
  PanResponder,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import WaveRipple from './WaveRipple';

const HOLD_DURATION = 1500;

type Props = {
  onConfirmed: () => void;
};

export default function NOButton({ onConfirmed }: Props) {
  const [rippleVisible, setRippleVisible] = useState(false);
  const progress = useRef(new RNAnimated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scale = useRef(new RNAnimated.Value(1)).current;

  function startHold() {
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
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    progress.stopAnimation();
    progress.setValue(0);
    RNAnimated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  }

  function fireConfirmed() {
    RNAnimated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setRippleVisible(true);
    onConfirmed();
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => startHold(),
    onPanResponderRelease: () => cancelHold(),
    onPanResponderTerminate: () => cancelHold(),
  });

  const ringColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.9)'],
  });

  return (
    <View style={styles.wrapper}>
      <RNAnimated.View style={[styles.outerRing, { borderColor: ringColor }]} />
      <WaveRipple visible={rippleVisible} onDone={() => setRippleVisible(false)} />
      <RNAnimated.View
        style={[styles.button, { transform: [{ scale }] }]}
        {...panResponder.panHandlers}
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
