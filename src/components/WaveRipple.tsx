import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

type Props = {
  visible: boolean;
  onDone: () => void;
  color?: string;
};

export default function WaveRipple({ visible, onDone, color = '#FFFFFF' }: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = 0;
      opacity.value = 0.5;
      scale.value = withTiming(4, { duration: 600, easing: Easing.out(Easing.quad) });
      opacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) runOnJS(onDone)();
      });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.ripple, { borderColor: color }, animStyle]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  ripple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignSelf: 'center',
  },
});
