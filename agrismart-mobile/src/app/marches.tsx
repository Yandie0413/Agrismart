import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Radius, Spacing, hexToRgba } from '@/constants/appTheme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import {
  creerOffreVente,
  getHistoriquePrix,
  getOffresVente,
  getProduits,
  HistoriquePrixItem,
  modifierStatutOffre,
  OffreVente,
  Periode,
  publierMarche,
  Produit,
  signalerPrix,
} from '@/services/marcheService';
import { produitVisuel } from '@/utils/produitVisuel';

const MARCHES_REFERENCE = ['Anosibe', 'Antsirabe', 'Ambatondrazaka', 'Toamasina', 'Autre'];
const PERIODES: { valeur: Periode; label: string }[] = [
  { valeur: '30j', label: '30 jours' },
  { valeur: '6mois', label: '6 mois' },
  { valeur: '1an', label: '1 an' },
];
const UNITES_OFFRE: ('kg' | 'tonnes')[] = ['kg', 'tonnes'];
const LARGEUR_ECRAN = Dimensions.get('window').width - Spacing.lg * 2 - Spacing.lg * 2;

function prixMoyen(produit: Produit) {
  if (!produit.marches || produit.marches.length === 0) return null;
  const total = produit.marches.reduce((acc, m) => acc + Number(m.prix), 0);
  return Math.round((total / produit.marches.length) * 100) / 100;
}

