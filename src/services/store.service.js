import { supabase } from './supabase';

export const storeService = {
  getProducts: async (filters = {}) => {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.rarity) {
      query = query.eq('rarity', filters.rarity);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  getProduct: async (slug) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return data;
  },

  redeemPromoCode: async (code) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data, error } = await supabase.rpc('canjear_promo', {
      p_code: code.toUpperCase().trim(),
      p_user_id: user.id,
    });

    console.log('REDEEM DATA:', data, 'ERROR:', error);

    if (error) throw new Error(error.message);
    const result = typeof data === 'string' ? JSON.parse(data) : data;
    if (!result.ok) throw new Error(result.error);
    return result;
  },

  getUserOrders: async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed');
    if (error) throw error;
    return data || [];
  },

  purchase: async (userId, items, total) => {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        items: JSON.stringify(items),
        total_cristales: total,
        status: 'completed',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};