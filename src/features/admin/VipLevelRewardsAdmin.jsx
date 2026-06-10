import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

const TYPES = [
  { value: 'coins',    label: '🪙 PropoCoins' },
  { value: 'module',   label: '📦 Módulo' },
  { value: 'link',     label: '🔗 Link externo' },
  { value: 'download', label: '⬇️ Descargable' },
];
const OPT_STYLE = { background: '#0d0520', color: '#f5e6c8' };

const EMPTY = {
  level: '', icon: '👑', name: '', description: '',
  xp_required: '', bonus_propocoins: '', bonus_exp: '',
  reward_type: 'coins', reward_url: '', is_active: true,
};

/* ─── inline styles reutilizables ─── */
const lbl = {
  display: 'block', fontSize: 11, color: 'rgba(212,175,55,0.65)',
  marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase',
};
const inp = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(212,175,55,0.25)', borderRadius: 8,
  padding: '10px 14px', color: '#f5e6c8', fontSize: 14,
  fontFamily: 'Georgia,serif', boxSizing: 'border-box',
};
const btnPrimary = {
  background: 'linear-gradient(135deg,#f5d06e,#b48cff,#7c3aed)',
  color: '#fff', border: 'none', borderRadius: 8,
  padding: '12px 24px', fontWeight: 900, fontSize: 14,
  cursor: 'pointer', letterSpacing: 1,
};
const btnSecondary = {
  background: 'rgba(212,175,55,0.12)', color: '#f5d06e',
  border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8,
  padding: '10px 16px', fontWeight: 700, cursor: 'pointer',
};
const btnDanger = {
  background: 'rgba(255,80,80,0.12)', color: '#ff6b6b',
  border: '1px solid rgba(255,80,80,0.3)', borderRadius: 8,
  padding: '10px 16px', fontWeight: 700, cursor: 'pointer',
};

/* ─── CSS inyectado ─── */
const CSS = `
  .vra-scroll-root {
    position: fixed;
    inset: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .vra-page {
    width: 100%;
    max-width: 880px;
    margin: 0 auto;
    padding: 32px 20px 80px;
    color: #f5e6c8;
    font-family: Georgia, serif;
    box-sizing: border-box;
  }
  .vra-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }
  .vra-back {
    background: rgba(212,175,55,0.12);
    color: #f5d06e;
    border: 1px solid rgba(212,175,55,0.3);
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: 700;
    font-size: 13px;
    text-decoration: none;
    letter-spacing: 1px;
    white-space: nowrap;
  }
  .vra-title {
    font-size: clamp(18px, 4vw, 24px);
    font-weight: 900;
    margin: 0;
    letter-spacing: 2px;
    background: linear-gradient(90deg,#f5d06e,#b48cff,#f5d06e);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: vra-shimmer 3s linear infinite;
  }
  @keyframes vra-shimmer {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  .vra-card {
    background: rgba(15,6,30,0.97);
    border: 1.5px solid rgba(212,175,55,0.25);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 32px;
    box-shadow: 0 0 40px rgba(212,175,55,0.06);
  }
  .vra-form-heading {
    font-size: 14px;
    color: #f5d06e;
    margin: 0 0 20px;
    letter-spacing: 1px;
  }
  .vra-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .vra-full { grid-column: 1 / -1; }
  .vra-form-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
    flex-wrap: wrap;
  }
  .vra-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .vra-reward-card {
    background: rgba(15,6,30,0.85);
    border: 1.5px solid rgba(212,175,55,0.3);
    border-radius: 14px;
    padding: 16px 20px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    transition: opacity 0.2s;
  }
  .vra-reward-card.vra-inactive {
    opacity: 0.45;
    border-color: rgba(100,100,100,0.25);
  }
  .vra-reward-icon { font-size: 30px; flex-shrink: 0; padding-top: 2px; line-height: 1; }
  .vra-reward-info { flex: 1; min-width: 0; }
  .vra-reward-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }
  .vra-badge-level {
    background: linear-gradient(135deg,#f5d06e,#b48cff);
    color: #1a0a2e;
    border-radius: 6px;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: 900;
    white-space: nowrap;
  }
  .vra-badge-name {
    font-weight: 700;
    color: #f5e6c8;
    font-size: 15px;
  }
  .vra-badge-type {
    font-size: 11px;
    color: #f5d06e;
    background: rgba(212,175,55,0.12);
    border-radius: 4px;
    padding: 2px 8px;
    white-space: nowrap;
  }
  .vra-desc { font-size: 13px; color: rgba(245,230,200,0.55); margin: 2px 0 0; }
  .vra-url  { font-size: 11px; color: #b48cff; margin: 2px 0 0; word-break: break-all; }
  .vra-bonuses { display: flex; gap: 12px; margin-top: 6px; flex-wrap: wrap; }
  .vra-xp-req  { font-size: 11px; color: rgba(245,230,200,0.4); margin-top: 4px; }
  .vra-coin    { font-size: 11px; color: #f5d06e; }
  .vra-exp     { font-size: 11px; color: #86efac; }
  .vra-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  /* ── MOBILE ── */
  @media (max-width: 600px) {
    .vra-page { padding: 20px 14px 80px; }
    .vra-grid { grid-template-columns: 1fr; }
    .vra-full { grid-column: 1; }
    .vra-reward-card { flex-direction: column; gap: 10px; }
    .vra-actions { flex-direction: row; flex-wrap: wrap; width: 100%; }
    .vra-actions button { flex: 1; min-width: 80px; }
  }
`;

