const Produit = require('../models/produit');
const SignalementPrix = require('../models/signalementPrix');
const OffreVente = require('../models/offreVente');
const { success, error } = require('../utils/response');

const produitController = {

    async creer(req, res) {
        try {
            const { nom, description, unite, categorie } = req.body;
            const date_maj = new Date().toISOString().split('T')[0];
            const id = await Produit.creer({ nom, date_maj, description, unite, categorie });
            const produit = await Produit.trouverParId(id);
            return success(res, produit, 'Produit cree', 201);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async lister(req, res) {
        try {
            const produits = await Produit.trouverTous();
            return success(res, produits);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async obtenir(req, res) {
        try {
            const produit = await Produit.trouverParId(req.params.id);
            if (!produit) return error(res, 'Produit non trouve', 404);
            return success(res, produit);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async modifier(req, res) {
        try {
            const { nom, description, unite, categorie } = req.body;
            const date_maj = new Date().toISOString().split('T')[0];
            await Produit.modifier(req.params.id, { nom, date_maj, description, unite, categorie });
            const produit = await Produit.trouverParId(req.params.id);
            return success(res, produit, 'Produit modifie');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async supprimer(req, res) {
        try {
            await Produit.supprimer(req.params.id);
            return success(res, null, 'Produit supprime');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async ajouterMarche(req, res) {
        try {
            const { nom, localisation, prix, quantite } = req.body;
            const produit_id = req.params.id;
            // Le vendeur est toujours l'utilisateur connecte, jamais une valeur du body
            const utilisateur_id = req.utilisateur.role === 'agriculteur' ? req.utilisateur.id : null;
            await Produit.ajouterMarche({ produit_id, nom, localisation, prix, quantite, utilisateur_id });
            const marches = await Produit.trouverMarches(produit_id);
            return success(res, marches, 'Marche ajoute', 201);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async listerMarches(req, res) {
        try {
            const marches = await Produit.trouverMarches(req.params.id);
            return success(res, marches);
        } catch (err) {
            return error(res, err.message);
        }
    },
    async historiquePrix(req, res) {
        try {
            const { periode } = req.query;
            const historique = await Produit.historiquePrix(req.params.id, periode);
            return success(res, historique);
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Signaler un prix comme abusif (marche_id passe en parametre)
    async signalerPrix(req, res) {
        try {
            const { raison } = req.body;
            if (!raison?.trim()) return error(res, 'La raison du signalement est obligatoire', 400);
            const id = await SignalementPrix.creer({
                marche_id: req.params.marcheId,
                utilisateur_id: req.utilisateur.id,
                raison: raison.trim()
            });
            return success(res, { signalement_id: id }, 'Prix signale, un administrateur va l\'examiner', 201);
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Lister les signalements de prix (admin)
    async listerSignalements(req, res) {
        try {
            const signalements = await SignalementPrix.trouverTous();
            return success(res, signalements);
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Traiter un signalement (admin)
    async traiterSignalement(req, res) {
        try {
            const { statut } = req.body;
            if (!['traite', 'rejete'].includes(statut)) return error(res, 'Statut invalide', 400);
            await SignalementPrix.modifierStatut(req.params.id, statut);
            return success(res, null, 'Signalement mis a jour');
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Declarer un stock disponible a la negociation directe (module 8.6)
    async creerOffre(req, res) {
        try {
            const { produit_nom, quantite, unite, prix_souhaite, date_disponibilite, telephone_contact } = req.body;
            if (!produit_nom?.trim() || !quantite || !prix_souhaite || !telephone_contact?.trim()) {
                return error(res, 'Produit, quantite, prix et telephone sont obligatoires', 400);
            }
            const id = await OffreVente.creer({
                utilisateur_id: req.utilisateur.id,
                produit_nom: produit_nom.trim(),
                quantite,
                unite: unite || 'kg',
                prix_souhaite,
                date_disponibilite,
                telephone_contact: telephone_contact.trim(),
            });
            const offre = await OffreVente.trouverParId(id);
            return success(res, offre, 'Offre publiee', 201);
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Catalogue public des offres actives
    async listerOffres(req, res) {
        try {
            const offres = await OffreVente.trouverToutes();
            return success(res, offres);
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Le vendeur (ou un admin) marque son offre comme vendue ou la reactive
    async modifierStatutOffre(req, res) {
        try {
            const offre = await OffreVente.trouverParId(req.params.id);
            if (!offre) return error(res, 'Offre non trouvee', 404);
            if (offre.utilisateur_id !== req.utilisateur.id && req.utilisateur.role !== 'administrateur') {
                return error(res, 'Acces non autorise a cette offre', 403);
            }
            const { statut } = req.body;
            if (!['active', 'vendue'].includes(statut)) return error(res, 'Statut invalide', 400);
            await OffreVente.modifierStatut(req.params.id, statut);
            const offreMiseAJour = await OffreVente.trouverParId(req.params.id);
            return success(res, offreMiseAJour, 'Offre mise a jour');
        } catch (err) {
            return error(res, err.message);
        }
    }

};

module.exports = produitController;