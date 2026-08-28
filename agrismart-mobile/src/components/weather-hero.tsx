import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { Radius, Spacing } from '@/constants/appTheme';
import ThemedCard from '@/components/ui/ThemedCard';
import GlassCard from '@/components/ui/GlassCard';
import CircularGauge from '@/components/ui/CircularGauge';
import { MeteoTempsReel } from '@/services/meteoService';

function iconMeteo(description: string): keyof typeof Ionicons.glyphMap {
  const d = (description || '').toLowerCase();
  if (d.includes('pluie') || d.includes('averse')) return 'rainy';
  if (d.includes('orage')) return 'thunderstorm';
  if (d.includes('neige')) return 'snow';
  if (d.includes('nuage') || d.includes('couvert')) return 'cloudy';
  if (d.includes('brum') || d.includes('brouillard')) return 'reorder-three';
  if (d.includes('clair') || d.includes('dégagé') || d.includes('degage')) return 'sunny';
  return 'partly-sunny';
}

export default function WeatherHero({ meteo }: { meteo: MeteoTempsReel }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={{ gap: Spacing.md }}>
      <GlassCard style={styles.meteoHero}>
        <View style={styles.meteoHeroTop}>
          <View>
            <Text style={styles.ville}>{meteo.ville}</Text>
            <Text style={styles.meteoDescription}>{meteo.description}</Text>
          </View>
          <Ionicons name={iconMeteo(meteo.description)} size={44} color={colors.accent400} />
        </View>
        <Text style={styles.temperature}>{Math.round(meteo.temperature)}°C</Text>
      </GlassCard>

      <View style={styles.miniRow}>
        <ThemedCard style={styles.miniCard}>
          <Ionicons name="thermometer" size={18} color={colors.mint400} />
          <Text style={styles.miniLabel}>Ressenti</Text>
          <Text style={styles.miniValeur}>{Math.round(meteo.temperature_ressentie)}°C</Text>
        </ThemedCard>
        <ThemedCard style={styles.miniCard}>
          <Ionicons name="speedometer" size={18} color={colors.mint400} />
          <Text style={styles.miniLabel}>Vent</Text>
          <Text style={styles.miniValeur}>{meteo.vitesse_vent} m/s</Text>
        </ThemedCard>
        <ThemedCard style={styles.miniCard}>
          <Ionicons name="water" size={18} color={colors.mint400} />
          <Text style={styles.miniLabel}>Pression</Text>
          <Text style={styles.miniValeur}>{meteo.pression} hPa</Text>
        </ThemedCard>
        <ThemedCard style={styles.miniCard}>
          <Ionicons name="rainy" size={18} color={colors.mint400} />
          <Text style={styles.miniLabel}>Pluie</Text>
          <Text style={styles.miniValeur}>{meteo.pluviometrie ?? 0} mm</Text>
        </ThemedCard>
      </View>

      <GlassCard style={styles.humiditeCard} animateEntry={false}>
        <CircularGauge
          percentage={meteo.humidite}
          color={colors.mint400}
          bgColor={colors.forest700}
          label="Humidite"
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.humiditeTitre}>Taux d&apos;humidite</Text>
          <Text style={styles.humiditeSousTitre}>
            {meteo.humidite > 70
              ? 'Niveau eleve, surveillez le risque de champignons.'
              : meteo.humidite > 40
              ? 'Niveau optimal pour la plupart des cultures.'
              : 'Niveau bas, pensez a irriguer si besoin.'}
          </Text>
        </View>
      </GlassCard>
    </View>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    meteoHero: { gap: 4, borderRadius: Radius.lg, padding: Spacing.lg },
    meteoHeroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    ville: { fontSize: 15, color: colors.white, fontWeight: '600' },
    temperature: { fontSize: 44, fontWeight: 'bold', color: colors.mint400, marginTop: 4 },
    meteoDescription: { fontSize: 12, color: colors.textMuted, textTransform: 'capitalize', marginTop: 2 },
    miniRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    miniCard: { flexBasis: '47%', flexGrow: 1, alignItems: 'center', gap: 4, paddingVertical: Spacing.md },
    miniLabel: { fontSize: 10, color: colors.textMuted },
    miniValeur: { fontSize: 13, fontWeight: '700', color: colors.white },
    humiditeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    humiditeTitre: { fontSize: 14, fontWeight: '700', color: colors.white },
    humiditeSousTitre: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 16 },
  });
}
