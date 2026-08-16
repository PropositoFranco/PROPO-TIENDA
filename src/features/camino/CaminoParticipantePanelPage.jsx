import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const STORAGE_KEY = 'camino_participante_codigo';

const styles = `
:root{
  --gold:#D4AF37; --gold-bright:#FFE566; --gold-dim:rgba(212,175,55,0.4); --gold-glow:rgba(212,175,55,0.65);
  --dark-bg:#04020e; --dark-surface:rgba(10,5,32,0.92);
  --purple:#CC44FF;
  --lilac:rgba(200,185,240,0.68); --lilac-dim:rgba(200,185,240,0.42);
  --green:#44ff88; --red:#ff4466;
}
.ctp-root *,.ctp-root *::before,.ctp-root *::after{margin:0;padding:0;box-sizing:border-box;}
.ctp-root{
  min-height:100dvh; width:100%;
  background:
    radial-gradient(ellipse 120% 50% at 50% 0%, rgba(40,10,90,0.9) 0%, transparent 60%),
    radial-gradient(ellipse 70% 40% at 12% 15%, rgba(10,40,100,0.35) 0%, transparent 55%),
    radial-gradient(ellipse 70% 40% at 88% 10%, rgba(80,10,110,0.35) 0%, transparent 55%),
    linear-gradient(180deg,#050215 0%,#0a0530 18%,#08031c 55%,#04020e 100%);
  font-family:'Crimson Text',serif; color:#fff; position:relative;
}
.ctp-stars{position:fixed; inset:0; pointer-events:none; z-index:0;}
.ctp-star{position:absolute; border-radius:50%; background:#fff; animation:ctp-twinkle var(--d) ease-in-out infinite; animation-delay:var(--del);}
@keyframes ctp-twinkle{0%,100%{opacity:var(--min);} 50%{opacity:1;}}

.ctp-topnav{
  display:flex; align-items:center; justify-content:space-between; gap:14px;
  padding:12px 26px;
  background:linear-gradient(180deg, rgba(6,3,18,0.97), rgba(6,3,18,0.88));
  border-bottom:1px solid var(--gold-dim);
  position:relative; z-index:10;
}
.ctp-brand{display:flex; align-items:center; gap:10px;}
.ctp-brand-name{font-family:'Cinzel',serif; font-weight:900; letter-spacing:1px; font-size:16px; color:#fff;}
.ctp-brand-name span{color:var(--gold);}
.ctp-salir{
  font-family:'Cinzel',serif; font-size:11px; font-weight:700; letter-spacing:0.5px;
  color:var(--lilac); text-decoration:none; opacity:0.75; cursor:pointer; background:none; border:none;
}
.ctp-salir:hover{opacity:1; color:var(--gold-bright);}

.ctp-wrap{
  max-width:900px; width:100%; margin:0 auto;
  padding:clamp(20px,4vh,40px) clamp(20px,4vw,40px);
  position:relative; z-index:1; display:flex; flex-direction:column; gap:clamp(16px,2.4vh,26px);
}

.ctp-eyebrow-row{display:flex; align-items:center; gap:16px;}
.ctp-eyebrow-icon{
  width:56px; height:56px; flex-shrink:0;
  border-radius:50%; border:2px solid var(--gold);
  background:radial-gradient(circle at 35% 30%, rgba(255,229,102,0.35), rgba(212,175,55,0.12) 65%, transparent 100%);
  box-shadow:0 0 18px var(--gold-glow);
  display:flex; align-items:center; justify-content:center; font-size:26px;
}
.ctp-eyebrow-tag{font-family:'Cinzel',serif; font-size:13px; font-weight:900; letter-spacing:2.4px; color:var(--gold);}
h1.ctp-title{font-family:'Cinzel Decorative',serif; font-weight:900; font-size:clamp(24px,4vh,34px); line-height:1.15; color:#fff;}

.ctp-card{
  background:var(--dark-surface); border:1px solid var(--gold-dim); border-radius:16px;
  padding:clamp(18px,2.6vh,28px) clamp(18px,2.4vw,28px); position:relative; overflow:hidden;
}
.ctp-card::before{content:""; position:absolute; inset:0; background:radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,175,55,0.08), transparent 70%); pointer-events:none;}

.ctp-countdown{text-align:center; display:flex; flex-direction:column; align-items:center; gap:10px; position:relative;}
.ctp-day-label{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(22px,3.4vh,30px); color:#fff;}
.ctp-day-label .num{color:var(--gold-bright);}
.ctp-day-sub{font-family:'Nunito',sans-serif; font-size:14px; color:var(--lilac); max-width:360px;}

.ctp-section-label{
  font-family:'Cinzel',serif; font-weight:900; font-size:15px; letter-spacing:0.3px;
  color:#fff; margin-bottom:12px; display:flex; align-items:center; gap:9px;
}
.ctp-section-label::before{content:""; width:4px; height:15px; background:var(--gold); border-radius:2px; display:inline-block;}

.ctp-form-row{display:flex; flex-direction:column; gap:6px; margin-bottom:14px;}
.ctp-form-row label{font-family:'Nunito',sans-serif; font-weight:700; font-size:12px; color:var(--gold-bright); letter-spacing:0.3px;}
.ctp-select, .ctp-input-text{
  background:rgba(255,255,255,0.04); border:1px solid var(--gold-dim); border-radius:10px;
  padding:11px 14px; color:#fff; font-family:'Nunito',sans-serif; font-size:14px;
}
.ctp-select:focus, .ctp-input-text:focus{outline:none; border-color:var(--gold);}
.ctp-radio-row{display:flex; gap:10px; flex-wrap:wrap;}
.ctp-radio-chip{
  padding:9px 16px; border-radius:20px; border:1px solid var(--gold-dim); background:rgba(212,175,55,0.06);
  font-family:'Cinzel',serif; font-weight:700; font-size:12px; letter-spacing:0.3px; color:var(--lilac);
  cursor:pointer; transition:all .15s;
}
.ctp-radio-chip.active{background:rgba(212,175,55,0.22); border-color:var(--gold); color:var(--gold-bright);}

.ctp-btn{
  width:100%; padding:14px 16px; margin-top:6px;
  background:rgba(212,175,55,0.14); border:1px solid var(--gold); border-radius:10px;
  color:var(--gold-bright); font-family:'Cinzel',serif; font-weight:900; font-size:12px; letter-spacing:1.5px; cursor:pointer;
}
.ctp-btn:disabled{opacity:0.5; cursor:default;}
.ctp-msg-ok{color:var(--green); font-size:13px; margin-top:12px; text-align:center;}
.ctp-msg-error{color:var(--red); font-size:13px; margin-top:12px; text-align:center;}

.ctp-locked{
  display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; padding:20px 10px;
}
.ctp-locked-icon{font-size:32px;}
.ctp-locked-text{font-family:'Nunito',sans-serif; font-size:14px; color:var(--lilac); max-width:320px;}

.ctp-material-item{
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  padding:14px 16px; border-radius:11px; margin-bottom:10px;
  background:rgba(212,175,55,0.07); border:1px solid var(--gold-dim);
  text-decoration:none; color:#fff;
}
.ctp-material-item:hover{background:rgba(212,175,55,0.13); border-color:var(--gold);}
.ctp-material-left{display:flex; align-items:center; gap:12px;}
.ctp-material-icon{
  width:38px; height:38px; border-radius:10px; flex-shrink:0;
  background:linear-gradient(160deg, rgba(212,175,55,0.3), rgba(124,58,237,0.2));
  display:flex; align-items:center; justify-content:center; font-size:18px; border:1px solid var(--gold-dim);
}
.ctp-material-title{font-family:'Cinzel',serif; font-weight:700; font-size:15px;}
.ctp-material-cta{font-family:'Cinzel',serif; font-weight:900; font-size:12px; letter-spacing:0.5px; color:var(--gold-bright); white-space:nowrap;}

.ctp-loading, .ctp-error-full{
  min-height:100dvh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; text-align:center; padding:24px;
}
.ctp-spinner{width:26px; height:26px; border:2.5px solid var(--gold-dim); border-top-color:var(--gold); border-radius:50%; animation:ctp-girar 0.8s linear infinite;}
@keyframes ctp-girar{ to{ transform:rotate(360deg); } }
.ctp-error-full .ctp-btn{max-width:260px;}
`;

