import { apiDelete, apiGet, apiPost } from '@/services/apiClient';

export type SujetForum = {
  sujet_id: number;
  utilisateur_id: number;
  sujet_titre: string;
  sujet_contenu: string;
  sujet_categorie: string;
  created_at: string;
  auteur: string;
  auteur_role: string;
  nombre_reponses?: number;
  nombre_likes?: number;
  deja_like?: boolean;
};

export type ReponseForum = {
  reponse_id: number;
  sujet_id: number;
  utilisateur_id: number;
  reponse_contenu: string;
  created_at: string;
  auteur: string;
  auteur_role: string;
  nombre_likes?: number;
  deja_like?: boolean;
};

export type SujetForumDetail = SujetForum & { reponses: ReponseForum[] };

export async function getSujets(token: string | null): Promise<SujetForum[]> {
  return apiGet('/forum', token);
}

export async function getSujet(token: string | null, id: number): Promise<SujetForumDetail> {
  return apiGet(`/forum/${id}`, token);
}

export async function creerSujet(
  token: string | null,
  data: { titre: string; contenu: string; categorie?: string }
): Promise<SujetForum> {
  return apiPost('/forum', token, data);
}

export async function supprimerSujet(token: string | null, id: number) {
  return apiDelete(`/forum/${id}`, token);
}

export async function repondreSujet(
  token: string | null,
  id: number,
  data: { contenu: string }
): Promise<ReponseForum[]> {
  return apiPost(`/forum/${id}/reponses`, token, data);
}

export async function supprimerReponse(token: string | null, id: number) {
  return apiDelete(`/forum/reponses/${id}`, token);
}

export async function likerSujet(
  token: string | null,
  id: number
): Promise<{ deja_like: boolean; nombre_likes: number }> {
  return apiPost(`/forum/${id}/like`, token, {});
}

export async function likerReponse(
  token: string | null,
  id: number
): Promise<{ deja_like: boolean; nombre_likes: number }> {
  return apiPost(`/forum/reponses/${id}/like`, token, {});
}
