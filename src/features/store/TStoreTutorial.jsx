import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

// ─── RESPONSIVE HOOK ──────────────────────────────────────
function useWindowSize() {
  const [sz, setSz] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const fn = () => setSz({ w: window.innerWidth, h: window.innerHeight });
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
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
  {color:C.gold,  gem:"#FFE566",icon:"🧘",title:"TEMPLO",           desc:"Tu Camino · Tu Templo · Tu Legado",btn:"ENTRAR AL TEMPLO",id:"templo"},
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
  {screen:"home",       highlight:null,           master:"Bienvenido, Templario.",              sub:"Has cruzado el umbral del Templo del Propósito. Soy el Maestro Templario. Te guiaré personalmente por cada rincón de la PROPO-TIENDA.",btn:"Continuar"},
  {screen:"home",       highlight:"coins",         master:"Estos son tus PropoCoins.",           sub:"Los PropoCoins representan tu acceso a herramientas, módulos y recompensas dentro de la Propo-Tienda. Cada acción dentro del templo puede fortalecerte y otorgarte nuevos PropoCoins.",btn:"Continuar"},
  {screen:"home",       highlight:"claves",        master:"Las Claves.",                         sub:"Contienen herramientas directas diseñadas para ayudarte a resolver conflictos específicos dentro de un territorio. Son instrumentos de alto impacto.",btn:"Continuar"},
  {screen:"home",       highlight:"victorias",     master:"Victorias Rápidas.",                  sub:"Están diseñadas para generar cambios inmediatos mediante acciones simples y aplicables. Resultados visibles en minutos.",btn:"Continuar"},
  {screen:"home",       highlight:"mapas",         master:"Los Mapas del Templo.",               sub:"Te permiten comprender territorios completos y avanzar estratégicamente dentro de tu proceso de transformación.",btn:"Continuar"},
  {screen:"territories",highlight:null,            master:"Los Territorios del Templo.",         sub:"El templo se divide en territorios fundamentales. Cada uno representa un área esencial de tu vida.",btn:"Continuar"},
  {screen:"territories",highlight:"t_0",           master:"Territorio del Cuerpo.",              sub:"Hábitos, energía, disciplina física y estabilidad. El fundamento sobre el que todo lo demás se construye.",btn:"Continuar"},
  {screen:"territories",highlight:"t_1",           master:"Territorio de la Mente.",             sub:"Claridad mental, enfoque, creencias limitantes y arquitectura cognitiva. Tu mente es el primer campo de batalla.",btn:"Continuar"},
  {screen:"territories",highlight:"t_2",           master:"Territorio de las Emociones.",        sub:"Gestión emocional, resiliencia y regulación interna. Quien domina sus emociones, domina su destino.",btn:"Continuar"},
  {screen:"territories",highlight:"t_3",           master:"Territorio de las Relaciones.",       sub:"Vínculos, comunicación y entorno social. Tu círculo define tu trayectoria.",btn:"Continuar"},
  {screen:"territories",highlight:"t_connections", master:"Cada herramienta está vinculada a un territorio.",sub:"Los colores y símbolos te permiten identificar rápidamente el territorio relacionado con cada módulo del templo.",btn:"Ver Módulos"},
  {screen:"modules",    highlight:null,            master:"La Tienda del Templo.",               sub:"Aquí encontrarás todas las herramientas disponibles para desbloquear. Cada una tiene un costo en PropoCoins.",btn:"Continuar"},
  {screen:"modules",    highlight:"price",         master:"Canjea PropoCoins por herramientas.", sub:"Cada herramienta requiere cierta cantidad de PropoCoins para desbloquearse. Mientras más participes dentro del templo, más herramientas podrás obtener.",btn:"Continuar"},
  {screen:"modules",    highlight:"module_detail", master:"Antes de desbloquear una herramienta...",sub:"Podrás revisar sus objetivos, beneficios y a qué territorio pertenece. El conocimiento precede a la acción.",btn:"Ver el Arsenal"},
  {screen:"arsenal",    highlight:null,            master:"Tu Arsenal Personal.",                sub:"Aquí viven todas las herramientas que has desbloqueado. Este es tu poder acumulado, tu legado en construcción.",btn:"Continuar"},
  {screen:"arsenal",    highlight:"filters_territory",master:"Filtra por Territorio.",           sub:"Tu Arsenal puede filtrarse por territorios para acceder rápidamente a herramientas de un área específica.",btn:"Continuar"},
  {screen:"arsenal",    highlight:"filters_type",  master:"Filtra por Tipo de Herramienta.",     sub:"También puedes organizar tu Arsenal según el tipo: Claves, Victorias Rápidas o Mapas del Templo.",btn:"Finalizar"},
  {screen:"final",      highlight:null,            master:"El templo te espera, Templario.",     sub:"Ya conoces los secretos de la Propo-Tienda. Tu camino comienza ahora. Tu propósito te llama.",btn:"Entrar al Templo"},
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
function HomeScreen({highlight,highlightPortalIds,coins,timerStr,mobile,size}) {
  const dim=(id)=>highlightPortalIds.length>0&&!highlightPortalIds.includes(id);
  const portalScrollRef=useRef(null);

  const availW = mobile ? size.w - 32 : size.w * 0.58;
  const pScale = Math.min(1, Math.max(0.58, availW / 958));

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
    <div style={{display:"flex",flexDirection:"column",height:"100%",position:"relative"}}>
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
        position:"relative",minHeight:0,overflow:"hidden",
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
                  <div style={{fontSize:9,color:C.amber,marginTop:4}}>⏱ {timerStr}</div>
                </div>
              </div>
            </motion.div>
            <div
              style={{position:"absolute",left:120,bottom:50,fontSize:90,zIndex:highlight==="coins"?53:1,
                animation:"floatIcon 3s ease-in-out infinite alternate",
                opacity:(highlight&&highlight!=="coins")?0.1:1,transition:"opacity 0.3s"}}>
              <img src="https://i.imgur.com/7ofsCSm.png" alt="Maestro" style={{width:"100%",height:"100%",objectFit:"contain",borderRadius:"50%"}}/>
            </div>
          </>
        )}

        {/* PORTALS ROW */}
        <div
          ref={portalScrollRef}
          style={{
            display:"flex",alignItems:"center",
            gap:mobile?8:8,
            padding:mobile?"8px 20px":"0 20px",
            overflowX:mobile?"auto":"visible",
            overflowY:"visible",
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

      {/* ── EVENTS BAR ── */}
      <motion.div animate={{opacity:highlight?0.12:1}}
        style={{display:"flex",alignItems:"center",justifyContent:"center",gap:mobile?8:12,
          padding:mobile?"4px 0":"5px 0",borderTop:`1px solid rgba(212,175,55,0.1)`,
          background:"rgba(4,2,14,0.8)",zIndex:2,flexShrink:0}}>
        <span style={{fontSize:mobile?12:14}}>🏛</span>
        <div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:mobile?9:10,fontWeight:700,
            letterSpacing:3,color:C.goldBright}}>EVENTOS</div>
          {!mobile&&<div style={{fontSize:9,color:"rgba(255,255,255,0.35)"}}>Siempre hay algo nuevo por descubrir.</div>}
        </div>
        <span style={{color:C.goldDim,fontSize:mobile?12:14}}>→</span>
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

