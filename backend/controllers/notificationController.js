const Notification = require('../models/notification');
const { success, error } = require('../utils/response');

const notificationController = {

    async lister(req, res) {
        try {
            const notifications = await Notification.trouverParUtilisateur(req.utilisateur.id);
            return success(res, notifications);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async compterNonLues(req, res) {
        try {
            const total = await Notification.compterNonLues(req.utilisateur.id);
            return success(res, { total });
        } catch (err) {
            return error(res, err.message);
        }
    },

    async marquerLue(req, res) {
        try {
            await Notification.marquerLue(req.params.id, req.utilisateur.id);
            return success(res, null, 'Notification marquee comme lue');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async marquerToutesLues(req, res) {
        try {
            await Notification.marquerToutesLues(req.utilisateur.id);
            return success(res, null, 'Toutes les notifications marquees comme lues');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async supprimer(req, res) {
        try {
            await Notification.supprimer(req.params.id, req.utilisateur.id);
            return success(res, null, 'Notification supprimee');
        } catch (err) {
            return error(res, err.message);
        }
    }
};

module.exports = notificationController;