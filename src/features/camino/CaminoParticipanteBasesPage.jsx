import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function CaminoParticipanteBasesPage() {
  const navigate = useNavigate();

  const stars = useMemo(() => {
    const n = typeof window !== "undefined" && window.innerWidth < 760 ? 30 : 60;
    return Array.from({ length: n }, () => ({
      size: (Math.random() * 1.5 + 0.6).toFixed(1),
      top: (Math.random() * 100).toFixed(1),
      left: (Math.random() * 100).toFixed(1),
      dur: (Math.random() * 4 + 3).toFixed(1),
      delay: (Math.random() * 4).toFixed(1),
      min: (Math.random() * 0.4 + 0.15).toFixed(2),
    }));
  }, []);

  useEffect(() => {
    const links = [
      "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap&font-display=swap",
      "https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap&font-display=swap",
    ];
    const created = links.map((href) => {
      const el = document.createElement("link");
      el.rel = "stylesheet";
      el.href = href;
      document.head.appendChild(el);
      return el;
    });
    return () => created.forEach((el) => document.head.removeChild(el));
  }, []);

  return (
    <div className="bases-camino-page">
      <style>{CSS}</style>

      <div className="stars">
        {stars.map((s, i) => (
          <div
            key={i}
            className="star"
            style={{
              width: `${s.size}px`,
              height: `${s.size}px`,
              top: `${s.top}%`,
              left: `${s.left}%`,
              "--d": `${s.dur}s`,
              "--del": `${s.delay}s`,
              "--min": s.min,
            }}
          />
        ))}
      </div>

      <nav className="topnav">
        <div className="brand">
          <svg className="brand-seal temple-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <polygon points="32,4 58,22 6,22" className="gold" />
            <rect x="9" y="24" width="5" height="30" className="gold-mid" />
            <rect x="20" y="24" width="5" height="30" className="gold-mid" />
            <rect x="29.5" y="24" width="5" height="30" className="gold" />
            <rect x="39" y="24" width="5" height="30" className="gold-mid" />
            <rect x="50" y="24" width="5" height="30" className="gold-mid" />
            <rect x="6" y="54" width="52" height="5" className="gold" />
            <circle cx="32" cy="13" r="2.6" fill="#04020e" />
          </svg>
          <div className="brand-name">TEMPLO <span>DEL PROPÓSITO</span></div>
        </div>
        <div className="nav-links">
          <button className="nav-item" onClick={() => navigate('/camino/participante/home')}>Inicio</button>
          <button className="nav-item" onClick={() => navigate('/camino/participante/panel')}>Check-in</button>
          <button className="nav-item" onClick={() => navigate('/camino/participante/calendario')}>Calendario</button>
          <button className="nav-item" onClick={() => navigate('/camino/participante/pasaporte')}>Pasaporte del Templario</button>
          <span className="nav-item" style={{ opacity: 0.4, cursor: 'default' }}>Sala de Cowork</span>
          <span className="nav-item" style={{ opacity: 0.4, cursor: 'default' }}>Ranking</span>
        </div>
        <select className="nav-select">
          <option>Camino a Líder Digital · Gen. Agosto</option>
        </select>
      </nav>

      <div className="wrap">
        <button className="back-link" onClick={() => navigate('/camino/participante/home')}>← Camino a Líder Digital</button>
        <div className="badge">📜 BASES DEL CAMINO</div>
        <h1 className="title">Las bases de tu <span>Camino a Líder Digital</span></h1>
        <p className="lede">
          Todo lo que necesitas para avanzar: qué esperamos de ti, cómo funciona el día a día, cómo se mide tu
          constancia, qué desbloqueas y las reglas del juego. Guarda esta página — vas a volver a ella durante todo
          tu camino.
        </p>

        {/* 1 · EL MODELO */}
        <div className="sec-eyebrow"><span className="num">1</span>EL MODELO</div>
        <h2 className="sec-title">Qué es este camino</h2>
        <div className="quote-card">
          <p>"Cada día apareces y dejas huella. Cada semana das un paso de venta. Al final, tú y tu líder deciden si esto se vuelve tu siguiente nivel."</p>
        </div>
        <table>
          <thead><tr><th>No es</th><th>Sí es</th></tr></thead>
          <tbody>
            <tr><td className="no">Un reto con fecha de cierre dura</td><td className="yes">Un camino de validación, entre 30 y 60 días</td></tr>
            <tr><td className="no">Puntos ni rankings de vanidad</td><td className="yes">Seguidores ganados + ventas registradas</td></tr>
            <tr><td className="no">Otra tarea más en tu lista</td><td className="yes">Tu guion y formato del día, resueltos hoy y en mejora continua junto contigo</td></tr>
          </tbody>
        </table>

        <hr className="divider" />

        {/* 2 · EL RITMO */}
        <div className="sec-eyebrow"><span className="num">2</span>EL RITMO</div>
        <h2 className="sec-title">Cómo funciona el día a día</h2>
        <div className="field">
          <div className="field-label">El calendario</div>
          <div className="field-text">Fase por fase, tu guía te dice qué publicar: el tipo de pieza, el formato, la idea con su gancho, una referencia real y, casi siempre, su propio tutorial corto.</div>
        </div>
        <div className="field">
          <div className="field-label">El check-in</div>
          <div className="field-text">Todos los días subes tu evidencia de que publicaste — foto o captura. Es el piso: sin evidencia no cuenta. Si ese día vendiste, lo registras ahí mismo.</div>
        </div>
        <div className="field">
          <div className="field-label">El paso de la semana</div>
          <div className="field-text">Un paso de avance por semana. Aparece el lunes de su semana y lo ves directo en tu tablero de Hoy. Se registra con el check-in del día en que cae — no hay subida aparte.</div>
        </div>

        <hr className="divider" />

        {/* 3 · EL TABLERO */}
        <div className="sec-eyebrow"><span className="num">3</span>EL TABLERO</div>
        <h2 className="sec-title">Cómo se mide tu avance</h2>
        <p className="body-text">
          Tu tablero ordena por <b>seguidores ganados</b> (tu conteo final menos tu conteo inicial). Si hay empate,
          decide tu racha de check-ins. Lo que vendes viaja como columna de apoyo: se ve, pero no decide el orden —
          esto no es una competencia entre ustedes, es tu propia línea de progreso frente a tu punto de partida.
        </p>

        <hr className="divider" />

        {/* 4 · LA RECOMPENSA */}
        <div className="sec-eyebrow"><span className="num">4</span>LA RECOMPENSA</div>
        <h2 className="sec-title">Qué desbloqueas</h2>
        <table>
          <thead><tr><th>Logro</th><th>Check-ins</th><th>Pasos semanales</th><th>Qué desbloquea</th></tr></thead>
          <tbody>
            <tr><td className="hl">⭐ Camino Completo</td><td>90%+ de días</td><td>Todos cumplidos</td><td>Pasas a liderazgo formal dentro del Templo</td></tr>
            <tr><td className="hl">✓ Camino Validado</td><td>70%+ de días</td><td>La mayoría cumplidos</td><td>Sigues en el programa, con revisión personal de tu líder</td></tr>
          </tbody>
        </table>
        <p className="body-text">Sin tu métrica final registrada no hay revisión ni Camino Completo, aunque tengas todos tus check-ins.</p>

        <hr className="divider" />

        {/* 5 · REGLAS */}
        <div className="sec-eyebrow"><span className="num">5</span>LO OBLIGATORIO</div>
        <h2 className="sec-title">Reglas</h2>
        <ul className="rules">
          <li><span className="dot"></span><span className="txt"><b>Puerta de entrada.</b> Antes de usar tu tablero, registras tus seguidores actuales + una captura que lo respalde. Sin eso el panel queda bloqueado — es lo que fija tu línea base.</span></li>
          <li><span className="dot"></span><span className="txt"><b>Puerta de cierre.</b> Al terminar tu camino, pedimos tus seguidores finales + una captura. Sin eso no hay revisión ni Camino Completo, aunque tengas todos tus check-ins.</span></li>
          <li><span className="dot"></span><span className="txt"><b>Si un día se te pasa.</b> No quedas fuera: puedes registrarlo después como entrega tardía y seguir sumando. Para Camino Completo necesitas el 90%+; para Camino Validado te basta con el 70%.</span></li>
          <li><span className="dot"></span><span className="txt"><b>Evidencia obligatoria.</b> Cada check-in necesita su foto o captura — es el piso, sin evidencia no cuenta. Puedes subir hasta 5 archivos por check-in.</span></li>
        </ul>

        <hr className="divider" />

        {/* 6 · EL CALENDARIO */}
        <div className="sec-eyebrow"><span className="num">6</span>EL CALENDARIO</div>
        <h2 className="sec-title">Las fases de tu camino</h2>
        <p className="body-text">Tu camino corre entre 30 y 60 días, organizado en 4 fases. Tu líder define contigo cuándo cierra cada una según tu ritmo.</p>
        <div className="phase-grid">
          <div className="phase-card">
            <div className="phase-num">FASE 1</div>
            <div className="phase-name">Cimiento</div>
            <div className="phase-focus">Aparecer y encontrar tu voz frente a tu audiencia.</div>
            <div className="phase-upload">Captura de pieza publicada</div>
          </div>
          <div className="phase-card">
            <div className="phase-num">FASE 2</div>
            <div className="phase-name">Atracción</div>
            <div className="phase-focus">Secuencias de contenido que generan interés real.</div>
            <div className="phase-upload">Captura de secuencia</div>
          </div>
          <div className="phase-card">
            <div className="phase-num">FASE 3</div>
            <div className="phase-name">Prueba social</div>
            <div className="phase-focus">Documentar y publicar tus propios resultados.</div>
            <div className="phase-upload">Captura de pieza publicada</div>
          </div>
          <div className="phase-card">
            <div className="phase-num">FASE 4</div>
            <div className="phase-name">Cierre</div>
            <div className="phase-focus">Oferta directa a tu lista caliente.</div>
            <div className="phase-upload">Captura de conversación</div>
          </div>
        </div>

        <div className="cta-row">
          <div className="cta-text">¿Lista para empezar tu camino?</div>
          <button className="cta-btn" onClick={() => navigate('/camino/participante/home')}>Ir a mi camino →</button>
        </div>
      </div>
    </div>
  );
}

