/**
 * ModuleViewer.jsx
 * Página de un módulo individual.
 * - Lee el protocolo del usuario desde Supabase
 * - Carga el HTML correspondiente desde Supabase Storage con URL firmada
 * - Modal de evidencia con validación por IA → da XP + cristales + post en comunidad
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import useMembershipStore, {
  ACADEMY_MODULES,
  MODULE_TYPE_CONFIG,
  selectHasAccessTo,
} from '../../store/useMembershipStore';
import { useGraduacionStore } from '../../components/GraduacionCeremonia';

// ─── Configuración ────────────────────────────────────────────────────────────
const SUPABASE_BUCKET = 'academy-modules';

const PROTOCOLO_MAP = {
  V1: 'VISUAL_BOARD.html',
  V2: 'micro-metas.html',
  V3: 'micro-metas.html',
  V4: 'declaracion-proposito.html',
  V5: 'Metodo_de_Redefinicion_de_Metas (1).html',
  C1: 'diario-guerrero.html',
  C2: 'bloques-de-maestria.html',
  C3: 'ritual_DE_ENFOQUE_MATUTINO_optimized (1).html',
  C4: 'desafio_del_miedo_consciente-corregido.html',
  C5: 'RUTINA-555-optimizado.html',
  I1: 'protocolo_de_neg_colaborativa_relaciones.html',
  I2: 'TONO_DE_VOZ__PAUSAS_Y_RITMO.html',
  I3: 'EL PODER DE LA VENTA ETICA.html',
  I4: 'influye-desde-el-ejemplo_vocacion_v2.html',
  I5: 'puntualidad-y-promesas_mente (1).html',
  A1: 'tu-entorno-importa_parte_1.html',
  A2: 'tu-entorno-importa_parte_2.html',
  A3: 'creencias-limitantes.html',
  A4: 'refuerza-tu-valor-propio-optimizado.html',
  A5: 'victima-a-templario-optimized.html',
  R1: 'la_vida_de_un_templario_hazlo_facil.html',
  R2: 'ikigai-vocacion.html',
  R3: 'ESTRETEGIA_PARA_ROMPER_ESTANCAMIENTO_DE_HABITOS_MANEJO_DE_BURNOUT.html',
  R4: 'supera_el_miedo_a_la_incomodidad.html',
  R5: 'metodo_de_recompensas_inmediatas.html',
};

// IDs exactos de categorías en Supabase
const CATEGORY_IDS = {
  'Juramento Templario':  'd73d38b5-51b3-467a-a34c-4fdcd529566c',
  'Reto del Iniciado':    'c37a93b1-1116-49db-89b4-5260dcfa65e3',
  'General discussion':   '71d30982-85dc-4d6f-8a69-6a04aee17084',
  'Corrección Divina':    '2fc0e00f-54d9-45d6-9376-514351d0d486',
  'Logros Templarios':    'f9f2c023-48be-4a99-a435-0b0ace4cec08',
};

// ─── Modal de Evidencia Épico ─────────────────────────────────────────────────
const EvidenceModal = ({ module, cfg, userId, onSuccess, onClose }) => {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState('writing');
  const [feedback, setFeedback] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 90,
      size: 1.5 + Math.random() * 2,
      dur: 3 + Math.random() * 5,
      delay: Math.random() * 5,
      type: i % 3,
    }))
  );
  const accent = cfg?.color || '#C084FC';
  const minWords = 15;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = wordCount >= minWords && (phase === 'writing' || phase === 'rejected');
  const progressPct = Math.min((wordCount / minWords) * 100, 100);
  

  const validateWithAI = async () => {
    setPhase('validating');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('validate-evidence', {
        body: { text, moduleTitle: module.title, evidencePrompt: module.evidencePrompt },
      });
      if (fnError) throw new Error(fnError.message);
      let result;
      try { result = JSON.parse(JSON.stringify(data)); }
      catch { result = { approved: false, message: String(data) }; }
      setFeedback(result.message);
      if (result.approved) { setPhase('approved'); }
      else {
        if (!result.technicalError) setAttempts(a => a + 1);
        setPhase('rejected');
      }
    } catch (err) {
      setFeedback(`Error: ${err.message}`);
      setPhase('rejected');
    }
  };

  const publishAndReward = async () => {
    setPhase('posting');
    try {
      const categoryId = CATEGORY_IDS[module.evidenceCategory];
      const postBody = `${module.evidencePrompt}\n\n${text}`;
      const { data: existing } = await supabase
        .from('module_progress').select('completed_at')
        .eq('user_id', userId).eq('module_slug', module.slug)
        .not('completed_at', 'is', null).maybeSingle();
      const yaCobroRecompensa = !!existing;
      const { error: postError } = await supabase.from('community_posts')
        .insert({ user_id: userId, category_id: categoryId, body: postBody });
      if (postError) throw postError;
      if (!yaCobroRecompensa) {
        const { data: profile } = await supabase.from('profiles')
          .select('xp, cristales').eq('id', userId).single();
        if (profile) {
          await supabase.from('profiles').update({
            xp: (profile.xp || 0) + module.xpReward,
            cristales: (profile.cristales || 0) + module.gemReward + (module.coinReward || 0),
          }).eq('id', userId);
        }
        await supabase.from('module_progress').upsert({
          user_id: userId, module_slug: module.slug,
          completed_at: new Date().toISOString(),
        });
      }
      // ── TRACKEO DE MISIÓN: Activación Templaria ──
      if (!yaCobroRecompensa) {
        try {
          const { missionsService } = await import('../../services/missions.service');
          await missionsService.trackProgress(userId, 'templario_activation', 1);
          await missionsService.trackProgress(userId, 'templario_activations_count', 1);
        } catch(e) {
          console.warn('Misión activación no trackeada:', e);
        }
      }
      // ─────────────────────────────────────────────

      setRewardClaimed(yaCobroRecompensa);
      setPhase('done');
      setTimeout(() => onSuccess({
        xp: yaCobroRecompensa ? 0 : module.xpReward,
        gems: yaCobroRecompensa ? 0 : module.gemReward,
        coins: yaCobroRecompensa ? 0 : (module.coinReward || 0),
        yaCobroRecompensa,
      }), 1800);
    } catch (err) {
      console.error('Error publicando evidencia:', err);
      setFeedback('Error al publicar. Intenta de nuevo.');
      setPhase('approved');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(0.5rem, 3vw, 1.5rem)',
      background: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(16px)',
      animation: 'emFadeIn 0.3s ease',
    }}>

      <style>{`
        @keyframes emFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes emSlideUp { from{opacity:0;transform:translateY(2rem) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes emParticle { 0%{opacity:0;transform:translateY(0) scale(0)} 15%{opacity:1;transform:translateY(-0.6rem) scale(1)} 85%{opacity:0.4} 100%{opacity:0;transform:translateY(-3rem) scale(0.2)} }
        @keyframes emOrbRing { 0%{transform:translate(-50%,-50%) scale(0.7);opacity:0.6} 100%{transform:translate(-50%,-50%) scale(2);opacity:0} }
        @keyframes emPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.15)} }
        @keyframes emShimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes emSpin { to{transform:rotate(360deg)} }
        @keyframes emSuccessPop { 0%{transform:scale(0.4);opacity:0} 65%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
        @keyframes emGlow { 0%,100%{box-shadow:0 0 1.5rem ${accent}33,0 2rem 4rem rgba(0,0,0,0.8)} 50%{box-shadow:0 0 3rem ${accent}55,0 2rem 4rem rgba(0,0,0,0.8)} }
        @keyframes emTopLine { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }
        @keyframes emRejectShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-0.4rem)} 40%{transform:translateX(0.4rem)} 60%{transform:translateX(-0.3rem)} 80%{transform:translateX(0.3rem)} }
        @keyframes emProgressFill { from{width:0%} to{width:${progressPct}%} }
        @keyframes emBadgePop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes emFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-0.4rem)} }
        @keyframes emSwordSpin { 0%{transform:rotate(0deg) scale(1)} 50%{transform:rotate(180deg) scale(1.1)} 100%{transform:rotate(360deg) scale(1)} }
      `}</style>

      {/* Partículas flotantes de fondo */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'fixed',
          left: `${p.x}%`, top: `${p.y}%`,
          width: `${p.size}px`, height: `${p.size}px`,
          borderRadius: '50%',
          background: p.type === 0 ? accent : p.type === 1 ? '#F5C518' : 'rgba(255,255,255,0.6)',
          animation: `emParticle ${p.dur}s ease-in-out infinite`,
          animationDelay: `${p.delay}s`,
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      ))}

      {/* Modal */}
      <div style={{
        width: '100%', maxWidth: 'clamp(20rem, 90vw, 38rem)',
        background: `
          radial-gradient(ellipse at 50% 0%, ${accent}18 0%, transparent 50%),
          radial-gradient(ellipse at 0% 100%, rgba(245,197,24,0.08) 0%, transparent 50%),
          linear-gradient(160deg, rgba(14,12,26,0.99) 0%, rgba(8,6,18,1) 100%)
        `,
        border: `1px solid ${accent}33`,
        borderRadius: 'clamp(1rem, 3vw, 1.5rem)',
        padding: 'clamp(1.25rem, 5vw, 2.25rem)',
        boxShadow: `0 0 5rem ${accent}22, 0 2.5rem 5rem rgba(0,0,0,0.9)`,
        position: 'relative',
        maxHeight: '92vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        animation: 'emSlideUp 0.45s cubic-bezier(0.16,1,0.3,1), emGlow 4s ease-in-out infinite',
        zIndex: 1,
      }}>

        {/* Línea superior luminosa */}
        <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px',
          background: `linear-gradient(90deg, transparent, ${accent}, #F5C518, ${accent}, transparent)`,
          borderRadius: '0 0 999px 999px',
          animation: 'emTopLine 3s ease-in-out infinite',
        }} />

        {/* Esquinas decorativas */}
        <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', width: '1.2rem', height: '1.2rem', borderTop: `2px solid ${accent}66`, borderLeft: `2px solid ${accent}66`, borderRadius: '0.2rem 0 0 0', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', width: '1.2rem', height: '1.2rem', borderTop: `2px solid ${accent}66`, borderRight: `2px solid ${accent}66`, borderRadius: '0 0.2rem 0 0', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '0.6rem', left: '0.6rem', width: '1.2rem', height: '1.2rem', borderBottom: `2px solid ${accent}66`, borderLeft: `2px solid ${accent}66`, borderRadius: '0 0 0 0.2rem', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '0.6rem', right: '0.6rem', width: '1.2rem', height: '1.2rem', borderBottom: `2px solid ${accent}66`, borderRight: `2px solid ${accent}66`, borderRadius: '0 0 0.2rem 0', pointerEvents: 'none' }} />

        {/* Botón cerrar */}
        {(phase === 'writing' || phase === 'rejected') && (
          <button onClick={onClose} style={{
            position: 'absolute', top: 'clamp(0.75rem, 2vw, 1rem)', right: 'clamp(0.75rem, 2vw, 1rem)',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${accent}33`,
            borderRadius: '50%',
            width: 'clamp(1.75rem, 5vw, 2.25rem)', height: 'clamp(1.75rem, 5vw, 2.25rem)',
            color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${accent}22`; e.currentTarget.style.borderColor = `${accent}88`; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = `${accent}33`; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >✕</button>
        )}

        {/* ════════════════════════════════════════
            FASE: ESCRIBIENDO / RECHAZADO
        ════════════════════════════════════════ */}
        {(phase === 'writing' || phase === 'rejected') && (
          <>
            {/* ── HEADER con orbe y título ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.6rem, 2vw, 1rem)', marginBottom: 'clamp(1.25rem, 4vw, 1.75rem)', paddingRight: '2.5rem' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: '3.5rem', height: '3.5rem',
                  borderRadius: '50%',
                  border: `1px solid ${accent}44`,
                  animation: 'emOrbRing 2.5s ease-out infinite',
                  pointerEvents: 'none',
                }} />
                <div style={{
                  width: 'clamp(2.25rem, 6vw, 2.75rem)', height: 'clamp(2.25rem, 6vw, 2.75rem)',
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${accent}55, ${accent}11)`,
                  border: `1px solid ${accent}66`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'clamp(1rem, 3vw, 1.3rem)',
                  boxShadow: `0 0 1.5rem ${accent}44`,
                  animation: 'emPulse 3s ease-in-out infinite',
                }}>⚔️</div>
              </div>
              <div>
                <p style={{
                  fontFamily: 'Cinzel,serif',
                  fontSize: 'clamp(0.55rem, 1.2vw, 0.65rem)',
                  letterSpacing: '0.3em', color: accent,
                  textTransform: 'uppercase', opacity: 0.9, margin: '0 0 0.2rem 0',
                  textShadow: `0 0 1rem ${accent}88`,
                }}>⚜ Evidencia del Templario</p>
                <h3 style={{
                  fontFamily: 'Cinzel,serif',
                  fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)',
                  color: '#fff', margin: 0, fontWeight: 700,
                  lineHeight: 1.2,
                  textShadow: '0 0 2rem rgba(255,255,255,0.3)',
                }}>{module.title}</h3>
              </div>
            </div>

            {/* ── DIVIDER ornamental ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'clamp(1rem, 3vw, 1.4rem)' }}>
              <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${accent}44)` }} />
              <span style={{ color: accent, opacity: 0.6, fontSize: '0.6rem', letterSpacing: '0.3em' }}>✦ ✦ ✦</span>
              <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${accent}44, transparent)` }} />
            </div>

            {/* ── BLOQUE: QUÉ DEBES HACER (reflexión) ── */}
            <div style={{
              position: 'relative', overflow: 'hidden',
              background: `linear-gradient(135deg, ${accent}12 0%, rgba(0,0,0,0) 60%)`,
              border: `1px solid ${accent}33`,
              borderLeft: `3px solid ${accent}`,
              borderRadius: '0.75rem',
              padding: 'clamp(0.875rem, 3vw, 1.2rem)',
              marginBottom: 'clamp(0.75rem, 2.5vw, 1rem)',
            }}>
              <div style={{ position: 'absolute', top: '-2rem', right: '-1rem', fontSize: '4rem', opacity: 0.04, pointerEvents: 'none', userSelect: 'none', fontFamily: 'Cinzel,serif' }}>📜</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.8rem' }}>📜</span>
                <p style={{
                  fontFamily: 'Cinzel,serif', fontSize: 'clamp(0.55rem, 1.2vw, 0.65rem)',
                  color: accent, letterSpacing: '0.2em',
                  textTransform: 'uppercase', margin: 0, opacity: 0.95,
                  textShadow: `0 0 0.8rem ${accent}66`,
                }}>Tu reflexión de esta semana</p>
              </div>
              <p style={{
                fontFamily: '"Crimson Text",serif',
                fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                color: 'rgba(255,255,255,0.92)', lineHeight: 1.65, margin: 0,
                letterSpacing: '0.01em',
              }}>{module.evidencePrompt}</p>
            </div>

            {/* ── BLOQUE: CÓMO RESPONDER (hint) — ÉPICO E ILEGIBLE COMO CAMPO ── */}
            <div style={{
              position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(245,197,24,0.09) 0%, rgba(245,197,24,0.03) 100%)',
              border: '1px solid rgba(245,197,24,0.3)',
              borderLeft: '3px solid rgba(245,197,24,0.8)',
              borderRadius: '0.75rem',
              padding: 'clamp(0.75rem, 2.5vw, 1rem)',
              marginBottom: 'clamp(1rem, 3vw, 1.4rem)',
              pointerEvents: 'none',
              userSelect: 'none',
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '3px', background: 'linear-gradient(180deg, rgba(245,197,24,0.8), transparent)', borderRadius: '0 0.75rem 0.75rem 0', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '1.4rem', height: '1.4rem', borderRadius: '50%', background: 'rgba(245,197,24,0.2)', border: '1px solid rgba(245,197,24,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>💡</div>
                <p style={{
                  fontFamily: 'Cinzel,serif', fontSize: 'clamp(0.55rem, 1.1vw, 0.63rem)',
                  color: 'rgba(245,197,24,0.9)', letterSpacing: '0.22em',
                  textTransform: 'uppercase', margin: 0,
                  textShadow: '0 0 1rem rgba(245,197,24,0.5)',
                }}>Cómo responder</p>
              </div>
              <p style={{
                fontFamily: '"Crimson Text",serif',
                fontSize: 'clamp(0.9rem, 2.2vw, 1.05rem)',
                color: 'rgba(255,255,255,0.8)', lineHeight: 1.6,
                margin: 0, fontStyle: 'italic',
                letterSpacing: '0.01em',
              }}>{module.evidenceHint}</p>
            </div>

            {/* ── FEEDBACK DE RECHAZO ── */}
            {phase === 'rejected' && feedback && (
              <div style={{ position: 'relative', marginBottom: 'clamp(0.75rem, 2vw, 1rem)' }}>

                {/* Flechas apuntando ARRIBA → la pregunta no fue respondida */}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '3px', marginBottom: '0.5rem',
                  animation: 'emFadeIn 0.4s ease',
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 0, height: 0,
                      borderLeft: '7px solid transparent',
                      borderRight: '7px solid transparent',
                      borderBottom: `8px solid rgba(239,68,68,${0.7 - i * 0.2})`,
                      animation: `emPulse ${1.1 + i * 0.25}s ease-in-out infinite`,
                      animationDelay: `${i * 0.18}s`,
                    }} />
                  ))}
                </div>

                {/* Bloque principal de rechazo */}
                <div style={{
                  position: 'relative', overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.13) 0%, rgba(239,68,68,0.04) 100%)',
                  border: '1px solid rgba(239,68,68,0.45)',
                  borderLeft: '4px solid #EF4444',
                  borderRadius: '0.875rem',
                  padding: 'clamp(1rem, 3vw, 1.4rem)',
                  boxShadow: '0 0 2.5rem rgba(239,68,68,0.15), inset 0 1px 0 rgba(239,68,68,0.15)',
                  animation: 'emRejectShake 0.5s ease, emFadeIn 0.3s ease',
                }}>
                  {/* Línea glow superior */}
                  <div style={{
                    position: 'absolute', top: 0, left: '5%', right: '5%', height: '2px',
                    background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.9), transparent)',
                    borderRadius: '0 0 999px 999px',
                  }} />
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '1.6rem', height: '1.6rem', borderRadius: '50%',
                      background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', flexShrink: 0,
                      animation: 'emPulse 2s ease-in-out infinite',
                    }}>⚠</div>
                    <p style={{
                      fontFamily: 'Cinzel,serif',
                      fontSize: 'clamp(0.58rem, 1.2vw, 0.68rem)',
                      color: '#F87171', margin: 0,
                      letterSpacing: '0.2em', textTransform: 'uppercase',
                      textShadow: '0 0 1rem rgba(239,68,68,0.6)',
                    }}>El oráculo habló:</p>
                  </div>
                  {/* Mensaje */}
                  <p style={{
                    fontFamily: '"Crimson Text",serif',
                    fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
                    color: 'rgba(255,255,255,0.92)',
                    margin: 0, lineHeight: 1.65,
                    letterSpacing: '0.01em',
                  }}>{feedback}</p>
                  {/* Intento counter */}
                  {attempts >= 2 && (
                    <div style={{
                      marginTop: '0.75rem', paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(239,68,68,0.2)',
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}>
                      <span style={{ fontSize: '0.7rem' }}>🔄</span>
                      <p style={{
                        fontFamily: 'Cinzel,serif', fontSize: 'clamp(0.5rem, 1vw, 0.6rem)',
                        color: 'rgba(248,113,113,0.6)', margin: 0, letterSpacing: '0.1em',
                      }}>Intento {attempts} — más detalle, más específico, más tú.</p>
                    </div>
                  )}
                </div>

                {/* Flechas apuntando ABAJO → escribe aquí abajo */}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '3px', marginTop: '0.5rem',
                  animation: 'emFadeIn 0.6s ease',
                }}>
                  {[2, 1, 0].map(i => (
                    <div key={i} style={{
                      width: 0, height: 0,
                      borderLeft: '7px solid transparent',
                      borderRight: '7px solid transparent',
                      borderTop: `8px solid rgba(239,68,68,${0.7 - i * 0.2})`,
                      animation: `emPulse ${1.1 + i * 0.25}s ease-in-out infinite`,
                      animationDelay: `${i * 0.18}s`,
                    }} />
                  ))}
                </div>

              </div>
            )}

            {/* ── TEXTAREA ── */}
            <div style={{ position: 'relative', marginBottom: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Escribe tu reflexión aquí… sé específico, honesto y concreto sobre lo que viviste esta semana."
                rows={6}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: `linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)`,
                  border: `1px solid ${wordCount >= minWords ? accent + '66' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '0.875rem',
                  padding: 'clamp(0.875rem, 3vw, 1.1rem)',
                  paddingBottom: 'clamp(2rem, 5vw, 2.5rem)',
                  color: '#fff', fontFamily: '"Crimson Text",serif',
                  fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)', lineHeight: 1.7,
                  resize: 'vertical', outline: 'none',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                  boxShadow: wordCount >= minWords ? `0 0 1.5rem ${accent}15, inset 0 1px 0 rgba(255,255,255,0.05)` : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                }}
                onFocus={e => { e.target.style.borderColor = `${accent}99`; e.target.style.boxShadow = `0 0 2rem ${accent}22, inset 0 1px 0 rgba(255,255,255,0.06)`; }}
                onBlur={e => { e.target.style.borderColor = wordCount >= minWords ? `${accent}66` : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = wordCount >= minWords ? `0 0 1.5rem ${accent}15` : 'none'; }}
              />
              <div style={{
                position: 'absolute', bottom: '0.6rem', left: '0.875rem',
                right: '0.875rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                {/* Barra de progreso de palabras */}
                <div style={{ flex: 1, height: '3px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '999px',
                    width: `${progressPct}%`,
                    background: progressPct >= 100
                      ? `linear-gradient(90deg, ${accent}, #10B981)`
                      : `linear-gradient(90deg, ${accent}88, ${accent})`,
                    transition: 'width 0.3s ease',
                    boxShadow: progressPct >= 100 ? `0 0 0.5rem ${accent}88` : 'none',
                  }} />
                </div>
                <span style={{
                  fontFamily: 'Cinzel,serif',
                  fontSize: 'clamp(0.55rem, 1.2vw, 0.62rem)',
                  color: wordCount >= minWords ? accent : 'rgba(255,255,255,0.25)',
                  letterSpacing: '0.08em', whiteSpace: 'nowrap',
                  transition: 'color 0.3s',
                  textShadow: wordCount >= minWords ? `0 0 0.8rem ${accent}` : 'none',
                }}>
                  {wordCount}/{minWords} {wordCount >= minWords ? '✓' : ''}
                </span>
              </div>
            </div>

            {/* ── RECOMPENSAS PREVIEW ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'clamp(0.3rem, 1.5vw, 0.5rem)',
              marginBottom: 'clamp(0.875rem, 3vw, 1.25rem)',
            }}>
              {[
                { val: `+${module.xpReward}`, label: 'XP', color: '#F5C518', icon: '✨' },
{ val: `+${module.coinReward || 40}`, label: 'PropoCoins', color: '#C084FC', icon: '🪙' },
{ val: '📌', label: module.evidenceCategory, color: accent, icon: null },
              ].map((r, i) => (
                <div key={i} style={{
                  textAlign: 'center',
                  padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.25rem, 1vw, 0.5rem)',
                  background: `linear-gradient(135deg, ${r.color}12 0%, rgba(0,0,0,0) 100%)`,
                  border: `1px solid ${r.color}28`,
                  borderRadius: '0.625rem',
                  animation: `emBadgePop 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.07}s both`,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${r.color}55`; e.currentTarget.style.background = `linear-gradient(135deg, ${r.color}22 0%, rgba(0,0,0,0) 100%)`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${r.color}28`; e.currentTarget.style.background = `linear-gradient(135deg, ${r.color}12 0%, rgba(0,0,0,0) 100%)`; }}
                >
                  <p style={{ margin: '0 0 0.2rem 0', fontFamily: 'Cinzel,serif', fontSize: 'clamp(0.8rem, 2.2vw, 1rem)', color: r.color, fontWeight: 700, textShadow: `0 0 1rem ${r.color}66` }}>{r.val}</p>
                  <p style={{ margin: 0, fontFamily: 'Cinzel,serif', fontSize: 'clamp(0.45rem, 1vw, 0.55rem)', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', lineHeight: 1.3 }}>{r.label}</p>
                </div>
              ))}
            </div>

            {/* ── BOTÓN VALIDAR ── */}
            <button
              onClick={validateWithAI}
              disabled={!canSubmit}
              style={{
                width: '100%',
                padding: 'clamp(0.875rem, 3vw, 1.1rem)',
                background: canSubmit
                  ? `linear-gradient(135deg, ${accent}ee 0%, ${accent} 50%, ${accent}cc 100%)`
                  : 'rgba(255,255,255,0.05)',
                backgroundSize: canSubmit ? '200% auto' : 'auto',
                animation: canSubmit ? 'emShimmer 3s linear infinite' : 'none',
                border: canSubmit ? `1px solid ${accent}55` : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.875rem',
                color: canSubmit ? '#000' : 'rgba(255,255,255,0.18)',
                fontFamily: 'Cinzel,serif', fontWeight: 700,
                fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                boxShadow: canSubmit ? `0 0.25rem 1.5rem ${accent}44, 0 0 3rem ${accent}22` : 'none',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => canSubmit && (e.currentTarget.style.transform = 'translateY(-0.15rem)', e.currentTarget.style.boxShadow = `0 0.5rem 2rem ${accent}66, 0 0 4rem ${accent}33`)}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = canSubmit ? `0 0.25rem 1.5rem ${accent}44` : 'none'; }}
            >
              {canSubmit ? '⚡ Validar con el Oráculo' : `Escribe al menos ${minWords} palabras`}
            </button>
          </>
        )}

        {/* ════════════════════════════════════════
            FASE: VALIDANDO
        ════════════════════════════════════════ */}
        {phase === 'validating' && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(2.5rem, 8vw, 4rem) 1rem', gap: 'clamp(1rem, 3vw, 1.75rem)',
            minHeight: '16rem',
          }}>
            <div style={{ position: 'relative', width: 'clamp(4rem, 10vw, 5.5rem)', height: 'clamp(4rem, 10vw, 5.5rem)' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  position: 'absolute',
                  top: `${i * 12}%`, left: `${i * 12}%`,
                  right: `${i * 12}%`, bottom: `${i * 12}%`,
                  borderRadius: '50%',
                  border: `${i === 2 ? 2 : 1}px solid ${accent}${i === 2 ? '88' : i === 1 ? '44' : '22'}`,
                  animation: `emPulse ${1.8 + i * 0.4}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }} />
              ))}
              <div style={{
                position: 'absolute', inset: '25%',
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, ${accent}66, ${accent}22)`,
                border: `1px solid ${accent}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(1rem, 3vw, 1.4rem)',
                animation: 'emSwordSpin 3s ease-in-out infinite',
                boxShadow: `0 0 2rem ${accent}55`,
              }}>⚔️</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Cinzel,serif', fontSize: 'clamp(0.6rem, 1.5vw, 0.72rem)', letterSpacing: '0.3em', color: accent, textTransform: 'uppercase', marginBottom: '0.5rem', textShadow: `0 0 1rem ${accent}` }}>El oráculo evalúa tu evidencia</p>
              <p style={{ fontFamily: '"Crimson Text",serif', fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)', color: 'rgba(255,255,255,0.45)', margin: 0 }}>Solo un momento, templario…</p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            FASE: APROBADO
        ════════════════════════════════════════ */}
        {phase === 'approved' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(1rem, 3vw, 1.5rem)', padding: 'clamp(0.5rem, 2vw, 1rem) 0' }}>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              {[0,1].map(i => (
                <div key={i} style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: `${3.5 + i}rem`, height: `${3.5 + i}rem`,
                  borderRadius: '50%', border: '1px solid rgba(16,185,129,0.3)',
                  animation: `emOrbRing ${2 + i * 0.8}s ease-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                  pointerEvents: 'none',
                }} />
              ))}
              <div style={{
                width: 'clamp(3rem, 8vw, 4rem)', height: 'clamp(3rem, 8vw, 4rem)',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, rgba(16,185,129,0.4), rgba(16,185,129,0.08))',
                border: '2px solid #10B981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
                boxShadow: '0 0 2.5rem rgba(16,185,129,0.5)',
                animation: 'emSuccessPop 0.5s cubic-bezier(0.16,1,0.3,1)',
              }}>✓</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Cinzel,serif', fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', letterSpacing: '0.3em', color: '#10B981', textTransform: 'uppercase', marginBottom: '0.5rem', textShadow: '0 0 1rem rgba(16,185,129,0.8)' }}>⚜ Oráculo aprobó tu evidencia</p>
              <p style={{ fontFamily: '"Crimson Text",serif', fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, margin: 0, maxWidth: '26rem' }}>{feedback}</p>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'clamp(0.4rem, 1.5vw, 0.75rem)',
              padding: 'clamp(0.875rem, 3vw, 1.25rem)',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(0,0,0,0) 100%)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '0.875rem', width: '100%',
            }}>
              {[
                { val: `+${module.xpReward}`, label: 'XP', color: '#F5C518' },
{ val: `+${module.coinReward || 40}`, label: 'PropoCoins', color: '#C084FC' },
              ].map((r, i) => (
                <div key={r.label} style={{ textAlign: 'center', animation: `emBadgePop 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s both` }}>
                  <p style={{ margin: '0 0 0.2rem 0', fontFamily: 'Cinzel,serif', fontSize: 'clamp(1rem, 3vw, 1.25rem)', color: r.color, fontWeight: 700, textShadow: `0 0 1rem ${r.color}88` }}>{r.val}</p>
                  <p style={{ margin: 0, fontFamily: 'Cinzel,serif', fontSize: 'clamp(0.5rem, 1.2vw, 0.62rem)', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>{r.label}</p>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: 'Cinzel,serif', fontSize: 'clamp(0.55rem, 1.2vw, 0.65rem)', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textAlign: 'center', margin: 0 }}>
              Tu evidencia se publicará en <span style={{ color: accent, textShadow: `0 0 0.8rem ${accent}` }}>{module.evidenceCategory}</span>
            </p>
            <button onClick={publishAndReward} style={{
              width: '100%', padding: 'clamp(0.875rem, 3vw, 1.1rem)',
              background: 'linear-gradient(135deg, #10B981dd 0%, #10B981 50%, #059669 100%)',
              backgroundSize: '200% auto',
              animation: 'emShimmer 3s linear infinite',
              border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: '0.875rem', color: '#000',
              fontFamily: 'Cinzel,serif', fontWeight: 700,
              fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
              boxShadow: '0 0.25rem 1.5rem rgba(16,185,129,0.4)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-0.15rem)'; e.currentTarget.style.boxShadow = '0 0.5rem 2.5rem rgba(16,185,129,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0.25rem 1.5rem rgba(16,185,129,0.4)'; }}
            >⚡ Publicar y Reclamar Recompensas</button>
          </div>
        )}

        {/* ════════════════════════════════════════
            FASE: PUBLICANDO
        ════════════════════════════════════════ */}
        {phase === 'posting' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(2.5rem, 8vw, 4rem) 1rem', gap: 'clamp(1rem, 3vw, 1.5rem)', minHeight: '16rem' }}>
            <div style={{ position: 'relative', width: 'clamp(2.5rem, 6vw, 3.5rem)', height: 'clamp(2.5rem, 6vw, 3.5rem)' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${accent}22`, borderTopColor: accent, animation: 'emSpin 0.8s linear infinite' }} />
              <div style={{ position: 'absolute', inset: '20%', borderRadius: '50%', border: `2px solid ${accent}44`, borderBottomColor: accent, animation: 'emSpin 1.2s linear infinite reverse' }} />
            </div>
            <p style={{ fontFamily: 'Cinzel,serif', fontSize: 'clamp(0.62rem, 1.5vw, 0.75rem)', letterSpacing: '0.25em', color: accent, textTransform: 'uppercase', textShadow: `0 0 1rem ${accent}` }}>Sellando tu victoria en el templo…</p>
          </div>
        )}

        {/* ════════════════════════════════════════
            FASE: COMPLETADO
        ════════════════════════════════════════ */}
        {phase === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(1rem, 3vw, 1.5rem)', padding: 'clamp(1rem, 4vw, 2rem) 0', textAlign: 'center' }}>

            {/* Copa SVG épica */}
            <div style={{ position: 'relative', animation: 'emSuccessPop 0.7s cubic-bezier(0.16,1,0.3,1)' }}>
              {[0,1].map(i => (
                <div key={i} style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: `${5 + i * 2.5}rem`, height: `${5 + i * 2.5}rem`,
                  borderRadius: '50%',
                  border: '1px solid rgba(245,197,24,0.25)',
                  transform: 'translate(-50%,-50%)',
                  animation: `emOrbRing ${2.2 + i * 0.8}s ease-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                  pointerEvents: 'none',
                }} />
              ))}
              <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg"
                style={{ filter: 'drop-shadow(0 0 16px rgba(245,197,24,0.9)) drop-shadow(0 0 32px rgba(245,197,24,0.5))', animation: 'emFloat 3.5s ease-in-out 0.7s infinite', display: 'block' }}>
                <defs>
                  <linearGradient id="troGradBody" x1="20" y1="10" x2="70" y2="75" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FDE68A"/>
                    <stop offset="35%" stopColor="#F5C518"/>
                    <stop offset="70%" stopColor="#D97706"/>
                    <stop offset="100%" stopColor="#92400E"/>
                  </linearGradient>
                  <linearGradient id="troGradBase" x1="28" y1="70" x2="62" y2="85" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FCD34D"/>
                    <stop offset="100%" stopColor="#B45309"/>
                  </linearGradient>
                  <linearGradient id="troGradHandle" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
                    <stop offset="0%" stopColor="#FDE68A"/>
                    <stop offset="100%" stopColor="#B45309"/>
                  </linearGradient>
                  <filter id="troGlow">
                    <feGaussianBlur stdDeviation="2" result="blur"/>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                  </filter>
                </defs>
                <rect x="30" y="74" width="30" height="5" rx="2" fill="url(#troGradBase)" stroke="rgba(245,197,24,0.6)" strokeWidth="0.8"/>
                <rect x="26" y="78" width="38" height="6" rx="3" fill="url(#troGradBase)" stroke="rgba(245,197,24,0.5)" strokeWidth="0.8"/>
                <rect x="39" y="65" width="12" height="10" rx="1" fill="url(#troGradBody)"/>
                <path d="M22 18 Q20 42 32 54 Q38 60 45 60 Q52 60 58 54 Q70 42 68 18 Z" fill="url(#troGradBody)" stroke="rgba(253,230,138,0.6)" strokeWidth="1"/>
                <path d="M28 22 Q26 40 34 52 Q38 57 43 58" stroke="rgba(0,0,0,0.2)" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <path d="M35 22 Q33 36 37 48" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                <path d="M40 18 Q39 28 40 38" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M22 24 Q10 26 11 38 Q12 48 22 48" stroke="url(#troGradHandle)" strokeWidth="4" fill="none" strokeLinecap="round"/>
                <path d="M22 24 Q10 26 11 38 Q12 48 22 48" stroke="rgba(253,230,138,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M68 24 Q80 26 79 38 Q78 48 68 48" stroke="url(#troGradHandle)" strokeWidth="4" fill="none" strokeLinecap="round"/>
                <path d="M68 24 Q80 26 79 38 Q78 48 68 48" stroke="rgba(253,230,138,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M20 18 Q45 14 70 18" stroke="rgba(253,230,138,0.8)" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <ellipse cx="36" cy="22" rx="7" ry="3" fill="rgba(255,255,255,0.4)" transform="rotate(-20 36 22)"/>
                <ellipse cx="55" cy="20" rx="3" ry="1.5" fill="rgba(255,255,255,0.25)" transform="rotate(-15 55 20)"/>
                <path d="M45 32 L46.8 37.4 L52.5 37.4 L47.9 40.6 L49.7 46 L45 42.8 L40.3 46 L42.1 40.6 L37.5 37.4 L43.2 37.4 Z" fill="rgba(255,255,255,0.85)" filter="url(#troGlow)"/>
              </svg>
            </div>

            {/* Título */}
            <div style={{ position: 'relative' }}>
              <div style={{ width: '60%', height: '1px', margin: '0 auto 0.75rem', background: 'linear-gradient(90deg, transparent, rgba(245,197,24,0.8), transparent)' }} />
              <p style={{
                fontFamily: 'Cinzel,serif',
                fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                letterSpacing: '0.35em', color: '#F5C518',
                textTransform: 'uppercase', margin: '0 0 0.5rem',
                textShadow: '0 0 1.5rem rgba(245,197,24,0.9), 0 0 3rem rgba(245,197,24,0.4)',
                animation: 'emFadeIn 0.5s ease 0.3s both',
              }}>⚜ Módulo Sellado ⚜</p>
              <p style={{
                fontFamily: '"Crimson Text",serif',
                fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.65,
                animation: 'emFadeIn 0.5s ease 0.5s both',
              }}>
                {rewardClaimed
                  ? 'Tu reflexión quedó sellada. Las recompensas ya fueron acreditadas anteriormente.'
                  : 'Tu evidencia ha sido sellada en el Templo y tus recompensas acreditadas.'}
              </p>
              <div style={{ width: '60%', height: '1px', margin: '0.75rem auto 0', background: 'linear-gradient(90deg, transparent, rgba(245,197,24,0.4), transparent)' }} />
            </div>

            {/* Recompensas */}
            <div style={{ display: 'flex', gap: 'clamp(0.75rem, 3vw, 1.25rem)', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>

              {/* XP — cristal hexagonal dorado */}
              <div style={{
                flex: 1, minWidth: 'clamp(6rem, 18vw, 8rem)', maxWidth: '12rem',
                padding: 'clamp(1rem, 3vw, 1.4rem) clamp(0.75rem, 2vw, 1rem)',
                background: 'linear-gradient(160deg, rgba(245,197,24,0.2) 0%, rgba(245,197,24,0.07) 50%, rgba(0,0,0,0) 100%)',
                border: '1px solid rgba(245,197,24,0.5)',
                borderRadius: '1rem', textAlign: 'center',
                boxShadow: '0 0 2.5rem rgba(245,197,24,0.2), inset 0 1px 0 rgba(245,197,24,0.25)',
                position: 'relative', overflow: 'hidden',
                animation: 'emBadgePop 0.5s cubic-bezier(0.16,1,0.3,1) 0.4s both',
              }}>
                <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(245,197,24,1), transparent)' }} />
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.6rem' }}>
                  <svg width="48" height="52" viewBox="0 0 48 52" fill="none" xmlns="http://www.w3.org/2000/svg"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(245,197,24,0.9)) drop-shadow(0 0 18px rgba(245,197,24,0.5))', animation: 'emFloat 3s ease-in-out infinite' }}>
                    <defs>
                      <linearGradient id="xpCrystalA" x1="4" y1="2" x2="44" y2="50" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FEF3C7"/>
                        <stop offset="30%" stopColor="#FDE68A"/>
                        <stop offset="65%" stopColor="#F5C518"/>
                        <stop offset="100%" stopColor="#92400E"/>
                      </linearGradient>
                    </defs>
                    <polygon points="24,1 43,12 43,34 24,45 5,34 5,12" fill="url(#xpCrystalA)" stroke="rgba(253,230,138,0.85)" strokeWidth="1"/>
                    <polygon points="24,1 5,12 24,19" fill="rgba(255,248,180,0.4)"/>
                    <polygon points="24,1 43,12 24,19" fill="rgba(255,235,80,0.2)"/>
                    <polygon points="5,12 24,19 24,32 5,34" fill="rgba(180,130,0,0.3)"/>
                    <polygon points="43,12 24,19 24,32 43,34" fill="rgba(245,197,24,0.12)"/>
                    <polygon points="5,34 24,32 24,45" fill="rgba(120,80,0,0.35)"/>
                    <polygon points="43,34 24,32 24,45" fill="rgba(100,60,0,0.25)"/>
                    <line x1="11" y1="16" x2="11" y2="30" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
                    <ellipse cx="19" cy="9" rx="4.5" ry="2" fill="rgba(255,255,255,0.55)" transform="rotate(-22 19 9)"/>
                    <circle cx="29" cy="7" r="1.2" fill="rgba(255,255,255,0.7)"/>
                    <text x="24" y="31" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="900" fontSize="13" fill="rgba(255,245,100,0.98)">XP</text>
                  </svg>
                </div>
                <p style={{ margin: '0 0 0.15rem', fontFamily: 'Cinzel,serif', fontSize: 'clamp(1.5rem, 5vw, 2rem)', color: '#F5C518', fontWeight: 900, textShadow: '0 0 1.5rem rgba(245,197,24,1)', lineHeight: 1 }}>+{module.xpReward}</p>
                <p style={{ margin: 0, fontFamily: 'Cinzel,serif', fontSize: 'clamp(0.5rem, 1.1vw, 0.6rem)', color: 'rgba(245,197,24,0.55)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>Experiencia</p>
              </div>

              {/* PropoCoins — moneda dorada con llama de propósito */}
              <div style={{
                flex: 1, minWidth: 'clamp(6rem, 18vw, 8rem)', maxWidth: '12rem',
                padding: 'clamp(1rem, 3vw, 1.4rem) clamp(0.75rem, 2vw, 1rem)',
                background: 'linear-gradient(160deg, rgba(245,197,24,0.16) 0%, rgba(180,140,0,0.08) 50%, rgba(0,0,0,0) 100%)',
                border: '1px solid rgba(245,197,24,0.4)',
                borderRadius: '1rem', textAlign: 'center',
                boxShadow: '0 0 2.5rem rgba(245,197,24,0.15), inset 0 1px 0 rgba(245,197,24,0.2)',
                position: 'relative', overflow: 'hidden',
                animation: 'emBadgePop 0.5s cubic-bezier(0.16,1,0.3,1) 0.6s both',
              }}>
                <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(245,197,24,0.85), transparent)' }} />
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.6rem' }}>
                  <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(245,197,24,0.85)) drop-shadow(0 0 20px rgba(245,197,24,0.45))', animation: 'emFloat 3.6s ease-in-out infinite', animationDelay: '0.5s' }}>
                    <defs>
                      <linearGradient id="pcOuter" x1="5" y1="5" x2="45" y2="45" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FEF3C7"/>
                        <stop offset="40%" stopColor="#F5C518"/>
                        <stop offset="100%" stopColor="#78350F"/>
                      </linearGradient>
                      <linearGradient id="pcInner" x1="8" y1="8" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FDE68A"/>
                        <stop offset="50%" stopColor="#D97706"/>
                        <stop offset="100%" stopColor="#92400E"/>
                      </linearGradient>
                    </defs>
                    <ellipse cx="25" cy="43" rx="16" ry="3.5" fill="rgba(120,80,0,0.5)"/>
                    <circle cx="25" cy="24" r="19" fill="url(#pcOuter)" stroke="rgba(253,230,138,0.75)" strokeWidth="1.2"/>
                    <circle cx="25" cy="24" r="15" fill="url(#pcInner)"/>
                    <circle cx="25" cy="24" r="12.5" fill="none" stroke="rgba(255,240,100,0.3)" strokeWidth="0.8" strokeDasharray="2.5 2"/>
                    <path d="M25 13 C25 13 20 17 20 21 C20 23 21.5 24.5 23 24 C21 26 21 29 23 30.5 C24 31.2 25 31 25 31 C25 31 26 31.2 27 30.5 C29 29 29 26 27 24 C28.5 24.5 30 23 30 21 C30 17 25 13 25 13 Z" fill="rgba(255,248,160,0.92)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
                    <ellipse cx="18" cy="16" rx="5" ry="2.5" fill="rgba(255,255,255,0.38)" transform="rotate(-35 18 16)"/>
                    <circle cx="31" cy="14" r="1.5" fill="rgba(255,255,255,0.55)"/>
                  </svg>
                </div>
                <p style={{ margin: '0 0 0.15rem', fontFamily: 'Cinzel,serif', fontSize: 'clamp(1.5rem, 5vw, 2rem)', color: '#F5C518', fontWeight: 900, textShadow: '0 0 1.5rem rgba(245,197,24,0.9)', lineHeight: 1 }}>+{module.coinReward || 40}</p>
                <p style={{ margin: 0, fontFamily: 'Cinzel,serif', fontSize: 'clamp(0.5rem, 1.1vw, 0.6rem)', color: 'rgba(245,197,24,0.55)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>PropoCoins</p>
              </div>

            </div>

            {/* Botón volver */}
            <button
              onClick={onClose}
              style={{
                marginTop: 'clamp(0.25rem, 1vw, 0.5rem)',
                width: '100%',
                padding: 'clamp(0.875rem, 3vw, 1.1rem)',
                background: 'linear-gradient(135deg, #FDE68A 0%, #F5C518 40%, #D97706 100%)',
                backgroundSize: '200% auto',
                animation: 'emShimmer 3s linear infinite',
                border: 'none',
                borderRadius: '0.875rem',
                color: '#000',
                fontFamily: 'Cinzel,serif',
                fontWeight: 900,
                fontSize: 'clamp(0.75rem, 2vw, 0.88rem)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 0.25rem 1.5rem rgba(245,197,24,0.5), 0 0 3rem rgba(245,197,24,0.2)',
                transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-0.15rem)'; e.currentTarget.style.boxShadow = '0 0.5rem 2.5rem rgba(245,197,24,0.7), 0 0 4rem rgba(245,197,24,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0.25rem 1.5rem rgba(245,197,24,0.5), 0 0 3rem rgba(245,197,24,0.2)'; }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>← Volver a la Academia</span>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)', backgroundSize: '200% 100%', animation: 'emShimmer 2s ease-in-out infinite' }} />
            </button>

          </div>
        )}

      </div>
    </div>
  );
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const cfg = MODULE_TYPE_CONFIG[type] ?? MODULE_TYPE_CONFIG.practica;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4em',
      padding: '0.25em 0.75em', borderRadius: '999px',
      fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)',
      fontFamily: '"Cinzel", serif', letterSpacing: '0.1em',
      textTransform: 'uppercase', color: cfg.color,
      border: `1px solid ${cfg.color}44`,
      background: `${cfg.color}18`,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

