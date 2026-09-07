/**
 * PromptsBibliotecaTab.jsx — Templo del Propósito
 * Tab dentro de SorteoAdminPage: /admin/sorteos → pestaña 📜 PROMPTS
 * CRUD completo de la Biblioteca de Prompts (tabla: prompts_biblioteca)
 * Solo visible/editable para admin (RLS: is_admin_user()).
 * Los colaboradores consumen esta misma tabla de solo-lectura vía
 * la Edge Function `prompts-biblioteca-colaborador` (contraseña compartida).
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

// ── Panel de colaboradores con acceso (otorgar_acceso_prompts / listar_accesos_prompts / revocar_acceso_prompts) ──
function ColaboradoresPrompts() {
  const [accesos, setAccesos]         = useState([]);
  const [loadingAcc, setLoadingAcc]   = useState(true);
  const [errorAcc, setErrorAcc]       = useState('');
  const [email, setEmail]             = useState('');
  const [invitando, setInvitando]     = useState(false);
  const [errorInvitar, setErrorInvitar] = useState('');
  const [okInvitar, setOkInvitar]     = useState('');
  const [revocando, setRevocando]     = useState(null); // user_id en curso
  const [confirmarRevocar, setConfirmarRevocar] = useState(null); // acceso a revocar

  const cargarAccesos = useCallback(async () => {
    setLoadingAcc(true);
    setErrorAcc('');
    const { data, error: err } = await supabase.rpc('listar_accesos_prompts');
    if (err) setErrorAcc(err.message);
    else setAccesos(data || []);
    setLoadingAcc(false);
  }, []);

  useEffect(() => { cargarAccesos(); }, [cargarAccesos]);

  async function invitar(e) {
    e.preventDefault();
    const correo = email.trim();
    if (!correo) return;
    setInvitando(true);
    setErrorInvitar('');
    setOkInvitar('');
    const { data, error: err } = await supabase.rpc('otorgar_acceso_prompts', { p_email: correo });
    setInvitando(false);
    if (err) { setErrorInvitar(err.message); return; }
    if (data?.ok === false) {
      setErrorInvitar(data.error === 'sin_cuenta'
        ? 'Ese correo todavía no tiene cuenta creada en la plataforma. Debe registrarse primero.'
        : 'No se pudo otorgar el acceso.');
      return;
    }
    setOkInvitar(`✓ Acceso otorgado a ${data.email}`);
    setEmail('');
    cargarAccesos();
    setTimeout(() => setOkInvitar(''), 3000);
  }

  async function revocar(acceso) {
    setRevocando(acceso.user_id);
    const { error: err } = await supabase.rpc('revocar_acceso_prompts', { p_user_id: acceso.user_id });
    setRevocando(null);
    setConfirmarRevocar(null);
    if (err) { setErrorAcc(err.message); return; }
    cargarAccesos();
  }

  return (
    <div
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: '18px 18px 16px', marginBottom: 24,
      }}
    >
      <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 13, color: C.gold, letterSpacing: 1.5, marginBottom: 4 }}>
        🗝️ COLABORADORES CON ACCESO
      </div>
      <p style={{ color: C.muted, fontSize: 11.5, marginBottom: 14, lineHeight: 1.5, maxWidth: 560 }}>
        Invita por correo a alguien que ya tenga cuenta en la plataforma. Va a poder entrar directo a
        /admin/prompts y administrar esta biblioteca — nada más, sin ver sorteos, aliados ni el resto del panel.
      </p>

      <form onSubmit={invitar} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: errorInvitar || okInvitar ? 10 : 16 }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          style={{ ...inputStyle, marginBottom: 0, flex: '1 1 220px', minWidth: 180 }}
        />
        <button
          type="submit"
          disabled={invitando || !email.trim()}
          style={{
            padding: '10px 20px',
            background: invitando ? 'rgba(212,175,55,0.3)' : `linear-gradient(135deg,${C.gold},#9a7a00)`,
            border: 'none', borderRadius: 8, color: '#0a0614',
            fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 1.5, fontWeight: 900,
            cursor: invitando ? 'default' : 'pointer',
            opacity: !email.trim() ? 0.6 : 1, whiteSpace: 'nowrap',
          }}
        >{invitando ? 'INVITANDO…' : '✉️ INVITAR COLABORADOR'}</button>
      </form>

      {errorInvitar && (
        <div style={{ padding: '9px 12px', background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.3)', borderRadius: 8, color: C.red, fontSize: 11.5, marginBottom: 14 }}>
          {errorInvitar}
        </div>
      )}
      {okInvitar && (
        <div style={{ padding: '9px 12px', background: 'rgba(68,255,136,0.08)', border: '1px solid rgba(68,255,136,0.3)', borderRadius: 8, color: C.green, fontSize: 11.5, marginBottom: 14 }}>
          {okInvitar}
        </div>
      )}

      {loadingAcc && <p style={{ color: C.muted, fontSize: 11.5 }}>Cargando accesos…</p>}
      {errorAcc && !loadingAcc && (
        <div style={{ padding: '9px 12px', background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.3)', borderRadius: 8, color: C.red, fontSize: 11.5 }}>
          {errorAcc}
        </div>
      )}
      {!loadingAcc && !errorAcc && accesos.length === 0 && (
        <p style={{ color: C.muted, fontSize: 11.5, fontStyle: 'italic' }}>Todavía no le has dado acceso a nadie más.</p>
      )}
      {!loadingAcc && accesos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {accesos.map(a => (
            <div
              key={a.user_id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                padding: '9px 12px', background: 'rgba(255,255,255,0.025)',
                border: `1px solid ${C.border}`, borderRadius: 8, flexWrap: 'wrap',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: C.text, fontWeight: 600, wordBreak: 'break-all' }}>{a.email}</div>
                {a.otorgado_at && (
                  <div style={{ fontSize: 9.5, color: C.muted, marginTop: 2 }}>
                    desde {new Date(a.otorgado_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
              <button
                onClick={() => setConfirmarRevocar(a)}
                disabled={revocando === a.user_id}
                style={{
                  padding: '7px 14px', background: 'rgba(255,68,102,0.08)',
                  border: '1px solid rgba(255,68,102,0.25)', borderRadius: 8, color: C.red,
                  fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1, fontWeight: 900,
                  cursor: revocando === a.user_id ? 'default' : 'pointer', whiteSpace: 'nowrap',
                }}
              >{revocando === a.user_id ? 'REVOCANDO…' : '🚫 REVOCAR'}</button>
            </div>
          ))}
        </div>
      )}

      {confirmarRevocar && (
        <div
          onClick={() => setConfirmarRevocar(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(4,2,14,0.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: C.card, border: `1.5px solid rgba(255,68,102,0.4)`, borderRadius: 16, padding: '26px 22px', maxWidth: 360, width: '100%', textAlign: 'center' }}
          >
            <div style={{ fontSize: 26, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 13, color: C.red, letterSpacing: 1.5, marginBottom: 8 }}>
              ¿REVOCAR ACCESO?
            </div>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 18 }}>
              "{confirmarRevocar.email}" dejará de poder entrar a /admin/prompts de inmediato.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmarRevocar(null)}
                style={{ padding: '9px 16px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontFamily: 'Cinzel, serif', fontSize: 9.5, letterSpacing: 1, cursor: 'pointer' }}
              >CANCELAR</button>
              <button
                onClick={() => revocar(confirmarRevocar)}
                style={{ padding: '9px 16px', background: 'rgba(255,68,102,0.15)', border: '1px solid rgba(255,68,102,0.4)', borderRadius: 8, color: C.red, fontFamily: 'Cinzel, serif', fontSize: 9.5, letterSpacing: 1, fontWeight: 900, cursor: 'pointer' }}
              >SÍ, REVOCAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tarjeta individual de prompt ──────────────────────────────────────────────
function PromptCard({ prompt, onEditar, onEliminar, onCopiar, copiado }) {
  const [expandido, setExpandido] = useState(false);
  const esLargo = prompt.contenido.length > 220;
  const textoMostrado = expandido || !esLargo ? prompt.contenido : prompt.contenido.slice(0, 220) + '…';

  return (
    <div
      className="pb-card"
      style={{
        background: C.card,
        border: `1px solid ${prompt.activo ? C.border : 'rgba(255,68,102,0.25)'}`,
        borderRadius: 14,
        padding: '18px 18px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        opacity: prompt.activo ? 1 : 0.55,
        transition: 'transform .18s ease, border-color .18s ease',
      }}
    >
      {!prompt.activo && (
        <span style={{
          position: 'absolute', top: 12, right: 12,
          fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 1.5,
          color: C.red, border: '1px solid rgba(255,68,102,0.35)',
          borderRadius: 20, padding: '2px 8px',
        }}>OCULTO</span>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: 'Cinzel, serif', fontSize: 8.5, letterSpacing: 1.5,
            color: C.purple, marginBottom: 4, textTransform: 'uppercase',
          }}>{prompt.categoria}</div>
          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 13, color: C.gold, lineHeight: 1.3 }}>
            {prompt.titulo}
          </div>
        </div>
      </div>

      <p style={{
        fontSize: 12.5, lineHeight: 1.55, color: C.text,
        whiteSpace: 'pre-wrap', margin: 0, background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px',
      }}>
        {textoMostrado}
      </p>

      {esLargo && (
        <button
          onClick={() => setExpandido(v => !v)}
          style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: C.muted, fontSize: 10, cursor: 'pointer', padding: 0, fontFamily: 'Cinzel, serif', letterSpacing: 1 }}
        >
          {expandido ? '▲ VER MENOS' : '▼ VER COMPLETO'}
        </button>
      )}

      {prompt.notas && (
        <div style={{ fontSize: 10.5, color: C.muted, fontStyle: 'italic', lineHeight: 1.4 }}>
          💡 {prompt.notas}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        <button
          onClick={() => onCopiar(prompt)}
          style={{
            flex: '1 1 auto', minWidth: 110, padding: '9px 14px',
            background: copiado ? 'rgba(68,255,136,0.14)' : 'rgba(212,175,55,0.1)',
            border: `1px solid ${copiado ? 'rgba(68,255,136,0.4)' : C.border}`,
            borderRadius: 8, color: copiado ? C.green : C.gold,
            fontFamily: 'Cinzel, serif', fontSize: 9.5, letterSpacing: 1.5, fontWeight: 900, cursor: 'pointer',
            transition: 'all .15s',
          }}
        >
          {copiado ? '✓ COPIADO' : '📋 COPIAR'}
        </button>
        <button
          onClick={() => onEditar(prompt)}
          style={{
            padding: '9px 14px', background: 'rgba(155,89,255,0.1)',
            border: '1px solid rgba(155,89,255,0.3)', borderRadius: 8, color: C.purple,
            fontFamily: 'Cinzel, serif', fontSize: 9.5, letterSpacing: 1.5, fontWeight: 900, cursor: 'pointer',
          }}
        >✏️ EDITAR</button>
        <button
          onClick={() => onEliminar(prompt)}
          style={{
            padding: '9px 14px', background: 'rgba(255,68,102,0.08)',
            border: '1px solid rgba(255,68,102,0.25)', borderRadius: 8, color: C.red,
            fontFamily: 'Cinzel, serif', fontSize: 9.5, letterSpacing: 1.5, fontWeight: 900, cursor: 'pointer',
          }}
        >🗑</button>
      </div>
    </div>
  );
}

// ── Modal de crear/editar ──────────────────────────────────────────────────────
function ModalPrompt({ form, setForm, categorias, onGuardar, onCerrar, guardando, error }) {
  return (
    <div
      onClick={onCerrar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(4,2,14,0.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: C.card, border: `1.5px solid ${C.borderHi}`, borderRadius: 18, padding: '28px 24px', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 15, color: C.gold, letterSpacing: 2, marginBottom: 18 }}>
          {form.id ? '✏️ EDITAR PROMPT' : '➕ NUEVO PROMPT'}
        </div>

        <label style={lblStyle}>Categoría</label>
        <input
          list="pb-categorias"
          value={form.categoria}
          onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
          placeholder="Ej: GitHub / Repos"
          style={inputStyle}
        />
        <datalist id="pb-categorias">
          {categorias.map(c => <option key={c} value={c} />)}
        </datalist>

        <label style={lblStyle}>Título corto</label>
        <input
          value={form.titulo}
          onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
          placeholder="Ej: Dónde ubicar un archivo nuevo"
          style={inputStyle}
        />

        <label style={lblStyle}>Contenido del prompt (esto es lo que se copia)</label>
        <textarea
          value={form.contenido}
          onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
          rows={7}
          placeholder="Escribe aquí el prompt completo, tal cual se debe copiar y pegar…"
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
        />

        <label style={lblStyle}>Notas de uso (opcional)</label>
        <input
          value={form.notas || ''}
          onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
          placeholder="Ej: úsalo solo cuando el archivo ya dio errores 2 veces"
          style={inputStyle}
        />

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 4 }}>
          <label style={{ ...lblStyle, marginTop: 0, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.activo}
              onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: C.gold }}
            />
            Visible para colaboradores
          </label>
          <div style={{ flex: 1 }} />
          <div>
            <label style={{ ...lblStyle, marginTop: 0 }}>Orden</label>
            <input
              type="number"
              value={form.orden}
              onChange={e => setForm(f => ({ ...f, orden: Number(e.target.value) }))}
              style={{ ...inputStyle, width: 70, marginBottom: 0 }}
            />
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.3)', borderRadius: 8, color: C.red, fontSize: 11.5 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button
            onClick={onCerrar}
            style={{ padding: '10px 18px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 1.5, cursor: 'pointer' }}
          >CANCELAR</button>
          <button
            onClick={onGuardar}
            disabled={guardando || !form.categoria.trim() || !form.titulo.trim() || !form.contenido.trim()}
            style={{
              padding: '10px 22px',
              background: guardando ? 'rgba(212,175,55,0.3)' : `linear-gradient(135deg,${C.gold},#9a7a00)`,
              border: 'none', borderRadius: 8, color: '#0a0614',
              fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 1.5, fontWeight: 900,
              cursor: guardando ? 'default' : 'pointer',
              opacity: (!form.categoria.trim() || !form.titulo.trim() || !form.contenido.trim()) ? 0.5 : 1,
            }}
          >{guardando ? 'GUARDANDO…' : '💾 GUARDAR'}</button>
        </div>
      </div>
    </div>
  );
}

const lblStyle = {
  display: 'block', fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1.5,
  color: C.muted, marginTop: 14, marginBottom: 6,
};
const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px',
  background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
  borderRadius: 8, color: C.text, fontSize: 12.5, marginBottom: 4,
};

// ══════════════════════════════════════════════════════════════════════════════
export default function PromptsBibliotecaTab() {
  const [prompts, setPrompts]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [busqueda, setBusqueda]   = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm]           = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [confirmarBorrar, setConfirmarBorrar] = useState(null); // prompt a borrar
  const [copiadoId, setCopiadoId] = useState('');

  const cargarPrompts = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('prompts_biblioteca')
      .select('*')
      .order('categoria', { ascending: true })
      .order('orden', { ascending: true });
    if (err) setError(err.message);
    else setPrompts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { cargarPrompts(); }, [cargarPrompts]);

  const categorias = useMemo(
    () => [...new Set(prompts.map(p => p.categoria))].sort(),
    [prompts]
  );

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

  function abrirNuevo() {
    const maxOrden = prompts.length ? Math.max(...prompts.map(p => p.orden || 0)) : 0;
    setForm({ ...FORM_VACIO, categoria: filtroCategoria !== 'todas' ? filtroCategoria : '', orden: maxOrden + 1 });
    setErrorForm('');
    setModalAbierto(true);
  }

  function abrirEditar(prompt) {
    setForm({ ...prompt });
    setErrorForm('');
    setModalAbierto(true);
  }

  async function guardar() {
    setGuardando(true);
    setErrorForm('');
    const payload = {
      categoria: form.categoria.trim(),
      titulo: form.titulo.trim(),
      contenido: form.contenido.trim(),
      notas: form.notas?.trim() || null,
      orden: form.orden || 0,
      activo: form.activo,
    };
    let err;
    if (form.id) {
      ({ error: err } = await supabase.from('prompts_biblioteca').update(payload).eq('id', form.id));
    } else {
      ({ error: err } = await supabase.from('prompts_biblioteca').insert(payload));
    }
    setGuardando(false);
    if (err) { setErrorForm(err.message); return; }
    setModalAbierto(false);
    cargarPrompts();
  }

  async function eliminar(prompt) {
    const { error: err } = await supabase.from('prompts_biblioteca').delete().eq('id', prompt.id);
    setConfirmarBorrar(null);
    if (err) { setError(err.message); return; }
    cargarPrompts();
  }

  function copiar(prompt) {
    copiarAlPortapapeles(prompt.contenido);
    setCopiadoId(prompt.id);
    setTimeout(() => setCopiadoId(''), 1400);
  }

  return (
    <div style={{ animation: 'pbFadeIn .3s ease both' }}>
      <style>{`
        @keyframes pbFadeIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
        .pb-card:hover { transform: translateY(-2px); border-color: ${C.borderHi} !important; }
        .pb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 16px; }
        .pb-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        @media (max-width: 520px) {
          .pb-toolbar { flex-direction: column; align-items: stretch !important; }
          .pb-toolbar > * { width: 100% !important; }
        }
      `}</style>

      {/* Encabezado */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 16, color: C.gold, letterSpacing: 2 }}>
          📜 BIBLIOTECA DE PROMPTS
        </div>
        <p style={{ color: C.muted, fontSize: 12, marginTop: 4, maxWidth: 620, lineHeight: 1.5 }}>
          Aquí administras todos los prompts/plantillas que usas con Claude y ChatGPT. Solo tú puedes editar. Tus colaboradores ven esta misma información, de solo lectura, en su propia página con contraseña.
        </p>
      </div>

      {/* Colaboradores con acceso a esta pestaña (otorgar / listar / revocar) */}
      <ColaboradoresPrompts />

      {/* Toolbar: buscar + nuevo */}
      <div className="pb-toolbar" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
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
        >➕ NUEVO PROMPT</button>
      </div>

      {/* Chips de categoría */}
      <div className="pb-chips" style={{ marginBottom: 20 }}>
        <button
          onClick={() => setFiltroCategoria('todas')}
          style={chipStyle(filtroCategoria === 'todas')}
        >TODAS ({prompts.length})</button>
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setFiltroCategoria(cat)}
            style={chipStyle(filtroCategoria === cat)}
          >{cat} ({prompts.filter(p => p.categoria === cat).length})</button>
        ))}
      </div>

      {/* Estado de carga / error / vacío */}
      {loading && <p style={{ color: C.muted, fontSize: 12 }}>Cargando prompts…</p>}
      {error && (
        <div style={{ padding: '12px 14px', background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.3)', borderRadius: 8, color: C.red, fontSize: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}
      {!loading && !error && promptsFiltrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: C.muted }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>📭</div>
          <p style={{ fontSize: 12.5 }}>
            {prompts.length === 0 ? 'Todavía no hay prompts guardados.' : 'No hay prompts que coincidan con tu búsqueda.'}
          </p>
        </div>
      )}

      {/* Grid de tarjetas */}
      {!loading && promptsFiltrados.length > 0 && (
        <div className="pb-grid">
          {promptsFiltrados.map(p => (
            <PromptCard
              key={p.id}
              prompt={p}
              onEditar={abrirEditar}
              onEliminar={setConfirmarBorrar}
              onCopiar={copiar}
              copiado={copiadoId === p.id}
            />
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modalAbierto && (
        <ModalPrompt
          form={form}
          setForm={setForm}
          categorias={categorias}
          onGuardar={guardar}
          onCerrar={() => setModalAbierto(false)}
          guardando={guardando}
          error={errorForm}
        />
      )}

      {/* Modal confirmar borrado */}
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
              ¿BORRAR ESTE PROMPT?
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