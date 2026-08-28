// Base de connaissances symptomes -> maladie pour le diagnostic rapide (module 8.3).
// Heuristique simple par recouvrement de symptomes, pas un modele de machine learning :
// le resultat reste toujours soumis a validation par un expert (conseils_agricoles.conseil_valide_par_expert).
// Couvre les 3 cultures les plus repandues a Madagascar + les maladies courantes associees.
const BASE_SYMPTOMES = [
    {
        culture: 'riz',
        maladie: 'Pyriculariose du riz',
        symptomes: [
            'Taches brunes en forme de losange sur les feuilles',
            'Lesions grises au centre des taches',
            'Epillets vides ou mal remplis',
            'Fletrissement du col de la panicule',
        ],
        confiance_base: 55,
        traitement_bio: "Retirer et bruler les feuilles atteintes, espacer davantage les plants pour ameliorer l'aeration, appliquer un extrait de neem en prevention.",
    },
    {
        culture: 'riz',
        maladie: 'Charancon du riz',
        symptomes: [
            'Petits trous dans les grains stockes',
            'Presence de larves blanches dans les grains',
            'Grains creux ou reduits en poudre',
            "Grains qui flottent a la surface de l'eau",
        ],
        confiance_base: 50,
        traitement_bio: 'Secher soigneusement le riz avant stockage, utiliser des sacs hermetiques, ajouter des feuilles de neem sechees dans les sacs de stockage.',
    },
    {
        culture: 'mais',
        maladie: 'Mildiou du mais',
        symptomes: [
            'Stries jaune pale le long des nervures',
            'Duvet blanchatre sous la feuille',
            'Feuilles deformees et rabougries',
            'Epis mal formes ou absents',
        ],
        confiance_base: 50,
        traitement_bio: 'Arracher et detruire les plants fortement atteints, ameliorer le drainage de la parcelle, pratiquer une rotation avec une culture non-cerealiere.',
    },
    {
        culture: 'manioc',
        maladie: 'Mosaique du manioc',
        symptomes: [
            'Mosaique jaune-vert sur les feuilles',
            'Feuilles deformees et reduites en taille',
            'Croissance ralentie de la plante',
            'Racines tuberuses peu developpees',
        ],
        confiance_base: 55,
        traitement_bio: 'Utiliser des boutures saines certifiees, arracher et bruler les plants atteints, lutter contre les mouches blanches (vecteur du virus) avec un savon noir dilue.',
    },
];

const CULTURES_COUVERTES = [...new Set(BASE_SYMPTOMES.map((e) => e.culture))];

function symptomesPourCulture(culture) {
    const cultureNorm = (culture || '').trim().toLowerCase();
    const symptomes = new Set();
    BASE_SYMPTOMES.filter((e) => e.culture === cultureNorm).forEach((e) => e.symptomes.forEach((s) => symptomes.add(s)));
    return [...symptomes];
}

// Score = confiance de base du modele + bonus proportionnel au taux de symptomes reconnus,
// plafonne a 95% (le systeme ne revendique jamais une certitude absolue).
function diagnostiquer(culture, symptomesSignales) {
    const cultureNorm = (culture || '').trim().toLowerCase();
    const signales = new Set((symptomesSignales || []).map((s) => s.trim()));
    if (signales.size === 0) return null;

    let meilleur = null;
    for (const entree of BASE_SYMPTOMES.filter((e) => e.culture === cultureNorm)) {
        const correspondances = entree.symptomes.filter((s) => signales.has(s)).length;
        if (correspondances === 0) continue;
        const taux = correspondances / entree.symptomes.length;
        const confiance = Math.min(95, Math.round(entree.confiance_base + taux * 40));
        if (!meilleur || confiance > meilleur.confiance) {
            meilleur = { maladie: entree.maladie, confiance, traitement_bio: entree.traitement_bio };
        }
    }
    return meilleur;
}

module.exports = { BASE_SYMPTOMES, CULTURES_COUVERTES, symptomesPourCulture, diagnostiquer };
