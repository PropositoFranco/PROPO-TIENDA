import { Component } from 'react';

// Firma del error cuando el navegador queda con referencias a un chunk
// que un deploy nuevo ya reemplazó/eliminó del servidor.
const PATRON_CHUNK_VIEJO = /Failed to fetch dynamically imported module|Failed to load module script|error loading dynamically imported module/i;
const KEY_INTENTOS = 'templo_chunk_reload_attempts';
const MAX_INTENTOS = 3;
const VENTANA_MS = 60000; // 1 minuto: pasado esto, se resetea el contador

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.isReloading = false;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidMount() {
    // Si la app carga bien y se mantiene estable, limpiamos el contador
    // para que un futuro deploy empiece de cero.
    this._clearFlagTimer = setTimeout(() => {
      sessionStorage.removeItem(KEY_INTENTOS);
    }, 8000);
  }

  componentWillUnmount() {
    clearTimeout(this._clearFlagTimer);
  }

  // Recarga forzando al navegador a descartar cualquier versión cacheada
  // del documento HTML — la causa real de que un reload normal no sirva.
  forzarRecargaSinCache() {
    const url = new URL(window.location.href);
    url.searchParams.set('_r', Date.now().toString());
    window.location.replace(url.toString());
  }

  componentDidCatch(error, info) {
    console.error('[Templo] Error capturado por ErrorBoundary:', error, info);

    const esChunkViejo = PATRON_CHUNK_VIEJO.test(error?.message || '');

    let registro;
    try {
      registro = JSON.parse(sessionStorage.getItem(KEY_INTENTOS) || 'null');
    } catch {
      registro = null;
    }

    const ahora = Date.now();
    const dentroDeVentana = registro && (ahora - registro.desde) < VENTANA_MS;
    const intentos = dentroDeVentana ? registro.n : 0;

    if (esChunkViejo && intentos < MAX_INTENTOS) {
      sessionStorage.setItem(KEY_INTENTOS, JSON.stringify({
        n: intentos + 1,
        desde: dentroDeVentana ? registro.desde : ahora,
      }));
      this.isReloading = true;
      this.forzarRecargaSinCache();
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.isReloading) return null; // recarga en curso, invisible para el usuario

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
          onClick={() => {
            sessionStorage.removeItem(KEY_INTENTOS);
            const url = new URL(window.location.href);
            url.searchParams.set('_r', Date.now().toString());
            window.location.replace(url.toString());
          }}
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