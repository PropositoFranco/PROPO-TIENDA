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

// ── Utilidades de fecha / metadatos visuales por tipo de recurso ───────────────
function diasDesde(fechaIso) {
  if (!fechaIso) return null;
  return Math.floor((Date.now() - new Date(fechaIso).getTime()) / 86400000);
}

// Ícono + verbo de botón por tipo de tarjeta de ACCESO DIRECTO (guias_lideres_recursos.tipo)
const TIPO_RECURSO_META = {
  guion:        { icono: '💬', boton: 'USAR',  color: '#9b59ff' },
  plantilla:    { icono: '📄', boton: 'ABRIR', color: '#44ccff' },
  herramienta:  { icono: '🛠️', boton: 'VER',   color: '#44ff88' },
  video:        { icono: '🎬', boton: 'VER',   color: '#4488ff' },
  guia_tecnica: { icono: '📘', boton: 'ABRIR', color: C.gold },
};

// PROMPTS no vive en guias_lideres_recursos (tiene su propia tabla/edge function
// ya en producción), por eso su copy va aparte, por slug de pista.
// ⚠️ AJUSTA ESTA RUTA: es la URL real de la página de colaborador de Prompts
// (la protegida con contraseña compartida) — pon aquí el path correcto de tu app.
const PROMPTS_COLABORADOR_URL = '/colaborador/prompts';
const PROMPTS_COPY = {
  captador:    { subtitulo: 'Ideas y respuestas con IA.', boton: 'COPIAR' },
  constructor: { subtitulo: 'Código, infraestructura, solución de errores, etc.', boton: 'USAR' },
  _default:    { subtitulo: 'Prompts listos para usar con IA.', boton: 'ABRIR' },
};

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

      <label style={labelStyle}>PERSONAJE (URL de la ilustración, opcional)</label>
      <input value={form.personaje_url || ''} onChange={e => setForm({ ...form, personaje_url: e.target.value })} style={inputStyle} placeholder="https://…/personaje.webp" />
      {form.personaje_url && (
        <img src={form.personaje_url} alt="" style={{ width: 90, height: 90, objectFit: 'contain', display: 'block', marginBottom: 12 }} onError={e => { e.target.style.display = 'none'; }} />
      )}

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

      <label style={labelStyle}>ÍCONO DE ESTE PASO (se ve en el stepper de TU RUTA)</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {ICONOS_SUGERIDOS.map(ic => (
          <button key={ic} onClick={() => setForm({ ...form, icono: ic })}
            style={{ fontSize: 18, width: 38, height: 38, borderRadius: 8, cursor: 'pointer',
              background: form.icono === ic ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${form.icono === ic ? C.borderHi : C.border}` }}
          >{ic}</button>
        ))}
      </div>

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

  function abrirNuevo() { setModalPaso({ id: null, curso_id: curso.id, orden: pasos.length, titulo: '', contenido: '', imagen_url: '', tip: '', icono: '📍', activo: true }); setErrorForm(''); }
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
              <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 12.5, color: C.text }}>{p.icono ? `${p.icono} ` : ''}{p.titulo}{!p.activo && <span style={{ color: C.muted, fontWeight: 400, fontSize: 10 }}> · oculto</span>}</div>
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

// ── Tarjeta de ACCESO DIRECTO (guias_lideres_recursos + tile fijo de Prompts) ──
function TarjetaRecurso({ recurso }) {
  const [abierta, setAbierta] = useState(false);
  const meta = TIPO_RECURSO_META[recurso.tipo] || { icono: '⚡', boton: 'VER', color: C.gold };
  const boton = recurso.boton || meta.boton;

  function manejarClick() {
    if (recurso.url_externo) { window.open(recurso.url_externo, '_blank', 'noopener'); return; }
    setAbierta(true);
  }

  return (
    <>
      <div
        style={{
          background: `linear-gradient(155deg, ${meta.color}2e, ${meta.color}0a 65%)`,
          border: `1px solid ${meta.color}80`, borderRadius: 14,
          padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0,
          boxShadow: `0 0 0 1px ${meta.color}22, 0 10px 26px -16px ${meta.color}`,
          transition: 'border-color .2s ease, transform .2s ease, box-shadow .2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 14px 30px -14px ${meta.color}`; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = `${meta.color}80`; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 0 0 1px ${meta.color}22, 0 10px 26px -16px ${meta.color}`; }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${meta.color}30`, border: `1px solid ${meta.color}99`, fontSize: 13,
          boxShadow: `0 0 14px -4px ${meta.color}`,
        }}>{meta.icono}</div>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 12.5, color: meta.color, letterSpacing: 0.4, textShadow: `0 0 16px ${meta.color}55` }}>{recurso.titulo}</div>
        {recurso.subtitulo && <div style={{ fontSize: 10.5, color: '#e4e0f2', lineHeight: 1.35 }}>{recurso.subtitulo}</div>}
        <button
          onClick={manejarClick}
          style={{
            marginTop: 1, alignSelf: 'flex-start', background: meta.color, border: 'none', borderRadius: 7,
            color: '#0a0614', fontFamily: 'Cinzel, serif', fontSize: 9.5, letterSpacing: 0.8, fontWeight: 900,
            cursor: 'pointer', padding: '5px 10px', boxShadow: `0 6px 16px -6px ${meta.color}`,
          }}
        >
          {boton} →
        </button>
      </div>

      {abierta && (
        <Overlay onClose={() => setAbierta(false)} maxWidth={480}>
          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 13, color: C.gold, letterSpacing: 1.5, marginBottom: 14 }}>
            {meta.icono} {(recurso.titulo || '').toUpperCase()}
          </div>
          {recurso.contenido ? (
            <>
              <p style={{ fontSize: 13, color: C.text, whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: 16 }}>{recurso.contenido}</p>
              <button onClick={() => copiarAlPortapapeles(recurso.contenido)} style={botonGold(false)}>COPIAR CONTENIDO</button>
            </>
          ) : (
            <p style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6 }}>🔒 Todavía se está armando este recurso — vuelve pronto.</p>
          )}
        </Overlay>
      )}
    </>
  );
}

