import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../services/supabase';
import { storeService } from '../../services/store.service';

// ─── TERRITORY DATA ─────────────────────────────────────────────────────────────
const SPHERES = [
  { idx: 0, icon: '🧠', color: '#60a5fa', label: 'Mente',          territory: 'mente' },
  { idx: 1, icon: '💪', color: '#ef4444', label: 'Cuerpo',         territory: 'cuerpo' },
  { idx: 2, icon: '🌴', color: '#f97316', label: 'Ocio',           territory: 'ocio' },
  { idx: 3, icon: '🪷', color: '#06b6d4', label: 'Espiritualidad', territory: 'espiritualidad' },
  { idx: 4, icon: '🎯', color: '#8b5cf6', label: 'Vocación',       territory: 'vocacion' },
  { idx: 5, icon: '👥', color: '#22c55e', label: 'Relaciones',     territory: 'relaciones' },
  { idx: 6, icon: '💰', color: '#eab308', label: 'Finanzas',       territory: 'finanzas' },
  { idx: 7, icon: '💗', color: '#ec4899', label: 'Emociones',      territory: 'emociones' },
];

const CONTENT_TYPES = [
  { id: 'todos',     label: 'TODOS',            icon: '◈' },
  { id: 'claves',    label: 'CLAVES',           icon: '⚔' },
  { id: 'victorias', label: 'VICTORIAS RÁPIDAS', icon: '⚡' },
  { id: 'mapas',     label: 'MAPAS DEL TEMPLO', icon: '⬡' },
];

const LEVEL_CONFIG = {
  LEGENDARIO: { color: '#f5c842', glow: 'rgba(245,200,66,0.9)' },
  MAESTRO:    { color: '#b97fff', glow: 'rgba(185,127,255,0.9)' },
  ÉLITE:      { color: '#22e5f5', glow: 'rgba(34,229,245,0.9)'  },
  AVANZADO:   { color: '#4ade80', glow: 'rgba(74,222,128,0.9)'  },
};

export const ARSENAL_ITEMS = [
  {
    id: 'a1', title: 'Protocolo de Claridad Mental', subtitle: 'Reprograma el arquitecto interno',
    type: 'claves', territory: 'mente', color: '#60a5fa', icon: '🧠', level: 'LEGENDARIO',
    description: 'El ejercicio más completo para desestructurar creencias limitantes y reinstalar patrones cognitivos de alto rendimiento.',
    impact: ['Claridad cognitiva profunda', 'Eliminación de bloqueos mentales', 'Velocidad de decisión multiplicada'],
    transformation: 'En 21 días de práctica constante, el sistema cognitivo se reinicia desde adentro.',
    unlocks: 'Acceso al Mapa Cognitivo Avanzado',
    duration: '45 min', sessions: '21 días',
  },
  {
    id: 'a2', title: 'Activación Física Matutina', subtitle: 'El combustible base del día',
    type: 'victorias', territory: 'cuerpo', color: '#ef4444', icon: '💪', level: 'ÉLITE',
    description: 'Protocolo de 12 minutos que activa el sistema nervioso, libera endorfinas y programa el cuerpo para máxima energía durante 8 horas.',
    impact: ['Energía sostenida todo el día', 'Activación metabólica inmediata', 'Estado emocional elevado'],
    transformation: 'Transforma las mañanas de resistencia en rituales de poder.',
    unlocks: 'Protocolos de recuperación nocturna',
    duration: '12 min', sessions: 'Diario',
  },
  {
    id: 'a3', title: 'Mapa Financiero del Templo', subtitle: 'La arquitectura de la abundancia',
    type: 'mapas', territory: 'finanzas', color: '#eab308', icon: '💰', level: 'MAESTRO',
    description: 'El sistema completo para diseñar tu arquitectura financiera: fuentes de ingreso, flujo de dinero, inversiones y patrimonio intencional.',
    impact: ['Claridad financiera total', 'Sistema de abundancia instalado', 'Libertad económica real'],
    transformation: 'El dinero deja de ser una fuente de ansiedad y se convierte en una herramienta de libertad.',
    unlocks: 'Simuladores de abundancia',
    duration: '90 min', sessions: 'Trimestral',
  },
  {
    id: 'a4', title: 'Diario de las Emociones', subtitle: 'Inteligencia emocional en acción',
    type: 'claves', territory: 'emociones', color: '#ec4899', icon: '💗', level: 'ÉLITE',
    description: 'Sistema de journaling emocional para procesar, integrar y transformar cualquier estado interno en combustible de crecimiento.',
    impact: ['Regulación emocional profunda', 'Autoconocimiento acelerado', 'Relaciones más auténticas'],
    transformation: 'Las emociones dejan de ser obstáculos. Se convierten en el GPS más preciso de tu vida interior.',
    unlocks: 'Portal Emocional completo',
    duration: '20 min', sessions: 'Diario',
  },
  {
    id: 'a5', title: 'Tribu Intencional', subtitle: 'El ecosistema que te expande',
    type: 'mapas', territory: 'relaciones', color: '#22c55e', icon: '👥', level: 'LEGENDARIO',
    description: 'Mapa completo para diseñar, atraer y cultivar el ecosistema humano que sostiene tu versión más elevada.',
    impact: ['Red de apoyo sólida', 'Vínculos profundos y auténticos', 'Expansión colectiva real'],
    transformation: 'Dejas de estar solo en el camino. Construyes una tribu que crece contigo.',
    unlocks: 'Acceso a la Comunidad del Templo',
    duration: '60 min', sessions: 'Mensual',
  },
  {
    id: 'a6', title: 'Victoria del Descanso', subtitle: 'El arte de recuperarse bien',
    type: 'victorias', territory: 'ocio', color: '#f97316', icon: '🌴', level: 'AVANZADO',
    description: 'Protocolo de 15 minutos para desconectar completamente, recuperar energía y reingresar con claridad.',
    impact: ['Recuperación profunda', 'Creatividad renovada', 'Presencia real'],
    transformation: 'Aprendes que descansar bien no es perder tiempo — es multiplicar la calidad de todo lo que sigue.',
    unlocks: 'Sistema de descanso activo',
    duration: '15 min', sessions: 'Diario',
  },
  {
    id: 'a7', title: 'Mapa del Propósito', subtitle: 'El centro organizador de tu vida',
    type: 'mapas', territory: 'vocacion', color: '#8b5cf6', icon: '🎯', level: 'MAESTRO',
    description: 'El ejercicio más transformador del Templo. Diseña la arquitectura completa de tu vocación, misión y contribución al mundo.',
    impact: ['Claridad de propósito total', 'Motivación intrínseca permanente', 'Dirección de vida inequívoca'],
    transformation: 'El trabajo deja de sentirse como trabajo. Actúas desde energía genuina, no desde obligación.',
    unlocks: 'Mapa Maestro del Templo',
    duration: '3 horas', sessions: 'Anual',
  },
  {
    id: 'a8', title: 'Ritual de Presencia', subtitle: 'Conexión con lo que trasciende',
    type: 'victorias', territory: 'espiritualidad', color: '#06b6d4', icon: '🪷', level: 'ÉLITE',
    description: 'Práctica de 10 minutos que ancla la conciencia en el presente, silencia el ruido mental y abre el canal de la intuición profunda.',
    impact: ['Paz interior real', 'Intuición amplificada', 'Resistencia ante la adversidad'],
    transformation: 'Hay una calma que no depende de las circunstancias externas.',
    unlocks: 'Prácticas contemplativas avanzadas',
    duration: '10 min', sessions: 'Diario',
  },
  {
    id: 'a9', title: 'Clave de la Abundancia', subtitle: 'Reprogramación financiera profunda',
    type: 'claves', territory: 'finanzas', color: '#eab308', icon: '💰', level: 'LEGENDARIO',
    description: 'El protocolo más profundo del Templo para transformar la relación con el dinero desde las raíces.',
    impact: ['Mentalidad de abundancia instalada', 'Relación sana con el dinero', 'Techo financiero expandido'],
    transformation: 'La escasez mental colapsa. El dinero empieza a fluir hacia ti de formas que antes no veías.',
    unlocks: 'Arquitectura patrimonial',
    duration: '60 min', sessions: 'Mensual',
  },
];

