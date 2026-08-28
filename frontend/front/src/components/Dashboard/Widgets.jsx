import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { FiArrowRight, FiCheckCircle, FiCircle, FiMap, FiBook, FiMessageSquare, FiShoppingCart } from 'react-icons/fi';
import { GiPlantSeed } from 'react-icons/gi';
import Card from '../UI/Card';
import Avatar from '../UI/Avatar';
import CircularGauge from '../UI/CircularGauge';
import Timeline from '../UI/Timeline';

export const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};
export const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// Complete les 7 derniers jours avec des zeros pour les jours sans donnee,
// afin d'avoir toujours un axe temporel complet (pas de trous dans le graphique).
export const completerSeptJours = (lignes = [], cleValeur = 'total') => {
    const parJour = {};
    lignes.forEach((l) => { parJour[l.jour?.slice(0, 10)] = l[cleValeur]; });
    const resultat = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        resultat.push({
            jour: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
            valeur: parJour[iso] || 0
        });
    }
    return resultat;
};

export const SectionTitle = ({ icon, children, action }) => (
    <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
            {icon} {children}
        </h2>
        {action}
    </div>
);

export const ActivityTimelineCard = ({ title, items }) => (
    <motion.div variants={fadeUp} className="h-full">
        <Card className="p-6 h-full">
            <SectionTitle>{title}</SectionTitle>
            <Timeline
                items={items.slice(0, 7).map((item) => ({
                    status: 'done',
                    title: item.texte,
                    meta: item.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                }))}
            />
        </Card>
    </motion.div>
);

/* ---------- Blocs "Crextio" (agriculteur / expert) ---------- */

// Indicateur discret en ligne (remplace l'ancienne barre de progression horizontale) :
// libelle en majuscules discretes + grand chiffre tabulaire, separe par de fines lignes.
const TopBadge = ({ label, pct }) => (
    <motion.div variants={fadeUp} className="flex-1 min-w-[110px] px-5 first:pl-0 border-l border-gray-100 dark:border-white/10 first:border-l-0">
        <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 dark:text-white/40 mb-1.5 truncate">{label}</p>
        <p className="text-2xl font-display font-bold text-gray-800 dark:text-white tabular-nums">{pct}%</p>
    </motion.div>
);

const ProfileCard = ({ utilisateur, metricLabel, metricValue }) => (
    <motion.div variants={fadeUp} className="h-full">
        <Card className="p-6 h-full flex flex-col items-center text-center">
            <Avatar utilisateur={utilisateur} className="w-20 h-20 text-2xl mb-4 ring-4 ring-primary-50 dark:ring-white/5" />
            <p className="font-semibold text-gray-800 dark:text-white truncate w-full">{utilisateur?.nom}</p>
            <p className="text-xs text-gray-400 capitalize mb-4">{utilisateur?.role}</p>
            <span className="mt-auto px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 rounded-full text-xs font-semibold">
                {metricLabel} · {metricValue}
            </span>
        </Card>
    </motion.div>
);

const WeeklyBarsCard = ({ title, data, valueLabel }) => (
    <motion.div variants={fadeUp} className="h-full">
        <Card className="p-6 h-full">
            <SectionTitle>{title}</SectionTitle>
            <p className="text-lg font-bold text-gray-800 dark:text-white mb-1">{valueLabel}</p>
            <ResponsiveContainer width="100%" height={130}>
                <BarChart data={data}>
                    <XAxis dataKey="jour" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                    <Bar dataKey="valeur" fill="#2D6A4F" radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </Card>
    </motion.div>
);

const GaugeCard = ({ title, pct, centerValue, centerLabel, sublabel }) => (
    <motion.div variants={fadeUp} className="h-full">
        <Card className="p-6 h-full flex flex-col items-center text-center">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 self-start">{title}</p>
            <CircularGauge pct={pct} size={128} strokeWidth={11} value={centerValue} sublabel={centerLabel} />
            {sublabel && <p className="text-xs text-gray-400 mt-3">{sublabel}</p>}
        </Card>
    </motion.div>
);

