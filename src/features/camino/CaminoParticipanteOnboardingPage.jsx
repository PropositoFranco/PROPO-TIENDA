import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseCamino as supabase } from '../../services/supabaseCamino';

const styles = `
:root{
  --gold:#D4AF37; --gold-bright:#FFE566; --gold-dim:rgba(212,175,55,0.4); --gold-glow:rgba(212,175,55,0.65);
  --dark-bg:#04020e; --dark-surface:rgba(10,5,32,0.92);
  --purple:#CC44FF;
  --lilac:rgba(200,185,240,0.68); --lilac-dim:rgba(200,185,240,0.42);
  --red:#ff4466;
}
.cpo-root *,.cpo-root *::before,.cpo-root *::after{margin:0;padding:0;box-sizing:border-box;}
.cpo-root{
  min-height:100dvh; width:100%; display:flex; flex-direction:column;
  background:
    radial-gradient(ellipse 120% 50% at 50% 0%, rgba(40,10,90,0.9) 0%, transparent 60%),
    radial-gradient(ellipse 70% 40% at 12% 15%, rgba(10,40,100,0.35) 0%, transparent 55%),
    radial-gradient(ellipse 70% 40% at 88% 10%, rgba(80,10,110,0.35) 0%, transparent 55%),
    linear-gradient(180deg,#050215 0%,#0a0530 18%,#08031c 55%,#04020e 100%);
  font-family:'Crimson Text',serif; color:#fff; position:relative;
}
.cpo-stars{position:fixed; inset:0; pointer-events:none; z-index:0;}
.cpo-star{position:absolute; border-radius:50%; background:#fff; animation:cpo-twinkle var(--d) ease-in-out infinite; animation-delay:var(--del);}
@keyframes cpo-twinkle{0%,100%{opacity:var(--min);} 50%{opacity:1;}}

.cpo-hero{
  position:relative; width:100%; height:clamp(200px,32vh,300px); flex-shrink:0;
  background-image:url('https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/banners/camino/camino-lobby-banner.webp');
  background-size:cover; background-position:center 58%;
  display:flex; align-items:flex-end; z-index:1;
}
.cpo-hero::after{
  content:""; position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(4,2,14,0.15) 0%, rgba(4,2,14,0.55) 55%, rgba(4,2,14,0.98) 100%);
  pointer-events:none;
}
.cpo-hero-inner{
  position:relative; z-index:2; max-width:640px; width:100%; margin:0 auto;
  padding:0 clamp(20px,4vw,40px) clamp(16px,2.6vh,22px);
}
.cpo-eyebrow-row{display:flex; align-items:center; gap:14px;}
.cpo-eyebrow-icon{
  width:48px; height:48px; flex-shrink:0;
  border-radius:50%; border:2px solid var(--gold);
  background:radial-gradient(circle at 35% 30%, rgba(255,229,102,0.35), rgba(212,175,55,0.12) 65%, transparent 100%);
  box-shadow:0 0 18px var(--gold-glow);
  display:flex; align-items:center; justify-content:center; font-size:22px;
}
.cpo-eyebrow-tag{font-family:'Cinzel',serif; font-size:11.5px; font-weight:900; letter-spacing:2.2px; color:var(--gold);}
h1.cpo-title{font-family:'Cinzel Decorative',serif; font-weight:900; font-size:clamp(20px,3.4vh,27px); line-height:1.15; color:#fff; margin-top:2px;}

.cpo-wrap{
  flex:1 1 auto; max-width:640px; width:100%; margin:0 auto;
  padding:0 clamp(20px,4vw,40px) clamp(30px,5vh,50px);
  position:relative; z-index:1; display:flex; flex-direction:column; gap:clamp(14px,2vh,18px);
}

.cpo-card{
  background:var(--dark-surface); border:1px solid var(--gold-dim); border-radius:16px;
  padding:clamp(18px,2.6vh,26px) clamp(18px,2.4vw,26px); position:relative; overflow:hidden;
}
.cpo-card::before{content:""; position:absolute; inset:0; background:radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,175,55,0.08), transparent 70%); pointer-events:none;}
.cpo-card > *{position:relative; z-index:1;}

.cpo-step-label{
  font-family:'Cinzel',serif; font-weight:900; font-size:12px; letter-spacing:1.4px;
  color:var(--gold); margin-bottom:6px;
}
.cpo-question{font-family:'Cinzel',serif; font-weight:700; font-size:clamp(16px,2.2vh,19px); color:#fff; margin-bottom:14px; line-height:1.35;}
.cpo-sub{font-family:'Nunito',sans-serif; font-size:13px; color:var(--lilac); margin-bottom:16px; line-height:1.5;}

.cpo-opciones{display:flex; flex-direction:column; gap:10px;}
.cpo-opcion{
  display:flex; align-items:center; gap:14px; text-align:left;
  padding:16px 18px; border-radius:12px; cursor:pointer;
  background:rgba(212,175,55,0.06); border:1px solid var(--gold-dim);
  color:#fff; font-family:'Nunito',sans-serif; transition:background .2s, border-color .2s, transform .15s;
}
.cpo-opcion:hover{background:rgba(212,175,55,0.13); border-color:var(--gold); transform:translateY(-1px);}
.cpo-opcion-icon{
  width:40px; height:40px; flex-shrink:0; border-radius:10px;
  background:linear-gradient(160deg, rgba(212,175,55,0.3), rgba(124,58,237,0.2));
  border:1px solid var(--gold-dim);
  display:flex; align-items:center; justify-content:center; font-size:19px;
}
.cpo-opcion-title{font-family:'Cinzel',serif; font-weight:700; font-size:14.5px; color:#fff; margin-bottom:2px;}
.cpo-opcion-desc{font-size:12px; color:var(--lilac);}

.cpo-redes{display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;}
.cpo-red-chip{
  padding:9px 15px; border-radius:20px; cursor:pointer;
  background:rgba(212,175,55,0.06); border:1px solid var(--gold-dim);
  color:var(--lilac); font-family:'Cinzel',serif; font-weight:700; font-size:11.5px; letter-spacing:0.4px;
  display:flex; align-items:center; gap:6px; transition:all .2s;
}
.cpo-red-chip.activo{background:rgba(212,175,55,0.16); border-color:var(--gold); color:var(--gold-bright);}

.cpo-label{font-family:'Cinzel',serif; font-weight:700; font-size:11.5px; letter-spacing:0.6px; color:var(--lilac); margin-bottom:7px; display:block;}
.cpo-input{
  width:100%; background:rgba(255,255,255,0.04); border:1px solid var(--gold-dim); border-radius:10px;
  padding:12px 14px; color:#fff; font-family:'Nunito',sans-serif; font-size:14px; margin-bottom:16px;
}
.cpo-input:focus{outline:none; border-color:var(--gold);}
.cpo-input::placeholder{color:rgba(255,255,255,0.3);}

.cpo-btn{
  width:100%; padding:14px 20px;
  background:rgba(212,175,55,0.14); border:1px solid var(--gold); border-radius:10px;
  color:var(--gold-bright); font-family:'Cinzel',serif; font-weight:900; font-size:12px; letter-spacing:1.3px; cursor:pointer;
}
.cpo-btn:disabled{opacity:0.45; cursor:default;}
.cpo-btn-ghost{
  width:100%; padding:12px 20px; margin-top:8px;
  background:transparent; border:1px solid var(--gold-dim); border-radius:10px;
  color:var(--lilac); font-family:'Cinzel',serif; font-weight:700; font-size:11px; letter-spacing:1px; cursor:pointer;
}
.cpo-error{color:var(--red); font-size:12px; margin-top:10px; font-family:'Nunito',sans-serif;}

.cpo-progreso{display:flex; gap:6px; margin-bottom:18px;}
.cpo-progreso-punto{flex:1; height:3px; border-radius:2px; background:var(--gold-dim);}
.cpo-progreso-punto.activo{background:var(--gold);}

.cpo-loading{
  min-height:100dvh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; text-align:center; padding:24px;
}
.cpo-spinner{width:26px; height:26px; border:2.5px solid var(--gold-dim); border-top-color:var(--gold); border-radius:50%; animation:cpo-girar 0.8s linear infinite;}
@keyframes cpo-girar{ to{ transform:rotate(360deg); } }
`;

