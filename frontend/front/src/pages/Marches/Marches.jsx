import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    getMarches, createProduit, getHistoriquePrix, ajouterMarche, signalerPrix,
    creerOffreVente, getOffresVente, modifierStatutOffre,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    FiPlus, FiTrendingUp, FiMapPin, FiX,
    FiPackage, FiTag, FiMessageCircle, FiShoppingBag, FiBox, FiFlag,
    FiPhone, FiCheck, FiFilter,
} from 'react-icons/fi';
import { GiWheat, GiCorn, GiPotato, GiTomato, GiCarrot, GiPeas, GiFruitBowl } from 'react-icons/gi';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import imgRiz from '../../assets/images/cultures/riz.jpg';
import imgMais from '../../assets/images/cultures/mais.jpg';
import imgManioc from '../../assets/images/cultures/manioc.jpg';
import imgCarotte from '../../assets/images/cultures/carotte.jpg';
import imgTomate from '../../assets/images/cultures/tomate.jfif';
import imgHaricot from '../../assets/images/cultures/haricot vert.jpg';
import imgPommeDeTerre from '../../assets/images/cultures/pomme de terre.jpg';

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};
const modalOverlay = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};
const modalPanel = {
    hidden: { opacity: 0, scale: 0.95, y: 12 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15 } },
};

const UNITES = ['kg', 'tonne', 'litre', 'sac', 'unité'];
const CATEGORIES_SUGGESTIONS = ['Céréale', 'Légume', 'Fruit', 'Tubercule', 'Épice', 'Élevage'];
const MARCHES_REFERENCE = ['Anosibe', 'Antsirabe', 'Ambatondrazaka', 'Toamasina', 'Autre'];
const PERIODES = [
    { valeur: '30j', labelKey: 'period30d' },
    { valeur: '6mois', labelKey: 'period6m' },
    { valeur: '1an', labelKey: 'period1y' },
];
const UNITES_OFFRE = ['kg', 'tonnes'];

// Tendance approximative : compare les 2 dernieres offres publiees (marche_id croissant = plus recent)
const tendanceDetail = (marches) => {
    if (!marches || marches.length < 2 || marches[0]?.marche_id === null) return null;
    const triees = [...marches].sort((a, b) => a.marche_id - b.marche_id);
    const derniere = parseFloat(triees[triees.length - 1].prix);
    const precedente = parseFloat(triees[triees.length - 2].prix);
    if (derniere === precedente || !precedente) return null;
    const pct = Math.round(((derniere - precedente) / precedente) * 100);
    return { direction: derniere > precedente ? 'hausse' : 'baisse', pct: Math.abs(pct) };
};
const tendance = (marches) => tendanceDetail(marches)?.direction || null;