const ChecklistCard = ({ title, items }) => {
    const done = items.filter((i) => i.done).length;
    return (
        <motion.div variants={fadeUp} className="h-full">
            <Card className="p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{done}/{items.length}</span>
                </div>
                <div className="space-y-3">
                    {items.map((it) => (
                        <div key={it.label} className="flex items-center gap-2 text-sm">
                            {it.done ? <FiCheckCircle className="text-primary-600 dark:text-primary-400 flex-shrink-0" /> : <FiCircle className="text-gray-300 flex-shrink-0" />}
                            <span className={it.done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}>{it.label}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </motion.div>
    );
};

const QuickLinksCard = ({ title, items }) => (
    <motion.div variants={fadeUp} className="h-full">
        <Card className="p-6 h-full">
            <SectionTitle>{title}</SectionTitle>
            <div className="space-y-1">
                {items.map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-xl hover:bg-primary-50 dark:hover:bg-white/5 transition-colors group"
                    >
                        <span className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm flex-shrink-0">
                            {item.icon}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.label}</span>
                        <FiArrowRight className="ml-auto text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </Link>
                ))}
            </div>
        </Card>
    </motion.div>
);

// Action culturale suggeree selon le stade de croissance courant (calendrier agricole simplifie)
const ACTION_PAR_STADE = {
    Germination: 'stageActionGermination',
    Croissance: 'stageActionCroissance',
    Floraison: 'stageActionFloraison',
    Recolte: 'stageActionRecolte',
};

const UpcomingEventsCard = ({ title, cultures, t }) => {
    const prochaines = [...cultures]
        .filter((c) => c.stade_culture !== 'Recolte')
        .map((c) => ({ ...c, joursRestants: Math.max(0, 180 - c.jours_depuis_plantation) }))
        .sort((a, b) => a.joursRestants - b.joursRestants)
        .slice(0, 6);
    const minJours = prochaines.length > 0 ? prochaines[0].joursRestants : null;

    return (
        <motion.div variants={fadeUp} className="h-full">
            <Card className="p-6 h-full">
                <SectionTitle>{title}</SectionTitle>
                <Timeline
                    emptyLabel={t('dashboard.noCropsYet')}
                    items={prochaines.map((c) => {
                        const cleAction = ACTION_PAR_STADE[c.stade_culture];
                        const sousTitre = cleAction
                            ? `${c.exploitation_nom} · ${c.stade_culture} · ${t(`dashboard.${cleAction}`)}`
                            : `${c.exploitation_nom} · ${c.stade_culture}`;
                        return {
                            status: c.joursRestants === minJours ? 'current' : 'upcoming',
                            title: c.culture_type,
                            subtitle: sousTitre,
                            meta: t('dashboard.daysLeft', { count: c.joursRestants }),
                        };
                    })}
                />
            </Card>
        </motion.div>
    );
};

