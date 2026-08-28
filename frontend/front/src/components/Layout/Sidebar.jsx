import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { GiFarmer } from 'react-icons/gi';
import Avatar from '../UI/Avatar';
import { itemsPourRole } from './navItems';

// Rail de navigation flottant (verre depoli, angles genereux, marge tout autour) :
// visible uniquement a partir du breakpoint lg. En dessous, la BottomNav prend le relais.
const Sidebar = ({ collapsed, setCollapsed }) => {
    const { utilisateur } = useAuth();
    const location = useLocation();
    const { t } = useTranslation();

    const itemsFiltres = itemsPourRole(utilisateur?.role);

    return (
        <aside className={`
            hidden lg:flex
            fixed left-4 top-4 bottom-4 z-40
            bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl
            border border-gray-100 dark:border-white/10 shadow-sm
            rounded-3xl transition-all duration-300 ease-in-out
            ${collapsed ? 'w-[76px]' : 'w-64'}
            flex-col
        `}>
            <div className="flex items-center justify-between p-3.5">
                {!collapsed && (
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-mint-400 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary-600/20">
                            <GiFarmer className="text-xl text-white" />
                        </div>
                        <span className="font-display font-bold text-gray-800 dark:text-white text-lg truncate">AgriSmart</span>
                    </div>
                )}
                {collapsed && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-mint-400 flex items-center justify-center mx-auto shadow-md shadow-primary-600/20">
                        <GiFarmer className="text-xl text-white" />
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-white/50 hover:text-gray-700 dark:hover:text-white transition-colors flex-shrink-0"
                >
                    {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
                </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {itemsFiltres.map((item) => {
                    const estActif = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                                relative flex items-center gap-3 px-3 py-2.5 rounded-2xl
                                transition-all duration-200 group
                                ${estActif
                                    ? 'bg-gradient-to-br from-primary-600 to-mint-500 dark:from-primary-600 dark:to-mint-400 text-white font-semibold shadow-md shadow-primary-600/25'
                                    : 'text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-white'
                                }
                                ${collapsed ? 'justify-center' : ''}
                            `}
                        >
                            <span className="text-xl">{item.icon}</span>
                            {!collapsed && <span className="text-sm">{t(item.labelKey)}</span>}
                        </Link>
                    );
                })}
            </nav>

            {!collapsed && (
                <div className="p-3.5 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 rounded-2xl p-3">
                        <Avatar utilisateur={utilisateur} className="w-9 h-9 text-sm" />
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{utilisateur?.nom}</p>
                            <p className="text-xs text-gray-500 dark:text-white/50 capitalize">{utilisateur?.role}</p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;