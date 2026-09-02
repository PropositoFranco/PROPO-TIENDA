import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../services/supabase";

// ─── PALETTE ─────────────────────────────────────────────
const C = {
  gold:"#D4AF37",goldBright:"#FFE566",goldDim:"rgba(212,175,55,0.35)",
  goldGlow:"rgba(212,175,55,0.7)",bg:"#04020e",mid:"#0a0520",
  blue:"#4488FF",blueGlow:"rgba(68,136,255,0.7)",
  green:"#44FF88",greenGlow:"rgba(68,255,136,0.7)",
  purple:"#CC44FF",purpleGlow:"rgba(204,68,255,0.7)",
  red:"#FF4444",redGlow:"rgba(255,68,68,0.7)",
  cyan:"#44DDFF",cyanGlow:"rgba(68,221,255,0.7)",
  amber:"#FFB844",amberGlow:"rgba(255,184,68,0.7)",
  pink:"#FF3377",pinkGlow:"rgba(255,51,119,0.7)",
  orange:"#FF7A22",orangeGlow:"rgba(255,122,34,0.7)",
};

function hexToRgb(hex) {
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r?`${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`:"255,255,255";
}

// ─── LIENZO DE DISEÑO FIJO (referencia "PC") ───────────────
// Todo el tutorial se dibuja SIEMPRE con estas dimensiones virtuales,
// sin importar el dispositivo real. Así el layout jamás se reordena ni
// se corta: en pantallas más chicas (celular) el lienzo completo se
// reduce de tamaño con un transform:scale, manteniendo pixel a pixel
// la misma composición que se ve en PC.
const DESKTOP_W=1200;
const DESKTOP_H=675;

// ─── RESPONSIVE HOOK ──────────────────────────────────────
function useWindowSize() {
  const [sz, setSz] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const fn = () => {
      const vv = window.visualViewport;
      setSz({
        w: Math.round(vv ? vv.width : window.innerWidth),
        h: Math.round(vv ? vv.height : window.innerHeight),
      });
    };
    fn();
    window.addEventListener("resize", fn);
    window.addEventListener("orientationchange", fn);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", fn);
      window.visualViewport.addEventListener("scroll", fn);
    }
    return () => {
      window.removeEventListener("resize", fn);
      window.removeEventListener("orientationchange", fn);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", fn);
        window.visualViewport.removeEventListener("scroll", fn);
      }
    };
  }, []);
  return sz;
}

// ─── STARS ───────────────────────────────────────────────
function Stars() {
  const stars = useRef([]);
  if (!stars.current.length) {
    for (let i=0;i<28;i++) stars.current.push({
      id:i,x:Math.random()*100,y:Math.random()*65,
      size:Math.random()*2+0.5,dur:3+Math.random()*5,
      delay:Math.random()*6,minOp:0.15+Math.random()*0.3,
    });
  }
  return (
    <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
      {stars.current.map(s=>(
        <motion.div key={s.id}
          style={{position:"absolute",left:`${s.x}%`,top:`${s.y}%`,
            width:s.size,height:s.size,borderRadius:"50%",background:"#fff",
            willChange:"opacity"}}
          animate={{opacity:[s.minOp,0.9,s.minOp]}}
          transition={{duration:s.dur,delay:s.delay,repeat:Infinity,ease:"easeInOut"}}/>
      ))}
    </div>
  );
}

// ─── PARTICLES ───────────────────────────────────────────
function Particles({count=7,colors}) {
  const pts=useRef([]);
  const cols=colors||[C.goldGlow,"rgba(255,229,102,0.6)",C.blueGlow,C.purpleGlow];
  if (!pts.current.length) {
    for (let i=0;i<count;i++) pts.current.push({
      id:i,x:Math.random()*100,size:Math.random()*2.5+1,
      col:cols[Math.floor(Math.random()*cols.length)],
      dur:4+Math.random()*5,delay:Math.random()*8,
    });
  }
  return (
    <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:5}}>
      {pts.current.map(p=>(
        <motion.div key={p.id}
          style={{position:"absolute",left:`${p.x}%`,bottom:"20%",
            width:p.size,height:p.size,borderRadius:"50%",background:p.col,
            willChange:"transform,opacity"}}
          animate={{y:[0,-100],opacity:[0.7,0]}}
          transition={{duration:p.dur,delay:p.delay,repeat:Infinity,ease:"easeOut"}}/>
      ))}
    </div>
  );
}

// ─── GLOW RING ───────────────────────────────────────────
function GlowRing({color,size=80}) {
  return (
    <motion.div style={{
      position:"absolute",top:"50%",left:"50%",
      width:size,height:size,borderRadius:"50%",
      border:`2px solid ${color}`,
      transform:"translate(-50%,-50%)",pointerEvents:"none",zIndex:0,
      willChange:"opacity",
    }}
      animate={{opacity:[0.6,0,0.6]}}
      transition={{duration:5,repeat:Infinity,ease:"easeOut"}}/>
  );
}

// ─── PORTAL ──────────────────────────────────────────────
function Portal({color,gem,icon,title,desc,btn,active,dimmed,pScale=1}) {
  const rgb=hexToRgb(color);
  const W=Math.round(120*pScale);
  const H=Math.round(260*pScale);
  const outerW=Math.round(130*pScale);
  const iconSize=Math.max(18,Math.round(42*pScale));
  const titleSize=Math.max(7,Math.round(11*pScale));
  const descSize=Math.max(6,Math.round(9*pScale));
  const btnSize=Math.max(6,Math.round(10*pScale));
  const gemR=Math.max(7,Math.round(10*pScale));
  const borderR=Math.max(24,Math.round(60*pScale));
  const gR140=Math.round(140*pScale);
  const gR100=Math.round(100*pScale);

  return (
    <motion.div
      animate={{
        opacity:dimmed?0.06:1,
        scale:active?1.1:1,y:active?-6:0,
      }}
      transition={{duration:0.4}}
      style={{position:"relative",display:"flex",flexDirection:"column",
        alignItems:"center",width:outerW,cursor:"default",flexShrink:0,
        filter:active?`brightness(1.4) saturate(1.4) drop-shadow(0 0 8px ${color})`:"none",
        willChange:"transform,opacity"}}>
      {active&&<GlowRing color={color} size={gR140}/>}
      {active&&<GlowRing color={gem} size={gR100}/>}
      <div style={{
        width:W,height:H,borderRadius:`${borderR}px ${borderR}px 8px 8px`,
        border:`2px solid ${color}`,position:"relative",
        background:active
          ?`radial-gradient(ellipse 80% 60% at 50% 30%,rgba(${rgb},0.72) 0%,rgba(${rgb},0.38) 50%,rgba(4,2,14,0.85) 100%)`
          :`radial-gradient(ellipse 80% 60% at 50% 40%,rgba(${rgb},0.08) 0%,rgba(4,2,14,0.95) 100%)`,
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        boxShadow:active?`0 0 14px ${color},inset 0 0 12px rgba(${rgb},0.15)`:"none",
      }}>
        <div style={{
          position:"absolute",top:-gemR/2,width:gemR*2,height:gemR*2,borderRadius:"50%",
          background:`radial-gradient(circle at 40% 35%,#fff 10%,${gem} 50%,#333 100%)`,
          border:`2px solid ${gem}`,
          boxShadow:active?`0 0 8px ${gem}`:`0 0 3px ${gem}`,
        }}/>
        <div
          style={{fontSize:iconSize,marginBottom:Math.round(8*pScale),
            filter:active?`drop-shadow(0 0 5px ${color})`:"none"}}>
          {icon}
        </div>
      </div>
      <div style={{marginTop:Math.round(8*pScale),fontFamily:"'Cinzel',serif",
        fontSize:titleSize,fontWeight:700,
        color:active?"#fff":"rgba(255,255,255,0.7)",
        textAlign:"center",letterSpacing:1,
        textShadow:active?`0 0 10px ${color}`:"none"}}>
        {title}
      </div>
      {desc&&<div style={{fontSize:descSize,
        color:active?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.35)",
        textAlign:"center",marginTop:Math.round(2*pScale),
        textShadow:active?`0 0 8px ${color}`:"none"}}>{desc}</div>}
      <div style={{marginTop:Math.round(6*pScale),
        padding:`${Math.max(3,Math.round(5*pScale))}px ${Math.max(8,Math.round(14*pScale))}px`,
        border:`1.5px solid ${color}`,borderRadius:4,
        fontSize:btnSize,fontFamily:"'Cinzel',serif",
        color:active?"#fff":"rgba(255,255,255,0.45)",
        background:active?`rgba(${rgb},0.55)`:"transparent",
        letterSpacing:0.8,
        boxShadow:active?`0 0 8px rgba(${rgb},0.5)`:"none",
        textShadow:active?`0 0 12px ${color}`:"none",
      }}>
        {btn}
      </div>
    </motion.div>
  );
}

// ─── DATA ────────────────────────────────────────────────
const PORTALS=[
  {color:C.blue,  gem:"#88BBFF",icon:"🗝",title:"CLAVES",           desc:"Técnicas de alto impacto",      btn:"ENTRAR",          id:"claves"},
  {color:C.green, gem:"#88FFAA",icon:"⚡",title:"VICTORIAS RÁPIDAS",desc:"Acciones rápidas con IA",       btn:"ENTRAR",          id:"victorias"},
  {color:C.purple,gem:"#DD88FF",icon:"🗺",title:"MAPAS DEL TEMPLO", desc:"Sistemas y rutas estratégicas", btn:"EXPLORAR",        id:"mapas"},
  {color:C.gold,  gem:"#FFE566",icon:"🏆",title:"100 TEMPLARIOS DIJERON",desc:"Siempre hay un podio que liderar",btn:"ENTRAR AL JUEGO",id:"templo"},
  {color:C.red,   gem:"#FF8888",icon:"🎯",title:"MISIONES",         desc:"Retos, progreso y recompensas", btn:"VER MISIONES",    id:"misiones"},
  {color:C.cyan,  gem:"#88EEFF",icon:"🎒",title:"TU ARSENAL",       desc:"Tu contenido desbloqueado",     btn:"VER TODO",        id:"arsenal"},
  {color:C.amber, gem:"#FFCC88",icon:"✨",title:"MI PERFIL",        desc:"Tu progreso y estadísticas",    btn:"VER PERFIL",      id:"perfil"},
];

const TERRITORIES=[
  {name:"Cuerpo",        color:C.red,   icon:"💪",desc:"Hábitos, energía, disciplina física y estabilidad corporal."},
  {name:"Mente",         color:C.blue,  icon:"🧠",desc:"Claridad mental, enfoque, creencias y arquitectura cognitiva."},
  {name:"Emociones",     color:C.pink,  icon:"❤️",desc:"Gestión emocional, resiliencia y regulación interna."},
  {name:"Relaciones",    color:C.green, icon:"👥",desc:"Vínculos, comunicación y entorno social."},
  {name:"Riqueza",       color:C.gold,  icon:"💰",desc:"Abundancia, estrategia financiera y prosperidad duradera."},
  {name:"Vocación",      color:C.purple,icon:"🎯",desc:"Misión de vida, propósito, talento y legado personal."},
  {name:"Espiritualidad",color:C.cyan,  icon:"🌸",desc:"Conexión profunda, paz interior y expansión consciente."},
  {name:"Ocio",          color:C.orange,icon:"🌴",desc:"Descanso, juego, creatividad y disfrute consciente."},
];

const MODULES=[
  {title:"Protocolo Aurora",       territory:"Mente",     type:"CLAVE",          price:350,color:C.blue,  icon:"🌅"},
  {title:"Ritual del Silencio",    territory:"Cuerpo",    type:"VICTORIA RÁPIDA",price:120,color:C.red,   icon:"🌿"},
  {title:"Mapa de la Vocación",    territory:"Vocación",  type:"MAPA",           price:680,color:C.purple,icon:"🗺"},
  {title:"Escudo Emocional",       territory:"Emociones", type:"CLAVE",          price:420,color:C.pink,  icon:"🛡"},
  {title:"Catalizador de Riqueza", territory:"Riqueza",   type:"CLAVE",          price:500,color:C.gold,  icon:"⚡"},
  {title:"Arquitectura Vincular",  territory:"Relaciones",type:"MAPA",           price:590,color:C.green, icon:"🌐"},
];

const ARSENAL_ITEMS=[
  {title:"Protocolo Aurora",   type:"CLAVE",   territory:"Mente",    icon:"🌅",color:C.blue},
  {title:"Ritual del Silencio",type:"VICTORIA",territory:"Cuerpo",   icon:"🌿",color:C.red},
  {title:"Escudo Emocional",   type:"CLAVE",   territory:"Emociones",icon:"🛡",color:C.pink},
  {title:"Mapa de la Vocación",type:"MAPA",    territory:"Vocación", icon:"🗺",color:C.purple},
];

// ─── TUTORIAL STEPS ──────────────────────────────────────
const STEPS=[
  {screen:"home",       highlight:null,           master:"Bienvenido, Templario.",              sub:"Soy el Maestro Templario. Voy a enseñarte una sola cosa importante, y algunas herramientas de apoyo alrededor. No necesitas memorizar nada — solo entender el camino.",btn:"Continuar"},
  {screen:"home",       highlight:"protocolo",     master:"Esto es el corazón de la Propo-Tienda.",sub:"Cada semana tienes aquí abajo tu Evaluación — te toma menos de 5 minutos. Es lo único que de verdad mueve tu progreso. Todo lo demás en esta pantalla es apoyo alrededor de esto.",btn:"Entendido"},
  {screen:"home",       highlight:"coins",         master:"Estos son tus PropoCoins.",           sub:"Nacen de completar tu protocolo semanal, y se usan para desbloquear herramientas extra. Entre más constante seas con tu evaluación, más PropoCoins acumulas.",btn:"Continuar"},
  {screen:"home",       highlight:"apoyo",         master:"Tus herramientas de apoyo.",          sub:"Claves, Victorias Rápidas y Mapas del Templo te dan técnicas extra para profundizar. Úsalas cuando quieras ir más allá de tu evaluación — no las necesitas para avanzar.",btn:"Continuar"},
  {screen:"home",       highlight:"templo",        master:"100 Templarios Dijeron.",             sub:"Aquí pones a prueba lo que vas aprendiendo y compites por un lugar en el podio. Es el juego del templo — divertido, pero no es tu evaluación.",btn:"Continuar"},
  {screen:"evaluacion", highlight:null,            master:"Tu Evaluación Semanal.",              sub:"Cada semana respondes preguntas cortas por territorio, deslizando del 1 al 10. Toma menos de 5 minutos y es lo único que de verdad mueve tu progreso.",btn:"¿Y dónde vive esto?"},
  {screen:"academia",   highlight:null,            master:"📍 La Academia del Templo.",           sub:"Cada semana al responder tu evaluación el sistema te libera el módulo exacto que necesitas según los resultados de tu evaluación. Tus módulos anteriores quedan guardados como historial de tu crecimiento.",btn:"Ver los Territorios"},
  {screen:"territories",highlight:null,            master:"Los Territorios del Templo.",         sub:"Tu vida se organiza en 8 áreas: Cuerpo, Mente, Emociones, Relaciones, Riqueza, Vocación, Espiritualidad y Ocio. Tu Evaluación Semanal revisa estas áreas y te dice en cuál enfocarte primero.",btn:"Continuar"},
  {screen:"territories",highlight:"t_connections", master:"Cada color te ubica.",                sub:"Los colores y símbolos conectan cada herramienta con su territorio, para que sepas de un vistazo en qué área estás trabajando.",btn:"Ver la Tienda"},
  {screen:"modules",    highlight:null,            master:"La Tienda del Templo.",               sub:"Aquí desbloqueas herramientas extra con los PropoCoins que ganaste en tu evaluación. Revisa el objetivo y el territorio de cada una antes de canjear.",btn:"Ver tu Arsenal"},
  {screen:"arsenal",    highlight:null,            master:"Tu Arsenal Personal.",                sub:"Aquí vive todo lo que has desbloqueado. Fíltralo por territorio o tipo cuando busques algo específico.",btn:"Ver tus Misiones"},
  {screen:"missions",   highlight:null,            master:"Operaciones del Templo.",             sub:"Retos activos con recompensa fija en XP y PropoCoins — desde entrar por primera vez a la tienda, hasta pelear el Top 1 en 100 Templarios. Cuando el avance llega a 100%, reclamas.",btn:"Ver la Comunidad"},
  {screen:"comunidad",  highlight:null,            master:"La Comunidad del Templo.",            sub:"Publica tu avance o tus dudas y gana XP y PropoCoins solo por participar. Cada punto te acerca al siguiente rango — de Discípulo a Guardián, y más allá.",btn:"Finalizar"},
  {screen:"final",      highlight:null,            master:"El templo te espera, Templario.",     sub:"Recuerda: tu Evaluación Semanal es lo único que no puedes saltarte. Menos de 5 minutos, cada semana. Y si alguna vez tienes dudas, puedes volver a ver este tutorial completo desde el botón Tutorial, ahí abajo a la derecha de tu Lobby.",btn:"Completar mi Evaluación"},
];

