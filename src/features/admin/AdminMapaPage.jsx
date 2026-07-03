import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const goldIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#f5c842;border:2px solid #1a0800;box-shadow:0 0 8px rgba(245,200,70,0.7);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function AdminMapaPage() {
  const [points, setPoints]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [checkingAdmin, setChecking]  = useState(true);
  const [isAdmin, setIsAdmin]         = useState(false);

  // ── Gate de admin ──
  useEffect(() => {
    (async () => {
      const { supabase } = await import('../../services/supabase.js');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setChecking(false); return; }
      const { data: profile } = await supabase
        .from('profiles').select('is_admin, role').eq('id', user.id).maybeSingle();
      setIsAdmin(!!(profile?.is_admin || profile?.role === 'admin'));
      setChecking(false);
    })();
  }, []);

  useEffect(() => { if (isAdmin) loadPoints(); }, [isAdmin]);

  const loadPoints = async () => {
    setLoading(true); setError(null);
    const { supabase } = await import('../../services/supabase.js');
    const { data, error } = await supabase.rpc('admin_get_user_locations');
    if (error) { setError(error.message); setLoading(false); return; }
    setPoints(data || []);
    setLoading(false);
  };

  const stats = useMemo(() => {
    if (!points) return null;
    return { total: points.length, countries: new Set(points.map(p => p.country).filter(Boolean)).size };
  }, [points]);

  if (checkingAdmin) return null;
  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07030f', color: '#f5c842', fontFamily: 'Cinzel,serif', letterSpacing: 2 }}>
        ⛔ Acceso restringido
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07030f', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontFamily: 'Cinzel,serif', fontWeight: 900, color: '#f5c842', fontSize: 18, letterSpacing: 3 }}>🗺️ MAPA DEL TEMPLO</p>
            <p style={{ margin: 0, fontFamily: 'Cinzel,serif', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              {stats ? `${stats.total} templarios ubicados · ${stats.countries} países · SOLO ADMIN` : 'Cargando…'}
            </p>
          </div>
          <button onClick={loadPoints} style={{
            background: 'rgba(245,200,70,0.12)', border: '1px solid rgba(245,200,70,0.35)',
            borderRadius: 8, color: '#f5c842', fontFamily: 'Cinzel,serif', fontSize: 10,
            fontWeight: 700, cursor: 'pointer', padding: '8px 16px', letterSpacing: 1,
          }}>↺ ACTUALIZAR</button>
        </div>

        <div style={{
          border: '1.5px solid rgba(212,175,55,0.4)', borderRadius: 16, overflow: 'hidden',
          height: '70vh', boxShadow: '0 0 60px rgba(212,175,55,0.08)',
        }}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,200,70,0.5)', fontFamily: 'Cinzel,serif', letterSpacing: 2 }}>
              CARGANDO MAPA…
            </div>
          ) : error ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontFamily: 'Cinzel,serif' }}>
              ⚠ {error}
            </div>
          ) : !points?.length ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: 'Cinzel,serif', textAlign: 'center', padding: 24 }}>
              Aún no hay templarios ubicados.<br />Se van a ir agregando solos en cuanto entren a la app.
            </div>
          ) : (
            <MapContainer center={[20, 0]} zoom={2} minZoom={2} worldCopyJump style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution="&copy; OpenStreetMap contributors &copy; CARTO"
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={(cluster) => L.divIcon({
                  html: `<div style="background:#0d0a1a;border:2px solid #f5c842;color:#f5c842;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Cinzel,serif;font-weight:900;font-size:12px;box-shadow:0 0 14px rgba(245,200,70,0.4);">${cluster.getChildCount()}</div>`,
                  className: '', iconSize: [38, 38],
                })}
              >
                {points.map(p => (
                  <Marker key={p.user_id} position={[p.lat, p.lng]} icon={goldIcon}>
                    <Popup>
                      <div style={{ fontFamily: 'sans-serif', fontSize: 12 }}>
                        <b>{p.name}</b><br />
                        Nv. {p.level ?? '—'} {p.membership_type ? `· ${p.membership_type}` : ''}<br />
                        {p.city ? `${p.city}, ` : ''}{p.country || ''}<br />
                        <span style={{ opacity: 0.5, fontSize: 10 }}>{p.source === 'manual' ? '📍 manual' : '📡 auto (IP)'}</span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}