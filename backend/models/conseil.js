const db = require('../config/db');

const Conseil = {

    // Creer un conseil
    async creer(data) {
        const [result] = await db.execute(
            `INSERT INTO conseils_agricoles
            (utilisateur_id, culture_id, conseil_titre, conseil_contenu, conseil_date_publication, conseil_categorie, conseil_origine)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [data.utilisateur_id, data.culture_id, data.titre, data.contenu, data.date_publication, data.categorie, data.origine || 'expert']
        );
        return result.insertId;
    },

    // Trouver tous les conseils (non archives)
    async trouverTous() {
        const [rows] = await db.execute(
            `SELECT c.*, u.utilisateur_nom as auteur
            FROM conseils_agricoles c
            JOIN utilisateurs u ON c.utilisateur_id = u.utilisateur_id
            WHERE c.conseil_archive = 0
            ORDER BY c.conseil_date_publication DESC`
        );
        return rows;
    },

    // Trouver les conseils visibles pour un utilisateur (les conseils "systeme" ne sont visibles que par leur destinataire,
    // les conseils archives ne sont jamais renvoyes dans la liste normale)
    async trouverVisiblesPour(utilisateur_id, role) {
        if (role === 'agriculteur') {
            const [rows] = await db.execute(
                `SELECT c.*, u.utilisateur_nom as auteur
                FROM conseils_agricoles c
                JOIN utilisateurs u ON c.utilisateur_id = u.utilisateur_id
                WHERE c.conseil_archive = 0
                AND (c.conseil_origine = 'expert' OR (c.conseil_origine = 'systeme' AND c.utilisateur_id = ?))
                ORDER BY c.conseil_date_publication DESC`,
                [utilisateur_id]
            );
            return rows;
        }
        return this.trouverTous();
    },

    // Supprimer les conseils generes automatiquement pour un utilisateur (evite l'accumulation a chaque refresh)
    async supprimerGeneresParUtilisateur(utilisateur_id) {
        const [result] = await db.execute(
            `DELETE FROM conseils_agricoles WHERE utilisateur_id = ? AND conseil_origine = 'systeme'`,
            [utilisateur_id]
        );
        return result.affectedRows;
    },

    // Trouver un conseil par ID
    async trouverParId(id) {
        const [rows] = await db.execute(
            `SELECT c.*, u.utilisateur_nom as auteur 
            FROM conseils_agricoles c
            JOIN utilisateurs u ON c.utilisateur_id = u.utilisateur_id
            WHERE c.conseil_id = ?`,
            [id]
        );
        return rows[0];
    },

    // Trouver les conseils par culture
    async trouverParCulture(culture_id) {
        const [rows] = await db.execute(
            `SELECT * FROM conseils_agricoles WHERE culture_id = ?`,
            [culture_id]
        );
        return rows;
    },

    // Modifier un conseil
    async modifier(id, data) {
        const [result] = await db.execute(
            `UPDATE conseils_agricoles SET 
            conseil_titre = ?, conseil_contenu = ?, conseil_categorie = ? 
            WHERE conseil_id = ?`,
            [data.titre, data.contenu, data.categorie, id]
        );
        return result.affectedRows;
    },

    // Supprimer un conseil
    async supprimer(id) {
        const [result] = await db.execute(
            `DELETE FROM conseils_agricoles WHERE conseil_id = ?`,
            [id]
        );
        return result.affectedRows;
    },
    async archiver(id) {
        const [result] = await db.execute(
            `UPDATE conseils_agricoles SET conseil_archive = 1 WHERE conseil_id = ?`,
            [id]
        );
        return result.affectedRows;
    },
    async desarchiver(id) {
        const [result] = await db.execute(
            `UPDATE conseils_agricoles SET conseil_archive = 0 WHERE conseil_id = ?`,
            [id]
        );
        return result.affectedRows;
    },

    // Validation par un expert d'un diagnostic genere par le systeme (true = confirme, false = infirme)
    async validerParExpert(id, valide) {
        const [result] = await db.execute(
            `UPDATE conseils_agricoles SET conseil_valide_par_expert = ? WHERE conseil_id = ?`,
            [valide, id]
        );
        return result.affectedRows;
    }
};

module.exports = Conseil;