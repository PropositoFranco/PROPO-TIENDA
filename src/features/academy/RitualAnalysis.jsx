/**
 * RitualAnalysis.jsx
 * Pantalla épica de análisis que aparece cuando el usuario viene de Manus.
 * Colócalo en: client/src/features/academy/RitualAnalysis.jsx
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useMembershipStore, { ACADEMY_MODULES } from '../../store/useMembershipStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../services/supabase';

const BONUS_PRIMERA_EVALUACION_ID = '9eeb0098-1b65-4465-bd92-9e80f767331f';

const MENSAJES = [
  { t: 0,    txt: 'El Templo recibe tus respuestas...' },
  { t: 800,  txt: 'Analizando tus 5 pilares de vida...' },
  { t: 1800, txt: 'Identificando tu protocolo de crecimiento...' },
  { t: 2800, txt: 'El oráculo calcula tu siguiente misión...' },
  { t: 3600, txt: 'Tu camino está tomando forma...' },
  { t: 4400, txt: 'Preparando tu módulo de esta semana...' },
  { t: 5200, txt: 'Sincronizando con el Templo...' },
  { t: 5800, txt: 'Listo, Templario. Tu misión te espera.' },
];

const PILARES = [
  { letra: 'V', nombre: 'Visión',     color: '#C084FC' },
  { letra: 'C', nombre: 'Control',    color: '#F5C518' },
  { letra: 'I', nombre: 'Influencia', color: '#34D399' },
  { letra: 'A', nombre: 'Autonomía',  color: '#F97316' },
  { letra: 'R', nombre: 'Realización',color: '#EC4899' },
];

const RitualAnalysis = ({ nombre, email, onComplete }) => {
  const canvasRef  = useRef(null);
  const animRef    = useRef(null);
  const [progreso, setProgreso]   = useState(0);
  const [mensaje,  setMensaje]    = useState(MENSAJES[0].txt);
  const [protocolo, setProtocolo] = useState('··');
  const [pilarActivo, setPilarActivo] = useState(0);
  const [fase, setFase] = useState('analizando'); // analizando | listo | revelado
  const navigate = useNavigate();

  const userProtocolo = useMembershipStore(s => s.userProtocolo);
  const moduloAsignado = useMemo(
    () => ACADEMY_MODULES.find(m => m.protocolo === userProtocolo) ?? null,
    [userProtocolo]
  );

  const premioIntentado = useRef(false); // candado local: evita disparar el RPC 2 veces en el mismo montaje
  const [premio, setPremio] = useState(null); // null = no otorgado (ya reclamado antes, o no es su vez) | {coins, xp}

  // ── Partículas canvas ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const pts = Array.from({ length: 100 }, () => ({
      x: Math.random() * 2000,
      y: Math.random() * 1000,
      r: Math.random() * 1.8 + 0.3,
      s: Math.random() * 0.5 + 0.15,
      o: Math.random() * 0.55 + 0.2,
      c: ['#C084FC','#F5C518','#7C3AED','#ffffff','#34D399'][Math.floor(Math.random() * 5)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.y -= p.s;
        if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = p.o;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ── Secuencia de análisis ─────────────────────────────────────────────────
  useEffect(() => {
    // Mensajes cronometrados
    MENSAJES.forEach(({ t, txt }) => {
      setTimeout(() => setMensaje(txt), t);
    });

    // Barra de progreso
    let prog = 0;
    const barraInt = setInterval(() => {
      prog = Math.min(prog + Math.random() * 2 + 0.6, 96);
      setProgreso(prog);
    }, 130);

    // Ruleta de pilares
    let pilarInt = setInterval(() => {
      setPilarActivo(p => (p + 1) % 5);
    }, 180);

    // Completar en 6.2s
    const finTimer = setTimeout(() => {
      clearInterval(barraInt);
      clearInterval(pilarInt);
      setProgreso(100);
      setFase('listo');
      setPilarActivo(-1);
      setTimeout(async () => {
        if (!premioIntentado.current) {
          premioIntentado.current = true;
          try {
            const userId = useAuthStore.getState().user?.id;
            if (userId) {
              const { data, error } = await supabase.rpc('claim_bonus_safe', {
                p_user_id: userId,
                p_bonus_id: BONUS_PRIMERA_EVALUACION_ID,
              });
              if (!error && data) {
                setPremio({ coins: data.coins, xp: data.xp });
                usePlayerStore.setState(s => ({ cristales: (s.cristales ?? 0) + (data.coins ?? 0) }));
              }
            }
          } catch (_) {
            // Ya reclamado antes (no es su primera evaluación) o falló la red.
            // No pasa nada: simplemente no se muestra el premio.
          }
        }
        setFase('revelado');
      }, 1200);
    }, 6200);

    return () => {
      clearInterval(barraInt);
      clearInterval(pilarInt);
      clearTimeout(finTimer);
    };
  }, [onComplete]);

  // ── Nombre de display ─────────────────────────────────────────────────────
  const primerNombre = (nombre || 'Templario').split(' ')[0];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#050308',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Canvas partículas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Halo central */}
      <div style={{
        position: 'absolute',
        width: '600px', height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, #7C3AED08 0%, transparent 70%)',
        animation: 'haLoPulse 4s ease-in-out infinite',
      }} />

      {/* Contenido principal */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '1.75rem',
        padding: '2rem', textAlign: 'center',
        maxWidth: '480px', width: '100%',
      }}>

        {/* Mascota / orbe del templo */}
        <div style={{ position: 'relative' }}>
          {/* Anillos orbitales */}
          <div style={{
            position: 'absolute', inset: '-20px',
            borderRadius: '50%',
            border: '1px solid rgba(192,132,252,0.2)',
            animation: 'spin 8s linear infinite',
          }} />
          <div style={{
            position: 'absolute', inset: '-36px',
            borderRadius: '50%',
            border: '1px solid rgba(245,197,24,0.1)',
            animation: 'spin 14s linear infinite reverse',
          }} />
          {/* Orbe principal */}
          <div style={{
            width: '130px', height: '130px', borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #C084FC, #7C3AED 55%, #1a0a3a)',
            boxShadow: '0 0 60px #C084FC44, 0 0 120px #7C3AED22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3.5rem',
            animation: 'floatUpDown 3s ease-in-out infinite',
          }}>
            🏛
          </div>
        </div>

        {/* Saludo personalizado */}
        <div>
          <p style={{
            fontFamily: '"Cinzel", serif',
            fontSize: 'clamp(0.65rem, 2vw, 0.75rem)',
            letterSpacing: '0.3em',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: '0.4rem',
          }}>EL TEMPLO DEL PROPÓSITO</p>
          <h2 style={{
            fontFamily: '"Cinzel", serif',
            fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
            fontWeight: 700,
            color: '#fff',
            margin: 0,
            textShadow: '0 0 40px rgba(192,132,252,0.5)',
          }}>
            {primerNombre},<br />
            <span style={{
              background: 'linear-gradient(90deg, #C084FC, #F5C518)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>el oráculo trabaja</span>
          </h2>
        </div>

        {/* Pilares girando */}
        <div style={{
          display: 'flex', gap: '0.6rem', alignItems: 'center',
        }}>
          {PILARES.map((p, i) => (
            <div key={p.letra} style={{
              width: '42px', height: '42px', borderRadius: '0.5rem',
              border: `1px solid ${pilarActivo === i ? p.color : 'rgba(255,255,255,0.08)'}`,
              background: pilarActivo === i ? `${p.color}18` : 'transparent',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease',
              boxShadow: pilarActivo === i ? `0 0 16px ${p.color}44` : 'none',
            }}>
              <span style={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: pilarActivo === i ? p.color : 'rgba(255,255,255,0.2)',
                transition: 'color 0.15s ease',
              }}>{p.letra}</span>
            </div>
          ))}
        </div>

        {/* Barra de progreso */}
        <div style={{ width: '100%' }}>
          <div style={{
            height: '3px', borderRadius: '999px',
            background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
            marginBottom: '1rem',
          }}>
            <div style={{
              height: '100%', borderRadius: '999px',
              width: `${progreso}%`,
              background: 'linear-gradient(90deg, #7C3AED, #C084FC, #F5C518)',
              transition: 'width 0.13s linear',
              boxShadow: '0 0 10px #C084FC88',
            }} />
          </div>

          {/* Mensaje dinámico */}
          <p key={mensaje} style={{
            fontFamily: '"Cinzel", serif',
            fontSize: 'clamp(0.65rem, 1.8vw, 0.75rem)',
            letterSpacing: '0.15em',
            color: fase === 'listo' ? '#F5C518' : 'rgba(255,255,255,0.4)',
            margin: 0,
            animation: 'fadeInMsg 0.4s ease',
            textShadow: fase === 'listo' ? '0 0 20px #F5C51888' : 'none',
          }}>
            {fase === 'listo' ? '✦ ' : ''}{mensaje.toUpperCase()}{fase === 'listo' ? ' ✦' : ''}
          </p>
        </div>
      </div>

      {fase === 'revelado' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 20,
          background: 'radial-gradient(circle at 50% 40%, rgba(124,58,237,0.25), #050308 75%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '1.5rem', padding: '2rem', textAlign: 'center',
          animation: 'fadeInReveal 0.5s ease',
        }}>
          {/* Confetti */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {Array.from({ length: 70 }).map((_, i) => {
              const left = Math.random() * 100;
              const delay = Math.random() * 0.4;
              const dur = 2.2 + Math.random() * 1.6;
              const size = 6 + Math.random() * 6;
              const color = ['#C084FC','#F5C518','#34D399','#EC4899','#7C3AED'][i % 5];
              return (
                <span key={i} style={{
                  position: 'absolute', top: '-5%', left: `${left}%`,
                  width: `${size}px`, height: `${size * 0.4}px`,
                  background: color, opacity: 0.9,
                  animation: `confettiFall ${dur}s ease-in ${delay}s forwards`,
                }} />
              );
            })}
          </div>

          {/* Badge del protocolo revelado */}
          <div style={{
            width: '110px', height: '110px', borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #F5E566, #D4AF37 55%, #7a5a10)',
            boxShadow: '0 0 50px #F5C51888, 0 0 100px #D4AF3744',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', animation: 'badgeReveal 0.6s cubic-bezier(0.175,0.885,0.32,1.4) both',
          }}>
            🏆
          </div>

          {/* Premio real, solo aparece si el RPC confirmó que es la primera vez */}
          {premio && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontFamily: '"Cinzel", serif', fontWeight: 700,
                fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', color: '#F5C518',
                textShadow: '0 0 20px rgba(245,197,24,0.7)',
                animation: 'premioPop 0.5s cubic-bezier(0.175,0.885,0.32,1.4) 0.3s both',
              }}>
                <span>🏛</span>
                <span>+{premio.coins} Propocoins</span>
              </div>
              <p style={{
                fontFamily: '"Nunito", sans-serif', fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.45)', margin: '-1rem 0 0',
                letterSpacing: '0.05em',
              }}>por tu primera evaluación en el Templo</p>
            </>
          )}

          <div>
            <p style={{
              fontFamily: '"Cinzel", serif', fontSize: '0.7rem',
              letterSpacing: '0.3em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem',
            }}>TU PROTOCOLO HA SIDO FORJADO</p>
            <h2 style={{
              fontFamily: '"Cinzel", serif', fontSize: 'clamp(1.4rem, 4.5vw, 2rem)',
              fontWeight: 700, margin: 0, color: '#fff',
              textShadow: '0 0 30px rgba(245,197,24,0.5)',
            }}>
              {moduloAsignado?.title ?? 'Tu primer módulo'}
            </h2>
            {moduloAsignado?.subtitle && (
              <p style={{
                fontFamily: '"Nunito", sans-serif', fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem', maxWidth: '340px',
              }}>{moduloAsignado.subtitle}</p>
            )}
          </div>

          {moduloAsignado && (
            <div style={{
              display: 'flex', gap: '0.75rem', alignItems: 'center',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,197,24,0.25)',
              borderRadius: '999px', padding: '0.6rem 1.2rem',
              fontFamily: '"Nunito", sans-serif', fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)',
            }}>
              <span>⚡ Cada Activación Templaria: <b style={{color:'#F5C518'}}>+{moduloAsignado.coinReward} Propocoins</b></span>
              <span style={{opacity:0.3}}>·</span>
              <span><b style={{color:'#C084FC'}}>+{moduloAsignado.xpReward} XP</b></span>
            </div>
          )}

          <button
            onClick={onComplete}
            style={{
              marginTop: '0.5rem', padding: '0.85rem 2.2rem', borderRadius: '999px',
              border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #7C3AED, #C084FC)',
              color: '#fff', fontFamily: '"Cinzel", serif', fontWeight: 700,
              fontSize: '0.85rem', letterSpacing: '0.08em',
              boxShadow: '0 0 24px rgba(192,132,252,0.5)',
            }}
          >
            ENTRAR A TU MÓDULO →
          </button>
        </div>
      )}

      <style>{`
        @keyframes floatUpDown {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)}
        }
        @keyframes spin {
          from{transform:rotate(0deg)} to{transform:rotate(360deg)}
        }
        @keyframes haLoPulse {
          0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)}
        }
        @keyframes fadeInMsg {
          from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)}
        }
        @keyframes fadeInReveal {
          from{opacity:0} to{opacity:1}
        }
        @keyframes badgeReveal {
          0%{transform:scale(0) rotate(-20deg);opacity:0}
          60%{transform:scale(1.15) rotate(5deg);opacity:1}
          100%{transform:scale(1) rotate(0deg);opacity:1}
        }
        @keyframes confettiFall {
          0%{transform:translateY(0) rotate(0deg);opacity:1}
          100%{transform:translateY(110vh) rotate(360deg);opacity:0}
        }
        @keyframes premioPop {
          0%{transform:scale(0.4);opacity:0}
          70%{transform:scale(1.12);opacity:1}
          100%{transform:scale(1);opacity:1}
        }
      `}</style>
    </div>
  );
};

export default RitualAnalysis;