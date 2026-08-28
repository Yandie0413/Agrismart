const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifierToken } = require('../middlewares/auth');
const upload = require('../utils/upload');

router.use(verifierToken);

router.post('/', messageController.envoyer);
router.post('/document', upload.single('document'), messageController.partagerDocument);
router.get('/non-lus', messageController.nonLus);
router.get('/conversation/:user_id', messageController.conversation);
router.put('/:id/lu', messageController.marquerLu);
router.put('/:id/archiver', messageController.archiverMessage);

module.exports = router;