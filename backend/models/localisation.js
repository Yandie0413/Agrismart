const db = require('../config/db');

const Localisation = {

    async creer(data) {
        const [result] = await db.execute(
            `INSERT INTO localisations 
            (localisation_latitude, localisation_longitude, localisation_adresse) 
            VALUES (?, ?, ?)`,
            [data.latitude, data.longitude, data.adresse]
        );
        return result.insertId;
    },

    async trouverParId(id) {
        const [rows] = await db.execute(
            `SELECT * FROM localisations WHERE localisation_id = ?`,
            [id]
        );
        return rows[0];
    },

    async modifier(id, data) {
        const [result] = await db.execute(
            `UPDATE localisations SET 
            localisation_latitude = ?, localisation_longitude = ?, localisation_adresse = ? 
            WHERE localisation_id = ?`,
            [data.latitude, data.longitude, data.adresse, id]
        );
        return result.affectedRows;
    },

    async supprimer(id) {
        const [result] = await db.execute(
            `DELETE FROM localisations WHERE localisation_id = ?`,
            [id]
        );
        return result.affectedRows;
    },

    async trouverParAgriculteur(utilisateur_id) {
        const [rows] = await db.execute(
            `SELECT l.*, e.exploitation_nom, e.exploitation_superficie
            FROM localisations l
            JOIN exploitations e ON l.localisation_id = e.localisation_id
            WHERE e.utilisateur_id = ?`,
            [utilisateur_id]
        );
        return rows;
    },

    // Vrai si la localisation est rattachee a une exploitation de cet utilisateur
    async appartientAUtilisateur(localisation_id, utilisateur_id) {
        const [rows] = await db.execute(
            `SELECT 1 FROM exploitations WHERE localisation_id = ? AND utilisateur_id = ? LIMIT 1`,
            [localisation_id, utilisateur_id]
        );
        return rows.length > 0;
    },

    async trouverToutes() {
        const [rows] = await db.execute(
            `SELECT l.*, e.exploitation_nom, e.exploitation_superficie, 
            u.utilisateur_nom as agriculteur_nom
            FROM localisations l
            JOIN exploitations e ON l.localisation_id = e.localisation_id
            JOIN utilisateurs u ON e.utilisateur_id = u.utilisateur_id`
        );
        return rows;
    }

};

module.exports = Localisation;