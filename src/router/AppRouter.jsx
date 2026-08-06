import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { ProtectedRoute, AdminRoute } from './ProtectedRoute';
import { useAuthStore } from '../store/useAuthStore';
import AppLayout from '../components/layout/AppLayout';
import MembershipGuard from './MembershipGuard';
import RewardClaimGate from '../features/academy/RewardClaimGate';

import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import BienvenidoPage from '../features/auth/BienvenidoPage';
import BeneficiosPage from '../features/auth/BeneficiosPage';
import TutorialPage from '../features/auth/TutorialPage';
import HazloAppPage from '../features/auth/HazloAppPage';
import TerminosPage from '../features/offers/TerminosPage';
import PaywallPage from '../features/academy/PaywallPage';
import ReactivarPage from '../features/academy/ReactivarPage';
import ArsenalRPGPage from '../features/arsenal/ArsenalRPGPage';

const CanjeadorPage = lazy(() => import('../features/packages/CanjeadorPage'));
const HubPage            = lazy(() => import('../features/hub/HubPage'));
const CronicasPage       = lazy(() => import('../features/hub/CronicasPage'));
const StorePage          = lazy(() => import('../features/store/StorePage'));
const LibraryPage        = lazy(() => import('../features/library/LibraryPage'));
const InventoryPage      = lazy(() => import('../features/inventory/InventoryPage'));
const MissionsPage       = lazy(() => import('../features/missions/MissionsPage'));
const ProfilePage        = lazy(() => import('../features/profile/ProfilePage'));
const AlianzaPage        = lazy(() => import('../features/profile/AlianzaPage'));
const OffersPage         = lazy(() => import('../features/offers/OffersPage'));
const ToolViewer         = lazy(() => import('../features/store/ToolViewer'));
const RewardViewer       = lazy(() => import('../features/profile/RewardViewer'));
const TemplariosDijeron  = lazy(() => import('../features/games/templarios/TemplariosDijeron'));
const TemplariosRanking  = lazy(() => import('../features/games/templarios/TemplariosRanking'));
const AcademyHub         = lazy(() => import('../features/academy/AcademyHub'));
const ModuleViewer       = lazy(() => import('../features/academy/ModuleViewer'));
const CommunityHub       = lazy(() => import('../features/academy/CommunityHub'));
const AdminDashboard       = lazy(() => import('../features/admin/AdminDashboard'));
const LevelRewardsAdmin    = lazy(() => import('../features/admin/LevelRewardsAdmin'));
const ReferralConfigPage   = lazy(() => import('../features/admin/ReferralConfigPage'));
const RankingPrizesAdmin   = lazy(() => import('../features/admin/RankingPrizesAdmin'));
const AdminMilestonePrizes = lazy(() => import('../features/admin/AdminMilestonePrizes'));
const CompetenciaPremios   = lazy(() => import('../features/admin/CompetenciaPremios'));
const RankingBannersAdmin  = lazy(() => import('../features/admin/RankingBannersAdmin'));
const VipLevelRewardsAdmin = lazy(() => import('../features/admin/VipLevelRewardsAdmin'));
const SorteoAdminPage = lazy(() => import('../features/sorteo/SorteoAdminPage'));
const SorteoPage        = lazy(() => import('../features/sorteo/SorteoPage'));
const AliadoDisplayPage = lazy(() => import('../features/sorteo/aliado-display-page'));
const MuroDeAliados = lazy(() => import('../features/aliados/MuroDeAliados'));
const AdminMapaPage = lazy(() => import('../features/admin/AdminMapaPage'));

function SorteoRedirect() {
  const [destino, setDestino] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm = params.toString();

    import('../services/supabase').then(({ supabase }) => {
      supabase
        .from('config')
        .select('value')
        .eq('key', 'sorteo_activo_global')
        .single()
        .then(({ data }) => {
          if (data?.value) {
            setDestino(`/sorteo/${data.value}${utm ? '?' + utm : ''}`);
          } else {
            setDestino('/');
          }
        });
    });
  }, []);

  if (!destino) return null;
  return <Navigate to={destino} replace />;
}

function CatchAll() {
  const { loading } = useAuthStore();
  if (loading) return null;
  return <Navigate to="/login" replace />;
}

