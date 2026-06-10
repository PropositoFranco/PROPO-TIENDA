/* ═══════════════════════════════════════════════════════════════
   TerminosPage.jsx — Templo del Propósito
   Ruta: /terminos
   Congruente con el estilo oscuro/dorado/púrpura del sistema
═══════════════════════════════════════════════════════════════ */

import { useNavigate } from 'react-router-dom';

export default function TerminosPage() {
  const navigate = useNavigate();
  return (
    <>
      <style>{CSS}</style>
      <div className="tc-root">

        {/* fondo hex */}
        <svg className="tc-hexgrid" aria-hidden viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="hex2" width="28" height="32" patternUnits="userSpaceOnUse" patternTransform="rotate(10)">
              <polygon points="14,2 26,8 26,24 14,30 2,24 2,8"
                fill="none" stroke="rgba(180,79,255,0.05)" strokeWidth="0.8"/>
            </pattern>
          </defs>
          <rect width="200" height="200" fill="url(#hex2)"/>
        </svg>

        {/* glow top */}
        <div className="tc-topglow" aria-hidden />

        <div className="tc-wrap">

          {/* back */}
          <button
            onClick={() => navigate('/offers')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(180,79,255,.1)',
              border: '1px solid rgba(180,79,255,.4)',
              borderRadius: '8px', padding: '10px 20px',
              color: '#d4aaff', fontSize: '14px', cursor: 'pointer',
              marginBottom: '32px', transition: 'all .2s',
              fontFamily: 'Cinzel, serif', letterSpacing: '1px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(180,79,255,.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(180,79,255,.1)'; }}
          >
            ← Volver
          </button>

          {/* eyebrow */}
          <p className="tc-eyebrow">⚔️ PROPO-TIENDA · TEMPLO DEL PROPÓSITO</p>

          {/* título */}
          <h1 className="tc-title">Términos y<br/>Condiciones</h1>
          <div className="tc-title-line" />
          <p className="tc-version">Versión 1.0 · Junio 2025</p>

          {/* secciones */}
          <div className="tc-sections">

            <Section icon="⚔" label="Qué es el Templo del Propósito">
              El Templo del Propósito y su Propo-Tienda son plataformas educativas y de desarrollo personal de acceso digital.
              Al completar cualquier pago, el usuario obtiene acceso inmediato al contenido y beneficios correspondientes.
              Cada plan, oferta especial o paquete se activa de forma automática al confirmarse el pago.
            </Section>

            <Section icon="🌍" label="Los dos caminos">
              <p className="tc-body">Al registrarse, cada usuario elige una misión que define el destino de su aportación solidaria:</p>
              <div className="tc-paths">
                <div className="tc-path">
                  <span className="tc-path-icon">🐾</span>
                  <div>
                    <p className="tc-path-label">Bienestar Animal</p>
                    <p className="tc-path-desc">
                      Tu primer $1 USD se destina directamente a brindar alimento a perros en situación de calle
                      o vulnerabilidad. Cada aportación tiene impacto directo y verificable.
                    </p>
                  </div>
                </div>
                <div className="tc-path">
                  <span className="tc-path-icon">⚜</span>
                  <div>
                    <p className="tc-path-label">Becas Templo del Propósito</p>
                    <p className="tc-path-desc">
                      Tu dólar se convierte en acceso al Templo para alguien que no puede costearlo.
                      Con 6 personas en este camino se financia una beca completa dentro del sistema.
                    </p>
                  </div>
                </div>
              </div>
              <div className="tc-callout">
                El primer $1 USD de cada transacción se transfiere de forma inmediata a la causa elegida.
                Esta aportación es <strong>voluntaria, consciente y no reembolsable</strong> por su naturaleza solidaria.
              </div>
            </Section>

            <Section icon="💳" label="Pagos y activación">
              Los pagos se procesan de forma segura a través de <strong>Stripe</strong>. El acceso a membresías,
              ofertas especiales y paquetes adicionales se activa de manera inmediata y automática al completarse
              el pago. No existe periodo de espera ni validación manual.
            </Section>

            <Section icon="🚫" label="Política de reembolsos">
              Dado que el acceso al contenido digital se otorga de forma inmediata y parte de la aportación
              se transfiere en el momento a causas externas, <strong>no se realizan reembolsos una vez
              completado el pago</strong>. Esto aplica a:
              <ul className="tc-list">
                <li>Acceso base al Templo ($1 USD primer mes)</li>
                <li>Paquetes adicionales de la Propo-Tienda</li>
                <li>Ofertas especiales y extensiones de membresía</li>
                <li>Paquetes de PropoCoins</li>
              </ul>
              Si tienes un problema técnico con tu cuenta, contáctanos directamente —
              siempre buscamos la solución justa.
            </Section>

            <Section icon="🛡" label="Disputas y contracargos">
              Al realizar un pago en nuestra plataforma, el usuario confirma haber leído y aceptado estos términos.
              En caso de disputa, conservamos registro de:
              <ul className="tc-list">
                <li>Fecha y hora exacta del pago</li>
                <li>Activación del acceso en la cuenta</li>
                <li>Causa solidaria seleccionada al registrarse</li>
                <li>Dirección de correo electrónico vinculada</li>
              </ul>
              Esta información se presenta como evidencia ante Stripe o la institución bancaria correspondiente.
            </Section>

            <Section icon="✉" label="Contacto">
              Si tienes alguna duda antes o después de tu compra, escríbenos.
              Somos transparentes, accesibles y siempre respondemos.
              Creemos en construir confianza, no en ocultarnos detrás de documentos.
            </Section>

          </div>

          {/* pie legal */}
          <div className="tc-footer-legal">
            <div className="tc-footer-line" />
            <p>
              Al completar cualquier pago en el Templo del Propósito o la Propo-Tienda,
              el usuario confirma haber leído y aceptado estos términos y condiciones en su totalidad.
            </p>
            <p className="tc-footer-copy">© 2025 Templo del Propósito · Todos los derechos reservados</p>

            {/* botón continuar */}
            <button
              onClick={() => navigate('/offers')}
              style={{
                display: 'block', width: '100%', maxWidth: '400px',
                margin: '32px auto 0',
                padding: '16px',
                background: 'linear-gradient(110deg,#b8860b,#ffd700,#ff8c00,#ffd700)',
                backgroundSize: '250% 100%',
                animation: 'btn-gold-slide 2.4s linear infinite',
                border: 'none', borderRadius: '12px',
                color: '#0a0500', fontSize: '14px',
                fontWeight: '900', letterSpacing: '3px',
                cursor: 'pointer', fontFamily: 'Cinzel, serif',
              }}
            >
              ⚔️ ENTENDIDO — CONTINUAR
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

/* ── Sección reutilizable ─────────────────────────────────────── */
function Section({ icon, label, children }) {
  return (
    <div className="tc-section">
      <div className="tc-section-head">
        <span className="tc-section-icon">{icon}</span>
        <h2 className="tc-section-title">{label}</h2>
      </div>
      <div className="tc-section-body">
        {typeof children === 'string'
          ? <p className="tc-body" dangerouslySetInnerHTML={{ __html: children }} />
          : children}
      </div>
    </div>
  );
}

/* ══ CSS ══════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;900&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');

.tc-root {
  min-height: 100vh;
  background: #030112;
  position: relative;
  overflow: hidden;
  font-family: 'Crimson Pro', Georgia, serif;
  color: #c8c0e0;
}

.tc-hexgrid {
  position: fixed; inset: 0;
  width: 100%; height: 100%;
  pointer-events: none; z-index: 0;
}

.tc-topglow {
  position: fixed;
  top: -200px; left: 50%;
  transform: translateX(-50%);
  width: 700px; height: 500px;
  background: radial-gradient(ellipse, rgba(180,79,255,.12) 0%, rgba(255,215,0,.04) 40%, transparent 70%);
  pointer-events: none; z-index: 0;
}

.tc-wrap {
  position: relative; z-index: 1;
  max-width: 760px;
  margin: 0 auto;
  padding: 80px 32px 100px;
}

/* eyebrow */
.tc-eyebrow {
  font-family: 'Cinzel', serif;
  font-size: 10px; letter-spacing: 6px;
  color: #b44fff; margin: 0 0 20px;
  font-weight: 600;
}

/* título */
.tc-title {
  font-family: 'Cinzel', serif;
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 900; line-height: 1.05;
  background: linear-gradient(135deg, #fff 20%, #d4aaff 55%, #ffd700 90%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 16px;
  animation: fade-up .8s cubic-bezier(.22,1,.36,1) both;
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.tc-title-line {
  width: 80px; height: 3px;
  background: linear-gradient(90deg, #b44fff, #ffd700);
  border-radius: 2px;
  margin-bottom: 12px;
  animation: fade-up .8s .1s cubic-bezier(.22,1,.36,1) both;
}

.tc-version {
  font-size: 13px; color: #6b6b8a;
  margin: 0 0 56px; letter-spacing: 1px;
  animation: fade-up .8s .15s cubic-bezier(.22,1,.36,1) both;
}

/* secciones */
.tc-sections {
  display: flex; flex-direction: column; gap: 2px;
}

.tc-section {
  border: 1px solid rgba(180,79,255,.12);
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(160deg, rgba(18,7,42,.7) 0%, rgba(7,5,18,.7) 100%);
  backdrop-filter: blur(8px);
  margin-bottom: 14px;
  animation: fade-up .7s cubic-bezier(.22,1,.36,1) both;
  transition: border-color .25s;
}
.tc-section:hover { border-color: rgba(180,79,255,.28); }

.tc-section:nth-child(1) { animation-delay: .2s; }
.tc-section:nth-child(2) { animation-delay: .3s; }
.tc-section:nth-child(3) { animation-delay: .4s; }
.tc-section:nth-child(4) { animation-delay: .5s; }
.tc-section:nth-child(5) { animation-delay: .6s; }
.tc-section:nth-child(6) { animation-delay: .7s; }

.tc-section-head {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(180,79,255,.1);
}

.tc-section-icon {
  font-size: 20px; flex-shrink: 0;
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(180,79,255,.1);
  border: 1px solid rgba(180,79,255,.2);
  border-radius: 10px;
}

.tc-section-title {
  font-family: 'Cinzel', serif;
  font-size: 14px; font-weight: 600;
  color: #e0d0ff; margin: 0;
  letter-spacing: 1px;
}

.tc-section-body {
  padding: 20px 24px 24px;
}

.tc-body {
  font-size: 16px; line-height: 1.75;
  color: #a090c0; margin: 0 0 12px;
}
.tc-body:last-child { margin-bottom: 0; }
.tc-body strong { color: #d4c0f0; font-weight: 600; }

/* paths */
.tc-paths {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 12px; margin: 12px 0;
}

.tc-path {
  display: flex; gap: 12px; align-items: flex-start;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(180,79,255,.15);
  border-radius: 12px; padding: 14px 16px;
}

.tc-path-icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }

.tc-path-label {
  font-family: 'Cinzel', serif;
  font-size: 11px; font-weight: 600;
  color: #ffd700; letter-spacing: 1px;
  margin: 0 0 6px; text-transform: uppercase;
}

.tc-path-desc {
  font-size: 13px; color: #8070a8;
  line-height: 1.6; margin: 0;
}

/* callout */
.tc-callout {
  background: rgba(180,79,255,.07);
  border-left: 2px solid #b44fff;
  border-radius: 0 10px 10px 0;
  padding: 14px 18px;
  font-size: 14px; color: #c0a8e8;
  line-height: 1.7; margin-top: 14px;
}
.tc-callout strong { color: #e8d0ff; }

/* lista */
.tc-list {
  margin: 12px 0 0 4px;
  padding: 0; list-style: none;
  display: flex; flex-direction: column; gap: 8px;
}
.tc-list li {
  font-size: 15px; color: #9080b8; line-height: 1.5;
  padding-left: 20px; position: relative;
}
.tc-list li::before {
  content: '⚔';
  position: absolute; left: 0;
  font-size: 10px; color: #b44fff;
  top: 4px;
}

/* footer */
.tc-footer-legal {
  margin-top: 56px;
  animation: fade-up .7s .8s cubic-bezier(.22,1,.36,1) both;
}

.tc-footer-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(180,79,255,.4), rgba(255,215,0,.3), transparent);
  margin-bottom: 28px;
}

.tc-footer-legal p {
  font-size: 13px; color: #5a5070;
  line-height: 1.7; text-align: center; margin: 0 0 10px;
}

.tc-footer-copy {
  font-family: 'Cinzel', serif;
  font-size: 11px !important;
  letter-spacing: 2px;
  color: #3a3050 !important;
}

/* responsive */
@media (max-width: 600px) {
  .tc-wrap { padding: 48px 20px 80px; }
  .tc-paths { grid-template-columns: 1fr; }
  .tc-section-head { padding: 16px 18px 14px; }
  .tc-section-body { padding: 16px 18px 20px; }
}
@keyframes btn-gold-slide {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
`;