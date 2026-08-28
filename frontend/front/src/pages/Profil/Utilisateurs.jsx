import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import {
    getUtilisateurs, supprimerUtilisateur, getStatistiques, modifierRoleUtilisateur, getDetailUtilisateur,
    getExpertsEnAttente, validerExpert,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/UI/Avatar';
import AnimatedNumber from '../../components/UI/AnimatedNumber';
import { DashboardAgriExpert } from '../../components/Dashboard/Widgets';
import { FiTrash, FiUsers, FiX, FiCheck, FiUserCheck } from 'react-icons/fi';

const ROLES = ['agriculteur', 'expert', 'administrateur'];
const panelClass = 'bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700';

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const Utilisateurs = () => {
    const { t } = useTranslation();
    const { utilisateur: moi } = useAuth();
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailOuvert, setDetailOuvert] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [expertsEnAttente, setExpertsEnAttente] = useState([]);

    useEffect(() => {
        fetchData();
        fetchExpertsEnAttente();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchExpertsEnAttente = async () => {
        try {
            const res = await getExpertsEnAttente();
            setExpertsEnAttente(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleValiderExpert = async (id, statut) => {
        try {
            await validerExpert(id, statut);
            setExpertsEnAttente((prev) => prev.filter((e) => e.utilisateur_id !== id));
        } catch (err) {
            console.error(err);
            window.alert(err.response?.data?.message || t('usersPage.roleChangeError'));
        }
    };

    const ouvrirDetail = async (id) => {
        setDetailLoading(true);
        try {
            const res = await getDetailUtilisateur(id);
            const d = res.data.data;
            setDetailOuvert({
                ...d,
                utilisateur: {
                    id: d.utilisateur.utilisateur_id,
                    nom: d.utilisateur.utilisateur_nom,
                    email: d.utilisateur.utilisateur_email,
                    role: d.utilisateur.utilisateur_role,
                    photo: d.utilisateur.utilisateur_photo
                }
            });
        } catch (err) {
            console.error(err);
        } finally {
            setDetailLoading(false);
        }
    };

    const fetchData = async () => {
        try {
            const [resUtilisateurs, resStats] = await Promise.all([
                getUtilisateurs(),
                getStatistiques()
            ]);
            setUtilisateurs(resUtilisateurs.data.data);
            setStats(resStats.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('usersPage.confirmDelete'))) {
            await supprimerUtilisateur(id);
            fetchData();
        }
    };

    const handleChangerRole = async (id, role) => {
        try {
            await modifierRoleUtilisateur(id, role);
            setUtilisateurs((prev) => prev.map((u) => (u.utilisateur_id === id ? { ...u, utilisateur_role: role } : u)));
        } catch (err) {
            console.error(err);
            window.alert(err.response?.data?.message || t('usersPage.roleChangeError'));
        }
    };

    const couleurRole = (role) => {
        const couleurs = {
            agriculteur: 'bg-mint-100 text-mint-700 dark:bg-mint-900/30 dark:text-mint-400',
            expert: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            administrateur: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        };
        return couleurs[role] || 'bg-gray-100 text-gray-700';
    };

    const avatarGradient = (role) => {
        const gradients = {
            agriculteur: 'from-mint-400 to-primary-600',
            expert: 'from-blue-400 to-blue-600',
            administrateur: 'from-purple-400 to-purple-600',
        };
        return gradients[role] || 'from-gray-400 to-gray-600';
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint-400"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{t('usersPage.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('usersPage.subtitle')}</p>
            </motion.div>

            {/* Experts en attente de validation */}
            {expertsEnAttente.length > 0 && (
                <div className={`${panelClass} p-6`}>
                    <div className="flex items-center gap-2 mb-4">
                        <FiUserCheck className="text-amber-500 text-lg" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('usersPage.pendingExperts')}</h2>
                        <span className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full font-medium">
                            {expertsEnAttente.length}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {expertsEnAttente.map((e) => (
                            <div key={e.utilisateur_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-white">{e.utilisateur_nom}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {e.utilisateur_email} {e.utilisateur_telephone && `· ${e.utilisateur_telephone}`}
                                        {e.expert_specialite && ` · ${e.expert_specialite}`}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleValiderExpert(e.utilisateur_id, 'valide')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-mint-50 dark:bg-mint-900/20 text-mint-700 dark:text-mint-400 rounded-lg text-xs font-medium hover:bg-mint-100 dark:hover:bg-mint-900/30"
                                    >
                                        <FiCheck /> {t('usersPage.approve')}
                                    </button>
                                    <button
                                        onClick={() => handleValiderExpert(e.utilisateur_id, 'rejete')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30"
                                    >
                                        <FiX /> {t('usersPage.reject')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats par role */}
            {stats?.parRole && (
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.parRole.map((s) => (
                        <motion.div key={s.utilisateur_role} variants={fadeUp}>
                            <div className={`${panelClass} p-6`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{s.utilisateur_role}s</p>
                                        <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                                            <AnimatedNumber value={s.total} />
                                        </p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradient(s.utilisateur_role)} flex items-center justify-center shadow-sm`}>
                                        <FiUsers className="text-white" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Liste utilisateurs, registre — une rangee par compte plutot qu'un tableau */}
            <div className={panelClass}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="font-serif text-lg font-semibold text-gray-800 dark:text-white">{t('usersPage.allUsers')}</h2>
                    <span className="text-xs px-3 py-1 bg-primary-50 dark:bg-mint-400/10 text-primary-600 dark:text-mint-400 rounded-full font-medium">
                        {utilisateurs.length}
                    </span>
                </div>
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="divide-y divide-gray-100 dark:divide-gray-700">
                    {utilisateurs.map((u) => (
                        <motion.div
                            key={u.utilisateur_id}
                            variants={fadeUp}
                            onClick={() => ouvrirDetail(u.utilisateur_id)}
                            className="flex items-center gap-4 px-6 py-4 hover:bg-primary-50/30 dark:hover:bg-white/[0.03] transition-colors cursor-pointer flex-wrap sm:flex-nowrap"
                        >
                            <Avatar utilisateur={{ nom: u.utilisateur_nom, photo: u.utilisateur_photo }} className="w-9 h-9 text-sm shadow-sm flex-shrink-0" />
                            <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{u.utilisateur_nom}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.utilisateur_email}</p>
                            </div>
                            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                                {u.utilisateur_id === moi?.id ? (
                                    <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${couleurRole(u.utilisateur_role)}`}>
                                        {u.utilisateur_role}
                                    </span>
                                ) : (
                                    <select
                                        value={u.utilisateur_role}
                                        onChange={(e) => handleChangerRole(u.utilisateur_id, e.target.value)}
                                        className={`text-xs px-2.5 py-1.5 rounded-full font-medium capitalize border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-mint-400 ${couleurRole(u.utilisateur_role)}`}
                                    >
                                        {ROLES.map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <span className="text-xs text-gray-400 font-mono w-20 text-right flex-shrink-0 hidden sm:inline">
                                {new Date(u.created_at).toLocaleDateString('fr-FR')}
                            </span>
                            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0 w-8">
                                {u.utilisateur_id !== moi?.id && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleDelete(u.utilisateur_id)}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-red-500 transition-colors"
                                    >
                                        <FiTrash />
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            <AnimatePresence>
                {(detailOuvert || detailLoading) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
                        onClick={() => setDetailOuvert(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 8 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gray-50 dark:bg-forest-950 rounded-3xl w-full max-w-6xl my-4 p-6 sm:p-8 relative"
                        >
                            <button
                                onClick={() => setDetailOuvert(null)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-gray-500 dark:text-gray-300 shadow-sm z-10"
                            >
                                <FiX />
                            </button>

                            {detailLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                                </div>
                            ) : detailOuvert && (
                                <>
                                    <div className="flex items-center gap-4 mb-6">
                                        <Avatar utilisateur={detailOuvert.utilisateur} className="w-14 h-14 text-lg shadow-md" />
                                        <div>
                                            <h2 className="font-serif text-xl font-semibold text-gray-800 dark:text-white">{detailOuvert.utilisateur.nom}</h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{detailOuvert.utilisateur.email} · <span className="capitalize">{detailOuvert.utilisateur.role}</span></p>
                                        </div>
                                    </div>

                                    {detailOuvert.utilisateur.role === 'administrateur' ? (
                                        <div className={`${panelClass} p-8 text-center text-sm text-gray-500 dark:text-gray-400`}>
                                            {t('usersPage.noDetailForAdmin')}
                                        </div>
                                    ) : (
                                        <DashboardAgriExpert data={detailOuvert} utilisateur={detailOuvert.utilisateur} t={t} />
                                    )}
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Utilisateurs;