// ─── NARRACIÓN POR VOZ (Web Speech API — gratis, sin costo) ───
const NARRATION=[
  "¡Bienvenido, Templario! Soy tu Maestro Templario, ¡y qué alegría tenerte aquí! Te voy a enseñar una sola cosa importante, y algunas herramientas de apoyo alrededor. No necesitas memorizar nada. ¡Solo disfruta el camino!",
  "¡Mira esto! Aquí está el corazón de la Propo-Tienda. Cada semana, aquí abajo, tienes tu Evaluación. Te toma menos de cinco minutos, ¡y es lo único que de verdad mueve tu progreso! Todo lo demás en esta pantalla es apoyo alrededor de esto.",
  "¡Estos son tus PropoCoins! Nacen de completar tu protocolo semanal, y los usas para desbloquear herramientas extra. Entre más constante seas con tu evaluación, ¡más PropoCoins vas acumulando!",
  "¡Estas son tus herramientas de apoyo! Claves, Victorias Rápidas y Mapas del Templo te dan técnicas extra para profundizar. Úsalas cuando quieras ir más allá de tu evaluación. ¡Pero ojo, no las necesitas para avanzar!",
  "¡Y aquí, 100 Templarios Dijeron! Aquí pones a prueba lo que vas aprendiendo, y compites por un lugar en el podio. Es el juego del templo. ¡Súper divertido! Aunque, ojo, no es tu evaluación.",
  "Hablemos de tu Evaluación Semanal. Cada semana respondes preguntas cortas por territorio, deslizando del uno al diez. Toma menos de cinco minutos, ¡y es lo único que de verdad mueve tu progreso!",
  "¡Bienvenido a la Academia del Templo! Cada semana, al responder tu evaluación, el sistema te libera el módulo exacto que necesitas según los resultados de tu evaluación. Tus módulos anteriores quedan guardados como historial de tu crecimiento.",
  "¡Estos son los Territorios del Templo! Tu vida se organiza en ocho áreas: Cuerpo, Mente, Emociones, Relaciones, Riqueza, Vocación, Espiritualidad y Ocio. Tu Evaluación Semanal revisa estas áreas, ¡y te dice en cuál enfocarte primero!",
  "¡Fíjate bien en los colores! Cada color y símbolo conecta tu herramienta con su territorio, para que sepas de un vistazo en qué área estás trabajando.",
  "¡Bienvenido a la Tienda del Templo! Aquí desbloqueas herramientas extra con los PropoCoins que ganaste en tu evaluación. Revisa el objetivo y el territorio de cada una antes de canjear.",
  "¡Este es tu Arsenal Personal! Aquí vive todo lo que has desbloqueado. Fíltralo por territorio o tipo cuando busques algo específico.",
  "¡Ahora, las Operaciones del Templo! Retos activos con recompensa fija en XP y PropoCoins, desde entrar por primera vez a la tienda, hasta pelear el Top uno en 100 Templarios Dijeron. Cuando el avance llega a cien por ciento, ¡reclamas tu recompensa!",
  "¡Y aquí está la Comunidad del Templo! Publica tu avance o tus dudas, y gana XP y PropoCoins solo por participar. Cada punto te acerca al siguiente rango, de Discípulo a Guardián, ¡y más allá!",
  "¡El templo te espera, Templario! Recuerda: tu Evaluación Semanal es lo único que no puedes saltarte. Menos de cinco minutos, cada semana. Y si alguna vez tienes dudas, puedes volver a ver este tutorial completo desde el botón Tutorial, ahí abajo a la derecha de tu Lobby. ¡Vamos, este es tu momento!",
];

// ─── AUDIO DE NARRACIÓN (archivo real, NO la voz robótica del navegador) ──
// El tutorial ya NO usa window.speechSynthesis. En su lugar reproduce un
// archivo de audio real por cada paso — así la voz suena EXACTAMENTE
// igual, con el mismo tono emocionante, en cualquier computadora,
// celular o navegador, sin depender de qué voces traiga instaladas cada
// dispositivo (esa dependencia era la causa de que sonara robótica en
// unos equipos y bien en otros).
//
// CÓMO ACTIVARLO:
// 1) Genera 14 archivos .mp3 (uno por paso, en el mismo orden que
//    NARRATION/STEPS abajo) con la voz que quieras — usando como
//    referencia la voz de tu video, pero exportando la pista SECA, sin
//    reverb/eco/ambiente (ese eco que se escucha en tu video es un efecto
//    de sala añadido en la mezcla, no la voz en sí; si lo dejas activado
//    al generar el audio final, se va a notar todavía más al reproducirse
//    dentro de la app).
// 2) Súbelos a un bucket PÚBLICO de Supabase Storage (o cualquier CDN) y
//    reemplaza AUDIO_BASE_URL por esa URL base.
// 3) Si un paso todavía no tiene su archivo, el tutorial simplemente
//    avanza en silencio, al ritmo correcto — nunca se rompe ni se acelera.
// Ruta relativa dentro de tu propio proyecto: copia la carpeta
// "tutorial-audio" (con los 14 .mp3 adentro) a tu carpeta `public/`
// (Create React App / Vite) o `static/`/`public/` según tu framework, para
// que quede servida en TU-DOMINIO/tutorial-audio/paso-00.mp3, etc. No
// necesitas Supabase Storage ni ninguna cuenta externa — así funciona
// igual en PC, tablet y celular, dentro de la app o en el navegador.
const AUDIO_BASE_URL="/tutorial-audio";
const NARRATION_AUDIO=[
  "paso-00.mp3","paso-01.mp3","paso-02.mp3","paso-03.mp3","paso-04.mp3",
  "paso-05.mp3","paso-06.mp3","paso-07.mp3","paso-08.mp3","paso-09.mp3",
  "paso-10.mp3","paso-11.mp3","paso-12.mp3","paso-13.mp3",
];

// ─── TITLE SHIMMER ───────────────────────────────────────
function TitleShimmer({mobile}) {
  const [active,setActive]=useState(0);
  const words=["Propo-Tienda","TU CAMINO","TU TEMPLO","TU LEGADO"];
  useEffect(()=>{
    const iv=setInterval(()=>setActive(a=>(a+1)%words.length),1600);
    return ()=>clearInterval(iv);
  },[]);
  return (
    <div style={{textAlign:"center",padding:mobile?"3px 0 2px":"6px 0 3px",zIndex:2,flexShrink:0}}>
      <motion.div
        style={{fontFamily:"'Cinzel Decorative',serif",
          fontSize:mobile?24:38,fontWeight:900,letterSpacing:mobile?3:6,lineHeight:1}}
        animate={{
          color:active===0?C.goldBright:"rgba(212,175,55,0.7)",
          textShadow:active===0?`0 0 14px ${C.gold}`:`0 0 8px ${C.gold}`,
        }}
        transition={{duration:0.5,ease:"easeInOut"}}>
        ✦ Propo-Tienda ✦
      </motion.div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:mobile?8:10,
        letterSpacing:mobile?3:5,marginTop:3,display:"flex",
        justifyContent:"center",gap:6,alignItems:"center"}}>
        {[["TU CAMINO",1],["·",null],["TU TEMPLO",2],["·",null],["TU LEGADO",3]].map(([w,idx],i)=>(
          idx!==null?(
            <span key={i} style={{
              color:active===idx?C.goldBright:"rgba(212,175,55,0.45)",
              textShadow:active===idx?`0 0 7px ${C.goldGlow}`:"none",
              transition:"color 0.4s,text-shadow 0.4s",
            }}>{w}</span>
          ):(
            <span key={i} style={{color:"rgba(212,175,55,0.3)"}}>{w}</span>
          )
        ))}
      </div>
    </div>
  );
}

// ─── HOME SCREEN ─────────────────────────────────────────
// ─── COUNTDOWN AISLADO ──────────────────────────────────
// Antes el "timerSecs" vivía en el componente raíz (TStoreTutorial) y cada
// tick de 1s (setInterval) re-renderizaba TODO el árbol del tutorial
// (Stars, Particles, pantalla activa, MasterPanel...), aunque el número
// solo se ve en una esquina en desktop. Aislado aquí, solo este badge
// se actualiza cada segundo — el resto del tutorial deja de repintarse
// sin necesidad, lo cual es la ganancia de fluidez más grande posible
// sin tocar el resto del diseño.
function CountdownBadge() {
  const [secs,setSecs]=useState(23*3600+39*60+12);
  useEffect(()=>{
    const iv=setInterval(()=>setSecs(s=>Math.max(0,s-1)),1000);
    return ()=>clearInterval(iv);
  },[]);
  const h=String(Math.floor(secs/3600)).padStart(2,"0");
  const m=String(Math.floor((secs%3600)/60)).padStart(2,"0");
  const s=String(secs%60).padStart(2,"0");
  return <>{h}:{m}:{s}</>;
}

