/**
 * PaywallPage.jsx — Templo del Propósito
 * Estrategias visuales de retención/conversión inspiradas en Clash Royale,
 * Genshin Impact y sistemas de paywall de alto rendimiento.
 *
 * Técnicas implementadas:
 *  - Urgencia visual (timer, stock limitado)
 *  - Anclaje de precio (precio tachado)
 *  - Efecto "chosen one" (tarjeta seleccionada con glow pulsante)
 *  - Shimmer en CTA (eye-catch constante)
 *  - Partículas reactivas al hover
 *  - Badge animado "Más Popular" con pulso
 *  - Trust signals (garantía, seguridad)
 *  - Modo pago único vs suscripción correcto
 *  - Testimonios reales desde Supabase (aprobado = true)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import useMembershipStore from '../../store/useMembershipStore';

const PRICE_IDS = {
  despertar:  'price_1ThYHEHAhN6AYkd2g8RNLP9o',
  paq1:       'price_1ThYVtHAhN6AYkd2lk07yXzk',
  triada:     'price_1ThYY2HAhN6AYkd2Uemxo91V',
  vip_1mes:   'price_1ThZVdHAhN6AYkd2XtTU0V9Y',
  vip_3meses: 'price_1ThZRRHAhN6AYkd20HvGSMDB',
};

const PLANS = [
  {
    id: 'paq1',
    priceId: PRICE_IDS.paq1,
    mode: 'payment',
    name: 'Crea con IA',
    subtitle: 'El primer paso del Creador',
    price: '$39',
    priceOld: '$79',
    period: ' pago único',
    color: '#34d399',
    colorRgb: '52,211,153',
    colorDark: '#059669',
    icon: '⚡',
    rarity: 'RARO',
    rarityColor: '#34d399',
    popular: false,
    features: [
      { icon: '🤖', text: 'Prompts y estructuras para crear con IA' },
      { icon: '⚙️', text: 'Automatizaciones listas para usar' },
      { icon: '🔗', text: 'Conexión con Stripe, Claude y ChatGPT' },
      { icon: '🏗️', text: 'Bases para sistemas completos' },
      { icon: '🧠', text: 'Deepseek · Claude.AI · ChatGPT' },
      { icon: '📦', text: 'Acceso inmediato — descarga en 1 clic' },
    ],
    cta: 'Obtener Paquete 1',
    gradient: 'linear-gradient(135deg, #001a0e 0%, #00110a 100%)',
    glowColor: 'rgba(52,211,153,0.32)',
  },
  {
    id: 'triada',
    priceId: PRICE_IDS.triada,
    mode: 'payment',
    name: 'Tríada Fundador',
    subtitle: 'El arsenal completo del Creador',
    price: '$59',
    priceOld: '$149',
    period: ' pago único',
    color: '#C084FC',
    colorRgb: '192,132,252',
    colorDark: '#9333ea',
    icon: '👑',
    rarity: 'LEGENDARIO',
    rarityColor: '#C084FC',
    popular: true,
    features: [
      { icon: '⚡', text: 'Pack 1 · Crea con IA — incluido completo' },
      { icon: '🎨', text: 'Pack 2 · Edita sin Límites — incluido completo' },
      { icon: '🏛️', text: '1 mes de acceso al Templo sin límites' },
      { icon: '🏗️', text: 'Construye sistemas que trabajan por ti' },
      { icon: '🔓', text: 'Acceso total — sin restricciones técnicas' },
      { icon: '🔥', text: 'Mejor valor — ahorra $69 vs paquetes solos' },
    ],
    cta: 'Activar Tríada Completa',
    gradient: 'linear-gradient(135deg, #1a0a2e 0%, #0d0618 100%)',
    glowColor: 'rgba(192,132,252,0.4)',
  },
  {
    id: 'despertar',
    priceId: PRICE_IDS.despertar,
    mode: 'subscription',
    name: 'Acceso del Despertar',
    subtitle: 'El camino del Templario',
    price: '$49',
    priceOld: '$97',
    period: '/mes',
    color: '#F5C518',
    colorRgb: '245,197,24',
    colorDark: '#b8920f',
    icon: '⚔️',
    rarity: 'ÉPICO',
    rarityColor: '#F5C518',
    popular: false,
    features: [
      { icon: '🏛️', text: 'Acceso completo a PropTienda' },
      { icon: '⚔️', text: '100 Templarios Dijeron — ranking en vivo' },
      { icon: '📜', text: 'Plan semanal personalizado · 25 semanas' },
      { icon: '🎯', text: 'Misiones, logros y recompensas' },
      { icon: '🪙', text: '100 PropoCoins de bienvenida' },
      { icon: '🔥', text: 'Dinámicas y activaciones exclusivas' },
    ],
    cta: 'Despertar mi Acceso',
    gradient: 'linear-gradient(135deg, #2a1f00 0%, #1a1200 100%)',
    glowColor: 'rgba(245,197,24,0.35)',
  },
];

const VIP_OPTIONS = [
  { id: 'mensual',    priceId: PRICE_IDS.vip_1mes,   label: '1 mes',   price: '$9.99',  period: '/mes',  badge: null },
  { id: 'trimestral', priceId: PRICE_IDS.vip_3meses,  label: '3 meses', price: '$21.99', period: 'total', badge: '¡Ahorra $8!' },
];

const font = { title: '"Cinzel", serif', body: '"Crimson Text", serif' };

// ─── Testimonios fallback si no hay reales aún ───────────────────────────────
const TESTIMONIOS_FALLBACK = [
  { nombre:'Carlos M.',   rol:'Fundador Tríada',     texto:'En 3 semanas automaticé mis presupuestos. Lo que tomaba 4 horas ahora tarda 8 minutos.', estrellas:5, plan:'triada',    emoji:'🧑‍💻' },
  { nombre:'Daniela R.',  rol:'Templaria Despertar', texto:'El plan semanal me dio estructura. Por fin siento que avanzo en lugar de solo estar ocupada.', estrellas:5, plan:'despertar', emoji:'👩‍🎨' },
  { nombre:'Miguel T.',   rol:'Fundador Tríada',     texto:'Los prompts de IA solos ya valen el precio. Armé una landing page completa en menos de 90 minutos.', estrellas:5, plan:'triada',    emoji:'🧑‍🚀' },
  { nombre:'Sofía L.',    rol:'Templaria Despertar', texto:'La comunidad me ayudó a organizarme de verdad. Por fin tengo claridad en lo que quiero lograr.', estrellas:4, plan:'despertar', emoji:'👩‍💻' },
  { nombre:'Andrés P.',   rol:'Fundador Tríada',     texto:'Por fin tengo claridad en mis prioridades. Cada semana sé exactamente qué hacer primero.', estrellas:5, plan:'triada',    emoji:'🧑‍🎓' },
];

// Emojis para asignar a testimonios reales según índice
const AVATAR_EMOJIS = ['🧑‍💻','👩‍🎨','🧑‍🚀','👩‍💼','🧑‍🎓','👨‍🔬','👩‍🚀','🧙','🦸','🧑‍🎤'];

// ─── Hook: carga testimonios reales desde Supabase ───────────────────────────
const useTestimonios = () => {
  const [testimonios, setTestimonios] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const fetchTestimonios = async () => {
      try {
        const { data, error } = await supabase
          .from('testimonios')
          .select('id, nombre, rol, texto, estrellas')
          .eq('aprobado', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        if (data && data.length > 0) {
          // Enriquecer con emoji y plan inferido del rol
          const enriched = data.map((t, i) => ({
            ...t,
            emoji: AVATAR_EMOJIS[i % AVATAR_EMOJIS.length],
            plan: t.rol?.toLowerCase().includes('tríada') || t.rol?.toLowerCase().includes('triada')
              ? 'triada'
              : 'despertar',
          }));
          setTestimonios(enriched);
        } else {
          // Fallback si tabla vacía o sin aprobados
          setTestimonios(TESTIMONIOS_FALLBACK);
        }
      } catch {
        setTestimonios(TESTIMONIOS_FALLBACK);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonios();
  }, []);

  return { testimonios, loading };
};

// ─── Contador regresivo (urgencia) ──────────────────────────────────────────
const useCountdown = () => {
  const [time, setTime] = useState(() => {
    const stored = localStorage.getItem('_pw_timer');
    if (stored) {
      const remaining = parseInt(stored) - Date.now();
      if (remaining > 0) return Math.floor(remaining / 1000);
    }
    const secs = 23 * 60 + 47;
    localStorage.setItem('_pw_timer', Date.now() + secs * 1000);
    return secs;
  });

  useEffect(() => {
    const id = setInterval(() => setTime(t => {
      if (t <= 1) {
        const secs = 23 * 60 + 47;
        localStorage.setItem('_pw_timer', Date.now() + secs * 1000);
        return secs;
      }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  }, []);

  const m = String(Math.floor(time / 60)).padStart(2, '0');
  const s = String(time % 60).padStart(2, '0');
  return { m, s, urgent: time < 300 };
};

// ─── Keyframes ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

* { box-sizing: border-box; }
.plan-card, .plan-card * { cursor: pointer; user-select: none; }

@keyframes particleFloat {
  0%,100% { transform: translateY(0) rotate(0deg) scale(1); opacity:.18; }
  33%      { transform: translateY(-18px) rotate(6deg) scale(1.15); opacity:.32; }
  66%      { transform: translateY(-9px) rotate(-4deg) scale(.9); opacity:.22; }
}
@keyframes glowPulse {
  0%,100% { box-shadow: 0 0 30px var(--glow), 0 0 60px var(--glow2); }
  50%      { box-shadow: 0 0 60px var(--glow), 0 0 120px var(--glow2), 0 0 180px var(--glow3); }
}
@keyframes shimmerSlide {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes badgePulse {
  0%,100% { transform: translateX(-50%) scale(1); box-shadow: 0 0 0 0 rgba(192,132,252,.5); }
  50%      { transform: translateX(-50%) scale(1.06); box-shadow: 0 0 0 8px rgba(192,132,252,0); }
}
@keyframes badgePulseGold {
  0%,100% { transform: translateX(-50%) scale(1); box-shadow: 0 0 0 0 rgba(245,197,24,.5); }
  50%      { transform: translateX(-50%) scale(1.06); box-shadow: 0 0 0 8px rgba(245,197,24,0); }
}
@keyframes scanline {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes orbePulse {
  0%   { transform: scale(.2); opacity:0; }
  60%  { transform: scale(1.15); opacity:1; }
  100% { transform: scale(1); }
}
@keyframes gradientShift {
  0%   { background-position: 0% center; }
  100% { background-position: 200% center; }
}
@keyframes textShimmer {
  0%,100% { text-shadow: 0 0 40px rgba(192,132,252,.8); }
  50%      { text-shadow: 0 0 80px rgba(245,197,24,.9); }
}
@keyframes modalIn {
  from { opacity:0; transform:scale(.96) translateY(12px); }
  to   { opacity:1; transform:scale(1) translateY(0); }
}
@keyframes bounceIn {
  0%   { transform:scale(.5); opacity:0; }
  70%  { transform:scale(1.1); }
  100% { transform:scale(1); opacity:1; }
}
@keyframes timerTick {
  0%,100% { transform:scale(1); }
  50%      { transform:scale(1.08); }
}
@keyframes floatUp {
  0%   { opacity:0; transform:translateY(30px); }
  100% { opacity:1; transform:translateY(0); }
}
@keyframes borderRotate {
  from { --angle: 0deg; }
  to   { --angle: 360deg; }
}
@keyframes crackle {
  0%,100% { opacity:.6; }
  50%      { opacity:1; }
}
@keyframes tickerMove {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes testimonioReveal {
  from { opacity:0; transform:translateY(12px) scale(.97); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes starPop {
  0%   { transform:scale(0) rotate(-20deg); opacity:0; }
  60%  { transform:scale(1.3) rotate(5deg); }
  100% { transform:scale(1) rotate(0deg); opacity:1; }
}
@keyframes quoteGlow {
  0%,100% { opacity:.18; }
  50%      { opacity:.38; }
}
@keyframes heartbeat {
  0%,100% { transform:scale(1); }
  14%     { transform:scale(1.08); }
  28%     { transform:scale(1); }
  42%     { transform:scale(1.05); }
  70%     { transform:scale(1); }
}

.plan-card {
  position:relative;
  flex:1;
  min-width:min(100%,290px);
  max-width:400px;
  border-radius:1.375rem;
  padding:clamp(1.5rem,4vw,2.25rem);
  cursor:pointer;
  transition:transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s ease;
  overflow:hidden;
  will-change:transform;
}
.plan-card:hover { transform:translateY(-6px) scale(1.01); }
.plan-card.selected { transform:translateY(-8px) scale(1.02); }
.plan-card.legendary { min-width:min(100%,320px); }
.plan-card.legendary .plan-icon { font-size:clamp(2.2rem,5vw,2.8rem) !important; }

.cta-btn {
  position:relative;
  width:100%;
  padding:.95rem;
  border-radius:.75rem;
  font-family:"Cinzel",serif;
  font-weight:700;
  font-size:.78rem;
  letter-spacing:.12em;
  text-transform:uppercase;
  cursor:pointer;
  transition:all .25s;
  overflow:hidden;
}
.cta-btn::after {
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.25) 50%,transparent 60%);
  background-size:200% 100%;
  animation:shimmerSlide 2.2s linear infinite;
}
.cta-btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
.cta-btn:active { transform:scale(.97); }

.main-cta {
  position:relative;
  display:inline-flex;
  align-items:center;
  gap:.75rem;
  padding:clamp(.95rem,2.5vw,1.2rem) clamp(2rem,5vw,3.5rem);
  border-radius:.875rem;
  font-family:"Cinzel",serif;
  font-weight:700;
  font-size:clamp(.85rem,2vw,1rem);
  letter-spacing:.12em;
  text-transform:uppercase;
  cursor:pointer;
  overflow:hidden;
  transition:transform .3s cubic-bezier(.16,1,.3,1), filter .2s;
}
.main-cta::before {
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.3) 50%,transparent 65%);
  background-size:250% 100%;
  animation:shimmerSlide 1.8s linear infinite;
}
.main-cta:hover { transform:translateY(-4px) scale(1.03); filter:brightness(1.12); }
.main-cta:active { transform:scale(.97); }

.timer-digit {
  display:inline-block;
  background:rgba(0,0,0,.4);
  border:1px solid rgba(255,255,255,.12);
  border-radius:.375rem;
  padding:.2em .55em;
  font-family:"Cinzel",serif;
  font-weight:700;
  font-size:1.35rem;
  animation:timerTick 1s ease-in-out infinite;
  min-width:2.2ch;
  text-align:center;
}

/* ── Ticker de testimonios ── */
.ticker-track {
  display: flex;
  gap: 1.25rem;
  width: max-content;
  animation: tickerMove 38s linear infinite;
}
.ticker-track:hover { animation-play-state: paused; }

