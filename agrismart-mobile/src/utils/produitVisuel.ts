import { Ionicons } from '@expo/vector-icons';

import { DarkColors } from '@/constants/appTheme';

type Colors = typeof DarkColors;

const MAPPING: { motsCles: string[]; icone: keyof typeof Ionicons.glyphMap; couleur: (c: Colors) => string }[] = [
  { motsCles: ['riz'], icone: 'nutrition', couleur: (c) => c.wheat400 },
  { motsCles: ['mais', 'maïs'], icone: 'nutrition', couleur: (c) => c.wheat500 },
  { motsCles: ['manioc', 'patate', 'pomme de terre'], icone: 'leaf', couleur: (c) => c.clay400 },
  { motsCles: ['tomate', 'poivron', 'piment'], icone: 'nutrition', couleur: (c) => c.danger },
  { motsCles: ['haricot', 'legume', 'légume', 'brede', 'brède'], icone: 'leaf', couleur: (c) => c.mint400 },
  { motsCles: ['fruit', 'banane', 'mangue', 'ananas', 'letchi'], icone: 'nutrition', couleur: (c) => c.accent400 },
  { motsCles: ['oeuf', 'œuf', 'poulet', 'volaille'], icone: 'egg', couleur: (c) => c.wheat300 },
  { motsCles: ['lait', 'zebu', 'viande', 'boeuf', 'porc'], icone: 'restaurant', couleur: (c) => c.clay500 },
  { motsCles: ['poisson', 'crevette'], icone: 'water', couleur: (c) => c.sky400 },
];

export function produitVisuel(nom: string, colors: Colors): { icone: keyof typeof Ionicons.glyphMap; couleur: string } {
  const n = (nom || '').toLowerCase();
  for (const m of MAPPING) {
    if (m.motsCles.some((mot) => n.includes(mot))) {
      return { icone: m.icone, couleur: m.couleur(colors) };
    }
  }
  return { icone: 'basket', couleur: colors.mint400 };
}