function HomeScreen({highlight,highlightPortalIds,coins,mobile,size,panelH}) {
  const dim=(id)=>highlightPortalIds.length>0&&!highlightPortalIds.includes(id);
  const portalScrollRef=useRef(null);

  const availW = mobile ? size.w - 32 : size.w * 0.58;
  const chromeH = mobile ? 170 : 230;
  const availH = Math.max(120, size.h - chromeH - (panelH + 16));
  // Sin piso fijo: en pantallas muy bajas (celular con barra del navegador
  // visible, o el contenedor donde vive el tutorial siendo más corto de lo
  // esperado) el portal debe poder encoger todo lo necesario para que NADA
  // se corte. El *1.22 reserva espacio extra porque el portal activo crece
  // ~10% y se desplaza -6px al iluminarse (ver <Portal active>).
  const pScale = Math.min(1, Math.max(0.32, Math.min(availW / 958, availH / (350*1.22))));

  useEffect(()=>{
    if (mobile&&highlightPortalIds.length>0&&portalScrollRef.current) {
      const idx=PORTALS.findIndex(p=>highlightPortalIds.includes(p.id));
      if (idx>=0) {
        const portalW=Math.round(130*pScale)+8;
        portalScrollRef.current.scrollTo({left:Math.max(0,idx*portalW-40),behavior:"smooth"});
      }
    }
  },[highlightPortalIds,mobile,pScale]);

  const showSideElements=!mobile&&size.w>=1100;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",position:"relative",paddingBottom:panelH+16}}>
      {/* ── HEADER ── */}
      <div style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:mobile?"6px 12px":"8px 20px",
        borderBottom:`1px solid rgba(212,175,55,0.15)`,
        background:"rgba(4,2,14,0.88)",backdropFilter:"none",
        zIndex:highlight==="coins"?53:2,flexShrink:0,
        position:"relative",
      }}>
        {/* Left: avatar */}
        <div style={{display:"flex",alignItems:"center",gap:mobile?6:10}}>
          <div style={{
            width:mobile?36:50,height:mobile?36:50,borderRadius:6,
            border:`2px solid rgba(212,175,55,0.5)`,
            background:"rgba(212,175,55,0.08)",display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:mobile?18:26,flexShrink:0,
          }}><img src="https://i.imgur.com/7ofsCSm.png" alt="Maestro" style={{width:"100%",height:"100%",objectFit:"contain",borderRadius:4}}/></div>
          {!mobile&&(
            <div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:700,
                color:C.goldBright,letterSpacing:1,textShadow:`0 0 6px ${C.goldGlow}`}}>TEMPLARIO</div>
              <div style={{fontSize:9,color:"rgba(212,175,55,0.55)",letterSpacing:2,textTransform:"uppercase"}}>
                Maestro en Formación</div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                <div style={{width:100,height:5,background:"rgba(255,255,255,0.1)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:"28%",background:"linear-gradient(90deg,#1a8a00,#44FF44,#88FF88)",borderRadius:3}}/>
                </div>
                <span style={{fontSize:9,color:"rgba(255,255,255,0.35)"}}>0/100 XP</span>
              </div>
            </div>
          )}
        </div>
        {/* Center title */}
        <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:mobile?16:20,fontWeight:900,
          color:C.goldBright,textShadow:`0 0 10px ${C.gold}`,
          letterSpacing:mobile?2:4}}>Propo-Tienda</div>
        {/* Right: stats */}
        <div style={{display:"flex",gap:mobile?4:8}}>
          {[["🪙",coins.toLocaleString(),"PROPOCOINS"],["⚔","Nv.1","TEMPLARIO"]].map(([ic,val,lbl],idx)=>{
            const isCoins=idx===0;
            const glowing=isCoins&&highlight==="coins";
            return (
              <motion.div key={lbl}
                animate={glowing?{scale:[1,1.06,1]}:{}}
                transition={{duration:1.5,repeat:Infinity,ease:"easeInOut"}}
                style={{
                  display:"flex",alignItems:"center",gap:mobile?3:6,
                  background:glowing?"rgba(212,175,55,0.18)":"rgba(0,0,0,0.45)",
                  border:`1px solid ${glowing?C.goldBright:"rgba(212,175,55,0.28)"}`,
                  borderRadius:20,padding:mobile?"3px 7px":"4px 10px",
                  boxShadow:glowing?`0 0 12px rgba(212,175,55,0.5)`:"none",
                  position:"relative",zIndex:glowing?53:1,
                  willChange:glowing?"transform":"auto",
                }}>
                {glowing&&<GlowRing color={C.goldBright} size={mobile?80:110}/>}
                <span style={{fontSize:mobile?12:14,
                  filter:glowing?`drop-shadow(0 0 4px ${C.goldBright})`:"none"}}>{ic}</span>
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:mobile?9:10,fontWeight:700,
                    color:C.goldBright,
                    textShadow:glowing?`0 0 5px ${C.goldGlow}`:"none"}}>{val}</div>
                  {!mobile&&<div style={{fontSize:7,color:glowing?"rgba(212,175,55,0.7)":"rgba(255,255,255,0.3)",letterSpacing:1}}>{lbl}</div>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── TITLE BLOCK ── */}
      <TitleShimmer mobile={mobile}/>

      {/* ── PORTAL AREA ── */}
      <div style={{
        flex:1,display:"flex",alignItems:"center",justifyContent:"center",
        position:"relative",minHeight:0,overflowY:"auto",overflowX:"hidden",
        zIndex:highlightPortalIds.length>0?53:2,
      }}>
        {/* Side elements: only on wide desktop */}
        {showSideElements&&(
          <>
            <motion.div
              animate={{opacity:(highlight&&highlight!=="coins")?0.1:1}}
              style={{position:"absolute",left:16,top:"50%",transform:"translateY(-60%)",
                width:160,background:"rgba(10,5,32,0.96)",
                border:`1px solid rgba(212,175,55,0.38)`,borderRadius:8,padding:"10px 12px",
                zIndex:highlight==="coins"?53:1}}>
              <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                <span style={{fontSize:20}}>🪙</span>
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:700,color:C.goldBright}}>
                    OFERTAS ESPECIALES</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",marginTop:2,lineHeight:1.4}}>
                    Descuentos únicos por tiempo limitado</div>
                  <div style={{fontSize:9,color:C.amber,marginTop:4}}>⏱ <CountdownBadge/></div>
                </div>
              </div>
            </motion.div>
            <div
              style={{position:"absolute",left:130,bottom:44,width:150,height:250,zIndex:highlight==="coins"?53:1,
                animation:"floatIcon 3s ease-in-out infinite alternate",
                opacity:(highlight&&highlight!=="coins")?0.1:1,transition:"opacity 0.3s"}}>
              {/* objectFit:"contain" sin borderRadius circular: el círculo anterior
                  recortaba la cabeza y la punta del bastón del personaje */}
              <img src="https://i.imgur.com/7ofsCSm.png" alt="Maestro" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
            </div>
          </>
        )}

        {/* Personaje en móvil: lado derecho, debajo de PropoCoins/XP,
            ocupando el espacio oscuro vacío junto a "Mi Perfil" */}
        {mobile&&(
          <motion.div
            animate={{opacity:(highlight&&highlight!=="coins")?0.1:1}}
            style={{position:"absolute",right:2,top:4,
              width:Math.min(96,size.w*0.26),height:Math.min(190,availH*0.68),
              zIndex:highlight==="coins"?53:2,pointerEvents:"none",
              transition:"opacity 0.3s"}}>
            <img src="https://i.imgur.com/7ofsCSm.png" alt="Maestro" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
          </motion.div>
        )}

        {/* PORTALS ROW */}
        <div
          ref={portalScrollRef}
          style={{
            display:"flex",alignItems:"center",
            gap:mobile?8:8,
            padding:mobile?"8px 20px":"0 20px",
            overflowX:mobile?"auto":"visible",
            overflowY:"hidden",
            width:"100%",
            justifyContent:mobile?"flex-start":"center",
            scrollbarWidth:"none",
            msOverflowStyle:"none",
            WebkitOverflowScrolling:"touch",
          }}>
          {PORTALS.map(p=>(
            <div key={p.id} style={{
              position:"relative",
              zIndex:highlightPortalIds.includes(p.id)?53:1,
              flexShrink:0,
            }}>
              <Portal {...p}
                active={highlightPortalIds.includes(p.id)}
                dimmed={dim(p.id)}
                pScale={pScale}/>
            </div>
          ))}
        </div>

        {/* Mobile scroll hint */}
        {mobile&&!highlightPortalIds.length&&(
          <div style={{
            position:"absolute",right:0,top:0,bottom:0,width:32,
            background:"linear-gradient(to right,transparent,rgba(4,2,14,0.7))",
            pointerEvents:"none",zIndex:3,
          }}/>
        )}
      </div>

      {/* ── PROTOCOLO BANNER (el corazón de la app) ── */}
      <motion.div
        animate={{scale:highlight==="protocolo"?[1,1.015,1]:1}}
        transition={highlight==="protocolo"?{duration:1.6,repeat:Infinity,ease:"easeInOut"}:{duration:0.3}}
        style={{display:"flex",alignItems:"center",justifyContent:"center",gap:mobile?8:14,
          padding:mobile?"9px 14px":"10px 20px",
          borderTop:`1px solid rgba(212,175,55,0.15)`,borderBottom:`1px solid rgba(212,175,55,0.15)`,
          background:highlight==="protocolo"
            ?`linear-gradient(90deg,rgba(204,68,255,0.30),rgba(255,122,34,0.30))`
            :`linear-gradient(90deg,rgba(204,68,255,0.12),rgba(255,122,34,0.12))`,
          position:"relative",zIndex:highlight==="protocolo"?53:2,flexShrink:0,
          boxShadow:highlight==="protocolo"?`0 0 24px rgba(255,122,34,0.55)`:"none",
        }}>
        {highlight==="protocolo"&&<GlowRing color={C.orange} size={mobile?260:380}/>}
        <span style={{fontSize:mobile?9:10,fontFamily:"'Cinzel',serif",fontWeight:700,
          letterSpacing:1,color:"#fff",background:C.purple,borderRadius:12,
          padding:"2px 8px",flexShrink:0}}>● ACTIVO</span>
        <span style={{fontSize:mobile?16:18,
          filter:highlight==="protocolo"?`drop-shadow(0 0 6px ${C.orange})`:"none"}}>⚔️</span>
        <div style={{textAlign:mobile?"left":"center"}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:mobile?11:14,fontWeight:700,
            letterSpacing:1,color:C.goldBright,
            textShadow:highlight==="protocolo"?`0 0 12px ${C.orangeGlow}`:"none"}}>
            CONTINÚA TU PROTOCOLO
          </div>
          {!mobile&&<div style={{fontSize:9,color:"rgba(255,255,255,0.5)"}}>
            Tu Evaluación Semanal te espera · menos de 5 minutos
          </div>}
        </div>
      </motion.div>

      {/* ── BOTTOM NAV ── */}
      <div style={{
          display:"flex",alignItems:"center",justifyContent:"flex-end",
          padding:mobile?"5px 14px":"5px 20px",
          background:"rgba(4,2,14,0.96)",
          borderTop:`1px solid rgba(212,175,55,0.15)`,
          position:"relative",zIndex:2,flexShrink:0,
          opacity:highlight?0.08:1,transition:"opacity 0.3s",
        }}>
        <div style={{display:"flex",gap:mobile?16:28}}>
          {[["🛒","Tienda"],["🎒","Arsenal"],["⚙","Perfil"]].map(([ic,lbl])=>(
            <div key={lbl} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <span style={{fontSize:mobile?16:18}}>{ic}</span>
              <span style={{fontSize:mobile?7:8,color:"rgba(255,255,255,0.35)",
                letterSpacing:1,textTransform:"uppercase"}}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── STAFF VISUAL (Canvas) ───────────────────────────────
const STAFF_SPHERES=[
  {name:"Cuerpo",        color:C.red,   icon:"💪"},
  {name:"Mente",         color:C.blue,  icon:"🧠"},
  {name:"Emociones",     color:C.pink,  icon:"❤️"},
  {name:"Relaciones",    color:C.green, icon:"👥"},
  {name:"Riqueza",       color:C.gold,  icon:"💰"},
  {name:"Vocación",      color:C.purple,icon:"🎯"},
  {name:"Espiritualidad",color:C.cyan,  icon:"🌸"},
  {name:"Ocio",          color:C.orange,icon:"🌴"},
];

function StaffVisual({activeTerritoryIdx}) {
  const canvasRef=useRef(null);
  const frameRef=useRef(null);
  const tRef=useRef(0);
  const sphereAngles=useRef(STAFF_SPHERES.map((_,i)=>(i/STAFF_SPHERES.length)*Math.PI*2));

  useEffect(()=>{
    const canvas=canvasRef.current;
    if (!canvas) return;
    const ctx=canvas.getContext("2d");

    function resize() {
      canvas.width=canvas.offsetWidth*window.devicePixelRatio;
      canvas.height=canvas.offsetHeight*window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio,window.devicePixelRatio);
    }
    resize();

    function hexToRgbArr(hex) {
      const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return r?[parseInt(r[1],16),parseInt(r[2],16),parseInt(r[3],16)]:[255,255,255];
    }

    let lastTime=0;
    function drawFrame(timestamp) {
      if (timestamp-lastTime<50) { frameRef.current=requestAnimationFrame(drawFrame); return; }
      lastTime=timestamp;
      const W=canvas.offsetWidth,H=canvas.offsetHeight;
      ctx.clearRect(0,0,W,H);
      tRef.current++;
      const t=tRef.current;
      const cx=W/2,cy=activeTerritoryIdx>=0?(H*0.32):H*0.42;
      const staffH=H*0.62;
      const topY=cy-staffH*0.08;
      const botY=topY+staffH;
      const coreSphereR=Math.min(W,H)*0.10;
      const orbitR=coreSphereR*2.7;

      sphereAngles.current=sphereAngles.current.map(a=>a+0.006);

      const activeColor=activeTerritoryIdx>=0?STAFF_SPHERES[activeTerritoryIdx]?.color||C.gold:C.gold;
      const [ar,ag,ab]=hexToRgbArr(activeColor);

      const grd=ctx.createLinearGradient(cx-8,topY,cx+8,botY);
      grd.addColorStop(0,"#1a1010");grd.addColorStop(0.3,"#3d2a0a");
      grd.addColorStop(0.7,"#2a1a05");grd.addColorStop(1,"#0d0508");
      ctx.save();
      ctx.shadowBlur=activeTerritoryIdx>=0?22:8;ctx.shadowColor=activeColor;
      ctx.fillStyle=grd;ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(cx-7,topY,14,botY-topY,3);
      else ctx.rect(cx-7,topY,14,botY-topY);
      ctx.fill();
      ctx.strokeStyle=activeTerritoryIdx>=0?activeColor:"#b8860b";
      ctx.lineWidth=activeTerritoryIdx>=0?2.5:1.5;
      ctx.shadowBlur=0;ctx.shadowColor=activeColor;
      ctx.beginPath();ctx.moveTo(cx-7,topY);ctx.lineTo(cx-7,botY);ctx.stroke();
      ctx.beginPath();ctx.moveTo(cx+7,topY);ctx.lineTo(cx+7,botY);ctx.stroke();
      for (let i=0;i<3;i++) {
        const ry=topY+(botY-topY)*(0.28+i*0.22);
        ctx.strokeStyle=activeTerritoryIdx>=0?activeColor:"#d4af37";
        ctx.lineWidth=2.5;ctx.shadowBlur=0;
        ctx.beginPath();ctx.ellipse(cx,ry,12,5,0,0,Math.PI*2);ctx.stroke();
      }
      ctx.fillStyle=activeTerritoryIdx>=0?activeColor:"#d4af37";
      ctx.shadowColor=activeTerritoryIdx>=0?activeColor:"#d4af37";
      ctx.shadowBlur=activeTerritoryIdx>=0?18:8;
      const gemY=topY+(botY-topY)*0.5;
      ctx.beginPath();ctx.moveTo(cx,gemY-10);ctx.lineTo(cx+7,gemY);ctx.lineTo(cx,gemY+10);ctx.lineTo(cx-7,gemY);ctx.closePath();ctx.fill();
      if (activeTerritoryIdx>=0) {
        ctx.globalAlpha=0.4;ctx.shadowBlur=25;
        ctx.beginPath();ctx.moveTo(cx,gemY-10);ctx.lineTo(cx+7,gemY);ctx.lineTo(cx,gemY+10);ctx.lineTo(cx-7,gemY);ctx.closePath();ctx.fill();
        ctx.globalAlpha=1;
      }
      ctx.restore();

      ctx.save();
      ctx.strokeStyle="#d4af37";ctx.lineWidth=3;ctx.shadowColor="#f59e0b";ctx.shadowBlur=10;
      ctx.beginPath();ctx.arc(cx,cy,coreSphereR+18,0,Math.PI*2);ctx.stroke();
      ctx.lineWidth=1.5;ctx.strokeStyle="#b8860b";
      ctx.beginPath();ctx.arc(cx,cy,coreSphereR+12,0,Math.PI*2);ctx.stroke();
      for (let i=0;i<8;i++) {
        const a=(i/8)*Math.PI*2,r1=coreSphereR+10,r2=coreSphereR+22;
        ctx.strokeStyle="#d4af37";ctx.lineWidth=2;ctx.shadowBlur=0;
        ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);ctx.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);ctx.stroke();
      }
      ctx.restore();

      const pulse=Math.sin(t*0.06)*0.5+0.5;
      ctx.save();
      const gr=ctx.createRadialGradient(cx,cy,coreSphereR*0.1,cx,cy,coreSphereR+20);
      gr.addColorStop(0,`rgba(${ar},${ag},${ab},${0.35+pulse*0.15})`);gr.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(cx,cy,coreSphereR+20,0,Math.PI*2);ctx.fill();
      const sg=ctx.createRadialGradient(cx-coreSphereR*0.3,cy-coreSphereR*0.3,coreSphereR*0.05,cx,cy,coreSphereR);
      sg.addColorStop(0,`rgba(${Math.min(255,ar+120)},${Math.min(255,ag+100)},${Math.min(255,ab+80)},0.9)`);
      sg.addColorStop(0.5,`rgba(${Math.min(255,ar+40)},${Math.min(255,ag+30)},${ab},0.88)`);
      sg.addColorStop(1,`rgba(${Math.max(0,ar-30)},${Math.max(0,ag-30)},${Math.max(0,ab-30)},0.92)`);
      ctx.fillStyle=sg;ctx.shadowColor=activeColor;ctx.shadowBlur=14+pulse*8;
      ctx.beginPath();ctx.arc(cx,cy,coreSphereR,0,Math.PI*2);ctx.fill();
      const hg=ctx.createRadialGradient(cx-coreSphereR*0.35,cy-coreSphereR*0.35,0,cx-coreSphereR*0.2,cy-coreSphereR*0.2,coreSphereR*0.6);
      hg.addColorStop(0,"rgba(255,255,255,0.42)");hg.addColorStop(1,"rgba(255,255,255,0)");
      ctx.fillStyle=hg;ctx.beginPath();ctx.arc(cx,cy,coreSphereR,0,Math.PI*2);ctx.fill();
      if (activeTerritoryIdx>=0) {
        ctx.shadowBlur=0;ctx.font=`${coreSphereR*0.88}px serif`;
        ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.fillText(STAFF_SPHERES[activeTerritoryIdx]?.icon||"✦",cx,cy);
      } else {
        ctx.shadowBlur=0;ctx.font=`${coreSphereR*0.72}px serif`;
        ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("✦",cx,cy);
      }
      ctx.restore();

      STAFF_SPHERES.forEach((s,i)=>{
        const angle=sphereAngles.current[i];
        const sx=cx+Math.cos(angle)*orbitR;
        const sy=cy+Math.sin(angle)*orbitR;
        const isActive=i===activeTerritoryIdx;
        const opacity=isActive?1:(activeTerritoryIdx>=0?0.22:0.72);
        const sr=coreSphereR*0.46;
        const [cr,cg,cb]=hexToRgbArr(s.color);
        ctx.save();
        ctx.strokeStyle=`rgba(${cr},${cg},${cb},${isActive?0.45:0.1})`;
        ctx.lineWidth=isActive?2:0.8;ctx.setLineDash([4,6]);
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(sx,sy);ctx.stroke();
        ctx.setLineDash([]);ctx.restore();
        ctx.save();ctx.globalAlpha=opacity;
        const glowG=ctx.createRadialGradient(sx,sy,sr*0.2,sx,sy,sr*1.6);
        glowG.addColorStop(0,`rgba(${cr},${cg},${cb},${isActive?0.55:0.25})`);glowG.addColorStop(1,"rgba(0,0,0,0)");
        ctx.fillStyle=glowG;ctx.beginPath();ctx.arc(sx,sy,sr*1.6,0,Math.PI*2);ctx.fill();
        const ssg=ctx.createRadialGradient(sx-sr*0.3,sy-sr*0.3,sr*0.05,sx,sy,sr);
        ssg.addColorStop(0,`rgba(${Math.min(255,cr+90)},${Math.min(255,cg+90)},${Math.min(255,cb+90)},0.95)`);
        ssg.addColorStop(0.6,`rgba(${cr},${cg},${cb},0.9)`);
        ssg.addColorStop(1,`rgba(${Math.max(0,cr-50)},${Math.max(0,cg-50)},${Math.max(0,cb-50)},0.95)`);
        ctx.fillStyle=ssg;ctx.shadowColor=s.color;ctx.shadowBlur=isActive?12:0;
        ctx.beginPath();ctx.arc(sx,sy,isActive?sr*1.22:sr,0,Math.PI*2);ctx.fill();
        const shg=ctx.createRadialGradient(sx-sr*0.35,sy-sr*0.4,0,sx-sr*0.2,sy-sr*0.2,sr*0.6);
        shg.addColorStop(0,"rgba(255,255,255,0.45)");shg.addColorStop(1,"rgba(255,255,255,0)");
        ctx.fillStyle=shg;ctx.beginPath();ctx.arc(sx,sy,isActive?sr*1.22:sr,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;ctx.font=`${(isActive?sr*1.22:sr)*0.88}px serif`;
        ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.fillText(s.icon,sx,sy);ctx.restore();
      });

    frameRef.current=requestAnimationFrame(drawFrame);
    }

    frameRef.current=requestAnimationFrame(drawFrame);
    return ()=>{ if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  },[activeTerritoryIdx]);

  return <canvas ref={canvasRef} style={{width:"100%",height:"100%",display:"block"}}/>;
}

// ─── TERRITORIES SCREEN ──────────────────────────────────
function TerritoriesScreen({highlight,mobile,panelH}) {
  const activeIdx=(highlight&&highlight.startsWith("t_")&&!highlight.includes("conn"))
    ?parseInt(highlight.replace("t_","")):-1;

  if (mobile) {
    return (
      <div style={{display:"flex",flexDirection:"column",height:"100%",position:"relative"}}>
        <div style={{
          height:activeIdx>=0?"52%":"38%",flexShrink:0,position:"relative",
          zIndex:(activeIdx>=0||highlight==="t_connections")?53:2,
        }}>
          <motion.div
            animate={{
              scale:highlight==="t_connections"?1.12:1,
              filter:highlight==="t_connections"
                ?`drop-shadow(0 0 10px ${C.gold}) brightness(1.2)`
                :"none",
            }}
            transition={{duration:0.82,ease:"easeOut"}}
            style={{width:"100%",height:"100%"}}>
            <StaffVisual activeTerritoryIdx={activeIdx}/>
          </motion.div>
        </div>
        <div style={{
          flex:1,overflowY:"auto",overflowX:"hidden",
          padding:`0 12px ${panelH+16}px`,
          zIndex:(activeIdx>=0||highlight==="t_connections")?53:2,
          position:"relative",
        }}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:3,
            color:"rgba(212,175,55,0.45)",margin:"8px 0",textTransform:"uppercase",textAlign:"center"}}>
            Territorios del Templo</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {TERRITORIES.map((t,i)=>{
              const isActive=activeIdx===i;
              const isDimmed=highlight&&!highlight.includes("conn")&&activeIdx!==-1&&!isActive;
              return (
                <motion.div key={t.name}
                  animate={{
                    opacity:isDimmed?0.05:1,x:isActive?6:0,
                    scale:isActive?1.02:1,
                  }}
                  transition={{duration:0.3}}
                  style={{display:"flex",alignItems:"center",gap:10,
                    background:isActive
                      ?`linear-gradient(135deg,rgba(${hexToRgb(t.color)},0.18),rgba(${hexToRgb(t.color)},0.05))`
                      :"rgba(10,5,32,0.7)",
                    border:`1px solid ${isActive?t.color:"rgba(255,255,255,0.08)"}`,
                    boxShadow:isActive?`0 0 10px rgba(${hexToRgb(t.color)},0.35)`:"none",
                    borderRadius:10,padding:"8px 12px",position:"relative",zIndex:isActive?53:1,
                    willChange:"transform,opacity"}}>
                  {isActive&&<GlowRing color={t.color} size={50}/>}
                  <span style={{fontSize:22,
                    filter:isActive?`drop-shadow(0 0 5px ${t.color})`:"none"}}>{t.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:700,
                      color:isActive?"#fff":"rgba(255,255,255,0.75)",letterSpacing:1,
                      textShadow:isActive?`0 0 6px ${t.color}`:"none"}}>{t.name.toUpperCase()}</div>
                    {isActive&&(
                      <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}
                        style={{fontSize:11,color:"rgba(255,255,255,0.78)",marginTop:3,lineHeight:1.5}}>
                        {t.desc}</motion.div>
                    )}
                  </div>
                  <div style={{width:8,height:8,borderRadius:"50%",
                    background:isActive?"#fff":t.color,flexShrink:0,
                    boxShadow:isActive?`0 0 10px ${t.color}`:"none"}}/>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── DESKTOP layout ──
  return (
    <div style={{display:"flex",height:"100%",position:"relative"}}>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",
        position:"relative",zIndex:(activeIdx>=0||highlight==="t_connections")?53:2}}>
        <motion.div
          animate={{
            scale:highlight==="t_connections"?1.48:1,
            filter:highlight==="t_connections"
              ?`drop-shadow(0 0 14px ${C.gold}) brightness(1.2)`:"none",
            x:highlight==="t_connections"?60:0,
          }}
          transition={{duration:0.82,ease:"easeOut"}}
          style={{width:"100%",height:"100%",maxWidth:340,maxHeight:520}}>
          <StaffVisual activeTerritoryIdx={activeIdx}/>
        </motion.div>
      </div>
      <motion.div
        animate={{opacity:highlight==="t_connections"?0:1,x:highlight==="t_connections"?40:0}}
        transition={{duration:0.55}}
        style={{width:360,padding:`20px 20px ${panelH+20}px 0`,
          display:"flex",flexDirection:"column",justifyContent:"flex-start",gap:8,
          overflowY:"auto",
          position:"relative",zIndex:(activeIdx>=0||highlight==="t_connections")?53:2,
          pointerEvents:highlight==="t_connections"?"none":"auto"}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:12,letterSpacing:4,
          color:"rgba(212,175,55,0.45)",marginBottom:8,textTransform:"uppercase"}}>
          Territorios del Templo</div>
        {TERRITORIES.map((t,i)=>{
          const isActive=activeIdx===i;
          const isDimmed=highlight&&!highlight.includes("conn")&&activeIdx!==-1&&!isActive;
          return (
            <motion.div key={t.name}
              animate={{
                opacity:isDimmed?0.05:1,x:isActive?10:0,
                scale:isActive?1.03:1,
              }}
              transition={{duration:0.3}}
              style={{display:"flex",alignItems:"center",gap:12,
                background:isActive?`linear-gradient(135deg,rgba(${hexToRgb(t.color)},0.22),rgba(${hexToRgb(t.color)},0.06))`:"rgba(10,5,32,0.7)",
                border:`1px solid ${isActive?t.color:"rgba(255,255,255,0.08)"}`,
                boxShadow:isActive?`0 0 12px rgba(${hexToRgb(t.color)},0.4)`:"none",
                borderRadius:10,padding:"10px 14px",position:"relative",zIndex:isActive?53:1,
                willChange:"transform,opacity"}}>
              {isActive&&<GlowRing color={t.color} size={60}/>}
              <span style={{fontSize:28,
                filter:isActive?`drop-shadow(0 0 5px ${t.color})`:"none"}}>{t.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:700,
                  color:isActive?"#fff":"rgba(255,255,255,0.75)",letterSpacing:1.5,
                  textShadow:isActive?`0 0 7px ${t.color}`:"none"}}>
                  {t.name.toUpperCase()}</div>
                {isActive&&(
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}
                    style={{fontSize:12,color:"rgba(255,255,255,0.8)",marginTop:3,lineHeight:1.6}}>
                    {t.desc}</motion.div>
                )}
              </div>
              <div style={{width:10,height:10,borderRadius:"50%",
                background:isActive?"#fff":t.color,flexShrink:0,
                boxShadow:isActive?`0 0 12px ${t.color}`:"none"}}/>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ─── EVALUATION SCREEN ───────────────────────────────────
const EVAL_CATEGORIES=["Visión","Control","Influencia","Autonomía","Realización"];
const EVAL_QUESTIONS=[
  {id:"V1",text:"Tengo claridad total de lo que quiero construir este año"},
  {id:"V2",text:"Sé exactamente cuáles son mis 3 prioridades actuales"},
  {id:"V3",text:"Planifico mi semana antes de comenzarla"},
  {id:"V4",text:"Evito tareas que no aportan a mis metas principales"},
  {id:"V5",text:"Siento dirección y propósito en mi día a día"},
];

function EvalSlider({value=5,mobile}) {
  const pct=(value/10)*100;
  return (
    <div style={{marginTop:10}}>
      <div style={{position:"relative",height:6,borderRadius:3,background:"rgba(255,255,255,0.08)"}}>
        <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${pct}%`,
          borderRadius:3,background:`linear-gradient(90deg,${C.blue},${C.cyan})`}}/>
        <div style={{position:"absolute",top:"50%",left:`${pct}%`,
          width:16,height:16,borderRadius:"50%",background:"#fff",
          border:`2px solid ${C.blue}`,transform:"translate(-50%,-50%)",
          boxShadow:`0 0 8px ${C.blueGlow}`}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
        {Array.from({length:5}).map((_,i)=>(
          <div key={i} style={{height:3,width:"18%",borderRadius:2,
            background:i<Math.round(value/2)?C.blue:"rgba(255,255,255,0.08)"}}/>
        ))}
      </div>
    </div>
  );
}

function EvaluationScreen({mobile,panelH}) {
  return (
    <div style={{height:"100%",overflowY:"auto",
      padding:mobile?`16px 14px ${panelH+20}px`:`28px 60px ${panelH+30}px`}}>
      <div style={{maxWidth:620,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:mobile?10:12,letterSpacing:2,
            color:"rgba(255,255,255,0.55)",textTransform:"uppercase"}}>Progreso de Evaluación</div>
          <div style={{fontSize:mobile?11:12,color:"rgba(255,255,255,0.55)"}}>1 de 5</div>
        </div>
        <div style={{height:5,borderRadius:3,background:"rgba(255,255,255,0.08)",marginBottom:16}}>
          <div style={{height:"100%",width:"20%",borderRadius:3,
            background:`linear-gradient(90deg,${C.blue},${C.cyan})`,
            boxShadow:`0 0 8px ${C.blueGlow}`}}/>
        </div>
        <div style={{display:"flex",gap:mobile?6:10,overflowX:"auto",marginBottom:16,paddingBottom:4}}>
          {EVAL_CATEGORIES.map((cat,i)=>(
            <div key={cat} style={{flexShrink:0,padding:mobile?"6px 10px":"8px 16px",
              borderRadius:8,fontFamily:"'Cinzel',serif",fontSize:mobile?9:11,fontWeight:700,
              letterSpacing:1,whiteSpace:"nowrap",
              color:i===0?"#fff":"rgba(255,255,255,0.35)",
              borderBottom:i===0?`2px solid ${C.blue}`:"2px solid transparent",
              textShadow:i===0?`0 0 8px ${C.blueGlow}`:"none"}}>
              {cat}
            </div>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14,
          background:`linear-gradient(135deg,${C.blue},#2255CC)`,
          borderRadius:14,padding:mobile?"14px 16px":"18px 22px",marginBottom:18,
          boxShadow:`0 0 20px rgba(68,136,255,0.25)`}}>
          <div style={{width:mobile?38:46,height:mobile?38:46,borderRadius:"50%",
            background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:mobile?18:22,flexShrink:0}}>👁</div>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:mobile?16:20,fontWeight:900,
              color:"#fff"}}>Visión</div>
            <div style={{fontSize:mobile?11:12,color:"rgba(255,255,255,0.85)",marginTop:2}}>
              Claridad de propósito y dirección de vida</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {EVAL_QUESTIONS.map(q=>(
            <div key={q.id} style={{background:"rgba(255,255,255,0.04)",
              border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,
              padding:mobile?"12px 14px":"16px 18px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{display:"inline-block",fontFamily:"'Cinzel',serif",fontSize:9,
                    fontWeight:700,letterSpacing:1,color:C.blue,
                    background:"rgba(68,136,255,0.12)",borderRadius:4,
                    padding:"2px 6px",marginBottom:6}}>{q.id}</div>
                  <div style={{fontSize:mobile?12:13,color:C.blue,fontWeight:600,lineHeight:1.4}}>
                    {q.text}</div>
                </div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:mobile?14:16,fontWeight:900,
                  color:"#fff",flexShrink:0}}>5</div>
              </div>
              <EvalSlider value={5} mobile={mobile}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:20,gap:10}}>
          <div style={{flex:1,textAlign:"center",padding:mobile?"9px 0":"11px 0",
            borderRadius:8,border:"1px solid rgba(255,255,255,0.12)",
            fontFamily:"'Cinzel',serif",fontSize:mobile?11:12,fontWeight:700,
            color:"rgba(255,255,255,0.4)"}}>← Anterior</div>
          <div style={{flex:1,textAlign:"center",padding:mobile?"9px 0":"11px 0",
            borderRadius:8,background:`linear-gradient(90deg,${C.blue},${C.cyan})`,
            fontFamily:"'Cinzel',serif",fontSize:mobile?11:12,fontWeight:700,color:"#fff",
            boxShadow:`0 0 12px ${C.blueGlow}`}}>Siguiente →</div>
        </div>
      </div>
    </div>
  );
}

// ─── MODULES SCREEN ──────────────────────────────────────
function ModulesScreen({highlight,coins,filterType,setFilterType,selectedModule,setSelectedModule,mobile,panelH}) {
  const filters=["TODOS","CLAVES","VICTORIAS","MAPAS"];
  const showDetail=highlight==="module_detail";

  useEffect(()=>{
    if (showDetail&&!selectedModule&&MODULES.length>0) setSelectedModule(MODULES[0]);
  },[showDetail]);

  const filtered=MODULES.filter(m=>{
    if (filterType==="TODOS") return true;
    if (filterType==="CLAVES") return m.type==="CLAVE";
    if (filterType==="VICTORIAS") return m.type==="VICTORIA RÁPIDA";
    if (filterType==="MAPAS") return m.type==="MAPA";
    return true;
  });

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",
      padding:mobile?"12px 12px 0":"16px 20px 0",overflow:"hidden"}}>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:mobile?16:20,fontWeight:900,
        color:C.goldBright,textShadow:`0 0 10px ${C.goldGlow}`,
        letterSpacing:mobile?2:4,textAlign:"center",marginBottom:mobile?6:10,flexShrink:0}}>
        TIENDA DEL TEMPLO</div>

      {/* Filters */}
      <motion.div animate={{opacity:showDetail?0.08:1}}
        style={{display:"flex",gap:mobile?5:8,justifyContent:"center",
          marginBottom:mobile?8:14,flexShrink:0,flexWrap:"wrap"}}>
        {filters.map(f=>(
          <motion.button key={f} onClick={()=>setFilterType(f)} whileHover={{scale:1.04}}
            style={{padding:mobile?"4px 10px":"5px 14px",borderRadius:20,cursor:"pointer",
              border:`1px solid ${filterType===f?C.gold:"rgba(212,175,55,0.22)"}`,
              background:filterType===f?"rgba(212,175,55,0.13)":"transparent",
              color:filterType===f?C.goldBright:"rgba(255,255,255,0.45)",
              fontFamily:"'Cinzel',serif",fontSize:mobile?8:9,letterSpacing:1,
              boxShadow:filterType===f?`0 0 6px ${C.goldGlow}`:"none"}}>{f}</motion.button>
        ))}
      </motion.div>

      {/* Grid */}
      <div style={{flex:1,display:"grid",
        gridTemplateColumns:mobile?"repeat(auto-fill,minmax(150px,1fr))":"repeat(auto-fill,minmax(195px,1fr))",
        gap:mobile?8:12,
        overflowY:"auto",paddingBottom:panelH+16,
        position:"relative",zIndex:highlight?53:2}}>
        {filtered.map((m,i)=>{
          const isSelected=showDetail&&((selectedModule?.title===m.title)||(i===0&&!selectedModule));
          return (
            <motion.div key={m.title}
              animate={{
                opacity:(showDetail&&!isSelected)?0.05:1,
                scale:isSelected?1.04:1,
              }}
              transition={{duration:0.35}}
              onClick={()=>setSelectedModule(m)}
              style={{background:`radial-gradient(ellipse at top,rgba(${hexToRgb(m.color)},0.09),rgba(4,2,14,0.96))`,
                border:`1px solid ${isSelected?m.color:`rgba(${hexToRgb(m.color)},0.35)`}`,
                borderRadius:12,padding:mobile?"10px 10px":"14px 12px",cursor:"pointer",
                position:"relative",zIndex:isSelected?53:1,
                filter:isSelected?`brightness(1.15) drop-shadow(0 0 6px ${m.color})`:"none",
                boxShadow:isSelected?`0 0 8px rgba(${hexToRgb(m.color)},0.3)`:"none",
                willChange:"transform,opacity"}}>
              {isSelected&&<GlowRing color={m.color} size={70}/>}
              <div style={{fontSize:mobile?26:34,marginBottom:mobile?6:8,
                filter:isSelected?`drop-shadow(0 0 6px ${m.color})`:"none"}}>{m.icon}</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:mobile?10:11,fontWeight:700,
                color:isSelected?"#fff":"rgba(255,255,255,0.82)",letterSpacing:0.5}}>{m.title}</div>
              <div style={{fontSize:mobile?8:9,color:"rgba(255,255,255,0.38)",marginTop:2}}>{m.territory}</div>
              <div
                style={{marginTop:mobile?6:10,display:"flex",alignItems:"center",justifyContent:"space-between",
                  background:highlight==="price"?"rgba(212,175,55,0.15)":"rgba(0,0,0,0.3)",
                  border:`1px solid ${highlight==="price"?C.gold:"rgba(212,175,55,0.18)"}`,
                  boxShadow:highlight==="price"?`0 0 6px ${C.goldGlow}`:"none",
                  borderRadius:6,padding:"4px 8px",position:"relative",zIndex:highlight==="price"?53:1}}>
                <span style={{fontSize:mobile?11:13}}>🪙</span>
                <span style={{fontFamily:"'Cinzel',serif",fontSize:mobile?10:12,fontWeight:700,color:C.goldBright}}>
                  {m.price.toLocaleString()}</span>
                <span style={{fontSize:mobile?7:9,color:"rgba(255,255,255,0.38)"}}>PropoCoins</span>
              </div>
              {isSelected&&(
                <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}
                  transition={{duration:0.3}}
                  style={{marginTop:10,borderTop:`1px solid rgba(${hexToRgb(m.color)},0.3)`,paddingTop:8}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",lineHeight:1.7}}>
                    ✦ Acceso inmediato al desbloquearse<br/>
                    ✦ Territorio: {m.territory}<br/>
                    ✦ Tipo: {m.type}<br/>
                    ✦ Impacto: Transformación profunda
                  </div>
                  <motion.button whileHover={{scale:1.04,boxShadow:`0 0 10px ${m.color}`}}
                    style={{marginTop:8,width:"100%",padding:"6px",borderRadius:6,cursor:"pointer",
                      background:`linear-gradient(135deg,rgba(${hexToRgb(m.color)},0.28),rgba(${hexToRgb(m.color)},0.08))`,
                      border:`1px solid ${m.color}`,color:"#fff",
                      fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:1}}>
                    CANJEAR POR {m.price} 🪙</motion.button>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ARSENAL SCREEN ──────────────────────────────────────
function ArsenalScreen({highlight,filterT,setFilterT,mobile,panelH}) {
  const [activeType,setActiveType]=useState("TODOS");
  const typeFilters=["TODOS","CLAVES","VICTORIAS RÁPIDAS","MAPAS DEL TEMPLO"];

  const filtered=ARSENAL_ITEMS.filter(a=>{
    if (filterT&&a.territory!==filterT) return false;
    if (activeType!=="TODOS") {
      if (activeType==="CLAVES"&&a.type!=="CLAVE") return false;
      if (activeType==="VICTORIAS RÁPIDAS"&&a.type!=="VICTORIA") return false;
      if (activeType==="MAPAS DEL TEMPLO"&&a.type!=="MAPA") return false;
    }
    return true;
  });

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",
      padding:mobile?"10px 10px 0":"16px 20px 0",overflow:"hidden"}}>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:mobile?16:20,fontWeight:900,
        color:C.goldBright,textShadow:`0 0 10px ${C.goldGlow}`,
        letterSpacing:mobile?2:4,textAlign:"center",marginBottom:mobile?2:4,flexShrink:0}}>
        ⚔ TU ARSENAL</div>
      <div style={{textAlign:"center",fontSize:mobile?8:10,color:"rgba(212,175,55,0.45)",
        letterSpacing:2,marginBottom:mobile?8:12,flexShrink:0}}>TU CONTENIDO DESBLOQUEADO</div>

      {/* Territory filter */}
      <motion.div
        animate={{opacity:highlight==="filters_type"?0.08:1,
          boxShadow:highlight==="filters_territory"?`0 0 10px ${C.goldGlow}`:"none"}}
        style={{display:"flex",gap:mobile?4:8,justifyContent:"center",flexWrap:"wrap",
          marginBottom:mobile?6:10,padding:mobile?"5px":"8px",borderRadius:10,
          border:highlight==="filters_territory"?`1px solid ${C.gold}`:"1px solid transparent",
          position:"relative",zIndex:highlight==="filters_territory"?53:1,flexShrink:0}}>
        {highlight==="filters_territory"&&<GlowRing color={C.gold} size={220}/>}
        <motion.button onClick={()=>setFilterT(null)} whileHover={{scale:1.06}}
          style={{padding:mobile?"3px 9px":"4px 12px",borderRadius:20,cursor:"pointer",
            border:`1px solid ${!filterT?C.gold:"rgba(255,255,255,0.13)"}`,
            background:!filterT?"rgba(212,175,55,0.12)":"transparent",
            color:!filterT?C.goldBright:"rgba(255,255,255,0.38)",
            fontFamily:"'Cinzel',serif",fontSize:mobile?7:8}}>TODOS</motion.button>
        {TERRITORIES.map(t=>(
          <motion.button key={t.name} onClick={()=>setFilterT(filterT===t.name?null:t.name)}
            whileHover={{scale:1.06}}
            style={{padding:mobile?"3px 9px":"4px 12px",borderRadius:20,cursor:"pointer",
              border:`1px solid ${filterT===t.name?t.color:"rgba(255,255,255,0.1)"}`,
              background:filterT===t.name?`rgba(${hexToRgb(t.color)},0.15)`:"transparent",
              color:filterT===t.name?t.color:"rgba(255,255,255,0.38)",
              fontFamily:"'Cinzel',serif",fontSize:mobile?7:8,
              boxShadow:filterT===t.name?`0 0 6px rgba(${hexToRgb(t.color)},0.38)`:"none"}}>
            {t.icon} {mobile?"":`${t.name}`}{mobile?t.name:""}
          </motion.button>
        ))}
      </motion.div>

      {/* Type filter */}
      <motion.div
        animate={{opacity:highlight==="filters_territory"?0.08:1,
          boxShadow:highlight==="filters_type"?`0 0 10px ${C.purpleGlow}`:"none"}}
        style={{display:"flex",gap:mobile?4:8,justifyContent:"center",
          marginBottom:mobile?8:14,padding:mobile?"5px":"8px",borderRadius:10,flexWrap:"wrap",
          border:highlight==="filters_type"?`1px solid ${C.purple}`:"1px solid transparent",
          position:"relative",zIndex:highlight==="filters_type"?53:1,flexShrink:0}}>
        {highlight==="filters_type"&&<GlowRing color={C.purple} size={320}/>}
        {typeFilters.map(f=>(
          <motion.button key={f} onClick={()=>setActiveType(f)} whileHover={{scale:1.04}}
            style={{padding:mobile?"4px 10px":"5px 12px",borderRadius:6,cursor:"pointer",
              border:`1px solid ${activeType===f?C.purple:"rgba(204,68,255,0.18)"}`,
              background:activeType===f?"rgba(204,68,255,0.12)":"transparent",
              color:activeType===f?C.purple:"rgba(255,255,255,0.38)",
              fontFamily:"'Cinzel',serif",fontSize:mobile?8:9,letterSpacing:0.5,
              boxShadow:activeType===f?`0 0 6px ${C.purpleGlow}`:"none"}}>{f}</motion.button>
        ))}
      </motion.div>

      {/* Items grid */}
      <div style={{flex:1,display:"grid",
        gridTemplateColumns:mobile?"repeat(auto-fill,minmax(145px,1fr))":"repeat(auto-fill,minmax(175px,1fr))",
        gap:mobile?8:12,overflowY:"auto",paddingBottom:panelH+16}}>
        <AnimatePresence>
          {filtered.map(item=>(
            <motion.div key={item.title}
              initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}}
              exit={{opacity:0,scale:0.88}} transition={{duration:0.25}}
              style={{background:`radial-gradient(ellipse at top,rgba(${hexToRgb(item.color)},0.1),rgba(4,2,14,0.96))`,
                border:`1px solid rgba(${hexToRgb(item.color)},0.38)`,
                borderRadius:12,padding:mobile?"10px":"14px 12px",cursor:"pointer",
                willChange:"transform,opacity"}}>
              <div style={{fontSize:mobile?28:36,marginBottom:mobile?6:8,
                filter:`drop-shadow(0 0 4px ${item.color})`}}>{item.icon}</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:mobile?9:10,fontWeight:700,
                color:"#fff",letterSpacing:0.5}}>{item.title}</div>
              <div style={{fontSize:mobile?8:9,color:`rgba(${hexToRgb(item.color)},0.8)`,marginTop:3}}>{item.type}</div>
              <div style={{fontSize:mobile?7:8,color:"rgba(255,255,255,0.3)",marginTop:1}}>{item.territory}</div>
              <div style={{marginTop:mobile?6:10,padding:"3px 8px",
                background:"rgba(0,0,0,0.3)",border:`1px solid rgba(${hexToRgb(item.color)},0.22)`,
                borderRadius:4,fontSize:mobile?7:8,color:"rgba(255,255,255,0.45)",textAlign:"center"}}>
                DESBLOQUEADO ✓</div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length===0&&(
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:40,
            color:"rgba(255,255,255,0.2)",fontFamily:"'Cinzel',serif",fontSize:11}}>
            Sin herramientas en este filtro</div>
        )}
      </div>
    </div>
  );
}

