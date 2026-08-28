import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Radius, Spacing, hexToRgba } from '@/constants/appTheme';
import { useTheme } from '@/contexts/ThemeContext';

type Atout = {
  icone: keyof typeof Ionicons.glyphMap;
  label: string;
};

const ATOUTS: Atout[] = [
  { icone: 'partly-sunny', label: 'Météo' },
  { icone: 'bulb', label: 'Conseils' },
  { icone: 'leaf', label: 'Parcelles' },
];

export default function OnboardingScreen({ onTerminer }: { onTerminer: () => void }) {
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={[colors.forest950, colors.forest800, colors.mint500]}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}>
      {/* Formes decoratives en fond, a defaut de photo de champ */}
      <View pointerEvents="none" style={styles.decor}>
        <View style={[styles.blob, styles.blobUn, { backgroundColor: hexToRgba(colors.mint300, 0.16) }]} />
        <View style={[styles.blob, styles.blobDeux, { backgroundColor: hexToRgba(colors.mint400, 0.12) }]} />
      </View>

      <SafeAreaView style={styles.safe}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.brand}>
          <Image source={require('@/assets/images/logo-glow.png')} style={styles.logoGlow} />
          <Text style={styles.brandTexte}>AgriSmart</Text>
        </Animated.View>

        <View style={styles.hero}>
          <Animated.Text entering={FadeInUp.duration(600).delay(100)} style={styles.titre}>
            Cultivez{'\n'}plus intelligemment
          </Animated.Text>
          <Animated.Text entering={FadeInUp.duration(600).delay(200)} style={[styles.sousTitre, { color: colors.textMuted }]}>
            Météo en temps réel, conseils personnalisés et suivi de tes parcelles, dans une seule app.
          </Animated.Text>
        </View>

        <Animated.View entering={FadeInDown.duration(600).delay(250)} style={styles.atouts}>
          {ATOUTS.map((a) => (
            <View key={a.label} style={[styles.atoutChip, { backgroundColor: hexToRgba('#FFFFFF', 0.08), borderColor: hexToRgba('#FFFFFF', 0.16) }]}>
              <Ionicons name={a.icone} size={18} color={colors.mint300} />
              <Text style={styles.atoutTexte}>{a.label}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(350)}>
          <TouchableOpacity
            style={[styles.bouton, { backgroundColor: colors.mint400 }]}
            activeOpacity={0.9}
            onPress={onTerminer}>
            <Text style={[styles.boutonTexte, { color: colors.forest950 }]}>Commencer</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.forest950} />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  decor: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999 },
  blobUn: { width: 320, height: 320, top: -80, right: -100 },
  blobDeux: { width: 260, height: 260, bottom: 60, left: -110 },
  safe: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.md },
  logoGlow: { width: 32, height: 32, resizeMode: 'contain' },
  brandTexte: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  hero: { flex: 1, justifyContent: 'center', gap: Spacing.md },
  titre: { fontSize: 42, lineHeight: 48, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  sousTitre: { fontSize: 16, lineHeight: 23, maxWidth: '92%' },
  atouts: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  atoutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  atoutTexte: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    paddingVertical: 17,
    marginBottom: Spacing.xl,
  },
  boutonTexte: { fontSize: 17, fontWeight: '700' },
});
