import { useEffect, useState, useRef } from 'react';
import { usePrizeStore } from '../store/usePrizeStore';
import { usePlayerStore } from '../store/usePlayerStore';

/* ─── Etiqueta de período ─── */
const PERIOD_LABEL = { '7d': '7 Días', '30d': '30 Días', 'all': 'Todo el Tiempo' };
const POSITION_LABEL = { 1: '1°', 2: '2°', 3: '3°' };
const POSITION_COLOR = {
  1: { glow: '#FFD700', from: '#FFD700', to: '#B8860B', text: '#FFF8DC', crown: '👑' },
  2: { glow: '#C0C0C0', from: '#E8E8E8', to: '#888', text: '#F0F0F0', crown: '🥈' },
  3: { glow: '#CD7F32', from: '#CD7F32', to: '#7B4510', text: '#FFE8D0', crown: '🥉' },
};

/* ─── Partícula individual ─── */
function Particle({ x, y, color, size, vx, vy, life }) {
  const style = {
    position: 'absolute',
    left: x,
    top: y,
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
    boxShadow: `0 0 ${size * 2}px ${color}`,
    opacity: life,
    pointerEvents: 'none',
    transform: `translate(${vx}px, ${vy}px)`,
    transition: 'all 0.05s linear',
  };
  return <div style={style} />;
}

/* ─── Sistema de partículas ─── */
function ParticleSystem({ active, colors }) {
  const [particles, setParticles] = useState([]);
  const frameRef = useRef(null);
  const idRef = useRef(0);

  useEffect(() => {
    if (!active) { setParticles([]); return; }

    const spawn = () => {
      const count = 6;
      const newP = Array.from({ length: count }, () => {
        idRef.current += 1;
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3;
        return {
          id: idRef.current,
          x: 30 + Math.random() * 40 + '%',
          y: 20 + Math.random() * 60 + '%',
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 3 + Math.random() * 6,
          vx: Math.cos(angle) * speed * 20,
          vy: Math.sin(angle) * speed * 20,
          life: 0.8 + Math.random() * 0.2,
        };
      });
      setParticles(prev => [...prev.slice(-60), ...newP]);
    };

    const decay = () => {
      setParticles(prev =>
        prev.map(p => ({ ...p, life: p.life - 0.02, vy: p.vy + 0.3 }))
          .filter(p => p.life > 0)
      );
    };

    const interval = setInterval(() => { spawn(); decay(); }, 50);
    return () => clearInterval(interval);
  }, [active, colors]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {particles.map(p => <Particle key={p.id} {...p} />)}
    </div>
  );
}

/* ─── Runas decorativas ─── */
function RuneRing({ visible }) {
  const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ'];
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      animation: visible ? 'runeRotate 8s linear infinite' : 'none',
      zIndex: 0,
    }}>
      {runes.map((r, i) => {
        const angle = (i / runes.length) * 360;
        const rad = (angle * Math.PI) / 180;
        const radius = 48;
        const x = 50 + Math.cos(rad) * radius;
        const y = 50 + Math.sin(rad) * radius;
        return (
          <span key={i} style={{
            position: 'absolute',
            left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%,-50%)',
            fontSize: 11,
            color: 'rgba(212,175,55,0.4)',
            fontFamily: 'serif',
            animation: `runePulse ${1.5 + i * 0.15}s ease-in-out infinite alternate`,
          }}>{r}</span>
        );
      })}
    </div>
  );
}

