/**
 * ActivateToolButton.jsx
 * Botón épico "ACTIVAR HERRAMIENTA" que aparece en ModuleDetail
 * cuando el usuario ya posee el producto del store.
 * 
 * USO: Importar en TempleStorePage dentro de <ModuleDetail>
 * y renderizarlo solo cuando ownedIds.has(module.id)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORY_CONFIG = {
  claves:    { label: 'ACTIVAR CLAVE',    icon: '🗝', color: '#F59E0B', verb: 'Abre la clave' },
  victorias: { label: 'ACTIVAR VICTORIA', icon: '⚡', color: '#10B981', verb: 'Inicia la victoria' },
  mapas:     { label: 'EXPLORAR MAPA',    icon: '🗺', color: '#8B5CF6', verb: 'Abre el mapa' },
};

export default function ActivateToolButton({ module }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const cat  = CATEGORY_CONFIG[module.category] || { label: 'ABRIR HERRAMIENTA', icon: '✦', color: '#E2E8F0', verb: 'Abre' };
  const slug = module.slug || module.id;

  const handleActivate = () => {
    setClicked(true);
    setTimeout(() => navigate(`/tool/${slug}`), 280);
  };

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return { r, g, b };
  };
  const c = hexToRgb(cat.color);

  return (
    <>
      <style>{`
        @keyframes atbSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes atbPulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
        @keyframes atbRipple { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.5);opacity:0} }
        @keyframes atbSlideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes atbShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes atbIconBounce { 0%,100%{transform:scale(1) rotate(0deg)} 25%{transform:scale(1.18) rotate(-8deg)} 75%{transform:scale(1.18) rotate(8deg)} }
      `}</style>

      <div style={{ animation: 'atbSlideIn 0.4s ease', marginTop: '4px' }}>
        {/* Label encima */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '10px',
        }}>
          <div style={{
            flex: 1, height: '1px',
            background: `linear-gradient(90deg, transparent, rgba(${c.r},${c.g},${c.b},0.4))`,
          }} />
          <span style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '8px', letterSpacing: '2.5px',
            color: `rgba(${c.r},${c.g},${c.b},0.7)`,
            textTransform: 'uppercase',
          }}>HERRAMIENTA DESBLOQUEADA</span>
          <div style={{
            flex: 1, height: '1px',
            background: `linear-gradient(90deg, rgba(${c.r},${c.g},${c.b},0.4), transparent)`,
          }} />
        </div>

        {/* Botón principal */}
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            position: 'relative',
            borderRadius: '14px',
            padding: '2px',
            overflow: 'hidden',
            transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
            transform: clicked ? 'scale(0.96)' : hovered ? 'scale(1.035)' : 'scale(1)',
            boxShadow: hovered
              ? `0 0 50px rgba(${c.r},${c.g},${c.b},0.5), 0 0 100px rgba(${c.r},${c.g},${c.b},0.2), 0 8px 30px rgba(0,0,0,0.5)`
              : `0 0 30px rgba(${c.r},${c.g},${c.b},0.2), 0 4px 20px rgba(0,0,0,0.4)`,
            cursor: 'pointer',
          }}
        >
          {/* Spinning border */}
          <div style={{
            position: 'absolute', top: '-100%', left: '-100%',
            width: '300%', height: '300%',
            background: `conic-gradient(from 0deg,
              transparent 0deg,
              rgba(${c.r},${c.g},${c.b},0.3) 30deg,
              rgba(${c.r},${c.g},${c.b},0.9) 65deg,
              rgba(255,255,255,0.95) 90deg,
              rgba(${c.r},${c.g},${c.b},0.9) 115deg,
              rgba(${c.r},${c.g},${c.b},0.3) 150deg,
              transparent 200deg)`,
            animation: `atbSpin ${hovered ? '1s' : '2.5s'} linear infinite`,
          }} />

          <button
            onClick={handleActivate}
            style={{
              position: 'relative',
              width: '100%',
              padding: '18px 0',
              background: hovered
                ? `linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.22), rgba(${c.r},${c.g},${c.b},0.1))`
                : `linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.15), rgba(${c.r},${c.g},${c.b},0.06))`,
              border: 'none',
              borderRadius: '12px',
              color: cat.color,
              fontFamily: "'Cinzel', serif",
              fontSize: '12px',
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.3s ease',
              overflow: 'hidden',
            }}
          >
            {/* Shimmer sweep */}
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(105deg, transparent 35%, rgba(${c.r},${c.g},${c.b},0.2) 50%, transparent 65%)`,
              backgroundSize: '200% 100%',
              animation: hovered ? 'atbShimmer 1.2s ease-in-out infinite' : 'none',
            }} />

            {/* Ripple on click */}
            {clicked && (
              <div style={{
                position: 'absolute',
                width: '200px', height: '200px',
                borderRadius: '50%',
                background: `rgba(${c.r},${c.g},${c.b},0.3)`,
                animation: 'atbRipple 0.6s ease-out forwards',
              }} />
            )}

            <span style={{
              fontSize: '22px',
              filter: `drop-shadow(0 0 8px ${cat.color})`,
              animation: hovered ? 'atbIconBounce 0.6s ease-in-out infinite' : 'none',
              position: 'relative', zIndex: 1,
            }}>{cat.icon}</span>

            <span style={{ position: 'relative', zIndex: 1 }}>{cat.label}</span>

            {/* Arrow */}
            <span style={{
              position: 'relative', zIndex: 1,
              fontSize: '14px',
              opacity: hovered ? 1 : 0.4,
              transition: 'all 0.3s ease',
              transform: hovered ? 'translateX(4px)' : 'translateX(0)',
            }}>→</span>
          </button>
        </div>

        {/* Hint text */}
        <div style={{
          textAlign: 'center',
          marginTop: '8px',
          fontFamily: "'Cinzel', serif",
          fontSize: '8px',
          letterSpacing: '1.5px',
          color: `rgba(${c.r},${c.g},${c.b},0.4)`,
        }}>
          {cat.verb} en pantalla completa
        </div>
      </div>
    </>
  );
}