export default function MarchesScreen() {
  const { token, utilisateur } = useAuth();
  const { colors } = useTheme();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [selection, setSelection] = useState<Produit | null>(null);

  const [nomMarche, setNomMarche] = useState('');
  const [nomMarcheLibre, setNomMarcheLibre] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [prix, setPrix] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  const [signalementCible, setSignalementCible] = useState<number | null>(null);
  const [raisonSignalement, setRaisonSignalement] = useState('');
  const [envoiSignalement, setEnvoiSignalement] = useState(false);
  const [messageSignalement, setMessageSignalement] = useState('');

  const [filtreMarche, setFiltreMarche] = useState('');

  const [historique, setHistorique] = useState<HistoriquePrixItem[]>([]);
  const [periodeHistorique, setPeriodeHistorique] = useState<Periode>('30j');
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  const [vue, setVue] = useState<'catalogue' | 'offres'>('catalogue');
  const [offres, setOffres] = useState<OffreVente[]>([]);
  const [loadingOffres, setLoadingOffres] = useState(false);
  const [modalOffreVisible, setModalOffreVisible] = useState(false);
  const [formOffre, setFormOffre] = useState({
    produit_nom: '', quantite: '', unite: 'kg' as 'kg' | 'tonnes', prix_souhaite: '', date_disponibilite: '', telephone_contact: '',
  });
  const [envoiOffre, setEnvoiOffre] = useState(false);
  const [erreurOffre, setErreurOffre] = useState('');

  const charger = useCallback(async () => {
    try {
      const liste = await getProduits(token);
      setProduits(liste);
    } catch (e) {
      console.log('Erreur chargement produits', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  function onRefresh() {
    setRefreshing(true);
    charger();
  }

  function ouvrirProduit(produit: Produit) {
    setSelection(produit);
    setNomMarche('');
    setNomMarcheLibre('');
    setLocalisation('');
    setPrix('');
    setErreur('');
    setSignalementCible(null);
    setRaisonSignalement('');
    setMessageSignalement('');
    setPeriodeHistorique('30j');
    chargerHistorique(produit.produit_id, '30j');
  }

  async function chargerHistorique(produitId: number, periode: Periode) {
    setLoadingHistorique(true);
    try {
      const liste = await getHistoriquePrix(token, produitId, periode);
      setHistorique(liste);
    } catch (e) {
      console.log('Erreur chargement historique prix', e);
      setHistorique([]);
    } finally {
      setLoadingHistorique(false);
    }
  }

  function handleChangerPeriode(periode: Periode) {
    setPeriodeHistorique(periode);
    if (selection) chargerHistorique(selection.produit_id, periode);
  }

  function toggleSignalement(marcheId: number) {
    setSignalementCible((prev) => (prev === marcheId ? null : marcheId));
    setRaisonSignalement('');
    setMessageSignalement('');
  }

  async function envoyerSignalement(marcheId: number) {
    if (!raisonSignalement.trim()) return;
    setEnvoiSignalement(true);
    try {
      await signalerPrix(token, marcheId, raisonSignalement.trim());
      setMessageSignalement('Prix signalé, un administrateur va l\'examiner');
      setRaisonSignalement('');
    } catch (e: any) {
      setMessageSignalement(e.message || 'Erreur lors du signalement');
    } finally {
      setEnvoiSignalement(false);
    }
  }

  async function soumettrePrix(produitId: number) {
    setErreur('');
    const nomFinal = nomMarche === 'Autre' ? nomMarcheLibre.trim() : nomMarche;
    if (!nomFinal || !localisation.trim() || !prix.trim() || isNaN(Number(prix))) {
      setErreur('Tous les champs sont obligatoires');
      return;
    }
    setEnvoi(true);
    try {
      const marchesMisAJour = await publierMarche(token, produitId, {
        nom: nomFinal,
        localisation: localisation.trim(),
        prix: Number(prix),
      });
      setNomMarche('');
      setNomMarcheLibre('');
      setLocalisation('');
      setPrix('');
      setSelection((prev) => (prev ? { ...prev, marches: marchesMisAJour } : prev));
      charger();
    } catch (e: any) {
      setErreur(e.message || 'Erreur lors de la publication');
    } finally {
      setEnvoi(false);
    }
  }

  async function fetchOffres() {
    setLoadingOffres(true);
    try {
      const liste = await getOffresVente(token);
      setOffres(liste);
    } catch (e) {
      console.log('Erreur chargement offres', e);
    } finally {
      setLoadingOffres(false);
    }
  }

  function handleChangerVue(nouvelleVue: 'catalogue' | 'offres') {
    setVue(nouvelleVue);
    if (nouvelleVue === 'offres' && offres.length === 0) fetchOffres();
  }

  function ouvrirModalOffre() {
    setFormOffre({ produit_nom: '', quantite: '', unite: 'kg', prix_souhaite: '', date_disponibilite: '', telephone_contact: '' });
    setErreurOffre('');
    setModalOffreVisible(true);
  }

  async function soumettreOffre() {
    setErreurOffre('');
    if (!formOffre.produit_nom.trim() || !formOffre.quantite.trim() || !formOffre.prix_souhaite.trim() || !formOffre.telephone_contact.trim()) {
      setErreurOffre('Produit, quantité, prix et téléphone sont obligatoires');
      return;
    }
    setEnvoiOffre(true);
    try {
      await creerOffreVente(token, {
        produit_nom: formOffre.produit_nom.trim(),
        quantite: Number(formOffre.quantite),
        unite: formOffre.unite,
        prix_souhaite: Number(formOffre.prix_souhaite),
        date_disponibilite: formOffre.date_disponibilite || undefined,
        telephone_contact: formOffre.telephone_contact.trim(),
      });
      setModalOffreVisible(false);
      fetchOffres();
    } catch (e: any) {
      setErreurOffre(e.message || 'Erreur lors de la publication');
    } finally {
      setEnvoiOffre(false);
    }
  }

  async function handleMarquerVendue(offreId: number) {
    try {
      await modifierStatutOffre(token, offreId, 'vendue');
      setOffres((prev) => prev.filter((o) => o.offre_id !== offreId));
    } catch (e) {
      console.log('Erreur mise a jour offre', e);
    }
  }

  const produitsFiltres = useMemo(
    () =>
      produits
        .filter((p) => p.produit_nom.toLowerCase().includes(recherche.toLowerCase()))
        .filter((p) => !filtreMarche || p.marches?.some((m) => m.marche_nom === filtreMarche)),
    [produits, recherche, filtreMarche]
  );

  const peutPublier = utilisateur?.role === 'agriculteur' || utilisateur?.role === 'administrateur';
  const styles = getStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader titre="Marché agricole" />
        <ActivityIndicator size="large" color={colors.mint400} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        titre="Marché agricole"
        sousTitre="Consultez et publiez les prix"
        droite={
          (utilisateur?.role === 'agriculteur' || utilisateur?.role === 'administrateur') ? (
            <TouchableOpacity style={styles.addBtn} onPress={ouvrirModalOffre}>
              <Ionicons name="add" size={18} color={colors.forest950} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segment, vue === 'catalogue' && styles.segmentActive]}
          onPress={() => handleChangerVue('catalogue')}>
          <Text style={[styles.segmentTexte, vue === 'catalogue' && styles.segmentTexteActive]}>Catalogue</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, vue === 'offres' && styles.segmentActive]}
          onPress={() => handleChangerVue('offres')}>
          <Text style={[styles.segmentTexte, vue === 'offres' && styles.segmentTexteActive]}>Offres directes</Text>
        </TouchableOpacity>
      </View>

      {vue === 'catalogue' && (
        <>
          <View style={styles.rechercheZone}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.rechercheInput}
              placeholder="Rechercher un produit..."
              placeholderTextColor={colors.textMuted}
              value={recherche}
              onChangeText={setRecherche}
            />
          </View>

          <View style={styles.chipsRow}>
            <TouchableOpacity
              style={[styles.chip, !filtreMarche && styles.chipActive]}
              onPress={() => setFiltreMarche('')}>
              <Text style={[styles.chipTexte, !filtreMarche && styles.chipTexteActive]}>Tous les marchés</Text>
            </TouchableOpacity>
            {MARCHES_REFERENCE.filter((m) => m !== 'Autre').map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, filtreMarche === m && styles.chipActive]}
                onPress={() => setFiltreMarche(m)}>
                <Text style={[styles.chipTexte, filtreMarche === m && styles.chipTexteActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {vue === 'offres' ? (
        loadingOffres ? (
          <ActivityIndicator size="large" color={colors.mint400} style={{ flex: 1 }} />
        ) : (
          <FlatList
            data={offres}
            keyExtractor={(item) => String(item.offre_id)}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={loadingOffres} onRefresh={fetchOffres} tintColor={colors.mint400} />}
            ListEmptyComponent={<Text style={styles.vide}>Aucune offre active pour le moment</Text>}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 50).duration(300)}>
                <View style={styles.offreCard}>
                  <View style={styles.offreHeader}>
                    <Text style={styles.offreNom}>{item.produit_nom}</Text>
                    <Text style={styles.offrePrix}>{item.prix_souhaite} Ar</Text>
                  </View>
                  <Text style={styles.offreDetail}>{item.quantite} {item.unite} · {item.vendeur_nom}</Text>
                  {item.date_disponibilite && (
                    <Text style={styles.offreDetail}>
                      Disponible à partir du {new Date(item.date_disponibilite).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                  <View style={styles.offreActions}>
                    <TouchableOpacity
                      style={styles.offreBtn}
                      onPress={() => Linking.openURL(`tel:${item.telephone_contact}`)}>
                      <Ionicons name="call" size={14} color={colors.forest950} />
                      <Text style={styles.offreBtnTexte}>Appeler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.offreBtn, styles.offreBtnSecondaire]}
                      onPress={() => Linking.openURL(`sms:${item.telephone_contact}`)}>
                      <Ionicons name="chatbubble" size={14} color={colors.mint400} />
                      <Text style={[styles.offreBtnTexte, { color: colors.mint400 }]}>SMS</Text>
                    </TouchableOpacity>
                    {item.utilisateur_id === utilisateur?.id && (
                      <TouchableOpacity style={styles.offreVendueBtn} onPress={() => handleMarquerVendue(item.offre_id)}>
                        <Ionicons name="checkmark" size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Animated.View>
            )}
          />
        )
      ) : (
      <FlatList
        data={produitsFiltres}
        keyExtractor={(item) => String(item.produit_id)}
        numColumns={2}
        columnWrapperStyle={styles.colonnes}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mint400} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.vide}>Aucun produit disponible</Text>}
        renderItem={({ item, index }) => {
          const moyenne = prixMoyen(item);
          const visuel = produitVisuel(item.produit_nom, colors);
          return (
            <Animated.View
              entering={FadeInDown.delay(Math.min(index, 8) * 50).duration(300)}
              style={styles.carteWrapper}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => ouvrirProduit(item)} style={styles.carte}>
                <LinearGradient
                  colors={[hexToRgba(visuel.couleur, 0.35), hexToRgba(visuel.couleur, 0.1)]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.visuel}>
                  <Ionicons name={visuel.icone} size={38} color={visuel.couleur} />
                  {item.marches.length === 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.forest700 }]}>
                      <Text style={styles.badgeTexte}>Nouveau</Text>
                    </View>
                  )}
                </LinearGradient>
                <View style={styles.infoZone}>
                  <Text style={styles.produitNom} numberOfLines={1}>
                    {item.produit_nom}
                  </Text>
                  <Text style={styles.produitDetail}>
                    {item.marches.length} marché{item.marches.length > 1 ? 's' : ''} recensé
                    {item.marches.length > 1 ? 's' : ''}
                  </Text>
                  <View style={styles.bas}>
                    <Text style={styles.prix}>{moyenne !== null ? `${moyenne} Ar` : '—'}</Text>
                    <View style={[styles.plusBtn, { backgroundColor: colors.mint400 }]}>
                      <Ionicons name="arrow-forward" size={14} color={colors.forest950} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
      />
      )}

      <Modal
        visible={!!selection}
        animationType="slide"
        transparent
        onRequestClose={() => setSelection(null)}>
        <View style={styles.modalFond}>
          <View style={styles.modalFeuille}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitre}>{selection?.produit_nom}</Text>
              <TouchableOpacity onPress={() => setSelection(null)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

            {historique.length > 1 && (
              <View style={styles.chartZone}>
                <View style={styles.chipsRow}>
                  {PERIODES.map((p) => (
                    <TouchableOpacity
                      key={p.valeur}
                      style={[styles.chip, periodeHistorique === p.valeur && styles.chipActive]}
                      onPress={() => handleChangerPeriode(p.valeur)}>
                      <Text style={[styles.chipTexte, periodeHistorique === p.valeur && styles.chipTexteActive]}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {loadingHistorique ? (
                  <ActivityIndicator color={colors.mint400} style={{ marginVertical: Spacing.md }} />
                ) : (
                  <LineChart
                    data={{
                      labels: historique.map((h) =>
                        new Date(h.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                      ),
                      datasets: [{ data: historique.map((h) => Number(h.prix_agricole)) }],
                    }}
                    width={LARGEUR_ECRAN}
                    height={160}
                    withDots
                    withInnerLines={false}
                    chartConfig={{
                      backgroundGradientFrom: colors.forest800,
                      backgroundGradientTo: colors.forest800,
                      decimalPlaces: 0,
                      color: () => colors.mint400,
                      labelColor: () => colors.textMuted,
                      propsForDots: { r: '3' },
                    }}
                    style={{ borderRadius: Radius.md }}
                    bezier
                  />
                )}
              </View>
            )}

            {selection && selection.marches.length === 0 ? (
              <Text style={styles.vide}>Aucun prix enregistré pour ce produit</Text>
            ) : (
              selection?.marches.map((m) => (
                <View key={m.marche_id}>
                  <View style={styles.marcheRow}>
                    <Text style={styles.marcheNom}>{m.marche_nom}</Text>
                    <Text style={styles.marcheLoc}>{m.marche_localisation}</Text>
                    <Text style={styles.marchePrix}>{m.prix} Ar</Text>
                    <TouchableOpacity onPress={() => toggleSignalement(m.marche_id)} hitSlop={8}>
                      <Ionicons name="flag" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  {signalementCible === m.marche_id && (
                    <View style={styles.signalementZone}>
                      {messageSignalement ? (
                        <Text style={styles.formMessage}>{messageSignalement}</Text>
                      ) : (
                        <>
                          <TextInput
                            style={styles.input}
                            placeholder="Pourquoi ce prix semble-t-il abusif ?"
                            placeholderTextColor={colors.textMuted}
                            value={raisonSignalement}
                            onChangeText={setRaisonSignalement}
                          />
                          <TouchableOpacity
                            style={[styles.submitBtnSecondaire, envoiSignalement && { opacity: 0.6 }]}
                            onPress={() => envoyerSignalement(m.marche_id)}
                            disabled={envoiSignalement || !raisonSignalement.trim()}>
                            {envoiSignalement ? (
                              <ActivityIndicator color={colors.forest950} size="small" />
                            ) : (
                              <Text style={styles.submitBtnTexte}>Signaler ce prix</Text>
                            )}
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}
                </View>
              ))
            )}

            {peutPublier && selection && (
              <View style={styles.formZone}>
                <Text style={styles.formTitre}>Publier mon prix</Text>
                <View style={styles.chipsRow}>
                  {MARCHES_REFERENCE.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.chip, nomMarche === m && styles.chipActive]}
                      onPress={() => setNomMarche(m)}>
                      <Text style={[styles.chipTexte, nomMarche === m && styles.chipTexteActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {nomMarche === 'Autre' && (
                  <TextInput
                    style={styles.input}
                    placeholder="Nom du marché"
                    placeholderTextColor={colors.textMuted}
                    value={nomMarcheLibre}
                    onChangeText={setNomMarcheLibre}
                  />
                )}
                <TextInput
                  style={styles.input}
                  placeholder="Localisation"
                  placeholderTextColor={colors.textMuted}
                  value={localisation}
                  onChangeText={setLocalisation}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Prix (Ar)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={prix}
                  onChangeText={setPrix}
                />
                {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}
                <TouchableOpacity
                  style={[styles.submitBtn, envoi && { opacity: 0.6 }]}
                  onPress={() => soumettrePrix(selection.produit_id)}
                  disabled={envoi}>
                  {envoi ? (
                    <ActivityIndicator color={colors.forest950} size="small" />
                  ) : (
                    <Text style={styles.submitBtnTexte}>Publier</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalOffreVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOffreVisible(false)}>
        <View style={styles.modalFond}>
          <View style={styles.modalFeuille}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitre}>Déclarer un stock</Text>
              <TouchableOpacity onPress={() => setModalOffreVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.white} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formZone}>
                <TextInput
                  style={styles.input}
                  placeholder="Produit (ex: Riz blanc)"
                  placeholderTextColor={colors.textMuted}
                  value={formOffre.produit_nom}
                  onChangeText={(v) => setFormOffre({ ...formOffre, produit_nom: v })}
                />
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Quantité"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={formOffre.quantite}
                    onChangeText={(v) => setFormOffre({ ...formOffre, quantite: v })}
                  />
                  <View style={styles.chipsRow}>
                    {UNITES_OFFRE.map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.chip, formOffre.unite === u && styles.chipActive]}
                        onPress={() => setFormOffre({ ...formOffre, unite: u })}>
                        <Text style={[styles.chipTexte, formOffre.unite === u && styles.chipTexteActive]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Prix souhaité (Ar)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={formOffre.prix_souhaite}
                  onChangeText={(v) => setFormOffre({ ...formOffre, prix_souhaite: v })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Disponible à partir du (AAAA-MM-JJ)"
                  placeholderTextColor={colors.textMuted}
                  value={formOffre.date_disponibilite}
                  onChangeText={(v) => setFormOffre({ ...formOffre, date_disponibilite: v })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Téléphone de contact"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={formOffre.telephone_contact}
                  onChangeText={(v) => setFormOffre({ ...formOffre, telephone_contact: v })}
                />
                {erreurOffre ? <Text style={styles.erreur}>{erreurOffre}</Text> : null}
                <TouchableOpacity
                  style={[styles.submitBtn, envoiOffre && { opacity: 0.6 }]}
                  onPress={soumettreOffre}
                  disabled={envoiOffre}>
                  {envoiOffre ? (
                    <ActivityIndicator color={colors.forest950} size="small" />
                  ) : (
                    <Text style={styles.submitBtnTexte}>Publier l&apos;offre</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.forest950 },
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
      marginTop: Spacing.md,
    },
    rechercheInput: { flex: 1, paddingVertical: 12, color: colors.white, fontSize: 14 },
    listContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },
    colonnes: { gap: Spacing.md },
    vide: { color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.xl },
    carteWrapper: { flex: 1 },
    carte: {
      backgroundColor: colors.forest900,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.forest700,
    },
    visuel: { height: 92, alignItems: 'center', justifyContent: 'center' },
    badge: {
      position: 'absolute',
      top: 8,
      left: 8,
      borderRadius: Radius.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeTexte: { fontSize: 9, fontWeight: '700', color: colors.white },
    infoZone: { padding: Spacing.sm, gap: 3 },
    produitNom: { fontSize: 13.5, fontWeight: '700', color: colors.white, textTransform: 'capitalize' },
    produitDetail: { fontSize: 10.5, color: colors.textMuted },
    bas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
    prix: { fontSize: 13, fontWeight: '700', color: colors.mint400 },
    plusBtn: { width: 24, height: 24, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
    modalFond: { flex: 1, backgroundColor: hexToRgba('#000000', 0.55), justifyContent: 'flex-end' },
    modalFeuille: {
      backgroundColor: colors.forest900,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.lg,
      gap: Spacing.sm,
      maxHeight: '80%',
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
    modalTitre: { fontSize: 18, fontWeight: '800', color: colors.white, textTransform: 'capitalize' },
    marcheRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.forest800,
      borderRadius: 10,
      padding: 10,
    },
    marcheNom: { fontSize: 12, fontWeight: '600', color: colors.white, flex: 1 },
    marcheLoc: { fontSize: 11, color: colors.textMuted, flex: 1 },
    marchePrix: { fontSize: 12, fontWeight: '700', color: colors.mint400, marginRight: Spacing.sm },
    signalementZone: {
      gap: 8,
      backgroundColor: colors.forest800,
      borderRadius: 10,
      padding: Spacing.sm,
      marginTop: 4,
    },
    formMessage: { fontSize: 12, color: colors.mint400 },
    submitBtnSecondaire: {
      backgroundColor: colors.danger,
      borderRadius: Radius.full,
      paddingVertical: 8,
      alignItems: 'center',
    },
    formZone: { marginTop: Spacing.sm, gap: 8 },
    formTitre: { fontSize: 13, fontWeight: '700', color: colors.white },
    input: {
      backgroundColor: colors.forest800,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.white,
      fontSize: 13,
    },
    erreur: { color: colors.danger, fontSize: 12 },
    submitBtn: {
      backgroundColor: colors.mint400,
      borderRadius: Radius.full,
      paddingVertical: 10,
      alignItems: 'center',
    },
    submitBtnTexte: { color: colors.forest950, fontWeight: '700', fontSize: 13 },
    addBtn: {
      width: 30,
      height: 30,
      borderRadius: Radius.full,
      backgroundColor: colors.mint400,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.md,
    },
    segment: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.forest700,
      borderRadius: Radius.full,
      paddingVertical: 8,
      alignItems: 'center',
    },
    segmentActive: { backgroundColor: colors.mint400, borderColor: colors.mint400 },
    segmentTexte: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
    segmentTexteActive: { color: colors.forest950 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      borderWidth: 1,
      borderColor: colors.forest700,
      borderRadius: Radius.full,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    chipActive: { backgroundColor: colors.mint400, borderColor: colors.mint400 },
    chipTexte: { fontSize: 11, color: colors.textMuted },
    chipTexteActive: { color: colors.forest950, fontWeight: '700' },
    chartZone: { marginBottom: Spacing.md, gap: Spacing.sm },
    offreCard: {
      backgroundColor: colors.forest900,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.forest700,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      gap: 4,
    },
    offreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    offreNom: { fontSize: 14, fontWeight: '700', color: colors.white, textTransform: 'capitalize', flex: 1 },
    offrePrix: { fontSize: 13, fontWeight: '700', color: colors.mint400 },
    offreDetail: { fontSize: 11.5, color: colors.textMuted },
    offreActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, alignItems: 'center' },
    offreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      flex: 1,
      backgroundColor: colors.mint400,
      borderRadius: Radius.full,
      paddingVertical: 8,
    },
    offreBtnSecondaire: { backgroundColor: colors.forest800 },
    offreBtnTexte: { color: colors.forest950, fontWeight: '700', fontSize: 12 },
    offreVendueBtn: {
      width: 32,
      height: 32,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: colors.forest700,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