// ─── MISSIONS SCREEN ─────────────────────────────────────
const OPERATIONS=[
  {tag:"🛒 PropoTienda",tagColor:"#fbbf24",title:"🔥 Llamado del Templo",
    desc:"Entrar a PropoTienda.",bannerBg:"linear-gradient(135deg,#2b1055,#7303c0)",
    bannerIcon:"🏛",bannerText:"PROPO-TIENDA",xp:10,coins:5},
  {tag:"⚔ 100 Templarios",tagColor:"#a78bfa",title:"👑 El Patrón de la Tribu",
    desc:"Conquista el puesto #1 del grupo de 100 TEMPLARIOS.",bannerBg:"linear-gradient(135deg,#3a2a00,#6b4e00)",
    bannerIcon:"🥇",bannerText:"NÚMERO 1",xp:90,coins:90},
  {tag:"👥 Comunidad",tagColor:"#60a5fa",title:"👑 El Dueño del Servidor",
    desc:"Conquista el Top 1 global de la comunidad.",bannerBg:"linear-gradient(135deg,#3a2a00,#6b4e00)",
    bannerIcon:"🥇",bannerText:"NÚMERO 1",xp:120,coins:120},
  {tag:"🛒 PropoTienda",tagColor:"#fbbf24",title:"🚩 Marcando Territorio",
    desc:"Obtén el Top 10 en 1 ocasión en 100 Templarios.",bannerBg:"linear-gradient(135deg,#3a2a00,#6b4e00)",
    bannerIcon:"🏆",bannerText:"TOP 10",xp:40,coins:40},
];
function MissionsScreen({mobile,panelH}) {
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",position:"relative",
      padding:mobile?`12px 12px ${panelH+16}px`:`16px 22px ${panelH+16}px`,overflowY:"auto"}}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        {[["✦ TODOS",true],["★ PRUEBAS",false],["⚔ OPERACIONES",false],["⚔ 100 TEMPLARIOS",false],["🛒 PROPOTIENDA",false]].map(([t,active])=>(
          <div key={t} style={{fontSize:9,fontFamily:"'Cinzel',serif",letterSpacing:1,
            padding:"6px 12px",borderRadius:20,fontWeight:700,
            background:active?"rgba(139,92,246,0.35)":"rgba(255,255,255,0.04)",
            border:`1px solid ${active?"#a78bfa":"rgba(255,255,255,0.1)"}`,
            color:active?"#e9d5ff":"rgba(255,255,255,0.4)"}}>{t}</div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:14}}>
        {OPERATIONS.map(op=>(
          <div key={op.title} style={{border:"1px solid rgba(96,165,250,0.35)",borderRadius:14,
            padding:14,background:"rgba(10,15,35,0.7)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                  <span style={{fontSize:8,fontFamily:"'Cinzel',serif",letterSpacing:1,
                    color:"rgba(255,255,255,0.4)",textTransform:"uppercase"}}>OPERACIÓN SEMANAL</span>
                  <span style={{fontSize:8,fontWeight:800,color:op.tagColor,background:`${op.tagColor}18`,
                    border:`1px solid ${op.tagColor}55`,borderRadius:10,padding:"1px 6px"}}>{op.tag}</span>
                </div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:700,color:"#fff"}}>{op.title}</div>
              </div>
              <span style={{fontSize:8,fontWeight:800,color:"#fbbf24",background:"rgba(251,191,36,0.12)",
                border:"1px solid rgba(251,191,36,0.4)",borderRadius:8,padding:"2px 7px",flexShrink:0}}>▲ PENDIENTE</span>
            </div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontStyle:"italic",marginBottom:10}}>{op.desc}</div>
            <div style={{height:mobile?76:92,borderRadius:10,background:op.bannerBg,
              display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",
              marginBottom:10,position:"relative",overflow:"hidden"}}>
              <span style={{fontSize:mobile?26:32}}>{op.bannerIcon}</span>
              <span style={{fontFamily:"'Cinzel',serif",fontSize:mobile?11:13,fontWeight:900,
                letterSpacing:1,color:"#fde68a",textShadow:"0 0 10px rgba(251,191,36,0.6)"}}>{op.bannerText}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:8,
              color:"rgba(255,255,255,0.35)",marginBottom:3}}>
              <span>AVANCE DEL INICIADO</span><span>100%</span>
            </div>
            <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:3,marginBottom:10,overflow:"hidden"}}>
              <div style={{height:"100%",width:"100%",background:"#60a5fa",borderRadius:3}}/>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
              <span style={{fontSize:8,color:"rgba(255,255,255,0.35)"}}>✕ RECOMPENSA</span>
              <span style={{fontSize:9,fontWeight:800,color:"#4ade80",background:"rgba(74,222,128,0.1)",
                border:"1px solid rgba(74,222,128,0.4)",borderRadius:8,padding:"2px 8px"}}>★ {op.xp} XP</span>
              <span style={{fontSize:9,fontWeight:800,color:"#fbbf24",background:"rgba(251,191,36,0.1)",
                border:"1px solid rgba(251,191,36,0.4)",borderRadius:8,padding:"2px 8px"}}>🪙 {op.coins}</span>
            </div>
            <div style={{textAlign:"center",padding:"9px 0",borderRadius:8,
              border:"1px solid rgba(96,165,250,0.4)",background:"rgba(96,165,250,0.08)",
              fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:1,color:"#93c5fd",fontWeight:700}}>
              ✕ ¡RECLAMAR RECOMPENSA!</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── VIP SCREEN (Ruleta + Pase de Batalla) ───────────────
