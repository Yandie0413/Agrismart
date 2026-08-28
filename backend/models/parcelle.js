const db = require('../config/db');

const Parcelle = {

    // Creer une parcelle
    async creer(data) {
        const [result] = await db.execute(
            `INSERT INTO parcelles
            (exploitation_id, localisation_id, parcelle_nom, parcelle_superficie)
            VALUES (?, ?, ?, ?)`,
            [data.exploitation_id, data.localisation_id ?? null, data.nom, data.superficie]
        );
        return result.insertId;
    },

    // Trouver toutes les parcelles d'une exploitation (avec les coordonnees de sa localisation, le cas echeant)
    async trouverParExploitation(exploitation_id) {
        const [rows] = await db.execute(
            `SELECT p.*, l.localisation_latitude AS parcelle_latitude, l.localisation_longitude AS parcelle_longitude
            FROM parcelles p
            LEFT JOIN localisations l ON p.localisation_id = l.localisation_id
            WHERE p.exploitation_id = ?`,
            [exploitation_id]
        );
        return rows;
    },

    // Trouver une parcelle par ID
    async trouverParId(id) {
        const [rows] = await db.execute(
            `SELECT p.*, l.localisation_latitude AS parcelle_latitude, l.localisation_longitude AS parcelle_longitude
            FROM parcelles p
            LEFT JOIN localisations l ON p.localisation_id = l.localisation_id
            WHERE p.parcelle_id = ?`,
            [id]
        );
        return rows[0];
    },

    // Modifier une parcelle
    async modifier(id, data) {
        const [result] = await db.execute(
            `UPDATE parcelles SET
            parcelle_nom = ?, parcelle_superficie = ?, localisation_id = COALESCE(?, localisation_id)
            WHERE parcelle_id = ?`,
            [data.nom, data.superficie, data.localisation_id ?? null, id]
        );
        return result.affectedRows;
    },

    // Supprimer une parcelle
    async supprimer(id) {
        const [result] = await db.execute(
            `DELETE FROM parcelles WHERE parcelle_id = ?`,
            [id]
        );
        return result.affectedRows;
    }

};

module.exports = Parcelle;
