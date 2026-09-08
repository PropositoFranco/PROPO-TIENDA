import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';

const font = { title: '"Cinzel", serif', body: '"Crimson Text", serif' };

const STORAGE_KEY = '_testimonio_popup_v2';

// ---------------------------------------------------------------------------
// OPTIMIZACIÓN 1: el CSS (incluidas las @keyframes) se inyecta UNA sola vez
// en <head>, no cada vez que se abre el modal. Antes: un <style> nuevo cada
// vez que `visible` pasaba a true -> el navegador tenía que re-parsear el CSS.
// ---------------------------------------------------------------------------
const STYLE_ID = 'testimonio-popup-styles';
function injectStylesOnce() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const tag = document.createElement('style');
  tag.id = STYLE_ID;
  tag.textContent = `
    @keyframes twIn {
      from { opacity:0; transform: scale(.94) translateY(16px); }
      to   { opacity:1; transform: scale(1) translateY(0); }
    }
    @keyframes twFade {
      from { opacity:0; }
      to   { opacity:1; }
    }
    .tw-overlay {
      position:fixed; inset:0; z-index:99999;
      background:rgba(4,2,14,.92);
      display:flex; align-items:center; justify-content:center;
      padding:1rem; overflow-y:auto; -webkit-overflow-scrolling:touch;
      animation: twFade .25s ease-out;
      /* OPTIMIZACIÓN: aísla el repintado del overlay del resto del árbol */
      contain: layout style paint;
    }
    .tw-card {
      max-width:420px; width:100%; max-height:calc(100vh - 2rem);
      overflow-y:auto; margin:auto;
      background: linear-gradient(180deg, rgba(24,10,40,.97) 0%, rgba(4,2,14,.97) 100%);
      border:1.5px solid rgba(192,132,252,.35); border-radius:1.5rem;
      padding:clamp(1.5rem,5vw,2.25rem); text-align:center;
      /* sombra mucho más barata que el blur de 80px original */
      box-shadow: 0 8px 24px rgba(0,0,0,.4), 0 0 0 1px rgba(192,132,252,.08);
      position:relative;
      animation: twIn .3s cubic-bezier(.16,1,.3,1);
      will-change: transform, opacity;
    }
    .tw-card-glow {
      position:absolute; top:0; left:20%; right:20%; height:1px;
      background:linear-gradient(90deg,transparent,rgba(192,132,252,.8),transparent);
    }
    .tw-star { cursor:pointer; transition:transform .15s; font-size:1.6rem; }
    .tw-star:hover { transform:scale(1.2); }
    .tw-textarea {
      width:100%; background:rgba(255,255,255,.05); border:1px solid rgba(192,132,252,.25);
      border-radius:.625rem; padding:.75rem 1rem; color:#fff; resize:none; min-height:90px;
      font-family:"Crimson Text",serif; font-size:1rem; line-height:1.5; outline:none;
    }
    .tw-textarea:focus { border-color:rgba(192,132,252,.6); }
    .tw-btn-main {
      width:100%; padding:.875rem; background:linear-gradient(135deg,#9333ea,#C084FC);
      border:none; border-radius:.625rem; color:#000; font-family:"Cinzel",serif;
      font-weight:700; font-size:.78rem; letter-spacing:.12em; text-transform:uppercase;
      cursor:pointer; transition:filter .2s, transform .2s;
    }
    .tw-btn-main:hover { filter:brightness(1.1); transform:translateY(-1px); }
    .tw-btn-main:disabled { opacity:.5; cursor:not-allowed; }
    .tw-link-btn {
      background:transparent; border:none; color:rgba(255,255,255,.22);
      font-family:"Crimson Text",serif; font-size:.85rem; cursor:pointer; padding:.25rem;
      transition: color .2s;
    }
    .tw-link-btn:hover { color:rgba(255,255,255,.5); }
  `;
  document.head.appendChild(tag);
}

