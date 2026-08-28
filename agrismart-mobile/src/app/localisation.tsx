import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Radius, Spacing } from '@/constants/appTheme';
import ThemedCard from '@/components/ui/ThemedCard';
import ScreenHeader from '@/components/ui/ScreenHeader';
import LeafletMap, { MapPoint, MapZone } from '@/components/leaflet-map';
import { getMesLocalisations, getToutesLocalisations, LocalisationComplete } from '@/services/localisationService';
import { getMesExploitations } from '@/services/exploitationService';

// Regroupe les localisations en zones geographiques (grille ~30km) pour une analyse par zone
function calculerZones(localisations: LocalisationComplete[]): MapZone[] {
  const groupes = new Map<string, { latitudes: number[]; longitudes: number[]; count: number }>();
  const PAS = 0.3;

  for (const loc of localisations) {
    const latZone = Math.round(loc.localisation_latitude / PAS) * PAS;
    const lonZone = Math.round(loc.localisation_longitude / PAS) * PAS;
    const cle = `${latZone}_${lonZone}`;
    if (!groupes.has(cle)) {
      groupes.set(cle, { latitudes: [], longitudes: [], count: 0 });
    }
    const g = groupes.get(cle)!;
    g.latitudes.push(loc.localisation_latitude);
    g.longitudes.push(loc.localisation_longitude);
    g.count++;
  }

  return Array.from(groupes.values()).map((g) => ({
    latitude: g.latitudes.reduce((a, b) => a + b, 0) / g.latitudes.length,
    longitude: g.longitudes.reduce((a, b) => a + b, 0) / g.longitudes.length,
    count: g.count,
    label: 'Zone agricole',
  }));
}

export default function LocalisationScreen() {
  const { token, utilisateur } = useAuth();
  const { colors } = useTheme();
  const estAdminOuExpert = utilisateur?.role === 'administrateur' || utilisateur?.role === 'expert';
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [zones, setZones] = useState<MapZone[]>([]);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    try {
      if (estAdminOuExpert) {
        const toutes = await getToutesLocalisations(token);
        const mesPoints: MapPoint[] = toutes.map((loc) => ({
          latitude: loc.localisation_latitude,
          longitude: loc.localisation_longitude,
          title: loc.exploitation_nom || loc.localisation_adresse,
          description: loc.agriculteur_nom
            ? `${loc.agriculteur_nom} - ${loc.exploitation_superficie ?? '?'} ares`
            : loc.localisation_adresse,
          superficie: loc.exploitation_superficie,
        }));
        setPoints(mesPoints);
        setZones(calculerZones(toutes));
      } else {
        const [localisations, exploitations] = await Promise.all([
          getMesLocalisations(token),
          getMesExploitations(token),
        ]);

        const mesPoints: MapPoint[] = localisations.map((loc) => {
          const exploitation = exploitations.find((e) => e.localisation_id === loc.localisation_id);
          return {
            latitude: loc.localisation_latitude,
            longitude: loc.localisation_longitude,
            title: exploitation?.exploitation_nom || loc.localisation_adresse,
            description: exploitation
              ? `${exploitation.exploitation_superficie} ares`
              : loc.localisation_adresse,
            superficie: exploitation?.exploitation_superficie,
          };
        });
        setPoints(mesPoints);
        setZones([]);
      }
    } catch (e) {
      console.log('Erreur chargement localisation', e);
    } finally {
      setLoading(false);
    }
  }, [token, estAdminOuExpert]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  const zonesTriees = useMemo(() => [...zones].sort((a, b) => b.count - a.count), [zones]);

  const styles = getStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader titre="Mes parcelles" sousTitre="Localisez vos exploitations agricoles" />
        <ActivityIndicator size="large" color={colors.mint400} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader titre="Mes parcelles" sousTitre="Localisez vos exploitations agricoles" />
      <View style={styles.mapWrapper}>
        <LeafletMap points={points} zones={zones} height={points.length > 0 ? 320 : 200} />
      </View>

      {estAdminOuExpert ? (
        <FlatList
          data={zonesTriees}
          keyExtractor={(_, index) => String(index)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.sectionTitre}>
              Zones agricoles actives ({points.length} exploitation(s) au total)
            </Text>
          }
          ListEmptyComponent={<Text style={styles.vide}>Aucune zone agricole detectee</Text>}
          renderItem={({ item }) => (
            <ThemedCard style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="map" size={16} color={colors.mint400} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitre}>
                  {item.latitude.toFixed(2)}, {item.longitude.toFixed(2)}
                </Text>
                <Text style={styles.cardDetail}>{item.count} exploitation(s) dans cette zone</Text>
              </View>
            </ThemedCard>
          )}
        />
      ) : (
        <FlatList
          data={points}
          keyExtractor={(item, index) => String(index)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<Text style={styles.sectionTitre}>Mes parcelles ({points.length})</Text>}
          ListEmptyComponent={<Text style={styles.vide}>Aucune parcelle localisee</Text>}
          renderItem={({ item }) => (
            <ThemedCard style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="location" size={16} color={colors.mint400} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitre}>{item.title}</Text>
                <Text style={styles.cardDetail}>{item.description}</Text>
              </View>
            </ThemedCard>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.forest950 },
    mapWrapper: { padding: Spacing.lg, paddingBottom: 0 },
    listContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
    sectionTitre: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: Spacing.md,
    },
    vide: { color: colors.textMuted, fontStyle: 'italic' },
    card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    cardIcon: {
      width: 32,
      height: 32,
      borderRadius: Radius.full,
      backgroundColor: colors.forest700,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitre: { fontSize: 13, fontWeight: '700', color: colors.white },
    cardDetail: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  });
}
