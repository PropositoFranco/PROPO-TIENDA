import { useEffect, useRef, useState } from 'react';

export default function HazloAppPage() {
  const iframeRef         = useRef(null);
  const [ended,  setEnded]  = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//assets.mediadelivery.net/playerjs/player-0.1.0.min.js';
    script.async = true;
    script.onload = () => {
      if (!iframeRef.current || !window.playerjs) return;
      const player = new window.playerjs.Player(iframeRef.current);
      player.on('ready', () => {
        player.on('ended', () => setEnded(true));
      });
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  function handleContinue() {
    if (!ended || loading) return;
    setLoading(true);
    window.location.href = `${window.location.origin}/hub`;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#07041a 0%,#050217 40%,#030010 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Raleway',sans-serif",
    }}>

      {/* Eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        <div style={{ width: 50, height: 1, background: 'linear-gradient(to right,transparent,rgba(212,175,55,.5))' }} />
        <span style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 6, color: 'rgba(212,175,55,.6)', textTransform: 'uppercase' }}>
          Último paso
        </span>
        <div style={{ width: 50, height: 1, background: 'linear-gradient(to left,transparent,rgba(212,175,55,.5))' }} />
      </div>

      {/* Título */}
      <h1 style={{
        fontFamily: "'Cinzel',serif",
        fontSize: 'clamp(22px,5vw,36px)',
        fontWeight: 900,
        letterSpacing: '0.12em',
        background: 'linear-gradient(135deg,#f5d060 0%,#d4af37 30%,#fff8dc 50%,#d4af37 70%,#b8860b 100%)',
        backgroundSize: '220% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: 8, textAlign: 'center',
      }}>
        HAZLO APP
      </h1>
      <p style={{
        fontFamily: "'Raleway',sans-serif", fontSize: 11, letterSpacing: 3,
        color: 'rgba(200,190,255,.5)', marginBottom: 32, textAlign: 'center',
      }}>
        DESCARGA LA APP EN TU CELULAR
      </p>

      {/* Video */}
      <div style={{
        width: '100%', maxWidth: 680, borderRadius: 16, overflow: 'hidden',
        border: '1px solid rgba(212,175,55,.25)',
        boxShadow: '0 0 40px rgba(212,175,55,.1)',
        marginBottom: 28, position: 'relative', paddingTop: '56.25%',
      }}>
        <iframe
          ref={iframeRef}
          src="https://iframe.mediadelivery.net/embed/673293/6e0a5eed-f778-4be5-a2e2-56b2184d915e?autoplay=false&loop=false&muted=false&preload=true&responsive=true"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title="Hazlo App"
        />
      </div>

      {/* Indicador */}
      {!ended && (
        <p style={{
          fontSize: 11, color: 'rgba(212,175,55,.45)',
          letterSpacing: 2, marginBottom: 12,
          fontFamily: "'Cinzel',serif",
        }}>
          VE EL VIDEO COMPLETO PARA CONTINUAR
        </p>
      )}

      {/* Botón */}
      <button
        onClick={handleContinue}
        disabled={!ended || loading}
        style={{
          padding: '14px 52px', borderRadius: 12,
          border: '1px solid rgba(212,175,55,.45)',
          background: (!ended || loading)
            ? 'rgba(212,175,55,.06)'
            : 'linear-gradient(135deg,rgba(212,175,55,.18) 0%,rgba(212,175,55,.06) 100%)',
          color: (!ended || loading) ? 'rgba(212,175,55,.3)' : '#f5d060',
          fontFamily: "'Cinzel',serif", fontSize: 13, letterSpacing: 3,
          textTransform: 'uppercase',
          cursor: (!ended || loading) ? 'default' : 'pointer',
          transition: 'all .2s',
        }}
      >
        {loading ? 'Entrando...' : 'Entrar al Templo →'}
      </button>

      <p style={{
        marginTop: 12, fontSize: 11,
        color: 'rgba(255,255,255,.2)',
        letterSpacing: 1,
        fontFamily: "'Raleway',sans-serif",
      }}>
        Descarga la app y luego continúa
      </p>
    </div>
  );
}