/**
 * VipRuleta.jsx
 * Ruleta épica VIP — 7 premios, 1 tiro por nivel VIP
 * 
 * Props:
 *   isVip        : boolean
 *   userLevel    : number (nivel VIP actual 1-6)
 *   userId       : string
 *   onBuyVip     : () => void
 *   onPrizeWon   : (prize) => void  — callback cuando gana
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { usePlayerStore } from '../../store/usePlayerStore';

// ─── PREMIOS ──────────────────────────────────────────────────────────────────
const PRIZES = [
  {
    id: 'nanobanana',
    name: 'NanoBanana²',
    subtitle: 'Editor de imágenes con IA',
    icon: '🍌',
    color: '#facc15',
    glow: 'rgba(250,204,21,0.9)',
    type: 'tool',
    file: 'nano-banana-v9.html',
    rarity: 'LEGENDARIO',
    rarityColor: '#ffd700',
    value: '$49 USD',
  },
  {
    id: 'xp100_a',
    name: '+100 XP & +100 Coins',
    subtitle: 'Poder + Riqueza Templaria',
    icon: '⭐',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.9)',
    type: 'both',
    amount: 100,
    coinAmount: 100,
    rarity: 'ÉLITE',
    rarityColor: '#a855f7',
    value: 'Poder + Riqueza',
  },
  {
    id: 'claude',
    name: 'Claude Showcase',
    subtitle: 'Crea sin código con IA',
    icon: '⚡',
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.9)',
    type: 'tool',
    file: 'claude_showcase_v7.html',
    rarity: 'LEGENDARIO',
    rarityColor: '#ffd700',
    value: '$39 USD',
  },
  {
    id: 'coins100_a',
    name: '+100 XP & +100 Coins',
    subtitle: 'Poder + Riqueza Templaria',
    icon: '🪙',
    color: '#d4af37',
    glow: 'rgba(212,175,55,0.9)',
    type: 'both',
    amount: 100,
    coinAmount: 100,
    rarity: 'ÉLITE',
    rarityColor: '#a855f7',
    value: 'Poder + Riqueza',
  },
  {
    id: 'perplexity',
    name: 'Perplexity Viral',
    subtitle: 'Contenido viral con IA',
    icon: '🔮',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.9)',
    type: 'tool',
    file: 'perplexity_viral_v6.html',
    rarity: 'LEGENDARIO',
    rarityColor: '#ffd700',
    value: '$29 USD',
  },
  {
    id: 'xp100_b',
    name: '+100 XP & +100 Coins',
    subtitle: 'Poder + Riqueza Templaria',
    icon: '⭐',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.9)',
    type: 'both',
    amount: 100,
    coinAmount: 100,
    rarity: 'ÉLITE',
    rarityColor: '#a855f7',
    value: 'Poder + Riqueza',
  },
  {
    id: 'supabase',
    name: 'Supabase + Claude AI',
    subtitle: 'El Núcleo Invisible',
    icon: '💎',
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.9)',
    type: 'tool',
    file: 'supabase_claude_timed.html',
    rarity: 'LEGENDARIO',
    rarityColor: '#ffd700',
    value: '$59 USD',
  },
  // 8vo slot = coins extra para que el wheel sea par
  {
    id: 'coins100_b',
    name: '+100 XP & +100 Coins',
    subtitle: 'Poder + Riqueza Templaria',
    icon: '🪙',
    color: '#d4af37',
    glow: 'rgba(212,175,55,0.9)',
    type: 'both',
    amount: 100,
    coinAmount: 100,
    rarity: 'ÉLITE',
    rarityColor: '#a855f7',
    value: 'Poder + Riqueza',
  },
];

// SFX
const SFX = {
  _ctx: null,
  _get() { if (!this._ctx) try { this._ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} return this._ctx; },
  _p(f, t='sine', d=0.12, v=0.08, delay=0) {
    try {
      const ctx = this._get(); if (!ctx) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = t; o.frequency.value = f;
      const s = ctx.currentTime + delay;
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(v, s + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, s + d);
      o.start(s); o.stop(s + d + 0.01);
    } catch {}
  },
  tick(i) { this._p(800 + i * 40, 'sine', 0.04, 0.05); },
  spin()  { [200,300,400,500].forEach((f,i) => this._p(f,'sawtooth',0.06,0.04,i*0.04)); },
  win()   { [523,659,784,1047,1319].forEach((f,i) => this._p(f,'sine',0.35,0.12,i*0.08)); },
  epic()  { [262,330,392,523,659,784,1047].forEach((f,i) => this._p(f,'sine',0.4,0.14,i*0.07)); this._p(2093,0.8,0.3,0.1,0.55); },
  lock()  { this._p(200,'triangle',0.15,0.1); this._p(150,'triangle',0.12,0.08,0.1); },
  click() { this._p(660,'triangle',0.08,0.06); },
};

// ─── WHEEL SVG ───────────────────────────────────────────────────────────────
const WheelSVG = ({ spinning, wonIds }) => {
  const cx = 140, cy = 140, r = 125, n = PRIZES.length;
  const slice = (2 * Math.PI) / n;
  return (
    <svg viewBox="0 0 280 280" style={{ width: '100%', height: '100%', filter: spinning ? `drop-shadow(0 0 28px rgba(212,175,55,0.7))` : `drop-shadow(0 0 16px rgba(212,175,55,0.35))` }}>
      <defs>
        {PRIZES.map((p, i) => (
          <radialGradient key={i} id={`rg${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={p.color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={p.color} stopOpacity="0.12" />
          </radialGradient>
        ))}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx={cx} cy={cy} r={r + 8} fill="rgba(8,3,26,0.95)" stroke="rgba(212,175,55,0.25)" strokeWidth="1.5" />
      {PRIZES.map((prize, i) => {
        const startA = i * slice - Math.PI / 2;
        const endA   = startA + slice;
        const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA);
        const x2 = cx + r * Math.cos(endA),   y2 = cy + r * Math.sin(endA);
        const midA = startA + slice / 2;
        const tx = cx + (r * 0.65) * Math.cos(midA);
        const ty = cy + (r * 0.65) * Math.sin(midA);
        const eix = cx + (r * 0.82) * Math.cos(midA);
        const eiy = cy + (r * 0.82) * Math.sin(midA);
        const iconDeg = (midA * 180 / Math.PI) + 90;
        return (
          <g key={i}>
            <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`} fill={`url(#rg${i})`} stroke={prize.color} strokeWidth="0.8" strokeOpacity="0.5" />
            <line x1={cx} y1={cy} x2={x1} y2={y1} stroke="rgba(212,175,55,0.15)" strokeWidth="0.5" />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="18" transform={`rotate(${iconDeg}, ${tx}, ${ty})`} style={{ userSelect: 'none' }} opacity={wonIds.has(prize.id) ? 0.25 : 1}>{prize.icon}</text>
            {wonIds.has(prize.id) && (
              <g transform={`rotate(${iconDeg}, ${tx}, ${ty})`}>
                <circle cx={tx} cy={ty} r="13" fill="#052e16" opacity="0.85" />
                <circle cx={tx} cy={ty} r="13" fill="none" stroke="#4ade80" strokeWidth="2" opacity="0.9" />
                <circle cx={tx} cy={ty} r="13" fill="#4ade80" opacity="0.15" />
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="#4ade80" fontWeight="900" style={{ userSelect: 'none' }}>✓</text>
              </g>
            )}
            {prize.rarity === 'LEGENDARIO' && (
              <circle cx={eix} cy={eiy} r="4" fill="#ffd700" opacity="0.8" filter="url(#glow)" />
            )}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="1.5" strokeDasharray="4 6" />
      <circle cx={cx} cy={cy} r={r * 0.38} fill="rgba(8,3,26,0.92)" stroke="rgba(212,175,55,0.5)" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={r * 0.38} fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="0.8" strokeDasharray="3 5" style={{ animation: 'vrRingRev 12s linear infinite', transformOrigin: `${cx}px ${cy}px` }} />
      <circle cx={cx} cy={cy} r="22" fill="rgba(124,58,237,0.8)" />
      <circle cx={cx} cy={cy} r="22" fill="none" stroke="rgba(212,175,55,0.8)" strokeWidth="1.5" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="16" style={{ userSelect: 'none' }}>👑</text>
    </svg>
  );
};

export default function VipRuleta({ isVip, userLevel, userId, onBuyVip, onPrizeWon }) {
  const { addXP, addCristales } = usePlayerStore();

  const [spinning, setSpinning]       = useState(false);
const [won, setWon]                 = useState(null);
const [wonPrizes, setWonPrizes]     = useState([]);
const [spinsUsed, setSpinsUsed]     = useState(0);
const [loadingWins, setLoadingWins] = useState(true);           // tiros usados
  const [showWin, setShowWin]         = useState(false);
  const [angle, setAngle]             = useState(0);
  const [hovSpin, setHovSpin]         = useState(false);
  const [particles, setParticles]     = useState([]);
  const [tickIdx, setTickIdx]         = useState(0);
  const [pendingPrize, setPendingPrize] = useState(null);
  const [showContent, setShowContent]   = useState(null);
  const [contentHtml, setContentHtml] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const wheelRef    = useRef(null);
  const rafRef      = useRef(null);
  const tickRef     = useRef(0);
  const angleRef    = useRef(0);
  const wheelDomRef = useRef(null);

  const spinsAvailable = isVip ? Math.max(0, userLevel - spinsUsed) : 0;

  // ── Cargar tiros usados desde Supabase ──────────────────────────────────────
  useEffect(() => {
    if (!userId || !isVip) {
      setLoadingWins(false);
      return;
    }
    setLoadingWins(true);
    supabase.from('vip_ruleta_wins').select('id, prize_id, prize_name, prize_type, file_name, created_at, source')
      .eq('user_id', userId).order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setSpinsUsed(data.filter(d => d.source === 'vip_level').length);
          setWonPrizes(data);
        }
        setLoadingWins(false);
      });
  }, [userId, isVip]);

  // ── Persistir premio cuando termina animación ────────────────────────────────
  useEffect(() => {
    if (!pendingPrize || !userId) return;
    const prize = pendingPrize;
    setPendingPrize(null);

    const persist = async () => {
      await supabase.from('vip_ruleta_wins').insert({
        user_id:    userId,
        prize_id:   prize.id,
        prize_name: prize.name,
        prize_type: prize.type,
        file_name:  prize.file || null,
      });

      if (prize.type === 'xp')   await addXP(prize.amount);
      if (prize.type === 'coins') await addCristales(prize.amount);
      if (prize.type === 'both') {
        await addXP(prize.amount);
        await addCristales(prize.coinAmount);
      }

      setSpinsUsed(s => s + 1);
      setWonPrizes(prev => [{ prize_id: prize.id, prize_name: prize.name, prize_type: prize.type, file_name: prize.file }, ...prev]);
      setWon(prize);

      const pts = Array.from({ length: 24 }, (_, i) => ({
        id: i, angle: (i / 24) * 360,
        dist: 60 + Math.random() * 80,
        size: 4 + Math.random() * 8,
        color: [prize.color, '#d4af37', '#fff', '#a855f7'][i % 4],
        delay: Math.random() * 0.3,
      }));
      setParticles(pts);
      setTimeout(() => setParticles([]), 1200);

      if (prize.type === 'tool') SFX.epic();
      else SFX.win();

      setTimeout(() => setShowWin(true), 400);
      if (onPrizeWon) onPrizeWon(prize);
    };

    persist();
  }, [pendingPrize, userId]);

  // ── Girar la ruleta ─────────────────────────────────────────────────────────
  const spin = useCallback(async () => {
    if (!isVip || spinning || spinsAvailable <= 0) return;
    SFX.spin();
    setSpinning(true);
    setWon(null);

    // IDs ya ganados
    const wonIds = new Set(wonPrizes.map(w => w.prize_id));

    // Premios disponibles (no repetir)
    const available = PRIZES.map((p, i) => ({ p, i })).filter(({ p }) => !wonIds.has(p.id));

    let prizeIdx;
    const isFirstSpin = spinsUsed === 0;

    if (isFirstSpin) {
      // Primera tirada: herramienta garantizada entre las disponibles
      const toolPrizes = available.filter(({ p }) => p.type === 'tool');
      const pool = toolPrizes.length > 0 ? toolPrizes : available;
      prizeIdx = pool[Math.floor(Math.random() * pool.length)].i;
    } else {
      // Siguientes: aleatorio entre los no ganados
      if (available.length === 0) {
        setSpinning(false);
        return;
      }
      prizeIdx = available[Math.floor(Math.random() * available.length)].i;
    }

    const prize = PRIZES[prizeIdx];

    // Calcular ángulo final: mínimo 5 vueltas + posición del premio
    const sliceAngle = 360 / PRIZES.length;
    const targetAngle = angle + 360 * (5 + Math.floor(Math.random() * 3)) + (360 - prizeIdx * sliceAngle - sliceAngle / 2);

    // Animar
    const start     = performance.now();
    const duration  = 4200 + Math.random() * 800;
    const startAngle = angle;
    let lastTick    = 0;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startAngle + (targetAngle - startAngle) * ease;

      // Mover el DOM directo sin re-render
      if (wheelDomRef.current) {
        wheelDomRef.current.style.transform = `rotate(${current}deg)`;
      }
      angleRef.current = current;

      // Tick sound — throttle a cada 3 frames en móvil
      const speed = (targetAngle - startAngle) * (1 - Math.pow(1 - progress, 2)) / duration;
      const tickInterval = Math.max(80, 400 - speed * 8000);
      if (now - lastTick > tickInterval) {
        SFX.tick(Math.floor(progress * 8));
        lastTick = now;
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        angleRef.current = targetAngle % 360;
        setAngle(targetAngle % 360);
        setSpinning(false);
        setPendingPrize(prize);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [isVip, spinning, spinsAvailable, angle]);

  

  // ── Cargar herramienta desde Storage ────────────────────────────────────────
  const openTool = async (fileName) => {
    const header = document.querySelector('[data-topbar]');
    if (header) header.style.display = 'none';
    setLoadingContent(true);
    setShowContent(fileName);
    try {
      const { data, error } = await supabase.storage.from('academy-modules').createSignedUrl(fileName, 3600);
      if (error) throw error;
      const res = await fetch(data.signedUrl);
      const text = await res.text();
      setContentHtml(text);
    } catch (err) {
      setContentHtml(`<div style="color:white;padding:40px;font-family:sans-serif;text-align:center"><h2>⚠ Error al cargar</h2><p>${err.message}</p></div>`);
    } finally {
      setLoadingContent(false);
    }
  };

  // ── MODO: ver herramienta ganada (iframe fullscreen) ─────────────────────────
  if (showContent) {
    const toolPrize = PRIZES.find(p => p.file === showContent);
    return (
      <div style={{ position: 'fixed', inset: 0, top: '0px', zIndex: 99999, background: '#000', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: 'linear-gradient(90deg,rgba(8,3,26,0.99),rgba(22,8,55,0.99))', borderBottom: `1px solid ${toolPrize?.color || '#d4af37'}55`, flexShrink: 0 }}>
          <button onClick={() => { const header = document.querySelector('[data-topbar]'); if (header) header.style.display = 'flex'; setShowContent(null); setContentHtml(null); }} style={{ padding: '6px 14px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: "'Cinzel',serif", fontSize: '8px', letterSpacing: '1.5px', cursor: 'pointer' }}>← VOLVER</button>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: '11px', letterSpacing: '2px', color: toolPrize?.color || '#d4af37', textShadow: `0 0 12px ${toolPrize?.glow || 'rgba(212,175,55,0.8)'}` }}>{toolPrize?.icon} {toolPrize?.name}</div>
          <div style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: '100px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.4)', fontFamily: "'Cinzel',serif", fontSize: '7px', letterSpacing: '2px', color: '#ffd700' }}>💎 EXCLUSIVO VIP</div>
        </div>
        {loadingContent
          ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#02000c', flexDirection: 'column', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', border: `3px solid ${toolPrize?.color || '#d4af37'}33`, borderTopColor: toolPrize?.color || '#d4af37', borderRadius: '50%', animation: 'vrSpin 0.8s linear infinite' }} />
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: '9px', letterSpacing: '3px', color: 'rgba(212,175,55,0.5)' }}>CARGANDO HERRAMIENTA</div>
              <style>{`@keyframes vrSpin { to { transform: rotate(360deg); } }`}</style>
            </div>
          : <iframe srcDoc={contentHtml} title={toolPrize?.name} style={{ flex: 1, border: 'none', width: '100%' }} allowFullScreen />
        }
      </div>
    );
  }

  // ── RENDER PRINCIPAL ──────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes vrSpin    { to { transform: rotate(360deg); } }
        @keyframes vrRingRev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes vrFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes vrPulse   { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes vrPop     { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes vrShake   { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }
        @keyframes vrGold    { 0%{background-position:200% center} 100%{background-position:0% center} }
        @keyframes vrSweep   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes vrBurst   { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(var(--bx),var(--by)) scale(0);opacity:0} }
        @keyframes vrCrown   { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-5px) scale(1.08)} }
        @keyframes vrUnlock  { 0%{transform:scale(0.3) rotate(-20deg);opacity:0} 60%{transform:scale(1.2) rotate(5deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes vrRing    { from{transform:scale(1);opacity:0.6} to{transform:scale(2.5);opacity:0} }
        @keyframes vrWinSlide { from{transform:translateY(40px) scale(0.9);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
        @keyframes vrLockPulse { 0%,100%{box-shadow:0 0 20px rgba(124,58,237,0.3)} 50%{box-shadow:0 0 40px rgba(124,58,237,0.7),0 0 80px rgba(212,175,55,0.2)} }
        @keyframes vrTickle  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
      `}</style>

      {/* ── PARTÍCULAS DE VICTORIA ── */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'fixed',
          top: '50%', left: '50%',
          width: `${p.size}px`, height: `${p.size}px`,
          borderRadius: '50%',
          background: p.color,
          boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          '--bx': `${Math.cos(p.angle * Math.PI / 180) * (p.dist + 40)}px`,
          '--by': `${Math.sin(p.angle * Math.PI / 180) * (p.dist + 40)}px`,
          animation: `vrBurst 0.9s ease-out ${p.delay}s both`,
          marginLeft: `-${p.size / 2}px`, marginTop: `-${p.size / 2}px`,
          pointerEvents: 'none', zIndex: 99998,
        }} />
      ))}

      {/* ── MODAL DE VICTORIA ── */}
      {showWin && won && (
        <div onClick={() => setShowWin(false)} style={{ position: 'fixed', top: '75px', left: 0, right: 0, bottom: 0, zIndex: 99997, background: 'rgba(2,0,12,0.95)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', cursor: 'pointer' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '400px', width: '100%', maxHeight: 'calc(100dvh - 107px)', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', borderRadius: '24px', background: `linear-gradient(155deg, ${won.color}18 0%, rgba(8,3,26,0.99) 50%, rgba(2,0,12,1) 100%)`, border: `1.5px solid ${won.color}`, padding: 'clamp(16px,3vw,32px)', textAlign: 'center', boxShadow: `0 0 80px ${won.glow}, 0 0 160px ${won.glow.replace('0.9','0.3')}`, animation: 'vrWinSlide 0.5s cubic-bezier(0.34,1.2,0.64,1)', cursor: 'default' }}>

            {/* Shimmer */}
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,transparent,${won.color}0a 50%,transparent)`, backgroundSize: '200% 200%', animation: 'vrSweep 3s ease-in-out infinite', pointerEvents: 'none' }} />

            {/* Rings expandiéndose */}
            {[1, 2].map(i => <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: `${i * 120}px`, height: `${i * 120}px`, borderRadius: '50%', border: `1px solid ${won.color}44`, transform: 'translate(-50%,-50%)', animation: `vrRing ${1.5 + i * 0.5}s ease-out ${i * 0.3}s infinite`, pointerEvents: 'none' }} />)}

            {/* Corner runes */}
            {['◈','✦','◆','⬡'].map((r, i) => <div key={i} style={{ position: 'absolute', top: i < 2 ? '14px' : 'auto', bottom: i >= 2 ? '14px' : 'auto', left: i % 2 === 0 ? '16px' : 'auto', right: i % 2 !== 0 ? '16px' : 'auto', fontFamily: "'Cinzel',serif", fontSize: '11px', color: won.color, opacity: 0.3, animation: `vrPulse ${2 + i * 0.4}s ease-in-out ${i * 0.3}s infinite` }}>{r}</div>)}

            {/* Top line */}
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px', background: `linear-gradient(90deg,transparent,${won.color},#fff,${won.color},transparent)`, borderRadius: '0 0 999px 999px', animation: 'vrPulse 2.5s ease-in-out infinite' }} />

            {/* Ícono principal */}
            <div style={{ fontSize: 'clamp(52px,10vw,72px)', marginBottom: '12px', animation: 'vrUnlock 0.6s cubic-bezier(0.34,1.3,0.64,1)', filter: `drop-shadow(0 0 24px ${won.glow}) drop-shadow(0 0 48px ${won.glow.replace('0.9','0.5')})`, display: 'inline-block' }}>
              {won.icon}
            </div>

            {/* Rarity badge */}
            <div style={{ display: 'inline-block', padding: '4px 16px', borderRadius: '100px', background: `${won.rarityColor}22`, border: `1px solid ${won.rarityColor}`, color: won.rarityColor, fontFamily: "'Cinzel',serif", fontSize: '8px', letterSpacing: '3px', marginBottom: '14px', boxShadow: `0 0 16px ${won.rarityColor}66` }}>
              {won.type === 'tool' ? '💎 HERRAMIENTA EXCLUSIVA VIP' : `✦ ${won.rarity}`}
            </div>

            <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: 'clamp(20px,4vw,28px)', fontWeight: 900, background: `linear-gradient(135deg,${won.color} 0%,#fff8dc 50%,${won.color} 100%)`, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'vrGold 3s linear infinite', marginBottom: '6px' }}>
              ✦ {won.name} ✦
            </h2>

            <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: '12px', color: 'rgba(200,185,240,0.6)', marginBottom: '8px' }}>{won.subtitle}</p>

            {won.type === 'tool' && (
              <div style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '100px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.4)', fontFamily: "'Cinzel',serif", fontSize: '8px', color: '#4ade80', marginBottom: '20px' }}>
                💰 Valor de mercado: {won.value}
              </div>
            )}

            {won.type !== 'tool' && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '10px 20px', borderRadius: '14px', background: `${won.color}18`, border: `1px solid ${won.color}44`, fontFamily: "'Cinzel',serif", fontSize: 'clamp(20px,4vw,28px)', fontWeight: 900, color: won.color, textShadow: `0 0 20px ${won.glow}` }}>
                  +{won.amount}
                  <div style={{ fontSize: '8px', letterSpacing: '2px', color: `${won.color}88`, marginTop: '2px' }}>{won.type === 'xp' ? 'XP' : 'PROPOCOINS'}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {won.type === 'tool' && (
                <button
                  onClick={() => { setShowWin(false); openTool(won.file); SFX.click(); }}
                  style={{ padding: '12px 28px', borderRadius: '100px', background: `linear-gradient(135deg,${won.color}33,${won.color}55)`, border: `1.5px solid ${won.color}`, color: won.color, fontFamily: "'Cinzel',serif", fontSize: '10px', fontWeight: 900, letterSpacing: '2px', cursor: 'pointer', boxShadow: `0 0 30px ${won.glow}`, position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = `0 0 50px ${won.glow}`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 0 30px ${won.glow}`; }}
                >
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', backgroundSize: '200% 100%', animation: 'vrSweep 2s ease-in-out infinite' }} />
                  <span style={{ position: 'relative', zIndex: 1 }}>⚔ ABRIR AHORA</span>
                </button>
              )}
              <button onClick={() => setShowWin(false)} style={{ padding: '12px 20px', borderRadius: '100px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(200,185,240,0.5)', fontFamily: "'Cinzel',serif", fontSize: '8px', letterSpacing: '2px', cursor: 'pointer' }}>
                {won.type === 'tool' ? 'ABRIR DESPUÉS' : 'CONTINUAR'}
              </button>
            </div>

            <div style={{ marginTop: '16px', fontFamily: "'Cinzel',serif", fontSize: '7px', letterSpacing: '2px', color: 'rgba(200,185,240,0.25)' }}>
              toca fuera para cerrar
            </div>
          </div>
        </div>
      )}

      {/* ── COMPONENTE PRINCIPAL ── */}
      <div style={{ position: 'relative', width: '100%' }}>

        {/* ── NO VIP: Vista bloqueada ── */}
        {!isVip && (
          <div
            onClick={() => { onBuyVip(); SFX.lock(); }}
            style={{
              position: 'relative', borderRadius: '20px', overflow: 'hidden',
              background: 'linear-gradient(145deg,rgba(124,58,237,0.12) 0%,rgba(8,3,26,0.97) 100%)',
              border: '1px solid rgba(124,58,237,0.3)',
              padding: 'clamp(16px,3vw,24px)',
              cursor: 'pointer',
              animation: 'vrLockPulse 3s ease-in-out infinite',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.6)'; e.currentTarget.style.transform = 'scale(1.01)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {/* Blur overlay de la ruleta */}
            <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(3px)', background: 'rgba(2,0,12,0.5)', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', borderRadius: '20px' }}>
              <div style={{ fontSize: 'clamp(32px,6vw,48px)', animation: 'vrShake 2s ease-in-out infinite', filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.8))' }}>🔒</div>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 'clamp(10px,2vw,14px)', fontWeight: 900, letterSpacing: '3px', background: 'linear-gradient(135deg,#ffe87a,#d4af37,#fde68a)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'vrGold 3s linear infinite', textAlign: 'center' }}>
                RULETA VIP EXCLUSIVA
              </div>
              <div style={{ fontFamily: "'Raleway',sans-serif", fontSize: 'clamp(9px,1.5vw,11px)', color: 'rgba(200,185,240,0.6)', textAlign: 'center', maxWidth: '200px', lineHeight: 1.5 }}>
                Gana herramientas de IA que valen cientos de dólares
              </div>
              <div style={{ padding: 'clamp(8px,1.5vw,10px) clamp(16px,3vw,24px)', borderRadius: '100px', background: 'linear-gradient(135deg,#4c1d95,#7c3aed 50%,#d4af37)', color: '#fff', fontFamily: "'Cinzel',serif", fontSize: 'clamp(8px,1.5vw,10px)', fontWeight: 900, letterSpacing: '2px', boxShadow: '0 0 24px rgba(212,175,55,0.5)', animation: 'vrTickle 1.5s ease-in-out infinite' }}>
                👑 DESBLOQUEAR VIP · $9.99/MES
              </div>
            </div>

            {/* Ruleta borrosa de fondo */}
            <div style={{ opacity: 0.3, pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 'clamp(140px,30vw,200px)', height: 'clamp(140px,30vw,200px)', transform: `rotate(${angle}deg)` }}>
                <WheelSVG wonIds={new Set()} />
              </div>
            </div>
          </div>
        )}

        {/* ── VIP: Ruleta activa ── */}
        {isVip && (
          <div style={{ position: 'relative' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 'clamp(6px,1vw,7.5px)', letterSpacing: '4px', color: 'rgba(212,175,55,0.5)', marginBottom: '3px' }}>
                  ⚔ RULETA EXCLUSIVA VIP
                </div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 'clamp(12px,2vw,16px)', fontWeight: 900, background: 'linear-gradient(135deg,#ffe87a,#d4af37,#fde68a)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'vrGold 4s linear infinite' }}>
                  GIRA & GANA
                </div>
              </div>

              {/* Tiros disponibles */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', background: spinsAvailable > 0 ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${spinsAvailable > 0 ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`, boxShadow: spinsAvailable > 0 ? '0 0 16px rgba(212,175,55,0.3)' : 'none', animation: 'none' }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 'clamp(14px,2.5vw,20px)', fontWeight: 900, color: spinsAvailable > 0 ? '#fde68a' : 'rgba(200,185,240,0.3)', textShadow: spinsAvailable > 0 ? '0 0 16px rgba(212,175,55,1)' : 'none', lineHeight: 1 }}>{spinsAvailable}</div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 'clamp(5.5px,1vw,7px)', letterSpacing: '1.5px', color: spinsAvailable > 0 ? 'rgba(212,175,55,0.8)' : 'rgba(200,185,240,0.25)', lineHeight: 1.4 }}>
                  TIRO{spinsAvailable !== 1 ? 'S' : ''}<br/>DISP.
                </div>
              </div>
            </div>

            {/* Wheel container */}
            <div style={{ display: 'flex', gap: 'clamp(12px,2vw,20px)', alignItems: 'center', flexWrap: 'wrap' }}>

              {/* La ruleta */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {/* Glow de fondo */}
                <div style={{ position: 'absolute', inset: '-20px', borderRadius: '50%', background: spinning ? 'radial-gradient(circle,rgba(212,175,55,0.15) 0%,transparent 70%)' : 'radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 70%)', transition: 'all 0.5s ease', pointerEvents: 'none' }} />

                {/* Indicador (flecha) */}
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.8))' }}>
                  <svg viewBox="0 0 20 24" width="20" height="24">
                    <polygon points="10,0 20,20 10,14 0,20" fill="#d4af37" stroke="#fde68a" strokeWidth="1" />
                  </svg>
                </div>

                {/* Wheel */}
                <div ref={wheelDomRef} style={{ width: 'clamp(160px,28vw,220px)', height: 'clamp(160px,28vw,220px)', transform: `rotate(${angle}deg)`, transition: spinning ? 'none' : 'transform 0.1s ease', willChange: 'transform' }}>
                  <WheelSVG spinning={spinning} wonIds={new Set(wonPrizes.map(w => w.prize_id))} key={wonPrizes.length} />
                </div>

                {/* Ring animado exterior */}
                <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', border: `2px solid ${spinning ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.2)'}`, animation: spinning ? 'vrSpin 1s linear infinite' : 'none', pointerEvents: 'none', transition: 'border-color 0.3s' }} />
              </div>

              {/* Panel derecho */}
              <div style={{ flex: 1, minWidth: '130px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {/* Premios lista compacta */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {PRIZES.filter(p => p.type === 'tool').map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 8px', borderRadius: '8px', background: `${p.color}08`, border: `1px solid ${p.color}22` }}>
                      <span style={{ fontSize: '14px', flexShrink: 0 }}>{p.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 'clamp(7px,1.2vw,9px)', fontWeight: 700, color: p.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        {p.type === 'tool' && <div style={{ fontFamily: "'Cinzel',serif", fontSize: '6px', color: 'rgba(255,215,0,0.5)', letterSpacing: '1px' }}>💰 {p.value}</div>}
                      </div>
                    </div>
                  ))}
                  {PRIZES.filter(p => p.type !== 'tool').map((p, i) => {
                    const gained = !loadingWins && wonPrizes.some(w => w.prize_id === p.id);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '8px', background: gained ? `${p.color}18` : 'transparent', opacity: loadingWins ? 0.3 : gained ? 1 : 0.4 }}>
                        <span style={{ fontSize: '9px', color: '#4ade80' }}>{loadingWins ? '·' : gained ? '✓' : '○'}</span>
                        <span style={{ fontSize: '11px' }}>{p.icon}</span>
                        <span style={{ fontFamily: "'Cinzel',serif", fontSize: '6.5px', color: p.color }}>{p.name}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Botón girar */}
                <button
                  onClick={() => { if (!spinning && spinsAvailable > 0) spin(); }}
                  disabled={spinning || spinsAvailable <= 0}
                  onMouseEnter={() => { setHovSpin(true); if (!spinning && spinsAvailable > 0) SFX.click(); }}
                  onMouseLeave={() => setHovSpin(false)}
                  style={{
                    position: 'relative', overflow: 'hidden',
                    width: '100%', padding: 'clamp(10px,2vw,14px) 0',
                    borderRadius: '100px',
                    background: spinning || spinsAvailable <= 0
                      ? 'rgba(255,255,255,0.04)'
                      : `linear-gradient(135deg,#4c1d95 0%,#7c3aed 40%,#d4af37 80%,#ffe87a 100%)`,
                    border: spinning || spinsAvailable <= 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    color: spinning || spinsAvailable <= 0 ? 'rgba(200,185,240,0.3)' : '#0c0a2a',
                    fontFamily: "'Cinzel',serif", fontWeight: 900,
                    fontSize: 'clamp(8px,1.5vw,11px)', letterSpacing: '2px',
                    cursor: spinning || spinsAvailable <= 0 ? 'not-allowed' : 'pointer',
                    boxShadow: spinning || spinsAvailable <= 0 ? 'none' : hovSpin ? '0 0 50px rgba(212,175,55,0.9),0 0 100px rgba(139,92,246,0.5)' : '0 0 28px rgba(212,175,55,0.5),0 0 60px rgba(139,92,246,0.3)',
                    transform: hovSpin && !spinning && spinsAvailable > 0 ? 'scale(1.04)' : 'scale(1)',
                    transition: 'all 0.25s ease',
                    animation: !spinning && spinsAvailable > 0 ? 'vrTickle 2s ease-in-out infinite' : 'none',
                  }}
                >
                  {!spinning && spinsAvailable > 0 && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)', backgroundSize: '200% 100%', animation: 'vrSweep 1.8s ease-in-out infinite' }} />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {spinning ? '⟳ GIRANDO...' : spinsAvailable <= 0 ? '✓ SIN TIROS' : '⚡ ¡GIRAR!'}
                  </span>
                </button>

                {spinsAvailable <= 0 && userLevel < 6 && (
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: '6.5px', letterSpacing: '1.5px', color: 'rgba(200,185,240,0.35)', textAlign: 'center', lineHeight: 1.5 }}>
                    Sube de nivel VIP<br/>para más tiros
                  </div>
                )}
              </div>
            </div>

            {/* ── Herramientas ganadas ── */}
            {wonPrizes.filter(p => p.prize_type === 'tool').length > 0 && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(212,175,55,0.12)' }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: '7px', letterSpacing: '3px', color: 'rgba(212,175,55,0.45)', marginBottom: '8px' }}>
                  ✦ TUS HERRAMIENTAS DESBLOQUEADAS
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {wonPrizes.filter(p => p.prize_type === 'tool').map((wp, i) => {
                    const p = PRIZES.find(pr => pr.id === wp.prize_id);
                    if (!p) return null;
                    return (
                      <button key={i}
                        onClick={() => { openTool(wp.file_name); SFX.click(); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '10px', background: `${p.color}12`, border: `1px solid ${p.color}44`, cursor: 'pointer', transition: 'all 0.2s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${p.color}22`; e.currentTarget.style.borderColor = `${p.color}88`; e.currentTarget.style.boxShadow = `0 0 16px ${p.color}44`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${p.color}12`; e.currentTarget.style.borderColor = `${p.color}44`; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <span style={{ fontSize: '10px', color: '#4ade80' }}>✓</span>
                        <span style={{ fontSize: '13px' }}>{p.icon}</span>
                        <span style={{ fontFamily: "'Cinzel',serif", fontSize: '7.5px', color: p.color, fontWeight: 700 }}>{p.name}</span>
                        <span style={{ fontFamily: "'Cinzel',serif", fontSize: '6px', color: 'rgba(200,185,240,0.4)', letterSpacing: '1px' }}>ABRIR →</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
}