// Vue detaillee "Crextio" complete pour un agriculteur ou un expert : reutilisee telle
// quelle sur le propre Dashboard de l'utilisateur ET sur la fiche detail cote admin
// (page Utilisateurs), alimentee soit par ses propres donnees, soit par celles d'un
// utilisateur cible recuperees via /profil/utilisateurs/:id/detail.
export const DashboardAgriExpert = ({ data, utilisateur, t }) => {
    const estAgriculteur = utilisateur?.role === 'agriculteur';
    const toutesCultures = data.toutes_cultures || [];
    const culturesActives = toutesCultures.filter((c) => c.stade_culture !== 'Recolte');
    const pctCulturesActives = toutesCultures.length > 0
        ? Math.round((culturesActives.length / toutesCultures.length) * 100)
        : 0;
    const pctExploitationsActives = data.total_exploitations > 0
        ? Math.round((new Set(culturesActives.map((c) => c.exploitation_nom)).size / data.total_exploitations) * 100)
        : 0;
    const pctReponse = data.messages_recus > 0
        ? Math.round(((data.messages_recus - data.messages_non_lus) / data.messages_recus) * 100)
        : 0;
    const pctObjectifConseils = Math.min(100, Math.round(((data.total_conseils || 0) / 10) * 100));

    const checklistItems = estAgriculteur ? [
        { label: t('dashboard.stepAddFarm'), done: data.total_exploitations > 0 },
        { label: t('dashboard.stepAddCrop'), done: data.total_cultures > 0 },
        { label: t('dashboard.stepContactExpert'), done: !!data.a_envoye_message },
        { label: t('dashboard.stepPhoto'), done: !!utilisateur?.photo },
    ] : [
        { label: t('dashboard.stepPhoto'), done: !!utilisateur?.photo },
        { label: t('dashboard.stepPublishAdvice'), done: (data.total_conseils || 0) > 0 },
        { label: t('dashboard.stepReply'), done: !!data.a_envoye_message },
    ];
    const doneCount = checklistItems.filter((i) => i.done).length;
    const pctChecklist = Math.round((doneCount / checklistItems.length) * 100);

    const badges = estAgriculteur ? [
        { label: t('dashboard.badgeCropsActive'), pct: pctCulturesActives },
        { label: t('dashboard.badgeFarmsActive'), pct: pctExploitationsActives },
        { label: t('dashboard.nextSteps'), pct: pctChecklist },
    ] : [
        { label: t('dashboard.badgeMonthlyGoal'), pct: pctObjectifConseils },
        { label: t('dashboard.responseRate'), pct: pctReponse },
        { label: t('dashboard.nextSteps'), pct: pctChecklist },
    ];

    const weeklyData = completerSeptJours(data.evolution);

    let joursProchaineRecolte = null;
    if (estAgriculteur && culturesActives.length > 0) {
        joursProchaineRecolte = Math.min(...culturesActives.map((c) => Math.max(0, 180 - c.jours_depuis_plantation)));
    }

    const quickLinksParRole = {
        agriculteur: [
            { icon: <FiMap />, label: t('dashboard.actionMyFarms'), to: '/exploitations' },
            { icon: <FiBook />, label: t('dashboard.actionAdvice'), to: '/conseils' },
            { icon: <FiMessageSquare />, label: t('dashboard.actionContactExpert'), to: '/messages' },
            { icon: <GiPlantSeed />, label: t('dashboard.actionMap'), to: '/localisation' },
        ],
        expert: [
            { icon: <FiBook />, label: t('dashboard.actionPublishAdvice'), to: '/conseils' },
            { icon: <FiMessageSquare />, label: t('dashboard.actionMyMessages'), to: '/messages' },
            { icon: <FiShoppingCart />, label: t('dashboard.actionMarkets'), to: '/marches' },
        ],
    };
    const quickLinks = quickLinksParRole[utilisateur?.role] || [];

    return (
        <div className="space-y-4">
            {/* Ligne d'indicateurs discrets (remplace les anciennes barres de progression) */}
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-3 bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm px-5 py-5">
                {badges.map((b) => <TopBadge key={b.label} {...b} />)}
            </motion.div>

            {/* Ligne principale : profil / activite / jauge / checklist */}
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ProfileCard
                    utilisateur={utilisateur}
                    metricLabel={estAgriculteur ? t('dashboard.exploitations') : t('dashboard.publishedAdvice')}
                    metricValue={estAgriculteur ? data.total_exploitations : data.total_conseils}
                />
                <WeeklyBarsCard
                    title={t('dashboard.weeklyActivity')}
                    data={weeklyData}
                    valueLabel={`${weeklyData.reduce((s, d) => s + d.valeur, 0)} ${estAgriculteur ? t('dashboard.cultures') : t('dashboard.publishedAdvice')}`}
                />
                {estAgriculteur ? (
                    <GaugeCard
                        title={t('dashboard.nextHarvest')}
                        pct={joursProchaineRecolte !== null ? Math.round(((180 - joursProchaineRecolte) / 180) * 100) : 0}
                        centerValue={joursProchaineRecolte !== null ? joursProchaineRecolte : '—'}
                        centerLabel={joursProchaineRecolte !== null ? t('dashboard.daysLeftShort') : null}
                        sublabel={joursProchaineRecolte === null ? t('dashboard.noCropsYet') : null}
                    />
                ) : (
                    <GaugeCard
                        title={t('dashboard.responseRate')}
                        pct={pctReponse}
                        centerValue={`${pctReponse}%`}
                        sublabel={t('dashboard.unreadMessages') + ' : ' + (data.messages_non_lus || 0)}
                    />
                )}
                <ChecklistCard title={t('dashboard.nextSteps')} items={checklistItems} />
            </motion.div>

            {/* Ligne secondaire : liens rapides + calendrier / derniers conseils */}
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <QuickLinksCard title={t('dashboard.quickActions')} items={quickLinks} />
                <div className="lg:col-span-2">
                    {estAgriculteur ? (
                        <UpcomingEventsCard title={t('dashboard.upcomingEvents')} cultures={toutesCultures} t={t} />
                    ) : (
                        <ActivityTimelineCard
                            title={t('dashboard.recentAdvice')}
                            items={(data.derniers_conseils || []).map((c) => ({
                                icon: <FiBook />,
                                texte: c.conseil_titre,
                                date: new Date(c.conseil_date_publication)
                            }))}
                        />
                    )}
                </div>
            </motion.div>
        </div>
    );
};
