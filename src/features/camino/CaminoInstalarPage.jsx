import { useState, useEffect } from 'react';

const styles = `
:root{
  --gold:#D4AF37; --gold-bright:#FFE566; --gold-dim:rgba(212,175,55,0.4);
  --card:#0e0818; --border:rgba(212,175,55,0.15); --borderHi:rgba(212,175,55,0.4);
  --text:#f0eaff; --muted:rgba(240,234,255,0.55); --bg:#07040f;
}
.cin-root *,.cin-root *::before,.cin-root *::after{box-sizing:border-box;}
.cin-root{min-height:100dvh; background:var(--bg); font-family:'Nunito',sans-serif; color:var(--text);}
.cin-centrado{min-height:100dvh; display:flex; align-items:center; justify-content:center; padding:24px;}
.cin-tarjeta{background:var(--card); border:1px solid var(--border); border-radius:16px; padding:clamp(24px,5vw,32px); max-width:400px; width:100%; text-align:center;}
.cin-eyebrow{font-family:'Cinzel',serif; font-weight:900; font-size:10px; letter-spacing:2px; color:var(--gold);}
.cin-tarjeta h1{font-family:'Cinzel',serif; font-weight:900; font-size:clamp(19px,4vw,23px); color:var(--text); margin:6px 0 16px;}
.cin-icono{font-size:40px; margin-bottom:10px;}
.cin-paso{display:flex; align-items:flex-start; gap:12px; text-align:left; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:12px; padding:14px 16px; margin-bottom:12px;}
.cin-num{flex-shrink:0; width:26px; height:26px; border-radius:50%; background:rgba(212,175,55,0.15); border:1px solid var(--borderHi); color:var(--gold-bright); font-family:'Cinzel',serif; font-weight:900; font-size:12px; display:flex; align-items:center; justify-content:center;}
.cin-paso-txt{font-size:13.5px; line-height:1.5; color:var(--text);}
.cin-paso-txt b{color:var(--gold-bright);}
.cin-btn{width:100%; padding:14px 16px; background:rgba(212,175,55,0.14); border:1px solid var(--borderHi); border-radius:10px; color:var(--gold); font-family:'Cinzel',serif; font-weight:700; font-size:11.5px; letter-spacing:1.2px; cursor:pointer; margin-top:8px; text-decoration:none; display:inline-block;}
.cin-ayuda{margin-top:16px; font-size:11.5px; color:var(--muted); line-height:1.5;}
`;

// Detecta el entorno del visitante para darle instrucciones correctas.
function detectarEntorno() {
  const ua = navigator.userAgent || '';
  const esIOS = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
  const esAndroid = /Android/.test(ua);
  // Navegadores "in-app" (WhatsApp, Instagram, Facebook) no dejan instalar PWA.
  const esInApp = /FBAN|FBAV|Instagram|WhatsApp|Line\//i.test(ua);
  return { esIOS, esAndroid, esInApp };
}

export default function CaminoInstalarPage() {
  const [entorno, setEntorno] = useState({ esIOS: false, esAndroid: false, esInApp: false });
  const [promptInstalacion, setPromptInstalacion] = useState(null);

  useEffect(() => {
    setEntorno(detectarEntorno());

    // Android/Chrome expone un evento para mostrar el botón de instalación nativo.
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setPromptInstalacion(e);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  async function instalarAndroid() {
    if (!promptInstalacion) return;
    promptInstalacion.prompt();
    await promptInstalacion.userChoice;
    setPromptInstalacion(null);
  }

  return (
    <div className="cin-root">
      <style>{styles}</style>
      <div className="cin-centrado">
        <div className="cin-tarjeta">
          <div className="cin-icono">🗺️</div>
          <div className="cin-eyebrow">CAMINO A LÍDER DIGITAL</div>
          <h1>Instala tu app</h1>

          {entorno.esInApp && (
            <>
              <div className="cin-paso">
                <div className="cin-num">!</div>
                <div className="cin-paso-txt">
                  Estás abriendo esto desde una app de mensajería. Toca los <b>tres puntitos</b> (o el ícono de compartir) arriba y elige <b>"Abrir en el navegador"</b> (Safari o Chrome) para poder instalar.
                </div>
              </div>
            </>
          )}

          {!entorno.esInApp && entorno.esIOS && (
            <>
              <div className="cin-paso">
                <div className="cin-num">1</div>
                <div className="cin-paso-txt">Toca el ícono de <b>Compartir</b> (el cuadrito con la flecha hacia arriba, abajo en Safari).</div>
              </div>
              <div className="cin-paso">
                <div className="cin-num">2</div>
                <div className="cin-paso-txt">Busca y toca <b>"Agregar a Inicio"</b>.</div>
              </div>
              <div className="cin-paso">
                <div className="cin-num">3</div>
                <div className="cin-paso-txt">Confirma que diga <b>"Camino a Líder Digital"</b> y toca <b>Agregar</b>.</div>
              </div>
            </>
          )}

          {!entorno.esInApp && entorno.esAndroid && (
            <>
              {promptInstalacion ? (
                <button className="cin-btn" onClick={instalarAndroid}>📲 INSTALAR AHORA</button>
              ) : (
                <div className="cin-paso">
                  <div className="cin-num">1</div>
                  <div className="cin-paso-txt">Toca los <b>tres puntitos</b> arriba a la derecha de Chrome y elige <b>"Instalar app"</b>.</div>
                </div>
              )}
            </>
          )}

          {!entorno.esInApp && !entorno.esIOS && !entorno.esAndroid && (
            <div className="cin-paso">
              <div className="cin-num">i</div>
              <div className="cin-paso-txt">Abre este link desde tu celular para instalar la app de Líder Digital.</div>
            </div>
          )}

          <p className="cin-ayuda">Una vez instalada, entra siempre desde el ícono de tu pantalla de inicio.</p>
        </div>
      </div>
    </div>
  );
}