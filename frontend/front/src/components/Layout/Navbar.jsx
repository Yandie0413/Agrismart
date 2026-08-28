import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { FiSun, FiMoon, FiBell, FiLogOut, FiSettings, FiMessageSquare, FiCloudRain, FiBook, FiCalendar, FiX, FiCheck } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import Avatar from '../UI/Avatar';
import { getNotifications, marquerNotificationLue, marquerToutesNotificationsLues, supprimerNotification } from '../../services/api';

const getIconeNotification = (type) => {
    switch (type) {
        case 'message': return <FiMessageSquare className="text-blue-500" />;
        case 'meteo': return <FiCloudRain className="text-cyan-500" />;
        case 'conseil': return <FiBook className="text-purple-500" />;
        case 'calendrier': return <FiCalendar className="text-primary-500" />;
        default: return <FiBell className="text-gray-500" />;
    }
};

const Navbar = ({ collapsed }) => {
    const { t } = useTranslation();
    const { utilisateur, deconnexion, toggleTheme, theme } = useAuth();
    const [menuOuvert, setMenuOuvert] = useState(false);
    const [notifOuvert, setNotifOuvert] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [nbNonLues, setNbNonLues] = useState(0);
    const navigate = useNavigate();
    const notifRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOuvert(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await getNotifications();
            const data = res.data.data || [];
            setNotifications(data);
            setNbNonLues(data.filter(n => !n.notification_lue).length);
        } catch (err) {
            console.error(err);
        }
    };

    const handleClicNotification = async (notif) => {
        try {
            await marquerNotificationLue(notif.notification_id);
            setNotifications(prev => prev.map(n =>
                n.notification_id === notif.notification_id ? { ...n, notification_lue: true } : n
            ));
            setNbNonLues(prev => Math.max(0, prev - 1));
            if (notif.notification_lien) {
                navigate(notif.notification_lien);
            }
            setNotifOuvert(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleToutesLues = async () => {
        try {
            await marquerToutesNotificationsLues();
            setNotifications(prev => prev.map(n => ({ ...n, notification_lue: true })));
            setNbNonLues(0);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSupprimer = async (e, id) => {
        e.stopPropagation();
        try {
            await supprimerNotification(id);
            setNotifications(prev => prev.filter(n => n.notification_id !== id));
            setNbNonLues(prev => {
                const notif = notifications.find(n => n.notification_id === id);
                return notif && !notif.notification_lue ? Math.max(0, prev - 1) : prev;
            });
        } catch (err) {
            console.error(err);
        }
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const maintenant = new Date();
        const diff = Math.floor((maintenant - d) / 1000);
        if (diff < 60) return t('navbar.justNow');
        if (diff < 3600) return t('navbar.minutesAgo', { count: Math.floor(diff / 60) });
        if (diff < 86400) return t('navbar.hoursAgo', { count: Math.floor(diff / 3600) });
        return d.toLocaleDateString('fr-FR');
    };

    return (
        <header className={`
            fixed top-0 right-0 left-0 z-30
            bg-white/80 dark:bg-forest-950/85 backdrop-blur-xl
            border-b border-gray-100 dark:border-white/5
            h-16 flex items-center justify-between
            px-4 sm:px-6 transition-all duration-300
            ${collapsed ? 'lg:left-[108px]' : 'lg:left-[296px]'}
        `}>
            <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-display font-semibold text-gray-800 dark:text-white truncate">
                    {t('navbar.welcome')}, <span className="text-primary-600 dark:text-mint-400">{utilisateur?.nom}</span>
                </h1>
                <p className="text-xs text-gray-500 dark:text-white/40 capitalize flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-primary-500 dark:bg-mint-400 rounded-full"></span>
                    {utilisateur?.role}
                </p>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <LanguageSwitcher />

                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-full hover:bg-primary-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                    {theme === 'light' ? <FiMoon className="text-lg" /> : <FiSun className="text-lg" />}
                </button>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setNotifOuvert(!notifOuvert)}
                        className="relative p-2.5 rounded-full hover:bg-primary-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                        <FiBell className="text-lg" />
                        {nbNonLues > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold ring-2 ring-white dark:ring-gray-900">
                                {nbNonLues > 9 ? '9+' : nbNonLues}
                            </span>
                        )}
                    </button>

                    {notifOuvert && (
                        <div className="absolute right-0 mt-3 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
                                <h3 className="font-display font-semibold text-gray-800 dark:text-white">{t('navbar.notifications')}</h3>
                                {nbNonLues > 0 && (
                                    <button
                                        onClick={handleToutesLues}
                                        className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                                    >
                                        <FiCheck /> {t('navbar.markAllRead')}
                                    </button>
                                )}
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                                            <FiBell className="text-2xl text-gray-300 dark:text-gray-500" />
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('navbar.noNotifications')}</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif.notification_id}
                                            onClick={() => handleClicNotification(notif)}
                                            className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-primary-50/50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 transition-colors ${!notif.notification_lue ? 'bg-primary-50/30 dark:bg-blue-900/10' : ''}`}
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                                {getIconeNotification(notif.notification_type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notif.notification_lue ? 'font-semibold' : 'font-medium'} text-gray-800 dark:text-white`}>
                                                    {notif.notification_titre}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                    {notif.notification_contenu}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDate(notif.created_at)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {!notif.notification_lue && (
                                                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                                                )}
                                                <button
                                                    onClick={(e) => handleSupprimer(e, notif.notification_id)}
                                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-400 hover:text-gray-600"
                                                >
                                                    <FiX className="text-xs" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Menu utilisateur */}
                <div className="relative ml-1">
                    <button
                        onClick={() => setMenuOuvert(!menuOuvert)}
                        className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-primary-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-primary-100 dark:hover:border-gray-700"
                    >
                        <Avatar utilisateur={utilisateur} className="w-8 h-8 text-sm shadow-sm" />
                    </button>

                    {menuOuvert && (
                        <div className="absolute right-0 mt-3 w-52 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 overflow-hidden">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{utilisateur?.nom}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{utilisateur?.email}</p>
                            </div>
                            <Link
                                to="/profil"
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                onClick={() => setMenuOuvert(false)}
                            >
                                <FiSettings /> {t('navbar.settings')}
                            </Link>
                            <button
                                onClick={deconnexion}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors"
                            >
                                <FiLogOut /> {t('navbar.logout')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;