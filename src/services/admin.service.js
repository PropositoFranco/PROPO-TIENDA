import { supabase } from './supabase';

export const adminService = {
  // ── Users ──
  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_test_user', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // ✅ CORREGIDA: se quitó supabase.raw() (no existe en supabase-js) y causaba el crash
  depositCristales: async (userId, amount, reason) => {
    const txId = `${userId}_${Date.now()}_${Math.random()}`;

    // Leer el valor actual de cristales
    const { data: current, error: fetchError } = await supabase
      .from('profiles')
      .select('cristales')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const newTotal = (current.cristales || 0) + amount;

    // Guardar el nuevo total ya calculado
    const { data, error } = await supabase
      .from('profiles')
      .update({ cristales: newTotal })
      .eq('id', userId)
      .select('cristales')
      .single();

    if (error) throw error;
    
    // Opcional: guardar log de la transacción (para auditoría)
    const { error: logError } = await supabase
      .from('cristales_transactions')
      .insert({
        user_id: userId,
        amount,
        source: reason || 'manual',
        tx_id: txId,
        created_at: new Date()
      });
    
    if (logError) console.warn('No se pudo registrar transacción:', logError);
    
    return data;
  },

  revokeAccess: async (userId) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', userId);
    if (error) throw error;
  },

  // ── Missions ──
  createMission: async (missionData) => {
    const { error } = await supabase
      .from('missions')
      .insert(missionData);
    if (error) throw error;
  },

  updateMission: async (id, updates) => {
    const { error } = await supabase
      .from('missions')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  toggleMission: async (id, isActive) => {
    const { data, error } = await supabase
      .from('missions')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getActiveMissions: async () => {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .order('priority', { ascending: true });
    if (error) throw error;
    return data;
  },

  deleteMission: async (id) => {
    const { error } = await supabase
      .from('missions')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  // ── Products ──
  createProduct: async (productData) => {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateProduct: async (id, updates) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  toggleProduct: async (id, isActive) => {
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ── Stats ──
  getDashboardStats: async () => {
    const [users, cristales, orders, missions] = await Promise.all([
      supabase.from('profiles').select('id').eq('is_active', true).eq('is_test_user', false),
      supabase.from('profiles').select('cristales').eq('is_test_user', false),
      supabase.from('orders').select('id'),
      supabase.from('missions').select('id').eq('is_active', true),
    ]);

    return {
      totalUsers: users.data?.length || 0,
      totalCristales: cristales.data?.reduce((sum, u) => sum + (u.cristales || 0), 0) || 0,
      totalOrders: orders.data?.length || 0,
      totalMissions: missions.data?.length || 0,
    };
  },

  // ── Access Codes ──
  generateCodes: async (count, prefix = '', membershipType = 'standard', durationMonths = 1) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const codes = [];
    for (let i = 0; i < count; i++) {
      let part = '';
      for (let j = 0; j < 8; j++) part += chars[Math.floor(Math.random() * chars.length)];
      const code = prefix ? `${prefix}-${part.slice(0,4)}-${part.slice(4)}` : `${part.slice(0,4)}-${part.slice(4)}`;
      const { data } = await supabase
        .from('access_codes')
        .insert({
          code,
          is_used: false,
          membership_type: membershipType,
          duration_months: membershipType === 'vip' && !durationMonths ? null : durationMonths,
        })
        .select()
        .single();
      if (data) codes.push(data);
    }
    return codes;
  },

  getUnusedCodes: async () => {
    const { data, error } = await supabase
      .from('access_codes')
      .select('*')
      .eq('is_used', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // ── Products ──
  getAllProducts: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
  },

  uploadProductFile: async (file, folder = 'content') => {
    const fileName = `${folder}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from('content')
      .upload(fileName, file, { contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from('content').getPublicUrl(fileName);
    return data.publicUrl;
  },

  deleteProduct: async (id) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── Assets ──
  uploadAsset: async (file, category) => {
    const fileName = `${category}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('t-store-assets')
      .upload(fileName, file);
    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('t-store-assets')
      .getPublicUrl(fileName);

    const { data: manifest } = await supabase
      .from('asset_manifest')
      .insert({ key: file.name.split('.')[0], category, url: urlData.publicUrl })
      .select()
      .single();

    return manifest;
  },

  getAssets: async () => {
    const { data, error } = await supabase
      .from('asset_manifest')
      .select('*')
      .eq('is_active', true);
    if (error) throw error;
    return data;
  },

  uploadImageBase64: async (base64) => {
    const blob = await fetch(base64).then(r => r.blob());
    const ext = blob.type.split('/')[1] || 'jpg';
    const fileName = `missions/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('t-store-assets')
      .upload(fileName, blob, { contentType: blob.type });
    if (error) throw error;
    const { data } = supabase.storage.from('t-store-assets').getPublicUrl(fileName);
    return data.publicUrl;
  },

  createPromoCode: async ({ code, productId, usageType='single', maxUses=null, targetUserId=null, validUntil=null }) => {
    const { data, error } = await supabase.from('promo_codes').insert({
      code: code.toUpperCase().trim(),
      product_id: productId || null,
      type: usageType,
      max_uses: usageType === 'limited' ? maxUses : null,
      expires_at: validUntil || null,
    }).select().single();
    if (error) throw error;
    return data;
  },

  getPromoCodes: async () => {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*, products(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  togglePromoCode: async (id, isActive) => {
    const { error } = await supabase
      .from('promo_codes').update({ is_active: isActive }).eq('id', id);
    if (error) throw error;
  },

  deletePromoCode: async (id) => {
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Weekly Competition ──
  resetWeeklyCompetition: async (adminId) => {
    const { data: lastSeason } = await supabase
      .from('competition_seasons')
      .select('season_number')
      .order('season_number', { ascending: false })
      .limit(1)
      .single();

    const nextSeasonNumber = (lastSeason?.season_number ?? 0) + 1;

    const { data: players, error: playersError } = await supabase
      .from('profiles')
      .select('id, templario_name, avatar, weekly_points, rank')
      .eq('is_active', true)
      .order('weekly_points', { ascending: false });

    if (playersError) throw playersError;

    const snapshot = players.map((p, index) => ({
      rank_position: index + 1,
      user_id: p.id,
      templario_name: p.templario_name,
      avatar: p.avatar,
      weekly_points: p.weekly_points ?? 0,
      rank: p.rank,
    }));

    const { error: seasonError } = await supabase
      .from('competition_seasons')
      .insert({
        season_number: nextSeasonNumber,
        started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        ended_at: new Date().toISOString(),
        snapshot,
        reset_by: adminId,
      });

    if (seasonError) throw seasonError;

    const { error: resetError } = await supabase
      .from('profiles')
      .update({ weekly_points: 0 })
      .eq('is_active', true);

    if (resetError) throw resetError;

    const { data: weeklyMissions } = await supabase
      .from('missions')
      .select('id')
      .eq('type', 'weekly');

    if (weeklyMissions?.length) {
      const missionIds = weeklyMissions.map(m => m.id);
      await supabase
        .from('user_missions')
        .delete()
        .in('mission_id', missionIds);
    }

    return { season: nextSeasonNumber, playersReset: players.length, snapshot };
  },

  getLastSeasonSnapshot: async () => {
    const { data, error } = await supabase
      .from('competition_seasons')
      .select('*')
      .order('season_number', { ascending: false })
      .limit(1)
      .single();
    if (error) return null;
    return data;
  },
};