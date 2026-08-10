/**
 * FinanzasAdminPage.jsx — Templo del Propósito
 * Ruta sugerida: /admin/finanzas  (ADMIN — privado, is_admin_user())
 * Bóveda privada de balance: costos de impresión/stickers, aportes y retiros de bolsa.
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

const CATEGORIAS = [
  { id: 'impresion_stickers', label: '🖨️ Impresión de stickers', signo: 'gasto' },
  { id: 'aporte_bolsa',       label: '➕ Aporte a la bolsa',       signo: 'ingreso' },
  { id: 'retiro_bolsa',       label: '➖ Retiro de la bolsa',      signo: 'gasto' },
  { id: 'operativo',          label: '⚙️ Gasto operativo',        signo: 'gasto' },
  { id: 'otro',               label: '📌 Otro',                    signo: null },
];

const fmtMoney = (n) => `$${Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate  = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ══════════════════════════════════════════════════════════════════════════════
export default function FinanzasAdminPage() {
  const [tabActiva,   setTabActiva]   = useState('movimientos');

  const [movimientos, setMovimientos] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [balance,     setBalance]     = useState(0);

  const [aliados,     setAliados]     = useState([]);
  const [porLider,    setPorLider]    = useState([]);
  const [loadingLider,setLoadingLider]= useState(false);

  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    tipo: 'gasto',
    categoria: 'impresion_stickers',
    concepto: '',
    monto: '',
    cantidad_stickers: '',
    aliado_id: '',
    notas: '',
  });
  const [errForm,   setErrForm]   = useState('');
  const [guardando, setGuardando] = useState(false);
  const [borrando,  setBorrando]  = useState(null);

  // ── CSS (fuente Cinzel, igual que el resto del admin) ─────────────────────────
  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@700;900&display=swap');
      @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      input::placeholder, textarea::placeholder { color: rgba(212,175,55,0.25); }
      input:focus, select:focus, textarea:focus { border-color: rgba(212,175,55,0.5) !important; outline: none !important; }
    `;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  // ── Cargar movimientos + balance ───────────────────────────────────────────────
  const cargarMovimientos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('finanzas_balance')
      .select('*, aliados(nombre, slug)')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) {
      setMovimientos(data);
      setBalance(data.length ? data[0].balance_acumulado : 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => { cargarMovimientos(); }, [cargarMovimientos]);

  // ── Cargar aliados (para el selector) + métricas por líder ────────────────────
  const cargarAliados = useCallback(async () => {
    const { data } = await supabase.from('aliados').select('id, nombre, slug, rol').order('nombre');
    setAliados(data || []);
  }, []);

  const cargarPorLider = useCallback(async () => {
    setLoadingLider(true);
    const { data } = await supabase
      .from('finanzas_stickers_por_aliado')
      .select('*')
      .gt('total_stickers', 0)
      .order('total_stickers', { ascending: false });
    setPorLider(data || []);
    setLoadingLider(false);
  }, []);

  useEffect(() => {
    cargarAliados();
    if (tabActiva === 'porlider') cargarPorLider();
  }, [tabActiva, cargarAliados, cargarPorLider]);

  // ── Crear movimiento ────────────────────────────────────────────────────────
  const crearMovimiento = async () => {
    if (!form.concepto.trim()) { setErrForm('Escribe un concepto.'); return; }
    const monto = Number(form.monto);
    if (!monto || monto <= 0) { setErrForm('El monto debe ser mayor a 0.'); return; }
    const cantidadStickers = form.cantidad_stickers === '' ? null : Number(form.cantidad_stickers);
    if (cantidadStickers !== null && cantidadStickers <= 0) { setErrForm('La cantidad de stickers debe ser mayor a 0.'); return; }

    setErrForm('');
    setGuardando(true);

    const { error } = await supabase.from('finanzas_privadas').insert({
      fecha: form.fecha,
      tipo: form.tipo,
      categoria: form.categoria,
      concepto: form.concepto.trim(),
      monto,
      cantidad_stickers: cantidadStickers,
      aliado_id: form.aliado_id || null,
      notas: form.notas.trim() || null,
    });

    setGuardando(false);
    if (error) { setErrForm('No se pudo guardar. Intenta de nuevo.'); return; }

    setForm({
      fecha: new Date().toISOString().slice(0, 10),
      tipo: 'gasto',
      categoria: 'impresion_stickers',
      concepto: '',
      monto: '',
      cantidad_stickers: '',
      aliado_id: '',
      notas: '',
    });
    cargarMovimientos();
    if (tabActiva === 'porlider') cargarPorLider();
  };

  // ── Borrar movimiento ───────────────────────────────────────────────────────
  const borrarMovimiento = async (id) => {
    if (!window.confirm('¿Borrar este movimiento? No se puede deshacer.')) return;
    setBorrando(id);
    const { error } = await supabase.from('finanzas_privadas').delete().eq('id', id);
    setBorrando(null);
    if (error) { alert('No se pudo borrar.'); return; }
    cargarMovimientos();
    if (tabActiva === 'porlider') cargarPorLider();
  };

  const mostrarStickers = form.categoria === 'impresion_stickers';

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 'clamp(20px,4vw,40px)', fontFamily: 'sans-serif' }}>

      {/* Cabecera */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 5, color: C.goldDim, marginBottom: 6 }}>
          TEMPLO DEL PROPÓSITO · ADMIN PRIVADO
        </div>
        <h1 style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 900, fontSize: 'clamp(20px,4vw,32px)', color: C.gold, margin: 0, letterSpacing: 2 }}>
          🔐 BÓVEDA DE FINANZAS
        </h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 8, fontStyle: 'italic' }}>
          Costos de impresión, stickers y movimientos de la bolsa — solo visible para administradores.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          {[
            { id: 'movimientos', label: '📒 MOVIMIENTOS' },
            { id: 'porlider',    label: '🎯 STICKERS POR LÍDER' },
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

      {/* ══ BALANCE HERO ══ */}
      <div style={{
        background: `linear-gradient(135deg, rgba(212,175,55,0.08), rgba(155,89,255,0.06))`,
        border: `1.5px solid ${C.borderHi}`, borderRadius: 20,
        padding: 'clamp(24px,5vw,36px)', marginBottom: 28, textAlign: 'center',
        boxShadow: '0 0 60px rgba(212,175,55,0.08)',
      }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 4, color: C.goldDim, marginBottom: 10 }}>
          BALANCE ACTUAL DE LA BOLSA
        </div>
        <div style={{
          fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
          fontSize: 'clamp(32px,7vw,52px)',
          color: balance >= 0 ? C.gold : C.red,
          letterSpacing: 2,
        }}>
          {fmtMoney(balance)}
        </div>
        <div style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>
          Calculado en automático: suma de ingresos menos gastos, hasta el movimiento más reciente.
        </div>
      </div>

      {tabActiva === 'movimientos' && (<>

        {/* ══ FORM: nuevo movimiento ══ */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 'clamp(18px,4vw,24px)', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 13, letterSpacing: 2, color: C.gold, margin: '0 0 16px' }}>
            + NUEVO MOVIMIENTO
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={lbl}>FECHA</label>
              <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} style={inp} />
            </div>

            <div>
              <label style={lbl}>TIPO</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={inp}>
                <option value="gasto">🔻 Gasto (sale dinero)</option>
                <option value="ingreso">🔺 Ingreso (entra dinero)</option>
              </select>
            </div>

            <div>
              <label style={lbl}>CATEGORÍA</label>
              <select
                value={form.categoria}
                onChange={e => {
                  const cat = CATEGORIAS.find(c => c.id === e.target.value);
                  setForm(f => ({ ...f, categoria: e.target.value, tipo: cat?.signo || f.tipo }));
                }}
                style={inp}
              >
                {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label style={lbl}>MONTO (MXN)</label>
              <input type="number" step="0.01" placeholder="0.00" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} style={inp} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={lbl}>CONCEPTO</label>
              <input type="text" placeholder="Ej. Impresión sticker lote 3 — Rappi Saltillo" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} style={inp} />
            </div>

            {mostrarStickers && (
              <div>
                <label style={lbl}>CANTIDAD DE STICKERS</label>
                <input type="number" placeholder="Ej. 100" value={form.cantidad_stickers} onChange={e => setForm(f => ({ ...f, cantidad_stickers: e.target.value }))} style={inp} />
                {form.monto && form.cantidad_stickers > 0 && (
                  <div style={{ fontSize: 10, color: C.goldDim, marginTop: 4 }}>
                    Costo por sticker: {fmtMoney(Number(form.monto) / Number(form.cantidad_stickers))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={lbl}>LÍDER / GERENTE (opcional)</label>
              <select value={form.aliado_id} onChange={e => setForm(f => ({ ...f, aliado_id: e.target.value }))} style={inp}>
                <option value="">— Ninguno / general —</option>
                {aliados.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>NOTAS (opcional)</label>
            <textarea rows={2} placeholder="Detalles extra..." value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} style={{ ...inp, resize: 'vertical', fontFamily: 'sans-serif' }} />
          </div>

          {errForm && <div style={{ color: C.red, fontSize: 12, marginBottom: 10 }}>{errForm}</div>}

          <button
            onClick={crearMovimiento}
            disabled={guardando}
            style={{
              padding: '12px 28px',
              background: `linear-gradient(135deg,${C.gold},#9a7a00)`,
              border: 'none', borderRadius: 10, cursor: guardando ? 'default' : 'pointer',
              color: '#0a0614', fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: 2, fontWeight: 900,
              opacity: guardando ? 0.6 : 1,
            }}
          >
            {guardando ? 'GUARDANDO...' : '✓ REGISTRAR MOVIMIENTO'}
          </button>
        </div>

        {/* ══ LISTA de movimientos ══ */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 'clamp(18px,4vw,24px)' }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 13, letterSpacing: 2, color: C.gold, margin: '0 0 16px' }}>
            HISTORIAL ({movimientos.length})
          </h2>

          {loading ? (
            <p style={{ color: C.muted, fontSize: 12 }}>Cargando...</p>
          ) : movimientos.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 12 }}>Todavía no hay movimientos registrados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {movimientos.map(m => {
                const cat = CATEGORIAS.find(c => c.id === m.categoria);
                const esIngreso = m.tipo === 'ingreso';
                return (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                    background: 'rgba(255,255,255,0.03)', border: `1px solid ${esIngreso ? 'rgba(68,255,136,0.15)' : 'rgba(255,68,102,0.12)'}`,
                    borderRadius: 12, padding: '12px 16px', animation: 'fadeIn .2s ease both',
                  }}>
                    <div style={{ minWidth: 200, flex: 1 }}>
                      <div style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: C.text, fontWeight: 700 }}>
                        {cat?.label.split(' ').slice(1).join(' ') || m.categoria} — {m.concepto}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>
                        {fmtDate(m.fecha)}
                        {m.aliados?.nombre && ` · 🎯 ${m.aliados.nombre}`}
                        {m.cantidad_stickers && ` · ${m.cantidad_stickers} stickers · ${fmtMoney(m.costo_unitario)}/u`}
                        {m.notas && ` · ${m.notas}`}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 14, color: esIngreso ? C.green : C.red }}>
                        {esIngreso ? '+' : '−'}{fmtMoney(m.monto)}
                      </div>
                      <div style={{ fontSize: 9, color: C.muted }}>saldo: {fmtMoney(m.balance_acumulado)}</div>
                    </div>

                    <button
                      onClick={() => borrarMovimiento(m.id)}
                      disabled={borrando === m.id}
                      style={{
                        padding: '6px 10px', background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.25)',
                        borderRadius: 8, color: C.red, fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1, cursor: 'pointer',
                      }}
                    >
                      {borrando === m.id ? '...' : '🗑'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>)}

      {/* ══ TAB: STICKERS POR LÍDER ══ */}
      {tabActiva === 'porlider' && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 'clamp(18px,4vw,24px)' }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 13, letterSpacing: 2, color: C.gold, margin: '0 0 16px' }}>
            🎯 STICKERS IMPRESOS POR LÍDER
          </h2>

          {loadingLider ? (
            <p style={{ color: C.muted, fontSize: 12 }}>Cargando...</p>
          ) : porLider.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 12 }}>Todavía no hay impresiones registradas con un líder asignado.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {porLider.map(p => (
                <div key={p.aliado_id} style={{
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 14, padding: 18,
                }}>
                  <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 14, color: C.gold, letterSpacing: 1 }}>
                    {p.nombre}
                  </div>
                  <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>{p.rol || 'sin rol'}</div>

                  <div style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 900, fontSize: 26, color: C.purple }}>
                    {p.total_stickers}
                  </div>
                  <div style={{ fontSize: 9, color: C.muted, marginBottom: 10 }}>STICKERS TOTALES</div>

                  <div style={{ fontSize: 11, color: C.text }}>Gastado en impresión: <b>{fmtMoney(p.total_gastado_impresion)}</b></div>
                  <div style={{ fontSize: 11, color: C.text }}>Ocasiones: <b>{p.total_ocasiones_impresion}</b></div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Última impresión: {fmtDate(p.ultima_impresion)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const lbl = { display: 'block', fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1.5, color: C.muted, marginBottom: 5 };
const inp = {
  width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.03)',
  border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13,
  boxSizing: 'border-box',
};