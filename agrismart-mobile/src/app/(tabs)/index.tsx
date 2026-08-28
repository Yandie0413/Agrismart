import { useCallback, useEffect, useState } from 'react';
import { getMesExploitations, Exploitation } from '@/services/exploitationService';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Alerte,
  declencherAlerteRegionale,
  getDernierReleve,
  getMesAlertesRegion,
  getMeteoParCoordonnees,
  Meteo,
  MeteoTempsReel,
} from '@/services/meteoService';
import { getMesLocalisations } from '@/services/localisationService';
import { genererConseilsAutomatiques, getConseils, Conseil } from '@/services/conseilService';
import { getDashboardProfil } from '@/services/profilService';
import { Radius, Spacing, hexToRgba } from '@/constants/appTheme';
import ThemedCard from '@/components/ui/ThemedCard';
import WeatherHero from '@/components/weather-hero';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { couleurCategorie, iconCategorie } from '@/utils/categorieConseil';

const ACTION_PAR_STADE: Record<string, string> = {
  Germination: 'Surveiller la levée, arroser légèrement',
  Croissance: 'Sarclage et désherbage',
  Floraison: 'Surveiller la pollinisation, éviter les traitements agressifs',
  Recolte: 'Préparer la récolte',
};

type CultureCalendrier = {
  culture_id: number;
  culture_type: string;
  exploitation_nom: string;
  stade_culture: 'Germination' | 'Croissance' | 'Floraison' | 'Recolte';
  jours_depuis_plantation: number;
};

const COULEUR_ALERTE: Record<string, string> = {
  gel: '#3B82F6',
  canicule: '#F97316',
  secheresse: '#F97316',
  inondation: '#EF4444',
  maladie: '#F59E0B',
};

const RACCOURCIS = [
  { route: '/meteo', label: 'Météo', icon: 'partly-sunny' as const },
  { route: '/conseils', label: 'Conseils', icon: 'bulb' as const },
  { route: '/marches', label: 'Marché', icon: 'cart' as const },
  { route: '/localisation', label: 'Parcelles', icon: 'map' as const },
  { route: '/statistiques', label: 'Stats', icon: 'bar-chart' as const },
  { route: '/forum', label: 'Forum', icon: 'people' as const },
];

