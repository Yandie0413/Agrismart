// Migration one-shot : ajoute la colonne de stockage de la photo de profil utilisateur.
// Usage : node scripts/migrate-utilisateur-photo.js
const db = require('../config/db');

async function migrer() {
    try {
        const [colonnes] = await db.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'utilisateurs' AND COLUMN_NAME = 'utilisateur_photo'`
        );
        if (colonnes.length > 0) {
            console.log('Colonne utilisateur_photo deja presente, rien a faire.');
            process.exit(0);
        }
        await db.execute(
            `ALTER TABLE utilisateurs ADD COLUMN utilisateur_photo VARCHAR(255) NULL`
        );
        console.log('Colonne utilisateur_photo ajoutee avec succes.');
        process.exit(0);
    } catch (err) {
        console.error('Erreur migration :', err.message);
        process.exit(1);
    }
}

migrer();
