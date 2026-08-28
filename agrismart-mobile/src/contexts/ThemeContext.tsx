import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors } from '@/constants/appTheme';

type ThemeMode = 'dark' | 'light';

type ThemeContextType = {
  mode: ThemeMode;
  colors: typeof DarkColors;
  toggleTheme: () => void;
  loading: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'agrismart_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setMode(saved);
      }
      setLoading(false);
    });
  }, []);

  function toggleTheme() {
    const nouveauMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nouveauMode);
    AsyncStorage.setItem(STORAGE_KEY, nouveauMode);
  }

  const colors = mode === 'dark' ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit etre utilise dans un ThemeProvider');
  return ctx;
}