const RewardBadge = ({ icon, value, label }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.25rem', padding: '0.75rem 1.25rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '0.75rem', flex: '1',
    minWidth: 'clamp(4rem, 15vw, 5rem)',
  }}>
    <span style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>{icon}</span>
    <span style={{ fontFamily: '"Cinzel", serif', fontWeight: 700, color: '#F5C518', fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}>{value}</span>
    <span style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em' }}>{label}</span>
  </div>
);

const ModuleProgressBar = () => {
  const openedModules = useMembershipStore(s => s.openedModules);
  const { slug } = useParams();
  const total = ACADEMY_MODULES.length;
  const done = Math.max(0, openedModules.filter(s => s !== slug).length);
  const pct = Math.round((done / total) * 100);
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: 'rgba(255,255,255,0.45)', fontFamily: '"Cinzel", serif', letterSpacing: '0.1em' }}>PROGRESO TOTAL</span>
        <span style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: '#C084FC', fontFamily: '"Cinzel", serif' }}>{done}/{total} módulos</span>
      </div>
      <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '999px', width: `${pct}%`,
          background: 'linear-gradient(90deg, #7C3AED, #C084FC)',
          transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
    </div>
  );
};

const LockedModule = ({ module }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '1.5rem',
    padding: 'clamp(3rem, 10vw, 6rem) 1rem', textAlign: 'center',
  }}>
    <div style={{ fontSize: 'clamp(3rem, 8vw, 4rem)', animation: 'lockedFloat 3s ease-in-out infinite' }}>🔒</div>
    <h2 style={{ fontFamily: '"Cinzel", serif', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>Módulo Bloqueado</h2>
    <p style={{ fontFamily: '"Crimson Text", serif', fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', color: 'rgba(255,255,255,0.35)', maxWidth: '28rem' }}>
      Este módulo se desbloquea según tu progreso en la evaluación semanal.
    </p>
    <Link to="/academia" style={{
      padding: '0.75rem 2rem',
      background: 'linear-gradient(135deg, #7C3AED, #C084FC)',
      borderRadius: '0.5rem', color: '#fff',
      fontFamily: '"Cinzel", serif', fontSize: '0.8rem',
      letterSpacing: '0.1em', textDecoration: 'none', textTransform: 'uppercase',
    }}>← Volver a la academia</Link>
    <style>{`@keyframes lockedFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }`}</style>
  </div>
);

const ModuleContent = ({ protocolo, cfg }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const blobRef = useRef(null);

  const loadModule = useCallback(async () => {
    setLoading(true); setError(null);
    if (!protocolo) { setError('No se encontró un protocolo asignado para tu cuenta.'); setLoading(false); return; }
    const fileName = PROTOCOLO_MAP[protocolo];
    if (!fileName) { setError(`Protocolo "${protocolo}" no tiene módulo asignado aún.`); setLoading(false); return; }
    try {
      const { data, error: signError } = await supabase.storage.from(SUPABASE_BUCKET).createSignedUrl(fileName, 3600);
      if (signError) throw signError;
      const res = await fetch(data.signedUrl);
      if (!res.ok) throw new Error('No se pudo descargar el módulo');
      const htmlText = await res.text();
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
      const blob = new Blob([htmlText], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      blobRef.current = url;
      setBlobUrl(htmlText);
    } catch (err) {
      setError('Error al cargar el módulo. Intenta recargar la página.');
    } finally {
      setLoading(false);
    }
  }, [protocolo]);

  useEffect(() => { loadModule(); return () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); }; }, [loadModule]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem 1rem' }}>
      <div style={{ width: '2.5rem', height: '2.5rem', border: `3px solid ${cfg.color}33`, borderTopColor: cfg.color, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontFamily: '"Cinzel", serif', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Cargando tu módulo...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '1rem', marginBottom: '2rem' }}>
      <p style={{ color: '#F87171', fontFamily: '"Cinzel", serif', fontSize: '0.85rem' }}>⚠️ {error}</p>
      <button onClick={loadModule} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.5rem', color: '#fff', fontFamily: '"Cinzel", serif', fontSize: '0.75rem', cursor: 'pointer' }}>Reintentar</button>
    </div>
  );

  return (
    <div style={{ width: '100%', minHeight: '80vh', borderRadius: '1rem', overflow: 'hidden', marginBottom: '2rem', position: 'relative' }}>
      <iframe srcDoc={blobUrl} title="Contenido del módulo" style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }} />
    </div>
  );
};

