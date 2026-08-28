const db = require('../config/db');

const Culture = {

    // Creer une culture
    async creer(data) {
        const [result] = await db.execute(
            `INSERT INTO cultures
            (exploitation_id, culture_type, culture_date_plantation, culture_statut, parcelle_id, culture_variete, culture_type_sol)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                data.exploitation_id, data.type, data.date_plantation, data.statut, data.parcelle_id ?? null,
                data.variete ?? null, data.type_sol ?? null
            ]
        );
        return result.insertId;
    },

    // Trouver toutes les cultures d'une exploitation (avec le nom de la parcelle assignee, le cas echeant)
    async trouverParExploitation(exploitation_id) {
        const [rows] = await db.execute(
            `SELECT c.*, p.parcelle_nom AS parcelle_nom
            FROM cultures c
            LEFT JOIN parcelles p ON c.parcelle_id = p.parcelle_id
            WHERE c.exploitation_id = ?`,
            [exploitation_id]
        );
        return rows;
    },

    // Trouver une culture par ID
    async trouverParId(id) {
        const [rows] = await db.execute(
            `SELECT * FROM cultures WHERE culture_id = ?`,
            [id]
        );
        return rows[0];
    },

    // Modifier une culture
    async modifier(id, data) {
        const [result] = await db.execute(
            `UPDATE cultures SET
            culture_type = ?, culture_date_plantation = ?, culture_statut = ?, parcelle_id = ?,
            culture_variete = COALESCE(?, culture_variete), culture_type_sol = COALESCE(?, culture_type_sol)
            WHERE culture_id = ?`,
            [
                data.type, data.date_plantation, data.statut, data.parcelle_id ?? null,
                data.variete ?? null, data.type_sol ?? null, id
            ]
        );
        return result.affectedRows;
    },

    // Supprimer une culture
    async supprimer(id) {
        const [result] = await db.execute(
            `DELETE FROM cultures WHERE culture_id = ?`,
            [id]
        );
        return result.affectedRows;
    },
    // Toutes les cultures d'un agriculteur, toutes exploitations confondues,
    // avec stade et jours restants avant recolte (meme formule que calendrierAgricole).
    async trouverToutesParUtilisateur(utilisateur_id) {
        const [rows] = await db.execute(
            `SELECT c.*, e.exploitation_nom, p.parcelle_nom AS parcelle_nom,
            DATEDIFF(NOW(), c.culture_date_plantation) as jours_depuis_plantation,
            CASE
                WHEN DATEDIFF(NOW(), c.culture_date_plantation) < 30 THEN 'Germination'
                WHEN DATEDIFF(NOW(), c.culture_date_plantation) < 90 THEN 'Croissance'
                WHEN DATEDIFF(NOW(), c.culture_date_plantation) < 150 THEN 'Floraison'
                ELSE 'Recolte'
            END as stade_culture
            FROM cultures c
            JOIN exploitations e ON c.exploitation_id = e.exploitation_id
            LEFT JOIN parcelles p ON c.parcelle_id = p.parcelle_id
            WHERE e.utilisateur_id = ?
            ORDER BY c.culture_date_plantation ASC`,
            [utilisateur_id]
        );
        return rows;
    },

    async calendrierAgricole(exploitation_id) {
        const [rows] = await db.execute(
            `SELECT c.*, 
            DATEDIFF(NOW(), c.culture_date_plantation) as jours_depuis_plantation,
            CASE 
                WHEN DATEDIFF(NOW(), c.culture_date_plantation) < 30 THEN 'Germination'
                WHEN DATEDIFF(NOW(), c.culture_date_plantation) < 90 THEN 'Croissance'
                WHEN DATEDIFF(NOW(), c.culture_date_plantation) < 150 THEN 'Floraison'
                ELSE 'Recolte'
            END as stade_culture
            FROM cultures c
            WHERE c.exploitation_id = ?
            ORDER BY c.culture_date_plantation ASC`,
            [exploitation_id]
        );
        return rows;
    },
    
    async calculerRendement(id) {
        const [rows] = await db.execute(
            `SELECT c.*, e.exploitation_superficie,
            ROUND(e.exploitation_superficie * 2.5, 2) as rendement_estime_tonnes
            FROM cultures c
            JOIN exploitations e ON c.exploitation_id = e.exploitation_id
            WHERE c.culture_id = ?`,
            [id]
        );
        return rows[0];
    }
};

module.exports = Culture;