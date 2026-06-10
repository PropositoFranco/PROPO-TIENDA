import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../services/supabase';
import { XP_TABLE, RANK_BY_LEVEL } from '../config/constants';

const MAX_LEVEL = 6;

// ── Recalcula nivel y XP si el usuario ya rebasó el umbral ──
// Se llama al cargar el perfil desde Supabase, antes de setPlayerData
const recalcLevelIfNeeded = async (userId, rawLevel, rawXP) => {
  let level = Math.min(rawLevel ?? 1, MAX_LEVEL);
  let xp    = rawXP ?? 0;
  let changed = false;

  // Subir niveles mientras el XP acumulado supere el umbral del nivel actual
  while (level < MAX_LEVEL && xp >= (XP_TABLE[level] ?? 9999)) {
    xp    -= XP_TABLE[level];
    level += 1;
    changed = true;
  }

  // Si llegó al máximo, XP se congela en 0
  if (level >= MAX_LEVEL) {
    level = MAX_LEVEL;
    xp    = 0;
    changed = true;
  }

  const rank = RANK_BY_LEVEL[level]?.name ?? 'DESPERTAR';

  // Solo escribe en Supabase si hubo cambio real
  if (changed) {
    await supabase
      .from('profiles')
      .update({ level, xp, rank })
      .eq('id', userId);
  }

  return { level, xp, rank };
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      loading: true,
      isAdmin: false,

      isVip: () => get().vipActive ?? false,
      vipActive: false,

      setSession: (session) =>
        set({ session, user: session?.user ?? null, loading: false }),

      _realtimeChannel: null,

      initAuth: async () => {
        if (get().user && get().session) {
          set({ loading: false });
          get().loadProfile();
        }

        const safetyTimer = setTimeout(() => {
          if (get().loading) {
            set({ loading: false });
          }
        }, 6000);

        const { data, error } = await supabase.auth.getSession();
        clearTimeout(safetyTimer);

        if (error || !data?.session) {
          const { data: refreshData } = await supabase.auth.refreshSession().catch(() => ({ data: null }));
          if (!refreshData?.session) {
            await supabase.auth.signOut().catch(() => {});
            set({ user: null, profile: null, session: null, loading: false });
            return;
          }
          set({ session: refreshData.session, user: refreshData.session.user, loading: false });
          await get().loadProfile();
          return;
        }

        const session = data.session;
        if (session) {
          const cachedUser = get().user;
          if (cachedUser && cachedUser.id !== session.user.id) {
            const { reset } = (await import('./usePlayerStore')).usePlayerStore.getState();
            const { reset: resetMembership } = (await import('./useMembershipStore')).default.getState();
            reset();
            resetMembership();
            set({ profile: null, isAdmin: false });
          }

          set({ session, user: session.user, loading: false });
          await get().loadProfile();

          if (!get()._realtimeChannel) {
            const channel = supabase
              .channel('profile-sync')
              .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${session.user.id}`,
              }, async () => {
                const before = (await import('./usePlayerStore')).usePlayerStore.getState().cristales;
                await get().loadProfile();
                const after = (await import('./usePlayerStore')).usePlayerStore.getState().cristales;
                const diff = after - before;
                if (diff > 0) {
                  window.dispatchEvent(new CustomEvent('bonus-received', { detail: { amount: diff } }));
                }
              })
              .subscribe();
            set({ _realtimeChannel: channel });
          }
        } else {
          set({ loading: false });
        }
      },

      loadProfile: async () => {
        const user = get().user;
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error || !data) {
          await supabase.auth.signOut().catch(() => {});
          set({ user: null, profile: null, session: null, isAdmin: false, loading: false });
          return;
        }

        if (!error && data) {
          set({ profile: data, isAdmin: data.is_admin === true });

          supabase.from('profiles').update({ last_login_date: new Date().toISOString() }).eq('id', user.id).then(() => {});

          const playerStore = (await import('./usePlayerStore')).usePlayerStore.getState();

          const membershipStore = (await import('./useMembershipStore')).default.getState();
          await Promise.all([
            membershipStore.loadMembership(supabase, user.id),
            membershipStore.syncProgress(supabase, user.id),
          ]);

          const { default: useMembershipStore } = await import('./useMembershipStore');
          const freshStatus = useMembershipStore.getState().status;
          const isNowVip = freshStatus === 'active';
          set({ vipActive: isNowVip });

          if (isNowVip) {
            try {
              const cached = JSON.parse(localStorage.getItem('membership-store') || '{}');
              if (cached?.state?.status && cached.state.status !== 'active') {
                cached.state.status = 'active';
                localStorage.setItem('membership-store', JSON.stringify(cached));
              }
            } catch (_) {}
          }

          membershipStore.subscribeProtocolo(supabase, user.email);

          // ── NUEVO: recalcular nivel si el XP ya superó el umbral ──
          // Detecta usuarios "atascados" y los sube automáticamente al nivel correcto
          const { level, xp, rank } = await recalcLevelIfNeeded(
            user.id,
            data.level,
            data.xp
          );

          playerStore.setPlayerData({
            level,
            xp,
            rank,
            cristales:     data.cristales      ?? 0,
            avatar:        data.avatar         ?? null,
            templarioName: data.templario_name ?? '',
            skoolName:     data.skool_name     ?? '',
            playerClass:   data.player_class   ?? null,
          });

          // Si subió de nivel en el recálculo, disparar el overlay de level-up
          if (level > (data.level ?? 1)) {
            const newTitle = RANK_BY_LEVEL[level]?.name ?? `Nivel ${level}`;
            playerStore.setPlayerData({ ...playerStore, levelUpPending: true, levelUpInfo: {
              oldLevel:   data.level ?? 1,
              newLevel:   level,
              newTitle,
              newRank:    rank,
              bonusXP:    0,
              bonusCoins: 0,
            }});
          }
        }
      },

      updateProfile: async (updates) => {
        const user = get().user;
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .maybeSingle();

        if (!error && data) {
          set({ profile: data });
        }
      },

      logout: async () => {
        await supabase.auth.signOut();

        const { reset } = (await import('./usePlayerStore')).usePlayerStore.getState();
        reset();

        const { reset: resetMembership } = (await import('./useMembershipStore')).default.getState();
        resetMembership();

        set({ user: null, profile: null, session: null, isAdmin: false, loading: false, vipActive: false });
      },
    }),
    {
      name: 'tstore-auth',
      partialize: (s) => ({ session: s.session, user: s.user, vipActive: s.vipActive }),
      onRehydrateStorage: () => (state) => {
        if (state?.user && state?.session) {
          state.loading = false;
          state.isAdmin = false;
        }
      },
    }
  )
);