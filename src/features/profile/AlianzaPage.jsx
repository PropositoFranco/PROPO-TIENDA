// AlianzaPage.jsx — src/features/profile/AlianzaPage.jsx
// Sistema ALIANZA completo — layout v6 (vivo/vibrante) + funcionalidad actual
// Ruta: /alianza

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { missionsService } from "../../services/missions.service";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ALIANZA_LEVELS = [
  { nivel: 1, referidos: 1,  label: "Chispa",     emoji: "⚡", color: "#a78bfa", glow: "#7c3aed", desc: "Tu primer aliado enciende la red",     reward: "Tu red despierta. Un paso y ya no estás solo." },
  { nivel: 2, referidos: 3,  label: "Nexo",        emoji: "🔗", color: "#60a5fa", glow: "#2563eb", desc: "La conexión se multiplica",             reward: "Tres puntos forman una red. La tuya ya existe." },
  { nivel: 3, referidos: 5,  label: "Resonancia",  emoji: "🌊", color: "#34d399", glow: "#059669", desc: "Tu impacto comienza a sentirse",         reward: "Lo que vibras ya se propaga más lejos de lo que ves." },
  { nivel: 4, referidos: 10, label: "Expansión",   emoji: "🌐", color: "#fbbf24", glow: "#d97706", desc: "La red crece sin límites",               reward: "Diez personas movidas por tu ejemplo. Eso es liderazgo real." },
  { nivel: 5, referidos: 15, label: "Legado",      emoji: "✦",  color: "#f87171", glow: "#dc2626", desc: "Eres la chispa de otros",               reward: "Ya no sigues un camino. Eres el camino para otros." },
];

const HOW_IT_WORKS = [
  { icon: "🎯", title: "Comparte tu código", body: "Cada miembro tiene un código único. Cuando alguien lo usa al registrarse, quedan vinculados a tu Alianza.", color: "#a78bfa" },
  { icon: "💳", title: "Tu aliado entra por $1", body: "La membresía del Templo cuesta $1 USD el primer mes en lugar de $49 cuando usan tu código.", color: "#60a5fa" },
  { icon: "🎟", title: "Tú recibes un bono al subir de nivel", body: "Cada vez que alcanzas un nuevo nivel Alianza — Chispa, Nexo, Resonancia, Expansión o Legado — recibes un cupón: paga $1 USD y activa +1 mes en el Templo.", color: "#fbbf24" },
  { icon: "⏳", title: "3 días para canjear", body: "Una vez que el cupón aparece en tu cuenta tienes 72 horas para activarlo. Después caduca.", color: "#34d399" },
];

function getLevelInfo(count) {
  let curr = null;
  for (let i = ALIANZA_LEVELS.length - 1; i >= 0; i--) {
    if (count >= ALIANZA_LEVELS[i].referidos) { curr = ALIANZA_LEVELS[i]; break; }
  }
  const currIdx = curr ? ALIANZA_LEVELS.findIndex(l => l.nivel === curr.nivel) : -1;
  const next = ALIANZA_LEVELS[currIdx + 1] || null;
  const prevCount = curr ? curr.referidos : 0;
  const nextCount = next ? next.referidos : ALIANZA_LEVELS[ALIANZA_LEVELS.length - 1].referidos;
  const progress = next ? ((count - prevCount) / (nextCount - prevCount)) * 100 : 100;
  return { curr, next, progress: Math.min(100, Math.max(0, progress)) };
}

// ─── STAR FIELD (del layout v6 — da vida al fondo) ───────────────────────────
function StarField() {
  const stars = Array.from({ length: 65 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    s: Math.random() * 1.8 + 0.4,
    dur: Math.random() * 3 + 2,
    del: Math.random() * 5,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: `${s.s}px`, height: `${s.s}px`, borderRadius: "50%",
          background: s.id % 3 === 0 ? "rgba(167,139,250,0.7)" : s.id % 3 === 1 ? "rgba(245,197,24,0.6)" : "rgba(255,255,255,0.35)",
          animation: `alianza-twinkle ${s.dur}s ${s.del}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── SOLAR BURST ─────────────────────────────────────────────────────────────
function SolarBurst({ color, active }) {
  if (!active) return null;
  const rays = Array.from({ length: 20 }, (_, i) => ({
    angle: (i * 360) / 20,
    length: 80 + Math.random() * 120,
    width: 1 + Math.random() * 3,
    delay: Math.random() * 0.25,
    opacity: 0.5 + Math.random() * 0.5,
  }));
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0, overflow: "visible" }}>
      <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: `radial-gradient(circle, ${color}55 0%, ${color}18 40%, transparent 70%)`, animation: "sc-burst 2s ease-out forwards", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: "180px", height: "180px", borderRadius: "50%", background: `radial-gradient(circle, ${color}ff 0%, ${color}99 25%, ${color}22 60%, transparent 100%)`, animation: "sc-core 1.4s ease-out forwards", filter: "blur(3px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: "60px", height: "60px", borderRadius: "50%", background: `radial-gradient(circle, #fff 0%, ${color} 60%)`, animation: "sc-core 1s ease-out forwards", filter: "blur(1px)", pointerEvents: "none" }} />
      {rays.map((r, i) => (
        <div key={i} style={{ position: "absolute", width: `${r.length}px`, height: `${r.width}px`, background: `linear-gradient(90deg, #fff, ${color}cc, ${color}55, transparent)`, transformOrigin: "0% 50%", transform: `rotate(${r.angle}deg)`, animation: `sc-ray 1.6s ${r.delay}s ease-out forwards`, opacity: 0, borderRadius: "999px", "--sop": r.opacity, pointerEvents: "none" }} />
      ))}
    </div>
  );
}

// ─── LEVEL NODE — ÉPICO ───────────────────────────────────────────────────────
const NODE_ICONS = {
  1: ({ color, glow }) => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <polygon points="16,2 20,12 31,12 22,19 25,30 16,23 7,30 10,19 1,12 12,12" fill={`${color}22`} stroke={color} strokeWidth="1.5"/>
      <polygon points="16,7 19,14 26,14 21,18 23,25 16,21 9,25 11,18 6,14 13,14" fill={color} opacity="0.7"/>
    </svg>
  ),
  2: ({ color, glow }) => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="5" fill={color} opacity="0.9"/>
      <circle cx="6" cy="16" r="3.5" fill={color} opacity="0.5"/>
      <circle cx="26" cy="16" r="3.5" fill={color} opacity="0.5"/>
      <line x1="9" y1="16" x2="11" y2="16" stroke={color} strokeWidth="1.5"/>
      <line x1="21" y1="16" x2="23" y2="16" stroke={color} strokeWidth="1.5"/>
      <circle cx="10" cy="8" r="2.5" fill={color} opacity="0.4"/>
      <circle cx="22" cy="8" r="2.5" fill={color} opacity="0.4"/>
      <line x1="11.5" y1="9.5" x2="13.5" y2="12.5" stroke={color} strokeWidth="1" opacity="0.5"/>
      <line x1="20.5" y1="9.5" x2="18.5" y2="12.5" stroke={color} strokeWidth="1" opacity="0.5"/>
    </svg>
  ),
  3: ({ color, glow }) => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M4 22 Q10 10 16 8 Q22 10 28 22" stroke={color} strokeWidth="2" fill="none" opacity="0.4"/>
      <path d="M4 26 Q10 14 16 12 Q22 14 28 26" stroke={color} strokeWidth="2.5" fill="none" opacity="0.7"/>
      <path d="M4 30 Q10 18 16 16 Q22 18 28 30" stroke={color} strokeWidth="2" fill="none" opacity="0.4"/>
      <circle cx="16" cy="14" r="3" fill={color}/>
    </svg>
  ),
  4: ({ color, glow }) => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13" stroke={color} strokeWidth="1" opacity="0.3"/>
      <circle cx="16" cy="16" r="9" stroke={color} strokeWidth="1" opacity="0.5"/>
      <circle cx="16" cy="16" r="5" fill={color} opacity="0.8"/>
      <line x1="16" y1="1" x2="16" y2="5" stroke={color} strokeWidth="1.5"/>
      <line x1="16" y1="27" x2="16" y2="31" stroke={color} strokeWidth="1.5"/>
      <line x1="1" y1="16" x2="5" y2="16" stroke={color} strokeWidth="1.5"/>
      <line x1="27" y1="16" x2="31" y2="16" stroke={color} strokeWidth="1.5"/>
      <line x1="5" y1="5" x2="8" y2="8" stroke={color} strokeWidth="1" opacity="0.5"/>
      <line x1="27" y1="5" x2="24" y2="8" stroke={color} strokeWidth="1" opacity="0.5"/>
      <line x1="5" y1="27" x2="8" y2="24" stroke={color} strokeWidth="1" opacity="0.5"/>
      <line x1="27" y1="27" x2="24" y2="24" stroke={color} strokeWidth="1" opacity="0.5"/>
    </svg>
  ),
  5: ({ color, glow }) => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <polygon points="16,1 19,11 30,11 21,17 24,28 16,22 8,28 11,17 2,11 13,11" fill={`${color}15`} stroke={color} strokeWidth="1.2" opacity="0.4"/>
      <polygon points="16,5 18.5,12 26,12 20,16.5 22,24 16,20 10,24 12,16.5 6,12 13.5,12" fill={`${color}30`} stroke={color} strokeWidth="1"/>
      <polygon points="16,9 17.5,13.5 22,13.5 18.5,16 19.5,21 16,18.5 12.5,21 13.5,16 10,13.5 14.5,13.5" fill={color} opacity="0.9"/>
    </svg>
  ),
};

