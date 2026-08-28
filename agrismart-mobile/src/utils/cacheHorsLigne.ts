import AsyncStorage from '@react-native-async-storage/async-storage';

// Mode hors-ligne leger (module transversal 0) : cache AsyncStorage de la derniere reponse
// reussie par endpoint (meteo/calendrier/prix restent consultables hors-ligne) + une petite file
// d'actions en attente (parcelle creee, sujet de forum poste) rejouee automatiquement au retour
// du reseau (detecte via @react-native-community/netinfo, cf. NetworkContext).

const PREFIXE_CACHE = 'agrismart_cache_';
const CLE_FILE_ATTENTE = 'agrismart_actions_en_attente';

export async function sauvegarderCache(cle: string, data: unknown) {
  try {
    await AsyncStorage.setItem(PREFIXE_CACHE + cle, JSON.stringify({ data, date: Date.now() }));
  } catch {
    // Stockage plein ou indisponible : degradation silencieuse, pas bloquant
  }
}

export async function lireCache<T = unknown>(cle: string): Promise<{ data: T; date: number } | null> {
  try {
    const brut = await AsyncStorage.getItem(PREFIXE_CACHE + cle);
    return brut ? JSON.parse(brut) : null;
  } catch {
    return null;
  }
}

export type ActionEnAttente = {
  id: string;
  type: string;
  payload: any;
  date: number;
};

async function lireFileAttente(): Promise<ActionEnAttente[]> {
  try {
    const brut = await AsyncStorage.getItem(CLE_FILE_ATTENTE);
    return brut ? JSON.parse(brut) : [];
  } catch {
    return [];
  }
}

async function ecrireFileAttente(actions: ActionEnAttente[]) {
  try {
    await AsyncStorage.setItem(CLE_FILE_ATTENTE, JSON.stringify(actions));
  } catch {
    // idem : degradation silencieuse
  }
}

export async function ajouterActionEnAttente(type: string, payload: any) {
  const actions = await lireFileAttente();
  actions.push({ id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, type, payload, date: Date.now() });
  await ecrireFileAttente(actions);
}

export async function listerActionsEnAttente(): Promise<ActionEnAttente[]> {
  return lireFileAttente();
}

export async function compterActionsEnAttente(): Promise<number> {
  return (await lireFileAttente()).length;
}

// executants : une fonction par type d'action a rejouer. Chaque action reussie est retiree de la
// file ; les echecs restent pour la prochaine tentative (prochain retour de connexion).
export async function synchroniserActionsEnAttente(
  executants: Record<string, (payload: any) => Promise<any>>
): Promise<{ reussies: number; restantes: number }> {
  const actions = await lireFileAttente();
  if (actions.length === 0) return { reussies: 0, restantes: 0 };

  const restantes: ActionEnAttente[] = [];
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
  await ecrireFileAttente(restantes);
  return { reussies, restantes: restantes.length };
}
