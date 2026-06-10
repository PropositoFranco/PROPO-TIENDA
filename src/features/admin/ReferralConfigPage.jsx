import { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}

  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pop{0%{transform:scale(.92);opacity:0}60%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
  @keyframes toast-in{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:none}}


    .rc-page{min-height:100vh;padding:32px 24px 80px;max-width:920px;margin:0 auto;
  overflow-y:auto;
  font-family:'Crimson Text',Georgia,serif;color:#fde68a;}

  .rc-back{display:inline-flex;align-items:center;gap:6px;margin-bottom:24px;
    font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;color:rgba(245,200,70,.5);
    cursor:pointer;border:none;background:none;transition:color .2s;padding:0;}
  .rc-back:hover{color:#f5c842;}

  .rc-header{display:flex;align-items:center;gap:18px;margin-bottom:32px;animation:fadeUp .4s both;}
  .rc-header-icon{width:52px;height:52px;border-radius:14px;font-size:26px;
    display:flex;align-items:center;justify-content:center;
    background:linear-gradient(145deg,rgba(245,200,70,.18),rgba(30,14,0,1));
    border:1.5px solid rgba(245,200,70,.4);
    box-shadow:0 0 24px rgba(212,175,55,.25),inset 0 1px 0 rgba(255,255,255,.08);}
  .rc-title{font-family:'Cinzel',serif;font-size:24px;font-weight:900;letter-spacing:2px;
    background:linear-gradient(135deg,#f5c842 0%,#fffbe6 40%,#d97706 100%);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
  .rc-subtitle{font-size:14px;color:rgba(253,230,138,.5);letter-spacing:1px;margin-top:4px;}

  /* Divider ornamental */
  .rc-divider{display:flex;align-items:center;gap:10px;margin:8px 0 24px;opacity:.35;}
  .rc-divline{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(245,200,70,.5),transparent);}

  /* Card */
  .rc-card{
    background:linear-gradient(145deg,rgba(38,16,0,.97),rgba(18,6,0,.99));
    border:1.5px solid rgba(245,200,70,.22);border-radius:18px;padding:28px 30px;
    position:relative;overflow:hidden;margin-bottom:20px;
    box-shadow:0 8px 40px rgba(0,0,0,.6),0 0 0 1px rgba(245,200,70,.05);
    animation:fadeUp .45s both;}
  .rc-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;
    background:linear-gradient(90deg,transparent,rgba(245,200,70,.5),rgba(255,255,255,.25),rgba(245,200,70,.5),transparent);}

  .rc-section{font-family:'Cinzel',serif;font-size:9px;letter-spacing:3px;
    color:rgba(245,200,70,.45);text-transform:uppercase;margin-bottom:18px;
    display:flex;align-items:center;gap:8px;}
  .rc-section::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(245,200,70,.2),transparent);}

  /* Grid 2 cols */
  .rc-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
  @media(max-width:640px){.rc-grid{grid-template-columns:1fr;}}
  .rc-full{grid-column:1/-1;}

  /* Field */
  .rc-field{display:flex;flex-direction:column;gap:6px;margin-bottom:4px;}
  .rc-label{font-family:'Cinzel',serif;font-size:9px;letter-spacing:2.5px;
    color:rgba(245,200,70,.55);text-transform:uppercase;display:flex;align-items:center;gap:6px;}
  .badge{font-size:8px;padding:1px 7px;border-radius:20px;letter-spacing:1px;
    border:1px solid;font-family:'Cinzel',serif;}
  .badge-b   {background:rgba(96,165,250,.12);border-color:rgba(96,165,250,.35);color:#93c5fd;}
  .badge-a   {background:rgba(245,200,70,.1); border-color:rgba(245,200,70,.35); color:#f5c842;}
  .badge-both{background:rgba(167,139,250,.1);border-color:rgba(167,139,250,.35);color:#c4b5fd;}

  .rc-input{width:100%;padding:11px 14px;border-radius:10px;
    background:rgba(255,255,255,.04);border:1px solid rgba(245,200,70,.22);
    font-family:'Crimson Text',serif;font-size:15px;color:#fde68a;
    outline:none;transition:border-color .25s,box-shadow .25s;}
  .rc-input:focus{border-color:rgba(245,200,70,.5);box-shadow:0 0 0 3px rgba(212,175,55,.12);}
  .rc-input::placeholder{color:rgba(253,230,138,.2);}
  .rc-hint{font-size:12px;color:rgba(253,230,138,.3);margin-top:2px;}

  /* Rewards */
  .rc-rewards{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:0;}
  @media(max-width:640px){.rc-rewards{grid-template-columns:1fr;}}
  .rc-reward-box{border-radius:12px;padding:14px 16px;
    border:1px solid rgba(245,200,70,.18);background:rgba(245,200,70,.05);}
  .rc-reward-box label{font-family:'Cinzel',serif;font-size:9px;letter-spacing:2px;
    color:rgba(245,200,70,.5);display:block;margin-bottom:8px;}
  .rc-reward-input{width:100%;background:transparent;border:none;border-bottom:1px solid rgba(245,200,70,.2);
    padding:4px 0;font-family:'Cinzel',serif;font-size:22px;font-weight:900;color:#f5c842;
    outline:none;text-align:center;transition:border-color .2s;}
  .rc-reward-input:focus{border-bottom-color:rgba(245,200,70,.5);}

  /* Toggle */
  .rc-toggle-row{display:flex;align-items:center;justify-content:space-between;gap:12px;
    padding:16px 0;border-top:1px solid rgba(245,200,70,.1);border-bottom:1px solid rgba(245,200,70,.1);
    margin:20px 0;}
  .rc-toggle-info h4{font-family:'Cinzel',serif;font-size:12px;color:#fde68a;letter-spacing:1px;}
  .rc-toggle-info p{font-size:13px;color:rgba(253,230,138,.4);margin-top:3px;}
  .toggle-wrap{position:relative;width:42px;height:22px;flex-shrink:0;}
  .toggle-wrap input{opacity:0;width:0;height:0;}
  .toggle-slider{position:absolute;inset:0;border-radius:22px;cursor:pointer;
    background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);transition:.3s;}
  .toggle-slider::before{content:'';position:absolute;width:16px;height:16px;border-radius:50%;
    left:2px;top:2px;background:rgba(255,255,255,.3);transition:.3s;}
  input:checked+.toggle-slider{background:linear-gradient(135deg,#f5c842,#d97706);
    border-color:rgba(245,200,70,.5);box-shadow:0 0 12px rgba(212,175,55,.3);}
  input:checked+.toggle-slider::before{transform:translateX(20px);background:#fff;}

  /* Status dot */
  .rc-status-active  {color:#4ade80;}
  .rc-status-inactive{color:rgba(255,255,255,.3);}

  /* Save button */
  .rc-save{width:100%;padding:14px;border-radius:12px;border:none;cursor:pointer;
    font-family:'Cinzel',serif;font-size:12px;letter-spacing:3px;font-weight:900;
    background:linear-gradient(135deg,#f5c842 0%,#d97706 60%,#92400e 100%);
    color:#1a0800;transition:all .25s;margin-top:8px;
    box-shadow:0 4px 24px rgba(212,175,55,.35),inset 0 1px 0 rgba(255,255,255,.2);}
  .rc-save:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 32px rgba(212,175,55,.5);}
  .rc-save:disabled{opacity:.5;cursor:default;transform:none;}

  /* Events table */
  .rc-table{width:100%;border-collapse:collapse;font-size:14px;}
  .rc-table th{font-family:'Cinzel',serif;font-size:9px;letter-spacing:2px;
    color:rgba(245,200,70,.45);padding:10px 12px;border-bottom:1px solid rgba(245,200,70,.15);
    text-align:left;font-weight:600;}
  .rc-table td{padding:12px;border-bottom:1px solid rgba(255,255,255,.05);
    color:rgba(253,230,138,.8);vertical-align:middle;}
  .rc-table tr:hover td{background:rgba(245,200,70,.03);}
  .rc-code{font-family:'Courier New',monospace;font-size:12px;
    background:rgba(245,200,70,.08);border:1px solid rgba(245,200,70,.2);
    border-radius:6px;padding:3px 8px;color:#f5c842;letter-spacing:1px;}
  .rc-empty{text-align:center;padding:40px;color:rgba(253,230,138,.3);
    font-style:italic;font-size:15px;}

  /* Toast */
  .rc-toast{position:fixed;bottom:28px;right:24px;z-index:9999;
    background:linear-gradient(135deg,rgba(38,18,0,.97),rgba(20,8,0,.99));
    border:1.5px solid rgba(245,200,70,.4);border-radius:14px;
    padding:14px 20px;font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;
    color:#f5c842;box-shadow:0 8px 32px rgba(0,0,0,.6),0 0 20px rgba(212,175,55,.2);
    animation:toast-in .3s both;display:flex;align-items:center;gap:10px;}

  /* Spinner */
  .rc-spin{width:16px;height:16px;border:2px solid rgba(245,200,70,.2);
    border-top-color:#f5c842;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}

  /* Active config banner */
  .rc-active-banner{
    display:flex;align-items:center;justify-content:space-between;
    background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.3);
    border-radius:12px;padding:12px 18px;margin-bottom:20px;
    animation:fadeUp .4s .1s both;}
  .rc-active-name{font-family:'Cinzel',serif;font-size:13px;color:#4ade80;letter-spacing:1px;}
  .rc-active-sub{font-size:12px;color:rgba(74,222,128,.6);margin-top:2px;}
`;

const EMPTY = {
  name: "",
  is_active: true,
  stripe_link_b: "",
  stripe_coupon_b: "",
  xp_reward_a: 500,
  coins_reward_a: 2000,
  stripe_coupon_a: "",
  coupon_label_a: "",
  share_coupon: false,
};

export default function ReferralConfigPage() {
  const [configs,  setConfigs]  = useState([]);
  const [events,   setEvents]   = useState([]);
  const [form,     setForm]     = useState(EMPTY);
  const [editId,   setEditId]   = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);
  const [tab,      setTab]      = useState("config"); // "config" | "events"

  // ── fetch ────────────────────────────────────────────────
  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: cfgs }, { data: evts }] = await Promise.all([
      supabase.from("referral_configs").select("*").order("created_at", { ascending: false }),
      supabase.from("referral_events")
        .select("*, referrer:referrer_id(templario_name), referred:referred_id(templario_name)")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setConfigs(cfgs || []);
    setEvents(evts || []);
    setLoading(false);
  }

  // ── toast ────────────────────────────────────────────────
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ── load config into form ────────────────────────────────
  function loadEdit(cfg) {
    setForm({ ...cfg });
    setEditId(cfg.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(EMPTY);
    setEditId(null);
  }

  // ── save ─────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim()) { showToast("⚠️ El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      const payload = {
        name:            form.name.trim(),
        is_active:       form.is_active,
        stripe_link_b:   form.stripe_link_b.trim()   || null,
        stripe_coupon_b: form.stripe_coupon_b.trim().toUpperCase() || null,
        xp_reward_a:     parseInt(form.xp_reward_a)  || 0,
        coins_reward_a:  parseInt(form.coins_reward_a)|| 0,
        stripe_coupon_a: form.stripe_coupon_a.trim().toUpperCase() || null,
        coupon_label_a:  form.coupon_label_a.trim()  || null,
        share_coupon:    form.share_coupon,
      };

      if (editId) {
        const { error } = await supabase.from("referral_configs").update(payload).eq("id", editId);
        if (error) throw error;
        showToast("✅ Configuración actualizada");
      } else {
        const { error } = await supabase.from("referral_configs").insert(payload);
        if (error) throw error;
        showToast("✅ Configuración creada");
      }
      resetForm();
      fetchAll();
    } catch (err) {
      showToast("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── toggle active ─────────────────────────────────────────
  async function toggleActive(cfg) {
    await supabase.from("referral_configs").update({ is_active: !cfg.is_active }).eq("id", cfg.id);
    showToast(cfg.is_active ? "⏸ Desactivada" : "▶️ Activada");
    fetchAll();
  }

  // ── delete ────────────────────────────────────────────────
  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar esta configuración?")) return;
    await supabase.from("referral_configs").delete().eq("id", id);
    showToast("🗑️ Eliminada");
    if (editId === id) resetForm();
    fetchAll();
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const activeConfig = configs.find(c => c.is_active);

  // ── render ────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
<div style={{
  background: "linear-gradient(160deg,#0d0300 0%,#1a0600 40%,#0a0200 100%)",
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  overflowY: "auto"
}}>
  <div className="rc-page">

        {/* Back */}
        <button className="rc-back" onClick={() => window.history.back()}>
          ← PANEL ADMIN
        </button>

        {/* Header */}
        <div className="rc-header">
          <div className="rc-header-icon">🔗</div>
          <div>
            <div className="rc-title">Sistema de Referidos</div>
            <div className="rc-subtitle">Configura recompensas y cupones Stripe</div>
          </div>
        </div>

        {/* Active config banner */}
        {activeConfig && (
          <div className="rc-active-banner">
            <div>
              <div className="rc-active-name">⚡ Activa: {activeConfig.name}</div>
              <div className="rc-active-sub">
                +{activeConfig.xp_reward_a} XP · +{activeConfig.coins_reward_a} 🪙 · Cupón B: {activeConfig.stripe_coupon_b || "—"}
              </div>
            </div>
            <span style={{ color: "#4ade80", fontSize: 20 }}>✓</span>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {["config", "events"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "9px 20px", borderRadius: 10, border: "1.5px solid",
              borderColor: tab === t ? "rgba(245,200,70,.5)" : "rgba(245,200,70,.15)",
              background: tab === t ? "rgba(245,200,70,.1)" : "transparent",
              color: tab === t ? "#f5c842" : "rgba(253,230,138,.4)",
              fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 2,
              cursor: "pointer", transition: "all .2s",
            }}>
              {t === "config" ? "⚙️ CONFIGURACIÓN" : "📊 EVENTOS"}
            </button>
          ))}
        </div>

        {/* ── TAB: CONFIG ── */}
        {tab === "config" && (
          <>
            {/* Form card */}
            <div className="rc-card">
              <div className="rc-section">{editId ? "✏️ Editar configuración" : "✦ Nueva configuración"}</div>

              <div className="rc-grid">
                {/* Nombre */}
                <div className="rc-field rc-full">
                  <label className="rc-label">Nombre de la campaña</label>
                  <input className="rc-input" placeholder="Ej: Membresía Templaria"
                    value={form.name} onChange={e => set("name", e.target.value)} />
                </div>

                {/* Stripe link B */}
                <div className="rc-field">
                  <label className="rc-label">
                    Link Stripe <span className="badge badge-b">USUARIO B</span>
                  </label>
                  <input className="rc-input" placeholder="https://buy.stripe.com/..."
                    value={form.stripe_link_b} onChange={e => set("stripe_link_b", e.target.value)} />
                  <span className="rc-hint">URL de pago donde redirige al nuevo usuario</span>
                </div>

                {/* Coupon B */}
                <div className="rc-field">
                  <label className="rc-label">
                    Cupón Stripe <span className="badge badge-b">USUARIO B</span>
                  </label>
                  <input className="rc-input" placeholder="BIENVENIDO20"
                    value={form.stripe_coupon_b} onChange={e => set("stripe_coupon_b", e.target.value)} />
                  <span className="rc-hint">Se aplica automáticamente al checkout de B</span>
                </div>

                {/* Coupon A */}
                <div className="rc-field">
                  <label className="rc-label">
                    Cupón Stripe <span className="badge badge-a">REFERIDOR A</span>
                  </label>
                  <input className="rc-input" placeholder="GRACIAS15"
                    value={form.stripe_coupon_a} onChange={e => set("stripe_coupon_a", e.target.value)} />
                  <span className="rc-hint">Código que recibe A por referir</span>
                </div>

                {/* Coupon label A */}
                <div className="rc-field">
                  <label className="rc-label">
                    Texto del cupón <span className="badge badge-a">REFERIDOR A</span>
                  </label>
                  <input className="rc-input" placeholder="20% en tu próxima compra"
                    value={form.coupon_label_a} onChange={e => set("coupon_label_a", e.target.value)} />
                  <span className="rc-hint">Lo que ve A en su notificación</span>
                </div>
              </div>

              {/* Toggle: share_coupon */}
              <div className="rc-toggle-row">
                <div className="rc-toggle-info">
                  <h4>Compartir cupón <span className="badge badge-both">A y B</span></h4>
                  <p>Ambos reciben el mismo cupón de B (ignora el cupón de A)</p>
                </div>
                <label className="toggle-wrap">
                  <input type="checkbox" checked={form.share_coupon} onChange={e => set("share_coupon", e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>

              {/* Rewards */}
              <div className="rc-section">Recompensas para el referidor (A)</div>
              <div className="rc-rewards">
                <div className="rc-reward-box">
                  <label>XP GANADA ⚔️</label>
                  <input className="rc-reward-input" type="number" min="0"
                    value={form.xp_reward_a} onChange={e => set("xp_reward_a", e.target.value)} />
                </div>
                <div className="rc-reward-box">
                  <label>CRISTALES 🪙</label>
                  <input className="rc-reward-input" type="number" min="0"
                    value={form.coins_reward_a} onChange={e => set("coins_reward_a", e.target.value)} />
                </div>
              </div>

              {/* Toggle: is_active */}
              <div className="rc-toggle-row" style={{ marginTop: 20 }}>
                <div className="rc-toggle-info">
                  <h4>Campaña activa</h4>
                  <p>Solo una campaña activa se aplica a los nuevos registros</p>
                </div>
                <label className="toggle-wrap">
                  <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button className="rc-save" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                  {saving ? "GUARDANDO…" : editId ? "ACTUALIZAR CAMPAÑA" : "CREAR CAMPAÑA"}
                </button>
                {editId && (
                  <button onClick={resetForm} style={{
                    padding: "14px 20px", borderRadius: 12, border: "1px solid rgba(245,200,70,.2)",
                    background: "transparent", color: "rgba(253,230,138,.5)", fontFamily: "'Cinzel',serif",
                    fontSize: 11, letterSpacing: 2, cursor: "pointer",
                  }}>
                    CANCELAR
                  </button>
                )}
              </div>
            </div>

            {/* Lista de configs */}
            {loading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <div className="rc-spin" style={{ margin: "0 auto" }} />
              </div>
            ) : configs.length === 0 ? (
              <div className="rc-card rc-empty">No hay configuraciones aún. Crea la primera arriba.</div>
            ) : (
              configs.map((cfg, i) => (
                <div key={cfg.id} className="rc-card" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontFamily: "'Cinzel',serif", fontSize: 15, color: "#f5c842", letterSpacing: 1 }}>
                          {cfg.name}
                        </span>
                        <span className={cfg.is_active ? "rc-status-active" : "rc-status-inactive"}
                          style={{ fontSize: 11, fontFamily: "'Cinzel',serif", letterSpacing: 1 }}>
                          {cfg.is_active ? "● ACTIVA" : "○ INACTIVA"}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 13, color: "rgba(253,230,138,.6)" }}>
                        <span>+{cfg.xp_reward_a} XP</span>
                        <span>·</span>
                        <span>+{cfg.coins_reward_a} 🪙</span>
                        {cfg.stripe_coupon_b && <><span>·</span><span className="rc-code">{cfg.stripe_coupon_b}</span><span>(B)</span></>}
                        {cfg.stripe_coupon_a && <><span>·</span><span className="rc-code">{cfg.stripe_coupon_a}</span><span>(A)</span></>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => toggleActive(cfg)} style={btnSmall(cfg.is_active ? "#fca5a5" : "#4ade80")}>
                        {cfg.is_active ? "Pausar" : "Activar"}
                      </button>
                      <button onClick={() => loadEdit(cfg)} style={btnSmall("#f5c842")}>Editar</button>
                      <button onClick={() => handleDelete(cfg.id)} style={btnSmall("#f87171")}>✕</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── TAB: EVENTS ── */}
        {tab === "events" && (
          <div className="rc-card">
            <div className="rc-section">📊 Últimos 50 referidos</div>
            {loading ? (
              <div className="rc-spin" style={{ margin: "20px auto" }} />
            ) : events.length === 0 ? (
              <div className="rc-empty">Aún no hay referidos registrados.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="rc-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Referidor (A)</th>
                      <th>Nuevo usuario (B)</th>
                      <th>Cupón B</th>
                      <th>Cupón A</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(ev => (
                      <tr key={ev.id}>
                        <td style={{ fontSize: 12, color: "rgba(253,230,138,.45)", whiteSpace: "nowrap" }}>
                          {new Date(ev.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td style={{ fontFamily: "'Cinzel',serif", fontSize: 13 }}>
                          {ev.referrer?.templario_name || "—"}
                        </td>
                        <td style={{ fontFamily: "'Cinzel',serif", fontSize: 13 }}>
                          {ev.referred?.templario_name || "—"}
                        </td>
                        <td>{ev.coupon_sent_b ? <span className="rc-code">{ev.coupon_sent_b}</span> : <span style={{ color: "rgba(255,255,255,.2)" }}>—</span>}</td>
                        <td>{ev.coupon_sent_a ? <span className="rc-code">{ev.coupon_sent_a}</span> : <span style={{ color: "rgba(255,255,255,.2)" }}>—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>

      {/* Toast */}
      {toast && (
        <div className="rc-toast">
          {toast}
        </div>
      )}
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────
function btnSmall(color) {
  return {
    padding: "7px 12px", borderRadius: 8, border: `1px solid ${color}44`,
    background: `${color}11`, color, fontFamily: "'Cinzel',serif",
    fontSize: 10, letterSpacing: 1, cursor: "pointer", transition: "all .2s",
    whiteSpace: "nowrap",
  };
}
