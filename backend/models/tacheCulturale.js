const db = require('../config/db');

// Checklist standard generee automatiquement a la creation d'une culture
// (calendrier agricole simplifie, memes seuils que Culture.calendrierAgricole)
const TACHES_STANDARD = [
    { nom: 'Repiquage', jour_cible: 30 },
    { nom: 'Premier sarclage', jour_cible: 60 },
    { nom: 'Fertilisation', jour_cible: 90 },
    { nom: 'Recolte', jour_cible: 120 },
];

const TacheCulturale = {

    async creer(data) {
        const [result] = await db.execute(
            `INSERT INTO taches_culturales (culture_id, tache_nom, jour_cible)
            VALUES (?, ?, ?)`,
            [data.culture_id, data.tache_nom, data.jour_cible]
        );
        return result.insertId;
    },

    // Genere les 4 taches standard pour une culture qui vient d'etre creee
    async creerTachesStandard(culture_id) {
        for (const tache of TACHES_STANDARD) {
            await TacheCulturale.creer({ culture_id, tache_nom: tache.nom, jour_cible: tache.jour_cible });
        }
    },

    async trouverParCulture(culture_id) {
        const [rows] = await db.execute(
            `SELECT * FROM taches_culturales WHERE culture_id = ? ORDER BY jour_cible ASC`,
            [culture_id]
        );
        return rows;
    },

    async trouverParId(id) {
        const [rows] = await db.execute(
            `SELECT * FROM taches_culturales WHERE tache_id = ?`,
            [id]
        );
        return rows[0];
    },

    async terminer(id) {
        const [result] = await db.execute(
            `UPDATE taches_culturales SET termine = TRUE, date_completion = NOW() WHERE tache_id = ?`,
            [id]
        );
        return result.affectedRows;
    }

};

module.exports = TacheCulturale;
