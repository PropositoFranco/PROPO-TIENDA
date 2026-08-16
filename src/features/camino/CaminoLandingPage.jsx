import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const styles = `
:root{
  --gold:#D4AF37; --gold-bright:#FFE566; --gold-dim:rgba(212,175,55,0.4); --gold-glow:rgba(212,175,55,0.65);
  --dark-bg:#04020e; --dark-surface:rgba(10,5,32,0.92);
  --purple:#CC44FF;
  --lilac:rgba(200,185,240,0.72); --lilac-dim:rgba(200,185,240,0.45);
}
.cla-root *,.cla-root *::before,.cla-root *::after{margin:0;padding:0;box-sizing:border-box;}
.cla-root{
  height:100dvh; width:100%; overflow:hidden; position:relative;
  background:#04020e; font-family:'Crimson Text',serif; color:#fff;
}
.cla-hero-bg{position:absolute; inset:0; overflow:hidden; z-index:0;}
.cla-hero-bg::before{
  content:""; position:absolute; inset:0;
  background:
    radial-gradient(ellipse 90% 70% at 50% 30%, rgba(212,175,55,0.16) 0%, transparent 55%),
    radial-gradient(ellipse 60% 50% at 15% 60%, rgba(10,40,100,0.28) 0%, transparent 55%),
    radial-gradient(ellipse 60% 50% at 85% 55%, rgba(204,68,255,0.22) 0%, transparent 55%),
    linear-gradient(180deg,#050215 0%,#0a0530 22%,#08031c 55%,#04020e 100%);
}
.cla-temple-silhouette{
  position:absolute; left:50%; bottom:0; transform:translateX(-50%);
  width:min(1400px, 220vw); opacity:0.16; filter:blur(0.3px);
}
.cla-hero-bg::after{
  content:""; position:absolute; inset:0;
  background:radial-gradient(ellipse 80% 65% at 50% 42%, rgba(4,2,14,0) 0%, rgba(4,2,14,0.55) 65%, rgba(4,2,14,0.94) 100%);
}
.cla-stars{position:absolute; inset:0; z-index:1;}
.cla-star{position:absolute; border-radius:50%; background:#fff; animation:cla-twinkle var(--d) ease-in-out infinite; animation-delay:var(--del);}
@keyframes cla-twinkle{0%,100%{opacity:var(--min);} 50%{opacity:1;}}

.cla-page{position:relative; z-index:2; height:100dvh; display:flex; flex-direction:column; overflow:hidden;}

.cla-back-link{
  flex:0 0 auto; display:inline-flex; align-items:center; gap:clamp(6px,1vw,8px); width:fit-content;
  font-family:'Cinzel',serif; font-weight:700; font-size:clamp(11.5px,1.6vh,13px); letter-spacing:0.3px;
  color:var(--lilac); text-decoration:none; margin:clamp(12px,2.4vh,26px) clamp(14px,4vw,40px) 0;
  padding:clamp(7px,1.3vh,9px) clamp(13px,2vw,16px); border:1px solid var(--gold-dim); border-radius:100px;
  background:rgba(10,5,32,0.5); backdrop-filter:blur(6px); transition:color .2s, border-color .2s;
}
.cla-back-link:hover{color:var(--gold-bright); border-color:var(--gold);}

.cla-hero{
  flex:0 0 auto; display:flex; flex-direction:column; align-items:center; text-align:center;
  gap:clamp(9px,1.8vh,18px); padding:clamp(14px,3vh,30px) clamp(14px,4vw,40px) clamp(9px,1.8vh,20px);
}
.cla-hero-icon{
  width:clamp(42px,7vh,64px); height:clamp(42px,7vh,64px);
  border-radius:50%; border:2px solid var(--gold);
  background:radial-gradient(circle at 35% 30%, rgba(255,229,102,0.4), rgba(212,175,55,0.15) 65%, transparent 100%);
  box-shadow:0 0 clamp(14px,2.6vh,22px) var(--gold-glow); display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.cla-hero-icon svg{width:56%; height:56%;}
.cla-hero-tag{
  font-family:'Cinzel',serif; font-weight:900; font-size:clamp(10.5px,1.5vh,13px); letter-spacing:2.2px;
  color:var(--gold-bright); background:rgba(212,175,55,0.12); border:1px solid var(--gold-dim);
  border-radius:100px; padding:clamp(6px,1vh,7px) clamp(14px,2.4vw,18px);
}
.cla-hero-title{
  font-family:'Cinzel Decorative',serif; font-weight:900; font-size:clamp(24px,5.6vh,52px);
  line-height:1.12; color:#fff; text-shadow:0 0 clamp(18px,3vh,30px) rgba(212,175,55,0.4); max-width:min(820px,90vw);
}
.cla-hero-title span{color:var(--gold-bright);}
.cla-hero-sub{
  font-family:'Crimson Text',serif; font-style:italic; font-size:clamp(13px,2vh,19px);
  color:var(--lilac); max-width:min(560px,88vw);
}
.cla-hero-meta{display:flex; align-items:center; gap:clamp(12px,2.6vw,30px); flex-wrap:wrap; justify-content:center; margin-top:2px;}
.cla-meta-item{display:flex; align-items:center; gap:clamp(5px,0.8vw,8px); font-family:'Nunito',sans-serif; font-size:clamp(12px,1.6vh,15px); color:rgba(255,255,255,0.85);}
.cla-meta-item b{color:var(--gold-bright); font-weight:800;}

.cla-cta-row{display:flex; align-items:center; gap:clamp(12px,2.4vw,20px); flex-wrap:wrap; justify-content:center; margin-top:clamp(4px,0.8vh,6px);}
.cla-cta-btn{
  font-family:'Cinzel',serif; font-weight:900; font-size:clamp(12.5px,1.7vh,16px); letter-spacing:0.4px; color:#1a0a2e;
  background:linear-gradient(90deg, var(--gold), var(--gold-bright)); border:none; border-radius:100px;
  padding:clamp(11px,1.8vh,17px) clamp(20px,3vw,36px); text-decoration:none; box-shadow:0 0 clamp(16px,2.6vh,24px) var(--gold-glow);
  display:inline-flex; align-items:center; gap:clamp(6px,1vw,9px); transition:transform .15s;
}
.cla-cta-btn:hover{transform:translateY(-1px);}
.cla-cta-btn-gestor{
  color:var(--gold-bright); background:transparent; border:1.5px solid var(--gold);
  box-shadow:none;
}
.cla-cta-btn-gestor:hover{background:rgba(212,175,55,0.1);}

.cla-path-grid{display:grid; grid-template-columns:1fr 1fr; gap:clamp(8px,1.6vh,16px);}
@media (max-width:600px){ .cla-path-grid{grid-template-columns:1fr;} }
.cla-path-card h3{display:flex; align-items:center; gap:clamp(6px,1vw,8px);}

.cla-lower{
  flex:1 1 auto; min-height:0; overflow:hidden;
  display:flex; flex-direction:column; justify-content:flex-end; gap:clamp(8px,1.8vh,18px);
  max-width:min(900px,94vw); width:100%; margin:0 auto; padding:0 clamp(14px,4vw,40px) clamp(14px,3vh,34px);
}
.cla-card{
  background:var(--dark-surface); border:1px solid var(--gold-dim); border-radius:clamp(12px,1.8vh,16px);
  padding:clamp(14px,2.4vh,24px) clamp(14px,2.4vw,26px);
}
.cla-card h3{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(13px,1.9vh,17px); color:#fff; margin-bottom:clamp(5px,1vh,10px);}
.cla-card p{font-family:'Crimson Text',serif; font-size:clamp(13px,1.85vh,17px); line-height:1.5; color:rgba(255,255,255,0.86);}

.cla-section-label{
  font-family:'Cinzel',serif; font-weight:900; font-size:clamp(11.5px,1.6vh,14.5px); letter-spacing:0.4px;
  color:#fff; display:flex; align-items:center; gap:clamp(6px,1vw,8px); margin-bottom:clamp(5px,1vh,10px);
}
.cla-section-label::before{content:""; width:3px; height:clamp(12px,1.8vh,14px); background:var(--gold); border-radius:2px; display:inline-block; flex-shrink:0;}
.cla-material-item{
  display:flex; align-items:center; justify-content:space-between; gap:clamp(8px,1.6vw,12px);
  padding:clamp(11px,1.8vh,16px) clamp(12px,1.8vw,20px); border-radius:clamp(10px,1.6vh,12px);
  background:rgba(212,175,55,0.07); border:1px solid var(--gold-dim);
  text-decoration:none; color:#fff; transition:background .2s, border-color .2s;
}
.cla-material-item:hover{background:rgba(212,175,55,0.13); border-color:var(--gold);}
.cla-material-left{display:flex; align-items:center; gap:clamp(8px,1.6vw,12px); min-width:0;}
.cla-material-icon{
  width:clamp(30px,4.6vh,38px); height:clamp(30px,4.6vh,38px); border-radius:clamp(7px,1.2vh,9px); flex-shrink:0;
  background:linear-gradient(160deg, rgba(212,175,55,0.3), rgba(124,58,237,0.2));
  display:flex; align-items:center; justify-content:center; font-size:clamp(14px,2vh,17px); border:1px solid var(--gold-dim);
}
.cla-material-title{font-family:'Cinzel',serif; font-weight:700; font-size:clamp(12.5px,1.7vh,15px);}
.cla-material-cta{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(10px,1.35vh,12px); letter-spacing:0.6px; color:var(--gold-bright); white-space:nowrap;}
`;

