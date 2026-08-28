import React from 'react';

/**
 * Parcours vertical (timeline) fluide : remplace les listes empilees "effet tableau".
 * items: [{ status: 'done' | 'current' | 'upcoming', title, subtitle, meta }]
 */
const DOT_CLASS = {
    done: 'bg-primary-600 dark:bg-mint-400 border-primary-600 dark:border-mint-400',
    current: 'border-primary-600 dark:border-mint-400 ring-4 ring-primary-500/20 dark:ring-mint-400/20',
    upcoming: 'bg-white dark:bg-forest-950 border-gray-300 dark:border-white/20',
};

const Timeline = ({ items = [], emptyLabel = '—' }) => {
    if (items.length === 0) {
        return <p className="text-xs text-gray-400">{emptyLabel}</p>;
    }

    return (
        <div className="relative pl-6">
            <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-gray-200 dark:bg-white/10" />
            <div className="space-y-5">
                {items.map((item, idx) => (
                    <div key={idx} className="relative">
                        <span className={`absolute -left-6 top-0.5 w-3 h-3 rounded-full border-2 ${DOT_CLASS[item.status] || DOT_CLASS.upcoming}`}>
                            {item.status === 'current' && (
                                <span className="absolute inset-[2px] rounded-full bg-primary-600 dark:bg-mint-400" />
                            )}
                        </span>
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{item.title}</p>
                                {item.subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{item.subtitle}</p>}
                            </div>
                            {item.meta && (
                                <span className="text-[11px] font-semibold text-primary-700 dark:text-mint-300 flex-shrink-0 whitespace-nowrap">{item.meta}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Timeline;
