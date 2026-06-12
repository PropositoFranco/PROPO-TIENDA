/**
 * CanjeadorPage.jsx — Templo del Propósito
 * Ruta: /canjear?codigo=TP-XXXX
 * Página PÚBLICA — no requiere login
 *
 * Flujo:
 * 1. Lee ?codigo= de la URL (o el usuario escribe el código)
 * 2. Consulta package_downloads en Supabase
 * 3. Muestra el contenido en iframe con URL firmada de Supabase Storage
 * 4. Registra file1_claimed / file2_claimed (1 sola vez por archivo)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

// ── CSS global ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
* { box-sizing: border-box; }

@keyframes floatY {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}
@keyframes spinOrb {
  to { transform: rotate(360deg); }
}
@keyframes pulseOrb {
  0%,100% { transform: scale(.95); opacity:.7; }
  50%      { transform: scale(1.05); opacity:1; }
}
@keyframes screenIn {
  from { opacity:0; transform: translateY(28px) scale(.96); }
  to   { opacity:1; transform: translateY(0) scale(1); }
}
@keyframes packPop {
  from { opacity:0; transform: scale(.5) translateY(20px); }
  to   { opacity:1; transform: scale(1) translateY(0); }
}
@keyframes burst {
  0%   { transform: scale(0) rotate(-20deg); opacity:0; }
  60%  { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0); opacity:1; }
}
@keyframes fadeUp {
  from { opacity:0; transform: translateY(-14px); }
  to   { opacity:1; transform: translateY(0); }
}
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%      { transform: translateX(-7px); }
  40%      { transform: translateX(7px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(4px); }
}
@keyframes particleFloat {
  0%   { transform: translateY(0) rotate(0deg);   opacity:.18; }
  50%  { transform: translateY(-20px) rotate(8deg); opacity:.35; }
  100% { transform: translateY(0) rotate(0deg);   opacity:.18; }
}
@keyframes shimmerSlide {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes scanline {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}

.canjear-input:focus {
  border-color: rgba(212,175,55,.7) !important;
  box-shadow: 0 0 24px rgba(212,175,55,.15) !important;
  outline: none !important;
}
.canjear-input.err {
  border-color: rgba(239,68,68,.5) !important;
  animation: shake .35s ease;
}
.btn-main {
  transition: transform .15s, box-shadow .15s, filter .15s;
}
.btn-main:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.1);
}
.btn-main:active:not(:disabled) {
  transform: translateY(1px) scale(.98);
}
.btn-main:disabled {
  opacity: .5;
  cursor: not-allowed;
}
.btn-purple {
  transition: transform .15s, box-shadow .15s, filter .15s;
}
.btn-purple:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
  box-shadow: 0 8px 28px rgba(124,58,237,.5) !important;
}
`;

// ── Pantallas ─────────────────────────────────────────────────────────────────
const SCREEN = { INPUT: 'input', VALIDATING: 'validating', UNLOCKED: 'unlocked', CONTENT: 'content' };

// ── Mensajes durante la validación ───────────────────────────────────────────
const VALIDATE_MSGS = [
  'Consultando registros del Templo...',
  'Verificando autenticidad del código...',
  'Comprobando accesos asignados...',
  'Sellando código a tu nombre...',
  'Acceso confirmado ✓',
];

// ── Fondo animado ─────────────────────────────────────────────────────────────
const Background = () => (
  <div style={{ position:'fixed', inset:0, zIndex:0, overflow:'hidden', pointerEvents:'none' }}>
    <div style={{
      position:'absolute', inset:0,
      background:'radial-gradient(ellipse 80% 60% at 20% -10%, rgba(212,175,55,.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 110%, rgba(124,58,237,.1) 0%, transparent 60%), radial-gradient(ellipse 100% 80% at 50% 50%, #05031a 0%, #020110 100%)',
    }}/>
    <div style={{
      position:'absolute', inset:0,
      backgroundImage:'linear-gradient(rgba(212,175,55,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,.03) 1px,transparent 1px)',
      backgroundSize:'60px 60px',
    }}/>
    <div style={{
      position:'absolute', left:0, right:0, height:'1px',
      background:'linear-gradient(90deg,transparent,rgba(212,175,55,.3),transparent)',
      animation:'scanline 10s linear infinite',
      top:0,
    }}/>
    {[...Array(10)].map((_,i) => (
      <div key={i} style={{
        position:'absolute',
        width:`${3+(i%3)*2}px`, height:`${3+(i%3)*2}px`,
        borderRadius:'50%',
        background: i%2===0 ? 'rgba(212,175,55,.15)' : 'rgba(124,58,237,.15)',
        left:`${(i*9.5)%100}%`,
        top:`${(i*11.3+8)%100}%`,
        animation:`particleFloat ${4.5+i*.45}s ease-in-out infinite`,
        animationDelay:`${i*.38}s`,
      }}/>
    ))}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
export default function CanjeadorPage() {
  const [searchParams]              = useSearchParams();
  const navigate                    = useNavigate();
  const [screen, setScreen]         = useState(SCREEN.INPUT);
  const [code, setCode]             = useState('');
  const [codeError, setCodeError]   = useState('');
  const [inputShake, setInputShake] = useState(false);
  const [validateMsg, setValidateMsg]   = useState('');
  const [validatePct, setValidatePct]   = useState(0);
  const [pkgData, setPkgData]       = useState(null);
  const [iframeSrc, setIframeSrc]   = useState('');
  const [iframeLoading, setIframeLoading] = useState(false);
  const [claimedFile1, setClaimedFile1]   = useState(false);
  const [claimedFile2, setClaimedFile2]   = useState(false);
  const [loadError, setLoadError]         = useState('');
  const iframeRef                         = useRef(null);

  // Detecta si el email del comprador ya tiene cuenta en el Templo
  const [tienecuenta, setTieneCuenta] = useState(null); // null=checking, true, false
  useEffect(() => {
    if (!pkgData?.user_email) return;
    supabase
      .from('profiles')
      .select('id')
      .eq('email', pkgData.user_email)
      .maybeSingle()
      .then(({ data }) => setTieneCuenta(!!data));
  }, [pkgData?.user_email]);

  // Inyectar CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Si viene ?codigo= en la URL, arranca validación automática
  useEffect(() => {
    const codigoUrl = searchParams.get('codigo');
    if (codigoUrl) {
      const upper = codigoUrl.toUpperCase();
      setCode(upper);
      setTimeout(() => iniciarValidacion(upper), 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Validación contra Supabase ────────────────────────────────────────────
  const iniciarValidacion = async (codigoRaw) => {
    const codigoLimpio = (codigoRaw || code).trim().toUpperCase();
    if (!codigoLimpio) {
      setCodeError('⚠ Ingresa tu código de acceso');
      triggerShake();
      return;
    }
    setCodeError('');
    setScreen(SCREEN.VALIDATING);
    setValidatePct(0);

    // Animación de mensajes mientras espera
    let step = 0;
    const total = VALIDATE_MSGS.length;
    const interval = setInterval(() => {
      setValidateMsg(VALIDATE_MSGS[step]);
      setValidatePct(Math.round(((step + 1) / total) * 100));
      step++;
      if (step >= total) clearInterval(interval);
    }, 650);

    // Esperar que termine la animación antes de mostrar resultado
    await new Promise(r => setTimeout(r, total * 650 + 300));

    const { data, error } = await supabase
      .from('package_downloads')
      .select('*')
      .eq('code', codigoLimpio)
      .maybeSingle();

    if (error || !data) {
      setScreen(SCREEN.INPUT);
      setCodeError('✗ Código no válido o no encontrado. Revisa tu correo.');
      triggerShake();
      return;
    }

    // ── Verificación de propiedad del código ──────────────────────────────
    // Obtenemos la sesión activa (puede ser null si no está logueado)
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionEmail = sessionData?.session?.user?.email?.toLowerCase() ?? null;
    const ownerEmail   = data.user_email?.toLowerCase() ?? null;

    // Si hay sesión activa Y el email NO coincide con el comprador → bloquear
    if (sessionEmail && ownerEmail && sessionEmail !== ownerEmail) {
      setScreen(SCREEN.INPUT);
      setCodeError('✗ Este código pertenece a otra cuenta. Verifica tu correo.');
      triggerShake();
      return;
    }
    // Si no hay sesión (usuario nuevo sin cuenta) → dejamos pasar,
    // el bloqueo de membresía se maneja en el botón de Paq3.
    // ─────────────────────────────────────────────────────────────────────

    setPkgData(data);
    setClaimedFile1(data.file1_claimed);
    setClaimedFile2(data.file2_claimed);
    setScreen(SCREEN.UNLOCKED);
  };

  const triggerShake = () => {
    setInputShake(true);
    setTimeout(() => setInputShake(false), 400);
  };

  // ── URL firmada de Supabase Storage (expira 1 hora) ──────────────────────
  const getSignedUrl = async (fileName) => {
    const { data, error } = await supabase.storage
      .from('paquetes')
      .createSignedUrl(fileName, 3600);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  };

  // ── Abrir contenido en iframe ─────────────────────────────────────────────
  const abrirContenido = async (packId) => {
    setIframeLoading(true);
    setIframeSrc('');

    const isFile1  = packId === 'p1';
    const fileName = isFile1 ? 'paquete1.html' : 'paquete2.html';
    const alreadyClaimed = isFile1 ? claimedFile1 : claimedFile2;

    // Marcar como reclamado solo la primera vez
    if (!alreadyClaimed && pkgData?.id) {
      const field = isFile1 ? { file1_claimed: true } : { file2_claimed: true };
      await supabase.from('package_downloads').update(field).eq('id', pkgData.id);
      if (isFile1) setClaimedFile1(true);
      else         setClaimedFile2(true);
    }

    const url = await getSignedUrl(fileName);
    if (!url) {
      setIframeLoading(false);
      setLoadError('Error al cargar el contenido. Intenta de nuevo.');
      setTimeout(() => setLoadError(''), 4000);
      return;
    }
    setLoadError('');

    const res = await fetch(url);
    const html = await res.text();
    setIframeSrc(html);
    setScreen(SCREEN.CONTENT);
    setIframeLoading(false);
  };

  // ── Qué paquetes tiene el usuario ─────────────────────────────────────────
  const tieneP1  = pkgData && (pkgData.package_type === 'p1' || pkgData.package_type === 'p3');
  const tieneP2  = pkgData && (pkgData.package_type === 'p2' || pkgData.package_type === 'p3');
  const tieneMem = pkgData && pkgData.package_type === 'p3';

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: '#020110',
      fontFamily: '"Raleway", "Segoe UI", sans-serif',
      color: '#e8e3ff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{GLOBAL_CSS}</style>
      <Background />

      {/* Watermark fijo */}
      <div style={{
        position: 'fixed', bottom: 12, right: 14,
        fontFamily: '"Cinzel", serif', fontSize: 9,
        letterSpacing: 2, color: 'rgba(212,175,55,.15)',
        pointerEvents: 'none', zIndex: 999, userSelect: 'none',
      }}>
        PROPOTIENDA.COM{pkgData?.user_name ? ` · ${pkgData.user_name.toUpperCase()}` : ''}
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(20px,5vw,48px) clamp(16px,4vw,32px)',
      }}>

        {/* ══════════════════════════════════════════════════════════════════
            PANTALLA 1 — INPUT DE CÓDIGO
        ══════════════════════════════════════════════════════════════════ */}
        {screen === SCREEN.INPUT && (
          <div style={{ width: '100%', maxWidth: 580, animation: 'screenIn .5s cubic-bezier(.34,1.4,.64,1) both' }}>

            {/* Encabezado de marca */}
            <div style={{
              fontFamily: '"Cinzel", serif',
              fontSize: 'clamp(9px,1.5vw,11px)',
              letterSpacing: 6, color: 'rgba(212,175,55,.4)',
              textTransform: 'uppercase', textAlign: 'center', marginBottom: 36,
            }}>
              ⚔ <span style={{ color: 'rgba(212,175,55,.65)' }}>Templo del Propósito</span> · Acceso Sellado
            </div>

            {/* Ícono flotante */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span style={{
                fontSize: 68,
                display: 'inline-block',
                animation: 'floatY 4s ease-in-out infinite',
                filter: 'drop-shadow(0 0 28px rgba(212,175,55,.45))',
              }}>🏛️</span>
            </div>

            {/* Badge */}
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontFamily: '"Cinzel", serif',
                fontSize: 'clamp(8px,1.4vw,10px)',
                letterSpacing: 4, color: 'rgba(212,175,55,.65)',
                border: '1px solid rgba(212,175,55,.25)',
                padding: '5px 20px', borderRadius: 3,
                textTransform: 'uppercase',
                background: 'rgba(212,175,55,.05)',
              }}>
                ◈ Acceso Exclusivo Fundadores
              </span>
            </div>

            {/* Título */}
            <h1 style={{
              fontFamily: '"Cinzel", serif',
              fontSize: 'clamp(24px,5.5vw,46px)',
              fontWeight: 900, textAlign: 'center', marginBottom: 10, marginTop: 0,
              background: 'linear-gradient(135deg, #f0d060 0%, #d4af37 40%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', lineHeight: 1.15,
            }}>
              Tu Acceso Te Espera
            </h1>
            <p style={{
              fontSize: 'clamp(13px,2vw,15px)',
              color: 'rgba(232,223,192,.45)',
              textAlign: 'center', marginBottom: 36, lineHeight: 1.75,
            }}>
              Ingresa el código que recibiste en tu correo<br/>
              para desbloquear tu contenido exclusivo.
            </p>

            {/* Caja de código */}
            <div style={{
              background: 'rgba(10,7,28,.97)',
              border: '1px solid rgba(212,175,55,.22)',
              borderRadius: 14, padding: 'clamp(22px,4vw,36px)',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 0 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(212,175,55,.08)',
            }}>
              {/* Línea dorada superior */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: 'linear-gradient(to right, transparent, rgba(212,175,55,.55), transparent)',
              }}/>

              <label style={{
                fontFamily: '"Cinzel", serif',
                fontSize: 'clamp(9px,1.4vw,11px)',
                letterSpacing: 4, color: 'rgba(212,175,55,.45)',
                textTransform: 'uppercase', marginBottom: 12, display: 'block',
              }}>
                Código de Acceso
              </label>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  className={`canjear-input${inputShake ? ' err' : ''}`}
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && iniciarValidacion()}
                  placeholder="TP-XXXX-XXXX"
                  autoComplete="off"
                  style={{
                    flex: 1, minWidth: 160,
                    padding: 'clamp(13px,2vw,17px) clamp(16px,2.5vw,22px)',
                    background: 'rgba(5,3,18,.9)',
                    border: '1px solid rgba(212,175,55,.18)',
                    borderRadius: 8, color: '#f0d060',
                    fontFamily: '"Cinzel", serif',
                    fontSize: 'clamp(15px,2.5vw,19px)',
                    letterSpacing: 4, textTransform: 'uppercase',
                    outline: 'none',
                    transition: 'border-color .2s, box-shadow .2s',
                  }}
                />
                <button
                  className="btn-main"
                  onClick={() => iniciarValidacion()}
                  style={{
                    padding: 'clamp(13px,2vw,17px) clamp(26px,4.5vw,40px)',
                    background: 'linear-gradient(135deg, #d4af37 0%, #a07820 100%)',
                    color: '#07041a',
                    fontFamily: '"Cinzel", serif',
                    fontSize: 'clamp(10px,1.7vw,12px)',
                    letterSpacing: 3, fontWeight: 700,
                    border: 'none', borderRadius: 8,
                    cursor: 'pointer', textTransform: 'uppercase',
                    boxShadow: '0 4px 20px rgba(212,175,55,.35)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ⚔ Canjear
                </button>
              </div>

              {codeError && (
                <p style={{
                  fontSize: 12, color: '#ef4444',
                  textAlign: 'center', marginTop: 14, marginBottom: 0,
                  fontFamily: '"Cinzel", serif', letterSpacing: 1,
                }}>
                  {codeError}
                </p>
              )}
            </div>

            {/* Link a login */}
            <p style={{
              textAlign: 'center', marginTop: 22,
              fontSize: 11, color: 'rgba(212,175,55,.3)',
              fontFamily: '"Cinzel", serif', letterSpacing: 1,
            }}>
              ¿Ya eres miembro del Templo?{' '}
              <span
                onClick={() => navigate('/login')}
                style={{
                  color: 'rgba(212,175,55,.55)', cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Iniciar sesión
              </span>
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PANTALLA 2 — VALIDANDO
        ══════════════════════════════════════════════════════════════════ */}
        {screen === SCREEN.VALIDATING && (
          <div style={{
            textAlign: 'center',
            animation: 'screenIn .5s ease both',
            width: '100%', maxWidth: 400,
          }}>
            {/* Orbe giratorio */}
            <div style={{
              position: 'relative',
              width: 'clamp(160px,28vw,210px)',
              height: 'clamp(160px,28vw,210px)',
              margin: '0 auto 32px',
            }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '1px solid rgba(212,175,55,.2)',
                animation: 'spinOrb 9s linear infinite',
              }}/>
              <div style={{
                position: 'absolute', inset: 20, borderRadius: '50%',
                border: '1px solid rgba(124,58,237,.3)',
                animation: 'spinOrb 5.5s linear infinite reverse',
              }}/>
              <div style={{
                position: 'absolute', inset: 42, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(124,58,237,.55), rgba(212,175,55,.28) 55%, transparent 75%)',
                animation: 'pulseOrb 2.2s ease-in-out infinite',
              }}/>
              {/* Punto dorado orbitando */}
              <div style={{
                position: 'absolute', width: 8, height: 8, borderRadius: '50%',
                background: '#d4af37',
                boxShadow: '0 0 14px rgba(212,175,55,.9)',
                top: -4, left: '50%', transform: 'translateX(-50%)',
              }}/>
            </div>

            <h2 style={{
              fontFamily: '"Cinzel", serif',
              fontSize: 'clamp(18px,3.5vw,28px)',
              color: '#d4af37', marginBottom: 10, marginTop: 0,
            }}>
              Verificando Acceso
            </h2>
            <p style={{
              fontSize: 'clamp(10px,1.7vw,12px)',
              color: 'rgba(232,223,192,.4)',
              letterSpacing: 3, fontFamily: '"Cinzel", serif',
              textTransform: 'uppercase', minHeight: 18,
              transition: 'all .35s',
            }}>
              {validateMsg}
            </p>

            {/* Barra de progreso */}
            <div style={{
              width: '100%', maxWidth: 300, height: 2,
              background: 'rgba(212,175,55,.1)', borderRadius: 2,
              margin: '22px auto 0', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #7c3aed, #d4af37)',
                borderRadius: 2,
                width: `${validatePct}%`,
                transition: 'width .55s ease',
              }}/>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PANTALLA 3 — DESBLOQUEADO
        ══════════════════════════════════════════════════════════════════ */}
        {screen === SCREEN.UNLOCKED && pkgData && (
          <div style={{
            textAlign: 'center',
            animation: 'screenIn .5s ease both',
            width: '100%', maxWidth: 580,
          }}>
            {/* Emoji celebración */}
            <div style={{
              fontSize: 'clamp(52px,10vw,84px)',
              marginBottom: 16,
              animation: 'burst .6s cubic-bezier(.34,1.56,.64,1) both',
              display: 'inline-block',
              filter: 'drop-shadow(0 0 30px rgba(212,175,55,.5))',
            }}>
              🎖️
            </div>

            <h2 style={{
              fontFamily: '"Cinzel", serif',
              fontSize: 'clamp(26px,6.5vw,54px)',
              fontWeight: 900, marginTop: 0, marginBottom: 10,
              background: 'linear-gradient(135deg, #f0d060, #d4af37, #fff8dc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'fadeUp .6s .3s both',
            }}>
              ¡Acceso Desbloqueado!
            </h2>
            <p style={{
              fontSize: 'clamp(13px,2vw,15px)',
              color: 'rgba(232,223,192,.55)',
              marginBottom: 30,
              animation: 'fadeUp .6s .5s both',
            }}>
              {pkgData.user_name
                ? `Sellado a nombre de ${pkgData.user_name}`
                : 'Tu contenido está listo para ti'}
            </p>

            {/* Badges de accesos desbloqueados */}
            <div style={{
              display: 'flex', gap: 10, flexWrap: 'wrap',
              justifyContent: 'center', marginBottom: 36,
              animation: 'fadeUp .6s .7s both',
            }}>
              {tieneP1 && (
                <div style={{
                  padding: 'clamp(8px,1.5vw,12px) clamp(16px,3vw,24px)',
                  borderRadius: 8, fontFamily: '"Cinzel", serif',
                  fontSize: 'clamp(9px,1.4vw,11px)', letterSpacing: 2,
                  textTransform: 'uppercase',
                  background: 'rgba(212,175,55,.1)',
                  border: '1px solid rgba(212,175,55,.4)',
                  color: '#f0d060',
                  animation: 'packPop .5s .85s both',
                }}>
                  ⚡ Paquete 1 — Crea con IA
                </div>
              )}
              {tieneP2 && (
                <div style={{
                  padding: 'clamp(8px,1.5vw,12px) clamp(16px,3vw,24px)',
                  borderRadius: 8, fontFamily: '"Cinzel", serif',
                  fontSize: 'clamp(9px,1.4vw,11px)', letterSpacing: 2,
                  textTransform: 'uppercase',
                  background: 'rgba(124,58,237,.1)',
                  border: '1px solid rgba(124,58,237,.4)',
                  color: '#a78bfa',
                  animation: 'packPop .5s 1.05s both',
                }}>
                  ⚜️ Paquete 2 — Domina y Edita
                </div>
              )}
              {tieneMem && (
                <div style={{
                  padding: 'clamp(8px,1.5vw,12px) clamp(16px,3vw,24px)',
                  borderRadius: 8, fontFamily: '"Cinzel", serif',
                  fontSize: 'clamp(9px,1.4vw,11px)', letterSpacing: 2,
                  textTransform: 'uppercase',
                  background: 'rgba(52,211,153,.07)',
                  border: '1px solid rgba(52,211,153,.3)',
                  color: '#34d399',
                  animation: 'packPop .5s 1.25s both',
                }}>
                  🎖️ 1 Mes Membresía Incluido
                </div>
              )}
            </div>

            {/* Botones de acceso al contenido */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 12,
              maxWidth: 400, margin: '0 auto',
              animation: 'fadeUp .6s 1.4s both',
            }}>
              {tieneP1 && (
                <button
                  className="btn-main"
                  onClick={() => abrirContenido('p1')}
                  disabled={iframeLoading}
                  style={{
                    padding: 'clamp(15px,2.5vw,19px) 32px',
                    background: 'linear-gradient(135deg, rgba(212,175,55,.18), rgba(212,175,55,.07))',
                    border: '1px solid rgba(212,175,55,.5)',
                    color: '#f0d060', fontFamily: '"Cinzel", serif',
                    fontSize: 'clamp(10px,1.7vw,12px)', letterSpacing: 3,
                    textTransform: 'uppercase', borderRadius: 9, cursor: 'pointer',
                    boxShadow: '0 0 22px rgba(212,175,55,.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                >
                  <span>⚡</span>
                  <span>Ver Paquete 1 — Crea con IA</span>
                  {claimedFile1 && (
                    <span style={{ fontSize: 10, opacity: .55, marginLeft: 2 }}>✓ visto</span>
                  )}
                </button>
              )}

              {tieneP2 && (
                <button
                  className="btn-main"
                  onClick={() => abrirContenido('p2')}
                  disabled={iframeLoading}
                  style={{
                    padding: 'clamp(15px,2.5vw,19px) 32px',
                    background: 'linear-gradient(135deg, rgba(124,58,237,.2), rgba(124,58,237,.07))',
                    border: '1px solid rgba(124,58,237,.5)',
                    color: '#a78bfa', fontFamily: '"Cinzel", serif',
                    fontSize: 'clamp(10px,1.7vw,12px)', letterSpacing: 3,
                    textTransform: 'uppercase', borderRadius: 9, cursor: 'pointer',
                    boxShadow: '0 0 22px rgba(124,58,237,.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                >
                  <span>⚜️</span>
                  <span>Ver Paquete 2 — Domina y Edita</span>
                  {claimedFile2 && (
                    <span style={{ fontSize: 10, opacity: .55, marginLeft: 2 }}>✓ visto</span>
                  )}
                </button>
              )}

              {tieneMem && (
                <button
                  className="btn-purple"
                  onClick={() => navigate(tienecuenta ? '/login' : '/bienvenido')}
                  style={{
                    padding: 'clamp(15px,2.5vw,19px) 32px',
                    background: 'linear-gradient(135deg, #581c87, #9333ea, #6b21a8)',
                    border: 'none', color: '#f3e8ff',
                    fontFamily: '"Cinzel", serif',
                    fontSize: 'clamp(10px,1.7vw,12px)', letterSpacing: 3,
                    textTransform: 'uppercase', borderRadius: 9, cursor: 'pointer',
                    boxShadow: '0 4px 0 rgba(0,0,0,.45), 0 8px 24px rgba(147,51,234,.4)',
                  }}
                >
                  {tienecuenta === null ? '⚔️ Activar Membresía...' : tienecuenta ? '⚔️ Entrar al Templo' : '⚔️ Crear mi Cuenta en el Templo'}
                </button>
              )}
            </div>

            {/* Toast de error interno — sin alert() */}
            {loadError && (
              <div style={{
                marginTop: 16,
                padding: '12px 20px',
                background: 'rgba(239,68,68,.12)',
                border: '1px solid rgba(239,68,68,.35)',
                borderRadius: 8, color: '#fca5a5',
                fontFamily: '"Cinzel", serif',
                fontSize: 11, letterSpacing: 2,
                textAlign: 'center',
                animation: 'fadeUp .3s ease both',
              }}>
                ⚠ {loadError}
              </div>
            )}

            {/* Nota si ya revisó algo */}
            {(claimedFile1 || claimedFile2) && (
              <p style={{
                marginTop: 22, fontSize: 11,
                color: 'rgba(212,175,55,.3)',
                fontFamily: '"Cinzel", serif', letterSpacing: 1,
              }}>
                Puedes volver a ver tu contenido cuando quieras.
              </p>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PANTALLA 4 — IFRAME CON CONTENIDO
        ══════════════════════════════════════════════════════════════════ */}
        {screen === SCREEN.CONTENT && (
          <div style={{
            width: '100%', maxWidth: 980,
            animation: 'screenIn .4s ease both',
          }}>
            {/* Barra superior */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14, flexWrap: 'wrap', gap: 10,
            }}>
              <button
                onClick={() => { setScreen(SCREEN.UNLOCKED); setIframeSrc(''); }}
                style={{
                  background: 'rgba(212,175,55,.07)',
                  border: '1px solid rgba(212,175,55,.18)',
                  color: 'rgba(212,175,55,.65)',
                  fontFamily: '"Cinzel", serif',
                  fontSize: 10, letterSpacing: 2,
                  padding: '8px 18px', borderRadius: 6,
                  cursor: 'pointer', textTransform: 'uppercase',
                  transition: 'background .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,175,55,.07)'}
              >
                ← Volver
              </button>
              <div style={{
                fontFamily: '"Cinzel", serif', fontSize: 9,
                letterSpacing: 3, color: 'rgba(212,175,55,.35)',
                textTransform: 'uppercase',
              }}>
                ◈ Contenido Exclusivo · Templo del Propósito
              </div>
            </div>

            {/* Contenedor del iframe */}
            <div style={{
              border: '1px solid rgba(212,175,55,.18)',
              borderRadius: 12, overflow: 'hidden',
              position: 'relative', background: '#07041a',
              boxShadow: '0 0 80px rgba(0,0,0,.65), 0 0 40px rgba(212,175,55,.04)',
            }}>
              {/* Línea dorada superior */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: 'linear-gradient(to right, transparent, rgba(212,175,55,.4), transparent)',
                zIndex: 2,
              }}/>

              {iframeLoading && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(5,3,18,.95)', zIndex: 10,
                  fontFamily: '"Cinzel", serif', fontSize: 11,
                  letterSpacing: 3, color: 'rgba(212,175,55,.45)',
                }}>
                  Cargando contenido...
                </div>
              )}

              <iframe
                ref={iframeRef}
                srcDoc={iframeSrc}
                onLoad={() => setIframeLoading(false)}
                style={{
                  width: '100%', height: '86vh',
                  border: 'none', display: 'block',
                }}
                title="Contenido Exclusivo — Templo del Propósito"
              />
            </div>

            {/* Sello anti-compartir */}
            <p style={{
              textAlign: 'center', marginTop: 10,
              fontSize: 9, color: 'rgba(212,175,55,.18)',
              fontFamily: '"Cinzel", serif', letterSpacing: 2,
              userSelect: 'none',
            }}>
              CONTENIDO SELLADO · PROPOTIENDA.COM · USO PERSONAL EXCLUSIVO
            </p>
          </div>
        )}

      </div>
    </div>
  );
}