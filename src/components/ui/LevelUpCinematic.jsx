import { useState, useEffect, useRef, useCallback } from "react";

/*
  ╔══════════════════════════════════════════════════════╗
  ║  LevelUpCinematic — Templo del Propósito             ║
  ║  Props:                                              ║
  ║    show        boolean  — dispara la cinemática      ║
  ║    oldLevel    number   — nivel anterior             ║
  ║    newLevel    number   — nivel nuevo                ║
  ║    newTitle    string   — nuevo rango                ║
  ║    bonusXP     number   — XP extra (opcional)        ║
  ║    bonusCoins  number   — PropoCoins extra (opc.)    ║
  ║    onComplete  fn       — callback al cerrar         ║
  ╚══════════════════════════════════════════════════════╝
*/

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@700&display=swap');

/* ── Keyframes ─────────────────────────────────── */
@keyframes lu-fadein        { from{opacity:0}to{opacity:1} }
@keyframes lu-fadeout       { from{opacity:1}to{opacity:0} }

@keyframes lu-flash {
  0%   {opacity:0}
  8%   {opacity:.95}
  22%  {opacity:.6}
  100% {opacity:0}
}
@keyframes lu-pillar-rise {
  from {transform:scaleY(0);opacity:0}
  to   {transform:scaleY(1);opacity:1}
}
@keyframes lu-ring-wave {
  0%   {transform:scale(.15);opacity:.85;border-width:3px}
  100% {transform:scale(4.5);opacity:0;border-width:1px}
}
@keyframes lu-rays-spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }

@keyframes lu-badge-old-out {
  0%   {transform:scale(1) rotate(0deg);opacity:1;filter:grayscale(0)}
  60%  {transform:scale(.3) rotate(-25deg) translateX(-60px);opacity:.4;filter:grayscale(1) blur(2px)}
  100% {transform:scale(0) rotate(-40deg) translateX(-80px);opacity:0}
}
@keyframes lu-badge-new-in {
  0%   {transform:scale(0) rotate(12deg);opacity:0}
  55%  {transform:scale(1.22) rotate(-3deg);opacity:1}
  72%  {transform:scale(.94) rotate(1deg)}
  85%  {transform:scale(1.06) rotate(-.5deg)}
  100% {transform:scale(1) rotate(0deg);opacity:1}
}
@keyframes lu-badge-shake {
  0%,100%{transform:scale(1) rotate(0deg)}
  15%    {transform:scale(1.06) translateX(-6px) rotate(-2deg)}
  30%    {transform:scale(1.04) translateX(5px) rotate(2deg)}
  45%    {transform:scale(1.06) translateX(-4px) rotate(-1deg)}
  60%    {transform:scale(1.03) translateX(3px) rotate(1deg)}
  75%    {transform:scale(1.02) translateX(-2px) rotate(0deg)}
}
@keyframes lu-shine-sweep {
  from{transform:translateX(-160%) skewX(-15deg)}
  to  {transform:translateX(260%) skewX(-15deg)}
}
@keyframes lu-orb-pulse {
  0%,100%{transform:scale(1);opacity:.28}
  50%    {transform:scale(1.18);opacity:.5}
}
@keyframes lu-eyebrow-drop {
  from{transform:translateY(-24px);opacity:0;letter-spacing:14px}
  to  {transform:translateY(0);opacity:1;letter-spacing:7px}
}
@keyframes lu-title-letter {
  from{transform:translateY(20px) scale(.8);opacity:0}
  to  {transform:translateY(0) scale(1);opacity:1}
}
@keyframes lu-rank-rise {
  from{transform:translateY(22px);opacity:0}
  to  {transform:translateY(0);opacity:1}
}
@keyframes lu-divider-grow {
  from{width:0;opacity:0}
  to  {width:220px;opacity:1}
}
@keyframes lu-bonus-float {
  0%  {transform:translateY(0);opacity:0}
  15% {opacity:1}
  80% {opacity:.8}
  100%{transform:translateY(-52px);opacity:0}
}
@keyframes lu-particle {
  0%  {transform:translate(-50%,-50%) rotate(var(--pa)) translateX(0) scale(1.4);opacity:1}
  100%{transform:translate(-50%,-50%) rotate(var(--pa)) translateX(var(--pd)) scale(0);opacity:0}
}
@keyframes lu-continue-in {
  from{transform:translateY(14px) scale(.9);opacity:0}
  to  {transform:translateY(0) scale(1);opacity:1}
}
@keyframes lu-continue-pulse {
  0%,100%{box-shadow:0 0 18px rgba(212,175,55,.35),0 0 0 0 rgba(212,175,55,0)}
  50%    {box-shadow:0 0 30px rgba(212,175,55,.55),0 0 0 8px rgba(212,175,55,0)}
}
@keyframes lu-num-count {
  0%  {transform:translateY(80%);opacity:0}
  100%{transform:translateY(0%);opacity:1}
}
@keyframes lu-glyph-spin {
  from{transform:rotate(0deg)}
  to  {transform:rotate(-360deg)}
}
@keyframes lu-sacred-expand {
  0%  {transform:scale(0) rotate(0deg);opacity:0}
  60% {opacity:.8}
  100%{transform:scale(1.6) rotate(180deg);opacity:0}
}

