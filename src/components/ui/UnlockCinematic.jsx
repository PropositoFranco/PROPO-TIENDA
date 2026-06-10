import { useState, useEffect } from 'react';

function hexToRgb(hex = '#8b5cf6') {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export default function UnlockCinematic({ module, onDone }) {
  const [phase, setPhase] = useState(0);
  const c = hexToRgb(module?.color);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 650),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 2300),
      setTimeout(() => onDone?.(), 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const coins = Array.from({ length: 22 }, (_, i) => {
    const angle = (i / 22) * 360;
    const dist  = 80 + Math.random() * 100;
    const rad   = (angle * Math.PI) / 180;
    return {
      cx: Math.cos(rad) * dist,
      cy: Math.sin(rad) * dist,
      delay: i * 0.035,
    };
  });

  return (
    <div
      onClick={onDone}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: phase >= 1 ? 'rgba(4,3,10,0.97)' : 'rgba(0,0,0,0)',
        transition: 'background 0.5s ease',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      <style>{`
        @keyframes uc-coinFly {
          0%   { transform: translate(0,0) scale(1.2); opacity: 1; }
          100% { transform: translate(var(--cx), var(--cy)) scale(0); opacity: 0; }
        }
        @keyframes uc-cardFlip {
          0%   { transform: scale(0.2) rotateY(180deg) rotateZ(-12deg); opacity: 0; }
          50%  { transform: scale(1.18) rotateY(0deg) rotateZ(2deg); opacity: 1; filter: brightness(2.8); }
          75%  { transform: scale(0.94) rotateY(0deg) rotateZ(-1deg); }
          100% { transform: scale(1) rotateY(0deg) rotateZ(0deg); filter: brightness(1); }
        }
        @keyframes uc-shockwave {
          0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.9; }
          100% { transform: translate(-50%,-50%) scale(7); opacity: 0; }
        }
        @keyframes uc-textPop {
          0%   { transform: translateX(-50%) translateY(30px) scale(0.7); opacity: 0; }
          60%  { transform: translateX(-50%) translateY(-10px) scale(1.08); opacity: 1; }
          100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
        }
        @keyframes uc-rayRotate {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to   { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes uc-glowPulse {
          0%,100% { box-shadow: 0 0 40px rgba(${c.r},${c.g},${c.b},0.6), 0 0 80px rgba(${c.r},${c.g},${c.b},0.3); }
          50%     { box-shadow: 0 0 80px rgba(${c.r},${c.g},${c.b},1), 0 0 160px rgba(${c.r},${c.g},${c.b},0.5), 0 0 240px rgba(212,175,55,0.3); }
        }
        @keyframes uc-bounce {
          0%,100% { transform: translateY(0) scale(1); }
          50%     { transform: translateY(-14px) scale(1.15); }
        }
        @keyframes uc-skipFade {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes uc-rimLight {
          0%,100% { opacity: 0.4; } 50% { opacity: 1; }
        }
      `}</style>

      {/* ── GOD RAYS ── */}
      {phase >= 1 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: '1100px', height: '1100px',
          background: `conic-gradient(
            from 0deg,
            transparent 0deg, rgba(${c.r},${c.g},${c.b},0.13) 8deg, transparent 16deg,
            transparent 22deg, rgba(212,175,55,0.08) 30deg, transparent 38deg,
            transparent 44deg, rgba(${c.r},${c.g},${c.b},0.1) 52deg, transparent 60deg,
            transparent 65deg, rgba(99,179,237,0.06) 73deg, transparent 81deg
          )`,
          animation: 'uc-rayRotate 5s linear infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* ── SHOCKWAVES ── */}
      {phase >= 2 && (
        <>
          {[
            { color: `rgba(${c.r},${c.g},${c.b},0.85)`, delay: '0s',    width: 3 },
            { color: 'rgba(212,175,55,0.6)',              delay: '0.12s', width: 2 },
            { color: `rgba(${c.r},${c.g},${c.b},0.5)`,  delay: '0.25s', width: 1.5 },
          ].map((sw, i) => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: '200px', height: '200px', borderRadius: '50%',
              border: `${sw.width}px solid ${sw.color}`,
              animation: `uc-shockwave 0.75s ease-out ${sw.delay} forwards`,
              pointerEvents: 'none',
            }} />
          ))}
        </>
      )}

      {/* ── COINS ── */}
      {phase >= 2 && coins.map((coin, i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: '14px', height: '14px', borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #FFF9C4, #D4AF37 45%, #8B6914)',
          border: '1px solid rgba(255,235,100,0.8)',
          boxShadow: '0 0 10px rgba(212,175,55,0.9)',
          marginTop: '-7px', marginLeft: '-7px',
          '--cx': `${coin.cx}px`,
          '--cy': `${coin.cy}px`,
          animation: `uc-coinFly 0.85s ease-out ${coin.delay}s forwards`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* ── CARD ── */}
      {phase >= 2 && (
        <div style={{
          position: 'relative', zIndex: 10,
          width: 'clamp(220px, 32vw, 300px)',
          borderRadius: '18px', overflow: 'hidden',
          animation: 'uc-cardFlip 0.75s cubic-bezier(0.34,1.56,0.64,1) forwards, uc-glowPulse 1.5s ease-in-out 0.85s infinite',
          border: `2px solid rgba(${c.r},${c.g},${c.b},0.9)`,
        }}>
          <div style={{
            position: 'absolute', inset: '-1px', borderRadius: '19px', zIndex: 20,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.3), transparent 40%, rgba(255,255,255,0.08) 70%, transparent)',
            animation: 'uc-rimLight 2s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
          {module?.image ? (
            <img src={module.image} alt={module.title} style={{ width: '100%', display: 'block' }} />
          ) : (
            <div style={{
              height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.35), rgba(0,0,0,0.9))`,
              fontSize: '90px', position: 'relative',
            }}>
              {module?.icon || '🎒'}
            </div>
          )}
          <div style={{
            padding: '14px 16px', textAlign: 'center',
            background: `linear-gradient(180deg, rgba(${c.r},${c.g},${c.b},0.2), rgba(0,0,0,0.98))`,
            borderTop: `1px solid rgba(${c.r},${c.g},${c.b},0.4)`,
          }}>
            <div style={{
              fontFamily: "'Cinzel', 'Georgia', serif",
              fontSize: '13px', fontWeight: 900, letterSpacing: '2.5px',
              color: module?.color || '#a78bfa',
              textShadow: `0 0 20px rgba(${c.r},${c.g},${c.b},0.9)`,
            }}>
              {module?.title || 'MÓDULO'}
            </div>
            <div style={{
              fontSize: '9px', letterSpacing: '2px',
              color: 'rgba(212,175,55,0.7)', marginTop: '4px',
            }}>
              MÓDULO DESBLOQUEADO
            </div>
          </div>
        </div>
      )}

      {/* ── TEXTO ÉPICO ── */}
      {phase >= 3 && (
        <div style={{
          position: 'absolute', bottom: '23%', left: '50%',
          textAlign: 'center', pointerEvents: 'none',
          animation: 'uc-textPop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>
          <div style={{
            fontFamily: "'Cinzel', 'Georgia', serif",
            fontSize: 'clamp(20px, 3.5vw, 32px)',
            fontWeight: 900, letterSpacing: '5px', color: '#fff',
            textShadow: `0 0 25px rgba(${c.r},${c.g},${c.b},1), 0 0 50px rgba(${c.r},${c.g},${c.b},0.6)`,
            marginBottom: '10px',
          }}>
            ¡DESBLOQUEADO!
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            fontFamily: "'Cinzel', 'Georgia', serif",
            fontSize: '10px', letterSpacing: '3.5px',
            color: 'rgba(212,175,55,0.9)',
          }}>
            <span style={{ fontSize: '22px', display: 'inline-block', animation: 'uc-bounce 0.9s ease-in-out infinite' }}>🎒</span>
            <span>AÑADIDO A TU ARSENAL</span>
            <span style={{ fontSize: '22px', display: 'inline-block', animation: 'uc-bounce 0.9s ease-in-out 0.15s infinite' }}>🎒</span>
          </div>
        </div>
      )}

      {/* ── SKIP ── */}
      {phase >= 3 && (
        <div style={{
          position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
          fontFamily: "'Cinzel', 'Georgia', serif",
          fontSize: '8px', letterSpacing: '3px',
          color: 'rgba(255,255,255,0.22)',
          animation: 'uc-skipFade 0.6s 1.5s forwards', opacity: 0,
        }}>
          toca para continuar
        </div>
      )}
    </div>
  );
}