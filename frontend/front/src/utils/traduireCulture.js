// Traduit le nom d'une culture saisi par l'utilisateur (toujours stocke en francais en base)
// vers la langue active de l'app, via le dictionnaire de vocabulaire agricole (translation.json).
const CLES_CULTURES = [
    ['pomme de terre', 'culturePatate'],
    ['patate', 'culturePatate'],
    ['riz', 'cultureRiz'],
    ['maïs', 'cultureMais'],
    ['mais', 'cultureMais'],
    ['manioc', 'cultureManioc'],
    ['taro', 'cultureTaro'],
    ['vanille', 'cultureVanille'],
    ['girofle', 'cultureGirofle'],
    ['café', 'cultureCafe'],
    ['cafe', 'cultureCafe'],
    ['cacao', 'cultureCacao'],
    ['poivre', 'culturePoivre'],
    ['canne', 'cultureCanne'],
    ['haricot', 'cultureHaricot'],
    ['pois', 'culturePois'],
    ['tomate', 'cultureTomate'],
    ['oignon', 'cultureOignon'],
    ['carotte', 'cultureCarotte'],
    ['chou', 'cultureChou'],
    ['banane', 'cultureBanane'],
    ['mangue', 'cultureMangue'],
    ['ananas', 'cultureAnanas'],
];

export function traduireCulture(nomCulture, t) {
    if (!nomCulture) return nomCulture;
    const nomMinuscule = nomCulture.toLowerCase();
    const entree = CLES_CULTURES.find(([motCle]) => nomMinuscule.includes(motCle));
    if (!entree) return nomCulture;
    return t(`dictionnaire.${entree[1]}`);
}
