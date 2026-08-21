import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// =====================================================================
// CalendarioCaminoPage.jsx
// Conversión 1:1 de public/pages/calendario-camino.html a componente React.
// Todo el contenido (28 días, textos, semanas bloqueadas) es el mismo que
// tenías en el HTML — no se inventó ni se quitó ningún día.
//
// NOTA IMPORTANTE (léela antes de pegar):
// El HTML original enlazaba a otras páginas estáticas con <a href="...html">
// (camino-templario.html, pasaporte-templario.html). Como no sé si esas
// páginas ya existen como rutas de React (con react-router) o siguen siendo
// .html sueltos, dejé esos links tal cual (<a href="...">) para que NO se
// rompa nada al pegarlo. Si ya tienes esas páginas como rutas de React,
// avísame y te paso la versión con <Link to="..."> de react-router-dom.
// =====================================================================

const WEEKS = [
  {
    title: "Semana 1",
    phase: "Fase · Cimiento",
    range: "Día 1 – 7",
    days: [
      { day: 1, badge: "reel", format: "Ranking", desc: "Presentas una lista ordenada de opciones dentro de tu tema (de peor a mejor, o al revés) y das tu veredicto final sobre cuál gana." },
      { day: 2, badge: "reel", format: "Versus", desc: "Enfrentas dos opciones, ideas o caminos cara a cara y muestras con evidencia por qué uno le gana al otro." },
      { day: 3, badge: "carrusel", format: "Niveles / Etapas", desc: "Cuentas tu historia personal como una escalera de etapas — de dónde partiste, qué cambió en cada nivel, dónde estás hoy." },
      { day: 4, badge: "reel", format: "Frente a cámara", desc: "Le hablas directo a la cámara comparando situaciones o herramientas, una tras otra, con un mismo hilo conductor." },
      { day: 5, badge: "reel", format: "Fórmula", desc: "Le das a tu audiencia un cálculo simple y accionable: toma un dato que ya tiene, aplícale una operación, y obtén un resultado revelador." },
      { day: 6, badge: "carrusel", format: "Storytelling B-Roll", desc: "Narras tu historia de transformación apoyada en imágenes de tu propio proceso — el antes, el momento de quiebre, el después." },
      { day: 7, badge: "reel", format: "Pizarra", desc: "Explicas un concepto clave escribiéndolo en vivo sobre una pizarra o pantalla, como si dieras una clase corta." },
    ],
  },
  {
    title: "Semana 2",
    phase: "Fase · Cimiento",
    range: "Día 8 – 14",
    days: [
      { day: 8, badge: "reel", format: "Post-it / Pizarra", desc: "Usas notas escritas a mano que vas revelando una por una para construir la idea completa frente al espectador." },
      { day: 9, badge: "reel", format: "Explicación con objeto", desc: "Usas un objeto físico como referencia visual para explicar qué pasa si tu audiencia repite una acción pequeña de forma constante." },
      { day: 10, badge: "carrusel", format: "Carteles", desc: "Desmontas una creencia común de tu nicho con un giro inesperado, cartel por cartel." },
      { day: 11, badge: "reel", format: "Versus textual", desc: "Contrastas en pantalla dividida una excusa típica de tu audiencia contra tu respuesta directa y sin filtro." },
      { day: 12, badge: "reel", format: "Sketch", desc: "Actúas una escena corta mostrando errores comunes que NUNCA debería cometer alguien de tu área durante un momento clave." },
      { day: 13, badge: "carrusel", format: "Comparación", desc: "Comparas dos caminos difíciles y demuestras con claridad cuál de los dos realmente vale la pena elegir." },
      { day: 14, badge: "reel", format: "Frecuencia / Lista", desc: "Entregas una selección de tips poco conocidos que sí funcionan para el resultado que tu audiencia más desea." },
    ],
  },
  {
    title: "Semana 3",
    phase: "Fase · Atracción",
    range: "Día 15 – 21",
    days: [
      { day: 15, badge: "reel", format: "Carteles", desc: "Otro giro del formato de carteles, esta vez enfocado en una idea distinta de tu nicho." },
      { day: 16, badge: "reel", format: "Reto en tiempo", desc: "Lanzas un pequeño desafío interactivo con una regla clara y un límite de tiempo, invitando a tu audiencia a participar." },
      { day: 17, badge: "carrusel", format: "Galería Premium", desc: "Compartes una selección curada de recursos o recomendaciones enfocadas en un resultado específico." },
      { day: 18, badge: "reel", format: "Frente a cámara", desc: "Hablas directo con un gancho textual fuerte que abre el video desde el segundo cero." },
      { day: 19, badge: "reel", format: "Versus textual", desc: "Pantalla dividida mostrando la acción recomendada contra la acción que hay que evitar, con etiquetas visibles todo el video." },
      { day: 20, badge: "carrusel", format: "Comparación", desc: "Inviatas a dejar de hacer algo que parece necesario, para empezar a hacer lo que realmente mueve el resultado." },
      { day: 21, badge: "reel", format: "B-roll narrado", desc: "Con imágenes de apoyo, dejas claro que a nadie externo le importa qué tan rápido logres tu meta — solo a ti." },
    ],
  },
  {
    title: "Semana 4",
    phase: "Fase · Atracción",
    range: "Día 22 – 28",
    days: [
      { day: 22, badge: "reel", format: "Sketch", desc: "Muestras qué se pierde tu audiencia si no aplica una acción o herramienta clave que tú ya dominas." },
      { day: 23, badge: "reel", format: "Frente a cámara", desc: "Respondes una duda inusual de tu nicho con un \"sí, y además...\" que abre una oportunidad que casi nadie ve." },
      { day: 24, badge: "carrusel", format: "Carteles", desc: "Presentas tu filosofía o concepto insignia junto con los principios clave de tu estilo de trabajo, cerrando con tu oferta." },
      { day: 25, badge: "reel", format: "Versus + pizarra en blanco", desc: "Arrancas con un gancho puramente visual antes de decir una sola palabra." },
      { day: 26, badge: "reel", format: "Pantalla dividida + pizarra digital", desc: "Desenmascaras algo que parece virtuoso pero en realidad es un error común que casi todos cometen." },
      { day: 27, badge: "carrusel", format: "Escalas / Timeline", desc: "Cuentas un proceso de transformación a lo largo del tiempo, con evidencia y un cierre que invita a la acción." },
      { day: 28, badge: "reel", format: "Pantalla verde", desc: "Muestras cómo era antes un método o proceso, cómo funciona ahora, y quién lo está ejecutando mejor hoy." },
    ],
  },
];

