/**
 * AcademyHub.jsx
 * Hub principal de la Academia de Crecimiento Personal.
 *
 * Muestra:
 *  - Módulo de la semana actual (destacado, call-to-action)
 *  - Módulos ya abiertos (historial del usuario)
 *  - Módulos bloqueados (con semana de desbloqueo)
 *  - Progreso general con barra épica
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import RitualAnalysis from './RitualAnalysis';
import useMembershipStore, {
  ACADEMY_MODULES,
  MODULE_TYPE_CONFIG,
  selectCurrentModule,
  selectOpenedModules,
  selectProgress,
} from '../../store/useMembershipStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { supabase } from '../../services/supabase';
// ─── Tarjeta del módulo semanal (hero) ───────────────────────────────────────
const CurrentModuleHero = ({ module, isCompleted }) => {
  const cfg = MODULE_TYPE_CONFIG[module.type];
  return (
    <Link
      to={`/academia/${module.slug}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '1.25rem',
        border: `1px solid ${cfg.color}44`,
        background: `radial-gradient(ellipse at 70% 40%, ${cfg.color}18 0%, transparent 70%), rgba(255,255,255,0.03)`,
        padding: 'clamp(1.5rem, 5vw, 2.5rem)',
        marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${cfg.color}88`;
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 20px 60px ${cfg.color}22`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = `${cfg.color}44`;
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Etiqueta "Esta semana" */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.3em 0.85em',
        background: `${cfg.color}22`,
        border: `1px solid ${cfg.color}44`,
        borderRadius: '999px',
        marginBottom: '1.25rem',
      }}>
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: cfg.color,
          boxShadow: `0 0 8px ${cfg.color}`,
          animation: 'heroPulse 2s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: '"Cinzel", serif',
          fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: cfg.color,
        }}>Módulo activo · Semana {module.week}</span>
      </div>

      {/* Icono grande */}
      <div style={{
        position: 'absolute', right: 'clamp(1rem, 4vw, 2rem)', top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 'clamp(3rem, 8vw, 5rem)',
        opacity: 0.15,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>{cfg.icon}</div>

      <h2 style={{
        fontFamily: '"Cinzel", serif',
        fontSize: 'clamp(1.25rem, 4vw, 2rem)',
        fontWeight: 700,
        color: '#fff',
        lineHeight: 1.2,
        marginBottom: '0.5rem',
        maxWidth: '75%',
      }}>{module.title}</h2>

      <p style={{
        fontFamily: '"Crimson Text", serif',
        fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: '1.5rem',
        maxWidth: '65%',
      }}>{module.subtitle}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4em',
          padding: '0.6em 1.5em',
          background: cfg.color,
          borderRadius: '0.5rem',
          color: '#000',
          fontFamily: '"Cinzel", serif',
          fontWeight: 700,
          fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {isCompleted ? '✓ Revisitar' : '▶ Comenzar ahora'}
        </span>
        <span style={{
          fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)',
          color: 'rgba(255,255,255,0.35)',
          fontFamily: '"Cinzel", serif',
        }}>+{module.xpReward} XP · {module.duration}</span>
      </div>

      <style>{`@keyframes heroPulse {
        0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)}
      }`}</style>
    </Link>
  );
};

