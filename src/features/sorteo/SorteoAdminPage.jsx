/**
 * SorteoAdminPage.jsx — Templo del Propósito
 * Ruta: /admin/sorteos  (ADMIN)
 * Crear Eventos de rifa continua, ver links/QR, monitorear en vivo
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';

const C = {
  bg:      '#07040f',
  card:    '#0e0818',
  border:  'rgba(212,175,55,0.15)',
  borderHi:'rgba(212,175,55,0.4)',
  gold:    '#D4AF37',
  goldDim: 'rgba(212,175,55,0.5)',
  purple:  '#9b59ff',
  text:    '#f0eaff',
  muted:   'rgba(240,234,255,0.45)',
  green:   '#44ff88',
  red:     '#ff4466',
};

const BASE_URL = window.location.origin;

// ── Utilidades ─────────────────────────────────────────────────────────────────
function copiarAlPortapapeles(texto) {
  navigator.clipboard?.writeText(texto).catch(() => {});
}

// ── Componente QR via API pública ─────────────────────────────────────────────
function QRCode({ url, size = 160 }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=07040f&color=D4AF37&margin=10`;
  return (
    <img
      src={qrUrl}
      alt="QR"
      style={{ width: size, height: size, borderRadius: 8, border: `1px solid ${C.border}` }}
    />
  );
}

// ── Badge de estado ────────────────────────────────────────────────────────────
function Badge({ activo }) {
  return (
    <span style={{
      fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 2,
      color: activo ? C.green : C.muted,
      border: `1px solid ${activo ? 'rgba(68,255,136,0.3)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 20, padding: '3px 10px',
    }}>
      {activo ? '● ACTIVO' : '○ INACTIVO'}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function SorteoAdminPage() {
  const [eventos,       setEventos]       = useState([]);
  const [eventoAbierto, setEventoAbierto] = useState(null); // id del evento expandido
  const [rondas,        setRondas]        = useState({});   // { eventoId: [...rondas] }
  const [loading,       setLoading]       = useState(true);
  const [creando,       setCreando]       = useState(false);
  const [form,          setForm]          = useState({ nombre: '', cupo: 10 });
  const [errForm,       setErrForm]       = useState('');
  const [copiado,       setCopiado]       = useState('');
  const [masterStats,   setMasterStats]   = useState(null);
  const [tabActiva,     setTabActiva]     = useState('sorteos'); // 'sorteos' | 'aliados' | 'metricas'
  const [metricas,      setMetricas]      = useState(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  const [aliados,       setAliados]       = useState([]);
  const [loadingAliados, setLoadingAliados] = useState(false);
  const [formAliado,    setFormAliado]    = useState({ nombre: '', slug: '' });
  const [errAliado,     setErrAliado]     = useState('');
  const [creandoAliado, setCreandoAliado] = useState(false);
  const [copiadoAliado, setCopiadoAliado] = useState('');
  const [eventosActivos, setEventosActivos] = useState([]);
  const [eventoGlobal,  setEventoGlobal]  = useState('');
  const [guardandoGlobal, setGuardandoGlobal] = useState(false);

  // ── CSS ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@700;900&display=swap');
      @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes pulse  { 0%,100%{opacity:.6} 50%{opacity:1} }
      input::placeholder { color: rgba(212,175,55,0.25); }
      input:focus { border-color: rgba(212,175,55,0.5) !important; outline: none !important; }
    `;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  // ── Cargar eventos ───────────────────────────────────────────────────────────
  const cargarEventos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sorteo_eventos')
      .select('*')
      .order('created_at', { ascending: false });
    setEventos(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargarEventos(); }, [cargarEventos]);

  // ── Cargar rondas de un evento ───────────────────────────────────────────────
  const cargarRondas = useCallback(async (eventoId) => {
    const { data } = await supabase
      .from('sorteos')
      .select(`
        id, numero_ronda, cupo, estado,
        sorteo_participantes(id, nombre, email, es_ganador, cupon_code, cupon_aceptado, premio_visto, premio_entregado, tipo_premio)
      `)
      .eq('evento_id', eventoId)
      .order('numero_ronda', { ascending: false })
      .limit(20);
    setRondas(prev => ({ ...prev, [eventoId]: data || [] }));
  }, []);

  // ── Realtime por evento abierto ──────────────────────────────────────────────
  useEffect(() => {
    if (!eventoAbierto) return;
    cargarRondas(eventoAbierto);
    const canal = supabase
      .channel(`admin-evento-${eventoAbierto}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sorteos', filter: `evento_id=eq.${eventoAbierto}` }, () => cargarRondas(eventoAbierto))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sorteo_participantes' }, () => cargarRondas(eventoAbierto))
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [eventoAbierto, cargarRondas]);

  // ── Crear evento ─────────────────────────────────────────────────────────────
  const crearEvento = async () => {
    if (!form.nombre.trim()) { setErrForm('Pon un nombre al evento.'); return; }
    if (!form.cupo || form.cupo < 2 || form.cupo > 100) { setErrForm('El cupo debe ser entre 2 y 100.'); return; }
    setErrForm('');
    setCreando(true);

    const { data, error } = await supabase
      .from('sorteo_eventos')
      .insert({ nombre: form.nombre.trim(), cupo_por_ronda: Number(form.cupo), activo: true })
      .select()
      .single();

    setCreando(false);
    if (error) { setErrForm('Error al crear. Intenta de nuevo.'); return; }

    setForm({ nombre: '', cupo: 10 });
    setEventos(prev => [data, ...prev]);
    setEventoAbierto(data.id);
  };

  // ── Pausar / activar evento ──────────────────────────────────────────────────
  const toggleEvento = async (id, activo) => {
    await supabase.from('sorteo_eventos').update({ activo: !activo }).eq('id', id);
    setEventos(prev => prev.map(e => e.id === id ? { ...e, activo: !activo } : e));
  };

  // ── Copiar link ───────────────────────────────────────────────────────────────
  const copiarLink = (eventoId) => {
    const link = `${BASE_URL}/sorteo/${eventoId}`;
    copiarAlPortapapeles(link);
    setCopiado(eventoId);
    setTimeout(() => setCopiado(''), 2000);
  };
  
  

  // ── Aliados ───────────────────────────────────────────────────────────────────
  const SUPABASE_URL = 'https://hdwzhwuhlrtrmhnecypm.supabase.co';

  const cargarAliados = useCallback(async () => {
    setLoadingAliados(true);
    const { data } = await supabase
      .from('aliados')
      .select('*, sorteo_eventos(nombre)')
      .order('scan_count', { ascending: false });
    setAliados(data || []);
    setLoadingAliados(false);
  }, []);

  const cargarEventosActivos = useCallback(async () => {
    const [{ data: evs }, { data: cfg }] = await Promise.all([
      supabase.from('sorteo_eventos').select('id, nombre').eq('activo', true).order('created_at', { ascending: false }),
      supabase.from('config').select('value').eq('key', 'sorteo_activo_global').single(),
    ]);
    setEventosActivos(evs || []);
    if (cfg?.value) setEventoGlobal(cfg.value);
  }, []);

  useEffect(() => {
    if (tabActiva === 'metricas') {
      setLoadingMetricas(true);
      (async () => {
        const [{ data: porAliado }, { data: porDia }, { data: scans }, { data: porUtm }] = await Promise.all([
          supabase.rpc('metricas_por_aliado'),
          supabase.from('sorteo_participantes')
            .select('nombre, email, aliado_origen_slug, utm_source, registered_at, es_ganador')
            .order('registered_at', { ascending: false }),
          supabase.from('aliado_scans')
            .select('aliado_id, device_type, scanned_at')
            .order('scanned_at', { ascending: false }),
          supabase.rpc('metricas_por_utm'),
        ]);
        setMetricas({ porAliado: porAliado || [], registros: porDia || [], scans: scans || [], porUtm: porUtm || [] });
        setLoadingMetricas(false);
      })();
    }
    if (tabActiva === 'aliados') {
      cargarAliados();
      cargarEventosActivos();
    }
  }, [tabActiva, cargarAliados, cargarEventosActivos]);

  const slugify = (texto) =>
    texto.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 30);

  const crearAliado = async () => {
    const slug = slugify(formAliado.slug || formAliado.nombre);
    if (!formAliado.nombre.trim()) { setErrAliado('El nombre es obligatorio.'); return; }
    if (!slug) { setErrAliado('El slug no puede estar vacío.'); return; }
    setErrAliado('');
    setCreandoAliado(true);
    const { error } = await supabase.from('aliados').insert({
      nombre: formAliado.nombre.trim(),
      slug,
      activo: true,
    });
    setCreandoAliado(false);
    if (error) {
      setErrAliado(error.code === '23505' ? 'Ese slug ya existe. Elige otro nombre.' : 'Error al crear. Intenta de nuevo.');
      return;
    }
    setFormAliado({ nombre: '', slug: '' });
    cargarAliados();
  };

  const guardarEventoGlobal = async (nuevoId) => {
    setGuardandoGlobal(true);
    await supabase.from('config').update({ value: nuevoId, updated_at: new Date().toISOString() }).eq('key', 'sorteo_activo_global');
    setEventoGlobal(nuevoId);
    setGuardandoGlobal(false);
  };

  const toggleAliado = async (id, activo) => {
    await supabase.from('aliados').update({ activo: !activo }).eq('id', id);
    setAliados(prev => prev.map(a => a.id === id ? { ...a, activo: !activo } : a));
  };

  const cambiarSorteoAliado = async (id, sorteoEventoId) => {
    await supabase.from('aliados').update({ sorteo_activo_id: sorteoEventoId }).eq('id', id);
    setAliados(prev => prev.map(a => a.id === id ? { ...a, sorteo_activo_id: sorteoEventoId } : a));
  };

  const copiarQRAliado = (slug) => {
    const url = `${SUPABASE_URL}/functions/v1/r/${slug}`;
    copiarAlPortapapeles(url);
    setCopiadoAliado(slug);
    setTimeout(() => setCopiadoAliado(''), 2000);
  };

  const cargarMasterStats = useCallback(async () => {
    const [
      { count: totalEventos },
      { count: totalRondas },
      { count: totalRegistrados },
      { count: totalGanadores },
      { count: totalEntregados },
      { count: totalAceptaron },
      { count: totalVieron },
    ] = await Promise.all([
      supabase.from('sorteo_eventos').select('id', { count: 'exact', head: true }),
      supabase.from('sorteos').select('id', { count: 'exact', head: true }),
      supabase.from('sorteo_participantes').select('id', { count: 'exact', head: true }),
      supabase.from('sorteo_participantes').select('id', { count: 'exact', head: true }).eq('es_ganador', true),
      supabase.from('sorteo_participantes').select('id', { count: 'exact', head: true }).eq('premio_entregado', true),
      supabase.from('sorteo_participantes').select('id', { count: 'exact', head: true }).eq('cupon_aceptado', true),
      supabase.from('sorteo_participantes').select('id', { count: 'exact', head: true }).eq('premio_visto', true),
    ]);
    const convRate = totalGanadores > 0 ? Math.round((totalAceptaron / totalGanadores) * 100) : 0;
    setMasterStats({ totalEventos, totalRondas, totalRegistrados, totalGanadores, totalEntregados, totalAceptaron, totalVieron, convRate });
  }, []);

  useEffect(() => { cargarMasterStats(); }, [cargarMasterStats]);

  // ── Estadísticas de un evento ─────────────────────────────────────────────────
  const statsEvento = (eventoId) => {
    const rs = rondas[eventoId] || [];
    const completadas = rs.filter(r => r.estado === 'completado');
    const todasRondas = rs; // incluye abierta
    const todosParticipantes = todasRondas.flatMap(r => r.sorteo_participantes || []);
    const totalRegistrados = todosParticipantes.length;
    const totalGanadores = todosParticipantes.filter(p => p.es_ganador).length;
    const totalEntregados = todosParticipantes.filter(p => p.premio_entregado).length;
    const totalAceptaron = todosParticipantes.filter(p => p.es_ganador && p.cupon_aceptado).length;
    const totalVieron = todosParticipantes.filter(p => p.es_ganador && p.premio_visto).length;
    const mediaAceptacion = totalGanadores > 0 ? Math.round((totalAceptaron / totalGanadores) * 100) : 0;
    const rondaActiva = rs.find(r => r.estado === 'abierto');
    return { completadas: completadas.length, totalRondas: rs.length, totalRegistrados, totalGanadores, totalEntregados, totalAceptaron, totalVieron, mediaAceptacion, rondaActiva };
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 'clamp(20px,4vw,40px)', fontFamily: 'sans-serif' }}>

      {/* Cabecera */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 5, color: C.goldDim, marginBottom: 6 }}>
          TEMPLO DEL PROPÓSITO · ADMIN
        </div>
        <h1 style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 900, fontSize: 'clamp(20px,4vw,32px)', color: C.gold, margin: 0, letterSpacing: 2 }}>
          🎲 SISTEMA DE RIFAS
        </h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 8, fontStyle: 'italic' }}>
          Crea eventos de rifa continua — cada QR abre rondas automáticas sin parar.
        </p>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          {[
            { id: 'sorteos', label: '🎲 SORTEOS' },
            { id: 'aliados', label: '🤝 ALIADOS' },
            { id: 'metricas', label: '📊 MÉTRICAS' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              style={{
                padding: '9px 20px',
                background: tabActiva === tab.id ? `linear-gradient(135deg,${C.gold},#9a7a00)` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${tabActiva === tab.id ? C.gold : C.border}`,
                borderRadius: 8, cursor: 'pointer',
                color: tabActiva === tab.id ? '#0a0614' : C.muted,
                fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 2, fontWeight: 900,
                transition: 'all .2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ TAB: SORTEOS ══ */}
      {tabActiva === 'sorteos' && (<>

      {/* Master Stats */}
      {masterStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10, marginBottom: 28 }}>
          {[
            { label: 'EVENTOS',      value: masterStats.totalEventos,    icon: '🎲', color: C.gold },
            { label: 'RONDAS',       value: masterStats.totalRondas,     icon: '🔁', color: C.goldDim },
            { label: 'REGISTRADOS',  value: masterStats.totalRegistrados,icon: '⚔️', color: C.text },
            { label: 'GANADORES',    value: masterStats.totalGanadores,  icon: '👑', color: C.gold },
            { label: 'ENTREGADOS',   value: masterStats.totalEntregados, icon: '📦', color: '#60A5FA' },
            { label: 'ACEPTARON',    value: masterStats.totalAceptaron,  icon: '✅', color: C.green },
            { label: 'VIERON',       value: masterStats.totalVieron,     icon: '👁', color: C.purple },
            { label: 'CONVERSIÓN',   value: `${masterStats.convRate}%`,  icon: '📈', color: masterStats.convRate > 50 ? C.green : masterStats.convRate > 20 ? C.gold : C.red },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 22, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 7, letterSpacing: 2, color: C.muted, marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario crear evento */}
      <div style={{ background: C.card, border: `1.5px solid ${C.borderHi}`, borderRadius: 16, padding: 'clamp(20px,4vw,28px)', marginBottom: 32, animation: 'fadeIn .4s ease both' }}>
        <h2 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 14, letterSpacing: 2, color: C.gold, margin: '0 0 20px' }}>
          + NUEVO EVENTO
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={{ display: 'block', fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 2, color: C.goldDim, marginBottom: 6 }}>
              NOMBRE DEL EVENTO
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && crearEvento()}
              placeholder="Ej: Rifa Principal — Zona VIP"
              style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: 'Cinzel, serif', fontSize: 12 }}
            />
          </div>
          <div style={{ minWidth: 120 }}>
            <label style={{ display: 'block', fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 2, color: C.goldDim, marginBottom: 6 }}>
              CUPO POR RONDA
            </label>
            <input
              type="number"
              value={form.cupo}
              min={2} max={100}
              onChange={e => setForm(f => ({ ...f, cupo: e.target.value }))}
              style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: 'Cinzel, serif', fontSize: 14, textAlign: 'center' }}
            />
          </div>
          <button
            onClick={crearEvento}
            disabled={creando}
            style={{ padding: '11px 24px', background: `linear-gradient(135deg,${C.gold},#9a7a00)`, border: 'none', borderRadius: 8, color: '#0a0614', fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: 2, fontWeight: 900, cursor: creando ? 'not-allowed' : 'pointer', opacity: creando ? 0.6 : 1, whiteSpace: 'nowrap' }}
          >
            {creando ? 'CREANDO...' : '⚔️ CREAR'}
          </button>
        </div>
        {errForm && <p style={{ color: C.red, fontFamily: 'Cinzel, serif', fontSize: 10, marginTop: 10, letterSpacing: 1 }}>⚠ {errForm}</p>}
      </div>

      {/* Lista de eventos */}
      {loading ? (
        <p style={{ color: C.goldDim, fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 3, textAlign: 'center', animation: 'pulse 1.5s ease-in-out infinite' }}>
          CARGANDO EVENTOS...
        </p>
      ) : eventos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: 12, letterSpacing: 2 }}>NO HAY EVENTOS AÚN</p>
          <p style={{ fontSize: 13, marginTop: 8, fontStyle: 'italic' }}>Crea el primero arriba para generar tu primer QR.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {eventos.map(evento => {
            const link = `${BASE_URL}/sorteo/${evento.id}`;
            const abierto = eventoAbierto === evento.id;
            const stats = statsEvento(evento.id);
            const rs = rondas[evento.id] || [];

            return (
              <div key={evento.id} style={{ background: C.card, border: `1px solid ${abierto ? C.borderHi : C.border}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color .3s', animation: 'fadeIn .4s ease both' }}>

                {/* Header del evento */}
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 900, fontSize: 'clamp(13px,2.5vw,17px)', color: C.gold }}>
                        {evento.nombre}
                      </span>
                      <Badge activo={evento.activo} />
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: C.muted, letterSpacing: 1 }}>
                        {evento.cupo_por_ronda} cupos / ronda
                      </span>
                      {abierto && rs.length > 0 && (
                        <>
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: C.muted, letterSpacing: 1 }}>
                            ⚔️ {stats.totalRegistrados} registrados
                          </span>
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: C.gold, letterSpacing: 1 }}>
                            👑 {stats.totalGanadores} ganadores
                          </span>
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: C.green, letterSpacing: 1 }}>
                            ✅ {stats.totalAceptaron}/{stats.totalGanadores} aceptaron ({stats.mediaAceptacion}%)
                          </span>
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: '#60A5FA', letterSpacing: 1 }}>
                            📦 {stats.totalEntregados} entregados
                          </span>
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: C.purple, letterSpacing: 1 }}>
                            👁 {stats.totalVieron} vieron
                          </span>
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: C.muted, letterSpacing: 1 }}>
                            🔁 {stats.totalRondas} rondas
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Botones */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => { copiarLink(evento.id); }}
                      style={{ padding: '8px 14px', background: copiado === evento.id ? 'rgba(68,255,136,0.12)' : 'rgba(212,175,55,0.08)', border: `1px solid ${copiado === evento.id ? 'rgba(68,255,136,0.4)' : C.border}`, borderRadius: 8, color: copiado === evento.id ? C.green : C.gold, fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1, cursor: 'pointer', transition: 'all .2s' }}
                    >
                      {copiado === evento.id ? '✓ COPIADO' : '🔗 LINK'}
                    </button>
                    <button
                      onClick={() => setEventoAbierto(abierto ? null : evento.id)}
                      style={{ padding: '8px 14px', background: abierto ? 'rgba(155,89,255,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${abierto ? 'rgba(155,89,255,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: abierto ? C.purple : C.muted, fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1, cursor: 'pointer' }}
                    >
                      {abierto ? '▲ CERRAR' : '▼ VER'}
                    </button>
                    <button
                      onClick={() => toggleEvento(evento.id, evento.activo)}
                      style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 8, color: C.muted, fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1, cursor: 'pointer' }}
                    >
                      {evento.activo ? 'PAUSAR' : 'ACTIVAR'}
                    </button>
                  </div>
                </div>

                {/* Panel expandido */}
                {abierto && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: '24px', animation: 'fadeIn .3s ease both' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 32, alignItems: 'start' }}>

                      {/* QR */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <QRCode url={link} size={160} />
                        <p style={{ fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 2, color: C.goldDim, textAlign: 'center' }}>
                          ESCANEAR PARA ENTRAR
                        </p>
                        <div style={{ background: 'rgba(212,175,55,0.06)', border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 12px', maxWidth: 160, wordBreak: 'break-all' }}>
                          <p style={{ fontFamily: 'monospace', fontSize: 9, color: C.goldDim, margin: 0 }}>{link}</p>
                        </div>
                        <button
                          onClick={() => copiarLink(evento.id)}
                          style={{ padding: '8px 16px', background: `linear-gradient(135deg,${C.gold},#9a7a00)`, border: 'none', borderRadius: 6, color: '#0a0614', fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 2, fontWeight: 900, cursor: 'pointer', width: '100%' }}
                        >
                          📋 COPIAR LINK
                        </button>
                      </div>

                      {/* Rondas en vivo */}
                      <div>
                        {/* Ronda activa */}
                        {stats.rondaActiva && (
                          <div style={{ background: 'rgba(212,175,55,0.05)', border: `1px solid ${C.borderHi}`, borderRadius: 12, padding: '16px', marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 2 }}>
                                RONDA #{stats.rondaActiva.numero_ronda} — EN VIVO
                              </span>
                              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: C.green, animation: 'pulse 1.5s ease-in-out infinite' }}>
                                ● {stats.rondaActiva.sorteo_participantes?.length || 0}/{stats.rondaActiva.cupo}
                              </span>
                            </div>
                            {/* Barra de progreso */}
                            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
                              <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(((stats.rondaActiva.sorteo_participantes?.length || 0) / stats.rondaActiva.cupo) * 100, 100)}%`, background: `linear-gradient(90deg,${C.gold},${C.purple})`, transition: 'width .5s ease' }} />
                            </div>
                            {/* Participantes */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {(stats.rondaActiva.sorteo_participantes || []).map((p, i) => (
                                <span key={p.id} style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: C.muted, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '3px 10px', animation: 'fadeIn .3s ease both', animationDelay: `${i * 0.04}s` }}>
                                  {p.nombre}
                                </span>
                              ))}
                              {(stats.rondaActiva.sorteo_participantes?.length || 0) === 0 && (
                                <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: 'rgba(255,255,255,0.15)', fontStyle: 'italic' }}>
                                  Esperando participantes...
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Sin ronda activa todavía */}
                        {!stats.rondaActiva && rs.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '20px', color: C.muted }}>
                            <p style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 2 }}>SIN RONDAS AÚN</p>
                            <p style={{ fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
                              Comparte el QR — la primera ronda abre cuando alguien se registre.
                            </p>
                          </div>
                        )}

                        {/* Historial de rondas completadas */}
                        {rs.filter(r => r.estado === 'completado').length > 0 && (
                          <div>
                            <p style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 3, color: C.goldDim, marginBottom: 10 }}>
                              RONDAS COMPLETADAS
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
                              {rs.filter(r => r.estado === 'completado').map(ronda => {
                                const ganador = ronda.sorteo_participantes?.find(p => p.es_ganador);
                                return (
                                  <div key={ronda.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                    <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: C.goldDim, minWidth: 80 }}>
                                      RONDA #{ronda.numero_ronda}
                                    </span>
                                    <span style={{ fontFamily: 'Cinzel, serif', fontSize: 7, color: 'rgba(212,175,55,0.3)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 3, padding: '2px 6px', letterSpacing: 1 }}>
                                      SELLADA
                                    </span>
                                    {ganador && (
                                      <span style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: C.gold, fontWeight: 700 }}>
                                        👑 {ganador.nombre}
                                      </span>
                                    )}
                                    {ganador?.cupon_code && (
                                      <span style={{ fontFamily: 'monospace', fontSize: 10, color: C.goldDim, background: 'rgba(212,175,55,0.08)', padding: '2px 8px', borderRadius: 4 }}>
                                        {ganador.cupon_code}
                                      </span>
                                    )}
                                    <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: C.muted, marginLeft: 'auto' }}>
                                      {ronda.sorteo_participantes?.length || 0} guerreros
                                      {(() => {
                                        const ganadores = ronda.sorteo_participantes?.filter(p => p.es_ganador) || [];
                                        const aceptaron = ganadores.filter(p => p.cupon_aceptado).length;
                                        const vieron = ganadores.filter(p => p.premio_visto).length;
                                        return ganadores.length > 0 ? ` · ✅${aceptaron}/${ganadores.length} · 👁${vieron}` : '';
                                      })()}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>)}

      {/* ══ TAB: MÉTRICAS ══ */}
      {tabActiva === 'metricas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {loadingMetricas ? (
            <div style={{ color: C.muted, fontFamily: 'Cinzel,serif', fontSize: 11, letterSpacing: 3, textAlign: 'center', padding: 60 }}>CARGANDO MÉTRICAS...</div>
          ) : metricas ? (<>

            {/* ── KPIs estilo Skool ── */}
            {(() => {
              const total = metricas.porAliado.reduce((acc, a) => ({
                scans: acc.scans + (a.scan_count || 0),
                registros: acc.registros + Number(a.registros || 0),
                ganadores: acc.ganadores + Number(a.ganadores || 0),
                aceptados: acc.aceptados + Number(a.cupones_aceptados || 0),
                entregados: acc.entregados + Number(a.premios_entregados || 0),
              }), { scans: 0, registros: 0, ganadores: 0, aceptados: 0, entregados: 0 });
              const totalReg = metricas.registros.length || 0;
              const convGlobal = total.scans ? `${Math.round(total.registros / total.scans * 100)}%` : `${totalReg > 0 ? '—' : '0%'}`;
              const kpis = [
                { label: 'VISITANTES (QR)', value: total.scans, color: '#CC44FF', icon: '📡' },
                { label: 'REGISTROS', value: totalReg, color: C.gold, icon: '⚔️' },
                { label: 'CONV. GLOBAL', value: convGlobal, color: '#4ade80', icon: '📈' },
                { label: 'GANADORES', value: total.ganadores, color: '#f0c040', icon: '👑' },
                { label: 'CUPONES ACTIVOS', value: total.aceptados, color: '#60a5fa', icon: '🎟️' },
                { label: 'PREMIOS ENTREGADOS', value: total.entregados, color: '#86efac', icon: '🏆' },
              ];
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                  {kpis.map((k, i) => (
                    <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 16px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 8, right: 10, fontSize: 18, opacity: 0.18 }}>{k.icon}</div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: k.color, fontFamily: 'Cinzel,serif', lineHeight: 1 }}>{k.value}</div>
                      <div style={{ fontSize: 7, letterSpacing: 2, color: C.muted, fontFamily: 'Cinzel,serif', marginTop: 8, lineHeight: 1.4 }}>{k.label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* ── Fila: Pastel UTM + Barras por aliado ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16 }}>

              {/* Pastel — ¿De dónde vienen? */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 20px 16px' }}>
                <div style={{ fontFamily: 'Cinzel,serif', fontSize: 10, letterSpacing: 3, color: C.gold, marginBottom: 16 }}>🌐 ORIGEN DE REGISTROS</div>
                {(() => {
                  const data = metricas.porUtm || [];
                  const total = data.reduce((s, d) => s + Number(d.registros || 0), 0);
                  if (total === 0) return <div style={{ color: C.muted, fontSize: 11, textAlign: 'center', padding: '20px 0' }}>Sin datos aún</div>;
                  const COLORS = ['#D4AF37','#CC44FF','#E1306C','#69C9D0','#4285F4','#FF0000','#4ade80','#f87171'];
                  // SVG pastel
                  const cx = 80, cy = 80, r = 64, rInner = 36;
                  let startAngle = -Math.PI / 2;
                  const slices = data.map((d, i) => {
                    const pct = Number(d.registros) / total;
                    const angle = pct * 2 * Math.PI;
                    const x1 = cx + r * Math.cos(startAngle);
                    const y1 = cy + r * Math.sin(startAngle);
                    const x2 = cx + r * Math.cos(startAngle + angle);
                    const y2 = cy + r * Math.sin(startAngle + angle);
                    const xi1 = cx + rInner * Math.cos(startAngle);
                    const yi1 = cy + rInner * Math.sin(startAngle);
                    const xi2 = cx + rInner * Math.cos(startAngle + angle);
                    const yi2 = cy + rInner * Math.sin(startAngle + angle);
                    const large = angle > Math.PI ? 1 : 0;
                    const path = `M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${rInner} ${rInner} 0 ${large} 0 ${xi1} ${yi1} Z`;
                    const slice = { path, color: COLORS[i % COLORS.length], label: d.canal, pct: d.pct, registros: d.registros };
                    startAngle += angle;
                    return slice;
                  });
                  const CANAL_ICON = {
                    'QR Aliado': '📡', 'Instagram': '📸', 'TikTok': '🎵',
                    'Facebook': '👥', 'YouTube': '▶️', 'Google': '🔍',
                    'Directo': '🔗',
                  };
                  return (
                    <div>
                      <svg viewBox="0 0 160 160" style={{ width: '100%', maxWidth: 160, display: 'block', margin: '0 auto 14px' }}>
                        {slices.length === 1 ? (
                          // Un solo canal → círculo completo en lugar de path (evita bug SVG arc 360°)
                          <>
                            <circle cx={cx} cy={cy} r={r} fill={slices[0].color} opacity="0.9" />
                            <circle cx={cx} cy={cy} r={rInner} fill={C.card} />
                          </>
                        ) : (
                          slices.map((s, i) => (
                            <path key={i} d={s.path} fill={s.color} stroke="rgba(4,2,14,0.9)" strokeWidth="1.5" opacity="0.9" />
                          ))
                        )}
                        <circle cx={cx} cy={cy} r={rInner - 1} fill={C.card} />
                        <text x={cx} y={cy - 6} textAnchor="middle" fill={C.gold} fontSize="18" fontWeight="900" fontFamily="Cinzel,serif">{total}</text>
                        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="6.5" fontFamily="Cinzel,serif" letterSpacing="1">REGISTROS</text>
                      </svg>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {slices.map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, marginRight: 2 }}>{CANAL_ICON[s.label] || '🌐'}</span>
                            <span style={{ flex: 1, fontFamily: 'Cinzel,serif', fontSize: 9, letterSpacing: 0.5, color: C.text }}>{s.label}</span>
                            <span style={{ fontSize: 11, color: s.color, fontWeight: 700, fontFamily: 'Cinzel,serif' }}>{s.registros}</span>
                            <span style={{ fontSize: 9, color: C.muted, minWidth: 32, textAlign: 'right' }}>{s.pct}%</span>
                          </div>
                        ))}
                      </div>
                      {/* Guía de UTMs para redes */}
                      <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 8 }}>
                        <div style={{ fontFamily: 'Cinzel,serif', fontSize: 8, letterSpacing: 2, color: C.goldDim, marginBottom: 6 }}>LINKS PARA REDES SOCIALES</div>
                        {[
                          { label: 'Instagram', utm: 'instagram', icon: '📸' },
                          { label: 'TikTok',    utm: 'tiktok',    icon: '🎵' },
                          { label: 'Facebook',  utm: 'facebook',  icon: '👥' },
                          { label: 'YouTube',   utm: 'youtube',   icon: '▶️' },
                          { label: 'Google',    utm: 'google',    icon: '🔍' },
                        ].map((red) => (
                          <div key={red.utm} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 11 }}>{red.icon}</span>
                            <span style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              ?utm_source={red.utm}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Barras por aliado */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 20px 16px' }}>
                <div style={{ fontFamily: 'Cinzel,serif', fontSize: 10, letterSpacing: 3, color: C.gold, marginBottom: 16 }}>📍 RENDIMIENTO POR ALIADO</div>
                {metricas.porAliado.length === 0 ? (
                  <div style={{ color: C.muted, fontSize: 11, textAlign: 'center', padding: '20px 0' }}>Sin aliados activos</div>
                ) : (() => {
                  const max = Math.max(...metricas.porAliado.map(a => Number(a.registros || 0)), 1);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {metricas.porAliado.map((a, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 9, fontFamily: 'Cinzel,serif', letterSpacing: 1, color: a.activo ? '#4ade80' : C.muted }}>
                                {a.activo ? '●' : '○'}
                              </span>
                              <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{a.nombre}</span>
                              <span style={{ fontSize: 9, color: C.muted, fontFamily: 'monospace' }}>/{a.slug}</span>
                            </div>
                            <span style={{ fontSize: 11, color: C.gold, fontWeight: 700 }}>{a.registros || 0} reg</span>
                          </div>
                          <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden', marginBottom: 5 }}>
                            <div style={{ height: '100%', width: `${(Number(a.registros || 0) / max) * 100}%`, background: `linear-gradient(90deg,#CC44FF,${C.gold})`, borderRadius: 6 }} />
                          </div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'Cinzel,serif' }}>{a.scan_count || 0} scans</span>
                            <span style={{ fontSize: 9, color: (a.conversion_pct || 0) >= 30 ? '#4ade80' : (a.conversion_pct || 0) >= 10 ? C.gold : '#f87171', fontFamily: 'Cinzel,serif' }}>{a.conversion_pct || 0}% conv</span>
                            <span style={{ fontSize: 9, color: '#f0c040', fontFamily: 'Cinzel,serif' }}>{a.ganadores || 0} 👑</span>
                            <span style={{ fontSize: 9, color: '#60a5fa', fontFamily: 'Cinzel,serif' }}>{a.cupones_aceptados || 0} cupones</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* ── Embudo global ── */}
            {(() => {
              const t = metricas.porAliado.reduce((acc, a) => ({
                scans: acc.scans + (a.scan_count || 0),
                registros: acc.registros + Number(a.registros || 0),
                ganadores: acc.ganadores + Number(a.ganadores || 0),
                vistos: acc.vistos + Number(a.cupones_vistos || 0),
                aceptados: acc.aceptados + Number(a.cupones_aceptados || 0),
                entregados: acc.entregados + Number(a.premios_entregados || 0),
              }), { scans: 0, registros: 0, ganadores: 0, vistos: 0, aceptados: 0, entregados: 0 });
              const totalReg = metricas.registros.length || 0;
              const pasos = [
                { label: 'SCANS QR', val: t.scans, color: '#CC44FF' },
                { label: 'REGISTROS TOTALES', val: totalReg, color: C.gold },
                { label: 'GANADORES', val: t.ganadores, color: '#f0c040' },
                { label: 'VIERON PREMIO', val: t.vistos, color: '#60a5fa' },
                { label: 'ACEPTARON CUPÓN', val: t.aceptados, color: '#4ade80' },
                { label: 'PREMIO ENTREGADO', val: t.entregados, color: '#86efac' },
              ];
              const maxVal = Math.max(...pasos.map(p => p.val), 1);
              return (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px' }}>
                  <div style={{ fontFamily: 'Cinzel,serif', fontSize: 10, letterSpacing: 3, color: C.gold, marginBottom: 20 }}>⚔️ EMBUDO COMPLETO</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px 32px' }}>
                    {pasos.map((p, i) => (
                      <div key={i} style={{ marginBottom: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 9, fontFamily: 'Cinzel,serif', letterSpacing: 2, color: C.muted }}>{p.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{p.val}</span>
                        </div>
                        <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(p.val / maxVal) * 100}%`, background: p.color, borderRadius: 4, opacity: 0.85 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ── Últimos 50 registros ── */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, fontFamily: 'Cinzel,serif', fontSize: 10, letterSpacing: 3, color: C.gold }}>
                🧾 ÚLTIMOS 50 REGISTROS
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['FECHA','NOMBRE','EMAIL','CANAL','ESTADO'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', fontFamily: 'Cinzel,serif', fontSize: 8, letterSpacing: 2, color: C.goldDim, textAlign: 'left', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metricas.registros.slice(0, 50).map((r, i) => {
                      const canal = r.aliado_origen_slug
                        ? `📡 ${r.aliado_origen_slug}`
                        : r.utm_source
                          ? `🌐 ${r.utm_source}`
                          : '· directo';
                      const canalColor = r.aliado_origen_slug ? C.gold : r.utm_source ? '#CC44FF' : C.muted;
                      return (
                        <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                          <td style={{ padding: '10px 16px', color: C.muted, fontSize: 11, whiteSpace: 'nowrap' }}>
                            {new Date(r.registered_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                          </td>
                          <td style={{ padding: '10px 16px', color: C.text, fontSize: 12 }}>{r.nombre}</td>
                          <td style={{ padding: '10px 16px', color: C.muted, fontSize: 11 }}>{r.email}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ fontSize: 10, fontFamily: 'Cinzel,serif', letterSpacing: 1, color: canalColor }}>{canal}</span>
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ fontSize: 9, fontFamily: 'Cinzel,serif', letterSpacing: 1, color: r.es_ganador ? '#f0c040' : C.muted }}>
                              {r.es_ganador ? '👑 GANADOR' : '· participante'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </>) : null}
        </div>
      )}

      {/* ══ TAB: ALIADOS ══ */}
      {tabActiva === 'aliados' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Formulario nuevo aliado */}
          <div style={{ background: C.card, border: `1.5px solid ${C.borderHi}`, borderRadius: 16, padding: 'clamp(20px,4vw,28px)', animation: 'fadeIn .4s ease both' }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 14, letterSpacing: 2, color: C.gold, margin: '0 0 20px' }}>
              + NUEVO ALIADO
            </h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 2, minWidth: 180 }}>
                <label style={{ display: 'block', fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 2, color: C.goldDim, marginBottom: 6 }}>NOMBRE DEL NEGOCIO</label>
                <input
                  type="text"
                  value={formAliado.nombre}
                  onChange={e => setFormAliado(f => ({ ...f, nombre: e.target.value, slug: slugify(e.target.value) }))}
                  placeholder="Ej: FuerZa Box Gym"
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: 'Cinzel, serif', fontSize: 12 }}
                />
              </div>
              <div style={{ minWidth: 140 }}>
                <label style={{ display: 'block', fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 2, color: C.goldDim, marginBottom: 6 }}>SLUG (URL del QR)</label>
                <input
                  type="text"
                  value={formAliado.slug}
                  onChange={e => setFormAliado(f => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="fuerzabox"
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, color: C.gold, fontFamily: 'monospace', fontSize: 12 }}
                />
              </div>
              
              <button
                onClick={crearAliado}
                disabled={creandoAliado}
                style={{ padding: '11px 24px', background: `linear-gradient(135deg,${C.gold},#9a7a00)`, border: 'none', borderRadius: 8, color: '#0a0614', fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: 2, fontWeight: 900, cursor: creandoAliado ? 'not-allowed' : 'pointer', opacity: creandoAliado ? 0.6 : 1, whiteSpace: 'nowrap' }}
              >
                {creandoAliado ? 'CREANDO...' : '⚔️ CREAR'}
              </button>
            </div>
            {errAliado && <p style={{ color: C.red, fontFamily: 'Cinzel, serif', fontSize: 10, marginTop: 10, letterSpacing: 1 }}>⚠ {errAliado}</p>}
            {formAliado.slug && (
              <p style={{ fontFamily: 'monospace', fontSize: 10, color: C.goldDim, marginTop: 10 }}>
                🔗 QR apuntará a: <span style={{ color: C.gold }}>{SUPABASE_URL}/functions/v1/r/{formAliado.slug}</span>
              </p>
            )}
          </div>

          {/* Selector de evento global */}
          <div style={{ background: C.card, border: `1px solid ${C.borderHi}`, borderRadius: 14, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 3, color: C.goldDim, marginBottom: 6 }}>
                🌐 SORTEO ACTIVO GLOBAL — todos los QR apuntan aquí
              </div>
              <select
                value={eventoGlobal}
                onChange={e => guardarEventoGlobal(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#07040f', border: `1px solid ${C.borderHi}`, borderRadius: 8, color: C.gold, fontFamily: 'Cinzel, serif', fontSize: 11, fontWeight: 700 }}
              >
                <option value="">— Sin evento activo —</option>
                {eventosActivos.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.nombre}</option>
                ))}
              </select>
            </div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: guardandoGlobal ? C.goldDim : C.green, letterSpacing: 2, minWidth: 80, textAlign: 'right' }}>
              {guardandoGlobal ? '⏳ GUARDANDO...' : eventoGlobal ? '✓ ACTIVO' : '⚠ SIN EVENTO'}
            </div>
          </div>

          {/* Lista de aliados */}
          {loadingAliados ? (
            <p style={{ color: C.goldDim, fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 3, textAlign: 'center', animation: 'pulse 1.5s ease-in-out infinite' }}>
              CARGANDO ALIADOS...
            </p>
          ) : aliados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: 12, letterSpacing: 2 }}>SIN ALIADOS AÚN</p>
              <p style={{ fontSize: 13, marginTop: 8, fontStyle: 'italic' }}>Crea el primero arriba para generar su QR permanente.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {aliados.map(aliado => {
                const qrUrl = `${SUPABASE_URL}/functions/v1/r/${aliado.slug}`;
                
                return (
                  <div key={aliado.id} style={{ background: C.card, border: `1px solid ${aliado.activo ? C.borderHi : C.border}`, borderRadius: 14, padding: '18px 22px', animation: 'fadeIn .3s ease both', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>

                    {/* QR miniatura */}
                    <div style={{ flexShrink: 0 }}>
                      <QRCode url={qrUrl} size={80} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 900, fontSize: 14, color: C.gold }}>{aliado.nombre}</span>
                        <Badge activo={aliado.activo} />
                      </div>
                      <p style={{ fontFamily: 'monospace', fontSize: 10, color: C.goldDim, margin: '0 0 4px' }}>/{aliado.slug}</p>
                      <p style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: C.muted, margin: 0 }}>📊 {aliado.scan_count || 0} scans</p>
                    </div>

                    

                    {/* Botones */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button
                        onClick={() => copiarQRAliado(aliado.slug)}
                        style={{ padding: '7px 14px', background: copiadoAliado === aliado.slug ? 'rgba(68,255,136,0.12)' : 'rgba(212,175,55,0.08)', border: `1px solid ${copiadoAliado === aliado.slug ? 'rgba(68,255,136,0.4)' : C.border}`, borderRadius: 7, color: copiadoAliado === aliado.slug ? C.green : C.gold, fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1, cursor: 'pointer', transition: 'all .2s' }}
                      >
                        {copiadoAliado === aliado.slug ? '✓ COPIADO' : '🔗 COPIAR QR'}
                      </button>
                      <button
                        onClick={() => toggleAliado(aliado.id, aliado.activo)}
                        style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 7, color: C.muted, fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1, cursor: 'pointer' }}
                      >
                        {aliado.activo ? 'PAUSAR' : 'ACTIVAR'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}