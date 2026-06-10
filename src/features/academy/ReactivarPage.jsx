/**
 * ReactivarPage.jsx
 * Pantalla de reactivación de membresía.
 *
 * Se muestra cuando:
 *   - status === 'paused'  → menos de 32 días sin pagar → tono suave
 *   - status === 'locked'  → más de 32 días sin pagar   → tono urgente
 *
 * Rutas:
 *   /reactivar            → paused
 *   /reactivar?locked=true → locked
 *
 * Agregar en AppRouter.jsx:
 *   import ReactivarPage from './pages/ReactivarPage';
 *   <Route path="/reactivar" element={<ReactivarPage />} />
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import useMembershipStore from '../../store/useMembershipStore';

const STRIPE_PAUSED = 'https://buy.stripe.com/5kQ6oHgSbc0ac0uauAenS0p';
const STRIPE_LOCKED = 'https://buy.stripe.com/5kQ6oHgSbc0ac0uauAenS0p';

// ─── Partículas de fondo ──────────────────────────────────────────────────────
function Particles({ locked }) {
  const cv = useRef(null);
  useEffect(() => {
    const c = cv.current; if (!c) return;
    const ctx = c.getContext('2d');
    let raf;
    const pts = [];
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 120; i++) {
      pts.push({
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        r: Math.random() * 1.5 + 0.3,
        sp: Math.random() * 0.18 + 0.03,
        op: Math.random() * 0.4 + 0.08,
        ph: Math.random() * Math.PI * 2,
        col: locked
          ? (Math.random() > 0.5 ? '#ef4444' : '#7c3aed')
          : (Math.random() > 0.5 ? '#d4af37' : '#C084FC'),
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        p.y -= p.sp; p.ph += 0.008;
        if (p.y < -4) { p.y = c.height + 4; p.x = Math.random() * c.width; }
        ctx.globalAlpha = p.op * (0.6 + Math.sin(p.ph) * 0.4);
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [locked]);
  return <canvas ref={cv} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />;
}

// ─── Días pausado desde el store ─────────────────────────────────────────────
function useDaysPaused(userId) {
  const [days, setDays] = useState(null);
  useEffect(() => {
    if (!userId) return;
    import('../../services/supabase').then(({ supabase }) => {
      supabase
        .from('profiles')
        .select('paused_at')
        .eq('id', userId)
        .single()
        .then(({ data }) => {
          if (data?.paused_at) {
            const d = Math.floor((Date.now() - new Date(data.paused_at).getTime()) / (1000 * 60 * 60 * 24));
            setDays(d);
          }
        });
    });
  }, [userId]);
  return days;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ReactivarPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const locked = searchParams.get('locked') === 'true';
  const { user } = useAuthStore();
  const daysPaused = useDaysPaused(user?.id);
  const plan = useMembershipStore(s => s.plan);
  const { profile } = useAuthStore();
  const [hov, setHov] = useState(false);
  const [pulse, setPulse] = useState(false);

  const nombre = profile?.templario_name || profile?.email?.split('@')[0] || 'Templario';
  const stripeUrl = locked ? STRIPE_LOCKED : STRIPE_PAUSED;
  const precio = locked ? '$6.99' : '$6.99';

  const planLabel = plan === 'propotienda' ? 'Propotienda'
    : plan === 'crecimiento' ? 'Crecimiento'
    : plan ? plan.charAt(0).toUpperCase() + plan.slice(1)
    : 'Templario';

  // Pulso periódico en el botón CTA
  useEffect(() => {
    const t = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // ── Copy según estado ──────────────────────────────────────────────────────
  const copy = locked ? {
    badge: '⚠ Acceso suspendido',
    badgeColor: '#ef4444',
    headline: 'El Templo cerró sus puertas.',
    sub: 'Más de 32 días han pasado desde tu última renovación. Tu progreso sigue guardado — pero el camino está sellado.',
    body: 'Lo que construiste no desaparece. Tu avance, tus módulos, tu historia en el Templo — todo espera. Pero para continuar necesitas reabrir las puertas.',
    urgency: 'El Templo no borra lo que construiste. Reactiva por $6.99 y continúa desde donde lo dejaste.',
    cta: 'Reabrir el Templo',
    ctaGlow: 'rgba(239,68,68,0.6)',
    ctaBorder: '#ef4444',
    ctaColor: '#fca5a5',
    accent: '#ef4444',
    accentSoft: 'rgba(239,68,68,0.12)',
    icon: '🔒',
    note: 'Tu progreso y tu protocolo se mantienen intactos.',
  } : {
    badge: '⏸ Membresía en pausa',
    badgeColor: '#d4af37',
    headline: 'Tu camino te espera.',
    sub: 'Pausaste hace ' + (daysPaused !== null ? `${daysPaused} día${daysPaused !== 1 ? 's' : ''}` : 'poco tiempo') + '. El Templo guardó tu lugar.',
    body: 'No empiezas desde cero. Retomas exactamente desde donde lo dejaste — con tu protocolo, tu progreso y tu identidad intactos.',
    urgency: 'Tu protocolo sigue activo. Retoma hoy por $6.99.',
    cta: 'Continuar mi camino',
    ctaGlow: 'rgba(212,175,55,0.6)',
    ctaBorder: '#d4af37',
    ctaColor: '#fde68a',
    accent: '#d4af37',
    accentSoft: 'rgba(212,175,55,0.1)',
    icon: '⚔️',
    note: 'Retomas desde el punto exacto donde pausaste.',
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: locked
        ? 'linear-gradient(160deg, #0d0106 0%, #120208 40%, #0a0010 100%)'
        : 'linear-gradient(160deg, #02000c 0%, #060018 40%, #080020 100%)',
      color: '#fff',
      fontFamily: "'Raleway', sans-serif",
      position: 'relative',
      overflowX: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(24px, 5vw, 60px) clamp(16px, 4vw, 32px)',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Raleway:wght@300;400;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes rtvSweep { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes rtvPulse { 0%,100%{opacity:.55} 50%{opacity:1} }
        @keyframes rtvFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes rtvRing  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes rtvBtnPulse { 0%,100%{box-shadow:0 0 28px ${copy.ctaGlow}} 50%{box-shadow:0 0 55px ${copy.ctaGlow}, 0 0 90px ${copy.ctaGlow.replace('0.6','0.2')}} }
        @keyframes rtvShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
        @keyframes rtvFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rtvGlow { 0%,100%{filter:drop-shadow(0 0 12px ${copy.accent})} 50%{filter:drop-shadow(0 0 28px ${copy.accent}) drop-shadow(0 0 50px ${copy.accent}88)} }
      `}</style>

      <Particles locked={locked} />

      {/* Orbes de fondo */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '55vw', height: '55vw', borderRadius: '50%', background: `radial-gradient(circle, ${copy.accentSoft} 0%, transparent 65%)`, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-15%', right: '-8%', width: '40vw', height: '40vw', borderRadius: '50%', background: `radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 65%)`, pointerEvents: 'none', zIndex: 0 }} />

      {/* Card principal */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '520px',
        borderRadius: '28px',
        background: locked
          ? 'linear-gradient(155deg, rgba(239,68,68,0.1) 0%, rgba(8,3,26,0.98) 50%, rgba(2,0,12,1) 100%)'
          : 'linear-gradient(155deg, rgba(212,175,55,0.12) 0%, rgba(8,3,26,0.98) 50%, rgba(2,0,12,1) 100%)',
        border: `1px solid ${copy.accent}44`,
        boxShadow: `0 0 60px ${copy.accentSoft}, 0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 ${copy.accent}22`,
        padding: 'clamp(28px, 5vw, 48px)',
        animation: 'rtvFadeUp 0.6s ease both',
      }}>

        {/* Shimmer */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '28px',
          background: `linear-gradient(100deg, transparent 0%, ${copy.accentSoft} 45%, rgba(255,255,255,0.04) 50%, ${copy.accentSoft} 55%, transparent 100%)`,
          backgroundSize: '200% 200%',
          animation: 'rtvSweep 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Badge estado */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          padding: '5px 16px',
          borderRadius: '100px',
          background: `${copy.accent}18`,
          border: `1px solid ${copy.accent}55`,
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(7px, 1.4vw, 9px)',
          letterSpacing: '2.5px',
          color: copy.badgeColor,
          marginBottom: '28px',
          animation: 'rtvPulse 2.5s ease-in-out infinite',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: copy.badgeColor, boxShadow: `0 0 8px ${copy.badgeColor}` }} />
          {copy.badge}
        </div>

        {/* Ícono */}
        <div style={{
          fontSize: 'clamp(40px, 8vw, 56px)',
          marginBottom: '16px',
          display: 'block',
          animation: locked ? 'rtvShake 3s ease-in-out infinite' : 'rtvFloat 3.5s ease-in-out infinite',
          filter: `drop-shadow(0 0 20px ${copy.accent})`,
        }}>
          {copy.icon}
        </div>

        {/* Plan */}
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(6px, 1.2vw, 8px)',
          letterSpacing: '4px',
          color: `${copy.accent}88`,
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>
          Plan {planLabel} · {nombre}
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(26px, 5vw, 38px)',
          fontWeight: 900,
          lineHeight: 1.1,
          background: locked
            ? 'linear-gradient(135deg, #fca5a5 0%, #ef4444 40%, #fff 70%, #ef4444 100%)'
            : 'linear-gradient(135deg, #fde68a 0%, #d4af37 40%, #fff8dc 70%, #d4af37 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'rtvSweep 4s linear infinite',
          marginBottom: '12px',
        }}>
          {copy.headline}
        </h1>

        {/* Sub */}
        <p style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(11px, 2vw, 13px)',
          color: 'rgba(200,185,240,0.7)',
          lineHeight: 1.6,
          marginBottom: '20px',
          letterSpacing: '0.3px',
        }}>
          {copy.sub}
        </p>

        {/* Separador */}
        <div style={{
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${copy.accent}44, transparent)`,
          marginBottom: '20px',
        }} />

        {/* Body */}
        <p style={{
          fontFamily: "'Raleway', sans-serif",
          fontSize: 'clamp(13px, 2.2vw, 15px)',
          color: 'rgba(220,210,255,0.65)',
          lineHeight: 1.7,
          marginBottom: '28px',
        }}>
          {copy.body}
        </p>

        {/* Urgencia */}
        <p style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(11px, 2vw, 14px)',
          fontWeight: 700,
          color: copy.ctaColor,
          textShadow: `0 0 16px ${copy.accent}`,
          letterSpacing: '0.5px',
          marginBottom: '20px',
          lineHeight: 1.5,
          textAlign: 'center',
        }}>
          {copy.urgency}
        </p>

        {/* Precio */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          padding: '14px 18px',
          borderRadius: '14px',
          background: copy.accentSoft,
          border: `1px solid ${copy.accent}33`,
        }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(28px, 5vw, 36px)',
            fontWeight: 900,
            color: copy.ctaColor,
            textShadow: `0 0 20px ${copy.accent}`,
            lineHeight: 1,
          }}>
            {precio}
          </div>
          <div>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(8px, 1.5vw, 10px)',
              letterSpacing: '2px',
              color: `${copy.accent}cc`,
              marginBottom: '3px',
            }}>
              REACTIVACIÓN
            </div>
            <div style={{
              fontFamily: "'Raleway', sans-serif",
              fontSize: 'clamp(10px, 1.8vw, 12px)',
              color: 'rgba(200,185,240,0.45)',
            }}>
              Pago único · tu membresía continúa desde hoy
            </div>
          </div>
        </div>

        {/* CTA principal */}
        <button
          onClick={() => window.open(stripeUrl, '_blank')}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            width: '100%',
            padding: 'clamp(14px, 2.5vw, 18px)',
            borderRadius: '100px',
            background: hov
              ? `linear-gradient(135deg, ${copy.accent}55, ${copy.accent}33)`
              : `linear-gradient(135deg, ${copy.accent}44, ${copy.accent}22)`,
            border: `1.5px solid ${copy.ctaBorder}`,
            color: copy.ctaColor,
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(10px, 1.8vw, 13px)',
            fontWeight: 900,
            letterSpacing: '2.5px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            transform: hov ? 'translateY(-2px)' : 'none',
            animation: pulse ? 'rtvShake 0.5s ease' : 'rtvBtnPulse 3s ease-in-out infinite',
            boxShadow: hov
              ? `0 0 55px ${copy.ctaGlow}, 0 8px 30px rgba(0,0,0,0.4)`
              : `0 0 28px ${copy.ctaGlow}`,
            marginBottom: '16px',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            backgroundSize: '200% 200%',
            animation: 'rtvSweep 2s ease-in-out infinite',
          }} />
          <span style={{ position: 'relative', zIndex: 1 }}>
            ⚔ {copy.cta} →
          </span>
        </button>

        {/* Nota de garantía */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '24px',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', animation: 'rtvPulse 2s ease-in-out infinite' }} />
          <span style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(7px, 1.3vw, 9px)',
            letterSpacing: '2px',
            color: '#4ade8088',
          }}>
            {copy.note}
          </span>
        </div>

        {/* Separador */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
          marginBottom: '20px',
        }} />

        {/* Link de salida */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(200,185,240,0.3)',
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(7px, 1.2vw, 9px)',
              letterSpacing: '2px',
              cursor: 'pointer',
              transition: 'color 0.3s ease',
              padding: '8px',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(200,185,240,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(200,185,240,0.3)'; }}
          >
            Volver al inicio
          </button>
        </div>

      </div>
    </div>
  );
}