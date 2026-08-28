const db = require('../config/db');
const Culture = require('./culture');

const Agriculteur = {

    async creer(data) {
        const [result] = await db.execute(
            `INSERT INTO agriculteurs
            (utilisateur_id, agriculteur_localisation, agriculteur_type_agri, agriculteur_region, agriculteur_district, agriculteur_commune)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [data.utilisateur_id, data.localisation, data.type_agri, data.region ?? null, data.district ?? null, data.commune ?? null]
        );
        return result.insertId;
    },

    async trouverParUtilisateur(utilisateur_id) {
        const [rows] = await db.execute(
            `SELECT a.*, u.utilisateur_nom, u.utilisateur_email, u.utilisateur_role
            FROM agriculteurs a
            JOIN utilisateurs u ON a.utilisateur_id = u.utilisateur_id
            WHERE a.utilisateur_id = ?`,
            [utilisateur_id]
        );
        return rows[0];
    },

    async modifier(utilisateur_id, data) {
        const [result] = await db.execute(
            `UPDATE agriculteurs SET
            agriculteur_localisation = COALESCE(?, agriculteur_localisation),
            agriculteur_type_agri = COALESCE(?, agriculteur_type_agri),
            agriculteur_region = COALESCE(?, agriculteur_region),
            agriculteur_district = COALESCE(?, agriculteur_district),
            agriculteur_commune = COALESCE(?, agriculteur_commune)
            WHERE utilisateur_id = ?`,
            [data.localisation ?? null, data.type_agri ?? null, data.region ?? null, data.district ?? null, data.commune ?? null, utilisateur_id]
        );
        return result.affectedRows;
    },

    // Utilisateur_id de tous les agriculteurs d'une region donnee (pour cibler les alertes/notifications)
    async trouverParRegion(region) {
        const [rows] = await db.execute(
            `SELECT utilisateur_id FROM agriculteurs WHERE agriculteur_region = ?`,
            [region]
        );
        return rows.map((r) => r.utilisateur_id);
    },

    async dashboard(utilisateur_id) {
        const [exploitations] = await db.execute(
            `SELECT COUNT(*) as total FROM exploitations WHERE utilisateur_id = ?`,
            [utilisateur_id]
        );
        const [cultures] = await db.execute(
            `SELECT COUNT(*) as total FROM cultures c
            JOIN exploitations e ON c.exploitation_id = e.exploitation_id
            WHERE e.utilisateur_id = ?`,
            [utilisateur_id]
        );
        const [alertes] = await db.execute(
            `SELECT * FROM alertes ORDER BY alerte_date DESC LIMIT 5`
        );
        const [conseils] = await db.execute(
            `SELECT * FROM conseils_agricoles ORDER BY conseil_date_publication DESC LIMIT 5`
        );
        const [evolution] = await db.execute(
            `SELECT DATE(c.culture_date_plantation) as jour, COUNT(*) as total
            FROM cultures c
            JOIN exploitations e ON c.exploitation_id = e.exploitation_id
            WHERE e.utilisateur_id = ? AND c.culture_date_plantation >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(c.culture_date_plantation)
            ORDER BY jour ASC`,
            [utilisateur_id]
        );
        const [messagesEnvoyes] = await db.execute(
            `SELECT COUNT(*) as total FROM messages WHERE expediteur_id = ?`,
            [utilisateur_id]
        );
        const toutes_cultures = await Culture.trouverToutesParUtilisateur(utilisateur_id);
        return {
            total_exploitations: exploitations[0].total,
            total_cultures: cultures[0].total,
            dernieres_alertes: alertes,
            derniers_conseils: conseils,
            evolution,
            toutes_cultures,
            a_envoye_message: messagesEnvoyes[0].total > 0
        };
    }

};

module.exports = Agriculteur;