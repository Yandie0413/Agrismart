import { apiDelete, apiGet, apiPut, apiUpload } from '@/services/apiClient';

export type Contact = {
  utilisateur_id: number;
  utilisateur_nom: string;
  utilisateur_email: string;
  utilisateur_role: string;
};

export type StatistiquesAdmin = {
  parRole: { utilisateur_role: string; total: number }[];
  parMois: { mois: number; total: number }[];
  culturesParType: { culture_type: string; total: number }[];
  alertesParType: { alerte_type: string; total: number }[];
  tauxResolutionExperts?: number | null;
};

export async function getContacts(token: string | null): Promise<Contact[]> {
  return apiGet('/profil/contacts', token);
}

export async function getDashboardProfil(token: string | null) {
  return apiGet('/profil/dashboard', token);
}

export async function modifierProfil(
  token: string | null,
  data: { nom: string; email: string }
) {
  return apiPut('/profil/modifier', token, data);
}

export async function getUtilisateurs(token: string | null): Promise<Contact[]> {
  return apiGet('/profil/utilisateurs', token);
}

export async function supprimerUtilisateurAdmin(token: string | null, id: number) {
  return apiDelete(`/profil/utilisateurs/${id}`, token);
}

export async function getStatistiquesAdmin(token: string | null): Promise<StatistiquesAdmin> {
  return apiGet('/profil/statistiques', token);
}

export async function modifierRoleUtilisateur(
  token: string | null,
  id: number,
  role: 'agriculteur' | 'expert' | 'administrateur'
) {
  return apiPut(`/profil/utilisateurs/${id}/role`, token, { role });
}

export type ProfilRole = {
  utilisateur_id?: number;
  agriculteur_region?: string | null;
  agriculteur_district?: string | null;
  agriculteur_commune?: string | null;
  expert_specialite?: string | null;
  expert_zone_couverture?: string | null;
  expert_statut?: 'en_attente' | 'valide' | 'rejete';
  utilisateur_nom?: string;
  utilisateur_email?: string;
  utilisateur_telephone?: string;
};

export async function getMonProfilRole(token: string | null): Promise<ProfilRole> {
  return apiGet('/profil/mon-profil-role', token);
}

export async function modifierProfilRole(
  token: string | null,
  data: { region?: string; district?: string; commune?: string; zone_couverture?: string; specialite?: string }
) {
  return apiPut('/profil/modifier-role', token, data);
}

export async function uploaderDiplome(
  token: string | null,
  fichier: { uri: string; name: string; type: string }
) {
  const formData = new FormData();
  formData.append('diplome', { uri: fichier.uri, name: fichier.name, type: fichier.type } as any);
  return apiUpload('/auth/diplome', token, formData);
}

export async function getExpertsEnAttente(token: string | null): Promise<ProfilRole[]> {
  return apiGet('/profil/experts-en-attente', token);
}

export async function validerExpertRequest(token: string | null, id: number, statut: 'valide' | 'rejete') {
  return apiPut(`/profil/utilisateurs/${id}/valider-expert`, token, { statut });
}