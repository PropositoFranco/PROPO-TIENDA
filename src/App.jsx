import { lazy, Suspense, useEffect, useState } from 'react';
import { usePrizeStore } from './store/usePrizeStore';
import EpicPrizeClaimAnimation from './components/EpicPrizeClaimAnimation';
import { useAuthStore } from './store/useAuthStore';
import RotateScreen from './components/ui/RotateScreen';
import TestimonioPopup from './components/TestimonioPopup';
import GraduacionCeremonia from './components/GraduacionCeremonia';
import { useGraduacionStore } from './components/GraduacionCeremonia';
import './styles/globals.css';
import { useAppConfig } from './hooks/useAppConfig';
import MaintenancePage from './features/auth/MaintenancePage';
import WatermarkOverlay from './components/WatermarkOverlay';
import ErrorBoundary from './components/ErrorBoundary';

const AppRouter = lazy(() => import('./router/AppRouter'));

function LoadingScreen() {
  return (
    <div className="w-full h-full bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        <div className="font-cinzel text-2xl font-black text-gold-gradient mb-4">
          T-STORE
        </div>
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
        <div className="font-cinzel text-[10px] tracking-[3px] text-purple-muted mt-4 uppercase">
          Cargando el Templo...
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth);
  const user = useAuthStore((s) => s.user);
  const checkPendingReward = usePrizeStore((s) => s.checkPendingReward);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [annDismissed, setAnnDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) localStorage.setItem('pending_ref_code', ref.toUpperCase());
  }, []);

  // Captura universal del slug de aliado — funciona en CUALQUIER página
  // (landing, /offers, QR, link directo, lo que sea) mientras traiga ?aliado=slug.
  // Se guarda una sola vez (no se pisa si ya hay uno) para no perder la
  // atribución si el usuario navega por varias páginas antes de registrarse.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const aliado = params.get('aliado');
    if (aliado && !localStorage.getItem('pending_aliado_slug')) {
      localStorage.setItem('pending_aliado_slug', aliado.toLowerCase().trim());
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => checkPendingReward(), 2000);
    const interval = setInterval(() => checkPendingReward(), 30000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const pingActivity = () => {
      import('./services/supabase').then(({ supabase }) => {
        supabase.from('profiles').update({ last_login_date: new Date().toISOString() }).eq('id', user.id).then(() => {});
      });
    };
    const activityInterval = setInterval(pingActivity, 5 * 60 * 1000);
    return () => clearInterval(activityInterval);
  }, [user]);

