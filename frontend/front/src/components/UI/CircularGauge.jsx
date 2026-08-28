import React from 'react';

/**
 * Jauge circulaire lumineuse (halo + anneau degrade), remplace les barres de
 * progression horizontales pour tout affichage de pourcentage / jours restants.
 * pct : 0-100. Le halo et le glow suivent la couleur de la marque par defaut,
 * mais peuvent etre recolores via `tone` ('primary' | 'amber' | 'neutral').
 */
const TONES = {
    primary: { from: '#1B4332', to: '#6EE7B7', glow: 'rgba(52,211,153,.5)', haloClass: 'bg-primary-500/20 dark:bg-mint-400/20' },
    amber: { from: '#9C6A08', to: '#FFB703', glow: 'rgba(255,183,3,.45)', haloClass: 'bg-accent-500/20' },
    neutral: { from: '#6b7280', to: '#9ca3af', glow: 'rgba(156,163,175,.35)', haloClass: 'bg-gray-400/15' },
};

const CircularGauge = ({
    pct = 0,
    size = 168,
    strokeWidth = 14,
    label,
    value,
    sublabel,
    tone = 'primary',
    gradientId,
    className = '',
}) => {
    const t = TONES[tone] || TONES.primary;
    const r = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - Math.min(100, Math.max(0, pct)) / 100);
    const gid = gradientId || `gauge-grad-${tone}-${size}`;

    return (
        <div className={`relative flex flex-col items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <div className={`absolute inset-0 rounded-full blur-xl ${t.haloClass}`} style={{ transform: 'scale(1.2)' }} />
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-100 dark:text-white/10" />
                <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={`url(#${gid})`} strokeWidth={strokeWidth} strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ filter: `drop-shadow(0 0 8px ${t.glow})`, transition: 'stroke-dashoffset .6s ease' }}
                />
                <defs>
                    <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={t.from} />
                        <stop offset="100%" stopColor={t.to} />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                {label && <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-white/40">{label}</span>}
                <span className="font-display font-extrabold text-gray-800 dark:text-white tabular-nums" style={{ fontSize: size * 0.19 }}>{value}</span>
                {sublabel && <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-white/40 mt-1">{sublabel}</span>}
            </div>
        </div>
    );
};

export default CircularGauge;
