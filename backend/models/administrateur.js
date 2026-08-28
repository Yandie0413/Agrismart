const db = require('../config/db');

const Administrateur = {

    async creer(data) {
        const [result] = await db.execute(
            `INSERT INTO administrateurs 
            (utilisateur_id, admin_niveau_acces, admin_departement) 
            VALUES (?, ?, ?)`,
            [data.utilisateur_id, data.niveau_acces, data.departement]
        );
        return result.insertId;
    },

    async trouverParUtilisateur(utilisateur_id) {
        const [rows] = await db.execute(
            `SELECT a.*, u.utilisateur_nom, u.utilisateur_email, u.utilisateur_role
            FROM administrateurs a
            JOIN utilisateurs u ON a.utilisateur_id = u.utilisateur_id
            WHERE a.utilisateur_id = ?`,
            [utilisateur_id]
        );
        return rows[0];
    },

    async modifier(utilisateur_id, data) {
        const [result] = await db.execute(
            `UPDATE administrateurs SET 
            admin_niveau_acces = ?, admin_departement = ? 
            WHERE utilisateur_id = ?`,
            [data.niveau_acces, data.departement, utilisateur_id]
        );
        return result.affectedRows;
    },

    async dashboard() {
        const [utilisateurs] = await db.execute(
            `SELECT COUNT(*) as total FROM utilisateurs`
        );
        const [agriculteurs] = await db.execute(
            `SELECT COUNT(*) as total FROM agriculteurs`
        );
        const [experts] = await db.execute(
            `SELECT COUNT(*) as total FROM experts`
        );
        const [exploitations] = await db.execute(
            `SELECT COUNT(*) as total FROM exploitations`
        );
        const [cultures] = await db.execute(
            `SELECT COUNT(*) as total FROM cultures`
        );
        const [alertes_actives] = await db.execute(
            `SELECT COUNT(*) as total FROM alertes WHERE alerte_statut = 'active'`
        );
        const [evolution] = await db.execute(
            `SELECT DATE(created_at) as jour, COUNT(*) as total
            FROM utilisateurs
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(created_at)
            ORDER BY jour ASC`
        );
        const [evolutionAlertes] = await db.execute(
            `SELECT DATE(alerte_date) as jour, COUNT(*) as total
            FROM alertes
            WHERE alerte_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(alerte_date)
            ORDER BY jour ASC`
        );
        const [derniers_utilisateurs] = await db.execute(
            `SELECT utilisateur_id, utilisateur_nom, utilisateur_email, utilisateur_role, created_at
            FROM utilisateurs ORDER BY created_at DESC LIMIT 6`
        );
        const [dernieres_alertes] = await db.execute(
            `SELECT * FROM alertes ORDER BY alerte_date DESC LIMIT 5`
        );
        const [derniers_conseils] = await db.execute(
            `SELECT * FROM conseils_agricoles ORDER BY conseil_date_publication DESC LIMIT 5`
        );
        const [culturesParType] = await db.execute(
            `SELECT culture_type, COUNT(*) as total FROM cultures GROUP BY culture_type ORDER BY total DESC LIMIT 6`
        );
        const [culturesActives] = await db.execute(
            `SELECT COUNT(*) as total FROM cultures WHERE culture_statut != 'recoltee'`
        );
        return {
            total_utilisateurs: utilisateurs[0].total,
            total_agriculteurs: agriculteurs[0].total,
            total_experts: experts[0].total,
            total_exploitations: exploitations[0].total,
            total_cultures: cultures[0].total,
            alertes_actives: alertes_actives[0].total,
            evolution,
            evolution_alertes: evolutionAlertes,
            derniers_utilisateurs,
            dernieres_alertes,
            derniers_conseils,
            cultures_par_type: culturesParType,
            cultures_actives: culturesActives[0].total
        };
    },

    async listerUtilisateurs() {
        const [rows] = await db.execute(
            `SELECT utilisateur_id, utilisateur_nom, utilisateur_email,
            utilisateur_role, utilisateur_photo, created_at FROM utilisateurs`
        );
        return rows;
    },

    async supprimerUtilisateur(id) {
        const [result] = await db.execute(
            `DELETE FROM utilisateurs WHERE utilisateur_id = ?`,
            [id]
        );
        return result.affectedRows;
    },

    async modifierRoleUtilisateur(id, nouveauRole) {
        const [result] = await db.execute(
            `UPDATE utilisateurs SET utilisateur_role = ? WHERE utilisateur_id = ?`,
            [nouveauRole, id]
        );
        return result.affectedRows;
    }

};

module.exports = Administrateur;