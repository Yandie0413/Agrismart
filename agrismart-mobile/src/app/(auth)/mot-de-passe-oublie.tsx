import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, hexToRgba } from '@/constants/appTheme';
import { demanderResetRequest, reinitialiserMotDePasseRequest } from '@/services/authService';
import GlassCard from '@/components/ui/GlassCard';
import { BoutonPrincipal, ChampIcone } from '@/components/ui/auth-fields';

type Etape = 'email' | 'token';

export default function MotDePasseOublieScreen() {
  const { colors } = useTheme();
  const [etape, setEtape] = useState<Etape>('email');

  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');

  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  function resetMessages() {
    setErreur('');
    setSucces('');
  }

  async function handleDemanderReset() {
    resetMessages();
    if (!email.trim()) {
      setErreur("Indique l'email de ton compte");
      return;
    }
    setLoading(true);
    try {
      await demanderResetRequest(email.trim());
      setSucces('Email envoye. Ouvre-le et copie le code apres "?token=" dans le lien.');
      setEtape('token');
    } catch (e: any) {
      setErreur(e.message || "Erreur lors de l'envoi de l'email");
    } finally {
      setLoading(false);
    }
  }

  async function handleReinitialiser() {
    resetMessages();
    if (!resetToken.trim() || !nouveauMotDePasse) {
      setErreur('Le code et le nouveau mot de passe sont obligatoires');
      return;
    }
    setLoading(true);
    try {
      await reinitialiserMotDePasseRequest(resetToken.trim(), nouveauMotDePasse);
      router.back();
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors de la reinitialisation');
    } finally {
      setLoading(false);
    }
  }

  const styles = getStyles(colors);

  return (
    <LinearGradient
      colors={[colors.forest950, colors.forest800, colors.mint500]}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.retour} onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>

          <GlassCard style={styles.carte}>
            <Text style={styles.titre}>
              {etape === 'email' ? 'Mot de passe oublié' : 'Nouveau mot de passe'}
            </Text>
            <Text style={[styles.sousTitre, { color: colors.textMuted }]}>
              {etape === 'email'
                ? 'Indique ton email, un lien te sera envoyé.'
                : 'Colle le code reçu par email et choisis un nouveau mot de passe.'}
            </Text>

            {succes ? <Text style={[styles.succes, { color: colors.mint300 }]}>{succes}</Text> : null}
            {erreur ? <Text style={[styles.erreur, { color: colors.danger }]}>{erreur}</Text> : null}

            {etape === 'email' && (
              <>
                <ChampIcone
                  icone="mail-outline"
                  colors={colors}
                  placeholder="Email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                <BoutonPrincipal onPress={handleDemanderReset} disabled={loading} colors={colors}>
                  {loading ? (
                    <ActivityIndicator color={colors.forest950} />
                  ) : (
                    <Text style={[styles.boutonTexte, { color: colors.forest950 }]}>Envoyer le lien</Text>
                  )}
                </BoutonPrincipal>
              </>
            )}

            {etape === 'token' && (
              <>
                <ChampIcone
                  icone="key-outline"
                  colors={colors}
                  placeholder="Code de réinitialisation"
                  autoCapitalize="none"
                  value={resetToken}
                  onChangeText={setResetToken}
                />
                <ChampIcone
                  icone="lock-closed-outline"
                  colors={colors}
                  secureToggle
                  placeholder="Nouveau mot de passe"
                  value={nouveauMotDePasse}
                  onChangeText={setNouveauMotDePasse}
                />
                <BoutonPrincipal onPress={handleReinitialiser} disabled={loading} colors={colors}>
                  {loading ? (
                    <ActivityIndicator color={colors.forest950} />
                  ) : (
                    <Text style={[styles.boutonTexte, { color: colors.forest950 }]}>Réinitialiser</Text>
                  )}
                </BoutonPrincipal>
              </>
            )}

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.lienSecondaire, { color: colors.mint300 }]}>Retour à la connexion</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    safe: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.lg },
    retour: {
      position: 'absolute',
      top: Spacing.lg,
      left: Spacing.xl,
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexToRgba('#FFFFFF', 0.08),
    },
    carte: {},
    titre: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
    sousTitre: { fontSize: 13.5, lineHeight: 19, marginBottom: Spacing.md },
    boutonTexte: { fontSize: 15.5, fontWeight: '700' },
    lienSecondaire: { fontSize: 12.5, fontWeight: '600', textAlign: 'center', marginTop: Spacing.md },
    erreur: { textAlign: 'center', marginBottom: Spacing.sm, fontSize: 13 },
    succes: { textAlign: 'center', marginBottom: Spacing.sm, fontSize: 13 },
  });
}
