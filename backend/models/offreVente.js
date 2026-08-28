const db = require('../config/db');

const OffreVente = {

    async creer(data) {
        const [result] = await db.execute(
            `INSERT INTO offres_vente
            (utilisateur_id, produit_nom, quantite, unite, prix_souhaite, date_disponibilite, telephone_contact)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                data.utilisateur_id, data.produit_nom, data.quantite, data.unite,
                data.prix_souhaite, data.date_disponibilite ?? null, data.telephone_contact
            ]
        );
        return result.insertId;
    },

    // Catalogue public des offres actives (les offres vendues restent en base mais ne sont plus listees)
    async trouverToutes() {
        const [rows] = await db.execute(
            `SELECT o.*, u.utilisateur_nom as vendeur_nom
            FROM offres_vente o
            JOIN utilisateurs u ON o.utilisateur_id = u.utilisateur_id
            WHERE o.statut = 'active'
            ORDER BY o.created_at DESC`
        );
        return rows;
    },

    async trouverParId(id) {
        const [rows] = await db.execute(
            `SELECT * FROM offres_vente WHERE offre_id = ?`,
            [id]
        );
        return rows[0];
    },

    async modifierStatut(id, statut) {
        const [result] = await db.execute(
            `UPDATE offres_vente SET statut = ? WHERE offre_id = ?`,
            [statut, id]
        );
        return result.affectedRows;
    }

};

module.exports = OffreVente;
