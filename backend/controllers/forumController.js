const Forum = require('../models/forum');
const Notification = require('../models/notification');
const { success, error } = require('../utils/response');

const forumController = {

    async listerSujets(req, res) {
        try {
            const sujets = await Forum.trouverSujets(req.utilisateur.id);
            return success(res, sujets);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async obtenirSujet(req, res) {
        try {
            const sujet = await Forum.trouverSujetParId(req.params.id, req.utilisateur.id);
            if (!sujet) return error(res, 'Sujet non trouve', 404);
            const reponses = await Forum.trouverReponses(req.params.id, req.utilisateur.id);
            return success(res, { ...sujet, reponses });
        } catch (err) {
            return error(res, err.message);
        }
    },

    async creerSujet(req, res) {
        try {
            const { titre, contenu, categorie } = req.body;
            if (!titre?.trim() || !contenu?.trim()) {
                return error(res, 'Titre et contenu obligatoires', 400);
            }
            const id = await Forum.creerSujet({ utilisateur_id: req.utilisateur.id, titre, contenu, categorie });
            const sujet = await Forum.trouverSujetParId(id);
            return success(res, sujet, 'Sujet cree', 201);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async supprimerSujet(req, res) {
        try {
            const sujet = await Forum.trouverSujetParId(req.params.id);
            if (!sujet) return error(res, 'Sujet non trouve', 404);
            if (sujet.utilisateur_id !== req.utilisateur.id && req.utilisateur.role !== 'administrateur') {
                return error(res, 'Acces non autorise a ce sujet', 403);
            }
            await Forum.supprimerSujet(req.params.id);
            return success(res, null, 'Sujet supprime');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async creerReponse(req, res) {
        try {
            const { contenu } = req.body;
            if (!contenu?.trim()) return error(res, 'Contenu obligatoire', 400);

            const sujet = await Forum.trouverSujetParId(req.params.id);
            if (!sujet) return error(res, 'Sujet non trouve', 404);

            const id = await Forum.creerReponse({ sujet_id: req.params.id, utilisateur_id: req.utilisateur.id, contenu });

            // Notifie l'auteur du sujet (sauf s'il repond a son propre sujet)
            if (sujet.utilisateur_id !== req.utilisateur.id) {
                await Notification.creer({
                    utilisateur_id: sujet.utilisateur_id,
                    type: 'forum',
                    titre: `Nouvelle reponse sur "${sujet.sujet_titre}"`,
                    contenu: contenu.length > 60 ? contenu.substring(0, 60) + '...' : contenu,
                    lien: '/forum'
                });
            }

            const reponses = await Forum.trouverReponses(req.params.id, req.utilisateur.id);
            return success(res, reponses, 'Reponse ajoutee', 201);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async supprimerReponse(req, res) {
        try {
            const reponse = await Forum.trouverReponseParId(req.params.id);
            if (!reponse) return error(res, 'Reponse non trouvee', 404);
            if (reponse.utilisateur_id !== req.utilisateur.id && req.utilisateur.role !== 'administrateur') {
                return error(res, 'Acces non autorise a cette reponse', 403);
            }
            await Forum.supprimerReponse(req.params.id);
            return success(res, null, 'Reponse supprimee');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async toggleLikeSujet(req, res) {
        try {
            const sujet = await Forum.trouverSujetParId(req.params.id, req.utilisateur.id);
            if (!sujet) return error(res, 'Sujet non trouve', 404);
            const aime = await Forum.toggleLike('sujet', req.params.id, req.utilisateur.id);
            const nombre_likes = await Forum.compterLikes('sujet', req.params.id);
            return success(res, { deja_like: aime, nombre_likes });
        } catch (err) {
            return error(res, err.message);
        }
    },

    async toggleLikeReponse(req, res) {
        try {
            const reponse = await Forum.trouverReponseParId(req.params.id);
            if (!reponse) return error(res, 'Reponse non trouvee', 404);
            const aime = await Forum.toggleLike('reponse', req.params.id, req.utilisateur.id);
            const nombre_likes = await Forum.compterLikes('reponse', req.params.id);
            return success(res, { deja_like: aime, nombre_likes });
        } catch (err) {
            return error(res, err.message);
        }
    }

};

module.exports = forumController;
