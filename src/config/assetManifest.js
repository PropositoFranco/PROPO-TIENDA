// ── Asset Manifest ──
// Source of truth for all visual assets by section.
// Admin can update URLs via Supabase asset_manifest table.
// When an asset is not yet available in Supabase, the fallback
// is a CSS-based placeholder (no broken images).

export const ASSET_KEYS = {
  LOGIN: {
    bg: 'bg_auth',
    character: 'char_maestro',
    overlay: null,
    panel: null,
  },
  HUB: {
    bg: 'bg_hub',
    character: 'char_hub',
    overlay: 'ov_hub',
  },
  STORE: {
    bg: 'bg_store',
    character: 'char_store',
    overlay: 'ov_store',
  },
  LIBRARY: {
    bg: 'bg_library',
    character: null,
    overlay: 'ov_library',
  },
  INVENTORY: {
    bg: 'bg_inventory',
    character: null,
    overlay: 'ov_inventory',
  },
  MISSIONS: {
    bg: 'bg_missions',
    character: 'char_quest',
    overlay: 'ov_missions',
  },
  PROFILE: {
    bg: 'bg_profile',
    character: null,
    overlay: 'ov_profile',
  },
};

// Asset categories used in Supabase Storage
export const ASSET_CATEGORIES = {
  background: 'backgrounds',
  character: 'characters',
  overlay: 'overlays',
  panel: 'panels',
  icon: 'icons',
  avatar: 'avatars',
  product: 'products',
  logo: 'brand',
};

// Placeholder SVGs for when assets are not yet loaded
export const PLACEHOLDERS = {
  maestro: `<svg viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="40" r="25" fill="rgba(160,100,255,0.2)" stroke="#a855f7" stroke-width="1.5"/>
    <rect x="35" y="70" width="50" height="70" rx="8" fill="rgba(160,100,255,0.15)" stroke="#a855f7" stroke-width="1.5"/>
    <path d="M35 70 L60 55 L85 70" fill="none" stroke="#a855f7" stroke-width="1.5"/>
    <circle cx="50" cy="38" r="3" fill="#a855f7"/>
    <circle cx="70" cy="38" r="3" fill="#a855f7"/>
    <path d="M52 48 Q60 55 68 48" fill="none" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
  logo: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="40,8 52,20 52,35 40,40 28,35 28,20" fill="rgba(212,175,55,0.15)" stroke="#d4af37" stroke-width="1.5"/>
    <rect x="30" y="38" width="20" height="28" rx="2" fill="rgba(212,175,55,0.1)" stroke="#d4af37" stroke-width="1.5"/>
    <rect x="26" y="64" width="28" height="6" rx="2" fill="rgba(212,175,55,0.2)" stroke="#d4af37" stroke-width="1.5"/>
    <circle cx="40" cy="8" r="3" fill="#d4af37"/>
  </svg>`,
};
