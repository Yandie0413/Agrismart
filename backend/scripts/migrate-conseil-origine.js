// Migration one-shot : ajoute la colonne d'origine du conseil (expert vs genere par le systeme).
// Usage : node scripts/migrate-conseil-origine.js
const db = require('../config/db');

async function migrer() {
    try {
        const [colonnes] = await db.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'conseils_agricoles' AND COLUMN_NAME = 'conseil_origine'`
        );
        if (colonnes.length > 0) {
            console.log('Colonne conseil_origine deja presente, rien a faire.');
            process.exit(0);
        }
        await db.execute(
            `ALTER TABLE conseils_agricoles ADD COLUMN conseil_origine ENUM('expert','systeme') NOT NULL DEFAULT 'expert'`
        );
        console.log('Colonne conseil_origine ajoutee avec succes.');
        process.exit(0);
    } catch (err) {
        console.error('Erreur migration :', err.message);
        process.exit(1);
    }
}

migrer();
