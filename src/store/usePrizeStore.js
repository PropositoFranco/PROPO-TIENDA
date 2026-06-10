import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { useAuthStore } from './useAuthStore';
import { usePlayerStore } from './usePlayerStore';

export const usePrizeStore = create((set, get) => ({
  pendingReward: null,
  isChecking: false,
  isClaiming: false,

  checkPendingReward: async () => {
    if (get().isChecking) return;

    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ isChecking: true });

    try {
      const { data, error } = await supabase
        .from('pending_rewards')
        .select('*')
        .eq('user_id', user.id)
        .eq('claimed', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        set({ pendingReward: null });
        return;
      }

      set({ pendingReward: data });
    } catch {
      set({ pendingReward: null });
    } finally {
      set({ isChecking: false });
    }
  },

  claimReward: async () => {
    const { pendingReward, isClaiming } = get();
    if (!pendingReward || isClaiming) return null;

    set({ isClaiming: true });

    try {
      const { data, error } = await supabase
        .rpc('claim_reward', { p_reward_id: pendingReward.id });

      if (error || !data?.success) {
        console.error('claim_reward error:', error || data?.error);
        set({ isClaiming: false });
        return null;
      }

      usePlayerStore.getState().setPlayerData({
        cristales: data.new_balance,
      });

      set({ pendingReward: null, isClaiming: false });

      return data;
    } catch (err) {
      console.error('claimReward exception:', err);
      set({ isClaiming: false });
      return null;
    }
  },

  clearPendingReward: () => set({ pendingReward: null }),
}));