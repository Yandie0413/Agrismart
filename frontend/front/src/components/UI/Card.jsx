import React from 'react';
import { motion } from 'framer-motion';

/**
 * Carte standard de l'application : fond clair/sombre cohérent avec la landing page,
 * légère lueur au survol, glow décoratif optionnel, apparition animée à l'entrée.
 */
const Card = ({
    children,
    className = '',
    glow = false,
    hover = true,
    delay = 0,
    initial = { opacity: 0, y: 16 },
    animate = { opacity: 1, y: 0 },
    as: Component = motion.div,
    ...props
}) => {
    return (
        <Component
            initial={initial}
            animate={animate}
            transition={{ duration: 0.45, delay, ease: 'easeOut' }}
            whileHover={hover ? { y: -4 } : undefined}
            className={`relative overflow-hidden bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-lg dark:hover:border-mint-400/30 transition-shadow duration-300 ${className}`}
            {...props}
        >
            {glow && (
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-mint-400/10 dark:bg-mint-400/10 -translate-y-10 translate-x-10 blur-2xl pointer-events-none" />
            )}
            <div className="relative">{children}</div>
        </Component>
    );
};

export default Card;
