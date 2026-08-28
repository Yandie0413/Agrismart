import { apiDelete, apiGet, apiPost, apiPut } from '@/services/apiClient';

export type Parcelle = {
  parcelle_id: number;
  exploitation_id: number;
  localisation_id: number | null;
  parcelle_nom: string;
  parcelle_superficie: number;
  parcelle_latitude?: number | null;
  parcelle_longitude?: number | null;
};

export async function getParcelles(token: string | null, exploitationId: number): Promise<Parcelle[]> {
  return apiGet(`/exploitations/${exploitationId}/parcelles`, token);
}

export async function ajouterParcelle(
  token: string | null,
  exploitationId: number,
  data: { nom: string; superficie: number; localisation_id?: number | null }
): Promise<Parcelle> {
  return apiPost(`/exploitations/${exploitationId}/parcelles`, token, data);
}

export async function modifierParcelle(
  token: string | null,
  parcelleId: number,
  data: { nom: string; superficie: number; localisation_id?: number | null }
): Promise<Parcelle> {
  return apiPut(`/parcelles/${parcelleId}`, token, data);
}

export async function supprimerParcelle(token: string | null, parcelleId: number) {
  return apiDelete(`/parcelles/${parcelleId}`, token);
}
