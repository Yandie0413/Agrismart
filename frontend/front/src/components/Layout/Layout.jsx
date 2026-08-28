import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import OfflineBanner from './OfflineBanner';

const Layout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-forest-950 relative overflow-hidden">
            <OfflineBanner />
            {/* Lueurs decoratives, coherentes avec la landing page */}
            <div className="pointer-events-none fixed top-[-10%] right-[-5%] w-96 h-96 bg-primary-400/10 dark:bg-mint-400/10 rounded-full blur-3xl" />
            <div className="pointer-events-none fixed bottom-[-10%] left-[10%] w-80 h-80 bg-primary-500/10 dark:bg-accent-500/10 rounded-full blur-3xl" />

            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <Navbar collapsed={collapsed} />
            <BottomNav />
            <main className={`relative px-4 sm:px-6 pt-20 pb-24 lg:pb-6 transition-all duration-300 ${collapsed ? 'lg:ml-[108px]' : 'lg:ml-[296px]'}`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Layout;
