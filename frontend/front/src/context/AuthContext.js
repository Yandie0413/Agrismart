import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [utilisateur, setUtilisateur] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const tokenStocke = localStorage.getItem('token');
        const utilisateurStocke = localStorage.getItem('utilisateur');
        const themeStocke = localStorage.getItem('theme') || 'dark';

        if (tokenStocke && utilisateurStocke) {
            setToken(tokenStocke);
            setUtilisateur(JSON.parse(utilisateurStocke));
        }

        setTheme(themeStocke);
        document.documentElement.classList.toggle('dark', themeStocke === 'dark');
        setLoading(false);
    }, []);

    const connexion = (tokenRecu, utilisateurRecu) => {
        setToken(tokenRecu);
        setUtilisateur(utilisateurRecu);
        localStorage.setItem('token', tokenRecu);
        localStorage.setItem('utilisateur', JSON.stringify(utilisateurRecu));
    };

    // Met a jour partiellement l'utilisateur en contexte (ex: apres upload de photo)
    // sans devoir se reconnecter.
    const mettreAJourUtilisateur = (champs) => {
        setUtilisateur((prev) => {
            const nouveau = { ...prev, ...champs };
            localStorage.setItem('utilisateur', JSON.stringify(nouveau));
            return nouveau;
        });
    };

    const deconnexion = () => {
        setToken(null);
        setUtilisateur(null);
        localStorage.removeItem('token');
        localStorage.removeItem('utilisateur');
        window.location.href = '/login';
    };

    const toggleTheme = () => {
        const nouveauTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nouveauTheme);
        localStorage.setItem('theme', nouveauTheme);
        document.documentElement.classList.toggle('dark', nouveauTheme === 'dark');
    };

    return (
        <AuthContext.Provider value={{
            utilisateur,
            token,
            loading,
            theme,
            connexion,
            deconnexion,
            toggleTheme,
            mettreAJourUtilisateur,
            estConnecte: !!token
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;