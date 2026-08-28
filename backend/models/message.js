const db = require('../config/db');

const Message = {

    async envoyer(data) {
        const [result] = await db.execute(
            `INSERT INTO messages 
            (expediteur_id, destinataire_id, message_contenu) 
            VALUES (?, ?, ?)`,
            [data.expediteur_id, data.destinataire_id, data.contenu]
        );
        return result.insertId;
    },

    async trouverParId(id) {
        const [rows] = await db.execute(
            `SELECT m.*, 
            u1.utilisateur_nom as expediteur_nom,
            u2.utilisateur_nom as destinataire_nom
            FROM messages m
            JOIN utilisateurs u1 ON m.expediteur_id = u1.utilisateur_id
            JOIN utilisateurs u2 ON m.destinataire_id = u2.utilisateur_id
            WHERE m.message_id = ?`,
            [id]
        );
        return rows[0];
    },

    async trouverConversation(user1_id, user2_id) {
        const [rows] = await db.execute(
            `SELECT m.*,
            u1.utilisateur_nom as expediteur_nom,
            u2.utilisateur_nom as destinataire_nom
            FROM messages m
            JOIN utilisateurs u1 ON m.expediteur_id = u1.utilisateur_id
            JOIN utilisateurs u2 ON m.destinataire_id = u2.utilisateur_id
            WHERE (m.expediteur_id = ? AND m.destinataire_id = ?)
            OR (m.expediteur_id = ? AND m.destinataire_id = ?)
            ORDER BY m.message_date_envoi ASC`,
            [user1_id, user2_id, user2_id, user1_id]
        );
        return rows;
    },

    async marquerLu(id) {
        const [result] = await db.execute(
            `UPDATE messages SET message_lu = true WHERE message_id = ?`,
            [id]
        );
        return result.affectedRows;
    },

    async trouverNonLus(utilisateur_id) {
        const [rows] = await db.execute(
            `SELECT * FROM messages 
            WHERE destinataire_id = ? AND message_lu = false`,
            [utilisateur_id]
        );
        return rows;
    },
    async partagerDocument(data) {
        const [result] = await db.execute(
            `INSERT INTO messages 
            (expediteur_id, destinataire_id, message_contenu, message_document) 
            VALUES (?, ?, ?, ?)`,
            [data.expediteur_id, data.destinataire_id, data.contenu, data.document]
        );
        return result.insertId;
    },
    
    async archiverMessage(id) {
        const [result] = await db.execute(
            `UPDATE messages SET message_archive = true WHERE message_id = ?`,
            [id]
        );
        return result.affectedRows;
    }

};

module.exports = Message;