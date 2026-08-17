import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseCamino as supabase } from '../../services/supabaseCamino';

const styles = `
:root{
  --gold:#D4AF37; --gold-bright:#FFE566; --gold-dim:rgba(212,175,55,0.4); --gold-glow:rgba(212,175,55,0.65);
  --dark-bg:#04020e; --dark-surface:rgba(10,5,32,0.92);
  --purple:#CC44FF;
  --lilac:rgba(200,185,240,0.68); --lilac-dim:rgba(200,185,240,0.42);
  --green:#44ff88; --red:#ff4466;
}
.ctp-root *,.ctp-root *::before,.ctp-root *::after{margin:0;padding:0;box-sizing:border-box;}
.ctp-root{
  min-height:100dvh; width:100%; display:flex; flex-direction:column;
  background:
    radial-gradient(ellipse 120% 50% at 50% 0%, rgba(40,10,90,0.9) 0%, transparent 60%),
    radial-gradient(ellipse 70% 40% at 12% 15%, rgba(10,40,100,0.35) 0%, transparent 55%),
    radial-gradient(ellipse 70% 40% at 88% 10%, rgba(80,10,110,0.35) 0%, transparent 55%),
    linear-gradient(180deg,#050215 0%,#0a0530 18%,#08031c 55%,#04020e 100%);
  font-family:'Crimson Text',serif; color:#fff; position:relative;
}
.ctp-stars{position:fixed; inset:0; pointer-events:none; z-index:0;}
.ctp-star{position:absolute; border-radius:50%; background:#fff; animation:ctp-twinkle var(--d) ease-in-out infinite; animation-delay:var(--del);}
@keyframes ctp-twinkle{0%,100%{opacity:var(--min);} 50%{opacity:1;}}

/* ===== Nav superior (idéntica a la del Home, para experiencia sellada) ===== */
.ctp-topnav{
  flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:14px;
  padding:10px 26px;
  background:linear-gradient(180deg, rgba(6,3,18,0.97), rgba(6,3,18,0.88));
  border-bottom:1px solid var(--gold-dim);
  position:relative; z-index:10; flex-wrap:wrap;
}
.ctp-brand{display:flex; align-items:center; gap:10px;}
.ctp-brand-name{font-family:'Cinzel',serif; font-weight:900; letter-spacing:1px; font-size:16px; color:#fff;}
.ctp-brand-name span{color:var(--gold);}
.ctp-nav-links{display:flex; align-items:center; gap:18px; flex-wrap:wrap;}
.ctp-nav-item{
  font-family:'Cinzel',serif; font-size:12.5px; font-weight:700; letter-spacing:0.3px;
  color:var(--lilac); text-decoration:none; background:none; border:none; cursor:pointer;
  display:flex; align-items:center; gap:5px; white-space:nowrap; opacity:0.85; transition:opacity .2s, color .2s;
}
.ctp-nav-item:hover{opacity:1; color:var(--gold-bright);}
.ctp-nav-item.active{color:var(--gold-bright); opacity:1;}
.ctp-nav-item.proximamente{opacity:0.4; cursor:default;}
.ctp-nav-item.proximamente:hover{opacity:0.4; color:var(--lilac);}
.ctp-badge-prox{
  font-size:7.5px; font-weight:900; letter-spacing:0.5px; color:var(--purple);
  background:rgba(204,68,255,0.14); border:1px solid rgba(204,68,255,0.3);
  border-radius:20px; padding:1px 5px; text-transform:uppercase;
}
.ctp-salir{
  font-family:'Cinzel',serif; font-size:11px; font-weight:700; letter-spacing:0.5px;
  color:var(--lilac); text-decoration:none; opacity:0.75; cursor:pointer; background:none; border:none;
}
.ctp-salir:hover{opacity:1; color:var(--gold-bright);}
@media (max-width:760px){
  .ctp-topnav{padding:8px 14px;}
  .ctp-nav-links{gap:10px;}
  .ctp-nav-item{font-size:10.5px;}
}
/* ===== fin nav superior ===== */

.ctp-hero{
  position:relative; width:100%; height:clamp(160px,24vh,210px); flex-shrink:0;
  overflow:hidden; z-index:1;
}
.ctp-hero-photo{
  position:absolute; inset:0; width:100%; height:100%;
  background-image:url('https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/banners/camino/camino-checkin-banner.webp');
  background-size:cover; background-position:center 38%;
}
.ctp-hero-seal{
  position:absolute; top:10px; left:50%; transform:translateX(-50%);
  width:clamp(78px,13vh,104px); height:auto; z-index:2;
}
.ctp-hero::after{
  content:""; position:absolute; inset:0;
  background:
    radial-gradient(ellipse 55% 90% at 0% 100%, rgba(4,2,14,0.96) 0%, rgba(4,2,14,0.7) 45%, transparent 75%),
    linear-gradient(180deg, rgba(4,2,14,0.4) 0%, rgba(4,2,14,0.32) 30%, rgba(4,2,14,0.55) 60%, rgba(4,2,14,0.97) 100%),
    linear-gradient(90deg, rgba(4,2,14,0.55) 0%, transparent 30%, transparent 70%, rgba(4,2,14,0.55) 100%);
  pointer-events:none; z-index:1;
}
.ctp-hero-inner{
  position:relative; z-index:3; max-width:900px; width:100%; height:100%; margin:0 auto;
  display:flex; align-items:flex-end; justify-content:flex-end;
  padding:0 clamp(20px,4vw,40px) clamp(12px,1.8vh,18px);
}

.ctp-wrap{
  flex:1 1 auto; max-width:900px; width:100%; margin:0 auto;
  padding:clamp(14px,2vh,20px) clamp(20px,4vw,40px) clamp(24px,3vh,32px);
  position:relative; z-index:1; display:flex; flex-direction:column; gap:clamp(10px,1.4vh,16px);
}

.ctp-eyebrow-row{
  display:flex; align-items:center; gap:12px;
  background:linear-gradient(120deg, rgba(6,3,18,0.72) 0%, rgba(6,3,18,0.5) 70%, rgba(6,3,18,0.15) 100%);
  backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
  border:1px solid rgba(212,175,55,0.22); border-left:3px solid var(--gold);
  border-radius:12px; padding:10px 18px 10px 14px; max-width:fit-content;
  box-shadow:0 8px 24px rgba(0,0,0,0.4);
}
.ctp-eyebrow-icon{
  width:40px; height:40px; flex-shrink:0;
  border-radius:50%; border:2px solid var(--gold);
  background:radial-gradient(circle at 35% 30%, rgba(255,229,102,0.35), rgba(212,175,55,0.12) 65%, transparent 100%);
  box-shadow:0 0 18px var(--gold-glow);
  display:flex; align-items:center; justify-content:center; font-size:19px;
}
.ctp-eyebrow-tag{font-family:'Cinzel',serif; font-size:11px; font-weight:900; letter-spacing:2px; color:var(--gold); text-shadow:0 2px 10px rgba(0,0,0,0.85), 0 0 18px rgba(4,2,14,0.9);}
h1.ctp-title{font-family:'Cinzel Decorative',serif; font-weight:900; font-size:clamp(19px,2.6vh,25px); line-height:1.15; color:#fff; text-shadow:0 2px 14px rgba(0,0,0,0.9), 0 0 28px rgba(4,2,14,0.95), 0 1px 0 rgba(0,0,0,0.6);}
.ctp-hero-sub{font-family:'Nunito',sans-serif; font-size:12.5px; color:var(--lilac); margin-top:4px; max-width:400px; line-height:1.4; text-shadow:0 2px 8px rgba(0,0,0,0.85);}
.ctp-hero-sub b{color:var(--gold-bright); font-weight:700;}

.ctp-eyebrow-desktop{display:none;}

@media (min-width:761px){
  .ctp-eyebrow-desktop{
    display:flex; align-items:center; gap:14px;
    background:var(--dark-surface); border:1px solid var(--gold-dim); border-left:3px solid var(--gold);
    border-radius:14px; padding:14px 22px; margin:clamp(14px,2vh,20px) auto 0;
    max-width:900px; width:calc(100% - clamp(40px,8vw,80px));
    box-shadow:0 8px 20px rgba(0,0,0,0.3); position:relative; z-index:1;
  }
  .ctp-eyebrow-desktop .ctp-hero-sub{max-width:none; text-shadow:none;}
  .ctp-eyebrow-desktop .ctp-eyebrow-tag{text-shadow:none;}
  .ctp-eyebrow-desktop h1.ctp-title{text-shadow:none;}
  .ctp-hero-inner{display:none;}
}

@media (max-width:760px){
  .ctp-hero{height:clamp(280px,52vh,420px);}
  .ctp-hero-photo{background-position:center 30%;}
  .ctp-hero-seal{top:14px; width:clamp(88px,15vh,112px);}
  .ctp-hero-inner{justify-content:center; padding:0 16px clamp(16px,2.4vh,22px);}
  .ctp-eyebrow-row{max-width:100%; width:100%; flex-direction:column; align-items:flex-start; gap:10px; padding:14px 16px;}
  .ctp-hero-sub{max-width:100%;}
}
.ctp-eyebrow-icon{box-shadow:0 0 18px var(--gold-glow), 0 3px 12px rgba(0,0,0,0.7);}

.ctp-card{
  background:var(--dark-surface); border:1px solid var(--gold-dim); border-radius:16px;
  padding:clamp(14px,1.8vh,20px) clamp(16px,2vw,22px); position:relative; overflow:hidden;
}
.ctp-card::before{content:""; position:absolute; inset:0; background:radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,175,55,0.08), transparent 70%); pointer-events:none;}

.ctp-countdown{text-align:center; display:flex; flex-direction:column; align-items:center; gap:10px; position:relative;}
.ctp-day-label{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(22px,3.4vh,30px); color:#fff;}
.ctp-day-label .num{color:var(--gold-bright);}
.ctp-day-sub{font-family:'Nunito',sans-serif; font-size:14px; color:var(--lilac); max-width:360px;}

.ctp-section-label{
  font-family:'Cinzel',serif; font-weight:900; font-size:14px; letter-spacing:0.3px;
  color:#fff; margin-bottom:8px; display:flex; align-items:center; gap:9px;
}
.ctp-section-label::before{content:""; width:4px; height:14px; background:var(--gold); border-radius:2px; display:inline-block;}

.ctp-help-text{
  font-family:'Nunito',sans-serif; font-size:12.5px; line-height:1.5; color:var(--lilac);
  margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--gold-dim);
}
.ctp-help-text b{color:var(--gold-bright); font-weight:700;}

.ctp-form-row{display:flex; flex-direction:column; gap:5px; margin-bottom:9px; position:relative;}
.ctp-form-row:not(:last-child){padding-bottom:9px;}
.ctp-form-row:not(:last-child)::after{
  content:""; position:absolute; left:10px; bottom:-1px; top:24px; width:1px;
  background:var(--gold-dim);
}
.ctp-form-row label{
  font-family:'Nunito',sans-serif; font-weight:700; font-size:11.5px; color:var(--gold-bright); letter-spacing:0.3px;
  display:flex; align-items:center; gap:8px;
}
.ctp-step-num{
  width:19px; height:19px; flex-shrink:0; border-radius:50%;
  background:rgba(212,175,55,0.14); border:1px solid var(--gold);
  color:var(--gold-bright); font-family:'Cinzel',serif; font-weight:900; font-size:10px;
  display:flex; align-items:center; justify-content:center;
}
.ctp-select, .ctp-input-text{
  background:rgba(255,255,255,0.04); border:1px solid var(--gold-dim); border-radius:10px;
  padding:9px 13px; color:#fff; font-family:'Nunito',sans-serif; font-size:13.5px;
}
.ctp-select:focus, .ctp-input-text:focus{outline:none; border-color:var(--gold);}
.ctp-radio-row{display:flex; gap:8px; flex-wrap:wrap;}
.ctp-radio-chip{
  padding:7px 14px; border-radius:20px; border:1px solid var(--gold-dim); background:rgba(212,175,55,0.06);
  font-family:'Cinzel',serif; font-weight:700; font-size:11.5px; letter-spacing:0.3px; color:var(--lilac);
  cursor:pointer; transition:all .15s;
}
.ctp-radio-chip.active{background:rgba(212,175,55,0.22); border-color:var(--gold); color:var(--gold-bright);}

.ctp-btn{
  width:100%; padding:11px 16px; margin-top:4px;
  background:rgba(212,175,55,0.14); border:1px solid var(--gold); border-radius:10px;
  color:var(--gold-bright); font-family:'Cinzel',serif; font-weight:900; font-size:11.5px; letter-spacing:1.5px; cursor:pointer;
}
.ctp-btn:disabled{opacity:0.5; cursor:default;}
.ctp-msg-ok{color:var(--green); font-size:12.5px; margin-top:8px; text-align:center;}
.ctp-msg-error{color:var(--red); font-size:12.5px; margin-top:8px; text-align:center;}

.ctp-material-item{
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  padding:11px 14px; border-radius:11px; margin-bottom:0;
  background:rgba(212,175,55,0.07); border:1px solid var(--gold-dim);
  text-decoration:none; color:#fff;
}
.ctp-material-item:hover{background:rgba(212,175,55,0.13); border-color:var(--gold);}
.ctp-material-left{display:flex; align-items:center; gap:12px;}
.ctp-material-icon{
  width:34px; height:34px; border-radius:10px; flex-shrink:0;
  background:linear-gradient(160deg, rgba(212,175,55,0.3), rgba(124,58,237,0.2));
  display:flex; align-items:center; justify-content:center; font-size:16px; border:1px solid var(--gold-dim);
}
.ctp-material-title{font-family:'Cinzel',serif; font-weight:700; font-size:14px;}
.ctp-material-cta{font-family:'Cinzel',serif; font-weight:900; font-size:11.5px; letter-spacing:0.5px; color:var(--gold-bright); white-space:nowrap;}

.ctp-loading, .ctp-error-full{
  min-height:100dvh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; text-align:center; padding:24px;
}
.ctp-spinner{width:26px; height:26px; border:2.5px solid var(--gold-dim); border-top-color:var(--gold); border-radius:50%; animation:ctp-girar 0.8s linear infinite;}
@keyframes ctp-girar{ to{ transform:rotate(360deg); } }
.ctp-error-full .ctp-btn{max-width:260px;}
`;

