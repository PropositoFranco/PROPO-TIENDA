import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function ProtectedRoute() {
  const { user, session, loading, profile: profileFromHook } = useAuthStore();
  const [profileTimeout, setProfileTimeout] = React.useState(false);

  React.useEffect(() => {
    if (!profileFromHook) {
      const t = setTimeout(() => setProfileTimeout(true), 5000);
      return () => clearTimeout(t);
    }
    setProfileTimeout(false);
  }, [profileFromHook]);
  
  // ✅ Si ya hay sesión en localStorage (user y session existen), no mostramos pantalla de carga
  const hasStoredSession = user && session;
  
  // Solo mostrar loading si no hay sesión almacenada Y loading está activo
  if (loading && !hasStoredSession) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#04020e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'Cinzel, serif', fontSize: '12px',
          letterSpacing: '4px', color: 'rgba(212,175,55,0.5)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>✦ CARGANDO ✦</div>
        <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
      </div>
    );
  }
  
  if (!user || !session) return <Navigate to="/login" replace />;

  const profile = useAuthStore.getState().profile;

  // Perfil aún cargando — esperar máximo 5 seg
  if (!profile && !profileTimeout) return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#04020e',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        fontFamily: 'Cinzel, serif', fontSize: '12px',
        letterSpacing: '4px', color: 'rgba(212,175,55,0.5)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>✦ CARGANDO ✦</div>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
    </div>
  );

  // Si pasaron 5 seg y no llegó el profile, intentar de nuevo
  if (!profile && profileTimeout) {
    useAuthStore.getState().loadProfile();
    return <Navigate to="/login" replace />;
  }

  // Admin siempre pasa — sin importar tutorial_completed
  if (profile.is_admin === true) return <Outlet />;

  // Si tiene sesión pero no tiene nombre → no terminó el registro
  if (!profile.templario_name) {
    return <Navigate to="/register" replace />;
  }

  // Si tiene nombre pero no completó el tutorial
  if (!profile.tutorial_completed) {
    const path = window.location.pathname;
    const exempt = ['/tutorial', '/hazloapp', '/register', '/bienvenido'];
    if (!exempt.some(e => path.startsWith(e))) {
      return <Navigate to="/tutorial" replace />;
    }
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { isAdmin, loading, user, profile } = useAuthStore();

  // Sin usuario → login de inmediato
  if (!loading && !user) return <Navigate to="/login" replace />;
  
  // Esperar a que loading termine Y el perfil esté cargado
  if (loading || !profile) return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#04020e',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        fontFamily: 'Cinzel, serif', fontSize: '12px',
        letterSpacing: '4px', color: 'rgba(212,175,55,0.5)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>✦ CARGANDO ✦</div>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
    </div>
  );

  if (!isAdmin) return <Navigate to="/hub" replace />;
  return <Outlet />;
}