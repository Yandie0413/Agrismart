const Agriculteur = require('../models/agriculteur');
const Expert = require('../models/expert');
const Administrateur = require('../models/administrateur');
const Utilisateur = require('../models/utilisateur');
const { success, error } = require('../utils/response');
const Notification = require('../models/notification');
const db = require('../config/db');

const profilController = {

    // Statistiques publiques pour la page d'accueil (aucune donnee personnelle exposee)
    async statistiquesPubliques(req, res) {
        try {
            const [agriculteurs] = await db.execute(`SELECT COUNT(*) as total FROM agriculteurs`);
            const [experts] = await db.execute(`SELECT COUNT(*) as total FROM experts`);
            const [exploitations] = await db.execute(`SELECT COUNT(*) as total FROM exploitations`);
            return success(res, {
                total_agriculteurs: agriculteurs[0].total,
                total_experts: experts[0].total,
                total_exploitations: exploitations[0].total,
            });
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Modifier le profil de base
    async modifierProfil(req, res) {
        try {
            const { nom, email } = req.body;
            const id = req.utilisateur.id;

            await db.execute(
                `UPDATE utilisateurs SET utilisateur_nom = ?, utilisateur_email = ? 
                WHERE utilisateur_id = ?`,
                [nom, email, id]
            );

            const utilisateur = await Utilisateur.trouverParId(id);
            return success(res, utilisateur, 'Profil modifie');
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Modifier le profil specifique selon le role
    async modifierProfilRole(req, res) {
        try {
            const id = req.utilisateur.id;
            const role = req.utilisateur.role;

            if (role === 'agriculteur') {
                await Agriculteur.modifier(id, req.body);
                const profil = await Agriculteur.trouverParUtilisateur(id);
                return success(res, profil, 'Profil agriculteur modifie');
            } else if (role === 'expert') {
                await Expert.modifier(id, req.body);
                const profil = await Expert.trouverParUtilisateur(id);
                return success(res, profil, 'Profil expert modifie');
            } else if (role === 'administrateur') {
                await Administrateur.modifier(id, req.body);
                const profil = await Administrateur.trouverParUtilisateur(id);
                return success(res, profil, 'Profil administrateur modifie');
            }
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Profil specifique au role (region/district/commune agriculteur, zone/specialite/diplome expert)
    async monProfilRole(req, res) {
        try {
            const id = req.utilisateur.id;
            const role = req.utilisateur.role;
            let profil = null;
            if (role === 'agriculteur') profil = await Agriculteur.trouverParUtilisateur(id);
            else if (role === 'expert') profil = await Expert.trouverParUtilisateur(id);
            else if (role === 'administrateur') profil = await Administrateur.trouverParUtilisateur(id);
            return success(res, profil);
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Dashboard selon le role
    async dashboard(req, res) {
        try {
            const id = req.utilisateur.id;
            const role = req.utilisateur.role;

            let data;
            if (role === 'agriculteur') {
                data = await Agriculteur.dashboard(id);
            } else if (role === 'expert') {
                data = await Expert.dashboard(id);
            } else if (role === 'administrateur') {
                data = await Administrateur.dashboard();
            }

            return success(res, data);
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Lister tous les utilisateurs (admin seulement)
    async listerUtilisateurs(req, res) {
        try {
            const utilisateurs = await Administrateur.listerUtilisateurs();
            return success(res, utilisateurs);
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Detail complet d'un utilisateur, avec exactement les memes donnees que son propre
    // tableau de bord (evolution, cultures/conseils, etc.) pour reutiliser les memes
    // composants d'affichage cote frontend (admin seulement).
    async detailUtilisateur(req, res) {
        try {
            const id = req.params.id;
            const utilisateur = await Utilisateur.trouverParId(id);
            if (!utilisateur) return error(res, 'Utilisateur non trouve', 404);

            let donnees = {};
            if (utilisateur.utilisateur_role === 'agriculteur') {
                donnees = await Agriculteur.dashboard(id);
            } else if (utilisateur.utilisateur_role === 'expert') {
                donnees = await Expert.dashboard(id);
            }

            return success(res, { utilisateur, ...donnees });
        } catch (err) {
            return error(res, err.message);
        }
    },
    // Lister les utilisateurs pour la messagerie (tous roles connectes)
async listerContacts(req, res) {
    try {
        const [utilisateurs] = await db.execute(
            `SELECT utilisateur_id, utilisateur_nom, utilisateur_email, utilisateur_role 
            FROM utilisateurs WHERE utilisateur_id != ?`,
            [req.utilisateur.id]
        );
        return success(res, utilisateurs);
    } catch (err) {
        return error(res, err.message);
    }
},

    // Supprimer un utilisateur (admin seulement)
    async supprimerUtilisateur(req, res) {
        try {
            if (Number(req.params.id) === req.utilisateur.id) {
                return error(res, 'Tu ne peux pas supprimer ton propre compte', 400);
            }
            await Administrateur.supprimerUtilisateur(req.params.id);
            return success(res, null, 'Utilisateur supprime');
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Modifier le role d'un autre utilisateur (admin seulement)
    async modifierRoleUtilisateurCible(req, res) {
        try {
            const { role } = req.body;
            const idCible = Number(req.params.id);
            const rolesValides = ['agriculteur', 'expert', 'administrateur'];

            if (!rolesValides.includes(role)) {
                return error(res, 'Role invalide', 400);
            }
            if (idCible === req.utilisateur.id) {
                return error(res, 'Tu ne peux pas modifier ton propre role', 400);
            }

            await Administrateur.modifierRoleUtilisateur(idCible, role);

            // Cree la ligne satellite du nouveau role si elle n'existe pas encore
            if (role === 'agriculteur' && !(await Agriculteur.trouverParUtilisateur(idCible))) {
                await Agriculteur.creer({ utilisateur_id: idCible, localisation: '', type_agri: '' });
            } else if (role === 'expert' && !(await Expert.trouverParUtilisateur(idCible))) {
                await Expert.creer({ utilisateur_id: idCible, specialite: '', certifications: '' });
            } else if (role === 'administrateur' && !(await Administrateur.trouverParUtilisateur(idCible))) {
                await Administrateur.creer({ utilisateur_id: idCible, niveau_acces: 'standard', departement: '' });
            }

            return success(res, null, 'Role modifie');
        } catch (err) {
            return error(res, err.message);
        }
    },
    // Enregistrer le token push Expo de l'appareil mobile
    async enregistrerPushToken(req, res) {
        try {
            const { token } = req.body;
            await Utilisateur.enregistrerPushToken(req.utilisateur.id, token);
            return success(res, null, 'Token push enregistre');
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Lister les comptes experts en attente de validation (admin seulement)
    async listerExpertsEnAttente(req, res) {
        try {
            const [experts] = await db.execute(
                `SELECT e.*, u.utilisateur_nom, u.utilisateur_email, u.utilisateur_telephone
                FROM experts e
                JOIN utilisateurs u ON e.utilisateur_id = u.utilisateur_id
                WHERE e.expert_statut = 'en_attente'
                ORDER BY u.created_at ASC`
            );
            return success(res, experts);
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Valider ou rejeter un compte expert (admin seulement)
    async validerExpert(req, res) {
        try {
            const { statut } = req.body;
            const idCible = Number(req.params.id);
            if (!['valide', 'rejete'].includes(statut)) {
                return error(res, 'Statut invalide', 400);
            }
            await Expert.modifierStatut(idCible, statut);
            await Notification.creer({
                utilisateur_id: idCible,
                type: 'compte',
                titre: statut === 'valide' ? 'Compte expert valide' : 'Compte expert rejete',
                contenu: statut === 'valide'
                    ? "Ton compte expert a ete valide par un administrateur, tu peux maintenant publier des conseils."
                    : "Ton compte expert a ete rejete. Contacte l'administration pour plus d'informations.",
                lien: '/profil'
            });
            return success(res, null, 'Statut expert mis a jour');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async genererStatistiques(req, res) {
        try {
            const [parRole] = await db.execute(
                `SELECT utilisateur_role, COUNT(*) as total 
                FROM utilisateurs GROUP BY utilisateur_role`
            );
            const [parMois] = await db.execute(
                `SELECT DATE_FORMAT(created_at, '%Y-%m') as mois, COUNT(*) as total
                FROM utilisateurs
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY mois ASC`
            );
            const [culturesParType] = await db.execute(
                `SELECT culture_type, COUNT(*) as total 
                FROM cultures GROUP BY culture_type`
            );
            const [alertesParType] = await db.execute(
                `SELECT alerte_type, COUNT(*) as total
                FROM alertes GROUP BY alerte_type`
            );

            // Taux de resolution des experts : moyenne, par expert, du ratio messages lus / messages recus
            const [resolutionParExpert] = await db.execute(
                `SELECT u.utilisateur_id, u.utilisateur_nom,
                    COUNT(m.message_id) as recus,
                    SUM(CASE WHEN m.message_lu = true THEN 1 ELSE 0 END) as lus
                FROM utilisateurs u
                LEFT JOIN messages m ON m.destinataire_id = u.utilisateur_id
                WHERE u.utilisateur_role = 'expert'
                GROUP BY u.utilisateur_id, u.utilisateur_nom`
            );
            const experts_avec_messages = resolutionParExpert.filter((e) => e.recus > 0);
            const tauxResolutionExperts = experts_avec_messages.length > 0
                ? Math.round(
                    (experts_avec_messages.reduce((acc, e) => acc + (e.lus / e.recus), 0) / experts_avec_messages.length) * 100
                )
                : null;

            return success(res, { parRole, parMois, culturesParType, alertesParType, tauxResolutionExperts });
        } catch (err) {
            return error(res, err.message);
        }
    }

};

module.exports = profilController;