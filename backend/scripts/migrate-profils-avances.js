// Migration one-shot : ajoute les champs profils avances (telephone, region/district/commune,
// zone de couverture / diplome / statut de validation expert).
// Usage : node scripts/migrate-profils-avances.js
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
        await ajouterColonne('utilisateurs', 'utilisateur_telephone', 'VARCHAR(20) NULL');

        await ajouterColonne('agriculteurs', 'agriculteur_region', 'VARCHAR(100) NULL');
        await ajouterColonne('agriculteurs', 'agriculteur_district', 'VARCHAR(100) NULL');
        await ajouterColonne('agriculteurs', 'agriculteur_commune', 'VARCHAR(100) NULL');

        await ajouterColonne('experts', 'expert_zone_couverture', 'VARCHAR(255) NULL');
        await ajouterColonne('experts', 'expert_diplome', 'VARCHAR(255) NULL');
        await ajouterColonne('experts', 'expert_statut', "ENUM('en_attente','valide','rejete') NOT NULL DEFAULT 'en_attente'");

        process.exit(0);
    } catch (err) {
        console.error('Erreur migration :', err.message);
        process.exit(1);
    }
}

migrer();
