const db = require('../config/db');

const SignalementPrix = {

    async creer(data) {
        const [result] = await db.execute(
            `INSERT INTO signalements_prix (marche_id, utilisateur_id, signalement_raison)
            VALUES (?, ?, ?)`,
            [data.marche_id, data.utilisateur_id, data.raison]
        );
        return result.insertId;
    },

    async trouverTous() {
        const [rows] = await db.execute(
            `SELECT s.*, u.utilisateur_nom, m.marche_nom, m.marche_localisation, m.prix_agricole
            FROM signalements_prix s
            JOIN utilisateurs u ON s.utilisateur_id = u.utilisateur_id
            JOIN marches m ON s.marche_id = m.marche_id
            ORDER BY s.created_at DESC`
        );
        return rows;
    },

    async modifierStatut(id, statut) {
        const [result] = await db.execute(
            `UPDATE signalements_prix SET signalement_statut = ? WHERE signalement_id = ?`,
            [statut, id]
        );
        return result.affectedRows;
    }

};

module.exports = SignalementPrix;
