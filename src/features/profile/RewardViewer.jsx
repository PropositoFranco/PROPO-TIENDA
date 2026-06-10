/**
 * RewardViewer.jsx
 * Todo en un solo return — sin desmontajes ni redirecciones.
 * El contenido (storage/url) se muestra inline con display:none/flex.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlayerStore } from '../../store/usePlayerStore';

const STORAGE_BUCKET = 'level-rewards';

function getRarity(level) {
  if (level >= 6) return { label: 'PROPOMASTER',  color: '#ffd700', glow: 'rgba(255,215,0,0.9)',   bg: 'rgba(255,215,0,0.08)',   border: 'rgba(255,215,0,0.6)'   };
  if (level >= 5) return { label: 'DOMINANTE',    color: '#ff4444', glow: 'rgba(255,68,68,0.9)',   bg: 'rgba(255,68,68,0.08)',   border: 'rgba(255,68,68,0.6)'   };
  if (level >= 4) return { label: 'CONQUISTADOR', color: '#ff9800', glow: 'rgba(255,152,0,0.9)',   bg: 'rgba(255,152,0,0.08)',   border: 'rgba(255,152,0,0.6)'   };
  if (level >= 3) return { label: 'FORJADOR',     color: '#8b5cf6', glow: 'rgba(139,92,246,0.9)',  bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.6)'  };
  if (level >= 2) return { label: 'RECLUTA',      color: '#38bdf8', glow: 'rgba(56,189,248,0.9)',  bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.6)'  };
  return                 { label: 'DESPERTAR',    color: '#4ade80', glow: 'rgba(74,222,128,0.85)', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.6)'  };
}

function ParticleField({ color }) {
  const cv = useRef(null);
  const st = useRef({ p: [], raf: null });
  const drw = useCallback(() => {
    const c = cv.current; if (!c) return;
    const ctx = c.getContext('2d');
    const { width: W, height: H } = c;
    const s = st.current;
    if (!s.p.length) {
      for (let i = 0; i < 120; i++) {
        const pk = Math.random();
        s.p.push({ x: Math.random()*W, y: Math.random()*H, sz: Math.random()*1.6+0.2, sp: Math.random()*0.18+0.03, o: Math.random()*0.45+0.06, col: pk>0.6?'#d4af37':pk>0.35?color:'#fff', ph: Math.random()*Math.PI*2, ps: Math.random()*0.01+0.003, dx: (Math.random()-0.5)*0.15 });
      }
    }
    ctx.clearRect(0,0,W,H);
    s.p.forEach(p => {
      p.y-=p.sp; p.x+=p.dx; p.ph+=p.ps;
      if(p.y<-4){p.y=H+4;p.x=Math.random()*W;} if(p.x<-4)p.x=W+4; if(p.x>W+4)p.x=-4;
      ctx.globalAlpha=p.o*(0.6+Math.sin(p.ph)*0.4); ctx.fillStyle=p.col; ctx.beginPath(); ctx.arc(p.x,p.y,p.sz,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1; s.raf=requestAnimationFrame(drw);
  }, [color]);
  useEffect(() => {
    const c=cv.current; if(!c) return;
    const rz=()=>{c.width=c.offsetWidth;c.height=c.offsetHeight;st.current.p=[];};
    rz(); window.addEventListener('resize',rz); st.current.raf=requestAnimationFrame(drw);
    return ()=>{cancelAnimationFrame(st.current.raf);window.removeEventListener('resize',rz);};
  }, [drw]);
  return <canvas ref={cv} style={{position:'fixed',inset:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none'}}/>;
}

export default function RewardViewer() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
  const { level: userLevel } = usePlayerStore();

  const [reward, setReward]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [claimed, setClaimed]     = useState(false);
  const [entered, setEntered]     = useState(false);

  // Storage blob
  const [blobHtml, setBlobHtml]   = useState(null);
  const [blobLoading, setBlobLoading] = useState(false);
  const [blobError, setBlobError] = useState(null);
  const blobRef = useRef(null);

  // ── Cargar reward ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase.from('level_rewards').select('*').eq('is_active',true).ilike('reward_value',`%${slug}`).maybeSingle();
      if (data) { setReward(data); setLoading(false); return; }
      const { data: all } = await supabase.from('level_rewards').select('*').eq('is_active',true).order('level');
      const match = all?.find(r => r.reward_value?.endsWith(slug) || r.title?.toLowerCase().replace(/\s+/g,'-')===slug);
      setReward(match||null); setLoading(false);
    })();
  }, [slug]);

  // ── Check claimed ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!reward||!user?.id) return;
    supabase.from('user_rewards').select('id').eq('user_id',user.id).eq('reward_id',reward.id).maybeSingle().then(({data})=>{
      if (data) {
        setClaimed(true);
        // Si ya reclamó y tiene contenido, abrir directo
        if (reward.content_url && reward.content_type && reward.content_type !== 'route') {
          setShowContent(true);
          if (reward.content_type === 'storage') {
            loadBlob(reward.content_url);
          }
        }
      }
    });
  }, [reward, user]);

  // ── Entrada ────────────────────────────────────────────────────────────────
  useEffect(() => { const t=setTimeout(()=>setEntered(true),100); return ()=>clearTimeout(t); }, []);

  // ── Ruta interna ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (reward?.content_type==='route' && reward?.content_url) navigate(reward.content_url,{replace:true});
  }, [reward, navigate]);

  // ── Cargar blob cuando se pide abrir (storage) ─────────────────────────────
  const loadBlob = useCallback(async (fileName) => {
    setBlobLoading(true); setBlobError(null);
    try {
      const { data, error: signErr } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(fileName, 3600);
      if (signErr) throw signErr;
      const res = await fetch(data.signedUrl);
      if (!res.ok) throw new Error('No se pudo descargar el contenido');
      const html = await res.text();
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
      const blob = new Blob([html],{type:'text/html'});
      blobRef.current = URL.createObjectURL(blob);
      setBlobHtml(html);
    } catch(err) {
      setBlobError(err.message||'Error al cargar');
    } finally {
      setBlobLoading(false);
    }
  }, []);

  useEffect(() => { return ()=>{ if(blobRef.current) URL.revokeObjectURL(blobRef.current); }; }, []);

  const handleOpen = () => {
    setShowContent(true);
    if (reward?.content_type==='storage' && reward?.content_url && !blobHtml) {
      loadBlob(reward.content_url);
    }
  };

  // ── Estados de carga/error globales ───────────────────────────────────────
  if (loading) return (
    <div style={{minHeight:'100dvh',background:'#02000c',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:'48px',height:'48px',border:'3px solid rgba(212,175,55,0.2)',borderTopColor:'#d4af37',borderRadius:'50%',animation:'rvSpin 0.8s linear infinite',margin:'0 auto 16px'}}/>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:'10px',letterSpacing:'4px',color:'rgba(212,175,55,0.5)'}}>CARGANDO RECOMPENSA</div>
      </div>
      <style>{`@keyframes rvSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!reward) return (
    <div style={{minHeight:'100dvh',background:'#02000c',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'20px'}}>
      <div style={{fontSize:'48px'}}>🔒</div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:'16px',color:'rgba(212,175,55,0.6)',letterSpacing:'3px'}}>RECOMPENSA NO ENCONTRADA</div>
      <button onClick={()=>navigate('/profile')} style={{padding:'10px 28px',border:'1px solid rgba(212,175,55,0.4)',borderRadius:'100px',color:'rgba(212,175,55,0.7)',fontFamily:"'Cinzel',serif",fontSize:'9px',letterSpacing:'2px',background:'none',cursor:'pointer'}}>← VOLVER AL TEMPLO</button>
      <style>{`@keyframes rvSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const rarity     = getRarity(reward.level);
  const unlocked   = (userLevel??0) >= reward.level;
  const hasContent = reward.content_url && reward.content_type && reward.content_type !== 'route';

  return (
    <div style={{position:'relative',width:'100%',height:'100dvh',overflow:'hidden',background:'#02000c'}}>
      <style>{`
        @keyframes rvSpin       { to{transform:rotate(360deg)} }
        @keyframes rvGoldShim   { 0%{background-position:200% center} 100%{background-position:0% center} }
        @keyframes rvPulse      { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes rvRing       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes rvFloat      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes rvRune       { 0%,100%{opacity:.03;transform:translateY(0) rotate(0deg)} 50%{opacity:.07;transform:translateY(-18px) rotate(8deg)} }
        @keyframes rvSweep      { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes rvCrownFloat { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-8px) rotate(3deg)} }
      `}</style>

      {/* ── CAPA PRESENTACIÓN (siempre montada, oculta cuando showContent) ── */}
      <div style={{
        position:'absolute', inset:0,
        overflowY:'auto',
        background:`radial-gradient(ellipse at 20% 20%,${rarity.color}0a 0%,transparent 50%),
                    radial-gradient(ellipse at 80% 80%,rgba(124,58,237,0.08) 0%,transparent 50%),
                    linear-gradient(180deg,#02000c 0%,#060018 40%,#080020 70%,#02000c 100%)`,
        opacity: showContent ? 0 : 1,
        pointerEvents: showContent ? 'none' : 'auto',
        transition: 'opacity 0.3s ease',
        zIndex: 1,
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Raleway:wght@300;400;600&family=Crimson+Text:ital,wght@0,400;1,400&display=swap" rel="stylesheet"/>

        <ParticleField color={rarity.color}/>

        {['◈','✦','⚔','⬡','◆','∞'].map((r,i)=>(
          <div key={i} style={{position:'fixed',left:`${8+i*15}%`,top:`${12+(i%3)*26}%`,fontFamily:"'Cinzel',serif",fontSize:'clamp(18px,3vw,32px)',color:'rgba(212,175,55,0.03)',pointerEvents:'none',zIndex:0,animation:`rvRune ${5+i*0.8}s ease-in-out ${i*0.9}s infinite`}}>{r}</div>
        ))}
        <div style={{position:'fixed',top:'15%',left:'10%',width:'400px',height:'400px',borderRadius:'50%',background:`radial-gradient(circle,${rarity.color}06 0%,transparent 70%)`,pointerEvents:'none',zIndex:0}}/>
        <div style={{position:'fixed',bottom:'20%',right:'8%',width:'300px',height:'300px',borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,0.06) 0%,transparent 70%)',pointerEvents:'none',zIndex:0}}/>

        <div style={{position:'relative',zIndex:10,maxWidth:'780px',margin:'0 auto',padding:'clamp(16px,4vw,40px) clamp(16px,4vw,32px) clamp(60px,10vw,100px)'}}>

          {/* Nav superior */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'clamp(24px,5vw,48px)',opacity:entered?1:0,transform:entered?'translateY(0)':'translateY(-16px)',transition:'all 0.5s ease'}}>
            <button onClick={()=>navigate('/profile')} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 20px',borderRadius:'100px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(200,185,240,0.6)',fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'2px',cursor:'pointer',transition:'all 0.25s ease'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=rarity.border;e.currentTarget.style.color=rarity.color;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';e.currentTarget.style.color='rgba(200,185,240,0.6)';}}>
              ← VOLVER AL TEMPLO
            </button>
            <div style={{padding:'4px 16px',borderRadius:'100px',background:rarity.bg,border:`1px solid ${rarity.border}`,fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'3px',color:rarity.color,boxShadow:`0 0 16px ${rarity.glow}`,animation:'rvPulse 2.5s ease-in-out infinite'}}>
              ⚔ {rarity.label} · NV.{reward.level}
            </div>
          </div>

          {/* Hero card */}
          <div style={{position:'relative',borderRadius:'28px',overflow:'hidden',background:`linear-gradient(145deg,${rarity.color}14 0%,rgba(8,3,26,0.97) 45%,rgba(2,0,12,0.99) 100%)`,border:`1px solid ${rarity.border}`,boxShadow:`0 0 80px ${rarity.glow.replace('0.9','0.2')},inset 0 1px 0 ${rarity.color}22`,padding:'clamp(28px,5vw,56px) clamp(24px,4vw,48px)',marginBottom:'28px',opacity:entered?1:0,transform:entered?'scale(1)':'scale(0.94)',transition:'all 0.6s cubic-bezier(0.34,1.1,0.64,1) 0.1s'}}>
            <div style={{position:'absolute',inset:0,borderRadius:'28px',background:`linear-gradient(135deg,transparent 0%,${rarity.color}0a 45%,rgba(255,255,255,0.04) 50%,${rarity.color}0a 55%,transparent 100%)`,backgroundSize:'200% 200%',animation:'rvSweep 4s ease-in-out infinite',pointerEvents:'none'}}/>
            <div style={{position:'absolute',top:0,left:'8%',right:'8%',height:'2px',background:`linear-gradient(90deg,transparent,${rarity.color},rgba(255,255,255,0.6),${rarity.color},transparent)`,borderRadius:'0 0 999px 999px',animation:'rvPulse 3s ease-in-out infinite'}}/>
            {['◈','✦','◆','⬡'].map((r,i)=>(
              <div key={i} style={{position:'absolute',top:i<2?'18px':'auto',bottom:i>=2?'18px':'auto',left:i%2===0?'20px':'auto',right:i%2!==0?'20px':'auto',fontFamily:"'Cinzel',serif",fontSize:'14px',color:rarity.color,opacity:0.25,animation:`rvPulse ${2.2+i*0.5}s ease-in-out ${i*0.4}s infinite`}}>{r}</div>
            ))}

            <div style={{display:'flex',alignItems:'center',gap:'clamp(24px,4vw,48px)',flexWrap:'wrap'}}>
              {/* Orbe ícono */}
              <div style={{position:'relative',flexShrink:0}}>
                {[80,100,122].map((sz,i)=>(
                  <div key={i} style={{position:'absolute',top:'50%',left:'50%',width:`${sz}px`,height:`${sz}px`,marginLeft:`-${sz/2}px`,marginTop:`-${sz/2}px`,borderRadius:'50%',border:`1px solid ${rarity.color}${i===0?'44':i===1?'22':'11'}`,animation:`rvRing ${8+i*4}s linear ${i%2===1?'reverse':''} infinite`}}/>
                ))}
                <div style={{width:'clamp(80px,12vw,108px)',height:'clamp(80px,12vw,108px)',borderRadius:'50%',background:`radial-gradient(ellipse at 30% 25%,${rarity.color}44 0%,${rarity.color}18 50%,transparent 100%)`,border:`2px solid ${rarity.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(36px,6vw,52px)',boxShadow:`0 0 50px ${rarity.glow},0 0 100px ${rarity.glow.replace('0.9','0.3')},inset 0 0 30px ${rarity.color}18`,animation:'rvFloat 4s ease-in-out infinite',position:'relative',zIndex:1}}>
                  <span style={{filter:`drop-shadow(0 0 16px ${rarity.glow})`}}>{reward.icon_emoji||'🎁'}</span>
                </div>
              </div>

              {/* Info */}
              <div style={{flex:1,minWidth:'200px'}}>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(6px,1.2vw,8px)',letterSpacing:'5px',color:`${rarity.color}88`,marginBottom:'8px'}}>⚔ RECOMPENSA DEL PASE BATALLA · NIVEL {reward.level}</div>
                <h1 style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(26px,5vw,48px)',fontWeight:900,lineHeight:1.05,letterSpacing:'.04em',background:`linear-gradient(135deg,${rarity.color} 0%,#fff8dc 45%,${rarity.color} 100%)`,backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',animation:'rvGoldShim 4s linear infinite',marginBottom:'12px'}}>{reward.title}</h1>
                <p style={{fontFamily:"'Crimson Text',serif",fontSize:'clamp(14px,2.5vw,18px)',color:'rgba(220,210,255,0.65)',lineHeight:1.7,marginBottom:'24px'}}>{reward.description}</p>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                  {reward.bonus_propocoins>0 && <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 14px',borderRadius:'100px',background:'rgba(212,175,55,0.1)',border:'1px solid rgba(212,175,55,0.35)',fontFamily:"'Cinzel',serif",fontSize:'10px',color:'#fde68a',fontWeight:700}}>🪙 +{reward.bonus_propocoins} PropoCoins</div>}
                  {reward.bonus_exp>0 && <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 14px',borderRadius:'100px',background:rarity.bg,border:`1px solid ${rarity.border}`,fontFamily:"'Cinzel',serif",fontSize:'10px',color:rarity.color,fontWeight:700}}>⭐ +{reward.bonus_exp} XP</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Sección acción */}
          <div style={{opacity:entered?1:0,transform:entered?'translateY(0)':'translateY(24px)',transition:'all 0.6s ease 0.3s'}}>

            {!hasContent && (
            <div style={{borderRadius:'20px',padding:'clamp(28px,4vw,48px)',background:`linear-gradient(135deg,${rarity.color}10 0%,rgba(8,3,26,0.98) 100%)`,border:`1px solid ${rarity.border}`,textAlign:'center',boxShadow:`0 0 60px ${rarity.glow.replace('0.9','0.15')}`}}>
              {claimed ? (
                <>
                  <div style={{fontSize:'56px',marginBottom:'16px',filter:`drop-shadow(0 0 24px ${rarity.glow})`,animation:'rvFloat 3s ease-in-out infinite'}}>✅</div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(14px,2.5vw,20px)',fontWeight:900,letterSpacing:'4px',color:rarity.color,marginBottom:'12px',textShadow:`0 0 20px ${rarity.glow}`}}>⚔ RECOMPENSA RECLAMADA ⚔</div>
                  <div style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'6px 20px',borderRadius:'100px',background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.5)',marginBottom:'16px'}}>
                    <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'#4ade80',boxShadow:'0 0 10px #4ade80',animation:'rvPulse 1.5s ease-in-out infinite'}}/>
                    <span style={{fontFamily:"'Cinzel',serif",fontSize:'10px',letterSpacing:'2px',color:'#4ade80',fontWeight:700}}>NIVEL {reward.level} COMPLETADO</span>
                  </div>
                  <p style={{fontFamily:"'Crimson Text',serif",fontSize:'clamp(14px,2.5vw,17px)',color:'rgba(200,185,240,0.55)',lineHeight:1.7}}>Tu recompensa ha sido sellada en el Templo.<br/>El equipo te la entregará directamente.</p>
                </>
              ) : (
                <>
                  <div style={{fontSize:'40px',marginBottom:'16px',animation:'rvFloat 3s ease-in-out infinite'}}>✦</div>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(11px,2vw,14px)',letterSpacing:'3px',color:rarity.color,marginBottom:'10px'}}>RECOMPENSA ESPECIAL</div>
                  <p style={{fontFamily:"'Crimson Text',serif",fontSize:'clamp(14px,2.5vw,17px)',color:'rgba(200,185,240,0.55)',lineHeight:1.7}}>Esta recompensa será entregada directamente por el equipo del Templo.<br/>Verifica tu correo y comunidad.</p>
                </>
              )}
            </div>
          )}

            {hasContent && !unlocked && (
              <div style={{borderRadius:'20px',padding:'clamp(32px,5vw,56px)',background:'rgba(255,255,255,0.015)',border:'1px dashed rgba(255,255,255,0.1)',textAlign:'center'}}>
                <div style={{fontSize:'40px',marginBottom:'16px',filter:'grayscale(1)',opacity:0.4}}>🔒</div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:'11px',letterSpacing:'3px',color:'rgba(200,185,240,0.4)',marginBottom:'8px'}}>RECOMPENSA BLOQUEADA</div>
                <div style={{fontFamily:"'Raleway',sans-serif",fontSize:'12px',color:'rgba(200,185,240,0.25)'}}>Necesitas el Nivel {reward.level} para desbloquear esta recompensa</div>
              </div>
            )}

            {hasContent && unlocked && (
              <div style={{borderRadius:'20px',overflow:'hidden',border:`1px solid ${rarity.border}`,boxShadow:`0 0 60px ${rarity.glow.replace('0.9','0.15')}`}}>
                <div style={{padding:'clamp(20px,3vw,32px)',background:`linear-gradient(135deg,${rarity.color}10 0%,rgba(8,3,26,0.98) 100%)`,borderBottom:`1px solid ${rarity.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px'}}>
                  <div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:'7px',letterSpacing:'4px',color:`${rarity.color}88`,marginBottom:'6px'}}>✦ CONTENIDO DESBLOQUEADO</div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(14px,2.5vw,18px)',fontWeight:900,color:'#fff',letterSpacing:'1px'}}>{reward.title}</div>
                  </div>
                  {claimed && (
                    <div style={{display:'flex',alignItems:'center',gap:'7px',padding:'6px 16px',borderRadius:'100px',background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.4)',fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'2px',color:'#4ade80'}}>
                      <div style={{width:'7px',height:'7px',borderRadius:'50%',background:'#4ade80',boxShadow:'0 0 8px #4ade80',animation:'rvPulse 1.5s ease-in-out infinite'}}/>
                      YA RECLAMADO
                    </div>
                  )}
                </div>
                <div style={{padding:'clamp(24px,4vw,40px)',background:'rgba(8,3,26,0.97)',display:'flex',flexDirection:'column',alignItems:'center',gap:'20px'}}>
                  <div style={{fontSize:'clamp(48px,8vw,72px)',animation:'rvCrownFloat 3.5s ease-in-out infinite',filter:`drop-shadow(0 0 24px ${rarity.glow})`}}>{reward.icon_emoji||'🎁'}</div>
                  <p style={{fontFamily:"'Crimson Text',serif",fontSize:'clamp(14px,2.5vw,17px)',color:'rgba(200,185,240,0.6)',lineHeight:1.7,textAlign:'center',maxWidth:'480px'}}>Tu recompensa está lista. El contenido se abrirá aquí mismo.</p>
                  <button onClick={handleOpen} style={{position:'relative',overflow:'hidden',padding:'clamp(14px,2.5vw,18px) clamp(32px,5vw,56px)',borderRadius:'100px',background:`linear-gradient(135deg,${rarity.color}33 0%,${rarity.color}55 50%,${rarity.color}33 100%)`,border:`1.5px solid ${rarity.border}`,color:rarity.color,fontFamily:"'Cinzel',serif",fontWeight:900,fontSize:'clamp(10px,1.8vw,13px)',letterSpacing:'3px',cursor:'pointer',boxShadow:`0 0 40px ${rarity.glow},0 0 80px ${rarity.glow.replace('0.9','0.3')}`,transition:'all 0.3s ease'}}
                    onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04) translateY(-2px)';}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='scale(1) translateY(0)';}}>
                    <div style={{position:'absolute',inset:0,borderRadius:'100px',background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)',backgroundSize:'200% 100%',animation:'rvSweep 2.5s ease-in-out infinite'}}/>
                    <span style={{position:'relative',zIndex:1}}>⚔ ABRIR RECOMPENSA</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{marginTop:'40px',display:'flex',justifyContent:'center',opacity:entered?1:0,transition:'opacity 0.6s ease 0.5s'}}>
            <button onClick={()=>navigate('/profile')} style={{padding:'12px 32px',borderRadius:'100px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(200,185,240,0.4)',fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'3px',cursor:'pointer',transition:'all 0.3s ease'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=rarity.border;e.currentTarget.style.color=rarity.color;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';e.currentTarget.style.color='rgba(200,185,240,0.4)';}}>
              ← VOLVER AL TEMPLO
            </button>
          </div>
        </div>
      </div>

      {/* ── CAPA CONTENIDO (se muestra encima cuando showContent=true) ── */}
      <div style={{
        position:'absolute', inset:0,
        display:'flex', flexDirection:'column',
        background:'#000',
        opacity: showContent ? 1 : 0,
        pointerEvents: showContent ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
        zIndex: 2,
      }}>
        {/* Barra superior del visor */}
        <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 16px',background:'linear-gradient(90deg,rgba(8,3,26,0.98),rgba(22,8,55,0.98))',borderBottom:`1px solid ${rarity.border}`,flexShrink:0,zIndex:1}}>
          <button onClick={()=>navigate('/profile')} style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 14px',borderRadius:'100px',background:'rgba(255,255,255,0.05)',border:`1px solid ${rarity.border}`,color:rarity.color,fontFamily:"'Cinzel',serif",fontSize:'8px',letterSpacing:'1.5px',cursor:'pointer'}}>
            ← VOLVER
          </button>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:'10px',letterSpacing:'2px',color:rarity.color,textShadow:`0 0 12px ${rarity.glow}`}}>
            {reward.icon_emoji} {reward.title}
          </div>
          <div style={{marginLeft:'auto',padding:'3px 10px',borderRadius:'100px',background:rarity.bg,border:`1px solid ${rarity.border}`,fontFamily:"'Cinzel',serif",fontSize:'7px',letterSpacing:'2px',color:rarity.color}}>
            {rarity.label}
          </div>
        </div>

        {/* Contenido según tipo */}
        {reward.content_type === 'storage' && (
          <>
            {blobLoading && (
              <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'16px'}}>
                <div style={{width:'36px',height:'36px',border:`3px solid ${rarity.color}33`,borderTopColor:rarity.color,borderRadius:'50%',animation:'rvSpin 0.8s linear infinite'}}/>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:'9px',letterSpacing:'3px',color:`${rarity.color}88`}}>CARGANDO CONTENIDO</div>
              </div>
            )}
            {blobError && (
              <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'16px',padding:'32px'}}>
                <p style={{color:'#f87171',fontFamily:"'Cinzel',serif",fontSize:'12px'}}>⚠ {blobError}</p>
                <button onClick={()=>loadBlob(reward.content_url)} style={{padding:'8px 24px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'100px',color:'#fff',fontFamily:"'Cinzel',serif",fontSize:'9px',cursor:'pointer',letterSpacing:'2px'}}>REINTENTAR</button>
              </div>
            )}
            {!blobLoading && !blobError && blobHtml && (
              <iframe srcDoc={blobHtml} title={reward.title} style={{flex:1,border:'none',display:'block',width:'100%'}}/>
            )}
          </>
        )}

        {reward.content_type === 'url' && (
          <iframe src={reward.content_url} title={reward.title} style={{flex:1,border:'none',display:'block',width:'100%'}} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen/>
        )}
      </div>
    </div>
  );
}