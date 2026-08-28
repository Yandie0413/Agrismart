const Message = require('../models/message');
const Notification = require('../models/notification');
const Utilisateur = require('../models/utilisateur');
const { success, error } = require('../utils/response');

const messageController = {

    async envoyer(req, res) {
        try {
            const { destinataire_id, contenu } = req.body;
            const expediteur_id = req.utilisateur.id;

            const id = await Message.envoyer({ expediteur_id, destinataire_id, contenu });
            const message = await Message.trouverParId(id);

            // Creer une notification pour le destinataire
            const expediteur = await Utilisateur.trouverParId(expediteur_id);
            await Notification.creer({
                utilisateur_id: destinataire_id,
                type: 'message',
                titre: `Nouveau message de ${expediteur.utilisateur_nom}`,
                contenu: contenu.length > 60 ? contenu.substring(0, 60) + '...' : contenu,
                lien: '/messages'
            });

            return success(res, message, 'Message envoye', 201);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async conversation(req, res) {
        try {
            const user1_id = req.utilisateur.id;
            const user2_id = req.params.user_id;
            const messages = await Message.trouverConversation(user1_id, user2_id);
            return success(res, messages);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async nonLus(req, res) {
        try {
            const utilisateur_id = req.utilisateur.id;
            const messages = await Message.trouverNonLus(utilisateur_id);
            return success(res, messages);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async marquerLu(req, res) {
        try {
            const message = await Message.trouverParId(req.params.id);
            if (!message) return error(res, 'Message non trouve', 404);
            if (message.destinataire_id !== req.utilisateur.id) {
                return error(res, 'Acces non autorise a ce message', 403);
            }
            await Message.marquerLu(req.params.id);
            return success(res, null, 'Message marque comme lu');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async partagerDocument(req, res) {
        try {
            const { destinataire_id, contenu } = req.body;
            const expediteur_id = req.utilisateur.id;
            const document = req.file ? req.file.filename : null;

            const id = await Message.partagerDocument({ expediteur_id, destinataire_id, contenu, document });
            const message = await Message.trouverParId(id);

            // Notification pour le destinataire
            const expediteur = await Utilisateur.trouverParId(expediteur_id);
            await Notification.creer({
                utilisateur_id: destinataire_id,
                type: 'message',
                titre: `Document partage par ${expediteur.utilisateur_nom}`,
                contenu: 'Un document a ete partage avec vous.',
                lien: '/messages'
            });

            return success(res, message, 'Document partage', 201);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async archiverMessage(req, res) {
        try {
            const message = await Message.trouverParId(req.params.id);
            if (!message) return error(res, 'Message non trouve', 404);
            if (message.expediteur_id !== req.utilisateur.id && message.destinataire_id !== req.utilisateur.id) {
                return error(res, 'Acces non autorise a ce message', 403);
            }
            await Message.archiverMessage(req.params.id);
            return success(res, null, 'Message archive');
        } catch (err) {
            return error(res, err.message);
        }
    }
};

module.exports = messageController;