/* ── Overlay ────────────────────────────────────── */
.lu-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: rgba(2, 0, 12, 0.96);
  backdrop-filter: blur(14px) saturate(1.2);
  animation: lu-fadein .3s ease both;
  font-family: 'Cinzel', serif;
}
.lu-overlay.lu-out {
  animation: lu-fadeout .5s ease both;
  pointer-events: none;
}

/* ── Flash burst ────────────────────────────────── */
.lu-flash {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background: radial-gradient(ellipse at 50% 42%, #fffbe0 0%, #ffd700 25%, #b44fff 55%, transparent 72%);
  animation: lu-flash 1.6s ease both;
}

/* ── Vertical light pillar ──────────────────────── */
.lu-pillar {
  position: absolute;
  left: 50%; transform: translateX(-50%) scaleY(0);
  width: 2px; height: 100vh; top: 0;
  background: linear-gradient(to bottom,
    transparent 0%,
    rgba(212,175,55,.06) 20%,
    rgba(212,175,55,.35) 45%,
    rgba(180,79,255,.35) 55%,
    rgba(212,175,55,.06) 80%,
    transparent 100%
  );
  pointer-events: none; z-index: 2;
  transform-origin: center center;
  filter: blur(1px);
}
.lu-pillar-wide {
  position: absolute;
  left: 50%; transform: translateX(-50%) scaleY(0);
  width: 160px; height: 100vh; top: 0;
  background: linear-gradient(to bottom,
    transparent 0%,
    rgba(212,175,55,.01) 20%,
    rgba(212,175,55,.07) 42%,
    rgba(180,79,255,.06) 55%,
    rgba(212,175,55,.01) 80%,
    transparent 100%
  );
  pointer-events: none; z-index: 2;
  transform-origin: center center;
  filter: blur(24px);
}
.lu-pillar.on, .lu-pillar-wide.on {
  animation: lu-pillar-rise .55s cubic-bezier(.22,1,.36,1) both;
  transform: translateX(-50%) scaleY(1);
}

/* ── Rotating rays ──────────────────────────────── */
.lu-rays-wrap {
  position: absolute; inset: 0; pointer-events: none;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; z-index: 2;
}
.lu-rays-disk {
  width: 900px; height: 900px;
  animation: lu-rays-spin 16s linear infinite;
  opacity: 0; transition: opacity .8s ease;
  position: relative;
}
.lu-rays-disk.on { opacity: .12; }
.lu-ray {
  position: absolute; top: 50%; left: 50%;
  width: 2px; height: 450px;
  transform-origin: 50% 0;
  margin-left: -1px; margin-top: 0;
  background: linear-gradient(to bottom, rgba(212,175,55,1), transparent);
}

/* ── Expanding rings ────────────────────────────── */
.lu-rings {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none; z-index: 3;
}
.lu-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(212,175,55,.7);
  width: 100px; height: 100px; opacity: 0;
}
.lu-ring.on { animation: lu-ring-wave 1.8s ease-out both; }
.lu-ring:nth-child(2).on { animation-delay: .22s; border-color: rgba(180,79,255,.6); }
.lu-ring:nth-child(3).on { animation-delay: .44s; }
.lu-ring:nth-child(4).on { animation-delay: .66s; border-color: rgba(180,79,255,.5); }
.lu-ring:nth-child(5).on { animation-delay: .88s; }

