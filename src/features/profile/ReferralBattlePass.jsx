// ReferralBattlePass.jsx — src/features/profile/ReferralBattlePass.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import botonVipImg from '../../assets/boton vip.png';

const ALIANZA_LEVELS = [
  { nivel: 1, referidos: 1,  label: "Chispa",    emoji: "⚡", color: "#a78bfa", glow: "rgba(167,139,250,0.9)" },
  { nivel: 2, referidos: 3,  label: "Nexo",       emoji: "🔗", color: "#38bdf8", glow: "rgba(56,189,248,0.9)" },
  { nivel: 3, referidos: 5,  label: "Resonancia", emoji: "🌊", color: "#34d399", glow: "rgba(52,211,153,0.9)" },
  { nivel: 4, referidos: 10, label: "Expansión",  emoji: "🌐", color: "#fb923c", glow: "rgba(251,146,60,0.9)" },
  { nivel: 5, referidos: 15, label: "Legado",     emoji: "✦",  color: "#d4af37", glow: "rgba(212,175,55,1)"  },
];

function getLevelInfo(count) {
  let curr = null;
  for (const l of ALIANZA_LEVELS) { if (count >= l.referidos) curr = l; }
  const currIdx = curr ? ALIANZA_LEVELS.findIndex(l => l.nivel === curr.nivel) : -1;
  const next = ALIANZA_LEVELS[currIdx + 1] || null;
  const prevCount = curr ? curr.referidos : 0;
  const nextCount = next ? next.referidos : 15;
  const progress = next ? ((count - prevCount) / (nextCount - prevCount)) * 100 : 100;
  return { curr, next, progress: Math.min(100, Math.max(0, progress)) };
}