const CONNECTOR_SHAPES = [
  // 1→2: rayo/chispa
  ({ color, active }) => (
    <svg width="100%" height="20" viewBox="0 0 100 20" preserveAspectRatio="none">
      <polyline points="0,10 35,4 50,10 65,16 100,10" stroke={active ? color : "rgba(255,255,255,0.08)"} strokeWidth={active ? "2" : "1"} fill="none" strokeDasharray={active ? "none" : "4 4"} opacity={active ? 1 : 0.4}/>
      {active && <polyline points="0,10 35,4 50,10 65,16 100,10" stroke="#fff" strokeWidth="0.5" fill="none" opacity="0.4"/>}
    </svg>
  ),
  // 2→3: onda
  ({ color, active }) => (
    <svg width="100%" height="20" viewBox="0 0 100 20" preserveAspectRatio="none">
      <path d="M0,10 Q25,2 50,10 Q75,18 100,10" stroke={active ? color : "rgba(255,255,255,0.08)"} strokeWidth={active ? "2" : "1"} fill="none" strokeDasharray={active ? "none" : "4 4"} opacity={active ? 1 : 0.4}/>
      {active && <path d="M0,10 Q25,2 50,10 Q75,18 100,10" stroke="#fff" strokeWidth="0.5" fill="none" opacity="0.3"/>}
    </svg>
  ),
  // 3→4: orbita
  ({ color, active }) => (
    <svg width="100%" height="20" viewBox="0 0 100 20" preserveAspectRatio="none">
      <line x1="0" y1="10" x2="100" y2="10" stroke={active ? color : "rgba(255,255,255,0.08)"} strokeWidth={active ? "2" : "1"} strokeDasharray={active ? "8 3" : "4 4"} opacity={active ? 1 : 0.4}/>
      {active && [20,40,60,80].map(x => <circle key={x} cx={x} cy="10" r="2" fill={color} opacity="0.8"/>)}
    </svg>
  ),
  // 4→5: doble línea épica
  ({ color, active }) => (
    <svg width="100%" height="20" viewBox="0 0 100 20" preserveAspectRatio="none">
      <line x1="0" y1="8" x2="100" y2="8" stroke={active ? color : "rgba(255,255,255,0.06)"} strokeWidth={active ? "1.5" : "0.5"} opacity={active ? 0.8 : 0.3}/>
      <line x1="0" y1="12" x2="100" y2="12" stroke={active ? color : "rgba(255,255,255,0.06)"} strokeWidth={active ? "1.5" : "0.5"} opacity={active ? 0.8 : 0.3}/>
      {active && <line x1="0" y1="10" x2="100" y2="10" stroke="#fff" strokeWidth="0.5" opacity="0.3"/>}
    </svg>
  ),
];

