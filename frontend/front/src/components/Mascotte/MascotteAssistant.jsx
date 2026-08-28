import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCpu, FiSend, FiX } from 'react-icons/fi';

// Cle de persistance : une fois reduite par l'utilisateur, la mascotte reste
// un simple bouton discret meme apres rechargement/reconnexion.
const CLE_REDUITE = 'agrismart_mascotte_reduite';
const BULLE_VISIBLE_MS = 8000;
const BULLE_PAUSE_MS = 24000;

// Moteur de reponse tres simple, base sur des mots-cles (pas de vraie IA/LLM,
// mais donne l'illusion d'un assistant qui comprend la question, en local et gratuit).
function repondre(question, { t, meteoResume, conseilDuJour, nbNotifications }) {
    const q = (question || '').toLowerCase();

    if (/(bonjour|salut|coucou|hello|hi|manao ahoana|akory)/.test(q)) {
        return t('mascotte.chatGreetingReply');
    }
    if (/(meteo|temps|pluie|chaleur|weather|rain|temperature|toetr.?andro|orana)/.test(q)) {
        return meteoResume ? t('mascotte.chatWeatherReply', { summary: meteoResume }) : t('mascotte.chatWeatherUnknown');
    }
    if (/(conseil|advice|torohevitra|culture|voly)/.test(q)) {
        return conseilDuJour || t('mascotte.defaultAdvice');
    }
    if (/(notification|message|hafatra)/.test(q)) {
        return nbNotifications > 0
            ? t('mascotte.notificationsCount', { count: nbNotifications })
            : t('mascotte.noNotifications');
    }
    if (/(merci|thanks|thank you|misaotra)/.test(q)) {
        return t('mascotte.chatThanksReply');
    }
    return t('mascotte.chatFallback');
}

