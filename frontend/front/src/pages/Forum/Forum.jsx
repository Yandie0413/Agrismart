import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { getSujetsForum, creerSujetForum, likerSujetForum } from '../../services/api';
import { FiPlus, FiMessageCircle, FiX, FiCheckCircle, FiHeart } from 'react-icons/fi';
import { ajouterActionEnAttente } from '../../utils/cacheHorsLigne';

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
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

const CATEGORIES = ['general', 'irrigation', 'maladie', 'recolte', 'materiel', 'marche'];

// Degrade "photo" par categorie (aucune vraie photo n'est associee a un sujet de discussion,
// donc on illustre chaque publication par une teinte de fond propre a sa categorie plutot
// que de recycler une photo circulaire generique).
const CATEGORY_PHOTO = {
    general: 'radial-gradient(120% 130% at 25% 15%, #cfc7ad 0%, #8a8264 45%, #2e2a1c 100%)',
    irrigation: 'radial-gradient(120% 130% at 25% 15%, #8fd0e8 0%, #3f7fa0 45%, #12313f 100%)',
    maladie: 'radial-gradient(120% 130% at 25% 15%, #e4977a 0%, #a0402f 45%, #3a140d 100%)',
    recolte: 'radial-gradient(120% 130% at 25% 12%, #f4e2a4 0%, #d9b65c 42%, #7a5a1e 100%)',
    materiel: 'radial-gradient(120% 130% at 25% 15%, #c2ccd3 0%, #5c6b73 45%, #1f2933 100%)',
    marche: 'radial-gradient(120% 130% at 30% 12%, #9fd18f 0%, #3f7d38 46%, #16260f 100%)',
};

// Petites icones filaires par categorie, coherentes avec le style "journal" (pas de fond, pas de boite).
const CategoryIcon = ({ cat, className = 'w-3.5 h-3.5' }) => {
    const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', className };
    switch (cat) {
        case 'irrigation':
            return <svg {...common}><path d="M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3Z" /></svg>;
        case 'maladie':
            return <svg {...common}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" /></svg>;
        case 'recolte':
            return <svg {...common}><path d="M12 21c0-5 3-7 3-11a3 3 0 0 0-6 0c0 4 3 6 3 11Z" /></svg>;
        case 'materiel':
            return <svg {...common}><circle cx="7" cy="17" r="2.6" /><circle cx="17" cy="17" r="2.6" /><path d="m9.2 15.3 3-8.3h3.4M9 9h5.6" /></svg>;
        case 'marche':
            return <svg {...common}><path d="M3 7h7l10 10-7 7L3 14V7Z" /><circle cx="7.6" cy="7.6" r="1.1" fill="currentColor" stroke="none" /></svg>;
        default:
            return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M9 10.2h.01M12 10.2h.01M15 10.2h.01" /></svg>;
    }
};

const initiales = (nom) => (nom ? nom.charAt(0).toUpperCase() : '?');

