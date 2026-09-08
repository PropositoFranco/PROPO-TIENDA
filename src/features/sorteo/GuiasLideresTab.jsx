/**
 * GuiasLideresTab.jsx — Templo del Propósito
 * Tab dentro de SorteoAdminPage: /admin/sorteos → pestaña 🗺️ GUÍAS LÍDERES
 * CRUD completo de la Biblioteca de Guías para Líderes (tabla: guias_lideres)
 * Solo visible/editable para admin (RLS: is_admin_user()).
 *
 * A diferencia de PromptsBibliotecaTab, aquí NO hay panel de "invitar
 * colaborador por correo" ni contraseña compartida: el control de quién
 * puede VER esta biblioteca ya existe — es el mismo login de /lider con
 * codigo_acceso. Si se desactiva a un aliado (columna `activo` en
 * `aliados`), se queda fuera de TODO /lider, incluida esta sección,
 * con un solo switch. No se duplica ningún sistema de acceso nuevo.
 *
 * Espejo estructural de PromptsBibliotecaTab.jsx — mismo estilo, mismos
 * nombres de función, solo cambia la tabla y las etiquetas.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
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

function copiarAlPortapapeles(texto) {
  navigator.clipboard?.writeText(texto).catch(() => {});
}

const FORM_VACIO = { id: null, categoria: '', titulo: '', contenido: '', notas: '', orden: 0, activo: true };

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', marginBottom: 10,
  background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
  borderRadius: 8, color: C.text, fontSize: 13,
};

// ── Tarjeta de guía (con editar/borrar, modo admin) ───────────────────────────
function GuiaCard({ guia, onEditar, onEliminar, onCopiar, copiado }) {
  const [expandido, setExpandido] = useState(false);
  const esLargo = guia.contenido.length > 220;
  const textoMostrado = expandido || !esLargo ? guia.contenido : guia.contenido.slice(0, 220) + '…';

  return (
    <div
      className="gl-card"
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: '18px 18px 14px', display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'transform .15s ease, border-color .15s ease',
      }}
    >
      <div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 8.5, letterSpacing: 1.5, color: C.purple, marginBottom: 4, textTransform: 'uppercase' }}>
          {guia.categoria}
        </div>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 13, color: C.gold, lineHeight: 1.3 }}>
          {guia.titulo}
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

      {guia.notas && (
        <div style={{ fontSize: 10.5, color: C.muted, fontStyle: 'italic', lineHeight: 1.4 }}>💡 {guia.notas}</div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
        <button
          onClick={() => onCopiar(guia)}
          style={{
            padding: '9px 14px', flex: '1 1 auto',
            background: copiado ? 'rgba(68,255,136,0.14)' : 'rgba(212,175,55,0.1)',
            border: `1px solid ${copiado ? 'rgba(68,255,136,0.4)' : C.border}`,
            borderRadius: 8, color: copiado ? C.green : C.gold,
            fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 1.5, fontWeight: 900, cursor: 'pointer',
          }}
        >{copiado ? '✓ COPIADO' : '📋 COPIAR'}</button>
        <button
          onClick={() => onEditar(guia)}
          style={{
            padding: '9px 14px', background: 'rgba(155,89,255,0.1)', border: '1px solid rgba(155,89,255,0.3)',
            borderRadius: 8, color: C.purple, fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 1.5,
            fontWeight: 900, cursor: 'pointer',
          }}
        >✏️ EDITAR</button>
        <button
          onClick={() => onEliminar(guia)}
          style={{
            padding: '9px 14px', background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.25)',
            borderRadius: 8, color: C.red, fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 1.5,
            fontWeight: 900, cursor: 'pointer',
          }}
        >🗑️</button>
      </div>
    </div>
  );
}

// ── Modal crear/editar ─────────────────────────────────────────────────────────
function ModalGuia({ form, setForm, categorias, onGuardar, onCerrar, guardando, error }) {
  return (
    <div
      onClick={onCerrar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(4,2,14,0.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: C.card, border: `1.5px solid ${C.borderHi}`, borderRadius: 16, padding: '26px 22px', maxWidth: 480, width: '100%' }}
      >
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 14, color: C.gold, letterSpacing: 1.5, marginBottom: 16 }}>
          {form.id ? '✏️ EDITAR GUÍA' : '➕ NUEVA GUÍA'}
        </div>

        <label style={{ fontSize: 10.5, color: C.muted, fontFamily: 'Cinzel, serif', letterSpacing: 1 }}>CATEGORÍA</label>
        <input list="gl-categorias" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} style={inputStyle} placeholder="Ej. Accesos, Redes sociales, WhatsApp…" />
        <datalist id="gl-categorias">{categorias.map(c => <option key={c} value={c} />)}</datalist>

        <label style={{ fontSize: 10.5, color: C.muted, fontFamily: 'Cinzel, serif', letterSpacing: 1 }}>TÍTULO</label>
        <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={inputStyle} placeholder="Ej. Cómo entrar al grupo de WhatsApp" />

        <label style={{ fontSize: 10.5, color: C.muted, fontFamily: 'Cinzel, serif', letterSpacing: 1 }}>CONTENIDO / PASOS / LINK</label>
        <textarea value={form.contenido} onChange={e => setForm({ ...form, contenido: e.target.value })} rows={6} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Escribe el paso a paso, el copy o el link tal cual lo va a copiar el líder…" />

        <label style={{ fontSize: 10.5, color: C.muted, fontFamily: 'Cinzel, serif', letterSpacing: 1 }}>NOTA (opcional, solo para orientar)</label>
        <input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} style={inputStyle} placeholder="Ej. Úsalo la primera vez que entra un líder nuevo." />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} id="gl-activo" />
          <label htmlFor="gl-activo" style={{ fontSize: 11.5, color: C.text }}>Visible para los líderes</label>
        </div>

        {error && <div style={{ padding: '9px 12px', background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.3)', borderRadius: 8, color: C.red, fontSize: 11.5, marginBottom: 14 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCerrar} style={{ padding: '9px 16px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontFamily: 'Cinzel, serif', fontSize: 9.5, letterSpacing: 1, cursor: 'pointer' }}>CANCELAR</button>
          <button
            onClick={onGuardar}
            disabled={guardando || !form.titulo.trim() || !form.categoria.trim()}
            style={{
              padding: '9px 18px', background: guardando ? 'rgba(212,175,55,0.3)' : `linear-gradient(135deg,${C.gold},#9a7a00)`,
              border: 'none', borderRadius: 8, color: '#0a0614', fontFamily: 'Cinzel, serif', fontSize: 9.5,
              letterSpacing: 1, fontWeight: 900, cursor: guardando ? 'default' : 'pointer',
            }}
          >{guardando ? 'GUARDANDO…' : (form.id ? 'GUARDAR CAMBIOS' : 'CREAR GUÍA')}</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function GuiasLideresTab() {
  const [guias, setGuias]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [busqueda, setBusqueda]     = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [copiadoId, setCopiadoId]   = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm]             = useState(FORM_VACIO);
  const [guardando, setGuardando]   = useState(false);
  const [errorForm, setErrorForm]   = useState('');
  const [confirmarBorrar, setConfirmarBorrar] = useState(null);

  const cargarGuias = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('guias_lideres')
      .select('*')
      .order('orden', { ascending: true })
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setGuias(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargarGuias(); }, [cargarGuias]);

  const categorias = useMemo(() => [...new Set(guias.map(g => g.categoria))].sort(), [guias]);

  const guiasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return guias.filter(g => {
      if (filtroCategoria !== 'todas' && g.categoria !== filtroCategoria) return false;
      if (!q) return true;
      return (
        g.titulo.toLowerCase().includes(q) ||
        g.contenido.toLowerCase().includes(q) ||
        g.categoria.toLowerCase().includes(q) ||
        (g.notas || '').toLowerCase().includes(q)
      );
    });
  }, [guias, busqueda, filtroCategoria]);

  function abrirNuevo() { setForm(FORM_VACIO); setErrorForm(''); setModalAbierto(true); }
  function abrirEditar(guia) { setForm({ ...guia }); setErrorForm(''); setModalAbierto(true); }

  async function guardar() {
    setGuardando(true);
    setErrorForm('');
    const payload = {
      categoria: form.categoria.trim(),
      titulo: form.titulo.trim(),
      contenido: form.contenido,
      notas: form.notas?.trim() || null,
      orden: form.orden || 0,
      activo: form.activo,
    };
    let err;
    if (form.id) {
      ({ error: err } = await supabase.from('guias_lideres').update(payload).eq('id', form.id));
    } else {
      ({ error: err } = await supabase.from('guias_lideres').insert(payload));
    }
    setGuardando(false);
    if (err) { setErrorForm(err.message); return; }
    setModalAbierto(false);
    cargarGuias();
  }

  async function eliminar(guia) {
    const { error: err } = await supabase.from('guias_lideres').delete().eq('id', guia.id);
    setConfirmarBorrar(null);
    if (err) { setError(err.message); return; }
    cargarGuias();
  }

  function copiar(guia) {
    copiarAlPortapapeles(guia.contenido);
    setCopiadoId(guia.id);
    setTimeout(() => setCopiadoId(''), 1400);
  }

  return (
    <div style={{ animation: 'glFadeIn .3s ease both' }}>
      <style>{`
        @keyframes glFadeIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
        .gl-card:hover { transform: translateY(-2px); border-color: ${C.borderHi} !important; }
        .gl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 16px; }
        .gl-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        @media (max-width: 520px) {
          .gl-toolbar { flex-direction: column; align-items: stretch !important; }
          .gl-toolbar > * { width: 100% !important; }
        }
      `}</style>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 16, color: C.gold, letterSpacing: 2 }}>
          🗺️ GUÍAS PARA LÍDERES
        </div>
        <p style={{ color: C.muted, fontSize: 12, marginTop: 4, maxWidth: 620, lineHeight: 1.5 }}>
          Aquí armas todo lo que un líder necesita para operar: accesos, pasos, copys, links. Solo tú editas.
          Cada líder ve esta misma información de solo lectura dentro de su propia sesión en /lider — no necesitan
          otra contraseña ni otro login. Si desactivas a un líder (en la pestaña Aliados), se queda fuera de esto también.
        </p>
      </div>

      <div className="gl-toolbar" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar por título, contenido o categoría…"
          style={{ ...inputStyle, marginBottom: 0, flex: '1 1 260px', minWidth: 200 }}
        />
        <button
          onClick={abrirNuevo}
          style={{
            padding: '10px 20px', background: `linear-gradient(135deg,${C.gold},#9a7a00)`,
            border: 'none', borderRadius: 8, color: '#0a0614',
            fontFamily: 'Cinzel, serif', fontSize: 10.5, letterSpacing: 1.5, fontWeight: 900, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >➕ NUEVA GUÍA</button>
      </div>

      <div className="gl-chips" style={{ marginBottom: 20 }}>
        <button onClick={() => setFiltroCategoria('todas')} style={chipStyle(filtroCategoria === 'todas')}>
          TODAS ({guias.length})
        </button>
        {categorias.map(cat => (
          <button key={cat} onClick={() => setFiltroCategoria(cat)} style={chipStyle(filtroCategoria === cat)}>
            {cat} ({guias.filter(g => g.categoria === cat).length})
          </button>
        ))}
      </div>

      {loading && <p style={{ color: C.muted, fontSize: 12 }}>Cargando guías…</p>}
      {error && (
        <div style={{ padding: '12px 14px', background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.3)', borderRadius: 8, color: C.red, fontSize: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}
      {!loading && !error && guiasFiltradas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: C.muted }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>📭</div>
          <p style={{ fontSize: 12.5 }}>
            {guias.length === 0 ? 'Todavía no hay guías guardadas.' : 'No hay guías que coincidan con tu búsqueda.'}
          </p>
        </div>
      )}

      {!loading && guiasFiltradas.length > 0 && (
        <div className="gl-grid">
          {guiasFiltradas.map(g => (
            <GuiaCard
              key={g.id}
              guia={g}
              onEditar={abrirEditar}
              onEliminar={setConfirmarBorrar}
              onCopiar={copiar}
              copiado={copiadoId === g.id}
            />
          ))}
        </div>
      )}

      {modalAbierto && (
        <ModalGuia
          form={form}
          setForm={setForm}
          categorias={categorias}
          onGuardar={guardar}
          onCerrar={() => setModalAbierto(false)}
          guardando={guardando}
          error={errorForm}
        />
      )}

      {confirmarBorrar && (
        <div
          onClick={() => setConfirmarBorrar(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(4,2,14,0.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: C.card, border: `1.5px solid rgba(255,68,102,0.4)`, borderRadius: 16, padding: '26px 22px', maxWidth: 360, width: '100%', textAlign: 'center' }}
          >
            <div style={{ fontSize: 26, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 13, color: C.red, letterSpacing: 1.5, marginBottom: 8 }}>
              ¿BORRAR ESTA GUÍA?
            </div>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 18 }}>
              "{confirmarBorrar.titulo}" se va a borrar para siempre. Esto no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmarBorrar(null)}
                style={{ padding: '9px 16px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontFamily: 'Cinzel, serif', fontSize: 9.5, letterSpacing: 1, cursor: 'pointer' }}
              >CANCELAR</button>
              <button
                onClick={() => eliminar(confirmarBorrar)}
                style={{ padding: '9px 16px', background: 'rgba(255,68,102,0.15)', border: '1px solid rgba(255,68,102,0.4)', borderRadius: 8, color: C.red, fontFamily: 'Cinzel, serif', fontSize: 9.5, letterSpacing: 1, fontWeight: 900, cursor: 'pointer' }}
              >SÍ, BORRAR</button>
            </div>
          </div>
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