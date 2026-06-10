import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';

export const useLevelRewards = () => {
  const { user } = useAuthStore();
  const { level } = usePlayerStore();
  const [rewards, setRewards] = useState([]);
  const [claimedIds, setClaimedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user, level]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: rewardsData }, { data: claimsData }] = await Promise.all([
      supabase.from('level_rewards').select('*').order('level', { ascending: true }),
      supabase.from('user_level_rewards').select('level_reward_id').eq('user_id', user.id),
    ]);
    setRewards(rewardsData ?? []);
    setClaimedIds((claimsData ?? []).map(c => c.level_reward_id));
    setLoading(false);
  };

  const claimReward = async (reward) => {
    if (!user) return { error: 'No user' };
    if (level < reward.level) return { error: 'Nivel insuficiente' };
    if (claimedIds.includes(reward.id)) return { error: 'Ya reclamada' };

    const { error } = await supabase.from('user_level_rewards').insert({
      user_id: user.id,
      level_reward_id: reward.id,
      level: reward.level,
    });

    if (!error) {
      setClaimedIds(prev => [...prev, reward.id]);
      return { success: true };
    }
    return { error };
  };

  const pendingRewards = rewards.filter(
    r => r.level <= level && !claimedIds.includes(r.id)
  );

  const hasRewardForLevel = (lvl) =>
    rewards.some(r => r.level === lvl && !claimedIds.includes(r.id) && level >= lvl);

  return { rewards, claimedIds, pendingRewards, loading, claimReward, hasRewardForLevel, refetch: fetchAll };
};