function LevelNode({ lvl, index, referidosActivos, isLast }) {
  const unlocked = referidosActivos >= lvl.referidos;
  const isNext = !unlocked && (index === 0 || referidosActivos >= ALIANZA_LEVELS[index - 1].referidos);
  const isCurrent = unlocked && (!ALIANZA_LEVELS[index + 1] || referidosActivos < ALIANZA_LEVELS[index + 1].referidos);
  const [burst, setBurst] = useState(false);
  const [hovered, setHovered] = useState(false);
  const prevUnlocked = useRef(unlocked);
  const Icon = NODE_ICONS[lvl.nivel];

  useEffect(() => {
    if (!prevUnlocked.current && unlocked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 2200);
    }
    prevUnlocked.current = unlocked;
  }, [unlocked]);

  const ConnectorShape = !isLast ? CONNECTOR_SHAPES[index] : null;

  return (
    <div style={{ display: "flex", alignItems: "center", flex: isLast ? "none" : 1, minWidth: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flexShrink: 0 }}>

        {/* Label superior */}
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: "8px", fontWeight: "700", letterSpacing: "0.14em", color: unlocked ? lvl.color : "rgba(255,255,255,0.18)", transition: "color 0.4s", textShadow: unlocked ? `0 0 12px ${lvl.color}` : "none", textTransform: "uppercase" }}>
          {lvl.label}
        </div>

        {/* Nodo principal */}
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            position: "relative",
            width: isCurrent ? "60px" : "50px",
            height: isCurrent ? "60px" : "50px",
            borderRadius: lvl.nivel === 1 || lvl.nivel === 5 ? "12px" : lvl.nivel === 4 ? "50%" : lvl.nivel === 2 ? "14px" : "50%",
            background: unlocked
              ? `linear-gradient(145deg, ${lvl.color}30, ${lvl.glow}50, ${lvl.color}15)`
              : isNext ? `rgba(255,255,255,0.04)` : "rgba(255,255,255,0.02)",
            border: unlocked
              ? `1.5px solid ${lvl.color}90`
              : isNext ? `1.5px dashed ${lvl.color}40` : "1.5px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: unlocked
              ? isCurrent
                ? `0 0 0 6px ${lvl.glow}20, 0 0 0 12px ${lvl.glow}0a, 0 0 30px ${lvl.glow}80, 0 0 60px ${lvl.glow}40`
                : `0 0 20px ${lvl.glow}60, 0 0 40px ${lvl.glow}25`
              : "none",
            transition: "all 0.5s cubic-bezier(0.23,1,0.32,1)",
            transform: hovered && unlocked ? "scale(1.18) translateY(-3px)" : isCurrent ? "scale(1.1)" : "scale(1)",
            cursor: "default", zIndex: 1,
          }}
        >
          <SolarBurst color={lvl.color} active={burst} />

          {/* Ícono SVG único por nivel */}
          <div style={{ position: "relative", zIndex: 2, opacity: unlocked ? 1 : isNext ? 0.35 : 0.15, transition: "opacity 0.4s", filter: unlocked ? `drop-shadow(0 0 6px ${lvl.color})` : "none" }}>
            <Icon color={unlocked ? lvl.color : "rgba(255,255,255,0.3)"} glow={lvl.glow} />
          </div>

          {/* Anillos de ping en nivel actual */}
          {isCurrent && <>
            <div style={{ position: "absolute", inset: "-10px", borderRadius: "inherit", border: `1px solid ${lvl.color}50`, animation: "alianza-ping 2.2s ease-out infinite", pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: "-20px", borderRadius: "inherit", border: `1px solid ${lvl.color}25`, animation: "alianza-ping 2.2s .7s ease-out infinite", pointerEvents: "none" }} />
          </>}

          {/* Partículas orbitando nivel actual */}
          {isCurrent && [0,1,2].map(p => (
            <div key={p} style={{ position: "absolute", width: "4px", height: "4px", borderRadius: "50%", background: lvl.color, top: "50%", left: "50%", transformOrigin: "0 0", animation: `orbit-${lvl.nivel}-${p} ${2.5 + p * 0.7}s linear infinite`, pointerEvents: "none", boxShadow: `0 0 6px ${lvl.color}` }} />
          ))}
        </div>

        {/* Req referidos */}
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: "7.5px", letterSpacing: "0.08em", color: unlocked ? `${lvl.color}cc` : isNext ? `${lvl.color}45` : "rgba(255,255,255,0.12)", fontWeight: unlocked ? "700" : "400", transition: "color 0.4s", textAlign: "center" }}>
          {lvl.referidos === 1 ? "1 aliado" : `${lvl.referidos} aliados`}
        </div>

        {/* Badge "ACTUAL" */}
        {isCurrent && (
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: "6.5px", letterSpacing: "0.2em", color: lvl.color, background: `${lvl.color}15`, border: `1px solid ${lvl.color}40`, borderRadius: "999px", padding: "2px 8px", textTransform: "uppercase", textShadow: `0 0 8px ${lvl.color}` }}>
            ACTUAL
          </div>
        )}
      </div>

      {/* Conector único entre nodos */}
      {!isLast && (
        <div style={{ flex: 1, height: "20px", margin: "0 6px", marginTop: isCurrent ? "-32px" : "-28px", minWidth: 0, opacity: unlocked ? 1 : 0.4, transition: "opacity 0.8s" }}>
          {ConnectorShape && <ConnectorShape color={lvl.color} active={unlocked} />}
        </div>
      )}
    </div>
  );
}

// ─── LEVEL CARD ──────────────────────────────────────────────────────────────
function LevelCard({ level, referidosActivos, onClaim, cuponActivo }) {
  const unlocked = referidosActivos >= level.referidos;
  const isNext = !unlocked && (level.nivel === 1 || referidosActivos >= ALIANZA_LEVELS[level.nivel - 2].referidos);
  const isCurrent = unlocked && (!ALIANZA_LEVELS[level.nivel] || referidosActivos < ALIANZA_LEVELS[level.nivel].referidos);
  const [hover, setHover] = useState(false);
  const needed = level.referidos - referidosActivos;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "relative", overflow: "hidden", background: unlocked ? `linear-gradient(155deg, ${level.glow}1a 0%, rgba(8,3,26,0.98) 55%, rgba(2,0,12,0.99) 100%)` : "rgba(8,3,26,0.55)", border: unlocked ? `1px solid ${level.color}50` : isNext ? `1px dashed ${level.color}30` : "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "22px", transition: "all 0.45s cubic-bezier(0.23,1,0.32,1)", transform: hover && unlocked ? "translateY(-6px) scale(1.015)" : "none", boxShadow: hover && unlocked ? `0 24px 60px ${level.glow}40, 0 0 0 1px ${level.color}20, inset 0 1px 0 rgba(255,255,255,0.07)` : unlocked ? `0 6px 24px ${level.glow}20, inset 0 1px 0 rgba(255,255,255,0.03)` : "none", opacity: !unlocked && !isNext ? 0.35 : 1 }}>
      {unlocked && <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: "1px", background: `linear-gradient(90deg,transparent,${level.color}cc,transparent)`, animation: "alianza-topline 3s ease-in-out infinite" }} />}
      {unlocked && <div style={{ position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)", width: "180px", height: "180px", borderRadius: "50%", background: `radial-gradient(circle,${level.glow}22 0%,transparent 70%)`, pointerEvents: "none" }} />}
      {isCurrent && <>
        <div style={{ position: "absolute", top: "12px", right: "12px", width: "16px", height: "16px", borderTop: `2px solid ${level.color}70`, borderRight: `2px solid ${level.color}70`, borderRadius: "0 4px 0 0" }} />
        <div style={{ position: "absolute", bottom: "12px", left: "12px", width: "16px", height: "16px", borderBottom: `2px solid ${level.color}70`, borderLeft: `2px solid ${level.color}70`, borderRadius: "0 0 0 4px" }} />
      </>}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: unlocked ? `linear-gradient(135deg,${level.color}35,${level.glow}55)` : "rgba(255,255,255,0.04)", border: `1px solid ${unlocked ? level.color + "45" : "rgba(255,255,255,0.07)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: unlocked ? `0 0 24px ${level.glow}55,inset 0 1px 0 rgba(255,255,255,0.15)` : "none", transition: "all 0.3s" }}>
            <span style={{ filter: unlocked ? `drop-shadow(0 0 8px ${level.color})` : "none" }}>{unlocked ? level.emoji : "🔒"}</span>
          </div>
          <div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: "7.5px", fontWeight: "700", letterSpacing: "0.15em", color: unlocked ? level.color : "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "3px", textShadow: unlocked ? `0 0 10px ${level.color}` : "none" }}>Nivel {level.nivel}</div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: "17px", fontWeight: "900", color: unlocked ? "#fff" : "rgba(255,255,255,0.25)", letterSpacing: "-0.01em", textShadow: unlocked ? `0 0 24px ${level.color}55` : "none" }}>{level.label}</div>
          </div>
        </div>
        {unlocked
          ? <div style={{ background: `linear-gradient(135deg,${level.color}22,${level.color}10)`, border: `1px solid ${level.color}45`, borderRadius: "20px", padding: "4px 12px", fontFamily: "'Cinzel',serif", fontSize: "8px", fontWeight: "700", color: level.color, letterSpacing: "0.08em", textShadow: `0 0 8px ${level.color}` }}>✓ Activo</div>
          : isNext ? <div style={{ background: "rgba(255,255,255,0.04)", border: `1px dashed ${level.color}35`, borderRadius: "20px", padding: "4px 12px", fontFamily: "'Cinzel',serif", fontSize: "8px", color: `${level.color}80`, letterSpacing: "0.06em" }}>+{needed} aliado{needed !== 1 ? "s" : ""}</div>
          : null
        }
      </div>

      {unlocked
        ? <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: "13px", color: "rgba(200,185,240,0.8)", marginBottom: "14px", lineHeight: "1.7", borderLeft: `2px solid ${level.color}50`, paddingLeft: "12px", fontStyle: "italic" }}>{level.reward}</p>
        : <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.35)", marginBottom: "14px", lineHeight: "1.7" }}>{level.desc}</p>
      }

      <div style={{ background: unlocked ? "rgba(251,191,36,0.07)" : "rgba(255,255,255,0.02)", border: `1px solid ${unlocked ? "rgba(251,191,36,0.28)" : "rgba(255,255,255,0.06)"}`, borderRadius: "12px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <span style={{ fontSize: "18px", filter: unlocked ? "drop-shadow(0 0 8px rgba(251,191,36,0.9))" : "grayscale(1) opacity(0.2)" }}>🎟</span>
        <div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: "11px", fontWeight: "700", color: unlocked ? "#fbbf24" : "rgba(255,255,255,0.2)" }}>+1 mes del Templo</div>
          <div style={{ fontFamily: "'Raleway',sans-serif", fontSize: "10px", color: unlocked ? "rgba(212,175,55,0.65)" : "rgba(255,255,255,0.18)", marginTop: "2px" }}>Actívalo por solo $1 · válido 3 días</div>
        </div>
        {unlocked && <div style={{ marginLeft: "auto", fontFamily: "'Cinzel',serif", fontSize: "9px", fontWeight: "700", color: "#fbbf24", letterSpacing: "0.1em", background: "rgba(251,191,36,0.1)", borderRadius: "8px", padding: "4px 9px" }}>$1 USD</div>}
      </div>

      {isNext && <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
          <span style={{ fontFamily: "'Cinzel',serif", fontSize: "7.5px", color: `${level.color}70`, letterSpacing: "0.12em" }}>PROGRESO</span>
          <span style={{ fontFamily: "'Cinzel',serif", fontSize: "7.5px", color: `${level.color}70` }}>{referidosActivos}/{level.referidos}</span>
        </div>
        <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: "999px", width: `${(referidosActivos / level.referidos) * 100}%`, background: `linear-gradient(90deg,${level.glow},${level.color})`, boxShadow: `0 0 8px ${level.color}`, transition: "width 1s cubic-bezier(0.23,1,0.32,1)" }} />
        </div>
      </div>}

      {unlocked && cuponActivo && (
        <button
          onClick={() => onClaim(level.nivel)}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 30px ${level.glow}80`; e.currentTarget.style.transform = "scale(1.03)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 4px 20px ${level.glow}55`; e.currentTarget.style.transform = "scale(1)"; }}
          style={{ width: "100%", background: `linear-gradient(135deg,${level.color}ee,${level.glow})`, border: "none", borderRadius: "12px", padding: "13px", fontFamily: "'Cinzel',serif", fontSize: "10px", fontWeight: "700", color: "#fff", cursor: "pointer", letterSpacing: "0.12em", textTransform: "uppercase", boxShadow: `0 4px 20px ${level.glow}55`, transition: "all 0.25s", position: "relative", overflow: "hidden" }}>
          <span style={{ position: "relative", zIndex: 1 }}>⚔ Canjear bono · $1 USD</span>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.22) 50%,transparent 60%)", backgroundSize: "200% 100%", animation: "alianza-shimmer 2s infinite" }} />
        </button>
      )}
      {unlocked && !cuponActivo && (
        <div style={{ padding: "10px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "12px", textAlign: "center", fontFamily: "'Cinzel',serif", fontSize: "10px", fontWeight: "700", color: "#34d399", letterSpacing: "0.1em" }}>✓ Canjeado</div>
      )}
    </div>
  );
}

