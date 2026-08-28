const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { verifierToken } = require('../middlewares/auth');

router.use(verifierToken);

router.get('/', forumController.listerSujets);
router.post('/', forumController.creerSujet);
router.get('/:id', forumController.obtenirSujet);
router.delete('/:id', forumController.supprimerSujet);
router.post('/:id/reponses', forumController.creerReponse);
router.delete('/reponses/:id', forumController.supprimerReponse);
router.post('/:id/like', forumController.toggleLikeSujet);
router.post('/reponses/:id/like', forumController.toggleLikeReponse);

module.exports = router;