const FORMATOS = ['Reel', 'TikTok', 'Historia', 'Post', 'Carrusel'];
const PLATAFORMAS = ['Instagram', 'TikTok', 'Facebook', 'YouTube'];

export default function CaminoParticipantePanelPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // cargando | listo | sin_codigo | error
  const [participante, setParticipante] = useState(null);

  const [formato, setFormato] = useState(FORMATOS[0]);
  const [plataforma, setPlataforma] = useState(PLATAFORMAS[0]);
  const [linkPost, setLinkPost] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [msgOk, setMsgOk] = useState('');
  const [msgError, setMsgError] = useState('');

  async function cargar() {
    const codigo = localStorage.getItem(STORAGE_KEY);
    if (!codigo) {
      setEstado('sin_codigo');
      return;
    }

    const { data, error } = await supabase.rpc('camino_verificar_codigo', { p_codigo: codigo });

    if (error || !data || data.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      setEstado('sin_codigo');
      return;
    }

    setParticipante(data[0]);
    setEstado('listo');
  }

  useEffect(() => { cargar(); }, []);

  async function enviarCheckin() {
    setMsgError('');
    setMsgOk('');
    if (!linkPost.trim()) {
      setMsgError('Pega el link de tu publicación.');
      return;
    }

    setEnviando(true);
    const codigo = localStorage.getItem(STORAGE_KEY);
    const { error } = await supabase.rpc('camino_registrar_checkin', {
      p_codigo: codigo,
      p_dia_numero: participante.dia_actual,
      p_formato: formato,
      p_plataforma: plataforma,
      p_video_url: null,
      p_link_post: linkPost.trim(),
    });
    setEnviando(false);

    if (error) {
      setMsgError('No se pudo registrar tu evidencia. Intenta de nuevo.');
      return;
    }
    setMsgOk('¡Evidencia registrada! Sigue así, Templario.');
    setLinkPost('');
  }

  function salir() {
    localStorage.removeItem(STORAGE_KEY);
    navigate('/camino/participante/login', { replace: true });
  }

  if (estado === 'cargando') {
    return (
      <div className="ctp-root">
        <style>{styles}</style>
        <div className="ctp-loading">
          <div className="ctp-spinner"></div>
          <p style={{ color: 'var(--lilac)', fontFamily: "'Nunito',sans-serif", fontSize: 14 }}>Verificando tu acceso...</p>
        </div>
      </div>
    );
  }

  if (estado === 'sin_codigo') {
    return (
      <div className="ctp-root">
        <style>{styles}</style>
        <div className="ctp-error-full">
          <div style={{ fontSize: 32 }}>🔒</div>
          <h1 className="ctp-title" style={{ fontSize: 22 }}>Necesitas tu código</h1>
          <p style={{ color: 'var(--lilac)', fontFamily: "'Nunito',sans-serif", fontSize: 14, maxWidth: 320 }}>
            No encontramos una sesión activa. Entra con tu código de acceso.
          </p>
          <button className="ctp-btn" onClick={() => navigate('/camino/participante/login')}>IR AL LOGIN</button>
        </div>
      </div>
    );
  }

  const diaActual = participante?.dia_actual ?? 1;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaInicioParticipante = participante?.fecha_inicio ? new Date(participante.fecha_inicio + 'T00:00:00') : null;
  const yaEmpezo = fechaInicioParticipante ? hoy >= fechaInicioParticipante : false;
  const fechaInicioTexto = fechaInicioParticipante
    ? fechaInicioParticipante.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
    : '';

  return (
    <div className="ctp-root">
      <style>{styles}</style>
      <div className="ctp-stars" id="ctp-stars"></div>

      <nav className="ctp-topnav">
        <div className="ctp-brand">
          <div className="ctp-brand-name">TEMPLO <span>DEL PROPÓSITO</span></div>
        </div>
        <button className="ctp-salir" onClick={salir}>Salir</button>
      </nav>

      <div className="ctp-wrap">
        <div className="ctp-eyebrow-row">
          <div className="ctp-eyebrow-icon">🗺️</div>
          <div>
            <div className="ctp-eyebrow-tag">TU CAMINO ESTÁ EN MARCHA</div>
            <h1 className="ctp-title">Hola, {participante?.nombre?.split(' ')[0] || 'Templario'}</h1>
          </div>
        </div>

        <div className="ctp-card">
          <div className="ctp-countdown">
            {yaEmpezo ? (
              <>
                <div className="ctp-day-label">Día <span className="num">{diaActual}</span> de tu Camino</div>
                <div className="ctp-day-sub">Publica tu evidencia de hoy para mantener tu constancia.</div>
              </>
            ) : (
              <>
                <div className="ctp-day-label">Empieza el <span className="num">{fechaInicioTexto}</span></div>
                <div className="ctp-day-sub">Cuando arranque tu camino, aquí registrarás tu evidencia del día.</div>
              </>
            )}
          </div>
        </div>

        <div className="ctp-card">
          <div className="ctp-section-label">Registrar evidencia de hoy</div>

          {yaEmpezo && (
            <>
              <div className="ctp-form-row">
                <label>Formato</label>
                <div className="ctp-radio-row">
                  {FORMATOS.map(f => (
                    <div key={f} className={`ctp-radio-chip ${formato === f ? 'active' : ''}`} onClick={() => setFormato(f)}>{f}</div>
                  ))}
                </div>
              </div>
              <div className="ctp-form-row">
                <label>Plataforma</label>
                <div className="ctp-radio-row">
                  {PLATAFORMAS.map(p => (
                    <div key={p} className={`ctp-radio-chip ${plataforma === p ? 'active' : ''}`} onClick={() => setPlataforma(p)}>{p}</div>
                  ))}
                </div>
              </div>
              <div className="ctp-form-row">
                <label>Link de tu publicación</label>
                <input
                  type="text"
                  className="ctp-input-text"
                  placeholder="https://..."
                  value={linkPost}
                  onChange={(e) => setLinkPost(e.target.value)}
                />
              </div>
              <button className="ctp-btn" disabled={enviando} onClick={enviarCheckin}>
                {enviando ? 'REGISTRANDO...' : 'REGISTRAR EVIDENCIA'}
              </button>
              {msgOk && <p className="ctp-msg-ok">{msgOk}</p>}
              {msgError && <p className="ctp-msg-error">{msgError}</p>}
            </>
          )}
          {!yaEmpezo && (
            <div className="ctp-locked">
              <div className="ctp-locked-icon">🔒</div>
              <div className="ctp-locked-text">El registro de evidencia se desbloquea el día que arranca tu camino.</div>
            </div>
          )}
        </div>

        <div>
          <div className="ctp-section-label">Material del camino</div>
          <a className="ctp-material-item" href="/bases-camino.html">
            <div className="ctp-material-left">
              <div className="ctp-material-icon">📜</div>
              <div className="ctp-material-title">Las Bases del Camino</div>
            </div>
            <div className="ctp-material-cta">ABRIR →</div>
          </a>
        </div>
      </div>
    </div>
  );
}