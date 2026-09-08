const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/utilisateur');
const Agriculteur = require('../models/agriculteur');
const Expert = require('../models/expert');
const { success, error } = require('../utils/response');
const { envoyerCodeOTP, envoyerLienReset } = require('../utils/email');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const authController = {

    async register(req, res) {
        try {
            const { nom, email, mot_de_passe, role, telephone } = req.body;

            // L'inscription publique ne permet de creer que des comptes agriculteur/expert.
            // Un compte administrateur ne peut etre cree que par un administrateur existant
            // (voir profilController.modifierRoleUtilisateurCible).
            const rolesAutorisesInscription = ['agriculteur', 'expert'];
            if (!rolesAutorisesInscription.includes(role)) {
                return error(res, 'Role invalide pour une inscription', 400);
            }

            // Format telephone Madagascar : +261 3X XXXXXXX ou 03X XXXXXXX
            if (telephone && !/^(\+261|0)3[2348]\d{7}$/.test(telephone.replace(/\s/g, ''))) {
                return error(res, 'Numero de telephone invalide (format attendu : +261 34 XX XXX XX ou 034 XX XXX XX)', 400);
            }

            const existant = await Utilisateur.trouverParEmail(email);
            if (existant) return error(res, 'Cet email est deja utilise', 400);
            const id = await Utilisateur.creer({ nom, email, mot_de_passe, role, telephone });

            // Cree la ligne satellite correspondante pour que la modification de profil
            // specifique au role (Agriculteur.modifier / Expert.modifier) fonctionne des l'inscription.
            if (role === 'agriculteur') {
                await Agriculteur.creer({ utilisateur_id: id, localisation: '', type_agri: '' });
            } else if (role === 'expert') {
                await Expert.creer({ utilisateur_id: id, specialite: '', certifications: '' });
            }

            const utilisateur = await Utilisateur.trouverParId(id);
            return success(res, utilisateur, 'Inscription reussie', 201);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async login(req, res) {
        try {
            const { email, mot_de_passe } = req.body;
            const utilisateur = await Utilisateur.trouverParEmail(email);
            if (!utilisateur) return error(res, 'Email ou mot de passe incorrect', 401);
            const valide = await Utilisateur.verifierMotDePasse(mot_de_passe, utilisateur.utilisateur_mot_de_passe);
            if (!valide) return error(res, 'Email ou mot de passe incorrect', 401);

            if (utilisateur.deux_facteurs_active) {
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                const expiration = new Date(Date.now() + 10 * 60 * 1000);
                await db.execute(
                    `UPDATE utilisateurs SET deux_facteurs_code = ?, deux_facteurs_expiration = ? WHERE utilisateur_id = ?`,
                    [code, expiration, utilisateur.utilisateur_id]
                );
                await envoyerCodeOTP(utilisateur.utilisateur_email, code);
                return success(res, { deux_facteurs: true, email: utilisateur.utilisateur_email }, 'Code OTP envoye par email');
            }

            const token = jwt.sign(
                { id: utilisateur.utilisateur_id, role: utilisateur.utilisateur_role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );
            return success(res, { token, utilisateur: {
                id: utilisateur.utilisateur_id,
                nom: utilisateur.utilisateur_nom,
                email: utilisateur.utilisateur_email,
                role: utilisateur.utilisateur_role,
                photo: utilisateur.utilisateur_photo
            }}, 'Connexion reussie');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async verifierOTP(req, res) {
        try {
            const { email, code } = req.body;
            const utilisateur = await Utilisateur.trouverParEmail(email);
            if (!utilisateur) return error(res, 'Utilisateur non trouve', 404);
            if (utilisateur.deux_facteurs_code !== code) return error(res, 'Code incorrect', 401);
            if (new Date() > new Date(utilisateur.deux_facteurs_expiration)) return error(res, 'Code expire', 401);
            // Le code n'est PAS efface ici : sur un reseau faible, la reponse peut se perdre
            // apres que le serveur ait deja valide le code, forcant l'app a reessayer -- si on
            // avait deja efface le code au premier passage, ce reessai (meme code, correct)
            // echouerait a tort avec "Code incorrect". Il reste donc utilisable jusqu'a sa
            // propre expiration (10 min, ligne ~58) ; une nouvelle tentative de connexion
            // regenere de toute facon un nouveau code qui l'ecrase.
            const token = jwt.sign(
                { id: utilisateur.utilisateur_id, role: utilisateur.utilisateur_role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );
            return success(res, { token, utilisateur: {
                id: utilisateur.utilisateur_id,
                nom: utilisateur.utilisateur_nom,
                email: utilisateur.utilisateur_email,
                role: utilisateur.utilisateur_role,
                photo: utilisateur.utilisateur_photo
            }}, 'Connexion reussie');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async toggleDeuxFacteurs(req, res) {
        try {
            const id = req.utilisateur.id;
            const { activer } = req.body;
            await db.execute(
                `UPDATE utilisateurs SET deux_facteurs_active = ? WHERE utilisateur_id = ?`,
                [activer, id]
            );
            return success(res, null, activer ? '2FA active' : '2FA desactive');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async profil(req, res) {
        try {
            const utilisateur = await Utilisateur.trouverParId(req.utilisateur.id);
            return success(res, utilisateur);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async uploaderPhoto(req, res) {
        try {
            if (!req.file) return error(res, 'Aucune photo fournie', 400);
            await Utilisateur.modifierPhoto(req.utilisateur.id, req.file.filename);
            const utilisateur = await Utilisateur.trouverParId(req.utilisateur.id);
            return success(res, utilisateur, 'Photo de profil mise a jour');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async uploaderDiplome(req, res) {
        try {
            if (req.utilisateur.role !== 'expert') return error(res, 'Reserve aux experts', 403);
            if (!req.file) return error(res, 'Aucun fichier fourni', 400);
            await Expert.modifierDiplome(req.utilisateur.id, req.file.filename);
            const profil = await Expert.trouverParUtilisateur(req.utilisateur.id);
            return success(res, profil, 'Diplome envoye, en attente de validation par un administrateur');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async demanderReset(req, res) {
        try {
            const { email } = req.body;
            const utilisateur = await Utilisateur.trouverParEmail(email);
            if (!utilisateur) return error(res, 'Email non trouve', 404);

            const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
            const expiration = new Date(Date.now() + 60 * 60 * 1000);

            await db.execute(
                `UPDATE utilisateurs SET reset_token = ?, reset_token_expiration = ? WHERE utilisateur_id = ?`,
                [token, expiration, utilisateur.utilisateur_id]
            );

            // FRONTEND_URL doit pointer vers le site deploye (Vercel) en production - localhost
            // en dur ici cassait le lien pour tout utilisateur reel, pas seulement le SMTP.
            const lienReset = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${token}`;
            await envoyerLienReset(email, lienReset);

            return success(res, null, 'Email de reinitialisation envoye');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async reinitialiserMotDePasse(req, res) {
        try {
            const { token, nouveau_mot_de_passe } = req.body;
            const [rows] = await db.execute(
                `SELECT * FROM utilisateurs WHERE reset_token = ?`,
                [token]
            );
            if (rows.length === 0) return error(res, 'Token invalide', 400);
            const utilisateur = rows[0];
            if (new Date() > new Date(utilisateur.reset_token_expiration)) return error(res, 'Token expire', 400);

            // Le token n'est pas efface ici, meme motif que verifierOTP : si la reponse se
            // perd en route sur un reseau faible apres que le mot de passe ait deja ete
            // change, un reessai avec le meme token doit reussir (re-hacher/reappliquer le
            // meme nouveau mot de passe est sans consequence) plutot que d'echouer a tort
            // avec "Token invalide". Il reste utilisable jusqu'a sa propre expiration (1h).
            const motDePasseHash = await bcrypt.hash(nouveau_mot_de_passe, 10);
            await db.execute(
                `UPDATE utilisateurs SET utilisateur_mot_de_passe = ? WHERE utilisateur_id = ?`,
                [motDePasseHash, utilisateur.utilisateur_id]
            );

            return success(res, null, 'Mot de passe reinitialise avec succes');
        } catch (err) {
            return error(res, err.message);
        }
    }

};

module.exports = authController;