export default function VipLevelRewardsAdmin() {
  const [rewards,  setRewards]  = useState([]);
  const [form,     setForm]     = useState(EMPTY);
  const [editing,  setEditing]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState('');

  const fetchRewards = async () => {
    const { data } = await supabase
      .from('vip_level_rewards')
      .select('*')
      .order('level');
    setRewards(data ?? []);
  };

  useEffect(() => { fetchRewards(); }, []);

  const handleSave = async () => {
    if (!form.level || !form.reward_type)
  return setMsg('⚠️ Nivel y tipo son obligatorios');
    setLoading(true);
    const payload = {
      level:             parseInt(form.level),
      icon:              form.icon || '👑',
      name: ['','INICIADO','RECLUTA','FORJADOR','CONQUISTADOR','DOMINANTE','PROPO-TEMPLARIO'][parseInt(form.level)] || '',
      description:       form.description || null,
      xp_required:       parseInt(form.xp_required) || 0,
      bonus_propocoins:  parseInt(form.bonus_propocoins)  || 0,
      bonus_exp:         parseInt(form.bonus_exp)         || 0,
      reward_type:       form.reward_type,
      reward_url:        form.reward_url || null,
      is_active:         form.is_active,
    };
    if (editing) {
  const { error } = await supabase.from('vip_level_rewards').update(payload).eq('id', editing);
  if (error) { setMsg('❌ Error: ' + error.message); setLoading(false); return; }
} else {
  const { error } = await supabase.from('vip_level_rewards').insert(payload);
  if (error) { setMsg('❌ Error: ' + error.message); setLoading(false); return; }
}
    setForm(EMPTY);
    setEditing(null);
    setMsg(editing ? '✅ Actualizada' : '✅ Creada');
    await fetchRewards();
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleEdit = (r) => {
    setForm({
      level:            r.level,
      icon:             r.icon             || '👑',
      name:             r.name             || '',
      description:      r.description      || '',
      xp_required:      r.xp_required      || '',
      bonus_propocoins: r.bonus_propocoins  || '',
      bonus_exp:        r.bonus_exp         || '',
      reward_type:      r.reward_type       || 'coins',
      reward_url:       r.reward_url        || '',
      is_active:        r.is_active,
    });
    setEditing(r.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta recompensa VIP?')) return;
    await supabase.from('vip_level_rewards').delete().eq('id', id);
    fetchRewards();
  };

  const handleToggle = async (r) => {
    await supabase.from('vip_level_rewards').update({ is_active: !r.is_active }).eq('id', r.id);
    fetchRewards();
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="vra-scroll-root">
        <div className="vra-page">

          {/* HEADER */}
          <div className="vra-header">
            <a href="/admin" className="vra-back">← ADMIN</a>
            <h1 className="vra-title">👑 RECOMPENSAS VIP POR NIVEL</h1>
          </div>

          {/* FORM */}
          <div className="vra-card">
            <h2 className="vra-form-heading">
              {editing ? '✏️ EDITANDO RECOMPENSA VIP' : '➕ NUEVA RECOMPENSA VIP'}
            </h2>

            <div className="vra-grid">

              <div>
  <label style={lbl}>Nivel</label>
  <select style={inp} value={form.level}
    onChange={e => setForm({ ...form, level: e.target.value })}>
    <option value="" style={{background:'#0d0520',color:'#f5e6c8'}}>— Selecciona nivel —</option>
<option value="1" style={{background:'#0d0520',color:'#f5e6c8'}}>Nivel 1 — INICIADO</option>
<option value="2" style={{background:'#0d0520',color:'#f5e6c8'}}>Nivel 2 — RECLUTA</option>
<option value="3" style={{background:'#0d0520',color:'#f5e6c8'}}>Nivel 3 — FORJADOR</option>
<option value="4" style={{background:'#0d0520',color:'#f5e6c8'}}>Nivel 4 — CONQUISTADOR</option>
<option value="5" style={{background:'#0d0520',color:'#f5e6c8'}}>Nivel 5 — DOMINANTE</option>
<option value="6" style={{background:'#0d0520',color:'#f5e6c8'}}>Nivel 6 — PROPO-TEMPLARIO</option>
  </select>
</div>

              <div>
                <label style={lbl}>Icono (emoji)</label>
                <input style={inp} placeholder="👑"
                  value={form.icon}
                  onChange={e => setForm({ ...form, icon: e.target.value })} />
              </div>

              <div style={{display:'none'}}>
  <input value={form.name} readOnly />
</div>

              <div>
  <label style={lbl}>XP requerida (opcional)</label>
  <input style={inp} type="number" min="0" placeholder="déjalo vacío si no aplica"
    value={form.xp_required}
    onChange={e => setForm({ ...form, xp_required: e.target.value })} />
</div>

              <div className="vra-full">
                <label style={lbl}>Descripción</label>
                <input style={inp} placeholder="ej: +80 XP · +80 Coins · Nombre animado"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div>
                <label style={lbl}>Tipo de recompensa</label>
                <select style={inp} value={form.reward_type}
                  onChange={e => setForm({ ...form, reward_type: e.target.value })}>
                  {TYPES.map(t => <option key={t.value} value={t.value} style={OPT_STYLE}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>URL / Ruta (opcional)</label>
                <input style={inp} placeholder="https://... o /modulo/habitos"
                  value={form.reward_url || ''}
                  onChange={e => setForm({ ...form, reward_url: e.target.value })} />
              </div>

              <div>
                <label style={lbl}>🪙 Bonus PropoCoins</label>
                <input style={inp} type="number" min="0" placeholder="ej: 80"
                  value={form.bonus_propocoins}
                  onChange={e => setForm({ ...form, bonus_propocoins: e.target.value })} />
              </div>

              <div>
                <label style={lbl}>⭐ Bonus EXP</label>
                <input style={inp} type="number" min="0" placeholder="ej: 80"
                  value={form.bonus_exp}
                  onChange={e => setForm({ ...form, bonus_exp: e.target.value })} />
              </div>

            </div>

            {msg && (
              <p style={{ marginTop: 12, color: msg.includes('⚠️') ? '#ff6b6b' : '#4ade80', fontSize: 14 }}>
                {msg}
              </p>
            )}

            <div className="vra-form-actions">
              <button onClick={handleSave} disabled={loading} style={btnPrimary}>
                {loading ? 'Guardando...' : editing ? 'ACTUALIZAR' : 'CREAR RECOMPENSA VIP'}
              </button>
              {editing && (
                <button onClick={() => { setForm(EMPTY); setEditing(null); }} style={btnSecondary}>
                  CANCELAR
                </button>
              )}
            </div>
          </div>

          {/* LISTA */}
          <div className="vra-list">
            {rewards.map(r => (
              <div key={r.id} className={`vra-reward-card${r.is_active ? '' : ' vra-inactive'}`}>

                <span className="vra-reward-icon">{r.icon}</span>

                <div className="vra-reward-info">
                  <div className="vra-reward-meta">
                    <span className="vra-badge-level">NV. {r.level}</span>
                    <span className="vra-badge-name">{r.name}</span>
                    <span className="vra-badge-type">
  {TYPES.find(t => t.value === r.reward_type)?.label}
</span>
<span style={{fontSize:10,fontWeight:900,letterSpacing:1.5,color:'#f5d06e',background:'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(124,58,237,0.2))',border:'1px solid rgba(212,175,55,0.4)',borderRadius:4,padding:'2px 7px',whiteSpace:'nowrap'}}>
  👑 VIP
</span>
                  </div>
                  {r.description && <p className="vra-desc">{r.description}</p>}
                  {r.reward_url  && <p className="vra-url">{r.reward_url}</p>}
                  {r.xp_required && r.xp_required > 0 && (
  <p className="vra-xp-req">⚡ XP requerida: {r.xp_required}</p>
)}
                  <div className="vra-bonuses">
                    {r.bonus_propocoins > 0 && <span className="vra-coin">🪙 +{r.bonus_propocoins} PropoCoins</span>}
                    {r.bonus_exp        > 0 && <span className="vra-exp">⭐ +{r.bonus_exp} EXP</span>}
                  </div>
                </div>

                <div className="vra-actions">
                  <button onClick={() => handleToggle(r)} style={{ ...btnSecondary, fontSize: 12 }}>
                    {r.is_active ? 'OCULTAR' : 'ACTIVAR'}
                  </button>
                  <button onClick={() => handleEdit(r)} style={{ ...btnSecondary, fontSize: 12 }}>
                    EDITAR
                  </button>
                  <button onClick={() => handleDelete(r.id)} style={{ ...btnDanger, fontSize: 12 }}>
                    BORRAR
                  </button>
                </div>

              </div>
            ))}

            {rewards.length === 0 && (
              <p style={{ textAlign: 'center', color: 'rgba(245,230,200,0.35)', padding: 40 }}>
                Sin recompensas VIP aún. Crea la primera arriba ↑
              </p>
            )}
          </div>

        </div>
      </div>
    </>
  );
}