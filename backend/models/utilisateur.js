const db = require('../config/db');
const bcrypt = require('bcryptjs');

const Utilisateur = {

    // Créer un nouvel utilisateur
    async creer(data) {
        const motDePasseHash = await bcrypt.hash(data.mot_de_passe, 10);
        const [result] = await db.execute(
            `INSERT INTO utilisateurs
            (utilisateur_nom, utilisateur_email, utilisateur_mot_de_passe, utilisateur_role, utilisateur_telephone)
            VALUES (?, ?, ?, ?, ?)`,
            [data.nom, data.email, motDePasseHash, data.role, data.telephone ?? null]
        );
        return result.insertId;
    },

    // Trouver un utilisateur par email
    async trouverParEmail(email) {
        const [rows] = await db.execute(
            `SELECT * FROM utilisateurs WHERE utilisateur_email = ?`,
            [email]
        );
        return rows[0];
    },

    // Trouver un utilisateur par ID
    async trouverParId(id) {
        const [rows] = await db.execute(
            `SELECT utilisateur_id, utilisateur_nom, utilisateur_email, utilisateur_role, utilisateur_photo, utilisateur_telephone, created_at, deux_facteurs_active
            FROM utilisateurs WHERE utilisateur_id = ?`,
            [id]
        );
        return rows[0];
    },

    // Modifier uniquement la photo de profil
    async modifierPhoto(id, photo) {
        const [result] = await db.execute(
            `UPDATE utilisateurs SET utilisateur_photo = ? WHERE utilisateur_id = ?`,
            [photo, id]
        );
        return result.affectedRows;
    },

    // Verifier le mot de passe
    async verifierMotDePasse(motDePasse, motDePasseHash) {
        return await bcrypt.compare(motDePasse, motDePasseHash);
    },

    // Enregistrer le token push Expo de l'utilisateur
    async enregistrerPushToken(id, token) {
        const [result] = await db.execute(
            `UPDATE utilisateurs SET utilisateur_push_token = ? WHERE utilisateur_id = ?`,
            [token, id]
        );
        return result.affectedRows;
    },

    // Recuperer le token push Expo d'un utilisateur
    async trouverPushToken(id) {
        const [rows] = await db.execute(
            `SELECT utilisateur_push_token FROM utilisateurs WHERE utilisateur_id = ?`,
            [id]
        );
        return rows[0]?.utilisateur_push_token || null;
    }

};

module.exports = Utilisateur;