useEffect(() => {
    if (!user) return;
    const flagKey = 'tdp_loc_captured_' + user.id;
    if (sessionStorage.getItem(flagKey)) return;
    import('./services/supabase').then(async ({ supabase }) => {
      try {
        const { data: existing } = await supabase
          .from('user_locations').select('locked_manual').eq('user_id', user.id).maybeSingle();
        if (existing?.locked_manual) { sessionStorage.setItem(flagKey, '1'); return; }
        const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (!res.ok) return;
        const geo = await res.json();
        const lat = parseFloat(geo?.latitude);
        const lng = parseFloat(geo?.longitude);
        if (!isFinite(lat) || !isFinite(lng)) return;
        await supabase.from('user_locations').upsert({
          user_id: user.id, lat, lng,
          city: geo.city || null, country: geo.country || null, country_code: geo.country_code || null,
          source: 'ip', updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        sessionStorage.setItem(flagKey, '1');
      } catch (_) { /* silencioso: nunca debe romper la app */ }
    });
  }, [user]);

  useEffect(() => {
    const updatePath = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', updatePath);
    const origPush    = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);
    window.history.pushState    = (...args) => { origPush(...args);    updatePath(); };
    window.history.replaceState = (...args) => { origReplace(...args); updatePath(); };
    return () => {
      window.removeEventListener('popstate', updatePath);
      window.history.pushState    = origPush;
      window.history.replaceState = origReplace;
    };
  }, [user]);

  const { maintenance, announcement, scheduled } = useAppConfig();

  useEffect(() => {
    if (announcement?.text) {
      setAnnDismissed(localStorage.getItem('ann_dismissed') === announcement.text);
    }
  }, [announcement?.text]);

  const dismissAnn = () => {
    localStorage.setItem('ann_dismissed', announcement.text);
    setAnnDismissed(true);
  };

  const isVerticalOnly = currentPath.startsWith('/games/templarios-dijeron') || currentPath.startsWith('/sorteo') || currentPath.startsWith('/camino');
  const isModuleViewer = /^\/academia\/[^/]+/.test(currentPath);
  const mostrarGraduacion = useGraduacionStore(s => s.mostrar);

  if (maintenance.active && !currentPath.startsWith('/admin')) return <MaintenancePage message={maintenance.message} />;

  const showAnn =
    announcement.active &&
    announcement.text &&
    !annDismissed &&
    (!announcement.show_until || new Date() <= new Date(announcement.show_until));

  const isCamino = currentPath.startsWith('/camino');

  const content = (
    <Suspense fallback={<LoadingScreen />}>
      <AppRouter />
      {!isCamino && <TestimonioPopup />}
      {!isCamino && mostrarGraduacion && <GraduacionCeremonia />}
    </Suspense>
  );

  const wrapped = isVerticalOnly
    ? content
    : isModuleViewer
      ? <RotateScreen portrait>{content}</RotateScreen>
      : <RotateScreen>{content}</RotateScreen>;

  return (
    <ErrorBoundary>
    <>
      <WatermarkOverlay />
      {showAnn && (
        <div className="ann-toast" style={{
          position: 'fixed',
          top:      isMobile ? 56  : 72,
          right:    isMobile ? 6   : 16,
          maxWidth: isMobile ? 148 : 240,
          zIndex: 9000,
          fontFamily: 'Cinzel, serif',
          borderRadius: 10, overflow: 'hidden',
          border: '1px solid rgba(212,175,55,0.3)',
          background: 'rgba(12,8,28,0.97)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}>
          <style>{`
            @keyframes annBadge {
              0%   { background: #D4AF37; color: #0a0614; box-shadow: 0 0 8px rgba(212,175,55,0.6); }
              25%  { background: #EF4444; color: #fff;    box-shadow: 0 0 12px rgba(239,68,68,0.7); }
              50%  { background: #8B5CF6; color: #fff;    box-shadow: 0 0 12px rgba(139,92,246,0.7); }
              75%  { background: #10B981; color: #0a0614; box-shadow: 0 0 12px rgba(16,185,129,0.7); }
              100% { background: #D4AF37; color: #0a0614; box-shadow: 0 0 8px rgba(212,175,55,0.6); }
            }
            @keyframes annBorder {
              0%   { border-color: rgba(212,175,55,0.6); box-shadow: 0 0 10px rgba(212,175,55,0.2); }
              25%  { border-color: rgba(239,68,68,0.6);  box-shadow: 0 0 10px rgba(239,68,68,0.2); }
              50%  { border-color: rgba(139,92,246,0.6); box-shadow: 0 0 10px rgba(139,92,246,0.2); }
              75%  { border-color: rgba(16,185,129,0.6); box-shadow: 0 0 10px rgba(16,185,129,0.2); }
              100% { border-color: rgba(212,175,55,0.6); box-shadow: 0 0 10px rgba(212,175,55,0.2); }
            }
            .ann-toast { animation: annBorder 3s ease-in-out infinite; }
            .ann-badge { animation: annBadge 3s ease-in-out infinite; }
          `}</style>

          {/* Badge ACTUALIZACIÓN */}
          <div className="ann-badge" style={{
            padding:       isMobile ? '2px 6px'  : '3px 10px',
            fontSize:      isMobile ? 7           : 9,
            fontWeight: 900,
            color: '#0a0614', letterSpacing: '1.5px',
          }}>✦ ACTUALIZACIÓN</div>

          {/* Cuerpo */}
          <div style={{
            padding:  isMobile ? '5px 7px'  : '8px 12px',
            display: 'flex', alignItems: 'center',
            gap:      isMobile ? 5           : 8,
          }}>
            <span style={{ fontSize: isMobile ? 10 : 14 }}>📢</span>
            <span style={{
              fontSize:     isMobile ? 8    : 10,
              color: 'rgba(212,175,55,0.85)',
              letterSpacing: '0.5px', lineHeight: 1.5, flex: 1,
            }}>
              {announcement.text}
              {scheduled?.enabled && scheduled?.activate_at && (
                <span style={{ display: 'block', marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <span style={{ fontSize: isMobile ? 6 : 8, background: 'rgba(239,68,68,0.2)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, padding: '1px 4px', letterSpacing: 1, fontWeight: 900 }}>FECHA:</span>
                    <span style={{ fontSize: isMobile ? 7 : 10, color: 'rgba(255,255,255,0.7)' }}>
                      {new Date(scheduled.activate_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      {' · '}
                      {new Date(scheduled.activate_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                  {scheduled.deactivate_at && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: isMobile ? 6 : 8, background: 'rgba(16,185,129,0.2)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 4, padding: '1px 4px', letterSpacing: 1, fontWeight: 900 }}>VUELTA:</span>
                      <span style={{ fontSize: isMobile ? 7 : 10, color: 'rgba(255,255,255,0.7)' }}>
                        {new Date(scheduled.deactivate_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                        {' · '}
                        {new Date(scheduled.deactivate_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                  )}
                </span>
              )}
            </span>
            <span
              onClick={dismissAnn}
              style={{
                color: 'rgba(212,175,55,0.35)',
                fontSize: isMobile ? 11 : 14,
                cursor: 'pointer', alignSelf: 'flex-start',
                lineHeight: 1, paddingTop: 1,
              }}>✕</span>
          </div>
        </div>
      )}
      {wrapped}
    </>
    </ErrorBoundary>
  );
}