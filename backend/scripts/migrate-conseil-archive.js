// Migration one-shot : ajoute un vrai indicateur d'archivage pour les conseils,
// au lieu d'ecraser la categorie (bug corrige : l'archivage detruisait l'info de categorie
// et le conseil restait quand meme visible dans la liste normale).
// Usage : node scripts/migrate-conseil-archive.js
const db = require('../config/db');

async function migrer() {
    try {
        const [colonnes] = await db.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'conseils_agricoles' AND COLUMN_NAME = 'conseil_archive'`
        );
        if (colonnes.length > 0) {
            console.log('Colonne conseil_archive deja presente, rien a faire.');
            process.exit(0);
        }
        await db.execute(
            `ALTER TABLE conseils_agricoles ADD COLUMN conseil_archive TINYINT(1) NOT NULL DEFAULT 0`
        );
        console.log('Colonne conseil_archive ajoutee avec succes.');
        process.exit(0);
    } catch (err) {
        console.error('Erreur migration :', err.message);
        process.exit(1);
    }
}

migrer();
