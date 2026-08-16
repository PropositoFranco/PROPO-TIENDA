import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const styles = `
:root{
  --gold:#D4AF37; --gold-bright:#FFE566; --gold-dim:rgba(212,175,55,0.4); --gold-glow:rgba(212,175,55,0.65);
  --dark-bg:#04020e; --dark-surface:rgba(10,5,32,0.92);
  --purple:#CC44FF; --purple-glow:rgba(204,68,255,0.5);
  --lilac:rgba(200,185,240,0.68); --lilac-dim:rgba(200,185,240,0.42);
}
.cpp-root *,.cpp-root *::before,.cpp-root *::after{margin:0;padding:0;box-sizing:border-box;}
.cpp-root{
  min-height:100dvh; width:100%; display:flex; flex-direction:column;
  background:
    radial-gradient(ellipse 120% 50% at 50% 0%, rgba(40,10,90,0.9) 0%, transparent 60%),
    radial-gradient(ellipse 70% 40% at 12% 15%, rgba(10,40,100,0.35) 0%, transparent 55%),
    radial-gradient(ellipse 70% 40% at 88% 10%, rgba(80,10,110,0.35) 0%, transparent 55%),
    linear-gradient(180deg,#050215 0%,#0a0530 18%,#08031c 55%,#04020e 100%);
  font-family:'Crimson Text',serif; color:#fff; position:relative;
}
.cpp-stars{position:fixed; inset:0; pointer-events:none; z-index:0;}
.cpp-star{position:absolute; border-radius:50%; background:#fff; animation:cpp-twinkle var(--d) ease-in-out infinite; animation-delay:var(--del);}
@keyframes cpp-twinkle{0%,100%{opacity:var(--min);} 50%{opacity:1;}}

.cpp-topnav{
  flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:14px;
  padding:10px 26px;
  background:linear-gradient(180deg, rgba(6,3,18,0.97), rgba(6,3,18,0.88));
  border-bottom:1px solid var(--gold-dim);
  position:relative; z-index:10; flex-wrap:wrap;
}
.cpp-brand{display:flex; align-items:center; gap:10px;}
.cpp-brand-name{font-family:'Cinzel',serif; font-weight:900; letter-spacing:1px; font-size:16px; color:#fff;}
.cpp-brand-name span{color:var(--gold);}
.cpp-nav-links{display:flex; align-items:center; gap:18px; flex-wrap:wrap;}
.cpp-nav-item{
  font-family:'Cinzel',serif; font-size:12.5px; font-weight:700; letter-spacing:0.3px;
  color:var(--lilac); text-decoration:none; background:none; border:none; cursor:pointer;
  display:flex; align-items:center; gap:5px; white-space:nowrap; opacity:0.85; transition:opacity .2s, color .2s;
}
.cpp-nav-item:hover{opacity:1; color:var(--gold-bright);}
.cpp-nav-item.active{color:var(--gold-bright); opacity:1;}
.cpp-nav-item.proximamente{opacity:0.4; cursor:default;}
.cpp-nav-item.proximamente:hover{opacity:0.4; color:var(--lilac);}
.cpp-badge-prox{
  font-size:7.5px; font-weight:900; letter-spacing:0.5px; color:var(--purple);
  background:rgba(204,68,255,0.14); border:1px solid rgba(204,68,255,0.3);
  border-radius:20px; padding:1px 5px; text-transform:uppercase;
}
.cpp-salir{
  font-family:'Cinzel',serif; font-size:11px; font-weight:700; letter-spacing:0.5px;
  color:var(--lilac); text-decoration:none; opacity:0.75; cursor:pointer; background:none; border:none;
}
.cpp-salir:hover{opacity:1; color:var(--gold-bright);}

.cpp-wrap{
  flex:1 1 auto; max-width:1080px; width:100%; margin:0 auto;
  padding:clamp(20px,4vh,40px) clamp(20px,4vw,40px);
  position:relative; z-index:1; display:flex; flex-direction:column; gap:clamp(14px,2.2vh,22px);
}

.cpp-title-row{display:flex; align-items:center; gap:14px;}
.cpp-title-icon{
  width:clamp(44px,6.5vh,58px); height:clamp(44px,6.5vh,58px); flex-shrink:0;
  border-radius:50%; border:2px solid var(--gold);
  background:radial-gradient(circle at 35% 30%, rgba(255,229,102,0.35), rgba(212,175,55,0.12) 65%, transparent 100%);
  box-shadow:0 0 16px var(--gold-glow); display:flex; align-items:center; justify-content:center; font-size:clamp(18px,2.6vh,24px);
}
h1.cpp-title{
  font-family:'Cinzel Decorative',serif; font-weight:900; font-size:clamp(22px,3.8vh,34px);
  color:#fff; text-shadow:0 0 20px rgba(212,175,55,0.3); line-height:1.1;
}
.cpp-subtitle{font-family:'Crimson Text',serif; font-size:clamp(13.5px,1.8vh,16.5px); color:var(--lilac); margin-top:4px;}

.cpp-progress-card{
  background:var(--dark-surface); border:1px solid var(--gold-dim); border-radius:14px;
  padding:clamp(14px,2.2vh,20px) clamp(16px,2vw,24px);
}
.cpp-progress-top{display:flex; align-items:baseline; justify-content:space-between; margin-bottom:clamp(8px,1.3vh,12px);}
.cpp-progress-count{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(17px,2.6vh,22px); color:#fff;}
.cpp-progress-left{font-family:'Nunito',sans-serif; font-weight:700; font-size:clamp(11.5px,1.5vh,13.5px); color:var(--lilac);}
.cpp-progress-bar{height:8px; border-radius:6px; background:rgba(255,255,255,0.08); overflow:hidden;}
.cpp-progress-fill{height:100%; border-radius:6px; background:linear-gradient(90deg,var(--gold),var(--gold-bright)); box-shadow:0 0 10px var(--gold-glow);}

.cpp-canje-card{
  background:var(--dark-surface); border:1px solid var(--gold-dim); border-radius:14px;
  padding:clamp(14px,2.2vh,20px) clamp(16px,2vw,24px);
  display:flex; flex-direction:column; gap:10px;
}
.cpp-canje-head{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(12.5px,1.6vh,14.5px); color:#fff;}
.cpp-canje-row{display:flex; gap:10px; flex-wrap:wrap;}
.cpp-canje-input{
  flex:1 1 200px; padding:11px 14px; background:rgba(4,2,14,0.7); border:1px solid var(--gold-dim);
  border-radius:9px; color:#fff; font-family:monospace; font-size:15px; letter-spacing:2px; text-transform:uppercase;
}
.cpp-canje-input:focus{outline:none; border-color:var(--gold);}
.cpp-canje-btn{
  padding:11px 22px; background:linear-gradient(135deg,var(--gold),#9a7a00); border:none; border-radius:9px;
  color:#1a0a2e; font-family:'Cinzel',serif; font-weight:900; font-size:12px; letter-spacing:1px; cursor:pointer;
  white-space:nowrap;
}
.cpp-canje-btn:disabled{opacity:0.5; cursor:default;}
.cpp-canje-msg{font-family:'Nunito',sans-serif; font-size:12.5px; font-weight:700;}
.cpp-canje-msg.ok{color:#7CFFB2;}
.cpp-canje-msg.err{color:#FF7A7A;}

.cpp-stamp-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:clamp(10px,1.6vh,16px);}
@media (max-width:640px){ .cpp-stamp-grid{grid-template-columns:repeat(4,1fr); gap:8px;} }

.cpp-stamp{
  background:var(--dark-surface); border:1px solid var(--gold-dim); border-radius:12px;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:clamp(4px,0.8vh,8px);
  padding:clamp(10px,1.8vh,18px) 6px; position:relative; cursor:pointer; transition:transform .15s, box-shadow .15s;
}
.cpp-stamp:hover{transform:translateY(-2px);}
.cpp-stamp-icon{font-size:clamp(16px,2.6vh,22px); filter:grayscale(0.15) opacity(0.85);}
.cpp-stamp-label{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(10.5px,1.35vh,12.5px); color:var(--lilac-dim);}
.cpp-stamp-nombre{font-family:'Cinzel',serif; font-weight:700; font-size:clamp(8.5px,1.05vh,10px); color:var(--lilac-dim); text-align:center; line-height:1.2; min-height:2.2em;}
.cpp-stamp.milestone{border-color:var(--gold); box-shadow:0 0 14px rgba(212,175,55,0.25);}
.cpp-stamp.obtenido{
  border-color:var(--gold); background:linear-gradient(160deg, rgba(212,175,55,0.14), var(--dark-surface));
  box-shadow:0 0 18px var(--gold-glow);
}
.cpp-stamp.obtenido .cpp-stamp-icon{filter:none;}
.cpp-stamp.obtenido .cpp-stamp-nombre{color:#fff;}
.cpp-stamp-check{
  position:absolute; top:7px; right:9px; font-size:11px; color:#1a0a2e;
  background:linear-gradient(135deg,var(--gold),var(--gold-bright)); width:16px; height:16px; border-radius:50%;
  display:flex; align-items:center; justify-content:center; font-weight:900;
}
.cpp-stamp-tag{
  position:absolute; top:-9px; left:50%; transform:translateX(-50%);
  font-family:'Cinzel',serif; font-weight:900; font-size:8.5px; letter-spacing:0.6px;
  color:#1a0a2e; background:linear-gradient(90deg,var(--gold),var(--gold-bright));
  padding:2px 8px; border-radius:100px; white-space:nowrap;
}

.cpp-modal-overlay{
  position:fixed; inset:0; background:rgba(4,2,14,0.86); backdrop-filter:blur(4px);
  display:flex; align-items:center; justify-content:center; z-index:100; padding:20px;
}
.cpp-modal-card{
  max-width:420px; width:100%; background:linear-gradient(160deg, rgba(20,8,45,0.98), rgba(6,3,18,0.98));
  border:1.5px solid var(--gold); border-radius:18px; padding:30px 26px; text-align:center;
  box-shadow:0 0 40px rgba(212,175,55,0.25); position:relative;
}
.cpp-modal-close{
  position:absolute; top:12px; right:14px; background:none; border:none; color:var(--lilac);
  font-size:18px; cursor:pointer; opacity:0.6;
}
.cpp-modal-close:hover{opacity:1;}
.cpp-modal-icon{font-size:46px; margin-bottom:10px;}
.cpp-modal-titulo{font-family:'Cinzel Decorative',serif; font-weight:900; font-size:19px; color:var(--gold-bright); margin-bottom:8px; line-height:1.2;}
.cpp-modal-texto{font-family:'Crimson Text',serif; font-size:15px; color:var(--lilac); line-height:1.5; margin-bottom:12px;}
.cpp-modal-meta{font-family:'Nunito',sans-serif; font-size:11px; color:var(--lilac-dim); letter-spacing:0.5px;}
.cpp-modal-progreso{font-family:'Cinzel',serif; font-size:11px; letter-spacing:1px; color:var(--gold); margin-top:16px;}

.cpp-practice-row{display:flex; flex-direction:column; gap:clamp(4px,0.8vh,8px);}
.cpp-practice-head{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(12.5px,1.6vh,14.5px); color:#fff;}
.cpp-practice-sub{font-family:'Nunito',sans-serif; font-size:clamp(10.5px,1.3vh,12px); color:var(--lilac-dim); margin-bottom:clamp(4px,0.8vh,8px);}
.cpp-practice-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:clamp(8px,1.4vh,14px);}
@media (max-width:640px){ .cpp-practice-grid{grid-template-columns:repeat(2,1fr);} }
.cpp-practice-stamp{
  background:rgba(204,68,255,0.05); border:1px solid rgba(204,68,255,0.28); border-radius:11px;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
  padding:clamp(8px,1.4vh,14px) 6px;
}
.cpp-practice-icon{font-size:clamp(14px,2.2vh,18px);}
.cpp-practice-label{font-family:'Nunito',sans-serif; font-weight:700; font-size:clamp(9.5px,1.2vh,11px); color:rgba(220,190,255,0.75); text-align:center;}

.cpp-loading{
  min-height:100dvh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; text-align:center; padding:24px;
}
.cpp-spinner{width:26px; height:26px; border:2.5px solid var(--gold-dim); border-top-color:var(--gold); border-radius:50%; animation:cpp-girar 0.8s linear infinite;}
@keyframes cpp-girar{ to{ transform:rotate(360deg); } }

@media (max-width:760px){
  .cpp-topnav{padding:8px 14px;}
  .cpp-nav-links{gap:10px;}
  .cpp-nav-item{font-size:10.5px;}
}
`;