const ROULETTE_PRIZES=[
  {icon:"🍌",name:"NanoBanana²",price:"$49 USD",color:"#fbbf24"},
  {icon:"⚡",name:"Claude Showcase",price:"$39 USD",color:"#60a5fa"},
  {icon:"🔮",name:"Perplexity Viral",price:"$29 USD",color:"#a78bfa"},
  {icon:"💎",name:"Supabase + Claude AI",price:"$59 USD",color:"#22d3ee"},
];
const PASS_LEVELS=[
  {n:1,name:"Despertar",icon:"🎁",color:"#60a5fa"},{n:2,name:"Recluta",icon:"🧑",color:"#a78bfa"},
  {n:3,name:"Forjador",icon:"⛏",color:"#f97316"},{n:4,name:"Guardián",icon:"🛡",color:"#34d399"},
  {n:5,name:"Conquistador",icon:"⚔",color:"#f87171"},{n:6,name:"Templario",icon:"🏛",color:"#fbbf24"},
];
function VipScreen({highlight,mobile,panelH}) {
  const ruletaActive=highlight==="ruleta", paseActive=highlight==="pase";
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",position:"relative",
      padding:mobile?`12px 12px ${panelH+16}px`:`16px 22px ${panelH+16}px`,overflowY:"auto",gap:18}}>

      {/* ── RULETA VIP ── */}
      <motion.div animate={{opacity:(highlight&&!ruletaActive)?0.08:1,
          scale:ruletaActive?[1,1.01,1]:1}}
        transition={ruletaActive?{scale:{duration:1.8,repeat:Infinity,ease:"easeInOut"}}:{duration:0.3}}
        style={{position:"relative",zIndex:ruletaActive?53:2,
          border:"1px solid rgba(212,175,55,0.4)",borderRadius:16,
          padding:mobile?14:20,background:"radial-gradient(ellipse at 20% 0%,rgba(212,175,55,0.1),rgba(6,3,20,0.92))",
          boxShadow:ruletaActive?"0 0 26px rgba(212,175,55,0.45)":"none"}}>
        {ruletaActive&&<GlowRing color={C.gold} size={mobile?280:420}/>}
        <div style={{fontSize:9,letterSpacing:2,color:"rgba(212,175,55,0.7)",
          fontFamily:"'Cinzel',serif",marginBottom:2}}>✕ RULETA EXCLUSIVA VIP</div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:mobile?16:20,fontWeight:900,
          color:C.goldBright,marginBottom:12,textShadow:`0 0 10px ${C.goldGlow}`}}>GIRA &amp; GANA</div>
        <div style={{display:"flex",flexDirection:mobile?"column":"row",gap:16,alignItems:"center"}}>
          <div style={{width:mobile?140:160,height:mobile?140:160,borderRadius:"50%",flexShrink:0,
            background:"conic-gradient(from 0deg,#0d9488,#a78bfa,#0d9488,#7c3aed,#0d9488,#a78bfa,#0d9488,#7c3aed)",
            display:"flex",alignItems:"center",justifyContent:"center",
            border:"3px solid rgba(212,175,55,0.6)",boxShadow:"0 0 20px rgba(212,175,55,0.3)"}}>
            <div style={{width:"38%",height:"38%",borderRadius:"50%",background:"#0a0520",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>👑</div>
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:6,width:"100%"}}>
            {ROULETTE_PRIZES.map(p=>(
              <div key={p.name} style={{display:"flex",alignItems:"center",gap:8,
                border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"6px 10px",
                background:"rgba(255,255,255,0.02)"}}>
                <span style={{fontSize:15}}>{p.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:800,color:p.color}}>{p.name}</div>
                  <div style={{fontSize:8,color:"rgba(255,255,255,0.4)"}}>🔒 {p.price}</div>
                </div>
              </div>
            ))}
            <div style={{textAlign:"center",padding:"10px 0",borderRadius:10,marginTop:4,
              background:"linear-gradient(90deg,#7c3aed,#fbbf24)",fontFamily:"'Cinzel',serif",
              fontSize:11,letterSpacing:1,color:"#1a0a2e",fontWeight:900}}>⚡ ¡GIRAR!</div>
          </div>
        </div>
      </motion.div>

      {/* ── PASE DE BATALLA ── */}
      <motion.div animate={{opacity:(highlight&&!paseActive)?0.08:1}}
        transition={{duration:0.3}}
        style={{position:"relative",zIndex:paseActive?53:2,
          border:"1px solid rgba(212,175,55,0.4)",borderRadius:16,
          padding:mobile?14:20,background:"radial-gradient(ellipse at 50% 0%,rgba(212,175,55,0.08),rgba(6,3,20,0.92))",
          boxShadow:paseActive?"0 0 26px rgba(212,175,55,0.45)":"none"}}>
        {paseActive&&<GlowRing color={C.gold} size={mobile?300:440}/>}
        <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",
          border:`1px solid ${C.gold}`,borderRadius:16,marginBottom:14}}>
          <span style={{fontSize:9,fontFamily:"'Cinzel',serif",letterSpacing:1,color:C.goldBright}}>✕ VIP ACTIVO</span>
        </div>
        <div style={{display:"flex",gap:mobile?10:16,overflowX:"auto",paddingBottom:10}}>
          {PASS_LEVELS.map(l=>(
            <div key={l.n} style={{textAlign:"center",flexShrink:0}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,
                  border:`2px solid ${l.color}`,background:`${l.color}22`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{l.icon}</div>
                <span style={{fontSize:8,fontFamily:"'Cinzel',serif",letterSpacing:1,color:l.color}}>NV.{l.n}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:8,fontSize:8,fontFamily:"'Cinzel',serif",
          letterSpacing:1,color:"rgba(255,255,255,0.4)"}}>
          <span style={{color:C.goldBright}}>👑 PREMIUM</span><span>● GRATIS</span>
        </div>
        <div style={{display:"flex",gap:mobile?10:16,overflowX:"auto"}}>
          {PASS_LEVELS.map(l=>(
            <div key={l.n} style={{display:"flex",flexDirection:"column",gap:6,alignItems:"center",flexShrink:0}}>
              <div style={{width:30,height:30,borderRadius:"50%",border:`1.5px solid ${l.color}`,
                background:`${l.color}18`,display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,color:l.color}}>✓</div>
              <div style={{width:30,height:30,borderRadius:"50%",border:`1.5px solid ${l.color}88`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:l.color}}>✓</div>
              <span style={{fontSize:7.5,color:"rgba(255,255,255,0.4)",width:60,textAlign:"center"}}>{l.name}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── ACADEMY SCREEN ──────────────────────────────────────
const EXPLORED_MODULES=[
  {icon:"👁",tag:"VISIÓN MAESTRA",tagColor:"#f4b942",title:"Micro-Metas Semanales",desc:"Consolida tu momentum y sigue avanzando",time:"30 MIN"},
  {icon:"⚔",tag:"CONTROL",tagColor:"#e8677a",title:"Bloques de Maestría del Tiempo",desc:"Deja de reaccionar. Empieza a gobernar tus horas.",time:"25 MIN"},
  {icon:"⚔",tag:"CONTROL",tagColor:"#e8677a",title:"Ritual del Enfoque Matutino",desc:"Gana tu mañana antes de que el mundo intente ganarla por ti.",time:"25 MIN"},
];
function AcademyScreen({mobile,panelH}) {
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",
      padding:mobile?`14px 12px ${panelH+16}px`:`18px 24px ${panelH+16}px`,overflowY:"auto",
      fontFamily:"'Nunito',sans-serif"}}>

      {/* ── COUNTDOWN BANNER ── */}
      <div style={{display:"flex",flexDirection:mobile?"column":"row",alignItems:mobile?"flex-start":"center",
        justifyContent:"space-between",gap:12,
        border:`1px solid rgba(167,139,250,0.4)`,borderRadius:14,
        padding:mobile?"12px 14px":"14px 22px",marginBottom:20,
        background:"radial-gradient(ellipse at 20% 50%,rgba(139,92,246,0.14),rgba(6,3,20,0.9))",
        boxShadow:"0 0 20px rgba(139,92,246,0.15)"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'Cinzel',serif",
            fontSize:mobile?10:11,letterSpacing:2,color:"#c4b5fd",textTransform:"uppercase"}}>
            ⚔ Próxima Evaluación del Templo</div>
          <div style={{fontSize:mobile?11:12,color:"rgba(255,255,255,0.5)",marginTop:4}}>
            Tu siguiente protocolo será forjado cuando el Templo te convoque</div>
        </div>
        <div style={{display:"flex",gap:mobile?6:10,flexShrink:0}}>
          {[["04","DÍAS"],["10","HRS"],["28","MIN"],["40","SEG"]].map(([v,l])=>(
            <div key={l} style={{textAlign:"center",background:"rgba(139,92,246,0.15)",
              border:"1px solid rgba(167,139,250,0.35)",borderRadius:8,
              padding:mobile?"5px 8px":"6px 11px",minWidth:mobile?36:44}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:mobile?14:18,fontWeight:900,
                color:"#c4b5fd",textShadow:"0 0 8px rgba(167,139,250,0.6)"}}>{v}</div>
              <div style={{fontSize:6.5,letterSpacing:1,color:"rgba(196,181,253,0.6)"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{fontSize:10,letterSpacing:3,color:"rgba(255,255,255,0.35)",
        textTransform:"uppercase",marginBottom:8,fontFamily:"'Cinzel',serif"}}>Esta Semana</div>

      {/* ── HERO MODULE CARD ── */}
      <div style={{position:"relative",overflow:"hidden",borderRadius:16,
        border:"1px solid rgba(255,255,255,0.08)",
        background:"radial-gradient(ellipse at 80% 30%,rgba(30,58,138,0.35),rgba(6,3,20,0.95))",
        padding:mobile?18:28,marginBottom:22}}>
        <div style={{position:"absolute",right:mobile?12:28,top:"50%",transform:"translateY(-50%)",
          fontSize:mobile?46:72,opacity:0.18}}>🌊</div>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",
          background:"rgba(45,212,191,0.15)",border:"1px solid rgba(45,212,191,0.5)",
          borderRadius:20,marginBottom:16}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:"#2dd4bf",
            boxShadow:"0 0 6px #2dd4bf"}}/>
          <span style={{fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:2,
            color:"#5eead4",textTransform:"uppercase"}}>Módulo Activo · Semana 11</span>
        </div>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:mobile?19:28,fontWeight:700,
          color:"#fff",lineHeight:1.25,marginBottom:10,maxWidth:mobile?"100%":"70%"}}>
          Protocolo de Negociación Colaborativa</div>
        <div style={{fontSize:mobile?12:13,color:"rgba(255,255,255,0.5)",fontStyle:"italic",
          marginBottom:20}}>No entres a vencer. Entra a construir.</div>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{padding:"9px 18px",borderRadius:9,background:"#14b8a6",
            fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:1,color:"#04120f",fontWeight:700,
            boxShadow:"0 0 16px rgba(20,184,166,0.5)"}}>▶ COMENZAR AHORA</div>
          <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>+50 XP · 25 MIN</span>
        </div>
      </div>

      <div style={{fontSize:10,letterSpacing:3,color:"rgba(255,255,255,0.35)",
        textTransform:"uppercase",marginBottom:10,fontFamily:"'Cinzel',serif"}}>Ya Exploraste</div>

      {/* ── EXPLORED GRID ── */}
      <div style={{display:"flex",flexDirection:mobile?"column":"row",gap:12,flexWrap:"wrap"}}>
        {EXPLORED_MODULES.map(m=>(
          <div key={m.title} style={{flex:mobile?"none":"1 1 220px",
            border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:16,
            background:"rgba(255,255,255,0.02)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <span style={{fontSize:20}}>{m.icon}</span>
              <span style={{fontSize:8.5,letterSpacing:1.5,fontFamily:"'Cinzel',serif",
                fontWeight:700,color:m.tagColor,textTransform:"uppercase"}}>{m.tag}</span>
            </div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:700,
              color:"#fff",marginBottom:6,lineHeight:1.3}}>{m.title}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",lineHeight:1.5,marginBottom:16}}>{m.desc}</div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,
              borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:10}}>
              <span style={{color:"rgba(255,255,255,0.3)"}}>{m.time}</span>
              <span style={{color:"#4ade80"}}>✓ Visto</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── COMMUNITY SCREEN ────────────────────────────────────
function CommunityScreen({mobile,panelH}) {
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",
      padding:mobile?`12px 12px ${panelH+16}px`:`16px 22px ${panelH+16}px`,
      overflowY:"auto",fontFamily:"'Nunito',sans-serif"}}>

      {/* ── LEVEL / POINTS CARD ── */}
      <div style={{display:"flex",flexDirection:mobile?"column":"row",alignItems:mobile?"flex-start":"center",
        justifyContent:"space-between",gap:10,
        border:"1px solid rgba(96,165,250,0.35)",borderRadius:12,
        padding:mobile?"12px 14px":"12px 20px",marginBottom:14,
        background:"linear-gradient(90deg,rgba(30,58,138,0.25),rgba(6,3,20,0.9))"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,borderRadius:10,background:"rgba(96,165,250,0.25)",
            border:"1px solid rgba(96,165,250,0.5)",display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:16}}>🔵</div>
          <div>
            <div style={{fontSize:9,fontFamily:"'Cinzel',serif",letterSpacing:1,
              color:"#93c5fd",marginBottom:2}}>● ⚔ COMUNIDAD · NV.2</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:mobile?15:18,fontWeight:900,color:"#fff"}}>Discípulo</div>
          </div>
        </div>
        <div style={{width:mobile?"100%":260,flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,marginBottom:4}}>
            <span style={{color:"rgba(255,255,255,0.5)"}}>60 PTS</span>
            <span style={{color:"#93c5fd"}}>+90 → Guardián ➤</span>
          </div>
          <div style={{height:6,background:"rgba(255,255,255,0.08)",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:"10%",background:"linear-gradient(90deg,#1d4ed8,#60a5fa)",borderRadius:4}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:8,marginTop:3,
            color:"rgba(255,255,255,0.3)"}}>
            <span>10% Completado</span><span>Meta: 150 pts</span>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {[["🔥 Feed",true],["👥 Miembros",false],["💬 Mensajes",false],["🏆 Ranking",false]].map(([t,active])=>(
          <div key={t} style={{fontSize:9,fontFamily:"'Cinzel',serif",letterSpacing:1,fontWeight:700,
            padding:"6px 14px",borderRadius:20,
            background:active?"rgba(139,92,246,0.35)":"rgba(255,255,255,0.04)",
            border:`1px solid ${active?"#a78bfa":"rgba(255,255,255,0.1)"}`,
            color:active?"#e9d5ff":"rgba(255,255,255,0.4)"}}>{t}</div>
        ))}
      </div>

      {/* ── COMPOSER ── */}
      <div style={{border:"1px solid rgba(251,146,60,0.4)",borderRadius:14,padding:14,marginBottom:16,
        background:"radial-gradient(ellipse at 0% 0%,rgba(251,146,60,0.08),rgba(6,3,20,0.9))"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",
          border:"1px solid rgba(251,191,36,0.5)",borderRadius:16,marginBottom:12,
          fontSize:8.5,fontFamily:"'Cinzel',serif",letterSpacing:1,color:"#fbbf24"}}>⚑ MODO GUÍA ACTIVO</div>
        <div style={{display:"flex",gap:10}}>
          <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,background:"rgba(139,92,246,0.3)",
            border:"1px solid rgba(167,139,250,0.5)",display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:10,fontWeight:800,color:"#c4b5fd"}}>MT</div>
          <div style={{flex:1,minHeight:44,border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,
            padding:"10px 12px",fontSize:11,color:"rgba(255,255,255,0.35)",
            background:"rgba(255,255,255,0.02)"}}>Comparte tu avance, reflexión o pregunta esta semana…</div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,flexWrap:"wrap",gap:8}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",border:"1px solid rgba(255,255,255,0.12)",
            borderRadius:6,padding:"4px 10px"}}>Sin categoría ▾</div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:9,color:"rgba(255,255,255,0.4)"}}>+15 XP · +5 🪙</span>
            <div style={{fontSize:9,fontFamily:"'Cinzel',serif",letterSpacing:1,fontWeight:700,
              color:"#fff",background:"rgba(139,92,246,0.4)",border:"1px solid #a78bfa",
              borderRadius:8,padding:"6px 14px"}}>Publicar</div>
          </div>
        </div>
      </div>

      {/* ── FILTER CHIPS ── */}
      <div style={{display:"flex",gap:6,marginBottom:6}}>
        {["◎ Nuevo","🔥 Top"].map((t,i)=>(
          <div key={t} style={{fontSize:9,fontFamily:"'Cinzel',serif",letterSpacing:0.5,fontWeight:700,
            padding:"5px 12px",borderRadius:16,
            background:i===0?"rgba(139,92,246,0.3)":"rgba(255,255,255,0.04)",
            border:`1px solid ${i===0?"#a78bfa":"rgba(255,255,255,0.1)"}`,
            color:i===0?"#e9d5ff":"rgba(255,255,255,0.4)"}}>{t}</div>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {["✦ Todos","General Discussion","Mensajes del Guía","Juramento Templario","Reto del Iniciado","Logros Templarios"].map((t,i)=>(
          <div key={t} style={{fontSize:8.5,letterSpacing:0.5,fontWeight:600,
            padding:"5px 11px",borderRadius:16,
            background:i===0?"rgba(139,92,246,0.25)":"transparent",
            border:`1px solid ${i===0?"#a78bfa":"rgba(255,255,255,0.12)"}`,
            color:i===0?"#e9d5ff":"rgba(255,255,255,0.35)"}}>{t}</div>
        ))}
      </div>

      {/* ── PINNED GUÍA MESSAGE ── */}
      <div style={{border:"1px solid rgba(251,191,36,0.4)",borderRadius:14,padding:14,
        background:"rgba(251,191,36,0.04)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>📯</span>
            <div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:12,fontWeight:800,color:"#fbbf24"}}>MENSAJES DEL GUÍA</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.4)"}}>Comunicados oficiales del Templo</div>
            </div>
          </div>
          <span style={{fontSize:8.5,fontFamily:"'Cinzel',serif",letterSpacing:1,color:"#fbbf24",
            border:"1px solid rgba(251,191,36,0.4)",borderRadius:8,padding:"3px 10px"}}>1 MENSAJES</span>
        </div>
        <div style={{display:"flex",gap:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{width:34,height:34,borderRadius:8,flexShrink:0,background:"rgba(251,191,36,0.15)",
            border:"1px solid rgba(251,191,36,0.4)",display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:14}}>🧙</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:800,color:"#fff",marginBottom:6}}>¡Bienvenidos!</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:9,color:"rgba(255,255,255,0.4)"}}>
              <span>⚑ De: Maestro Templario</span><span>55d</span>
              <span style={{color:"#fb923c"}}>🔥 2 Liked</span><span>💬 0</span>
              <span>🔗 Link</span>
              <span style={{color:"#a78bfa"}}>⚙ Admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FINAL SCREEN ────────────────────────────────────────
