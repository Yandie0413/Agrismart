import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  modifierProfil, modifierProfilRole, getMonProfilRole, uploaderDiplome, ProfilRole,
} from '@/services/profilService';
import { getProfilRequest, toggleDeuxFacteursRequest } from '@/services/authService';
import { Radius, Spacing, hexToRgba } from '@/constants/appTheme';
import ThemedCard from '@/components/ui/ThemedCard';

const roleLabels: Record<string, string> = {
  agriculteur: 'Agriculteur',
  expert: 'Expert agricole',
  administrateur: 'Administrateur',
};

export default function ProfilScreen() {
  const { utilisateur, token, logout, mettreAJourUtilisateur } = useAuth();
  const { colors, mode, toggleTheme } = useTheme();
  const [modifMode, setModifMode] = useState(false);
  const [nom, setNom] = useState(utilisateur?.nom || '');
  const [email, setEmail] = useState(utilisateur?.email || '');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [deuxFacteurs, setDeuxFacteurs] = useState(false);
  const [deuxFacteursEnvoi, setDeuxFacteursEnvoi] = useState(false);

  const [profilRole, setProfilRole] = useState<ProfilRole | null>(null);
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [commune, setCommune] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [zoneCouverture, setZoneCouverture] = useState('');
  const [envoiRole, setEnvoiRole] = useState(false);
  const [envoiDiplome, setEnvoiDiplome] = useState(false);

  useEffect(() => {
    getProfilRequest(token)
      .then((data) => setDeuxFacteurs(!!data.deux_facteurs_active))
      .catch((e) => console.log('Erreur chargement profil', e));

    if (utilisateur?.role === 'agriculteur' || utilisateur?.role === 'expert') {
      getMonProfilRole(token)
        .then((p) => {
          setProfilRole(p);
          setRegion(p?.agriculteur_region || '');
          setDistrict(p?.agriculteur_district || '');
          setCommune(p?.agriculteur_commune || '');
          setSpecialite(p?.expert_specialite || '');
          setZoneCouverture(p?.expert_zone_couverture || '');
        })
        .catch((e) => console.log('Erreur chargement profil role', e));
    }
  }, [token, utilisateur?.role]);

  async function handleEnregistrerRole() {
    setEnvoiRole(true);
    setErreur('');
    setSucces('');
    try {
      await modifierProfilRole(token, { region, district, commune, specialite, zone_couverture: zoneCouverture });
      setSucces('Informations mises a jour');
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors de la mise a jour');
    } finally {
      setEnvoiRole(false);
    }
  }

  async function handleChoisirDiplome() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErreur("Autorise l'acces a la galerie pour envoyer ton diplome.");
      return;
    }
    const resultat = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (resultat.canceled || !resultat.assets?.[0]) return;
    const asset = resultat.assets[0];
    const nomFichier = asset.uri.split('/').pop() || `diplome-${Date.now()}.jpg`;
    setEnvoiDiplome(true);
    try {
      await uploaderDiplome(token, { uri: asset.uri, name: nomFichier, type: asset.mimeType || 'image/jpeg' });
      setSucces('Diplome envoye, en attente de validation');
    } catch (e: any) {
      setErreur(e.message || "Erreur lors de l'envoi du diplome");
    } finally {
      setEnvoiDiplome(false);
    }
  }

  async function handleToggleDeuxFacteurs(valeur: boolean) {
    setDeuxFacteursEnvoi(true);
    try {
      await toggleDeuxFacteursRequest(token, valeur);
      setDeuxFacteurs(valeur);
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors de la modification du 2FA');
    } finally {
      setDeuxFacteursEnvoi(false);
    }
  }

  const styles = getStyles(colors);

  async function handleEnregistrer() {
    setErreur('');
    setSucces('');
    if (!nom.trim() || !email.trim()) {
      setErreur('Le nom et l\'email sont obligatoires');
      return;
    }
    setEnvoi(true);
    try {
      await modifierProfil(token, { nom: nom.trim(), email: email.trim() });
      await mettreAJourUtilisateur({ nom: nom.trim(), email: email.trim() });
      setSucces('Profil mis a jour avec succes');
      setModifMode(false);
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors de la mise a jour');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titreBloc}>
          <Text style={styles.titre}>Mon profil</Text>
          <Text style={styles.sousTitre}>Gérez vos informations personnelles</Text>
        </View>

        <LinearGradient
          colors={[colors.primary600, colors.primary700]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>
              {(utilisateur?.nom || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.nomAffiche}>{utilisateur?.nom}</Text>
          <Text style={styles.emailAffiche}>{utilisateur?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeTxt}>
              {roleLabels[utilisateur?.role || ''] || utilisateur?.role}
            </Text>
          </View>
          {utilisateur?.id ? (
            <Text style={styles.carteNo}>N° MG-AS-{String(utilisateur.id).padStart(5, '0')}</Text>
          ) : null}
        </LinearGradient>

        <ThemedCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitre}>Informations personnelles</Text>
            {!modifMode && (
              <TouchableOpacity onPress={() => setModifMode(true)}>
                <Ionicons name="pencil" size={18} color={colors.mint400} />
              </TouchableOpacity>
            )}
          </View>

          {succes ? <Text style={styles.succes}>{succes}</Text> : null}
          {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

          <Text style={styles.label}>Nom complet</Text>
          {modifMode ? (
            <TextInput
              style={styles.input}
              value={nom}
              onChangeText={setNom}
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={styles.valeur}>{utilisateur?.nom}</Text>
          )}

          <Text style={styles.label}>Email</Text>
          {modifMode ? (
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={styles.valeur}>{utilisateur?.email}</Text>
          )}

          {modifMode && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.annulerBtn}
                onPress={() => {
                  setModifMode(false);
                  setNom(utilisateur?.nom || '');
                  setEmail(utilisateur?.email || '');
                  setErreur('');
                }}>
                <Text style={styles.annulerBtnTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.enregistrerBtn, envoi && { opacity: 0.6 }]}
                onPress={handleEnregistrer}
                disabled={envoi}>
                {envoi ? (
                  <ActivityIndicator color={colors.forest950} size="small" />
                ) : (
                  <Text style={styles.enregistrerBtnTxt}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ThemedCard>

        {utilisateur?.role === 'agriculteur' && (
          <ThemedCard style={styles.card}>
            <Text style={styles.cardTitre}>Localisation de l'exploitation</Text>
            <Text style={styles.label}>Region</Text>
            <TextInput style={styles.input} value={region} onChangeText={setRegion} placeholder="Ex: Analamanga" placeholderTextColor={colors.textMuted} />
            <Text style={styles.label}>District</Text>
            <TextInput style={styles.input} value={district} onChangeText={setDistrict} placeholderTextColor={colors.textMuted} />
            <Text style={styles.label}>Commune</Text>
            <TextInput style={styles.input} value={commune} onChangeText={setCommune} placeholderTextColor={colors.textMuted} />
            <TouchableOpacity
              style={[styles.enregistrerBtn, { marginTop: Spacing.md }, envoiRole && { opacity: 0.6 }]}
              onPress={handleEnregistrerRole}
              disabled={envoiRole}>
              {envoiRole ? (
                <ActivityIndicator color={colors.forest950} size="small" />
              ) : (
                <Text style={styles.enregistrerBtnTxt}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </ThemedCard>
        )}

        {utilisateur?.role === 'expert' && (
          <ThemedCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitre}>Informations professionnelles</Text>
              {profilRole?.expert_statut && (
                <View style={[styles.roleBadge, { backgroundColor: profilRole.expert_statut === 'valide' ? colors.mint400 : profilRole.expert_statut === 'rejete' ? colors.danger : colors.forest700 }]}>
                  <Text style={[styles.roleBadgeTxt, { color: profilRole.expert_statut === 'valide' ? colors.forest950 : profilRole.expert_statut === 'rejete' ? colors.white : colors.mint400 }]}>
                    {profilRole.expert_statut === 'valide' ? 'Valide' : profilRole.expert_statut === 'rejete' ? 'Rejete' : 'En attente'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.label}>Specialite</Text>
            <TextInput style={styles.input} value={specialite} onChangeText={setSpecialite} placeholder="Ex: Riziculture" placeholderTextColor={colors.textMuted} />
            <Text style={styles.label}>Zone de couverture</Text>
            <TextInput style={styles.input} value={zoneCouverture} onChangeText={setZoneCouverture} placeholder="Ex: Analamanga" placeholderTextColor={colors.textMuted} />
            <TouchableOpacity
              style={[styles.enregistrerBtn, { marginTop: Spacing.md }, envoiRole && { opacity: 0.6 }]}
              onPress={handleEnregistrerRole}
              disabled={envoiRole}>
              {envoiRole ? (
                <ActivityIndicator color={colors.forest950} size="small" />
              ) : (
                <Text style={styles.enregistrerBtnTxt}>Enregistrer</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.prefRow} onPress={handleChoisirDiplome} disabled={envoiDiplome}>
              <View style={styles.prefLeft}>
                {envoiDiplome ? (
                  <ActivityIndicator color={colors.mint400} size="small" />
                ) : (
                  <Ionicons name="document-attach-outline" size={20} color={colors.mint400} />
                )}
                <Text style={styles.prefLabel}>Envoyer mon diplome</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </ThemedCard>
        )}

        <ThemedCard style={styles.card}>
          <Text style={styles.cardTitre}>Preferences</Text>
          <TouchableOpacity style={styles.prefRow} onPress={toggleTheme}>
            <View style={styles.prefLeft}>
              <Ionicons
                name={mode === 'dark' ? 'moon' : 'sunny'}
                size={20}
                color={colors.mint400}
              />
              <Text style={styles.prefLabel}>Theme {mode === 'dark' ? 'sombre' : 'clair'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <Ionicons name="shield-checkmark" size={20} color={colors.mint400} />
              <Text style={styles.prefLabel}>Authentification a deux facteurs</Text>
            </View>
            {deuxFacteursEnvoi ? (
              <ActivityIndicator color={colors.mint400} size="small" />
            ) : (
              <Switch
                value={deuxFacteurs}
                onValueChange={handleToggleDeuxFacteurs}
                trackColor={{ false: colors.forest700, true: colors.mint400 }}
                thumbColor={colors.white}
              />
            )}
          </View>
        </ThemedCard>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutBtnTxt}>Se deconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.forest950 },
    content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
    titreBloc: { marginBottom: Spacing.lg },
    titre: { fontSize: 20, fontWeight: 'bold', color: colors.white },
    sousTitre: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
    avatarSection: { alignItems: 'center', marginBottom: Spacing.lg, borderRadius: Radius.xl, paddingVertical: Spacing.xl },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: Radius.full,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    avatarTxt: { color: colors.white, fontWeight: 'bold', fontSize: 28 },
    nomAffiche: { fontSize: 17, fontWeight: '700', color: colors.white },
    emailAffiche: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    roleBadge: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: Radius.full,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginTop: 10,
    },
    roleBadgeTxt: { color: colors.white, fontSize: 12, fontWeight: '600' },
    carteNo: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.55)',
      marginTop: 10,
      letterSpacing: 1,
      fontFamily: 'monospace',
    },
    card: { marginBottom: Spacing.md },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitre: { fontSize: 14, fontWeight: '700', color: colors.white },
    succes: { color: colors.mint400, fontSize: 12, marginTop: Spacing.sm },
    erreur: { color: colors.danger, fontSize: 12, marginTop: Spacing.sm },
    label: { fontSize: 11, color: colors.textMuted, marginTop: Spacing.md, marginBottom: 4 },
    valeur: { fontSize: 14, color: colors.white, fontWeight: '500' },
    input: {
      backgroundColor: colors.forest800,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: colors.white,
      fontSize: 14,
    },
    actionsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
    annulerBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.forest700,
      borderRadius: Radius.full,
      paddingVertical: 10,
      alignItems: 'center',
    },
    annulerBtnTxt: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
    enregistrerBtn: {
      flex: 1,
      backgroundColor: colors.mint400,
      borderRadius: Radius.full,
      paddingVertical: 10,
      alignItems: 'center',
    },
    enregistrerBtnTxt: { color: colors.forest950, fontWeight: '700', fontSize: 13 },
    prefRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    prefLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    prefLabel: { fontSize: 14, color: colors.white },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: Radius.full,
      paddingVertical: 12,
      marginTop: Spacing.md,
    },
    logoutBtnTxt: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  });
}