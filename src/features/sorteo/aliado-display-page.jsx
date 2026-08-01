/**
 * AliadoDisplayPage.jsx — Templo del Propósito
 * Ruta: /aliado/:slug/display  (PÚBLICA — sin auth)
 *
 * Pantalla fullscreen para mostrar en:
 *   · Teléfono del capacitador durante el pitch
 *   · Tablet sobre el mostrador del negocio
 *   · Smart TV / pantalla del local (cast)
 *
 * Datos en tiempo real vía Supabase Realtime.
 * QR permanente del aliado — nunca cambia aunque cambie el sorteo.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const SUPABASE_URL = 'https://hdwzhwuhlrtrmhnecypm.supabase.co';

// ── Paleta idéntica a SorteoPage ──────────────────────────────────────────────
const C = {
  bg:        '#04020e',
  gold:      '#FFD700',
  goldDim:   'rgba(255,215,0,0.75)',
  goldGlow:  'rgba(255,215,0,0.25)',
  goldLight: '#fff4a0',
  purple:    '#CC44FF',
  purpleDim: 'rgba(204,68,255,0.5)',
  green:     '#44FF88',
  text:      '#FFFFFF',
  muted:     'rgba(255,255,255,0.7)',
  border:    'rgba(255,215,0,0.2)',
  borderHi:  'rgba(255,215,0,0.6)',
};

// ── CSS Global ────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { min-height: 100%; overflow-y: auto; overflow-x: hidden; background: #04020e; }

  @keyframes nebulaAnim   { 0%,100%{transform:scale(1);opacity:0.75}      50%{transform:scale(1.06);opacity:1} }
  @keyframes twinkle      { 0%,100%{opacity:var(--min,0.12);transform:scale(1)} 50%{opacity:1;transform:scale(1.6)} }
  @keyframes particleDrift{
    0%  {transform:translateY(0) translateX(0) rotate(0deg);opacity:.15;}
    33% {transform:translateY(-18px) translateX(6px) rotate(60deg);opacity:.35;}
    66% {transform:translateY(-8px) translateX(-4px) rotate(120deg);opacity:.2;}
    100%{transform:translateY(0) translateX(0) rotate(180deg);opacity:.15;}
  }
  @keyframes scanline     { 0%{top:-2px} 100%{top:100vh} }
  @keyframes pulse        { 0%,100%{opacity:.55} 50%{opacity:1} }
  @keyframes pulseGlow    { 0%,100%{box-shadow:0 0 20px rgba(212,175,55,0.2)} 50%{box-shadow:0 0 60px rgba(212,175,55,0.6),0 0 100px rgba(212,175,55,0.2)} }
  @keyframes textGlow     { 0%,100%{text-shadow:0 0 20px rgba(255,215,0,0.4)} 50%{text-shadow:0 0 60px rgba(255,215,0,1),0 0 100px rgba(255,215,0,0.4)} }
  @keyframes floatY       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes fadeUp       { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes warpIn       { 0%{letter-spacing:24px;opacity:0} 100%{letter-spacing:3px;opacity:1} }
  @keyframes raysRotate   { to{transform:rotate(360deg)} }
  @keyframes countPop     { 0%{transform:scale(0.7);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
  @keyframes qrBreath     { 0%,100%{box-shadow:0 0 30px rgba(255,215,0,0.3),0 0 60px rgba(255,215,0,0.1)} 50%{box-shadow:0 0 60px rgba(255,215,0,0.7),0 0 120px rgba(255,215,0,0.3)} }
  @keyframes barFill      { from{width:0%} to{width:var(--target-w)} }
  @keyframes shimmer      { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes heartbeat    { 0%,100%{transform:scale(1)} 14%{transform:scale(1.06)} 28%{transform:scale(1)} 42%{transform:scale(1.03)} }
  @keyframes dotBlink     { 0%,100%{opacity:1} 50%{opacity:0.2} }
`;

// ── Fondo épico (igual que SorteoPage) ───────────────────────────────────────
function Particles() {
  const stars = Array.from({ length: 58 }, (_, i) => ({
    size:  0.5 + (i % 4) * 0.7,
    left:  `${(i * 1.73 + 0.5) % 100}%`,
    top:   `${(i * 1.61 + 0.8) % 72}%`,
    dur:   `${2.2 + (i % 6) * 0.7}s`,
    delay: `${(i % 8) * 0.55}s`,
    min:   0.07 + (i % 5) * 0.05,
  }));
  const pts = Array.from({ length: 16 }, (_, i) => ({
    size:  1.5 + (i % 3),
    color: i % 4 === 0 ? 'rgba(212,175,55,0.4)'
         : i % 4 === 1 ? 'rgba(204,68,255,0.25)'
         : i % 4 === 2 ? 'rgba(68,136,255,0.2)' : 'rgba(255,229,102,0.3)',
    left:  `${(i * 6.3 + 1.2) % 100}%`,
    top:   `${(i * 6.7 + 2.8) % 100}%`,
    dur:   `${6.5 + i * 0.45}s`,
    delay: `${i * 0.36}s`,
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 130% 65% at 50% 0%, rgba(30,10,80,0.88) 0%, transparent 58%),
          radial-gradient(ellipse 70% 50% at 14% 42%, rgba(10,30,95,0.48) 0%, transparent 54%),
          radial-gradient(ellipse 70% 50% at 86% 28%, rgba(50,8,95,0.4) 0%, transparent 54%),
          radial-gradient(ellipse 95% 70% at 50% 100%, rgba(4,2,14,0.96) 0%, transparent 64%)
        `,
        animation: 'nebulaAnim 22s ease-in-out infinite',
      }} />
      {stars.map((s, i) => (
        <div key={`s${i}`} style={{
          position: 'absolute', borderRadius: '50%', background: '#fff',
          width: s.size, height: s.size, left: s.left, top: s.top,
          ['--min']: s.min,
          animation: `twinkle ${s.dur} ease-in-out infinite`,
          animationDelay: s.delay,
        }} />
      ))}
      {pts.map((p, i) => (
        <div key={`p${i}`} style={{
          position: 'absolute',
          width: p.size, height: p.size, borderRadius: '50%',
          background: p.color, left: p.left, top: p.top,
          animation: `particleDrift ${p.dur} ease-in-out infinite`,
          animationDelay: p.delay,
        }} />
      ))}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.16),transparent)',
        animation: 'scanline 20s linear infinite',
      }} />
    </div>
  );
}

// ── Rayos giratorios ──────────────────────────────────────────────────────────
function Rays({ size = 200, speed = '4s', opacity = 0.18 }) {
  const rays = Array.from({ length: 12 }, (_, i) => ({
    angle: i * 30,
    len:   size * (0.38 + (i % 3) * 0.1),
    w:     1 + (i % 4) * 0.5,
  }));
  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: 'absolute', inset: 0, opacity, animation: `raysRotate ${speed} linear infinite` }}
    >
      {rays.map((r, i) => {
        const cx = size / 2, cy = size / 2;
        const rad = (r.angle * Math.PI) / 180;
        return (
          <line key={i}
            x1={cx} y1={cy}
            x2={cx + Math.cos(rad) * r.len}
            y2={cy + Math.sin(rad) * r.len}
            stroke={C.gold} strokeWidth={r.w} strokeOpacity={0.6 + (i % 3) * 0.1}
          />
        );
      })}
    </svg>
  );
}

// ── Barra de progreso ─────────────────────────────────────────────────────────
function BarraProgreso({ actual, total }) {
  const pct = Math.min((actual / Math.max(total, 1)) * 100, 100);
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        height: 10, background: 'rgba(255,255,255,0.06)',
        borderRadius: 5, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 5,
          width: `${pct}%`,
          background: 'linear-gradient(90deg,#9a7a00,#D4AF37,#ffe98a)',
          transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
          boxShadow: '0 0 12px rgba(212,175,55,0.6)',
        }} />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: 8,
        fontFamily: 'Cinzel, serif', fontSize: 'clamp(9px,1.5vw,12px)',
        letterSpacing: 1, color: C.muted,
      }}>
        <span>{actual} inscritos</span>
        <span>{Math.max(0, total - actual)} lugares libres</span>
      </div>
    </div>
  );
}

// ── Punto live pulsante ───────────────────────────────────────────────────────
function LiveDot() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
        background: C.green,
        boxShadow: `0 0 8px ${C.green}`,
        animation: 'dotBlink 1.4s ease-in-out infinite',
      }} />
      <span style={{
        fontFamily: 'Cinzel, serif', fontSize: 'clamp(8px,1.2vw,10px)',
        letterSpacing: 3, color: C.green,
      }}>EN VIVO</span>
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AliadoDisplayPage() {
  const { slug } = useParams();

  const [estado, setEstado]         = useState('loading'); // loading | ok | error | pausado
  const [aliado, setAliado]         = useState(null);
  const [evento, setEvento]         = useState(null);
  const [ronda,  setRonda]          = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [countKey, setCountKey]     = useState(0); // para animar el contador

  // ── CSS ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // ── Cargar datos del aliado ───────────────────────────────────────────────
  const cargarAliado = useCallback(async () => {
    if (!slug) { setEstado('error'); return; }

    const { data: aliadoData, error } = await supabase
      .from('aliados')
      .select('nombre, activo, sorteo_activo_id, sorteo_eventos(id, nombre, cupo_por_ronda, activo)')
      .eq('slug', slug)
      .single();

    if (error || !aliadoData) { setEstado('error'); return; }
    if (!aliadoData.activo)   { setEstado('pausado'); return; }

    setAliado(aliadoData);
    setEvento(aliadoData.sorteo_eventos);
    await cargarRonda(aliadoData.sorteo_activo_id);
    setEstado('ok');
  }, [slug]);

  const cargarRonda = useCallback(async (eventoId) => {
    if (!eventoId) return;
    const { data } = await supabase
      .from('sorteos')
      .select('id, numero_ronda, cupo, estado')
      .eq('evento_id', eventoId)
      .eq('estado', 'abierto')
      .maybeSingle();
    setRonda(data || null);
    if (data) await cargarParticipantes(data.id);
  }, []);

  const cargarParticipantes = useCallback(async (sorteoId) => {
    if (!sorteoId) return;
    const { data } = await supabase
      .from('sorteo_participantes')
      .select('id, nombre')
      .eq('sorteo_id', sorteoId)
      .order('registered_at', { ascending: true });
    setParticipantes(prev => {
      // Animar el contador solo cuando sube
      if ((data || []).length > prev.length) setCountKey(k => k + 1);
      return data || [];
    });
  }, []);

  useEffect(() => { cargarAliado(); }, [cargarAliado]);

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (estado !== 'ok' || !aliado?.sorteo_activo_id) return;

    const canal = supabase
      .channel(`display-${slug}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'sorteos',
        filter: `evento_id=eq.${aliado.sorteo_activo_id}`,
      }, () => cargarRonda(aliado.sorteo_activo_id))
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'sorteo_participantes',
      }, () => { if (ronda?.id) cargarParticipantes(ronda.id); })
      .subscribe();

    return () => supabase.removeChannel(canal);
  }, [estado, aliado, ronda, slug, cargarRonda, cargarParticipantes]);

  // ── Refresh de seguridad cada 30 segundos (por si algo se desincroniza) ──
  useEffect(() => {
    if (estado !== 'ok') return;
    const t = setInterval(() => {
      if (aliado?.sorteo_activo_id) cargarRonda(aliado.sorteo_activo_id);
    }, 30000);
    return () => clearInterval(t);
  }, [estado, aliado, cargarRonda]);

  // ── URL del QR permanente de este aliado ─────────────────────────────────
  const qrUrl    = `${SUPABASE_URL}/functions/v1/r/${slug}`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}&bgcolor=04020e&color=FFD700&margin=12`;

  const cupoActual = participantes.length;
  const cupoTotal  = ronda?.cupo || evento?.cupo_por_ronda || 10;
  const pct        = Math.min(Math.round((cupoActual / Math.max(cupoTotal, 1)) * 100), 100);

  // ── PANTALLA: LOADING ─────────────────────────────────────────────────────
  if (estado === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Particles />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: `3px solid rgba(255,215,0,0.15)`, borderTopColor: C.gold, borderRadius: '50%', animation: 'raysRotate 0.9s linear infinite', margin: '0 auto 20px' }} />
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: 4, color: C.goldDim, animation: 'pulse 1.5s ease-in-out infinite' }}>
            INVOCANDO...
          </p>
        </div>
      </div>
    );
  }

  // ── PANTALLA: ERROR / PAUSADO ─────────────────────────────────────────────
  if (estado === 'error' || estado === 'pausado') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40 }}>
        <Particles />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
          <img
            src="https://i.imgur.com/7ofsCSm.png"
            alt="Maestro"
            style={{ width: 100, opacity: 0.5, marginBottom: 24, filter: 'grayscale(40%)' }}
          />
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: 5, color: C.goldDim, marginBottom: 12 }}>
            ⚔ TEMPLO DEL PROPÓSITO ⚔
          </div>
          <h2 style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 900, fontSize: 'clamp(18px,4vw,26px)', color: C.gold, marginBottom: 12, letterSpacing: 2 }}>
            {estado === 'pausado' ? 'SORTEO EN PAUSA' : 'SORTEO NO DISPONIBLE'}
          </h2>
          <p style={{ fontFamily: 'Crimson Text, serif', fontSize: 15, color: C.muted, fontStyle: 'italic', lineHeight: 1.7 }}>
            {estado === 'pausado'
              ? 'Este punto aliado está temporalmente pausado. Regresa pronto.'
              : 'Este punto aliado no está activo. Contacta al Templo del Propósito.'}
          </p>
        </div>
      </div>
    );
  }

  // ── PANTALLA: OK — Display principal ─────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(16px,3vw,40px)',
      position: 'relative', overflow: 'visible',
      gap: 'clamp(12px,2.5vh,28px)',
    }}>
      <Particles />

      {/* ── SELLO SUPERIOR ── */}
      <div style={{
        position: 'relative', zIndex: 1, textAlign: 'center',
        animation: 'fadeUp 0.6s ease both',
      }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(7px,1.2vw,10px)', letterSpacing: 5, color: C.goldDim, marginBottom: 4 }}>
          ⚔ TEMPLO DEL PROPÓSITO ⚔
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ height: 1, width: 'clamp(30px,5vw,60px)', background: `linear-gradient(90deg,transparent,${C.gold})` }} />
          <LiveDot />
          <div style={{ height: 1, width: 'clamp(30px,5vw,60px)', background: `linear-gradient(90deg,${C.gold},transparent)` }} />
        </div>
      </div>

      {/* ── NOMBRE DEL NEGOCIO ── */}
      <div style={{
        position: 'relative', zIndex: 1, textAlign: 'center',
        animation: 'warpIn 0.7s ease both',
      }}>
        <h1 style={{
          fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
          fontSize: 'clamp(22px,5.5vw,52px)',
          background: 'linear-gradient(180deg,#fff4a0 0%,#FFD700 45%,#b8860b 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          letterSpacing: 3, lineHeight: 1.1,
          animation: 'textGlow 3s ease-in-out infinite',
          margin: 0,
        }}>
          {aliado?.nombre?.toUpperCase()}
        </h1>
        <p style={{
          fontFamily: 'Cinzel, serif', fontSize: 'clamp(8px,1.4vw,12px)',
          letterSpacing: 3, color: C.goldDim, marginTop: 6,
        }}>
          PUNTO ALIADO DEL TEMPLO
        </p>
      </div>

      {/* ── CUERPO PRINCIPAL: QR + CONTADOR ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 'clamp(24px,4vw,64px)',
        flexWrap: 'wrap',
        width: '100%', maxWidth: 900,
        animation: 'fadeUp 0.7s 0.1s ease both',
      }}>

        {/* QR */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            {/* Rayos detrás del QR */}
            <div style={{ position: 'absolute', inset: -20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Rays size={280} speed="8s" opacity={0.12} />
            </div>
            <div style={{ position: 'absolute', inset: -20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Rays size={280} speed="20s" opacity={0.06} />
            </div>
            <img
              src={qrImgUrl}
              alt={`QR ${aliado?.nombre}`}
              style={{
                width: 'clamp(160px,22vw,260px)',
                height: 'clamp(160px,22vw,260px)',
                borderRadius: 16,
                border: `2px solid ${C.borderHi}`,
                animation: 'qrBreath 3s ease-in-out infinite',
                position: 'relative', zIndex: 1,
                display: 'block',
              }}
            />
          </div>
          <div style={{
            fontFamily: 'Cinzel, serif', fontSize: 'clamp(9px,1.5vw,13px)',
            letterSpacing: 4, color: C.goldDim, textAlign: 'center',
            animation: 'pulse 2.5s ease-in-out infinite',
          }}>
            ESCANEA · PARTICIPA · GANA
          </div>
        </div>

        {/* Panel derecho: contador + barra + premio */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 'clamp(14px,2.5vh,24px)',
          minWidth: 'clamp(220px,35vw,400px)', flex: 1, maxWidth: 420,
        }}>

          {/* Contador */}
          <div style={{
            background: 'rgba(10,5,26,0.97)',
            border: `1.5px solid ${C.borderHi}`,
            borderRadius: 20, padding: 'clamp(16px,2.5vw,28px)',
            textAlign: 'center',
            animation: 'pulseGlow 3s ease-in-out infinite',
          }}>
            <div style={{
              fontFamily: 'Cinzel, serif', fontSize: 'clamp(9px,1.3vw,11px)',
              letterSpacing: 4, color: C.goldDim, marginBottom: 8,
            }}>
              PARTICIPANTES EN ESTA RONDA
            </div>
            <div
              key={countKey}
              style={{
                fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
                fontSize: 'clamp(52px,10vw,96px)',
                background: 'linear-gradient(180deg,#fff4a0,#FFD700)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                lineHeight: 1,
                animation: 'countPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
              }}
            >
              {cupoActual}
            </div>
            <div style={{
              fontFamily: 'Cinzel, serif', fontSize: 'clamp(11px,1.8vw,16px)',
              color: 'rgba(255,215,0,0.5)', marginTop: 4,
            }}>
              de {cupoTotal} lugares
            </div>
          </div>

          {/* Barra de progreso */}
          <div style={{
            background: 'rgba(10,5,26,0.8)',
            border: `1px solid ${C.border}`,
            borderRadius: 14, padding: 'clamp(14px,2vw,22px)',
          }}>
            <div style={{
              fontFamily: 'Cinzel, serif', fontSize: 'clamp(8px,1.2vw,10px)',
              letterSpacing: 3, color: C.goldDim, marginBottom: 12, textAlign: 'center',
            }}>
              {pct < 100
                ? `${100 - pct}% DE LUGARES DISPONIBLES`
                : '🔥 RONDA COMPLETA — SORTEANDO...'}
            </div>
            <BarraProgreso actual={cupoActual} total={cupoTotal} />
          </div>

          {/* Premio */}
          <div style={{
            background: 'linear-gradient(135deg,rgba(255,215,0,0.07),rgba(204,68,255,0.04))',
            border: `1px solid rgba(255,215,0,0.18)`,
            borderRadius: 14, padding: 'clamp(14px,2vw,22px)',
            textAlign: 'center',
            animation: 'heartbeat 3.5s ease-in-out infinite',
          }}>
            <div style={{
              fontFamily: 'Cinzel, serif', fontSize: 'clamp(8px,1.2vw,10px)',
              letterSpacing: 4, color: C.goldDim, marginBottom: 6,
            }}>
              EL GANADOR RECIBE
            </div>
            <div style={{
              fontFamily: 'Cinzel Decorative, serif', fontWeight: 900,
              fontSize: 'clamp(15px,2.8vw,26px)',
              background: `linear-gradient(135deg,${C.gold},${C.purple})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              letterSpacing: 2, lineHeight: 1.2,
            }}>
              6 MESES GRATIS
            </div>
            <div style={{
              fontFamily: 'Crimson Text, serif', fontSize: 'clamp(11px,1.6vw,14px)',
              color: C.muted, fontStyle: 'italic', marginTop: 4,
            }}>
              en el Templo del Propósito · valor $534 USD
            </div>
            <div style={{
              fontFamily: 'Cinzel, serif', fontSize: 'clamp(8px,1.1vw,10px)',
              color: 'rgba(255,215,0,0.4)', letterSpacing: 2, marginTop: 8,
            }}>
              + todos los demás reciben cupón especial
            </div>
          </div>
        </div>
      </div>

      {/* ── MAESTRO + RONDA ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', gap: 'clamp(12px,2vw,24px)',
        animation: 'fadeUp 0.7s 0.2s ease both',
      }}>
        <img
          src="https://i.imgur.com/7ofsCSm.png"
          alt="Maestro"
          style={{
            width: 'clamp(36px,5vw,54px)', height: 'auto',
            filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.5))',
            animation: 'floatY 4s ease-in-out infinite',
          }}
        />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Cinzel, serif', fontWeight: 900,
            fontSize: 'clamp(10px,1.6vw,14px)',
            color: C.gold, letterSpacing: 2,
          }}>
            RONDA #{ronda?.numero_ronda || '—'}
          </div>
          <div style={{
            fontFamily: 'Crimson Text, serif', fontSize: 'clamp(10px,1.4vw,13px)',
            color: C.muted, fontStyle: 'italic',
          }}>
            {evento?.nombre}
          </div>
        </div>
        <img
          src="https://i.imgur.com/7ofsCSm.png"
          alt=""
          style={{
            width: 'clamp(36px,5vw,54px)', height: 'auto',
            filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.5))',
            animation: 'floatY 4s ease-in-out infinite',
            animationDelay: '2s',
            transform: 'scaleX(-1)',
          }}
        />
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        position: 'relative', zIndex: 1, textAlign: 'center',
        animation: 'fadeUp 0.7s 0.3s ease both',
      }}>
        <div style={{
          fontFamily: 'Cinzel, serif', fontSize: 'clamp(7px,1vw,9px)',
          letterSpacing: 3, color: 'rgba(255,215,0,0.3)',
        }}>
          propotienda.com · sorteo automatico · datos en tiempo real
        </div>
      </div>

    </div>
  );
}