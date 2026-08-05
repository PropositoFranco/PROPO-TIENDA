import { useEffect, useRef } from 'react';
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
  const refCodeFromStripe = useRef('');

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const { data } = await supabase
        .rpc('get_access_code_by_session', { p_session_id: sessionId })
        .maybeSingle();
      if (!data?.user_email) return;

      // Si hay sesión activa de OTRO usuario, cerrarla antes de proceder
      const { data: { user: activeUser } } = await supabase.auth.getUser();
      if (activeUser && activeUser.email !== data.user_email) {
        await supabase.auth.signOut();
      }

      // Guardar referral_code del pago para usarlo como fallback
      if (data.referral_code) refCodeFromStripe.current = data.referral_code;

      let attempts = 0;
      const tryPost = () => {
        const iframe = document.querySelector('iframe');
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({
            type:  'prefill-email',
            email: data.user_email,
            code:  data.code,
          }, '*');
        } else if (attempts < 10) {
          attempts++;
          setTimeout(tryPost, 500);
        }
      };
      setTimeout(tryPost, 800);
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

        // ── SELLO: si viene de un pago (session_id en la URL), el correo
        // del registro DEBE coincidir con el correo real de Stripe.
        // Validado en servidor vía RPC — no depende de que el campo se
        // haya quedado readOnly en el navegador.
        if (sessionId) {
          const { data: pagoReal } = await supabase
            .rpc('get_access_code_by_session', { p_session_id: sessionId })
            .maybeSingle();
          if (
            pagoReal?.user_email &&
            pagoReal.user_email.trim().toLowerCase() !== email.trim().toLowerCase()
          ) {
            pushToast('⚠️ El correo no coincide con el de tu pago. Usa el mismo correo con el que pagaste.');
            return;
          }
        }

        // ── Respaldo de atribución: si el navegador nunca visitó una URL
        // con ?aliado=slug (por eso localStorage.pending_aliado_slug está
        // vacío), se recupera desde la orden real del pago. No pisa nada
        // si ya existe un slug capturado por el camino normal.
        let aliadoSlugDesdeOrden = null;
        if (sessionId && !localStorage.getItem('pending_aliado_slug')) {
          const { data: slugData } = await supabase
            .rpc('get_aliado_slug_by_session', { p_session_id: sessionId });
          aliadoSlugDesdeOrden = slugData || null;
        }

        if (!userId) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                referral_code: refCode || null,
                aliado_slug: localStorage.getItem('pending_aliado_slug') || null,
              },
            },
          });
          if (signUpError || !signUpData?.user) {
            pushToast('Error al crear cuenta. Intenta de nuevo.');
            return;
          }
          const newUserId = signUpData.user.id;

          // ── FIX: sincronizar la sesión nueva en el store de inmediato.
          // Sin esto, useAuthStore.user sigue en null después del registro,
          // loadProfile() no hace nada (if (!user) return), y la primera
          // ruta protegida que se toque (ej. /hub) expulsa a /login aunque
          // la cuenta y la sesión sí existan.
          if (signUpData.session) {
            useAuthStore.getState().setSession(signUpData.session);
          }

          const { data: accessCodeRow } = await supabase
            .from('access_codes')
            .select('referral_code')
            .eq('user_email', email.trim().toLowerCase())
            .not('referral_code', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const effectiveRefCode = (
            refCode ||
            accessCodeRow?.referral_code ||
            refCodeFromStripe.current ||
            localStorage.getItem('pending_ref_code') ||
            ''
          ).toUpperCase();

          const refProfile = effectiveRefCode ? await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', effectiveRefCode)
            .maybeSingle()
            .then(r => r.data) : null;

          // Leer lo que el trigger guardó (si lo hizo)
          const { data: triggerData } = await supabase
            .from('profiles')
            .select('referral_code, referred_by')
            .eq('id', newUserId)
            .maybeSingle();

          // referred_by: trigger > frontend > null (triple fallback)
          const resolvedReferredBy = triggerData?.referred_by || refProfile?.id || null;

          // Si el frontend resolvió el referido pero el trigger no lo procesó, hacerlo aquí
          if (resolvedReferredBy && !triggerData?.referred_by) {
            const { data: referrerProfile } = await supabase
              .from('profiles')
              .select('id, xp, cristales')
              .eq('id', resolvedReferredBy)
              .maybeSingle();

            const { data: config } = await supabase
              .from('referral_configs')
              .select('*')
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (referrerProfile && config) {
              await supabase.from('profiles').update({
                xp: (referrerProfile.xp || 0) + (config.xp_reward_a || 500),
                cristales: (referrerProfile.cristales || 0) + (config.coins_reward_a || 2000),
              }).eq('id', resolvedReferredBy);

              await supabase.from('referral_events').insert({
                referrer_id: resolvedReferredBy,
                referred_id: newUserId,
                config_id: config.id,
              });
            }
          }

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
            referral_code: triggerData?.referral_code ||
              Array.from({ length: 6 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join(''),
            referred_by: resolvedReferredBy,
            aliado_slug_registro: localStorage.getItem('pending_aliado_slug') || aliadoSlugDesdeOrden || null,
          }, { onConflict: 'id' });
          if (error) { pushToast('Error al guardar perfil'); return; }
          // Activar membresía si tiene pago en access_codes con su email
try {
  const { data: paid } = await supabase
    .from('access_codes')
    .select('id, amount_paid, membership_type, duration_months, includes_pack1, includes_pack2')
    .eq('user_email', email)
    .eq('is_used', false)
    .maybeSingle();

  if (paid) {
    const mType = paid.membership_type || 'base';
    const months = paid.duration_months || 1;
    const expires = mType === 'vip' && !paid.duration_months
      ? null
      : new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();

    await supabase
      .from('profiles')
      .update({
        membership_status:     'active',
        membership_type:       mType,
        membership_expires_at: expires,
        paused_at:             null,
        ...(paid.includes_pack1 ? { pack1_active: true } : {}),
        ...(paid.includes_pack2 ? { pack2_active: true } : {}),
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

await useAuthStore.getState().loadProfile();
pushToast('¡Bienvenido al Templo!');
navigate('/bienvenido', { replace: true });
          return;
        }

        let referredBy = null;
        const { data: accessCodeRowExisting } = await supabase
          .from('access_codes')
          .select('referral_code')
          .eq('user_email', email.trim().toLowerCase())
          .not('referral_code', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const effectiveRefCodeExisting = (
          refCode ||
          accessCodeRowExisting?.referral_code ||
          refCodeFromStripe.current ||
          localStorage.getItem('pending_ref_code') ||
          ''
        ).toUpperCase();

        if (effectiveRefCodeExisting) {
          const { data: referrer } = await supabase
            .from('profiles')
            .select('id, xp, cristales')
            .eq('referral_code', effectiveRefCodeExisting)
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
          .select('id, templario_name, level, xp, referred_by, avatar')
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
      templario_name: templarioName,
      avatar: avatar || existingProfile.avatar || '⚔️',
      referral_code: referralCode,
      ...(referredBy ? { referred_by: referredBy } : existingProfile?.referred_by ? { referred_by: existingProfile.referred_by } : {}),
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
                  aliado_slug_registro: localStorage.getItem('pending_aliado_slug') || aliadoSlugDesdeOrden || null,
                },
            { onConflict: 'id' }
          );

        if (error) {
          console.error('❌ Error guardando:', error.message);
          pushToast('Error al guardar perfil');
          navigate('/hub');
        } else {
          // ✅ FIX: Si el usuario viene de activar un código (email placeholder @t-store.app),
          // actualizar email/password via Edge Function (sin disparar "Confirm Email Change").
          // Si ya tiene email real (flujo Stripe), NO tocar auth en absoluto.
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          const isPlaceholder = currentUser?.email?.endsWith('@t-store.app') ?? false;

          if (email && password && isPlaceholder) {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const { error: edgeFnError } = await supabase.functions.invoke('update-auth-email', {
              body: { userId, newEmail: email, newPassword: password },
              headers: { Authorization: `Bearer ${currentSession?.access_token}` },
            });
            if (edgeFnError) {
              console.error('❌ Error actualizando auth:', edgeFnError.message);
              pushToast('Error al finalizar registro. Intenta de nuevo.');
              return;
            }
            // Re-autenticar con las nuevas credenciales porque updateUserById invalida el JWT
            const { data: reAuth, error: reAuthErr } = await supabase.auth.signInWithPassword({
              email: email.trim().toLowerCase(),
              password: password,
            });
            if (reAuthErr || !reAuth?.session) {
              pushToast('Error al finalizar sesión. Intenta iniciar sesión manualmente.');
              return;
            }
            // Sincronizar nueva sesión en el store antes de continuar
            useAuthStore.getState().setSession(reAuth.session);
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
    .select('id, amount_paid, membership_type, duration_months')
    .eq('user_email', email)
    .eq('is_used', false)
    .maybeSingle();

  if (paid) {
    const mType = paid.membership_type || 'base';
    const months = paid.duration_months || 1;
    const expires = mType === 'vip' && !paid.duration_months
      ? null
      : new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();

    await supabase
      .from('profiles')
      .update({
        membership_status:     'active',
        membership_type:       mType,
        membership_expires_at: expires,
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

await useAuthStore.getState().loadProfile();
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