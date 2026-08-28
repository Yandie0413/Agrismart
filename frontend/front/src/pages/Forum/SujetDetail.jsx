import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    getSujetForum, repondreSujetForum, supprimerSujetForum, supprimerReponseForum,
    likerSujetForum, likerReponseForum,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiArrowLeft, FiSend, FiTrash, FiCheckCircle, FiHeart } from 'react-icons/fi';

// Meme degrade "photo" par categorie que Forum.jsx, pour garder le meme langage visuel magazine.
const CATEGORY_PHOTO = {
    general: 'radial-gradient(120% 130% at 25% 15%, #cfc7ad 0%, #8a8264 45%, #2e2a1c 100%)',
    irrigation: 'radial-gradient(120% 130% at 25% 15%, #8fd0e8 0%, #3f7fa0 45%, #12313f 100%)',
    maladie: 'radial-gradient(120% 130% at 25% 15%, #e4977a 0%, #a0402f 45%, #3a140d 100%)',
    recolte: 'radial-gradient(120% 130% at 25% 12%, #f4e2a4 0%, #d9b65c 42%, #7a5a1e 100%)',
    materiel: 'radial-gradient(120% 130% at 25% 15%, #c2ccd3 0%, #5c6b73 45%, #1f2933 100%)',
    marche: 'radial-gradient(120% 130% at 30% 12%, #9fd18f 0%, #3f7d38 46%, #16260f 100%)',
};

