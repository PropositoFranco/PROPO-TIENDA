import TEMPLARIO_IMG from '../../assets/maestro_templario.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore.js';
import { supabase } from '../../services/supabase.js';
import { useUIStore } from '../../store/useUIStore';
import StripePaymentModal from './StripePaymentModal.jsx';
import VictoryModal from './VictoryModal.jsx';

/* ─── Data fetch ────────────────────────────────────────────── */
async function getActiveOffers(userCreatedAt) {
  const nowISO = new Date().toISOString();
  const { data, error } = await supabase
    .from('special_offers')
    .select('*')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${nowISO}`)
    .order('created_at', { ascending: false });
  if (error) throw error;

  // Filtrar ofertas con expiración personal
  const now = new Date();
  return (data || []).filter(offer => {
    const hasAnyLimit = offer.expires_after_days || offer.offer_cycle_days || offer.offer_return_day;
    if (!hasAnyLimit) return true;
    if (!userCreatedAt) return true;
    const registerDate = new Date(userCreatedAt);
    const daysSinceRegister = (now - registerDate) / (1000 * 60 * 60 * 24);

    // Sistema C: primera ventana + última oportunidad
    if (offer.expires_after_days && offer.offer_return_day && offer.offer_return_window) {
      const inFirstWindow = daysSinceRegister < offer.expires_after_days;
      const inReturnWindow = daysSinceRegister >= offer.offer_return_day &&
                             daysSinceRegister < (offer.offer_return_day + offer.offer_return_window);
      return inFirstWindow || inReturnWindow;
    }

    // Sistema B: ventana recurrente
    if (offer.offer_cycle_days && offer.offer_window_days) {
      const positionInCycle = daysSinceRegister % offer.offer_cycle_days;
      return positionInCycle < offer.offer_window_days;
    }

    // Sistema A: simple — X días desde registro
    if (offer.expires_after_days) {
      return daysSinceRegister < offer.expires_after_days;
    }

    return true;
  });
}

async function getActiveCoins() {
  const { data, error } = await supabase
    .from('propocoin_packages').select('*')
    .eq('is_active', true).order('sort_order');
  if (error) throw error;
  return data || [];
}

/* ─── Rareza ─────────────────────────────────────────────────── */
const RARITY_MAP = {
  divine:    { key:'divine',    label:'✨ DIVINO',      color:'#ffffff', glow:'#ffffff44', border:'#ffffff', strip:'linear-gradient(90deg,#ffffff,#a78bfa,#ffffff)' },
  legendary: { key:'legendary', label:'🔥 LEGENDARIO', color:'#ff6a00', glow:'#ff6a0066', border:'#ff6a00', strip:'linear-gradient(90deg,#ff6a00,#ee0979)' },
  epic:      { key:'epic',      label:'💜 ÉPICO',      color:'#b44fff', glow:'#b44fff55', border:'#b44fff', strip:'linear-gradient(90deg,#7b2ff7,#b44fff)' },
  rare:      { key:'rare',      label:'💙 RARO',       color:'#38bdf8', glow:'#38bdf855', border:'#38bdf8', strip:'linear-gradient(90deg,#0369a1,#38bdf8)' },
  common:    { key:'common',    label:'🛡️ COMÚN',     color:'#94a3b8', glow:'#94a3b833', border:'#94a3b8', strip:'linear-gradient(90deg,#334155,#94a3b8)' },
};
function getRarity(offer) {
  if (offer.rarity && RARITY_MAP[offer.rarity]) return RARITY_MAP[offer.rarity];
  const price = parseFloat(offer.price) || 0;
  if (price >= 100) return RARITY_MAP.divine;
  if (price >= 40)  return RARITY_MAP.legendary;
  if (price >= 15)  return RARITY_MAP.epic;
  if (price >= 5)   return RARITY_MAP.rare;
  return RARITY_MAP.common;
}

/* ─── Countdown ──────────────────────────────────────────────── */
function useCountdown(expiresAt) {
  const [time, setTime] = useState('');
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) { setTime('EXPIRADO'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return time;
}

/* ─── HubButton ──────────────────────────────────────────────── */
function HubButton() {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/hub');
  };
  return (
    <button className="hub-btn" onClick={handleClick} aria-label="Regresar al Hub">
      <span className="hub-btn-shine" />
      <span className="hub-btn-icon">⬡</span>
      <span className="hub-btn-text">VOLVER</span>
      <span className="hub-btn-arrow">←</span>
    </button>
  );
}

/* ─── OfferCard ──────────────────────────────────────────────── */
function OfferCard({ offer, idx, isPurchased, isLoading, onBuy, userCreatedAt }) {
  const r = getRarity(offer);

  const personalExpiry = (() => {
    if (!userCreatedAt) return null;
    const register = new Date(userCreatedAt);
    const now = new Date();
    const daysSinceRegister = (now - register) / (1000 * 60 * 60 * 24);

    // Sistema C: primera ventana + última oportunidad
    if (offer.expires_after_days && offer.offer_return_day && offer.offer_return_window) {
      if (daysSinceRegister < offer.expires_after_days) {
        // En primera ventana → expira al final de ella
        const d = new Date(register.getTime() + offer.expires_after_days * 86400000);
        return d.toISOString();
      }
      if (daysSinceRegister >= offer.offer_return_day &&
          daysSinceRegister < (offer.offer_return_day + offer.offer_return_window)) {
        // En ventana de regreso → expira al final del regreso
        const d = new Date(register.getTime() + (offer.offer_return_day + offer.offer_return_window) * 86400000);
        return d.toISOString();
      }
      return null;
    }

    // Sistema B: recurrente
    if (offer.offer_cycle_days && offer.offer_window_days) {
      const positionInCycle = daysSinceRegister % offer.offer_cycle_days;
      const daysLeft = offer.offer_window_days - positionInCycle;
      if (daysLeft <= 0) return null;
      return new Date(now.getTime() + daysLeft * 86400000).toISOString();
    }

    // Sistema A: simple
    if (offer.expires_after_days) {
      return new Date(register.getTime() + offer.expires_after_days * 86400000).toISOString();
    }

    return null;
  })();

  const countdown = useCountdown(personalExpiry || offer.expires_at);
  const hasDiscount = offer.original_price && parseFloat(offer.original_price) > parseFloat(offer.price);
  const discountPct = hasDiscount
    ? Math.round((1 - parseFloat(offer.price) / parseFloat(offer.original_price)) * 100)
    : null;

  const badgeUpper = (offer.badge_text || '').toUpperCase();
  const isSoloHoy    = badgeUpper.includes('OFERTA ÚNICA') || badgeUpper.includes('OFERTA UNICA') || badgeUpper.includes('SOLO HOY') || badgeUpper.includes('HOY');
  const isRecomendado = badgeUpper.includes('RECOMENDADO') || badgeUpper.includes('RECOMMENDED');

  return (
    <div
      className={[
        'oc',
        isSoloHoy    ? 'oc--solo-hoy'    : '',
        isRecomendado ? 'oc--recomendado' : '',
      ].filter(Boolean).join(' ')}
      style={{
        '--rc': r.color, '--rg': r.glow, '--rb': r.border, '--rs': r.strip,
        animationDelay: `${0.3 + idx * 0.12}s`,
      }}
    >
      <div className="oc-strip" />
      <div className="oc-orb" />

      {isSoloHoy && (
        <>
          <div className="oc-sh-glow" />
          <div className="oc-sh-scanline" />
          <div className="oc-sh-sparks" aria-hidden>
            {[...Array(6)].map((_,i) => <span key={i} className="oc-sh-spark" style={{'--si':i}} />)}
          </div>
        </>
      )}
      {isRecomendado && <div className="oc-rec-glow" />}

      {offer.badge_text && (
        <div className={[
          'oc-badge',
          `oc-badge--${offer.badge_color || 'red'}`,
          isSoloHoy    ? 'oc-badge--sh'  : '',
          isRecomendado ? 'oc-badge--rec' : '',
        ].filter(Boolean).join(' ')}>
          {isSoloHoy && <span className="oc-badge-fire" aria-hidden>🔥</span>}
          {offer.badge_text}
          {isSoloHoy && <span className="oc-badge-fire" aria-hidden>🔥</span>}
        </div>
      )}

      <div className="oc-img-wrap">
        {offer.image_url
          ? <img src={offer.image_url} alt={offer.title} className="oc-img" />
          : <div className="oc-img-ph"><span>🎯</span></div>
        }
        <div className="oc-img-grad" />
        <div className="oc-rarity" style={{ color: r.color, borderColor: r.border }}>{r.label}</div>
        {discountPct && <div className="oc-discount">-{discountPct}%</div>}
      </div>

      <div className="oc-body">
        <h3 className="oc-title">{offer.title}</h3>
        {offer.description && <p className="oc-desc">{offer.description}</p>}

        {countdown && countdown !== 'EXPIRADO' && (
          <div className="oc-timer">
            <span>⏱</span>
            <span className="oc-timer-val">{countdown}</span>
            <span className="oc-timer-lbl">restante</span>
          </div>
        )}

        <div className="oc-foot">
          <div className="oc-prices">
            {hasDiscount && <span className="oc-orig">${offer.original_price} USD</span>}
            <span className="oc-curr" style={{ color: r.color }}>
              ${offer.price} <em>USD</em>
            </span>
          </div>
          <button
            className="oc-btn"
            style={{ '--bc': r.color, '--bg2': r.glow }}
            onClick={isPurchased ? undefined : onBuy}
            disabled={isPurchased || isLoading || (!offer.stripe_price_id && !offer.stripe_payment_link)}
          >
            <span className="oc-btn-shine" />
            {isPurchased ? '✅ ADQUIRIDO' : isLoading ? '⏳ CARGANDO...' : '⚡ OBTENER'}
          </button>
        </div>
      </div>

      <i className="co tl" style={{ borderColor: r.border }} />
      <i className="co tr" style={{ borderColor: r.border }} />
      <i className="co bl" style={{ borderColor: r.border }} />
      <i className="co br" style={{ borderColor: r.border }} />
    </div>
  );
}

/* ─── OffersPage ─────────────────────────────────────────────── */
export default function OffersPage() {
  const [offers, setOffers]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [coins, setCoins]             = useState([]);
  const [purchased, setPurchased]     = useState(new Set());
  const [checkingOut, setCheckingOut] = useState(null);
  const [activeOffer, setActiveOffer] = useState(null);
  const [victoryOffer, setVictoryOffer] = useState(null);
  const user = useAuthStore(s => s.user);
  const profile = useAuthStore(s => s.profile);
  const loadProfile = useAuthStore(s => s.loadProfile);
  const sidebarOpen = useUIStore(s => s.sidebarOpen);

  const bonusOffers = offers.filter(o => o.min_level && o.min_level > 0);
  const gridOffers  = offers.filter(o => !o.min_level || o.min_level === 0);

  useEffect(() => {
    getActiveOffers(profile?.created_at || user?.created_at)
      .then(setOffers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    getActiveCoins().then(setCoins).catch(() => {});

    if (user?.id) {
      supabase
        .from('user_purchased_offers')
        .select('offer_id')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data) setPurchased(new Set(data.map(r => r.offer_id)));
        });
    }
  }, [user?.id]);

  return (
    <>
      <style>{CSS}</style>
      <div className="op-root">

        {/* ── HUB BUTTON ── */}
        <HubButton />

        {/* hex grid */}
        <svg className="op-hexgrid" aria-hidden viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="hex" width="28" height="32" patternUnits="userSpaceOnUse" patternTransform="rotate(10)">
              <polygon points="14,2 26,8 26,24 14,30 2,24 2,8"
                fill="none" stroke="rgba(180,79,255,0.07)" strokeWidth="0.8"/>
            </pattern>
          </defs>
          <rect width="200" height="200" fill="url(#hex)"/>
        </svg>

        {/* god rays */}
        <div className="op-godrays" aria-hidden />

        {/* particles */}
        <div className="op-particles" aria-hidden>
          {Array.from({length:22}).map((_,i) => (
            <span key={i} className="op-p" style={{
              left: `${5 + Math.random()*90}%`,
              width: `${1.5 + Math.random()*2.5}px`,
              height: `${1.5 + Math.random()*2.5}px`,
              animationDuration: `${7 + Math.random()*9}s`,
              animationDelay: `${Math.random()*8}s`,
              background: i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#b44fff' : '#5eead4',
            }}/>
          ))}
        </div>

        {/* hero */}
        <div className="op-hero">

          {/* Templario presenter */}
          <div className="op-presenter">
            <div className="op-divine-light" />
            <div className="op-speech">
              <div className="op-speech-dots">
                <span className="op-dot"/><span className="op-dot"/><span className="op-dot"/>
              </div>
              <p>⚔️ ¡Equípate.<br/>El templo te llama!</p>
            </div>
            <img src={TEMPLARIO_IMG} alt="Templario" className="op-templario" draggable="false" />
            <div className="op-ground-glow" />

            {/* ── BONUS OFFERS (nivel 3+) ── */}
            {!loading && bonusOffers && bonusOffers.length > 0 && (
              <div className="op-bonus-offers">
                {bonusOffers.map((o) => {
                  const r = getRarity(o);
                  const hasDiscount = o.original_price && parseFloat(o.original_price) > parseFloat(o.price);
                  const discountPct = hasDiscount
                    ? Math.round((1 - parseFloat(o.price) / parseFloat(o.original_price)) * 100)
                    : null;
                  return (
                    <div key={o.id} className="op-bonus-card" style={{ '--rb': r.border, '--rg': r.glow, '--rc': r.color }}>
                      {discountPct && <span className="op-bonus-disc">-{discountPct}%</span>}
                      {o.image_url && <img src={o.image_url} alt={o.title} className="op-bonus-img" />}
                      <div className="op-bonus-info">
                        <span className="op-bonus-title">{o.title}</span>
                        <span className="op-bonus-price" style={{ color: r.color }}>${o.price} <em>USD</em></span>
                      </div>
                      {(() => {
                        const baseOffer = bonusOffers.find(b => b.title === 'Arsenal RPG — Pack Base');
                        const needsBase = o.title === 'Arsenal RPG — Pack Élite' && baseOffer && !purchased.has(baseOffer.id);
                        return (
                          <button
                            className="op-bonus-btn"
                            onClick={() => {
                              if (needsBase) return;
                              if (!o.stripe_price_id) { window.open(o.stripe_payment_link, '_blank'); return; }
                              setActiveOffer(o);
                            }}
                            disabled={purchased.has(o.id) || !o.stripe_price_id || needsBase}
                          >
                            {purchased.has(o.id) ? '✅' : needsBase ? '🔒 Base 1°' : '⚡ OBTENER'}
                          </button>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* contenido derecho */}
          <div className="op-content">
            <div className="op-header">
              <p className="op-eyebrow">✦ ACCESO EXCLUSIVO ✦</p>
              <h1 className="op-title">OFERTAS ESPECIALES</h1>
              <div className="op-line" />
            </div>

            {loading && <div className="op-state"><div className="op-spinner"/><span>Cargando...</span></div>}
            {error && <div className="op-state" style={{color:'#ff6a6a'}}>Error: {error}</div>}
            {!loading && !error && offers.length === 0 && (
              <div className="op-state"><div style={{fontSize:40}}>🎯</div><span>No hay ofertas activas.</span></div>
            )}

            {!loading && gridOffers.length > 0 && (() => {
  const sorted = [...gridOffers].sort((a,b) => (b.is_featured?1:0)-(a.is_featured?1:0));
  const hasFeatured = sorted.some(o => o.is_featured);
  const featured = hasFeatured
    ? sorted.filter(o => o.is_featured)
    : [sorted[0]];
  const secondary = sorted.filter(o => !featured.includes(o)).slice(0, 4);
  return (
                <div className="op-main-grid">
                  {featured.map((o, i) => (
                    <div key={o.id} className="op-featured-slot" style={{overflow:'visible', position:'relative'}}>
                      <OfferCard
                        offer={o}
                        idx={i}
                        isPurchased={purchased.has(o.id)}
                        isLoading={checkingOut === o.id}
                        userCreatedAt={profile?.created_at || user?.created_at}
                        onBuy={() => {
                          if (!o.stripe_price_id) { window.open(o.stripe_payment_link, '_blank'); return; }
                          setActiveOffer(o);
                        }}
                      />
                    </div>
                  ))}
                  {secondary.length > 0 && (
                    <div className="op-slots-secondary">
                      {secondary.map((o, i) => (
                        <div key={o.id} style={{overflow:'visible', position:'relative'}}>
                          <OfferCard
                            offer={o}
                            idx={featured.length + i}
                            isPurchased={purchased.has(o.id)}
                            isLoading={checkingOut === o.id}
                            userCreatedAt={profile?.created_at || user?.created_at}
                            onBuy={() => {
                              if (!o.stripe_price_id) { window.open(o.stripe_payment_link, '_blank'); return; }
                              setActiveOffer(o);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {coins.length > 0 && (
              <div className="op-coins-area">
                <p className="op-coins-eyebrow">🪙 PROPOCOINS</p>
                <div className="op-coins-row">
                  {coins.map((pkg, i) => (
                    <div key={pkg.id} className="cc" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="cc-gold-strip" />
                      <div className="cc-top">
                        {pkg.image_url
                          ? <img src={pkg.image_url} className="cc-img" alt={pkg.title} />
                          : <div className="cc-icon">🪙</div>}
                        <div className="cc-coins-amount">
                          <span className="cc-num">{pkg.coin_amount.toLocaleString()}</span>
                          <span className="cc-lbl">PropoCoins</span>
                        </div>
                        {pkg.original_price && pkg.price < pkg.original_price && (
                          <div className="oc-discount">
                            -{Math.round((1 - pkg.price / pkg.original_price) * 100)}%
                          </div>
                        )}
                      </div>
                      <div className="cc-body">
                        <h3 className="oc-title">{pkg.title}</h3>
                        {pkg.description && <p className="oc-desc">{pkg.description}</p>}
                      </div>
                      <div className="oc-foot">
                        <div className="oc-prices">
                          {pkg.original_price && pkg.price < pkg.original_price &&
                            <span className="oc-orig">${pkg.original_price} USD</span>}
                          <span className="oc-curr" style={{ color: '#ffd700' }}>
                            ${pkg.price} <em>USD</em>
                          </span>
                        </div>
                        <button className="oc-btn"
                          onClick={() => {
  if (!pkg.stripe_payment_link) return;
  const url = new URL(pkg.stripe_payment_link);
  if (user?.email) url.searchParams.set('prefilled_email', user.email);
  window.open(url.toString(), '_blank');
}}
                          disabled={!pkg.stripe_payment_link}>
                          <span className="oc-btn-shine" />🪙 COMPRAR
                        </button>
                      </div>
                      <i className="co tl" style={{ borderColor: '#ffd700' }} />
                      <i className="co tr" style={{ borderColor: '#ffd700' }} />
                      <i className="co bl" style={{ borderColor: '#ffd700' }} />
                      <i className="co br" style={{ borderColor: '#ffd700' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeOffer && (
        <StripePaymentModal
          offer={activeOffer}
          userId={user.id}
          onClose={() => setActiveOffer(null)}
          onSuccess={() => {
            setPurchased(prev => new Set([...prev, activeOffer.id]));
            setVictoryOffer(activeOffer);
            setActiveOffer(null);
            setTimeout(() => loadProfile(), 2000);
          }}
        />
      )}

      {victoryOffer && (
        <VictoryModal
          offer={victoryOffer}
          onClose={() => setVictoryOffer(null)}
        />
      )}
    </>
  );
}

/* ══ CSS ══════════════════════════════════════════════════════ */
const CSS = `
/* ── HUB BUTTON ─────────────────────────────────────────────── */
.hub-btn {
  position: fixed;
  top: clamp(10px, 2vw, 18px);
  left: clamp(10px, 2vw, 18px);
  z-index: 9999;

  display: inline-flex;
  align-items: center;
  gap: clamp(4px, 1vw, 8px);

  padding: clamp(7px, 1.2vw, 11px) clamp(12px, 2vw, 22px);
  border-radius: 10px;
  border: 1px solid rgba(180,79,255,.55);
  background: rgba(12,4,28,.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  color: #d4aaff;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: clamp(10px, 1.4vw, 13px);
  font-weight: 800;
  letter-spacing: clamp(1.5px, 0.4vw, 3px);
  text-transform: uppercase;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;

  box-shadow:
    0 0 0 1px rgba(180,79,255,.15),
    0 0 20px rgba(180,79,255,.15),
    0 4px 20px rgba(0,0,0,.6);

  transition:
    transform .22s cubic-bezier(.34,1.56,.64,1),
    box-shadow .22s ease,
    border-color .22s ease,
    color .22s ease;

  animation: hub-appear .5s cubic-bezier(.22,1,.36,1) .15s both;
}

@keyframes hub-appear {
  from { opacity:0; transform: translateX(-18px) scale(.92); }
  to   { opacity:1; transform: translateX(0)     scale(1);   }
}

.hub-btn::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(110deg,
    transparent 30%,
    rgba(180,79,255,.12) 50%,
    transparent 70%);
  background-size: 200% 100%;
  animation: hub-gleam 3s ease-in-out infinite;
  pointer-events: none;
}
@keyframes hub-gleam {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}

.hub-btn:hover {
  transform: scale(1.08) translateY(-2px);
  color: #fff;
  border-color: rgba(180,79,255,.9);
  box-shadow:
    0 0 0 1px rgba(180,79,255,.5),
    0 0 28px rgba(180,79,255,.4),
    0 0 56px rgba(180,79,255,.15),
    0 8px 32px rgba(0,0,0,.7);
}

.hub-btn:active {
  transform: scale(.96);
}

.hub-btn-icon {
  font-size: clamp(12px, 1.6vw, 16px);
  color: #b44fff;
  filter: drop-shadow(0 0 6px #b44fff);
  transition: color .22s ease, filter .22s ease;
  line-height: 1;
}
.hub-btn:hover .hub-btn-icon {
  color: #d97cff;
  filter: drop-shadow(0 0 10px #b44fff);
}

.hub-btn-text {
  font-size: clamp(10px, 1.4vw, 13px);
  font-weight: 900;
  letter-spacing: clamp(2px, 0.5vw, 4px);
}

.hub-btn-arrow {
  font-size: clamp(12px, 1.6vw, 16px);
  opacity: .65;
  transition: transform .22s ease, opacity .22s ease;
  line-height: 1;
}
.hub-btn:hover .hub-btn-arrow {
  transform: translateX(-3px);
  opacity: 1;
}

/* corner accents on hub button */
.hub-btn::after {
  content: '';
  position: absolute;
  top: 4px; left: 4px;
  width: 7px; height: 7px;
  border-top: 1.5px solid rgba(180,79,255,.7);
  border-left: 1.5px solid rgba(180,79,255,.7);
  border-radius: 1px;
  pointer-events: none;
  transition: border-color .22s ease;
}
.hub-btn:hover::after {
  border-color: rgba(180,79,255,1);
}

/* ── mobile tweaks for hub button ── */
@media (max-width: 480px) {
  .hub-btn {
    padding: 8px 14px;
    gap: 5px;
    border-radius: 8px;
  }
  .hub-btn-text {
    letter-spacing: 2px;
  }
}

.op-root {
  min-height: 100vh;
  background: #030112;
  position: relative;
  overflow: hidden;
  font-family: 'Segoe UI', system-ui, sans-serif;
  padding-bottom: 60px;
}

/* hex grid bg */
.op-hexgrid {
  position: fixed; inset: 0;
  width: 100%; height: 100%;
  pointer-events: none; z-index: 0;
}

/* god rays */
.op-godrays {
  position: fixed;
  top: -20%; left: 50%;
  transform: translateX(-50%);
  width: 900px; height: 900px;
  background: conic-gradient(
    from 250deg at 50% 0%,
    transparent 0deg,
    rgba(120,40,220,.07) 8deg,  transparent 16deg,
    rgba(180,79,255,.05) 22deg, transparent 30deg,
    rgba(255,215,0,.04) 36deg,  transparent 44deg,
    rgba(120,40,220,.06) 52deg, transparent 60deg
  );
  animation: ray-spin 28s linear infinite;
  pointer-events: none; z-index: 0;
}
@keyframes ray-spin { to { transform: translateX(-50%) rotate(360deg); } }

/* particles */
.op-particles { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.op-p {
  position: absolute; bottom: -6px;
  border-radius: 50%; opacity: 0;
  animation: p-rise linear infinite;
  filter: blur(.4px);
}
@keyframes p-rise {
  0%   { transform:translateY(0) scale(1);     opacity:0; }
  8%   { opacity:.8; }
  88%  { opacity:.2; }
  100% { transform:translateY(-100vh) scale(.3); opacity:0; }
}

/* hero layout */
.op-hero {
  position: relative; z-index: 1;
  display: grid;
  grid-template-columns: 300px 1fr;
  height: 100vh; overflow: visible;
  max-width: 1700px; margin: 0 auto;
  padding: 0 12px;
}

/* ── PRESENTER ── */
.op-presenter {
  position: relative; height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: flex-end;
  pointer-events: none; overflow: hidden;
}
.op-templario { width: 290px; position: relative; z-index: 2; margin-bottom: -10px; }

.op-divine-light {
  position: absolute; bottom: 0; left: 50%;
  transform: translateX(-50%);
  width: 420px; height: 600px;
  background: radial-gradient(ellipse 60% 80% at 50% 80%,
    rgba(180,79,255,.22) 0%, rgba(255,215,0,.08) 40%, transparent 70%);
  animation: divine-pulse 4s ease-in-out infinite;
  pointer-events: none;
}
@keyframes divine-pulse {
  0%,100% { opacity:.7; transform:translateX(-50%) scaleX(1); }
  50%     { opacity:1;  transform:translateX(-50%) scaleX(1.06); }
}

.op-ground-glow {
  position: absolute; bottom: 0; left: 50%;
  transform: translateX(-50%);
  width: 340px; height: 40px;
  background: radial-gradient(ellipse, rgba(180,79,255,.5) 0%, transparent 70%);
  filter: blur(10px);
  animation: ground-pulse 3s ease-in-out infinite;
  pointer-events: none;
}
@keyframes ground-pulse {
  0%,100% { opacity:.6; width:300px; }
  50%     { opacity:1;  width:370px; }
}

.op-templario {
  position: relative;
  width: 330px; max-width: 90%; height: auto;
  object-fit: contain;
  filter: drop-shadow(0 6px 28px rgba(0,0,0,.95));
  animation: char-float 3.8s ease-in-out infinite;
  user-select: none; pointer-events: none;
}
@keyframes char-float {
  0%,100% { transform:translateY(0px)    rotate(0deg);  }
  30%     { transform:translateY(-15px)  rotate(.4deg); }
  70%     { transform:translateY(-8px)   rotate(-.3deg);}
}

.op-speech {
  position: absolute;
  bottom: 42%; right: 15px;
  background: rgba(12,4,28,.92);
  border: 1px solid rgba(180,79,255,.55);
  border-radius: 14px 14px 14px 4px;
  padding: 14px 22px;
  pointer-events: none;
  animation:
    speech-in .6s cubic-bezier(.22,1,.36,1) .9s both,
    speech-bob 4s ease-in-out 1.5s infinite;
  box-shadow: 0 0 20px rgba(180,79,255,.25), 0 4px 16px #00000077;
  white-space: nowrap;
}
.op-speech::after {
  content: '';
  position: absolute;
  bottom: -10px; right: 18px; left: auto;
  border-width: 10px 10px 0;
  border-style: solid;
  border-color: rgba(180,79,255,.55) transparent transparent;
}
.op-speech::before {
  content: '';
  position: absolute;
  bottom: -8px; right: 19px; left: auto;
  border-width: 9px 9px 0;
  border-style: solid;
  border-color: rgba(12,4,28,.92) transparent transparent;
  z-index: 1;
}
@keyframes speech-in {
  from { opacity:0; transform:scale(.75) translateX(12px); }
  to   { opacity:1; transform:scale(1)   translateX(0); }
}
@keyframes speech-bob {
  0%,100% { transform:translateY(0);    }
  50%     { transform:translateY(-6px); }
}
.op-speech-dots { display:flex; gap:4px; justify-content:center; margin-bottom:4px; }
.op-dot {
  width:6px; height:6px; border-radius:50%;
  background:#b44fff;
  animation: dot-p 1.4s ease-in-out infinite;
}
.op-dot:nth-child(2) { animation-delay:.2s; }
.op-dot:nth-child(3) { animation-delay:.4s; }
@keyframes dot-p {
  0%,100%{opacity:.3;transform:scale(1);}
  50%{opacity:1;transform:scale(1.5);}
}
.op-speech p {
  margin:0; color:#f0e6ff;
  font-size:15px; font-weight:700;
  line-height:1.4; text-align:center;
}

/* ── OFFERS COL ── */
.op-offers-col {
  flex:1; min-width:0;
  padding: 52px 0 60px 8px;
  display:flex; flex-direction:column; gap:28px;
}

.op-eyebrow { font-size:11px;letter-spacing:6px;color:#b44fff;margin:0 0 10px;font-weight:600; }
.op-title {
  font-size:clamp(28px,4vw,46px); font-weight:900; letter-spacing:3px; line-height:1.1;
  background:linear-gradient(135deg,#fff 20%,#d4aaff 55%,#ffd700 90%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  margin:0 0 10px;
}
.op-sub  { color:#8b8ba8; font-size:14px; margin:0 0 18px; }
/* ── BONUS OFFERS ─────────────────────────────────────────── */
.op-bonus-offers {
  position: absolute;
  top: 18%;
  right: -10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
  pointer-events: all;
}
.op-bonus-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(10,4,24,.92);
  border: 1px solid color-mix(in srgb, var(--rb) 45%, transparent);
  border-radius: 10px;
  padding: 7px 10px 7px 8px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 0 0 1px rgba(255,255,255,.04), 0 0 16px color-mix(in srgb, var(--rg) 30%, transparent), 0 4px 18px rgba(0,0,0,.7);
  transition: transform .2s ease, box-shadow .2s ease;
  min-width: 200px;
  max-width: 240px;
  cursor: pointer;
  position: relative;
  overflow: visible;
}
.op-bonus-card:hover {
  transform: translateX(-3px) scale(1.03);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--rb) 60%, transparent), 0 0 24px color-mix(in srgb, var(--rg) 50%, transparent), 0 8px 28px rgba(0,0,0,.8);
}
.op-bonus-disc {
  position: absolute;
  top: -8px; right: -6px;
  background: #cc0000; color: #fff;
  font-size: 9px; font-weight: 900; letter-spacing: 1px;
  padding: 2px 6px; border-radius: 5px; z-index: 5;
  box-shadow: 0 0 10px #cc000077;
}
.op-bonus-img {
  width: 36px; height: 36px; border-radius: 7px;
  object-fit: cover; flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--rb) 40%, transparent);
}
.op-bonus-info {
  display: flex; flex-direction: column; gap: 2px;
  flex: 1; min-width: 0;
}
.op-bonus-title {
  font-size: 11px;
  font-weight: 800;
  color: #e8e0ff;
  white-space: normal;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  letter-spacing: .3px;
  line-height: 1.3;
}
.op-bonus-price {
  font-size: 13px; font-weight: 900; letter-spacing: .5px;
  text-shadow: 0 0 12px currentColor;
}
.op-bonus-price em {
  font-size: 9px; font-weight: 600; opacity: .7; font-style: normal;
}
.op-bonus-btn {
  flex-shrink: 0;
  background: linear-gradient(110deg,#b8860b,#ffd700,#ff8c00);
  background-size: 200% 100%;
  color: #0a0500; border: none; border-radius: 7px;
  padding: 5px 8px; font-size: 8.5px; font-weight: 900;
  letter-spacing: 1px; cursor: pointer; white-space: nowrap;
  animation: btn-gold-slide 2.4s linear infinite;
  transition: transform .15s ease;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.op-bonus-btn:hover { transform: scale(1.07); }
.op-bonus-btn:disabled { opacity: .35; animation: none; cursor: not-allowed; }
@media (max-width: 1023px) {
  .op-bonus-offers {
    position: relative !important;
    top: auto !important; right: auto !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    gap: 8px !important;
    padding: 10px 14px 4px !important;
    pointer-events: all !important;
  }
  .op-bonus-card {
    min-width: 0 !important;
    max-width: calc(50% - 4px) !important;
    flex: 1 1 140px !important;
  }
}
.op-coins-section { margin-top: 12px; }
.op-coins-eyebrow {
  font-size: 27px; letter-spacing: 7px; color: #ffd700;
  margin: 28px 0 10px; font-weight: 700;
}
.op-coins-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 18px;
  align-items: flex-start;
}
.cc { flex: 0 0 260px; max-width: 280px; }
.cc:nth-child(1) { margin-top: 0; }
.cc:nth-child(2) { margin-top: 0; }
.cc:nth-child(3) { margin-top: 0; }
.cc:nth-child(4) { margin-top: 0; }
.cc {
  position: relative; border-radius: 14px;
  background: linear-gradient(160deg, #1a1400 0%, #0a0900 100%);
  border: 1px solid rgba(255,215,0,.25);
  overflow: visible;
  animation: card-rise .6s cubic-bezier(.22,1,.36,1) both;
  transition: transform .25s ease, box-shadow .25s ease;
  box-shadow: 0 0 0 1px #ffffff06, 0 8px 32px #00000088;
  padding-bottom: 14px;
}
.cc:hover {
  transform: translateY(-6px) scale(1.015);
  box-shadow: 0 0 0 1px rgba(255,215,0,.4),
    0 0 28px rgba(255,215,0,.2), 0 18px 50px #000000aa;
}
.cc-gold-strip {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #ffd700, #ff8c00, #ffd700); z-index: 8;
}
.cc-top {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 14px 10px; position: relative; z-index: 1;
}
.cc-img { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
.cc-icon { font-size: 44px; width: 56px; text-align: center; flex-shrink: 0; filter: drop-shadow(0 0 10px #ffd70099); }
.cc-coins-amount { flex: 1; }
.cc-num { display: block; font-size: 26px; font-weight: 900; color: #ffd700; line-height: 1; text-shadow: 0 0 18px #ffd700aa, 0 0 36px #ffd70055; }
.cc-lbl { font-size: 9px; color: #b8860b; letter-spacing: 2px; font-weight: 700; text-transform: uppercase; }
.cc .oc-discount { background: linear-gradient(110deg, #b8860b, #ffd700); color: #0a0500; box-shadow: 0 0 14px #ffd70055; }
.cc-body { padding: 0 14px 10px; }

.op-state {
  display:flex;flex-direction:column;align-items:center;
  gap:14px;padding:40px;color:#8b8ba8;font-size:15px;
}
.op-spinner {
  width:40px;height:40px;
  border:3px solid #1a1a2e;border-top-color:#b44fff;
  border-radius:50%;animation:spin .7s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg);}}

.op-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(270px,1fr));
  gap:20px;
}

.op-slots-secondary {
  display: contents;
}
.op-slots-secondary > div {
    height: 100% !important;
    overflow: visible;
    position: relative;
    z-index: 1;
    display: flex !important;
    flex-direction: column !important;
  }
.op-slots-secondary > div:hover {
  z-index: 10;
}

/* ══ SOLO HOY card ═══════════════════════════════════════════ */
.oc--solo-hoy {
  border-color: #ff3a00 !important;
  border-width: 2px !important;
  background: linear-gradient(160deg, #1f0505 0%, #0d0202 100%) !important;
  box-shadow:
    0 0 0 2px #ff3a0044,
    0 0 28px #ff3a0055,
    0 0 60px #ff180022,
    0 8px 32px #00000099 !important;
  animation: card-rise .6s cubic-bezier(.22,1,.36,1) both, sh-border-pulse 1.8s ease-in-out infinite !important;
}
.oc--solo-hoy:hover {
  box-shadow:
    0 0 0 2px #ff3a0088,
    0 0 48px #ff3a0077,
    0 0 90px #ff180033,
    0 24px 60px #000000cc !important;
  border-color: #ff5500 !important;
}
@keyframes sh-border-pulse {
  0%,100% { box-shadow: 0 0 0 2px #ff3a0044, 0 0 28px #ff3a0055, 0 0 60px #ff180022, 0 8px 32px #00000099; }
  50%     { box-shadow: 0 0 0 3px #ff3a0077, 0 0 48px #ff5a0088, 0 0 90px #ff280033, 0 8px 32px #00000099; }
}

/* Ambient red glow layer behind solo hoy */
.oc-sh-glow {
  position: absolute; inset: -4px;
  border-radius: 18px;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, #ff3a0022 0%, transparent 70%);
  pointer-events: none; z-index: 0;
  animation: sh-glow-breathe 2s ease-in-out infinite;
}
@keyframes sh-glow-breathe {
  0%,100% { opacity: .6; }
  50%     { opacity: 1; }
}

/* Horizontal scanline sweep on solo hoy */
.oc-sh-scanline {
  position: absolute; inset: 0; overflow: hidden;
  border-radius: 14px; pointer-events: none; z-index: 1;
}
.oc-sh-scanline::after {
  content: '';
  position: absolute; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff5500aa, #ff9900ff, #ff5500aa, transparent);
  animation: sh-scan 2.5s linear infinite;
  top: -4px;
}
@keyframes sh-scan {
  0%   { top: -4px; opacity: 0; }
  5%   { opacity: 1; }
  90%  { opacity: .8; }
  100% { top: 105%; opacity: 0; }
}

/* Flying sparks on solo hoy */
.oc-sh-sparks {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 2; overflow: hidden; border-radius: 14px;
}
.oc-sh-spark {
  position: absolute;
  width: 3px; height: 3px; border-radius: 50%;
  background: #ff6600;
  box-shadow: 0 0 6px #ff6600, 0 0 12px #ff9900;
  left: calc(10% + var(--si) * 14%);
  bottom: -6px;
  animation: spark-fly calc(1.2s + var(--si) * 0.3s) ease-out calc(var(--si) * 0.4s) infinite;
}
@keyframes spark-fly {
  0%   { transform: translateY(0)   scale(1);   opacity: .9; }
  60%  { transform: translateY(-80px) scale(.6); opacity: .7; }
  100% { transform: translateY(-140px) scale(.2); opacity: 0; }
}

/* ══ SOLO HOY badge ═══════════════════════════════════════════ */
.oc-badge--sh {
  background: linear-gradient(110deg, #8b0000, #cc0000, #ff3300, #ff6600, #cc0000, #8b0000) !important;
  background-size: 300% 100% !important;
  border: 2px solid #ff6600 !important;
  color: #fff !important;
  font-size: 12px !important;
  padding: 7px 22px !important;
  border-radius: 24px !important;
  letter-spacing: 3px !important;
  text-shadow: 0 0 14px #ff6600cc, 0 1px 0 #00000088 !important;
  box-shadow: 0 0 22px #ff3300aa, 0 0 48px #ff330055, 0 4px 18px rgba(0,0,0,.8) !important;
  animation:
    badge-float 2.5s ease-in-out infinite,
    sh-badge-fire 1.4s linear infinite !important;
  display: flex; align-items: center; gap: 5px;
  top: -20px !important;
}
@keyframes sh-badge-fire {
  0%   { background-position: 200% center; box-shadow: 0 0 22px #ff3300aa, 0 0 48px #ff330055, 0 4px 18px rgba(0,0,0,.8); }
  50%  { box-shadow: 0 0 36px #ff5500cc, 0 0 72px #ff550077, 0 4px 18px rgba(0,0,0,.8); }
  100% { background-position: -200% center; box-shadow: 0 0 22px #ff3300aa, 0 0 48px #ff330055, 0 4px 18px rgba(0,0,0,.8); }
}
.oc-badge-fire {
  font-size: 14px;
  animation: fire-flicker .6s ease-in-out infinite alternate;
  line-height: 1;
}
@keyframes fire-flicker {
  from { transform: scale(1)   rotate(-5deg); filter: brightness(1); }
  to   { transform: scale(1.2) rotate(5deg);  filter: brightness(1.4); }
}

/* ══ RECOMENDADO card ════════════════════════════════════════ */
.oc--recomendado {
  border-color: #ff3a00 !important;
  border-width: 2px !important;
  background: linear-gradient(160deg, #1f0505 0%, #0d0202 100%) !important;
  box-shadow:
    0 0 0 2px #ff3a0044,
    0 0 24px #ff3a0055,
    0 0 50px #ff180022,
    0 8px 32px #00000099 !important;
  animation: card-rise .6s cubic-bezier(.22,1,.36,1) both, rec-border-pulse 3s ease-in-out infinite !important;
}
.oc--recomendado:hover {
  box-shadow:
    0 0 0 2px #ff5500aa,
    0 0 48px #ff550077,
    0 0 90px #ff280033,
    0 24px 60px #000000cc !important;
  border-color: #ff5500 !important;
}
@keyframes rec-border-pulse {
  0%,100% { box-shadow: 0 0 0 2px #ff3a0044, 0 0 24px #ff3a0055, 0 0 50px #ff180022, 0 8px 32px #00000099; }
  50%     { box-shadow: 0 0 0 3px #ff3a0077, 0 0 40px #ff5a0088, 0 0 80px #ff280033, 0 8px 32px #00000099; }
}

/* Red ambient glow for recomendado */
.oc-rec-glow {
  position: absolute; inset: -4px;
  border-radius: 18px;
  background: radial-gradient(ellipse 70% 50% at 50% 0%, #ff3a0022 0%, transparent 70%);
  pointer-events: none; z-index: 0;
  animation: rec-glow-breathe 3s ease-in-out infinite;
}
@keyframes rec-glow-breathe {
  0%,100% { opacity: .5; transform: scaleX(1); }
  50%     { opacity: 1;  transform: scaleX(1.05); }
}

/* ══ RECOMENDADO badge — rojo igual que Solo Hoy ══════════════ */
.oc-badge--rec {
  background: linear-gradient(110deg, #8b0000, #cc0000, #ff3300, #ff6600, #cc0000, #8b0000) !important;
  background-size: 300% 100% !important;
  border: 2px solid #ff6600 !important;
  color: #fff !important;
  font-size: 11px !important;
  padding: 6px 20px !important;
  border-radius: 24px !important;
  letter-spacing: 2.5px !important;
  text-shadow: 0 0 14px #ff6600cc, 0 1px 0 #00000088 !important;
  box-shadow: 0 0 22px #ff3300aa, 0 0 44px #ff330055, 0 4px 16px rgba(0,0,0,.7) !important;
  animation:
    badge-float 3s ease-in-out infinite,
    rec-badge-glow 1.4s linear infinite !important;
}
@keyframes rec-badge-glow {
  0%   { background-position: 200% center; box-shadow: 0 0 22px #ff3300aa, 0 0 44px #ff330055, 0 4px 16px rgba(0,0,0,.7); }
  50%  { box-shadow: 0 0 36px #ff5500cc, 0 0 66px #ff550077, 0 4px 16px rgba(0,0,0,.7); }
  100% { background-position: -200% center; box-shadow: 0 0 22px #ff3300aa, 0 0 44px #ff330055, 0 4px 16px rgba(0,0,0,.7); }
}

.oc {
  position: relative;
  border-radius: 14px;
  background: linear-gradient(160deg, #12072a 0%, #070512 100%);
  border: 1px solid color-mix(in srgb, var(--rb) 35%, transparent);
  overflow: visible;
  animation: card-rise .6s cubic-bezier(.22,1,.36,1) both;
  will-change: transform, box-shadow;
  transition:
    transform .22s cubic-bezier(.34, 1.56, .64, 1),
    box-shadow .22s ease,
    border-color .22s ease;
  box-shadow: 0 0 0 1px #ffffff06, 0 8px 32px #00000088;
  z-index: 1;
  margin-top: 18px;
}

.oc:hover {
  transform: scale(1.07) translateY(-4px);
  z-index: 20;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--rb) 80%, transparent),
    0 0 32px color-mix(in srgb, var(--rb) 40%, transparent),
    0 0 64px color-mix(in srgb, var(--rb) 15%, transparent),
    0 24px 60px #000000cc;
  border-color: color-mix(in srgb, var(--rb) 70%, transparent);
}
@keyframes card-rise {
  from{opacity:0;transform:translateY(30px) scale(.96);}
  to  {opacity:1;transform:translateY(0)    scale(1);  }
}

.oc-strip{position:absolute;top:0;left:0;right:0;height:3px;background:var(--rs);z-index:8;}
.oc-orb  {
  position:absolute;top:-50px;right:-50px;
  width:140px;height:140px;border-radius:50%;
  background:radial-gradient(circle,var(--rg),transparent 70%);
  pointer-events:none;z-index:0;
}

.oc-img-wrap{position:relative;width:100%;height:188px;overflow:hidden;}
.oc-img     {width:100%;height:100%;object-fit:cover;object-position:center top;display:block;transition:transform .4s ease;}
.oc-img-ph  {width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a0a3a,#0d0520);font-size:44px;}
.oc-img-grad{
  position:absolute;inset:0;
  background:linear-gradient(to bottom,transparent 35%,rgba(7,5,18,.65) 70%,rgba(7,5,18,.96) 100%);
  pointer-events:none;
}

.oc-rarity{
  position:absolute;top:10px;left:10px;
  background:rgba(5,2,16,.82);border:1px solid;border-radius:20px;
  padding:3px 10px;font-size:10px;font-weight:700;letter-spacing:1.5px;
  text-transform:uppercase;backdrop-filter:blur(6px);z-index:4;
}
.oc-badge {
  position: absolute;
  top: -16px; left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  padding: 5px 18px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  white-space: nowrap;
  box-shadow: 0 0 18px currentColor, 0 2px 12px rgba(0,0,0,.7);
  animation: badge-float 2.5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes badge-float {
  0%,100% { transform: translateX(-50%) translateY(0); }
  50%      { transform: translateX(-50%) translateY(-3px); }
}
.oc-badge--red    { background:#cc0000; color:#fff; border:1px solid #ff4444; text-shadow:0 0 10px #ff000088; }
.oc-badge--purple { background:#6a0dad; color:#fff; border:1px solid #b44fff; text-shadow:0 0 10px #b44fff88; }
.oc-badge--gold   { background:#b8860b; color:#fff5cc; border:1px solid #ffd700; text-shadow:0 0 10px #ffd70088; }
.oc-badge--blue   { background:#1a5fb4; color:#fff; border:1px solid #4db3ff; text-shadow:0 0 10px #4db3ff88; }

.oc-discount{
  position:absolute;top:10px;right:10px;
  background:#cc0000;color:#fff;border-radius:6px;
  padding:4px 9px;font-size:12px;font-weight:900;letter-spacing:1px;z-index:4;
  animation:badge-pulse 2s ease-in-out infinite;
}
@keyframes badge-pulse{0%,100%{box-shadow:0 0 0 0 #cc000055;}50%{box-shadow:0 0 0 7px transparent;}}
.oc-badge-txt{
  position:absolute;bottom:10px;left:12px;right:12px;
  color:#ffe08a;font-size:11px;font-weight:700;letter-spacing:1.5px;
  text-transform:uppercase;text-shadow:0 0 14px #ffd70088;z-index:4;
}

.oc-body{position:relative;z-index:2;padding:15px 16px 17px;display:flex;flex-direction:column;gap:9px;}
.oc-title{margin:0;font-size:15.5px;font-weight:800;color:#f0f0ff;line-height:1.3;}
.oc-desc {
  margin:0;font-size:12.5px;color:#9090b8;line-height:1.55;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:visible;
}
.oc-timer{
  display:inline-flex;align-items:center;gap:6px;
  background:rgba(255,106,0,.12);border:1px solid rgba(255,106,0,.35);
  border-radius:6px;padding:5px 12px;width:fit-content;
}
.oc-timer-val{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;color:#ff9f40;animation:t-flash 1s ease-in-out infinite;}
.oc-timer-lbl{font-size:10px;color:#ff9f4088;letter-spacing:1px;}
@keyframes t-flash{0%,100%{opacity:1;}50%{opacity:.55;}}

.oc-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:2px;}
.oc-prices{display:flex;flex-direction:column;gap:1px;}
.oc-orig  {font-size:12px;color:#555570;text-decoration:line-through;}
.oc-curr  {font-size:22px;font-weight:900;letter-spacing:.5px;text-shadow:0 0 20px var(--rg);}
.oc-curr em{font-size:12px;font-weight:600;opacity:.7;font-style:normal;}

.oc-btn{
  position:relative;overflow:hidden;
  display:flex;align-items:center;gap:6px;
  padding:11px 20px;border-radius:10px;border:none;
  background:linear-gradient(110deg,#b8860b 0%,#ffd700 40%,#ff8c00 70%,#ffd700 100%);
  background-size:250% 100%;
  color:#0a0500;font-size:12px;font-weight:900;letter-spacing:2.5px;
  cursor:pointer;white-space:nowrap;flex-shrink:0;text-transform:uppercase;
  animation:btn-gold-slide 2.4s linear infinite;
  transition:transform .15s ease,box-shadow .15s ease;
}
.oc-btn::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.25) 50%,transparent 70%);
  background-size:200% 100%;
  animation:btn-gleam 2.4s linear infinite;
  pointer-events:none;
}
.oc-btn:hover{transform:scale(1.06) translateY(-2px);box-shadow:0 0 36px rgba(255,215,0,.85),0 8px 28px rgba(255,140,0,.6);}
.oc-btn:active{transform:scale(.97);}
.oc-btn:disabled{opacity:.35;animation:none;cursor:not-allowed;}
.oc-btn:disabled:hover{transform:none;box-shadow:none;}
.oc-btn-shine{display:none;}
@keyframes btn-gold-slide{0%{background-position:200% center;}100%{background-position:-200% center;}}
@keyframes btn-gleam{0%{background-position:200% center;}100%{background-position:-200% center;}}

.co{
  position:absolute;width:11px;height:11px;
  border-style:solid;border-color:transparent;
  pointer-events:none;z-index:6;opacity:.65;font-style:normal;
  transition:opacity .25s;
}
.oc:hover .co{opacity:1;}
.co.tl{top:6px;left:6px;border-top-width:2px;border-left-width:2px;}
.co.tr{top:6px;right:6px;border-top-width:2px;border-right-width:2px;}
.co.bl{bottom:6px;left:6px;border-bottom-width:2px;border-left-width:2px;}
.co.br{bottom:6px;right:6px;border-bottom-width:2px;border-right-width:2px;}

/* ── RESPONSIVE 860px — superseded by 1023px block below ── */
@media(max-width:860px){}
.op-content {
  display: flex; flex-direction: column;
  height: 100vh; overflow: visible;
  padding: 36px 4px 16px 0; gap: 10px;
  position: relative;
}
.op-title { font-size: 28px !important; line-height: 1.1; }
.op-sub { display: none; }
.op-main-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px; flex: 1; min-height: 0;
  max-height: calc(100vh - 270px);
  padding-top: 22px;
  overflow: visible;
}
.op-featured-slot { grid-column: 2; grid-row: 1 / span 2; display: flex; flex-direction: column; }
.op-slots-secondary > div:nth-child(1) { grid-column: 1; grid-row: 1; }
.op-slots-secondary > div:nth-child(2) { grid-column: 3; grid-row: 1; }
.op-slots-secondary > div:nth-child(3) { grid-column: 1; grid-row: 2; }
.op-slots-secondary > div:nth-child(4) { grid-column: 3; grid-row: 2; }
.op-slot-1, .op-slot-2, .op-slot-3, .op-slot-4 {
  overflow: visible;
  position: relative;
  z-index: 1;
  transition: z-index 0s;
}
.op-slot-1:hover, .op-slot-2:hover, .op-slot-3:hover, .op-slot-4:hover {
  z-index: 10;
}
.op-featured-slot > * { flex: 1; min-height: 0; height: 100%; }
.op-featured-slot .oc { height: 100%; display: flex; flex-direction: column; }
.op-featured-slot .oc-img-wrap { flex: 1; height: auto !important; min-height: 160px; }
.op-coins-area { flex-shrink: 0; padding: 0 0 10px; margin-top: -1px; }
.cc { min-width: 0; }
.op-coins-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}
.op-main-grid > div:not(.op-featured-slot) .oc-img-wrap {
  height: 115px;
}
.op-main-grid > div:not(.op-featured-slot) .oc-body {
  padding: 10px 14px 12px;
  gap: 5px;
}
.op-main-grid > div:not(.op-featured-slot) .oc-desc {
  -webkit-line-clamp: 2;
}
.op-main-grid > div:not(.op-featured-slot) .oc-curr {
  font-size: 18px;
}
@media(max-width:1023px){

  /* ── ROOT & HERO ── */
  .op-root { overflow-x: hidden !important; }
  .op-hero {
    display: flex !important;
    flex-direction: column !important;
    height: auto !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  /* ── PRESENTER: banner con personaje visible y globo separado ── */
  .op-presenter {
    position: relative !important;
    height: 180px !important;
    width: 100% !important;
    flex-direction: row !important;
    justify-content: center !important;
    align-items: flex-end !important;
    padding: 0 !important;
    overflow: visible !important;
    background: linear-gradient(180deg, transparent 0%, rgba(180,79,255,.07) 100%) !important;
    border-bottom: 1px solid rgba(180,79,255,.15) !important;
  }
  /* clip solo el fondo, no el personaje */
  .op-presenter::before {
    content: '' !important;
    position: absolute !important;
    inset: 0 !important;
    overflow: hidden !important;
    pointer-events: none !important;
  }
  .op-templario {
    width: 150px !important;
    margin-bottom: -38px !important;
    position: relative !important;
    z-index: 3 !important;
    flex-shrink: 0 !important;
    filter: drop-shadow(0 0 22px rgba(180,79,255,.6)) drop-shadow(0 6px 18px rgba(0,0,0,.9)) !important;
  }
  .op-divine-light {
    width: 200px !important;
    height: 190px !important;
    bottom: 0 !important;
  }
  .op-ground-glow { width: 160px !important; }
  .op-speech {
    position: relative !important;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    bottom: 28px !important;
    transform: none !important;
    margin: 0 8px 0 0 !important;
    align-self: flex-end !important;
    white-space: normal !important;
    max-width: 160px !important;
    padding: 10px 14px !important;
    flex-shrink: 0 !important;
    z-index: 4 !important;
    animation: speech-in .6s cubic-bezier(.22,1,.36,1) .9s both, speech-bob 4s ease-in-out 1.5s infinite !important;
  }
  .op-speech p { font-size: 12px !important; }

  /* ── CONTENT AREA ── */
  .op-content {
    height: auto !important;
    overflow: visible !important;
    padding: 20px 14px 60px !important;
    gap: 16px !important;
  }
  .op-header { text-align: center !important; }
  .op-eyebrow {
    font-size: 9px !important;
    letter-spacing: 4px !important;
    margin-bottom: 6px !important;
  }
  .op-title {
    font-size: clamp(20px, 6.5vw, 28px) !important;
    margin-bottom: 6px !important;
  }
  .op-line { margin: 0 auto !important; }

  /* ── MAIN GRID: featured full-width + secundarias 2 columnas ── */
  .op-main-grid {
    display: flex !important;
    flex-direction: column !important;
    max-height: none !important;
    padding-top: 4px !important;
    gap: 0 !important;
  }
  .op-main-grid {
    display: flex !important;
    flex-direction: column !important;
    max-height: none !important;
    padding-top: 4px !important;
    gap: 0 !important;
    grid-template-columns: none !important;
    grid-template-rows: none !important;
    width: 100% !important;
  }
  .op-featured-slot {
    grid-column: unset !important;
    grid-row: unset !important;
    width: 100% !important;
    min-width: 0 !important;
    margin-bottom: 14px !important;
  }
  .op-slots-secondary {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    grid-template-rows: auto !important;
    grid-auto-rows: 1fr !important;
    gap: 10px !important;
    width: 100% !important;
    min-width: 0 !important;
    align-items: stretch !important;
  }
  .op-slots-secondary > div {
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    flex: none !important;
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
    grid-column: unset !important;
    grid-row: unset !important;
  }
  .op-slots-secondary > div .oc {
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    flex: 1 !important;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    box-sizing: border-box !important;
  }
  .op-slots-secondary > div .oc-img-wrap {
    flex-shrink: 0 !important;
    height: clamp(90px, 24vw, 130px) !important;
    width: 100% !important;
    max-width: none !important;
  }
  .op-slots-secondary > div .oc-body {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    min-width: 0 !important;
  }

  /* wrapper de secundarias: grid 2 columnas */
  .op-main-grid > div:not(.op-featured-slot) {
    /* se agrupan naturalmente en el flujo flex; usamos CSS grid en el padre */
  }

  /* ── FEATURED CARD: full width, imagen grande, impacto máximo ── */
  .op-featured-slot {
    grid-column: 1 !important;
    width: 100% !important;
    margin-bottom: 20px !important;
  }
  .op-featured-slot .oc {
    height: auto !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: visible !important;
  }
  .op-featured-slot .oc-img-wrap {
    width: 100% !important;
    height: clamp(180px, 52vw, 260px) !important;
    border-radius: 14px 14px 0 0 !important;
    overflow: hidden !important;
  }
  .op-featured-slot .oc-img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    object-position: center top !important;
  }
  .op-featured-slot .oc-img-grad {
    background: linear-gradient(to bottom, transparent 35%, rgba(7,5,18,.65) 70%, rgba(7,5,18,.96) 100%) !important;
  }
  .op-featured-slot .oc-body {
    padding: 16px 16px 18px !important;
    gap: 10px !important;
  }
  .op-featured-slot .oc-title {
    font-size: 17px !important;
    font-weight: 900 !important;
    white-space: normal !important;
  }
  .op-featured-slot .oc-desc {
    font-size: 13px !important;
    -webkit-line-clamp: 3 !important;
    overflow: visible !important;
  }
  .op-featured-slot .oc-curr { font-size: 26px !important; }
  .op-featured-slot .oc-foot {
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
  }
  .op-featured-slot .oc-btn {
    width: auto !important;
    padding: 12px 22px !important;
    font-size: 12px !important;
  }


  /* ── SECONDARY CARDS: verticales, imagen arriba, info abajo ── */
  .op-main-grid > div:not(.op-featured-slot) .oc {
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    border-radius: 14px !important;
    overflow: visible !important;
    height: 100% !important;
    min-height: 0 !important;
  }
  .op-main-grid > div:not(.op-featured-slot) .oc-strip {
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: auto !important;
    height: 3px !important;
    border-radius: 0 !important;
  }
  .op-main-grid > div:not(.op-featured-slot) .oc-img-wrap {
    width: 100% !important;
    height: clamp(90px, 26vw, 140px) !important;
    min-height: unset !important;
    flex-shrink: 0 !important;
    border-radius: 0 !important;
    overflow: hidden !important;
  }
  .op-main-grid > div:not(.op-featured-slot) .oc-img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    object-position: center top !important;
  }
  .op-main-grid > div:not(.op-featured-slot) .oc-img-grad {
    background: linear-gradient(to bottom, transparent 35%, rgba(7,5,18,.75) 75%, rgba(7,5,18,.97) 100%) !important;
  }
  .op-main-grid > div:not(.op-featured-slot) .oc-rarity {
    top: 5px !important;
    left: 5px !important;
    font-size: 8px !important;
    padding: 2px 6px !important;
    letter-spacing: 1px !important;
  }
  .op-main-grid > div:not(.op-featured-slot) .oc-body {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    padding: 10px 10px 12px !important;
    gap: 5px !important;
    min-width: 0 !important;
  }
  .op-main-grid > div:not(.op-featured-slot) .oc-title {
    font-size: 12px !important;
    font-weight: 800 !important;
    line-height: 1.2 !important;
    white-space: normal !important;
    overflow: hidden !important;
    display: -webkit-box !important;
    -webkit-line-clamp: 2 !important;
    -webkit-box-orient: vertical !important;
  }
  .op-main-grid > div:not(.op-featured-slot) .oc-desc {
    font-size: 10.5px !important;
    -webkit-line-clamp: 2 !important;
    color: #7878a0 !important;
    display: -webkit-box !important;
    -webkit-box-orient: vertical !important;
    overflow: hidden !important;
  }
  .op-main-grid > div:not(.op-featured-slot) .oc-curr {
    font-size: 15px !important;
  }
  .op-main-grid > div:not(.op-featured-slot) .oc-orig {
    font-size: 10px !important;
  }
  .op-main-grid > div:not(.op-featured-slot) .oc-orb {
    top: -20px !important;
    right: -20px !important;
    width: 70px !important;
    height: 70px !important;
  }
  /* corner ornaments */
  .op-main-grid > div:not(.op-featured-slot) .co.tl { top:5px; left:5px; }
  .op-main-grid > div:not(.op-featured-slot) .co.tr { top:5px; right:5px; }
  .op-main-grid > div:not(.op-featured-slot) .co.bl { bottom:5px; left:5px; }
  .op-main-grid > div:not(.op-featured-slot) .co.br { bottom:5px; right:5px; }

  /* ── FOOTER dentro de secundarias ── */
  .op-main-grid > div:not(.op-featured-slot) .oc-foot {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 6px !important;
    margin-top: auto !important;
  }
  .op-main-grid > div:not(.op-featured-slot) .oc-btn {
    width: 100% !important;
    padding: 8px 10px !important;
    font-size: 9.5px !important;
    letter-spacing: 1px !important;
    border-radius: 8px !important;
    justify-content: center !important;
  }

  /* ── BADGE en secundarias: centrado arriba ── */
  .op-main-grid > div:not(.op-featured-slot) .oc-badge {
    top: -14px !important;
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%) !important;
    font-size: 8px !important;
    padding: 3px 10px !important;
  }
  .op-main-grid > div:not(.op-featured-slot) .oc-discount {
    top: 6px !important;
    right: 6px !important;
    bottom: auto !important;
    left: auto !important;
    font-size: 10px !important;
    padding: 3px 7px !important;
  }

  /* ── TIMER compact ── */
  .op-main-grid > div:not(.op-featured-slot) .oc-timer {
    padding: 3px 6px !important;
    gap: 3px !important;
    width: 100% !important;
    justify-content: center !important;
  }
  .op-main-grid > div:not(.op-featured-slot) .oc-timer-val {
    font-size: 10px !important;
  }
  .op-main-grid > div:not(.op-featured-slot) .oc-timer-lbl {
    font-size: 8px !important;
  }

  /* ── PROPOCOINS ROW ── */
  .op-coins-row {
    grid-template-columns: 1fr 1fr 1fr !important;
    gap: 8px !important;
  }
  .cc { min-width: 0 !important; }
  .cc:nth-child(1),
  .cc:nth-child(2),
  .cc:nth-child(3),
  .cc:nth-child(4) { margin-top: 0 !important; }
  .op-coins-eyebrow {
    font-size: 16px !important;
    letter-spacing: 4px !important;
    margin: 20px 0 10px !important;
  }
  .cc-top { padding: 8px 7px 6px !important; gap: 5px !important; }
  .cc-img { width: 30px !important; height: 30px !important; }
  .cc-icon { font-size: 26px !important; width: 32px !important; }
  .cc-num { font-size: 16px !important; }
  .cc-body { padding: 0 7px 6px !important; }
  .cc { display: flex !important; flex-direction: column !important; }
  .cc .oc-foot { padding: 0 7px 0 !important; flex-direction: column !important; gap: 4px !important; margin-top: auto !important; }
  .cc .oc-btn { padding: 7px 6px !important; font-size: 9px !important; letter-spacing: 0.5px !important; width: 100% !important; justify-content: center !important; }
  .cc .oc-curr { font-size: 14px !important; }

  /* ── SOLO HOY & RECOMENDADO mobile overrides ── */
  .oc--solo-hoy,
  .oc--recomendado {
    border-width: 2px !important;
  }
  .oc-badge--sh {
    font-size: 10px !important;
    padding: 5px 14px !important;
    letter-spacing: 2px !important;
    top: -18px !important;
  }
  .oc-badge--rec {
    font-size: 9px !important;
    padding: 5px 12px !important;
    letter-spacing: 2px !important;
  }
  /* horizontal secondary cards: badge on top-right of image area */
  .op-main-grid > div:not(.op-featured-slot) .oc-badge--sh,
  .op-main-grid > div:not(.op-featured-slot) .oc-badge--rec {
    top: -16px !important;
    left: auto !important;
    right: 10px !important;
    transform: translateX(0) !important;
    font-size: 8px !important;
    padding: 4px 10px !important;
  }
  /* keep sparks clipped inside horizontal card */
  .op-main-grid > div:not(.op-featured-slot) .oc-sh-sparks { border-radius: 14px !important; }
  .op-main-grid > div:not(.op-featured-slot) .oc-sh-scanline { border-radius: 0 !important; }
}

{!LOADING && GRIDOFFERS.LENGTH > 0 && (() => {
  CONST SORTED = [...GRIDOFFERS].SORT((A,B) => (B.IS_FEATURED?1:0)-(A.IS_FEATURED?1:0));
`;