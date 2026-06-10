import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

const DEFAULTS = Array.from({ length: 10 }, (_, i) => ({
  place: i + 1,
  propocoins: [500, 250, 100, 0, 0, 0, 0, 0, 0, 0][i],
  exp: [300, 150, 75, 30, 25, 20, 15, 12, 10, 8][i],
  enabled: true,
}));

const Toggle = ({ value, onChange }) => (
  <div onClick={onChange} style={{ marginLeft:'auto', cursor:'pointer', width:36, height:20, borderRadius:10, background: value ? '#2ed573' : 'rgba(255,255,255,0.1)', border: value ? '1px solid #2ed573' : '1px solid rgba(255,255,255,0.2)', position:'relative', transition:'all 0.2s', flexShrink:0 }}>
    <div style={{ position:'absolute', top:2, left: value ? 18 : 2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
  </div>
);

export default function RankingPrizes() {
  const [prizes, setPrizes] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('competition_settings').select('prizes').eq('id', 'current').single()
      .then(({ data }) => {
        if (data?.prizes) {
          setPrizes(Array.from({ length: 10 }, (_, i) => ({
            place: i + 1,
            propocoins: data.prizes[String(i + 1)]?.propocoins ?? DEFAULTS[i].propocoins,
            exp:        data.prizes[String(i + 1)]?.exp        ?? DEFAULTS[i].exp,
            enabled:    data.prizes[String(i + 1)]?.enabled    ?? true,
          })));
        }
      });
  }, []);

  const update = (place, field, val) => {
    setPrizes(p => p.map(r => r.place === place ? { ...r, [field]: field === 'enabled' ? val : Number(val) } : r));
  };

  const save = async () => {
    setSaving(true);
    const obj = {};
    prizes.forEach(r => { obj[String(r.place)] = { propocoins: r.propocoins, exp: r.exp, enabled: r.enabled }; });
    await supabase.from('competition_settings')
      .update({ prizes: obj, updated_at: new Date().toISOString() })
      .eq('id', 'current');
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const top3Colors = ['#c9a84c', '#91a6d2', '#b46e3c'];
  const top3Labels = ['👑 1° ORO', '🥈 2° PLATA', '🥉 3° BRONCE'];

  return (
    <div style={{ minHeight:'100vh', background:'#030b1a', color:'#e8d5a3', fontFamily:'Cinzel,serif', padding:'32px 24px' }}>
      <div style={{ maxWidth:560, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
          <a href="/admin" style={{ color:'#c9a84c', fontSize:12, letterSpacing:2, textDecoration:'none', opacity:.7 }}>← ADMIN</a>
          <h1 style={{ margin:0, fontSize:20, letterSpacing:5, color:'#c9a84c', textShadow:'0 0 20px rgba(201,168,76,0.5)' }}>🏆 PREMIOS RANKING</h1>
        </div>

        {/* TOP 3 */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:9, letterSpacing:3, color:'rgba(201,168,76,0.5)', marginBottom:10, textTransform:'uppercase' }}>Podio — Top 3</div>
          {prizes.slice(0, 3).map((r, i) => (
            <div key={r.place} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', marginBottom:6, background:'rgba(201,168,76,0.06)', border:`1px solid ${top3Colors[i]}44`, borderRadius:10, opacity: r.enabled ? 1 : 0.4, transition:'opacity 0.2s' }}>
              <div style={{ width:90, fontSize:11, fontWeight:700, color:top3Colors[i], letterSpacing:1 }}>{top3Labels[i]}</div>
              <div style={{ flex:1, display:'flex', gap:8, alignItems:'center' }}>
                <label style={{ fontSize:9, color:'rgba(201,168,76,0.5)', letterSpacing:1 }}>🪙 PC</label>
                <input type="number" min="0" value={r.propocoins}
                  onChange={e => update(r.place, 'propocoins', e.target.value)}
                  style={{ width:70, background:'rgba(0,0,0,0.4)', border:`1px solid ${top3Colors[i]}66`, borderRadius:6, color:top3Colors[i], padding:'4px 8px', fontSize:13, fontWeight:700, fontFamily:'Cinzel,serif', outline:'none' }} />
                <label style={{ fontSize:9, color:'rgba(126,184,247,0.6)', letterSpacing:1 }}>✨ EXP</label>
                <input type="number" min="0" value={r.exp}
                  onChange={e => update(r.place, 'exp', e.target.value)}
                  style={{ width:70, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(126,184,247,0.3)', borderRadius:6, color:'#7eb8f7', padding:'4px 8px', fontSize:13, fontWeight:700, fontFamily:'Cinzel,serif', outline:'none' }} />
                <Toggle value={r.enabled} onChange={() => update(r.place, 'enabled', !r.enabled)} />
              </div>
            </div>
          ))}
        </div>

        {/* TOP 4-10 */}
        <div>
          <div style={{ fontSize:9, letterSpacing:3, color:'rgba(201,168,76,0.5)', marginBottom:10, textTransform:'uppercase' }}>Consolación — Top 4 al 10</div>
          {prizes.slice(3).map(r => (
            <div key={r.place} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 16px', marginBottom:4, background:'rgba(201,168,76,0.03)', border:'1px solid rgba(201,168,76,0.1)', borderRadius:8, opacity: r.enabled ? 1 : 0.4, transition:'opacity 0.2s' }}>
              <div style={{ width:90, fontSize:10, color:'rgba(201,168,76,0.6)', letterSpacing:1 }}>TOP {r.place}</div>
              <div style={{ flex:1, display:'flex', gap:8, alignItems:'center' }}>
                <label style={{ fontSize:9, color:'rgba(201,168,76,0.4)', letterSpacing:1 }}>🪙 PC</label>
                <input type="number" min="0" value={r.propocoins}
                  onChange={e => update(r.place, 'propocoins', e.target.value)}
                  style={{ width:70, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:6, color:'#c9a84c', padding:'4px 8px', fontSize:12, fontFamily:'Cinzel,serif', outline:'none' }} />
                <label style={{ fontSize:9, color:'rgba(126,184,247,0.4)', letterSpacing:1 }}>✨ EXP</label>
                <input type="number" min="0" value={r.exp}
                  onChange={e => update(r.place, 'exp', e.target.value)}
                  style={{ width:70, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(126,184,247,0.2)', borderRadius:6, color:'#7eb8f7', padding:'4px 8px', fontSize:12, fontFamily:'Cinzel,serif', outline:'none' }} />
                <Toggle value={r.enabled} onChange={() => update(r.place, 'enabled', !r.enabled)} />
              </div>
            </div>
          ))}
        </div>

        <button onClick={save} disabled={saving}
          style={{ marginTop:24, width:'100%', padding:'14px', background: saved ? 'rgba(46,213,115,0.2)' : 'linear-gradient(135deg,#c9a84c,#7a5000)', border: saved ? '1px solid #2ed573' : '1px solid rgba(201,168,76,0.5)', borderRadius:10, color: saved ? '#2ed573' : '#1a0800', fontFamily:'Cinzel,serif', fontSize:13, fontWeight:900, letterSpacing:3, cursor:'pointer', textTransform:'uppercase', boxShadow:'0 4px 24px rgba(201,168,76,0.3)', transition:'all 0.3s' }}>
          {saving ? 'GUARDANDO...' : saved ? '✅ GUARDADO' : '💾 GUARDAR PREMIOS'}
        </button>
      </div>
    </div>
  );
}