function AdminCursor() {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'admin-cursor-style';
    style.textContent = `
      * { cursor: none !important; }
      #admin-cursor {
        position: fixed; width: 8px; height: 8px; border-radius: 50%;
        background: #fff;
        box-shadow: 0 0 0 2px rgba(201,168,76,0.6), 0 0 12px rgba(201,168,76,0.8);
        pointer-events: none; z-index: 999999;
        transform: translate(-50%,-50%);
        animation: acPulse 1.8s ease-in-out infinite;
      }
      @keyframes acPulse {
        0%,100% { box-shadow: 0 0 0 2px rgba(201,168,76,0.5), 0 0 8px rgba(201,168,76,0.6); }
        50%      { box-shadow: 0 0 0 3px rgba(201,168,76,0.9), 0 0 18px rgba(201,168,76,1); }
      }
    `;
    document.head.appendChild(style);
    const dot = document.createElement('div');
    dot.id = 'admin-cursor';
    document.body.appendChild(dot);
    let rafId;
    const move = e => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        dot.style.left = e.clientX + 'px';
        dot.style.top  = e.clientY + 'px';
      });
    };
    window.addEventListener('mousemove', move);
    return () => {
      window.removeEventListener('mousemove', move);
      style.remove();
      dot.remove();
    };
  }, []);
  return null;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AdminCursor />
      <Suspense fallback={null}>
        <RewardClaimGate>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/bienvenido" element={<BienvenidoPage />} />
          <Route path="/beneficios" element={<BeneficiosPage />} />
          <Route path="/tutorial" element={<TutorialPage />} />
        <Route path="/canjear" element={<CanjeadorPage />} />
          <Route path="/hazloapp" element={<HazloAppPage />} />
          <Route path="/terminos" element={<TerminosPage />} />
          <Route path="/arsenal-rpg" element={<ArsenalRPGPage />} />
          <Route path="/sorteo/:eventoId" element={<SorteoPage />} />
          <Route path="/sorteo" element={<SorteoRedirect />} />
          <Route path="/aliado/:slug/display" element={<AliadoDisplayPage />} />
          <Route path="/aliados" element={<MuroDeAliados />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/sorteos" element={<SorteoAdminPage />} />
            <Route path="/admin/level-rewards" element={<LevelRewardsAdmin />} />
            <Route path="/admin/referral-config" element={<ReferralConfigPage />} />
            <Route path="/admin/ranking-prizes" element={<RankingPrizesAdmin />} />
            <Route path="/admin/milestone-prizes" element={<AdminMilestonePrizes />} />
            <Route path="/admin/competencia-premios" element={<CompetenciaPremios />} />
            <Route path="/admin/ranking-banners" element={<RankingBannersAdmin />} />
            <Route path="/admin/vip-level-rewards" element={<VipLevelRewardsAdmin />} />
            <Route path="/admin/aliados" element={<MuroDeAliados adminMode />} />
            <Route path="/admin/mapa" element={<AdminMapaPage />} />
          </Route>

          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<Navigate to="/hub" replace />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route element={<MembershipGuard />}>
                <Route path="/hub" element={<HubPage />} />
                <Route path="/cronicas" element={<CronicasPage />} />
                <Route path="/store" element={<StorePage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/missions" element={<MissionsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/alianza" element={<AlianzaPage />} />
              </Route>
              <Route element={<MembershipGuard />}>
                <Route path="/academia" element={<AcademyHub />} />
                <Route path="/academia/comunidad" element={<CommunityHub />} />
                <Route path="/academia/comunidad/post/:postId" element={<CommunityHub />} />
                <Route path="/academia/:slug" element={<ModuleViewer />} />
              </Route>
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/tool/:slug" element={<ToolViewer />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/paywall" element={<PaywallPage />} />
            <Route path="/reactivar" element={<ReactivarPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/recompensa/:slug" element={<RewardViewer />} />
            <Route path="/games/templarios-dijeron" element={<TemplariosDijeron />} />
            <Route path="/games/templarios-dijeron/ranking" element={<TemplariosRanking />} />
          </Route>

          <Route path="*" element={<CatchAll />} />
        </Routes>
        </RewardClaimGate>
      </Suspense>
    </BrowserRouter>
  );
}