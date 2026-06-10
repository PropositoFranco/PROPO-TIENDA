/**
 * GraduacionCeremonia.jsx — RECONSTRUIDO
 *
 * ─── INTEGRACIÓN ────────────────────────────────────────────────────────────
 * 1. En App.jsx:
 *    import GraduacionCeremonia from './components/GraduacionCeremonia';
 *    import { useGraduacionStore } from './store/useGraduacionStore';
 *    // En tu JSX raíz:
 *    {mostrar && <GraduacionCeremonia />}
 *
 * 2. En ModuleViewer.jsx, al guardar evidencia de R5:
 *    if (modulo.protocolo === 'R5') useGraduacionStore.getState().activar();
 *
 * 3. Supabase:
 *    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS graduated_at timestamptz;
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { create } from 'zustand';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';

// ─── Store ───────────────────────────────────────────────────────────────────
export const useGraduacionStore = create((set) => ({
  mostrar: false,
  activar: () => set({ mostrar: true }),
  cerrar:  () => set({ mostrar: false }),
}));

// ─── Stripe ──────────────────────────────────────────────────────────────────
const STRIPE_LEGADO = 'https://buy.stripe.com/aFa7sLfO7aW6ggK0U0enS0q';

// ─── Audio ceremonial — Web Audio API puro ───────────────────────────────────
function crearAudio() {
  let ctx = null;

  const C = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  // Nota base con compresor
  const nota = (freq, t0, dur, vol = 0.12, tipo = 'sine', atk = 0.02) => {
    try {
      const c = C();
      const osc  = c.createOscillator();
      const gain = c.createGain();
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -24; comp.ratio.value = 8;
      osc.connect(gain); gain.connect(comp); comp.connect(c.destination);
      osc.type = tipo; osc.frequency.value = freq;
      const now = c.currentTime;
      gain.gain.setValueAtTime(0, now + t0);
      gain.gain.linearRampToValueAtTime(vol, now + t0 + atk);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t0 + dur);
      osc.start(now + t0);
      osc.stop(now + t0 + dur + 0.1);
    } catch (_) {}
  };

  // Reverb convolucionado
  const reverb = (freq, t0, dur, vol = 0.05) => {
    try {
      const c = C();
      const osc  = c.createOscillator();
      const gain = c.createGain();
      const conv = c.createConvolver();
      const len  = c.sampleRate * 2.5;
      const buf  = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++)
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
      }
      conv.buffer = buf;
      osc.connect(gain); gain.connect(conv); conv.connect(c.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      const now = c.currentTime;
      gain.gain.setValueAtTime(0, now + t0);
      gain.gain.linearRampToValueAtTime(vol, now + t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t0 + dur);
      osc.start(now + t0); osc.stop(now + t0 + dur + 0.1);
    } catch (_) {}
  };

  // Bombo grave
  const bombo = (t0, vol = 0.5) => {
    try {
      const c = C();
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain); gain.connect(c.destination);
      osc.type = 'sine';
      const now = c.currentTime;
      osc.frequency.setValueAtTime(160, now + t0);
      osc.frequency.exponentialRampToValueAtTime(35, now + t0 + 0.45);
      gain.gain.setValueAtTime(vol, now + t0);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t0 + 0.55);
      osc.start(now + t0); osc.stop(now + t0 + 0.6);
    } catch (_) {}
  };

  // Platillo metálico
  const platillo = (t0, vol = 0.07, dur = 0.25) => {
    try {
      const c    = C();
      const size = Math.floor(c.sampleRate * dur);
      const buf  = c.createBuffer(1, size, c.sampleRate);
      const d    = buf.getChannelData(0);
      for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
      const src    = c.createBufferSource();
      src.buffer   = buf;
      const filt   = c.createBiquadFilter();
      filt.type    = 'highpass'; filt.frequency.value = 9000;
      const gain   = c.createGain();
      src.connect(filt); filt.connect(gain); gain.connect(c.destination);
      const now = c.currentTime;
      gain.gain.setValueAtTime(vol, now + t0);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t0 + dur);
      src.start(now + t0); src.stop(now + t0 + dur + 0.05);
    } catch (_) {}
  };

  // Pad de cuerdas oscilante
  const cuerda = (freq, t0, dur, vol = 0.055) => {
    nota(freq, t0, dur, vol, 'sawtooth', 0.6);
    reverb(freq, t0 + 0.2, dur * 0.8, vol * 0.4);
  };

  // Campana de cristal pura
  const campana = (freq, t0, dur, vol = 0.18) => {
    nota(freq, t0, dur, vol, 'sine', 0.005);
    nota(freq * 2, t0, dur * 0.5, vol * 0.25, 'sine', 0.005);
    reverb(freq, t0, dur * 1.2, vol * 0.45);
  };

  return {
    // FASE 1 — Un golpe solitario. Silencio roto.
    fase1() {
      bombo(0.4, 0.7);
      platillo(0.4, 0.06, 1.2);
      reverb(60, 0.4, 2.5, 0.03);
    },

    // FASE 2 — El nombre emerge. Cuerdas que ascienden lentamente.
    fase2() {
      [[130.81, 0], [164.81, 0.5], [196, 1.0]].forEach(([f, t]) => cuerda(f, t, 3.5));
      [[261.63, 0.6], [329.63, 1.1], [392, 1.6]].forEach(([f, t]) => cuerda(f, t, 3));
      reverb(130.81, 0, 5, 0.04);
    },

    // FASE 3 — El 23%. Dos notas de piano. Mucho silencio.
    fase3() {
      campana(220, 0.3, 3.5, 0.14);
      campana(329.63, 1.4, 3, 0.10);
      reverb(220, 0.3, 4, 0.06);
    },

    // FASE 4 — TEMPLARIO GRADUADO. Fanfarria épica ascendente.
    fase4() {
      // Melodía heroica — Re mayor ascendente con bombos rítmicos
      const mel = [
        [261.63, 0, 0.22], [329.63, 0.22, 0.22], [392, 0.44, 0.22],
        [523.25, 0.66, 0.55], [659.25, 1.25, 0.35], [783.99, 1.6, 0.35],
        [1046.5, 1.95, 1.4],
      ];
      mel.forEach(([f, t, d]) => {
        nota(f, t, d, 0.16, 'square', 0.008);
        nota(f * 0.5, t, d, 0.07, 'sawtooth', 0.015);
      });
      // Bombos en tiempos fuertes
      [0, 0.5, 1.0, 1.5, 2.0].forEach(t => bombo(t, 0.4));
      // Platillos rítmicos
      [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5].forEach(t =>
        platillo(t, 0.065, 0.18)
      );
      // Acordes de soporte
      [[130.81, 164.81, 196, 0, 1.3],
       [174.61, 220, 261.63, 1.3, 0.8],
       [196, 246.94, 293.66, 2.1, 1.3]].forEach(([f1, f2, f3, t, d]) => {
        [f1, f2, f3].forEach(f => cuerda(f, t, d, 0.045));
      });
    },

    // FASE 5 — Sello. Una campana limpia. Sostenida. Largo silencio.
    fase5() {
      campana(1046.5, 0,   5, 0.22);
      campana(783.99, 0.1, 4, 0.10);
      reverb(523.25, 0, 6, 0.08);
      // Acorde final sostenido suave
      [[130.81, 164.81, 196, 261.63]].flat().forEach((f, i) =>
        cuerda(f, 0.6 + i * 0.1, 6, 0.035)
      );
    },

    // FASE 6 — Decisión. Pulso mínimo. Casi silencio.
    fase6() {
      [0, 2.5, 5, 7.5].forEach(t => {
        nota(130.81, t, 1,   0.028, 'sine', 0.15);
        nota(196,    t + 0.12, 0.8, 0.018, 'sine', 0.15);
      });
    },
  };
}

// ─── Canvas de partículas ceremoniales ───────────────────────────────────────
function ParticulasOro({ fase }) {
  const cv = useRef(null);
  const st = useRef({ pts: [], raf: null });

  useEffect(() => {
    const c   = cv.current;
    if (!c) return;
    const ctx = c.getContext('2d');

    const resize = () => {
      c.width  = window.innerWidth;
      c.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COLORES = ['#d4af37', '#fde68a', '#fff8dc', '#C084FC', '#e2c4ff', '#ffffff'];

    st.current.pts = Array.from({ length: 180 }, (_, i) => ({
      x:   Math.random() * c.width,
      y:   Math.random() * c.height,
      vx:  (Math.random() - 0.5) * 0.4,
      vy:  -(Math.random() * 0.6 + 0.15),
      r:   Math.random() * 1.8 + 0.3,
      op:  Math.random() * 0.5 + 0.1,
      ph:  Math.random() * Math.PI * 2,
      spd: Math.random() * 0.012 + 0.006,
      col: COLORES[Math.floor(Math.random() * COLORES.length)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      st.current.pts.forEach(p => {
        p.ph += p.spd;
        p.x  += p.vx + Math.sin(p.ph) * 0.25;
        p.y  += p.vy;
        if (p.y < -8) {
          p.y = c.height + 8;
          p.x = Math.random() * c.width;
          p.op = Math.random() * 0.5 + 0.1;
        }
        ctx.globalAlpha = p.op * (0.4 + Math.sin(p.ph) * 0.4);
        ctx.fillStyle   = p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      st.current.raf  = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(st.current.raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Burst épico en fase 4 — fanfarria
  useEffect(() => {
    if (fase < 4) return;
    const pts = st.current.pts;
    pts.forEach(p => {
      p.vy  *= 4.5;
      p.vx  *= 4.5;
      p.r   *= 2.5;
    });
    const reset = setTimeout(() => {
      pts.forEach(p => {
        p.vy = -(Math.random() * 0.6 + 0.15);
        p.vx = (Math.random() - 0.5) * 0.4;
        p.r  = Math.random() * 1.8 + 0.3;
      });
    }, 1800);
    return () => clearTimeout(reset);
  }, [fase]);

  return (
    <canvas
      ref={cv}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: fase >= 1 ? 1 : 0,
        transition: 'opacity 2s ease',
      }}
    />
  );
}

// ─── Rayos solares de fondo (fase 4+) ────────────────────────────────────────
function RayosSolares({ visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {Array.from({ length: 16 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: '2px',
            height: '55vh',
            marginLeft: '-1px',
            transformOrigin: '50% 0',
            transform: `rotate(${i * 22.5}deg)`,
            background: `linear-gradient(to bottom, rgba(212,175,55,${0.28 - i * 0.008}), transparent)`,
            animation: `rayoGlow ${2.2 + (i % 3) * 0.5}s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Sello SVG de graduación ──────────────────────────────────────────────────
function SelloSVG({ size = 200, animado = true }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 220 220"
      style={{
        filter: 'drop-shadow(0 0 24px rgba(212,175,55,0.55))',
        animation: animado ? 'selloFloat 5s ease-in-out infinite' : 'none',
      }}
    >
      <defs>
        <radialGradient id="sg1" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(212,175,55,0.28)" />
          <stop offset="100%" stopColor="rgba(212,175,55,0.04)" />
        </radialGradient>
      </defs>

      {/* Anillos */}
      <circle cx="110" cy="110" r="106" fill="none" stroke="rgba(212,175,55,0.10)" strokeWidth="1" />
      <circle cx="110" cy="110" r="99"  fill="none" stroke="rgba(212,175,55,0.28)" strokeWidth="0.7"
        strokeDasharray="5 3.5"
        style={{ animation: 'selloSpin 28s linear infinite', transformOrigin: '110px 110px' }}
      />
      <circle cx="110" cy="110" r="91"  fill="none" stroke="rgba(212,175,55,0.55)" strokeWidth="1.5" />
      <circle cx="110" cy="110" r="89"  fill="url(#sg1)" />

      {/* Rayos cortos */}
      {Array.from({ length: 32 }, (_, i) => {
        const a  = (i / 32) * 360;
        const r0 = i % 2 === 0 ? 78 : 82;
        const r1 = 88;
        const rad = a * Math.PI / 180;
        return (
          <line key={i}
            x1={110 + Math.cos(rad) * r0} y1={110 + Math.sin(rad) * r0}
            x2={110 + Math.cos(rad) * r1} y2={110 + Math.sin(rad) * r1}
            stroke={i % 2 === 0 ? 'rgba(212,175,55,0.85)' : 'rgba(212,175,55,0.3)'}
            strokeWidth={i % 2 === 0 ? 1.5 : 0.7}
          />
        );
      })}

      {/* Estrella de 5 puntas */}
      <polygon
        points="110,55 120,86 154,86 127,105 138,136 110,118 82,136 93,105 66,86 100,86"
        fill="rgba(212,175,55,0.12)"
        stroke="#d4af37"
        strokeWidth="1.2"
      />

      {/* Espada central */}
      <g transform="translate(110,110)">
        <rect x="-2.5" y="-34" width="5" height="54" rx="1.5" fill="#d4af37" opacity="0.9" />
        <rect x="-14"  y="-6"  width="28" height="4"  rx="1.5" fill="#d4af37" opacity="0.75" />
        <circle cx="0" cy="-37" r="5" fill="#fde68a" opacity="0.95" />
        <rect x="-4" y="20" width="8" height="9" rx="2" fill="#d4af37" opacity="0.65" />
      </g>

      {/* Texto circular */}
      <path id="cp" d="M 110,110 m -68,0 a 68,68 0 1,1 136,0 a 68,68 0 1,1 -136,0" fill="none" />
      <text fontFamily="'Cinzel', serif" fontSize="8.5" fill="rgba(212,175,55,0.75)" letterSpacing="2.8">
        <textPath href="#cp" startOffset="4%">
          TEMPLO DEL PROPÓSITO · TEMPLARIO GRADUADO · {new Date().getFullYear()} ·
        </textPath>
      </text>
    </svg>
  );
}