const TOTAL_SELLOS = 8;

// ✏️ EDITA AQUÍ: nombre real y mensaje de logro de cada sello.
// Cuando tengas las fotos, avísame y las metemos aquí como imagenUrl en vez del ícono.
const STAGE_INFO = {
  1: { nombre: 'El Llamado',            logro: 'Diste el primer paso. El Templo empieza a reconocerte.',    icono: '🕯️' },
  2: { nombre: 'El Primer Voto',        logro: 'Confirmaste tu compromiso con la constancia.',              icono: '📜' },
  3: { nombre: 'La Disciplina',         logro: 'Ya no es motivación, es hábito. Vas construyendo tu ritmo.', icono: '⚔️' },
  4: { nombre: 'El Escudo Validado',    logro: 'Etapa validada por tu líder. Vas a la mitad del Camino.',   icono: '🛡️', milestone: true },
  5: { nombre: 'El Temple',             logro: 'Superaste la mitad — aquí muchos flaquean, tú no.',          icono: '🔥' },
  6: { nombre: 'La Estrategia',         logro: 'Ya piensas como líder, no solo como participante.',          icono: '🧭' },
  7: { nombre: 'La Antesala',           logro: 'Un paso más y cierras tu Camino completo.',                  icono: '🗝️' },
  8: { nombre: 'El Templario Completo', logro: '¡Cerraste tu Camino! Los 8 sellos son tuyos.',               icono: '👑', milestone: true },
};

