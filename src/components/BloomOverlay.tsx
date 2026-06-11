import React, { useEffect } from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ANIM_DURATIONS, COLORS } from '../constants/noLogAnimation';

export type BloomPhase = 'IDLE' | 'HOLDING' | 'BLOOM' | 'DWELL' | 'CELEBRATE' | 'RECEDE';

type Props = {
  phase: BloomPhase;
  reducedMotion: boolean;
};

export default function BloomOverlay({ phase, reducedMotion }: Props) {
  const { width, height } = useWindowDimensions();
  // Circle must cover viewport corners from center: diameter = 2 * diagonal
  const diagonal = Math.sqrt(width * width + height * height);
  const circleSize = diagonal * 2;

  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (phase === 'BLOOM') {
      opacity.value = 1;
      if (reducedMotion) {
        scale.value = 1; // instant cover via opacity below
        opacity.value = withTiming(1, { duration: ANIM_DURATIONS.BLOOM });
      } else {
        scale.value = withTiming(1, {
          duration: ANIM_DURATIONS.BLOOM,
          easing: Easing.out(Easing.quad),
        });
      }
    } else if (phase === 'DWELL' || phase === 'CELEBRATE') {
      // Hold steady at full cover — no pulse (it read as a flicker on desktop)
      scale.value = 1;
      opacity.value = 1;
    } else if (phase === 'RECEDE') {
      if (reducedMotion) {
        scale.value = 1;
        opacity.value = withTiming(0, { duration: ANIM_DURATIONS.RECEDE });
      } else {
        scale.value = withTiming(0, {
          duration: ANIM_DURATIONS.RECEDE,
          easing: Easing.inOut(Easing.quad),
        });
        opacity.value = 1;
      }
    } else if (phase === 'IDLE' || phase === 'HOLDING') {
      scale.value = 0;
      opacity.value = 1;
    }
  }, [phase]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Always mounted — never unmount/remount, which would cause a flash at scale=0
  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          marginLeft: -circleSize / 2 + width / 2,
          marginTop: -circleSize / 2 + height / 2,
        },
        animStyle,
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    backgroundColor: COLORS.BLOOM_FILL,
    // Ensure it renders above other content
    ...Platform.select({ web: { zIndex: 10 } as any, default: { zIndex: 10 } }),
  },
});
