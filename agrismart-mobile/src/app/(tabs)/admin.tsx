import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Radius, Spacing } from '@/constants/appTheme';
import GlassCard from '@/components/ui/GlassCard';
import {
  Contact,
  ProfilRole,
  StatistiquesAdmin,
  getExpertsEnAttente,
  getStatistiquesAdmin,
  getUtilisateurs,
  modifierRoleUtilisateur,
  supprimerUtilisateurAdmin,
  validerExpertRequest,
} from '@/services/profilService';
import { SignalementPrix, getSignalementsPrix, traiterSignalementPrix } from '@/services/marcheService';

const LARGEUR_ECRAN = Dimensions.get('window').width - Spacing.lg * 2 - Spacing.lg * 2;

type Section = 'stats' | 'utilisateurs' | 'experts';
type Role = 'agriculteur' | 'expert' | 'administrateur';

const ROLE_LABELS: Record<string, string> = {
  agriculteur: 'Agriculteur',
  expert: 'Expert',
  administrateur: 'Admin',
};

const ROLES: Role[] = ['agriculteur', 'expert', 'administrateur'];

export default function AdminScreen() {
  const { token, utilisateur } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [section, setSection] = useState<Section>('stats');
  const [stats, setStats] = useState<StatistiquesAdmin | null>(null);
  const [utilisateurs, setUtilisateurs] = useState<Contact[]>([]);
  const [expertsEnAttente, setExpertsEnAttente] = useState<ProfilRole[]>([]);
  const [signalements, setSignalements] = useState<SignalementPrix[]>([]);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, e, sig] = await Promise.all([
        getStatistiquesAdmin(token),
        getUtilisateurs(token),
        getExpertsEnAttente(token),
        getSignalementsPrix(token),
      ]);
      setStats(s);
      setUtilisateurs(u);
      setExpertsEnAttente(e);
      setSignalements(sig);
    } catch (e) {
      console.log('Erreur chargement admin', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  async function handleTraiterSignalement(id: number, statut: 'traite' | 'rejete') {
    try {
      await traiterSignalementPrix(token, id, statut);
      setSignalements((prev) => prev.filter((s) => s.signalement_id !== id));
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de traiter ce signalement');
    }
  }

  async function handleValiderExpert(id: number, statut: 'valide' | 'rejete') {
    try {
      await validerExpertRequest(token, id, statut);
      setExpertsEnAttente((prev) => prev.filter((e: any) => e.utilisateur_id !== id));
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de mettre a jour ce compte');
    }
  }

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  async function changerRole(cible: Contact, role: Role) {
    if (role === cible.utilisateur_role) return;
    try {
      await modifierRoleUtilisateur(token, cible.utilisateur_id, role);
      setUtilisateurs((prev) =>
        prev.map((u) => (u.utilisateur_id === cible.utilisateur_id ? { ...u, utilisateur_role: role } : u))
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Modification du role impossible');
    }
  }

  function confirmerSuppression(cible: Contact) {
    Alert.alert(
      'Supprimer cet utilisateur ?',
      `${cible.utilisateur_nom} (${cible.utilisateur_email}) sera definitivement supprime.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await supprimerUtilisateurAdmin(token, cible.utilisateur_id);
              setUtilisateurs((prev) => prev.filter((u) => u.utilisateur_id !== cible.utilisateur_id));
            } catch (e: any) {
              Alert.alert('Erreur', e.message || 'Suppression impossible');
            }
          },
        },
      ]
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

  const parRoleData = stats
    ? {
        labels: stats.parRole.map((r) => ROLE_LABELS[r.utilisateur_role] || r.utilisateur_role),
        datasets: [{ data: stats.parRole.map((r) => r.total) }],
      }
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.titre}>Administration</Text>
        <Text style={styles.sousTitre}>Administrez les comptes de la plateforme</Text>
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segment, section === 'stats' && styles.segmentActive]}
            onPress={() => setSection('stats')}>
            <Text style={[styles.segmentTexte, section === 'stats' && styles.segmentTexteActive]}>
              Statistiques
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, section === 'utilisateurs' && styles.segmentActive]}
            onPress={() => setSection('utilisateurs')}>
            <Text style={[styles.segmentTexte, section === 'utilisateurs' && styles.segmentTexteActive]}>
              Utilisateurs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, section === 'experts' && styles.segmentActive]}
            onPress={() => setSection('experts')}>
            <Text style={[styles.segmentTexte, section === 'experts' && styles.segmentTexteActive]}>
              Experts{expertsEnAttente.length > 0 ? ` (${expertsEnAttente.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.mint400} style={{ flex: 1 }} />
      ) : section === 'stats' ? (
        <ScrollView contentContainerStyle={styles.content}>
          {stats?.tauxResolutionExperts !== null && stats?.tauxResolutionExperts !== undefined && (
            <GlassCard style={styles.resolutionCard}>
              <View style={styles.resolutionIcon}>
                <Ionicons name="checkmark-circle" size={22} color={colors.mint400} />
              </View>
              <View>
                <Text style={styles.resolutionValeur}>{stats.tauxResolutionExperts}%</Text>
                <Text style={styles.itemDetail}>Taux de resolution des experts</Text>
              </View>
            </GlassCard>
          )}

          <View style={styles.tuilesRow}>
            {stats?.parRole.map((r) => (
              <GlassCard key={r.utilisateur_role} style={styles.tuile}>
                <Text style={styles.tuileValeur}>{r.total}</Text>
                <Text style={styles.tuileLabel}>{ROLE_LABELS[r.utilisateur_role] || r.utilisateur_role}</Text>
              </GlassCard>
            ))}
          </View>

          {parRoleData && (
            <GlassCard style={styles.chartCard}>
              <BarChart
                data={parRoleData}
                width={LARGEUR_ECRAN}
                height={200}
                fromZero
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                style={{ borderRadius: Radius.md }}
              />
            </GlassCard>
          )}

          {(stats?.culturesParType?.length ?? 0) > 0 && (
            <>
              <Text style={styles.sectionTitre}>Cultures par type</Text>
              {stats!.culturesParType.map((c) => (
                <GlassCard key={c.culture_type} style={styles.itemCard} animateEntry={false}>
                  <Text style={styles.itemTitre}>{c.culture_type}</Text>
                  <Text style={styles.itemDetail}>{c.total} exploitation(s)</Text>
                </GlassCard>
              ))}
            </>
          )}

          {(stats?.alertesParType?.length ?? 0) > 0 && (
            <>
              <Text style={styles.sectionTitre}>Alertes par type</Text>
              {stats!.alertesParType.map((a) => (
                <GlassCard key={a.alerte_type} style={styles.itemCard} animateEntry={false}>
                  <Text style={styles.itemTitre}>{a.alerte_type}</Text>
                  <Text style={styles.itemDetail}>{a.total} alerte(s)</Text>
                </GlassCard>
              ))}
            </>
          )}

          <Text style={styles.sectionTitre}>
            Signalements de prix{signalements.length > 0 ? ` (${signalements.length})` : ''}
          </Text>
          {signalements.length === 0 ? (
            <Text style={styles.itemDetail}>Aucun signalement en attente.</Text>
          ) : (
            signalements.map((s) => (
              <GlassCard key={s.signalement_id} style={styles.itemCard} animateEntry={false}>
                <Text style={styles.itemTitre}>
                  {s.marche_nom} ({s.prix_agricole} Ar) — {s.marche_localisation}
                </Text>
                <Text style={styles.itemDetail}>
                  Signale par {s.utilisateur_nom} : {s.signalement_raison}
                </Text>
                <View style={styles.roleChipsRow}>
                  <TouchableOpacity
                    style={[styles.roleChip, { borderColor: colors.mint400 }]}
                    onPress={() => handleTraiterSignalement(s.signalement_id, 'traite')}>
                    <Text style={[styles.roleChipTexte, { color: colors.mint400 }]}>Traiter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleChip, { borderColor: colors.danger }]}
                    onPress={() => handleTraiterSignalement(s.signalement_id, 'rejete')}>
                    <Text style={[styles.roleChipTexte, { color: colors.danger }]}>Rejeter</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))
          )}
        </ScrollView>
      ) : section === 'experts' ? (
        <FlatList
          data={expertsEnAttente}
          keyExtractor={(item) => String(item.utilisateur_id)}
          contentContainerStyle={styles.content}
          ListEmptyComponent={<Text style={styles.itemDetail}>Aucun expert en attente de validation.</Text>}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
              <GlassCard style={styles.utilisateurCard} animateEntry={false}>
                <Text style={styles.itemTitre}>{item.utilisateur_nom}</Text>
                <Text style={styles.itemDetail}>
                  {item.utilisateur_email} {item.utilisateur_telephone ? `· ${item.utilisateur_telephone}` : ''}
                </Text>
                {item.expert_specialite ? <Text style={styles.itemDetail}>{item.expert_specialite}</Text> : null}
                <View style={styles.roleChipsRow}>
                  <TouchableOpacity
                    style={[styles.roleChip, { borderColor: colors.mint400 }]}
                    onPress={() => handleValiderExpert(item.utilisateur_id!, 'valide')}>
                    <Text style={[styles.roleChipTexte, { color: colors.mint400 }]}>Valider</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleChip, { borderColor: colors.danger }]}
                    onPress={() => handleValiderExpert(item.utilisateur_id!, 'rejete')}>
                    <Text style={[styles.roleChipTexte, { color: colors.danger }]}>Rejeter</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </Animated.View>
          )}
        />
      ) : (
        <FlatList
          data={utilisateurs}
          keyExtractor={(item) => String(item.utilisateur_id)}
          contentContainerStyle={styles.content}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
              <GlassCard style={styles.utilisateurCard} animateEntry={false}>
                <View style={styles.utilisateurTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitre}>{item.utilisateur_nom}</Text>
                    <Text style={styles.itemDetail}>{item.utilisateur_email}</Text>
                  </View>
                  {item.utilisateur_id !== utilisateur?.id && (
                    <TouchableOpacity onPress={() => confirmerSuppression(item)} style={styles.supprimerBtn}>
                      <Ionicons name="trash" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
                {item.utilisateur_id === utilisateur?.id ? (
                  <View style={[styles.roleBadge, styles.roleBadgeAdmin]}>
                    <Text style={[styles.roleBadgeTexte, styles.roleBadgeTexteAdmin]}>
                      {ROLE_LABELS[item.utilisateur_role] || item.utilisateur_role} (toi)
                    </Text>
                  </View>
                ) : (
                  <View style={styles.roleChipsRow}>
                    {ROLES.map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.roleChip, item.utilisateur_role === r && styles.roleChipActive]}
                        onPress={() => changerRole(item, r)}>
                        <Text
                          style={[
                            styles.roleChipTexte,
                            item.utilisateur_role === r && styles.roleChipTexteActive,
                          ]}>
                          {ROLE_LABELS[r]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </GlassCard>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.forest950 },
    header: { padding: Spacing.lg, gap: Spacing.md },
    titre: { fontSize: 22, fontWeight: '800', color: colors.white },
    sousTitre: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
    segmentRow: { flexDirection: 'row', gap: Spacing.sm },
    segment: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.forest700,
      borderRadius: Radius.full,
      paddingVertical: 10,
      alignItems: 'center',
    },
    segmentActive: { backgroundColor: colors.mint400, borderColor: colors.mint400 },
    segmentTexte: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
    segmentTexteActive: { color: colors.forest950 },
    content: { padding: Spacing.lg, paddingTop: 0, paddingBottom: Spacing.xxl, gap: Spacing.md },
    resolutionCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    resolutionIcon: {
      width: 42,
      height: 42,
      borderRadius: Radius.full,
      backgroundColor: colors.forest700,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resolutionValeur: { fontSize: 20, fontWeight: '800', color: colors.white },
    tuilesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    tuile: { flexBasis: '30%', flexGrow: 1, alignItems: 'center', gap: 4 },
    tuileValeur: { fontSize: 24, fontWeight: '800', color: colors.mint400 },
    tuileLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
    chartCard: { alignItems: 'center' },
    sectionTitre: { fontSize: 15, fontWeight: '700', color: colors.white, marginTop: Spacing.sm },
    itemCard: { gap: 2, marginBottom: Spacing.sm },
    itemTitre: { fontSize: 13, fontWeight: '700', color: colors.white },
    itemDetail: { fontSize: 12, color: colors.textMuted },
    utilisateurCard: { gap: Spacing.sm, marginBottom: Spacing.sm },
    utilisateurTop: { flexDirection: 'row', alignItems: 'center' },
    roleBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.forest700,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    roleBadgeAdmin: { backgroundColor: colors.mint400 },
    roleBadgeTexte: { fontSize: 10, fontWeight: '700', color: colors.white },
    roleBadgeTexteAdmin: { color: colors.forest950 },
    supprimerBtn: { padding: Spacing.sm },
    roleChipsRow: { flexDirection: 'row', gap: Spacing.xs },
    roleChip: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.forest700,
      borderRadius: Radius.full,
      paddingVertical: 6,
      alignItems: 'center',
    },
    roleChipActive: { backgroundColor: colors.mint400, borderColor: colors.mint400 },
    roleChipTexte: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
    roleChipTexteActive: { color: colors.forest950 },
  });
}
