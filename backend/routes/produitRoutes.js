const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produitController');
const { verifierToken } = require('../middlewares/auth');
const { autoriser } = require('../middlewares/role');

router.use(verifierToken);

router.post('/', autoriser('administrateur'), produitController.creer);
router.get('/', produitController.lister);

// Offres de vente directes (module 8.6) - avant les routes /:id pour eviter les conflits de route
router.post('/offres', autoriser('agriculteur', 'administrateur'), produitController.creerOffre);
router.get('/offres', produitController.listerOffres);
router.put('/offres/:id/statut', produitController.modifierStatutOffre);

router.get('/:id', produitController.obtenir);
router.put('/:id', autoriser('administrateur'), produitController.modifier);
router.delete('/:id', autoriser('administrateur'), produitController.supprimer);
router.get('/:id/historique-prix', produitController.historiquePrix);

router.post('/:id/marches', autoriser('administrateur', 'agriculteur'), produitController.ajouterMarche);
router.get('/:id/marches', produitController.listerMarches);

// Signalements de prix abusifs
router.get('/signalements/toutes', autoriser('administrateur'), produitController.listerSignalements);
router.put('/signalements/:id/traiter', autoriser('administrateur'), produitController.traiterSignalement);
router.post('/marches/:marcheId/signaler', produitController.signalerPrix);

module.exports = router;