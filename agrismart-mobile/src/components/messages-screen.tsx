import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getContacts, Contact } from '@/services/profilService';
import { getMessagesNonLus, Message } from '@/services/messageService';
import { Radius, Spacing, hexToRgba } from '@/constants/appTheme';
import ConversationScreen from '@/components/conversation-screen';

const roleLabels: Record<string, string> = {
  agriculteur: 'Agriculteur',
  expert: 'Expert agricole',
  administrateur: 'Administrateur',
};

const roleCouleurCle: Record<string, 'mint400' | 'sky400' | 'wheat400'> = {
  agriculteur: 'mint400',
  expert: 'sky400',
  administrateur: 'wheat400',
};

type Filtre = 'tous' | 'non_lus';

export default function MessagesScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const [destinataireActif, setDestinataireActif] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messagesNonLus, setMessagesNonLus] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('tous');

  const charger = useCallback(async () => {
    try {
      const [listeContacts, nonLus] = await Promise.all([
        getContacts(token),
        getMessagesNonLus(token),
      ]);
      setContacts(listeContacts);
      setMessagesNonLus(nonLus);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    charger();
  }, [charger]);

  function nbNonLusDe(contactId: number) {
    return messagesNonLus.filter((m) => m.expediteur_id === contactId).length;
  }

  const contactsFiltres = useMemo(() => {
    return contacts
      .filter((c) => c.utilisateur_nom.toLowerCase().includes(recherche.toLowerCase()))
      .filter((c) => (filtre === 'non_lus' ? nbNonLusDe(c.utilisateur_id) > 0 : true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts, recherche, filtre, messagesNonLus]);

  const totalNonLus = messagesNonLus.length;

  if (destinataireActif !== null) {
    return (
      <ConversationScreen
        destinataireId={destinataireActif.utilisateur_id}
        destinataireNom={destinataireActif.utilisateur_nom}
        onRetour={() => {
          setDestinataireActif(null);
          charger();
        }}
      />
    );
  }

  const styles = getStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.mint400} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titreBloc}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.sousTitre}>Votre correspondance avec la communauté</Text>
      </View>

      <View style={styles.rechercheZone}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.rechercheInput}
          placeholder="Rechercher un contact..."
          placeholderTextColor={colors.textMuted}
          value={recherche}
          onChangeText={setRecherche}
        />
      </View>

      <View style={styles.filtres}>
        <TouchableOpacity
          style={[styles.chip, filtre === 'tous' && { backgroundColor: colors.mint400 }]}
          onPress={() => setFiltre('tous')}>
          <Text style={[styles.chipTexte, filtre === 'tous' && { color: colors.forest950 }]}>Tous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, filtre === 'non_lus' && { backgroundColor: colors.mint400 }]}
          onPress={() => setFiltre('non_lus')}>
          <Text style={[styles.chipTexte, filtre === 'non_lus' && { color: colors.forest950 }]}>
            Non lus {totalNonLus > 0 ? `(${totalNonLus})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contactsFiltres}
        keyExtractor={(item) => String(item.utilisateur_id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color={colors.textMuted} />
            <Text style={styles.vide}>Aucun contact disponible</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const nonLus = nbNonLusDe(item.utilisateur_id);
          const couleur = colors[roleCouleurCle[item.utilisateur_role] || 'mint400'];
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(300)}>
              <TouchableOpacity onPress={() => setDestinataireActif(item)} activeOpacity={0.7} style={styles.card}>
                <View style={[styles.avatar, { backgroundColor: hexToRgba(couleur, 0.18) }]}>
                  <Text style={[styles.avatarTxt, { color: couleur }]}>
                    {item.utilisateur_nom.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nom}>{item.utilisateur_nom}</Text>
                  <Text style={styles.role}>{roleLabels[item.utilisateur_role] || item.utilisateur_role}</Text>
                </View>
                {nonLus > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeTxt}>{nonLus}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
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
    titreBloc: { marginTop: Spacing.lg, marginBottom: Spacing.md, paddingHorizontal: Spacing.lg },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.white,
    },
    sousTitre: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
    rechercheZone: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: colors.forest900,
      borderWidth: 1,
      borderColor: colors.forest700,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      marginHorizontal: Spacing.lg,
    },
    rechercheInput: { flex: 1, paddingVertical: 11, color: colors.white, fontSize: 14 },
    filtres: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginTop: Spacing.sm },
    chip: {
      backgroundColor: colors.forest900,
      borderWidth: 1,
      borderColor: colors.forest700,
      borderRadius: Radius.full,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    chipTexte: { fontSize: 12.5, fontWeight: '600', color: colors.textMuted },
    listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
    emptyState: { alignItems: 'center', marginTop: 60, gap: Spacing.sm },
    vide: { color: colors.textMuted, fontStyle: 'italic' },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: colors.forest900,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.forest700,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarTxt: { fontWeight: '800', fontSize: 17 },
    nom: { fontSize: 15, fontWeight: '700', color: colors.white },
    role: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    badge: {
      backgroundColor: colors.danger,
      borderRadius: Radius.full,
      minWidth: 22,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    badgeTxt: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  });
}
