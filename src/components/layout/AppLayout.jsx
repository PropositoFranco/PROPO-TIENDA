import { useState, useEffect, useCallback } from 'react';
import { useFullscreen } from "../../hooks/useFullscreen";
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { getRank } from '../../config/constants';
import { useUIStore } from '../../store/useUIStore';
import ToastLayer from '../ui/ToastLayer';
import heroAvatar from '../../assets/maestro_templario.png';
import LevelUpCinematic from '../ui/LevelUpCinematic';
import ArsenalUnlock from '../ui/ArsenalUnlock';
import { useLevelUp } from '../../context/LevelUpContext';
import { supabase } from '../../services/supabase';

const NAV_ITEMS = [
  { path: '/hub',      icon: '🏰', label: 'Lobby' },
  { path: '/store',    icon: '🛒', label: 'Tienda' },
  { path: '/library',  icon: '🎒', label: 'Mi Arsenal' },
  { path: '/missions', icon: '⚔️', label: 'Misiones' },
  { path: '/offers',   icon: '🔥', label: 'Ofertas' },
  { path: '/profile',  icon: '👤', label: 'Mi Perfil' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuthStore();
  const { templarioName, level, cristales, avatar, xp, xpToNextLevel, levelUpPending, levelUpInfo, clearLevelUpPending } = usePlayerStore();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { levelUpData, clearLevelUp } = useLevelUp();


  const { enter, exit } = useFullscreen();

useEffect(() => {
  if (location.pathname === '/admin') return;

  const tryEnter = () => enter();

  const onSignal = (e) => {
    if (!e.detail.active) {
      window.addEventListener('pointerdown', tryEnter, { once: true });
    }
  };

  if (!document.fullscreenElement) {
    window.addEventListener('pointerdown', tryEnter, { once: true });
  }

  window.addEventListener('fullscreen-change', onSignal);

  return () => {
    window.removeEventListener('pointerdown', tryEnter);
    window.removeEventListener('fullscreen-change', onSignal);
  };
}, []);
const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [bonusPopup, setBonusPopup] = useState(null);
  const [hideHeader, setHideHeader] = useState(false);
  const [allianceSpotlight, setAllianceSpotlight] = useState(false);
  const [cronicasUnseen, setCronicasUnseen] = useState(0);
  const [cronHov, setCronHov] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const checkAllianceFlag = () => setAllianceSpotlight(!!localStorage.getItem(`tdp_alliance_spotlight_${user.id}`));
    checkAllianceFlag();
    window.addEventListener('focus', checkAllianceFlag);
    window.addEventListener('storage', checkAllianceFlag);
    return () => {
      window.removeEventListener('focus', checkAllianceFlag);
      window.removeEventListener('storage', checkAllianceFlag);
    };
  }, [user?.id]);

  // ── CRÓNICAS DEL TEMPLO — pergaminos nuevos sin ver ──
  useEffect(() => {
    const TOTAL_CRONICAS = 5; // sube este número cada vez que agregues una puerta nueva
    const checkCronicas = () => {
      const vistas = (() => {
        try { return JSON.parse(localStorage.getItem('cronicas_vistas') || '[]'); }
        catch { return []; }
      })();
      setCronicasUnseen(Math.max(0, TOTAL_CRONICAS - vistas.length));
    };
    checkCronicas();
    window.addEventListener('focus', checkCronicas);
    window.addEventListener('storage', checkCronicas);
    return () => {
      window.removeEventListener('focus', checkCronicas);
      window.removeEventListener('storage', checkCronicas);
    };
  }, [user?.id]);

