import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const { session, loadProfile } = useAuthStore();
  const pushToast = useUIStore((s) => s.pushToast);

  useEffect(() => {
    const handleMessage = async (event) => {
      // ✅ Validación de nick en tiempo real desde el iframe
      if (event.data?.type === 'check-nick') {
        const { nick } = event.data;
        const userId = session?.user?.id;
        const iframe = document.querySelector('iframe');

        const { data: nickTaken } = await supabase
          .from('profiles')
          .select('id')
          .ilike('templario_name', nick)
          .neq('id', userId || '00000000-0000-0000-0000-000000000000')
          .maybeSingle();

        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(
            { type: nickTaken ? 'nick-taken' : 'nick-ok' },
            '*'
          );
        }
        return;
      }

      if (event.data?.type === 'register-complete') {
       const { templarioName, email, password, avatar } = event.data;
        const userId = session?.user?.id;

        if (!userId) {
          console.error('❌ Sin sesión activa');
          pushToast('Error: inicia sesión de nuevo');
          navigate('/auth');
          return;
        }

        let referredBy = null;
        if (refCode) {
          const { data: referrer } = await supabase
            .from('profiles')
            .select('id, xp, cristales')
            .eq('referral_code', refCode.toUpperCase())
            .single();

          if (referrer) {
            referredBy = referrer.id;

            const { data: config } = await supabase
              .from('referral_configs')
              .select('*')
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (config) {
              await supabase
                .from('profiles')
                .update({
                  xp: (referrer.xp || 0) + (config.xp_reward_a || 500),
                  cristales: (referrer.cristales || 0) + (config.coins_reward_a || 2000),
                })
                .eq('id', referrer.id);

              await supabase
                .from('referral_events')
                .insert({ referrer_id: referrer.id, referred_id: userId, config_id: config.id });

              const { missionsService } = await import('../../services/missions.service');
              missionsService.trackEvent(referrer.id, 'referral_made');
            }
          }
        }

        const { data: existing } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', userId)
          .single();

        const referralCode = existing?.referral_code || 
          Array.from({ length: 6 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');

        // ✅ VERIFICAR si el templario_name ya está tomado por OTRO usuario
        const { data: nickTaken } = await supabase
          .from('profiles')
          .select('id')
          .ilike('templario_name', templarioName)
          .neq('id', userId)
          .maybeSingle();

        if (nickTaken) {
          pushToast('⚠️ Ese nombre ya está en uso. Elige otro.');
          // Mandar mensaje de vuelta al iframe para que muestre error
          const iframe = document.querySelector('iframe');
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'nick-taken' }, '*');
          }
          return;
        }

        // ✅ VERIFICAR si este userId ya tiene perfil completo (no sobreescribir)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, templario_name, level, xp')
          .eq('id', userId)
          .maybeSingle();

        const yaRegistrado = existingProfile?.templario_name && existingProfile?.level;

        const { error } = await supabase
          .from('profiles')
          .upsert(
            yaRegistrado
              ? {
                  // Si ya existe perfil completo: SOLO actualizar email/avatar, NO tocar stats ni nick
                  id: userId,
                  email: email,
                  avatar: avatar || existingProfile.avatar || '⚔️',
                  referral_code: referralCode,
                }
              : {
                  // Perfil nuevo: insertar todo
                  id: userId,
                  email: email,
                  templario_name: templarioName,
                  avatar: avatar || '⚔️',
                  level: 1,
                  xp: 0,
                  cristales: 0,
                  rank: 'Bronce',
                  role: 'templario',
                  referred_by: referredBy,
                  referral_code: referralCode,
                },
            { onConflict: 'id' }
          );

        if (error) {
          console.error('❌ Error guardando:', error.message);
          pushToast('Error al guardar perfil');
          navigate('/hub');
        } else {
          if (email && password) {
            await supabase.auth.updateUser({ email, password });
          }
          await loadProfile();
          localStorage.setItem('show_tstore_tutorial', '1');
          pushToast('¡Bienvenido al Templo!');
          navigate('/hub');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [session, navigate, loadProfile, pushToast, refCode]);

  return (
    <iframe
      src="/pages/activacion.html"
      style={{ width: '100vw', height: '100vh', border: 'none', display: 'block' }}
      title="Registro"
    />
  );
}