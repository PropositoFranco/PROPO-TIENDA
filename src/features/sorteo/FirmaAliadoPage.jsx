/**
 * FirmaAliadoPage.jsx — Templo del Propósito
 * Ruta: /firma/:token  (PÚBLICA — sin auth, sin paywall)
 * Firma digital de acuerdo para líderes / gerentes aliados.
 * Mismo patrón que SorteoPage.jsx: página standalone, estética épica, sin login.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';

// ── Paleta (igual que SorteoPage) ──────────────────────────────────────────────
const C = {
  bg:        '#04020e',
  bgCard:    'rgba(10,5,26,0.98)',
  gold:      '#FFD700',
  goldDim:   'rgba(255,215,0,0.75)',
  goldGlow:  'rgba(255,215,0,0.25)',
  purple:    '#CC44FF',
  purpleDim: 'rgba(204,68,255,0.5)',
  green:     '#44FF88',
  red:       '#FF4466',
  text:      '#FFFFFF',
  muted:     'rgba(255,255,255,0.7)',
  border:    'rgba(255,215,0,0.2)',
  borderHi:  'rgba(255,215,0,0.6)',
};

// EDGE FUNCTION — mismo proyecto Supabase
const FN_URL = 'https://hdwzhwuhlrtrmhnecypm.supabase.co/functions/v1/firma-aliado';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #04020e; overflow-x: hidden; }
  button { font-family: inherit; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes sealPop { 0%{transform:scale(0) rotate(-12deg);opacity:0} 70%{transform:scale(1.08) rotate(2deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes pulse   { 0%,100%{opacity:.55} 50%{opacity:1} }
  @keyframes spin    { to{transform:rotate(360deg)} }
`;

// ── Texto del acuerdo ───────────────────────────────────────────────────────────
// NOTA: este es un texto base — mándame el definitivo y lo actualizo en un minuto.
const ACUERDO_TEXTO = `
Hoy no firmas un contrato. Sellas tu lugar entre los primeros.

Al aceptar, te conviertes en Líder Fundador del Templo del Propósito — uno de los
pocos que abren camino antes que nadie más lo haga. Portas tu insignia con
autoridad: representas al Templo ante tu comunidad, y cada vez que entregas tu
código QR, no entregas solo un pedido — entregas una puerta real hacia la
transformación de alguien.

Por cada persona que cruce esa puerta con tu código y decida invertir en sí
misma, el Templo reconoce tu labor con el 15% de comisión sobre esa compra, de
forma continua, conforme a los términos vigentes de la plataforma.

Portas este rol con verdad: sin prometer lo que el Templo no respalda, usando el
material que se te confía (tarjeta, QR, guion) exactamente como se te enseñó, y
hablando siempre con honestidad a quien tienes enfrente.

Este pacto no encadena a nadie: cualquiera de las dos partes puede cerrarlo en el
momento que decida, sin necesidad de justificarlo, avisando con tiempo razonable.

Leí este pacto completo, y hoy elijo firmarlo como Líder Fundador del Templo del
Propósito.
`.trim();

export default function FirmaAliadoPage() {
  const { token } = useParams();

  const [estado, setEstado] = useState('cargando'); // cargando | acuerdo | firmando | enviando | listo | error | ya_firmado
  const [info, setInfo] = useState(null);
  const [nombre, setNombre] = useState('');
  const [aceptaLeido, setAceptaLeido] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [tieneTrazo, setTieneTrazo] = useState(false);

  const canvasRef = useRef(null);
  const dibujando = useRef(false);
  const ultimoPunto = useRef(null);

  // ── CSS global ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  // ── Cargar info del token ────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${FN_URL}?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!data.success) {
          setErrMsg(data.error || 'Este link no es válido.');
          setEstado('error');
          return;
        }
        setInfo(data);
        setEstado(data.ya_firmado ? 'ya_firmado' : 'acuerdo');
      } catch {
        setErrMsg('No se pudo cargar el link. Revisa tu conexión.');
        setEstado('error');
      }
    })();
  }, [token]);

  // ── Canvas: preparar tamaño real (retina) ───────────────────────────────────
  const prepararCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a1030';
  }, []);

  useEffect(() => {
    if (estado === 'firmando') {
      setTimeout(prepararCanvas, 30);
      window.addEventListener('resize', prepararCanvas);
      return () => window.removeEventListener('resize', prepararCanvas);
    }
  }, [estado, prepararCanvas]);

  const puntoDeEvento = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const iniciarTrazo = (e) => {
    e.preventDefault();
    dibujando.current = true;
    ultimoPunto.current = puntoDeEvento(e);
  };

  const moverTrazo = (e) => {
    if (!dibujando.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const p = puntoDeEvento(e);
    ctx.beginPath();
    ctx.moveTo(ultimoPunto.current.x, ultimoPunto.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ultimoPunto.current = p;
    setTieneTrazo(true);
  };

  const terminarTrazo = () => { dibujando.current = false; };

  const borrarFirma = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTieneTrazo(false);
  };

  // ── Enviar firma ─────────────────────────────────────────────────────────────
  const sellarFirma = async () => {
    if (!nombre.trim()) { setErrMsg('Escribe tu nombre completo.'); return; }
    if (!tieneTrazo) { setErrMsg('Falta tu firma en el recuadro.'); return; }
    setErrMsg('');
    setEstado('enviando');

    const firmaData = canvasRef.current.toDataURL('image/png');

    try {
      const res = await fetch(FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nombre_firmante: nombre.trim(), firma_data: firmaData }),
      });
      const data = await res.json();
      if (!data.success) {
        setErrMsg(data.error || 'No se pudo guardar tu firma.');
        setEstado('firmando');
        return;
      }
      setEstado('listo');
    } catch {
      setErrMsg('No se pudo enviar. Revisa tu conexión e intenta otra vez.');
      setEstado('firmando');
    }
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: `radial-gradient(ellipse at top, rgba(204,68,255,0.08), transparent 60%), ${C.bg}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px,4vw,32px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 480, background: C.bgCard, border: `1.5px solid ${C.borderHi}`,
        borderRadius: 20, padding: 'clamp(24px,5vw,36px)', boxShadow: `0 0 60px ${C.goldGlow}`,
        animation: 'fadeUp .5s ease both',
      }}>

        {/* Cabecera */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>⚜️</div>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 4, color: C.goldDim, marginBottom: 4 }}>
            TEMPLO DEL PROPÓSITO
          </div>
          <h1 style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 900, fontSize: 'clamp(18px,4vw,24px)', color: C.gold, margin: 0 }}>
            Pacto de Investidura
          </h1>
        </div>

        {/* ── CARGANDO ── */}
        {estado === 'cargando' && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: C.muted, fontFamily: 'Crimson Text, serif' }}>
            <div style={{ width: 30, height: 30, border: `3px solid ${C.border}`, borderTopColor: C.gold, borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
            Abriendo tu pergamino...
          </div>
        )}

        {/* ── ERROR / LINK INVÁLIDO ── */}
        {estado === 'error' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
            <p style={{ color: C.red, fontFamily: 'Crimson Text, serif', fontSize: 15 }}>{errMsg}</p>
            <p style={{ color: C.muted, fontFamily: 'Crimson Text, serif', fontSize: 13, marginTop: 8 }}>
              Pide que te reenvíen el link correcto.
            </p>
          </div>
        )}

        {/* ── YA FIRMADO ── */}
        {estado === 'ya_firmado' && (
          <div style={{ textAlign: 'center', padding: '10px 0', animation: 'sealPop .5s ease both' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>✦</div>
            <p style={{ color: C.gold, fontFamily: 'Cinzel, serif', fontSize: 15, letterSpacing: 1 }}>
              {info?.nombre_aliado ? `${info.nombre_aliado}, ya` : 'Ya'} quedaste sellado como Líder Aliado.
            </p>
            <p style={{ color: C.muted, fontFamily: 'Crimson Text, serif', fontSize: 13, marginTop: 10 }}>
              Este acuerdo ya fue firmado{info?.fecha_firma ? ` el ${new Date(info.fecha_firma).toLocaleDateString('es-MX')}` : ''}. No necesitas hacer nada más.
            </p>
          </div>
        )}

        {/* ── PANTALLA DEL ACUERDO ── */}
        {estado === 'acuerdo' && (
          <div style={{ animation: 'fadeIn .4s ease both' }}>
            {info?.nombre_aliado && (
              <p style={{ textAlign: 'center', color: C.text, fontFamily: 'Crimson Text, serif', fontSize: 15, marginBottom: 16 }}>
                Hola, <strong style={{ color: C.gold }}>{info.nombre_aliado}</strong> — este es tu acuerdo como líder aliado.
              </p>
            )}
            <div style={{
              maxHeight: 220, overflowY: 'auto', background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 18,
              fontFamily: 'Crimson Text, serif', fontSize: 13.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-line',
            }}>
              {ACUERDO_TEXTO}
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={aceptaLeido} onChange={e => setAceptaLeido(e.target.checked)}
                style={{ marginTop: 3, width: 16, height: 16, accentColor: C.gold }} />
              <span style={{ fontFamily: 'Crimson Text, serif', fontSize: 13, color: C.muted }}>
                Leí el acuerdo completo y estoy de acuerdo con sus términos.
              </span>
            </label>
            <button
              onClick={() => aceptaLeido ? setEstado('firmando') : setErrMsg('Marca la casilla de aceptación primero.')}
              style={{
                width: '100%', padding: '13px 0', background: aceptaLeido ? `linear-gradient(135deg,${C.gold},#a87f00)` : 'rgba(255,255,255,0.08)',
                border: 'none', borderRadius: 10, color: aceptaLeido ? '#1a1030' : C.muted,
                fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 12, letterSpacing: 2, cursor: 'pointer',
              }}
            >
              CONTINUAR A FIRMAR ✍️
            </button>
            {errMsg && <p style={{ color: C.red, fontFamily: 'Crimson Text, serif', fontSize: 12.5, marginTop: 10, textAlign: 'center' }}>{errMsg}</p>}
          </div>
        )}

        {/* ── PANTALLA DE FIRMA ── */}
        {(estado === 'firmando' || estado === 'enviando') && (
          <div style={{ animation: 'fadeIn .4s ease both' }}>
            <label style={{ display: 'block', fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 2, color: C.goldDim, marginBottom: 6 }}>
              TU NOMBRE COMPLETO
            </label>
            <input
              type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: William Ramírez"
              style={{
                width: '100%', padding: '11px 14px', marginBottom: 18, background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: 'Crimson Text, serif', fontSize: 14,
              }}
            />

            <label style={{ display: 'block', fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 2, color: C.goldDim, marginBottom: 6 }}>
              FIRMA AQUÍ CON EL DEDO
            </label>
            <canvas
              ref={canvasRef}
              style={{
                width: '100%', height: 160, background: '#fdfaf2', borderRadius: 12,
                border: `1.5px solid ${C.borderHi}`, touchAction: 'none', cursor: 'crosshair',
              }}
              onMouseDown={iniciarTrazo} onMouseMove={moverTrazo} onMouseUp={terminarTrazo} onMouseLeave={terminarTrazo}
              onTouchStart={iniciarTrazo} onTouchMove={moverTrazo} onTouchEnd={terminarTrazo}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, marginBottom: 18 }}>
              <button onClick={borrarFirma} style={{ background: 'none', border: 'none', color: C.muted, fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1, cursor: 'pointer' }}>
                ↺ BORRAR Y FIRMAR DE NUEVO
              </button>
            </div>

            <button
              onClick={sellarFirma}
              disabled={estado === 'enviando'}
              style={{
                width: '100%', padding: '13px 0', background: `linear-gradient(135deg,${C.gold},#a87f00)`,
                border: 'none', borderRadius: 10, color: '#1a1030', fontFamily: 'Cinzel, serif', fontWeight: 900,
                fontSize: 12, letterSpacing: 2, cursor: estado === 'enviando' ? 'not-allowed' : 'pointer',
                opacity: estado === 'enviando' ? 0.65 : 1,
              }}
            >
              {estado === 'enviando' ? 'SELLANDO...' : '✦ SELLAR FIRMA ✦'}
            </button>
            {errMsg && <p style={{ color: C.red, fontFamily: 'Crimson Text, serif', fontSize: 12.5, marginTop: 10, textAlign: 'center' }}>{errMsg}</p>}
          </div>
        )}

        {/* ── LISTO ── */}
        {estado === 'listo' && (
          <div style={{ textAlign: 'center', padding: '10px 0', animation: 'sealPop .5s ease both' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
            <p style={{ color: C.gold, fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 16, letterSpacing: 1 }}>
              Quedaste sellado como Líder Fundador
            </p>
            <p style={{ color: C.muted, fontFamily: 'Crimson Text, serif', fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>
              Gracias, {nombre.split(' ')[0]}. Tu acuerdo quedó registrado. Ya puedes cerrar esta pantalla —
              pronto te llega tu tarjeta con tu QR personal.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}