const Forum = () => {
    const { t } = useTranslation();
    const [sujets, setSujets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOuvert, setModalOuvert] = useState(false);
    const [form, setForm] = useState({ titre: '', contenu: '', categorie: 'general' });
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);
    const [filtreCategorie, setFiltreCategorie] = useState('tous');

    const fetchSujets = async () => {
        try {
            const res = await getSujetsForum();
            setSujets(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSujets();
    }, []);

    const handleLiker = async (e, sujetId) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const res = await likerSujetForum(sujetId);
            const { deja_like, nombre_likes } = res.data.data;
            setSujets((prev) =>
                prev.map((s) => (s.sujet_id === sujetId ? { ...s, deja_like, nombre_likes } : s))
            );
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErreur('');
        setEnvoi(true);
        try {
            await creerSujetForum(form);
            setModalOuvert(false);
            setForm({ titre: '', contenu: '', categorie: 'general' });
            fetchSujets();
        } catch (err) {
            // Coupure reseau : le sujet est mis en attente et sera poste automatiquement
            // des que la connexion revient (cf. OfflineBanner), au lieu d'etre perdu.
            if (!err.response) {
                ajouterActionEnAttente('sujet_forum', form);
                setModalOuvert(false);
                setForm({ titre: '', contenu: '', categorie: 'general' });
                setErreur('');
                window.alert(t('offline.willSyncLater'));
                return;
            }
            setErreur(err.response?.data?.message || t('forumPage.genericError'));
        } finally {
            setEnvoi(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint-400"></div>
        </div>
    );

    const sujetsAffiches = filtreCategorie === 'tous'
        ? sujets
        : sujets.filter((s) => s.sujet_categorie === filtreCategorie);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Masthead : plus de gros bouton plein, un simple lien souligne */}
            <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className="flex items-end justify-between gap-4 flex-wrap pb-6"
            >
                <div>
                    <span className="text-[11px] font-bold tracking-[0.16em] uppercase text-primary-600 dark:text-mint-400">
                        {t('forumPage.subtitle')}
                    </span>
                    <h1 className="font-serif font-bold text-4xl text-gray-900 dark:text-white mt-1">{t('forumPage.title')}</h1>
                </div>
                <button
                    onClick={() => setModalOuvert(true)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white border-b border-gray-800 dark:border-white pb-0.5 hover:opacity-70 transition-opacity flex-shrink-0"
                >
                    <FiPlus /> {t('forumPage.newTopic')}
                </button>
            </motion.div>

            {/* Navigation par categorie : texte + icone, pas de pilules/chips */}
            <nav className="flex flex-wrap gap-x-6 gap-y-3 py-4 border-t border-b border-gray-100 dark:border-white/10 mb-2">
                <button
                    onClick={() => setFiltreCategorie('tous')}
                    className={`flex items-center gap-1.5 text-sm font-semibold pb-1 border-b-2 transition-colors ${filtreCategorie === 'tous' ? 'text-gray-900 dark:text-white border-primary-600 dark:border-mint-400' : 'text-gray-400 dark:text-white/40 border-transparent hover:text-gray-700 dark:hover:text-white/70'}`}
                >
                    {t('forumPage.allCategories')}
                </button>
                {CATEGORIES.map((c) => (
                    <button
                        key={c}
                        onClick={() => setFiltreCategorie(c)}
                        className={`flex items-center gap-1.5 text-sm font-semibold capitalize pb-1 border-b-2 transition-colors ${filtreCategorie === c ? 'text-gray-900 dark:text-white border-primary-600 dark:border-mint-400' : 'text-gray-400 dark:text-white/40 border-transparent hover:text-gray-700 dark:hover:text-white/70'}`}
                    >
                        <CategoryIcon cat={c} />
                        {c}
                    </button>
                ))}
            </nav>

            {sujetsAffiches.length === 0 ? (
                <div className="text-center py-20">
                    <FiMessageCircle className="text-4xl text-gray-300 dark:text-white/20 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t('forumPage.noTopics')}</p>
                </div>
            ) : (
                <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                    {sujetsAffiches.map((s, idx) => {
                        const imgRight = idx % 2 === 1;
                        return (
                            <motion.article
                                key={s.sujet_id}
                                variants={fadeUp}
                                className="border-t border-gray-100 dark:border-white/10 first:border-t-0 py-10 md:py-12"
                            >
                                <Link to={`/forum/${s.sujet_id}`} className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center group">
                                    <div
                                        className={`md:col-span-5 aspect-[4/5] rounded-3xl ${imgRight ? 'md:order-2' : ''}`}
                                        style={{ background: CATEGORY_PHOTO[s.sujet_categorie] || CATEGORY_PHOTO.general }}
                                    />
                                    <div className="md:col-span-7 min-w-0">
                                        <div className="flex items-center flex-wrap gap-2 mb-3">
                                            <span className="w-6 h-6 rounded-full bg-primary-600 dark:bg-mint-400 text-white dark:text-forest-950 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                                                {initiales(s.auteur)}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{s.auteur}</span>
                                            {s.auteur_role === 'expert' && (
                                                <span className="flex items-center gap-1 text-[11px] font-bold text-accent-600 dark:text-accent-400 border border-current rounded-full px-2 py-0.5">
                                                    <FiCheckCircle /> {t('forumPage.verifiedExpert')}
                                                </span>
                                            )}
                                            <span className="text-gray-300 dark:text-white/20">·</span>
                                            <span className="text-xs text-gray-400 dark:text-white/40">{new Date(s.created_at).toLocaleDateString('fr-FR')}</span>
                                            <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase text-primary-600 dark:text-mint-400">
                                                <CategoryIcon cat={s.sujet_categorie} />
                                                {s.sujet_categorie}
                                            </span>
                                        </div>

                                        <h2 className="font-serif font-bold text-2xl md:text-3xl leading-tight text-gray-900 dark:text-white group-hover:underline decoration-1 underline-offset-4">
                                            {s.sujet_titre}
                                        </h2>
                                        <p className="text-[15px] leading-relaxed text-gray-500 dark:text-gray-400 mt-3 line-clamp-3 max-w-prose">
                                            {s.sujet_contenu}
                                        </p>

                                        <div className="flex items-center gap-6 mt-5">
                                            <button
                                                onClick={(e) => handleLiker(e, s.sujet_id)}
                                                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${s.deja_like ? 'text-red-500' : 'text-gray-400 dark:text-white/40 hover:text-red-400'}`}
                                            >
                                                <FiHeart className={s.deja_like ? 'fill-current' : ''} />
                                                {s.nombre_likes || 0}
                                            </button>
                                            <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 dark:text-white/40">
                                                <FiMessageCircle />
                                                {s.nombre_reponses}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.article>
                        );
                    })}
                </motion.div>
            )}

            <AnimatePresence>
                {modalOuvert && (
                    <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div variants={modalPanel} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-forest-900 rounded-3xl p-6 w-full max-w-lg shadow-xl border border-gray-100 dark:border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-serif text-xl font-bold text-gray-800 dark:text-white">{t('forumPage.newTopic')}</h2>
                                <button onClick={() => setModalOuvert(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                    <FiX className="text-xl" />
                                </button>
                            </div>

                            {erreur && (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">{erreur}</div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forumPage.fieldTitle')}</label>
                                    <input
                                        type="text"
                                        value={form.titre}
                                        onChange={(e) => setForm({ ...form, titre: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-mint-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forumPage.fieldCategory')}</label>
                                    <select
                                        value={form.categorie}
                                        onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-mint-400 capitalize"
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c} className="capitalize">{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('forumPage.fieldContent')}</label>
                                    <textarea
                                        value={form.contenu}
                                        onChange={(e) => setForm({ ...form, contenu: e.target.value })}
                                        rows={5}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-mint-400"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setModalOuvert(false)}
                                        className="flex-1 py-3 border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5"
                                    >
                                        {t('forumPage.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={envoi}
                                        className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-mint-400 dark:hover:bg-mint-300 dark:text-forest-950 disabled:opacity-50 text-white rounded-xl transition-colors"
                                    >
                                        {envoi ? t('forumPage.publishing') : t('forumPage.publish')}
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

export default Forum;