/* ─── COMPONENTE PRINCIPAL ─── */
export default function EpicPrizeClaimAnimation() {
  const { pendingReward, isClaiming, claimReward, clearPendingReward } = usePrizeStore();
  const { templarioName, cristales } = usePlayerStore();

  const [phase, setPhase] = useState('hidden'); // hidden → entering → idle → claiming → claimed → exiting
  const [claimed, setClaimed] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef(null);

  /* ── Cuando llega un premio pendiente → animar entrada ── */
  useEffect(() => {
    if (pendingReward && phase === 'hidden') {
      setPhase('entering');
      timerRef.current = setTimeout(() => setPhase('idle'), 600);
    }
    if (!pendingReward && phase !== 'claiming' && phase !== 'claimed') {
      setPhase('hidden');
    }
    return () => clearTimeout(timerRef.current);
  }, [pendingReward]);

  if (phase === 'hidden' && !pendingReward) return null;

  const reward = pendingReward;
  if (!reward) return null;

  const pos = reward.position ?? 1;
  const colors = POSITION_COLOR[pos] ?? POSITION_COLOR[1];
  const particleColors = [colors.from, colors.glow, '#ffffff', '#C084FC', '#60A5FA'];

  /* ── Handlers ── */
  const handleClaim = async () => {
    setPhase('claiming');
    setShowConfirm(false);
    const result = await claimReward();
    if (result) {
      setClaimed(result);
      setPhase('claimed');
      timerRef.current = setTimeout(() => {
        setPhase('exiting');
        timerRef.current = setTimeout(() => {
          setPhase('hidden');
          setClaimed(null);
        }, 600);
      }, 3500);
    } else {
      setPhase('idle');
    }
  };

  const handleDismiss = () => {
    setPhase('exiting');
    timerRef.current = setTimeout(() => {
      clearPendingReward();
      setPhase('hidden');
    }, 500);
  };

  /* ── Estilos de animación según fase ── */
  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 99999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(5,2,15,0.88)',
    backdropFilter: 'blur(8px)',
    transition: 'opacity 0.5s ease',
    opacity: phase === 'entering' || phase === 'exiting' ? 0 : 1,
  };

  const cardStyle = {
    position: 'relative',
    width: 'clamp(320px, 90vw, 480px)',
    background: 'linear-gradient(160deg, #0d0618 0%, #1a0d35 50%, #0a0614 100%)',
    border: `1px solid ${colors.glow}55`,
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: `0 0 60px ${colors.glow}33, 0 0 120px ${colors.glow}18, inset 0 1px 0 ${colors.glow}22`,
    transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease',
    transform: phase === 'entering' ? 'scale(0.6) translateY(40px)' : phase === 'exiting' ? 'scale(0.8) translateY(-20px)' : 'scale(1) translateY(0)',
    opacity: phase === 'entering' || phase === 'exiting' ? 0 : 1,
  };

  return (
    <>
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes runeRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes runePulse { from { opacity:0.2; } to { opacity:0.7; } }
        @keyframes goldPulse {
          0%,100% { box-shadow: 0 0 20px ${colors.glow}44, 0 0 60px ${colors.glow}22; }
          50%      { box-shadow: 0 0 40px ${colors.glow}88, 0 0 100px ${colors.glow}44; }
        }
        @keyframes coinSpin { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes floatUp {
          0%   { transform: translateY(0px);    opacity:1; }
          100% { transform: translateY(-30px);  opacity:0; }
        }
        @keyframes crownBounce {
          0%,100% { transform: translateY(0) scale(1); }
          50%     { transform: translateY(-6px) scale(1.1); }
        }
        @keyframes epicEntrance {
          0%   { letter-spacing: -2px; opacity:0; }
          100% { letter-spacing: 4px;  opacity:1; }
        }
        @keyframes sealGlow {
          0%,100% { opacity:0.6; transform:scale(1) rotate(0deg); }
          50%     { opacity:1;   transform:scale(1.05) rotate(180deg); }
        }
      `}</style>

      <div style={overlayStyle}>
        <div style={cardStyle}>

          {/* ── Partículas ── */}
          <ParticleSystem active={phase === 'idle' || phase === 'claimed'} colors={particleColors} />

          {/* ── Runas ── */}
          {phase !== 'claiming' && <RuneRing visible={true} />}

          {/* ── Banda superior de color ── */}
          <div style={{
            height: 4,
            background: `linear-gradient(90deg, transparent, ${colors.from}, ${colors.glow}, ${colors.from}, transparent)`,
            animation: 'shimmer 2s linear infinite',
            backgroundSize: '200% auto',
          }} />

          {/* ── Contenido ── */}
          <div style={{ position: 'relative', zIndex: 2, padding: '28px 32px 32px' }}>

            {/* Corona y posición */}
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <span style={{
                fontSize: 48,
                display: 'inline-block',
                animation: 'crownBounce 1.8s ease-in-out infinite',
                filter: `drop-shadow(0 0 12px ${colors.glow})`,
              }}>{colors.crown}</span>
            </div>

            {/* Título épico */}
            <div style={{
              textAlign: 'center',
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(10px, 2.5vw, 13px)',
              letterSpacing: 4,
              color: colors.glow,
              textTransform: 'uppercase',
              marginBottom: 4,
              opacity: 0.8,
            }}>
              {PERIOD_LABEL[reward.period] ?? reward.period}
            </div>

            <h2 style={{
              textAlign: 'center',
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(18px, 4vw, 26px)',
              fontWeight: 900,
              letterSpacing: 3,
              color: colors.text,
              margin: '0 0 4px',
              textShadow: `0 0 20px ${colors.glow}88`,
              animation: phase === 'idle' ? 'epicEntrance 0.8s ease forwards' : 'none',
            }}>
              {POSITION_LABEL[pos] ?? `${pos}°`} LUGAR
            </h2>

            <p style={{
              textAlign: 'center',
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(10px, 2vw, 12px)',
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: 2,
              margin: '0 0 24px',
            }}>RANKING · {PERIOD_LABEL[reward.period] ?? ''}</p>

            {/* Separador ornamental */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
              <div style={{ flex:1, height:1, background:`linear-gradient(90deg, transparent, ${colors.glow}55)` }} />
              <span style={{ color: colors.glow, fontSize: 14, opacity:0.7 }}>✦</span>
              <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${colors.glow}55, transparent)` }} />
            </div>

            {/* Premio — monedas */}
            {phase !== 'claimed' ? (
              <div style={{
                textAlign: 'center',
                marginBottom: 28,
                padding: '20px 16px',
                background: `linear-gradient(135deg, ${colors.glow}11, ${colors.from}08)`,
                borderRadius: 14,
                border: `1px solid ${colors.glow}33`,
                animation: 'goldPulse 2.5s ease-in-out infinite',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
                  <span style={{
                    fontSize: 36,
                    display: 'inline-block',
                    animation: 'coinSpin 3s linear infinite',
                    filter: `drop-shadow(0 0 8px ${colors.glow})`,
                  }}>🪙</span>
                  <div>
                    <div style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: 'clamp(32px, 8vw, 48px)',
                      fontWeight: 900,
                      background: `linear-gradient(135deg, ${colors.from}, ${colors.glow}, ${colors.from})`,
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      animation: 'shimmer 2s linear infinite',
                      lineHeight: 1,
                    }}>
                      {(reward.coins_reward ?? 0).toLocaleString()}
                    </div>
                    <div style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: 11,
                      letterSpacing: 3,
                      color: 'rgba(255,255,255,0.5)',
                      marginTop: 2,
                    }}>PROPOCOINS</div>
                  </div>
                </div>

                {reward.prize_label && (
                  <div style={{
                    marginTop: 12,
                    fontFamily: "'Crimson Text', serif",
                    fontSize: 15,
                    color: 'rgba(255,255,255,0.6)',
                    fontStyle: 'italic',
                  }}>"{reward.prize_label}"</div>
                )}
              </div>
            ) : (
              /* ── Fase CLAIMED ── */
              <div style={{ textAlign:'center', marginBottom:28 }}>
                <div style={{
                  fontSize: 56,
                  marginBottom: 8,
                  animation: 'crownBounce 0.6s ease',
                  filter: `drop-shadow(0 0 20px ${colors.glow})`,
                }}>✨</div>
                <div style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(14px, 3vw, 18px)',
                  fontWeight: 700,
                  color: colors.text,
                  letterSpacing: 2,
                  marginBottom: 6,
                }}>¡PREMIO RECLAMADO!</div>
                <div style={{
                  fontFamily: "'Crimson Text', serif",
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.5)',
                }}>
                  Nuevo saldo: <span style={{ color: colors.glow, fontWeight: 700 }}>
                    {(claimed?.new_balance ?? cristales).toLocaleString()} 🪙
                  </span>
                </div>
              </div>
            )}

            {/* Nombre del templario */}
            {templarioName && (
              <div style={{
                textAlign: 'center',
                fontFamily: "'Cinzel', serif",
                fontSize: 12,
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: 2,
                marginBottom: 20,
              }}>
                ⚔️ {templarioName.toUpperCase()}
              </div>
            )}

            {/* ── Botones ── */}
            {phase === 'idle' && !showConfirm && (
              <div style={{ display:'flex', gap:10 }}>
                <button
                  onClick={() => setShowConfirm(true)}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    borderRadius: 12,
                    border: `1px solid ${colors.glow}66`,
                    background: `linear-gradient(135deg, ${colors.from}cc, ${colors.to}cc)`,
                    color: phase === 'idle' ? (pos === 1 ? '#1a0a00' : '#fff') : '#fff',
                    fontFamily: "'Cinzel', serif",
                    fontSize: 'clamp(10px, 2.5vw, 13px)',
                    fontWeight: 900,
                    letterSpacing: 2,
                    cursor: 'pointer',
                    boxShadow: `0 4px 24px ${colors.glow}44`,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  ⚔️ RECLAMAR PREMIO
                </button>
                <button
                  onClick={handleDismiss}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.4)',
                    fontFamily: "'Cinzel', serif",
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                >
                  Después
                </button>
              </div>
            )}

            {/* Confirmación */}
            {showConfirm && phase === 'idle' && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${colors.glow}33`,
                borderRadius: 12,
                padding: '16px',
                textAlign: 'center',
              }}>
                <p style={{
                  fontFamily: "'Crimson Text', serif",
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.7)',
                  margin: '0 0 14px',
                }}>
                  ¿Confirmas reclamar{' '}
                  <span style={{ color: colors.glow, fontWeight: 700 }}>
                    {(reward.coins_reward ?? 0).toLocaleString()} PropoCoins
                  </span>?
                </p>
                <div style={{ display:'flex', gap:8 }}>
                  <button
                    onClick={handleClaim}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 10,
                      border: `1px solid ${colors.glow}66`,
                      background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                      color: pos === 1 ? '#1a0a00' : '#fff',
                      fontFamily: "'Cinzel', serif",
                      fontSize: 12,
                      fontWeight: 900,
                      letterSpacing: 1,
                      cursor: 'pointer',
                    }}
                  >✅ SÍ, RECLAMAR</button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.5)',
                      fontFamily: "'Cinzel', serif",
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >✗ CANCELAR</button>
                </div>
              </div>
            )}

            {/* Reclamando... */}
            {phase === 'claiming' && (
              <div style={{ textAlign:'center', padding:'8px 0' }}>
                <div style={{
                  display: 'inline-flex', alignItems:'center', gap:10,
                  fontFamily: "'Cinzel', serif",
                  fontSize: 13,
                  color: colors.glow,
                  letterSpacing: 2,
                }}>
                  <span style={{ animation:'coinSpin 1s linear infinite', display:'inline-block' }}>⚙️</span>
                  PROCESANDO...
                </div>
              </div>
            )}

          </div>

          {/* ── Banda inferior ── */}
          <div style={{
            height: 3,
            background: `linear-gradient(90deg, transparent, ${colors.glow}44, transparent)`,
          }} />
        </div>
      </div>
    </>
  );
}