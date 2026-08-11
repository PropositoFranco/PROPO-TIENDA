/* ═══════════════════════════════════════════════════════════════
   VictoryModal.jsx — Cinemática de compra exitosa
   Templo del Propósito · Propo-Tienda
   
   USO en OffersPage.jsx:
   
   import VictoryModal from './VictoryModal.jsx';
   
   // Reemplaza el showSuccess state por:
   const [victoryOffer, setVictoryOffer] = useState(null);
   
   // En onSuccess:
   setVictoryOffer(activeOffer);
   setActiveOffer(null);
   setTimeout(() => loadProfile(), 2000);
   
   // En el JSX (reemplaza el div de showSuccess):
   {victoryOffer && (
     <VictoryModal
       offer={victoryOffer}
       onClose={() => setVictoryOffer(null)}
     />
   )}
═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react';

/* ── Detectar tipo de compra ─────────────────────────────────── */
function getOfferType(offer) {
  const months = offer?.months_to_add ?? 0;
  const price  = parseFloat(offer?.price ?? 0);
  if (months > 0 && price >= 40) return 'pack_completo';  // pack + membresía
  if (months > 0)                return 'membresia';       // solo membresía
  return 'pack';                                           // pack individual
}

/* ── Config por tipo ─────────────────────────────────────────── */
const TYPE_CONFIG = {
  membresia: {
    icon:      '👑',
    badge:     'MEMBRESÍA ACTIVADA',
    title:     '¡ACCESO DESBLOQUEADO!',
    sub:       (o) => o.months_to_add === 1 ? 'Tu membresía fue extendida 1 mes' : `Tu membresía fue extendida ${o.months_to_add} meses`,
    color:     '#ffd700',
    glow:      'rgba(255,215,0,0.6)',
    strip:     'linear-gradient(90deg,#b8860b,#ffd700,#ff8c00,#ffd700)',
    particles: 'gold',
    sound:     'fanfare',
  },
  pack_completo: {
    icon:      '⚜️',
    badge:     'PACK COMPLETO ACTIVADO',
    title:     '¡PODER TOTAL!',
    sub:       (o) => `Pack completo + ${o.months_to_add} mes de membresía`,
    color:     '#ffffff',
    glow:      'rgba(255,255,255,0.5)',
    strip:     'linear-gradient(90deg,#ffffff,#a78bfa,#ffd700,#ffffff)',
    particles: 'divine',
    sound:     'divine',
  },
  pack: {
    icon:      '⚡',
    badge:     'PACK DESBLOQUEADO',
    title:     '¡EQUIPO OBTENIDO!',
    sub:       (o) => `${o.title} ya está en tu arsenal`,
    color:     '#b44fff',
    glow:      'rgba(180,79,255,0.6)',
    strip:     'linear-gradient(90deg,#7b2ff7,#b44fff,#7b2ff7)',
    particles: 'purple',
    sound:     'unlock',
  },
};

/* ── Sonidos via Web Audio API ───────────────────────────────── */
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    if (type === 'fanfare') {
      // Fanfarria dorada — acordes ascendentes
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const t = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.start(t); osc.stop(t + 0.5);
      });
      // Shimmer
      setTimeout(() => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 2093;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1.2);
      }, 480);

    } else if (type === 'divine') {
      // Divino — acorde perfecto + reverb simulado
      const freqs = [261, 329, 392, 523, 659, 1047];
      freqs.forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = i < 3 ? 'sine' : 'triangle';
        const t = ctx.currentTime + i * 0.08;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
        osc.start(t); osc.stop(t + 1.4);
      });

    } else if (type === 'unlock') {
      // Unlock — sweep ascendente + click
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);

      // segundo tono
      setTimeout(() => {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.frequency.value = 1400;
        o2.type = 'sine';
        g2.gain.setValueAtTime(0.1, ctx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        o2.start(ctx.currentTime); o2.stop(ctx.currentTime + 0.4);
      }, 280);
    }
  } catch(e) { /* silencioso si no hay AudioContext */ }
}

