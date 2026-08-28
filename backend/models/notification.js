const db = require('../config/db');
const Utilisateur = require('./utilisateur');
const { envoyerPushNotification } = require('../utils/expoPush');

const Notification = {

    async creer(data) {
        const [result] = await db.execute(
            `INSERT INTO notifications
            (utilisateur_id, notification_type, notification_titre, notification_contenu, notification_lien)
            VALUES (?, ?, ?, ?, ?)`,
            [data.utilisateur_id, data.type, data.titre, data.contenu, data.lien || null]
        );

        // Push best-effort : ne doit jamais faire echouer la creation de la notification
        Utilisateur.trouverPushToken(data.utilisateur_id)
            .then((token) => {
                if (token) {
                    envoyerPushNotification(token, data.titre, data.contenu, {
                        type: data.type,
                        lien: data.lien || null,
                    });
                }
            })
            .catch((err) => console.error('Erreur push notification:', err.message));

        return result.insertId;
    },

    async trouverParUtilisateur(utilisateur_id) {
        const [rows] = await db.execute(
            `SELECT * FROM notifications 
            WHERE utilisateur_id = ? 
            ORDER BY created_at DESC 
            LIMIT 20`,
            [utilisateur_id]
        );
        return rows;
    },

    async compterNonLues(utilisateur_id) {
        const [rows] = await db.execute(
            `SELECT COUNT(*) as total FROM notifications 
            WHERE utilisateur_id = ? AND notification_lue = false`,
            [utilisateur_id]
        );
        return rows[0].total;
    },

    async marquerLue(notification_id, utilisateur_id) {
        const [result] = await db.execute(
            `UPDATE notifications SET notification_lue = true
            WHERE notification_id = ? AND utilisateur_id = ?`,
            [notification_id, utilisateur_id]
        );
        return result.affectedRows;
    },

    async marquerToutesLues(utilisateur_id) {
        const [result] = await db.execute(
            `UPDATE notifications SET notification_lue = true 
            WHERE utilisateur_id = ?`,
            [utilisateur_id]
        );
        return result.affectedRows;
    },

    async supprimer(notification_id, utilisateur_id) {
        const [result] = await db.execute(
            `DELETE FROM notifications WHERE notification_id = ? AND utilisateur_id = ?`,
            [notification_id, utilisateur_id]
        );
        return result.affectedRows;
    }
};

module.exports = Notification;