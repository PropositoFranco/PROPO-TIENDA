import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReferralBattlePass from './ReferralBattlePass';
import VipRuleta from '../../components/ui/VipRuleta';
import { usePlayerStore } from '../../store/usePlayerStore';
import maestroImg from '../../assets/maestro_templario.png';
import botonVipImg from '../../assets/boton vip.png';
import mascotImg from '../../assets/proposito_mascot.png';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import useMembershipStore, { ACADEMY_MODULES } from '../../store/useMembershipStore';
import { useUIStore } from '../../store/useUIStore';
import ReactDOM from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { XP_TABLE, XP_PER_LEVEL, RANK_BY_LEVEL, getXPProgress } from '../../config/constants';
import LocationCorrector from '../../components/LocationCorrector';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CONTENT_TYPES = [
  { id: 'todos',     label: 'TODOS',     line1: 'TODOS',     line2: '',          icon: '◈' },
  { id: 'claves',    label: 'CLAVES',    line1: 'CLAVES',    line2: '',          icon: '⚔' },
  { id: 'victorias', label: 'VICTORIAS', line1: 'VICTORIAS', line2: 'RÁPIDAS',   icon: '⚡' },
  { id: 'mapas',     label: 'MAPAS',     line1: 'MAPAS',     line2: 'DEL TEMPLO',icon: '⬡' },
];

const LEVEL_CONFIG = {
  LEGENDARIO: { color: '#d4af37', glow: 'rgba(212,175,55,0.8)' },
  MAESTRO:    { color: '#8b5cf6', glow: 'rgba(139,92,246,0.8)' },
  ÉLITE:      { color: '#06b6d4', glow: 'rgba(6,182,212,0.8)'  },
  AVANZADO:   { color: '#22c55e', glow: 'rgba(34,197,94,0.8)'  },
};

const DEFAULT_REWARDS = [
  { level:1,  id:'r1',  name:'Despertar',        description:'El comienzo del camino templario.',         icon:'🔵' },
  { level:2,  id:'r2',  name:'Recluta',           description:'Primer juramento al Templo.',               icon:'🟣' },
  { level:3,  id:'r3',  name:'Forjador',          description:'Tu voluntad empieza a forjarse.',           icon:'🔥' },
  { level:4,  id:'r4',  name:'Guardián',          description:'Proteges lo que construyes.',               icon:'🛡️' },
  { level:5,  id:'r5',  name:'Conquistador',      description:'Conquistas lo que otros no ven.',           icon:'⚔️' },
  { level:6,  id:'r6',  name:'Templarión',        description:'El Templo te reconoce como pilar.',         icon:'🏛️' },
  { level:7,  id:'r7',  name:'Vigía',             description:'Vigilas el horizonte con claridad.',        icon:'👁️' },
  { level:8,  id:'r8',  name:'Centinela',         description:'Guardas la puerta del conocimiento.',       icon:'⚡' },
  { level:9,  id:'r9',  name:'Heraldo',           description:'Anuncias la llegada de una nueva era.',     icon:'📯' },
  { level:10, id:'r10', name:'Dominante',         description:'Dominas el campo en todos los frentes.',    icon:'👑' },
  { level:11, id:'r11', name:'Arcano',            description:'El conocimiento oculto se revela ante ti.', icon:'🔮' },
  { level:12, id:'r12', name:'Señor de Arena',    description:'La arena te pertenece.',                    icon:'🏟️' },
  { level:13, id:'r13', name:'Élite',             description:'Pocos llegan aquí. Tú sí.',                 icon:'💠' },
  { level:14, id:'r14', name:'Maestro',           description:'Enseñas con el ejemplo.',                   icon:'🎯' },
  { level:15, id:'r15', name:'Gran Maestro',      description:'Tu legado empieza a escribirse.',           icon:'🌟' },
  { level:16, id:'r16', name:'Forjado en Fuego',  description:'El fuego te moldea, no te destruye.',       icon:'🔱' },
  { level:17, id:'r17', name:'Eterno',            description:'Tu impacto trasciende el tiempo.',          icon:'♾️' },
  { level:18, id:'r18', name:'Ascendido',         description:'Has trascendido el límite ordinario.',      icon:'🌠' },
  { level:19, id:'r19', name:'Mítico',            description:'Tu nombre es leyenda en el Templo.',        icon:'🐉' },
  { level:20, id:'r20', name:'Propo-Leyenda',     description:'La cima absoluta. El Templo es tuyo.',      icon:'🏆' },
];

const DEFAULT_ACHIEVEMENTS = [
  { id:'a1', name:'???', description:'Sigue tu camino.', icon:'🔒', requirement:'Desconocido', unlocked:false, rarity:'LEGENDARIO' },
  { id:'a2', name:'???', description:'Sigue tu camino.', icon:'🔒', requirement:'Desconocido', unlocked:false, rarity:'MAESTRO'    },
  { id:'a3', name:'???', description:'Sigue tu camino.', icon:'🔒', requirement:'Desconocido', unlocked:false, rarity:'ÉLITE'      },
  { id:'a4', name:'???', description:'Sigue tu camino.', icon:'🔒', requirement:'Desconocido', unlocked:false, rarity:'AVANZADO'   },
  { id:'a5', name:'???', description:'Sigue tu camino.', icon:'🔒', requirement:'Desconocido', unlocked:false, rarity:'LEGENDARIO' },
  { id:'a6', name:'???', description:'Sigue tu camino.', icon:'🔒', requirement:'Desconocido', unlocked:false, rarity:'MAESTRO'    },
];

