import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const STORAGE_KEY = 'camino_participante_codigo';

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
.cpl-input{width:100%; background:rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:10px; padding:13px 14px; color:var(--text); font-family:'Cinzel',serif; font-weight:700; letter-spacing:2px; font-size:16px; text-align:center; text-transform:uppercase; margin-bottom:14px;}
.cpl-input::placeholder{font-family:'Nunito',sans-serif; font-weight:400; letter-spacing:normal; text-transform:none; color:var(--muted);}
.cpl-input:focus{outline:none; border-color:var(--borderHi);}
.cpl-btn{width:100%; padding:13px 16px; background:rgba(212,175,55,0.12); border:1px solid var(--borderHi); border-radius:10px; color:var(--gold); font-family:'Cinzel',serif; font-weight:700; font-size:11px; letter-spacing:1.5px; cursor:pointer;}
.cpl-btn:disabled{opacity:0.5; cursor:default;}
.cpl-error{color:var(--red); font-size:11.5px; margin-top:12px; line-height:1.5;}
.cpl-icono{font-size:30px; margin-bottom:10px;}
.cpl-ayuda{margin-top:16px; font-size:11.5px; color:var(--muted); line-height:1.5;}
`;

export default function CaminoParticipanteLoginPage() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  async function verificarCodigo() {
    setMensajeError('');
    const codigoLimpio = codigo.trim().toUpperCase();

    if (!codigoLimpio) {
      setMensajeError('Escribe tu código de acceso.');
      return;
    }

    setVerificando(true);
    const { data, error } = await supabase.rpc('camino_verificar_codigo', { p_codigo: codigoLimpio });
    setVerificando(false);

    if (error || !data || data.length === 0) {
      setMensajeError('Código no válido o inactivo. Verifica con tu líder que esté bien escrito.');
      return;
    }

    localStorage.setItem(STORAGE_KEY, codigoLimpio);
    navigate('/camino/participante/panel', { replace: true });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') verificarCodigo();
  }

  return (
    <div className="cpl-root">
      <style>{styles}</style>
      <div className="cpl-centrado">
        <div className="cpl-tarjeta">
          <div className="cpl-icono">🗺️</div>
          <div className="cpl-eyebrow">CAMINO A LÍDER DIGITAL</div>
          <h1>Entra a tu Camino</h1>
          <p className="cpl-desc">Escribe el código que te dio tu líder para entrar a registrar tu evidencia.</p>
          <input
            type="text"
            className="cpl-input"
            placeholder="CAMINO-XXXX-XXXX"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCapitalize="characters"
          />
          <button className="cpl-btn" disabled={verificando} onClick={verificarCodigo}>
            {verificando ? 'VERIFICANDO...' : 'ENTRAR AL CAMINO'}
          </button>
          {mensajeError && <p className="cpl-error">{mensajeError}</p>}
          <p className="cpl-ayuda">¿No tienes código? Habla con tu líder para que te inscriba al Camino.</p>
        </div>
      </div>
    </div>
  );
}