const BADGE_META = {
  reel: { icon: "🎬", label: "REEL" },
  carrusel: { icon: "📑", label: "CARRUSEL" },
};

const PHASE_ICONS = {
  "Fase · Cimiento": "🏛️",
  "Fase · Atracción": "🧲",
  "Fase · Prueba social": "🔥",
  "Fase · Cierre": "🏆",
};

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="var(--gold-bright)">
      <polygon points="6,3 21,12 6,21" />
    </svg>
  );
}

function DayCard({ day, badge, format, desc }) {
  const meta = BADGE_META[badge];
  return (
    <div className="day-card">
      <div className="day-top">
        <div className="day-label">DÍA {day}</div>
        <div className={`format-badge ${badge}`}>
          {meta.icon} {meta.label}
        </div>
      </div>
      <div className="day-format">{format}</div>
      <div className="day-desc">{desc}</div>
      <div className="day-thumb pending">
        <div className="play-btn">
          <PlayIcon />
        </div>
        <div className="thumb-pending-label">🔒 Miniatura se genera al subir el video</div>
      </div>
      <div className="tutorial-btn">
        <span>▶ VER TUTORIAL</span>
        <span>↗</span>
      </div>
    </div>
  );
}

function LockedWeek({ title }) {
  return (
    <div className="locked-week">
      <div className="locked-left">
        <div className="locked-icon">🔒</div>
        <div className="locked-txt">
          <b>{title.heading}</b>
          <span>{title.body}</span>
        </div>
      </div>
      <div className="locked-cta">Se arma al llegar →</div>
    </div>
  );
}

