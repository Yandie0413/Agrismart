import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getNotifications,
  marquerLue as marquerLueApi,
  marquerToutesLues as marquerToutesLuesApi,
  Notification,
} from '@/services/notificationService';
import { usePushNotifications } from '@/hooks/use-push-notifications';

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  marquerLue: (id: number) => Promise<void>;
  marquerToutesLues: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getNotifications(token);
      setNotifications(data);
    } catch {
      // silencieux : pas critique si ca echoue
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000); // rafraichit toutes les 15s
    return () => clearInterval(interval);
  }, [refresh]);

  // Enregistre le token push Expo et rafraichit des reception d'une notif au premier plan
  usePushNotifications(token, refresh);

  async function marquerLue(id: number) {
    try {
      await marquerLueApi(id, token);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, notification_lue: 1 } : n))
      );
    } catch {
      // silencieux
    }
  }

  async function marquerToutesLues() {
    try {
      await marquerToutesLuesApi(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, notification_lue: 1 })));
    } catch {
      // silencieux
    }
  }

  const unreadCount = notifications.filter((n) => !n.notification_lue).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, refresh, marquerLue, marquerToutesLues }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications doit etre utilise dans un NotificationProvider');
  return ctx;
}