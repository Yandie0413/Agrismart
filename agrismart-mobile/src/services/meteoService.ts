import { apiGet, apiPost } from '@/services/apiClient';

export type Meteo = {
  meteo_id: number;
  localisation_id: number;
  meteo_temperature: number;
  meteo_humidite: number;
  meteo_prevision: string;
  meteo_date_releve: string;
};

export async function getDernierReleve(token: string | null): Promise<Meteo | null> {
  const releves: Meteo[] = await apiGet('/meteo', token);
  return releves.length > 0 ? releves[0] : null;
}
export type MeteoTempsReel = {
    ville: string;
    pays: string;
    temperature: number;
    temperature_ressentie: number;
    humidite: number;
    pression: number;
    visibilite: number;
    description: string;
    vitesse_vent: number;
    pluviometrie: number;
    temperature_sol_estimee?: number;
    temperature_sol_estimation?: boolean;
    risque_gel?: number;
    risque_secheresse?: number;
    date: string;
  };

  export async function getMeteoParCoordonnees(
    latitude: number,
    longitude: number,
    token: string | null
  ): Promise<MeteoTempsReel> {
    return apiGet(`/meteo/coordonnees?latitude=${latitude}&longitude=${longitude}`, token);
  }

export type Prevision = {
  date: string;
  temperature: number;
  temp_min: number;
  temp_max: number;
  humidite: number;
  description: string;
  vitesse_vent: number;
};

export async function getPrevisions(ville: string, token: string | null): Promise<Prevision[]> {
  return apiGet(`/meteo/previsions/${encodeURIComponent(ville)}`, token);
}

export type PrevisionAvancee = {
  date: string;
  temperature_min: number;
  temperature_max: number;
  humidite_moyenne: number;
  pluie_totale_mm: number;
  et0_estime_mm: number;
  et0_note: string;
  temperature_sol_estimee: number;
  temperature_sol_estimation: boolean;
  risque_gel: number;
  risque_secheresse: number;
};

export async function getPrevisionsAvanceesParCoordonnees(
  latitude: number,
  longitude: number,
  token: string | null
): Promise<PrevisionAvancee[]> {
  return apiGet(`/meteo/previsions-avancees/coordonnees?latitude=${latitude}&longitude=${longitude}`, token);
}

export type Alerte = {
  alerte_id: number;
  meteo_id: number | null;
  alerte_type: string;
  alerte_message: string;
  alerte_date: string;
  alerte_statut: string;
  alerte_region?: string | null;
};

export async function getAlertesMeteo(token: string | null): Promise<Alerte[]> {
  return apiGet('/meteo/alertes/toutes', token);
}

export async function getMesAlertesRegion(token: string | null): Promise<Alerte[]> {
  return apiGet('/meteo/alertes/ma-region', token);
}

export async function declencherAlerteRegionale(
  token: string | null,
  data: { region: string; type_menace: string; recommandation: string }
): Promise<Alerte> {
  return apiPost('/meteo/alertes/regionale', token, data);
}