export default function DashboardScreen() {
  const { utilisateur, token, logout } = useAuth();
  const { colors, mode, toggleTheme } = useTheme();
  const router = useRouter();
  const [meteoReel, setMeteoReel] = useState<MeteoTempsReel | null>(null);
  const [meteoFallback, setMeteoFallback] = useState<Meteo | null>(null);
  const [conseils, setConseils] = useState<Conseil[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erreur, setErreur] = useState('');
  const [exploitation, setExploitation] = useState<Exploitation | null>(null);
  const [alertesRegion, setAlertesRegion] = useState<Alerte[]>([]);
  const [toutesCultures, setToutesCultures] = useState<CultureCalendrier[]>([]);

  const [formOuvert, setFormOuvert] = useState(false);
  const [region, setRegion] = useState('');
  const [typeMenace, setTypeMenace] = useState('');
  const [recommandation, setRecommandation] = useState('');
  const [envoiAlerte, setEnvoiAlerte] = useState(false);
  const [messageAlerte, setMessageAlerte] = useState('');

  const charger = useCallback(async () => {
    setErreur('');
    try {
      if (utilisateur?.role === 'agriculteur') {
        try {
          await genererConseilsAutomatiques(token);
        } catch (e) {
          console.log('Erreur generation conseils automatiques', e);
        }
      }
      const [localisations, listeConseils, listeExploitations] = await Promise.all([
        getMesLocalisations(token),
        getConseils(token),
        // Reserve aux agriculteurs cote backend : on evite l'appel pour les autres roles
        // (sinon son rejet fait echouer tout le Promise.all, meteo/conseils inclus).
        utilisateur?.role === 'agriculteur' ? getMesExploitations(token) : Promise.resolve([]),
      ]);
      setConseils(listeConseils.slice(0, 5));
      setExploitation(listeExploitations[0] || null);

      if (utilisateur?.role === 'agriculteur') {
        try {
          const [alertes, dashboard] = await Promise.all([
            getMesAlertesRegion(token),
            getDashboardProfil(token),
          ]);
          setAlertesRegion(alertes);
          setToutesCultures(dashboard?.toutes_cultures || []);
        } catch (e) {
          console.log('Erreur chargement alertes/cultures', e);
        }
      }

      if (localisations.length > 0) {
        const loc = localisations[0];
        try {
          const meteo = await getMeteoParCoordonnees(
            loc.localisation_latitude,
            loc.localisation_longitude,
            token
          );
          setMeteoReel(meteo);
        } catch (e: any) {
          setErreur('Erreur meteo: ' + (e.message || 'inconnue'));
          setMeteoFallback(await getDernierReleve(token));
        }
      } else {
        setErreur('Aucune localisation trouvee pour ce compte');
        setMeteoFallback(await getDernierReleve(token));
      }
    } catch (e: any) {
      setErreur(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, utilisateur?.role]);

  useEffect(() => {
    charger();
  }, [charger]);

  function onRefresh() {
    setRefreshing(true);
    charger();
  }

  async function handleDeclencherAlerte() {
    setEnvoiAlerte(true);
    setMessageAlerte('');
    try {
      await declencherAlerteRegionale(token, {
        region: region.trim(),
        type_menace: typeMenace.trim(),
        recommandation: recommandation.trim(),
      });
      setMessageAlerte('Alerte diffusée aux agriculteurs de la région');
      setRegion('');
      setTypeMenace('');
      setRecommandation('');
    } catch (e: any) {
      setMessageAlerte(e.message || 'Erreur lors de la diffusion de l\'alerte');
    } finally {
      setEnvoiAlerte(false);
    }
  }

  const styles = getStyles(colors);
  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.mint400} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={conseils}
        keyExtractor={(item) => String(item.conseil_id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mint400} />
        }
        ListHeaderComponent={
          <View>
            {utilisateur?.role === 'agriculteur' && alertesRegion.length > 0 && (
              <View style={styles.alertesZone}>
                {alertesRegion.map((a) => {
                  const couleur = COULEUR_ALERTE[a.alerte_type?.toLowerCase()] || colors.danger;
                  return (
                    <View
                      key={a.alerte_id}
                      style={[styles.alerteCard, { borderColor: couleur, backgroundColor: hexToRgba(couleur, 0.12) }]}>
                      <Ionicons name="warning" size={18} color={couleur} style={{ marginTop: 2 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.alerteTitre, { color: couleur }]}>
                          {a.alerte_region ? `${a.alerte_type} — ${a.alerte_region}` : a.alerte_type}
                        </Text>
                        <Text style={styles.alerteMessage}>{a.alerte_message}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTxt}>
                    {(utilisateur?.nom || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.greeting}>Bonjour, {utilisateur?.nom}</Text>
                  <Text style={styles.role}>{dateAujourdhui}</Text>
                </View>
              </View>
              <View style={styles.headerBtns}>
                <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
                  <Ionicons
                    name={mode === 'dark' ? 'sunny' : 'moon'}
                    size={20}
                    color={mode === 'dark' ? colors.accent400 : colors.mint500}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                  <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.raccourcisRow}>
              {RACCOURCIS.map((r) => (
                <TouchableOpacity key={r.route} style={styles.raccourci} onPress={() => router.push(r.route as any)}>
                  <View style={styles.raccourciIcon}>
                    <Ionicons name={r.icon} size={20} color={colors.mint400} />
                  </View>
                  <Text style={styles.raccourciLabel}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

            {meteoReel ? (
              <WeatherHero meteo={meteoReel} />
            ) : meteoFallback ? (
              <ThemedCard style={styles.meteoCard}>
                <Text style={styles.temperature}>{Math.round(meteoFallback.meteo_temperature)}°C</Text>
                <View style={styles.meteoStats}>
                  <Text style={styles.meteoDetail}>Humidite {meteoFallback.meteo_humidite}%</Text>
                  <Text style={styles.meteoDetail}>{meteoFallback.meteo_prevision}</Text>
                </View>
              </ThemedCard>
            ) : (
              <Text style={styles.vide}>Aucune donnee meteo disponible</Text>
            )}

            {exploitation && (
              <>
                <Text style={styles.sectionTitle}>Mon exploitation</Text>
                <TouchableOpacity onPress={() => router.push(`/exploitation/${exploitation.exploitation_id}`)}>
                  <ThemedCard style={styles.exploitationCard}>
                    <View style={styles.exploitationIcon}>
                      <Ionicons name="leaf" size={22} color={colors.mint400} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exploitationNom}>{exploitation.exploitation_nom}</Text>
                      <Text style={styles.exploitationDetail}>
                        {exploitation.exploitation_superficie} hectares
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </ThemedCard>
                </TouchableOpacity>
              </>
            )}

            {toutesCultures.filter((c) => c.stade_culture !== 'Recolte').length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Prochaines actions</Text>
                {toutesCultures
                  .filter((c) => c.stade_culture !== 'Recolte')
                  .slice(0, 6)
                  .map((c) => {
                    const joursRestants = Math.max(0, 180 - c.jours_depuis_plantation);
                    const action = ACTION_PAR_STADE[c.stade_culture];
                    return (
                      <ThemedCard key={c.culture_id} style={styles.actionCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.actionTitre} numberOfLines={1}>
                            {c.culture_type}
                          </Text>
                          <Text style={styles.actionDetail} numberOfLines={1}>
                            {c.exploitation_nom} · {c.stade_culture}
                          </Text>
                          {action && <Text style={styles.actionTexte}>→ {action}</Text>}
                        </View>
                        <Text style={styles.actionJours}>{joursRestants}j</Text>
                      </ThemedCard>
                    );
                  })}
              </>
            )}

            {(utilisateur?.role === 'expert' || utilisateur?.role === 'administrateur') && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Alerte régionale</Text>
                  <TouchableOpacity onPress={() => setFormOuvert((v) => !v)}>
                    <Text style={styles.voirTout}>{formOuvert ? 'Fermer' : 'Déclencher une alerte'}</Text>
                  </TouchableOpacity>
                </View>
                {formOuvert && (
                  <ThemedCard style={styles.formCard}>
                    {messageAlerte ? <Text style={styles.formMessage}>{messageAlerte}</Text> : null}
                    <TextInput
                      style={styles.input}
                      placeholder="Région ciblée (ex: Analamanga)"
                      placeholderTextColor={colors.textMuted}
                      value={region}
                      onChangeText={setRegion}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Type de menace (ex: Cyclone, Invasion de criquets...)"
                      placeholderTextColor={colors.textMuted}
                      value={typeMenace}
                      onChangeText={setTypeMenace}
                    />
                    <TextInput
                      style={[styles.input, styles.inputMultiline]}
                      placeholder="Recommandation technique à diffuser"
                      placeholderTextColor={colors.textMuted}
                      value={recommandation}
                      onChangeText={setRecommandation}
                      multiline
                      numberOfLines={3}
                    />
                    <TouchableOpacity
                      style={[styles.submitBtn, envoiAlerte && { opacity: 0.6 }]}
                      onPress={handleDeclencherAlerte}
                      disabled={envoiAlerte || !region.trim() || !typeMenace.trim() || !recommandation.trim()}>
                      {envoiAlerte ? (
                        <ActivityIndicator color={colors.forest950} size="small" />
                      ) : (
                        <Text style={styles.submitBtnTexte}>Diffuser l&apos;alerte</Text>
                      )}
                    </TouchableOpacity>
                  </ThemedCard>
                )}
              </>
            )}

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Conseils de culture</Text>
              {conseils.length > 0 && (
                <TouchableOpacity onPress={() => router.push('/conseils')}>
                  <Text style={styles.voirTout}>Voir tout</Text>
                </TouchableOpacity>
              )}
            </View>
            {conseils.length === 0 && <Text style={styles.vide}>Aucun conseil disponible</Text>}
          </View>
        }
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
              <Text style={styles.conseilContenu} numberOfLines={3}>
                {item.conseil_contenu}
              </Text>
              <Text style={styles.conseilAuteur}>
                {item.conseil_origine === 'systeme' ? 'Genere automatiquement pour toi' : `Par ${item.auteur}`}
              </Text>
            </ThemedCard>
          </Animated.View>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.forest950 },
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.lg,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: Radius.full,
      backgroundColor: colors.mint400,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarTxt: { color: colors.forest950, fontWeight: 'bold', fontSize: 18 },
    greeting: { fontSize: 20, fontWeight: 'bold', color: colors.white },
    role: { fontSize: 13, color: colors.mint400, textTransform: 'capitalize', marginTop: 2 },
    headerBtns: { flexDirection: 'row', gap: Spacing.sm },
    themeBtn: {
      width: 38,
      height: 38,
      borderRadius: Radius.full,
      backgroundColor: colors.forest800,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutBtn: {
      width: 38,
      height: 38,
      borderRadius: Radius.full,
      backgroundColor: colors.forest800,
      alignItems: 'center',
      justifyContent: 'center',
    },
    raccourcisRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    raccourci: { alignItems: 'center', gap: 6, width: 60 },
    raccourciIcon: {
      width: 46,
      height: 46,
      borderRadius: Radius.full,
      backgroundColor: colors.forest800,
      alignItems: 'center',
      justifyContent: 'center',
    },
    raccourciLabel: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
    erreur: { color: colors.danger, marginBottom: Spacing.md },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    voirTout: { color: colors.mint400, fontSize: 12, fontWeight: '700' },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.white,
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    meteoCard: { gap: Spacing.sm },
    temperature: { fontSize: 44, fontWeight: 'bold', color: colors.mint400, marginTop: 4 },
    meteoStats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.xs },
    meteoDetail: { fontSize: 12, color: colors.textMuted },
    vide: { color: colors.textMuted, fontStyle: 'italic' },
    exploitationCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    exploitationIcon: {
      width: 42,
      height: 42,
      borderRadius: Radius.full,
      backgroundColor: colors.forest700,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exploitationNom: { fontSize: 15, fontWeight: '600', color: colors.white },
    exploitationDetail: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
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
    alertesZone: { gap: Spacing.sm, marginTop: Spacing.md },
    alerteCard: {
      flexDirection: 'row',
      gap: Spacing.sm,
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.md,
    },
    alerteTitre: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
    alerteMessage: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    actionCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    actionTitre: { fontSize: 14, fontWeight: '700', color: colors.white, textTransform: 'capitalize' },
    actionDetail: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    actionTexte: { fontSize: 11, color: colors.mint400, marginTop: 3 },
    actionJours: { fontSize: 12, fontWeight: '700', color: colors.mint400 },
    formCard: { gap: Spacing.sm },
    formMessage: { fontSize: 12, color: colors.mint400 },
    input: {
      backgroundColor: colors.forest800,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.white,
      fontSize: 13,
    },
    inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
    submitBtn: {
      backgroundColor: colors.mint400,
      borderRadius: Radius.full,
      paddingVertical: 10,
      alignItems: 'center',
    },
    submitBtnTexte: { color: colors.forest950, fontWeight: '700', fontSize: 13 },
  });
}