export default function ReferralBattlePass() {
  const { profile } = useAuthStore();
  const [referidos, setReferidos] = useState(0);
  const [cupones, setCupones]     = useState(0);
  const [copied, setCopied]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [hovNode, setHovNode]     = useState(null);
  const [tooltipLocked, setTooltipLocked] = useState(false);

  const codigo = profile?.referral_code || "—";

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { count } = await supabase
        .from("profiles").select("*", { count: "exact", head: true })
        .eq("referred_by", user.id)
        .eq("membership_type", "base");
      setReferidos(count || 0);
      const { count: c2 } = await supabase
        .from("referral_events").select("*", { count: "exact", head: true })
        .eq("user_id", user.id).eq("event_type", "bonus_earned").eq("claimed", false);
      setCupones(c2 || 0);
      setLoading(false);
    };
    load();
  }, []);

  const { curr, next, progress } = getLevelInfo(referidos);

  const copyCode = () => {
    const shareLink = `https://templodelpropositooficial.netlify.app/?ref=${codigo}`;
    navigator.clipboard?.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progressPct = curr
    ? next
      ? ((referidos - curr.referidos) / (next.referidos - curr.referidos)) * 100
      : 100
    : (referidos / ALIANZA_LEVELS[0].referidos) * 100;

  return (
    <div style={{
      marginTop: "16px",
      borderRadius: "16px",
      background: "linear-gradient(160deg, rgba(8,3,26,0.99) 0%, rgba(22,8,55,0.99) 100%)",
      border: "1px solid rgba(212,175,55,0.45)",
      boxShadow: "0 0 0 1px rgba(212,175,55,0.06), 0 8px 40px rgba(212,175,55,0.1), inset 0 1px 0 rgba(255,230,120,0.1)",
      overflow: "visible",
      position: "relative",
    }}>

      {/* HEADER */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 14px 10px",
        background: "linear-gradient(90deg,rgba(212,175,55,0.13) 0%,rgba(139,92,246,0.07) 50%,rgba(212,175,55,0.13) 100%)",
        borderBottom: "1px solid rgba(212,175,55,0.18)",
        borderRadius: "16px 16px 0 0",
        flexWrap: "wrap", gap: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "20px", filter: "drop-shadow(0 0 12px rgba(212,175,55,0.9))", animation: "vipCrownFloat 2.2s ease-in-out infinite" }}>⚡</div>
          <div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: "6px", letterSpacing: "4px", color: "rgba(212,175,55,0.45)", marginBottom: "1px" }}>RED DE ALIANZA</div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: "clamp(11px,2vw,13px)", fontWeight: 900, background: "linear-gradient(135deg,#ffe87a 0%,#d4af37 40%,#fde68a 70%,#c9a84c 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "1px", animation: "goldShimmer 3s linear infinite" }}>SISTEMA ALIANZA</div>
          </div>
        </div>
        <Link to="/alianza"
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,175,55,0.18)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.7)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(212,175,55,0.08)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.35)"; }}
          style={{ padding: "6px 14px", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: "100px", fontFamily: "'Cinzel',serif", fontSize: "7.5px", color: "#d4af37", letterSpacing: "1.5px", textDecoration: "none", transition: "all .3s" }}>
          VER TODO →
        </Link>
      </div>

      {/* BODY */}
      <div style={{ padding: "10px 12px 12px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "16px", fontFamily: "'Cinzel',serif", fontSize: "8px", letterSpacing: "3px", color: "rgba(212,175,55,0.4)", animation: "vipCrownFloat 1.5s ease-in-out infinite" }}>CARGANDO...</div>
        ) : (
          <>
            {/* Barra de progreso */}
            <div style={{ position: "relative", height: "5px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,175,55,0.1)", overflow: "hidden", marginBottom: "10px" }}>
              <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${Math.max(2, progressPct)}%`, background: curr ? `linear-gradient(90deg,${curr.color},${next?.color || curr.color})` : "linear-gradient(90deg,#7c3aed,#d4af37)", borderRadius: "6px", boxShadow: curr ? `0 0 10px ${curr.glow}` : "0 0 8px rgba(212,175,55,0.6)", transition: "width 1s ease" }} />
            </div>

            {/* Stats row — misma estética que PROPO-PASS */}
            <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
              {[
                { val: referidos, label: "ALIADOS",  color: curr?.color || "#4b5563", icon: "⚡" },
                { val: curr ? `${curr.emoji} ${curr.label}` : "Sin nivel", label: "NIVEL", color: curr?.color || "rgba(212,175,55,0.25)", icon: null },
                { val: cupones,   label: "CUPONES",  color: cupones > 0 ? "#fbbf24" : "rgba(212,175,55,0.25)", icon: "🎟" },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", padding: "9px 5px", background: i === 2 && cupones > 0 ? "rgba(251,191,36,0.08)" : "rgba(212,175,55,0.04)", border: `1px solid ${i === 2 && cupones > 0 ? "rgba(251,191,36,0.35)" : `${s.color}22`}`, borderRadius: "10px", boxShadow: i === 2 && cupones > 0 ? "inset 0 1px 0 rgba(251,191,36,0.1)" : "none" }}>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: "clamp(11px,2vw,15px)", fontWeight: 900, color: s.color, textShadow: `0 0 12px ${s.color}70`, lineHeight: 1, marginBottom: "3px" }}>{s.val}</div>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: "6px", color: `${s.color}99`, letterSpacing: "1.5px" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Nodos de nivel — igual que fila VIP del PROPO-PASS */}
            <div style={{
              background: "linear-gradient(135deg,rgba(212,175,55,0.06) 0%,rgba(139,92,246,0.04) 50%,rgba(212,175,55,0.03) 100%)",
              borderRadius: "12px",
              border: "1px solid rgba(212,175,55,0.2)",
              padding: "10px 10px 8px",
              marginBottom: "10px",
            }}>
              <div style={{ position: "relative", height: "64px", display: "flex", alignItems: "center" }} onMouseLeave={() => setHovNode(null)}>
                {/* Línea dorada */}
                <div style={{ position: "absolute", top: "38%", left: 0, right: 0, height: "2px", borderRadius: "2px", zIndex: 0, background: curr ? `linear-gradient(90deg,rgba(212,175,55,0.2),${curr.color} 40%,rgba(212,175,55,0.2))` : "rgba(212,175,55,0.1)", boxShadow: curr ? `0 0 8px ${curr.glow}` : "none" }} />

                <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {ALIANZA_LEVELS.map((lvl, i) => {
                    const unlocked = referidos >= lvl.referidos;
                    const isCurr   = curr?.nivel === lvl.nivel;
                    const isNext   = !unlocked && (i === 0 || referidos >= ALIANZA_LEVELS[i - 1]?.referidos);
                    const isHov    = hovNode === lvl.nivel;
                    return (
                      <div key={i}
                        onMouseEnter={() => setHovNode(lvl.nivel)}
                        onMouseLeave={() => setHovNode(null)}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", position: "relative", zIndex: 2 }}>
                        <div style={{
                          width: isCurr ? "72px" : "56px",
                          height: isCurr ? "72px" : "56px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.3s cubic-bezier(0.34,1.3,0.64,1)",
                          transform: isCurr ? "translateY(-8px) scale(1.15)" : isHov ? "translateY(-4px) scale(1.08)" : "scale(1)",
                          position: "relative", overflow: "visible",
                        }}>
                          {isCurr && (
                            <div style={{ position:"absolute", inset:"-20px", borderRadius:"50%", background:"radial-gradient(ellipse, rgba(212,175,55,0.35) 0%, rgba(212,175,55,0.1) 50%, transparent 75%)", animation:"vipGoldPulse 2s ease-in-out infinite", pointerEvents:"none" }}/>
                          )}
                          <img src={botonVipImg} alt="" style={{
                            width: isCurr ? "68px" : isHov ? "56px" : "52px",
                            height: isCurr ? "68px" : isHov ? "56px" : "52px",
                            objectFit: "contain",
                            mixBlendMode: unlocked ? "screen" : "luminosity",
                            filter: isCurr
                              ? `drop-shadow(0 0 18px ${lvl.glow}) drop-shadow(0 0 36px ${lvl.color}) saturate(1.8) brightness(1.2)`
                              : unlocked
                                ? `drop-shadow(0 0 10px ${lvl.glow}) drop-shadow(0 0 6px ${lvl.color}) saturate(1.4) brightness(1.05)`
                                : isHov
                                  ? `drop-shadow(0 0 10px ${lvl.color}cc) saturate(1.2) brightness(1.0)`
                                  : `drop-shadow(0 0 6px ${lvl.color}) drop-shadow(0 0 3px ${lvl.color}99) saturate(0.8) brightness(0.75)`,
                            transition: "all 0.3s ease",
                          }}/>
                        </div>
                        <div style={{ fontFamily: "'Cinzel',serif", fontSize: "6px", fontWeight: 900, color: unlocked ? `${lvl.color}cc` : "rgba(200,185,240,0.2)", textShadow: unlocked ? `0 0 8px ${lvl.glow}` : "none", whiteSpace: "nowrap" }}>
                          {lvl.referidos}
                        </div>
                        {/* Tooltip hover */}
                        {isHov && (
                          <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", width: "110px", zIndex: 100, background: "linear-gradient(135deg,rgba(8,3,26,0.99),rgba(28,10,65,0.99))", border: `1px solid ${lvl.color}`, borderRadius: "10px", padding: "8px 9px", textAlign: "center", pointerEvents: "none", boxShadow: `0 8px 28px ${lvl.glow.replace("0.9","0.4")}`, animation: "rewardTooltipIn 0.15s ease" }}>
                            <div style={{ fontSize: "16px", marginBottom: "3px", filter: `drop-shadow(0 0 8px ${lvl.glow})` }}>{lvl.emoji}</div>
                            <div style={{ fontFamily: "'Cinzel',serif", fontSize: "7.5px", fontWeight: 900, color: lvl.color, marginBottom: "2px" }}>{lvl.label}</div>
                            <div style={{ fontFamily: "'Raleway',sans-serif", fontSize: "7px", color: "rgba(200,185,240,0.65)" }}>{lvl.referidos} aliado{lvl.referidos !== 1 ? "s" : ""}</div>
                            <div style={{ position: "absolute", bottom: "-5px", left: "50%", marginLeft: "-4px", width: "8px", height: "8px", background: "rgba(28,10,65,0.99)", border: `1px solid ${lvl.color}`, borderTop: "none", borderLeft: "none", transform: "rotate(45deg)" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Label de nivel actual */}
              {curr && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: "2px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "100px", background: `${curr.color}14`, border: `1px solid ${curr.color}44`, boxShadow: `0 0 10px ${curr.color}22` }}>
                    <span style={{ fontFamily: "'Cinzel',serif", fontSize: "6px", letterSpacing: "2px", color: curr.color, fontWeight: 900 }}>⚔ NIVEL ACTUAL: {curr.label.toUpperCase()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Código + copy — igual que botón VIP */}
            {codigo !== "—" && (
              <button onClick={copyCode}
                onMouseEnter={e => { e.currentTarget.style.borderColor = copied ? "rgba(52,211,153,0.6)" : "rgba(212,175,55,0.7)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(212,175,55,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = copied ? "rgba(52,211,153,0.35)" : "rgba(212,175,55,0.28)"; e.currentTarget.style.boxShadow = "none"; }}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: copied ? "rgba(52,211,153,0.08)" : "rgba(212,175,55,0.05)", border: `1px solid ${copied ? "rgba(52,211,153,0.35)" : "rgba(212,175,55,0.28)"}`, borderRadius: "10px", cursor: "pointer", transition: "all .3s", fontFamily: "'Cinzel',serif" }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "6px", color: "rgba(212,175,55,0.45)", letterSpacing: "2px", marginBottom: "2px" }}>TU CÓDIGO ALIANZA</div>
                  <div style={{ fontSize: "clamp(14px,2.5vw,18px)", fontWeight: 900, letterSpacing: "0.2em", background: "linear-gradient(90deg,#ffe87a,#d4af37,#fde68a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "monospace", animation: "goldShimmer 3s linear infinite", backgroundSize: "200% auto" }}>{codigo}</div>
                </div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: "8px", fontWeight: 900, letterSpacing: "1.5px", color: copied ? "#34d399" : "#d4af37", background: copied ? "rgba(52,211,153,0.1)" : "rgba(212,175,55,0.1)", border: `1px solid ${copied ? "rgba(52,211,153,0.35)" : "rgba(212,175,55,0.35)"}`, padding: "5px 10px", borderRadius: "8px", boxShadow: copied ? "0 0 12px rgba(52,211,153,0.3)" : "0 0 12px rgba(212,175,55,0.2)" }}>
                  {copied ? "✓ OK" : "COPIAR"}
                </div>
              </button>
            )}

            {/* Cupón urgente — mismo estilo que badge VIP ACTIVO */}
            {cupones > 0 && (
              <Link to="/alianza"
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(251,191,36,0.6)"; e.currentTarget.style.boxShadow = "0 0 24px rgba(251,191,36,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(251,191,36,0.3)"; e.currentTarget.style.boxShadow = "none"; }}
                style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "10px", textDecoration: "none", transition: "all .3s", animation: "vipCrownFloat 2.5s ease-in-out infinite", boxShadow: "inset 0 1px 0 rgba(255,230,120,0.1)" }}>
                <span style={{ fontSize: "16px", filter: "drop-shadow(0 0 8px rgba(251,191,36,0.9))" }}>🎟</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: "9px", fontWeight: 900, color: "#fde68a", letterSpacing: "1px", textShadow: "0 0 10px rgba(251,191,36,0.8)" }}>{cupones} cupón{cupones !== 1 ? "es" : ""} listo{cupones !== 1 ? "s" : ""} para canjear</div>
                  <div style={{ fontFamily: "'Raleway',sans-serif", fontSize: "9px", color: "rgba(212,175,55,0.55)", marginTop: "1px" }}>$1 USD → +1 mes del Templo</div>
                </div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: "10px", color: "#fde68a", textShadow: "0 0 8px rgba(251,191,36,0.8)" }}>→</div>
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}