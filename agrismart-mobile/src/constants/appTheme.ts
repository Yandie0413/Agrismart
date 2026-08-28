export const DarkColors = {
  forest950: '#071912',
  forest900: '#0E2A1E',
  forest800: '#163827',
  forest700: '#1F4A34',
  forest600: '#2A5C41',

  mint300: '#86EFAC',
  mint400: '#4ADE80',
  mint500: '#22C55E',

  primary50: '#f0f9f4',
  primary100: '#dcf1e4',
  primary200: '#b8e2c9',
  primary300: '#8ccfa8',
  primary400: '#5cb583',
  primary500: '#3a9a65',
  primary600: '#2D6A4F',
  primary700: '#1B4332',

  accent50: '#fff8e6',
  accent100: '#ffedb8',
  accent400: '#FFC94A',
  accent500: '#FFB703',
  accent600: '#e5a400',

  // Terre / sol
  clay300: '#D9A57B',
  clay400: '#C17A4F',
  clay500: '#A2603A',
  clay600: '#7A4527',

  // Ble / recolte
  wheat300: '#F5DFA0',
  wheat400: '#E8C468',
  wheat500: '#D4A937',

  // Ciel / eau
  sky300: '#93C5FD',
  sky400: '#60A5FA',
  sky500: '#3B82F6',

  white: '#FFFFFF',
  textMuted: '#A8C3B4',
  danger: '#EF4444',
};

export const LightColors = {
  forest950: '#FFFFFF',
  forest900: '#F4FAF6',
  forest800: '#E8F3EC',
  forest700: '#D5E9DC',
  forest600: '#BFDCC9',

  mint300: '#22C55E',
  mint400: '#16A34A',
  mint500: '#15803D',

  primary50: '#f0f9f4',
  primary100: '#dcf1e4',
  primary200: '#b8e2c9',
  primary300: '#8ccfa8',
  primary400: '#3a9a65',
  primary500: '#2D6A4F',
  primary600: '#1B4332',
  primary700: '#153728',

  accent50: '#fff8e6',
  accent100: '#ffedb8',
  accent400: '#e5a400',
  accent500: '#c98f00',
  accent600: '#a37500',

  // Terre / sol
  clay300: '#E8C4A8',
  clay400: '#C17A4F',
  clay500: '#9C5C34',
  clay600: '#7A4527',

  // Ble / recolte
  wheat300: '#F5DFA0',
  wheat400: '#D4A937',
  wheat500: '#B08A24',

  // Ciel / eau
  sky300: '#BFDBFE',
  sky400: '#3B82F6',
  sky500: '#2563EB',

  white: '#0E2A1E',
  textMuted: '#5C7A6A',
  danger: '#DC2626',
};

// Garde AppColors pour compatibilite (utilise DarkColors par defaut si import direct)
export const AppColors = DarkColors;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const Radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}