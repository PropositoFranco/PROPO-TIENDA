import { supabase } from './supabase';

export const missionsService = {

  // ─────────────────────────────────────────────
  // MISIONES
  // ─────────────────────────────────────────────
  getActiveMissions: async () => {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
  },

  getUserMissions: async (userId) => {
    const { data, error } = await supabase
      .from('user_missions')
      .select('*, missions(*)')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

claimReward: async (userMissionId) => {
    const { data, error } = await supabase
      .from('user_missions')
      .update({ reward_claimed: true, completed_at: new Date().toISOString() })
      .eq('id', userMissionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ── CLAIM COMPLETO: marca + acredita XP y coins ──
  claimMission: async (userId, mission) => {
    // 1. ¿Ya existe un registro en user_missions?
    const { data: existing } = await supabase
      .from('user_missions')
      .select('id, reward_claimed')
      .eq('user_id', userId)
      .eq('mission_id', mission.id)
      .maybeSingle();

    if (existing?.reward_claimed) {
      throw new Error('Esta misión ya fue reclamada');
    }

    // 2. Obtener saldo actual del perfil
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('xp, cristales')
      .eq('id', userId)
      .single();
    if (profErr) throw profErr;

    const newXP        = (profile.xp        || 0) + (mission.xp_reward   || 0);
    const newCristales = (profile.cristales  || 0) + (mission.coin_reward || 0);

    // 3. Acreditar recompensas en perfil
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ xp: newXP, cristales: newCristales })
      .eq('id', userId);
    if (updErr) throw updErr;

    // 4. Upsert user_missions como completada
    const upsertPayload = {
      user_id:        userId,
      mission_id:     mission.id,
      progress:       1,
      reward_claimed: true,
      completed_at:   new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from('user_missions')
        .update(upsertPayload)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('user_missions')
        .insert(upsertPayload);
    }

    return {
      xp_gained:    mission.xp_reward   || 0,
      coins_gained: mission.coin_reward || 0,
    };
  },


  
  checkAndUpdateStreak: async (userId) => {
  const { data, error } = await supabase
    .rpc('handle_daily_streak', { p_user_id: userId });
  if (error) throw error;
  return data;
},

  // Mantén este por si algo aún lo llama directamente
  claimDailyCoins: async (userId) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('cristales, last_daily_claim')
      .eq('id', userId)
      .single();

    const today = new Date().toISOString().split('T')[0];
    const last  = profile?.last_daily_claim?.split('T')[0];
    if (last === today) throw new Error('Ya reclamaste tus PropoCoins hoy');

    const reward = 50;
    await supabase.from('profiles').update({
      cristales:        (profile.cristales || 0) + reward,
      last_daily_claim: new Date().toISOString(),
    }).eq('id', userId);

    return reward;
  },

  // ─────────────────────────────────────────────
  // BONUSES CONFIGURABLES
  // ─────────────────────────────────────────────

  /** Trae todos los bonus activos (para la página de misiones) */
  getBonusConfigs: async () => {
    const { data, error } = await supabase
      .from('bonus_configs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  /** Trae TODOS los bonus (para admin) */
  getAllBonusConfigs: async () => {
    const { data, error } = await supabase
      .from('bonus_configs')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Revisa cuándo reclamó el usuario por última vez cada bonus.
   * Devuelve un objeto { [bonus_config_id]: last_claimed_at }
   */
  getUserBonusClaims: async (userId) => {
    const { data, error } = await supabase
      .from('bonus_claims')
      .select('bonus_config_id, claimed_at')
      .eq('user_id', userId)
      .order('claimed_at', { ascending: false });
    if (error) throw error;

    // Quédate solo con la más reciente por bonus
    const map = {};
    for (const row of data ?? []) {
      if (!map[row.bonus_config_id]) {
        map[row.bonus_config_id] = row.claimed_at;
      }
    }
    return map;
  },

  /**
   * Intenta reclamar un bonus.
   * Valida el cooldown en el cliente (ya tienes lastClaims del fetch anterior).
   * Luego inserta en bonus_claims y actualiza cristales/xp en profiles.
   * Devuelve { coins, xp } ganados.
   */
  claimBonus: async (userId, bonusConfig, lastClaimedAt) => {
    const { data, error } = await supabase.rpc('claim_bonus_safe', {
      p_user_id:  userId,
      p_bonus_id: bonusConfig.id,
    });
    if (error) throw new Error(error.message);
    return { coins: data.coins, xp: data.xp };
  },

  // ─────────────────────────────────────────────
  // CRUD BONUS (llamado desde admin.service o directo)
  // ─────────────────────────────────────────────

  createBonusConfig: async (payload) => {
    const { data, error } = await supabase
      .from('bonus_configs')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateBonusConfig: async (id, payload) => {
    const { data, error } = await supabase
      .from('bonus_configs')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  toggleBonusConfig: async (id, is_active) => {
    const { error } = await supabase
      .from('bonus_configs')
      .update({ is_active })
      .eq('id', id);
    if (error) throw error;
  },

  deleteBonusConfig: async (id) => {
    const { error } = await supabase
      .from('bonus_configs')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
// ─────────────────────────────────────────────
  // MISIONES — PROGRESO AUTOMÁTICO
  // ─────────────────────────────────────────────

  getProgress: async (userId, eventType) => {
    const { data: missions } = await supabase
      .from('missions')
      .select('id, goal')
      .eq('event_type', eventType)
      .eq('is_active', true)
      .limit(1);
    const mission = missions?.[0];
    if (!mission) return null;
    const { data: um } = await supabase
      .from('user_missions')
      .select('progress, status, reward_claimed')
      .eq('user_id', userId)
      .eq('mission_id', mission.id)
      .maybeSingle();
    if (!um) return { progress: 0, goal: mission.goal, completed: false };
    return {
      progress:       um.progress ?? 0,
      goal:           mission.goal,
      completed:      um.status === 'completed' || um.reward_claimed,
      reward_claimed: um.reward_claimed,
    };
  },

  trackProgress: async (userId, eventType, value = 1) => {
    const { data, error } = await supabase
      .rpc('track_mission_progress', {
        p_user_id:    userId,
        p_event_type: eventType,
        p_value:      value,
      });
    if (error) return [];
    return data ?? [];
  },

  getMissionsWithProgress: async (userId, platform = null) => {
    let query = supabase
      .from('missions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (platform) query = query.eq('platform', platform);

    const { data: missions, error } = await query;
    if (error) throw error;

    const { data: userMissions } = await supabase
      .from('user_missions')
      .select('mission_id, progress, status, completed_at, reward_claimed')
      .eq('user_id', userId);

    const progressMap = {};
    for (const um of userMissions ?? []) {
      progressMap[um.mission_id] = um;
    }

    return missions.map(m => {
      const um       = progressMap[m.id];
      const progress = um?.progress ?? 0;
      const goal     = m.goal ?? 1;
      return {
        ...m,
        user_progress:  progress,
        user_status:    um?.status ?? (['weekly_top3','weekly_top10'].includes(m.event_type) ? 'active' : 'locked'),
        percent:        Math.min(100, Math.round((progress / goal) * 100)),
        reward_claimed: um?.reward_claimed ?? false,
        completed_at:   um?.completed_at ?? null,
      };
    });
  },

  registerWeekPlayed: async (userId, weekNumber) => {
    const { data: player } = await supabase
      .from('templo_players')
      .select('weeks_played')
      .eq('id', userId)
      .single();

    const weeks = player?.weeks_played ?? [];
    if (weeks.includes(weekNumber)) return weeks.length;

    const updated = [...weeks, weekNumber];
    await supabase
      .from('templo_players')
      .update({ weeks_played: updated })
      .eq('id', userId);

    await missionsService.trackProgress(userId, 'weeks_played', updated.length);
    return updated.length;
  },
  trackEvent: async (userId, eventType, value = 1) => {
    return missionsService.trackProgress(userId, eventType, value);
  },

  resetProgress: async (userId, eventType) => {
    const { data: missions } = await supabase
      .from('missions')
      .select('id')
      .eq('event_type', eventType)
      .eq('is_active', true);
    const ids = (missions ?? []).map(m => m.id);
    if (!ids.length) return;
    await supabase
      .from('user_missions')
      .delete()
      .eq('user_id', userId)
      .eq('reward_claimed', false)
      .neq('status', 'completed')
      .in('mission_id', ids);
  },
};