import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Radius, Spacing, hexToRgba } from '@/constants/appTheme';
import { useTheme } from '@/contexts/ThemeContext';

type GlassCardProps = {
  children: React.ReactNode;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  bordered?: boolean;
  animateEntry?: boolean;
  gradientOverlay?: boolean;
};

export default function GlassCard({
  children,
  intensity = 40,
  style,
  padding = Spacing.lg,
  bordered = true,
  animateEntry = true,
  gradientOverlay = true,
}: GlassCardProps) {
  const { colors, mode } = useTheme();

  const content = (
    <View
      style={[
        styles.container,
        {
          padding,
          borderRadius: Radius.lg,
          borderWidth: bordered ? 1 : 0,
          borderColor: hexToRgba('#FFFFFF', 0.15),
        },
        style,
      ]}>
      <BlurView
        intensity={intensity}
        tint={mode === 'dark' ? 'dark' : 'light'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFillObject}
      />
      {gradientOverlay && (
        <LinearGradient
          colors={[hexToRgba(colors.forest800, 0.55), hexToRgba(colors.forest900, 0.35)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <View style={styles.contentWrapper}>{children}</View>
    </View>
  );

  if (!animateEntry) return content;

  return <Animated.View entering={FadeInDown.duration(400)}>{content}</Animated.View>;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  contentWrapper: {
    zIndex: 1,
  },
});