function generarEstrellas() {
  const n = window.innerWidth < 760 ? 30 : 60;
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push({
      id: i,
      size: (Math.random() * 1.6 + 0.6).toFixed(1),
      top: (Math.random() * 70).toFixed(1),
      left: (Math.random() * 100).toFixed(1),
      dur: (Math.random() * 4 + 3).toFixed(1),
      delay: (Math.random() * 4).toFixed(1),
      min: (Math.random() * 0.4 + 0.15).toFixed(2),
    });
  }
  return arr;
}

export default function CaminoLandingPage() {
  const [estrellas, setEstrellas] = useState([]);

  useEffect(() => {
    setEstrellas(generarEstrellas());
  }, []);

  return (
    <div className="cla-root">
      <style>{styles}</style>

      <div className="cla-hero-bg">
        <svg className="cla-temple-silhouette" viewBox="0 0 1400 420" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
          <polygon points="700,10 1000,140 400,140" fill="#D4AF37"/>
          <rect x="430" y="145" width="34" height="260" fill="#D4AF37"/>
          <rect x="520" y="145" width="34" height="260" fill="#D4AF37"/>
          <rect x="610" y="145" width="34" height="260" fill="#D4AF37"/>
          <rect x="700" y="145" width="34" height="260" fill="#FFE566"/>
          <rect x="790" y="145" width="34" height="260" fill="#D4AF37"/>
          <rect x="880" y="145" width="34" height="260" fill="#D4AF37"/>
          <rect x="970" y="145" width="34" height="260" fill="#D4AF37"/>
          <rect x="380" y="400" width="640" height="20" fill="#D4AF37"/>
          <circle cx="700" cy="65" r="16" fill="#04020e"/>
        </svg>
      </div>
      <div className="cla-stars">
        {estrellas.map(s => (
          <div
            key={s.id}
            className="cla-star"
            style={{
              width: `${s.size}px`, height: `${s.size}px`,
              top: `${s.top}%`, left: `${s.left}%`,
              '--d': `${s.dur}s`, '--del': `${s.delay}s`, '--min': s.min,
            }}
          />
        ))}
      </div>

      <div className="cla-page">

        {/* ⚠️ PENDIENTE: sigue apuntando a "#" — dime a dónde debe ir realmente (¿/hub? ¿tu sitio principal?) */}
        <a className="cla-back-link" href="#">← Templo del Propósito</a>

        <div className="cla-hero">
          <div className="cla-hero-icon">
            <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <polygon points="32,6 54,20 10,20" fill="#FFE566"/>
              <rect x="12" y="22" width="4.5" height="26" fill="#D4AF37"/>
              <rect x="22" y="22" width="4.5" height="26" fill="#FFE566"/>
              <rect x="32" y="22" width="4.5" height="26" fill="#D4AF37"/>
              <rect x="42" y="22" width="4.5" height="26" fill="#FFE566"/>
              <rect x="9" y="48" width="46" height="4.5" fill="#FFE566"/>
            </svg>
          </div>
          <div className="cla-hero-tag">CONSTANCIA · LIDERAZGO</div>
          <h1 className="cla-hero-title">Camino a <span>Líder Digital</span></h1>
          <div className="cla-hero-sub">Un camino de constancia en contenido y venta por redes sociales</div>
          <div className="cla-hero-meta">
            <div className="cla-meta-item">📅 <b>30–60 días</b> a tu ritmo</div>
            <div className="cla-meta-item">🔥 empieza en cuanto entras al equipo</div>
          </div>
          <div className="cla-cta-row">
            <Link className="cla-cta-btn" to="/camino/participante/login">🎯 Soy Líder Digital</Link>
            <Link className="cla-cta-btn cla-cta-btn-gestor" to="/camino/gestor/login">⚜️ Soy gestor</Link>
          </div>
        </div>

        <div className="cla-lower">
          <div className="cla-path-grid">
            <div className="cla-card cla-path-card">
              <h3>🎯 Soy Líder Digital</h3>
              <p>Entra a registrar tu evidencia de contenido y avanzar en tu Camino de capacitación.</p>
            </div>
            <div className="cla-card cla-path-card">
              <h3>⚜️ Soy gestor</h3>
              <p>Acepta interesados, genera sus accesos y guía a tus Líderes Digitales.</p>
            </div>
          </div>
          <div>
            <div className="cla-section-label">Material del camino</div>
            <a className="cla-material-item" href="/bases-camino.html">
              <div className="cla-material-left">
                <div className="cla-material-icon">📜</div>
                <div className="cla-material-title">Las Bases del Camino</div>
              </div>
              <div className="cla-material-cta">ABRIR →</div>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}