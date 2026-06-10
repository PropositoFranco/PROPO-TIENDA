import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../services/supabase';

/* ── ESTILOS ── */
const S = {
  root: {
    background: 'linear-gradient(135deg, #0a0f1e 0%, #030b1a 100%)',
    minHeight: '100vh',
    fontFamily: "'Cinzel', Georgia, serif",
    color: '#e8d5a3',
    padding: '32px 24px',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32,
    borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: 20,
  },
  title: {
    fontSize: 22, fontWeight: 700, letterSpacing: 3, color: '#c9a84c',
    textTransform: 'uppercase', margin: 0, textShadow: '0 0 20px rgba(201,168,76,0.4)',
  },
  subtitle: {
    fontSize: 10, letterSpacing: 2, color: 'rgba(201,168,76,0.45)',
    textTransform: 'uppercase', marginTop: 4,
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20,
  },
  card: {
    background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)',
    borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  cardHover: {
    borderColor: 'rgba(201,168,76,0.4)', boxShadow: '0 0 24px rgba(201,168,76,0.1)',
  },
  badgeRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px 8px', borderBottom: '1px solid rgba(201,168,76,0.08)',
  },
  badge: {
    fontSize: 9, fontWeight: 800, letterSpacing: 2, color: '#c9a84c',
    background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: 20, padding: '2px 10px', textTransform: 'uppercase',
  },
  toggle: active => ({
    fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
    color: active ? '#4ecb71' : 'rgba(200,100,100,0.7)',
    background: active ? 'rgba(78,203,113,0.1)' : 'rgba(200,100,100,0.08)',
    border: `1px solid ${active ? 'rgba(78,203,113,0.3)' : 'rgba(200,100,100,0.2)'}`,
    borderRadius: 20, padding: '2px 10px', cursor: 'pointer',
    textTransform: 'uppercase', transition: 'all 0.2s',
  }),
  body: {
    padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
  },
  label: {
    fontSize: 8, letterSpacing: 2, color: 'rgba(201,168,76,0.5)',
    textTransform: 'uppercase', marginBottom: 4,
  },
  input: {
    width: '100%', background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(201,168,76,0.2)', borderRadius: 6,
    padding: '7px 10px', color: '#e8d5a3', fontSize: 11,
    fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 8,
    color: 'rgba(201,168,76,0.25)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
  },
  dividerLine: { flex: 1, height: 1, background: 'rgba(201,168,76,0.1)' },
  uploadBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    width: '100%', padding: '8px 0', background: 'rgba(201,168,76,0.07)',
    border: '1px dashed rgba(201,168,76,0.3)', borderRadius: 6,
    color: 'rgba(201,168,76,0.7)', fontSize: 10, letterSpacing: 1.5,
    textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: "'Cinzel', Georgia, serif",
  },
  saveBtn: loading => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    width: '100%', padding: '9px 0',
    background: loading
      ? 'rgba(201,168,76,0.15)'
      : 'linear-gradient(135deg, rgba(201,168,76,0.25), rgba(201,168,76,0.15))',
    border: '1px solid rgba(201,168,76,0.4)', borderRadius: 6,
    color: loading ? 'rgba(201,168,76,0.4)' : '#c9a84c',
    fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
    cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
    fontFamily: "'Cinzel', Georgia, serif", marginTop: 2,
  }),
  toast: ok => ({
    position: 'fixed', bottom: 24, right: 24,
    background: ok ? 'rgba(78,203,113,0.15)' : 'rgba(255,80,80,0.15)',
    border: `1px solid ${ok ? 'rgba(78,203,113,0.4)' : 'rgba(255,80,80,0.4)'}`,
    color: ok ? '#4ecb71' : '#ff6060', borderRadius: 8, padding: '10px 20px',
    fontSize: 11, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase',
    zIndex: 9999, animation: 'fadeInUp 0.3s ease',
  }),
};

