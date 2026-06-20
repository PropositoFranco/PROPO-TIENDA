/**
 * SorteoPage.jsx — Templo del Propósito
 * Ruta: /sorteo/:eventoId  (PÚBLICA — sin auth, sin paywall)
 * Sistema de rifas continuas automáticas con estética épica
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';

// ── Paleta ────────────────────────────────────────────────────────────────────
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

const SCREEN = {
  LOADING:  'loading',
  REGISTRO: 'registro',
  ESPERA:   'espera',
  SORTEO:   'sorteo',
  GANADOR:  'ganador',
  PREMIO:   'premio',
  CAUSA:    'causa',
  CERRADO:  'cerrado',
};

// ── CSS Global ─────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #04020e; overflow-x: hidden; }
  input, button { font-family: inherit; }
  input::placeholder { color: rgba(212,175,55,0.28); }
  input:focus { border-color: rgba(212,175,55,0.55) !important; outline: none !important; box-shadow: 0 0 0 3px rgba(212,175,55,0.08) !important; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 2px; }

  @keyframes floatY     { 0%,100%{transform:translateY(0)}       50%{transform:translateY(-14px)} }
  @keyframes floatYSlow { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-8px) scale(1.02)} }
  @keyframes pulse      { 0%,100%{opacity:.55} 50%{opacity:1} }
  @keyframes pulseGlow  { 0%,100%{box-shadow:0 0 20px rgba(212,175,55,0.2)} 50%{box-shadow:0 0 60px rgba(212,175,55,0.6),0 0 100px rgba(212,175,55,0.2)} }
  @keyframes spin       { to{transform:rotate(360deg)} }
  @keyframes spinSlow   { to{transform:rotate(360deg)} }
  @keyframes fadeUp     { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
  @keyframes shimmer    { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes shake      { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
  @keyframes confettiFall { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
  @keyframes raysRotate { to{transform:rotate(360deg)} }
  @keyframes slideDown  { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sealPop    { 0%{transform:scale(0) rotate(-12deg);opacity:0} 70%{transform:scale(1.08) rotate(2deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes tagPop     { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
  @keyframes scanline   { 0%{top:-2px} 100%{top:100vh} }
  @keyframes particleDrift {
    0%  { transform:translateY(0)   translateX(0)   rotate(0deg);   opacity:.15; }
    33% { transform:translateY(-18px) translateX(6px)  rotate(60deg);  opacity:.35; }
    66% { transform:translateY(-8px)  translateX(-4px) rotate(120deg); opacity:.2; }
    100%{ transform:translateY(0)   translateX(0)   rotate(180deg); opacity:.15; }
  }
  @keyframes btnPulse   { 0%,100%{box-shadow:0 4px 28px rgba(255,215,0,0.4)} 50%{box-shadow:0 4px 60px rgba(255,215,0,0.8),0 0 100px rgba(255,215,0,0.2)} }
  @keyframes barFill    { from{width:0%} to{width:var(--target-w)} }
  @keyframes countUp    { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }
  @keyframes arcGlow    { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes textGlow   { 0%,100%{text-shadow:0 0 20px rgba(255,215,0,0.4)} 50%{text-shadow:0 0 60px rgba(255,215,0,1),0 0 100px rgba(255,215,0,0.4)} }
  @keyframes floatBeca  { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-6px) scale(1.02)} }
  @keyframes orbit      { from{transform:rotate(0deg) translateX(70px) rotate(0deg)} to{transform:rotate(360deg) translateX(70px) rotate(-360deg)} }
  @keyframes popIn      { 0%{opacity:0;transform:scale(0.5)} 70%{transform:scale(1.08)} 100%{opacity:1;transform:scale(1)} }
  @keyframes twinkle    { 0%,100%{opacity:var(--min,0.12);transform:scale(1)} 50%{opacity:1;transform:scale(1.6)} }
  @keyframes drumHit    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
  @keyframes revealZoom { 0%{transform:scale(0.2) rotate(-10deg);opacity:0} 65%{transform:scale(1.1) rotate(2deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
  @keyframes phaseIn    { 0%{opacity:0;transform:translateY(22px) scale(0.94)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes goldFlash  { 0%,100%{box-shadow:0 0 24px rgba(255,215,0,0.25)} 50%{box-shadow:0 0 70px rgba(255,215,0,0.7),0 0 140px rgba(255,215,0,0.2)} }
  @keyframes nebulaAnim { 0%,100%{transform:scale(1);opacity:0.75} 50%{transform:scale(1.06);opacity:1} }
  @keyframes warpIn     { 0%{letter-spacing:24px;opacity:0} 100%{letter-spacing:3px;opacity:1} }
  @keyframes heartbeat  { 0%,100%{transform:scale(1)} 14%{transform:scale(1.06)} 28%{transform:scale(1)} 42%{transform:scale(1.03)} }
`;

// ── Fondo épico: estrellas + nebulosa + partículas ─────────────────────────────
function Particles() {
  const stars = Array.from({ length: 58 }, (_, i) => ({
    size:  0.5 + (i % 4) * 0.7,
    left:  `${(i * 1.73 + 0.5) % 100}%`,
    top:   `${(i * 1.61 + 0.8) % 72}%`,
    dur:   `${2.2 + (i % 6) * 0.7}s`,
    delay: `${(i % 8) * 0.55}s`,
    min:   0.07 + (i % 5) * 0.05,
  }));
  const pts = Array.from({ length: 16 }, (_, i) => ({
    size:  1.5 + (i % 3),
    color: i % 4 === 0 ? 'rgba(212,175,55,0.4)'
         : i % 4 === 1 ? 'rgba(204,68,255,0.25)'
         : i % 4 === 2 ? 'rgba(68,136,255,0.2)' : 'rgba(255,229,102,0.3)',
    left:  `${(i * 6.3 + 1.2) % 100}%`,
    top:   `${(i * 6.7 + 2.8) % 100}%`,
    dur:   `${6.5 + i * 0.45}s`,
    delay: `${i * 0.36}s`,
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {/* Nebulosa multicapa — igual que hub */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 130% 65% at 50% 0%, rgba(30,10,80,0.88) 0%, transparent 58%),
          radial-gradient(ellipse 70% 50% at 14% 42%, rgba(10,30,95,0.48) 0%, transparent 54%),
          radial-gradient(ellipse 70% 50% at 86% 28%, rgba(50,8,95,0.4) 0%, transparent 54%),
          radial-gradient(ellipse 95% 70% at 50% 100%, rgba(4,2,14,0.96) 0%, transparent 64%)
        `,
        animation: 'nebulaAnim 22s ease-in-out infinite',
      }} />
      {/* Estrellas */}
      {stars.map((s, i) => (
        <div key={`s${i}`} style={{
          position: 'absolute', borderRadius: '50%', background: '#fff',
          width: s.size, height: s.size,
          left: s.left, top: s.top,
          ['--min']: s.min,
          animation: `twinkle ${s.dur} ease-in-out infinite`,
          animationDelay: s.delay,
        }} />
      ))}
      {/* Partículas doradas */}
      {pts.map((p, i) => (
        <div key={`p${i}`} style={{
          position: 'absolute',
          width: p.size, height: p.size, borderRadius: '50%',
          background: p.color,
          left: p.left, top: p.top,
          animation: `particleDrift ${p.dur} ease-in-out infinite`,
          animationDelay: p.delay,
        }} />
      ))}
      {/* Scanline */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.16),transparent)',
        animation: 'scanline 20s linear infinite',
      }} />
    </div>
  );
}

// ── Maestro Templario ──────────────────────────────────────────────────────────
const TEMPLARIOS = [
  'https://i.imgur.com/84ge8bg.jpeg',
  'https://i.imgur.com/Kl3nV5y.jpeg',
  'https://i.imgur.com/5caFtYa.jpeg',
  'https://i.imgur.com/elEQJb8.jpeg',
];

function Maestro({ size = 130, glow = true, animate = 'float', epic = false }) {
  const anim = animate === 'float' ? 'floatY 3.8s ease-in-out infinite'
             : animate === 'slow'  ? 'floatYSlow 5s ease-in-out infinite'
             : 'none';
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {glow && (
        <div style={{
          position: 'absolute', inset: -24,
          background: 'radial-gradient(circle, rgba(255,215,0,0.22) 0%, rgba(204,68,255,0.08) 50%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 3s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}
      {epic && TEMPLARIOS.map((src, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: size * 0.28, height: size * 0.28,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid rgba(255,215,0,0.6)',
          boxShadow: '0 0 12px rgba(255,215,0,0.4)',
          animation: `orbit ${6 + i * 1.5}s linear infinite`,
          animationDelay: `${i * -1.5}s`,
          top: '50%', left: '50%',
          marginTop: -(size * 0.14), marginLeft: -(size * 0.14),
          zIndex: 2,
          transformOrigin: `0 0`,
        }}>
          <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
      <img
        src="https://i.imgur.com/7ofsCSm.png"
        alt="Maestro Templario"
        style={{
          width: size, height: 'auto',
          filter: glow
            ? 'drop-shadow(0 0 30px rgba(255,215,0,0.6)) drop-shadow(0 0 60px rgba(204,68,255,0.2)) drop-shadow(0 4px 12px rgba(0,0,0,0.8))'
            : 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
          animation: anim,
          position: 'relative', zIndex: 1,
        }}
      />
    </div>
  );
}

// ── Header con contadores ──────────────────────────────────────────────────────
function Header({ totalBecas, totalGanadores, rondaNum, eventoNombre }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(4,2,14,0.94)',
      borderBottom: '1px solid rgba(212,175,55,0.1)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px clamp(16px,4vw,32px)',
      gap: 12,
    }}>
      <div style={{
        fontFamily: 'Cinzel, serif', fontWeight: 900,
        fontSize: 'clamp(10px,2.2vw,13px)',
        color: C.gold, letterSpacing: 2,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: '35%',
      }}>
        ⚔ {eventoNombre || 'SORTEO'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px,3vw,32px)' }}>
        {[
          { val: totalBecas,     label: 'BECAS' },
          { val: totalGanadores, label: 'GANADORES' },
          { val: `#${rondaNum}`, label: 'RONDA' },
        ].map(({ val, label }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'Cinzel, serif', fontWeight: 900,
              fontSize: 'clamp(16px,3.5vw,24px)', color: C.gold, lineHeight: 1,
            }}>{val}</div>
            <div style={{
              fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 2,
              color: C.goldDim, marginTop: 2,
            }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Barra de progreso ──────────────────────────────────────────────────────────
function BarraProgreso({ actual, total, color = 'gold' }) {
  const pct = Math.min((actual / Math.max(total, 1)) * 100, 100);
  const bg = color === 'gold'
    ? 'linear-gradient(90deg,#9a7a00,#D4AF37,#ffe98a)'
    : 'linear-gradient(90deg,#6b0a8a,#CC44FF,#e0a0ff)';
  return (
    <div>
      <div style={{
        height: 8, background: 'rgba(255,255,255,0.05)',
        borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 4,
          width: `${pct}%`,
          background: bg,
          transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)',
          boxShadow: color === 'gold' ? `0 0 10px rgba(212,175,55,0.5)` : `0 0 10px rgba(204,68,255,0.5)`,
        }} />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: 6,
        fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1, color: C.muted,
      }}>
        <span>{actual} inscritos</span>
        <span>{total - actual} lugares libres</span>
      </div>
    </div>
  );
}

