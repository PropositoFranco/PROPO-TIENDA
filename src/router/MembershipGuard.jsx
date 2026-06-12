import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import useMembershipStore, { selectIsMember } from '../store/useMembershipStore';
import { supabase } from '../services/supabase';

const MembershipLoading = () => (
  <div style={{
    position: 'fixed', inset: 0,
    background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0d0618 100%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '1.5rem', zIndex: 9999,
  }}>
    <div style={{
      width: '4rem', height: '4rem',
      borderRadius: '50%',
      background: 'radial-gradient(circle, #F5C518 0%, #C084FC 60%, transparent 100%)',
      animation: 'membershipPulse 1.4s ease-in-out infinite',
      boxShadow: '0 0 40px rgba(245, 197, 24, 0.4)',
    }} />
    <p style={{
      fontFamily: '"Cinzel", serif',
      color: '#C084FC',
      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      opacity: 0.8,
    }}>
      Verificando acceso...
    </p>
    <style>{`
      @keyframes membershipPulse {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50%       { transform: scale(1.2); opacity: 1; }
      }
    `}</style>
  </div>
);

const MembershipGuard = () => {
  const location = useLocation();
  const user      = useAuthStore(s => s.user);
  const profile   = useAuthStore(s => s.profile);
  const authLoading = useAuthStore(s => s.loading);
  const isAdmin   = useAuthStore(s => s.isAdmin);

  const [checkedStatus, setCheckedStatus] = useState(null);

  useEffect(() => {
    // Esperar a que auth Y profile estén listos
    if (authLoading || !user || !profile) return;

    // Admin: profile.is_admin ya viene de loadProfile, sin query extra
    if (isAdmin || profile.is_admin === true) {
      setCheckedStatus('admin');
      return;
    }

    // Si ya es active, confiar en el cache. Si no, re-verificar siempre.
const freshStatus = useMembershipStore.getState().status;
if (freshStatus === 'active' || freshStatus === 'admin') {
  setCheckedStatus(freshStatus);
  return;
}

// Para cualquier otro status, re-verificar contra Supabase
(async () => {
  const store = useMembershipStore.getState();
  await store.loadMembership(supabase, user.id);
  setCheckedStatus(useMembershipStore.getState().status);
})();

  }, [authLoading, user?.id, profile?.id]);

  // Auth cargando
  if (authLoading) return <MembershipLoading />;

  // Sin usuario
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // Profile aún no llega o verificando
  if (!profile || checkedStatus === null) return <MembershipLoading />;

  // Admin pasa siempre
  if (checkedStatus === 'admin' || isAdmin) return <Outlet />;

  // Miembro activo
  if (checkedStatus === 'active') return <Outlet />;

  // Pausado
  if (checkedStatus === 'paused') {
    return <Navigate to="/reactivar" state={{ from: location }} replace />;
  }

  // Bloqueado
  if (checkedStatus === 'locked') {
    return <Navigate to="/reactivar?locked=true" state={{ from: location }} replace />;
  }

  // inactive, expired, idle — paywall
  return <Navigate to="/paywall" state={{ from: location }} replace />;
};

export default MembershipGuard;