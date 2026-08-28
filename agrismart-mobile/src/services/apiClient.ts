import { API_BASE_URL } from '@/constants/api';
import { lireCache, sauvegarderCache } from '@/utils/cacheHorsLigne';

const NGROK_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
};

async function handleResponse(res: Response) {
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Réponse invalide du serveur (pas du JSON)');
  }
  if (!json.success) {
    throw new Error(json.message || 'Erreur serveur');
  }
  return json.data;
}

// Mode hors-ligne (module transversal 0) : seule une vraie coupure reseau (fetch qui echoue avant
// meme d'obtenir une reponse) retombe sur le cache. Une reponse HTTP d'erreur (401/404/validation...)
// est toujours propagee normalement, jamais masquee par une donnee perimee.
export async function apiGet(endpoint: string, token: string | null) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...NGROK_HEADERS,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err) {
    const cache = await lireCache(endpoint);
    if (cache) return cache.data;
    throw err;
  }
  const data = await handleResponse(res);
  sauvegarderCache(endpoint, data);
  return data;
}

export async function apiPut(endpoint: string, token: string | null, body: any = {}) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...NGROK_HEADERS,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiPost(endpoint: string, token: string | null, body: any) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...NGROK_HEADERS,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}
export async function apiDelete(endpoint: string, token: string | null) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...NGROK_HEADERS,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return handleResponse(res);
}

export async function apiUpload(endpoint: string, token: string | null, formData: FormData) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      ...NGROK_HEADERS,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Pas de Content-Type ici : fetch le genere automatiquement avec le bon boundary pour FormData
    },
    body: formData,
  });
  return handleResponse(res);
}