const Marches = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalProduit, setModalProduit] = useState(false);
    const [modalMarche, setModalMarche] = useState(false);
    const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
    const [historique, setHistorique] = useState([]);
    const [produitSelectionne, setProduitSelectionne] = useState(null);
    const [produitForm, setProduitForm] = useState({ nom: '', description: '', unite: 'kg', categorie: '' });
    const [erreur, setErreur] = useState('');
    const [formMarche, setFormMarche] = useState({ produit_id: '', nom: '', nomLibre: '', localisation: '', prix: '', quantite: '' });
    const [filtreMarche, setFiltreMarche] = useState('');
    const [periodeHistorique, setPeriodeHistorique] = useState('30j');

    const [vue, setVue] = useState('catalogue'); // 'catalogue' | 'offres'
    const [offres, setOffres] = useState([]);
    const [loadingOffres, setLoadingOffres] = useState(false);
    const [modalOffre, setModalOffre] = useState(false);
    const [formOffre, setFormOffre] = useState({
        produit_nom: '', quantite: '', unite: 'kg', prix_souhaite: '', date_disponibilite: '', telephone_contact: '',
    });
    const [erreurOffre, setErreurOffre] = useState('');

    const { utilisateur } = useAuth();

    useEffect(() => {
        fetchProduits();
    }, []);

    const fetchProduits = async () => {
        try {
            const res = await getMarches();
            setProduits(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreerProduit = async (e) => {
        e.preventDefault();
        try {
            await createProduit(produitForm);
            fetchProduits();
            setModalProduit(false);
            setProduitForm({ nom: '', description: '', unite: 'kg', categorie: '' });
            setErreur('');
        } catch (err) {
            setErreur(err.response?.data?.message || t('markets.genericError'));
        }
    };

    const handlePublierMarche = async (e) => {
        e.preventDefault();
        try {
            const nomMarche = formMarche.nom === 'Autre' ? formMarche.nomLibre : formMarche.nom;
            await ajouterMarche(formMarche.produit_id, {
                nom: nomMarche,
                localisation: formMarche.localisation,
                prix: formMarche.prix,
                quantite: formMarche.quantite,
            });
            fetchProduits();
            setModalMarche(false);
            setFormMarche({ produit_id: '', nom: '', nomLibre: '', localisation: '', prix: '', quantite: '' });
            setErreur('');
        } catch (err) {
            setErreur(err.response?.data?.message || t('markets.genericError'));
        }
    };

    const handleVoirHistorique = async (produit) => {
        try {
            setPeriodeHistorique('30j');
            const res = await getHistoriquePrix(produit.produit_id, '30j');
            setHistorique(res.data.data);
            setProduitSelectionne(produit);
            setHistoriqueOuvert(true);
        } catch (err) {
            console.error(err);
        }
    };

    const handleChangerPeriode = async (periode) => {
        setPeriodeHistorique(periode);
        try {
            const res = await getHistoriquePrix(produitSelectionne.produit_id, periode);
            setHistorique(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleContacterVendeur = (vendeurId) => {
        navigate(`/messages?contact=${vendeurId}`);
    };

    const fetchOffres = async () => {
        setLoadingOffres(true);
        try {
            const res = await getOffresVente();
            setOffres(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingOffres(false);
        }
    };

    const handleChangerVue = (nouvelleVue) => {
        setVue(nouvelleVue);
        if (nouvelleVue === 'offres' && offres.length === 0) fetchOffres();
    };

    const handleCreerOffre = async (e) => {
        e.preventDefault();
        setErreurOffre('');
        try {
            await creerOffreVente(formOffre);
            setModalOffre(false);
            setFormOffre({ produit_nom: '', quantite: '', unite: 'kg', prix_souhaite: '', date_disponibilite: '', telephone_contact: '' });
            fetchOffres();
        } catch (err) {
            setErreurOffre(err.response?.data?.message || t('markets.genericError'));
        }
    };

    const handleMarquerVendue = async (offreId) => {
        try {
            await modifierStatutOffre(offreId, 'vendue');
            setOffres((prev) => prev.filter((o) => o.offre_id !== offreId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleSignalerPrix = async (marcheId) => {
        const raison = window.prompt(t('markets.reportPricePrompt'));
        if (!raison?.trim()) return;
        try {
            await signalerPrix(marcheId, raison.trim());
            window.alert(t('markets.reportPriceSuccess'));
        } catch (err) {
            window.alert(err.response?.data?.message || t('markets.reportPriceError'));
        }
    };

    const prixMoyen = (marches) => {
        if (!marches || marches.length === 0 || marches[0]?.marche_id === null) return null;
        const total = marches.reduce((acc, m) => acc + parseFloat(m.prix || 0), 0);
        return (total / marches.length).toFixed(2);
    };

    // Palette "epicerie" : chaque carte produit recoit un fond pastel individuel,
    // stable par produit (comme les cartes carotte/poivron/brocoli/radis de la maquette grocery),
    // mais entierement dans les nuances de vert de la palette AgriSmart (pas d'autres teintes)
    const CARTES_PASTEL = [
        { bg: 'bg-primary-100 dark:bg-primary-900/20', icon: 'text-primary-600 dark:text-mint-400' },
        { bg: 'bg-emerald-100 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400' },
        { bg: 'bg-lime-100 dark:bg-lime-900/20', icon: 'text-lime-700 dark:text-lime-400' },
        { bg: 'bg-teal-100 dark:bg-teal-900/20', icon: 'text-teal-600 dark:text-teal-400' },
        { bg: 'bg-green-100 dark:bg-green-900/20', icon: 'text-green-600 dark:text-green-400' },
        { bg: 'bg-mint-300/30 dark:bg-mint-400/10', icon: 'text-primary-700 dark:text-mint-300' },
    ];
    const carteStyle = (id) => CARTES_PASTEL[id % CARTES_PASTEL.length];

    // Icone par mot-cle du nom de produit, a defaut une icone panier generique
    const iconeProduit = (nom) => {
        const n = (nom || '').toLowerCase();
        if (n.includes('riz')) return GiWheat;
        if (n.includes('mais') || n.includes('maïs')) return GiCorn;
        if (n.includes('manioc') || n.includes('patate') || n.includes('pomme de terre')) return GiPotato;
        if (n.includes('tomate')) return GiTomato;
        if (n.includes('carotte')) return GiCarrot;
        if (n.includes('haricot')) return GiPeas;
        return GiFruitBowl;
    };

    // Vraie photo du produit quand on en a une, sinon on retombe sur l'icone ci-dessus
    const photoProduit = (nom) => {
        const n = (nom || '').toLowerCase();
        if (n.includes('riz')) return imgRiz;
        if (n.includes('mais') || n.includes('maïs')) return imgMais;
        if (n.includes('manioc')) return imgManioc;
        if (n.includes('carotte')) return imgCarotte;
        if (n.includes('tomate')) return imgTomate;
        if (n.includes('haricot')) return imgHaricot;
        if (n.includes('patate') || n.includes('pomme de terre')) return imgPommeDeTerre;
        return null;
    };

    const stats = useMemo(() => {
        const totalProduits = produits.length;
        const offresActives = produits.reduce((acc, p) => acc + (p.marches?.[0]?.marche_id ? p.marches.length : 0), 0);
        const enHausse = produits.filter((p) => tendance(p.marches) === 'hausse').length;
        return { totalProduits, offresActives, enHausse };
    }, [produits]);

    const produitsFiltres = useMemo(() => {
        if (!filtreMarche) return produits;
        return produits.filter((p) => p.marches?.some((m) => m.marche_nom === filtreMarche));
    }, [produits, filtreMarche]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div className="bg-gradient-to-br from-primary-50 via-mint-300/10 to-emerald-50 dark:from-forest-950 dark:via-neutral-900 dark:to-forest-900 rounded-[2rem] p-5 sm:p-8 space-y-8">

            {/* Hero chaleureux, facon "From farm to your kitchen" */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-emerald-600 dark:from-forest-800 dark:to-primary-900 px-6 sm:px-10 py-8 sm:py-10 text-white"
            >
                <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10"></div>
                <div className="absolute right-16 bottom-0 w-24 h-24 rounded-full bg-white/10"></div>
                <div className="relative flex items-center justify-between flex-wrap gap-6">
                    <div>
                        <p className="text-white/80 text-xs uppercase tracking-widest font-semibold mb-2">{t('markets.subtitle')}</p>
                        <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight max-w-md">{t('markets.title')}</h1>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {utilisateur?.role === 'agriculteur' && (
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setModalMarche(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-primary-50 text-primary-700 rounded-full font-semibold shadow-md transition-colors"
                            >
                                <FiPlus /> {t('markets.publishMyProduct')}
                            </motion.button>
                        )}
                        {(utilisateur?.role === 'agriculteur' || utilisateur?.role === 'administrateur') && (
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setModalOffre(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-white/15 hover:bg-white/25 text-white border border-white/40 rounded-full font-semibold transition-colors"
                            >
                                <FiBox /> {t('markets.declareStock')}
                            </motion.button>
                        )}
                        {utilisateur?.role === 'administrateur' && (
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setModalProduit(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-primary-50 text-primary-700 rounded-full font-semibold shadow-md transition-colors"
                            >
                                <FiPlus /> {t('markets.newProduct')}
                            </motion.button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Bandeau de stats, cartes blanches sur fond chaud */}
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <motion.div variants={fadeUp}>
                    <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                        <div className="w-11 h-11 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-mint-400 text-xl flex-shrink-0">
                            <FiShoppingBag />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalProduits}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('markets.statProducts')}</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                    <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                        <div className="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400 text-xl flex-shrink-0">
                            <FiBox />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.offresActives}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('markets.statOffers')}</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div variants={fadeUp} className="col-span-2 sm:col-span-1">
                    <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                        <div className="w-11 h-11 rounded-full bg-lime-100 dark:bg-lime-900/20 flex items-center justify-center text-lime-600 text-xl flex-shrink-0">
                            <FiTrendingUp />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.enHausse}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('markets.statRising')}</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Bascule Catalogue / Offres directes */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="inline-flex bg-white dark:bg-neutral-800 rounded-full p-1 shadow-sm">
                    <button
                        onClick={() => handleChangerVue('catalogue')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${vue === 'catalogue' ? 'bg-primary-600 dark:bg-mint-400 dark:text-forest-950 text-white' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        {t('markets.catalogView')}
                    </button>
                    <button
                        onClick={() => handleChangerVue('offres')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${vue === 'offres' ? 'bg-primary-600 dark:bg-mint-400 dark:text-forest-950 text-white' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        {t('markets.offersView')}
                    </button>
                </div>
                {vue === 'catalogue' && (
                    <div className="relative">
                        <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                        <select
                            value={filtreMarche}
                            onChange={(e) => setFiltreMarche(e.target.value)}
                            className="pl-9 pr-8 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm appearance-none"
                        >
                            <option value="">{t('markets.allMarkets')}</option>
                            {MARCHES_REFERENCE.filter((m) => m !== 'Autre').map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {vue === 'offres' ? (
                <div className="space-y-4">
                    {loadingOffres ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                        </div>
                    ) : offres.length === 0 ? (
                        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-12 text-center shadow-sm">
                            <FiBox className="text-5xl text-primary-200 dark:text-primary-800 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">{t('markets.noOffers')}</p>
                        </div>
                    ) : (
                        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {offres.map((offre) => (
                                <motion.div key={offre.offre_id} variants={fadeUp}>
                                    <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 shadow-sm space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-800 dark:text-white capitalize">{offre.produit_nom}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {offre.quantite} {offre.unite}
                                                </p>
                                            </div>
                                            <span className="text-sm font-bold text-primary-700 dark:text-mint-400 whitespace-nowrap">
                                                {offre.prix_souhaite} Ar
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                            <p className="flex items-center gap-1.5"><FiTag /> {offre.vendeur_nom}</p>
                                            {offre.date_disponibilite && (
                                                <p>{t('markets.availableFrom')} {new Date(offre.date_disponibilite).toLocaleDateString('fr-FR')}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <a
                                                href={`tel:${offre.telephone_contact}`}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors"
                                            >
                                                <FiPhone /> {t('markets.call')}
                                            </a>
                                            <a
                                                href={`sms:${offre.telephone_contact}`}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg transition-colors"
                                            >
                                                <FiMessageCircle /> {t('markets.sms')}
                                            </a>
                                            {offre.utilisateur_id === utilisateur?.id && (
                                                <button
                                                    onClick={() => handleMarquerVendue(offre.offre_id)}
                                                    title={t('markets.markSold')}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                >
                                                    <FiCheck />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            ) : produitsFiltres.length === 0 ? (
                <div className="bg-white dark:bg-neutral-800 rounded-3xl p-12 text-center shadow-sm">
                    <FiTrendingUp className="text-5xl text-primary-200 dark:text-primary-800 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t('markets.noProduct')}</p>
                    {utilisateur?.role === 'agriculteur' && (
                        <p className="text-sm text-gray-400 mt-2">{t('markets.publishFirstHint')}</p>
                    )}
                </div>
            ) : (
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {produitsFiltres.map((produit) => {
                        const moyen = prixMoyen(produit.marches);
                        const tend = tendanceDetail(produit.marches);
                        const style = carteStyle(produit.produit_id);
                        const Icone = iconeProduit(produit.produit_nom);
                        return (
                            <motion.div key={produit.produit_id} variants={fadeUp} whileHover={{ y: -4 }}>
                                <div
                                    onClick={() => handleVoirHistorique(produit)}
                                    className={`relative cursor-pointer rounded-3xl p-4 pt-9 ${style.bg} hover:shadow-lg transition-shadow duration-300`}
                                >
                                    {/* Badge tendance, facon badge "% off" en haut a gauche */}
                                    {tend && (
                                        <span
                                            title={tend.direction === 'hausse' ? t('markets.trendUp') : t('markets.trendDown')}
                                            className={`absolute top-3 left-3 flex items-center gap-0.5 text-[11px] font-bold px-2 py-1 rounded-full text-white shadow-sm ${
                                                tend.direction === 'hausse' ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                        >
                                            {tend.direction === 'hausse' ? '+' : '-'}{tend.pct}%
                                        </span>
                                    )}
                                    {produit.produit_categorie && (
                                        <span className="absolute top-3 right-3 text-[9px] uppercase tracking-wide px-2 py-1 bg-white/70 dark:bg-black/20 text-gray-600 dark:text-gray-300 rounded-full font-semibold">
                                            {produit.produit_categorie}
                                        </span>
                                    )}

                                    {/* Vignette ronde : vraie photo du produit si on en a une, sinon icone, comme la photo detouree de la maquette */}
                                    <div className="w-16 h-16 mx-auto rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center shadow-inner mb-3 overflow-hidden">
                                        {photoProduit(produit.produit_nom) ? (
                                            <img src={photoProduit(produit.produit_nom)} alt={produit.produit_nom} className="w-full h-full object-cover" />
                                        ) : (
                                            <Icone className={`text-3xl ${style.icon}`} />
                                        )}
                                    </div>

                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white text-center truncate">{produit.produit_nom}</h3>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center">
                                        {(produit.produit_unite || 'kg')}
                                        {produit.marches?.[0]?.marche_id ? ` • ${produit.marches.length} ${t('markets.marketsCount')}` : ''}
                                    </p>

                                    <div className="mt-3 flex items-center justify-between gap-2">
                                        {moyen ? (
                                            <span className="text-sm font-bold text-gray-800 dark:text-white">
                                                ~{moyen} Ar<span className="text-[10px] font-normal text-gray-500">/{produit.produit_unite || 'kg'}</span>
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-gray-400">{t('markets.noAssociatedMarket')}</span>
                                        )}
                                        <span className="w-7 h-7 flex-shrink-0 rounded-full bg-primary-600 dark:bg-mint-400 dark:text-forest-950 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                                            <FiPlus />
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Modal publier produit (agriculteur) */}
            <AnimatePresence>
            {modalMarche && (
                <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div variants={modalPanel} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('markets.publishModalTitle')}</h2>
                            <button onClick={() => setModalMarche(false)} className="text-gray-400 hover:text-gray-600">
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        {erreur && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">{erreur}</div>
                        )}

                        <form onSubmit={handlePublierMarche} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('markets.fieldProduct')}</label>
                                <select
                                    value={formMarche.produit_id}
                                    onChange={(e) => setFormMarche({ ...formMarche, produit_id: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">{t('markets.chooseProduct')}</option>
                                    {produits.map((p) => (
                                        <option key={p.produit_id} value={p.produit_id}>{p.produit_nom}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('markets.fieldMarketName')}</label>
                                <select
                                    value={formMarche.nom}
                                    onChange={(e) => setFormMarche({ ...formMarche, nom: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">{t('markets.chooseMarket')}</option>
                                    {MARCHES_REFERENCE.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                {formMarche.nom === 'Autre' && (
                                    <input
                                        type="text"
                                        value={formMarche.nomLibre}
                                        onChange={(e) => setFormMarche({ ...formMarche, nomLibre: e.target.value })}
                                        placeholder={t('markets.marketNamePlaceholder')}
                                        className="w-full mt-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('markets.fieldLocation')}</label>
                                <input
                                    type="text"
                                    value={formMarche.localisation}
                                    onChange={(e) => setFormMarche({ ...formMarche, localisation: e.target.value })}
                                    placeholder={t('markets.locationPlaceholder')}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('markets.fieldPrice')}
                                        {formMarche.produit_id && (
                                            <span className="text-gray-400 font-normal"> (Ar/{produits.find((p) => String(p.produit_id) === String(formMarche.produit_id))?.produit_unite || 'kg'})</span>
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        value={formMarche.prix}
                                        onChange={(e) => setFormMarche({ ...formMarche, prix: e.target.value })}
                                        placeholder={t('markets.pricePlaceholder')}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('markets.fieldQuantity')}</label>
                                    <input
                                        type="text"
                                        value={formMarche.quantite}
                                        onChange={(e) => setFormMarche({ ...formMarche, quantite: e.target.value })}
                                        placeholder={t('markets.quantityPlaceholder')}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalMarche(false)}
                                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    {t('markets.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors"
                                >
                                    {t('markets.publish')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* Modal nouveau produit (admin) */}
            <AnimatePresence>
            {modalProduit && (
                <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div variants={modalPanel} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('markets.newProductModalTitle')}</h2>
                            <button onClick={() => setModalProduit(false)} className="text-gray-400 hover:text-gray-600">
                                <FiX className="text-xl" />
                            </button>
                        </div>
                        {erreur && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">{erreur}</div>
                        )}
                        <form onSubmit={handleCreerProduit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('markets.fieldProductName')}</label>
                                <input
                                    type="text"
                                    value={produitForm.nom}
                                    onChange={(e) => setProduitForm({ ...produitForm, nom: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder={t('markets.productNamePlaceholder')}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('markets.fieldDescription')}</label>
                                <textarea
                                    value={produitForm.description}
                                    onChange={(e) => setProduitForm({ ...produitForm, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    rows={2}
                                    placeholder={t('markets.descriptionPlaceholder')}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('markets.fieldUnit')}</label>
                                    <select
                                        value={produitForm.unite}
                                        onChange={(e) => setProduitForm({ ...produitForm, unite: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        {UNITES.map((u) => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('markets.fieldCategory')}</label>
                                    <input
                                        type="text"
                                        list="categories-suggestions"
                                        value={produitForm.categorie}
                                        onChange={(e) => setProduitForm({ ...produitForm, categorie: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder={t('markets.categoryPlaceholder')}
                                    />
                                    <datalist id="categories-suggestions">
                                        {CATEGORIES_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalProduit(false)}
                                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    {t('markets.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors"
                                >
                                    {t('markets.create')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* Modal historique prix */}
            <AnimatePresence>
            {historiqueOuvert && (
                <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div variants={modalPanel} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-lg shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                {t('markets.priceHistoryTitle')} — {produitSelectionne?.produit_nom}
                            </h2>
                            <button onClick={() => setHistoriqueOuvert(false)} className="text-gray-400 hover:text-gray-600">
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        <div className="flex gap-2 mb-4">
                            {PERIODES.map((p) => (
                                <button
                                    key={p.valeur}
                                    onClick={() => handleChangerPeriode(p.valeur)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                        periodeHistorique === p.valeur
                                            ? 'bg-primary-600 dark:bg-mint-400 dark:text-forest-950 text-white'
                                            : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                                    }`}
                                >
                                    {t(`markets.${p.labelKey}`)}
                                </button>
                            ))}
                        </div>

                        {historique.length > 1 && (
                            <div className="mb-5 -mx-2">
                                <ResponsiveContainer width="100%" height={160}>
                                    <LineChart data={historique.map((h) => ({ ...h, dateLabel: new Date(h.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) }))}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                                        <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                                        <Tooltip formatter={(value) => [`${value} Ar`, t('markets.fieldPrice')]} />
                                        <Line type="monotone" dataKey="prix_agricole" stroke="#2D6A4F" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {historique.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('markets.noHistory')}</p>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {historique.map((h) => (
                                    <div key={h.marche_id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FiMapPin className="text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{h.marche_nom}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{h.marche_localisation}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-green-600 font-semibold whitespace-nowrap">
                                                    {h.prix_agricole} Ar<span className="text-xs font-normal text-gray-400">/{produitSelectionne?.produit_unite || 'kg'}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleSignalerPrix(h.marche_id)}
                                                    title={t('markets.reportPrice')}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <FiFlag className="text-sm" />
                                                </button>
                                            </div>
                                        </div>
                                        {(h.marche_quantite || h.vendeur_nom) && (
                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                    {h.marche_quantite && (
                                                        <span className="flex items-center gap-1"><FiPackage /> {h.marche_quantite}</span>
                                                    )}
                                                    {h.vendeur_nom && (
                                                        <span className="flex items-center gap-1"><FiTag /> {h.vendeur_nom}</span>
                                                    )}
                                                </div>
                                                {h.marche_utilisateur_id && h.marche_utilisateur_id !== utilisateur?.id && (
                                                    <button
                                                        onClick={() => handleContacterVendeur(h.marche_utilisateur_id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-colors"
                                                    >
                                                        <FiMessageCircle /> {t('markets.contactSeller')}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* Modal declarer un stock disponible (module 8.6) */}
            <AnimatePresence>
            {modalOffre && (
                <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div variants={modalPanel} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('markets.declareStockTitle')}</h2>
                            <button onClick={() => setModalOffre(false)} className="text-gray-400 hover:text-gray-600">
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        {erreurOffre && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">{erreurOffre}</div>
                        )}

                        <form onSubmit={handleCreerOffre} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('markets.fieldOfferProduct')}</label>
                                <input
                                    type="text"
                                    value={formOffre.produit_nom}
                                    onChange={(e) => setFormOffre({ ...formOffre, produit_nom: e.target.value })}
                                    placeholder={t('markets.offerProductPlaceholder')}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('markets.fieldQuantity')}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formOffre.quantite}
                                        onChange={(e) => setFormOffre({ ...formOffre, quantite: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('markets.fieldUnit')}</label>
                                    <select
                                        value={formOffre.unite}
                                        onChange={(e) => setFormOffre({ ...formOffre, unite: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        {UNITES_OFFRE.map((u) => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('markets.fieldDesiredPrice')}</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formOffre.prix_souhaite}
                                    onChange={(e) => setFormOffre({ ...formOffre, prix_souhaite: e.target.value })}
                                    placeholder={t('markets.pricePlaceholder')}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('markets.fieldAvailableFrom')}</label>
                                <input
                                    type="date"
                                    value={formOffre.date_disponibilite}
                                    onChange={(e) => setFormOffre({ ...formOffre, date_disponibilite: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('markets.fieldContactPhone')}</label>
                                <input
                                    type="tel"
                                    value={formOffre.telephone_contact}
                                    onChange={(e) => setFormOffre({ ...formOffre, telephone_contact: e.target.value })}
                                    placeholder="034 12 345 67"
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOffre(false)}
                                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    {t('markets.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors"
                                >
                                    {t('markets.publish')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

export default Marches;
