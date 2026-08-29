import { API_BASE_URL } from '@/constants/api';

async function handleResponse(res: Response) {
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || 'Erreur serveur');
  }
  return json.data;
}

// fetch() ne timeout jamais par defaut sur React Native : sur un reseau mobile
// instable, une requete peut rester en attente indefiniment sans jamais
// resoudre ni rejeter. On force un delai raisonnable et on traduit les
// erreurs reseau brutes ("Network request failed", AbortError) en message
// comprehensible plutot que de laisser echouer silencieusement.
async function fetchAvecTimeout(url: string, options: RequestInit, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e: any) {
    if (e.name === 'AbortError') {
      throw new Error('Le serveur met trop de temps a repondre. Verifie ta connexion et reessaie.');
    }
    throw new Error('Impossible de contacter le serveur. Verifie ta connexion internet.');
  } finally {
    clearTimeout(timer);
  }
}

export async function loginRequest(email: string, mot_de_passe: string) {
  const res = await fetchAvecTimeout(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, mot_de_passe }),
  });
  return handleResponse(res);
}

export async function verifyOtpRequest(email: string, code: string) {
  const res = await fetchAvecTimeout(`${API_BASE_URL}/auth/verifier-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  return handleResponse(res);
}

export async function registerRequest(
  nom: string,
  email: string,
  mot_de_passe: string,
  role: 'agriculteur' | 'expert',
  telephone?: string
) {
  const res = await fetchAvecTimeout(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nom, email, mot_de_passe, role, telephone }),
  });
  return handleResponse(res);
}

export async function demanderResetRequest(email: string) {
  const res = await fetchAvecTimeout(`${API_BASE_URL}/auth/demander-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function reinitialiserMotDePasseRequest(token: string, nouveau_mot_de_passe: string) {
  const res = await fetchAvecTimeout(`${API_BASE_URL}/auth/reinitialiser-mot-de-passe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, nouveau_mot_de_passe }),
  });
  return handleResponse(res);
}

export async function getProfilRequest(token: string | null) {
  const res = await fetchAvecTimeout(`${API_BASE_URL}/auth/profil`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function toggleDeuxFacteursRequest(token: string | null, activer: boolean) {
  const res = await fetchAvecTimeout(`${API_BASE_URL}/auth/2fa`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ activer }),
  });
  return handleResponse(res);
}