import { useEffect, useState } from 'react';
import { estEnLigne } from '../utils/cacheHorsLigne';

// Suit la connectivite reseau du navigateur pour afficher la banniere hors-ligne
// et declencher la resynchronisation des actions en attente au retour du reseau.
export default function useEnLigne() {
    const [enLigne, setEnLigne] = useState(estEnLigne());

    useEffect(() => {
        const gererEnLigne = () => setEnLigne(true);
        const gererHorsLigne = () => setEnLigne(false);
        window.addEventListener('online', gererEnLigne);
        window.addEventListener('offline', gererHorsLigne);
        return () => {
            window.removeEventListener('online', gererEnLigne);
            window.removeEventListener('offline', gererHorsLigne);
        };
    }, []);

    return enLigne;
}
