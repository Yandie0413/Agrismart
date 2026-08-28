const db = require('../config/db');

const Forum = {

    async creerSujet(data) {
        const [result] = await db.execute(
            `INSERT INTO forum_sujets (utilisateur_id, sujet_titre, sujet_contenu, sujet_categorie)
            VALUES (?, ?, ?, ?)`,
            [data.utilisateur_id, data.titre, data.contenu, data.categorie || 'general']
        );
        return result.insertId;
    },

    async trouverSujets(utilisateur_id) {
        const [rows] = await db.execute(
            `SELECT s.*, u.utilisateur_nom as auteur, u.utilisateur_role as auteur_role,
            (SELECT COUNT(*) FROM forum_reponses r WHERE r.sujet_id = s.sujet_id) as nombre_reponses,
            (SELECT COUNT(*) FROM forum_likes l WHERE l.cible_type = 'sujet' AND l.cible_id = s.sujet_id) as nombre_likes,
            (SELECT COUNT(*) FROM forum_likes l WHERE l.cible_type = 'sujet' AND l.cible_id = s.sujet_id AND l.utilisateur_id = ?) > 0 as deja_like
            FROM forum_sujets s
            JOIN utilisateurs u ON s.utilisateur_id = u.utilisateur_id
            ORDER BY s.created_at DESC`,
            [utilisateur_id]
        );
        return rows;
    },

    async trouverSujetParId(id, utilisateur_id) {
        const [rows] = await db.execute(
            `SELECT s.*, u.utilisateur_nom as auteur, u.utilisateur_role as auteur_role,
            (SELECT COUNT(*) FROM forum_likes l WHERE l.cible_type = 'sujet' AND l.cible_id = s.sujet_id) as nombre_likes,
            (SELECT COUNT(*) FROM forum_likes l WHERE l.cible_type = 'sujet' AND l.cible_id = s.sujet_id AND l.utilisateur_id = ?) > 0 as deja_like
            FROM forum_sujets s
            JOIN utilisateurs u ON s.utilisateur_id = u.utilisateur_id
            WHERE s.sujet_id = ?`,
            [utilisateur_id, id]
        );
        return rows[0];
    },

    async supprimerSujet(id) {
        const [result] = await db.execute(`DELETE FROM forum_sujets WHERE sujet_id = ?`, [id]);
        return result.affectedRows;
    },

    async creerReponse(data) {
        const [result] = await db.execute(
            `INSERT INTO forum_reponses (sujet_id, utilisateur_id, reponse_contenu)
            VALUES (?, ?, ?)`,
            [data.sujet_id, data.utilisateur_id, data.contenu]
        );
        return result.insertId;
    },

    async trouverReponses(sujet_id, utilisateur_id) {
        const [rows] = await db.execute(
            `SELECT r.*, u.utilisateur_nom as auteur, u.utilisateur_role as auteur_role,
            (SELECT COUNT(*) FROM forum_likes l WHERE l.cible_type = 'reponse' AND l.cible_id = r.reponse_id) as nombre_likes,
            (SELECT COUNT(*) FROM forum_likes l WHERE l.cible_type = 'reponse' AND l.cible_id = r.reponse_id AND l.utilisateur_id = ?) > 0 as deja_like
            FROM forum_reponses r
            JOIN utilisateurs u ON r.utilisateur_id = u.utilisateur_id
            WHERE r.sujet_id = ?
            ORDER BY r.created_at ASC`,
            [utilisateur_id, sujet_id]
        );
        return rows;
    },

    async trouverReponseParId(id) {
        const [rows] = await db.execute(`SELECT * FROM forum_reponses WHERE reponse_id = ?`, [id]);
        return rows[0];
    },

    async supprimerReponse(id) {
        const [result] = await db.execute(`DELETE FROM forum_reponses WHERE reponse_id = ?`, [id]);
        return result.affectedRows;
    },

    // Bascule le like d'un utilisateur sur un sujet ou une reponse. Retourne true si desormais aime, false sinon.
    async toggleLike(cible_type, cible_id, utilisateur_id) {
        const [existant] = await db.execute(
            `SELECT like_id FROM forum_likes WHERE cible_type = ? AND cible_id = ? AND utilisateur_id = ?`,
            [cible_type, cible_id, utilisateur_id]
        );
        if (existant.length > 0) {
            await db.execute(`DELETE FROM forum_likes WHERE like_id = ?`, [existant[0].like_id]);
            return false;
        }
        await db.execute(
            `INSERT INTO forum_likes (cible_type, cible_id, utilisateur_id) VALUES (?, ?, ?)`,
            [cible_type, cible_id, utilisateur_id]
        );
        return true;
    },

    async compterLikes(cible_type, cible_id) {
        const [rows] = await db.execute(
            `SELECT COUNT(*) as total FROM forum_likes WHERE cible_type = ? AND cible_id = ?`,
            [cible_type, cible_id]
        );
        return rows[0].total;
    }

};

module.exports = Forum;