// ── Acceso del panel "SI ALGO SALE MAL..." (guias_lideres_soporte) ─────────────
function TarjetaSoporte({ item }) {
  const [abierta, setAbierta] = useState(false);
  function manejarClick() {
    if (item.url_externo) { window.open(item.url_externo, '_blank', 'noopener'); return; }
    setAbierta(true);
  }
  return (
    <>
      <button
        onClick={manejarClick}
        style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 9, padding: '7px 9px', color: C.text, fontSize: 10.5, cursor: 'pointer', textAlign: 'left', width: '100%' }}
      >
        <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icono}</span>
        <span style={{ flex: 1, minWidth: 0 }}>{item.titulo}</span>
        <span style={{ color: C.muted, fontSize: 11 }}>→</span>
      </button>

      {abierta && (
        <Overlay onClose={() => setAbierta(false)} maxWidth={420}>
          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 13, color: C.gold, letterSpacing: 1.5, marginBottom: 12 }}>
            {item.icono} {(item.titulo || '').toUpperCase()}
          </div>
          <p style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.6 }}>{item.descripcion || 'Todavía se está armando esta solución — vuelve pronto.'}</p>
        </Overlay>
      )}
    </>
  );
}

// ── Tarjeta-hero de "ELIGE TU FUNCIÓN": personaje, misión, ruta, acceso directo ─
function RolHeroCard({ curso, pasos, recursos, soporte, puedeAdministrar, onAbrirRuta, onEditar, onEliminar }) {
  const vistos = puedeAdministrar ? new Set() : new Set(leerProgreso(curso.id));
  const [mostrarSoporte, setMostrarSoporte] = useState(false);
  const keywords = (curso.tagline || '').split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
  const promptsCopy = PROMPTS_COPY[curso.slug] || PROMPTS_COPY._default;
  // primer paso no visto cuyo anterior sí — es el que está "EN CURSO" ahora mismo
  const pasoEnCurso = !puedeAdministrar
    ? pasos.find((p, i) => !vistos.has(p.id) && (i === 0 || vistos.has(pasos[i - 1].id)))
    : null;

  const moverGlow = e => {
    const r = e.currentTarget.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    e.currentTarget.style.setProperty('--gl-mx', `${((pt.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty('--gl-my', `${((pt.clientY - r.top) / r.height) * 100}%`);
    e.currentTarget.style.setProperty('--gl-glow-o', '1');
  };
  const apagarGlow = e => { e.currentTarget.style.setProperty('--gl-glow-o', '0'); };

  return (
    <div
      className="gl-rol-card"
      onMouseMove={moverGlow}
      onMouseLeave={apagarGlow}
      onTouchStart={moverGlow}
      onTouchMove={moverGlow}
      onTouchEnd={apagarGlow}
      style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(165deg, ${curso.color}26, ${C.card} 55%)`,
        border: `1.5px solid ${curso.activo ? curso.color + '70' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 24, padding: 'clamp(10px,1.8vh,20px) clamp(14px,2vw,20px) clamp(10px,1.4vh,16px)',
        /* Subgrid de 4 filas (bloque superior, ruta, acceso directo, pie) — hace que
           cada sección quede a la misma altura que su equivalente en la tarjeta vecina,
           tomando siempre la más alta de las dos. Las tarjetas viven dentro de
           .gl-hero-grid, que es su grid padre; grid-row: span 4 les reserva esas 4
           filas compartidas del padre para que el subgrid tenga de dónde heredar. */
        display: 'grid', gridTemplateRows: 'subgrid', gridRow: 'span 4', rowGap: 'clamp(7px,1.2vh,13px)',
        opacity: curso.activo ? 1 : 0.55,
        boxShadow: `0 24px 70px -26px ${curso.color}aa, inset 0 0 60px -40px ${curso.color}`,
        '--gl-rol-color': curso.color,
      }}
    >
      {/* Glow "fósforo" que sigue exacto al mouse (o al dedo en táctil) — se mueve con
          variables CSS actualizadas directo en el DOM (sin re-render de React, para que
          no tartamudee), y se prende/apaga suave con --gl-glow-o. mixBlendMode:screen lo
          hace brillar sobre el fondo oscuro sin tapar nada debajo. */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: `radial-gradient(260px circle at var(--gl-mx,50%) var(--gl-my,50%), ${curso.color}80, ${curso.color}30 38%, transparent 68%)`,
        opacity: 'var(--gl-glow-o, 0)',
        transition: 'opacity .25s ease',
        mixBlendMode: 'screen',
      }} />
      {/* Textura de fondo tipo HUD — grid de puntos que se desvanece, para que no se sienta plano */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(${curso.color}20 1px, transparent 1px), linear-gradient(90deg, ${curso.color}20 1px, transparent 1px)`,
        backgroundSize: '26px 26px',
        maskImage: 'radial-gradient(ellipse 65% 55% at 18% 12%, black 0%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 18% 12%, black 0%, transparent 80%)',
      }} />
      {/* Esquinas estilo HUD/tecnológico */}
      <div style={{ position: 'absolute', top: 12, left: 12, width: 22, height: 22, zIndex: 1, pointerEvents: 'none', borderTop: `2px solid ${curso.color}`, borderLeft: `2px solid ${curso.color}`, opacity: 0.85 }} />
      <div style={{ position: 'absolute', bottom: 12, right: 12, width: 22, height: 22, zIndex: 1, pointerEvents: 'none', borderBottom: `2px solid ${curso.color}`, borderRight: `2px solid ${curso.color}`, opacity: 0.85 }} />

      {puedeAdministrar && (
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6, zIndex: 3 }}>
          <button onClick={() => onEditar(curso)} style={{ ...botonFantasma, padding: '6px 10px', fontSize: 9 }}>✏️</button>
          <button onClick={() => onEliminar(curso)} style={{ ...botonPeligro, padding: '6px 10px' }}>🗑️</button>
        </div>
      )}

      {/* Bloque superior: grid con áreas nombradas (text/image/mision). En vez de esperar
          a que termine toda la fila para dibujar TU MISIÓN, la misión vive en su propia
          área bajo el texto — así no depende del alto del personaje y no deja hueco.
          El personaje ocupa su propia columna, alto según su contenido real (sin
          position:absolute adivinado). En pantallas angostas las áreas se reapilan solas
          (texto → personaje → misión) sin tocar el orden real del DOM. */}
      <div className="gl-hero-row" style={{ position: 'relative', zIndex: 2 }}>
        {/* Columna de texto */}
        <div className="gl-hero-text" style={{ gridArea: 'text' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 'clamp(4px,0.7vh,8px)', flexWrap: 'wrap' }}>
            <span className="gl-hero-icono" style={{ fontSize: 'clamp(30px,4.2vw,46px)', lineHeight: 1, filter: `drop-shadow(0 0 14px ${curso.color}aa)` }}>{curso.icono}</span>
            {curso.activo && (
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 7.5, letterSpacing: 1.3, color: C.green, border: '1px solid rgba(68,255,136,0.3)', borderRadius: 20, padding: '2px 8px', background: 'rgba(68,255,136,0.06)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green }} /> ROL ACTIVO
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 'clamp(16px,2.1vw,22px)', color: C.gold, letterSpacing: 0.5, lineHeight: 1.08, textTransform: 'uppercase', textShadow: `0 0 30px ${curso.color}70` }}>{curso.titulo}</div>
          {curso.subtitulo && <div style={{ fontFamily: "'Baloo 2', 'Cinzel', sans-serif", fontSize: 13, color: '#f1eefa', marginTop: 6, lineHeight: 1.42, fontWeight: 600 }}>{curso.subtitulo}</div>}
        </div>

        {/* Columna del personaje — todo en flujo normal, nada de top/right calculados a
            mano ni proporción adivinada. La frase va arriba; el marco del personaje toma
            su alto de la imagen real (width:100%, height:auto), así que se ve completo,
            sin hueco vacío, sea la ilustración panorámica o vertical. */}
        {curso.personaje_url && (
          <div className="gl-hero-personaje-col" style={{ gridArea: 'image' }}>
            {keywords.length > 0 && (
              <div className="gl-hero-tagline">
                {keywords.map((k, i) => (
                  <div key={i} style={{
                    fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 'clamp(9px,1vw,11.5px)',
                    letterSpacing: 0.4, color: C.gold, lineHeight: 1.25, textTransform: 'uppercase',
                    textShadow: `0 1px 0 rgba(0,0,0,0.95), 0 2px 5px rgba(0,0,0,0.85), 0 0 18px ${curso.color}aa`,
                  }}>{k}</div>
                ))}
              </div>
            )}
            <div className="gl-personaje-frame">
              {/* Halo grande detrás, mismo color de la pista, fundido con el fondo de la tarjeta.
                  aspect-ratio:1 lo mantiene un círculo real sin importar si el marco del
                  personaje resulta panorámico o vertical (nunca aplastado ni ovalado). */}
              <div style={{
                position: 'absolute', top: '-8%', right: '-8%', width: '55%', aspectRatio: '1 / 1',
                borderRadius: '50%', background: `radial-gradient(circle, ${curso.color}85, transparent 72%)`,
                zIndex: 0, pointerEvents: 'none',
              }} />
              {/* Personaje — flujo normal, con dos topes relativos a la vez: nunca más
                  ancho que su columna, nunca más alto que 24vh (ver clase .gl-personaje).
                  El navegador aplica el que sea más chico y respeta la proporción real —
                  sin hueco vacío, sin recorte, y sin que la imagen empuje el resto de la
                  tarjeta fuera de pantalla en monitores bajos. */}
              <img
                className="gl-personaje"
                src={curso.personaje_url} alt=""
                style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>
        )}

        {/* Misión — ahora vive en su propia área de grid (fila 2, columna del texto),
            justo debajo del texto y sin esperar a que termine la columna del personaje.
            Su ancho ya no depende de un % adivinado: toma el de la columna de texto. */}
        {curso.mision_texto && (
          <div className="gl-mision-box" style={{
            gridArea: 'mision', position: 'relative', zIndex: 2, display: 'flex', gap: 10, alignItems: 'flex-start',
            background: `linear-gradient(120deg, ${curso.color}60, ${curso.color}1c 65%, rgba(0,0,0,0.45))`,
            border: `1px solid ${curso.color}60`, borderRadius: 12, padding: 'clamp(7px,1.1vh,12px) clamp(11px,1.6vw,15px)',
            boxShadow: `0 8px 24px -12px ${curso.color}99`,
            minHeight: 'clamp(78px, 11.5vh, 104px)',
          }}>
            <div style={{
              flexShrink: 0, width: 'clamp(46px,5.4vw,58px)', height: 'clamp(46px,5.4vw,58px)', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${curso.color}35`, border: `1px solid ${curso.color}`, fontSize: 'clamp(24px,2.8vw,30px)',
              lineHeight: 1, boxShadow: `0 0 22px -2px ${curso.color}`,
            }}>{curso.icono || '🛡️'}</div>
            <div>
              <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 10.5, letterSpacing: 1.3, color: '#ffffff', marginBottom: 3, textShadow: `0 0 12px ${curso.color}, 0 1px 3px rgba(0,0,0,0.9)` }}>TU MISIÓN</div>
              <div style={{ fontSize: 12.5, color: '#ffffff', lineHeight: 1.42, fontWeight: 600 }}>{curso.mision_texto}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tu ruta — stepper con ícono propio por paso, conectores y estado real */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'clamp(4px,0.7vh,8px)' }}>
          <span className="gl-accent-bar" style={{ width: 3, height: 13, borderRadius: 2, background: curso.color, boxShadow: `0 0 8px ${curso.color}`, '--gl-color': curso.color }} />
          <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 12, letterSpacing: 1.3, color: '#ffffff', textShadow: `0 0 12px ${curso.color}, 0 1px 3px rgba(0,0,0,0.9)` }}>🎯 TU RUTA</span>
        </div>
        {pasos.length === 0 ? (
          <div className="gl-ruta-en-construccion" style={{
            position: 'relative', overflow: 'hidden',
            border: `1.5px solid ${curso.color}55`, borderRadius: 12, padding: 'clamp(7px,1.1vh,12px) clamp(11px,1.6vw,15px)',
            display: 'flex', alignItems: 'center', gap: 12,
            background: `linear-gradient(120deg, ${curso.color}18, ${curso.color}05 65%)`,
            '--gl-color': curso.color,
          }}>
            {/* Barrido de luz diagonal, muy sutil, cruzando el fondo — sugiere "algo en
                proceso" sin recurrir al típico borde punteado. */}
            <div className="gl-ruta-sweep" />
            <div className="gl-ruta-icono-wrap">
              {/* Anillos tipo radar/satélite, pulsando hacia afuera — le queda al ícono 🛰️
                  y rompe el patrón estático que tenía el resto de la tarjeta. */}
              <span className="gl-ruta-ping" />
              <span className="gl-ruta-ping gl-ruta-ping-delay" />
              <div className="gl-ruta-icono" style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${curso.color}25`, border: `1px solid ${curso.color}80`, fontSize: 14, position: 'relative', zIndex: 1,
                boxShadow: `0 0 16px -2px ${curso.color}`,
              }}>🛰️</div>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 11, color: '#ffffff', letterSpacing: 0.4 }}>RUTA EN CONSTRUCCIÓN</div>
              <div style={{ fontSize: 10.5, color: '#c9c2dd', marginTop: 2, lineHeight: 1.35 }}>Pronto verás aquí cada estación, con su ícono y tu progreso real.</div>
            </div>
          </div>
        ) : (
          <div className="gl-stepper" onClick={() => onAbrirRuta(curso)} style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8, cursor: 'pointer' }}>
            {pasos.map((p, i) => {
              const hecho = vistos.has(p.id);
              const bloqueado = !puedeAdministrar && !hecho && i > 0 && !vistos.has(pasos[i - 1].id);
              const enCurso = pasoEnCurso?.id === p.id;
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 82 }}>
                    <div style={{
                      position: 'relative', width: 60, height: 60, borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                      background: hecho ? `${curso.color}26` : enCurso ? `${curso.color}18` : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${hecho || enCurso ? curso.color : C.border}`,
                      boxShadow: enCurso ? `0 0 18px ${curso.color}77` : 'none',
                    }}>
                      {bloqueado ? (
                        <span style={{ fontSize: 18, color: C.muted }}>🔒</span>
                      ) : (
                        <>
                          <span style={{ fontSize: 16, filter: hecho || enCurso ? 'none' : 'grayscale(1) opacity(0.6)' }}>{p.icono || '📍'}</span>
                          <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 9, color: hecho || enCurso ? curso.color : C.muted }}>{String(i + 1).padStart(2, '0')}</span>
                        </>
                      )}
                      {hecho && (
                        <span style={{ position: 'absolute', top: -7, right: -7, width: 18, height: 18, borderRadius: '50%', background: C.green, color: '#07040f', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, border: `2px solid ${C.card}` }}>✓</span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9.5, letterSpacing: 0.5, color: '#d8d3e8', textAlign: 'center', maxWidth: 82, lineHeight: 1.25 }}>{p.titulo}</div>
                    {enCurso && (
                      <div style={{ fontFamily: 'Cinzel, serif', fontSize: 6.5, letterSpacing: 1, color: '#0a0614', fontWeight: 900, background: curso.color, borderRadius: 6, padding: '2px 6px' }}>EN CURSO</div>
                    )}
                  </div>
                  {i < pasos.length - 1 && (
                    <span style={{ color: hecho ? curso.color : C.border, fontSize: 16, margin: '0 2px', flexShrink: 0, alignSelf: 'flex-start', marginTop: 20 }}>→</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Acceso directo — Prompts (tabla propia) + recursos por rol */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span className="gl-accent-bar" style={{ width: 3, height: 13, borderRadius: 2, background: curso.color, boxShadow: `0 0 8px ${curso.color}`, '--gl-color': curso.color }} />
          <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 12, letterSpacing: 1.3, color: '#ffffff', textShadow: `0 0 12px ${curso.color}, 0 1px 3px rgba(0,0,0,0.9)` }}>⚡ ACCESO DIRECTO</span>
        </div>
        <p style={{ fontSize: 10, color: '#c9c2dd', marginBottom: 'clamp(4px,0.7vh,8px)' }}>Lo que necesitas, en un solo lugar.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 152px))', gap: 8 }}>
          <TarjetaRecurso recurso={{ tipo: 'prompt', titulo: 'Prompts', subtitulo: promptsCopy.subtitulo, boton: promptsCopy.boton, url_externo: PROMPTS_COLABORADOR_URL }} />
          {recursos.map(r => <TarjetaRecurso key={r.id} recurso={r} />)}
        </div>
      </div>

      {/* Pie: soporte + fórmula, lado a lado como en la referencia. marginTop:auto lo
          pega al fondo de la tarjeta — así, aunque una pista tenga mucho más contenido
          arriba que otra, las dos tarjetas terminan a la misma altura, parejas. */}
      {(soporte.length > 0 || curso.formula_texto) && (
        <div style={{ position: 'relative', zIndex: 2, marginTop: 'auto', borderTop: `1px solid ${C.border}`, paddingTop: 'clamp(7px,1.1vh,10px)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {soporte.length > 0 && (
            <div style={{ flex: '2 1 220px', background: 'rgba(255,68,102,0.05)', border: '1px solid rgba(255,68,102,0.2)', borderRadius: 12, padding: 'clamp(6px,1vh,10px) clamp(10px,1.4vw,14px)' }}>
              {/* Desplegable: colapsado por defecto para no desnivelar la tarjeta cuando
                  una pista tiene muchos más problemas frecuentes cargados que otra. */}
              <button
                onClick={() => setMostrarSoporte(v => !v)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                }}
              >
                <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 10.5, letterSpacing: 1.3, color: C.red, display: 'flex', alignItems: 'center', gap: 6, textShadow: '0 0 12px rgba(255,68,102,0.5)' }}>
                  ⚠️ ¿TE ATORAS?
                </span>
                <span style={{ fontSize: 11, color: C.red, transition: 'transform .25s ease', transform: mostrarSoporte ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
              </button>
              {mostrarSoporte && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 5, marginTop: 8, animation: 'glFadeIn .25s ease both' }}>
                  {soporte.map(s => <TarjetaSoporte key={s.id} item={s} />)}
                </div>
              )}
            </div>
          )}
          {curso.formula_texto && (
            <div style={{
              flex: '1 1 180px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              fontFamily: 'Cinzel, serif', fontSize: 9.5, letterSpacing: 0.8, color: curso.color, fontWeight: 900,
              background: `${curso.color}0f`, border: `1px solid ${curso.color}40`, borderRadius: 12, padding: 'clamp(6px,1vh,10px) clamp(10px,1.4vw,14px)',
            }}>
              {curso.formula_texto}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function GuiasLideresTab({ puedeAdministrar = true } = {}) {
  const [cursos, setCursos]     = useState([]);
  const [pasosPorCurso, setPasosPorCurso] = useState({}); // { [cursoId]: paso[] }
  const [recursosPorCurso, setRecursosPorCurso] = useState({}); // { [cursoId]: recurso[] } — ACCESO DIRECTO
  const [soportePorCurso, setSoportePorCurso] = useState({}); // { [cursoId]: soporte[] } — SI ALGO SALE MAL
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
    let pasosMap = {}, recursosMap = {}, soporteMap = {};
    if (ids.length > 0) {
      const [{ data: pasosData, error: errPasos }, { data: recursosData }, { data: soporteData }] = await Promise.all([
        supabase.from('guias_lideres_pasos').select('*').in('curso_id', ids).order('orden', { ascending: true }),
        supabase.from('guias_lideres_recursos').select('*').in('guia_id', ids).eq('activo', true).order('orden', { ascending: true }),
        supabase.from('guias_lideres_soporte').select('*').in('guia_id', ids).eq('activo', true).order('orden', { ascending: true }),
      ]);
      if (errPasos) { setError(errPasos.message); setLoading(false); return; }
      pasosMap = (pasosData || []).reduce((acc, p) => { (acc[p.curso_id] ||= []).push(p); return acc; }, {});
      recursosMap = (recursosData || []).reduce((acc, r) => { (acc[r.guia_id] ||= []).push(r); return acc; }, {});
      soporteMap = (soporteData || []).reduce((acc, s) => { (acc[s.guia_id] ||= []).push(s); return acc; }, {});
    }
    setCursos(cursosData || []);
    setPasosPorCurso(pasosMap);
    setRecursosPorCurso(recursosMap);
    setSoportePorCurso(soporteMap);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const cursosVisibles = useMemo(() => {
    // admin ve todo (incluido oculto); colaborador solo ve lo que RLS ya filtró, pero igual ocultamos cursos vacíos si no administra
    return puedeAdministrar ? cursos : cursos.filter(c => c.activo);
  }, [cursos, puedeAdministrar]);

  // Progreso real del colaborador a través de TODAS sus pistas (localStorage, nada inventado)
  const progresoGlobal = useMemo(() => {
    if (puedeAdministrar) return null; // el admin no "avanza" pistas, las construye
    let total = 0, hechos = 0;
    cursosVisibles.forEach(c => {
      const pasosActivos = (pasosPorCurso[c.id] || []).filter(p => p.activo);
      if (pasosActivos.length === 0) return;
      const vistos = new Set(leerProgreso(c.id));
      total += pasosActivos.length;
      hechos += pasosActivos.filter(p => vistos.has(p.id)).length;
    });
    return total > 0 ? { pct: Math.round((hechos / total) * 100), total, hechos } : null;
  }, [cursosVisibles, pasosPorCurso, puedeAdministrar]);

  function abrirCurso(curso) { setCursoActivo(curso); setVista('curso'); }
  function volverAGrid() { setVista('grid'); setCursoActivo(null); cargar(); }

  // Acceso rápido: salta directo a la pista donde tienes un paso "EN CURSO"; si ninguna tiene, abre la primera con pasos
  function abrirAccesoRapido() {
    for (const c of cursosVisibles) {
      const pasosActivos = (pasosPorCurso[c.id] || []).filter(p => p.activo);
      if (pasosActivos.length === 0) continue;
      const vistos = new Set(leerProgreso(c.id));
      const enCurso = pasosActivos.find((p, i) => !vistos.has(p.id) && (i === 0 || vistos.has(pasosActivos[i - 1].id)));
      if (enCurso) { abrirCurso(c); return; }
    }
    const primera = cursosVisibles.find(c => (pasosPorCurso[c.id] || []).some(p => p.activo));
    if (primera) abrirCurso(primera);
  }

  // ── Cursos: crear / editar / borrar ──────────────────────────────────────────
  function abrirNuevoCurso() { setModalCurso({ id: null, slug: '', titulo: '', subtitulo: '', icono: '🎯', color: PALETA_CURSOS[cursos.length % PALETA_CURSOS.length], personaje_url: '', orden: cursos.length, activo: true }); setErrorCurso(''); }
  function abrirEditarCurso(curso) { setModalCurso({ ...curso }); setErrorCurso(''); }

  async function guardarCurso() {
    setGuardandoCurso(true); setErrorCurso('');
    const payload = {
      slug: modalCurso.slug.trim(),
      titulo: modalCurso.titulo.trim(),
      subtitulo: modalCurso.subtitulo?.trim() || null,
      icono: modalCurso.icono || '📘',
      color: modalCurso.color || '#9b59ff',
      personaje_url: modalCurso.personaje_url?.trim() || null,
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
      icono: form.icono || null,
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
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&display=swap');
        @keyframes glFadeIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
        /* Efecto "radar/satélite" para el placeholder RUTA EN CONSTRUCCIÓN — reemplaza el
           borde punteado (se sentía plano) por anillos de ping, un ícono que flota
           suave y un barrido de luz diagonal muy tenue. Le queda al 🛰️ y rompe el
           patrón estático sin ser invasivo. */
        .gl-ruta-icono-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
        .gl-ruta-icono { animation: glRutaFloat 2.6s ease-in-out infinite; }
        @keyframes glRutaFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        .gl-ruta-ping {
          position: absolute; width: 30px; height: 30px; border-radius: 9px;
          border: 1.5px solid var(--gl-color); opacity: 0.55; pointer-events: none;
          animation: glRutaPing 2.4s cubic-bezier(0,0,0.2,1) infinite;
        }
        .gl-ruta-ping-delay { animation-delay: 1.2s; }
        @keyframes glRutaPing { 0% { transform: scale(1); opacity: 0.55; } 100% { transform: scale(1.9); opacity: 0; } }
        .gl-ruta-sweep {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(100deg, transparent 42%, rgba(255,255,255,0.09) 50%, transparent 58%);
          background-size: 220% 100%;
          animation: glRutaSweep 5s linear infinite;
        }
        @keyframes glRutaSweep { 0% { background-position: 200% 0; } 100% { background-position: -60% 0; } }
        .gl-accent-bar { animation: glPulseBar 2.6s ease-in-out infinite; }
        @keyframes glPulseBar { 0%,100% { box-shadow: 0 0 6px var(--gl-color); } 50% { box-shadow: 0 0 16px var(--gl-color), 0 0 28px var(--gl-color); } }
        .gl-curso-card:hover { transform: translateY(-3px); border-color: ${C.borderHi} !important; }
        .gl-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 16px; }
        .gl-hero-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap: 14px; align-items: stretch; }
        .gl-hero-grid img { pointer-events: none; }

        /* Efecto "fósforo" al pasar el mouse (o tocar en pantallas táctiles): el borde y
           el halo de la tarjeta se encienden con el color propio de la pista, el ícono
           principal vibra un poco más de brillo, y la tarjeta se eleva ligeramente —
           todo con transiciones suaves, nada instantáneo ni brusco. */
        .gl-rol-card {
          transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease;
        }
        .gl-rol-card:hover, .gl-rol-card:active {
          transform: translateY(-4px);
          border-color: var(--gl-rol-color) !important;
          box-shadow:
            0 30px 80px -24px var(--gl-rol-color),
            0 0 0 1px color-mix(in srgb, var(--gl-rol-color) 55%, transparent),
            inset 0 0 90px -40px var(--gl-rol-color) !important;
        }
        .gl-rol-card:hover .gl-hero-icono, .gl-rol-card:active .gl-hero-icono {
          filter: drop-shadow(0 0 22px var(--gl-rol-color)) drop-shadow(0 0 40px var(--gl-rol-color)) !important;
          transition: filter .35s ease;
        }
        .gl-rol-card:hover .gl-personaje, .gl-rol-card:active .gl-personaje {
          filter: drop-shadow(0 14px 28px rgba(0,0,0,0.7)) drop-shadow(0 0 26px color-mix(in srgb, var(--gl-rol-color) 70%, transparent)) !important;
          transition: filter .35s ease;
        }

        /* Header de RolHeroCard — todo relativo (%, fr, aspect-ratio, clamp), sin px fijos
           ni position:absolute adivinado. grid-template-areas define el acomodo: TU MISIÓN
           vive en su propia área bajo el texto (columna 1, fila 2), así ya no espera a que
           termine la columna del personaje (que es alta) — se sube y no deja hueco. El
           personaje ("image") ocupa las dos filas de su columna automáticamente porque su
           nombre se repite ahí. En pantallas angostas las áreas se reapilan solas
           (texto → personaje → misión), sin depender del orden real en el DOM. */
        .gl-hero-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(min(100%, 260px), 46%);
          grid-template-areas: "text image" "mision image";
          gap: clamp(4px, 0.8vh, 10px) clamp(14px, 3vw, 24px);
          align-items: start;
        }
        .gl-hero-text { min-width: 0; }
        .gl-hero-personaje-col {
          display: flex; flex-direction: column; align-items: flex-end;
          width: 100%; min-width: 0;
        }
        .gl-hero-tagline { text-align: right; margin-bottom: clamp(3px, 0.7vh, 8px); width: 100%; }
        /* Sin aspect-ratio adivinado: el marco NO tiene alto propio, lo toma de la
           imagen real que vive adentro en flujo normal (width:100%, height:auto en
           .gl-personaje). Así nunca queda hueco vacío, sea el personaje panorámico
           o vertical, y a cualquier ancho de columna — móvil o PC. */
        .gl-personaje-frame { position: relative; width: 100%; line-height: 0; }
        /* Doble tope relativo, mucho más apretado: nunca más ancho que su columna NI
           más alto que ~15% del alto de la ventana (con piso/techo en px para no
           desaparecer en pantallas muy bajas ni desbordar en muy altas). El navegador
           aplica el que gane, la imagen conserva su proporción real. */
        .gl-personaje {
          display: block; max-width: 100%; width: auto; height: auto;
          max-height: clamp(160px, 36vh, 340px);
          margin: 0 0 0 auto; /* alineado a la derecha en escritorio, como el resto del bloque */
          filter: drop-shadow(0 14px 28px rgba(0,0,0,0.7));
        }
        /* TU MISIÓN ya no usa un % adivinado: al vivir en la columna de texto (grid-area
           "mision"), su ancho es naturalmente el de esa columna — más angosta, sin
           estirarse bajo el personaje, y sin dejar hueco arriba. */
        .gl-mision-box { max-width: 100%; }

        /* Debajo de ~560px (tablet chico / móvil) la fila se convierte en una sola
           columna: texto arriba, personaje al centro, misión abajo — mismo orden visual
           de siempre, solo que ahora lo da grid-template-areas en vez del orden del DOM. */
        @media (max-width: 560px) {
          .gl-hero-row { grid-template-columns: 1fr; grid-template-areas: "text" "image" "mision"; }
          .gl-hero-personaje-col { align-items: center; margin-top: 4px; }
          .gl-hero-tagline { text-align: center; }
          .gl-personaje-frame { width: min(72%, 260px); }
          .gl-personaje { margin: 0 auto; max-height: clamp(140px, 26vh, 300px); }
        }

        .gl-stepper::-webkit-scrollbar { height: 4px; }
        .gl-stepper::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        @media (max-width: 520px) {
          .gl-toolbar { flex-direction: column; align-items: stretch !important; }
          .gl-toolbar > * { width: 100% !important; }
        }
      `}</style>

      {vista === 'grid' && (
        <>
          <div className="gl-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 'clamp(8px,1.4vh,14px)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>🔷</div>
              <div>
                <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 14, color: C.gold, letterSpacing: 1.6 }}>
                  ELIGE TU FUNCIÓN
                </div>
                <p style={{ color: C.muted, fontSize: 11, marginTop: 3, maxWidth: 480, lineHeight: 1.4 }}>
                  {puedeAdministrar
                    ? 'Cada pista es un sendero independiente — arma sus estaciones y decide, desde Prompts → Colaboradores con acceso, quién ve cuál. Nadie ve una pista que no le corresponde.'
                    : 'Aquí tienes tu centro de operación. Selecciona el rol con el que estás trabajando.'}
                </p>
              </div>
            </div>

            {puedeAdministrar ? (
              <button onClick={abrirNuevoCurso} style={botonGold(false)}>➕ NUEVA PISTA</button>
            ) : progresoGlobal && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1, color: C.muted, marginBottom: 5 }}>TU PROGRESO GLOBAL</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 150, height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progresoGlobal.pct}%`, background: `linear-gradient(90deg,${C.gold},#9a7a00)`, transition: 'width .3s ease' }} />
                    </div>
                    <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 12, color: C.gold }}>{progresoGlobal.pct}%</span>
                  </div>
                </div>
                <button onClick={abrirAccesoRapido} style={botonGold(false)}>⚡ ACCESO RÁPIDO</button>
              </div>
            )}
          </div>

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
            <div className="gl-hero-grid">
              {cursosVisibles.map(c => (
                <RolHeroCard
                  key={c.id}
                  curso={c}
                  pasos={(pasosPorCurso[c.id] || []).filter(p => p.activo)}
                  recursos={recursosPorCurso[c.id] || []}
                  soporte={soportePorCurso[c.id] || []}
                  puedeAdministrar={puedeAdministrar}
                  onAbrirRuta={abrirCurso}
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