// ─── Texto letra por letra ────────────────────────────────────────────────────
function TextoTipeo({ texto, activo, delay = 0, velocidad = 55, style = {} }) {
  const [mostrado, setMostrado] = useState('');
  const [listo, setListo]       = useState(false);

  useEffect(() => {
    if (!activo) { setMostrado(''); setListo(false); return; }
    let i   = 0;
    let iv  = null;
    const t = setTimeout(() => {
      iv = setInterval(() => {
        i++;
        setMostrado(texto.slice(0, i));
        if (i >= texto.length) { clearInterval(iv); setListo(true); }
      }, velocidad);
    }, delay);
    return () => { clearTimeout(t); if (iv) clearInterval(iv); };
  }, [activo, texto, delay, velocidad]);

  return (
    <span style={style}>
      {mostrado}
      {!listo && activo && (
        <span style={{
          display: 'inline-block', width: '2px',
          height: '0.9em', background: '#d4af37',
          marginLeft: '3px', verticalAlign: 'text-bottom',
          animation: 'curBlink 0.7s ease-in-out infinite',
        }} />
      )}
    </span>
  );
}

// ─── Beneficio pill ───────────────────────────────────────────────────────────
function Beneficio({ texto }) {
  return (
    <div style={{
      padding: '6px 16px',
      borderRadius: '100px',
      background: 'rgba(212,175,55,0.07)',
      border: '1px solid rgba(212,175,55,0.22)',
      fontFamily: "'Cinzel', serif",
      fontSize: 'clamp(8px, 1.4vw, 10px)',
      color: 'rgba(212,175,55,0.85)',
      letterSpacing: '1px',
      whiteSpace: 'nowrap',
    }}>{texto}</div>
  );
}