// ─── FINAL SCREEN ────────────────────────────────────────
function FinalScreen({mobile}) {
  return (
    <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",
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
  const [timerSecs,setTimerSecs]=useState(23*3600+39*60+12);
  const size=useWindowSize();

  const mobile=size.w<900;
  const panelH=mobile?95:128;

  useEffect(()=>{
    const iv=setInterval(()=>setTimerSecs(s=>Math.max(0,s-1)),1000);
    return ()=>clearInterval(iv);
  },[]);

  const fmtTimer=s=>{
    const h=String(Math.floor(s/3600)).padStart(2,"0");
    const m=String(Math.floor((s%3600)/60)).padStart(2,"0");
    const sec=String(s%60).padStart(2,"0");
    return `${h}:${m}:${sec}`;
  };

  const cur=STEPS[step];
  const isLast=step===STEPS.length-1;
  const advance=()=>{ if(isLast){if(onComplete)onComplete();} else setStep(s=>s+1); };

  const highlightPortalIds=(()=>{
    if (cur.screen!=="home") return [];
    if (cur.highlight==="claves") return ["claves"];
    if (cur.highlight==="victorias") return ["victorias"];
    if (cur.highlight==="mapas") return ["mapas"];
    return [];
  })();

  const commonScreenProps={mobile,panelH,size};

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:9999,
      background:`linear-gradient(180deg,#050215 0%,#0a0530 20%,#080320 50%,${C.bg} 100%)`,
      color:"#fff",overflow:"hidden",userSelect:"none",
      fontFamily:"'Crimson Text',serif",
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
      `}</style>

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
              timerStr={fmtTimer(timerSecs)}
              {...commonScreenProps}/>
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
        {cur.screen==="final"&&(
          <motion.div key="final"
            initial={{opacity:0,scale:1.08}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
            transition={{duration:0.8}} style={{position:"absolute",inset:0}}>
            <FinalScreen mobile={mobile}/>
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
  );
}