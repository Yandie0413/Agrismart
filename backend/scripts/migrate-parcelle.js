// Migration one-shot : cree la table parcelles et ajoute la colonne parcelle_id sur cultures.
// Usage : node scripts/migrate-parcelle.js
const db = require('../config/db');

async function migrer() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS parcelles (
                parcelle_id INT AUTO_INCREMENT PRIMARY KEY,
                exploitation_id INT NOT NULL,
                localisation_id INT NULL,
                parcelle_nom VARCHAR(255) NOT NULL,
                parcelle_superficie DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (exploitation_id) REFERENCES exploitations(exploitation_id) ON DELETE CASCADE,
                FOREIGN KEY (localisation_id) REFERENCES localisations(localisation_id) ON DELETE SET NULL
            )
        `);
        console.log('Table parcelles prete.');

        const [colonnes] = await db.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cultures' AND COLUMN_NAME = 'parcelle_id'`
        );
        if (colonnes.length > 0) {
            console.log('Colonne cultures.parcelle_id deja presente, rien a faire.');
        } else {
            await db.execute(`
                ALTER TABLE cultures ADD COLUMN parcelle_id INT NULL,
                ADD CONSTRAINT fk_cultures_parcelle FOREIGN KEY (parcelle_id) REFERENCES parcelles(parcelle_id) ON DELETE SET NULL
            `);
            console.log('Colonne cultures.parcelle_id ajoutee avec succes.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Erreur migration :', err.message);
        process.exit(1);
    }
}

migrer();
