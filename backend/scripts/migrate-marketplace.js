// Migration one-shot : enrichit la fiche produit et l'offre de marche
// (description/unite/categorie du produit, vendeur/quantite de l'offre).
// Usage : node scripts/migrate-marketplace.js
const db = require('../config/db');

async function colonneExiste(table, colonne) {
    const [rows] = await db.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, colonne]
    );
    return rows.length > 0;
}

async function ajouterColonne(table, colonne, definition) {
    if (await colonneExiste(table, colonne)) {
        console.log(`Colonne ${table}.${colonne} deja presente, rien a faire.`);
        return;
    }
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${colonne} ${definition}`);
    console.log(`Colonne ${table}.${colonne} ajoutee avec succes.`);
}

async function migrer() {
    try {
        await ajouterColonne('produits_agricoles', 'produit_description', 'TEXT NULL');
        await ajouterColonne('produits_agricoles', 'produit_unite', "VARCHAR(20) NULL DEFAULT 'kg'");
        await ajouterColonne('produits_agricoles', 'produit_categorie', 'VARCHAR(50) NULL');
        await ajouterColonne('marches', 'marche_utilisateur_id', 'INT NULL');
        await ajouterColonne('marches', 'marche_quantite', 'VARCHAR(50) NULL');
        process.exit(0);
    } catch (err) {
        console.error('Erreur migration :', err.message);
        process.exit(1);
    }
}

migrer();
