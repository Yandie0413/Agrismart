import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { GiPlantSeed, GiWheat, GiCorn, GiTomato } from 'react-icons/gi';
import {
    FiSun, FiCloud, FiCloudRain, FiWind, FiDroplet,
    FiAlertTriangle, FiThermometer, FiCheckCircle
} from 'react-icons/fi';
import { getExploitations, getCultures } from '../services/api';

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const ConseilMeteo = ({ meteo, role }) => {
    const { t } = useTranslation();
    const { temperature, humidite, description = '', vitesse_vent } = meteo;
    const [cultures, setCultures] = useState([]);

    useEffect(() => {
        if (role !== 'agriculteur') return;

        const fetchCulturesAgriculteur = async () => {
            try {
                const resExp = await getExploitations();
                const exps = resExp.data.data || [];
                const toutesLesCultures = [];
                for (const exp of exps) {
                    const resCult = await getCultures(exp.exploitation_id);
                    const culturesExp = resCult.data.data || [];
                    culturesExp.forEach(c => toutesLesCultures.push(c));
                }
                setCultures(toutesLesCultures);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCulturesAgriculteur();
    }, [role]);

    const typesCultures = cultures.map(c => c.culture_type?.toLowerCase() || '');
    const desc = description.toLowerCase();
    const aPluie = desc.includes('pluie') || desc.includes('rain') || desc.includes('drizzle');
    const aOrage = desc.includes('orage') || desc.includes('thunder') || desc.includes('storm');
    const aNuage = desc.includes('nuage') || desc.includes('cloud') || desc.includes('couvert');
    const aVent = vitesse_vent > 5;

    const conseils = [];

    if (temperature >= 18 && temperature <= 26) {
        conseils.push({ icone: <FiCheckCircle className="text-green-500" />, texte: t('weatherAdvice.tempMild'), type: 'general' });
    } else if (temperature > 26 && temperature <= 32) {
        conseils.push({ icone: <FiSun className="text-yellow-500" />, texte: t('weatherAdvice.tempWarm'), type: 'general' });
    } else if (temperature > 32 && temperature <= 38) {
        conseils.push({ icone: <FiThermometer className="text-orange-500" />, texte: t('weatherAdvice.tempHot'), type: 'general' });
    } else if (temperature > 38) {
        conseils.push({ icone: <FiAlertTriangle className="text-red-500" />, texte: t('weatherAdvice.tempHeatwave'), type: 'alerte' });
    } else if (temperature < 10) {
        conseils.push({ icone: <FiAlertTriangle className="text-blue-500" />, texte: t('weatherAdvice.tempFrost'), type: 'alerte' });
    } else if (temperature >= 10 && temperature < 18) {
        conseils.push({ icone: <FiCloud className="text-blue-400" />, texte: t('weatherAdvice.tempCool'), type: 'general' });
    }

    if (humidite >= 40 && humidite <= 65) {
        conseils.push({ icone: <FiDroplet className="text-blue-500" />, texte: t('weatherAdvice.humidityIdeal'), type: 'general' });
    } else if (humidite > 65 && humidite <= 80) {
        conseils.push({ icone: <FiDroplet className="text-blue-600" />, texte: t('weatherAdvice.humidityHigh'), type: 'general' });
    } else if (humidite > 80) {
        conseils.push({ icone: <FiAlertTriangle className="text-cyan-500" />, texte: t('weatherAdvice.humidityVeryHigh'), type: 'alerte' });
    } else if (humidite < 40 && humidite >= 25) {
        conseils.push({ icone: <FiDroplet className="text-yellow-500" />, texte: t('weatherAdvice.humidityLow'), type: 'general' });
    } else if (humidite < 25) {
        conseils.push({ icone: <FiAlertTriangle className="text-orange-500" />, texte: t('weatherAdvice.humidityVeryLow'), type: 'alerte' });
    }

    if (aOrage) {
        conseils.push({ icone: <FiAlertTriangle className="text-purple-500" />, texte: t('weatherAdvice.storm'), type: 'alerte' });
    } else if (aPluie) {
        conseils.push({ icone: <FiCloudRain className="text-blue-400" />, texte: t('weatherAdvice.rain'), type: 'general' });
    } else if (aNuage) {
        conseils.push({ icone: <FiCloud className="text-gray-400" />, texte: t('weatherAdvice.cloudy'), type: 'general' });
    } else {
        conseils.push({ icone: <FiSun className="text-yellow-400" />, texte: t('weatherAdvice.sunny'), type: 'general' });
    }

    if (aVent) {
        conseils.push({ icone: <FiWind className="text-gray-500" />, texte: t('weatherAdvice.windy', { speed: vitesse_vent }), type: 'general' });
    }

    if (temperature > 25 && humidite > 70) {
        conseils.push({ icone: <FiAlertTriangle className="text-green-600" />, texte: t('weatherAdvice.hotHumidRisk'), type: 'alerte' });
    }

    if (temperature > 20 && temperature < 30 && !aPluie && humidite < 50) {
        conseils.push({ icone: <GiPlantSeed className="text-green-500" />, texte: t('weatherAdvice.goodSowing'), type: 'general' });
    }

    const conseilsCultures = [];

    if (typesCultures.some(t2 => t2.includes('riz'))) {
        if (humidite < 60) conseilsCultures.push({ icone: <GiWheat className="text-yellow-600" />, texte: t('weatherAdvice.riceHumidityLow'), culture: 'Riz' });
        else if (humidite >= 60 && humidite <= 80) conseilsCultures.push({ icone: <GiWheat className="text-green-600" />, texte: t('weatherAdvice.riceHumidityOk'), culture: 'Riz' });
        if (temperature > 35) conseilsCultures.push({ icone: <GiWheat className="text-orange-500" />, texte: t('weatherAdvice.riceHighTemp'), culture: 'Riz' });
        if (humidite > 80 && temperature > 25) conseilsCultures.push({ icone: <GiWheat className="text-red-500" />, texte: t('weatherAdvice.riceDiseaseRisk'), culture: 'Riz' });
        if (temperature >= 20 && temperature <= 30 && !aPluie) conseilsCultures.push({ icone: <GiWheat className="text-green-500" />, texte: t('weatherAdvice.riceGoodGrowth'), culture: 'Riz' });
    }

    if (typesCultures.some(t2 => t2.includes('vanille'))) {
        if (temperature < 15) conseilsCultures.push({ icone: <GiPlantSeed className="text-blue-500" />, texte: t('weatherAdvice.vanillaCold'), culture: 'Vanille' });
        else if (temperature >= 20 && temperature <= 28) conseilsCultures.push({ icone: <GiPlantSeed className="text-green-500" />, texte: t('weatherAdvice.vanillaIdeal'), culture: 'Vanille' });
        if (humidite > 85) conseilsCultures.push({ icone: <GiPlantSeed className="text-orange-500" />, texte: t('weatherAdvice.vanillaExcessHumidity'), culture: 'Vanille' });
        if (aPluie) conseilsCultures.push({ icone: <GiPlantSeed className="text-blue-400" />, texte: t('weatherAdvice.vanillaAfterRain'), culture: 'Vanille' });
    }

    if (typesCultures.some(t2 => t2.includes('manioc'))) {
        if (humidite > 85) conseilsCultures.push({ icone: <GiPlantSeed className="text-cyan-500" />, texte: t('weatherAdvice.cassavaExcessWater'), culture: 'Manioc' });
        else if (humidite < 30) conseilsCultures.push({ icone: <GiPlantSeed className="text-yellow-500" />, texte: t('weatherAdvice.cassavaDrySoil'), culture: 'Manioc' });
        else conseilsCultures.push({ icone: <GiPlantSeed className="text-green-500" />, texte: t('weatherAdvice.cassavaOk'), culture: 'Manioc' });
        if (temperature > 30) conseilsCultures.push({ icone: <GiPlantSeed className="text-orange-400" />, texte: t('weatherAdvice.cassavaHeatTolerant'), culture: 'Manioc' });
    }

    if (typesCultures.some(t2 => t2.includes('mais') || t2.includes('maïs'))) {
        if (temperature > 35 || humidite < 40) conseilsCultures.push({ icone: <GiCorn className="text-yellow-500" />, texte: t('weatherAdvice.cornWaterStress'), culture: 'Mais' });
        else if (temperature >= 20 && temperature <= 30) conseilsCultures.push({ icone: <GiCorn className="text-green-500" />, texte: t('weatherAdvice.cornGoodGrowth'), culture: 'Mais' });
        if (humidite > 80) conseilsCultures.push({ icone: <GiCorn className="text-orange-500" />, texte: t('weatherAdvice.cornDiseaseRisk'), culture: 'Mais' });
        if (aVent) conseilsCultures.push({ icone: <GiCorn className="text-gray-500" />, texte: t('weatherAdvice.cornWind'), culture: 'Mais' });
    }

    if (typesCultures.some(t2 => t2.includes('tomate'))) {
        if (temperature > 30 && humidite > 70) conseilsCultures.push({ icone: <GiTomato className="text-red-500" />, texte: t('weatherAdvice.tomatoBlightRisk'), culture: 'Tomate' });
        else if (temperature >= 20 && temperature <= 28) conseilsCultures.push({ icone: <GiTomato className="text-green-500" />, texte: t('weatherAdvice.tomatoIdeal'), culture: 'Tomate' });
        if (temperature < 15) conseilsCultures.push({ icone: <GiTomato className="text-blue-400" />, texte: t('weatherAdvice.tomatoColdNight'), culture: 'Tomate' });
        if (humidite < 40) conseilsCultures.push({ icone: <GiTomato className="text-yellow-500" />, texte: t('weatherAdvice.tomatoLowHumidity'), culture: 'Tomate' });
    }

    if (typesCultures.some(t2 => t2.includes('haricot'))) {
        if (temperature > 32) conseilsCultures.push({ icone: <GiPlantSeed className="text-orange-500" />, texte: t('weatherAdvice.beanHeat'), culture: 'Haricot' });
        else if (temperature >= 18 && temperature <= 28) conseilsCultures.push({ icone: <GiPlantSeed className="text-green-500" />, texte: t('weatherAdvice.beanIdeal'), culture: 'Haricot' });
        if (humidite > 85) conseilsCultures.push({ icone: <GiPlantSeed className="text-red-400" />, texte: t('weatherAdvice.beanDiseaseRisk'), culture: 'Haricot' });
    }

    if (cultures.length > 0 && conseilsCultures.length === 0) {
        conseilsCultures.push({ icone: <GiPlantSeed className="text-primary-600" />, texte: t('weatherAdvice.defaultCropsAdvice', { count: cultures.length }), culture: t('weatherAdvice.general') });
    }

    const tousConseils = [...conseils, ...conseilsCultures];
    const conseilsGeneriques = tousConseils.filter(c => !c.culture);
    const conseilsPersonnalises = tousConseils.filter(c => c.culture);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                {t('weather.dailyAdvice')}
            </h2>

            {conseilsPersonnalises.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-2">
                        {t('weather.forYourCrops')} ({[...new Set(conseilsPersonnalises.map(c => c.culture))].join(', ')})
                    </p>
                    <motion.ul initial="hidden" animate="visible" variants={staggerContainer} className="space-y-2">
                        {conseilsPersonnalises.map((conseil, idx) => (
                            <motion.li key={idx} variants={fadeUp} className={`flex items-start gap-3 text-sm p-3 rounded-2xl ${conseil.type === 'alerte' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'bg-primary-50 dark:bg-primary-900/20 text-gray-700 dark:text-gray-300'}`}>
                                <span className="flex-shrink-0 mt-0.5 text-lg">{conseil.icone}</span>
                                <span>{conseil.texte}</span>
                            </motion.li>
                        ))}
                    </motion.ul>
                </div>
            )}

            {conseilsGeneriques.length > 0 && (
                <div>
                    {conseilsPersonnalises.length > 0 && (
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('weather.generalAdvice')}</p>
                    )}
                    <motion.ul initial="hidden" animate="visible" variants={staggerContainer} className="space-y-2">
                        {conseilsGeneriques.map((conseil, idx) => (
                            <motion.li key={idx} variants={fadeUp} className={`flex items-start gap-3 text-sm p-3 rounded-2xl ${conseil.type === 'alerte' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}>
                                <span className="flex-shrink-0 mt-0.5 text-lg">{conseil.icone}</span>
                                <span>{conseil.texte}</span>
                            </motion.li>
                        ))}
                    </motion.ul>
                </div>
            )}
        </div>
    );
};

export default ConseilMeteo;
