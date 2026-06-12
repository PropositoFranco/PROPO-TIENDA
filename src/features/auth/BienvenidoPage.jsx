import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const TIMER_SECONDS = 5;

// ─── Detección de dispositivo de gama baja ─────────────────────────────────
function isLowEndDevice() {
  try {
    const cores = navigator.hardwareConcurrency || 2;
    const mem   = navigator.deviceMemory      || 2; // GB, si disponible
    return cores <= 4 || mem <= 2;
  } catch (_) { return false; }
}
const LOW_END = isLowEndDevice();

// ─── Shared AudioContext ───────────────────────────────────────────────────
let _sharedCtx = null;
function ac() {
  if (!_sharedCtx) _sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _sharedCtx;
}
function withAudio(fn) {
  try {
    const ctx = ac();
    if (ctx.state === 'suspended') ctx.resume().then(() => fn(ctx)).catch(() => {});
    else fn(ctx);
  } catch (_) {}
}

// ─── Code generator (fallback local) ──────────────────────────────────────
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = n => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const n2  = () => String(Math.floor(10 + Math.random() * 89));
  return `TP-${n2()}${seg(2)}-${n2()}${seg(2)}`;
}

// ─── Audio functions ───────────────────────────────────────────────────────
function playWhoosh() {
  withAudio(ctx => {
    const dur = 1.6;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate); // mono (antes stereo)
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / d.length;
      d[i] = (Math.random() * 2 - 1) * Math.pow(t, 0.3) * Math.exp(-t * 2.5) * 0.28;
    }
    const src  = ctx.createBufferSource(); src.buffer = buf;
    const lpf  = ctx.createBiquadFilter(); lpf.type = 'bandpass'; lpf.frequency.value = 350; lpf.Q.value = 0.6;
    const gain = ctx.createGain(); gain.gain.value = 0.7;
    src.connect(lpf); lpf.connect(gain); gain.connect(ctx.destination);
    src.start();
  });
}

function playLandingThud() {
  withAudio(ctx => {
    const now     = ctx.currentTime;
    const thudBuf = ctx.createBuffer(1, ctx.sampleRate * 0.55, ctx.sampleRate);
    const td      = thudBuf.getChannelData(0);
    for (let i = 0; i < td.length; i++)
      td[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04)) * 0.55;
    const thudSrc = ctx.createBufferSource(); thudSrc.buffer = thudBuf;
    const thudLP  = ctx.createBiquadFilter(); thudLP.type = 'lowpass'; thudLP.frequency.value = 140;
    thudSrc.connect(thudLP); thudLP.connect(ctx.destination); thudSrc.start(now);
    [240, 318, 480].forEach((freq, i) => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      const vol = [0.15, 0.09, 0.06][i];
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + [2.2, 1.8, 1.4][i]);
      osc.start(now); osc.stop(now + 2.5);
    });
  });
}

function playSphereClick() {
  withAudio(ctx => {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.16, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc.start(); osc.stop(ctx.currentTime + 0.6);
  });
}

function playCoinRain() {
  withAudio(ctx => {
    const now       = ctx.currentTime;
    // Gama baja: menos monedas de audio
    const coinCount = LOW_END ? 20 : 40;
    for (let i = 0; i < coinCount; i++) {
      const delay = i * 0.075 + Math.random() * 0.03;
      const f1    = 800 + Math.random() * 2400;
      const f2    = f1 * (1.4 + Math.random() * 0.5);
      [f1, f2].forEach((freq, pi) => {
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = pi === 0 ? 'triangle' : 'sine';
        osc.frequency.value = freq;
        const t   = now + delay;
        const vol = (pi === 0 ? 0.11 : 0.055) * (1 - i / coinCount * 0.45) + Math.random() * 0.025;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.006);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.10 + Math.random() * 0.18);
        osc.start(t); osc.stop(t + 0.4);
      });
    }
    [0, 0.3, 0.7, 1.1, 1.6, 2.1, 2.6, 3.0].forEach(d => {
      const freq = 1600 + Math.random() * 1200;
      const osc  = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      const t = now + d;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.09 + Math.random() * 0.04, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.start(t); osc.stop(t + 0.35);
    });
    const bowl = ctx.createOscillator(), bGain = ctx.createGain();
    bowl.connect(bGain); bGain.connect(ctx.destination);
    bowl.type = 'sine'; bowl.frequency.value = 180;
    bGain.gain.setValueAtTime(0, now);
    bGain.gain.linearRampToValueAtTime(0.06, now + 0.1);
    bGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
    bowl.start(now); bowl.stop(now + 3.2);
  });
}

function playCopySound() {
  withAudio(ctx => {
    [[1047, 0, 0.28], [1319, 0.12, 0.22]].forEach(([freq, delay, decay]) => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + decay);
      osc.start(t); osc.stop(t + decay);
    });
  });
}

function playCelebration() {
  withAudio(ctx => {
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = freq;
      const s = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.18, s + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, s + 0.45);
      osc.start(s); osc.stop(s + 0.5);
    });
  });
}

// ─── drawParticle — sin cambios visuales ──────────────────────────────────
function drawParticle(ctx, p) {
  if (p.isBill) {
    ctx.fillStyle   = p.color + '0.85)';
    ctx.strokeStyle = p.color + '0.5)';
    ctx.lineWidth   = 0.8;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-p.bw / 2, -p.bh / 2, p.bw, p.bh, 3);
    else ctx.rect(-p.bw / 2, -p.bh / 2, p.bw, p.bh);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle     = p.color + '0.5)';
    ctx.font          = `bold ${Math.round(p.bh * 0.55)}px serif`;
    ctx.textAlign     = 'center';
    ctx.textBaseline  = 'middle';
    ctx.fillText('₩', 0, 0);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, p.cr, 0, Math.PI * 2);
    ctx.fillStyle = p.color + '0.78)';
    ctx.fill();
    ctx.strokeStyle = p.color + '0.95)';
    ctx.lineWidth   = 1.5; ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, p.cr * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = p.color + '0.4)';
    ctx.lineWidth   = 0.8; ctx.stroke();
  }
}

