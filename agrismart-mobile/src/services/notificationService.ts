import { apiGet, apiPut } from '@/services/apiClient';

export type Notification = {
  notification_id: number;
  utilisateur_id: number;
  notification_type: string;
  notification_titre: string;
  notification_contenu: string;
  notification_lue: number;
  notification_lien: string | null;
  created_at: string;
};

export async function getNotifications(token: string | null): Promise<Notification[]> {
  return apiGet('/notifications', token);
}

export async function marquerLue(id: number, token: string | null) {
  return apiPut(`/notifications/${id}/lue`, token);
}

export async function marquerToutesLues(token: string | null) {
  return apiPut('/notifications/toutes-lues', token);
}

export async function enregistrerPushToken(token: string | null, pushToken: string) {
  return apiPut('/profil/push-token', token, { token: pushToken });
}