import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { enregistrerPushToken } from '@/services/notificationService';

// Expo Go sur Android (SDK 53+) plante des l'import d'expo-notifications
// (push distant retire de Expo Go). On ne charge le module que hors Expo Go/Android,
// ou il faudra de toute facon un development build pour le push distant.
const pushIndisponible =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient && Platform.OS === 'android';
const Notifications = pushIndisponible ? null : (require('expo-notifications') as typeof import('expo-notifications'));

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Best-effort : necessite un projectId EAS configure (via `eas init`).
// Sans projectId, on garde les notifications locales/premier plan sans push distant.
async function obtenirTokenPush(): Promise<string | null> {
  if (!Notifications) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const permissions = await Notifications.getPermissionsAsync();
  let statut = permissions.status;
  if (statut !== 'granted') {
    const demande = await Notifications.requestPermissionsAsync();
    statut = demande.status;
  }
  if (statut !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.log('Push notifications: aucun projectId EAS configure, push distant desactive.');
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (e: any) {
    console.log('Push notifications: impossible de recuperer le token', e.message);
    return null;
  }
}

export function usePushNotifications(token: string | null, onNotification?: () => void) {
  useEffect(() => {
    if (!token) return;

    let actif = true;
    obtenirTokenPush().then((pushToken) => {
      if (actif && pushToken) {
        enregistrerPushToken(token, pushToken).catch(() => {});
      }
    });

    const subscription = Notifications?.addNotificationReceivedListener(() => {
      onNotification?.();
    });

    return () => {
      actif = false;
      subscription?.remove();
    };
  }, [token, onNotification]);
}
