import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { getConversation, envoyerMessage, getMessages, getTousUtilisateurs, partagerDocument, marquerLu } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiSend, FiMessageSquare, FiPaperclip, FiFile, FiImage, FiX, FiDownload, FiSearch } from 'react-icons/fi';

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
};
const fadeUp = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};
const bubbleIn = {
    hidden: { opacity: 0, y: 8, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
};

const Messages = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [contactSelectionne, setContactSelectionne] = useState(null);
    const [messages, setMessages] = useState([]);
    const [nonLus, setNonLus] = useState([]);
    const [nouveauMessage, setNouveauMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [fichierSelectionne, setFichierSelectionne] = useState(null);
    const [apercuFichier, setApercuFichier] = useState(null);
    const [envoi, setEnvoi] = useState(false);
    const [recherche, setRecherche] = useState('');
    const [ongletActif, setOngletActif] = useState('tous'); // tous | nonlus
    const { utilisateur } = useAuth();
    const messagesEndRef = useRef(null);
    const fichierRef = useRef(null);

    const fetchNonLus = useCallback(async () => {
        try {
            const res = await getMessages();
            setNonLus(res.data.data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchConversation = useCallback(async (contactId) => {
        try {
            const res = await getConversation(contactId);
            const messagesConversation = res.data.data;
            setMessages(messagesConversation);

            const nonLusDuContact = messagesConversation.filter(
                (m) => m.expediteur_id === contactId && !m.message_lu
            );
            if (nonLusDuContact.length > 0) {
                await Promise.all(nonLusDuContact.map((m) => marquerLu(m.message_id)));
                fetchNonLus();
            }
        } catch (err) {
            console.error(err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchUtilisateurs = useCallback(async () => {
        try {
            const res = await getTousUtilisateurs();
            const autres = res.data.data.filter(u => u.utilisateur_id !== utilisateur.id);
            setUtilisateurs(autres);
            const resNonLus = await getMessages();
            const nonLusData = resNonLus.data.data;
            setNonLus(nonLusData);

            // Deep-link depuis une autre page (ex: "Contacter le vendeur" sur le Marche)
            const contactVoulu = searchParams.get('contact');
            const contactCible = contactVoulu ? autres.find(u => String(u.utilisateur_id) === contactVoulu) : null;

            if (contactCible) {
                setContactSelectionne(contactCible);
            } else if (autres.length > 0) {
                if (nonLusData.length > 0) {
                    const dernierId = nonLusData[nonLusData.length - 1].expediteur_id;
                    const contact = autres.find(u => u.utilisateur_id === dernierId);
                    setContactSelectionne(contact || autres[0]);
                } else {
                    setContactSelectionne(autres[0]);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [utilisateur.id]);

    const selectionnerContact = (contact) => {
        setContactSelectionne(contact);
        if (searchParams.get('contact')) setSearchParams({});
    };

    useEffect(() => {
        fetchUtilisateurs();
    }, [fetchUtilisateurs]);

    useEffect(() => {
        if (contactSelectionne) {
            fetchConversation(contactSelectionne.utilisateur_id);
        }
    }, [contactSelectionne, fetchConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchNonLus();
            if (contactSelectionne) {
                fetchConversation(contactSelectionne.utilisateur_id);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [contactSelectionne, fetchNonLus, fetchConversation]);

    const handleFichierChange = (e) => {
        const fichier = e.target.files[0];
        if (!fichier) return;
        setFichierSelectionne(fichier);
        if (fichier.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setApercuFichier(ev.target.result);
            reader.readAsDataURL(fichier);
        } else {
            setApercuFichier(null);
        }
    };

    const retirerFichier = () => {
        setFichierSelectionne(null);
        setApercuFichier(null);
        if (fichierRef.current) fichierRef.current.value = '';
    };

    const handleEnvoyer = async (e) => {
        e.preventDefault();
        if (!nouveauMessage.trim() && !fichierSelectionne) return;
        setEnvoi(true);
        try {
            if (fichierSelectionne) {
                const formData = new FormData();
                formData.append('document', fichierSelectionne);
                formData.append('destinataire_id', contactSelectionne.utilisateur_id);
                formData.append('contenu', nouveauMessage || t('messagesPage.documentShared'));
                await partagerDocument(formData);
            } else {
                await envoyerMessage({
                    destinataire_id: contactSelectionne.utilisateur_id,
                    contenu: nouveauMessage
                });
            }
            setNouveauMessage('');
            retirerFichier();
            fetchConversation(contactSelectionne.utilisateur_id);
        } catch (err) {
            console.error(err);
        } finally {
            setEnvoi(false);
        }
    };

    const getNonLusParContact = (contactId) => {
        return nonLus.filter(m => m.expediteur_id === contactId).length;
    };

    const contactsFiltres = utilisateurs
        .filter((u) => u.utilisateur_nom.toLowerCase().includes(recherche.trim().toLowerCase()))
        .filter((u) => ongletActif === 'tous' || getNonLusParContact(u.utilisateur_id) > 0);

    const getIconeFichier = (nomFichier) => {
        if (!nomFichier) return <FiFile />;
        const ext = nomFichier.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png'].includes(ext)) return <FiImage className="text-blue-500" />;
        return <FiFile className="text-red-500" />;
    };

    const estImage = (nomFichier) => {
        if (!nomFichier) return false;
        const ext = nomFichier.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png'].includes(ext);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{t('messagesPage.title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('messagesPage.subtitle')}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="h-[calc(100vh-13rem)] flex gap-4">
            <div className="w-80 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800 dark:text-white">{t('messagesPage.title')}</h2>
                        {nonLus.length > 0 && (
                            <span className="text-xs px-2 py-1 bg-red-500 text-white rounded-full font-bold">
                                {nonLus.length}
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            value={recherche}
                            onChange={(e) => setRecherche(e.target.value)}
                            placeholder={t('messagesPage.searchPlaceholder')}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-full bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setOngletActif('tous')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${ongletActif === 'tous' ? 'bg-primary-600 dark:bg-mint-400 text-white dark:text-forest-950' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                        >
                            {t('messagesPage.tabAll')}
                        </button>
                        <button
                            onClick={() => setOngletActif('nonlus')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${ongletActif === 'nonlus' ? 'bg-primary-600 dark:bg-mint-400 text-white dark:text-forest-950' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                        >
                            {t('messagesPage.tabUnread')}
                            {nonLus.length > 0 && (
                                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${ongletActif === 'nonlus' ? 'bg-white/25' : 'bg-red-500 text-white'}`}>
                                    {nonLus.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex-1 overflow-y-auto">
                    {contactsFiltres.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-8">{t('messagesPage.noContactFound')}</p>
                    ) : contactsFiltres.map((u) => {
                        const nbNonLus = getNonLusParContact(u.utilisateur_id);
                        return (
                            <motion.button
                                key={u.utilisateur_id}
                                variants={fadeUp}
                                onClick={() => selectionnerContact(u)}
                                className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${contactSelectionne?.utilisateur_id === u.utilisateur_id ? 'bg-primary-50 dark:bg-mint-400/10' : ''}`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-mint-500 flex items-center justify-center text-white font-bold">
                                        {u.utilisateur_nom.charAt(0).toUpperCase()}
                                    </div>
                                    {nbNonLus > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                            {nbNonLus}
                                        </span>
                                    )}
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <p className={`text-sm ${nbNonLus > 0 ? 'font-bold' : 'font-medium'} text-gray-800 dark:text-white`}>
                                        {u.utilisateur_nom}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
                                        {u.utilisateur_role}
                                    </p>
                                </div>
                            </motion.button>
                        );
                    })}
                </motion.div>
            </div>

            <div className="flex-1 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 flex flex-col">
                {!contactSelectionne ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <FiMessageSquare className="text-5xl text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">{t('messagesPage.selectContact')}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                                {contactSelectionne.utilisateur_nom.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-gray-800 dark:text-white">{contactSelectionne.utilisateur_nom}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{contactSelectionne.utilisateur_role}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-400 text-sm">{t('messagesPage.noMessages')}</p>
                                </div>
                            ) : (
                                <AnimatePresence initial={false}>
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.message_id}
                                        initial="hidden"
                                        animate="visible"
                                        variants={bubbleIn}
                                        className={`flex ${msg.expediteur_id === utilisateur.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-xs rounded-2xl text-sm overflow-hidden ${msg.expediteur_id === utilisateur.id ? 'bg-gradient-to-br from-primary-600 to-mint-500 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white rounded-bl-sm'}`}>
                                            {msg.message_document ? (
                                                <div>
                                                    {estImage(msg.message_document) ? (
                                                        <img
                                                            src={`http://localhost:3000/uploads/${msg.message_document}`}
                                                            alt={t('messagesPage.sharedFile')}
                                                            className="max-w-full rounded-t-2xl"
                                                        />
                                                    ) : (
                                                        <div className="px-4 py-3 flex items-center gap-2">
                                                            {getIconeFichier(msg.message_document)}
                                                            <span className="text-xs truncate max-w-32">
                                                                {msg.message_document.split('-').slice(1).join('-')}
                                                            </span>
                                                            
                                                                <a href={`http://localhost:3000/uploads/${msg.message_document}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="ml-auto"
                                                            >
                                                                <FiDownload className="text-sm opacity-70 hover:opacity-100" />
                                                            </a>
                                                        </div>
                                                    )}
                                                    {msg.message_contenu && msg.message_contenu !== 'Document partage' && (
                                                        <p className="px-4 py-2">{msg.message_contenu}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="px-4 py-2">{msg.message_contenu}</p>
                                            )}
                                            <p className={`text-xs px-4 pb-2 ${msg.expediteur_id === utilisateur.id ? 'text-primary-100' : 'text-gray-400'}`}>
                                                {new Date(msg.message_date_envoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                                </AnimatePresence>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {fichierSelectionne && (
                            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                    {apercuFichier ? (
                                        <img src={apercuFichier} alt={t('messagesPage.sharedFile')} className="w-12 h-12 object-cover rounded-lg" />
                                    ) : (
                                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                            {getIconeFichier(fichierSelectionne.name)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{fichierSelectionne.name}</p>
                                        <p className="text-xs text-gray-500">{(fichierSelectionne.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button onClick={retirerFichier} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-500">
                                        <FiX />
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleEnvoyer} className="p-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-full pl-2 pr-2 py-2 focus-within:ring-2 focus-within:ring-primary-500">
                                <input
                                    type="file"
                                    ref={fichierRef}
                                    onChange={handleFichierChange}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <button
                                    type="button"
                                    onClick={() => fichierRef.current?.click()}
                                    className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <FiPaperclip className="text-lg" />
                                </button>
                                <input
                                    type="text"
                                    value={nouveauMessage}
                                    onChange={(e) => setNouveauMessage(e.target.value)}
                                    placeholder={fichierSelectionne ? t('messagesPage.messagePlaceholderWithFile') : t('messagesPage.messagePlaceholder')}
                                    className="flex-1 min-w-0 bg-transparent text-gray-800 dark:text-white focus:outline-none text-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={envoi || (!nouveauMessage.trim() && !fichierSelectionne)}
                                    className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-primary-600 hover:bg-primary-700 dark:bg-mint-400 dark:hover:bg-mint-300 dark:text-forest-950 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                                >
                                    <FiSend className="text-sm" />
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
            </motion.div>
        </div>
    );
};

export default Messages;