const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifierToken } = require('../middlewares/auth');

router.use(verifierToken);

router.get('/', notificationController.lister);
router.get('/non-lues', notificationController.compterNonLues);
router.put('/toutes-lues', notificationController.marquerToutesLues);
router.put('/:id/lue', notificationController.marquerLue);
router.delete('/:id', notificationController.supprimer);

module.exports = router;