const FORMATOS = ['Reel', 'TikTok', 'Historia', 'Post', 'Carrusel'];
const PLATAFORMAS = ['Instagram', 'TikTok', 'Facebook', 'YouTube'];

// ⚠️ misma ruta usada en CaminoParticipanteHomePage.jsx — mantenerlas sincronizadas


// Igual que NAV_ITEMS del Home, pero aquí "Check-in" es el activo
const NAV_ITEMS = [
  { label: 'Inicio', activo: false, disponible: true, ruta: '/camino/participante/home' },
  { label: 'Check-in', activo: true, disponible: true },
  { label: 'Calendario', activo: false, disponible: true, ruta: '/camino/participante/calendario' },
  { label: 'Pasaporte del Templario', activo: false, disponible: true, ruta: '/camino/participante/pasaporte' },
  
  { label: 'Ranking', activo: false, disponible: true, ruta: '/camino/participante/ranking' },
];

function NavSuperior({ onSalir }) {
  const navigate = useNavigate();
  return (
    <nav className="ctp-topnav">
      <div className="ctp-brand">
        <div className="ctp-brand-name">TEMPLO <span>DEL PROPÓSITO</span></div>
      </div>
      <div className="ctp-nav-links">
        {NAV_ITEMS.map(item => {
          if (!item.disponible) {
            return (
              <span key={item.label} className="ctp-nav-item proximamente">
                {item.label} <span className="ctp-badge-prox">Próximamente</span>
              </span>
            );
          }
          if (item.hrefExterno) {
            return <a key={item.label} className="ctp-nav-item" href={item.hrefExterno}>{item.label}</a>;
          }
          if (item.ruta) {
            return <button key={item.label} className="ctp-nav-item" onClick={() => navigate(item.ruta)}>{item.label}</button>;
          }
          return <span key={item.label} className={`ctp-nav-item ${item.activo ? 'active' : ''}`}>{item.label}</span>;
        })}
      </div>
      <button className="ctp-salir" onClick={onSalir}>Salir</button>
    </nav>
  );
}

