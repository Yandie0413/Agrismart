const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifierToken } = require('../middlewares/auth');
const upload = require('../utils/upload');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verifier-otp', authController.verifierOTP);
router.post('/demander-reset', authController.demanderReset);
router.post('/reinitialiser-mot-de-passe', authController.reinitialiserMotDePasse);
router.get('/profil', verifierToken, authController.profil);
router.put('/2fa', verifierToken, authController.toggleDeuxFacteurs);
router.post('/photo', verifierToken, upload.single('photo'), authController.uploaderPhoto);
router.post('/diplome', verifierToken, upload.single('diplome'), authController.uploaderDiplome);

module.exports = router;