const REDES = [
  { id: 'instagram', label: 'Instagram', icon: '📷' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'facebook', label: 'Facebook', icon: '👤' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
];

export default function CaminoParticipanteOnboardingPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // cargando | listo | sin_acceso
  const [paso, setPaso] = useState(1); // 1: personal/nuevo, 2: red+usuario+seguidores
  const [esPerfilNuevo, setEsPerfilNuevo] = useState(null);
  const [redSocial, setRedSocial] = useState('instagram');
  const [usuarioRed, setUsuarioRed] = useState('');
  const [seguidores, setSeguidores] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [estrellas, setEstrellas] = useState([]);

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
  }, []);

  async function cargar() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      navigate('/camino/participante/login', { replace: true });
      return;
    }

    const { data: yaTiene, error: errPerfil } = await supabase.rpc('camino_mi_perfil_social');
    if (!errPerfil && yaTiene && yaTiene.length > 0) {
      navigate('/camino/participante/home', { replace: true });
      return;
    }

    const { data: progreso, error: errProgreso } = await supabase.rpc('camino_mi_progreso');
    if (errProgreso || !progreso || progreso.length === 0) {
      setEstado('sin_acceso');
      return;
    }

    setEstado('listo');
  }

  useEffect(() => { cargar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  function elegirModo(nuevo) {
    setEsPerfilNuevo(nuevo);
    setError('');
    setPaso(2);
  }

  async function confirmar() {
    setError('');
    if (!usuarioRed.trim()) {
      setError('Escribe tu usuario en la red social.');
      return;
    }
    const numSeguidores = parseInt(seguidores, 10);
    if (seguidores === '' || isNaN(numSeguidores) || numSeguidores < 0) {
      setError('Escribe cuántos seguidores tienes ahorita (puede ser 0 si tu perfil es nuevo).');
      return;
    }

    setEnviando(true);
    const { data, error: errRpc } = await supabase.rpc('camino_guardar_perfil_social', {
      p_red_social: redSocial,
      p_usuario_red: usuarioRed.trim(),
      p_es_perfil_nuevo: esPerfilNuevo,
      p_seguidores_iniciales: numSeguidores,
    });
    setEnviando(false);

    if (errRpc || !data?.ok) {
      setError('No se pudo guardar tu perfil. Intenta de nuevo.');
      return;
    }

    navigate('/camino/participante/home', { replace: true });
  }

  if (estado === 'cargando') {
    return (
      <div className="cpo-root">
        <style>{styles}</style>
        <div className="cpo-loading">
          <div className="cpo-spinner"></div>
          <p style={{ color: 'var(--lilac)', fontFamily: "'Nunito',sans-serif", fontSize: 14 }}>Preparando tu Camino...</p>
        </div>
      </div>
    );
  }

  if (estado === 'sin_acceso') {
    return (
      <div className="cpo-root">
        <style>{styles}</style>
        <div className="cpo-loading">
          <div style={{ fontSize: 32 }}>🔒</div>
          <h1 className="cpo-title" style={{ fontSize: 22 }}>No encontramos tu acceso</h1>
          <p style={{ color: 'var(--lilac)', fontFamily: "'Nunito',sans-serif", fontSize: 14, maxWidth: 320 }}>
            Tu cuenta todavía no tiene un acceso activo al Camino. Pide un link de invitación a tu gestor.
          </p>
          <button className="cpo-btn" style={{ maxWidth: 220 }} onClick={() => navigate('/camino/participante/login')}>IR AL LOGIN</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cpo-root">
      <style>{styles}</style>
      <div className="cpo-stars">
        {estrellas.map(s => (
          <div key={s.id} className="cpo-star" style={{
            width: `${s.size}px`, height: `${s.size}px`, top: `${s.top}%`, left: `${s.left}%`,
            '--d': `${s.dur}s`, '--del': `${s.delay}s`, '--min': s.min,
          }} />
        ))}
      </div>

      <div className="cpo-hero">
        <div className="cpo-hero-inner">
          <div className="cpo-eyebrow-row">
            <div className="cpo-eyebrow-icon">🚀</div>
            <div>
              <div className="cpo-eyebrow-tag">ANTES DE ARRANCAR</div>
              <h1 className="cpo-title">Marca tu punto de partida</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="cpo-wrap">
        <div className="cpo-progreso">
          <div className={`cpo-progreso-punto ${paso >= 1 ? 'activo' : ''}`}></div>
          <div className={`cpo-progreso-punto ${paso >= 2 ? 'activo' : ''}`}></div>
        </div>

        {paso === 1 && (
          <div className="cpo-card">
            <div className="cpo-step-label">PASO 1 DE 2</div>
            <div className="cpo-question">¿Con qué perfil vas a construir tu Camino?</div>
            <div className="cpo-sub">Esto define tu línea de partida. Todo lo que ganes de aquí en adelante se mide desde este punto — nada de lo que ya tenías cuenta en tu contra ni a tu favor.</div>
            <div className="cpo-opciones">
              <div className="cpo-opcion" onClick={() => elegirModo(false)}>
                <div className="cpo-opcion-icon">👑</div>
                <div>
                  <div className="cpo-opcion-title">Comenzaré mi Camino</div>
                  <div className="cpo-opcion-desc">Voy a usar mi perfil personal, el que ya tengo.</div>
                </div>
              </div>
              <div className="cpo-opcion" onClick={() => elegirModo(true)}>
                <div className="cpo-opcion-icon">🌱</div>
                <div>
                  <div className="cpo-opcion-title">Elijo este camino</div>
                  <div className="cpo-opcion-desc">Voy a crear un perfil nuevo, empiezo desde cero.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="cpo-card">
            <div className="cpo-step-label">PASO 2 DE 2</div>
            <div className="cpo-question">Cuéntanos de tu perfil</div>
            <div className="cpo-sub">
              {esPerfilNuevo
                ? 'Como es un perfil nuevo, tus seguidores probablemente sea 0 — así arrancas parejo con todos los que también empiezan desde cero.'
                : 'Escribe cuántos seguidores tienes ahorita mismo. Es tu línea de partida, no se juzga.'}
            </div>

            <span className="cpo-label">RED SOCIAL</span>
            <div className="cpo-redes">
              {REDES.map(r => (
                <div
                  key={r.id}
                  className={`cpo-red-chip ${redSocial === r.id ? 'activo' : ''}`}
                  onClick={() => setRedSocial(r.id)}
                >
                  <span>{r.icon}</span> {r.label}
                </div>
              ))}
            </div>

            <span className="cpo-label">TU USUARIO</span>
            <input
              className="cpo-input"
              placeholder="@tu.usuario"
              value={usuarioRed}
              onChange={(e) => setUsuarioRed(e.target.value)}
            />

            <span className="cpo-label">SEGUIDORES ACTUALES</span>
            <input
              className="cpo-input"
              type="number"
              min="0"
              placeholder="0"
              value={seguidores}
              onChange={(e) => setSeguidores(e.target.value)}
            />

            <button className="cpo-btn" disabled={enviando} onClick={confirmar}>
              {enviando ? 'GUARDANDO...' : 'SELLAR MI PUNTO DE PARTIDA'}
            </button>
            <button className="cpo-btn-ghost" onClick={() => setPaso(1)}>← REGRESAR</button>

            {error && <p className="cpo-error">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
