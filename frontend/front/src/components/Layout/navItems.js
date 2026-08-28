import React from 'react';
import {
    FiHome, FiMap, FiSun, FiMessageSquare,
    FiShoppingCart, FiBook, FiUser, FiUsers, FiPieChart, FiMapPin, FiMessageCircle
} from 'react-icons/fi';

// Liste unique des entrees de navigation, partagee entre la Sidebar (bureau)
// et la BottomNav (mobile) pour ne jamais les laisser diverger.
export const menuItems = [
    { path: '/dashboard', icon: <FiHome />, labelKey: 'sidebar.dashboard', roles: ['agriculteur', 'expert', 'administrateur'] },
    { path: '/exploitations', icon: <FiMap />, labelKey: 'sidebar.exploitations', roles: ['agriculteur'] },
    { path: '/conseils', icon: <FiBook />, labelKey: 'sidebar.advice', roles: ['agriculteur', 'expert', 'administrateur'] },
    { path: '/meteo', icon: <FiSun />, labelKey: 'sidebar.weather', roles: ['agriculteur', 'expert'] },
    { path: '/messages', icon: <FiMessageSquare />, labelKey: 'sidebar.messages', roles: ['agriculteur', 'expert'] },
    { path: '/forum', icon: <FiMessageCircle />, labelKey: 'sidebar.forum', roles: ['agriculteur', 'expert', 'administrateur'] },
    { path: '/marches', icon: <FiShoppingCart />, labelKey: 'sidebar.markets', roles: ['agriculteur', 'administrateur'] },
    { path: '/localisation', icon: <FiMapPin />, labelKey: 'sidebar.map', roles: ['agriculteur', 'administrateur'] },
    { path: '/utilisateurs', icon: <FiUsers />, labelKey: 'sidebar.users', roles: ['administrateur'] },
    { path: '/statistiques', icon: <FiPieChart />, labelKey: 'sidebar.statistics', roles: ['administrateur'] },
    { path: '/profil', icon: <FiUser />, labelKey: 'sidebar.profile', roles: ['agriculteur', 'expert', 'administrateur'] },
];

export const itemsPourRole = (role) => menuItems.filter((item) => item.roles.includes(role));

// Sous-ensemble prioritaire (max 5) pour la barre de navigation basse mobile :
// les 4 premieres entrees pertinentes pour le role + Profil toujours en dernier.
export const itemsBottomNav = (role) => {
    const filtres = itemsPourRole(role);
    const profil = filtres.find((i) => i.path === '/profil');
    const autres = filtres.filter((i) => i.path !== '/profil').slice(0, 4);
    return profil ? [...autres, profil] : autres;
};
