import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Radius, Spacing, hexToRgba } from '@/constants/appTheme';
import ThemedCard from '@/components/ui/ThemedCard';
import ScreenHeader from '@/components/ui/ScreenHeader';
import CircularGauge from '@/components/ui/CircularGauge';
import {
  BaseSymptomes,
  Conseil,
  diagnostiquer,
  genererConseilsAutomatiques,
  getBaseSymptomes,
  getConseils,
  ResultatDiagnostic,
  validerDiagnostic,
} from '@/services/conseilService';
import { couleurCategorie, iconCategorie } from '@/utils/categorieConseil';

export default function ConseilsScreen() {
  const { token, utilisateur } = useAuth();
  const { colors } = useTheme();
  const [conseils, setConseils] = useState<Conseil[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categorieActive, setCategorieActive] = useState<string | null>(null);

  const [diagOuvert, setDiagOuvert] = useState(false);
  const [baseSymptomes, setBaseSymptomes] = useState<BaseSymptomes>({ cultures: [], symptomesParCulture: {} });
  const [diagCulture, setDiagCulture] = useState('');
  const [diagSymptomes, setDiagSymptomes] = useState<string[]>([]);
  const [diagResultat, setDiagResultat] = useState<ResultatDiagnostic>(null);
  const [diagLance, setDiagLance] = useState(false);
  const [diagEnvoi, setDiagEnvoi] = useState(false);
  const [diagErreur, setDiagErreur] = useState('');

  // Simple GET, appele a chaque focus de l'ecran : pas de risque de spam du backend.
  const chargerListe = useCallback(async () => {
    try {
      const liste = await getConseils(token);
      setConseils(liste);
    } catch (e) {
      console.log('Erreur chargement conseils', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Regenere les conseils automatiques (ecriture backend) : uniquement au montage
  // et sur pull-to-refresh explicite, jamais a chaque simple retour sur l'ecran.
  const regenererEtCharger = useCallback(async () => {
    try {
      if (utilisateur?.role === 'agriculteur') {
        await genererConseilsAutomatiques(token);
      }
    } catch (e) {
      console.log('Erreur generation conseils automatiques', e);
    }
    await chargerListe();
  }, [token, utilisateur?.role, chargerListe]);

  useEffect(() => {
    regenererEtCharger();
    if (utilisateur?.role === 'agriculteur') {
      getBaseSymptomes(token)
        .then(setBaseSymptomes)
        .catch((e) => console.log('Erreur chargement base symptomes', e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      chargerListe();
    }, [chargerListe])
  );

  function onRefresh() {
    setRefreshing(true);
    regenererEtCharger();
  }

  function toggleSymptome(symptome: string) {
    setDiagSymptomes((prev) =>
      prev.includes(symptome) ? prev.filter((s) => s !== symptome) : [...prev, symptome]
    );
  }

  function handleChangerCultureDiag(culture: string) {
    setDiagCulture(culture);
    setDiagSymptomes([]);
    setDiagResultat(null);
    setDiagLance(false);
    setDiagErreur('');
  }

  async function handleDiagnostiquer() {
    setDiagErreur('');
    if (!diagCulture || diagSymptomes.length === 0) {
      setDiagErreur('Selectionne une culture et au moins un symptome');
      return;
    }
    setDiagEnvoi(true);
    try {
      const res = await diagnostiquer(token, { culture: diagCulture, symptomes: diagSymptomes });
      setDiagResultat(res.resultat);
      setDiagLance(true);
      chargerListe();
    } catch (e: any) {
      setDiagErreur(e.message || 'Erreur lors du diagnostic');
    } finally {
      setDiagEnvoi(false);
    }
  }

  async function handleValiderDiagnostic(id: number, valide: boolean) {
    try {
      await validerDiagnostic(token, id, valide);
      chargerListe();
    } catch (e) {
      console.log('Erreur validation diagnostic', e);
    }
  }

  const categories = useMemo(() => {
    const set = new Set(conseils.map((c) => c.conseil_categorie).filter(Boolean));
    return Array.from(set);
  }, [conseils]);

  const conseilsFiltres = categorieActive
    ? conseils.filter((c) => c.conseil_categorie === categorieActive)
    : conseils;

  const styles = getStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader titre="Conseils agricoles" sousTitre="Recommandations des experts" />
        <ActivityIndicator size="large" color={colors.mint400} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader titre="Conseils agricoles" sousTitre="Recommandations des experts" />
      <FlatList
        data={conseilsFiltres}
        keyExtractor={(item) => String(item.conseil_id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mint400} />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {utilisateur?.role === 'agriculteur' && (
              <ThemedCard style={styles.diagCard}>
                <View style={styles.diagHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="pulse" size={16} color={colors.mint400} />
                    <Text style={styles.diagTitre}>Diagnostic rapide</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setDiagOuvert((v) => !v);
                      setDiagResultat(null);
                      setDiagLance(false);
                      setDiagErreur('');
                    }}>
                    <Text style={styles.diagToggle}>{diagOuvert ? 'Fermer' : 'Faire un diagnostic'}</Text>
                  </TouchableOpacity>
                </View>

                {diagOuvert && (
                  <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
                    <Text style={styles.diagLabel}>Culture concernee</Text>
                    <View style={styles.chipsRow}>
                      {baseSymptomes.cultures.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[styles.chip, diagCulture === c && styles.chipActive]}
                          onPress={() => handleChangerCultureDiag(c)}>
                          <Text style={[styles.chipTexte, diagCulture === c && styles.chipTexteActive]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {diagCulture ? (
                      <>
                        <Text style={styles.diagLabel}>Symptomes observes</Text>
                        {(baseSymptomes.symptomesParCulture[diagCulture] || []).map((symptome) => (
                          <TouchableOpacity
                            key={symptome}
                            style={styles.symptomeRow}
                            onPress={() => toggleSymptome(symptome)}>
                            <Ionicons
                              name={diagSymptomes.includes(symptome) ? 'checkbox' : 'square-outline'}
                              size={18}
                              color={diagSymptomes.includes(symptome) ? colors.mint400 : colors.textMuted}
                            />
                            <Text style={styles.symptomeTexte}>{symptome}</Text>
                          </TouchableOpacity>
                        ))}
                      </>
                    ) : null}

                    {diagErreur ? <Text style={styles.diagErreur}>{diagErreur}</Text> : null}

                    <TouchableOpacity
                      style={[styles.diagSubmitBtn, diagEnvoi && { opacity: 0.6 }]}
                      onPress={handleDiagnostiquer}
                      disabled={diagEnvoi}>
                      {diagEnvoi ? (
                        <ActivityIndicator color={colors.forest950} size="small" />
                      ) : (
                        <Text style={styles.diagSubmitTexte}>Diagnostiquer</Text>
                      )}
                    </TouchableOpacity>

                    {diagLance && (
                      <View style={styles.diagResultBox}>
                        {diagResultat ? (
                          <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
                            <CircularGauge
                              percentage={diagResultat.confiance}
                              size={56}
                              color={colors.mint400}
                              bgColor={colors.forest800}
                            />
                            <View style={{ flex: 1, gap: 4 }}>
                              <Text style={styles.diagResultTitre}>{diagResultat.maladie}</Text>
                              <Text style={styles.diagResultTexte}>
                                Traitement biologique suggere : {diagResultat.traitement_bio}
                              </Text>
                              <Text style={styles.diagResultAttente}>
                                Ce diagnostic est en attente de validation par un expert.
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <Text style={styles.diagResultTexte}>
                            Aucune correspondance suffisante trouvee. Un expert va examiner ce signalement.
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </ThemedCard>
            )}

            {categories.length > 0 && (
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, !categorieActive && styles.chipActive]}
                  onPress={() => setCategorieActive(null)}>
                  <Text style={[styles.chipTexte, !categorieActive && styles.chipTexteActive]}>Tous</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, categorieActive === cat && styles.chipActive]}
                    onPress={() => setCategorieActive(cat)}>
                    <Text style={[styles.chipTexte, categorieActive === cat && styles.chipTexteActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={<Text style={styles.vide}>Aucun conseil disponible</Text>}
        renderItem={({ item, index }) => {
          const couleur = couleurCategorie(item.conseil_categorie, colors);
          return (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).duration(350)}>
            <ThemedCard style={styles.conseilCard}>
              <View style={styles.conseilHeader}>
                <View style={[styles.conseilIcon, { backgroundColor: hexToRgba(couleur, 0.16) }]}>
                  <Ionicons name={iconCategorie(item.conseil_categorie)} size={16} color={couleur} />
                </View>
                <Text style={styles.conseilCategorie}>{item.conseil_categorie}</Text>
              </View>
              <Text style={styles.conseilTitre}>{item.conseil_titre}</Text>
              <Text style={styles.conseilContenu}>{item.conseil_contenu}</Text>
              <Text style={styles.conseilAuteur}>
                {item.conseil_origine === 'systeme' ? 'Genere automatiquement pour toi' : `Par ${item.auteur}`}
              </Text>

              {item.conseil_origine === 'systeme' && item.conseil_categorie === 'protection' && (
                item.conseil_valide_par_expert === true ? (
                  <View style={styles.validationRow}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.mint400} />
                    <Text style={[styles.validationTexte, { color: colors.mint400 }]}>Valide par un expert</Text>
                  </View>
                ) : item.conseil_valide_par_expert === false ? (
                  <View style={styles.validationRow}>
                    <Ionicons name="close-circle" size={14} color={colors.danger} />
                    <Text style={[styles.validationTexte, { color: colors.danger }]}>Infirme par un expert</Text>
                  </View>
                ) : utilisateur?.role === 'expert' || utilisateur?.role === 'administrateur' ? (
                  <View style={styles.validationBtnsRow}>
                    <TouchableOpacity
                      style={[styles.validationBtn, { borderColor: colors.mint400 }]}
                      onPress={() => handleValiderDiagnostic(item.conseil_id, true)}>
                      <Text style={[styles.validationBtnTexte, { color: colors.mint400 }]}>Confirmer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.validationBtn, { borderColor: colors.danger }]}
                      onPress={() => handleValiderDiagnostic(item.conseil_id, false)}>
                      <Text style={[styles.validationBtnTexte, { color: colors.danger }]}>Infirmer</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.validationRow}>
                    <Ionicons name="time-outline" size={14} color={colors.accent400} />
                    <Text style={[styles.validationTexte, { color: colors.accent400 }]}>En attente de validation</Text>
                  </View>
                )
              )}
            </ThemedCard>
          </Animated.View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.forest950 },
    listContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
    chip: {
      borderWidth: 1,
      borderColor: colors.forest700,
      borderRadius: Radius.full,
      paddingVertical: 6,
      paddingHorizontal: 14,
    },
    chipActive: { backgroundColor: colors.mint400, borderColor: colors.mint400 },
    chipTexte: { fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' },
    chipTexteActive: { color: colors.forest950, fontWeight: '700' },
    vide: { color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.xl },
    conseilCard: { marginBottom: Spacing.md },
    conseilHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    conseilIcon: {
      width: 22,
      height: 22,
      borderRadius: Radius.full,
      backgroundColor: colors.forest700,
      alignItems: 'center',
      justifyContent: 'center',
    },
    conseilCategorie: {
      fontSize: 10,
      color: colors.mint400,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    conseilTitre: { fontSize: 15, fontWeight: 'bold', color: colors.white, marginTop: 6 },
    conseilContenu: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
    conseilAuteur: { fontSize: 11, color: colors.primary400, marginTop: Spacing.sm },
    diagCard: { marginBottom: Spacing.md },
    diagHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    diagTitre: { fontSize: 14, fontWeight: '700', color: colors.white },
    diagToggle: { fontSize: 12, color: colors.mint400, fontWeight: '600' },
    diagLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    symptomeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
    symptomeTexte: { fontSize: 12, color: colors.white, flex: 1 },
    diagErreur: { color: colors.danger, fontSize: 12 },
    diagSubmitBtn: {
      backgroundColor: colors.mint400,
      borderRadius: Radius.full,
      paddingVertical: 10,
      alignItems: 'center',
    },
    diagSubmitTexte: { color: colors.forest950, fontWeight: '700', fontSize: 13 },
    diagResultBox: { backgroundColor: colors.forest700, borderRadius: 10, padding: 10, gap: 4 },
    diagResultTitre: { fontSize: 14, fontWeight: '700', color: colors.white },
    diagResultTexte: { fontSize: 12, color: colors.textMuted },
    diagResultAttente: { fontSize: 11, color: colors.accent400, marginTop: 4 },
    validationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.sm },
    validationTexte: { fontSize: 11, fontWeight: '600' },
    validationBtnsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
    validationBtn: { flex: 1, borderWidth: 1, borderRadius: Radius.full, paddingVertical: 6, alignItems: 'center' },
    validationBtnTexte: { fontSize: 11, fontWeight: '700' },
  });
}