function FinalScreen({mobile,panelH}) {
  return (
    <div style={{height:"100%",position:"relative"}}>
      <motion.div initial={{opacity:1}} animate={{opacity:0.12}} transition={{delay:1.4,duration:0.7}}
        style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",
        flexDirection:"column",gap:mobile?12:18,position:"relative"}}>
        <Particles count={10} colors={[C.goldGlow,"rgba(255,229,102,0.8)",C.purpleGlow,C.blueGlow]}/>
        <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:90}}
          style={{fontSize:mobile?70:100,filter:`drop-shadow(0 0 14px ${C.gold})`}}>🏛</motion.div>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
          style={{fontFamily:"'Cinzel Decorative',serif",fontSize:mobile?18:26,fontWeight:900,
            color:C.goldBright,textShadow:`0 0 14px ${C.gold}`,letterSpacing:mobile?2:4,textAlign:"center"}}>
          EL TEMPLO TE ESPERA</motion.div>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.7}}
          style={{fontFamily:"'Cinzel',serif",fontSize:mobile?9:12,letterSpacing:mobile?2:4,
            color:"rgba(212,175,55,0.55)",textAlign:"center"}}>
          · TU CAMINO · TU TEMPLO · TU LEGADO ·</motion.div>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1}}
          style={{display:"flex",gap:mobile?18:36,marginTop:mobile?4:8}}>
          {["🗝","⚡","🗺","🧘","🎯","🎒","✨"].map((ic,i)=>(
            <div key={i} style={{fontSize:mobile?20:26,filter:`drop-shadow(0 0 4px ${C.gold})`,
              animation:`floatIcon ${1.8+i*0.12}s ease-in-out ${i*0.14}s infinite alternate`}}>
              {ic}
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── OSCURECIDO + RINCÓN DEL TUTORIAL ── */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.4,duration:0.6}}
        style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.72)",zIndex:40,pointerEvents:"none"}}/>

      <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}}
        transition={{delay:1.6,type:"spring",stiffness:120}}
        style={{position:"absolute",bottom:panelH+(mobile?34:44),right:mobile?14:26,zIndex:56,
          display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,maxWidth:mobile?170:220}}>
        <div style={{textAlign:"right",
          fontFamily:"'Nunito',sans-serif",fontSize:mobile?10:12,
          color:"rgba(255,255,255,0.85)",lineHeight:1.4,
          textShadow:"0 0 6px rgba(0,0,0,0.9)"}}>
          Aquí siempre puedes volver a ver este tutorial
        </div>
        <div style={{position:"relative",flexShrink:0}}>
          <GlowRing color={C.orange} size={mobile?90:120}/>
          <motion.div animate={{scale:[1,1.06,1]}}
            transition={{duration:1.6,repeat:Infinity,ease:"easeInOut"}}
            style={{display:"flex",alignItems:"center",gap:6,
            padding:mobile?"8px 12px":"10px 16px",borderRadius:20,
            background:`linear-gradient(135deg,${C.orange},#CC5500)`,
            border:`1px solid ${C.orangeGlow}`,
            boxShadow:`0 0 18px ${C.orangeGlow}`,position:"relative",zIndex:1}}>
            <span style={{fontSize:mobile?14:16}}>🎓</span>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:mobile?10:12,fontWeight:700,
              color:"#fff",letterSpacing:1,textShadow:"0 0 8px rgba(0,0,0,0.5)"}}>TUTORIAL</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── CINEMATIC TEXT ──────────────────────────────────────
