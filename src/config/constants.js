// ── App Constants ──

export const APP_NAME = 'T-STORE';
export const APP_SUBTITLE = 'Templo del Propósito';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  HUB: '/hub',
  STORE: '/store',
  STORE_PRODUCT: '/store/:id',
  LIBRARY: '/library',
  INVENTORY: '/inventory',
  MISSIONS: '/missions',
  PROFILE: '/profile',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_MISSIONS: '/admin/missions',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ASSETS: '/admin/assets',
};

export const ROLES = {
  USER: 'templario',
  ADMIN: 'administrador',
};

export const AVATAR_OPTIONS = ['⚔️', '🛡️', '🏹', '🔮', '📜', '👁️', '🗡️', '🦅'];

export const MISSION_TYPES = ['daily', 'weekly', 'story', 'event'];

export const PRODUCT_CATEGORIES = ['skin', 'weapon', 'consumable', 'mount', 'spell', 'armor'];

export const RARITY_LEVELS = ['common', 'rare', 'epic', 'legendary'];

export const RARITY_COLORS = {
  common: { text: 'text-gray-300', border: 'border-gray-500', bg: 'bg-gray-500/10', label: 'Común' },
  rare: { text: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-500/10', label: 'Raro' },
  epic: { text: 'text-purple-400', border: 'border-purple-500', bg: 'bg-purple-500/10', label: 'Épico' },
  legendary: { text: 'text-gold', border: 'border-gold', bg: 'bg-gold/10', label: 'Legendario' },
  
};
export const XP_TABLE = {
  1: 250, 2: 500, 3: 850, 4: 1150, 5: 1450, 6: 0,
};

export const RANK_BY_LEVEL = {
  1: { name: 'DESPERTAR',    icon: '🔵', color: '#60a5fa' },
  2: { name: 'RECLUTA',      icon: '🟣', color: '#a78bfa' },
  3: { name: 'FORJADOR',     icon: '🔥', color: '#fb923c' },
  4: { name: 'CONQUISTADOR', icon: '⚔️', color: '#d4af37' },
  5: { name: 'DOMINANTE',    icon: '👑', color: '#f5d06e' },
  6: { name: 'PROPOMASTER',  icon: '🏆', color: '#c084fc' },
};

export const getRank = (level) => RANK_BY_LEVEL[level] ?? RANK_BY_LEVEL[1];