useEffect(() => {
  const fix = () => {
    const vh = window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${vh}px`);
    window.dispatchEvent(new Event('resize'));
    setHideHeader(h => h);
  };
  fix();
  window.addEventListener('orientationchange', () => setTimeout(fix, 120));
  window.addEventListener('fullscreen-change', fix);
  return () => {
    window.removeEventListener('orientationchange', fix);
    window.removeEventListener('fullscreen-change', fix);
  };
}, []);

  useEffect(() => {
    const show = () => setHideHeader(true);
    const hide = () => setHideHeader(false);
    window.addEventListener('vip-content-open', show);
    window.addEventListener('vip-content-close', hide);
    return () => {
      window.removeEventListener('vip-content-open', show);
      window.removeEventListener('vip-content-close', hide);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      setBonusPopup(e.detail.amount);
      setTimeout(() => setBonusPopup(null), 3500);
    };
    window.addEventListener('bonus-received', handler);
    return () => window.removeEventListener('bonus-received', handler);
  }, []);
  const [chestHov, setChestHov] = useState(false);
  const [showArsenal, setShowArsenal] = useState(false);
  const [arsenalLevel, setArsenalLevel] = useState(1);
  const [hubLocked, setHubLocked] = useState(false);

useEffect(() => {
  const handler = (e) => {
    const { type, data } = e.data || {};
    if (type === 'navigate' && data) {
      navigate('/' + data);
    }
    if (type === 'oraculo-modal') {
      setHideHeader(!!data?.open);
    }
    if (type === 'guardian-modal') {
      setHideHeader(!!data?.open);
    }
    if (type === 'hub-locked') {
      setHubLocked(!!data?.locked);
    }
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}, [navigate]);
  
  useEffect(() => {
    if (!user?.id || !level) return;
    const check = async () => {
      const { data: allRewards } = await supabase
        .from('level_rewards')
        .select('id, level')
        .lte('level', level)
        .not('reward_value', 'is', null);

      if (!allRewards?.length) { setUnclaimedCount(0); return; }

      const { data: claimed } = await supabase
        .from('user_rewards')
        .select('reward_id')
        .eq('user_id', user.id);

      const claimedIds = new Set((claimed || []).map(c => c.reward_id));
      const unclaimed = allRewards.filter(r => !claimedIds.has(r.id));
      setUnclaimedCount(unclaimed.length);
    };
    check();
    window.addEventListener('rewardClaimed', check);
    return () => window.removeEventListener('rewardClaimed', check);
  }, [user?.id, level]);

useEffect(() => {
    // Ya NO tocamos header.style.display aquí — eso ahora vive 100% en el JSX
    // del <header data-topbar> (más abajo en el render), como única fuente de
    // verdad. Tocarlo también aquí generaba una guerra silenciosa entre React
    // y el DOM directo: React creía que el último valor puesto era uno, el DOM
    // real tenía otro, y en cuanto este efecto disparaba (por sidebarOpen o
    // cambio de ruta) pisaba el estado real de hideHeader (ej. El Oráculo
    // abierto) sin que React se enterara — el header reaparecía solo.
    const dimForSidebar = sidebarOpen && window.innerWidth < 1024;
    const iframe = document.querySelector('iframe');
    if (iframe) iframe.style.filter = dimForSidebar ? 'brightness(0.15)' : 'none';
  }, [sidebarOpen, location.pathname]);

  return (
    <div className="relative w-full h-full bg-dark-900 flex" style={{ overflow: location.pathname === '/admin' ? 'visible' : 'clip' }}>
      <style>{`
        @media(max-width:640px){ .header-center-desktop{ display:none !important; } .header-nivel-desktop{ display:none !important; } }
        @keyframes headerCoinShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes headerCoinPulse {
          0%,100% { box-shadow: 0 0 10px rgba(212,175,55,0.3); }
          50%      { box-shadow: 0 0 24px rgba(212,175,55,0.7); }
        }
        @keyframes sidebarLuz {
          0%   { background-position: 0% 0%; }
          100% { background-position: 0% 300%; }
        }
        @keyframes sidebarGlow {
          0%,100% { opacity:0.5; }
          50%      { opacity:1; }
        }
        @keyframes chestBounce {
          0%,100% { transform: translateY(0) rotate(0deg); }
          20%     { transform: translateY(-4px) rotate(-8deg); }
          40%     { transform: translateY(0) rotate(8deg); }
          60%     { transform: translateY(-2px) rotate(-4deg); }
          80%     { transform: translateY(0) rotate(0deg); }
        }
        @keyframes badgePulse {
          0%,100% { box-shadow: 0 0 6px rgba(255,68,68,0.6); transform: scale(1); }
          50%      { box-shadow: 0 0 16px rgba(255,68,68,1); transform: scale(1.15); }
        }
        @keyframes allianceBadgePulse {
          0%,100% { box-shadow: 0 0 10px rgba(212,175,55,0.9), 0 0 20px rgba(212,175,55,0.5); transform: scale(1); }
          50%      { box-shadow: 0 0 16px rgba(212,175,55,1), 0 0 32px rgba(212,175,55,0.7); transform: scale(1.18); }
        }
        @keyframes rewardTooltipIn {
          from { opacity:0; transform: translateX(-50%) translateY(4px); }
          to   { opacity:1; transform: translateX(-50%) translateY(0); }
        }
        .header-coins {
          display:flex; align-items:center; gap:8px;
          background:linear-gradient(135deg,rgba(20,10,40,0.95) 0%,rgba(10,5,25,0.98) 100%);
          border:1.5px solid rgba(212,175,55,0.5);
          border-radius:10px; padding:8px 16px;
          animation:headerCoinPulse 3s ease-in-out infinite;
          position:relative; overflow:hidden; cursor:pointer;
          min-width:clamp(80px,20vw,110px);
        }
        .header-coins .hc-num {
          font-family:'Georgia,serif'; font-size:16px; font-weight:900;
          color:#f5d06e; letter-spacing:1px;
          text-shadow:0 0 12px rgba(255,200,50,.8),0 1px 2px rgba(0,0,0,1);
          white-space:nowrap; line-height:1;
        }
        .header-coins .hc-label {
          font-family:'Cinzel,serif'; font-size:9px; font-weight:700;
          letter-spacing:3px; text-transform:uppercase;
          color:rgba(212,175,55,.7); margin-top:3px; white-space:nowrap;
          text-shadow:0 0 6px rgba(212,175,55,0.4);
        }
        .header-coins::before {
          content:'';
          position:absolute; inset:0;
          background:linear-gradient(90deg,transparent 0%,rgba(212,175,55,0.08) 50%,transparent 100%);
          background-size:200% 100%;
          animation:headerCoinShimmer 3s linear infinite;
          pointer-events:none;
        }
        .sidebar-epic {
          position:fixed; left:0; top:0; bottom:0; width: min(280px, 58vw); z-index:50;
          background:linear-gradient(180deg,#0d0120 0%,#110228 40%,#0a0118 100%);
          display:flex; flex-direction:column;
          box-shadow:6px 0 40px rgba(0,0,0,0.9);
        }
        .sidebar-epic::after {
          content:'';
          position:absolute; top:0; right:0; width:2px; height:100%;
          background:linear-gradient(180deg,
            transparent 0%,
            rgba(212,175,55,0.9) 20%,
            rgba(180,140,255,0.9) 50%,
            rgba(212,175,55,0.9) 80%,
            transparent 100%
          );
          background-size:100% 300%;
          animation:sidebarLuz 3s linear infinite;
          pointer-events:none;
        }
        .sidebar-nav-item {
          width:100%; display:flex; align-items:center; gap:12px;
          padding:11px 16px; border-radius:10px; border:none; cursor:pointer;
          font-family:'Cinzel',serif; font-size: clamp(10px,2.8vw,11px); letter-spacing: clamp(1px,0.5vw,2px);
          transition:all 0.25s; text-align:left; position:relative; overflow:hidden;
        }
        .sidebar-nav-item.active {
          background:linear-gradient(90deg,rgba(212,175,55,0.18),rgba(212,175,55,0.04));
          color:#FFD700;
          border-left:2px solid rgba(212,175,55,0.9);
          box-shadow:0 0 16px rgba(212,175,55,0.15),inset 0 0 20px rgba(212,175,55,0.05);
          text-shadow:0 0 10px rgba(255,215,0,0.7);
        }
        .sidebar-nav-item.inactive {
          background:transparent;
          color:rgba(212,175,55,0.55);
          border-left:2px solid transparent;
        }
        .sidebar-nav-item.inactive:hover {
          color:rgba(255,215,0,0.9);
          background:rgba(212,175,55,0.08);
          border-left:2px solid rgba(212,175,55,0.3);
          text-shadow:0 0 8px rgba(255,215,0,0.4);
        }
         @media(min-width:1024px) {
         .sb-logout-btn {
  font-size: 16px !important;
  letter-spacing: 3px !important;
  padding: 14px 18px !important;
  color: rgba(255,80,80,0.85) !important;
  border: 1px solid rgba(255,80,80,0.3) !important;
  border-radius: 10px !important;
  gap: 14px !important;
}
.sb-logout-btn:hover {
  color: rgba(255,120,120,1) !important;
  border-color: rgba(255,80,80,0.7) !important;
  background: rgba(255,50,50,0.12) !important;
}
.sb-logout-btn span { font-size: 20px !important; }
  .sidebar-epic {
    width: 410px !important;
  }
  .sidebar-nav-item {
    font-size: 23px !important;
    letter-spacing: 2px !important;
    padding: 21px 16px !important;
    gap: 12px !important;
  }
  .sidebar-nav-item span { font-size: 29px !important; }

  .sb-brand-title { font-size: 26px !important; letter-spacing: 8px !important; }
  .sb-brand-sub   { font-size: 13px !important; letter-spacing: 5px !important; margin-top: 8px !important; }
  .sb-avatar      { width: 90px !important; height: 148px !important; }
  .sb-hero-name   { font-size: 18px !important; letter-spacing: 2px !important; }
  .sb-hero-meta   { gap: 10px !important; margin-top: 10px !important; }
  .sb-hero-meta span { font-size: 16px !important; }
  .sb-close-btn   { font-size: 13px !important; letter-spacing: 2px !important; padding: 6px 10px !important; }
}


        @media(max-width:1023px) {
        .sb-logout-wrap {
  padding: 6px 8px !important;
  flex-shrink: 0 !important;
  position: sticky !important;
  bottom: 0 !important;
  background: linear-gradient(0deg,#0d0120 80%,transparent 100%) !important;
  z-index: 10 !important;
}
nav {
  overflow-y: auto !important;
  flex: 1 1 0 !important;
  min-height: 0 !important;
}
.sb-logout-btn {
  font-size: 5px !important;
  letter-spacing:2px !important;
  padding: 5px 8px !important;
  color: rgba(255,80,80,0.55) !important;
  border: 1px solid rgba(255,80,80,0.2) !important;
  border-radius: 6px !important;
  gap: 6px !important;
  display: flex !important;
  align-items: center !important;
  width: 100% !important;
}
          .sidebar-epic {
            width: 32vw !important;
            z-index: 500 !important;
            top: 0 !important;
            padding-top: 22px !important;
            height: 100vh !important;
            position: fixed !important;
          }
          .sidebar-nav-item {
  font-size: 12px !important;
  letter-spacing: 0.5px !important;
  padding: 1px 10px !important;
  gap: 4px !important;
  flex: 1 !important;
  min-height: 0 !important;
}
          .sidebar-nav-item span { font-size: 15px !important; }
        }
      `}</style>

      {/* Sidebar */}
      {sidebarOpen && window.innerWidth < 1024 && !location.pathname.startsWith('/cronicas') && (
        <div onClick={toggleSidebar} style={{
          position:'fixed', inset:0, zIndex:199,
          background:'rgba(0,0,0,0.35)',
          backdropFilter:'blur(3px)',
        }}/>
      )}

      <AnimatePresence>
        {sidebarOpen && !location.pathname.startsWith('/cronicas') && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="sidebar-epic"
            style={{ zIndex: 500 }}
          >
<style>{`
  @keyframes sweepUp {
    0%   { bottom: -30%; opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { bottom: 110%; opacity: 0; }
  }
`}</style>

{/* SWEEP sidebar — sube de abajo a arriba */}
<div style={{
  position: 'absolute',
  left: 0, right: 0,
  bottom: '-30%',
  height: '25%',
  background: 'linear-gradient(0deg, transparent 0%, rgba(180,79,255,0.14) 40%, rgba(212,175,55,0.08) 60%, transparent 100%)',
  pointerEvents: 'none',
  zIndex: 30,
  animation: 'sweepUp 5s ease-in-out infinite',
  filter: 'blur(3px)',
}} />

            <div style={{padding:'4px 12px 4px 48px',borderBottom:'1px solid rgba(212,175,55,0.15)',position:'relative',overflow:'hidden'}}>
              <div className="sb-brand-title" style={{fontFamily:'Cinzel,serif',fontSize:15,fontWeight:900,letterSpacing:5,background:'linear-gradient(90deg,#c8922a,#f5d06e,#d4af37)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>PROPO-TIENDA</div>
              <div className="sb-brand-sub" style={{fontFamily:'Cinzel,serif',fontSize:7,letterSpacing:3,color:'rgba(212,175,55,0.6)',marginTop:4,textTransform:'uppercase'}}>Templo del Propósito</div>
              <div style={{position:'absolute',bottom:0,left:'10%',right:'10%',height:1,background:'linear-gradient(90deg,transparent,rgba(212,175,55,0.4),transparent)'}}/>
            </div>

            <div style={{padding:'1px 8px',borderBottom:'1px solid rgba(212,175,55,0.1)',background:'rgba(212,175,55,0.03)'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div className="sb-avatar" style={{width:44,height:60,borderRadius:10,overflow:'hidden',flexShrink:0,border:'1.5px solid rgba(212,175,55,0.4)',boxShadow:'0 0 10px rgba(212,175,55,0.2)'}}>
                  <img src={heroAvatar} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="sb-hero-name" style={{fontFamily:'Cinzel,serif',fontSize:11,fontWeight:700,color:'#f5d06e',letterSpacing:1,textShadow:'0 0 8px rgba(212,175,55,0.5)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{templarioName || 'Templario'}</div>
                  <div className="sb-hero-meta" style={{display:'flex',alignItems:'center',gap:6,marginTop:5}}>
  <span style={{fontFamily:'Cinzel,serif',fontSize:10,fontWeight:700,color:'rgba(180,140,255,0.9)',letterSpacing:1,textShadow:'0 0 8px rgba(180,140,255,0.5)'}}>Nv. {level}</span>
  <span style={{color:'rgba(212,175,55,0.3)',fontSize:9}}>·</span>
  <span style={{fontFamily:'Georgia,serif',fontSize:11,fontWeight:900,color:'#f5d06e',letterSpacing:1,textShadow:'0 0 8px rgba(255,200,50,0.6)'}}>{cristales?.toLocaleString?.()??cristales}</span>
  <span style={{fontSize:13,filter:'drop-shadow(0 0 6px rgba(255,215,0,0.8))'}}>🪙</span>
</div>
                </div>
              </div>
            </div>

            <button onClick={toggleSidebar} className="sb-close-btn" style={{display:'flex',alignItems:'center',gap:'4px',margin:'0 8px 4px',padding:'3px 8px',borderRadius:'4px',background:'transparent',border:'none',borderBottom:'1px solid rgba(212,175,55,0.3)',color:'rgba(212,175,55,0.85)',cursor:'pointer',fontSize:'8px',fontFamily:'Cinzel,serif',letterSpacing:'1px',width:'100%',textShadow:'0 0 8px rgba(212,175,55,0.5)'}}>
              ✕ CERRAR MENÚ
            </button>

            <nav style={{flex:1,padding:'2px 6px',display:'flex',flexDirection:'column',gap:0,justifyContent:'flex-start',overflowY:'auto',pointerEvents: hubLocked ? 'none' : 'auto',filter: hubLocked ? 'grayscale(0.55) brightness(0.5)' : 'none',opacity: hubLocked ? 0.45 : 1,transition:'opacity 0.6s ease, filter 0.6s ease'}}>
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                const showAllianceBadge = item.path === '/profile' && allianceSpotlight;
                return (
                  <button key={item.path} onClick={() => { navigate(item.path); toggleSidebar(); }} className={`sidebar-nav-item ${isActive ? 'active' : 'inactive'}`}>
                    <span style={{fontSize:20,filter:isActive?'drop-shadow(0 0 8px rgba(255,215,0,1))':'none',position:'relative',display:'inline-flex'}}>
                      {item.icon}
                      {showAllianceBadge && (
                        <span style={{position:'absolute',top:-4,right:-8,width:13,height:13,borderRadius:'50%',background:'linear-gradient(135deg,#D4AF37,#FFE566)',border:'1.5px solid rgba(255,229,102,0.9)',animation:'allianceBadgePulse 1.6s ease-in-out infinite'}}/>
                      )}
                    </span>
                    {item.label}
                    {showAllianceBadge && (
                      <span style={{marginLeft:'auto',fontSize:14,filter:'drop-shadow(0 0 6px rgba(212,175,55,0.9))'}}>🎁</span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="sb-logout-wrap" style={{padding:'10px 12px',borderTop:'1px solid rgba(212,175,55,0.1)'}}>
              <button onClick={() => logout()} className="sb-logout-btn" style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,cursor:'pointer',fontFamily:'Cinzel,serif',fontSize:10,letterSpacing:2,color:'rgba(255,80,80,0.5)',background:'transparent',border:'none',transition:'all 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,50,50,0.08)';e.currentTarget.style.color='rgba(255,100,100,0.9)';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='rgba(255,80,80,0.5)';}}>
                <span>🚪</span> Cerrar Sesión
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <header data-topbar style={{position:'fixed',top:0,left:0,right:0,zIndex:40, display: location.pathname.startsWith('/recompensa') || location.pathname.startsWith('/cronicas') || (location.pathname.startsWith('/academia/') && !location.pathname.startsWith('/academia/comunidad')) || hideHeader || (sidebarOpen && window.innerWidth < 1024) ? 'none' : 'flex', opacity: sidebarOpen && window.innerWidth < 1024 ? 0 : 1, pointerEvents: sidebarOpen && window.innerWidth < 1024 ? 'none' : 'auto',background:'linear-gradient(90deg,#060112 0%,#0f0225 50%,#080119 100%)',borderBottom:'1px solid rgba(212,175,55,.28)',boxShadow:'0 4px 30px rgba(0,0,0,.9),0 1px 0 rgba(212,175,55,.14)',padding:'0 clamp(8px,3vw,28px)',height:68,alignItems:'center',justifyContent:'space-between'}}>

        {/* Left */}
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <button onClick={toggleSidebar} style={{fontSize:20,color:'rgba(212,175,55,.7)',background:'none',border:'none',cursor:'pointer',transition:'color .2s',lineHeight:1,padding:'12px 16px',margin:'-12px -8px -12px -28px',borderRadius:8,minWidth:56,minHeight:68,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <div style={{display:'flex',flexDirection:'column',lineHeight:1}}>
            <div style={{fontFamily:'Cinzel,Georgia,serif',fontWeight:900,letterSpacing: window.innerWidth < 1024 ? 2 : 5,fontSize: window.innerWidth < 1024 ? 10 : 13,background:'linear-gradient(90deg,#c8922a,#f5d06e,#d4af37)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>PROPO-TIENDA</div>
            <div style={{fontFamily:'Cinzel,Georgia,serif',fontSize: window.innerWidth < 1024 ? 7 : 9,fontWeight:600,letterSpacing: window.innerWidth < 1024 ? 1 : 3,textTransform:'uppercase',color:'rgba(212,175,55,.75)',marginTop:4,textShadow:'0 0 8px rgba(212,175,55,0.4)', display: window.innerWidth < 1024 ? 'none' : 'block'}}>Mi tiendita del Crecimiento</div>
          </div>
        </div>

        {/* Center */}
        <div style={{
          position: window.innerWidth < 1024 ? 'relative' : 'absolute',
          left: window.innerWidth < 1024 ? 'auto' : '50%',
          transform: window.innerWidth < 1024 ? 'none' : 'translateX(-50%)',
          display:'flex', alignItems:'center',
          gap: window.innerWidth < 1024 ? 6 : 10,
          flexShrink: window.innerWidth < 1024 ? 1 : 0,
          minWidth: 0,
          marginLeft: window.innerWidth < 1024 ? 25 : 0,
        }} className="header-center-desktop">
          <div style={{position:'relative',width:50,height:50,flexShrink:0,cursor:'pointer'}}>
            <img src={user?.user_metadata?.avatar_url || heroAvatar} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:6,border:'2px solid rgba(212,175,55,0.6)',filter:'drop-shadow(0 0 8px rgba(212,175,55,0.5))',mixBlendMode:'screen'}}/>
            <div style={{position:'absolute',bottom:-4,left:-4,background:'linear-gradient(135deg,#8B6914,#D4AF37)',border:'1px solid rgba(212,175,55,0.8)',borderRadius:4,padding:'1px 5px',fontFamily:'Cinzel,serif',fontSize:10,fontWeight:700,color:'#fff',lineHeight:1.3,boxShadow:'0 0 8px rgba(212,175,55,0.5)'}}>{level}</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:2}}>
            <span style={{fontFamily:'Cinzel,serif',fontSize:14,fontWeight:700,color:'#D4AF37',textShadow:'0 0 12px rgba(212,175,55,0.6)',letterSpacing:1}}>{templarioName || 'Templario'}</span>
            <span style={{fontFamily:'Cinzel,serif',fontSize:10,letterSpacing:2,textTransform:'uppercase',color:getRank(level).color}}>{getRank(level).icon} {getRank(level).name}</span>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:2}}>
              <div style={{width:110,height:6,background:'rgba(255,255,255,0.1)',borderRadius:3,overflow:'hidden',border:'1px solid rgba(255,255,255,0.1)'}}>
                <div style={{height:'100%',width:(xp&&xpToNextLevel)?(Math.min((xp/xpToNextLevel)*100,100).toFixed(1)+'%'):'0%',background:'linear-gradient(90deg,#1a8a00,#44FF44,#88FF88)',borderRadius:3,boxShadow:'0 0 6px rgba(68,255,68,0.8)',animation:'xpPulse 2s ease-in-out infinite'}}/>
              </div>
              <span style={{fontFamily:'Crimson Text,serif',fontSize:9,color:'rgba(255,255,255,0.5)',whiteSpace:'nowrap'}}>{(xp??0).toLocaleString()} / {(xpToNextLevel??4000).toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{display:'flex',alignItems:'center',gap: window.innerWidth < 1024 ? 6 : 10, marginLeft: window.innerWidth < 1024 ? 'auto' : undefined, marginRight: window.innerWidth < 1024 ? 4 : undefined}}>

          {/* 📜 CRÓNICAS DEL TEMPLO */}
          <div
            onClick={() => {
              if (hubLocked) {
                setCronHov(true);
                setTimeout(() => setCronHov(false), 2500);
                return;
              }
              navigate('/cronicas');
            }}
            onMouseEnter={() => setCronHov(true)}
            onMouseLeave={() => setCronHov(false)}
            style={{
              position:'relative', cursor: hubLocked ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              width: window.innerWidth < 1024 ? 34 : 48,
              height: window.innerWidth < 1024 ? 34 : 48,
              background: cronicasUnseen > 0
                ? (cronHov ? 'linear-gradient(135deg,rgba(212,175,55,0.25),rgba(180,100,255,0.18))' : 'linear-gradient(135deg,rgba(212,175,55,0.14),rgba(180,100,255,0.10))')
                : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${cronicasUnseen > 0 ? (cronHov ? 'rgba(212,175,55,0.9)' : 'rgba(212,175,55,0.45)') : 'rgba(212,175,55,0.18)'}`,
              borderRadius:12,
              boxShadow: cronicasUnseen > 0
                ? (cronHov ? '0 0 24px rgba(212,175,55,0.6), 0 0 48px rgba(212,175,55,0.2)' : '0 0 12px rgba(212,175,55,0.2)')
                : 'none',
              opacity: hubLocked ? 0.42 : (cronicasUnseen > 0 ? 1 : 0.42),
              filter: hubLocked ? 'grayscale(0.6) brightness(0.6)' : 'none',
              transition:'all 0.3s ease',
            }}
          >
            <span style={{
              fontSize: window.innerWidth < 1024 ? 16 : 20,
              filter: cronicasUnseen > 0 ? 'drop-shadow(0 0 8px rgba(212,175,55,0.8))' : 'none',
              display:'block',
            }}>📜</span>

            {cronicasUnseen > 0 && (
              <div style={{
                position:'absolute', top:-6, right:-6,
                minWidth:18, height:18,
                background:'linear-gradient(135deg,#D4AF37,#FFE566)',
                borderRadius:9,
                border:'2px solid rgba(8,3,26,0.9)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'Cinzel,serif', fontSize:9, fontWeight:900,
                color:'#1a0a00',
                animation:'allianceBadgePulse 1.8s ease-in-out infinite',
                zIndex:10, padding:'0 3px',
              }}>
                {cronicasUnseen > 9 ? '9+' : cronicasUnseen}
              </div>
            )}

            {cronHov && (
              <div style={{
                position:'absolute', bottom:-42, left:'50%',
                transform:'translateX(-50%)',
                background:'rgba(8,3,26,0.97)',
                border:'1px solid rgba(212,175,55,0.5)',
                borderRadius:8, padding:'5px 12px',
                whiteSpace:'nowrap',
                fontFamily:'Cinzel,serif', fontSize:9,
                letterSpacing:'1.5px', color:'#d4af37',
                boxShadow:'0 4px 20px rgba(0,0,0,0.8)',
                animation:'rewardTooltipIn 0.2s ease',
                zIndex:999,
              }}>
                {hubLocked
                  ? '📋 Contesta tu evaluación abajo para reclamar'
                  : `✦ Crónicas del Templo${cronicasUnseen > 0 ? ` · ${cronicasUnseen} nueva${cronicasUnseen > 1 ? 's' : ''}` : ''}`}
              </div>
            )}
          </div>

          {/* 🎁 COFRE DE RECOMPENSAS */}
          {unclaimedCount > 0 && (
            <div
              onClick={() => {
                if (hubLocked) {
                  setChestHov(true);
                  setTimeout(() => setChestHov(false), 2500);
                  return;
                }
                navigate('/profile');
              }}
              onMouseEnter={() => setChestHov(true)}
              onMouseLeave={() => setChestHov(false)}
              style={{
                position:'relative', cursor: hubLocked ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
                width: window.innerWidth < 1024 ? 34 : 48,
                height: window.innerWidth < 1024 ? 34 : 48,
                background: chestHov
                  ? 'linear-gradient(135deg,rgba(212,175,55,0.25),rgba(180,120,0,0.2))'
                  : 'linear-gradient(135deg,rgba(212,175,55,0.12),rgba(180,120,0,0.08))',
                border:`1.5px solid ${chestHov ? 'rgba(212,175,55,0.9)' : 'rgba(212,175,55,0.45)'}`,
                borderRadius:12,
                boxShadow: chestHov
                  ? '0 0 24px rgba(212,175,55,0.6), 0 0 48px rgba(212,175,55,0.2)'
                  : '0 0 12px rgba(212,175,55,0.2)',
                filter: hubLocked ? 'grayscale(0.6) brightness(0.6)' : 'none',
                opacity: hubLocked ? 0.55 : 1,
                transition:'all 0.3s ease',
              }}
            >
              {/* Ícono cofre */}
              <span style={{
                fontSize:22,
                animation:'chestBounce 4s ease-in-out infinite',
                display:'block',
                filter:'drop-shadow(0 0 8px rgba(255,215,0,0.8))',
              }}>🎁</span>

              {/* Badge rojo con número */}
              <div style={{
                position:'absolute', top:-6, right:-6,
                minWidth:18, height:18,
                background:'linear-gradient(135deg,#ff3333,#ff6600)',
                borderRadius:9,
                border:'2px solid rgba(8,3,26,0.9)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'Cinzel,serif', fontSize:9, fontWeight:900,
                color:'#fff',
                animation:'badgePulse 1.5s ease-in-out infinite',
                zIndex:10, padding:'0 3px',
              }}>
                {unclaimedCount}
              </div>

              {/* Tooltip */}
              {chestHov && (
                <div style={{
                  position:'absolute', bottom:-42, left:'50%',
                  transform:'translateX(-50%)',
                  background:'rgba(8,3,26,0.97)',
                  border:'1px solid rgba(212,175,55,0.5)',
                  borderRadius:8, padding:'5px 12px',
                  whiteSpace:'nowrap',
                  fontFamily:'Cinzel,serif', fontSize:9,
                  letterSpacing:'1.5px', color:'#d4af37',
                  boxShadow:'0 4px 20px rgba(0,0,0,0.8)',
                  animation:'rewardTooltipIn 0.2s ease',
                  zIndex:999,
                }}>
                  {hubLocked
                    ? '📋 Contesta tu evaluación abajo para reclamar'
                    : `✦ ${unclaimedCount} recompensa${unclaimedCount > 1 ? 's' : ''} sin reclamar`}
                </div>
              )}
            </div>
          )}

          {/* PropoCoins */}
<div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
  <div className="header-coins" style={{
    padding: window.innerWidth < 1024 ? '5px 10px' : '8px 16px',
    minWidth: window.innerWidth < 1024 ? 'unset' : undefined,
    borderRadius: '10px 0 0 10px',   // ← esquinas izq redondeadas
  }}>
    <span style={{fontSize: window.innerWidth < 1024 ? 14 : 18, filter:'drop-shadow(0 0 8px rgba(255,215,0,1)) drop-shadow(0 0 16px rgba(255,180,20,0.7))'}}>🪙</span>
    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',lineHeight:1}}>
      <span className="hc-num" data-cristales-counter>{cristales?.toLocaleString?.()??cristales}</span>
      <span className="hc-label">PropoCoins</span>
    </div>
  </div>

  {/* Botón + → /offers */}
  <button
    onClick={() => { if (!hubLocked) navigate('/offers'); }}
    style={{
      height: window.innerWidth < 1024 ? 34 : 44,
      width:  window.innerWidth < 1024 ? 26 : 32,
      background: 'linear-gradient(135deg,rgba(212,175,55,0.18),rgba(180,120,0,0.12))',
      border: '1.5px solid rgba(212,175,55,0.5)',
      borderLeft: 'none',
      borderRadius: '0 10px 10px 0',
      cursor: hubLocked ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#f5d06e',
      fontSize: window.innerWidth < 1024 ? 16 : 20,
      fontWeight: 700,
      lineHeight: 1,
      opacity: hubLocked ? 0.45 : 1,
      filter: hubLocked ? 'grayscale(0.6) brightness(0.6)' : 'none',
      transition: 'all 0.2s',
      flexShrink: 0,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = 'rgba(212,175,55,0.28)';
      e.currentTarget.style.color = '#FFD700';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'linear-gradient(135deg,rgba(212,175,55,0.18),rgba(180,120,0,0.12))';
      e.currentTarget.style.color = '#f5d06e';
    }}
  >
    +
  </button>
</div>

          {/* Nivel */}
          <div className="header-nivel-desktop" style={{display:'flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,rgba(20,10,40,0.95) 0%,rgba(10,5,25,0.98) 100%)',border:'1.5px solid rgba(180,140,255,0.4)',borderRadius:10,padding: window.innerWidth < 1024 ? '5px 10px' : '8px 14px',animation:'headerCoinPulse 3s ease-in-out infinite',position:'relative',overflow:'hidden',cursor:'pointer'}}>
            <span style={{fontSize:20}}>{avatar||'⚔️'}</span>
            <div style={{display:'flex',flexDirection:'column',lineHeight:1}}>
              <span style={{fontFamily:'Georgia,serif',fontSize:11,fontWeight:900,color:'rgba(212,175,55,.9)',letterSpacing:1}}>Nv. {level}</span>
              <span style={{fontFamily:'Cinzel,serif',fontSize:9,fontWeight:700,letterSpacing:3,textTransform:'uppercase',color:getRank(level).color,marginTop:3,whiteSpace:'nowrap'}}>{getRank(level).name}</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main
  className={`flex-1 ${location.pathname === '/hub' || location.pathname.startsWith('/recompensa') || location.pathname.startsWith('/cronicas') ? 'overflow-hidden' : (location.pathname.startsWith('/academia/') && !location.pathname.startsWith('/academia/comunidad')) ? 'overflow-auto' : 'overflow-auto mt-[68px]'}`}
  style={{ 
    padding: location.pathname === '/hub' || location.pathname.startsWith('/recompensa') || location.pathname.startsWith('/cronicas') ? '0' : '40px 0 40px',
    display: location.pathname === '/admin' ? 'none' : undefined
  }}
>
  <Outlet />
</main>

      <LevelUpCinematic
        show={levelUpPending}
        oldLevel={levelUpInfo?.oldLevel??1}
        newLevel={levelUpInfo?.newLevel??2}
        newTitle={levelUpInfo?.newTitle??''}
        bonusXP={levelUpInfo?.bonusXP}
        bonusCoins={levelUpInfo?.bonusCoins}
        onComplete={() => {
          const lvl = levelUpInfo?.newLevel ?? 1;
          clearLevelUpPending();
          if (lvl >= 3) {
            setArsenalLevel(lvl);
            setShowArsenal(true);
          }
        }}
      />
      <ArsenalUnlock
        show={showArsenal}
        newLevel={arsenalLevel}
        userId={user?.id ?? null}
        onClose={() => setShowArsenal(false)}
      />
      {bonusPopup && (
        <div style={{
          position:'fixed', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          zIndex:9999, pointerEvents:'none',
          display:'flex', flexDirection:'column', alignItems:'center', gap:12,
          animation:'bonusIn 3.5s ease forwards',
        }}>
          <style>{`
            @keyframes bonusIn {
              0%   { opacity:0; transform:translate(-50%,-50%) scale(.5); }
              15%  { opacity:1; transform:translate(-50%,-50%) scale(1.15); }
              25%  { transform:translate(-50%,-50%) scale(1); }
              75%  { opacity:1; transform:translate(-50%,-60%); }
              100% { opacity:0; transform:translate(-50%,-80%); }
            }
            @keyframes coinSpin { 0%{transform:rotateY(0deg)} 100%{transform:rotateY(360deg)} }
          `}</style>
          <div style={{
            background:'linear-gradient(135deg,rgba(212,175,55,.25),rgba(180,100,255,.2))',
            border:'2px solid rgba(212,175,55,.8)',
            borderRadius:20, padding:'24px 40px',
            boxShadow:'0 0 60px rgba(212,175,55,.5), 0 0 120px rgba(212,175,55,.2)',
            textAlign:'center', backdropFilter:'blur(10px)',
          }}>
            <div style={{fontSize:48, animation:'coinSpin .6s ease', display:'block', marginBottom:8}}>🪙</div>
            <div style={{fontFamily:'Cinzel,serif', fontSize:13, letterSpacing:4, color:'rgba(212,175,55,.7)', marginBottom:6}}>BONUS RECIBIDO</div>
            <div style={{fontFamily:'Georgia,serif', fontSize:42, fontWeight:900, color:'#f5d06e', textShadow:'0 0 30px rgba(255,200,50,.9)', lineHeight:1}}>+{bonusPopup.toLocaleString()}</div>
            <div style={{fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:3, color:'rgba(212,175,55,.6)', marginTop:6}}>PROPOCOINS</div>
          </div>
        </div>
      )}
      <ToastLayer />
    </div>
  );
}