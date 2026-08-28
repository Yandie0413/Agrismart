import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { itemsBottomNav } from './navItems';

// Barre de navigation basse (mobile uniquement, style Instagram) : remplace la
// sidebar quand elle est masquee sous le breakpoint lg.
const BottomNav = () => {
    const { utilisateur } = useAuth();
    const location = useLocation();
    const { t } = useTranslation();
    const items = itemsBottomNav(utilisateur?.role);

    if (items.length === 0) return null;

    return (
        <nav className="lg:hidden fixed left-3 right-3 bottom-3 z-40 h-16 rounded-3xl bg-white/85 dark:bg-white/[0.06] backdrop-blur-xl border border-gray-100 dark:border-white/10 shadow-lg flex items-center justify-around px-1">
            {items.map((item) => {
                const estActif = location.pathname === item.path;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full text-gray-400 dark:text-white/40"
                    >
                        {estActif && (
                            <span className="absolute -top-1 w-1 h-1 rounded-full bg-primary-600 dark:bg-mint-400" />
                        )}
                        <span className={`text-xl ${estActif ? 'text-primary-600 dark:text-mint-400' : ''}`}>{item.icon}</span>
                        <span className={`text-[10px] font-medium ${estActif ? 'text-primary-600 dark:text-mint-400' : ''}`}>{t(item.labelKey)}</span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default BottomNav;
