import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Templo] Error capturado por ErrorBoundary:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #05031a 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '1.5rem', padding: '2rem', textAlign: 'center',
        fontFamily: '"Cinzel", serif',
      }}>
        <div style={{
          fontSize: 48, lineHeight: 1,
          filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.4))',
        }}>⚔️</div>

        <div style={{
          fontSize: 'clamp(18px, 3vw, 24px)',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #D4AF37, #F5C518)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.12em',
        }}>
          EL TEMPLO HA CAÍDO
        </div>

        <div style={{
          fontSize: 'clamp(11px, 1.8vw, 13px)',
          color: 'rgba(212,175,55,0.55)',
          letterSpacing: '0.08em',
          maxWidth: 360,
          lineHeight: 1.7,
        }}>
          Algo inesperado interrumpió la sesión.<br />
          Tu progreso está a salvo en el servidor.
        </div>

        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '14px 36px',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.08))',
            border: '1px solid rgba(212,175,55,0.45)',
            color: '#F0D060',
            fontFamily: '"Cinzel", serif',
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Volver al Templo
        </button>

        {import.meta.env.DEV && this.state.error && (
          <pre style={{
            marginTop: 12,
            padding: '10px 16px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 6,
            fontSize: 10,
            color: 'rgba(252,165,165,0.7)',
            maxWidth: 480,
            overflowX: 'auto',
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
          }}>
            {this.state.error.toString()}
          </pre>
        )}
      </div>
    );
  }
}