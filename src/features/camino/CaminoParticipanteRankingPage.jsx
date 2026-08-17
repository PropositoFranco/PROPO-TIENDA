import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseCamino as supabase } from '../../services/supabaseCamino';

const styles = `
:root{
  --gold:#D4AF37; --gold-bright:#FFE566; --gold-dim:rgba(212,175,55,0.4); --gold-glow:rgba(212,175,55,0.65);
  --dark-bg:#04020e; --dark-surface:rgba(10,5,32,0.92);
  --purple:#CC44FF;
  --lilac:rgba(200,185,240,0.68); --lilac-dim:rgba(200,185,240,0.42);
}
.crk-root *,.crk-root *::before,.crk-root *::after{margin:0;padding:0;box-sizing:border-box;}
.crk-root{
  min-height:100dvh; width:100%; display:flex; flex-direction:column;
  background:
    radial-gradient(ellipse 120% 50% at 50% 0%, rgba(40,10,90,0.9) 0%, transparent 60%),
    radial-gradient(ellipse 70% 40% at 12% 15%, rgba(10,40,100,0.35) 0%, transparent 55%),
    radial-gradient(ellipse 70% 40% at 88% 10%, rgba(80,10,110,0.35) 0%, transparent 55%),
    linear-gradient(180deg,#050215 0%,#0a0530 18%,#08031c 55%,#04020e 100%);
  font-family:'Crimson Text',serif; color:#fff; position:relative;
}
.crk-orbs{position:fixed; inset:0; overflow:hidden; pointer-events:none; z-index:0;}
.crk-orb{
  position:absolute; border-radius:50%;
  filter:blur(70px); opacity:0.4; mix-blend-mode:screen;
  animation:crk-flotar var(--dur) ease-in-out infinite; animation-delay:var(--del);
  will-change:transform; transform:translate3d(0,0,0);
}
@keyframes crk-flotar{
  0%,100%{ transform:translate3d(0,0,0) scale(1); }
  50%{ transform:translate3d(var(--tx), var(--ty), 0) scale(1.12); }
}
@media (max-width:760px){
  .crk-orb{filter:blur(46px);}
}

.crk-stars{position:fixed; inset:0; pointer-events:none; z-index:0;}
.crk-star{position:absolute; border-radius:50%; background:#fff; animation:crk-twinkle var(--d) ease-in-out infinite; animation-delay:var(--del);}
@keyframes crk-twinkle{0%,100%{opacity:var(--min);} 50%{opacity:1;}}

.crk-topnav{
  flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:14px;
  padding:10px 26px;
  background:linear-gradient(180deg, rgba(6,3,18,0.97), rgba(6,3,18,0.88));
  border-bottom:1px solid var(--gold-dim);
  position:relative; z-index:10; flex-wrap:wrap;
}
.crk-brand{display:flex; align-items:center; gap:10px;}
.crk-brand-name{font-family:'Cinzel',serif; font-weight:900; letter-spacing:1px; font-size:16px; color:#fff;}
.crk-brand-name span{color:var(--gold);}
.crk-nav-links{display:flex; align-items:center; gap:18px; flex-wrap:wrap;}
.crk-nav-item{
  font-family:'Cinzel',serif; font-size:12.5px; font-weight:700; letter-spacing:0.3px;
  color:var(--lilac); text-decoration:none; background:none; border:none; cursor:pointer;
  display:flex; align-items:center; gap:5px; white-space:nowrap; opacity:0.85; transition:opacity .2s, color .2s;
}
.crk-nav-item:hover{opacity:1; color:var(--gold-bright);}
.crk-nav-item.active{color:var(--gold-bright); opacity:1;}
.crk-nav-item.proximamente{opacity:0.4; cursor:default;}
.crk-nav-item.proximamente:hover{opacity:0.4; color:var(--lilac);}
.crk-badge-prox{
  font-size:7.5px; font-weight:900; letter-spacing:0.5px; color:var(--purple);
  background:rgba(204,68,255,0.14); border:1px solid rgba(204,68,255,0.3);
  border-radius:20px; padding:1px 5px; text-transform:uppercase;
}
.crk-salir{
  font-family:'Cinzel',serif; font-size:11px; font-weight:700; letter-spacing:0.5px;
  color:var(--lilac); text-decoration:none; opacity:0.75; cursor:pointer; background:none; border:none;
}
.crk-salir:hover{opacity:1; color:var(--gold-bright);}

.crk-wrap{
  flex:1 1 auto; max-width:820px; width:100%; margin:0 auto;
  padding:clamp(14px,3vh,26px) clamp(20px,4vw,40px);
  position:relative; z-index:1; display:flex; flex-direction:column; gap:clamp(10px,1.5vh,16px);
}

.crk-hero-frame{
  position:relative; width:100%; max-width:560px; margin:0 auto;
  border-radius:18px; overflow:hidden;
  border:2px solid var(--gold);
  box-shadow:0 0 0 1px rgba(212,175,55,0.25), 0 0 30px rgba(212,175,55,0.28), 0 10px 36px rgba(0,0,0,0.5);
  background:#050216;
}
.crk-hero-img{
  display:block; width:100%; height:auto;
  aspect-ratio:1825/862;
  object-fit:contain;
}
.crk-hero-caption{
  display:flex; align-items:center; gap:10px;
  padding:9px clamp(14px,3vw,18px);
}

.crk-tablero-header{padding:0;}
.crk-tablero-eyebrow{
  font-family:'Cinzel',serif; font-size:10px; font-weight:900; letter-spacing:1.8px;
  color:var(--gold); text-transform:uppercase; margin-bottom:3px;
  display:flex; align-items:center; gap:7px;
}
.crk-tablero-eyebrow::before{content:"✦"; color:var(--gold-bright); font-size:9px;}
h2.crk-tablero-title{
  font-family:'Cinzel Decorative',serif; font-weight:900; font-size:clamp(19px,3vh,25px);
  color:#fff; line-height:1.1; margin-bottom:3px;
}
.crk-tablero-sub{
  font-family:'Nunito',sans-serif; font-size:12px; color:var(--lilac); line-height:1.4; max-width:560px;
}
.crk-tablero-sub b{color:var(--gold-bright); font-weight:700;}
.crk-eyebrow-row{display:flex; align-items:center; gap:16px;}
.crk-eyebrow-icon{
  width:52px; height:52px; flex-shrink:0;
  border-radius:50%; border:2px solid var(--gold);
  background:radial-gradient(circle at 35% 30%, rgba(255,229,102,0.35), rgba(212,175,55,0.12) 65%, transparent 100%);
  box-shadow:0 0 18px var(--gold-glow);
  display:flex; align-items:center; justify-content:center; font-size:24px;
}
.crk-eyebrow-tag{font-family:'Cinzel',serif; font-size:12px; font-weight:900; letter-spacing:2.2px; color:var(--gold);}
h1.crk-title{font-family:'Cinzel Decorative',serif; font-weight:900; font-size:clamp(22px,3.6vh,30px); line-height:1.15; color:#fff;}

.crk-explica{
  background:var(--dark-surface); border:1px solid var(--gold-dim); border-radius:12px;
  padding:10px 15px; position:relative; overflow:hidden;
}
.crk-explica::before{content:""; position:absolute; inset:0; background:radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,175,55,0.08), transparent 70%); pointer-events:none;}
.crk-explica p{position:relative; z-index:1; font-family:'Nunito',sans-serif; font-size:11.5px; line-height:1.45; color:var(--lilac);}
.crk-explica b{color:var(--gold-bright); font-weight:700;}

/* ── NUEVO: stats comunitarios ── */
.crk-stats-row{display:grid; grid-template-columns:repeat(3,1fr); gap:8px;}
.crk-stat-card{
  background:var(--dark-surface); border:1px solid var(--gold-dim); border-radius:12px;
  padding:10px 12px; position:relative; overflow:hidden;
}
.crk-stat-card::before{content:""; position:absolute; inset:0; background:radial-gradient(ellipse 70% 60% at 0% 0%, rgba(212,175,55,0.07), transparent 70%); pointer-events:none;}
.crk-stat-card > *{position:relative; z-index:1;}
.crk-stat-label{font-family:'Cinzel',serif; font-size:8.5px; font-weight:900; letter-spacing:0.8px; color:var(--lilac-dim); text-transform:uppercase; display:flex; align-items:center; gap:4px; margin-bottom:3px;}
.crk-stat-num{font-family:'Cinzel Decorative',serif; font-weight:900; font-size:19px; color:var(--gold-bright); line-height:1;}
.crk-stat-sub{font-family:'Nunito',sans-serif; font-size:9px; color:var(--lilac-dim); margin-top:2px;}

/* ── NUEVO: barra de meta 1K ── */
.crk-meta-wrap{width:100%;}
.crk-meta-top{display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; font-family:'Nunito',sans-serif; font-size:10px; color:var(--lilac-dim);}
.crk-meta-top b{color:var(--gold-bright); font-weight:800;}
.crk-meta-track{height:6px; width:100%; border-radius:20px; background:rgba(255,255,255,0.06); border:1px solid var(--gold-dim); overflow:hidden;}
.crk-meta-fill{height:100%; border-radius:20px; background:linear-gradient(90deg, var(--gold) 0%, var(--gold-bright) 100%); box-shadow:0 0 10px var(--gold-glow); transition:width .7s ease;}
.crk-meta-cumplida{font-family:'Cinzel',serif; font-size:9px; font-weight:900; letter-spacing:0.5px; color:var(--gold-bright); margin-top:3px;}

.crk-mi-progreso{
  display:flex; align-items:center; gap:14px; flex-wrap:wrap;
  background:linear-gradient(135deg, rgba(212,175,55,0.1), var(--dark-surface));
  border:1px solid var(--gold); border-radius:12px; padding:10px 15px;
  box-shadow:0 0 16px rgba(212,175,55,0.12);
}
.crk-mi-progreso-txt{font-family:'Nunito',sans-serif; font-size:11.5px; color:var(--lilac); flex-shrink:0;}
.crk-mi-progreso-txt b{color:var(--gold-bright); font-weight:800;}

/* ── NUEVO: tabs de liga ── */
.crk-liga-tabs{display:flex; gap:7px;}
.crk-liga-tab{
  flex:1; text-align:center; padding:8px 10px; border-radius:10px;
  font-family:'Cinzel',serif; font-size:10.5px; font-weight:900; letter-spacing:0.6px; text-transform:uppercase;
  border:1px solid var(--gold-dim); background:var(--dark-surface); color:var(--lilac-dim); cursor:pointer;
  transition:all .2s;
}
.crk-liga-tab.activo{border-color:var(--gold); color:var(--gold-bright); background:rgba(212,175,55,0.12); box-shadow:0 0 14px rgba(212,175,55,0.18);}
.crk-liga-tab span{opacity:0.65; font-weight:700; text-transform:none; letter-spacing:0;}

.crk-lista{display:flex; flex-direction:column; gap:7px;}

.crk-fila{
  display:flex; align-items:center; gap:12px;
  background:var(--dark-surface); border:1px solid var(--gold-dim); border-radius:12px;
  padding:9px 14px; position:relative; overflow:hidden;
}
.crk-fila::before{content:""; position:absolute; inset:0; background:radial-gradient(ellipse 70% 60% at 0% 0%, rgba(212,175,55,0.05), transparent 70%); pointer-events:none;}
.crk-fila > *{position:relative; z-index:1;}
.crk-fila.yo{border-color:var(--gold); box-shadow:0 0 0 1px var(--gold), 0 0 18px rgba(212,175,55,0.25);}
.crk-fila.top1{border-color:rgba(255,229,102,0.6);}
.crk-fila.top2{border-color:rgba(212,175,55,0.55);}
.crk-fila.top3{border-color:rgba(180,140,90,0.5);}

.crk-pos{
  width:30px; flex-shrink:0; text-align:center;
  font-family:'Cinzel',serif; font-weight:900; font-size:14px; color:var(--lilac);
}
.crk-pos.medalla{font-size:19px;}

.crk-info{flex:1 1 auto; min-width:0;}
.crk-nombre-row{display:flex; align-items:center; gap:7px; flex-wrap:wrap;}
.crk-nombre{font-family:'Cinzel',serif; font-weight:700; font-size:13.5px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
.crk-tag-yo{
  font-size:8.5px; font-weight:900; letter-spacing:0.7px; color:#0a0614;
  background:var(--gold); border-radius:20px; padding:2px 6px; flex-shrink:0;
}
.crk-stats{display:flex; gap:8px; flex-wrap:wrap; margin-top:3px;}
.crk-stat{
  font-family:'Nunito',sans-serif; font-size:10px; color:var(--lilac-dim);
  display:flex; align-items:center; gap:3px; white-space:nowrap;
}

.crk-puntaje{
  flex-shrink:0; text-align:center; min-width:50px;
  display:flex; flex-direction:column; align-items:center; gap:0px;
}
.crk-puntaje-num{font-family:'Cinzel Decorative',serif; font-weight:900; font-size:17px; color:var(--gold-bright);}
.crk-puntaje-label{font-family:'Cinzel',serif; font-size:7.5px; font-weight:900; letter-spacing:0.8px; color:var(--lilac-dim);}

.crk-fila-placeholder{
  border-style:dashed !important; opacity:0.55;
  background:rgba(255,255,255,0.015);
}
.crk-fila-placeholder::before{display:none;}
.crk-pos-placeholder{color:var(--lilac-dim); font-size:16px;}
.crk-nombre-placeholder{font-family:'Cinzel',serif; font-weight:700; font-size:13.5px; color:var(--lilac-dim); font-style:italic;}
.crk-stat-ph{font-family:'Nunito',sans-serif; font-size:10.5px; color:var(--lilac-dim); font-style:italic;}
.crk-puntaje-ph{font-family:'Cinzel Decorative',serif; font-weight:900; font-size:16px; color:var(--lilac-dim);}

.crk-vacio{
  text-align:center; padding:40px 20px; color:var(--lilac); font-family:'Nunito',sans-serif; font-size:14px;
}
.crk-vacio-liga{
  text-align:center; padding:28px 20px; color:var(--lilac-dim); font-family:'Nunito',sans-serif; font-size:12.5px;
  background:var(--dark-surface); border:1px dashed var(--gold-dim); border-radius:13px;
}

.crk-en-vivo{
  display:flex; align-items:center; justify-content:center; gap:6px;
  font-family:'Nunito',sans-serif; font-size:10.5px; color:var(--lilac-dim); margin-top:2px;
}
.crk-dot{width:6px; height:6px; border-radius:50%; background:#7CFFA0; box-shadow:0 0 6px #7CFFA0; animation:crk-pulso 1.6s ease-in-out infinite;}
@keyframes crk-pulso{0%,100%{opacity:1;} 50%{opacity:0.3;}}

.crk-loading{
  min-height:100dvh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; text-align:center; padding:24px;
}
.crk-spinner{width:26px; height:26px; border:2.5px solid var(--gold-dim); border-top-color:var(--gold); border-radius:50%; animation:crk-girar 0.8s linear infinite;}
@keyframes crk-girar{ to{ transform:rotate(360deg); } }
.crk-btn{
  padding:12px 24px; margin-top:4px;
  background:rgba(212,175,55,0.14); border:1px solid var(--gold); border-radius:10px;
  color:var(--gold-bright); font-family:'Cinzel',serif; font-weight:900; font-size:11.5px; letter-spacing:1.2px; cursor:pointer;
}

@media (max-width:760px){
  .crk-topnav{padding:8px 14px;}
  .crk-nav-links{gap:10px;}
  .crk-nav-item{font-size:10.5px;}
  .crk-stats{gap:7px;}
  .crk-stat{font-size:10px;}
  .crk-stats-row{grid-template-columns:1fr; gap:8px;}
  .crk-mi-progreso{flex-direction:column; align-items:stretch;}
}
`;

