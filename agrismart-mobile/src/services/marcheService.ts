import { apiGet, apiPost, apiPut } from '@/services/apiClient';

export type Marche = {
  marche_id: number;
  produit_id: number;
  marche_nom: string;
  marche_localisation: string;
  prix: number;
};

export type Produit = {
  produit_id: number;
  produit_nom: string;
  produit_date_maj: string;
  marches: Marche[];
};

export async function getProduits(token: string | null): Promise<Produit[]> {
  return apiGet('/marches', token);
}

export async function getProduit(token: string | null, id: number): Promise<Produit> {
  return apiGet(`/marches/${id}`, token);
}

export type HistoriquePrixItem = {
  marche_id: number;
  produit_id: number;
  marche_nom: string;
  marche_localisation: string;
  prix_agricole: number;
  marche_quantite: string | null;
  marche_utilisateur_id: number | null;
  vendeur_nom: string | null;
  created_at: string;
};

export type Periode = '30j' | '6mois' | '1an';

export async function getHistoriquePrix(
  token: string | null,
  id: number,
  periode?: Periode
): Promise<HistoriquePrixItem[]> {
  return apiGet(`/marches/${id}/historique-prix${periode ? `?periode=${periode}` : ''}`, token);
}

export async function publierMarche(
  token: string | null,
  produitId: number,
  data: { nom: string; localisation: string; prix: number }
): Promise<Marche[]> {
  return apiPost(`/marches/${produitId}/marches`, token, data);
}

export async function signalerPrix(token: string | null, marcheId: number, raison: string) {
  return apiPost(`/marches/marches/${marcheId}/signaler`, token, { raison });
}

export type SignalementPrix = {
  signalement_id: number;
  marche_id: number;
  utilisateur_id: number;
  signalement_raison: string;
  signalement_statut: 'en_attente' | 'traite' | 'rejete';
  utilisateur_nom: string;
  marche_nom: string;
  marche_localisation: string;
  prix_agricole: number;
};

export async function getSignalementsPrix(token: string | null): Promise<SignalementPrix[]> {
  return apiGet('/marches/signalements/toutes', token);
}

export async function traiterSignalementPrix(
  token: string | null,
  id: number,
  statut: 'traite' | 'rejete'
) {
  return apiPut(`/marches/signalements/${id}/traiter`, token, { statut });
}

export type OffreVente = {
  offre_id: number;
  utilisateur_id: number;
  produit_nom: string;
  quantite: number;
  unite: 'kg' | 'tonnes';
  prix_souhaite: number;
  date_disponibilite: string | null;
  telephone_contact: string;
  statut: 'active' | 'vendue';
  vendeur_nom: string;
};

export async function creerOffreVente(
  token: string | null,
  data: {
    produit_nom: string;
    quantite: number;
    unite: 'kg' | 'tonnes';
    prix_souhaite: number;
    date_disponibilite?: string;
    telephone_contact: string;
  }
): Promise<OffreVente> {
  return apiPost('/marches/offres', token, data);
}

export async function getOffresVente(token: string | null): Promise<OffreVente[]> {
  return apiGet('/marches/offres', token);
}

export async function modifierStatutOffre(token: string | null, id: number, statut: 'active' | 'vendue') {
  return apiPut(`/marches/offres/${id}/statut`, token, { statut });
}
