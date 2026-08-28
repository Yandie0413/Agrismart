const db = require('../config/db');

const Expert = {

    async creer(data) {
        const [result] = await db.execute(
            `INSERT INTO experts
            (utilisateur_id, expert_specialite, expert_certifications, expert_zone_couverture)
            VALUES (?, ?, ?, ?)`,
            [data.utilisateur_id, data.specialite, data.certifications, data.zone_couverture ?? null]
        );
        return result.insertId;
    },

    async trouverParUtilisateur(utilisateur_id) {
        const [rows] = await db.execute(
            `SELECT e.*, u.utilisateur_nom, u.utilisateur_email, u.utilisateur_role
            FROM experts e
            JOIN utilisateurs u ON e.utilisateur_id = u.utilisateur_id
            WHERE e.utilisateur_id = ?`,
            [utilisateur_id]
        );
        return rows[0];
    },

    async modifier(utilisateur_id, data) {
        const [result] = await db.execute(
            `UPDATE experts SET
            expert_specialite = COALESCE(?, expert_specialite),
            expert_certifications = COALESCE(?, expert_certifications),
            expert_zone_couverture = COALESCE(?, expert_zone_couverture)
            WHERE utilisateur_id = ?`,
            [data.specialite ?? null, data.certifications ?? null, data.zone_couverture ?? null, utilisateur_id]
        );
        return result.affectedRows;
    },

    // Modifier uniquement le fichier diplome (upload)
    async modifierDiplome(utilisateur_id, diplome) {
        const [result] = await db.execute(
            `UPDATE experts SET expert_diplome = ? WHERE utilisateur_id = ?`,
            [diplome, utilisateur_id]
        );
        return result.affectedRows;
    },

    // Valider ou rejeter un compte expert (admin)
    async modifierStatut(utilisateur_id, statut) {
        const [result] = await db.execute(
            `UPDATE experts SET expert_statut = ? WHERE utilisateur_id = ?`,
            [statut, utilisateur_id]
        );
        return result.affectedRows;
    },

    // Utilisateur_id de tous les experts dont la zone de couverture correspond a une region donnee
    async trouverParZone(region) {
        const [rows] = await db.execute(
            `SELECT utilisateur_id FROM experts WHERE expert_zone_couverture = ? AND expert_statut = 'valide'`,
            [region]
        );
        return rows.map((r) => r.utilisateur_id);
    },

    async dashboard(utilisateur_id) {
        const [conseils] = await db.execute(
            `SELECT COUNT(*) as total FROM conseils_agricoles WHERE utilisateur_id = ?`,
            [utilisateur_id]
        );
        const [messages] = await db.execute(
            `SELECT COUNT(*) as total FROM messages
            WHERE destinataire_id = ? AND message_lu = false`,
            [utilisateur_id]
        );
        const [messagesRecus] = await db.execute(
            `SELECT COUNT(*) as total FROM messages WHERE destinataire_id = ?`,
            [utilisateur_id]
        );
        const [messagesEnvoyes] = await db.execute(
            `SELECT COUNT(*) as total FROM messages WHERE expediteur_id = ?`,
            [utilisateur_id]
        );
        const [derniers_conseils] = await db.execute(
            `SELECT * FROM conseils_agricoles
            WHERE utilisateur_id = ?
            ORDER BY conseil_date_publication DESC LIMIT 5`,
            [utilisateur_id]
        );
        const [evolution] = await db.execute(
            `SELECT DATE(conseil_date_publication) as jour, COUNT(*) as total
            FROM conseils_agricoles
            WHERE utilisateur_id = ? AND conseil_date_publication >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(conseil_date_publication)
            ORDER BY jour ASC`,
            [utilisateur_id]
        );
        return {
            total_conseils: conseils[0].total,
            messages_non_lus: messages[0].total,
            messages_recus: messagesRecus[0].total,
            derniers_conseils,
            evolution,
            a_envoye_message: messagesEnvoyes[0].total > 0
        };
    }

};

module.exports = Expert;