function CinematicText({title,body,stepKey,mobile}) {
  const [phase,setPhase]=useState(0);
  useEffect(()=>{
    setPhase(0);
    const t1=setTimeout(()=>setPhase(1),80);
    const t2=setTimeout(()=>setPhase(2),600);
    const t3=setTimeout(()=>setPhase(3),1200);
    return ()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  },[stepKey]);

  return (
    <div style={{flex:1,minWidth:0}}>
      <AnimatePresence mode="wait">
        <motion.div key={`lbl-${stepKey}`}
          initial={{opacity:0,y:6}} animate={{opacity:phase>=1?1:0,y:phase>=1?0:6}}
          transition={{duration:0.35}}
          style={{fontFamily:"'Cinzel',serif",fontSize:mobile?9:11,fontWeight:700,
            color:C.gold,letterSpacing:3,marginBottom:mobile?2:4,
            textShadow:`0 0 7px ${C.goldGlow}`}}>
          ⚔ MAESTRO TEMPLARIO
        </motion.div>
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div key={`ttl-${stepKey}`}
          initial={{opacity:0,y:10,scale:0.96}}
          animate={{opacity:phase>=2?1:0,y:phase>=2?0:10,scale:phase>=2?1:0.96}}
          transition={{duration:0.4}}
          style={{fontFamily:"'Cinzel',serif",fontSize:mobile?14:20,fontWeight:900,
            color:C.goldBright,lineHeight:1.2,marginBottom:mobile?4:6,
            textShadow:`0 0 10px ${C.goldGlow}`,
            letterSpacing:mobile?0:1}}>
          {title}
        </motion.div>
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div key={`bdy-${stepKey}`}
          initial={{opacity:0}} animate={{opacity:phase>=3?1:0}}
          transition={{duration:0.45}}
          style={{fontFamily:"'Nunito',sans-serif",fontSize:mobile?12:15,
            color:"rgba(255,255,255,0.88)",lineHeight:mobile?1.5:1.65}}>
          {body}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── MASTER PANEL ────────────────────────────────────────
function MasterPanel({cur,step,total,onNext,mobile}) {
  const progress=((step+1)/total)*100;
  const offset=mobile?0:12;
  const panelPos={bottom:mobile?0:offset,left:offset,right:offset};
  const iconSize=mobile?44:80;

  return (
    <motion.div key={step}
      initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}
      transition={{duration:0.42,ease:"easeOut"}}
      style={{
        position:"absolute",...panelPos,zIndex:54,
        background:"rgba(4,2,14,0.97)",
        border:`1px solid rgba(212,175,55,0.50)`,
        borderRadius:mobile?"16px 16px 0 0":16,
        padding:mobile?"10px 12px 16px":"18px 22px 14px",
        backdropFilter:"none",
        boxShadow:`0 4px 30px rgba(0,0,0,0.97)`,
      }}>
      {/* Progress bar */}
      <div style={{height:3,background:"rgba(255,255,255,0.07)",borderRadius:2,
        marginBottom:mobile?10:14,overflow:"hidden"}}>
        <motion.div animate={{width:`${progress}%`}} transition={{duration:0.5}}
          style={{height:"100%",background:`linear-gradient(90deg,${C.blue},${C.gold})`,
            boxShadow:`0 0 6px ${C.goldGlow}`}}/>
      </div>

      {mobile ? (
        /* ── MÓVIL: barra compacta horizontal ── */
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div
            style={{flexShrink:0,width:iconSize,height:iconSize,borderRadius:"50%",
              border:`2px solid ${C.gold}`,overflow:"hidden",
              boxShadow:`0 0 14px ${C.gold}`,position:"relative"}}>
            <img src="https://i.imgur.com/7ofsCSm.png" alt="Maestro" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:900,
              color:C.goldBright,lineHeight:1.2,
              textShadow:`0 0 7px ${C.goldGlow}`,
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {cur.master}
            </div>
            <div style={{fontFamily:"'Nunito',sans-serif",fontSize:11,
              color:"rgba(255,255,255,0.78)",lineHeight:1.4,
              display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
              {cur.sub}
            </div>
          </div>
          <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:9,color:"rgba(255,255,255,0.25)",fontFamily:"'Cinzel',serif"}}>
                {step+1}/{total}
              </span>
              <button onClick={()=>{if(cur.onExit)cur.onExit();}}
                style={{background:"transparent",border:"none",color:"rgba(212,175,55,0.8)",
                  fontFamily:"'Cinzel',serif",fontSize:9,cursor:"pointer",padding:0}}>
                ✕
              </button>
            </div>
            <motion.button onClick={onNext}
              whileTap={{scale:0.96}}
              style={{padding:"6px 14px",
                background:`linear-gradient(135deg,rgba(212,175,55,0.3),rgba(212,175,55,0.08))`,
                border:`1px solid ${C.gold}`,borderRadius:6,cursor:"pointer",
                fontFamily:"'Cinzel',serif",fontSize:10,fontWeight:700,
                color:C.goldBright,letterSpacing:0.8,
                boxShadow:`0 0 8px ${C.goldGlow}`,whiteSpace:"nowrap"}}>
              {cur.btn} →
            </motion.button>
          </div>
        </div>
      ) : (
        /* ── DESKTOP: layout completo ── */
        <div style={{display:"flex",gap:18,alignItems:"center"}}>
          <div
            style={{flexShrink:0,width:iconSize,height:iconSize,borderRadius:"50%",
              background:`radial-gradient(circle at 40% 35%,rgba(212,175,55,0.28),rgba(10,5,32,0.95))`,
              border:`2px solid ${C.gold}`,overflow:"hidden",
              boxShadow:`0 0 18px ${C.gold},0 0 36px rgba(212,175,55,0.2)`,
              position:"relative",pointerEvents:"none"}}>
            <img src="https://i.imgur.com/7ofsCSm.png" alt="Maestro" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:11,fontWeight:700,
              color:C.gold,letterSpacing:3,marginBottom:5,textShadow:`0 0 7px ${C.goldGlow}`}}>
              ⚔ MAESTRO TEMPLARIO
            </div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:22,fontWeight:900,
              color:C.goldBright,lineHeight:1.2,marginBottom:8,
              textShadow:`0 0 10px ${C.goldGlow}`}}>
              {cur.master}
            </div>
            <div style={{fontFamily:"'Nunito',sans-serif",fontSize:16,
              color:"rgba(255,255,255,0.88)",lineHeight:1.7}}>
              {cur.sub}
            </div>
          </div>
          <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
              <span style={{fontSize:10,color:"rgba(255,255,255,0.25)",fontFamily:"'Cinzel',serif",letterSpacing:1}}>
                {step+1} / {total}
              </span>
              <button onClick={()=>{if(cur.onExit)cur.onExit();}}
                style={{background:"transparent",border:"none",color:"rgba(212,175,55,0.9)",
                  fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:1.5,cursor:"pointer",padding:0}}
                onMouseEnter={e=>e.target.style.color="#FFE566"}
                onMouseLeave={e=>e.target.style.color="rgba(212,175,55,0.9)"}>
                ✕ salir
              </button>
            </div>
            <motion.button onClick={onNext}
              whileHover={{scale:1.05}}
              whileTap={{scale:0.97}}
              style={{padding:"10px 28px",
                background:`linear-gradient(135deg,rgba(212,175,55,0.28),rgba(212,175,55,0.08))`,
                border:`1px solid ${C.gold}`,borderRadius:8,cursor:"pointer",
                fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:700,
                color:C.goldBright,letterSpacing:2,
                boxShadow:`0 0 10px ${C.goldGlow}`,
                textShadow:`0 0 8px ${C.goldGlow}`,whiteSpace:"nowrap"}}>
              {cur.btn} →
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── ROOT ────────────────────────────────────────────────
export default function TStoreTutorial({onComplete}) {
  const [step,setStep]=useState(0);
  const [filterType,setFilterType]=useState("TODOS");
  const [filterT,setFilterT]=useState(null);
  const [selectedModule,setSelectedModule]=useState(null);
  const [coins]=useState(2850);
  const stepRef=useRef(0);
  const didMountRef=useRef(false);
  const initialSpokenRef=useRef(false);
  const audioElRef=useRef(null);
  const chosenVoiceRef=useRef(null);      // mejor voz de respaldo (TTS) encontrada en este dispositivo
  const pendingRetryRef=useRef(null);     // reintento pendiente de sonido, bloqueado por autoplay
  const ttsKeepAliveRef=useRef(null);
  const realSize=useWindowSize();
  const size={w:DESKTOP_W,h:DESKTOP_H};
  const tutorialScale=Math.min(realSize.w/DESKTOP_W,realSize.h/DESKTOP_H)||1;

  useEffect(()=>{ stepRef.current=step; },[step]);

  if(!audioElRef.current&&typeof Audio!=="undefined"){
    audioElRef.current=new Audio();
    audioElRef.current.preload="auto";
  }

  // Elige, de entre las voces que tenga el dispositivo, una masculina,
  // enérgica y en español — SOLO se usa como respaldo mientras no subas el
  // archivo de audio real de ese paso (ver AUDIO_BASE_URL arriba). En
  // cuanto subas los .mp3, esta voz de respaldo deja de escucharse.
  const pickBackupVoice=()=>{
    if(!window.speechSynthesis) return null;
    const voices=window.speechSynthesis.getVoices();
    if(!voices.length) return null;
    const maleNames=/jorge|alonso|tomás|tomas|néstor|nestor|liam|diego|carlos|álvaro|alvaro|juan|miguel|pablo|enrique|raúl|raul|pedro|fernando|andrés|andres|male|hombre|reba|eddy/i;
    const femaleNames=/paulina|mónica|monica|helena|sabina|lucía|lucia|elvira|esperanza|marisol|catalina|angélica|angelica|lupe|isabela|isabella|camila|valentina|renata|inés|ines|carmen|rosa|dalia|conchita|female|mujer|laura|sofía|sofia|maría|maria|ximena|salomé|salome|fred/i;
    const esVoices=voices.filter(v=>/^es/i.test(v.lang)&&!femaleNames.test(v.name));
    const priority=[
      v=>maleNames.test(v.name)&&/es-MX|es-US|es-419/i.test(v.lang)&&/natural|online|neural/i.test(v.name),
      v=>maleNames.test(v.name)&&/natural|online|neural/i.test(v.name),
      v=>maleNames.test(v.name)&&/es-MX|es-US|es-419/i.test(v.lang),
      v=>maleNames.test(v.name),
      v=>/es-MX|es-US|es-419/i.test(v.lang)&&/natural|online|neural/i.test(v.name),
      v=>/es-ES/i.test(v.lang)&&/natural|online|neural/i.test(v.name),
      v=>/es-MX|es-US|es-419/i.test(v.lang),
      v=>/es-ES/i.test(v.lang),
    ];
    for(const test of priority){ const found=esVoices.find(test); if(found) return found; }
    return voices.find(v=>maleNames.test(v.name))||esVoices[0]||voices.find(v=>/^es/i.test(v.lang))||voices[0]||null;
  };

  const stopTTS=()=>{
    if(ttsKeepAliveRef.current){ clearInterval(ttsKeepAliveRef.current); ttsKeepAliveRef.current=null; }
    if(window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const speakSessionRef=useRef(null); // {settled, fallbackId} de la narración en curso

  // Cierra por completo cualquier narración en curso: pausa el audio/voz y
  // limpia sus temporizadores. Se llama SIEMPRE antes de arrancar una nueva
  // narración, así nunca hay dos audios sonando ni dos avances programados.
  const stopSpeaking=()=>{
    const s=speakSessionRef.current;
    if(s){
      s.settled=true;
      if(s.fallbackId) clearTimeout(s.fallbackId);
      speakSessionRef.current=null;
    }
    const audioEl=audioElRef.current;
    if(audioEl){ audioEl.onended=null; audioEl.onerror=null; audioEl.pause(); }
    stopTTS();
    pendingRetryRef.current=null;
  };

  // Reproduce la voz de respaldo (mientras no exista el .mp3 real de este
  // paso) usando la voz del propio dispositivo, con tono enérgico y alegre.
  const speakBackupTTS=(text)=>{
    if(!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter=new SpeechSynthesisUtterance(text);
    if(chosenVoiceRef.current){ utter.voice=chosenVoiceRef.current; utter.lang=chosenVoiceRef.current.lang; }
    else utter.lang="es-MX";
    utter.rate=1.12; utter.pitch=1.18; utter.volume=1;
    // El avance del paso NUNCA depende de estos eventos — solo del reloj
    // de doSpeak() — así nunca vuelve a repetirse el bug de avance instantáneo.
    utter.onend=()=>{}; utter.onerror=()=>{};
    try{ window.speechSynthesis.speak(utter); }catch(e){/* se ignora: sigue el respaldo por tiempo */}
    // Chrome corta narraciones largas si el hilo de síntesis queda inactivo;
    // este "latido" lo mantiene vivo sin reiniciar ni repetir el audio.
    ttsKeepAliveRef.current=setInterval(()=>{
      if(!window.speechSynthesis||!window.speechSynthesis.speaking){
        if(ttsKeepAliveRef.current){ clearInterval(ttsKeepAliveRef.current); ttsKeepAliveRef.current=null; }
        return;
      }
      window.speechSynthesis.pause(); window.speechSynthesis.resume();
    },4000);
  };

  // idx: paso a narrar. SIEMPRE intenta sonar — primero con tu archivo de
  // audio real (si ya lo subiste en AUDIO_BASE_URL/NARRATION_AUDIO); si
  // todavía no existe, usa la voz del dispositivo como respaldo. El avance
  // al siguiente paso NUNCA depende de que ese audio/voz termine bien —
  // corre siempre con el mismo reloj, calculado según cuánto se tarda en
  // leer el texto de ese paso. Así el ritmo es IDÉNTICO en cualquier
  // computadora, celular o navegador, y jamás vuelve a "dispararse" de
  // golpe por una falla silenciosa del motor de voz (esa dependencia era
  // la causa real del bug anterior).
  const doSpeak=(idx)=>{
    const text=NARRATION[idx];
    if(!text) return;

    stopSpeaking();

    const session={settled:false,fallbackId:null};
    speakSessionRef.current=session;

    const finish=()=>{
      if(session.settled) return;
      session.settled=true;
      if(session.fallbackId) clearTimeout(session.fallbackId);
      if(stepRef.current===idx&&idx<STEPS.length-1){
        setStep(s=>s+1);
      }
    };

    const words=text.trim().split(/\s+/).length;
    const estMs=(words/2.6)*1000+1200;
    session.fallbackId=setTimeout(finish,Math.max(4000,estMs));

    const url=(AUDIO_BASE_URL&&NARRATION_AUDIO[idx])
      ?`${AUDIO_BASE_URL}/${NARRATION_AUDIO[idx]}`:null;
    const audioEl=audioElRef.current;

    if(url&&audioEl){
      audioEl.onended=null; audioEl.onerror=null;
      audioEl.src=url; audioEl.currentTime=0; audioEl.volume=1;
      const playPromise=audioEl.play();
      if(playPromise&&playPromise.catch){
        playPromise.catch(()=>{
          // Autoplay bloqueado por el navegador: mientras tanto suena la
          // voz de respaldo, y el audio real se reintenta en la 1ª interacción.
          speakBackupTTS(text);
          pendingRetryRef.current=()=>{ audioEl.play().catch(()=>{}); };
        });
      }
    } else {
      speakBackupTTS(text);
    }
  };

  // ── NARRACIÓN DEL PRIMER PASO — UNA SOLA VEZ ────────────────
  const speakInitial=()=>{
    if(initialSpokenRef.current) return;
    initialSpokenRef.current=true;
    doSpeak(stepRef.current);
  };

  useEffect(()=>{
    if(!window.speechSynthesis){ speakInitial(); return; }
    // "Calienta" el motor de voz del navegador (bug conocido de Chrome/
    // Android: la primera llamada real a .speak() de toda la sesión puede
    // quedar muda) y busca la mejor voz de respaldo disponible.
    try{
      const warm=new SpeechSynthesisUtterance(" ");
      warm.volume=0;
      window.speechSynthesis.speak(warm);
      window.speechSynthesis.cancel();
    }catch(e){/* seguimos igual con el flujo normal */}
    const found=pickBackupVoice();
    if(found) chosenVoiceRef.current=found;
    window.speechSynthesis.onvoiceschanged=()=>{
      const v=pickBackupVoice();
      if(v) chosenVoiceRef.current=v;
    };
    speakInitial();

    const tryOnInteraction=()=>{
      if(pendingRetryRef.current){
        const run=pendingRetryRef.current;
        pendingRetryRef.current=null;
        run();
      }
    };
    document.addEventListener("click",tryOnInteraction);
    document.addEventListener("touchstart",tryOnInteraction);
    document.addEventListener("keydown",tryOnInteraction);

    return ()=>{
      document.removeEventListener("click",tryOnInteraction);
      document.removeEventListener("touchstart",tryOnInteraction);
      document.removeEventListener("keydown",tryOnInteraction);
      stopSpeaking();
    };
  },[]);

  // ── NARRACIÓN AL CAMBIAR DE PASO ────────────────────────────
  // El primer paso ya quedó a cargo de speakInitial() de arriba. La voz
  // suena SIEMPRE, en todos los pasos — ya no hay forma de silenciarla
  // desde el tutorial; el volumen queda a criterio de cada quien desde su
  // propio dispositivo.
  useEffect(()=>{
    if(!didMountRef.current){
      didMountRef.current=true;
      return;
    }
    const t=setTimeout(()=>{ doSpeak(step); },60);
    return ()=>{clearTimeout(t); stopSpeaking();};
  },[step]);

  const mobile=size.w<900;
  const panelH=mobile?95:128;

  const cur=STEPS[step];
  const isLast=step===STEPS.length-1;
  const advance=()=>{
    if(isLast){
      supabase.auth.getUser().then(({data})=>{
        const uid=data?.user?.id;
        if(uid) localStorage.setItem(`tdp_alliance_unlock_${uid}`,'1');
      });
      if(onComplete)onComplete();
    } else setStep(s=>s+1);
  };

  const highlightPortalIds=(()=>{
    if (cur.screen!=="home") return [];
    if (cur.highlight==="claves") return ["claves"];
    if (cur.highlight==="victorias") return ["victorias"];
    if (cur.highlight==="mapas") return ["mapas"];
    if (cur.highlight==="apoyo") return ["claves","victorias","mapas"];
    if (cur.highlight==="templo") return ["templo"];
    return [];
  })();

  const commonScreenProps={mobile,panelH,size};

  return (
    <div className="tdp-tutorial-viewport" style={{
      position:"fixed",inset:0,zIndex:9999,
      background:C.bg,
      display:"flex",alignItems:"center",justifyContent:"center",
      overflow:"hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Nunito:wght@400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.3);}
        ::-webkit-scrollbar-track{background:transparent;}
        button{outline:none;}
        .portal-row::-webkit-scrollbar{display:none;}
        @keyframes floatIcon{from{transform:translateY(0)}to{transform:translateY(-7px)}}
        .tdp-tutorial-viewport{
          height:100vh; /* respaldo para navegadores que no soportan dvh */
          height:100dvh; /* alto VISIBLE real: se ajusta solo si aparece/desaparece la barra del navegador móvil */
        }
      `}</style>

      <div className="tdp-tutorial-root" style={{
        position:"relative",flexShrink:0,
        width:DESKTOP_W,height:DESKTOP_H,
        transform:`scale(${tutorialScale})`,transformOrigin:"center center",
        background:`linear-gradient(180deg,#050215 0%,#0a0530 20%,#080320 50%,${C.bg} 100%)`,
        color:"#fff",overflow:"hidden",userSelect:"none",
        fontFamily:"'Crimson Text',serif",
      }}>

      <Stars/>
      <Particles count={mobile?4:8}/>

      {/* Center ambient glow */}
      <motion.div style={{
        position:"absolute",top:"5%",left:"50%",transform:"translateX(-50%)",
        width:mobile?400:600,height:mobile?280:400,pointerEvents:"none",
        background:`radial-gradient(ellipse,rgba(212,175,55,0.09) 0%,rgba(100,50,200,0.06) 40%,transparent 70%)`,
        willChange:"opacity",
      }} animate={{opacity:[0.6,1,0.6]}}
        transition={{duration:10,repeat:Infinity,ease:"easeInOut"}}/>

      {/* ── SCREENS ── */}
      <AnimatePresence mode="wait">
        {cur.screen==="home"&&(
          <motion.div key="home"
            initial={{opacity:0,scale:1.04}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.97}}
            transition={{duration:0.55}}
            style={{position:"absolute",inset:0,display:"flex",flexDirection:"column"}}>
            <HomeScreen
              highlight={cur.highlight}
              highlightPortalIds={highlightPortalIds}
              coins={coins}
              {...commonScreenProps}/>
          </motion.div>
        )}
        {cur.screen==="evaluacion"&&(
          <motion.div key="evaluacion"
            initial={{opacity:0,scale:1.04}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.97}}
            transition={{duration:0.55}} style={{position:"absolute",inset:0}}>
            <EvaluationScreen {...commonScreenProps}/>
          </motion.div>
        )}
        {cur.screen==="territories"&&(
          <motion.div key="territories"
            initial={{opacity:0,scale:1.06}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.96}}
            transition={{duration:0.55}} style={{position:"absolute",inset:0}}>
            <TerritoriesScreen highlight={cur.highlight} {...commonScreenProps}/>
          </motion.div>
        )}
        {cur.screen==="modules"&&(
          <motion.div key="modules"
            initial={{opacity:0,scale:1.06}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.96}}
            transition={{duration:0.55}} style={{position:"absolute",inset:0}}>
            <ModulesScreen
              highlight={cur.highlight} coins={coins}
              filterType={filterType} setFilterType={setFilterType}
              selectedModule={selectedModule} setSelectedModule={setSelectedModule}
              {...commonScreenProps}/>
          </motion.div>
        )}
        {cur.screen==="arsenal"&&(
          <motion.div key="arsenal"
            initial={{opacity:0,scale:1.06}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.96}}
            transition={{duration:0.55}} style={{position:"absolute",inset:0}}>
            <ArsenalScreen highlight={cur.highlight} filterT={filterT} setFilterT={setFilterT} {...commonScreenProps}/>
          </motion.div>
        )}
        {cur.screen==="missions"&&(
          <motion.div key="missions"
            initial={{opacity:0,scale:1.06}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.96}}
            transition={{duration:0.55}} style={{position:"absolute",inset:0}}>
            <MissionsScreen highlight={cur.highlight} {...commonScreenProps}/>
          </motion.div>
        )}
        {cur.screen==="academia"&&(
          <motion.div key="academia"
            initial={{opacity:0,scale:1.06}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.96}}
            transition={{duration:0.55}} style={{position:"absolute",inset:0}}>
            <AcademyScreen {...commonScreenProps}/>
          </motion.div>
        )}
        {cur.screen==="comunidad"&&(
          <motion.div key="comunidad"
            initial={{opacity:0,scale:1.06}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.96}}
            transition={{duration:0.55}} style={{position:"absolute",inset:0}}>
            <CommunityScreen {...commonScreenProps}/>
          </motion.div>
        )}
        {cur.screen==="final"&&(
          <motion.div key="final"
            initial={{opacity:0,scale:1.08}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
            transition={{duration:0.8}} style={{position:"absolute",inset:0}}>
            <FinalScreen mobile={mobile} panelH={panelH}/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SPOTLIGHT OVERLAY ── */}
      <AnimatePresence>
        {cur.highlight&&cur.screen!=="final"&&(
          <motion.div key={`ov-${step}`}
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            transition={{duration:0.38}}
            style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.78)",
              pointerEvents:"none",zIndex:52}}/>
        )}
      </AnimatePresence>

      {/* ── MASTER PANEL ── */}
      <MasterPanel
        cur={{...cur,onExit:onComplete}}
        step={step} total={STEPS.length}
        onNext={advance}
        mobile={mobile}/>
      </div>
    </div>
  );
}