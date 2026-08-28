const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dossier = 'uploads/';
if (!fs.existsSync(dossier)) fs.mkdirSync(dossier);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dossier),
    filename: (req, file, cb) => {
        const nom = Date.now() + '-' + file.originalname.replace(/\s/g, '_');
        cb(null, nom);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const types = /pdf|doc|docx|jpg|jpeg|png/;
        const ext = types.test(path.extname(file.originalname).toLowerCase());
        if (ext) cb(null, true);
        else cb(new Error('Type de fichier non autorise'));
    }
});

module.exports = upload;