// ─── Tarjeta de módulo en grid ────────────────────────────────────────────────
const ModuleCard = ({ module, state }) => {
  const cfg = MODULE_TYPE_CONFIG[module.type];
  const isLocked = state === 'locked';

  if (isLocked) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
        borderRadius: '1rem',
        border: '1px solid rgba(192,132,252,0.12)',
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(192,132,252,0.07) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 100%, rgba(124,58,237,0.06) 0%, transparent 50%),
          linear-gradient(160deg, rgba(15,11,30,0.95) 0%, rgba(10,6,20,0.98) 100%)
        `,
        padding: 'clamp(1rem, 3vw, 1.25rem)',
        cursor: 'default',
        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: '0 0 0px rgba(192,132,252,0)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(192,132,252,0.28)';
        e.currentTarget.style.boxShadow = '0 0 30px rgba(192,132,252,0.08), inset 0 1px 0 rgba(255,255,255,0.04)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(192,132,252,0.12)';
        e.currentTarget.style.boxShadow = '0 0 0px rgba(192,132,252,0)';
        e.currentTarget.style.transform = 'none';
      }}
      >
        <style>{`
          @keyframes lockPulse {
            0%,100%{opacity:0.4;transform:scale(1);}
            50%{opacity:0.75;transform:scale(1.08);}
          }
          @keyframes lockedShimmer {
            0%{background-position:-200% center;}
            100%{background-position:200% center;}
          }
          @keyframes lockedOrb {
            0%,100%{opacity:0.3;transform:translate(0,0) scale(1);}
            50%{opacity:0.6;transform:translate(2px,-3px) scale(1.05);}
          }
        `}</style>

        {/* Orbe de fondo misterioso */}
        <div style={{
          position:'absolute', top:'-40%', right:'-20%',
          width:'70%', height:'70%', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          pointerEvents:'none', animation:'lockedOrb 6s ease-in-out infinite',
        }}/>

        {/* Borde superior sutil */}
        <div style={{
          position:'absolute', top:0, left:'20%', right:'20%', height:1,
          background:'linear-gradient(90deg, transparent, rgba(192,132,252,0.3), transparent)',
          pointerEvents:'none',
        }}/>

        {/* Header: candado + semana */}
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'flex-start',
          marginBottom:'0.875rem',
        }}>
          <div style={{ position:'relative', display:'inline-block' }}>
            <span style={{
              fontSize:'clamp(1.1rem, 2.5vw, 1.3rem)',
              display:'block', lineHeight:1,
              filter:'drop-shadow(0 0 6px rgba(192,132,252,0.4))',
              animation:'lockPulse 4s ease-in-out infinite',
            }}>🔒</span>
          </div>
          <span style={{
            fontSize:'clamp(0.55rem, 1.1vw, 0.6rem)',
            fontFamily:'"Cinzel", serif',
            letterSpacing:'0.15em',
            textTransform:'uppercase',
            color:`${cfg.color}55`,
            background:`${cfg.color}0d`,
            border:`1px solid ${cfg.color}20`,
            borderRadius:'999px',
            padding:'0.2em 0.6em',
          }}>🔒 Sellado</span>
        </div>

        {/* Título con color del tipo de módulo */}
        <h3 style={{
          fontFamily:'"Cinzel", serif',
          fontSize:'clamp(0.78rem, 2vw, 0.88rem)',
          fontWeight:700,
          color:`${cfg.color}cc`,
          textShadow:`0 0 20px ${cfg.color}44`,
          lineHeight:1.3,
          marginBottom:'0.375rem',
          flex:1,
        }}>{module.title}</h3>

        {/* Subtítulo borroso — genera misterio */}
        <p style={{
          fontFamily:'"Crimson Text", serif',
          fontSize:'clamp(0.78rem, 1.8vw, 0.85rem)',
          color:`${cfg.color}44`,
          lineHeight:1.4,
          marginBottom:'0.875rem',
          flex:1,
          filter:'blur(2px)',
          userSelect:'none',
        }}>{module.subtitle}</p>

        {/* Footer */}
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          paddingTop:'0.75rem',
          borderTop:`1px solid ${cfg.color}18`,
        }}>
          <span style={{
            fontSize:'clamp(0.6rem, 1.2vw, 0.65rem)',
            color:'rgba(255,255,255,0.15)',
            fontFamily:'"Cinzel", serif',
            filter:'blur(1.5px)',
            userSelect:'none',
          }}>{module.duration}</span>
          <span style={{
            fontSize:'clamp(0.55rem, 1.1vw, 0.6rem)',
            fontFamily:'"Cinzel", serif',
            letterSpacing:'0.1em',
            color:`${cfg.color}77`,
            display:'flex', alignItems:'center', gap:'0.3em',
            background:`${cfg.color}10`,
            border:`1px solid ${cfg.color}22`,
            borderRadius:'999px',
            padding:'0.2em 0.6em',
          }}>
            <span style={{ opacity:0.7 }}>✦</span> Por desbloquear
          </span>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={`/academia/${module.slug}`}
      style={{
        display: 'flex', flexDirection: 'column',
        textDecoration: 'none',
        position: 'relative', overflow: 'hidden',
        borderRadius: '1rem',
        border: state === 'active'
          ? `1px solid ${cfg.color}66`
          : '1px solid rgba(255,255,255,0.1)',
        background: state === 'active'
          ? `radial-gradient(ellipse at top right, ${cfg.color}14, transparent 70%), rgba(255,255,255,0.04)`
          : 'rgba(255,255,255,0.04)',
        padding: 'clamp(1rem, 3vw, 1.25rem)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = `${cfg.color}66`;
        e.currentTarget.style.boxShadow = `0 8px 30px ${cfg.color}15`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = state === 'active' ? `${cfg.color}66` : 'rgba(255,255,255,0.1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '0.875rem',
      }}>
        <span style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>{cfg.icon}</span>
        <span style={{
          fontSize: 'clamp(0.6rem, 1.2vw, 0.65rem)',
          fontFamily: '"Cinzel", serif',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: cfg.color,
          opacity: 0.8,
        }}>{cfg.label}</span>
      </div>

      <h3 style={{
        fontFamily: '"Cinzel", serif',
        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 1.3,
        marginBottom: '0.375rem',
        flex: 1,
      }}>{module.title}</h3>

      <p style={{
        fontFamily: '"Crimson Text", serif',
        fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)',
        color: 'rgba(255,255,255,0.4)',
        lineHeight: 1.4,
        marginBottom: '0.875rem',
        flex: 1,
      }}>{module.subtitle}</p>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: '0.75rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{
          fontSize: 'clamp(0.65rem, 1.3vw, 0.7rem)',
          color: 'rgba(255,255,255,0.25)',
          fontFamily: '"Cinzel", serif',
        }}>{module.duration}</span>
        {state === 'opened' && (
          <span style={{
            fontSize: 'clamp(0.6rem, 1.2vw, 0.65rem)',
            color: '#10B981',
            fontFamily: '"Cinzel", serif',
            letterSpacing: '0.05em',
          }}>✓ Visto</span>
        )}
        {state === 'active' && (
          <span style={{
            fontSize: 'clamp(0.6rem, 1.2vw, 0.65rem)',
            color: cfg.color,
            fontFamily: '"Cinzel", serif',
            letterSpacing: '0.05em',
          }}>● Activo</span>
        )}
      </div>
    </Link>
  );
};

// ─── Stats rápidas ────────────────────────────────────────────────────────────
const QuickStat = ({ icon, value, label }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.25rem',
    padding: 'clamp(0.875rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.5rem)',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '0.875rem',
    flex: '1', minWidth: 'clamp(4.5rem, 15vw, 6rem)',
  }}>
    <span style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>{icon}</span>
    <span style={{
      fontFamily: '"Cinzel", serif', fontWeight: 700,
      fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
      color: '#F5C518',
    }}>{value}</span>
    <span style={{
      fontSize: 'clamp(0.6rem, 1.2vw, 0.65rem)',
      color: 'rgba(255,255,255,0.35)',
      fontFamily: '"Cinzel", serif',
      letterSpacing: '0.08em',
      textAlign: 'center',
    }}>{label}</span>
  </div>
);

// ─── Templo del Propósito — evaluación pendiente ─────────────────────────────
const TemploEvaluacionBlock = ({ mensajes }) => {
  const [msgIdx, setMsgIdx] = React.useState(0);
  const [visible, setVisible] = React.useState(true);
  const [particles] = React.useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: 1.5 + Math.random() * 2.5,
      dur: 3 + Math.random() * 4,
      delay: Math.random() * 4,
    }))
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIdx(i => (i + 1) % mensajes.length);
        setVisible(true);
      }, 600);
    }, 4200);
    return () => clearInterval(interval);
  }, [mensajes.length]);

  return (
    <div style={{
      marginTop: '1rem',
      position: 'relative',
      borderRadius: '1.5rem',
      overflow: 'hidden',
      minHeight: '280px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(2rem, 5vw, 3rem) clamp(1.5rem, 4vw, 2.5rem)',
      background: `
        radial-gradient(ellipse at 50% -10%, rgba(245,197,24,0.22) 0%, transparent 55%),
        radial-gradient(ellipse at 15% 110%, rgba(192,132,252,0.14) 0%, transparent 50%),
        radial-gradient(ellipse at 85% 90%, rgba(245,120,24,0.09) 0%, transparent 45%),
        linear-gradient(160deg, #0f0b1e 0%, #0a0614 50%, #130a20 100%)
      `,
    }}>
      <style>{`
        @keyframes tpRayoA { 0%,100%{opacity:0.2;transform:rotate(-22deg) scaleY(1)} 50%{opacity:0.5;transform:rotate(-16deg) scaleY(1.1)} }
        @keyframes tpRayoB { 0%,100%{opacity:0.15;transform:rotate(20deg) scaleY(1)} 50%{opacity:0.4;transform:rotate(15deg) scaleY(1.08)} }
        @keyframes tpRayoC { 0%,100%{opacity:0.12;transform:rotate(-8deg) scaleY(1)} 50%{opacity:0.3;transform:rotate(4deg) scaleY(1.05)} }
        @keyframes tpCorona { 0%,100%{filter:drop-shadow(0 0 10px rgba(245,197,24,0.55));transform:scale(1) translateY(0)} 50%{filter:drop-shadow(0 0 26px rgba(245,197,24,1));transform:scale(1.08) translateY(-4px)} }
        @keyframes tpRing { 0%{transform:translate(-50%,-50%) scale(0.8);opacity:0.5} 80%{transform:translate(-50%,-50%) scale(1.6);opacity:0} 100%{opacity:0} }
        @keyframes tpParticle { 0%{opacity:0;transform:translateY(0) scale(0)} 20%{opacity:1;transform:translateY(-10px) scale(1)} 80%{opacity:0.5} 100%{opacity:0;transform:translateY(-45px) scale(0.2)} }
        @keyframes tpMsgIn { from{opacity:0;transform:translateY(12px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes tpMsgOut { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-10px)} }
        @keyframes tpDot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(0.5);opacity:0.25} }
        @keyframes tpBtn { 0%,100%{box-shadow:0 0 22px rgba(245,197,24,0.35),0 4px 20px rgba(0,0,0,0.5)} 50%{box-shadow:0 0 48px rgba(245,197,24,0.7),0 4px 28px rgba(0,0,0,0.6)} }
        @keyframes tpTopLine { 0%{opacity:0.4} 50%{opacity:1} 100%{opacity:0.4} }
        @keyframes tpOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(6px,-8px) scale(1.12)} }
        @keyframes tpOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-5px,7px) scale(1.08)} }
      `}</style>

      {/* Orbes de profundidad */}
      <div style={{ position:'absolute', top:'-30%', left:'-10%', width:'55%', height:'55%', borderRadius:'50%', background:'radial-gradient(circle, rgba(245,197,24,0.1) 0%, transparent 70%)', pointerEvents:'none', animation:'tpOrb1 8s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:'-20%', right:'-8%', width:'45%', height:'45%', borderRadius:'50%', background:'radial-gradient(circle, rgba(192,132,252,0.08) 0%, transparent 70%)', pointerEvents:'none', animation:'tpOrb2 11s ease-in-out infinite' }} />

      {/* Rayos solares */}
      <div style={{ position:'absolute', top:0, left:'38%', width:2, height:'60%', background:'linear-gradient(180deg, rgba(245,197,24,0.75) 0%, transparent 100%)', transformOrigin:'top center', animation:'tpRayoA 7s ease-in-out infinite', filter:'blur(1px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, left:'52%', width:1.5, height:'65%', background:'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)', transformOrigin:'top center', animation:'tpRayoB 9s ease-in-out infinite', filter:'blur(1px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, left:'62%', width:2, height:'50%', background:'linear-gradient(180deg, rgba(192,132,252,0.45) 0%, transparent 100%)', transformOrigin:'top center', animation:'tpRayoC 12s ease-in-out infinite', filter:'blur(2px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, left:'28%', width:1.5, height:'45%', background:'linear-gradient(180deg, rgba(245,150,24,0.35) 0%, transparent 100%)', transformOrigin:'top center', animation:'tpRayoA 10s ease-in-out infinite 2s', filter:'blur(1.5px)', pointerEvents:'none' }} />

      {/* Borde superior luminoso */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent 0%, rgba(245,197,24,0.9) 35%, rgba(255,255,255,1) 50%, rgba(245,197,24,0.9) 65%, transparent 100%)', animation:'tpTopLine 3s ease-in-out infinite', pointerEvents:'none' }} />

      {/* Partículas */}
      {particles.map(p => (
        <div key={p.id} style={{ position:'absolute', left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size, borderRadius:'50%', background: p.id%3===0 ? 'rgba(245,197,24,0.95)' : p.id%3===1 ? 'rgba(255,255,255,0.75)' : 'rgba(192,132,252,0.85)', animation:`tpParticle ${p.dur}s ease-in-out infinite`, animationDelay:`${p.delay}s`, pointerEvents:'none' }} />
      ))}

      {/* Contenido */}
      <div style={{ position:'relative', zIndex:2, textAlign:'center', width:'100%' }}>

        {/* Ícono con anillos */}
        <div style={{ position:'relative', display:'inline-block', marginBottom:'1.25rem' }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', width:100, height:100, borderRadius:'50%', border:'1px solid rgba(245,197,24,0.35)', animation:'tpRing 2.8s ease-out infinite', pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', width:75, height:75, borderRadius:'50%', border:'1px solid rgba(245,197,24,0.25)', animation:'tpRing 2.8s ease-out infinite 0.6s', pointerEvents:'none' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', width:50, height:50, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.15)', animation:'tpRing 2.8s ease-out infinite 1.2s', pointerEvents:'none' }} />
          <span style={{ fontSize:'clamp(2.2rem,6vw,3rem)', display:'block', lineHeight:1, animation:'tpCorona 4s ease-in-out infinite' }}>🏛️</span>
        </div>

        {/* Línea ornamental */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.6rem', marginBottom:'0.5rem' }}>
          <div style={{ height:1, width:70, background:'linear-gradient(90deg, transparent, rgba(245,197,24,0.7))' }} />
          <div style={{ width:4, height:4, borderRadius:'50%', background:'#F5C518', animation:'tpDot 2s ease-in-out infinite' }} />
          <div style={{ fontFamily:'"Cinzel",serif', fontSize:'0.6rem', letterSpacing:'0.25em', color:'rgba(245,197,24,0.5)', textTransform:'uppercase', whiteSpace:'nowrap' }}>Templo del Propósito</div>
          <div style={{ width:4, height:4, borderRadius:'50%', background:'#F5C518', animation:'tpDot 2s ease-in-out infinite 1s' }} />
          <div style={{ height:1, width:70, background:'linear-gradient(90deg, rgba(245,197,24,0.7), transparent)' }} />
        </div>

        {/* Mensaje rotatorio */}
        <div style={{ minHeight:'4rem', display:'flex', alignItems:'center', justifyContent:'center', margin:'0.75rem 0 0.5rem', padding:'0 1rem' }}>
          <p style={{
            fontFamily:'"Crimson Text",serif',
            fontSize:'clamp(1rem,2.5vw,1.2rem)',
            fontStyle:'italic',
            color:'rgba(255,255,255,0.88)',
            maxWidth:'34rem',
            margin:0,
            lineHeight:1.7,
            animation: visible ? 'tpMsgIn 0.6s ease both' : 'tpMsgOut 0.4s ease both',
          }}>
            "{mensajes[msgIdx]}"
          </p>
        </div>

        {/* Indicadores */}
        <div style={{ display:'flex', gap:'5px', justifyContent:'center', marginBottom:'1.75rem' }}>
          {mensajes.map((_, i) => (
            <div key={i} style={{ width: i===msgIdx ? 20 : 5, height:3, borderRadius:999, background: i===msgIdx ? '#F5C518' : 'rgba(245,197,24,0.22)', transition:'all 0.4s ease' }} />
          ))}
        </div>

        {/* CTA */}
<a
  href="https://templopropo-mg6l5byy.manus.space/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:'inline-flex', alignItems:'center', gap:'0.6rem',
            padding:'0.9rem 2.5rem',
            background:'linear-gradient(135deg, #F5C518 0%, #E8A800 50%, #D97706 100%)',
            borderRadius:'999px',
            color:'#0a0614',
            fontFamily:'"Cinzel",serif',
            fontSize:'clamp(0.7rem,1.6vw,0.82rem)',
            fontWeight:700,
            letterSpacing:'0.14em',
            textDecoration:'none',
            animation:'tpBtn 2.5s ease-in-out infinite',
            transition:'transform 0.2s, filter 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px) scale(1.04)'; e.currentTarget.style.filter='brightness(1.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.filter='none'; }}
        >
          ✦ Ir a mi evaluación
        </a>

      </div>
    </div>
  );
};

// ─── Countdown aislado: solo ESTE componente late cada segundo,
// no arrastra al resto de la pantalla a re-renderizarse con él ───────────────
const MENSAJES_EVALUACION_PENDIENTE = [
  'Tu semana ha dejado huella. Cuando estés listo, cuéntame cómo te fue.',
  'Estoy aquí. Responde tu evaluación para que pueda forjar tu siguiente paso.',
  'No hay prisa. Pero tu próximo protocolo te está esperando al otro lado.',
  'Cada semana que vives merece ser registrada. Compártela conmigo.',
];

const CountdownEvaluacion = ({ protocoLoFecha, onExpiradoChange }) => {
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const countdownData = useMemo(() => {
    if (!protocoLoFecha) return null;
    const inicio = new Date(protocoLoFecha).getTime();
    const siguiente = inicio + 7 * 24 * 60 * 60 * 1000;
    const diff = siguiente - ahora;
    if (diff <= 0) return { expirado: true };
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diff % (1000 * 60)) / 1000);
    return { expirado: false, dias, horas, minutos, segundos };
  }, [protocoLoFecha, ahora]);

  useEffect(() => {
    if (onExpiradoChange) onExpiradoChange(!!countdownData?.expirado);
  }, [countdownData?.expirado, onExpiradoChange]);

  if (!countdownData) return null;

  if (countdownData.expirado) {
    return <TemploEvaluacionBlock mensajes={MENSAJES_EVALUACION_PENDIENTE} />;
  }

  return (
    <div style={{
      marginTop: '1rem',
      padding: 'clamp(1rem, 3vw, 1.5rem)',
      background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(10,6,20,0.9) 55%, rgba(192,132,252,0.08) 100%)',
      border: '1.5px solid rgba(124,58,237,0.55)',
      borderRadius: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem',
      boxShadow: '0 0 40px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
      animation: 'countdownGlow 3s ease-in-out infinite',
    }}>
      <div>
        <p style={{
          fontFamily: '"Cinzel", serif',
          fontSize: 'clamp(0.65rem, 1.3vw, 0.78rem)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#C084FC',
          marginBottom: '0.3rem',
          textShadow: '0 0 12px rgba(192,132,252,0.8)',
        }}>⚔️ Próxima evaluación del Templo</p>
        <p style={{
          fontFamily: '"Crimson Text", serif',
          fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
          color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.5,
        }}>Tu siguiente protocolo será forjado cuando el Templo te convoque</p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {[
          { v: countdownData.dias, l: 'días' },
          { v: countdownData.horas, l: 'hrs' },
          { v: countdownData.minutos, l: 'min' },
          { v: countdownData.segundos, l: 'seg' },
        ].map(({ v, l }) => (
          <div key={l} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '0.6rem 0.875rem',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(192,132,252,0.1))',
            border: '1.5px solid rgba(192,132,252,0.5)',
            borderRadius: '0.75rem',
            minWidth: '3.25rem',
            boxShadow: '0 0 16px rgba(192,132,252,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}>
            <span style={{
              fontFamily: '"Cinzel", serif',
              fontWeight: 900,
              fontSize: 'clamp(1.1rem, 2.8vw, 1.4rem)',
              color: '#C084FC',
              lineHeight: 1,
              textShadow: '0 0 16px rgba(192,132,252,0.9)',
            }}>{String(v).padStart(2, '0')}</span>
            <span style={{
              fontFamily: '"Cinzel", serif',
              fontSize: '0.58rem',
              color: 'rgba(192,132,252,0.6)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────
const AcademyHub = () => {
  const user = useAuthStore(s => s.user);
  const userProtocolo = useMembershipStore(s => s.userProtocolo);
  const currentWeekStore = useMembershipStore(s => s.currentWeek);
  const openedSlugs = useMembershipStore(s => s.openedModules);
  const completedModules = useMembershipStore(s => s.completedModules);
  const progress = useMembershipStore(selectProgress);
  const currentWeek = currentWeekStore;
  const memberSince = useMembershipStore(s => s.memberSince);
  const playerLevel = usePlayerStore(s => s.level);
  const [searchParams, setSearchParams] = useSearchParams();
const [mostrarRitual, setMostrarRitual] = useState(
  searchParams.get('ritual') === 'completado'
);
const nombreParam = searchParams.get('nombre') || user?.user_metadata?.full_name || '';
const emailParam  = searchParams.get('email')  || user?.email || '';
const loadMembership = useMembershipStore(s => s.loadMembership);

// Adelanta la consulta a Supabase en paralelo con el "teatro" de RitualAnalysis,
// para que el protocolo ya esté listo cuando llegue la fase de revelación.
useEffect(() => {
  if (mostrarRitual && user?.id) {
    loadMembership(supabase, user.id);
  }
}, [mostrarRitual, user?.id, loadMembership]);

const onRitualCompleto = useCallback(async () => {
  setMostrarRitual(false);
  setSearchParams({}, { replace: true });
  if (user?.id) {
    await loadMembership(supabase, user.id);
  }
}, [setSearchParams, user?.id, loadMembership]);

  const protocoLoFecha = useMembershipStore(s => s.protocoLoFecha);

  const memberDays = useMemo(() => {
    if (!memberSince) return 0;
    return Math.floor((Date.now() - new Date(memberSince).getTime()) / (1000 * 60 * 60 * 24));
  }, [memberSince]);

  const [evaluacionExpirada, setEvaluacionExpirada] = useState(false);

  const currentModule = useMemo(() => {
    if (userProtocolo) {
      return ACADEMY_MODULES.find(m => m.protocolo === userProtocolo) ?? ACADEMY_MODULES[0];
    }
    return ACADEMY_MODULES.find(m => m.week === currentWeekStore) ?? ACADEMY_MODULES[0];
  }, [userProtocolo, currentWeekStore]);

  const isCurrentCompleted = completedModules.includes(currentModule?.slug);

  // Categoriza módulos para el grid
  const categorized = useMemo(() => {
    const openedSet = new Set(openedSlugs);
    return ACADEMY_MODULES.map(m => ({
      ...m,
      state: m.slug === currentModule?.slug
        ? 'active'
        : openedSet.has(m.slug)
          ? 'opened'
          : 'locked',
    }));
  }, [openedSlugs, currentModule]);

  const openedCount = categorized.filter(m => m.state !== 'locked').length;
  const totalWeeks = Math.max(...ACADEMY_MODULES.map(m => m.week));
  const weeksLeft = Math.max(0, totalWeeks - Math.floor(memberDays / 7));

  return (
    <>
      {mostrarRitual && (
        <RitualAnalysis
          nombre={nombreParam}
          email={emailParam}
          onComplete={onRitualCompleto}
        />
      )}
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0614 0%, #0d0820 40%, #080518 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Orbes de fondo épicos */}
        <div style={{
          position: 'fixed', top: '-20%', left: '-10%',
          width: '55vw', height: '55vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192,132,252,0.13) 0%, transparent 65%)',
          pointerEvents: 'none', zIndex: 0,
          animation: 'academyOrb1 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'fixed', bottom: '-15%', right: '-8%',
          width: '45vw', height: '45vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,197,24,0.09) 0%, transparent 65%)',
          pointerEvents: 'none', zIndex: 0,
          animation: 'academyOrb2 22s ease-in-out infinite',
        }} />
        <div style={{
          position: 'fixed', top: '40%', right: '15%',
          width: '30vw', height: '30vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96,165,250,0.07) 0%, transparent 65%)',
          pointerEvents: 'none', zIndex: 0,
          animation: 'academyOrb3 26s ease-in-out infinite',
        }} />
        <div style={{
          position: 'fixed', inset: 0,
          backgroundImage: 'linear-gradient(rgba(192,132,252,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(192,132,252,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none', zIndex: 0,
        }} />
        <style>{`
          @keyframes academyOrb1 {
            0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(3%,5%) scale(1.05)} 66%{transform:translate(-2%,3%) scale(0.97)}
          }
          @keyframes academyOrb2 {
            0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-4%,-3%) scale(1.08)} 66%{transform:translate(2%,-5%) scale(0.95)}
          }
          @keyframes academyOrb3 {
            0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(3%,4%) scale(1.1)}
          }
          @keyframes academyRaySway {
            0%,100%{transform:translateX(-50%) rotate(-18deg); opacity:0.7;}
            50%{transform:translateX(-50%) rotate(18deg); opacity:1;}
          }
          @keyframes academyRaySway2 {
            0%,100%{transform:translateX(-50%) rotate(12deg);}
            50%{transform:translateX(-50%) rotate(-12deg);}
          }
          @keyframes academyTitleShine {
            0%{background-position:-200% center;}
            100%{background-position:200% center;}
          }
          @keyframes academyStarTwinkle {
            0%,100%{opacity:0.15;transform:scale(1);}
            50%{opacity:1;transform:scale(1.8);}
          }
          @keyframes academySubFade {
            from{opacity:0;transform:translateY(8px);}
            to{opacity:1;transform:translateY(0);}
          }
          @keyframes academyGoldPulse {
            0%,100%{box-shadow:0 0 20px rgba(245,197,24,0.25),inset 0 1px 0 rgba(245,197,24,0.15);}
            50%{box-shadow:0 0 45px rgba(245,197,24,0.5),inset 0 1px 0 rgba(245,197,24,0.25);}
          }
          @keyframes academyShineBar {
            0%{background-position:-200% center;}
            100%{background-position:200% center;}
          }
          @keyframes countdownGlow {
            0%,100%{box-shadow:0 0 16px rgba(192,132,252,0.3),inset 0 1px 0 rgba(255,255,255,0.08);}
            50%{box-shadow:0 0 32px rgba(192,132,252,0.6),inset 0 1px 0 rgba(255,255,255,0.15);}
          }
          @keyframes statCardPulse {
            0%,100%{box-shadow:0 0 8px rgba(245,197,24,0.15);}
            50%{box-shadow:0 0 22px rgba(245,197,24,0.4);}
          }
        `}</style>
      <div style={{
        maxWidth: '64rem',
        margin: '0 auto',
        padding: 'clamp(1rem, 5vw, 2rem) clamp(1rem, 4vw, 1.5rem)',
        minHeight: '100vh',
        position: 'relative', zIndex: 1,
      }}>

      {/* Header */}
      <header style={{ marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
        {/* Título épico con rayos */}
        <div style={{ position: 'relative', textAlign: 'center', padding: '2.5rem 0 1.5rem', marginBottom: '1.5rem' }}>
          {/* Rayo solar central */}
          <div style={{
            position: 'absolute', top: 0, left: '50%',
            width: 3, height: '100%',
            background: 'linear-gradient(180deg, rgba(192,132,252,0.9) 0%, rgba(245,197,24,0.6) 40%, transparent 100%)',
            transform: 'translateX(-50%) rotate(-18deg)',
            transformOrigin: 'top center',
            animation: 'academyRaySway 8s ease-in-out infinite',
            filter: 'blur(1px)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: 0, left: '50%',
            width: 180, height: '85%',
            background: 'radial-gradient(ellipse at top, rgba(192,132,252,0.18) 0%, rgba(245,197,24,0.08) 40%, transparent 70%)',
            transform: 'translateX(-50%) rotate(12deg)',
            transformOrigin: 'top center',
            animation: 'academyRaySway2 11s ease-in-out infinite',
            filter: 'blur(8px)', pointerEvents: 'none',
          }} />
          {/* Estrellas decorativas */}
          {[
            { top:'12%', left:'8%', delay:'0s', size:3 },
            { top:'28%', left:'18%', delay:'0.6s', size:2 },
            { top:'8%', left:'78%', delay:'0.3s', size:3 },
            { top:'35%', left:'88%', delay:'1s', size:2 },
            { top:'55%', left:'5%', delay:'1.4s', size:2 },
            { top:'50%', left:'93%', delay:'0.8s', size:3 },
          ].map((s, i) => (
            <div key={i} style={{
              position: 'absolute', top: s.top, left: s.left,
              width: s.size, height: s.size, borderRadius: '50%',
              background: i % 2 === 0 ? '#C084FC' : '#F5C518',
              animation: `academyStarTwinkle ${1.8 + i * 0.4}s ease-in-out infinite`,
              animationDelay: s.delay, pointerEvents: 'none',
            }} />
          ))}
          {/* Título */}
          <h1 style={{
            fontFamily: '"Cinzel", serif', fontWeight: 900,
            fontSize: 'clamp(2.2rem, 6vw, 4rem)',
            margin: '0 0 0.25rem', lineHeight: 1,
            background: 'linear-gradient(90deg, #C084FC 0%, #F5C518 35%, #fff 50%, #F5C518 65%, #C084FC 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'academyTitleShine 4s linear infinite',
            letterSpacing: '0.06em',
            position: 'relative', zIndex: 1,
          }}>ACADEMIA</h1>
          <h2 style={{
            fontFamily: '"Cinzel", serif', fontWeight: 700,
            fontSize: 'clamp(1.1rem, 3vw, 1.8rem)',
            margin: '0 0 0.875rem', lineHeight: 1,
            background: 'linear-gradient(90deg, #F5C518, #fff, #F5C518)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'academyTitleShine 5s linear infinite reverse',
            letterSpacing: '0.22em', textTransform: 'uppercase',
            position: 'relative', zIndex: 1,
          }}>de Crecimiento</h2>
          <p style={{
            fontFamily: '"Crimson Text", serif',
            fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
            color: 'rgba(255,255,255,0.55)', margin: '0 0 1.5rem',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            animation: 'academySubFade 1s ease both',
            position: 'relative', zIndex: 1,
          }}>✦ Plan personalizado · 6 meses · 1 actividad por semana ✦</p>
        </div>

        {/* Barra de progreso épica */}
        <div style={{
          padding: 'clamp(1rem, 3vw, 1.5rem)',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(10,6,20,0.85) 55%, rgba(245,197,24,0.06) 100%)',
          border: '1.5px solid rgba(124,58,237,0.4)',
          borderRadius: '1.25rem',
          marginBottom: '1.25rem',
          boxShadow: '0 0 40px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem',
          }}>
            <span style={{
              fontFamily: '"Cinzel", serif',
              fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'rgba(192,132,252,0.8)',
              display: 'flex', alignItems: 'center', gap: '0.5em',
            }}>⚜️ Progreso del programa</span>
            <span style={{
              fontFamily: '"Cinzel", serif', fontWeight: 900,
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              background: 'linear-gradient(90deg, #C084FC, #F5C518)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>{progress}%</span>
          </div>
          <div style={{
            height: '10px', borderRadius: '999px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(192,132,252,0.2)',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 8px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              height: '100%', borderRadius: '999px',
              width: `${Math.max(progress, 3)}%`,
              background: 'linear-gradient(90deg, #7C3AED, #C084FC, #F5C518, #C084FC)',
              backgroundSize: '200% auto',
              animation: 'academyShineBar 2s linear infinite',
              boxShadow: '0 0 16px rgba(192,132,252,0.7), 0 0 4px #fff',
              transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
        </div>

        {/* Stats rápidas épicas */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
          {[
            { icon: '✅', value: completedModules.length, label: 'Activaciones Templarias Completadas', color: '#10B981' },
            { icon: '👁', value: openedCount, label: 'Explorados', color: '#60A5FA' },
            { icon: '⏰', value: `${weeksLeft}sem`, label: 'Restantes', color: '#F97316' },
            { icon: '🗓', value: `${memberDays}d`, label: 'Como miembro', color: '#F5C518' },
          ].map(({ icon, value, label, color }) => (
            <div key={label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '0.25rem',
              padding: 'clamp(0.875rem, 2.5vw, 1.1rem) clamp(1rem, 3vw, 1.5rem)',
              background: `linear-gradient(135deg, ${color}18 0%, rgba(10,6,20,0.85) 60%, ${color}08 100%)`,
              border: `1.5px solid ${color}44`,
              borderRadius: '1rem',
              flex: '1', minWidth: 'clamp(4.5rem, 15vw, 6rem)',
              boxShadow: `0 0 20px ${color}18, inset 0 1px 0 rgba(255,255,255,0.07)`,
              animation: 'statCardPulse 3s ease-in-out infinite',
              transition: 'all 0.3s',
            }}>
              <span style={{ fontSize: 'clamp(1rem, 2.5vw, 1.35rem)' }}>{icon}</span>
              <span style={{
                fontFamily: '"Cinzel", serif', fontWeight: 900,
                fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
                color: color,
                textShadow: `0 0 16px ${color}99`,
              }}>{value}</span>
              <span style={{
                fontSize: 'clamp(0.6rem, 1.2vw, 0.65rem)',
                color: 'rgba(255,255,255,0.45)',
                fontFamily: '"Cinzel", serif',
                letterSpacing: '0.08em',
                textAlign: 'center',
              }}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── Navegación Comunidad & Ranking ── */}
        <div style={{
          display: 'flex', gap: '0.75rem',
          marginTop: '1.25rem', marginBottom: '0.25rem',
          flexWrap: 'wrap',
        }}>
          {[
            {
              to: '/academia/comunidad',
              icon: '🏛',
              label: 'Comunidad',
              sub: 'Feed del Templo',
              color: '#C084FC',
              colorRgb: '192,132,252',
              hasNew: (() => {
                try {
                  const key = `community_last_visit_${user?.id}`;
                  const last = localStorage.getItem(key);
                  if (!last) return false;
                  const stored = localStorage.getItem('community_new_posts_count_' + user?.id);
                  return stored ? parseInt(stored, 10) > 0 : false;
                } catch { return false; }
              })(),
              newCount: (() => {
                try {
                  const stored = localStorage.getItem('community_new_posts_count_' + user?.id);
                  return stored ? parseInt(stored, 10) : 0;
                } catch { return 0; }
              })(),
            },
            {
              to: '/academia/comunidad?tab=ranking',
              icon: '🏆',
              label: 'Ranking',
              sub: 'Tabla de honor',
              color: '#F5C518',
              colorRgb: '245,197,24',
              hasNew: false,
            },
          ].map(({ to, icon, label, sub, color, colorRgb, hasNew, newCount = 0 }) => (
            <Link
              key={to}
              to={to}
              style={{
                flex: '1', minWidth: 'clamp(140px, 40vw, 200px)',
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: 'clamp(0.875rem, 2.5vw, 1.1rem) clamp(1rem, 3vw, 1.4rem)',
                background: `linear-gradient(135deg, ${color}18 0%, rgba(10,6,20,0.88) 60%, ${color}08 100%)`,
                border: `1.5px solid ${color}44`,
                borderRadius: '1rem',
                textDecoration: 'none',
                boxShadow: `0 0 24px ${color}14, inset 0 1px 0 rgba(255,255,255,0.06)`,
                transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${color}88`;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 0 40px ${color}30, inset 0 1px 0 rgba(255,255,255,0.1)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = `${color}44`;
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = `0 0 24px ${color}14, inset 0 1px 0 rgba(255,255,255,0.06)`;
              }}
            >
              {/* Glow de fondo al hover */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(ellipse at left center, ${color}10 0%, transparent 65%)`,
                pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative', flexShrink: 0, zIndex: 1 }}>
                <span style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  filter: `drop-shadow(0 0 8px ${color}88)`,
                  display: 'block',
                }}>{icon}</span>
                {hasNew && (
                  <span style={{
                    position: 'absolute', top: -6, right: -6,
                    minWidth: newCount > 0 ? 18 : 10,
                    height: newCount > 0 ? 18 : 10,
                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    borderRadius: '999px',
                    border: '2px solid #0a0614',
                    boxShadow: '0 0 10px rgba(239,68,68,0.9)',
                    animation: 'academyOrb1 2s ease-in-out infinite',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: '"Cinzel", serif',
                    fontSize: '0.5rem', fontWeight: 900,
                    color: '#fff', letterSpacing: 0,
                    padding: newCount > 0 ? '0 3px' : 0,
                  }}>{newCount > 0 ? (newCount > 9 ? '9+' : newCount) : ''}</span>
                )}
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  fontFamily: '"Cinzel", serif', fontWeight: 900,
                  fontSize: 'clamp(0.85rem, 2.2vw, 1rem)',
                  color: color,
                  textShadow: `0 0 16px ${color}88`,
                  letterSpacing: '0.08em',
                  marginBottom: '0.15rem',
                }}>{label}</div>
                <div style={{
                  fontFamily: '"Crimson Text", serif',
                  fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)',
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '0.05em',
                }}>{sub}</div>
              </div>
              <div style={{
                marginLeft: 'auto', flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '0.35rem',
                position: 'relative', zIndex: 1,
              }}>
                <span style={{
                  fontFamily: '"Cinzel", serif',
                  fontSize: 'clamp(0.55rem, 1.2vw, 0.62rem)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: `${color}99`,
                  whiteSpace: 'nowrap',
                }}>Ver</span>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M6.5 4.5L11.5 9L6.5 13.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Countdown épico siguiente evaluación — aislado, ya no repinta toda la pantalla cada segundo */}
        <CountdownEvaluacion protocoLoFecha={protocoLoFecha} onExpiradoChange={setEvaluacionExpirada} />
      </header>

      {/* Módulo activo esta semana — solo si el plan está vigente */}
      {currentModule && !evaluacionExpirada && (
        <>
          <h2 style={{
            fontFamily: '"Cinzel", serif',
            fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: '1rem',
          }}>Esta semana</h2>
          <CurrentModuleHero module={currentModule} isCompleted={isCurrentCompleted} />
        </>
      )}

      {/* Grid de todos los módulos */}
      <div style={{ marginBottom: '3rem' }}>
        {/* Sección: ya abiertos */}
        {categorized.filter(m => m.state === 'opened').length > 0 && (
          <>
            <h2 style={{
              fontFamily: '"Cinzel", serif',
              fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
              marginBottom: '1rem',
            }}>Ya exploraste</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
              gap: 'clamp(0.75rem, 2vw, 1rem)',
              marginBottom: '2rem',
            }}>
              {categorized
                .filter(m => m.state === 'opened')
                .map(m => <ModuleCard key={m.slug} module={m} state={m.state} />)}
            </div>
          </>
        )}

        {/* Sección: bloqueados */}
        {categorized.filter(m => m.state === 'locked').length > 0 && (
          <>
            <h2 style={{
              fontFamily: '"Cinzel", serif',
              fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
              marginBottom: '1rem',
            }}>Próximamente</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
              gap: 'clamp(0.75rem, 2vw, 1rem)',
            }}>
              {categorized
                .filter(m => m.state === 'locked')
                .map(m => <ModuleCard key={m.slug} module={m} state="locked" />)}
            </div>
          </>
        )}
      </div>
    </div>
    </div>
    </>
  );
};

export default AcademyHub;