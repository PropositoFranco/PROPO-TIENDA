/**
 * LtvComisionesTab.jsx — Templo del Propósito
 * Tab "💰 LTV / COMISIONES" dentro de SorteoAdminPage (/admin/sorteos)
 *
 * Fuente de datos: vista `v_aliado_resumen` + funciones `fn_aliado_usuarios`
 * y `fn_usuario_transacciones` (todas admin-only vía RLS, ver migraciones
 * indice_ltv_aliado_momento_pago / vista_resumen_ltv_aliado /
 * fn_ltv_usuarios_y_transacciones_por_aliado / sellado_seguridad_ltv_dashboard).
 *
 * No modifica ninguna tabla — todo es lectura.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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

// ── Formateo ─────────────────────────────────────────────────────────────────
const fmtMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' }) : '—';

const fmtDateHora = (iso) =>
  iso ? new Date(iso).toLocaleString('es-MX', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

const TIPO_LABEL = {
  membresia_inicial:     'Membresía inicial',
  membresia_renovacion:  'Renovación mensual',
  cristales:              'Cristales',
  arsenal:                'Arsenal',
  oferta:                 'Oferta',
  causa:                  'Causa (donativo)',
  otro:                   'Otro',
};

function statCardStyle(destacado) {
  return {
    background: C.card,
    border: `1px solid ${destacado ? C.borderHi : C.border}`,
    borderRadius: 12,
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 150,
    flex: '1 1 150px',
  };
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={statCardStyle(false)}>
      <span style={{ fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 2, color: C.goldDim }}>{label}</span>
      <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 20, color: color || C.text }}>{value}</span>
      {sub && <span style={{ fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 1, color: C.muted }}>{sub}</span>}
    </div>
  );
}

function descargarCSV(filename, rows, columns) {
  const header = columns.map(c => `"${c.label}"`).join(',');
  const body = rows.map(r => columns.map(c => {
    const v = c.get(r);
    return `"${String(v ?? '').replace(/"/g, '""')}"`;
  }).join(',')).join('\n');
  const csv = `${header}\n${body}`;
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════════════════════════
export default function LtvComisionesTab() {
  const [resumenTodos,      setResumenTodos]      = useState([]);
  const [loadingResumen,    setLoadingResumen]    = useState(true);
  const [errResumen,        setErrResumen]        = useState('');

  const [aliadoSelId,       setAliadoSelId]       = useState('');
  const [desde,             setDesde]             = useState('');
  const [hasta,             setHasta]             = useState('');
  const [busqueda,          setBusqueda]          = useState('');

  const [usuarios,          setUsuarios]          = useState([]);
  const [loadingUsuarios,   setLoadingUsuarios]   = useState(false);
  const [errUsuarios,       setErrUsuarios]       = useState('');

  const [expandido,         setExpandido]         = useState(null); // user_id expandido
  const [cargosPorUsuario,  setCargosPorUsuario]  = useState({});   // { user_id: [rows] }
  const [loadingCargos,     setLoadingCargos]     = useState(null); // user_id en carga

  // ── Cargar resumen de TODOS los aliados con comisión ─────────────────────────
  const cargarResumenTodos = useCallback(async () => {
    setLoadingResumen(true);
    setErrResumen('');
    const { data, error } = await supabase
      .from('v_aliado_resumen')
      .select('*')
      .order('comision_generada_total', { ascending: false });
    if (error) {
      setErrResumen('No se pudo cargar el resumen. Intenta de nuevo.');
      setResumenTodos([]);
    } else {
      setResumenTodos(data || []);
    }
    setLoadingResumen(false);
  }, []);

  useEffect(() => { cargarResumenTodos(); }, [cargarResumenTodos]);

  // ── Cargar usuarios del aliado seleccionado (con filtro de fecha) ────────────
  const cargarUsuarios = useCallback(async (aliadoId, desdeVal, hastaVal) => {
    if (!aliadoId) { setUsuarios([]); return; }
    setLoadingUsuarios(true);
    setErrUsuarios('');
    setExpandido(null);
    const { data, error } = await supabase.rpc('fn_aliado_usuarios', {
      p_aliado_id: aliadoId,
      p_desde: desdeVal ? new Date(desdeVal).toISOString() : null,
      p_hasta: hastaVal ? new Date(`${hastaVal}T23:59:59`).toISOString() : null,
    });
    if (error) {
      setErrUsuarios('No se pudo cargar el detalle de usuarios. Intenta de nuevo.');
      setUsuarios([]);
    } else {
      setUsuarios(data || []);
    }
    setLoadingUsuarios(false);
  }, []);

  useEffect(() => {
    if (aliadoSelId) cargarUsuarios(aliadoSelId, desde, hasta);
  }, [aliadoSelId, desde, hasta, cargarUsuarios]);

  // ── Expandir usuario → cargar sus cargos individuales (lazy, con caché) ──────
  const toggleExpandir = async (userId) => {
    if (expandido === userId) { setExpandido(null); return; }
    setExpandido(userId);
    if (cargosPorUsuario[userId]) return; // ya en caché
    setLoadingCargos(userId);
    const { data, error } = await supabase.rpc('fn_usuario_transacciones', { p_user_id: userId });
    setLoadingCargos(null);
    if (!error) {
      setCargosPorUsuario(prev => ({ ...prev, [userId]: data || [] }));
    }
  };

  const aliadoSel = useMemo(
    () => resumenTodos.find(a => a.aliado_id === aliadoSelId) || null,
    [resumenTodos, aliadoSelId]
  );

  const usuariosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return usuarios;
    const q = busqueda.trim().toLowerCase();
    return usuarios.filter(u =>
      (u.nombre_mostrar || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  }, [usuarios, busqueda]);

  const totalGeneral = useMemo(() => {
    return resumenTodos.reduce((acc, a) => ({
      bruto:      acc.bruto + Number(a.total_bruto || 0),
      neto:       acc.neto + Number(a.total_neto || 0),
      comision:   acc.comision + Number(a.comision_generada_total || 0),
      pendiente:  acc.pendiente + Number(a.comision_pendiente || 0),
      usuarios:   acc.usuarios + Number(a.total_usuarios_atribuidos || 0),
    }), { bruto: 0, neto: 0, comision: 0, pendiente: 0, usuarios: 0 });
  }, [resumenTodos]);

  const exportarUsuariosCSV = () => {
    if (!aliadoSel || usuariosFiltrados.length === 0) return;
    descargarCSV(`ltv-${aliadoSel.slug}-${new Date().toISOString().slice(0, 10)}.csv`, usuariosFiltrados, [
      { label: 'Usuario',            get: r => r.nombre_mostrar },
      { label: 'Email',              get: r => r.email },
      { label: 'Fecha registro',     get: r => fmtDate(r.fecha_registro) },
      { label: 'Fecha primer pago',  get: r => fmtDate(r.fecha_primer_pago) },
      { label: 'Días como cliente',  get: r => r.dias_como_cliente ?? '' },
      { label: '# Transacciones',    get: r => r.total_transacciones },
      { label: 'Total bruto',        get: r => Number(r.total_bruto || 0).toFixed(2) },
      { label: 'Total neto',         get: r => Number(r.total_neto || 0).toFixed(2) },
      { label: 'Comisión generada',  get: r => Number(r.comision_generada || 0).toFixed(2) },
      { label: 'Estatus membresía',  get: r => r.membership_status },
      { label: 'Tipo membresía',     get: r => r.membership_type },
      { label: 'Ventana atribución', get: r => r.esta_en_ventana ? 'Vigente' : 'Vencida' },
    ]);
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Cabecera de la tab */}
      <div>
        <h2 style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 900, fontSize: 18, color: C.gold, margin: '0 0 6px', letterSpacing: 1 }}>
          💰 LTV & COMISIONES POR LÍDER
        </h2>
        <p style={{ color: C.muted, fontSize: 12, fontStyle: 'italic', margin: 0 }}>
          Trazabilidad completa: cuánto trajo cada líder, cuánto han gastado sus usuarios en el tiempo, y cuánta comisión se le debe.
        </p>
      </div>

      {/* Totales globales */}
      {!loadingResumen && resumenTodos.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <StatCard label="LÍDERES/GERENTES" value={resumenTodos.length} />
          <StatCard label="USUARIOS ATRIBUIDOS (TODOS)" value={totalGeneral.usuarios} />
          <StatCard label="BRUTO TOTAL (TODOS)" value={fmtMoney(totalGeneral.bruto)} />
          <StatCard label="NETO TOTAL (TODOS)" value={fmtMoney(totalGeneral.neto)} color={C.green} />
          <StatCard label="COMISIÓN GENERADA (TODOS)" value={fmtMoney(totalGeneral.comision)} color={C.purple} />
          <StatCard label="COMISIÓN PENDIENTE (TODOS)" value={fmtMoney(totalGeneral.pendiente)} color={C.red} />
        </div>
      )}

      {/* Tabla comparativa de todos los líderes */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
        <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 12, letterSpacing: 2, color: C.goldDim, margin: '0 0 14px' }}>
          RANKING DE LÍDERES — click para ver el detalle
        </h3>

        {loadingResumen ? (
          <p style={{ color: C.goldDim, fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 2, textAlign: 'center', padding: 20, animation: 'pulse 1.5s ease-in-out infinite' }}>
            CARGANDO...
          </p>
        ) : errResumen ? (
          <p style={{ color: C.red, fontFamily: 'Cinzel, serif', fontSize: 11, textAlign: 'center', padding: 20 }}>⚠ {errResumen}</p>
        ) : resumenTodos.length === 0 ? (
          <p style={{ color: C.muted, fontSize: 12, textAlign: 'center', padding: 20, fontStyle: 'italic' }}>
            Aún no hay aliados con rol de comisión configurado.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['LÍDER', 'ROL', '%', 'USUARIOS', 'CON PAGO', 'BRUTO', 'NETO', 'COMISIÓN', 'PAGADA', 'PENDIENTE', 'LTV PROM.'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 1, color: C.goldDim, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resumenTodos.map(a => (
                  <tr
                    key={a.aliado_id}
                    onClick={() => setAliadoSelId(a.aliado_id)}
                    style={{
                      borderBottom: `1px solid rgba(255,255,255,0.04)`,
                      cursor: 'pointer',
                      background: aliadoSelId === a.aliado_id ? 'rgba(212,175,55,0.08)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '9px 10px', fontFamily: 'Cinzel, serif', fontWeight: 700, color: C.gold, whiteSpace: 'nowrap' }}>{a.nombre}</td>
                    <td style={{ padding: '9px 10px', color: C.muted, whiteSpace: 'nowrap' }}>{a.rol || '—'}</td>
                    <td style={{ padding: '9px 10px', color: C.text }}>{a.comision_pct != null ? `${a.comision_pct}%` : '—'}</td>
                    <td style={{ padding: '9px 10px', color: C.text }}>{a.total_usuarios_atribuidos}</td>
                    <td style={{ padding: '9px 10px', color: C.text }}>{a.usuarios_con_pago}</td>
                    <td style={{ padding: '9px 10px', color: C.text, whiteSpace: 'nowrap' }}>{fmtMoney(a.total_bruto)}</td>
                    <td style={{ padding: '9px 10px', color: C.green, whiteSpace: 'nowrap' }}>{fmtMoney(a.total_neto)}</td>
                    <td style={{ padding: '9px 10px', color: C.purple, whiteSpace: 'nowrap', fontWeight: 700 }}>{fmtMoney(a.comision_generada_total)}</td>
                    <td style={{ padding: '9px 10px', color: C.muted, whiteSpace: 'nowrap' }}>{fmtMoney(a.comision_pagada)}</td>
                    <td style={{ padding: '9px 10px', color: C.red, whiteSpace: 'nowrap' }}>{fmtMoney(a.comision_pendiente)}</td>
                    <td style={{ padding: '9px 10px', color: C.text, whiteSpace: 'nowrap' }}>{fmtMoney(a.ltv_promedio_neto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detalle del líder seleccionado */}
      {aliadoSel && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn .3s ease both' }}>

          <div style={{ background: C.card, border: `1.5px solid ${C.borderHi}`, borderRadius: 16, padding: 'clamp(18px,3vw,24px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 3, color: C.goldDim, marginBottom: 4 }}>
                  {aliadoSel.rol ? aliadoSel.rol.toUpperCase() : 'ALIADO'} · /{aliadoSel.slug}
                </div>
                <h3 style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 900, fontSize: 20, color: C.gold, margin: 0 }}>
                  {aliadoSel.nombre}
                </h3>
                {aliadoSel.manager_nombre && (
                  <p style={{ color: C.muted, fontSize: 11, margin: '6px 0 0' }}>Reporta a: <span style={{ color: C.text }}>{aliadoSel.manager_nombre}</span></p>
                )}
              </div>
              <button
                onClick={() => setAliadoSelId('')}
                style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 7, color: C.muted, fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1, cursor: 'pointer' }}
              >
                ✕ CERRAR
              </button>
            </div>

            {/* Stats del líder */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
              <StatCard label="% COMISIÓN FIJO" value={aliadoSel.comision_pct != null ? `${aliadoSel.comision_pct}%` : '—'} sub={aliadoSel.comision_activa ? 'Activa' : 'Inactiva'} color={aliadoSel.comision_activa ? C.green : C.red} />
              <StatCard label="USUARIOS ATRIBUIDOS" value={aliadoSel.total_usuarios_atribuidos} sub={`${aliadoSel.usuarios_con_pago} con pago`} />
              <StatCard label="TOTAL BRUTO" value={fmtMoney(aliadoSel.total_bruto)} />
              <StatCard label="TOTAL NETO" value={fmtMoney(aliadoSel.total_neto)} color={C.green} sub={`fee Stripe: ${fmtMoney(aliadoSel.total_fee_stripe)}`} />
              <StatCard label="LTV PROMEDIO / USUARIO" value={fmtMoney(aliadoSel.ltv_promedio_neto)} />
              <StatCard label="COMISIÓN GENERADA" value={fmtMoney(aliadoSel.comision_generada_total)} color={C.purple} />
              <StatCard label="COMISIÓN PAGADA" value={fmtMoney(aliadoSel.comision_pagada)} color={C.green} />
              <StatCard label="COMISIÓN PENDIENTE" value={fmtMoney(aliadoSel.comision_pendiente)} color={C.red} />
              <StatCard label="PRIMER PAGO" value={fmtDate(aliadoSel.primer_pago_at)} />
              <StatCard label="ÚLTIMO PAGO" value={fmtDate(aliadoSel.ultimo_pago_at)} />
              {Number(aliadoSel.total_donativos_causa) > 0 && (
                <StatCard label="DONATIVOS 'CAUSA' (NO GENERA COMISIÓN)" value={fmtMoney(aliadoSel.total_donativos_causa)} sub="Informativo — excluido del LTV/comisión" />
              )}
              {aliadoSel.rol === 'gerente' && (
                <>
                  <StatCard label="COMISIÓN COMO DIRECTO" value={fmtMoney(aliadoSel.comision_generada_como_directo)} />
                  <StatCard label="COMISIÓN COMO GERENTE (2do nivel)" value={fmtMoney(aliadoSel.comision_generada_como_gerente)} />
                </>
              )}
            </div>
          </div>

          {/* Filtros: fecha + búsqueda + export */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 2, color: C.goldDim, marginBottom: 6 }}>DESDE</label>
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                style={{ padding: '8px 10px', background: '#07040f', border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, fontFamily: 'monospace', fontSize: 11 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 2, color: C.goldDim, marginBottom: 6 }}>HASTA</label>
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                style={{ padding: '8px 10px', background: '#07040f', border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, fontFamily: 'monospace', fontSize: 11 }} />
            </div>
            {(desde || hasta) && (
              <button onClick={() => { setDesde(''); setHasta(''); }}
                style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 7, color: C.muted, fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1, cursor: 'pointer' }}>
                LIMPIAR FECHAS
              </button>
            )}
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ display: 'block', fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 2, color: C.goldDim, marginBottom: 6 }}>BUSCAR USUARIO</label>
              <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Nombre o email..."
                style={{ width: '100%', padding: '8px 12px', background: '#07040f', border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, fontFamily: 'Cinzel, serif', fontSize: 11 }} />
            </div>
            <button
              onClick={exportarUsuariosCSV}
              disabled={usuariosFiltrados.length === 0}
              style={{ padding: '9px 18px', background: usuariosFiltrados.length === 0 ? 'rgba(255,255,255,0.03)' : `linear-gradient(135deg,${C.gold},#9a7a00)`, border: 'none', borderRadius: 8, color: usuariosFiltrados.length === 0 ? C.muted : '#0a0614', fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 1, fontWeight: 900, cursor: usuariosFiltrados.length === 0 ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
            >
              ⬇ EXPORTAR CSV
            </button>
          </div>

          {/* Tabla de usuarios del líder */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 12, letterSpacing: 2, color: C.goldDim, margin: '0 0 14px' }}>
              USUARIOS DE {aliadoSel.nombre.toUpperCase()} ({usuariosFiltrados.length})
            </h3>

            {loadingUsuarios ? (
              <p style={{ color: C.goldDim, fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 2, textAlign: 'center', padding: 20, animation: 'pulse 1.5s ease-in-out infinite' }}>
                CARGANDO USUARIOS...
              </p>
            ) : errUsuarios ? (
              <p style={{ color: C.red, fontFamily: 'Cinzel, serif', fontSize: 11, textAlign: 'center', padding: 20 }}>⚠ {errUsuarios}</p>
            ) : usuariosFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>👤</div>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: 1 }}>
                  {usuarios.length === 0 ? 'Este líder aún no tiene usuarios atribuidos.' : 'Nada coincide con la búsqueda.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {usuariosFiltrados.map(u => {
                  const abierto = expandido === u.user_id;
                  const cargos = cargosPorUsuario[u.user_id] || [];
                  return (
                    <div key={u.user_id} style={{ border: `1px solid ${abierto ? C.borderHi : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, overflow: 'hidden' }}>
                      <div
                        onClick={() => toggleExpandir(u.user_id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', cursor: 'pointer', flexWrap: 'wrap', background: abierto ? 'rgba(212,175,55,0.06)' : 'transparent' }}
                      >
                        <span style={{ color: C.goldDim, fontSize: 12, width: 14 }}>{abierto ? '▾' : '▸'}</span>
                        <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                          <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 12, color: C.text }}>{u.nombre_mostrar || '(sin nombre)'}</div>
                          <div style={{ fontSize: 10, color: C.muted }}>{u.email}</div>
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, minWidth: 90 }}>
                          Registro<br /><span style={{ color: C.text }}>{fmtDate(u.fecha_registro)}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, minWidth: 90 }}>
                          1er pago<br /><span style={{ color: C.text }}>{fmtDate(u.fecha_primer_pago)}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, minWidth: 70 }}>
                          Días cliente<br /><span style={{ color: C.text }}>{u.dias_como_cliente ?? '—'}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, minWidth: 60 }}>
                          Cargos<br /><span style={{ color: C.text }}>{u.total_transacciones}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, minWidth: 90 }}>
                          Total neto<br /><span style={{ color: C.green, fontWeight: 700 }}>{fmtMoney(u.total_neto)}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, minWidth: 100 }}>
                          Comisión gen.<br /><span style={{ color: C.purple, fontWeight: 700 }}>{fmtMoney(u.comision_generada)}</span>
                        </div>
                        <div style={{ minWidth: 90 }}>
                          <span style={{
                            fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 1,
                            color: u.membership_status === 'active' ? C.green : C.muted,
                            border: `1px solid ${u.membership_status === 'active' ? 'rgba(68,255,136,0.3)' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: 20, padding: '3px 9px',
                          }}>
                            {u.membership_status === 'active' ? '● ACTIVA' : (u.membership_status || 'inactive').toUpperCase()}
                          </span>
                        </div>
                        <div style={{ minWidth: 90 }}>
                          <span style={{
                            fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 1,
                            color: u.esta_en_ventana ? C.green : C.red,
                          }}>
                            {u.esta_en_ventana ? '✓ atribución vigente' : '✕ atribución vencida'}
                          </span>
                        </div>
                      </div>

                      {abierto && (
                        <div style={{ padding: '4px 16px 14px', borderTop: `1px solid rgba(255,255,255,0.06)` }}>
                          {loadingCargos === u.user_id ? (
                            <p style={{ color: C.goldDim, fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 2, padding: 12, textAlign: 'center' }}>CARGANDO CARGOS...</p>
                          ) : cargos.length === 0 ? (
                            <p style={{ color: C.muted, fontSize: 11, padding: 12, textAlign: 'center', fontStyle: 'italic' }}>Sin cargos registrados.</p>
                          ) : (
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginTop: 8 }}>
                                <thead>
                                  <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
                                    {['FECHA', 'TIPO', 'BRUTO', 'NETO', 'FEE STRIPE', 'COM. DIRECTO', 'COM. GERENTE', 'ESTATUS'].map(h => (
                                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontFamily: 'Cinzel, serif', fontSize: 7, letterSpacing: 1, color: C.goldDim, whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {cargos.map(c => (
                                    <tr key={c.transaccion_id} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                                      <td style={{ padding: '6px 8px', color: C.text, whiteSpace: 'nowrap' }}>{fmtDateHora(c.created_at)}</td>
                                      <td style={{ padding: '6px 8px', color: c.tipo === 'causa' ? C.muted : C.text, whiteSpace: 'nowrap' }}>{TIPO_LABEL[c.tipo] || c.tipo}</td>
                                      <td style={{ padding: '6px 8px', color: C.text, whiteSpace: 'nowrap' }}>{fmtMoney(c.monto_bruto)}</td>
                                      <td style={{ padding: '6px 8px', color: C.green, whiteSpace: 'nowrap' }}>{fmtMoney(c.monto_neto)}</td>
                                      <td style={{ padding: '6px 8px', color: C.muted, whiteSpace: 'nowrap' }}>{c.stripe_fee != null ? fmtMoney(c.stripe_fee) : '—'}</td>
                                      <td style={{ padding: '6px 8px', color: c.comision_directo ? C.purple : C.muted, whiteSpace: 'nowrap' }}>{c.comision_directo ? fmtMoney(c.comision_directo) : '—'}</td>
                                      <td style={{ padding: '6px 8px', color: c.comision_gerente ? C.purple : C.muted, whiteSpace: 'nowrap' }}>{c.comision_gerente ? fmtMoney(c.comision_gerente) : '—'}</td>
                                      <td style={{ padding: '6px 8px', color: c.status === 'completado' ? C.green : C.red, whiteSpace: 'nowrap' }}>{c.status}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}