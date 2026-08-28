import { Ionicons } from '@expo/vector-icons';

import { DarkColors } from '@/constants/appTheme';

export function iconCategorie(categorie: string): keyof typeof Ionicons.glyphMap {
  const c = (categorie || '').toLowerCase();
  if (c.includes('irrigation') || c.includes('eau')) return 'water';
  if (c.includes('sol') || c.includes('fertili')) return 'flask';
  if (c.includes('recolte')) return 'basket';
  if (c.includes('ravageur') || c.includes('maladie')) return 'bug';
  if (c.includes('semis') || c.includes('plant')) return 'leaf';
  return 'bulb';
}

type Colors = typeof DarkColors;

export function couleurCategorie(categorie: string, colors: Colors): string {
  const c = (categorie || '').toLowerCase();
  if (c.includes('irrigation') || c.includes('eau')) return colors.sky400;
  if (c.includes('sol') || c.includes('fertili')) return colors.clay400;
  if (c.includes('recolte')) return colors.wheat400;
  if (c.includes('ravageur') || c.includes('maladie')) return colors.danger;
  if (c.includes('semis') || c.includes('plant')) return colors.mint400;
  return colors.accent400;
}
