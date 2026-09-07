/**
 * PromptsBibliotecaColaborador.jsx — Templo del Propósito
 * Ruta pública: /biblioteca-prompts
 * Página de SOLO LECTURA para colaboradores. Protegida con una contraseña
 * compartida (no requiere cuenta). Consume la Edge Function
 * `prompts-biblioteca-colaborador`, que valida la contraseña contra el
 * secret PROMPTS_BIBLIOTECA_PASSWORD y regresa los prompts activos.
 * Nada de esto toca la tabla prompts_biblioteca directo (esa solo la
 * puede leer/editar el admin, desde /admin/sorteos → pestaña Prompts).
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../services/supabase';

const C = {
  bg:      '#07040f',
  card:    '#0e0818',
  border:  'rgba(212,175,55,0.15)',
  borderHi:'rgba(212,175,55,0.4)',
  gold:    '#D4AF37',
  purple:  '#9b59ff',
  text:    '#f0eaff',
  muted:   'rgba(240,234,255,0.45)',
  green:   '#44ff88',
  red:     '#ff4466',
};

const SESION_KEY = 'pb_colaborador_acceso';

function copiarAlPortapapeles(texto) {
  navigator.clipboard?.writeText(texto).catch(() => {});
}

// ── Pantalla de candado ────────────────────────────────────────────────────────
function PantallaAcceso({ onDesbloquear }) {
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');

  async function entrar(e) {
    e.preventDefault();
    if (!password.trim()) return;
    setCargando(true);
    setError('');
    const { data, error: err } = await supabase.functions.invoke('prompts-biblioteca-colaborador', {
      body: { password: password.trim() },
    });
    setCargando(false);
    if (err || data?.error) {
      setError(data?.error || 'Contraseña incorrecta.');
      return;
    }
    sessionStorage.setItem(SESION_KEY, password.trim());
    onDesbloquear(data.prompts || []);
  }

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form
        onSubmit={entrar}
        style={{
          background: C.card, border: `1.5px solid ${C.borderHi}`, borderRadius: 20,
          padding: '36px 28px', maxWidth: 360, width: '100%', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 10 }}>📜🔒</div>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 15, color: C.gold, letterSpacing: 2, marginBottom: 6 }}>
          BIBLIOTECA DE PROMPTS
        </div>
        <p style={{ color: C.muted, fontSize: 11.5, marginBottom: 22, lineHeight: 1.5 }}>
          Ingresa la contraseña que te compartió tu equipo para ver los prompts.
        </p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Contraseña"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '12px 14px',
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
            borderRadius: 10, color: C.text, fontSize: 14, textAlign: 'center',
            marginBottom: 14, letterSpacing: 2,
          }}
        />
        {error && (
          <div style={{ color: C.red, fontSize: 11.5, marginBottom: 14 }}>{error}</div>
        )}
        <button
          type="submit"
          disabled={cargando || !password.trim()}
          style={{
            width: '100%', padding: '12px 16px',
            background: cargando ? 'rgba(212,175,55,0.3)' : `linear-gradient(135deg,${C.gold},#9a7a00)`,
            border: 'none', borderRadius: 10, color: '#0a0614',
            fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: 2, fontWeight: 900,
            cursor: cargando ? 'default' : 'pointer',
            opacity: !password.trim() ? 0.6 : 1,
          }}
        >{cargando ? 'ENTRANDO…' : '🗝️ ENTRAR'}</button>
      </form>
    </div>
  );
}

// ── Tarjeta de prompt (solo lectura) ──────────────────────────────────────────
function PromptCardLectura({ prompt, onCopiar, copiado }) {
  const [expandido, setExpandido] = useState(false);
  const esLargo = prompt.contenido.length > 220;
  const textoMostrado = expandido || !esLargo ? prompt.contenido : prompt.contenido.slice(0, 220) + '…';

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: '18px 18px 14px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 8.5, letterSpacing: 1.5, color: C.purple, marginBottom: 4, textTransform: 'uppercase' }}>
          {prompt.categoria}
        </div>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 13, color: C.gold, lineHeight: 1.3 }}>
          {prompt.titulo}
        </div>
      </div>

      <p style={{
        fontSize: 12.5, lineHeight: 1.55, color: C.text, whiteSpace: 'pre-wrap', margin: 0,
        background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px',
      }}>
        {textoMostrado}
      </p>

      {esLargo && (
        <button
          onClick={() => setExpandido(v => !v)}
          style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: C.muted, fontSize: 10, cursor: 'pointer', padding: 0, fontFamily: 'Cinzel, serif', letterSpacing: 1 }}
        >{expandido ? '▲ VER MENOS' : '▼ VER COMPLETO'}</button>
      )}

      {prompt.notas && (
        <div style={{ fontSize: 10.5, color: C.muted, fontStyle: 'italic', lineHeight: 1.4 }}>💡 {prompt.notas}</div>
      )}

      <button
        onClick={() => onCopiar(prompt)}
        style={{
          padding: '10px 14px', marginTop: 4,
          background: copiado ? 'rgba(68,255,136,0.14)' : 'rgba(212,175,55,0.1)',
          border: `1px solid ${copiado ? 'rgba(68,255,136,0.4)' : C.border}`,
          borderRadius: 8, color: copiado ? C.green : C.gold,
          fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 1.5, fontWeight: 900, cursor: 'pointer',
        }}
      >{copiado ? '✓ COPIADO' : '📋 COPIAR PROMPT'}</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function PromptsBibliotecaColaborador() {
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [prompts, setPrompts]           = useState([]);
  const [busqueda, setBusqueda]         = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [copiadoId, setCopiadoId]       = useState('');
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  // Si ya entró antes en esta pestaña, no le volvemos a pedir contraseña
  useEffect(() => {
    const guardada = sessionStorage.getItem(SESION_KEY);
    if (!guardada) { setVerificandoSesion(false); return; }
    supabase.functions.invoke('prompts-biblioteca-colaborador', { body: { password: guardada } })
      .then(({ data, error }) => {
        if (!error && !data?.error) {
          setPrompts(data.prompts || []);
          setDesbloqueado(true);
        } else {
          sessionStorage.removeItem(SESION_KEY);
        }
        setVerificandoSesion(false);
      });
  }, []);

  const categorias = useMemo(() => [...new Set(prompts.map(p => p.categoria))].sort(), [prompts]);

  const promptsFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return prompts.filter(p => {
      if (filtroCategoria !== 'todas' && p.categoria !== filtroCategoria) return false;
      if (!q) return true;
      return (
        p.titulo.toLowerCase().includes(q) ||
        p.contenido.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        (p.notas || '').toLowerCase().includes(q)
      );
    });
  }, [prompts, busqueda, filtroCategoria]);

  function copiar(prompt) {
    copiarAlPortapapeles(prompt.contenido);
    setCopiadoId(prompt.id);
    setTimeout(() => setCopiadoId(''), 1400);
  }

  if (verificandoSesion) {
    return <div style={{ minHeight: '100dvh', background: C.bg }} />;
  }

  if (!desbloqueado) {
    return <PantallaAcceso onDesbloquear={(data) => { setPrompts(data); setDesbloqueado(true); }} />;
  }

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, padding: '28px 16px 60px' }}>
      <style>{`
        .pbc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 16px; max-width: 1100px; margin: 0 auto; }
        .pbc-chips { display: flex; gap: 8px; flex-wrap: wrap; max-width: 1100px; margin: 0 auto 20px; }
        .pbc-wrap { max-width: 1100px; margin: 0 auto; }
      `}</style>

      <div className="pbc-wrap" style={{ marginBottom: 22, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 18, color: C.gold, letterSpacing: 2 }}>
          📜 BIBLIOTECA DE PROMPTS
        </div>
        <p style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>
          Busca el prompt que necesitas y cópialo. Se actualiza sola, no necesitas hacer nada más.
        </p>
      </div>

      <div className="pbc-wrap" style={{ marginBottom: 18 }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar por título, contenido o categoría…"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '12px 14px',
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
            borderRadius: 10, color: C.text, fontSize: 13,
          }}
        />
      </div>

      <div className="pbc-chips">
        <button onClick={() => setFiltroCategoria('todas')} style={chipStyle(filtroCategoria === 'todas')}>
          TODAS ({prompts.length})
        </button>
        {categorias.map(cat => (
          <button key={cat} onClick={() => setFiltroCategoria(cat)} style={chipStyle(filtroCategoria === cat)}>
            {cat} ({prompts.filter(p => p.categoria === cat).length})
          </button>
        ))}
      </div>

      {promptsFiltrados.length === 0 ? (
        <div className="pbc-wrap" style={{ textAlign: 'center', padding: '40px 20px', color: C.muted }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>📭</div>
          <p style={{ fontSize: 12.5 }}>No hay prompts que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <div className="pbc-grid">
          {promptsFiltrados.map(p => (
            <PromptCardLectura key={p.id} prompt={p} onCopiar={copiar} copiado={copiadoId === p.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function chipStyle(activo) {
  return {
    padding: '7px 14px',
    background: activo ? `linear-gradient(135deg,${C.purple},#4a1a8a)` : 'rgba(255,255,255,0.04)',
    border: `1px solid ${activo ? C.purple : C.border}`,
    borderRadius: 20, cursor: 'pointer',
    color: activo ? '#fff' : C.muted,
    fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1, fontWeight: 900,
    whiteSpace: 'nowrap',
  };
}