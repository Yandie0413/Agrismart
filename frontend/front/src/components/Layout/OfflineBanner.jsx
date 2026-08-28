import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { FiWifiOff, FiCheckCircle } from 'react-icons/fi';
import useEnLigne from '../../hooks/useEnLigne';
import { compterActionsEnAttente, synchroniserActionsEnAttente } from '../../utils/cacheHorsLigne';
import { createParcelle, creerSujetForum } from '../../services/api';

// Actions rejouables : parcelle creee et sujet de forum poste (les deux exemples du cahier des
// charges pour l'auto-synchronisation), chacune enregistree hors-ligne via ajouterActionEnAttente
// depuis sa page d'origine (Exploitations.jsx / Forum.jsx).
const EXECUTANTS = {
    parcelle: (payload) => createParcelle(payload.exploitationId, payload.data),
    sujet_forum: (payload) => creerSujetForum(payload),
};

const OfflineBanner = () => {
    const { t } = useTranslation();
    const enLigne = useEnLigne();
    const [enAttente, setEnAttente] = useState(0);
    const [messageSync, setMessageSync] = useState('');

    useEffect(() => {
        setEnAttente(compterActionsEnAttente());
    }, [enLigne]);

    useEffect(() => {
        if (!enLigne) return;
        (async () => {
            const { reussies, restantes } = await synchroniserActionsEnAttente(EXECUTANTS);
            setEnAttente(restantes);
            if (reussies > 0) {
                setMessageSync(t('offline.syncSuccess', { count: reussies }));
                setTimeout(() => setMessageSync(''), 4000);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enLigne]);

    return (
        <AnimatePresence>
            {(!enLigne || messageSync) && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white ${
                        !enLigne ? 'bg-orange-500' : 'bg-mint-500'
                    }`}
                >
                    {!enLigne ? (
                        <>
                            <FiWifiOff />
                            {t('offline.bannerText')}
                            {enAttente > 0 && <span className="ml-1 opacity-90">— {t('offline.syncPending', { count: enAttente })}</span>}
                        </>
                    ) : (
                        <>
                            <FiCheckCircle />
                            {messageSync}
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OfflineBanner;
