import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getMeteoTempsReel, getPrevisions, getPrevisionsAvancees, getAlertes } from '../../services/api';
import {
    FiSun, FiCloud, FiCloudRain, FiWind, FiDroplet,
    FiAlertTriangle, FiSearch, FiThermometer, FiEye,
    FiRefreshCw, FiCheckCircle, FiActivity, FiCalendar
} from 'react-icons/fi';

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const getIconeMeteo = (description = '', taille = 'text-6xl') => {
    const d = description.toLowerCase();
    if (d.includes('pluie') || d.includes('rain') || d.includes('drizzle') || d.includes('bruine'))
        return <FiCloudRain className={`${taille} text-blue-400 dark:text-blue-300`} />;
    if (d.includes('nuage') || d.includes('cloud') || d.includes('couvert') || d.includes('overcast'))
        return <FiCloud className={`${taille} text-gray-400 dark:text-gray-300`} />;
    if (d.includes('orage') || d.includes('thunder') || d.includes('storm'))
        return <FiCloudRain className={`${taille} text-purple-400 dark:text-purple-300`} />;
    return <FiSun className={`${taille} text-mint-500 dark:text-mint-400`} />;
};

const getJourSemaine = (dtTxt) => {
    const date = new Date(dtTxt);
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
};

// Arc/aiguille en demi-cercle (jauge type cadran d'instrument, cf. mockup "almanach du cultivateur")
const arcPoint = (cx, cy, r, angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
};

const RiskDial = ({ label, valeur = 0 }) => {
    const v = Math.max(0, Math.min(100, Math.round(valeur)));
    const cx = 32, cy = 36, r = 28;
    const start = arcPoint(cx, cy, r, 180);
    const end = arcPoint(cx, cy, r, 180 - (v / 100) * 180);
    const needle = arcPoint(cx, cy, 20, 180 - (v / 100) * 180);
    const strokeClass = v >= 70 ? 'stroke-red-500 dark:stroke-red-400' : v >= 40 ? 'stroke-amber-500 dark:stroke-amber-400' : 'stroke-mint-500 dark:stroke-mint-400';
    const textClass = v >= 70 ? 'text-red-500 dark:text-red-400' : v >= 40 ? 'text-amber-500 dark:text-amber-400' : 'text-mint-600 dark:text-mint-400';
    return (
        <div className="flex flex-col items-center gap-1.5">
            <svg width="72" height="46" viewBox="0 0 64 40">
                <path d="M4 36 A28 28 0 0 1 60 36" fill="none" className="stroke-gray-100 dark:stroke-white/10" strokeWidth="5" />
                {v > 0 && (
                    <path
                        d={`M${start.x.toFixed(1)} ${start.y.toFixed(1)} A28 28 0 0 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`}
                        fill="none" className={strokeClass} strokeWidth="5" strokeLinecap="round"
                    />
                )}
                <line x1={cx} y1={cy} x2={needle.x.toFixed(1)} y2={needle.y.toFixed(1)} className="stroke-gray-600 dark:stroke-white/60" strokeWidth="1.6" />
                <circle cx={cx} cy={cy} r="2.2" className="fill-gray-600 dark:fill-white/60" />
            </svg>
            <p className="text-xs text-gray-400 text-center max-w-[9ch]">{label}</p>
            <p className={`text-sm font-bold font-mono ${textClass}`}>{v}%</p>
        </div>
    );
};

const Thermometer = ({ value = 20 }) => {
    const clamped = Math.max(0, Math.min(40, value));
    const fillHeight = (clamped / 40) * 84;
    const topY = 96 - fillHeight;
    return (
        <svg width="24" height="104" viewBox="0 0 30 120" className="flex-shrink-0 hidden sm:block">
            <rect x="12" y="6" width="6" height="94" rx="3" className="fill-gray-100 dark:fill-white/10" />
            <rect x="12" y={topY} width="6" height={fillHeight} rx="3" className="fill-mint-400" />
            <circle cx="15" cy="106" r="9" className="fill-mint-400" />
            <g className="stroke-gray-300 dark:stroke-white/20" strokeWidth="1">
                <line x1="6" y1="16" x2="12" y2="16" /><line x1="6" y1="36" x2="12" y2="36" />
                <line x1="6" y1="56" x2="12" y2="56" /><line x1="6" y1="76" x2="12" y2="76" /><line x1="6" y1="96" x2="12" y2="96" />
            </g>
            <text x="0" y="19" fontSize="7" className="fill-gray-400">40°</text>
            <text x="0" y="99" fontSize="7" className="fill-gray-400">0°</text>
        </svg>
    );
};

