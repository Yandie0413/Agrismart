// Migration one-shot : cree les tables du forum agricole (sujets + reponses).
// Usage : node scripts/migrate-forum.js
const db = require('../config/db');

async function migrer() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS forum_sujets (
                sujet_id INT AUTO_INCREMENT PRIMARY KEY,
                utilisateur_id INT NOT NULL,
                sujet_titre VARCHAR(255) NOT NULL,
                sujet_contenu TEXT NOT NULL,
                sujet_categorie VARCHAR(100) DEFAULT 'general',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE
            )
        `);
        console.log('Table forum_sujets prete.');

        await db.execute(`
            CREATE TABLE IF NOT EXISTS forum_reponses (
                reponse_id INT AUTO_INCREMENT PRIMARY KEY,
                sujet_id INT NOT NULL,
                utilisateur_id INT NOT NULL,
                reponse_contenu TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sujet_id) REFERENCES forum_sujets(sujet_id) ON DELETE CASCADE,
                FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE
            )
        `);
        console.log('Table forum_reponses prete.');

        process.exit(0);
    } catch (err) {
        console.error('Erreur migration :', err.message);
        process.exit(1);
    }
}

migrer();
