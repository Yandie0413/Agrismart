// Migration one-shot : ciblage regional des alertes, pluviometrie sur les releves meteo,
// et signalements de prix abusifs sur le marche.
// Usage : node scripts/migrate-dashboards-avances.js
const db = require('../config/db');

async function colonneExiste(table, colonne) {
    const [rows] = await db.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, colonne]
    );
    return rows.length > 0;
}

async function ajouterColonne(table, colonne, definitionSql) {
    if (await colonneExiste(table, colonne)) {
        console.log(`Colonne ${table}.${colonne} deja presente, rien a faire.`);
        return;
    }
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${colonne} ${definitionSql}`);
    console.log(`Colonne ${table}.${colonne} ajoutee avec succes.`);
}

async function migrer() {
    try {
        await ajouterColonne('alertes', 'alerte_region', 'VARCHAR(100) NULL');
        await ajouterColonne('meteo', 'meteo_pluviometrie', 'DECIMAL(6,2) NULL');

        await db.execute(`
            CREATE TABLE IF NOT EXISTS signalements_prix (
                signalement_id INT AUTO_INCREMENT PRIMARY KEY,
                marche_id INT NOT NULL,
                utilisateur_id INT NOT NULL,
                signalement_raison TEXT NOT NULL,
                signalement_statut ENUM('en_attente','traite','rejete') NOT NULL DEFAULT 'en_attente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (marche_id) REFERENCES marches(marche_id) ON DELETE CASCADE,
                FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE
            )
        `);
        console.log('Table signalements_prix prete.');

        process.exit(0);
    } catch (err) {
        console.error('Erreur migration :', err.message);
        process.exit(1);
    }
}

migrer();
