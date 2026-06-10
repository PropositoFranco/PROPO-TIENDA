import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import StripePaymentModal from '../offers/StripePaymentModal';

// ─── IDs de los productos ────────────────────────────────────────────────────
const OFFER_IDS = {
  basic: 'b18a2303-5bab-444f-b817-323a4ef6ff11',
  elite: '077216b1-0074-43d3-a680-ae018275eade',
};

// ─── Hook de acceso ──────────────────────────────────────────────────────────
function useArsenalAccess() {
  const [access, setAccess]   = useState('free'); // 'free' | 'basic' | 'elite'
  const [email,  setEmail]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { check(); }, []);

  async function check() {
    const params    = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    // Viene de Stripe
    if (sessionId) {
      const { data } = await supabase
        .from('arsenal_purchases')
        .select('plan, email')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();

      if (data) {
        localStorage.setItem('arsenal_email', data.email);
        setEmail(data.email);
        setAccess(data.plan);
        setLoading(false);
        window.history.replaceState({}, '', '/arsenal-rpg');
        return;
      }
    }

    // Visita posterior
    const saved = localStorage.getItem('arsenal_email');
    if (saved) {
      const { data: purchases } = await supabase
        .from('arsenal_purchases')
        .select('plan')
        .eq('email', saved)
        .order('created_at', { ascending: false });

      if (purchases?.length) {
        const hasElite = purchases.some(p => p.plan === 'elite');
        setAccess(hasElite ? 'elite' : 'basic');
        setEmail(saved);
      }
    }

    setLoading(false);
  }

  return { access, email, loading };
}

