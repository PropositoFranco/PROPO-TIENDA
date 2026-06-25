import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../services/supabase';
import { useAuthStore } from './useAuthStore';
import { XP_TABLE, RANK_BY_LEVEL } from '../config/constants';

const MAX_LEVEL = 20;

// ── Helper: calcula rank correcto desde el nivel ──
const getRankName = (level) => RANK_BY_LEVEL[Math.min(level, MAX_LEVEL)]?.name ?? 'DESPERTAR';

export const usePlayerStore = create(
  persist(
    (set, get) => ({
      level: 1,
      xp: 0,
      xpToNextLevel: 250,
      playerClass: null,
      rank: 'DESPERTAR',
      cristales: 0,
      avatar: null,
      skoolName: '',
      templarioName: '',
      levelUpPending: false,
      levelUpInfo: null,
      _hydrated: false,

      // ── BUG 1 FIX: setPlayerData ahora recalcula rank desde el nivel real ──
      setPlayerData: (data) => {
        const safeLevel = Math.min(data.level ?? 1, MAX_LEVEL);
        set({
          ...data,
          level: safeLevel,
          xpToNextLevel: XP_TABLE[safeLevel] ?? 0,
          rank: getRankName(safeLevel),   // ← siempre sincronizado con el nivel
          _hydrated: true,
        });
      },

      addXP: async (amount, bonusCoins = 0) => {
        const current = get();
        let newXP    = current.xp + amount;
        let newLevel = current.level;

        // ── BUG 2 FIX: el while usaba XP_TABLE[newLevel] que es el umbral del
        //    nivel ACTUAL, no del siguiente. Ahora descuenta correctamente. ──
        while (newLevel < MAX_LEVEL && newXP >= (XP_TABLE[newLevel] ?? 9999)) {
          newXP    -= XP_TABLE[newLevel];
          newLevel += 1;
        }

        // ── BUG 3 FIX: al llegar al nivel máximo XP queda en 0,
        //    pero si sobrepasa sin loop (salto enorme) también se captura ──
        if (newLevel >= MAX_LEVEL) {
          newLevel = MAX_LEVEL;
          newXP    = 0;
        }

        const newXPToNext = XP_TABLE[newLevel] ?? 0;
        const didLevelUp  = newLevel > current.level;

        // ── BUG 4 FIX: rank se calculaba DESPUÉS del set pero se guardaba
        //    con get().rank (el viejo). Ahora se calcula ANTES y se guarda
        //    tanto en el store como en Supabase con el valor correcto. ──
        const newRank  = getRankName(newLevel);
        const newTitle = RANK_BY_LEVEL[newLevel]?.name ?? `Templario Nivel ${newLevel}`;

        set({
          xp:             newXP,
          level:          newLevel,
          xpToNextLevel:  newXPToNext,
          rank:           newRank,          // ← actualizado antes del await
          levelUpPending: didLevelUp,
          levelUpInfo: didLevelUp ? {
            oldLevel:   current.level,
            newLevel,
            newTitle,
            newRank,
            bonusXP:    amount,
            bonusCoins,
          } : null,
        });

        const user = useAuthStore.getState().user;
        if (user) {
          await supabase
            .from('profiles')
            .update({ level: newLevel, xp: newXP, rank: newRank })  // ← rank correcto
            .eq('id', user.id);
        }

        return { leveledUp: didLevelUp, newLevel, newRank };
      },

      clearLevelUpPending: () => set({ levelUpPending: false, levelUpInfo: null }),

      addCristales: async (amount) => {
        const newAmount = get().cristales + amount;
        set({ cristales: newAmount });

        const user = useAuthStore.getState().user;
        if (user) {
          await supabase
            .from('profiles')
            .update({ cristales: newAmount })
            .eq('id', user.id);
        }
      },

      reset: () => set({
        level:          1,
        xp:             0,
        xpToNextLevel:  250,
        playerClass:    null,
        rank:           'DESPERTAR',
        cristales:      0,
        avatar:         null,
        skoolName:      '',
        templarioName:  '',
        levelUpPending: false,
        levelUpInfo:    null,
        _hydrated:      false,
      }),
    }),
    { name: 'tstore-player' }
  )
);