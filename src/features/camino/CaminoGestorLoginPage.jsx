import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const STORAGE_KEY = 'camino_invite_token';

const styles = `
:root{
  --gold:#D4AF37; --gold-bright:#FFE566; --gold-dim:rgba(212,175,55,0.4); --gold-glow:rgba(212,175,55,0.65);
  --card:#0e0818; --border:rgba(212,175,55,0.15); --borderHi:rgba(212,175,55,0.4);
  --purple:#9b59ff; --text:#f0eaff; --muted:rgba(240,234,255,0.45);
  --green:#44ff88; --red:#ff4466; --bg:#07040f;
}
.cgl-root *,.cgl-root *::before,.cgl-root *::after{box-sizing:border-box;}
.cgl-root{min-height:100dvh; background:var(--bg); font-family:'Nunito',sans-serif; color:var(--text);}
.cgl-centrado{min-height:100dvh; display:flex; align-items:center; justify-content:center; padding:24px;}
.cgl-tarjeta{background:var(--card); border:1px solid var(--border); border-radius:16px; padding:clamp(24px,5vw,32px); max-width:380px; width:100%; text-align:center;}
.cgl-eyebrow{font-family:'Cinzel',serif; font-weight:900; font-size:10px; letter-spacing:2px; color:var(--gold);}
.cgl-tarjeta h1{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(19px,4vw,23px); color:var(--text); margin:6px 0 10px;}
.cgl-desc{color:var(--muted); font-size:12.5px; line-height:1.6; margin-bottom:20px;}
.cgl-input{width:100%; background:rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:10px; padding:12px 14px; color:var(--text); font-family:'Nunito',sans-serif; font-size:13px; margin-bottom:14px;}
.cgl-input:focus{outline:none; border-color:var(--borderHi);}
.cgl-btn{width:100%; padding:13px 16px; background:rgba(212,175,55,0.12); border:1px solid var(--borderHi); border-radius:10px; color:var(--gold); font-family:'Cinzel',serif; font-weight:700; font-size:11px; letter-spacing:1.5px; cursor:pointer;}
.cgl-btn:disabled{opacity:0.5; cursor:default;}
.cgl-error{color:var(--red); font-size:11.5px; margin-top:12px; line-height:1.5;}
.cgl-icono{font-size:30px; margin-bottom:10px;}
.cgl-spinner{width:22px; height:22px; border:2.5px solid var(--border); border-top-color:var(--gold); border-radius:50%; margin:0 auto; animation:cgl-girar 0.8s linear infinite;}
@keyframes cgl-girar{ to{ transform:rotate(360deg); } }
`;

export default function CaminoGestorLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pantalla, setPantalla] = useState('cargando'); // cargando | correo | enviado | invalida | error
  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [descCorreo, setDescCorreo] = useState('Escribe tu correo y te mandamos un link mágico para entrar. Sin contraseña.');
  const [descEnviado, setDescEnviado] = useState('');
  const [descErrorGeneral, setDescErrorGeneral] = useState('No se pudo verificar tu acceso. Intenta de nuevo.');

  async function init() {
    const tokenGuardado = localStorage.getItem(STORAGE_KEY);
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData?.session) {
      if (tokenGuardado) {
        setDescCorreo('Fuiste invitado como gestor. Escribe tu correo y te mandamos un link mágico para activar tu acceso.');
      }
      setPantalla('correo');
      return;
    }

    const uid = sessionData.session.user.id;

    if (tokenGuardado) {
      const { error } = await supabase.rpc('canjear_invitacion_gestor', { p_token: tokenGuardado });
      if (error) {
        localStorage.removeItem(STORAGE_KEY);
        setPantalla('invalida');
        return;
      }
      localStorage.removeItem(STORAGE_KEY);
      navigate('/camino/gestor/panel', { replace: true });
      return;
    }

    const { data: gestor } = await supabase
      .from('camino_gestores')
      .select('id')
      .eq('id', uid)
      .maybeSingle();

    if (gestor) {
      navigate('/camino/gestor/panel', { replace: true });
    } else {
      setDescErrorGeneral('Tu cuenta todavía no tiene una invitación de gestor asociada. Pide un link de invitación a tu líder.');
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

  async function enviarLink() {
    setMensajeError('');
    if (!correo.trim() || !correo.includes('@')) {
      setMensajeError('Escribe un correo válido.');
      return;
    }
    setEnviando(true);
    const tokenGuardado = localStorage.getItem(STORAGE_KEY);
    const baseUrl = `${window.location.origin}/camino/gestor/login`;
    const redirectUrl = tokenGuardado ? `${baseUrl}?invite=${tokenGuardado}` : baseUrl;

    const { error } = await supabase.auth.signInWithOtp({
      email: correo.trim(),
      options: { emailRedirectTo: redirectUrl }
    });
    setEnviando(false);

    if (error) {
      setMensajeError(`No se pudo enviar el link: ${error.message}`);
      return;
    }
    setDescEnviado(`Te mandamos un link a ${correo.trim()}. Ábrelo desde este mismo dispositivo para entrar.`);
    setPantalla('enviado');
  }

  return (
    <div className="cgl-root">
      <style>{styles}</style>
      <div className="cgl-centrado">

        {pantalla === 'cargando' && (
          <div className="cgl-tarjeta">
            <div className="cgl-spinner"></div>
            <p className="cgl-desc" style={{ marginTop: 16, marginBottom: 0 }}>Verificando acceso...</p>
          </div>
        )}

        {pantalla === 'correo' && (
          <div className="cgl-tarjeta">
            <div className="cgl-icono">⚜️</div>
            <div className="cgl-eyebrow">CAMINO A LÍDER DIGITAL</div>
            <h1>Acceso de Gestor</h1>
            <p className="cgl-desc">{descCorreo}</p>
            <input
              type="email"
              className="cgl-input"
              placeholder="tu@correo.com"
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
            <button className="cgl-btn" disabled={enviando} onClick={enviarLink}>
              {enviando ? 'ENVIANDO...' : 'ENVIAR LINK MÁGICO'}
            </button>
            {mensajeError && <p className="cgl-error">{mensajeError}</p>}
          </div>
        )}

        {pantalla === 'enviado' && (
          <div className="cgl-tarjeta">
            <div className="cgl-icono">📬</div>
            <div className="cgl-eyebrow">CAMINO A LÍDER DIGITAL</div>
            <h1>Revisa tu correo</h1>
            <p className="cgl-desc">{descEnviado}</p>
          </div>
        )}

        {pantalla === 'invalida' && (
          <div className="cgl-tarjeta">
            <div className="cgl-icono">🔒</div>
            <div className="cgl-eyebrow">CAMINO A LÍDER DIGITAL</div>
            <h1>Invitación no válida</h1>
            <p className="cgl-desc">Este link de invitación ya fue usado o venció. Pide uno nuevo a tu líder.</p>
          </div>
        )}

        {pantalla === 'error' && (
          <div className="cgl-tarjeta">
            <div className="cgl-icono">⚠️</div>
            <div className="cgl-eyebrow">CAMINO A LÍDER DIGITAL</div>
            <h1>Algo salió mal</h1>
            <p className="cgl-desc">{descErrorGeneral}</p>
            <button className="cgl-btn" onClick={() => navigate(0)}>REINTENTAR</button>
          </div>
        )}

      </div>
    </div>
  );
}