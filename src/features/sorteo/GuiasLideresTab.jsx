/**
 * GuiasLideresTab.jsx — Templo del Propósito
 * Tab dentro de SorteoAdminPage: /admin/sorteos → pestaña 🗺️ GUÍAS LÍDERES
 *
 * Modelo: "cursos" por pista (Captador, Constructor…), cada uno con sus
 * propios pasos numerados (tabla guias_lideres_pasos). El acceso a cada
 * pista es individual por colaborador (team_permissions: 'guia_track:<slug>'),
 * se administra desde el panel "Colaboradores con acceso" en Prompts.
 *
 * puedeAdministrar=true  → constructor de cursos (crear/editar pistas y pasos)
 * puedeAdministrar=false → reproductor tipo curso, solo lectura, solo las
 *                          pistas que RLS ya le dejó ver a esa persona.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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

// Misma paleta que ya usas para distinguir responsables/aliados — se reutiliza como
// acentos de curso para que todo el sistema siga viéndose como una sola marca.
const PALETA_CURSOS = ['#D4AF37', '#9b59ff', '#44ccff', '#ff9944', '#44ff88', '#ff4466'];
const ICONOS_SUGERIDOS = ['🎯', '🛠️', '🗺️', '🚀', '🔑', '💎', '🏆', '🎓', '🌐', '📖'];

function copiarAlPortapapeles(texto) {
  navigator.clipboard?.writeText(texto).catch(() => {});
}

function slugify(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Progreso de lectura del colaborador — vive en su navegador, nada crítico ni
// sensible, solo para que el reproductor recuerde qué pasos ya vio.
function leerProgreso(cursoId) {
  try {
    return JSON.parse(localStorage.getItem(`gl_progreso_${cursoId}`) || '[]');
  } catch { return []; }
}
function guardarProgreso(cursoId, pasoIds) {
  try { localStorage.setItem(`gl_progreso_${cursoId}`, JSON.stringify(pasoIds)); } catch {}
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', marginBottom: 10,
  background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
  borderRadius: 8, color: C.text, fontSize: 13,
};
const labelStyle = { fontSize: 10.5, color: C.muted, fontFamily: 'Cinzel, serif', letterSpacing: 1, display: 'block', marginBottom: 4 };
const botonGold = (disabled) => ({
  padding: '10px 20px', background: disabled ? 'rgba(212,175,55,0.3)' : `linear-gradient(135deg,${C.gold},#9a7a00)`,
  border: 'none', borderRadius: 8, color: '#0a0614', fontFamily: 'Cinzel, serif', fontSize: 10.5,
  letterSpacing: 1.5, fontWeight: 900, cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap',
});
const botonFantasma = {
  padding: '9px 16px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8,
  color: C.muted, fontFamily: 'Cinzel, serif', fontSize: 9.5, letterSpacing: 1, cursor: 'pointer',
};
const botonPeligro = {
  padding: '9px 14px', background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.25)',
  borderRadius: 8, color: C.red, fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 1, fontWeight: 900, cursor: 'pointer',
};

function Overlay({ onClose, children, maxWidth = 480 }) {
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(4,2,14,0.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, border: `1.5px solid ${C.borderHi}`, borderRadius: 16, padding: '26px 22px', maxWidth, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>,
    document.body
  );
}

// ── Tarjeta de Sendero (acceso vivo, no "curso") ────────────────────────────────
function diasDesde(fechaIso) {
  if (!fechaIso) return null;
  return Math.floor((Date.now() - new Date(fechaIso).getTime()) / 86400000);
}

function CursoCard({ curso, totalPasos, vistos, puedeAdministrar, onAbrir, onEditar, onEliminar }) {
  const pct = totalPasos > 0 ? Math.round((vistos / totalPasos) * 100) : 0;
  const dias = diasDesde(curso.updated_at);
  const recienMejorado = dias !== null && dias <= 14;

  return (
    <div
      className="gl-curso-card"
      onClick={() => onAbrir(curso)}
      style={{
        position: 'relative', cursor: 'pointer', overflow: 'hidden',
        background: `linear-gradient(160deg, ${curso.color}14, ${C.card} 55%)`,
        border: `1px solid ${curso.activo ? C.border : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 16, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 10,
        opacity: curso.activo ? 1 : 0.55, transition: 'transform .15s ease, border-color .15s ease',
      }}
    >
      <div style={{ position: 'absolute', top: 14, right: 16, width: 8, height: 8, borderRadius: '50%', background: curso.color, boxShadow: `0 0 8px ${curso.color}` }} />
      {recienMejorado && !puedeAdministrar && (
        <div style={{ position: 'absolute', top: 14, left: 20, fontFamily: 'Cinzel, serif', fontSize: 7.5, letterSpacing: 1, color: C.green, border: '1px solid rgba(68,255,136,0.3)', borderRadius: 20, padding: '2px 8px', background: 'rgba(68,255,136,0.06)' }}>
          ✨ RECIÉN MEJORADO
        </div>
      )}
      <div style={{ fontSize: 30, marginTop: recienMejorado && !puedeAdministrar ? 14 : 0 }}>{curso.icono}</div>
      <div>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 15, color: C.gold, letterSpacing: 0.5 }}>{curso.titulo}</div>
        {curso.subtitulo && <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>{curso.subtitulo}</div>}
      </div>

      <div style={{ marginTop: 4 }}>
        <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: curso.color, transition: 'width .3s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'Cinzel, serif', fontSize: 8.5, letterSpacing: 1, color: C.muted }}>
          <span>{totalPasos} ESTACIÓN{totalPasos === 1 ? '' : 'ES'}</span>
          <span>{puedeAdministrar ? (curso.activo ? '● VISIBLE' : '○ OCULTO') : `${pct}% RECORRIDO`}</span>
        </div>
      </div>

      {puedeAdministrar ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onEditar(curso)} style={{ ...botonFantasma, flex: 1, fontSize: 9, padding: '8px 10px' }}>✏️ EDITAR SENDERO</button>
          <button onClick={() => onEliminar(curso)} style={{ ...botonPeligro, padding: '8px 10px' }}>🗑️</button>
        </div>
      ) : (
        <div style={{ marginTop: 6, fontFamily: 'Cinzel, serif', fontSize: 9.5, letterSpacing: 1.5, color: curso.color, fontWeight: 900 }}>
          {vistos > 0 ? 'CONTINUAR →' : 'ENTRAR →'}
        </div>
      )}
    </div>
  );
}

// ── Modal crear/editar curso (metadatos de la pista) ───────────────────────────
function ModalCurso({ form, setForm, onGuardar, onCerrar, guardando, error, esNuevo }) {
  return (
    <Overlay onClose={onCerrar} maxWidth={460}>
      <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 14, color: C.gold, letterSpacing: 1.5, marginBottom: 16 }}>
        {esNuevo ? '➕ NUEVO SENDERO' : '✏️ EDITAR SENDERO'}
      </div>

      <label style={labelStyle}>TÍTULO</label>
      <input
        value={form.titulo}
        onChange={e => setForm({ ...form, titulo: e.target.value, slug: esNuevo ? slugify(e.target.value) : form.slug })}
        style={inputStyle} placeholder="Ej. Captador"
      />

      <label style={labelStyle}>SUBTÍTULO (se ve en la portada, una línea)</label>
      <input value={form.subtitulo} onChange={e => setForm({ ...form, subtitulo: e.target.value })} style={inputStyle} placeholder="Ej. Atraer, filtrar y agendar líderes nuevos" />

      <label style={labelStyle}>ÍCONO</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {ICONOS_SUGERIDOS.map(ic => (
          <button key={ic} onClick={() => setForm({ ...form, icono: ic })}
            style={{ fontSize: 18, width: 38, height: 38, borderRadius: 8, cursor: 'pointer',
              background: form.icono === ic ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${form.icono === ic ? C.borderHi : C.border}` }}
          >{ic}</button>
        ))}
      </div>

      <label style={labelStyle}>COLOR DE ACENTO</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {PALETA_CURSOS.map(col => (
          <button key={col} onClick={() => setForm({ ...form, color: col })}
            style={{ width: 30, height: 30, borderRadius: '50%', background: col, cursor: 'pointer',
              border: form.color === col ? `2px solid #fff` : '2px solid transparent', boxShadow: form.color === col ? `0 0 0 2px ${col}` : 'none' }}
          />
        ))}
      </div>

      <label style={labelStyle}>SLUG (identificador único, controla el acceso — evita cambiarlo si ya diste acceso a alguien)</label>
      <input value={form.slug} onChange={e => setForm({ ...form, slug: slugify(e.target.value) })} style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="captador" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} id="gl-curso-activo" />
        <label htmlFor="gl-curso-activo" style={{ fontSize: 11.5, color: C.text }}>Visible para colaboradores con acceso a esta pista</label>
      </div>

      {error && <div style={{ padding: '9px 12px', background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.3)', borderRadius: 8, color: C.red, fontSize: 11.5, marginBottom: 14 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onCerrar} style={botonFantasma}>CANCELAR</button>
        <button onClick={onGuardar} disabled={guardando || !form.titulo.trim() || !form.slug.trim()} style={botonGold(guardando)}>
          {guardando ? 'GUARDANDO…' : (esNuevo ? 'CREAR SENDERO' : 'GUARDAR CAMBIOS')}
        </button>
      </div>
    </Overlay>
  );
}

// ── Modal crear/editar paso ─────────────────────────────────────────────────────
function ModalPaso({ form, setForm, onGuardar, onCerrar, guardando, error, esNuevo }) {
  return (
    <Overlay onClose={onCerrar} maxWidth={560}>
      <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 14, color: C.gold, letterSpacing: 1.5, marginBottom: 16 }}>
        {esNuevo ? '➕ NUEVA ESTACIÓN' : '✏️ EDITAR ESTACIÓN'}
      </div>

      <label style={labelStyle}>TÍTULO DE LA ESTACIÓN</label>
      <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={inputStyle} placeholder="Ej. Publica tu primer QR en redes" />

      <label style={labelStyle}>CONTENIDO — explícalo como si la persona no supiera nada del tema</label>
      <textarea value={form.contenido} onChange={e => setForm({ ...form, contenido: e.target.value })} rows={7} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Paso a paso claro, en tu propio tono. Usa líneas cortas — se ve mejor que un párrafo largo." />

      <label style={labelStyle}>IMAGEN (URL, opcional — captura de pantalla, diagrama, ejemplo)</label>
      <input value={form.imagen_url} onChange={e => setForm({ ...form, imagen_url: e.target.value })} style={inputStyle} placeholder="https://…" />
      {form.imagen_url && (
        <img src={form.imagen_url} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}`, marginTop: -4, marginBottom: 10 }} onError={e => { e.target.style.display = 'none'; }} />
      )}

      <label style={labelStyle}>TIP (opcional — un consejo corto que resalta aparte)</label>
      <input value={form.tip} onChange={e => setForm({ ...form, tip: e.target.value })} style={inputStyle} placeholder="Ej. Hazlo en horario donde tu audiencia esté más activa." />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} id="gl-paso-activo" />
        <label htmlFor="gl-paso-activo" style={{ fontSize: 11.5, color: C.text }}>Visible dentro de este sendero</label>
      </div>

      {error && <div style={{ padding: '9px 12px', background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.3)', borderRadius: 8, color: C.red, fontSize: 11.5, marginBottom: 14 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onCerrar} style={botonFantasma}>CANCELAR</button>
        <button onClick={onGuardar} disabled={guardando || !form.titulo.trim()} style={botonGold(guardando)}>
          {guardando ? 'GUARDANDO…' : (esNuevo ? 'AGREGAR ESTACIÓN' : 'GUARDAR CAMBIOS')}
        </button>
      </div>
    </Overlay>
  );
}

// ── Constructor de pasos (vista admin dentro de un curso) ──────────────────────
function ConstructorPasos({ curso, pasos, onVolver, onGuardarPaso, onEliminarPaso, onReordenar, onGuardarCurso }) {
  const [modalPaso, setModalPaso] = useState(null); // form o null
  const [confirmarBorrar, setConfirmarBorrar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  function abrirNuevo() { setModalPaso({ id: null, curso_id: curso.id, orden: pasos.length, titulo: '', contenido: '', imagen_url: '', tip: '', activo: true }); setErrorForm(''); }
  function abrirEditar(p) { setModalPaso({ ...p }); setErrorForm(''); }

  async function guardar() {
    setGuardando(true); setErrorForm('');
    const err = await onGuardarPaso(modalPaso);
    setGuardando(false);
    if (err) { setErrorForm(err); return; }
    setModalPaso(null);
  }

  return (
    <div style={{ animation: 'glFadeIn .25s ease both' }}>
      <button onClick={onVolver} style={{ ...botonFantasma, marginBottom: 16 }}>← VOLVER A TUS SENDEROS</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ fontSize: 26 }}>{curso.icono}</div>
        <div>
          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 16, color: C.gold, letterSpacing: 1 }}>{curso.titulo}</div>
          {curso.subtitulo && <div style={{ fontSize: 11.5, color: C.muted }}>{curso.subtitulo}</div>}
        </div>
      </div>
      <p style={{ color: C.muted, fontSize: 11.5, margin: '10px 0 20px', maxWidth: 600, lineHeight: 1.5 }}>
        Este sendero es tuyo para cuidarlo y hacerlo crecer. El orden en que dejes las estaciones aquí es el orden en que las
        va a vivir quien tenga acceso a él. Cada vez que edites algo, quien lo tiene asignado va a ver que sigue mejorando.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {pasos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: C.muted, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>🧭</div>
            <p style={{ fontSize: 12.5 }}>Todavía no tiene estaciones. Agrega la primera.</p>
          </div>
        )}
        {pasos.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', opacity: p.activo ? 1 : 0.5 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 2 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${curso.color}22`, border: `1px solid ${curso.color}`, color: curso.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 11 }}>{i + 1}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button disabled={i === 0} onClick={() => onReordenar(p, -1)} style={{ background: 'none', border: 'none', color: i === 0 ? 'rgba(255,255,255,0.1)' : C.muted, cursor: i === 0 ? 'default' : 'pointer', fontSize: 10 }}>▲</button>
                <button disabled={i === pasos.length - 1} onClick={() => onReordenar(p, 1)} style={{ background: 'none', border: 'none', color: i === pasos.length - 1 ? 'rgba(255,255,255,0.1)' : C.muted, cursor: i === pasos.length - 1 ? 'default' : 'pointer', fontSize: 10 }}>▼</button>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 12.5, color: C.text }}>{p.titulo}{!p.activo && <span style={{ color: C.muted, fontWeight: 400, fontSize: 10 }}> · oculto</span>}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.contenido}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => abrirEditar(p)} style={{ ...botonFantasma, padding: '7px 10px', fontSize: 9 }}>✏️</button>
              <button onClick={() => setConfirmarBorrar(p)} style={{ ...botonPeligro, padding: '7px 10px' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={abrirNuevo} style={botonGold(false)}>➕ AGREGAR ESTACIÓN</button>

      {modalPaso && (
        <ModalPaso form={modalPaso} setForm={setModalPaso} onGuardar={guardar} onCerrar={() => setModalPaso(null)} guardando={guardando} error={errorForm} esNuevo={!modalPaso.id} />
      )}

      {confirmarBorrar && (
        <Overlay onClose={() => setConfirmarBorrar(null)} maxWidth={360}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 13, color: C.red, letterSpacing: 1.5, marginBottom: 8 }}>¿BORRAR ESTA ESTACIÓN?</div>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 18 }}>"{confirmarBorrar.titulo}" se va a borrar para siempre.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmarBorrar(null)} style={botonFantasma}>CANCELAR</button>
              <button onClick={async () => { await onEliminarPaso(confirmarBorrar); setConfirmarBorrar(null); }} style={{ ...botonPeligro, padding: '9px 16px' }}>SÍ, BORRAR</button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

// ── Reproductor de curso (vista colaborador, solo lectura) ─────────────────────
function ReproductorCurso({ curso, pasos, onVolver }) {
  const [vistos, setVistos] = useState(() => new Set(leerProgreso(curso.id)));
  const [idx, setIdx] = useState(0);
  const paso = pasos[idx];

  useEffect(() => { guardarProgreso(curso.id, [...vistos]); }, [vistos, curso.id]);
  useEffect(() => { if (paso) setVistos(prev => new Set(prev).add(paso.id)); /* eslint-disable-next-line */ }, [idx]);

  if (pasos.length === 0) {
    return (
      <div style={{ animation: 'glFadeIn .25s ease both' }}>
        <button onClick={onVolver} style={{ ...botonFantasma, marginBottom: 16 }}>← MIS SENDEROS</button>
        <div style={{ textAlign: 'center', padding: '40px 20px', color: C.muted }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>🧭</div>
          <p style={{ fontSize: 12.5 }}>Este sendero se está terminando de preparar para ti. Vuelve pronto — lo seguimos ampliando.</p>
        </div>
      </div>
    );
  }

  const pct = Math.round((vistos.size / pasos.length) * 100);
  const diasActualizacion = diasDesde(curso.updated_at);

  return (
    <div style={{ animation: 'glFadeIn .25s ease both' }}>
      <button onClick={onVolver} style={{ ...botonFantasma, marginBottom: 16 }}>← MIS SENDEROS</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ fontSize: 26 }}>{curso.icono}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 16, color: C.gold }}>{curso.titulo}</div>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 6, maxWidth: 260 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: curso.color, transition: 'width .3s ease' }} />
          </div>
        </div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1, color: C.muted, whiteSpace: 'nowrap' }}>{pct}% RECORRIDO</div>
      </div>

      {diasActualizacion !== null && diasActualizacion <= 14 && (
        <div style={{ fontSize: 10.5, color: C.green, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
          ✨ Este sendero se mejoró {diasActualizacion === 0 ? 'hoy' : diasActualizacion === 1 ? 'ayer' : `hace ${diasActualizacion} días`} — siempre lo estamos afinando para ti.
        </div>
      )}

      {/* Navegador de estaciones */}
      <div className="gl-stepper" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 16 }}>
        {pasos.map((p, i) => (
          <button key={p.id} onClick={() => setIdx(i)}
            style={{
              flexShrink: 0, width: 34, height: 34, borderRadius: '50%', cursor: 'pointer',
              fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 12,
              background: i === idx ? curso.color : vistos.has(p.id) ? `${curso.color}22` : 'rgba(255,255,255,0.03)',
              color: i === idx ? '#0a0614' : vistos.has(p.id) ? curso.color : C.muted,
              border: `1px solid ${i === idx ? curso.color : C.border}`,
            }}
          >{vistos.has(p.id) && i !== idx ? '✓' : i + 1}</button>
        ))}
      </div>

      {/* Contenido del paso actual */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 22px', minHeight: 200 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 2, color: curso.color, marginBottom: 6 }}>PASO {idx + 1} DE {pasos.length}</div>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 16, color: C.text, marginBottom: 16, lineHeight: 1.35 }}>{paso.titulo}</div>

        {paso.imagen_url && (
          <img src={paso.imagen_url} alt="" style={{ width: '100%', borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 16, display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
        )}

        <p style={{ fontSize: 13.5, lineHeight: 1.7, color: C.text, whiteSpace: 'pre-wrap', margin: 0 }}>{paso.contenido}</p>

        {paso.tip && (
          <div style={{ marginTop: 18, padding: '12px 14px', background: 'rgba(212,175,55,0.06)', border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.gold, lineHeight: 1.5 }}>
            💡 {paso.tip}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 18 }}>
        <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} style={{ ...botonFantasma, opacity: idx === 0 ? 0.4 : 1, cursor: idx === 0 ? 'default' : 'pointer' }}>← ANTERIOR</button>
        {idx < pasos.length - 1 ? (
          <button onClick={() => setIdx(i => Math.min(pasos.length - 1, i + 1))} style={botonGold(false)}>SIGUIENTE PASO →</button>
        ) : (
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 1.5, color: C.green, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6 }}>✓ SENDERO DOMINADO</div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function GuiasLideresTab({ puedeAdministrar = true } = {}) {
  const [cursos, setCursos]     = useState([]);
  const [pasosPorCurso, setPasosPorCurso] = useState({}); // { [cursoId]: paso[] }
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const [vista, setVista]       = useState('grid'); // 'grid' | 'curso'
  const [cursoActivo, setCursoActivo] = useState(null);

  const [modalCurso, setModalCurso] = useState(null); // form o null
  const [guardandoCurso, setGuardandoCurso] = useState(false);
  const [errorCurso, setErrorCurso] = useState('');
  const [confirmarBorrarCurso, setConfirmarBorrarCurso] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true); setError('');
    const { data: cursosData, error: errCursos } = await supabase
      .from('guias_lideres').select('*').order('orden', { ascending: true });
    if (errCursos) { setError(errCursos.message); setLoading(false); return; }

    const ids = (cursosData || []).map(c => c.id);
    let pasosMap = {};
    if (ids.length > 0) {
      const { data: pasosData, error: errPasos } = await supabase
        .from('guias_lideres_pasos').select('*').in('curso_id', ids).order('orden', { ascending: true });
      if (errPasos) { setError(errPasos.message); setLoading(false); return; }
      pasosMap = (pasosData || []).reduce((acc, p) => { (acc[p.curso_id] ||= []).push(p); return acc; }, {});
    }
    setCursos(cursosData || []);
    setPasosPorCurso(pasosMap);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const cursosVisibles = useMemo(() => {
    // admin ve todo (incluido oculto); colaborador solo ve lo que RLS ya filtró, pero igual ocultamos cursos vacíos si no administra
    return puedeAdministrar ? cursos : cursos.filter(c => c.activo);
  }, [cursos, puedeAdministrar]);

  function abrirCurso(curso) { setCursoActivo(curso); setVista('curso'); }
  function volverAGrid() { setVista('grid'); setCursoActivo(null); cargar(); }

  // ── Cursos: crear / editar / borrar ──────────────────────────────────────────
  function abrirNuevoCurso() { setModalCurso({ id: null, slug: '', titulo: '', subtitulo: '', icono: '🎯', color: PALETA_CURSOS[cursos.length % PALETA_CURSOS.length], orden: cursos.length, activo: true }); setErrorCurso(''); }
  function abrirEditarCurso(curso) { setModalCurso({ ...curso }); setErrorCurso(''); }

  async function guardarCurso() {
    setGuardandoCurso(true); setErrorCurso('');
    const payload = {
      slug: modalCurso.slug.trim(),
      titulo: modalCurso.titulo.trim(),
      subtitulo: modalCurso.subtitulo?.trim() || null,
      icono: modalCurso.icono || '📘',
      color: modalCurso.color || '#9b59ff',
      orden: modalCurso.orden || 0,
      activo: modalCurso.activo,
      updated_at: new Date().toISOString(),
    };
    let err;
    if (modalCurso.id) {
      ({ error: err } = await supabase.from('guias_lideres').update(payload).eq('id', modalCurso.id));
    } else {
      ({ error: err } = await supabase.from('guias_lideres').insert(payload));
    }
    setGuardandoCurso(false);
    if (err) { setErrorCurso(err.message.includes('duplicate') ? 'Ya existe una pista con ese slug.' : err.message); return; }
    setModalCurso(null);
    cargar();
  }

  async function eliminarCurso(curso) {
    const { error: err } = await supabase.from('guias_lideres').delete().eq('id', curso.id);
    setConfirmarBorrarCurso(null);
    if (err) { setError(err.message); return; }
    cargar();
  }

  // ── Pasos: guardar / borrar / reordenar ──────────────────────────────────────
  async function guardarPaso(form) {
    const payload = {
      curso_id: cursoActivo.id,
      orden: form.orden || 0,
      titulo: form.titulo.trim(),
      contenido: form.contenido || '',
      imagen_url: form.imagen_url?.trim() || null,
      tip: form.tip?.trim() || null,
      activo: form.activo,
      updated_at: new Date().toISOString(),
    };
    let err;
    if (form.id) {
      ({ error: err } = await supabase.from('guias_lideres_pasos').update(payload).eq('id', form.id));
    } else {
      ({ error: err } = await supabase.from('guias_lideres_pasos').insert(payload));
    }
    if (err) return err.message;
    await cargar();
    return null;
  }

  async function eliminarPaso(paso) {
    await supabase.from('guias_lideres_pasos').delete().eq('id', paso.id);
    await cargar();
  }

  async function reordenarPaso(paso, direccion) {
    const lista = [...(pasosPorCurso[cursoActivo.id] || [])];
    const i = lista.findIndex(p => p.id === paso.id);
    const j = i + direccion;
    if (j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    // reasigna orden secuencial y guarda solo los dos que cambiaron
    const updates = lista.map((p, idx) => ({ ...p, orden: idx }));
    setPasosPorCurso(prev => ({ ...prev, [cursoActivo.id]: updates })); // optimista
    await Promise.all([
      supabase.from('guias_lideres_pasos').update({ orden: j }).eq('id', lista[j].id),
      supabase.from('guias_lideres_pasos').update({ orden: i }).eq('id', lista[i].id),
    ]);
    cargar();
  }

  const pasosCursoActivo = cursoActivo ? (pasosPorCurso[cursoActivo.id] || []) : [];

  return (
    <div style={{ animation: 'glFadeIn .3s ease both' }}>
      <style>{`
        @keyframes glFadeIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
        .gl-curso-card:hover { transform: translateY(-3px); border-color: ${C.borderHi} !important; }
        .gl-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 16px; }
        .gl-stepper::-webkit-scrollbar { height: 4px; }
        .gl-stepper::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        @media (max-width: 520px) {
          .gl-toolbar { flex-direction: column; align-items: stretch !important; }
          .gl-toolbar > * { width: 100% !important; }
        }
      `}</style>

      {vista === 'grid' && (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 16, color: C.gold, letterSpacing: 2 }}>
              🗺️ GUÍAS PARA LÍDERES
            </div>
            <p style={{ color: C.muted, fontSize: 12, marginTop: 4, maxWidth: 620, lineHeight: 1.5 }}>
              {puedeAdministrar
                ? 'Cada pista es un sendero independiente — arma sus estaciones y decide, desde Prompts → Colaboradores con acceso, quién ve cuál. Nadie ve una pista que no le corresponde.'
                : 'Este es tu acceso — las pistas que te ganaste como parte del equipo. Entra a la tuya, avanza a tu ritmo y tu progreso se guarda solo.'}
            </p>
          </div>

          {puedeAdministrar && (
            <div className="gl-toolbar" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
              <button onClick={abrirNuevoCurso} style={botonGold(false)}>➕ NUEVA PISTA</button>
            </div>
          )}

          {loading && <p style={{ color: C.muted, fontSize: 12 }}>Cargando…</p>}
          {error && <div style={{ padding: '12px 14px', background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.3)', borderRadius: 8, color: C.red, fontSize: 12, marginBottom: 16 }}>{error}</div>}

          {!loading && !error && cursosVisibles.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: C.muted }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🗺️</div>
              <p style={{ fontSize: 13 }}>
                {puedeAdministrar ? 'Todavía no has creado ninguna pista.' : 'Todavía no tienes ninguna pista asignada — pídele acceso a tu admin.'}
              </p>
            </div>
          )}

          {!loading && cursosVisibles.length > 0 && (
            <div className="gl-grid">
              {cursosVisibles.map(c => (
                <CursoCard
                  key={c.id}
                  curso={c}
                  totalPasos={(pasosPorCurso[c.id] || []).length}
                  vistos={puedeAdministrar ? 0 : leerProgreso(c.id).length}
                  puedeAdministrar={puedeAdministrar}
                  onAbrir={abrirCurso}
                  onEditar={abrirEditarCurso}
                  onEliminar={setConfirmarBorrarCurso}
                />
              ))}
            </div>
          )}
        </>
      )}

      {vista === 'curso' && cursoActivo && (
        puedeAdministrar ? (
          <ConstructorPasos
            curso={cursoActivo}
            pasos={pasosCursoActivo}
            onVolver={volverAGrid}
            onGuardarPaso={guardarPaso}
            onEliminarPaso={eliminarPaso}
            onReordenar={reordenarPaso}
          />
        ) : (
          <ReproductorCurso curso={cursoActivo} pasos={pasosCursoActivo.filter(p => p.activo)} onVolver={volverAGrid} />
        )
      )}

      {modalCurso && (
        <ModalCurso form={modalCurso} setForm={setModalCurso} onGuardar={guardarCurso} onCerrar={() => setModalCurso(null)} guardando={guardandoCurso} error={errorCurso} esNuevo={!modalCurso.id} />
      )}

      {confirmarBorrarCurso && (
        <Overlay onClose={() => setConfirmarBorrarCurso(null)} maxWidth={380}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 13, color: C.red, letterSpacing: 1.5, marginBottom: 8 }}>¿BORRAR ESTA PISTA COMPLETA?</div>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 18 }}>"{confirmarBorrarCurso.titulo}" y todos sus pasos se van a borrar para siempre. Los colaboradores con acceso perderán esta pista.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmarBorrarCurso(null)} style={botonFantasma}>CANCELAR</button>
              <button onClick={() => eliminarCurso(confirmarBorrarCurso)} style={{ ...botonPeligro, padding: '9px 16px' }}>SÍ, BORRAR TODO</button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}