/* ── Sacred geometry burst ──────────────────────── */
.lu-sacred {
  position: absolute;
  width: 280px; height: 280px;
  pointer-events: none; z-index: 3;
  opacity: 0;
}
.lu-sacred.on {
  animation: lu-sacred-expand 1.2s ease-out both;
}

/* ── Glow orb ───────────────────────────────────── */
.lu-orb {
  position: absolute;
  width: 420px; height: 420px; border-radius: 50%;
  background: radial-gradient(circle at 50%,
    rgba(180,79,255,.14) 0%,
    rgba(212,175,55,.09) 35%,
    transparent 70%
  );
  pointer-events: none; z-index: 2;
  animation: lu-orb-pulse 2.8s ease infinite;
}

/* ── Center content ─────────────────────────────── */
.lu-center {
  position: relative; z-index: 10;
  display: flex; flex-direction: column;
  align-items: center; gap: 18px;
  text-align: center; padding: 50px 70px;
  pointer-events: none;
}

/* ── "ASCENDISTE" eyebrow ───────────────────────── */
.lu-eyebrow {
  font-size: 11px; font-weight: 900;
  color: #ffd700; text-transform: uppercase;
  text-shadow: 0 0 20px #ffd700, 0 0 50px rgba(255,215,0,.4);
  opacity: 0; white-space: nowrap;
}
.lu-eyebrow.on {
  animation: lu-eyebrow-drop .6s cubic-bezier(.22,1,.36,1) both;
}

/* ── Level row ──────────────────────────────────── */
.lu-level-row {
  display: flex; align-items: center; gap: 24px;
  opacity: 0; position: relative;
}
.lu-level-row.on {
  animation: lu-fadein .3s ease both;
}

/* ── Badges ─────────────────────────────────────── */
.lu-badge {
  width: 96px; height: 96px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 38px; font-weight: 900;
  position: relative; overflow: hidden;
  flex-shrink: 0;
}
.lu-badge-old {
  background: linear-gradient(145deg, #1a1730, #0d0b1f);
  border: 3px solid rgba(80,70,120,.5);
  color: rgba(140,130,180,.6);
  filter: grayscale(.4);
}
.lu-badge-old.exit {
  animation: lu-badge-old-out .55s cubic-bezier(.4,0,.2,1) both;
}
.lu-badge-new {
  background: linear-gradient(145deg, #1a0f00, #261800, #1a0f00);
  border: 3px solid #d4af37;
  color: #ffd700;
  box-shadow:
    0 0 0 1px rgba(212,175,55,.2),
    0 0 30px rgba(212,175,55,.4),
    0 0 70px rgba(212,175,55,.15),
    inset 0 0 20px rgba(212,175,55,.08);
  text-shadow: 0 0 20px #ffd700, 0 0 40px rgba(255,215,0,.5);
}
.lu-badge-new.on {
  animation:
    lu-badge-new-in .7s cubic-bezier(.34,1.56,.64,1) both,
    lu-badge-shake .5s ease .72s both;
}
.lu-badge-new::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,.5) 50%, transparent 70%);
  animation: lu-shine-sweep 1.2s ease .75s both;
}

/* ── Spinning glyph ring around new badge ───────── */
.lu-glyph-ring {
  position: absolute;
  width: 120px; height: 120px;
  border-radius: 50%;
  border: 1px solid rgba(212,175,55,.2);
  border-top-color: rgba(212,175,55,.6);
  border-right-color: rgba(180,79,255,.4);
  pointer-events: none;
  opacity: 0; transition: opacity .3s;
}
.lu-glyph-ring.on {
  opacity: 1;
  animation: lu-glyph-spin 4s linear infinite;
}
.lu-glyph-ring-2 {
  width: 136px; height: 136px;
  border-color: rgba(180,79,255,.12);
  border-bottom-color: rgba(180,79,255,.4);
  border-left-color: rgba(212,175,55,.25);
}
.lu-glyph-ring-2.on {
  opacity: 1;
  animation: lu-glyph-spin 7s linear infinite reverse;
}

