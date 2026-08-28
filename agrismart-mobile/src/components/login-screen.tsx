import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Radius, Spacing, hexToRgba } from '@/constants/appTheme';
import GlassCard from '@/components/ui/GlassCard';
import { BoutonPrincipal, ChampIcone } from '@/components/ui/auth-fields';

type Step = 'login' | 'otp' | 'register';
type Colors = ReturnType<typeof useTheme>['colors'];

const ROLES: { value: 'agriculteur' | 'expert'; label: string }[] = [
  { value: 'agriculteur', label: 'Agriculteur' },
  { value: 'expert', label: 'Expert agricole' },
];

function Diviseur({ colors }: { colors: Colors }) {
  return (
    <View style={styles.diviseurRow}>
      <View style={[styles.diviseurLigne, { backgroundColor: hexToRgba('#FFFFFF', 0.14) }]} />
      <Text style={[styles.diviseurTexte, { color: colors.textMuted }]}>ou</Text>
      <View style={[styles.diviseurLigne, { backgroundColor: hexToRgba('#FFFFFF', 0.14) }]} />
    </View>
  );
}

export default function LoginScreen({ onDecouvrir }: { onDecouvrir?: () => void }) {
  const { login, verifierOtp, register } = useAuth();
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('login');

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [code, setCode] = useState('');
  const [seSouvenir, setSeSouvenir] = useState(true);

  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [motDePasseConfirm, setMotDePasseConfirm] = useState('');
  const [role, setRole] = useState<'agriculteur' | 'expert'>('agriculteur');

  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  function resetMessages() {
    setErreur('');
    setSucces('');
  }

  async function handleLogin() {
    resetMessages();
    setLoading(true);
    try {
      const result = await login(email, motDePasse, seSouvenir);
      if (result.deuxFacteurs) setStep('otp');
    } catch (e: any) {
      setErreur(e.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtp() {
    resetMessages();
    setLoading(true);
    try {
      await verifierOtp(email, code, seSouvenir);
    } catch (e: any) {
      setErreur(e.message || 'Code invalide');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    resetMessages();
    if (!nom.trim() || !email.trim() || !motDePasse) {
      setErreur('Tous les champs sont obligatoires');
      return;
    }
    if (motDePasse !== motDePasseConfirm) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }
    if (telephone.trim() && !/^(\+261|0)3[2348]\d{7}$/.test(telephone.trim().replace(/\s/g, ''))) {
      setErreur('Numero de telephone invalide (format : +261 34 XX XXX XX ou 034 XX XXX XX)');
      return;
    }
    setLoading(true);
    try {
      await register(nom.trim(), email.trim(), motDePasse, role, telephone.trim() || undefined);
      setSucces('Compte cree avec succes, connecte-toi.');
      setMotDePasse('');
      setMotDePasseConfirm('');
      setStep('login');
    } catch (e: any) {
      setErreur(e.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  }

  function allerA(nouveauStep: Step) {
    resetMessages();
    setStep(nouveauStep);
  }

  function handleGoogle() {
    Alert.alert(
      'Bientot disponible',
      "La connexion Google necessite la configuration d'un projet OAuth (Google Cloud Console). Utilise ton email en attendant."
    );
  }

  return (
    <LinearGradient
      colors={[colors.forest950, colors.forest800, colors.mint500]}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}>
      <View pointerEvents="none" style={styles.decor}>
        <View style={[styles.blob, styles.blobUn, { backgroundColor: hexToRgba(colors.mint300, 0.14) }]} />
        <View style={[styles.blob, styles.blobDeux, { backgroundColor: hexToRgba(colors.mint400, 0.1) }]} />
      </View>

      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(500)} style={styles.brand}>
            <Image source={require('@/assets/images/logo-glow.png')} style={styles.logoGlow} />
            <Text style={styles.brandTexte}>AgriSmart</Text>
            <Text style={[styles.brandTagline, { color: colors.textMuted }]}>
              Cultive. Connecte. Prospère.
            </Text>
          </Animated.View>

          <GlassCard style={styles.carte}>
            <Text style={styles.titre}>
              {step === 'login' && 'Bon retour !'}
              {step === 'otp' && 'Vérification'}
              {step === 'register' && 'Créer un compte'}
            </Text>
            <Text style={[styles.sousTitre, { color: colors.textMuted }]}>
              {step === 'login' && 'Connecte-toi pour continuer ton suivi agricole.'}
              {step === 'otp' && `Code envoyé à ${email}`}
              {step === 'register' && 'Quelques infos pour démarrer.'}
            </Text>

            {succes ? <Text style={[styles.succes, { color: colors.mint300 }]}>{succes}</Text> : null}
            {erreur ? <Text style={[styles.erreur, { color: colors.danger }]}>{erreur}</Text> : null}

            {step === 'login' && (
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
                <ChampIcone
                  icone="lock-closed-outline"
                  colors={colors}
                  secureToggle
                  placeholder="Mot de passe"
                  value={motDePasse}
                  onChangeText={setMotDePasse}
                />

                <View style={styles.optionsRow}>
                  <TouchableOpacity style={styles.souvenirRow} onPress={() => setSeSouvenir((v) => !v)}>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: seSouvenir ? colors.mint400 : 'transparent',
                          borderColor: seSouvenir ? colors.mint400 : hexToRgba('#FFFFFF', 0.3),
                        },
                      ]}>
                      {seSouvenir && <Ionicons name="checkmark" size={13} color={colors.forest950} />}
                    </View>
                    <Text style={[styles.souvenirTexte, { color: colors.textMuted }]}>Se souvenir de moi</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/mot-de-passe-oublie' as any)}>
                    <Text style={[styles.lienSecondaire, { color: colors.mint300 }]}>Mot de passe oublié ?</Text>
                  </TouchableOpacity>
                </View>

                <BoutonPrincipal onPress={handleLogin} disabled={loading} colors={colors}>
                  {loading ? (
                    <ActivityIndicator color={colors.forest950} />
                  ) : (
                    <>
                      <Text style={[styles.boutonTexte, { color: colors.forest950 }]}>Se connecter</Text>
                      <Ionicons name="leaf" size={17} color={colors.forest950} />
                    </>
                  )}
                </BoutonPrincipal>

                <Diviseur colors={colors} />

                <TouchableOpacity
                  style={[
                    styles.boutonGoogle,
                    { borderColor: hexToRgba('#FFFFFF', 0.16), backgroundColor: hexToRgba('#FFFFFF', 0.05) },
                  ]}
                  activeOpacity={0.85}
                  onPress={handleGoogle}>
                  <Ionicons name="logo-google" size={18} color={colors.white} />
                  <Text style={[styles.boutonGoogleTexte, { color: colors.white }]}>Continuer avec Google</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => allerA('register')}>
                  <Text style={[styles.lienSecondaire, styles.lienCentre, { color: colors.mint300 }]}>
                    Pas de compte ? Créer un compte
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'otp' && (
              <>
                <ChampIcone
                  icone="keypad-outline"
                  colors={colors}
                  placeholder="Code à 6 chiffres"
                  keyboardType="number-pad"
                  value={code}
                  onChangeText={setCode}
                />
                <BoutonPrincipal onPress={handleOtp} disabled={loading} colors={colors}>
                  {loading ? (
                    <ActivityIndicator color={colors.forest950} />
                  ) : (
                    <Text style={[styles.boutonTexte, { color: colors.forest950 }]}>Valider</Text>
                  )}
                </BoutonPrincipal>
              </>
            )}

            {step === 'register' && (
              <>
                <ChampIcone
                  icone="person-outline"
                  colors={colors}
                  placeholder="Nom complet"
                  value={nom}
                  onChangeText={setNom}
                />
                <ChampIcone
                  icone="mail-outline"
                  colors={colors}
                  placeholder="Email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                <ChampIcone
                  icone="call-outline"
                  colors={colors}
                  placeholder="Telephone (optionnel, +261 34 XX XXX XX)"
                  autoCapitalize="none"
                  keyboardType="phone-pad"
                  value={telephone}
                  onChangeText={setTelephone}
                />
                <ChampIcone
                  icone="lock-closed-outline"
                  colors={colors}
                  secureToggle
                  placeholder="Mot de passe"
                  value={motDePasse}
                  onChangeText={setMotDePasse}
                />
                <ChampIcone
                  icone="lock-closed-outline"
                  colors={colors}
                  secureToggle
                  placeholder="Confirmer le mot de passe"
                  value={motDePasseConfirm}
                  onChangeText={setMotDePasseConfirm}
                />
                <View style={styles.roleRow}>
                  {ROLES.map((r) => (
                    <TouchableOpacity
                      key={r.value}
                      style={[
                        styles.roleChip,
                        {
                          borderColor: role === r.value ? colors.mint400 : hexToRgba('#FFFFFF', 0.16),
                          backgroundColor: role === r.value ? colors.mint400 : 'transparent',
                        },
                      ]}
                      onPress={() => setRole(r.value)}>
                      <Text
                        style={[
                          styles.roleChipTexte,
                          { color: role === r.value ? colors.forest950 : colors.textMuted },
                        ]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <BoutonPrincipal onPress={handleRegister} disabled={loading} colors={colors}>
                  {loading ? (
                    <ActivityIndicator color={colors.forest950} />
                  ) : (
                    <Text style={[styles.boutonTexte, { color: colors.forest950 }]}>Créer mon compte</Text>
                  )}
                </BoutonPrincipal>
                <TouchableOpacity onPress={() => allerA('login')}>
                  <Text style={[styles.lienSecondaire, styles.lienCentre, { color: colors.mint300 }]}>
                    Déjà un compte ? Se connecter
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'login' && onDecouvrir && (
              <TouchableOpacity onPress={onDecouvrir}>
                <Text style={[styles.lienSecondaire, styles.lienCentre, { color: colors.textMuted }]}>
                  Revoir la présentation
                </Text>
              </TouchableOpacity>
            )}
          </GlassCard>

          <View
            style={[
              styles.securite,
              { backgroundColor: hexToRgba('#FFFFFF', 0.05), borderColor: hexToRgba('#FFFFFF', 0.1) },
            ]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.mint300} />
            <Text style={[styles.securiteTexte, { color: colors.textMuted }]}>
              Tes données sont protégées par un chiffrement de bout en bout.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  decor: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999 },
  blobUn: { width: 300, height: 300, top: -90, right: -110 },
  blobDeux: { width: 240, height: 240, bottom: -40, left: -100 },
  safe: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.lg, paddingVertical: Spacing.xl },
  brand: { alignItems: 'center', gap: 2 },
  logoGlow: { width: 44, height: 44, resizeMode: 'contain', marginBottom: Spacing.xs },
  brandTexte: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  brandTagline: { fontSize: 12, fontWeight: '500' },
  carte: {},
  titre: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  sousTitre: { fontSize: 13.5, lineHeight: 19, marginBottom: Spacing.md },
  optionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  souvenirRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  souvenirTexte: { fontSize: 12.5, fontWeight: '500' },
  boutonTexte: { fontSize: 15.5, fontWeight: '700' },
  diviseurRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.md },
  diviseurLigne: { flex: 1, height: 1 },
  diviseurTexte: { fontSize: 12, fontWeight: '600' },
  boutonGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginBottom: Spacing.md,
  },
  boutonGoogleTexte: { fontSize: 14.5, fontWeight: '600' },
  roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  roleChip: { flex: 1, borderWidth: 1, borderRadius: Radius.full, paddingVertical: 10, alignItems: 'center' },
  roleChipTexte: { fontSize: 13, fontWeight: '600' },
  lienSecondaire: { fontSize: 12.5, fontWeight: '600' },
  lienCentre: { textAlign: 'center', marginTop: Spacing.sm },
  erreur: { textAlign: 'center', marginBottom: Spacing.sm, fontSize: 13 },
  succes: { textAlign: 'center', marginBottom: Spacing.sm, fontSize: 13 },
  securite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  securiteTexte: { flex: 1, fontSize: 12, lineHeight: 17 },
});
