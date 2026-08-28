import { apiGet, apiPost, apiPut } from '@/services/apiClient';

export type Conseil = {
  conseil_id: number;
  utilisateur_id: number;
  culture_id: number;
  conseil_titre: string;
  conseil_contenu: string;
  conseil_date_publication: string;
  conseil_categorie: string;
  conseil_origine?: 'expert' | 'systeme';
  conseil_valide_par_expert?: boolean | null;
  auteur: string;
};

export async function getConseils(token: string | null): Promise<Conseil[]> {
  return apiGet('/conseils', token);
}

export async function genererConseilsAutomatiques(token: string | null): Promise<Conseil[]> {
  return apiPost('/conseils/generer', token, {});
}

export async function getConseilsParCulture(
  token: string | null,
  cultureId: number
): Promise<Conseil[]> {
  return apiGet(`/conseils/culture/${cultureId}`, token);
}

export type BaseSymptomes = {
  cultures: string[];
  symptomesParCulture: Record<string, string[]>;
};

export type ResultatDiagnostic = {
  maladie: string;
  confiance: number;
  traitement_bio: string;
} | null;

export async function getBaseSymptomes(token: string | null): Promise<BaseSymptomes> {
  return apiGet('/conseils/base-symptomes', token);
}

export async function diagnostiquer(
  token: string | null,
  data: { culture: string; symptomes: string[] }
): Promise<{ conseil: Conseil; resultat: ResultatDiagnostic }> {
  return apiPost('/conseils/diagnostic', token, data);
}

export async function validerDiagnostic(
  token: string | null,
  id: number,
  valide: boolean
): Promise<Conseil> {
  return apiPut(`/conseils/${id}/valider-diagnostic`, token, { valide });
}