import { apiGet, apiPost, apiPut, apiUpload } from '@/services/apiClient';

export type Message = {
  message_id: number;
  expediteur_id: number;
  destinataire_id: number;
  message_contenu: string;
  message_date_envoi: string;
  message_lu: number;
  message_document: string | null;
  message_archive: number;
};

export async function getConversation(userId: number, token: string | null): Promise<Message[]> {
  return apiGet(`/messages/conversation/${userId}`, token);
}

export async function getMessagesNonLus(token: string | null): Promise<Message[]> {
  return apiGet('/messages/non-lus', token);
}

export async function envoyerMessage(
  destinataireId: number,
  contenu: string,
  token: string | null
) {
  return apiPost('/messages', token, { destinataire_id: destinataireId, contenu });
}

export async function marquerMessageLu(id: number, token: string | null) {
  return apiPut(`/messages/${id}/lu`, token);
}
export async function partagerDocument(
  destinataireId: number,
  contenu: string,
  fichier: { uri: string; name: string; type: string },
  token: string | null
) {
  const formData = new FormData();
  formData.append('destinataire_id', String(destinataireId));
  formData.append('contenu', contenu || '');
  formData.append('document', {
    uri: fichier.uri,
    name: fichier.name,
    type: fichier.type,
  } as any);

  return apiUpload('/messages/document', token, formData);
}