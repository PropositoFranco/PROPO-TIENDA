import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// photo: foto grande que va en el recuadro, del lado contrario al texto.
// Deja la ruta vacía ('') hasta que subas tu imagen: mientras esté vacía
// se muestra el marcador de posición punteado; en cuanto pongas una ruta
// válida, la imagen aparece recortada automáticamente en el recuadro.
// size: 'a' | 'b' | 'c' | '' — controla la variedad visual de cada tarjeta.
const DATA = [
  {photo:'https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/beneficios/beneficio-1.jpg', size:'a',
    title:'Vas a dejar de vivir por inercia y vas a empezar a construir, a propósito, la vida que realmente quieres.',
    text:'Vas a soltar la idea de "después lo veo" con tu futuro <span class="hl">(y tus finanzas)</span> para empezar a diseñarlo, con pasos pequeños pero constantes que sí te acercan a donde realmente quieres llegar.'},
  {photo:'https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/beneficios/beneficio-2.jpg', size:'',
    title:'Vas a dejar de reaccionar a tus emociones y tu tiempo — y vas a empezar a decidir tú.',
    text:'Vas a tomar decisiones <span class="hl">con calma y seguridad</span>, incluso en los días en que todo a tu alrededor se sienta fuera de control.'},
  {photo:'https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/beneficios/beneficio-3.jpg', size:'c',
    title:'Vas a entrar a cualquier lugar, con cualquier persona, sintiendo que tu voz sí tiene peso.',
    text:'Vas a aprender a construir <span class="hl">relaciones donde ambas partes ganan de verdad</span>, sin manipular a nadie ni perderte a ti mismo en el intento.'},
  {photo:'https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/beneficios/beneficio-4.jpg', size:'b',
    title:'Vas a silenciar esa voz que lleva años diciéndote que no puedes.',
    text:'Vas a tomar decisiones <span class="hl">sin cargar el miedo al juicio de los demás</span>, y vas a decidir tú —y solo tú— qué y quién tiene permiso de influir en tu vida.'},
  {spotlight:true,
    title:'Estás frente al sistema de transformación personal más completo que existe.',
    text:[
      'No estamos aquí para decirte cómo vivir tu vida, ni para convertirte en alguien que no eres.',
      'Lo que hace este sistema es distinto: te ayuda a despertar lo que ya existe dentro de ti —esa fuerza, esa claridad, ese potencial que a veces se queda dormido— para que seas tú quien trace el camino hacia la vida que sueñas.',
      'Cada semana te vas a mirar de frente. Vas a descubrir con precisión qué parte de ti necesita fuerza en este momento, y vas a recibir, solo para eso, el ejercicio exacto que te toca trabajar.',
      'Lo enfrentas, avanzas, te vuelves a evaluar — y el siguiente paso se ajusta a lo que tú acabas de lograr.',
      'Así, semana tras semana, durante los 6 meses completos. No para cambiar quién eres, sino para reencontrarte contigo mismo cuando sientas que te perdiste, o para acercarte más a quien ya buscas ser.',
      'Y para que ese criterio se afile todavía más, <span class="hl">100 Templarios Dijeron</span> te va a poner frente a decisiones reales, para que cuando la vida te las presente de verdad, ya sepas exactamente qué hacer.'
    ]},
  {photo:'https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/beneficios/beneficio-5.jpg', size:'a',
    title:'Vas a instalar hábitos que se quedan — no los que duran una semana y se olvidan.',
    text:'Nunca vas a tener que adivinar por dónde seguir: cada semana vas a saber, <span class="hl">con total claridad</span>, en qué enfocar tu energía.'},
  {photo:'https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/beneficios/beneficio-6.jpg', size:'',
    title:'Vas a comprobar que puedes construir lo que tú quieras.',
    text:'Con <span class="hl">Construye Ideas en Herramientas</span> y <span class="hl">Construye Sin Límites</span> —ya disponibles en la tienda— vas a poder convertir cualquier idea, negocio o proyecto en algo real, tal como se construyó todo propotienda.com. Y cada cosa que vayas logrando se va a reflejar en tu rango, tus recompensas y las herramientas que acumules en el Templo.'}
];

