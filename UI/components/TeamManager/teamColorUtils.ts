export interface TeamColorPalette {
  id: string;
  name: string;
  dot: string;
  topBorder: string;
  borderLight: string;
  borderFocused: string;
  bgLight: string;
  bgSoft: string;
  badge: string;
  text: string;
  avatar: string;
  ring: string;
  bar: string;
}

export const AVAILABLE_TEAM_COLORS: Record<string, TeamColorPalette> = {
  blue: {
    id: 'blue',
    name: 'Azul Real',
    dot: 'bg-blue-500',
    topBorder: 'border-t-blue-500',
    borderLight: 'border-blue-200 dark:border-blue-800/80',
    borderFocused: 'border-blue-500 ring-2 ring-blue-500/40',
    bgLight: 'bg-blue-50/70 dark:bg-blue-950/30',
    bgSoft: 'bg-blue-50/30 dark:bg-blue-950/15',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    avatar: 'bg-blue-600 text-white',
    ring: 'ring-blue-500',
    bar: 'bg-blue-500'
  },
  indigo: {
    id: 'indigo',
    name: 'Índigo',
    dot: 'bg-indigo-500',
    topBorder: 'border-t-indigo-500',
    borderLight: 'border-indigo-200 dark:border-indigo-800/80',
    borderFocused: 'border-indigo-500 ring-2 ring-indigo-500/40',
    bgLight: 'bg-indigo-50/70 dark:bg-indigo-950/30',
    bgSoft: 'bg-indigo-50/30 dark:bg-indigo-950/15',
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800',
    text: 'text-indigo-700 dark:text-indigo-300',
    avatar: 'bg-indigo-600 text-white',
    ring: 'ring-indigo-500',
    bar: 'bg-indigo-500'
  },
  violet: {
    id: 'violet',
    name: 'Violeta / Roxo',
    dot: 'bg-violet-500',
    topBorder: 'border-t-violet-500',
    borderLight: 'border-violet-200 dark:border-violet-800/80',
    borderFocused: 'border-violet-500 ring-2 ring-violet-500/40',
    bgLight: 'bg-violet-50/70 dark:bg-violet-950/30',
    bgSoft: 'bg-violet-50/30 dark:bg-violet-950/15',
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200 border-violet-200 dark:border-violet-800',
    text: 'text-violet-700 dark:text-violet-300',
    avatar: 'bg-violet-600 text-white',
    ring: 'ring-violet-500',
    bar: 'bg-violet-500'
  },
  emerald: {
    id: 'emerald',
    name: 'Esmeralda',
    dot: 'bg-emerald-500',
    topBorder: 'border-t-emerald-500',
    borderLight: 'border-emerald-200 dark:border-emerald-800/80',
    borderFocused: 'border-emerald-500 ring-2 ring-emerald-500/40',
    bgLight: 'bg-emerald-50/70 dark:bg-emerald-950/30',
    bgSoft: 'bg-emerald-50/30 dark:bg-emerald-950/15',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    avatar: 'bg-emerald-600 text-white',
    ring: 'ring-emerald-500',
    bar: 'bg-emerald-500'
  },
  amber: {
    id: 'amber',
    name: 'Âmbar / Ouro',
    dot: 'bg-amber-500',
    topBorder: 'border-t-amber-500',
    borderLight: 'border-amber-200 dark:border-amber-800/80',
    borderFocused: 'border-amber-500 ring-2 ring-amber-500/40',
    bgLight: 'bg-amber-50/70 dark:bg-amber-950/30',
    bgSoft: 'bg-amber-50/30 dark:bg-amber-950/15',
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-300',
    avatar: 'bg-amber-600 text-white',
    ring: 'ring-amber-500',
    bar: 'bg-amber-500'
  },
  rose: {
    id: 'rose',
    name: 'Rosa / Vilas',
    dot: 'bg-rose-500',
    topBorder: 'border-t-rose-500',
    borderLight: 'border-rose-200 dark:border-rose-800/80',
    borderFocused: 'border-rose-500 ring-2 ring-rose-500/40',
    bgLight: 'bg-rose-50/70 dark:bg-rose-950/30',
    bgSoft: 'bg-rose-50/30 dark:bg-rose-950/15',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border-rose-200 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
    avatar: 'bg-rose-600 text-white',
    ring: 'ring-rose-500',
    bar: 'bg-rose-500'
  },
  teal: {
    id: 'teal',
    name: 'Teal / Marinho',
    dot: 'bg-teal-500',
    topBorder: 'border-t-teal-500',
    borderLight: 'border-teal-200 dark:border-teal-800/80',
    borderFocused: 'border-teal-500 ring-2 ring-teal-500/40',
    bgLight: 'bg-teal-50/70 dark:bg-teal-950/30',
    bgSoft: 'bg-teal-50/30 dark:bg-teal-950/15',
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200 border-teal-200 dark:border-teal-800',
    text: 'text-teal-700 dark:text-teal-300',
    avatar: 'bg-teal-600 text-white',
    ring: 'ring-teal-500',
    bar: 'bg-teal-500'
  },
  orange: {
    id: 'orange',
    name: 'Laranja Terracota',
    dot: 'bg-orange-500',
    topBorder: 'border-t-orange-500',
    borderLight: 'border-orange-200 dark:border-orange-800/80',
    borderFocused: 'border-orange-500 ring-2 ring-orange-500/40',
    bgLight: 'bg-orange-50/70 dark:bg-orange-950/30',
    bgSoft: 'bg-orange-50/30 dark:bg-orange-950/15',
    badge: 'bg-orange-100 text-orange-900 dark:bg-orange-900/50 dark:text-orange-200 border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    avatar: 'bg-orange-600 text-white',
    ring: 'ring-orange-500',
    bar: 'bg-orange-500'
  },
  slate: {
    id: 'slate',
    name: 'Cinza / Apoio',
    dot: 'bg-slate-500',
    topBorder: 'border-t-slate-500',
    borderLight: 'border-slate-300 dark:border-slate-700',
    borderFocused: 'border-slate-500 ring-2 ring-slate-500/40',
    bgLight: 'bg-slate-100/70 dark:bg-slate-800/30',
    bgSoft: 'bg-slate-50/50 dark:bg-slate-900/20',
    badge: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600',
    text: 'text-slate-700 dark:text-slate-300',
    avatar: 'bg-slate-600 text-white',
    ring: 'ring-slate-500',
    bar: 'bg-slate-500'
  }
};

