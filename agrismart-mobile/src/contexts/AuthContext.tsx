import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { loginRequest, registerRequest, verifyOtpRequest } from '@/services/authService';

type Utilisateur = {
  id: number;
  nom: string;
  email: string;
  role: string;
};

type AuthContextType = {
  utilisateur: Utilisateur | null;
  token: string | null;
  loading: boolean;
  login: (
    email: string,
    motDePasse: string,
    seSouvenir?: boolean
  ) => Promise<{ deuxFacteurs: boolean; email?: string }>;
  verifierOtp: (email: string, code: string, seSouvenir?: boolean) => Promise<void>;
  register: (
    nom: string,
    email: string,
    motDePasse: string,
    role: 'agriculteur' | 'expert',
    telephone?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  mettreAJourUtilisateur: (donnees: Partial<Utilisateur>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('utilisateur');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUtilisateur(JSON.parse(storedUser));
        }
      } catch (e) {
        console.log('Erreur lecture session locale', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, motDePasse: string, seSouvenir = true) {
    const data = await loginRequest(email, motDePasse);
    if (data.deux_facteurs) {
      return { deuxFacteurs: true, email: data.email };
    }
    if (seSouvenir) {
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('utilisateur', JSON.stringify(data.utilisateur));
    }
    setToken(data.token);
    setUtilisateur(data.utilisateur);
    return { deuxFacteurs: false };
  }

  async function verifierOtp(email: string, code: string, seSouvenir = true) {
    const data = await verifyOtpRequest(email, code);
    if (seSouvenir) {
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('utilisateur', JSON.stringify(data.utilisateur));
    }
    setToken(data.token);
    setUtilisateur(data.utilisateur);
  }

  async function register(
    nom: string,
    email: string,
    motDePasse: string,
    role: 'agriculteur' | 'expert',
    telephone?: string
  ) {
    await registerRequest(nom, email, motDePasse, role, telephone);
  }

  async function logout() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('utilisateur');
    setToken(null);
    setUtilisateur(null);
  }

  async function mettreAJourUtilisateur(donnees: Partial<Utilisateur>) {
    setUtilisateur((prev) => {
      if (!prev) return prev;
      const misAJour = { ...prev, ...donnees };
      AsyncStorage.setItem('utilisateur', JSON.stringify(misAJour));
      return misAJour;
    });
  }

  return (
    <AuthContext.Provider value={{ utilisateur, token, loading, login, verifierOtp, register, logout, mettreAJourUtilisateur }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit etre utilise dans AuthProvider');
  return ctx;
}