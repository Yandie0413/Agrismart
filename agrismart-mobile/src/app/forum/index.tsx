import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { ajouterActionEnAttente } from '@/utils/cacheHorsLigne';
import { Radius, Spacing, hexToRgba } from '@/constants/appTheme';
import ThemedCard from '@/components/ui/ThemedCard';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { creerSujet, getSujets, likerSujet, SujetForum } from '@/services/forumService';

const CATEGORIES = ['general', 'irrigation', 'maladie', 'recolte', 'materiel', 'marche'];

export default function ForumScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const { enLigne } = useNetwork();
  const [sujets, setSujets] = useState<SujetForum[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categorieActive, setCategorieActive] = useState<string | null>(null);

  const [formOuvert, setFormOuvert] = useState(false);
  const [titre, setTitre] = useState('');
  const [categorie, setCategorie] = useState('general');
  const [contenu, setContenu] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const chargerListe = useCallback(async () => {
    try {
      const liste = await getSujets(token);
      setSujets(liste);
    } catch (e) {
      console.log('Erreur chargement forum', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      chargerListe();
    }, [chargerListe])
  );

  function onRefresh() {
    setRefreshing(true);
    chargerListe();
  }

  async function soumettreSujet() {
    setErreur('');
    if (!titre.trim() || !contenu.trim()) {
      setErreur('Le titre et le contenu sont obligatoires');
      return;
    }

    if (!enLigne) {
      await ajouterActionEnAttente('sujet_forum', { titre: titre.trim(), contenu: contenu.trim(), categorie });
      setTitre('');
      setContenu('');
      setCategorie('general');
      setFormOuvert(false);
      Alert.alert('Hors-ligne', 'Ce sujet sera publié dès que la connexion reviendra.');
      return;
    }

    setEnvoi(true);
    try {
      await creerSujet(token, { titre: titre.trim(), contenu: contenu.trim(), categorie });
      setTitre('');
      setContenu('');
      setCategorie('general');
      setFormOuvert(false);
      chargerListe();
    } catch (e: any) {
      setErreur(e.message || "Erreur lors de la publication");
    } finally {
      setEnvoi(false);
    }
  }

  async function handleLiker(sujetId: number) {
    try {
      const { deja_like, nombre_likes } = await likerSujet(token, sujetId);
      setSujets((prev) =>
        prev.map((s) => (s.sujet_id === sujetId ? { ...s, deja_like, nombre_likes } : s))
      );
    } catch (e) {
      console.log('Erreur like sujet', e);
    }
  }

  const sujetsFiltres = categorieActive ? sujets.filter((s) => s.sujet_categorie === categorieActive) : sujets;

  const styles = getStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader titre="Forum agricole" />
        <ActivityIndicator size="large" color={colors.mint400} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        titre="Forum agricole"
        droite={
          <TouchableOpacity style={styles.addBtn} onPress={() => setFormOuvert((v) => !v)}>
            <Ionicons name={formOuvert ? 'close' : 'add'} size={18} color={colors.forest950} />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={sujetsFiltres}
        keyExtractor={(item) => String(item.sujet_id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mint400} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {formOuvert && (
              <ThemedCard style={styles.formCard}>
                <Text style={styles.label}>Titre</Text>
                <TextInput
                  style={styles.input}
                  value={titre}
                  onChangeText={setTitre}
                  placeholder="Ex: Probleme d'irrigation sur riziere"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.label}>Categorie</Text>
                <View style={styles.chipsRow}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, categorie === cat && styles.chipActive]}
                      onPress={() => setCategorie(cat)}>
                      <Text style={[styles.chipTexte, categorie === cat && styles.chipTexteActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>Contenu</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={contenu}
                  onChangeText={setContenu}
                  placeholder="Decris ta question ou ton conseil..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
                {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}
                <View style={styles.rowBtns}>
                  <TouchableOpacity style={styles.btnSecondaire} onPress={() => setFormOuvert(false)}>
                    <Text style={styles.btnSecondaireTexte}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnPrimaire} onPress={soumettreSujet} disabled={envoi}>
                    {envoi ? (
                      <ActivityIndicator color={colors.forest950} size="small" />
                    ) : (
                      <Text style={styles.btnPrimaireTexte}>Publier</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ThemedCard>
            )}
            <View style={styles.chipsRow}>
              <TouchableOpacity
                style={[styles.chip, !categorieActive && styles.chipActive]}
                onPress={() => setCategorieActive(null)}>
                <Text style={[styles.chipTexte, !categorieActive && styles.chipTexteActive]}>Tous</Text>
              </TouchableOpacity>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, categorieActive === cat && styles.chipActive]}
                  onPress={() => setCategorieActive(cat)}>
                  <Text style={[styles.chipTexte, categorieActive === cat && styles.chipTexteActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.vide}>Aucun sujet pour le moment</Text>}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(`/forum/${item.sujet_id}` as any)}>
              <ThemedCard style={styles.sujetCard}>
                <View style={styles.sujetHeader}>
                  <Text style={styles.sujetTitre} numberOfLines={1}>
                    {item.sujet_titre}
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeTexte}>{item.sujet_categorie}</Text>
                  </View>
                </View>
                <Text style={styles.sujetDetail} numberOfLines={2}>
                  {item.sujet_contenu}
                </Text>
                <View style={styles.sujetFooter}>
                  <View style={styles.sujetAuteurRow}>
                    <Text style={styles.sujetAuteur}>{item.auteur}</Text>
                    {item.auteur_role === 'expert' && (
                      <View style={styles.expertBadge}>
                        <Ionicons name="checkmark-circle" size={11} color={colors.mint400} />
                        <Text style={styles.expertBadgeTexte}>Expert verifie</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                    <TouchableOpacity style={styles.reponsesRow} onPress={() => handleLiker(item.sujet_id)}>
                      <Ionicons
                        name={item.deja_like ? 'heart' : 'heart-outline'}
                        size={13}
                        color={item.deja_like ? '#EF4444' : colors.textMuted}
                      />
                      <Text style={styles.reponsesTexte}>{item.nombre_likes || 0}</Text>
                    </TouchableOpacity>
                    <View style={styles.reponsesRow}>
                      <Ionicons name="chatbubble-outline" size={12} color={colors.textMuted} />
                      <Text style={styles.reponsesTexte}>{item.nombre_reponses || 0}</Text>
                    </View>
                  </View>
                </View>
              </ThemedCard>
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.forest950 },
    listContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.sm },
    addBtn: {
      width: 30,
      height: 30,
      borderRadius: Radius.full,
      backgroundColor: colors.mint400,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
    chip: {
      borderWidth: 1,
      borderColor: colors.forest700,
      borderRadius: Radius.full,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    chipActive: { backgroundColor: colors.mint400, borderColor: colors.mint400 },
    chipTexte: { fontSize: 12, color: colors.textMuted },
    chipTexteActive: { color: colors.forest950, fontWeight: '700' },
    vide: { color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.xl },
    sujetCard: { gap: 6, marginBottom: Spacing.sm },
    sujetHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    sujetTitre: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.white },
    badge: { backgroundColor: hexToRgba(colors.mint400, 0.15), borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
    badgeTexte: { fontSize: 10, fontWeight: '700', color: colors.mint400 },
    sujetDetail: { fontSize: 12.5, color: colors.textMuted },
    sujetFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
    sujetAuteurRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
    sujetAuteur: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
    expertBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    expertBadgeTexte: { fontSize: 10, color: colors.mint400, fontWeight: '700' },
    reponsesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    reponsesTexte: { fontSize: 11, color: colors.textMuted },
    formCard: { gap: 4, marginBottom: Spacing.md },
    label: { fontSize: 12, color: colors.textMuted, marginTop: Spacing.sm, marginBottom: 4 },
    input: {
      backgroundColor: colors.forest800,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.white,
      fontSize: 14,
    },
    inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
    erreur: { color: colors.danger, fontSize: 12, marginTop: Spacing.sm },
    rowBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
    btnSecondaire: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.forest700,
      borderRadius: Radius.full,
      paddingVertical: 10,
      alignItems: 'center',
    },
    btnSecondaireTexte: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
    btnPrimaire: {
      flex: 1,
      backgroundColor: colors.mint400,
      borderRadius: Radius.full,
      paddingVertical: 10,
      alignItems: 'center',
    },
    btnPrimaireTexte: { color: colors.forest950, fontWeight: '700', fontSize: 13 },
  });
}
