// Utilitaire reseau partage : fetch() ne timeout jamais par defaut sur React Native, ce qui
// laisse une requete bloquee indefiniment sur une connexion mobile instable. On force un delai
// raisonnable ET on retente une fois automatiquement avant d'abandonner : un pic de lenteur
// passager (signal faible, bascule mobile/wifi) ne doit pas faire echouer l'action du premier coup.
// On ne retente que les echecs reseau (timeout / connexion perdue), jamais une reponse HTTP recue
// (401, 500...) qui, elle, reflete un vrai etat serveur et doit remonter telle quelle.

const DELAI_ENTRE_TENTATIVES_MS = 1200;

function estErreurReseau(e: any) {
  return e?.name === 'AbortError' || e?.message === 'Network request failed';
}

export async function fetchAvecResilience(
  url: string,
  options: RequestInit,
  { timeoutMs = 20000, tentatives = 2 }: { timeoutMs?: number; tentatives?: number } = {}
): Promise<Response> {
  let derniereErreur: any;

  for (let essai = 1; essai <= tentatives; essai++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (e: any) {
      derniereErreur = e;
      if (!estErreurReseau(e) || essai === tentatives) break;
      await new Promise((r) => setTimeout(r, DELAI_ENTRE_TENTATIVES_MS));
    } finally {
      clearTimeout(timer);
    }
  }

  if (derniereErreur?.name === 'AbortError') {
    throw new Error('Le serveur met trop de temps a repondre. Verifie ta connexion et reessaie.');
  }
  throw new Error('Impossible de contacter le serveur. Verifie ta connexion internet.');
}