// ─── Firma ────────────────────────────────────────────────────────────────────
function Firma({ nombre, titulo }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: 'clamp(9px, 1.6vw, 11px)',
        fontWeight: 700,
        color: 'rgba(212,175,55,0.85)',
        letterSpacing: '1.2px',
        marginBottom: '4px',
      }}>{nombre}</div>
      <div style={{
        width: '88px', height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
        margin: '0 auto 4px',
      }} />
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: 'clamp(7px, 1.1vw, 9px)',
        color: 'rgba(212,175,55,0.45)',
        letterSpacing: '1.8px',
        textTransform: 'uppercase',
      }}>{titulo}</div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GraduacionCeremonia() {
  const cerrar          = useGraduacionStore(s => s.cerrar);
  const { profile }     = useAuthStore();
  const { templarioName } = usePlayerStore();
  const nombre = templarioName || profile?.templario_name
    || profile?.email?.split('@')[0] || 'Templario';

  const [fase, setFase]               = useState(0);
  const [mostrarDecision, setDecision] = useState(false);
  const [hovLegado, setHovLegado]     = useState(false);
  const [hovSalir, setHovSalir]       = useState(false);
  const audio = useRef(null);

  // Guardar en Supabase
  const guardar = useCallback(async () => {
    try {
      const { supabase } = await import('../services/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('profiles')
        .update({ graduated_at: new Date().toISOString() })
        .eq('id', user.id);
    } catch (_) {}
  }, []);

  // Secuencia temporal de fases
  useEffect(() => {
    audio.current = crearAudio();
    guardar();

    // F1 — bombo solitario
    const t1 = setTimeout(() => { setFase(1); audio.current.fase1(); }, 700);
    // F2 — nombre
    const t2 = setTimeout(() => { setFase(2); audio.current.fase2(); }, 3200);
    // F3 — 23%
    const t3 = setTimeout(() => { setFase(3); audio.current.fase3(); }, 7500);
    // F4 — TEMPLARIO GRADUADO
    const t4 = setTimeout(() => { setFase(4); audio.current.fase4(); }, 12000);
    // F5 — sello + campana
    const t5 = setTimeout(() => { setFase(5); audio.current.fase5(); }, 17500);
    // F6 — decisión
    const t6 = setTimeout(() => { setFase(6); setDecision(true); audio.current.fase6(); }, 23000);

    return () => [t1,t2,t3,t4,t5,t6].forEach(clearTimeout);
  }, []);

  const irLegado = () => { window.open(STRIPE_LEGADO, '_blank'); cerrar(); };
  const salir    = () => cerrar();

  // CSS global inyectado
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@400;700;900&display=swap');
    @keyframes curBlink    { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes fadeUp      { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn      { from{opacity:0} to{opacity:1} }
    @keyframes scaleIn     { from{opacity:0;transform:scale(0.25)} to{opacity:1;transform:scale(1)} }
    @keyframes shimmer     { 0%{background-position:200% center} 100%{background-position:-200% center} }
    @keyframes glow        { 0%,100%{text-shadow:0 0 20px rgba(212,175,55,0.5),0 0 50px rgba(212,175,55,0.2)} 50%{text-shadow:0 0 50px rgba(212,175,55,1),0 0 100px rgba(212,175,55,0.5),0 0 140px rgba(212,175,55,0.2)} }
    @keyframes pulse       { 0%,100%{opacity:0.55} 50%{opacity:1} }
    @keyframes floatY      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes lineGrow    { from{width:0;opacity:0} to{width:100%;opacity:1} }
    @keyframes num23in     { from{opacity:0;transform:scale(2.8) translateY(-20px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes btnPulse    { 0%,100%{box-shadow:0 0 28px rgba(212,175,55,0.35)} 50%{box-shadow:0 0 55px rgba(212,175,55,0.75),0 0 90px rgba(212,175,55,0.2)} }
    @keyframes decisionIn  { from{opacity:0;transform:translateY(44px)} to{opacity:1;transform:translateY(0)} }
    @keyframes selloFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes selloSpin   { to{stroke-dashoffset:-100} }
    @keyframes rayoGlow    { 0%,100%{opacity:0.35} 50%{opacity:0.85} }
    @keyframes bgPurple    { from{background:radial-gradient(ellipse at center,#000 0%,#000 100%)} to{background:radial-gradient(ellipse at center,#080318 0%,#020010 55%,#000 100%)} }
  `;

  // ── FONDO dinámico según fase
  const BG = fase >= 4
    ? 'radial-gradient(ellipse at center, #090320 0%, #03000e 55%, #000 100%)'
    : '#000';

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: BG,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      transition: 'background 2.5s ease',
    }}>
      <style>{CSS}</style>

      {/* Canvas partículas */}
      <ParticulasOro fase={fase} />

      {/* Rayos en fase 4+ */}
      <RayosSolares visible={fase >= 4} />

      {/* ══════════════════════════════════════════════════════════
          FASE 0 — Punto de luz pulsante
      ══════════════════════════════════════════════════════════ */}
      {fase === 0 && (
        <div style={{
          position: 'relative', zIndex: 10,
          width: '6px', height: '6px', borderRadius: '50%',
          background: '#d4af37',
          boxShadow: '0 0 16px #d4af37, 0 0 40px rgba(212,175,55,0.4)',
          animation: 'pulse 1.4s ease-in-out infinite',
        }} />
      )}

      {/* ══════════════════════════════════════════════════════════
          FASE 1 — Línea vertical de luz
      ══════════════════════════════════════════════════════════ */}
      {fase === 1 && (
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          animation: 'fadeIn 0.8s ease both',
        }}>
          <div style={{
            width: '1px',
            height: 'clamp(160px, 38vh, 320px)',
            background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.9), transparent)',
            animation: 'pulse 0.85s ease-in-out infinite',
          }} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          FASE 2 — El nombre emerge
      ══════════════════════════════════════════════════════════ */}
      {fase === 2 && (
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 'clamp(16px, 3vh, 28px)',
          padding: '0 clamp(24px, 6vw, 60px)',
          textAlign: 'center',
          animation: 'fadeUp 1.2s ease both',
        }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(9px, 1.6vw, 12px)',
            letterSpacing: 'clamp(4px, 1vw, 7px)',
            color: 'rgba(212,175,55,0.45)',
            textTransform: 'uppercase',
          }}>El Templo reconoce a</div>

          <div style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 'clamp(30px, 6.5vw, 80px)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #fff8dc 0%, #fde68a 35%, #d4af37 55%, #fde68a 75%, #fff8dc 100%)',
            backgroundSize: '300% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 5s linear infinite, glow 3s ease-in-out infinite',
            letterSpacing: 'clamp(2px, 0.8vw, 5px)',
            lineHeight: 1.1,
            maxWidth: 'min(90vw, 780px)',
            wordBreak: 'break-word',
          }}>
            <TextoTipeo
              texto={nombre.toUpperCase()}
              activo={true}
              delay={400}
              velocidad={60}
            />
          </div>

          <div style={{
            width: '0%', height: '1px',
            background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
            animation: 'lineGrow 2s ease 1.2s forwards',
            alignSelf: 'stretch',
          }} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          FASE 3 — El número 23%
      ══════════════════════════════════════════════════════════ */}
      {fase === 3 && (
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center',
          padding: '0 clamp(24px, 6vw, 60px)',
          gap: 'clamp(12px, 3vh, 24px)',
        }}>
          {/* Número fantasma de fondo */}
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(90px, 18vw, 200px)',
            fontWeight: 900,
            color: 'rgba(212,175,55,0.08)',
            position: 'absolute',
            animation: 'num23in 1.2s cubic-bezier(0.34,1.4,0.64,1) both',
            letterSpacing: '-6px',
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
          }}>23%</div>

          {/* Espaciador */}
          <div style={{ height: 'clamp(60px, 12vh, 130px)' }} />

          {/* Texto */}
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(13px, 2.4vw, 22px)',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.65)',
            letterSpacing: 'clamp(2px, 0.5vw, 4px)',
            animation: 'fadeUp 1s ease 1.2s both',
            maxWidth: 'min(88vw, 520px)',
            lineHeight: 1.8,
          }}>
            Más del 77% abandona
          </div>

          <div style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 'clamp(22px, 4.5vw, 44px)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #fde68a, #d4af37)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'fadeUp 0.9s ease 2s both, glow 2.5s ease-in-out infinite',
          }}>Tú no.</div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          FASE 4 — TEMPLARIO GRADUADO — fanfarria
      ══════════════════════════════════════════════════════════ */}
      {fase === 4 && (
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 'clamp(12px, 2.5vh, 24px)',
          textAlign: 'center',
          padding: '0 clamp(20px, 5vw, 60px)',
        }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(8px, 1.4vw, 11px)',
            letterSpacing: 'clamp(4px, 1vw, 8px)',
            color: 'rgba(212,175,55,0.55)',
            animation: 'fadeIn 0.6s ease both',
            textTransform: 'uppercase',
          }}>⚔ El Templo te otorga el título de ⚔</div>

          <div style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 'clamp(26px, 6vw, 72px)',
            fontWeight: 900,
            letterSpacing: 'clamp(2px, 1vw, 7px)',
            lineHeight: 1.1,
            background: 'linear-gradient(135deg, #fff8dc 0%, #fde68a 30%, #d4af37 50%, #fde68a 70%, #fff8dc 100%)',
            backgroundSize: '300% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'scaleIn 0.9s cubic-bezier(0.34,1.5,0.64,1) 0.2s both, shimmer 3.5s linear infinite, glow 2s ease-in-out infinite',
          }}>
            TEMPLARIO<br />GRADUADO
          </div>

          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(16px, 3.5vw, 38px)',
            fontWeight: 900,
            color: '#fde68a',
            letterSpacing: 'clamp(2px, 0.8vw, 5px)',
            animation: 'fadeUp 0.9s ease 0.9s both',
            maxWidth: 'min(90vw, 700px)',
            wordBreak: 'break-word',
          }}>{nombre.toUpperCase()}</div>

          {/* Ornamento */}
          <div style={{
            display: 'flex',
            gap: 'clamp(18px, 4vw, 44px)',
            animation: 'fadeIn 1s ease 1.4s both',
            marginTop: 'clamp(4px, 1vh, 12px)',
          }}>
            {['⚔', '✦', '👑', '✦', '⚔'].map((s, i) => (
              <span key={i} style={{
                fontSize: 'clamp(14px, 2.5vw, 24px)',
                color: '#d4af37',
                animation: `pulse ${1.4 + i * 0.2}s ease-in-out ${i * 0.12}s infinite`,
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          FASE 5 — Sello + campana
      ══════════════════════════════════════════════════════════ */}
      {fase === 5 && (
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center',
          gap: 'clamp(6px, 2vh, 16px)',
          padding: '0 clamp(20px, 5vw, 60px)',
          animation: 'fadeUp 1.2s ease both',
        }}>
          <div style={{
            animation: 'scaleIn 1.4s cubic-bezier(0.34,1.5,0.64,1) 0.3s both',
          }}>
            <SelloSVG size={Math.min(window.innerWidth * 0.55, 210)} />
          </div>

          <div style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 'clamp(18px, 4vw, 40px)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #fde68a, #d4af37, #fff8dc)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'fadeUp 1.2s ease 0.8s both, shimmer 5s linear infinite',
            letterSpacing: 'clamp(2px, 0.8vw, 5px)',
            maxWidth: 'min(90vw, 680px)',
            wordBreak: 'break-word',
          }}>{nombre.toUpperCase()}</div>

          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(7px, 1.2vw, 9px)',
            letterSpacing: 'clamp(3px, 0.8vw, 6px)',
            color: 'rgba(212,175,55,0.45)',
            animation: 'fadeIn 1s ease 1.6s both',
            textTransform: 'uppercase',
          }}>
            Templario Graduado · {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase()}
          </div>

          <div style={{
            width: 'clamp(140px, 30vw, 220px)', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.55), transparent)',
            animation: 'fadeIn 1s ease 2.2s both',
          }} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          FASE 6 — La Decisión
      ══════════════════════════════════════════════════════════ */}
      {fase >= 6 && mostrarDecision && (
        <div style={{
          position: 'relative', zIndex: 10,
          width: '100%',
          maxWidth: 'min(600px, 94vw)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '0 clamp(16px, 4vw, 36px)',
          overflowY: 'auto',
          maxHeight: '94vh',
          gap: 0,
          animation: 'decisionIn 1.4s cubic-bezier(0.34,1.1,0.64,1) both',
        }}>

          {/* Sello + nombre (header compacto) */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 'clamp(4px, 1vh, 10px)',
            marginBottom: 'clamp(12px, 2.5vh, 22px)',
            paddingTop: 'clamp(12px, 2vh, 20px)',
          }}>
            <div style={{ animation: 'floatY 4.5s ease-in-out infinite' }}>
              <SelloSVG size={Math.min(window.innerWidth * 0.32, 120)} animado={false} />
            </div>

            <div style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 'clamp(14px, 3vw, 26px)',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #fde68a, #d4af37)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: 'clamp(2px, 0.6vw, 4px)',
              animation: 'glow 3.5s ease-in-out infinite',
              textAlign: 'center',
              maxWidth: 'min(90vw, 560px)',
              wordBreak: 'break-word',
            }}>{nombre.toUpperCase()}</div>

            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(7px, 1.2vw, 9px)',
              letterSpacing: 'clamp(3px, 0.8vw, 6px)',
              color: 'rgba(212,175,55,0.4)',
              textTransform: 'uppercase',
            }}>Templario Graduado</div>
          </div>

          {/* Separador */}
          <div style={{
            width: '100%', height: '1px', marginBottom: 'clamp(14px, 2.5vh, 24px)',
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.35), transparent)',
          }} />

          {/* Card PROPO-LEGADO */}
          <div style={{
            width: '100%',
            borderRadius: '22px',
            background: 'linear-gradient(150deg, rgba(212,175,55,0.10) 0%, rgba(6,2,22,0.97) 45%, rgba(1,0,10,1) 100%)',
            border: '1px solid rgba(212,175,55,0.38)',
            boxShadow: '0 0 55px rgba(212,175,55,0.10), 0 30px 70px rgba(0,0,0,0.75), inset 0 1px 0 rgba(212,175,55,0.18)',
            padding: 'clamp(20px, 4vw, 34px)',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 'clamp(14px, 2.5vh, 22px)',
          }}>
            {/* Shimmer sobre la card */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '22px',
              background: 'linear-gradient(105deg, transparent 0%, rgba(212,175,55,0.03) 45%, rgba(255,255,255,0.05) 50%, rgba(212,175,55,0.03) 55%, transparent 100%)',
              backgroundSize: '300% 300%',
              animation: 'shimmer 5s ease-in-out infinite',
              pointerEvents: 'none',
            }} />

            {/* Nombre del plan */}
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(16px, 3.2vw, 26px)',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #fff8dc, #fde68a, #d4af37)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 3.5s linear infinite',
              letterSpacing: 'clamp(3px, 0.8vw, 5px)',
              marginBottom: 'clamp(10px, 2vh, 18px)',
              textAlign: 'center',
              position: 'relative', zIndex: 1,
            }}>PROPO-LEGADO</div>

            {/* Precio */}
            <div style={{
              display: 'flex', alignItems: 'baseline',
              justifyContent: 'center', gap: '6px',
              marginBottom: 'clamp(12px, 2.2vh, 20px)',
              position: 'relative', zIndex: 1,
            }}>
              <span style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(32px, 7vw, 52px)',
                fontWeight: 900,
                color: '#fde68a',
                textShadow: '0 0 28px rgba(212,175,55,0.75)',
                lineHeight: 1,
              }}>$3.99</span>
              <span style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(8px, 1.4vw, 11px)',
                color: 'rgba(212,175,55,0.45)',
                letterSpacing: '2px',
              }}>/MES</span>
            </div>

            {/* Separador */}
            <div style={{
              width: '55%', height: '1px', margin: '0 auto',
              marginBottom: 'clamp(12px, 2.2vh, 20px)',
              background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.28), transparent)',
              position: 'relative', zIndex: 1,
            }} />

            {/* Copy */}
            <p style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(11px, 1.8vw, 13px)',
              color: 'rgba(220,210,255,0.65)',
              lineHeight: 1.85,
              textAlign: 'center',
              marginBottom: 'clamp(10px, 2vh, 18px)',
              letterSpacing: '0.3px',
              position: 'relative', zIndex: 1,
              maxWidth: '520px',
              margin: '0 auto',
            }}>
              Menos del 23% de quienes inician llegan aquí. Tú eres uno de ellos.
              El Templo te reconoce — no como alumno, sino como Templario Graduado.
              Por $3.99/mes mantienes tu arsenal, tu Propotienda y acceso a todo lo que viene.
            </p>

            {/* Separador fino */}
            <div style={{
              width: '38%', height: '1px',
              margin: 'clamp(12px, 2vh, 18px) auto',
              background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.12), transparent)',
              position: 'relative', zIndex: 1,
            }} />

            {/* Firmas */}
            <div style={{
              display: 'flex', justifyContent: 'center',
              gap: 'clamp(24px, 6vw, 56px)',
              marginBottom: 'clamp(14px, 2.5vh, 22px)',
              position: 'relative', zIndex: 1,
            }}>
              <Firma nombre="Daniel Franco"  titulo="Director del Templo" />
              <Firma nombre="Carlos Alonso" titulo="Co-Fundador" />
            </div>

            {/* Beneficios */}
            <div style={{
              display: 'flex', flexWrap: 'wrap',
              justifyContent: 'center', gap: '7px',
              marginBottom: 'clamp(16px, 3vh, 26px)',
              position: 'relative', zIndex: 1,
            }}>
              {['⚔ Arsenal completo', '🏛 Propotienda', '✦ 100 Templarios', '🔮 Actualizaciones'].map((b, i) => (
                <Beneficio key={i} texto={b} />
              ))}
            </div>

            {/* Botón principal */}
            <button
              onClick={irLegado}
              onMouseEnter={() => setHovLegado(true)}
              onMouseLeave={() => setHovLegado(false)}
              style={{
                width: '100%',
                padding: 'clamp(14px, 2.5vw, 18px)',
                borderRadius: '100px',
                background: hovLegado
                  ? 'linear-gradient(135deg, rgba(212,175,55,0.48), rgba(212,175,55,0.28))'
                  : 'linear-gradient(135deg, rgba(212,175,55,0.30), rgba(212,175,55,0.12))',
                border: '1.5px solid #d4af37',
                color: '#fde68a',
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(10px, 1.8vw, 13px)',
                fontWeight: 900,
                letterSpacing: 'clamp(2px, 0.5vw, 4px)',
                cursor: 'pointer',
                position: 'relative', zIndex: 1, overflow: 'hidden',
                transition: 'all 0.28s ease',
                transform: hovLegado ? 'translateY(-3px)' : 'translateY(0)',
                animation: 'btnPulse 3s ease-in-out infinite',
              }}
            >
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '100px',
                background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.10) 50%, transparent)',
                backgroundSize: '200% 200%',
                animation: 'shimmer 2.5s ease-in-out infinite',
              }} />
              <span style={{ position: 'relative', zIndex: 1 }}>
                ⚔ MANTENER MI LEGADO
              </span>
            </button>
          </div>

          {/* Botón salir — silencioso, sin decoración */}
          <button
            onClick={salir}
            onMouseEnter={() => setHovSalir(true)}
            onMouseLeave={() => setHovSalir(false)}
            style={{
              background: 'transparent', border: 'none',
              color: hovSalir ? 'rgba(200,185,240,0.5)' : 'rgba(200,185,240,0.2)',
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(7px, 1.2vw, 9px)',
              letterSpacing: 'clamp(2px, 0.5vw, 3px)',
              cursor: 'pointer',
              padding: 'clamp(10px, 2vh, 16px) 24px',
              transition: 'color 0.3s ease',
              textTransform: 'uppercase',
            }}
          >
            Ya concluí mi camino
          </button>

        </div>
      )}

    </div>
  );
}