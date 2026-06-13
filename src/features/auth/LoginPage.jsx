import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const pushToast = useUIStore((s) => s.pushToast);

  const smartNavigate = (profile) => {
    if (!profile?.templario_name) {
      navigate('/register', { replace: true });
    } else if (!profile?.tutorial_completed) {
      navigate('/tutorial', { replace: true });
    } else {
      navigate('/hub', { replace: true });
    }
  };

  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryResult, setRecoveryResult] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

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
  const profile = useAuthStore.getState().profile;
          smartNavigate(profile);
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
          setTimeout(() => {
            pushToast('¡Bienvenido, Templario!');
            const profile = useAuthStore.getState().profile;
            smartNavigate(profile);
          }, 800);
        } catch (err) {
          console.error('Login error:', err);
          document.getElementById('login-frame')
            ?.contentWindow?.postMessage({ type: 'login-error', message: 'Correo o contraseña incorrectos' }, '*');
        }
      }

      // ── RECUPERAR ACCESO ─────────────────────────────────────────────────
      if (event.data?.type === 'open-recovery') {
        setRecoveryEmail(event.data.email || '');
        setShowRecovery(true);
        return;
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

  const handleRecovery = async () => {
    if (!recoveryEmail.trim()) return;
    setRecoveryLoading(true);
    setRecoveryResult('');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recover-code`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: recoveryEmail.trim() }),
        }
      );
      const json = await res.json();
      if (json.sent) {
        setRecoveryResult('✅ Revisa tu correo — ahí está tu código de acceso.');
      } else {
        setRecoveryResult('❌ No encontramos ese email. ¿Usaste otro al pagar?');
      }
    } catch (_) {
      setRecoveryResult('❌ Error de conexión. Intenta de nuevo.');
    }
    setRecoveryLoading(false);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0a0015' }}>
      <iframe
        id="login-frame"
        src="/pages/login.html"
        onLoad={handleLoad}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />

      {/* recuperación de código movida al iframe login.html */}

      {/* Panel de recuperación */}
      {showRecovery && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(ellipse at 50% 50%,rgba(10,4,30,0.97),rgba(4,1,18,0.99))',
          fontFamily: "'Cinzel',serif", padding: 24,
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🔍</div>
          <div style={{
            fontSize: 'clamp(14px,3vw,18px)', fontWeight: 700, letterSpacing: '.05em',
            background: 'linear-gradient(135deg,#f0c040,#d4af37)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', marginBottom: 8, textAlign: 'center',
          }}>Recuperar tu Código</div>
          <div style={{
            fontFamily: "'Raleway',sans-serif", fontSize: 13,
            color: 'rgba(200,185,240,.6)', marginBottom: 24, textAlign: 'center', lineHeight: 1.8,
          }}>
            Ingresa el email con el que pagaste en Stripe.<br/>
            Te enviaremos tu código de acceso si:<br/>
            <span style={{ color: 'rgba(212,175,55,.7)' }}>
              · ¿Olvidaste tu contraseña?<br/>
              · ¿Pagaste pero no completaste tu registro?<br/>
              · ¿Perdiste tu código de invitación?
            </span>
          </div>
          <input
            type="email"
            placeholder="tu@email.com"
            value={recoveryEmail}
            onChange={e => setRecoveryEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRecovery()}
            style={{
              width: '100%', maxWidth: 320, padding: '12px 16px', borderRadius: 10,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.4)',
              color: '#f5d06e', fontFamily: "'Raleway',sans-serif", fontSize: 15,
              outline: 'none', marginBottom: 12, textAlign: 'center',
            }}
          />
          {recoveryResult && (
            <div style={{
              fontFamily: "'Raleway',sans-serif",
              color: recoveryResult.startsWith('✅') ? '#86efac' : '#ff6b6b',
              fontSize: 13, marginBottom: 16, textAlign: 'center', maxWidth: 300, lineHeight: 1.6,
            }}>
              {recoveryResult}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleRecovery}
              disabled={recoveryLoading}
              style={{
                padding: '11px 28px', borderRadius: 10, cursor: 'pointer',
                background: 'linear-gradient(135deg,rgba(212,175,55,.2),rgba(124,58,237,.3))',
                border: '1px solid rgba(212,175,55,.5)', color: '#d4af37',
                fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 3,
                opacity: recoveryLoading ? 0.6 : 1,
              }}
            >
              {recoveryLoading ? 'Buscando...' : '⚔️ BUSCAR'}
            </button>
            <button
              onClick={() => { setShowRecovery(false); setRecoveryResult(''); setRecoveryEmail(''); }}
              style={{
                padding: '11px 20px', borderRadius: 10, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.4)', fontFamily: "'Cinzel',serif",
                fontSize: 10, letterSpacing: 2,
              }}
            >
              VOLVER
            </button>
          </div>
        </div>
      )}
    </div>
  );
}