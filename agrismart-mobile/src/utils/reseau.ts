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

// Sur certains appareils Android, AbortController n'annule pas vraiment la requete
// native sous-jacente : fetch() ne rejette jamais et reste bloque pour de vrai, meme
// apres controller.abort(). On fait donc courir fetch() contre ce delai independant,
// qui rejette de son cote quoi qu'il arrive -- la fonction abandonne toujours au bout
// de timeoutMs, meme si l'annulation native a echoue (la requete fantome continue en
// arriere-plan sans bloquer l'app, elle est juste ignoree).
function delaiForce(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const e: any = new Error('Timeout force cote client');
      e.name = 'AbortError';
      reject(e);
    }, ms);
  });
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
      return await Promise.race([
        fetch(url, { ...options, signal: controller.signal }),
        delaiForce(timeoutMs),
      ]);
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
