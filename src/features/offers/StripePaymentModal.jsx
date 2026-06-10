import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { supabase } from '../../services/supabase.js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CARD_STYLE = {
  style: {
    base: {
      color: '#f0e6ff',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
      fontSize: '16px',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#6b6b8a' },
    },
    invalid: { color: '#ff6a6a', iconColor: '#ff6a6a' },
  },
};

function CheckoutForm({ offer, userId, onSuccess, onClose }) {
  const stripe    = useStripe();
  const elements  = useElements();
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [showTerminos, setShowTerminos] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Crear PaymentIntent via Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            user_id:     userId,
            price_id:    offer.stripe_price_id,
            offer_id:    offer.id,
            offer_title: offer.title,
            type:        'offer',
            mode:        offer.is_subscription ? 'subscription' : 'payment',
            success_url: `${window.location.origin}/offers?success=1`,
            cancel_url:  `${window.location.origin}/offers`,
            use_elements: true,
          }),
        }
      );

      const { clientSecret, error: fnError } = await res.json();
      if (fnError) throw new Error(fnError);

      // 2. Confirmar pago con la tarjeta ingresada
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (stripeError) throw new Error(stripeError.message);

      if (paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const [accepted, setAccepted] = useState(false);

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(180,79,255,0.3)',
        borderRadius: '10px',
        padding: '16px',
        marginBottom: '16px',
      }}>
        <CardElement options={CARD_STYLE} />
      </div>

      {error && (
        <div style={{
          color: '#ff6a6a',
          fontSize: '13px',
          marginBottom: '12px',
          padding: '8px 12px',
          background: 'rgba(255,106,106,0.08)',
          borderRadius: '6px',
          border: '1px solid rgba(255,106,106,0.2)',
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        marginBottom: '14px',
      }}>
        <input
          type="checkbox"
          id="tc-check"
          checked={accepted}
          onChange={e => setAccepted(e.target.checked)}
          style={{ flexShrink: 0, marginTop: '3px', accentColor: '#b44fff', width: '15px', height: '15px', cursor: 'pointer' }}
        />
        <label htmlFor="tc-check" style={{ fontSize: '11px', color: '#9090b8', lineHeight: 1.6, cursor: 'pointer' }}>
          He leído y acepto los{' '}
          <span
            onClick={() => setShowTerminos(true)}
            style={{ color: '#b44fff', textDecoration: 'underline', cursor: 'pointer' }}>
            Términos y condiciones
          </span>
          . Entiendo que los pagos digitales no son reembolsables una vez activado el acceso.
        </label>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading || !accepted}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '10px',
          border: 'none',
          background: loading
            ? 'rgba(180,79,255,0.3)'
            : 'linear-gradient(110deg,#b8860b,#ffd700,#ff8c00,#ffd700)',
          backgroundSize: '250% 100%',
          color: loading ? '#f0e6ff' : '#0a0500',
          fontSize: '13px',
          fontWeight: '900',
          letterSpacing: '2px',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all .2s ease',
        }}
      >
        {loading ? '⏳ PROCESANDO...' : `⚡ PAGAR $${offer.price} USD`}
      </button>
    {/* Modal de términos encima del modal de pago */}
      {showTerminos && (
        <div
          onClick={() => setShowTerminos(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(3,1,18,0.92)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '520px', maxHeight: '80vh',
              background: 'linear-gradient(160deg,#12072a,#070512)',
              border: '1px solid rgba(180,79,255,0.4)',
              borderRadius: '18px', padding: '28px',
              overflowY: 'auto', position: 'relative',
              boxShadow: '0 0 60px rgba(180,79,255,0.2)',
            }}
          >
            <button onClick={() => setShowTerminos(false)} style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'none', border: 'none',
              color: '#6b6b8a', fontSize: '20px', cursor: 'pointer',
            }}>✕</button>

            <p style={{ fontSize: '10px', letterSpacing: '4px', color: '#b44fff', margin: '0 0 8px', fontWeight: 700 }}>⚔️ PROPO-TIENDA</p>
            <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 900, color: '#f0f0ff' }}>Términos y Condiciones</h2>

            {[
              { icon: '⚔', t: 'Qué es el Templo del Propósito', c: 'Plataforma educativa y de desarrollo personal de acceso digital. Al completar cualquier pago, el usuario obtiene acceso inmediato al contenido y beneficios correspondientes.' },
              { icon: '🌍', t: 'Los dos caminos', c: 'Al registrarte elegiste una misión. Tu primer $1 USD se transfiere de forma inmediata a esa causa — ya sea Bienestar Animal (alimento para perros en situación vulnerable) o Becas Templo del Propósito (acceso gratuito para alguien comprometido con crecer). Esta aportación es voluntaria, consciente y no reembolsable.' },
              { icon: '💳', t: 'Pagos y activación', c: 'Los pagos se procesan a través de Stripe. El acceso se activa de forma inmediata y automática al confirmarse el pago.' },
              { icon: '🚫', t: 'Sin reembolsos', c: 'Dado que el acceso digital se otorga de forma inmediata y parte de la aportación se transfiere al instante a causas externas, no se realizan reembolsos una vez completado el pago. Si tienes un problema técnico contáctanos — siempre buscamos la solución justa.' },
              { icon: '🔐', t: 'Propiedad Intelectual y Contenido', c: 'Todo el contenido de Templo del Propósito — textos, videos, materiales, herramientas y recursos — es propiedad exclusiva de Templo del Propósito. Al adquirir tu membresía aceptas que está estrictamente prohibido grabar, capturar, reproducir, distribuir o compartir cualquier contenido de la plataforma por cualquier medio. El incumplimiento resulta en cancelación inmediata de la membresía sin reembolso y puede derivar en acciones legales. Todo acceso queda registrado con marca de tiempo y datos de sesión.' },
              { icon: '🛡', t: 'Disputas', c: 'Al realizar un pago confirmas haber leído estos términos. Conservamos registro de fecha de pago, activación de acceso y causa seleccionada como evidencia ante Stripe o tu banco.' },
            ].map(({ icon, t, c }) => (
              <div key={t} style={{
                marginBottom: '14px', padding: '14px 16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(180,79,255,0.12)',
                borderRadius: '12px',
              }}>
                <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: '#d4aaff', letterSpacing: '1px' }}>{icon} {t}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#9080b8', lineHeight: 1.7 }}>{c}</p>
              </div>
            ))}

            <button
              onClick={() => setShowTerminos(false)}
              style={{
                width: '100%', padding: '14px', marginTop: '8px',
                background: 'linear-gradient(110deg,#b8860b,#ffd700,#ff8c00,#ffd700)',
                backgroundSize: '250% 100%',
                border: 'none', borderRadius: '10px',
                color: '#0a0500', fontSize: '13px',
                fontWeight: 900, letterSpacing: '2px', cursor: 'pointer',
              }}
            >
              ⚔️ ENTENDIDO — CONTINUAR
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