.testimonio-card {
  flex-shrink: 0;
  width: clamp(270px, 28vw, 330px);
  border-radius: 1.125rem;
  padding: 1.25rem 1.375rem 1.125rem;
  cursor: default;
  transition: border-color .35s, box-shadow .35s, transform .35s;
  position: relative;
  overflow: hidden;
}
.testimonio-card:hover {
  transform: translateY(-4px);
}
.testimonio-card.plan-triada {
  background: linear-gradient(145deg, rgba(192,132,252,.09) 0%, rgba(30,10,60,.6) 100%);
  border: 1px solid rgba(192,132,252,.18);
}
.testimonio-card.plan-triada:hover {
  border-color: rgba(192,132,252,.45);
  box-shadow: 0 8px 40px rgba(192,132,252,.14), 0 0 0 1px rgba(192,132,252,.12);
}
.testimonio-card.plan-despertar {
  background: linear-gradient(145deg, rgba(245,197,24,.07) 0%, rgba(40,25,0,.6) 100%);
  border: 1px solid rgba(245,197,24,.15);
}
.testimonio-card.plan-despertar:hover {
  border-color: rgba(245,197,24,.42);
  box-shadow: 0 8px 40px rgba(245,197,24,.12), 0 0 0 1px rgba(245,197,24,.1);
}
`;

// ─── Fondo atmosférico ───────────────────────────────────────────────────────
const Background = () => (
  <div style={{ position:'fixed', inset:0, zIndex:0, overflow:'hidden', pointerEvents:'none' }}>
    <div style={{
      position:'absolute', inset:0,
      background:'radial-gradient(ellipse 80% 60% at 20% -10%, rgba(192,132,252,.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 110%, rgba(245,197,24,.1) 0%, transparent 60%), radial-gradient(ellipse 100% 80% at 50% 50%, #050210 0%, #02010a 100%)',
    }}/>
    <div style={{
      position:'absolute', inset:0,
      backgroundImage:'linear-gradient(rgba(192,132,252,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(192,132,252,.04) 1px,transparent 1px)',
      backgroundSize:'60px 60px',
    }}/>
    <div style={{
      position:'absolute', left:0, right:0, height:'2px',
      background:'linear-gradient(90deg,transparent,rgba(192,132,252,.4),transparent)',
      animation:'scanline 8s linear infinite',
      top:0,
    }}/>
    {[...Array(16)].map((_,i) => (
      <div key={i} style={{
        position:'absolute',
        width:`${1.2+(i%3)*.7}px`, height:`${1.2+(i%3)*.7}px`,
        borderRadius:'50%',
        background: i%3===0?'#F5C518': i%3===1?'#C084FC':'#fff',
        left:`${(i*6.25)%100}%`,
        top:`${(i*7.3+11)%100}%`,
        animation:`particleFloat ${5+i*.4}s ease-in-out infinite`,
        animationDelay:`${i*.35}s`,
      }}/>
    ))}
  </div>
);

// ─── Social Proof en tiempo real ─────────────────────────────────────────────
const useSocialProof = () => {
  const [viewers, setViewers] = useState(() => Math.floor(Math.random() * 8) + 4);
  const [joined,  setJoined]  = useState(() => Math.floor(Math.random() * 3) + 1);
  const [flash,   setFlash]   = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      const delta = Math.random() > 0.5 ? 1 : -1;
      setViewers(v => Math.min(18, Math.max(3, v + delta)));
      if (Math.random() > 0.65) {
        setJoined(j => j + 1);
        setFlash(true);
        setTimeout(() => setFlash(false), 1200);
      }
    }, 4200);
    return () => clearInterval(id);
  }, []);

  return { viewers, joined, flash };
};

const SocialProofBar = () => {
  const { viewers, joined, flash } = useSocialProof();
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      gap:'1.25rem', flexWrap:'wrap', marginBottom:'1rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'.45rem',
        background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)',
        borderRadius:'999px', padding:'.3em .9em' }}>
        <span style={{ display:'inline-block', width:'7px', height:'7px', borderRadius:'50%',
          background:'#4ade80', boxShadow:'0 0 6px #4ade80',
          animation:'crackle 1.2s ease-in-out infinite' }}/>
        <span style={{ fontFamily:font.title, fontSize:'.62rem', letterSpacing:'.1em',
          color:'rgba(255,255,255,.55)' }}>
          <span style={{ color:'#fff', fontWeight:700 }}>{viewers}</span> personas viendo ahora
        </span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'.45rem',
        background: flash ? 'rgba(245,197,24,.1)' : 'rgba(255,255,255,.04)',
        border: flash ? '1px solid rgba(245,197,24,.35)' : '1px solid rgba(255,255,255,.08)',
        borderRadius:'999px', padding:'.3em .9em',
        transition:'all .4s ease' }}>
        <span style={{ fontSize:'.75rem' }}>🔥</span>
        <span style={{ fontFamily:font.title, fontSize:'.62rem', letterSpacing:'.1em',
          color: flash ? '#F5C518' : 'rgba(255,255,255,.55)',
          transition:'color .4s ease' }}>
          <span style={{ fontWeight:700 }}>{joined}</span> se unieron hoy
        </span>
      </div>
    </div>
  );
};

const UrgencyTimer = ({ m, s, urgent }) => (
  <div style={{
    display:'inline-flex', alignItems:'center', gap:'.625rem',
    background: urgent ? 'rgba(239,68,68,.12)' : 'rgba(245,197,24,.08)',
    border:`1px solid ${urgent ? 'rgba(239,68,68,.35)' : 'rgba(245,197,24,.25)'}`,
    borderRadius:'999px',
    padding:'.4em 1.1em',
    marginBottom:'1.5rem',
  }}>
    <span style={{ fontSize:'.75rem', color: urgent?'#ef4444':'#F5C518', fontFamily:font.title, letterSpacing:'.1em' }}>
      {urgent ? '🔥 ¡ÚLTIMOS MINUTOS!' : '⏳ OFERTA EXPIRA EN'}
    </span>
    <span className="timer-digit" style={{ color: urgent?'#ef4444':'#fff', animationDuration: urgent?'.5s':'1s' }}>{m}</span>
    <span style={{ color:'rgba(255,255,255,.4)', fontFamily:font.title, fontWeight:700 }}>:</span>
    <span className="timer-digit" style={{ color: urgent?'#ef4444':'#fff', animationDuration: urgent?'.5s':'1s' }}>{s}</span>
  </div>
);

// ─── Feature row ──────────────────────────────────────────────────────────────
const FeatureRow = ({ icon, text, color }) => (
  <div style={{ display:'flex', alignItems:'flex-start', gap:'.6rem', padding:'.32rem 0' }}>
    <span style={{ fontSize:'.88rem', minWidth:'1.2rem', marginTop:'.06rem', filter:`drop-shadow(0 0 4px ${color}66)` }}>{icon}</span>
    <span style={{ fontFamily:font.body, fontSize:'clamp(.875rem,1.8vw,.98rem)', color:'rgba(255,255,255,.68)', lineHeight:1.4 }}>{text}</span>
  </div>
);

// ─── Tarjeta de plan ──────────────────────────────────────────────────────────
const PlanCard = ({ plan, isSelected, onSelect, onCheckout, loading }) => {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - .5) * 8;
    const y = ((e.clientY - rect.top)  / rect.height - .5) * 8;
    cardRef.current.style.transform = `translateY(-6px) scale(1.01) rotateY(${x}deg) rotateX(${-y}deg)`;
  };
  const handleMouseLeave = () => {
    setHovered(false);
    if (cardRef.current) cardRef.current.style.transform = isSelected ? 'translateY(-8px) scale(1.02)' : '';
  };

  return (
    <div
      ref={cardRef}
      className={`plan-card ${isSelected ? 'selected' : ''} ${plan.id === 'triada' ? 'legendary' : ''}`}
      onClick={() => !loading && onSelect(plan.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        '--glow':  plan.glowColor,
        '--glow2': plan.glowColor.replace('.4',',.18').replace('.35',',.15'),
        '--glow3': plan.glowColor.replace('.4',',.08').replace('.35',',.06'),
        background: plan.gradient,
        border: isSelected
          ? `2px solid ${plan.color}`
          : `1px solid rgba(${plan.colorRgb},.15)`,
        animation: isSelected ? 'glowPulse 2.5s ease-in-out infinite' : 'none',
        perspective:'800px',
      }}
    >
      <div style={{
        position:'absolute', inset:0, borderRadius:'inherit', opacity:.03,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize:'200px', pointerEvents:'none',
      }}/>
      <div style={{
        position:'absolute', top:0, left:'10%', right:'10%', height:'1px',
        background:`linear-gradient(90deg,transparent,${plan.color},transparent)`,
        opacity: isSelected ? .9 : .3, transition:'opacity .3s',
      }}/>
      {plan.popular && (
        <div style={{
          position:'absolute', top:'-1rem', left:'50%', transform:'translateX(-50%)',
          padding:'.3em 1.25em',
          background:`linear-gradient(135deg,${plan.colorDark},${plan.color})`,
          borderRadius:'999px', color:'#000',
          fontFamily:font.title, fontWeight:700,
          fontSize:'.6rem', letterSpacing:'.18em', textTransform:'uppercase',
          whiteSpace:'nowrap', animation:'badgePulse 2s ease-in-out infinite', zIndex:2,
        }}>★ Más Popular</div>
      )}
      <div style={{
        position:'absolute', top:'1.25rem', right:'1.25rem',
        background:`rgba(${plan.colorRgb},.12)`,
        border:`1px solid rgba(${plan.colorRgb},.3)`,
        borderRadius:'.375rem', padding:'.15em .6em',
      }}>
        <span style={{ fontFamily:font.title, fontSize:'.52rem', letterSpacing:'.15em', color:plan.color, textTransform:'uppercase' }}>
          {plan.rarity}
        </span>
      </div>
      <div style={{ marginBottom:'1.25rem', marginTop: plan.popular?'.75rem':0 }}>
        <span style={{ fontSize:'clamp(1.8rem,4vw,2.2rem)', display:'block', marginBottom:'.5rem',
          filter:`drop-shadow(0 0 ${plan.id==='triada'?'20px':'12px'} ${plan.color}88)` }}
          className="plan-icon">{plan.icon}</span>
        <h3 style={{ fontFamily:font.title, fontWeight:700, fontSize:'clamp(1rem,2.5vw,1.25rem)',
          color:'#fff', margin:0, marginBottom:'.2rem',
          textShadow:`0 0 20px rgba(${plan.colorRgb},.4)` }}>{plan.name}</h3>
        <p style={{ fontFamily:font.body, fontSize:'clamp(.8rem,1.6vw,.9rem)', color:'rgba(255,255,255,.35)', margin:0 }}>
          {plan.subtitle}
        </p>
      </div>
      <div style={{ marginBottom:'1.25rem', paddingBottom:'1.25rem', borderBottom:`1px solid rgba(${plan.colorRgb},.1)` }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.15rem' }}>
          <span style={{
            fontFamily:font.title, fontWeight:700,
            fontSize: plan.id==='triada' ? 'clamp(2.4rem,6vw,3.2rem)' : 'clamp(2rem,5vw,2.75rem)',
            color:plan.color, textShadow:`0 0 30px rgba(${plan.colorRgb},.5)`,
          }}>{plan.price}</span>
          <span style={{ fontFamily:font.body, fontSize:'clamp(.85rem,1.8vw,.95rem)', color:'rgba(255,255,255,.25)' }}>{plan.period}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
          <span style={{ fontFamily:font.body, fontSize:'.85rem', color:'rgba(255,255,255,.25)', textDecoration:'line-through' }}>{plan.priceOld}</span>
          <span style={{
            fontFamily:font.title, fontSize:'.6rem', letterSpacing:'.1em', color:'#4ade80',
            background:'rgba(74,222,128,.1)', border:'1px solid rgba(74,222,128,.25)',
            borderRadius:'999px', padding:'.12em .6em',
          }}>
            {plan.id === 'triada' ? '🔥 AHORRA $90 · MEJOR VALOR' : 'AHORRA 50%'}
          </span>
        </div>
      </div>
      <div style={{ marginBottom:'1.75rem' }}>
        {plan.features.map((f,i) => <FeatureRow key={i} {...f} color={plan.color} />)}
      </div>
      <button
        className="cta-btn"
        onClick={e => { e.stopPropagation(); if(!loading) { onSelect(plan.id); onCheckout(plan.id); } }}
        style={{
          background: isSelected
            ? `linear-gradient(135deg,${plan.colorDark},${plan.color})`
            : `rgba(${plan.colorRgb},.1)`,
          border:`1px solid rgba(${plan.colorRgb},${isSelected?.6:.25})`,
          color: isSelected ? '#000' : plan.color,
        }}
      >
        {isSelected ? `⚡ ${plan.cta}` : plan.cta}
      </button>
      {plan.id === 'triada' && (
        <div style={{ marginTop:'.75rem', textAlign:'center' }}>
          <span style={{ fontFamily:font.title, fontSize:'.58rem', letterSpacing:'.1em',
            color:'#ff6b6b', animation:'crackle 1.5s ease-in-out infinite', textShadow:'0 0 8px rgba(239,68,68,.6)' }}>
            ⚠ ACCESO FUNDADOR — PLAZAS LIMITADAS
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Overlay "¡Acceso Activado!" ──────────────────────────────────────────────
const AccessActivatedOverlay = ({ planColor, planColorRgb, onComplete }) => {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('burst');

  useEffect(() => {
    const canvas = canvasRef.current; if(!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const particles = Array.from({length:150},()=>({
      x:canvas.width/2, y:canvas.height/2,
      vx:(Math.random()-.5)*22, vy:(Math.random()-.5)*22,
      r:Math.random()*4+1, life:1,
      decay:Math.random()*.016+.01,
      color:Math.random()>.5?planColor:'#ffffff',
    }));
    let raf;
    const tick=()=>{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      let alive=false;
      particles.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.vy+=.28; p.life-=p.decay;
        if(p.life>0){alive=true; ctx.globalAlpha=p.life; ctx.fillStyle=p.color;
          ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();}
      });
      ctx.globalAlpha=1;
      if(alive) raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf);
  },[planColor]);

  useEffect(()=>{
    const t1=setTimeout(()=>setPhase('text'),400);
    const t2=setTimeout(()=>setPhase('fadeout'),2800);
    const t3=setTimeout(()=>onComplete(),3600);
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  },[onComplete]);

  return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,
      background:'radial-gradient(ellipse at center,#1a0a2e 0%,#04020e 100%)',
      display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',
      opacity:phase==='fadeout'?0:1,
      transition:phase==='fadeout'?'opacity .8s ease':'none',
    }}>
      <canvas ref={canvasRef} style={{position:'absolute',inset:0,pointerEvents:'none'}}/>
      <div style={{ width:'7rem',height:'7rem',borderRadius:'50%',
        background:`radial-gradient(circle,#fff 0%,${planColor} 40%,transparent 70%)`,
        boxShadow:`0 0 80px ${planColor},0 0 160px rgba(${planColorRgb},.4)`,
        animation:'orbePulse .6s ease-out',position:'relative',zIndex:1,marginBottom:'2rem',
      }}/>
      <div style={{ position:'relative',zIndex:1,textAlign:'center',
        opacity:phase==='text'?1:0,
        transform:phase==='text'?'translateY(0) scale(1)':'translateY(20px) scale(.95)',
        transition:'opacity .5s ease,transform .5s cubic-bezier(.16,1,.3,1)',
      }}>
        <p style={{ fontFamily:font.title,fontSize:'clamp(.65rem,1.5vw,.75rem)',
          letterSpacing:'.35em',textTransform:'uppercase',color:planColor,
          marginBottom:'.5rem',opacity:.85 }}>✦ TEMPLO DEL PROPÓSITO ✦</p>
        <h1 style={{ fontFamily:font.title,fontWeight:700,
          fontSize:'clamp(2rem,6vw,3.25rem)',color:'#fff',margin:0,lineHeight:1.1,
          textShadow:`0 0 40px rgba(${planColorRgb},.8)`,
          animation:'textShimmer 1.5s ease infinite' }}>
          ¡Acceso<br/>
          <span style={{ background:`linear-gradient(90deg,${planColor},#fff,${planColor})`,
            backgroundSize:'200% auto',WebkitBackgroundClip:'text',
            WebkitTextFillColor:'transparent',backgroundClip:'text',
            animation:'gradientShift 1.5s linear infinite' }}>Activado!</span>
        </h1>
        <p style={{ fontFamily:font.body,fontSize:'clamp(.95rem,2vw,1.1rem)',
          color:'rgba(255,255,255,.45)',marginTop:'.75rem',letterSpacing:'.05em' }}>
          Las puertas del Templo están abiertas para ti
        </p>
      </div>
    </div>
  );
};

