import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cliente AISLADO exclusivo para Camino Participante.
// Usa un storageKey distinto al cliente principal para que la sesión
// de un participante NUNCA se cruce con la sesión de admin/líder/gerente
// que pueda estar abierta en otra pestaña del mismo navegador.
export const supabaseCamino = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sb-propotienda-camino-auth',
  },
});