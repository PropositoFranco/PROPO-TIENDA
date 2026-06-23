import { useState, useEffect, useRef } from "react";
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { missionsService } from '../../services/missions.service';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';

// ── CONSTANTES ──────────────────────────────────────────────────────────────
const CFG = {
  DIARIA:  { label:"MISIÓN DIARIA",     color:"#fbbf24", glow:"rgba(251,191,36,.55)",  border:"rgba(251,191,36,.35)",  cardBorder:"rgba(245,158,11,.45)",  bg:"rgba(120,53,15,.18)",   textColor:"#fde68a", gradTop:"rgba(55,22,4,.97)",   accent:"rgba(251,191,36,.65)", ik:"DIARIA"  },
  SEMANAL: { label:"OPERACIÓN SEMANAL",   color:"#60a5fa", glow:"rgba(96,165,250,.5)",   border:"rgba(96,165,250,.35)",  cardBorder:"rgba(59,130,246,.45)",  bg:"rgba(7,60,130,.18)",    textColor:"#bfdbfe", gradTop:"rgba(4,18,48,.97)",   accent:"rgba(96,165,250,.65)", ik:"SEMANAL" },
  EPICA:   { label:"Prueba Épica",      color:"#f59e0b", glow:"rgba(245,158,11,.6)",   border:"rgba(245,158,11,.4)",   cardBorder:"rgba(217,119,6,.55)",   bg:"rgba(120,53,15,.22)",   textColor:"#fde68a", gradTop:"rgba(48,18,0,.98)",   accent:"rgba(245,158,11,.75)", ik:"EPICA"   },
  NORMAL:  { label:"Llamado del Templo",color:"#a78bfa", glow:"rgba(167,139,250,.45)", border:"rgba(139,92,246,.35)",  cardBorder:"rgba(124,58,237,.45)",  bg:"rgba(88,28,135,.15)",   textColor:"#ddd6fe", gradTop:"rgba(18,6,38,.97)",   accent:"rgba(167,139,250,.65)",ik:"NORMAL"  },
};

const ICONS = {
  DIARIA: (
    <svg viewBox="0 0 48 48" fill="none">
      <defs><radialGradient id="d1" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#f9e48a"/><stop offset="60%" stopColor="#e8a020"/><stop offset="100%" stopColor="#a05010"/></radialGradient></defs>
      <polygon points="24,4 28,18 42,18 31,27 35,41 24,33 13,41 17,27 6,18 20,18" fill="url(#d1)" stroke="#fbbf24" strokeWidth=".8"/>
      <circle cx="24" cy="24" r="3" fill="rgba(255,255,255,.5)"/>
    </svg>
  ),
  SEMANAL: (
    <svg viewBox="0 0 48 48" fill="none">
      <defs><radialGradient id="s1" cx="50%" cy="35%" r="60%"><stop offset="0%" stopColor="#60a5fa"/><stop offset="70%" stopColor="#1d4ed8"/><stop offset="100%" stopColor="#1e3a8a"/></radialGradient></defs>
      <path d="M24 4 L40 11 L40 26 C40 35 32 42 24 45 C16 42 8 35 8 26 L8 11 Z" fill="url(#s1)" stroke="#93c5fd" strokeWidth=".8"/>
      <path d="M17 24 L21.5 29 L31 20" stroke="#bfdbfe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  EPICA: (
    <svg viewBox="0 0 48 48" fill="none">
      <defs><linearGradient id="e1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fde68a"/><stop offset="40%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#92400e"/></linearGradient></defs>
      <path d="M6 34 L10 16 L18 26 L24 8 L30 26 L38 16 L42 34 Z" fill="url(#e1)" stroke="#fbbf24" strokeWidth=".8" strokeLinejoin="round"/>
      <rect x="6" y="34" width="36" height="6" rx="2" fill="url(#e1)" stroke="#fbbf24" strokeWidth=".5"/>
    </svg>
  ),
  NORMAL: (
    <svg viewBox="0 0 48 48" fill="none">
      <defs><linearGradient id="n1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#c4b5fd"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient></defs>
      <rect x="10" y="8" width="28" height="34" rx="4" fill="rgba(109,40,217,.2)" stroke="url(#n1)" strokeWidth="1.2"/>
      <rect x="8" y="8" width="6" height="34" rx="3" fill="rgba(109,40,217,.35)" stroke="rgba(167,139,250,.5)" strokeWidth=".8"/>
      <rect x="34" y="8" width="6" height="34" rx="3" fill="rgba(109,40,217,.35)" stroke="rgba(167,139,250,.5)" strokeWidth=".8"/>
      <line x1="16" y1="18" x2="32" y2="18" stroke="rgba(196,181,253,.7)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="16" y1="24" x2="32" y2="24" stroke="rgba(196,181,253,.7)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="16" y1="30" x2="26" y2="30" stroke="rgba(196,181,253,.5)" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
};

// Misiones desde base de datos

const HOOKS = {
  DIARIA:  "Hoy el Templo te convoca. Los que actúan escriben su historia.",
  SEMANAL: "Esta semana define quién cruzará al siguiente nivel.",
  EPICA:   "Pocos llegan aquí. Menos aún lo completan.",
  NORMAL:  "El Templo registra cada acto. Ningún paso pasa desapercibido.",
};

const DONE_MSGS = {
  DIARIA:  ["¡Misión diaria completada!", "El Templo registra tu victoria.", "Hoy fuiste quien dijiste que serías."],
  SEMANAL: ["¡Operación semanal sellada!", "Tu disciplina habla por ti.", "Los débiles descansan. Tú avanzas."],
  EPICA:   ["¡PRUEBA ÉPICA SUPERADA!", "Leyenda forjada con fuego real.", "Pocos llegan aquí. Tú lo lograste."],
  NORMAL:  ["Misión completada. El Templo te honra.", "Cada paso cuenta. Este también.", "Victoria silenciosa. La más real."],
};

// ── AUDIO ───────────────────────────────────────────────────────────────────
function playDoneSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = {
      DIARIA:  [523.25, 659.25, 783.99, 1046.50],
      SEMANAL: [440, 554.37, 659.25, 880],
      EPICA:   [523.25, 659.25, 783.99, 1046.50, 1318.51],
      NORMAL:  [523.25, 659.25, 783.99, 1046.50],
    };
    const seq = notes[type] || notes.NORMAL;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(.22, ctx.currentTime + .02);
    master.gain.setValueAtTime(.22, ctx.currentTime + .55);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + .9);
    master.connect(ctx.destination);
    seq.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = i === seq.length - 1 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(0, ctx.currentTime + i * .09);
      g.gain.linearRampToValueAtTime(.7, ctx.currentTime + i * .09 + .03);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + i * .09 + .32);
      osc.connect(g); g.connect(master);
      osc.start(ctx.currentTime + i * .09);
      osc.stop(ctx.currentTime + i * .09 + .35);
    });
    if (type === "EPICA") {
      const bell = ctx.createOscillator();
      const bg   = ctx.createGain();
      bell.type = "sine";
      bell.frequency.setValueAtTime(2093, ctx.currentTime + .5);
      bell.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 1.1);
      bg.gain.setValueAtTime(.18, ctx.currentTime + .5);
      bg.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + 1.2);
      bell.connect(bg); bg.connect(master);
      bell.start(ctx.currentTime + .5); bell.stop(ctx.currentTime + 1.2);
    }
  } catch (e) {}
}

// ── HELPERS ─────────────────────────────────────────────────────────────────
function getCfg(t) { return CFG[t] || CFG.NORMAL; }

function CornerSvg({ color }) {
  return (
    <svg className="corn" viewBox="0 0 24 24" fill="none">
      <path d="M2 22 L2 2 L22 2" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity=".32"/>
      <path d="M2 12 L6 12 M12 2 L12 6" stroke={color} strokeWidth="1" strokeLinecap="round" opacity=".16"/>
    </svg>
  );
}

// ── DONE OVERLAY — igual al HTML: radio aleatorio, 5 colores ────────────────
function DoneOverlay({ m }) {
  const msgs  = DONE_MSGS[m.type] || DONE_MSGS.NORMAL;
  const msg   = msgs[m.id % msgs.length];
  // HTML usa 5 colores (no 6) y Math.random() para el radio
  const cols  = ["rgba(74,222,128,.9)","rgba(212,168,52,.9)","rgba(167,139,250,.9)","rgba(96,165,250,.9)","rgba(251,191,36,.9)"];
  const angles = [0, 60, 120, 180, 240, 300];
  return (
    <div className="mc-done-overlay">
      {angles.map((a, i) => {
        const r  = 55 + Math.random() * 20;
        const sx = Math.round(Math.cos(a * Math.PI / 180) * r) + "px";
        const sy = Math.round(Math.sin(a * Math.PI / 180) * r) + "px";
        return (
          <div
            key={i}
            className="mc-done-star"
            style={{
              background:  cols[i % cols.length],
              boxShadow:  `0 0 6px ${cols[i % cols.length]}`,
              "--sx": sx,
              "--sy": sy,
              "--sd": `${i * .07}s`,
            }}
          />
        );
      })}
      <div className="mc-done-ring"/>
      <div className="mc-done-ring2"/>
      <div className="mc-done-check-wrap">
        <svg className="mc-done-check-svg" viewBox="0 0 32 32">
          <path className="mc-done-check-path" d="M7 17 L13 23 L25 11"/>
        </svg>
      </div>
      <div className="mc-done-title">¡Misión Completada!</div>
      <div className="mc-done-msg">{msg}</div>
    </div>
  );
}

function ProgressBar({ m, c }) {
  const pct = Math.min(100, Math.round((m.progress / m.goal) * 100));
  return (
    <div className="mc-progress">
      <div className="mc-prog-header">
        <span className="mc-prog-lbl">Avance del iniciado</span>
        <span className="mc-prog-pct" style={{ color: c.textColor }}>{pct}%</span>
      </div>
      <div className="mc-track">
        <div
          className="mc-fill"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg,${c.color}55 0%,${c.color} 80%,rgba(255,255,255,.35) 100%)`,
            boxShadow: `0 0 14px ${c.glow},0 0 6px ${c.color}88`,
          }}
        />
        {pct > 3 && (
          <div
            className="mc-orb"
            style={{
              left: `${pct}%`,
              background: `radial-gradient(circle at 35% 35%,#fff 0%,${c.color} 50%,rgba(0,0,0,.3) 100%)`,
              boxShadow: `0 0 12px ${c.color},0 0 24px ${c.glow}`,
            }}
          />
        )}
      </div>
      <div className="mc-prog-meta">
        <span style={{ color: "rgba(255,255,255,.18)" }}>Inicio</span>
        <span style={{ color: c.color, opacity: .55 }}>{m.progress} / {m.goal}</span>
      </div>
    </div>
  );
}