const SFX = {
  _ctx: null,
  _get() {
    if (!this._ctx) { try { this._ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
    return this._ctx;
  },
  _play(freq, type='sine', dur=0.12, vol=0.07, delay=0) {
    try {
      const ctx = this._get(); if (!ctx) return;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = type; o.frequency.value = freq;
      const t = ctx.currentTime + delay;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + dur + 0.01);
    } catch {}
  },
  hover()  { this._play(1200,'sine',0.05,0.03); },
  click()  { this._play(660,'triangle',0.09,0.07); this._play(990,'sine',0.07,0.05,0.05); },
  reveal() { [330,440,550,660,880].forEach((f,i) => this._play(f,'sine',0.18,0.06,i*0.06)); },
  coin()   { this._play(1047,'sine',0.09,0.12); this._play(1319,'sine',0.09,0.09,0.09); this._play(1568,'sine',0.12,0.07,0.18); },
  levelUp(){ [262,330,392,523,659,784].forEach((f,i) => this._play(f,'sine',0.3,0.1,i*0.08)); },
};

function hexToRgb(hex) {
  return { r:parseInt(hex.slice(1,3),16), g:parseInt(hex.slice(3,5),16), b:parseInt(hex.slice(5,7),16) };
}

// ─── PARTICLE CANVAS ──────────────────────────────────────────────────────────
function ParticleField() {
  const cv  = useRef(null);
  const st  = useRef({ p:[], raf:null });
  const drw = useCallback(()=>{
    const c=cv.current; if(!c) return;
    const ctx=c.getContext('2d'); const {width:W,height:H}=c; const s=st.current;
    if(!s.p.length) for(let i=0;i<180;i++){const pk=Math.random();s.p.push({x:Math.random()*W,y:Math.random()*H,sz:Math.random()*1.8+.2,sp:Math.random()*.22+.04,o:Math.random()*.5+.07,col:pk>.65?'#d4af37':pk>.4?'#7c3aed':pk>.2?'#c0c0c0':'#fff',ph:Math.random()*Math.PI*2,ps:Math.random()*.012+.004,dx:(Math.random()-.5)*.18});}
    ctx.clearRect(0,0,W,H);
    [[.2,.3,'rgba(124,58,237,0.07)',.5],[.8,.7,'rgba(212,175,55,0.05)',.4],[.5,.1,'rgba(192,192,192,0.03)',.3]].forEach(([fx,fy,col,r])=>{const g=ctx.createRadialGradient(W*fx,H*fy,0,W*fx,H*fy,W*r);g.addColorStop(0,col);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);});
    s.p.forEach(p=>{p.y-=p.sp;p.x+=p.dx;p.ph+=p.ps;if(p.y<-4){p.y=H+4;p.x=Math.random()*W;}if(p.x<-4)p.x=W+4;if(p.x>W+4)p.x=-4;ctx.globalAlpha=p.o*(0.65+Math.sin(p.ph)*.35);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fill();});
    ctx.globalAlpha=1; s.raf=requestAnimationFrame(drw);
  },[]);
  useEffect(()=>{
    const c=cv.current; if(!c) return;
    const rz=()=>{c.width=c.offsetWidth;c.height=c.offsetHeight;st.current.p=[];};
    rz(); window.addEventListener('resize',rz); st.current.raf=requestAnimationFrame(drw);
    return()=>{cancelAnimationFrame(st.current.raf);window.removeEventListener('resize',rz);};
  },[drw]);
  return <canvas ref={cv} style={{position:'fixed',inset:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none'}}/>;
}

// ─── LEVEL 6 MODAL ────────────────────────────────────────────────────────────
function Level6Modal({ userId, onClose }) {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || loading || !userId) return;
    setLoading(true);
    try {
      await supabase.from('product_feedback').insert({
        user_id: userId,
        message: text.trim(),
        source:  'nivel6_legendario',
      });
      setSent(true);
    } catch (err) {
      console.error('Level6Modal error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(2,0,12,0.95)',backdropFilter:'blur(20px)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'20px',paddingTop:'max(72px, env(safe-area-inset-top, 20px) + 60px)',overflowY:'auto',animation:'fadeIn .3s ease'}}>
      <div onClick={e=>e.stopPropagation()} style={{position:'relative',maxWidth:'440px',width:'100%',borderRadius:'28px',background:'linear-gradient(155deg,rgba(255,215,0,0.1) 0%,rgba(8,3,26,0.99) 50%,rgba(2,0,12,1) 100%)',border:'1.5px solid rgba(255,215,0,0.6)',padding:'clamp(20px,4vw,36px)',textAlign:'center',boxShadow:'0 0 80px rgba(255,215,0,0.3),0 0 160px rgba(255,215,0,0.1)',overflow:'hidden',marginBottom:'20px'}}>

        {/* Shimmer */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,transparent,rgba(255,215,0,0.05) 50%,transparent)',backgroundSize:'200% 200%',animation:'silverSweep 3s ease-in-out infinite',pointerEvents:'none'}}/>

        {/* Corner runes */}
        {['◈','✦','◆','⬡'].map((r,i)=>(
          <div key={i} style={{position:'absolute',top:i<2?'14px':'auto',bottom:i>=2?'14px':'auto',left:i%2===0?'16px':'auto',right:i%2!==0?'16px':'auto',fontFamily:"'Cinzel',serif",fontSize:'11px',color:'#ffd700',opacity:0.3,animation:`glowPulse ${2+i*0.4}s ease-in-out ${i*0.3}s infinite`}}>{r}</div>
        ))}

        {!sent ? (
          <>
            <div style={{fontSize:'52px',marginBottom:'12px',filter:'drop-shadow(0 0 24px rgba(255,215,0,0.9))',animation:'coinBounce 2.5s ease-in-out infinite'}}>👑</div>

            <div style={{display:'inline-block',padding:'4px 18px',borderRadius:'100px',background:'rgba(255,215,0,0.12)',border:'1px solid rgba(255,215,0,0.6)',fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'3px',color:'#ffd700',marginBottom:'16px',boxShadow:'0 0 20px rgba(255,215,0,0.4)'}}>
              ⚔ PROPOMASTER LEGENDARIO ⚔
            </div>

            <h2 style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(18px,4vw,24px)',fontWeight:900,background:'linear-gradient(135deg,#ffd700 0%,#fff8dc 50%,#ffd700 100%)',backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',animation:'goldShimmer 3s linear infinite',marginBottom:'10px',lineHeight:1.2}}>
              ¿Quieres algo creado solo para ti?
            </h2>

            <p style={{fontFamily:"'Raleway',sans-serif",fontSize:'12px',color:'rgba(200,185,240,0.65)',lineHeight:1.7,marginBottom:'20px'}}>
              Llegaste al nivel más alto del Templo.<br/>
              Si quieres, podemos construir algo<br/>
              <span style={{color:'rgba(255,215,0,0.8)',fontWeight:700}}>diseñado específicamente para tu negocio o meta.</span>
            </p>

            <div style={{background:'rgba(255,215,0,0.04)',border:'1px solid rgba(255,215,0,0.15)',borderRadius:'14px',padding:'12px 16px',marginBottom:'12px',textAlign:'left'}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:'7px',letterSpacing:'3px',color:'rgba(255,215,0,0.45)',marginBottom:'8px'}}>⚔ TU CAMINO CONTINÚA</div>
              <div style={{fontFamily:"'Raleway',sans-serif",fontSize:'11px',color:'rgba(200,185,240,0.6)',lineHeight:1.7,marginBottom:'10px'}}>
                Alcanzar el nivel 6 no es el final — es el punto de partida real.<br/>
                Tu plan semanal sigue activo. Cada semana cuenta.
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{flex:1,height:'4px',borderRadius:'100px',background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                  <div style={{height:'100%',width:'60%',background:'linear-gradient(90deg,#7c3aed,#d4af37)',borderRadius:'100px',boxShadow:'0 0 8px rgba(212,175,55,0.6)',animation:'silverSweep 2s ease-in-out infinite'}}/>
                </div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:'7px',color:'rgba(255,215,0,0.5)',whiteSpace:'nowrap',letterSpacing:'1px'}}>SEMANA EN CURSO</div>
              </div>
            </div>

            <div style={{background:'rgba(255,215,0,0.06)',border:'1px solid rgba(255,215,0,0.2)',borderRadius:'14px',padding:'14px 18px',marginBottom:'20px',textAlign:'left'}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'3px',color:'rgba(255,215,0,0.5)',marginBottom:'8px'}}>✦ ¿QUÉ NECESITAS EXACTAMENTE?</div>
              <textarea
                value={text}
                onChange={e=>setText(e.target.value)}
                placeholder="Describe tu negocio, tu meta principal, o el problema que quieres resolver..."
                rows={4}
                style={{width:'100%',padding:'12px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,215,0,0.2)',borderRadius:'10px',color:'#fff',fontFamily:"'Raleway',sans-serif",fontSize:'12px',outline:'none',resize:'none',boxSizing:'border-box',lineHeight:'1.6'}}
              />
            </div>

            <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
              <button
                onClick={handleSend}
                disabled={!text.trim()||loading}
                style={{padding:'12px 32px',borderRadius:'100px',background:text.trim()?'linear-gradient(135deg,rgba(255,215,0,0.25),rgba(255,215,0,0.4))':'rgba(255,255,255,0.04)',border:`1.5px solid ${text.trim()?'rgba(255,215,0,0.8)':'rgba(255,255,255,0.08)'}`,color:text.trim()?'#ffd700':'rgba(200,185,240,0.3)',fontFamily:"'Cinzel',serif",fontSize:'10px',fontWeight:900,letterSpacing:'2px',cursor:text.trim()?'pointer':'default',boxShadow:text.trim()?'0 0 30px rgba(255,215,0,0.4)':'none',transition:'all .3s ease'}}
              >
                {loading ? '⏳ ENVIANDO...' : '⚔ ENVIAR AL FUNDADOR'}
              </button>
              <button onClick={onClose} style={{padding:'12px 20px',borderRadius:'100px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(200,185,240,0.4)',fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'2px',cursor:'pointer'}}>
                CERRAR
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{fontSize:'56px',marginBottom:'16px',filter:'drop-shadow(0 0 28px rgba(255,215,0,1))',animation:'coinBounce 2.5s ease-in-out infinite'}}>⚔️</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(16px,3vw,22px)',fontWeight:900,background:'linear-gradient(135deg,#ffd700,#fff8dc,#ffd700)',backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',animation:'goldShimmer 3s linear infinite',marginBottom:'12px'}}>
              MISIÓN COMPLETADA
            </div>
            <p style={{fontFamily:"'Raleway',sans-serif",fontSize:'12px',color:'rgba(200,185,240,0.6)',lineHeight:1.7,marginBottom:'24px'}}>
              Tu solicitud fue recibida.<br/>
              <span style={{color:'rgba(255,215,0,0.8)',fontWeight:700}}>Si hay match, el Fundador te contacta.</span>
            </p>
            <button onClick={onClose} style={{padding:'12px 32px',borderRadius:'100px',background:'linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,215,0,0.25))',border:'1px solid rgba(255,215,0,0.5)',color:'#ffd700',fontFamily:"'Cinzel',serif",fontSize:'9px',letterSpacing:'2px',cursor:'pointer',boxShadow:'0 0 20px rgba(255,215,0,0.3)'}}>
              ✦ CERRAR
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── XP BAR ───────────────────────────────────────────────────────────────────
function XPBar({ xp, xpMax, level, userId }) {
  const [showLevel6Modal, setShowLevel6Modal] = useState(false);
  const targetPct = Math.min((xp / xpMax) * 100, 100);
  const [pct,     setPct]      = useState(0);
  const [displayXP,setDisplayXP] = useState(0);
  const [burst,   setBurst]    = useState(false);
  const [settled, setSettled]  = useState(false);

  /* ── Overshoot → settle ── */
  useEffect(() => {
    setSettled(false); setBurst(false);
    const t1 = setTimeout(() => {
      setPct(Math.min(targetPct + 5, 100));   // disparo con overshoot
    }, 350);
    const t2 = setTimeout(() => {
      setPct(targetPct);                       // regresa al valor real
    }, 1550);
    const t3 = setTimeout(() => {
      setBurst(true);                          // destellos al detenerse
      setSettled(true);
    }, 1900);
    const t4 = setTimeout(() => setBurst(false), 2700);
    return () => [t1,t2,t3,t4].forEach(clearTimeout);
  }, [xp, xpMax, targetPct]);

  /* ── Contador XP ── */
  useEffect(() => {
    const delay = 350, dur = 1500;
    const t0 = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setDisplayXP(Math.round(ease * xp));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t0);
  }, [xp]);

  /* ── Partículas de burst ── */
  const Sparks = burst ? (
    [...Array(10)].map((_, i) => {
      const angle = (i / 10) * 360;
      const dist  = 18 + Math.random() * 18;
      return (
        <div key={i} style={{
          position: 'absolute',
          right: `${100 - targetPct}%`,
          top: '50%',
          width: '4px', height: '4px',
          borderRadius: '50%',
          background: i % 2 === 0 ? '#fde68a' : '#a855f7',
          pointerEvents: 'none',
          animation: `spark${i % 3} .7s ease-out forwards`,
          '--dx': `${Math.cos((angle * Math.PI) / 180) * dist}px`,
          '--dy': `${Math.sin((angle * Math.PI) / 180) * dist}px`,
          zIndex: 10,
        }}/>
      );
    })
  ) : null;

  return (
    <>
      {/* ── keyframes inyectados una sola vez ── */}
      

      <div style={{width:'100%'}}>
        {/* ── header igual al tuyo ── */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#d4af37)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cinzel',serif",fontSize:'11px',fontWeight:'900',color:'#fff',boxShadow:'0 0 18px rgba(212,175,55,0.55)',animation:settled?'xpFillPulse 1.6s ease-in-out 3':'none'}}>{level}</div>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'2px',color:'rgba(212,175,55,0.95)'}}>NIVEL ACTUAL</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'2px',color:'rgba(200,185,240,0.85)'}}>{level>=20?'RANGO':'SIGUIENTE'}</span>
            <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'rgba(124,58,237,0.15)',border:'1px solid rgba(212,175,55,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cinzel',serif",fontSize:'11px',fontWeight:'900',color:'rgba(212,175,55,0.45)'}}>{level>=20?'👑':level+1}</div>
          </div>
        </div>

        {/* ── barra ── */}
        <div style={{position:'relative',height:'16px',borderRadius:'100px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(212,175,55,0.15)',overflow:'visible'}}>
          {[25,50,75].map(t=><div key={t} style={{position:'absolute',top:'-4px',bottom:'-4px',width:'1px',left:`${t}%`,background:'rgba(212,175,55,0.12)',zIndex:1}}/>)}

          {/* relleno con overshoot */}
          <div style={{
            position:'absolute',top:0,left:0,height:'100%',borderRadius:'100px',
            width:`${pct}%`,
            background:'linear-gradient(90deg,#4c1d95 0%,#7c3aed 25%,#a855f7 50%,#d4af37 75%,#fde68a 88%,#d4af37 100%)',
            backgroundSize:'200% auto',
            animation:'xpShimmer 2.2s linear infinite',
            /* overshoot = easeOutBack; settle = snappy */
            transition: pct > targetPct
              ? 'width 1.15s cubic-bezier(0.34,1.45,0.64,1)'
              : 'width 0.42s cubic-bezier(0.25,1,0.5,1)',
            boxShadow:'0 0 22px rgba(212,175,55,0.55),0 0 50px rgba(139,92,246,0.25)',
          }}>
            {/* tip: pulsa en reposo, explota al detenerse */}
            <div style={{
              position:'absolute',right:'-2px',top:'-5px',bottom:'-5px',
              width:'12px',
              background:'radial-gradient(ellipse,rgba(255,255,255,0.95) 0%,transparent 70%)',
              borderRadius:'50%',
              animation: burst ? 'tipBurst .6s ease-out forwards' : 'tipPulse 1.4s ease-in-out infinite',
            }}/>
          </div>

          {/* chispas */}
          <div style={{position:'absolute',inset:0,overflow:'visible',pointerEvents:'none'}}>{Sparks}</div>

          {/* texto XP con contador */}
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(255,255,255,0.85)',textShadow:'0 1px 4px rgba(0,0,0,0.9)',zIndex:2}}>
            {level>=20 ? '⚔ NIVEL MÁXIMO ⚔' : `${displayXP.toLocaleString()} / ${xpMax.toLocaleString()} XP`}
          </div>
        </div>

        {level>=20 && (
          <>
            <button
            onClick={()=>setShowLevel6Modal(true)}
            style={{
              marginTop:'10px',
              width:'100%',
              padding:'10px 0',
              background:'linear-gradient(135deg,#fbbf24,#d97706)',
              border:'none',
              borderRadius:'100px',
              color:'#0c0a2a',
              fontFamily:"'Cinzel',serif",
              fontWeight:'900',
              fontSize:'9px',
              letterSpacing:'2px',
              cursor:'pointer',
              boxShadow:'0 0 20px rgba(251,191,36,0.6)',
              animation:'maxLevelPulse 1.5s ease-in-out infinite',
            }}
            onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.03)';e.currentTarget.style.boxShadow='0 0 40px rgba(251,191,36,0.95)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 0 20px rgba(251,191,36,0.6)';}}
          >
            👑 ¿Quieres algo creado solo para ti?
          </button>

          <button
            onClick={()=>setShowLevel6Modal(true)}
            style={{marginTop:'8px',width:'100%',padding:'10px 0',background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.35)',borderRadius:'100px',color:'rgba(212,175,55,0.9)',fontFamily:"'Cinzel',serif",fontWeight:'700',fontSize:'8px',letterSpacing:'1.5px',cursor:'pointer',transition:'all .3s ease'}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(212,175,55,0.14)';e.currentTarget.style.borderColor='rgba(212,175,55,0.75)';e.currentTarget.style.boxShadow='0 0 20px rgba(212,175,55,0.25)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(212,175,55,0.06)';e.currentTarget.style.borderColor='rgba(212,175,55,0.35)';e.currentTarget.style.boxShadow='none';}}
          >
            ✦ Acceso exclusivo · Solo para Propomasters ✦
          </button>
          </>
        )}
        </div>

      {showLevel6Modal && (
        <Level6Modal userId={userId} onClose={() => setShowLevel6Modal(false)} />
      )}
    </>
  );
}

// ─── ENERGY SPHERE ────────────────────────────────────────────────────────────
function EnergySphere({ type, isActive, onClick, index }) {
  const [hov,setHov]=useState(false);
  const sz = isActive?148:hov?116:104;
  return (
    <div onClick={() => { onClick(); SFX.click(); }} onMouseEnter={()=>{setHov(true);SFX.hover();}} onMouseLeave={()=>setHov(false)}
      style={{position:'relative',width:`${sz}px`,height:`${sz}px`,borderRadius:'50%',cursor:'pointer',transition:'all 0.45s cubic-bezier(0.34,1.2,0.64,1)',flexShrink:0,animation:`sphereFloat ${3.5+index*0.6}s ease-in-out ${index*0.4}s infinite`,zIndex:isActive?10:hov?8:1}}>
      {/* Outer glow */}
      <div style={{position:'absolute',inset:`${isActive?-55:hov?-38:-20}px`,borderRadius:'50%',background:isActive?'radial-gradient(ellipse,rgba(192,192,192,0.16) 0%,rgba(212,175,55,0.1) 40%,transparent 70%)':hov?'radial-gradient(ellipse,rgba(192,192,192,0.1) 0%,transparent 65%)':'transparent',transition:'all .45s ease',pointerEvents:'none'}}/>
      {/* Body */}
      <div style={{position:'absolute',inset:0,borderRadius:'50%',background:isActive?'radial-gradient(ellipse at 30% 25%,rgba(220,220,255,0.22) 0%,rgba(100,60,200,0.72) 40%,rgba(55,5,145,0.96) 100%)':hov?'radial-gradient(ellipse at 30% 25%,rgba(200,200,240,0.18) 0%,rgba(90,40,190,0.62) 45%,rgba(48,0,124,0.93) 100%)':'radial-gradient(ellipse at 30% 25%,rgba(160,130,220,0.14) 0%,rgba(78,28,168,0.55) 50%,rgba(38,0,100,0.9) 100%)',border:isActive?'2px solid rgba(212,175,55,0.95)':hov?'1.5px solid rgba(212,175,55,0.7)':'1.5px solid rgba(212,175,55,0.32)',boxShadow:isActive?'0 0 55px rgba(212,175,55,0.65),0 0 110px rgba(139,92,246,0.4),inset 0 0 40px rgba(192,192,192,0.08)':hov?'0 0 36px rgba(212,175,55,0.42),0 0 72px rgba(139,92,246,0.26),inset 0 0 24px rgba(192,192,192,0.06)':'0 0 16px rgba(139,92,246,0.24),inset 0 1px 0 rgba(255,255,255,0.1)',transition:'all .45s ease',overflow:'hidden'}}>
        {/* Specular highlight */}
        <div style={{position:'absolute',top:'8%',left:'14%',width:'34%',height:'27%',borderRadius:'50%',background:(hov||isActive)?'radial-gradient(ellipse,rgba(255,255,255,0.36) 0%,transparent 70%)':'radial-gradient(ellipse,rgba(255,255,255,0.12) 0%,transparent 70%)',transition:'all .4s ease',pointerEvents:'none'}}/>
        {/* Silver sweep on hover / active */}
        {(hov||isActive)&&<div style={{position:'absolute',inset:0,borderRadius:'50%',background:'linear-gradient(135deg,transparent 0%,rgba(192,192,192,0.14) 40%,rgba(255,255,255,0.22) 50%,rgba(192,192,192,0.14) 60%,transparent 100%)',backgroundSize:'200% 200%',animation:'silverSweep 1.8s ease-in-out infinite',pointerEvents:'none'}}/>}
        {/* Rotating rings */}
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:isActive?.5:hov?.3:.15,transition:'opacity .4s',pointerEvents:'none'}}>
          <circle cx="50%" cy="50%" r="42%" fill="none" stroke="rgba(212,175,55,0.6)" strokeWidth="1" strokeDasharray="5 7" style={{animation:'ringRotate 10s linear infinite',transformOrigin:'center',transformBox:'fill-box',willChange:'transform'}}/>
        </svg>
      </div>
      {/* Label */}
      <div style={{position:'absolute',inset:0,borderRadius:'50%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'2px',zIndex:2}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:isActive?'11px':'9px',fontWeight:'900',letterSpacing:'1.5px',color:isActive?'#fde68a':hov?'#e8d5a3':'rgba(240,220,180,0.8)',textShadow:isActive?'0 0 16px rgba(212,175,55,0.9),0 0 30px rgba(255,255,255,0.4)':hov?'0 0 12px rgba(212,175,55,0.7)':'none',textAlign:'center',lineHeight:1.2,transition:'all .4s ease'}}>
          {type.line1}
          {type.line2&&<><br/><span style={{fontSize:'7.5px',letterSpacing:'1px',opacity:.85}}>{type.line2}</span></>}
        </div>
        <div style={{fontSize:isActive?'18px':hov?'15px':'13px',transition:'font-size .4s ease',filter:isActive?'drop-shadow(0 0 8px rgba(212,175,55,0.8))':hov?'drop-shadow(0 0 5px rgba(212,175,55,0.5))':'none',lineHeight:1.2}}>{type.icon}</div>
      </div>
    </div>
  );
}

const SPHERES = [
  { idx: 0, icon: '🧠', color: '#60a5fa', label: 'Mente',          territory: 'mente' },
  { idx: 1, icon: '💪', color: '#ef4444', label: 'Cuerpo',         territory: 'cuerpo' },
  { idx: 2, icon: '🌴', color: '#f97316', label: 'Ocio',           territory: 'ocio' },
  { idx: 3, icon: '🪷', color: '#06b6d4', label: 'Espiritualidad', territory: 'espiritualidad' },
  { idx: 4, icon: '🎯', color: '#8b5cf6', label: 'Vocación',       territory: 'vocacion' },
  { idx: 5, icon: '👥', color: '#22c55e', label: 'Relaciones',     territory: 'relaciones' },
  { idx: 6, icon: '💰', color: '#eab308', label: 'Finanzas',       territory: 'finanzas' },
  { idx: 7, icon: '💗', color: '#ec4899', label: 'Emociones',      territory: 'emociones' },
];

// ─── MODULE INTRO OVERLAY ──────────────────────────────────────────────────────────
function ModuleIntroView({ item, onClose, onActivate, alreadyActivated }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [activated, setActivated] = useState(alreadyActivated || false);
  const c = hexToRgb(item.color);
  const level = LEVEL_CONFIG[item.level] || LEVEL_CONFIG.AVANZADO;
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 380);
  };

  const handleActivate = () => {
    if (onActivate) onActivate(item);
    setActivated(true);
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1500,
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? '0' : 'clamp(10px,2vw,24px)',
        background: `rgba(1,0,10,${visible ? 0.97 : 0})`,
        backdropFilter: `blur(${visible ? 32 : 0}px)`,
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="intro-scroll"
        style={{
          maxWidth: isMobile ? '100%' : 'clamp(300px,92vw,800px)',
          width: '100%',
          maxHeight: isMobile ? '94dvh' : '96dvh',
          borderRadius: isMobile ? '28px 28px 0 0' : '28px',
          overflowY: 'auto',
          background: `linear-gradient(172deg, rgba(8,3,28,0.99) 0%, rgba(3,1,16,0.99) 100%)`,
          border: `1px solid rgba(${c.r},${c.g},${c.b},0.45)`,
          boxShadow: `0 0 130px rgba(${c.r},${c.g},${c.b},0.45), 0 0 260px rgba(${c.r},${c.g},${c.b},0.15), inset 0 1px 0 rgba(255,255,255,0.07)`,
          animation: visible ? `introSlideUp 0.48s cubic-bezier(0.34,1.1,0.64,1) forwards` : 'none',
          opacity: visible ? 1 : 0,
          position: 'relative',
        }}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: `rgba(${c.r},${c.g},${c.b},0.4)` }} />
          </div>
        )}

        {/* Cover */}
        <div style={{
          position: 'relative',
          height: isMobile ? '240px' : 'clamp(220px, 32vw, 310px)',
          overflow: 'hidden',
          background: `linear-gradient(148deg, rgba(${c.r},${c.g},${c.b},0.55) 0%, rgba(${c.r},${c.g},${c.b},0.2) 42%, rgba(0,0,0,0.88) 100%)`,
          borderRadius: isMobile ? '24px 24px 0 0' : '28px 28px 0 0',
        }}>
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 22% 28%, rgba(${c.r},${c.g},${c.b},0.65) 0%, transparent 52%)` }}/>
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 82% 78%, rgba(${c.r},${c.g},${c.b},0.38) 0%, transparent 48%)` }}/>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 55%, transparent 25%, rgba(0,0,0,0.7) 100%)' }}/>

          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.09 }}>
            {[...Array(10)].map((_,i)=><line key={`h${i}`} x1="0" y1={`${(i+1)*9.1}%`} x2="100%" y2={`${(i+1)*9.1}%`} stroke={item.color} strokeWidth="1"/>)}
            {[...Array(12)].map((_,i)=><line key={`v${i}`} x1={`${(i+1)*7.7}%`} y1="0" x2={`${(i+1)*7.7}%`} y2="100%" stroke={item.color} strokeWidth="1"/>)}
            <circle cx="50%" cy="50%" r="90" fill="none" stroke={item.color} strokeWidth="1.8"/>
            <circle cx="50%" cy="50%" r="60" fill="none" stroke={item.color} strokeWidth="1.2"/>
          </svg>

          {[1.9, 2.7, 3.5].map((scale, i) => (
            <div key={i} style={{
              position:'absolute', left:'50%', top:'50%',
              width:'80px', height:'80px', marginLeft:'-40px', marginTop:'-40px',
              borderRadius:'50%', border:`1px solid rgba(${c.r},${c.g},${c.b},${0.42-i*0.11})`,
              transform:`scale(${scale})`,
              animation:`cardPulseRing ${2.5+i*0.7}s ease-in-out infinite`,
              animationDelay:`${i*0.5}s`,
            }}/>
          ))}

          {item.image
            ? <img src={item.image} alt={item.title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:2 }}/>
            : <div style={{
                position:'absolute', left:'50%', top:'46%', transform:'translate(-50%,-50%)',
                fontSize: isMobile ? '80px' : '100px', lineHeight:1, zIndex:2,
                filter:`drop-shadow(0 0 55px ${item.color}) drop-shadow(0 0 110px rgba(${c.r},${c.g},${c.b},0.65))`,
                animation:'heroFloat 4.5s ease-in-out infinite',
              }}>{item.icon}</div>
          }

          {/* Top badges */}
          <div style={{ position:'absolute', top:'14px', left:'16px', display:'flex', gap:'8px' }}>
            <div style={{ padding:'5px 12px', borderRadius:'12px', background:'rgba(0,0,0,0.72)', border:'1px solid rgba(255,215,60,0.4)', fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'2px', color:'rgba(255,215,60,0.95)' }}>
              {CONTENT_TYPES.find(t=>t.id===item.type)?.icon} {CONTENT_TYPES.find(t=>t.id===item.type)?.label}
            </div>
            {item.level && (
              <div style={{ padding:'5px 12px', borderRadius:'12px', background:'rgba(0,0,0,0.72)', border:`1px solid ${level.color}`, fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'2px', color:level.color, boxShadow:`0 0 16px ${level.glow}` }}>
                {item.level}
              </div>
            )}
          </div>

          {/* Close */}
          <button onClick={handleClose} style={{
            position:'absolute', top:'12px', right:'12px',
            width:'38px', height:'38px', borderRadius:'50%',
            background:'rgba(0,0,0,0.7)', border:`1px solid rgba(${c.r},${c.g},${c.b},0.4)`,
            color:'rgba(255,255,255,0.85)', fontSize:'15px', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:10,
            transition:'all 0.2s', fontFamily:'sans-serif',
          }}>✕</button>

          {/* Title block */}
          <div style={{ position:'absolute', bottom:'22px', left:'24px', right:'60px' }}>
            <div style={{ fontFamily:"'Raleway', sans-serif", fontSize:'10px', letterSpacing:'3.5px', textTransform:'uppercase', color:`rgba(${c.r},${c.g},${c.b},0.9)`, marginBottom:'8px', fontWeight:'600' }}>
              {item.subtitle}
            </div>
            <h2 style={{
              fontFamily:"'Cinzel', serif",
              fontSize: isMobile ? 'clamp(22px, 7vw, 30px)' : 'clamp(26px, 5vw, 38px)',
              fontWeight:'900', letterSpacing:'0.06em', lineHeight:1.1, color:'#ffffff',
              textShadow:`0 0 28px ${item.color}, 0 0 60px rgba(${c.r},${c.g},${c.b},0.6)`,
            }}>{item.title}</h2>
          </div>

          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'130px', background:`linear-gradient(to top, rgba(8,3,28,1), transparent)` }}/>
        </div>

        {/* Body */}
        <div style={{ padding: isMobile ? '16px 16px 0' : '18px 28px 0' }}>

          {/* Description + meta */}
          <div style={{ display:'flex', gap:'12px', alignItems:'flex-start', marginBottom:'16px', flexDirection: isMobile ? 'column' : 'row' }}>
            <p style={{
              flex:1, fontFamily:"'Raleway', sans-serif",
              fontSize: item.description.length < 80 ? '15px' : '13px',
              lineHeight:1.75, color:'rgba(225,215,255,0.95)', fontWeight:'300',
              borderLeft:`3px solid rgba(${c.r},${c.g},${c.b},0.6)`, paddingLeft:'16px', fontStyle:'italic',
              textShadow:`0 0 12px rgba(${c.r},${c.g},${c.b},0.25)`,
            }}>{item.description}</p>

            <div style={{ display:'flex', flexDirection: isMobile ? 'row' : 'column', gap:'8px', flexShrink:0 }}>
              {[
                { label:'TERRITORIO', value: SPHERES.find(s=>s.territory===item.territory)?.label },
                item.level && { label:'NIVEL', value: item.level },
                item.duration && { label:'DURACIÓN', value: item.duration },
              ].filter(Boolean).map((meta, i) => (
                <div key={i} style={{
                  padding:'6px 12px', borderRadius:'10px',
                  background:`rgba(${c.r},${c.g},${c.b},0.14)`,
                  border:`1px solid rgba(${c.r},${c.g},${c.b},0.38)`,
                  minWidth: isMobile ? '0' : '100px',
                }}>
                  <div style={{ fontFamily:"'Raleway', sans-serif", fontSize:'7px', letterSpacing:'2.5px', fontWeight:'700', color:'rgba(255,215,60,0.95)', marginBottom:'3px' }}>
                    {meta.label}
                  </div>
                  <div style={{ fontFamily:"'Raleway', sans-serif", fontSize:'12px', color:item.color, fontWeight:'700', textShadow:`0 0 12px rgba(${c.r},${c.g},${c.b},0.7)` }}>
                    {meta.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Impact section divider */}
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
            <div style={{ flex:1, height:'1px', background:`linear-gradient(to right, transparent, rgba(${c.r},${c.g},${c.b},0.55))` }}/>
            <div style={{
              fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'4px', textTransform:'uppercase',
              padding:'6px 18px', borderRadius:'20px',
              background:`linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.28), rgba(${c.r},${c.g},${c.b},0.1))`,
              border:`1px solid rgba(${c.r},${c.g},${c.b},0.55)`,
              color:'#ffffff', textShadow:`0 0 12px rgba(${c.r},${c.g},${c.b},1), 0 0 24px rgba(${c.r},${c.g},${c.b},0.8)`,
              boxShadow:`0 0 20px rgba(${c.r},${c.g},${c.b},0.35)`,
            }}>◈ IMPACTO PRINCIPAL</div>
            <div style={{ flex:1, height:'1px', background:`linear-gradient(to left, transparent, rgba(${c.r},${c.g},${c.b},0.55))` }}/>
          </div>

          {/* Impact panels */}
          <div style={{
            display:'grid',
            gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fit, minmax(160px, 1fr))',
            gap:'12px', marginBottom:'24px',
          }}>
            {item.impact.map((imp, i) => (
              <div key={i} style={{
                padding:'18px 16px', borderRadius:'16px',
                background:`linear-gradient(148deg, rgba(${c.r},${c.g},${c.b},0.2), rgba(${c.r},${c.g},${c.b},0.06))`,
                border:`1px solid rgba(${c.r},${c.g},${c.b},0.45)`,
                boxShadow:`0 4px 24px rgba(${c.r},${c.g},${c.b},0.15), inset 0 1px 0 rgba(255,255,255,0.07)`,
                animation:`panelReveal 0.45s ease forwards`, animationDelay:`${0.15+i*0.1}s`, opacity:0,
              }}>
                <div style={{
                  width:'38px', height:'38px', borderRadius:'50%',
                  background:`rgba(${c.r},${c.g},${c.b},0.22)`,
                  border:`1px solid rgba(${c.r},${c.g},${c.b},0.55)`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'20px', marginBottom:'12px',
                  boxShadow:`0 0 18px rgba(${c.r},${c.g},${c.b},0.55), 0 0 36px rgba(${c.r},${c.g},${c.b},0.25)`,
                }}>{item.icon}</div>
                <div style={{
                  fontFamily:"'Raleway', sans-serif", fontSize:'13px',
                  color:'rgba(240,232,255,0.98)', fontWeight:'500', lineHeight:1.6,
                }}>{imp}</div>
              </div>
            ))}
          </div>

          {/* Transformation block */}
          {item.transformation && (
            <div style={{
              position:'relative', padding:'22px 24px', borderRadius:'18px', marginBottom:'24px',
              background:`linear-gradient(132deg, rgba(${c.r},${c.g},${c.b},0.16), rgba(${c.r},${c.g},${c.b},0.05))`,
              border:`1px solid rgba(${c.r},${c.g},${c.b},0.32)`,
              borderLeft:`3px solid ${item.color}`,
              overflow:'hidden',
            }}>
              <div style={{ position:'absolute', right:'18px', top:'50%', transform:'translateY(-50%)', fontSize:'82px', opacity:0.07, pointerEvents:'none', lineHeight:1 }}>{item.icon}</div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                <div style={{ flex:1, height:'1px', background:`linear-gradient(to right, transparent, rgba(${c.r},${c.g},${c.b},0.45))`}}/>
                <div style={{ fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'4px', textTransform:'uppercase', padding:'5px 16px', borderRadius:'4px', background:`rgba(${c.r},${c.g},${c.b},0.12)`, border:`1px solid rgba(${c.r},${c.g},${c.b},0.4)`, borderLeft:`3px solid ${item.color}`, color:'#ffffff', textShadow:`0 0 12px rgba(${c.r},${c.g},${c.b},1)` }}>
                  ✦ TRANSFORMACIÓN
                </div>
                <div style={{ flex:1, height:'1px', background:`linear-gradient(to left, transparent, rgba(${c.r},${c.g},${c.b},0.45))`}}/>
              </div>
              <p style={{
                fontFamily:"'Raleway', sans-serif", fontSize:'13px', lineHeight:1.78,
                color:'rgba(225,215,255,0.95)', fontWeight:'300', margin:0,
                borderLeft:`2px solid rgba(${c.r},${c.g},${c.b},0.5)`, paddingLeft:'16px', fontStyle:'italic',
                textShadow:`0 0 10px rgba(${c.r},${c.g},${c.b},0.25)`,
              }}>{item.transformation}</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ padding: isMobile ? '0 16px 28px' : '0 28px 32px' }}>
          {!activated ? (
            <button
              onClick={handleActivate}
              style={{
                '--cta-glow': `rgba(${c.r},${c.g},${c.b},0.65)`,
                '--cta-glow2': `rgba(${c.r},${c.g},${c.b},0.35)`,
                width:'100%', padding: isMobile ? '18px 24px' : '22px 32px', borderRadius:'18px',
                background:`linear-gradient(138deg, rgba(${c.r},${c.g},${c.b},0.88) 0%, rgba(${c.r},${c.g},${c.b},0.58) 50%, rgba(${Math.max(0,c.r-45)},${Math.max(0,c.g-45)},${Math.max(0,c.b-45)},0.82) 100%)`,
                border:`2px solid ${item.color}`,
                color:'#fff', cursor:'pointer',
                fontFamily:"'Cinzel', serif",
                fontSize: isMobile ? 'clamp(12px,3.5vw,16px)' : 'clamp(13px,2.5vw,18px)',
                letterSpacing:'3.5px', textTransform:'uppercase', fontWeight:'800',
                animation:'ctaBreath 2.2s ease-in-out infinite',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'14px',
                textShadow:'0 0 24px rgba(255,255,255,0.7)',
                position:'relative', overflow:'hidden',
                transition:'transform 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
            >
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)', backgroundSize:'200% auto', animation:'goldShimmer 2.5s linear infinite' }}/>
              <span style={{ fontSize:'22px', filter:`drop-shadow(0 0 12px ${item.color})`, position:'relative', zIndex:1 }}>⚡</span>
              <span style={{ position:'relative', zIndex:1 }}>ACTIVAR HERRAMIENTA</span>
              <span style={{ fontSize:'22px', filter:`drop-shadow(0 0 12px ${item.color})`, position:'relative', zIndex:1 }}>⚡</span>
            </button>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div style={{
                textAlign:'center', padding:'14px', background:'rgba(74,222,128,0.12)',
                border:'1px solid rgba(74,222,128,0.5)', borderRadius:'12px',
                fontFamily:"'Cinzel', serif", fontSize:'12px', letterSpacing:'2px', color:'#4ade80',
                boxShadow:'0 0 20px rgba(74,222,128,0.25)',
              }}>✅ HERRAMIENTA ACTIVADA</div>
              {item.slug && (
  <button
    onClick={() => { handleClose(); navigate(`/tool/${item.slug}`); }}
                  style={{
                    width:'100%', padding: isMobile ? '18px 24px' : '22px 32px', borderRadius:'18px',
                    background:`linear-gradient(138deg, rgba(${c.r},${c.g},${c.b},0.88), rgba(${c.r},${c.g},${c.b},0.58))`,
                    border:`2px solid ${item.color}`, color:'#fff', cursor:'pointer',
                    fontFamily:"'Cinzel', serif", fontSize:'clamp(12px,2.5vw,18px)',
                    letterSpacing:'3.5px', textTransform:'uppercase', fontWeight:'800',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'14px',
                    textShadow:'0 0 24px rgba(255,255,255,0.7)', transition:'transform 0.2s ease',
                  }}
                  onMouseEnter={e=>e.currentTarget.style.transform='scale(1.02)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                >
                  <span style={{fontSize:'22px'}}>🔓</span>
                  IR A VER HERRAMIENTA
                  <span style={{fontSize:'22px'}}>→</span>
                </button>
              )}
            </div>
          )}

          <p style={{
            textAlign:'center', marginTop:'12px',
            fontFamily:"'Raleway', sans-serif", fontSize:'10px', letterSpacing:'2px',
            color:'rgba(210,200,255,0.45)',
          }}>Herramienta desbloqueada · Acceso ilimitado</p>
        </div>

        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', borderRadius: 'inherit', overflow: 'visible', zIndex: 2 }}>
          <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="19" ry="19"
            fill="none" stroke={`rgba(${c.r},${c.g},${c.b},0.2)`} strokeWidth={2} />
          <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="19" ry="19"
            fill="none" stroke={`rgba(${c.r},${c.g},${c.b},1)`} strokeWidth={3}
            strokeDasharray="80 1320" strokeLinecap="round"
            filter={`drop-shadow(0 0 6px rgba(${c.r},${c.g},${c.b},1)) drop-shadow(0 0 14px rgba(${c.r},${c.g},${c.b},0.8))`}
            style={{ animation: `arsenalBorder 2.5s linear infinite` }} />
          <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="19" ry="19"
            fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={0.9}
            strokeDasharray="28 1372" strokeLinecap="round"
            style={{ animation: `arsenalBorder 2.5s linear infinite` }} />
        </svg>
      </div>
    </div>
  );
}

// ─── ARSENAL CARD ─────────────────────────────────────────────────────────────
function ArsenalCard({ item, delay=0, onClick }) {
  const [hov,setHov]=useState(false);
  const c=hexToRgb(item.color);
  const lv=LEVEL_CONFIG[item.level]||LEVEL_CONFIG.AVANZADO;
  return (
    <div onClick={()=>onClick&&onClick(item)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{position:'relative',borderRadius:'20px',overflow:'hidden',cursor:'pointer',background:`linear-gradient(155deg,rgba(${c.r},${c.g},${c.b},0.14) 0%,rgba(8,3,26,0.97) 55%,rgba(2,0,12,0.99) 100%)`,border:`1px solid rgba(${c.r},${c.g},${c.b},${hov?.65:.2})`,boxShadow:`0 4px 24px rgba(0,0,0,0.6)`,transform:hov?'translateY(-8px) scale(1.02)':'translateZ(0)',transition:'transform .38s cubic-bezier(0.34,1.1,0.64,1),border-color .38s ease',animation:`cardEntrance .5s cubic-bezier(0.34,1.1,0.64,1) ${delay}s both`,willChange:'transform'}}>
      <div style={{height:'160px',position:'relative',overflow:'hidden',background:`linear-gradient(145deg,rgba(${c.r},${c.g},${c.b},0.38) 0%,rgba(${c.r},${c.g},${c.b},0.12) 45%,rgba(0,0,0,0.7) 100%)`}}>
        <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at 25% 30%,rgba(${c.r},${c.g},${c.b},0.42) 0%,transparent 60%)`}}/>
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:.07}}>{[...Array(6)].map((_,i)=><line key={`h${i}`} x1="0" y1={`${(i+1)*14}%`} x2="100%" y2={`${(i+1)*14}%`} stroke={item.color} strokeWidth="1"/>)}{[...Array(7)].map((_,i)=><line key={`v${i}`} x1={`${(i+1)*13}%`} y1="0" x2={`${(i+1)*13}%`} y2="100%" stroke={item.color} strokeWidth="1"/>)}<circle cx="50%" cy="50%" r="46" fill="none" stroke={item.color} strokeWidth="1.5"/><circle cx="50%" cy="50%" r="28" fill="none" stroke={item.color} strokeWidth=".8"/></svg>
        {hov&&[1.5,2.2,3.0].map((sc,i)=><div key={i} style={{position:'absolute',left:'50%',top:'50%',marginLeft:'-27px',marginTop:'-27px',width:'54px',height:'54px',borderRadius:'50%',border:`1px solid rgba(${c.r},${c.g},${c.b},${.45-i*.12})`,transform:`scale(${sc})`,animation:`cardPulseRing ${1.6+i*.55}s ease-out infinite`}}/>)}
        {item.image
  ? <img src={item.image} alt={item.title} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:.85,zIndex:1}}/>
  : <div style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',fontSize:'48px',lineHeight:1,zIndex:2,filter:`drop-shadow(0 0 ${hov?40:16}px ${item.color})`,transition:'filter .35s ease',animation:'cardIconFloat 3.5s ease-in-out infinite'}}>{item.icon}</div>
}
        <div style={{position:'absolute',top:'10px',left:'10px',padding:'2px 8px',borderRadius:'8px',background:'rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.1)',fontFamily:"'Cinzel',serif",fontSize:'6.5px',letterSpacing:'1.2px',color:'rgba(212,175,55,0.85)'}}>{CONTENT_TYPES.find(t=>t.id===item.type)?.icon} {CONTENT_TYPES.find(t=>t.id===item.type)?.label||item.type}</div>
        {item.level&&<div style={{position:'absolute',top:'10px',right:'10px',padding:'2px 8px',borderRadius:'8px',background:'rgba(0,0,0,0.65)',border:`1px solid ${lv.color}`,fontFamily:"'Cinzel',serif",fontSize:'6.5px',letterSpacing:'1px',color:lv.color,boxShadow:`0 0 10px ${lv.glow}`}}>{item.level}</div>}
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:'60px',background:`linear-gradient(to top,rgba(8,3,26,1),transparent)`}}/>
      </div>
      <div style={{padding:'14px 18px 18px'}}>
        <div style={{fontFamily:"'Raleway',sans-serif",fontSize:'9px',letterSpacing:'2px',color:`rgba(${c.r},${c.g},${c.b},0.75)`,textTransform:'uppercase',marginBottom:'4px'}}>{item.subtitle}</div>
        <h3 style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(12px,2vw,15px)',fontWeight:'700',color:'#fff',lineHeight:1.25,marginBottom:'12px',textShadow:hov?`0 0 18px rgba(${c.r},${c.g},${c.b},0.7)`:'none',transition:'text-shadow .3s ease'}}>{item.title}</h3>
        <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginBottom:'10px'}}>{(item.impact||[]).slice(0,2).map((imp,i)=><div key={i} style={{padding:'2px 8px',borderRadius:'8px',background:`rgba(${c.r},${c.g},${c.b},0.1)`,border:`1px solid rgba(${c.r},${c.g},${c.b},0.28)`,fontFamily:"'Raleway',sans-serif",fontSize:'8.5px',color:`rgba(${c.r},${c.g},${c.b},0.95)`}}>{imp}</div>)}</div>
        <div style={{display:'flex',gap:'14px'}}>{item.duration&&<div style={{display:'flex',alignItems:'center',gap:'4px'}}><span style={{color:'rgba(212,175,55,0.5)',fontSize:'9px'}}>⏱</span><span style={{fontFamily:"'Raleway',sans-serif",fontSize:'9.5px',color:'rgba(200,185,240,0.5)'}}>{item.duration}</span></div>}{item.sessions&&<div style={{display:'flex',alignItems:'center',gap:'4px'}}><span style={{color:'rgba(212,175,55,0.5)',fontSize:'9px'}}>↻</span><span style={{fontFamily:"'Raleway',sans-serif",fontSize:'9.5px',color:'rgba(200,185,240,0.5)'}}>{item.sessions}</span></div>}</div>
      </div>
    </div>
  );
}

// ─── ACHIEVEMENT CARD ──────────────────────────────────────────────────────────
function AchievementCard({ ach, onClick }) {
  const [hov,setHov]=useState(false);
  const lv=LEVEL_CONFIG[ach.rarity]||LEVEL_CONFIG.AVANZADO;
  return (
    <div onClick={()=>onClick(ach)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{position:'relative',borderRadius:'14px',overflow:'hidden',background:ach.unlocked?'linear-gradient(135deg,rgba(212,175,55,0.11) 0%,rgba(8,3,26,0.95) 100%)':'rgba(8,3,26,0.65)',border:`1px solid ${hov?(ach.unlocked?'rgba(212,175,55,0.65)':'rgba(124,58,237,0.5)'):(ach.unlocked?'rgba(212,175,55,0.25)':'rgba(255,255,255,0.06)')}`,padding:'14px 16px',display:'flex',alignItems:'center',gap:'14px',cursor:'pointer',transform:hov?'translateX(6px)':'none',transition:'all .3s ease',boxShadow:hov?'0 8px 32px rgba(124,58,237,0.28)':'none'}}>
      <div style={{width:'50px',height:'50px',borderRadius:'12px',flexShrink:0,background:ach.unlocked?'linear-gradient(135deg,rgba(212,175,55,0.28),rgba(124,58,237,0.18))':'rgba(255,255,255,0.04)',border:`1px solid ${ach.unlocked?'rgba(212,175,55,0.4)':'rgba(255,255,255,0.06)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',boxShadow:ach.unlocked?'0 0 20px rgba(212,175,55,0.28)':'none',filter:ach.unlocked?'none':'blur(2px) grayscale(1)',transition:'all .35s ease'}}>{ach.unlocked?ach.icon:'🔒'}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'4px'}}>
          <span style={{fontFamily:"'Cinzel',serif",fontSize:'12px',fontWeight:'700',color:ach.unlocked?'#fff':'rgba(200,185,240,0.3)'}}>{ach.unlocked?ach.name:'???'}</span>
          <span style={{padding:'1px 6px',borderRadius:'6px',background:'rgba(0,0,0,0.5)',border:`1px solid ${lv.color}`,fontFamily:"'Cinzel',serif",fontSize:'5.5px',letterSpacing:'1px',color:lv.color}}>{ach.rarity}</span>
        </div>
        <div style={{fontFamily:"'Raleway',sans-serif",fontSize:'10px',color:'rgba(200,185,240,0.38)',lineHeight:1.4}}>{ach.unlocked?ach.description:'Logro oculto · Sigue tu camino para descubrirlo'}</div>
      </div>
      <div style={{color:'rgba(212,175,55,0.4)',fontSize:'16px',flexShrink:0,transition:'transform .3s',transform:hov?'translateX(5px)':'none'}}>›</div>
    </div>
  );
}