export default function TestimonioPopup() {
  const user = useAuthStore(s => s.user);
  const [visible, setVisible]   = useState(false);
  const [step,    setStep]      = useState('ask'); // ask | form | thanks
  const [estrellas, setEstrellas] = useState(5);
  const [texto,   setTexto]     = useState('');
  const [sending, setSending]   = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    injectStylesOnce();
  }, []);

  useEffect(() => {
    if (!user) return;

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (stored.done) return;
    if (stored.snoozed && Date.now() < stored.snoozed) return;

    const createdAt = new Date(user.created_at || Date.now());
    const diasRegistrado = Math.floor((Date.now() - createdAt) / 86400000);
    const streak = user.streak_days || 0;

    if (diasRegistrado >= 7 || streak >= 7) {
      const timer = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const snooze = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ snoozed: Date.now() + 3 * 86400000 }));
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') snooze(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible]);

  // OPTIMIZACIÓN: una vez terminó la animación de entrada, quitamos
  // will-change para que el navegador libere la capa de composición
  // (dejarlo indefinidamente consume memoria de GPU sin necesidad).
  useEffect(() => {
    if (!visible || !cardRef.current) return;
    const el = cardRef.current;
    const clear = () => { el.style.willChange = 'auto'; };
    el.addEventListener('animationend', clear, { once: true });
    return () => el.removeEventListener('animationend', clear);
  }, [visible]);

  const handleEnviar = async () => {
    if (texto.trim().length < 20) return;
    setSending(true);
    await supabase.from('testimonios').insert({
      user_id:  user.id,
      nombre:   user.templario_name || user.skool_name || 'Templario',
      rol:      user.membership_type === 'free' ? 'Templaria Despertar' : 'Fundador Tríada',
      texto:    texto.trim(),
      estrellas,
      aprobado: false,
    });
    setSending(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ done: true }));
    setStep('thanks');
    setTimeout(() => setVisible(false), 3000);
  };

  if (!visible) return null;

  return (
    <div
      className="tw-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) snooze(); }}
    >
      <div className="tw-card" ref={cardRef}>
        <div className="tw-card-glow" />

        {step === 'ask' && <>
          <div style={{ fontSize:'2.5rem', marginBottom:'.5rem' }}>🏛️</div>
          <h3 style={{ fontFamily:font.title, fontWeight:700,
            fontSize:'clamp(1rem,3vw,1.3rem)', color:'#fff', marginBottom:'.5rem' }}>
            ¿Cómo va tu experiencia<br/>en el Templo?
          </h3>
          <p style={{ fontFamily:font.body, fontSize:'clamp(.9rem,2vw,1rem)',
            color:'rgba(255,255,255,.45)', marginBottom:'1.5rem', lineHeight:1.5 }}>
            Tienes tiempo dentro — tu opinión ayuda a otros Templarios a dar el paso.
          </p>
          <button className="tw-btn-main" onClick={() => setStep('form')}
            style={{ marginBottom:'.75rem' }}>
            ⚡ Compartir mi experiencia
          </button>
          <button onClick={snooze} className="tw-link-btn">
            Ahora no →
          </button>
        </>}

        {step === 'form' && <>
          <div style={{ fontSize:'2rem', marginBottom:'.5rem' }}>✍️</div>
          <h3 style={{ fontFamily:font.title, fontWeight:700,
            fontSize:'clamp(.95rem,2.5vw,1.15rem)', color:'#fff', marginBottom:'1rem' }}>
            Cuéntanos tu resultado real
          </h3>

          <div style={{ display:'flex', justifyContent:'center', gap:'.35rem', marginBottom:'1rem' }}>
            {[1,2,3,4,5].map(n => (
              <span key={n} className="tw-star"
                onClick={() => setEstrellas(n)}
                style={{ color: n <= estrellas ? '#F5C518' : 'rgba(255,255,255,.2)' }}>★</span>
            ))}
          </div>

          <textarea className="tw-textarea" placeholder='Ej: "En 2 semanas automaticé mis reportes. Ahorro 3 horas al día..."'
            value={texto} onChange={e => setTexto(e.target.value)} maxLength={280}/>
          <div style={{ fontFamily:font.body, fontSize:'.75rem',
            color:'rgba(255,255,255,.2)', textAlign:'right', marginBottom:'1rem' }}>
            {texto.length}/280
          </div>

          <button className="tw-btn-main" onClick={handleEnviar}
            disabled={sending || texto.trim().length < 20}>
            {sending ? '⏳ Enviando...' : '👑 Enviar testimonio'}
          </button>
          <button onClick={snooze} className="tw-link-btn"
            style={{ display:'block', margin:'.5rem auto 0' }}>
            Cancelar
          </button>
        </>}

        {step === 'thanks' && <>
          <div style={{ fontSize:'3rem', marginBottom:'.75rem' }}>🎉</div>
          <h3 style={{ fontFamily:font.title, fontWeight:700,
            fontSize:'clamp(1rem,3vw,1.25rem)', color:'#C084FC', marginBottom:'.5rem' }}>
            ¡Gracias Templario!
          </h3>
          <p style={{ fontFamily:font.body, fontSize:'clamp(.9rem,2vw,1rem)',
            color:'rgba(255,255,255,.45)', lineHeight:1.5 }}>
            Tu testimonio será revisado y aparecerá pronto en el Templo.
          </p>
        </>}
      </div>
    </div>
  );
}