export default function StripePaymentModal({ offer, userId, onSuccess, onClose }) {
  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(3,1,18,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '420px',
          background: 'linear-gradient(160deg,#12072a,#070512)',
          border: '1px solid rgba(180,79,255,0.4)',
          borderRadius: '18px',
          padding: '28px',
          position: 'relative',
          boxShadow: '0 0 60px rgba(180,79,255,0.2), 0 24px 80px rgba(0,0,0,0.8)',
        }}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none',
            color: '#6b6b8a', fontSize: '20px',
            cursor: 'pointer', lineHeight: 1,
          }}
        >✕</button>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{
            fontSize: '10px', letterSpacing: '4px',
            color: '#b44fff', margin: '0 0 8px', fontWeight: 700,
          }}>
            ⚔️ PAGO SEGURO
          </p>
          <h2 style={{
            margin: '0 0 4px',
            fontSize: '18px', fontWeight: 900,
            color: '#f0f0ff', lineHeight: 1.2,
          }}>
            {offer.title}
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#9090b8' }}>
            {offer.description}
          </p>
        </div>

        {/* Precio */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: '6px',
          marginBottom: '20px',
          padding: '12px 16px',
          background: 'rgba(180,79,255,0.08)',
          borderRadius: '10px',
          border: '1px solid rgba(180,79,255,0.15)',
        }}>
          {offer.original_price && parseFloat(offer.original_price) > parseFloat(offer.price) && (
            <span style={{ fontSize: '13px', color: '#555570', textDecoration: 'line-through' }}>
              ${offer.original_price}
            </span>
          )}
          <span style={{ fontSize: '28px', fontWeight: 900, color: '#ffd700' }}>
            ${offer.price}
          </span>
          <span style={{ fontSize: '13px', color: '#9090b8' }}>USD</span>
          {offer.months_to_add > 0 && (
            <span style={{
              marginLeft: 'auto', fontSize: '11px', fontWeight: 700,
              color: '#5eead4', letterSpacing: '1px',
            }}>
              +{offer.months_to_add} {offer.months_to_add === 1 ? 'MES' : 'MESES'}
            </span>
          )}
        </div>

        {/* Formulario Stripe */}
        <Elements stripe={stripePromise}>
          <CheckoutForm
            offer={offer}
            userId={userId}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </Elements>

        {/* Footer seguridad */}
        <p style={{
          margin: '16px 0 0', textAlign: 'center',
          fontSize: '11px', color: '#444466', letterSpacing: '1px',
        }}>
          🔒 Pago procesado por Stripe · 100% seguro ·{' '}
          <a href="/terminos" target="_blank" rel="noopener noreferrer"
            style={{ color: '#6b6b8a', textDecoration: 'underline' }}>
            Términos y condiciones
          </a>
        </p>
      </div>
    </div>
  );
}