// ─── Botón regresar — discreto, esquina izquierda, no compite con la venta ──
function BackButton({ navigate }) {
  return (
    <button
      onClick={() => navigate('/hub')}
      style={{
        position: 'absolute',
        left: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'transparent',
        border: '1px solid rgba(212,175,55,0.15)',
        borderRadius: '4px',
        color: 'rgba(232,223,192,0.3)',
        fontFamily: "'Cinzel', serif",
        fontSize: '9px',
        letterSpacing: '2px',
        padding: '6px 12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'rgba(212,175,55,0.6)';
        e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'rgba(232,223,192,0.3)';
        e.currentTarget.style.borderColor = 'rgba(212,175,55,0.15)';
      }}
    >
      ← VOLVER AL TEMPLO
    </button>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function ArsenalRPGPage() {
  const { access, email, loading } = useArsenalAccess();
  const accessRef = useRef(access);
  useEffect(() => { accessRef.current = access; }, [access]);
  const [buying, setBuying]           = useState(false);
  const [stripeOffer, setStripeOffer] = useState(null);
  const navigate                      = useNavigate();

  const ARSENAL_OFFERS = {
    basic: {
      id: 'b18a2303-5bab-444f-b817-323a4ef6ff11',
      title: '⚔️ Arsenal RPG — Pack Base',
      description: '6 componentes JSX + tokens.js + README',
      price: '8',
      original_price: null,
      stripe_price_id: 'price_1TgAhpHAhN6AYkd2HLEtBwJX',
      months_to_add: 0,
      is_subscription: false,
    },
    elite: {
      id: '077216b1-0074-43d3-a680-ae018275eade',
      title: '👑 Arsenal RPG — Pack Élite',
      description: '6 componentes avanzados exclusivos',
      price: '2',
      original_price: null,
      stripe_price_id: 'price_1TgAj7HAhN6AYkd2iEubRvRU',
      months_to_add: 0,
      is_subscription: false,
    },
  };

  useEffect(() => {
    function handleMessage(e) {
      if (e.data?.type === 'ARSENAL_BUY') {
        const plan = e.data.plan;
        if (plan === 'elite' && accessRef.current === 'free') {
          handleComprar('basic');
        } else {
          handleComprar(plan);
        }
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  function handleComprar(plan) {
    setStripeOffer(ARSENAL_OFFERS[plan]);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0812',
      fontFamily: "'Crimson Text', Georgia, serif",
      color: '#E8DFC0',
      overflowX: 'hidden',
    }}>

      {/* ── Modal de Stripe ── */}
      {stripeOffer && (
        <StripePaymentModal
          offer={stripeOffer}
          userId={null}
          onSuccess={() => {
            setStripeOffer(null);
            window.location.reload();
          }}
          onClose={() => setStripeOffer(null)}
        />
      )}

      {/* ── La guía completa en iframe ── */}
      <iframe
        src={`/guia_arsenal_rpg.html?access=${access}`}
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          display: 'block',
        }}
        title="Arsenal RPG"
      />

      {/* ── Barra de acceso flotante abajo ── */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 1000,
        background: 'rgba(10,8,18,0.97)',
        borderTop: '1px solid rgba(212,175,55,0.25)',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        backdropFilter: 'blur(12px)',
        // ← position relative para que el BackButton se posicione dentro
        position: 'fixed',
      }}>

        {/* ── Botón regresar — siempre visible, esquina izquierda ── */}
        <BackButton navigate={navigate} />

        {loading ? (
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', color: 'rgba(212,175,55,0.4)', letterSpacing: '3px' }}>
            VERIFICANDO...
          </div>
        ) : access === 'free' ? (
          <>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', color: 'rgba(232,223,192,0.5)', letterSpacing: '1px' }}>
              ¿Te gustó lo que ves?
            </div>
            <button
              onClick={() => handleComprar('basic')}
              disabled={buying}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #D4AF37, #A07820)',
                border: 'none',
                borderRadius: '4px',
                color: '#0A0812',
                fontFamily: "'Cinzel', serif",
                fontSize: '11px',
                fontWeight: '900',
                letterSpacing: '2px',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(212,175,55,0.3)',
              }}
            >
              {buying ? 'REDIRIGIENDO...' : '⚔️ OBTENER ARSENAL BASE — $8'}
            </button>
            <div style={{
              padding: '12px 20px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px',
              fontFamily: "'Cinzel', serif",
              fontSize: '10px',
              color: 'rgba(232,223,192,0.3)',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              🔒 PACK ÉLITE — $2 <span style={{ fontSize: '9px' }}>(disponible tras el básico)</span>
            </div>
          </>
        ) : access === 'basic' ? (
          <>
            <div style={{
              padding: '10px 20px',
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.3)',
              borderRadius: '4px',
              fontFamily: "'Cinzel', serif",
              fontSize: '11px',
              color: '#34D399',
              letterSpacing: '2px',
            }}>
              ✓ PACK BASE DESCARGADO
            </div>
            <button
              onClick={() => handleComprar('elite')}
              disabled={buying}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #D4AF37, #A07820)',
                border: 'none',
                borderRadius: '4px',
                color: '#0A0812',
                fontFamily: "'Cinzel', serif",
                fontSize: '11px',
                fontWeight: '900',
                letterSpacing: '2px',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(212,175,55,0.3)',
              }}
            >
              {buying ? 'REDIRIGIENDO...' : '👑 AGREGAR ARSENAL ÉLITE — $2'}
            </button>
          </>
        ) : (
          <>
            <div style={{
              padding: '10px 20px',
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.3)',
              borderRadius: '4px',
              fontFamily: "'Cinzel', serif",
              fontSize: '11px',
              color: '#34D399',
              letterSpacing: '2px',
            }}>
              ✓ PACK BASE
            </div>
            <div style={{
              padding: '10px 20px',
              background: 'rgba(212,175,55,0.08)',
              border: '1px solid rgba(212,175,55,0.4)',
              borderRadius: '4px',
              fontFamily: "'Cinzel', serif",
              fontSize: '11px',
              color: '#D4AF37',
              letterSpacing: '2px',
            }}>
              👑 PACK ÉLITE
            </div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '11px', color: 'rgba(212,175,55,0.5)', letterSpacing: '1px' }}>
              — Tienes acceso completo al arsenal —
            </div>
          </>
        )}
      </div>
    </div>
  );
}