export default function CaminoParticipantePanelPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // cargando | listo | sin_acceso | error
  const [participante, setParticipante] = useState(null);

  const [formato, setFormato] = useState(FORMATOS[0]);
  const [plataforma, setPlataforma] = useState(PLATAFORMAS[0]);
  const [linkPost, setLinkPost] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [msgOk, setMsgOk] = useState('');
  const [msgError, setMsgError] = useState('');

  async function cargar() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      navigate('/camino/participante/login', { replace: true });
      return;
    }

    const { data, error } = await supabase.rpc('camino_mi_progreso');

    if (error || !data || data.length === 0) {
      setEstado('sin_acceso');
      return;
    }

    setParticipante(data[0]);
    setEstado('listo');
  }

  useEffect(() => { cargar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function enviarCheckin() {
    setMsgError('');
    setMsgOk('');
    if (!linkPost.trim()) {
      setMsgError('Pega el link de tu publicación.');
      return;
    }

    setEnviando(true);
    const { error } = await supabase.rpc('camino_registrar_checkin', {
      p_dia_numero: participante.dia_actual,
      p_formato: formato,
      p_plataforma: plataforma,
      p_video_url: null,
      p_link_post: linkPost.trim(),
    });
    setEnviando(false);

    if (error) {
      setMsgError('No se pudo registrar tu evidencia. Intenta de nuevo.');
      return;
    }
    setMsgOk('¡Evidencia registrada! Sigue así, Templario.');
    setLinkPost('');
  }

  async function salir() {
    await supabase.auth.signOut();
    navigate('/camino/participante/login', { replace: true });
  }

  if (estado === 'cargando') {
    return (
      <div className="ctp-root">
        <style>{styles}</style>
        <div className="ctp-loading">
          <div className="ctp-spinner"></div>
          <p style={{ color: 'var(--lilac)', fontFamily: "'Nunito',sans-serif", fontSize: 14 }}>Verificando tu acceso...</p>
        </div>
      </div>
    );
  }

  if (estado === 'sin_acceso') {
    return (
      <div className="ctp-root">
        <style>{styles}</style>
        <div className="ctp-error-full">
          <div style={{ fontSize: 32 }}>🔒</div>
          <h1 className="ctp-title" style={{ fontSize: 22 }}>No encontramos tu acceso</h1>
          <p style={{ color: 'var(--lilac)', fontFamily: "'Nunito',sans-serif", fontSize: 14, maxWidth: 320 }}>
            Tu cuenta todavía no tiene un acceso activo al Camino. Pide un link de invitación a tu gestor.
          </p>
          <button className="ctp-btn" onClick={() => navigate('/camino/participante/login')}>IR AL LOGIN</button>
        </div>
      </div>
    );
  }

  const diaActual = participante?.dia_actual ?? 1;

  return (
    <div className="ctp-root">
      <style>{styles}</style>
      <div className="ctp-stars" id="ctp-stars"></div>

      <NavSuperior onSalir={salir} />

      <div className="ctp-hero">
        <div className="ctp-hero-photo" />

        <svg className="ctp-hero-seal" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="ctpSealAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0c0620" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#0c0620" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0c0620" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g transform="translate(110,110)">
            <circle r="108" fill="url(#ctpSealAura)" />
            <circle r="72" fill="none" stroke="#D4AF37" strokeWidth="1.5" opacity="0.85" />
            <circle r="58" fill="none" stroke="#FFE566" strokeWidth="1" opacity="0.45" />
            <circle r="38" fill="#0c0620" stroke="#D4AF37" strokeWidth="1.5" />
            <text x="0" y="-9" textAnchor="middle" fontFamily="'Cinzel',serif" fontWeight="700" fontSize="8" letterSpacing="2" fill="#D4AF37" opacity="0.85">DÍA</text>
            <text x="0" y="20" textAnchor="middle" fontFamily="'Cinzel Decorative',serif" fontWeight="900" fontSize="26" fill="#FFE566">{diaActual}</text>

            <g transform="translate(0,-86)">
              <circle r="16" fill="#0c0620" stroke="#D4AF37" strokeWidth="1.3" />
              <rect x="-7" y="-5" width="14" height="10" rx="2" fill="none" stroke="#FFE566" strokeWidth="1.3" />
              <circle r="3" fill="none" stroke="#FFE566" strokeWidth="1.2" />
              <rect x="-3" y="-7.5" width="6" height="2.5" rx="1" fill="#FFE566" />
            </g>
            <g transform="translate(86,0)">
              <circle r="16" fill="#0c0620" stroke="#D4AF37" strokeWidth="1.3" />
              <path d="M-4,-6 L7,0 L-4,6 Z" fill="#FFE566" />
            </g>
            <g transform="translate(0,86)">
              <circle r="16" fill="#0c0620" stroke="#D4AF37" strokeWidth="1.3" />
              <path d="M-7,-4 h14 a2,2 0 0 1 2,2 v4 a2,2 0 0 1 -2,2 h-9 l-4,4 v-4 h-1 a2,2 0 0 1 -2,-2 v-4 a2,2 0 0 1 2,-2 z"
                fill="none" stroke="#FFE566" strokeWidth="1.2" />
            </g>
            <g transform="translate(-86,0)">
              <circle r="16" fill="#0c0620" stroke="#D4AF37" strokeWidth="1.3" />
              <path d="M0,-7 L2,-2 L7,-2 L3,1 L5,6 L0,3 L-5,6 L-3,1 L-7,-2 L-2,-2 Z" fill="#FFE566" />
            </g>
          </g>
        </svg>

        <div className="ctp-hero-inner">
          <div className="ctp-eyebrow-row">
            <div className="ctp-eyebrow-icon">🗺️</div>
            <div>
              <div className="ctp-eyebrow-tag">TU CAMINO ESTÁ EN MARCHA</div>
              <h1 className="ctp-title">Hola, {participante?.nombre?.split(' ')[0] || 'Templario'}</h1>
              <div className="ctp-hero-sub">Día <b>{diaActual}</b> de tu Camino — publica en tus redes y registra el link para mantener tu constancia.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="ctp-eyebrow-desktop">
        <div className="ctp-eyebrow-icon">🗺️</div>
        <div>
          <div className="ctp-eyebrow-tag">TU CAMINO ESTÁ EN MARCHA</div>
          <h1 className="ctp-title">Hola, {participante?.nombre?.split(' ')[0] || 'Templario'}</h1>
          <div className="ctp-hero-sub">Día <b>{diaActual}</b> de tu Camino — publica en tus redes y registra el link para mantener tu constancia.</div>
        </div>
      </div>

      <div className="ctp-wrap">
        <div className="ctp-card">
          <div className="ctp-section-label">Registrar evidencia de hoy</div>
          <p className="ctp-help-text">
            Publica sobre el reto en tus redes y pega aquí el link. Eso cuenta como tu evidencia del día:
            mantiene tu racha viva y te suma puntos en el <b>Ranking</b>.
          </p>

          <div className="ctp-form-row">
            <label><span className="ctp-step-num">1</span>Formato</label>
            <div className="ctp-radio-row">
              {FORMATOS.map(f => (
                <div key={f} className={`ctp-radio-chip ${formato === f ? 'active' : ''}`} onClick={() => setFormato(f)}>{f}</div>
              ))}
            </div>
          </div>
          <div className="ctp-form-row">
            <label><span className="ctp-step-num">2</span>Plataforma</label>
            <div className="ctp-radio-row">
              {PLATAFORMAS.map(p => (
                <div key={p} className={`ctp-radio-chip ${plataforma === p ? 'active' : ''}`} onClick={() => setPlataforma(p)}>{p}</div>
              ))}
            </div>
          </div>
          <div className="ctp-form-row">
            <label><span className="ctp-step-num">3</span>Link de tu publicación</label>
            <input
              type="text"
              className="ctp-input-text"
              placeholder="https://..."
              value={linkPost}
              onChange={(e) => setLinkPost(e.target.value)}
            />
          </div>
          <button className="ctp-btn" disabled={enviando} onClick={enviarCheckin}>
            {enviando ? 'REGISTRANDO...' : 'REGISTRAR EVIDENCIA'}
          </button>
          {msgOk && <p className="ctp-msg-ok">{msgOk}</p>}
          {msgError && <p className="ctp-msg-error">{msgError}</p>}
        </div>

        <div>
          <div className="ctp-section-label">Material del camino</div>
          <a className="ctp-material-item" href="/bases-camino.html">
            <div className="ctp-material-left">
              <div className="ctp-material-icon">📜</div>
              <div className="ctp-material-title">Las Bases del Camino</div>
            </div>
            <div className="ctp-material-cta">ABRIR →</div>
          </a>
        </div>
      </div>
    </div>
  );
}