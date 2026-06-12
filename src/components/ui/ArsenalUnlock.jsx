import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StripePaymentModal from '../../features/offers/StripePaymentModal';

const NIVEL_MINIMO = 3;

const ARSENAL_OFFER = {
  id:             'b18a2303-5bab-444f-b817-323a4ef6ff11',
  title:          '⚔️ Arsenal RPG — Pack Base',
  description:    '6 componentes JSX listos para tu proyecto',
  price:          '8',
  original_price: null,
  stripe_price_id:'price_1ThZWIHAhN6AYkd2ClzGP4kT',
  months_to_add:  0,
  is_subscription:false,
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');
@keyframes au-fadein   { from{opacity:0}to{opacity:1} }
@keyframes au-fadeout  { from{opacity:1}to{opacity:0} }
@keyframes au-rise     { from{transform:translateY(32px);opacity:0}to{transform:translateY(0);opacity:1} }
@keyframes au-shimmer  { 0%{background-position:-200% center}100%{background-position:200% center} }
@keyframes au-pulse    { 0%,100%{box-shadow:0 0 28px rgba(212,175,55,.35)}50%{box-shadow:0 0 48px rgba(212,175,55,.6)} }
@keyframes au-sword-drop { 0%{transform:translateY(-40px) scale(.7);opacity:0}60%{transform:translateY(6px) scale(1.06);opacity:1}100%{transform:translateY(0) scale(1);opacity:1} }
@keyframes au-glow-ring { 0%{transform:scale(.4);opacity:.9}100%{transform:scale(3.2);opacity:0} }
@keyframes au-lock-open { 0%{transform:rotate(0deg) scale(1)}25%{transform:rotate(-8deg) scale(1.1)}50%{transform:rotate(6deg) scale(1.15)}100%{transform:rotate(0deg) scale(1)} }
@keyframes au-tag-in { from{transform:translateX(-16px);opacity:0}to{transform:translateX(0);opacity:1} }
@keyframes au-btn-pulse { 0%,100%{box-shadow:0 0 20px rgba(212,175,55,.3)}50%{box-shadow:0 0 40px rgba(212,175,55,.5)} }
@keyframes au-rays-spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
@keyframes au-orb-pulse { 0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.28;transform:scale(1.12)} }
@keyframes au-skip-in { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
.au-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(2,0,12,0.97);backdrop-filter:blur(18px) saturate(1.3);animation:au-fadein .45s ease both;font-family:'Cinzel',serif;padding:20px;}
.au-overlay.au-out{animation:au-fadeout .4s ease both;pointer-events:none;}
.au-rays-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden;pointer-events:none;z-index:1;}
.au-rays-disk{width:1000px;height:1000px;animation:au-rays-spin 22s linear infinite;opacity:.07;}
.au-ray{position:absolute;top:50%;left:50%;width:1px;height:500px;transform-origin:50% 0;margin-left:-.5px;margin-top:0;background:linear-gradient(to bottom,rgba(212,175,55,1),transparent);}
.au-orb{position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle at 50%,rgba(180,79,255,.12) 0%,rgba(212,175,55,.08) 35%,transparent 70%);pointer-events:none;z-index:1;animation:au-orb-pulse 3s ease infinite;}
.au-glow-rings{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:2;}
.au-glow-ring{position:absolute;border-radius:50%;border:2px solid rgba(212,175,55,.6);width:80px;height:80px;opacity:0;}
.au-glow-ring.on{animation:au-glow-ring 2s ease-out both;}
.au-glow-ring:nth-child(2).on{animation-delay:.28s;border-color:rgba(180,79,255,.5);}
.au-glow-ring:nth-child(3).on{animation-delay:.56s;}
.au-glow-ring:nth-child(4).on{animation-delay:.84s;border-color:rgba(180,79,255,.4);}
.au-card{position:relative;z-index:10;max-width:480px;width:100%;background:linear-gradient(160deg,rgba(22,12,40,.98),rgba(10,6,20,.99));border:1px solid rgba(212,175,55,.3);border-radius:24px;padding:44px 40px 36px;text-align:center;box-shadow:0 0 0 1px rgba(212,175,55,.08),0 0 60px rgba(212,175,55,.1),0 0 120px rgba(180,79,255,.06),inset 0 1px 0 rgba(212,175,55,.12);animation:au-rise .6s cubic-bezier(.22,1,.36,1) .15s both;}
.au-card::before{content:'';position:absolute;top:0;left:10%;right:10%;height:1px;background:linear-gradient(to right,transparent,rgba(212,175,55,.6),transparent);}
.au-eyebrow{font-size:9px;letter-spacing:7px;color:rgba(255,215,0,.55);text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:24px;animation:au-rise .5s ease .3s both;opacity:0;}
.au-eyebrow-line{height:1px;width:40px;background:linear-gradient(to right,transparent,rgba(212,175,55,.45));}
.au-eyebrow-line.r{background:linear-gradient(to left,transparent,rgba(212,175,55,.45));}
.au-icon-wrap{position:relative;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;}
.au-sword{font-size:64px;line-height:1;filter:drop-shadow(0 0 20px rgba(212,175,55,.7)) drop-shadow(0 0 40px rgba(212,175,55,.3));animation:au-sword-drop .7s cubic-bezier(.34,1.56,.64,1) .5s both;opacity:0;}
.au-lock-badge{position:absolute;bottom:-4px;right:-10px;font-size:26px;animation:au-lock-open .6s ease 1.4s both;filter:drop-shadow(0 0 8px rgba(255,215,0,.6));}
.au-headline{font-size:22px;font-weight:900;letter-spacing:3px;text-transform:uppercase;background:linear-gradient(135deg,#f5d060 0%,#d4af37 30%,#fff8dc 55%,#d4af37 75%,#b8860b 100%);background-size:220% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:au-shimmer 3s linear infinite,au-rise .5s ease .7s both;opacity:0;margin-bottom:8px;}
.au-subtitle{font-size:11px;letter-spacing:2px;color:rgba(232,223,192,.45);text-transform:uppercase;margin-bottom:28px;animation:au-rise .5s ease .85s both;opacity:0;}
.au-divider{display:flex;align-items:center;gap:10px;margin-bottom:24px;animation:au-rise .4s ease .9s both;opacity:0;}
.au-divider-line{flex:1;height:1px;background:linear-gradient(to right,transparent,rgba(212,175,55,.25),transparent);}
.au-divider-gem{width:5px;height:5px;background:rgba(212,175,55,.7);transform:rotate(45deg);box-shadow:0 0 6px rgba(212,175,55,.5);flex-shrink:0;}
.au-items{display:flex;flex-direction:column;gap:8px;margin-bottom:28px;text-align:left;}
.au-item{display:flex;align-items:center;gap:12px;padding:9px 14px;background:rgba(212,175,55,.04);border:1px solid rgba(212,175,55,.1);border-radius:10px;opacity:0;animation:au-tag-in .4s cubic-bezier(.22,1,.36,1) both;}
.au-item-icon{font-size:16px;flex-shrink:0}
.au-item-text{font-size:11px;letter-spacing:1px;color:rgba(232,223,192,.75);font-family:'Cinzel',serif;text-transform:uppercase;}
.au-item-badge{margin-left:auto;font-size:8px;letter-spacing:1.5px;padding:3px 8px;border-radius:5px;background:rgba(29,158,117,.12);border:1px solid rgba(29,158,117,.3);color:#5DCAA5;flex-shrink:0;}
.au-price-row{display:flex;align-items:baseline;justify-content:center;gap:6px;margin-bottom:24px;animation:au-rise .4s ease 1.4s both;opacity:0;}
.au-price-amount{font-size:36px;font-weight:900;color:#ffd700;text-shadow:0 0 20px rgba(255,215,0,.5);}
.au-price-label{font-size:11px;letter-spacing:2px;color:rgba(232,223,192,.4);text-transform:uppercase;}
.au-btn-cta{width:100%;padding:16px 24px;background:linear-gradient(135deg,#c8922a,#f5d06e,#d4af37);border:none;border-radius:12px;color:#1a0a00;font-family:'Cinzel',serif;font-size:12px;font-weight:900;letter-spacing:4px;text-transform:uppercase;cursor:pointer;position:relative;overflow:hidden;box-shadow:0 0 30px rgba(212,175,55,.3),0 4px 20px rgba(0,0,0,.5);animation:au-rise .5s cubic-bezier(.34,1.56,.64,1) 1.5s both,au-btn-pulse 2.5s ease 2.5s infinite;opacity:0;transition:transform .15s;margin-bottom:14px;}
.au-btn-cta:hover{transform:scale(1.03) translateY(-1px)}
.au-btn-cta:active{transform:scale(.97)}
.au-btn-cta::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.35) 50%,transparent 70%);animation:au-shimmer 2.5s ease 2s infinite;}
.au-skip{font-size:9px;letter-spacing:2.5px;color:rgba(255,255,255,.18);text-transform:uppercase;cursor:pointer;background:none;border:none;font-family:'Cinzel',serif;transition:color .2s;animation:au-skip-in .4s ease 2s both;opacity:0;}
.au-skip:hover{color:rgba(255,255,255,.38)}
`;

const ITEMS = [
  { icon: '🌌', text: 'Portal del Templo — castillo, estrellas, portal', badge: 'Fondo vivo' },
  { icon: '⚡', text: 'Botón Sagrado — dorado primario y ghost', badge: 'Acción épica' },
  { icon: '✦', text: 'Campo de Poder — aura dorada al enfocar', badge: 'Magia visual' },
  { icon: '🏛️', text: 'Panel Ornamental — esquinas y shimmer', badge: 'Autoridad' },
  { icon: '🔥', text: 'Ascensión — cinemática épica de nivel', badge: 'Momento clave' },
  { icon: '💎', text: 'Cristal del Logro — flotar al desbloquear', badge: 'Recompensa' },
];

const RAYS = Array.from({ length: 20 }, (_, i) => i);
const RINGS = [0, 1, 2, 3];

export default function ArsenalUnlock({ show = false, newLevel = 1, userId = null, onClose }) {
  const navigate = useNavigate();
  const [visible,    setVisible]    = useState(false);
  const [exiting,    setExiting]    = useState(false);
  const [phase,      setPhase]      = useState(0);
  const [showStripe, setShowStripe] = useState(false);
  const timers = useRef([]);

  const shouldShow = show && newLevel >= NIVEL_MINIMO;

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const handleClose = useCallback(() => {
    clearAll();
    setExiting(true);
    timers.current.push(setTimeout(() => {
      setVisible(false);
      setExiting(false);
      setPhase(0);
      onClose?.();
    }, 400));
  }, [clearAll, onClose]);

  useEffect(() => {
    if (!shouldShow) return;
    setVisible(true);
    setExiting(false);
    setPhase(0);
    const t = (...args) => { const id = setTimeout(...args); timers.current.push(id); return id; };
    t(() => setPhase(1), 80);
    t(() => setPhase(2), 400);
    t(() => setPhase(3), 900);
    t(() => setPhase(4), 1400);
    return clearAll;
  }, [shouldShow, clearAll]);

  if (!visible || !shouldShow) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className={`au-overlay${exiting ? ' au-out' : ''}`}>
        <div className="au-rays-wrap">
          <div className="au-rays-disk">
            {RAYS.map(i => (
              <div key={i} className="au-ray" style={{ transform: `rotate(${i * (360 / RAYS.length)}deg) translateX(-50%)` }} />
            ))}
          </div>
        </div>
        <div className="au-orb" />
        <div className="au-glow-rings">
          {RINGS.map(i => (
            <div key={i} className={`au-glow-ring${phase >= 1 ? ' on' : ''}`} />
          ))}
        </div>
        <div className="au-card">
          <div className="au-eyebrow">
            <div className="au-eyebrow-line" />
            ✦ Recompensa Desbloqueada ✦
            <div className="au-eyebrow-line r" />
          </div>
          <div className="au-icon-wrap">
            {phase >= 2 && <div className="au-sword">⚔️</div>}
            {phase >= 2 && <div className="au-lock-badge">🔓</div>}
          </div>
          <div className="au-headline">Arsenal RPG</div>
          <div className="au-subtitle">Nivel {newLevel} · Acceso especial desbloqueado</div>
          <div className="au-divider">
            <div className="au-divider-line" />
            <div className="au-divider-gem" />
            <div className="au-divider-line" style={{background:'linear-gradient(to right,transparent,rgba(212,175,55,.25),transparent)'}} />
            <div className="au-divider-gem" style={{background:'rgba(180,79,255,.7)',boxShadow:'0 0 6px rgba(180,79,255,.5)'}} />
            <div className="au-divider-line" />
          </div>
          {phase >= 3 && (
            <div className="au-items">
              {ITEMS.map((item, i) => (
                <div key={i} className="au-item" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="au-item-icon">{item.icon}</span>
                  <span className="au-item-text">{item.text}</span>
                  <span className="au-item-badge">{item.badge}</span>
                </div>
              ))}
            </div>
          )}
          {phase >= 4 && (
            <div className="au-price-row">
              <span className="au-price-amount">$8</span>
              <span className="au-price-label">pago único · tuyo para siempre</span>
            </div>
          )}
          {phase >= 4 && (
            <button className="au-btn-cta" onClick={() => { handleClose(); navigate('/arsenal-rpg'); }}>
              ⚔️ &nbsp; VER EL ARSENAL
            </button>
          )}
          {phase >= 4 && (
            <button
              className="au-skip"
              onClick={() => setShowStripe(true)}
              style={{ color: 'rgba(212,175,55,.5)', marginBottom: 8 }}
            >
              Comprar directo — $8
            </button>
          )}
          {phase >= 4 && (
            <button className="au-skip" onClick={handleClose}>
              Ahora no
            </button>
          )}
        </div>
      </div>
      {showStripe && (
        <StripePaymentModal
          offer={ARSENAL_OFFER}
          userId={userId}
          onSuccess={() => { setShowStripe(false); handleClose(); }}
          onClose={() => setShowStripe(false)}
        />
      )}
    </>
  );
}
