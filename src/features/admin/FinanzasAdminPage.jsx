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
  border:  'rgba(212,175,55,0.22)',
  borderHi:'rgba(212,175,55,0.45)',
  gold:    '#D4AF37',
  goldDim: 'rgba(212,175,55,0.65)',
  purple:  '#9b59ff',
  text:    '#f0eaff',
  muted:   'rgba(240,234,255,0.6)',
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
const fmtPct   = (n) => `${(Number(n || 0) * 100).toFixed(1)}%`;

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
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════════════════════════
export default function FinanzasAdminPage() {
  const [tabActiva,   setTabActiva]   = useState('master');

  const [movimientos, setMovimientos] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [balance,     setBalance]     = useState(0);

  const [aliados,     setAliados]     = useState([]);
  const [porLider,    setPorLider]    = useState([]);
  const [loadingLider,setLoadingLider]= useState(false);

  const [master,        setMaster]        = useState([]);   // filas cruzadas por aliado
  const [masterGlobal,  setMasterGlobal]  = useState(null);  // fila "general / sin atribuir"
  const [masterTotales, setMasterTotales] = useState(null);  // totales para las KPI cards
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [errMaster,     setErrMaster]     = useState('');

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
      @keyframes pulseGlow { 0%,100%{box-shadow:0 0 40px rgba(212,175,55,0.10)} 50%{box-shadow:0 0 60px rgba(212,175,55,0.22)} }
      input::placeholder, textarea::placeholder { color: rgba(240,234,255,0.28); }
      input:focus, select:focus, textarea:focus { border-color: rgba(212,175,55,0.6) !important; box-shadow: 0 0 0 3px rgba(212,175,55,0.1) !important; outline: none !important; }
      input:hover, select:hover, textarea:hover { border-color: rgba(212,175,55,0.3); }
      /* Fix crítico: <option> heredaba el tema claro del SO (fondo blanco, texto ilegible) */
      select { color-scheme: dark; cursor: pointer; }
      select option { background: #15102a; color: #f0eaff; padding: 8px; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.25); border-radius: 8px; }
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

  // ── MASTER: cruce completo de costo → escaneo → registro → ingreso neto ──────
  const cargarMaster = useCallback(async () => {
    setLoadingMaster(true);
    setErrMaster('');
    const [aliadosRes, scansRes, participantesRes, gastosRes, ltvRes] = await Promise.all([
      supabase.from('aliados').select('id, nombre, slug, rol, activo'),
      supabase.from('aliado_scans').select('aliado_id'),
      supabase.from('sorteo_participantes').select('aliado_origen_slug, premio_entregado, cupon_aceptado'),
      supabase.from('finanzas_privadas').select('categoria, tipo, monto, aliado_id, cantidad_stickers'),
      supabase.from('v_aliado_resumen').select('*'),
    ]);

    if (aliadosRes.error || scansRes.error || participantesRes.error || gastosRes.error || ltvRes.error) {
      setErrMaster('No se pudo cargar la trazabilidad completa. Intenta de nuevo.');
      setLoadingMaster(false);
      return;
    }

    const aliadosData      = aliadosRes.data || [];
    const scansData        = scansRes.data || [];
    const participantesData= participantesRes.data || [];
    const gastosData       = gastosRes.data || [];
    const ltvData          = ltvRes.data || [];

    // Scans por aliado_id (incluye null = escaneo sin aliado atribuido)
    const scansPorAliado = {};
    for (const s of scansData) {
      const k = s.aliado_id || '__sin_atribuir__';
      scansPorAliado[k] = (scansPorAliado[k] || 0) + 1;
    }

    // Registros de sorteo por slug del aliado de origen
    const bySlug = {};
    for (const a of aliadosData) bySlug[a.slug] = a.id;
    const regPorAliado = {};
    for (const p of participantesData) {
      const aliadoId = bySlug[p.aliado_origen_slug] || '__sin_atribuir__';
      if (!regPorAliado[aliadoId]) regPorAliado[aliadoId] = { registros: 0, premios: 0, cupones: 0 };
      regPorAliado[aliadoId].registros += 1;
      if (p.premio_entregado) regPorAliado[aliadoId].premios += 1;
      if (p.cupon_aceptado) regPorAliado[aliadoId].cupones += 1;
    }

    // Gastos (solo tipo 'gasto') por aliado_id, separando impresión de stickers del resto
    const gastoPorAliado = {};
    for (const g of gastosData) {
      if (g.tipo !== 'gasto') continue;
      const k = g.aliado_id || '__sin_atribuir__';
      if (!gastoPorAliado[k]) gastoPorAliado[k] = { total: 0, stickers: 0, stickersMonto: 0 };
      gastoPorAliado[k].total += Number(g.monto || 0);
      if (g.categoria === 'impresion_stickers') {
        gastoPorAliado[k].stickers += Number(g.cantidad_stickers || 0);
        gastoPorAliado[k].stickersMonto += Number(g.monto || 0);
      }
    }

    // LTV/comisiones por aliado_id
    const ltvPorAliado = {};
    for (const l of ltvData) ltvPorAliado[l.aliado_id] = l;

    const idsRelevantes = new Set([
      ...aliadosData.map(a => a.id),
      ...Object.keys(scansPorAliado),
      ...Object.keys(regPorAliado),
      ...Object.keys(gastoPorAliado),
    ]);

    const filas = [];
    let general = null;

    for (const id of idsRelevantes) {
      const aliado   = aliadosData.find(a => a.id === id);
      const scans    = scansPorAliado[id] || 0;
      const reg      = regPorAliado[id] || { registros: 0, premios: 0, cupones: 0 };
      const gasto    = gastoPorAliado[id] || { total: 0, stickers: 0, stickersMonto: 0 };
      const ltv      = ltvPorAliado[id] || null;

      const costoPorScan     = scans > 0 ? gasto.total / scans : null;
      const costoPorRegistro = reg.registros > 0 ? gasto.total / reg.registros : null;
      const conversion       = scans > 0 ? reg.registros / scans : null;
      const neto              = ltv ? Number(ltv.total_neto || 0) : 0;
      const roi                = neto - gasto.total;

      const fila = {
        id,
        nombre: aliado?.nombre || (id === '__sin_atribuir__' ? 'General / sin atribuir' : id),
        slug: aliado?.slug || '',
        rol: aliado?.rol || '—',
        activo: aliado?.activo ?? null,
        scans, registros: reg.registros, premios: reg.premios, cupones: reg.cupones,
        gastoTotal: gasto.total, stickersImpresos: gasto.stickers, stickersMonto: gasto.stickersMonto,
        costoPorScan, costoPorRegistro, conversion,
        bruto: ltv ? Number(ltv.total_bruto || 0) : 0,
        neto,
        comisionGenerada: ltv ? Number(ltv.comision_generada_total || 0) : 0,
        comisionPendiente: ltv ? Number(ltv.comision_pendiente || 0) : 0,
        usuariosConPago: ltv ? Number(ltv.usuarios_con_pago || 0) : 0,
        roi,
      };

      if (id === '__sin_atribuir__') general = fila;
      else filas.push(fila);
    }

    filas.sort((a, b) => b.gastoTotal - a.gastoTotal || b.scans - a.scans);

    const totales = filas.reduce((acc, f) => ({
      scans: acc.scans + f.scans,
      registros: acc.registros + f.registros,
      premios: acc.premios + f.premios,
      gasto: acc.gasto + f.gastoTotal,
      bruto: acc.bruto + f.bruto,
      neto: acc.neto + f.neto,
      comision: acc.comision + f.comisionGenerada,
      comisionPendiente: acc.comisionPendiente + f.comisionPendiente,
    }), { scans: 0, registros: 0, premios: 0, gasto: 0, bruto: 0, neto: 0, comision: 0, comisionPendiente: 0 });

    if (general) {
      totales.scans += general.scans;
      totales.registros += general.registros;
      totales.premios += general.premios;
      totales.gasto += general.gastoTotal;
    }
    totales.costoPorScanProm     = totales.scans > 0 ? totales.gasto / totales.scans : null;
    totales.costoPorRegistroProm = totales.registros > 0 ? totales.gasto / totales.registros : null;
    totales.conversionProm       = totales.scans > 0 ? totales.registros / totales.scans : null;
    totales.roiNeto              = totales.neto - totales.gasto;

    setMaster(filas);
    setMasterGlobal(general);
    setMasterTotales(totales);
    setLoadingMaster(false);
  }, []);

  useEffect(() => { if (tabActiva === 'master') cargarMaster(); }, [tabActiva, cargarMaster]);

  const exportarMasterCSV = () => {
    const filas = masterGlobal ? [...master, masterGlobal] : master;
    descargarCSV(`finanzas-master-${new Date().toISOString().slice(0, 10)}.csv`, filas, [
      { label: 'Líder/Aliado',        get: r => r.nombre },
      { label: 'Rol',                 get: r => r.rol },
      { label: 'Scans',               get: r => r.scans },
      { label: 'Registros sorteo',    get: r => r.registros },
      { label: 'Conversión',          get: r => r.conversion != null ? fmtPct(r.conversion) : '—' },
      { label: 'Premios entregados',  get: r => r.premios },
      { label: 'Stickers impresos',   get: r => r.stickersImpresos },
      { label: 'Gasto total',         get: r => r.gastoTotal.toFixed(2) },
      { label: 'Costo por scan',      get: r => r.costoPorScan != null ? r.costoPorScan.toFixed(2) : '—' },
      { label: 'Costo por registro',  get: r => r.costoPorRegistro != null ? r.costoPorRegistro.toFixed(2) : '—' },
      { label: 'Bruto (LTV)',         get: r => r.bruto.toFixed(2) },
      { label: 'Neto (LTV)',          get: r => r.neto.toFixed(2) },
      { label: 'Comisión generada',   get: r => r.comisionGenerada.toFixed(2) },
      { label: 'Comisión pendiente',  get: r => r.comisionPendiente.toFixed(2) },
      { label: 'ROI (neto - gasto)',  get: r => r.roi.toFixed(2) },
    ]);
  };


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
            { id: 'master',      label: '📊 TABLA MASTER' },
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
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, rgba(212,175,55,0.10), rgba(155,89,255,0.07))`,
        border: `1.5px solid ${C.borderHi}`, borderRadius: 20,
        padding: 'clamp(24px,5vw,36px)', marginBottom: 28, textAlign: 'center',
        animation: 'pulseGlow 4s ease-in-out infinite',
      }}>
        <div style={{
          position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
          width: 260, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.15), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 4, color: C.goldDim, marginBottom: 10, position: 'relative' }}>
          💰 BALANCE ACTUAL DE LA BOLSA
        </div>
        <div style={{
          fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
          fontSize: 'clamp(32px,7vw,52px)',
          color: balance >= 0 ? C.gold : C.red,
          letterSpacing: 2, position: 'relative',
          textShadow: balance >= 0 ? '0 0 30px rgba(212,175,55,0.35)' : '0 0 30px rgba(255,68,102,0.35)',
        }}>
          {fmtMoney(balance)}
        </div>
        <div style={{ color: C.muted, fontSize: 11, marginTop: 8, position: 'relative' }}>
          Calculado en automático: suma de ingresos menos gastos, hasta el movimiento más reciente.
        </div>
      </div>

      {tabActiva === 'master' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 900, fontSize: 16, color: C.gold, margin: '0 0 6px', letterSpacing: 1 }}>
              📊 TRAZABILIDAD COMPLETA — COSTO POR ESCANEO, REGISTRO E INGRESO
            </h2>
            <p style={{ color: C.muted, fontSize: 12, fontStyle: 'italic', margin: 0 }}>
              Cruce en vivo de escaneos de QR, registros de sorteo, gasto de impresión y LTV/comisiones — por líder/aliado, sin huecos.
            </p>
          </div>

          {errMaster && <div style={{ color: C.red, fontSize: 12 }}>⚠ {errMaster}</div>}

          {loadingMaster ? (
            <p style={{ color: C.goldDim, fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 2, textAlign: 'center', padding: 30 }}>CARGANDO TRAZABILIDAD...</p>
          ) : masterTotales && (
            <>
              {/* KPIs globales */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Kpi label="SCANS TOTALES" value={masterTotales.scans} />
                <Kpi label="REGISTROS SORTEO" value={masterTotales.registros} />
                <Kpi label="CONVERSIÓN SCAN→REGISTRO" value={masterTotales.conversionProm != null ? fmtPct(masterTotales.conversionProm) : '—'} color={C.purple} />
                <Kpi label="PREMIOS ENTREGADOS" value={masterTotales.premios} />
                <Kpi label="GASTO TOTAL" value={fmtMoney(masterTotales.gasto)} color={C.red} />
                <Kpi label="COSTO PROM. / SCAN" value={masterTotales.costoPorScanProm != null ? fmtMoney(masterTotales.costoPorScanProm) : '—'} color={C.red} />
                <Kpi label="COSTO PROM. / REGISTRO" value={masterTotales.costoPorRegistroProm != null ? fmtMoney(masterTotales.costoPorRegistroProm) : '—'} color={C.red} />
                <Kpi label="NETO GENERADO (LTV)" value={fmtMoney(masterTotales.neto)} color={C.green} />
                <Kpi label="COMISIÓN PENDIENTE" value={fmtMoney(masterTotales.comisionPendiente)} color={C.purple} />
                <Kpi
                  label="ROI NETO (NETO − GASTO)"
                  value={fmtMoney(masterTotales.roiNeto)}
                  color={masterTotales.roiNeto >= 0 ? C.green : C.red}
                />
              </div>

              {/* Tabla master */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 'clamp(16px,4vw,22px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                  <h3 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 12, letterSpacing: 2, color: C.gold, margin: 0 }}>
                    TABLA MASTER POR LÍDER/ALIADO
                  </h3>
                  <button onClick={exportarMasterCSV} style={btnGhost}>⬇ EXPORTAR CSV</button>
                </div>

                {master.length === 0 && !masterGlobal ? (
                  <p style={{ color: C.muted, fontSize: 12, textAlign: 'center', padding: 20 }}>Todavía no hay actividad registrada (scans, registros ni gastos).</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                          {['LÍDER / ALIADO', 'ROL', 'SCANS', 'REGISTROS', 'CONVERSIÓN', 'PREMIOS', 'STICKERS', 'GASTO', 'COSTO/SCAN', 'COSTO/REG.', 'BRUTO', 'NETO', 'COMISIÓN', 'PENDIENTE', 'ROI'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 1, color: C.goldDim, whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...master, ...(masterGlobal ? [masterGlobal] : [])].map(f => (
                          <tr key={f.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                            <td style={tdCell}>
                              <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: C.text }}>
                                {f.nombre}{f.activo === false && <span style={{ color: C.red, fontSize: 9 }}> (inactivo)</span>}
                              </div>
                            </td>
                            <td style={{ ...tdCell, color: C.muted, textTransform: 'uppercase', fontSize: 9 }}>{f.rol}</td>
                            <td style={tdCell}>{f.scans}</td>
                            <td style={tdCell}>{f.registros}</td>
                            <td style={{ ...tdCell, color: C.purple }}>{f.conversion != null ? fmtPct(f.conversion) : '—'}</td>
                            <td style={tdCell}>{f.premios}</td>
                            <td style={{ ...tdCell, color: C.muted }}>{f.stickersImpresos || '—'}</td>
                            <td style={{ ...tdCell, color: C.red, fontWeight: 700 }}>{fmtMoney(f.gastoTotal)}</td>
                            <td style={{ ...tdCell, color: C.muted }}>{f.costoPorScan != null ? fmtMoney(f.costoPorScan) : '—'}</td>
                            <td style={{ ...tdCell, color: C.muted }}>{f.costoPorRegistro != null ? fmtMoney(f.costoPorRegistro) : '—'}</td>
                            <td style={tdCell}>{fmtMoney(f.bruto)}</td>
                            <td style={{ ...tdCell, color: C.green, fontWeight: 700 }}>{fmtMoney(f.neto)}</td>
                            <td style={{ ...tdCell, color: C.purple }}>{fmtMoney(f.comisionGenerada)}</td>
                            <td style={{ ...tdCell, color: C.gold }}>{fmtMoney(f.comisionPendiente)}</td>
                            <td style={{ ...tdCell, fontWeight: 900, color: f.roi >= 0 ? C.green : C.red }}>{fmtMoney(f.roi)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p style={{ color: C.muted, fontSize: 10, marginTop: 12, fontStyle: 'italic' }}>
                  "General / sin atribuir" agrupa scans, registros o gastos que no tienen un líder/aliado asignado (QR genérico, gasto operativo sin líder, etc).
                </p>
              </div>
            </>
          )}
        </div>
      )}

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
              <div style={{ display: 'flex', gap: 8, height: 40 }}>
                {[
                  { id: 'gasto',   label: 'Gasto',   icon: '🔻', color: C.red,   glow: 'rgba(255,68,102,0.15)' },
                  { id: 'ingreso', label: 'Ingreso',  icon: '🔺', color: C.green, glow: 'rgba(68,255,136,0.15)' },
                ].map(t => {
                  const activo = form.tipo === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tipo: t.id }))}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: activo ? t.glow : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${activo ? t.color : C.border}`,
                        borderRadius: 8, cursor: 'pointer',
                        color: activo ? t.color : C.muted,
                        fontFamily: 'Cinzel, serif', fontSize: 11, fontWeight: 900, letterSpacing: 1,
                        transition: 'all .15s',
                      }}
                    >
                      <span>{t.icon}</span>{t.label}
                    </button>
                  );
                })}
              </div>
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
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: C.gold, fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 13, pointerEvents: 'none',
                }}>$</span>
                <input
                  type="number" step="0.01" placeholder="0.00" value={form.monto}
                  onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                  style={{ ...inp, paddingLeft: 26 }}
                />
              </div>
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

function Kpi({ label, value, color }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: '14px 16px', minWidth: 150, flex: '1 1 150px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <span style={{ fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 1.5, color: C.goldDim }}>{label}</span>
      <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 18, color: color || C.text }}>{value}</span>
    </div>
  );
}

const lbl = { display: 'block', fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1.5, color: C.muted, marginBottom: 5 };
const inp = {
  width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13,
  boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s',
};
const tdCell = { padding: '9px 10px', color: C.text, whiteSpace: 'nowrap' };
const btnGhost = {
  padding: '8px 16px', background: 'rgba(212,175,55,0.08)', border: `1px solid ${C.borderHi}`,
  borderRadius: 8, color: C.gold, fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 1.5,
  fontWeight: 900, cursor: 'pointer',
};