/* ── Partículas canvas ───────────────────────────────────────── */
function ParticleCanvas({ type }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = {
      gold:   ['#ffd700','#ff8c00','#fff8dc','#b8860b','#ffec8b'],
      divine: ['#ffffff','#a78bfa','#ffd700','#c4b5fd','#fff'],
      purple: ['#b44fff','#7b2ff7','#d4aaff','#e879f9','#c026d3'],
    };
    const colors = COLORS[type] || COLORS.gold;

    const particles = Array.from({ length: 80 }, () => ({
      x:    canvas.width  * (0.2 + Math.random() * 0.6),
      y:    canvas.height * (0.3 + Math.random() * 0.3),
      vx:   (Math.random() - 0.5) * 8,
      vy:   -(4 + Math.random() * 8),
      size: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rot:  Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      life: 0.8 + Math.random() * 0.2,
    }));

    let frame;
    let t = 0;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.016;
      let alive = false;
      for (const p of particles) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.18;  // gravity
        p.vx *= 0.99;
        p.rot += p.rotV;
        p.alpha = Math.max(0, p.life - t * 0.7);
        if (p.alpha <= 0) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.5);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size/2, 0, Math.PI*2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (alive) frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [type]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 99998,
      }}
    />
  );
}

/* ── VictoryModal principal ──────────────────────────────────── */
export default function VictoryModal({ offer, onClose }) {
  const type   = getOfferType(offer);
  const config = TYPE_CONFIG[type];
  const [phase, setPhase] = useState('enter'); // enter → show → exit

  useEffect(() => {
    // Sonido inmediato
    playSound(config.sound);

    // Auto-cerrar a los 5.5 segundos
    const t1 = setTimeout(() => setPhase('exit'), 5000);
    const t2 = setTimeout(() => onClose(), 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <>
      <style>{CSS}</style>

      {/* Partículas sobre todo */}
      <ParticleCanvas type={config.particles} />

      {/* Overlay */}
      <div
        className={`vm-overlay vm-overlay--${phase}`}
        onClick={() => { setPhase('exit'); setTimeout(onClose, 500); }}
      >
        {/* Flash de entrada */}
        <div className="vm-flash" style={{ '--vc': config.color, '--vg': config.glow }} />

        {/* Card principal */}
        <div
          className={`vm-card vm-card--${phase}`}
          onClick={e => e.stopPropagation()}
          style={{ '--vc': config.color, '--vg': config.glow, '--vs': config.strip }}
        >
          {/* Strip top animado */}
          <div className="vm-strip" />

          {/* Glow de fondo */}
          <div className="vm-bg-glow" />

          {/* Rays */}
          <div className="vm-rays" />

          {/* Badge */}
          <div className="vm-badge">{config.badge}</div>

          {/* Icono central */}
          <div className="vm-icon-wrap">
            <div className="vm-icon-ring vm-icon-ring--outer" />
            <div className="vm-icon-ring vm-icon-ring--inner" />
            <div className="vm-icon">{config.icon}</div>
          </div>

          {/* Título */}
          <h1 className="vm-title">{config.title}</h1>

          {/* Subtítulo */}
          <p className="vm-sub">{config.sub(offer)}</p>

          {/* Info oferta */}
          <div className="vm-offer-info">
            <span className="vm-offer-name">{offer.title}</span>
            {offer.months_to_add > 0 && (
              <span className="vm-offer-months">
                +{offer.months_to_add} {offer.months_to_add === 1 ? 'MES' : 'MESES'} ACTIVADOS
              </span>
            )}
          </div>

          {/* Divider animado */}
          <div className="vm-divider" />

          {/* Botón continuar */}
          <button
            className="vm-btn"
            onClick={() => { setPhase('exit'); setTimeout(onClose, 500); }}
          >
            <span className="vm-btn-shine" />
            ⚔️ CONTINUAR
          </button>

          {/* Esquinas decorativas */}
          <i className="vm-co vm-co--tl" /><i className="vm-co vm-co--tr" />
          <i className="vm-co vm-co--bl" /><i className="vm-co vm-co--br" />
        </div>
      </div>
    </>
  );
}

/* ══ CSS ══════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&display=swap');

/* overlay */
.vm-overlay {
  position: fixed; inset: 0; z-index: 99997;
  background: rgba(3,1,18,0.88);
  backdrop-filter: blur(12px);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 20px;
  padding-top: max(20px, env(safe-area-inset-top, 20px));
  padding-bottom: max(20px, env(safe-area-inset-bottom, 20px));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  transition: opacity .5s ease;
}
.vm-overlay--enter { animation: vm-fade-in .3s ease both; }
.vm-overlay--exit  { opacity: 0; pointer-events: none; }
@keyframes vm-fade-in { from { opacity:0; } to { opacity:1; } }

/* flash de entrada */
.vm-flash {
  position: fixed; inset: 0;
  background: radial-gradient(ellipse at center, var(--vg) 0%, transparent 70%);
  animation: vm-flash .6s ease both;
  pointer-events: none; z-index: 99996;
}
@keyframes vm-flash {
  0%   { opacity: 1; transform: scale(0.5); }
  50%  { opacity: 0.8; transform: scale(1.2); }
  100% { opacity: 0; transform: scale(2); }
}

/* card */
.vm-card {
  position: relative;
  width: 100%; max-width: 440px;
  background: linear-gradient(160deg, #12072a 0%, #070512 100%);
  border: 1px solid color-mix(in srgb, var(--vc) 40%, transparent);
  border-radius: 24px;
  padding: 36px 32px 32px;
  text-align: center;
  overflow: hidden;
  margin: auto;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--vc) 15%, transparent),
    0 0 60px color-mix(in srgb, var(--vg) 60%, transparent),
    0 0 120px color-mix(in srgb, var(--vg) 30%, transparent),
    0 32px 80px rgba(0,0,0,0.9);
}
.vm-card--enter { animation: vm-card-in .5s cubic-bezier(.22,1,.36,1) both; }
.vm-card--exit  { animation: vm-card-out .5s cubic-bezier(.55,0,1,.45) both; }
@keyframes vm-card-in {
  from { opacity:0; transform: scale(.7) translateY(40px); }
  to   { opacity:1; transform: scale(1)  translateY(0); }
}
@keyframes vm-card-out {
  from { opacity:1; transform: scale(1)    translateY(0); }
  to   { opacity:0; transform: scale(1.08) translateY(-20px); }
}

/* strip top */
.vm-strip {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: var(--vs);
  background-size: 200% 100%;
  animation: vm-strip-slide 2s linear infinite;
  z-index: 8;
}
@keyframes vm-strip-slide {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}

/* bg glow */
.vm-bg-glow {
  position: absolute; top: -60px; left: 50%;
  transform: translateX(-50%);
  width: 300px; height: 300px;
  background: radial-gradient(circle, var(--vg) 0%, transparent 70%);
  animation: vm-glow-pulse 2s ease-in-out infinite;
  pointer-events: none;
}
@keyframes vm-glow-pulse {
  0%,100% { opacity:.5; transform: translateX(-50%) scale(1);    }
  50%     { opacity:.9; transform: translateX(-50%) scale(1.15); }
}

/* rays */
.vm-rays {
  position: absolute; inset: 0;
  background: conic-gradient(
    from 0deg at 50% 30%,
    transparent 0deg,
    color-mix(in srgb, var(--vc) 4%, transparent) 10deg, transparent 20deg,
    color-mix(in srgb, var(--vc) 3%, transparent) 30deg, transparent 40deg,
    color-mix(in srgb, var(--vc) 5%, transparent) 50deg, transparent 60deg,
    color-mix(in srgb, var(--vc) 3%, transparent) 80deg, transparent 90deg
  );
  animation: vm-rays-spin 8s linear infinite;
  pointer-events: none;
}
@keyframes vm-rays-spin { to { transform: rotate(360deg); } }

/* badge */
.vm-badge {
  position: relative; z-index: 2;
  display: inline-block;
  background: color-mix(in srgb, var(--vc) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--vc) 50%, transparent);
  color: var(--vc);
  font-family: 'Cinzel', serif;
  font-size: 9px; font-weight: 700; letter-spacing: 3px;
  padding: 5px 16px; border-radius: 999px;
  margin-bottom: 20px;
  animation: vm-badge-in .5s .2s cubic-bezier(.22,1,.36,1) both;
  text-shadow: 0 0 12px var(--vg);
}
@keyframes vm-badge-in {
  from { opacity:0; transform: scale(.8) translateY(-10px); }
  to   { opacity:1; transform: scale(1)  translateY(0); }
}

