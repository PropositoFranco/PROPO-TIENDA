/**
 * aliados.service.js — Muro de Aliados
 * CRUD real contra Supabase para la tabla `wall_allies` y el bucket
 * `aliados-logos`. Colócalo en: src/services/aliados.service.js
 *
 * Requiere que ya exista src/services/supabase.js exportando `supabase`
 * (tu cliente ya configurado) — es el mismo patrón que usan tus otros
 * services (auth.service.js, store.service.js, etc).
 *
 * Antes de usar este archivo: corre wall_allies_setup.sql en tu proyecto
 * de Supabase (crea la tabla, el bucket y las políticas RLS).
 */

import { supabase } from "./supabase";

const TABLE = "wall_allies";
const BUCKET = "aliados-logos";

// Convierte una fila de la tabla (snake_case) al shape que usa el componente
// (camelCase / nombres en español que ya tenía MuroDeAliados.jsx)
function mapRow(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    frase: row.frase,
    ciudad: row.ciudad || "",
    tipo: row.tipo || "",
    logo: row.logo_url,
    invertirLogo: !!row.invertir_logo,
    logoMode: row.logo_mode || 'plate_light',
    orden: row.orden,
    isActive: row.is_active !== false,
  };
}

/** Lista pública — solo aliados activos, en el orden del muro. */
export async function getAliados() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("is_active", true)
    .order("orden", { ascending: true });
  if (error) throw error;
  return data.map(mapRow);
}

/** Lista para el panel admin — incluye los aliados ocultos (is_active=false)
 *  para que puedas mostrarlos de nuevo con un clic. */
export async function getAliadosAdmin() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("orden", { ascending: true });
  if (error) throw error;
  return data.map(mapRow);
}

/** Sube el logo real al bucket y devuelve la URL pública. */
async function subirLogo(file, idHint) {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const nombreArchivo = `${idHint || crypto.randomUUID()}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(nombreArchivo, file, { cacheControl: "31536000", upsert: true });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(nombreArchivo);
  return data.publicUrl;
}

/** Crea un aliado nuevo. `form.logoFile` (si existe) se sube al bucket. */
export async function crearAliado(form) {
  let logo_url = null;
  if (form.logoFile) logo_url = await subirLogo(form.logoFile);

  // Siguiente posición al final del muro
  const { data: ultimo } = await supabase
    .from(TABLE)
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1);
  const siguienteOrden = ultimo && ultimo.length ? ultimo[0].orden + 1 : 0;

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      nombre: form.nombre.trim(),
      frase: form.frase.trim(),
      ciudad: form.ciudad?.trim() || null,
      tipo: form.tipo?.trim() || null,
      logo_url,
      invertir_logo: !!form.invertirLogo,
      logo_mode: form.logoMode || 'plate_light',
      orden: siguienteOrden,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

/** Actualiza un aliado existente. Si no se subió logo nuevo, conserva el actual. */
export async function actualizarAliado(form) {
  const payload = {
    nombre: form.nombre.trim(),
    frase: form.frase.trim(),
    ciudad: form.ciudad?.trim() || null,
    tipo: form.tipo?.trim() || null,
    invertir_logo: !!form.invertirLogo,
    logo_mode: form.logoMode || 'plate_light',
    updated_at: new Date().toISOString(),
  };

  if (form.logoFile) {
    payload.logo_url = await subirLogo(form.logoFile, form.id);
  }
  // si no hay logoFile nuevo, no tocamos logo_url — se conserva el que ya tenía

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", form.id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

/** Borra un aliado de forma definitiva. Úsalo solo cuando de verdad quieras
 *  que desaparezca para siempre — para "quitarlo del muro pero conservarlo"
 *  usa toggleAliadoActivo(id, false) en vez de esto. */
export async function borrarAliado(id) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

/** Oculta o vuelve a mostrar un aliado sin borrar nada — reversible con un
 *  clic. Esto es lo que usa el botón "Ocultar/Mostrar" del panel admin. */
export async function toggleAliadoActivo(id, isActive) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

/** Persiste el nuevo orden del muro (drag&drop o flechas).
 *  Recibe la lista ya reordenada con su campo `orden` actualizado. */
export async function reordenarAliados(aliadosOrdenados) {
  const updates = aliadosOrdenados.map((a) =>
    supabase.from(TABLE).update({ orden: a.orden }).eq("id", a.id)
  );
  const resultados = await Promise.all(updates);
  const fallido = resultados.find((r) => r.error);
  if (fallido) throw fallido.error;
}

/**
 * Cuenta real de Templarios para la Bandeja de Impacto.
 * Verificado directo contra tu tabla `profiles`: membership_status usa
 * los valores 'active' / 'inactive' — el filtro de abajo ya es correcto.
 */
export async function getTemplariosRegistrados() {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("membership_status", "active");
  if (error) throw error;
  return count || 0;
}
