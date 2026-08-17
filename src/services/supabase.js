import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Guardar en localStorage para que otros archivos (como el juego HTML) puedan acceder
localStorage.setItem('_sb_url', supabaseUrl);
localStorage.setItem('_sb_key', supabaseAnonKey);

// Si estamos en una ruta de Camino Participante, el cliente principal NO debe
// intentar leer el token de sesión de la URL — eso le toca exclusivamente a
// supabaseCamino. Si los dos lo intentan, se pelean por el mismo hash de
// Google OAuth y uno se lo gana antes que el otro, dejando al usuario sin
// sesión válida (loop de vuelta al login).
const enRutaCamino = typeof window !== 'undefined' && window.location.pathname.startsWith('/camino');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !enRutaCamino
  }
});