const Meteo = require('../models/meteo');
const Alerte = require('../models/alerte');
const Notification = require('../models/notification');
const Agriculteur = require('../models/agriculteur');
const meteoApi = require('../utils/meteoApi');
const { success, error } = require('../utils/response');
const db = require('../config/db');

const meteoController = {

    async meteoTempsReel(req, res) {
        try {
            const { ville } = req.params;
            const meteo = await meteoApi.parVille(ville);
            return success(res, meteo);
        } catch (err) {
            return error(res, 'Ville non trouvee ou API indisponible', 404);
        }
    },

    async meteoParCoordonnees(req, res) {
        try {
            const { latitude, longitude } = req.query;
            const meteo = await meteoApi.parCoordonnees(latitude, longitude);
            return success(res, meteo);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async previsions(req, res) {
        try {
            const { ville } = req.params;
            const previsions = await meteoApi.previsions(ville);
            return success(res, previsions);
        } catch (err) {
            return error(res, 'Ville non trouvee ou API indisponible', 404);
        }
    },

    // Previsions journalieres avec ET0/temperature du sol estimee/risques gradues (module 8.4)
    async previsionsAvancees(req, res) {
        try {
            const { ville } = req.params;
            const previsions = await meteoApi.previsionsAvancees(ville);
            return success(res, previsions);
        } catch (err) {
            return error(res, 'Ville non trouvee ou API indisponible', 404);
        }
    },

    async previsionsAvanceesParCoordonnees(req, res) {
        try {
            const { latitude, longitude } = req.query;
            const previsions = await meteoApi.previsionsAvanceesParCoordonnees(latitude, longitude);
            return success(res, previsions);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async genererAlertesTempsReel(req, res) {
        try {
            const { ville } = req.params;
            const region = req.query.region || null;
            const meteo = await meteoApi.parVille(ville);
            const { temperature, humidite } = meteo;

            const alertesADeclencher = [];

            if (temperature > 38) {
                alertesADeclencher.push({
                    type: 'canicule',
                    message: `Temperature elevee : ${Math.round(temperature)}C. Risque de stress hydrique pour les cultures. Augmentez la frequence d'irrigation.`,
                });
            }
            if (temperature < 5) {
                alertesADeclencher.push({
                    type: 'gel',
                    message: `Temperature basse : ${Math.round(temperature)}C. Risque de gel pour les cultures sensibles. Protegez vos plants.`,
                });
            }
            if (temperature > 32 && humidite < 30) {
                alertesADeclencher.push({
                    type: 'secheresse',
                    message: `Conditions seches : ${Math.round(temperature)}C avec ${humidite}% d'humidite. Risque de secheresse pour les sols.`,
                });
            }
            if (humidite > 85) {
                alertesADeclencher.push({
                    type: 'inondation',
                    message: `Humidite tres elevee : ${humidite}%. Risque d'exces d'eau et de pourrissement des racines.`,
                });
            }
            if (temperature > 25 && temperature < 32 && humidite > 70) {
                alertesADeclencher.push({
                    type: 'maladie',
                    message: `Conditions chaudes et humides (${Math.round(temperature)}C, ${humidite}%) favorables au developpement de maladies fongiques.`,
                });
            }

            await Alerte.supprimerAlertesAutomatiques();

            for (const alerte of alertesADeclencher) {
                await Alerte.creer({
                    meteo_id: null,
                    type: alerte.type,
                    message: alerte.message,
                    date: new Date().toISOString().split('T')[0],
                    statut: 'active',
                    region
                });
            }

            // Notifier les agriculteurs concernes (ceux de la region ciblee, ou tous si aucune region precisee)
            if (alertesADeclencher.length > 0) {
                const [agriculteurs] = region
                    ? [(await Agriculteur.trouverParRegion(region)).map((id) => ({ utilisateur_id: id }))]
                    : [(await db.execute(`SELECT utilisateur_id FROM utilisateurs WHERE utilisateur_role = 'agriculteur'`))[0]];
                for (const agriculteur of agriculteurs) {
                    for (const alerte of alertesADeclencher) {
                        await Notification.creer({
                            utilisateur_id: agriculteur.utilisateur_id,
                            type: 'meteo',
                            titre: `Alerte meteo : ${alerte.type}`,
                            contenu: alerte.message,
                            lien: '/meteo'
                        });
                    }
                }
            }

            return success(res, {
                meteo,
                alertes_declenchees: alertesADeclencher.length,
                alertes: alertesADeclencher
            }, 'Alertes generees');
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Alerte regionale declenchee manuellement par un expert/administrateur
    async alerteRegionale(req, res) {
        try {
            const { region, type_menace, recommandation } = req.body;
            if (!region?.trim() || !type_menace?.trim() || !recommandation?.trim()) {
                return error(res, 'Region, type de menace et recommandation sont obligatoires', 400);
            }

            const alerteId = await Alerte.creer({
                meteo_id: null,
                type: type_menace.trim(),
                message: recommandation.trim(),
                date: new Date().toISOString().split('T')[0],
                statut: 'active',
                region: region.trim()
            });

            const agriculteurIds = await Agriculteur.trouverParRegion(region.trim());
            for (const utilisateur_id of agriculteurIds) {
                await Notification.creer({
                    utilisateur_id,
                    type: 'alerte_regionale',
                    titre: `Alerte regionale : ${type_menace.trim()}`,
                    contenu: recommandation.trim(),
                    lien: '/meteo'
                });
            }

            const alerte = await Alerte.trouverParId(alerteId);
            return success(res, alerte, `Alerte diffusee a ${agriculteurIds.length} agriculteur(s)`, 201);
        } catch (err) {
            return error(res, err.message);
        }
    },

    // Alertes actives concernant la region de l'agriculteur connecte (ou generales)
    async mesAlertesRegion(req, res) {
        try {
            const profil = await Agriculteur.trouverParUtilisateur(req.utilisateur.id);
            const alertes = await Alerte.trouverParRegion(profil?.agriculteur_region || null);
            return success(res, alertes);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async creer(req, res) {
        try {
            const { localisation_id, temperature, humidite, prevision, date_releve } = req.body;

            const id = await Meteo.creer({ localisation_id, temperature, humidite, prevision, date_releve });
            const meteo = await Meteo.trouverParId(id);

            const alertesADeclencher = [];

            if (temperature > 38) {
                alertesADeclencher.push({
                    type: 'canicule',
                    message: `Temperature elevee : ${temperature}C. Risque de stress hydrique pour les cultures.`,
                });
            }
            if (temperature < 5) {
                alertesADeclencher.push({
                    type: 'gel',
                    message: `Temperature basse : ${temperature}C. Risque de gel pour les cultures sensibles.`,
                });
            }
            if (temperature > 32 && humidite < 30) {
                alertesADeclencher.push({
                    type: 'secheresse',
                    message: `Conditions seches : ${temperature}C avec ${humidite}% d'humidite.`,
                });
            }
            if (humidite > 85) {
                alertesADeclencher.push({
                    type: 'inondation',
                    message: `Humidite tres elevee : ${humidite}%. Risque d'exces d'eau.`,
                });
            }
            if (temperature > 25 && temperature < 32 && humidite > 70) {
                alertesADeclencher.push({
                    type: 'maladie',
                    message: `Conditions favorables aux maladies fongiques (${temperature}C, ${humidite}%).`,
                });
            }

            for (const alerte of alertesADeclencher) {
                await Alerte.creer({
                    meteo_id: id,
                    type: alerte.type,
                    message: alerte.message,
                    date: date_releve,
                    statut: 'active'
                });
            }

            // Notifier tous les agriculteurs
            if (alertesADeclencher.length > 0) {
                const [agriculteurs] = await db.execute(
                    `SELECT utilisateur_id FROM utilisateurs WHERE utilisateur_role = 'agriculteur'`
                );
                for (const agriculteur of agriculteurs) {
                    for (const alerte of alertesADeclencher) {
                        await Notification.creer({
                            utilisateur_id: agriculteur.utilisateur_id,
                            type: 'meteo',
                            titre: `Alerte meteo : ${alerte.type}`,
                            contenu: alerte.message,
                            lien: '/meteo'
                        });
                    }
                }
            }

            return success(res, { meteo, alertes_declenchees: alertesADeclencher.length }, 'Releve meteo ajoute', 201);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async lister(req, res) {
        try {
            const meteos = await Meteo.trouverTous();
            return success(res, meteos);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async obtenir(req, res) {
        try {
            const meteo = await Meteo.trouverParId(req.params.id);
            if (!meteo) return error(res, 'Releve non trouve', 404);
            return success(res, meteo);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async listerAlertes(req, res) {
        try {
            const alertes = await Alerte.trouverToutes();
            return success(res, alertes);
        } catch (err) {
            return error(res, err.message);
        }
    },

    async modifierStatutAlerte(req, res) {
        try {
            const { statut } = req.body;
            await Alerte.modifierStatut(req.params.id, statut);
            const alerte = await Alerte.trouverParId(req.params.id);
            return success(res, alerte, 'Statut alerte modifie');
        } catch (err) {
            return error(res, err.message);
        }
    }
};

module.exports = meteoController;