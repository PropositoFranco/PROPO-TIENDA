import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useNavigate } from 'react-router-dom';
import useMembershipStore from '../../store/useMembershipStore';
import TStoreTutorial from '../store/TStoreTutorial';
import { missionsService } from '../../services/missions.service';
import { storeService } from '../../services/store.service';
import { supabase } from '../../services/supabase';

export default function HubPage() {
  const navigate = useNavigate();
  const { profile, user } = useAuthStore();
  const { cristales, xp, level, xpToNextLevel, rank, playerClass, templarioName } = usePlayerStore();
  const frameRef = useRef(null);

  const [showTutorial, setShowTutorial] = useState(
    localStorage.getItem('show_tstore_tutorial') === '1'
  );
  const [badgeTick, setBadgeTick] = useState(0);
const getVh = () => window.visualViewport?.height ?? window.innerHeight;
const [vh, setVh] = useState(() => getVh());

useEffect(() => {
  setTimeout(() => setVh(getVh()), 120);
}, []);

useEffect(() => {
  setTimeout(() => {
    sendToFrame('viewport', {
      w: frameRef.current?.offsetWidth || window.innerWidth,
      h: frameRef.current?.offsetHeight || vh,
    });
  }, 50);
}, [vh]);

useEffect(() => {
  const update = () => {
    setTimeout(() => setVh(getVh()), 350);
  };
  window.addEventListener('fullscreen-change', update);
  window.addEventListener('resize', update);
  window.visualViewport?.addEventListener('resize', update);
  screen.orientation?.addEventListener('change', update);
  window.addEventListener('orientationchange', update);
  return () => {
    window.removeEventListener('fullscreen-change', update);
    window.removeEventListener('resize', update);
    window.visualViewport?.removeEventListener('resize', update);
    screen.orientation?.removeEventListener('change', update);
    window.removeEventListener('orientationchange', update);
  };
}, []);

  useEffect(() => {
    const onStoreUpdate = () => setBadgeTick(t => t + 1);
    const onVisible = () => { if (document.visibilityState === 'visible') setBadgeTick(t => t + 1); };
    window.addEventListener('templeNewStatusChanged', onStoreUpdate);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('templeNewStatusChanged', onStoreUpdate);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const sendToFrame = (type, data) => {
    frameRef.current?.contentWindow?.postMessage({ type, data }, window.location.origin);
  };

  const handleFrameLoad = () => {
    sendToFrame('viewport', {
      w: frameRef.current?.offsetWidth  || window.innerWidth,
      h: frameRef.current?.offsetHeight || window.innerHeight,
    });
    // Mandar protocolo cacheado inmediato
    const { userProtocolo: proto, protocoLoFecha: protoFecha } = useMembershipStore.getState();
    sendToFrame('protocolo', proto ? { protocolo: proto, fecha: protoFecha ?? null } : null);
    // Refrescar desde Supabase y remandar
    if (user?.id) {
      useMembershipStore.getState().loadMembership(supabase, user.id).then(() => {
        const { userProtocolo: p2, protocoLoFecha: p2Fecha } = useMembershipStore.getState();
        sendToFrame('protocolo', p2 ? { protocolo: p2, fecha: p2Fecha ?? null } : null);
      });
    }

    // Mandar tiros de ruleta al cargar
    const isVip = useAuthStore.getState().isVip?.() ?? false;
    const uid = frameRef.current ? user?.id : null;
    if (uid && isVip) {
      supabase.from('vip_ruleta_wins').select('id').eq('user_id', uid)
        .then(({ data }) => {
          const spins = Math.max(0, level - (data?.length ?? 0));
          sendToFrame('vipSpins', spins);
        });
    } else {
      sendToFrame('vipSpins', 0);
    }
  };

  useEffect(() => {
    if (profile) sendToFrame('profile', { ...profile, user_email: user?.email || user?.user_email || '' });
  }, [profile]);

  useEffect(() => {
    if (cristales !== undefined) sendToFrame('cristales', cristales);
  }, [cristales]);

  useEffect(() => {
    sendToFrame('player', { level, xp, xpToNextLevel, rank, playerClass, templarioName });
  }, [level, xp, xpToNextLevel, rank, playerClass, templarioName]);

  

  // ── Mandar protocolo al iframe ────────────────────────────────
  const userProtocolo = useMembershipStore(state => state.userProtocolo);
  
  

  

  useEffect(() => {
    const protocoLoFecha = useMembershipStore.getState().protocoLoFecha;
    sendToFrame('protocolo', userProtocolo ? { protocolo: userProtocolo, fecha: protocoLoFecha ?? null } : null);
  }, [userProtocolo]);

  // ── BADGES — lógica real desde Supabase ──────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const perfilIncompleto = (profile?.templario_name && profile?.skool_name)
      ? false
      : !!profile && (!profile.templario_name || !profile.skool_name);

    Promise.all([
      missionsService.getMissionsWithProgress(user.id).catch(() => []),
      storeService.getUserOrders(user.id).catch(() => []),
      supabase.from('level_rewards').select('id, level').eq('is_active', true).then(r => r.data ?? []),
      supabase.from('user_rewards').select('reward_id').eq('user_id', user.id).then(r => r.data ?? []),
      supabase.from('products').select('id, category').eq('is_new', true).then(r => r.data ?? []),
      supabase.from('user_seen_products').select('product_id').eq('user_id', user.id).then(r => r.data ?? []),
    ]).then(async ([missions, orders, levelRewards, claimedRewards, newProducts, seenProducts]) => {

      const claimedRewardIds = new Set(claimedRewards.map(c => String(c.reward_id)));
      const seenProductIds   = new Set(seenProducts.map(p => String(p.product_id)));
      const unseenNew        = newProducts.filter(p => !seenProductIds.has(String(p.id)));

      const localSt = (() => {
        try { return JSON.parse(localStorage.getItem('templeNewStatus') || '{}'); }
        catch { return {}; }
      })();
      const hasNewClaves    = localSt.claves    === false ? false : unseenNew.some(p => p.category === 'claves');
      const hasNewVictorias = localSt.victorias === false ? false : unseenNew.some(p => p.category === 'victorias');
      const hasNewMapas     = localSt.mapas     === false ? false : unseenNew.some(p => p.category === 'mapas');

      const pendingLevelRewards = levelRewards.filter(
        r => r.level <= level && !claimedRewardIds.has(String(r.id))
      ).length;

      const pending = (missions ?? []).filter(
        m => m.percent >= 100 && !m.reward_claimed
      ).length;

      const productIds = new Set();
      (orders ?? []).forEach(o => {
        try {
          const parsed = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
          (parsed || []).forEach(i => { if (i.product_id) productIds.add(String(i.product_id).trim()); });
        } catch(_) {}
      });
      const activatedIds = (() => {
        try {
          return new Set(JSON.parse(localStorage.getItem('activated_tools') || '[]').map(id => String(id).trim()));
        } catch { return new Set(); }
      })();
      // Solo contar productos que realmente existen en la tabla
      let realProductIds = productIds;
      if (productIds.size > 0) {
        const { data: realProds } = await supabase
          .from('products').select('id').in('id', [...productIds]);
        realProductIds = new Set((realProds || []).map(p => String(p.id).trim()));
      }
      const libraryCount = [...realProductIds].filter(id => !activatedIds.has(id)).length;
      

      // ── Mapa gratuito por reclamar ────────────────────────────
      const { data: todosMapas } = await supabase
        .from('products')
        .select('id')
        .eq('category', 'mapas')
        .eq('is_active', true);
      const createdAt = profile?.created_at ?? user?.created_at;
      const semanas = createdAt
        ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000))
        : 0;
      const mapasDisponibles = Math.min(semanas + 1, (todosMapas ?? []).length);
      const mapasYaObtenidos = [...realProductIds].filter(id =>
        (todosMapas ?? []).some(m => String(m.id) === id)
      ).length;
      const hasMapaGratis = mapasYaObtenidos < mapasDisponibles;

      sendToFrame('badges', {
        claves:    { show: hasNewClaves,                                  type: 'new',   label: 'NEW' },
        victorias: { show: hasNewVictorias,                               type: 'new',   label: 'NEW' },
        mapas:     hasMapaGratis
                     ? { show: true,        type: 'free', label: '¡GRATIS!' }
                     : { show: hasNewMapas, type: 'new',  label: 'NEW' },
        center:    { show: false,                                          type: 'gold',  label: '!'   },
        missions:  { show: pending > 0,                                   type: 'alert', label: pending > 9 ? '9+' : String(pending) },
        library:   { show: libraryCount > 0,                              type: 'count', label: libraryCount > 9 ? '9+' : String(libraryCount) },
        profile:   { show: perfilIncompleto || pendingLevelRewards > 0,   type: 'gold',  label: '!'   },
      });

      // Re-mandar vipSpins después de badges para que no se pisen
      const isVip2 = useAuthStore.getState().isVip?.() ?? false;
      if (user?.id && isVip2) {
        supabase.from('vip_ruleta_wins').select('id').eq('user_id', user.id)
          .then(({ data }) => {
            const spins = Math.max(0, level - (data?.length ?? 0));
            sendToFrame('vipSpins', spins);
          });
      }
    });

  }, [profile?.id, user?.id, badgeTick]);

  // ── VIP RULETA SPINS → iframe ─────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const isVip = useAuthStore.getState().isVip?.() ?? false;
    if (!isVip) { sendToFrame('vipSpins', 0); return; }
    supabase
      .from('vip_ruleta_wins')
      .select('id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const used = data?.length ?? 0;
        const spins = Math.max(0, level - used);
        sendToFrame('vipSpins', spins);
      });
  }, [user?.id, level, badgeTick]);

  // ── Navegación desde el iframe ────────────────────────────────
  useEffect(() => {
    const handleMessage = (event) => {
      const { type, data } = event.data || {};
      if (type === 'navigate') {
        const [path, params] = data.split('?');
        if (params) {
          const p = new URLSearchParams(params);
          if (p.get('tab')) localStorage.setItem('storeTab', p.get('tab'));
        }
        navigate(`/${path}`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  return (
    <>
      <iframe
        ref={frameRef}
        src="/pages/hub.html"
        onLoad={handleFrameLoad}
        style={{
          width: '100%',
          height: `${vh - 68}px`,
          border: 'none',
          display: 'block',
          marginTop: '68px',
        }}
      />
      {showTutorial && (
        <TStoreTutorial onComplete={() => {
          localStorage.removeItem('show_tstore_tutorial');
          setShowTutorial(false);
        }} />
      )}

      <button
        onClick={() => setShowTutorial(true)}
        style={{
          position: 'fixed',
          bottom: window.innerWidth < 1024 ? 45 : 88,
          right: window.innerWidth < 1024 ? 8 : 16,
          zIndex: 100,
          background: window.innerWidth < 1024 ? 'rgba(10,5,30,0.7)' : 'rgba(212,175,55,0.15)',
          border: window.innerWidth < 1024 ? '1px solid rgba(212,175,55,0.3)' : '1px solid #D4AF37',
          color: window.innerWidth < 1024 ? 'rgba(255,229,102,0.5)' : '#FFE566',
          fontFamily: "'Cinzel',serif",
          fontSize: window.innerWidth < 1024 ? 8 : 10,
          padding: window.innerWidth < 1024 ? '4px 8px' : '8px 14px',
          borderRadius: 8,
          cursor: 'pointer',
          letterSpacing: 2,
          opacity: window.innerWidth < 1024 ? 0.5 : 1,
        }}
      >
        ✦ TUTORIAL
      </button>
    </>
  );
}