/* ── Badge wrapper (for ring overlay) ──────────── */
.lu-badge-wrap {
  position: relative;
  display: flex; align-items: center; justify-content: center;
}

/* ── Arrow ──────────────────────────────────────── */
.lu-arrow {
  font-size: 22px; color: rgba(212,175,55,.7);
  text-shadow: 0 0 12px rgba(212,175,55,.4);
  position: relative; top: 2px;
}

/* ── Ornamental divider ─────────────────────────── */
.lu-divider-wrap {
  display: flex; align-items: center; gap: 12px;
  width: 220px; opacity: 0;
}
.lu-divider-wrap.on {
  animation: lu-fadein .4s ease both;
}
.lu-divider-line {
  height: 1px; flex: 1;
  background: linear-gradient(90deg, transparent, rgba(180,79,255,.5), transparent);
}
.lu-divider-gem {
  width: 6px; height: 6px;
  background: rgba(180,79,255,.7);
  transform: rotate(45deg);
  box-shadow: 0 0 8px rgba(180,79,255,.5);
  flex-shrink: 0;
}

/* ── Rank box ───────────────────────────────────── */
.lu-rank-box {
  background: linear-gradient(135deg, rgba(180,79,255,.07), rgba(212,175,55,.04));
  border: 1px solid rgba(180,79,255,.25);
  border-radius: 16px;
  padding: 18px 40px;
  opacity: 0; transform: translateY(14px);
  transition: opacity .55s ease, transform .55s cubic-bezier(.22,1,.36,1);
}
.lu-rank-box.on { opacity: 1; transform: translateY(0); }

.lu-rank-label {
  font-size: 8px; letter-spacing: 5px;
  color: rgba(180,79,255,.8);
  text-transform: uppercase; margin-bottom: 8px;
}
.lu-rank-title {
  font-size: 20px; font-weight: 900; letter-spacing: 3px;
  text-transform: uppercase;
  display: flex; justify-content: center; gap: 1px;
  min-height: 28px;
}
.lu-rank-letter {
  display: inline-block;
  background: linear-gradient(135deg, #ffffff 10%, #e8d5ff 45%, #ffd700 85%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0;
  animation: lu-title-letter .5s cubic-bezier(.34,1.56,.64,1) both;
}

/* ── Bonus floaters ─────────────────────────────── */
.lu-bonus-wrap {
  display: flex; gap: 24px; align-items: center;
  min-height: 32px;
}
.lu-bonus {
  font-size: 13px; font-weight: 700; letter-spacing: 2px;
  opacity: 0;
}
.lu-bonus.xp {
  color: #ffd700;
  text-shadow: 0 0 12px rgba(255,215,0,.5);
}
.lu-bonus.coins {
  color: #d8a4ff;
  text-shadow: 0 0 12px rgba(180,79,255,.5);
}
.lu-bonus.on {
  animation: lu-bonus-float 2.2s ease-out both;
}

/* ── Continue button ────────────────────────────── */
.lu-continue {
  padding: 15px 48px;
  background: linear-gradient(135deg, #c8922a, #f5d06e, #d4af37);
  border: none; border-radius: 12px;
  color: #1a0a00;
  font-family: 'Cinzel', serif;
  font-size: 12px; font-weight: 900; letter-spacing: 4px;
  cursor: pointer; text-transform: uppercase;
  opacity: 0; pointer-events: none;
  transition: opacity .4s, transform .15s;
  position: relative; overflow: hidden;
  box-shadow: 0 0 30px rgba(212,175,55,.3), 0 4px 20px rgba(0,0,0,.5);
}
.lu-continue.visible {
  opacity: 1; pointer-events: auto;
  animation: lu-continue-in .5s cubic-bezier(.34,1.56,.64,1) both,
             lu-continue-pulse 2s ease 1s infinite;
}
.lu-continue:hover { transform: scale(1.04) translateY(-1px); }
.lu-continue:active { transform: scale(.97); }
.lu-continue::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%);
  animation: lu-shine-sweep 2.5s ease 1.5s infinite;
}

