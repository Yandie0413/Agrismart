import React, { useEffect, useRef, useState } from 'react';

/**
 * Anime un nombre de 0 (ou de sa derniere valeur) jusqu'a `value` sur une courte duree.
 * Pas de dependance externe : requestAnimationFrame simple.
 */
const AnimatedNumber = ({ value = 0, duration = 700, suffix = '' }) => {
    const [affiche, setAffiche] = useState(0);
    const depart = useRef(0);
    const debut = useRef(null);

    useEffect(() => {
        const cible = Number(value) || 0;
        depart.current = affiche;
        debut.current = null;

        let frame;
        const step = (timestamp) => {
            if (!debut.current) debut.current = timestamp;
            const progres = Math.min((timestamp - debut.current) / duration, 1);
            const ease = 1 - Math.pow(1 - progres, 3);
            setAffiche(Math.round(depart.current + (cible - depart.current) * ease));
            if (progres < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, duration]);

    return <>{affiche}{suffix}</>;
};

export default AnimatedNumber;
