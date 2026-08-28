const express = require('express');
const router = express.Router();
const Parcelle = require('../models/parcelle');
const Exploitation = require('../models/exploitation');
const { verifierToken } = require('../middlewares/auth');
const { autoriser } = require('../middlewares/role');
const { success, error } = require('../utils/response');

router.use(verifierToken);

// Verifie que la parcelle appartient (via son exploitation) a l'utilisateur connecte
async function verifierProprietaireParcelle(req, res, next) {
    try {
        const parcelle = await Parcelle.trouverParId(req.params.id);
        if (!parcelle) return error(res, 'Parcelle non trouvee', 404);
        const exploitation = await Exploitation.trouverParId(parcelle.exploitation_id);
        if (!exploitation || (exploitation.utilisateur_id !== req.utilisateur.id && req.utilisateur.role !== 'administrateur')) {
            return error(res, 'Acces non autorise a cette parcelle', 403);
        }
        next();
    } catch (err) {
        return error(res, err.message);
    }
}

// Obtenir une parcelle
router.get('/:id', verifierProprietaireParcelle, async (req, res) => {
    try {
        const parcelle = await Parcelle.trouverParId(req.params.id);
        return success(res, parcelle);
    } catch (err) {
        return error(res, err.message);
    }
});

// Modifier une parcelle
router.put('/:id', autoriser('agriculteur', 'administrateur'), verifierProprietaireParcelle, async (req, res) => {
    try {
        const { nom, superficie, localisation_id } = req.body;
        await Parcelle.modifier(req.params.id, { nom, superficie, localisation_id });
        const parcelle = await Parcelle.trouverParId(req.params.id);
        return success(res, parcelle, 'Parcelle modifiee');
    } catch (err) {
        return error(res, err.message);
    }
});

// Supprimer une parcelle
router.delete('/:id', autoriser('agriculteur', 'administrateur'), verifierProprietaireParcelle, async (req, res) => {
    try {
        await Parcelle.supprimer(req.params.id);
        return success(res, null, 'Parcelle supprimee');
    } catch (err) {
        return error(res, err.message);
    }
});

module.exports = router;
