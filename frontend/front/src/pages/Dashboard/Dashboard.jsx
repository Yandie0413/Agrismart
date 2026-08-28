import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getDashboard, getMesAlertesRegion, declencherAlerteRegionale } from '../../services/api';
import MascotteAssistant from '../../components/Mascotte/MascotteAssistant';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/UI/Card';
import Avatar from '../../components/UI/Avatar';
import AnimatedNumber from '../../components/UI/AnimatedNumber';
import CircularGauge from '../../components/UI/CircularGauge';
import {
    staggerContainer, fadeUp, completerSeptJours, SectionTitle,
    ActivityTimelineCard, DashboardAgriExpert
} from '../../components/Dashboard/Widgets';
import { FiMap, FiBook, FiAlertTriangle, FiTrendingUp, FiArrowRight, FiUserPlus, FiSend } from 'react-icons/fi';
import { GiFarmer } from 'react-icons/gi';
import { Link } from 'react-router-dom';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid
} from 'recharts';

const DONUT_COLORS = ['#2D6A4F', '#4ADE80', '#FFB703', '#8ccfa8', '#e5a400'];

/* ---------- Bandeau d'alertes critiques (agriculteur, filtre par region) ---------- */

const COULEUR_ALERTE = {
    gel: 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    canicule: 'bg-orange-50 border-orange-300 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300',
    secheresse: 'bg-orange-50 border-orange-300 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300',
    inondation: 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
    maladie: 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
};

