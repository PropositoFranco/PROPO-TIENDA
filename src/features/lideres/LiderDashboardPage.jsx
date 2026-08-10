/**
 * LiderDashboardPage.jsx — Templo del Propósito
 * Ruta sugerida: /lider  (PÚBLICA — sin Supabase Auth, sin datos personales)
 *
 * v2 — misma alma visual que SorteoPage.jsx (partículas, glow dorado,
 * Cinzel Decorative + Crimson Text). Una sola pantalla, código recordado
 * en el dispositivo, cero formularios, cero esfuerzo del líder.
 *
 * TODO: reemplazar el sello dorado (placeholder animado con CSS) por el
 * logo/mascota real en cuanto Elchido pase el URL público del bucket
 * `aliados-logos` o `banners`. Buscar el comentario "LOGO AQUÍ".
 */

import { useState, useEffect, useCallback } from 'react';

const SUPABASE_URL = 'https://hdwzhwuhlrtrmhnecypm.supabase.co';
const ENDPOINT = `${SUPABASE_URL}/functions/v1/lider-dashboard`;
const STORAGE_KEY = 'propotienda_lider_codigo';

// ── Paleta — idéntica a SorteoPage.jsx ────────────────────────────────────────
const C = {
  bg:        '#04020e',
  bgCard:    'rgba(10,5,26,0.98)',
  gold:      '#FFD700',
  goldDim:   'rgba(255,215,0,0.75)',
  goldGlow:  'rgba(255,215,0,0.25)',
  goldLight: '#fff4a0',
  purple:    '#CC44FF',
  purpleDim: 'rgba(204,68,255,0.5)',
  green:     '#44FF88',
  red:       '#FF4466',
  text:      '#FFFFFF',
  muted:     'rgba(255,255,255,0.7)',
  border:    'rgba(255,215,0,0.2)',
  borderHi:  'rgba(255,215,0,0.6)',
};

const NIVEL_COLOR = { base: C.muted, constante: C.green, solido: C.purple, elite: C.gold };

// ── CSS Global — mismas keyframes que ya usas en SorteoPage.jsx ──────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  input, button { font-family: inherit; }
  input::placeholder { color: rgba(255,215,0,0.28); }
  input:focus { border-color: rgba(255,215,0,0.55) !important; outline: none !important; box-shadow: 0 0 0 3px rgba(255,215,0,0.08) !important; }

  @keyframes floatY     { 0%,100%{transform:translateY(0)}       50%{transform:translateY(-14px)} }
  @keyframes pulse      { 0%,100%{opacity:.55} 50%{opacity:1} }
  @keyframes pulseGlow  { 0%,100%{box-shadow:0 0 20px rgba(255,215,0,0.2)} 50%{box-shadow:0 0 60px rgba(255,215,0,0.6),0 0 100px rgba(255,215,0,0.2)} }
  @keyframes fadeUp     { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
  @keyframes warpIn     { 0%{letter-spacing:24px;opacity:0} 100%{letter-spacing:3px;opacity:1} }
  @keyframes textGlow   { 0%,100%{text-shadow:0 0 20px rgba(255,215,0,0.4)} 50%{text-shadow:0 0 60px rgba(255,215,0,1),0 0 100px rgba(255,215,0,0.4)} }
  @keyframes twinkle    { 0%,100%{opacity:var(--min,0.12);transform:scale(1)} 50%{opacity:1;transform:scale(1.6)} }
  @keyframes orbFloat   { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-6px) scale(1.04)} }
  @keyframes raysRotate { to{transform:rotate(360deg)} }
  @keyframes barFill    { from{width:0%} to{width:var(--target-w)} }
  @keyframes shake      { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.2); border-radius: 2px; }
`;

// ── Fondo épico: estrellas + nebulosa (mismo patrón de SorteoPage.jsx) ───────
function Particles() {
  const stars = Array.from({ length: 42 }, (_, i) => ({
    size:  0.5 + (i % 4) * 0.7,
    left:  `${(i * 1.73 + 0.5) % 100}%`,
    top:   `${(i * 1.61 + 0.8) % 72}%`,
    dur:   `${2.2 + (i % 6) * 0.7}s`,
    delay: `${(i % 8) * 0.55}s`,
    min:   0.07 + (i % 5) * 0.05,
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 0%, rgba(204,68,255,0.12) 0%, transparent 55%),
                     radial-gradient(ellipse at 20% 100%, rgba(255,215,0,0.08) 0%, transparent 50%)`,
      }} />
      {stars.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: s.left, top: s.top, width: s.size, height: s.size,
          borderRadius: '50%', background: C.goldLight,
          animation: `twinkle ${s.dur} ease-in-out infinite`, animationDelay: s.delay,
          '--min': s.min,
        }} />
      ))}
    </div>
  );
}

