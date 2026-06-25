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
  common:    { text: 'text-gray-300',   border: 'border-gray-500',   bg: 'bg-gray-500/10',   label: 'Común'      },
  rare:      { text: 'text-blue-400',   border: 'border-blue-500',   bg: 'bg-blue-500/10',   label: 'Raro'       },
  epic:      { text: 'text-purple-400', border: 'border-purple-500', bg: 'bg-purple-500/10', label: 'Épico'      },
  legendary: { text: 'text-gold',       border: 'border-gold',       bg: 'bg-gold/10',       label: 'Legendario' },
};

// ── XP acumulado necesario para ALCANZAR cada nivel ──
// Espejo exacto de vip_level_rewards en Supabase.
// El frontend nunca calcula niveles — usa profiles.level de la BD.
// Esta tabla es solo para UI (barras de progreso, tooltips).
export const XP_TABLE = {
   1:      100,
   2:      250,
   3:      500,
   4:      750,
   5:    1_050,
   6:    1_400,
   7:    1_750,
   8:    2_150,
   9:    2_550,
  10:    3_000,
  11:    3_450,
  12:    3_950,
  13:    4_450,
  14:    5_000,
  15:    5_500,
  16:    6_100,
  17:    6_650,
  18:    7_250,
  19:    7_850,
  20:    8_500, // PROPO-LEYENDA — techo absoluto
};

// ── XP incremental por nivel (xp_required en vip_level_rewards) ──
// Útil para la barra de progreso del nivel actual.
export const XP_PER_LEVEL = {
   1:      100,
   2:      150,
   3:      250,
   4:      250,
   5:      300,
   6:      350,
   7:      350,
   8:      400,
   9:      400,
  10:      450,
  11:      450,
  12:      500,
  13:      500,
  14:      550,
  15:      500,
  16:      600,
  17:      550,
  18:      600,
  19:      600,
  20:      650,
};

export const RANK_BY_LEVEL = {
   1: { name: 'DESPERTAR',        icon: '🔵', color: '#60a5fa' },
   2: { name: 'RECLUTA',          icon: '🟣', color: '#a78bfa' },
   3: { name: 'FORJADOR',         icon: '🔥', color: '#fb923c' },
   4: { name: 'GUARDIÁN',         icon: '🛡️', color: '#34d399' },
   5: { name: 'CONQUISTADOR',     icon: '⚔️', color: '#d4af37' },
   6: { name: 'TEMPLARIO',        icon: '🏛️', color: '#f59e0b' },
   7: { name: 'VIGÍA',            icon: '👁️', color: '#38bdf8' },
   8: { name: 'CENTINELA',        icon: '⚡', color: '#818cf8' },
   9: { name: 'HERALDO',          icon: '📯', color: '#e879f9' },
  10: { name: 'DOMINANTE',        icon: '👑', color: '#f5d06e' },
  11: { name: 'ARCANO',           icon: '🔮', color: '#c084fc' },
  12: { name: 'SEÑOR DE ARENA',   icon: '🏟️', color: '#fb7185' },
  13: { name: 'ÉLITE',            icon: '💠', color: '#67e8f9' },
  14: { name: 'MAESTRO',          icon: '🎯', color: '#4ade80' },
  15: { name: 'GRAN MAESTRO',     icon: '🌟', color: '#fde68a' },
  16: { name: 'FORJADO EN FUEGO', icon: '🔱', color: '#ff6b35' },
  17: { name: 'ETERNO',           icon: '♾️', color: '#a5f3fc' },
  18: { name: 'ASCENDIDO',        icon: '🌠', color: '#ddd6fe' },
  19: { name: 'MÍTICO',           icon: '🐉', color: '#fca5a5' },
  20: { name: 'PROPO-LEYENDA',    icon: '🏆', color: '#c084fc' },
};

// Fallback seguro — nunca rompe si el nivel viene null/undefined
export const getRank = (level) => RANK_BY_LEVEL[level] ?? RANK_BY_LEVEL[1];

// ── Helper: XP dentro del nivel actual (para barra de progreso) ──
// Ejemplo: usuario con 1,200 XP acumulado está en nivel 3
//   xpIntoLevel = 1,200 - 1,000 (base del nivel 3) = 200 XP
//   xpNeeded    = 900 (XP para subir de 3 → 4)
export const getXPProgress = (totalXP, currentLevel) => {
  const base    = XP_TABLE[currentLevel - 1] ?? 0;
  const needed  = XP_PER_LEVEL[currentLevel] ?? 1;
  const into    = Math.max(0, totalXP - base);
  return {
    xpIntoLevel:  into,
    xpNeeded:     needed,
    percent:      Math.min(100, Math.round((into / needed) * 100)),
  };
};