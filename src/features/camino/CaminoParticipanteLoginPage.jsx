import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabaseCamino as supabase } from '../../services/supabaseCamino';

const STORAGE_KEY = 'camino_participante_invite_token';

const styles = `
:root{
  --gold:#D4AF37; --gold-bright:#FFE566; --gold-dim:rgba(212,175,55,0.4); --gold-glow:rgba(212,175,55,0.65);
  --card:#0e0818; --border:rgba(212,175,55,0.15); --borderHi:rgba(212,175,55,0.4);
  --purple:#9b59ff; --text:#f0eaff; --muted:rgba(240,234,255,0.45);
  --green:#44ff88; --red:#ff4466; --bg:#07040f;
}
.cpl-root *,.cpl-root *::before,.cpl-root *::after{box-sizing:border-box;}
.cpl-root{min-height:100dvh; background:var(--bg); font-family:'Nunito',sans-serif; color:var(--text);}
.cpl-centrado{min-height:100dvh; display:flex; align-items:center; justify-content:center; padding:24px;}
.cpl-tarjeta{background:var(--card); border:1px solid var(--border); border-radius:16px; padding:clamp(24px,5vw,32px); max-width:380px; width:100%; text-align:center;}
.cpl-eyebrow{font-family:'Cinzel',serif; font-weight:900; font-size:10px; letter-spacing:2px; color:var(--gold);}
.cpl-tarjeta h1{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(19px,4vw,23px); color:var(--text); margin:6px 0 10px;}
.cpl-desc{color:var(--muted); font-size:12.5px; line-height:1.6; margin-bottom:20px;}
.cpl-input{width:100%; background:rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:10px; padding:12px 14px; color:var(--text); font-family:'Nunito',sans-serif; font-size:13px; margin-bottom:12px;}
.cpl-input:focus{outline:none; border-color:var(--borderHi);}
.cpl-btn{width:100%; padding:13px 16px; background:rgba(212,175,55,0.12); border:1px solid var(--borderHi); border-radius:10px; color:var(--gold); font-family:'Cinzel',serif; font-weight:700; font-size:11px; letter-spacing:1.5px; cursor:pointer;}
.cpl-btn:disabled{opacity:0.5; cursor:default;}
.cpl-error{color:var(--red); font-size:11.5px; margin-top:12px; line-height:1.5;}
.cpl-icono{font-size:30px; margin-bottom:10px;}
.cpl-ayuda{margin-top:16px; font-size:11.5px; color:var(--muted); line-height:1.5;}
.cpl-spinner{width:22px; height:22px; border:2.5px solid var(--border); border-top-color:var(--gold); border-radius:50%; margin:0 auto; animation:cpl-girar 0.8s linear infinite;}
@keyframes cpl-girar{ to{ transform:rotate(360deg); } }

.cpl-google-btn{
  width:100%; display:flex; align-items:center; justify-content:center; gap:10px;
  padding:12px 16px; background:#fff; border:1px solid rgba(255,255,255,0.9); border-radius:10px;
  color:#1a1a1a; font-family:'Nunito',sans-serif; font-weight:700; font-size:13px; cursor:pointer; margin-bottom:16px;
}
.cpl-google-btn:disabled{opacity:0.6; cursor:default;}
.cpl-divider{display:flex; align-items:center; gap:10px; margin:16px 0; color:var(--muted); font-size:11px;}
.cpl-divider::before,.cpl-divider::after{content:""; flex:1; height:1px; background:var(--border);}

.cpl-tabs{display:flex; gap:6px; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:10px; padding:4px; margin-bottom:16px;}
.cpl-tab{flex:1; padding:9px 8px; border:none; border-radius:8px; background:transparent; color:var(--muted); font-family:'Cinzel',serif; font-weight:700; font-size:10.5px; letter-spacing:0.5px; cursor:pointer;}
.cpl-tab-activo{background:rgba(212,175,55,0.14); color:var(--gold-bright); border:1px solid var(--borderHi);}
`;