// ─── Estilos de pilar ─────────────────────────────────────────────────────────
const PILAR_STYLE = {
  vision:          { divider: '— — —',   signalIcon: '◈', headerIcon: '🧭', truthPrefix: '',                    spacing: '2rem'   },
  control:         { divider: '⚔ ⚔ ⚔', signalIcon: '▸', headerIcon: '⚔️', truthPrefix: 'VERDAD DEL GUERRERO — ', spacing: '1.25rem'},
  influencia:      { divider: '~ ~ ~',   signalIcon: '◎', headerIcon: '🌊', truthPrefix: '',                    spacing: '1.75rem'},
  autonomia:       { divider: '↑ ↑ ↑',  signalIcon: '→', headerIcon: '🦅', truthPrefix: '',                    spacing: '1.5rem' },
  autorrealizacion:{ divider: '✦ ✦ ✦',  signalIcon: '◉', headerIcon: '🔥', truthPrefix: '',                    spacing: '1.75rem'},
};

const useScrollReveal = () => {
  const refs = useRef([]);
  useEffect(() => {
    const observers = [];
    refs.current.forEach((el) => {
      if (!el) return;
      el.style.opacity = '0'; el.style.transform = 'translateY(28px)';
      el.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; obs.disconnect(); }
      }, { threshold: 0.12 });
      obs.observe(el); observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);
  return (i) => (el) => { refs.current[i] = el; };
};

