import { supabase } from './supabase';

export const authService = {
  loginWithCode: async (code) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${code}@t-store.local`,
      password: code,
    });
    if (error) throw error;
    return data;
  },

  register: async (email, password, metadata) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
    return data;
  },

  getCurrentUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};

export const profileService = {
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