/**
 * Retorna a paleta de cores para uma determinada cor ou bloco
 */
export const getTeamColorPalette = (colorOrBlock?: string): TeamColorPalette => {
  if (!colorOrBlock) return AVAILABLE_TEAM_COLORS.slate;
  
  const key = colorOrBlock.toLowerCase();
  
  // Direto pelo id de cor
  if (AVAILABLE_TEAM_COLORS[key]) {
    return AVAILABLE_TEAM_COLORS[key];
  }

  // Pelo nome do bloco se a cor não bater
  if (key.includes('bloco a')) return AVAILABLE_TEAM_COLORS.blue;
  if (key.includes('bloco b')) return AVAILABLE_TEAM_COLORS.indigo;
  if (key.includes('bloco c')) return AVAILABLE_TEAM_COLORS.violet;
  if (key.includes('bloco d')) return AVAILABLE_TEAM_COLORS.emerald;
  if (key.includes('oasis')) return AVAILABLE_TEAM_COLORS.amber;
  if (key.includes('villa') || key.includes('vila')) return AVAILABLE_TEAM_COLORS.rose;
  if (key.includes('apoio') || key.includes('extra') || key.includes('rotativa')) return AVAILABLE_TEAM_COLORS.slate;

  return AVAILABLE_TEAM_COLORS.blue;
};