// CSS original del HTML, sin cambios de diseño — solo se movió a un template string y se scopeó bajo .bases-camino-page
const CSS = `
.bases-camino-page{
  --gold:#D4AF37; --gold-bright:#FFE566; --gold-dim:rgba(212,175,55,0.4); --gold-glow:rgba(212,175,55,0.65);
  --dark-bg:#04020e; --dark-surface:rgba(10,5,32,0.92); --dark-surface-2:rgba(16,8,40,0.75);
  --purple:#CC44FF; --green:#44FF88;
  --lilac:rgba(200,185,240,0.72); --lilac-dim:rgba(200,185,240,0.45);
  min-height:100vh; width:100%;
  background:
    radial-gradient(ellipse 120% 45% at 50% 0%, rgba(40,10,90,0.85) 0%, transparent 60%),
    radial-gradient(ellipse 60% 30% at 10% 20%, rgba(10,40,100,0.3) 0%, transparent 55%),
    radial-gradient(ellipse 60% 30% at 90% 15%, rgba(80,10,110,0.3) 0%, transparent 55%),
    linear-gradient(180deg,#050215 0%,#0a0530 14%,#08031c 40%,#04020e 100%);
  font-family:'Crimson Text',serif; color:#fff; position:relative;
}
.bases-camino-page *,.bases-camino-page *::before,.bases-camino-page *::after{box-sizing:border-box;}
.bases-camino-page .stars{position:fixed; inset:0; pointer-events:none; z-index:0;}
.bases-camino-page .star{position:absolute; border-radius:50%; background:#fff; animation:bc-twinkle var(--d) ease-in-out infinite; animation-delay:var(--del);}
@keyframes bc-twinkle{0%,100%{opacity:var(--min);} 50%{opacity:1;}}
@media (prefers-reduced-motion: reduce){ .bases-camino-page *{animation:none !important; transition:none !important;} }
.bases-camino-page .temple-icon .gold{stroke:var(--gold-bright); fill:var(--gold-bright);}
.bases-camino-page .temple-icon .gold-mid{stroke:var(--gold); fill:var(--gold);}

.bases-camino-page .topnav{
  position:sticky; top:0; z-index:50;
  display:flex; align-items:center; justify-content:space-between; gap:14px;
  padding:12px 26px;
  background:linear-gradient(180deg, rgba(6,3,18,0.97), rgba(6,3,18,0.9));
  border-bottom:1px solid var(--gold-dim); backdrop-filter:blur(10px);
  flex-wrap:wrap;
}
.bases-camino-page .brand{display:flex; align-items:center; gap:10px;}
.bases-camino-page .brand-seal{width:32px; height:32px; flex-shrink:0; filter:drop-shadow(0 0 8px var(--gold-glow));}
.bases-camino-page .brand-name{font-family:'Cinzel',serif; font-weight:900; letter-spacing:1px; font-size:17px; color:#fff;}
.bases-camino-page .brand-name span{color:var(--gold);}
.bases-camino-page .nav-links{display:flex; align-items:center; gap:22px; flex-wrap:wrap;}
.bases-camino-page .nav-item{
  font-family:'Cinzel',serif; font-size:13.5px; font-weight:700; letter-spacing:0.3px;
  color:var(--lilac); text-decoration:none; background:none; border:none; cursor:pointer;
  white-space:nowrap; opacity:0.85; transition:opacity .2s, color .2s;
}
.bases-camino-page .nav-item:hover{opacity:1; color:var(--gold-bright);}
.bases-camino-page .nav-select{
  font-family:'Cinzel',serif; font-size:13px; font-weight:700;
  color:#fff; background:rgba(212,175,55,0.1); border:1px solid var(--gold-dim);
  border-radius:8px; padding:8px 14px; white-space:nowrap;
}
@media (max-width:820px){ .bases-camino-page .nav-links{display:none;} .bases-camino-page .nav-select{margin-left:auto;} }

.bases-camino-page .wrap{max-width:880px; margin:0 auto; padding:44px 24px 90px; position:relative; z-index:1;}

.bases-camino-page .back-link{
  display:inline-flex; align-items:center; gap:8px;
  font-family:'Cinzel',serif; font-weight:700; font-size:13px; letter-spacing:0.3px;
  color:var(--lilac); text-decoration:none; background:none; border:none; cursor:pointer;
  margin-bottom:20px; transition:color .2s; padding:0;
}
.bases-camino-page .back-link:hover{color:var(--gold-bright);}

.bases-camino-page .badge{
  display:inline-flex; align-items:center; gap:8px;
  font-family:'Cinzel',serif; font-weight:900; font-size:11.5px; letter-spacing:2px;
  color:var(--gold-bright); background:rgba(212,175,55,0.1); border:1px solid var(--gold-dim);
  border-radius:100px; padding:7px 16px; margin-bottom:20px;
}

.bases-camino-page h1.title{
  font-family:'Cinzel Decorative',serif; font-weight:900; font-size:clamp(28px,4.6vw,44px);
  line-height:1.15; color:#fff; text-shadow:0 0 24px rgba(212,175,55,0.3); margin-bottom:18px;
}
.bases-camino-page .title span{color:var(--gold-bright);}

.bases-camino-page .lede{font-family:'Crimson Text',serif; font-size:18px; line-height:1.65; color:rgba(255,255,255,0.88); max-width:700px; margin-bottom:36px;}
.bases-camino-page .lede b{color:var(--gold-bright); font-weight:600;}

.bases-camino-page hr.divider{border:none; height:1px; background:linear-gradient(90deg, var(--gold-dim), transparent); margin:40px 0 32px;}

.bases-camino-page .sec-eyebrow{
  font-family:'Cinzel',serif; font-weight:900; font-size:12.5px; letter-spacing:2px; color:var(--gold);
  display:flex; align-items:center; gap:10px; margin-bottom:8px;
}
.bases-camino-page .sec-eyebrow .num{
  width:26px; height:26px; border-radius:50%; border:1px solid var(--gold-dim);
  display:flex; align-items:center; justify-content:center; font-size:12px; color:var(--gold-bright);
}
.bases-camino-page h2.sec-title{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(22px,3vw,28px); color:#fff; margin-bottom:20px;}

.bases-camino-page .quote-card{
  background:var(--dark-surface); border:1px solid var(--gold-dim); border-left:3px solid var(--gold);
  border-radius:12px; padding:24px 26px; margin-bottom:24px;
}
.bases-camino-page .quote-card p{font-family:'Cinzel',serif; font-weight:700; font-size:clamp(17px,2vw,20px); line-height:1.5; color:#fff;}

.bases-camino-page p.body-text{font-family:'Crimson Text',serif; font-size:17px; line-height:1.65; color:rgba(255,255,255,0.85); margin-bottom:22px;}
.bases-camino-page p.body-text b{color:var(--gold-bright); font-weight:600;}
.bases-camino-page p.body-text:last-child{margin-bottom:0;}

.bases-camino-page .field{margin-bottom:20px;}
.bases-camino-page .field-label{font-family:'Cinzel',serif; font-weight:900; font-size:14px; color:var(--gold-bright); margin-bottom:6px;}
.bases-camino-page .field-text{font-family:'Crimson Text',serif; font-size:16.5px; line-height:1.6; color:rgba(255,255,255,0.85);}

.bases-camino-page table{width:100%; border-collapse:collapse; margin-bottom:24px; border-radius:12px; overflow:hidden; border:1px solid var(--gold-dim);}
.bases-camino-page thead th{
  font-family:'Cinzel',serif; font-weight:900; font-size:11.5px; letter-spacing:1px; text-transform:uppercase;
  color:var(--gold-bright); background:rgba(212,175,55,0.1); text-align:left; padding:14px 18px;
}
.bases-camino-page tbody td{
  font-family:'Nunito',sans-serif; font-size:14.5px; line-height:1.5; color:rgba(255,255,255,0.9);
  padding:16px 18px; border-top:1px solid rgba(212,175,55,0.15); background:var(--dark-surface-2);
}
.bases-camino-page tbody tr:nth-child(even) td{background:rgba(16,8,40,0.5);}
.bases-camino-page td.hl{color:var(--gold-bright); font-weight:700; font-family:'Nunito',sans-serif;}
.bases-camino-page td.no{color:rgba(255,120,120,0.85);}
.bases-camino-page td.yes{color:var(--green);}

.bases-camino-page ul.rules{list-style:none;}
.bases-camino-page ul.rules li{
  display:flex; gap:14px; padding:16px 0; border-top:1px solid rgba(212,175,55,0.12);
}
.bases-camino-page ul.rules li:first-child{border-top:none;}
.bases-camino-page ul.rules li .dot{
  width:8px; height:8px; border-radius:50%; background:var(--gold); flex-shrink:0; margin-top:9px; box-shadow:0 0 8px var(--gold-glow);
}
.bases-camino-page ul.rules li .txt{font-family:'Crimson Text',serif; font-size:16.5px; line-height:1.6; color:rgba(255,255,255,0.85);}
.bases-camino-page ul.rules li .txt b{color:var(--gold-bright); font-weight:600;}

.bases-camino-page .phase-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:8px;}
@media (max-width:700px){ .bases-camino-page .phase-grid{grid-template-columns:1fr 1fr;} }
@media (max-width:460px){ .bases-camino-page .phase-grid{grid-template-columns:1fr;} }
.bases-camino-page .phase-card{
  background:var(--dark-surface); border:1px solid var(--gold-dim); border-radius:12px; padding:18px 16px;
}
.bases-camino-page .phase-num{font-family:'Cinzel',serif; font-weight:900; font-size:11px; letter-spacing:1.5px; color:var(--gold); margin-bottom:6px;}
.bases-camino-page .phase-name{font-family:'Cinzel',serif; font-weight:700; font-size:15px; color:#fff; margin-bottom:8px;}
.bases-camino-page .phase-focus{font-family:'Nunito',sans-serif; font-size:12.5px; line-height:1.5; color:var(--lilac); margin-bottom:10px;}
.bases-camino-page .phase-upload{
  font-family:'Nunito',sans-serif; font-size:11.5px; font-weight:700; color:var(--gold-bright);
  background:rgba(212,175,55,0.1); border:1px solid var(--gold-dim); border-radius:100px; padding:5px 10px; display:inline-block;
}

.bases-camino-page .cta-row{
  display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap;
  margin-top:16px; padding:28px; border-radius:16px;
  background:linear-gradient(160deg, rgba(212,175,55,0.1), rgba(124,58,237,0.08));
  border:1px solid var(--gold-dim);
}
.bases-camino-page .cta-text{font-family:'Cinzel',serif; font-weight:700; font-size:18px; color:#fff;}
.bases-camino-page .cta-btn{
  font-family:'Cinzel',serif; font-weight:900; font-size:14px; letter-spacing:0.5px; color:#1a0a2e;
  background:linear-gradient(90deg, var(--gold), var(--gold-bright)); border:none; border-radius:100px;
  padding:14px 30px; cursor:pointer; box-shadow:0 0 22px var(--gold-glow); white-space:nowrap;
}
`;