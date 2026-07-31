/**
 * RewardClaimGate.jsx  —  sugerido: src/features/academy/RewardClaimGate.jsx
 * ─────────────────────────────────────────────────────────────────────────
 * Pantalla de reclamo de premios del Ranking del Templo (7 días / 30 días).
 *
 * QUÉ HACE
 * ────────
 * Al montarse, revisa si el usuario tiene premios pendientes de reclamar
 * (tabla `pending_rewards`, categoría 'community_ranking', claimed=false).
 * Si tiene uno o más, bloquea TODO lo demás (no renderiza sus `children`)
 * y muestra una pantalla a pantalla completa, única para cada período
 * (7 días vs 30 días), con botón para reclamar y una animación de
 * celebración optimizada para gama baja (100% CSS, sin librerías,
 * sin canvas, sin loops JS pesados).
 *
 * Si el usuario tiene varios premios pendientes (p.ej. ganó el de 7d
 * y el de 30d al mismo tiempo), los muestra uno por uno en fila.
 *
 * Solo cuando ya no queda ningún premio pendiente, renderiza `children`
 * con total normalidad — así el usuario nunca "alcanza a ver" el Hub
 * antes de reclamar.
 *
 * DÓNDE MONTARLO (importante)
 * ────────────────────────────
 * Para que aparezca ANTES de que el usuario vea cualquier pantalla,
 * el lugar ideal es en tu router/App, envolviendo las rutas protegidas:
 *
 *   import RewardClaimGate from './features/academy/RewardClaimGate';
 *
 *   <RewardClaimGate>
 *     <Routes>
 *       <Route path="/hub" element={<CommunityHub />} />
 *       ...
 *     </Routes>
 *   </RewardClaimGate>
 *
 * Si por ahora no puedes tocar el router, la alternativa (funciona igual
 * de bien, solo que el "gate" vive un nivel más abajo) es envolver
 * directamente el return de CommunityHub:
 *
 *   return (
 *     <RewardClaimGate>
 *       <div className="community-hub"> ...todo tu JSX actual... </div>
 *     </RewardClaimGate>
 *   );
 *
 * No requiere props obligatorias: toma el usuario de useAuthStore,
 * igual que el resto de CommunityHub.jsx.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../services/supabase';

// ─── Paleta (idéntica a CommunityHub / AcademyHub) ─────────────────────────
const C = {
  gold:    '#F5C518',
  purple:  '#C084FC',
  green:   '#10B981',
  blue:    '#60A5FA',
  coral:   '#F97316',
  red:     '#EF4444',
};

// ─── Config visual por período ──────────────────────────────────────────────
const PERIOD_THEME = {
  '7d': {
    badge: '7 DÍAS',
    icon: '⚔️',
    title: '¡RONDA SEMANAL CONQUISTADA!',
    subtitle: 'Cerraste la semana entre los mejores Templarios de la comunidad',
    accent: C.purple,
    accent2: '#8B5CF6',
  },
  '30d': {
    badge: '30 DÍAS',
    icon: '👑',
    title: '¡CICLO MENSUAL DOMINADO!',
    subtitle: 'Un mes entero de esfuerzo te puso en la cima del Templo',
    accent: C.gold,
    accent2: '#D97706',
  },
};

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };
const ordinal = (n) => `${n}°`;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Confetti 100% CSS (sin JS por frame, sin canvas) ──────────────────────
const Confetti = ({ accent, accent2 }) => {
  const reduced = prefersReducedMotion();
  const pieces = useMemo(() => {
    const colors = [accent, accent2, C.gold, '#fff'];
    const count = reduced ? 0 : 16;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.6 + Math.random() * 1.1,
      size: 5 + Math.random() * 5,
      color: colors[i % colors.length],
      rotate: Math.random() * 360,
      drift: (Math.random() - 0.5) * 60,
    }));
  }, [accent, accent2, reduced]);

  if (!pieces.length) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {pieces.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-5%',
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            borderRadius: 1,
            opacity: 0.9,
            transform: `rotate(${p.rotate}deg)`,
            animation: `rewardConfettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
            '--drift': `${p.drift}px`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  );
};

// ─── Contador animado liviano (un solo rAF, se cancela al desmontar) ──────
const CountUp = ({ value, duration = 900, style }) => {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) { setDisplay(value); return; }
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => frameRef.current && cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <span style={style}>{display.toLocaleString('es-MX')}</span>;
};

// ═════════════════════════════════════════════════════════════════════════
export default function RewardClaimGate({ children }) {
  const user = useAuthStore(s => s.user);

  const [status, setStatus]   = useState('checking'); // checking | idle | active
  const [queue, setQueue]     = useState([]);
  const [phase, setPhase]     = useState('reveal');    // reveal | claiming | celebrating | error
  const [errorMsg, setErrorMsg] = useState('');
  const [claimResult, setClaimResult] = useState(null);

  const current = queue[0] || null;
  const theme = current ? (PERIOD_THEME[current.period] || PERIOD_THEME['7d']) : null;

  // ── Buscar premios pendientes al abrir la app ──────────────────────────
  useEffect(() => {
    if (!user?.id) { setStatus('idle'); return; }
    let cancelled = false;

    supabase
      .from('pending_rewards')
      .select('id, period, period_key, position, coins_reward, xp_reward, category')
      .eq('user_id', user.id)
      .eq('category', 'community_ranking')
      .eq('claimed', false)
      .order('period', { ascending: true })
      .order('position', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data || data.length === 0) {
          setStatus('idle');
          return;
        }
        setQueue(data);
        setPhase('reveal');
        setStatus('active');
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  const handleClaim = useCallback(async () => {
    if (!current) return;
    setPhase('claiming');
    setErrorMsg('');
    const { data, error } = await supabase.rpc('claim_reward', { p_reward_id: current.id });

    if (error || !data?.success) {
      setErrorMsg(data?.error || error?.message || 'No se pudo reclamar la recompensa. Intenta de nuevo.');
      setPhase('error');
      return;
    }
    setClaimResult(data);
    setPhase('celebrating');
  }, [current]);

  const handleContinue = useCallback(() => {
    setClaimResult(null);
    setQueue(prev => {
      const next = prev.slice(1);
      if (next.length === 0) {
        setStatus('idle');
      } else {
        setPhase('reveal');
      }
      return next;
    });
  }, []);

  // ── Mientras se revisa (muy breve, evita parpadeo del Hub) ─────────────
  if (status === 'checking') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'radial-gradient(circle at 50% 40%, #1a1030 0%, #0a0614 70%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: `2px solid ${C.purple}55`, borderTop: `2px solid ${C.gold}`,
          animation: 'rewardGateSpin 0.8s linear infinite',
        }} />
        <style>{`@keyframes rewardGateSpin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (status === 'idle' || !current) {
    return <>{children}</>;
  }

  const total = queue.length;
  const idxInQueue = 0; // siempre mostramos el primero de la fila

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: `radial-gradient(circle at 50% 30%, ${theme.accent}22 0%, rgba(6,4,14,0.97) 55%, #050308 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', overflowY: 'auto',
      }}>
        <div style={{
          position: 'relative', width: '100%', maxWidth: 440,
          background: 'linear-gradient(160deg, rgba(18,10,36,0.98), rgba(8,5,18,0.99))',
          border: `1.5px solid ${theme.accent}77`,
          borderRadius: '1.6rem',
          padding: '2.1rem 1.6rem 1.8rem',
          textAlign: 'center',
          boxShadow: `0 0 90px ${theme.accent}30, 0 0 0 1px rgba(255,255,255,0.03) inset`,
          animation: 'rewardCardPop 0.45s cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden',
        }}>
          {phase === 'celebrating' && <Confetti accent={theme.accent} accent2={theme.accent2} />}

          {/* Progreso si hay varios premios en fila */}
          {total > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: '0.9rem' }}>
              {Array.from({ length: total }, (_, i) => (
                <div key={i} style={{
                  width: i === idxInQueue ? 18 : 6, height: 6, borderRadius: 999,
                  background: i === idxInQueue ? theme.accent : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          )}

          {/* Badge de período */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${theme.accent}22`, border: `1px solid ${theme.accent}66`,
            borderRadius: 999, padding: '0.3em 0.9em', marginBottom: '0.9rem',
          }}>
            <span style={{
              fontFamily: '"Cinzel", serif', fontSize: '0.65rem', fontWeight: 700,
              letterSpacing: '0.12em', color: theme.accent,
            }}>RANKING · {theme.badge}</span>
          </div>

          {phase !== 'celebrating' ? (
            <>
              <p style={{
                fontSize: '3.4rem', margin: '0 0 0.6rem',
                filter: `drop-shadow(0 0 22px ${theme.accent})`,
                animation: phase === 'reveal' ? 'rewardIconFloat 2.6s ease-in-out infinite' : 'none',
              }}>{theme.icon}</p>

              <p style={{
                fontFamily: '"Cinzel", serif', fontWeight: 900,
                fontSize: '1.15rem', color: '#fff',
                margin: '0 0 0.4rem', letterSpacing: '0.04em', lineHeight: 1.3,
                textShadow: `0 0 24px ${theme.accent}88`,
              }}>{theme.title}</p>

              <p style={{
                fontFamily: '"Crimson Text", serif', fontSize: '0.98rem',
                color: 'rgba(255,255,255,0.72)', margin: '0 0 1.4rem', lineHeight: 1.5,
              }}>{theme.subtitle}</p>

              {/* Posición lograda */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.accent}44`,
                borderRadius: '0.9rem', padding: '0.7em 1.3em', marginBottom: '1.3rem',
              }}>
                <span style={{ fontSize: '1.6rem' }}>{MEDAL[current.position] || '🎖️'}</span>
                <span style={{
                  fontFamily: '"Cinzel", serif', fontSize: '0.95rem', fontWeight: 700,
                  color: theme.accent,
                }}>Posición {ordinal(current.position)} del Templo</span>
              </div>

              {/* Desglose de recompensa */}
              <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '1.6rem' }}>
                <RewardPill icon="💎" label="PropoCoins" value={current.coins_reward} color={C.gold} />
                <RewardPill icon="⚡" label="Experiencia" value={current.xp_reward} color={C.blue} />
              </div>

              {phase === 'error' && (
                <p style={{
                  fontFamily: '"Crimson Text", serif', fontSize: '0.85rem',
                  color: C.red, marginBottom: '1rem',
                }}>{errorMsg}</p>
              )}

              <button
                onClick={handleClaim}
                disabled={phase === 'claiming'}
                style={{
                  width: '100%', padding: '0.95em 1.2em',
                  background: `linear-gradient(135deg, ${theme.accent}44, ${theme.accent}20)`,
                  border: `1.5px solid ${theme.accent}`,
                  borderRadius: '0.75rem', color: '#fff',
                  fontFamily: '"Cinzel", serif', fontSize: '0.85rem', fontWeight: 700,
                  letterSpacing: '0.08em', cursor: phase === 'claiming' ? 'default' : 'pointer',
                  boxShadow: `0 0 28px ${theme.accent}55`,
                  opacity: phase === 'claiming' ? 0.75 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {phase === 'claiming' ? 'RECLAMANDO…' : phase === 'error' ? '⚜️ REINTENTAR ⚜️' : '⚜️ RECLAMAR RECOMPENSA ⚜️'}
              </button>
            </>
          ) : (
            <>
              <p style={{
                fontSize: '3.6rem', margin: '0.2rem 0 0.6rem',
                filter: `drop-shadow(0 0 26px ${theme.accent})`,
                animation: 'rewardBurst 0.6s cubic-bezier(0.34,1.56,0.64,1)',
              }}>🎉</p>

              <p style={{
                fontFamily: '"Cinzel", serif', fontWeight: 900,
                fontSize: '1.1rem', color: theme.accent,
                margin: '0 0 1.3rem', letterSpacing: '0.05em',
              }}>¡RECOMPENSA RECLAMADA!</p>

              <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '1.6rem' }}>
                <RewardPill icon="💎" label="PropoCoins" value={claimResult?.coins_won ?? current.coins_reward} color={C.gold} animated />
                <RewardPill icon="⚡" label="Experiencia" value={claimResult?.xp_won ?? current.xp_reward} color={C.blue} animated />
              </div>

              <p style={{
                fontFamily: '"Crimson Text", serif', fontSize: '0.88rem',
                color: 'rgba(255,255,255,0.6)', marginBottom: '1.4rem',
              }}>Tu esfuerzo esta semana quedó grabado en el Templo. Sigue sumando puntos para el próximo cierre.</p>

              <button
                onClick={handleContinue}
                style={{
                  width: '100%', padding: '0.95em 1.2em',
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
                  border: 'none', borderRadius: '0.75rem', color: '#0a0614',
                  fontFamily: '"Cinzel", serif', fontSize: '0.85rem', fontWeight: 800,
                  letterSpacing: '0.08em', cursor: 'pointer',
                  boxShadow: `0 0 30px ${theme.accent}66`,
                }}
              >
                {total > 1 ? 'SIGUIENTE PREMIO →' : 'CONTINUAR AL TEMPLO'}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes rewardCardPop {
          from { opacity: 0; transform: scale(0.92) translateY(14px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rewardIconFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes rewardBurst {
          0%   { opacity: 0; transform: scale(0.4); }
          60%  { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes rewardConfettiFall {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--drift), 340px) rotate(340deg); opacity: 0; }
        }
      `}</style>
    </>
  );
}

// ─── Pastilla de recompensa individual ─────────────────────────────────────
const RewardPill = ({ icon, label, value, color, animated }) => (
  <div style={{
    flex: 1, background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${color}44`, borderRadius: '0.85rem',
    padding: '0.8em 0.5em',
  }}>
    <p style={{ fontSize: '1.3rem', margin: '0 0 0.2rem' }}>{icon}</p>
    <p style={{
      fontFamily: '"Cinzel", serif', fontWeight: 800, fontSize: '1.05rem',
      color, margin: '0 0 0.15rem',
    }}>
      {animated
        ? <>+<CountUp value={value || 0} /></>
        : <>+{(value || 0).toLocaleString('es-MX')}</>}
    </p>
    <p style={{
      fontFamily: '"Crimson Text", serif', fontSize: '0.7rem',
      color: 'rgba(255,255,255,0.55)', margin: 0, letterSpacing: '0.03em',
    }}>{label}</p>
  </div>
);
