// src/components/LocationCorrector.jsx
// Úsalo en ProfilePage: <LocationCorrector userId={user.id} currentCity={...} currentCountry={...} />
import { useState } from 'react';

export default function LocationCorrector({ userId, currentCity, currentCountry, onSaved }) {
  const [open, setOpen]     = useState(false);
  const [city, setCity]     = useState(currentCity || '');
  const [country, setCountry] = useState(currentCountry || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const save = async () => {
    if (!city.trim() || !country.trim()) { setErr('Escribe ciudad y país'); return; }
    setSaving(true); setErr('');
    try {
      const { supabase } = await import('../services/supabase.js');
      const q = encodeURIComponent(`${city}, ${country}`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`);
      const found = await res.json();
      if (!found?.length) { setErr('No encontré esa ciudad, revisa la ortografía'); setSaving(false); return; }

      const lat = parseFloat(found[0].lat);
      const lng = parseFloat(found[0].lon);

      await supabase.from('user_locations').upsert({
        user_id: userId, lat, lng, city, country,
        source: 'manual', locked_manual: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      setOpen(false);
      onSaved?.({ city, country });
    } catch (e) {
      setErr('Error al guardar, intenta de nuevo');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        background: 'rgba(245,200,70,0.1)', border: '1px solid rgba(245,200,70,0.3)',
        borderRadius: 8, color: '#f5c842', fontFamily: 'Cinzel,serif', fontSize: 10,
        fontWeight: 700, cursor: 'pointer', padding: '6px 14px', letterSpacing: 1,
      }}>
        📍 {currentCity ? `${currentCity}, ${currentCountry} · corregir` : 'Agregar mi ubicación'}
      </button>
    );
  }

  return (
    <div style={{
      background: 'rgba(13,10,26,0.98)', border: '1px solid rgba(245,200,70,0.4)',
      borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280,
    }}>
      <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ciudad (ej. Saltillo)"
        style={{ background: '#0a0614', border: '1px solid rgba(245,200,70,0.3)', borderRadius: 6, padding: '8px 10px', color: '#fff', fontSize: 12 }} />
      <input value={country} onChange={e => setCountry(e.target.value)} placeholder="País (ej. México)"
        style={{ background: '#0a0614', border: '1px solid rgba(245,200,70,0.3)', borderRadius: 6, padding: '8px 10px', color: '#fff', fontSize: 12 }} />
      {err && <span style={{ color: '#ef4444', fontSize: 10 }}>{err}</span>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} disabled={saving} style={{
          flex: 1, background: '#f5c842', border: 'none', borderRadius: 6, color: '#1a0800',
          fontWeight: 900, fontSize: 11, padding: '8px 0', cursor: 'pointer',
        }}>{saving ? 'Guardando…' : 'Guardar'}</button>
        <button onClick={() => setOpen(false)} style={{
          background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6,
          color: 'rgba(255,255,255,0.5)', fontSize: 11, padding: '8px 12px', cursor: 'pointer',
        }}>Cancelar</button>
      </div>
    </div>
  );
}