/* icono */
.vm-icon-wrap {
  position: relative; z-index: 2;
  width: 100px; height: 100px;
  margin: 0 auto 20px;
  display: flex; align-items: center; justify-content: center;
  animation: vm-icon-in .6s .15s cubic-bezier(.22,1,.36,1) both;
}
@keyframes vm-icon-in {
  from { opacity:0; transform: scale(0) rotate(-180deg); }
  to   { opacity:1; transform: scale(1) rotate(0deg); }
}
.vm-icon-ring {
  position: absolute; border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--vc) 40%, transparent);
  animation: vm-ring-spin linear infinite;
}
.vm-icon-ring--outer {
  width: 100px; height: 100px;
  animation-duration: 6s;
  border-top-color: var(--vc);
}
.vm-icon-ring--inner {
  width: 76px; height: 76px;
  animation-duration: 4s;
  animation-direction: reverse;
  border-right-color: var(--vc);
}
@keyframes vm-ring-spin { to { transform: rotate(360deg); } }
.vm-icon {
  font-size: 48px; line-height: 1;
  filter: drop-shadow(0 0 20px var(--vg));
  animation: vm-icon-float 2s ease-in-out infinite;
  position: relative; z-index: 2;
}
@keyframes vm-icon-float {
  0%,100% { transform: translateY(0) scale(1);    }
  50%     { transform: translateY(-6px) scale(1.05); }
}

