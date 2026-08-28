import React from 'react';

const API_BASE_URL = 'http://localhost:3000';

/**
 * Avatar utilisateur : affiche la photo de profil si elle existe, sinon repli sur les initiales.
 * Reutilise partout (Sidebar, Navbar, Profil, cartes de dashboard) pour une seule source de verite.
 */
const Avatar = ({ utilisateur, className = 'w-9 h-9 text-sm', ringClassName = '' }) => {
    const initiales = utilisateur?.nom?.charAt(0)?.toUpperCase() || 'U';
    const photoUrl = utilisateur?.photo ? `${API_BASE_URL}/uploads/${utilisateur.photo}` : null;

    if (photoUrl) {
        return (
            <img
                src={photoUrl}
                alt={utilisateur?.nom || 'Avatar'}
                className={`rounded-full object-cover flex-shrink-0 ${className} ${ringClassName}`}
            />
        );
    }

    return (
        <div className={`rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold flex-shrink-0 ${className} ${ringClassName}`}>
            {initiales}
        </div>
    );
};

export default Avatar;