// Curva única y elegante para todos los conectores: proporción fija (80x100)
// que coincide con el tamaño real del contenedor, así nunca se deforma.
const CONNECTOR = 'M6,50 C 30,24 50,76 74,50';

export default function BeneficiosPage() {
  const navigate = useNavigate();
  const stepRefs = useRef([]);

  useEffect(() => {
    const nodes = stepRefs.current.filter(Boolean);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
      nodes.forEach(el => io.observe(el));
      return () => io.disconnect();
    } else {
      nodes.forEach(el => el.classList.add('in-view'));
    }
  }, []);

  function handleContinue() {
    navigate('/tutorial');
  }

  return (
    <div style={{ background: 'var(--bg-deep, #0c0716)', minHeight: '100vh' }}>
      <style>{`
        .beneficios-root{
          --bg-deep:#0c0716;
          --bg-mid:#160c2b;
          --purple:#3c1f66;
          --purple-soft:#6b3fa0;
          --gold:#e8c26a;
          --gold-bright:#f5da9a;
          --gold-dim:#8a6f3a;
          --flame:#ff5a68;
          --flame-bright:#ffcf9e;
          --ink:#f3ecdf;
          --ink-dim:#c9bfae;
          --line:rgba(232,194,106,0.22);
          --safe-t: env(safe-area-inset-top,0px);
          --safe-b: env(safe-area-inset-bottom,0px);
          --safe-l: env(safe-area-inset-left,0px);
          --safe-r: env(safe-area-inset-right,0px);
          background:var(--bg-deep);color:var(--ink);font-family:'Crimson Text',serif;
          -webkit-font-smoothing:antialiased;overflow-x:hidden;min-height:100vh;
          background-image:
            radial-gradient(ellipse at 15% 4%, rgba(107,63,160,.30), transparent 45%),
            radial-gradient(ellipse at 85% 30%, rgba(107,63,160,.20), transparent 45%),
            radial-gradient(ellipse at 20% 75%, rgba(107,63,160,.18), transparent 45%),
            radial-gradient(ellipse at 80% 90%, rgba(107,63,160,.16), transparent 45%),
            linear-gradient(180deg, var(--bg-deep), var(--bg-mid) 45%, var(--bg-deep));
        }
        .beneficios-root *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        .beneficios-root h1,.beneficios-root h2,.beneficios-root h3,.beneficios-root .eyebrow{font-family:'Cinzel',serif;letter-spacing:.03em;}
        .beneficios-root .hl{color:var(--gold-bright);font-style:normal;text-shadow:0 0 10px rgba(245,218,154,.65), 0 0 3px rgba(245,218,154,.5);font-weight:700;}

        .beneficios-root #app{
          max-width:980px;margin:0 auto;
          padding:calc(var(--safe-t) + 18px) calc(var(--safe-r) + 18px) calc(var(--safe-b) + 26px) calc(var(--safe-l) + 18px);
        }

        .beneficios-root #header{
          display:flex;align-items:flex-start;justify-content:space-between;gap:14px;
          padding-bottom:18px;margin-bottom:8px;border-bottom:1px solid var(--line);
        }
        .beneficios-root #header-left{display:flex;align-items:center;gap:16px;min-width:0;}
        .beneficios-root #emblem{width:clamp(52px,9vw,72px);height:clamp(52px,9vw,72px);flex-shrink:0;}
        .beneficios-root #header-text h1{
          font-size:clamp(16px,3.4vw,24px);color:var(--gold-bright);
          text-shadow:0 0 16px rgba(232,194,106,.35);line-height:1.2;
          display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0;
        }
        .beneficios-root #sixMonthsPill{
          font-family:'Cinzel',serif;font-size:clamp(8.5px,1.6vw,10.5px);letter-spacing:.08em;
          color:var(--bg-deep);background:linear-gradient(135deg, var(--gold-bright), var(--gold) 70%);
          border-radius:999px;padding:4px 10px 3px;white-space:nowrap;
          box-shadow:0 0 10px rgba(232,194,106,.45);
        }
        .beneficios-root #header-text p{font-size:clamp(10.5px,2vw,13px);color:var(--ink-dim);margin-top:6px;max-width:56ch;line-height:1.5;}
        .beneficios-root #welcomeWord{font-family:'Cinzel',serif;font-size:clamp(9px,1.7vw,11px);letter-spacing:.08em;color:var(--gold);margin-top:10px;margin-bottom:2px;}
        .beneficios-root #headerHeadline{
          font-family:'Cinzel',serif;font-weight:800 !important;
          font-size:clamp(19px,4.6vw,29px) !important;
          line-height:1.26 !important;margin:4px 0 12px !important;max-width:30ch !important;
          letter-spacing:.01em;
          background:linear-gradient(100deg, var(--flame) 15%, var(--flame-bright) 42%, #fff2df 52%, var(--flame) 78%);
          background-size:250% 100%;
          -webkit-background-clip:text;background-clip:text;
          -webkit-text-fill-color:transparent;color:transparent !important;
          filter:drop-shadow(0 0 16px rgba(255,90,104,.55));
          animation:beneficiosHeadlineShimmer 3.2s linear infinite;
        }
        @keyframes beneficiosHeadlineShimmer{0%{background-position:220% 0;}100%{background-position:-220% 0;}}
        @supports not (background-clip: text){
          .beneficios-root #headerHeadline{color:var(--flame) !important;-webkit-text-fill-color:var(--flame);}
        }
        .beneficios-root #closeBtn{
          flex-shrink:0;width:32px;height:32px;border-radius:50%;margin-top:2px;
          border:1px solid var(--line);background:rgba(255,255,255,.03);
          display:flex;align-items:center;justify-content:center;cursor:pointer;
        }
        .beneficios-root #closeBtn svg{width:46%;height:46%;stroke:var(--ink-dim);}

        .beneficios-root #introLine{
          display:flex;align-items:center;gap:8px;margin:20px 2px 6px;
          font-size:clamp(9.5px,1.8vw,11px);letter-spacing:.12em;color:var(--gold);
        }
        .beneficios-root #introLine svg{width:12px;height:12px;stroke:var(--gold);flex-shrink:0;}
        .beneficios-root #introLine::after{content:'';flex:1;height:1px;background:linear-gradient(90deg, var(--line), transparent);}

        .beneficios-root #timeline{position:relative;padding:10px 0 4px;display:flex;flex-direction:column;gap:clamp(20px,4.4vw,34px);}

        .beneficios-root .step{
          position:relative;display:flex;align-items:center;gap:0;
          opacity:0;transform:translateY(34px);
          transition:opacity .8s cubic-bezier(.2,.7,.3,1), transform .8s cubic-bezier(.2,.7,.3,1);
        }
        .beneficios-root .step.in-view{opacity:1;transform:translateY(0);}
        .beneficios-root .step.side-right{flex-direction:row-reverse;}

        .beneficios-root .step-connector{flex:0 0 auto;align-self:center;width:clamp(24px,4.4vw,40px);height:clamp(34px,6vw,52px);position:relative;}
        .beneficios-root .step-connector svg{width:100%;height:100%;display:block;}
        .beneficios-root .step-connector path{fill:none;stroke:var(--gold-dim);stroke-width:1.6;stroke-linecap:round;}
        .beneficios-root .step-connector circle{fill:var(--gold-bright);filter:drop-shadow(0 0 5px rgba(232,194,106,.6));}

        .beneficios-root .step-content{
          flex:1 1 0;min-width:0;
          background:linear-gradient(160deg, rgba(60,31,102,.30), rgba(12,7,22,.42));
          border:1px solid var(--line);
          padding:clamp(14px,2.6vw,22px) clamp(16px,2.8vw,24px);
          border-radius:14px;
        }
        .beneficios-root .step-eyebrow{font-size:clamp(8px,1.4vw,9.5px);letter-spacing:.1em;color:var(--gold);margin-bottom:6px;}
        .beneficios-root .step-content h3{font-size:clamp(12.5px,2.3vw,15px);color:var(--ink);line-height:1.34;margin-bottom:7px;margin-top:0;}
        .beneficios-root .step-text{font-size:clamp(10.5px,1.9vw,12.5px);color:var(--ink-dim);line-height:1.58;}
        .beneficios-root .step.side-left .step-content{text-align:right;}

        .beneficios-root .step-photo{
          flex:1 1 0;min-width:0;position:relative;overflow:hidden;
          height:clamp(160px,26vw,250px);
          border:1.5px dashed var(--gold-dim);
          background:linear-gradient(160deg, rgba(60,31,102,.22), rgba(12,7,22,.32));
          display:flex;align-items:center;justify-content:center;
          border-radius:14px;
        }
        .beneficios-root .step-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
        .beneficios-root .step-photo .photo-label{font-family:'Cinzel',serif;font-size:clamp(8px,1.4vw,10px);letter-spacing:.08em;color:var(--gold-dim);text-align:center;padding:0 14px;}

        .beneficios-root .step.size-a .step-content, .beneficios-root .step.size-a .step-photo{border-radius:22px;}
        .beneficios-root .step.size-a .step-photo{height:clamp(180px,30vw,280px);}
        .beneficios-root .step.size-b .step-photo{height:clamp(190px,32vw,300px);border-radius:8px;}
        .beneficios-root .step.size-b .step-content{border-radius:8px;}
        .beneficios-root .step.size-c .step-photo{height:clamp(130px,19vw,190px);}
        .beneficios-root .step.size-c .step-content, .beneficios-root .step.size-c .step-photo{border-radius:28px;}

        .beneficios-root .step.spotlight{
          flex-direction:column;text-align:center;gap:14px;
          padding:clamp(22px,4.4vw,34px) clamp(18px,4vw,30px);
          border-radius:20px;
          background:
            radial-gradient(ellipse at 50% 0%, rgba(232,194,106,.14), transparent 60%),
            linear-gradient(160deg, rgba(60,31,102,.38), rgba(12,7,22,.5));
          border:1px solid var(--gold-dim);
          box-shadow:0 0 0 1px rgba(232,194,106,.08), 0 18px 40px -14px rgba(0,0,0,.6);
        }
        .beneficios-root .step.spotlight::before{
          content:'';position:absolute;inset:8px;border:1px solid rgba(232,194,106,.16);border-radius:14px;pointer-events:none;
        }
        .beneficios-root .spotlight-mark{width:38px;height:38px;margin:0 auto 2px;}
        .beneficios-root .spotlight-mark svg{width:100%;height:100%;stroke:var(--gold-bright);}
        .beneficios-root .step.spotlight .step-eyebrow{color:var(--gold-bright);letter-spacing:.16em;font-size:clamp(9px,1.6vw,10.5px);}
        .beneficios-root .step.spotlight h3{
          font-size:clamp(23px,5.4vw,36px);
          line-height:1.22;font-weight:900;
          max-width:36ch;margin:6px auto 4px;
          letter-spacing:.005em;
          background:linear-gradient(100deg, var(--flame) 15%, var(--flame-bright) 42%, #fff2df 52%, var(--flame) 78%);
          background-size:250% 100%;
          -webkit-background-clip:text;background-clip:text;
          -webkit-text-fill-color:transparent;color:transparent;
          filter:drop-shadow(0 0 18px rgba(255,90,104,.45));
          animation:beneficiosHeadlineShimmer 3.2s linear infinite;
        }
        @supports not (background-clip: text){
          .beneficios-root .step.spotlight h3{color:var(--flame);-webkit-text-fill-color:var(--flame);}
        }
        .beneficios-root .spotlight-divider{width:64px;height:1px;margin:14px auto 18px;background:linear-gradient(90deg, transparent, var(--gold-bright), transparent);}
        .beneficios-root .step.spotlight .step-text{max-width:52ch;margin:0 auto;font-size:clamp(11px,2vw,13.5px);}
        .beneficios-root .step.spotlight .step-text p{margin-bottom:clamp(12px,2.4vw,18px);}
        .beneficios-root .step.spotlight .step-text p:last-child{margin-bottom:0;}

        .beneficios-root #ctaBlock{
          margin-top:clamp(20px,4vw,34px);padding-top:clamp(16px,3vw,24px);
          border-top:1px solid var(--line);
          display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;
        }
        .beneficios-root #ctaBlock p.lead{font-size:clamp(11px,2vw,13px);color:var(--ink-dim);max-width:52ch;line-height:1.5;margin:0;}
        .beneficios-root button.main-btn{
          font-family:'Cinzel',serif;font-size:clamp(12px,2.2vw,15px);letter-spacing:.06em;color:var(--bg-deep);
          background:linear-gradient(135deg, var(--gold-bright), var(--gold) 60%, var(--gold-dim));
          border:none;border-radius:999px;padding:clamp(11px,2vw,15px) clamp(28px,5vw,42px);
          cursor:pointer;transition:box-shadow .3s ease, transform .15s ease;
          animation:beneficiosBtnGlow 2.1s ease-in-out infinite;
        }
        .beneficios-root button.main-btn:active{transform:scale(.96);}
        @keyframes beneficiosBtnGlow{0%,100%{box-shadow:0 0 8px 0 rgba(232,194,106,.35);}50%{box-shadow:0 0 20px 5px rgba(232,194,106,.55);}}

        .beneficios-root #warnNote{
          display:flex;align-items:center;gap:7px;font-size:clamp(10px,1.8vw,11.5px);
          color:var(--ink-dim);max-width:48ch;
        }
        .beneficios-root #warnNote svg{width:15px;height:15px;flex-shrink:0;stroke:var(--gold);}

        @media (max-width:480px){
          .beneficios-root #app{padding-left:calc(var(--safe-l) + 10px);padding-right:calc(var(--safe-r) + 10px);}
          .beneficios-root #timeline{gap:clamp(14px,3.6vw,22px);}
          .beneficios-root .step-connector{width:clamp(14px,3.6vw,24px);height:clamp(26px,6vw,38px);}
          .beneficios-root .step-content{padding:clamp(10px,2.6vw,15px) clamp(12px,2.8vw,16px);flex:1.15 1 0;}
          .beneficios-root .step-eyebrow{font-size:clamp(6.5px,1.9vw,8px);margin-bottom:4px;}
          .beneficios-root .step-content h3{font-size:clamp(10px,3vw,12px);line-height:1.3;margin-bottom:5px;}
          .beneficios-root .step-text{font-size:clamp(8.5px,2.5vw,10.5px);line-height:1.46;}
          .beneficios-root .step-photo{flex:0.9 1 0;height:clamp(90px,26vw,150px);border-radius:10px;}
          .beneficios-root .step.size-a .step-photo,.beneficios-root .step.size-b .step-photo{height:clamp(100px,30vw,170px);}
          .beneficios-root .step-photo .photo-label{font-size:clamp(6px,1.9vw,7.5px);padding:0 6px;}
          .beneficios-root .step.spotlight{padding:clamp(16px,4.4vw,24px) clamp(14px,4vw,20px);}
          .beneficios-root .step.spotlight h3{font-size:clamp(18px,6vw,24px);}
        }

        @media (prefers-reduced-motion: reduce){
          .beneficios-root button.main-btn{animation:none;}
          .beneficios-root .step{opacity:1;transform:none;transition:none;}
          .beneficios-root #headerHeadline{animation:none;background-position:0 0;}
          .beneficios-root .step.spotlight h3{animation:none;background-position:0 0;}
        }
      `}</style>

      <div className="beneficios-root">
        <div id="app">

          <div id="header">
            <div id="header-left">
              <svg id="emblem" viewBox="0 0 100 100" fill="none">
                <defs>
                  <radialGradient id="beneficiosGlowGrad" cx="50%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="#f5da9a" stopOpacity=".35"/>
                    <stop offset="100%" stopColor="#f5da9a" stopOpacity="0"/>
                  </radialGradient>
                </defs>
                <circle cx="50" cy="46" r="40" fill="url(#beneficiosGlowGrad)"/>
                <g stroke="#e8c26a" strokeWidth="1.1" fill="none" opacity=".85">
                  <path d="M14 46c-3 12 2 26 14 34" strokeLinecap="round"/>
                  <path d="M86 46c3 12-2 26-14 34" strokeLinecap="round"/>
                  <path d="M17 30c-4 3-4 5-3 6M14 38c-4 2-4 4-3 6M14 54c-4 1-5 3-4 5M18 62c-4 1-5 3-4 5M24 70c-3 2-4 4-3 6M32 76c-3 2-3 4-2 6M41 80c-2 2-2 4 0 6"/>
                  <path d="M83 30c4 3 4 5 3 6M86 38c4 2 4 4 3 6M86 54c4 1 5 3 4 5M82 62c4 1 5 3 4 5M76 70c3 2 4 4 3 6M68 76c3 2 3 4 2 6M59 80c2 2 2 4 0 6"/>
                </g>
                <g stroke="#e8c26a" strokeWidth="1" opacity=".55" strokeLinecap="round">
                  <path d="M50 8v7M38 10l2.4 6.6M62 10l-2.4 6.6M28 16l3.6 5.8M72 16l-3.6 5.8"/>
                </g>
                <g stroke="#e8c26a" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" fill="none">
                  <path d="M50 16 30 28h40Z"/>
                  <path d="M28 28h44"/>
                  <path d="M30 32v27M38 32v27M46 32v27M54 32v27M62 32v27M70 32v27"/>
                  <path d="M26 59h48"/>
                  <path d="M23 63h54M21 67h58"/>
                </g>
              </svg>
              <div id="header-text">
                <h1>Este es tu Templo Personal <span id="sixMonthsPill">6 MESES DE TRANSFORMACIÓN</span></h1>
                <p id="welcomeWord">Bienvenido.</p>
                <p id="headerHeadline">Tienes frente a ti el sistema de transformación personal más completo que existe.</p>
                <p>Y no se lee en cinco minutos: se vive, semana a semana, durante 6 meses completos, hasta que el cambio que buscas deje de ser una meta y se convierta en quien tú eres.</p>
              </div>
            </div>
            <button id="closeBtn" aria-label="Cerrar" onClick={handleContinue}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M5 5l14 14M19 5L5 19" strokeLinecap="round"/></svg>
            </button>
          </div>

          <div id="introLine">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6"><path d="M12 3l2.4 6.3 6.6.4-5.1 4.2 1.8 6.4L12 16.9 6.3 20.3l1.8-6.4-5.1-4.2 6.6-.4Z"/></svg>
            LO QUE YA ES TUYO
          </div>

          <div id="timeline">
            {DATA.map((item, i) => {
              if (item.spotlight) {
                return (
                  <div
                    key={i}
                    ref={el => { stepRefs.current[i] = el; }}
                    className="step spotlight"
                  >
                    <div className="spotlight-mark">
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.4">
                        <path d="M12 2l2.6 6.8L22 9.6l-5.6 4.8L18.2 22 12 17.6 5.8 22l1.8-7.6L2 9.6l7.4-.8Z" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="step-eyebrow">✦ EL SISTEMA MÁS COMPLETO PARA TU TRANSFORMACIÓN</div>
                    <h3>{item.title}</h3>
                    <div className="spotlight-divider"></div>
                    <div className="step-text">
                      {item.text.map((p, pi) => (
                        <p key={pi} dangerouslySetInnerHTML={{ __html: p }} />
                      ))}
                    </div>
                  </div>
                );
              }

              const side = i % 2 === 0 ? 'side-left' : 'side-right';
              return (
                <div
                  key={i}
                  ref={el => { stepRefs.current[i] = el; }}
                  className={'step ' + side + (item.size ? ' size-' + item.size : '')}
                >
                  <div className="step-content">
                    <div className="step-eyebrow">✦ LO QUE VAS A LOGRAR</div>
                    <h3>{item.title}</h3>
                    <div className="step-text" dangerouslySetInnerHTML={{ __html: item.text }} />
                  </div>
                  <div className="step-connector">
                    <svg viewBox="0 0 80 100" preserveAspectRatio="none">
                      <path d={CONNECTOR}/>
                      <circle cx="6" cy="50" r="3"/>
                      <circle cx="74" cy="50" r="3"/>
                    </svg>
                  </div>
                  <div className="step-photo">
                    <span className="photo-label">SUBE TU IMAGEN AQUÍ</span>
                    <img src={item.photo} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div id="ctaBlock">
            <p className="lead">Esto no se conquista de un solo golpe. Semana a semana vas a ir descubriendo, con calma, exactamente hacia dónde enfocar tu energía.</p>
            <button id="mainBtn" className="main-btn" onClick={handleContinue}>Continuar al Tutorial</button>
            <div id="warnNote">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6">
                <path d="M12 3 L22 20 H2 Z" strokeLinejoin="round"/>
                <path d="M12 9v5" strokeLinecap="round"/>
                <circle cx="12" cy="17" r="0.8" fill="#e8c26a"/>
              </svg>
              <span>No te lo saltes: en el tutorial aprendes a usar tu Templo.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
