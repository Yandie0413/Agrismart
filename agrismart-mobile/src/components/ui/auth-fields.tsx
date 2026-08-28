import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { Radius, Spacing, hexToRgba } from '@/constants/appTheme';

type Colors = ReturnType<typeof useTheme>['colors'];

// Composants partages entre l'ecran de login et l'ecran "mot de passe oublie",
// extraits de login-screen.tsx pour eviter de dupliquer ~60 lignes de style.

export function BoutonPrincipal({
  onPress,
  disabled,
  colors,
  children,
}: {
  onPress: () => void;
  disabled?: boolean;
  colors: Colors;
  children: React.ReactNode;
}) {
  const [presse, setPresse] = useState(false);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(presse ? 0.97 : 1, { duration: 100 }) }],
  }));
  return (
    <Animated.View style={style}>
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => setPresse(true)}
        onPressOut={() => setPresse(false)}>
        <LinearGradient
          colors={[colors.mint300, colors.mint500]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bouton}>
          {children}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ChampIcone({
  icone,
  colors,
  secureToggle,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  icone: keyof typeof Ionicons.glyphMap;
  colors: Colors;
  secureToggle?: boolean;
}) {
  const [masque, setMasque] = useState(true);
  return (
    <View
      style={[
        styles.champWrapper,
        { backgroundColor: hexToRgba('#FFFFFF', 0.06), borderColor: hexToRgba('#FFFFFF', 0.14) },
      ]}>
      <Ionicons name={icone} size={18} color={colors.textMuted} style={styles.champIcone} />
      <TextInput
        style={[styles.champInput, { color: colors.white }]}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureToggle ? masque : props.secureTextEntry}
        {...props}
      />
      {secureToggle && (
        <TouchableOpacity onPress={() => setMasque((m) => !m)} hitSlop={10}>
          <Ionicons name={masque ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    paddingVertical: 15,
  },
  champWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  champIcone: {},
  champInput: { flex: 1, paddingVertical: 14, fontSize: 15 },
});
