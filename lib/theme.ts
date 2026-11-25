/** UI colour mode + board themes */

export type UIMode = 'dark' | 'light';

export interface BoardTheme {
  id: string;
  name: string;
  light: string;
  dark: string;
  frame: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  { id: 'walnut', name: 'Walnut', light: '#ecd9b5', dark: '#a9794f', frame: '#3b2414' },
  { id: 'marble', name: 'Marble', light: '#e7e5e4', dark: '#78716c', frame: '#292524' },
  { id: 'midnight', name: 'Midnight', light: '#9fb4d3', dark: '#3f5a85', frame: '#0f172a' },
  { id: 'emerald', name: 'Emerald', light: '#eeeed2', dark: '#6b9a5b', frame: '#1f3d2b' },
];

export const UI_MODE_KEY = 'chess3d:mode';
export const BOARD_THEME_KEY = 'chess3d:board';

export function applyUIMode(mode: UIMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark');
}