const AlerteBanner = ({ alertes }) => (
    <div className="space-y-2">
        {alertes.map((a) => (
            <motion.div
                key={a.alerte_id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 border rounded-2xl px-4 py-3 text-sm ${COULEUR_ALERTE[a.alerte_type?.toLowerCase()] || 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'}`}
            >
                <FiAlertTriangle className="mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-semibold capitalize">
                        {a.alerte_region ? `${a.alerte_type} — ${a.alerte_region}` : a.alerte_type}
                    </p>
                    <p className="text-xs mt-0.5 opacity-90">{a.alerte_message}</p>
                </div>
            </motion.div>
        ))}
    </div>
);

/* ---------- Formulaire "declencher une alerte regionale" (expert/admin) ---------- */

const FormulaireAlerteRegionale = ({ t }) => {
    const [ouvert, setOuvert] = useState(false);
    const [region, setRegion] = useState('');
    const [typeMenace, setTypeMenace] = useState('');
    const [recommandation, setRecommandation] = useState('');
    const [envoi, setEnvoi] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEnvoi(true);
        setMessage('');
        try {
            const res = await declencherAlerteRegionale({ region, type_menace: typeMenace, recommandation });
            setMessage(res.data.message);
            setRegion(''); setTypeMenace(''); setRecommandation('');
        } catch (err) {
            setMessage(err.response?.data?.message || t('dashboard.regionalAlertError'));
        } finally {
            setEnvoi(false);
        }
    };

    return (
        <motion.div variants={fadeUp} className="h-full">
            <Card className="p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                    <SectionTitle icon={<FiAlertTriangle className="text-amber-500" />}>{t('dashboard.regionalAlertTitle')}</SectionTitle>
                    <button onClick={() => setOuvert((v) => !v)} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                        {ouvert ? t('dashboard.close') : t('dashboard.regionalAlertOpen')}
                    </button>
                </div>
                {ouvert && (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {message && <p className="text-xs text-primary-600 dark:text-primary-400">{message}</p>}
                        <input
                            type="text" required value={region} onChange={(e) => setRegion(e.target.value)}
                            placeholder={t('dashboard.regionalAlertRegionPlaceholder')}
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                            type="text" required value={typeMenace} onChange={(e) => setTypeMenace(e.target.value)}
                            placeholder={t('dashboard.regionalAlertTypePlaceholder')}
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <textarea
                            required value={recommandation} onChange={(e) => setRecommandation(e.target.value)}
                            placeholder={t('dashboard.regionalAlertRecommendationPlaceholder')}
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                            type="submit" disabled={envoi}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-mint-400 dark:hover:bg-mint-300 text-white dark:text-forest-950 rounded-xl text-sm font-medium disabled:opacity-50"
                        >
                            <FiSend /> {envoi ? t('dashboard.regionalAlertSending') : t('dashboard.regionalAlertSend')}
                        </button>
                    </form>
                )}
            </Card>
        </motion.div>
    );
};

/* ---------- Dashboard administrateur (maquette "Coinest") ---------- */

const StatCardTrend = ({ icon, label, value, deltaLabel }) => (
    <motion.div variants={fadeUp}>
        <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-mint-400">
                    {icon}
                </div>
                {deltaLabel && (
                    <span className="text-[11px] font-semibold text-primary-600 dark:text-mint-300 bg-primary-50 dark:bg-mint-400/10 px-2 py-0.5 rounded-full">
                        {deltaLabel}
                    </span>
                )}
            </div>
            <p className="text-3xl sm:text-4xl font-display font-extrabold text-gray-800 dark:text-white tabular-nums"><AnimatedNumber value={value ?? 0} /></p>
            <p className="text-xs text-gray-500 dark:text-white/40 mt-1">{label}</p>
        </Card>
    </motion.div>
);

const ScoreBarCard = ({ title, pct, quality }) => (
    <motion.div variants={fadeUp} className="h-full">
        <Card className="p-6 h-full flex flex-col items-center text-center">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 self-start">{title}</p>
            <CircularGauge pct={pct} size={140} strokeWidth={13} value={`${pct}%`} sublabel={quality} />
        </Card>
    </motion.div>
);

const ActivityAreaCard = ({ title, data, label1, label2 }) => (
    <motion.div variants={fadeUp} className="h-full">
        <Card className="p-6 h-full">
            <SectionTitle icon={<FiTrendingUp className="text-primary-600 dark:text-primary-400" />}>{title}</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorInscriptions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorAlertes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FFB703" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#FFB703" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeOpacity={0.1} vertical={false} />
                    <XAxis dataKey="jour" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                    <Area type="monotone" dataKey="inscriptions" name={label1} stroke="#2D6A4F" fill="url(#colorInscriptions)" strokeWidth={2} />
                    <Area type="monotone" dataKey="alertes" name={label2} stroke="#FFB703" fill="url(#colorAlertes)" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    </motion.div>
);

const DonutCard = ({ title, data }) => {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    return (
        <motion.div variants={fadeUp} className="h-full">
            <Card className="p-6 h-full">
                <SectionTitle>{title}</SectionTitle>
                <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={62} paddingAngle={3}>
                            {data.map((entry, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                    {data.map((d, i) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300 capitalize">
                                <span className="w-2 h-2 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                                {d.name}
                            </span>
                            <span className="font-semibold text-gray-800 dark:text-white">{Math.round((d.value / total) * 100)}%</span>
                        </div>
                    ))}
                </div>
            </Card>
        </motion.div>
    );
};

const OverviewCard = ({ title, total, totalLabel, tiles }) => (
    <motion.div variants={fadeUp} className="h-full">
        <Card className="p-6 h-full">
            <SectionTitle>{title}</SectionTitle>
            <p className="text-2xl font-bold text-gray-800 dark:text-white"><AnimatedNumber value={total ?? 0} /></p>
            <p className="text-xs text-gray-400 mb-4">{totalLabel}</p>
            <div className="space-y-2">
                {tiles.map((tile) => (
                    <div key={tile.label} className="flex items-center justify-between bg-primary-50/60 dark:bg-white/5 rounded-xl px-3 py-2.5">
                        <span className="text-xs text-gray-600 dark:text-gray-300 capitalize truncate">{tile.label}</span>
                        <span className="text-xs font-bold text-primary-700 dark:text-primary-300 flex-shrink-0">{tile.value}</span>
                    </div>
                ))}
            </div>
        </Card>
    </motion.div>
);

const RecentUsersTable = ({ title, users, t }) => (
    <motion.div variants={fadeUp} className="h-full">
        <Card className="p-6 h-full overflow-x-auto">
            <SectionTitle
                action={<Link to="/utilisateurs" className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">{t('dashboard.viewAll')} <FiArrowRight className="text-xs" /></Link>}
            >{title}</SectionTitle>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-white/10">
                        <th className="pb-2 font-medium">{t('dashboard.colName')}</th>
                        <th className="pb-2 font-medium">{t('dashboard.colRole')}</th>
                        <th className="pb-2 font-medium hidden sm:table-cell">{t('dashboard.colDate')}</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.utilisateur_id} className="border-b border-gray-50 dark:border-white/5 last:border-0">
                            <td className="py-2.5 font-medium text-gray-800 dark:text-white truncate max-w-[140px]">{u.utilisateur_nom}</td>
                            <td className="py-2.5">
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 capitalize">
                                    {u.utilisateur_role}
                                </span>
                            </td>
                            <td className="py-2.5 text-gray-400 text-xs hidden sm:table-cell">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr><td colSpan={3} className="py-6 text-center text-gray-400 text-xs">—</td></tr>
                    )}
                </tbody>
            </table>
        </Card>
    </motion.div>
);

// Petite jauge circulaire inline (remplace les barres de progression empilees)
const MiniRing = ({ pct, size = 34, strokeWidth = 4 }) => {
    const r = (size - strokeWidth) / 2;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-100 dark:text-white/10" />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={offset} transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className="text-primary-600 dark:text-mint-400"
            />
        </svg>
    );
};

