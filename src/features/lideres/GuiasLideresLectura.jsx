/**
 * GuiasLideresLectura.jsx — Templo del Propósito
 * Pensado como una PESTAÑA/SECCIÓN dentro de la página que ya existe en
 * /lider (donde el aliado entra con su codigo_acceso). NO es una pantalla
 * de login nueva ni pide contraseña — usa la sesión de líder que ya está
 * abierta. Si se desactiva al aliado (activo=false en `aliados`), pierde
 * acceso a /lider completo, y por lo tanto a esta sección también.
 *
 * OJO — pieza pendiente de conectar (ver nota al final del archivo):
 * este componente necesita que le lleguen las guías ya cargadas, o una
 * función `cargarGuias` que sepa validar la sesión de líder actual —
 * exactamente igual a como el resto de /lider ya carga sus propios datos
 * (métricas, sellos, etc.). No inventé esa parte porque no vi el archivo
 * de la página de líder — ver nota al final.
 */

import { useState, useMemo } from 'react';

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
};

function copiarAlPortapapeles(texto) {
  navigator.clipboard?.writeText(texto).catch(() => {});
}

// ── Tarjeta de guía (solo lectura, sin editar/borrar) ─────────────────────────
function GuiaCardLectura({ guia, onCopiar, copiado }) {
  const [expandido, setExpandido] = useState(false);
  const esLargo = guia.contenido.length > 220;
  const textoMostrado = expandido || !esLargo ? guia.contenido : guia.contenido.slice(0, 220) + '…';

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: '18px 18px 14px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
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

      <button
        onClick={() => onCopiar(guia)}
        style={{
          padding: '10px 14px', marginTop: 4,
          background: copiado ? 'rgba(68,255,136,0.14)' : 'rgba(212,175,55,0.1)',
          border: `1px solid ${copiado ? 'rgba(68,255,136,0.4)' : C.border}`,
          borderRadius: 8, color: copiado ? C.green : C.gold,
          fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 1.5, fontWeight: 900, cursor: 'pointer',
        }}
      >{copiado ? '✓ COPIADO' : '📋 COPIAR'}</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Recibe `guias` ya cargadas por la página de líder (ver nota al final del
// archivo sobre cómo conectar esa carga a su sistema real de sesión).
export default function GuiasLideresLectura({ guias = [] }) {
  const [busqueda, setBusqueda]         = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [copiadoId, setCopiadoId]       = useState('');

  const visibles = useMemo(() => guias.filter(g => g.activo !== false), [guias]);
  const categorias = useMemo(() => [...new Set(visibles.map(g => g.categoria))].sort(), [visibles]);

  const guiasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return visibles.filter(g => {
      if (filtroCategoria !== 'todas' && g.categoria !== filtroCategoria) return false;
      if (!q) return true;
      return (
        g.titulo.toLowerCase().includes(q) ||
        g.contenido.toLowerCase().includes(q) ||
        g.categoria.toLowerCase().includes(q) ||
        (g.notas || '').toLowerCase().includes(q)
      );
    });
  }, [visibles, busqueda, filtroCategoria]);

  function copiar(guia) {
    copiarAlPortapapeles(guia.contenido);
    setCopiadoId(guia.id);
    setTimeout(() => setCopiadoId(''), 1400);
  }

  return (
    <div>
      <style>{`
        .gll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 16px; }
        .gll-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
      `}</style>

      <div style={{ marginBottom: 18, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 16, color: C.gold, letterSpacing: 2 }}>
          🗺️ TUS GUÍAS Y ACCESOS
        </div>
        <p style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>
          Busca lo que necesitas y cópialo. Se actualiza sola — no necesitas hacer nada más.
        </p>
      </div>

      <input
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="🔍 Buscar por título, contenido o categoría…"
        style={{
          width: '100%', boxSizing: 'border-box', padding: '12px 14px', marginBottom: 16,
          background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
          borderRadius: 10, color: C.text, fontSize: 13,
        }}
      />

      <div className="gll-chips">
        <button onClick={() => setFiltroCategoria('todas')} style={chipStyle(filtroCategoria === 'todas')}>
          TODAS ({visibles.length})
        </button>
        {categorias.map(cat => (
          <button key={cat} onClick={() => setFiltroCategoria(cat)} style={chipStyle(filtroCategoria === cat)}>
            {cat} ({visibles.filter(g => g.categoria === cat).length})
          </button>
        ))}
      </div>

      {guiasFiltradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: C.muted }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>📭</div>
          <p style={{ fontSize: 12.5 }}>
            {visibles.length === 0 ? 'Todavía no hay guías cargadas.' : 'No hay guías que coincidan con tu búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="gll-grid">
          {guiasFiltradas.map(g => (
            <GuiaCardLectura key={g.id} guia={g} onCopiar={copiar} copiado={copiadoId === g.id} />
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

/**
 * NOTA — lo único que falta para que esto quede 100% conectado:
 *
 * No vi el archivo de la página que se muestra después de entrar a /lider
 * con el codigo_acceso, así que no sé si esa página:
 *   a) ya guarda los datos del aliado logueado en memoria/contexto, y
 *      solo hace falta un `supabase.from('guias_lideres').select('*')`
 *      protegido por RLS (política: cualquiera con sesión de líder activa
 *      puede leer), o
 *   b) usa una Edge Function tipo `lider-login` (como
 *      prompts-biblioteca-colaborador, pero validando el codigo_acceso
 *      individual en vez de una contraseña compartida) que regresa los
 *      datos del líder — en cuyo caso esa misma función solo necesita
 *      agregar `guias_lideres` a lo que ya devuelve.
 *
 * Pásame ese archivo (la página de /lider) y te dejo el `cargarGuias()`
 * exacto, sin inventar cómo se valida la sesión.
 */