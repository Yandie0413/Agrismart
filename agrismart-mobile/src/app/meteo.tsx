import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Radius, Spacing } from '@/constants/appTheme';
import ThemedCard from '@/components/ui/ThemedCard';
import ScreenHeader from '@/components/ui/ScreenHeader';
import WeatherHero from '@/components/weather-hero';
import CircularGauge from '@/components/ui/CircularGauge';
import { getMesLocalisations } from '@/services/localisationService';
import {
  Alerte,
  getAlertesMeteo,
  getMeteoParCoordonnees,
  getPrevisions,
  getPrevisionsAvanceesParCoordonnees,
  MeteoTempsReel,
  Prevision,
  PrevisionAvancee,
} from '@/services/meteoService';

const ALERTE_STYLE: Record<string, { icon: keyof typeof Ionicons.glyphMap; couleur: string }> = {
  canicule: { icon: 'sunny', couleur: '#FFC94A' },
  gel: { icon: 'snow', couleur: '#93C5FD' },
  secheresse: { icon: 'flame', couleur: '#FB923C' },
  inondation: { icon: 'rainy', couleur: '#60A5FA' },
  maladie: { icon: 'bug', couleur: '#F87171' },
};

function jourCourt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
}

export default function MeteoScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const [meteo, setMeteo] = useState<MeteoTempsReel | null>(null);
  const [previsions, setPrevisions] = useState<Prevision[]>([]);
  const [previsionsAvancees, setPrevisionsAvancees] = useState<PrevisionAvancee[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erreur, setErreur] = useState('');
  const [derniereMaj, setDerniereMaj] = useState<Date | null>(null);

  const charger = useCallback(async () => {
    setErreur('');
    try {
      const localisations = await getMesLocalisations(token);
      const listeAlertes = await getAlertesMeteo(token);
      setAlertes(listeAlertes.filter((a) => a.alerte_statut === 'active'));

      if (localisations.length === 0) {
        setErreur('Aucune localisation trouvee pour ce compte');
        return;
      }
      const loc = localisations[0];
      const meteoActuelle = await getMeteoParCoordonnees(
        loc.localisation_latitude,
        loc.localisation_longitude,
        token
      );
      setMeteo(meteoActuelle);
      setDerniereMaj(new Date());

      try {
        const liste = await getPrevisions(meteoActuelle.ville, token);
        const parJour = [0, 8, 16, 24, 32].map((i) => liste[i]).filter(Boolean);
        setPrevisions(parJour);
      } catch {
        setPrevisions([]);
      }

      try {
        const avancees = await getPrevisionsAvanceesParCoordonnees(
          loc.localisation_latitude,
          loc.localisation_longitude,
          token
        );
        setPrevisionsAvancees(avancees);
      } catch {
        setPrevisionsAvancees([]);
      }
    } catch (e: any) {
      setErreur(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  function onRefresh() {
    setRefreshing(true);
    charger();
  }

  const styles = getStyles(colors);

  const sousTitre = derniereMaj
    ? `Mis à jour à ${derniereMaj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : undefined;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader titre="Météo" />
        <ActivityIndicator size="large" color={colors.mint400} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        titre="Météo"
        sousTitre={sousTitre}
        droite={
          <TouchableOpacity onPress={onRefresh} hitSlop={10}>
            <Ionicons name="refresh" size={19} color={colors.white} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mint400} />}>
        {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

        {meteo && <WeatherHero meteo={meteo} />}

        {previsions.length > 0 && (
          <>
            <Text style={styles.sectionTitre}>Prévisions 5 jours</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previsionsRow}>
              {previsions.map((p, index) => (
                <ThemedCard
                  key={index}
                  style={[
                    styles.previsionCard,
                    index === 0 && { backgroundColor: colors.mint400 + '1A', borderColor: colors.mint400 + '40' },
                  ]}>
                  <Text style={styles.previsionJour}>{index === 0 ? 'Auj.' : jourCourt(p.date)}</Text>
                  <Text style={styles.previsionTemp}>{Math.round(p.temperature)}°</Text>
                  <Text style={styles.previsionDetail}>
                    {Math.round(p.temp_min)}° / {Math.round(p.temp_max)}°
                  </Text>
                  <Text style={styles.previsionDescription} numberOfLines={2}>
                    {p.description}
                  </Text>
                </ThemedCard>
              ))}
            </ScrollView>
          </>
        )}

        {meteo && (typeof meteo.risque_gel === 'number' || previsionsAvancees[0]) && (
          <>
            <Text style={styles.sectionTitre}>Évapotranspiration & risques</Text>
            <ThemedCard style={styles.risquesCard}>
              <View style={styles.gaugesRow}>
                {typeof meteo.risque_gel === 'number' && (
                  <CircularGauge
                    percentage={meteo.risque_gel}
                    size={78}
                    color={meteo.risque_gel >= 70 ? colors.danger : meteo.risque_gel >= 40 ? colors.accent400 : colors.mint400}
                    bgColor={colors.forest700}
                    label="Gel"
                  />
                )}
                {typeof meteo.risque_secheresse === 'number' && (
                  <CircularGauge
                    percentage={meteo.risque_secheresse}
                    size={78}
                    color={meteo.risque_secheresse >= 70 ? colors.danger : meteo.risque_secheresse >= 40 ? colors.accent400 : colors.mint400}
                    bgColor={colors.forest700}
                    label="Secheresse"
                  />
                )}
              </View>

              {meteo.temperature_sol_estimee !== undefined && (
                <View style={styles.solRow}>
                  <Text style={styles.solLabel}>Temp. du sol (estimation)</Text>
                  <Text style={styles.solValeur}>{meteo.temperature_sol_estimee}°C</Text>
                </View>
              )}
              {previsionsAvancees[0] && (
                <View style={styles.solRow}>
                  <Text style={styles.solLabel}>ET0 estimee aujourd'hui</Text>
                  <Text style={styles.solValeur}>{previsionsAvancees[0].et0_estime_mm} mm/j</Text>
                </View>
              )}
              <Text style={styles.risquesNote}>
                Estimations (Hargreaves, temperature air − 3°C) : pas de mesure directe, l'offre gratuite
                OpenWeatherMap n'expose ni capteur de sol ni donnees de rayonnement reelles.
              </Text>
            </ThemedCard>
          </>
        )}

        <Text style={styles.sectionTitre}>Alertes climatiques</Text>
        {alertes.length === 0 && <Text style={styles.vide}>Aucune alerte active</Text>}
        {alertes.map((a) => {
          const style = ALERTE_STYLE[a.alerte_type] || { icon: 'warning', couleur: colors.accent400 };
          return (
            <ThemedCard key={a.alerte_id} style={styles.alerteCard}>
              <View style={[styles.alerteIcon, { backgroundColor: style.couleur + '33' }]}>
                <Ionicons name={style.icon} size={18} color={style.couleur} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alerteType}>{a.alerte_type}</Text>
                <Text style={styles.alerteMessage}>{a.alerte_message}</Text>
              </View>
            </ThemedCard>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.forest950 },
    content: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },
    erreur: { color: colors.danger },
    sectionTitre: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: Spacing.sm,
    },
    previsionsRow: { gap: Spacing.sm, paddingBottom: 4 },
    previsionCard: { width: 100, alignItems: 'center', gap: 4 },
    previsionJour: { fontSize: 11, color: colors.textMuted, textTransform: 'capitalize' },
    previsionTemp: { fontSize: 18, fontWeight: '700', color: colors.white, fontFamily: 'monospace' },
    previsionDetail: { fontSize: 10, color: colors.textMuted, fontFamily: 'monospace' },
    previsionDescription: { fontSize: 10, color: colors.textMuted, textAlign: 'center', textTransform: 'capitalize' },
    vide: { color: colors.textMuted, fontStyle: 'italic' },
    alerteCard: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
    alerteIcon: {
      width: 36,
      height: 36,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    alerteType: { fontSize: 13, fontWeight: '700', color: colors.white, textTransform: 'capitalize' },
    alerteMessage: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
    risquesCard: { gap: Spacing.sm },
    gaugesRow: { flexDirection: 'row', justifyContent: 'space-around' },
    solRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    solLabel: { fontSize: 12, color: colors.textMuted },
    solValeur: { fontSize: 14, fontWeight: '700', color: colors.white, fontFamily: 'monospace' },
    risquesNote: { fontSize: 10, color: colors.textMuted, lineHeight: 14, marginTop: 2 },
  });
}
