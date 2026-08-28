import { apiGet, apiPost } from '@/services/apiClient';

export type Localisation = {
  localisation_id: number;
  localisation_latitude: number;
  localisation_longitude: number;
  localisation_adresse: string;
};

export type LocalisationComplete = Localisation & {
  exploitation_nom?: string;
  exploitation_superficie?: number;
  agriculteur_nom?: string;
};

export async function getMesLocalisations(token: string | null): Promise<Localisation[]> {
  return apiGet('/localisations', token);
}

export async function getToutesLocalisations(token: string | null): Promise<LocalisationComplete[]> {
  return apiGet('/localisations/toutes', token);
}
export async function creerLocalisation(
  token: string | null,
  data: { latitude: number; longitude: number; adresse: string }
): Promise<Localisation> {
  return apiPost('/localisations', token, data);
}

export async function getLocalisation(token: string | null, id: number): Promise<Localisation> {
  return apiGet(`/localisations/${id}`, token);
}