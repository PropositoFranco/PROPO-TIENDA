import { supabase } from './supabase';

const MS = { minutes:60000, hours:3600000, days:86400000, weeks:604800000, months:2592000000 };

export const offersService = {
  async getActiveOffers() {
    const { data, error } = await supabase
      .from('special_offers').select('*')
      .eq('is_active', true).order('sort_order');
    if (error) throw error;
    return data;
  },
  async getAllOffers() {
    const { data, error } = await supabase
      .from('special_offers').select('*').order('sort_order');
    if (error) throw error;
    return data;
  },
  async createOffer(offer) {
    let ends_at = null;
    if (offer.time_type !== 'permanent' && offer.duration) {
      ends_at = new Date(Date.now() + offer.duration * (MS[offer.time_type] || 0)).toISOString();
    }
    const { data, error } = await supabase
      .from('special_offers').insert({ ...offer, ends_at }).select().single();
    if (error) throw error;
    return data;
  },
  async updateOffer(id, updates) {
    const { data, error } = await supabase
      .from('special_offers').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async deleteOffer(id) {
    const { error } = await supabase.from('special_offers').delete().eq('id', id);
    if (error) throw error;
  },
  async toggleOffer(id, is_active) {
    return this.updateOffer(id, { is_active });
  },
};