const MascotteAssistant = ({ role = 'agriculteur', prenom, meteoResume, conseilDuJour, nbNotifications }) => {
    const { t } = useTranslation();
    const [position, setPosition] = useState({ x: 70, y: 86 });
    const [direction, setDirection] = useState(1);
    const [enMarche, setEnMarche] = useState(false);
    const [messageIndex, setMessageIndex] = useState(0);
    const [bulleVisible, setBulleVisible] = useState(false);
    const [chatOuvert, setChatOuvert] = useState(false);
    const [enTrainDecrire, setEnTrainDecrire] = useState(false);
    const [saisie, setSaisie] = useState('');
    const [historique, setHistorique] = useState([]);
    const [reduite, setReduite] = useState(() => {
        try { return localStorage.getItem(CLE_REDUITE) === '1'; } catch { return false; }
    });
    const timeoutRef = useRef(null);
    const bulleTimeoutRef = useRef(null);
    const finListeRef = useRef(null);

    const messagesAmbiants = [
        t('mascotte.greeting', { name: prenom || '' }),
        meteoResume ? t('mascotte.weatherToday', { summary: meteoResume }) : t('mascotte.weatherCheck'),
        conseilDuJour || t('mascotte.defaultAdvice'),
        nbNotifications > 0
            ? t('mascotte.notificationsCount', { count: nbNotifications })
            : t('mascotte.noNotifications'),
    ];

    // Cycle des messages ambiants (bulle passive) : visible un moment puis
    // masquee un long moment avant le message suivant, pour rester discrete.
    // En pause si le chat est ouvert ou si la mascotte est reduite.
    const cyclerBulle = useCallback(() => {
        setBulleVisible(true);
        bulleTimeoutRef.current = setTimeout(() => {
            setBulleVisible(false);
            bulleTimeoutRef.current = setTimeout(() => {
                setMessageIndex((prev) => (prev + 1) % messagesAmbiants.length);
                cyclerBulle();
            }, BULLE_PAUSE_MS);
        }, BULLE_VISIBLE_MS);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messagesAmbiants.length]);

    useEffect(() => {
        if (chatOuvert || reduite) {
            clearTimeout(bulleTimeoutRef.current);
            setBulleVisible(false);
            return;
        }
        bulleTimeoutRef.current = setTimeout(cyclerBulle, 2500);
        return () => clearTimeout(bulleTimeoutRef.current);
    }, [chatOuvert, reduite, cyclerBulle]);

    // Deambulation libre mais confinee a une bande basse de l'ecran, pour ne jamais
    // recouvrir le contenu du tableau de bord (uniquement sous le contenu utile).
    // Marche breve puis longue pause : une presence discrete, pas une agitation continue.
    const planifierProchainMouvement = useCallback(() => {
        if (chatOuvert || reduite) return;
        const cible = { x: 5 + Math.random() * 80, y: 80 + Math.random() * 12 };
        setDirection(cible.x >= position.x ? 1 : -1);
        setEnMarche(true);
        setPosition(cible);

        const dureeMarche = 2000 + Math.random() * 1500;
        timeoutRef.current = setTimeout(() => {
            setEnMarche(false);
            const dureePause = 18000 + Math.random() * 15000;
            timeoutRef.current = setTimeout(planifierProchainMouvement, dureePause);
        }, dureeMarche);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [position.x, chatOuvert, reduite]);

    useEffect(() => {
        if (reduite) {
            clearTimeout(timeoutRef.current);
            return;
        }
        timeoutRef.current = setTimeout(planifierProchainMouvement, 4000);
        return () => clearTimeout(timeoutRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reduite]);

    useEffect(() => {
        finListeRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [historique, enTrainDecrire]);

    const ouvrirChat = (e) => {
        e.stopPropagation();
        setChatOuvert(true);
        setBulleVisible(false);
        clearTimeout(timeoutRef.current);
        setEnMarche(false);
        if (historique.length === 0) {
            setHistorique([{ role: 'bot', texte: t('mascotte.chatGreetingReply') }]);
        }
    };

    const fermerChat = (e) => {
        e.stopPropagation();
        setChatOuvert(false);
        timeoutRef.current = setTimeout(planifierProchainMouvement, 1500);
    };

    // Reduction persistante : l'utilisateur ne veut plus voir le personnage se
    // deplacer ni recevoir de bulles, seulement un petit bouton discret.
    const reduireMascotte = (e) => {
        e.stopPropagation();
        clearTimeout(timeoutRef.current);
        clearTimeout(bulleTimeoutRef.current);
        setChatOuvert(false);
        setEnMarche(false);
        setBulleVisible(false);
        setReduite(true);
        try { localStorage.setItem(CLE_REDUITE, '1'); } catch { /* stockage indisponible, tant pis */ }
    };

    const restaurerMascotte = () => {
        setReduite(false);
        try { localStorage.setItem(CLE_REDUITE, '0'); } catch { /* stockage indisponible, tant pis */ }
    };

    const envoyerQuestion = (e) => {
        e.preventDefault();
        const question = saisie.trim();
        if (!question) return;
        setHistorique((prev) => [...prev, { role: 'user', texte: question }]);
        setSaisie('');
        setEnTrainDecrire(true);
        setTimeout(() => {
            const reponse = repondre(question, { t, meteoResume, conseilDuJour, nbNotifications });
            setHistorique((prev) => [...prev, { role: 'bot', texte: reponse }]);
            setEnTrainDecrire(false);
        }, 700 + Math.random() * 400);
    };

    const estAgriculteur = role === 'agriculteur';
    const estExpert = role === 'expert';
    const estAdmin = role === 'administrateur';

    const personnage = (
        <div className="flex items-end" style={{ transform: `scaleX(${direction}) scale(0.68)`, transformOrigin: 'bottom center' }}>
            <svg width="64" height="80" viewBox="0 0 64 80" fill="none">
                <ellipse cx="32" cy="76" rx="16" ry="3" fill="#000" opacity="0.15" />

                {enMarche ? (
                    <>
                        <motion.rect
                            x="26" y="55" width="7" height="20" rx="3" fill="#5C4033"
                            animate={{ rotate: [15, -15, 15] }}
                            transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ transformOrigin: '30px 55px' }}
                        />
                        <motion.rect
                            x="33" y="55" width="7" height="20" rx="3" fill="#6B4A37"
                            animate={{ rotate: [-15, 15, -15] }}
                            transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ transformOrigin: '37px 55px' }}
                        />
                    </>
                ) : (
                    <>
                        <rect x="24" y="62" width="8" height="12" rx="3" fill="#5C4033" transform="rotate(70 28 62)" />
                        <rect x="34" y="62" width="8" height="12" rx="3" fill="#6B4A37" transform="rotate(-70 38 62)" />
                    </>
                )}

                <rect x="20" y="35" width="24" height="24" rx="6" fill={estAdmin ? '#1B4332' : '#2D6A4F'} />
                <rect x="24" y="35" width="6" height="10" rx="2" fill={estAdmin ? '#1B4332' : '#2D6A4F'} />
                <rect x="34" y="35" width="6" height="10" rx="2" fill={estAdmin ? '#1B4332' : '#2D6A4F'} />
                {estAdmin && <rect x="30" y="37" width="4" height="14" fill="#FFB703" />}

                <motion.rect
                    x="14" y="38" width="7" height="16" rx="3" fill="#F4C89B"
                    animate={enMarche ? { rotate: [-10, 10, -10] } : { rotate: -20 }}
                    transition={enMarche ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
                    style={{ transformOrigin: '17px 40px' }}
                />
                <motion.rect
                    x="43" y="38" width="7" height="16" rx="3" fill="#F4C89B"
                    animate={enMarche ? { rotate: [10, -10, 10] } : { rotate: 20 }}
                    transition={enMarche ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
                    style={{ transformOrigin: '47px 40px' }}
                />

                <circle cx="32" cy="22" r="12" fill="#F4C89B" />

                {estAgriculteur && (
                    <>
                        <ellipse cx="32" cy="13" rx="16" ry="4" fill="#8C5A2B" />
                        <path d="M22 13 Q22 2 32 2 Q42 2 42 13 Z" fill="#A9713A" />
                        <ellipse cx="32" cy="13" rx="16" ry="3" fill="#8C5A2B" opacity="0.6" />
                    </>
                )}
                {(estExpert || estAdmin) && (
                    <>
                        <path d="M20 16 Q20 8 32 8 Q44 8 44 16 L44 14 Q32 10 20 14 Z" fill="#3A2A1A" />
                        <circle cx="27" cy="22" r="3.2" fill="none" stroke="#2D2015" strokeWidth="1.3" />
                        <circle cx="37" cy="22" r="3.2" fill="none" stroke="#2D2015" strokeWidth="1.3" />
                        <line x1="30.2" y1="22" x2="33.8" y2="22" stroke="#2D2015" strokeWidth="1.3" />
                    </>
                )}
                {!estExpert && !estAdmin && (
                    <>
                        <motion.circle
                            cx="27" cy="22" r="1.5" fill="#2D2015"
                            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                            transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1, 1] }}
                        />
                        <motion.circle
                            cx="37" cy="22" r="1.5" fill="#2D2015"
                            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                            transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1, 1] }}
                        />
                    </>
                )}
                <path d="M27 27 Q32 30 37 27" stroke="#2D2015" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>

            {estAgriculteur && (
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="-ml-1 mb-1">
                    <rect x="4" y="8" width="20" height="12" rx="2" fill="#8C5A2B" opacity="0.85" />
                    <circle cx="9" cy="24" r="3.5" fill="#3A2A1A" />
                    <circle cx="21" cy="24" r="3.5" fill="#3A2A1A" />
                    <line x1="24" y1="10" x2="28" y2="4" stroke="#5C4033" strokeWidth="2" strokeLinecap="round" />
                </svg>
            )}
            {estExpert && (
                <svg width="20" height="26" viewBox="0 0 20 26" fill="none" className="-ml-1 mb-4">
                    <rect x="2" y="2" width="16" height="22" rx="1.5" fill="#F4F9F4" stroke="#2D6A4F" strokeWidth="1" />
                    <line x1="5" y1="8" x2="15" y2="8" stroke="#2D6A4F" strokeWidth="1" />
                    <line x1="5" y1="13" x2="15" y2="13" stroke="#2D6A4F" strokeWidth="1" />
                    <line x1="5" y1="18" x2="12" y2="18" stroke="#2D6A4F" strokeWidth="1" />
                </svg>
            )}
            {estAdmin && (
                <svg width="22" height="20" viewBox="0 0 22 20" fill="none" className="-ml-1 mb-2">
                    <rect x="2" y="6" width="18" height="12" rx="2" fill="#1B4332" />
                    <rect x="8" y="3" width="6" height="4" rx="1" fill="#1B4332" />
                    <line x1="2" y1="12" x2="20" y2="12" stroke="#FFB703" strokeWidth="1.5" />
                </svg>
            )}
        </div>
    );

    // Reduite : un simple bouton discret en bas a droite, aucune animation ambiante.
    if (reduite) {
        return (
            <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={restaurerMascotte}
                title={t('mascotte.reopenTooltip')}
                aria-label={t('mascotte.reopenTooltip')}
                className="fixed z-40 bottom-5 right-5 w-11 h-11 rounded-full bg-forest-900 dark:bg-forest-800 text-mint-300 shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            >
                <FiCpu className="text-lg" />
            </motion.button>
        );
    }

    return (
        <motion.div
            className="fixed z-40 cursor-pointer select-none"
            animate={chatOuvert ? { left: '50%', top: 'auto', bottom: '1.5rem' } : { left: `${position.x}%`, top: `${position.y}%`, bottom: 'auto' }}
            style={chatOuvert ? { transform: 'translateX(-50%)' } : undefined}
            transition={{ duration: enMarche ? 2.5 : 0.5, ease: 'linear' }}
            onClick={ouvrirChat}
        >
            {/* Bulle ambiante (messages passifs, cliquable pour ouvrir le chat) */}
            <AnimatePresence>
                {!chatOuvert && bulleVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute -top-20 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 text-forest-900 dark:text-white text-xs font-medium px-4 py-2.5 rounded-2xl shadow-lg border border-gray-100 dark:border-white/10 max-w-[200px] whitespace-normal text-center z-10"
                    >
                        <button
                            onClick={reduireMascotte}
                            title={t('mascotte.minimizeTooltip')}
                            aria-label={t('mascotte.minimizeTooltip')}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shadow"
                        >
                            <FiX className="text-[9px]" />
                        </button>
                        <div className="flex items-center justify-center gap-1 mb-1 text-[9px] font-semibold text-mint-600 dark:text-mint-400 uppercase tracking-wide">
                            <FiCpu className="text-[10px]" /> {t('mascotte.aiLabel')}
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={messageIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {messagesAmbiants[messageIndex]}
                            </motion.span>
                        </AnimatePresence>
                        <p className="mt-1.5 text-[10px] text-mint-600 dark:text-mint-400 underline">{t('mascotte.chatOpen')}</p>
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 rotate-45"></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Panneau de chat interactif */}
            <AnimatePresence>
                {chatOuvert && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-80 max-w-[90vw] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col"
                        style={{ height: 380 }}
                    >
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-forest-900 to-forest-950 text-white">
                            <div className="flex items-center gap-2">
                                <motion.div
                                    className="w-2 h-2 rounded-full bg-mint-400"
                                    animate={{ scale: [1, 1.3, 1] }}
                                    transition={{ duration: 1.6, repeat: Infinity }}
                                />
                                <span className="text-sm font-semibold flex items-center gap-1.5">
                                    <FiCpu /> {t('mascotte.aiLabel')}
                                </span>
                            </div>
                            <button onClick={fermerChat} className="text-white/60 hover:text-white transition-colors">
                                <FiX />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-950/40">
                            {historique.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] text-xs px-3 py-2 rounded-2xl ${m.role === 'user' ? 'bg-mint-400 text-forest-950 rounded-br-sm' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-white/10 rounded-bl-sm'}`}>
                                        {m.texte}
                                    </div>
                                </motion.div>
                            ))}
                            {enTrainDecrire && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/10 px-3 py-2.5 rounded-2xl rounded-bl-sm">
                                        {[0, 1, 2].map((i) => (
                                            <motion.span
                                                key={i}
                                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                                animate={{ y: [0, -3, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div ref={finListeRef} />
                        </div>

                        <form onSubmit={envoyerQuestion} className="p-2.5 border-t border-gray-100 dark:border-white/10 flex gap-2 bg-white dark:bg-gray-900">
                            <input
                                type="text"
                                value={saisie}
                                onChange={(e) => setSaisie(e.target.value)}
                                placeholder={t('mascotte.chatPlaceholder')}
                                className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-mint-400"
                            />
                            <button
                                type="submit"
                                className="w-9 h-9 flex items-center justify-center bg-mint-400 hover:bg-mint-300 text-forest-950 rounded-xl transition-colors flex-shrink-0"
                            >
                                <FiSend className="text-sm" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {personnage}
        </motion.div>
    );
};

export default MascotteAssistant;
