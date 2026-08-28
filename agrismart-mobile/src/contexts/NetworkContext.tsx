import { createContext, useContext, useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

import { useAuth } from '@/contexts/AuthContext';
import { compterActionsEnAttente, synchroniserActionsEnAttente } from '@/utils/cacheHorsLigne';
import { ajouterParcelle } from '@/services/parcelleService';
import { creerSujet } from '@/services/forumService';

type NetworkContextType = {
  enLigne: boolean;
  actionsEnAttente: number;
};

const NetworkContext = createContext<NetworkContextType>({ enLigne: true, actionsEnAttente: 0 });

// Detecte la connectivite (@react-native-community/netinfo) et rejoue automatiquement la file
// d'actions en attente (parcelle creee, sujet de forum poste hors-ligne) des que la connexion
// revient, module transversal 0.
export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [enLigne, setEnLigne] = useState(true);
  const [actionsEnAttente, setActionsEnAttente] = useState(0);
  const etaitHorsLigne = useRef(false);

  useEffect(() => {
    compterActionsEnAttente().then(setActionsEnAttente);

    const desabonner = NetInfo.addEventListener((state) => {
      const connecte = !!state.isConnected && state.isInternetReachable !== false;
      setEnLigne(connecte);
      if (connecte && etaitHorsLigne.current) {
        synchroniserActionsEnAttente({
          parcelle: (payload) => ajouterParcelle(token, payload.exploitationId, payload.data),
          sujet_forum: (payload) => creerSujet(token, payload),
        }).then(({ restantes }) => setActionsEnAttente(restantes));
      }
      etaitHorsLigne.current = !connecte;
    });

    return desabonner;
  }, [token]);

  return (
    <NetworkContext.Provider value={{ enLigne, actionsEnAttente }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