const PilarOrb = ({ accent, icon, size = '3.5rem' }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: `radial-gradient(circle at 35% 35%, ${accent}44, ${accent}11)`,
    border: `1px solid ${accent}44`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: `calc(${size} * 0.45)`,
    boxShadow: `0 0 24px ${accent}33`, flexShrink: 0,
  }}>{icon}</div>
);

const ModuleContext = ({ context, cfg, type }) => {
  const accent = cfg?.color || '#C084FC';
  const pilar = PILAR_STYLE[type] || PILAR_STYLE.vision;
  const isControl = type === 'control';
  const isAutorrealizacion = type === 'autorrealizacion';
  const isInfluencia = type === 'influencia';
  const isAutonomia = type === 'autonomia';
  const reveal = useScrollReveal();

  return (
    <div style={{ width: '100%', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: pilar.spacing }}>
      <div ref={reveal(0)} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', borderLeft: isControl ? `3px solid ${accent}` : `2px solid ${accent}44`, paddingLeft: '1.25rem', position: 'relative' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: '"Cinzel", serif', fontSize: 'clamp(0.6rem, 1.2vw, 0.7rem)', letterSpacing: isControl ? '0.35em' : '0.2em', color: accent, textTransform: 'uppercase', marginBottom: '1rem', opacity: 0.9 }}>{pilar.headerIcon} Por qué te tocó este ejercicio</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: isControl ? '0.3rem' : '0.45rem' }}>
            {(Array.isArray(context.why) ? context.why : [context.why]).map((line, i) => (
              line === '' ? <div key={i} style={{ height: isControl ? '0.2rem' : '0.4rem' }} /> :
              <p key={i} style={{ fontFamily: isControl ? '"Cinzel", serif' : '"Crimson Text", serif', fontSize: isControl ? (line.length < 40 ? 'clamp(0.85rem, 2vw, 1rem)' : 'clamp(0.8rem, 1.8vw, 0.9rem)') : (line.length < 45 ? 'clamp(1.1rem, 2.8vw, 1.3rem)' : 'clamp(1rem, 2.5vw, 1.15rem)'), color: isControl ? (line.length < 40 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)') : (line.length < 45 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)'), lineHeight: isControl ? 1.4 : 1.65, margin: 0, letterSpacing: isControl ? '0.05em' : '0', textTransform: isControl && line.length < 40 ? 'uppercase' : 'none' }}>{line}</p>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', right: '-0.5rem', top: '0', animation: 'orbFloat 4s ease-in-out infinite', opacity: 0.6 }}>
          <PilarOrb accent={accent} icon={pilar.headerIcon} size="2.5rem" />
        </div>
      </div>

      <div ref={reveal(1)} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${accent}44)` }} />
        <span style={{ color: accent, opacity: 0.5, letterSpacing: '0.4em', fontSize: '0.65rem' }}>{pilar.divider}</span>
        <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${accent}44, transparent)` }} />
      </div>

      <div ref={reveal(2)} style={{ background: isControl ? `${accent}06` : `${accent}08`, border: isControl ? `1px solid ${accent}33` : `1px solid ${accent}22`, borderLeft: `3px solid ${accent}`, borderRadius: isControl ? '0.25rem' : '0.75rem', padding: 'clamp(1rem, 3vw, 1.5rem)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40%', right: '-20%', width: '60%', paddingTop: '60%', borderRadius: '50%', background: `radial-gradient(circle, ${accent}0a 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <p style={{ fontFamily: '"Cinzel", serif', fontSize: 'clamp(0.6rem, 1.2vw, 0.7rem)', letterSpacing: isControl ? '0.35em' : '0.2em', color: accent, textTransform: 'uppercase', marginBottom: '1.25rem', opacity: 0.9, position: 'relative' }}>{isControl ? '⚔ Reconócete en esto' : isAutorrealizacion ? '✦ Esto ya lo conoces' : isInfluencia ? '🌊 Puede que resuene contigo' : isAutonomia ? '🦅 Esto puede estar pasando' : '🔥 Puede que te veas reflejado'}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 18rem), 1fr))', gap: '0.6rem', position: 'relative' }}>
          {context.signals.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.4rem', border: `1px solid ${accent}11`, transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = `${accent}33`} onMouseLeave={e => e.currentTarget.style.borderColor = `${accent}11`}>
              <span style={{ color: accent, fontSize: '0.65rem', marginTop: '0.3rem', flexShrink: 0, letterSpacing: '0.1em' }}>{pilar.signalIcon}</span>
              <p style={{ fontFamily: isControl ? '"Cinzel", serif' : '"Crimson Text", serif', fontSize: isControl ? 'clamp(0.72rem, 1.6vw, 0.82rem)' : 'clamp(0.9rem, 2vw, 1.05rem)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.55, margin: 0, letterSpacing: isControl ? '0.03em' : '0' }}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div ref={reveal(3)} style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(1.5rem, 4vw, 2.5rem)', background: isControl ? `linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(0,0,0,0) 100%)` : isAutorrealizacion ? `linear-gradient(135deg, rgba(192,132,252,0.07) 0%, rgba(0,0,0,0) 100%)` : `linear-gradient(135deg, ${accent}07 0%, rgba(0,0,0,0) 100%)`, borderRadius: '1rem', border: `1px solid ${accent}18`, borderLeft: `3px solid ${accent}66`, textAlign: isControl ? 'left' : 'center' }}>
        <div style={{ position: 'absolute', right: '1rem', bottom: '-1rem', fontFamily: '"Cinzel", serif', fontSize: 'clamp(4rem, 12vw, 7rem)', color: `${accent}08`, fontWeight: 700, lineHeight: 1, userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.05em' }}>{isControl ? '⚔' : isAutorrealizacion ? '✦' : isInfluencia ? '~' : isAutonomia ? '↑' : '◈'}</div>
        {isControl && <p style={{ fontFamily: '"Cinzel", serif', fontSize: 'clamp(0.55rem, 1vw, 0.62rem)', letterSpacing: '0.4em', color: accent, textTransform: 'uppercase', marginBottom: '0.875rem', opacity: 0.65 }}>Verdad del Guerrero</p>}
        {isAutorrealizacion && <p style={{ fontFamily: '"Cinzel", serif', fontSize: 'clamp(0.55rem, 1vw, 0.62rem)', letterSpacing: '0.4em', color: accent, textTransform: 'uppercase', marginBottom: '0.875rem', opacity: 0.65 }}>✦ Comprende esto</p>}
        <p style={{ fontFamily: '"Cinzel", serif', fontSize: isControl ? 'clamp(0.8rem, 2vw, 0.95rem)' : 'clamp(0.9rem, 2.2vw, 1.1rem)', color: 'rgba(255,255,255,0.88)', lineHeight: 1.85, fontWeight: 400, letterSpacing: isControl ? '0.04em' : '0.01em', position: 'relative' }}>{context.truth}</p>
      </div>

      <div ref={reveal(4)} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', padding: 'clamp(1rem, 3vw, 1.5rem)', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: `1px solid rgba(255,255,255,0.06)` }}>
        <PilarOrb accent={accent} icon="🎯" size="3rem" />
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: '"Cinzel", serif', fontSize: 'clamp(0.6rem, 1.2vw, 0.68rem)', letterSpacing: isControl ? '0.35em' : '0.2em', color: accent, textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.8 }}>Tu objetivo esta semana</p>
          <p style={{ fontFamily: isControl ? '"Cinzel", serif' : '"Crimson Text", serif', fontSize: isControl ? 'clamp(0.8rem, 1.8vw, 0.9rem)' : 'clamp(1rem, 2.5vw, 1.15rem)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, margin: 0, letterSpacing: isControl ? '0.03em' : '0' }}>{context.objective}</p>
        </div>
      </div>

      <div ref={reveal(5)} style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(1.75rem, 5vw, 2.5rem) clamp(1.25rem, 4vw, 2rem)', background: `radial-gradient(ellipse at 50% 0%, ${accent}18 0%, transparent 70%)`, borderTop: `1px solid ${accent}33`, borderBottom: `1px solid ${accent}33`, textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.75rem', animation: 'orbFloat 3s ease-in-out infinite', display: 'inline-block' }}>🛡️</div>
        <p style={{ fontFamily: '"Cinzel", serif', fontSize: isControl ? 'clamp(0.85rem, 2vw, 1rem)' : 'clamp(0.9rem, 2.2vw, 1.1rem)', color: accent, lineHeight: 2, letterSpacing: isControl ? '0.1em' : '0.06em', maxWidth: '38rem', margin: '0 auto', textShadow: `0 0 30px ${accent}44` }}>{context.keyPhrase}</p>
      </div>

      <div ref={reveal(6)} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: 'clamp(0.75rem, 2vw, 1rem) clamp(0.75rem, 2vw, 1.25rem)', background: 'rgba(255,255,255,0.015)', borderRadius: '0.5rem', border: `1px solid rgba(255,255,255,0.05)`, borderLeft: `2px solid ${accent}44` }}>
        <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '0.15rem' }}>📜</span>
        <p style={{ fontFamily: '"Crimson Text", serif', fontSize: 'clamp(0.9rem, 2vw, 1rem)', color: 'rgba(255,255,255,0.38)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>{context.reminder}</p>
      </div>

      <style>{`@keyframes orbFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }`}</style>
    </div>
  );
};

const VideoPlayerWithFullscreen = ({ accent, vid, started, setStarted }) => {
  const iframeRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userExited, setUserExited] = useState(false);

  // Bloquea scroll del body cuando está en fullscreen simulado
  useEffect(() => {
    document.body.style.overflow = isFullscreen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  // Al dar clic en play por primera vez → arranca el video y entra a fullscreen simulado
  const handleFirstPlay = () => {
    setStarted(true);
    if (!userExited) setIsFullscreen(true);
  };

  const enterFullscreen = () => {
    if (userExited) return;
    setIsFullscreen(true);
  };

  const exitFullscreen = () => {
    setUserExited(true);
    setIsFullscreen(false);
  };

  // Estilos del wrapper en modo fullscreen simulado
  const wrapperStyle = isFullscreen
    ? {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: '#000',
        margin: 0,
        borderRadius: 0,
      }
    : {
        width: '100%',
        marginBottom: '2rem',
        borderRadius: '1rem',
        background: '#000',
        boxShadow: `0 0 60px ${accent}22`,
        position: 'relative',
      };

  return (
    <div ref={wrapperRef} style={wrapperStyle}>
      {/* Aspect ratio box — solo cuando NO es fullscreen */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: isFullscreen ? '0' : '56.25%',
        height: isFullscreen ? '100%' : 'auto',
      }}>
        <iframe
          ref={iframeRef}
          src={
            started
              ? `https://iframe.mediadelivery.net/embed/673293/${vid}?autoplay=true&muted=false&loop=false&controls=true`
              : `https://iframe.mediadelivery.net/embed/673293/${vid}?autoplay=false&muted=false&loop=false&controls=false`
          }
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            pointerEvents: started ? 'auto' : 'none',
          }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />

        {/* Overlay de play si no ha iniciado */}
        {!started && (
          <div
            onClick={handleFirstPlay}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%', zIndex: 10,
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '1.25rem',
              background: 'rgba(0,0,0,0.85)',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', width: 'clamp(80px,14vw,110px)', height: 'clamp(80px,14vw,110px)', borderRadius: '50%', border: `1px solid ${accent}55`, animation: 'pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
              <div style={{ width: 'clamp(60px,10vw,80px)', height: 'clamp(60px,10vw,80px)', borderRadius: '50%', border: `2px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(circle,${accent}33 0%,${accent}11 100%)`, boxShadow: `0 0 30px ${accent}66,0 0 60px ${accent}22` }}>
                <div style={{ width: 0, height: 0, borderTop: 'clamp(8px,1.5vw,11px) solid transparent', borderBottom: 'clamp(8px,1.5vw,11px) solid transparent', borderLeft: `clamp(14px,2.5vw,19px) solid ${accent}`, marginLeft: 'clamp(3px,0.5vw,5px)' }} />
              </div>
            </div>
            <span style={{ fontFamily: '"Cinzel",serif', fontSize: 'clamp(0.6rem,1.4vw,0.75rem)', letterSpacing: '0.3em', color: accent, textTransform: 'uppercase', textShadow: `0 0 20px ${accent}88`, opacity: 0.95 }}>▶ Ver con sonido</span>
            <style>{`@keyframes pulse-ring{0%{transform:scale(1);opacity:0.6}50%{transform:scale(1.15);opacity:0.2}100%{transform:scale(1);opacity:0.6}}`}</style>
          </div>
        )}

        {/* Botón fullscreen — solo visible en fullscreen (para minimizar) */}
        {started && isFullscreen && (
          <button
            onClick={isFullscreen ? exitFullscreen : enterFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            style={{
              position: 'absolute',
              bottom: '0.6rem',
              right: '0.6rem',
              zIndex: 20,
              background: 'rgba(0,0,0,0.7)',
              border: `1px solid ${accent}66`,
              borderRadius: '0.375rem',
              color: '#fff',
              width: '2.1rem',
              height: '2.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              transition: 'background 0.15s, transform 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${accent}55`; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {isFullscreen ? (
              // Icono minimizar
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
              </svg>
            ) : (
              // Icono maximizar
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
                <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
              </svg>
            )}
          </button>
        )}

        {/* Botón cerrar encima (solo en fullscreen simulado, esquina superior derecha) */}
        {isFullscreen && (
          <button
            onClick={exitFullscreen}
            style={{
              position: 'absolute',
              top: '0.6rem',
              right: '0.6rem',
              zIndex: 21,
              background: 'rgba(0,0,0,0.7)',
              border: `1px solid rgba(255,255,255,0.2)`,
              borderRadius: '50%',
              color: '#fff',
              width: '2.1rem',
              height: '2.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              lineHeight: 1,
            }}
          >✕</button>
        )}
      </div>
    </div>
  );
};

const VideoPlayer = ({ cfg, videoId }) => {
  const [started, setStarted] = useState(false);
  const accent = cfg?.color || '#C084FC';
  const vid = videoId || '5ef5c7ee-78c0-4025-a846-f1cef76352eb';
  return (
    <VideoPlayerWithFullscreen accent={accent} vid={vid} started={started} setStarted={setStarted} />
  );
};

// ─── Quick Nav ────────────────────────────────────────────────────────────────
const QuickNav = () => {
  const { pathname, search } = useLocation();
  const ITEMS = [
    {
      label: 'Hub',
      to: '/hub',
      icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
    },
    {
      label: 'Feed',
      to: '/academia/comunidad',
      icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
    },
    {
      label: 'Ranking',
      to: '/academia/comunidad?tab=ranking',
      icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>),
    },
    {
      label: 'Perfil',
      to: '/profile',
      icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
    },
  ];
  const isActive = (item) => {
    if (item.label === 'Ranking') return search.includes('tab=ranking');
    if (item.label === 'Feed') return pathname === '/academia/comunidad' && !search.includes('tab=ranking');
    return pathname.startsWith(item.to);
  };
  return (
    <>
      <div style={{ height: '64px' }} aria-hidden="true" />
      <nav aria-label="Acceso rápido" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999, background: 'rgba(10,6,20,0.97)', borderTop: '1px solid rgba(192,132,252,0.2)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'stretch', justifyContent: 'space-around', height: '64px', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link key={item.to} to={item.to} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none', color: active ? '#C084FC' : 'rgba(255,255,255,0.3)', borderTop: `2px solid ${active ? '#C084FC' : 'transparent'}`, padding: '6px 4px', transition: 'color 0.2s, border-color 0.2s', position: 'relative', WebkitTapHighlightColor: 'transparent', fontFamily: 'Cinzel, serif', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {active && (<div style={{ position: 'absolute', top: '-1px', left: '15%', right: '15%', height: '2px', background: 'linear-gradient(90deg, transparent, #C084FC, transparent)', borderRadius: '0 0 4px 4px', pointerEvents: 'none' }} />)}
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
const ModuleViewer = () => {
  const { slug } = useParams();
  const user = useAuthStore(s => s.user);
  const hasAccess = useMembershipStore(selectHasAccessTo(slug));
  const openModule = useMembershipStore(s => s.openModule);
  const completeModule = useMembershipStore(s => s.completeModule);
  const completedModules = useMembershipStore(s => s.completedModules);
  const addXP = usePlayerStore(s => s.addXP);
  const addCrystals = usePlayerStore(s => s.addCrystals);

  const [protocolo, setProtocolo] = useState(null);
  const [protocoloLoading, setProtocoloLoading] = useState(true);
  const [nextEvalDate, setNextEvalDate] = useState(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [rewardAnimation, setRewardAnimation] = useState(null); // { xp, gems, coins }

  const module = ACADEMY_MODULES.find(m => m.slug === slug);
  const isCompleted = completedModules.includes(slug);
  const markedRef = useRef(false);

  useEffect(() => {
    if (!user?.email) return;
    const fetchProtocolo = async () => {
      try {
        const { data, error } = await supabase
          .from('user_protocolo')
          .select('protocolo, semana, fecha')
          .eq('email', user.email.toLowerCase().trim())
          .single();
        if (!error && data?.protocolo) {
          setProtocolo(data.protocolo);
          if (data.fecha) {
            const lastDate = new Date(data.fecha);
            lastDate.setDate(lastDate.getDate() + 7);
            setNextEvalDate(lastDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }));
          }
        }
      } catch (err) {
        console.error('Error obteniendo protocolo:', err);
      } finally {
        setProtocoloLoading(false);
      }
    };
    fetchProtocolo();
  }, [user?.email]);

  useEffect(() => {
    if (!markedRef.current && module && user && hasAccess) {
      markedRef.current = true;
      openModule(supabase, user.id, slug);
    }
  }, [slug, module, user, hasAccess, openModule]);

  const activarGraduacion = useGraduacionStore(s => s.activar);

  const handleEvidenceSuccess = async (rewards) => {
    await completeModule(supabase, user.id, slug);
    addXP?.(rewards.xp);
    addCrystals?.(rewards.gems + rewards.coins);
    setShowEvidenceModal(false);
    setRewardAnimation(rewards);
    setTimeout(() => setRewardAnimation(null), 4000);
    // Trigger ceremonia si completó R5 (último módulo)
    if (protocolo === 'R5') {
      setTimeout(() => activarGraduacion(), 1200);
    }
  };

  if (!module) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
      <p style={{ fontFamily: '"Cinzel", serif' }}>Módulo no encontrado</p>
      <Link to="/academia" style={{ color: '#C084FC' }}>← Volver</Link>
    </div>
  );

  if (!hasAccess) return <LockedModule module={module} />;

  const cfg = MODULE_TYPE_CONFIG[module.type];

  return (
    <div style={{ maxWidth: '52rem', margin: '0 auto', padding: 'clamp(1rem, 5vw, 2rem) clamp(1rem, 4vw, 1.5rem)', minHeight: '100vh' }}>

      {/* Modal evidencia */}
      {showEvidenceModal && (
        <EvidenceModal
          module={module}
          cfg={cfg}
          userId={user.id}
          onSuccess={handleEvidenceSuccess}
          onClose={() => setShowEvidenceModal(false)}
        />
      )}

      {/* Toast de recompensas */}
      {rewardAnimation && rewardAnimation.xp > 0 && (
        <div style={{
          position: 'fixed', top: '2rem', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9998,
          background: 'linear-gradient(135deg, rgba(15,15,25,0.98), rgba(8,8,16,0.99))',
          border: `1px solid ${cfg.color}44`,
          borderTop: `2px solid ${cfg.color}`,
          borderRadius: '1rem', padding: '1.25rem 2rem',
          display: 'flex', gap: '1.5rem', alignItems: 'center',
          boxShadow: `0 0 60px ${cfg.color}33`,
          animation: 'slideDown 0.5s cubic-bezier(0.16,1,0.3,1)',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: '1.5rem' }}>🏆</span>
          {[
            { val: `+${rewardAnimation.xp}`, label: 'XP', color: '#F5C518' },
{ val: `+${rewardAnimation.coins}`, label: 'PropoCoins', color: '#C084FC' },
          ].map(r => (
            <div key={r.label} style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontFamily: 'Cinzel,serif', fontSize: '1rem', color: r.color, fontWeight: 700 }}>{r.val}</p>
              <p style={{ margin: 0, fontFamily: 'Cinzel,serif', fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>{r.label}</p>
            </div>
          ))}
          <style>{`@keyframes slideDown { from{opacity:0;transform:translateX(-50%) translateY(-20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }`}</style>
        </div>
      )}

      {/* Zona VOLVER — área clickeable grande esquina superior izquierda */}
      <div
        onClick={() => navigate('/academia')}
        onTouchEnd={(e) => { e.preventDefault(); navigate('/academia'); }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '200px',
          height: '80px',
          zIndex: 9995,
          cursor: 'pointer',
          background: 'rgba(0,0,0,0.001)',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
      />

      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', pointerEvents: 'none' }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontFamily: '"Cinzel", serif', letterSpacing: '0.05em' }}>Academia</span>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
        <span style={{ color: cfg.color, fontFamily: '"Cinzel", serif', letterSpacing: '0.05em' }}>{module.title}</span>
      </nav>

      {/* Encabezado */}
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <TypeBadge type={module.type} />
          {protocolo && !protocoloLoading && (
            <span style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}44`, borderRadius: '999px', padding: '0.2em 0.7em', fontFamily: '"Cinzel", serif', letterSpacing: '0.1em' }}>⚡ Protocolo {protocolo}</span>
          )}
          {isCompleted && (
            <span style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)', color: '#10B981', background: '#10B98120', border: '1px solid #10B98144', borderRadius: '999px', padding: '0.2em 0.7em', fontFamily: '"Cinzel", serif', letterSpacing: '0.1em' }}>✓ Completado</span>
          )}
        </div>
        <h1 style={{ fontFamily: '"Cinzel", serif', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: '0.5rem', textShadow: `0 0 40px ${cfg.color}44` }}>{module.title}</h1>
        <p style={{ fontFamily: '"Crimson Text", serif', fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{module.subtitle}</p>
      </header>

      {/* Recompensas */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <RewardBadge icon="✨" value={`+${module.xpReward}`} label="XP" />
<RewardBadge icon="🪙" value={`+${module.coinReward || 40}`} label="PropoCoins" />
        <RewardBadge icon="⏱" value={module.duration} label="Duración" />
        {nextEvalDate && <RewardBadge icon="📅" value={nextEvalDate} label="Próx. evaluación" />}
      </div>

      {/* Progreso global */}
      <div style={{ marginBottom: '2.5rem' }}>
        <ModuleProgressBar />
      </div>

      {/* Video */}
      <VideoPlayer cfg={cfg} videoId={module.videoId} />

      {/* Contexto */}
      {module.context && <ModuleContext context={module.context} cfg={cfg} type={module.type} />}

      {/* ── LLAMADOR DE ATENCIÓN: Ejercicio Semanal ── */}
      <div style={{
        marginBottom: '0.75rem',
        border: `1px solid ${cfg.color}55`,
        borderLeft: `4px solid ${cfg.color}`,
        borderRadius: '0.875rem',
        padding: '1rem 1.25rem',
        background: `linear-gradient(135deg, ${cfg.color}0f 0%, transparent 100%)`,
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
      }}>
        <style>{`
          @keyframes mcPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
          @keyframes mcBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(4px)} }
        `}</style>
        {/* Icono pulsante — solo opacity, muy barato en móvil */}
        <div style={{
          flexShrink: 0,
          width: '2.5rem', height: '2.5rem',
          borderRadius: '50%',
          background: `${cfg.color}22`,
          border: `1px solid ${cfg.color}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem',
          animation: 'mcPulse 2.4s ease-in-out infinite',
          willChange: 'opacity',
        }}>⚔️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: '0 0 0.2rem 0',
            fontFamily: '"Cinzel", serif',
            fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)',
            color: cfg.color,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>Tu ejercicio de esta semana</p>
          <p style={{
            margin: 0,
            fontFamily: '"Crimson Text", serif',
            fontSize: 'clamp(1rem, 2.8vw, 1.1rem)',
            color: 'rgba(255,255,255,0.88)',
            lineHeight: 1.4,
          }}>¿Tienes el valor de mirarte a los ojos esta semana?</p>
          {/* Flecha — solo translateY, GPU-friendly */}
          <div style={{
            marginTop: '0.4rem',
            display: 'flex', alignItems: 'center', gap: '0.35rem',
          }}>
            <span style={{
              fontSize: '0.75rem',
              animation: 'mcBounce 1.2s ease-in-out infinite',
              willChange: 'transform',
              display: 'inline-block',
            }}>↓</span>
            <span style={{
              fontFamily: '"Cinzel", serif',
              fontSize: 'clamp(0.55rem, 1.3vw, 0.65rem)',
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.1em',
            }}>Toca el ejercicio de abajo para comenzar</span>
          </div>
        </div>
      </div>

      {/* Contenido HTML */}
      {protocoloLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '4rem 1rem' }}>
          <div style={{ width: '2rem', height: '2rem', border: `3px solid ${cfg.color}33`, borderTopColor: cfg.color, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontFamily: '"Cinzel", serif', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Cargando tu protocolo...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <ModuleContent protocolo={protocolo} cfg={cfg} />
      )}

      {/* ── SEPARADOR: confirma que ya terminó el ejercicio ── */}
      {!isCompleted && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
          padding: '0.75rem 1rem',
          borderRadius: '0.75rem',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>☑️</span>
          <p style={{
            margin: 0,
            fontFamily: '"Cinzel", serif',
            fontSize: 'clamp(0.6rem, 1.4vw, 0.7rem)',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.08em',
            lineHeight: 1.5,
          }}>
            Solo sella el módulo cuando hayas completado el ejercicio de arriba
          </p>
        </div>
      )}

      {/* ── BOTÓN PRINCIPAL ── */}
      {!isCompleted ? (
        <button
          onClick={() => setShowEvidenceModal(true)}
          style={{
            width: '100%',
            padding: 'clamp(1rem, 3vw, 1.4rem)',
            background: `linear-gradient(135deg, ${cfg.color}bb, ${cfg.color})`,
            border: 'none', borderRadius: '0.875rem',
            color: '#000', fontFamily: '"Cinzel", serif',
            fontWeight: 700, fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            cursor: 'pointer', marginBottom: '2rem',
            position: 'relative', overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: `0 4px 24px ${cfg.color}44`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = `0 12px 40px ${cfg.color}66`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = `0 4px 24px ${cfg.color}44`;
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>
            ⚔️ Sellar este módulo · +{module.xpReward} XP · +{module.coinReward || 40} PropoCoins
          </span>
          {/* Shimmer */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s ease-in-out infinite',
          }} />
          <style>{`@keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }`}</style>
        </button>
      ) : (
        <div style={{
          width: '100%', padding: '1.25rem',
          border: '1px solid #10B98144',
          borderRadius: '0.875rem', textAlign: 'center', marginBottom: '2rem',
          background: 'rgba(16,185,129,0.04)',
        }}>
          <span style={{ fontFamily: '"Cinzel", serif', color: '#10B981', fontSize: 'clamp(0.8rem, 2vw, 0.875rem)', letterSpacing: '0.1em' }}>
            ✓ Módulo sellado · Evidencia publicada · Recompensas acreditadas
          </span>
        </div>
      )}

    <QuickNav />
    </div>
  );
};

export default ModuleViewer;