// ─── CSS keyframes ─────────────────────────────────────────────────────────
// will-change y contain solo en animaciones activas para liberar GPU cuando no se usan
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Raleway:wght@300;400&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{width:100%;height:100%;background:#040112;overflow:hidden}
  @keyframes piggyFall{
    0%{transform:translateY(-115vh)}
    80%{transform:translateY(8px)}
    88%{transform:translateY(-18px) scaleY(1.03) scaleX(.98)}
    94%{transform:translateY(6px) scaleY(.95) scaleX(1.04)}
    97%{transform:translateY(-5px) scaleY(1.02) scaleX(.99)}
    100%{transform:translateY(0)}
  }
  @keyframes piggySway{0%,100%{transform:rotate(-1.2deg)}50%{transform:rotate(1.2deg)}}
  @keyframes hintPulse{0%,100%{opacity:.35}50%{opacity:.75}}
  @keyframes codeGlowCycle{
    0%,100%{box-shadow:0 0 0 1px rgba(212,175,55,.2)}
    50%{box-shadow:0 0 0 1px rgba(212,175,55,.45),0 0 20px rgba(212,175,55,.22)}
  }
  @keyframes goldScroll{0%{background-position:200% center}100%{background-position:0% center}}
  @keyframes phaseIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes copyBounce{0%{transform:scale(1)}40%{transform:scale(1.1)}100%{transform:scale(1)}}
  @keyframes unlockPulse{0%,100%{box-shadow:0 0 0 rgba(212,175,55,0)}50%{box-shadow:0 0 22px rgba(212,175,55,.35)}}
  @keyframes propoPulse{
    0%,100%{border-color:rgba(212,175,55,.5)}
    50%{border-color:rgba(255,220,80,.75)}
  }
  @keyframes avatarFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
  @keyframes runeFloat{0%,100%{transform:translateY(0);opacity:.06}50%{transform:translateY(-14px);opacity:.1}}
  @keyframes goldShimmer{0%{background-position:200% center}100%{background-position:0% center}}
  @keyframes checkPop{0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.15) rotate(3deg);opacity:1}100%{transform:scale(1) rotate(0deg);opacity:1}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulseRing{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,.35)}50%{box-shadow:0 0 0 14px rgba(212,175,55,0)}}
  @keyframes progressGlow{0%,100%{opacity:.8}50%{opacity:1}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

  /* Landscape: permitir scroll si el contenido no entra */
  @media (orientation:landscape) and (max-height:500px){
    html,body{overflow-y:auto}
    .fase-scroll-wrap{
      position:relative!important;
      min-height:100vh;
      overflow-y:auto;
      align-items:flex-start!important;
      padding:12px 0 24px!important;
    }
  }
`;

// ══════════════════════════════════════════════════════════════════════════
// FASE 1 — APORTE
// ══════════════════════════════════════════════════════════════════════════
function FaseAporte({ onAdvance }) {
  const moneyCanvasRef    = useRef(null);
  const piggyContainerRef = useRef(null);
  const piggyWrapRef      = useRef(null);
  const moneyRafRef       = useRef(null);
  const piggyTouchedRef   = useRef(false);
  const aporteAdvancedRef = useRef(false);

  const [landed,   setLanded]   = useState(false);
  const [falling,  setFalling]  = useState(false);
  const [showText, setShowText] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [burst,    setBurst]    = useState(false);

  const advanceFromAporte = useCallback(() => {
    if (aporteAdvancedRef.current) return;
    aporteAdvancedRef.current = true;
    if (moneyRafRef.current) cancelAnimationFrame(moneyRafRef.current);
    onAdvance();
  }, [onAdvance]);

  const startMoneyRain = useCallback(() => {
    const canvas = moneyCanvasRef.current;
    if (!canvas) return;

    // Resolución reducida en gama baja (mitad de píxeles → 4× menos carga GPU)
    const dpr = LOW_END ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';

    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.scale(dpr, dpr);

    const piggy = piggyWrapRef.current;
    if (!piggy) return;
    const rect          = piggy.getBoundingClientRect();
    const svgScale      = rect.width / 300;
    const leftCableX    = rect.left + 112 * svgScale;
    const rightCableX   = rect.left + 188 * svgScale;
    const cableWidth    = rightCableX - leftCableX;
    const slotX         = rect.left + 150 * svgScale;
    const slotY         = rect.top  + 62  * svgScale;
    const absorptionRadius = cableWidth * 0.55;

    const absorptions = [];
    const particles   = [];
    // Gama baja: menos partículas → animación más fluida
    const spawnCount  = LOW_END ? 22 : 40;

    for (let i = 0; i < spawnCount; i++) {
      const isBill = Math.random() > 0.45;
      const spawnX = leftCableX + Math.random() * cableWidth;
      const spawnY = -30 - Math.random() * window.innerHeight * 0.85;
      const vx     = (Math.random() - 0.5) * 1.2;
      const vy     = 1.5 + Math.random() * 2.8;
      particles.push({
        x: spawnX, y: spawnY, vx, vy,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 6,
        alpha: 1, dead: false,
        delay: i * (LOW_END ? 100 : 75), startTime: null,
        isBill,
        bw: isBill ? 28 + Math.random() * 16 : 0,
        bh: isBill ? 15 + Math.random() * 7  : 0,
        cr: isBill ? 0 : 6 + Math.random() * 6,
        absorbing: false, absorbT: 0,
        color: isBill
          ? `rgba(${80  + Math.floor(Math.random() * 30)},${175 + Math.floor(Math.random() * 30)},${70  + Math.floor(Math.random() * 20)},`
          : `rgba(${200 + Math.floor(Math.random() * 55)},${155 + Math.floor(Math.random() * 55)},${30  + Math.floor(Math.random() * 30)},`,
      });
    }

    const startMs  = performance.now();
    const gravity  = 0.14;
    let soundFired = false;
    // Throttle: en gama baja renderiza 1 de cada 2 frames (30fps)
    let frameCount = 0;

    function draw(now) {
      frameCount++;
      if (LOW_END && frameCount % 2 !== 0) {
        moneyRafRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      let allDone = true;

      for (let i = absorptions.length - 1; i >= 0; i--) {
        const f = absorptions[i];
        f.t += 0.07;
        if (f.t >= 1) { absorptions.splice(i, 1); continue; }
        const r = f.r * (1 - f.t);
        const a = (1 - f.t) * 0.7;
        ctx.save();
        ctx.globalAlpha  = a;
        ctx.strokeStyle  = `rgba(212,175,55,${a})`;
        ctx.lineWidth    = 1.5;
        ctx.beginPath();
        ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      particles.forEach(p => {
        if (p.dead) return;
        if (p.startTime === null) {
          if (now - startMs < p.delay) { allDone = false; return; }
          p.startTime = now;
          if (!soundFired) {
            soundFired = true;
            setTimeout(playCoinRain, 1300);
            setTimeout(advanceFromAporte, 1300 + 3400);
          }
        }
        allDone = false;
        if (p.absorbing) {
          p.absorbT += 0.1;
          if (p.absorbT >= 1) { p.dead = true; return; }
          const shrink = 1 - p.absorbT;
          const ax = p.x + (slotX - p.x) * p.absorbT;
          const ay = p.y + (slotY - p.y) * p.absorbT;
          ctx.save();
          ctx.globalAlpha = (1 - p.absorbT) * 0.9;
          ctx.translate(ax, ay);
          ctx.scale(shrink, shrink);
          drawParticle(ctx, p);
          ctx.restore();
          return;
        }
        p.vy += gravity;
        p.vx += (slotX - p.x) * 0.0003;
        p.x   = Math.max(leftCableX - 4, Math.min(rightCableX + 4, p.x + p.vx));
        p.y  += p.vy;
        p.rot += p.rotSpeed;
        const dx = p.x - slotX, dy = p.y - slotY;
        if (Math.sqrt(dx * dx + dy * dy) < absorptionRadius || p.y >= slotY) {
          p.absorbing = true;
          absorptions.push({ x: slotX, y: slotY, r: absorptionRadius * 1.4, t: 0 });
          return;
        }
        if (p.y > window.innerHeight + 60) { p.dead = true; return; }
        const a = Math.min(1, p.alpha * (1 - Math.max(0, (p.y - window.innerHeight * 0.75) / (window.innerHeight * 0.25))));
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        drawParticle(ctx, p);
        ctx.restore();
      });

      if (!allDone) moneyRafRef.current = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }
    moneyRafRef.current = requestAnimationFrame(draw);
  }, [advanceFromAporte]);

  useEffect(() => {
    const FALL_DURATION = 1900;
    const t1 = setTimeout(() => { playWhoosh(); setFalling(true); }, 200);
    const t2 = setTimeout(startMoneyRain, FALL_DURATION - 800);
    const t3 = setTimeout(() => {
      setLanded(true);
      playLandingThud();
      setTimeout(() => { setShowText(true); setShowHint(true); }, 400);
    }, FALL_DURATION + 200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [startMoneyRain]);

  const handlePiggyTap = useCallback(() => {
    if (piggyTouchedRef.current || !landed) return;
    piggyTouchedRef.current = true;
    playSphereClick();
    setBurst(true);
    setShowHint(false);
    setTimeout(advanceFromAporte, 900);
  }, [landed, advanceFromAporte]);

  return (
    <div
      className="fase-scroll-wrap"
      style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 50% 55%,rgba(180,130,20,.22) 0%,rgba(4,1,18,1) 70%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Cinzel',serif", userSelect: 'none', zIndex: 100,
        // Activar compositing en GPU solo para esta capa
        willChange: 'transform',
      }}
    >
      <canvas
        ref={moneyCanvasRef}
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5 }}
      />
      <div
        ref={piggyContainerRef}
        style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          transform: falling ? undefined : 'translateY(-115vh)',
          animation: falling ? 'piggyFall 1.9s cubic-bezier(.22,1,.36,1) forwards' : undefined,
          // Promueve a capa GPU solo durante la animación
          willChange: falling ? 'transform' : 'auto',
        }}
      >
        <div
          ref={piggyWrapRef}
          id="piggy-wrap"
          onClick={handlePiggyTap}
          onTouchEnd={e => { e.preventDefault(); handlePiggyTap(); }}
          style={{
            cursor: 'pointer',
            // Un solo drop-shadow en gama baja (vs dos en alta)
            filter: burst
              ? 'drop-shadow(0 0 55px rgba(255,220,80,.65))'
              : LOW_END
                ? 'drop-shadow(0 0 32px rgba(212,175,55,.35))'
                : 'drop-shadow(0 0 40px rgba(212,175,55,.35)) drop-shadow(0 0 80px rgba(180,130,20,.2))',
            transition: 'filter .3s ease',
            WebkitTapHighlightColor: 'transparent',
            animation: landed ? 'piggySway 4s ease-in-out infinite' : undefined,
            transformOrigin: landed ? 'center top' : undefined,
            willChange: landed ? 'transform' : 'auto',
          }}
        >
          {/* SVG alcancía — sin cambios visuales, filtro glassBlur eliminado en gama baja */}
          <svg
            viewBox="0 0 300 310"
            width="clamp(180px,38vw,260px)"
            style={{ overflow: 'visible', display: 'block' }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="bodyGlow" cx="50%" cy="45%" r="52%">
                <stop offset="0%"   stopColor="rgba(255,210,80,0.22)" />
                <stop offset="50%"  stopColor="rgba(200,150,30,0.1)" />
                <stop offset="100%" stopColor="rgba(100,60,0,0.03)" />
              </radialGradient>
              <radialGradient id="innerLight" cx="50%" cy="60%" r="45%">
                <stop offset="0%"   stopColor="rgba(255,200,60,0.35)" />
                <stop offset="70%"  stopColor="rgba(180,130,20,0.12)" />
                <stop offset="100%" stopColor="rgba(60,30,0,0.0)" />
              </radialGradient>
              {/* glassBlur solo en gama alta */}
              {!LOW_END && (
                <filter id="glassBlur">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
                </filter>
              )}
            </defs>
            <line x1="112" y1="58" x2="88" y2="-800" stroke="rgba(180,150,60,0.45)" strokeWidth="2" strokeLinecap="round" />
            <line x1="188" y1="58" x2="212" y2="-800" stroke="rgba(180,150,60,0.45)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="150" cy="185" r="128" fill="url(#bodyGlow)" stroke="rgba(212,175,55,0.45)" strokeWidth="2.5" />
            <circle cx="150" cy="185" r="124" fill="url(#innerLight)" />
            <rect x="90" y="155" width="36" height="20" rx="3" fill="rgba(80,175,70,0.28)" stroke="rgba(80,165,65,0.4)" strokeWidth="0.8" transform="rotate(-14 90 155)" />
            <rect x="120" y="165" width="32" height="18" rx="3" fill="rgba(85,170,68,0.25)" stroke="rgba(80,165,65,0.35)" strokeWidth="0.8" transform="rotate(9 120 165)" />
            <text x="108" y="168" fontFamily="serif" fontSize="10" fill="rgba(50,140,50,0.5)" transform="rotate(-14 108 168)">₩10,000</text>
            <text x="140" y="178" fontFamily="serif" fontSize="9"  fill="rgba(50,130,50,0.45)" transform="rotate(9 140 178)">₩10,000</text>
            <circle cx="108" cy="255" r="14" fill="rgba(212,175,55,0.38)" stroke="rgba(212,175,55,0.6)"   strokeWidth="1.8" />
            <text x="108" y="259" textAnchor="middle" fontFamily="serif" fontSize="9" fill="rgba(180,140,30,0.7)">₩</text>
            <circle cx="150" cy="265" r="12" fill="rgba(212,175,55,0.32)" stroke="rgba(212,175,55,0.55)"  strokeWidth="1.5" />
            <circle cx="185" cy="257" r="11" fill="rgba(200,165,50,0.3)"  stroke="rgba(200,165,50,0.52)"  strokeWidth="1.5" />
            <circle cx="125" cy="145" r="8"  fill="rgba(212,175,55,0.2)"  stroke="rgba(212,175,55,0.38)"  strokeWidth="1.2" />
            <circle cx="172" cy="148" r="7"  fill="rgba(212,175,55,0.18)" stroke="rgba(212,175,55,0.35)"  strokeWidth="1.2" />
            {/* Destellos con blur solo en gama alta */}
            {!LOW_END && <>
              <circle cx="96"  cy="235" r="6"   fill="rgba(255,220,100,0.5)" filter="url(#glassBlur)" />
              <circle cx="200" cy="242" r="5"   fill="rgba(255,210,80,0.45)" filter="url(#glassBlur)" />
              <circle cx="148" cy="210" r="4"   fill="rgba(255,240,140,0.4)" filter="url(#glassBlur)" />
              <circle cx="80"  cy="180" r="3"   fill="rgba(255,200,80,0.35)" filter="url(#glassBlur)" />
              <circle cx="218" cy="175" r="3.5" fill="rgba(255,200,80,0.35)" filter="url(#glassBlur)" />
            </>}
            {/* En gama baja: destellos simples sin blur */}
            {LOW_END && <>
              <circle cx="96"  cy="235" r="6"   fill="rgba(255,220,100,0.45)" />
              <circle cx="200" cy="242" r="5"   fill="rgba(255,210,80,0.4)" />
              <circle cx="148" cy="210" r="4"   fill="rgba(255,240,140,0.35)" />
            </>}
            <circle cx="150" cy="185" r="128" fill="none" stroke="rgba(255,230,100,0.07)" strokeWidth="14" />
            <ellipse cx="100" cy="128" rx="38" ry="22" fill="rgba(255,255,255,0.065)" transform="rotate(-32 100 128)" />
            <ellipse cx="88"  cy="115" rx="18" ry="9"  fill="rgba(255,255,255,0.09)"  transform="rotate(-32 88 115)" />
            <ellipse cx="210" cy="255" rx="24" ry="13" fill="rgba(255,220,80,0.05)"   transform="rotate(18 210 255)" />
            <ellipse cx="150" cy="72"  rx="52" ry="16" fill="rgba(15,10,2,0.75)"   stroke="rgba(200,165,50,0.55)" strokeWidth="2" />
            <ellipse cx="150" cy="60"  rx="52" ry="16" fill="rgba(30,20,5,0.88)"   stroke="rgba(212,175,55,0.65)" strokeWidth="2.2" />
            <ellipse cx="150" cy="60"  rx="48" ry="13" fill="none"                 stroke="rgba(180,145,40,0.3)"  strokeWidth="1" />
            <circle  cx="150" cy="60"  r="8"           fill="rgba(180,145,40,0.35)" stroke="rgba(212,175,55,0.5)" strokeWidth="1.5" />
            <circle  cx="150" cy="60"  r="4"           fill="rgba(212,175,55,0.4)" />
            <ellipse cx="122" cy="60"  rx="14" ry="9"  fill="rgba(2,1,0,0.92)"     stroke="rgba(150,120,35,0.55)" strokeWidth="1.5" />
            <ellipse cx="119" cy="57"  rx="5"  ry="3"  fill="rgba(255,220,80,0.08)" />
            <ellipse cx="178" cy="60"  rx="14" ry="9"  fill="rgba(2,1,0,0.92)"     stroke="rgba(150,120,35,0.55)" strokeWidth="1.5" />
            <ellipse cx="175" cy="57"  rx="5"  ry="3"  fill="rgba(255,220,80,0.08)" />
            <circle  cx="105" cy="60"  r="4"           fill="rgba(180,145,40,0.4)"  stroke="rgba(212,175,55,0.45)" strokeWidth="1" />
            <circle  cx="195" cy="60"  r="4"           fill="rgba(180,145,40,0.4)"  stroke="rgba(212,175,55,0.45)" strokeWidth="1" />
            <circle  cx="150" cy="46"  r="3"           fill="rgba(180,145,40,0.35)" stroke="rgba(212,175,55,0.4)"  strokeWidth="1" />
            <ellipse cx="150" cy="312" rx="72" ry="12" fill="rgba(180,145,40,0.12)" stroke="rgba(180,145,40,0.28)" strokeWidth="1.5" />
            <ellipse cx="150" cy="315" rx="60" ry="8"  fill="rgba(10,6,1,0.6)"      stroke="rgba(150,120,30,0.25)" strokeWidth="1" />
            <path d="M95 310 Q88 320 92 325 L110 325 Q105 318 108 310Z"  fill="rgba(150,120,35,0.3)" stroke="rgba(180,145,40,0.4)" strokeWidth="1" />
            <path d="M205 310 Q212 320 208 325 L190 325 Q195 318 192 310Z" fill="rgba(150,120,35,0.3)" stroke="rgba(180,145,40,0.4)" strokeWidth="1" />
            <path d="M143 312 Q140 322 143 326 L157 326 Q160 322 157 312Z" fill="rgba(150,120,35,0.3)" stroke="rgba(180,145,40,0.4)" strokeWidth="1" />
          </svg>
        </div>
      </div>

      <div style={{
        textAlign: 'center', padding: '0 28px', marginTop: '16px',
        opacity: showText ? 1 : 0, transition: 'opacity .7s ease',
        zIndex: 10, position: 'relative',
      }}>
        <div style={{
          fontSize: 'clamp(17px,3.8vw,24px)', fontWeight: 700,
          background: 'linear-gradient(135deg,#f0c040,#d4af37,#fff8dc,#d4af37)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          marginBottom: 6, letterSpacing: '.04em',
        }}>Tu aporte fue recibido</div>
        <div style={{
          fontFamily: "'Raleway',sans-serif", fontWeight: 300,
          fontSize: 'clamp(11px,2vw,14px)', color: 'rgba(200,185,240,.6)',
          letterSpacing: '.04em', lineHeight: 1.5,
        }}>Tu contribución ya fue agregada al fondo de apoyo</div>
      </div>

      <div style={{
        marginTop: 16, fontFamily: "'Raleway',sans-serif", fontSize: 10,
        color: 'rgba(212,175,55,.5)', letterSpacing: 3, zIndex: 10, position: 'relative',
        opacity: showHint ? 1 : 0, transition: 'opacity .5s ease',
        animation: showHint ? 'hintPulse 2s ease-in-out infinite' : undefined,
      }}>· · · toca la alcancía · · ·</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FASE 2 — CÓDIGO
// ══════════════════════════════════════════════════════════════════════════
function FaseCodigo({ onAdvance, userCode, codeLoading, codeError }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!userCode) return;
    try { await navigator.clipboard.writeText(userCode); }
    catch (_) {
      const el = document.createElement('textarea');
      el.value = userCode; el.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(el); el.focus(); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    playCopySound();
    setCopied(true);
  };

  const handleContinue = () => { if (!copied) return; onAdvance(); };

  return (
    <div
      className="fase-scroll-wrap"
      style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 50% 30%,rgba(124,58,237,.28) 0%,rgba(4,1,18,1) 68%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Cinzel',serif", zIndex: 100, padding: 16, overflowY: 'auto',
      }}
    >
      <div style={{
        maxWidth: 480, width: '100%',
        background: 'linear-gradient(148deg,rgba(124,58,237,.13) 0%,rgba(8,3,26,.97) 50%,rgba(2,0,10,.99) 100%)',
        border: '1px solid rgba(212,175,55,.38)', borderRadius: 24,
        padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,36px)',
        textAlign: 'center',
        boxShadow: '0 30px 70px rgba(124,58,237,.28),inset 0 1px 0 rgba(212,175,55,.15)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '12%', width: '76%', height: 1, background: 'linear-gradient(to right,transparent,rgba(212,175,55,.55),transparent)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '12%', width: '76%', height: 1, background: 'linear-gradient(to right,transparent,rgba(124,58,237,.5),transparent)' }} />

        {/* Avatar */}
        <div style={{ width: 66, height: 66, margin: '0 auto 14px', animation: 'avatarFloat 3.5s ease-in-out infinite,phaseIn .65s ease .1s both', willChange: 'transform' }}>
          <svg viewBox="0 0 76 76" style={{ width: '100%', height: '100%' }}>
            <defs>
              <radialGradient id="avatarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="rgba(124,58,237,0.2)" />
                <stop offset="100%" stopColor="rgba(4,1,18,0)" />
              </radialGradient>
            </defs>
            <circle cx="38" cy="38" r="37" fill="url(#avatarGlow)" stroke="rgba(212,175,55,0.22)" strokeWidth="1" />
            <circle cx="38" cy="24" r="11" fill="rgba(160,140,210,0.22)" />
            <path d="M16 66 C16 50 27 42 38 42 C49 42 60 50 60 66 Z" fill="rgba(160,140,210,0.18)" />
            <text x="38" y="30" textAnchor="middle" dominantBaseline="middle"
              fill="rgba(212,175,55,0.45)" fontSize="13" fontFamily="Georgia,serif" fontStyle="italic">?</text>
          </svg>
        </div>

        <div style={{ fontSize: 8, letterSpacing: 4, color: 'rgba(212,175,55,.45)', marginBottom: 4, animation: 'phaseIn .65s ease .2s both' }}>
          ÉSTA ES TU CONTRASEÑA ÚNICA DE ACCESO A LA
        </div>
        <div style={{ fontSize: 'clamp(9px,1.8vw,11px)', letterSpacing: 5, color: 'rgba(200,185,240,.5)', marginBottom: 14, animation: 'phaseIn .65s ease .3s both' }}>
          PROPOTIENDA
        </div>

        {/* Code box */}
        <div style={{
          background: 'rgba(0,0,0,.55)', border: '1px solid rgba(212,175,55,.35)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          animation: 'codeGlowCycle 3s ease-in-out infinite,phaseIn .65s ease .4s both', flexWrap: 'wrap',
        }}>
          {codeLoading && (
            <div style={{ flex: 1, textAlign: 'center', color: 'rgba(212,175,55,.5)', fontSize: 13 }}>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: 8 }}>⟳</span>
              Generando tu código…
            </div>
          )}
          {!codeLoading && codeError && (
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{
                fontSize: 'clamp(16px,3.5vw,22px)', fontWeight: 700, letterSpacing: '.14em',
                fontFamily: "'Courier New',monospace",
                background: 'linear-gradient(130deg,#f0c040 0%,#d4af37 38%,#fff8dc 55%,#d4af37 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                animation: 'goldScroll 3s linear infinite',
              }}>{userCode}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,100,100,.6)', marginTop: 4, letterSpacing: 1 }}>
                ⚠ código local — guárdalo y contáctanos si hay problema
              </div>
            </div>
          )}
          {!codeLoading && !codeError && userCode && (
            <div style={{
              fontSize: 'clamp(16px,3.5vw,22px)', fontWeight: 700, letterSpacing: '.14em',
              fontFamily: "'Courier New',monospace",
              background: 'linear-gradient(130deg,#f0c040 0%,#d4af37 38%,#fff8dc 55%,#d4af37 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              animation: 'goldScroll 3s linear infinite', flex: 1, textAlign: 'left', minWidth: 130,
            }}>{userCode}</div>
          )}
          <button
            onClick={handleCopy}
            disabled={codeLoading || !userCode}
            style={{
              padding: '8px 16px', borderRadius: 8,
              background: copied ? 'rgba(74,222,128,.18)' : 'rgba(212,175,55,.14)',
              border: copied ? '1px solid rgba(74,222,128,.5)' : '1px solid rgba(212,175,55,.4)',
              color: copied ? '#6ee7a0' : '#d4af37',
              fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: '1.5px',
              cursor: (codeLoading || !userCode) ? 'not-allowed' : 'pointer',
              opacity: (codeLoading || !userCode) ? 0.4 : 1,
              transition: 'all .35s ease', whiteSpace: 'nowrap', flexShrink: 0,
              animation: copied ? 'copyBounce .35s ease' : undefined,
            }}
          >{copied ? '✓ COPIADO' : 'COPIAR'}</button>
        </div>

        {/* Propotienda section */}
        <div style={{
          margin: '4px 0 14px',
          background: 'linear-gradient(145deg,rgba(212,175,55,.08) 0%,rgba(180,130,0,.05) 100%)',
          border: '1.5px solid rgba(212,175,55,.5)',
          borderRadius: 16, padding: '16px 14px',
          position: 'relative', overflow: 'hidden',
          animation: 'propoPulse 3s ease-in-out infinite,phaseIn .65s ease .5s both',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(212,175,55,.18)', border: '1px solid rgba(212,175,55,.45)',
            borderRadius: 20, padding: '4px 12px', marginBottom: 12,
            fontSize: 9, letterSpacing: 3, color: 'rgba(255,220,100,.9)',
          }}>⚠️ &nbsp;ACCIÓN REQUERIDA</div>

          <p style={{
            fontFamily: "'Raleway',sans-serif", fontWeight: 400,
            fontSize: 'clamp(10px,1.9vw,12px)', color: 'rgba(200,185,240,.7)',
            lineHeight: 1.55, marginBottom: 12,
          }}>Guarda tu código — lo necesitarás para acceder a tu beneficio exclusivo como Miembro Fundador:</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 'clamp(24px,4.5vw,32px)' }}>🏪</span>
            <div style={{
              fontSize: 'clamp(20px,4.5vw,30px)', fontWeight: 900, letterSpacing: '.1em',
              background: 'linear-gradient(130deg,#ffe066 0%,#d4af37 35%,#fff8dc 55%,#d4af37 80%,#ffe066 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              animation: 'goldScroll 2.5s linear infinite',
            }}>PROPOTIENDA</div>
            <span style={{ fontSize: 'clamp(24px,4.5vw,32px)' }}>🏪</span>
          </div>

          <div style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, letterSpacing: 4, color: 'rgba(212,175,55,.5)', marginBottom: 16 }}>
            TIENDA EXCLUSIVA · SOLO FUNDADORES
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 4 }}>
            {[
              { icon: '📋', label: 'Copia el código' },
              null,
              { icon: '📱', label: 'Guárdalo ya' },
              null,
              { icon: '✨', label: 'Úsalo para acceder a la Propotienda' },
            ].map((item, i) =>
              item === null
                ? <span key={i} style={{ fontSize: 16, color: 'rgba(212,175,55,.4)', alignSelf: 'center', flexShrink: 0 }}>→</span>
                : <div key={i} style={{
                  flex: 1, maxWidth: 100,
                  background: 'rgba(0,0,0,.4)', border: '1px solid rgba(212,175,55,.2)',
                  borderRadius: 12, padding: '10px 6px', textAlign: 'center',
                }}>
                  <span style={{ fontSize: 'clamp(22px,4.5vw,28px)', display: 'block', marginBottom: 5 }}>{item.icon}</span>
                  <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: 9, letterSpacing: 1, color: 'rgba(200,185,240,.55)', display: 'block' }}>{item.label}</span>
                </div>
            )}
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          style={{
            width: '100%', padding: 13, borderRadius: 12,
            background: copied
              ? 'linear-gradient(135deg,rgba(212,175,55,.22),rgba(124,58,237,.28))'
              : 'rgba(255,255,255,.03)',
            border: copied ? '1px solid rgba(212,175,55,.52)' : '1px solid rgba(255,255,255,.07)',
            color: copied ? '#d4af37' : 'rgba(255,255,255,.2)',
            fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 3,
            cursor: copied ? 'pointer' : 'not-allowed',
            opacity: copied ? 1 : 0.5,
            transition: 'all .45s ease',
            animation: copied ? 'unlockPulse 2.2s ease-in-out infinite,phaseIn .65s ease .7s both' : 'phaseIn .65s ease .7s both',
          }}
        >{copied ? '⚡ CONTINUAR' : '🔒 COPIA TU CÓDIGO PARA CONTINUAR'}</button>
        <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '80%', height: 1, background: 'linear-gradient(to right,transparent,rgba(124,58,237,.5),transparent)' }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FASE 3 — EXPERIENCIA
// ══════════════════════════════════════════════════════════════════════════
function FaseExperiencia({ redirectUrl }) {
  const confettiCanvasRef = useRef(null);
  const [timer,   setTimer]   = useState(TIMER_SECONDS);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    // DPR limitado a 1 en gama baja
    const dpr  = LOW_END ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);

    const colors   = ['#d4af37','#f0c040','#fff8dc','#c084fc','#818cf8','#ffffff'];
    // Gama baja: 70 partículas en lugar de 120
    const count    = LOW_END ? 70 : 120;
    const W        = window.innerWidth, H = window.innerHeight;
    const ps       = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: -20 - Math.random() * 200,
      r: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3,
      angle: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.15,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));
    let raf;
    let frameCount = 0;
    const draw = () => {
      frameCount++;
      // Gama baja: 30fps en confetti
      if (LOW_END && frameCount % 2 !== 0) { raf = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, W, H);
      ps.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.angle += p.spin;
        if (p.y > H) { p.y = -10; p.x = Math.random() * W; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
        ctx.fillStyle = p.color; ctx.globalAlpha = 0.85;
        if (p.shape === 'rect') ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        else { ctx.beginPath(); ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => {
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  useEffect(() => { playCelebration(); }, []);

  useEffect(() => {
    if (timer <= 0) {
      setLeaving(true);
      setTimeout(() => { window.location.href = redirectUrl; }, 600);
      return;
    }
    const t = setTimeout(() => setTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, redirectUrl]);

  const progress = ((TIMER_SECONDS - timer) / TIMER_SECONDS) * 100;

  return (
    <div
      className="fase-scroll-wrap"
      style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at 50% 30%,rgba(124,58,237,.35) 0%,rgba(4,1,18,1) 65%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Cinzel',serif", zIndex: 90, padding: 12,
        opacity: leaving ? 0 : 1, transition: 'opacity 0.6s ease',
        overflowY: 'auto',
      }}
    >
      <canvas ref={confettiCanvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Runas decorativas — solo en gama alta */}
      {!LOW_END && [['✦','8%','12%','5s','0s'],['◈','28%','37%','5.8s','.7s'],['⬡','48%','12%','6.6s','1.4s'],['∞','68%','37%','7.4s','2.1s'],['◆','88%','12%','8.2s','2.8s']].map(([r,l,t,dur,delay],i) => (
        <div key={i} style={{
          position: 'fixed', left: l, top: t,
          fontSize: 'clamp(16px,2.5vw,28px)', color: 'rgba(212,175,55,.06)',
          pointerEvents: 'none', zIndex: 1,
          animation: `runeFloat ${dur} ease-in-out ${delay} infinite`,
        }}>{r}</div>
      ))}

      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: 500, width: '100%',
        background: 'linear-gradient(145deg,rgba(124,58,237,.18) 0%,rgba(8,3,26,.97) 50%,rgba(2,0,12,.99) 100%)',
        border: '1px solid rgba(212,175,55,.5)', borderRadius: 24,
        padding: 'clamp(24px,5vw,48px) clamp(20px,4vw,44px)',
        boxShadow: '0 30px 80px rgba(124,58,237,.35),inset 0 1px 0 rgba(212,175,55,.2)',
        textAlign: 'center',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '10%', width: '80%', height: 1, background: 'linear-gradient(to right,transparent,rgba(212,175,55,.6),transparent)' }} />

        <div style={{
          width: 76, height: 76, borderRadius: '50%', margin: '0 auto 20px',
          background: 'linear-gradient(135deg,rgba(212,175,55,.2),rgba(124,58,237,.3))',
          border: '2px solid rgba(212,175,55,.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34,
          animation: 'checkPop .7s cubic-bezier(.34,1.56,.64,1) both,pulseRing 2.5s ease-in-out .8s infinite',
          willChange: 'transform, box-shadow',
        }}>✅</div>

        <div style={{ fontSize: 8, letterSpacing: 4, color: 'rgba(212,175,55,.55)', marginBottom: 10, animation: 'fadeUp .6s ease .3s both' }}>
          — EL TEMPLO DEL PROPÓSITO —
        </div>
        <h1 style={{
          fontSize: 'clamp(18px,4vw,32px)', fontWeight: 900, lineHeight: 1.1,
          letterSpacing: '.04em', marginBottom: 16,
          background: 'linear-gradient(135deg,#f0c040 0%,#d4af37 35%,#fff8dc 55%,#d4af37 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          animation: 'goldShimmer 4s linear infinite,fadeUp .6s ease .4s both',
        }}>¡Felicidades, Miembro Fundador!</h1>
        <p style={{
          fontFamily: "'Raleway',sans-serif", fontWeight: 300,
          fontSize: 'clamp(12px,2vw,15px)', lineHeight: 1.7,
          color: 'rgba(220,210,255,.75)', marginBottom: 28,
          animation: 'fadeUp .6s ease .5s both',
        }}>
          Ya eres parte de los <span style={{ color: '#d4af37', fontWeight: 400 }}>Miembros Fundadores Oficiales</span> del Templo del Propósito.<br />
          Aprovecha cada paso para tu crecimiento. El camino comienza ahora.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, animation: 'fadeUp .6s ease .6s both' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right,transparent,rgba(212,175,55,.3))' }} />
          <span style={{ fontSize: 10, color: 'rgba(212,175,55,.4)', letterSpacing: 2 }}>◈</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left,transparent,rgba(212,175,55,.3))' }} />
        </div>
        <div style={{
          fontFamily: "'Raleway',sans-serif", fontSize: 12,
          color: 'rgba(200,185,240,.5)', letterSpacing: 1,
          marginBottom: 10, animation: 'fadeUp .6s ease .7s both',
        }}>
          Accediendo a tu comunidad en <span style={{ color: '#d4af37', fontWeight: 700, fontSize: 16 }}>{timer}</span> segundos…
        </div>
        <div style={{
          height: 4, borderRadius: 99, background: 'rgba(212,175,55,.12)',
          overflow: 'hidden', marginBottom: 18, animation: 'fadeUp .6s ease .7s both',
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(to right,#7c3aed,#d4af37)',
            width: `${progress}%`, transition: 'width 1s linear',
            animation: 'progressGlow 1s ease-in-out infinite',
          }} />
        </div>
        <button
          onClick={() => { window.location.href = redirectUrl; }}
          style={{
            width: '100%', padding: 13, borderRadius: 12,
            background: 'linear-gradient(135deg,rgba(212,175,55,.18),rgba(124,58,237,.2))',
            border: '1px solid rgba(212,175,55,.45)', color: '#d4af37',
            fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 3, cursor: 'pointer',
            transition: 'all .25s ease', animation: 'fadeUp .6s ease .8s both',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(212,175,55,.28),rgba(124,58,237,.35))'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(212,175,55,.18),rgba(124,58,237,.2))'; }}
        >⚔️ IR AL TEMPLO AHORA</button>
        <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '80%', height: 1, background: 'linear-gradient(to right,transparent,rgba(124,58,237,.5),transparent)' }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN — BienvenidoPage
// ══════════════════════════════════════════════════════════════════════════
export default function BienvenidoPage() {
  const [searchParams] = useSearchParams();
  const sessionId  = searchParams.get('session_id') || '';
  const refCode    = searchParams.get('ref')        || '';

  const redirectUrl = refCode
    ? `${window.location.origin}/register?ref=${refCode}`
    : `${window.location.origin}/hazloapp`;

  const [userCode,    setUserCode]    = useState(null);
  const [codeLoading, setCodeLoading] = useState(true);
  const [codeError,   setCodeError]   = useState(false);
  const [phase,       setPhase]       = useState('unlock');
  const [needsEmailRecovery, setNeedsEmailRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');

  const handleEmailRecovery = async () => {
    if (!recoveryEmail.trim()) return;
    setRecoveryLoading(true);
    setRecoveryError('');
    const { data } = await supabase
      .from('access_codes')
      .select('code')
      .eq('user_email', recoveryEmail.trim().toLowerCase())
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.code) {
      setUserCode(data.code);
      setNeedsEmailRecovery(false);
      setPhase('codigo');
    } else {
      setRecoveryError('No encontramos un código con ese email. Contacta soporte.');
    }
    setRecoveryLoading(false);
  };

  // Cargar código desde Supabase
  useEffect(() => {
    async function fetchCode() {
      if (!sessionId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from('access_codes').select('code')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1).maybeSingle();
            if (data?.code) { setUserCode(data.code); setCodeLoading(false); return; }
          }
        } catch (_) {}
        setCodeLoading(false); setNeedsEmailRecovery(true); return;
    }
      try {
        const MAX_RETRIES = 6, DELAY_MS = 1500;
        const CACHE_KEY   = `tp_code_${sessionId}`;
        const cached      = sessionStorage.getItem(CACHE_KEY);
        if (cached) { setUserCode(cached); setCodeLoading(false); return; }
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          const { data, error } = await supabase
            .from('access_codes').select('code')
            .eq('stripe_session_id', sessionId).maybeSingle();
          if (error) throw error;
          if (data?.code) {
            sessionStorage.setItem(CACHE_KEY, data.code);
            setUserCode(data.code); setCodeLoading(false); return;
          }
          if (attempt < MAX_RETRIES - 1)
            await new Promise(res => setTimeout(res, DELAY_MS));
        }
        throw new Error('Código no encontrado después de reintentos');
      } catch (err) {
        console.error('[BienvenidoPage] Error fetching code:', err);
        setUserCode(generateCode()); setCodeError(true); setCodeLoading(false);
      }
    }
    fetchCode();
  }, [sessionId]);

  // Unlock AudioContext en primer toque
  useEffect(() => {
    const unlock = () => { try { ac().resume(); } catch (_) {} };
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('touchstart',  unlock, { once: true, passive: true });
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('touchstart',  unlock);
    };
  }, []);

  if (needsEmailRecovery) return (
    <>
      <style>{globalStyles}</style>
      <div style={{
        position:'fixed',inset:0,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',
        background:'radial-gradient(ellipse at 50% 50%,rgba(20,10,50,0.98),rgba(4,1,18,1))',
        fontFamily:"'Cinzel',serif",padding:24,
      }}>
        <div style={{fontSize:40,marginBottom:20}}>🔍</div>
        <div style={{
          fontSize:'clamp(14px,3vw,20px)',fontWeight:700,letterSpacing:'.05em',
          background:'linear-gradient(135deg,#f0c040,#d4af37)',
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
          backgroundClip:'text',marginBottom:8,textAlign:'center',
        }}>Recuperar tu Código</div>
        <div style={{
          fontFamily:"'Raleway',sans-serif",fontSize:13,
          color:'rgba(200,185,240,.6)',marginBottom:28,textAlign:'center',lineHeight:1.6,
        }}>Ingresa el email con el que pagaste en Stripe</div>
        <input
          type="email"
          placeholder="tu@email.com"
          value={recoveryEmail}
          onChange={e => setRecoveryEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleEmailRecovery()}
          style={{
            width:'100%',maxWidth:340,padding:'12px 16px',borderRadius:10,
            background:'rgba(255,255,255,0.05)',border:'1px solid rgba(212,175,55,0.4)',
            color:'#f5d06e',fontFamily:"'Raleway',sans-serif",fontSize:15,
            outline:'none',marginBottom:12,textAlign:'center',
          }}
        />
        {recoveryError && (
          <div style={{color:'#ff6b6b',fontSize:12,marginBottom:12,textAlign:'center',maxWidth:300}}>
            {recoveryError}
          </div>
        )}
        <button
          onClick={handleEmailRecovery}
          disabled={recoveryLoading}
          style={{
            padding:'12px 32px',borderRadius:10,cursor:'pointer',
            background:'linear-gradient(135deg,rgba(212,175,55,.2),rgba(124,58,237,.3))',
            border:'1px solid rgba(212,175,55,.5)',color:'#d4af37',
            fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:3,
            opacity: recoveryLoading ? 0.6 : 1,
          }}
        >
          {recoveryLoading ? 'Buscando...' : '⚔️ RECUPERAR CÓDIGO'}
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{globalStyles}</style>

      {phase === 'unlock' && (
        <div
          onClick={() => setPhase('aporte')}
          onTouchEnd={e => { e.preventDefault(); setPhase('aporte'); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'radial-gradient(ellipse at 50% 50%,rgba(20,10,50,0.98) 0%,rgba(4,1,18,1) 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Cinzel',serif", cursor: 'pointer', userSelect: 'none',
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 22, animation: 'piggySway 2s ease-in-out infinite', transformOrigin: 'center', willChange: 'transform' }}>🏦</div>
          <div style={{
            fontSize: 'clamp(17px,4vw,25px)', fontWeight: 700, letterSpacing: '.06em',
            background: 'linear-gradient(135deg,#f0c040,#d4af37,#fff8dc,#d4af37)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: 10,
          }}>TEMPLO DEL PROPÓSITO</div>
          <div style={{
            fontFamily: "'Raleway',sans-serif", fontSize: 11, letterSpacing: 4,
            color: 'rgba(212,175,55,.5)', marginBottom: 28,
          }}>TOCA PARA COMENZAR</div>
          <div style={{ width: 60, height: 2, background: 'linear-gradient(to right,transparent,rgba(212,175,55,.6),transparent)' }} />
        </div>
      )}

      {phase === 'aporte' && (
        <FaseAporte onAdvance={() => setPhase('codigo')} />
      )}

      {phase === 'codigo' && (
        <FaseCodigo
          userCode={userCode}
          codeLoading={codeLoading}
          codeError={codeError}
          onAdvance={() => setPhase('experiencia')}
        />
      )}

      {phase === 'experiencia' && (
        <FaseExperiencia redirectUrl={redirectUrl} />
      )}
    </>
  );
}