// ─── ACHIEVEMENT MODAL ────────────────────────────────────────────────────────
function AchievementModal({ ach, onClose }) {
  const lv=LEVEL_CONFIG[ach.rarity]||LEVEL_CONFIG.AVANZADO;
  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(2,0,12,0.9)',backdropFilter:'blur(18px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'clamp(8px,2vw,20px)',animation:'fadeIn .3s ease'}} onClick={onClose}>
      <div style={{maxWidth:'440px',width:'100%',background:'linear-gradient(155deg,rgba(124,58,237,0.15) 0%,rgba(8,3,26,0.98) 50%,rgba(2,0,12,1) 100%)',border:'1px solid rgba(212,175,55,0.28)',borderRadius:'24px',padding:'clamp(20px,4vw,36px)',boxShadow:'0 40px 120px rgba(124,58,237,0.35)',animation:'slideUp .35s cubic-bezier(0.34,1.1,0.64,1)',position:'relative',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
        <div style={{position:'absolute',top:'-60px',left:'50%',transform:'translateX(-50%)',width:'180px',height:'180px',borderRadius:'50%',background:'rgba(124,58,237,0.1)',filter:'blur(40px)',pointerEvents:'none'}}/>
        <button onClick={onClose} style={{position:'absolute',top:'14px',right:'14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'50%',width:'30px',height:'30px',color:'rgba(200,185,240,0.6)',cursor:'pointer',fontSize:'13px',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        <div style={{textAlign:'center',marginBottom:'22px'}}>
          <div style={{fontSize:'52px',lineHeight:1,filter:ach.unlocked?'drop-shadow(0 0 28px rgba(212,175,55,0.6))':'blur(6px) grayscale(1)',marginBottom:'10px'}}>{ach.unlocked?ach.icon:'🔒'}</div>
          <div style={{display:'inline-block',padding:'2px 12px',borderRadius:'20px',background:'rgba(0,0,0,0.5)',border:`1px solid ${lv.color}`,fontFamily:"'Cinzel',serif",fontSize:'6.5px',letterSpacing:'2px',color:lv.color,marginBottom:'10px'}}>{ach.rarity}</div>
          <h3 style={{fontFamily:"'Cinzel',serif",fontSize:'19px',fontWeight:'700',color:ach.unlocked?'#fff':'rgba(200,185,240,0.3)',letterSpacing:'.05em'}}>{ach.unlocked?ach.name:'???'}</h3>
        </div>
        {[['DESCRIPCIÓN',ach.unlocked?ach.description:'Permanece en las sombras. Solo quienes persisten lo descubrirán.'],['CÓMO DESBLOQUEAR',ach.unlocked?ach.requirement:'??? · El camino se revela a quienes actúan.']].map(([lbl,txt],i)=>(
          <div key={i} style={{padding:'13px 16px',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',marginBottom:i===0?'8px':0}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:'7px',letterSpacing:'2px',color:'rgba(212,175,55,0.45)',marginBottom:'5px'}}>{lbl}</div>
            <div style={{fontFamily:"'Raleway',sans-serif",fontSize:'12px',color:'rgba(200,185,240,0.65)',lineHeight:1.6}}>{txt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ rewards, achievements, onUpdateRewards, onUpdateAchievements, onClose }) {
  const [tab,setTab]=useState('rewards');
  const [eR,setER]=useState(()=>JSON.parse(JSON.stringify(rewards)));
  const [eA,setEA]=useState(()=>JSON.parse(JSON.stringify(achievements)));
  const [vipR,setVipR]=useState([]);
  const [vipLoading,setVipLoading]=useState(true);

  useEffect(()=>{
    supabase.from('vip_level_rewards').select('*').order('level')
      .then(({data})=>{ if(data) setVipR(data); setVipLoading(false); });
  },[]);

  const saveVip = async () => {
    for (const r of vipR) {
      await supabase.from('vip_level_rewards').update({
        icon:             r.icon,
        name:             r.name,
        xp_required:      r.xp_required,
        bonus_propocoins: r.bonus_propocoins,
        bonus_exp:        r.bonus_exp,
        reward_type:      r.reward_type,
        reward_url:       r.reward_url || null,
        description:      r.description || null,
      }).eq('id', r.id);
    }
    alert('✅ Niveles VIP guardados');
  };

  const save = async () => {
    for (const r of eR) {
      await supabase.from('level_rewards').update({
    title:        r.name,
        description:  r.description,
        icon_emoji:   r.icon,
        reward_type:  r.type,
        reward_value: r.url || null,
      }).eq('id', r.id);
    }
    onUpdateRewards(eR);
    onClose();
  };
  const inp={display:'block',width:'100%',marginTop:'5px',padding:'8px 11px',borderRadius:'7px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(200,185,240,0.9)',fontFamily:"'Raleway',sans-serif",fontSize:'12px',outline:'none',boxSizing:'border-box'};
  return (
    <div style={{position:'fixed',inset:0,zIndex:9998,background:'rgba(2,0,12,0.97)',backdropFilter:'blur(20px)',overflow:'auto',animation:'fadeIn .3s ease'}}>
      <div style={{maxWidth:'660px',margin:'0 auto',padding:'clamp(20px,4vw,40px) clamp(12px,3vw,20px)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'28px'}}>
          <div><div style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'4px',color:'rgba(212,175,55,0.45)',marginBottom:'4px'}}>PANEL SAGRADO · SOLO ADMINISTRADOR</div><h2 style={{fontFamily:"'Cinzel',serif",fontSize:'20px',fontWeight:'900',color:'#d4af37'}}>⚙ Editor del Templo</h2></div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'7px 14px',color:'rgba(200,185,240,0.6)',fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'1px',cursor:'pointer'}}>✕ CERRAR</button>
        </div>
        <div style={{display:'flex',gap:'8px',marginBottom:'24px'}}>{[{id:'rewards',label:'RECOMPENSAS'},{id:'vip',label:'👑 VIP'},{id:'achievements',label:'LOGROS'}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'7px 18px',borderRadius:'100px',background:tab===t.id?'rgba(212,175,55,0.18)':'rgba(255,255,255,0.03)',border:`1px solid ${tab===t.id?'rgba(212,175,55,0.65)':'rgba(255,255,255,0.09)'}`,color:tab===t.id?'#d4af37':'rgba(200,185,240,0.45)',fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'2px',cursor:'pointer'}}>{t.label}</button>)}</div>
        {tab==='rewards'&&eR.map((r,i)=>(
          <div key={r.id} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',padding:'16px',marginBottom:'8px'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'8px',marginBottom:'8px'}}>
              <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)'}}>NIVEL<input type="number" value={r.level} onChange={e=>{const n=[...eR];n[i].level=+e.target.value;setER(n);}} style={inp}/></label>
              <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)'}}>ÍCONO<input type="text" value={r.icon} onChange={e=>{const n=[...eR];n[i].icon=e.target.value;setER(n);}} style={inp}/></label>
            </div>
            <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)',display:'block',marginBottom:'7px'}}>NOMBRE<input type="text" value={r.name} onChange={e=>{const n=[...eR];n[i].name=e.target.value;setER(n);}} style={inp}/></label>
            <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)',display:'block',marginBottom:'7px'}}>DESCRIPCIÓN<textarea value={r.description||''} onChange={e=>{const n=[...eR];n[i].description=e.target.value;setER(n);}} style={{...inp,height:'52px',resize:'vertical'}}/></label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)'}}>TIPO<select value={r.type||'link'} onChange={e=>{const n=[...eR];n[i].type=e.target.value;setER(n);}} style={inp}>{['link','module','download','file'].map(t=><option key={t} value={t}>{t}</option>)}</select></label>
              <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)'}}>ÍCONO<input type="text" value={r.icon||''} onChange={e=>{const n=[...eR];n[i].icon=e.target.value;setER(n);}} style={inp}/></label>
            </div>
            <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)',display:'block',marginTop:'7px'}}>URL / RUTA<input type="text" value={r.url||''} onChange={e=>{const n=[...eR];n[i].url=e.target.value;setER(n);}} style={inp} placeholder="https://... o /ruta"/></label>
          </div>
        ))}
        {tab==='vip'&&(
          vipLoading
            ? <div style={{color:'rgba(212,175,55,0.5)',fontFamily:"'Cinzel',serif",fontSize:'11px',padding:'12px'}}>Cargando niveles VIP...</div>
            : vipR.map((r,i)=>(
              <div key={r.id} style={{background:'rgba(212,175,55,0.03)',border:'1px solid rgba(212,175,55,0.15)',borderRadius:'12px',padding:'16px',marginBottom:'8px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                  <div style={{background:'rgba(212,175,55,0.1)',border:'1px solid rgba(212,175,55,0.3)',borderRadius:'8px',padding:'4px 10px',fontFamily:"'Cinzel',serif",fontSize:'8px',color:'#d4af37'}}>NIVEL {r.level}</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:'8px',marginBottom:'8px'}}>
                  <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)'}}>ÍCONO
                    <input type="text" value={r.icon} onChange={e=>{const n=[...vipR];n[i].icon=e.target.value;setVipR(n);}} style={inp}/>
                  </label>
                  <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)'}}>XP REQUERIDO
                    <input type="number" value={r.xp_required} onChange={e=>{const n=[...vipR];n[i].xp_required=+e.target.value;setVipR(n);}} style={inp}/>
                  </label>
                </div>
                <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)',display:'block',marginBottom:'7px'}}>NOMBRE
                  <input type="text" value={r.name} onChange={e=>{const n=[...vipR];n[i].name=e.target.value;setVipR(n);}} style={inp}/>
                </label>
                <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)',display:'block',marginBottom:'7px'}}>DESCRIPCIÓN
                  <input type="text" value={r.description||''} onChange={e=>{const n=[...vipR];n[i].description=e.target.value;setVipR(n);}} style={inp}/>
                </label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                  <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)'}}>PROPOCOINS
                    <input type="number" value={r.bonus_propocoins} onChange={e=>{const n=[...vipR];n[i].bonus_propocoins=+e.target.value;setVipR(n);}} style={inp}/>
                  </label>
                  <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)'}}>XP BONUS
                    <input type="number" value={r.bonus_exp} onChange={e=>{const n=[...vipR];n[i].bonus_exp=+e.target.value;setVipR(n);}} style={inp}/>
                  </label>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                  <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)'}}>TIPO
                    <select value={r.reward_type} onChange={e=>{const n=[...vipR];n[i].reward_type=e.target.value;setVipR(n);}} style={inp}>
                      <option value="coins">🪙 Solo Coins+XP</option>
                      <option value="module">📦 Módulo/Contenido</option>
                      <option value="link">🔗 Enlace externo</option>
                    </select>
                  </label>
                  {(r.reward_type==='module'||r.reward_type==='link')&&(
                    <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)'}}>URL
                      <input type="text" value={r.reward_url||''} onChange={e=>{const n=[...vipR];n[i].reward_url=e.target.value;setVipR(n);}} style={inp} placeholder="https://..."/>
                    </label>
                  )}
                </div>
              </div>
            ))
        )}
        {tab==='achievements'&&eA.map((a,i)=>(
          <div key={a.id} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',padding:'16px',marginBottom:'8px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
              <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)'}}>ÍCONO<input type="text" value={a.icon} onChange={e=>{const n=[...eA];n[i].icon=e.target.value;setEA(n);}} style={inp}/></label>
              <label style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)'}}>RAREZA<select value={a.rarity} onChange={e=>{const n=[...eA];n[i].rarity=e.target.value;setEA(n);}} style={inp}>{['LEGENDARIO','MAESTRO','ÉLITE','AVANZADO'].map(r=><option key={r} value={r}>{r}</option>)}</select></label>
            </div>
            {[['NOMBRE','name'],['DESCRIPCIÓN','description'],['REQUISITOS','requirement']].map(([lbl,key])=>(
              <label key={key} style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)',display:'block',marginBottom:'7px'}}>{lbl}<textarea value={a[key]} onChange={e=>{const n=[...eA];n[i][key]=e.target.value;setEA(n);}} style={{...inp,height:'50px',resize:'vertical'}}/></label>
            ))}
            <label style={{display:'flex',alignItems:'center',gap:'8px',fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'1.5px',color:'rgba(212,175,55,0.55)',cursor:'pointer'}}><input type="checkbox" checked={a.unlocked} onChange={e=>{const n=[...eA];n[i].unlocked=e.target.checked;setEA(n);}} style={{accentColor:'#d4af37'}}/> DESBLOQUEADO</label>
          </div>
        ))}
        {tab==='vip'
          ? <button onClick={saveVip} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,rgba(212,175,55,0.28),rgba(139,92,246,0.18))',border:'1px solid rgba(212,175,55,0.55)',borderRadius:'11px',color:'#d4af37',fontFamily:"'Cinzel',serif",fontSize:'9.5px',letterSpacing:'3px',cursor:'pointer',marginTop:'16px',boxShadow:'0 0 28px rgba(212,175,55,0.18)'}}>👑 GUARDAR NIVELES VIP</button>
          : <button onClick={save} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,rgba(212,175,55,0.28),rgba(124,58,237,0.18))',border:'1px solid rgba(212,175,55,0.55)',borderRadius:'11px',color:'#d4af37',fontFamily:"'Cinzel',serif",fontSize:'9.5px',letterSpacing:'3px',cursor:'pointer',marginTop:'16px',boxShadow:'0 0 28px rgba(212,175,55,0.18)'}}>✦ GUARDAR CAMBIOS</button>
        }
      </div>
    </div>
  );
}

// ─── REWARD ORB PARTICLES ─────────────────────────────────────────────────────
const REWARD_PARTICLES = Array.from({length:10},(_,i)=>({
  id:i,
  px: `${(((i*37+13)%100)/100-.5)*80}px`,
  py: `${(((i*61+7)%100)/100-.5)*80}px`,
  col: i%2===0?'#d4af37':'#a855f7',
  sz: 2+(i%3)*1.5,
  dur: 600+(i%4)*100,
  delay: (i%5)*80,
  x: (i*17+11)%100,
  y: (i*23+7)%100,
}));

function RewardParticles({ active }) {
  if (!active) return null;
  const pts = REWARD_PARTICLES;
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',borderRadius:'50%',overflow:'visible'}}>
      {pts.map(p=>(
        <div key={p.id} style={{
          position:'absolute',
          left:`${p.x}%`,top:`${p.y}%`,
          width:`${p.sz}px`,height:`${p.sz}px`,
          borderRadius:'50%',
          background:p.col,
          boxShadow:`0 0 6px ${p.col}`,
          '--px':p.px,'--py':p.py,
          animation:`rewardParticle ${p.dur}ms ease-out ${p.delay}ms infinite`,
          transformOrigin:'center',
        }}/>
      ))}
    </div>
  );
}


