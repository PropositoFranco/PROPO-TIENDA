import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const pushToast = useUIStore((s) => s.pushToast);

  const handleLoad = (e) => {
    try {
      const doc = e.target.contentDocument;
      const script = doc.createElement('script');
      script.textContent = `
        window.addEventListener('message', function(e) {
          const btn = document.getElementById('btnConfirm');

          if (e.data?.type === 'login-success') {
            showMsg('¡Acceso concedido! Bienvenido, Templario.', 'success');
            if (btn) btn.textContent = '✓ Acceso Concedido';
          }

          if (e.data?.type === 'login-error') {
            showMsg(e.data.message || 'Error al acceder', 'error');
            if (btn) { btn.textContent = 'Confirmar Acceso'; btn.classList.remove('loading'); }
          }
        });
      `;
      doc.body.appendChild(script);
    } catch(err) {}
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        loadProfile().then(async () => {
  const { missionsService } = await import('../../services/missions.service');
  await missionsService.checkAndUpdateStreak(data.session.user.id);
  navigate('/hub', { replace: true });
});
      }
    });

    const handleMessage = async (event) => {

      // ── ADMIN ────────────────────────────────────────────────────────────
      if (event.data?.type === 'admin-login') {
        const { data: adminAuth, error: adminErr } = await supabase.auth.signInWithPassword({
          email: 'admin@t-store.local',
          password: event.data.password,
        });
        if (adminErr || !adminAuth.session) {
          document.getElementById('login-frame')
            ?.contentWindow?.postMessage({ type: 'login-error', message: 'Contraseña incorrecta' }, '*');
          return;
        }
        useAuthStore.setState({
          isAdmin: true,
          user: adminAuth.user,
          session: adminAuth.session,
          loading: false,
        });
        pushToast('Acceso admin concedido');
        navigate('/admin');
        return;
      }

      // ── YA SOY MIEMBRO: email + contraseña ──────────────────────────────
      if (event.data?.type === 'login-email') {
        const { email, password } = event.data;
        if (!email || !password) {
          document.getElementById('login-frame')
            ?.contentWindow?.postMessage({ type: 'login-error', message: 'Ingresa tu correo y contraseña' }, '*');
          return;
        }
        try {
          const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
          if (loginErr) throw loginErr;
          setSession(loginData.session);
          await loadProfile();
          const { missionsService } = await import('../../services/missions.service');
          await missionsService.checkAndUpdateStreak(loginData.session.user.id);
          document.getElementById('login-frame')
            ?.contentWindow?.postMessage({ type: 'login-success' }, '*');
          setTimeout(() => { pushToast('¡Bienvenido, Templario!'); navigate('/hub', { replace: true }); }, 800);
        } catch (err) {
          console.error('Login error:', err);
          document.getElementById('login-frame')
            ?.contentWindow?.postMessage({ type: 'login-error', message: 'Correo o contraseña incorrectos' }, '*');
        }
      }

      // ── PRIMERA VEZ: código de activación ───────────────────────────────
      if (event.data?.type === 'login-activation') {
        const code = event.data.code;
        if (!code || code.length < 3) {
          document.getElementById('login-frame')
            ?.contentWindow?.postMessage({ type: 'login-error', message: 'Ingresa tu código de invitación' }, '*');
          return;
        }
        try {
          const { data: codeRow, error: codeErr } = await supabase
            .from('access_codes')
            .select('*')
            .eq('code', code.trim().toUpperCase())
            .single();

          if (codeErr || !codeRow) {
            document.getElementById('login-frame')
              ?.contentWindow?.postMessage({ type: 'login-error', message: 'Código inválido o no encontrado' }, '*');
            return;
          }

          if (codeRow.is_used) {
            document.getElementById('login-frame')
              ?.contentWindow?.postMessage({ type: 'login-error', message: 'Código ya usado. Usa "Ya soy miembro".' }, '*');
            return;
          }

          // ✅ Si el código ya tiene used_by, intentar login directo (doble tap / reintento)
          if (codeRow.used_by) {
            const { data: retryLogin, error: retryErr } = await supabase.auth.signInWithPassword({
              email: `user_${codeRow.id}@t-store.app`,
              password: code.trim().toUpperCase(),
            });
            if (retryErr || !retryLogin.session) {
              document.getElementById('login-frame')
                ?.contentWindow?.postMessage({ type: 'login-error', message: 'Código ya usado. Usa "Ya soy miembro".' }, '*');
              return;
            }
            setSession(retryLogin.session);
            await loadProfile();
            document.getElementById('login-frame')
              ?.contentWindow?.postMessage({ type: 'login-success' }, '*');
            setTimeout(() => { pushToast('¡Bienvenido al Templo!'); navigate('/register', { replace: true }); }, 800);
            return;
          }

          // Código válido → registro nuevo
          const { data: authData, error: authErr } = await supabase.auth.signUp({
            email: `user_${codeRow.id}@t-store.app`,
            password: code.trim().toUpperCase(),
            options: { data: { code: code.trim().toUpperCase(), templario_name: 'Nuevo Templario', avatar: 'default' } },
          });
          if (authErr) throw authErr;

          // Marcar código como usado
          await supabase
            .from('access_codes')
            .update({ is_used: true, used_by: authData.user.id, used_at: new Date().toISOString() })
            .eq('id', codeRow.id);

          // ── Generar código de referido único para este usuario ──
          const refCode = Math.random().toString(36).substring(2, 7).toUpperCase();
          await supabase
            .from('profiles')
            .update({ referral_code: refCode })
            .eq('id', authData.user.id);

          // Obtener sesión real aunque signUp no la devuelva directamente
          let finalSession = authData.session;
          if (!finalSession) {
            const { data: sessionData } = await supabase.auth.getSession();
            finalSession = sessionData?.session ?? null;
          }

          if (!finalSession) {
            document.getElementById('login-frame')
              ?.contentWindow?.postMessage({ type: 'login-error', message: 'Error al iniciar sesión. Intenta de nuevo.' }, '*');
            return;
          }

          setSession(finalSession);
          await new Promise(r => setTimeout(r, 800));
          await loadProfile();
          const { missionsService } = await import('../../services/missions.service');
          await missionsService.checkAndUpdateStreak(authData.user.id);

          document.getElementById('login-frame')
            ?.contentWindow?.postMessage({ type: 'login-success' }, '*');
          setTimeout(() => { pushToast('¡Bienvenido al Templo!'); navigate('/register', { replace: true }); }, 800);

        } catch (err) {
          console.error('Activation error:', err);
          document.getElementById('login-frame')
            ?.contentWindow?.postMessage({ type: 'login-error', message: 'Error al activar. Intenta de nuevo.' }, '*');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  return (
    <iframe
      id="login-frame"
      src="/pages/login.html"
      onLoad={handleLoad}
      style={{ width:'100vw', height:'100vh', border:'none', display:'block' }}
    />
  );
}