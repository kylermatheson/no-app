import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/noLogAnimation';
import type { BloomPhase } from './BloomOverlay';

const MILESTONES = new Set([1, 10, 50, 100, 500, 1000, 10000]);

export function isMilestoneCount(n: number): boolean {
  return MILESTONES.has(n);
}

type Props = {
  phase: BloomPhase;
  lifetimeCount: number;
  onDismiss: () => void;
};

export default function MilestoneOverlay({ phase, lifetimeCount, onDismiss }: Props) {
  const { width, height } = useWindowDimensions();
  const opacity = useSharedValue(0);
  const confettiRef = useRef<ConfettiCannon>(null);
  const viewShotRef = useRef<ViewShotRef>(null);

  const visible = phase === 'CELEBRATE';

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
      // Short delay so confetti fires after fade-in starts
      const t = setTimeout(() => confettiRef.current?.start(), 100);
      return () => clearTimeout(t);
    } else {
      opacity.value = 0;
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const headline =
    lifetimeCount === 1
      ? 'Your first No.'
      : `${lifetimeCount.toLocaleString()} moments you chose differently.`;

  async function handleShare() {
    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        await Share.share({ url: uri, message: headline });
      } else {
        await Share.share({ message: headline });
      }
    } catch {
      // user cancelled or share unavailable — silently ignore
    }
  }

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.overlay, animStyle]}
      pointerEvents={visible ? 'box-none' : 'none'}
    >
      {/* Confetti burst — fires once from top center */}
      <ConfettiCannon
        ref={confettiRef}
        count={120}
        origin={{ x: width / 2, y: -20 }}
        autoStart={false}
        fadeOut
        fallSpeed={2500}
        explosionSpeed={350}
      />

      {/* Shareable card area captured by ViewShot */}
      <ViewShot
        ref={viewShotRef}
        style={styles.card}
        options={{ format: 'png', quality: 1 }}
      >
        <View style={styles.cardInner}>
          <Text style={styles.headline}>{headline}</Text>
        </View>
      </ViewShot>

      {/* Action row */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={22} color={COLORS.BREATH_TEXT_ON_BLUE} />
          <Text style={styles.shareLabel}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Dismiss */}
      <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} activeOpacity={0.7}>
        <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { zIndex: 30 } as any, default: { zIndex: 30 } }),
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  cardInner: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headline: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.BREATH_TEXT_ON_BLUE,
    textAlign: 'center',
    lineHeight: 40,
  },
  actions: {
    marginTop: 32,
    alignItems: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 32,
  },
  shareLabel: {
    color: COLORS.BREATH_TEXT_ON_BLUE,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    padding: 8,
  },
});
