import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';

const font = { title: '"Cinzel", serif', body: '"Crimson Text", serif' };

const STORAGE_KEY = '_testimonio_popup';

export default function TestimonioPopup() {
  const user = useAuthStore(s => s.user);
  const [visible, setVisible]   = useState(false);
  const [step,    setStep]      = useState('ask'); // ask | form | thanks
  const [estrellas, setEstrellas] = useState(5);
  const [texto,   setTexto]     = useState('');
  const [sending, setSending]   = useState(false);

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
    <div style={{
      position:'fixed', inset:0, zIndex:99999,
      background:'rgba(2,1,10,.85)', backdropFilter:'blur(12px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'1rem', animation:'twIn .4s cubic-bezier(.16,1,.3,1)',
    }}>
      <style>{`
        @keyframes twIn { from{opacity:0;transform:scale(.94) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .tw-star { cursor:pointer; transition:transform .15s; font-size:1.6rem; }
        .tw-star:hover { transform:scale(1.25); }
        .tw-textarea { width:100%; background:rgba(255,255,255,.05); border:1px solid rgba(192,132,252,.25);
          border-radius:.625rem; padding:.75rem 1rem; color:#fff; resize:none; min-height:90px;
          font-family:"Crimson Text",serif; font-size:1rem; line-height:1.5; outline:none; }
        .tw-textarea:focus { border-color:rgba(192,132,252,.6); }
        .tw-btn-main { width:100%; padding:.875rem; background:linear-gradient(135deg,#9333ea,#C084FC);
          border:none; border-radius:.625rem; color:#000; font-family:"Cinzel",serif;
          font-weight:700; font-size:.78rem; letter-spacing:.12em; text-transform:uppercase;
          cursor:pointer; transition:all .2s; }
        .tw-btn-main:hover { filter:brightness(1.1); transform:translateY(-1px); }
        .tw-btn-main:disabled { opacity:.5; cursor:not-allowed; }
      `}</style>

      <div style={{
        maxWidth:'420px', width:'100%',
        background:'radial-gradient(ellipse at top,rgba(192,132,252,.12) 0%,rgba(4,2,14,.97) 70%)',
        border:'1.5px solid rgba(192,132,252,.35)', borderRadius:'1.5rem',
        padding:'clamp(1.5rem,5vw,2.25rem)', textAlign:'center',
        boxShadow:'0 0 80px rgba(192,132,252,.15)', position:'relative',
      }}>
        {/* Línea brillo top */}
        <div style={{ position:'absolute',top:0,left:'20%',right:'20%',height:'1px',
          background:'linear-gradient(90deg,transparent,rgba(192,132,252,.8),transparent)' }}/>

        {step === 'ask' && <>
          <div style={{ fontSize:'2.5rem', marginBottom:'.5rem',
            filter:'drop-shadow(0 0 12px rgba(192,132,252,.6))' }}>🏛️</div>
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
          <button onClick={snooze} style={{ background:'transparent', border:'none',
            color:'rgba(255,255,255,.22)', fontFamily:font.body, fontSize:'.85rem',
            cursor:'pointer', padding:'.25rem' }}
            onMouseEnter={e=>e.target.style.color='rgba(255,255,255,.5)'}
            onMouseLeave={e=>e.target.style.color='rgba(255,255,255,.22)'}>
            Ahora no →
          </button>
        </>}

        {step === 'form' && <>
          <div style={{ fontSize:'2rem', marginBottom:'.5rem' }}>✍️</div>
          <h3 style={{ fontFamily:font.title, fontWeight:700,
            fontSize:'clamp(.95rem,2.5vw,1.15rem)', color:'#fff', marginBottom:'1rem' }}>
            Cuéntanos tu resultado real
          </h3>

          {/* Estrellas */}
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
          <button onClick={snooze} style={{ background:'transparent', border:'none',
            color:'rgba(255,255,255,.18)', fontFamily:font.body, fontSize:'.82rem',
            cursor:'pointer', padding:'.5rem', display:'block', margin:'.5rem auto 0' }}>
            Cancelar
          </button>
        </>}

        {step === 'thanks' && <>
          <div style={{ fontSize:'3rem', marginBottom:'.75rem',
            animation:'twIn .5s ease' }}>🎉</div>
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