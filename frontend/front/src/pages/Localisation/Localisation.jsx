import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getLocalisations, getToutesLocalisations, creerLocalisation } from '../../services/api';
import { FiMapPin, FiPlus, FiX, FiMap } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const panelClass = 'bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700';

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

// Corriger le bug des icones Leaflet avec Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const iconeVerte = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Rayon approximatif (en metres) d'une parcelle circulaire a partir de sa superficie en ares,
// pour donner une vue de parcelle sur la carte sans avoir a dessiner de vrais contours.
const rayonParcelle = (superficieAres) => {
    const surface = Number(superficieAres);
    if (!surface || surface <= 0) return 15;
    const surfaceM2 = surface * 100;
    const rayon = Math.sqrt(surfaceM2 / Math.PI);
    return Math.min(500, Math.max(15, Math.round(rayon)));
};

const SélecteurPosition = ({ onPositionSelectionnee }) => {
    useMapEvents({
        click(e) {
            onPositionSelectionnee(e.latlng);
        }
    });
    return null;
};

const Localisation = () => {
    const { t } = useTranslation();
    const [localisations, setLocalisations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOuvert, setModalOuvert] = useState(false);
    const [positionSelectionnee, setPositionSelectionnee] = useState(null);
    const [form, setForm] = useState({ adresse: '', exploitation_id: '' });
    const [erreur, setErreur] = useState('');
    const [modeSelection, setModeSelection] = useState(false);
    const { utilisateur } = useAuth();

    // Centre par defaut sur Madagascar
    const centreMadagascar = [-18.9249, 47.5185];

    useEffect(() => {
        if (utilisateur?.role) fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [utilisateur?.role]);

    const fetchData = async () => {
        try {
            const resLoc = utilisateur?.role === 'administrateur'
                ? await getToutesLocalisations()
                : await getLocalisations();
            setLocalisations(resLoc.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePositionSelectionnee = (latlng) => {
        if (!modeSelection) return;
        setPositionSelectionnee(latlng);
        setModeSelection(false);
        setModalOuvert(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!positionSelectionnee) {
            setErreur(t('locationPage.selectPositionError'));
            return;
        }
        try {
            await creerLocalisation({
                latitude: positionSelectionnee.lat,
                longitude: positionSelectionnee.lng,
                adresse: form.adresse
            });
            fetchData();
            setModalOuvert(false);
            setPositionSelectionnee(null);
            setForm({ adresse: '', exploitation_id: '' });
            setErreur('');
        } catch (err) {
            setErreur(err.response?.data?.message || t('locationPage.genericError'));
        }
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
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{t('locationPage.title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('locationPage.subtitle')}</p>
                </div>
                {utilisateur?.role === 'agriculteur' && (
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setModeSelection(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-mint-400 dark:hover:bg-mint-300 dark:text-forest-950 text-white rounded-xl shadow-sm hover:shadow-md transition-all"
                    >
                        <FiPlus /> {t('locationPage.addLocation')}
                    </motion.button>
                )}
            </motion.div>

            <AnimatePresence>
            {modeSelection && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between overflow-hidden"
                >
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <FiMapPin />
                        <p className="text-sm font-medium">{t('locationPage.clickMapInstruction')}</p>
                    </div>
                    <button onClick={() => setModeSelection(false)} className="text-blue-500 hover:text-blue-700">
                        <FiX />
                    </button>
                </motion.div>
            )}
            </AnimatePresence>

            <div className={`${panelClass} overflow-hidden`}>
                <MapContainer
                    center={centreMadagascar}
                    zoom={6}
                    style={{ height: '500px', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <SélecteurPosition onPositionSelectionnee={handlePositionSelectionnee} />

                    {localisations.map((loc) => (
                        <React.Fragment key={loc.localisation_id}>
                            {loc.exploitation_superficie && (
                                <Circle
                                    center={[loc.localisation_latitude, loc.localisation_longitude]}
                                    radius={rayonParcelle(loc.exploitation_superficie)}
                                    pathOptions={{ color: '#2D6A4F', fillColor: '#4ADE80', fillOpacity: 0.25, weight: 1.5 }}
                                />
                            )}
                            <Marker
                                position={[loc.localisation_latitude, loc.localisation_longitude]}
                                icon={iconeVerte}
                            >
                                <Popup>
                                    <div className="p-1">
                                        <p className="font-semibold text-gray-800">{loc.exploitation_nom || t('locationPage.defaultFarmName')}</p>
                                        <p className="text-xs text-gray-500 mt-1">{loc.localisation_adresse}</p>
                                        {loc.exploitation_superficie && (
                                            <p className="text-xs text-green-600 mt-1">{loc.exploitation_superficie} {t('farms.hectares')}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                            {loc.localisation_latitude.toFixed(4)}, {loc.localisation_longitude.toFixed(4)}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        </React.Fragment>
                    ))}

                    {positionSelectionnee && (
                        <Marker position={positionSelectionnee}>
                            <Popup>{t('locationPage.newFarmHere')}</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            {localisations.length === 0 && (
                <div className={`${panelClass} p-8 text-center`}>
                    <FiMap className="text-5xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t('locationPage.noLocation')}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('locationPage.noLocationHint')}</p>
                </div>
            )}

            {localisations.length > 0 && (
                <div className={`${panelClass} p-6`}>
                    <h2 className="font-serif text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        {t('locationPage.locatedFarms')} ({localisations.length})
                    </h2>
                    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {localisations.map((loc) => (
                            <motion.div key={loc.localisation_id} variants={fadeUp} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                                <FiMapPin className="text-primary-600 dark:text-mint-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-white text-sm">{loc.exploitation_nom || t('locationPage.defaultFarmName')}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{loc.localisation_adresse}</p>
                                    <p className="text-xs text-gray-400 mt-0.5 font-mono">
                                        {parseFloat(loc.localisation_latitude).toFixed(4)}, {parseFloat(loc.localisation_longitude).toFixed(4)}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            )}

            <AnimatePresence>
            {modalOuvert && (
                <motion.div variants={modalOverlay} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <motion.div variants={modalPanel} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('locationPage.modalTitle')}</h2>
                            <button onClick={() => setModalOuvert(false)} className="text-gray-400 hover:text-gray-600">
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        {positionSelectionnee && (
                            <div className="bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-xl mb-4 text-sm text-green-700 dark:text-green-400">
                                {t('locationPage.selectedPosition')} : {positionSelectionnee.lat.toFixed(4)}, {positionSelectionnee.lng.toFixed(4)}
                            </div>
                        )}

                        {erreur && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">{erreur}</div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('locationPage.fieldAddress')}</label>
                                <input
                                    type="text"
                                    value={form.adresse}
                                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder={t('locationPage.addressPlaceholder')}
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOuvert(false)}
                                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    {t('locationPage.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors"
                                >
                                    {t('locationPage.save')}
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

export default Localisation;