function formatFecha(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
}

const NAV_ITEMS = [
  { label: 'Inicio', activo: false, disponible: true, ruta: '/camino/participante/home' },
  { label: 'Check-in', activo: false, disponible: true, ruta: '/camino/participante/panel' },
  { label: 'Calendario', activo: false, disponible: false },
  { label: 'Agenda', activo: false, disponible: false },
  { label: 'Pasaporte del Templario', activo: true, disponible: true },
  { label: 'Sala de Cowork', activo: false, disponible: false },
  { label: 'Ranking', activo: false, disponible: false },
];

export default function CaminoParticipantePasaportePage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // cargando | listo | sin_acceso
  const [estrellas, setEstrellas] = useState([]);
  const [sellos, setSellos] = useState([]); // números de sesión ya sellados
  const [fechasSellos, setFechasSellos] = useState({}); // { numero_sesion: sellado_at }
  const [codigoInput, setCodigoInput] = useState('');
  const [canjeando, setCanjeando] = useState(false);
  const [msgCanje, setMsgCanje] = useState(null); // { ok, texto }
  const [modalSello, setModalSello] = useState(null); // número del sello abierto en el modal

  useEffect(() => {
    const n = window.innerWidth < 760 ? 26 : 55;
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        id: i,
        size: (Math.random() * 1.5 + 0.6).toFixed(1),
        top: (Math.random() * 100).toFixed(1),
        left: (Math.random() * 100).toFixed(1),
        dur: (Math.random() * 4 + 3).toFixed(1),
        delay: (Math.random() * 4).toFixed(1),
        min: (Math.random() * 0.4 + 0.15).toFixed(2),
      });
    }
    setEstrellas(arr);
  }, []);

  async function cargar() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      navigate('/camino/participante/login', { replace: true });
      return;
    }
    await cargarSellos();
    setEstado('listo');
  }

  async function cargarSellos() {
    const { data } = await supabase.from('camino_sellos_participante').select('numero_sesion, sellado_at');
    setSellos((data || []).map(s => s.numero_sesion));
    setFechasSellos(Object.fromEntries((data || []).map(s => [s.numero_sesion, s.sellado_at])));
  }

  async function canjearSello() {
    const codigo = codigoInput.trim();
    if (!codigo) return;
    setCanjeando(true);
    setMsgCanje(null);
    const { data, error } = await supabase.rpc('camino_canjear_sello', { p_codigo: codigo });
    setCanjeando(false);
    if (error) { setMsgCanje({ ok: false, texto: 'Error de conexión. Intenta de nuevo.' }); return; }
    if (!data?.ok) {
      const mensajes = {
        sin_acceso: 'Tu cuenta no tiene acceso activo al Camino.',
        pasaporte_completo: '¡Ya completaste tu Pasaporte! Los 8 sellos están juntos.',
        codigo_incorrecto: 'Código incorrecto. Revisa que sea el de la sesión que te toca.',
      };
      setMsgCanje({ ok: false, texto: mensajes[data?.error] || 'No se pudo canjear el código.' });
      return;
    }
    setCodigoInput('');
    setMsgCanje({ ok: true, texto: `¡Sello #${data.numero_sesion} obtenido! 🎖️` });
    cargarSellos();
  }

  useEffect(() => { cargar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function salir() {
    await supabase.auth.signOut();
    navigate('/camino/participante/login', { replace: true });
  }

  if (estado === 'cargando') {
    return (
      <div className="cpp-root">
        <style>{styles}</style>
        <div className="cpp-loading">
          <div className="cpp-spinner"></div>
          <p style={{ color: 'var(--lilac)', fontFamily: "'Nunito',sans-serif", fontSize: 14 }}>Verificando tu acceso...</p>
        </div>
      </div>
    );
  }

  const sellosObtenidos = sellos.length;

  return (
    <div className="cpp-root">
      <style>{styles}</style>
      <div className="cpp-stars">
        {estrellas.map(s => (
          <div key={s.id} className="cpp-star" style={{
            width: `${s.size}px`, height: `${s.size}px`, top: `${s.top}%`, left: `${s.left}%`,
            '--d': `${s.dur}s`, '--del': `${s.delay}s`, '--min': s.min,
          }} />
        ))}
      </div>

      <nav className="cpp-topnav">
        <div className="cpp-brand">
          <div className="cpp-brand-name">TEMPLO <span>DEL PROPÓSITO</span></div>
        </div>
        <div className="cpp-nav-links">
          {NAV_ITEMS.map(item => {
            if (!item.disponible) {
              return (
                <span key={item.label} className="cpp-nav-item proximamente">
                  {item.label} <span className="cpp-badge-prox">Próximamente</span>
                </span>
              );
            }
            if (item.ruta) {
              return <button key={item.label} className="cpp-nav-item" onClick={() => navigate(item.ruta)}>{item.label}</button>;
            }
            return <span key={item.label} className={`cpp-nav-item ${item.activo ? 'active' : ''}`}>{item.label}</span>;
          })}
        </div>
        <button className="cpp-salir" onClick={salir}>Salir</button>
      </nav>

      <div className="cpp-wrap">
        <div className="cpp-title-row">
          <div className="cpp-title-icon">🎖️</div>
          <div>
            <h1 className="cpp-title">Pasaporte del Templario</h1>
            <div className="cpp-subtitle">Junta un sello por cada Junta Constructiva en vivo. Llega a {TOTAL_SELLOS} y cierras tu camino.</div>
          </div>
        </div>

        <div className="cpp-progress-card">
          <div className="cpp-progress-top">
            <div className="cpp-progress-count">{sellosObtenidos}/{TOTAL_SELLOS} sellos</div>
            <div className="cpp-progress-left">Te faltan {TOTAL_SELLOS - sellosObtenidos}</div>
          </div>
          <div className="cpp-progress-bar">
            <div className="cpp-progress-fill" style={{ width: `${(sellosObtenidos / TOTAL_SELLOS) * 100}%` }}></div>
          </div>
        </div>

        <div className="cpp-canje-card">
          <div className="cpp-canje-head">Canjea tu sello</div>
          <div className="cpp-canje-row">
            <input
              className="cpp-canje-input"
              placeholder="CÓDIGO DE LA SESIÓN"
              value={codigoInput}
              onChange={e => setCodigoInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') canjearSello(); }}
              disabled={canjeando}
            />
            <button className="cpp-canje-btn" onClick={canjearSello} disabled={canjeando || !codigoInput.trim()}>
              {canjeando ? 'CANJEANDO...' : 'CANJEAR'}
            </button>
          </div>
          {msgCanje && (
            <div className={`cpp-canje-msg ${msgCanje.ok ? 'ok' : 'err'}`}>{msgCanje.texto}</div>
          )}
        </div>

        <div className="cpp-stamp-grid">
          {Array.from({ length: TOTAL_SELLOS }, (_, i) => i + 1).map(num => {
            const obtenido = sellos.includes(num);
            const info = STAGE_INFO[num] || {};
            return (
              <div
                key={num}
                className={`cpp-stamp ${info.milestone ? 'milestone' : ''} ${obtenido ? 'obtenido' : ''}`}
                onClick={() => setModalSello(num)}
              >
                {num === 4 && <span className="cpp-stamp-tag">Validado</span>}
                {num === 8 && <span className="cpp-stamp-tag">Completo</span>}
                {obtenido && <span className="cpp-stamp-check">✓</span>}
                <div className="cpp-stamp-icon">{obtenido ? (info.icono || '🎖️') : '🔒'}</div>
                <div className="cpp-stamp-label">#{num}</div>
                <div className="cpp-stamp-nombre">{obtenido ? info.nombre : '???'}</div>
              </div>
            );
          })}
        </div>

        <div className="cpp-practice-row">
          <div className="cpp-practice-head">Sellos de práctica</div>
          <div className="cpp-practice-sub">Practica en la Sala de Cowork (sparring de venta y ganchos validados). No afecta tu racha del camino.</div>
          <div className="cpp-practice-grid">
            <div className="cpp-practice-stamp"><div className="cpp-practice-icon">🔒</div><div className="cpp-practice-label">Sparring ×5</div></div>
            <div className="cpp-practice-stamp"><div className="cpp-practice-icon">🔒</div><div className="cpp-practice-label">Sparring ×10</div></div>
            <div className="cpp-practice-stamp"><div className="cpp-practice-icon">🔒</div><div className="cpp-practice-label">Gancho validado</div></div>
            <div className="cpp-practice-stamp"><div className="cpp-practice-icon">🔒</div><div className="cpp-practice-label">Gancho validado ×5</div></div>
          </div>
        </div>
      </div>

      {modalSello && (() => {
        const num = modalSello;
        const obtenido = sellos.includes(num);
        const info = STAGE_INFO[num] || {};
        const siguienteEsperado = sellosObtenidos + 1;
        return (
          <div className="cpp-modal-overlay" onClick={() => setModalSello(null)}>
            <div className="cpp-modal-card" onClick={e => e.stopPropagation()}>
              <button className="cpp-modal-close" onClick={() => setModalSello(null)}>✕</button>
              <div className="cpp-modal-icon">{obtenido ? (info.icono || '🎖️') : '🔒'}</div>
              <div className="cpp-modal-titulo">{obtenido ? info.nombre : `Sello #${num} — Bloqueado`}</div>
              {obtenido ? (
                <>
                  <div className="cpp-modal-texto">{info.logro}</div>
                  <div className="cpp-modal-meta">Obtenido el {formatFecha(fechasSellos[num])}</div>
                </>
              ) : num === siguienteEsperado ? (
                <div className="cpp-modal-texto">Este es tu siguiente sello. Pide el código de la sesión a tu líder y cánjalo arriba para desbloquearlo.</div>
              ) : (
                <div className="cpp-modal-texto">Todavía no te toca. Primero completa el sello #{siguienteEsperado} para llegar hasta aquí.</div>
              )}
              <div className="cpp-modal-progreso">{sellosObtenidos}/{TOTAL_SELLOS} SELLOS DEL CAMINO</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}