export default function CalendarioCaminoPage() {
  const navigate = useNavigate();
  // Genera las estrellas del fondo, igual que el <script> del HTML original
  const stars = useMemo(() => {
    const n = typeof window !== "undefined" && window.innerWidth < 760 ? 40 : 80;
    return Array.from({ length: n }, () => ({
      size: (Math.random() * 1.5 + 0.6).toFixed(1),
      top: (Math.random() * 100).toFixed(1),
      left: (Math.random() * 100).toFixed(1),
      dur: (Math.random() * 4 + 3).toFixed(1),
      delay: (Math.random() * 4).toFixed(1),
      min: (Math.random() * 0.4 + 0.15).toFixed(2),
    }));
  }, []);

  // Carga las fuentes de Google Fonts que usaba el <head> del HTML original
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
    <div className="calendario-camino-page">
      <style>{CSS}</style>

      <div className="cc-bg-fx">
        <div className="cc-tone-layer"></div>
        <div className="cc-orb cc-orb-gold"></div>
        <div className="cc-orb cc-orb-purple"></div>
        <div className="cc-orb cc-orb-teal"></div>
      </div>

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
          <div className="brand-name">
            TEMPLO <span>DEL PROPÓSITO</span>
          </div>
        </div>
        <div className="nav-links">
          <button className="nav-item" onClick={() => navigate('/camino/participante/home')}>Inicio</button>
          <button className="nav-item" onClick={() => navigate('/camino/participante/panel')}>Check-in</button>
          <span className="nav-item active">Calendario</span>
          <button className="nav-item" onClick={() => navigate('/camino/participante/pasaporte')}>Pasaporte del Templario</button>
          <button className="nav-item" onClick={() => navigate('/camino/participante/ranking')}>Ranking</button>
        </div>
        <select className="nav-select">
          <option>Camino a Líder Digital · Gen. Agosto</option>
        </select>
      </nav>

      <div className="cc-hero">
        <div className="cc-hero-inner">
          <div className="header-row cc-hero-header">
            <div className="header-icon">🗓️</div>
            <div>
              <div className="eyebrow-tag">TU RUTA DE CONTENIDO</div>
              <h1 className="page-title">Calendario del Camino</h1>
            </div>
          </div>
        </div>
        <div className="cc-hero-mascot"></div>
      </div>

      <div className="wrap cc-wrap-with-mascot">
        <div className="cc-story">
          <div className="cc-story-ornament">✦</div>
          <p className="page-sub">
            Lo que te toca publicar cada día: formato, gancho e idea completa. Empieza en tu{" "}
            <b style={{ color: "var(--gold-bright)" }}>Día 1</b> el día que arrancas — no importa la fecha del
            calendario, todos los templarios recorren la misma ruta.
          </p>
        </div>

        <div className="progress-strip">
          <div className="txt">
            Plan mínimo: <b>28 días</b> (Cimiento + Atracción). Si decides continuar, el camino sigue hasta el{" "}
            <b>Día 60</b> (Prueba social + Cierre).
          </div>
          <div className="milestone-pill">Día 1 = tu fecha de inicio</div>
        </div>

        {WEEKS.map((week) => (
          <div className="week-block" key={week.title}>
            <div className="week-head">
              <div className="week-medal">{PHASE_ICONS[week.phase] || "⚜️"}</div>
              <div>
                <div className="week-title">{week.title}</div>
                <div className="week-phase-row">
                  <span className="week-phase">{week.phase}</span>
                  <span className="week-range">{week.range}</span>
                </div>
              </div>
            </div>
            <div className="cc-timeline">
              {week.days.map((d, idx) => (
                <div className={`cc-timeline-row ${idx % 2 === 0 ? "left" : "right"}`} key={d.day}>
                  <div className="cc-timeline-node">{d.day}</div>
                  <DayCard {...d} />
                </div>
              ))}
            </div>
            {week.title === "Semana 4" && (
              <div style={{ marginTop: "16px" }} className="progress-strip">
                <div className="txt">
                  🏁 <b>Día 28 completado = Plan mínimo cumplido.</b> Aquí el templario decide con su líder si
                  continúa hasta el Día 60.
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="week-block">
          <div className="week-head">
            <div className="week-medal">🔥</div>
            <div>
              <div className="week-title">Semana 5 – 6</div>
              <div className="week-phase-row">
                <span className="week-phase">Fase · Prueba social</span>
                <span className="week-range">Día 29 – 42</span>
              </div>
            </div>
          </div>
          <LockedWeek
            title={{
              heading: "Segunda vuelta de formatos, misma técnica con historia nueva",
              body: "Se desbloquea al completar el Día 28. Aquí documentas resultados y casos propios usando los mismos formatos, con un ángulo de prueba social.",
            }}
          />
        </div>

        <div className="week-block">
          <div className="week-head">
            <div className="week-medal">🏆</div>
            <div>
              <div className="week-title">Semana 7 – 8</div>
              <div className="week-phase-row">
                <span className="week-phase">Fase · Cierre</span>
                <span className="week-range">Día 43 – 60</span>
              </div>
            </div>
          </div>
          <LockedWeek
            title={{
              heading: "Oferta directa a tu audiencia",
              body: "Se desbloquea al completar la Semana 6. Cierre del camino: ofertas, testimonios y llamados a la acción directos.",
            }}
          />
        </div>

        <div className="footer-note">
          Cada tarjeta lleva su propio video tutorial en Bunny.net — se va activando conforme se graban.
          <br />
          Este calendario corre desde el día en que tú arrancas, no desde una fecha fija de generación.
        </div>
      </div>
    </div>
  );
}

// CSS original del HTML, sin cambios de diseño — solo se movió a un template string.
const CSS = `
.calendario-camino-page{
  --gold:#D4AF37; --gold-bright:#FFE566; --gold-dim:rgba(212,175,55,0.4); --gold-glow:rgba(212,175,55,0.65);
  --dark-bg:#04020e; --dark-surface:rgba(10,5,32,0.92);
  --purple:#CC44FF; --purple-glow:rgba(204,68,255,0.5);
  --lilac:rgba(200,185,240,0.7); --lilac-dim:rgba(200,185,240,0.42);
  min-height:100dvh; width:100%; font-family:'Crimson Text',serif; color:#fff; position:relative;
  background:
    radial-gradient(ellipse 120% 40% at 50% 0%, rgba(40,10,90,0.9) 0%, transparent 60%),
    radial-gradient(ellipse 70% 30% at 12% 10%, rgba(10,40,100,0.3) 0%, transparent 55%),
    radial-gradient(ellipse 70% 30% at 88% 8%, rgba(80,10,110,0.3) 0%, transparent 55%),
    linear-gradient(180deg,#050215 0%,#0a0530 12%,#08031c 30%,#04020e 60%,#04020e 100%);
}
.calendario-camino-page *,.calendario-camino-page *::before,.calendario-camino-page *::after{box-sizing:border-box;}
.calendario-camino-page .stars{position:fixed; inset:0; pointer-events:none; z-index:0;}
.calendario-camino-page .star{position:absolute; border-radius:50%; background:#fff; animation:cc-twinkle var(--d) ease-in-out infinite; animation-delay:var(--del);}
@keyframes cc-twinkle{0%,100%{opacity:var(--min);} 50%{opacity:1;}}
@media (prefers-reduced-motion: reduce){ .calendario-camino-page *{animation:none !important; transition:none !important;} }
.calendario-camino-page .temple-icon .gold{stroke:var(--gold-bright); fill:var(--gold-bright);}
.calendario-camino-page .temple-icon .gold-mid{stroke:var(--gold); fill:var(--gold);}

.calendario-camino-page .topnav{
  position:sticky; top:0; z-index:20;
  display:flex; align-items:center; justify-content:space-between; gap:14px;
  padding:10px 26px;
  background:linear-gradient(180deg, rgba(6,3,18,0.98), rgba(6,3,18,0.94));
  border-bottom:1px solid var(--gold-dim);
  backdrop-filter:blur(8px);
}
.calendario-camino-page .brand{display:flex; align-items:center; gap:10px;}
.calendario-camino-page .brand-seal{width:32px; height:32px; flex-shrink:0; filter:drop-shadow(0 0 8px var(--gold-glow));}
.calendario-camino-page .brand-name{font-family:'Cinzel',serif; font-weight:900; letter-spacing:1px; font-size:17px; color:#fff;}
.calendario-camino-page .brand-name span{color:var(--gold);}
.calendario-camino-page .nav-links{display:flex; align-items:center; gap:22px; flex-wrap:nowrap;}
.calendario-camino-page .nav-item{
  font-family:'Cinzel',serif; font-size:13.5px; font-weight:700; letter-spacing:0.3px;
  color:var(--lilac); text-decoration:none; white-space:nowrap; opacity:0.85; transition:opacity .2s, color .2s;
}
.calendario-camino-page .nav-item:hover{opacity:1; color:var(--gold-bright);}
.calendario-camino-page .nav-item.active{color:var(--gold-bright); opacity:1;}
.calendario-camino-page .nav-select{
  font-family:'Cinzel',serif; font-size:13px; font-weight:700; color:#fff;
  background:rgba(212,175,55,0.1); border:1px solid var(--gold-dim); border-radius:8px;
  padding:8px 14px; white-space:nowrap; max-width:240px; overflow:hidden; text-overflow:ellipsis;
}
@media (max-width:860px){
  .calendario-camino-page .topnav{padding:8px 14px; flex-wrap:wrap; row-gap:8px;}
  .calendario-camino-page .nav-links{flex-wrap:wrap; gap:10px 14px;}
  .calendario-camino-page .nav-item{font-size:10.5px;}
  .calendario-camino-page .nav-select{margin-left:auto; font-size:11.5px; padding:6px 10px; max-width:180px;}
}

.calendario-camino-page .cc-bg-fx{position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden;}
.calendario-camino-page .cc-tone-layer{
  position:absolute; inset:-10%;
  background:
    radial-gradient(ellipse 70% 55% at 50% 0%, rgba(80,10,110,0.4) 0%, transparent 62%),
    radial-gradient(ellipse 55% 45% at 15% 60%, rgba(212,175,55,0.08) 0%, transparent 60%),
    radial-gradient(ellipse 55% 45% at 85% 85%, rgba(120,220,210,0.08) 0%, transparent 60%);
  animation:cc-hero-tone 18s ease-in-out infinite alternate;
}
@keyframes cc-hero-tone{
  0%{ filter:hue-rotate(0deg) brightness(1); }
  100%{ filter:hue-rotate(16deg) brightness(1.1); }
}
.calendario-camino-page .cc-orb{position:absolute; border-radius:50%; filter:blur(40px); animation:cc-orb-float ease-in-out infinite;}
.calendario-camino-page .cc-orb-gold{width:200px; height:200px; background:rgba(212,175,55,0.3); top:6%; left:5%; animation-duration:14s;}
.calendario-camino-page .cc-orb-purple{width:260px; height:260px; background:rgba(204,68,255,0.24); top:38%; right:6%; animation-duration:18s; animation-delay:1.2s;}
.calendario-camino-page .cc-orb-teal{width:170px; height:170px; background:rgba(120,220,210,0.2); bottom:10%; left:18%; animation-duration:15s; animation-delay:2.4s;}
@keyframes cc-orb-float{
  0%,100%{ transform:translate(0,0) scale(1); }
  50%{ transform:translate(24px,-20px) scale(1.08); }
}
@media (prefers-reduced-motion: reduce){
  .calendario-camino-page .cc-tone-layer, .calendario-camino-page .cc-orb{animation:none !important;}
}

.calendario-camino-page .cc-hero{
  position:relative; width:100%; flex-shrink:0; z-index:1;
  padding:clamp(22px,4.4vh,34px) 0 0;
}
.calendario-camino-page .cc-hero-inner{
  position:relative; z-index:2; max-width:1080px; width:100%; margin:0 auto;
  padding:0 clamp(18px,4vw,40px);
}
.calendario-camino-page .cc-hero-header{justify-content:center; text-align:center;}
.calendario-camino-page .cc-hero-mascot{
  position:relative; z-index:2; margin:32px auto -54px;
  width:clamp(240px,32vw,360px); height:clamp(240px,32vw,360px);
  background-image:url('https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/banners/camino/camino-calendario-banner.webp');
  background-size:contain; background-repeat:no-repeat; background-position:center;
  filter:drop-shadow(0 16px 26px rgba(0,0,0,0.5)) drop-shadow(0 0 40px rgba(212,175,55,0.35));
  -webkit-mask-image:radial-gradient(closest-side, #000 86%, transparent 100%);
  mask-image:radial-gradient(closest-side, #000 86%, transparent 100%);
}
.calendario-camino-page .cc-wrap-with-mascot{padding-top:70px;}
@media (max-width:600px){
  .calendario-camino-page .cc-hero-mascot{width:clamp(160px,52vw,240px); height:clamp(160px,52vw,240px); margin-top:22px; margin-bottom:-40px;}
  .calendario-camino-page .cc-wrap-with-mascot{padding-top:56px;}
}

.calendario-camino-page .wrap{max-width:1080px; width:100%; margin:0 auto; padding:clamp(18px,3vh,30px) clamp(18px,4vw,40px) 80px; position:relative; z-index:1;}

.calendario-camino-page .header-row{display:flex; align-items:center; gap:14px; margin-bottom:6px;}
.calendario-camino-page .header-icon{
  width:clamp(42px,6vh,54px); height:clamp(42px,6vh,54px); flex-shrink:0;
  border-radius:50%; border:2px solid var(--gold);
  background:radial-gradient(circle at 35% 30%, rgba(255,229,102,0.35), rgba(212,175,55,0.12) 65%, transparent 100%);
  box-shadow:0 0 16px var(--gold-glow); display:flex; align-items:center; justify-content:center; font-size:clamp(18px,2.4vh,22px);
}
.calendario-camino-page .eyebrow-tag{font-family:'Cinzel',serif; font-weight:900; font-size:12.5px; letter-spacing:2.2px; color:var(--gold);}
.calendario-camino-page h1.page-title{font-family:'Cinzel Decorative',serif; font-weight:900; font-size:clamp(24px,3.6vh,36px); color:#fff; text-shadow:0 0 20px rgba(212,175,55,0.3); line-height:1.15;}
.calendario-camino-page .cc-story{
  display:flex; flex-direction:column; align-items:center; text-align:center;
  max-width:640px; margin:36px auto 0; gap:12px;
}
.calendario-camino-page .cc-story-ornament{
  color:var(--gold); font-size:14px; letter-spacing:8px;
  text-shadow:0 0 12px var(--gold-glow);
}
.calendario-camino-page .page-sub{
  font-family:'Crimson Text',serif; font-style:italic; font-size:clamp(16px,2.1vh,19px);
  color:rgba(255,255,255,0.88); line-height:1.65;
}
@media (max-width:600px){ .calendario-camino-page .cc-story{margin-top:26px;} }

.calendario-camino-page .progress-strip{
  margin-top:22px; display:flex; align-items:center; gap:16px; flex-wrap:wrap;
  background:var(--dark-surface); border:1px solid var(--gold-dim); border-radius:14px;
  padding:14px 20px;
}
.calendario-camino-page .progress-strip b{color:var(--gold-bright);}
.calendario-camino-page .progress-strip .txt{font-family:'Nunito',sans-serif; font-size:13.5px; color:var(--lilac); flex:1; min-width:200px;}
.calendario-camino-page .milestone-pill{
  font-family:'Cinzel',serif; font-weight:900; font-size:11.5px; letter-spacing:0.5px; color:#1a0a2e;
  background:linear-gradient(90deg,var(--gold),var(--gold-bright)); padding:6px 14px; border-radius:100px; white-space:nowrap;
}

.calendario-camino-page .week-block{margin-top:44px;}
.calendario-camino-page .week-head{display:flex; align-items:center; gap:14px; margin-bottom:22px; flex-wrap:wrap;}
.calendario-camino-page .week-medal{
  width:46px; height:46px; flex-shrink:0; border-radius:50%; border:2px solid var(--gold);
  background:radial-gradient(circle at 35% 30%, rgba(255,229,102,0.32), rgba(212,175,55,0.1) 65%, transparent 100%);
  box-shadow:0 0 14px var(--gold-glow);
  display:flex; align-items:center; justify-content:center; font-size:20px;
}
.calendario-camino-page .week-title{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(16px,2.2vh,19px); color:#fff;}
.calendario-camino-page .week-phase-row{display:flex; align-items:center; gap:10px; margin-top:4px; flex-wrap:wrap;}
.calendario-camino-page .week-phase{
  font-family:'Cinzel',serif; font-weight:700; font-size:11px; letter-spacing:0.8px; color:var(--purple);
  background:rgba(204,68,255,0.12); border:1px solid rgba(204,68,255,0.3); padding:4px 11px; border-radius:100px;
}
.calendario-camino-page .week-range{font-family:'Nunito',sans-serif; font-size:13px; color:var(--lilac-dim);}

.calendario-camino-page .cc-timeline{position:relative; margin-top:6px;}
.calendario-camino-page .cc-timeline::before{
  content:""; position:absolute; left:50%; top:6px; bottom:6px; width:2px; transform:translateX(-50%); z-index:0;
  background:repeating-linear-gradient(180deg, var(--gold-dim) 0 10px, transparent 10px 22px);
}
.calendario-camino-page .cc-timeline-row{position:relative; display:flex; margin-bottom:20px; z-index:1;}
.calendario-camino-page .cc-timeline-row.left{justify-content:flex-start;}
.calendario-camino-page .cc-timeline-row.right{justify-content:flex-end;}
.calendario-camino-page .cc-timeline-row .day-card{width:calc(50% - 32px);}
.calendario-camino-page .cc-timeline-node{
  position:absolute; left:50%; top:16px; transform:translateX(-50%); z-index:2;
  width:30px; height:30px; border-radius:50%;
  background:radial-gradient(circle at 35% 30%, var(--gold-bright), var(--gold) 70%);
  border:2px solid #04020e; box-shadow:0 0 12px var(--gold-glow);
  display:flex; align-items:center; justify-content:center;
  font-family:'Cinzel',serif; font-weight:900; font-size:11px; color:#1a0a2e;
}
.calendario-camino-page .cc-timeline-row:nth-child(even) .day-card{border-color:var(--purple-glow);}
.calendario-camino-page .cc-timeline-row:nth-child(even) .day-card::before{background:radial-gradient(ellipse 70% 50% at 0% 0%, rgba(204,68,255,0.12), transparent 70%);}
@media (max-width:820px){
  .calendario-camino-page .cc-timeline::before{left:15px;}
  .calendario-camino-page .cc-timeline-row.left, .calendario-camino-page .cc-timeline-row.right{justify-content:flex-start; padding-left:44px;}
  .calendario-camino-page .cc-timeline-node{left:15px;}
  .calendario-camino-page .cc-timeline-row .day-card{width:100%;}
}

.calendario-camino-page .day-card{
  background:rgba(8,4,26,0.96); border:1px solid var(--gold-dim); border-radius:14px;
  padding:16px 18px; display:flex; flex-direction:column; gap:8px; position:relative; overflow:hidden;
}
.calendario-camino-page .day-card::before{content:""; position:absolute; inset:0; background:radial-gradient(ellipse 70% 50% at 100% 0%, rgba(212,175,55,0.08), transparent 70%); pointer-events:none;}
.calendario-camino-page .day-top{display:flex; align-items:center; justify-content:space-between; gap:10px;}
.calendario-camino-page .day-label{font-family:'Cinzel',serif; font-weight:900; font-size:12px; letter-spacing:0.4px; color:var(--lilac-dim);}
.calendario-camino-page .format-badge{
  font-family:'Cinzel',serif; font-weight:900; font-size:10.5px; letter-spacing:0.6px;
  padding:4px 10px; border-radius:100px; white-space:nowrap; display:flex; align-items:center; gap:5px;
}
.calendario-camino-page .format-badge.reel{color:#1a0a2e; background:linear-gradient(90deg,var(--gold),var(--gold-bright));}
.calendario-camino-page .format-badge.carrusel{color:#fff; background:rgba(204,68,255,0.25); border:1px solid var(--purple-glow);}
.calendario-camino-page .day-format{font-family:'Cinzel',serif; font-weight:900; font-size:16.5px; letter-spacing:0.3px; color:var(--gold-bright); text-shadow:0 1px 8px rgba(0,0,0,0.4);}
.calendario-camino-page .day-desc{font-family:'Crimson Text',serif; font-weight:500; font-size:14.5px; line-height:1.55; color:rgba(255,255,255,0.94); text-shadow:0 1px 6px rgba(0,0,0,0.35);}
.calendario-camino-page .day-video{
  margin-top:4px; display:flex; align-items:center; gap:8px;
  font-family:'Nunito',sans-serif; font-weight:700; font-size:12px; color:var(--gold-bright);
  border:1px dashed var(--gold-dim); border-radius:9px; padding:9px 12px;
}
.calendario-camino-page .day-video.pending{color:var(--lilac-dim); border-style:dashed;}
.calendario-camino-page .day-thumb{
  margin-top:6px; border-radius:10px; overflow:hidden; position:relative;
  aspect-ratio:16/10; background:linear-gradient(160deg, rgba(212,175,55,0.12), rgba(124,58,237,0.1));
  border:1px solid var(--gold-dim); display:flex; align-items:center; justify-content:center;
}
.calendario-camino-page .day-thumb.pending{background:repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0 10px, rgba(255,255,255,0.04) 10px 20px);}
.calendario-camino-page .play-btn{
  width:44px; height:44px; border-radius:50%; background:rgba(4,2,14,0.55); border:1.5px solid rgba(255,255,255,0.35);
  display:flex; align-items:center; justify-content:center; backdrop-filter:blur(2px);
}
.calendario-camino-page .play-btn svg{width:16px; height:16px; margin-left:2px;}
.calendario-camino-page .thumb-pending-label{
  position:absolute; bottom:8px; left:8px; right:8px;
  font-family:'Nunito',sans-serif; font-weight:700; font-size:10.5px; color:var(--lilac-dim);
  display:flex; align-items:center; gap:5px;
}
.calendario-camino-page .tutorial-btn{
  margin-top:2px; display:flex; align-items:center; justify-content:space-between; gap:8px;
  font-family:'Cinzel',serif; font-weight:900; font-size:11.5px; letter-spacing:0.4px; color:var(--gold-bright);
  background:rgba(212,175,55,0.08); border:1px solid var(--gold-dim); border-radius:9px; padding:9px 12px;
  opacity:0.55;
}

.calendario-camino-page .locked-week{
  background:rgba(255,255,255,0.02); border:1px dashed var(--gold-dim); border-radius:14px;
  padding:20px 22px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;
}
.calendario-camino-page .locked-left{display:flex; align-items:center; gap:12px;}
.calendario-camino-page .locked-icon{font-size:22px;}
.calendario-camino-page .locked-txt b{color:#fff; font-family:'Cinzel',serif; font-size:14px; display:block; margin-bottom:3px;}
.calendario-camino-page .locked-txt span{font-family:'Nunito',sans-serif; font-size:12.5px; color:var(--lilac-dim);}
.calendario-camino-page .locked-cta{font-family:'Cinzel',serif; font-weight:900; font-size:11.5px; letter-spacing:0.5px; color:var(--gold-bright); white-space:nowrap;}

.calendario-camino-page .footer-note{
  margin-top:40px; padding-top:22px; border-top:1px solid rgba(212,175,55,0.15);
  font-family:'Nunito',sans-serif; font-size:13px; color:var(--lilac-dim); text-align:center; line-height:1.6;
}
`;