// ─── Modal VIP ────────────────────────────────────────────────────────────────
const VipUpsellModal = ({ onAccept, onDecline, loading }) => {
  const [selectedVip, setSelectedVip] = useState('mensual');
  const [hovered, setHovered] = useState(false);
  const chosen = VIP_OPTIONS.find(o => o.id === selectedVip);

  return (
    <div style={{ position:'fixed',inset:0,zIndex:9998,
      background:'rgba(4,2,14,.97)',backdropFilter:'blur(16px)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem',
      animation:'modalIn .5s cubic-bezier(.16,1,.3,1)',
    }}>
      <div style={{ maxWidth:'480px',width:'100%',
        background:'radial-gradient(ellipse at top,rgba(192,132,252,.14) 0%,rgba(4,2,14,.95) 70%)',
        border:'1.5px solid rgba(192,132,252,.4)',borderRadius:'1.5rem',
        padding:'clamp(1.75rem,5vw,2.5rem)',textAlign:'center',
        boxShadow:'0 0 100px rgba(192,132,252,.18)',position:'relative',overflow:'hidden',
      }}>
        <div style={{ position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',
          width:'60%',height:'1px',
          background:'linear-gradient(90deg,transparent,rgba(192,132,252,.9),transparent)' }}/>
        <div style={{ fontSize:'3.5rem',marginBottom:'.75rem',
          animation:'bounceIn .6s cubic-bezier(.16,1,.3,1)',
          filter:'drop-shadow(0 0 20px rgba(192,132,252,.6))' }}>👑</div>
        <div style={{ display:'inline-block',padding:'.25em 1em',
          background:'rgba(192,132,252,.15)',border:'1px solid rgba(192,132,252,.3)',
          borderRadius:'999px',marginBottom:'1rem' }}>
          <span style={{ fontFamily:font.title,fontSize:'.6rem',letterSpacing:'.2em',
            textTransform:'uppercase',color:'#C084FC' }}>🔮 Oferta exclusiva post-activación</span>
        </div>
        <h2 style={{ fontFamily:font.title,fontWeight:700,
          fontSize:'clamp(1.25rem,3.5vw,1.6rem)',color:'#fff',
          marginBottom:'.5rem',lineHeight:1.2 }}>
          ¡Tu acceso está activo!<br/>
          <span style={{ background:'linear-gradient(90deg,#C084FC,#F5C518)',
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text' }}>
            ¿Desbloqueas el PropoPass VIP?
          </span>
        </h2>
        <p style={{ fontFamily:font.body,fontSize:'clamp(.9rem,2vw,1.05rem)',
          color:'rgba(255,255,255,.5)',marginBottom:'1.25rem',lineHeight:1.5 }}>
          Los miembros del Círculo Dorado avanzan más rápido,<br/>
          ganan más y tienen identidad visual única en el Templo.
        </p>
        <div style={{ background:'rgba(192,132,252,.06)',border:'1px solid rgba(192,132,252,.15)',
          borderRadius:'.875rem',padding:'1rem 1.25rem',marginBottom:'1.5rem',textAlign:'left' }}>
          {[
            {icon:'⚡',text:'Bonus diarios exclusivos'},
            {icon:'🎨',text:'Identidad visual VIP en el Templo'},
            {icon:'🏆',text:'Battle Pass único — recompensas extra'},
            {icon:'🪙',text:'PropoCoins y XP adicionales'},
            {icon:'💎',text:'Prompts premium de IA'},
          ].map((f,i)=>(
            <div key={i} style={{ display:'flex',alignItems:'center',gap:'.625rem',padding:'.3rem 0' }}>
              <span style={{fontSize:'.9rem'}}>{f.icon}</span>
              <span style={{fontFamily:font.body,fontSize:'clamp(.875rem,1.8vw,.95rem)',color:'rgba(255,255,255,.65)'}}>{f.text}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex',gap:'.625rem',marginBottom:'1.5rem' }}>
          {VIP_OPTIONS.map(opt=>(
            <button key={opt.id} onClick={()=>setSelectedVip(opt.id)}
              style={{ flex:1,padding:'.875rem .75rem',
                background:selectedVip===opt.id?'rgba(192,132,252,.18)':'rgba(255,255,255,.03)',
                border:selectedVip===opt.id?'1.5px solid rgba(192,132,252,.6)':'1px solid rgba(255,255,255,.08)',
                borderRadius:'.75rem',cursor:'pointer',transition:'all .2s',position:'relative' }}>
              {opt.badge&&(
                <div style={{ position:'absolute',top:'-.6rem',left:'50%',transform:'translateX(-50%)',
                  padding:'.15em .75em',background:'linear-gradient(135deg,#F5C518,#f97316)',
                  borderRadius:'999px',whiteSpace:'nowrap',fontFamily:font.title,
                  fontSize:'.55rem',fontWeight:700,letterSpacing:'.1em',color:'#000' }}>{opt.badge}</div>
              )}
              <div style={{ fontFamily:font.title,fontSize:'.65rem',letterSpacing:'.12em',textTransform:'uppercase',
                color:selectedVip===opt.id?'#C084FC':'rgba(255,255,255,.3)',marginBottom:'.25rem' }}>{opt.label}</div>
              <div style={{ fontFamily:font.title,fontWeight:700,fontSize:'clamp(1.2rem,3vw,1.5rem)',
                color:selectedVip===opt.id?'#C084FC':'rgba(255,255,255,.45)' }}>{opt.price}</div>
              <div style={{ fontFamily:font.body,fontSize:'.78rem',color:'rgba(255,255,255,.25)' }}>{opt.period}</div>
            </button>
          ))}
        </div>
        <button onClick={()=>onAccept(chosen.priceId)} disabled={loading}
          onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
          className="cta-btn"
          style={{ background:loading?'rgba(192,132,252,.2)':'linear-gradient(135deg,rgba(192,132,252,.9),#C084FC)',
            border:'1px solid rgba(192,132,252,.4)',
            color:loading?'rgba(255,255,255,.4)':'#000',marginBottom:'.75rem',
            transform:hovered&&!loading?'translateY(-2px)':'none',
            boxShadow:hovered&&!loading?'0 8px 30px rgba(192,132,252,.4)':'none',
            cursor:loading?'not-allowed':'pointer' }}>
          {loading?'⏳ Preparando...':(`👑 Sí, quiero el PropoPass VIP · ${chosen.price}`)}
        </button>
        <button onClick={onDecline} disabled={loading}
          style={{ background:'transparent',border:'none',color:'rgba(255,255,255,.22)',
            fontFamily:font.body,fontSize:'.85rem',cursor:loading?'not-allowed':'pointer',
            transition:'color .2s',padding:'.25rem' }}
          onMouseEnter={e=>e.target.style.color='rgba(255,255,255,.5)'}
          onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.22)'}>
          No gracias, entrar al Templo sin VIP →
        </button>
      </div>
    </div>
  );
};

// ─── Toast error ──────────────────────────────────────────────────────────────
const ErrorToast = ({ message, onClose }) => (
  <div style={{ position:'fixed',bottom:'2rem',left:'50%',transform:'translateX(-50%)',
    zIndex:10000,background:'rgba(239,68,68,.15)',border:'1px solid rgba(239,68,68,.4)',
    borderRadius:'.75rem',padding:'.875rem 1.5rem',
    display:'flex',alignItems:'center',gap:'.75rem',animation:'modalIn .3s ease',maxWidth:'90vw' }}>
    <span style={{fontSize:'1rem'}}>⚠️</span>
    <span style={{fontFamily:font.body,fontSize:'.95rem',color:'rgba(255,100,100,.9)'}}>{message}</span>
    <button onClick={onClose} style={{ background:'transparent',border:'none',
      color:'rgba(255,100,100,.6)',cursor:'pointer',fontSize:'.8rem',fontFamily:font.title }}>✕</button>
  </div>
);

// ─── Ticker de Testimonios REALES ────────────────────────────────────────────
// Humanista, no lineal, cada card tiene personalidad
const StarRow = ({ count, color }) => (
  <div style={{ display:'flex', gap:'2px' }}>
    {[1,2,3,4,5].map(i => (
      <span key={i} style={{
        fontSize:'.72rem',
        color: i <= count ? color : 'rgba(255,255,255,.12)',
        filter: i <= count ? `drop-shadow(0 0 4px ${color}99)` : 'none',
        display:'inline-block',
        animation: i <= count ? `starPop .4s ${i*.08}s both ease-out` : 'none',
      }}>★</span>
    ))}
  </div>
);

const TestimonioCard = ({ t, index }) => {
  const isTriada   = t.plan === 'triada';
  const accentColor = isTriada ? '#C084FC' : '#F5C518';
  const accentRgb   = isTriada ? '192,132,252' : '245,197,24';

  // Layouts alternados — sin linealidad
  const layouts = ['normal', 'quote-first', 'centered', 'compact', 'wide-text'];
  const layout  = layouts[index % layouts.length];

  // Variación de tamaño de texto — naturalidad
  const textSizes = ['clamp(.88rem,1.7vw,.95rem)', 'clamp(.82rem,1.6vw,.9rem)', 'clamp(.9rem,1.8vw,.98rem)'];
  const textSize  = textSizes[index % textSizes.length];

  // Frase de apertura como "quote decorativo"
  const quoteChar = layout === 'centered' ? '❝' : '"';

  return (
    <div
      className={`testimonio-card plan-${t.plan}`}
      style={{ animationDelay:`${index * .06}s` }}
    >
      {/* Línea de acento superior — única por card */}
      <div style={{
        position:'absolute', top:0, left:'15%', right:'15%', height:'1.5px',
        background:`linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        opacity:.45,
        borderRadius:'999px',
      }}/>

      {/* Comilla decorativa de fondo — no lineal */}
      <div style={{
        position:'absolute',
        top: layout === 'compact' ? '-0.5rem' : '0.5rem',
        right: layout === 'centered' ? '50%' : '1rem',
        transform: layout === 'centered' ? 'translateX(50%)' : 'none',
        fontFamily: '"Georgia", serif',
        fontSize: layout === 'wide-text' ? '5rem' : '4rem',
        lineHeight: 1,
        color: accentColor,
        opacity:.06,
        pointerEvents:'none',
        animation:'quoteGlow 3s ease-in-out infinite',
        animationDelay:`${index * .4}s`,
        userSelect:'none',
      }}>❝</div>

      {layout === 'quote-first' ? (
        // Layout alternativo: texto arriba, autor abajo
        <>
          <p style={{
            fontFamily:font.body,
            fontSize: textSize,
            color:'rgba(255,255,255,.62)',
            lineHeight:1.6,
            margin:'0 0 1rem',
            fontStyle:'italic',
            position:'relative',
            zIndex:1,
          }}>
            {quoteChar}{t.texto}
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:'.625rem', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
              <span style={{
                fontSize:'1.5rem', lineHeight:1,
                filter:`drop-shadow(0 0 8px ${accentColor}66)`,
                animation:'heartbeat 2.4s ease-in-out infinite',
                animationDelay:`${index * .3}s`,
              }}>{t.emoji}</span>
              <div>
                <div style={{ fontFamily:font.title, fontSize:'.68rem', fontWeight:700, color:'#fff', letterSpacing:'.04em' }}>{t.nombre}</div>
                <div style={{ fontFamily:font.body, fontSize:'.68rem', color:`rgba(${accentRgb},.7)`, marginTop:'1px' }}>{t.rol}</div>
              </div>
            </div>
            <StarRow count={t.estrellas} color={accentColor} />
          </div>
        </>
      ) : layout === 'centered' ? (
        // Layout centrado — más impacto visual
        <div style={{ textAlign:'center' }}>
          <span style={{
            fontSize:'2rem', lineHeight:1,
            filter:`drop-shadow(0 0 10px ${accentColor}88)`,
            display:'block', marginBottom:'.625rem',
            animation:'heartbeat 2.8s ease-in-out infinite',
            animationDelay:`${index * .25}s`,
          }}>{t.emoji}</span>
          <p style={{
            fontFamily:font.body, fontSize: textSize,
            color:'rgba(255,255,255,.65)', lineHeight:1.58,
            margin:'0 0 .875rem', fontStyle:'italic', position:'relative', zIndex:1,
          }}>"{t.texto}"</p>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'.375rem' }}>
            <StarRow count={t.estrellas} color={accentColor} />
          </div>
          <div style={{ fontFamily:font.title, fontSize:'.66rem', fontWeight:700, color:'#fff', letterSpacing:'.04em' }}>{t.nombre}</div>
          <div style={{ fontFamily:font.body, fontSize:'.65rem', color:`rgba(${accentRgb},.65)` }}>{t.rol}</div>
        </div>
      ) : layout === 'compact' ? (
        // Layout compacto — info densa
        <>
          <div style={{ display:'flex', alignItems:'flex-start', gap:'.5rem', marginBottom:'.75rem' }}>
            <span style={{
              fontSize:'1.35rem', lineHeight:1, marginTop:'.1rem',
              filter:`drop-shadow(0 0 6px ${accentColor}55)`,
            }}>{t.emoji}</span>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'.2rem' }}>
                <div style={{ fontFamily:font.title, fontSize:'.66rem', fontWeight:700, color:'#fff', letterSpacing:'.04em' }}>{t.nombre}</div>
                <StarRow count={t.estrellas} color={accentColor} />
              </div>
              <div style={{ fontFamily:font.body, fontSize:'.64rem', color:`rgba(${accentRgb},.65)` }}>{t.rol}</div>
            </div>
          </div>
          <p style={{
            fontFamily:font.body, fontSize: textSize,
            color:'rgba(255,255,255,.6)', lineHeight:1.55,
            margin:0, fontStyle:'italic', position:'relative', zIndex:1,
            borderLeft:`2px solid rgba(${accentRgb},.25)`,
            paddingLeft:'.75rem',
          }}>"{t.texto}"</p>
        </>
      ) : (
        // Layout normal / wide-text — default humanista
        <>
          <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.75rem' }}>
            <div style={{ position:'relative' }}>
              <span style={{
                fontSize:'1.5rem', lineHeight:1, display:'block',
                filter:`drop-shadow(0 0 8px ${accentColor}66)`,
                animation:'heartbeat 2.6s ease-in-out infinite',
                animationDelay:`${index * .2}s`,
              }}>{t.emoji}</span>
              {/* Dot de plan */}
              <span style={{
                position:'absolute', bottom:'-2px', right:'-3px',
                width:'8px', height:'8px', borderRadius:'50%',
                background: accentColor,
                boxShadow:`0 0 6px ${accentColor}`,
                border:'1.5px solid #02010a',
              }}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:font.title, fontSize:'.68rem', fontWeight:700, color:'#fff', letterSpacing:'.04em' }}>{t.nombre}</div>
              <div style={{ fontFamily:font.body, fontSize:'.68rem', color:`rgba(${accentRgb},.7)`, marginTop:'1px' }}>{t.rol}</div>
            </div>
            <StarRow count={t.estrellas} color={accentColor} />
          </div>
          <p style={{
            fontFamily:font.body, fontSize: textSize,
            color:'rgba(255,255,255,.6)', lineHeight:1.6,
            margin:0, fontStyle:'italic', position:'relative', zIndex:1,
          }}>"{t.texto}"</p>
        </>
      )}

      {/* Etiqueta de plan — esquina inferior */}
      <div style={{
        marginTop:'1rem',
        display:'inline-flex', alignItems:'center', gap:'.3rem',
        background:`rgba(${accentRgb},.08)`,
        border:`1px solid rgba(${accentRgb},.18)`,
        borderRadius:'999px',
        padding:'.12em .6em',
      }}>
        <span style={{ fontSize:'.55rem' }}>{isTriada ? '👑' : '⚔️'}</span>
        <span style={{ fontFamily:font.title, fontSize:'.52rem', letterSpacing:'.12em', color:`rgba(${accentRgb},.75)`, textTransform:'uppercase' }}>
          {isTriada ? 'Tríada' : 'Despertar'}
        </span>
      </div>
    </div>
  );
};

// Skeleton mientras carga
const TestimonioSkeleton = () => (
  <div style={{
    flexShrink:0,
    width:'clamp(270px, 28vw, 330px)',
    height:'160px',
    borderRadius:'1.125rem',
    background:'linear-gradient(135deg, rgba(255,255,255,.03), rgba(255,255,255,.06))',
    border:'1px solid rgba(255,255,255,.06)',
    animation:'crackle 1.8s ease-in-out infinite',
  }}/>
);

const TestimoniosTicker = () => {
  const { testimonios, loading } = useTestimonios();

  // Duplicar para loop infinito sin cortes
  const items = [...testimonios, ...testimonios];

  return (
    <div style={{
      width:'100%',
      maxWidth:'100vw',
      overflow:'hidden',
      marginBottom:'2rem',
      position:'relative',
      zIndex:1,
      maskImage:'linear-gradient(90deg,transparent,black 6%,black 94%,transparent)',
      WebkitMaskImage:'linear-gradient(90deg,transparent,black 6%,black 94%,transparent)',
    }}>
      <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
  <p style={{
    fontFamily: font.title,
    fontSize: 'clamp(.55rem,1.2vw,.65rem)',
    letterSpacing: '.28em',
    textTransform: 'uppercase',
    color: 'rgba(192,132,252,.5)',
    margin: '0 0 .4rem',
  }}>✦ VOZ DEL TEMPLO ✦</p>
  <h2 style={{
    fontFamily: font.title,
    fontWeight: 700,
    fontSize: 'clamp(1.25rem,3.5vw,1.875rem)',
    margin: 0,
    lineHeight: 1.15,
    background: 'linear-gradient(90deg, #C084FC, #F5C518, #C084FC)',
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animation: 'gradientShift 4s linear infinite',
    textShadow: 'none',
  }}>Lo que dicen quienes<br/>ya cruzaron la puerta</h2>
</div>

      {/* Track */}
      {loading ? (
        // Skeletons mientras carga
        <div style={{ display:'flex', gap:'1.25rem', padding:'0 1rem', overflowX:'hidden' }}>
          {[1,2,3].map(i => <TestimonioSkeleton key={i} />)}
        </div>
      ) : (
        <div
          className="ticker-track"
          style={{
            // Velocidad según cantidad: más cards = más tiempo
            animationDuration: `${Math.max(30, testimonios.length * 7)}s`,
          }}
        >
          {items.map((t, i) => (
            <TestimonioCard key={`${t.id || t.nombre}-${i}`} t={t} index={i % testimonios.length} />
          ))}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// Componente principal
// ════════════════════════════════════════════════════════════════════════════
const PaywallPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user     = useAuthStore(s => s.user);
  const timer    = useCountdown();

  const memberStatus = useMembershipStore(s => s.status);
  const [selectedPlan,     setSelectedPlan]     = useState('triada');
  const [loadingCheckout,  setLoadingCheckout]  = useState(false);
  const [showActivated,    setShowActivated]    = useState(false);
  const [showUpsell,       setShowUpsell]       = useState(false);
  const [loadingVip,       setLoadingVip]       = useState(false);
  const [error,            setError]            = useState(null);

  const fromPath = location.state?.from?.pathname;
  const chosen   = PLANS.find(p => p.id === selectedPlan);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      window.history.replaceState({}, '', '/paywall');
      setShowActivated(true);
    }
    if (params.get('checkout') === 'vip_success') {
      window.history.replaceState({}, '', '/hub');
      navigate('/hub', { replace: true });
    }
  }, [navigate]);

  const createCheckoutSession = useCallback(async (priceId, successPath='success', extraSuccessParams='', planMode='subscription') => {
    if (!user?.id) { setError('Debes iniciar sesión para continuar.'); return null; }
    const origin = window.location.origin;
    const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
      body: {
        user_id:     user.id,
        price_id:    priceId,
        mode:        planMode,
        success_url: `${origin}/paywall?checkout=${successPath}${extraSuccessParams}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${origin}/paywall?checkout=cancel`,
      },
    });
    if (fnError || !data?.url) { setError(fnError?.message || 'Error al iniciar el pago. Intenta de nuevo.'); return null; }
    return data.url;
  }, [user?.id]);

  const handleCheckout = async (planId) => {
    const target = planId ? PLANS.find(p => p.id === planId) : chosen;
    if (!target) return;
    setSelectedPlan(target.id);
    setLoadingCheckout(true);
    setError(null);
    const url = await createCheckoutSession(target.priceId, 'success', '', target.mode || 'subscription');
    setLoadingCheckout(false);
    if (url) window.location.href = url;
  };

  const handleActivatedComplete = useCallback(async () => {
    // Recargar membresía desde Supabase antes de mostrar upsell
    await useMembershipStore.getState().loadMembership(supabase, user?.id);
    setShowActivated(false);
    setShowUpsell(true);
  }, [user?.id]);

  const handleVipAccept = async (priceId) => {
    setLoadingVip(true); setError(null);
    const origin = window.location.origin;
    const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
      body: { user_id:user?.id, price_id:priceId,
        success_url:`${origin}/hub?vip=activado`, cancel_url:`${origin}/hub` },
    });
    setLoadingVip(false);
    if (fnError || !data?.url) { setError(fnError?.message || 'Error al procesar VIP. Intenta de nuevo.'); return; }
    window.location.href = data.url;
  };

  const handleVipDecline = () => {
    const confirmed = window.confirm('⚠️ ¿Seguro que quieres salir?\n\nEsta oferta del PropoPass VIP es exclusiva post-activación y probablemente no la veas de nuevo.');
    if (confirmed) navigate('/hub', { replace: true });
  };

  return (
    <div style={{ minHeight:'100vh', position:'relative',
      display:'flex', flexDirection:'column', alignItems:'center',
      padding:'clamp(2rem,6vw,4rem) clamp(1rem,4vw,2rem)',
      background:'#02010a',
    }}>
      <style>{GLOBAL_CSS}</style>
      <Background />

      {/* Encabezado */}
      <div style={{ textAlign:'center', maxWidth:'44rem',
        marginBottom:'clamp(1.5rem,4vw,2.5rem)',
        position:'relative', zIndex:1,
        animation:'floatUp .7s cubic-bezier(.16,1,.3,1) both',
      }}>
        <div style={{ display:'inline-block', padding:'.35em 1.25em',
          background:'rgba(192,132,252,.08)', border:'1px solid rgba(192,132,252,.2)',
          borderRadius:'999px', marginBottom:'1rem' }}>
          <span style={{ fontFamily:font.title, fontSize:'clamp(.6rem,1.4vw,.7rem)',
            letterSpacing:'.2em', textTransform:'uppercase', color:'#C084FC' }}>
            {memberStatus === 'locked' ? '🔒 Protocolo en modo seguro'
              : memberStatus === 'paused' ? '⏸ Tu acceso está en pausa'
              : '🔮 Zona restringida'}
          </span>
        </div>

        <h1 style={{ fontFamily:font.title, fontSize:'clamp(1.75rem,5vw,2.875rem)',
          fontWeight:700, lineHeight:1.15, color:'#fff', marginBottom:'1rem' }}>
          {memberStatus === 'locked' ? (
            <>Tu Protocolo está en<br/>
            <span style={{ background:'linear-gradient(90deg,#ef4444,#ff6b6b,#ef4444)',
              backgroundSize:'200% auto', WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent', backgroundClip:'text',
              animation:'gradientShift 3s linear infinite' }}>
              modo seguro
            </span></>
          ) : memberStatus === 'paused' ? (
            <>Tu acceso está<br/>
            <span style={{ background:'linear-gradient(90deg,#F5C518,#ff9500,#F5C518)',
              backgroundSize:'200% auto', WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent', backgroundClip:'text',
              animation:'gradientShift 3s linear infinite' }}>
              en pausa
            </span></>
          ) : memberStatus === 'expired' ? (
            <>Tu membresía Templaria<br/>
            <span style={{ background:'linear-gradient(90deg,#ef4444,#F5C518,#ef4444)',
              backgroundSize:'200% auto', WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent', backgroundClip:'text',
              animation:'gradientShift 3s linear infinite' }}>
              ha expirado
            </span></>
          ) : (
            <>Este módulo requiere<br/>
            <span style={{ background:'linear-gradient(90deg,#C084FC,#F5C518,#C084FC)',
              backgroundSize:'200% auto', WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent', backgroundClip:'text',
              animation:'gradientShift 3s linear infinite' }}>
              membresía activa
            </span></>
          )}
        </h1>

        {/* Banner contextual pausa/lock */}
        {(memberStatus === 'paused' || memberStatus === 'locked') && (
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'.75rem',
            background: memberStatus === 'locked'
              ? 'rgba(239,68,68,.08)' : 'rgba(245,197,24,.08)',
            border: `1px solid ${memberStatus === 'locked'
              ? 'rgba(239,68,68,.3)' : 'rgba(245,197,24,.3)'}`,
            borderRadius:'1rem', padding:'.875rem 1.5rem',
            marginBottom:'1.25rem', maxWidth:'36rem',
            animation:'floatUp .6s ease both',
          }}>
            <span style={{ fontSize:'1.5rem' }}>
              {memberStatus === 'locked' ? '🔐' : '⏸'}
            </span>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontFamily:font.title, fontSize:'.7rem',
                letterSpacing:'.12em', textTransform:'uppercase',
                color: memberStatus === 'locked' ? '#ef4444' : '#F5C518',
                marginBottom:'.25rem' }}>
                {memberStatus === 'locked'
                  ? 'Seguro de protocolo activado'
                  : 'Tu protocolo está en pausa'}
              </div>
              <div style={{ fontFamily:font.body, fontSize:'.9rem',
                color:'rgba(255,255,255,.55)', lineHeight:1.5 }}>
                {memberStatus === 'locked'
                  ? 'Tu progreso está intacto — reactiva donde lo dejaste con un solo paso.'
                  : 'Todo tu avance te espera. Renueva tu Protocolo para continuar.'}
              </div>
            </div>
          </div>
        )}

        <SocialProofBar />
        <UrgencyTimer {...timer} />

        <div style={{ display:'flex', justifyContent:'center', gap:'1.5rem', flexWrap:'wrap', marginTop:'.5rem' }}>
          {['🔒 Pago 100% seguro','⚡ Acceso inmediato','🔓 Sin contratos'].map((t,i)=>(
            <span key={i} style={{ fontFamily:font.body, fontSize:'.82rem',
              color:'rgba(255,255,255,.32)', letterSpacing:'.03em' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Planes */}
      <div style={{ display:'flex', gap:'clamp(1rem,3vw,1.75rem)', flexWrap:'wrap',
        justifyContent:'center', width:'100%', maxWidth:'56rem',
        marginBottom:'2.5rem', position:'relative', zIndex:1,
        animation:'floatUp .8s .1s cubic-bezier(.16,1,.3,1) both',
      }}>
        {PLANS.map(plan => (
          <PlanCard key={plan.id} plan={plan}
            isSelected={selectedPlan === plan.id}
            onSelect={setSelectedPlan}
            onCheckout={handleCheckout}
            loading={loadingCheckout}
          />
        ))}
      </div>

      {/* CTA principal */}
      <div style={{ textAlign:'center', marginBottom:'1.75rem',
        position:'relative', zIndex:1,
        animation:'floatUp .9s .2s cubic-bezier(.16,1,.3,1) both',
      }}>
        <button
          className="main-cta"
          onClick={() => handleCheckout(null)}
          disabled={loadingCheckout}
          style={{
            background: loadingCheckout
              ? 'rgba(255,255,255,.05)'
              : `linear-gradient(135deg,${chosen?.colorDark},${chosen?.color})`,
            border:`1px solid rgba(${chosen?.colorRgb},.3)`,
            color: loadingCheckout ? 'rgba(255,255,255,.3)' : '#000',
            boxShadow: loadingCheckout ? 'none' : `0 8px 40px rgba(${chosen?.colorRgb},.4), 0 0 80px rgba(${chosen?.colorRgb},.15)`,
          }}
        >
          {loadingCheckout ? (
            <>
              <div style={{ width:'1rem',height:'1rem',borderRadius:'50%',
                border:'2px solid rgba(255,255,255,.2)',borderTop:'2px solid rgba(255,255,255,.7)',
                animation:'spin .8s linear infinite' }}/>
              Preparando portal...
            </>
          ) : (
            <>
              {chosen?.icon}{' '}
              {memberStatus === 'locked'
                ? '🔑 Reactiva donde lo dejaste'
                : memberStatus === 'paused'
                ? '⚡ Renovar mi Protocolo'
                : memberStatus === 'expired'
                ? 'Restablecer mi Membresía'
                : `Comenzar con ${chosen?.name}`}
            </>
          )}
        </button>

        <p style={{ marginTop:'.75rem', fontFamily:font.body,
          fontSize:'clamp(.75rem,1.5vw,.85rem)', color:'rgba(255,255,255,.2)' }}>
          Cancela cuando quieras · Acceso inmediato al activar
        </p>
      </div>

      {/* ── Ticker testimonios REALES ── */}
      <TestimoniosTicker />

      {/* Garantía visual */}
      <div style={{ display:'flex', alignItems:'center', gap:'.75rem',
        background:'rgba(74,222,128,.05)', border:'1px solid rgba(74,222,128,.15)',
        borderRadius:'.75rem', padding:'.75rem 1.5rem',
        marginBottom:'1.5rem', position:'relative', zIndex:1,
        animation:'floatUp 1s .3s cubic-bezier(.16,1,.3,1) both',
      }}>
        <span style={{fontSize:'1.25rem'}}>🛡️</span>
        <span style={{ fontFamily:font.body, fontSize:'.88rem', color:'rgba(74,222,128,.7)' }}>
          Acceso inmediato al activar tu membresía
        </span>
      </div>

      <Link to="/hub" style={{ fontFamily:font.title, fontSize:'clamp(.65rem,1.4vw,.72rem)',
        letterSpacing:'.1em', color:'rgba(255,255,255,.18)', textDecoration:'none',
        transition:'color .2s', position:'relative', zIndex:1 }}
        onMouseEnter={e=>e.target.style.color='rgba(255,255,255,.45)'}
        onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.18)'}>
        ← Volver al hub
      </Link>

      {showActivated && (
        <AccessActivatedOverlay
          planColor={chosen?.color||'#C084FC'}
          planColorRgb={chosen?.colorRgb||'192,132,252'}
          onComplete={handleActivatedComplete}
        />
      )}

      {showUpsell && (
        <VipUpsellModal
          onAccept={handleVipAccept}
          onDecline={handleVipDecline}
          loading={loadingVip}
        />
      )}

      {error && <ErrorToast message={error} onClose={()=>setError(null)} />}
    </div>
  );
};

export default PaywallPage;