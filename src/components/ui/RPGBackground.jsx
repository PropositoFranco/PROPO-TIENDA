import { useEffect, useRef, useMemo } from 'react';

/**
 * RPG Background — castle silhouette, stars, particles, portal glow.
 * Used by login, register, and auth pages.
 */
export default function RPGBackground() {
  const canvasRef = useRef(null);
  const stars = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 70,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 2,
    })), []
  );

  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 6,
      color: ['rgba(212,175,55,0.6)', 'rgba(160,100,255,0.5)', 'rgba(255,255,255,0.3)'][
        Math.floor(Math.random() * 3)
      ],
    })), []
  );

  return (
    <>
      {/* Layer 1: Dark gradient background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#060310] via-[#0a0820] to-[#080615]" />

      {/* Layer 2: Radial accent gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, transparent 60%),
            radial-gradient(ellipse at 20% 80%, #0d1f3c 0%, transparent 50%),
            radial-gradient(ellipse at 80% 60%, #1a0a2e 0%, transparent 50%)
          `,
        }} />
      </div>

      {/* Layer 3: Castle silhouette */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Towers */}
        {[
          { cls: 'w-[60px] h-[120px] left-[15%] opacity-60', bottom: '30%' },
          { cls: 'w-[80px] h-[180px] left-[30%] opacity-70', bottom: '28%' },
          { cls: 'w-[100px] h-[250px] left-[45%] opacity-80', bottom: '25%' },
          { cls: 'w-[80px] h-[160px] right-[30%] opacity-70', bottom: '28%' },
          { cls: 'w-[60px] h-[110px] right-[15%] opacity-50', bottom: '30%' },
        ].map((t, i) => (
          <div
            key={i}
            className={`absolute bottom-0 ${t.cls}`}
            style={{
              bottom: t.bottom,
              background: 'linear-gradient(180deg, #1a1030 0%, #0d0820 100%)',
              borderRadius: '4px 4px 0 0',
            }}
          >
            {/* Tower spire */}
            <div
              className="absolute top-[-20px] left-1/2 -translate-x-1/2"
              style={{
                borderLeft: '15px solid transparent',
                borderRight: '15px solid transparent',
                borderBottom: '20px solid #2a1845',
              }}
            />
          </div>
        ))}
        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[60%]"
          style={{ background: 'linear-gradient(to top, #060310 20%, transparent 100%)' }}
        />
      </div>

      {/* Layer 4: Stars */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Layer 5: Floating particles */}
      <div className="fixed inset-0 z-1 pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              bottom: '-10px',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              animation: `particleFloat ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Layer 6: Portal ring glow */}
      <div
        className="fixed bottom-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none z-1"
        style={{
          background: 'radial-gradient(circle, rgba(160,100,255,0.06) 0%, transparent 70%)',
          animation: 'portalPulse 4s ease-in-out infinite',
        }}
      />
    </>
  );
}
