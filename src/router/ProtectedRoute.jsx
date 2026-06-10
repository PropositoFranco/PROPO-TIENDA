import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export function ProtectedRoute() {
  const { user, session, loading } = useAuthStore();
  
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
  return <Outlet />;
}

export function AdminRoute() {
  const { isAdmin, loading, profile } = useAuthStore();
  
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