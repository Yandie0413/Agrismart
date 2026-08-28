const db = require('../config/db');

const Meteo = {

    // Creer un releve meteo
    async creer(data) {
        const [result] = await db.execute(
            `INSERT INTO meteo
            (localisation_id, meteo_temperature, meteo_humidite, meteo_prevision, meteo_date_releve, meteo_pluviometrie)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [data.localisation_id, data.temperature, data.humidite, data.prevision, data.date_releve, data.pluviometrie ?? null]
        );
        return result.insertId;
    },

    // Trouver tous les releves
    async trouverTous() {
        const [rows] = await db.execute(
            `SELECT * FROM meteo ORDER BY meteo_date_releve DESC`
        );
        return rows;
    },

    // Trouver un releve par ID
    async trouverParId(id) {
        const [rows] = await db.execute(
            `SELECT * FROM meteo WHERE meteo_id = ?`,
            [id]
        );
        return rows[0];
    },

    // Trouver les releves par localisation
    async trouverParLocalisation(localisation_id) {
        const [rows] = await db.execute(
            `SELECT * FROM meteo WHERE localisation_id = ? ORDER BY meteo_date_releve DESC`,
            [localisation_id]
        );
        return rows;
    },

    // Supprimer un releve
    async supprimer(id) {
        const [result] = await db.execute(
            `DELETE FROM meteo WHERE meteo_id = ?`,
            [id]
        );
        return result.affectedRows;
    }

};

module.exports = Meteo;