function copiar(texto) {
  navigator.clipboard?.writeText(texto).catch(() => {});
}

// ── Rayos giratorios detrás del sello (mismo patrón que aliado-display-page.jsx) ─
function Rays({ size = 200, speed = '5s', opacity = 0.22 }) {
  const rays = Array.from({ length: 12 }, (_, i) => ({
    angle: i * 30,
    len:   size * (0.42 + (i % 3) * 0.1),
    w:     1.2 + (i % 4) * 0.6,
  }));
  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: 'absolute', inset: 0, opacity, animation: `raysRotate ${speed} linear infinite` }}
    >
      {rays.map((r, i) => {
        const cx = size / 2, cy = size / 2;
        const rad = (r.angle * Math.PI) / 180;
        return (
          <line key={i}
            x1={cx} y1={cy}
            x2={cx + Math.cos(rad) * r.len}
            y2={cy + Math.sin(rad) * r.len}
            stroke={C.gold} strokeWidth={r.w} strokeOpacity={0.65 + (i % 3) * 0.1}
          />
        );
      })}
    </svg>
  );
}

// ── Sello central — Maestro Templario, servido desde public/assets ──────────
function Sello({ size = 96 }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div style={{
      position: 'relative', width: size, height: size, margin: '0 auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Rayos dorados girando detrás, dos capas a distinta velocidad */}
      <div style={{ position: 'absolute', inset: -size * 0.35, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Rays size={size * 1.7} speed="7s" opacity={0.22} />
      </div>
      <div style={{ position: 'absolute', inset: -size * 0.35, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Rays size={size * 1.7} speed="16s" opacity={0.1} />
      </div>
      {/* Halo de luz pulsante detrás del personaje */}
      <div style={{
        position: 'absolute', width: size * 0.92, height: size * 0.92, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,215,0,0.35) 0%, transparent 72%)',
        animation: 'pulseGlow 3.4s ease-in-out infinite', zIndex: 0,
      }} />
      {imgOk ? (
        <img
          src="/assets/maestro_templario.png"
          alt="Maestro Templario"
          onError={() => setImgOk(false)}
          style={{
            width: '86%', height: '86%', objectFit: 'contain', position: 'relative', zIndex: 1,
            filter: 'drop-shadow(0 0 18px rgba(255,215,0,0.65)) drop-shadow(0 0 36px rgba(255,215,0,0.3))',
            animation: 'orbFloat 3.4s ease-in-out infinite',
          }}
        />
      ) : (
        <div style={{
          position: 'relative', zIndex: 1, width: '100%', height: '100%', borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #fff4a0 0%, #FFD700 40%, #b8860b 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42,
          animation: 'orbFloat 3.4s ease-in-out infinite',
          boxShadow: '0 0 30px rgba(255,215,0,0.5)',
        }}>
          🔑
        </div>
      )}
    </div>
  );
}

// ── Pantalla 1: pedir el código ────────────────────────────────────────────────
function PantallaCodigo({ onEntrar, cargando, error }) {
  const [valor, setValor] = useState('');
  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Particles />
      <div style={{
        position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 20,
      }}>
        <div style={{
          width: '100%', maxWidth: 360, textAlign: 'center',
          background: C.bgCard, border: `1.5px solid ${C.border}`, borderRadius: 22,
          padding: '38px 28px', animation: 'fadeUp 0.5s ease both',
        }}>
          <Sello />
          <h1 style={{
            fontFamily: "'Cinzel Decorative', serif", fontWeight: 900, fontSize: 21,
            color: C.gold, letterSpacing: 3, margin: '20px 0 8px',
            animation: 'warpIn 0.7s ease both, textGlow 3s ease-in-out infinite 0.7s',
          }}>
            ACCESO DE LÍDER
          </h1>
          <p style={{ fontFamily: "'Crimson Text', serif", fontStyle: 'italic', fontSize: 14, color: C.muted, margin: '0 0 26px', lineHeight: 1.5 }}>
            Escribe el código que te enviamos por WhatsApp.
          </p>
          <input
            value={valor}
            onChange={e => setValor(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && onEntrar(valor)}
            placeholder="LIDER-XXXX-XXXX"
            autoCapitalize="characters"
            style={{
              width: '100%', boxSizing: 'border-box', textAlign: 'center',
              padding: '16px 14px', borderRadius: 13, border: `1.5px solid ${C.border}`,
              background: 'rgba(255,255,255,0.04)', color: C.text,
              fontFamily: "'Courier New', monospace", fontSize: 16, letterSpacing: 2, marginBottom: 16,
            }}
          />
          {error && (
            <p style={{ fontFamily: "'Crimson Text', serif", fontStyle: 'italic', color: C.red, fontSize: 13, marginBottom: 14, animation: 'shake 0.4s ease' }}>
              ⚠ {error}
            </p>
          )}
          <button
            onClick={() => onEntrar(valor)}
            disabled={cargando || !valor.trim()}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 13, border: 'none',
              background: cargando || !valor.trim()
                ? 'rgba(255,215,0,0.15)'
                : 'linear-gradient(135deg,#b8860b,#FFD700,#ff8c00,#FFD700)',
              backgroundSize: '250% 100%',
              color: '#1a0e00', fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 13, letterSpacing: 2,
              cursor: cargando || !valor.trim() ? 'not-allowed' : 'pointer',
              boxShadow: cargando || !valor.trim() ? 'none' : '0 4px 28px rgba(255,215,0,0.35)',
            }}
          >
            {cargando ? 'ENTRANDO...' : '⚔️ ENTRAR'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Barra de progreso hacia el siguiente nivel ────────────────────────────────
function BarraProgreso({ actual, faltan, color }) {
  const total = actual + faltan;
  const pct = total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 100;
  return (
    <div style={{ width: '100%', height: 11, borderRadius: 6, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <div style={{
        '--target-w': `${pct}%`, width: `${pct}%`, height: '100%', borderRadius: 6,
        background: `linear-gradient(90deg, ${color}aa, ${color})`,
        animation: 'barFill 0.8s ease both', boxShadow: `0 0 12px ${color}88`,
      }} />
    </div>
  );
}

// ── Pantalla 2: el dashboard ───────────────────────────────────────────────────
function PantallaDashboard({ data, onSalir }) {
  const { lider, historial } = data;
  const [copiado, setCopiado] = useState(false);
  const semanaActual = historial?.[0];
  const colorNivel = NIVEL_COLOR[lider.nivelActual] ?? C.gold;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Particles />
      <div style={{ position: 'relative', zIndex: 1, padding: '32px 16px 60px' }}>
        <div style={{ maxWidth: 420, margin: '0 auto' }}>

          {/* Encabezado */}
          <div style={{ textAlign: 'center', marginBottom: 24, animation: 'fadeUp 0.5s ease both' }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 4, color: C.goldDim, marginBottom: 10 }}>
              TEMPLO DEL PROPÓSITO · LÍDERES
            </div>
            <Sello size={78} />
            <h1 style={{
              fontFamily: "'Cinzel Decorative', serif", fontWeight: 900, fontSize: 20, color: C.text,
              margin: '14px 0 0', textShadow: '0 0 20px rgba(255,215,0,0.25)',
            }}>
              Hola, {lider.nombre.split(' ')[0]}
            </h1>
          </div>

          {/* Tarjeta principal: nivel y comisión */}
          <div style={{
            background: `linear-gradient(160deg, ${C.bgCard}, #1a0033)`,
            border: `1.5px solid ${C.borderHi}`, borderRadius: 22, padding: '30px 24px',
            textAlign: 'center', marginBottom: 18, animation: 'fadeUp 0.6s ease 0.1s both',
            boxShadow: `0 0 50px rgba(255,215,0,0.08)`,
          }}>
            <div style={{
              display: 'inline-block', fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 2,
              color: colorNivel, border: `1px solid ${colorNivel}`, borderRadius: 20, padding: '5px 16px', marginBottom: 16,
            }}>
              NIVEL {lider.nivelLabel.toUpperCase()}
            </div>
            <div style={{
              fontFamily: "'Cinzel Decorative', serif", fontWeight: 900, fontSize: 50, color: C.gold, lineHeight: 1,
              animation: 'textGlow 3.5s ease-in-out infinite',
            }}>
              {lider.comisionActual}%
            </div>
            <div style={{ fontFamily: "'Crimson Text', serif", fontStyle: 'italic', fontSize: 13, color: C.muted, marginTop: 8 }}>
              de comisión sobre lo que consumen tus referidos
            </div>

            {lider.siguienteNivel ? (
              <div style={{ marginTop: 24, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 0.5, color: C.muted, marginBottom: 8 }}>
                  <span>RACHA: {lider.semanasConsecutivas} SEM.</span>
                  <span>FALTAN {lider.semanasFaltantes} PARA {lider.siguienteNivelLabel.toUpperCase()}</span>
                </div>
                <BarraProgreso actual={lider.semanasConsecutivas} faltan={lider.semanasFaltantes} color={colorNivel} />
              </div>
            ) : (
              <div style={{ marginTop: 20, fontFamily: 'Cinzel, serif', fontSize: 12, color: C.gold, letterSpacing: 1.5 }}>
                🏆 YA ESTÁS EN EL NIVEL MÁS ALTO
              </div>
            )}
          </div>

          {/* Esta semana */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 8, animation: 'fadeUp 0.6s ease 0.2s both' }}>
            {[
              { label: 'ESCANEOS', valor: semanaActual?.escaneos ?? 0 },
              { label: 'ENTRADAS', valor: semanaActual?.conversiones ?? 0 },
              { label: 'GANASTE', valor: `$${Math.round(semanaActual?.comision_generada_usd ?? 0)}` },
            ].map(s => (
              <div key={s.label} style={{
                flex: 1, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 15,
                padding: '16px 8px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: "'Cinzel Decorative', serif", fontWeight: 900, fontSize: 19, color: C.text }}>{s.valor}</div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 1.5, color: C.goldDim, marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "'Crimson Text', serif", fontStyle: 'italic', fontSize: 11, color: C.muted, textAlign: 'center', marginBottom: 24 }}>
            Esta semana · se actualiza solo, no tienes que anotar nada
          </div>

          {/* Tu link */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 18, padding: '20px 20px', marginBottom: 22,
            animation: 'fadeUp 0.6s ease 0.3s both',
          }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 2.5, color: C.goldDim, marginBottom: 12 }}>
              TU LINK
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace", fontSize: 11, color: C.text, wordBreak: 'break-all',
              background: 'rgba(0,0,0,0.35)', borderRadius: 11, padding: '11px 13px', marginBottom: 12,
              border: `1px solid rgba(255,215,0,0.1)`,
            }}>
              {lider.linkReferido}
            </div>
            <button
              onClick={() => { copiar(lider.linkReferido); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 11, border: `1px solid ${C.border}`,
                background: 'rgba(255,215,0,0.08)', color: C.gold, fontFamily: 'Cinzel, serif',
                fontSize: 11, letterSpacing: 1.5, cursor: 'pointer',
              }}
            >
              {copiado ? '✓ COPIADO' : '📋 COPIAR Y COMPARTIR'}
            </button>
          </div>

          <button
            onClick={onSalir}
            style={{ display: 'block', margin: '0 auto', background: 'none', border: 'none', color: C.muted, fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1.5, cursor: 'pointer' }}
          >
            CAMBIAR DE CÓDIGO
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pantalla 2b: el dashboard de GERENTE — rollup de su equipo, no racha ──────
function PantallaDashboardGerente({ data, onSalir }) {
  const { gerente, equipo } = data;
  const [copiado, setCopiado] = useState(false);
  const fmt = (n) => `$${Math.round(Number(n) || 0)}`;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: C.bg, overflow: 'hidden' }}>
      <Particles />
      <div style={{ position: 'relative', zIndex: 1, padding: '32px 16px 60px' }}>
        <div style={{ maxWidth: 460, margin: '0 auto' }}>

          {/* Encabezado */}
          <div style={{ textAlign: 'center', marginBottom: 24, animation: 'fadeUp 0.5s ease both' }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 4, color: C.goldDim, marginBottom: 10 }}>
              TEMPLO DEL PROPÓSITO · GERENTE
            </div>
            <Sello size={78} />
            <h1 style={{
              fontFamily: "'Cinzel Decorative', serif", fontWeight: 900, fontSize: 20, color: C.text,
              margin: '14px 0 0', textShadow: '0 0 20px rgba(255,215,0,0.25)',
            }}>
              Hola, {gerente.nombre.split(' ')[0]}
            </h1>
            <p style={{ fontFamily: "'Crimson Text', serif", fontStyle: 'italic', fontSize: 12, color: C.muted, margin: '6px 0 0' }}>
              Esto es lo que ha generado tu equipo
            </p>
          </div>

          {/* Tarjeta principal: comisión total */}
          <div style={{
            background: `linear-gradient(160deg, ${C.bgCard}, #1a0033)`,
            border: `1.5px solid ${C.borderHi}`, borderRadius: 22, padding: '30px 24px',
            textAlign: 'center', marginBottom: 18, animation: 'fadeUp 0.6s ease 0.1s both',
            boxShadow: `0 0 50px rgba(255,215,0,0.08)`,
          }}>
            <div style={{
              display: 'inline-block', fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 2,
              color: C.purple, border: `1px solid ${C.purple}`, borderRadius: 20, padding: '5px 16px', marginBottom: 16,
            }}>
              {gerente.comisionPct != null ? `${gerente.comisionPct}% DE COMISIÓN` : 'GERENTE'}
            </div>
            <div style={{
              fontFamily: "'Cinzel Decorative', serif", fontWeight: 900, fontSize: 42, color: C.gold, lineHeight: 1,
              animation: 'textGlow 3.5s ease-in-out infinite',
            }}>
              {fmt(gerente.comisionGeneradaTotal)}
            </div>
            <div style={{ fontFamily: "'Crimson Text', serif", fontStyle: 'italic', fontSize: 13, color: C.muted, marginTop: 8 }}>
              comisión total generada por ti y tu equipo
            </div>
          </div>

          {/* Desglose: directo / equipo / pagado / pendiente */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap', animation: 'fadeUp 0.6s ease 0.2s both' }}>
            {[
              { label: 'TU DIRECTO', valor: fmt(gerente.comisionComoDirecto) },
              { label: 'DE TU EQUIPO', valor: fmt(gerente.comisionComoGerente) },
              { label: 'PAGADA', valor: fmt(gerente.comisionPagada), color: C.green },
              { label: 'PENDIENTE', valor: fmt(gerente.comisionPendiente), color: C.red },
            ].map(s => (
              <div key={s.label} style={{
                flex: '1 1 45%', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 15,
                padding: '14px 8px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: "'Cinzel Decorative', serif", fontWeight: 900, fontSize: 17, color: s.color || C.text }}>{s.valor}</div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 1.5, color: C.goldDim, marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tu equipo */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 18, padding: '20px 20px', marginBottom: 22,
            animation: 'fadeUp 0.6s ease 0.3s both',
          }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 2.5, color: C.goldDim, marginBottom: 14 }}>
              TU EQUIPO ({equipo.length})
            </div>
            {equipo.length === 0 ? (
              <p style={{ fontFamily: "'Crimson Text', serif", fontStyle: 'italic', fontSize: 12, color: C.muted, textAlign: 'center', margin: 0 }}>
                Todavía no tienes líderes asignados.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {equipo.map(l => (
                  <div key={l.slug} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 12, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {l.nombre}
                      </div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
                        {l.usuariosAtribuidos} usuarios · {l.usuariosConPago} con pago
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Cinzel Decorative', serif", fontWeight: 900, fontSize: 14, color: C.purple, whiteSpace: 'nowrap' }}>
                      {fmt(l.comisionGenerada)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tu link */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 18, padding: '20px 20px', marginBottom: 22,
            animation: 'fadeUp 0.6s ease 0.35s both',
          }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 2.5, color: C.goldDim, marginBottom: 12 }}>
              TU LINK
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace", fontSize: 11, color: C.text, wordBreak: 'break-all',
              background: 'rgba(0,0,0,0.35)', borderRadius: 11, padding: '11px 13px', marginBottom: 12,
              border: `1px solid rgba(255,215,0,0.1)`,
            }}>
              {gerente.linkReferido}
            </div>
            <button
              onClick={() => { copiar(gerente.linkReferido); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 11, border: `1px solid ${C.border}`,
                background: 'rgba(255,215,0,0.08)', color: C.gold, fontFamily: 'Cinzel, serif',
                fontSize: 11, letterSpacing: 1.5, cursor: 'pointer',
              }}
            >
              {copiado ? '✓ COPIADO' : '📋 COPIAR Y COMPARTIR'}
            </button>
          </div>

          <button
            onClick={onSalir}
            style={{ display: 'block', margin: '0 auto', background: 'none', border: 'none', color: C.muted, fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1.5, cursor: 'pointer' }}
          >
            CAMBIAR DE CÓDIGO
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function LiderDashboardPage() {
  const [codigo, setCodigo]     = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [data, setData]         = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  const consultar = useCallback(async (cod) => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: cod }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'No se pudo entrar. Revisa tu código.');
        localStorage.removeItem(STORAGE_KEY);
        setCodigo('');
        setData(null);
        return;
      }
      localStorage.setItem(STORAGE_KEY, cod);
      setData(json);
    } catch (e) {
      setError('Sin conexión. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (codigo) consultar(codigo);
  }, []); // solo al abrir la app, si ya había un código guardado

  const salir = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCodigo('');
    setData(null);
  };

  if (data) {
    return data.rol === 'gerente'
      ? <PantallaDashboardGerente data={data} onSalir={salir} />
      : <PantallaDashboard data={data} onSalir={salir} />;
  }
  return (
    <PantallaCodigo
      onEntrar={(val) => { const c = val.trim().toUpperCase(); if (c) consultar(c); }}
      cargando={cargando}
      error={error}
    />
  );
}