/* título */
.vm-title {
  position: relative; z-index: 2;
  font-family: 'Cinzel', serif;
  font-size: clamp(22px, 5vw, 32px);
  font-weight: 900; letter-spacing: 2px;
  color: var(--vc);
  text-shadow: 0 0 30px var(--vg), 0 0 60px var(--vg);
  margin: 0 0 10px;
  animation: vm-title-in .5s .3s cubic-bezier(.22,1,.36,1) both;
}
@keyframes vm-title-in {
  from { opacity:0; transform: translateY(20px); }
  to   { opacity:1; transform: translateY(0); }
}

/* sub */
.vm-sub {
  position: relative; z-index: 2;
  font-size: 14px; color: #a090c0; line-height: 1.6; margin: 0 0 20px;
  animation: vm-title-in .5s .4s cubic-bezier(.22,1,.36,1) both;
}

/* offer info */
.vm-offer-info {
  position: relative; z-index: 2;
  display: flex; flex-direction: column; gap: 6px;
  background: color-mix(in srgb, var(--vc) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--vc) 20%, transparent);
  border-radius: 12px; padding: 12px 16px; margin-bottom: 20px;
  animation: vm-title-in .5s .5s cubic-bezier(.22,1,.36,1) both;
}
.vm-offer-name {
  font-size: 13px; font-weight: 700; color: #f0e6ff; letter-spacing: .5px;
}
.vm-offer-months {
  font-family: 'Cinzel', serif;
  font-size: 10px; font-weight: 700; letter-spacing: 2px;
  color: var(--vc); text-shadow: 0 0 10px var(--vg);
}

/* divider */
.vm-divider {
  position: relative; z-index: 2;
  height: 1px; margin-bottom: 20px;
  background: linear-gradient(90deg, transparent, var(--vc), transparent);
  opacity: .4;
  animation: vm-title-in .5s .55s cubic-bezier(.22,1,.36,1) both;
}

/* botón */
.vm-btn {
  position: relative; z-index: 2;
  overflow: hidden;
  width: 100%; padding: 14px;
  border: none; border-radius: 12px;
  background: var(--vs);
  background-size: 250% 100%;
  animation: vm-btn-slide 2.4s linear infinite, vm-title-in .5s .6s cubic-bezier(.22,1,.36,1) both;
  color: #0a0500; font-family: 'Cinzel', serif;
  font-size: 13px; font-weight: 700; letter-spacing: 3px;
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease;
  box-shadow: 0 0 24px color-mix(in srgb, var(--vg) 60%, transparent);
}
.vm-btn:hover {
  transform: scale(1.03) translateY(-2px);
  box-shadow: 0 0 40px var(--vg), 0 8px 28px rgba(0,0,0,.6);
}
.vm-btn:active { transform: scale(.97); }
@keyframes vm-btn-slide {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
.vm-btn-shine {
  position: absolute; inset: 0;
  background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,.2) 50%, transparent 70%);
  background-size: 200% 100%;
  animation: vm-btn-gleam 2.4s linear infinite;
  pointer-events: none;
}
@keyframes vm-btn-gleam {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}

/* esquinas */
.vm-co {
  position: absolute; width: 14px; height: 14px;
  border-style: solid; border-color: transparent;
  pointer-events: none; z-index: 6;
  border-color: color-mix(in srgb, var(--vc) 70%, transparent);
  font-style: normal;
}
.vm-co--tl { top:8px; left:8px;  border-top-width:2px; border-left-width:2px;  border-right:none; border-bottom:none; }
.vm-co--tr { top:8px; right:8px; border-top-width:2px; border-right-width:2px; border-left:none;  border-bottom:none; }
.vm-co--bl { bottom:8px; left:8px;  border-bottom-width:2px; border-left-width:2px;  border-right:none; border-top:none; }
.vm-co--br { bottom:8px; right:8px; border-bottom-width:2px; border-right-width:2px; border-left:none;  border-top:none; }

/* responsive */
@media (max-width: 480px) {
  .vm-card { padding: 28px 20px 24px; }
  .vm-title { font-size: 22px; }
  .vm-icon-wrap { width: 80px; height: 80px; }
  .vm-icon { font-size: 38px; }
  .vm-icon-ring--outer { width: 80px; height: 80px; }
  .vm-icon-ring--inner { width: 60px; height: 60px; }
}
`;