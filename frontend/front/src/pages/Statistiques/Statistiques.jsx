import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getStatistiques, getSignalementsPrix, traiterSignalementPrix } from '../../services/api';
import { FiUsers, FiPieChart, FiBarChart2, FiAlertTriangle, FiFlag, FiCheck, FiX } from 'react-icons/fi';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COULEURS = ['#4ADE80', '#2563eb', '#9333ea', '#ea580c', '#dc2626'];
const panelClass = 'bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700';

const RingGauge = ({ valeur = 0 }) => {
    const r = 56;
    const c = 2 * Math.PI * r;
    const offset = c - (Math.max(0, Math.min(100, valeur)) / 100) * c;
    return (
        <div className="relative w-32 h-32 flex-shrink-0">
            <svg viewBox="0 0 140 140" className="w-32 h-32 -rotate-90">
                <circle cx="70" cy="70" r={r} className="stroke-gray-100 dark:stroke-white/10" strokeWidth="10" fill="none" />
                <circle
                    cx="70" cy="70" r={r} className="stroke-mint-500 dark:stroke-mint-400" strokeWidth="10" fill="none"
                    strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{valeur}%</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">résolution</span>
            </div>
        </div>
    );
};

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const Statistiques = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [signalements, setSignalements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [res, resSignalements] = await Promise.all([getStatistiques(), getSignalementsPrix()]);
                setStats(res.data.data);
                setSignalements(resSignalements.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleTraiterSignalement = async (id, statut) => {
        try {
            await traiterSignalementPrix(id, statut);
            setSignalements((prev) => prev.filter((s) => s.signalement_id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint-400"></div>
        </div>
    );

    const dataParRole = stats?.parRole?.map(s => ({ name: s.utilisateur_role, value: s.total })) || [];
    const dataParMois = stats?.parMois?.map(s => ({ mois: s.mois, total: s.total })) || [];
    const dataCultures = stats?.culturesParType?.map(s => ({ name: s.culture_type, value: s.total })) || [];
    const dataAlertes = stats?.alertesParType?.map(s => ({ name: s.alerte_type, value: s.total })) || [];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{t('statisticsPage.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('statisticsPage.subtitle')}</p>
            </motion.div>

            {stats?.tauxResolutionExperts !== null && stats?.tauxResolutionExperts !== undefined && (
                <motion.div variants={fadeUp} initial="hidden" animate="visible">
                    <div className={`${panelClass} p-6 sm:p-8 flex items-center gap-6 flex-wrap`}>
                        <RingGauge valeur={stats.tauxResolutionExperts} />
                        <div className="flex-1 min-w-[220px]">
                            <p className="text-xs text-gray-400 uppercase tracking-wide">{t('statisticsPage.subtitle')}</p>
                            <h2 className="font-serif text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mt-1">{t('statisticsPage.expertResolutionRate')}</h2>
                        </div>
                    </div>
                </motion.div>
            )}

            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Repartition par role */}
                <motion.div variants={fadeUp}>
                    <div className={`${panelClass} p-6`}>
                        <div className="flex items-center gap-2 mb-4">
                            <FiUsers className="text-primary-600 dark:text-mint-400" />
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('statisticsPage.usersByRole')}</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={dataParRole} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label animationDuration={800}>
                                    {dataParRole.map((entry, index) => (
                                        <Cell key={index} fill={COULEURS[index % COULEURS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Inscriptions par mois */}
                <motion.div variants={fadeUp}>
                    <div className={`${panelClass} p-6`}>
                        <div className="flex items-center gap-2 mb-4">
                            <FiBarChart2 className="text-primary-600 dark:text-mint-400" />
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('statisticsPage.registrationsByMonth')}</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={dataParMois}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="total" fill="#4ADE80" radius={[6, 6, 0, 0]} animationDuration={800} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Cultures par type */}
                <motion.div variants={fadeUp}>
                    <div className={`${panelClass} p-6`}>
                        <div className="flex items-center gap-2 mb-4">
                            <FiPieChart className="text-primary-600 dark:text-mint-400" />
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('statisticsPage.cropsByType')}</h2>
                        </div>
                        {dataCultures.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-12">{t('statisticsPage.noData')}</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie data={dataCultures} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label animationDuration={800}>
                                        {dataCultures.map((entry, index) => (
                                            <Cell key={index} fill={COULEURS[index % COULEURS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Alertes par type */}
                <motion.div variants={fadeUp}>
                    <div className={`${panelClass} p-6`}>
                        <div className="flex items-center gap-2 mb-4">
                            <FiAlertTriangle className="text-primary-600 dark:text-mint-400" />
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('statisticsPage.alertsByType')}</h2>
                        </div>
                        {dataAlertes.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-12">{t('statisticsPage.noData')}</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={dataAlertes}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#dc2626" radius={[6, 6, 0, 0]} animationDuration={800} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* Signalements de prix abusifs */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible">
                <div className={`${panelClass} p-6`}>
                    <div className="flex items-center gap-2 mb-4">
                        <FiFlag className="text-primary-600 dark:text-mint-400" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('statisticsPage.priceReports')}</h2>
                        {signalements.length > 0 && (
                            <span className="text-xs px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full font-medium">
                                {signalements.length}
                            </span>
                        )}
                    </div>
                    {signalements.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">{t('statisticsPage.noPriceReports')}</p>
                    ) : (
                        <div className="space-y-2">
                            {signalements.map((s) => (
                                <div key={s.signalement_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                                            {s.marche_nom} ({s.prix_agricole} Ar) — {s.marche_localisation}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {t('statisticsPage.reportedBy')} {s.utilisateur_nom} : {s.signalement_raison}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleTraiterSignalement(s.signalement_id, 'traite')}
                                            className="p-2 bg-mint-50 dark:bg-mint-900/20 text-mint-700 dark:text-mint-400 rounded-lg hover:bg-mint-100 dark:hover:bg-mint-900/30"
                                        >
                                            <FiCheck />
                                        </button>
                                        <button
                                            onClick={() => handleTraiterSignalement(s.signalement_id, 'rejete')}
                                            className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Statistiques;
