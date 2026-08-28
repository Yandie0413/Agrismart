// Migration one-shot : horodatage des prix publies (necessaire au filtrage par periode) et
// nouvelle table offres_vente pour les stocks disponibles a la negociation directe (module 8.6).
// Usage : node scripts/migrate-marche-b2b.js
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
        // Les lignes deja existantes recoivent l'heure de la migration (date de creation reelle
        // inconnue) : c'est la meilleure valeur disponible, pas une donnee fabriquee.
        await ajouterColonne('marches', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL');

        await db.execute(`
            CREATE TABLE IF NOT EXISTS offres_vente (
                offre_id INT AUTO_INCREMENT PRIMARY KEY,
                utilisateur_id INT NOT NULL,
                produit_nom VARCHAR(150) NOT NULL,
                quantite DECIMAL(10,2) NOT NULL,
                unite ENUM('kg','tonnes') NOT NULL DEFAULT 'kg',
                prix_souhaite DECIMAL(12,2) NOT NULL,
                date_disponibilite DATE NULL,
                telephone_contact VARCHAR(30) NOT NULL,
                statut ENUM('active','vendue') NOT NULL DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE
            )
        `);
        console.log('Table offres_vente prete.');

        process.exit(0);
    } catch (err) {
        console.error('Erreur migration :', err.message);
        process.exit(1);
    }
}

migrer();
