import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '../../store/useUIStore';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { adminService } from '../../services/admin.service';
import { missionsService } from '../../services/missions.service';
import './AdminDashboard.mobile.css';
// ── KPI Panel Component ──────────────────────────────────────────────────
function KpiPanel({ kpiData, kpiLastUpdated, loadKpis }) {
  if (!kpiData) return null;
  const d = kpiData;
  const paidPct    = d.totalUsers ? Math.round(d.paidMembers / d.totalUsers * 100) : 0;
  const actPct     = d.totalUsers ? Math.round(d.activeThisWeek / d.totalUsers * 100) : 0;
  const dayEntries = Object.entries(d.dayBuckets);
  const maxDay     = Math.max(...dayEntries.map(([,v]) => v), 1);
  const dayLabels  = ['D','L','M','M','J','V','S'];
  const rankEntries = Object.entries(d.rankMap).sort((a,b) => b[1]-a[1]).slice(0,4);
  const maxRank    = Math.max(...rankEntries.map(([,v]) => v), 1);
  const isDropAlert = d.dropAlert < -30;
  const isGrowth    = d.dropAlert > 10;

  const c = {
    gold:   '#D4AF37',
    goldDim:'rgba(212,175,55,0.45)',
    bg:     'rgba(8,4,20,0.98)',
    bgCard: 'rgba(18,10,38,0.95)',
    border: 'rgba(212,175,55,0.12)',
    borderAlert: 'rgba(239,68,68,0.4)',
    borderGreen: 'rgba(74,222,128,0.35)',
    text:   '#E8E3FF',
    muted:  'rgba(232,227,255,0.45)',
    green:  '#4ADE80',
    red:    '#EF4444',
    blue:   '#60A5FA',
    purple: '#C084FC',
  };

  const card = (extra = {}) => ({
    background: c.bgCard,
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    padding: '8px 10px',
    ...extra,
  });

  const label = {
    fontSize: 9,
    letterSpacing: 2,
    color: c.goldDim,
    textTransform: 'uppercase',
    marginBottom: 4,
    display: 'block',
  };

  const bigNum = (color = c.gold) => ({
    fontSize: 32,
    fontWeight: 900,
    lineHeight: 1,
    color,
    fontFamily: 'Cinzel,serif',
  });

  const bar = (pct, color) => (
    <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:3, height:4, overflow:'hidden', width:'100%' }}>
      <div style={{ width:`${Math.min(pct,100)}%`, height:'100%', borderRadius:3, background:color, transition:'width 0.5s ease' }}/>
    </div>
  );

  const statRow = (label_, val, color = '#fff') => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
      <span style={{ fontSize:11, color:c.muted }}>{label_}</span>
      <span style={{ fontSize:12, fontWeight:700, color }}>{val}</span>
    </div>
  );

  return (
    <div style={{ fontFamily:'Cinzel,serif', color:c.text, width:280, display:'flex', flexDirection:'column', gap:6 }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
        <span style={{ width:5, height:5, borderRadius:'50%', background:c.green, display:'inline-block', flexShrink:0 }}/>
        <span style={{ fontSize:9, letterSpacing:2.5, color:c.goldDim, textTransform:'uppercase', flex:1 }}>En vivo</span>
        <span style={{ fontSize:7, color:'rgba(255,255,255,0.2)' }}>
          {kpiLastUpdated ? kpiLastUpdated.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}) : ''}
        </span>
        <button onClick={() => loadKpis()} style={{ background:'none', border:'none', color:c.goldDim, cursor:'pointer', fontSize:12, padding:0, lineHeight:1 }}>↺</button>
      </div>

      {/* ── Fila 1: Usuarios totales + Activos hoy ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>

        <div style={card()}>
          <span style={label}>Usuarios</span>
          <div style={bigNum()}>{d.totalUsers.toLocaleString()}</div>
          <div style={{ marginTop:5 }}>{bar(actPct, 'linear-gradient(90deg,#7c3aed,#c084fc)')}</div>
          <div style={{ fontSize:8, color:c.muted, marginTop:3 }}>{d.activeThisWeek} sem · {actPct}%</div>
        </div>

        <div style={card({
          border: `1px solid ${isDropAlert ? c.borderAlert : isGrowth ? c.borderGreen : c.border}`,
          background: isDropAlert ? 'rgba(239,68,68,0.06)' : isGrowth ? 'rgba(74,222,128,0.05)' : c.bgCard,
        })}>
          <span style={label}>Activos hoy</span>
          <div style={bigNum(isDropAlert ? c.red : isGrowth ? c.green : '#fff')}>{d.activeToday}</div>
          {d.dropAlert !== 0 && (
            <div style={{
              marginTop:4, fontSize:8, fontWeight:700,
              color: isDropAlert ? c.red : c.green,
            }}>
              {d.dropAlert > 0 ? '▲' : '▼'} {Math.abs(d.dropAlert)}%
              <span style={{ fontSize:7, fontWeight:400, color:c.muted, marginLeft:3 }}>vs ayer</span>
            </div>
          )}
          {d.dropAlert === 0 && <div style={{ fontSize:8, color:c.muted, marginTop:4 }}>sin cambio</div>}
        </div>
      </div>

      {/* ── Fila 2: Nuevos ── */}
      <div style={card()}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:0 }}>
          {[
            { v: `+${d.newToday}`,     l:'Hoy',    col:c.blue },
            { v: `+${d.newThisWeek}`,  l:'Semana', col:'rgba(96,165,250,0.7)' },
            { v: `+${d.newThisMonth}`, l:'Mes',    col:c.gold },
          ].map((it,i) => (
            <div key={i} style={{ textAlign:'center', borderRight: i < 2 ? `1px solid ${c.border}` : 'none', padding:'2px 0' }}>
              <div style={{ fontSize:20, fontWeight:900, color:it.col, lineHeight:1 }}>{it.v}</div>
              <div style={{ fontSize:9, color:c.muted, marginTop:3, letterSpacing:1 }}>{it.l}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:7 }}>
          {statRow('Membresías activas', `${d.paidMembers} (${paidPct}%)`, c.gold)}
          <div style={{ marginBottom:5 }}>{bar(paidPct, 'linear-gradient(90deg,#d97706,#f5c842)')}</div>
          {statRow('Conversión', `${d.convRate}%`, d.convRate > 20 ? c.green : d.convRate > 10 ? c.gold : c.red)}
        </div>
      </div>

      {/* ── Fila 3: Engagement 2×2 ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
        {[
          { l:'Órdenes hoy',   v:d.ordersToday,         col:d.ordersToday===0?c.red:c.gold,   icon:'🛒', alert:d.ordersToday===0 },
          { l:'Misiones 7d',   v:d.missionsCompleted7d, col:c.green,  icon:'⚔' },
          { l:'Referidos',     v:d.referralsDone,       col:c.purple, icon:'🔗' },
          { l:'Órdenes total', v:d.ordersTotal,         col:c.muted,  icon:'📦' },
        ].map(it => (
          <div key={it.l} style={card({ display:'flex', flexDirection:'column', gap:2 })}>
            <span style={{ fontSize:9 }}>{it.icon}{it.alert ? ' ⚠' : ''}</span>
            <span style={{ fontSize:20, fontWeight:900, color:it.col, lineHeight:1 }}>{it.v.toLocaleString()}</span>
            <span style={{ fontSize:9, color:c.muted, letterSpacing:1, textTransform:'uppercase' }}>{it.l}</span>
          </div>
        ))}
      </div>

      {/* ── Gráfica logins 7 días ── */}
      <div style={card()}>
        <span style={label}>Logins últimos 7 días</span>
        <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:36 }}>
          {dayEntries.map(([dateStr, count], i) => {
            const pct = Math.round(count / maxDay * 100);
            const isToday = i === dayEntries.length - 1;
            return (
              <div key={dateStr} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
                <span style={{ fontSize:6, color:isToday?c.gold:'rgba(255,255,255,0.2)' }}>{count||''}</span>
                <div style={{ width:'100%', flex:1, display:'flex', alignItems:'flex-end' }}>
                  <div style={{
                    width:'100%',
                    height:`${Math.max(pct,5)}%`,
                    background: isToday ? c.gold : 'rgba(124,58,237,0.5)',
                    borderRadius:'2px 2px 0 0',
                  }}/>
                </div>
                <span style={{ fontSize:6, color:isToday?c.gold:'rgba(255,255,255,0.25)' }}>
                  {dayLabels[new Date(dateStr).getDay()]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Top activos hoy ── */}
      {d.topActive.length > 0 && (
        <div style={card()}>
          <span style={label}>Top activos hoy</span>
          {d.topActive.map((u, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:i<d.topActive.length-1?5:0 }}>
              <span style={{ fontSize:8, color:c.goldDim, minWidth:10, textAlign:'right' }}>{i+1}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {u.templario_name || 'Templario'}
                </div>
                <div style={{ fontSize:7, color:c.muted }}>Nv {u.level} · {(u.xp||0).toLocaleString()} XP</div>
              </div>
              <span style={{ fontSize:8, fontWeight:700, color:c.purple }}>Nv{u.level}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Distribución ranks ── */}
      {rankEntries.length > 0 && (
        <div style={card()}>
          <span style={label}>Ranks</span>
          {rankEntries.map(([rank, count]) => {
            const pct = Math.round(count / maxRank * 100);
            return (
              <div key={rank} style={{ marginBottom:5 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                  <span style={{ fontSize:8, color:c.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130 }}>{rank||'Sin rank'}</span>
                  <span style={{ fontSize:8, fontWeight:700, color:'#fff' }}>{count}</span>
                </div>
                {bar(pct, 'linear-gradient(90deg,#7c3aed,#c084fc)')}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
export default function AdminDashboard() {
  const pushToast = useUIStore((s) => s.pushToast);
  const { data: stats } = useSupabaseQuery(() => adminService.getDashboardStats(), []);
  const { data: users, refetch: refetchUsers } = useSupabaseQuery(() => adminService.getAllUsers(), []);
  const { data: products, refetch: refetchProducts } = useSupabaseQuery(() => adminService.getAllProducts(), []);
  const { data: promoCodes, refetch: refetchPromoCodes } = useSupabaseQuery(() => adminService.getPromoCodes(), []);
  const { data: missions, refetch: refetchMissions } = useSupabaseQuery(() => adminService.getActiveMissions(), []);
  const { data: coins, refetch: refetchCoins } = useSupabaseQuery(async () => {
    const { supabase } = await import('../../services/supabase.js');
    const { data } = await supabase.from('propocoin_packages').select('*').order('sort_order');
    return data || [];
  }, []);
  const { data: offers, refetch: refetchOffers } = useSupabaseQuery(async () => {
    const { supabase } = await import('../../services/supabase.js');
    const { data } = await supabase.from('special_offers').select('*').order('sort_order');
    return data || [];
  }, []);

  const statsRef    = useRef(stats);
  const usersRef    = useRef(users);
  const processedMsgs = useRef(new Set());

  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { usersRef.current = users; }, [users]);
  const missionsRef = useRef(null);
  const coinsRef    = useRef(null);
  const offersRef   = useRef(null);
  const productsRef = useRef(null);

  // ── Equipo Admin ──────────────────────────────────────────────────────────
  const [leftOpen,  setLeftOpen]  = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [isMobile,  setIsMobile]  = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [showPrizes,  setShowPrizes]  = useState(false);
  const [showCats,    setShowCats]    = useState(false);
  const [cats,        setCats]        = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catDraft,    setCatDraft]    = useState({ name:'', color:'#C084FC', active:true });
  const [editingCat,  setEditingCat]  = useState(null);
  const [catSaving,   setCatSaving]   = useState(false);
  const [teamUsers,   setTeamUsers]   = useState([]);
  const [teamPerms,   setTeamPerms]   = useState({}); // { userId: { perm: true } }
  const [teamSearch,  setTeamSearch]  = useState('');
  const [teamLoading, setTeamLoading] = useState(false);
  const [expandedUser,setExpandedUser]= useState(null);
  const [teamFilter,  setTeamFilter]  = useState('all');
  const [showTeam,    setShowTeam]    = useState(false);
  const [teamLog,     setTeamLog]     = useState([]);
  const [showLog,     setShowLog]     = useState(false);
  const [prizes,      setPrizes]      = useState([]);
const [prizesTop,   setPrizesTop]   = useState([]);
const [prizesLoad,  setPrizesLoad]  = useState(false);
const [prizesSave,  setPrizesSave]  = useState(false);
const [prizesAward, setPrizesAward] = useState(false);
const [prizesResult,setPrizesResult]= useState(null);
const [confirmModal, setConfirmModal] = useState(null);
const [showCommunityPrizes, setShowCommunityPrizes] = useState(false);
const [communityPrizes,     setCommunityPrizes]     = useState([]);
const [communityPeriod,     setCommunityPeriod]     = useState('7d');
const [communityPrizesLoad, setCommunityPrizesLoad] = useState(false);
const [communityPrizesSave, setCommunityPrizesSave] = useState(false);
const [communityPrizesAward,setCommunityPrizesAward]= useState(false);
const [communityPrizesResult,setCommunityPrizesResult]= useState(null);
const [communityTop,        setCommunityTop]        = useState([]);
const [showHistory,         setShowHistory]         = useState(false);
  const [showInfractions,     setShowInfractions]     = useState(false);
  const [infractions,         setInfractions]         = useState([]);
  const [infractionsLoad,     setInfractionsLoad]     = useState(false);
  const [infractionsSearch,   setInfractionsSearch]   = useState('');
  const [infractionsPage,     setInfractionsPage]     = useState(0);
  const [infractionsTotal,    setInfractionsTotal]    = useState(0);
  const [liftingUser,         setLiftingUser]         = useState(null);
  const [infUserDetail,       setInfUserDetail]       = useState(null);
const [historyData,         setHistoryData]         = useState([]);
const [historyLoad,         setHistoryLoad]         = useState(false);
const [historyFilter,       setHistoryFilter]       = useState('all');
const [historyStatus,       setHistoryStatus]       = useState('all');
const [historyPage,         setHistoryPage]         = useState(0);
const [historyTotal,        setHistoryTotal]        = useState(0);
const [historyPending,      setHistoryPending]      = useState(0);
const [showReports,         setShowReports]         = useState(false);
// ── KPI Analytics ──────────────────────────────────────────────────────────
const [showKpis,       setShowKpis]       = useState(false);
const [kpiData,        setKpiData]        = useState(null);
const [kpiLoading,     setKpiLoading]     = useState(false);
const [kpiLastUpdated, setKpiLastUpdated] = useState(null);

// ── Sistema / Mantenimiento ────────────────────────────────────────────────
const [showSistema,        setShowSistema]        = useState(false);
const [mantConfig,         setMantConfig]         = useState({ active: false, message: 'Optimizando para una mejor experiencia.' });
const [mantScheduled,      setMantScheduled]      = useState({ enabled: false, activate_at: '', deactivate_at: '' });
const [mantAnnouncement,   setMantAnnouncement]   = useState({ active: false, text: '', show_until: '' });
const [mantLoading,        setMantLoading]        = useState(false);
const [mantSaving,         setMantSaving]         = useState(false);

const loadMaintenanceConfig = async () => {
  setMantLoading(true);
  const { supabase } = await import('../../services/supabase.js');
  const { data } = await supabase.from('app_config').select('key, value');
  (data || []).forEach(row => {
    if (row.key === 'maintenance')   setMantConfig(row.value);
    if (row.key === 'maintenance_scheduled') setMantScheduled(row.value);
    if (row.key === 'announcement')  setMantAnnouncement(row.value);
  });
  setMantLoading(false);
};

const toggleMaintenance = async () => {
  setMantSaving(true);
  const { supabase } = await import('../../services/supabase.js');
  const newVal = { ...mantConfig, active: !mantConfig.active };
  await supabase.from('app_config').update({ value: newVal }).eq('key', 'maintenance');
  setMantConfig(newVal);
  setMantSaving(false);
  pushToast(newVal.active ? '🔴 Mantenimiento ACTIVADO' : '✅ Mantenimiento DESACTIVADO');
};

const saveMantMessage = async () => {
  setMantSaving(true);
  const { supabase } = await import('../../services/supabase.js');
  await supabase.from('app_config').update({ value: mantConfig }).eq('key', 'maintenance');
  setMantSaving(false);
  pushToast('💾 Mensaje guardado');
};

const saveMantScheduled = async () => {
  setMantSaving(true);
  const { supabase } = await import('../../services/supabase.js');
  const { error } = await supabase.from('app_config').upsert({ key: 'maintenance_scheduled', value: mantScheduled }, { onConflict: 'key' });
  if (error) { pushToast('❌ ' + error.message); setMantSaving(false); return; }
  pushToast(mantScheduled.enabled ? '⏰ Programado guardado' : '⏰ Programado desactivado');
  setMantSaving(false);
};

const saveMantAnnouncement = async () => {
  setMantSaving(true);
  const { supabase } = await import('../../services/supabase.js');
  await supabase.from('app_config').update({ value: mantAnnouncement }).eq('key', 'announcement');
  setMantSaving(false);
  pushToast(mantAnnouncement.active ? '📢 Anuncio publicado' : '📢 Anuncio desactivado');
};

const loadKpis = async () => {
  setKpiLoading(true);
  const { supabase } = await import('../../services/supabase.js');
  try {
    const now             = new Date();
    const startOfDay      = new Date(now.toDateString());
    const yesterday       = new Date(now.getTime() - 86400000);
    const startOfYesterday= new Date(yesterday.toDateString());
    const startOfWeek     = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
    const startOf7d       = new Date(now.getTime() - 7  * 86400000);
    const startOf30d      = new Date(now.getTime() - 30 * 86400000);

    const [
      { count: totalUsers },
      { count: activeThisWeek },
      { count: activeToday },
      { count: activeYesterday },
      { count: newThisWeek },
      { count: newThisMonth },
      { count: newToday },
      { count: paidMembers },
      { count: missionsCompleted7d },
      { count: ordersToday },
      { count: ordersTotal },
      { count: referralsDone },
      { data: rankDist },
      { data: topActive },
      { data: topOrderUsers },
      { data: topMissionUsers },
      { data: productsSold },
      { data: topTemplarios },
      { data: evidences7d },
      { count: totalPromoRedeemed },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count:'exact', head:true }),
      supabase.from('profiles').select('id', { count:'exact', head:true }).gte('last_login_date', startOfWeek.toISOString()),
      supabase.from('profiles').select('id', { count:'exact', head:true }).gte('last_login_date', startOfDay.toISOString()),
      supabase.from('profiles').select('id', { count:'exact', head:true }).gte('last_login_date', startOfYesterday.toISOString()).lt('last_login_date', startOfDay.toISOString()),
      supabase.from('profiles').select('id', { count:'exact', head:true }).gte('created_at', startOfWeek.toISOString()),
      supabase.from('profiles').select('id', { count:'exact', head:true }).gte('created_at', startOf30d.toISOString()),
      supabase.from('profiles').select('id', { count:'exact', head:true }).gte('created_at', startOfDay.toISOString()),
      supabase.from('profiles').select('id', { count:'exact', head:true }).eq('membership_status', 'active'),
      supabase.from('user_missions').select('id', { count:'exact', head:true }).gte('completed_at', startOf7d.toISOString()),
      supabase.from('orders').select('id', { count:'exact', head:true }).gte('created_at', startOfDay.toISOString()),
      supabase.from('orders').select('id', { count:'exact', head:true }),
      supabase.from('referrals').select('id', { count:'exact', head:true }).eq('status', 'rewarded'),
      supabase.from('profiles').select('rank').limit(300),
      supabase.from('profiles').select('templario_name, level, xp, last_login_date').gte('last_login_date', startOfDay.toISOString()).order('xp', { ascending:false }).limit(5),
      // Top compradores (productos más canjeados por usuario)
      supabase.from('orders').select('user_id').gte('created_at', startOf30d.toISOString()).limit(500),
      // Top usuarios por misiones completadas
      supabase.from('user_missions').select('user_id').gte('completed_at', startOf30d.toISOString()).limit(500),
      // Productos más vendidos
      supabase.from('orders').select('items').not('items', 'is', null).limit(500),
      // Top Templarios del juego
      supabase.from('templo_players').select('id, char_name, weekly_points, correct, xp, streak, level').order('weekly_points', { ascending:false }).limit(5),
      // Evidencias enviadas últimos 7 días
      supabase.from('community_posts').select('id, created_at').gte('created_at', startOf7d.toISOString()).limit(200),
      // Códigos promo canjeados
      supabase.from('orders').select('id', { count:'exact', head:true }).not('promo_code', 'is', null),
    ]);

    const dropAlert = (activeYesterday || 0) > 0
      ? Math.round(((activeToday || 0) - (activeYesterday || 0)) / (activeYesterday || 1) * 100)
      : 0;
    const convRate = paidMembers ? Math.round(paidMembers / (totalUsers || 1) * 100) : 0;

    // Distribución de ranks
    const rankMap = {};
    (rankDist || []).forEach(r => { rankMap[r.rank] = (rankMap[r.rank] || 0) + 1; });

    // Logins por día — últimos 7 días
    const { data: loginDays } = await supabase
      .from('profiles').select('last_login_date')
      .gte('last_login_date', startOf7d.toISOString()).not('last_login_date', 'is', null);
    const dayBuckets = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      dayBuckets[d.toDateString()] = 0;
    }
    (loginDays || []).forEach(r => {
      const key = new Date(r.last_login_date).toDateString();
      if (key in dayBuckets) dayBuckets[key]++;
    });

    // Top compradores — agrupar por user_id
    const ordersByUser = {};
    (topOrderUsers || []).forEach(o => { ordersByUser[o.user_id] = (ordersByUser[o.user_id] || 0) + 1; });
    const topBuyersIds = Object.entries(ordersByUser).sort((a,b) => b[1]-a[1]).slice(0,5).map(([id,cnt]) => ({ id, cnt }));
    let topBuyersEnriched = topBuyersIds;
    if (topBuyersIds.length) {
      const { data: buyerProfiles } = await supabase.from('profiles').select('id, templario_name').in('id', topBuyersIds.map(b => b.id).filter(Boolean));
      const bmap = {}; (buyerProfiles || []).forEach(p => { bmap[p.id] = p.templario_name; });
      topBuyersEnriched = topBuyersIds.map(b => ({ ...b, name: bmap[b.id] || b.id.slice(0,8) }));
    }

    // Top usuarios por misiones
    const missionsByUser = {};
    (topMissionUsers || []).forEach(m => { missionsByUser[m.user_id] = (missionsByUser[m.user_id] || 0) + 1; });
    const topMissionIds = Object.entries(missionsByUser).sort((a,b) => b[1]-a[1]).slice(0,5).map(([id,cnt]) => ({ id, cnt }));
    let topMissionEnriched = topMissionIds;
    if (topMissionIds.length) {
      const { data: mProfiles } = await supabase.from('profiles').select('id, templario_name').in('id', topMissionIds.map(m => m.id).filter(Boolean));
      const mmap = {}; (mProfiles || []).forEach(p => { mmap[p.id] = p.templario_name; });
      topMissionEnriched = topMissionIds.map(m => ({ ...m, name: mmap[m.id] || m.id.slice(0,8) }));
    }

    // Productos más vendidos
    const productCount = {};
(productsSold || []).forEach(order => {
  try {
    const parsed = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    (Array.isArray(parsed) ? parsed : []).forEach(item => {
      const key = item.product_id?.slice(0, 8) || '?';
      productCount[key] = (productCount[key] || 0) + 1;
    });
  } catch (_) {}
});
    const topProducts = Object.entries(productCount).sort((a,b) => b[1]-a[1]).slice(0,5).map(([title,cnt]) => ({ title, cnt }));

    // Evidencias por día últimos 7d
    const evidenceBuckets = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      evidenceBuckets[d.toDateString()] = 0;
    }
    (evidences7d || []).forEach(e => {
      const key = new Date(e.created_at).toDateString();
      if (key in evidenceBuckets) evidenceBuckets[key]++;
    });

    // Templarios enriched
    const templarioIds = (topTemplarios || []).map(p => p.id);
    let templarioNames = {};
    if (templarioIds.length) {
      const { data: tProfiles } = await supabase.from('profiles').select('id, templario_name').in('id', templarioIds.filter(Boolean));
      (tProfiles || []).forEach(p => { templarioNames[p.id] = p.templario_name; });
    }
    const topTemplariosEnriched = (topTemplarios || []).map(p => ({ ...p, name: templarioNames[p.id] || p.char_name || 'Templario' }));

    setKpiData({
      totalUsers:           totalUsers         || 0,
      activeThisWeek:       activeThisWeek     || 0,
      activeToday:          activeToday        || 0,
      activeYesterday:      activeYesterday    || 0,
      dropAlert,
      newThisWeek:          newThisWeek        || 0,
      newThisMonth:         newThisMonth       || 0,
      newToday:             newToday           || 0,
      paidMembers:          paidMembers        || 0,
      convRate,
      missionsCompleted7d:  missionsCompleted7d || 0,
      ordersToday:          ordersToday        || 0,
      ordersTotal:          ordersTotal        || 0,
      referralsDone:        referralsDone      || 0,
      totalPromoRedeemed:   totalPromoRedeemed || 0,
      rankMap,
      dayBuckets,
      topActive:            topActive          || [],
      topBuyers:            topBuyersEnriched,
      topMissionUsers:      topMissionEnriched,
      topProducts,
      topTemplarios:        topTemplariosEnriched,
      evidenceBuckets,
    });
    setKpiLastUpdated(new Date());
  } catch (err) {
    pushToast('❌ Error KPIs: ' + err.message);
  } finally {
    setKpiLoading(false);
  }
};
const [reports,             setReports]             = useState([]);
const [reportsLoad,         setReportsLoad]         = useState(false);
const [reportFilter,        setReportFilter]        = useState('pendiente');

  const addLog = (type, msg) => {
    const time = new Date().toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' });
    setTeamLog(prev => [...prev.slice(-49), { type, msg, time }]);
  };

  const loadReports = async () => {
    setReportsLoad(true);
    const { supabase } = await import('../../services/supabase.js');
    const { data: reportData } = await supabase
      .from('user_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (!reportData) { setReportsLoad(false); return; }
    const userIds = [...new Set(reportData.map(r => r.user_id).filter(Boolean))];
    let profileMap = {};
    if (userIds.length) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, templario_name, email')
        .in('id', userIds);
      (profileData || []).forEach(p => { profileMap[p.id] = p; });
    }
    setReports(reportData.map(r => ({ ...r, profiles: profileMap[r.user_id] || null })));
    setReportsLoad(false);
  };

  const updateReportStatus = async (id, newStatus) => {
    const { supabase } = await import('../../services/supabase.js');
    await supabase.from('user_reports').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    pushToast(newStatus === 'resuelto' ? '✅ Marcado como resuelto' : '👀 En revisión');
  };

  const PERMS = [
    { key: 'comunidad_write', icon: '⚜️', label: 'Publicar como Guía',    desc: 'Mensajes del Guía en comunidad' },
    { key: 'comunidad_mod',   icon: '🛡️', label: 'Moderar comunidad',     desc: 'Borrar/ocultar posts de otros' },
    { key: 'academia_write',  icon: '🏛️', label: 'Editar academia',       desc: 'Crear y editar misiones' },
    { key: 'productos_write', icon: '🛒', label: 'Gestionar productos',   desc: 'Crear/editar productos y ofertas' },
    { key: 'usuarios_mod',    icon: '👥', label: 'Gestionar usuarios',    desc: 'Ver y moderar miembros' },
    { key: 'codigos_write',   icon: '🎟️', label: 'Códigos promo',        desc: 'Generar y gestionar códigos' },
    { key: 'finanzas_read',   icon: '📊', label: 'Ver finanzas',          desc: 'Estadísticas y métricas' },
    { key: 'super_admin',     icon: '👑', label: 'Super Admin',           desc: 'Acceso total — solo para ti' },
  ];

  const PRESETS = [
    { label: '⚜️ Guía de Contenido', perms: ['comunidad_write', 'academia_write'] },
    { label: '🛡️ Moderador',         perms: ['comunidad_mod', 'usuarios_mod'] },
    { label: '⚙️ Editor',            perms: ['academia_write', 'productos_write'] },
    { label: '🎯 Completo',          perms: ['comunidad_write','comunidad_mod','academia_write','productos_write','usuarios_mod','codigos_write','finanzas_read'] },
  ];

const loadCats = async () => {
    setCatsLoading(true);
    const { supabase } = await import('../../services/supabase.js');
    const { data } = await supabase
      .from('community_categories')
      .select('*')
      .order('sort_order');
    setCats(data || []);
    setCatsLoading(false);
  };

  const saveCat = async () => {
    setCatSaving(true);
    const { supabase } = await import('../../services/supabase.js');
    if (editingCat) {
      await supabase.from('community_categories').update({
        name: catDraft.name, color: catDraft.color, active: catDraft.active,
      }).eq('id', editingCat);
    } else {
      const maxOrder = cats.length ? Math.max(...cats.map(c => c.sort_order || 0)) + 1 : 0;
      await supabase.from('community_categories').insert({
        name: catDraft.name, color: catDraft.color, active: catDraft.active, sort_order: maxOrder,
      });
    }
    setCatDraft({ name:'', color:'#C084FC', active:true });
    setEditingCat(null);
    await loadCats();
    setCatSaving(false);
    pushToast(editingCat ? '✅ Categoría actualizada' : '✅ Categoría creada');
  };

  const deleteCat = async (id) => {
    const { supabase } = await import('../../services/supabase.js');
    await supabase.from('community_categories').delete().eq('id', id);
    await loadCats();
    pushToast('🗑 Categoría eliminada');
  };


const loadPrizes = async () => {
  setPrizesLoad(true);
  const { supabase } = await import('../../services/supabase.js');
  const [{ data: settingsData }, { data: playerData }] = await Promise.all([
    supabase.from('competition_settings').select('prizes').eq('id', 'current').maybeSingle(),
    supabase.from('templo_players')
      .select('id, char_name, weekly_points, correct, xp, answered_qids_week, streak, level')
      .order('weekly_points', { ascending: false })
      .limit(10),
  ]);
  const rawPrizes = settingsData?.prizes || {};
  const builtPrizes = Array.from({ length: 10 }, (_, i) => {
    const pos = i + 1;
    const p = rawPrizes[String(pos)] || {};
    return {
      position:     pos,
      label:        p.label        ?? `${pos}° Lugar`,
      coins_reward: p.propocoins   ?? 0,
      xp_reward:    p.exp          ?? 0,
      is_active:    p.enabled      ?? true,
    };
  });
  const ids = (playerData || []).map(p => p.id);
  const { data: profileData } = await supabase.from('profiles').select('id, templario_name').in('id', ids.filter(Boolean));
  const nameMap = {};
  (profileData || []).forEach(p => { nameMap[p.id] = p.templario_name; });
  setPrizes(builtPrizes);
  setPrizesTop((playerData || []).map(p => ({ ...p, name: nameMap[p.id] || p.char_name || 'Templario' })));
  setPrizesLoad(false);
};

const updatePrize = (position, field, value) => {
  setPrizes(prev => prev.map(p => p.position === position ? { ...p, [field]: value } : p));
};

const handleSavePrizes = async () => {
  setPrizesSave(true);
  const { supabase } = await import('../../services/supabase.js');
  try {
    const prizesJson = {};
    for (const prize of prizes) {
      prizesJson[String(prize.position)] = {
        propocoins: parseInt(prize.coins_reward) || 0,
        exp:        parseInt(prize.xp_reward)    || 0,
        enabled:    prize.is_active,
        label:      prize.label || `${prize.position}° Lugar`,
      };
    }
    const { error } = await supabase.from('competition_settings').upsert({
      id:         'current',
      prizes:     prizesJson,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) throw error;
    pushToast('✅ Premios guardados');
    await loadPrizes();
  } catch (err) {
    pushToast('❌ ' + err.message);
  } finally {
    setPrizesSave(false);
  }
};

const handleAwardPrizes = async () => {
  setConfirmModal({ message: '¿Entregar premios al Top ahora? Sumará XP y Cristales de forma permanente.', onConfirm: async () => {
  setPrizesAward(true);
  const { supabase } = await import('../../services/supabase.js');
  const awarded = [];
  try {
    const { data: players } = await supabase.from('templo_players')
      .select('id, char_name, weekly_points').order('weekly_points', { ascending: false }).limit(10);
    const { data: activePrizes } = await supabase.from('ranking_prizes')
      .select('*').eq('is_active', true).order('position');
    const { data: profiles } = await supabase.from('profiles')
      .select('id, templario_name, xp, cristales').in('id', (players || []).map(p => p.id).filter(Boolean));
    const profileMap = {};
    const nameMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p; nameMap[p.id] = p.templario_name; });
    for (const prize of (activePrizes || [])) {
      const player = (players || [])[prize.position - 1];
      if (!player || (player.weekly_points || 0) <= 0) continue;
      const profile = profileMap[player.id];
      if (!profile) continue;
      const { error } = await supabase.from('pending_rewards').insert({
        user_id:      player.id,
        category:     'templarios_ranking',
        period:       'weekly',
        period_key:   'weekly',
        position:     prize.position,
        coins_reward: prize.coins_reward || 0,
        xp_reward:    prize.xp_reward    || 0,
        claimed:      false,
      }).onConflict('user_id, category, period, claimed').ignore();
      if (!error) awarded.push({
        pos: prize.position,
        name: nameMap[player.id] || player.char_name || 'Templario',
        xp: prize.xp_reward,
        cristales: prize.coins_reward,
      });
    }
    setPrizesResult(awarded);
    pushToast(`🏆 Premios entregados a ${awarded.length} jugadores`);
  } catch (err) {
    pushToast('❌ ' + err.message);
  } finally {
    setPrizesAward(false);
  }
  }});
};

  const loadHistory = async (filter, status, page) => {
  setHistoryLoad(true);
  const { supabase } = await import('../../services/supabase.js');
  const PAGE_SIZE = 20;
  try {
    let q = supabase
      .from('pending_rewards')
      .select('id, user_id, category, period, position, coins_reward, xp_reward, claimed, claimed_at, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (filter !== 'all') q = q.eq('category', filter);
    if (status === 'claimed') q = q.eq('claimed', true);
    if (status === 'pending') q = q.eq('claimed', false);
    const { data, count, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) {
      setHistoryData([]);
      setHistoryTotal(count || 0);
      setHistoryLoad(false);
      return;
    }
    const userIds = [...new Set(data.map(r => r.user_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, templario_name, email')
      .in('id', userIds);
    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p; });
    const enriched = data.map(r => ({
      ...r,
      profile: profileMap[r.user_id] || null,
    }));
    setHistoryData(enriched);
    setHistoryTotal(count || 0);
  } catch (err) {
    console.error('loadHistory error:', err);
  } finally {
    setHistoryLoad(false);
  }
};

const loadInfractions = async (search, page) => {
    setInfractionsLoad(true);
    const { supabase } = await import('../../services/supabase.js');
    const PAGE_SIZE = 20;
    try {
      const userIds = [];
      if (search) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .or(`templario_name.ilike.%${search}%,email.ilike.%${search}%`);
        (profiles || []).forEach(p => userIds.push(p.id));
        if (userIds.length === 0) {
          setInfractions([]);
          setInfractionsTotal(0);
          setInfractionsLoad(false);
          return;
        }
      }

      let q = supabase
        .from('feed_infractions')
        .select('id, user_id, post_id, reason, auto_deleted, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (userIds.length > 0) q = q.in('user_id', userIds);

      const { data, count, error } = await q;
      if (error) throw error;

      const uniqueUserIds = [...new Set((data || []).map(r => r.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, templario_name, email, posting_restricted_until')
        .in('id', uniqueUserIds);

      const profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p; });

      const enriched = (data || []).map(r => ({
        ...r,
        profile: profileMap[r.user_id] || null,
      }));

      setInfractions(enriched);
      setInfractionsTotal(count || 0);
    } catch (err) {
      pushToast('❌ Error: ' + err.message);
    } finally {
      setInfractionsLoad(false);
    }
  };

  const liftRestriction = async (userId) => {
    setLiftingUser(userId);
    const { supabase } = await import('../../services/supabase.js');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ posting_restricted_until: null })
        .eq('id', userId);
      if (error) throw error;
      setInfractions(prev => prev.map(inf =>
        inf.user_id === userId
          ? { ...inf, profile: { ...inf.profile, posting_restricted_until: null } }
          : inf
      ));
      pushToast('✅ Restricción levantada');
    } catch (err) {
      pushToast('❌ ' + err.message);
    } finally {
      setLiftingUser(null);
    }
  };

  const restrictUser = async (userId, hours) => {
    const { supabase } = await import('../../services/supabase.js');
    try {
      const until = new Date(Date.now() + hours * 3600000).toISOString();
      const { error } = await supabase
        .from('profiles')
        .update({ posting_restricted_until: until })
        .eq('id', userId);
      if (error) throw error;
      setInfractions(prev => prev.map(inf =>
        inf.user_id === userId
          ? { ...inf, profile: { ...inf.profile, posting_restricted_until: until } }
          : inf
      ));
      pushToast(`🚫 Usuario restringido ${hours}h`);
    } catch (err) {
      pushToast('❌ ' + err.message);
    }
  };

  const loadHistoryPendingCount = async () => {
  const { supabase } = await import('../../services/supabase.js');
  const { count } = await supabase
    .from('pending_rewards')
    .select('id', { count: 'exact', head: true })
    .eq('claimed', false);
  setHistoryPending(count || 0);
};

const loadCommunityPrizes = async (period) => {
  const activePeriod = period || communityPeriod;
  setCommunityPrizesLoad(true);
  const { supabase } = await import('../../services/supabase.js');
  const tableMap = { '7d': 'community_leaderboard_7d', '30d': 'community_leaderboard_30d', 'all': 'community_leaderboard_alltime' };
  const pointsMap = { '7d': 'points_7d', '30d': 'points_30d', 'all': 'community_points' };
  const table = tableMap[activePeriod];
  const pointsCol = pointsMap[activePeriod];
  try {
    const [{ data: prizeData, error: e1 }, { data: topData }] = await Promise.all([
      supabase.from('community_ranking_prizes').select('*'),
      supabase.from(table).select(`user_id, full_name, ${pointsCol}`).order(pointsCol, { ascending: false }).limit(10),
    ]);
    if (e1) throw e1;
    setCommunityPrizes([...(prizeData || [])]);
    setCommunityTop((topData || []).map(u => ({ id: u.user_id, name: u.full_name || 'Usuario', pts: u[pointsCol] || 0 })));
  } catch (err) {
    pushToast('❌ Error cargando premios: ' + err.message);
  } finally {
    setCommunityPrizesLoad(false);
  }
};

const updateCommunityPrize = (period, position, field, value) => {
  setCommunityPrizes(prev => prev.map(p =>
    p.period === period && p.position === position ? { ...p, [field]: value } : p
  ));
};

const handleSaveCommunityPrizes = async () => {
  setCommunityPrizesSave(true);
  const { supabase } = await import('../../services/supabase.js');
  try {
    for (const prize of communityPrizes) {
      const { error } = await supabase.from('community_ranking_prizes').update({
        xp_reward:    parseInt(prize.xp_reward)    || 0,
        coins_reward: parseInt(prize.coins_reward) || 0,
        is_active:    prize.is_active,
        label:        prize.label || '',
        updated_at:   new Date().toISOString(),
      }).eq('id', prize.id);
      if (error) throw error;
    }
    pushToast('✅ Premios academia guardados');
    await loadCommunityPrizes();
  } catch (err) {
    pushToast('❌ ' + err.message);
  } finally {
    setCommunityPrizesSave(false);
  }
};

const handleResetCommunityPeriod = async (period) => {
  const label = period === '7d' ? '7 Días' : '30 Días';
  const days  = period === '7d' ? 7 : 30;
  setConfirmModal({ message: `¿Reiniciar temporada de ${label}? Se borrarán los puntos del período. Los puntos all-time se conservan.`, onConfirm: async () => {
  const { supabase } = await import('../../services/supabase.js');
  try {
    const { error } = await supabase.rpc('reset_community_period', { days_back: days });
    if (error) throw error;
    pushToast(`🔄 Temporada ${label} reiniciada`);
    await loadCommunityPrizes(period);
  } catch (err) {
    pushToast('❌ ' + err.message);
  }
  }});
};

const handleAwardCommunityPrizes = async () => {
  setConfirmModal({ message: `¿Entregar premios del ranking "${communityPeriod === '7d' ? '7 Días' : '30 Días'}" ahora? Sumará PropoCoins y XP de forma permanente.`, onConfirm: async () => {
  setCommunityPrizesAward(true);
  const { supabase } = await import('../../services/supabase.js');
  const awarded = [];
  try {
    const tableMap  = { '7d': 'community_leaderboard_7d', '30d': 'community_leaderboard_30d', 'all': 'community_leaderboard_alltime' };
    const pointsMap = { '7d': 'points_7d', '30d': 'points_30d', 'all': 'community_points' };
    const table     = tableMap[communityPeriod];
    const pointsCol = pointsMap[communityPeriod];
    const { data: players } = await supabase.from(table)
      .select(`user_id, full_name, ${pointsCol}`)
      .order(pointsCol, { ascending: false })
      .limit(10);
    const { data: profiles } = await supabase.from('profiles')
      .select('id, xp, cristales')
      .in('id', (players || []).map(p => p.user_id).filter(Boolean));
    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p; });
    const activePrizes = communityPrizes.filter(p => p.period === communityPeriod && p.is_active);
    for (const prize of activePrizes) {
      const player = (players || [])[prize.position - 1];
      if (!player || (player[pointsCol] || 0) <= 0) continue;
      const profile = profileMap[player.user_id];
      if (!profile) continue;
      const { error } = await supabase.from('pending_rewards').insert({
        user_id:      player.user_id,
        category:     'community_ranking',
        period:       communityPeriod,
        period_key:   communityPeriod,
        position:     prize.position,
        coins_reward: prize.coins_reward || 0,
        xp_reward:    prize.xp_reward    || 0,
        claimed:      false,
      }).onConflict('user_id, category, period, claimed').ignore();
      if (!error) awarded.push({
        pos: prize.position,
        name: player.full_name || 'Usuario',
        xp: prize.xp_reward,
        cristales: prize.coins_reward,
      });
    }
    setCommunityPrizesResult(awarded);
    pushToast(`🏅 Premios entregados a ${awarded.length} usuarios`);
  } catch (err) {
    pushToast('❌ ' + err.message);
  } finally {
    setCommunityPrizesAward(false);
  }
  }});
};

const loadTeam = async () => {
    setTeamLoading(true);
    const { supabase } = await import('../../services/supabase.js');
    const [{ data: profiles }, { data: perms }] = await Promise.all([
      supabase.from('profiles').select('id, templario_name, email, is_admin').order('templario_name'),
      supabase.from('team_permissions').select('user_id, permission'),
    ]);
    setTeamUsers(profiles || []);
    const map = {};
    (perms || []).forEach(p => {
      if (!map[p.user_id]) map[p.user_id] = {};
      map[p.user_id][p.permission] = true;
    });
    console.log('🔑 MAP CARGADO:', JSON.stringify(map));
    setTeamPerms(map);
    setTeamLoading(false);
  };
  useEffect(() => {
  if (!showKpis) return;
  const handler = (e) => {
    if (!e.target.closest('[data-kpi-panel]')) setShowKpis(false);
  };
  document.addEventListener('mousedown', handler);
  return () => document.removeEventListener('mousedown', handler);
}, [showKpis]);

// ── Auto-carga KPIs al entrar y refresca cada 60s ──
  useEffect(() => {
    loadKpis();
    loadHistoryPendingCount();
    const interval = setInterval(() => {
      loadKpis();
      loadHistoryPendingCount();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { if (showPrizes) loadPrizes(); }, [showPrizes]);
  useEffect(() => {
    if (showInfractions) loadInfractions(infractionsSearch, infractionsPage);
  }, [showInfractions, infractionsPage]);
  useEffect(() => {
  if (showHistory) {
    loadHistory(historyFilter, historyStatus, historyPage);
    loadHistoryPendingCount();
  }
}, [showHistory, historyFilter, historyStatus, historyPage]);
  useEffect(() => {
  if (!showCommunityPrizes) return;
  const activePeriod = communityPeriod;
  setCommunityPrizesLoad(true);
  const tableMap = { '7d': 'community_leaderboard_7d', '30d': 'community_leaderboard_30d', 'all': 'community_leaderboard_alltime' };
  const pointsMap = { '7d': 'points_7d', '30d': 'points_30d', 'all': 'community_points' };
  const table = tableMap[activePeriod];
  const pointsCol = pointsMap[activePeriod];
  (async () => {
    try {
      const { supabase } = await import('../../services/supabase.js');
      const [{ data: prizeData, error: e1 }, { data: topData }] = await Promise.all([
        supabase.from('community_ranking_prizes').select('*'),
        supabase.from(table).select(`user_id, full_name, ${pointsCol}`).order(pointsCol, { ascending: false }).limit(10),
      ]);
      if (e1) throw e1;
      setCommunityPrizes([...(prizeData || [])]);
      setCommunityTop((topData || []).map(u => ({ id: u.user_id, name: u.full_name || 'Usuario', pts: u[pointsCol] || 0 })));
    } catch (err) {
      pushToast('❌ Error cargando premios: ' + err.message);
    } finally {
      setCommunityPrizesLoad(false);
    }
  })();
}, [showCommunityPrizes, communityPeriod]);

  const togglePerm = async (userId, perm) => {
    const { supabase } = await import('../../services/supabase.js');
    const has = !!(teamPerms[userId]?.[perm]);
    if (has) {
      await supabase.from('team_permissions').delete().eq('user_id', userId).eq('permission', perm);
    } else {
      await supabase.from('team_permissions').insert({ user_id: userId, permission: perm });
    }
    setTeamPerms(prev => {
      const updated = { ...(prev[userId] || {}) };
      if (has) {
        delete updated[perm];
      } else {
        updated[perm] = true;
      }
      return { ...prev, [userId]: { ...updated } };
    });
    if (perm === 'super_admin') {
      await supabase.from('profiles').update({ is_admin: !has }).eq('id', userId);
      setTeamUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !has } : u));
    }
    const userName = teamUsers.find(u => u.id === userId)?.templario_name || userId;
    const permLabel = PERMS.find(p => p.key === perm)?.label || perm;
    addLog(has ? 'remove' : 'add', `${has ? '−' : '+'} ${permLabel} → ${userName}`);
    pushToast(has ? `⚠ Permiso removido` : `✅ Permiso activado`);
  };

  const applyPreset = async (userId, presetPerms) => {
    const { supabase } = await import('../../services/supabase.js');
    await supabase.from('team_permissions').delete().eq('user_id', userId);
    if (presetPerms.length) {
      await supabase.from('team_permissions').insert(presetPerms.map(p => ({ user_id: userId, permission: p })));
    }
    const newPerms = {};
    presetPerms.forEach(p => { newPerms[p] = true; });
    setTeamPerms(prev => ({ ...prev, [userId]: newPerms }));
    const userName = teamUsers.find(u => u.id === userId)?.templario_name || userId;
    const presetName = PRESETS.find(p => JSON.stringify(p.perms) === JSON.stringify(presetPerms))?.label || 'Personalizado';
    addLog('preset', `🎯 Rol "${presetName}" → ${userName}`);
    pushToast('✅ Rol aplicado');
  };
const sendToFrame = (type, data) => {
    document.getElementById('admin-frame')
      ?.contentWindow?.postMessage({ type, data }, '*');
  };

  useEffect(() => { if (stats)    sendToFrame('stats',    stats);    }, [stats]);
  useEffect(() => { if (users)    sendToFrame('users',    users);    }, [users]);
  useEffect(() => { if (missions) sendToFrame('missions', missions); }, [missions]);
  useEffect(() => { if (coins)    sendToFrame('coins',    coins);    }, [coins]);
  useEffect(() => { if (offers)   sendToFrame('offers',   offers);   }, [offers]);
  useEffect(() => { if (products?.length) sendToFrame('products', products); }, [products]);
  useEffect(() => { if (promoCodes) sendToFrame('promo-codes', promoCodes); }, [promoCodes]);

  useEffect(() => {
    const handleMessage = async (event) => {
      // =============================================
      // READY
      // =============================================
      if (event.data?.type === 'ready') {
        sendToFrame('config', {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
          supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        });
        if (statsRef.current)    sendToFrame('stats',    statsRef.current);
        if (usersRef.current)    sendToFrame('users',    usersRef.current);
        if (missionsRef.current) sendToFrame('missions', missionsRef.current);
        if (offersRef.current)   sendToFrame('offers',   offersRef.current);
if (productsRef.current) sendToFrame('products', productsRef.current);
const bonuses = await missionsService.getAllBonusConfigs();
sendToFrame('bonuses', bonuses);
      }

      // =============================================
      // DEPOSITAR CRISTALES
      // =============================================
     if (event.data?.type === 'deposit') {
  const _key = event.data.email + event.data.amount;
  if (processedMsgs.current.has(_key)) return;
  processedMsgs.current.add(_key);
  setTimeout(() => processedMsgs.current.delete(_key), 2000);
  const { email, amount } = event.data;
  const user = usersRef.current?.find(u => 
    u.email?.toLowerCase().trim() === email?.toLowerCase().trim()
  );
  if (!user) { 
    console.log('usuarios en ref:', usersRef.current?.map(u=>u.email)); 
    sendToFrame('toast', '⚠ Usuario no encontrado'); 
    return; 
  }
  // Solo una llamada a depositCristales
  await adminService.depositCristales(user.id, parseInt(amount), 'manual');
  pushToast(`+${amount} cristales a ${user.templario_name}`);
  sendToFrame('toast', `✅ ${amount} cristales depositados`);
  refetchUsers();
}

      // =============================================
      // GENERAR CÓDIGOS
      // =============================================
      if (event.data?.type === 'generate-codes') {
        const codes = await adminService.generateCodes(event.data.qty || 5, event.data.prefix || '', event.data.membership_type || 'standard', event.data.duration_months || 1);
        sendToFrame('codes', codes);
        pushToast(`${codes.length} códigos generados`);
      }

      // =============================================
      // REVOCAR USUARIO
      // =============================================
      if (event.data?.type === 'revoke-user' || event.data?.type === 'revoke-access') {
        const user = usersRef.current?.find(u => u.email === event.data.email);
        if (user) { await adminService.revokeAccess(user.id); pushToast('Usuario revocado'); refetchUsers(); }
      }

      // =============================================
      // TOGGLE MISIÓN
      // =============================================
      if (event.data?.type === 'toggle-mission') {
        await adminService.toggleMission(event.data.id, event.data.is_active);
        refetchMissions();
      }

      // =============================================
      // CREAR MISIÓN
      // =============================================
      if (event.data?.type === 'create-mission') {
        try {
          let { image_base64, ...mission } = event.data.mission;
          if (image_base64) {
            const url = await adminService.uploadImageBase64(image_base64);
            mission.image_url = url;
          }
          await adminService.createMission(mission);
          refetchMissions();
          pushToast('✅ Misión creada');
          sendToFrame('mission-saved', null);
        } catch (err) {
          console.error('CREATE MISSION ERROR:', JSON.stringify(err), err?.message, err?.details, err?.hint);
          pushToast('❌ Error: ' + err.message);
          sendToFrame('toast', '❌ Error: ' + err.message);
        }
      }

      // =============================================
      // ACTUALIZAR MISIÓN
      // =============================================
      if (event.data?.type === 'update-mission') {
        try {
          let { image_base64, ...mission } = event.data.mission;
          if (image_base64) {
            const url = await adminService.uploadImageBase64(image_base64);
            mission.image_url = url;
          }
          await adminService.updateMission(event.data.id, mission);
          refetchMissions();
          pushToast('✅ Misión actualizada');
          sendToFrame('mission-saved', null);
        } catch (err) {
          console.error('UPDATE MISSION ERROR:', err);
          pushToast('❌ Error: ' + err.message);
          sendToFrame('toast', '❌ Error: ' + err.message);
        }
      }

      // =============================================
      // ELIMINAR MISIÓN
      // =============================================
      if (event.data?.type === 'delete-mission') {
        try {
          const { supabase } = await import('../../services/supabase.js');
          const { error } = await supabase
            .from('missions')
            .delete()
            .eq('id', event.data.id);
          if (error) throw error;
          pushToast('🗑 Misión eliminada');
          const { data: freshMissions } = await supabase
            .from('missions')
            .select('*')
            .order('priority');
          sendToFrame('missions', freshMissions || []);
          refetchMissions();
        } catch(err) {
          console.error('DELETE MISSION ERROR:', JSON.stringify(err));
          pushToast('❌ Error al eliminar: ' + err.message);
          sendToFrame('toast', '❌ Error: ' + err.message);
        }
      }

      // =============================================
      // CREAR PRODUCTO
      // =============================================
      if (event.data?.type === 'create-product') {
        try {
          let { image_base64, ...product } = event.data.product;
          if (image_base64) {
            const url = await adminService.uploadImageBase64(image_base64);
            product.asset_url = url;
          }
          await adminService.createProduct(product);
          refetchProducts();
          pushToast('✅ Producto creado');
          sendToFrame('product-saved', null);
        } catch (err) {
          pushToast('❌ Error: ' + err.message);
        }
      }

      // =============================================
      // ACTUALIZAR PRODUCTO
      // =============================================
      if (event.data?.type === 'update-product') {
        try {
          let { image_base64, ...product } = event.data.product;
          if (image_base64) {
            const url = await adminService.uploadImageBase64(image_base64);
            product.asset_url = url;
          }
          await adminService.updateProduct(event.data.id, product);
          refetchProducts();
          pushToast('✅ Producto actualizado');
          sendToFrame('product-saved', null);
        } catch (err) {
          pushToast('❌ Error: ' + err.message);
        }
      }

      // =============================================
      // TOGGLE PRODUCTO
      // =============================================
      if (event.data?.type === 'toggle-product') {
        await adminService.toggleProduct(event.data.id, event.data.is_active);
        refetchProducts();
        pushToast(event.data.is_active ? '✅ Producto activado' : '⚠ Producto desactivado');
      }

      // =============================================
      // ELIMINAR PRODUCTO
      // =============================================
      if (event.data?.type === 'delete-product') {
        await adminService.deleteProduct(event.data.id);
        refetchProducts();
        pushToast('🗑 Producto eliminado');
      }

      // =============================================
      // CREAR CÓDIGO PROMOCIONAL
      // =============================================
      if (event.data?.type === 'create-promo-code') {
  try {
    await adminService.createPromoCode(event.data.payload);
    const codes = await adminService.getPromoCodes();
    sendToFrame('promo-codes', codes);
    pushToast('✅ Código promo creado');
    sendToFrame('promo-saved', null);
  } catch (err) {
    pushToast('❌ Error: ' + err.message);
    sendToFrame('toast', '❌ Error: ' + err.message);
  }
}

      // =============================================
      // TOGGLE CÓDIGO PROMOCIONAL
      // =============================================
      if (event.data?.type === 'toggle-promo-code') {
  await adminService.togglePromoCode(event.data.id, event.data.is_active);
  const codes = await adminService.getPromoCodes();
  sendToFrame('promo-codes', codes);
}

if (event.data?.type === 'delete-promo-code') {
  await adminService.deletePromoCode(event.data.id);
  const codes = await adminService.getPromoCodes();
  sendToFrame('promo-codes', codes);
  pushToast('🗑 Código eliminado');
}

      // =============================================
      // OBTENER BONUSES
      // =============================================
      if (event.data?.type === 'get-bonuses') {
        const bonuses = await missionsService.getAllBonusConfigs();
        sendToFrame('bonuses', bonuses);
      }

      // =============================================
      // CREAR BONUS
      // =============================================
      if (event.data?.type === 'create-bonus') {
        try {
          await missionsService.createBonusConfig(event.data.payload);
          const bonuses = await missionsService.getAllBonusConfigs();
          sendToFrame('bonuses', bonuses);
          pushToast('✅ Bonus creado');
          sendToFrame('bonus-saved', null);
        } catch (err) {
          pushToast('❌ Error: ' + err.message);
          sendToFrame('toast', '❌ Error: ' + err.message);
        }
      }

      // =============================================
      // ACTUALIZAR BONUS
      // =============================================
      if (event.data?.type === 'update-bonus') {
        try {
          await missionsService.updateBonusConfig(event.data.id, event.data.payload);
          const bonuses = await missionsService.getAllBonusConfigs();
          sendToFrame('bonuses', bonuses);
          pushToast('✅ Bonus actualizado');
          sendToFrame('bonus-saved', null);
        } catch (err) {
          pushToast('❌ Error: ' + err.message);
          sendToFrame('toast', '❌ Error: ' + err.message);
        }
      }

      // =============================================
      // TOGGLE BONUS
      // =============================================
      if (event.data?.type === 'toggle-bonus') {
        await missionsService.toggleBonusConfig(event.data.id, event.data.is_active);
        const bonuses = await missionsService.getAllBonusConfigs();
        sendToFrame('bonuses', bonuses);
        pushToast(event.data.is_active ? '✅ Bonus activado' : '⚠ Bonus desactivado');
      }

      // =============================================
      // ELIMINAR BONUS
      // =============================================
      if (event.data?.type === 'delete-bonus') {
        await missionsService.deleteBonusConfig(event.data.id);
        const bonuses = await missionsService.getAllBonusConfigs();
        sendToFrame('bonuses', bonuses);
        pushToast('🗑 Bonus eliminado');
      }

      // =============================================
      // CREAR OFERTA
      // =============================================
      if (event.data?.type === 'create-offer') {
        const { supabase } = await import('../../services/supabase.js');
        const MS = { minutes:60000, hours:3600000, days:86400000, weeks:604800000, months:2592000000 };
        const offer = event.data.offer;
        let ends_at = null;
        if (offer.time_type !== 'permanent' && offer.duration) {
          ends_at = new Date(Date.now() + offer.duration * (MS[offer.time_type] || 0)).toISOString();
        }
        await supabase.from('special_offers').insert({ ...offer, ends_at });
        refetchOffers();
        pushToast('✅ Oferta creada');
        sendToFrame('offer-saved', null);
      }

      // =============================================
      // ACTUALIZAR OFERTA
      // =============================================
      if (event.data?.type === 'update-offer') {
        const { supabase } = await import('../../services/supabase.js');
        await supabase.from('special_offers').update(event.data.offer).eq('id', event.data.id);
        refetchOffers();
        pushToast('✅ Oferta actualizada');
        sendToFrame('offer-saved', null);
      }

      // =============================================
      // TOGGLE OFERTA
      // =============================================
      if (event.data?.type === 'toggle-offer') {
        const { supabase } = await import('../../services/supabase.js');
        await supabase.from('special_offers').update({ is_active: event.data.is_active }).eq('id', event.data.id);
        refetchOffers();
        pushToast(event.data.is_active ? '✅ Oferta activada' : '⚠ Oferta pausada');
      }

      // =============================================
      // ELIMINAR OFERTA
      // =============================================
      if (event.data?.type === 'delete-offer') {
        const { supabase } = await import('../../services/supabase.js');
        await supabase.from('special_offers').delete().eq('id', event.data.id);
        refetchOffers();
        pushToast('🗑 Oferta eliminada');
      }

      // =============================================
      // CREAR PACK DE PROPÓCOIN
      // =============================================
      if (event.data?.type === 'create-coin') {
        const { supabase } = await import('../../services/supabase.js');
        await supabase.from('propocoin_packages').insert(event.data.pkg);
        refetchCoins();
        pushToast('✅ Pack creado');
        sendToFrame('coin-saved', null);
      }

      // =============================================
      // ACTUALIZAR PACK
      // =============================================
      if (event.data?.type === 'update-coin') {
        const { supabase } = await import('../../services/supabase.js');
        await supabase.from('propocoin_packages').update(event.data.pkg).eq('id', event.data.id);
        refetchCoins();
        pushToast('✅ Pack actualizado');
        sendToFrame('coin-saved', null);
      }

      // =============================================
      // TOGGLE PACK
      // =============================================
      if (event.data?.type === 'toggle-coin') {
        const { supabase } = await import('../../services/supabase.js');
        await supabase.from('propocoin_packages').update({ is_active: event.data.is_active }).eq('id', event.data.id);
        refetchCoins();
        pushToast(event.data.is_active ? '✅ Pack activado' : '⚠ Pack pausado');
      }

      // =============================================
      // ELIMINAR PACK
      // =============================================
      if (event.data?.type === 'delete-coin') {
        const { supabase } = await import('../../services/supabase.js');
        await supabase.from('propocoin_packages').delete().eq('id', event.data.id);
        refetchCoins();
        pushToast('🗑 Pack eliminado');
      }

      // =============================================
      // CREAR RECOMPENSA POR NIVEL
      // =============================================
      if (event.data?.type === 'create-level-reward') {
        try {
          const { supabase } = await import('../../services/supabase.js');
          
          const reward = event.data.reward;
          
          const { error } = await supabase
            .from('level_rewards')
            .insert({
              level: parseInt(reward.level),
              title: reward.title,
              description: reward.description,
              icon_emoji: reward.icon_emoji,
              reward_type: reward.reward_type,
              reward_value: reward.reward_value,
              image_url: reward.image_url || null,
              is_active: true
            });
          
          if (error) throw error;
          
          pushToast('✅ Recompensa de nivel creada');
          sendToFrame('level-reward-saved', null);
          sendToFrame('toast', '✅ Recompensa creada exitosamente');
          
        } catch (err) {
          console.error('Error creating level reward:', err);
          pushToast('❌ Error: ' + err.message);
          sendToFrame('toast', '❌ Error: ' + err.message);
        }
      }

      // =============================================
      // OBTENER RECOMPENSAS POR NIVEL
      // =============================================
      if (event.data?.type === 'get-level-rewards') {
        try {
          const { supabase } = await import('../../services/supabase.js');
          
          const { data, error } = await supabase
            .from('level_rewards')
            .select('*')
            .order('level', { ascending: true });
          
          if (error) throw error;
          
          sendToFrame('level-rewards-list', data);
        } catch (err) {
          console.error('Error fetching level rewards:', err);
          sendToFrame('toast', '❌ Error al cargar recompensas');
        }
      }

      // =============================================
      // EDITAR RECOMPENSA POR NIVEL
      // =============================================
      if (event.data?.type === 'update-level-reward') {
        try {
          const { supabase } = await import('../../services/supabase.js');
          
          const reward = event.data.reward;
          
          const { error } = await supabase
            .from('level_rewards')
            .update({
              level: parseInt(reward.level),
              title: reward.title,
              description: reward.description,
              icon_emoji: reward.icon_emoji,
              reward_type: reward.reward_type,
              reward_value: reward.reward_value,
              image_url: reward.image_url || null,
              updated_at: new Date()
            })
            .eq('id', event.data.id);
          
          if (error) throw error;
          
          pushToast('✏️ Recompensa actualizada');
          sendToFrame('toast', '✅ Recompensa actualizada');
          
          const { data } = await supabase
            .from('level_rewards')
            .select('*')
            .order('level', { ascending: true });
          
          sendToFrame('level-rewards-list', data);
          sendToFrame('level-reward-saved', null);
          
        } catch (err) {
          console.error('Error updating level reward:', err);
          pushToast('❌ Error: ' + err.message);
          sendToFrame('toast', '❌ Error al actualizar');
        }
      }

      // =============================================
      // OCULTAR/MOSTRAR RECOMPENSA POR NIVEL
      // =============================================
      if (event.data?.type === 'toggle-level-reward') {
        try {
          const { supabase } = await import('../../services/supabase.js');
          
          const { error } = await supabase
            .from('level_rewards')
            .update({ 
              is_active: event.data.is_active,
              updated_at: new Date()
            })
            .eq('id', event.data.id);
          
          if (error) throw error;
          
          const mensaje = event.data.is_active ? '👁️ Recompensa visible' : '🙈 Recompensa oculta';
          pushToast(mensaje);
          sendToFrame('toast', event.data.is_active ? '✅ Visible para usuarios' : '⚠ Ocultada para usuarios');
          
          const { data } = await supabase
            .from('level_rewards')
            .select('*')
            .order('level', { ascending: true });
          
          sendToFrame('level-rewards-list', data);
          
        } catch (err) {
          console.error('Error toggling level reward:', err);
          pushToast('❌ Error: ' + err.message);
          sendToFrame('toast', '❌ Error al cambiar visibilidad');
        }
      }

      // =============================================
      // SET MEMBRESÍA MANUAL (+1 mes / +6 meses)
      // =============================================
      if (event.data?.type === 'set-membership') {
        try {
          const { supabase } = await import('../../services/supabase.js');
          const { userId, months } = event.data;
          const { data: profile } = await supabase
            .from('profiles')
            .select('membership_expires_at')
            .eq('id', userId)
            .single();
          const base = profile?.membership_expires_at
            ? new Date(profile.membership_expires_at)
            : new Date();
          if (base < new Date()) base.setTime(Date.now());
          base.setMonth(base.getMonth() + months);
          await supabase.from('profiles').update({
            membership_type:       'paid',
            membership_expires_at: base.toISOString(),
            updated_at:            new Date().toISOString(),
          }).eq('id', userId);
          pushToast(`✅ +${months} mes(es) activados`);
          sendToFrame('membership-updated', `✅ +${months} mes(es) activados`);
          refetchUsers();
        } catch (err) {
          pushToast('❌ Error: ' + err.message);
        }
      }

      // =============================================
      // SET MEMBRESÍA VIP PERMANENTE
      // =============================================
      if (event.data?.type === 'set-membership-vip') {
        try {
          const { supabase } = await import('../../services/supabase.js');
          await supabase.from('profiles').update({
            membership_type:       'vip',
            membership_expires_at: null,
            updated_at:            new Date().toISOString(),
          }).eq('id', event.data.userId);
          pushToast('👑 VIP activado');
          sendToFrame('membership-updated', '👑 VIP permanente activado');
          refetchUsers();
        } catch (err) {
          pushToast('❌ Error: ' + err.message);
        }
      }

      // =============================================
      // REVOCAR MEMBRESÍA
      // =============================================
      if (event.data?.type === 'revoke-membership') {
        try {
          const { supabase } = await import('../../services/supabase.js');
          await supabase.from('profiles').update({
            membership_type:       'free',
            membership_expires_at: null,
            updated_at:            new Date().toISOString(),
          }).eq('id', event.data.userId);
          pushToast('🚫 Membresía revocada');
          sendToFrame('membership-updated', '🚫 Membresía revocada');
          refetchUsers();
        } catch (err) {
          pushToast('❌ Error: ' + err.message);
        }
      }

      // =============================================
      // ENTREGAR PREMIOS TOP 3 Y TOP 10
      // =============================================
      if (event.data?.type === 'award-weekly-prizes') {
        try {
          const { supabase } = await import('../../services/supabase.js');

          const { error: rpcError } = await supabase.rpc('award_weekly_prizes');
          if (rpcError) throw rpcError;

          const { data: top10 } = await supabase
            .from('templo_players')
            .select('id')
            .order('weekly_points', { ascending: false })
            .limit(10);

          const top10Ids = (top10 || []).map(p => p.id);
          const top3Ids  = top10Ids.slice(0, 3);

          pushToast(`🏆 Premios entregados y semana reiniciada`);
          sendToFrame('toast', `✅ Premios entregados — puntos en 0`);
        } catch (err) {
          pushToast('❌ Error: ' + err.message);
          sendToFrame('toast', '❌ Error al entregar premios');
        }
      }

// =============================================
      // GUARDAR FECHAS DE COMPETENCIA
      // =============================================
      if (event.data?.type === 'save-comp-dates') {
        try {
          const { supabase } = await import('../../services/supabase.js');
          await supabase.from('competition_settings').upsert({
  id: 'current',
  start_date: event.data.start || null,
  end_date:   event.data.end   || null,
  is_active:  !!(event.data.start && event.data.end),
  updated_at: new Date().toISOString(),
}, { onConflict: 'id' });
          pushToast('📅 Fechas de competencia guardadas');
        } catch (err) {
          pushToast('❌ Error: ' + err.message);
        }
      }

    // =============================================
      // REINICIAR SEMANA
      // =============================================
      if (event.data?.type === 'reset-weekly') {
        try {
          const { supabase } = await import('../../services/supabase.js');

          const { error: e1 } = await supabase
            .from('templo_players')
            .update({ weekly_points: 0 })
            .neq('id', '00000000-0000-0000-0000-000000000000');
          if (e1) throw e1;

          const { error: e2 } = await supabase
            .from('templo_players')
            .update({ daily_attempts: {} })
            .neq('id', '00000000-0000-0000-0000-000000000000');
          if (e2) throw e2;

          const { data: weeklyMissions } = await supabase
            .from('missions')
            .select('id')
            .eq('type', 'weekly');
          if (weeklyMissions?.length) {
            await supabase
              .from('user_missions')
              .delete()
              .in('mission_id', weeklyMissions.map(m => m.id));
          }

          try {
  await supabase
    .from('game_events')
    .insert({ event_type: 'weekly_reset' });
} catch(_) {}

          const now = new Date();
          const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          await supabase.from('competition_settings').upsert({
            id: 'current',
            start_date: now.toISOString(),
            end_date: in7days.toISOString(),
            is_active: true,
            updated_at: now.toISOString(),
          }, { onConflict: 'id' });

          const { data: freshRanking } = await supabase
  .from('templo_players')
  .select('id, char_name, weekly_points, char_variant, char_gender')
  .order('weekly_points', { ascending: false })
  .limit(50);

          sendToFrame('ranking-updated', freshRanking ?? []);
          sendToFrame('load-comp-dates', {
  start: now.toISOString().slice(0, 16),
  end: in7days.toISOString().slice(0, 16),
});
          pushToast('🔄 Semana reiniciada — puntos en 0');
          sendToFrame('toast', '✅ Semana reiniciada correctamente');
        } catch (err) {
          pushToast('❌ Error: ' + err.message);
          sendToFrame('toast', '❌ Error al reiniciar: ' + err.message);
        }
      }

      // =============================================
      // ELIMINAR RECOMPENSA POR NIVEL
      // =============================================
      if (event.data?.type === 'delete-level-reward') {
        try {
          const { supabase } = await import('../../services/supabase.js');
          const rewardId = event.data.id || event.data.rewardId;
          if (!rewardId) throw new Error('No se recibió el ID de la recompensa');
          const { error } = await supabase
            .from('level_rewards')
            .delete()
            .eq('id', rewardId);
          if (error) throw error;
          pushToast('🗑 Recompensa eliminada');
          sendToFrame('toast', '✅ Recompensa eliminada');
          const { data, error: fetchError } = await supabase
            .from('level_rewards')
            .select('*')
            .order('level', { ascending: true });
          if (fetchError) throw fetchError;
          sendToFrame('level-rewards-list', data);
        } catch (err) {
          pushToast('❌ Error: ' + err.message);
          sendToFrame('toast', '❌ Error al eliminar: ' + err.message);
        }
      }
    };

    (async () => {
      try {
        const { supabase } = await import('../../services/supabase.js');
        const { data } = await supabase
          .from('competition_settings')
          .select('start_date, end_date')
          .eq('id', 'current')
          .maybeSingle();
        if (data) {
          sendToFrame('load-comp-dates', {
            start: data.start_date ? data.start_date.slice(0, 16) : '',
            end:   data.end_date   ? data.end_date.slice(0, 16)   : '',
          });
        }
      } catch(e) {}
    })();

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

// ── KPI Panel Component — definida FUERA de AdminDashboard para evitar re-renders ──

return (
    <>

      {/* ══ PANEL INFRACCIONES ══ */}
      {showInfractions && (
        <div style={{
          position:'fixed', inset:0, zIndex:99999,
          background:'rgba(0,0,0,0.82)', backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }} onClick={() => { setShowInfractions(false); setInfUserDetail(null); }}>
          <div style={{
            background:'linear-gradient(135deg,#0d0a1a,#0a0614)',
            border:'1.5px solid rgba(239,68,68,0.5)',
            borderRadius:18, padding:'1.5rem',
            width:'min(860px,96vw)', maxHeight:'90vh',
            boxShadow:'0 0 60px rgba(239,68,68,0.2)',
            display:'flex', flexDirection:'column', gap:'0.875rem',
            overflowY:'auto',
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <p style={{ margin:0, fontFamily:'Cinzel,serif', fontWeight:900, color:'#EF4444', fontSize:15, letterSpacing:2 }}>
                  🚫 INFRACCIONES Y RESTRICCIONES
                </p>
                <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:3 }}>
                  {infractionsTotal.toLocaleString()} infracciones totales · moderación automática del feed
                </p>
              </div>
              <button onClick={() => { setShowInfractions(false); setInfUserDetail(null); }} style={{
                background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:20, cursor:'pointer',
              }}>✕</button>
            </div>

            {/* Buscador */}
            <input
              value={infractionsSearch}
              onChange={e => { setInfractionsSearch(e.target.value); }}
              onKeyDown={e => { if (e.key === 'Enter') { setInfractionsPage(0); loadInfractions(infractionsSearch, 0); } }}
              placeholder="🔍  Buscar por nombre o email… (Enter para buscar)"
              style={{
                width:'100%', boxSizing:'border-box',
                background:'rgba(255,255,255,0.06)', border:'1px solid rgba(239,68,68,0.3)',
                borderRadius:10, padding:'0.55rem 0.875rem', color:'#fff',
                fontFamily:'Cinzel,serif', fontSize:11, outline:'none',
              }}
            />

            {/* Vista detalle usuario */}
            {infUserDetail && (() => {
              const u = infUserDetail;
              const isRestricted = u.profile?.posting_restricted_until && new Date(u.profile.posting_restricted_until) > new Date();
              const minutesLeft = isRestricted ? Math.ceil((new Date(u.profile.posting_restricted_until) - new Date()) / 60000) : 0;
              const hoursLeft = minutesLeft > 60 ? Math.ceil(minutesLeft / 60) : null;
              const userInfractions = infractions.filter(i => i.user_id === u.user_id);
              return (
                <div style={{
                  background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.3)',
                  borderRadius:14, padding:'1rem', display:'flex', flexDirection:'column', gap:'0.75rem',
                }}>
                  {/* Header detalle */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <div style={{
                        width:42, height:42, borderRadius:'50%', flexShrink:0,
                        background:'rgba(239,68,68,0.2)', border:'1.5px solid rgba(239,68,68,0.5)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'Cinzel,serif', fontWeight:900, fontSize:14, color:'#EF4444',
                      }}>
                        {(u.profile?.templario_name || u.profile?.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin:0, fontFamily:'Cinzel,serif', fontWeight:700, fontSize:13, color:'#fff' }}>
                          {u.profile?.templario_name || u.profile?.email?.split('@')[0] || 'Usuario'}
                        </p>
                        <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.35)', marginTop:2 }}>
                          {u.profile?.email} · {userInfractions.length} infraccion{userInfractions.length !== 1 ? 'es' : ''}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setInfUserDetail(null)} style={{
                      background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)',
                      borderRadius:8, padding:'0.3rem 0.75rem', color:'rgba(255,255,255,0.5)',
                      fontFamily:'Cinzel,serif', fontSize:10, cursor:'pointer',
                    }}>← Volver</button>
                  </div>

                  {/* Estado restricción */}
                  <div style={{
                    background: isRestricted ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.08)',
                    border:`1px solid ${isRestricted ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.3)'}`,
                    borderRadius:10, padding:'0.75rem 1rem',
                    display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                      <span style={{ fontSize:20 }}>{isRestricted ? '🚫' : '✅'}</span>
                      <div>
                        <p style={{ margin:0, fontFamily:'Cinzel,serif', fontWeight:700, fontSize:11, color: isRestricted ? '#EF4444' : '#10B981' }}>
                          {isRestricted ? 'Publicación restringida' : 'Sin restricciones activas'}
                        </p>
                        {isRestricted && (
                          <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.4)', marginTop:2 }}>
                            Se levanta en {hoursLeft ? `${hoursLeft}h` : `${minutesLeft} min`} · {new Date(u.profile.posting_restricted_until).toLocaleString('es-MX')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {isRestricted && (
                        <button onClick={() => liftRestriction(u.user_id)} disabled={liftingUser === u.user_id} style={{
                          padding:'0.45rem 1rem',
                          background:'linear-gradient(135deg,#10B981,#065f46)',
                          border:'1px solid rgba(16,185,129,0.4)', borderRadius:8,
                          color:'#fff', fontFamily:'Cinzel,serif', fontSize:10, fontWeight:700, cursor:'pointer',
                        }}>{liftingUser === u.user_id ? '…' : '✅ Levantar restricción'}</button>
                      )}
                      {[6, 24, 72].map(h => (
                        <button key={h} onClick={() => restrictUser(u.user_id, h)} style={{
                          padding:'0.45rem 0.875rem',
                          background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.4)',
                          borderRadius:8, color:'#EF4444',
                          fontFamily:'Cinzel,serif', fontSize:10, fontWeight:700, cursor:'pointer',
                        }}>🚫 {h}h</button>
                      ))}
                    </div>
                  </div>

                  {/* Infracciones del usuario */}
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:2, textTransform:'uppercase' }}>
                      Historial de infracciones
                    </p>
                    {userInfractions.map(inf => (
                      <div key={inf.id} style={{
                        background:'rgba(255,255,255,0.03)', border:'1px solid rgba(239,68,68,0.15)',
                        borderRadius:8, padding:'0.5rem 0.75rem',
                        display:'flex', alignItems:'flex-start', gap:'0.75rem',
                      }}>
                        <span style={{ fontSize:14, flexShrink:0 }}>{inf.auto_deleted ? '🗑️' : '⚠️'}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.7)', lineHeight:1.5 }}>
                            {inf.reason || 'Sin razón registrada'}
                          </p>
                          <p style={{ margin:'3px 0 0', fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.3)' }}>
                            {inf.auto_deleted ? '· Post eliminado automáticamente' : '· Post conservado'} · {new Date(inf.created_at).toLocaleString('es-MX')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Tabla de infracciones */}
            {!infUserDetail && (
              infractionsLoad ? (
                <p style={{ color:'rgba(255,255,255,0.4)', fontFamily:'Cinzel,serif', fontSize:11, textAlign:'center', padding:'2rem' }}>Cargando…</p>
              ) : infractions.length === 0 ? (
                <p style={{ color:'rgba(255,255,255,0.3)', fontFamily:'Cinzel,serif', fontSize:11, textAlign:'center', padding:'2rem' }}>Sin infracciones registradas</p>
              ) : (
                <>
                  {/* Headers */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr 80px 90px 110px', gap:6, padding:'0 0.5rem' }}>
                    {['Usuario','Razón','Post ID','Eliminado','Fecha','Acciones'].map(h => (
                      <p key={h} style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:1, textTransform:'uppercase' }}>{h}</p>
                    ))}
                  </div>

                  {/* Filas agrupadas por usuario */}
                  {(() => {
                    const seen = new Set();
                    return infractions.map(inf => {
                      const isFirst = !seen.has(inf.user_id);
                      if (isFirst) seen.add(inf.user_id);
                      const name = inf.profile?.templario_name || inf.profile?.email?.split('@')[0] || inf.user_id?.slice(0,8);
                      const isRestricted = inf.profile?.posting_restricted_until && new Date(inf.profile.posting_restricted_until) > new Date();
                      const minutesLeft = isRestricted ? Math.ceil((new Date(inf.profile.posting_restricted_until) - new Date()) / 60000) : 0;
                      const hoursLeft = minutesLeft > 60 ? Math.ceil(minutesLeft / 60) : null;
                      const userInfCount = infractions.filter(i => i.user_id === inf.user_id).length;
                      return (
                        <div key={inf.id} style={{
                          display:'grid', gridTemplateColumns:'1fr 1fr 2fr 80px 90px 110px',
                          gap:6, alignItems:'center',
                          background: isRestricted ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.02)',
                          border:`1px solid ${isRestricted ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)'}`,
                          borderLeft:`3px solid ${userInfCount >= 4 ? '#EF4444' : userInfCount >= 3 ? '#F97316' : userInfCount >= 2 ? '#F5C518' : 'rgba(255,255,255,0.15)'}`,
                          borderRadius:10, padding:'0.5rem 0.6rem',
                        }}>
                          <div>
                            <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:10, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</p>
                            {isRestricted && (
                              <p style={{ margin:'2px 0 0', fontFamily:'Cinzel,serif', fontSize:8, color:'#EF4444' }}>
                                🚫 {hoursLeft ? `${hoursLeft}h` : `${minutesLeft}min`} restantes
                              </p>
                            )}
                            <p style={{ margin:'2px 0 0', fontFamily:'Cinzel,serif', fontSize:8, color:'rgba(255,255,255,0.3)' }}>
                              {userInfCount} infraccion{userInfCount !== 1 ? 'es' : ''}
                            </p>
                          </div>
                          <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.6)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {inf.reason || '—'}
                          </p>
                          <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:8, color:'rgba(255,255,255,0.25)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {inf.post_id || '—'}
                          </p>
                          <span style={{
                            fontFamily:'Cinzel,serif', fontSize:9, fontWeight:700, textAlign:'center',
                            color: inf.auto_deleted ? '#EF4444' : '#10B981',
                            background: inf.auto_deleted ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                            border:`1px solid ${inf.auto_deleted ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                            borderRadius:6, padding:'2px 6px', display:'block', textAlign:'center',
                          }}>{inf.auto_deleted ? '🗑️ Sí' : '⚠️ No'}</span>
                          <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.35)' }}>
                            {new Date(inf.created_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                          </p>
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                            <button onClick={() => setInfUserDetail(inf)} style={{
                              padding:'0.3rem 0.5rem',
                              background:'rgba(192,132,252,0.15)', border:'1px solid rgba(192,132,252,0.35)',
                              borderRadius:6, color:'#C084FC',
                              fontFamily:'Cinzel,serif', fontSize:8, fontWeight:700, cursor:'pointer',
                            }}>👤 Ver</button>
                            {isRestricted ? (
                              <button onClick={() => liftRestriction(inf.user_id)} disabled={liftingUser === inf.user_id} style={{
                                padding:'0.3rem 0.5rem',
                                background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.35)',
                                borderRadius:6, color:'#10B981',
                                fontFamily:'Cinzel,serif', fontSize:8, fontWeight:700, cursor:'pointer',
                              }}>{liftingUser === inf.user_id ? '…' : '✅ Levantar'}</button>
                            ) : (
                              <button onClick={() => setConfirmModal({ message:`¿Restringir a ${name} por 24h?`, onConfirm: () => restrictUser(inf.user_id, 24) })} style={{
                                padding:'0.3rem 0.5rem',
                                background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.35)',
                                borderRadius:6, color:'#EF4444',
                                fontFamily:'Cinzel,serif', fontSize:8, fontWeight:700, cursor:'pointer',
                              }}>🚫 Restringir</button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Paginación */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
                    <button
                      onClick={() => setInfractionsPage(p => Math.max(0, p - 1))}
                      disabled={infractionsPage === 0}
                      style={{
                        padding:'0.4rem 0.875rem',
                        background: infractionsPage > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                        border:'1px solid rgba(239,68,68,0.3)', borderRadius:8,
                        color: infractionsPage > 0 ? '#EF4444' : 'rgba(255,255,255,0.2)',
                        fontFamily:'Cinzel,serif', fontSize:10, cursor: infractionsPage > 0 ? 'pointer' : 'not-allowed',
                      }}>← Anterior</button>
                    <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.4)' }}>
                      Página {infractionsPage + 1} de {Math.max(1, Math.ceil(infractionsTotal / 20))}
                    </span>
                    <button
                      onClick={() => setInfractionsPage(p => p + 1)}
                      disabled={(infractionsPage + 1) * 20 >= infractionsTotal}
                      style={{
                        padding:'0.4rem 0.875rem',
                        background:(infractionsPage + 1) * 20 < infractionsTotal ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                        border:'1px solid rgba(239,68,68,0.3)', borderRadius:8,
                        color:(infractionsPage + 1) * 20 < infractionsTotal ? '#EF4444' : 'rgba(255,255,255,0.2)',
                        fontFamily:'Cinzel,serif', fontSize:10, cursor:(infractionsPage + 1) * 20 < infractionsTotal ? 'pointer' : 'not-allowed',
                      }}>Siguiente →</button>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}

      {/* ══ PANEL REPORTES ══ */}
      {showReports && (
        <div style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,0.82)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowReports(false)}>
          <div style={{background:'linear-gradient(135deg,#110820,#0d0618)',border:'1.5px solid rgba(239,68,68,0.5)',borderRadius:18,padding:'1.5rem',width:'min(720px,96vw)',maxHeight:'88vh',boxShadow:'0 0 60px rgba(239,68,68,0.2)',display:'flex',flexDirection:'column',gap:'0.75rem',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <p style={{margin:0,fontFamily:'Cinzel,serif',fontWeight:900,color:'#EF4444',fontSize:15,letterSpacing:2}}>🚨 BUZÓN DE REPORTES</p>
                <p style={{margin:0,fontFamily:'Cinzel,serif',fontSize:10,color:'rgba(255,255,255,0.4)',marginTop:2}}>
                  {reports.length} reporte{reports.length!==1?'s':''} · {reports.filter(r=>r.status==='pendiente').length} pendientes
                </p>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <button onClick={()=>loadReports()} style={{background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.35)',borderRadius:8,color:'#EF4444',fontFamily:'Cinzel,serif',fontSize:9,fontWeight:700,cursor:'pointer',padding:'0.35rem 0.75rem'}}>↺ ACTUALIZAR</button>
                <button onClick={()=>setShowReports(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',fontSize:20,cursor:'pointer'}}>✕</button>
              </div>
            </div>

            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[
                {key:'pendiente', label:'⏳ Pendientes', color:'#F59E0B'},
                {key:'revisando', label:'👀 En revisión', color:'#60A5FA'},
                {key:'resuelto',  label:'✅ Resueltos',  color:'#10B981'},
                {key:'all',       label:'📋 Todos',      color:'rgba(255,255,255,0.5)'},
              ].map(f=>(
                <button key={f.key} onClick={()=>setReportFilter(f.key)} style={{padding:'0.4rem 0.75rem',background:reportFilter===f.key?`${f.color}22`:'rgba(255,255,255,0.05)',border:`1px solid ${reportFilter===f.key?f.color:'rgba(255,255,255,0.1)'}`,borderRadius:8,color:reportFilter===f.key?f.color:'rgba(255,255,255,0.4)',fontFamily:'Cinzel,serif',fontSize:10,fontWeight:700,cursor:'pointer'}}>{f.label}</button>
              ))}
            </div>

            {reportsLoad ? (
              <p style={{color:'rgba(255,255,255,0.4)',fontFamily:'Cinzel,serif',fontSize:11,textAlign:'center',padding:'2rem'}}>Cargando…</p>
            ) : reports.filter(r=>reportFilter==='all'||r.status===reportFilter).length===0 ? (
              <p style={{color:'rgba(255,255,255,0.3)',fontFamily:'Cinzel,serif',fontSize:11,textAlign:'center',padding:'2rem'}}>Sin reportes aquí</p>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {reports.filter(r=>reportFilter==='all'||r.status===reportFilter).map(r=>{
                  const CAT = {bug:'🐛 Bug',cobro:'💳 Cobro',acceso:'🔒 Acceso',tecnico:'⚙️ Técnico',otro:'💬 Otro'};
                  const SC  = {pendiente:'#F59E0B',revisando:'#60A5FA',resuelto:'#10B981'};
                  const name = r.profiles?.templario_name||r.profiles?.email?.split('@')[0]||r.user_id?.slice(0,8);
                  const fecha = new Date(r.created_at).toLocaleDateString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
                  return (
                    <div key={r.id} style={{background:r.status==='pendiente'?'rgba(245,158,11,0.06)':r.status==='revisando'?'rgba(96,165,250,0.05)':'rgba(16,185,129,0.04)',border:`1px solid ${SC[r.status]||'rgba(255,255,255,0.08)'}33`,borderLeft:`3px solid ${SC[r.status]||'rgba(255,255,255,0.2)'}`,borderRadius:12,padding:'0.875rem 1rem',display:'flex',flexDirection:'column',gap:8}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                        <span style={{fontFamily:'Cinzel,serif',fontSize:11,fontWeight:700,color:'#fff'}}>{name}</span>
                        <span style={{fontFamily:'Cinzel,serif',fontSize:9,color:'rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.05)',padding:'2px 8px',borderRadius:6}}>{CAT[r.category]||r.category}</span>
                        <span style={{fontFamily:'Cinzel,serif',fontSize:9,color:SC[r.status],background:`${SC[r.status]}18`,border:`1px solid ${SC[r.status]}44`,padding:'2px 8px',borderRadius:6,fontWeight:700,marginLeft:'auto'}}>
                          {r.status==='pendiente'?'⏳ Pendiente':r.status==='revisando'?'👀 En revisión':'✅ Resuelto'}
                        </span>
                        <span style={{fontFamily:'Cinzel,serif',fontSize:9,color:'rgba(255,255,255,0.3)',flexShrink:0}}>{fecha}</span>
                      </div>
                      <p style={{margin:0,fontFamily:'Raleway,sans-serif',fontSize:12,color:'rgba(220,210,255,0.8)',lineHeight:1.6,background:'rgba(255,255,255,0.03)',padding:'8px 10px',borderRadius:8}}>{r.message}</p>
                      {r.status!=='resuelto'&&(
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          {r.status==='pendiente'&&(
                            <button onClick={()=>updateReportStatus(r.id,'revisando')} style={{padding:'0.35rem 0.75rem',borderRadius:8,background:'rgba(96,165,250,0.15)',border:'1px solid rgba(96,165,250,0.4)',color:'#60A5FA',fontFamily:'Cinzel,serif',fontSize:9,fontWeight:700,cursor:'pointer'}}>👀 En revisión</button>
                          )}
                          <button onClick={()=>updateReportStatus(r.id,'resuelto')} style={{padding:'0.35rem 0.75rem',borderRadius:8,background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.4)',color:'#10B981',fontFamily:'Cinzel,serif',fontSize:9,fontWeight:700,cursor:'pointer'}}>✅ Resuelto</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ MODAL DE CONFIRMACIÓN ══ */}
      {confirmModal && createPortal(
        <div style={{
          position:'fixed', inset:0, zIndex:999999,
          background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'crosshair',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'linear-gradient(135deg,#110820,#0d0618)',
            border:'1.5px solid rgba(245,197,24,0.5)',
            borderRadius:16, padding:'1.5rem 2rem',
            width:'min(400px,90vw)',
            boxShadow:'0 0 40px rgba(245,197,24,0.2)',
            display:'flex', flexDirection:'column', gap:'1.25rem',
            alignItems:'center', textAlign:'center',
          }}>
            <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:13, fontWeight:700, color:'#fff', lineHeight:1.6 }}>
              {confirmModal.message}
            </p>
            <div style={{ display:'flex', gap:10, width:'100%' }}>
              <button onClick={() => setConfirmModal(null)} style={{
                flex:1, padding:'0.65rem',
                background:'rgba(255,255,255,0.07)',
                border:'1px solid rgba(255,255,255,0.15)',
                borderRadius:10, color:'rgba(255,255,255,0.6)',
                fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700, cursor:'pointer',
              }}>Cancelar</button>
              <button onClick={() => { const fn = confirmModal.onConfirm; setConfirmModal(null); fn(); }} style={{
                flex:1, padding:'0.65rem',
                background:'linear-gradient(135deg,#F5C518,#D97706)',
                border:'1px solid rgba(245,197,24,0.4)',
                borderRadius:10, color:'#0a0614',
                fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700, cursor:'pointer',
              }}>Confirmar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

{/* ══ PANEL HISTORIAL DE PREMIOS ══ */}
{showHistory && (
  <div style={{
    position:'fixed', inset:0, zIndex:99999,
    background:'rgba(0,0,0,0.82)', backdropFilter:'blur(8px)',
    display:'flex', alignItems:'center', justifyContent:'center',
  }} onClick={() => setShowHistory(false)}>
    <div style={{
      background:'linear-gradient(135deg,#0d0a1a,#0a0614)',
      border:'1.5px solid rgba(96,165,250,0.5)',
      borderRadius:18, padding:'1.5rem',
      width:'min(780px,96vw)', maxHeight:'88vh',
      boxShadow:'0 0 60px rgba(96,165,250,0.2)',
      display:'flex', flexDirection:'column', gap:'0.75rem',
      overflowY:'auto',
    }} onClick={e => e.stopPropagation()}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <p style={{ margin:0, fontFamily:'Cinzel,serif', fontWeight:900, color:'#60A5FA', fontSize:15, letterSpacing:2 }}>
            📋 HISTORIAL DE PREMIOS
          </p>
          <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>
            {historyTotal.toLocaleString()} entregas totales
            {historyPending > 0 && <span style={{ color:'#F5C518', marginLeft:8 }}>· ⏳ {historyPending} pendientes de reclamar</span>}
          </p>
        </div>
        <button onClick={() => setShowHistory(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:20, cursor:'pointer' }}>✕</button>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:4 }}>
          {[
            { key:'all',                 label:'🌐 Todos' },
            { key:'community_ranking',   label:'🏅 Academia' },
            { key:'templarios_ranking',  label:'🏆 Templarios' },
          ].map(f => (
            <button key={f.key} onClick={() => { setHistoryFilter(f.key); setHistoryPage(0); }} style={{
              padding:'0.4rem 0.75rem',
              background: historyFilter === f.key ? 'linear-gradient(135deg,#60A5FA,#1d4ed8)' : 'rgba(255,255,255,0.05)',
              border:`1px solid ${historyFilter === f.key ? 'rgba(96,165,250,0.6)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius:8, color: historyFilter === f.key ? '#fff' : 'rgba(255,255,255,0.5)',
              fontFamily:'Cinzel,serif', fontSize:10, fontWeight:700, cursor:'pointer',
            }}>{f.label}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:4, marginLeft:'auto' }}>
          {[
            { key:'all',     label:'📋 Todos' },
            { key:'pending', label:'⏳ Pendientes' },
            { key:'claimed', label:'✅ Reclamados' },
          ].map(f => (
            <button key={f.key} onClick={() => { setHistoryStatus(f.key); setHistoryPage(0); }} style={{
              padding:'0.4rem 0.75rem',
              background: historyStatus === f.key ? 'rgba(245,197,24,0.2)' : 'rgba(255,255,255,0.05)',
              border:`1px solid ${historyStatus === f.key ? 'rgba(245,197,24,0.5)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius:8, color: historyStatus === f.key ? '#F5C518' : 'rgba(255,255,255,0.5)',
              fontFamily:'Cinzel,serif', fontSize:10, fontWeight:700, cursor:'pointer',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      {historyLoad ? (
        <p style={{ color:'rgba(255,255,255,0.4)', fontFamily:'Cinzel,serif', fontSize:11, textAlign:'center', padding:'2rem' }}>Cargando…</p>
      ) : historyData.length === 0 ? (
        <p style={{ color:'rgba(255,255,255,0.3)', fontFamily:'Cinzel,serif', fontSize:11, textAlign:'center', padding:'2rem' }}>Sin resultados</p>
      ) : (
        <>
          {/* Headers */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 70px 80px 80px 80px 90px', gap:6, padding:'0 0.5rem' }}>
            {['Usuario','Tipo','Pos.','Coins','XP','Estado','Fecha'].map(h => (
              <p key={h} style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:1, textTransform:'uppercase' }}>{h}</p>
            ))}
          </div>
          {historyData.map(row => {
            const name = row.profile?.templario_name || row.profile?.email?.split('@')[0] || row.user_id?.slice(0,8);
            const isAcademia = row.category === 'community_ranking';
            const fecha = new Date(row.created_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
            return (
              <div key={row.id} style={{
                display:'grid', gridTemplateColumns:'1fr 1fr 70px 80px 80px 80px 90px',
                gap:6, alignItems:'center',
                background: row.claimed ? 'rgba(255,255,255,0.02)' : 'rgba(245,197,24,0.05)',
                border:`1px solid ${row.claimed ? 'rgba(255,255,255,0.06)' : 'rgba(245,197,24,0.2)'}`,
                borderRadius:10, padding:'0.5rem 0.6rem',
              }}>
                <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
                <span style={{ fontFamily:'Cinzel,serif', fontSize:9, color: isAcademia ? '#F5C518' : '#c9a84c', fontWeight:700 }}>
                  {isAcademia ? '🏅 Academia' : '🏆 Templarios'}
                  <span style={{ color:'rgba(255,255,255,0.3)', marginLeft:4 }}>{row.period}</span>
                </span>
                <span style={{ fontFamily:'Cinzel,serif', fontSize:11, fontWeight:900, color: row.position===1?'#F5C518':row.position===2?'#C0C0C0':row.position===3?'#CD7F32':'rgba(255,255,255,0.4)', textAlign:'center' }}>
                  {row.position===1?'🥇':row.position===2?'🥈':row.position===3?'🥉':`#${row.position}`}
                </span>
                <span style={{ fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700, color:'#F5C518', textAlign:'center' }}>+{row.coins_reward}</span>
                <span style={{ fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700, color:'#60A5FA', textAlign:'center' }}>+{row.xp_reward}</span>
                <span style={{
                  fontFamily:'Cinzel,serif', fontSize:9, fontWeight:700, textAlign:'center',
                  color: row.claimed ? '#10B981' : '#F59E0B',
                  background: row.claimed ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                  border:`1px solid ${row.claimed ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  borderRadius:6, padding:'2px 6px',
                }}>{row.claimed ? '✅ Reclamado' : '⏳ Pendiente'}</span>
                <span style={{ fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.35)' }}>{fecha}</span>
              </div>
            );
          })}

          {/* Paginación */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
            <button
              onClick={() => setHistoryPage(p => Math.max(0, p-1))}
              disabled={historyPage === 0}
              style={{
                padding:'0.4rem 0.875rem',
                background: historyPage > 0 ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                border:'1px solid rgba(96,165,250,0.3)', borderRadius:8,
                color: historyPage > 0 ? '#60A5FA' : 'rgba(255,255,255,0.2)',
                fontFamily:'Cinzel,serif', fontSize:10, cursor: historyPage > 0 ? 'pointer' : 'not-allowed',
              }}>← Anterior</button>
            <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.4)' }}>
              Página {historyPage + 1} de {Math.max(1, Math.ceil(historyTotal / 20))}
            </span>
            <button
              onClick={() => setHistoryPage(p => p + 1)}
              disabled={(historyPage + 1) * 20 >= historyTotal}
              style={{
                padding:'0.4rem 0.875rem',
                background: (historyPage + 1) * 20 < historyTotal ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                border:'1px solid rgba(96,165,250,0.3)', borderRadius:8,
                color: (historyPage + 1) * 20 < historyTotal ? '#60A5FA' : 'rgba(255,255,255,0.2)',
                fontFamily:'Cinzel,serif', fontSize:10, cursor: (historyPage + 1) * 20 < historyTotal ? 'pointer' : 'not-allowed',
              }}>Siguiente →</button>
          </div>
        </>
      )}
    </div>
  </div>
)}

{/* ══ PANEL PREMIOS ACADEMIA/COMUNIDAD ══ */}
      {showCommunityPrizes && (
        <div style={{
          position:'fixed', inset:0, zIndex:99999,
          background:'rgba(0,0,0,0.80)', backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }} onClick={() => { setShowCommunityPrizes(false); setCommunityPrizesResult(null); }}>
          <div style={{
            background:'linear-gradient(135deg,#110820,#0d0618)',
            border:'1.5px solid rgba(245,197,24,0.5)',
            borderRadius:18, padding:'1.5rem',
            width:'min(640px,95vw)', maxHeight:'85vh',
            boxShadow:'0 0 60px rgba(245,197,24,0.2)',
            display:'flex', flexDirection:'column', gap:'0.75rem',
            overflowY:'auto',
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ margin:0, fontFamily:'Cinzel,serif', fontWeight:900, color:'#F5C518', fontSize:15, letterSpacing:2 }}>🏅 PREMIOS ACADEMIA</p>
                <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Ranking de comunidad · 7 días · 30 días · Todo el tiempo</p>
              </div>
              <button onClick={() => { setShowCommunityPrizes(false); setCommunityPrizesResult(null); }} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>

            {/* Selector de período */}
            <div style={{ display:'flex', gap:6 }}>
              {[
                { key:'7d',  label:'⚡ 7 Días' },
                { key:'30d', label:'🌙 30 Días' },
                { key:'all', label:'🏛️ Todo el Tiempo' },
              ].map(p => (
                <button key={p.key} onClick={() => setCommunityPeriod(p.key)} style={{
                  flex:1, padding:'0.5rem',
                  background: communityPeriod === p.key ? 'linear-gradient(135deg,#F5C518,#D97706)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${communityPeriod === p.key ? 'rgba(245,197,24,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius:8, color: communityPeriod === p.key ? '#0a0614' : 'rgba(255,255,255,0.5)',
                  fontFamily:'Cinzel,serif', fontSize:10, fontWeight:700, cursor:'pointer',
                }}>{p.label}</button>
              ))}
            </div>

            {/* Top actual del período */}
            {communityTop.length > 0 && (
              <div style={{
                background:'rgba(245,197,24,0.06)', border:'1px solid rgba(245,197,24,0.2)',
                borderRadius:12, padding:'0.75rem',
              }}>
                <p style={{ margin:'0 0 8px', fontFamily:'Cinzel,serif', fontSize:10, color:'#F5C518', letterSpacing:2, textTransform:'uppercase' }}>
                  👥 Top actual — {communityPeriod === '7d' ? '7 Días' : communityPeriod === '30d' ? '30 Días' : 'Todo el Tiempo'}
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {communityTop.slice(0,10).map((u,i) => (
                    <div key={u.id} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color: i===0?'#F5C518':i===1?'#C0C0C0':i===2?'#CD7F32':'rgba(255,255,255,0.4)', fontWeight:700, width:20, textAlign:'right' }}>#{i+1}</span>
                      <span style={{ fontFamily:'Cinzel,serif', fontSize:11, color:'#fff', flex:1 }}>{u.name}</span>
                      <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.5)' }}>{(u.pts||0).toLocaleString()} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabla editable del período seleccionado */}
            {communityPrizesLoad ? (
              <p style={{ color:'rgba(255,255,255,0.4)', fontFamily:'Cinzel,serif', fontSize:11, textAlign:'center', padding:'1rem' }}>Cargando…</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ display:'grid', gridTemplateColumns:'32px 1fr 90px 90px 70px', gap:6, padding:'0 0.5rem' }}>
                  {['#','Etiqueta','PropoCoins','XP','Activo'].map(h => (
                    <p key={h} style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:1, textTransform:'uppercase', textAlign: h==='#'?'center':'left' }}>{h}</p>
                  ))}
                </div>
                {communityPrizes.filter(p => p.period === communityPeriod).map(prize => (
                  <div key={prize.id} style={{
                    display:'grid', gridTemplateColumns:'32px 1fr 90px 90px 70px',
                    gap:6, alignItems:'center',
                    background: prize.is_active ? 'rgba(245,197,24,0.06)' : 'rgba(255,255,255,0.03)',
                    border:`1px solid ${prize.is_active ? 'rgba(245,197,24,0.25)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius:10, padding:'0.5rem',
                  }}>
                    <span style={{ fontFamily:'Cinzel,serif', fontSize:12, fontWeight:900, color: prize.position===1?'#F5C518':prize.position===2?'#C0C0C0':prize.position===3?'#CD7F32':'rgba(255,255,255,0.4)', textAlign:'center' }}>
                      {prize.position===1?'🥇':prize.position===2?'🥈':prize.position===3?'🥉':`#${prize.position}`}
                    </span>
                    <input
                      value={prize.label||''}
                      onChange={e => updateCommunityPrize(prize.period, prize.position,'label',e.target.value)}
                      placeholder={`Top ${prize.position}`}
                      style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:6, padding:'0.3rem 0.5rem', color:'#fff', fontFamily:'Cinzel,serif', fontSize:10, outline:'none', width:'100%', boxSizing:'border-box' }}
                    />
                    <input
                      type="number" min="0"
                      value={prize.coins_reward||0}
                      onChange={e => updateCommunityPrize(prize.period, prize.position,'coins_reward',e.target.value)}
                      style={{ background:'rgba(245,197,24,0.08)', border:'1px solid rgba(245,197,24,0.25)', borderRadius:6, padding:'0.3rem 0.5rem', color:'#F5C518', fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700, outline:'none', width:'100%', boxSizing:'border-box', textAlign:'center' }}
                    />
                    <input
                      type="number" min="0"
                      value={prize.xp_reward||0}
                      onChange={e => updateCommunityPrize(prize.period, prize.position,'xp_reward',e.target.value)}
                      style={{ background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.25)', borderRadius:6, padding:'0.3rem 0.5rem', color:'#60A5FA', fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700, outline:'none', width:'100%', boxSizing:'border-box', textAlign:'center' }}
                    />
                    <div style={{ display:'flex', justifyContent:'center' }}>
                      <div onClick={() => updateCommunityPrize(prize.period, prize.position,'is_active',!prize.is_active)} style={{
                        width:36, height:20, borderRadius:10, cursor:'pointer',
                        background: prize.is_active ? 'linear-gradient(135deg,#F5C518,#D97706)' : 'rgba(255,255,255,0.1)',
                        border:`1px solid ${prize.is_active ? 'rgba(245,197,24,0.6)' : 'rgba(255,255,255,0.15)'}`,
                        display:'flex', alignItems:'center',
                        padding:'0 3px', transition:'all 0.2s',
                        justifyContent: prize.is_active ? 'flex-end' : 'flex-start',
                      }}>
                        <div style={{ width:14, height:14, borderRadius:'50%', background: prize.is_active ? '#0a0614' : 'rgba(255,255,255,0.3)' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botones */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button onClick={handleSaveCommunityPrizes} disabled={communityPrizesSave} style={{
                flex:1, padding:'0.65rem',
                background:'linear-gradient(135deg,#F5C518,#D97706)',
                border:'1px solid rgba(245,197,24,0.4)', borderRadius:10,
                color:'#0a0614', fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700, cursor:'pointer',
              }}>{communityPrizesSave ? '💾 Guardando…' : '💾 GUARDAR PREMIOS'}</button>
              {communityPeriod !== 'all' && (
                <button onClick={handleAwardCommunityPrizes} disabled={communityPrizesAward} style={{
                  flex:1, padding:'0.65rem',
                  background:'linear-gradient(135deg,#10B981,#065f46)',
                  border:'1px solid rgba(16,185,129,0.4)', borderRadius:10,
                  color:'#fff', fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700, cursor:'pointer',
                }}>{communityPrizesAward ? '⏳ Entregando…' : `🏅 ENTREGAR ${communityPeriod === '7d' ? '7 DÍAS' : '30 DÍAS'} AHORA`}</button>
              )}
            </div>
            {communityPeriod !== 'all' && (
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => handleResetCommunityPeriod(communityPeriod)} style={{
                  flex:1, padding:'0.55rem',
                  background:'linear-gradient(135deg,rgba(239,68,68,0.2),rgba(239,68,68,0.08))',
                  border:'1px solid rgba(239,68,68,0.4)', borderRadius:10,
                  color:'#EF4444', fontFamily:'Cinzel,serif', fontSize:10, fontWeight:700, cursor:'pointer',
                }}>🔄 REINICIAR TEMPORADA {communityPeriod === '7d' ? '7 DÍAS' : '30 DÍAS'}</button>
                <button onClick={async () => {
                  setConfirmModal({ message: '¿Entregar premios Y reiniciar temporada en un solo paso?', onConfirm: async () => {
                  setCommunityPrizesAward(true);
                  try {
                    const { supabase } = await import('../../services/supabase.js');
                    const tableMap  = { '7d': 'community_leaderboard_7d', '30d': 'community_leaderboard_30d' };
                    const pointsMap = { '7d': 'points_7d', '30d': 'points_30d' };
                    const table     = tableMap[communityPeriod];
                    const pointsCol = pointsMap[communityPeriod];

                    const { data: players } = await supabase.from(table)
                      .select(`user_id, full_name, ${pointsCol}`)
                      .order(pointsCol, { ascending: false })
                      .limit(10);

                    const activePrizes = communityPrizes.filter(p => p.period === communityPeriod && p.is_active);
                    let awarded = 0;

                    for (const prize of activePrizes) {
                      const player = (players || [])[prize.position - 1];
                      if (!player || (player[pointsCol] || 0) <= 0) continue;

                      await supabase.from('pending_rewards')
                        .delete()
                        .eq('user_id', player.user_id)
                        .eq('category', 'community_ranking')
                        .eq('period', communityPeriod)
                        .eq('claimed', false);

                      const { error: insErr } = await supabase.from('pending_rewards').insert({
                        user_id:      player.user_id,
                        category:     'community_ranking',
                        period:       communityPeriod,
                        period_key:   communityPeriod,
                        position:     prize.position,
                        coins_reward: prize.coins_reward || 0,
                        xp_reward:    prize.xp_reward    || 0,
                        claimed:      false,
                      });
                      if (insErr) { pushToast('❌ Insert: ' + insErr.message); continue; }
                      awarded++;
                    }

                    // Reiniciar: borrar logs del período seleccionado
                    const days = communityPeriod === '7d' ? 7 : 30;
const { error: delErr } = await supabase.rpc('reset_community_period', { days_back: days });
if (delErr) pushToast('⚠ Reset parcial: ' + delErr.message);

                    pushToast(`⚡ ${awarded} premios entregados · Temporada reiniciada`);
                    await loadCommunityPrizes(communityPeriod);
                  } catch(err) {
                    pushToast('❌ ' + err.message);
                  } finally {
                    setCommunityPrizesAward(false);
                  }
                  }});
                }} style={{
                  flex:1, padding:'0.55rem',
                  background:'linear-gradient(135deg,rgba(192,132,252,0.2),rgba(192,132,252,0.08))',
                  border:'1px solid rgba(192,132,252,0.4)', borderRadius:10,
                  color:'#C084FC', fontFamily:'Cinzel,serif', fontSize:10, fontWeight:700, cursor:'pointer',
                }}>⚡ ENTREGAR + REINICIAR</button>
              </div>
            )}

            {/* Resultado */}
            {communityPrizesResult && communityPrizesResult.length > 0 && (
              <div style={{
                background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.3)',
                borderRadius:12, padding:'0.875rem',
              }}>
                <p style={{ margin:'0 0 8px', fontFamily:'Cinzel,serif', fontSize:10, color:'#10B981', letterSpacing:2, textTransform:'uppercase' }}>✅ Premios entregados</p>
                {communityPrizesResult.map(r => (
                  <div key={r.pos} style={{ display:'flex', gap:8, alignItems:'center', padding:'3px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.4)', width:24 }}>#{r.pos}</span>
                    <span style={{ fontFamily:'Cinzel,serif', fontSize:11, color:'#fff', flex:1 }}>{r.name}</span>
                    <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'#F5C518' }}>+{r.cristales} PC</span>
                    <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'#60A5FA' }}>+{r.xp} XP</span>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ══ PANEL PREMIOS RANKING ══ */}
      {showPrizes && (
        <div style={{
          position:'fixed', inset:0, zIndex:99999,
          background:'rgba(0,0,0,0.80)', backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }} onClick={() => { setShowPrizes(false); setPrizesResult(null); }}>
          <div style={{
            background:'linear-gradient(135deg,#110820,#0d0618)',
            border:'1.5px solid rgba(201,168,76,0.5)',
            borderRadius:18, padding:'1.5rem',
            width:'min(600px,95vw)', maxHeight:'85vh',
            boxShadow:'0 0 60px rgba(201,168,76,0.25)',
            display:'flex', flexDirection:'column', gap:'0.75rem',
            overflowY:'auto',
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ margin:0, fontFamily:'Cinzel,serif', fontWeight:900, color:'#c9a84c', fontSize:15, letterSpacing:2 }}>🏆 PREMIOS DE RANKING</p>
                <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Templarios Dijeron · Configurar recompensas por posición</p>
              </div>
              <button onClick={() => { setShowPrizes(false); setPrizesResult(null); }} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>

            {/* Top actual */}
            {prizesTop.length > 0 && (
              <div style={{
                background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)',
                borderRadius:12, padding:'0.75rem',
              }}>
                <p style={{ margin:'0 0 8px', fontFamily:'Cinzel,serif', fontSize:10, color:'#c9a84c', letterSpacing:2, textTransform:'uppercase' }}>⚔️ Top actual esta semana</p>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {prizesTop.slice(0,10).map((p,i) => (
                    <div key={p.id} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'4px 0', borderBottom: i < 9 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color: i===0?'#F5C518':i===1?'#C0C0C0':i===2?'#CD7F32':'rgba(255,255,255,0.4)', fontWeight:700, width:20, textAlign:'right', flexShrink:0, paddingTop:1 }}>#{i+1}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:'Cinzel,serif', fontSize:11, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                        <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:3 }}>
                          <span style={{ fontFamily:'Cinzel,serif', fontSize:8, color:'rgba(80,200,80,0.85)', background:'rgba(40,140,40,0.12)', border:'1px solid rgba(60,180,60,0.2)', borderRadius:8, padding:'1px 5px' }}>✔ {p.correct||0} correctas</span>
                          <span style={{ fontFamily:'Cinzel,serif', fontSize:8, color:'rgba(126,184,247,0.85)', background:'rgba(50,120,200,0.12)', border:'1px solid rgba(70,140,220,0.2)', borderRadius:8, padding:'1px 5px' }}>✨ {(p.xp||0).toLocaleString()} XP</span>
                          {(p.answered_qids_week||0) > 0 && <span style={{ fontFamily:'Cinzel,serif', fontSize:8, color:'rgba(201,168,76,0.85)', background:'rgba(180,130,20,0.12)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'1px 5px' }}>📅 {p.answered_qids_week} sem</span>}
                          {(p.streak||0) >= 2 && <span style={{ fontFamily:'Cinzel,serif', fontSize:8, color:'#FF9500', background:'rgba(255,149,0,0.12)', border:'1px solid rgba(255,149,0,0.25)', borderRadius:8, padding:'1px 5px' }}>🔥×{p.streak}</span>}
                          <span style={{ fontFamily:'Cinzel,serif', fontSize:8, color:'rgba(192,132,252,0.7)', background:'rgba(140,80,220,0.1)', border:'1px solid rgba(180,100,255,0.2)', borderRadius:8, padding:'1px 5px' }}>Nv.{p.level||1}</span>
                        </div>
                      </div>
                      <span style={{ fontFamily:'Cinzel,serif', fontSize:11, color: i===0?'#F5C518':i===1?'#C0C0C0':i===2?'#CD7F32':'rgba(255,255,255,0.5)', fontWeight:700, flexShrink:0 }}>{(p.weekly_points||0).toLocaleString()} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabla de premios editable */}
            {prizesLoad ? (
              <p style={{ color:'rgba(255,255,255,0.4)', fontFamily:'Cinzel,serif', fontSize:11, textAlign:'center', padding:'1rem' }}>Cargando premios…</p>
            ) : prizes.length === 0 ? (
              <p style={{ color:'rgba(255,255,255,0.3)', fontFamily:'Cinzel,serif', fontSize:11, textAlign:'center', padding:'1rem' }}>Sin premios configurados en ranking_prizes</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ display:'grid', gridTemplateColumns:'32px 1fr 90px 90px 70px', gap:6, padding:'0 0.5rem' }}>
                  {['#','Etiqueta','PropoCoins','XP','Activo'].map(h => (
                    <p key={h} style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:1, textTransform:'uppercase', textAlign: h==='#'?'center':'left' }}>{h}</p>
                  ))}
                </div>
                {prizes.map(prize => (
                  <div key={prize.position} style={{
                    display:'grid', gridTemplateColumns:'32px 1fr 90px 90px 70px',
                    gap:6, alignItems:'center',
                    background: prize.is_active ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.03)',
                    border:`1px solid ${prize.is_active ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius:10, padding:'0.5rem',
                  }}>
                    <span style={{ fontFamily:'Cinzel,serif', fontSize:12, fontWeight:900, color: prize.position===1?'#F5C518':prize.position===2?'#C0C0C0':prize.position===3?'#CD7F32':'rgba(255,255,255,0.4)', textAlign:'center' }}>
                      {prize.position===1?'🥇':prize.position===2?'🥈':prize.position===3?'🥉':`#${prize.position}`}
                    </span>
                    <input
                      value={prize.label||''}
                      onChange={e => updatePrize(prize.position,'label',e.target.value)}
                      placeholder={`Top ${prize.position}`}
                      style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:6, padding:'0.3rem 0.5rem', color:'#fff', fontFamily:'Cinzel,serif', fontSize:10, outline:'none', width:'100%', boxSizing:'border-box' }}
                    />
                    <input
                      type="number" min="0"
                      value={prize.coins_reward||0}
                      onChange={e => updatePrize(prize.position,'coins_reward',e.target.value)}
                      style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.25)', borderRadius:6, padding:'0.3rem 0.5rem', color:'#F5C518', fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700, outline:'none', width:'100%', boxSizing:'border-box', textAlign:'center' }}
                    />
                    <input
                      type="number" min="0"
                      value={prize.xp_reward||0}
                      onChange={e => updatePrize(prize.position,'xp_reward',e.target.value)}
                      style={{ background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.25)', borderRadius:6, padding:'0.3rem 0.5rem', color:'#60A5FA', fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700, outline:'none', width:'100%', boxSizing:'border-box', textAlign:'center' }}
                    />
                    <div style={{ display:'flex', justifyContent:'center' }}>
                      <div onClick={() => updatePrize(prize.position,'is_active',!prize.is_active)} style={{
                        width:36, height:20, borderRadius:10, cursor:'pointer',
                        background: prize.is_active ? 'linear-gradient(135deg,#c9a84c,#7a5000)' : 'rgba(255,255,255,0.1)',
                        border:`1px solid ${prize.is_active ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.15)'}`,
                        display:'flex', alignItems:'center',
                        padding:'0 3px', transition:'all 0.2s',
                        justifyContent: prize.is_active ? 'flex-end' : 'flex-start',
                      }}>
                        <div style={{ width:14, height:14, borderRadius:'50%', background: prize.is_active ? '#F5C518' : 'rgba(255,255,255,0.3)' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botones de acción */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button
                onClick={handleSavePrizes}
                disabled={prizesSave || prizes.length===0}
                style={{
                  flex:1, padding:'0.65rem',
                  background: prizes.length>0 ? 'linear-gradient(135deg,#c9a84c,#7a5000)' : 'rgba(255,255,255,0.06)',
                  border:'1px solid rgba(201,168,76,0.4)', borderRadius:10,
                  color:'#fff', fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700,
                  cursor: prizes.length>0 ? 'pointer' : 'not-allowed',
                }}
              >{prizesSave ? '💾 Guardando…' : '💾 GUARDAR PREMIOS'}</button>

              <button
                onClick={handleAwardPrizes}
                disabled={prizesAward || prizesTop.length===0}
                style={{
                  flex:1, padding:'0.65rem',
                  background: prizesTop.length>0 ? 'linear-gradient(135deg,#10B981,#065f46)' : 'rgba(255,255,255,0.06)',
                  border:'1px solid rgba(16,185,129,0.4)', borderRadius:10,
                  color:'#fff', fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700,
                  cursor: prizesTop.length>0 ? 'pointer' : 'not-allowed',
                }}
              >{prizesAward ? '⏳ Entregando…' : '🏆 ENTREGAR PREMIOS AHORA'}</button>
            </div>

            {/* Resultado de entrega */}
            {prizesResult && prizesResult.length > 0 && (
              <div style={{
                background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.3)',
                borderRadius:12, padding:'0.875rem',
              }}>
                <p style={{ margin:'0 0 8px', fontFamily:'Cinzel,serif', fontSize:10, color:'#10B981', letterSpacing:2, textTransform:'uppercase' }}>✅ Premios entregados</p>
                {prizesResult.map(r => (
                  <div key={r.pos} style={{ display:'flex', gap:8, alignItems:'center', padding:'3px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.4)', width:24 }}>#{r.pos}</span>
                    <span style={{ fontFamily:'Cinzel,serif', fontSize:11, color:'#fff', flex:1 }}>{r.name}</span>
                    <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'#F5C518' }}>+{r.cristales} PC</span>
                    <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'#60A5FA' }}>+{r.xp} XP</span>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ══ PANEL CATEGORÍAS COMUNIDAD ══ */}
      {showCats && (
        <div style={{
          position:'fixed', inset:0, zIndex:99999,
          background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }} onClick={() => { setShowCats(false); setEditingCat(null); setCatDraft({ name:'', color:'#C084FC', active:true }); }}>
          <div style={{
            background:'linear-gradient(135deg,#110820,#0d0618)',
            border:'1.5px solid rgba(249,115,22,0.4)',
            borderRadius:18, padding:'1.5rem',
            width:'min(480px,95vw)', maxHeight:'85vh',
            boxShadow:'0 0 60px rgba(249,115,22,0.2)',
            display:'flex', flexDirection:'column', gap:'0.75rem',
            overflowY:'auto',
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ margin:0, fontFamily:'Cinzel,serif', fontWeight:900, color:'#F97316', fontSize:15, letterSpacing:2 }}>🏷️ CATEGORÍAS</p>
                <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Gestionar etiquetas del feed</p>
              </div>
              <button onClick={() => { setShowCats(false); setEditingCat(null); setCatDraft({ name:'', color:'#C084FC', active:true }); }} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>

            {/* Formulario crear/editar */}
            <div style={{
              background:'rgba(249,115,22,0.06)', border:'1px solid rgba(249,115,22,0.25)',
              borderRadius:12, padding:'0.875rem',
              display:'flex', flexDirection:'column', gap:'0.5rem',
            }}>
              <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:10, color:'#F97316', letterSpacing:2, textTransform:'uppercase' }}>
                {editingCat ? '✏️ Editando categoría' : '➕ Nueva categoría'}
              </p>
              <input
                value={catDraft.name}
                onChange={e => setCatDraft(p => ({ ...p, name: e.target.value }))}
                placeholder="Nombre de la categoría…"
                style={{
                  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(249,115,22,0.3)',
                  borderRadius:8, padding:'0.5rem 0.75rem', color:'#fff',
                  fontFamily:'Cinzel,serif', fontSize:11, outline:'none',
                }}
              />
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                <label style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.5)' }}>Color:</label>
                <input
                  type="color"
                  value={catDraft.color}
                  onChange={e => setCatDraft(p => ({ ...p, color: e.target.value }))}
                  style={{ width:36, height:28, borderRadius:6, border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer', background:'none' }}
                />
                <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color: catDraft.color, fontWeight:700 }}>{catDraft.color}</span>
                <label style={{ display:'flex', alignItems:'center', gap:5, marginLeft:'auto', cursor:'pointer' }}>
                  <input
                    type="checkbox"
                    checked={catDraft.active}
                    onChange={e => setCatDraft(p => ({ ...p, active: e.target.checked }))}
                  />
                  <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.5)' }}>Activa</span>
                </label>
              </div>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button
                  onClick={saveCat}
                  disabled={!catDraft.name.trim() || catSaving}
                  style={{
                    flex:1, padding:'0.5rem',
                    background: catDraft.name.trim() ? 'linear-gradient(135deg,#F97316,#c2410c)' : 'rgba(255,255,255,0.08)',
                    border:'none', borderRadius:8, color:'#fff',
                    fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700,
                    cursor: catDraft.name.trim() ? 'pointer' : 'not-allowed',
                  }}
                >{catSaving ? '…' : editingCat ? '💾 Guardar cambios' : '➕ Crear'}</button>
                {editingCat && (
                  <button
                    onClick={() => { setEditingCat(null); setCatDraft({ name:'', color:'#C084FC', active:true }); }}
                    style={{
                      padding:'0.5rem 0.875rem',
                      background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)',
                      borderRadius:8, color:'rgba(255,255,255,0.6)',
                      fontFamily:'Cinzel,serif', fontSize:11, cursor:'pointer',
                    }}
                  >Cancelar</button>
                )}
              </div>
            </div>

            {/* Lista categorías */}
            {catsLoading ? (
              <p style={{ color:'rgba(255,255,255,0.4)', fontFamily:'Cinzel,serif', fontSize:11, textAlign:'center', padding:'1rem' }}>Cargando…</p>
            ) : cats.length === 0 ? (
              <p style={{ color:'rgba(255,255,255,0.3)', fontFamily:'Cinzel,serif', fontSize:11, textAlign:'center', padding:'1rem' }}>Sin categorías aún</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {cats.map(cat => (
                  <div key={cat.id} style={{
                    display:'flex', alignItems:'center', gap:'0.75rem',
                    background: editingCat === cat.id ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${editingCat === cat.id ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius:10, padding:'0.6rem 0.875rem',
                  }}>
                    <div style={{ width:12, height:12, borderRadius:'50%', background: cat.color, flexShrink:0, boxShadow:`0 0 8px ${cat.color}` }} />
                    <p style={{ margin:0, flex:1, fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700, color: cat.active ? '#fff' : 'rgba(255,255,255,0.35)' }}>
                      {cat.name}
                      {!cat.active && <span style={{ marginLeft:6, fontSize:9, color:'rgba(255,255,255,0.3)' }}>· oculta</span>}
                    </p>
                    <div style={{ display:'flex', gap:5 }}>
                      <button onClick={() => { setEditingCat(cat.id); setCatDraft({ name: cat.name, color: cat.color, active: cat.active }); }} style={{
                        padding:'0.25rem 0.6rem', borderRadius:6,
                        background:'rgba(245,197,24,0.12)', border:'1px solid rgba(245,197,24,0.3)',
                        color:'#F5C518', fontFamily:'Cinzel,serif', fontSize:9, fontWeight:700, cursor:'pointer',
                      }}>✏️ Editar</button>
                      <button onClick={async () => {
                        const { supabase } = await import('../../services/supabase.js');
                        await supabase.from('community_categories').update({ active: !cat.active }).eq('id', cat.id);
                        await loadCats();
                        pushToast(cat.active ? '⚠ Categoría oculta' : '✅ Categoría visible');
                      }} style={{
                        padding:'0.25rem 0.6rem', borderRadius:6,
                        background: cat.active ? 'rgba(96,165,250,0.1)' : 'rgba(16,185,129,0.1)',
                        border: `1px solid ${cat.active ? 'rgba(96,165,250,0.3)' : 'rgba(16,185,129,0.3)'}`,
                        color: cat.active ? '#60A5FA' : '#10B981',
                        fontFamily:'Cinzel,serif', fontSize:9, fontWeight:700, cursor:'pointer',
                      }}>{cat.active ? '🙈 Ocultar' : '👁️ Mostrar'}</button>
                      <button onClick={() => deleteCat(cat.id)} style={{
                        padding:'0.25rem 0.6rem', borderRadius:6,
                        background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
                        color:'#EF4444', fontFamily:'Cinzel,serif', fontSize:9, fontWeight:700, cursor:'pointer',
                      }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ PANEL EQUIPO ADMIN ══ */}
      {showTeam && (
        <div style={{
          position:'fixed', inset:0, zIndex:99999,
          background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }} onClick={() => { setShowTeam(false); setExpandedUser(null); }}>
          <div style={{
            background:'linear-gradient(135deg,#110820,#0d0618)',
            border:'1.5px solid rgba(192,132,252,0.4)',
            borderRadius:18, padding:'1.5rem',
            width:'min(560px,95vw)', maxHeight:'85vh',
            boxShadow:'0 0 60px rgba(192,132,252,0.2)',
            display:'flex', flexDirection:'column', gap:'0.75rem',
            overflowY:'auto',
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ margin:0, fontFamily:'Cinzel,serif', fontWeight:900, color:'#C084FC', fontSize:15, letterSpacing:2 }}>👥 EQUIPO ADMIN</p>
                <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Permisos granulares por miembro</p>
              </div>
              <button onClick={() => { setShowTeam(false); setExpandedUser(null); }} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>

            {/* Buscador + Filtros */}
            <input
              value={teamSearch} onChange={e => setTeamSearch(e.target.value)}
              placeholder="🔍  Buscar por nombre o email…"
              style={{
                width:'100%', boxSizing:'border-box',
                background:'rgba(255,255,255,0.06)', border:'1px solid rgba(192,132,252,0.25)',
                borderRadius:10, padding:'0.55rem 0.875rem', color:'#fff',
                fontFamily:'Cinzel,serif', fontSize:11, outline:'none',
              }}
            />
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {[
                { key:'all',   label:'👥 Todos' },
                { key:'admin', label:'👑 Con permisos' },
                { key:'none',  label:'⬜ Sin permisos' },
              ].map(f => (
                <button key={f.key} onClick={() => setTeamFilter(f.key)} style={{
                  padding:'0.25rem 0.65rem', borderRadius:6, cursor:'pointer',
                  fontFamily:'Cinzel,serif', fontSize:9, fontWeight:700,
                  background: teamFilter === f.key ? 'rgba(192,132,252,0.25)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${teamFilter === f.key ? 'rgba(192,132,252,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  color: teamFilter === f.key ? '#C084FC' : 'rgba(255,255,255,0.5)',
                }}>{f.label}</button>
              ))}
              <button onClick={() => setShowLog(s => !s)} style={{
                padding:'0.25rem 0.65rem', borderRadius:6, cursor:'pointer',
                fontFamily:'Cinzel,serif', fontSize:9, fontWeight:700, marginLeft:'auto',
                background: showLog ? 'rgba(245,197,24,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showLog ? 'rgba(245,197,24,0.5)' : 'rgba(255,255,255,0.1)'}`,
                color: showLog ? '#F5C518' : 'rgba(255,255,255,0.5)',
              }}>📋 LOG</button>
            </div>

            {/* Log de actividad */}
            {showLog && (
              <div style={{
                background:'rgba(0,0,0,0.3)', border:'1px solid rgba(245,197,24,0.2)',
                borderRadius:10, padding:'0.75rem', maxHeight:180, overflowY:'auto',
              }}>
                <p style={{ margin:'0 0 6px', fontFamily:'Cinzel,serif', fontSize:9, color:'#F5C518', letterSpacing:2, textTransform:'uppercase' }}>📋 Actividad reciente</p>
                {teamLog.length === 0 ? (
                  <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.3)' }}>Sin actividad en esta sesión</p>
                ) : [...teamLog].reverse().map((entry, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontFamily:'Cinzel,serif', flexShrink:0 }}>{entry.time}</span>
                    <span style={{ fontSize:10, color: entry.type === 'add' ? '#10B981' : entry.type === 'remove' ? '#EF4444' : '#C084FC', fontFamily:'Cinzel,serif' }}>{entry.msg}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Lista */}
            {teamLoading ? (
              <p style={{ color:'rgba(255,255,255,0.4)', fontFamily:'Cinzel,serif', fontSize:11, textAlign:'center', padding:'1rem' }}>Cargando…</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {teamUsers
                  .filter(u => {
                    const q = teamSearch.toLowerCase();
                    const matchSearch = !q || (u.templario_name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q);
                    const perms = teamPerms[u.id] || {};
                    const permCount2 = Object.keys(perms).filter(k => perms[k]).length;
                    const matchFilter = teamFilter === 'all' ? true : teamFilter === 'admin' ? permCount2 > 0 || u.is_admin : permCount2 === 0 && !u.is_admin;
                    return matchSearch && matchFilter;
                  })
                  .map(u => {
                    const perms = teamPerms[u.id] || {};
                    const isExp = expandedUser === u.id;
                    const permCount = Object.keys(perms).filter(k => perms[k]).length;
                    const hasSuperAdmin = !!perms['super_admin'];
                    return (
                      <div key={u.id} style={{
                        background: hasSuperAdmin ? 'rgba(245,197,24,0.08)' : permCount > 0 ? 'rgba(192,132,252,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${hasSuperAdmin ? 'rgba(245,197,24,0.35)' : permCount > 0 ? 'rgba(192,132,252,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius:10, overflow:'hidden',
                      }}>
                        {/* Fila usuario */}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.6rem 0.875rem', cursor:'pointer' }}
                          onClick={() => setExpandedUser(isExp ? null : u.id)}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                              <span style={{ fontFamily:'Cinzel,serif', fontWeight:700, fontSize:12, color:'#fff' }}>
                                {u.templario_name || u.email?.split('@')[0]}
                              </span>
                              {hasSuperAdmin && <span style={{ fontSize:9, background:'rgba(245,197,24,0.2)', color:'#F5C518', padding:'1px 6px', borderRadius:999, fontFamily:'Cinzel,serif', fontWeight:700 }}>👑 SUPER ADMIN</span>}
                              {!hasSuperAdmin && permCount > 0 && <span style={{ fontSize:9, background:'rgba(192,132,252,0.2)', color:'#C084FC', padding:'1px 6px', borderRadius:999, fontFamily:'Cinzel,serif', fontWeight:700 }}>{permCount} permiso{permCount>1?'s':''}</span>}
                              {!hasSuperAdmin && permCount === 0 && u.is_admin && <span style={{ fontSize:9, background:'rgba(192,132,252,0.15)', color:'#C084FC', padding:'1px 6px', borderRadius:999, fontFamily:'Cinzel,serif', fontWeight:700 }}>⚠ admin legacy</span>}
                              {!hasSuperAdmin && permCount === 0 && !u.is_admin && <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontFamily:'Cinzel,serif' }}>sin permisos</span>}
                            </div>
                            <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.35)', marginTop:1 }}>{u.email}</p>
                          </div>
                          <span style={{ color:'rgba(192,132,252,0.6)', fontSize:12, marginLeft:8 }}>{isExp ? '▲' : '▼'}</span>
                        </div>

                        {/* Panel expandido */}
                        {isExp && (
                          <div style={{ borderTop:'1px solid rgba(192,132,252,0.15)', padding:'0.75rem 0.875rem', display:'flex', flexDirection:'column', gap:8 }}>
                            {/* Presets */}
                            <div>
                              <p style={{ margin:'0 0 6px', fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:2, textTransform:'uppercase' }}>Roles rápidos</p>
                              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                                {PRESETS.map(preset => (
                                  <button key={preset.label} onClick={() => applyPreset(u.id, preset.perms)} style={{
                                    padding:'0.3rem 0.65rem', borderRadius:6, border:'1px solid rgba(192,132,252,0.3)',
                                    background:'rgba(192,132,252,0.1)', color:'#C084FC',
                                    fontFamily:'Cinzel,serif', fontSize:9, fontWeight:700, cursor:'pointer',
                                  }}>{preset.label}</button>
                                ))}
                                <button onClick={() => applyPreset(u.id, [])} style={{
                                  padding:'0.3rem 0.65rem', borderRadius:6, border:'1px solid rgba(239,68,68,0.3)',
                                  background:'rgba(239,68,68,0.08)', color:'#EF4444',
                                  fontFamily:'Cinzel,serif', fontSize:9, fontWeight:700, cursor:'pointer',
                                }}>🗑 Quitar todo</button>
                              </div>
                            </div>
                            {/* Permisos individuales */}
                            <div>
                              <p style={{ margin:'0 0 6px', fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:2, textTransform:'uppercase' }}>Permisos individuales</p>
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                                {PERMS.map(p => {
                                  const active = !!perms[p.key];
                                  return (
                                    <div key={p.key} onClick={() => togglePerm(u.id, p.key)} style={{
                                      display:'flex', alignItems:'center', gap:7,
                                      padding:'0.45rem 0.65rem', borderRadius:8, cursor:'pointer',
                                      background: active ? 'rgba(192,132,252,0.18)' : 'rgba(255,255,255,0.04)',
                                      border: `1px solid ${active ? 'rgba(192,132,252,0.5)' : 'rgba(255,255,255,0.08)'}`,
                                      transition:'all 0.15s',
                                    }}>
                                      <div style={{
                                        width:14, height:14, borderRadius:4, flexShrink:0,
                                        background: active ? '#C084FC' : 'rgba(255,255,255,0.1)',
                                        border: `1.5px solid ${active ? '#C084FC' : 'rgba(255,255,255,0.2)'}`,
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        fontSize:8, color:'#0a0614',
                                      }}>{active ? '✓' : ''}</div>
                                      <div style={{ minWidth:0 }}>
                                        <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:10, fontWeight:700, color: active ? '#fff' : 'rgba(255,255,255,0.55)' }}>{p.icon} {p.label}</p>
                                        <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:8, color:'rgba(255,255,255,0.3)' }}>{p.desc}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BARRA DE NAVEGACIÓN ══ */}
      {/* estilos móvil en AdminDashboard.mobile.css */}
      {/* ── OVERLAY — cierra al tocar fuera ── */}
      {isMobile && (leftOpen || rightOpen) && (
        <div
          className="mob-sidebar-overlay"
          onClick={() => { setLeftOpen(false); setRightOpen(false); }}
          style={{
            position: 'fixed', inset: 0,
            zIndex: 9997,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(1px)',
          }}
        />
      )}

      {/* ── BOTONES TOGGLE MÓVIL ── */}
      <button
        className="mob-toggle-left"
        onClick={() => { setLeftOpen(v => !v); setRightOpen(false); }}
        style={{
          display: isMobile ? 'flex' : 'none',
          alignItems: 'center', justifyContent: 'center',
          position: 'fixed', top: 10, left: 8, zIndex: 10001,
          width: 38, height: 30, padding: 0,
          fontSize: 14, borderRadius: 8, lineHeight: 1,
          background: leftOpen ? 'rgba(192,132,252,0.35)' : 'rgba(8,3,18,0.95)',
          border: `1.5px solid ${leftOpen ? 'rgba(192,132,252,0.8)' : 'rgba(192,132,252,0.45)'}`,
          color: '#C084FC',
          fontFamily: 'Cinzel,serif', fontWeight: 900,
          cursor: 'pointer',
          boxShadow: leftOpen ? '0 0 14px rgba(192,132,252,0.5)' : '0 2px 10px rgba(0,0,0,0.5)',
        }}
      >{leftOpen ? '✕' : '☰'}</button>

      <button
        className="mob-toggle-right"
        onClick={() => { setRightOpen(v => !v); setLeftOpen(false); }}
        style={{
          display: isMobile ? 'flex' : 'none',
          alignItems: 'center', justifyContent: 'center',
          position: 'fixed', top: 10, right: 8, zIndex: 10001,
          width: 38, height: 30, padding: 0,
          fontSize: 14, borderRadius: 8, lineHeight: 1,
          background: rightOpen ? 'rgba(245,197,24,0.35)' : 'rgba(8,3,18,0.95)',
          border: `1.5px solid ${rightOpen ? 'rgba(245,197,24,0.8)' : 'rgba(245,197,24,0.45)'}`,
          color: '#F5C518',
          fontFamily: 'Cinzel,serif', fontWeight: 900,
          cursor: 'pointer',
          boxShadow: rightOpen ? '0 0 14px rgba(245,197,24,0.5)' : '0 2px 10px rgba(0,0,0,0.5)',
        }}
      >{rightOpen ? '✕' : '⚙'}</button>

      <div className="admin-nav-bar" style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 68, zIndex: 9999,
        background: 'linear-gradient(180deg,#0d0618 80%,rgba(13,6,24,0))',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: 'clamp(6px,1.5vw,10px) clamp(6px,2vw,16px) 0',
        gap: 8,
        pointerEvents: 'none',
        ...(isMobile ? { height: 0, padding: 0, background: 'transparent', overflow: 'visible' } : {}),
      }}>

        {/* Columna izquierda — Academia */}
        <div className={`admin-nav-left${leftOpen ? '' : ' collapsed'}`} onClick={() => { if(isMobile) setLeftOpen(false); }} style={{
          display: 'flex', flexDirection: 'column',
          gap: 5, alignItems: 'flex-start',
          pointerEvents: 'auto',
          position: 'relative',
          ...(isMobile ? {
            position: 'fixed', top: 52, left: 0, width: 170,
            maxHeight: 'calc(100vh - 52px)',
            overflowY: 'auto', overflowX: 'hidden',
            flexDirection: 'column', alignItems: 'stretch',
            gap: 4, padding: '10px 8px 20px',
            background: 'rgba(8,3,18,0.98)',
            borderRight: '1px solid rgba(192,132,252,0.25)',
            borderBottom: '1px solid rgba(192,132,252,0.15)',
            borderRadius: '0 0 14px 0',
            zIndex: 9998,
            boxShadow: '4px 0 24px rgba(0,0,0,0.6)',
            transform: leftOpen ? 'translateX(0)' : 'translateX(-105%)',
            transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
          } : {}),
        }}>
          {[
            { href:'/academia/comunidad', bg:'linear-gradient(135deg,#C084FC,#7c3aed)', color:'#fff',    shadow:'rgba(192,132,252,0.5)', border:'rgba(192,132,252,0.4)', label:'⚔️ COMUNIDAD' },
            { href:'/academia',           bg:'linear-gradient(135deg,#60A5FA,#1d4ed8)', color:'#fff',    shadow:'rgba(96,165,250,0.5)',  border:'rgba(96,165,250,0.4)',  label:'🏛️ ACADEMIA'  },
            { href:'/academia/ranking',   bg:'linear-gradient(135deg,#F5C518,#D97706)', color:'#0a0614', shadow:'rgba(245,197,24,0.5)',  border:'rgba(245,197,24,0.4)',  label:'🏆 RANKING'   },
          ].map(btn => (
            <a key={btn.href} href={btn.href} style={{
              background: btn.bg, color: btn.color,
              padding: 'clamp(5px,1.5vw,9px) clamp(8px,2vw,16px)',
              borderRadius: 8, fontWeight: 900,
              fontSize: 'clamp(8px,2vw,11px)',
              textDecoration: 'none', letterSpacing: 1,
              boxShadow: `0 3px 16px ${btn.shadow}`,
              display: 'flex', alignItems: 'center', gap: 5,
              border: `1px solid ${btn.border}`,
              whiteSpace: 'nowrap',
            }}>{btn.label}</a>
          ))}
          <button onClick={() => { setShowCommunityPrizes(true); }} style={{
            background:'linear-gradient(135deg,#F5C518,#D97706)', color:'#0a0614',
            padding:'clamp(5px,1.5vw,9px) clamp(8px,2vw,16px)',
            borderRadius:8, fontWeight:900, fontSize:'clamp(8px,2vw,11px)',
            border:'1px solid rgba(245,197,24,0.4)',
            boxShadow:'0 3px 16px rgba(245,197,24,0.5)',
            cursor:'pointer', letterSpacing:1, whiteSpace:'nowrap',
            display:'flex', alignItems:'center', gap:5,
          }}>🏅 PREMIOS ACADEMIA</button>
          <button onClick={() => { setShowReports(true); loadReports(); }} style={{
            background:'linear-gradient(135deg,#dc2626,#7f1d1d)', color:'#fff',
            padding:'clamp(5px,1.5vw,9px) clamp(8px,2vw,16px)',
            borderRadius:8, fontWeight:900, fontSize:'clamp(8px,2vw,11px)',
            border:'1px solid rgba(220,38,38,0.5)',
            boxShadow:'0 3px 16px rgba(220,38,38,0.45)',
            cursor:'pointer', letterSpacing:1, whiteSpace:'nowrap',
            display:'flex', alignItems:'center', gap:5,
          }}>🚨 REPORTES</button>
          <button onClick={() => { setShowInfractions(true); setInfractionsPage(0); loadInfractions('', 0); }} style={{
            background:'linear-gradient(135deg,#EF4444,#991b1b)', color:'#fff',
            padding:'clamp(5px,1.5vw,9px) clamp(8px,2vw,16px)',
            borderRadius:8, fontWeight:900, fontSize:'clamp(8px,2vw,11px)',
            border:'1px solid rgba(239,68,68,0.4)',
            boxShadow:'0 3px 16px rgba(239,68,68,0.4)',
            cursor:'pointer', letterSpacing:1, whiteSpace:'nowrap',
            display:'flex', alignItems:'center', gap:5,
          }}>🚫 INFRACCIONES</button>
          <button onClick={() => { setShowCats(true); loadCats(); }} style={{
            background:'linear-gradient(135deg,#F97316,#c2410c)', color:'#fff',
            padding:'clamp(5px,1.5vw,9px) clamp(8px,2vw,16px)',
            borderRadius:8, fontWeight:900, fontSize:'clamp(8px,2vw,11px)',
            border:'1px solid rgba(249,115,22,0.4)',
            boxShadow:'0 3px 16px rgba(249,115,22,0.4)',
            cursor:'pointer', letterSpacing:1, whiteSpace:'nowrap',
            display:'flex', alignItems:'center', gap:5,
          }}>🏷️ CATEGORÍAS</button>
          {/* ── KPI BUTTON ── */}
          <button onClick={() => { setShowKpis(v => !v); loadKpis(); }} style={{
            background: showKpis
              ? 'linear-gradient(135deg,#f5c842,#d97706)'
              : 'linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.05))',
            color: showKpis ? '#0a0614' : '#f5c842',
            padding:'clamp(5px,1.5vw,9px) clamp(8px,2vw,16px)',
            borderRadius:8, fontWeight:900, fontSize:'clamp(8px,2vw,11px)',
            border:`1px solid rgba(212,175,55,${showKpis ? '0.8' : '0.35'})`,
            boxShadow: showKpis ? '0 3px 16px rgba(245,200,70,0.5)' : '0 0 0 transparent',
            cursor:'pointer', letterSpacing:1, whiteSpace:'nowrap',
            display:'flex', alignItems:'center', gap:5,
            transition:'all 0.2s',
          }}>
            {kpiLoading ? '⟳' : '📊'} MÉTRICAS
            {kpiData && (
              <span style={{
                background: showKpis ? 'rgba(0,0,0,0.2)' : 'rgba(74,222,128,0.2)',
                color: showKpis ? '#0a0614' : '#4ade80',
                borderRadius:8, padding:'0 5px', fontSize:8,
              }}>{kpiData.activeToday} hoy</span>
            )}
          </button>

          {/* ── KPI MODAL FULLSCREEN ── */}
          {showKpis && createPortal(
            <div style={{
              position:'fixed', inset:0, zIndex:99999,
              background:'rgba(0,0,0,0.88)', backdropFilter:'blur(10px)',
              display:'flex', alignItems:'flex-start', justifyContent:'center',
              paddingTop:24, overflowY:'auto',
            }} onClick={() => setShowKpis(false)}>
              <div style={{
                background:'linear-gradient(135deg,#0d0a1a,#0a0614)',
                border:'1.5px solid rgba(212,175,55,0.4)',
                borderRadius:18, padding:'1.5rem',
                width:'min(1100px,96vw)', marginBottom:24,
                boxShadow:'0 0 80px rgba(212,175,55,0.15)',
                display:'flex', flexDirection:'column', gap:'1rem',
              }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <p style={{ margin:0, fontFamily:'Cinzel,serif', fontWeight:900, color:'#f5c842', fontSize:16, letterSpacing:3 }}>📊 MÉTRICAS DEL TEMPLO</p>
                    <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>
                      {kpiLastUpdated ? `Actualizado: ${kpiLastUpdated.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}` : 'Sin datos aún'}
                    </p>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <button onClick={() => loadKpis()} style={{ background:'rgba(245,200,70,0.12)', border:'1px solid rgba(245,200,70,0.35)', borderRadius:8, color:'#f5c842', fontFamily:'Cinzel,serif', fontSize:9, fontWeight:700, cursor:'pointer', padding:'0.35rem 0.75rem' }}>↺ ACTUALIZAR</button>
                    <button onClick={() => setShowKpis(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:22, cursor:'pointer', lineHeight:1 }}>✕</button>
                  </div>
                </div>

                {kpiLoading && !kpiData ? (
                  <p style={{ color:'rgba(245,200,70,0.5)', fontFamily:'Cinzel,serif', fontSize:11, textAlign:'center', padding:'3rem', letterSpacing:3 }}>CARGANDO MÉTRICAS…</p>
                ) : kpiData ? (
                  <>
                    {/* ── Fila 1: KPIs grandes ── */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                      {[
                        { label:'USUARIOS TOTALES',  val:kpiData.totalUsers.toLocaleString(),   color:'#f5c842', icon:'👥', sub:`${kpiData.activeThisWeek} activos esta semana` },
                        { label:'ACTIVOS HOY',        val:kpiData.activeToday,                   color:'#4ade80', icon:'🟢', sub: kpiData.dropAlert !== 0 ? `${kpiData.dropAlert > 0 ? '▲' : '▼'} ${Math.abs(kpiData.dropAlert)}% vs ayer` : 'sin cambio vs ayer', subColor: kpiData.dropAlert < -30 ? '#ef4444' : kpiData.dropAlert > 10 ? '#4ade80' : 'rgba(255,255,255,0.35)' },
                        { label:'MEMBRESÍAS ACTIVAS', val:kpiData.paidMembers,                   color:'#c084fc', icon:'💎', sub:`${Math.round(kpiData.paidMembers/Math.max(kpiData.totalUsers,1)*100)}% del total` },
                        { label:'CONVERSIÓN',         val:`${kpiData.convRate}%`,                color: kpiData.convRate > 20 ? '#4ade80' : kpiData.convRate > 10 ? '#f5c842' : '#ef4444', icon:'📈', sub:'usuarios pagados / total' },
                      ].map(it => (
                        <div key={it.label} style={{ background:'rgba(18,10,38,0.95)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1rem', display:'flex', flexDirection:'column', gap:4 }}>
                          <span style={{ fontSize:20 }}>{it.icon}</span>
                          <span style={{ fontFamily:'Cinzel,serif', fontSize:28, fontWeight:900, color:it.color, lineHeight:1 }}>{it.val}</span>
                          <span style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>{it.label}</span>
                          {it.sub && <span style={{ fontFamily:'Cinzel,serif', fontSize:9, color: it.subColor || 'rgba(255,255,255,0.35)', marginTop:2 }}>{it.sub}</span>}
                        </div>
                      ))}
                    </div>

                    {/* ── Fila 2: Nuevos usuarios ── */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                      {[
                        { label:'NUEVOS HOY',    val:`+${kpiData.newToday}`,     color:'#60a5fa' },
                        { label:'NUEVOS SEMANA', val:`+${kpiData.newThisWeek}`,  color:'rgba(96,165,250,0.7)' },
                        { label:'NUEVOS MES',    val:`+${kpiData.newThisMonth}`, color:'#f5c842' },
                        { label:'ACTIVOS SEM',   val:kpiData.activeThisWeek,     color:'#4ade80' },
                      ].map(it => (
                        <div key={it.label} style={{ background:'rgba(12,6,28,0.8)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'0.75rem 1rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <span style={{ fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:1 }}>{it.label}</span>
                          <span style={{ fontFamily:'Cinzel,serif', fontSize:22, fontWeight:900, color:it.color }}>{it.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* ── Fila 3: Engagement + Gráfica logins ── */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr', gap:10 }}>

                      {/* Engagement */}
                      <div style={{ background:'rgba(18,10,38,0.95)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1rem', display:'flex', flexDirection:'column', gap:8 }}>
                        <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, color:'rgba(212,175,55,0.5)', textTransform:'uppercase' }}>Engagement</p>
                        {[
                          { l:'Misiones 7d',   v:kpiData.missionsCompleted7d, col:'#4ade80', icon:'⚔' },
                          { l:'Órdenes hoy',   v:kpiData.ordersToday,         col: kpiData.ordersToday===0 ? '#ef4444' : '#f5c842', icon:'🛒' },
                          { l:'Órdenes total', v:kpiData.ordersTotal,         col:'rgba(255,255,255,0.5)', icon:'📦' },
                          { l:'Referidos',     v:kpiData.referralsDone,       col:'#c084fc', icon:'🔗' },
                        ].map(it => (
                          <div key={it.l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.5)' }}>{it.icon} {it.l}</span>
                            <span style={{ fontFamily:'Cinzel,serif', fontSize:14, fontWeight:900, color:it.col }}>{it.v.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {/* Distribución ranks */}
                      <div style={{ background:'rgba(18,10,38,0.95)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1rem', display:'flex', flexDirection:'column', gap:6 }}>
                        <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, color:'rgba(212,175,55,0.5)', textTransform:'uppercase' }}>Distribución Ranks</p>
                        {Object.entries(kpiData.rankMap).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([rank,count]) => {
                          const max = Math.max(...Object.values(kpiData.rankMap));
                          const pct = Math.round(count/max*100);
                          return (
                            <div key={rank}>
                              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                                <span style={{ fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:110 }}>{rank||'Sin rank'}</span>
                                <span style={{ fontFamily:'Cinzel,serif', fontSize:9, fontWeight:700, color:'#fff' }}>{count}</span>
                              </div>
                              <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:3, height:5, overflow:'hidden' }}>
                                <div style={{ width:`${pct}%`, height:'100%', borderRadius:3, background:'linear-gradient(90deg,#7c3aed,#c084fc)', transition:'width 0.5s' }}/>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Gráfica logins 7 días — más grande */}
                      <div style={{ background:'rgba(18,10,38,0.95)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1rem', display:'flex', flexDirection:'column', gap:8 }}>
                        <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, color:'rgba(212,175,55,0.5)', textTransform:'uppercase' }}>Logins últimos 7 días</p>
                        <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80, flex:1 }}>
                          {Object.entries(kpiData.dayBuckets).map(([dateStr,count],i) => {
                            const max = Math.max(...Object.values(kpiData.dayBuckets),1);
                            const pct = Math.round(count/max*100);
                            const isToday = i === Object.entries(kpiData.dayBuckets).length-1;
                            const labels = ['D','L','M','M','J','V','S'];
                            return (
                              <div key={dateStr} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, height:'100%', justifyContent:'flex-end' }}>
                                <span style={{ fontFamily:'Cinzel,serif', fontSize:9, color: isToday?'#f5c842':'rgba(255,255,255,0.4)', fontWeight: isToday?700:400 }}>{count||''}</span>
                                <div style={{ width:'100%', display:'flex', alignItems:'flex-end', flex:1 }}>
                                  <div style={{ width:'100%', height:`${Math.max(pct,4)}%`, background: isToday?'linear-gradient(180deg,#f5c842,#d97706)':'linear-gradient(180deg,rgba(124,58,237,0.8),rgba(124,58,237,0.3))', borderRadius:'3px 3px 0 0', transition:'height 0.5s' }}/>
                                </div>
                                <span style={{ fontFamily:'Cinzel,serif', fontSize:8, color: isToday?'#f5c842':'rgba(255,255,255,0.3)' }}>{labels[new Date(dateStr).getDay()]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* ── Fila 4: Top activos hoy ── */}
                    {kpiData.topActive.length > 0 && (
                      <div style={{ background:'rgba(18,10,38,0.95)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1rem' }}>
                        <p style={{ margin:'0 0 10px', fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, color:'rgba(212,175,55,0.5)', textTransform:'uppercase' }}>🔥 Top activos hoy</p>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
                          {kpiData.topActive.map((u,i) => (
                            <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'0.6rem 0.75rem', display:'flex', flexDirection:'column', gap:3 }}>
                              <span style={{ fontFamily:'Cinzel,serif', fontSize:8, color:'rgba(212,175,55,0.5)' }}>#{i+1}</span>
                              <span style={{ fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.templario_name||'Templario'}</span>
                              <span style={{ fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(192,132,252,0.7)' }}>Nv {u.level} · {(u.xp||0).toLocaleString()} XP</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Fila 5: Tienda — top compradores + productos más vendidos ── */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>

                      {/* Top compradores */}
                      <div style={{ background:'rgba(18,10,38,0.95)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1rem' }}>
                        <p style={{ margin:'0 0 10px', fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, color:'rgba(245,197,24,0.5)', textTransform:'uppercase' }}>🛒 Top compradores (30d)</p>
                        {(kpiData.topBuyers||[]).length === 0
                          ? <p style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.2)' }}>Sin datos</p>
                          : (kpiData.topBuyers||[]).map((u,i) => (
                          <div key={u.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom: i < (kpiData.topBuyers.length-1) ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                            <span style={{ fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(245,197,24,0.5)', width:18 }}>#{i+1}</span>
                            <span style={{ fontFamily:'Cinzel,serif', fontSize:11, color:'#fff', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</span>
                            <span style={{ fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700, color:'#f5c842' }}>{u.cnt} pedidos</span>
                          </div>
                        ))}
                      </div>

                      {/* Productos más vendidos */}
                      <div style={{ background:'rgba(18,10,38,0.95)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1rem' }}>
                        <p style={{ margin:'0 0 10px', fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, color:'rgba(96,165,250,0.5)', textTransform:'uppercase' }}>📦 Productos más canjeados</p>
                        {(kpiData.topProducts||[]).length === 0
                          ? <p style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.2)' }}>Sin datos</p>
                          : (kpiData.topProducts||[]).map((p,i) => {
                            const max = kpiData.topProducts[0]?.cnt || 1;
                            const pct = Math.round(p.cnt/max*100);
                            return (
                              <div key={p.title} style={{ marginBottom:8 }}>
                                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                                  <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(220,210,255,0.7)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'75%' }}>{p.title}</span>
                                  <span style={{ fontFamily:'Cinzel,serif', fontSize:10, fontWeight:700, color:'#60a5fa' }}>{p.cnt}x</span>
                                </div>
                                <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:3, height:4, overflow:'hidden' }}>
                                  <div style={{ width:`${pct}%`, height:'100%', borderRadius:3, background:'linear-gradient(90deg,#1d4ed8,#60a5fa)', transition:'width 0.5s' }}/>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* ── Fila 6: Academia — top misiones + evidencias 7d ── */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>

                      {/* Top usuarios por misiones */}
                      <div style={{ background:'rgba(18,10,38,0.95)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1rem' }}>
                        <p style={{ margin:'0 0 10px', fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, color:'rgba(74,222,128,0.5)', textTransform:'uppercase' }}>⚔ Top misiones completadas (30d)</p>
                        {(kpiData.topMissionUsers||[]).length === 0
                          ? <p style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.2)' }}>Sin datos</p>
                          : (kpiData.topMissionUsers||[]).map((u,i) => (
                          <div key={u.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom: i < (kpiData.topMissionUsers.length-1) ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                            <span style={{ fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(74,222,128,0.5)', width:18 }}>#{i+1}</span>
                            <span style={{ fontFamily:'Cinzel,serif', fontSize:11, color:'#fff', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</span>
                            <span style={{ fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700, color:'#4ade80' }}>{u.cnt} misiones</span>
                          </div>
                        ))}
                      </div>

                      {/* Evidencias enviadas 7d */}
                      <div style={{ background:'rgba(18,10,38,0.95)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1rem' }}>
                        <p style={{ margin:'0 0 10px', fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, color:'rgba(192,132,252,0.5)', textTransform:'uppercase' }}>📝 Posts en comunidad (7d)</p>
                        <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:70 }}>
                          {Object.entries(kpiData.evidenceBuckets||{}).map(([dateStr,count],i) => {
                            const max = Math.max(...Object.values(kpiData.evidenceBuckets||{}),1);
                            const pct = Math.round(count/max*100);
                            const isToday = i === Object.entries(kpiData.evidenceBuckets||{}).length-1;
                            const labels = ['D','L','M','M','J','V','S'];
                            return (
                              <div key={dateStr} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, height:'100%', justifyContent:'flex-end' }}>
                                <span style={{ fontFamily:'Cinzel,serif', fontSize:8, color: isToday?'#c084fc':'rgba(255,255,255,0.3)' }}>{count||''}</span>
                                <div style={{ width:'100%', display:'flex', alignItems:'flex-end', flex:1 }}>
                                  <div style={{ width:'100%', height:`${Math.max(pct,4)}%`, background: isToday?'linear-gradient(180deg,#c084fc,#7c3aed)':'linear-gradient(180deg,rgba(192,132,252,0.6),rgba(124,58,237,0.3))', borderRadius:'3px 3px 0 0' }}/>
                                </div>
                                <span style={{ fontFamily:'Cinzel,serif', fontSize:7, color: isToday?'#c084fc':'rgba(255,255,255,0.25)' }}>{labels[new Date(dateStr).getDay()]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* ── Fila 7: Top Templarios del juego ── */}
                    {(kpiData.topTemplarios||[]).length > 0 && (
                      <div style={{ background:'rgba(18,10,38,0.95)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:12, padding:'1rem' }}>
                        <p style={{ margin:'0 0 10px', fontFamily:'Cinzel,serif', fontSize:9, letterSpacing:2, color:'rgba(201,168,76,0.6)', textTransform:'uppercase' }}>👑 Top Templarios del juego (semana actual)</p>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
                          {(kpiData.topTemplarios||[]).map((p,i) => (
                            <div key={p.id} style={{ background: i===0?'rgba(201,168,76,0.1)':'rgba(255,255,255,0.03)', border:`1px solid ${i===0?'rgba(201,168,76,0.35)':i===1?'rgba(192,192,192,0.2)':i===2?'rgba(205,127,50,0.2)':'rgba(255,255,255,0.06)'}`, borderRadius:8, padding:'0.7rem', display:'flex', flexDirection:'column', gap:4 }}>
                              <span style={{ fontFamily:'Cinzel,serif', fontSize:11, color: i===0?'#f5c842':i===1?'#C0C0C0':i===2?'#CD7F32':'rgba(255,255,255,0.4)', fontWeight:700 }}>{i===0?'👑':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
                              <span style={{ fontFamily:'Cinzel,serif', fontSize:11, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                              <span style={{ fontFamily:'Cinzel,serif', fontSize:10, color:'#f5c842', fontWeight:700 }}>{(p.weekly_points||0).toLocaleString()} pts</span>
                              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                                <span style={{ fontFamily:'Cinzel,serif', fontSize:8, color:'rgba(74,222,128,0.8)', background:'rgba(40,140,40,0.12)', border:'1px solid rgba(60,180,60,0.2)', borderRadius:8, padding:'1px 5px' }}>✔{p.correct||0}</span>
                                <span style={{ fontFamily:'Cinzel,serif', fontSize:8, color:'rgba(126,184,247,0.8)', background:'rgba(50,120,200,0.12)', border:'1px solid rgba(70,140,220,0.2)', borderRadius:8, padding:'1px 5px' }}>Nv{p.level||1}</span>
                                {(p.streak||0)>=2 && <span style={{ fontFamily:'Cinzel,serif', fontSize:8, color:'#FF9500', background:'rgba(255,149,0,0.12)', border:'1px solid rgba(255,149,0,0.25)', borderRadius:8, padding:'1px 5px' }}>🔥{p.streak}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Fila 8: Códigos promo + resumen final ── */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                      {[
                        { label:'CÓDIGOS CANJEADOS', val: kpiData.totalPromoRedeemed||0, color:'#f97316', icon:'🎟️', sub:'órdenes con código promo' },
                        { label:'MISIONES 7D',        val: kpiData.missionsCompleted7d||0, color:'#4ade80', icon:'⚔', sub:'completadas esta semana' },
                        { label:'REFERIDOS TOTAL',    val: kpiData.referralsDone||0,       color:'#c084fc', icon:'🔗', sub:'con recompensa entregada' },
                      ].map(it => (
                        <div key={it.label} style={{ background:'rgba(18,10,38,0.95)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1rem', display:'flex', alignItems:'center', gap:12 }}>
                          <span style={{ fontSize:22 }}>{it.icon}</span>
                          <div>
                            <div style={{ fontFamily:'Cinzel,serif', fontSize:22, fontWeight:900, color:it.color, lineHeight:1 }}>{it.val.toLocaleString()}</div>
                            <div style={{ fontFamily:'Cinzel,serif', fontSize:8, letterSpacing:2, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', marginTop:3 }}>{it.label}</div>
                            <div style={{ fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.25)', marginTop:2 }}>{it.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ color:'rgba(255,255,255,0.3)', fontFamily:'Cinzel,serif', fontSize:11, textAlign:'center', padding:'2rem' }}>Sin datos — presiona ↺ ACTUALIZAR</p>
                )}

              </div>
            </div>,
            document.body
          )}
          <button onClick={() => { setShowTeam(true); loadTeam(); }} style={{
            background:'linear-gradient(135deg,#10B981,#065f46)', color:'#fff',
            padding:'clamp(5px,1.5vw,9px) clamp(8px,2vw,16px)',
            borderRadius:8, fontWeight:900, fontSize:'clamp(8px,2vw,11px)',
            border:'1px solid rgba(16,185,129,0.4)',
            boxShadow:'0 3px 16px rgba(16,185,129,0.4)',
            cursor:'pointer', letterSpacing:1, whiteSpace:'nowrap',
            display:'flex', alignItems:'center', gap:5,
          }}>👥 EQUIPO</button>
        </div>

        {/* ── STATS VIVOS — centro navbar ── */}
        <div className="admin-nav-center" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'flex-start', gap: 4, pointerEvents: 'auto',
          paddingTop: 6,
        }}>
          {/* Fila 1 — números grandes */}
          <div style={{ display:'flex', gap:6 }}>
            {[
              {
                val: kpiData ? kpiData.activeToday : '—',
                label: 'ACTIVOS HOY',
                color: '#4ade80',
                glow: 'rgba(74,222,128,0.4)',
                dot: true,
              },
              {
                val: kpiData ? kpiData.totalUsers.toLocaleString() : '—',
                label: 'TOTAL',
                color: '#f5c842',
                glow: 'rgba(245,200,70,0.3)',
                dot: false,
              },
              {
                val: kpiData ? `+${kpiData.newThisWeek}` : '—',
                label: 'NUEVOS / SEM',
                color: '#60a5fa',
                glow: 'rgba(96,165,250,0.3)',
                dot: false,
              },
              {
                val: kpiData ? kpiData.paidMembers : '—',
                label: 'MEMBRESÍAS',
                color: '#c084fc',
                glow: 'rgba(192,132,252,0.3)',
                dot: false,
              },
            ].map(item => (
              <div key={item.label} style={{
                background: 'rgba(12,6,28,0.92)',
                border: `1px solid ${item.glow.replace('0.', '0.35').replace(',0.3)', ',0.35)').replace(',0.4)', ',0.4)')}`,
                borderRadius: 8, padding: '4px 10px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                boxShadow: `0 0 12px ${item.glow}`,
                minWidth: 52,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  {item.dot && (
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: '#4ade80', boxShadow: '0 0 6px #4ade80',
                      display: 'inline-block', flexShrink: 0,
                    }}/>
                  )}
                  <span style={{
                    fontFamily: 'Cinzel,serif', fontWeight: 900,
                    fontSize: 'clamp(11px,2vw,15px)', color: item.color,
                    lineHeight: 1,
                  }}>
                    {kpiLoading && !kpiData ? '···' : item.val}
                  </span>
                </div>
                <span style={{
                  fontFamily: 'Cinzel,serif', fontSize: 7,
                  letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)',
                  textTransform: 'uppercase', marginTop: 2,
                }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          {/* Fila 2 — misiones + recompensas pendientes */}
          <div style={{ display:'flex', gap:6 }}>
            {[
              {
                val: kpiData ? kpiData.missionsCompleted7d.toLocaleString() : '—',
                label: 'MISIONES 7D',
                color: '#4ade80',
              },
              {
                val: historyPending > 0 ? historyPending : (kpiData ? '0' : '—'),
                label: 'RECOMP. PEND.',
                color: historyPending > 0 ? '#f5c842' : 'rgba(255,255,255,0.35)',
                alert: historyPending > 0,
              },
              {
                val: kpiData ? kpiData.referralsDone : '—',
                label: 'REFERIDOS',
                color: '#c084fc',
              },
            ].map(item => (
              <div key={item.label} style={{
                background: item.alert ? 'rgba(245,200,70,0.08)' : 'rgba(12,6,28,0.7)',
                border: `1px solid ${item.alert ? 'rgba(245,200,70,0.4)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 6, padding: '3px 8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                minWidth: 48,
              }}>
                <span style={{
                  fontFamily: 'Cinzel,serif', fontWeight: 900,
                  fontSize: 'clamp(10px,1.8vw,13px)', color: item.color,
                  lineHeight: 1,
                }}>
                  {kpiLoading && !kpiData ? '···' : item.val}
                </span>
                <span style={{
                  fontFamily: 'Cinzel,serif', fontSize: 6.5,
                  letterSpacing: 1, color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase', marginTop: 1,
                }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          {/* Última actualización */}
          <span style={{
            fontFamily: 'Cinzel,serif', fontSize: 7,
            color: 'rgba(255,255,255,0.2)', letterSpacing: 1,
          }}>
            {kpiLastUpdated
  ? `↺ ${kpiLastUpdated.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })}`
  : kpiLoading ? 'CARGANDO...' : ''}
          </span>
        </div>

        {/* Columna derecha — Admin */}
        <div className={`admin-nav-right${rightOpen ? '' : ' collapsed'}`} onClick={() => { if(isMobile) setRightOpen(false); }} style={{
          display: 'flex', flexDirection: 'column',
          gap: 5, alignItems: 'flex-end',
          pointerEvents: 'auto',
          ...(isMobile ? {
            position: 'fixed', top: 52, right: 0, width: 170,
            maxHeight: 'calc(100vh - 52px)',
            overflowY: 'auto', overflowX: 'hidden',
            flexDirection: 'column', alignItems: 'stretch',
            gap: 4, padding: '10px 8px 20px',
            background: 'rgba(8,3,18,0.98)',
            borderLeft: '1px solid rgba(245,197,24,0.25)',
            borderBottom: '1px solid rgba(245,197,24,0.15)',
            borderRadius: '0 0 0 14px',
            zIndex: 9998,
            boxShadow: '-4px 0 24px rgba(0,0,0,0.6)',
            transform: rightOpen ? 'translateX(0)' : 'translateX(105%)',
            transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
          } : {}),
        }}>
          {[
            { href:'/admin/referral-config',   bg:'linear-gradient(135deg,#f5c842,#d97706)', color:'#1a0800', shadow:'rgba(212,175,55,0.5)',  border:'rgba(245,200,70,0.4)', label:'🔗 REFERIDOS' },
            { href:'/admin/level-rewards',     bg:'linear-gradient(135deg,#b48cff,#7c3aed)', color:'#fff',    shadow:'rgba(180,140,255,0.4)', border:null,                   label:'🏅 NIVELES'   },
            { href:'/admin/milestone-prizes',  bg:'linear-gradient(135deg,#1a8a30,#0a4018)', color:'#fff',    shadow:'rgba(46,213,115,0.4)',  border:'rgba(46,213,115,0.3)', label:'🏆 HITOS'     },
            { href:'/admin/ranking-banners',   bg:'linear-gradient(135deg,#1a6a8a,#0a3040)', color:'#fff',    shadow:'rgba(46,160,213,0.4)',  border:'rgba(46,160,213,0.3)', label:'🖼️ BANNERS'   },
            { href:'/admin/vip-level-rewards', bg:'linear-gradient(135deg,#f5d06e,#7c3aed)', color:'#fff',    shadow:'rgba(212,175,55,0.5)',  border:'rgba(212,175,55,0.3)', label:'👑 VIP'        },
            { href:'/admin/sorteos', bg:'linear-gradient(135deg,#cc44ff,#6b0a8a)', color:'#fff', shadow:'rgba(204,68,255,0.5)', border:'rgba(204,68,255,0.3)', label:'🎲 SORTEOS' },
            { href:'/admin/aliados', bg:'linear-gradient(135deg,#D4AF37,#9a7a00)', color:'#1a0800', shadow:'rgba(212,175,55,0.5)', border:'rgba(212,175,55,0.4)', label:'⚔ ALIADOS' },
          ].map(btn => (
            <a key={btn.href} href={btn.href} style={{
              background: btn.bg, color: btn.color,
              padding: 'clamp(5px,1.5vw,9px) clamp(8px,2vw,16px)',
              borderRadius: 8, fontWeight: 900,
              fontSize: 'clamp(8px,2vw,11px)',
              textDecoration: 'none', letterSpacing: 1,
              boxShadow: `0 3px 16px ${btn.shadow}`,
              display: 'flex', alignItems: 'center', gap: 5,
              border: btn.border ? `1px solid ${btn.border}` : 'none',
              whiteSpace: 'nowrap',
            }}>{btn.label}</a>
          ))}
          <button onClick={() => setShowPrizes(true)} style={{
            background:'linear-gradient(135deg,#c9a84c,#7a5000)', color:'#fff',
            padding:'clamp(5px,1.5vw,9px) clamp(8px,2vw,16px)',
            borderRadius:8, fontWeight:900, fontSize:'clamp(8px,2vw,11px)',
            border:'1px solid rgba(245,200,70,0.4)',
            boxShadow:'0 3px 16px rgba(201,168,76,0.4)',
            cursor:'pointer', letterSpacing:1, whiteSpace:'nowrap',
            display:'flex', alignItems:'center', gap:5,
          }}>🏆 PREMIOS</button>
          <button onClick={() => { setShowHistory(true); loadHistoryPendingCount(); }} style={{
            background:'linear-gradient(135deg,#60A5FA,#1d4ed8)', color:'#fff',
            padding:'clamp(5px,1.5vw,9px) clamp(8px,2vw,16px)',
            borderRadius:8, fontWeight:900, fontSize:'clamp(8px,2vw,11px)',
            border:'1px solid rgba(96,165,250,0.4)',
            boxShadow:'0 3px 16px rgba(96,165,250,0.4)',
            cursor:'pointer', letterSpacing:1, whiteSpace:'nowrap',
            display:'flex', alignItems:'center', gap:5,
          }}>
            📋 HISTORIAL
            {historyPending > 0 && (
              <span style={{
                background:'#F5C518', color:'#0a0614', borderRadius:'50%',
                width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'Cinzel,serif', fontSize:8, fontWeight:900,
              }}>{historyPending > 9 ? '9+' : historyPending}</span>
            )}
          </button>
          <button onClick={() => { setShowSistema(true); loadMaintenanceConfig(); }} style={{
            background: mantConfig.active
              ? 'linear-gradient(135deg,#EF4444,#991b1b)'
              : 'linear-gradient(135deg,#374151,#1f2937)',
            color:'#fff',
            padding:'clamp(5px,1.5vw,9px) clamp(8px,2vw,16px)',
            borderRadius:8, fontWeight:900, fontSize:'clamp(8px,2vw,11px)',
            border: mantConfig.active ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.15)',
            boxShadow: mantConfig.active ? '0 3px 16px rgba(239,68,68,0.5)' : '0 3px 16px rgba(0,0,0,0.3)',
            cursor:'pointer', letterSpacing:1, whiteSpace:'nowrap',
            display:'flex', alignItems:'center', gap:5,
          }}>
            {mantConfig.active ? '🔴 MANT. ACTIVO' : '⚙️ SISTEMA'}
          </button>
        </div>

      </div>

      {/* ══ PANEL SISTEMA / MANTENIMIENTO ══ */}
      {showSistema && (
        <div style={{
          position:'fixed', inset:0, zIndex:99999,
          background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }} onClick={() => setShowSistema(false)}>
          <div style={{
            background:'linear-gradient(135deg,#0d0618,#080412)',
            border:'1.5px solid rgba(239,68,68,0.4)',
            borderRadius:18, padding:'1.5rem',
            width:'min(560px,96vw)', maxHeight:'88vh',
            boxShadow:'0 0 60px rgba(239,68,68,0.15)',
            display:'flex', flexDirection:'column', gap:'1rem',
            overflowY:'auto',
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ margin:0, fontFamily:'Cinzel,serif', fontWeight:900, color:'#EF4444', fontSize:15, letterSpacing:2 }}>⚙️ SISTEMA</p>
                <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Mantenimiento · Programado · Anuncio previo</p>
              </div>
              <button onClick={() => setShowSistema(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>

            {mantLoading ? (
              <p style={{ color:'rgba(255,255,255,0.4)', fontFamily:'Cinzel,serif', fontSize:11, textAlign:'center', padding:'2rem' }}>Cargando…</p>
            ) : (
              <>
                {/* ── BLOQUE 1: Toggle inmediato ── */}
                <div style={{
                  background: mantConfig.active ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${mantConfig.active ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius:12, padding:'1rem', display:'flex', flexDirection:'column', gap:'0.75rem',
                }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                    <div>
                      <p style={{ margin:0, fontFamily:'Cinzel,serif', fontWeight:900, fontSize:13, color: mantConfig.active ? '#EF4444' : '#fff' }}>
                        {mantConfig.active ? '🔴 MANTENIMIENTO ACTIVO' : '⚫ MANTENIMIENTO INACTIVO'}
                      </p>
                      <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.35)', marginTop:3 }}>
                        {mantConfig.active ? 'Los usuarios ven la pantalla de mantenimiento' : 'La app funciona con normalidad'}
                      </p>
                    </div>
                    <button onClick={toggleMaintenance} disabled={mantSaving} style={{
                      padding:'0.6rem 1.25rem', borderRadius:10, fontWeight:900,
                      fontFamily:'Cinzel,serif', fontSize:12, cursor:'pointer', letterSpacing:1,
                      background: mantConfig.active
                        ? 'linear-gradient(135deg,#10B981,#065f46)'
                        : 'linear-gradient(135deg,#EF4444,#991b1b)',
                      border: mantConfig.active ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(239,68,68,0.5)',
                      color:'#fff', boxShadow: mantConfig.active ? '0 0 20px rgba(16,185,129,0.4)' : '0 0 20px rgba(239,68,68,0.4)',
                    }}>
                      {mantSaving ? '…' : mantConfig.active ? '✅ DESACTIVAR' : '🔴 ACTIVAR'}
                    </button>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:'0 0 4px', fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:1 }}>MENSAJE PARA USUARIOS</p>
                      <input
                        value={mantConfig.message || ''}
                        onChange={e => setMantConfig(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Optimizando para una mejor experiencia."
                        style={{
                          width:'100%', boxSizing:'border-box',
                          background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)',
                          borderRadius:8, padding:'0.5rem 0.75rem', color:'#fff',
                          fontFamily:'Cinzel,serif', fontSize:11, outline:'none',
                        }}
                      />
                    </div>
                    <button onClick={saveMantMessage} disabled={mantSaving} style={{
                      padding:'0.5rem 0.875rem', borderRadius:8, cursor:'pointer',
                      background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.2)',
                      color:'rgba(255,255,255,0.7)', fontFamily:'Cinzel,serif', fontSize:10, fontWeight:700, flexShrink:0,
                    }}>💾 GUARDAR</button>
                  </div>
                </div>

                {/* ── BLOQUE 2: Programado ── */}
                <div style={{
                  background:'rgba(245,197,24,0.04)', border:'1px solid rgba(245,197,24,0.2)',
                  borderRadius:12, padding:'1rem', display:'flex', flexDirection:'column', gap:'0.75rem',
                }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <p style={{ margin:0, fontFamily:'Cinzel,serif', fontWeight:900, fontSize:12, color:'#F5C518' }}>⏰ PROGRAMADO</p>
                      <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.35)', marginTop:2 }}>Se activa solo en la fecha y hora elegidas</p>
                    </div>
                    <div onClick={() => setMantScheduled(prev => ({ ...prev, enabled: !prev.enabled }))} style={{
                      width:44, height:24, borderRadius:12, cursor:'pointer',
                      background: mantScheduled.enabled ? 'linear-gradient(135deg,#F5C518,#D97706)' : 'rgba(255,255,255,0.1)',
                      border:`1px solid ${mantScheduled.enabled ? 'rgba(245,197,24,0.6)' : 'rgba(255,255,255,0.15)'}`,
                      display:'flex', alignItems:'center', padding:'0 4px',
                      justifyContent: mantScheduled.enabled ? 'flex-end' : 'flex-start', transition:'all 0.2s',
                    }}>
                      <div style={{ width:16, height:16, borderRadius:'50%', background: mantScheduled.enabled ? '#0a0614' : 'rgba(255,255,255,0.4)' }} />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div>
                      <p style={{ margin:'0 0 4px', fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:1 }}>ACTIVAR EL</p>
                      <input
                        type="datetime-local"
                        value={mantScheduled.activate_at || ''}
                        onChange={e => setMantScheduled(prev => ({ ...prev, activate_at: e.target.value }))}
                        style={{
                          width:'100%', boxSizing:'border-box',
                          background:'rgba(245,197,24,0.07)', border:'1px solid rgba(245,197,24,0.25)',
                          borderRadius:8, padding:'0.45rem 0.6rem', color:'#F5C518',
                          fontFamily:'Cinzel,serif', fontSize:10, outline:'none',
                          colorScheme:'dark',
                        }}
                      />
                    </div>
                    <div>
                      <p style={{ margin:'0 0 4px', fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:1 }}>DESACTIVAR EL</p>
                      <input
                        type="datetime-local"
                        value={mantScheduled.deactivate_at || ''}
                        onChange={e => setMantScheduled(prev => ({ ...prev, deactivate_at: e.target.value }))}
                        style={{
                          width:'100%', boxSizing:'border-box',
                          background:'rgba(96,165,250,0.07)', border:'1px solid rgba(96,165,250,0.25)',
                          borderRadius:8, padding:'0.45rem 0.6rem', color:'#60A5FA',
                          fontFamily:'Cinzel,serif', fontSize:10, outline:'none',
                          colorScheme:'dark',
                        }}
                      />
                    </div>
                  </div>
                  <button onClick={saveMantScheduled} disabled={mantSaving} style={{
                    padding:'0.55rem', borderRadius:8, cursor:'pointer', fontWeight:900,
                    background:'linear-gradient(135deg,#F5C518,#D97706)',
                    border:'1px solid rgba(245,197,24,0.4)', color:'#0a0614',
                    fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:1,
                  }}>{mantSaving ? '…' : '💾 GUARDAR PROGRAMACIÓN'}</button>
                </div>

                {/* ── BLOQUE 3: Anuncio previo ── */}
                <div style={{
                  background:'rgba(96,165,250,0.04)', border:'1px solid rgba(96,165,250,0.2)',
                  borderRadius:12, padding:'1rem', display:'flex', flexDirection:'column', gap:'0.75rem',
                }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <p style={{ margin:0, fontFamily:'Cinzel,serif', fontWeight:900, fontSize:12, color:'#60A5FA' }}>📢 ANUNCIO PREVIO</p>
                      <p style={{ margin:0, fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.35)', marginTop:2 }}>Banner visible para todos antes del mantenimiento</p>
                    </div>
                    <div onClick={() => setMantAnnouncement(prev => ({ ...prev, active: !prev.active }))} style={{
                      width:44, height:24, borderRadius:12, cursor:'pointer',
                      background: mantAnnouncement.active ? 'linear-gradient(135deg,#60A5FA,#1d4ed8)' : 'rgba(255,255,255,0.1)',
                      border:`1px solid ${mantAnnouncement.active ? 'rgba(96,165,250,0.6)' : 'rgba(255,255,255,0.15)'}`,
                      display:'flex', alignItems:'center', padding:'0 4px',
                      justifyContent: mantAnnouncement.active ? 'flex-end' : 'flex-start', transition:'all 0.2s',
                    }}>
                      <div style={{ width:16, height:16, borderRadius:'50%', background: mantAnnouncement.active ? '#0a0614' : 'rgba(255,255,255,0.4)' }} />
                    </div>
                  </div>
                  <div>
                    <p style={{ margin:'0 0 4px', fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:1 }}>TEXTO DEL ANUNCIO</p>
                    <input
                      value={mantAnnouncement.text || ''}
                      onChange={e => setMantAnnouncement(prev => ({ ...prev, text: e.target.value }))}
                      placeholder="El 3 de julio habrá actualización. Volvemos rápido."
                      style={{
                        width:'100%', boxSizing:'border-box',
                        background:'rgba(96,165,250,0.07)', border:'1px solid rgba(96,165,250,0.25)',
                        borderRadius:8, padding:'0.5rem 0.75rem', color:'#fff',
                        fontFamily:'Cinzel,serif', fontSize:11, outline:'none',
                      }}
                    />
                  </div>
                  <div>
                    <p style={{ margin:'0 0 4px', fontFamily:'Cinzel,serif', fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:1 }}>MOSTRAR HASTA</p>
                    <input
                      type="datetime-local"
                      value={mantAnnouncement.show_until || ''}
                      onChange={e => setMantAnnouncement(prev => ({ ...prev, show_until: e.target.value }))}
                      style={{
                        width:'100%', boxSizing:'border-box',
                        background:'rgba(96,165,250,0.07)', border:'1px solid rgba(96,165,250,0.25)',
                        borderRadius:8, padding:'0.45rem 0.6rem', color:'#60A5FA',
                        fontFamily:'Cinzel,serif', fontSize:10, outline:'none',
                        colorScheme:'dark',
                      }}
                    />
                  </div>
                  {mantAnnouncement.active && mantAnnouncement.text && (
                    <div style={{
                      background:'rgba(96,165,250,0.1)', border:'1px solid rgba(96,165,250,0.3)',
                      borderRadius:8, padding:'0.6rem 0.875rem',
                      fontFamily:'Cinzel,serif', fontSize:11, color:'#60A5FA',
                    }}>
                      📢 Vista previa: {mantAnnouncement.text}
                    </div>
                  )}
                  <button onClick={saveMantAnnouncement} disabled={mantSaving} style={{
                    padding:'0.55rem', borderRadius:8, cursor:'pointer', fontWeight:900,
                    background:'linear-gradient(135deg,#60A5FA,#1d4ed8)',
                    border:'1px solid rgba(96,165,250,0.4)', color:'#fff',
                    fontFamily:'Cinzel,serif', fontSize:10, letterSpacing:1,
                  }}>{mantSaving ? '…' : '📢 GUARDAR ANUNCIO'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <iframe
        id="admin-frame"
        src="/pages/admin.html"
        style={{
          position: 'fixed', top: '68px', left: 0,
          width: '100vw', height: 'calc(100vh - 68px)',
          border: 'none', display: 'block', zIndex: 10,
        }}
      />
    </>
  );
}