const initiales = (nom) => (nom ? nom.charAt(0).toUpperCase() : '?');

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const SujetDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { utilisateur } = useAuth();
    const [sujet, setSujet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reponse, setReponse] = useState('');
    const [envoi, setEnvoi] = useState(false);

    const fetchSujet = useCallback(async () => {
        try {
            const res = await getSujetForum(id);
            setSujet(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchSujet();
    }, [fetchSujet]);

    const handleReponse = async (e) => {
        e.preventDefault();
        if (!reponse.trim()) return;
        setEnvoi(true);
        try {
            await repondreSujetForum(id, { contenu: reponse.trim() });
            setReponse('');
            fetchSujet();
        } catch (err) {
            console.error(err);
        } finally {
            setEnvoi(false);
        }
    };

    const handleSupprimerSujet = async () => {
        if (!window.confirm(t('forumPage.confirmDeleteTopic'))) return;
        await supprimerSujetForum(id);
        navigate('/forum');
    };

    const handleSupprimerReponse = async (reponseId) => {
        if (!window.confirm(t('forumPage.confirmDeleteReply'))) return;
        await supprimerReponseForum(reponseId);
        fetchSujet();
    };

    const handleLikerSujet = async () => {
        try {
            const res = await likerSujetForum(id);
            const { deja_like, nombre_likes } = res.data.data;
            setSujet((prev) => ({ ...prev, deja_like, nombre_likes }));
        } catch (err) {
            console.error(err);
        }
    };

    const handleLikerReponse = async (reponseId) => {
        try {
            const res = await likerReponseForum(reponseId);
            const { deja_like, nombre_likes } = res.data.data;
            setSujet((prev) => ({
                ...prev,
                reponses: prev.reponses.map((r) => (r.reponse_id === reponseId ? { ...r, deja_like, nombre_likes } : r)),
            }));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint-400"></div>
        </div>
    );

    if (!sujet) return (
        <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400">{t('forumPage.topicNotFound')}</p>
        </div>
    );

    const peutSupprimerSujet = sujet.utilisateur_id === utilisateur?.id || utilisateur?.role === 'administrateur';

    return (
        <div className="max-w-3xl mx-auto">
            <Link to="/forum" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-mint-400 w-fit mb-8">
                <FiArrowLeft /> {t('forumPage.backToForum')}
            </Link>

            {/* Article principal, meme langage que les cartes de Forum.jsx : photo teintee par categorie, pas de boite */}
            <article>
                <div
                    className="aspect-[16/9] rounded-3xl mb-6"
                    style={{ background: CATEGORY_PHOTO[sujet.sujet_categorie] || CATEGORY_PHOTO.general }}
                />
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center flex-wrap gap-2 mb-3">
                        <span className="w-7 h-7 rounded-full bg-primary-600 dark:bg-mint-400 text-white dark:text-forest-950 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {initiales(sujet.auteur)}
                        </span>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{sujet.auteur}</span>
                        {sujet.auteur_role === 'expert' && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-accent-600 dark:text-accent-400 border border-current rounded-full px-2 py-0.5">
                                <FiCheckCircle /> {t('forumPage.verifiedExpert')}
                            </span>
                        )}
                        <span className="text-gray-300 dark:text-white/20">·</span>
                        <span className="text-xs text-gray-400 dark:text-white/40">{new Date(sujet.created_at).toLocaleDateString('fr-FR')}</span>
                        <span className="text-[11px] font-bold tracking-wide uppercase text-primary-600 dark:text-mint-400">
                            {sujet.sujet_categorie}
                        </span>
                    </div>
                    {peutSupprimerSujet && (
                        <button onClick={handleSupprimerSujet} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-red-500 flex-shrink-0">
                            <FiTrash />
                        </button>
                    )}
                </div>
                <h1 className="font-serif font-bold text-3xl md:text-4xl leading-tight text-gray-900 dark:text-white">{sujet.sujet_titre}</h1>
                <p className="text-[15px] leading-relaxed text-gray-600 dark:text-gray-300 mt-4 whitespace-pre-wrap max-w-prose">{sujet.sujet_contenu}</p>
                <button
                    onClick={handleLikerSujet}
                    className={`flex items-center gap-1.5 text-sm font-semibold mt-5 transition-colors ${sujet.deja_like ? 'text-red-500' : 'text-gray-400 dark:text-white/40 hover:text-red-400'}`}
                >
                    <FiHeart className={sujet.deja_like ? 'fill-current' : ''} /> {sujet.nombre_likes || 0}
                </button>
            </article>

            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-white/10">
                <h2 className="text-[11px] font-bold tracking-[0.16em] uppercase text-gray-400 dark:text-white/40 mb-4">
                    {t('forumPage.repliesCount', { count: sujet.reponses?.length || 0 })}
                </h2>
                <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
                    {sujet.reponses?.map((r) => (
                        <motion.div key={r.reponse_id} variants={fadeUp} className="flex items-start justify-between gap-3 py-5 border-t border-gray-100 dark:border-white/10 first:border-t-0">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-xs mb-1.5 flex-wrap">
                                    <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                        {initiales(r.auteur)}
                                    </span>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{r.auteur}</span>
                                    {r.auteur_role === 'expert' && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-accent-600 dark:text-accent-400 border border-current rounded-full px-1.5 py-0.5">
                                            <FiCheckCircle /> {t('forumPage.verifiedExpert')}
                                        </span>
                                    )}
                                    <span className="text-gray-300 dark:text-white/20">·</span>
                                    <span className="text-gray-400 dark:text-white/40">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{r.reponse_contenu}</p>
                                <button
                                    onClick={() => handleLikerReponse(r.reponse_id)}
                                    className={`flex items-center gap-1.5 text-xs font-semibold mt-2.5 transition-colors ${r.deja_like ? 'text-red-500' : 'text-gray-400 dark:text-white/40 hover:text-red-400'}`}
                                >
                                    <FiHeart className={r.deja_like ? 'fill-current' : ''} /> {r.nombre_likes || 0}
                                </button>
                            </div>
                            {(r.utilisateur_id === utilisateur?.id || utilisateur?.role === 'administrateur') && (
                                <button onClick={() => handleSupprimerReponse(r.reponse_id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400 flex-shrink-0">
                                    <FiTrash className="text-sm" />
                                </button>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            <form onSubmit={handleReponse} className="flex gap-3 items-end mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
                <textarea
                    value={reponse}
                    onChange={(e) => setReponse(e.target.value)}
                    placeholder={t('forumPage.replyPlaceholder')}
                    rows={2}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-mint-400 resize-none"
                />
                <button
                    type="submit"
                    disabled={envoi || !reponse.trim()}
                    className="px-5 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-mint-400 dark:hover:bg-mint-300 dark:text-forest-950 disabled:opacity-50 text-white rounded-xl transition-colors flex-shrink-0"
                >
                    <FiSend />
                </button>
            </form>
        </div>
    );
};

export default SujetDetail;
