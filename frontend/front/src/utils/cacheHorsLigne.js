// Mode hors-ligne leger (module transversal 0) : pas de Service Worker/Workbox (trop fragile a
// configurer correctement dans Create React App sans risquer de casser le cache de prod), juste
// un cache localStorage de la derniere reponse reussie par endpoint + une petite file d'actions
// en attente (parcelle creee, sujet de forum poste) rejouee automatiquement au retour du reseau.

const PREFIXE_CACHE = 'agrismart_cache_';
const CLE_FILE_ATTENTE = 'agrismart_actions_en_attente';

export function estEnLigne() {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function sauvegarderCache(cle, data) {
    try {
        localStorage.setItem(PREFIXE_CACHE + cle, JSON.stringify({ data, date: Date.now() }));
    } catch {
        // Stockage plein ou indisponible : le mode hors-ligne degrade simplement, ce n'est pas bloquant
    }
}

// Retourne { data, date } ou null si rien n'est en cache pour cette cle
export function lireCache(cle) {
    try {
        const brut = localStorage.getItem(PREFIXE_CACHE + cle);
        return brut ? JSON.parse(brut) : null;
    } catch {
        return null;
    }
}

function lireFileAttente() {
    try {
        const brut = localStorage.getItem(CLE_FILE_ATTENTE);
        return brut ? JSON.parse(brut) : [];
    } catch {
        return [];
    }
}

function ecrireFileAttente(actions) {
    try {
        localStorage.setItem(CLE_FILE_ATTENTE, JSON.stringify(actions));
    } catch {
        // idem : degradation silencieuse
    }
}

// type: identifiant de l'action (ex: 'parcelle', 'sujet_forum'), payload: donnees a renvoyer plus tard
export function ajouterActionEnAttente(type, payload) {
    const actions = lireFileAttente();
    actions.push({ id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, type, payload, date: Date.now() });
    ecrireFileAttente(actions);
}

export function listerActionsEnAttente() {
    return lireFileAttente();
}

export function compterActionsEnAttente() {
    return lireFileAttente().length;
}

// executants : { [type]: async (payload) => void } - une fonction par type d'action a rejouer.
// Chaque action reussie est retiree de la file ; les echecs restent pour la prochaine tentative.
export async function synchroniserActionsEnAttente(executants) {
    const actions = lireFileAttente();
    if (actions.length === 0) return { reussies: 0, restantes: 0 };

    const restantes = [];
    let reussies = 0;
    for (const action of actions) {
        const executant = executants[action.type];
        if (!executant) {
            restantes.push(action);
            continue;
        }
        try {
            await executant(action.payload);
            reussies++;
        } catch {
            restantes.push(action);
        }
    }
    ecrireFileAttente(restantes);
    return { reussies, restantes: restantes.length };
}
