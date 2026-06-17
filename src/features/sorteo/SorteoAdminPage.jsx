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
        sorteo_participantes(id, nombre, email, es_ganador, cupon_code)
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

  // ── Estadísticas de un evento ─────────────────────────────────────────────────
  const statsEvento = (eventoId) => {
    const rs = rondas[eventoId] || [];
    const completadas = rs.filter(r => r.estado === 'completado');
    const totalGanadores = completadas.reduce((s, r) => s + (r.sorteo_participantes?.length || 0), 0);
    const totalBecas = completadas.reduce((s, r) => s + (r.sorteo_participantes?.filter(p => p.es_ganador).length || 0), 0);
    const rondaActiva = rs.find(r => r.estado === 'abierto');
    return { completadas: completadas.length, totalGanadores, totalBecas, rondaActiva };
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
      </div>

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
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: C.gold, letterSpacing: 1 }}>
                            👑 {stats.totalBecas} becas
                          </span>
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: C.muted, letterSpacing: 1 }}>
                            ⚔️ {stats.totalGanadores} total
                          </span>
                          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: C.muted, letterSpacing: 1 }}>
                            {stats.completadas} rondas completadas
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
    </div>
  );
}