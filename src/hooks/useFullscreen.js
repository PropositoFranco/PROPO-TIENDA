import { useEffect, useCallback, useState, useRef } from 'react';

// Evento global que cualquier componente puede escuchar
// window.addEventListener('fullscreen-change', e => e.detail.active)
const SIGNAL = 'fullscreen-change';

const dispatch = (active) =>
  window.dispatchEvent(new CustomEvent(SIGNAL, { detail: { active } }));

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const lockRef = useRef(false); // evita llamadas simultáneas

  // ── Sincronizar estado con el evento real del navegador ──────────────────
  useEffect(() => {
    const sync = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      dispatch(active);
      lockRef.current = false;
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  const enter = useCallback(async () => {
    if (lockRef.current || document.fullscreenElement) return;
    lockRef.current = true;
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      }
      // En móvil: pedir orientación landscape después de entrar
      if (window.innerWidth < 1024 && screen.orientation?.lock) {
        try { await screen.orientation.lock('landscape'); } catch (_) {}
      }
    } catch {
      lockRef.current = false;
      // Fallback iOS/PWA: scroll trick
      setTimeout(() => window.scrollTo(0, 1), 100);
    }
  }, []);

  const exit = useCallback(async () => {
    if (lockRef.current || !document.fullscreenElement) return;
    lockRef.current = true;
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      // En móvil: liberar orientación al salir
      if (screen.orientation?.unlock) {
        try { screen.orientation.unlock(); } catch (_) {}
      }
    } catch {
      lockRef.current = false;
    }
  }, []);

  return { isFullscreen, enter, exit };
}