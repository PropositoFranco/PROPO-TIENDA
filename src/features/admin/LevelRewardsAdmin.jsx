import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

const TYPES = [
  { value: 'link',     label: '🔗 Link externo' },
  { value: 'module',   label: '📦 Módulo de la app' },
  { value: 'download', label: '⬇️ Descargable' },
  { value: 'file',     label: '📄 Archivo' },
];

const EMPTY = { level: '', title: '', description: '', type: 'link', url: '', icon: '🎁', is_active: true, propocoins: '', exp: '' };

export default function LevelRewardsAdmin() {
  const [rewards,  setRewards]  = useState([]);
  const [form,     setForm]     = useState(EMPTY);
  const [editing,  setEditing]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState('');

  const fetchRewards = async () => {
    const { data } = await supabase.from('level_rewards').select('*').order('level');
    setRewards(data ?? []);
  };

  useEffect(() => { fetchRewards(); }, []);

  const handleSave = async () => {
    if (!form.level || !form.title || !form.type) return setMsg('⚠️ Nivel, título y tipo son obligatorios');
    setLoading(true);
    const payload = {
      level:             parseInt(form.level),
      title:             form.title,
      description:       form.description || null,
      icon_emoji:        form.icon || '🎁',
      reward_type:       form.type,
      reward_value:      form.url || null,
      is_active:         form.is_active,
      bonus_propocoins:  parseInt(form.propocoins) || 0,
      bonus_exp:         parseInt(form.exp) || 0,
    };
    if (editing) {
      await supabase.from('level_rewards').update(payload).eq('id', editing);
    } else {
      await supabase.from('level_rewards').insert(payload);
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
      level:       r.level,
      title:       r.title,
      description: r.description || '',
      icon:        r.icon_emoji   || '🎁',
      type:        r.reward_type  || 'link',
      url:         r.reward_value || '',
      is_active:   r.is_active,
      propocoins:  r.bonus_propocoins || '',
      exp:         r.bonus_exp        || '',
    });
    setEditing(r.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta recompensa?')) return;
    await supabase.from('level_rewards').delete().eq('id', id);
    fetchRewards();
  };

  const handleToggle = async (r) => {
    await supabase.from('level_rewards').update({ is_active: !r.is_active }).eq('id', r.id);
    fetchRewards();
  };

  return (
    <>
      <style>{CSS}</style>

      {/* wrapper full-width: él hace el scroll, scrollbar en la orilla derecha */}
      <div className="lra-scroll-root">
        <div className="lra-page">

          {/* HEADER */}
          <div className="lra-header">
            <a href="/admin" className="lra-back">← ADMIN</a>
            <h1 className="lra-title">🏆 RECOMPENSAS POR NIVEL</h1>
          </div>

          {/* FORM */}
          <div className="lra-card">
            <h2 className="lra-form-heading">
              {editing ? '✏️ EDITANDO RECOMPENSA' : '➕ NUEVA RECOMPENSA'}
            </h2>

            <div className="lra-grid">
              <div>
                <label style={lbl}>Nivel</label>
                <input style={inp} type="number" min="1" placeholder="ej: 5"
                  value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>Icono (emoji)</label>
                <input style={inp} placeholder="🎁"
                  value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
              </div>
              <div className="lra-full">
                <label style={lbl}>Título</label>
                <input style={inp} placeholder="ej: Guía Templaria PDF"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="lra-full">
                <label style={lbl}>Descripción</label>
                <input style={inp} placeholder="ej: Desbloqueas acceso al módulo de Hábitos"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>Tipo</label>
                <select style={inp} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>URL / Ruta</label>
                <input style={inp} placeholder="https://... o /modulo/habitos"
                  value={form.url || ''} onChange={e => setForm({ ...form, url: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>🪙 Bonus PropoCoins (opcional)</label>
                <input style={inp} type="number" min="0" placeholder="ej: 50"
                  value={form.propocoins} onChange={e => setForm({ ...form, propocoins: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>⭐ Bonus EXP (opcional)</label>
                <input style={inp} type="number" min="0" placeholder="ej: 100"
                  value={form.exp} onChange={e => setForm({ ...form, exp: e.target.value })} />
              </div>
            </div>

            {msg && (
              <p style={{ marginTop: 12, color: msg.includes('⚠️') ? '#ff6b6b' : '#69ff69', fontSize: 14 }}>
                {msg}
              </p>
            )}

            <div className="lra-form-actions">
              <button onClick={handleSave} disabled={loading} style={btnPrimary}>
                {loading ? 'Guardando...' : editing ? 'ACTUALIZAR' : 'CREAR RECOMPENSA'}
              </button>
              {editing && (
                <button onClick={() => { setForm(EMPTY); setEditing(null); }} style={btnSecondary}>
                  CANCELAR
                </button>
              )}
            </div>
          </div>

          {/* LISTA */}
          <div className="lra-list">
            {rewards.map(r => (
              <div key={r.id} className={`lra-reward-card${r.is_active ? '' : ' lra-inactive'}`}>
                <span className="lra-reward-icon">{r.icon_emoji}</span>

                <div className="lra-reward-info">
                  <div className="lra-reward-meta">
                    <span className="lra-badge-level">NV. {r.level}</span>
                    <span className="lra-reward-name">{r.title}</span>
                    <span className="lra-badge-type">
                      {TYPES.find(t => t.value === r.reward_type)?.label}
                    </span>
                  </div>
                  {r.description  && <p className="lra-desc">{r.description}</p>}
                  {r.reward_value && <p className="lra-url">{r.reward_value}</p>}
                  <div className="lra-bonuses">
                    {r.bonus_propocoins > 0 && <span className="lra-coin">🪙 +{r.bonus_propocoins} PropoCoins</span>}
                    {r.bonus_exp        > 0 && <span className="lra-exp">⭐ +{r.bonus_exp} EXP</span>}
                  </div>
                </div>

                <div className="lra-actions">
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
              <p style={{ textAlign: 'center', color: 'rgba(226,217,243,0.4)', padding: 40 }}>
                Sin recompensas aún. Crea la primera arriba ↑
              </p>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

/* ─── Inline styles que no necesitan breakpoints ─── */
const lbl = {
  display: 'block', fontSize: 12, color: 'rgba(180,140,255,0.7)',
  marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase',
};
const inp = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(180,140,255,0.3)', borderRadius: 8,
  padding: '10px 14px', color: '#e2d9f3', fontSize: 14,
  fontFamily: 'Georgia,serif', boxSizing: 'border-box',
};
const btnPrimary = {
  background: 'linear-gradient(135deg,#b48cff,#7c3aed)', color: '#fff',
  border: 'none', borderRadius: 8, padding: '12px 24px',
  fontWeight: 900, fontSize: 14, cursor: 'pointer', letterSpacing: 1,
};
const btnSecondary = {
  background: 'rgba(180,140,255,0.15)', color: '#b48cff',
  border: '1px solid rgba(180,140,255,0.3)', borderRadius: 8,
  padding: '10px 16px', fontWeight: 700, cursor: 'pointer',
};
const btnDanger = {
  background: 'rgba(255,80,80,0.15)', color: '#ff6b6b',
  border: '1px solid rgba(255,80,80,0.3)', borderRadius: 8,
  padding: '10px 16px', fontWeight: 700, cursor: 'pointer',
};

/* ─── CSS responsivo inyectado ─── */
const CSS = `
  /* scroll-root ocupa toda la ventana → scrollbar en la orilla derecha del navegador */
  .lra-scroll-root {
    position: fixed;
    inset: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .lra-page {
    width: 100%;
    max-width: 860px;
    margin: 0 auto;
    padding: 32px 20px 80px;
    color: #e2d9f3;
    font-family: Georgia, serif;
    box-sizing: border-box;
  }

  /* Header */
  .lra-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }
  .lra-back {
    background: rgba(180,140,255,0.15);
    color: #b48cff;
    border: 1px solid rgba(180,140,255,0.3);
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: 700;
    font-size: 13px;
    text-decoration: none;
    letter-spacing: 1px;
    white-space: nowrap;
  }
  .lra-title {
    font-size: clamp(18px, 4vw, 24px);
    font-weight: 900;
    color: #f5d06e;
    margin: 0;
    letter-spacing: 2px;
  }

  /* Form card */
  .lra-card {
    background: rgba(20,10,40,0.95);
    border: 1.5px solid rgba(180,140,255,0.3);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 32px;
  }
  .lra-form-heading {
    font-size: 15px;
    color: #b48cff;
    margin: 0 0 20px 0;
    letter-spacing: 1px;
  }

  /* Grid 2 cols desktop, 1 col mobile */
  .lra-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .lra-full {
    grid-column: 1 / -1;
  }
  .lra-form-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
    flex-wrap: wrap;
  }

  /* Lista */
  .lra-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Card recompensa */
  .lra-reward-card {
    background: rgba(20,10,40,0.8);
    border: 1.5px solid rgba(180,140,255,0.4);
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    transition: opacity 0.2s;
  }
  .lra-reward-card.lra-inactive {
    opacity: 0.5;
    border-color: rgba(100,100,100,0.3);
  }
  .lra-reward-icon {
    font-size: 28px;
    flex-shrink: 0;
    line-height: 1;
    padding-top: 2px;
  }
  .lra-reward-info {
    flex: 1;
    min-width: 0;
  }
  .lra-reward-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .lra-badge-level {
    background: #f5d06e;
    color: #1a0a2e;
    border-radius: 6px;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: 900;
    white-space: nowrap;
  }
  .lra-reward-name {
    font-weight: 700;
    color: #e2d9f3;
    font-size: 15px;
  }
  .lra-badge-type {
    font-size: 11px;
    color: #b48cff;
    background: rgba(180,140,255,0.15);
    border-radius: 4px;
    padding: 2px 8px;
    white-space: nowrap;
  }
  .lra-desc {
    font-size: 13px;
    color: rgba(226,217,243,0.6);
    margin: 4px 0 0 0;
  }
  .lra-url {
    font-size: 11px;
    color: #b48cff;
    margin: 2px 0 0 0;
    word-break: break-all;
  }
  .lra-bonuses {
    display: flex;
    gap: 12px;
    margin-top: 6px;
    flex-wrap: wrap;
  }
  .lra-coin { font-size: 11px; color: #f5d06e; }
  .lra-exp  { font-size: 11px; color: #69ff69; }

  .lra-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  /* ── MOBILE ── */
  @media (max-width: 600px) {
    .lra-page {
      padding: 20px 14px 80px;
    }
    .lra-grid {
      grid-template-columns: 1fr;
    }
    .lra-full {
      grid-column: 1;
    }
    .lra-reward-card {
      flex-direction: column;
      gap: 12px;
    }
    .lra-reward-icon {
      font-size: 24px;
    }
    .lra-actions {
      flex-direction: row;
      flex-wrap: wrap;
      width: 100%;
    }
    .lra-actions button {
      flex: 1;
      min-width: 80px;
    }
  }
`;