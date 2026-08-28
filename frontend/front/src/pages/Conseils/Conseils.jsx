import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import {
    getConseils, createConseil, deleteConseil, archiverConseil, genererConseilsAutomatiques, getMeteoTempsReel,
    getBaseSymptomes, diagnostiquer, validerDiagnostic,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ConseilMeteo from '../../components/ConseilMeteo';
import {
    FiPlus, FiTrash, FiArchive, FiBook, FiUser, FiCalendar, FiActivity, FiCheckCircle, FiXCircle, FiClock,
    FiDroplet, FiSun, FiShield,
} from 'react-icons/fi';
import { GiWheat } from 'react-icons/gi';

const panelClass = 'bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700';

const ICONE_CATEGORIE = {
    irrigation: FiDroplet,
    engrais: GiWheat,
    recolte: FiSun,
    protection: FiShield,
};

const TUILE_CATEGORIE = {
    irrigation: 'bg-blue-500 text-white',
    engrais: 'bg-mint-500 text-white',
    recolte: 'bg-amber-500 text-white',
    protection: 'bg-red-500 text-white',
    archive: 'bg-gray-400 text-white',
};

const ConfidenceRing = ({ valeur = 0 }) => {
    const r = 24;
    const c = 2 * Math.PI * r;
    const offset = c - (Math.max(0, Math.min(100, valeur)) / 100) * c;
    return (
        <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 60 60" className="w-16 h-16 -rotate-90">
                <circle cx="30" cy="30" r={r} className="stroke-gray-100 dark:stroke-white/10" strokeWidth="6" fill="none" />
                <circle
                    cx="30" cy="30" r={r} className="stroke-mint-500 dark:stroke-mint-400" strokeWidth="6" fill="none"
                    strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800 dark:text-white">
                {Math.round(valeur)}%
            </span>
        </div>
    );
};

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

const Conseils = () => {
    const { t } = useTranslation();
    const [conseils, setConseils] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOuvert, setModalOuvert] = useState(false);
    const [form, setForm] = useState({ titre: '', contenu: '', categorie: '', culture_id: '' });
    const [erreur, setErreur] = useState('');
    const [meteo, setMeteo] = useState(null);
    const { utilisateur } = useAuth();

    const [diagOuvert, setDiagOuvert] = useState(false);
    const [baseSymptomes, setBaseSymptomes] = useState({ cultures: [], symptomesParCulture: {} });
    const [diagCulture, setDiagCulture] = useState('');
    const [diagSymptomes, setDiagSymptomes] = useState([]);
    const [diagResultat, setDiagResultat] = useState(null);
    const [diagLance, setDiagLance] = useState(false);
    const [diagEnvoi, setDiagEnvoi] = useState(false);
    const [diagErreur, setDiagErreur] = useState('');

    useEffect(() => {
        fetchConseils();
        if (utilisateur?.role === 'agriculteur') {
            getMeteoTempsReel('Antananarivo')
                .then((res) => setMeteo(res.data.data))
                .catch(() => setMeteo(null));
            getBaseSymptomes()
                .then((res) => setBaseSymptomes(res.data.data))
                .catch((err) => console.error(err));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleSymptome = (symptome) => {
        setDiagSymptomes((prev) =>
            prev.includes(symptome) ? prev.filter((s) => s !== symptome) : [...prev, symptome]
        );
    };

    const handleChangerCultureDiag = (culture) => {
        setDiagCulture(culture);
        setDiagSymptomes([]);
        setDiagResultat(null);
        setDiagLance(false);
        setDiagErreur('');
    };

    const handleDiagnostiquer = async () => {
        setDiagErreur('');
        if (!diagCulture || diagSymptomes.length === 0) {
            setDiagErreur(t('advicePage.diagnosticNeedSymptom'));
            return;
        }
        setDiagEnvoi(true);
        try {
            const res = await diagnostiquer({ culture: diagCulture, symptomes: diagSymptomes });
            setDiagResultat(res.data.data.resultat);
            setDiagLance(true);
            fetchConseils();
        } catch (err) {
            setDiagErreur(err.response?.data?.message || t('advicePage.diagnosticError'));
        } finally {
            setDiagEnvoi(false);
        }
    };

    const handleValiderDiagnostic = async (id, valide) => {
        try {
            await validerDiagnostic(id, valide);
            fetchConseils();
        } catch (err) {
            console.error(err);
        }
    };

    const fetchConseils = async () => {
        try {
            if (utilisateur?.role === 'agriculteur') {
                try {
                    await genererConseilsAutomatiques();
                } catch (err) {
                    console.error('Erreur generation conseils automatiques', err);
                }
            }
            const res = await getConseils();
            setConseils(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const donnees = { ...form, culture_id: form.culture_id || null };
            await createConseil(donnees);
            fetchConseils();
            setModalOuvert(false);
            setForm({ titre: '', contenu: '', categorie: '', culture_id: '' });
        } catch (err) {
            setErreur(err.response?.data?.message || t('advicePage.genericError'));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('advicePage.confirmDelete'))) {
            await deleteConseil(id);
            fetchConseils();
        }
    };

    const handleArchiver = async (id) => {
        await archiverConseil(id);
        fetchConseils();
    };

    const couleurCategorie = (categorie) => {
        const couleurs = {
            irrigation: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            engrais: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            recolte: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            archive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
        };
        return couleurs[categorie] || 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-2xl font-semibold text-gray-800 dark:text-white">{t('advicePage.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('advicePage.subtitle')}</p>
                </div>
                {utilisateur?.role === 'expert' && (
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setModalOuvert(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 text-white rounded-xl shadow-sm hover:shadow-md transition-all"
                    >
                        <FiPlus /> {t('advicePage.publish')}
                    </motion.button>
                )}
            </motion.div>

            {utilisateur?.role === 'agriculteur' && meteo && (
                <ConseilMeteo meteo={meteo} role={utilisateur?.role} />
            )}

            {utilisateur?.role === 'agriculteur' && (
                <div className={`${panelClass} p-6`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <FiActivity className="text-primary-600 dark:text-mint-400" />
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('advicePage.diagnosticTitle')}</h2>
                        </div>
                        <button
                            onClick={() => { setDiagOuvert((v) => !v); setDiagResultat(null); setDiagLance(false); setDiagErreur(''); }}
                            className="text-xs text-primary-600 dark:text-mint-400 hover:underline"
                        >
                            {diagOuvert ? t('advicePage.diagnosticClose') : t('advicePage.diagnosticOpen')}
                        </button>
                    </div>
                    {diagOuvert && (
                        <div className="space-y-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('advicePage.diagnosticCropLabel')}</label>
                                <select
                                    value={diagCulture}
                                    onChange={(e) => handleChangerCultureDiag(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">{t('advicePage.diagnosticChooseCrop')}</option>
                                    {baseSymptomes.cultures.map((c) => (
                                        <option key={c} value={c} className="capitalize">{c}</option>
                                    ))}
                                </select>
                            </div>

                            {diagCulture && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('advicePage.diagnosticSymptomsLabel')}</label>
                                    <div className="space-y-2">
                                        {(baseSymptomes.symptomesParCulture[diagCulture] || []).map((symptome) => (
                                            <label key={symptome} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={diagSymptomes.includes(symptome)}
                                                    onChange={() => toggleSymptome(symptome)}
                                                    className="mt-1"
                                                />
                                                {symptome}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {diagErreur && <p className="text-sm text-red-600">{diagErreur}</p>}

                            <button
                                onClick={handleDiagnostiquer}
                                disabled={diagEnvoi}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-mint-400 dark:hover:bg-mint-300 text-white dark:text-forest-950 rounded-xl text-sm font-medium disabled:opacity-50"
                            >
                                {diagEnvoi ? t('advicePage.diagnosticSubmitting') : t('advicePage.diagnosticSubmit')}
                            </button>

                            {diagLance && (
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl text-sm flex items-start gap-4">
                                    {diagResultat ? (
                                        <>
                                            <ConfidenceRing valeur={diagResultat.confiance} />
                                            <div className="space-y-1">
                                                <p className="font-semibold text-gray-800 dark:text-white">{diagResultat.maladie}</p>
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    {t('advicePage.diagnosticResultTreatment')} : {diagResultat.traitement_bio}
                                                </p>
                                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1.5"><FiClock /> {t('advicePage.diagnosticPendingValidation')}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-gray-600 dark:text-gray-400">{t('advicePage.diagnosticNoMatch')}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {conseils.length === 0 ? (
                <div className={`${panelClass} p-12 text-center`}>
                    <FiBook className="text-5xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t('advicePage.noAdvice')}</p>
                </div>
            ) : (
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {conseils.map((conseil) => {
                        const IconeCat = ICONE_CATEGORIE[conseil.conseil_categorie] || FiBook;
                        const estUrgent = conseil.conseil_categorie === 'protection';
                        return (
                        <motion.div key={conseil.conseil_id} variants={fadeUp} whileHover={{ y: -4 }}>
                            <div className={`relative ${panelClass} shadow-sm hover:shadow-lg transition-shadow duration-300 p-6`}>
                                {estUrgent && (
                                    <span className="absolute -top-2 -left-2 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-red-500 text-white shadow-sm">
                                        {t('advicePage.urgent') || 'Urgent'}
                                    </span>
                                )}
                                <div className="flex items-start justify-between mb-3 gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TUILE_CATEGORIE[conseil.conseil_categorie] || 'bg-purple-500 text-white'}`}>
                                            <IconeCat className="text-base" />
                                        </div>
                                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${couleurCategorie(conseil.conseil_categorie)}`}>
                                            {conseil.conseil_categorie}
                                        </span>
                                    </div>
                                    {(utilisateur?.role === 'expert' || utilisateur?.role === 'administrateur') && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleArchiver(conseil.conseil_id)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-300">
                                                <FiArchive className="text-sm" />
                                            </button>
                                            <button onClick={() => handleDelete(conseil.conseil_id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500">
                                                <FiTrash className="text-sm" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{conseil.conseil_titre}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{conseil.conseil_contenu}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-100 dark:border-white/10">
                                    <div className="flex items-center gap-1">
                                        <FiUser /> {conseil.conseil_origine === 'systeme' ? t('advicePage.generatedForYou') : conseil.auteur}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FiCalendar /> {new Date(conseil.conseil_date_publication).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>

                                {conseil.conseil_origine === 'systeme' && conseil.conseil_categorie === 'protection' && (
                                    conseil.conseil_valide_par_expert === true ? (
                                        <div className="flex items-center gap-1.5 text-xs text-mint-700 dark:text-mint-400 mt-2">
                                            <FiCheckCircle /> {t('advicePage.expertValidated')}
                                        </div>
                                    ) : conseil.conseil_valide_par_expert === false ? (
                                        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mt-2">
                                            <FiXCircle /> {t('advicePage.expertInvalidated')}
                                        </div>
                                    ) : (utilisateur?.role === 'expert' || utilisateur?.role === 'administrateur') ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => handleValiderDiagnostic(conseil.conseil_id, true)}
                                                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-mint-50 dark:bg-mint-900/20 text-mint-700 dark:text-mint-400 rounded-lg hover:bg-mint-100 dark:hover:bg-mint-900/30"
                                            >
                                                <FiCheckCircle /> {t('advicePage.validateDiagnostic')}
                                            </button>
                                            <button
                                                onClick={() => handleValiderDiagnostic(conseil.conseil_id, false)}
                                                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                                            >
                                                <FiXCircle /> {t('advicePage.invalidateDiagnostic')}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-2">
                                            <FiClock /> {t('advicePage.pendingExpertReview')}
                                        </div>
                                    )
                                )}
                            </div>
                        </motion.div>
                        );
                    })}
                </motion.div>
            )}

            <AnimatePresence>
            {modalOuvert && (
                <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div variants={modalPanel} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('advicePage.modalTitle')}</h2>

                        {erreur && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">{erreur}</div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('advicePage.fieldTitle')}</label>
                                <input
                                    type="text"
                                    value={form.titre}
                                    onChange={(e) => setForm({ ...form, titre: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('advicePage.fieldContent')}</label>
                                <textarea
                                    value={form.contenu}
                                    onChange={(e) => setForm({ ...form, contenu: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('advicePage.fieldCategory')}</label>
                                <select
                                    value={form.categorie}
                                    onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">{t('advicePage.chooseOption')}</option>
                                    <option value="irrigation">{t('advicePage.categoryIrrigation')}</option>
                                    <option value="engrais">{t('advicePage.categoryFertilizer')}</option>
                                    <option value="recolte">{t('advicePage.categoryHarvest')}</option>
                                    <option value="protection">{t('advicePage.categoryProtection')}</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOuvert(false)}
                                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    {t('advicePage.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors"
                                >
                                    {t('advicePage.publishButton')}
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

export default Conseils;