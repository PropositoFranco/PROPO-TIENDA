import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseCamino as supabase } from '../../services/supabaseCamino';

const styles = `
:root{
  --gold:#D4AF37; --gold-bright:#FFE566; --gold-dim:rgba(212,175,55,0.4); --gold-glow:rgba(212,175,55,0.65);
  --dark-bg:#04020e; --dark-surface:rgba(10,5,32,0.92);
  --purple:#CC44FF;
  --lilac:rgba(200,185,240,0.68); --lilac-dim:rgba(200,185,240,0.42);
}
.chh-root *,.chh-root *::before,.chh-root *::after{margin:0;padding:0;box-sizing:border-box;}
.chh-root{
  min-height:100dvh; width:100%; display:flex; flex-direction:column;
  background:
    radial-gradient(ellipse 120% 50% at 50% 0%, rgba(40,10,90,0.9) 0%, transparent 60%),
    radial-gradient(ellipse 70% 40% at 12% 15%, rgba(10,40,100,0.35) 0%, transparent 55%),
    radial-gradient(ellipse 70% 40% at 88% 10%, rgba(80,10,110,0.35) 0%, transparent 55%),
    linear-gradient(180deg,#050215 0%,#0a0530 18%,#08031c 55%,#04020e 100%);
  font-family:'Crimson Text',serif; color:#fff; position:relative;
}
.chh-stars{position:fixed; inset:0; pointer-events:none; z-index:0;}
.chh-star{position:absolute; border-radius:50%; background:#fff; animation:chh-twinkle var(--d) ease-in-out infinite; animation-delay:var(--del);}
@keyframes chh-twinkle{0%,100%{opacity:var(--min);} 50%{opacity:1;}}

.chh-topnav{
  flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:14px;
  padding:10px 26px;
  background:linear-gradient(180deg, rgba(6,3,18,0.97), rgba(6,3,18,0.88));
  border-bottom:1px solid var(--gold-dim);
  position:relative; z-index:10; flex-wrap:wrap;
}
.chh-brand{display:flex; align-items:center; gap:10px;}
.chh-brand-name{font-family:'Cinzel',serif; font-weight:900; letter-spacing:1px; font-size:16px; color:#fff;}
.chh-brand-name span{color:var(--gold);}
.chh-nav-links{display:flex; align-items:center; gap:18px; flex-wrap:wrap;}
.chh-nav-item{
  font-family:'Cinzel',serif; font-size:12.5px; font-weight:700; letter-spacing:0.3px;
  color:var(--lilac); text-decoration:none; background:none; border:none; cursor:pointer;
  display:flex; align-items:center; gap:5px; white-space:nowrap; opacity:0.85; transition:opacity .2s, color .2s;
}
.chh-nav-item:hover{opacity:1; color:var(--gold-bright);}
.chh-nav-item.active{color:var(--gold-bright); opacity:1;}
.chh-nav-item.proximamente{opacity:0.4; cursor:default;}
.chh-nav-item.proximamente:hover{opacity:0.4; color:var(--lilac);}
.chh-badge-prox{
  font-size:7.5px; font-weight:900; letter-spacing:0.5px; color:var(--purple);
  background:rgba(204,68,255,0.14); border:1px solid rgba(204,68,255,0.3);
  border-radius:20px; padding:1px 5px; text-transform:uppercase;
}
.chh-salir{
  font-family:'Cinzel',serif; font-size:11px; font-weight:700; letter-spacing:0.5px;
  color:var(--lilac); text-decoration:none; opacity:0.75; cursor:pointer; background:none; border:none;
}
.chh-salir:hover{opacity:1; color:var(--gold-bright);}

.chh-wrap{
  flex:1 1 auto; max-width:1080px; width:100%; margin:0 auto;
  padding:clamp(20px,4vh,40px) clamp(20px,4vw,40px);
  position:relative; z-index:1; display:flex; flex-direction:column; gap:clamp(16px,2.4vh,26px);
}

.chh-hero{
  position:relative; width:100%; height:clamp(320px,50vh,480px); flex-shrink:0;
  background-image:url('https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/banners/camino/camino-lobby-banner.webp');
  background-size:cover; background-position:center 58%;
  display:flex; align-items:flex-end; z-index:1;
}
.chh-hero::after{
  content:""; position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(4,2,14,0.1) 0%, rgba(4,2,14,0.5) 55%, rgba(4,2,14,0.98) 100%);
  pointer-events:none;
}
.chh-hero-inner{
  position:relative; z-index:2; max-width:1080px; width:100%; margin:0 auto;
  padding:0 clamp(20px,4vw,40px) clamp(18px,3vh,28px);
}
.chh-eyebrow-row{display:flex; align-items:center; gap:16px;}
.chh-eyebrow-icon{
  width:56px; height:56px; flex-shrink:0;
  border-radius:50%; border:2px solid var(--gold);
  background:radial-gradient(circle at 35% 30%, rgba(255,229,102,0.35), rgba(212,175,55,0.12) 65%, transparent 100%);
  box-shadow:0 0 18px var(--gold-glow);
  display:flex; align-items:center; justify-content:center; font-size:26px;
}
.chh-eyebrow-tag{font-family:'Cinzel',serif; font-size:13px; font-weight:900; letter-spacing:2.4px; color:var(--gold);}
h1.chh-title{font-family:'Cinzel Decorative',serif; font-weight:900; font-size:clamp(24px,4vh,34px); line-height:1.15; color:#fff;}

.chh-grid{display:grid; grid-template-columns:1.1fr 1fr; gap:clamp(12px,2vh,20px);}
@media (max-width:720px){ .chh-grid{grid-template-columns:1fr;} }

.chh-card{
  background:var(--dark-surface); border:1px solid var(--gold-dim); border-radius:16px;
  padding:clamp(18px,2.6vh,28px) clamp(18px,2.4vw,28px); position:relative; overflow:hidden;
}
.chh-card::before{content:""; position:absolute; inset:0; background:radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,175,55,0.08), transparent 70%); pointer-events:none;}

.chh-progress{text-align:center; display:flex; flex-direction:column; align-items:center; gap:12px; position:relative;}
.chh-day-label{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(22px,3.4vh,30px); color:#fff;}
.chh-day-label .num{color:var(--gold-bright);}
.chh-day-sub{font-family:'Nunito',sans-serif; font-size:14px; color:var(--lilac); max-width:340px;}
.chh-btn{
  padding:12px 24px; margin-top:4px;
  background:rgba(212,175,55,0.14); border:1px solid var(--gold); border-radius:10px;
  color:var(--gold-bright); font-family:'Cinzel',serif; font-weight:900; font-size:11.5px; letter-spacing:1.2px; cursor:pointer;
  text-decoration:none; display:inline-block;
}

.chh-section-label{
  font-family:'Cinzel',serif; font-weight:900; font-size:15px; letter-spacing:0.3px;
  color:#fff; margin-bottom:12px; display:flex; align-items:center; gap:9px;
}
.chh-section-label::before{content:""; width:4px; height:15px; background:var(--gold); border-radius:2px; display:inline-block;}
.chh-intro-card p{font-family:'Crimson Text',serif; font-size:clamp(14.5px,1.9vh,17px); line-height:1.55; color:rgba(255,255,255,0.9);}
.chh-intro-card b{color:var(--gold-bright); font-weight:600;}

.chh-material-item{
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  padding:14px 16px; border-radius:11px;
  background:rgba(212,175,55,0.07); border:1px solid var(--gold-dim);
  text-decoration:none; color:#fff; transition:background .2s, border-color .2s;
}
.chh-material-item:hover{background:rgba(212,175,55,0.13); border-color:var(--gold);}
.chh-material-left{display:flex; align-items:center; gap:12px;}
.chh-material-icon{
  width:38px; height:38px; border-radius:10px; flex-shrink:0;
  background:linear-gradient(160deg, rgba(212,175,55,0.3), rgba(124,58,237,0.2));
  display:flex; align-items:center; justify-content:center; font-size:18px; border:1px solid var(--gold-dim);
}
.chh-material-title{font-family:'Cinzel',serif; font-weight:700; font-size:15px;}
.chh-material-cta{font-family:'Cinzel',serif; font-weight:900; font-size:12px; letter-spacing:0.5px; color:var(--gold-bright); white-space:nowrap;}

.chh-loading{
  min-height:100dvh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; text-align:center; padding:24px;
}
.chh-spinner{width:26px; height:26px; border:2.5px solid var(--gold-dim); border-top-color:var(--gold); border-radius:50%; animation:chh-girar 0.8s linear infinite;}
@keyframes chh-girar{ to{ transform:rotate(360deg); } }

@media (max-width:760px){
  .chh-topnav{padding:8px 14px;}
  .chh-nav-links{gap:10px;}
  .chh-nav-item{font-size:10.5px;}
  .chh-hero{background-position:80% 58%;}
}
`;

