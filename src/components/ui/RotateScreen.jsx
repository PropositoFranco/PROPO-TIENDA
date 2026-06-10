import { useEffect, useState } from 'react';
import { useFullscreen } from '../../hooks/useFullscreen';

function getIsPortrait() {
  // screen.orientation es más confiable en Android que innerWidth/innerHeight
  if (window.screen?.orientation?.type) {
    return window.screen.orientation.type.includes('portrait');
  }
  return window.innerHeight > window.innerWidth;
}

export default function RotateScreen({ children, portrait = false }) {
  const { enter } = useFullscreen();
  const [isPortrait, setIsPortrait] = useState(getIsPortrait);

  useEffect(() => {
    const check = () => {
      const nowPortrait = getIsPortrait();
      setIsPortrait(nowPortrait);
      if (!nowPortrait) {
        window.addEventListener('pointerdown', enter, { once: true });
      }
    };

    // orientationchange es el evento correcto en móvil, más confiable que resize
    window.addEventListener('orientationchange', check);
    screen.orientation?.addEventListener('change', check);
    window.addEventListener('resize', check);

    return () => {
      window.removeEventListener('orientationchange', check);
      screen.orientation?.removeEventListener('change', check);
      window.removeEventListener('resize', check);
      window.removeEventListener('pointerdown', enter);
    };
  }, [enter]);

  const needsRotate = window.innerWidth < 768 && (portrait ? !isPortrait : isPortrait);
  if (needsRotate) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        background: '#0a0a0f',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '24px'
      }}>
        <div style={{ fontSize: '64px', animation: 'spin 2s linear infinite' }}>📱</div>
        <div style={{
          fontFamily: 'Cinzel, serif', color: '#d4af37',
          fontSize: '18px', letterSpacing: '2px',
          textAlign: 'center', padding: '0 32px'
        }}>GIRA TU DISPOSITIVO</div>
        <div style={{
          color: '#9b8ec4', fontSize: '13px',
          textAlign: 'center', padding: '0 32px',
          fontFamily: 'Crimson Text, serif'
        }}>{portrait ? 'Esta pantalla se ve en modo vertical' : 'El Templo se experimenta en modo horizontal'}</div>
        <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 50%{transform:rotate(${portrait ? '-90' : '90'}deg)} 100%{transform:rotate(0deg)} }`}</style>
      </div>
    );
  }

  return children;
}