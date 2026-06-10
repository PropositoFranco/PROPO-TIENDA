import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

const PRESET_LEVELS = [
  { label: 'Cada 3 niveles', value: 3, desc: 'Muy frecuente', color: '#44FF88' },
  { label: 'Cada 5 niveles', value: 5, desc: 'Recomendado', color: '#F4C542', popular: true },
  { label: 'Cada 10 niveles', value: 10, desc: 'Selectivo', color: '#70A0FF' },
  { label: 'Cada 15 niveles', value: 15, desc: 'Élite', color: '#FF9500' },
  { label: 'Cada 20 niveles', value: 20, desc: 'Legendario', color: '#FF4757' },
];

const PRESET_XP = [100, 200, 500, 1000, 2000];
const PRESET_COINS = [250, 500, 1000, 2500, 5000];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@700&family=Nunito:wght@400;600;700;800&display=swap');

  .mp-root {
    --gold: #F4C542;
    --gold2: #FFE580;
    --navy: #060112;
    --navy2: #0f0225;
    --card: rgba(18, 10, 48, 0.97);
    --border: rgba(212,175,55,0.25);
    --text: #F0EAD6;
    --text2: #C8B89A;
    --text3: #8A7A60;
    --green: #2ED573;
    --purple: #B44CFF;
    font-family: 'Nunito', sans-serif;
    background: linear-gradient(160deg, #060112 0%, #0f0225 50%, #060112 100%);
    position: fixed;
    inset: 0;
    overflow-y: scroll;
    padding: 2rem 1.5rem 4rem;
    color: var(--text);
  }

  .mp-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2.5rem;
  }

  .mp-header-icon {
    width: 56px; height: 56px;
    background: linear-gradient(135deg, #8A6020, #C9A84C, #F4C542);
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.8rem;
    box-shadow: 0 0 30px rgba(244,197,66,0.4);
  }

  .mp-title {
    font-family: 'Cinzel Decorative', serif;
    font-size: clamp(1rem, 3vw, 1.5rem);
    background: linear-gradient(135deg, #FFF3A0, #F4C542, #FF9500);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.2;
  }

  .mp-subtitle {
    font-family: 'Cinzel', serif;
    font-size: 0.65rem;
    letter-spacing: 0.25em;
    color: var(--text3);
    margin-top: 4px;
  }

  .mp-section {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 1.5rem;
    margin-bottom: 1.25rem;
    position: relative;
    overflow: hidden;
  }

  .mp-section::before {
    content: '';
    position: absolute;
    top: 0; left: 10%; right: 10%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(244,197,66,0.4), transparent);
  }

  .mp-section-title {
    font-family: 'Cinzel', serif;
    font-size: 0.7rem;
    letter-spacing: 0.22em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 1.2rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mp-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .mp-chip {
    position: relative;
    padding: 0.65rem 1.1rem;
    border-radius: 12px;
    border: 1.5px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    min-width: 90px;
  }

  .mp-chip:hover {
    border-color: rgba(244,197,66,0.4);
    background: rgba(244,197,66,0.06);
    transform: translateY(-2px);
  }

  .mp-chip.selected {
    border-color: var(--chip-color, var(--gold));
    background: color-mix(in srgb, var(--chip-color, var(--gold)) 12%, transparent);
    box-shadow: 0 0 24px color-mix(in srgb, var(--chip-color, var(--gold)) 35%, transparent);
    transform: translateY(-3px) scale(1.03);
  }

  .mp-chip-val {
    font-family: 'Cinzel', serif;
    font-size: 0.95rem;
    font-weight: 700;
    display: block;
  }

  .mp-chip-lbl {
    font-size: 0.6rem;
    color: var(--text3);
    display: block;
    margin-top: 2px;
    letter-spacing: 0.1em;
  }

  .mp-chip .popular-badge {
    position: absolute;
    top: -9px; left: 50%;
    transform: translateX(-50%);
    background: var(--gold);
    color: #1A0A00;
    font-size: 0.48rem;
    font-family: 'Cinzel', serif;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
    letter-spacing: 0.1em;
  }

  .mp-custom-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .mp-custom-label {
    font-family: 'Cinzel', serif;
    font-size: 0.65rem;
    color: var(--text3);
    letter-spacing: 0.15em;
    white-space: nowrap;
  }

  .mp-input {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(244,197,66,0.25);
    border-radius: 10px;
    padding: 0.5rem 0.85rem;
    color: var(--gold);
    font-family: 'Cinzel', serif;
    font-size: 0.9rem;
    font-weight: 700;
    width: 90px;
    text-align: center;
    outline: none;
    transition: all 0.2s;
  }

  .mp-input:focus {
    border-color: var(--gold);
    background: rgba(244,197,66,0.08);
    box-shadow: 0 0 12px rgba(244,197,66,0.2);
  }

  /* Toggle */
  .mp-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.9rem 0;
  }

  .mp-toggle-info { display: flex; flex-direction: column; gap: 3px; }
  .mp-toggle-name {
    font-family: 'Cinzel', serif;
    font-size: 0.85rem;
    color: var(--text);
  }
  .mp-toggle-desc {
    font-size: 0.7rem;
    color: var(--text3);
  }

  .mp-switch {
    width: 52px; height: 28px;
    background: rgba(255,255,255,0.1);
    border-radius: 14px;
    position: relative;
    cursor: pointer;
    transition: background 0.3s;
    border: 1px solid rgba(255,255,255,0.15);
    flex-shrink: 0;
  }

  .mp-switch.on {
    background: linear-gradient(90deg, #1A8A30, #2ED573);
    border-color: rgba(46,213,115,0.5);
    box-shadow: 0 0 16px rgba(46,213,115,0.3);
  }

  .mp-switch::after {
    content: '';
    position: absolute;
    top: 3px; left: 3px;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  }

  .mp-switch.on::after {
    transform: translateX(24px);
  }

  /* Preview card */
  .mp-preview {
    background: linear-gradient(135deg, rgba(26,16,4,0.98), rgba(42,21,0,0.98));
    border: 1px solid rgba(244,197,66,0.5);
    border-radius: 16px;
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 0 40px rgba(244,197,66,0.12);
    position: relative;
    overflow: hidden;
  }

  .mp-preview::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(244,197,66,0.04), transparent);
    animation: previewScan 3s linear infinite;
  }

  @keyframes previewScan {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .mp-preview-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
  .mp-preview-title {
    font-family: 'Cinzel Decorative', serif;
    font-size: 0.75rem;
    color: var(--gold);
    letter-spacing: 0.15em;
    margin-bottom: 0.8rem;
  }

  .mp-preview-rewards {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
  }

  .mp-preview-reward {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .mp-preview-reward-val {
    font-family: 'Cinzel', serif;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--gold2);
    text-shadow: 0 0 12px rgba(244,197,66,0.5);
  }

  .mp-preview-reward-lbl {
    font-size: 0.6rem;
    color: var(--text3);
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  /* Save button */
  .mp-save {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #8A6020, #C9A84C, #F4C542, #C9A84C, #8A6020);
    border: none;
    border-radius: 14px;
    font-family: 'Cinzel', serif;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    color: #1A0A00;
    cursor: pointer;
    transition: all 0.25s;
    margin-top: 1.5rem;
    box-shadow: 0 4px 24px rgba(244,197,66,0.3);
  }

  .mp-save:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 36px rgba(244,197,66,0.5);
  }

  .mp-save:active { transform: scale(0.98); }

  .mp-save:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .mp-toast {
    position: fixed;
    top: 90px; left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #0A2010, #0D3018);
    border: 1px solid rgba(46,213,115,0.7);
    border-radius: 14px;
    padding: 0.9rem 1.8rem;
    font-family: 'Cinzel', serif;
    font-size: 0.82rem;
    color: #2ED573;
    letter-spacing: 0.1em;
    z-index: 9999;
    box-shadow: 0 0 40px rgba(46,213,115,0.3);
    animation: toastIn 0.4s cubic-bezier(0.34,1.4,0.64,1) both;
    white-space: nowrap;
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.9); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }

  .mp-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(244,197,66,0.2), transparent);
    margin: 0.9rem 0;
  }

  .mp-stat-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .mp-stat {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 0.9rem;
    text-align: center;
  }

  .mp-stat-val {
    font-family: 'Cinzel', serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--gold);
  }

  .mp-stat-lbl {
    font-size: 0.6rem;
    color: var(--text3);
    margin-top: 3px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
`;

export default function AdminMilestonePrizes() {
  const [everyN, setEveryN]       = useState(5);
  const [xpReward, setXpReward]   = useState(200);
  const [coinsReward, setCoins]   = useState(500);
  const [isActive, setIsActive]   = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [recordId, setRecordId]   = useState(null);
  const [claimsCount, setClaimsCount] = useState(0);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('milestone_prizes')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (data) {
          setRecordId(data.id);
          setEveryN(data.every_n_levels || 5);
          setXpReward(data.xp_reward || 200);
          setCoins(data.coins_reward || 500);
          setIsActive(data.is_active ?? true);
        }

        const { count } = await supabase
          .from('user_level_claims')
          .select('id', { count: 'exact', head: true });
        setClaimsCount(count || 0);
      } catch(e) {}
      setLoading(false);
    };
    load();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (recordId) {
        await supabase.from('milestone_prizes').update({
          every_n_levels: everyN,
          xp_reward:      xpReward,
          coins_reward:   coinsReward,
          is_active:      isActive,
          updated_at:     new Date().toISOString(),
        }).eq('id', recordId);
      } else {
        const { data } = await supabase.from('milestone_prizes').insert({
          every_n_levels: everyN,
          xp_reward:      xpReward,
          coins_reward:   coinsReward,
          is_active:      isActive,
          label:          `Premio cada ${everyN} niveles`,
        }).select().single();
        if (data) setRecordId(data.id);
      }
      showToast('✅ Configuración guardada');
    } catch(e) {
      showToast('❌ Error al guardar');
    }
    setSaving(false);
  };

  const nextMilestones = [everyN, everyN * 2, everyN * 3, everyN * 4].join(' · ');

  if (loading) return (
    <div className="mp-root" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <style>{css}</style>
      <div style={{ fontFamily:'Cinzel,serif', color:'rgba(244,197,66,0.6)', letterSpacing:'0.2em', fontSize:'0.8rem' }}>
        CARGANDO...
      </div>
    </div>
  );

  return (
    <div className="mp-root">
      <style>{css}</style>

      {toast && <div className="mp-toast">{toast}</div>}

      {/* Header */}
      <div className="mp-header">
        <div className="mp-header-icon">🏆</div>
        <div style={{ flex:1 }}>
          <div className="mp-title">Premios por Hitos de Nivel</div>
          <div className="mp-subtitle">CONFIGURACIÓN AUTOMÁTICA · TEMPLO DEL PROPÓSITO</div>
        </div>
        <a href="/admin" style={{ color:'#F4C542', fontSize:11, letterSpacing:2, textDecoration:'none', fontFamily:'Cinzel,serif', flexShrink:0 }}>← ADMIN</a>
      </div>

      {/* Stats rápidas */}
      <div className="mp-stat-row" style={{ marginBottom:'1.25rem' }}>
        <div className="mp-stat" style={{ borderColor:'rgba(244,197,66,0.2)' }}>
          <div style={{ fontSize:'1.3rem', marginBottom:'4px' }}>🎁</div>
          <div className="mp-stat-val">{claimsCount.toLocaleString()}</div>
          <div className="mp-stat-lbl">Premios entregados</div>
        </div>
        <div className="mp-stat" style={{ borderColor: isActive ? 'rgba(46,213,115,0.3)' : 'rgba(255,71,87,0.2)', background: isActive ? 'rgba(46,213,115,0.06)' : 'rgba(255,71,87,0.06)' }}>
          <div style={{ fontSize:'1.3rem', marginBottom:'4px' }}>{isActive ? '✅' : '⏸️'}</div>
          <div className="mp-stat-val" style={{ color: isActive ? '#2ED573' : '#FF4757' }}>{isActive ? 'Activo' : 'Pausado'}</div>
          <div className="mp-stat-lbl">Estado</div>
        </div>
        <div className="mp-stat" style={{ borderColor:'rgba(112,160,255,0.25)', background:'rgba(112,160,255,0.05)' }}>
          <div style={{ fontSize:'1.3rem', marginBottom:'4px' }}>📈</div>
          <div className="mp-stat-val" style={{ color:'#70A0FF', fontSize:'0.85rem' }}>Nv. {everyN}</div>
          <div className="mp-stat-lbl">Primer hito</div>
        </div>
      </div>

      {/* Cada cuántos niveles */}
      <div className="mp-section">
        <div className="mp-section-title">
          <span>📈</span> Frecuencia del Premio
        </div>
        <div className="mp-chips">
          {PRESET_LEVELS.map(p => (
            <div
              key={p.value}
              className={`mp-chip${everyN === p.value ? ' selected' : ''}`}
              style={{ '--chip-color': p.color }}
              onClick={() => setEveryN(p.value)}
            >
              {p.popular && <span className="popular-badge">⭐ RECOMENDADO</span>}
              <span className="mp-chip-val" style={{ color: everyN === p.value ? p.color : 'var(--text)' }}>
                {p.value}
              </span>
              <span className="mp-chip-lbl">{p.label}</span>
              <span className="mp-chip-lbl" style={{ color: p.color, opacity: 0.8 }}>{p.desc}</span>
            </div>
          ))}
        </div>
        <div className="mp-custom-row">
          <span className="mp-custom-label">PERSONALIZADO</span>
          <input
            className="mp-input"
            type="number"
            min="1"
            max="100"
            value={everyN}
            onChange={e => setEveryN(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <span style={{ fontSize:'0.7rem', color:'var(--text3)' }}>niveles</span>
        </div>
        <div style={{ marginTop:'0.8rem', fontSize:'0.68rem', color:'var(--text3)', fontFamily:'Cinzel,serif', letterSpacing:'0.12em' }}>
          HITOS: Nv. {nextMilestones}...
        </div>
      </div>

      {/* XP Reward */}
      <div className="mp-section">
        <div className="mp-section-title">
          <span>⭐</span> Bonus de XP por Hito
        </div>
        <div className="mp-chips">
          {PRESET_XP.map(v => (
            <div
              key={v}
              className={`mp-chip${xpReward === v ? ' selected' : ''}`}
              onClick={() => setXpReward(v)}
            >
              <span className="mp-chip-val" style={{ color: xpReward === v ? '#70A0FF' : 'var(--text)' }}>
                +{v.toLocaleString()}
              </span>
              <span className="mp-chip-lbl">XP</span>
            </div>
          ))}
        </div>
        <div className="mp-custom-row">
          <span className="mp-custom-label">PERSONALIZADO</span>
          <input
            className="mp-input"
            type="number"
            min="0"
            step="50"
            value={xpReward}
            onChange={e => setXpReward(Math.max(0, parseInt(e.target.value) || 0))}
            style={{ color:'#70A0FF' }}
          />
          <span style={{ fontSize:'0.7rem', color:'var(--text3)' }}>XP</span>
        </div>
      </div>

      {/* Coins Reward */}
      <div className="mp-section">
        <div className="mp-section-title">
          <span>🪙</span> Bonus de PropoCoins por Hito
        </div>
        <div className="mp-chips">
          {PRESET_COINS.map(v => (
            <div
              key={v}
              className={`mp-chip${coinsReward === v ? ' selected' : ''}`}
              onClick={() => setCoins(v)}
            >
              <span className="mp-chip-val" style={{ color: coinsReward === v ? '#F4C542' : 'var(--text)' }}>
                +{v.toLocaleString()}
              </span>
              <span className="mp-chip-lbl">🪙</span>
            </div>
          ))}
        </div>
        <div className="mp-custom-row">
          <span className="mp-custom-label">PERSONALIZADO</span>
          <input
            className="mp-input"
            type="number"
            min="0"
            step="100"
            value={coinsReward}
            onChange={e => setCoins(Math.max(0, parseInt(e.target.value) || 0))}
          />
          <span style={{ fontSize:'0.7rem', color:'var(--text3)' }}>🪙</span>
        </div>
      </div>

      {/* Toggle activo */}
      <div className="mp-section">
        <div className="mp-toggle-row">
          <div className="mp-toggle-info">
            <div className="mp-toggle-name">Sistema de hitos</div>
            <div className="mp-toggle-desc">
              {isActive ? '✅ Los templarios reciben premios al subir nivel' : '⏸ Pausado — no se entregan premios'}
            </div>
          </div>
          <div className={`mp-switch${isActive ? ' on' : ''}`} onClick={() => setIsActive(v => !v)} />
        </div>
      </div>

      {/* Preview */}
      <div className="mp-preview">
        <div style={{ position:'absolute', top:10, right:14, fontSize:'0.55rem', fontFamily:'Cinzel,serif', color:'rgba(244,197,66,0.4)', letterSpacing:'0.15em' }}>PREVIEW</div>
        <div className="mp-preview-icon">🏆</div>
        <div style={{ fontFamily:'Cinzel Decorative,serif', fontSize:'0.6rem', color:'rgba(244,197,66,0.5)', letterSpacing:'0.2em', marginBottom:'4px' }}>NIVEL {everyN} ALCANZADO</div>
        <div className="mp-preview-title">ASÍ LO VE EL JUGADOR</div>
        <div className="mp-divider" />
        <div className="mp-preview-rewards">
          <div className="mp-preview-reward">
            <div className="mp-preview-reward-val">+{coinsReward.toLocaleString()}</div>
            <div style={{ fontSize:'1.1rem' }}>🪙</div>
            <div className="mp-preview-reward-lbl">PropoCoins</div>
          </div>
          <div style={{ width:'1px', background:'linear-gradient(180deg, transparent, rgba(244,197,66,0.3), transparent)' }} />
          <div className="mp-preview-reward">
            <div className="mp-preview-reward-val" style={{ color:'#70A0FF' }}>+{xpReward.toLocaleString()}</div>
            <div style={{ fontSize:'1.1rem' }}>⭐</div>
            <div className="mp-preview-reward-lbl">XP Bonus</div>
          </div>
        </div>
        <div style={{ marginTop:'1rem', fontSize:'0.6rem', color:'rgba(244,197,66,0.35)', fontFamily:'Cinzel,serif', letterSpacing:'0.12em' }}>
          PRÓXIMOS HITOS: Nv. {nextMilestones}...
        </div>
      </div>

      <button className="mp-save" onClick={handleSave} disabled={saving}>
        {saving ? '⏳ GUARDANDO...' : '💾 GUARDAR CONFIGURACIÓN'}
      </button>
    </div>
  );
}