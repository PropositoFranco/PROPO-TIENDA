import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseCamino as supabase } from '../../services/supabaseCamino';

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

.cpp-info-card{
  background:linear-gradient(160deg, rgba(212,175,55,0.08), var(--dark-surface));
  border:1px solid var(--gold-dim); border-radius:14px;
  padding:clamp(14px,2.2vh,20px) clamp(16px,2vw,24px);
  display:flex; gap:14px; align-items:flex-start;
}
.cpp-info-icon{font-size:clamp(22px,3.2vh,28px); flex-shrink:0; filter:drop-shadow(0 2px 3px rgba(0,0,0,0.5));}
.cpp-info-titulo{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(12.5px,1.6vh,14.5px); color:#fff; margin-bottom:6px;}
.cpp-info-texto{font-family:'Nunito',sans-serif; font-size:clamp(11.5px,1.4vh,13px); color:var(--lilac); line-height:1.5;}
.cpp-info-texto strong{color:#fff;}
.cpp-info-texto + .cpp-info-texto{margin-top:8px;}
.cpp-info-destacado{
  color:var(--gold-dim); background:rgba(212,175,55,0.08); border-radius:9px;
  padding:8px 10px;
}
.cpp-info-destacado strong{color:var(--gold);}

.cpp-stamp-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:clamp(10px,1.6vh,16px);}
@media (max-width:640px){ .cpp-stamp-grid{grid-template-columns:repeat(4,1fr); gap:8px;} }

.cpp-stamp{
  aspect-ratio:1/1; border-radius:14px; border:2px solid var(--gold-dim); position:relative;
  cursor:pointer; overflow:visible; background:transparent; transition:transform .15s, box-shadow .15s;
}
.cpp-stamp:hover{transform:translateY(-3px) scale(1.02);}
.cpp-stamp-media{
  position:absolute; inset:0; border-radius:12px; overflow:hidden;
  background:radial-gradient(circle at 50% 38%, rgba(120,90,170,0.28), #0d0716 75%);
}
.cpp-stamp-img{
  position:absolute; inset:0; width:100%; height:100%; object-fit:contain; display:block;
  filter:grayscale(0.85) brightness(0.35); transition:filter .3s;
}
.cpp-stamp.siguiente .cpp-stamp-img{ filter:grayscale(0.15) brightness(0.75) saturate(1.1); }
.cpp-stamp.obtenido .cpp-stamp-img{ filter:none; }
.cpp-stamp-scrim{
  position:absolute; inset:0; z-index:1;
  background:linear-gradient(180deg, rgba(10,4,20,0.02) 0%, rgba(10,4,20,0.05) 40%, rgba(6,3,14,0.9) 100%);
}
.cpp-stamp-fallback{
  position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  font-size:clamp(28px,4.4vh,40px); filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6));
}
.cpp-stamp-lock{
  position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:2;
  font-size:clamp(20px,3vh,28px); color:#cfcfd8; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8));
}
.cpp-stamp.obtenido .cpp-stamp-lock, .cpp-stamp.siguiente .cpp-stamp-lock{ display:none; }
.cpp-stamp-label{
  position:absolute; top:8px; left:8px; z-index:3;
  font-family:'Cinzel',serif; font-weight:900; font-size:clamp(9.5px,1.2vh,11px); color:#fff;
  background:rgba(0,0,0,0.45); padding:2px 7px; border-radius:100px; letter-spacing:0.4px;
}
.cpp-stamp-nombre{
  position:absolute; left:6px; right:6px; bottom:7px; z-index:3; text-align:center;
  font-family:'Cinzel',serif; font-weight:700; font-size:clamp(8.5px,1.05vh,10px); color:var(--lilac-dim); line-height:1.2;
}
.cpp-stamp.milestone .cpp-stamp-media{border:2px solid var(--gold); box-shadow:0 0 14px rgba(212,175,55,0.25);}
.cpp-stamp.obtenido .cpp-stamp-media{ border:2px solid var(--gold); box-shadow:0 0 18px var(--gold-glow); }
.cpp-stamp.obtenido .cpp-stamp-nombre{color:#fff;}
.cpp-stamp.siguiente .cpp-stamp-media{border:2px solid var(--gold-dim); animation:cpp-pulso-stamp 1.8s ease-in-out infinite;}
.cpp-stamp.siguiente .cpp-stamp-nombre{color:var(--lilac);}
@keyframes cpp-pulso-stamp{
  0%,100%{ box-shadow:0 0 0 0 rgba(212,175,55,0.4); }
  50%{ box-shadow:0 0 0 6px rgba(212,175,55,0); }
}

.cpp-medallion{
  width:clamp(42px,6.4vh,56px); height:clamp(42px,6.4vh,56px); border-radius:50%;
  padding:3px; position:relative; flex-shrink:0;
  background:conic-gradient(from 210deg, #2a2a30, #4c4c55, #7a7a86 35%, #9a9aa6 45%, #7a7a86 55%, #3a3a42 75%, #2a2a30 100%);
  box-shadow:0 5px 10px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.35);
  transition:transform .18s ease, box-shadow .2s, background .3s;
}
.cpp-medallion:hover{ transform:translateY(-2px) scale(1.04); }
.cpp-medallion.siguiente{
  background:conic-gradient(from 210deg, #4a3a12, #8a6b1d, #d9b34d 35%, #fff2b0 45%, #d9b34d 55%, #6b5218 75%, #4a3a12 100%);
  animation:cpp-pulso 1.8s ease-in-out infinite;
}
.cpp-medallion.obtenido{
  background:conic-gradient(from 210deg, #6b5218, #b9902c, #ffe566 32%, #fff8dd 44%, #ffe566 56%, #b9902c 70%, #6b5218 100%);
  box-shadow:0 5px 12px rgba(0,0,0,0.5), 0 0 16px var(--gold-glow), 0 0 0 1px rgba(0,0,0,0.3);
}
.cpp-medallion-cara{
  width:100%; height:100%; border-radius:50%; overflow:hidden; position:relative;
  background:radial-gradient(circle at 32% 26%, rgba(255,255,255,0.16), rgba(10,6,20,0.92) 72%);
  display:flex; align-items:center; justify-content:center;
  box-shadow:inset 0 2px 3px rgba(255,255,255,0.14), inset 0 -5px 8px rgba(0,0,0,0.65);
}
.cpp-medallion-cara img{ width:100%; height:100%; object-fit:cover; display:block; }
.cpp-medallion-icono{ font-size:clamp(16px,2.4vh,20px); filter:drop-shadow(0 1px 1px rgba(0,0,0,0.6)) grayscale(0.15); }
.cpp-medallion.obtenido .cpp-medallion-icono, .cpp-medallion.siguiente .cpp-medallion-icono{ filter:drop-shadow(0 1px 1px rgba(0,0,0,0.5)); }
.cpp-medallion.grande{ width:108px; height:108px; padding:4px; margin:0 auto 10px; }
.cpp-medallion.grande .cpp-medallion-icono{ font-size:44px; }
@keyframes cpp-pulso{
  0%,100%{ box-shadow:0 5px 10px rgba(0,0,0,0.5), 0 0 0 0 rgba(212,175,55,0.45), 0 0 0 1px rgba(0,0,0,0.35); }
  50%{ box-shadow:0 5px 10px rgba(0,0,0,0.5), 0 0 0 8px rgba(212,175,55,0), 0 0 0 1px rgba(0,0,0,0.35); }
}
.cpp-stamp-check{
  position:absolute; top:-8px; right:-8px; font-size:15px; color:#fff; z-index:3;
  background:linear-gradient(135deg,#3ee06a,#1fae4a); width:26px; height:26px; border-radius:50%;
  display:flex; align-items:center; justify-content:center; font-weight:900;
  border:2px solid #eafff0;
  box-shadow:0 3px 8px rgba(0,0,0,0.55), 0 0 12px rgba(62,224,106,0.85), 0 0 0 3px rgba(62,224,106,0.25);
  animation:cpp-check-pop .4s cubic-bezier(.34,1.56,.64,1);
}
@keyframes cpp-check-pop{
  0%{ transform:scale(0); }
  70%{ transform:scale(1.15); }
  100%{ transform:scale(1); }
}
.cpp-stamp-tag{
  position:absolute; top:-11px; left:50%; transform:translateX(-50%); z-index:3;
  font-family:'Cinzel',serif; font-weight:900; font-size:8.5px; letter-spacing:0.6px;
  color:#1a0a2e; background:linear-gradient(90deg,var(--gold),var(--gold-bright));
  padding:3px 9px; border-radius:100px; white-space:nowrap;
  box-shadow:0 3px 6px rgba(0,0,0,0.5);
}
.cpp-stamp-tag.siguiente{ color:#fff; background:linear-gradient(90deg,var(--purple),#8f1fd6); }

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

// ✏️ EDITA AQUÍ: nombre, mensaje de logro, ícono y (cuando la tengas) la foto de cada sello.
// imagen: null → usa el ícono/emoji. Cuando subas tu PNG a public/sellos/, cambia null por la ruta, ej: '/sellos/sello-1.png'
const STAGE_INFO = {
  1: { nombre: 'El Llamado',            logro: 'Diste el primer paso. El Templo empieza a reconocerte.',    icono: '🕯️', imagen: 'https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/banners/sellos/sello-1.png' },
  2: { nombre: 'El Primer Voto',        logro: 'Confirmaste tu compromiso con la constancia.',              icono: '📜', imagen: 'https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/banners/sellos/sello-2.png' },
  3: { nombre: 'La Disciplina',         logro: 'Ya no es motivación, es hábito. Vas construyendo tu ritmo.', icono: '⚔️', imagen: 'https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/banners/sellos/sello-3.png' },
  4: { nombre: 'El Escudo Validado',    logro: 'Etapa validada por tu líder. Vas a la mitad del Camino.',   icono: '🛡️', imagen: 'https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/banners/sellos/sello-4.png', milestone: true },
  5: { nombre: 'El Temple',             logro: 'Superaste la mitad — aquí muchos flaquean, tú no.',          icono: '🔥', imagen: 'https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/banners/sellos/sello-5.png' },
  6: { nombre: 'La Estrategia',         logro: 'Ya piensas como líder, no solo como participante.',          icono: '🧭', imagen: 'https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/banners/sellos/sello-6.png' },
  7: { nombre: 'La Antesala',           logro: 'Un paso más y cierras tu Camino completo.',                  icono: '🗝️', imagen: 'https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/banners/sellos/sello-7.png' },
  8: { nombre: 'El Templario Completo', logro: '¡Cerraste tu Camino! Los 8 sellos son tuyos.',               icono: '👑', imagen: 'https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/banners/sellos/sello-8-opcion-B.png', milestone: true },
};

function formatFecha(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
}

// Muestra la foto del sello si ya la subiste (imagen != null), si no, el ícono/emoji.
// estado visual: obtenido (a color, brilla) / siguiente (pulsa, ya lo puedes canjear) / bloqueado (gris, misterio)
function Medallion({ info, obtenido, siguiente, extraClass = '' }) {
  const estado = obtenido ? 'obtenido' : siguiente ? 'siguiente' : 'bloqueado';
  const clase = `cpp-medallion ${estado} ${extraClass}`.trim();
  return (
    <div className={clase}>
      <div className="cpp-medallion-cara">
        {obtenido && info.imagen ? (
          <img src={info.imagen} alt={info.nombre} />
        ) : (
          <span className="cpp-medallion-icono">
            {obtenido ? (info.icono || '🎖️') : siguiente ? (info.icono || '🔒') : '🔒'}
          </span>
        )}
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { label: 'Inicio', activo: false, disponible: true, ruta: '/camino/participante/home' },
  { label: 'Check-in', activo: false, disponible: true, ruta: '/camino/participante/panel' },
  { label: 'Calendario', activo: false, disponible: true, ruta: '/camino/participante/calendario' },
  { label: 'Pasaporte del Templario', activo: true, disponible: true },
  
  { label: 'Ranking', activo: false, disponible: true, ruta: '/camino/participante/ranking' },
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

        <div className="cpp-info-card">
          <div className="cpp-info-icon">🗝️</div>
          <div>
            <div className="cpp-info-titulo">¿Cómo se gana cada sello?</div>
            <div className="cpp-info-texto">
              Este código no lo sacas tú solo — te lo da tu líder <strong>durante</strong> cada Junta Constructiva en vivo.
              Cada semana hacemos una revisión juntos para tomar retroalimentación constructiva y ayudarte a mejorar de verdad, no solo a marcar una casilla.
            </div>
            <div className="cpp-info-texto cpp-info-destacado">
              📅 En cada Junta en vivo recibes 1 sello para este apartado — <strong>pídelo tú</strong> antes de que termine la sesión, para que no se te pase.
            </div>
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
            const esSiguiente = !obtenido && num === sellosObtenidos + 1;
            const info = STAGE_INFO[num] || {};
            return (
              <div
                key={num}
                className={`cpp-stamp ${info.milestone ? 'milestone' : ''} ${obtenido ? 'obtenido' : ''} ${esSiguiente ? 'siguiente' : ''}`}
                onClick={() => setModalSello(num)}
              >
                <div className="cpp-stamp-media">
                  {info.imagen ? (
                    <img className="cpp-stamp-img" src={info.imagen} alt={info.nombre} />
                  ) : (
                    <div className="cpp-stamp-fallback">
                      {obtenido ? (info.icono || '🎖️') : esSiguiente ? (info.icono || '🔒') : '🔒'}
                    </div>
                  )}
                  <div className="cpp-stamp-scrim" />
                  {!obtenido && !esSiguiente && <span className="cpp-stamp-lock">🔒</span>}
                  <span className="cpp-stamp-label">#{num}</span>
                  <div className="cpp-stamp-nombre">{obtenido || esSiguiente ? info.nombre : '???'}</div>
                </div>
                {num === 4 && <span className="cpp-stamp-tag">Validado</span>}
                {num === 8 && <span className="cpp-stamp-tag">Completo</span>}
                {esSiguiente && <span className="cpp-stamp-tag siguiente">Tu siguiente</span>}
                {obtenido && <span className="cpp-stamp-check">✓</span>}
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
              <Medallion info={info} obtenido={obtenido} siguiente={num === siguienteEsperado} extraClass="grande" />
              <div className="cpp-modal-titulo">{obtenido || num === siguienteEsperado ? info.nombre : `Sello #${num} — Bloqueado`}</div>
              {obtenido ? (
                <>
                  <div className="cpp-modal-texto">{info.logro}</div>
                  <div className="cpp-modal-meta">Obtenido el {formatFecha(fechasSellos[num])}</div>
                </>
              ) : num === siguienteEsperado ? (
                <div className="cpp-modal-texto">Este es tu siguiente sello, «{info.nombre}». Pide el código de la sesión a tu líder y cánjalo arriba para desbloquearlo.</div>
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