/* ══════════════════════════════════════════
   CROP EDITOR — drag para ajustar posición
══════════════════════════════════════════ */
function CropEditor({ imgUrl, position, onChange }) {
  const containerRef = useRef();
  const imgRef = useRef();
  const dragging = useRef(false);
  const lastXY = useRef({ x: 0, y: 0 });

  // Posición actual en porcentaje {x, y}
  const pos = useRef({ x: 50, y: 50 });

  // Parsear la posición guardada al montar
 useEffect(() => {
  if (dragging.current) return;
  const parts = (position || '50% 50%').replace('center', '50%').split(' ');
  const parse = s => parseFloat(s) || 50;
  pos.current = { x: parse(parts[0]), y: parse(parts[1] ?? parts[0]) };
  applyToImg();
}, [position]);

  function applyToImg() {
    if (imgRef.current) {
      imgRef.current.style.objectPosition = `${pos.current.x}% ${pos.current.y}%`;
    }
  }

  const onDown = useCallback((e) => {
    dragging.current = true;
    const pt = e.touches ? e.touches[0] : e;
    lastXY.current = { x: pt.clientX, y: pt.clientY };
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    e.preventDefault();
  }, []);

  const onMove = useCallback((e) => {
    if (!dragging.current) return;
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - lastXY.current.x;
    const dy = pt.clientY - lastXY.current.y;
    lastXY.current = { x: pt.clientX, y: pt.clientY };

    // Sensibilidad: ajusta qué tan rápido se mueve la imagen
    // Negativo porque "arrastrar a la derecha" muestra la parte izquierda
    const sens = 0.18;
    pos.current.x = Math.max(0, Math.min(100, pos.current.x - dx * sens));
    pos.current.y = Math.max(0, Math.min(100, pos.current.y - dy * sens));
    applyToImg();
  }, []);

  const onUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
    const newPos = `${Math.round(pos.current.x)}% ${Math.round(pos.current.y)}%`;
    onChange(newPos);
  }, [onChange]);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [onMove, onUp]);

  if (!imgUrl) return null;

  return (
    <div>
      <div style={S.label}>✦ Arrastrar para elegir zona visible</div>

      {/* Marco con la proporción real del banner en el ranking (~3:1) */}
      <div
        ref={containerRef}
        onMouseDown={onDown}
        onTouchStart={onDown}
        style={{
          width: '100%',
          height: 148,
          borderRadius: 6,
          overflow: 'hidden',
          cursor: 'grab',
          border: '2px solid rgba(201,168,76,0.5)',
          boxShadow: '0 0 16px rgba(201,168,76,0.2)',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        <img
          ref={imgRef}
          src={imgUrl}
          alt="crop preview"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: position || '50% 50%',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
        {/* Indicador de drag */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }} className="crop-hint">
          <span style={{
            background: 'rgba(0,0,0,0.6)', color: '#c9a84c',
            fontSize: 9, letterSpacing: 2, padding: '4px 10px', borderRadius: 20,
            textTransform: 'uppercase',
          }}>Arrastra</span>
        </div>
      </div>

      {/* Posición actual */}
      <div style={{
        marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 9, color: 'rgba(201,168,76,0.35)', letterSpacing: 1 }}>
          posición: {position || '50% 50%'}
        </span>
        <button
          onClick={() => { pos.current = { x: 50, y: 0 }; if(imgRef.current) imgRef.current.style.objectPosition = '50% 0%'; onChange('50% 0%'); }}
          style={{
            background: 'none', border: '1px solid rgba(201,168,76,0.2)',
            color: 'rgba(201,168,76,0.5)', fontSize: 9, letterSpacing: 1,
            padding: '2px 8px', borderRadius: 20, cursor: 'pointer',
            fontFamily: "'Cinzel', Georgia, serif", textTransform: 'uppercase',
          }}
        >
          ↑ arriba
        </button>
        <button
          onClick={() => { pos.current = { x: 50, y: 50 }; if(imgRef.current) imgRef.current.style.objectPosition = '50% 50%'; onChange('50% 50%'); }}
          style={{
            background: 'none', border: '1px solid rgba(201,168,76,0.2)',
            color: 'rgba(201,168,76,0.5)', fontSize: 9, letterSpacing: 1,
            padding: '2px 8px', borderRadius: 20, cursor: 'pointer',
            fontFamily: "'Cinzel', Georgia, serif", textTransform: 'uppercase',
          }}
        >
          ↺ centrar
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   BANNER CARD
══════════════════════════════════ */
function BannerCard({ banner, onSaved, onDelete }) {
  const [imgUrl, setImgUrl]         = useState(banner.imagen_url || '');
  const [linkUrl, setLinkUrl]       = useState(banner.link_url || '#');
  const [activo, setActivo]         = useState(banner.activo ?? true);
  const [objPos, setObjPos]         = useState(banner.object_position || '50% 50%');
  const [loading, setLoading]       = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [hover, setHover]           = useState(false);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `banner_${banner.orden}_${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('banners').upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage.from('banners').getPublicUrl(path);
      const newUrl = data.publicUrl;
      setImgUrl(newUrl);
      setObjPos('50% 50%');
      await supabase.from('ranking_banners').update({
        imagen_url: newUrl,
        object_position: '50% 50%',
        updated_at: new Date().toISOString(),
      }).eq('id', banner.id);
      onSaved(true);
    } else {
      onSaved(false);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('ranking_banners')
      .update({
        imagen_url:       imgUrl,
        link_url:         linkUrl,
        activo,
        object_position:  objPos,
        updated_at:       new Date().toISOString(),
      })
      .eq('id', banner.id);
    setLoading(false);
    onSaved(!error);
  };

  const toggleActivo = async () => {
    const next = !activo;
    setActivo(next);
    await supabase.from('ranking_banners').update({ activo: next }).eq('id', banner.id);
  };

  const handlePosChange = async (newPos) => {
    setObjPos(newPos);
    // Auto-guardar la posición de crop
    await supabase.from('ranking_banners').update({
      object_position: newPos,
      updated_at: new Date().toISOString(),
    }).eq('id', banner.id);
    onSaved(true);
  };

  return (
    <div
      style={{ ...S.card, ...(hover ? S.cardHover : {}) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Header */}
      <div style={S.badgeRow}>
        <span style={S.badge}>Banner {banner.orden + 1}</span>
        <button style={S.toggle(activo)} onClick={toggleActivo}>
          {activo ? '● Activo' : '○ Oculto'}
        </button>
      </div>

      <div style={S.body}>
        {/* Subir desde PC */}
        <div>
          <div style={S.label}>Subir imagen desde PC</div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
          <button style={S.uploadBtn} onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? '⏳ Subiendo...' : '⬆ Seleccionar archivo'}
          </button>
        </div>

        {/* Divisor */}
        <div style={S.divider}>
          <div style={S.dividerLine} />o pega URL<div style={S.dividerLine} />
        </div>

        {/* URL imagen */}
        <div>
          <div style={S.label}>URL de imagen</div>
          <input
            style={S.input}
            value={imgUrl}
            onChange={e => setImgUrl(e.target.value)}
            placeholder="https://..."
            onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(201,168,76,0.2)'}
          />
        </div>

        {/* ── CROP EDITOR ── */}
        {imgUrl && (
          <CropEditor
            imgUrl={imgUrl}
            position={objPos}
            onChange={handlePosChange}
          />
        )}

        {/* URL link */}
        <div>
          <div style={S.label}>Link al hacer clic (opcional)</div>
          <input
            style={S.input}
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://... (deja # si no hay link)"
            onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(201,168,76,0.2)'}
          />
        </div>

        <button
  style={{...S.saveBtn(false), background:'rgba(200,50,50,0.15)', borderColor:'rgba(200,50,50,0.4)', color:'rgba(220,80,80,0.8)', marginTop:0}}
  onClick={async () => {
    if (!confirm('¿Eliminar este banner?')) return;
    await supabase.from('ranking_banners').delete().eq('id', banner.id);
    onSaved(true);
    onDelete(banner.id);
  }}
>
  ✕ Eliminar Banner
</button>

        <button style={S.saveBtn(loading)} onClick={handleSave} disabled={loading}>
          {loading ? '⏳ Guardando...' : '⚔ Guardar Banner'}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════ */
export default function RankingBannersAdmin() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('ranking_banners')
        .select('*')
        .order('orden');
      setBanners(data || []);
      setLoading(false);
    })();
  }, []);

  const showToast = (ok) => {
    setToast(ok);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
        .crop-editor-wrap:hover .crop-hint { opacity: 1 !important; }
      `}</style>

      <div style={S.header}>
        <a href="/admin" style={{ color:'#c9a84c', fontSize:11, letterSpacing:2, textDecoration:'none', marginRight:16, flexShrink:0 }}>← ADMIN</a>
        <div>
          <h1 style={S.title}>⚔ Banners del Ranking</h1>
          <div style={S.subtitle}>
            Sube imagen · Arrastra para recortar · Guarda · Se refleja en /ranking
            &nbsp;·&nbsp;{banners.length} banners
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(201,168,76,0.4)', letterSpacing: 3, fontSize: 11, marginTop: 60 }}>
          CARGANDO BANNERS...
        </div>
      ) : (
        <div style={S.grid}>
          {banners.map(b => (
            <BannerCard
              key={b.id}
              banner={b}
              onSaved={showToast}
              onDelete={id => setBanners(prev => prev.filter(x => x.id !== id))}
            />
          ))}
          <button
            style={{...S.uploadBtn, height:80, fontSize:28, flexDirection:'column', gap:6}}
            onClick={async () => {
              const orden = banners.length;
              const { data } = await supabase
                .from('ranking_banners')
                .insert({ orden, activo: true, imagen_url: '', link_url: '#', object_position: '50% 50%' })
                .select().single();
              if (data) setBanners(prev => [...prev, data]);
            }}
          >
            <span>+</span>
            <span style={{fontSize:9, letterSpacing:2}}>NUEVO BANNER</span>
          </button>
        </div>
      )}

      {toast !== null && (
        <div style={S.toast(toast)}>
          {toast ? '✓ Guardado · se refleja en /ranking' : '✗ Error al guardar'}
        </div>
      )}
    </div>
  );
}