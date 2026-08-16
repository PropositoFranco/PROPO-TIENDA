import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const styles = `
:root{
  --gold:#D4AF37; --gold-bright:#FFE566; --gold-dim:rgba(212,175,55,0.4); --gold-glow:rgba(212,175,55,0.65);
  --card:#0e0818; --border:rgba(212,175,55,0.15); --borderHi:rgba(212,175,55,0.4);
  --purple:#9b59ff; --text:#f0eaff; --muted:rgba(240,234,255,0.45);
  --green:#44ff88; --red:#ff4466; --bg:#07040f;
}
.cgp-root *,.cgp-root *::before,.cgp-root *::after{box-sizing:border-box;}
.cgp-root{min-height:100dvh; background:var(--bg); font-family:'Nunito',sans-serif; color:var(--text); padding:clamp(16px,3vw,32px);}
.cgp-wrap{max-width:860px; margin:0 auto; display:flex; flex-direction:column; gap:20px;}
.cgp-centrado{min-height:100dvh; display:flex; align-items:center; justify-content:center; padding:24px;}
.cgp-tarjeta{background:var(--card); border:1px solid var(--border); border-radius:16px; padding:clamp(18px,4vw,24px);}
.cgp-titulo-tarjeta{font-family:'Cinzel',serif; font-weight:700; font-size:13px; letter-spacing:2px; color:var(--gold); margin:0 0 8px;}
.cgp-fila{display:flex; align-items:center; justify-content:space-between; gap:12px; background:rgba(255,255,255,0.03); border-radius:10px; padding:12px 14px; flex-wrap:wrap;}
.cgp-fila-hist{display:flex; align-items:center; justify-content:space-between; gap:12px; background:rgba(255,255,255,0.03); border-radius:10px; padding:10px 14px; flex-wrap:wrap; margin-top:8px;}
.cgp-btn-aceptar{padding:8px 14px; background:rgba(68,255,136,0.12); border:1px solid rgba(68,255,136,0.35); border-radius:8px; color:var(--green); font-family:'Cinzel',serif; font-size:9px; letter-spacing:1px; cursor:pointer;}
.cgp-btn-descartar{padding:8px 14px; background:rgba(255,68,102,0.1); border:1px solid rgba(255,68,102,0.3); border-radius:8px; color:var(--red); font-family:'Cinzel',serif; font-size:9px; letter-spacing:1px; cursor:pointer;}
.cgp-btn-invitar{padding:10px 18px; background:rgba(155,89,255,0.12); border:1px solid rgba(155,89,255,0.35); border-radius:10px; color:var(--purple); font-family:'Cinzel',serif; font-weight:700; font-size:11px; letter-spacing:1px; cursor:pointer;}
.cgp-root button:disabled{opacity:0.5; cursor:default;}
.cgp-modal-fondo{position:fixed; inset:0; background:rgba(4,2,14,0.88); z-index:9999; display:flex; align-items:center; justify-content:center;}
.cgp-modal-caja{background:var(--card); border:1.5px solid var(--borderHi); border-radius:20px; padding:32px 28px; text-align:center; max-width:340px; width:90%;}
.cgp-modal-cerrar{margin-top:16px; background:none; border:none; color:var(--muted); font-family:'Cinzel',serif; font-size:9px; cursor:pointer; letter-spacing:1px;}
.cgp-root input[type=date]{background:rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:8px; padding:6px 10px; color:var(--text); font-family:'Cinzel',serif; font-size:11px;}
`;

function copiar(texto) { navigator.clipboard?.writeText(texto).catch(() => {}); }

