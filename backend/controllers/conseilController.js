const Conseil = require('../models/conseil');
const Notification = require('../models/notification');
const Utilisateur = require('../models/utilisateur');
const Exploitation = require('../models/exploitation');
const Culture = require('../models/culture');
const Localisation = require('../models/localisation');
const Agriculteur = require('../models/agriculteur');
const Expert = require('../models/expert');
const meteoApi = require('../utils/meteoApi');
const { genererConseilsPourCulture } = require('../utils/moteurRecommandation');
const { CULTURES_COUVERTES, symptomesPourCulture, diagnostiquer } = require('../utils/baseSymptomes');
const db = require('../config/db');
const { success, error } = require('../utils/response');

const conseilController = {

    async creer(req, res) {
        try {
            const { titre, contenu, categorie, culture_id } = req.body;
            const utilisateur_id = req.utilisateur.id;
            const date_publication = new Date().toISOString().split('T')[0];

            const id = await Conseil.creer({ utilisateur_id, culture_id: culture_id || null, titre, contenu, date_publication, categorie });
            const conseil = await Conseil.trouverParId(id);

            // Notifier tous les agriculteurs
            const expert = await Utilisateur.trouverParId(utilisateur_id);
            const [agriculteurs] = await db.execute(
                `SELECT utilisateur_id FROM utilisateurs WHERE utilisateur_role = 'agriculteur'`
            );
            for (const agriculteur of agriculteurs) {
                await Notification.creer({
                    utilisateur_id: agriculteur.utilisateur_id,
                    type: 'conseil',
                    titre: `Nouveau conseil : ${titre}`,
                    contenu: `${expert.utilisateur_nom} a publie un nouveau conseil en ${categorie}.`,
                    lien: '/conseils'
                });
            }

            return success(res, conseil, 'Conseil publie', 201);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async lister(req, res) {
        try {
            const conseils = await Conseil.trouverVisiblesPour(req.utilisateur.id, req.utilisateur.role);
            return success(res, conseils);
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Genere des conseils personnalises pour l'agriculteur connecte, en croisant meteo et stade de culture
    async genererAutomatique(req, res) {
        try {
            const utilisateur_id = req.utilisateur.id;
            const date_publication = new Date().toISOString().split('T')[0];

            await Conseil.supprimerGeneresParUtilisateur(utilisateur_id);

            const exploitations = await Exploitation.trouverParAgriculteur(utilisateur_id);
            let nombreGeneres = 0;

            for (const exploitation of exploitations) {
                const localisation = await Localisation.trouverParId(exploitation.localisation_id);
                if (!localisation) continue;

                let meteo;
                try {
                    meteo = await meteoApi.parCoordonnees(localisation.localisation_latitude, localisation.localisation_longitude);
                } catch (err) {
                    continue; // API meteo indisponible pour cette localisation, on passe a la suivante
                }

                // Prevision du lendemain (facultative) : si indisponible, la regle de pluie prevue
                // ne se declenche simplement pas, le reste de la generation continue normalement.
                let pluiePrevueDemain = 0;
                try {
                    const previsions = await meteoApi.previsionsAvanceesParCoordonnees(
                        localisation.localisation_latitude,
                        localisation.localisation_longitude
                    );
                    pluiePrevueDemain = previsions[1]?.pluie_totale_mm ?? 0;
                } catch (err) {
                    // pas bloquant
                }

                const cultures = await Culture.calendrierAgricole(exploitation.exploitation_id);

                for (const culture of cultures) {
                    const conseilsGeneres = genererConseilsPourCulture({
                        culture_type: culture.culture_type,
                        stade_culture: culture.stade_culture,
                        temperature: meteo.temperature,
                        humidite: meteo.humidite,
                        pluie_prevue_demain_mm: pluiePrevueDemain,
                    });

                    for (const c of conseilsGeneres) {
                        await Conseil.creer({
                            utilisateur_id,
                            culture_id: culture.culture_id,
                            titre: c.titre,
                            contenu: c.contenu,
                            date_publication,
                            categorie: c.categorie,
                            origine: 'systeme',
                        });
                        nombreGeneres++;
                    }
                }
            }

            if (nombreGeneres > 0) {
                await Notification.creer({
                    utilisateur_id,
                    type: 'conseil',
                    titre: 'Nouveaux conseils personnalises',
                    contenu: `${nombreGeneres} conseil(s) genere(s) pour tes cultures selon la meteo actuelle.`,
                    lien: '/conseils',
                });
            }

            const conseils = await Conseil.trouverVisiblesPour(utilisateur_id, 'agriculteur');
            return success(res, conseils, `${nombreGeneres} conseil(s) genere(s)`);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async obtenir(req, res) {
        try {
            const conseil = await Conseil.trouverParId(req.params.id);
            if (!conseil) return error(res, 'Conseil non trouve', 404);
            return success(res, conseil);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async filtrerParCulture(req, res) {
        try {
            const conseils = await Conseil.trouverParCulture(req.params.culture_id);
            return success(res, conseils);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async modifier(req, res) {
        try {
            const { titre, contenu, categorie } = req.body;
            await Conseil.modifier(req.params.id, { titre, contenu, categorie });
            const conseil = await Conseil.trouverParId(req.params.id);
            return success(res, conseil, 'Conseil modifie');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async supprimer(req, res) {
        try {
            await Conseil.supprimer(req.params.id);
            return success(res, null, 'Conseil supprime');
        } catch (err) {
            return error(res, err.message);
        }
    },

    async archiver(req, res) {
        try {
            await Conseil.archiver(req.params.id);
            return success(res, null, 'Conseil archive');
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Base de connaissances exposee au frontend pour construire le formulaire "Diagnostic rapide"
    async baseSymptomesDisponibles(req, res) {
        try {
            const symptomesParCulture = {};
            for (const culture of CULTURES_COUVERTES) {
                symptomesParCulture[culture] = symptomesPourCulture(culture);
            }
            return success(res, { cultures: CULTURES_COUVERTES, symptomesParCulture });
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Diagnostic rapide agriculteur : culture + symptomes coches -> conseil "systeme" en attente de validation expert
    async diagnostiquer(req, res) {
        try {
            const { culture, symptomes } = req.body;
            if (!culture?.trim() || !Array.isArray(symptomes) || symptomes.length === 0) {
                return error(res, 'Culture et au moins un symptome sont obligatoires', 400);
            }

            const resultat = diagnostiquer(culture, symptomes);
            const utilisateur_id = req.utilisateur.id;
            const date_publication = new Date().toISOString().split('T')[0];

            const titre = resultat
                ? `Diagnostic : ${resultat.maladie}`
                : `Diagnostic : symptomes non concluants (${culture.trim()})`;
            const contenu = resultat
                ? `Symptomes observes compatibles avec ${resultat.maladie} (confiance estimee : ${resultat.confiance}%). Traitement biologique suggere : ${resultat.traitement_bio} Ce diagnostic automatique est en attente de validation par un expert.`
                : `Aucune correspondance suffisante trouvee pour les symptomes indiques sur ${culture.trim()}. Un expert va examiner ce signalement.`;

            const conseilId = await Conseil.creer({
                utilisateur_id,
                culture_id: null,
                titre,
                contenu,
                date_publication,
                categorie: 'protection',
                origine: 'systeme',
            });

            const profil = await Agriculteur.trouverParUtilisateur(utilisateur_id);
            if (profil?.agriculteur_region) {
                const expertIds = await Expert.trouverParZone(profil.agriculteur_region);
                for (const expert_id of expertIds) {
                    await Notification.creer({
                        utilisateur_id: expert_id,
                        type: 'diagnostic',
                        titre: 'Nouveau diagnostic a valider',
                        contenu: titre,
                        lien: '/conseils',
                    });
                }
            }

            const conseil = await Conseil.trouverParId(conseilId);
            return success(res, { conseil, resultat }, 'Diagnostic effectue', 201);
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Un expert/administrateur confirme ou infirme un diagnostic genere par le systeme
    async validerConseil(req, res) {
        try {
            const { valide } = req.body;
            if (typeof valide !== 'boolean') {
                return error(res, 'Le champ valide doit etre un booleen', 400);
            }
            await Conseil.validerParExpert(req.params.id, valide);
            const conseil = await Conseil.trouverParId(req.params.id);
            return success(res, conseil, 'Diagnostic mis a jour');
        } catch (err) {
            return error(res, err.message);
        }
    }
};

module.exports = conseilController;