// ─── HOW IT WORKS CARRUSEL ───────────────────────────────────────────────────
function HowItWorksCarousel() {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const timerRef = useRef(null);

  const go = useCallback((idx) => {
    setDir(idx > active ? 1 : -1);
    setActive(idx);
  }, [active]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setDir(1);
      setActive(prev => (prev + 1) % HOW_IT_WORKS.length);
    }, 4200);
    return () => clearInterval(timerRef.current);
  }, []);

  const step = HOW_IT_WORKS[active];
  const c = step.color;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: "8px", letterSpacing: "0.22em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
          Paso {active + 1} de {HOW_IT_WORKS.length}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {HOW_IT_WORKS.map((s, i) => (
            <button key={i} onClick={() => { clearInterval(timerRef.current); go(i); }} style={{ width: i === active ? "22px" : "7px", height: "7px", borderRadius: "999px", background: i === active ? s.color : "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.4s cubic-bezier(0.23,1,0.32,1)", boxShadow: i === active ? `0 0 10px ${s.color}` : "none" }} />
          ))}
        </div>
      </div>

      <div key={active} style={{ position: "relative", background: `linear-gradient(135deg, ${c}12 0%, rgba(8,3,26,0.97) 60%, rgba(2,0,12,0.99) 100%)`, border: `1px solid ${c}30`, borderRadius: "20px", padding: "clamp(22px,4vw,34px)", boxShadow: `0 0 60px ${c}12, inset 0 1px 0 rgba(255,255,255,0.05)`, overflow: "hidden", minHeight: "190px", animation: "hw-slide-in 0.42s cubic-bezier(0.23,1,0.32,1)" }}>
        <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: `linear-gradient(90deg,transparent,${c}cc,transparent)` }} />
        <div style={{ position: "absolute", top: "-60px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: `radial-gradient(circle,${c}14 0%,transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "14px", right: "14px", width: "14px", height: "14px", borderTop: `1.5px solid ${c}55`, borderRight: `1.5px solid ${c}55`, borderRadius: "0 3px 0 0" }} />
        <div style={{ position: "absolute", bottom: "14px", left: "14px", width: "14px", height: "14px", borderBottom: `1.5px solid ${c}55`, borderLeft: `1.5px solid ${c}55`, borderRadius: "0 0 0 3px" }} />

        <div style={{ display: "flex", gap: "18px", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
          <div style={{ flexShrink: 0, width: "58px", height: "58px", borderRadius: "17px", background: `linear-gradient(135deg,${c}22,${c}0d)`, border: `1px solid ${c}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", boxShadow: `0 0 24px ${c}30, inset 0 1px 0 rgba(255,255,255,0.1)`, animation: "alianza-float 3.5s ease-in-out infinite" }}>
            {step.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: "clamp(14px,2.5vw,18px)", fontWeight: "700", color: "#f0e8ff", marginBottom: "10px", letterSpacing: "0.02em", textShadow: `0 0 20px ${c}35` }}>{step.title}</div>
            <div style={{ fontFamily: "'Raleway',sans-serif", fontSize: "clamp(13px,2vw,15px)", color: "rgba(200,185,240,0.85)", lineHeight: "1.75" }}>{step.body}</div>
          </div>
        </div>

        <div style={{ marginTop: "20px", height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden", position: "relative", zIndex: 1 }}>
          <div key={`bar-${active}`} style={{ height: "100%", borderRadius: "999px", background: `linear-gradient(90deg,${c}88,${c})`, boxShadow: `0 0 8px ${c}`, animation: "alianza-bar-fill 4.2s linear forwards" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "14px" }}>
        {[
          { label: "‹", idx: (active - 1 + HOW_IT_WORKS.length) % HOW_IT_WORKS.length },
          { label: "›", idx: (active + 1) % HOW_IT_WORKS.length },
        ].map((btn, i) => (
          <button key={i} onClick={() => { clearInterval(timerRef.current); go(btn.idx); }}
            onMouseEnter={e => { e.currentTarget.style.background = `${step.color}18`; e.currentTarget.style.borderColor = `${step.color}70`; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = `${step.color}30`; }}
            style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: `1px solid ${step.color}30`, color: step.color, fontFamily: "monospace", fontSize: "18px", cursor: "pointer", transition: "all 0.25s", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── RANKING CARD ─────────────────────────────────────────────────────────────
function RankingCard({ alianza, position }) {
  const medals = ["🥇", "🥈", "🥉"];
  const colors = ["#fbbf24", "#94a3b8", "#fb923c"];
  const c = colors[position] || "#6b7280";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: `1px solid ${c}28`, borderRadius: "14px", transition: "all .3s ease" }}>
      <div style={{ fontFamily: "'Cinzel',serif", fontSize: "22px", width: "36px", textAlign: "center" }}>{medals[position] || `#${position + 1}`}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: "13px", fontWeight: "700", color: c }}>{alianza.nombre || "Alianza sin nombre"}</div>
        <div style={{ fontFamily: "'Raleway',sans-serif", fontSize: "10px", color: "rgba(200,185,240,0.45)", marginTop: "2px" }}>{alianza.total_members} miembros · {alianza.puntuacion_semanal} pts</div>
      </div>
      <div style={{ fontFamily: "'Cinzel',serif", fontSize: "18px", fontWeight: "900", color: c, textShadow: `0 0 12px ${c}80` }}>{alianza.puntuacion_semanal}</div>
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Raleway:wght@300;400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:rgba(0,0,0,.3);}
  ::-webkit-scrollbar-thumb{background:rgba(212,175,55,.25);border-radius:2px;}
  @keyframes alianza-twinkle{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.95;transform:scale(1.6)}}
  @keyframes alianza-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}
  @keyframes alianza-ping{0%{transform:scale(1);opacity:.6}100%{transform:scale(1.7);opacity:0}}
  @keyframes alianza-topline{0%,100%{opacity:.35}50%{opacity:1}}
  @keyframes alianza-pulse{0%,100%{box-shadow:0 0 8px rgba(248,113,113,0.2)}50%{box-shadow:0 0 28px rgba(248,113,113,0.7)}}
  @keyframes alianza-modal-in{from{opacity:0;transform:scale(.88) translateY(28px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes alianza-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  @keyframes alianza-glow{0%,100%{opacity:.5}50%{opacity:1}}
  @keyframes alianza-bar-fill{from{width:0%}to{width:100%}}
  @keyframes alianza-code-pulse{0%,100%{box-shadow:0 0 30px rgba(124,58,237,0.15)}50%{box-shadow:0 0 60px rgba(124,58,237,0.45),0 0 100px rgba(167,139,250,0.18)}}
  @keyframes goldShimmer{0%{background-position:200% center}100%{background-position:0% center}}
  @keyframes coinBounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}70%{transform:translateY(-2px)}}
  @keyframes sc-burst{0%{transform:scale(0);opacity:0}20%{opacity:.8}100%{transform:scale(2);opacity:0}}
  @keyframes sc-core{0%{transform:scale(0);opacity:0}30%{transform:scale(1.6);opacity:1}70%{transform:scale(1.1);opacity:.9}100%{transform:scale(.5);opacity:0}}
  @keyframes sc-ray{0%{opacity:0;transform:scaleX(0)}18%{opacity:var(--sop,.7)}100%{opacity:0;transform:scaleX(1.4)}}
  @keyframes hw-slide-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes energyLine{0%{stroke-dashoffset:0}100%{stroke-dashoffset:-400}}
  @keyframes orbit-1-0{0%{transform:translate(-2px,-22px) rotate(0deg) translateX(22px)}100%{transform:translate(-2px,-22px) rotate(360deg) translateX(22px)}}
  @keyframes orbit-1-1{0%{transform:translate(-2px,-18px) rotate(120deg) translateX(18px)}100%{transform:translate(-2px,-18px) rotate(480deg) translateX(18px)}}
  @keyframes orbit-1-2{0%{transform:translate(-2px,-26px) rotate(240deg) translateX(26px)}100%{transform:translate(-2px,-26px) rotate(600deg) translateX(26px)}}
  @keyframes orbit-2-0{0%{transform:translate(-2px,-22px) rotate(0deg) translateX(22px)}100%{transform:translate(-2px,-22px) rotate(360deg) translateX(22px)}}
  @keyframes orbit-2-1{0%{transform:translate(-2px,-18px) rotate(120deg) translateX(18px)}100%{transform:translate(-2px,-18px) rotate(480deg) translateX(18px)}}
  @keyframes orbit-2-2{0%{transform:translate(-2px,-26px) rotate(240deg) translateX(26px)}100%{transform:translate(-2px,-26px) rotate(600deg) translateX(26px)}}
  @keyframes orbit-3-0{0%{transform:translate(-2px,-24px) rotate(0deg) translateX(24px)}100%{transform:translate(-2px,-24px) rotate(360deg) translateX(24px)}}
  @keyframes orbit-3-1{0%{transform:translate(-2px,-20px) rotate(120deg) translateX(20px)}100%{transform:translate(-2px,-20px) rotate(480deg) translateX(20px)}}
  @keyframes orbit-3-2{0%{transform:translate(-2px,-28px) rotate(240deg) translateX(28px)}100%{transform:translate(-2px,-28px) rotate(600deg) translateX(28px)}}
  @keyframes orbit-4-0{0%{transform:translate(-2px,-24px) rotate(0deg) translateX(24px)}100%{transform:translate(-2px,-24px) rotate(360deg) translateX(24px)}}
  @keyframes orbit-4-1{0%{transform:translate(-2px,-20px) rotate(120deg) translateX(20px)}100%{transform:translate(-2px,-20px) rotate(480deg) translateX(20px)}}
  @keyframes orbit-4-2{0%{transform:translate(-2px,-28px) rotate(240deg) translateX(28px)}100%{transform:translate(-2px,-28px) rotate(600deg) translateX(28px)}}
  @keyframes orbit-5-0{0%{transform:translate(-2px,-26px) rotate(0deg) translateX(26px)}100%{transform:translate(-2px,-26px) rotate(360deg) translateX(26px)}}
  @keyframes orbit-5-1{0%{transform:translate(-2px,-22px) rotate(120deg) translateX(22px)}100%{transform:translate(-2px,-22px) rotate(480deg) translateX(22px)}}
  @keyframes orbit-5-2{0%{transform:translate(-2px,-30px) rotate(240deg) translateX(30px)}100%{transform:translate(-2px,-30px) rotate(600deg) translateX(30px)}}
`;

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AlianzaPage() {
  const { profile } = useAuthStore();
  const { cristales, addCristales } = usePlayerStore();

  const [userId, setUserId]                     = useState(null);
  const [referidosActivos, setReferidosActivos]  = useState(0);
  const [cuponesDisponibles, setCupones]         = useState([]);
  const [rankingAlianzas, setRanking]            = useState([]);
  const [alianzaUsuario, setAlianzaUsuario]      = useState(null);
  const [loading, setLoading]                    = useState(true);

  const [copied, setCopied]       = useState(false);
  const [activeTab, setActiveTab] = useState("niveles");
  const [showModal, setShowModal] = useState(null);

  const codigoReferido = profile?.referral_code || "—";
  const shareLink = `https://templodelpropositooficial.netlify.app/?ref=${codigoReferido}`;
  const shareText = `Entra al Templo del Propósito — primer mes por $1. Código: ${codigoReferido}`;

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const { count } = await supabase.from("referrals").select("*", { count: "exact", head: true }).eq("referrer_id", user.id).eq("status", "active");
      setReferidosActivos(count || 0);
      if (count && count > 0) {
        missionsService.trackProgress(user.id, 'referrals_count', count);
      }
      const { data: eventos } = await supabase
        .from("referral_events")
        .select("*")
        .eq("user_id", user.id)
        .eq("event_type", "bonus_earned")
        .eq("claimed", false)
        .gt("expires_at", new Date().toISOString());
      if (eventos) {
        setCupones(eventos.map((e) => ({
          id: e.id,
          nivel: e.nivel,
          diasRestantes: Math.ceil((new Date(e.expires_at).getTime() - Date.now()) / 86400000),
        })).filter(c => c.diasRestantes > 0));
      }
      const { data: alianzaData } = await supabase.from("alianzas").select("*").eq("leader_id", user.id).maybeSingle();
      setAlianzaUsuario(alianzaData);
      const { data: topAlianzas } = await supabase.from("alianzas").select("*").order("puntuacion_semanal", { ascending: false }).limit(5);
      setRanking(topAlianzas || []);
      setLoading(false);
    };
    load();
  }, []);

  const { curr, next, progress } = getLevelInfo(referidosActivos);

  const copyCode = useCallback(() => {
    navigator.clipboard?.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
    if (userId) missionsService.trackEvent(userId, 'refer_member');
  }, [shareLink, userId]);

  const handleCanjear = async (nivel, eventId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-bonus-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ event_id: eventId, user_id: userId }),
      });
      const data = await res.json();
      if (data?.url) window.open(data.url, "_blank");
    } catch (e) {
      console.error("Error al crear checkout:", e);
    }
    setShowModal(null);
  };

  if (loading) return (
    <div style={{ minHeight: "100dvh", background: "#08051a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{CSS}</style>
      <div style={{ fontFamily: "'Cinzel',serif", fontSize: "12px", letterSpacing: "4px", color: "rgba(212,175,55,0.7)", animation: "alianza-glow 1.5s ease-in-out infinite" }}>⚡ CARGANDO ALIANZA...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(180deg,#02000c 0%,#060018 35%,#080020 65%,#020008 100%)", color: "#fff", fontFamily: "'Raleway',sans-serif", position: "relative", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Raleway:wght@300;400;600;700&display=swap" rel="stylesheet" />
      <style>{CSS}</style>

      {/* ── FONDO VIVO: StarField + ambient ── */}
      <StarField />
      <div style={{ position: "fixed", top: "-18%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "420px", background: "radial-gradient(ellipse,rgba(124,58,237,0.14) 0%,transparent 68%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-10%", right: "-5%", width: "400px", height: "300px", background: "radial-gradient(ellipse,rgba(96,165,250,0.06) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "820px", margin: "0 auto", padding: "0 clamp(16px,4vw,24px) 100px" }}>

        {/* ══ HERO — centrado al estilo v6 ══ */}
        <div style={{ textAlign: "center", paddingTop: "clamp(32px,6vh,56px)", marginBottom: "40px" }}>

          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg,rgba(212,175,55,0.12),rgba(139,92,246,0.08))", border: "1px solid rgba(212,175,55,0.35)", borderRadius: "20px", padding: "6px 16px", marginBottom: "20px", fontSize: "9px", fontWeight: "700", letterSpacing: "0.18em", fontFamily: "'Cinzel',serif", color: "#d4af37", textTransform: "uppercase", boxShadow: "0 0 20px rgba(212,175,55,0.1)" }}>
            <span style={{ animation: "alianza-float 3s ease-in-out infinite", display: "inline-block", filter: "drop-shadow(0 0 8px rgba(212,175,55,0.9))" }}>⚡</span> Sistema Alianza · Templo del Propósito
          </div>

          {/* Título */}
          <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: "clamp(28px,5.5vw,50px)", fontWeight: "900", lineHeight: "1.07", margin: "0 0 16px", background: "linear-gradient(135deg,#ffe87a 0%,#d4af37 30%,#fff8dc 55%,#d4af37 80%,#ffe87a 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "goldShimmer 4s linear infinite" }}>
            Un aliado tuyo entra por $1.<br />
            <span style={{ fontSize: "0.8em", opacity: 0.85 }}>Tú también.</span>
          </h1>

          {/* Sub */}
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: "clamp(14px,2.5vw,16px)", color: "rgba(200,185,240,0.75)", maxWidth: "480px", margin: "0 auto 10px", lineHeight: "1.8" }}>
            Membresía completa al Templo — de{" "}
<span style={{ color: "rgba(248,113,113,0.7)", textDecoration: "line-through", textDecorationColor: "rgba(248,113,113,0.9)", textDecorationThickness: "2px", fontWeight: "700" }}>$49</span>{" "}a{" "}
<strong style={{ fontSize: "1.25em", background: "linear-gradient(135deg,#c4b5fd,#a78bfa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 0 12px rgba(167,139,250,0.9))", animation: "alianza-glow 2s ease-in-out infinite", display: "inline-block" }}>$1</strong>{" "}el primer mes cuando alguien usa tu código.
          </p>
          <p style={{ fontFamily: "'Raleway',sans-serif", fontSize: "clamp(13px,2vw,14.5px)", color: "rgba(200,185,240,0.55)", maxWidth: "440px", margin: "0 auto 30px", lineHeight: "1.7" }}>
            Y tú también: por cada nivel del trayecto de la alianza desbloqueado, recibes un bono para extender tu membresía por <strong style={{ color: "#fbbf24" }}>$1 más</strong>.
          </p>

          {/* ── CÓDIGO ── */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(167,139,250,0.22)", borderRadius: "16px", padding: "14px 22px", marginBottom: "20px", animation: "alianza-code-pulse 4s ease-in-out infinite", flexWrap: "wrap", justifyContent: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: "1px", background: "linear-gradient(90deg,transparent,rgba(167,139,250,0.7),rgba(212,175,55,0.5),transparent)" }} />
            <div>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: "8.5px", color: "rgba(167,139,250,0.55)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "4px" }}>Tu código Alianza</div>
              <div style={{ fontFamily: "monospace", fontSize: "clamp(24px,4vw,32px)", fontWeight: "900", letterSpacing: "0.2em", background: "linear-gradient(90deg,#c4b5fd,#93c5fd,#a78bfa,#c4b5fd)", backgroundSize: "200% auto", animation: "goldShimmer 4s linear infinite", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{codigoReferido}</div>
            </div>
            <div style={{ display: "flex", gap: "9px" }}>
              <button onClick={copyCode}
                onMouseEnter={e => e.currentTarget.style.borderColor = copied ? "rgba(52,211,153,0.6)" : "rgba(167,139,250,0.6)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = copied ? "rgba(52,211,153,0.35)" : "rgba(167,139,250,0.28)"}
                style={{ background: copied ? "rgba(52,211,153,0.1)" : "rgba(167,139,250,0.1)", border: `1px solid ${copied ? "rgba(52,211,153,0.35)" : "rgba(167,139,250,0.28)"}`, borderRadius: "10px", padding: "10px 16px", cursor: "pointer", color: copied ? "#34d399" : "#a78bfa", fontFamily: "'Cinzel',serif", fontSize: "9.5px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", transition: "all 0.3s" }}>{copied ? "✓ Copiado" : "Copiar"}</button>
              <button
                onClick={() => { if (navigator.share) navigator.share({ text: shareText, url: shareLink }); else navigator.clipboard?.writeText(shareLink); }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(96,165,250,0.6)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(96,165,250,0.25)"}
                style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", color: "#60a5fa", fontFamily: "'Cinzel',serif", fontSize: "9.5px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", transition: "all 0.3s" }}>Compartir</button>
            </div>
          </div>

          {/* ── STATS ── (estilo v6: limpio, sin cajita gris) */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { val: referidosActivos, sub: "Aliados activos", color: curr?.color || "#a78bfa" },
              { val: curr ? `Nv.${curr.nivel}` : "—", sub: curr?.label || "Sin nivel", color: curr?.color || "rgba(255,255,255,0.3)" },
              { val: cuponesDisponibles.length || 0, sub: "Cupones listos", color: cuponesDisponibles.length > 0 ? "#fbbf24" : "rgba(255,255,255,0.3)" },
            ].map((s, i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: "clamp(28px,5vw,36px)", fontWeight: "900", lineHeight: 1, color: s.color, textShadow: `0 0 20px ${s.color}80`, animation: cuponesDisponibles.length > 0 && i === 2 ? "coinBounce 2.5s ease-in-out infinite" : "none" }}>{s.val}</div>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: "8.5px", color: "rgba(200,185,240,0.4)", textTransform: "uppercase", letterSpacing: "0.13em", marginTop: "4px" }}>{s.sub}</div>
                </div>
                {i < arr.length - 1 && <div style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.07)" }} />}
              </div>
            ))}
          </div>
        </div>

        {/* ══ TRAYECTO ══ */}
        <div style={{ marginBottom: "36px", background: "linear-gradient(160deg,rgba(8,3,26,0.99) 0%,rgba(22,8,55,0.99) 100%)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: "20px", padding: "28px 24px 24px", boxShadow: "0 0 0 1px rgba(212,175,55,0.06), 0 8px 40px rgba(212,175,55,0.1), inset 0 1px 0 rgba(255,230,120,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
              <div style={{ width: "3px", height: "18px", borderRadius: "999px", background: curr ? `linear-gradient(180deg,${curr.color},${curr.glow})` : "rgba(255,255,255,0.15)", boxShadow: curr ? `0 0 10px ${curr.color}` : "none" }} />
              <span style={{ fontFamily: "'Cinzel',serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.18em", color: "rgba(200,185,240,0.55)", textTransform: "uppercase" }}>Trayecto Alianza</span>
            </div>
            {curr && <div style={{ fontFamily: "'Cinzel',serif", fontSize: "11px", color: curr.color, fontWeight: "700", letterSpacing: "0.1em", textShadow: `0 0 10px ${curr.color}` }}>{curr.emoji} {curr.label}</div>}
          </div>

          <div style={{ display: "flex", alignItems: "center", marginBottom: "20px", padding: "0 4px" }}>
            {ALIANZA_LEVELS.map((lvl, i) => (
              <LevelNode key={i} lvl={lvl} index={i} referidosActivos={referidosActivos} isLast={i === ALIANZA_LEVELS.length - 1} />
            ))}
          </div>

          <div style={{ height: "8px", borderRadius: "999px", background: "rgba(255,255,255,0.05)", overflow: "hidden", position: "relative", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.5)", marginBottom: "10px" }}>
            <div style={{ height: "100%", borderRadius: "999px", width: `${Math.max(2, (referidosActivos / 15) * 100)}%`, background: curr ? `linear-gradient(90deg,${curr.glow},${curr.color},${next?.color || curr.color})` : "linear-gradient(90deg,#4c1d95,#7c3aed,#a78bfa)", transition: "width 1.6s cubic-bezier(0.23,1,0.32,1)", boxShadow: curr ? `0 0 16px ${curr.glow}88,0 0 30px ${curr.glow}35` : "0 0 14px rgba(124,58,237,0.7)", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.4) 50%,transparent 100%)", animation: "alianza-shimmer 2.5s infinite" }} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
            <span style={{ fontFamily: "'Cinzel',serif", color: curr?.color || "rgba(200,185,240,0.5)", fontWeight: "700", textShadow: curr ? `0 0 8px ${curr.color}` : "none" }}>{referidosActivos} aliado{referidosActivos !== 1 ? "s" : ""} activos</span>
            {next
              ? <span style={{ fontFamily: "'Raleway',sans-serif", color: "rgba(200,185,240,0.55)" }}>{next.referidos - referidosActivos} más para <span style={{ color: next.color }}>{next.label}</span></span>
              : <span style={{ fontFamily: "'Cinzel',serif", color: "#fbbf24", fontWeight: "700", textShadow: "0 0 10px rgba(251,191,36,0.8)" }}>✦ Legado máximo alcanzado</span>
            }
          </div>
        </div>

        {/* ══ TABS ══ */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "26px", background: "linear-gradient(160deg,rgba(8,3,26,0.99) 0%,rgba(22,8,55,0.99) 100%)", borderRadius: "13px", padding: "4px", border: "1px solid rgba(212,175,55,0.3)" }}>
          {[{ id: "niveles", label: "⚡ Niveles" }, { id: "ranking", label: "🏆 Ranking" }, { id: "como", label: "📖 Cómo funciona" }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "11px", background: activeTab === tab.id ? "linear-gradient(135deg,rgba(212,175,55,0.2),rgba(139,92,246,0.12))" : "transparent", border: activeTab === tab.id ? "1px solid rgba(212,175,55,0.5)" : "1px solid transparent", borderRadius: "10px", cursor: "pointer", color: activeTab === tab.id ? "#d4af37" : "rgba(200,185,240,0.4)", fontFamily: "'Cinzel',serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", transition: "all 0.3s", boxShadow: activeTab === tab.id ? "0 0 20px rgba(212,175,55,0.2)" : "none" }}>{tab.label}</button>
          ))}
        </div>

        {/* ══ TAB: NIVELES ══ */}
        {activeTab === "niveles" && (
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,270px),1fr))" }}>
            {ALIANZA_LEVELS.map(level => {
              const cupon = cuponesDisponibles.find(c => c.nivel === level.nivel);
              return <LevelCard key={level.nivel} level={level} referidosActivos={referidosActivos} cuponActivo={!!cupon} onClaim={(n) => setShowModal({ nivel: n, cupon })} />;
            })}
          </div>
        )}

        {/* ══ TAB: RANKING ══ */}
        {activeTab === "ranking" && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "26px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "6px" }}>
              <div style={{ width: "3px", height: "18px", borderRadius: "999px", background: "linear-gradient(180deg,#fbbf24,#d97706)", boxShadow: "0 0 10px rgba(251,191,36,0.6)" }} />
              <span style={{ fontFamily: "'Cinzel',serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.18em", color: "rgba(212,175,55,0.75)", textTransform: "uppercase" }}>Top Alianzas — Esta Semana</span>
            </div>
            {rankingAlianzas.length === 0
              ? <div style={{ textAlign: "center", padding: "40px 20px", fontFamily: "'Cinzel',serif", fontSize: "11px", letterSpacing: "3px", color: "rgba(200,185,240,0.3)" }}>AÚN NO HAY ALIANZAS REGISTRADAS</div>
              : rankingAlianzas.map((a, i) => <RankingCard key={a.id} alianza={a} position={i} />)
            }
            {alianzaUsuario && (
              <div style={{ marginTop: "14px", padding: "16px 18px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: "14px" }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: "8px", letterSpacing: "3px", color: "rgba(167,139,250,0.55)", marginBottom: "6px" }}>TU ALIANZA</div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: "15px", fontWeight: "900", color: "#a78bfa" }}>{alianzaUsuario.nombre}</div>
                <div style={{ fontFamily: "'Raleway',sans-serif", fontSize: "11px", color: "rgba(200,185,240,0.45)", marginTop: "4px" }}>{alianzaUsuario.total_members} miembros · {alianzaUsuario.puntuacion_semanal} pts esta semana</div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: CÓMO FUNCIONA ══ */}
        {activeTab === "como" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <HowItWorksCarousel />
            <div style={{ padding: "20px 22px", background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.14)", borderRadius: "16px" }}>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: "8.5px", fontWeight: "700", color: "#fbbf24", marginBottom: "14px", letterSpacing: "0.16em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "7px" }}>
                <span>⚠</span> Reglas del bono
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { text: "El bono aparece después de que tu aliado completa su pago de $1.", icon: "🔔" },
                  { text: "Tienes exactamente 3 días para pagar tu $1 y activar el mes extra.", icon: "⏳", accent: "#fbbf24" },
                  { text: "Si el cupón vence, se pierde — no se acumula ni se transfiere.", icon: "⚠", accent: "#f87171" },
                  { text: "La membresía extendida entra en vigor inmediatamente al confirmar.", icon: "✓", accent: "#34d399" },
                  { text: "Cada nivel que alcanzas desbloquea un bono. Lleva a las personas correctas — familia, amigos, quien ya busca algo más — y el Templo recompensa cada etapa del camino.", icon: "✦", accent: "#a78bfa" },
                ].map((rule, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ flexShrink: 0, width: "24px", height: "24px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", marginTop: "1px" }}>{rule.icon}</div>
                    <span style={{ fontFamily: "'Raleway',sans-serif", fontSize: "13px", color: rule.accent ? rule.accent : "rgba(200,185,240,0.75)", lineHeight: "1.65" }}>{rule.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ CUPONES ACTIVOS ══ */}
        {cuponesDisponibles.length > 0 && (
          <div style={{ marginTop: "44px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "16px" }}>
              <div style={{ width: "3px", height: "18px", borderRadius: "999px", background: "linear-gradient(180deg,#fbbf24,#d97706)", boxShadow: "0 0 10px rgba(251,191,36,0.7)" }} />
              <span style={{ fontFamily: "'Cinzel',serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.18em", color: "rgba(212,175,55,0.8)", textTransform: "uppercase" }}>Bonos listos para canjear</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {cuponesDisponibles.map((cupon, i) => {
                const level = ALIANZA_LEVELS.find(l => l.nivel === cupon.nivel);
                const urgent = cupon.diasRestantes <= 1;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", background: "linear-gradient(135deg,rgba(251,191,36,0.07),rgba(8,3,26,0.95))", border: `1px solid ${urgent ? "rgba(248,113,113,0.45)" : "rgba(251,191,36,0.25)"}`, borderRadius: "16px", padding: "16px 20px", animation: urgent ? "alianza-pulse 1.5s infinite" : "none", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: "12%", right: "12%", height: "1px", background: `linear-gradient(90deg,transparent,${urgent ? "rgba(248,113,113,0.6)" : "rgba(251,191,36,0.6)"},transparent)` }} />
                    <span style={{ fontSize: "26px", filter: "drop-shadow(0 0 10px rgba(251,191,36,0.9))" }}>🎟</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Cinzel',serif", fontSize: "13px", fontWeight: "700", color: "#fbbf24", marginBottom: "3px" }}>{level?.emoji} {level?.label} — +1 mes del Templo</div>
                      <div style={{ fontFamily: "'Raleway',sans-serif", fontSize: "11px", color: urgent ? "#f87171" : "rgba(200,185,240,0.5)" }}>{urgent ? `⚠ Solo ${cupon.diasRestantes}h — no lo pierdas` : `Vence en ${cupon.diasRestantes} días`}</div>
                    </div>
                    <button onClick={() => setShowModal({ nivel: cupon.nivel, cupon })}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(251,191,36,0.7)"; e.currentTarget.style.transform = "scale(1.04)"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(251,191,36,0.5)"; e.currentTarget.style.transform = "scale(1)"; }}
                      style={{ background: "linear-gradient(135deg,#fbbf24,#d97706)", border: "none", borderRadius: "12px", padding: "12px 20px", fontFamily: "'Cinzel',serif", fontSize: "10px", fontWeight: "800", color: "#000", cursor: "pointer", letterSpacing: "0.12em", textTransform: "uppercase", boxShadow: "0 4px 20px rgba(251,191,36,0.5)", transition: "all .25s" }}>Activar · $1</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ══ MODAL ══ */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(155deg,rgba(124,58,237,0.2) 0%,rgba(8,3,26,0.98) 50%,rgba(2,0,12,1) 100%)", border: "1px solid rgba(167,139,250,0.35)", borderRadius: "24px", padding: "clamp(26px,5vw,42px)", maxWidth: "420px", width: "100%", boxShadow: "0 40px 100px rgba(0,0,0,0.8),0 0 70px rgba(124,58,237,0.15)", textAlign: "center", animation: "alianza-modal-in 0.38s cubic-bezier(0.23,1,0.32,1)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: "1px", background: "linear-gradient(90deg,transparent,rgba(167,139,250,0.7),#fbbf24,rgba(167,139,250,0.7),transparent)" }} />
            <div style={{ fontSize: "52px", marginBottom: "18px", filter: "drop-shadow(0 0 16px rgba(251,191,36,0.9))", animation: "alianza-float 3s ease-in-out infinite", display: "inline-block" }}>🎟</div>
            <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: "24px", fontWeight: "900", marginBottom: "12px", background: "linear-gradient(135deg,#fde68a,#fbbf24,#d97706)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Activar bono</h2>
            <p style={{ fontFamily: "'Raleway',sans-serif", color: "rgba(200,185,240,0.8)", fontSize: "14px", marginBottom: "28px", lineHeight: "1.8" }}>
              Confirmas el pago de <strong style={{ color: "#fbbf24" }}>$1 USD</strong> para activar{" "}
              <strong style={{ color: "#fff" }}>+1 mes en tu membresía del Templo</strong>.
              {showModal.cupon && <><br /><span style={{ color: "#f87171", fontSize: "12px" }}>Vence en {showModal.cupon.diasRestantes} día{showModal.cupon.diasRestantes !== 1 ? "s" : ""}.</span></>}
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowModal(null)} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "12px", padding: "13px", fontFamily: "'Cinzel',serif", color: "rgba(200,185,240,0.5)", fontSize: "10px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", transition: "all .3s" }}>Cancelar</button>
              <button onClick={() => { handleCanjear(showModal.nivel, showModal.cupon?.id); setShowModal(null); }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 30px rgba(251,191,36,0.7)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 24px rgba(251,191,36,0.5)"}
                style={{ flex: 2, background: "linear-gradient(135deg,#fde68a,#fbbf24,#d97706)", border: "none", borderRadius: "12px", padding: "13px", fontFamily: "'Cinzel',serif", color: "#000", fontSize: "11px", fontWeight: "900", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", boxShadow: "0 4px 24px rgba(251,191,36,0.5)", transition: "all .25s" }}>⚔ Confirmar · $1 USD</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}