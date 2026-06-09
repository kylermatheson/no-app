import React, { useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ANIM_DURATIONS, COLORS } from '../constants/noLogAnimation';
import type { BloomPhase } from './BloomOverlay';

type Props = {
  phase: BloomPhase;
};

export default function BreathTextOverlay({ phase }: Props) {
  const inhaleOpacity = useSharedValue(0);
  const exhaleOpacity = useSharedValue(0);

  useEffect(() => {
    if (phase === 'HOLDING') {
      inhaleOpacity.value = withTiming(1, {
        duration: ANIM_DURATIONS.INHALE_FADE_IN,
        easing: Easing.out(Easing.quad),
      });
      exhaleOpacity.value = 0;
    } else if (phase === 'BLOOM') {
      inhaleOpacity.value = withTiming(0, { duration: 200 });
      exhaleOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
    } else if (phase === 'DWELL') {
      inhaleOpacity.value = 0;
      exhaleOpacity.value = 1;
    } else if (phase === 'RECEDE') {
      exhaleOpacity.value = withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) });
    } else {
      inhaleOpacity.value = 0;
      exhaleOpacity.value = 0;
    }
  }, [phase]);

  const inhaleStyle = useAnimatedStyle(() => ({
    opacity: inhaleOpacity.value,
  }));
  const exhaleStyle = useAnimatedStyle(() => ({
    opacity: exhaleOpacity.value,
  }));

  const onBlue = phase === 'BLOOM' || phase === 'DWELL' || phase === 'RECEDE';
  const textColor = onBlue ? COLORS.BREATH_TEXT_ON_BLUE : COLORS.TEXT_ON_WHITE;

  if (phase === 'IDLE') return null;

  return (
    <>
      <Animated.Text
        style={[styles.breathText, { color: textColor }, inhaleStyle]}
        pointerEvents="none"
      >
        Inhale…
      </Animated.Text>
      <Animated.Text
        style={[styles.breathText, { color: COLORS.BREATH_TEXT_ON_BLUE }, exhaleStyle]}
        pointerEvents="none"
      >
        Exhale…
      </Animated.Text>
    </>
  );
}

const styles = StyleSheet.create({
  breathText: {
    position: 'absolute',
    alignSelf: 'center',
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 2,
    bottom: '35%',
    ...Platform.select({ web: { zIndex: 20, userSelect: 'none' } as any }),
  },
});