// ─── UTILITY ────────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// ─── HOOK: responsive breakpoint ────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

function useIsTablet() {
  const [isTablet, setIsTablet] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const fn = () => setIsTablet(window.innerWidth < 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isTablet;
}

// ─── GLOBAL STYLES INJECTOR ──────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Raleway:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
  ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.5); border-radius: 4px; }

  @keyframes goldShimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes arsenalTitleGlow {
    0%,100% { text-shadow: 0 0 18px rgba(212,175,55,0.35); }
    50%     { text-shadow: 0 0 36px rgba(212,175,55,0.6), 0 0 70px rgba(212,175,55,0.25); }
  }
  @keyframes cardIconFloat {
    0%,100% { transform: translate(-50%,-50%) translateY(0px); }
    50%     { transform: translate(-50%,-50%) translateY(-8px); }
  }
  @keyframes cardPulseRing {
    0%   { opacity: 0.7; transform: scale(1); }
    100% { opacity: 0;   transform: scale(2.8); }
  }
  @keyframes panelReveal {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes introSlideUp {
    from { opacity: 0; transform: scale(0.88) translateY(55px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes heroFloat {
    0%,100% { transform: translate(-50%,-50%) translateY(0) scale(1) rotate(-2deg); }
    50%     { transform: translate(-50%,-50%) translateY(-18px) scale(1.07) rotate(2deg); }
  }
  @keyframes ctaBreath {
    0%,100% { box-shadow: 0 0 35px var(--cta-glow, rgba(212,175,55,0.6)), 0 0 70px var(--cta-glow2, rgba(212,175,55,0.3)), inset 0 1px 0 rgba(255,255,255,0.2); }
    50%     { box-shadow: 0 0 70px var(--cta-glow, rgba(212,175,55,1)),   0 0 140px var(--cta-glow2, rgba(212,175,55,0.6)), inset 0 1px 0 rgba(255,255,255,0.35); }
  }
  @keyframes runeFloat {
    0%,100% { transform: translateY(0px);   opacity: 0.05; }
    50%     { transform: translateY(-22px);  opacity: 0.1; }
  }
  @keyframes arsenalBorder {
    0%   { stroke-dashoffset: 0; }
    100% { stroke-dashoffset: -1400; }
  }
  @keyframes spherePulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.4); }
    50%     { box-shadow: 0 0 0 8px rgba(212,175,55,0); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmerSlide {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .arsenal-card:hover .card-cta {
    background: var(--card-color-bg) !important;
    border-color: var(--card-color) !important;
    color: var(--card-color) !important;
  }
  .intro-scroll::-webkit-scrollbar { width: 3px; }
  .intro-scroll::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.4); border-radius: 4px; }

  @media (max-width: 767px) {
    .mobile-hide { display: none !important; }
    .mobile-grid-1 { grid-template-columns: 1fr !important; }
    .mobile-full { width: 100% !important; }
    .mobile-text-sm { font-size: 11px !important; }
  }
  @media (min-width: 768px) and (max-width: 1023px) {
    .tablet-grid-2 { grid-template-columns: repeat(2, 1fr) !important; }
  }
`;

// ─── ENERGY BORDER ────────────────────────────────────────────────────────────────
function EnergyBorder({ color = '#d4af37' }) {
  const { r, g, b } = hexToRgb(color);
  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: '20px', pointerEvents: 'none', zIndex: 2,
      boxShadow: `inset 0 0 0 1px rgba(${r},${g},${b},0.45), inset 0 0 18px rgba(${r},${g},${b},0.08)`,
    }} />
  );
}

// ─── PARTICLE FIELD ────────────────────────────────────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);
  const stateRef = useRef({ particles: [], raf: null });
  const isMobile = window.innerWidth < 768;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const st = stateRef.current;

    if (st.particles.length === 0) {
      const count = isMobile ? 25 : 60;
      for (let i = 0; i < count; i++) {
        const pick = Math.random();
        st.particles.push({
          x: Math.random() * width, y: Math.random() * height,
          size: Math.random() * 1.4 + 0.2,
          speed: Math.random() * 0.18 + 0.03,
          opacity: Math.random() * 0.45 + 0.08,
          color: pick > 0.65 ? '#d4af37' : pick > 0.4 ? '#7c3aed' : pick > 0.2 ? '#60a5fa' : '#ffffff',
          drift: (Math.random() - 0.5) * 0.12,
        });
      }
    }

    ctx.clearRect(0, 0, width, height);

    st.particles.forEach(p => {
      p.y -= p.speed; p.x += p.drift;
      if (p.y < -4) { p.y = height + 4; p.x = Math.random() * width; }
      if (p.x < -4) p.x = width + 4;
      if (p.x > width + 4) p.x = -4;
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    st.raf = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      stateRef.current.particles = [];
    };
    resize();
    window.addEventListener('resize', resize);
    stateRef.current.raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(stateRef.current.raf); window.removeEventListener('resize', resize); };
  }, [draw]);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />;
}

// ─── STAFF ALTAR CANVAS (Desktop) ────────────────────────────────────────────────
function StaffAltarCanvas({ activeSphere, onSphereClick }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ t: 0, raf: null });
  const hoveredRef = useRef(-1);

  const getLayout = useCallback((canvas) => {
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const spacing = Math.min(W / 10, 62);
    const positions = [];
    for (let i = 0; i < 4; i++) positions.push({ x: cx - spacing * (4 - i), y: cy, idx: i });
    for (let i = 4; i < 8; i++) positions.push({ x: cx + spacing * (i - 3), y: cy, idx: i });
    return { W, H, cx, cy, positions, sR: Math.min(spacing * 0.38, 22) };
  }, []);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const { positions, sR } = getLayout(canvas);
    let found = -1;
    positions.forEach(p => { if (Math.hypot(mx - p.x, my - p.y) < sR * 2) found = p.idx; });
    hoveredRef.current = found;
    canvas.style.cursor = found >= 0 ? 'pointer' : 'default';
  }, [getLayout]);

  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const { positions, sR } = getLayout(canvas);
    positions.forEach(p => {
      if (Math.hypot(mx - p.x, my - p.y) < sR * 2) {
        onSphereClick(SPHERES[p.idx].territory);
      }
    });
  }, [getLayout, onSphereClick]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const st = stateRef.current; st.t++;
    const { W, H, cx, cy, positions, sR } = getLayout(canvas);
    const activeIdx = activeSphere ? SPHERES.findIndex(s => s.territory === activeSphere) : -1;
    const hIdx = hoveredRef.current;

    ctx.clearRect(0, 0, W, H);

    // Background glow
    const bgG = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.45);
    bgG.addColorStop(0, 'rgba(212,175,55,0.07)');
    bgG.addColorStop(0.5, 'rgba(124,58,237,0.04)');
    bgG.addColorStop(1, 'transparent');
    ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H);

    // Energy lines
    positions.forEach((p) => {
      const s = SPHERES[p.idx];
      const c = hexToRgb(s.color);
      const isActive = activeIdx === p.idx;
      const isHovered = hIdx === p.idx;
      const alpha = isActive ? 0.75 + Math.sin(st.t * 0.07) * 0.2 : isHovered ? 0.55 : (activeIdx >= 0 ? 0.06 : 0.18);
      const lg = ctx.createLinearGradient(p.x, cy, cx, cy);
      lg.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${alpha})`);
      lg.addColorStop(0.5, `rgba(212,175,55,${alpha * 0.4})`);
      lg.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
      ctx.strokeStyle = lg; ctx.lineWidth = isActive ? 2.5 : 1;
      ctx.setLineDash([isActive ? 10 : 4, 12]);
      ctx.lineDashOffset = -(st.t * (isActive ? 1.5 : 0.7));
      ctx.beginPath(); ctx.moveTo(p.x, cy); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.setLineDash([]);
    });

    // Central staff glow
    const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, sR * 3.8);
    sg.addColorStop(0, `rgba(212,175,55,${0.65 * (0.85 + Math.sin(st.t * 0.04) * 0.15)})`);
    sg.addColorStop(0.5, 'rgba(212,175,55,0.2)'); sg.addColorStop(1, 'transparent');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, sR * 3.8, 0, Math.PI * 2); ctx.fill();

    // Staff line
    const staffH = H * 0.74;
    const sGrad = ctx.createLinearGradient(cx, cy - staffH / 2, cx, cy + staffH / 2);
    sGrad.addColorStop(0, 'rgba(212,175,55,0)');
    sGrad.addColorStop(0.2, 'rgba(212,175,55,0.85)');
    sGrad.addColorStop(0.5, 'rgba(255,222,100,1)');
    sGrad.addColorStop(0.8, 'rgba(212,175,55,0.85)');
    sGrad.addColorStop(1, 'rgba(212,175,55,0)');
    ctx.strokeStyle = sGrad; ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.moveTo(cx, cy - staffH / 2); ctx.lineTo(cx, cy + staffH / 2); ctx.stroke();

    // Staff orb
    const orbR = sR * 0.9;
    const oGrad = ctx.createRadialGradient(cx - orbR * 0.35, cy - orbR * 0.35, 0, cx, cy, orbR);
    oGrad.addColorStop(0, 'rgba(255,242,190,0.98)');
    oGrad.addColorStop(0.5, 'rgba(212,175,55,0.9)');
    oGrad.addColorStop(1, 'rgba(145,105,15,0.92)');
    ctx.fillStyle = oGrad; ctx.shadowColor = '#d4af37';
    ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(cx, cy, orbR, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Spheres
    positions.forEach((p) => {
      const s = SPHERES[p.idx];
      const c = hexToRgb(s.color);
      const isActive = activeIdx === p.idx;
      const isHovered = hIdx === p.idx;
      const isDimmed = activeIdx >= 0 && !isActive;
      const scale = isActive ? (1.38 + Math.sin(st.t * 0.07) * 0.09) : isHovered ? 1.18 : 1;
      const r = sR * scale;

      ctx.save();
      ctx.globalAlpha = isDimmed ? 0.28 : 1;

      if (isActive) {
        const bigG = ctx.createRadialGradient(p.x, p.y, r * 0.3, p.x, p.y, r * 5);
        bigG.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0.55)`);
        bigG.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},0.18)`);
        bigG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bigG; ctx.beginPath(); ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2); ctx.fill();
      }

      const grd = ctx.createRadialGradient(p.x, p.y, r * 0.2, p.x, p.y, r * 3);
      grd.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${isActive ? 0.65 : 0.42})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2); ctx.fill();

      const sbg = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, r * 0.05, p.x, p.y, r);
      sbg.addColorStop(0, `rgba(${Math.min(255,c.r+95)},${Math.min(255,c.g+95)},${Math.min(255,c.b+95)},0.98)`);
      sbg.addColorStop(0.55, `rgba(${c.r},${c.g},${c.b},0.92)`);
      sbg.addColorStop(1, `rgba(${Math.max(0,c.r-65)},${Math.max(0,c.g-65)},${Math.max(0,c.b-65)},0.92)`);
      ctx.fillStyle = sbg;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = isActive ? 32 : isHovered ? 18 : 8;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = `${r * 1.05}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s.icon, p.x, p.y);

      if (isActive || isHovered) {
        ctx.globalAlpha = 1;
        ctx.font = `700 ${Math.max(9, sR * 0.58)}px "Cinzel", serif`;
        ctx.fillStyle = isActive ? s.color : 'rgba(255,220,80,0.95)';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.shadowColor = s.color; ctx.shadowBlur = 8;
        ctx.fillText(s.label.toUpperCase(), p.x, p.y + r + 6);
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    });

    st.raf = requestAnimationFrame(draw);
  }, [getLayout, activeSphere]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    stateRef.current.raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(stateRef.current.raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [draw, handleMouseMove, handleClick]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

// ─── MOBILE TERRITORY PILLS ──────────────────────────────────────────────────────
function MobileTerritory({ activeSphere, onSphereClick }) {
  const scrollRef = useRef(null);
  return (
    <div style={{ position: 'relative', marginBottom: '4px' }}>
      {/* Scroll fade hints */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '24px', background: 'linear-gradient(to right, rgba(2,0,12,1), transparent)', pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '24px', background: 'linear-gradient(to left, rgba(2,0,12,1), transparent)', pointerEvents: 'none', zIndex: 2 }} />
      <div
        ref={scrollRef}
        style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 24px 8px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <style>{`.mobile-terr::-webkit-scrollbar { display: none; }`}</style>
        {/* All territories button */}
        <button
          onClick={() => onSphereClick(null)}
          style={{
            flexShrink: 0, padding: '8px 14px', borderRadius: '20px', whiteSpace: 'nowrap',
            border: `1px solid ${!activeSphere ? 'rgba(212,175,55,0.9)' : 'rgba(255,255,255,0.15)'}`,
            background: !activeSphere ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
            color: !activeSphere ? '#f5c842' : 'rgba(255,255,255,0.65)',
            fontFamily: "'Cinzel', serif", fontSize: '10px', letterSpacing: '1.5px', cursor: 'pointer',
            boxShadow: !activeSphere ? '0 0 14px rgba(212,175,55,0.35)' : 'none',
            transition: 'all 0.2s',
          }}
        >◈ TODOS</button>

        {SPHERES.map(s => {
          const isActive = activeSphere === s.territory;
          const c = hexToRgb(s.color);
          return (
            <button key={s.territory} onClick={() => onSphereClick(s.territory)} style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: '20px', whiteSpace: 'nowrap',
              border: `1px solid ${isActive ? s.color : 'rgba(255,255,255,0.12)'}`,
              background: isActive ? `rgba(${c.r},${c.g},${c.b},0.22)` : 'rgba(255,255,255,0.04)',
              color: isActive ? s.color : 'rgba(220,210,255,0.7)',
              fontFamily: "'Cinzel', serif", fontSize: '10px', letterSpacing: '1px', cursor: 'pointer',
              boxShadow: isActive ? `0 0 14px rgba(${c.r},${c.g},${c.b},0.45)` : 'none',
              transition: 'all 0.22s',
            }}>{s.icon} {s.label}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── TYPE FILTER BAR ─────────────────────────────────────────────────────────────
function TypeFilterBar({ activeType, onTypeClick }) {
  const typeColors = { claves: '#f97316', victorias: '#22c55e', mapas: '#8b5cf6', todos: '#d4af37' };
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(6px,1.5vw,10px)', flexWrap: 'wrap', padding: '0 clamp(8px,3vw,16px)' }}>
      {CONTENT_TYPES.map(t => {
        const isActive = activeType === t.id;
        const col = typeColors[t.id] || '#d4af37';
        const { r, g, b } = hexToRgb(col);
        return (
          <button
            key={t.id}
            onClick={() => onTypeClick(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: 'clamp(8px,1.5vw,12px) clamp(12px,2.5vw,22px)', borderRadius: '100px',
              position: 'relative', overflow: 'hidden',
              background: isActive ? `linear-gradient(135deg, rgba(${r},${g},${b},0.25), rgba(${r},${g},${b},0.1))` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${isActive ? col : 'rgba(255,255,255,0.12)'}`,
              color: isActive ? col : 'rgba(220,215,255,0.65)',
              boxShadow: isActive ? `0 0 28px rgba(${r},${g},${b},0.5), inset 0 1px 0 rgba(255,255,255,0.15)` : 'none',
              textTransform: 'uppercase',
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(9px, 1.5vw, 11px)',
              letterSpacing: '1.5px',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.34,1.1,0.64,1)',
              transform: isActive ? 'scale(1.05)' : 'scale(1)',
              fontWeight: isActive ? '700' : '500',
            }}
          >
            {isActive && (
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)', backgroundSize: '200% auto', animation: 'goldShimmer 2.5s linear infinite' }} />
            )}
            <span style={{ fontSize: '12px', position: 'relative', zIndex: 1 }}>{t.icon}</span>
            <span style={{ position: 'relative', zIndex: 1 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── ARSENAL CARD ─────────────────────────────────────────────────────────────────
function ArsenalCard({ item, onClick, isActivated }) {
  const [hovered, setHovered] = useState(false);
  const c = hexToRgb(item.color);
  const level = LEVEL_CONFIG[item.level] || LEVEL_CONFIG.AVANZADO;
  const typeInfo = CONTENT_TYPES.find(t => t.id === item.type);

  return (
    <div
      className="arsenal-card"
      onClick={() => onClick(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        '--card-color': item.color,
        '--card-color-bg': `rgba(${c.r},${c.g},${c.b},0.18)`,
        position: 'relative', borderRadius: '20px', overflow: 'hidden',
        background: `linear-gradient(158deg, rgba(${c.r},${c.g},${c.b},0.16) 0%, rgba(8,3,28,0.97) 52%, rgba(2,0,14,0.99) 100%)`,
        border: `1px solid rgba(${c.r},${c.g},${c.b},${hovered ? 0.7 : 0.22})`,
        boxShadow: hovered
          ? `0 28px 80px rgba(${c.r},${c.g},${c.b},0.5), 0 0 140px rgba(${c.r},${c.g},${c.b},0.15), inset 0 1px 0 rgba(255,255,255,0.08)`
          : `0 6px 28px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        cursor: 'pointer',
        animation: 'fadeInUp 0.5s ease backwards',
      }}
    >
      {/* Cover */}
      <div style={{
        height: 'clamp(130px,18vw,170px)', position: 'relative', overflow: 'hidden',
        background: `linear-gradient(148deg, rgba(${c.r},${c.g},${c.b},0.42) 0%, rgba(${c.r},${c.g},${c.b},0.14) 48%, rgba(0,0,0,0.72) 100%)`,
      }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 28% 32%, rgba(${c.r},${c.g},${c.b},0.48) 0%, transparent 60%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 78% 72%, rgba(${c.r},${c.g},${c.b},0.25) 0%, transparent 55%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.6) 100%)' }} />

        {/* Grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08 }}>
          {[...Array(7)].map((_,i) => <line key={`h${i}`} x1="0" y1={`${(i+1)*13}%`} x2="100%" y2={`${(i+1)*13}%`} stroke={item.color} strokeWidth="1"/>)}
          {[...Array(8)].map((_,i) => <line key={`v${i}`} x1={`${(i+1)*11}%`} y1="0" x2={`${(i+1)*11}%`} y2="100%" stroke={item.color} strokeWidth="1"/>)}
          <circle cx="50%" cy="50%" r="55" fill="none" stroke={item.color} strokeWidth="1.5"/>
          <circle cx="50%" cy="50%" r="35" fill="none" stroke={item.color} strokeWidth="0.8"/>
        </svg>

        {/* Glow on hover */}
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
            background: `radial-gradient(ellipse at 50% 50%, rgba(${c.r},${c.g},${c.b},0.12) 0%, transparent 70%)`,
          }}/>
        )}

        {/* Icon */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 'clamp(42px,7vw,62px)', lineHeight: 1, zIndex: 2,
          filter: `drop-shadow(0 0 ${hovered ? 50 : 20}px ${item.color}) drop-shadow(0 0 ${hovered ? 90 : 35}px rgba(${c.r},${c.g},${c.b},0.55))`,
          transition: 'filter 0.35s ease',
          animation: 'cardIconFloat 3.5s ease-in-out infinite',
        }}>{!item.image && item.icon}</div>
        {item.image && <img src={item.image} alt={item.title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:3 }}/>}

        {/* Badges */}
        <div style={{
          position: 'absolute', top: '10px', left: '10px', padding: '4px 10px', borderRadius: '10px',
          background: 'rgba(0,0,0,0.72)', border: '1px solid rgba(255,255,255,0.14)',
          fontFamily: "'Cinzel', serif", fontSize: '7.5px', letterSpacing: '1.5px',
          color: 'rgba(255,220,80,0.95)',
        }}>{typeInfo?.icon} {typeInfo?.label}</div>

        {isActivated && (
          <div style={{
            position: 'absolute', top: '10px', right: item.level ? '82px' : '10px',
            padding: '4px 10px', borderRadius: '10px', zIndex: 4,
            background: 'rgba(0,0,0,0.72)', border: '1px solid rgba(74,222,128,0.6)',
            fontFamily: "'Cinzel', serif", fontSize: '7.5px', letterSpacing: '1.5px',
            color: '#4ade80', boxShadow: '0 0 10px rgba(74,222,128,0.4)',
          }}>✓ ACTIVA</div>
        )}

        {item.level && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px', padding: '4px 10px', borderRadius: '10px',
            background: 'rgba(0,0,0,0.72)', border: `1px solid ${level.color}`,
            fontFamily: "'Cinzel', serif", fontSize: '7.5px', letterSpacing: '1px',
            color: level.color, boxShadow: `0 0 12px ${level.glow}`,
          }}>{item.level}</div>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '72px', background: `linear-gradient(to top, rgba(8,3,28,1), transparent)` }} />
      </div>

      {/* Body */}
      <div style={{ padding: '14px 18px 16px' }}>
        <div style={{
          fontFamily: "'Raleway', sans-serif", fontSize: '9.5px', letterSpacing: '2.5px',
          color: `rgba(${c.r},${c.g},${c.b},0.85)`, textTransform: 'uppercase', marginBottom: '4px',
          fontWeight: '600', display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.45',
        }}>{item.subtitle}</div>

        <h3 style={{
          fontFamily: "'Cinzel', serif", fontSize: 'clamp(14px, 2.2vw, 17px)',
          fontWeight: '800', color: '#ffffff', lineHeight: 1.25, marginBottom: '10px',
          textShadow: hovered ? `0 0 22px rgba(${c.r},${c.g},${c.b},0.8), 0 0 44px rgba(${c.r},${c.g},${c.b},0.4)` : `0 0 8px rgba(${c.r},${c.g},${c.b},0.3)`,
          transition: 'text-shadow 0.3s ease',
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{item.title}</h3>

        {/* Impact tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
          {(item.impact.slice(0, 2) || []).map((imp, i) => (
            <div key={i} style={{
              padding: '4px 10px', borderRadius: '10px',
              background: `rgba(${c.r},${c.g},${c.b},0.12)`,
              border: `1px solid rgba(${c.r},${c.g},${c.b},0.35)`,
              fontFamily: "'Raleway', sans-serif", fontSize: '9px',
              color: `rgba(${c.r+30},${c.g+30},${c.b+30},1)`,
              letterSpacing: '0.4px', fontWeight: '600',
            }}>{imp}</div>
          ))}
        </div>

        {/* Territory */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px' }}>{SPHERES.find(s => s.territory === item.territory)?.icon}</span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '8px', letterSpacing: '1.5px', color: `rgba(${c.r},${c.g},${c.b},0.85)`, fontWeight: '700' }}>
            {SPHERES.find(s => s.territory === item.territory)?.label?.toUpperCase()}
          </span>
        </div>

        {/* CTA */}
        <div className="card-cta" style={{
          padding: '9px 16px', borderRadius: '12px', textAlign: 'center',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid rgba(${c.r},${c.g},${c.b},0.18)`,
          fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '2.5px',
          color: 'rgba(255,255,255,0.55)',
          transition: 'all 0.3s ease',
          boxShadow: hovered ? `0 0 20px rgba(${c.r},${c.g},${c.b},0.35)` : 'none',
        }}>
          ⚡ ABRIR HERRAMIENTA
        </div>
      </div>

      <EnergyBorder color={item.color} speed={2.8} />
    </div>
  );
}

// ─── MODULE INTRO OVERLAY ──────────────────────────────────────────────────────────
function ModuleIntroView({ item, onClose, onActivate, alreadyActivated }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [activated, setActivated] = useState(alreadyActivated || false);
  const c = hexToRgb(item.color);
  const level = LEVEL_CONFIG[item.level] || LEVEL_CONFIG.AVANZADO;
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 380);
  };

  const handleActivate = () => {
    if (onActivate) onActivate(item);
    setActivated(true);
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1500,
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? '0' : 'clamp(10px,2vw,24px)',
        background: `rgba(1,0,10,${visible ? 0.97 : 0})`,
        backdropFilter: `blur(${visible ? 12 : 0}px)`,
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="intro-scroll"
        style={{
          maxWidth: isMobile ? '100%' : 'clamp(300px,92vw,800px)',
          width: '100%',
          maxHeight: isMobile ? '94dvh' : '96dvh',
          borderRadius: isMobile ? '28px 28px 0 0' : '28px',
          overflowY: 'auto',
          background: `linear-gradient(172deg, rgba(8,3,28,0.99) 0%, rgba(3,1,16,0.99) 100%)`,
          border: `1px solid rgba(${c.r},${c.g},${c.b},0.45)`,
          boxShadow: `0 0 130px rgba(${c.r},${c.g},${c.b},0.45), 0 0 260px rgba(${c.r},${c.g},${c.b},0.15), inset 0 1px 0 rgba(255,255,255,0.07)`,
          animation: visible ? `introSlideUp 0.48s cubic-bezier(0.34,1.1,0.64,1) forwards` : 'none',
          opacity: visible ? 1 : 0,
          position: 'relative',
        }}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: `rgba(${c.r},${c.g},${c.b},0.4)` }} />
          </div>
        )}

        {/* Cover */}
        <div style={{
          position: 'relative',
          height: isMobile ? '240px' : 'clamp(220px, 32vw, 310px)',
          overflow: 'hidden',
          background: `linear-gradient(148deg, rgba(${c.r},${c.g},${c.b},0.55) 0%, rgba(${c.r},${c.g},${c.b},0.2) 42%, rgba(0,0,0,0.88) 100%)`,
          borderRadius: isMobile ? '24px 24px 0 0' : '28px 28px 0 0',
        }}>
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 22% 28%, rgba(${c.r},${c.g},${c.b},0.65) 0%, transparent 52%)` }}/>
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 82% 78%, rgba(${c.r},${c.g},${c.b},0.38) 0%, transparent 48%)` }}/>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 55%, transparent 25%, rgba(0,0,0,0.7) 100%)' }}/>

          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.09 }}>
            {[...Array(10)].map((_,i)=><line key={`h${i}`} x1="0" y1={`${(i+1)*9.1}%`} x2="100%" y2={`${(i+1)*9.1}%`} stroke={item.color} strokeWidth="1"/>)}
            {[...Array(12)].map((_,i)=><line key={`v${i}`} x1={`${(i+1)*7.7}%`} y1="0" x2={`${(i+1)*7.7}%`} y2="100%" stroke={item.color} strokeWidth="1"/>)}
            <circle cx="50%" cy="50%" r="90" fill="none" stroke={item.color} strokeWidth="1.8"/>
            <circle cx="50%" cy="50%" r="60" fill="none" stroke={item.color} strokeWidth="1.2"/>
          </svg>

          {[1.9, 2.7, 3.5].map((scale, i) => (
            <div key={i} style={{
              position:'absolute', left:'50%', top:'50%',
              width:'80px', height:'80px', marginLeft:'-40px', marginTop:'-40px',
              borderRadius:'50%', border:`1px solid rgba(${c.r},${c.g},${c.b},${0.42-i*0.11})`,
              transform:`scale(${scale})`,
              animation:`cardPulseRing ${2.5+i*0.7}s ease-in-out infinite`,
              animationDelay:`${i*0.5}s`,
            }}/>
          ))}

          {item.image
            ? <img src={item.image} alt={item.title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:2 }}/>
            : <div style={{
                position:'absolute', left:'50%', top:'46%', transform:'translate(-50%,-50%)',
                fontSize: isMobile ? '80px' : '100px', lineHeight:1, zIndex:2,
                filter:`drop-shadow(0 0 55px ${item.color}) drop-shadow(0 0 110px rgba(${c.r},${c.g},${c.b},0.65))`,
                animation:'heroFloat 4.5s ease-in-out infinite',
              }}>{item.icon}</div>
          }

          {/* Top badges */}
          <div style={{ position:'absolute', top:'14px', left:'16px', display:'flex', gap:'8px' }}>
            <div style={{ padding:'5px 12px', borderRadius:'12px', background:'rgba(0,0,0,0.72)', border:'1px solid rgba(255,215,60,0.4)', fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'2px', color:'rgba(255,215,60,0.95)' }}>
              {CONTENT_TYPES.find(t=>t.id===item.type)?.icon} {CONTENT_TYPES.find(t=>t.id===item.type)?.label}
            </div>
            {item.level && (
              <div style={{ padding:'5px 12px', borderRadius:'12px', background:'rgba(0,0,0,0.72)', border:`1px solid ${level.color}`, fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'2px', color:level.color, boxShadow:`0 0 16px ${level.glow}` }}>
                {item.level}
              </div>
            )}
          </div>

          {/* Close */}
          <button onClick={handleClose} style={{
            position:'absolute', top:'12px', right:'12px',
            width:'38px', height:'38px', borderRadius:'50%',
            background:'rgba(0,0,0,0.7)', border:`1px solid rgba(${c.r},${c.g},${c.b},0.4)`,
            color:'rgba(255,255,255,0.85)', fontSize:'15px', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:10,
            transition:'all 0.2s', fontFamily:'sans-serif',
          }}>✕</button>

          {/* Title block */}
          <div style={{ position:'absolute', bottom:'22px', left:'24px', right:'60px' }}>
            <div style={{ fontFamily:"'Raleway', sans-serif", fontSize:'10px', letterSpacing:'3.5px', textTransform:'uppercase', color:`rgba(${c.r},${c.g},${c.b},0.9)`, marginBottom:'8px', fontWeight:'600' }}>
              {item.subtitle}
            </div>
            <h2 style={{
              fontFamily:"'Cinzel', serif",
              fontSize: isMobile ? 'clamp(22px, 7vw, 30px)' : 'clamp(26px, 5vw, 38px)',
              fontWeight:'900', letterSpacing:'0.06em', lineHeight:1.1, color:'#ffffff',
              textShadow:`0 0 28px ${item.color}, 0 0 60px rgba(${c.r},${c.g},${c.b},0.6)`,
            }}>{item.title}</h2>
          </div>

          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'130px', background:`linear-gradient(to top, rgba(8,3,28,1), transparent)` }}/>
        </div>

        {/* Body */}
        <div style={{ padding: isMobile ? '16px 16px 0' : '18px 28px 0' }}>

          {/* Description + meta */}
          <div style={{ display:'flex', gap:'12px', alignItems:'flex-start', marginBottom:'16px', flexDirection: isMobile ? 'column' : 'row' }}>
            <p style={{
              flex:1, fontFamily:"'Raleway', sans-serif",
              fontSize: item.description.length < 80 ? '15px' : '13px',
              lineHeight:1.75, color:'rgba(225,215,255,0.95)', fontWeight:'300',
              borderLeft:`3px solid rgba(${c.r},${c.g},${c.b},0.6)`, paddingLeft:'16px', fontStyle:'italic',
              textShadow:`0 0 12px rgba(${c.r},${c.g},${c.b},0.25)`,
            }}>{item.description}</p>

            <div style={{ display:'flex', flexDirection: isMobile ? 'row' : 'column', gap:'8px', flexShrink:0 }}>
              {[
                { label:'TERRITORIO', value: SPHERES.find(s=>s.territory===item.territory)?.label },
                item.level && { label:'NIVEL', value: item.level },
                item.duration && { label:'DURACIÓN', value: item.duration },
              ].filter(Boolean).map((meta, i) => (
                <div key={i} style={{
                  padding:'6px 12px', borderRadius:'10px',
                  background:`rgba(${c.r},${c.g},${c.b},0.14)`,
                  border:`1px solid rgba(${c.r},${c.g},${c.b},0.38)`,
                  minWidth: isMobile ? '0' : '100px',
                }}>
                  <div style={{ fontFamily:"'Raleway', sans-serif", fontSize:'7px', letterSpacing:'2.5px', fontWeight:'700', color:'rgba(255,215,60,0.95)', marginBottom:'3px' }}>
                    {meta.label}
                  </div>
                  <div style={{ fontFamily:"'Raleway', sans-serif", fontSize:'12px', color:item.color, fontWeight:'700', textShadow:`0 0 12px rgba(${c.r},${c.g},${c.b},0.7)` }}>
                    {meta.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Impact section divider */}
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
            <div style={{ flex:1, height:'1px', background:`linear-gradient(to right, transparent, rgba(${c.r},${c.g},${c.b},0.55))` }}/>
            <div style={{
              fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'4px', textTransform:'uppercase',
              padding:'6px 18px', borderRadius:'20px',
              background:`linear-gradient(135deg, rgba(${c.r},${c.g},${c.b},0.28), rgba(${c.r},${c.g},${c.b},0.1))`,
              border:`1px solid rgba(${c.r},${c.g},${c.b},0.55)`,
              color:'#ffffff', textShadow:`0 0 12px rgba(${c.r},${c.g},${c.b},1), 0 0 24px rgba(${c.r},${c.g},${c.b},0.8)`,
              boxShadow:`0 0 20px rgba(${c.r},${c.g},${c.b},0.35)`,
            }}>◈ IMPACTO PRINCIPAL</div>
            <div style={{ flex:1, height:'1px', background:`linear-gradient(to left, transparent, rgba(${c.r},${c.g},${c.b},0.55))` }}/>
          </div>

          {/* Impact panels */}
          <div style={{
            display:'grid',
            gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fit, minmax(160px, 1fr))',
            gap:'12px', marginBottom:'24px',
          }}>
            {item.impact.map((imp, i) => (
              <div key={i} style={{
                padding:'18px 16px', borderRadius:'16px',
                background:`linear-gradient(148deg, rgba(${c.r},${c.g},${c.b},0.2), rgba(${c.r},${c.g},${c.b},0.06))`,
                border:`1px solid rgba(${c.r},${c.g},${c.b},0.45)`,
                boxShadow:`0 4px 24px rgba(${c.r},${c.g},${c.b},0.15), inset 0 1px 0 rgba(255,255,255,0.07)`,
                animation:`panelReveal 0.45s ease forwards`, animationDelay:`${0.15+i*0.1}s`, opacity:0,
              }}>
                <div style={{
                  width:'38px', height:'38px', borderRadius:'50%',
                  background:`rgba(${c.r},${c.g},${c.b},0.22)`,
                  border:`1px solid rgba(${c.r},${c.g},${c.b},0.55)`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'20px', marginBottom:'12px',
                  boxShadow:`0 0 18px rgba(${c.r},${c.g},${c.b},0.55), 0 0 36px rgba(${c.r},${c.g},${c.b},0.25)`,
                }}>{item.icon}</div>
                <div style={{
                  fontFamily:"'Raleway', sans-serif", fontSize:'13px',
                  color:'rgba(240,232,255,0.98)', fontWeight:'500', lineHeight:1.6,
                }}>{imp}</div>
              </div>
            ))}
          </div>

          {/* Transformation block */}
          {item.transformation && (
            <div style={{
              position:'relative', padding:'22px 24px', borderRadius:'18px', marginBottom:'24px',
              background:`linear-gradient(132deg, rgba(${c.r},${c.g},${c.b},0.16), rgba(${c.r},${c.g},${c.b},0.05))`,
              border:`1px solid rgba(${c.r},${c.g},${c.b},0.32)`,
              borderLeft:`3px solid ${item.color}`,
              overflow:'hidden',
            }}>
              <div style={{ position:'absolute', right:'18px', top:'50%', transform:'translateY(-50%)', fontSize:'82px', opacity:0.07, pointerEvents:'none', lineHeight:1 }}>{item.icon}</div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                <div style={{ flex:1, height:'1px', background:`linear-gradient(to right, transparent, rgba(${c.r},${c.g},${c.b},0.45))`}}/>
                <div style={{ fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'4px', textTransform:'uppercase', padding:'5px 16px', borderRadius:'4px', background:`rgba(${c.r},${c.g},${c.b},0.12)`, border:`1px solid rgba(${c.r},${c.g},${c.b},0.4)`, borderLeft:`3px solid ${item.color}`, color:'#ffffff', textShadow:`0 0 12px rgba(${c.r},${c.g},${c.b},1)` }}>
                  ✦ TRANSFORMACIÓN
                </div>
                <div style={{ flex:1, height:'1px', background:`linear-gradient(to left, transparent, rgba(${c.r},${c.g},${c.b},0.45))`}}/>
              </div>
              <p style={{
                fontFamily:"'Raleway', sans-serif", fontSize:'13px', lineHeight:1.78,
                color:'rgba(225,215,255,0.95)', fontWeight:'300', margin:0,
                borderLeft:`2px solid rgba(${c.r},${c.g},${c.b},0.5)`, paddingLeft:'16px', fontStyle:'italic',
                textShadow:`0 0 10px rgba(${c.r},${c.g},${c.b},0.25)`,
              }}>{item.transformation}</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ padding: isMobile ? '0 16px 28px' : '0 28px 32px' }}>
          {!activated ? (
            <button
              onClick={handleActivate}
              style={{
                '--cta-glow': `rgba(${c.r},${c.g},${c.b},0.65)`,
                '--cta-glow2': `rgba(${c.r},${c.g},${c.b},0.35)`,
                width:'100%', padding: isMobile ? '18px 24px' : '22px 32px', borderRadius:'18px',
                background:`linear-gradient(138deg, rgba(${c.r},${c.g},${c.b},0.88) 0%, rgba(${c.r},${c.g},${c.b},0.58) 50%, rgba(${Math.max(0,c.r-45)},${Math.max(0,c.g-45)},${Math.max(0,c.b-45)},0.82) 100%)`,
                border:`2px solid ${item.color}`,
                color:'#fff', cursor:'pointer',
                fontFamily:"'Cinzel', serif",
                fontSize: isMobile ? 'clamp(12px,3.5vw,16px)' : 'clamp(13px,2.5vw,18px)',
                letterSpacing:'3.5px', textTransform:'uppercase', fontWeight:'800',
                animation:'ctaBreath 2.2s ease-in-out infinite',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'14px',
                textShadow:'0 0 24px rgba(255,255,255,0.7)',
                position:'relative', overflow:'hidden',
                transition:'transform 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
            >
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)', backgroundSize:'200% auto', animation:'goldShimmer 2.5s linear infinite' }}/>
              <span style={{ fontSize:'22px', filter:`drop-shadow(0 0 12px ${item.color})`, position:'relative', zIndex:1 }}>⚡</span>
              <span style={{ position:'relative', zIndex:1 }}>ACTIVAR HERRAMIENTA</span>
              <span style={{ fontSize:'22px', filter:`drop-shadow(0 0 12px ${item.color})`, position:'relative', zIndex:1 }}>⚡</span>
            </button>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div style={{
                textAlign:'center', padding:'14px', background:'rgba(74,222,128,0.12)',
                border:'1px solid rgba(74,222,128,0.5)', borderRadius:'12px',
                fontFamily:"'Cinzel', serif", fontSize:'12px', letterSpacing:'2px', color:'#4ade80',
                boxShadow:'0 0 20px rgba(74,222,128,0.25)',
              }}>✅ HERRAMIENTA ACTIVADA</div>
              {item.slug && (
                <button
                  onClick={() => { onClose(); navigate(`/tool/${item.slug}`); }}
                  style={{
                    width:'100%', padding: isMobile ? '18px 24px' : '22px 32px', borderRadius:'18px',
                    background:`linear-gradient(138deg, rgba(${c.r},${c.g},${c.b},0.88), rgba(${c.r},${c.g},${c.b},0.58))`,
                    border:`2px solid ${item.color}`, color:'#fff', cursor:'pointer',
                    fontFamily:"'Cinzel', serif", fontSize:'clamp(12px,2.5vw,18px)',
                    letterSpacing:'3.5px', textTransform:'uppercase', fontWeight:'800',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'14px',
                    textShadow:'0 0 24px rgba(255,255,255,0.7)', transition:'transform 0.2s ease',
                  }}
                  onMouseEnter={e=>e.currentTarget.style.transform='scale(1.02)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
                >
                  <span style={{fontSize:'22px'}}>🔓</span>
                  IR A VER HERRAMIENTA
                  <span style={{fontSize:'22px'}}>→</span>
                </button>
              )}
            </div>
          )}

          <p style={{
            textAlign:'center', marginTop:'12px',
            fontFamily:"'Raleway', sans-serif", fontSize:'10px', letterSpacing:'2px',
            color:'rgba(210,200,255,0.45)',
          }}>Herramienta desbloqueada · Acceso ilimitado</p>
        </div>

        <EnergyBorder color={item.color} speed={2.5} width={2}/>
      </div>
    </div>
  );
}

// ─── MAIN LIBRARY PAGE ────────────────────────────────────────────────────────────
export default function LibraryPage({ onActivateModule }) {
  const { user, profile } = useAuthStore();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const [activeType, setActiveType] = useState('todos');
  const [activeSphere, setActiveSphere] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [crashError, setCrashError] = useState(null);
  const [activatedIds, setActivatedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('activated_tools') || '[]')); }
    catch { return new Set(); }
  });

  const loadLibrary = useCallback(async () => {
    try {
      if (!user || !profile) { setLoading(false); return; }
      const orders = await storeService.getUserOrders(user.id);
      const productIds = [];
      orders.forEach(o => {
        try {
          const parsed = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
          (parsed || []).forEach(i => productIds.push(i.product_id));
        } catch(e) { console.log('❌ parse error', e, o); }
      });

      const cleanIds = [...new Set(productIds.filter(Boolean))];
      if (!cleanIds.length) { setLoading(false); return; }

      const { data: products } = await supabase.from('products').select('*').in('id', cleanIds);

      const mapped = (products || []).map(p => ({
        id: p.id, slug: p.slug, title: p.name,
        subtitle: p.metadata?.subtitle || p.description || '',
        type: p.category,
        territory: p.metadata?.territory || 'mente',
        color: p.metadata?.color || '#8b5cf6',
        icon: SPHERES.find(s => s.territory === (p.metadata?.territory || 'mente'))?.icon || '🧠',
        level: p.rarity?.toUpperCase() || 'AVANZADO',
        description: p.description || '',
        impact: p.metadata?.objectives || [],
        transformation: p.metadata?.transformation || '',
        unlocks: p.metadata?.unlocks || '',
        duration: p.metadata?.duration || '',
        sessions: p.metadata?.sessions || '',
        content_url: p.content_url || null,
        image: p.asset_url || null,
      }));

      setItems(mapped);
    } catch (err) {
      console.error('Error cargando library:', err);
      setCrashError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => { loadLibrary(); }, [loadLibrary]);
  useEffect(() => {
    window.addEventListener('focus', loadLibrary);
    return () => window.removeEventListener('focus', loadLibrary);
  }, [loadLibrary]);

  const filteredItems = items.filter(item => {
    const typeMatch = activeType === 'todos' || item.type === activeType;
    const sphereMatch = !activeSphere || item.territory === activeSphere;
    return typeMatch && sphereMatch;
  });

  const handleSphereClick = (territory) => {
    setActiveSphere(prev => (territory === null || prev === territory) ? null : territory);
  };

  const handleActivate = (item) => {
    setActivatedIds(prev => {
      const next = new Set(prev);
      next.add(item.id);
      localStorage.setItem('activated_tools', JSON.stringify([...next]));
      return next;
    });
    if (onActivateModule) onActivateModule(item);
  };

  // Grid columns based on breakpoint
  const gridCols = isMobile
    ? '1fr'
    : isTablet
      ? 'repeat(2, 1fr)'
      : 'repeat(3, 1fr)';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(14,6,38,1) 0%, rgba(3,0,15,1) 55%)',
      color: '#fff',
      fontFamily: "'Raleway', sans-serif",
      overflowX: 'hidden', position: 'relative',
    }}>
      <style>{GLOBAL_STYLES}</style>

      <ParticleField />

      {crashError && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:9999, background:'#dc2626', color:'white', padding:'12px 16px', fontSize:'12px', wordBreak:'break-all' }}>
          {crashError}
        </div>
      )}

      {/* Floating rune characters */}
      {['⚔','◈','∞','⬡','✦','⚡','◆','⊕'].map((r, i) => (
        <div key={i} style={{
          position:'fixed', left:`${7+i*12}%`, top:`${12+(i%3)*26}%`,
          fontFamily:"'Cinzel', serif", fontSize:'clamp(16px, 2.8vw, 30px)',
          color:'rgba(212,175,55,0.05)', pointerEvents:'none', zIndex:0,
          opacity: 0.6 + (i % 3) * 0.13,
        }}>{r}</div>
      ))}

      <div style={{ position:'relative', zIndex:10, maxWidth:'1380px', margin:'0 auto', padding:`0 clamp(12px,4vw,40px) clamp(80px,12vh,120px)` }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign:'center', paddingTop:'clamp(32px,7vh,72px)', paddingBottom:'clamp(12px,2.5vh,24px)' }}>

          {/* Eyebrow */}
          <div style={{
            fontFamily:"'Cinzel', serif", fontSize: isMobile ? '8px' : '9.5px', letterSpacing: isMobile ? '4px' : '7px',
            color:'rgba(255,215,60,0.7)', textTransform:'uppercase', marginBottom:'18px',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'16px',
          }}>
            <div style={{ width:'clamp(24px,5vw,50px)', height:'1px', background:'linear-gradient(to right, transparent, rgba(212,175,55,0.6))' }}/>
            BIBLIOTECA SAGRADA DEL TEMPLO
            <div style={{ width:'clamp(24px,5vw,50px)', height:'1px', background:'linear-gradient(to left, transparent, rgba(212,175,55,0.6))' }}/>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily:"'Cinzel', serif",
            fontSize:'clamp(44px, 11vw, 100px)',
            fontWeight:'900', lineHeight:1, letterSpacing:'0.12em',
            background:'linear-gradient(138deg, #f5d060 0%, #d4af37 28%, #fff8dc 50%, #d4af37 72%, #b8860b 100%)',
            backgroundSize:'220% auto',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            animation:'goldShimmer 6s linear infinite',
            marginBottom:'16px',
          }}>MI ARSENAL</h1>

          {/* Subtitle */}
          <p style={{
            fontFamily:"'Raleway', sans-serif", fontSize: isMobile ? '13px' : '15px',
            color:'rgba(220,210,255,0.85)', letterSpacing:'1.5px', marginBottom:'24px',
            fontWeight:'400', maxWidth:'480px', margin:'0 auto 28px',
          }}>Herramientas de alto rendimiento para dominar cada territorio de tu vida</p>

          {/* Stats */}
          <div style={{ display:'flex', justifyContent:'center', gap:'clamp(10px,2.5vw,20px)', flexWrap:'wrap' }}>
            {[
              { value: items.length, label:'Herramientas', icon:'🛠️', color:'#f5c842', glow:'rgba(245,200,66,0.6)' },
              { value: [...new Set(items.map(i=>i.territory))].length, label:'Territorios', icon:'🗺️', color:'#c084fc', glow:'rgba(192,132,252,0.6)' },
            ].map((stat, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:'12px',
                padding:'clamp(10px,2vw,15px) clamp(14px,3vw,28px)',
                background:'rgba(255,255,255,0.04)',
                border:`1px solid ${stat.color}44`,
                borderRadius:'16px',
                boxShadow:`0 0 24px ${stat.glow}22, inset 0 1px 0 rgba(255,255,255,0.06)`,
              }}>
                <span style={{ fontSize:'clamp(22px,4vw,28px)', filter:`drop-shadow(0 0 10px ${stat.color})` }}>{stat.icon}</span>
                <div style={{ textAlign:'left' }}>
                  <div style={{
                    fontFamily:"'Cinzel', serif", fontSize:'clamp(22px,5vw,36px)', fontWeight:'900',
                    color:stat.color, lineHeight:1,
                    textShadow:`0 0 28px ${stat.glow}, 0 0 56px ${stat.glow}`,
                  }}>{stat.value}</div>
                  <div style={{ fontFamily:"'Cinzel', serif", fontSize:'clamp(8px,1.5vw,10px)', letterSpacing:'3px', color:`${stat.color}cc`, textTransform:'uppercase', marginTop:'3px' }}>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TERRITORY FILTER ── */}
        {!isTablet ? (
          <div style={{ position:'relative', height:'clamp(110px,16vw,180px)', marginBottom:'8px' }}>
            <StaffAltarCanvas activeSphere={activeSphere} onSphereClick={handleSphereClick}/>
            {activeSphere && (
              <button
                onClick={() => setActiveSphere(null)}
                style={{
                  position:'absolute', bottom:'-4px', left:'50%', transform:'translateX(-50%)',
                  padding:'6px 18px', borderRadius:'90px',
                  background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.4)',
                  color:'rgba(255,215,60,0.85)', fontFamily:"'Cinzel', serif",
                  fontSize:'9px', letterSpacing:'2px', cursor:'pointer', transition:'all 0.2s',
                  whiteSpace:'nowrap',
                }}
              >✕ VER TODOS LOS TERRITORIOS</button>
            )}
          </div>
        ) : (
          <MobileTerritory activeSphere={activeSphere} onSphereClick={handleSphereClick}/>
        )}

        {/* ── TYPE FILTER ── */}
        <div style={{ marginTop: isTablet ? '8px' : '16px', marginBottom:'clamp(20px,3vh,36px)' }}>
          <TypeFilterBar activeType={activeType} onTypeClick={setActiveType}/>
        </div>

        {/* ── ACTIVE FILTER INDICATOR ── */}
        {(activeSphere || activeType !== 'todos') && (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            gap:'8px', marginBottom:'20px',
            fontFamily:"'Cinzel', serif", fontSize:'9.5px', letterSpacing:'2px',
            color:'rgba(255,215,60,0.7)',
          }}>
            <span>◈</span>
            <span>
              Mostrando {filteredItems.length} herramienta{filteredItems.length!==1?'s':''}
              {activeSphere ? ` · ${SPHERES.find(s=>s.territory===activeSphere)?.label}` : ''}
              {activeType!=='todos' ? ` · ${CONTENT_TYPES.find(t=>t.id===activeType)?.label}` : ''}
            </span>
            <span>◈</span>
          </div>
        )}

        {/* ── GRID ── */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <div style={{ fontSize:'36px', marginBottom:'16px', animation:'heroFloat 2s ease-in-out infinite' }}>⚔</div>
            <div style={{ fontFamily:"'Cinzel', serif", fontSize:'11px', letterSpacing:'4px', color:'rgba(255,215,60,0.5)' }}>CARGANDO ARSENAL…</div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div style={{
            display:'grid',
            gridTemplateColumns: gridCols,
            gap:'clamp(14px,2.5vw,24px)',
            padding:'4px 2px 8px',
          }}>
            {filteredItems.map((item, idx) => (
              <div key={item.id} style={{ animationDelay:`${idx * 0.07}s` }}>
                <ArsenalCard item={item} onClick={setSelectedItem} isActivated={activatedIds.has(item.id)}/>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'90px 20px' }}>
            <div style={{ fontSize:'44px', marginBottom:'20px', opacity:0.25 }}>◈</div>
            <div style={{ fontFamily:"'Cinzel', serif", fontSize:'12px', letterSpacing:'3px', color:'rgba(255,215,60,0.35)' }}>
              No hay herramientas en este filtro.
            </div>
            <button
              onClick={() => { setActiveType('todos'); setActiveSphere(null); }}
              style={{
                marginTop:'20px', padding:'10px 24px', borderRadius:'20px',
                background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.35)',
                color:'rgba(255,215,60,0.8)', fontFamily:"'Cinzel', serif", fontSize:'10px',
                letterSpacing:'2px', cursor:'pointer',
              }}
            >VER TODAS LAS HERRAMIENTAS</button>
          </div>
        )}
      </div>

      {/* ── OVERLAY ── */}
      {selectedItem && (
        <ModuleIntroView
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onActivate={handleActivate}
          alreadyActivated={activatedIds.has(selectedItem.id)}
        />
      )}
    </div>
  );
}