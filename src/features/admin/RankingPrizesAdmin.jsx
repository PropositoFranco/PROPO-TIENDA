import { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";

/* ── Palette ─────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}

  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes toast-in{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:none}}
  @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0)}50%{box-shadow:0 0 0 6px rgba(212,175,55,0.18)}}
  @keyframes awardPulse{0%,100%{box-shadow:0 4px 24px rgba(74,222,128,.35)}50%{box-shadow:0 0 40px rgba(74,222,128,.8),0 0 80px rgba(74,222,128,.3)}}

  body{background:linear-gradient(160deg,#0d0300 0%,#1a0600 40%,#0a0200 100%);min-height:100vh;font-family:'Crimson Text',Georgia,serif;}

  .rp-wrap{
    position:fixed;top:0;left:0;right:0;bottom:0;
    overflow-y:auto;
    background:linear-gradient(160deg,#0d0300 0%,#1a0600 40%,#0a0200 100%);
  }
  .rp-page{max-width:1000px;margin:0 auto;padding:32px 24px 100px;}

  .rp-back{display:inline-flex;align-items:center;gap:6px;margin-bottom:24px;
    font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;color:rgba(245,200,70,.5);
    cursor:pointer;border:none;background:none;transition:color .2s;padding:0;}
  .rp-back:hover{color:#f5c842;}

  .rp-header{display:flex;align-items:center;gap:18px;margin-bottom:8px;animation:fadeUp .4s both;}
  .rp-header-icon{width:52px;height:52px;border-radius:14px;font-size:26px;
    display:flex;align-items:center;justify-content:center;
    background:linear-gradient(145deg,rgba(245,200,70,.18),rgba(30,14,0,1));
    border:1.5px solid rgba(245,200,70,.4);
    box-shadow:0 0 24px rgba(212,175,55,.25),inset 0 1px 0 rgba(255,255,255,.08);}
  .rp-title{font-family:'Cinzel',serif;font-size:24px;font-weight:900;letter-spacing:2px;
    background:linear-gradient(135deg,#f5c842 0%,#fffbe6 40%,#d97706 100%);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
  .rp-subtitle{font-size:14px;color:rgba(253,230,138,.5);letter-spacing:1px;margin-top:4px;}

  /* Layout 2 cols */
  .rp-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;}
  @media(max-width:700px){.rp-grid{grid-template-columns:1fr;}}

  /* Card */
  .rp-card{
    background:linear-gradient(145deg,rgba(38,16,0,.97),rgba(18,6,0,.99));
    border:1.5px solid rgba(245,200,70,.22);border-radius:18px;padding:24px 26px;
    position:relative;overflow:hidden;
    box-shadow:0 8px 40px rgba(0,0,0,.6),0 0 0 1px rgba(245,200,70,.05);
    animation:fadeUp .45s both;}
  .rp-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;
    background:linear-gradient(90deg,transparent,rgba(245,200,70,.5),rgba(255,255,255,.25),rgba(245,200,70,.5),transparent);}

  .rp-section{font-family:'Cinzel',serif;font-size:9px;letter-spacing:3px;
    color:rgba(245,200,70,.45);text-transform:uppercase;margin-bottom:18px;
    display:flex;align-items:center;gap:8px;}
  .rp-section::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(245,200,70,.2),transparent);}

  /* Prize row */
  .prize-row{
    display:grid;grid-template-columns:38px 1fr 100px 100px 36px;
    gap:10px;align-items:center;
    padding:10px 0;border-bottom:1px solid rgba(245,200,70,.08);}
  .prize-row:last-child{border-bottom:none;}

  .prize-pos{
    width:34px;height:34px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-family:'Cinzel',serif;font-size:11px;font-weight:900;flex-shrink:0;}
  .pos-1{background:rgba(201,168,76,.25);border:1.5px solid #c9a84c;color:#ffe87a;}
  .pos-2{background:rgba(145,166,210,.18);border:1.5px solid #91a6d2;color:#c0d4f0;}
  .pos-3{background:rgba(180,110,60,.2);border:1.5px solid #b46e3c;color:#e8a060;}
  .pos-n{background:rgba(255,255,255,.04);border:1px solid rgba(245,200,70,.15);color:rgba(245,200,70,.5);}

  .prize-label{font-family:'Cinzel',serif;font-size:10px;color:rgba(253,230,138,.6);letter-spacing:1px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

  .prize-input{
    width:100%;padding:7px 10px;border-radius:8px;text-align:center;
    background:rgba(255,255,255,.04);border:1px solid rgba(245,200,70,.2);
    font-family:'Cinzel',serif;font-size:13px;font-weight:700;color:#f5c842;
    outline:none;transition:border-color .2s,box-shadow .2s;}
  .prize-input:focus{border-color:rgba(245,200,70,.5);box-shadow:0 0 0 3px rgba(212,175,55,.1);}
  .prize-input.coins{color:#60a5fa;}
  .prize-input.coins:focus{border-color:rgba(96,165,250,.5);box-shadow:0 0 0 3px rgba(96,165,250,.1);}
  .prize-input:disabled{opacity:.35;cursor:not-allowed;}

  /* Toggle mini */
  .toggle-mini{position:relative;width:36px;height:20px;flex-shrink:0;}
  .toggle-mini input{opacity:0;width:0;height:0;}
  .toggle-mini-slider{position:absolute;inset:0;border-radius:20px;cursor:pointer;
    background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);transition:.3s;}
  .toggle-mini-slider::before{content:'';position:absolute;width:14px;height:14px;border-radius:50%;
    left:2px;top:2px;background:rgba(255,255,255,.3);transition:.3s;}
  input:checked+.toggle-mini-slider{background:linear-gradient(135deg,#f5c842,#d97706);
    border-color:rgba(245,200,70,.5);}
  input:checked+.toggle-mini-slider::before{transform:translateX(16px);background:#fff;}

  /* Legend */
  .prize-legend{display:flex;gap:16px;margin-bottom:14px;flex-wrap:wrap;}
  .prize-legend span{font-family:'Cinzel',serif;font-size:8px;letter-spacing:2px;
    color:rgba(245,200,70,.4);display:flex;align-items:center;gap:5px;}
  .dot-xp{width:8px;height:8px;border-radius:50%;background:#f5c842;flex-shrink:0;}
  .dot-coins{width:8px;height:8px;border-radius:50%;background:#60a5fa;flex-shrink:0;}

  /* Preview panel */
  .preview-row{display:flex;align-items:center;gap:10px;padding:10px 0;
    border-bottom:1px solid rgba(245,200,70,.06);}
  .preview-row:last-child{border-bottom:none;}
  .preview-pos{width:28px;text-align:center;font-family:'Cinzel',serif;font-size:11px;
    color:rgba(245,200,70,.5);flex-shrink:0;}
  .preview-name{flex:1;min-width:0;font-family:'Cinzel',serif;font-size:11px;
    color:#fde68a;letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .preview-pts{font-size:11px;color:rgba(245,200,70,.5);flex-shrink:0;letter-spacing:1px;}
  .preview-prize{display:flex;gap:6px;flex-shrink:0;}
  .preview-chip{font-family:'Cinzel',serif;font-size:9px;font-weight:700;letter-spacing:1px;
    padding:2px 8px;border-radius:20px;white-space:nowrap;}
  .chip-xp{background:rgba(245,200,70,.12);border:1px solid rgba(245,200,70,.3);color:#f5c842;}
  .chip-coins{background:rgba(96,165,250,.1);border:1px solid rgba(96,165,250,.3);color:#60a5fa;}
  .chip-none{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);
    color:rgba(255,255,255,.2);font-size:8px;}

  /* Buttons */
  .rp-save{width:100%;padding:13px;border-radius:12px;border:none;cursor:pointer;
    font-family:'Cinzel',serif;font-size:11px;letter-spacing:3px;font-weight:900;
    background:linear-gradient(135deg,#f5c842 0%,#d97706 60%,#92400e 100%);
    color:#1a0800;transition:all .25s;margin-top:16px;
    box-shadow:0 4px 24px rgba(212,175,55,.35),inset 0 1px 0 rgba(255,255,255,.2);}
  .rp-save:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 32px rgba(212,175,55,.5);}
  .rp-save:disabled{opacity:.5;cursor:default;}

  .rp-award{width:100%;padding:15px;border-radius:14px;border:none;cursor:pointer;
    font-family:'Cinzel',serif;font-size:12px;letter-spacing:3px;font-weight:900;
    background:linear-gradient(135deg,#166534 0%,#15803d 50%,#4ade80 100%);
    color:#fff;transition:all .25s;
    box-shadow:0 4px 24px rgba(74,222,128,.35),inset 0 1px 0 rgba(255,255,255,.15);
    animation:awardPulse 2.5s ease-in-out infinite;}
  .rp-award:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.1);}
  .rp-award:disabled{opacity:.5;cursor:default;animation:none;}

  /* Banner info */
  .rp-info-banner{
    display:flex;align-items:center;gap:12px;
    background:rgba(245,200,70,.06);border:1px solid rgba(245,200,70,.2);
    border-radius:12px;padding:12px 16px;margin-bottom:20px;
    animation:fadeUp .4s .1s both;}
  .rp-info-text{font-size:13px;color:rgba(253,230,138,.55);line-height:1.6;}

  /* Toast */
  .rp-toast{position:fixed;bottom:28px;right:24px;z-index:9999;
    background:linear-gradient(135deg,rgba(38,18,0,.97),rgba(20,8,0,.99));
    border:1.5px solid rgba(245,200,70,.4);border-radius:14px;
    padding:14px 20px;font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;
    color:#f5c842;box-shadow:0 8px 32px rgba(0,0,0,.6),0 0 20px rgba(212,175,55,.2);
    animation:toast-in .3s both;display:flex;align-items:center;gap:10px;}
  .rp-spin{width:16px;height:16px;border:2px solid rgba(245,200,70,.2);
    border-top-color:#f5c842;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}

  .empty-preview{text-align:center;padding:30px;color:rgba(253,230,138,.3);
    font-style:italic;font-size:14px;}

  /* Result modal */
  .rp-result{
    position:fixed;inset:0;z-index:9998;
    background:rgba(0,0,0,.85);
    display:flex;align-items:center;justify-content:center;padding:20px;}
  .rp-result-box{
    background:linear-gradient(145deg,rgba(38,16,0,.99),rgba(18,6,0,1));
    border:1.5px solid rgba(245,200,70,.35);border-radius:20px;
    padding:32px;max-width:480px;width:100%;
    box-shadow:0 16px 60px rgba(0,0,0,.8),0 0 40px rgba(212,175,55,.15);
    animation:fadeUp .4s both;}
  .rp-result-title{font-family:'Cinzel',serif;font-size:18px;font-weight:900;
    color:#f5c842;letter-spacing:2px;margin-bottom:20px;text-align:center;}
  .result-row{display:flex;align-items:center;justify-content:space-between;
    padding:8px 0;border-bottom:1px solid rgba(245,200,70,.08);gap:10px;}
  .result-row:last-child{border-bottom:none;}
  .result-name{font-family:'Cinzel',serif;font-size:12px;color:#fde68a;flex:1;}
  .result-rewards{display:flex;gap:6px;}
  .rp-close{margin-top:20px;width:100%;padding:11px;border-radius:10px;border:none;
    cursor:pointer;font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;
    background:rgba(245,200,70,.1);border:1px solid rgba(245,200,70,.25);
    color:#f5c842;transition:all .2s;}
  .rp-close:hover{background:rgba(245,200,70,.2);}
`;

const MEDAL = { 1:'👑', 2:'🥈', 3:'🥉' };

export default function RankingPrizesAdmin() {
  const [prizes,   setPrizes]   = useState([]);
  const [top10,    setTop10]    = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [awarding, setAwarding] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);
  const [result,   setResult]   = useState(null); // awarded results

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: prizeData }, { data: playerData }] = await Promise.all([
      supabase.from('ranking_prizes').select('*').order('position'),
      supabase.from('templo_players')
        .select('id, char_name, weekly_points')
        .order('weekly_points', { ascending: false })
        .limit(10),
    ]);

    // Get profile names
    const ids = (playerData || []).map(p => p.id);
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, templario_name')
      .in('id', ids);
    const nameMap = {};
    (profileData || []).forEach(p => { nameMap[p.id] = p.templario_name; });

    setPrizes(prizeData || []);
    setTop10((playerData || []).map(p => ({
      ...p,
      name: nameMap[p.id] || p.char_name || 'Templario',
    })));
    setLoading(false);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function updatePrize(position, field, value) {
    setPrizes(prev => prev.map(p =>
      p.position === position ? { ...p, [field]: value } : p
    ));
  }

  async function handleSave() {
    setSaving(true);
    try {
      for (const prize of prizes) {
        const { error } = await supabase
          .from('ranking_prizes')
          .update({
            xp_reward:    parseInt(prize.xp_reward)    || 0,
            coins_reward: parseInt(prize.coins_reward) || 0,
            is_active:    prize.is_active,
            label:        prize.label || '',
            updated_at:   new Date().toISOString(),
          })
          .eq('position', prize.position);
        if (error) throw error;
      }
      showToast('✅ Premios guardados');
      fetchAll();
    } catch (err) {
      showToast('❌ ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAward() {
    if (!window.confirm('¿Entregar premios a los jugadores del top ahora?\n\nEsto sumará XP y Cristales a sus perfiles de forma permanente.')) return;
    setAwarding(true);
    const awarded = [];
    try {
      // Fresh ranking
      const { data: players } = await supabase
        .from('templo_players')
        .select('id, char_name, weekly_points')
        .order('weekly_points', { ascending: false })
        .limit(10);

      // Fresh prizes
      const { data: activePrizes } = await supabase
        .from('ranking_prizes')
        .select('*')
        .eq('is_active', true)
        .order('position');

      const profileIds = (players || []).map(p => p.id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, templario_name, xp, cristales')
        .in('id', profileIds);

      const profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p; });
      const nameMap = {};
      (profiles || []).forEach(p => { nameMap[p.id] = p.templario_name; });

      for (const prize of (activePrizes || [])) {
        const player = (players || [])[prize.position - 1];
        if (!player) continue;
        if ((player.weekly_points || 0) <= 0) continue; // no puntos = no premio

        const profile = profileMap[player.id];
        if (!profile) continue;

        const newXp       = (profile.xp       || 0) + (prize.xp_reward    || 0);
        const newCristales = (profile.cristales || 0) + (prize.coins_reward || 0);

        const { error } = await supabase
          .from('profiles')
          .update({ xp: newXp, cristales: newCristales, updated_at: new Date().toISOString() })
          .eq('id', player.id);

        if (!error) {
          awarded.push({
            pos:      prize.position,
            name:     nameMap[player.id] || player.char_name || 'Templario',
            xp:       prize.xp_reward,
            cristales: prize.coins_reward,
          });
        }
      }

      setResult(awarded);
      showToast(`🏆 Premios entregados a ${awarded.length} jugadores`);
    } catch (err) {
      showToast('❌ ' + err.message);
    } finally {
      setAwarding(false);
    }
  }

  const prizeMap = {};
  prizes.forEach(p => { prizeMap[p.position] = p; });

  return (
    <>
      <style>{css}</style>
      <div className="rp-wrap">
        <div className="rp-page">

          {/* Back */}
          <button className="rp-back" onClick={() => window.history.back()}>
            ← PANEL ADMIN
          </button>

          {/* Header */}
          <div className="rp-header">
            <div className="rp-header-icon">🏆</div>
            <div>
              <div className="rp-title">Premios de Ranking</div>
              <div className="rp-subtitle">Configura y entrega premios al Top 10 semanal</div>
            </div>
          </div>

          {/* Info banner */}
          <div className="rp-info-banner" style={{ marginTop: 20 }}>
            <span style={{ fontSize: 22 }}>ℹ️</span>
            <div className="rp-info-text">
              Configura cuánta <strong style={{ color: '#f5c842' }}>XP</strong> y cuántos{' '}
              <strong style={{ color: '#60a5fa' }}>Cristales</strong> recibe cada posición.
              Desactiva posiciones que no quieras premiar. Al dar <strong style={{ color: '#4ade80' }}>Entregar Premios</strong>,
              se suman automáticamente a los perfiles del Top actual (solo jugadores con puntos).
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div className="rp-spin" />
            </div>
          ) : (
            <div className="rp-grid">

              {/* ── LEFT: Configuración ── */}
              <div className="rp-card">
                <div className="rp-section">⚙ Configurar premios</div>
                <div className="prize-legend">
                  <span><div className="dot-xp" /> XP</span>
                  <span><div className="dot-coins" /> Cristales</span>
                </div>

                {prizes.map((prize) => (
                  <div key={prize.position} className="prize-row"
                    style={{ opacity: prize.is_active ? 1 : 0.4 }}>

                    {/* Posición badge */}
                    <div className={`prize-pos ${prize.position <= 3 ? `pos-${prize.position}` : 'pos-n'}`}>
                      {MEDAL[prize.position] || prize.position}
                    </div>

                    {/* Label editable */}
                    <input
                      className="prize-input"
                      style={{ fontSize: 10, color: 'rgba(253,230,138,.7)', textAlign: 'left', padding: '5px 8px' }}
                      value={prize.label || ''}
                      disabled={!prize.is_active}
                      onChange={e => updatePrize(prize.position, 'label', e.target.value)}
                      placeholder={`${prize.position}° Lugar`}
                    />

                    {/* XP */}
                    <input
                      className="prize-input"
                      type="number" min="0"
                      value={prize.xp_reward}
                      disabled={!prize.is_active}
                      onChange={e => updatePrize(prize.position, 'xp_reward', e.target.value)}
                      title="XP"
                    />

                    {/* Cristales */}
                    <input
                      className="prize-input coins"
                      type="number" min="0"
                      value={prize.coins_reward}
                      disabled={!prize.is_active}
                      onChange={e => updatePrize(prize.position, 'coins_reward', e.target.value)}
                      title="Cristales"
                    />

                    {/* Toggle */}
                    <label className="toggle-mini">
                      <input
                        type="checkbox"
                        checked={prize.is_active}
                        onChange={e => updatePrize(prize.position, 'is_active', e.target.checked)}
                      />
                      <span className="toggle-mini-slider" />
                    </label>
                  </div>
                ))}

                <button className="rp-save" onClick={handleSave} disabled={saving}>
                  {saving ? 'GUARDANDO…' : '💾 GUARDAR CONFIGURACIÓN'}
                </button>
              </div>

              {/* ── RIGHT: Preview + Entregar ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="rp-card">
                  <div className="rp-section">👁 Top actual · ¿Quién recibiría?</div>

                  {top10.length === 0 ? (
                    <div className="empty-preview">Sin jugadores aún</div>
                  ) : (
                    top10.map((player, idx) => {
                      const pos    = idx + 1;
                      const prize  = prizeMap[pos];
                      const active = prize?.is_active;
                      const hasXp  = active && (prize?.xp_reward    || 0) > 0;
                      const hasCr  = active && (prize?.coins_reward  || 0) > 0;
                      const noPts  = (player.weekly_points || 0) <= 0;
                      return (
                        <div key={player.id} className="preview-row">
                          <div className="preview-pos">
                            {MEDAL[pos] || pos}
                          </div>
                          <div className="preview-name" title={player.name}>
                            {player.name}
                          </div>
                          <div className="preview-pts">
                            {player.weekly_points || 0} pts
                          </div>
                          <div className="preview-prize">
                            {noPts ? (
                              <span className="preview-chip chip-none">sin pts</span>
                            ) : !active ? (
                              <span className="preview-chip chip-none">inactivo</span>
                            ) : (
                              <>
                                {hasXp && <span className="preview-chip chip-xp">+{prize.xp_reward} XP</span>}
                                {hasCr && <span className="preview-chip chip-coins">+{prize.coins_reward} 💎</span>}
                                {!hasXp && !hasCr && <span className="preview-chip chip-none">0</span>}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Botón Entregar */}
                <div className="rp-card">
                  <div className="rp-section">🎖 Entregar premios ahora</div>
                  <div style={{ fontSize: 13, color: 'rgba(253,230,138,.45)', marginBottom: 16, lineHeight: 1.6 }}>
                    Suma XP y Cristales a los jugadores del Top según la configuración activa.
                    Solo players con puntos reciben premio.
                  </div>
                  <button
                    className="rp-award"
                    onClick={handleAward}
                    disabled={awarding || prizes.filter(p => p.is_active).length === 0}
                  >
                    {awarding ? '⚡ ENTREGANDO…' : '🏆 ENTREGAR PREMIOS'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Toast */}
      {toast && <div className="rp-toast">{toast}</div>}

      {/* Result modal */}
      {result && (
        <div className="rp-result">
          <div className="rp-result-box">
            <div className="rp-result-title">🏆 Premios Entregados</div>
            {result.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(253,230,138,.4)', padding: '20px 0' }}>
                Ningún jugador elegible (sin puntos)
              </div>
            ) : result.map((r, i) => (
              <div key={i} className="result-row">
                <div className="result-name">
                  {MEDAL[r.pos] || r.pos} {r.name}
                </div>
                <div className="result-rewards">
                  {r.xp > 0 && <span className="preview-chip chip-xp">+{r.xp} XP</span>}
                  {r.cristales > 0 && <span className="preview-chip chip-coins">+{r.cristales} 💎</span>}
                </div>
              </div>
            ))}
            <button className="rp-close" onClick={() => setResult(null)}>CERRAR</button>
          </div>
        </div>
      )}
    </>
  );
}