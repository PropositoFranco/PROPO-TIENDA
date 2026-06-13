import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode   = searchParams.get('ref') || '';
  const sessionId = searchParams.get('session_id') || '';
  const { session, loadProfile } = useAuthStore();
  const pushToast = useUIStore((s) => s.pushToast);

  // Precargar email desde Stripe si viene session_id en la URL
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const { data } = await supabase
        .from('access_codes')
        .select('user_email, code')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();
      if (data?.user_email) {
        const iframe = document.querySelector('iframe');
        iframe?.contentWindow?.postMessage({
          type:  'prefill-email',
          email: data.user_email,
          code:  data.code,
        }, '*');
      }
    })();
  }, [sessionId]);

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
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });
          if (signUpError || !signUpData?.user) {
            pushToast('Error al crear cuenta. Intenta de nuevo.');
            return;
          }
          const newUserId = signUpData.user.id;
          const { error } = await supabase.from('profiles').upsert({
            id: newUserId,
            email,
            templario_name: templarioName,
            avatar: avatar || '⚔️',
            level: 1,
            xp: 0,
            cristales: 0,
            rank: 'Bronce',
            role: 'templario',
            referral_code: Array.from({ length: 6 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join(''),
          }, { onConflict: 'id' });
          if (error) { pushToast('Error al guardar perfil'); return; }
          // Activar membresía si tiene pago en access_codes con su email
try {
  const { data: paid } = await supabase
    .from('access_codes')
    .select('id, amount_paid')
    .eq('user_email', email)
    .eq('is_used', false)
    .maybeSingle();

  if (paid) {
    await supabase
      .from('profiles')
      .update({
        membership_status:     'active',
membership_type:       'paid',
        membership_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paused_at:             null,
      })
      .eq('id', userId || newUserId);

    await supabase
      .from('access_codes')
      .update({ is_used: true, used_by: userId || newUserId })
      .eq('id', paid.id);
  }
} catch (e) {
  console.error('Error activando membresía por access_code:', e);
}

await loadProfile();
pushToast('¡Bienvenido al Templo!');
navigate('/bienvenido', { replace: true });
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

        const { data: nickTaken } = await supabase
          .from('profiles')
          .select('id')
          .ilike('templario_name', templarioName)
          .neq('id', userId)
          .maybeSingle();

        if (nickTaken) {
          pushToast('⚠️ Ese nombre ya está en uso. Elige otro.');
          const iframe = document.querySelector('iframe');
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'nick-taken' }, '*');
          }
          return;
        }

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
                  id: userId,
                  email: email,
                  avatar: avatar || existingProfile.avatar || '⚔️',
                  referral_code: referralCode,
                }
              : {
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

          try {
            const emailFilters = [`user_email.eq.${email}`];
            if (session?.user?.email && session.user.email !== email) {
              emailFilters.push(`user_email.eq.${session.user.email}`);
            }
            if (sessionId) {
              emailFilters.push(`session_id.eq.${sessionId}`);
            }

            const { data: pendingPkg } = await supabase
              .from('package_downloads')
              .select('id, package_type, membership_activated')
              .or(emailFilters.join(','))
              .eq('package_type', 'p3')
              .eq('membership_activated', false)
              .maybeSingle();

            if (pendingPkg) {
              const base = new Date();
              base.setMonth(base.getMonth() + 1);
              await supabase
                .from('profiles')
                .update({
                  membership_expires_at: base.toISOString(),
                  membership_status: 'active',
                  paused_at: null,
                })
                .eq('id', userId);
              await supabase
                .from('package_downloads')
                .update({ membership_activated: true })
                .eq('id', pendingPkg.id);
            }
          } catch (e) {
            console.error('Error activando membresía pendiente:', e);
          }

          // Activar membresía si tiene pago en access_codes con su email
try {
  const { data: paid } = await supabase
    .from('access_codes')
    .select('id, amount_paid')
    .eq('user_email', email)
    .eq('is_used', false)
    .maybeSingle();

  if (paid) {
    await supabase
      .from('profiles')
      .update({
        membership_status:     'active',
membership_type:       'paid',
        membership_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paused_at:             null,
      })
      .eq('id', userId);

    await supabase
      .from('access_codes')
      .update({ is_used: true, used_by: userId })
      .eq('id', paid.id);
  }
} catch (e) {
  console.error('Error activando membresía por access_code:', e);
}

await loadProfile();
pushToast('¡Bienvenido al Templo!');
navigate('/bienvenido', { replace: true });
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