// ─── GOLDEN CIRCLE BAR (Battle Pass) ─────────────────────────────────────────
function GoldenCircleBar({ userXP = 0, userLevel = 1, isVip = false, onBuyVip }) {
  const [hovVip,     setHovVip]     = useState(null);
  const [hovFree,    setHovFree]    = useState(null);
  const [clickedVip, setClickedVip] = useState(null);

  const VIP_LEVELS = [
  { n:1,  icon:'⭐', name:'DESPERTAR',        reward:'+40 PropoCoins · Distintivo dorado',              color:'#60a5fa', glow:'rgba(96,165,250,0.9)'   },
  { n:2,  icon:'🔵', name:'RECLUTA',          reward:'+20 XP · +20 Coins · Nombre brillante',           color:'#a78bfa', glow:'rgba(167,139,250,0.9)'  },
  { n:3,  icon:'🔥', name:'FORJADOR',         reward:'+40 XP · +40 Coins · Marco especial',             color:'#fb923c', glow:'rgba(251,146,60,0.9)'   },
  { n:4,  icon:'🛡️', name:'GUARDIÁN',         reward:'+60 XP · +60 Coins · Aura dorada',               color:'#34d399', glow:'rgba(52,211,153,0.9)'   },
  { n:5,  icon:'⚔️', name:'CONQUISTADOR',     reward:'+80 XP · +80 Coins · Nombre animado',            color:'#d4af37', glow:'rgba(212,175,55,0.9)'   },
  { n:6,  icon:'🏛️', name:'TEMPLARIÓN',       reward:'+100 XP · +100 Coins · Acceso Beta Store',       color:'#f59e0b', glow:'rgba(245,158,11,0.9)'   },
  { n:7,  icon:'👁️', name:'VIGÍA',            reward:'+120 XP · Herramienta nueva desbloqueada',       color:'#38bdf8', glow:'rgba(56,189,248,0.9)'   },
  { n:8,  icon:'⚡', name:'CENTINELA',        reward:'+150 XP · +500 PropoCoins',                      color:'#818cf8', glow:'rgba(129,140,248,0.9)'  },
  { n:9,  icon:'📯', name:'HERALDO',          reward:'+200 XP · Sheets a App tool desbloqueado',       color:'#e879f9', glow:'rgba(232,121,249,0.9)'  },
  { n:10, icon:'👑', name:'DOMINANTE',        reward:'+300 XP · +1,000 Coins · Hito mayor',            color:'#f5d06e', glow:'rgba(245,208,110,1)'    },
  { n:11, icon:'🔮', name:'ARCANO',           reward:'+350 XP · Herramienta élite',                    color:'#c084fc', glow:'rgba(192,132,252,0.9)'  },
  { n:12, icon:'🏟️', name:'SEÑOR DE ARENA',  reward:'+400 XP · +1,000 PropoCoins',                    color:'#fb7185', glow:'rgba(251,113,133,0.9)'  },
  { n:13, icon:'💠', name:'ÉLITE',            reward:'+450 XP · Contenido exclusivo élite',            color:'#67e8f9', glow:'rgba(103,232,249,0.9)'  },
  { n:14, icon:'🎯', name:'MAESTRO',          reward:'+500 XP · +1,500 PropoCoins',                    color:'#4ade80', glow:'rgba(74,222,128,0.9)'   },
  { n:15, icon:'🌟', name:'GRAN MAESTRO',     reward:'+600 XP · Acceso anticipado',                    color:'#fde68a', glow:'rgba(253,230,138,0.9)'  },
  { n:16, icon:'🔱', name:'FORJADO EN FUEGO', reward:'+700 XP · +2,000 PropoCoins',                    color:'#ff6b35', glow:'rgba(255,107,53,0.9)'   },
  { n:17, icon:'♾️', name:'ETERNO',           reward:'+800 XP · Acceso vitalicio beta',                color:'#a5f3fc', glow:'rgba(165,243,252,0.9)'  },
  { n:18, icon:'🌠', name:'ASCENDIDO',        reward:'+900 XP · +3,000 PropoCoins',                    color:'#ddd6fe', glow:'rgba(221,214,254,0.9)'  },
  { n:19, icon:'🐉', name:'MÍTICO',           reward:'+1,000 XP · Pack legendario',                    color:'#fca5a5', glow:'rgba(252,165,165,0.9)'  },
  { n:20, icon:'🏆', name:'PROPO-LEYENDA',    reward:'+180 XP · +5,000 Coins · Herramienta Premium',  color:'#fbbf24', glow:'rgba(251,191,36,1)'     },
];

const FREE_LEVELS = [
  { n:1,  icon:'🪙', reward:'+5 PropoCoins'           },
  { n:2,  icon:'🎁', reward:'Caja sorpresa'            },
  { n:3,  icon:'🪙', reward:'+15 PropoCoins'          },
  { n:4,  icon:'⚔️', reward:'Emblema Templo'          },
  { n:5,  icon:'🪙', reward:'+25 PropoCoins'          },
  { n:6,  icon:'📜', reward:'Prompts básicos'         },
  { n:7,  icon:'🪙', reward:'+40 PropoCoins'          },
  { n:8,  icon:'🎁', reward:'Caja especial'           },
  { n:9,  icon:'🪙', reward:'+60 PropoCoins'          },
  { n:10, icon:'👑', reward:'Corona del Dominante'    },
  { n:11, icon:'🪙', reward:'+80 PropoCoins'          },
  { n:12, icon:'🎁', reward:'Caja arcana'             },
  { n:13, icon:'🪙', reward:'+100 PropoCoins'         },
  { n:14, icon:'⚔️', reward:'Emblema Maestro'        },
  { n:15, icon:'🪙', reward:'+150 PropoCoins'         },
  { n:16, icon:'🎁', reward:'Caja legendaria'         },
  { n:17, icon:'🪙', reward:'+200 PropoCoins'         },
  { n:18, icon:'🎁', reward:'Caja ascendida'          },
  { n:19, icon:'🪙', reward:'+300 PropoCoins'         },
  { n:20, icon:'🏆', reward:'Corona Leyenda'          },
];

  const currentVipLevel = Math.min(Math.max(userLevel || 1, 1), 20);
const { percent: progressPct } = getXPProgress(userXP, currentVipLevel);

  /* cerrar tooltip al hacer click fuera */
  useEffect(() => {
  if (!clickedVip) return;
  const close = (e) => {
    if (!e.target.closest('[data-vip-tooltip]')) setClickedVip(null);
  };
  const onScroll = () => setClickedVip(null);
  setTimeout(() => document.addEventListener('click', close), 50);
  window.addEventListener('scroll', onScroll, true);
  return () => {
    document.removeEventListener('click', close);
    window.removeEventListener('scroll', onScroll, true);
  };
}, [clickedVip]);

  return (
    <div style={{
      marginTop: '16px',
      borderRadius: '16px',
      background: 'linear-gradient(160deg, rgba(8,3,26,0.99) 0%, rgba(22,8,55,0.99) 100%)',
      border: '1px solid rgba(212,175,55,0.45)',
      boxShadow: '0 0 0 1px rgba(212,175,55,0.06), 0 8px 40px rgba(212,175,55,0.1), inset 0 1px 0 rgba(255,230,120,0.1)',
      overflow: 'visible',
      position: 'relative',
    }}>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px 10px',
        background: 'linear-gradient(90deg,rgba(212,175,55,0.13) 0%,rgba(139,92,246,0.07) 50%,rgba(212,175,55,0.13) 100%)',
        borderBottom: '1px solid rgba(212,175,55,0.18)',
        borderRadius: '16px 16px 0 0',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ fontSize:'22px', filter:'drop-shadow(0 0 12px rgba(212,175,55,0.9))', animation:'vipCrownFloat 2.2s ease-in-out infinite' }}>👑</div>
          <div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:'6px', letterSpacing:'4px', color:'rgba(212,175,55,0.45)', marginBottom:'1px' }}>PASE DE BATALLA</div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(11px,2vw,14px)', fontWeight:900, background:'linear-gradient(135deg,#ffe87a 0%,#d4af37 40%,#fde68a 70%,#c9a84c 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', letterSpacing:'1px' }}>PROPO-PASS</div>
          </div>
        </div>

        {!isVip ? (
          <button
            onClick={onBuyVip}
            onMouseEnter={e => { e.currentTarget.style.transform='scale(1.07)'; e.currentTarget.style.boxShadow='0 0 44px rgba(212,175,55,1),0 0 90px rgba(139,92,246,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='scale(1)';    e.currentTarget.style.boxShadow='0 0 22px rgba(212,175,55,0.5),0 0 50px rgba(139,92,246,0.3)'; }}
            style={{
              position:'relative', padding:'8px 16px',
              background:'linear-gradient(135deg,#4c1d95,#7c3aed 45%,#d4af37 80%,#ffe87a)',
              border:'none', borderRadius:'100px',
              color:'#0c0a2a', fontFamily:"'Cinzel',serif", fontWeight:900,
              fontSize:'clamp(7px,1.5vw,9px)', letterSpacing:'1.5px',
              cursor:'pointer', overflow:'hidden',
              animation:'vipBuyPulse 2s ease-in-out infinite',
              whiteSpace:'nowrap',
              boxShadow:'0 0 22px rgba(212,175,55,0.5),0 0 50px rgba(139,92,246,0.3)',
              transition:'transform 0.2s ease, box-shadow 0.2s ease',
            }}>
            <div style={{ position:'absolute', inset:0, borderRadius:'100px', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)', backgroundSize:'200% 100%', animation:'vipBuyShimmer 1.8s ease-in-out infinite' }}/>
            <span style={{ position:'relative', zIndex:1 }}>👑 $9.99/MES</span>
          </button>
        ) : (
          <div style={{ padding:'5px 14px', background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.5)', borderRadius:'100px', fontFamily:"'Cinzel',serif", fontSize:'8px', color:'#d4af37', letterSpacing:'2px', boxShadow:'0 0 12px rgba(212,175,55,0.3)' }}>
            ✦ VIP ACTIVO
          </div>
        )}
      </div>

      {/* ── BODY ── */}
      <div style={{ padding:'10px 12px 12px' }}>

        {/* Barra de progreso XP */}
        <div style={{ position:'relative', height:'5px', borderRadius:'6px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(212,175,55,0.1)', overflow:'hidden', marginBottom:'10px' }}>
          <div style={{ position:'absolute', top:0, left:0, height:'100%', width:`${progressPct}%`, background:'linear-gradient(90deg,#4c1d95,#7c3aed 50%,#d4af37)', borderRadius:'6px', boxShadow:'0 0 10px rgba(212,175,55,0.7)', transition:'width 1s ease' }}/>
        </div>

        {/* ── FILA VIP ── */}
        <div style={{
          display:'flex', alignItems:'center', gap:'6px',
          marginBottom:'5px',
          background: isVip ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.02)',
          borderRadius:'10px', padding:'6px 8px',
          border:`1px solid ${isVip ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.07)'}`,
        }}>
          {/* Etiqueta */}
          <div style={{ width:'28px', flexShrink:0, textAlign:'center', fontFamily:"'Cinzel',serif", fontSize:'5.5px', fontWeight:900, color: isVip ? 'rgba(212,175,55,0.7)' : 'rgba(212,175,55,0.3)', lineHeight:1.5 }}>
            {isVip ? '⚔️' : '🔒'}<br/>VIP
          </div>

          {/* Nodos */}
          <div style={{ flex:1, position:'relative', minHeight:'56px', display:'flex', alignItems:'center' }}>
            {/* Línea conectora — contenida dentro de su padre relativo */}
            <div style={{ position:'absolute', top:'50%', left:0, right:0, height:'2px', transform:'translateY(-50%)', borderRadius:'2px', zIndex:0, background: isVip ? 'linear-gradient(90deg,#4c1d95,#7c3aed,#d4af37)' : 'rgba(212,175,55,0.08)' }}/>

            <div style={{ position:'relative', zIndex:1, width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              {VIP_LEVELS.map(lvl => {
                const unlocked = isVip && userXP >= lvl.xp;
                const isCurr   = isVip && currentVipLevel === lvl.n;
                const isHov    = hovVip === lvl.n;
                const isClicked = clickedVip === lvl.n;
                const sz = lvl.n === 6 ? '42px' : '36px';
                return (
                  <div
                    key={lvl.n}
                    onClick={e => { e.stopPropagation(); if (!isVip) setClickedVip(isClicked ? null : lvl.n); }}
                    onMouseEnter={() => setHovVip(lvl.n)}
                    onMouseLeave={() => setHovVip(null)}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', cursor: !isVip ? 'pointer' : 'default', position:'relative' }}
                  >
                    <div style={{
                      width:sz, height:sz,
                      borderRadius: lvl.n === 6 ? '11px' : '8px',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize: lvl.n === 6 ? '17px' : '14px',
                      transition:'all 0.2s ease',
                      transform: isHov && !isVip ? 'scale(1.15)' : 'scale(1)',
                      background: unlocked
                        ? 'linear-gradient(135deg,rgba(212,175,55,0.32),rgba(139,92,246,0.22))'
                        : isHov && !isVip ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                      border:`1.5px solid ${isCurr ? 'rgba(212,175,55,0.95)' : unlocked ? 'rgba(212,175,55,0.55)' : isHov && !isVip ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: unlocked || isCurr ? '0 0 16px rgba(212,175,55,0.5)' : isHov && !isVip ? '0 0 14px rgba(212,175,55,0.3)' : 'none',
                      filter: (unlocked || isHov || isClicked) ? 'none' : 'grayscale(1) brightness(0.28)',
                      opacity: unlocked ? 1 : (isHov || isClicked) && !isVip ? 0.8 : 0.35,
                      animation: isCurr ? 'vipGoldPulse 1.8s ease-in-out infinite' : 'none',
                    }}>
                      {!isVip ? (isHov || isClicked ? '💰' : '👑') : (unlocked ? lvl.icon : '🔒')}
                    </div>
                    <div style={{ fontFamily:"'Cinzel',serif", fontSize:'5.5px', fontWeight:900, letterSpacing:'0.5px', transition:'color 0.2s', color: unlocked ? 'rgba(212,175,55,0.85)' : (isHov || isClicked) && !isVip ? 'rgba(212,175,55,0.55)' : 'rgba(212,175,55,0.22)' }}>
                      Nv.{lvl.n}
                    </div>

                
                    {!isVip && isClicked && (
                      <div onClick={e => e.stopPropagation()} style={{
                        position:'absolute', bottom:'calc(100% + 10px)', left:'50%', transform:'translateX(-50%)',
                        width:'128px', zIndex:200,
                        background:'linear-gradient(135deg,rgba(8,3,26,0.98),rgba(28,10,65,0.98))',
                        border:'1px solid rgba(212,175,55,0.55)',
                        borderRadius:'12px', padding:'10px 10px 9px',
                        boxShadow:'0 10px 40px rgba(212,175,55,0.25),0 0 0 1px rgba(212,175,55,0.08)',
                        animation:'rewardTooltipIn 0.15s cubic-bezier(0.34,1.1,0.64,1)',
                        textAlign:'center',
                        willChange:'transform,opacity',
                      }}>
                        <div style={{ fontSize:'20px', marginBottom:'5px' }}>{lvl.icon}</div>
                        <div style={{ fontFamily:"'Cinzel',serif", fontSize:'7.5px', fontWeight:900, color:'#d4af37', letterSpacing:'0.5px', marginBottom:'4px' }}>{lvl.name}</div>
                        <div style={{ fontFamily:"'Raleway',sans-serif", fontSize:'7px', color:'rgba(200,185,240,0.65)', lineHeight:1.5, marginBottom:'8px' }}>{lvl.reward}</div>
                        <button
                          onClick={e => { e.stopPropagation(); onBuyVip(); }}
                          style={{ width:'100%', padding:'6px 0', background:'linear-gradient(135deg,#4c1d95,#7c3aed 50%,#d4af37)', border:'none', borderRadius:'100px', color:'#fff', fontFamily:"'Cinzel',serif", fontSize:'6.5px', fontWeight:900, letterSpacing:'1.5px', cursor:'pointer', boxShadow:'0 0 14px rgba(212,175,55,0.5)' }}>
                          👑 DESBLOQUEAR
                        </button>
                        {/* Flecha */}
                        <div style={{ position:'absolute', bottom:'-5px', left:'50%', marginLeft:'-4px', width:'8px', height:'8px', background:'rgba(28,10,65,0.98)', border:'1px solid rgba(212,175,55,0.55)', borderTop:'none', borderLeft:'none', transform:'rotate(45deg)' }}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── FILA GRATIS ── */}
        <div style={{
          display:'flex', alignItems:'center', gap:'6px',
          background:'rgba(255,255,255,0.015)',
          borderRadius:'10px', padding:'6px 8px',
          border:'1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ width:'28px', flexShrink:0, textAlign:'center', fontFamily:"'Cinzel',serif", fontSize:'5.5px', fontWeight:900, color:'rgba(180,165,220,0.55)', lineHeight:1.5 }}>
            🆓<br/>GRATIS
          </div>

          <div style={{ flex:1, position:'relative', minHeight:'56px', display:'flex', alignItems:'center' }}>
            <div style={{ position:'absolute', top:'50%', left:0, right:0, height:'2px', transform:'translateY(-50%)', borderRadius:'2px', zIndex:0, background:'rgba(255,255,255,0.07)' }}/>

            <div style={{ position:'relative', zIndex:1, width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              {FREE_LEVELS.map(lvl => {
                const unlocked = userLevel >= lvl.n;
                const isHov    = hovFree === lvl.n;
                const sz = lvl.n === 6 ? '40px' : '36px';
                return (
                  <div
                    key={lvl.n}
                    onMouseEnter={() => setHovFree(lvl.n)}
                    onMouseLeave={() => setHovFree(null)}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', position:'relative' }}
                  >
                    <div style={{
                      width:sz, height:sz,
                      borderRadius: lvl.n === 6 ? '10px' : '8px',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize: lvl.n === 6 ? '18px' : '15px',
                      transition:'all 0.25s ease',
                      transform: isHov && unlocked ? 'scale(1.12)' : 'scale(1)',
                      background: unlocked ? 'rgba(180,165,220,0.09)' : 'rgba(255,255,255,0.02)',
                      border:`1px solid ${unlocked ? 'rgba(180,165,220,0.32)' : 'rgba(255,255,255,0.07)'}`,
                      filter: unlocked ? 'none' : 'grayscale(1) brightness(0.3)',
                      opacity: unlocked ? 1 : 0.4,
                      boxShadow: isHov && unlocked ? '0 0 14px rgba(180,165,220,0.4)' : 'none',
                    }}>
                      {lvl.icon}
                    </div>
                    <div style={{ fontFamily:"'Cinzel',serif", fontSize:'5.5px', fontWeight:900, color: unlocked ? 'rgba(180,165,220,0.75)' : 'rgba(255,255,255,0.22)' }}>Nv.{lvl.n}</div>

                    {/* Tooltip hover gratis */}
                    {isHov && (
                      <div style={{
                        position:'absolute', bottom:'calc(100% + 8px)', left:'50%', transform:'translateX(-50%)',
                        width:'96px', zIndex:100,
                        background:'rgba(8,3,26,0.96)',
                        border:'1px solid rgba(180,165,220,0.25)',
                        borderRadius:'8px', padding:'6px 8px',
                        textAlign:'center', pointerEvents:'none',
                        animation:'rewardTooltipIn 0.15s ease',
                      }}>
                        <div style={{ fontFamily:"'Raleway',sans-serif", fontSize:'7px', color: unlocked ? 'rgba(200,185,240,0.85)' : 'rgba(200,185,240,0.4)', lineHeight:1.4 }}>
                          {unlocked ? lvl.reward : `${lvl.xp} XP para desbloquear`}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer XP info */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'8px' }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:'6px', letterSpacing:'1px', color:'rgba(212,175,55,0.3)' }}>{userXP} XP TOTAL</div>
          {nextLevel
            ? <div style={{ fontFamily:"'Cinzel',serif", fontSize:'6px', letterSpacing:'1px', color:'rgba(212,175,55,0.3)' }}>{nextLevel.xp} XP → NV.{nextLevel.n}</div>
            : <div style={{ fontFamily:"'Cinzel',serif", fontSize:'6px', letterSpacing:'1px', color:'rgba(212,175,55,0.5)' }}>⚔ NIVEL MÁXIMO</div>
          }
        </div>
      </div>
    </div>
  );
}

// ─── RARITY ENGINE ────────────────────────────────────────────────────────────
function getRarity(level) {
  if (level >= 20) return { label: 'PROPO-LEYENDA',    color: '#d4af37', glow: 'rgba(212,175,55,1)',    bg: 'linear-gradient(135deg,rgba(212,175,55,0.28),rgba(140,90,0,0.22))',   border: 'rgba(212,175,55,1)',    particle: '#ffe87a' };
  if (level >= 18) return { label: 'ASCENDIDO',         color: '#ddd6fe', glow: 'rgba(221,214,254,0.9)', bg: 'linear-gradient(135deg,rgba(221,214,254,0.18),rgba(80,60,160,0.18))', border: 'rgba(221,214,254,0.8)', particle: '#ede9fe' };
  if (level >= 16) return { label: 'FORJADO EN FUEGO',  color: '#ff6b35', glow: 'rgba(255,107,53,0.9)',  bg: 'linear-gradient(135deg,rgba(255,107,53,0.22),rgba(160,40,0,0.18))',   border: 'rgba(255,107,53,0.85)', particle: '#fed7aa' };
  if (level >= 14) return { label: 'MAESTRO',           color: '#4ade80', glow: 'rgba(74,222,128,0.9)',  bg: 'linear-gradient(135deg,rgba(74,222,128,0.18),rgba(0,100,40,0.18))',   border: 'rgba(74,222,128,0.8)',  particle: '#86efac' };
  if (level >= 12) return { label: 'SEÑOR DE ARENA',    color: '#fb7185', glow: 'rgba(251,113,133,0.9)', bg: 'linear-gradient(135deg,rgba(251,113,133,0.18),rgba(160,0,60,0.18))',  border: 'rgba(251,113,133,0.8)', particle: '#fda4af' };
  if (level >= 10) return { label: 'DOMINANTE',         color: '#f5d06e', glow: 'rgba(245,208,110,0.9)', bg: 'linear-gradient(135deg,rgba(245,208,110,0.22),rgba(140,90,0,0.18))',  border: 'rgba(245,208,110,0.8)', particle: '#fef08a' };
  if (level >= 8)  return { label: 'CENTINELA',         color: '#818cf8', glow: 'rgba(129,140,248,0.9)', bg: 'linear-gradient(135deg,rgba(129,140,248,0.18),rgba(50,0,180,0.18))',  border: 'rgba(129,140,248,0.8)', particle: '#c7d2fe' };
  if (level >= 6)  return { label: 'TEMPLARIO',         color: '#fbbf24', glow: 'rgba(251,191,36,0.95)', bg: 'linear-gradient(135deg,rgba(251,191,36,0.22),rgba(160,100,0,0.18))',  border: 'rgba(251,191,36,0.9)',  particle: '#fde68a' };
  if (level >= 5)  return { label: 'CONQUISTADOR',      color: '#ff4444', glow: 'rgba(255,68,68,0.9)',   bg: 'linear-gradient(135deg,rgba(255,68,68,0.22),rgba(160,0,0,0.18))',    border: 'rgba(255,68,68,0.85)',  particle: '#ff8a80' };
  if (level >= 4)  return { label: 'GUARDIÁN',          color: '#34d399', glow: 'rgba(52,211,153,0.9)',  bg: 'linear-gradient(135deg,rgba(52,211,153,0.18),rgba(0,100,60,0.18))',   border: 'rgba(52,211,153,0.8)',  particle: '#6ee7b7' };
  if (level >= 3)  return { label: 'FORJADOR',          color: '#fb923c', glow: 'rgba(251,146,60,0.9)',  bg: 'linear-gradient(135deg,rgba(251,146,60,0.22),rgba(160,60,0,0.18))',   border: 'rgba(251,146,60,0.85)', particle: '#fdba74' };
  if (level >= 2)  return { label: 'RECLUTA',           color: '#a78bfa', glow: 'rgba(167,139,250,0.9)', bg: 'linear-gradient(135deg,rgba(167,139,250,0.18),rgba(80,0,180,0.18))',  border: 'rgba(167,139,250,0.8)', particle: '#c4b5fd' };
  return                  { label: 'DESPERTAR',         color: '#60a5fa', glow: 'rgba(96,165,250,0.85)', bg: 'linear-gradient(135deg,rgba(96,165,250,0.18),rgba(0,60,160,0.18))',   border: 'rgba(96,165,250,0.7)',  particle: '#bfdbfe' };
}

// ─── PARTICLE BURST ───────────────────────────────────────────────────────────
function ParticleBurst({ color, active }) {
  if (!active) return null;
  const particles = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * 360;
    const dist  = 60 + Math.random() * 80;
    const px    = Math.cos((angle * Math.PI) / 180) * dist;
    const py    = Math.sin((angle * Math.PI) / 180) * dist;
    const size  = 3 + Math.random() * 5;
    return { px, py, size, delay: Math.random() * 0.15 };
  });
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: `${p.size}px`, height: `${p.size}px`,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 ${p.size * 2}px ${color}`,
          '--px': `${p.px}px`, '--py': `${p.py}px`,
          animation: `rewardParticle 0.7s ease-out ${p.delay}s both`,
          marginLeft: `-${p.size / 2}px`, marginTop: `-${p.size / 2}px`,
        }} />
      ))}
    </div>
  );
}
function ClaimCelebration({ reward, rarity, onDone, bonusCoins = 0, bonusXP = 0 }) {
  const [phase, setPhase] = useState(0);
  const [coinCount, setCoinCount] = useState(0);
  const [xpCount, setXpCount] = useState(0);

  useEffect(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const hit = (freq, t, dur, vol, type='sine') => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = type; o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(freq, ctx.currentTime + t);
        g.gain.setValueAtTime(0, ctx.currentTime + t);
        g.gain.linearRampToValueAtTime(vol, ctx.currentTime + t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + dur + 0.05);
      };
      hit(80,0,0.3,0.6,'sine'); hit(160,0,0.2,0.4,'triangle');
      hit(392,0.1,0.12,0.5); hit(523,0.22,0.12,0.5); hit(659,0.34,0.12,0.5);
      hit(784,0.46,0.12,0.5); hit(1047,0.58,0.5,0.6);
      hit(1319,0.7,0.4,0.4); hit(1568,0.85,0.6,0.3);
      [0.9,1.0,1.1,1.2].forEach((t,i) => hit(2093+i*200,t,0.15,0.15));
      [1.2,1.35,1.5,1.65,1.8].forEach((t,i) => hit(1047+i*80,'sine',0.08,0.18,t));
    } catch(e) {}

    setTimeout(() => setPhase(1), 50);
    setTimeout(() => setPhase(2), 400);
    setTimeout(() => setPhase(3), 900);

    if (bonusCoins > 0) {
      const dur = 1200; const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        setCoinCount(Math.round(p * bonusCoins));
        if (p < 1) requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), 600);
    }
    if (bonusXP > 0) {
      const dur = 1200; const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        setXpCount(Math.round(p * bonusXP));
        if (p < 1) requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), 800);
    }

  }, []);

  const coins = Array.from({length:16}, (_, i) => ({
    x: (Math.random() - 0.5) * 340,
    y: -(60 + Math.random() * 220),
    rot: Math.random() * 720 - 360,
    delay: 0.5 + Math.random() * 1.0,
    size: 14 + Math.random() * 16,
  }));

  const stars = Array.from({length:30},(_,i) => {
    const angle = (i/30)*360;
    const dist = 60 + Math.random() * 160;
    return {
      x: Math.cos(angle*Math.PI/180)*dist,
      y: Math.sin(angle*Math.PI/180)*dist,
      size: 3 + Math.random()*9,
      delay: Math.random()*0.4,
      color: i%3===0?'#d4af37':i%3===1?rarity.color:'#fff'
    };
  });

  const mascotPhase = phase >= 1;

  return (
    <div onClick={onDone} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(2,0,12,0.97)',
      backdropFilter: 'blur(28px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column',
      overflow: 'hidden',
      cursor: 'pointer',
    }}>
      <style>{`
        @keyframes coinFall {
          0%   { transform: translate(0,0) rotate(0deg) scale(0); opacity:1; }
          60%  { opacity:1; }
          100% { transform: translate(var(--cx), var(--cy)) rotate(var(--cr)) scale(1); opacity:0; }
        }
        @keyframes countUp {
          from { transform: translateY(20px); opacity:0; }
          to   { transform: translateY(0);    opacity:1; }
        }
        @keyframes mascotEntry {
          0%   { transform: translateY(120%) scale(0.6) rotate(-8deg); opacity:0; }
          60%  { transform: translateY(-8%) scale(1.06) rotate(2deg); opacity:1; }
          80%  { transform: translateY(2%) scale(0.98) rotate(-1deg); }
          100% { transform: translateY(0%) scale(1) rotate(0deg); opacity:1; }
        }
        @keyframes mascotFloat {
          0%,100% { transform: translateY(0px) rotate(-1deg); }
          50%     { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes mascotGlow {
          0%,100% { filter: drop-shadow(0 0 20px ${rarity.color}) drop-shadow(0 0 40px ${rarity.glow}); }
          50%     { filter: drop-shadow(0 0 40px ${rarity.color}) drop-shadow(0 0 80px ${rarity.glow}) drop-shadow(0 0 120px ${rarity.color}88); }
        }
        @keyframes celebRingExpand {
          0%   { transform: translate(-50%,-50%) scale(0); opacity:0.9; }
          100% { transform: translate(-50%,-50%) scale(4); opacity:0; }
        }
        @keyframes titleSlideUp {
          from { transform: translateY(30px) scale(0.9); opacity:0; }
          to   { transform: translateY(0) scale(1); opacity:1; }
        }
        @keyframes speechBubble {
          0%   { transform: scale(0) translateY(10px); opacity:0; }
          70%  { transform: scale(1.05) translateY(-2px); opacity:1; }
          100% { transform: scale(1) translateY(0); opacity:1; }
        }
      `}</style>

      {/* ── Rings de fondo ── */}
      {phase >= 1 && [1,2,3,4].map(i => (
        <div key={i} style={{
          position: 'absolute', left: '50%', top: '50%',
          width: `${i * 180}px`, height: `${i * 180}px`,
          borderRadius: '50%',
          border: `${i===1?2:1}px solid ${rarity.color}${i===1?'88':i===2?'44':i===3?'22':'11'}`,
          animation: `celebRingExpand ${1.2 + i*0.3}s cubic-bezier(0.2,0,0.8,1) ${i*0.1}s both`,
          pointerEvents: 'none',
        }}/>
      ))}

      {/* ── Partículas estrella ── */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
        {stars.map((s,i) => (
          <div key={i} style={{
            position: 'absolute', left: '50%', top: '50%',
            width: `${s.size}px`, height: `${s.size}px`,
            borderRadius: '50%',
            background: s.color,
            boxShadow: `0 0 ${s.size*2}px ${s.color}`,
            transform: phase>=1
              ? `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px)) scale(0)`
              : 'translate(-50%,-50%) scale(0)',
            opacity: phase>=1 ? 0 : 1,
            transition: `transform ${0.8+s.delay}s cubic-bezier(0.2,0,0,1) ${s.delay}s, opacity 0.6s ease ${0.5+s.delay}s`,
          }}/>
        ))}
      </div>

      {/* ── Monedas ── */}
      {phase >= 2 && coins.map((c,i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          fontSize: `${c.size}px`,
          '--cx': `${c.x}px`, '--cy': `${c.y}px`, '--cr': `${c.rot}deg`,
          animation: `coinFall 1.3s cubic-bezier(0.2,0,0.8,1) ${c.delay}s both`,
          pointerEvents: 'none', zIndex: 2,
        }}>🪙</div>
      ))}

      {/* ── Layout principal ── */}
      <div style={{
        position: 'relative', zIndex: 5,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '640px',
        padding: '0 clamp(12px, 3vw, 28px)',
        gap: 'clamp(10px, 3vw, 28px)',
      }}>

        {/* ── Mascota + burbuja ── */}
        <div style={{
          position: 'relative',
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          zIndex: 6,
          minHeight: 'clamp(200px, 50vw, 320px)',
        }}>

          {/* Burbuja de diálogo */}
          {phase >= 2 && (
            <div style={{
              position: 'absolute',
              right: 'clamp(0px, 5%, 40px)',
              bottom: 'clamp(160px, 28vw, 220px)',
              maxWidth: 'clamp(130px, 35vw, 200px)',
              background: 'rgba(8,3,26,0.95)',
              border: `1.5px solid ${rarity.color}`,
              borderRadius: '16px 16px 4px 16px',
              padding: 'clamp(8px,2vw,12px) clamp(10px,2.5vw,16px)',
              boxShadow: `0 0 24px ${rarity.glow}, inset 0 1px 0 ${rarity.color}44`,
              animation: 'speechBubble 0.5s cubic-bezier(0.34,1.3,0.64,1) 0.8s both',
              zIndex: 7,
            }}>
              <div style={{
                fontFamily: "'Raleway',sans-serif",
                fontSize: 'clamp(9px,2vw,12px)',
                color: 'rgba(220,210,255,0.9)',
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}>
                "{bonusCoins >= 250
  ? '⚔ La riqueza fluye hacia los que dominan, Templario.'
  : bonusCoins >= 100
  ? '🔥 Tu fortuna se forja. El Templo lo reconoce.'
  : bonusXP >= 100
  ? '✦ Cada XP es un paso hacia la cima del Templo.'
  : '🌟 El conocimiento aplicado es poder. Sigue tu camino.'}"
              </div>
              {/* Triángulo burbuja */}
              <div style={{
                position: 'absolute', bottom: '-8px', right: '14px',
                width: 0, height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '0px solid transparent',
                borderTop: `8px solid ${rarity.color}`,
              }}/>
            </div>
          )}

          {/* Mascota */}
          <img
            src={mascotImg}
            alt="Propósito IA"
            style={{
              width: 'clamp(140px, 38vw, 260px)',
              height: 'clamp(140px, 38vw, 260px)',
              objectFit: 'contain',
              mixBlendMode: 'screen',
              animation: mascotPhase
                ? 'mascotEntry 0.9s cubic-bezier(0.34,1.2,0.64,1) 0.1s both, mascotFloat 3.5s ease-in-out 1.2s infinite, mascotGlow 2.5s ease-in-out 1.2s infinite'
                : 'none',
              filter: `drop-shadow(0 0 30px ${rarity.color}) drop-shadow(0 0 60px ${rarity.glow})`,
              position: 'relative', zIndex: 6,
            }}
          />
        </div>

        {/* ── Columna derecha ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 'clamp(8px, 2vw, 16px)',
          zIndex: 5,
        }}>

        {/* ── Título ── */}
        <div style={{
          fontFamily: "'Cinzel',serif",
          fontSize: 'clamp(18px, 5vw, 32px)',
          fontWeight: 900,
          letterSpacing: 'clamp(1px, 0.8vw, 4px)',
          background: `linear-gradient(135deg,${rarity.color} 0%,#fff8dc 50%,${rarity.color} 100%)`,
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: phase>=2
            ? 'goldShimmer 1.5s linear infinite, titleSlideUp 0.5s ease both'
            : 'none',
          opacity: phase>=2 ? 1 : 0,
          textAlign: 'left',
          zIndex: 5,
          lineHeight: 1.1,
        }}>
          ✦ RECOMPENSA<br/>RECLAMADA ✦
        </div>

        {/* ── Nombre reward ── */}
        <div style={{
          fontFamily: "'Raleway',sans-serif",
          fontSize: 'clamp(11px, 2.5vw, 16px)',
          color: 'rgba(255,255,255,0.7)',
          opacity: phase>=3 ? 1 : 0,
          transition: 'opacity 0.4s ease',
          zIndex: 5,
          letterSpacing: '2px',
          textAlign: 'left',
        }}>
          {reward.name}
        </div>

        {/* ── Contadores Coins + XP ── */}
        {phase >= 2 && (
          <div style={{
            display: 'flex', gap: 'clamp(10px, 2vw, 16px)',
            zIndex: 5,
            animation: 'countUp 0.5s ease both',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
          }}>
            {bonusCoins > 0 && (
              <div style={{
                textAlign: 'center',
                background: 'rgba(212,175,55,0.12)',
                border: '1px solid rgba(212,175,55,0.5)',
                borderRadius: 'clamp(12px,2vw,16px)',
                padding: 'clamp(8px,1.5vw,12px) clamp(10px,3vw,20px)',
            boxShadow: '0 0 30px rgba(212,175,55,0.4)',
              }}>
                <div style={{ fontSize: 'clamp(20px,4vw,28px)', marginBottom: '4px' }}>🪙</div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(18px,4vw,26px)', fontWeight:900, color:'#fde68a', textShadow:'0 0 20px rgba(212,175,55,1)', lineHeight:1 }}>+{coinCount}</div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(6px,1.5vw,8px)', letterSpacing:'2px', color:'rgba(212,175,55,0.7)', marginTop:'4px' }}>PROPOCOINS</div>
              </div>
            )}
            {bonusXP > 0 && (
              <div style={{
                textAlign: 'center',
                background: `rgba(139,92,246,0.12)`,
                border: `1px solid ${rarity.color}88`,
                borderRadius: 'clamp(12px,2vw,16px)',
                padding: 'clamp(10px,2vw,14px) clamp(16px,4vw,28px)',
                boxShadow: `0 0 30px ${rarity.color}66`,
              }}>
                <div style={{ fontSize: 'clamp(20px,4vw,28px)', marginBottom: '4px' }}>⭐</div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(18px,4vw,26px)', fontWeight:900, color:rarity.color, textShadow:`0 0 20px ${rarity.glow}`, lineHeight:1 }}>+{xpCount}</div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(6px,1.5vw,8px)', letterSpacing:'2px', color:`${rarity.color}bb`, marginTop:'4px' }}>XP</div>
              </div>
            )}
          </div>
        )}
      </div>{/* ── Fin columna derecha ── */}

      </div>

      {/* ── Toca para salir ── */}
      <div style={{
        position: 'absolute', bottom: 'clamp(16px,4vw,40px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
        width: '100%',
      }}>
        <div style={{
          fontFamily: "'Cinzel',serif",
          fontSize: 'clamp(9px,1.8vw,12px)',
          letterSpacing: '3px',
          color: `${rarity.color}cc`,
          textShadow: `0 0 12px ${rarity.glow}`,
          animation: 'glowPulse 1.2s ease-in-out infinite',
        }}>
          ✦ TOCA PARA SALIR ✦
        </div>
        <div style={{ width: 'clamp(140px,40vw,220px)', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: phase>=1 ? '100%' : '0%', background: `linear-gradient(90deg,${rarity.color},#fff)`, borderRadius: '2px', transition: 'width 3.8s linear', boxShadow: `0 0 8px ${rarity.color}` }}/>
        </div>
      </div>
    </div>
  );
}
  
