import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Radius, Spacing, hexToRgba } from '@/constants/appTheme';
import ThemedCard from '@/components/ui/ThemedCard';
import ScreenHeader from '@/components/ui/ScreenHeader';
import {
  getSujet,
  likerReponse,
  likerSujet,
  repondreSujet,
  ReponseForum,
  supprimerReponse,
  supprimerSujet,
  SujetForumDetail,
} from '@/services/forumService';

export default function SujetForumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sujetId = Number(id);
  const { token, utilisateur } = useAuth();
  const { colors } = useTheme();

  const [sujet, setSujet] = useState<SujetForumDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [contenu, setContenu] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(async () => {
    try {
      const detail = await getSujet(token, sujetId);
      setSujet(detail);
    } catch (e) {
      console.log('Erreur chargement sujet', e);
    } finally {
      setLoading(false);
    }
  }, [token, sujetId]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  const peutSupprimerSujet =
    !!sujet && (sujet.utilisateur_id === utilisateur?.id || utilisateur?.role === 'administrateur');

  function confirmerSuppressionSujet() {
    Alert.alert('Supprimer ce sujet ?', 'Cette action est irreversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await supprimerSujet(token, sujetId);
            router.back();
          } catch (e: any) {
            Alert.alert('Erreur', e.message || 'Impossible de supprimer');
          }
        },
      },
    ]);
  }

  function confirmerSuppressionReponse(reponse: ReponseForum) {
    Alert.alert('Supprimer cette reponse ?', '', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await supprimerReponse(token, reponse.reponse_id);
            charger();
          } catch (e: any) {
            Alert.alert('Erreur', e.message || 'Impossible de supprimer');
          }
        },
      },
    ]);
  }

  async function handleLikerSujet() {
    try {
      const { deja_like, nombre_likes } = await likerSujet(token, sujetId);
      setSujet((prev) => (prev ? { ...prev, deja_like, nombre_likes } : prev));
    } catch (e) {
      console.log('Erreur like sujet', e);
    }
  }

  async function handleLikerReponse(reponseId: number) {
    try {
      const { deja_like, nombre_likes } = await likerReponse(token, reponseId);
      setSujet((prev) =>
        prev
          ? {
              ...prev,
              reponses: prev.reponses.map((r) =>
                r.reponse_id === reponseId ? { ...r, deja_like, nombre_likes } : r
              ),
            }
          : prev
      );
    } catch (e) {
      console.log('Erreur like reponse', e);
    }
  }

  async function handleRepondre() {
    if (!contenu.trim()) return;
    setEnvoi(true);
    try {
      await repondreSujet(token, sujetId, { contenu: contenu.trim() });
      setContenu('');
      charger();
    } catch (e: any) {
      Alert.alert('Erreur', e.message || "Impossible d'envoyer la reponse");
    } finally {
      setEnvoi(false);
    }
  }

  const styles = getStyles(colors);

  if (loading || !sujet) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader titre="Sujet" />
        <ActivityIndicator size="large" color={colors.mint400} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <SafeAreaView style={styles.container}>
        <ScreenHeader titre={sujet.sujet_titre} />
        <FlatList
          data={sujet.reponses}
          keyExtractor={(item) => String(item.reponse_id)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <ThemedCard style={styles.sujetCard}>
              <View style={styles.sujetHeader}>
                <View style={styles.badge}>
                  <Text style={styles.badgeTexte}>{sujet.sujet_categorie}</Text>
                </View>
                {peutSupprimerSujet && (
                  <TouchableOpacity onPress={confirmerSuppressionSujet}>
                    <Ionicons name="trash" size={16} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.sujetTitre}>{sujet.sujet_titre}</Text>
              <Text style={styles.sujetContenu}>{sujet.sujet_contenu}</Text>
              <View style={styles.auteurRow}>
                <Text style={styles.sujetAuteur}>
                  {sujet.auteur} • {new Date(sujet.created_at).toLocaleDateString('fr-FR')}
                </Text>
                {sujet.auteur_role === 'expert' && (
                  <View style={styles.expertBadge}>
                    <Ionicons name="checkmark-circle" size={11} color={colors.mint400} />
                    <Text style={styles.expertBadgeTexte}>Expert verifie</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.likeRow} onPress={handleLikerSujet}>
                <Ionicons
                  name={sujet.deja_like ? 'heart' : 'heart-outline'}
                  size={16}
                  color={sujet.deja_like ? '#EF4444' : colors.textMuted}
                />
                <Text style={styles.likeTexte}>{sujet.nombre_likes || 0}</Text>
              </TouchableOpacity>
            </ThemedCard>
          }
          ListEmptyComponent={<Text style={styles.vide}>Aucune reponse pour le moment</Text>}
          renderItem={({ item }) => {
            const peutSupprimerReponse =
              item.utilisateur_id === utilisateur?.id || utilisateur?.role === 'administrateur';
            return (
              <ThemedCard style={styles.reponseCard}>
                <View style={styles.reponseHeader}>
                  <View style={styles.auteurRow}>
                    <Text style={styles.reponseAuteur}>{item.auteur}</Text>
                    {item.auteur_role === 'expert' && (
                      <View style={styles.expertBadge}>
                        <Ionicons name="checkmark-circle" size={11} color={colors.mint400} />
                        <Text style={styles.expertBadgeTexte}>Expert verifie</Text>
                      </View>
                    )}
                  </View>
                  {peutSupprimerReponse && (
                    <TouchableOpacity onPress={() => confirmerSuppressionReponse(item)}>
                      <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.reponseContenu}>{item.reponse_contenu}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.reponseDate}>
                    {new Date(item.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                  <TouchableOpacity style={styles.likeRow} onPress={() => handleLikerReponse(item.reponse_id)}>
                    <Ionicons
                      name={item.deja_like ? 'heart' : 'heart-outline'}
                      size={14}
                      color={item.deja_like ? '#EF4444' : colors.textMuted}
                    />
                    <Text style={styles.likeTexte}>{item.nombre_likes || 0}</Text>
                  </TouchableOpacity>
                </View>
              </ThemedCard>
            );
          }}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ecrire une reponse..."
            placeholderTextColor={colors.textMuted}
            value={contenu}
            onChangeText={setContenu}
            multiline
          />
          <TouchableOpacity style={styles.envoyerBtn} onPress={handleRepondre} disabled={envoi}>
            {envoi ? (
              <ActivityIndicator color={colors.forest950} size="small" />
            ) : (
              <Ionicons name="send" size={17} color={colors.forest950} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.forest950 },
    listContent: { padding: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.sm },
    vide: { color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.lg },
    sujetCard: { gap: 6, marginBottom: Spacing.md },
    sujetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    badge: { backgroundColor: hexToRgba(colors.mint400, 0.15), borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
    badgeTexte: { fontSize: 10, fontWeight: '700', color: colors.mint400 },
    sujetTitre: { fontSize: 17, fontWeight: '800', color: colors.white },
    sujetContenu: { fontSize: 14, color: colors.white, lineHeight: 20 },
    sujetAuteur: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
    auteurRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    expertBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    expertBadgeTexte: { fontSize: 10, color: colors.mint400, fontWeight: '700' },
    likeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    likeTexte: { fontSize: 11, color: colors.textMuted },
    reponseCard: { gap: 4 },
    reponseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reponseAuteur: { fontSize: 12.5, fontWeight: '700', color: colors.mint400 },
    reponseContenu: { fontSize: 13.5, color: colors.white, lineHeight: 19 },
    reponseDate: { fontSize: 10, color: colors.textMuted },
    inputBar: {
      flexDirection: 'row',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.forest700,
      alignItems: 'flex-end',
      gap: 8,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.forest700,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      maxHeight: 100,
      color: colors.white,
    },
    envoyerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.mint400,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