// ⚠️ VERIFICA: no sé la ruta real de "Pasaporte del Templario" — dejo esta,
// ajústala si vive en otro lado (ej. una ruta de React tipo /pasaporte).


const NAV_ITEMS = [
  { label: 'Inicio', activo: true, disponible: true },
  { label: 'Check-in', activo: false, disponible: true, ruta: '/camino/participante/panel' },
  { label: 'Calendario', activo: false, disponible: true, ruta: '/camino/participante/calendario' },
  { label: 'Pasaporte del Templario', activo: false, disponible: true, ruta: '/camino/participante/pasaporte' },
  
{ label: 'Ranking', activo: false, disponible: true, ruta: '/camino/participante/ranking' },
];

export default function CaminoParticipanteHomePage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // cargando | listo | sin_acceso
  const [participante, setParticipante] = useState(null);
  const [estrellas, setEstrellas] = useState([]);

  useEffect(() => {
    const n = window.innerWidth < 760 ? 30 : 60;
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        id: i,
        size: (Math.random() * 1.6 + 0.6).toFixed(1),
        top: (Math.random() * 100).toFixed(1),
        left: (Math.random() * 100).toFixed(1),
        dur: (Math.random() * 4 + 3).toFixed(1),
        delay: (Math.random() * 4).toFixed(1),
        min: (Math.random() * 0.4 + 0.15).toFixed(2),
      });
    }
    setEstrellas(arr);
  }, []);

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

    const { data: perfilSocial, error: errPerfilSocial } = await supabase.rpc('camino_mi_perfil_social');
    if (!errPerfilSocial && (!perfilSocial || perfilSocial.length === 0)) {
      navigate('/camino/participante/onboarding', { replace: true });
      return;
    }

    setParticipante(data[0]);
    setEstado('listo');
  }

  useEffect(() => { cargar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function salir() {
    await supabase.auth.signOut();
    navigate('/camino/participante/login', { replace: true });
  }

  if (estado === 'cargando') {
    return (
      <div className="chh-root">
        <style>{styles}</style>
        <div className="chh-loading">
          <div className="chh-spinner"></div>
          <p style={{ color: 'var(--lilac)', fontFamily: "'Nunito',sans-serif", fontSize: 14 }}>Verificando tu acceso...</p>
        </div>
      </div>
    );
  }

  if (estado === 'sin_acceso') {
    return (
      <div className="chh-root">
        <style>{styles}</style>
        <div className="chh-loading">
          <div style={{ fontSize: 32 }}>🔒</div>
          <h1 className="chh-title" style={{ fontSize: 22 }}>No encontramos tu acceso</h1>
          <p style={{ color: 'var(--lilac)', fontFamily: "'Nunito',sans-serif", fontSize: 14, maxWidth: 320 }}>
            Tu cuenta todavía no tiene un acceso activo al Camino. Pide un link de invitación a tu gestor.
          </p>
          <button className="chh-btn" onClick={() => navigate('/camino/participante/login')}>IR AL LOGIN</button>
        </div>
      </div>
    );
  }

  const diaActual = participante?.dia_actual ?? 1;

  return (
    <div className="chh-root">
      <style>{styles}</style>
      <div className="chh-stars">
        {estrellas.map(s => (
          <div key={s.id} className="chh-star" style={{
            width: `${s.size}px`, height: `${s.size}px`, top: `${s.top}%`, left: `${s.left}%`,
            '--d': `${s.dur}s`, '--del': `${s.delay}s`, '--min': s.min,
          }} />
        ))}
      </div>

      <nav className="chh-topnav">
        <div className="chh-brand">
          <div className="chh-brand-name">TEMPLO <span>DEL PROPÓSITO</span></div>
        </div>
        <div className="chh-nav-links">
          {NAV_ITEMS.map(item => {
            if (!item.disponible) {
              return (
                <span key={item.label} className="chh-nav-item proximamente">
                  {item.label} <span className="chh-badge-prox">Próximamente</span>
                </span>
              );
            }
            if (item.hrefExterno) {
              return <a key={item.label} className="chh-nav-item" href={item.hrefExterno}>{item.label}</a>;
            }
            if (item.ruta) {
              return <button key={item.label} className="chh-nav-item" onClick={() => navigate(item.ruta)}>{item.label}</button>;
            }
            return <span key={item.label} className={`chh-nav-item ${item.activo ? 'active' : ''}`}>{item.label}</span>;
          })}
        </div>
        <button className="chh-salir" onClick={salir}>Salir</button>
      </nav>

      <div className="chh-hero">
        <div className="chh-hero-inner">
          <div className="chh-eyebrow-row">
            <div className="chh-eyebrow-icon">🗺️</div>
            <div>
              <div className="chh-eyebrow-tag">TU CAMINO ESTÁ EN MARCHA</div>
              <h1 className="chh-title">Hola, {participante?.nombre?.split(' ')[0] || 'Templario'}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="chh-wrap">
        <div className="chh-grid">
          <div className="chh-card">
            <div className="chh-progress">
              <div className="chh-day-label">Día <span className="num">{diaActual}</span> de tu Camino</div>
              <div className="chh-day-sub">Publica tu evidencia de hoy para mantener tu constancia.</div>
              <button className="chh-btn" onClick={() => navigate('/camino/participante/panel')}>📸 REGISTRAR EVIDENCIA</button>
            </div>
          </div>

          <div className="chh-card chh-intro-card">
            <div className="chh-section-label">¿En qué consiste este camino?</div>
            <p>Publica contenido durante tu camino, registra <b>cada venta</b> que te traiga y cumple tu <b>paso semanal de avance</b>. Al final, tú y tu líder deciden si esto se vuelve tu siguiente nivel.</p>
          </div>
        </div>

        <div>
          <div className="chh-section-label">Material del camino</div>
          <a className="chh-material-item" href="#" onClick={(e) => { e.preventDefault(); navigate('/camino/participante/bases'); }}>
            <div className="chh-material-left">
              <div className="chh-material-icon">📜</div>
              <div className="chh-material-title">Las Bases del Camino</div>
            </div>
            <div className="chh-material-cta">ABRIR →</div>
          </a>
        </div>
      </div>
    </div>
  );
}