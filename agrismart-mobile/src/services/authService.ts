import { API_BASE_URL } from '@/constants/api';
import { fetchAvecResilience } from '@/utils/reseau';

async function handleResponse(res: Response) {
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || 'Erreur serveur');
  }
  return json.data;
}

// 20s par tentative + 1 retry automatique sur echec reseau (voir utils/reseau.ts) : une
// connexion mobile faible a le temps de rattraper un pic de lenteur avant qu'on abandonne.
function fetchAvecTimeout(url: string, options: RequestInit) {
  return fetchAvecResilience(url, options, { timeoutMs: 20000, tentatives: 2 });
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