// ── Slot Machine ───────────────────────────────────────────────────────────────
function SlotMachine({ nombres, duracion = 3500, onTick, onFinal, finalName }) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!nombres.length) return;
    let elapsed = 0, cur = 65, running = true;
    const step = () => {
      if (!running) return;
      setIdx(i => (i + 1) % nombres.length);
      if (onTick) onTick(cur);
      elapsed += cur;
      if      (elapsed < duracion * 0.28) cur = Math.max(30, cur - 3.5);
      else if (elapsed > duracion * 0.60) cur = Math.min(440, cur + 24);
      if (elapsed < duracion) {
        setTimeout(step, cur);
      } else {
        if (finalName) {
          const fi = nombres.findIndex(n => n === finalName);
          if (fi !== -1) setIdx(fi);
        }
        setDone(true);
        if (onFinal) onFinal();
      }
    };
    const t = setTimeout(step, cur);
    return () => { running = false; clearTimeout(t); };
  }, [nombres, duracion]);

  return (
    <div style={{
      height: 104, overflow: 'hidden', position: 'relative',
      background: done
        ? 'linear-gradient(135deg,rgba(255,215,0,0.13),rgba(255,215,0,0.05))'
        : 'rgba(255,215,0,0.04)',
      border: `2px solid ${done ? C.borderHi : 'rgba(255,215,0,0.3)'}`,
      borderRadius: 18,
      boxShadow: done
        ? '0 0 60px rgba(255,215,0,0.4), inset 0 0 30px rgba(255,215,0,0.1)'
        : 'inset 0 0 30px rgba(255,215,0,0.04), 0 0 40px rgba(255,215,0,0.08)',
      transition: 'box-shadow 0.5s, border-color 0.5s',
      animation: done ? 'goldFlash 2s ease-in-out infinite' : 'none',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 30, background: 'linear-gradient(to bottom,rgba(4,2,14,.97),transparent)', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, background: 'linear-gradient(to top,rgba(4,2,14,.97),transparent)', zIndex: 2 }} />
      {/* Franja de selección */}
      <div style={{ position: 'absolute', top: 'calc(50% - 24px)', left: 0, right: 0, height: 48, background: 'rgba(255,215,0,0.04)', zIndex: 1, borderTop: '1px solid rgba(255,215,0,0.22)', borderBottom: '1px solid rgba(255,215,0,0.22)' }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px',
        fontFamily: 'Cinzel, serif', fontWeight: 900,
        fontSize: 'clamp(20px,5.5vw,32px)',
        background: done
          ? 'linear-gradient(135deg,#fff4a0,#FFD700)'
          : `linear-gradient(135deg,${C.gold},${C.goldLight})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        letterSpacing: done ? 5 : 2,
        textAlign: 'center',
        transition: 'letter-spacing 0.4s ease',
        animation: done ? 'drumHit 0.5s ease' : 'none',
      }}>
        {nombres[idx]}
      </div>
    </div>
  );
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti() {
  const colors = [C.gold, '#CC44FF', '#44FF88', '#4488FF', '#FFB844', '#FF4466'];
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 200, overflow: 'hidden' }}>
      {Array.from({ length: 48 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${4 + i % 5}px`, height: `${9 + i % 7}px`,
          background: colors[i % colors.length],
          left: `${(i * 2.1) % 100}%`, top: '-12px',
          borderRadius: i % 3 === 0 ? '50%' : 2,
          animation: `confettiFall ${1.8 + i % 2.5}s ease-in ${i * 0.065}s infinite`,
          opacity: 0.85,
        }} />
      ))}
    </div>
  );
}

// ── Rayos solares ─────────────────────────────────────────────────────────────
function Rays({ size = 180, color = C.gold, opacity = 0.18, speed = '5s' }) {
  return (
    <div style={{
      width: size, height: size, margin: '0 auto',
      backgroundImage: `conic-gradient(from 0deg, transparent 0deg, ${color}${Math.round(opacity * 255).toString(16).padStart(2,'0')} 8deg, transparent 18deg)`,
      borderRadius: '50%',
      animation: `raysRotate ${speed} linear infinite`,
      pointerEvents: 'none',
    }} />
  );
}

// ── Tag de participante ───────────────────────────────────────────────────────
function TagParticipante({ nombre, esYo, index }) {
  return (
    <div style={{
      fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 1,
      color: esYo ? C.gold : C.muted,
      background: esYo ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${esYo ? C.borderHi : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 30, padding: '5px 12px',
      animation: 'tagPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
      animationDelay: `${index * 0.05}s`,
      whiteSpace: 'nowrap',
    }}>
      {esYo ? '⚔️ ' : ''}{nombre}
    </div>
  );
}

// ── Mapa de Cuadras — tablero visual de cupo (gratis, sin pago) ──────────────
function MapaCuadras({ participantes, cupoTotal, miEmail }) {
  const slots = Array.from({ length: cupoTotal }, (_, i) => participantes[i] || null);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7 }}>
      {slots.map((p, i) => {
        const ocupada = !!p;
        const esYo = p?.email === miEmail;
        return (
          <div key={i} style={{
            position: 'relative', borderRadius: 9, padding: '8px 4px',
            textAlign: 'center', minHeight: 48,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: ocupada ? (esYo ? 'rgba(212,175,55,0.18)' : 'rgba(212,175,55,0.08)') : 'rgba(255,255,255,0.02)',
            border: ocupada ? `1.5px solid ${esYo ? C.borderHi : 'rgba(212,175,55,0.35)'}` : '1px dashed rgba(255,255,255,0.12)',
            boxShadow: esYo ? `0 0 16px ${C.goldGlow}` : 'none',
            transition: 'all .35s',
            animation: ocupada ? 'tagPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both' : 'none',
            animationDelay: `${i * 0.03}s`,
          }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 7, letterSpacing: 1, color: ocupada ? C.goldDim : 'rgba(255,255,255,0.2)', marginBottom: 2 }}>
              C{i + 1}
            </div>
            <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 9, color: ocupada ? (esYo ? C.gold : C.text) : 'rgba(255,255,255,0.18)', lineHeight: 1.1, wordBreak: 'break-word' }}>
              {ocupada ? `${esYo ? '⚔️ ' : ''}${p.nombre.split(' ')[0]}` : 'LIBRE'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Historial de rondas ───────────────────────────────────────────────────────
function HistorialRondas({ historial, mostrar, onToggle }) {
  return (
    <div style={{ marginTop: 36 }}>
      <button onClick={onToggle} style={{
        width: '100%', background: 'transparent',
        border: `1px solid rgba(212,175,55,0.12)`,
        color: 'rgba(212,175,55,0.4)', fontFamily: 'Cinzel, serif',
        fontSize: 9, letterSpacing: 3, padding: '11px', borderRadius: 8,
        cursor: 'pointer', marginBottom: mostrar ? 16 : 0,
        transition: 'border-color .2s, color .2s',
      }}>
        {mostrar ? '▲ OCULTAR HISTORIAL' : `▼ RONDAS COMPLETADAS (${historial.length})`}
      </button>
      {mostrar && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
          gap: 10,
        }}>
          {historial.map((ronda, i) => {
            const ganador = ronda.sorteo_participantes?.find(p => p.es_ganador);
            return (
              <div key={ronda.id} style={{
                background: 'rgba(10,5,26,0.9)',
                border: '1px solid rgba(212,175,55,0.08)',
                borderRadius: 12, padding: '12px 14px',
                animation: 'sealPop .45s ease both',
                animationDelay: `${i * 0.04}s`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: 'rgba(212,175,55,0.6)', fontWeight: 700 }}>
                    RONDA #{ronda.numero_ronda}
                  </span>
                  <span style={{
                    fontFamily: 'Cinzel, serif', fontSize: 6, letterSpacing: 1,
                    color: 'rgba(212,175,55,0.3)',
                    border: '1px solid rgba(212,175,55,0.12)',
                    borderRadius: 3, padding: '2px 5px',
                  }}>SELLADA</span>
                </div>
                {ganador && (
                  <p style={{ fontFamily: 'Cinzel, serif', fontSize: 10, fontWeight: 700, color: C.gold, margin: '0 0 4px' }}>
                    👑 {ganador.nombre}
                  </p>
                )}
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 8, color: C.muted, margin: 0 }}>
                  {ronda.sorteo_participantes?.length || 0} guerreros
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Motor de sonido (Web Audio API — sin dependencias externas) ────────────────
function useSoundEngine() {
  const ctxRef = useRef(null);
  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return ctxRef.current;
  }, []);

  const tick = useCallback((pitch = 880) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'square'; osc.frequency.value = pitch;
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(); osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }, [getCtx]);

  const fanfare = useCallback(() => {
    try {
      const ctx = getCtx();
      [[523,0],[659,0.1],[784,0.22],[1047,0.36],[1047,0.5],[784,0.6],[1047,0.72],[1319,0.86]].forEach(([f, t]) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'triangle'; osc.frequency.value = f;
        g.gain.setValueAtTime(0.15, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.24);
        osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.24);
      });
    } catch {}
  }, [getCtx]);

  return { tick, fanfare };
}

