// Migration one-shot : validation expert des diagnostics IA (conseil_valide_par_expert)
// et likes sur le forum (forum_likes).
// Usage : node scripts/migrate-conseils-forum.js
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
        await ajouterColonne('conseils_agricoles', 'conseil_valide_par_expert', 'BOOLEAN NULL');

        await db.execute(`
            CREATE TABLE IF NOT EXISTS forum_likes (
                like_id INT AUTO_INCREMENT PRIMARY KEY,
                cible_type ENUM('sujet','reponse') NOT NULL,
                cible_id INT NOT NULL,
                utilisateur_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_forum_like (cible_type, cible_id, utilisateur_id),
                FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE
            )
        `);
        console.log('Table forum_likes prete.');

        process.exit(0);
    } catch (err) {
        console.error('Erreur migration :', err.message);
        process.exit(1);
    }
}

migrer();