function RewardCardModal({ reward, userLevel, userId, onClose, onClaimed }) {
  const { addXP, addCristales } = usePlayerStore();
  const navigate = useNavigate();
  const [burst,    setBurst]    = useState(false);
  const [visible,  setVisible]  = useState(false);
  const [claimed,  setClaimed]  = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [claiming,    setClaiming]    = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const unlocked = userLevel >= reward.level;
  const rarity   = getRarity(reward.level);

  const TYPE_LABELS = {
    link:     '🔗 Recurso externo',
    module:   '📦 Módulo desbloqueado',
    download: '⬇️ Descargable',
    file:     '📄 Archivo especial',
  };

  // Check if already claimed
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 30);
    const t2 = setTimeout(() => setBurst(true),   200);
    const t3 = setTimeout(() => setBurst(false),  900);

    if (unlocked && userId) {
      supabase
        .from('user_rewards')
        .select('id, accessed_at')
        .eq('user_id', userId)
        .eq('reward_id', reward.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setClaimed(true);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  const handleClaim = async () => {
    if (!userId || claiming) return;

    // Si ya fue reclamado antes y es módulo, navegar directo sin celebración
    if (claimed && reward.type === 'module' && reward.url) {
      onClose();
      navigate(reward.url);
      return;
    }
    if (claimed && reward.url) {
  onClose();
  navigate(reward.url);
  return;
}
if (claimed && !reward.url) {
  onClose();
  return;
}

    setClaiming(true);
    SFX.coin();

    const isFirstTime = !claimed;

    await supabase.from('user_rewards').upsert({
      user_id:     userId,
      reward_id:   reward.id,
      accessed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,reward_id' });

    // Otorgar bonus solo la primera vez
    if (isFirstTime) {
      if (reward.bonus_propocoins > 0) {
        await addCristales(reward.bonus_propocoins);
      }
      if (reward.bonus_exp > 0) {
        await addXP(reward.bonus_exp);
      }
    }

    setClaimed(true);
    setClaiming(false);
    if (onClaimed) onClaimed(reward.id);
    window.dispatchEvent(new Event('rewardClaimed'));
    setCelebrating(true);
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(2,0,12,0.85)', backdropFilter:'blur(16px)', display:'flex', alignItems:'flex-start', justifyContent:'center', animation:'fadeIn .22s ease', padding:'16px', paddingTop:'calc(env(safe-area-inset-top) + 80px)', overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
      <div onClick={e => e.stopPropagation()} style={{ position:'relative', width:'100%', maxWidth:'420px', marginTop:'auto', marginBottom:'auto', background:`radial-gradient(ellipse at 50% 0%, ${rarity.color}22 0%, rgba(8,3,26,0.98) 65%)`, border:`1.5px solid ${rarity.border}`, borderRadius:'24px', padding:'22px 18px 26px', boxShadow:`0 0 60px ${rarity.glow}, 0 0 120px ${rarity.glow.replace('0.9','0.3')}, inset 0 1px 0 ${rarity.border}`, overflowY:'visible', animation: visible ? 'rewardPop .45s cubic-bezier(0.34,1.56,0.64,1) both' : 'none', textAlign:'center' }}>

        {/* Shimmer */}
        <div style={{ position:'absolute', inset:0, borderRadius:'28px', background:`linear-gradient(135deg,transparent 0%,${rarity.color}18 45%,rgba(255,255,255,0.08) 50%,${rarity.color}18 55%,transparent 100%)`, backgroundSize:'200% 200%', animation:'silverSweep 2.5s ease-in-out infinite', pointerEvents:'none' }} />

        <ParticleBurst color={rarity.particle} active={burst} />

        {/* Corner runes */}
        {['◈','✦','◆','⬡'].map((r, i) => (
          <div key={i} style={{ position:'absolute', top: i < 2 ? '14px' : 'auto', bottom: i >= 2 ? '14px' : 'auto', left: i % 2 === 0 ? '16px' : 'auto', right: i % 2 !== 0 ? '16px' : 'auto', fontFamily:"'Cinzel',serif", fontSize:'11px', color: rarity.color, opacity:0.35, animation:`glowPulse ${2 + i * 0.4}s ease-in-out ${i * 0.3}s infinite` }}>{r}</div>
        ))}

        {/* Rarity badge */}
        <div style={{ display:'inline-block', padding:'4px 18px', borderRadius:'100px', background:`${rarity.color}22`, border:`1px solid ${rarity.border}`, color: rarity.color, fontFamily:"'Cinzel',serif", fontSize:'9px', letterSpacing:'3px', fontWeight:900, marginBottom:'22px', boxShadow:`0 0 20px ${rarity.glow}` }}>
          {rarity.label}
        </div>

        {/* Icon orb */}
        <div style={{ position:'relative', width:'100px', height:'100px', borderRadius:'50%', margin:'0 auto 20px', background: unlocked ? `radial-gradient(ellipse at 30% 25%, ${rarity.color}55 0%, ${rarity.color}22 50%, transparent 100%)` : 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.4) 100%)', border:`2px solid ${unlocked ? rarity.border : 'rgba(255,255,255,0.12)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'46px', boxShadow: unlocked ? `0 0 40px ${rarity.glow}, 0 0 80px ${rarity.glow.replace('0.9','0.4')}` : 'none', animation: unlocked ? 'orbPulse 2s ease-in-out infinite' : 'none', filter: unlocked ? 'none' : 'grayscale(0.8) brightness(0.5)' }}>
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
            <circle cx="50%" cy="50%" r="47%" fill="none" stroke={unlocked ? rarity.border : 'rgba(255,255,255,0.1)'} strokeWidth="1" strokeDasharray="6 5" style={{ animation:'ringRotate 8s linear infinite', transformOrigin:'center', transformBox:'fill-box' }} />
          </svg>
          <span style={{ position:'relative', zIndex:1 }}>{unlocked ? reward.icon : '🔒'}</span>
        </div>

        {/* Level + tipo */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 14px', borderRadius:'100px', background: unlocked ? `${rarity.color}22` : 'rgba(255,255,255,0.05)', border:`1px solid ${unlocked ? rarity.border : 'rgba(255,255,255,0.1)'}`, marginBottom:'14px' }}>
          <span style={{ fontFamily:"'Cinzel',serif", fontSize:'10px', color: unlocked ? rarity.color : '#888', fontWeight:900, letterSpacing:'1px' }}>NIVEL {reward.level}</span>
          {reward.type && reward.url && <span style={{ fontSize:'9px', color:'rgba(200,185,240,0.5)' }}> · {TYPE_LABELS[reward.type] || reward.type}</span>}
        </div>

        {/* Title */}
        <h2 style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(18px,4vw,26px)', fontWeight:900, letterSpacing:'.05em', lineHeight:1.1, marginBottom:'10px', background: unlocked ? `linear-gradient(135deg, ${rarity.color} 0%, #fff8dc 50%, ${rarity.color} 100%)` : 'linear-gradient(135deg,#555,#888,#555)', backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation: unlocked ? 'goldShimmer 3s linear infinite' : 'none' }}>
          {unlocked ? reward.name : 'Recompensa Bloqueada'}
        </h2>

        {/* Description */}
        <p style={{ fontFamily:"'Raleway',sans-serif", fontSize:'13px', color: unlocked ? 'rgba(226,217,243,0.8)' : 'rgba(200,185,240,0.4)', lineHeight:1.6, marginBottom:'24px' }}>
          {reward.description || (unlocked ? 'Recompensa desbloqueada.' : `Alcanza el Nivel ${reward.level} para desbloquear.`)}
        </p>

        {/* CTA */}
        {unlocked ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>

            {/* Status */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'5px 18px', borderRadius:'100px', background: claimed ? 'rgba(34,197,94,0.12)' : 'rgba(255,215,0,0.08)', border:`1px solid ${claimed ? 'rgba(34,197,94,0.4)' : 'rgba(255,215,0,0.3)'}` }}>
              <div style={{ width:'7px', height:'7px', borderRadius:'50%', background: claimed ? '#22c55e' : rarity.color, boxShadow:`0 0 8px ${claimed ? '#22c55e' : rarity.color}`, animation:'glowPulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontFamily:"'Cinzel',serif", fontSize:'9px', letterSpacing:'2.5px', color: claimed ? '#22c55e' : rarity.color, fontWeight:700 }}>
                {loading ? 'VERIFICANDO...' : claimed ? 'YA RECLAMADO ✓' : 'LISTO PARA RECLAMAR'}
              </span>
            </div>

            {/* Bonus info */}
            {(reward.bonus_propocoins > 0 || reward.bonus_exp > 0) && (
              <div style={{ display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap' }}>
                {reward.bonus_propocoins > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 16px', borderRadius:'100px', background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.35)' }}>
                    <span style={{ fontSize:'14px' }}>🪙</span>
                    <span style={{ fontFamily:"'Cinzel',serif", fontSize:'11px', fontWeight:900, color:'#fde68a' }}>+{reward.bonus_propocoins} PropoCoins</span>
                  </div>
                )}
                {reward.bonus_exp > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 16px', borderRadius:'100px', background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.35)' }}>
                    <span style={{ fontSize:'14px' }}>⭐</span>
                    <span style={{ fontFamily:"'Cinzel',serif", fontSize:'11px', fontWeight:900, color:'#c4b5fd' }}>+{reward.bonus_exp} XP</span>
                  </div>
                )}
              </div>
            )}

            {/* Botón acción */}
            {!loading && (reward.bonus_propocoins > 0 || reward.bonus_exp > 0 || (reward.url && reward.url.trim() !== '')) && (
              <button
                onClick={handleClaim}
                disabled={claiming}
                onMouseEnter={e => { e.currentTarget.style.transform='scale(1.04)'; e.currentTarget.style.boxShadow=`0 0 50px ${rarity.glow}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='scale(1)';    e.currentTarget.style.boxShadow=`0 0 30px ${rarity.glow}`; }}
                style={{ padding:'14px 40px', borderRadius:'100px', background:`linear-gradient(135deg, ${rarity.color}33, ${rarity.color}55)`, border:`1.5px solid ${rarity.border}`, color: rarity.color, fontFamily:"'Cinzel',serif", fontSize:'11px', letterSpacing:'2.5px', fontWeight:900, cursor: claiming ? 'wait' : 'pointer', boxShadow:`0 0 30px ${rarity.glow}`, transition:'all .3s ease', width:'100%', position:'relative', overflow:'hidden' }}
              >
                <div style={{ position:'absolute', inset:0, borderRadius:'100px', background:'linear-gradient(135deg,transparent,rgba(255,255,255,0.1) 50%,transparent)', backgroundSize:'200% 200%', animation:'silverSweep 2s ease-in-out infinite' }} />
                <span style={{ position:'relative', zIndex:1 }}>
                  {claiming ? '⏳ ABRIENDO...' : claimed
                    ? (reward.type === 'module' ? '⚔ ABRIR DE NUEVO' : reward.url ? '✦ ACCEDER DE NUEVO →' : '✦ YA RECLAMADO ✓')
                    : (reward.type === 'module' ? '⚔ RECLAMAR Y ABRIR' : reward.type === 'download' ? '⬇ RECLAMAR Y DESCARGAR' : reward.url ? '✦ RECLAMAR RECOMPENSA →' : '✦ RECLAMAR')}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>

            {/* Coins y XP visibles aunque esté bloqueado */}
            {(reward.bonus_propocoins > 0 || reward.bonus_exp > 0) && (
              <div style={{ display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap' }}>
                {reward.bonus_propocoins > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 16px', borderRadius:'100px', background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.25)' }}>
                    <span style={{ fontSize:'14px' }}>🪙</span>
                    <span style={{ fontFamily:"'Cinzel',serif", fontSize:'11px', fontWeight:900, color:'rgba(212,175,55,0.7)' }}>+{reward.bonus_propocoins} PropoCoins</span>
                  </div>
                )}
                {reward.bonus_exp > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 16px', borderRadius:'100px', background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.25)' }}>
                    <span style={{ fontSize:'14px' }}>⭐</span>
                    <span style={{ fontFamily:"'Cinzel',serif", fontSize:'11px', fontWeight:900, color:'rgba(167,139,250,0.7)' }}>+{reward.bonus_exp} XP</span>
                  </div>
                )}
              </div>
            )}

            {/* Candado con nivel requerido */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'8px 22px', borderRadius:'100px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize:'12px' }}>🔒</span>
              <span style={{ fontFamily:"'Cinzel',serif", fontSize:'9px', letterSpacing:'2px', color:'rgba(200,185,240,0.4)' }}>
                NIVEL {reward.level} REQUERIDO · TE FALTAN {reward.level - userLevel} NVL
              </span>
            </div>
          </div>
        )}

        <p style={{ marginTop:'20px', fontSize:'10px', color:'rgba(200,185,240,0.25)', letterSpacing:'1px' }}>click fuera para cerrar</p>
      </div>
    </div>
  );

  if (celebrating) return (
    <div style={{ position:'fixed', inset:0, zIndex:99999, overflow:'hidden' }}>
      <ClaimCelebration
        reward={reward}
        rarity={rarity}
        onDone={() => {
          setCelebrating(false);
          onClose();
          if (reward.type === 'module') navigate(reward.url);
          else if (reward.url) navigate(reward.url);
        }}
      />
    </div>
  );
}

// ─── REWARDS SECTION ──────────────────────────────────────────────────────────
const VIP_COLORS = ['#a78bfa','#38bdf8','#c084fc','#fb923c','#f87171','#fbbf24','#60a5fa','#818cf8','#e879f9','#f5d06e','#c084fc','#fb7185','#67e8f9','#4ade80','#fde68a','#ff6b35','#a5f3fc','#ddd6fe','#fca5a5','#d4af37'];
const VIP_GLOWS  = ['rgba(167,139,250,0.9)','rgba(56,189,248,0.9)','rgba(192,132,252,0.9)','rgba(251,146,60,0.9)','rgba(248,113,113,0.9)','rgba(251,191,36,1)','rgba(96,165,250,0.9)','rgba(129,140,248,0.9)','rgba(232,121,249,0.9)','rgba(245,208,110,0.9)','rgba(192,132,252,0.9)','rgba(251,113,133,0.9)','rgba(103,232,249,0.9)','rgba(74,222,128,0.9)','rgba(253,230,138,0.9)','rgba(255,107,53,0.9)','rgba(165,243,252,0.9)','rgba(221,214,254,0.9)','rgba(252,165,165,0.9)','rgba(212,175,55,1)'];

function RewardsSection({ rewards, vipLevels = [], userLevel, userId, userXP = 0, isVip = false, onBuyVip }) {
  const [activeReward, setActiveReward] = useState(null);
  const [claimedIds,   setClaimedIds]   = useState(new Set());
  const [claimedVipIds,setClaimedVipIds]= useState(new Set());
const [celebratingVip, setCelebratingVip] = useState(null);
  const [hovVip,         setHovVip]         = useState(null);
const [clickedVip,     setClickedVip]     = useState(null);
const [vipTooltipPos,  setVipTooltipPos]  = useState(null);

  const VIP_LEVELS = vipLevels.length ? vipLevels.map((r, i) => ({
    n:      r.level,
    xp:     r.xp_required,
    icon:   r.icon,
    name:   r.name,
    reward: r.description,
    color:  VIP_COLORS[i] || '#fbbf24',
    glow:   VIP_GLOWS[i]  || 'rgba(251,191,36,1)',
    id:     r.id,
    bonus_propocoins: r.bonus_propocoins,
    bonus_exp:        r.bonus_exp,
    reward_type:      r.reward_type,
    reward_url:       r.reward_url,
  })) : [
    { n:1, xp:0,    icon:'⭐', name:'INICIADO',       reward:'+40 PropoCoins · Distintivo dorado',         color:'#a78bfa', glow:'rgba(167,139,250,0.9)' },
    { n:2, xp:250,  icon:'🔵', name:'RECLUTA',        reward:'+20 XP · +20 Coins · Nombre brillante',      color:'#38bdf8', glow:'rgba(56,189,248,0.9)'  },
    { n:3, xp:500,  icon:'🔮', name:'FORJADOR',       reward:'+40 XP · +40 Coins · Marco especial',        color:'#c084fc', glow:'rgba(192,132,252,0.9)'  },
    { n:4, xp:800,  icon:'🟠', name:'CONQUISTADOR',   reward:'+60 XP · +60 Coins · Aura dorada',           color:'#fb923c', glow:'rgba(251,146,60,0.9)'   },
    { n:5, xp:1100, icon:'🔴', name:'DOMINANTE',      reward:'+80 XP · +80 Coins · Nombre animado',        color:'#f87171', glow:'rgba(248,113,113,0.9)'  },
    { n:6, xp:1400, icon:'👑', name:'PROPO-TEMPLARIO',reward:'+180 XP · +250 Coins · Herramienta Premium', color:'#fbbf24', glow:'rgba(251,191,36,1)'     },
  ];

  useEffect(() => {
    if (!userId) return;
    supabase.from('user_rewards').select('reward_id').eq('user_id', userId)
      .then(({ data }) => { if (data) setClaimedIds(new Set(data.map(d => String(d.reward_id)))); });
    supabase.from('user_vip_rewards').select('reward_id').eq('user_id', userId)
      .then(({ data }) => { if (data) setClaimedVipIds(new Set(data.map(d => String(d.reward_id)))); });
  }, [userId]);

  useEffect(() => {
  if (!clickedVip) return;
  const close = (e) => {
    if (!e.target.closest('[data-vip-tooltip]')) setClickedVip(null);
  };
  setTimeout(() => document.addEventListener('click', close), 50);
  return () => document.removeEventListener('click', close);
}, [clickedVip]);

  const activeRewards = rewards;
  const currentVipLevel = userLevel;

  return (
    <>
      <div style={{
        borderRadius: '24px',
        background: 'linear-gradient(160deg,rgba(8,3,26,0.99) 0%,rgba(18,6,45,0.99) 100%)',
        border: '1px solid rgba(212,175,55,0.5)',
        boxShadow: '0 0 0 1px rgba(212,175,55,0.08), 0 20px 80px rgba(212,175,55,0.15), 0 0 120px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,230,120,0.15)',
        overflow: 'visible',
        position: 'relative',
      }}>

        {/* ── SHIMMER DE FONDO ── */}
        <div style={{ position:'absolute', inset:0, borderRadius:'24px', background:'linear-gradient(135deg,transparent 0%,rgba(212,175,55,0.03) 50%,transparent 100%)', pointerEvents:'none', zIndex:0 }}/>

        {/* ── HEADER ÉPICO ── */}
        <div style={{
          position:'relative', zIndex:1,
          padding: 'clamp(20px,3vw,32px) clamp(20px,3vw,32px) 0',
        }}>
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            flexWrap:'wrap', gap:'16px',
            padding:'16px 20px',
            background:'linear-gradient(90deg,rgba(212,175,55,0.18) 0%,rgba(139,92,246,0.12) 50%,rgba(212,175,55,0.18) 100%)',
            borderRadius:'16px',
            border:'1px solid rgba(212,175,55,0.35)',
            boxShadow:'0 0 40px rgba(212,175,55,0.1), inset 0 1px 0 rgba(255,230,120,0.2)',
            marginBottom:'24px',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ fontSize:'clamp(28px,4vw,40px)', filter:'drop-shadow(0 0 20px rgba(212,175,55,1)) drop-shadow(0 0 40px rgba(212,175,55,0.6))', animation:'vipCrownFloat 2.2s ease-in-out infinite' }}>👑</div>
              <div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(6px,1.2vw,8px)', letterSpacing:'5px', color:'rgba(212,175,55,0.6)', marginBottom:'3px' }}>⚔ PASE DE BATALLA EXCLUSIVO ⚔</div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(16px,3vw,26px)', fontWeight:900, background:'linear-gradient(135deg,#ffe87a 0%,#d4af37 30%,#fff8dc 55%,#d4af37 80%,#ffe87a 100%)', backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', letterSpacing:'3px', animation:'goldShimmer 3s linear infinite' }}>PROPO-PASS</div>
                <div style={{ fontFamily:"'Raleway',sans-serif", fontSize:'clamp(8px,1.5vw,11px)', color:'rgba(200,185,240,0.55)', letterSpacing:'1px', marginTop:'2px' }}>Acelera tu evolución con este pase exclusivo</div>
              </div>
            </div>
            {!isVip ? (
              <button
                onClick={onBuyVip}
                onMouseEnter={e => { e.currentTarget.style.transform='scale(1.08) translateY(-2px)'; e.currentTarget.style.boxShadow='0 0 60px rgba(212,175,55,1),0 0 100px rgba(139,92,246,0.7), 0 8px 30px rgba(0,0,0,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 0 30px rgba(212,175,55,0.6),0 0 60px rgba(139,92,246,0.4)'; }}
                style={{
                  position:'relative', padding:'clamp(10px,2vw,14px) clamp(16px,3vw,28px)',
                  background:'linear-gradient(135deg,#4c1d95 0%,#7c3aed 35%,#d4af37 70%,#ffe87a 100%)',
                  border:'none', borderRadius:'100px',
                  color:'#0c0a2a', fontFamily:"'Cinzel',serif", fontWeight:900,
                  fontSize:'clamp(8px,1.5vw,11px)', letterSpacing:'2px',
                  cursor:'pointer', overflow:'hidden',
                  animation:'vipBuyPulse 2s ease-in-out infinite',
                  whiteSpace:'nowrap',
                  boxShadow:'0 0 30px rgba(212,175,55,0.6),0 0 60px rgba(139,92,246,0.4)',
                  transition:'transform 0.25s ease, box-shadow 0.25s ease',
                }}>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)', backgroundSize:'200% 100%', animation:'vipBuyShimmer 3s ease-in-out infinite' }}/>
                <span style={{ position:'relative', zIndex:1 }}>👑 DESBLOQUEAR VIP · $9.99/MES</span>
              </button>
            ) : (
              <div style={{ padding:'8px 20px', background:'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(139,92,246,0.15))', border:'1px solid rgba(212,175,55,0.6)', borderRadius:'100px', fontFamily:"'Cinzel',serif", fontSize:'clamp(8px,1.5vw,10px)', color:'#d4af37', letterSpacing:'2px', boxShadow:'0 0 20px rgba(212,175,55,0.4)' }}>✦ VIP ACTIVO ✦</div>
            )}
          </div>
        </div>

        {/* ── FILAS DEL PASE ── */}
        <div style={{ position:'relative', zIndex:1, padding:'0 clamp(16px,3vw,32px) clamp(20px,3vw,32px)' }}>
          <style>{`
            .bp-scroll::-webkit-scrollbar { height: 8px; }
            .bp-scroll::-webkit-scrollbar-track { background: rgba(212,175,55,0.08); border-radius: 8px; margin: 0 8px; }
            .bp-scroll::-webkit-scrollbar-thumb { background: linear-gradient(90deg,#7c3aed,#d4af37); border-radius: 8px; box-shadow: 0 0 8px rgba(212,175,55,0.6); }
            .bp-scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(90deg,#d4af37,#ffe87a); }
            .bp-scroll { scrollbar-width: thin; scrollbar-color: #d4af37 rgba(212,175,55,0.08); }
          `}</style>

          {/* ── SCROLL COMPARTIDO — VIP arriba, GRATIS abajo, alineados por columna ── */}
          <div className="bp-scroll" style={{ overflowX:'auto', overflowY:'visible', paddingBottom:'16px', marginBottom:'4px' }}>
            <div style={{ minWidth:'1760px', position:'relative' }}>

          {/* ── FILA VIP ── */}
          <div style={{
            position:'relative',
            background: isVip
              ? 'linear-gradient(135deg,rgba(212,175,55,0.18) 0%,rgba(139,92,246,0.12) 50%,rgba(212,175,55,0.08) 100%)'
              : 'linear-gradient(135deg,rgba(212,175,55,0.08) 0%,rgba(139,92,246,0.06) 50%,rgba(212,175,55,0.04) 100%)',
            borderRadius:'16px 16px 0 0',
            border:'1px solid rgba(212,175,55,0.4)',
            borderBottom:'none',
            padding:'clamp(12px,2vw,18px) clamp(10px,2vw,16px)',
            boxShadow: isVip ? 'inset 0 1px 0 rgba(255,230,120,0.2), 0 0 40px rgba(212,175,55,0.12)' : 'inset 0 1px 0 rgba(255,230,120,0.1)',
          }}>
            {/* Badge VIP */}
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
              <div style={{ padding:'3px 12px', background: isVip ? 'linear-gradient(135deg,rgba(212,175,55,0.35),rgba(139,92,246,0.25))' : 'rgba(212,175,55,0.08)', border:`1px solid ${isVip ? 'rgba(212,175,55,0.8)' : 'rgba(212,175,55,0.3)'}`, borderRadius:'100px', fontFamily:"'Cinzel',serif", fontSize:'clamp(6px,1.2vw,8px)', letterSpacing:'3px', color: isVip ? '#fde68a' : 'rgba(212,175,55,0.4)', boxShadow: isVip ? '0 0 16px rgba(212,175,55,0.5)' : 'none' }}>
                {isVip ? '⚔️ VIP ACTIVO' : '👑 PASE VIP — BLOQUEADO'}
              </div>
              {!isVip && <div style={{ fontFamily:"'Raleway',sans-serif", fontSize:'clamp(7px,1.2vw,9px)', color:'rgba(200,185,240,0.35)', letterSpacing:'1px' }}>Haz clic en cualquier nivel para ver la recompensa</div>}
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ flex:1, position:'relative', height:'clamp(80px,12vw,100px)', display:'flex', alignItems:'center' }}>
                {/* Línea dorada */}
                <div style={{ position:'absolute', top:'38%', left:0, right:0, height:'3px', borderRadius:'3px', zIndex:0, background: isVip ? 'linear-gradient(90deg,rgba(212,175,55,0.2),#d4af37 20%,#ffe87a 50%,#d4af37 80%,rgba(212,175,55,0.2))' : 'linear-gradient(90deg,rgba(212,175,55,0.05),rgba(212,175,55,0.2) 50%,rgba(212,175,55,0.05))', boxShadow: isVip ? '0 0 12px rgba(212,175,55,0.8)' : 'none' }}/>
                <div style={{ position:'relative', zIndex:1, width:'100%', display:'grid', gridTemplateColumns:'repeat(20, 88px)', alignItems:'center' }}>
                  {VIP_LEVELS.map(lvl => {
                    const unlocked  = isVip && userLevel >= lvl.n;
                    const isCurr    = isVip && currentVipLevel === lvl.n;
                    const isHov     = hovVip === lvl.n;
                    const isClicked = clickedVip === lvl.n;
                    const sz = isCurr ? '66px' : '56px';
                    return (
                      <div key={lvl.n}
                        onClick={e => {
  e.stopPropagation();
  const rect = e.currentTarget.getBoundingClientRect();
  setVipTooltipPos({ x: rect.left + rect.width/2, y: rect.top });
  setClickedVip(isClicked ? null : lvl.n);
}}
                        onMouseEnter={() => setHovVip(lvl.n)}
                        onMouseLeave={() => setHovVip(null)}
                        style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', cursor: isVip && unlocked ? 'pointer' : !isVip ? 'pointer' : 'default', position:'relative', zIndex:2, width:'88px', overflow:'visible' }}
                      >
                        <div style={{
                          width:'88px', height:'88px',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          cursor: isVip && unlocked ? 'pointer' : !isVip ? 'pointer' : 'default',
                          fontSize: isCurr ? '28px' : '22px',
                          transition:'all 0.3s cubic-bezier(0.34,1.3,0.64,1)',
                          transform: isCurr ? 'scale(1.22) translateY(-6px)' : isHov ? 'scale(1.15) translateY(-4px)' : 'scale(1)',
                          background: 'transparent',
                          border: 'none',
                          boxShadow: 'none',
                          overflow: 'visible',
                          borderRadius: '0',
                          filter: (unlocked || isHov || isClicked) ? 'none' : 'brightness(0.75) saturate(0.6)',
                          opacity: 1,
                          animation: 'none',
                          position:'relative', overflow:'visible',
                        }}>

                          {/* ── RAYOS SOLARES — solo nivel actual ── */}
                          {isCurr && (
                            <div style={{ position:'absolute', inset:'-32px', zIndex:0, pointerEvents:'none' }}>
                              <div style={{
                                position:'absolute', inset:0,
                                borderRadius:'50%',
                                background:`conic-gradient(
                                  rgba(255,210,60,0)       0deg,
                                  rgba(255,210,60,0.18)   30deg,
                                  rgba(255,235,120,0.32)  60deg,
                                  rgba(255,210,60,0.18)   90deg,
                                  rgba(255,210,60,0)     120deg,
                                  rgba(255,210,60,0)     180deg,
                                  rgba(255,235,120,0.22) 210deg,
                                  rgba(255,210,60,0.14)  240deg,
                                  rgba(255,210,60,0)     270deg,
                                  rgba(255,210,60,0)     360deg
                                )`,
                                animation:'solarSpin 8s linear infinite',
                                filter:'blur(6px)',
                              }}/>
                              <div style={{
                                position:'absolute',
                                inset:'14px',
                                borderRadius:'50%',
                                background:'radial-gradient(ellipse, rgba(255,220,80,0.28) 0%, rgba(255,200,50,0.10) 50%, transparent 75%)',
                                animation:'vipGoldPulse 3s ease-in-out infinite',
                                filter:'blur(4px)',
                              }}/>
                            </div>
                          )}
                          
                          <img
                            src={botonVipImg}
                            alt=""
                            style={{
                              position:'relative',
                              zIndex:10,
                              width: isCurr ? 'clamp(58px,9vw,88px)' : 'clamp(48px,7vw,72px)',
                              height: isCurr ? 'clamp(58px,9vw,88px)' : 'clamp(48px,7vw,72px)',
                              transform: isCurr
                                ? 'scale(1.35)'
                                : isHov
                                  ? 'scale(1.15)'
                                  : 'scale(1)',
                              objectFit:'contain',
                              mixBlendMode: unlocked ? 'screen' : 'luminosity',
                              borderRadius: '0',
                              outline: 'none',
                              filter: isCurr
  ? `drop-shadow(0 0 22px ${lvl.glow}) drop-shadow(0 0 44px ${lvl.color}) saturate(1.8) brightness(1.2)`
  : unlocked
    ? `drop-shadow(0 0 12px ${lvl.glow}) saturate(1.4)`
    : 'grayscale(1) brightness(0.25)',
                              transition:'all 0.35s ease',
                              }}
                          />
                        </div>
                        {isCurr && (
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', marginBottom:'4px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'4px', padding:'3px 8px', borderRadius:'20px', background:'linear-gradient(135deg,rgba(212,175,55,0.25),rgba(180,120,0,0.2))', border:'1px solid rgba(212,175,55,0.6)', boxShadow:'0 0 10px rgba(212,175,55,0.4)', animation:'glowPulse 2.5s ease-in-out infinite' }}>
                              <span style={{ fontSize:'7px' }}>👑</span>
                              <span style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(4px,0.8vw,6px)', letterSpacing:'1.5px', color:'rgba(255,235,120,0.95)', fontWeight:900, whiteSpace:'nowrap' }}>TU NIVEL ACTUAL</span>
                              <span style={{ fontSize:'7px' }}>👑</span>
                            </div>
                          </div>
                        )}
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                          {unlocked && !claimedVipIds.has(String(lvl.id)) && (
                            <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(5px,0.9vw,7px)', letterSpacing:'1.5px', color:'#fde68a', textShadow:'0 0 8px rgba(212,175,55,1)', animation:'glowPulse 1.2s ease-in-out infinite', whiteSpace:'nowrap' }}>
                              ✦ CANJEAR
                            </div>
                          )}
                          <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(7px,1.2vw,10px)', fontWeight:900, color: unlocked ? '#fde68a' : (isHov || isClicked) && !isVip ? 'rgba(212,175,55,0.9)' : `${lvl.color}bb`, textShadow: unlocked ? `0 0 12px rgba(212,175,55,1)` : !isVip ? `0 0 8px ${lvl.color}66` : 'none', transition:'all 0.2s', whiteSpace:'nowrap' }}>
                            Nv.{lvl.n}
                          </div>
                        </div>
                        {!isVip && isClicked && (
                          <div onClick={e => e.stopPropagation()} style={{
                            position:'absolute', bottom:'calc(100% + 12px)', left:'50%', transform:'translateX(-50%)',
                            width:'140px', zIndex:300,
                            background:'linear-gradient(135deg,rgba(8,3,26,0.99),rgba(28,10,65,0.99))',
                            border:'1px solid rgba(212,175,55,0.6)',
                            borderRadius:'14px', padding:'12px 11px 10px',
                            boxShadow:'0 16px 50px rgba(212,175,55,0.35), 0 0 0 1px rgba(212,175,55,0.1)',
                            animation:'rewardTooltipIn 0.15s cubic-bezier(0.34,1.1,0.64,1)',
                            textAlign:'center',
                            willChange:'transform,opacity',
                          }}>
                            <div style={{ fontSize:'22px', marginBottom:'6px', filter:'drop-shadow(0 0 10px rgba(212,175,55,0.9))' }}>{lvl.icon}</div>
                            <div style={{ fontFamily:"'Cinzel',serif", fontSize:'8px', fontWeight:900, color:'#fde68a', marginBottom:'4px', textShadow:'0 0 10px rgba(212,175,55,0.8)' }}>{lvl.name}</div>
                            <div style={{ fontFamily:"'Raleway',sans-serif", fontSize:'7.5px', color:'rgba(200,185,240,0.75)', lineHeight:1.5, marginBottom:'10px' }}>{lvl.reward}</div>
                            <button onClick={e => { e.stopPropagation(); onBuyVip(); }} style={{ width:'100%', padding:'7px 0', background:'linear-gradient(135deg,#4c1d95,#7c3aed 50%,#d4af37)', border:'none', borderRadius:'100px', color:'#fff', fontFamily:"'Cinzel',serif", fontSize:'7px', fontWeight:900, letterSpacing:'1.5px', cursor:'pointer', boxShadow:'0 0 18px rgba(212,175,55,0.7)' }}>
                              👑 DESBLOQUEAR
                            </button>
                            <div style={{ position:'absolute', bottom:'-5px', left:'50%', marginLeft:'-4px', width:'8px', height:'8px', background:'rgba(28,10,65,0.99)', border:'1px solid rgba(212,175,55,0.6)', borderTop:'none', borderLeft:'none', transform:'rotate(45deg)' }}/>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── DIVISOR ── */}
          <div style={{
            display:'flex', alignItems:'center', gap:'12px',
            padding:'8px 20px',
            background:'linear-gradient(90deg,rgba(212,175,55,0.06),rgba(139,92,246,0.1) 50%,rgba(212,175,55,0.06))',
            border:'1px solid rgba(212,175,55,0.18)',
            borderTop:'none', borderBottom:'none',
            position:'sticky', left:0,
          }}>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(to right,transparent,rgba(212,175,55,0.5))' }}/>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(6px,1.2vw,8px)', letterSpacing:'3px', color:'rgba(212,175,55,0.7)', textShadow:'0 0 10px rgba(212,175,55,0.5)' }}>👑 PREMIUM</span>
              <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'rgba(212,175,55,0.6)', boxShadow:'0 0 8px rgba(212,175,55,0.8)' }}/>
              <span style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(6px,1.2vw,8px)', letterSpacing:'3px', color:'rgba(200,185,240,0.5)' }}>GRATIS 🆓</span>
            </div>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(to left,transparent,rgba(180,165,220,0.35))' }}/>
          </div>

          {/* ── FILA GRATIS ── */}
          <div style={{
            background:'linear-gradient(135deg,rgba(139,92,246,0.08) 0%,rgba(180,165,220,0.05) 50%,rgba(139,92,246,0.04) 100%)',
            borderRadius:'0 0 16px 16px',
            border:'1px solid rgba(180,165,220,0.2)',
            borderTop:'none',
            padding:'clamp(12px,2vw,18px) clamp(10px,2vw,16px)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
              <div style={{ padding:'3px 12px', background:'rgba(180,165,220,0.1)', border:'1px solid rgba(180,165,220,0.3)', borderRadius:'100px', fontFamily:"'Cinzel',serif", fontSize:'clamp(6px,1.2vw,8px)', letterSpacing:'3px', color:'rgba(200,185,240,0.7)' }}>
                🆓 RECOMPENSAS GRATIS
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ flex:1, position:'relative', height:'clamp(80px,12vw,100px)', display:'flex', alignItems:'center' }}>
                <div style={{ position:'absolute', top:'38%', left:0, right:0, height:'2px', borderRadius:'2px', zIndex:0, background:'linear-gradient(90deg,rgba(180,165,220,0.05),rgba(180,165,220,0.25) 50%,rgba(180,165,220,0.05))', boxShadow:'0 0 6px rgba(180,165,220,0.2)' }}/>
                <div style={{ position:'relative', zIndex:1, width:'100%', display:'grid', gridTemplateColumns:'repeat(20, 88px)', alignItems:'center' }}>
                  {activeRewards.map((r, idx) => {
                    const unlocked  = userLevel >= r.level;
                    const isCurrent = userLevel === r.level;
                    const rarity    = getRarity(r.level);
                    return (
                      <div key={r.id} onClick={() => setActiveReward(r)}
                        style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', cursor:'pointer', position:'relative', width:'88px' }}
                      >
                        <div style={{
                          width:'56px', height:'56px', borderRadius:'50%',
                          background: unlocked ? `radial-gradient(ellipse at 30% 25%, ${rarity.color}66 0%, ${rarity.color}28 50%, transparent 100%)` : 'rgba(255,255,255,0.03)',
                          border:`2.5px solid ${isCurrent ? '#fff' : unlocked ? rarity.border : 'rgba(139,92,246,0.25)'}`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:'clamp(15px,2.5vw,22px)',
                          boxShadow: isCurrent ? `0 0 32px ${rarity.glow}, 0 0 0 4px rgba(255,255,255,0.12)` : unlocked ? `0 0 24px ${rarity.glow}` : 'none',
                          filter: unlocked ? 'none' : 'grayscale(0.6) brightness(0.5)',
                          transition:'all .35s ease',
                          position:'relative', overflow:'visible',
                        }}>
                          
                          <span style={{ position:'relative', zIndex:1, filter: unlocked ? `drop-shadow(0 0 6px ${rarity.glow})` : 'none' }}>{unlocked ? r.icon : '🔒'}</span>
                          {unlocked && (
                            claimedIds.has(String(r.id)) ? (
                              <div style={{ position:'absolute', top:'-6px', right:'-6px', width:'20px', height:'20px', borderRadius:'50%', background:'linear-gradient(135deg,#22c55e,#16a34a)', border:'2px solid rgba(8,3,26,0.95)', boxShadow:'0 0 14px rgba(34,197,94,0.9)', zIndex:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:900, color:'#fff' }}>✓</div>
                            ) : (
                              <div style={{ position:'absolute', top:'-6px', right:'-6px', width:'20px', height:'20px', borderRadius:'50%', background:'linear-gradient(135deg,#ff4444,#ff8800)', border:'2px solid rgba(8,3,26,0.95)', boxShadow:'0 0 14px rgba(255,68,68,0.9)', animation:'glowPulse 2.5s ease-in-out infinite', zIndex:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:900, color:'#fff' }}>!</div>
                            )
                          )}
                        </div>
                        <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(7px,1.2vw,10px)', fontWeight:900, color: unlocked ? rarity.color : 'rgba(200,185,240,0.35)', textAlign:'center', textShadow: unlocked ? `0 0 12px ${rarity.glow}` : 'none' }}>Nv.{r.level}</div>
                        <div style={{ fontSize:'clamp(6px,1vw,8px)', color: unlocked ? 'rgba(255,255,255,0.8)' : 'rgba(200,185,240,0.25)', fontFamily:"'Raleway',sans-serif", fontWeight:600, textAlign:'center', lineHeight:1.2 }}>{r.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

            </div>{/* fin minWidth wrapper */}
          </div>{/* fin bp-scroll */}

        </div>

      {celebratingVip && (
        <div style={{ position:'fixed', inset:0, zIndex:999999 }}>
          <ClaimCelebration
            reward={{ icon: celebratingVip.icon, name: celebratingVip.name }}
            rarity={{ color: celebratingVip.color, glow: celebratingVip.glow, particle: celebratingVip.color }}
            bonusCoins={celebratingVip.bonusCoins}
            bonusXP={celebratingVip.bonusXP}
            onDone={() => setCelebratingVip(null)}
          />
        </div>
      )}

      {clickedVip && vipTooltipPos && (() => {
  const lvl = VIP_LEVELS.find(l => l.n === clickedVip);
  if (!lvl) return null;
  const unlocked = isVip && userLevel >= lvl.n;

  const VIP_MESSAGES = [
    'El despertar ha comenzado. El Templo te recibe.',
    'Tu juramento está hecho. No hay vuelta atrás.',
    'Tu voluntad se forja con cada paso.',
    'Proteges lo que construyes. El Templo lo ve.',
    'Conquistas lo que otros no se atreven a ver.',
    'El Templo te reconoce como pilar de su estructura.',
    'Tu vigilancia protege el horizonte del Templo.',
    'Guardas la puerta del conocimiento con honor.',
    'Anuncias una nueva era. El Templo escucha.',
    'Dominas el campo. Pocos llegan hasta aquí.',
    'El conocimiento oculto se revela ante los perseverantes.',
    'La arena te pertenece. Nadie te la puede quitar.',
    'Pocos llegan aquí. Tú sí. El Templo lo sabe.',
    'Enseñas con el ejemplo. Tu legado ya empezó.',
    'Tu nombre empieza a escribirse en los muros del Templo.',
    'El fuego no te destruyó. Te hizo eterno.',
    'Tu impacto trasciende el tiempo y el espacio.',
    'Has trascendido el límite de lo ordinario.',
    'Tu nombre es leyenda. El Templo lo susurra.',
    '⚔ La cima absoluta. El Templo se inclina ante ti.',
  ];
  const msg = VIP_MESSAGES[(lvl.n - 1)] || VIP_MESSAGES[0];
  const alreadyClaimed = claimedVipIds.has(String(lvl.id));

  return (
    <div
      data-vip-tooltip="true"
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: '60%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(290px, calc(100vw - 24px))',
        maxHeight: 'calc(100dvh - 60px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        zIndex: 99999,
        background: `linear-gradient(155deg, ${lvl.color}18 0%, rgba(8,3,26,0.99) 40%, rgba(2,0,12,1) 100%)`,
        border: `1.5px solid ${lvl.color}`,
        borderRadius: '24px',
        padding: '0',
        boxShadow: `0 0 60px ${lvl.glow}, 0 0 120px ${lvl.glow.replace('0.9','0.3')}, 0 30px 80px rgba(0,0,0,0.8), inset 0 1px 0 ${lvl.color}44`,
        overflow: 'hidden',
        animation: 'vipModalIn 0.3s cubic-bezier(0.34,1.3,0.64,1)',
      }}
    >
      <style>{`
        @keyframes vipModalIn {
          from { opacity:0; transform:translate(-50%,-90%) scale(0.85); }
          to   { opacity:1; transform:translate(-50%,-100%) scale(1); }
        }
        @keyframes maestroFloat {
          0%,100% { transform: translateY(0px) scale(1); }
          50%     { transform: translateY(-6px) scale(1.02); }
        }
        @keyframes vipBadgePulse {
          0%,100% { box-shadow: 0 0 10px ${lvl.color}66; }
          50%     { box-shadow: 0 0 25px ${lvl.color}cc, 0 0 50px ${lvl.color}44; }
        }
      `}</style>

      {/* Shimmer sweep */}
      <div style={{ position:'absolute', inset:0, borderRadius:'24px', background:'linear-gradient(135deg,transparent 0%,rgba(255,255,255,0.04) 45%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 55%,transparent 100%)', backgroundSize:'200% 200%', animation:'silverSweep 3s ease-in-out infinite', pointerEvents:'none', zIndex:0 }}/>

      {/* Corner runes */}
      {['◈','✦','◆','⬡'].map((r, i) => (
        <div key={i} style={{ position:'absolute', top: i < 2 ? '10px' : 'auto', bottom: i >= 2 ? '10px' : 'auto', left: i % 2 === 0 ? '12px' : 'auto', right: i % 2 !== 0 ? '12px' : 'auto', fontFamily:"'Cinzel',serif", fontSize:'9px', color: lvl.color, opacity:0.3, animation:`glowPulse ${2 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`, zIndex:1 }}>{r}</div>
      ))}

      {/* Header con maestro */}
      <div style={{ position:'relative', height:'clamp(70px, 22vw, 110px)', overflow:'hidden', background:`radial-gradient(ellipse at 30% 50%, ${lvl.color}22 0%, transparent 65%), radial-gradient(ellipse at 80% 20%, rgba(212,175,55,0.1) 0%, transparent 50%)` }}>
        
        {/* Rings decorativos */}
        {[1,2].map(i => (
          <div key={i} style={{ position:'absolute', left:'28%', top:'50%', width:`${i*90}px`, height:`${i*90}px`, borderRadius:'50%', border:`1px solid ${lvl.color}${i===1?'33':'18'}`, transform:'translate(-50%,-50%)', animation:`ringRotate ${8+i*4}s linear ${i===2?'reverse':''} infinite`, pointerEvents:'none' }}/>
        ))}

        {/* Maestro — mix-blend-mode screen elimina el negro */}
        <img
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          onError={e => { e.target.style.display='none'; }}
          style={{ display:'none' }}
          alt=""
        />
        <div style={{
          position: 'absolute',
          right: '-10px',
          bottom: '-10px',
          width: 'clamp(90px, 28vw, 140px)',
          height: 'clamp(90px, 28vw, 140px)',
          zIndex: 2,
          animation: 'maestroFloat 4s ease-in-out infinite',
        }}>
          <img
            src={mascotImg}
            alt="Maestro Templario"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              mixBlendMode: 'screen',
              filter: `drop-shadow(0 0 20px ${lvl.color}) drop-shadow(0 0 40px ${lvl.glow})`,
            }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* Info lado izquierdo */}
        <div style={{ position:'absolute', left:'16px', top:'16px', zIndex:3 }}>
          {/* Badge rarity */}
          <div style={{ display:'inline-block', padding:'clamp(3px,0.5vw,5px) clamp(8px,1.5vw,12px)', borderRadius:'100px', background:`${lvl.color}22`, border:`1px solid ${lvl.color}`, fontFamily:"'Cinzel',serif", fontSize:'clamp(7px,1.2vw,9px)', letterSpacing:'2px', color: lvl.color, marginBottom:'clamp(6px,1vw,10px)', animation:'vipBadgePulse 2s ease-in-out infinite' }}>
            ⚔ VIP · NV.{lvl.n}
          </div>
          {/* Icono */}
          <div style={{ fontSize:'clamp(24px,4vw,36px)', filter:`drop-shadow(0 0 16px ${lvl.glow}) drop-shadow(0 0 32px ${lvl.color}88)`, marginBottom:'clamp(3px,0.5vw,6px)', lineHeight:1 }}>{lvl.icon}</div>
          {/* Nombre */}
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(11px,2vw,15px)', fontWeight:900, background:`linear-gradient(135deg, ${lvl.color} 0%, #fff8dc 50%, ${lvl.color} 100%)`, backgroundSize:'200% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'goldShimmer 2s linear infinite', letterSpacing:'1px' }}>{lvl.name}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ position:'relative', zIndex:1, padding:'clamp(8px,3vw,14px) clamp(10px,4vw,18px) clamp(8px,3vw,16px)' }}>

        {/* Mensaje del maestro */}
        <div style={{ fontFamily:"'Raleway',sans-serif", fontSize:'clamp(8px,2.5vw,10px)', color:'rgba(200,185,240,0.75)', lineHeight:1.5, marginBottom:'8px', fontStyle:'italic', borderLeft:`2px solid ${lvl.color}66`, paddingLeft:'8px' }}>
          "{msg}"
        </div>

        {/* Rewards */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'8px' }}>
          {lvl.bonus_propocoins > 0 && (
            <div style={{ flex:1, textAlign:'center', background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.3)', borderRadius:'10px', padding:'8px 4px' }}>
              <div style={{ fontSize:'16px', marginBottom:'2px' }}>🪙</div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(14px,2.5vw,18px)', fontWeight:900, color:'#fde68a', textShadow:'0 0 12px rgba(212,175,55,1)' }}>+{lvl.bonus_propocoins}</div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(7px,1.2vw,9px)', letterSpacing:'1.5px', color:'rgba(212,175,55,0.6)', marginTop:'2px' }}>PROPOCOINS</div>
            </div>
          )}
          {lvl.bonus_exp > 0 && (
            <div style={{ flex:1, textAlign:'center', background:`${lvl.color}11`, border:`1px solid ${lvl.color}44`, borderRadius:'10px', padding:'8px 4px' }}>
              <div style={{ fontSize:'16px', marginBottom:'2px' }}>⭐</div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(14px,2.5vw,18px)', fontWeight:900, color: lvl.color, textShadow:`0 0 12px ${lvl.glow}` }}>+{lvl.bonus_exp}</div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(7px,1.2vw,9px)', letterSpacing:'1.5px', color:`${lvl.color}99`, marginTop:'2px' }}>XP</div>
            </div>
          )}
          {!lvl.bonus_propocoins && !lvl.bonus_exp && (
            <div style={{ flex:1, fontFamily:"'Raleway',sans-serif", fontSize:'9px', color:'rgba(200,185,240,0.6)', textAlign:'center', padding:'8px' }}>{lvl.reward}</div>
          )}
        </div>

        {/* CTA */}
        {!unlocked ? (
          <div style={{ width:'100%', padding:'10px 0', borderRadius:'100px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', fontFamily:"'Cinzel',serif", fontSize:'8px', letterSpacing:'2px', color:'rgba(200,185,240,0.4)', textAlign:'center' }}>
            🔒 NIVEL {lvl.n} REQUERIDO
          </div>
        ) : alreadyClaimed ? (
          <div style={{ width:'100%', padding:'10px 0', borderRadius:'100px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.4)', fontFamily:"'Cinzel',serif", fontSize:'8px', letterSpacing:'2px', color:'#4ade80', textAlign:'center', boxShadow:'0 0 14px rgba(34,197,94,0.3)' }}>
            ✓ RECOMPENSA RECLAMADA
          </div>
        ) : (
          <button
            onClick={e => {
              e.stopPropagation();
              supabase.from('user_vip_rewards').insert({ user_id: userId, reward_id: lvl.id })
                .then(async ({ error }) => {
                  if (!error) {
                    setClaimedVipIds(prev => new Set([...prev, String(lvl.id)]));
                    const { addXP, addCristales } = usePlayerStore.getState();
                    if (lvl.bonus_propocoins > 0) await addCristales(lvl.bonus_propocoins);
                    if (lvl.bonus_exp > 0) await addXP(lvl.bonus_exp);
                    setClickedVip(null);
                    setVipTooltipPos(null);
                    setCelebratingVip({ icon: lvl.icon, name: lvl.name, level: lvl.n, color: lvl.color, glow: lvl.glow, bonusCoins: lvl.bonus_propocoins || 0, bonusXP: lvl.bonus_exp || 0 });
                  }
                });
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='scale(1.03)'; e.currentTarget.style.boxShadow=`0 0 40px ${lvl.glow}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow=`0 0 20px ${lvl.glow}`; }}
            style={{ width:'100%', padding:'clamp(9px,1.5vw,12px) 0', background:`linear-gradient(135deg, ${lvl.color}33, ${lvl.color}55)`, border:`1.5px solid ${lvl.color}`, borderRadius:'100px', color: lvl.color, fontFamily:"'Cinzel',serif", fontSize:'clamp(8px,1.4vw,11px)', fontWeight:900, letterSpacing:'2px', cursor:'pointer', boxShadow:`0 0 20px ${lvl.glow}`, transition:'all .25s ease', position:'relative', overflow:'hidden' }}
          >
            <div style={{ position:'absolute', inset:0, borderRadius:'100px', background:'linear-gradient(135deg,transparent,rgba(255,255,255,0.12) 50%,transparent)', backgroundSize:'200% 200%', animation:'silverSweep 2s ease-in-out infinite' }}/>
            <span style={{ position:'relative', zIndex:1 }}>✦ RECLAMAR RECOMPENSA →</span>
          </button>
        )}
      </div>

      {/* Flecha */}
      <div style={{ position:'absolute', bottom:'-6px', left:'50%', marginLeft:'-5px', width:'10px', height:'10px', background:'rgba(8,3,26,1)', border:`1.5px solid ${lvl.color}`, borderTop:'none', borderLeft:'none', transform:'rotate(45deg)' }}/>
    </div>
  );
})()}
      {activeReward && (
        <RewardCardModal
          reward={activeReward}
          userLevel={userLevel}
          userId={userId}
          onClose={() => setActiveReward(null)}
          onClaimed={(id) => setClaimedIds(prev => new Set([...prev, id]))}
        />
      )}
      </div>
    </>
  );
}

function AchievementsSection({ achievements, onSelectAch }) {
  const [filter, setFilter] = useState('total');
  const [listKey, setListKey] = useState(0);

  const total    = achievements.length;
  const logrados = achievements.filter(a=>a.unlocked).length;
  const ocultos  = achievements.filter(a=>!a.unlocked).length;

  const TABS = [
    { id:'total',    label:'TOTAL',    value:total,    color:'#d4af37', icon:'◈' },
    { id:'logrados', label:'LOGRADOS', value:logrados, color:'#22c55e', icon:'✦' },
    { id:'ocultos',  label:'OCULTOS',  value:ocultos,  color:'#8b5cf6', icon:'🔒' },
  ];

  const visibleAchs = filter==='total'
    ? achievements
    : filter==='logrados'
      ? achievements.filter(a=>a.unlocked)
      : achievements.filter(a=>!a.unlocked);

  const handleTab = (id) => {
    if (id === filter) return;
    setFilter(id);
    setListKey(k=>k+1);
  };

  const activeTab = TABS.find(t=>t.id===filter);

  return (
    <div>
      {/* Stats tabs */}
      <div style={{display:'flex',gap:'12px',marginBottom:'28px',flexWrap:'wrap'}}>
        {TABS.map((t,i)=>{
          const isActive = filter === t.id;
          return (
            <div
              key={t.id}
              onClick={()=>handleTab(t.id)}
              style={{
                flex:1,minWidth:'clamp(90px,18vw,120px)',padding:'clamp(12px,2.5vw,18px) clamp(12px,2.5vw,20px)',borderRadius:'16px',cursor:'pointer',
                background: isActive
                  ? `linear-gradient(135deg,rgba(${t.id==='total'?'212,175,55':t.id==='logrados'?'34,197,94':'139,92,246'},0.18) 0%,rgba(8,3,26,0.98) 100%)`
                  : 'rgba(255,255,255,0.02)',
                border:`1px solid ${isActive ? t.color : 'rgba(255,255,255,0.06)'}`,
                boxShadow: isActive ? `0 8px 32px ${t.color}22,inset 0 1px 0 rgba(255,255,255,0.05)` : 'none',
                transform: isActive ? 'translateY(-3px)' : 'none',
                transition:'all .35s cubic-bezier(0.34,1.1,0.64,1)',
              }}
            >
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                <span style={{fontSize:'16px',filter:isActive?`drop-shadow(0 0 8px ${t.color})`:'none',transition:'filter .3s'}}>{t.icon}</span>
                {isActive && <div style={{width:'6px',height:'6px',borderRadius:'50%',background:t.color,boxShadow:`0 0 10px ${t.color}`,animation:'glowPulse 1.2s ease-in-out infinite'}}/>}
              </div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(20px,3vw,28px)',fontWeight:'900',color:isActive?t.color:'rgba(200,185,240,0.3)',textShadow:isActive?`0 0 20px ${t.color}66`:'none',lineHeight:1,transition:'all .35s ease',animation:isActive?`glowPulse 2s ease-in-out ${i*.4}s infinite`:'none'}}>
                {t.value}
              </div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:'7px',letterSpacing:'2.5px',color:isActive?`${t.color}aa`:'rgba(200,185,240,0.2)',marginTop:'4px',transition:'color .35s'}}>{t.label}</div>
            </div>
          );
        })}
      </div>

      {/* Active filter label */}
      <div key={`lbl-${filter}`} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'18px',animation:'achTabIn .35s ease'}}>
        <div style={{width:'24px',height:'1px',background:`linear-gradient(to right,transparent,${activeTab.color}88)`}}/>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'3px',color:`${activeTab.color}99`}}>
          {visibleAchs.length} {filter==='total'?'LOGROS EN TOTAL':filter==='logrados'?'LOGROS CONSEGUIDOS':'LOGROS OCULTOS'}
        </span>
        <div style={{flex:1,height:'1px',background:`linear-gradient(to right,${activeTab.color}44,transparent)`}}/>
      </div>

      {/* Achievement list */}
      <div key={listKey} style={{display:'flex',flexDirection:'column',gap:'9px'}}>
        {visibleAchs.length === 0 ? (
          <div style={{textAlign:'center',padding:'52px 20px',borderRadius:'16px',background:'rgba(255,255,255,0.01)',border:'1px dashed rgba(255,255,255,0.05)',animation:'achTabIn .4s ease'}}>
            <div style={{fontSize:'32px',marginBottom:'12px',opacity:.2}}>{activeTab.icon}</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:'11px',letterSpacing:'3px',color:`${activeTab.color}44`}}>
              {filter==='logrados'?'AÚN NO HAS DESBLOQUEADO LOGROS':'SIN LOGROS EN ESTA CATEGORÍA'}
            </div>
          </div>
        ) : visibleAchs.map((ach,i)=>(
          <div key={ach.id} style={{animation:`achCardIn .38s cubic-bezier(0.34,1.1,0.64,1) ${i*.055}s both`}}>
            <AchievementCard ach={ach} onClick={onSelectAch}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DIVIDER ──────────────────────────────────────────────────────────────────
function Divider({ icon='◈', label='' }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:'14px',margin:'52px 0 32px'}}>
      <div style={{flex:1,height:'1px',background:'linear-gradient(to right,transparent,rgba(212,175,55,0.55))'}}/>
      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:'14px',color:'rgba(212,175,55,0.9)'}}>{icon}</span>
        {label&&<span style={{fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'3px',color:'rgba(212,175,55,0.75)',textTransform:'uppercase'}}>{label}</span>}
      </div>
      <div style={{flex:1,height:'1px',background:'linear-gradient(to left,transparent,rgba(212,175,55,0.55))'}}/>
    </div>
  );
}


// ─── TEMPLO WEEKLY PLAN ──────────────────────────────────────────────────────
function TemploWeeklyPlan() {
  const completedModules = useMembershipStore(s => s.completedModules);
  const openedModules    = useMembershipStore(s => s.openedModules);
  const status           = useMembershipStore(s => s.status);
  const userProtocolo    = useMembershipStore(s => s.userProtocolo);

  if (status !== 'active') return null;

  const TOTAL = 25;
  const completed = completedModules.length;
  const opened    = openedModules.length;
  const pct       = Math.min(Math.round((opened / TOTAL) * 100), 100);
  const finished  = opened >= TOTAL;

  // Módulo actual según protocolo o semana
  const currentMod = useMembershipStore.getState();
  const activeMod = userProtocolo
    ? ACADEMY_MODULES.find(m => m.protocolo === userProtocolo)
    : ACADEMY_MODULES.find(m => !openedModules.includes(m.slug));

  return (
    <div style={{
      marginTop: '16px',
      borderRadius: '14px',
      background: finished
        ? 'linear-gradient(135deg,rgba(212,175,55,0.14) 0%,rgba(8,3,26,0.97) 100%)'
        : 'linear-gradient(135deg,rgba(124,58,237,0.1) 0%,rgba(8,3,26,0.97) 100%)',
      border: `1px solid ${finished ? 'rgba(212,175,55,0.45)' : 'rgba(124,58,237,0.3)'}`,
      padding: 'clamp(12px,2vw,18px) clamp(14px,2.5vw,20px)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Shimmer */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(100deg,transparent,rgba(255,255,255,0.03) 50%,transparent)', backgroundSize:'200% 200%', animation:'silverSweep 4s ease-in-out infinite', pointerEvents:'none' }}/>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px', flexWrap:'wrap', gap:'6px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ fontSize:'16px', filter: finished ? 'drop-shadow(0 0 8px rgba(212,175,55,0.9))' : 'drop-shadow(0 0 6px rgba(139,92,246,0.7))' }}>
            {finished ? '👑' : '⚔️'}
          </div>
          <div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:'6.5px', letterSpacing:'3px', color: finished ? 'rgba(212,175,55,0.5)' : 'rgba(139,92,246,0.6)', marginBottom:'2px' }}>
              {finished ? 'PLAN COMPLETADO' : 'TU PLAN SEMANAL'}
            </div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:'clamp(10px,2vw,12px)', fontWeight:900, color: finished ? '#fde68a' : '#c4b5fd', letterSpacing:'1px' }}>
              {finished ? 'El camino continúa' : activeMod ? `Semana ${activeMod.week} · ${activeMod.protocolo}` : 'Sigue tu camino'}
            </div>
          </div>
        </div>
        <div style={{ padding:'3px 10px', borderRadius:'100px', background: finished ? 'rgba(212,175,55,0.12)' : 'rgba(124,58,237,0.12)', border:`1px solid ${finished ? 'rgba(212,175,55,0.4)' : 'rgba(124,58,237,0.35)'}`, fontFamily:"'Cinzel',serif", fontSize:'7px', letterSpacing:'2px', color: finished ? '#fde68a' : '#a78bfa' }}>
          {opened}/{TOTAL} SEMANAS
        </div>
      </div>

      {/* Barra de progreso */}
      <div style={{ height:'5px', borderRadius:'100px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:'8px' }}>
        <div style={{
          height:'100%', width:`${pct}%`,
          background: finished
            ? 'linear-gradient(90deg,#d4af37,#fde68a)'
            : 'linear-gradient(90deg,#4c1d95,#7c3aed,#a78bfa)',
          borderRadius:'100px',
          boxShadow: finished ? '0 0 8px rgba(212,175,55,0.7)' : '0 0 8px rgba(124,58,237,0.6)',
          transition:'width 1.2s ease',
        }}/>
      </div>

      {/* Mensaje */}
      <div style={{ fontFamily:"'Raleway',sans-serif", fontSize:'clamp(9px,1.6vw,10.5px)', color:'rgba(200,185,240,0.55)', lineHeight:1.6 }}>
        {finished
          ? <>Completaste las 25 semanas del Templo. <span style={{ color:'rgba(212,175,55,0.8)', fontWeight:700 }}>Esto no es el final — es el punto de partida real.</span> Tu próxima etapa te espera.</>
          : activeMod
            ? <><span style={{ color:'rgba(200,185,240,0.8)' }}>{activeMod.title}</span> · {activeMod.subtitle}</>
            : 'Sigue avanzando semana a semana. Cada módulo te acerca más.'
        }
      </div>

      {/* Badge especial si terminó */}
      {finished && (
        <div style={{ marginTop:'10px', display:'flex', alignItems:'center', gap:'8px', padding:'6px 12px', borderRadius:'10px', background:'rgba(212,175,55,0.08)', border:'1px solid rgba(212,175,55,0.25)', width:'fit-content' }}>
          <span style={{ fontSize:'12px' }}>🔥</span>
          <span style={{ fontFamily:"'Cinzel',serif", fontSize:'7px', letterSpacing:'2px', color:'rgba(212,175,55,0.7)' }}>TEMPLARIO COMPLETO · FASE 2 DISPONIBLE</span>
        </div>
      )}
    </div>
  );
}

// ─── MEMBERSHIP CARD ─────────────────────────────────────────────────────────
function MembershipCard() {
  const memberStatus   = useMembershipStore(s => s.status);
  const renewsAt       = useMembershipStore(s => s.renewsAt);
  const plan           = useMembershipStore(s => s.plan);
  const completedMods  = useMembershipStore(s => s.completedModules);
  const openedMods     = useMembershipStore(s => s.openedModules);

  if (memberStatus !== 'active') return null;

  const renewLabel = renewsAt
    ? new Date(renewsAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const daysLeft = renewsAt
    ? Math.max(0, Math.ceil((new Date(renewsAt) - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const total     = 25;
  const opened    = openedMods.length;
  const completed = completedMods.length;
  const pct       = Math.round((opened / total) * 100);

  const planLabel = plan === 'propotienda' ? 'Propotienda'
    : plan === 'crecimiento' ? 'Crecimiento'
    : plan ? plan.charAt(0).toUpperCase() + plan.slice(1)
    : 'Templario';

  const urgColor = daysLeft !== null && daysLeft <= 7
    ? '#ef4444'
    : daysLeft !== null && daysLeft <= 15
    ? '#F5C518'
    : '#4ade80';

  return (
    <div style={{
      marginTop: '18px',
      borderRadius: '16px',
      background: 'linear-gradient(130deg, rgba(212,175,55,0.13) 0%, rgba(8,3,26,0.96) 40%, rgba(124,58,237,0.1) 100%)',
      border: '1px solid rgba(212,175,55,0.3)',
      boxShadow: '0 0 32px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,230,120,0.12)',
      padding: 'clamp(12px,2vw,18px) clamp(14px,2.5vw,22px)',
      display: 'flex',
      gap: 'clamp(14px,3vw,28px)',
      alignItems: 'center',
      flexWrap: 'wrap',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '16px',
        background: 'linear-gradient(100deg, transparent 0%, rgba(212,175,55,0.04) 45%, rgba(255,255,255,0.06) 50%, rgba(212,175,55,0.04) 55%, transparent 100%)',
        backgroundSize: '200% 200%',
        animation: 'silverSweep 4s ease-in-out infinite',
        pointerEvents: 'none',
      }}/>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(124,58,237,0.2))',
          border: '1px solid rgba(212,175,55,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
          boxShadow: '0 0 14px rgba(212,175,55,0.35)',
          animation: 'glowPulse 2.5s ease-in-out infinite',
          flexShrink: 0,
        }}>⚔️</div>
        <div>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 'clamp(6px,1.2vw,7.5px)',
            letterSpacing: '2.5px', color: 'rgba(212,175,55,0.5)',
            textTransform: 'uppercase', marginBottom: '2px',
          }}>Plan activo</div>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 'clamp(11px,2vw,13px)',
            fontWeight: 900, color: '#fde68a',
            textShadow: '0 0 14px rgba(212,175,55,0.7)',
            letterSpacing: '1px',
          }}>{planLabel}</div>
        </div>
      </div>

      <div style={{ width: '1px', alignSelf: 'stretch', background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.3), transparent)', flexShrink: 0 }}/>

      {renewLabel && (
        <div style={{ flexShrink: 0 }}>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 'clamp(6px,1.2vw,7.5px)',
            letterSpacing: '2.5px', color: 'rgba(212,175,55,0.5)',
            textTransform: 'uppercase', marginBottom: '2px',
          }}>Próxima renovación</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 'clamp(10px,2vw,12px)',
              fontWeight: 700, color: 'rgba(255,255,255,0.85)',
            }}>{renewLabel}</div>
            {daysLeft !== null && (
              <div style={{
                padding: '2px 8px', borderRadius: '100px',
                background: `${urgColor}18`,
                border: `1px solid ${urgColor}55`,
                fontFamily: "'Cinzel', serif", fontSize: 'clamp(6px,1vw,7px)',
                letterSpacing: '1.5px', color: urgColor,
                fontWeight: 700, whiteSpace: 'nowrap',
                boxShadow: `0 0 8px ${urgColor}33`,
                animation: daysLeft <= 7 ? 'glowPulse 1s ease-in-out infinite' : 'none',
              }}>
                {daysLeft === 0 ? 'HOY' : `${daysLeft}d`}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ width: '1px', alignSelf: 'stretch', background: 'linear-gradient(to bottom, transparent, rgba(124,58,237,0.3), transparent)', flexShrink: 0 }}/>

      <div style={{ flex: 1, minWidth: 'clamp(120px, 20vw, 180px)' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '6px',
        }}>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 'clamp(6px,1.2vw,7.5px)',
            letterSpacing: '2.5px', color: 'rgba(200,185,240,0.5)',
            textTransform: 'uppercase',
          }}>Academia</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: 'clamp(9px,1.8vw,11px)',
              fontWeight: 900, color: '#C084FC',
              textShadow: '0 0 10px rgba(192,132,252,0.6)',
            }}>{pct}%</span>
            <span style={{
              fontFamily: "'Cinzel', serif", fontSize: 'clamp(6px,1vw,7px)',
              color: 'rgba(200,185,240,0.35)', letterSpacing: '1px',
            }}>{completed}/{total}</span>
          </div>
        </div>
        <div style={{
          height: '5px', borderRadius: '100px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(192,132,252,0.15)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #7c3aed, #C084FC 60%, #d4af37)',
            borderRadius: '100px',
            boxShadow: '0 0 8px rgba(192,132,252,0.7)',
            transition: 'width 1.2s ease',
          }}/>
        </div>
        <div style={{
          marginTop: '5px',
          fontFamily: "'Raleway', sans-serif", fontSize: 'clamp(8px,1.5vw,9px)',
          color: 'rgba(200,185,240,0.35)', letterSpacing: '0.5px',
        }}>
          {opened} módulo{opened !== 1 ? 's' : ''} visitado{opened !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

// ─── RENEWAL ROPE NUDGE ──────────────────────────────────────────────────────
// Cuando la membresía está por vencer, recuerda que compartir el código de
// Alianza renueva por $1 — y de paso, le lanzas una cuerda a alguien que esa
// membresía le puede mejorar la vida.
const RENEWAL_NUDGE_WINDOW_DAYS = 10; // días antes de vencer en que aparece el recordatorio

function RenewalRopeNudge({ onShareClick }) {
  const memberStatus = useMembershipStore(s => s.status);
  const renewsAt      = useMembershipStore(s => s.renewsAt);
  const { profile }   = useAuthStore();
  const codigoReferido = profile?.referral_code;

  if (memberStatus !== 'active' || !renewsAt || !codigoReferido) return null;

  const daysLeft = Math.max(0, Math.ceil((new Date(renewsAt) - Date.now()) / (1000 * 60 * 60 * 24)));
  if (daysLeft > RENEWAL_NUDGE_WINDOW_DAYS) return null;

  const urgent = daysLeft <= 3;

  return (
    <div style={{
      marginTop: '14px',
      borderRadius: '16px',
      background: 'linear-gradient(130deg, rgba(212,175,55,0.12) 0%, rgba(8,3,26,0.97) 45%, rgba(124,58,237,0.12) 100%)',
      border: `1px solid ${urgent ? 'rgba(248,113,113,0.5)' : 'rgba(212,175,55,0.4)'}`,
      boxShadow: urgent ? '0 0 28px rgba(248,113,113,0.18)' : '0 0 24px rgba(212,175,55,0.12)',
      padding: 'clamp(14px,2.5vw,20px)',
      display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      position: 'relative', overflow: 'hidden',
      animation: urgent ? 'glowPulse 2s ease-in-out infinite' : 'none',
    }}>
      <div style={{
        flexShrink: 0, width: '44px', height: '44px', borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(124,58,237,0.2))',
        border: '1px solid rgba(212,175,55,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', boxShadow: '0 0 16px rgba(212,175,55,0.35)',
      }}>🪢</div>

      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{
          fontFamily: "'Cinzel',serif", fontSize: 'clamp(10px,1.8vw,12px)', fontWeight: 900,
          color: urgent ? '#f87171' : '#fde68a',
          textShadow: urgent ? '0 0 12px rgba(248,113,113,0.6)' : '0 0 12px rgba(212,175,55,0.6)',
          marginBottom: '4px', letterSpacing: '0.3px',
        }}>
          {daysLeft === 0 ? 'Tu membresía vence hoy' : `Tu membresía vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`}
        </div>
        <div style={{
          fontFamily: "'Raleway',sans-serif", fontSize: 'clamp(11px,1.8vw,12.5px)',
          color: 'rgba(200,185,240,0.7)', lineHeight: 1.55,
        }}>
          Comparte tu código de Alianza — quizás para alguien sea justo la cuerda que le cambia la vida. Y tú renuevas tu Templo por <strong style={{ color: '#fbbf24' }}>$1 USD</strong>.
        </div>
      </div>

      <button
        onClick={onShareClick}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 26px rgba(251,191,36,0.6)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 18px rgba(251,191,36,0.4)'; e.currentTarget.style.transform = 'scale(1)'; }}
        style={{
          flexShrink: 0,
          background: 'linear-gradient(135deg,#fde68a,#fbbf24,#d97706)',
          border: 'none', borderRadius: '10px', padding: '10px 18px',
          fontFamily: "'Cinzel',serif", fontSize: '9.5px', fontWeight: 900,
          color: '#1a0a2e', cursor: 'pointer',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          boxShadow: '0 4px 18px rgba(251,191,36,0.4)',
          whiteSpace: 'nowrap', transition: 'all .25s',
        }}
      >🪢 Compartir mi código</button>
    </div>
  );
}

const STRIPE_1MES_P   = 'https://buy.stripe.com/5kQ3cv9pJc0ad4ydGMenS0n';
const STRIPE_3MESES_P = 'https://buy.stripe.com/9B614natN0hs0hM0U0enS0o';

function PropoPassModal({ onClose }) {
  const [hovUno, setHovUno]   = useState(false);
  const [hovTres, setHovTres] = useState(false);
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(1,5,18,0.9)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div onClick={e=>e.stopPropagation()} style={{position:'relative',width:'100%',maxWidth:'430px',borderRadius:'22px',background:'linear-gradient(160deg,#04091f 0%,#070d28 45%,#030814 100%)',border:'1.5px solid rgba(201,168,76,0.65)',boxShadow:'0 0 80px rgba(201,168,76,0.18)',fontFamily:"'Cinzel',Georgia,serif",overflow:'hidden'}}>
        <button onClick={onClose} style={{position:'absolute',top:14,right:14,zIndex:10,width:30,height:30,borderRadius:'50%',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.35)',color:'rgba(201,168,76,0.7)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'inherit'}}>✕</button>
        <div style={{padding:'36px 26px 30px'}}>
          <div style={{textAlign:'center',marginBottom:22}}>
            <div style={{fontSize:48,display:'inline-block',marginBottom:10}}>👑</div>
            <div style={{fontSize:9,letterSpacing:'5px',color:'rgba(201,168,76,0.5)',textTransform:'uppercase',marginBottom:6}}>PASE DE ÉLITE DEL TEMPLO</div>
            <div style={{fontSize:24,fontWeight:900,letterSpacing:'4px',textTransform:'uppercase',background:'linear-gradient(135deg,#f0c040,#c9a84c,#ffe87a,#c9a84c,#f0c040)',backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',marginBottom:8}}>PROPO-PASS</div>
            <div style={{fontSize:11,letterSpacing:'2px',color:'rgba(0,210,230,0.7)',textTransform:'uppercase'}}>⚔ Desbloquea tu poder VIP ⚔</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:24}}>
            {[{icon:'⚡',titulo:'+10% XP',sub:'En todo el ranking'},{icon:'🪙',titulo:'+COINS',sub:'Recompensas extra'},{icon:'💎',titulo:'EFECTO VIP',sub:'Brillo exclusivo'}].map((b,i)=>(
              <div key={i} style={{padding:'12px 8px',borderRadius:12,background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.2)',textAlign:'center'}}>
                <div style={{fontSize:20,marginBottom:5}}>{b.icon}</div>
                <div style={{fontSize:9,fontWeight:900,color:'#c9a84c',letterSpacing:'1px',marginBottom:2}}>{b.titulo}</div>
                <div style={{fontSize:9,color:'rgba(200,185,240,0.45)'}}>{b.sub}</div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',fontSize:9,letterSpacing:'4px',color:'rgba(201,168,76,0.35)',marginBottom:16,textTransform:'uppercase'}}>── Elige tu plan ──</div>
          <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:20}}>
            <button onMouseEnter={()=>setHovUno(true)} onMouseLeave={()=>setHovUno(false)} onClick={()=>window.open(STRIPE_1MES_P,'_blank')} style={{position:'relative',width:'100%',padding:'16px 20px',borderRadius:14,background:hovUno?'linear-gradient(135deg,rgba(201,168,76,0.18),rgba(0,200,220,0.12))':'linear-gradient(135deg,rgba(201,168,76,0.08),rgba(0,180,200,0.06))',border:`1.5px solid ${hovUno?'rgba(255,230,80,0.9)':'rgba(201,168,76,0.45)'}`,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,fontFamily:"'Cinzel',Georgia,serif"}}>
              <div><div style={{fontSize:11,fontWeight:900,letterSpacing:'2px',color:'#ffe87a',textTransform:'uppercase',marginBottom:3}}>1 MES</div><div style={{fontSize:9,letterSpacing:'1.5px',color:'rgba(201,168,76,0.55)',textTransform:'uppercase'}}>Acceso completo · 30 días</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:22,fontWeight:900,color:'#ffe87a',textShadow:'0 0 20px rgba(255,220,60,0.8)',lineHeight:1}}>$9.99</div><div style={{fontSize:8,letterSpacing:'2px',color:'rgba(201,168,76,0.5)',textTransform:'uppercase',marginTop:2}}>USD</div></div>
            </button>
            <button onMouseEnter={()=>setHovTres(true)} onMouseLeave={()=>setHovTres(false)} onClick={()=>window.open(STRIPE_3MESES_P,'_blank')} style={{position:'relative',width:'100%',padding:'16px 20px',borderRadius:14,background:hovTres?'linear-gradient(135deg,rgba(0,200,220,0.18),rgba(0,150,200,0.14))':'linear-gradient(135deg,rgba(0,180,200,0.08),rgba(0,140,180,0.06))',border:`1.5px solid ${hovTres?'rgba(0,230,250,0.9)':'rgba(0,200,220,0.45)'}`,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,fontFamily:"'Cinzel',Georgia,serif"}}>
              <div style={{position:'absolute',top:8,right:8,background:'linear-gradient(135deg,#00c8dc,#0090b0)',color:'#001a26',fontSize:7,fontWeight:900,letterSpacing:'1.5px',padding:'2px 8px',borderRadius:20,textTransform:'uppercase',zIndex:2}}>✦ MEJOR VALOR</div>
              <div><div style={{fontSize:11,fontWeight:900,letterSpacing:'2px',color:'#4fc3f7',textTransform:'uppercase',marginBottom:3}}>3 MESES</div><div style={{fontSize:9,letterSpacing:'1.5px',color:'rgba(79,195,247,0.55)',textTransform:'uppercase'}}>Acceso completo · 90 días</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:22,fontWeight:900,color:'#4fc3f7',textShadow:'0 0 20px rgba(0,200,220,0.8)',lineHeight:1}}>$21.90</div><div style={{fontSize:8,letterSpacing:'2px',color:'rgba(79,195,247,0.5)',textTransform:'uppercase',marginTop:2}}>USD · $7.30/mes</div></div>
            </button>
          </div>
          <div style={{textAlign:'center',fontSize:8,letterSpacing:'2px',color:'rgba(201,168,76,0.3)',textTransform:'uppercase'}}>⚔ Templo del Propósito · Cancela cuando quieras ⚔</div>
        </div>
      </div>
    </div>
  );
}


// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
/**
 * MiPerfil — Single-page legendary profile for El Templo
 *
 * Props (all optional — defaults provided):
 *   user        : { name, username, avatar, propocoins, level, xp, xpToNext, isAdmin, joinDate }
 *   arsenalItems: ArsenalItem[]
 *   onNavigate  : (page:string) => void
 */
export default function ProfilePage() {
  const [showPropoPassModal, setShowPropoPassModal] = useState(false);
  const [pack1Active, setPack1Active] = useState(false);
  const [pack2Active, setPack2Active] = useState(false);
  const [packIframeSrc, setPackIframeSrc] = useState('');
  const [packIframeLoading, setPackIframeLoading] = useState(false);
  const [packViewOpen, setPackViewOpen] = useState(false);
  const { templarioName, level, xp, xpToNextLevel, cristales, avatar, addXP, addCristales } = usePlayerStore();
  const { profile } = useAuthStore();
  const sidebarOpen = useUIStore(s => s.sidebarOpen);
  const [userId, setUserId] = useState(null);
  const [userIdReady, setUserIdReady] = useState(false);
  const vipStatus = useAuthStore(s => s.isVip());
  const location = useLocation();
  const allianceRef = useRef(null);
  const [allianceHighlight, setAllianceHighlight] = useState(false);
  const [allianceTourSeen, setAllianceTourSeen] = useState(true); // asume visto hasta confirmar lo contrario (evita parpadeo)
  const [allianceTourLoading, setAllianceTourLoading] = useState(true);

  // Se lee de Supabase (profiles.alliance_tour_seen), no de la URL ni de localStorage —
  // así un refresh de /profile?highlight=alianza no lo vuelve a disparar.
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('profiles')
      .select('alliance_tour_seen')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        setAllianceTourSeen(error ? true : !!data?.alliance_tour_seen);
        setAllianceTourLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('highlight') !== 'alianza') return;
    if (allianceTourLoading || allianceTourSeen) return;
    const t = setTimeout(() => {
      allianceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setAllianceHighlight(true);
      setAllianceTourSeen(true);
      if (userId) {
        localStorage.removeItem(`tdp_alliance_spotlight_${userId}`);
        supabase
          .from('profiles')
          .update({ alliance_tour_seen: true })
          .eq('id', userId)
          .then(({ error }) => { if (error) console.error('Error guardando alliance_tour_seen:', error); });
      }
    }, 500);
    return () => clearTimeout(t);
  }, [location.search, userId, allianceTourLoading, allianceTourSeen]);

  // Se cierra únicamente cuando el usuario confirma de verdad. Nada de auto-cierre por tiempo.
  const dismissAllianceHighlight = useCallback(() => setAllianceHighlight(false), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id ?? null;
      setUserId(uid);
      setUserIdReady(true);
      if (uid) {
        const store = useMembershipStore.getState();
        store.syncProgress(uid);
        supabase
          .from('profiles')
          .select('pack1_active, pack2_active')
          .eq('id', uid)
          .single()
          .then(({ data: p }) => {
            if (p) {
              setPack1Active(!!p.pack1_active);
              setPack2Active(!!p.pack2_active);
            }
          });
      }
    });
    const t = setTimeout(() => SFX.reveal(), 400);
    return () => clearTimeout(t);
  }, []);
  const user = useMemo(() => {
  let displayLevel = level || 1;
  let displayRank  = 0;
  while (displayLevel > 20) {
    displayLevel -= 20;
    if (displayRank < 6) displayRank++;
  }
  if (displayLevel < 1) displayLevel = 1;
  return {
    name: templarioName || profile?.templario_name || profile?.email?.split('@')[0] || 'Guerrero del Templo',
    username: profile?.email ? `@${profile.email.split('@')[0]}` : '@guerrero',
    avatar: avatar || null,
    propocoins: cristales || 0,
    level: displayLevel,
    xp: xp || 0,
    xpToNext: xpToNextLevel || 100,
    isAdmin: false,
    joinDate: profile?.created_at
      ? new Date(profile.created_at).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
      : 'El Templo',
  };
}, [templarioName, profile, avatar, cristales, level, xp, xpToNextLevel]);

  const [activeFilter, setActiveFilter] = useState(null);
  const [cardsKey,     setCardsKey]     = useState(0);
  const [selectedAch,  setSelectedAch]  = useState(null);
  const [selectedArsenalItem, setSelectedArsenalItem] = useState(null);
  const [showAdmin,    setShowAdmin]    = useState(false);
  const [rewards, setRewards] = useState(DEFAULT_REWARDS);
const [vipLevels, setVipLevels] = useState([]);

useEffect(() => {
  supabase
    .from('level_rewards')
    .select('*')
    .eq('is_active', true)
    .order('level')
    .then(({ data }) => {
      if (!data?.length) return;
      setRewards(data.map(r => ({
        id:                r.id,
        level:             r.level,
        name:              r.title,
        description:       r.description,
        icon:              r.icon_emoji || '🎁',
        type:              r.reward_type,
        url:               r.content_url ? r.reward_value : null,
        bonus_propocoins:  r.bonus_propocoins || 0,
        bonus_exp:         r.bonus_exp || 0,
      })));
    });
}, []);

  useEffect(() => {
    supabase.from('vip_level_rewards').select('*').eq('is_active', true).order('level')
      .then(({ data }) => { if (data?.length) setVipLevels(data); });
  }, []);

  const [achievements, setAchievements] = useState(DEFAULT_ACHIEVEMENTS);
  const [adminHov,     setAdminHov]     = useState(false);


  const handleSphereClick = (id) => {
    if (activeFilter === id) { setActiveFilter(null); return; }
    setActiveFilter(id);
    setCardsKey(k => k+1);
    SFX.reveal();
  };

const [arsenalItems, setArsenalItems] = useState([]);

useEffect(() => {
  if (!userId) return;
  const load = async () => {
    try {
      const { storeService } = await import('../../services/store.service');
      const orders = await storeService.getUserOrders(userId);
      const productIds = [];
      orders.forEach(o => {
        try { JSON.parse(o.items || '[]').forEach(i => productIds.push(i.product_id)); } catch {}
      });
      if (!productIds.length) return;
      const { data: products } = await supabase.from('products').select('*').in('id', productIds);
      setArsenalItems((products || []).map(p => ({
  id:             p.id,
  slug:           p.slug,
  title:          p.name,
  subtitle:       p.metadata?.subtitle || p.description?.slice(0, 60) || '',
  type:           p.category,
  territory:      p.metadata?.territory || 'mente',
  color:          p.metadata?.color || '#8b5cf6',
  icon:           p.metadata?.icon || '🧠',
  image:          p.asset_url || null,
  level:          p.rarity?.toUpperCase() || 'AVANZADO',
  description:    p.description || '',
  impact:         p.metadata?.objectives || [],
  transformation: p.metadata?.transformation || '',
  duration:       p.metadata?.duration || '',
  sessions:       p.metadata?.sessions || '',
  content_url:    p.content_url || null,
})));
    } catch (err) {
      console.error('Error cargando arsenal:', err);
    }
  };
  load();
}, [userId]);
const filteredItems = useMemo(() =>
  !activeFilter ? [] :
  activeFilter === 'todos' ? arsenalItems :
  arsenalItems.filter(i => i.type === activeFilter),
[activeFilter, arsenalItems]);

function TempleBuzon({ userId }) {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || loading) return;
    if (!userId) {
      console.error('❌ BUZÓN: userId es null/undefined');
      alert('Error: no hay userId. Revisa consola.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('product_feedback').insert({
        user_id: userId,
        message: text.trim(),
      });
      console.log('BUZÓN INSERT → data:', data, 'error:', error);
      if (error) { alert('Error Supabase: ' + error.message); setLoading(false); return; }
      const { missionsService } = await import('../../services/missions.service');
      await missionsService.trackEvent(userId, 'first_review');
      setSent(true);
    } catch (err) {
      console.error('Feedback error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      borderRadius: '20px',
      background: 'linear-gradient(145deg,rgba(124,58,237,0.1) 0%,rgba(8,3,26,0.97) 100%)',
      border: '1px solid rgba(212,175,55,0.2)',
      padding: 'clamp(20px,4vw,36px)',
      marginTop: '8px',
    }}>
      {sent ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚔️</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '12px', letterSpacing: '3px', color: '#4ade80', textShadow: '0 0 20px rgba(74,222,128,0.6)' }}>¡GRACIAS, TEMPLARIO!</div>
          <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: '11px', color: 'rgba(200,185,240,0.5)', marginTop: '8px', letterSpacing: '1px' }}>Tu voz construye el Templo.</div>
        </div>
      ) : (
        <>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '8px', letterSpacing: '3px', color: 'rgba(212,175,55,0.5)', marginBottom: '6px' }}>✦ Tu voz importa</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '15px', fontWeight: '700', color: '#f0e8ff', marginBottom: '6px' }}>¿Qué módulo quisieras ver?</div>
          <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: '11px', color: 'rgba(200,185,240,0.45)', marginBottom: '18px', lineHeight: '1.6' }}>
            Cuéntanos qué te falta, qué mejorarías, o qué producto crearías para tu crecimiento.
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escribe aquí tu idea o feedback..."
            rows={4}
            style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '10px', color: '#fff', fontFamily: "'Raleway', sans-serif", fontSize: '13px', outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: '1.6' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              onClick={handleSend}
              disabled={!text.trim() || loading}
              style={{ padding: '11px 28px', background: text.trim() ? 'linear-gradient(135deg,rgba(212,175,55,0.25),rgba(124,58,237,0.2))' : 'rgba(255,255,255,0.04)', border: `1px solid ${text.trim() ? 'rgba(212,175,55,0.55)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '100px', color: text.trim() ? '#d4af37' : 'rgba(200,185,240,0.25)', fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '2.5px', cursor: text.trim() ? 'pointer' : 'default', transition: 'all .3s ease' }}
            >
              {loading ? '⏳ ENVIANDO...' : '✦ ENVIAR FEEDBACK'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TempleReportes({ userId }) {
  const [open, setOpen]       = useState(false);
  const [cat, setCat]         = useState('');
  const [text, setText]       = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);

  const CATS = [
    { id:'bug',     icon:'🐛', label:'Bug / Error visual'           },
    { id:'cobro',   icon:'💳', label:'Cobré y no tengo acceso'      },
    { id:'acceso',  icon:'🔒', label:'No puedo acceder a contenido' },
    { id:'tecnico', icon:'⚙️', label:'Problema técnico'             },
    { id:'otro',    icon:'💬', label:'Otro'                         },
  ];

  const handleSend = async () => {
    if (!text.trim() || !cat || loading || !userId) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('user_reports').insert({
        user_id: userId, category: cat, message: text.trim(), status: 'pendiente',
      });
      if (error) {
        if (error.message?.includes('RATE_LIMIT')) {
          alert('Ya enviaste 3 reportes hoy. El equipo los está revisando. Intenta mañana.');
        } else {
          alert('Error: ' + error.message);
        }
        setLoading(false);
        return;
      }
      setSent(true);
    } catch (err) {
      console.error('Report error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => { setSent(false); setCat(''); setText(''); }, 350);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display:'flex', alignItems:'center', gap:'12px',
          padding:'clamp(14px,2.5vw,18px) clamp(16px,3vw,24px)',
          borderRadius:'16px', cursor:'pointer', width:'100%',
          background:'linear-gradient(135deg,rgba(239,68,68,0.09) 0%,rgba(8,3,26,0.97) 100%)',
          border:'1px solid rgba(239,68,68,0.3)',
          boxShadow:'0 0 24px rgba(239,68,68,0.1)',
          transition:'all .25s ease',
        }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(239,68,68,0.65)';e.currentTarget.style.boxShadow='0 0 36px rgba(239,68,68,0.22)';}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(239,68,68,0.3)';e.currentTarget.style.boxShadow='0 0 24px rgba(239,68,68,0.1)';}}
      >
        <div style={{width:'44px',height:'44px',borderRadius:'12px',flexShrink:0,background:'linear-gradient(135deg,rgba(239,68,68,0.22),rgba(239,68,68,0.08))',border:'1px solid rgba(239,68,68,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',boxShadow:'0 0 14px rgba(239,68,68,0.25)'}}>🚨</div>
        <div style={{flex:1,textAlign:'left'}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(11px,2vw,14px)',fontWeight:900,color:'#fff',marginBottom:'3px',letterSpacing:'1px'}}>Reportar un problema</div>
          <div style={{fontFamily:"'Raleway',sans-serif",fontSize:'clamp(9px,1.5vw,11px)',color:'rgba(200,185,240,0.45)',letterSpacing:'0.5px'}}>Fallos, cobros, bugs — el equipo lo revisa pronto</div>
        </div>
        <div style={{color:'rgba(239,68,68,0.6)',fontSize:'20px',flexShrink:0}}>›</div>
      </button>

      {open && ReactDOM.createPortal(
        <div onClick={handleClose} style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(2,0,12,0.88)',backdropFilter:'blur(14px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'clamp(12px,3vw,24px)',animation:'fadeIn .2s ease'}}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:'480px',maxHeight:'90dvh',overflowY:'auto',background:'linear-gradient(155deg,rgba(239,68,68,0.09) 0%,rgba(8,3,26,0.99) 50%,rgba(2,0,12,1) 100%)',border:'1.5px solid rgba(239,68,68,0.4)',borderRadius:'20px',padding:'clamp(16px,5vw,32px)',boxShadow:'0 0 80px rgba(239,68,68,0.18),0 40px 100px rgba(0,0,0,0.8)',position:'relative',animation:'slideUp .3s cubic-bezier(0.34,1.1,0.64,1)'}}>
            <button onClick={handleClose} style={{position:'absolute',top:'14px',right:'14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'50%',width:'30px',height:'30px',color:'rgba(200,185,240,0.6)',cursor:'pointer',fontSize:'13px',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>

            {sent ? (
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <div style={{fontSize:'48px',marginBottom:'14px'}}>✅</div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:'13px',letterSpacing:'3px',color:'#4ade80',textShadow:'0 0 20px rgba(74,222,128,0.6)',marginBottom:'8px'}}>REPORTE ENVIADO</div>
                <div style={{fontFamily:"'Raleway',sans-serif",fontSize:'11px',color:'rgba(200,185,240,0.5)',lineHeight:1.6}}>El equipo revisará tu caso pronto.</div>
                <button onClick={handleClose} style={{marginTop:'20px',padding:'10px 28px',borderRadius:'100px',background:'rgba(74,222,128,0.12)',border:'1px solid rgba(74,222,128,0.4)',color:'#4ade80',fontFamily:"'Cinzel',serif",fontSize:'9px',letterSpacing:'2px',cursor:'pointer'}}>✦ CERRAR</button>
              </div>
            ) : (
              <>
                <div style={{marginBottom:'18px'}}>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'3px',color:'rgba(239,68,68,0.55)',marginBottom:'6px'}}>🚨 SOPORTE DEL TEMPLO</div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(14px,3vw,18px)',fontWeight:900,color:'#fff',marginBottom:'6px'}}>Reportar un problema</div>
                  <div style={{fontFamily:"'Raleway',sans-serif",fontSize:'11px',color:'rgba(200,185,240,0.4)',lineHeight:1.6}}>Describe tu situación. Para cobros, incluye fecha y monto.</div>
                </div>

                <div style={{marginBottom:'16px'}}>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'2px',color:'rgba(200,185,240,0.35)',marginBottom:'10px'}}>TIPO DE REPORTE</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:'8px'}}>
                    {CATS.map(c=>(
                      <button key={c.id} onClick={()=>setCat(c.id)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 12px',borderRadius:'10px',cursor:'pointer',background:cat===c.id?'rgba(239,68,68,0.16)':'rgba(255,255,255,0.03)',border:`1px solid ${cat===c.id?'rgba(239,68,68,0.65)':'rgba(255,255,255,0.07)'}`,color:cat===c.id?'#fff':'rgba(200,185,240,0.45)',fontFamily:"'Raleway',sans-serif",fontSize:'11px',fontWeight:cat===c.id?700:400,transition:'all .2s ease',textAlign:'left',boxShadow:cat===c.id?'0 0 14px rgba(239,68,68,0.18)':'none'}}>
                        <span style={{fontSize:'15px',flexShrink:0}}>{c.icon}</span>
                        <span style={{lineHeight:1.3}}>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{marginBottom:'16px'}}>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'2px',color:'rgba(200,185,240,0.35)',marginBottom:'8px'}}>DESCRIPCIÓN</div>
                  <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Describe qué pasó, cuándo, y cualquier detalle útil..." rows={4} style={{width:'100%',boxSizing:'border-box',padding:'12px 14px',background:'rgba(255,255,255,0.04)',border:`1px solid ${text?'rgba(239,68,68,0.3)':'rgba(255,255,255,0.07)'}`,borderRadius:'10px',color:'#fff',fontFamily:"'Raleway',sans-serif",fontSize:'16px',outline:'none',resize:'none',lineHeight:'1.6',transition:'border-color .2s ease',webkitappearance:'none'}}/>
                </div>

                <button onClick={handleSend} disabled={!text.trim()||!cat||loading} style={{width:'100%',padding:'13px 24px',background:(text.trim()&&cat)?'linear-gradient(135deg,rgba(220,38,38,0.9),rgba(153,27,27,0.9))':'rgba(255,255,255,0.04)',border:`1px solid ${(text.trim()&&cat)?'rgba(239,68,68,0.55)':'rgba(255,255,255,0.07)'}`,borderRadius:'100px',cursor:(text.trim()&&cat)?'pointer':'default',color:(text.trim()&&cat)?'#fff':'rgba(200,185,240,0.2)',fontFamily:"'Cinzel',serif",fontSize:'10px',letterSpacing:'2.5px',fontWeight:900,transition:'all .3s ease',boxShadow:(text.trim()&&cat)?'0 0 24px rgba(239,68,68,0.3)':'none'}}>
                  {loading?'⏳ ENVIANDO...':'🚨 ENVIAR REPORTE'}
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

  return (
    <div style={{minHeight:'100dvh',background:'linear-gradient(180deg,#02000c 0%,#060018 35%,#080020 65%,#020008 100%)',color:'#fff',fontFamily:"'Raleway',sans-serif",position:'relative',overflowX:'hidden'}}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Raleway:wght@200;400;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:rgba(0,0,0,.3);}
        ::-webkit-scrollbar-thumb{background:rgba(212,175,55,.2);border-radius:2px;}
        @keyframes goldShimmer{0%{background-position:200% center}100%{background-position:0% center}}
        @keyframes xpShimmer{0%{background-position:200% center}100%{background-position:0% center}}
        @keyframes silverSweep{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes sphereFloat{0%,100%{transform:translateY(0px) translateZ(0)}50%{transform:translateY(-8px) translateZ(0)}}
        @keyframes runeFloat{0%,100%{opacity:.04;transform:translateY(0)}50%{opacity:.08;transform:translateY(-14px) rotate(5deg)}}
        @keyframes avatarPulse{0%,100%{box-shadow:0 0 40px rgba(212,175,55,.3),0 0 80px rgba(124,58,237,.15)}50%{box-shadow:0 0 70px rgba(212,175,55,.5),0 0 120px rgba(124,58,237,.3)}}
        @keyframes coinBounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}70%{transform:translateY(-2px)}}
        @keyframes energyLine{0%{stroke-dashoffset:0}100%{stroke-dashoffset:-400}}
        @keyframes ringRotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes cardEntrance{from{opacity:0;transform:translateY(28px) scale(.93)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes cardPulseRing{0%{opacity:.6;transform:scale(1)}100%{opacity:0;transform:scale(1.8)}}
        @keyframes allianceSpotlightGlow{0%,100%{box-shadow:0 0 40px rgba(212,175,55,.4)}50%{box-shadow:0 0 70px rgba(212,175,55,.75)}}
        @keyframes allianceTooltipFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes cardIconFloat{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-52%) scale(1.05)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateY(28px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes rewardPop{0%{transform:scale(.75);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes achSlide{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes glowPulse{0%,100%{opacity:.55}50%{opacity:1}}
        @keyframes rewardTooltipIn{from{opacity:0;transform:translateX(-50%) translateY(6px) scale(.94)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
        @keyframes rewardParticle{0%{transform:translate(0,0) scale(1);opacity:.9}100%{transform:translate(var(--px),var(--py)) scale(0);opacity:0}}
        @keyframes orbPulse{0%,100%{box-shadow:0 0 28px rgba(212,175,55,0.7),0 0 60px rgba(139,92,246,0.5),inset 0 0 20px rgba(212,175,55,0.15)}50%{box-shadow:0 0 48px rgba(212,175,55,0.95),0 0 90px rgba(139,92,246,0.7),inset 0 0 30px rgba(212,175,55,0.25)}}
        @keyframes achTabIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes achCardIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
        @keyframes progressFill{from{width:0%}to{width:var(--pw)}}
        @keyframes shimmerBar{0%{background-position:200% center}100%{background-position:0% center}}
        @keyframes cardsIn{from{opacity:0;transform:translateY(22px) translateZ(0)}to{opacity:1;transform:translateY(0) translateZ(0)}}
        @media (prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
        @keyframes maxLevelPulse {
  0%,100% { box-shadow: 0 0 15px rgba(251,191,36,0.5); }
  50%      { box-shadow: 0 0 35px rgba(251,191,36,0.95), 0 0 60px rgba(212,175,55,0.4); }
}
@keyframes vipShimmer{0%{background-position:200% center}100%{background-position:0% center}}
@keyframes vipNodePop{0%{transform:translateX(-50%) scale(0.4);opacity:0}70%{transform:translateX(-50%) scale(1.18)}100%{transform:translateX(-50%) scale(1);opacity:1}}
@keyframes vipGoldPulse{0%,100%{box-shadow:0 0 18px rgba(212,175,55,0.5),0 0 40px rgba(212,175,55,0.2)}50%{box-shadow:0 0 38px rgba(212,175,55,1),0 0 80px rgba(212,175,55,0.45)}}
@keyframes vipLockShake{0%,100%{transform:translateX(-50%) rotate(0deg)}25%{transform:translateX(-50%) rotate(-8deg)}75%{transform:translateX(-50%) rotate(8deg)}}
@keyframes vipCrownFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-5px) scale(1.08)}}
@keyframes vipBuyPulse{0%,100%{box-shadow:0 0 22px rgba(212,175,55,0.6),0 0 50px rgba(139,92,246,0.3)}50%{box-shadow:0 0 44px rgba(212,175,55,1),0 0 90px rgba(139,92,246,0.6),0 0 120px rgba(212,175,55,0.2)}}
@keyframes vipBuyShimmer{0%{left:-100%}100%{left:200%}}
@keyframes vipUnlockBurst{0%{transform:scale(0.5);opacity:1}100%{transform:scale(3);opacity:0}}
@keyframes solarRay{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
@keyframes solarSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
@keyframes vipTeaseFloat{0%,12%{transform:scale(1.22) translateY(-8px);filter:brightness(1.4) saturate(1.6) drop-shadow(0 0 28px rgba(212,175,55,1)) drop-shadow(0 0 56px rgba(212,175,55,0.8)) drop-shadow(0 0 90px rgba(212,175,55,0.4)) grayscale(0)}25%{transform:scale(1.08) translateY(-3px);filter:brightness(1.0) saturate(1.0) grayscale(0)}35%,100%{transform:scale(1) translateY(0);filter:brightness(0.2) saturate(0) grayscale(1)}}
@keyframes vipTeaseGlow{0%,100%{box-shadow:0 0 8px rgba(212,175,55,0.15)}50%{box-shadow:0 0 28px rgba(212,175,55,0.7),0 0 50px rgba(139,92,246,0.4)}}
      `}</style>

      <ParticleField/>

      {['🛠️','◈','∞','⬡','✦','⚡','◆','⊕'].map((r,i)=>(
        <div key={i} style={{position:'fixed',left:`${5+i*12}%`,top:`${10+(i%3)*28}%`,fontFamily:"'Cinzel',serif",fontSize:'clamp(14px,2.5vw,26px)',color:'rgba(212,175,55,0.04)',pointerEvents:'none',zIndex:0,animation:`runeFloat ${5+i*.7}s ease-in-out ${i*.8}s infinite`}}>{r}</div>
      ))}

      <div style={{position:'relative',zIndex:10,maxWidth:'1100px',margin:'0 auto',padding:'0 20px 120px'}}>

        {/* ══ HERO ══ */}
        <div style={{position:'relative',borderRadius:'22px',overflow:'hidden',background:'linear-gradient(145deg,rgba(124,58,237,0.22) 0%,rgba(8,3,26,0.97) 45%,rgba(2,0,12,0.99) 100%)',border:'1px solid rgba(212,175,55,0.45)',padding:'clamp(12px,2.2vw,24px)',marginTop:'clamp(6px,1.5vh,12px)',boxShadow:'0 0 0 1px rgba(212,175,55,0.08),0 40px 100px rgba(124,58,237,0.3),0 0 80px rgba(212,175,55,0.08),inset 0 1px 0 rgba(212,175,55,0.2),inset 0 -1px 0 rgba(124,58,237,0.15)'}}>
          <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:.45}}>
            <defs><linearGradient id="sl" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="transparent"/><stop offset="50%" stopColor="rgba(212,175,55,0.28)"/><stop offset="100%" stopColor="transparent"/></linearGradient></defs>
            {[18,38,62,82].map((y,i)=><line key={i} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="url(#sl)" strokeWidth="1" strokeDasharray="60 80" style={{animation:`energyLine ${8+i*2.5}s linear ${i*1.8}s infinite`}}/>)}
          </svg>

          <div style={{position:'relative',display:'flex',flexWrap:'wrap',gap:'clamp(10px,2vw,20px)',alignItems:'center'}}>
            {/* Avatar */}
            <div style={{position:'relative',flexShrink:0}}>
              <div style={{width:'clamp(58px,8vw,80px)',height:'clamp(58px,8vw,80px)',borderRadius:'50%',border:'2px solid rgba(212,175,55,0.4)',animation:'avatarPulse 3.5s ease-in-out infinite',background:'linear-gradient(135deg,rgba(124,58,237,0.28),rgba(212,175,55,0.14))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(28px,5.5vw,42px)',position:'relative',overflow:'hidden'}}>
                <img src={maestroImg} alt="Maestro" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>
                  <circle cx="50%" cy="50%" r="48%" fill="none" stroke="rgba(212,175,55,0.25)" strokeWidth="1" strokeDasharray="6 5" style={{animation:'ringRotate 10s linear infinite',transformOrigin:'center',transformBox:'fill-box'}}/>
                  <circle cx="50%" cy="50%" r="40%" fill="none" stroke="rgba(192,192,192,0.18)" strokeWidth="1" strokeDasharray="3 7" style={{animation:'ringRotate 15s linear reverse infinite',transformOrigin:'center',transformBox:'fill-box'}}/>
                </svg>
              </div>
              <div style={{position:'absolute',bottom:'-4px',right:'-4px',width:'34px',height:'34px',borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#d4af37)',border:'2px solid rgba(2,0,12,1)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cinzel',serif",fontSize:'12px',fontWeight:'900',boxShadow:'0 0 18px rgba(212,175,55,0.65)'}}>{user.level}</div>
            </div>

            {/* Info */}
            <div style={{flex:1,minWidth:'200px'}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'4px',color:'rgba(212,175,55,0.45)',marginBottom:'4px',display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{width:'28px',height:'1px',background:'rgba(212,175,55,0.28)'}}/>
                INICIADO EN {user.joinDate||'EL TEMPLO'}
              </div>
              <h1 style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(16px,2.8vw,24px)',fontWeight:'900',lineHeight:1.05,letterSpacing:'.05em',background:'linear-gradient(135deg,#f0c040 0%,#d4af37 35%,#fff8dc 55%,#d4af37 100%)',backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',animation:'goldShimmer 4s linear infinite',marginBottom:'2px'}}>{user.name}</h1>
              <div style={{fontFamily:"'Raleway',sans-serif",fontSize:'10px',color:'rgba(200,185,240,0.35)',letterSpacing:'2px',marginBottom:'6px'}}>{user.username}</div>

              {userId && (
                <div style={{marginBottom:'6px'}}>
                  <LocationCorrector userId={userId} />
                </div>
              )}

              <div style={{display:'flex',gap:'clamp(8px,1.8vw,18px)',flexWrap:'wrap',marginBottom:'10px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'6px',marginLeft:'-8px'}}>
                  <div style={{position:'relative',width:'32px',height:'32px',borderRadius:'50%',background:'none',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',boxShadow:'0 0 18px rgba(212,175,55,0.4)',animation:'coinBounce 3s ease-in-out infinite'}}>
  🪙
  <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'linear-gradient(135deg,transparent 0%,rgba(255,255,255,0.15) 50%,transparent 100%)',backgroundSize:'200% 200%',animation:'silverSweep 2s ease-in-out infinite'}}/>
  <div style={{position:'absolute',inset:'-8px',borderRadius:'50%',border:'1px solid rgba(212,175,55,0.3)',animation:'ringRotate 4s linear infinite'}}/>
  <div style={{position:'absolute',inset:'-16px',borderRadius:'50%',border:'1px dashed rgba(212,175,55,0.15)',animation:'ringRotate 7s linear reverse infinite'}}/>
</div>
                  <div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(14px,2.1vw,19px)',fontWeight:'900',color:'#d4af37',textShadow:'0 0 22px rgba(212,175,55,1)',lineHeight:1}}>{user.propocoins.toLocaleString()}</div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:'6px',letterSpacing:'2.5px',color:'rgba(212,175,55,0.95)'}}>PROPOCOINS</div>
                  </div>
                </div>
                {[{v:arsenalItems.length,l:'HERRAMIENTAS',c:'#8b5cf6',icon:'🛠️'},{v:achievements.filter(a=>a.unlocked).length,l:'LOGROS',c:'#06b6d4',icon:'🏆'}].map((s,i)=>(
  <div key={i} style={{display:'flex',alignItems:'center',gap:'6px',padding:'0 12px',borderLeft:'1px solid rgba(255,255,255,0.06)'}}>
    <div style={{width:'28px',height:'28px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',boxShadow:`0 0 18px ${s.c}66`,border:`1px solid ${s.c}44`,background:`radial-gradient(ellipse at 30% 25%,${s.c}22 0%,transparent 70%)`}}>{s.icon}</div>
    <div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(14px,2.1vw,19px)',fontWeight:'900',color:s.c,textShadow:`0 0 22px ${s.c}`,lineHeight:1}}>{s.v}</div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:'6px',letterSpacing:'2.5px',color:s.c,opacity:.95}}>{s.l}</div>
    </div>
  </div>
))}
              </div>

              <XPBar xp={user.xp} xpMax={user.xpToNext} level={user.level} userId={userId}/>
              <MembershipCard />
              <RenewalRopeNudge onShareClick={() => allianceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} />
              <TemploWeeklyPlan />

              {/* Overlay decorativo: oscurece visualmente pero deja pasar scroll y clics —
                  el único cierre real es picarle a "VER TODO" dentro de ReferralBattlePass */}
              {allianceHighlight && (
                <div style={{ position: "fixed", inset: 0, zIndex: 99990, background: "rgba(5,2,10,0.82)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", pointerEvents: "none" }} />
              )}

              <div ref={allianceRef}>
                <ReferralBattlePass highlightPulse={allianceHighlight} onVerTodoClick={dismissAllianceHighlight} />
              </div>

              {/* ── QR ALIANZA ── */}
              {profile?.referral_code && (
                <div style={{ margin: "6px 0 4px", padding: "16px 16px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: "8px", fontWeight: "700", letterSpacing: "0.18em", color: "rgba(167,139,250,0.6)", textTransform: "uppercase" }}>Tu QR de Alianza</div>
                  <div style={{ padding: "10px", background: "#fff", borderRadius: "12px", boxShadow: "0 0 32px rgba(124,58,237,0.4)" }}>
                    <QRCodeSVG
                      value={`https://templodelpropositooficial.netlify.app/?ref=${profile.referral_code}`}
                      size={128}
                      bgColor="#ffffff"
                      fgColor="#1a0a2e"
                      level="M"
                    />
                  </div>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: "9px", color: "rgba(167,139,250,0.55)", letterSpacing: "0.14em", textAlign: "center", textTransform: "uppercase" }}>
                    Escanea · primer mes $1 · código <span style={{ color: "#a78bfa", fontWeight: "900" }}>{profile.referral_code}</span>
                  </div>
                  <button
                    onClick={() => { if (navigator.share) navigator.share({ text: `Entra al Templo del Propósito — primer mes $1. Código: ${profile.referral_code}`, url: `https://templodelpropositooficial.netlify.app/?ref=${profile.referral_code}` }); else navigator.clipboard?.writeText(`https://templodelpropositooficial.netlify.app/?ref=${profile.referral_code}`); }}
                    style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: "10px", padding: "10px 22px", fontFamily: "'Cinzel',serif", fontSize: "9px", fontWeight: "700", color: "#60a5fa", cursor: "pointer", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Compartir link
                  </button>
                </div>
              )}
              {userIdReady && (
                <VipRuleta
                  isVip={vipStatus}
                  userLevel={user.level}
                  userId={userId}
                  onBuyVip={() => setShowPropoPassModal(true)}
                  onPrizeWon={(prize) => console.log('Ganó:', prize)}
                />
              )}
            </div>

            {user.isAdmin&&(
              <button onClick={()=>setShowAdmin(true)} onMouseEnter={()=>setAdminHov(true)} onMouseLeave={()=>setAdminHov(false)} style={{position:'absolute',top:0,right:0,padding:'6px 13px',borderRadius:'18px',background:adminHov?'rgba(212,175,55,0.14)':'rgba(212,175,55,0.05)',border:'1px solid rgba(212,175,55,0.28)',color:'rgba(212,175,55,0.65)',fontFamily:"'Cinzel',serif",fontSize:'7px',letterSpacing:'2px',cursor:'pointer',transition:'all .3s ease',boxShadow:adminHov?'0 0 18px rgba(212,175,55,0.28)':'none'}}>⚙ ADMIN</button>
            )}
          </div>
        </div>

        {/* ══ REWARDS ══ */}
        <Divider icon="🏆" label="RECOMPENSAS DE NIVEL"/>
        {showPropoPassModal && (
          <PropoPassModal onClose={() => setShowPropoPassModal(false)} />
        )}
        <RewardsSection
          rewards={rewards}
          vipLevels={vipLevels}
          userLevel={user.level}
          userId={userId}
          userXP={user.xp}
          isVip={vipStatus}
          onBuyVip={() => setShowPropoPassModal(true)}
        />

        {/* ══ 4 SPHERES + ARSENAL CARDS ══ */}
        <Divider icon="◈" label="MI ARSENAL"/>

        {/* Sphere row */}
        <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:'clamp(8px,3vw,50px)',flexWrap:'wrap',padding:'0 10px',marginBottom:'12px'}}>
          {CONTENT_TYPES.map((t,i)=>(
            <EnergySphere key={t.id} type={t} isActive={activeFilter===t.id} onClick={()=>handleSphereClick(t.id)} index={i}/>
          ))}
        </div>

        {/* Hint */}
        {!activeFilter&&(
          <div style={{textAlign:'center',padding:'32px 20px',animation:'fadeIn .7s ease'}}>
  <div style={{fontSize:'32px',marginBottom:'14px',filter:'drop-shadow(0 0 18px rgba(212,175,55,0.8))',animation:'coinBounce 3s ease-in-out infinite'}}>✦</div>
  <div style={{fontFamily:"'Cinzel',serif",fontSize:'13px',letterSpacing:'5px',marginBottom:'10px',background:'linear-gradient(135deg,#f0c040,#d4af37,#fde68a,#d4af37)',backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',animation:'goldShimmer 3s linear infinite'}}>
    SELECCIONA UNA ESFERA
  </div>
  <div style={{fontFamily:"'Raleway',sans-serif",fontSize:'11px',letterSpacing:'2px',color:'rgba(200,185,240,0.55)',marginBottom:'18px'}}>
    para revelar tu arsenal
  </div>
  <div style={{display:'flex',justifyContent:'center',gap:'8px'}}>
    {['◈','⚔','⚡','⬡'].map((ic,i)=>(
      <span key={i} style={{fontSize:'16px',color:'rgba(212,175,55,0.3)',animation:`glowPulse 2s ease-in-out ${i*.4}s infinite`}}>{ic}</span>
    ))}
  </div>
</div>
        )}

        {/* Cards */}
        {activeFilter&&(
          <div key={cardsKey} style={{animation:'cardsIn .45s ease',marginTop:'28px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginBottom:'22px'}}>
              <div style={{width:'30px',height:'1px',background:'linear-gradient(to right,transparent,rgba(212,175,55,0.4))'}}/>
              <span style={{fontFamily:"'Cinzel',serif",fontSize:'9px',letterSpacing:'3px',color:'rgba(212,175,55,0.6)'}}>{filteredItems.length} HERRAMIENTA{filteredItems.length!==1?'S':''} · {CONTENT_TYPES.find(t=>t.id===activeFilter)?.label}</span>
              <div style={{width:'30px',height:'1px',background:'linear-gradient(to left,transparent,rgba(212,175,55,0.4))'}}/>
            </div>
            {filteredItems.length>0?(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(clamp(220px,28vw,300px),1fr))',gap:'clamp(12px,2.5vw,22px)'}}>
                {filteredItems.map((item,idx)=><ArsenalCard key={item.id} item={item} delay={idx*.06} onClick={setSelectedArsenalItem}/>)}
              </div>
            ):(
              <div style={{textAlign:'center',padding:'60px 20px',borderRadius:'18px',background:'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(212,175,55,0.05))',border:'1px dashed rgba(212,175,55,0.3)'}}>
                <div style={{fontSize:'38px',marginBottom:'14px',opacity:.7,filter:'drop-shadow(0 0 12px rgba(212,175,55,0.5))'}}>◈</div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:'11px',letterSpacing:'3px',color:'rgba(212,175,55,0.75)',marginBottom:'10px'}}>{activeFilter==='todos'?'Tu arsenal está vacío':'Sin herramientas en esta categoría'}</div>
                <div style={{fontFamily:"'Raleway',sans-serif",fontSize:'10px',color:'rgba(200,185,240,0.55)',letterSpacing:'1px',marginBottom:'18px'}}>Visita la Tienda del Templo para canjear con Propocoins</div>
                <button 
  onClick={()=>window.location.href='/store'}
  onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 0 40px rgba(212,175,55,0.5),0 0 80px rgba(139,92,246,0.3)';e.currentTarget.style.borderColor='rgba(212,175,55,0.9)';}}
  onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 0 20px rgba(212,175,55,0.2),0 0 40px rgba(139,92,246,0.15)';e.currentTarget.style.borderColor='rgba(212,175,55,0.5)';}}
  style={{
    padding:'12px 32px',
    borderRadius:'100px',
    background:'linear-gradient(135deg,rgba(212,175,55,0.12) 0%,rgba(124,58,237,0.18) 50%,rgba(212,175,55,0.08) 100%)',
    border:'1px solid rgba(212,175,55,0.5)',
    color:'#fde68a',
    fontFamily:"'Cinzel',serif",
    fontSize:'8.5px',
    letterSpacing:'3px',
    cursor:'pointer',
    boxShadow:'0 0 20px rgba(212,175,55,0.2),0 0 40px rgba(139,92,246,0.15)',
    backdropFilter:'blur(10px)',
    transition:'all .4s ease',
    position:'relative',
    overflow:'hidden',
  }}>
  <span style={{position:'relative',zIndex:1}}>✦ IR A LA TIENDA ›</span>
  <div style={{position:'absolute',inset:0,borderRadius:'100px',background:'linear-gradient(135deg,transparent 0%,rgba(255,255,255,0.06) 50%,transparent 100%)',backgroundSize:'200% 200%',animation:'silverSweep 2.5s ease-in-out infinite'}}/>
</button>
              </div>
            )}
          </div>
        )}

        {/* ══ MIS PACKS ══ */}
        {(pack1Active || pack2Active) && (() => {
          const abrirPack = async (fileName) => {
            setPackIframeLoading(true);
            setPackIframeSrc('');
            setPackViewOpen(true);
            const { data, error } = await supabase.storage
              .from('paquetes')
              .createSignedUrl(fileName, 3600);
            if (error || !data?.signedUrl) {
              setPackIframeLoading(false);
              setPackViewOpen(false);
              return;
            }
            const res = await fetch(data.signedUrl);
            const html = await res.text();
            setPackIframeSrc(html);
            setPackIframeLoading(false);
          };

          return (
            <>
              <Divider icon="⚡" label="MIS PACKS"/>
              <div style={{
                borderRadius: '20px',
                background: 'linear-gradient(145deg,rgba(212,175,55,0.08) 0%,rgba(8,3,26,0.97) 100%)',
                border: '1px solid rgba(212,175,55,0.35)',
                padding: 'clamp(20px,4vw,36px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:'8px', letterSpacing:'4px', color:'rgba(212,175,55,0.5)', marginBottom:'4px' }}>
                  ✦ CONTENIDO DESBLOQUEADO · ACCESO ILIMITADO
                </div>

                {pack1Active && (
                  <button
                    onClick={() => abrirPack('paquete1.html')}
                    disabled={packIframeLoading}
                    style={{
                      display:'flex', alignItems:'center', gap:'14px',
                      padding:'clamp(16px,2.5vw,20px) clamp(18px,3vw,28px)',
                      borderRadius:'14px', cursor:'pointer',
                      background:'linear-gradient(135deg,rgba(212,175,55,0.12),rgba(212,175,55,0.05))',
                      border:'1px solid rgba(212,175,55,0.45)',
                      boxShadow:'0 0 24px rgba(212,175,55,0.1)',
                      transition:'all .25s ease',
                      textAlign:'left',
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(212,175,55,0.8)';e.currentTarget.style.boxShadow='0 0 36px rgba(212,175,55,0.25)';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(212,175,55,0.45)';e.currentTarget.style.boxShadow='0 0 24px rgba(212,175,55,0.1)';}}
                  >
                    <div style={{width:'48px',height:'48px',borderRadius:'12px',flexShrink:0,background:'linear-gradient(135deg,rgba(212,175,55,0.25),rgba(212,175,55,0.1))',border:'1px solid rgba(212,175,55,0.5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',boxShadow:'0 0 16px rgba(212,175,55,0.3)'}}>⚡</div>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(11px,2vw,14px)',fontWeight:900,color:'#fde68a',marginBottom:'4px',letterSpacing:'1px'}}>Paquete 1 — Crea con IA</div>
                      <div style={{fontFamily:"'Raleway',sans-serif",fontSize:'11px',color:'rgba(200,185,240,0.45)'}}>Convierte Ideas en Herramientas · Acceso completo</div>
                    </div>
                    <div style={{color:'rgba(212,175,55,0.6)',fontSize:'22px',flexShrink:0}}>›</div>
                  </button>
                )}

                {pack2Active && (
                  <button
                    onClick={() => abrirPack('paquete2.html')}
                    disabled={packIframeLoading}
                    style={{
                      display:'flex', alignItems:'center', gap:'14px',
                      padding:'clamp(16px,2.5vw,20px) clamp(18px,3vw,28px)',
                      borderRadius:'14px', cursor:'pointer',
                      background:'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(124,58,237,0.05))',
                      border:'1px solid rgba(124,58,237,0.45)',
                      boxShadow:'0 0 24px rgba(124,58,237,0.1)',
                      transition:'all .25s ease',
                      textAlign:'left',
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(124,58,237,0.8)';e.currentTarget.style.boxShadow='0 0 36px rgba(124,58,237,0.25)';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(124,58,237,0.45)';e.currentTarget.style.boxShadow='0 0 24px rgba(124,58,237,0.1)';}}
                  >
                    <div style={{width:'48px',height:'48px',borderRadius:'12px',flexShrink:0,background:'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(124,58,237,0.1))',border:'1px solid rgba(124,58,237,0.5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',boxShadow:'0 0 16px rgba(124,58,237,0.3)'}}>⚜️</div>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(11px,2vw,14px)',fontWeight:900,color:'#a78bfa',marginBottom:'4px',letterSpacing:'1px'}}>Paquete 2 — Domina y Edita</div>
                      <div style={{fontFamily:"'Raleway',sans-serif",fontSize:'11px',color:'rgba(200,185,240,0.45)'}}>Construye Sin Límites · Acceso completo</div>
                    </div>
                    <div style={{color:'rgba(124,58,237,0.6)',fontSize:'22px',flexShrink:0}}>›</div>
                  </button>
                )}
              </div>

              {packViewOpen && (
                <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(2,0,12,0.97)',display:'flex',flexDirection:'column'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderBottom:'1px solid rgba(212,175,55,0.15)',flexShrink:0}}>
                    <button
                      onClick={()=>{setPackViewOpen(false);setPackIframeSrc('');}}
                      style={{background:'rgba(212,175,55,0.07)',border:'1px solid rgba(212,175,55,0.2)',color:'rgba(212,175,55,0.7)',fontFamily:"'Cinzel',serif",fontSize:'9px',letterSpacing:'2px',padding:'8px 18px',borderRadius:'8px',cursor:'pointer',textTransform:'uppercase'}}
                    >← Volver</button>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'3px',color:'rgba(212,175,55,0.3)'}}>◈ CONTENIDO EXCLUSIVO · TEMPLO DEL PROPÓSITO</div>
                  </div>
                  <div style={{flex:1,position:'relative'}}>
                    {packIframeLoading && (
                      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(2,0,12,0.95)',fontFamily:"'Cinzel',serif",fontSize:'11px',letterSpacing:'3px',color:'rgba(212,175,55,0.45)'}}>
                        Cargando contenido...
                      </div>
                    )}
                    <iframe
                      srcDoc={packIframeSrc}
                      style={{width:'100%',height:'100%',border:'none',display:'block'}}
                      title="Contenido Exclusivo"
                    />
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* ══ BUZÓN DEL TEMPLO ══ */}
        <Divider icon="💬" label="BUZÓN DEL TEMPLO"/>
        <TempleBuzon userId={userId} />

        {/* ══ REPORTES ══ */}
        <Divider icon="🚨" label="REPORTAR UN PROBLEMA"/>
        <TempleReportes userId={userId} />

        {/* ══ LOGROS ══ */}
        <Divider icon="✦" label="LOGROS DEL TEMPLO"/>
        <AchievementsSection achievements={achievements} onSelectAch={setSelectedAch}/>

      </div>

      {selectedAch&&<AchievementModal ach={selectedAch} onClose={()=>setSelectedAch(null)}/>}
      {selectedArsenalItem&&<ModuleIntroView item={selectedArsenalItem} onClose={()=>setSelectedArsenalItem(null)} onActivate={null} alreadyActivated={true}/>}
      {showAdmin&&user.isAdmin&&<AdminPanel rewards={rewards} achievements={achievements} onUpdateRewards={setRewards} onUpdateAchievements={setAchievements} onClose={()=>setShowAdmin(false)}/>}
    </div>
  );
}