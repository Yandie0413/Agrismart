const express = require('express');
const router = express.Router();
const profilController = require('../controllers/profilController');
const { verifierToken } = require('../middlewares/auth');
const { autoriser } = require('../middlewares/role');

// Statistiques publiques (page d'accueil, aucune authentification requise, aucune donnee personnelle)
router.get('/stats-publiques', profilController.statistiquesPubliques);

router.use(verifierToken);

// Profil et dashboard
router.put('/modifier', profilController.modifierProfil);
router.put('/modifier-role', profilController.modifierProfilRole);
router.get('/mon-profil-role', profilController.monProfilRole);
router.put('/push-token', profilController.enregistrerPushToken);
router.get('/dashboard', profilController.dashboard);
router.get('/statistiques', autoriser('administrateur'), profilController.genererStatistiques);
router.get('/contacts', profilController.listerContacts);

// Gestion utilisateurs (admin seulement)
router.get('/utilisateurs', autoriser('administrateur'), profilController.listerUtilisateurs);
router.get('/experts-en-attente', autoriser('administrateur'), profilController.listerExpertsEnAttente);
router.put('/utilisateurs/:id/valider-expert', autoriser('administrateur'), profilController.validerExpert);
router.get('/utilisateurs/:id/detail', autoriser('administrateur'), profilController.detailUtilisateur);
router.delete('/utilisateurs/:id', autoriser('administrateur'), profilController.supprimerUtilisateur);
router.put('/utilisateurs/:id/role', autoriser('administrateur'), profilController.modifierRoleUtilisateurCible);

module.exports = router;