function RewardRow({ m, c }) {
  return (
    <div className="mc-rewards">
      <span className="rw-lbl">⚔️ Recompensa</span>
      {m.xp > 0 && (
        <div className="rw-pill rw-xp">
          <svg width="13" height="13" viewBox="0 0 13 13">
            <polygon points="6.5,1 7.9,4.8 12,4.8 8.7,7.4 9.9,11.5 6.5,9.2 3.1,11.5 4.3,7.4 1,4.8 5.1,4.8" fill="#4ade80" stroke="#86efac" strokeWidth=".4"/>
          </svg>
          <span>{m.xp} XP</span>
        </div>
      )}
      {m.coins > 0 && (
        <div className="rw-coin">
          <span style={{fontSize:26,filter:'drop-shadow(0 0 8px rgba(255,180,20,.95))'}}>🪙</span>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
            <span className="coin-num">{m.coins.toLocaleString()}</span>
            <span className="coin-sub">PropoCoins</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CSS GLOBAL — idéntico al HTML, incluyendo los keyframes faltantes ────────
const GLOBAL_CSS = `
*{box-sizing:border-box;margin:0;padding:0;}
body{
  background:linear-gradient(175deg,#060112 0%,#0d0328 28%,#07011e 58%,#040010 100%);
  min-height:100vh;
  font-family:Georgia,'Times New Roman',serif;
  overflow-x:hidden;
  padding-top:80px;
}
@keyframes card-rise{from{opacity:0;transform:translateY(28px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}
@keyframes bar-fill{from{width:0;}}
@keyframes title-shimmer{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
@keyframes nebula{0%,100%{opacity:.3;}50%{opacity:.55;}}
@keyframes pfloat{0%,100%{transform:translateY(0) scale(1);opacity:.4;}50%{transform:translateY(-16px) scale(1.2);opacity:.9;}}
@keyframes spin-border{to{transform:rotate(360deg);}}
@keyframes halo-p{0%,100%{opacity:.4;}50%{opacity:.85;}}
@keyframes uploadPulse{0%,100%{border-color:rgba(255,255,255,0.1);}50%{border-color:rgba(167,139,250,0.4);}}
@keyframes imgIn{from{opacity:0;transform:scale(1.04);}to{opacity:1;transform:scale(1);}}

.page{max-width:660px;margin:0 auto;padding:0 clamp(10px,3vw,20px) clamp(70px,10vh,100px);position:relative;z-index:2;}
.nebula-fixed{position:fixed;inset:0;pointer-events:none;z-index:0;}
.ptc{position:fixed;border-radius:50%;pointer-events:none;z-index:1;animation:pfloat linear infinite;}

@keyframes ki-breathe{0%,100%{opacity:.18;transform:scaleX(1) scaleY(1);}50%{opacity:.28;transform:scaleX(1.1) scaleY(1.14);}}
@keyframes ki-breathe-mid{0%,100%{opacity:.22;transform:scale(1);}50%{opacity:.35;transform:scale(1.08);}}
@keyframes ki-rise{0%{transform:translateY(0) translateX(var(--kx,0px)) scale(1);opacity:.75;}60%{opacity:.5;}100%{transform:translateY(-70px) translateX(var(--kx,0px)) scale(0);opacity:0;}}
@keyframes ki-electric{0%,100%{opacity:0;}40%,60%{opacity:.8;}}
@keyframes ki-shimmer-body{0%,100%{filter:drop-shadow(0 0 8px rgba(160,70,255,.65)) drop-shadow(0 0 20px rgba(120,40,220,.35));}50%{filter:drop-shadow(0 0 14px rgba(180,90,255,.85)) drop-shadow(0 0 32px rgba(140,60,240,.5)) drop-shadow(0 0 6px rgba(255,210,80,.3));}}
@keyframes ki-ring-pulse{0%,100%{transform:translateX(-50%) scaleX(0.8);opacity:0;}50%{transform:translateX(-50%) scaleX(1.05);opacity:.35;}}

.hero{position:relative;padding:0;display:block;overflow:hidden;}
.hero-top-band{width:100%;height:2px;background:linear-gradient(90deg,transparent 0%,rgba(212,168,52,.15) 20%,rgba(212,168,52,.7) 50%,rgba(212,168,52,.15) 80%,transparent 100%);}
.hero-text{position:relative;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;width:100%;padding:0 20px 0 150px;}
.hero-inner{width:100%;position:relative;min-height:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 16px;box-sizing:border-box;}
.hero-inner::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 75% 50%,rgba(120,40,220,.08) 0%,transparent 45%);pointer-events:none;z-index:0;}
.hero-inner::after{content:'';position:absolute;top:0;right:0;bottom:0;left:130px;background:linear-gradient(105deg,transparent 0%,rgba(167,139,250,0.04) 20%,rgba(212,175,55,0.06) 50%,rgba(167,139,250,0.04) 80%,transparent 100%);background-size:200% 100%;animation:rw-shimmer 2.5s linear infinite;pointer-events:none;z-index:0;}

.maestro-wrap{position:absolute;left:-12px;bottom:0;width:145px;z-index:10;overflow:visible;pointer-events:none;}
.maestro-ground{display:none;}
.ki-aura-outer{position:absolute;bottom:-5%;left:50%;transform:translateX(-50%);width:165px;height:195px;background:radial-gradient(ellipse at 50% 58%,rgba(120,40,220,.6) 0%,rgba(80,20,180,.3) 35%,transparent 72%);filter:blur(22px);mix-blend-mode:screen;animation:ki-breathe 3s ease-in-out infinite;pointer-events:none;z-index:0;}
.ki-aura-mid{position:absolute;bottom:2%;left:50%;transform:translateX(-50%);width:118px;height:155px;background:radial-gradient(ellipse at 50% 52%,rgba(170,80,255,.55) 0%,rgba(120,45,220,.28) 45%,transparent 72%);filter:blur(10px);mix-blend-mode:screen;animation:ki-breathe-mid 3s ease-in-out .4s infinite;pointer-events:none;z-index:1;}
.ki-ring{position:absolute;bottom:-10px;left:50%;width:100px;height:14px;border-radius:50%;background:radial-gradient(ellipse at 50% 50%,rgba(160,70,255,.5) 0%,rgba(120,40,200,.18) 65%,transparent 85%);filter:blur(7px);mix-blend-mode:screen;animation:ki-ring-pulse 3s ease-in-out infinite;pointer-events:none;z-index:0;}
.ki-bolt{position:absolute;pointer-events:none;z-index:5;animation:ki-electric 2.2s ease-in-out infinite;mix-blend-mode:screen;}
.ki-bolt svg{display:block;}
.ki-particle{position:absolute;border-radius:50%;pointer-events:none;z-index:6;animation:ki-rise 2.2s ease-out infinite;mix-blend-mode:screen;}
.maestro-svg{display:block;width:100%;height:auto;position:relative;z-index:4;mix-blend-mode:screen;animation:ki-shimmer-body 3s ease-in-out infinite;}
@keyframes wave-pulse{0%,100%{opacity:0;transform:translateX(-50%) scale(0.85);}50%{opacity:1;transform:translateX(-50%) scale(1.15);}}
.ki-wave{display:none;}
.ki-wave-2{display:none;}

.hero-text{position:relative;z-index:5;display:flex;flex-direction:column;align-items:center;text-align:center;width:100%;padding-left:120px;}
.hero-eyebrow{font-size:7px;letter-spacing:5px;font-weight:800;color:rgba(212,168,52,.72);text-transform:uppercase;margin-bottom:7px;display:flex;align-items:center;gap:8px;}
.hero-eyebrow::before,.hero-eyebrow::after{content:'';display:block;width:18px;height:1px;background:linear-gradient(90deg,transparent,rgba(212,168,52,.5));}
.hero-eyebrow::after{background:linear-gradient(90deg,rgba(212,168,52,.5),transparent);}

@keyframes title-3d-breathe{
  0%,100%{text-shadow:
    0 1px 0 #c8860a,0 2px 0 #b8760a,0 3px 0 #a86600,0 4px 0 #985600,0 5px 0 #884600,
    0 6px 1px rgba(0,0,0,.5),0 0 20px rgba(255,180,30,.25),0 0 40px rgba(255,160,10,.1);}
  50%{text-shadow:
    0 1px 0 #d8960a,0 2px 0 #c8860a,0 3px 0 #b8760a,0 4px 0 #a86600,0 5px 0 #985600,
    0 6px 2px rgba(0,0,0,.55),0 0 28px rgba(255,200,50,.4),0 0 55px rgba(255,180,20,.18),0 0 70px rgba(240,150,0,.08);}
}

.hero-title{
  font-size:clamp(22px,5vw,38px);font-weight:900;line-height:1.0;letter-spacing:1px;text-transform:uppercase;
  font-family:Georgia,'Times New Roman',serif;
  color:#ffe066;
  text-shadow:0 1px 0 #c8860a,0 2px 0 #b8760a,0 3px 0 #a86600,0 4px 0 #985600,0 5px 0 #884600,0 6px 1px rgba(0,0,0,.5),0 0 20px rgba(255,180,30,.25),0 0 40px rgba(255,160,10,.1);
  animation:title-3d-breathe 4s ease-in-out infinite;
  margin-bottom:2px;
  /* CRÍTICO: evita que background-clip:text anule las text-shadows */
  -webkit-text-fill-color:unset;
  background:none;
}
.hero-sep{width:70%;height:1px;background:linear-gradient(90deg,transparent,rgba(212,168,52,.5) 30%,rgba(255,210,80,.7) 50%,rgba(212,168,52,.5) 70%,transparent);margin:9px auto 9px;}
.hero-quote{font-size:11.5px;font-style:italic;line-height:1.7;color:#e8d9a0;text-shadow:0 0 18px rgba(255,210,80,.35),0 1px 3px rgba(0,0,0,.6);margin-bottom:14px;padding:8px 14px;border-left:1.5px solid rgba(212,168,52,.45);border-right:1.5px solid rgba(212,168,52,.45);text-align:center;display:block;background:linear-gradient(90deg,transparent,rgba(120,60,0,.18),transparent);letter-spacing:.3px;}
.hero-stats{display:flex;gap:8px;align-items:center;justify-content:center;}
.stat-pill{border-radius:10px;padding:7px 18px;text-align:center;min-width:90px;}
.stat-val{font-size:clamp(15px,3.5vw,22px);font-weight:900;line-height:1;font-family:Georgia,serif;display:block;}
.stat-lbl{font-size:7.5px;letter-spacing:2px;margin-top:3px;color:rgba(180,160,220,.38);text-transform:uppercase;font-weight:700;display:block;}

@media(max-width:500px){
  .maestro-wrap{width:118px;left:-8px;}
  .hero-text{padding-left:100px;}
  .hero-title{font-size:28px;}
  .hero-eyebrow{font-size:6px;letter-spacing:3.5px;}
  .hero-quote{font-size:9px;}
  .stat-val{font-size:18px;}
  .ki-aura-outer{width:138px;height:162px;}
  .ki-aura-mid{width:100px;height:130px;}
}
@media(max-width:370px){
  .maestro-wrap{width:100px;}
  .hero-text{padding-left:86px;}
  .hero-title{font-size:22px;}
  .hero-quote{display:none;}
}

/* ── PROPOPASS / CÍRCULO DORADO ── */
@keyframes vip-border-spin{to{transform:rotate(360deg);}}
@keyframes vip-shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
@keyframes vip-glow-pulse{0%,100%{box-shadow:0 0 18px rgba(212,175,55,.35),0 0 40px rgba(212,175,55,.12),inset 0 1px 0 rgba(255,210,80,.15);}50%{box-shadow:0 0 38px rgba(212,175,55,.75),0 0 80px rgba(212,175,55,.3),inset 0 1px 0 rgba(255,210,80,.35);}}
@keyframes vip-icon-float{0%,100%{transform:translateY(0) rotate(-2deg);}50%{transform:translateY(-5px) rotate(2deg);}}
@keyframes vip-locked-float{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-3px) scale(1.08);}}
@keyframes vip-ray{0%{opacity:0;transform:scaleY(0);}40%{opacity:.6;}100%{opacity:0;transform:scaleY(1.4);}}
@keyframes vip-particles{0%{transform:translate(0,0) scale(1);opacity:.8;}100%{transform:translate(var(--px),var(--py)) scale(0);opacity:0;}}
@keyframes vip-badge-pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.04);}}
@keyframes vip-loss-blink{0%,100%{opacity:1;}50%{opacity:.55;}}
@keyframes vip-scan{0%{top:-10%;}100%{top:110%;}}

.vip-btn{
  position:relative;border-radius:14px;padding:12px 8px 10px;cursor:pointer;
  border:none;outline:none;overflow:hidden;
  background:linear-gradient(160deg,rgba(90,40,0,.98) 0%,rgba(18,6,0,1) 55%,rgba(70,30,0,.95) 100%);
  border-top:1.5px solid rgba(255,210,70,.6);
  border-left:1.5px solid rgba(255,190,50,.35);
  border-right:1.5px solid rgba(0,0,0,.7);
  border-bottom:3px solid rgba(0,0,0,.9);
  box-shadow:0 5px 0 rgba(0,0,0,.85),0 0 22px rgba(212,175,55,.25),inset 0 1px 0 rgba(255,215,90,.15);
  transition:transform .12s cubic-bezier(.34,1.56,.64,1),filter .15s,box-shadow .15s;
  animation:vip-glow-pulse 2.5s ease-in-out infinite;
  display:flex;flex-direction:column;align-items:center;gap:4px;
}
.vip-btn::before{
  content:'';position:absolute;top:0;left:-120%;width:55%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,215,90,.22),transparent);
  animation:vip-shimmer 2.6s linear infinite;pointer-events:none;
}
.vip-btn::after{
  content:'';position:absolute;top:-50%;left:50%;transform:translateX(-50%);
  width:1.5px;height:200%;
  background:linear-gradient(180deg,transparent,rgba(255,215,90,.35),transparent);
  animation:vip-ray 3s ease-in-out infinite;pointer-events:none;
}
.vip-btn:hover{transform:translateY(-4px) scale(1.06);filter:brightness(1.3);box-shadow:0 8px 0 rgba(0,0,0,.85),0 0 40px rgba(212,175,55,.55),inset 0 1px 0 rgba(255,215,90,.25);}
.vip-btn:active{transform:translateY(2px) scale(.97);box-shadow:0 2px 0 rgba(0,0,0,.85),inset 0 3px 6px rgba(0,0,0,.5);}
.vip-btn:disabled{cursor:not-allowed;opacity:.45;filter:grayscale(.5) brightness(.7);animation:none;transform:none!important;}
.vip-btn-icon{font-size:24px;filter:drop-shadow(0 0 10px rgba(212,175,55,.85));animation:vip-icon-float 3s ease-in-out infinite;}
.vip-btn-xp{font-family:Georgia,serif;font-size:13px;font-weight:900;
  background:linear-gradient(90deg,#c8920a,#f5d06e,#fff5a0,#f5d06e,#c8920a);
  background-size:200% auto;animation:vip-shimmer 2s linear infinite;
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  letter-spacing:.5px;
}
.vip-btn-lbl{font-family:Georgia,serif;font-size:8px;letter-spacing:2px;color:rgba(212,175,55,.5);text-transform:uppercase;}
.vip-cd{margin-top:2px;font-family:Georgia,serif;font-size:8px;letter-spacing:1px;color:rgba(74,222,128,.75);background:rgba(74,222,128,.08);border-radius:6px;padding:2px 7px;}

@keyframes vip-lock-shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
@keyframes vip-lock-breathe{
  0%,100%{box-shadow:0 0 18px rgba(160,80,255,.2),0 0 35px rgba(212,175,55,.1),0 5px 0 rgba(0,0,0,.85),inset 0 1px 0 rgba(255,180,255,.1);}
  50%{box-shadow:0 0 40px rgba(160,80,255,.55),0 0 80px rgba(212,175,55,.2),0 5px 0 rgba(0,0,0,.85),inset 0 1px 0 rgba(255,200,255,.25);}
}
@keyframes vip-lock-ray{0%{opacity:0;transform:translateY(-100%) rotate(15deg);}40%{opacity:.7;}100%{opacity:0;transform:translateY(200%) rotate(15deg);}}
@keyframes vip-lock-orb{0%,100%{transform:scale(1);opacity:.6;}50%{transform:scale(1.35);opacity:1;}}
@keyframes vip-lock-float2{0%,100%{transform:translateY(0) scale(1) rotate(-3deg);}50%{transform:translateY(-6px) scale(1.12) rotate(3deg);}}

.vip-locked-btn{
  position:relative;overflow:hidden;cursor:not-allowed;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
  padding:clamp(16px,3vw,24px) clamp(8px,2vw,12px) clamp(14px,2.5vw,20px);
  min-height:160px;
  background:linear-gradient(160deg,rgba(50,18,4,.99) 0%,rgba(18,6,0,1) 45%,rgba(40,14,0,.98) 80%,rgba(25,8,0,.99) 100%);
  border-top:1.5px solid rgba(255,200,60,.5);
  border-left:1.5px solid rgba(255,180,40,.3);
  border-right:1.5px solid rgba(0,0,0,.75);
  border-bottom:3px solid rgba(0,0,0,.92);
  box-shadow:0 0 30px rgba(212,175,55,.15),inset 0 1px 0 rgba(255,210,80,.1);
  animation:vip-glow-pulse 2.5s ease-in-out infinite;
  clip-path:polygon(10px 0%,calc(100% - 10px) 0%,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0% calc(100% - 10px),0% 10px);
}
.vip-locked-btn::before{
  content:'';position:absolute;top:-10%;left:30%;width:18%;height:120%;
  background:linear-gradient(180deg,transparent,rgba(200,130,255,.22),rgba(212,175,55,.15),transparent);
  transform:rotate(15deg);
  animation:vip-lock-ray 4s ease-in-out infinite;pointer-events:none;
}
.vip-locked-btn::after{
  content:'';position:absolute;inset:0;
  background:repeating-linear-gradient(135deg,transparent,transparent 8px,rgba(160,80,255,.025) 8px,rgba(160,80,255,.025) 9px);
  pointer-events:none;
}
.vip-lock-overlay{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;
  position:relative;z-index:2;width:100%;text-align:center;
}
.vip-lock-icon{
  font-size:clamp(20px,3.5vw,26px);
  animation:vip-lock-float2 2.8s ease-in-out infinite;
  filter:drop-shadow(0 0 14px rgba(200,130,255,.9)) drop-shadow(0 0 6px rgba(212,175,55,.6)) drop-shadow(0 2px 3px rgba(0,0,0,1));
}
.vip-lock-sub{
  font-family:Georgia,serif;font-size:clamp(7px,1.2vw,9px);letter-spacing:2px;text-transform:uppercase;font-weight:700;
  color:#e0b0ff;white-space:nowrap;
  text-shadow:0 0 12px rgba(200,130,255,.9),0 0 5px rgba(160,80,255,.6),0 1px 2px rgba(0,0,0,1);
}

.vip-section-header{
  position:relative;display:flex;align-items:center;gap:0;
  margin:6px 0 10px;overflow:hidden;border-radius:10px;min-width:0;
  background:linear-gradient(135deg,rgba(50,22,0,.98),rgba(15,6,0,1),rgba(45,18,0,.97));
  border-top:1px solid rgba(255,210,70,.4);
  border-bottom:1px solid rgba(0,0,0,.7);
  border-left:1px solid rgba(255,195,50,.25);
  border-right:1px solid rgba(0,0,0,.6);
  box-shadow:0 0 28px rgba(212,175,55,.18),inset 0 1px 0 rgba(255,210,80,.1);
  animation:vip-badge-pulse 3s ease-in-out infinite;
}
.vip-section-header::before{
  content:'';position:absolute;top:0;left:-80%;width:40%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,215,80,.12),transparent);
  animation:vip-shimmer 3s linear infinite;pointer-events:none;
}
.vip-section-header::after{
  content:'';position:absolute;left:0;width:100%;height:1.5px;
  background:linear-gradient(90deg,transparent,rgba(255,215,80,.15),transparent);
  top:0;pointer-events:none;
}
.vip-sh-scan{
  position:absolute;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,rgba(212,175,55,.4),transparent);
  animation:vip-scan 4s linear infinite;pointer-events:none;
}
.vip-sh-left{padding:8px clamp(6px,1.5vw,14px);display:flex;align-items:center;gap:8px;flex:1;min-width:0;overflow:hidden;}
.vip-sh-crown{font-size:20px;filter:drop-shadow(0 0 12px rgba(212,175,55,.9));animation:vip-icon-float 3.5s ease-in-out infinite;flex-shrink:0;}
.vip-sh-texts{display:flex;flex-direction:column;gap:1px;min-width:0;overflow:hidden;width:100%;}
.vip-sh-tag{font-size:9px;letter-spacing:4px;font-family:Georgia,serif;font-weight:700;
  color:#f5d06e;
  text-shadow:0 0 14px rgba(212,175,55,.9),0 0 6px rgba(255,180,30,.6),0 1px 2px rgba(0,0,0,1);
  text-transform:uppercase;white-space:nowrap;
}
.vip-sh-name{font-size:clamp(12px,2vw,15px);font-weight:900;font-family:Georgia,serif;letter-spacing:2px;
  white-space:nowrap;
  background:linear-gradient(90deg,#c8920a,#f5d06e,#fff5a0,#f5d06e,#c8920a);
  background-size:200% auto;
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  animation:vip-shimmer 2.5s linear infinite;
}
.vip-sh-right{padding:8px clamp(6px,1.5vw,14px);display:flex;flex-direction:column;align-items:flex-end;gap:3px;border-left:1px solid rgba(212,175,55,.1);min-width:0;flex-shrink:0;max-width:45%;}
.vip-sh-loss{font-family:Georgia,serif;font-size:9px;font-weight:700;letter-spacing:1px;
  color:rgba(212,175,55,.8);text-transform:uppercase;
  animation:vip-loss-blink 2s ease-in-out infinite;
}
.vip-sh-perks{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;}
.vip-perk-pill{
  font-family:Georgia,serif;font-size:8px;letter-spacing:1px;font-weight:900;
  background:linear-gradient(135deg,rgba(120,40,220,.6) 0%,rgba(60,10,140,.9) 50%,rgba(100,30,200,.5) 100%);
  border-top:1px solid rgba(200,130,255,.6);
  border-left:1px solid rgba(180,100,255,.4);
  border-right:1px solid rgba(0,0,0,.5);
  border-bottom:2px solid rgba(0,0,0,.7);
  border-radius:7px;padding:3px 10px;
  color:#e0b0ff;
  white-space:nowrap;
  box-shadow:0 0 12px rgba(160,80,255,.35),0 0 24px rgba(140,60,240,.15),inset 0 1px 0 rgba(255,200,255,.15);
  text-shadow:0 0 10px rgba(200,130,255,.9),0 1px 2px rgba(0,0,0,1);
  animation:vip-lock-breathe 3s ease-in-out infinite;
}

/* ── MISIÓN COMPLETADA ── */
@keyframes done-in{0%{opacity:0;transform:scale(.7) translateY(10px);}60%{transform:scale(1.06) translateY(-3px);}100%{opacity:1;transform:scale(1) translateY(0);}}
@keyframes done-check{0%{stroke-dashoffset:40;opacity:0;}40%{opacity:1;}100%{stroke-dashoffset:0;opacity:1;}}
@keyframes done-ring{0%{transform:translate(-50%,-50%) scale(.5);opacity:.8;}100%{transform:translate(-50%,-50%) scale(2.2);opacity:0;}}
@keyframes done-star-fly{0%{transform:translate(0,0) scale(1);opacity:1;}100%{transform:translate(var(--sx),var(--sy)) scale(0);opacity:0;}}
/* Presentes en el HTML — faltaban en el JSX original */
@keyframes done-shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
@keyframes done-bar-flash{0%,100%{filter:brightness(1);}50%{filter:brightness(1.8) saturate(1.4);}}
.mc-done-bar-flash{animation:done-bar-flash .4s ease .1s 4;}

.mc-done-overlay{position:absolute;inset:0;z-index:30;border-radius:21px;overflow:hidden;background:rgba(2,8,4,.82);backdrop-filter:blur(3px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;animation:done-in .55s cubic-bezier(.22,1,.36,1) both;pointer-events:none;}
.mc-done-ring{position:absolute;width:72px;height:72px;border-radius:50%;border:2px solid rgba(74,222,128,.6);top:50%;left:50%;animation:done-ring 1.1s ease-out .3s both;}
.mc-done-ring2{position:absolute;width:72px;height:72px;border-radius:50%;border:1.5px solid rgba(74,222,128,.35);top:50%;left:50%;animation:done-ring 1.4s ease-out .55s both;}
.mc-done-check-wrap{position:relative;width:64px;height:64px;background:radial-gradient(circle at 40% 35%,rgba(100,255,160,.18) 0%,rgba(22,101,52,.45) 60%,rgba(4,30,12,.9) 100%);border-radius:50%;border:2px solid rgba(74,222,128,.7);box-shadow:0 0 24px rgba(74,222,128,.5),0 0 60px rgba(34,197,94,.2),inset 0 1px 0 rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mc-done-check-svg{width:32px;height:32px;}
.mc-done-check-path{stroke:#4ade80;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;fill:none;stroke-dasharray:40;stroke-dashoffset:40;animation:done-check .5s cubic-bezier(.22,1,.36,1) .2s forwards;}
.mc-done-title{font-family:Georgia,serif;font-size:15px;font-weight:900;letter-spacing:1px;color:#4ade80;text-shadow:0 0 20px rgba(74,222,128,.7),0 0 40px rgba(34,197,94,.3),0 2px 4px rgba(0,0,0,.8);text-align:center;line-height:1.2;}
.mc-done-msg{font-family:Georgia,serif;font-size:10px;font-style:italic;letter-spacing:.5px;color:rgba(180,240,200,.6);text-align:center;padding:0 24px;line-height:1.6;}
.mc-done-star{position:absolute;width:6px;height:6px;border-radius:50%;animation:done-star-fly 1s ease-out var(--sd) both;top:50%;left:50%;margin:-3px 0 0 -3px;}

/* ── FILTROS ── */
@keyframes gem-idle{0%,100%{box-shadow:0 5px 0 rgba(0,0,0,.7),0 6px 8px rgba(0,0,0,.5),0 0 0 rgba(255,255,255,0);}50%{box-shadow:0 5px 0 rgba(0,0,0,.7),0 6px 8px rgba(0,0,0,.5),0 0 22px rgba(200,160,255,.12);}}
@keyframes gem-active-pulse{0%,100%{filter:brightness(1);}50%{filter:brightness(1.18);}}
@keyframes icon-bounce{0%,100%{transform:scale(1) translateY(0);}50%{transform:scale(1.15) translateY(-1px);}}

.filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px;align-items:center;}
.fbtn{display:flex;align-items:center;gap:6px;font-size:8px;font-weight:900;letter-spacing:2px;padding:9px 16px 9px 12px;border-radius:8px;font-family:Georgia,serif;text-transform:uppercase;cursor:pointer;border:none;outline:none;position:relative;overflow:hidden;transition:transform .12s cubic-bezier(.34,1.56,.64,1),filter .12s,box-shadow .12s;background:linear-gradient(170deg,rgba(55,35,85,.95) 0%,rgba(28,14,50,.98) 100%);color:rgba(190,170,230,.38);border-top:1.5px solid rgba(160,130,220,.18);border-left:1.5px solid rgba(140,110,200,.12);border-right:1.5px solid rgba(0,0,0,.45);border-bottom:1.5px solid rgba(0,0,0,.5);box-shadow:0 5px 0 rgba(0,0,0,.7),0 6px 8px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.06);clip-path:polygon(6px 0%,calc(100% - 6px) 0%,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0% calc(100% - 6px),0% 6px);animation:gem-idle 3s ease-in-out infinite;}
.fbtn::before{content:'';position:absolute;top:0;left:-100%;width:200%;height:1.5px;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.25) 50%,transparent 100%);transition:left .4s ease;}
.fbtn:hover::before{left:0;}
.fbtn::after{content:'';position:absolute;top:0;right:0;width:30%;height:40%;background:linear-gradient(225deg,rgba(255,255,255,.08) 0%,transparent 60%);border-radius:0 6px 0 0;pointer-events:none;}
.fbtn:hover{transform:translateY(-3px) scale(1.04);filter:brightness(1.2);color:rgba(220,200,255,.75);border-top-color:rgba(200,170,255,.35);box-shadow:0 7px 0 rgba(0,0,0,.7),0 8px 14px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.1),0 0 20px rgba(180,130,255,.15);}
.fbtn:active{transform:translateY(3px) scale(.97);box-shadow:0 2px 0 rgba(0,0,0,.7),0 2px 4px rgba(0,0,0,.5),inset 0 2px 4px rgba(0,0,0,.3);}
.fbtn .f-icon{width:13px;height:13px;flex-shrink:0;opacity:.45;transition:opacity .2s,transform .2s;}
.fbtn:hover .f-icon{opacity:.85;animation:icon-bounce .4s ease;}

/* ── CARDS ── */
.mc-outer{position:relative;border-radius:23px;margin-bottom:20px;overflow:hidden;}
.mc-outer::before{content:'';position:absolute;inset:-100%;background:conic-gradient(from 0deg,transparent 68%,var(--sc,#a78bfa) 78%,rgba(255,255,255,.75) 83%,var(--sc,#a78bfa) 88%,transparent 98%);animation:spin-border 3.5s linear infinite;animation-delay:var(--sd,0s);}
.mc{position:relative;border-radius:21px;margin:1.5px;box-shadow:0 4px 0 1px rgba(0,0,0,.88),0 14px 50px rgba(0,0,0,.65);overflow:hidden;z-index:1;}
.mc-border{position:absolute;inset:0;border-radius:21px;pointer-events:none;z-index:20;}
.top-accent{height:2px;width:100%;}
.mc-header{display:flex;align-items:center;gap:12px;padding:clamp(10px,2.5vw,16px) clamp(12px,3vw,20px) 0;}
.mc-icon-box{width:clamp(36px,6vw,44px);height:clamp(36px,6vw,44px);flex-shrink:0;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:8px;}
.mc-icon-box svg{width:100%;height:100%;}
.mc-meta{flex:1;min-width:0;}
.mc-type-lbl{font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;font-family:Georgia,serif;display:block;margin-bottom:2px;}
.mc-title{font-size:17px;font-weight:900;line-height:1.15;letter-spacing:.3px;font-family:Georgia,'Times New Roman',serif;background:linear-gradient(135deg,#f5e8d0 0%,var(--tc) 55%,#c0a060 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:block;}
.mc-deadline{font-size:9px;color:rgba(255,180,80,.85);background:rgba(120,50,0,.28);border:1px solid rgba(245,158,11,.28);border-radius:6px;padding:2px 9px;flex-shrink:0;}
.mc-hook{margin:10px clamp(12px,3vw,20px) 0;padding:7px clamp(8px,2vw,11px);border-radius:0 8px 8px 0;}
.mc-hook p{margin:0;font-size:10px;font-style:italic;font-family:Georgia,serif;line-height:1.55;letter-spacing:.3px;}
.mc-desc{margin:10px clamp(12px,3vw,20px) 0;font-size:clamp(11px,2vw,13px);line-height:1.75;color:rgba(210,195,235,.7);}

/* ── UPLOAD (solo se renderiza cuando hay imagen) ── */
.mc-upload-wrap{margin:14px 20px 0;}
.mc-upload-zone{position:relative;border-radius:14px;overflow:hidden;border:1.5px dashed rgba(255,255,255,.1);background:rgba(0,0,0,.25);cursor:pointer;transition:border-color .25s,background .25s;animation:uploadPulse 3s ease-in-out infinite;}
.mc-upload-zone:hover{border-color:rgba(255,255,255,.28);background:rgba(255,255,255,.03);animation:none;}
.mc-upload-inner{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;gap:7px;min-height:clamp(70px,12vw,90px);}
.mc-upload-icon{opacity:.35;}
.mc-upload-lbl{font-size:10px;letter-spacing:1px;color:rgba(255,255,255,.3);font-family:Georgia,serif;font-style:italic;}
.mc-upload-sub{font-size:8px;letter-spacing:.5px;color:rgba(255,255,255,.15);}
.mc-img-loaded{width:100%;display:block;max-height:320px;object-fit:cover;object-position:center;animation:imgIn .4s ease;}
.mc-img-loaded.vertical{max-height:420px;object-position:center top;}
.mc-img-overlay{position:absolute;bottom:0;left:0;right:0;height:50%;pointer-events:none;}
.mc-img-badge{position:absolute;top:10px;left:10px;display:flex;align-items:center;gap:6px;background:rgba(0,0,0,.75);backdrop-filter:blur(8px);border-radius:18px;padding:5px 12px;pointer-events:none;}
.mc-img-badge-lbl{font-size:8px;font-weight:800;letter-spacing:2px;text-transform:uppercase;font-family:Georgia,serif;}
.mc-img-action{position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.65);border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:5px 11px;font-size:9px;color:rgba(255,255,255,.5);letter-spacing:.8px;cursor:pointer;transition:all .2s;backdrop-filter:blur(6px);}
.mc-img-action:hover{background:rgba(255,255,255,.1);color:rgba(255,255,255,.8);}

/* ── PROGRESS ── */
.mc-progress{margin:14px 20px 0;}
.mc-prog-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;}
.mc-prog-lbl{font-size:9px;letter-spacing:2px;font-weight:700;color:rgba(255,255,255,.2);text-transform:uppercase;}
.mc-prog-pct{font-size:12px;font-weight:900;font-family:Georgia,serif;}
.mc-track{position:relative;height:10px;border-radius:5px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.05);box-shadow:inset 0 2px 4px rgba(0,0,0,.6);overflow:visible;}
.mc-fill{position:absolute;left:0;top:0;bottom:0;border-radius:5px;min-width:10px;animation:bar-fill 1.4s cubic-bezier(.22,1,.36,1) both;}
.mc-orb{position:absolute;top:50%;width:16px;height:16px;border-radius:50%;transform:translate(-50%,-50%);border:1.5px solid rgba(255,255,255,.55);z-index:2;}
.mc-prog-meta{display:flex;justify-content:space-between;margin-top:5px;}
.mc-prog-meta span{font-size:9px;}

/* ── REWARDS ── */
@keyframes rw-shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
@keyframes rw-pulse{0%,100%{box-shadow:0 0 4px var(--rw-glow);}50%{box-shadow:0 0 10px var(--rw-glow),0 0 18px var(--rw-glow);}}
@keyframes coin-glow{0%,100%{box-shadow:0 4px 0 rgba(0,0,0,.9),0 0 14px rgba(212,175,55,.3),inset 0 1px 0 rgba(255,210,80,.2);}50%{box-shadow:0 4px 0 rgba(0,0,0,.9),0 0 30px rgba(212,175,55,.6),0 0 55px rgba(212,175,55,.18),inset 0 1px 0 rgba(255,210,80,.35);}}
.mc-rewards{display:flex;align-items:center;gap:clamp(6px,1.5vw,10px);padding:clamp(8px,2vw,12px) clamp(12px,3vw,20px) clamp(10px,2vw,16px);}
.rw-lbl{font-size:8px;font-weight:800;letter-spacing:3px;text-transform:uppercase;font-family:Georgia,serif;margin-right:4px;background:linear-gradient(90deg,#c8922a,#f5d06e,#d4af37);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.rw-pill{display:flex;align-items:center;gap:6px;padding:7px 16px;border-radius:8px;font-family:Georgia,serif;font-size:13px;font-weight:900;letter-spacing:1px;position:relative;overflow:hidden;cursor:default;background-size:200% auto;animation:rw-pulse 2s ease-in-out infinite;}
.rw-pill::before{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);animation:rw-shimmer 2.5s linear infinite;}
.rw-xp{--rw-glow:rgba(74,222,128,.5);color:#4ade80;background:linear-gradient(135deg,rgba(22,101,52,.6) 0%,rgba(4,30,12,.9) 50%,rgba(22,101,52,.4) 100%);border:1px solid rgba(74,222,128,.5);}
.rw-xp span{font-size:12px;font-weight:900;color:#86efac;font-family:Georgia,serif;}
.rw-coin{--rw-glow:rgba(212,175,55,.7);display:flex;align-items:center;gap:10px;padding:10px 22px;border-radius:10px;background:linear-gradient(160deg,rgba(160,80,0,.95) 0%,rgba(25,8,0,1) 50%,rgba(120,55,0,.9) 100%);border-top:1.5px solid rgba(255,200,60,.6);border-left:1.5px solid rgba(255,185,40,.4);border-right:1.5px solid rgba(0,0,0,.7);border-bottom:3px solid rgba(0,0,0,.9);animation:coin-glow 2.8s ease-in-out infinite;position:relative;overflow:hidden;cursor:default;}
.rw-coin::before{content:'';position:absolute;top:0;left:-80%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,210,80,.15),transparent);animation:rw-shimmer 3.5s linear infinite;}
.rw-coin .coin-num{font-family:Georgia,serif;font-size:clamp(16px,3vw,22px);font-weight:900;color:#f5d06e;letter-spacing:1px;text-shadow:0 0 18px rgba(255,200,50,.95),0 0 6px rgba(255,150,0,.5),0 2px 3px rgba(0,0,0,1);line-height:1;}
.rw-coin .coin-sub{font-family:Georgia,serif;font-size:8px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:rgba(212,175,55,.5);line-height:1;margin-top:2px;}

/* ── CORNERS ── */
.corn{position:absolute;width:24px;height:24px;pointer-events:none;z-index:21;}
.corn-tl{top:7px;left:7px;}
.corn-tr{top:7px;right:7px;transform:rotate(90deg);}
.corn-bl{bottom:7px;left:7px;transform:rotate(270deg);}
.corn-br{bottom:7px;right:7px;transform:rotate(180deg);}
.bot-line{height:1px;margin:0 20px;}
.empty{text-align:center;padding:60px 20px;border:1px solid rgba(255,255,255,.05);border-radius:22px;}
.divider{display:flex;align-items:center;gap:10px;margin:18px 0 22px;}
.divline{flex:1;height:1px;}
@keyframes claimPulse{
  0%,100%{box-shadow:0 0 20px rgba(167,139,250,.5),0 0 40px rgba(167,139,250,.3);transform:scale(1);}
  50%{box-shadow:0 0 35px rgba(167,139,250,.8),0 0 70px rgba(167,139,250,.5);transform:scale(1.01);}
}
#list{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;}
@media(max-width:480px){#list{grid-template-columns:1fr;gap:12px;}}

@media(min-width:900px){
  .page{max-width:1400px !important;}
  .desktop-layout{display:grid;grid-template-columns:380px 1fr;gap:24px;align-items:start;}
  .bonus-panel-wrap{position:sticky;top:80px;max-width:100% !important;margin:0 0 28px !important;padding:0 !important;}
  .bonus-panel-wrap > div{max-width:100% !important;margin:0 !important;}
  .right-panel-wrap{min-width:0;padding:0 !important;}
  #list{grid-template-columns:repeat(2,1fr) !important;gap:20px !important;}
  .filters{position:static;margin-bottom:18px !important;}
}
@media(min-width:1300px){
  .desktop-layout{grid-template-columns:420px 1fr;}
}
`;

// ── MAESTRO base64 — pega aquí tu imagen completa ───────────────────────────
const MAESTRO_SRC = "data:image/png;base64,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";

// ── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
let _csInjected = false;
function burstCoins(originEl, amount = 0) {
  if (!originEl) return;
  if (!_csInjected) {
    _csInjected = true;
    const s = document.createElement('style');
    s.textContent = `
      @keyframes coinArc {
        0%   { opacity:1; transform:translate(0,0) scale(1.1) rotate(0deg); }
        25%  { opacity:1; transform:translate(var(--bx),var(--by)) scale(1.4) rotate(200deg); }
        100% { opacity:0; transform:translate(var(--dx),var(--dy)) scale(0.1) rotate(900deg); }
      }
      @keyframes rgFloatUp {
        0%   { opacity:1; transform:translateY(0) scale(1); }
        60%  { opacity:1; transform:translateY(-36px) scale(1.15); }
        100% { opacity:0; transform:translateY(-70px) scale(0.8); }
      }
      @keyframes rgCounterPop {
        0%   { transform:scale(1);    filter:brightness(1); }
        35%  { transform:scale(1.45); filter:brightness(2.2) drop-shadow(0 0 14px #FFD700); }
        65%  { transform:scale(0.88); filter:brightness(1.5) drop-shadow(0 0 6px #FFD700); }
        100% { transform:scale(1);    filter:brightness(1); }
      }
      .rg-coin {
        position:fixed; width:24px; height:24px; border-radius:50%;
        background:radial-gradient(circle at 35% 35%,#fff5a0,#f5a623,#b8860b);
        border:2px solid #FFD700;
        box-shadow:0 0 12px #FFD700cc, inset 0 0 4px rgba(255,255,255,0.4);
        font-size:13px; display:flex; align-items:center; justify-content:center;
        pointer-events:none; z-index:9999;
        animation:coinArc var(--dur)ms cubic-bezier(.22,.68,0,1.2) var(--delay)ms both;
      }
      .rg-float-label {
        position:fixed; pointer-events:none; z-index:9999;
        font-family:'Georgia',serif; font-weight:900; font-size:20px;
        color:#FFD700;
        text-shadow:0 0 12px #FFD700, 0 0 24px rgba(255,165,0,0.6), 0 2px 4px rgba(0,0,0,0.9);
        animation:rgFloatUp 950ms ease-out both;
        white-space:nowrap;
      }
      .rg-counter-pop {
        animation:rgCounterPop 550ms cubic-bezier(.36,.07,.19,.97) both;
      }
    `;
    document.head.appendChild(s);
  }
  const or = originEl.getBoundingClientRect();
  const ox = or.left + or.width  / 2;
  const oy = or.top  + or.height / 2;
  const tEl = document.querySelector('[data-cristales-counter]');
  const tr  = tEl?.getBoundingClientRect();
  const tx  = tr ? tr.left + tr.width  / 2 : window.innerWidth  - 80;
  const ty  = tr ? tr.top  + tr.height / 2 : 20;
  if (amount > 0) {
    const lbl = document.createElement('div');
    lbl.className   = 'rg-float-label';
    lbl.textContent = `+${amount} 🪙`;
    lbl.style.cssText = `left:${ox - 36}px; top:${oy - 16}px;`;
    document.body.appendChild(lbl);
    setTimeout(() => lbl.remove(), 1100);
  }
  const COUNT = 14;
  const coins = [];
  for (let i = 0; i < COUNT; i++) {
    const delay = i * 50;
    const dur   = 720 + Math.random() * 320;
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const burst = 55 + Math.random() * 55;
    const c = document.createElement('div');
    c.className = 'rg-coin';
    c.textContent = '🪙';
    c.style.cssText = `left:${ox - 12}px;top:${oy - 12}px;--bx:${Math.cos(angle)*burst}px;--by:${Math.sin(angle)*burst}px;--dx:${tx-ox}px;--dy:${ty-oy}px;--dur:${dur};--delay:${delay};`;
    document.body.appendChild(c);
    coins.push({ el: c, end: delay + dur });
  }
  const lastMs = Math.max(...coins.map(c => c.end));
  setTimeout(() => {
    coins.forEach(c => c.el.remove());
    if (tEl) {
      tEl.classList.remove('rg-counter-pop');
      void tEl.offsetWidth;
      tEl.classList.add('rg-counter-pop');
      setTimeout(() => tEl.classList.remove('rg-counter-pop'), 600);
    }
  }, lastMs - 40);
}

const STRIPE_1MES = 'https://buy.stripe.com/5kQ3cv9pJc0ad4ydGMenS0n';
const STRIPE_3MESES = 'https://buy.stripe.com/9B614natN0hs0hM0U0enS0o';

function PropoPassModal({ onClose }) {
  const [hovUno, setHovUno] = useState(false);
  const [hovTres, setHovTres] = useState(false);
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(1,5,18,0.9)',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div onClick={e=>e.stopPropagation()} style={{position:'relative',width:'100%',maxWidth:'430px',borderRadius:'22px',background:'linear-gradient(160deg,#04091f 0%,#070d28 45%,#030814 100%)',border:'1.5px solid rgba(201,168,76,0.65)',boxShadow:'0 0 80px rgba(201,168,76,0.18)',fontFamily:"'Cinzel',Georgia,serif",overflow:'hidden'}}>
        <button onClick={onClose} style={{position:'absolute',top:14,right:14,zIndex:10,width:30,height:30,borderRadius:'50%',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.35)',color:'rgba(201,168,76,0.7)',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'inherit'}}>✕</button>
        <div style={{padding:'36px 26px 30px'}}>
          <div style={{textAlign:'center',marginBottom:22}}>
            <div style={{fontSize:48,display:'inline-block',marginBottom:10}}>👑</div>
            <div style={{fontSize:9,letterSpacing:'5px',color:'rgba(201,168,76,0.5)',textTransform:'uppercase',marginBottom:6}}>PASE DE ÉLITE DEL TEMPLO</div>
            <div style={{fontSize:24,fontWeight:900,letterSpacing:'4px',textTransform:'uppercase',background:'linear-gradient(135deg,#f0c040,#c9a84c,#ffe87a,#c9a84c,#f0c040)',backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',marginBottom:8}}>PROPO-PASS</div>
            <div style={{fontSize:11,letterSpacing:'2px',color:'rgba(0,210,230,0.7)',textTransform:'uppercase'}}>⚔ Desbloquea tu poder VIP ⚔</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:24}}>
            {[{icon:'⚡',titulo:'+10% XP',sub:'En todo el ranking'},{icon:'🪙',titulo:'+COINS',sub:'Recompensas extra'},{icon:'💎',titulo:'EFECTO VIP',sub:'Brillo exclusivo'}].map((b,i)=>(
              <div key={i} style={{padding:'12px 8px',borderRadius:12,background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.2)',textAlign:'center'}}>
                <div style={{fontSize:20,marginBottom:5}}>{b.icon}</div>
                <div style={{fontSize:9,fontWeight:900,color:'#c9a84c',letterSpacing:'1px',marginBottom:2}}>{b.titulo}</div>
                <div style={{fontSize:9,color:'rgba(200,185,240,0.45)'}}>{b.sub}</div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',fontSize:9,letterSpacing:'4px',color:'rgba(201,168,76,0.35)',marginBottom:16,textTransform:'uppercase'}}>── Elige tu plan ──</div>
          <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:20}}>
            <button onMouseEnter={()=>setHovUno(true)} onMouseLeave={()=>setHovUno(false)} onClick={()=>window.open(STRIPE_1MES,'_blank')} style={{position:'relative',width:'100%',padding:'16px 20px',borderRadius:14,background:hovUno?'linear-gradient(135deg,rgba(201,168,76,0.18),rgba(0,200,220,0.12))':'linear-gradient(135deg,rgba(201,168,76,0.08),rgba(0,180,200,0.06))',border:`1.5px solid ${hovUno?'rgba(255,230,80,0.9)':'rgba(201,168,76,0.45)'}`,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,fontFamily:"'Cinzel',Georgia,serif"}}>
              <div><div style={{fontSize:11,fontWeight:900,letterSpacing:'2px',color:'#ffe87a',textTransform:'uppercase',marginBottom:3}}>1 MES</div><div style={{fontSize:9,letterSpacing:'1.5px',color:'rgba(201,168,76,0.55)',textTransform:'uppercase'}}>Acceso completo · 30 días</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:22,fontWeight:900,color:'#ffe87a',textShadow:'0 0 20px rgba(255,220,60,0.8)',lineHeight:1}}>$9.99</div><div style={{fontSize:8,letterSpacing:'2px',color:'rgba(201,168,76,0.5)',textTransform:'uppercase',marginTop:2}}>USD</div></div>
            </button>
            <button onMouseEnter={()=>setHovTres(true)} onMouseLeave={()=>setHovTres(false)} onClick={()=>window.open(STRIPE_3MESES,'_blank')} style={{position:'relative',width:'100%',padding:'16px 20px',borderRadius:14,background:hovTres?'linear-gradient(135deg,rgba(0,200,220,0.18),rgba(0,150,200,0.14))':'linear-gradient(135deg,rgba(0,180,200,0.08),rgba(0,140,180,0.06))',border:`1.5px solid ${hovTres?'rgba(0,230,250,0.9)':'rgba(0,200,220,0.45)'}`,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,fontFamily:"'Cinzel',Georgia,serif"}}>
              <div style={{position:'absolute',top:8,right:8,background:'linear-gradient(135deg,#00c8dc,#0090b0)',color:'#001a26',fontSize:7,fontWeight:900,letterSpacing:'1.5px',padding:'2px 8px',borderRadius:20,textTransform:'uppercase',zIndex:2}}>✦ MEJOR VALOR</div>
              <div><div style={{fontSize:11,fontWeight:900,letterSpacing:'2px',color:'#4fc3f7',textTransform:'uppercase',marginBottom:3}}>3 MESES</div><div style={{fontSize:9,letterSpacing:'1.5px',color:'rgba(79,195,247,0.55)',textTransform:'uppercase'}}>Acceso completo · 90 días</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:22,fontWeight:900,color:'#4fc3f7',textShadow:'0 0 20px rgba(0,200,220,0.8)',lineHeight:1}}>$21.90</div><div style={{fontSize:8,letterSpacing:'2px',color:'rgba(79,195,247,0.5)',textTransform:'uppercase',marginTop:2}}>USD · $7.30/mes</div></div>
            </button>
          </div>
          <div style={{textAlign:'center',fontSize:8,letterSpacing:'2px',color:'rgba(201,168,76,0.3)',textTransform:'uppercase'}}>⚔ Templo del Propósito · Cancela cuando quieras ⚔</div>
        </div>
      </div>
    </div>
  );
}

export default function TemploMisiones() {
const [showPropoPassModal, setShowPropoPassModal] = useState(false);
useEffect(() => {
  const h = () => setShowPropoPassModal(true);
  window.addEventListener('open-propopass-modal', h);
  return () => window.removeEventListener('open-propopass-modal', h);
}, []);
const { user } = useAuthStore();
const profile  = useAuthStore(s => s.profile);
const isVip = useAuthStore(s => s.isVip());
const addCristales = usePlayerStore(s => s.addCristales);
const addXP        = usePlayerStore(s => s.addXP);
const sidebarOpen  = useUIStore(s => s.sidebarOpen);
  const [missionsRaw, setMissionsRaw] = useState([]);
const [loading, setLoading] = useState(true);
  const MISSIONS = (missionsRaw || []).map(m => ({
    id: m.id,
    type: { daily:'DIARIA', weekly:'SEMANAL', epic:'EPICA' }[m.type] || 'NORMAL',
    title: m.title,
    desc: m.description,
    hook: HOOKS[(m.type || 'NORMAL').toUpperCase()] || HOOKS.NORMAL,
    progress: m.user_progress ?? m.progress ?? 0,
    goal: m.goal || 1,
    xp: m.xp_reward || 0,
    coins: m.coin_reward || 0,
    deadline: m.end_date || m.expires_at || null,
image_url: m.image_url || null,
    platform: m.platform || 'store',
    event_type: m.event_type || null,
    user_status: m.user_status ?? 'locked',
    reward_claimed: m.reward_claimed ?? false,
    percent: m.percent ?? 0,
  }));

  const [missionImages, setMissionImages] = useState({});

  const [currentFilter, setCurrentFilter] = useState("TODAS");
  const [streakDays, setStreakDays] = useState(0);
const [bonusConfigs, setBonusConfigs] = useState([]);
const [bonusClaims, setBonusClaims]   = useState({});
const [claimingId, setClaimingId]     = useState(null);
const [coinAnimId, setCoinAnimId]     = useState(null);
const [bonusMsg, setBonusMsg]         = useState({});
const [countdowns, setCountdowns]       = useState({});
const [claimedMissions, setClaimedMissions] = useState({});
const [claimingMissionId, setClaimingMissionId] = useState(null);
const [missionMsg, setMissionMsg]       = useState({});
  const soundedIds = useRef({});
const fileRefs   = useRef({});
const ptcsRef    = useRef(null);
const btnRefs    = useRef({});   // ← AÑADE ESTA


  useEffect(() => {
    const container = document.body;
    const pal = ["rgba(251,191,36,", "rgba(167,139,250,", "rgba(96,165,250,"];
    for (let i = 0; i < 22; i++) {
      const d = document.createElement("div");
      const s = Math.random() * 3 + 1;
      const a = 0.1 + Math.random() * .2;
      d.className = "ptc";
      d.style.cssText = `left:${Math.random()*95}%;top:${Math.random()*90}%;width:${s}px;height:${s}px;background:${pal[i%3]+a});box-shadow:0 0 ${s*2.5}px ${pal[i%3]+a});animation-duration:${4+Math.random()*5}s;animation-delay:${Math.random()*4}s;`;
      container.appendChild(d);
    }
    return () => {
      container.querySelectorAll('.ptc').forEach(p => p.remove());
    };
  }, []);

  // Sonidos al montar y en cada cambio de filtro — igual que el HTML
  useEffect(() => {
    MISSIONS.forEach(m => {
      const pct = Math.min(100, Math.round((m.progress / m.goal) * 100));
      if (pct >= 100 && !soundedIds.current[m.id]) {
        soundedIds.current[m.id] = true;
        playDoneSound(m.type);
      }
    });
  }, [currentFilter]);

  useEffect(() => {
    if (!user?.id) return;
    missionsService.checkAndUpdateStreak(user.id).then(async days => {
  setStreakDays(days);
  if (days >= 7) missionsService.trackEvent(user.id, 'week_played');

  // AHORA cargar misiones — streak ya está guardado en BD
  setLoading(true);
  const data = await missionsService.getMissionsWithProgress(user.id);
  setMissionsRaw(data ?? []);
  setLoading(false);
});
    Promise.all([
      missionsService.getBonusConfigs(),
      missionsService.getUserBonusClaims(user.id),
      missionsService.getUserMissions(user.id),
    ]).then(([configs, claims, userMissions]) => {
      setBonusConfigs(configs);
      setBonusClaims(claims);
      const claimed = {};
      (userMissions || []).forEach(um => {
        if (um.reward_claimed) claimed[um.mission_id] = true;
      });
      setClaimedMissions(claimed);
    });
  }, [user?.id]);

  useEffect(() => {
    const COOLDOWN = { daily: 86400000, weekly: 604800000, monthly: 2592000000, one_time: Infinity };
    const tick = () => {
      const now = Date.now();
      const next = {};
      bonusConfigs.forEach(cfg => {
        const last = bonusClaims[cfg.id];
        if (!last) return;
        const ms = COOLDOWN[cfg.type] ?? 86400000;
        if (ms === Infinity) { next[cfg.id] = -1; return; }
        const remaining = ms - (now - new Date(last).getTime());
        next[cfg.id] = remaining > 0 ? remaining : 0;
      });
      setCountdowns(next);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [bonusConfigs, bonusClaims]);

  // Upload handlers
  const triggerUpload = (id) => {
    if (fileRefs.current[id]) fileRefs.current[id].click();
  };

  const handleFile = (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target.result;
      const img = new Image();
      img.onload = () => {
        setMissionImages(prev => ({
          ...prev,
          [id]: { src, orient: img.naturalHeight > img.naturalWidth ? "vertical" : "horizontal" },
        }));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleClaimBonus = async (config) => {
    if (claimingId || !user?.id) return;
    setClaimingId(config.id);
    try {
      const { coins, xp } = await missionsService.claimBonus(
        user.id, config, bonusClaims[config.id]
      );
      if (coins > 0) {
  await addCristales(coins);
 burstCoins(btnRefs.current[config.id], coins);  // 🪙 animación
}
      if (xp    > 0) await addXP(xp);
      setBonusClaims(prev => ({ ...prev, [config.id]: new Date().toISOString() }));
      setCoinAnimId(config.id);
      setBonusMsg(prev => ({ ...prev, [config.id]: `+${coins} 🪙  +${xp} XP` }));
      playDoneSound('DIARIA');
      setTimeout(() => {
        setCoinAnimId(null);
        setBonusMsg(prev => { const n = {...prev}; delete n[config.id]; return n; });
      }, 3000);
    } catch (e) {
      setBonusMsg(prev => ({ ...prev, [config.id]: e.message }));
      setTimeout(() => setBonusMsg(prev => { const n={...prev}; delete n[config.id]; return n; }), 3000);
    } finally {
      setClaimingId(null);
    }
  };

  const handleClaimMission = async (m) => {
    if (claimingMissionId || !user?.id || claimedMissions[m.id]) return;
    setClaimingMissionId(m.id);
    try {
      const { xp_gained, coins_gained } = await missionsService.claimMission(user.id, {
        id: m.id, xp_reward: m.xp, coin_reward: m.coins,
      });
      if (xp_gained    > 0) await addXP(xp_gained);
      if (coins_gained > 0) await addCristales(coins_gained);
      setClaimedMissions(prev => ({ ...prev, [m.id]: true }));
      setMissionMsg(prev => ({ ...prev, [m.id]: `+${coins_gained} 🪙  +${xp_gained} XP ¡Reclamado!` }));
      playDoneSound(m.type);
      setTimeout(() => setMissionMsg(prev => { const n={...prev}; delete n[m.id]; return n; }), 3500);
    } catch (e) {
      setMissionMsg(prev => ({ ...prev, [m.id]: e.message }));
      setTimeout(() => setMissionMsg(prev => { const n={...prev}; delete n[m.id]; return n; }), 3000);
    } finally {
      setClaimingMissionId(null);
    }
  };

  const removeImg = (e, id) => {
    e.stopPropagation();
    setMissionImages(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  // Stats
  const totalXP    = MISSIONS.reduce((s, m) => s + m.xp, 0);
const totalCoins = MISSIONS.reduce((s, m) => s + (m.coins || 0), 0);
  const baseMissions = currentFilter === "TODAS"
  ? MISSIONS
  : currentFilter === "TEMPLO"
    ? MISSIONS.filter(m => m.platform === 'templo')
    : currentFilter === "Propo-Tienda"
      ? MISSIONS.filter(m => m.platform === 'store')
      : MISSIONS.filter(m => m.type === currentFilter);
const filtered = [...baseMissions].sort((a, b) => {
  const aReady = Math.min(100, Math.round((a.progress / a.goal) * 100)) >= 100 && !claimedMissions[a.id];
  const bReady = Math.min(100, Math.round((b.progress / b.goal) * 100)) >= 100 && !claimedMissions[b.id];
  const aClaimed = !!claimedMissions[a.id];
  const bClaimed = !!claimedMissions[b.id];
  if (aReady && !bReady) return -1;
  if (!aReady && bReady) return 1;
  if (aClaimed && !bClaimed) return 1;
  if (!aClaimed && bClaimed) return -1;
  return 0;
});

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#050215'}}>
      <p style={{fontFamily:'Georgia,serif',color:'rgba(212,175,55,0.6)',letterSpacing:3}}>Invocando misiones del Templo…</p>
    </div>
  );

  // Estilos de botón e ícono — idéntico a setFilter() del HTML
  const btnStyle = (f) => {
    const c      = CFG[f];
    const active = f === currentFilter;
    // Activo con color de categoría
    if (active && c) return {
      transform: "translateY(2px) scale(.98)",
      background: `linear-gradient(160deg,${c.bg} 0%,rgba(8,2,18,.98) 100%)`,
      color: c.color,
      borderTop: `1.5px solid ${c.border}`, borderLeft: `1.5px solid ${c.border}`,
      borderRight: "1.5px solid rgba(0,0,0,.5)", borderBottom: "1.5px solid rgba(0,0,0,.6)",
      boxShadow: `0 2px 0 rgba(0,0,0,.7),inset 0 2px 4px rgba(0,0,0,.35),0 0 18px ${c.glow}66,0 0 40px ${c.glow}22`,
      textShadow: `0 0 14px ${c.glow},0 0 6px ${c.color}88,0 1px 2px rgba(0,0,0,.9)`,
      filter: "brightness(1.1)",
    };
    // Activo sin color (TODAS)
    if (active) return {
      transform: "translateY(2px) scale(.98)",
      background: "linear-gradient(160deg,rgba(100,70,160,.9) 0%,rgba(50,25,90,.98) 100%)",
      color: "#e8d8ff",
      borderTop: "1.5px solid rgba(220,190,255,.4)", borderLeft: "1.5px solid rgba(200,170,255,.3)",
      borderRight: "1.5px solid rgba(0,0,0,.5)", borderBottom: "1.5px solid rgba(0,0,0,.6)",
      boxShadow: "0 2px 0 rgba(0,0,0,.7),inset 0 2px 4px rgba(0,0,0,.3),0 0 22px rgba(180,130,255,.45),0 0 50px rgba(160,100,255,.18)",
      textShadow: "0 0 14px rgba(220,180,255,.9),0 1px 2px rgba(0,0,0,.9)",
      filter: "brightness(1.1)",
    };
    // Inactivo, pero filtro activo es TODAS → modo preview con color propio
    if (currentFilter === "TODAS" && c) return {
      background: `linear-gradient(160deg,${c.bg} 0%,rgba(12,4,24,.97) 100%)`,
      color: `${c.color}cc`,
      borderTop: `1.5px solid ${c.border}`, borderLeft: `1.5px solid ${c.border}88`,
      borderRight: "1.5px solid rgba(0,0,0,.45)", borderBottom: "1.5px solid rgba(0,0,0,.5)",
      boxShadow: `0 5px 0 rgba(0,0,0,.65),0 0 12px ${c.glow}33,inset 0 1px 0 rgba(255,255,255,.07)`,
      textShadow: `0 0 8px ${c.glow}55`,
    };
    // Inactivo con otro filtro seleccionado — estilo apagado
    return {
      transform: "none",
      filter: "none",
      textShadow: "none",
      background: "linear-gradient(170deg,rgba(55,35,85,.95) 0%,rgba(28,14,50,.98) 100%)",
      borderTop: "1.5px solid rgba(160,130,220,.18)",
      borderLeft: "1.5px solid rgba(140,110,200,.12)",
      borderRight: "1.5px solid rgba(0,0,0,.45)",
      borderBottom: "1.5px solid rgba(0,0,0,.5)",
      boxShadow: "0 5px 0 rgba(0,0,0,.7),0 6px 8px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.06)",
      color: c ? `${c.color}50` : "rgba(190,170,230,.38)",
    };
  };

  // Estilos del ícono SVG dentro de cada botón — idéntico al HTML
  const iconStyle = (f) => {
    const c      = CFG[f];
    const active = f === currentFilter;
    if (active && c)  return { opacity: 1, filter: `drop-shadow(0 0 4px ${c.color})` };
    if (active)       return { opacity: 1, filter: "drop-shadow(0 0 4px rgba(220,180,255,.8))" };
    if (currentFilter === "TODAS" && c) return { opacity: .75, filter: `drop-shadow(0 0 3px ${c.color}88)` };
    return { opacity: .4, filter: "none" };
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {showPropoPassModal && <PropoPassModal onClose={() => setShowPropoPassModal(false)} />}

      {/* Nebulosa fija */}
      <div className="nebula-fixed">
        <div style={{position:"absolute",top:"-15%",left:"50%",transform:"translateX(-50%)",width:"150%",height:"60%",background:"radial-gradient(ellipse at 50% 30%,rgba(75,28,170,.2) 0%,rgba(35,8,90,.08) 40%,transparent 70%)",animation:"nebula 5s ease-in-out infinite"}}/>
        <div style={{position:"absolute",bottom:"12%",left:"8%",width:280,height:280,background:"radial-gradient(circle,rgba(25,70,170,.08) 0%,transparent 70%)",animation:"nebula 7s ease-in-out 2s infinite"}}/>
        <div style={{position:"absolute",bottom:"22%",right:"4%",width:240,height:240,background:"radial-gradient(circle,rgba(110,35,190,.08) 0%,transparent 70%)",animation:"nebula 6s ease-in-out 1s infinite"}}/>
      </div>

      {/* Partículas */}
      <div ref={ptcsRef} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1}}/>

      <div className="page">

        {/* ── HERO ── */}
        <div className="hero">
          <div className="hero-top-band"/>
          <div className="hero-inner">

            {/* Maestro */}
            <div className="maestro-wrap">
              <div className="ki-ring"/>
<div className="ki-wave"/>
<div className="ki-wave-2"/>
              <div className="ki-aura-outer"/>
              <div className="ki-aura-mid"/>

              {/* Rayos */}
              <div className="ki-bolt" style={{left:"-2%",top:"28%",animationDelay:"0s"}}>
                <svg width="18" height="34" viewBox="0 0 18 34" fill="none">
                  <path d="M12 0 L5 15 L10 15 L3 34 L16 13 L10 13 Z" fill="rgba(180,110,255,.85)" stroke="rgba(255,255,255,.25)" strokeWidth=".4"/>
                </svg>
              </div>
              <div className="ki-bolt" style={{right:"0%",top:"18%",animationDelay:".8s",transform:"scaleX(-1)"}}>
                <svg width="14" height="26" viewBox="0 0 14 26" fill="none">
                  <path d="M9 0 L3 11 L8 11 L2 26 L12 10 L7 10 Z" fill="rgba(250,190,60,.8)" stroke="rgba(255,255,255,.2)" strokeWidth=".4"/>
                </svg>
              </div>
              <div className="ki-bolt" style={{left:"8%",top:"52%",animationDelay:"1.5s"}}>
                <svg width="10" height="19" viewBox="0 0 10 19" fill="none">
                  <path d="M7 0 L2 8 L6 8 L1 19 L9 7 L5 7 Z" fill="rgba(200,130,255,.75)"/>
                </svg>
              </div>

              {/* Partículas ki */}
              <div className="ki-particle" style={{left:"18%",bottom:"18%",width:3,height:3,background:"rgba(190,110,255,.9)",boxShadow:"0 0 6px rgba(160,70,255,.7)","--kx":"-4px",animationDelay:"0s",animationDuration:"2.2s"}}/>
              <div className="ki-particle" style={{left:"68%",bottom:"22%",width:2,height:2,background:"rgba(255,190,60,.85)",boxShadow:"0 0 5px rgba(240,170,40,.6)","--kx":"5px",animationDelay:".9s",animationDuration:"2.5s"}}/>
              <div className="ki-particle" style={{left:"42%",bottom:"6%",width:3,height:3,background:"rgba(200,130,255,.8)",boxShadow:"0 0 7px rgba(170,90,255,.6)","--kx":"2px",animationDelay:"1.7s",animationDuration:"2s"}}/>

              <img className="maestro-svg" src={MAESTRO_SRC} alt="Maestro del Templo"/>
            </div>

            {/* Texto hero */}
            <div className="hero-text">
              <span className="hero-eyebrow">✦ Templo del Propósito ✦</span>
              <div className="hero-title">
                Retos del<br/>
                <span style={{fontSize:".72em",letterSpacing:"3px",opacity:.85}}>Templo</span>
              </div>
              <div className="hero-sep"/>
              <span className="hero-quote">
                "“El objetivo no es completar misiones.<br/>
                Es convertirte en alguien<br/>
                imposible de detener.”
              </span>
              <div className="hero-stats">
                <div className="stat-pill" style={{background:"rgba(88,28,135,.2)",border:"1px solid rgba(139,92,246,.28)",boxShadow:"0 0 14px rgba(139,92,246,.08)"}}>
                  <span className="stat-val" style={{color:"#c4b5fd",textShadow:"0 0 14px rgba(167,139,250,.5)"}}>{MISSIONS.length}</span>
                  <span className="stat-lbl">Retos</span>
                </div>
                <div className="stat-pill" style={{background:"rgba(22,101,52,.18)",border:"1px solid rgba(34,197,94,.22)",boxShadow:"0 0 14px rgba(34,197,94,.07)"}}>
  <span className="stat-val" style={{color:"#86efac",textShadow:"0 0 14px rgba(74,222,128,.45)"}}>{totalXP}</span>
  <span className="stat-lbl">XP Posible</span>
</div>
<div className="stat-pill" style={{background:"rgba(160,80,0,.18)",border:"1px solid rgba(212,175,55,.4)",boxShadow:"0 0 18px rgba(212,175,55,.15)"}}>
  <span className="stat-val" style={{color:"#f5d06e",textShadow:"0 0 18px rgba(212,175,55,.9)"}}>🪙 {totalCoins.toLocaleString()}</span>
  <span className="stat-lbl">PropoCoins</span>
</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── STREAK + BONUS PANEL ── */}
        <div style={{ maxWidth: 720, margin: '0 auto 28px', padding: '0 16px' }}>
          <div style={{
            position: 'relative', borderRadius: 22, overflow: 'hidden',
            background: 'linear-gradient(145deg, rgba(40,18,4,.98) 0%, rgba(10,4,20,1) 55%, rgba(30,10,0,.97) 100%)',
            border: '1px solid rgba(212,175,55,.3)',
            boxShadow: '0 0 40px rgba(212,175,55,.08), 0 8px 32px rgba(0,0,0,.6)',
          }}>
            {/* Top accent */}
            <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,.4) 20%,rgba(255,220,80,.8) 50%,rgba(212,175,55,.4) 80%,transparent)' }}/>

            <div style={{ display: 'flex', gap: 0, minWidth: 0, overflow: 'hidden' }}>

              {/* ── IZQUIERDA: Streak ── */}
              <div style={{
                padding: 'clamp(12px,2vw,20px) clamp(12px,2.5vw,24px)',
                display: 'flex', alignItems: 'center', gap: 12,
                borderRight: '1px solid rgba(212,175,55,.12)',
                flexShrink: 0, flexBasis: 'clamp(120px,28%,180px)',
              }}>
                <div style={{ fontSize: 42, filter: 'drop-shadow(0 0 14px rgba(251,191,36,.9))', flexShrink: 0 }}>🔥</div>
                <div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: 10, letterSpacing: 3, color: 'rgba(251,191,36,.55)', textTransform: 'uppercase', marginBottom: 2 }}>Racha Diaria</div>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: 30, fontWeight: 900, color: '#fde68a', textShadow: '0 0 22px rgba(251,191,36,.85)', lineHeight: 1 }}>
                    {streakDays} <span style={{ fontSize: 12, opacity: .65, fontWeight: 400 }}>días seguidos</span>
                  </div>
                  {streakDays >= 7 && <div style={{ fontFamily: 'Georgia,serif', fontSize: 8, color: '#4ade80', letterSpacing: 2, marginTop: 3 }}>✅ MAPA 02 DESBLOQUEADO</div>}
                </div>
              </div>

              {/* ── DERECHA: Todos los bonus ── */}
              <div style={{ flex: 1, minWidth: 0, padding: 'clamp(10px,2vw,16px) clamp(10px,2.5vw,18px)', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>

                {/* Label sección gratis */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(255,255,255,.06),transparent)' }}/>
                  <span style={{ fontFamily: 'Georgia,serif', fontSize: 9, letterSpacing: 3, fontWeight: 900, color: '#4ade80', textTransform: 'uppercase', background: 'linear-gradient(135deg,rgba(22,101,52,.7) 0%,rgba(4,30,12,.95) 50%,rgba(22,101,52,.5) 100%)', borderTop: '1px solid rgba(74,222,128,.6)', borderLeft: '1px solid rgba(74,222,128,.4)', borderRight: '1px solid rgba(0,0,0,.5)', borderBottom: '2px solid rgba(0,0,0,.7)', borderRadius: 8, padding: '5px 16px', boxShadow: '0 0 16px rgba(74,222,128,.3),0 0 32px rgba(34,197,94,.12),inset 0 1px 0 rgba(255,255,255,.1)', textShadow: '0 0 12px rgba(74,222,128,.9),0 1px 2px rgba(0,0,0,1)', whiteSpace: 'nowrap' }}>⚡ Canjea Aquí — Gratis</span>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.06))' }}/>
                </div>

                {/* Bonos gratis dinámicos */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                  {bonusConfigs.filter(config => !config.is_vip).map(config => {
                    const ms = countdowns[config.id];
                    const claimed = bonusClaims[config.id];
                    const ready = !claimed || ms === 0;
                    const forever = ms === -1;
                    const fmt = (ms) => {
                      const s = Math.floor(ms/1000);
                      const d = Math.floor(s/86400);
                      const h = Math.floor((s%86400)/3600);
                      const m = Math.floor((s%3600)/60);
                      const sec = s%60;
                      if (d > 0) return `${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
                      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
                    };
                    return (
                      <div key={config.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <button
                          ref={el => btnRefs.current[config.id] = el}
                          onClick={() => ready && !forever && handleClaimBonus(config)}
                          disabled={!!claimingId || !ready || forever}
                          style={{
                            width: '100%', padding: '0', borderRadius: 16, cursor: (ready && !forever) ? 'pointer' : 'not-allowed',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            position: 'relative', overflow: 'hidden', border: 'none', outline: 'none',
                            background: 'transparent',
                            transition: 'transform .15s cubic-bezier(.34,1.56,.64,1), filter .15s',
                          }}
                          onMouseEnter={e => { if (ready && !forever) { e.currentTarget.style.transform='translateY(-4px) scale(1.04)'; e.currentTarget.style.filter='brightness(1.25)'; }}}
                          onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.filter='none'; }}
                        >
                          {ready && !forever ? (
                            <div style={{
                              width:'100%', padding:'16px 10px 14px',
                              borderRadius:16, position:'relative', overflow:'hidden',
                              background:'linear-gradient(160deg,rgba(160,80,0,.98) 0%,rgba(25,8,0,1) 50%,rgba(120,55,0,.96) 100%)',
                              borderTop:'2px solid rgba(255,220,80,.85)',
                              borderLeft:'2px solid rgba(255,190,50,.5)',
                              borderRight:'1.5px solid rgba(0,0,0,.7)',
                              borderBottom:'4px solid rgba(0,0,0,.95)',
                              boxShadow:'0 0 35px rgba(212,175,55,.55), 0 0 70px rgba(212,175,55,.25), 0 0 120px rgba(212,175,55,.1), inset 0 1px 0 rgba(255,215,90,.25)',
                              animation:'vip-glow-pulse 2s ease-in-out infinite',
                              display:'flex', flexDirection:'column', alignItems:'center', gap:8,
                            }}>
                              {/* Shimmer sweep */}
                              <div style={{position:'absolute',top:0,left:'-120%',width:'60%',height:'100%',background:'linear-gradient(90deg,transparent,rgba(255,215,90,.3),rgba(255,255,255,.1),transparent)',animation:'vip-shimmer 2.2s linear infinite',pointerEvents:'none'}}/>
                              {/* Ray top */}
                              <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:'1.5px',height:'50%',background:'linear-gradient(180deg,rgba(255,215,80,.8),transparent)',pointerEvents:'none'}}/>
                              {/* Icon */}
                              <span style={{fontSize:30,filter:'drop-shadow(0 0 16px rgba(212,175,55,1)) drop-shadow(0 0 32px rgba(255,165,0,.7))',animation:'vip-icon-float 2.5s ease-in-out infinite',lineHeight:1}}>{config.icon}</span>
                              {/* Title */}
                              <span style={{
                                fontFamily:'Georgia,serif', fontSize:11, letterSpacing:3,
                                textTransform:'uppercase', fontWeight:900,
                                background:'linear-gradient(90deg,#c8920a,#fff5a0,#f5d06e,#fff5a0,#c8920a)',
                                backgroundSize:'200% auto', animation:'vip-shimmer 2s linear infinite',
                                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                                textAlign:'center',
                              }}>{config.title}</span>
                              {/* Reward pills */}
                              <div style={{display:'flex',gap:5,flexWrap:'wrap',justifyContent:'center'}}>
                                {config.xp > 0 && <span style={{fontFamily:'Georgia,serif',fontSize:10,fontWeight:900,color:'#86efac',background:'rgba(22,101,52,.4)',border:'1px solid rgba(74,222,128,.5)',borderRadius:6,padding:'3px 10px',textShadow:'0 0 10px rgba(74,222,128,.8)'}}>+{config.xp} XP</span>}
                                {config.coins > 0 && <span style={{fontFamily:'Georgia,serif',fontSize:10,fontWeight:900,color:'#f5d06e',background:'rgba(120,60,0,.4)',border:'1px solid rgba(212,175,55,.5)',borderRadius:6,padding:'3px 10px',textShadow:'0 0 10px rgba(212,175,55,.8)'}}>+{config.coins} 🪙</span>}
                              </div>
                              {/* CTA pill */}
                              <div style={{
                                display:'flex', alignItems:'center', gap:5,
                                padding:'6px 18px', borderRadius:999,
                                background:'linear-gradient(135deg,rgba(212,175,55,.3),rgba(255,220,80,.15))',
                                border:'1.5px solid rgba(212,175,55,.7)',
                                boxShadow:'0 0 16px rgba(212,175,55,.4), inset 0 1px 0 rgba(255,255,255,.15)',
                              }}>
                                <span style={{fontSize:12}}>⚡</span>
                                <span style={{fontFamily:'Georgia,serif',fontSize:9,fontWeight:900,letterSpacing:3,color:'#fff5a0',textTransform:'uppercase',textShadow:'0 0 12px rgba(255,215,80,.9)'}}>¡Canjear!</span>
                              </div>
                            </div>
                          ) : forever ? (
                            <div style={{
                              width:'100%', padding:'14px 10px',
                              borderRadius:16, background:'rgba(255,255,255,.03)',
                              border:'1px solid rgba(255,255,255,.08)',
                              display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                            }}>
                              <span style={{fontSize:22,opacity:.4}}>{config.icon}</span>
                              <span style={{fontFamily:'Georgia,serif',fontSize:9,letterSpacing:2,color:'rgba(255,255,255,.25)',textTransform:'uppercase'}}>{config.title}</span>
                              <span style={{fontFamily:'Georgia,serif',fontSize:8,color:'rgba(74,222,128,.5)',letterSpacing:1,background:'rgba(74,222,128,.06)',border:'1px solid rgba(74,222,128,.15)',borderRadius:5,padding:'2px 9px'}}>✓ Reclamado</span>
                            </div>
                          ) : (
                            <div style={{
                              width:'100%', padding:'14px 10px',
                              borderRadius:16,
                              background:'linear-gradient(160deg,rgba(40,20,0,.95),rgba(12,4,0,1),rgba(30,12,0,.9))',
                              border:'1px solid rgba(212,175,55,.2)',
                              display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                            }}>
                              <span style={{fontSize:22,opacity:.5,filter:'grayscale(.5)'}}>{config.icon}</span>
                              <span style={{fontFamily:'Georgia,serif',fontSize:9,letterSpacing:2,color:'rgba(212,175,55,.4)',textTransform:'uppercase',fontWeight:900}}>{config.title}</span>
                              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                                <span style={{fontFamily:'Georgia,serif',fontSize:7,letterSpacing:2,color:'rgba(74,222,128,.5)',textTransform:'uppercase'}}>Canjea en</span>
                                <span style={{fontFamily:'Georgia,serif',fontSize:12,fontWeight:900,color:'rgba(74,222,128,.85)',letterSpacing:1,textShadow:'0 0 12px rgba(74,222,128,.6)'}}>⏱ {fmt(ms)}</span>
                              </div>
                            </div>
                          )}
                        </button>
                        {bonusMsg[config.id] && (
                          <span style={{fontFamily:'Georgia,serif',fontSize:9,color:'#4ade80',textAlign:'center',marginTop:4}}>{bonusMsg[config.id]}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── SEPARADOR PROPOPASS ── */}
                <div style={{ margin: '10px 0 0', borderRadius: 14, overflow: 'hidden', border: '1.5px solid rgba(212,175,55,.5)', background: 'linear-gradient(145deg,rgba(50,22,0,.99),rgba(15,5,0,1),rgba(40,15,0,.98))', boxShadow: '0 0 40px rgba(212,175,55,.2), 0 0 80px rgba(212,175,55,.08), inset 0 1px 0 rgba(255,210,80,.15), 0 8px 32px rgba(0,0,0,.8)' }}>
                  {/* barra top shimmer */}
                  <div style={{ height: 3, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,.4) 15%,rgba(255,220,80,1) 50%,rgba(212,175,55,.4) 85%,transparent)', boxShadow:'0 0 12px rgba(255,210,60,.8)' }}/>
                  {/* contenido botones */}
                  <div style={{ padding: '0 12px 16px' }}>

                {/* ── PROPOPASS SECTION ── */}
                {(() => {
                  const COOLDOWN_MAP = { daily:86400000, weekly:604800000, monthly:2592000000, one_time:Infinity };
                  const VIP_BONUSES = bonusConfigs
                    .filter(b => b.is_vip)
                    .map(b => ({
                      id: b.id,
                      icon: b.icon || '⚡',
                      xp: b.xp || 0,
                      coins: b.coins || 0,
                      label: b.title,
                      cooldown: COOLDOWN_MAP[b.type] ?? 86400000,
                      desc: (() => {
                        const parts = [];
                        if (b.xp > 0) parts.push(`+${b.xp} XP`);
                        if (b.coins > 0) parts.push(`+${b.coins} 🪙`);
                        return parts.length ? parts.join(' · ') : (b.description || '');
                      })(),
                    }));
                  const fmt = ms => {
                    const s = Math.floor(ms/1000);
                    const d = Math.floor(s/86400);
                    const h = Math.floor((s%86400)/3600);
                    const m = Math.floor((s%3600)/60);
                    const sec = s%60;
                    if (d > 0) return `${d}d ${String(h).padStart(2,'0')}h`;
                    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
                  };
                  return (
                    <>
                      {/* Header PropoPass — se ve siempre */}
                      <div className="vip-section-header" style={{cursor:'pointer'}} onClick={() => window.dispatchEvent(new CustomEvent('open-propopass-modal'))}>
                        <div style={{position:'absolute',top:0,left:'-80%',width:'40%',height:'100%',background:'linear-gradient(90deg,transparent,rgba(255,215,80,.22),rgba(255,255,255,.08),transparent)',animation:'vip-shimmer 2.8s linear infinite',pointerEvents:'none',zIndex:5}}/>
                        <div className="vip-sh-scan"/>
                        <div className="vip-sh-left" style={{minWidth:0, flex:'1 1 0', overflow:'hidden'}}>
                          <span className="vip-sh-crown">👑</span>
                          <div className="vip-sh-texts" style={{minWidth:0,overflow:'hidden',width:'100%'}}>
                            <span style={{fontSize:11,letterSpacing:4,display:'block',fontFamily:'Georgia,serif',fontWeight:900,color:'#f5d06e',textShadow:'0 0 14px rgba(212,175,55,.9),0 0 28px rgba(255,180,30,.5)',textTransform:'uppercase',marginBottom:2}}>✦ Membresía ✦</span>
                            <span className="vip-sh-name" style={{fontSize:'clamp(14px,3.5vw,18px)',letterSpacing:'clamp(1px,0.4vw,2px)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',display:'block',maxWidth:'100%'}}>PROPO-PASS</span>
                          </div>
                        </div>
                        {(() => {
                          const dailyXP    = VIP_BONUSES.filter(b=>b.cooldown===86400000).reduce((s,b)=>s+b.xp,0);
                          const dailyCoins = VIP_BONUSES.filter(b=>b.cooldown===86400000).reduce((s,b)=>s+b.coins,0);
                          const weeklyXP   = VIP_BONUSES.filter(b=>b.cooldown===604800000).reduce((s,b)=>s+b.xp,0)   + dailyXP*7;
                          const weeklyCoins= VIP_BONUSES.filter(b=>b.cooldown===604800000).reduce((s,b)=>s+b.coins,0) + dailyCoins*7;
                          const pills = [];
                          if (weeklyXP    > 0) pills.push(<span key="wxp"    className="vip-perk-pill">+{weeklyXP} XP/sem</span>);
                          if (weeklyCoins > 0) pills.push(<span key="wcoins" className="vip-perk-pill">+{weeklyCoins}🪙/sem</span>);
                          if (dailyXP    > 0) pills.push(<span key="dxp"    className="vip-perk-pill">+{dailyXP} XP/día</span>);
                          if (dailyCoins > 0) pills.push(<span key="dcoins" className="vip-perk-pill">+{dailyCoins}🪙/día</span>);
                          return (
                            <>
                              {!isVip && (
                                <div className="vip-sh-right">
                                  <span className="vip-sh-loss">✦ Podrías ganar:</span>
                                  <div className="vip-sh-perks">{pills}</div>
                                </div>
                              )}
                              {isVip && (
                                <div className="vip-sh-right">
                                  <span style={{fontFamily:'Georgia,serif',fontSize:9,color:'rgba(74,222,128,.8)',letterSpacing:1}}>✅ Activo</span>
                                  <span style={{fontFamily:'Georgia,serif',fontSize:9,color:'rgba(212,175,55,.8)',letterSpacing:1,fontWeight:900}}>✦ Tus recompensas:</span>
                                  <div className="vip-sh-perks">{pills}</div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {/* Los 3 botones */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(6px,2vw,12px)', minWidth: 0, padding: '4px 0' }}>
                        {VIP_BONUSES.map(b => {
                          // Usar la misma clave y lógica que los bonos gratis para persistencia real
                          const ms = countdowns[b.id];
                          const claimed = bonusClaims[b.id];
                          const ready = !claimed || ms === 0;
                          const remaining = (ms > 0) ? ms : 0;

                          if (!isVip) return (
                            <div key={b.id} className="vip-locked-btn" style={{cursor:'pointer'}} onClick={() => window.dispatchEvent(new CustomEvent('open-propopass-modal'))}>
                              {/* orb de fondo */}
                              <div style={{position:'absolute',width:'70%',height:'55%',borderRadius:'50%',background:'radial-gradient(ellipse,rgba(160,80,255,.18) 0%,transparent 72%)',filter:'blur(8px)',top:'10%',left:'15%',animation:'vip-lock-orb 3s ease-in-out infinite',pointerEvents:'none',zIndex:0}}/>
                              <div className="vip-lock-overlay">
                                <span className="vip-lock-icon">🔒</span>
                                <span className="vip-lock-sub">PROPO-PASS</span>
<span style={{fontFamily:'Georgia,serif',fontSize:8,letterSpacing:2,fontWeight:900,color:'#f5d06e',background:'linear-gradient(135deg,rgba(212,175,55,.2),rgba(124,58,237,.2))',border:'1px solid rgba(212,175,55,.4)',borderRadius:4,padding:'2px 7px'}}>👑 VIP</span>
                                {/* separador */}
                                <div style={{width:'65%',height:'1px',background:'linear-gradient(90deg,transparent,rgba(180,100,255,.4),rgba(212,175,55,.3),transparent)',margin:'2px 0'}}/>
                                {/* icono del bonus difuminado */}
                                <span style={{fontSize:'clamp(18px,3vw,22px)',filter:'blur(1px) drop-shadow(0 0 14px rgba(220,160,255,.9))',opacity:.85}}>{b.icon}</span>
                                <span style={{
                                  fontFamily:'Georgia,serif',fontSize:'clamp(13px,2.2vw,17px)',fontWeight:900,
                                  color:'#fff5a0',
                                  textShadow:'0 0 20px rgba(255,215,80,1), 0 0 40px rgba(212,175,55,.8), 0 0 8px rgba(255,200,50,.6), 0 2px 3px rgba(0,0,0,1)',
                                  letterSpacing:'1px',
                                  textAlign:'center',
                                  width:'100%',
                                  display:'block',
                                  background:'linear-gradient(90deg,#c8920a,#fff5a0,#f5d06e,#fff5a0,#c8920a)',
                                  backgroundSize:'200% auto',
                                  WebkitBackgroundClip:'text',
                                  WebkitTextFillColor:'transparent',
                                  backgroundClip:'text',
                                  animation:'vip-shimmer 2s linear infinite',
                                }}>{b.desc}</span>
                                <span style={{fontFamily:'Georgia,serif',fontSize:'clamp(7px,1vw,9px)',letterSpacing:'2px',color:'rgba(220,180,255,.85)',textTransform:'uppercase',fontWeight:700}}>{b.label}</span>
                                <span style={{
                                  fontFamily:'Georgia,serif',fontSize:'clamp(7px,1vw,8px)',letterSpacing:'1px',
                                  color:'rgba(255,220,100,.9)',
                                  background:'rgba(212,175,55,.12)',border:'1px solid rgba(212,175,55,.35)',
                                  borderRadius:'5px',padding:'2px 8px',marginTop:'2px',fontWeight:700,
                                }}>
                                  {b.cooldown === 604800000 ? '👑 Semanal · PropoPass' : '👑 Diario · PropoPass'}
                                </span>
                              </div>
                            </div>
                          );

                          // Recuperar el config original de bonusConfigs para usar handleClaimBonus
                          const originalConfig = bonusConfigs.find(c => c.id === b.id);
                          return (
                            <button
                              key={b.id}
                              ref={el => btnRefs.current[b.id] = el}
                              disabled={!!claimingId || !ready}
                              onClick={() => ready && !claimingId && originalConfig && handleClaimBonus(originalConfig)}
                              style={{
                                position:'relative', border:'none', outline:'none', cursor: ready ? 'pointer' : 'not-allowed',
                                borderRadius:14, padding:'14px 8px 12px',
                                display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                                minHeight:140,
                                background: ready
                                  ? 'linear-gradient(160deg,rgba(90,40,0,.98) 0%,rgba(18,6,0,1) 55%,rgba(70,30,0,.95) 100%)'
                                  : 'linear-gradient(160deg,rgba(50,20,0,.95) 0%,rgba(12,4,0,1) 55%,rgba(40,15,0,.9) 100%)',
                                borderTop: `1.5px solid ${ready ? 'rgba(255,210,70,.7)' : 'rgba(255,180,40,.3)'}`,
                                borderLeft: `1.5px solid ${ready ? 'rgba(255,190,50,.45)' : 'rgba(255,160,30,.2)'}`,
                                borderRight: '1.5px solid rgba(0,0,0,.7)',
                                borderBottom: `3px solid rgba(0,0,0,.9)`,
                                boxShadow: ready
                                  ? '0 0 30px rgba(212,175,55,.5), 0 0 60px rgba(212,175,55,.2), inset 0 1px 0 rgba(255,215,90,.2)'
                                  : '0 0 14px rgba(212,175,55,.12), inset 0 1px 0 rgba(255,215,90,.06)',
                                overflow:'hidden',
                              }}
                            >
                              {/* shimmer */}
                              <div style={{position:'absolute',top:0,left:'-120%',width:'55%',height:'100%',background:'linear-gradient(90deg,transparent,rgba(255,215,90,.18),transparent)',animation:'vip-shimmer 2.6s linear infinite',pointerEvents:'none'}}/>
                              
                              {/* icono */}
                              <span style={{fontSize:26, filter: ready ? 'drop-shadow(0 0 12px rgba(212,175,55,.9))' : 'drop-shadow(0 0 6px rgba(212,175,55,.4))', animation:'vip-icon-float 3s ease-in-out infinite'}}>{b.icon}</span>
                              
                              {/* recompensa */}
                              <span style={{
                                fontFamily:'Georgia,serif', fontSize:'clamp(12px,2vw,15px)', fontWeight:900,
                                background:'linear-gradient(90deg,#c8920a,#f5d06e,#fff5a0,#f5d06e,#c8920a)',
                                backgroundSize:'200% auto', animation:'vip-shimmer 2s linear infinite',
                                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                                letterSpacing:1, textAlign:'center',
                                opacity: ready ? 1 : 0.5,
                              }}>{b.desc}</span>

                              {/* label */}
                              <span style={{fontFamily:'Georgia,serif', fontSize:8, letterSpacing:2, color: ready ? 'rgba(212,175,55,.6)' : 'rgba(212,175,55,.3)', textTransform:'uppercase'}}>{b.label}</span>

                              {/* estado */}
                              {ready && (
                                <span style={{
                                  fontFamily:'Georgia,serif', fontSize:9, letterSpacing:2, fontWeight:900,
                                  color:'#f5d06e', background:'rgba(212,175,55,.12)',
                                  border:'1px solid rgba(212,175,55,.4)', borderRadius:6, padding:'3px 10px',
                                  textShadow:'0 0 12px rgba(255,200,50,.8)',
                                }}>✦ Reclamar</span>
                              )}
                              {!ready && (
                                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,marginTop:2,padding:'10px 14px',borderRadius:12,background:'linear-gradient(160deg,rgba(90,40,0,.98),rgba(18,6,0,1),rgba(70,30,0,.95))',borderTop:'1.5px solid rgba(255,210,70,.6)',borderLeft:'1.5px solid rgba(255,190,50,.35)',borderRight:'1.5px solid rgba(0,0,0,.7)',borderBottom:'3px solid rgba(0,0,0,.9)',boxShadow:'0 0 24px rgba(212,175,55,.4),0 0 50px rgba(212,175,55,.15),inset 0 1px 0 rgba(255,215,90,.15)',width:'90%'}}>
                                  <span style={{fontSize:22}}>💎</span>
                                  <span style={{fontFamily:'Georgia,serif',fontSize:7,letterSpacing:2,color:'rgba(212,175,55,.8)',textTransform:'uppercase',fontWeight:900,textShadow:'0 0 10px rgba(212,175,55,.6)',whiteSpace:'nowrap'}}>— Vuelve en —</span>
                                  <span style={{
                                    fontFamily:'Georgia,serif', fontSize:'clamp(13px,2vw,16px)', fontWeight:900,
                                    color:'#fff5a0', letterSpacing:3, whiteSpace:'nowrap',
                                    textShadow:'0 0 22px rgba(255,200,50,1), 0 0 8px rgba(255,150,0,.6), 0 2px 3px rgba(0,0,0,1)',
                                    background:'linear-gradient(90deg,#c8920a,#fff5a0,#f5d06e,#fff5a0,#c8920a)',
                                    backgroundSize:'200% auto', animation:'vip-shimmer 2s linear infinite',
                                    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                                  }}>{fmt(remaining)}</span>
                                </div>
                              )}
                              {bonusMsg[b.id] && <span style={{position:'absolute',top:4,right:6,fontSize:8,color:'#4ade80',fontFamily:'Georgia,serif'}}>{bonusMsg[b.id]}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}

              </div>{/* fin panel morado */}
              </div>{/* fin contenedor separador */}

              </div>{/* fin derecha */}
            </div>{/* fin flex row */}

            {/* bottom accent */}
            <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,175,55,.25) 30%,rgba(212,175,55,.25) 70%,transparent)', margin: '0 20px' }}/>
            <div style={{ padding: '8px 18px 10px', textAlign: 'center' }}>
              <span onClick={() => !isVip && window.dispatchEvent(new CustomEvent('open-propopass-modal'))} style={{ fontFamily: 'Georgia,serif', fontSize: 8, letterSpacing: 2, color: 'rgba(212,175,55,.7)', textTransform: 'uppercase', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'block', textAlign:'center', padding:'0 12px', cursor: isVip ? 'default' : 'pointer' }}>
                {isVip ? '💎 Membresía PropoPass Activa 💎' : '👑 Activa PropoPass y desbloquea los bonos del Propo-Pass'}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        </div>{/* ── fin left-panel ── */}

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex:1, minWidth:0, padding:'0 8px' }}>
        <div className="divider">
          <div className="divline" style={{background:"linear-gradient(90deg,transparent,rgba(212,168,52,.2))"}}/>
          <svg width="18" height="18" viewBox="0 0 18 18" style={{opacity:.35}}>
            <polygon points="9,1.5 10.5,6.5 15.5,6.5 11.5,9.5 13,14.5 9,11.5 5,14.5 6.5,9.5 2.5,6.5 7.5,6.5" fill="rgba(212,168,52,.5)"/>
          </svg>
          <div className="divline" style={{background:"linear-gradient(90deg,rgba(212,168,52,.2),transparent)"}}/>
        </div>

        {/* ── FILTROS ── */}
        <div className="filters">
          <button className="fbtn" data-f="TODAS" style={btnStyle("TODAS")} onClick={() => setCurrentFilter("TODAS")}>
            <svg className="f-icon" viewBox="0 0 16 16" fill="none" style={iconStyle("TODAS")}>
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M8 4v4l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity=".6"/>
            </svg>
            ✦ Todos
          </button>
          <button className="fbtn" data-f="DIARIA" style={btnStyle("DIARIA")} onClick={() => setCurrentFilter("DIARIA")}>
            <svg className="f-icon" viewBox="0 0 16 16" fill="none" style={iconStyle("DIARIA")}>
              <polygon points="8,2 9.5,6 14,6 10.5,8.5 12,13 8,10.5 4,13 5.5,8.5 2,6 6.5,6" fill="currentColor" opacity=".9"/>
            </svg>
            👑 Pruebas
          </button>
          <button className="fbtn" data-f="SEMANAL" style={btnStyle("SEMANAL")} onClick={() => setCurrentFilter("SEMANAL")}>
            <svg className="f-icon" viewBox="0 0 16 16" fill="none" style={iconStyle("SEMANAL")}>
              <path d="M8 2 L14 5 L14 10 C14 13 11 15 8 16 C5 15 2 13 2 10 L2 5 Z" stroke="currentColor" strokeWidth="1.1" fill="currentColor" opacity=".25"/>
              <path d="M5.5 8.5 L7 10 L10.5 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Operaciones
          </button>
          
          <button className="fbtn" data-f="TEMPLO" style={btnStyle("TEMPLO")} onClick={() => setCurrentFilter("TEMPLO")}>
            <svg className="f-icon" viewBox="0 0 16 16" fill="none" style={iconStyle("TEMPLO")}>
              <path d="M8 1 L15 5 L15 11 L8 15 L1 11 L1 5 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" opacity=".2"/>
              <path d="M8 4 L8 12 M5 6 L11 6 M5 10 L11 10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
            100 Templarios
          </button>
          <button className="fbtn" data-f="Propo-Tienda" style={btnStyle("Propo-Tienda")} onClick={() => setCurrentFilter("Propo-Tienda")}>
            <svg className="f-icon" viewBox="0 0 16 16" fill="none" style={iconStyle("Propo-Tienda")}>
              <path d="M2 4 L14 4 L12 12 L4 12 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" opacity=".2"/>
              <path d="M6 4 C6 2.5 7 1.5 8 1.5 C9 1.5 10 2.5 10 4" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
              <circle cx="6" cy="13.5" r="1" fill="currentColor" opacity=".7"/>
              <circle cx="10" cy="13.5" r="1" fill="currentColor" opacity=".7"/>
            </svg>
            PropoPropo-Tienda
          </button>
        </div>

        {/* ── LISTA ── */}
        <div id="list">
          {filtered.length === 0 ? (
            <div className="empty">
              <p style={{fontFamily:"Georgia,serif",fontSize:14,color:"rgba(180,160,220,.45)",margin:0,fontStyle:"italic"}}>
                El Templo prepara nuevos retos.
              </p>
            </div>
          ) : (
            filtered.map((m, idx) => {
              const c          = getCfg(m.type);
              const pct        = Math.min(100, Math.round((m.progress / m.goal) * 100));
              const isComplete = pct >= 100;
              const delay      = `${idx * .11}s`;
              const spinDelay  = `-${(idx * 1.3).toFixed(1)}s`;
              const hook       = m.hook || HOOKS[m.type] || HOOKS.NORMAL;
              const imgData    = missionImages[m.id];

              return (
                <div
                  key={m.id}
                  className="mc-outer"
                  style={{
                    "--sc": c.color,
                    "--sd": spinDelay,
                    animation: `card-rise .55s cubic-bezier(.22,1,.36,1) ${delay} both`,
                  }}
                >
                  <div
                    className="mc"
                    style={{ background: `linear-gradient(160deg,${c.gradTop} 0%,rgba(10,3,22,.97) 100%)`, position: "relative" }}
                  >
                    {isComplete && claimedMissions[m.id] && <DoneOverlay m={m} c={c}/>}

                    <div className="mc-border" style={{ border: `1px solid ${c.cardBorder}` }}/>

                    {/* Top accent */}
                    <div className="top-accent" style={{ background: `linear-gradient(90deg,transparent 5%,${c.accent} 40%,${c.color} 55%,${c.accent} 70%,transparent 95%)` }}/>

                    {/* Header */}
                    <div className="mc-header">
                      <div className="mc-icon-box" style={{ background: `linear-gradient(145deg,${c.bg},rgba(0,0,0,.45))`, border: `1px solid ${c.border}`, boxShadow: `0 0 20px ${c.glow}33` }}>
                        {ICONS[c.ik]}
                      </div>
                      <div className="mc-meta">
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span className="mc-type-lbl" style={{ color: c.color }}>{c.label}</span>
                          {m.platform === 'templo' && (
                            <span style={{fontSize:8,fontWeight:900,letterSpacing:1.5,color:'#a78bfa',background:'rgba(139,92,246,.15)',border:'1px solid rgba(139,92,246,.4)',borderRadius:4,padding:'1px 6px'}}>⚔️ 100 Templarios</span>
                          )}
                          {m.platform === 'store' && (
                            <span style={{fontSize:8,fontWeight:900,letterSpacing:1.5,color:'#fbbf24',background:'rgba(251,191,36,.1)',border:'1px solid rgba(251,191,36,.35)',borderRadius:4,padding:'1px 6px'}}>🛒 PropoTienda</span>
                          )}
                          {m.platform === 'academia' && (
                            <span style={{fontSize:8,fontWeight:900,letterSpacing:1.5,color:'#34d399',background:'rgba(52,211,153,.1)',border:'1px solid rgba(52,211,153,.35)',borderRadius:4,padding:'1px 6px'}}>🎓 Academia</span>
                          )}
                          {m.platform === 'comunidad' && (
                            <span style={{fontSize:8,fontWeight:900,letterSpacing:1.5,color:'#60a5fa',background:'rgba(96,165,250,.1)',border:'1px solid rgba(96,165,250,.35)',borderRadius:4,padding:'1px 6px'}}>👥 Comunidad</span>
                          )}
                          {m.platform === 'referidos' && (
                            <span style={{fontSize:8,fontWeight:900,letterSpacing:1.5,color:'#f472b6',background:'rgba(244,114,182,.1)',border:'1px solid rgba(244,114,182,.35)',borderRadius:4,padding:'1px 6px'}}>🤝 Referidos</span>
                          )}
                          {m.platform === 'general' && (
                            <span style={{fontSize:8,fontWeight:900,letterSpacing:1.5,color:'#fb923c',background:'rgba(251,146,60,.1)',border:'1px solid rgba(251,146,60,.35)',borderRadius:4,padding:'1px 6px'}}>🔥 General</span>
                          )}
                        </div>
                        <span className="mc-title" style={{ "--tc": c.textColor }}>{m.title}</span>
                      </div>
                      {!claimedMissions[m.id] && Math.min(100, Math.round((m.progress / m.goal) * 100)) >= 100 && (
  <span style={{fontSize:9,fontWeight:900,letterSpacing:2,color:'#facc15',background:'rgba(250,204,21,.15)',border:'1px solid rgba(250,204,21,.5)',borderRadius:6,padding:'2px 9px',flexShrink:0,animation:'claimPulse 1.5s ease-in-out infinite'}}>⚠ PENDIENTE</span>
)}
{m.deadline && <span className="mc-deadline">⏳ {m.deadline}</span>}
                    </div>

                    {/* Hook */}
                    <div className="mc-hook" style={{ borderLeft: `2px solid ${c.color}50`, background: `linear-gradient(90deg,${c.bg},transparent)` }}>
                      <p style={{ color: c.color, opacity: .82 }}>{hook}</p>
                    </div>

                    {/* Descripción */}
                    <p className="mc-desc">{m.desc}</p>

                    {/* Upload — SOLO se renderiza si hay imagen cargada (igual que el HTML) */}
                    {(imgData || m.image_url) && (
                      <div className="mc-upload-wrap">
                        <div
                          className="mc-upload-zone"
style={{ borderColor: c.border, animation: "none", cursor: "default" }}
onClick={imgData ? () => triggerUpload(m.id) : undefined}
                        >
                          <img
                            src={imgData?.src || m.image_url}
                            className={`mc-img-loaded${imgData?.orient === "vertical" ? " vertical" : ""}`}
                            alt={m.title}
                          />
                          <div className="mc-img-overlay" style={{ background: `linear-gradient(transparent,${c.gradTop})` }}/>
                          <div className="mc-img-badge" style={{ border: `1px solid ${c.border}` }}>
                            <div style={{ width: 14, height: 14 }}>{ICONS[c.ik]}</div>
                            <span className="mc-img-badge-lbl" style={{ color: c.color }}>{c.label}</span>
                          </div>
                          
                          {/* Input file DENTRO del uploadZone, solo cuando hay imagen — igual que el HTML */}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            ref={el => fileRefs.current[m.id] = el}
                            onChange={(e) => handleFile(m.id, e)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Progress */}
<ProgressBar m={m} c={c}/>

                    {/* Rewards */}
                    <RewardRow m={m} c={c}/>

                    {/* ── Claim button ── */}
                    <div style={{ padding: '4px 20px 18px' }}>
                      {missionMsg[m.id] && (
                        <div style={{ textAlign:'center', fontFamily:'Georgia,serif', fontSize:11,
                          color: claimedMissions[m.id] ? '#4ade80' : '#fca5a5',
                          marginBottom:8, letterSpacing:1 }}>
                          {missionMsg[m.id]}
                        </div>
                      )}
                      {claimedMissions[m.id] ? (
                        <div style={{
                          width:'100%', padding:'11px 0', borderRadius:12, textAlign:'center',
                          background:'rgba(74,222,128,.06)', border:'1px solid rgba(74,222,128,.25)',
                          fontFamily:'Georgia,serif', fontSize:11, letterSpacing:2,
                          color:'rgba(74,222,128,.6)', textTransform:'uppercase',
                        }}>
                          ✓ Recompensa Reclamada
                        </div>
                      ) : pct >= 100 && !claimedMissions[m.id] ? (
                        <button
                          onClick={() => handleClaimMission(m)}
                          disabled={!!claimingMissionId}
                          style={{
                            width:'100%', padding:'13px 0', borderRadius:12, cursor:'pointer',
                            background:`linear-gradient(135deg,${c.bg},rgba(8,2,18,.98),${c.bg})`,
                            backgroundSize:'200% auto',
                            border:`1.5px solid ${c.color}`,
                            fontFamily:'Georgia,serif', fontSize:12, letterSpacing:3,
                            textTransform:'uppercase', color: c.color, fontWeight:700,
                            boxShadow:`0 0 20px ${c.glow},0 0 40px ${c.glow}66,inset 0 0 20px ${c.glow}22`,
                            animation:'claimPulse 1.5s ease-in-out infinite',
                            transition:'all .3s',
                            opacity: claimingMissionId === m.id ? .6 : 1,
                          }}
                        >
                          {claimingMissionId === m.id ? '⏳ Procesando…' : '⚔️ ¡RECLAMAR RECOMPENSA!'}
                        </button>
                      ) : null}
                    </div>

                    {/* Bot line */}
                    <div className="bot-line" style={{ background: `linear-gradient(90deg,transparent,${c.border},transparent)` }}/>

                    {/* Corners */}
                    <div className="corn corn-tl"><CornerSvg color={c.color}/></div>
                    <div className="corn corn-tr"><CornerSvg color={c.color}/></div>
                    <div className="corn corn-bl"><CornerSvg color={c.color}/></div>
                    <div className="corn corn-br"><CornerSvg color={c.color}/></div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </>
  );
}
