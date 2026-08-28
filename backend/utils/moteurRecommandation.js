// Moteur de recommandation par regles : croise meteo (temperature/humidite) et stade de culture
// pour generer des conseils cibles, sans dependance a une API IA externe.

const PRECISIONS_CULTURE = {
    riz: "Le riz est particulierement sensible a l'exces ou au manque d'eau selon son stade.",
    manioc: 'Le manioc tolere bien la secheresse mais craint les sols gorges d\'eau.',
    'maïs': "Le maïs est sensible au stress hydrique surtout en periode de floraison.",
};

function precisionCulture(culture_type) {
    const type = (culture_type || '').toLowerCase();
    for (const cle of Object.keys(PRECISIONS_CULTURE)) {
        if (type.includes(cle)) return PRECISIONS_CULTURE[cle];
    }
    return '';
}

function genererConseilsPourCulture({ culture_type, stade_culture, temperature, humidite, pluie_prevue_demain_mm }) {
    const conseils = [];
    const precision = precisionCulture(culture_type);

    // Regle basee sur la prevision (pas seulement les conditions actuelles) : pluie significative
    // annoncee pour demain -> l'engrais serait lessive avant d'avoir agi.
    if (pluie_prevue_demain_mm > 10) {
        conseils.push({
            titre: `Pluie prevue demain : reporte l'epandage d'engrais sur ${culture_type}`,
            contenu: `${Math.round(pluie_prevue_demain_mm)} mm de pluie sont annonces pour demain. L'engrais serait lessive avant d'agir efficacement : attends une periode plus seche pour epandre.`,
            categorie: 'sol',
        });
    }

    if (humidite > 85 && ['Floraison', 'Croissance'].includes(stade_culture)) {
        conseils.push({
            titre: `Risque de maladie fongique sur ta culture de ${culture_type}`,
            contenu: `Humidite elevee (${humidite}%) au stade ${stade_culture}. Surveille l'apparition de taches ou de moisissures et espace davantage les arrosages. ${precision}`,
            categorie: 'maladie',
        });
    }

    if (temperature > 38) {
        conseils.push({
            titre: `Canicule : proteger ta culture de ${culture_type}`,
            contenu: `Temperature elevee (${Math.round(temperature)}C). Augmente la frequence d'irrigation et privilegie un arrosage tot le matin ou en soiree. ${precision}`,
            categorie: 'irrigation',
        });
    }

    if (temperature > 32 && humidite < 30 && ['Germination', 'Croissance'].includes(stade_culture)) {
        conseils.push({
            titre: `Secheresse : ${culture_type} au stade ${stade_culture} a surveiller`,
            contenu: `Conditions seches (${Math.round(temperature)}C, ${humidite}% d'humidite). Le sol risque de manquer d'eau a ce stade critique, irrigue plus regulierement. ${precision}`,
            categorie: 'irrigation',
        });
    }

    if (temperature < 5) {
        conseils.push({
            titre: `Risque de gel pour ta culture de ${culture_type}`,
            contenu: `Temperature basse (${Math.round(temperature)}C). Protege tes plants les plus jeunes avec un paillage ou une bache si possible.`,
            categorie: 'general',
        });
    }

    if (stade_culture === 'Germination' && humidite < 40) {
        conseils.push({
            titre: `Levee compromise pour ${culture_type}`,
            contenu: `Humidite basse (${humidite}%) pendant la germination. Un manque d'eau a ce stade peut empecher une bonne levee, irrigue legerement mais regulierement.`,
            categorie: 'irrigation',
        });
    }

    if (stade_culture === 'Recolte' && humidite > 80) {
        conseils.push({
            titre: `Avance la recolte de ta culture de ${culture_type}`,
            contenu: `Humidite elevee (${humidite}%) au stade recolte. Risque de pourrissement, envisage d'avancer la recolte si la maturite le permet.`,
            categorie: 'recolte',
        });
    }

    if (stade_culture === 'Floraison' && temperature < 15) {
        conseils.push({
            titre: `Chute de fleurs possible sur ${culture_type}`,
            contenu: `Temperature basse (${Math.round(temperature)}C) pendant la floraison. Les fleurs peuvent tomber prematurement, limite les chocs thermiques si possible (paillage, protection).`,
            categorie: 'general',
        });
    }

    if (conseils.length === 0) {
        conseils.push({
            titre: `Conditions stables pour ta culture de ${culture_type}`,
            contenu: `Aucune alerte particuliere au stade ${stade_culture}. Poursuis l'entretien habituel (desherbage, surveillance des parasites). ${precision}`,
            categorie: 'sol',
        });
    }

    return conseils;
}

module.exports = { genererConseilsPourCulture };
