const express = require('express');
const router = express.Router();
const meteoController = require('../controllers/meteoController');
const { verifierToken } = require('../middlewares/auth');
const { autoriser } = require('../middlewares/role');

router.use(verifierToken);

// Alertes (avant /:id pour eviter les conflits)
router.get('/alertes/toutes', meteoController.listerAlertes);
router.get('/alertes/ma-region', autoriser('agriculteur'), meteoController.mesAlertesRegion);
router.post('/alertes/regionale', autoriser('expert', 'administrateur'), meteoController.alerteRegionale);
router.put('/alertes/:id', autoriser('expert', 'administrateur'), meteoController.modifierStatutAlerte);

// Meteo en temps reel
router.get('/temps-reel/:ville', meteoController.meteoTempsReel);
router.get('/coordonnees', meteoController.meteoParCoordonnees);
router.get('/previsions/:ville', meteoController.previsions);
router.get('/previsions-avancees/coordonnees', meteoController.previsionsAvanceesParCoordonnees);
router.get('/previsions-avancees/:ville', meteoController.previsionsAvancees);

// Generer alertes automatiquement depuis la meteo temps reel (reservee expert/admin :
// purge et regenere TOUTES les alertes automatiques de la plateforme, pas seulement
// celles de la ville demandee, et notifie tous les agriculteurs)
router.post('/alertes/temps-reel/:ville', autoriser('expert', 'administrateur'), meteoController.genererAlertesTempsReel);

// Releves manuels
router.post('/', autoriser('expert', 'administrateur'), meteoController.creer);
router.get('/', meteoController.lister);
router.get('/:id', meteoController.obtenir);

module.exports = router;