export default function CaminoParticipanteLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pantalla, setPantalla] = useState('cargando'); // cargando | entrada | enviado | invalida | error
  const [modoAuth, setModoAuth] = useState('magico'); // magico | password
  const [invitado, setInvitado] = useState(false);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviandoGoogle, setEnviandoGoogle] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [descEnviado, setDescEnviado] = useState('');
  const [descErrorGeneral, setDescErrorGeneral] = useState('No se pudo verificar tu acceso. Intenta de nuevo.');

  function baseRedirectUrl() {
    const tokenGuardado = localStorage.getItem(STORAGE_KEY);
    const base = `${window.location.origin}/camino/participante/login`;
    return tokenGuardado ? `${base}?invite=${tokenGuardado}` : base;
  }

  async function init() {
    const tokenGuardado = localStorage.getItem(STORAGE_KEY);
    setInvitado(!!tokenGuardado);
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session) {
      setPantalla('entrada');
      return;
    }

    if (tokenGuardado) {
      const { error } = await supabase.rpc('canjear_invitacion_participante', { p_token: tokenGuardado });
      if (error) {
        localStorage.removeItem(STORAGE_KEY);
        setPantalla('invalida');
        return;
      }
      localStorage.removeItem(STORAGE_KEY);
      navigate('/camino/participante/home', { replace: true });
      return;
    }

    const uid = sessionData.session.user.id;
    const { data: participante } = await supabase
      .from('camino_participantes')
      .select('id')
      .eq('id', uid)
      .maybeSingle();

    if (participante) {
      navigate('/camino/participante/home', { replace: true });
    } else {
      setDescErrorGeneral('Tu cuenta todavía no tiene un acceso de Líder Digital asociado. Pide un link de invitación a tu gestor.');
      setPantalla('error');
    }
  }

  useEffect(() => {
    const inviteEnUrl = searchParams.get('invite');
    if (inviteEnUrl) localStorage.setItem(STORAGE_KEY, inviteEnUrl);
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') init();
    });
    return () => listener?.subscription?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function entrarConGoogle() {
    setMensajeError('');
    setEnviandoGoogle(true);
    const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: baseRedirectUrl(),
    queryParams: { prompt: 'select_account' },
  },
});
    if (error) {
      setEnviandoGoogle(false);
      setMensajeError(`No se pudo entrar con Google: ${error.message}`);
    }
    // si no hay error, el navegador redirige a Google — no hay más que hacer aquí
  }

  async function enviarLinkMagico() {
    setMensajeError('');
    if (!correo.trim() || !correo.includes('@')) {
      setMensajeError('Escribe un correo válido.');
      return;
    }
    setEnviando(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: correo.trim(),
      options: { emailRedirectTo: baseRedirectUrl() },
    });
    setEnviando(false);

    if (error) {
      setMensajeError(`No se pudo enviar el link: ${error.message}`);
      return;
    }
    setDescEnviado(`Te mandamos un link a ${correo.trim()}. Ábrelo desde este mismo dispositivo para entrar.`);
    setPantalla('enviado');
  }

  async function entrarConPassword() {
    setMensajeError('');
    if (!correo.trim() || !correo.includes('@')) {
      setMensajeError('Escribe un correo válido.');
      return;
    }
    if (!password || password.length < 6) {
      setMensajeError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setEnviando(true);

    if (invitado) {
      const { data, error } = await supabase.auth.signUp({
        email: correo.trim(),
        password,
        options: { emailRedirectTo: baseRedirectUrl() },
      });
      setEnviando(false);
      if (error) {
        setMensajeError(`No se pudo crear tu acceso: ${error.message}`);
        return;
      }
      if (data?.session) {
        // confirmación automática activa en el proyecto: ya hay sesión, init() la toma
        return;
      }
      setDescEnviado(`Casi listo. Te mandamos un correo de confirmación a ${correo.trim()}. Ábrelo desde este mismo dispositivo para activar tu acceso.`);
      setPantalla('enviado');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password });
    setEnviando(false);
    if (error) {
      setMensajeError(`No se pudo entrar: ${error.message}`);
    }
    // si no hay error, onAuthStateChange dispara init()
  }

  function handleSubmit() {
    if (modoAuth === 'magico') enviarLinkMagico();
    else entrarConPassword();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    <div className="cpl-root">
      <style>{styles}</style>
      <div className="cpl-centrado">

        {pantalla === 'cargando' && (
          <div className="cpl-tarjeta">
            <div className="cpl-spinner"></div>
            <p className="cpl-desc" style={{ marginTop: 16, marginBottom: 0 }}>Verificando acceso...</p>
          </div>
        )}

        {pantalla === 'entrada' && (
          <div className="cpl-tarjeta">
            <div className="cpl-icono">🗺️</div>
            <div className="cpl-eyebrow">CAMINO A LÍDER DIGITAL</div>
            <h1>{invitado ? 'Activa tu acceso' : 'Entra a tu Camino'}</h1>
            <p className="cpl-desc">
              {invitado
                ? 'Fuiste invitado a ser Líder Digital. Elige cómo quieres crear tu acceso.'
                : 'Elige cómo quieres entrar.'}
            </p>

            <button className="cpl-google-btn" disabled={enviandoGoogle} onClick={entrarConGoogle}>
              {enviandoGoogle ? 'CONECTANDO...' : (
                <>
                  <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.9 5.1 29.7 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.6 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.9 5.1 29.7 3 24 3c-7.7 0-14.3 4.3-17.7 10.7z"/><path fill="#4CAF50" d="M24 45c5.6 0 10.7-1.9 14.6-5.2l-6.7-5.7C29.8 35.9 27 37 24 37c-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.6 40.5 16.3 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.7 5.7C41.7 36 45 30.6 45 24c0-1.4-.1-2.7-.4-3.5z"/></svg>
                  Continuar con Google
                </>
              )}
            </button>

            <div className="cpl-divider">o</div>

            <div className="cpl-tabs">
              <button className={`cpl-tab ${modoAuth === 'magico' ? 'cpl-tab-activo' : ''}`} onClick={() => setModoAuth('magico')}>✨ LINK MÁGICO</button>
              <button className={`cpl-tab ${modoAuth === 'password' ? 'cpl-tab-activo' : ''}`} onClick={() => setModoAuth('password')}>🔒 CONTRASEÑA</button>
            </div>

            <input
              type="email"
              className="cpl-input"
              placeholder="tu@correo.com"
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {modoAuth === 'password' && (
              <input
                type="password"
                className="cpl-input"
                placeholder={invitado ? 'Crea una contraseña' : 'Tu contraseña'}
                autoComplete={invitado ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            )}

            <button className="cpl-btn" disabled={enviando} onClick={handleSubmit}>
              {enviando
                ? 'PROCESANDO...'
                : modoAuth === 'magico'
                  ? 'ENVIAR LINK MÁGICO'
                  : invitado ? 'CREAR ACCESO' : 'ENTRAR'}
            </button>

            {mensajeError && <p className="cpl-error">{mensajeError}</p>}
            {!invitado && <p className="cpl-ayuda">¿No tienes invitación? Habla con tu gestor para que te acepte al Camino.</p>}
          </div>
        )}

        {pantalla === 'enviado' && (
          <div className="cpl-tarjeta">
            <div className="cpl-icono">📬</div>
            <div className="cpl-eyebrow">CAMINO A LÍDER DIGITAL</div>
            <h1>Revisa tu correo</h1>
            <p className="cpl-desc">{descEnviado}</p>
          </div>
        )}

        {pantalla === 'invalida' && (
          <div className="cpl-tarjeta">
            <div className="cpl-icono">🔒</div>
            <div className="cpl-eyebrow">CAMINO A LÍDER DIGITAL</div>
            <h1>Invitación no válida</h1>
            <p className="cpl-desc">Este link de invitación ya fue usado o venció. Pide uno nuevo a tu gestor.</p>
          </div>
        )}

        {pantalla === 'error' && (
          <div className="cpl-tarjeta">
            <div className="cpl-icono">⚠️</div>
            <div className="cpl-eyebrow">CAMINO A LÍDER DIGITAL</div>
            <h1>Algo salió mal</h1>
            <p className="cpl-desc">{descErrorGeneral}</p>
            <button className="cpl-btn" onClick={() => navigate(0)}>REINTENTAR</button>
          </div>
        )}

      </div>
    </div>
  );
}