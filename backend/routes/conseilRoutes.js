const express = require('express');
const router = express.Router();
const conseilController = require('../controllers/conseilController');
const { verifierToken } = require('../middlewares/auth');
const { autoriser } = require('../middlewares/role');

router.use(verifierToken);

// Lister et obtenir (accessible a tous)
router.get('/', conseilController.lister);
router.post('/generer', autoriser('agriculteur'), conseilController.genererAutomatique);
router.get('/base-symptomes', conseilController.baseSymptomesDisponibles);
router.post('/diagnostic', autoriser('agriculteur'), conseilController.diagnostiquer);
router.get('/:id', conseilController.obtenir);
router.get('/culture/:culture_id', conseilController.filtrerParCulture);

// Creer et modifier (expert seulement)
router.post('/', autoriser('expert'), conseilController.creer);
router.put('/:id', autoriser('expert'), conseilController.modifier);
router.delete('/:id', autoriser('expert', 'administrateur'), conseilController.supprimer);
router.put('/:id/archiver', autoriser('expert', 'administrateur'), conseilController.archiver);
router.put('/:id/valider-diagnostic', autoriser('expert', 'administrateur'), conseilController.validerConseil);
module.exports = router;