const getAlerteStyle = (type = '') => {
    const t = type.toLowerCase();
    if (t === 'canicule') return { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'text-red-400', badge: 'bg-red-500/20 text-red-300' };
    if (t === 'gel') return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' };
    if (t === 'secheresse') return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' };
    if (t === 'inondation') return { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300' };
    if (t === 'maladie') return { bg: 'bg-mint-500/10', border: 'border-mint-500/20', icon: 'text-mint-400', badge: 'bg-mint-500/20 text-mint-300' };
    return { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'text-red-400', badge: 'bg-red-500/20 text-red-300' };
};

const extrairePrevisionsJournalieres = (liste = []) => {
    const parJour = {};
    liste.forEach((item) => {
        const dateStr = (item.date || '').split(' ')[0];
        if (!dateStr) return;
        if (!parJour[dateStr]) parJour[dateStr] = [];
        parJour[dateStr].push(item);
    });
    return Object.entries(parJour).slice(0, 5).map(([date, items]) => {
        const milieu = items[Math.floor(items.length / 2)];
        return {
            date,
            jour: getJourSemaine(milieu.date),
            temperature: Math.round(milieu.temperature),
            temp_min: Math.round(Math.min(...items.map(i => i.temp_min ?? i.temperature))),
            temp_max: Math.round(Math.max(...items.map(i => i.temp_max ?? i.temperature))),
            description: milieu.description || '',
            humidite: milieu.humidite,
        };
    });
};

const Meteo = () => {
    const { t } = useTranslation();
    const [ville, setVille] = useState('Antananarivo');
    const [villeInput, setVilleInput] = useState('Antananarivo');
    const [meteo, setMeteo] = useState(null);
    const [previsions, setPrevisions] = useState([]);
    const [previsionsAvancees, setPrevisionsAvancees] = useState([]);
    const [alertes, setAlertes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingPrev, setLoadingPrev] = useState(false);
    const [erreurMeteo, setErreurMeteo] = useState('');
    const [lastUpdate, setLastUpdate] = useState(null);

    const fetchMeteo = useCallback(async (villeRecherche) => {
        setLoading(true);
        setErreurMeteo('');
        try {
            const res = await getMeteoTempsReel(villeRecherche);
            setMeteo(res.data.data);
            setLastUpdate(new Date());
        } catch (err) {
            setErreurMeteo(t('weather.cityNotFound'));
            setMeteo(null);
        } finally {
            setLoading(false);
        }
    }, [t]);

    const fetchPrevisions = useCallback(async (villeRecherche) => {
        setLoadingPrev(true);
        try {
            const res = await getPrevisions(villeRecherche);
            const liste = res.data.data || [];
            if (Array.isArray(liste)) {
                setPrevisions(extrairePrevisionsJournalieres(liste));
            }
        } catch (err) {
            console.error('Prévisions indisponibles', err);
            setPrevisions([]);
        } finally {
            setLoadingPrev(false);
        }
    }, []);

    const fetchPrevisionsAvancees = useCallback(async (villeRecherche) => {
        try {
            const res = await getPrevisionsAvancees(villeRecherche);
            setPrevisionsAvancees(res.data.data || []);
        } catch (err) {
            console.error('Previsions avancees indisponibles', err);
            setPrevisionsAvancees([]);
        }
    }, []);

    const fetchAlertes = useCallback(async () => {
        try {
            const res = await getAlertes();
            setAlertes(res.data.data || []);
        } catch (err) {
            console.error('Alertes indisponibles', err);
        }
    }, []);

    useEffect(() => {
        fetchMeteo(ville);
        fetchPrevisions(ville);
        fetchPrevisionsAvancees(ville);
        fetchAlertes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!villeInput.trim()) return;
        setVille(villeInput.trim());
        fetchMeteo(villeInput.trim());
        fetchPrevisions(villeInput.trim());
        fetchPrevisionsAvancees(villeInput.trim());
    };

    const handleRefresh = () => {
        fetchMeteo(ville);
        fetchPrevisions(ville);
        fetchPrevisionsAvancees(ville);
        fetchAlertes();
    };

    const alertesActives = alertes.filter(a => a.alerte_statut === 'active');

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{t('weather.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        {t('weather.subtitle')}
                        {lastUpdate && (
                            <span className="ml-2 text-xs text-gray-400">
                                — {t('weather.updatedAt')} {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                type="text"
                                value={villeInput}
                                onChange={(e) => setVilleInput(e.target.value)}
                                className="pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-mint-400 text-sm w-44"
                                placeholder={t('weather.searchPlaceholder')}
                            />
                        </div>
                        <button type="submit" className="px-4 py-2.5 bg-forest-900 hover:bg-forest-800 dark:bg-mint-400 dark:hover:bg-mint-300 text-white dark:text-forest-950 rounded-xl transition-colors text-sm font-medium">
                            {t('weather.search')}
                        </button>
                    </form>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center h-72 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-mint-400"></div>
                        <p className="text-sm text-gray-400">{t('weather.loading')}</p>
                    </div>
                </div>
            ) : erreurMeteo ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
                    <FiCloud className="text-4xl text-red-400 mx-auto mb-3" />
                    <p className="text-red-700 dark:text-red-300 font-medium">{erreurMeteo}</p>
                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">{t('weather.tryCities')}</p>
                </div>
            ) : meteo && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-5"
                >

                    {/* Colonne principale : almanach du cultivateur — cadran/thermomètre + bandeau de prévisions */}
                    <div className="lg:col-span-2 space-y-5">
                        <div className="relative bg-white dark:bg-gray-800 border border-mint-100/70 dark:border-mint-400/10 rounded-3xl p-6 sm:p-8 overflow-hidden">
                            <span className="absolute top-4 right-4 sm:top-6 sm:right-6 font-mono text-[10px] uppercase tracking-wide text-mint-700 dark:text-mint-300 bg-mint-50 dark:bg-mint-400/10 px-2.5 py-1 rounded-full">
                                {t('weather.updatedAt')} {lastUpdate ? lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            <div className="flex items-center gap-5 sm:gap-8 pt-4 sm:pt-0">
                                <Thermometer value={meteo.temperature} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">{t('weather.title')}</p>
                                    <p className="font-serif text-lg font-semibold text-gray-800 dark:text-white -mt-0.5 truncate">{meteo.ville}</p>
                                    <div className="flex items-end gap-3 mt-2">
                                        <span className="text-5xl sm:text-6xl font-bold text-gray-800 dark:text-white leading-none">{Math.round(meteo.temperature)}°</span>
                                        <span className="text-sm text-gray-400 mb-1.5">{t('weather.feelsLike')} {Math.round(meteo.temperature_ressentie)}°</span>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-300 capitalize mt-2">{meteo.description}</p>
                                </div>
                                <div className="flex-shrink-0">{getIconeMeteo(meteo.description, 'text-6xl sm:text-7xl')}</div>
                            </div>
                        </div>

                        {/* Prevision journalieres, bandeau horizon */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700">
                            <p className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                                <FiCalendar /> {t('weather.forecast5days')}
                            </p>
                            {loadingPrev ? (
                                <div className="flex gap-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex-1 h-24 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-5 gap-2 divide-x divide-gray-100 dark:divide-gray-700">
                                    {previsions.map((jour, idx) => (
                                        <motion.div
                                            key={idx}
                                            variants={fadeUp}
                                            whileHover={{ scale: 1.06, y: -2 }}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-mint-50 dark:hover:bg-mint-900/10 transition-colors ${idx === 0 ? 'bg-mint-50/60 dark:bg-mint-400/5' : ''}`}
                                        >
                                            <p className="text-xs font-medium text-gray-400">
                                                {idx === 0 ? t('weather.today') : jour.jour}
                                            </p>
                                            {getIconeMeteo(jour.description, 'text-2xl')}
                                            <p className="text-sm font-bold font-mono text-gray-800 dark:text-white">{jour.temp_max}°</p>
                                            <p className="text-xs font-mono text-gray-400">{jour.temp_min}°</p>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                        {/* Conditions */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700">
                            <p className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                                <FiDroplet /> {t('weather.airConditions') || 'Conditions'}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-5">
                                <div>
                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                                        <FiThermometer className="text-sm" /> {t('weather.feelsLike')}
                                    </div>
                                    <p className="text-lg font-bold font-mono text-gray-800 dark:text-white">{Math.round(meteo.temperature_ressentie)}°</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                                        <FiWind className="text-sm" /> {t('weather.wind')}
                                    </div>
                                    <p className="text-lg font-bold font-mono text-gray-800 dark:text-white">{meteo.vitesse_vent} m/s</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                                        <FiDroplet className="text-sm" /> {t('weather.humidity')}
                                    </div>
                                    <p className="text-lg font-bold font-mono text-gray-800 dark:text-white">{meteo.humidite}%</p>
                                </div>
                                {meteo.visibilite !== undefined ? (
                                    <div>
                                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                                            <FiEye className="text-sm" /> {t('weather.visibility')}
                                        </div>
                                        <p className="text-lg font-bold font-mono text-gray-800 dark:text-white">
                                            {meteo.visibilite >= 1000 ? `${Math.round(meteo.visibilite / 1000)} km` : `${meteo.visibilite} m`}
                                        </p>
                                    </div>
                                ) : meteo.pression && (
                                    <div>
                                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                                            <FiThermometer className="text-sm" /> {t('weather.pressure')}
                                        </div>
                                        <p className="text-lg font-bold font-mono text-gray-800 dark:text-white">{meteo.pression} hPa</p>
                                    </div>
                                )}
                                {meteo.temperature_sol_estimee !== undefined && (
                                    <div>
                                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                                            <FiThermometer className="text-sm" /> {t('weather.soilTemperature')}
                                        </div>
                                        <p className="text-lg font-bold font-mono text-gray-800 dark:text-white">{meteo.temperature_sol_estimee}°</p>
                                    </div>
                                )}
                            </div>
                            {meteo.temperature_sol_estimation && (
                                <p className="text-[11px] text-gray-400 mt-4">{t('weather.soilTempEstimateNote')}</p>
                            )}
                        </div>

                        {/* Evapotranspiration (ET0) + cadrans de risque gel/secheresse, module 8.4 */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4">
                                <FiActivity className="text-mint-600 dark:text-mint-400" />
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('weather.evapotranspirationTitle')}</p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 items-center">
                                {typeof meteo.risque_gel === 'number' && (
                                    <RiskDial label={t('weather.frostRisk')} valeur={meteo.risque_gel} />
                                )}
                                {typeof meteo.risque_secheresse === 'number' && (
                                    <RiskDial label={t('weather.droughtRisk')} valeur={meteo.risque_secheresse} />
                                )}
                                {previsionsAvancees[0] && (
                                    <div className="col-span-2 sm:col-span-1 bg-mint-50/60 dark:bg-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                                        <p className="text-xs text-gray-400">{t('weather.et0Today')}</p>
                                        <p className="text-2xl font-bold font-mono text-gray-800 dark:text-white mt-1">
                                            {previsionsAvancees[0].et0_estime_mm} <span className="text-sm font-normal text-gray-400">{t('weather.et0Unit')}</span>
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-2">{t('weather.et0Note')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Colonne laterale : alertes climatiques */}
                    <div className="bg-forest-950 rounded-3xl p-6 text-white h-fit">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-serif font-semibold text-white">{t('weather.climateAlerts')}</h2>
                            {alertesActives.length > 0 && (
                                <span className="px-2.5 py-1 bg-red-500/20 text-red-300 text-xs font-medium rounded-full">
                                    {alertesActives.length} {t('weather.active')}{alertesActives.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        {alertes.length === 0 ? (
                            <div className="flex items-center gap-3 p-4 bg-mint-400/10 rounded-2xl">
                                <FiCheckCircle className="text-mint-400 text-xl flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-mint-300">{t('weather.noActiveAlert')}</p>
                                    <p className="text-xs text-white/40 mt-0.5">{t('weather.normalConditions')}</p>
                                </div>
                            </div>
                        ) : (
                            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-3">
                                {alertes.map((alerte) => {
                                    const style = getAlerteStyle(alerte.alerte_type);
                                    return (
                                        <motion.div key={alerte.alerte_id} variants={fadeUp} className={`flex items-start gap-3 p-4 ${style.bg} border ${style.border} rounded-2xl`}>
                                            <FiAlertTriangle className={`${style.icon} text-lg flex-shrink-0 mt-0.5`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-white capitalize">{alerte.alerte_type}</p>
                                                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{alerte.alerte_message}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default Meteo;