/* ── Particles ──────────────────────────────────── */
.lu-particles {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 9998;
}
.lu-particle {
  position: absolute; top: 50%; left: 50%;
  border-radius: 50%;
  width: var(--ps); height: var(--ps);
  background: var(--pc);
  box-shadow: 0 0 6px var(--pc);
  animation: lu-particle var(--pdur) ease-out var(--pdelay) both;
}
`;

const PARTICLE_COLORS = ['#ffd700','#f5d06e','#d4af37','#b44fff','#d8a4ff','#ffffff','#ff9f43','#c084fc'];

function makeParticles(count, minDist, maxDist, minSize, maxSize) {
  return Array.from({ length: count }, (_, i) => ({
    pa: `${(i / count) * 360 + Math.random() * (360 / count)}deg`,
    pd: `${minDist + Math.random() * (maxDist - minDist)}px`,
    pc: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    ps: `${minSize + Math.random() * (maxSize - minSize)}px`,
    pdur: `${0.7 + Math.random() * 0.5}s`,
    pdelay: `${Math.random() * 120}ms`,
  }));
}

const RAYS = Array.from({ length: 24 }, (_, i) => i);
const RINGS = [0, 1, 2, 3, 4];

export default function LevelUpCinematic({
  show       = false,
  oldLevel   = 4,
  newLevel   = 5,
  newTitle   = "Guardián del Propósito",
  bonusXP    = null,
  bonusCoins = null,
  onComplete,
}) {
  const [visible,   setVisible]   = useState(false);
  const [exiting,   setExiting]   = useState(false);
  const [phase,     setPhase]     = useState(0);
  const [particles, setParticles] = useState([]);
  const [letters,   setLetters]   = useState([]);
  const timers = useRef([]);

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const dismiss = useCallback(() => {
    clearAll();
    setExiting(true);
    timers.current.push(
      setTimeout(() => {
        setVisible(false);
        setExiting(false);
        setPhase(0);
        setParticles([]);
        onComplete?.();
      }, 500)
    );
  }, [clearAll, onComplete]);

  useEffect(() => {
    if (!show) return;
    // Prepare title letters for stagger
    const title = newTitle.toUpperCase();
    setLetters(title.split('').map((ch, i) => ({ ch, i })));
    setParticles([]);
    setVisible(true);
    setExiting(false);
    setPhase(0);

    const t = (...args) => { const id = setTimeout(...args); timers.current.push(id); return id; };

    t(() => setPhase(1), 50);                          // flash + pillar
    t(() => setPhase(2), 320);                         // rays on
    t(() => setPhase(3), 560);                         // rings
    t(() => setPhase(4), 860);                         // old badge out
    t(() => setPhase(5), 1050);                        // new badge in
    t(() => {                                          // particle burst 1
      setParticles(makeParticles(44, 90, 200, 4, 10));
    }, 1080);
    t(() => setPhase(6), 1500);                        // rank box + divider
    t(() => setPhase(7), 1900);                        // title letters stagger
    t(() => {                                          // particle burst 2 (softer)
      setParticles(makeParticles(28, 60, 150, 3, 7));
    }, 2100);
    t(() => setPhase(8), 2500);                        // bonuses + CONTINUAR
    t(dismiss, 9000);                                  // auto-dismiss at 9s

    return clearAll;
  }, [show, newTitle, dismiss, clearAll]);

  if (!visible) return null;

  const canDismiss = phase >= 8;

  return (
    <>
      <style>{CSS}</style>

      <div
        className={`lu-overlay${exiting ? ' lu-out' : ''}`}
        onClick={canDismiss ? dismiss : undefined}
      >
        {/* Flash */}
        {phase >= 1 && <div className="lu-flash" />}

        {/* Light pillar */}
        <div className={`lu-pillar${phase >= 1 ? ' on' : ''}`} />
        <div className={`lu-pillar-wide${phase >= 1 ? ' on' : ''}`} />

        {/* Glow orb */}
        <div className="lu-orb" />

        {/* Rotating rays */}
        <div className="lu-rays-wrap">
          <div className={`lu-rays-disk${phase >= 2 ? ' on' : ''}`}>
            {RAYS.map(i => (
              <div
                key={i}
                className="lu-ray"
                style={{ transform: `rotate(${i * (360 / RAYS.length)}deg) translateX(-50%)` }}
              />
            ))}
          </div>
        </div>

        {/* Expanding rings */}
        <div className="lu-rings">
          {RINGS.map(i => (
            <div key={i} className={`lu-ring${phase >= 3 ? ' on' : ''}`} />
          ))}
        </div>

        {/* Particles */}
        {particles.length > 0 && (
          <div className="lu-particles">
            {particles.map((p, i) => (
              <div
                key={`${i}-${p.pdelay}`}
                className="lu-particle"
                style={{ '--pa': p.pa, '--pd': p.pd, '--pc': p.pc, '--ps': p.ps, '--pdur': p.pdur, '--pdelay': p.pdelay }}
              />
            ))}
          </div>
        )}

        {/* Center */}
        <div className="lu-center">

          {/* Eyebrow */}
          <div className={`lu-eyebrow${phase >= 5 ? ' on' : ''}`}>
            ✦ &nbsp;ASCENDISTE&nbsp; ✦
          </div>

          {/* Badge row */}
          <div className={`lu-level-row${phase >= 4 ? ' on' : ''}`}>
            {/* Old badge */}
            <div className={`lu-badge lu-badge-old${phase >= 4 ? ' exit' : ''}`}>
              {oldLevel}
            </div>

            <div className="lu-arrow">→</div>

            {/* New badge with glyph rings */}
            <div className="lu-badge-wrap">
              <div className={`lu-glyph-ring${phase >= 5 ? ' on' : ''}`} />
              <div className={`lu-glyph-ring lu-glyph-ring-2${phase >= 5 ? ' on' : ''}`} />
              <div className={`lu-badge lu-badge-new${phase >= 5 ? ' on' : ''}`}>
                {newLevel}
              </div>
            </div>
          </div>

          {/* Ornamental divider */}
          <div className={`lu-divider-wrap${phase >= 6 ? ' on' : ''}`}>
            <div className="lu-divider-line" />
            <div className="lu-divider-gem" />
            <div className="lu-divider-line" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,.5), transparent)' }} />
            <div className="lu-divider-gem" style={{ background: 'rgba(212,175,55,.7)', boxShadow: '0 0 8px rgba(212,175,55,.5)' }} />
            <div className="lu-divider-line" />
          </div>

          {/* Rank box */}
          <div className={`lu-rank-box${phase >= 6 ? ' on' : ''}`}>
            <div className="lu-rank-label">Rango Conquistado</div>
            <div className="lu-rank-title">
              {phase >= 7
                ? letters.map(({ ch, i }) => (
                    <span
                      key={i}
                      className="lu-rank-letter"
                      style={{
                        animationDelay: `${i * 38}ms`,
                        whiteSpace: ch === ' ' ? 'pre' : 'normal',
                        margin: ch === ' ' ? '0 4px' : '0',
                      }}
                    >
                      {ch === ' ' ? '\u00A0' : ch}
                    </span>
                  ))
                : <span style={{ opacity: 0 }}>_</span>
              }
            </div>
          </div>

          {/* Bonus floaters */}
          {(bonusXP || bonusCoins) && (
            <div className="lu-bonus-wrap">
              {bonusXP && (
                <div
                  className={`lu-bonus xp${phase >= 8 ? ' on' : ''}`}
                  style={{ animationDelay: '0ms' }}
                >
                  ⚡ +{bonusXP.toLocaleString()} XP
                </div>
              )}
              {bonusCoins && (
                <div
                  className={`lu-bonus coins${phase >= 8 ? ' on' : ''}`}
                  style={{ animationDelay: '200ms' }}
                >
                  ◈ +{bonusCoins.toLocaleString()} PC
                </div>
              )}
            </div>
          )}

          {/* Continue button */}
          <button
            className={`lu-continue${phase >= 8 ? ' visible' : ''}`}
            onClick={canDismiss ? dismiss : undefined}
            style={{ pointerEvents: canDismiss ? 'auto' : 'none' }}
          >
            CONTINUAR
          </button>

        </div>
      </div>
    </>
  );
}
