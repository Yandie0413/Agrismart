const db = require('../config/db');

const Alerte = {

    async creer(data) {
        const [result] = await db.execute(
            `INSERT INTO alertes
            (meteo_id, alerte_type, alerte_message, alerte_date, alerte_statut, alerte_region)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [data.meteo_id, data.type, data.message, data.date, data.statut, data.region ?? null]
        );
        return result.insertId;
    },

    // Alertes actives ciblant une region donnee (ou sans region = alerte generale)
    async trouverParRegion(region) {
        const [rows] = await db.execute(
            `SELECT * FROM alertes
            WHERE alerte_statut = 'active' AND (alerte_region IS NULL OR alerte_region = ?)
            ORDER BY alerte_date DESC LIMIT 10`,
            [region]
        );
        return rows;
    },

    async trouverToutes() {
        const [rows] = await db.execute(
            `SELECT a.*, m.meteo_temperature, m.meteo_prevision 
            FROM alertes a
            LEFT JOIN meteo m ON a.meteo_id = m.meteo_id
            ORDER BY a.alerte_date DESC`
        );
        return rows;
    },

    async trouverParId(id) {
        const [rows] = await db.execute(
            `SELECT * FROM alertes WHERE alerte_id = ?`,
            [id]
        );
        return rows[0];
    },

    async modifierStatut(id, statut) {
        const [result] = await db.execute(
            `UPDATE alertes SET alerte_statut = ? WHERE alerte_id = ?`,
            [statut, id]
        );
        return result.affectedRows;
    },

    async supprimer(id) {
        const [result] = await db.execute(
            `DELETE FROM alertes WHERE alerte_id = ?`,
            [id]
        );
        return result.affectedRows;
    },

    // Supprimer les alertes automatiques (sans releve manuel lie)
    async supprimerAlertesAutomatiques() {
        const [result] = await db.execute(
            `DELETE FROM alertes WHERE meteo_id IS NULL`
        );
        return result.affectedRows;
    }

};

module.exports = Alerte;