const NAV_ITEMS = [
  { label: 'Inicio', activo: false, disponible: true, ruta: '/camino/participante/home' },
  { label: 'Check-in', activo: false, disponible: true, ruta: '/camino/participante/panel' },
  { label: 'Calendario', activo: false, disponible: true, ruta: '/camino/participante/calendario' },
  { label: 'Pasaporte del Templario', activo: false, disponible: true, ruta: '/camino/participante/pasaporte' },
  { label: 'Ranking', activo: true, disponible: true },
];

const MEDALLA = ['🥇', '🥈', '🥉'];
const META_SEGUIDORES = 1000;

// Cuenta hacia arriba animada para el contador comunitario "en vivo"
function useCountUp(target) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    const start = prevTarget.current;
    const end = target || 0;
    if (start === end) return;
    const duration = 900;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(start + (end - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prevTarget.current = end;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

export default function CaminoParticipanteRankingPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // cargando | listo | sin_acceso
  const [ranking, setRanking] = useState([]);
  const [miId, setMiId] = useState(null);
  const [estrellas, setEstrellas] = useState([]);
  const [orbes, setOrbes] = useState([]);
  const [liga, setLiga] = useState(null); // elite (>=1000) | ascenso (<1000)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const ligaAutoSeleccionada = useRef(false);

  useEffect(() => {
    const n = window.innerWidth < 760 ? 26 : 50;
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

    const colores = [
      'rgba(212,175,55,0.9)',   // dorado
      'rgba(204,68,255,0.85)',  // morado
      'rgba(80,140,255,0.85)',  // azul
      'rgba(255,68,170,0.8)',   // magenta
      'rgba(80,220,200,0.75)',  // teal
    ];
    const cantidadOrbes = window.innerWidth < 760 ? 4 : 6;
    const orbs = [];
    for (let i = 0; i < cantidadOrbes; i++) {
      const size = Math.round(Math.random() * 220 + 220); // 220–440px
      orbs.push({
        id: i,
        size,
        top: (Math.random() * 90).toFixed(1),
        left: (Math.random() * 90).toFixed(1),
        color: colores[i % colores.length],
        tx: `${Math.round((Math.random() - 0.5) * 160)}px`,
        ty: `${Math.round((Math.random() - 0.5) * 160)}px`,
        dur: (Math.random() * 10 + 16).toFixed(1), // 16–26s, movimiento lento
        del: (Math.random() * -20).toFixed(1),
      });
    }
    setOrbes(orbs);
  }, []);

  async function cargar() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      navigate('/camino/participante/login', { replace: true });
      return;
    }
    setMiId(sessionData.session.user.id);

    const { data, error } = await supabase.rpc('camino_ranking');
    if (error) {
      setEstado('sin_acceso');
      return;
    }

    setRanking(data || []);
    setUltimaActualizacion(new Date());
    setEstado('listo');

    // La primera vez que cargan los datos, abrimos directo en la liga
    // real del usuario para que se vea a sí mismo sin tener que buscarse.
    if (!ligaAutoSeleccionada.current) {
      const yo = (data || []).find((p) => p.participante_id === sessionData.session.user.id);
      const miLiga = yo && yo.seguidores_actuales >= META_SEGUIDORES ? 'elite' : 'ascenso';
      setLiga(miLiga);
      ligaAutoSeleccionada.current = true;
    }
  }

  useEffect(() => {
    cargar();

    // "En vivo": si alguien registra un check-in, un sello o sus
    // seguidores cambian, el ranking se refresca solo.
    const canal = supabase
      .channel('camino_ranking_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camino_perfil_social' }, cargar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camino_checkins' }, cargar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camino_sellos_participante' }, cargar)
      .subscribe();

    const intervalo = setInterval(cargar, 30000);

    return () => {
      supabase.removeChannel(canal);
      clearInterval(intervalo);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  async function salir() {
    await supabase.auth.signOut();
    navigate('/camino/participante/login', { replace: true });
  }

  const seguidoresGanadosTotal = useMemo(
    () => ranking.reduce((acc, p) => acc + (p.seguidores_ganados || 0), 0),
    [ranking]
  );
  const seguidoresGanadosAnimado = useCountUp(seguidoresGanadosTotal);

  const totalConMeta = useMemo(
    () => ranking.filter((p) => p.seguidores_actuales >= META_SEGUIDORES).length,
    [ranking]
  );

  const ligaElite = useMemo(() => ranking.filter((p) => p.seguidores_actuales >= META_SEGUIDORES), [ranking]);
  const ligaAscenso = useMemo(() => ranking.filter((p) => p.seguidores_actuales < META_SEGUIDORES), [ranking]);
  const listaActiva = liga === 'elite' ? ligaElite : ligaAscenso;
  const CUPO_MINIMO = 5;
  const fantasmasFaltantes = Math.max(0, CUPO_MINIMO - listaActiva.length);

  const miFila = useMemo(() => ranking.find((p) => p.participante_id === miId) || null, [ranking, miId]);
  const nombreCohorte = useMemo(() => {
    return miFila?.cohorte || ranking[0]?.cohorte || 'los Templarios';
  }, [ranking, miFila]);
  const miPosicionGlobal = useMemo(() => {
    if (!miId) return null;
    const idx = ranking.findIndex((p) => p.participante_id === miId);
    return idx === -1 ? null : idx + 1;
  }, [ranking, miId]);

  if (estado === 'cargando') {
    return (
      <div className="crk-root">
        <style>{styles}</style>
        <div className="crk-loading">
          <div className="crk-spinner"></div>
          <p style={{ color: 'var(--lilac)', fontFamily: "'Nunito',sans-serif", fontSize: 14 }}>Cargando el ranking...</p>
        </div>
      </div>
    );
  }

  if (estado === 'sin_acceso') {
    return (
      <div className="crk-root">
        <style>{styles}</style>
        <div className="crk-loading">
          <div style={{ fontSize: 32 }}>🔒</div>
          <h1 className="crk-title" style={{ fontSize: 22 }}>No pudimos cargar el ranking</h1>
          <p style={{ color: 'var(--lilac)', fontFamily: "'Nunito',sans-serif", fontSize: 14, maxWidth: 320 }}>
            Intenta de nuevo en un momento, o vuelve a tu inicio.
          </p>
          <button className="crk-btn" onClick={() => navigate('/camino/participante/home')}>VOLVER AL INICIO</button>
        </div>
      </div>
    );
  }

  return (
    <div className="crk-root">
      <style>{styles}</style>
      <div className="crk-orbs">
        {orbes.map(o => (
          <div key={o.id} className="crk-orb" style={{
            width: o.size, height: o.size, top: `${o.top}%`, left: `${o.left}%`,
            background: `radial-gradient(circle, ${o.color} 0%, transparent 72%)`,
            '--tx': o.tx, '--ty': o.ty, '--dur': `${o.dur}s`, '--del': `${o.del}s`,
          }} />
        ))}
      </div>
      <div className="crk-stars">
        {estrellas.map(s => (
          <div key={s.id} className="crk-star" style={{
            width: `${s.size}px`, height: `${s.size}px`, top: `${s.top}%`, left: `${s.left}%`,
            '--d': `${s.dur}s`, '--del': `${s.delay}s`, '--min': s.min,
          }} />
        ))}
      </div>

      <nav className="crk-topnav">
        <div className="crk-brand">
          <div className="crk-brand-name">TEMPLO <span>DEL PROPÓSITO</span></div>
        </div>
        <div className="crk-nav-links">
          {NAV_ITEMS.map(item => {
            if (!item.disponible) {
              return (
                <span key={item.label} className="crk-nav-item proximamente">
                  {item.label} <span className="crk-badge-prox">Próximamente</span>
                </span>
              );
            }
            if (item.ruta) {
              return <button key={item.label} className={`crk-nav-item ${item.activo ? 'active' : ''}`} onClick={() => navigate(item.ruta)}>{item.label}</button>;
            }
            return <span key={item.label} className={`crk-nav-item ${item.activo ? 'active' : ''}`}>{item.label}</span>;
          })}
        </div>
        <button className="crk-salir" onClick={salir}>Salir</button>
      </nav>

      <div className="crk-wrap" style={{ paddingTop: 'clamp(16px,3vh,28px)' }}>
        <div className="crk-hero-frame">
          <img
            className="crk-hero-img"
            src="https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/banners/camino/camino-ranking-banner.webp"
            alt="Ranking del Camino"
          />
          <div className="crk-hero-caption">
            <div className="crk-eyebrow-icon" style={{ width: 40, height: 40, fontSize: 18 }}>🏆</div>
            <div className="crk-eyebrow-tag">EL CAMINO EN CIFRAS</div>
          </div>
        </div>

        <div className="crk-tablero-header">
          <div className="crk-tablero-eyebrow">Road to 1K · Ciclo 2026</div>
          <h2 className="crk-tablero-title">Tablero</h2>
          <p className="crk-tablero-sub">
            Las ligas de <b>{nombreCohorte}</b>: quién va ganando y quién ya llegó a la meta.
          </p>
        </div>

        <div className="crk-explica">
          <p>Tu <b>puntaje</b> combina tu avance en seguidores y ventas frente al resto del grupo, más un bono por cada <b>check-in</b> y cada <b>sello</b> ganado en tu Pasaporte. Se actualiza en cuanto registras evidencia.</p>
        </div>

        {/* Stats comunitarios */}
        <div className="crk-stats-row">
          <div className="crk-stat-card">
            <div className="crk-stat-label">📈 Seguidores ganados</div>
            <div className="crk-stat-num">+{seguidoresGanadosAnimado.toLocaleString('es-MX')}</div>
            <div className="crk-stat-sub">entre todos los Templarios</div>
          </div>
          <div className="crk-stat-card">
            <div className="crk-stat-label">🛡️ Templarios activos</div>
            <div className="crk-stat-num">{ranking.length}</div>
            <div className="crk-stat-sub">en el Camino ahora mismo</div>
          </div>
          <div className="crk-stat-card">
            <div className="crk-stat-label">🎯 Meta 1K cumplida</div>
            <div className="crk-stat-num">{totalConMeta}</div>
            <div className="crk-stat-sub">de {ranking.length} ya llegaron a 1,000</div>
          </div>
        </div>

        {/* Mi progreso hacia la meta */}
        {miFila && (
          <div className="crk-mi-progreso">
            <div className="crk-mi-progreso-txt">
              Vas en el lugar <b>#{miPosicionGlobal}</b> con <b>{miFila.puntaje} puntos</b>
            </div>
            <div className="crk-meta-wrap" style={{ flex: 1, minWidth: 180 }}>
              <div className="crk-meta-top">
                <span>Meta 1K seguidores</span>
                <b>{(miFila.seguidores_actuales || 0).toLocaleString('es-MX')} / {META_SEGUIDORES.toLocaleString('es-MX')}</b>
              </div>
              <div className="crk-meta-track">
                <div className="crk-meta-fill" style={{ width: `${Math.min(100, ((miFila.seguidores_actuales || 0) / META_SEGUIDORES) * 100)}%` }} />
              </div>
              {miFila.seguidores_actuales >= META_SEGUIDORES && <div className="crk-meta-cumplida">✦ Meta cumplida</div>}
            </div>
          </div>
        )}

        {/* Tabs de liga */}
        <div className="crk-liga-tabs">
          <button className={`crk-liga-tab ${liga === 'ascenso' ? 'activo' : ''}`} onClick={() => setLiga('ascenso')}>
            🛡️ Liga Ascenso <span>· &lt;1,000</span>
          </button>
          <button className={`crk-liga-tab ${liga === 'elite' ? 'activo' : ''}`} onClick={() => setLiga('elite')}>
            👑 Liga Élite <span>· ≥1,000</span>
          </button>
        </div>

        <div className="crk-lista">
          {listaActiva.map((r, i) => {
            const pos = i + 1;
            const esYo = r.participante_id === miId;
            const topClass = pos <= 3 ? `top${pos}` : '';
            return (
              <div key={r.participante_id} className={`crk-fila ${esYo ? 'yo' : ''} ${topClass}`}>
                <div className={`crk-pos ${pos <= 3 ? 'medalla' : ''}`}>{pos <= 3 ? MEDALLA[pos - 1] : pos}</div>
                <div className="crk-info">
                  <div className="crk-nombre-row">
                    <span className="crk-nombre">{r.nombre}</span>
                    {esYo && <span className="crk-tag-yo">TÚ</span>}
                  </div>
                  <div className="crk-stats">
                    <span className="crk-stat">✅ {r.checkins_count} check-ins</span>
                    <span className="crk-stat">🏅 {r.sellos_count} sellos</span>
                    <span className="crk-stat">📈 +{r.seguidores_ganados} seguidores</span>
                    {r.vendido_usd > 0 && <span className="crk-stat">💰 ${r.vendido_usd} vendido</span>}
                  </div>
                </div>
                <div className="crk-puntaje">
                  <div className="crk-puntaje-num">{r.puntaje}</div>
                  <div className="crk-puntaje-label">PUNTOS</div>
                </div>
              </div>
            );
          })}

          {Array.from({ length: fantasmasFaltantes }).map((_, i) => (
            <div key={`fantasma-${liga}-${i}`} className="crk-fila crk-fila-placeholder">
              <div className="crk-pos crk-pos-placeholder">❓</div>
              <div className="crk-info">
                <div className="crk-nombre-row">
                  <span className="crk-nombre-placeholder">Templario</span>
                </div>
                <div className="crk-stats">
                  <span className="crk-stat-ph">En proceso de selección</span>
                </div>
              </div>
              <div className="crk-puntaje">
                <div className="crk-puntaje-ph">—</div>
                <div className="crk-puntaje-label">PUNTOS</div>
              </div>
            </div>
          ))}
        </div>

        {ultimaActualizacion && (
          <div className="crk-en-vivo">
            <span className="crk-dot"></span>
            En vivo · actualizado {ultimaActualizacion.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}