const ProgressListCard = ({ title, items }) => {
    const max = Math.max(1, ...items.map((i) => i.value));
    return (
        <motion.div variants={fadeUp} className="h-full">
            <Card className="p-6 h-full">
                <SectionTitle>{title}</SectionTitle>
                <div className="space-y-3">
                    {items.map((item, idx) => {
                        const pct = Math.round((item.value / max) * 100);
                        return (
                            <div key={item.label} className="flex items-center gap-3">
                                <span className="text-xs font-display font-bold text-gray-300 dark:text-white/25 w-4 flex-shrink-0">{idx + 1}</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize truncate flex-1">{item.label}</span>
                                <span className="text-xs text-gray-400 flex-shrink-0">{item.value}</span>
                                <MiniRing pct={pct} />
                            </div>
                        );
                    })}
                    {items.length === 0 && <p className="text-xs text-gray-400">—</p>}
                </div>
            </Card>
        </motion.div>
    );
};

const DashboardAdmin = ({ data, t }) => {
    const evolution = completerSeptJours(data.evolution).map((d, i) => ({
        jour: d.jour,
        inscriptions: d.valeur,
        alertes: completerSeptJours(data.evolution_alertes)[i]?.valeur || 0
    }));
    const nouveauxCetteSemaine = evolution.reduce((s, d) => s + d.inscriptions, 0);

    const pctCulturesActives = data.total_cultures > 0
        ? Math.round((data.cultures_actives / data.total_cultures) * 100)
        : 0;
    const scoreQuality = pctCulturesActives >= 70 ? t('dashboard.scoreQualityExcellent')
        : pctCulturesActives >= 40 ? t('dashboard.scoreQualityGood')
        : t('dashboard.scoreQualityAverage');

    const donutData = [
        { name: t('dashboard.farmersLabel'), value: data.total_agriculteurs || 0 },
        { name: t('dashboard.expertsLabel'), value: data.total_experts || 0 },
    ];

    const timelineItems = [
        ...(data.derniers_utilisateurs || []).map((u) => ({
            icon: <FiUserPlus />,
            texte: t('dashboard.activityNewUser', { name: u.utilisateur_nom }),
            date: new Date(u.created_at)
        })),
        ...(data.dernieres_alertes || []).map((a) => ({
            icon: <FiAlertTriangle />,
            texte: t('dashboard.activityNewAlert', { type: a.alerte_type }),
            date: new Date(a.alerte_date)
        })),
        ...(data.derniers_conseils || []).map((c) => ({
            icon: <FiBook />,
            texte: t('dashboard.activityNewAdvice', { title: c.conseil_titre }),
            date: new Date(c.conseil_date_publication)
        })),
    ].sort((a, b) => b.date - a.date);

    return (
        <div className="space-y-4">
            {/* Ligne 1 : 4 stats en 2x2 + score */}
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                    <StatCardTrend icon={<GiFarmer />} label={t('dashboard.farmersLabel')} value={data.total_agriculteurs} deltaLabel={`+${nouveauxCetteSemaine}`} />
                    <StatCardTrend icon={<FiMap />} label={t('dashboard.exploitations')} value={data.total_exploitations} />
                    <StatCardTrend icon={<FiBook />} label={t('dashboard.expertsLabel')} value={data.total_experts} />
                    <StatCardTrend icon={<FiAlertTriangle />} label={t('dashboard.activeAlerts')} value={data.alertes_actives} />
                </div>
                <ScoreBarCard title={t('dashboard.scoreTitle')} pct={pctCulturesActives} quality={scoreQuality} />
            </motion.div>

            {/* Ligne 2 : activite + repartition + vue d'ensemble */}
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                    <ActivityAreaCard title={t('dashboard.activityTitle')} data={evolution} label1={t('dashboard.newRegistrations')} label2={t('dashboard.alertsSeries')} />
                </div>
                <DonutCard title={t('dashboard.usersBreakdown')} data={donutData} />
                <OverviewCard
                    title={t('dashboard.overviewTitle')}
                    total={data.total_exploitations}
                    totalLabel={t('dashboard.exploitations')}
                    tiles={[
                        { label: t('dashboard.cultures'), value: data.total_cultures },
                        { label: t('dashboard.totalUsers'), value: data.total_utilisateurs },
                    ]}
                />
            </motion.div>

            {/* Ligne 3 : derniers utilisateurs + cultures + activites */}
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                    <RecentUsersTable title={t('dashboard.recentUsersTitle')} users={data.derniers_utilisateurs || []} t={t} />
                </div>
                <ProgressListCard
                    title={t('dashboard.topCropsTitle')}
                    items={(data.cultures_par_type || []).map((c) => ({ label: c.culture_type, value: c.total }))}
                />
                <ActivityTimelineCard title={t('dashboard.activitiesTitle')} items={timelineItems} />
            </motion.div>
        </div>
    );
};

