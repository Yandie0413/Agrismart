const express = require('express');
const router = express.Router();
const Culture = require('../models/culture');
const Exploitation = require('../models/exploitation');
const Parcelle = require('../models/parcelle');
const TacheCulturale = require('../models/tacheCulturale');
const { verifierToken } = require('../middlewares/auth');
const { autoriser } = require('../middlewares/role');
const { success, error } = require('../utils/response');

router.use(verifierToken);

// Verifie que la culture appartient (via son exploitation) a l'utilisateur connecte
async function verifierProprietaireCulture(req, res, next) {
    try {
        const culture = await Culture.trouverParId(req.params.id);
        if (!culture) return error(res, 'Culture non trouvee', 404);
        const exploitation = await Exploitation.trouverParId(culture.exploitation_id);
        if (!exploitation || (exploitation.utilisateur_id !== req.utilisateur.id && req.utilisateur.role !== 'administrateur')) {
            return error(res, 'Acces non autorise a cette culture', 403);
        }
        next();
    } catch (err) {
        return error(res, err.message);
    }
}

// Calendrier agricole
router.get('/exploitation/:exploitation_id/calendrier', async (req, res) => {
    try {
        const calendrier = await Culture.calendrierAgricole(req.params.exploitation_id);
        return success(res, calendrier);
    } catch (err) {
        return error(res, err.message);
    }
});

// Rendement
router.get('/:id/rendement', async (req, res) => {
    try {
        const rendement = await Culture.calculerRendement(req.params.id);
        return success(res, rendement);
    } catch (err) {
        return error(res, err.message);
    }
});

// Obtenir une culture
router.get('/:id', verifierProprietaireCulture, async (req, res) => {
    try {
        const culture = await Culture.trouverParId(req.params.id);
        return success(res, culture);
    } catch (err) {
        return error(res, err.message);
    }
});

// Modifier une culture
router.put('/:id', autoriser('agriculteur', 'administrateur'), verifierProprietaireCulture, async (req, res) => {
    try {
        const { type, date_plantation, statut, parcelle_id, variete, type_sol } = req.body;

        if (parcelle_id) {
            const cultureActuelle = await Culture.trouverParId(req.params.id);
            const parcelle = await Parcelle.trouverParId(parcelle_id);
            if (!parcelle || String(parcelle.exploitation_id) !== String(cultureActuelle.exploitation_id)) {
                return error(res, 'Parcelle invalide pour cette exploitation', 400);
            }
        }

        await Culture.modifier(req.params.id, { type, date_plantation, statut, parcelle_id, variete, type_sol });
        const culture = await Culture.trouverParId(req.params.id);
        return success(res, culture, 'Culture modifiee');
    } catch (err) {
        return error(res, err.message);
    }
});

// Supprimer une culture
router.delete('/:id', autoriser('agriculteur', 'administrateur'), verifierProprietaireCulture, async (req, res) => {
    try {
        await Culture.supprimer(req.params.id);
        return success(res, null, 'Culture supprimee');
    } catch (err) {
        return error(res, err.message);
    }
});

// Checklist des taches culturales d'une culture
router.get('/:id/taches', verifierProprietaireCulture, async (req, res) => {
    try {
        const taches = await TacheCulturale.trouverParCulture(req.params.id);
        return success(res, taches);
    } catch (err) {
        return error(res, err.message);
    }
});

// Cocher une tache culturale comme terminee
router.put('/taches/:id/terminer', autoriser('agriculteur', 'administrateur'), async (req, res) => {
    try {
        const tache = await TacheCulturale.trouverParId(req.params.id);
        if (!tache) return error(res, 'Tache non trouvee', 404);
        const culture = await Culture.trouverParId(tache.culture_id);
        const exploitation = culture ? await Exploitation.trouverParId(culture.exploitation_id) : null;
        if (!exploitation || (exploitation.utilisateur_id !== req.utilisateur.id && req.utilisateur.role !== 'administrateur')) {
            return error(res, 'Acces non autorise a cette tache', 403);
        }

        await TacheCulturale.terminer(req.params.id);
        const tacheMiseAJour = await TacheCulturale.trouverParId(req.params.id);
        return success(res, tacheMiseAJour, 'Tache marquee comme terminee');
    } catch (err) {
        return error(res, err.message);
    }
});

module.exports = router;