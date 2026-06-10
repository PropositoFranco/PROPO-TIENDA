import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/useAuthStore';

const CATEGORY_CONFIG = {
  claves:    { label: 'Clave',           icon: '🗝', color: '#F59E0B', glow: 'rgba(245,159,11,0.45)',   bg: 'rgba(245,159,11,0.08)',   border: 'rgba(245,159,11,0.3)',   badge: 'ARSENAL · CLAVE' },
  victorias: { label: 'Victoria Rápida', icon: '⚡', color: '#10B981', glow: 'rgba(16,185,129,0.45)',   bg: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.3)',   badge: 'ARSENAL · VICTORIA' },
  mapas:     { label: 'Mapa del Templo', icon: '🗺', color: '#8B5CF6', glow: 'rgba(139,92,246,0.45)',   bg: 'rgba(139,92,246,0.08)',   border: 'rgba(139,92,246,0.3)',   badge: 'ARSENAL · MAPA' },
};
const DEFAULT_CFG = { label: 'Herramienta', icon: '✦', color: '#E2E8F0', glow: 'rgba(226,232,240,0.35)', bg: 'rgba(226,232,240,0.06)', border: 'rgba(226,232,240,0.2)', badge: 'ARSENAL' };

function ParticleBg() {
  const canvasRef = React.useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, raf;
    const particles = [];
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 40; i++) {
      particles.push({ x: Math.random()*2000, y: Math.random()*2000, r: Math.random()*1.2+0.2, vx: (Math.random()-0.5)*0.1, vy: (Math.random()-0.5)*0.1, a: Math.random()*Math.PI*2 });
    }
    const tick = () => {
      ctx.fillStyle = 'rgba(3,0,20,0.18)';
      ctx.fillRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.a += 0.006;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const alpha = (Math.sin(p.a) * 0.5 + 0.5) * 0.28 + 0.04;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${alpha})`; ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />;
}

export default function ToolViewer() {
  const { slug }  = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuthStore();

  const [product, setProduct]     = useState(null);
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [barVisible, setBarVisible] = useState(true);

  const cfg = product ? (CATEGORY_CONFIG[product.category] || DEFAULT_CFG) : DEFAULT_CFG;

  const loadTool = useCallback(async () => {
    if (!slug || !user?.id) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Obtener producto
      const { data: prod, error: prodErr } = await supabase
        .from('products')
        .select('id, name, category, content_url, slug, price_cristales, is_free_onboarding')
        .eq('slug', slug)
        .single();

      if (prodErr || !prod) throw new Error('Herramienta no encontrada');
      setProduct(prod);

      // 2. Verificar acceso
      let access = false;
      if (prod.price_cristales === 0 || prod.is_free_onboarding) {
        access = true;
      } else {
        const { data: orders } = await supabase.from('orders').select('items').eq('user_id', user.id);
        access = (orders || []).some(order => {
          try {
            const items = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);
            return items.some(i => i.product_id === prod.id);
          } catch { return false; }
        });
        if (!access) {
          const { data: purchased } = await supabase.from('user_purchased_offers').select('product_id').eq('user_id', user.id).eq('product_id', prod.id).maybeSingle();
          access = !!purchased;
        }
      }
      setHasAccess(access);

      // 3. Si tiene acceso, hacer fetch del HTML
      if (access && prod.content_url) {
        const res = await fetch(prod.content_url);
        if (!res.ok) throw new Error('No se pudo cargar el contenido');
        const html = await res.text();
        setHtmlContent(html);
      }

    } catch (err) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [slug, user?.id]);

  useEffect(() => { loadTool(); }, [loadTool]);

  useEffect(() => {
    if (!hasAccess) return;
    const t = setTimeout(() => setBarVisible(false), 3000);
    return () => clearTimeout(t);
  }, [hasAccess]);

  const handleBack = () => navigate(-1);

  // ── LOADING ──
  if (loading) return (
    <div style={{ position:'fixed', inset:0, background:'#030014', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1.5rem' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap');@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <ParticleBg />
      <div style={{ width:'60px', height:'60px', borderRadius:'50%', border:`3px solid ${cfg.color}`, borderTopColor:'transparent', animation:'spin 0.8s linear infinite', position:'relative', zIndex:10 }} />
      <div style={{ fontFamily:"'Cinzel',serif", fontSize:'11px', letterSpacing:'3px', color:cfg.color, zIndex:10 }}>CARGANDO HERRAMIENTA</div>
    </div>
  );

  // ── ERROR ──
  if (error) return (
    <div style={{ position:'fixed', inset:0, background:'#030014', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1.5rem', padding:'2rem' }}>
      <ParticleBg />
      <div style={{ fontSize:'48px', zIndex:10 }}>⚠️</div>
      <p style={{ fontFamily:"'Cinzel',serif", color:'#EF4444', fontSize:'12px', letterSpacing:'2px', zIndex:10 }}>{error}</p>
      <div style={{ display:'flex', gap:'12px', zIndex:10 }}>
        <button onClick={loadTool} style={{ padding:'10px 24px', background:'rgba(239,68,68,0.1)', border:'1px solid #EF4444', borderRadius:'8px', color:'#EF4444', fontFamily:"'Cinzel',serif", fontSize:'10px', letterSpacing:'2px', cursor:'pointer' }}>Reintentar</button>
        <button onClick={handleBack} style={{ padding:'10px 24px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'8px', color:'rgba(255,255,255,0.6)', fontFamily:"'Cinzel',serif", fontSize:'10px', letterSpacing:'2px', cursor:'pointer' }}>← Volver</button>
      </div>
    </div>
  );

  // ── SIN ACCESO ──
  if (!hasAccess) return (
    <div style={{ position:'fixed', inset:0, background:'#030014', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1.5rem', padding:'2rem' }}>
      <ParticleBg />
      <div style={{ fontSize:'52px', zIndex:10 }}>🔒</div>
      <div style={{ textAlign:'center', zIndex:10 }}>
        <p style={{ fontFamily:"'Cinzel',serif", fontSize:'10px', letterSpacing:'3px', color:cfg.color, marginBottom:'8px' }}>ACCESO RESTRINGIDO</p>
        <h2 style={{ fontFamily:"'Cinzel',serif", color:'#fff', fontSize:'18px' }}>{product?.name}</h2>
      </div>
      <div style={{ display:'flex', gap:'12px', zIndex:10 }}>
        <button onClick={() => navigate('/store')} style={{ padding:'12px 28px', background:cfg.color, border:'none', borderRadius:'10px', color:'#000', fontFamily:"'Cinzel',serif", fontSize:'11px', letterSpacing:'2px', cursor:'pointer', fontWeight:700 }}>Ir al Arsenal</button>
        <button onClick={handleBack} style={{ padding:'12px 28px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'10px', color:'rgba(255,255,255,0.6)', fontFamily:"'Cinzel',serif", fontSize:'11px', letterSpacing:'2px', cursor:'pointer' }}>← Volver</button>
      </div>
    </div>
  );

  // ── VIEWER PRINCIPAL ──
  return (
    <div style={{ position:'fixed', inset:0, background:'#030014' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap');`}</style>

      {/* TOP BAR */}
      {!barVisible && (
        <div onMouseEnter={() => setBarVisible(true)} style={{ position:'fixed', top:0, left:0, right:0, height:'48px', zIndex:200 }} />
      )}
      <div
        onMouseLeave={() => setBarVisible(false)}
        style={{
          position:'fixed', top:0, left:0, right:0, zIndex:300,
          transform: barVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition:'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
          background:'rgba(3,0,20,0.94)',
          backdropFilter:'blur(20px)',
          borderBottom:`1px solid ${cfg.border}`,
          display:'flex', alignItems:'center', gap:'12px',
          padding:'0 24px', height:'56px',
        }}
      >
        <button onClick={handleBack} style={{ padding:'6px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'rgba(255,255,255,0.55)', fontFamily:"'Cinzel',serif", fontSize:'9px', letterSpacing:'2px', cursor:'pointer' }}>
          ← ARSENAL
        </button>
        <div style={{ width:'1px', height:'24px', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'4px 12px', background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:'20px' }}>
          <span style={{ fontSize:'13px' }}>{cfg.icon}</span>
          <span style={{ fontFamily:"'Cinzel',serif", fontSize:'8px', letterSpacing:'2px', color:cfg.color, textTransform:'uppercase' }}>{cfg.label}</span>
        </div>
        <div style={{ flex:1, fontFamily:"'Cinzel',serif", fontSize:'13px', color:'rgba(240,232,255,0.92)', fontWeight:700, letterSpacing:'0.04em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {product?.name}
        </div>
        <button onClick={() => setBarVisible(false)} style={{ width:'34px', height:'34px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', color:'rgba(255,255,255,0.25)', cursor:'pointer', fontSize:'11px' }}>▲</button>
      </div>

      {/* CONTENIDO HTML via srcDoc */}
      <iframe
        srcDoc={htmlContent || ''}
        title={product?.name || 'Herramienta'}
        style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', border:'none', zIndex:10 }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        scrolling="yes"
        onLoad={e => {
          try {
            const doc = e.target.contentDocument;
            if (doc) {
              doc.querySelectorAll('a[href^="#"]').forEach(a => {
                a.addEventListener('click', ev => {
                  ev.preventDefault();
                  const target = doc.querySelector(a.getAttribute('href'));
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                });
              });
            }
          } catch(err) {}
        }}
      />
    </div>
  );
}