/* ---------- Composant principal ---------- */

const Dashboard = () => {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alertesRegion, setAlertesRegion] = useState([]);
    const { utilisateur } = useAuth();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await getDashboard();
                setData(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    useEffect(() => {
        if (utilisateur?.role === 'agriculteur') {
            getMesAlertesRegion()
                .then((res) => setAlertesRegion(res.data.data))
                .catch((err) => console.error(err));
        }
    }, [utilisateur?.role]);

    if (loading || !data) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    const derniereAlerteMeteo = data?.dernieres_alertes?.find(
        (a) => a.alerte_type?.toLowerCase().includes('meteo')
    );
    const meteoResume = derniereAlerteMeteo?.alerte_message || null;
    const conseilDuJour = data?.derniers_conseils?.[0]?.conseil_titre || null;
    const nbNotifications = data?.dernieres_alertes?.length ?? data?.messages_non_lus ?? 0;

    const initiales = utilisateur?.nom
        ? utilisateur.nom.split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long'
    });

    return (
        <div className="space-y-6">

            {utilisateur?.role === 'agriculteur' && alertesRegion.length > 0 && (
                <AlerteBanner alertes={alertesRegion} />
            )}

            <MascotteAssistant
                role={utilisateur?.role}
                prenom={utilisateur?.nom}
                meteoResume={meteoResume}
                conseilDuJour={conseilDuJour}
                nbNotifications={nbNotifications}
            />

            {/* Header : salutation personnalisee (la cloche de notification vit dans la Navbar) */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-4"
            >
                <Avatar utilisateur={utilisateur} className="w-14 h-14 text-lg shadow-md" />
                <div>
                    <h1 className="font-serif text-2xl font-semibold text-gray-800 dark:text-white">
                        {t('dashboard.greeting', { name: utilisateur?.nom?.split(' ')[0] || initiales })}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm capitalize">{dateAujourdhui}</p>
                </div>
            </motion.div>

            {utilisateur?.role === 'administrateur' ? (
                <DashboardAdmin data={data} t={t} />
            ) : (
                <DashboardAgriExpert data={data} utilisateur={utilisateur} t={t} />
            )}

            {(utilisateur?.role === 'expert' || utilisateur?.role === 'administrateur') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormulaireAlerteRegionale t={t} />
                </div>
            )}
        </div>
    );
};

export default Dashboard;
