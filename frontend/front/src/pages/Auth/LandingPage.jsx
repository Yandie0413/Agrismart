import bgHero from '../../assets/images/hero-champ.jpg';
import imgWeather from '../../assets/images/services/meteo.jpg';
import imgAdvice from '../../assets/images/services/conseils.jpg';
import imgMessage from '../../assets/images/services/message.jpg';
import imgMarket from '../../assets/images/services/marche.jpg';
import imgMap from '../../assets/images/services/cartographie.jpg';
import imgCalendar from '../../assets/images/services/calendrier.jpg';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    FiSun, FiMessageSquare, FiShoppingCart, FiBook,
    FiMapPin, FiCalendar, FiArrowRight, FiMenu, FiX,
    FiCheckCircle, FiDroplet, FiActivity
} from 'react-icons/fi';
import { GiFarmer, GiPlantSeed, GiWheat } from 'react-icons/gi';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { getStatistiquesPubliques } from '../../services/api';

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } }
};

const ScoreRing = ({ value }) => (
    <div
        className="relative w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: `conic-gradient(#2D6A4F ${value * 3.6}deg, #e2e8e4 0deg)` }}
    >
        <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
            <span className="text-[11px] font-bold text-forest-900">{value}%</span>
        </div>
    </div>
);

const LandingPage = () => {
    const { t } = useTranslation();
    const [menuOuvert, setMenuOuvert] = useState(false);
    const [statsReelles, setStatsReelles] = useState(null);

    useEffect(() => {
        getStatistiquesPubliques()
            .then((res) => setStatsReelles(res.data.data))
            .catch(() => setStatsReelles(null));
    }, []);

    const serviceColors = [
        'bg-primary-50 text-primary-600',
        'bg-mint-300/30 text-primary-700',
        'bg-accent-50 text-accent-600',
        'bg-primary-100 text-primary-700',
        'bg-mint-300/30 text-primary-700',
        'bg-accent-50 text-accent-600',
    ];

    const services = [
        { icone: <FiSun />, titre: t('landingPage.service1Title'), description: t('landingPage.service1Desc'), image: imgWeather },
        { icone: <FiBook />, titre: t('landingPage.service2Title'), description: t('landingPage.service2Desc'), image: imgAdvice },
        { icone: <FiMessageSquare />, titre: t('landingPage.service3Title'), description: t('landingPage.service3Desc'), image: imgMessage },
        { icone: <FiShoppingCart />, titre: t('landingPage.service4Title'), description: t('landingPage.service4Desc'), image: imgMarket },
        { icone: <FiMapPin />, titre: t('landingPage.service5Title'), description: t('landingPage.service5Desc'), image: imgMap },
        { icone: <FiCalendar />, titre: t('landingPage.service6Title'), description: t('landingPage.service6Desc'), image: imgCalendar },
    ];

    const statsBand = [
        { icone: <GiFarmer />, valeur: statsReelles?.total_agriculteurs ? `${statsReelles.total_agriculteurs}+` : '—', label: t('landingPage.statsBandLabel1') },
        { icone: <GiWheat />, valeur: statsReelles?.total_exploitations ? `${statsReelles.total_exploitations}+` : '—', label: t('landingPage.statsBandLabel2') },
        { icone: <FiBook />, valeur: statsReelles?.total_experts ? `${statsReelles.total_experts}+` : '—', label: t('landingPage.statsBandLabel3') },
        { icone: <FiActivity />, valeur: t('landingPage.statsBandValue4'), label: t('landingPage.statsBandLabel4') },
    ];

    return (
        <div className="min-h-screen bg-white font-sans overflow-x-hidden">

            {/* Header : logo a gauche, nav a droite, bouton plein (comme le modele) */}
            <header className="bg-white">
                <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <GiFarmer className="text-3xl text-primary-600" />
                        <div className="leading-tight">
                            <p className="font-display text-lg font-bold text-forest-900">AgriSmart</p>
                            <p className="text-[11px] text-forest-800/40">{t('landingPage.brandTagline')}</p>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-9">
                        <a href="#accueil" className="text-sm font-medium text-primary-600 border-b-2 border-primary-600 pb-1">{t('landingPage.navHome')}</a>
                        <a href="#apropos" className="text-sm font-medium text-forest-800/70 hover:text-primary-600 transition-colors">{t('landingPage.navHowItWorks')}</a>
                        <a href="#services" className="text-sm font-medium text-forest-800/70 hover:text-primary-600 transition-colors">{t('landingPage.navServices')}</a>
                        <Link to="/login" className="text-sm font-medium text-forest-800/70 hover:text-primary-600 transition-colors">{t('landingPage.navLogin')}</Link>
                    </nav>

                    <div className="hidden md:block">
                        <Link
                            to="/register"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-full text-sm font-semibold transition-colors"
                        >
                            {t('landingPage.navStart')}
                            <FiArrowRight />
                        </Link>
                    </div>

                    <button onClick={() => setMenuOuvert(!menuOuvert)} className="md:hidden p-2 text-forest-900">
                        {menuOuvert ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
                    </button>
                </div>

                {menuOuvert && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:hidden border-t border-primary-50 px-6 py-6 space-y-4"
                    >
                        <a href="#accueil" onClick={() => setMenuOuvert(false)} className="block text-sm font-medium text-forest-800">{t('landingPage.navHome')}</a>
                        <a href="#apropos" onClick={() => setMenuOuvert(false)} className="block text-sm font-medium text-forest-800">{t('landingPage.navHowItWorks')}</a>
                        <a href="#services" onClick={() => setMenuOuvert(false)} className="block text-sm font-medium text-forest-800">{t('landingPage.navServices')}</a>
                        <Link to="/login" className="block text-sm font-medium text-forest-800">{t('landingPage.navLogin')}</Link>
                        <Link to="/register" className="block px-4 py-2 bg-primary-700 text-white rounded-full text-sm font-semibold text-center">
                            {t('landingPage.navStart')}
                        </Link>
                        <div className="pt-2">
                            <LanguageSwitcher />
                        </div>
                    </motion.div>
                )}
            </header>

            {/* Hero : deux colonnes, texte a gauche / photo a droite (comme le modele) */}
            <section id="accueil" className="bg-white">
                <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-xl"
                    >
                        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 bg-mint-300/25 text-primary-700 rounded-full text-xs font-semibold mb-6">
                            <GiPlantSeed />
                            {t('landingPage.heroBadge')}
                        </motion.div>

                        <motion.h1 variants={fadeUp} className="font-serif text-4xl sm:text-5xl font-semibold leading-[1.15] mb-6">
                            <span className="block text-forest-950">{t('landingPage.heroTitleLine1')}</span>
                            <span className="block text-primary-600">{t('landingPage.heroTitleHighlight')}</span>
                        </motion.h1>

                        <motion.p variants={fadeUp} className="text-forest-800/60 text-base sm:text-lg mb-9 leading-relaxed">
                            {t('landingPage.heroSubtitle')}
                        </motion.p>

                        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4">
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary-700 hover:bg-primary-800 text-white rounded-full font-semibold text-sm transition-colors"
                            >
                                {t('landingPage.heroCtaPrimary')}
                                <FiArrowRight />
                            </Link>
                            <a
                                href="#services"
                                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white border border-primary-100 hover:border-primary-300 text-forest-900 rounded-full font-semibold text-sm transition-colors"
                            >
                                {t('landingPage.heroCtaSecondary')}
                            </a>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="relative lg:justify-self-end w-full max-w-md lg:ml-auto"
                    >
                        <GiPlantSeed className="hidden sm:block absolute -top-8 -right-4 text-7xl text-primary-300 rotate-12 z-10 pointer-events-none" />

                        <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] shadow-xl">
                            <img src={bgHero} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        </div>

                        <div className="absolute -bottom-8 -left-6 sm:-left-10 bg-white rounded-2xl shadow-2xl p-4 space-y-3 w-56 z-20">
                            <div className="flex items-center gap-2 text-xs text-forest-800/60">
                                <FiCheckCircle className="text-primary-600" />
                                {t('landingPage.heroCardSoilLabel')}: <span className="font-semibold text-forest-900">{t('landingPage.heroCardSoilValue')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-forest-800/60">
                                <FiDroplet className="text-primary-600" />
                                {t('landingPage.heroCardMoistureLabel')}: <span className="font-semibold text-forest-900">{t('landingPage.heroCardMoistureValue')}</span>
                            </div>
                            <div className="flex items-center gap-3 pt-1 border-t border-primary-50">
                                <ScoreRing value={78} />
                                <span className="text-xs text-forest-800/60">{t('landingPage.heroCardScoreLabel')}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Nos services */}
            <section id="services" className="max-w-7xl mx-auto px-6 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5 }}
                    className="text-center max-w-2xl mx-auto mb-16"
                >
                    <p className="text-primary-600 text-xs uppercase tracking-[0.2em] font-bold mb-3">{t('landingPage.servicesEyebrow')}</p>
                    <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-forest-950 mb-4">{t('landingPage.servicesTitle')}</h2>
                    <p className="text-forest-800/50">{t('landingPage.servicesSubtitle')}</p>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {services.map((s, idx) => (
                        <motion.div
                            key={idx}
                            variants={fadeUp}
                            className="bg-white border border-primary-50 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                        >
                            {s.image && (
                                <div className="h-36 overflow-hidden">
                                    <img src={s.image} alt={s.titre} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-7">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-5 ${serviceColors[idx % serviceColors.length]} ${s.image ? '-mt-14 ring-4 ring-white relative z-10' : ''}`}>
                                    {s.icone}
                                </div>
                                <h3 className="font-display text-base font-semibold text-forest-900 mb-2">{s.titre}</h3>
                                <p className="text-forest-800/50 text-sm leading-relaxed">{s.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                <div className="text-center mt-12">
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 font-semibold text-sm transition-colors"
                    >
                        {t('landingPage.servicesLinkAll')}
                        <FiArrowRight />
                    </Link>
                </div>
            </section>

            {/* Bandeau de statistiques */}
            <section className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5 }}
                    className="bg-primary-700 rounded-3xl px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8"
                >
                    {statsBand.map((s, idx) => (
                        <div key={idx} className="text-center text-white">
                            <div className="text-2xl mb-2 flex justify-center text-mint-300">{s.icone}</div>
                            <p className="font-serif text-2xl sm:text-3xl font-semibold">{s.valeur}</p>
                            <p className="text-white/60 text-xs sm:text-sm mt-1">{s.label}</p>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* Technologie : deux colonnes, texte a gauche / mockups a droite */}
            <section id="apropos" className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="text-primary-600 text-xs uppercase tracking-[0.2em] font-bold mb-3">{t('landingPage.techEyebrow')}</p>
                    <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight mb-6">
                        <span className="block text-forest-950">{t('landingPage.techTitleLine1')}</span>
                        <span className="block text-primary-600">{t('landingPage.techTitleHighlight')}</span>
                    </h2>
                    <p className="text-forest-800/60 leading-relaxed mb-7">{t('landingPage.techText')}</p>

                    <div className="space-y-3 mb-8">
                        {[t('landingPage.techCheck1'), t('landingPage.techCheck2'), t('landingPage.techCheck3')].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-sm text-forest-800/80">
                                <FiCheckCircle className="text-primary-600 flex-shrink-0" />
                                {item}
                            </div>
                        ))}
                    </div>

                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary-700 hover:bg-primary-800 text-white rounded-full font-semibold text-sm transition-colors"
                    >
                        {t('landingPage.techButton')}
                        <FiArrowRight />
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6 }}
                    className="relative flex justify-center py-8"
                >
                    <GiWheat className="hidden sm:block absolute inset-0 m-auto text-[22rem] text-primary-50 pointer-events-none" />

                    <div className="relative z-10 w-52 bg-white rounded-[2rem] border-8 border-forest-950 shadow-2xl p-4">
                        <p className="text-xs font-semibold text-forest-900 mb-1">{t('landingPage.techPhoneGreeting')}</p>
                        <p className="text-[11px] text-forest-800/40 mb-4">{t('landingPage.techPhoneSummary')}</p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between bg-primary-50 rounded-lg px-3 py-2 text-[11px]">
                                <span className="text-forest-800/60">{t('landingPage.techPhoneCropHealth')}</span>
                                <span className="font-semibold text-primary-700">78%</span>
                            </div>
                            <div className="flex items-center justify-between bg-primary-50 rounded-lg px-3 py-2 text-[11px]">
                                <span className="text-forest-800/60">{t('landingPage.techPhoneMoisture')}</span>
                                <span className="font-semibold text-primary-700">65%</span>
                            </div>
                            <div className="flex items-center justify-between bg-primary-50 rounded-lg px-3 py-2 text-[11px]">
                                <span className="text-forest-800/60">{t('landingPage.techPhoneWeather')}</span>
                                <span className="font-semibold text-primary-700">24°C</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute z-20 -right-2 sm:right-4 bottom-4 w-48 bg-white rounded-2xl shadow-2xl p-4">
                        <p className="text-xs font-semibold text-forest-900 mb-3">{t('landingPage.techDashboardTitle')}</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[11px] text-forest-800/60">
                                <span className="w-2 h-2 rounded-full bg-mint-400"></span> Riz
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-forest-800/60">
                                <span className="w-2 h-2 rounded-full bg-accent-500"></span> Maïs
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-forest-800/60">
                                <span className="w-2 h-2 rounded-full bg-primary-600"></span> Manioc
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Bandeau final */}
            <section className="max-w-7xl mx-auto px-6 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5 }}
                    className="bg-primary-50 border border-primary-100 rounded-2xl p-8 flex flex-col lg:flex-row items-center justify-between gap-6"
                >
                    <p className="font-display text-sm sm:text-base font-medium text-forest-900 text-center lg:text-left">
                        {t('landingPage.bannerText')}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <span className="flex items-center gap-2 text-xs text-forest-800/60"><GiPlantSeed className="text-primary-600" /> {t('landingPage.bannerItem1')}</span>
                        <span className="flex items-center gap-2 text-xs text-forest-800/60"><FiActivity className="text-primary-600" /> {t('landingPage.bannerItem2')}</span>
                        <span className="flex items-center gap-2 text-xs text-forest-800/60"><GiFarmer className="text-primary-600" /> {t('landingPage.bannerItem3')}</span>
                    </div>
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-full font-semibold text-sm transition-colors flex-shrink-0"
                    >
                        {t('landingPage.bannerButton')}
                        <FiArrowRight />
                    </Link>
                </motion.div>
            </section>

            {/* Footer minimal */}
            <footer className="border-t border-primary-50 py-8">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-forest-800/30 text-xs">Conçu et développé par PASSOT Yandie — L2GL/157/LA/24-25 — INSI</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
