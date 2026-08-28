const express = require('express');
const router = express.Router();
const Localisation = require('../models/localisation');
const { verifierToken } = require('../middlewares/auth');
const { autoriser } = require('../middlewares/role');
const { success, error } = require('../utils/response');

router.use(verifierToken);

// Lister les localisations de l'agriculteur connecte
router.get('/', async (req, res) => {
    try {
        const localisations = await Localisation.trouverParAgriculteur(req.utilisateur.id);
        return success(res, localisations);
    } catch (err) {
        return error(res, err.message);
    }
});

// Lister toutes les localisations (admin)
router.get('/toutes', autoriser('administrateur'), async (req, res) => {
    try {
        const localisations = await Localisation.trouverToutes();
        return success(res, localisations);
    } catch (err) {
        return error(res, err.message);
    }
});

// Creer une localisation (l'agriculteur cree ensuite son exploitation avec cet id)
router.post('/', autoriser('agriculteur'), async (req, res) => {
    try {
        const { latitude, longitude, adresse } = req.body;
        const id = await Localisation.creer({ latitude, longitude, adresse });
        const localisation = await Localisation.trouverParId(id);
        return success(res, localisation, 'Localisation creee', 201);
    } catch (err) {
        return error(res, err.message);
    }
});

// Obtenir une localisation (uniquement la sienne, ou admin)
router.get('/:id', async (req, res) => {
    try {
        const localisation = await Localisation.trouverParId(req.params.id);
        if (!localisation) return error(res, 'Localisation non trouvee', 404);
        if (req.utilisateur.role !== 'administrateur') {
            const proprietaire = await Localisation.appartientAUtilisateur(req.params.id, req.utilisateur.id);
            if (!proprietaire) return error(res, 'Acces non autorise a cette localisation', 403);
        }
        return success(res, localisation);
    } catch (err) {
        return error(res, err.message);
    }
});

// Modifier une localisation (uniquement la sienne, ou admin)
router.put('/:id', async (req, res) => {
    try {
        if (req.utilisateur.role !== 'administrateur') {
            const proprietaire = await Localisation.appartientAUtilisateur(req.params.id, req.utilisateur.id);
            if (!proprietaire) return error(res, 'Acces non autorise a cette localisation', 403);
        }
        const { latitude, longitude, adresse } = req.body;
        await Localisation.modifier(req.params.id, { latitude, longitude, adresse });
        const localisation = await Localisation.trouverParId(req.params.id);
        return success(res, localisation, 'Localisation modifiee');
    } catch (err) {
        return error(res, err.message);
    }
});

// Supprimer une localisation
router.delete('/:id', autoriser('administrateur'), async (req, res) => {
    try {
        await Localisation.supprimer(req.params.id);
        return success(res, null, 'Localisation supprimee');
    } catch (err) {
        return error(res, err.message);
    }
});

module.exports = router;