// ── Pantalla sorteo épica: 3 fases ────────────────────────────────────────────
function SorteoAnimacion({ nombres, ganadorNombre }) {
  const sound = useSoundEngine();
  const [fase, setFase] = useState(0); // 0=intro · 1=drumroll · 2=elegido

  useEffect(() => {
    const t = setTimeout(() => setFase(1), 1900);
    return () => clearTimeout(t);
  }, []);

  const handleTick = useCallback((spd) => {
    if (spd < 160) sound.tick(600 + Math.random() * 600);
  }, [sound]);

  const handleFinal = useCallback(() => {
    setTimeout(() => { sound.fanfare(); setFase(2); }, 200);
  }, [sound]);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px clamp(16px,4vw,40px)', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
      <Particles />

      {/* ── FASE 0: intro ── */}
      {fase === 0 && (
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 500, animation: 'revealZoom 0.9s cubic-bezier(0.34,1.56,0.64,1) both' }}>
          <div style={{ position: 'relative', width: 230, height: 230, margin: '0 auto 24px' }}>
            <div style={{ position: 'absolute', inset: 0 }}><Rays size={230} speed="3s" opacity={0.28} /></div>
            <div style={{ position: 'absolute', inset: 0 }}><Rays size={230} speed="7.5s" opacity={0.1} /></div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Maestro size={175} animate="none" glow epic />
            </div>
          </div>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 6, color: 'rgba(255,215,0,0.6)', marginBottom: 10 }}>
            ⚔ TEMPLO DEL PROPÓSITO ⚔
          </div>
          <div style={{
            fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
            fontSize: 'clamp(22px,6.5vw,40px)',
            background: 'linear-gradient(180deg,#fff4a0 0%,#FFD700 45%,#b8860b 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            letterSpacing: 3, lineHeight: 1.1,
            animation: 'warpIn 0.7s ease both, textGlow 2.5s ease-in-out 0.7s infinite',
            marginBottom: 14,
          }}>
            EL MOMENTO<br />HA LLEGADO
          </div>
          <div style={{ fontFamily: 'Crimson Text, serif', fontSize: 16, color: C.muted, fontStyle: 'italic', lineHeight: 1.8 }}>
            {nombres.length} guerrero{nombres.length !== 1 ? 's' : ''} compiten por la beca
          </div>
        </div>
      )}

      {/* ── FASE 1: drum roll ── */}
      {fase === 1 && (
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, animation: 'phaseIn 0.5s ease both' }}>
          <div style={{ position: 'relative', width: 190, height: 190, margin: '0 auto 24px' }}>
            <div style={{ position: 'absolute', inset: 0 }}><Rays size={190} speed="2.2s" opacity={0.3} /></div>
            <div style={{ position: 'absolute', inset: 0 }}><Rays size={190} speed="5.5s" opacity={0.1} /></div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Maestro size={140} animate="none" />
            </div>
          </div>
          <div style={{
            fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
            fontSize: 'clamp(18px,5vw,26px)', marginBottom: 22,
            background: `linear-gradient(135deg,${C.gold},${C.purple})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            letterSpacing: 3, animation: 'shimmer 1.8s linear infinite', backgroundSize: '200%',
          }}>
            ⚡ EL DESTINO DECIDE
          </div>
          <SlotMachine nombres={nombres} duracion={4200} onTick={handleTick} onFinal={handleFinal} finalName={ganadorNombre} />
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 4, color: C.goldDim, marginTop: 22, animation: 'pulse 1.1s ease-in-out infinite' }}>
            INVOCANDO AL ELEGIDO...
          </p>
        </div>
      )}

      {/* ── FASE 2: reveal ── */}
      {fase === 2 && (
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, animation: 'revealZoom 0.7s cubic-bezier(0.34,1.56,0.64,1) both' }}>
          <Confetti />
          <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 20px' }}>
            <div style={{ position: 'absolute', inset: 0 }}><Rays size={200} speed="3s" opacity={0.3} /></div>
            <div style={{ position: 'absolute', inset: 0 }}><Rays size={200} speed="8s" opacity={0.12} /></div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Maestro size={152} />
            </div>
          </div>
          <div style={{ fontSize: 'clamp(38px,9vw,56px)', marginBottom: 10 }}>👑</div>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 7, color: 'rgba(255,215,0,0.65)', marginBottom: 10 }}>
            ✦ EL ELEGIDO ✦
          </div>
          <div style={{
            fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
            fontSize: 'clamp(26px,7.5vw,48px)',
            background: 'linear-gradient(180deg,#fff4a0,#FFD700)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            letterSpacing: 3, lineHeight: 1.1,
            animation: 'textGlow 2s ease-in-out infinite, warpIn 0.5s ease both',
            marginBottom: 18,
          }}>
            {ganadorNombre || nombres[nombres.length - 1]}
          </div>
          <div style={{ fontFamily: 'Crimson Text, serif', fontSize: 16, color: 'rgba(255,255,255,0.72)', fontStyle: 'italic', lineHeight: 1.85 }}>
            Recibe 6 meses completos en el Templo<br />
            <span style={{ color: C.gold, fontWeight: 600 }}>Beca completa — valor $534 USD</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function SorteoPage() {
  const { eventoId } = useParams();

  const [screen, setScreenRaw] = useState(SCREEN.LOADING);
  const screenRef    = useRef(SCREEN.LOADING);
  const miEmailRef   = useRef('');
  const miRegistroRef = useRef(null);
  const setScreen = useCallback((s) => { screenRef.current = s; setScreenRaw(s); }, []);
  const [evento,         setEvento]         = useState(null);
  const [rondaActual,    setRondaActual]    = useState(null);
  const [participantes,  setParticipantes]  = useState([]);
  const [historial,      setHistorial]      = useState([]);
  const [totalBecas,     setTotalBecas]     = useState(0);
  const [totalGanadores, setTotalGanadores] = useState(0);
  const [miRegistro,     setMiRegistro]     = useState(null);
  const [form,           setForm]           = useState({ nombre: '', email: '' });
  const [errores,        setErrores]        = useState({});
  const [guardando,      setGuardando]      = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [copiado,        setCopiado]        = useState(false);
  const [fraseIdx,       setFraseIdx]       = useState(0);
  const [fraseVisible,   setFraseVisible]   = useState(true);
  const [causaElegida,   setCausaElegida]   = useState(null);
  const [screenAnterior, setScreenAnterior] = useState(null);

  // refs declarados arriba junto a setScreen

  // ── Inyectar CSS ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // ── Data fetchers ─────────────────────────────────────────────────────────
  const cargarEvento = useCallback(async () => {
    if (!eventoId) { setScreen(SCREEN.CERRADO); return; }
    const { data, error } = await supabase
      .from('sorteo_eventos').select('*')
      .eq('id', eventoId).eq('activo', true).single();
    if (error || !data) { setScreen(SCREEN.CERRADO); return; }
    setEvento(data);
    setScreen(SCREEN.REGISTRO);
  }, [eventoId]);

  const cargarRonda = useCallback(async () => {
    if (!eventoId) return null;
    const { data } = await supabase
  .from('sorteos').select('*')
  .eq('evento_id', eventoId).eq('estado', 'abierto')
  .maybeSingle();  // ← maybeSingle en vez de single
setRondaActual(data || null);
return data || null;
  }, [eventoId]);

  const cargarParticipantes = useCallback(async (sorteoId) => {
    if (!sorteoId) return [];
    const { data } = await supabase
      .from('sorteo_participantes')
      .select('id, nombre, email, es_ganador, cupon_code')
      .eq('sorteo_id', sorteoId)
      .order('registered_at', { ascending: true });
    setParticipantes(data || []);
    return data || [];
  }, []);

  const cargarHistorial = useCallback(async () => {
    if (!eventoId) return;
    const { data } = await supabase
      .from('sorteos')
      .select(`id, numero_ronda, cupo, sorteo_participantes(id, nombre, es_ganador)`)
      .eq('evento_id', eventoId).eq('estado', 'completado')
      .order('numero_ronda', { ascending: false }).limit(30);
    setHistorial(data || []);
    let becas = 0, total = 0;
    (data || []).forEach(r => {
      total += r.sorteo_participantes?.length || 0;
      becas  += r.sorteo_participantes?.filter(p => p.es_ganador).length || 0;
    });
    setTotalBecas(becas);
    setTotalGanadores(total);
  }, [eventoId]);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    cargarEvento();
    cargarHistorial();
  }, [cargarEvento, cargarHistorial]);

  useEffect(() => {
    if (screen === SCREEN.REGISTRO || screen === SCREEN.ESPERA) {
      cargarRonda().then(r => { if (r) cargarParticipantes(r.id); });
    }
  }, [screen, cargarRonda, cargarParticipantes]);

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!eventoId || screen === SCREEN.LOADING || screen === SCREEN.CERRADO) return;
    const canal = supabase
      .channel(`evento-sorteo-${eventoId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sorteos', filter: `evento_id=eq.${eventoId}` }, () => {
        cargarRonda().then(r => { if (r) cargarParticipantes(r.id); });
        cargarHistorial();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sorteos', filter: `evento_id=eq.${eventoId}` }, async (payload) => {
        if (payload.new?.estado === 'completado') {
          cargarHistorial();
          const partes = await cargarParticipantes(payload.new.id);
          const cur = screenRef.current;

          if (cur === SCREEN.ESPERA && miRegistroRef.current?.sorteoId === payload.new?.id) {
            // Llamar Edge Function para crear Promotion Codes en Stripe
            supabase.functions.invoke('sorteo-cupones', { body: { sorteo_id: payload.new.id } })
              .catch(e => console.warn('[sorteo] cupones edge fn:', e));
            const yo = partes.find(p => p.email === miEmailRef.current);
            if (yo) {
              setMiRegistro(prev => ({ ...prev, cuponCode: yo.cupon_code, esGanador: yo.es_ganador, tipoPremio: yo.tipo_premio }));
              miRegistroRef.current = { ...miRegistroRef.current, cuponCode: yo.cupon_code, esGanador: yo.es_ganador, tipoPremio: yo.tipo_premio };
              setScreen(SCREEN.SORTEO);
              setTimeout(() => { setScreen(yo.es_ganador ? SCREEN.GANADOR : SCREEN.PREMIO); cargarHistorial(); }, 7500);
            }
          } else if (cur === SCREEN.REGISTRO || cur === SCREEN.LOADING) {
            // Espectador — ve la animación completa y vuelve al registro
            setScreen(SCREEN.SORTEO);
            setTimeout(() => {
              setScreen(SCREEN.REGISTRO);
              cargarRonda().then(r => { if (r) cargarParticipantes(r.id); });
            }, 7500);
          } else if (cur === SCREEN.ESPERA) {
            // Estaba en espera pero era de una ronda diferente (edge case)
            cargarRonda().then(r => { if (r) cargarParticipantes(r.id); });
          }
          // GANADOR/PREMIO/SORTEO: no interrumpir su pantalla
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sorteo_participantes' }, () => {
        if (miRegistroRef.current?.sorteoId) {
          cargarParticipantes(miRegistroRef.current.sorteoId);
        } else {
          cargarRonda().then(r => { if (r) cargarParticipantes(r.id); });
        }
      })
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [eventoId, cargarRonda, cargarParticipantes, cargarHistorial]);

  // ── Copiar ────────────────────────────────────────────────────────────────
  const copiarCodigo = () => {
    if (!miRegistro?.cuponCode) return;
    navigator.clipboard?.writeText(miRegistro.cuponCode).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2200);
  };

  // ── Registrarse ───────────────────────────────────────────────────────────
  const registrarse = async () => {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = true;
    if (!form.email.trim() || !form.email.includes('@')) errs.email = true;
    if (Object.keys(errs).length) { setErrores(errs); return; }
    setErrores({});
    setGuardando(true);
    miEmailRef.current = form.email.trim().toLowerCase();

    const { data, error } = await supabase.rpc('registrar_y_sortear', {
      p_evento_id: eventoId,
      p_nombre:    form.nombre.trim(),
      p_email:     form.email.trim().toLowerCase(),
    });

    setGuardando(false);

    if (error) { setErrores({ general: 'Error al conectar. Intenta de nuevo.' }); return; }
    if (data?.error === 'ya_registrado') {
      // Ya está registrado — cargar su estado real y llevarlo a donde le corresponde
      miEmailRef.current = form.email.trim().toLowerCase();
      const ronda = await cargarRonda();
      const sorteoId = ronda?.id;
      if (sorteoId) {
        const partes = await cargarParticipantes(sorteoId);
        const yo = partes.find(p => p.email === miEmailRef.current);
        if (yo) {
          const reg = {
            nombre: yo.nombre,
            email: yo.email,
            cuponCode: yo.cupon_code,
            esGanador: yo.es_ganador,
            sorteoId,
          };
          miRegistroRef.current = reg;
          setMiRegistro(reg);
          // Si el sorteo ya terminó (tiene ganador), ver animación y luego resultado
          const yaTermino = partes.some(p => p.es_ganador);
          if (yaTermino) {
            setScreen(SCREEN.SORTEO);
            setTimeout(() => {
              setScreen(yo.es_ganador ? SCREEN.GANADOR : SCREEN.PREMIO);
              cargarHistorial();
            }, 7500);
          } else {
            // Aún en espera — regresar a sala de espera
            setScreen(SCREEN.ESPERA);
          }
          return;
        }
      }
      // Fallback: ronda ya completada, buscar en historial
      const { data: histData } = await supabase
        .from('sorteos')
        .select(`id, sorteo_participantes(nombre, email, es_ganador, cupon_code)`)
        .eq('evento_id', eventoId)
        .eq('estado', 'completado')
        .order('numero_ronda', { ascending: false })
        .limit(5);
      if (histData) {
        for (const rondaHist of histData) {
          const yo = rondaHist.sorteo_participantes?.find(p => p.email === miEmailRef.current);
          if (yo) {
            const reg = { nombre: yo.nombre, email: yo.email, cuponCode: yo.cupon_code, esGanador: yo.es_ganador, sorteoId: null };
            miRegistroRef.current = reg;
            setMiRegistro(reg);
            setScreen(SCREEN.SORTEO);
            setTimeout(() => { setScreen(yo.es_ganador ? SCREEN.GANADOR : SCREEN.PREMIO); cargarHistorial(); }, 7500);
            return;
          }
        }
      }
      setErrores({ general: 'Ya estás registrado en esta ronda.' });
      return;
    }

    if (data?.status === 'registrado') {
      const ronda = await cargarRonda();
      const sorteoId = ronda?.id;
      const reg = {
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        posicion: data.posicion,
        sorteoId,
      };
      miRegistroRef.current = reg;
      setMiRegistro(reg);
      if (sorteoId) await cargarParticipantes(sorteoId);
      setScreen(SCREEN.ESPERA);
      return;
    }

    if (data?.status === 'sorteado') {
      const ronda = await cargarRonda();
      setMiRegistro({ nombre: form.nombre.trim(), email: form.email.trim().toLowerCase(), cuponCode: data.codigo, esGanador: data.es_ganador, tipoPremio: data.tipo_premio, sorteoId: ronda?.id });
      if (ronda) await cargarParticipantes(ronda.id);
      setScreen(SCREEN.SORTEO);
      // Llamar Edge Function para crear Promotion Codes en Stripe (fire & forget)
      supabase.functions.invoke('sorteo-cupones', { body: { sorteo_id: data.sorteo_id } })
        .catch(e => console.warn('[sorteo] cupones edge fn:', e));
      setTimeout(() => { setScreen(data.es_ganador ? SCREEN.GANADOR : SCREEN.PREMIO); cargarHistorial(); cargarRonda().then(r => r && cargarParticipantes(r.id)); }, 7500);
    }
  };

  const cupoActual = participantes.length;
  const cupoTotal  = rondaActual?.cupo || evento?.cupo_por_ronda || 10;
  const faltantes  = Math.max(0, cupoTotal - cupoActual);
  const lleno      = faltantes === 0;
  const rondaNum   = rondaActual?.numero_ronda || (historial[0]?.numero_ronda || 0) + 1;
  // ── Frases psicológicas rotantes ─────────────────────────────────────────
  const FRASES_ESPERA = [
    { texto: "¿Qué cambiarías primero si ganaras hoy?",          sub: "El ganador ya lo sabe." },
    { texto: "El destino no sortea al azar.",                    sub: "Sortea al que ya decidió." },
    { texto: "Solo uno será elegido esta ronda.",                sub: "Ese uno ya está en esta sala." },
    { texto: "¿Qué versión de ti entraría al Templo hoy?",      sub: "Esa es la que merece ganar." },
    { texto: "Cada segundo que esperas, otro desistió.",         sub: "Tú sigues aquí. Eso ya te distingue." },
    { texto: "La beca no transforma. Tú ya decidiste hacerlo.", sub: "El Templo solo acelera lo inevitable." },
    { texto: "¿Cuánto tiempo llevas postergando tu cambio?",    sub: "Hoy ese tiempo se acaba." },
    { texto: "El Templo no busca al más suertudo.",             sub: "Busca al que llegó primero." },
    { texto: "El que gana no es diferente a ti.",               sub: "Solo estaba listo antes." },
    { texto: "¿Qué diría tu yo de dentro de un año?",          sub: "Mira bien esta pantalla." },
    { texto: "El silencio antes del sorteo siempre dice algo.", sub: "Escúchalo." },
    { texto: "Hay guerreros que esperan.",                      sub: "Y hay guerreros que ya saben que van a ganar." },
  ];

  useEffect(() => {
    if (screen !== SCREEN.ESPERA) return undefined;
    const ciclo = setInterval(() => {
      setFraseVisible(false);
      setTimeout(() => {
        setFraseIdx(i => (i + 1) % FRASES_ESPERA.length);
        setFraseVisible(true);
      }, 600);
    }, 16000);
    return () => clearInterval(ciclo);
  }, [screen]);

  // ── PANTALLA: LOADING ─────────────────────────────────────────────────────
  if (screen === SCREEN.LOADING) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        <Particles />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Maestro size={120} animate="slow" />
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: 5, color: C.goldDim, marginTop: 24, animation: 'pulse 1.6s ease-in-out infinite' }}>
            CONVOCANDO AL TEMPLO...
          </p>
        </div>
      </div>
    );
  }

  // ── PANTALLA: CERRADO ─────────────────────────────────────────────────────
  if (screen === SCREEN.CERRADO) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px,6vw,60px) clamp(16px,4vw,40px)' }}>
        <Particles />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 420 }}>
          <Maestro size={100} glow={false} animate="none" />
          <h2 style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 900, fontSize: 'clamp(16px,4vw,22px)', color: C.gold, marginTop: 24, marginBottom: 12, letterSpacing: 2 }}>
            SORTEO NO DISPONIBLE
          </h2>
          <p style={{ fontFamily: 'Crimson Text, serif', fontSize: 15, color: C.muted, fontStyle: 'italic', lineHeight: 1.7 }}>
            Este sorteo no está activo o el enlace no es válido.
          </p>
        </div>
      </div>
    );
  }

  // ── PANTALLA: SORTEO (animación épica) ───────────────────────────────────
  if (screen === SCREEN.SORTEO) {
    const nombres = participantes.length > 0 ? participantes.map(p => p.nombre) : ['Guerrero', 'Templario', 'Campeón'];
    const ganador = participantes.find(p => p.es_ganador);
    return <SorteoAnimacion nombres={nombres} ganadorNombre={ganador?.nombre} />;
  }

  // ── PANTALLA: GANADOR ─────────────────────────────────────────────────────
  if (screen === SCREEN.GANADOR) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(20px,5vw,60px) clamp(16px,4vw,40px)', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <Particles />
        <Confetti />
        <Header totalBecas={totalBecas} totalGanadores={totalGanadores} rondaNum={rondaNum} eventoNombre={evento?.nombre} />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, marginTop: 72, animation: 'fadeUp .7s ease both' }}>

          {/* Maestro con rayos épicos */}
          <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 24px' }}>
            <div style={{ position: 'absolute', inset: 0 }}><Rays size={200} opacity={0.25} speed="5s" /></div>
            <div style={{ position: 'absolute', inset: 0 }}><Rays size={200} opacity={0.12} speed="9s" /></div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Maestro size={150} />
            </div>
          </div>

          <div style={{ fontSize: 'clamp(36px,9vw,52px)', marginBottom: 8 }}>👑</div>
          <h1 style={{
            fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
            fontSize: 'clamp(22px,6vw,34px)', marginBottom: 10, letterSpacing: 2,
            background: `linear-gradient(135deg,${C.gold},${C.goldLight},${C.gold})`,
            backgroundSize: '200%',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            animation: 'shimmer 2s linear infinite',
          }}>¡ERES EL ELEGIDO!</h1>

          <p style={{ fontFamily: 'Crimson Text, serif', fontSize: 16, color: C.muted, fontStyle: 'italic', lineHeight: 1.8, marginBottom: 28 }}>
            El Templo del Propósito te concede<br />
            <span style={{ color: C.gold, fontWeight: 700, fontSize: 19 }}>6 meses de membresía — valor $294 USD</span>
          </p>

          {/* Código de acceso */}
          <div style={{
            background: 'rgba(212,175,55,0.07)', border: `1.5px solid ${C.borderHi}`,
            borderRadius: 16, padding: 'clamp(18px,4vw,28px) clamp(16px,4vw,28px)',
            marginBottom: 24, animation: 'pulseGlow 3s ease-in-out infinite',
          }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 3, color: C.goldDim, marginBottom: 12 }}>
              TU CÓDIGO DE ACCESO — 6 MESES GRATIS
            </p>
            <div style={{
              fontFamily: 'Cinzel, serif', fontWeight: 900,
              fontSize: 'clamp(22px,6vw,32px)', color: C.gold,
              letterSpacing: 8, marginBottom: 16,
              animation: 'pulse 2.2s ease-in-out infinite',
            }}>
              {miRegistro?.cuponCode || '———'}
            </div>
            <button onClick={copiarCodigo} style={{
              padding: '11px 28px', borderRadius: 10, cursor: 'pointer',
              background: copiado ? 'rgba(68,255,136,0.12)' : 'rgba(212,175,55,0.12)',
              border: `1px solid ${copiado ? 'rgba(68,255,136,0.4)' : C.borderHi}`,
              color: copiado ? C.green : C.gold,
              fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 2,
              transition: 'all .25s',
            }}>
              {copiado ? '✓ COPIADO' : '📋 COPIAR CÓDIGO'}
            </button>
          </div>

          {/* Carta del Maestro — ritual de cierre */}
          <div style={{
            position: 'relative',
            background: 'linear-gradient(160deg,rgba(255,215,0,0.07),rgba(10,5,26,0.7),rgba(255,215,0,0.05))',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 20, padding: 'clamp(22px,5vw,32px) clamp(20px,5vw,30px)',
            marginBottom: 26, textAlign: 'center', overflow: 'hidden',
            animation: 'fadeUp 1.1s ease both',
          }}>
            {/* Líneas de luz */}
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,215,0,0.6),transparent)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(204,68,255,0.3),transparent)' }} />

            {/* Eyebrow */}
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 5, color: 'rgba(255,215,0,0.5)', marginBottom: 16 }}>
              ✦ MENSAJE DEL MAESTRO ✦
            </div>

            {/* Carta */}
            <div style={{
              fontFamily: 'Crimson Text, serif', fontStyle: 'italic',
              fontSize: 'clamp(14px,3.8vw,17px)',
              color: 'rgba(255,255,255,0.82)',
              lineHeight: 1.85, letterSpacing: 0.3,
              marginBottom: 18,
            }}>
              El Templo no sortea al azar.<br />
              <span style={{ color: C.gold }}>Sortea al que ya estaba listo.</span>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 18px', justifyContent: 'center' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,215,0,0.15)' }} />
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: 'rgba(255,215,0,0.35)', letterSpacing: 3 }}>👑</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,215,0,0.15)' }} />
            </div>

            <div style={{
              fontFamily: 'Cinzel, serif', fontWeight: 900,
              fontSize: 'clamp(13px,3.5vw,16px)',
              color: C.gold, letterSpacing: 2, lineHeight: 1.5,
              marginBottom: 6,
            }}>
              Bienvenido, Templario.
            </div>
            <div style={{
              fontFamily: 'Crimson Text, serif', fontSize: 'clamp(12px,3.2vw,14px)',
              color: 'rgba(255,255,255,0.45)', letterSpacing: 1, fontStyle: 'italic',
            }}>
              Tu transformación comienza ahora.
            </div>
          </div>

          <a
            href={`https://buy.stripe.com/9B68wP59t2pA1lQeKQenS0x?prefilled_promo_code=${encodeURIComponent(miRegistro?.cuponCode || '')}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'block', padding: '16px',
              borderRadius: 14,
              background: `linear-gradient(135deg,${C.gold},#9a7a00)`,
              color: '#0a0614', fontFamily: 'Cinzel, serif',
              fontSize: 12, letterSpacing: 3, fontWeight: 900,
              textDecoration: 'none',
              animation: 'btnPulse 2.5s ease-in-out infinite',
            }}
          >
            ⚔️ ACTIVAR MI BECA — 6 MESES GRATIS
          </a>

          {/* ── ALIANZA PRIMER · versión ganador ── */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(160deg,rgba(255,215,0,0.06),rgba(10,5,26,0.75),rgba(167,139,250,0.06))',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 18,
            padding: 'clamp(18px,4vw,26px)',
            marginTop: 18, marginBottom: 20,
            textAlign: 'center',
            animation: 'fadeUp 1.4s ease both',
          }}>
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,215,0,0.5),transparent)' }} />
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 4, color: 'rgba(255,215,0,0.55)', marginBottom: 12 }}>
              ✦ TU REINADO NO TERMINA AQUÍ ✦
            </div>
            <div style={{
              fontFamily: 'Crimson Text, serif', fontStyle: 'italic',
              fontSize: 'clamp(13px,3.8vw,16px)',
              color: 'rgba(255,255,255,0.82)',
              lineHeight: 1.85, marginBottom: 16,
            }}>
              Junto con tu beca, recibes tu{' '}
              <span style={{ color: '#a78bfa', fontStyle: 'normal', fontWeight: 700 }}>código Alianza</span>.<br />
              Quien lo use también entra por{' '}
              <span style={{ color: '#a78bfa', fontWeight: 700 }}>$1</span>.<br />
              <span style={{ color: C.gold, fontSize: '0.92em' }}>
                Cada nivel que desbloquees suma +1 mes más, por $1.
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              {[['⚡','Chispa'],['🔗','Nexo'],['🌊','Resonancia'],['🌐','Expansión'],['✦','Legado']].map(([emoji, label], i) => (
                <div key={i} title={label} style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'rgba(255,215,0,0.05)',
                  border: '1px solid rgba(212,175,55,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13,
                }}>
                  {emoji}
                </div>
              ))}
            </div>
          </div>

          {historial.length > 0 && <HistorialRondas historial={historial} onToggle={() => setMostrarHistorial(v => !v)} mostrar={mostrarHistorial} />}
        </div>
      </div>
    );
  }

  // ── PANTALLA: PREMIO ──────────────────────────────────────────────────────
  if (screen === SCREEN.PREMIO) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(20px,5vw,60px) clamp(16px,4vw,40px)', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <Particles />
        <Header totalBecas={totalBecas} totalGanadores={totalGanadores} rondaNum={rondaNum} eventoNombre={evento?.nombre} />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, marginTop: 72, animation: 'fadeUp .7s ease both' }}>

          <div style={{ margin: '0 auto 24px' }}>
            <Maestro size={120} animate="slow" />
          </div>

          {/* Sello de presentación */}
          <div style={{ fontSize: 38, marginBottom: 10 }}>⚜️</div>

          {/* Reencuadre narrativo épico */}
          <div style={{
            position: 'relative',
            background: 'linear-gradient(160deg,rgba(155,89,255,0.09),rgba(10,5,26,0.6),rgba(155,89,255,0.06))',
            border: '1px solid rgba(155,89,255,0.28)',
            borderRadius: 20, padding: 'clamp(22px,5vw,32px) clamp(20px,5vw,30px)',
            marginBottom: 26, textAlign: 'center', overflow: 'hidden',
            animation: 'fadeUp 0.8s ease both',
          }}>
            {/* Línea superior púrpura */}
            <div style={{ position: 'absolute', top: 0, left: '12%', right: '12%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(155,89,255,0.55),transparent)' }} />
            {/* Línea inferior dorada tenue */}
            <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,215,0,0.25),transparent)' }} />

            {/* Eyebrow */}
            <div style={{
              fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 5,
              color: 'rgba(155,89,255,0.65)', marginBottom: 14,
            }}>
              ✦ EL TEMPLO HABLA ✦
            </div>

            {/* Frase principal */}
            <div style={{
              fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
              fontSize: 'clamp(15px,4.2vw,20px)',
              background: 'linear-gradient(135deg,#e0c8ff,#CC44FF,#b090ff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              lineHeight: 1.4, letterSpacing: 1, marginBottom: 14,
            }}>
              No fuiste elegido por el azar.
            </div>

            {/* Frase secundaria — el reencuadre real */}
            <div style={{
              fontFamily: 'Crimson Text, serif', fontStyle: 'italic',
              fontSize: 'clamp(14px,3.8vw,17px)',
              color: 'rgba(255,255,255,0.78)',
              lineHeight: 1.75, letterSpacing: 0.3, marginBottom: 16,
            }}>
              Fuiste elegido por tu decisión de estar aquí.<br />
              <span style={{ color: 'rgba(204,68,255,0.85)' }}>Eso ya te separa del 95% que nunca llegó.</span>
            </div>

            {/* Divider decorativo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', justifyContent: 'center' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(155,89,255,0.2)' }} />
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: 'rgba(155,89,255,0.45)', letterSpacing: 3 }}>⚔</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(155,89,255,0.2)' }} />
            </div>

            {/* Recompensa del guerrero — frase cierre */}
            <div style={{
              fontFamily: 'Cinzel, serif', fontSize: 'clamp(9px,2.5vw,11px)',
              letterSpacing: 2, color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.6,
            }}>
              ESTE CUPÓN ES LA RECOMPENSA DEL GUERRERO<br />
              QUE SE PRESENTÓ SIN IMPORTAR EL RESULTADO
            </div>
          </div>

          <h1 style={{
            fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
            fontSize: 'clamp(17px,4.5vw,24px)', marginBottom: 10,
            background: `linear-gradient(135deg,${C.purple},#e0a0ff)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            letterSpacing: 2,
          }}>TU PASE DE GUERRERO</h1>

          <p style={{ fontFamily: 'Crimson Text, serif', fontSize: 15, color: C.muted, fontStyle: 'italic', lineHeight: 1.75, marginBottom: 24 }}>
            Tu regalo de entrada al Templo:<br />
            <span style={{ color: C.purple, fontWeight: 600 }}>primer mes por solo $1 USD.</span>
          </p>

          {/* Cupón */}
          <div style={{
            background: 'rgba(204,68,255,0.06)', border: `1.5px solid ${C.purpleDim}`,
            borderRadius: 16, padding: 'clamp(18px,4vw,26px)', marginBottom: 24,
            boxShadow: '0 0 40px rgba(204,68,255,0.08)',
          }}>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 3, color: 'rgba(204,68,255,0.6)', marginBottom: 12 }}>
              TU CUPÓN ESPECIAL
            </p>
            <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 'clamp(20px,5.5vw,28px)', color: C.purple, letterSpacing: 7, marginBottom: 16 }}>
              {miRegistro?.cuponCode || '—'}
            </div>
            <button onClick={copiarCodigo} style={{
              padding: '11px 28px', borderRadius: 10, cursor: 'pointer',
              background: copiado ? 'rgba(68,255,136,0.12)' : 'rgba(204,68,255,0.1)',
              border: `1px solid ${copiado ? 'rgba(68,255,136,0.4)' : C.purpleDim}`,
              color: copiado ? C.green : C.purple,
              fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 2,
              transition: 'all .25s',
            }}>
              {copiado ? '✓ COPIADO' : '📋 COPIAR CUPÓN'}
            </button>
          </div>

          <button
            onClick={() => { setScreenAnterior(SCREEN.PREMIO); setScreen(SCREEN.CAUSA); }}
            style={{
              display: 'block', width: '100%', padding: '17px',
              borderRadius: 14, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg,${C.purple},#6b0a8a)`,
              color: '#fff', fontFamily: 'Cinzel, serif',
              fontSize: 12, letterSpacing: 3, fontWeight: 900,
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(204,68,255,0.35)',
              marginBottom: 10,
              animation: 'btnPulse 2.8s ease-in-out infinite',
            }}
          >
            ⚔️ ENTRAR AL TEMPLO — PRIMER MES $1
          </button>
          <p style={{
            fontFamily: 'Crimson Text, serif', fontStyle: 'italic',
            fontSize: 12, color: 'rgba(255,255,255,0.28)',
            textAlign: 'center', marginBottom: 14, letterSpacing: 0.5,
          }}>
            El cupón ya está pre-aplicado. Solo confirma tu acceso.
          </p>

          {/* ── ALIANZA PRIMER ── */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(160deg,rgba(167,139,250,0.08),rgba(10,5,26,0.75),rgba(167,139,250,0.05))',
            border: '1px solid rgba(167,139,250,0.28)',
            borderRadius: 18,
            padding: 'clamp(18px,4vw,26px)',
            marginTop: 6, marginBottom: 20,
            textAlign: 'center',
            animation: 'fadeUp 1.4s ease both',
          }}>
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.55),transparent)' }} />
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 4, color: 'rgba(167,139,250,0.55)', marginBottom: 12 }}>
              ✦ AL CRUZAR LA PUERTA ✦
            </div>
            <div style={{
              fontFamily: 'Crimson Text, serif', fontStyle: 'italic',
              fontSize: 'clamp(13px,3.8vw,16px)',
              color: 'rgba(200,185,240,0.82)',
              lineHeight: 1.85, marginBottom: 16,
            }}>
              El Templo te entrega tu{' '}
              <span style={{ color: '#a78bfa', fontStyle: 'normal', fontWeight: 700 }}>código Alianza</span>.<br />
              Quien lo use también entra por{' '}
              <span style={{ color: '#a78bfa', fontWeight: 700 }}>$1</span>.<br />
              <span style={{ color: 'rgba(212,175,55,0.75)', fontSize: '0.92em' }}>
                Por cada nivel alcanzado: +1 mes tuyo por $1.
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              {[['⚡','Chispa'],['🔗','Nexo'],['🌊','Resonancia'],['🌐','Expansión'],['✦','Legado']].map(([emoji, label], i) => (
                <div key={i} title={label} style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'rgba(167,139,250,0.06)',
                  border: '1px solid rgba(167,139,250,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13,
                }}>
                  {emoji}
                </div>
              ))}
            </div>
          </div>

          {historial.length > 0 && <HistorialRondas historial={historial} onToggle={() => setMostrarHistorial(v => !v)} mostrar={mostrarHistorial} />}
        </div>
      </div>
    );
  }



  // ── PANTALLA: CAUSA ───────────────────────────────────────────────────────
  if (screen === SCREEN.CAUSA) {
    const STRIPE_LINKS = {
      becas:  `https://buy.stripe.com/9B68wP59t2pA1lQeKQenS0x?prefilled_promo_code=${encodeURIComponent(miRegistro?.cuponCode || '')}`,
      perros: `https://buy.stripe.com/7sY9ATfO77JUe8CgSYenS0w?prefilled_promo_code=${encodeURIComponent(miRegistro?.cuponCode || '')}`,
    };

    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(20px,5vw,60px) clamp(16px,4vw,40px)', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <Particles />
        <Header totalBecas={totalBecas} totalGanadores={totalGanadores} rondaNum={rondaNum} eventoNombre={evento?.nombre} />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520, marginTop: 72, animation: 'fadeUp .7s ease both' }}>

          <div style={{ fontSize: 36, marginBottom: 10 }}>⚜️</div>

          <h1 style={{
            fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
            fontSize: 'clamp(18px,5vw,26px)', marginBottom: 10, letterSpacing: 2,
            background: `linear-gradient(135deg,${C.purple},#fff)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>¿A QUÉ CAUSA QUIERES DESTINAR TU DÓLAR?</h1>

          <p style={{ fontFamily: 'Crimson Text, serif', fontSize: 14, color: C.muted, fontStyle: 'italic', lineHeight: 1.7, marginBottom: 28 }}>
            Tu decisión genera impacto real dentro y fuera del Templo.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>

            {/* Opción: Becas */}
            <button
              onClick={() => setCausaElegida('becas')}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                padding: '16px 18px', borderRadius: 16, cursor: 'pointer',
                background: causaElegida === 'becas' ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                border: causaElegida === 'becas' ? `1.5px solid ${C.gold}` : '1.5px solid rgba(255,255,255,0.08)',
                transition: 'all .25s',
              }}
            >
              <div style={{ fontSize: 28 }}>🎓</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 13, letterSpacing: 1, color: C.gold, marginBottom: 4 }}>
                  BECAS TEMPLO DEL PROPÓSITO
                </div>
                <div style={{ fontFamily: 'Crimson Text, serif', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  Tu dólar se convierte en acceso gratuito al Templo para alguien comprometido con crecer.
                </div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: causaElegida === 'becas' ? `6px solid ${C.gold}` : '1.5px solid rgba(255,255,255,0.25)',
                transition: 'all .2s',
              }} />
            </button>

            {/* Opción: Perros */}
            <button
              onClick={() => setCausaElegida('perros')}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                padding: '16px 18px', borderRadius: 16, cursor: 'pointer',
                background: causaElegida === 'perros' ? 'rgba(204,68,255,0.12)' : 'rgba(255,255,255,0.03)',
                border: causaElegida === 'perros' ? `1.5px solid ${C.purple}` : '1.5px solid rgba(255,255,255,0.08)',
                transition: 'all .25s',
              }}
            >
              <div style={{ fontSize: 28 }}>🐾</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 13, letterSpacing: 1, color: C.purple, marginBottom: 4 }}>
                  ALIMENTO PARA PERROS
                </div>
                <div style={{ fontFamily: 'Crimson Text, serif', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  Cada dólar ayuda directamente a brindar alimento a perros en situación vulnerable.
                </div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: causaElegida === 'perros' ? `6px solid ${C.purple}` : '1.5px solid rgba(255,255,255,0.25)',
                transition: 'all .2s',
              }} />
            </button>

          </div>

          <a
            href={causaElegida ? STRIPE_LINKS[causaElegida] : undefined}
            target="_blank" rel="noopener noreferrer"
            onClick={(e) => { if (!causaElegida) e.preventDefault(); }}
            style={{
              display: 'block', padding: '16px',
              borderRadius: 14,
              background: causaElegida
                ? `linear-gradient(135deg,${C.purple},#6b0a8a)`
                : 'rgba(255,255,255,0.06)',
              color: causaElegida ? '#fff' : 'rgba(255,255,255,0.3)',
              fontFamily: 'Cinzel, serif',
              fontSize: 12, letterSpacing: 3, fontWeight: 900,
              textDecoration: 'none', textAlign: 'center',
              cursor: causaElegida ? 'pointer' : 'not-allowed',
              transition: 'all .25s',
              animation: causaElegida ? 'btnPulse 2.5s ease-in-out infinite' : 'none',
            }}
          >
            {causaElegida ? '⚔️ CONTINUAR CON MI DONACIÓN →' : 'SELECCIONA UNA CAUSA PARA CONTINUAR'}
          </a>

          <button
            onClick={() => setScreen(SCREEN.PREMIO)}
            style={{
              display: 'block', margin: '18px auto 0', padding: '8px 16px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'Crimson Text, serif', fontStyle: 'italic', fontSize: 12,
              color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5,
            }}
          >
            ← Volver
          </button>

        </div>
      </div>
    );
  }

  // ── PANTALLA: ESPERA ──────────────────────────────────────────────────────
  if (screen === SCREEN.ESPERA) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(20px,5vw,60px) clamp(16px,4vw,40px)', position: 'relative', overflow: 'hidden' }}>
        <Particles />
        <Header totalBecas={totalBecas} totalGanadores={totalGanadores} rondaNum={rondaNum} eventoNombre={evento?.nombre} />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 500, marginTop: 72, animation: 'fadeUp .6s ease both' }}>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Maestro size={110} animate="slow" />
          </div>

          <h2 style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 900, fontSize: 'clamp(18px,4.5vw,24px)', textAlign: 'center', marginBottom: 8, color: lleno ? C.gold : C.text, letterSpacing: 2, transition: 'color .4s' }}>
            {lleno ? '⚔️ ¡CUPO COMPLETO!' : 'SALA DE ESPERA'}
          </h2>

          <p style={{ textAlign: 'center', fontFamily: 'Crimson Text, serif', fontSize: 15, color: C.muted, fontStyle: 'italic', lineHeight: 1.7, marginBottom: 24 }}>
            {miRegistro?.nombre && <><span style={{ color: C.gold }}>{miRegistro.nombre}</span>, ya estás dentro.<br /></>}
            {lleno ? 'El sorteo comienza en unos momentos...' : `Esperando ${faltantes} guerrero${faltantes !== 1 ? 's' : ''} más`}
          </p>

          {/* Contador grande */}
          <div style={{
            background: C.bgCard, border: `1.5px solid ${lleno ? C.borderHi : C.border}`,
            borderRadius: 20, padding: 'clamp(24px,5vw,36px)', textAlign: 'center',
            marginBottom: 20,
            boxShadow: lleno ? `0 0 70px ${C.goldGlow}` : 'none',
            transition: 'all .5s',
          }}>
            <div style={{
              fontFamily: 'Cinzel, serif', fontWeight: 900,
              fontSize: 'clamp(56px,14vw,90px)',
              background: `linear-gradient(135deg,${C.gold},${C.purple})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              lineHeight: 1,
              animation: lleno ? 'pulse 1s ease-in-out infinite' : 'none',
            }}>
              {cupoActual}
            </div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 3, color: C.goldDim, marginTop: 4, marginBottom: 20 }}>
              DE {cupoTotal} GUERREROS
            </div>
            <BarraProgreso actual={cupoActual} total={cupoTotal} />
            <div style={{ marginTop: 20 }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 3, color: C.goldDim, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase' }}>
                ✦ Mapa de Cuadras ✦
              </div>
              <MapaCuadras participantes={participantes} cupoTotal={cupoTotal} miEmail={miEmailRef.current} />
            </div>
          </div>

          {!lleno && (
            <>
              {/* Oráculo — frase psicológica rotante */}
              <div style={{
                position: 'relative',
                margin: '8px 0 16px',
                padding: 'clamp(18px,4vw,28px) clamp(20px,5vw,36px)',
                background: 'linear-gradient(135deg,rgba(155,89,255,0.08),rgba(255,215,0,0.05),rgba(155,89,255,0.06))',
                border: '1px solid rgba(155,89,255,0.25)',
                borderRadius: 20,
                textAlign: 'center',
                overflow: 'hidden',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
                opacity: fraseVisible ? 1 : 0,
                transform: fraseVisible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.98)',
              }}>
                {/* Línea superior dorada */}
                <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(255,215,0,0.5),transparent)' }} />
                {/* Línea inferior púrpura */}
                <div style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(155,89,255,0.4),transparent)' }} />

                <div style={{
                  fontFamily: 'Cinzel, serif', fontSize: 8, letterSpacing: 5,
                  color: 'rgba(155,89,255,0.7)', marginBottom: 12,
                }}>
                  ✦ ORÁCULO DEL TEMPLO ✦
                </div>

                <div style={{
                  fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
                  fontSize: 'clamp(15px,4vw,20px)',
                  background: 'linear-gradient(135deg,#fff4a0,#FFD700)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  lineHeight: 1.35, letterSpacing: 1,
                  marginBottom: 12,
                  textShadow: 'none',
                }}>
                  {FRASES_ESPERA[fraseIdx].texto}
                </div>

                <div style={{
                  fontFamily: 'Crimson Text, serif', fontStyle: 'italic',
                  fontSize: 'clamp(13px,3.5vw,15px)',
                  color: 'rgba(155,89,255,0.85)',
                  letterSpacing: 0.5, lineHeight: 1.5,
                }}>
                  {FRASES_ESPERA[fraseIdx].sub}
                </div>
              </div>

              <p style={{ textAlign: 'center', fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,0.12)', animation: 'pulse 2.2s ease-in-out infinite' }}>
                · ACTUALIZANDO EN TIEMPO REAL ·
              </p>
            </>
          )}

          {historial.length > 0 && <HistorialRondas historial={historial} onToggle={() => setMostrarHistorial(v => !v)} mostrar={mostrarHistorial} />}
        </div>
      </div>
    );
  }

  // ── PANTALLA: REGISTRO ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(20px,5vw,60px) clamp(16px,4vw,40px)', position: 'relative', overflow: 'hidden' }}>
      <Particles />
      <Header totalBecas={totalBecas} totalGanadores={totalGanadores} rondaNum={rondaNum} eventoNombre={evento?.nombre} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 500, marginTop: 72, animation: 'fadeUp .6s ease both' }}>

        {/* Arco decorativo superior */}
        <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 320, height: 160, borderRadius: '160px 160px 0 0', border: `2px solid rgba(255,215,0,0.15)`, borderBottom: 'none', pointerEvents: 'none', animation: 'arcGlow 3s ease-in-out infinite' }} />

        {/* Título épico */}
        <div style={{ textAlign: 'center', marginBottom: 0, position: 'relative' }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: 6, color: 'rgba(255,215,0,0.6)', marginBottom: 8 }}>
            ✦ TEMPLO DEL PROPÓSITO ✦
          </div>
          <div style={{
            fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
            fontSize: 'clamp(22px,6vw,38px)',
            background: `linear-gradient(180deg,#fff4a0 0%,#FFD700 40%,#b8860b 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            animation: 'textGlow 2.5s ease-in-out infinite',
            letterSpacing: 3, lineHeight: 1.1,
          }}>
            {evento?.nombre || 'SORTEO ÉPICO'}
          </div>
        </div>

        {/* Maestro grande central con templarios orbitando */}
        <div style={{ textAlign: 'center', margin: 'clamp(24px,5vw,36px) 0 clamp(16px,4vw,24px)' }}>
          <Maestro size={clamp(160, 200)} animate="float" glow epic />
        </div>

        {/* Ticker de prueba social — último ganador */}
        {historial.length > 0 && (() => {
          const ultimaRonda = historial.find(r => r.sorteo_participantes?.some(p => p.es_ganador));
          const ultimoGanador = ultimaRonda?.sorteo_participantes?.find(p => p.es_ganador);
          if (!ultimoGanador) return null;
          const nombre = ultimoGanador.nombre || '';
          const inicial = nombre.charAt(0).toUpperCase();
          const apellido = nombre.split(' ')[1] ? nombre.split(' ')[1].charAt(0).toUpperCase() + '.' : '';
          const nombreCorto = `${nombre.split(' ')[0]} ${apellido}`.trim();
          return (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,215,0,0.04)',
              border: '1px solid rgba(255,215,0,0.18)',
              borderRadius: 50,
              padding: '8px 16px 8px 8px',
              marginBottom: 20,
              animation: 'fadeUp 0.8s ease both',
              justifyContent: 'center',
            }}>
              {/* Avatar inicial */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,rgba(255,215,0,0.25),rgba(204,68,255,0.15))',
                border: '1.5px solid rgba(255,215,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Cinzel, serif', fontWeight: 900,
                fontSize: 11, color: C.gold,
              }}>
                {inicial}
              </div>
              {/* Texto */}
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
                <span style={{ color: C.goldDim }}>👑 Última beca:</span>
                {' '}
                <span style={{ color: C.gold, fontWeight: 700 }}>{nombreCorto}</span>
                {' · '}
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Ronda #{ultimaRonda.numero_ronda}</span>
              </span>
              {/* Punto verde pulsante */}
              <div style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: C.green,
                boxShadow: `0 0 8px ${C.green}`,
                animation: 'pulse 1.8s ease-in-out infinite',
              }} />
            </div>
          );
        })()}

        {/* Premio principal épico */}
        <div style={{ marginBottom: 20, animation: 'floatBeca 3.5s ease-in-out infinite' }}>
          <div style={{
            background: 'linear-gradient(135deg,rgba(255,215,0,0.12),rgba(204,68,255,0.06),rgba(255,215,0,0.08))',
            border: `1.5px solid rgba(255,215,0,0.45)`,
            borderRadius: 20,
            padding: 'clamp(16px,3vw,24px)',
            boxShadow: '0 0 40px rgba(255,215,0,0.1), inset 0 0 30px rgba(255,215,0,0.04)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Línea de brillo superior */}
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,215,0,0.8),transparent)' }} />

            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 5, color: 'rgba(255,215,0,0.6)', textAlign: 'center', marginBottom: 6 }}>
              ✦ PREMIO PRINCIPAL ✦
            </div>
            <div style={{
              fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
              fontSize: 'clamp(20px,5vw,28px)', color: '#FFD700',
              letterSpacing: 2, textAlign: 'center',
              textShadow: '0 0 30px rgba(255,215,0,0.9), 0 0 60px rgba(255,215,0,0.4)',
              marginBottom: 4,
            }}>
              🏆 BECA COMPLETA
            </div>
            <div style={{ fontFamily: 'Crimson Text, serif', fontSize: 14, color: 'rgba(255,215,0,0.8)', fontStyle: 'italic', textAlign: 'center', marginBottom: 16 }}>
              6 meses de acceso total a Propotienda — valor $294 USD
            </div>

            {/* Beneficios en grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { ico: '⚔️', txt: 'Evaluaciones semanales personalizadas' },
                { ico: '🗺️', txt: 'Mapas del Templo y sistema guiado' },
                { ico: '🪙', txt: 'Propocoins + Propo-Tienda desbloqueada' },
                { ico: '👑', txt: '100 Templarios Dijeron — dinámicas VIP' },
                { ico: '🤝', txt: 'Comunidad privada con Daniel Franco' },
                { ico: '🤖', txt: 'Herramientas de IA exclusivas del Templo' },
              ].map(({ ico, txt }) => (
                <div key={txt} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 7,
                  background: 'rgba(255,215,0,0.05)', borderRadius: 10,
                  padding: '8px 10px',
                  border: '1px solid rgba(255,215,0,0.12)',
                }}>
                  <span style={{ fontSize: 14, lineHeight: 1.4, flexShrink: 0 }}>{ico}</span>
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5, lineHeight: 1.4 }}>{txt}</span>
                </div>
              ))}
            </div>

            {/* Línea de brillo inferior */}
            <div style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,215,0,0.4),transparent)' }} />
          </div>
        </div>

        {/* Cupo */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,215,0,0.06)', border: `1px solid rgba(255,215,0,0.25)`,
            borderRadius: 32, padding: '9px 22px',
          }}>
            <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 'clamp(22px,5.5vw,30px)', color: C.gold }}>
              {cupoActual}
            </span>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: 'rgba(255,215,0,0.7)' }}>
              / {cupoTotal} en esta ronda
            </span>
          </div>
          <div style={{ maxWidth: 280, margin: '10px auto 0' }}>
            <BarraProgreso actual={cupoActual} total={cupoTotal} />
          </div>
        </div>

        {/* Card formulario */}
        <div style={{
          background: 'rgba(10,5,26,0.97)',
          border: `1.5px solid rgba(255,215,0,0.2)`,
          borderRadius: 22, padding: 'clamp(24px,5vw,38px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 60px rgba(255,215,0,0.05)',
        }}>
          <h2 style={{
            fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
            fontSize: 'clamp(17px,4.5vw,23px)', marginBottom: 8, textAlign: 'center',
            background: `linear-gradient(135deg,${C.gold},${C.purple})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            letterSpacing: 2,
          }}>
            ENTRA AL SORTEO
          </h2>
          <p style={{ textAlign: 'center', fontFamily: 'Crimson Text, serif', fontSize: 15, color: C.muted, fontStyle: 'italic', lineHeight: 1.75, marginBottom: 14 }}>
            Un guerrero gana <span style={{ color: C.gold }}>6 meses</span> gratis.<br />
            Todos los demás reciben un cupón especial.
          </p>
          <p style={{ textAlign: 'center', fontFamily: 'Crimson Text, serif', fontSize: 12.5, color: 'rgba(212,175,55,0.55)', fontStyle: 'italic', lineHeight: 1.75, marginBottom: 26 }}>
            Y tu registro ya suma a algo más grande: cada <span style={{ color: C.gold, fontStyle: 'normal' }}>6 Templarios nuevos</span>, alguien con potencial cruza la puerta sin pagar nada. Cada <span style={{ color: C.gold, fontStyle: 'normal' }}>25</span>, un costal de 20kg llega directo al plato de un perrito que hoy tiene hambre.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 22 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 2, color: C.goldDim, marginBottom: 8 }}>
                TU NOMBRE
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && registrarse()}
                placeholder="Nombre de guerrero"
                autoComplete="name"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${errores.nombre ? C.red : C.border}`,
                  borderRadius: 11, padding: '14px 17px',
                  color: C.text, fontFamily: 'Cinzel, serif', fontSize: 12,
                  transition: 'border-color .2s',
                  animation: errores.nombre ? 'shake .35s ease' : 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 2, color: C.goldDim, marginBottom: 8 }}>
                TU EMAIL
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && registrarse()}
                placeholder="tu@email.com"
                autoComplete="email"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${errores.email ? C.red : C.border}`,
                  borderRadius: 11, padding: '14px 17px',
                  color: C.text, fontFamily: 'Cinzel, serif', fontSize: 12,
                  transition: 'border-color .2s',
                  animation: errores.email ? 'shake .35s ease' : 'none',
                }}
              />
            </div>
          </div>

          {errores.general && (
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: C.red, marginBottom: 14, textAlign: 'center', letterSpacing: 1 }}>
              ⚠ {errores.general}
            </p>
          )}

          <button
            onClick={registrarse}
            disabled={guardando}
            style={{
              width: '100%', padding: '16px', borderRadius: 13, border: 'none',
              cursor: guardando ? 'not-allowed' : 'pointer',
              background: guardando ? 'rgba(212,175,55,0.1)' : `linear-gradient(135deg,${C.gold},#9a7a00)`,
              color: guardando ? C.gold : '#0a0614',
              fontFamily: 'Cinzel, serif', fontSize: 13, letterSpacing: 3, fontWeight: 900,
              transition: 'all .2s',
              animation: guardando ? 'none' : 'btnPulse 2.8s ease-in-out infinite',
            }}
          >
            {guardando ? 'REGISTRANDO...' : '⚔️ ENTRAR AL SORTEO'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <a href="https://templodelpropositooficial.netlify.app/" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 2, color: C.goldDim, textDecoration: 'none' }}>
            ¿QUÉ ES PROPOTIENDA? →
          </a>
        </div>

        {historial.length > 0 && <HistorialRondas historial={historial} onToggle={() => setMostrarHistorial(v => !v)} mostrar={mostrarHistorial} />}
      </div>
    </div>
  );
}

// Helper — no es clamp() de CSS, solo para tamaño del Maestro en registro
function clamp(min, max) {
  try {
    const vw = window.innerWidth;
    return Math.min(max, Math.max(min, vw * 0.32));
  } catch { return min; }
}