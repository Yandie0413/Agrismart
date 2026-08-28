import { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Radius, Spacing } from '@/constants/appTheme';
import ThemedCard from '@/components/ui/ThemedCard';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { getDashboardProfil } from '@/services/profilService';

const LARGEUR_ECRAN = Dimensions.get('window').width - Spacing.lg * 2 - Spacing.lg * 2;

export default function StatistiquesScreen() {
  const { token, utilisateur } = useAuth();
  const { colors } = useTheme();
  const [donnees, setDonnees] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    try {
      const data = await getDashboardProfil(token);
      setDonnees(data);
    } catch (e) {
      console.log('Erreur chargement statistiques', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  const styles = getStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader titre="Statistiques" sousTitre="Analyse globale de la plateforme" />
        <ActivityIndicator size="large" color={colors.mint400} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: colors.forest800,
    backgroundGradientTo: colors.forest800,
    decimalPlaces: 0,
    color: () => colors.mint400,
    labelColor: () => colors.textMuted,
    barPercentage: 0.6,
    propsForBackgroundLines: { stroke: colors.forest700 },
  };

  let tuiles: { label: string; valeur: number }[] = [];
  let barData: { labels: string[]; datasets: { data: number[] }[] } | null = null;

  if (utilisateur?.role === 'agriculteur' && donnees) {
    tuiles = [
      { label: 'Exploitations', valeur: donnees.total_exploitations },
      { label: 'Cultures', valeur: donnees.total_cultures },
    ];
    barData = {
      labels: ['Exploitations', 'Cultures'],
      datasets: [{ data: [donnees.total_exploitations, donnees.total_cultures] }],
    };
  } else if (utilisateur?.role === 'expert' && donnees) {
    tuiles = [
      { label: 'Conseils publies', valeur: donnees.total_conseils },
      { label: 'Messages non lus', valeur: donnees.messages_non_lus },
    ];
    barData = {
      labels: ['Conseils', 'Messages'],
      datasets: [{ data: [donnees.total_conseils, donnees.messages_non_lus] }],
    };
  } else if (utilisateur?.role === 'administrateur' && donnees) {
    tuiles = [
      { label: 'Utilisateurs', valeur: donnees.total_utilisateurs },
      { label: 'Agriculteurs', valeur: donnees.total_agriculteurs },
      { label: 'Experts', valeur: donnees.total_experts },
      { label: 'Exploitations', valeur: donnees.total_exploitations },
      { label: 'Cultures', valeur: donnees.total_cultures },
      { label: 'Alertes actives', valeur: donnees.alertes_actives },
    ];
    barData = {
      labels: ['Agri.', 'Experts', 'Exploit.', 'Cultures'],
      datasets: [{ data: [donnees.total_agriculteurs, donnees.total_experts, donnees.total_exploitations, donnees.total_cultures] }],
    };
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader titre="Statistiques" sousTitre="Analyse globale de la plateforme" />
      <ScrollView contentContainerStyle={styles.content}>
        {tuiles.length === 0 ? (
          <Text style={styles.vide}>Statistiques non disponibles pour ce role sur mobile.</Text>
        ) : (
          <>
            <View style={styles.tuilesRow}>
              {tuiles.map((t) => (
                <ThemedCard key={t.label} style={styles.tuile}>
                  <Text style={styles.tuileValeur}>{t.valeur}</Text>
                  <Text style={styles.tuileLabel}>{t.label}</Text>
                </ThemedCard>
              ))}
            </View>

            {barData && (
              <ThemedCard style={styles.chartCard}>
                <BarChart
                  data={barData}
                  width={LARGEUR_ECRAN}
                  height={200}
                  fromZero
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={chartConfig}
                  style={{ borderRadius: Radius.md }}
                />
              </ThemedCard>
            )}

            {donnees?.derniers_conseils?.length > 0 && (
              <>
                <Text style={styles.sectionTitre}>Derniers conseils</Text>
                {donnees.derniers_conseils.map((c: any) => (
                  <ThemedCard key={c.conseil_id} style={styles.itemCard}>
                    <Text style={styles.itemTitre}>{c.conseil_titre}</Text>
                    <Text style={styles.itemDetail}>{c.conseil_categorie}</Text>
                  </ThemedCard>
                ))}
              </>
            )}

            {donnees?.dernieres_alertes?.length > 0 && (
              <>
                <Text style={styles.sectionTitre}>Dernieres alertes</Text>
                {donnees.dernieres_alertes.map((a: any) => (
                  <ThemedCard key={a.alerte_id} style={styles.itemCard}>
                    <Text style={styles.itemTitre}>{a.alerte_type}</Text>
                    <Text style={styles.itemDetail}>{a.alerte_message}</Text>
                  </ThemedCard>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.forest950 },
    content: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },
    vide: { color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.xl },
    tuilesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    tuile: { flexBasis: '30%', flexGrow: 1, alignItems: 'center', gap: 4 },
    tuileValeur: { fontSize: 26, fontWeight: '800', color: colors.mint400 },
    tuileLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
    chartCard: { alignItems: 'center' },
    sectionTitre: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: Spacing.sm,
    },
    itemCard: { gap: 2 },
    itemTitre: { fontSize: 13, fontWeight: '700', color: colors.white },
    itemDetail: { fontSize: 12, color: colors.textMuted },
  });
}