export default function CaminoGestorPanelPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('verificando'); // verificando | sinAcceso | panel
  const [nombreGestor, setNombreGestor] = useState('');
  const [pendientes, setPendientes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [aceptandoId, setAceptandoId] = useState(null);
  const [modalCodigo, setModalCodigo] = useState(null);
  const [modalInvite, setModalInvite] = useState(null);
  const [invitando, setInvitando] = useState(false);

  const BASE_URL = window.location.origin;

  async function cargarInteresados() {
    const { data, error } = await supabase.rpc('listar_mis_interesados_camino');
    const lista = error ? [] : (data || []);
    setPendientes(lista.filter(i => i.estado === 'pendiente'));
    setHistorial(lista.filter(i => i.estado !== 'pendiente'));
  }

  async function verificarAcceso() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      navigate('/camino/gestor/login', { replace: true });
      return;
    }
    const uid = sessionData.session.user.id;
    const { data: gestor } = await supabase
      .from('camino_gestores')
      .select('nombre, activo')
      .eq('id', uid)
      .maybeSingle();

    if (!gestor || gestor.activo === false) {
      setEstado('sinAcceso');
      return;
    }

    if (gestor.nombre) setNombreGestor(gestor.nombre);
    setEstado('panel');
    cargarInteresados();
  }

  useEffect(() => { verificarAcceso(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function aceptarInteresado(item) {
    setAceptandoId(item.id);
    const hoy = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase.rpc('aceptar_interesado_camino_gestor', {
      p_interesado_id: item.id, p_fecha_inicio: hoy, p_cohorte: null
    });
    setAceptandoId(null);
    if (error) { alert('Error al aceptar: ' + error.message); return; }
    const nuevo = data?.[0];
    if (nuevo) {
      setModalCodigo({
        nombre: nuevo.nombre,
        telefono: nuevo.telefono,
        url: `${BASE_URL}/camino/participante/login?invite=${nuevo.token}`,
      });
    }
    cargarInteresados();
  }

  async function descartarInteresado(id) {
    const { error } = await supabase.rpc('descartar_interesado_camino_gestor', { p_interesado_id: id });
    if (error) { alert('No se pudo descartar: ' + error.message); return; }
    cargarInteresados();
  }

  async function generarInvitacion() {
    setInvitando(true);
    const { data, error } = await supabase.rpc('generar_invitacion_gestor', { p_nombre: null });
    setInvitando(false);
    if (error) { alert('No se pudo generar la invitación: ' + error.message); return; }
    const inv = data?.[0];
    if (inv) {
      setModalInvite({ url: `${BASE_URL}/camino/gestor/login?invite=${inv.token}` });
    }
  }

  if (estado === 'verificando') {
    return (
      <div className="cgp-root">
        <style>{styles}</style>
        <div className="cgp-centrado">
          <div style={{ color: 'var(--muted)', fontFamily: "'Cinzel',serif", fontSize: 12, letterSpacing: 1 }}>Verificando acceso...</div>
        </div>
      </div>
    );
  }

  if (estado === 'sinAcceso') {
    return (
      <div className="cgp-root">
        <style>{styles}</style>
        <div className="cgp-centrado">
          <div className="cgp-tarjeta" style={{ textAlign: 'center', maxWidth: 360 }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>🔒</div>
            <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: 15, color: 'var(--gold)', marginBottom: 8 }}>Sin acceso de gestor</div>
            <p style={{ color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.6 }}>Tu cuenta todavía no tiene permisos de gestor del Camino. Pide un link de invitación a tu líder.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cgp-root">
      <style>{styles}</style>
      <div className="cgp-wrap">

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: 10, letterSpacing: 2, color: 'var(--gold)' }}>PANEL DE GESTOR</div>
            <h1 style={{ fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: 'clamp(20px,3vw,26px)', color: 'var(--text)', margin: '4px 0 0' }}>
              {nombreGestor ? `Hola, ${nombreGestor}` : 'Tu Camino'}
            </h1>
          </div>
          <button className="cgp-btn-invitar" disabled={invitando} onClick={generarInvitacion}>
            {invitando ? 'GENERANDO...' : '+ INVITAR NUEVO GESTOR'}
          </button>
        </div>

        <div className="cgp-tarjeta">
          <h2 className="cgp-titulo-tarjeta">🗺️ INTERESADOS</h2>
          <p style={{ color: 'var(--muted)', fontSize: 11.5, marginBottom: 16 }}>Prospectos que te tocan a ti. Acéptalos después de tu junta 1 a 1 — se genera su link de invitación y se lo mandas por WhatsApp.</p>

          {pendientes.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 12 }}>No hay interesados pendientes.</p>
          ) : pendientes.map(i => (
            <div className="cgp-fila" key={i.id}>
              <div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, color: 'var(--text)' }}>{i.nombre}</div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 1, color: 'var(--muted)', marginTop: 2 }}>
                  📱 {i.telefono || ''} · {new Date(i.created_at).toLocaleString('es-MX')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="cgp-btn-aceptar" disabled={aceptandoId === i.id} onClick={() => aceptarInteresado(i)}>
                  {aceptandoId === i.id ? 'GENERANDO...' : '✓ ACEPTAR'}
                </button>
                <button className="cgp-btn-descartar" onClick={() => descartarInteresado(i.id)}>DESCARTAR</button>
              </div>
            </div>
          ))}
        </div>

        <div className="cgp-tarjeta">
          <h2 className="cgp-titulo-tarjeta">HISTORIAL</h2>
          {historial.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 12 }}>Todavía no hay historial.</p>
          ) : historial.map(i => {
            const color = i.estado === 'aceptado' ? 'var(--green)' : 'var(--muted)';
            const borderColor = i.estado === 'aceptado' ? 'rgba(68,255,136,0.3)' : 'rgba(255,255,255,0.1)';
            return (
              <div className="cgp-fila-hist" key={i.id}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, color: 'var(--text)' }}>{i.nombre}</div>
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: 1, color, border: `1px solid ${borderColor}`, borderRadius: 20, padding: '3px 10px' }}>
                  {i.estado === 'aceptado' ? '✓ ACEPTADO' : '○ DESCARTADO'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="cgp-tarjeta" style={{ background: 'rgba(155,89,255,0.05)', border: '1px solid rgba(155,89,255,0.2)' }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 11, letterSpacing: 1, color: 'var(--purple)', marginBottom: 6 }}>🚧 PRÓXIMAMENTE</div>
          <p style={{ color: 'var(--muted)', fontSize: 11.5, lineHeight: 1.6, margin: 0 }}>Crear retos con su propia modalidad, estilo y recursos todavía no existe — eso necesita tablas nuevas en la base de datos que aún no hemos diseñado. Por ahora administras interesados y participantes del único Camino activo (Generación Agosto).</p>
        </div>

      </div>

      {modalCodigo && (
        <div className="cgp-modal-fondo" onClick={() => setModalCodigo(null)}>
          <div className="cgp-modal-caja" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🗺️</div>
            <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: 14, color: 'var(--gold)', letterSpacing: 2, marginBottom: 4 }}>INVITACIÓN GENERADA</div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, color: 'var(--text)', marginBottom: 16 }}>{modalCodigo.nombre}</div>
            <p style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--muted)', wordBreak: 'break-all', marginBottom: 16 }}>{modalCodigo.url}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button style={{ padding: '10px 16px', background: 'rgba(212,175,55,0.1)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--gold)', fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 1, cursor: 'pointer' }} onClick={() => copiar(modalCodigo.url)}>COPIAR LINK</button>
              <a
                target="_blank" rel="noreferrer"
                style={{ padding: '10px 16px', background: 'rgba(68,255,136,0.12)', border: '1px solid rgba(68,255,136,0.35)', borderRadius: 8, color: 'var(--green)', fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 1, cursor: 'pointer', textDecoration: 'none' }}
                href={`https://wa.me/${(modalCodigo.telefono || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`¡Bienvenido/a al Camino a Líder Digital! 🗺️\n\nCrea tu acceso aquí: ${modalCodigo.url}`)}`}
              >💬 ABRIR WHATSAPP</a>
            </div>
            <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10.5, color: 'var(--muted)', marginTop: 14 }}>Válida 14 días, un solo uso.</div>
            <button className="cgp-modal-cerrar" onClick={() => setModalCodigo(null)}>CERRAR</button>
          </div>
        </div>
      )}

      {modalInvite && (
        <div className="cgp-modal-fondo" onClick={() => setModalInvite(null)}>
          <div className="cgp-modal-caja" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚜️</div>
            <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: 14, color: 'var(--purple)', letterSpacing: 2, marginBottom: 16 }}>INVITACIÓN DE GESTOR</div>
            <p style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--muted)', wordBreak: 'break-all', marginBottom: 16 }}>{modalInvite.url}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button style={{ padding: '10px 16px', background: 'rgba(155,89,255,0.12)', border: '1px solid rgba(155,89,255,0.35)', borderRadius: 8, color: 'var(--purple)', fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 1, cursor: 'pointer' }} onClick={() => copiar(modalInvite.url)}>COPIAR LINK</button>
              <a
                target="_blank" rel="noreferrer"
                style={{ padding: '10px 16px', background: 'rgba(68,255,136,0.12)', border: '1px solid rgba(68,255,136,0.35)', borderRadius: 8, color: 'var(--green)', fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 1, cursor: 'pointer', textDecoration: 'none' }}
                href={`https://wa.me/?text=${encodeURIComponent(`Te invito a ser gestor del Camino a Líder Digital 🗺️\n\nEntra aquí: ${modalInvite.url}`)}`}
              >💬 ABRIR WHATSAPP</a>
            </div>
            <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10.5, color: 'var(--muted)', marginTop: 14 }}>Válida 14 días, un solo uso.</div>
            <button className="cgp-modal-cerrar" onClick={() => setModalInvite(null)}>CERRAR</button>
          </div>
        </div>
      )}
    </div>
  );
}