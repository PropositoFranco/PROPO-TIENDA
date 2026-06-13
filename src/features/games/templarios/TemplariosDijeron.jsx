import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';        // ← necesario
import { useAuthStore } from '../../../store/useAuthStore';
import { usePlayerStore } from '../../../store/usePlayerStore';
import { supabase } from '../../../services/supabase';
import maestroImg from '../../../assets/maestro_templario.png';

// ═══════════════════════════════════════════════════════════════
// VARIABLES GLOBALES DEL JUEGO (igual que en el HTML)
// ═══════════════════════════════════════════════════════════════
let sb = null;
let CURRENT_USER = null;
let _rankChannel = null;
function initRankChannel() {
  if (!sb || _rankChannel) return;
  _rankChannel = sb.channel('ranking_live');
  _rankChannel.subscribe();
}
let CURRENT_PROFILE = null;
let lastLBSnap = [];
let _heroRAFs = {};
let MILESTONE_CONFIG = { every_n_levels: 5, xp_reward: 200, coins_reward: 500, is_active: true };

async function loadMilestoneConfig() {
  if (!sb) return;
  try {
    const { data } = await sb
      .from('milestone_prizes')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (data) MILESTONE_CONFIG = data;
  } catch(e) { /* usa defaults */ }
}

// Objeto G del juego (estado global)
const G = {
  name: '', email: '', pts: 0, xp: 0, level: 1, rank: 0, streak: 0, maxStreak: 0,
  combo: 1, correct: 0, av: 0, done: { c1: false, c2: false, c3: false, council: false },
  ans: { c1: false, c2: false, c3: false, council: false },
  dailyAttempts: {}, timer: null, timeLeft: 0, currentKey: null,
  lbPrev: [], lbNow: [], mapPoll: null, livePoll: null, podPoll: null,
  gender: 'm', charVariant: 0
};

const PLAYER_RANKS = [
  { rank: 0, label: 'Sin Rango',        emoji: '⚫', color: '#8A7A60' },
  { rank: 1, label: 'PropoPrincipante', emoji: '⚔️', color: '#CD7F32' },
  { rank: 2, label: 'PropoGuardián',    emoji: '🛡️', color: '#A8A8A8' },
  { rank: 3, label: 'PropoGuerrero',    emoji: '🔥', color: '#F4C542' },
  { rank: 4, label: 'PropoEjecutor',    emoji: '💀', color: '#9B4FDE' },
  { rank: 5, label: 'PropoTemplario',   emoji: '👑', color: '#00D4AA' },
  { rank: 6, label: 'PropoLeyenda',     emoji: '⭐', color: '#FF4757' },
];

function getXpMax() {
  // Cada rango pide más XP por nivel
  const base = [500, 600, 750, 900, 1100, 1300, 1500];
  return base[Math.min(G.rank, 6)];
}

function getRankInfo(rank) {
  return PLAYER_RANKS[Math.min(rank, 6)] || PLAYER_RANKS[0];
}
function normalizeLevelRank() {
  while (G.level > 20) {
    G.level -= 20;
    if (G.rank < 6) G.rank++;
  }
  if (G.level < 1) G.level = 1;
}
const AV = ['av0', 'av1', 'av2', 'av3', 'av4', 'av5', 'av6', 'av7', 'av8', 'av9'];

// ═══════════════════════════════════════════════════════════════
// BANCO DE PREGUNTAS (exactamente igual)
// ═══════════════════════════════════════════════════════════════
const QB = {
  c1: [
    { q: 'Una persona trabaja constantemente y cambia de objetivo cada mes. Nunca avanza realmente. ¿Qué principio no ha dominado?', opts: ['Claridad de visión', 'Disciplina diaria', 'Influencia externa', 'Motivación'], ok: 0, wis: 'Cuando la visión es débil, la acción se dispersa.' },
    { q: 'Alguien tiene múltiples metas a la vez y no completa ninguna. ¿Cuál es su error fundamental?', opts: ['Falta de tiempo', 'Ausencia de claridad de propósito', 'Poco esfuerzo', 'Mala suerte'], ok: 1, wis: 'Un templario con un solo propósito claro supera a diez con intenciones dispersas.' },
    { q: 'Dos personas trabajan igual de duro. Una sabe exactamente qué quiere. La otra no. ¿Quién llegará primero?', opts: ['La que trabaja más horas', 'La que tiene más recursos', 'La que tiene claridad', 'Depende del entorno'], ok: 2, wis: 'La claridad convierte el esfuerzo en avance.' },
    { q: 'Un guerrero lleva años entrenando pero nunca sabe para qué batalla. ¿Qué le falta?', opts: ['Más entrenamiento', 'Un mentor', 'Un propósito claro', 'Mayor fuerza física'], ok: 2, wis: 'El entrenamiento sin propósito es ruido.' },
    { q: 'Alguien cambia de carrera tres veces en dos años buscando "algo mejor". ¿Cuál es el patrón que revela?', opts: ['Curiosidad natural', 'Ambición excesiva', 'Falta de claridad interna', 'Mala suerte laboral'], ok: 2, wis: 'La búsqueda constante muchas veces enmascara la incapacidad de definir qué se quiere.' }
  ],
  c2: [
    { q: 'Un líder reacciona emocionalmente cada vez que algo sale mal. ¿Qué principio debe dominar primero?', opts: ['Control emocional', 'Disciplina', 'Motivación externa', 'Presión del entorno'], ok: 0, wis: 'Un líder sin dominio emocional no puede guiar.' },
    { q: 'Alguien toma decisiones importantes cuando está enojado. ¿Cuál es el riesgo principal?', opts: ['Que las decisiones sean lentas', 'Que las decisiones estén distorsionadas', 'Que parezca débil', 'Que pierda credibilidad'], ok: 1, wis: 'La ira es consejera mentirosa.' },
    { q: 'Una persona exitosa colapsa ante el primer fracaso serio. ¿Qué capacidad le faltó desarrollar?', opts: ['Más habilidades técnicas', 'Resiliencia y dominio interior', 'Mejor red de contactos', 'Mayor velocidad'], ok: 1, wis: 'El éxito sin resiliencia es castillo de arena.' }
  ],
  c3: [
    { q: 'Una persona espera motivación. Otra actúa aunque no tenga ganas. ¿Cuál avanzará más en el tiempo?', opts: ['La que espera motivación', 'La que actúa con disciplina', 'Depende del objetivo', 'La más inteligente'], ok: 1, wis: 'La motivación es invitada. La disciplina es residente.' },
    { q: 'Un estratega analiza demasiado y nunca ejecuta. Un ejecutor actúa sin pensar. ¿Cuál es el camino correcto?', opts: ['El análisis puro', 'La acción pura', 'Pensar estratégicamente y actuar con disciplina', 'Esperar el momento perfecto'], ok: 2, wis: 'Ni análisis sin acción ni acción sin estrategia.' }
  ],
  council: [
    { q: '¿Qué domina verdaderamente la acción constante a lo largo del tiempo?', opts: ['Inspiración', 'Motivación', 'Disciplina', 'Presión externa'], ok: 2, wis: 'La disciplina transforma la acción en hábito.' },
    { q: 'Un templario de élite ha dominado claridad, dominio interior y estrategia. ¿Qué los une en un solo principio?', opts: ['La ambición sin límite', 'La disciplina diaria sin excusas', 'La búsqueda de validación', 'La velocidad de ejecución'], ok: 1, wis: 'Tres pilares, una sola base: la disciplina.' }
  ]
};

const QB_LAST = { c1: -1, c2: -1, c3: -1, council: -1 };
const QS = { c1: null, c2: null, c3: null, council: null };
const OPC = ['opt-a', 'opt-b', 'opt-c', 'opt-d'];
const OLET = ['A', 'B', 'C', 'D'];

// ═══════════════════════════════════════════════════════════════
// CHAR_VARIANTS (igual al HTML)
// ═══════════════════════════════════════════════════════════════
const CHAR_VARIANTS = {
  m: [
    { name: 'Templario de Luz', sub: 'Espada · Armadura Dorada', weapon: 'sword', armor: '#2C2210', accent: '#C9A84C', skin: '#D4956A', cape: '#1A0E06', plume: '#E8C97A', hair: null, weaponName: 'Espada' },
    { name: 'Templario de las Sombras', sub: 'Hacha · Armadura de Hierro', weapon: 'axe', armor: '#1A1828', accent: '#6688CC', skin: '#C8856A', cape: '#0C0A1A', plume: '#8899DD', hair: null, weaponName: 'Hacha' },
    { name: 'Templario de Fuego', sub: 'Lanza · Armadura Carmesí', weapon: 'lance', armor: '#2C0E08', accent: '#CC4422', skin: '#D4956A', cape: '#1A0600', plume: '#FF6644', hair: null, weaponName: 'Lanza' }
  ],
  f: [
    { name: 'Templaria Sagrada', sub: 'Bastón · Armadura de Luz', weapon: 'staff', armor: '#241C10', accent: '#E8C97A', skin: '#E8B890', cape: '#180E06', plume: '#F5E4A8', hair: '#8A5020', weaponName: 'Bastón' },
    { name: 'Templaria Sombría', sub: 'Arco · Armadura Violeta', weapon: 'bow', armor: '#1A1430', accent: '#9966DD', skin: '#C8A080', cape: '#100C22', plume: '#BB88FF', hair: '#2A1840', weaponName: 'Arco' },
    { name: 'Templaria Tormenta', sub: 'Maza · Armadura Esmeralda', weapon: 'mace', armor: '#142018', accent: '#44AA66', skin: '#D4B090', cape: '#0C1610', plume: '#66DD88', hair: '#1A3020', weaponName: 'Maza' }
  ]
};

// ═══════════════════════════════════════════════════════════════
// Función auxiliar para dibujar rectángulos redondeados en canvas
// ═══════════════════════════════════════════════════════════════
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x+r, y);
    this.lineTo(x+w-r, y);
    this.quadraticCurveTo(x+w, y, x+w, y+r);
    this.lineTo(x+w, y+h-r);
    this.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    this.lineTo(x+r, y+h);
    this.quadraticCurveTo(x, y+h, x, y+h-r);
    this.lineTo(x, y+r);
    this.quadraticCurveTo(x, y, x+r, y);
    this.closePath();
    return this;
  };
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE DIBUJO DE PERSONAJES (extraídas del HTML original)
// ═══════════════════════════════════════════════════════════════
function drawCSChar(ctx, cx, floorY, v, gender, elapsed, stageW, stageH) {
  const t = elapsed * 0.001;
  const availH = stageH || stageW * 2.2;
  const s = Math.min((availH * 0.82) / 145, stageW * 0.9 / 60);
  const breathAmt = Math.sin(t * 1.8) * 2 * s;
  const capeSway = Math.sin(t * 1.4) * 6;
  const armIdle = Math.sin(t * 1.6) * 4;
  const legIdle = Math.sin(t * 1.8) * 2;
  const weaponBob = Math.sin(t * 1.5) * 3;
  
  ctx.save();
  ctx.translate(cx, floorY - breathAmt);
  const a = v.armor, ac = v.accent, sk = v.skin, ca = v.cape, pl = v.plume || '#C9A84C';
  
  // Capa
  ctx.save();
  ctx.translate(-2 * s, -85 * s);
  ctx.rotate(capeSway * Math.PI / 180);
  ctx.fillStyle = ca;
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.moveTo(-3 * s, 0);
  ctx.quadraticCurveTo(-18 * s, 20 * s, -14 * s, 55 * s);
  ctx.lineTo(5 * s, 55 * s);
  ctx.quadraticCurveTo(8 * s, 20 * s, 4 * s, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = ac;
  ctx.lineWidth = 0.8 * s;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(-3 * s, 0);
  ctx.quadraticCurveTo(-18 * s, 20 * s, -14 * s, 55 * s);
  ctx.stroke();
  ctx.restore();
  
  // Pierna izquierda
  ctx.save();
  ctx.translate(-5 * s, -45 * s);
  ctx.rotate((legIdle - 4) * Math.PI / 180);
  ctx.fillStyle = a;
  ctx.beginPath();
  ctx.roundRect(-5.5 * s, 0, 11 * s, 33 * s, 3);
  ctx.fill();
  ctx.fillStyle = ac;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.ellipse(0, 16 * s, 7 * s, 4.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0A0702';
  ctx.beginPath();
  ctx.roundRect(-6.5 * s, 28 * s, 14 * s, 9 * s, 2);
  ctx.fill();
  ctx.restore();
  
  // Pierna derecha
  ctx.save();
  ctx.translate(5 * s, -45 * s);
  ctx.rotate((-legIdle + 4) * Math.PI / 180);
  ctx.fillStyle = a;
  ctx.beginPath();
  ctx.roundRect(-5.5 * s, 0, 11 * s, 33 * s, 3);
  ctx.fill();
  ctx.fillStyle = ac;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.ellipse(0, 16 * s, 7 * s, 4.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0A0702';
  ctx.beginPath();
  ctx.roundRect(-6.5 * s, 28 * s, 14 * s, 9 * s, 2);
  ctx.fill();
  ctx.restore();
  
  // Faja
  ctx.fillStyle = '#3A2810';
  ctx.beginPath();
  ctx.roundRect(-14 * s, -48 * s, 28 * s, 5 * s, 1);
  ctx.fill();
  ctx.fillStyle = '#C9A84C';
  ctx.beginPath();
  ctx.roundRect(-4 * s, -49.5 * s, 8 * s, 7 * s, 1);
  ctx.fill();
  
  // Torso
  ctx.fillStyle = a;
  ctx.beginPath();
  ctx.roundRect(-14 * s, -85 * s, 28 * s, 38 * s, 4);
  ctx.fill();
  ctx.fillStyle = ac;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.roundRect(-12 * s, -83 * s, 24 * s, 32 * s, 3);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#C9A84C';
  ctx.lineWidth = 0.7 * s;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.roundRect(-10 * s, -81 * s, 20 * s, 26 * s, 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  
  // Pechera
  ctx.fillStyle = '#C9A84C';
  ctx.globalAlpha = 0.9;
  ctx.fillRect(-1.8 * s, -78 * s, 3.5 * s, 18 * s);
  ctx.fillRect(-7 * s, -70 * s, 14 * s, 3.5 * s);
  ctx.fillStyle = '#F5E4A8';
  ctx.beginPath();
  ctx.arc(0, -68.5 * s, 2.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Hombros
  [-16, 10].forEach((ox) => {
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.roundRect(ox * s, -88 * s, 14 * s, 10 * s, 4);
    ctx.fill();
    ctx.strokeStyle = ac;
    ctx.lineWidth = 1 * s;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#C9A84C';
    ctx.beginPath();
    ctx.arc((ox + 7) * s, -83 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Brazo derecho con arma
  ctx.save();
  ctx.translate(18 * s, -83 * s);
  ctx.rotate((armIdle + weaponBob) * Math.PI / 180);
  ctx.fillStyle = a;
  ctx.beginPath();
  ctx.roundRect(-5 * s, 0, 10 * s, 30 * s, 2.5);
  ctx.fill();
  ctx.fillStyle = ac;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.roundRect(-6 * s, 25 * s, 12 * s, 9 * s, 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  csDrawWeapon(ctx, v.weapon, s, ac, elapsed);
  ctx.restore();
  
  // Brazo izquierdo (escudo)
  ctx.save();
  ctx.translate(-18 * s, -83 * s);
  ctx.rotate((-armIdle) * Math.PI / 180);
  ctx.fillStyle = a;
  ctx.beginPath();
  ctx.roundRect(-5 * s, 0, 10 * s, 30 * s, 2.5);
  ctx.fill();
  ctx.fillStyle = ac;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.roundRect(-6 * s, 25 * s, 12 * s, 9 * s, 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (v.weapon === 'sword') {
    ctx.fillStyle = a;
    ctx.strokeStyle = ac;
    ctx.lineWidth = 1 * s;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.roundRect(-13 * s, 2 * s, 22 * s, 28 * s, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#C9A84C';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(-2 * s, 16 * s, 7 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ac;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(-3.5 * s, 8 * s, 3 * s, 16 * s);
    ctx.fillRect(-9 * s, 14 * s, 14 * s, 3 * s);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  
  // Cuello y cabeza
  ctx.fillStyle = sk;
  ctx.beginPath();
  ctx.roundRect(-5 * s, -92 * s, 10 * s, 9 * s, 1);
  ctx.fill();
  ctx.fillStyle = a;
  ctx.beginPath();
  ctx.roundRect(-7 * s, -93 * s, 14 * s, 4 * s, 1);
  ctx.fill();
  
  // Casco
  ctx.fillStyle = a;
  ctx.beginPath();
  ctx.roundRect(-13 * s, -122 * s, 26 * s, 32 * s, 5);
  ctx.fill();
  ctx.fillStyle = ac;
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.roundRect(-11 * s, -120 * s, 22 * s, 27 * s, 4);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Visor
  ctx.fillStyle = '#0A0702';
  ctx.beginPath();
  ctx.roundRect(-9 * s, -107 * s, 18 * s, 4.5 * s, 1.5);
  ctx.fill();
  const slitGlow = ctx.createLinearGradient(-9 * s, -107 * s, 9 * s, -107 * s);
  slitGlow.addColorStop(0, 'rgba(201,168,76,0)');
  slitGlow.addColorStop(0.5, `rgba(201,168,76,${0.3 + Math.sin(t * 3) * 0.15})`);
  slitGlow.addColorStop(1, 'rgba(201,168,76,0)');
  ctx.fillStyle = slitGlow;
  ctx.fillRect(-9 * s, -107 * s, 18 * s, 4.5 * s);
  
  // Orejeras
  [-15, 9].forEach(ox => {
    ctx.fillStyle = a;
    ctx.beginPath();
    ctx.roundRect(ox * s, -115 * s, 6 * s, 14 * s, 2);
    ctx.fill();
  });
  
  if (gender === 'm') {
    ctx.fillStyle = '#1C1408';
    ctx.fillRect(-1.2 * s, -102 * s, 2.5 * s, 8 * s);
  }
  
  // Cresta
  ctx.fillStyle = a;
  ctx.beginPath();
  ctx.roundRect(-4 * s, -125 * s, 8 * s, 6 * s, 1);
  ctx.fill();
  ctx.fillStyle = pl;
  ctx.beginPath();
  ctx.moveTo(0, -125 * s);
  ctx.lineTo(-4 * s, -140 * s);
  ctx.lineTo(4 * s, -140 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFF';
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(0, -125 * s);
  ctx.lineTo(-1 * s, -140 * s);
  ctx.lineTo(1 * s, -140 * s);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  
  if (gender === 'f' && v.hair) {
    ctx.fillStyle = v.hair;
    [-13, 7].forEach(ox => {
      ctx.beginPath();
      ctx.roundRect(ox * s, -118 * s, 5 * s, 22 * s, 2);
      ctx.fill();
    });
  }
  
  ctx.fillStyle = pl;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(0, -140.5 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFF';
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(-1 * s, -141.5 * s, 1.2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  ctx.restore();
}

function csDrawWeapon(ctx, type, s, ac, elapsed) {
  const t = elapsed * 0.001;
  const wob = Math.sin(t * 1.5) * 0.03;
  ctx.save();
  ctx.translate(4 * s, 28 * s);
  ctx.rotate(wob);
  
  if (type === 'sword') {
    ctx.fillStyle = '#B0B0A8';
    ctx.beginPath();
    ctx.moveTo(-2.5 * s, 0);
    ctx.lineTo(2.5 * s, 0);
    ctx.lineTo(1 * s, 52 * s);
    ctx.lineTo(-1 * s, 52 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#E8E8D8';
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(-1.5 * s, 2 * s);
    ctx.lineTo(0.5 * s, 50 * s);
    ctx.stroke();
    ctx.fillStyle = '#C9A84C';
    ctx.beginPath();
    ctx.roundRect(-9 * s, -3.5 * s, 18 * s, 5 * s, 1.5);
    ctx.fill();
    ctx.fillStyle = ac;
    ctx.strokeStyle = '#C9A84C';
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.roundRect(-3.5 * s, -11 * s, 7 * s, 9 * s, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F5E4A8';
    ctx.beginPath();
    ctx.arc(0, -7.5 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'axe') {
    ctx.fillStyle = '#6A4E28';
    ctx.beginPath();
    ctx.roundRect(-2.5 * s, -5 * s, 5 * s, 52 * s, 2);
    ctx.fill();
    ctx.strokeStyle = '#3A2810';
    ctx.lineWidth = 2.5 * s;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 8; i++) ctx.strokeRect(-2 * s, (i * 5 + 5) * s, 4 * s, 3.5 * s);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#909088';
    ctx.beginPath();
    ctx.moveTo(-14 * s, -12 * s);
    ctx.lineTo(3 * s, -18 * s);
    ctx.lineTo(5 * s, 5 * s);
    ctx.lineTo(-14 * s, 8 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#D0D0C8';
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(-14 * s, -12 * s);
    ctx.lineTo(-14 * s, 8 * s);
    ctx.stroke();
    ctx.strokeStyle = '#C9A84C';
    ctx.lineWidth = 1 * s;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(-10 * s, -9 * s);
    ctx.lineTo(-10 * s, 5 * s);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (type === 'lance') {
    ctx.fillStyle = '#6A4E28';
    ctx.beginPath();
    ctx.roundRect(-2 * s, -5 * s, 4 * s, 58 * s, 2);
    ctx.fill();
    ctx.fillStyle = '#C9A84C';
    ctx.globalAlpha = 0.8;
    [8, 20, 36].forEach(y => ctx.fillRect(-3 * s, y * s, 6 * s, 2.5 * s));
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#B0B0A8';
    ctx.beginPath();
    ctx.moveTo(0, -18 * s);
    ctx.lineTo(-5 * s, -3 * s);
    ctx.lineTo(5 * s, -3 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#E0E0D0';
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(-2 * s, -12 * s);
    ctx.lineTo(0, -18 * s);
    ctx.stroke();
    ctx.fillStyle = ac;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(5 * s, -2 * s);
    ctx.lineTo(18 * s, 5 * s);
    ctx.lineTo(5 * s, 12 * s);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (type === 'staff') {
    ctx.fillStyle = '#5A3A18';
    ctx.beginPath();
    ctx.roundRect(-2.5 * s, -5 * s, 5 * s, 55 * s, 2.5);
    ctx.fill();
    ctx.fillStyle = '#C9A84C';
    ctx.globalAlpha = 0.85;
    [5, 18, 32, 46].forEach(y => ctx.fillRect(-4 * s, y * s, 8 * s, 2 * s));
    ctx.globalAlpha = 1;
    const og = ctx.createRadialGradient(0, -14 * s, 0, 0, -14 * s, 11 * s);
    og.addColorStop(0, '#FFF8E0');
    og.addColorStop(0.4, '#E8C97A');
    og.addColorStop(1, `rgba(201,168,76,${0.3 + Math.sin(t * 3) * 0.3})`);
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(0, -14 * s, 10 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFF0';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(-3.5 * s, -17 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#C9A84C';
    ctx.lineWidth = 1.5 * s;
    [-30, 30, 90, 150, 210, 270].forEach(deg => {
      const r = deg * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(Math.cos(r) * 9 * s, -14 * s + Math.sin(r) * 9 * s);
      ctx.lineTo(Math.cos(r) * 14 * s, -14 * s + Math.sin(r) * 14 * s);
      ctx.stroke();
    });
  } else if (type === 'bow') {
    ctx.strokeStyle = '#8A6030';
    ctx.lineWidth = 4 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4 * s, 0);
    ctx.quadraticCurveTo(-20 * s, 25 * s, -4 * s, 50 * s);
    ctx.stroke();
    ctx.strokeStyle = '#C9A84C';
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(-4 * s, 0);
    ctx.lineTo(-4 * s, 50 * s);
    ctx.stroke();
    ctx.fillStyle = '#909088';
    ctx.beginPath();
    ctx.roundRect(-1 * s, 5 * s, 2 * s, 40 * s, 1);
    ctx.fill();
    ctx.fillStyle = '#C0C0B8';
    ctx.beginPath();
    ctx.moveTo(0, 3 * s);
    ctx.lineTo(-3 * s, 10 * s);
    ctx.lineTo(3 * s, 10 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ac;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 44 * s);
    ctx.lineTo(-5 * s, 50 * s);
    ctx.lineTo(0, 46 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 44 * s);
    ctx.lineTo(5 * s, 50 * s);
    ctx.lineTo(0, 46 * s);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (type === 'mace') {
    ctx.fillStyle = '#6A4E28';
    ctx.beginPath();
    ctx.roundRect(-2.5 * s, 8 * s, 5 * s, 45 * s, 2);
    ctx.fill();
    ctx.fillStyle = '#909088';
    ctx.beginPath();
    ctx.arc(0, 4 * s, 12 * s, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const ang = i * (Math.PI / 3);
      ctx.save();
      ctx.translate(0, 4 * s);
      ctx.rotate(ang);
      ctx.fillStyle = '#A0A098';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-5 * s, 18 * s);
      ctx.lineTo(5 * s, 18 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#C9A84C';
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(0, 2 * s);
      ctx.lineTo(-2 * s, 16 * s);
      ctx.lineTo(2 * s, 16 * s);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    const jg = ctx.createRadialGradient(0, 4 * s, 0, 0, 4 * s, 7 * s);
    jg.addColorStop(0, '#FFF8E0');
    jg.addColorStop(0.5, ac);
    jg.addColorStop(1, ac);
    ctx.fillStyle = jg;
    ctx.beginPath();
    ctx.arc(0, 4 * s, 7 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function alreadyPlayedToday(key) {
  return G.dailyAttempts && G.dailyAttempts[key] === todayStr();
}

const CHAMBER_META = {
  c1:      { ch: 'CLARIDAD ABSOLUTA',  ico: '🕯️', pts: 50,  scene: 'Sala de piedra antiquísima' },
  c2:      { ch: 'DOMINIO INTERIOR',   ico: '🧘',  pts: 50,  scene: 'Cámara interior'            },
  c3:      { ch: 'ESTRATEGIA MENTAL',  ico: '♟',   pts: 50,  scene: 'Sala del tiempo'            },
  council: { ch: 'PRUEBA DEL CONSEJO', ico: '⭐',  pts: 100, scene: 'La cámara más profunda'     }
};

// Banco cargado desde Supabase — cae a QB si falla
const QB_LIVE = { c1: [], c2: [], c3: [], council: [] };

async function loadWeekQuestions() {
  if (!sb) return;
  try {
    // Busca el week_number más alto activo
    const { data: topWeek } = await sb
      .from('templo_questions')
      .select('week_number')
      .eq('active', true)
      .order('week_number', { ascending: false })
      .limit(1)
      .single();

    if (!topWeek) return;

    const { data: rows } = await sb
      .from('templo_questions')
      .select('*')
      .eq('week_number', topWeek.week_number)
      .eq('active', true);

    if (!rows || !rows.length) return;

    // Resetea y llena QB_LIVE
    ['c1','c2','c3','council'].forEach(k => QB_LIVE[k] = []);
   rows.forEach(r => {
  if (!QB_LIVE[r.chamber]) return;
  QB_LIVE[r.chamber].push({
    id: r.id,
    q: r.question,
    opts: r.opts,
    ok: r.correct_idx,
    wis: r.wisdom
  });
});
  } catch(e) {
    console.warn('[loadWeekQuestions] falló, usando banco local', e);
  }
}

function pickQuestion(key) {
  // Usa QB_LIVE si tiene preguntas, si no cae al QB hardcodeado
  let pool = QB_LIVE[key]?.length ? QB_LIVE[key] : QB[key];

  // Excluir preguntas ya respondidas esta semana
  const answeredIds = (G.answered_qids && G.answered_qids[key]) ? G.answered_qids[key] : [];
  const available = pool.filter(q => !answeredIds.includes(q.id));

  // Si ya respondió todas, mostramos un mensaje especial
  if (available.length === 0) {
    return {
      ...CHAMBER_META[key],
      q: '¡Has completado todas las preguntas de esta cámara esta semana! Vuelve el domingo.',
      opts: ['Entendido'],
      ok: -1,
      wis: 'Un verdadero templario no se detiene.'
    };
  }

  let idx;
  do { idx = Math.floor(Math.random() * available.length); } while (idx === QB_LAST[key] && available.length > 1);
  QB_LAST[key] = idx;
  const raw = available[idx];
  return { ...CHAMBER_META[key], ...raw };
}


// ═══════════════════════════════════════════════════════════════
// SISTEMA DE AUDIO — 100 TEMPLARIOS DIJERON
// Versión corregida: alpha 10 Hz · brown noise · apertura zen
// Reemplaza completamente el createGameAudio() anterior
// ═══════════════════════════════════════════════════════════════
 
function createGameAudio() {
  let audioCtx    = null;
  let masterGain  = null;
  let ambientNodes  = [];
  let mapNodes      = [];
  let mapStopped    = true;
 
  // ─────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────
  function init() {
    try {
      if (!audioCtx) {
        audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 1.8;
        masterGain.connect(audioCtx.destination);
      }
      // Resume si el browser lo suspendió (tab inactiva, refresh, etc.)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) { console.warn('Audio no soportado', e); }
  }

  function destroy() {
    mapStopped = true;
    ambientNodes.forEach(n => {
      try { if (n.osc) n.osc.stop(); } catch(e) {}
      if (n.intervalId) clearTimeout(n.intervalId);
      if (n.beatInterval) clearTimeout(n.beatInterval);
    });
    mapNodes.forEach(n => {
      try { if (n.osc) n.osc.stop(); } catch(e) {}
      if (n.intervalId) clearTimeout(n.intervalId);
    });
    ambientNodes = [];
    mapNodes = [];
    try { if (audioCtx) { audioCtx.close(); audioCtx = null; masterGain = null; } } catch(e) {}
  }
 
  // ─────────────────────────────────────────────────
  // UTILIDADES INTERNAS
  // ─────────────────────────────────────────────────
 
  /** Oscilador simple con fade-in y fade-out */
  function makeOsc(type, freq, startTime, duration, vol, detuneCents = 0) {
    if (!audioCtx) return null;
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type          = type;
    osc.frequency.value = freq;
    if (detuneCents) osc.detune.value = detuneCents;
    const t0 = audioCtx.currentTime + startTime;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + Math.min(0.8, duration * 0.15));
    gain.gain.setValueAtTime(vol, t0 + duration - Math.min(0.8, duration * 0.15));
    gain.gain.linearRampToValueAtTime(0, t0 + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);

    return { osc, gain };
  }
 
  /**
   * Brown noise: espectro 1/f² — cae 6 dB/oct en agudos.
   * Suena como lluvia lejana o río tranquilo.
   * No compite con la voz interior al leer preguntas.
   */
  function makeBrownNoise(startTime, duration, vol) {
    if (!audioCtx) return null;
    const bufSize = audioCtx.sampleRate * duration;
    const buf     = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data    = buf.getChannelData(0);
    let lastOut   = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      // Integrador de primer orden → pendiente -6 dB/oct
      lastOut    = (lastOut + 0.02 * white) / 1.02;
      data[i]    = lastOut * 3.5; // normalización
    }
    const src  = audioCtx.createBufferSource();
    src.buffer = buf;
 
    // LP suave para eliminar restos de agudos
    const lp       = audioCtx.createBiquadFilter();
    lp.type        = 'lowpass';
    lp.frequency.value = 400;
    lp.Q.value     = 0.5;
 
    const gain = audioCtx.createGain();
    const t0   = audioCtx.currentTime + startTime;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 4);
    gain.gain.setValueAtTime(vol, t0 + duration - 4);
    gain.gain.linearRampToValueAtTime(0, t0 + duration);
 
    src.connect(lp);
    lp.connect(gain);
    gain.connect(masterGain);
    src.start(t0);
 
    return { osc: src, gain };
  }
 
  /** Campana tibetana suave (sine con decay exponencial) */
  function playBell(freq, vol, when = 0) {
    if (!audioCtx) return;
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type          = 'sine';
    osc.frequency.value = freq;
    const t0 = audioCtx.currentTime + when;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.5);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + 3.6);
  }
 
  /** Pájaro tranquilo: 500–900 Hz (zona calma, no alerta) */
  function playCalamBird(startDelay = 0) {
    if (!audioCtx) return;
 
    const patterns = [
      { freqs: [320,  680,  580],  times: [0, 0.14, 0.30] },
      { freqs: [400,  780,  660,  720], times: [0, 0.12, 0.26, 0.40] },
      { freqs: [380,  620,  550],  times: [0, 0.16, 0.34] },
    ];
    const p = patterns[Math.floor(Math.random() * patterns.length)];
 
    p.freqs.forEach((freq, i) => {
      const t0     = audioCtx.currentTime + startDelay + p.times[i];
      const osc    = audioCtx.createOscillator();
      const gain   = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      filter.type        = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value     = 5;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 0.92, t0);
      osc.frequency.linearRampToValueAtTime(freq * 1.08, t0 + 0.10);
      osc.frequency.linearRampToValueAtTime(freq,        t0 + 0.22);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.038, t0 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start(t0);
      osc.stop(t0 + 0.32);
    });
 
    // Respuesta ocasional de un segundo pájaro
    if (Math.random() > 0.45) {
      const delay2 = startDelay + 0.6 + Math.random() * 0.3;
      const p2     = patterns[Math.floor(Math.random() * patterns.length)];
      p2.freqs.forEach((freq, i) => {
        const t0  = audioCtx.currentTime + delay2 + p2.times[i];
        const osc = audioCtx.createOscillator();
        const g   = audioCtx.createGain();
        osc.type  = 'sine';
        osc.frequency.setValueAtTime(freq * 0.93, t0);
        osc.frequency.linearRampToValueAtTime(freq * 1.07, t0 + 0.09);
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.026, t0 + 0.025);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(t0);
        osc.stop(t0 + 0.28);
      });
    }
  }
 
function _handpan(freq, startTime, vol) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + startTime;
  const decay = 2.8 + Math.random() * 0.6;

  // Fundamental
  const osc1  = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = 'sine';
  osc1.frequency.value = freq;
  gain1.gain.setValueAtTime(0, t0);
  gain1.gain.linearRampToValueAtTime(vol, t0 + 0.006);
  gain1.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
  osc1.connect(gain1); gain1.connect(masterGain);
  osc1.start(t0); osc1.stop(t0 + decay + 0.1);

  // Octava (armónico 2) — más suave, da el brillo metálico del handpan
  const osc2  = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = freq * 2.0;
  gain2.gain.setValueAtTime(0, t0);
  gain2.gain.linearRampToValueAtTime(vol * 0.35, t0 + 0.005);
  gain2.gain.exponentialRampToValueAtTime(0.0001, t0 + decay * 0.55);
  osc2.connect(gain2); gain2.connect(masterGain);
  osc2.start(t0); osc2.stop(t0 + decay * 0.6);

  // Tercera armónica suave — resonancia cálida
  const osc3  = audioCtx.createOscillator();
  const gain3 = audioCtx.createGain();
  osc3.type = 'sine';
  osc3.frequency.value = freq * 3.0;
  gain3.gain.setValueAtTime(0, t0);
  gain3.gain.linearRampToValueAtTime(vol * 0.12, t0 + 0.004);
  gain3.gain.exponentialRampToValueAtTime(0.0001, t0 + decay * 0.3);
  osc3.connect(gain3); gain3.connect(masterGain);
  osc3.start(t0); osc3.stop(t0 + decay * 0.35);

  // Transient percusivo (ruido corto) — el golpe del dedo en el metal
  const bufSize = audioCtx.sampleRate * 0.04;
  const buf     = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data    = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
  const noise  = audioCtx.createBufferSource();
  noise.buffer = buf;
  const nFilt  = audioCtx.createBiquadFilter();
  nFilt.type   = 'bandpass';
  nFilt.frequency.value = freq * 1.5;
  nFilt.Q.value = 3;
  const nGain  = audioCtx.createGain();
  nGain.gain.setValueAtTime(vol * 0.18, t0);
  nGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.035);
  noise.connect(nFilt); nFilt.connect(nGain); nGain.connect(masterGain);
  noise.start(t0);
}

 
// ─────────────────────────────────────────────────────────────
// HELPER: Flauta suave (responde al cuerno)
// sine puro, más delicada, para la "respuesta" de la conversación
// ─────────────────────────────────────────────────────────────
function _flute(freq, startTime, duration, vol) {
  if (!audioCtx) return;
  const t0  = audioCtx.currentTime + startTime;
  const osc = audioCtx.createOscillator();
  const g   = audioCtx.createGain();
 
  osc.type = 'sine';
  osc.frequency.value = freq;
 
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.14);
  g.gain.setValueAtTime(vol, t0 + duration - 0.16);
  g.gain.linearRampToValueAtTime(0, t0 + duration);
 
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}
 
// ─────────────────────────────────────────────────────────────
// HELPER: Pad con LFO de respiración
// Nunca estático → nunca suena a zumbido ni ruido blanco
// Cada voz tiene desfase distinto → no sincronizadas entre sí
// ─────────────────────────────────────────────────────────────
function _breathingPad(freq, vol, startDelay, nodes) {
  if (!audioCtx) return;
  const t0   = audioCtx.currentTime + startDelay;
  const osc  = audioCtx.createOscillator();
  const filt = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  const lfo  = audioCtx.createOscillator();
  const lfoG = audioCtx.createGain();
 
  osc.type = 'triangle';
  osc.frequency.value = freq;
 
  filt.type = 'lowpass';
  filt.frequency.value = freq * 2.2;
  filt.Q.value = 0.4;
 
  // Fade-in suave en 5 segundos
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 1.5);
 
  // LFO 0.07 Hz = una respiración cada ~14s
  // ±25% del volumen → sube y baja como un pecho respirando
  lfo.type = 'sine';
  lfo.frequency.value = 0.07;
  lfoG.gain.value = vol * 0.25;
 
  lfo.connect(lfoG);
  lfoG.connect(gain.gain);  // AudioParam acepta conexiones de audio node
 
  osc.connect(filt);
  filt.connect(gain);
  gain.connect(masterGain);
  osc.start(t0);
  lfo.start(t0);
 
  nodes.push({ osc, gain });
  nodes.push({ osc: lfo, gain: lfoG });
}
 
// ─────────────────────────────────────────────────────────────
// ESTADO 1 — LOBBY / MAPA
//
// Capas:
//  A — Pad respirante (Do-Mi-Sol: quinta abierta, sabor templario)
//  B — Binaural 10 Hz alpha (camuflado en el pad)
//  C — Call & Response: cuerno llama → silencio → flauta responde
//      Intervalos de 10-16s aleatorios: no predecibles, nunca wallpaper
//  D — Campanas tibetanas esporádicas (22-42s)
//  E — Pájaros tranquilos (500-900 Hz)
// ─────────────────────────────────────────────────────────────
function startEpicAmbientMapMusic() {
  if (!audioCtx || !mapStopped) return;
  mapStopped = false;
 
  // ── CAPA A: PAD RESPIRANTE ───────────────────────────────────
  // Do-Mi-Sol: acorde abierto sin tensión, medieval y claro
  // Las tres voces tienen startDelay distinto → nunca sincronizadas
  _breathingPad(110.0, 0.018, 2.0, mapNodes);  // Do grave
  _breathingPad(164.8, 0.012, 2.8, mapNodes);  // Mi
  _breathingPad(220.0, 0.009, 3.5, mapNodes);  // Sol (octava del Do)
 
  // ── CAPA B: BINAURAL 10 Hz ALPHA ────────────────────────────
  // Diferencia de 10 Hz entre oídos → ondas alpha en el cerebro
  // Volumen muy bajo (0.009): el cerebro lo procesa, el oído no lo nota
  const binL = audioCtx.createOscillator();
  const binR = audioCtx.createOscillator();
  const binG = audioCtx.createGain();
  binL.type = 'sine'; binL.frequency.value = 100.0;  // oído izquierdo
  binR.type = 'sine'; binR.frequency.value = 110.0;  // oído derecho (+10 Hz)
  const bt0 = audioCtx.currentTime + 5;
  binG.gain.setValueAtTime(0, bt0);
  binG.gain.linearRampToValueAtTime(0.009, bt0 + 8);
  binL.connect(binG);
  binR.connect(binG);
  binG.connect(masterGain);
  binL.start(bt0);
  binR.start(bt0);
  mapNodes.push({ osc: binL, gain: binG });
  mapNodes.push({ osc: binR, gain: binG });
 
  // ── CAPA C: CALL & RESPONSE MEDIEVAL ────────────────────────
  //
  // CALL (cuerno A desde torre norte):
  //   Do → Mi → Sol → La  (pentatónica ascendente)
  //   "Guardián llama al mundo"
  //
  // SILENCIO: 1.7 segundos
  //   El silencio es parte del diseño — como Zelda overworld
  //
  // RESPONSE (flauta desde torre sur):
  //   Sol → Mi → Re  (descenso contemplativo)
  //   "El mundo responde que está vivo"
  //
  // Siguiente ciclo: 10–16 s aleatorio
  //   El cerebro no puede predecir cuándo viene → nunca se filtra como ruido
 
  function _guitar(freq, startTime, vol) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime + startTime;
    const decay = 3.5 + Math.random() * 0.8;
    // Cuerda fundamental — sawtooth suavizado simula armónicos de guitarra
    const osc  = audioCtx.createOscillator();
    const filt = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    // LP suave — elimina agudos duros, deja calidez de madera
    filt.type = 'lowpass';
    filt.frequency.value = freq * 3.8;
    filt.Q.value = 0.6;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(vol * 0.3, t0 + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    osc.connect(filt); filt.connect(gain); gain.connect(masterGain);
    osc.start(t0); osc.stop(t0 + decay + 0.1);
    // Armónico suave — da cuerpo sin saturar
    const osc2  = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2.0;
    gain2.gain.setValueAtTime(0, t0);
    gain2.gain.linearRampToValueAtTime(vol * 0.2, t0 + 0.006);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t0 + decay * 0.4);
    osc2.connect(gain2); gain2.connect(masterGain);
    osc2.start(t0); osc2.stop(t0 + decay * 0.45);
  }

  function playCall(baseDelay) {
    // Handpan solo — escala D Kurd ascendente, espaciada para respirar
    _handpan(146.8, baseDelay + 0.00, 0.060);  // Re — abre
    _handpan(196.0, baseDelay + 0.80, 0.052);  // Sol
    _handpan(220.0, baseDelay + 1.65, 0.048);  // La
    _handpan(261.6, baseDelay + 2.55, 0.055);  // Do — cierra arriba
  }

  function playResponse(baseDelay) {
    // Guitarra sola — responde descendiendo, como eco del handpan
    _guitar(261.6, baseDelay + 0.00, 0.022);   // Do
    _guitar(220.0, baseDelay + 0.70, 0.019);   // La
    _guitar(196.0, baseDelay + 1.35, 0.017);   // Sol
    _guitar(164.8, baseDelay + 1.95, 0.015);   // Mi
    _guitar(146.8, baseDelay + 2.55, 0.013);   // Re — se disuelve
    _guitar(130.8, baseDelay + 3.10, 0.010);   // Do bajo — susurro final
  }
 
  function scheduleCallResponse() {
    if (mapStopped || !audioCtx) return;
 
    // CALL ahora
    playCall(0);
 
    // RESPONSE llega 1.7s después (silencio intencional entre torres)
    const rId = setTimeout(() => {
      if (!mapStopped && audioCtx) playResponse(0);
    }, 1700);
    mapNodes.push({ intervalId: rId });
 
    // Siguiente ciclo: 10–16s después de la respuesta (impredecible)
    const nextWait = 10000 + Math.random() * 6000;
    const nId = setTimeout(() => {
      if (!mapStopped && audioCtx) scheduleCallResponse();
    }, 1700 + nextWait);
    mapNodes.push({ intervalId: nId });
  }
 
  // Primera llamada a los 4s (el pad ya se escucha, no suena vacío)
  const firstId = setTimeout(() => {
    if (!mapStopped && audioCtx) scheduleCallResponse();
  }, 4000);
  mapNodes.push({ intervalId: firstId });
 
  // ── CAPA D: CAMPANAS TIBETANAS ───────────────────────────────
  // Solo frecuencias bajas-medias (110–262 Hz): nunca agudas ni molestas
  // Intervalos 22–42s: anclan la atención sin interrumpir
  const bellNotes = [110, 130.8, 146.8, 164.8, 196.0, 220.0, 246.9, 261.6];
  function scheduleBell() {
    if (mapStopped || !audioCtx) return;
    const id = setTimeout(() => {
      if (!mapStopped && audioCtx) {
        const note = bellNotes[Math.floor(Math.random() * bellNotes.length)];
        // playBell debe existir en tu gameAudio.js
        if (typeof playBell === 'function') {
          playBell(note, 0.05 + Math.random() * 0.03);
        }
      }
      scheduleBell();
    }, 22000 + Math.random() * 20000);
    mapNodes.push({ intervalId: id });
  }
  scheduleBell();
 
  // ── CAPA E: PÁJAROS TRANQUILOS ───────────────────────────────
  // playCalamBird debe existir en tu gameAudio.js (500-900 Hz)
  if (typeof playCalamBird === 'function') {
    playCalamBird(5.0);
    playCalamBird(6.8);
    function scheduleBirds() {
      if (mapStopped || !audioCtx) return;
      const id = setTimeout(() => {
        if (!mapStopped && audioCtx) playCalamBird(0);
        scheduleBirds();
      }, 18000 + Math.random() * 10000);
      mapNodes.push({ intervalId: id });
    }
    scheduleBirds();
  }
}

// Llegada al mapa — acorde de templo, una sola vez, ~3 segundos
// No es ambient, no loops, solo "bienvenido"
function playMapArrival() {
  if (!audioCtx) return;
  const arrivals = [
    { freq: 130.8, vol: 0.030 },  // Do bajo
    { freq: 196.0, vol: 0.022 },  // Sol
    { freq: 261.6, vol: 0.016 },  // Do medio
  ];
  arrivals.forEach(({ freq, vol }) => {
    const t0  = audioCtx.currentTime + 0.1;
    const osc = audioCtx.createOscillator();
    const g   = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.5);
    g.gain.setValueAtTime(vol, t0 + 1.0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2);
    osc.connect(g); g.connect(masterGain);
    osc.start(t0); osc.stop(t0 + 3.3);
  });
}
 
// ─────────────────────────────────────────────────────────────
// STOP LOBBY — fade out limpio en 2 segundos
// ─────────────────────────────────────────────────────────────
function stopEpicAmbientMapMusic(fadeTime = 2.0) {
  mapStopped = true;
  mapNodes.forEach(n => {
    if (n.gain) {
      try {
        n.gain.gain.cancelScheduledValues(audioCtx.currentTime);
        n.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeTime);
      } catch (e) {}
    }
    if (n.osc) {
      try { n.osc.stop(audioCtx.currentTime + fadeTime + 0.1); } catch (e) {}
    }
    if (n.intervalId) clearTimeout(n.intervalId);
  });
  mapNodes = [];
}

function playCinematicSequence() {
  if (!audioCtx) return;
  const tBuf  = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.6, audioCtx.sampleRate);
  const tData = tBuf.getChannelData(0);
  for (let i = 0; i < tData.length; i++) {
    const t  = i / audioCtx.sampleRate;
    tData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 11);
  }
  const tSrc  = audioCtx.createBufferSource();
  tSrc.buffer = tBuf;
  const tFilter = audioCtx.createBiquadFilter();
  tFilter.type  = 'bandpass';
  tFilter.Q.value = 1.8;
  tFilter.frequency.setValueAtTime(120, audioCtx.currentTime);
  tFilter.frequency.linearRampToValueAtTime(78, audioCtx.currentTime + 0.45);
  const tGain = audioCtx.createGain();
  tGain.gain.setValueAtTime(1.3, audioCtx.currentTime);
  tGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.55);
  tSrc.connect(tFilter); tFilter.connect(tGain); tGain.connect(masterGain);
  tSrc.start(audioCtx.currentTime);

  function hornNote(freq, startTime, duration, vol) {
    const t0   = audioCtx.currentTime + startTime;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const mix  = audioCtx.createGain();
    const filt = audioCtx.createBiquadFilter();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq * 0.97, t0);
    osc1.frequency.linearRampToValueAtTime(freq, t0 + 0.06);
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    const g2 = audioCtx.createGain();
    g2.gain.value = 0.22;
    filt.type = 'lowpass';
    filt.frequency.value = freq * 3.2;
    mix.gain.setValueAtTime(0, t0);
    mix.gain.linearRampToValueAtTime(vol, t0 + 0.07);
    mix.gain.setValueAtTime(vol, t0 + duration - 0.14);
    mix.gain.linearRampToValueAtTime(0, t0 + duration);
    osc2.connect(g2); g2.connect(filt); osc1.connect(filt);
    filt.connect(mix); mix.connect(masterGain);
    osc1.start(t0); osc1.stop(t0 + duration + 0.05);
    osc2.start(t0); osc2.stop(t0 + duration + 0.05);
  }

  hornNote(201.6, 0.10, 0.30, 0.05);
  hornNote(322.0, 0.38, 0.52, 0.07);
  hornNote(403.2, 0.86, 0.62, 0.06);

  [[1046.5, 0.10], [2093.0, 0.05]].forEach(([freq, vol], i) => {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type   = 'sine';
    osc.frequency.value = freq;
    const t0 = audioCtx.currentTime + 1.46 + i * 0.012;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.007);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.4);
    osc.connect(gain); gain.connect(masterGain);
    osc.start(t0); osc.stop(t0 + 2.5);
  });

  const shimOsc  = audioCtx.createOscillator();
  const shimGain = audioCtx.createGain();
  shimOsc.type   = 'sine';
  shimOsc.frequency.value = 523.2;
  const st = audioCtx.currentTime + 1.48;
  shimGain.gain.setValueAtTime(0, st);
  shimGain.gain.linearRampToValueAtTime(0.048, st + 0.05);
  shimGain.gain.exponentialRampToValueAtTime(0.0001, st + 1.6);
  shimOsc.connect(shimGain); shimGain.connect(masterGain);
 shimOsc.start(st); shimOsc.stop(st + 1.7);

  [130.8, 196.0, 261.6].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const g   = audioCtx.createGain();
    const t1  = audioCtx.currentTime + 1.6;
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t1);
    g.gain.linearRampToValueAtTime([0.028, 0.020, 0.014][i], t1 + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t1 + 4.0);
    osc.connect(g); g.connect(masterGain);
    osc.start(t1); osc.stop(t1 + 4.1);
  });
}
 
// ─────────────────────────────────────────────────────────────
// ESTADO 2 — PREGUNTAS / ENFOQUE
//
// Sin ritmo, sin cuernos, sin call & response.
// El pad sigue vivo (evita percepción de ruido/silencio incómodo)
// pero al 15% del volumen del lobby → no compite con la lectura.
// Campana muy esporádica (28-45s) ancla la atención sin interrumpir.
// ─────────────────────────────────────────────────────────────

function startAmbientMusic() {
  if (!audioCtx) return;
 
  // Pad simplificado — mismas frecuencias, volumen reducido
  [
    { f: 110.0, v: 0.012 },
    { f: 164.8, v: 0.008 },
    { f: 220.0, v: 0.006 },
  ].forEach(({ f, v }, i) => {
    const t0   = audioCtx.currentTime + 1 + i * 0.6;
    const osc  = audioCtx.createOscillator();
    const filt = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    const lfo  = audioCtx.createOscillator();
    const lfoG = audioCtx.createGain();
 
    osc.type = 'triangle';
    osc.frequency.value = f;
 
    filt.type = 'lowpass';
    filt.frequency.value = f * 2.2;
    filt.Q.value = 0.4;
 
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(v, t0 + 4);
 
    // LFO ligeramente diferente por voz: 0.06 / 0.07 / 0.08 Hz
    lfo.type = 'sine';
    lfo.frequency.value = 0.06 + i * 0.01;
    lfoG.gain.value = v * 0.2;
 
    lfo.connect(lfoG);
    lfoG.connect(gain.gain);
    osc.connect(filt);
    filt.connect(gain);
    gain.connect(masterGain);
    osc.start(t0);
    lfo.start(t0);
 
    ambientNodes.push({ osc, gain });
    ambientNodes.push({ osc: lfo, gain: lfoG });
  });
 
  // Binaural 10 Hz alpha (igual que lobby, camuflado en el pad)
  const binL = audioCtx.createOscillator();
  const binR = audioCtx.createOscillator();
  const binG = audioCtx.createGain();
  binL.type = 'sine'; binL.frequency.value = 100.0;
  binR.type = 'sine'; binR.frequency.value = 110.0;
  const bt0 = audioCtx.currentTime + 3;
  binG.gain.setValueAtTime(0, bt0);
  binG.gain.linearRampToValueAtTime(0.009, bt0 + 6);
  binL.connect(binG);
  binR.connect(binG);
  binG.connect(masterGain);
  binL.start(bt0);
  binR.start(bt0);
  ambientNodes.push({ osc: binL, gain: binG });
  ambientNodes.push({ osc: binR, gain: binG });
 
  // Campana esporádica muy suave — 28-45s entre cada una
  const bellNotes = [110, 130.8, 146.8, 164.8, 196.0, 220.0];
  function scheduleQuietBell() {
    const iv = setTimeout(() => {
      if (audioCtx && typeof playBell === 'function') {
        const note = bellNotes[Math.floor(Math.random() * bellNotes.length)];
        playBell(note, 0.030 + Math.random() * 0.015);  // más suave que en lobby
      }
      scheduleQuietBell();
    }, 28000 + Math.random() * 17000);
    ambientNodes.push({ osc: null, gain: null, beatInterval: iv });
  }
  // Empieza a los 10s — cuando el jugador ya está leyendo
  setTimeout(scheduleQuietBell, 10000);
}
 
// ─────────────────────────────────────────────────────────────
// STOP PREGUNTAS — fade out limpio en 1.8 segundos
// ─────────────────────────────────────────────────────────────
function stopAmbient(fadeTime = 1.8) {
  ambientNodes.forEach(n => {
    if (n.gain) {
      try {
        n.gain.gain.cancelScheduledValues(audioCtx.currentTime);
        n.gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + fadeTime);
      } catch (e) {}
    }
    if (n.osc) {
      try { n.osc.stop(audioCtx.currentTime + fadeTime + 0.1); } catch (e) {}
    }
    if (n.beatInterval) clearTimeout(n.beatInterval);
  });
  ambientNodes = [];
}

 
  // ─────────────────────────────────────────────────
  // SONIDOS DE INTERACCIÓN
  // ─────────────────────────────────────────────────
 
  /** Hover: 528 Hz, muy suave, decay corto */
  function playMapHoverSound() {
    if (!audioCtx) return;
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type   = 'sine';
    osc.frequency.value = 528;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.018, audioCtx.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
    osc.connect(gain); gain.connect(masterGain);
    osc.start(); osc.stop(audioCtx.currentTime + 0.10);
  }
 
  /** Click: 392 Hz (sol), triangle, decay natural */
  function playMapClickSound() {
    if (!audioCtx) return;
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type   = 'triangle';
    osc.frequency.value = 392;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
    osc.connect(gain); gain.connect(masterGain);
    osc.start(); osc.stop(audioCtx.currentTime + 0.15);
  }
 
  /** Respuesta CORRECTA: motivo ascendente 2 notas — celebración suave */
  function playCorrectSound() {
    if (!audioCtx) return;
    // sol → do — intervalo de cuarta, universalmente positivo
    const notes = [392, 523.2];
    notes.forEach((freq, i) => {
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type   = 'sine';
      osc.frequency.value = freq;
      const t0 = audioCtx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.11, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
      osc.connect(gain); gain.connect(masterGain);
      osc.start(t0); osc.stop(t0 + 0.35);
    });
  }
 
  /** Respuesta INCORRECTA: gong grave suave — informa sin humillar */
  function playWrongSound() {
    if (!audioCtx) return;
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filt = audioCtx.createBiquadFilter();
    osc.type   = 'sine';
    osc.frequency.value = 146.8; // re — neutro, no alarmante
    filt.type  = 'lowpass'; filt.frequency.value = 300;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.07, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
    osc.connect(filt); filt.connect(gain); gain.connect(masterGain);
    osc.start(); osc.stop(audioCtx.currentTime + 1.3);
  }
 
  /** Campana suave genérica (usada por lógica externa) */
  function playSoftChime(freq, vol = 0.08) {
    if (!audioCtx) return;
    playBell(freq, vol, 0);
  }
 
  // ─────────────────────────────────────────────────
  // API PÚBLICA
  // ─────────────────────────────────────────────────
  return {
    init,
    playCinematicSequence,
    startAmbientMusic,
    stopAmbient,
    // Mapa
    startEpicAmbientMapMusic,
    stopEpicAmbientMapMusic,
    destroy,
playMapArrival,
    stopEpicAmbientMapMusic,
    // Interacción
    playMapHoverSound,
    playMapClickSound,
    // Respuestas (nuevas — úsalas en tu lógica de quiz)
    playCorrectSound,
    playWrongSound,
    // Genérica
    playSoftChime,
  };

 
}

const GAME_AUDIO = createGameAudio();

// ═══════════════════════════════════════════════════════════════
// PARTÍCULAS DE FONDO (bgc y ptc)
// ═══════════════════════════════════════════════════════════════
let bgXParticles = null, ptXParticles = null;
let bgCanvasRef = null, ptCanvasRef = null;
let W = 0, H = 0;
const bgParticles = [];
const burstParticles = [];

function initBackgroundCanvases(canvasBg, canvasPt) {
  bgCanvasRef = canvasBg;
  ptCanvasRef = canvasPt;
  if (!bgCanvasRef || !ptCanvasRef) return;
  bgXParticles = bgCanvasRef.getContext('2d');
  ptXParticles = ptCanvasRef.getContext('2d');
  const resize = () => {
    if (!bgCanvasRef || !ptCanvasRef) return;
    W = window.innerWidth;
    H = window.innerHeight;
    bgCanvasRef.width = W;
    bgCanvasRef.height = H;
    ptCanvasRef.width = W;
    ptCanvasRef.height = H;
  };
  window.addEventListener('resize', resize);
  resize();

  function mkBg() {
    return {
      x: Math.random() * W, y: H * 0.3 + Math.random() * H * 0.7,
      vx: (Math.random() - 0.5) * 0.5, vy: -0.25 - Math.random() * 0.9,
      life: 1, decay: 0.003 + Math.random() * 0.004,
      r: 0.8 + Math.random() * 2.2, cr: 201, cg: 168, cb: 76
    };
  }

  function anim() {
    if (!bgXParticles || !ptXParticles) return;
    bgXParticles.clearRect(0, 0, W, H);
    if (bgParticles.length < 40) bgParticles.push(mkBg());
    for (let i = bgParticles.length - 1; i >= 0; i--) {
      const p = bgParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0 || p.y < -10) {
        bgParticles.splice(i, 1);
        continue;
      }
      bgXParticles.globalAlpha = p.life * 0.2;
      bgXParticles.fillStyle = `rgb(${p.cr},${p.cg},${p.cb})`;
      bgXParticles.beginPath();
      bgXParticles.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      bgXParticles.fill();
    }
    bgXParticles.globalAlpha = 1;

    ptXParticles.clearRect(0, 0, W, H);
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const p = burstParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.grav;
      p.life -= p.decay;
      if (p.life <= 0) {
        burstParticles.splice(i, 1);
        continue;
      }
      ptXParticles.globalAlpha = p.life * 0.88;
      ptXParticles.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ptXParticles.beginPath();
      ptXParticles.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ptXParticles.fill();
    }
    ptXParticles.globalAlpha = 1;
    requestAnimationFrame(anim);
  }
  anim();
}

function spawnBurst(type, n) {
  const cx = W / 2, cy = H / 2;
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 / n) * i + Math.random() * 0.5;
    const sp = 4 + Math.random() * 9;
    const col = type === 'correct' ? { r: 90, g: 255, b: 120 } : { r: 255, g: 70, b: 70 };
    burstParticles.push({
      x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3,
      life: 1, decay: 0.022 + Math.random() * 0.018,
      r: 2 + Math.random() * 5, grav: 0.13, ...col
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// SUPABASE (igual al HTML)
// ═══════════════════════════════════════════════════════════════
async function initSupabase() {
  const supabaseUrl = localStorage.getItem('_sb_url');
  const supabaseKey = localStorage.getItem('_sb_key');
  if (!supabaseUrl || !supabaseKey) {
    console.error('No hay credenciales de Supabase');
    window.parent.location.href = '/login';
    return false;
  }
  sb = window.supabase.createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.parent.location.href = '/login';
    return false;
  }
  CURRENT_USER = session.user;
  if (!_rankChannel) { _rankChannel = sb.channel('ranking_live'); _rankChannel.subscribe(); }
  const { data: profile } = await sb
    .from('profiles')
    .select('id, templario_name, avatar, is_admin')
    .eq('id', CURRENT_USER.id)
    .single();
  CURRENT_PROFILE = profile;
  await sb.from('templo_players').upsert({ id: CURRENT_USER.id }, { onConflict: 'id', ignoreDuplicates: true });
  return true;
}

async function checkCompetitionAccess() {
  if (!sb) return true;
  try {
    const { data } = await sb
      .from('competition_settings')
      .select('start_date, end_date, is_active')
      .eq('id', 'current')
      .single();
    if (!data) return true;
    if (!data.is_active) return false;
    const now = new Date();
    if (data.start_date && new Date(data.start_date) > now) return false;
    if (data.end_date   && new Date(data.end_date)   < now) return false;
    return true;
  } catch { return true; }
}

async function fetchLB() {
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from('templo_players')
      .select('id, points, weekly_points, streak, correct, level, xp, char_gender, char_variant, char_name, daily_attempts')
      .order('weekly_points', { ascending: false })
      .limit(100);
    if (error) { console.error('[fetchLB]', error.message); return []; }

    // Traer nombres reales de profiles
    const ids = (data || []).map(p => p.id);
    const { data: profs } = await sb
      .from('public_profiles')
      .select('id, templario_name')
      .in('id', ids);
    const profMap = {};
    (profs || []).forEach(p => { profMap[p.id] = p.templario_name; });

    return (data || []).map(p => ({
      id: p.id,
      n: profMap[p.id] || p.char_name || 'Templario',
      p: p.weekly_points ?? 0,
      total_points: p.points ?? 0,
      streak: p.streak ?? 0,
      correct: p.correct ?? 0,
      av: p.char_variant ?? 0,
      gender: p.char_gender || 'm',
      charVariant: p.char_variant ?? 0,
      xp: p.xp ?? 0,
      level: p.level ?? 1,
      dailyAttempts: p.daily_attempts || {},
    }));
  } catch (e) { return []; }
}

async function saveLB() {
  if (!sb || !CURRENT_USER) return;
  const { error } = await sb.from('templo_players').upsert({
    id: CURRENT_USER.id,
    weekly_points: G.pts ?? 0,
    streak: G.maxStreak ?? 0,
    correct: G.correct ?? 0,
    level: G.level ?? 1,
    xp: G.xp ?? 0,
    player_rank: G.rank ?? 0,
    char_gender: G.gender || 'm',
    char_variant: G.charVariant ?? 0,
    char_name: G.name || CURRENT_PROFILE?.templario_name || 'Templario',
    daily_attempts: G.dailyAttempts || {},
    answered_qids: G.answered_qids || {},
answered_qids_week: G.answered_qids_week || 0,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  if (error) console.error('[saveLB]', error.message);
  if (!error && _rankChannel && CURRENT_USER) _rankChannel.send({ type: 'broadcast', event: 'score_update', payload: { id: CURRENT_USER.id, name: G.name || 'Templario', pts: G.pts ?? 0 } });
  const store = usePlayerStore.getState();
  const diff = G.pts - store.cristales;
  if (diff !== 0) await store.addCristales(diff);
}

async function upsertPlayer(name, pts, streak, correct, av, email = '', gender = 'm', charVariant = 0, dailyAttempts = {}) {
  G.name = name;
  G.pts = pts;
  G.maxStreak = streak;
  G.correct = correct;
  G.av = av;
  G.gender = gender;
  G.charVariant = charVariant;
  G.dailyAttempts = dailyAttempts;
  await saveLB();
  return await fetchLB();
}

// ═══════════════════════════════════════════════════════════════
// NAVEGACIÓN Y UTILIDADES
// ═══════════════════════════════════════════════════════════════
function stopPolls() {
  ['mapPoll', 'livePoll', 'podPoll'].forEach(k => {
    if (G[k]) { clearInterval(G[k]); G[k] = null; }
  });
  Object.keys(_heroRAFs).forEach(k => {
    if (_heroRAFs[k]) { cancelAnimationFrame(_heroRAFs[k]); delete _heroRAFs[k]; }
  });
}


function pushNotif(msg, type = 'up') {
  const stack = document.getElementById('notifs');
  if (!stack) return;
  const n = document.createElement('div');
  n.className = 'notif n-' + type;
  n.textContent = msg;
  stack.appendChild(n);
  setTimeout(() => n.remove(), 4200);
  while (stack.children.length > 4) stack.removeChild(stack.firstChild);
}

function detectMovements(lb) {
  lb.forEach((p, ni) => {
    if (p.n === G.name) return;
    const oi = lastLBSnap.findIndex(x => x.n === p.n);
    if (oi < 0) pushNotif(p.n + ' entró al templo', 'join');
    else if (oi > ni && oi - ni >= 1) pushNotif(p.n + ' subió ' + (oi - ni) + ' lugar' + (oi - ni > 1 ? 'es' : ''), 'up');
    if (ni === 0) {
      const op = lastLBSnap.find(x => x.n === p.n);
      if (op && p.p > op.p) pushNotif('👑 ' + p.n + ' toma el liderazgo', 'lead');
    }
  });
  lastLBSnap = [...lb];
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE ACTUALIZACIÓN DE MAPA Y RANKING
// ═══════════════════════════════════════════════════════════════
function updateXP() {
  const xpMax = getXpMax();
  const xpBar = document.getElementById('xbar');
  if (xpBar) xpBar.style.width = (G.xp / xpMax * 100) + '%';
  const lvlSpan = document.getElementById('xlvl');
  if (lvlSpan) lvlSpan.textContent = G.level;
  const lblSpan = document.getElementById('xlbl');
  if (lblSpan) lblSpan.textContent = G.xp + '/' + xpMax + ' XP';
  const rankInfo = getRankInfo(G.rank);
  const rankSpan = document.getElementById('xrank');
  if (rankSpan) {
    rankSpan.textContent = G.rank > 0 ? `${rankInfo.emoji} ${rankInfo.label}` : '';
    rankSpan.style.color = rankInfo.color;
  }
}

function checkCouncil() {
  const btn = document.getElementById('ch-council');
  const lbl = document.getElementById('council-lbl');
  if (G.done.council) {
    if (btn) { btn.classList.add('done'); btn.classList.remove('locked'); }
    if (lbl) lbl.textContent = '✓ Completada';
  } else if (G.streak >= 2) {
    if (btn) { btn.classList.remove('locked'); }
    if (lbl) lbl.textContent = '🔓 Desbloqueada — ¡Entra!';
  } else {
    if (btn) { btn.classList.add('locked'); }
    if (lbl) lbl.textContent = `🔒 Racha: ${G.streak}/2 seguidas`;
  }
}

async function syncMap() {
  const plate = document.getElementById('map-plate');
  if (plate) plate.textContent = G.name + ' · ' + G.pts.toLocaleString() + ' pts';
  updateXP();
  checkCouncil();

  for (const k of ['c1', 'c2', 'c3', 'council']) {
    const ch = document.getElementById('ch-' + k);
    if (!ch) continue;

    if (G.done[k]) {
      ch.classList.add('done');
      ch.onclick = null;
      if (!ch.querySelector('.ck')) {
        const c = document.createElement('div');
        c.className = 'ck';
        c.style.cssText = 'position:absolute;top:6px;right:8px;color:var(--g2);font-size:.9rem;font-weight:700';
        c.textContent = '✓';
        ch.appendChild(c);
      }
    } else if (k === 'council') {
      if (G.streak >= 2) {
        ch.classList.remove('locked');
        ch.onclick = () => enterChamber('council');
      } else {
        ch.classList.add('locked');
        ch.onclick = null;
      }
    } else if (alreadyPlayedToday(k)) {
      ch.classList.add('locked');
      ch.onclick = null;
      if (!ch.querySelector('.daily-lbl')) {
        const lbl = document.createElement('div');
        lbl.className = 'daily-lbl';
        lbl.style.cssText = 'font-size:.58rem;color:#F97316;margin-top:.2rem;font-style:italic';
        lbl.textContent = '⏳ Vuelve mañana';
        ch.appendChild(lbl);
      }
    }
  }
  await updateMapPanel();
}

async function updateMapPanel() {
  const lb = await fetchLB();
  G.lbNow = lb;
  const ptsSpan = document.getElementById('map-mpts');
  if (ptsSpan) ptsSpan.textContent = G.pts.toLocaleString() + ' pts';
  const cntSpan = document.getElementById('map-cnt');
  if (cntSpan) cntSpan.textContent = '(' + lb.length + ' jugadores)';
  const refSpan = document.getElementById('map-ref');
  if (refSpan) {
    refSpan.textContent = 'ahora';
    setTimeout(() => { if (refSpan) refSpan.textContent = 'próx. 3s'; }, 700);
  }
  detectMovements(lb);
  const container = document.getElementById('map-rows');
  if (!container) return;
  const myRank = getRank(lb);
  const top8 = lb.slice(0, 8);
  container.innerHTML = '';
  top8.forEach((p, i) => {
    const rank = i + 1;
    const isMe = p.n === G.name;
    const avClass = AV[(p.av || 0) % 10];
    const init = p.n.slice(0, 2).toUpperCase();
    const medal = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
    const posClass = rank === 1 ? 'p1' : rank === 2 ? 'p2' : rank === 3 ? 'p3' : '';
    container.innerHTML += `<div class="rk-row ${isMe ? 'is-me' : ''}" style="animation:slideLeft .3s ease ${i * 0.04}s both">
      <span class="rk-pos ${posClass}">${rank}</span>
      <div class="rk-av ${avClass}" style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:.58rem;font-weight:700;flex-shrink:0">${init}</div>
      <span class="rk-name" style="font-size:.86rem">${p.n}${isMe ? '<span class="me-tag">TÚ</span>' : ''}</span>
      <span class="rk-pts">${p.p.toLocaleString()}</span>
      <span style="font-size:.7rem">${medal}</span>
    </div>`;
  });
  if (myRank > 8 && G.pts > 0) {
    const me = lb.find(p => p.n === G.name);
    if (me) {
      container.innerHTML += `<div style="height:1px;background:linear-gradient(90deg,transparent,var(--st3),transparent);margin:.2rem 0"></div>
      <div class="rk-row is-me">
        <span class="rk-pos">${myRank}</span>
        <div class="rk-av ${AV[G.av % 10]}" style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:.58rem;font-weight:700;flex-shrink:0">${G.name.slice(0, 2)}</div>
        <span class="rk-name" style="font-size:.86rem">${G.name}<span class="me-tag">TÚ</span></span>
        <span class="rk-pts">${G.pts.toLocaleString()}</span>
      </div>`;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// CINEMATIC AUDIO ENGINE — sincronizado con la intro
// Pega esta función ANTES de CinematicIntro (fuera del componente)
// ═══════════════════════════════════════════════════════════════

function createCinematicAudio() {
  let ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    // Si el browser bloquea audio, retorna objeto vacío silencioso
    return { playWhoosh: () => {}, playSlam: () => {}, playShimmer: () => {}, playSwordShing: () => {}, playTrophyReveal: () => {}, close: () => {} };
    
  }

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.75, ctx.currentTime);
  master.connect(ctx.destination);

  // Genera buffer de ruido blanco reutilizable
  function makeNoise(duration) {
    const size = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  // Curva de distorsión para el crack del impacto
  function makeDistortionCurve(amount = 300) {
    const samples = 512;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  return {
    // ─── WHOOSH: templario descendiendo del cielo (0ms → 500ms) ───
    // Ruido filtrado que baja en frecuencia = viento cortando el aire
    playWhoosh(delaySeconds = 0) {
      const t = ctx.currentTime + delaySeconds;

      const noise = ctx.createBufferSource();
      noise.buffer = makeNoise(0.55);

      // Filtro pasa-banda que baja: sonido de caída de altura a tierra
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.frequency.exponentialRampToValueAtTime(120, t + 0.48);
      filter.Q.value = 0.8;

      // Gain: sube rápido, crece hacia el impacto
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
      gain.gain.linearRampToValueAtTime(0.55, t + 0.44);
      gain.gain.linearRampToValueAtTime(0, t + 0.52); // corta justo antes del slam

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      noise.start(t);
    },

    // ─── SLAM: el momento que el templario toca tierra (520ms) ───
    // 3 capas simultáneas: sub-bass + crack + rumble de tierra
    playSlam(delaySeconds = 0) {
      const t = ctx.currentTime + delaySeconds;

      // CAPA 1: Sub-bass thud — el cuerpo golpea el suelo
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(180, t);
      subOsc.frequency.exponentialRampToValueAtTime(28, t + 0.35);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(1.4, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      subOsc.connect(subGain);
      subGain.connect(master);
      subOsc.start(t);
      subOsc.stop(t + 0.4);

      // CAPA 2: Crack de impacto — ruido corto y distorsionado
      const crackNoise = ctx.createBufferSource();
      crackNoise.buffer = makeNoise(0.12);

      // Envolvente de ruido con decay exponencial rápido
      const crackData = crackNoise.buffer.getChannelData(0);
      for (let i = 0; i < crackData.length; i++) {
        crackData[i] *= Math.exp(-i / (crackData.length * 0.08));
      }

      const distortion = ctx.createWaveShaper();
      distortion.curve = makeDistortionCurve(400);
      distortion.oversample = '4x';

      // High-pass para que el crack sea "seco" y percusivo
      const crackFilter = ctx.createBiquadFilter();
      crackFilter.type = 'highpass';
      crackFilter.frequency.value = 800;

      const crackGain = ctx.createGain();
      crackGain.gain.setValueAtTime(0.9, t);
      crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      crackNoise.connect(distortion);
      distortion.connect(crackFilter);
      crackFilter.connect(crackGain);
      crackGain.connect(master);
      crackNoise.start(t);

      // CAPA 3: Rumble de tierra — ondas sísmicas post-impacto
      const rumbleOsc = ctx.createOscillator();
      rumbleOsc.type = 'sawtooth';
      rumbleOsc.frequency.setValueAtTime(65, t);
      rumbleOsc.frequency.linearRampToValueAtTime(18, t + 0.7);

      const rumbleLPF = ctx.createBiquadFilter();
      rumbleLPF.type = 'lowpass';
      rumbleLPF.frequency.value = 90;
      rumbleLPF.Q.value = 2;

      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0, t);
      rumbleGain.gain.linearRampToValueAtTime(0.45, t + 0.04); // ataque mínimo
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.72);

      rumbleOsc.connect(rumbleLPF);
      rumbleLPF.connect(rumbleGain);
      rumbleGain.connect(master);
      rumbleOsc.start(t);
      rumbleOsc.stop(t + 0.75);

      // EXTRA: Mini "ring" metálico — resonancia de la copa vibrando con el impacto
      const ringOsc = ctx.createOscillator();
      ringOsc.type = 'sine';
      ringOsc.frequency.setValueAtTime(520, t + 0.02);
      ringOsc.frequency.exponentialRampToValueAtTime(440, t + 0.5);

      const ringGain = ctx.createGain();
      ringGain.gain.setValueAtTime(0.12, t + 0.02);
      ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      ringOsc.connect(ringGain);
      ringGain.connect(master);
      ringOsc.start(t + 0.02);
      ringOsc.stop(t + 0.5);
    },

    // ─── SHIMMER: el título aparece (700ms) ───
    // Armónicos dorados ascendentes = sensación de "grandeza revelada"
    playShimmer(delaySeconds = 0) {
      const t = ctx.currentTime + delaySeconds;
      const harmonics = [440, 660, 880, 1100, 1320];

      harmonics.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const gain = ctx.createGain();
        const onset = t + i * 0.025; // stagger escalonado
        gain.gain.setValueAtTime(0, onset);
        gain.gain.linearRampToValueAtTime(0.06 - i * 0.008, onset + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, onset + 0.55);

        osc.connect(gain);
        gain.connect(master);
        osc.start(onset);
        osc.stop(onset + 0.6);
      });

      // Brillo extra: noise de alta frecuencia muy suave = "polvo de oro"
      const glitterNoise = ctx.createBufferSource();
      glitterNoise.buffer = makeNoise(0.3);
      const glitterFilter = ctx.createBiquadFilter();
      glitterFilter.type = 'highpass';
      glitterFilter.frequency.value = 6000;
      const glitterGain = ctx.createGain();
      glitterGain.gain.setValueAtTime(0.06, t);
      glitterGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      glitterNoise.connect(glitterFilter);
      glitterFilter.connect(glitterGain);
      glitterGain.connect(master);
      glitterNoise.start(t);
    },

    // ─── COPA: aparece sobre el templo (370ms) ───
    // 4 capas: campana de cristal + peso de metal + brillo dorado + fanfarria
    playTrophyReveal(delaySeconds = 0) {
      const t = ctx.currentTime + delaySeconds;

      // CAPA 1: Campana de copa — Do-Do-Sol-Do (armónicos naturales del metal)
      [523, 1046, 1568, 2093].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        osc.type   = 'sine';
        osc.frequency.value = freq;
        const g    = ctx.createGain();
        const onset = t + i * 0.006;
        const vol   = [0.22, 0.14, 0.08, 0.04][i];
        const decay = [2.8,  1.6,  0.9,  0.5 ][i];
        g.gain.setValueAtTime(0, onset);
        g.gain.linearRampToValueAtTime(vol, onset + 0.007);
        g.gain.exponentialRampToValueAtTime(0.001, onset + decay);
        osc.connect(g); g.connect(master);
        osc.start(onset); osc.stop(onset + decay + 0.05);
      });

      // CAPA 2: Sub-grave — peso real del metal del trofeo
      const subOsc  = ctx.createOscillator();
      subOsc.type   = 'sine';
      subOsc.frequency.setValueAtTime(130, t);
      subOsc.frequency.exponentialRampToValueAtTime(90, t + 0.4);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.18, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      subOsc.connect(subGain); subGain.connect(master);
      subOsc.start(t); subOsc.stop(t + 0.55);

      // CAPA 3: Brillo dorado — aire y luz alrededor de la copa
      const glitter = ctx.createBufferSource();
      glitter.buffer = makeNoise(0.25);
      const gFilt = ctx.createBiquadFilter();
      gFilt.type = 'highpass';
      gFilt.frequency.value = 8000;
      const gGain = ctx.createGain();
      gGain.gain.setValueAtTime(0.05, t);
      gGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      glitter.connect(gFilt); gFilt.connect(gGain); gGain.connect(master);
      glitter.start(t);

      // CAPA 4: Fanfarria corta — Do-Mi-Sol (acorde mayor = campeón)
      [[261.6, 0], [329.6, 0.09], [392.0, 0.18]].forEach(([freq, delay]) => {
        const osc  = ctx.createOscillator();
        osc.type   = 'triangle';
        osc.frequency.setValueAtTime(freq * 0.97, t + delay);
        osc.frequency.linearRampToValueAtTime(freq, t + delay + 0.04);
        const filt = ctx.createBiquadFilter();
        filt.type  = 'lowpass';
        filt.frequency.value = freq * 3;
        const g    = ctx.createGain();
        g.gain.setValueAtTime(0, t + delay);
        g.gain.linearRampToValueAtTime(0.055, t + delay + 0.05);
        g.gain.setValueAtTime(0.055, t + delay + 0.18);
        g.gain.linearRampToValueAtTime(0, t + delay + 0.32);
        osc.connect(filt); filt.connect(g); g.connect(master);
        osc.start(t + delay); osc.stop(t + delay + 0.35);
      });
    },

    // ─── ESPADA: desenvaina 60ms después del slam ───
    playSwordShing(delaySeconds = 0) {
      const t = ctx.currentTime + delaySeconds;

      const scrapeSize = Math.floor(ctx.sampleRate * 0.18);
      const scrapeBuf  = ctx.createBuffer(1, scrapeSize, ctx.sampleRate);
      const scrapeData = scrapeBuf.getChannelData(0);
      for (let i = 0; i < scrapeSize; i++) {
        scrapeData[i] = (Math.random() * 2 - 1) * (i / scrapeSize);
      }
      const scrape = ctx.createBufferSource();
      scrape.buffer = scrapeBuf;

      const scrapeFilter = ctx.createBiquadFilter();
      scrapeFilter.type = 'bandpass';
      scrapeFilter.frequency.setValueAtTime(2800, t);
      scrapeFilter.frequency.linearRampToValueAtTime(5200, t + 0.18);
      scrapeFilter.Q.value = 1.8;

      const scrapeGain = ctx.createGain();
      scrapeGain.gain.setValueAtTime(0.12, t);
      scrapeGain.gain.linearRampToValueAtTime(0.32, t + 0.14);
      scrapeGain.gain.linearRampToValueAtTime(0,    t + 0.19);

      scrape.connect(scrapeFilter);
      scrapeFilter.connect(scrapeGain);
      scrapeGain.connect(master);
      scrape.start(t);

      [1180, 2360, 3540].forEach((freq, i) => {
        const osc   = ctx.createOscillator();
        osc.type    = 'sine';
        osc.frequency.value = freq;
        const g     = ctx.createGain();
        const onset = t + 0.17 + i * 0.008;
        const vol   = [0.18, 0.10, 0.05][i];
        const decay = [1.1,  0.65, 0.35][i];
        g.gain.setValueAtTime(vol, onset);
        g.gain.exponentialRampToValueAtTime(0.001, onset + decay);
        osc.connect(g);
        g.connect(master);
        osc.start(onset);
        osc.stop(onset + decay + 0.05);
      });

      const weightOsc = ctx.createOscillator();
      weightOsc.type  = 'sine';
      weightOsc.frequency.setValueAtTime(280, t + 0.16);
      weightOsc.frequency.exponentialRampToValueAtTime(140, t + 0.4);
      const weightGain = ctx.createGain();
      weightGain.gain.setValueAtTime(0.08, t + 0.16);
      weightGain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      weightOsc.connect(weightGain);
      weightGain.connect(master);
      weightOsc.start(t + 0.16);
      weightOsc.stop(t + 0.45);
    },

    // Cierra el contexto después de que termine la intro
    close(delaySeconds = 3.2) {
      setTimeout(() => {
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
        setTimeout(() => ctx.close().catch(() => {}), 200);
      }, delaySeconds * 1000);
    },
  };
}


// ═══════════════════════════════════════════════════════════════
// INTEGRACIÓN — dentro de CinematicIntro, en tu useEffect principal
// Busca los setTimeout existentes y agrega las llamadas de audio
// ═══════════════════════════════════════════════════════════════

/*
  PASO 1: Al inicio del useEffect (donde ya llamas el sonido existente),
  inicializa el motor de audio ANTES de los setTimeout:

    const sfx = createCinematicAudio();

  PASO 2: En el setTimeout de 0ms (partículas burst), agrega:
    sfx.playWhoosh(0);          // whoosh empieza con la caída

  PASO 3: En el setTimeout de 520ms (templario aterriza / slam), agrega:
    sfx.playSlam(0);            // SLAM sincronizado exacto

  PASO 4: En el setTimeout de 700ms (título aparece), agrega:
    sfx.playShimmer(0);         // shimmer con el texto

  PASO 5: Al final (onEnd o setTimeout de 3000ms), agrega:
    sfx.close(0.2);             // fade y cierra contexto limpiamente

  ─────────────────────────────────────────────────────────────
  EJEMPLO de cómo debería quedar tu bloque de useEffect:
  ─────────────────────────────────────────────────────────────

  useEffect(() => {
    // ... tu lógica de canvas y audio existente ...
    const sfx = createCinematicAudio();          // ← AGREGA ESTO

    // Tu sonido original (no lo tocamos)
    playYourExistingSound();

    // Partículas burst
    setTimeout(() => {
      sfx.playWhoosh(0);                          // ← AGREGA
      // ... tu código de partículas ...
    }, 0);

    // Templario aparece y empieza a caer
    // (si tienes un setTimeout para iniciar la caída, agrega playWhoosh ahí en vez de arriba)

    // Slam del templario
    setTimeout(() => {
      sfx.playSlam(0);                            // ← AGREGA
      // ... tu código de shockwave, pantalla shake ...
    }, 520);

    // Título aparece
    setTimeout(() => {
      sfx.playShimmer(0);                         // ← AGREGA
      // ... tu código del título ...
    }, 700);

    // Fin
    setTimeout(() => {
      sfx.close(0.2);    
            sfx.playShimmer(0);  // ← AGREGA (en el setTimeout de 700ms si existe, o junto al título)
      sfx.close(0.2);                          // ← AGREGA
      onEnd?.();
    }, 3000);

  }, []);
*/

// ═══════════════════════════════════════════════════════════════
// CINEMATIC INTRO — "THE DESCENT" (reescrito, 3s, épico)
// CAMBIOS CLAVE vs original:
//   ❌ charX walking → ✅ caída desde el cielo (easeInQuad + bounce)
//   ❌ personaje izquierda → ✅ centrado (como la foto original)
//   ❌ sin trofeo → ✅ copa sobre el templo con glow pulsante
//   ❌ regalos/runas lentas → ✅ burst de partículas doradas al inicio
//   ❌ relámpagos largos → ✅ shockwave + polvo en el impacto
//   ❌ saludo en 1800ms → ✅ saludo en 650ms con underline animado
//   ❌ título en 1000ms → ✅ título en 700ms
//   ❌ termina en 3700ms → ✅ termina en 3000ms
//   ✅ Audio: sin cambios (GAME_AUDIO intacto)
// ═══════════════════════════════════════════════════════════════
function CinematicIntro({ onEnd }) {
  const canvasRef = useRef(null);
  const topBarRef = useRef(null);
  const bottomBarRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w = window.innerWidth;
    let h = window.innerHeight;
    let animationId = null;
    let startTime = null;
    const sfx = createCinematicAudio(); // ← AGREGA
    sfx.playWhoosh(0);           

    // ── Estado de impacto ──
    let screenShake = 0;
    let impactTriggered = false;
    let shockwaveProgress = -1;
    let dustParticles = [];

    // ── Tiempos clave (ms) ──
    const IMPACT_MS  = 520;   // personaje aterriza
    const TITLE_MS   = 700;   // título aparece
    const GREET_MS   = 650;   // saludo jugador
    const END_MS     = 3000;  // total

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width  = w;
      canvas.height = h;
    };
    window.addEventListener('resize', resize);
    resize();

    // ── Burst de partículas doradas (centro de pantalla al inicio) ──
    // Se crean con posición real después de conocer w/h
    const burstParticles = Array.from({ length: 88 }, () => ({
      x: w * 0.5,
      y: h * 0.44,
      angle: Math.random() * Math.PI * 2,
      speed: 2.5 + Math.random() * 8.5,
      life: 0.8 + Math.random() * 0.2,
      decay: 0.017 + Math.random() * 0.022,
      r: 0.8 + Math.random() * 2.8,
      color: Math.random() > 0.4 ? '#E8C97A' : '#F5E4A8',
    }));

    // ── Partículas ambientales (pocas, más rápidas que el original) ──
    const ambientParts = Array.from({ length: 32 }, () => ({
      x: Math.random() * w,
      y: h + Math.random() * 40,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(0.4 + Math.random() * 1.4),
      life: Math.random(),
      decay: 0.003 + Math.random() * 0.005,
      r: 0.5 + Math.random() * 1.8,
    }));

    // ── Nombre del jugador ──
    let playerGreeting = '';
    if (typeof CURRENT_PROFILE !== 'undefined' && CURRENT_PROFILE?.templario_name)
      playerGreeting = CURRENT_PROFILE.templario_name.toUpperCase();
    else if (typeof CURRENT_USER !== 'undefined' && CURRENT_USER?.email)
      playerGreeting = CURRENT_USER.email.split('@')[0].toUpperCase();

    // ── Funciones de easing ──
    function easeInQuad(t) { return t * t; }
    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

   // ── Copa épica con rayos y glow ──
    function drawTrophy(cx, cy, size, alpha, t) {
      if (alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = alpha;

      const pulse = 0.5 + Math.sin(t * 4.2) * 0.3;

      // Halo exterior grande pulsante
      const outerGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 3.8);
      outerGrd.addColorStop(0,   `rgba(255,220,100,${0.45 * pulse})`);
      outerGrd.addColorStop(0.35,`rgba(201,168,76,${0.18 * pulse})`);
      outerGrd.addColorStop(1,   'rgba(201,168,76,0)');
      ctx.fillStyle = outerGrd;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 3.8, 0, Math.PI * 2);
      ctx.fill();

      // Rayos de luz (8 rayos girando lento)
      ctx.save();
      ctx.translate(cx, cy);
      for (let i = 0; i < 8; i++) {
        const angle   = (i / 8) * Math.PI * 2 + t * 0.6;
        const len     = size * (2.0 + Math.sin(t * 2.5 + i) * 0.5);
        const rAlpha  = (0.13 + Math.sin(t * 2 + i * 0.9) * 0.06) * pulse;
        ctx.strokeStyle = `rgba(255,220,100,${rAlpha})`;
        ctx.lineWidth   = size * 0.055;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * size * 0.55, Math.sin(angle) * size * 0.55);
        ctx.lineTo(Math.cos(angle) * len,          Math.sin(angle) * len);
        ctx.stroke();
      }
      ctx.restore();

      // Sombra dorada
      ctx.shadowColor = '#F4C542';
      ctx.shadowBlur  = size * 1.1;

      // Copa — cuerpo
      ctx.strokeStyle = '#E8C97A';
      ctx.fillStyle   = 'rgba(201,168,76,0.28)';
      ctx.lineWidth   = Math.max(1.5, size * 0.075);
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';

      ctx.beginPath();
      ctx.moveTo(cx - size * 0.45, cy - size * 0.52);
      ctx.bezierCurveTo(cx - size * 0.54, cy - size * 0.05, cx - size * 0.28, cy + size * 0.24, cx, cy + size * 0.32);
      ctx.bezierCurveTo(cx + size * 0.28, cy + size * 0.24, cx + size * 0.54, cy - size * 0.05, cx + size * 0.45, cy - size * 0.52);
      ctx.lineTo(cx - size * 0.45, cy - size * 0.52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Borde superior
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.54, cy - size * 0.52);
      ctx.lineTo(cx + size * 0.54, cy - size * 0.52);
      ctx.stroke();

      // Brillo interno (reflejo)
      ctx.save();
      ctx.globalAlpha = alpha * 0.35;
      const innerGrd = ctx.createLinearGradient(cx - size * 0.3, cy - size * 0.45, cx, cy);
      innerGrd.addColorStop(0, 'rgba(255,240,180,0.9)');
      innerGrd.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = innerGrd;
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.35, cy - size * 0.48);
      ctx.bezierCurveTo(cx - size * 0.42, cy - size * 0.1, cx - size * 0.22, cy + size * 0.15, cx - size * 0.08, cy + size * 0.28);
      ctx.lineTo(cx - size * 0.08, cy - size * 0.48);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Asa izquierda
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.43, cy - size * 0.26);
      ctx.bezierCurveTo(cx - size * 0.72, cy - size * 0.26, cx - size * 0.72, cy + size * 0.1, cx - size * 0.28, cy + size * 0.1);
      ctx.stroke();

      // Asa derecha
      ctx.beginPath();
      ctx.moveTo(cx + size * 0.43, cy - size * 0.26);
      ctx.bezierCurveTo(cx + size * 0.72, cy - size * 0.26, cx + size * 0.72, cy + size * 0.1, cx + size * 0.28, cy + size * 0.1);
      ctx.stroke();

      // Pie
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.11, cy + size * 0.32);
      ctx.lineTo(cx - size * 0.15, cy + size * 0.64);
      ctx.lineTo(cx + size * 0.15, cy + size * 0.64);
      ctx.lineTo(cx + size * 0.11, cy + size * 0.32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Base
      ctx.beginPath();
      ctx.rect(cx - size * 0.32, cy + size * 0.64, size * 0.64, size * 0.13);
      ctx.fill();
      ctx.stroke();

      // Estrella pulsante encima de la copa
      ctx.shadowBlur = size * 2;
      ctx.shadowColor = '#FFE566';
      const starPulse = 0.7 + Math.sin(t * 5.5) * 0.3;
      ctx.fillStyle = `rgba(255,240,150,${starPulse})`;
      ctx.beginPath();
      ctx.arc(cx, cy - size * 0.68, size * 0.14, 0, Math.PI * 2);
      ctx.fill();

      // Destello cruzado en la estrella
      ctx.strokeStyle = `rgba(255,255,200,${starPulse * 0.8})`;
      ctx.lineWidth   = size * 0.04;
      ctx.shadowBlur  = size * 1.5;
      [-1, 1].forEach(dir => {
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.25 * dir, cy - size * 0.68);
        ctx.lineTo(cx + size * 0.25 * dir, cy - size * 0.68);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy - size * 0.68 - size * 0.25 * dir);
        ctx.lineTo(cx, cy - size * 0.68 + size * 0.25 * dir);
        ctx.stroke();
      });

      ctx.restore();
    }

    // ── Shockwave en el suelo ──
    function drawShockwave(cx, floorY, progress) {
      if (progress < 0 || progress >= 1) return;
      const r = easeOutQuart(progress) * Math.min(w, h) * 0.38;
      const alpha = Math.pow(1 - progress, 2.2) * 0.9;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#C9A84C';
      ctx.lineWidth = (1 - progress) * 4 + 0.5;
      ctx.beginPath();
      ctx.ellipse(cx, floorY, r, r * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.45;
      ctx.beginPath();
      ctx.ellipse(cx, floorY, r * 0.55, r * 0.2 * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // ── Loop principal ──
    function drawFrame(now) {
      if (!animationId) return;
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const t = elapsed * 0.001;
      const floorY = h * 0.75;
      const cx = w * 0.5;

      // Disparar impacto exactamente en IMPACT_MS
      if (elapsed >= IMPACT_MS && !impactTriggered) {
        impactTriggered = true;
        sfx.playSlam(0);
        sfx.playSwordShing(0.06);
        screenShake = 18;
        shockwaveProgress = 0;
        dustParticles = Array.from({ length: 44 }, () => ({
          x: cx + (Math.random() - 0.5) * 90,
          y: floorY,
          vx: (Math.random() - 0.5) * 7,
          vy: -(1.5 + Math.random() * 4.5),
          life: 1,
          r: 1.5 + Math.random() * 4,
        }));
      }

      // Shake decae
      const shakeX = screenShake > 0.35 ? (Math.random() - 0.5) * screenShake : 0;
      const shakeY = screenShake > 0.35 ? (Math.random() - 0.5) * screenShake * 0.55 : 0;
      screenShake *= 0.73;

      ctx.save();
      ctx.translate(shakeX, shakeY);
      ctx.clearRect(-40, -40, w + 80, h + 80);
      ctx.fillStyle = '#000';
      ctx.fillRect(-40, -40, w + 80, h + 80);

      // ══ 1. BURST DE PARTÍCULAS DORADAS (primeros 1.4s) ══
      if (elapsed > 60 && elapsed < 1400) {
        burstParticles.forEach(p => {
          p.x     += Math.cos(p.angle) * p.speed;
          p.y     += Math.sin(p.angle) * p.speed;
          p.speed *= 0.93;
          p.life  -= p.decay;
          if (p.life > 0) {
            ctx.globalAlpha = p.life * 0.7;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.globalAlpha = 1;
      }

      // ══ 2. PARTÍCULAS AMBIENTALES ══
      ambientParts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        if (p.life <= 0 || p.y < -10) {
          p.x = Math.random() * w; p.y = h + 5;
          p.life = 0.45 + Math.random() * 0.55;
        }
        ctx.globalAlpha = p.life * 0.14;
        ctx.fillStyle = '#E8C97A';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // ══ 3. SUELO ══
      const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
      floorGrad.addColorStop(0, 'rgba(42,28,8,0.62)');
      floorGrad.addColorStop(0.55, 'rgba(12,8,2,0.9)');
      floorGrad.addColorStop(1, '#000');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, floorY, w, h - floorY + 20);

      // Línea de suelo dorada
      const floorLine = ctx.createLinearGradient(0, floorY, w, floorY);
      floorLine.addColorStop(0,    'rgba(201,168,76,0)');
      floorLine.addColorStop(0.22, 'rgba(201,168,76,0.5)');
      floorLine.addColorStop(0.5,  'rgba(232,201,122,1)');
      floorLine.addColorStop(0.78, 'rgba(201,168,76,0.5)');
      floorLine.addColorStop(1,    'rgba(201,168,76,0)');
      ctx.strokeStyle = floorLine;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(w, floorY); ctx.stroke();

      // ══ 4. TEMPLO (aparece en los primeros 350ms) ══
      const tmplAlpha = Math.min(1, elapsed / 340);
      if (tmplAlpha > 0) {
        const tmplW = Math.min(w * 0.54, 290);
      const tmplH = Math.min(h * 0.48, tmplW * 1.45);
      const ty    = floorY - tmplH;
        const pulse = 0.14 + Math.sin(t * 1.85) * 0.07;

        ctx.globalAlpha = tmplAlpha;

        // Resplandor del templo
        const tg = ctx.createRadialGradient(cx, h * 0.46, 0, cx, h * 0.46, tmplW * 2.4);
        tg.addColorStop(0, `rgba(201,168,76,${pulse * 0.85})`);
        tg.addColorStop(0.55, `rgba(201,168,76,${pulse * 0.15})`);
        tg.addColorStop(1, 'rgba(201,168,76,0)');
        ctx.fillStyle = tg;
        ctx.fillRect(0, 0, w, h);

        // Cuerpo
        ctx.fillStyle   = '#080602';
        ctx.strokeStyle = `rgba(201,168,76,${0.38 + Math.sin(t * 2.1) * 0.1})`;
        ctx.lineWidth   = 2;
        ctx.beginPath(); ctx.rect(cx - tmplW / 2, ty, tmplW, tmplH); ctx.fill(); ctx.stroke();

        // Techo
        ctx.fillStyle   = '#0B0904';
        ctx.strokeStyle = `rgba(201,168,76,${0.52 + Math.sin(t * 2) * 0.12})`;
        ctx.lineWidth   = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - tmplW * 0.62, ty);
        ctx.lineTo(cx, ty - tmplW * 0.47);
        ctx.lineTo(cx + tmplW * 0.62, ty);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Columnas
        [-0.4, -0.14, 0.14, 0.4].forEach(ox => {
          const cw = tmplW * 0.11;
          ctx.fillStyle   = '#0E0B05';
          ctx.strokeStyle = 'rgba(201,168,76,0.2)';
          ctx.lineWidth   = 1;
          ctx.beginPath(); ctx.rect(cx + ox * tmplW - cw / 2, ty, cw, tmplH); ctx.fill(); ctx.stroke();
        });

        // Puerta con glow
        const doorW   = tmplW * 0.24;
        const doorH   = h * 0.23;
        const doorY   = floorY - doorH;
        const glowInt = 0.28 + Math.sin(t * 2.65) * 0.13;
        const dg = ctx.createRadialGradient(cx, doorY + doorH * 0.5, 0, cx, doorY + doorH * 0.5, doorW * 2.8);
        dg.addColorStop(0, `rgba(201,168,76,${glowInt})`);
        dg.addColorStop(1, 'rgba(201,168,76,0)');
        ctx.fillStyle   = dg;
        ctx.fillRect(cx - doorW * 3, doorY - 20, doorW * 6, doorH + 50);
        ctx.fillStyle   = 'rgba(201,168,76,0.07)';
        ctx.strokeStyle = `rgba(201,168,76,${0.55 + Math.sin(t * 2.65) * 0.2})`;
        ctx.lineWidth   = 1.5;
        ctx.beginPath(); ctx.rect(cx - doorW / 2, doorY, doorW, doorH); ctx.fill(); ctx.stroke();

        // ── COPA (encima del techo) ──
        const roofTip    = ty - tmplW * 0.47;
        const trophyAlpha = Math.min(1, (elapsed - 140) / 230) * tmplAlpha;
        const trophySize  = Math.min(w * 0.12, 72) * (0.96 + Math.sin(t * 3.1) * 0.04);
        drawTrophy(cx, roofTip - trophySize * 0.5, trophySize, trophyAlpha, t);

        ctx.globalAlpha = 1;
      }

      // ══ 5. PERSONAJE — CAÍDA DESDE EL CIELO ══
      const dropT = Math.min(1, elapsed / IMPACT_MS);
      let charFloorY;

      if (elapsed < IMPACT_MS) {
        // Fase caída: easeInQuad simula gravedad (lento → rápido)
        const fall = easeInQuad(dropT);
        charFloorY = -160 + (floorY + 160) * fall;
      } else {
        // Fase post-impacto: pequeño rebote amortiguado
        const bt = Math.min(1, (elapsed - IMPACT_MS) / 380);
        charFloorY = floorY - Math.sin(bt * Math.PI) * 22 * (1 - bt * 0.6);
      }

      const charScale = Math.min(0.74, w / 730); // más grande que el original
      const charGender  = (typeof G !== 'undefined' && G?.gender)      || 'm';
      const charVariant = (typeof G !== 'undefined' && G?.charVariant) || 0;
      const charDef = (CHAR_VARIANTS[charGender] || CHAR_VARIANTS['m'])[charVariant] || CHAR_VARIANTS['m'][0];

      ctx.save();
      ctx.scale(charScale, charScale);
      drawCSChar(ctx, cx / charScale, charFloorY / charScale, charDef, charGender, elapsed, 220, 340);
      ctx.restore();

      // Sombra dinámica (crece al acercarse al suelo)
      const shadowGrow = Math.min(1, easeInQuad(dropT));
      ctx.globalAlpha = 0.3 * shadowGrow;
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      ctx.beginPath();
      ctx.ellipse(cx, floorY + 3, 28 * charScale * shadowGrow, 6 * charScale * shadowGrow, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Aura del personaje (aparece al acercarse al suelo)
      if (dropT > 0.35) {
        const aIntensity = (dropT - 0.35) * 0.75 * (0.5 + Math.sin(t * 3.4) * 0.3);
        const aura = ctx.createRadialGradient(cx, floorY - 75, 0, cx, floorY - 75, 100);
        aura.addColorStop(0, `rgba(201,168,76,${aIntensity})`);
        aura.addColorStop(1, 'rgba(201,168,76,0)');
        ctx.fillStyle = aura;
        ctx.fillRect(cx - 100, floorY - 175, 200, 200);
      }

      // ══ 6. SHOCKWAVE + POLVO (en el impacto) ══
      if (shockwaveProgress >= 0) {
        shockwaveProgress = Math.min(1, shockwaveProgress + 0.034);
        drawShockwave(cx, floorY, shockwaveProgress);
      }

      dustParticles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy  += 0.13; // gravedad
        p.life -= 0.03;
        if (p.life > 0) {
          ctx.globalAlpha = p.life * 0.55;
          ctx.fillStyle = '#C9A84C';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * Math.max(0, p.life), 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      // ══ 7. SALUDO AL JUGADOR — ÉPICO ══
      if (playerGreeting && elapsed > GREET_MS) {
        const raw    = Math.min(1, (elapsed - GREET_MS) / 500);
        const eOut   = 1 - Math.pow(1 - raw, 3);          // easeOutCubic
        const gAlpha = eOut;
        const pulse  = 0.88 + Math.sin(t * 2.2) * 0.12;

        const subFS = Math.max(11, Math.round(w * 0.018));
        const nameFS = Math.max(w < 600 ? 20 : 28, Math.round(w * 0.058));
        ctx.font = `700 ${nameFS}px 'Cinzel Decorative', serif`;
        const nameWords = playerGreeting.split(' ');
        const nameLines = [];
        let currentLine = '';
        nameWords.forEach(word => {
          const test = currentLine ? currentLine + ' ' + word : word;
          if (ctx.measureText(test).width > w * 0.82 && currentLine) {
            nameLines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = test;
          }
        });
        if (currentLine) nameLines.push(currentLine);
        const textY  = h * 0.30;

        ctx.save();

        // ── Halo de fondo detrás del texto ──
        const haloR = nameFS * 4.5;
        const halo  = ctx.createRadialGradient(cx, textY + nameFS * 0.6, 0, cx, textY + nameFS * 0.6, haloR);
        halo.addColorStop(0,   `rgba(201,168,76,${0.22 * gAlpha * pulse})`);
        halo.addColorStop(0.4, `rgba(120,80,10,${0.10 * gAlpha})`);
        halo.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.ellipse(cx, textY + nameFS * 0.6, haloR, haloR * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = gAlpha;
        ctx.textAlign   = 'center';

        // ── "BIENVENIDO," ──
        ctx.font        = `400 ${subFS}px 'Cinzel', serif`;
        ctx.letterSpacing = '0.35em';
        // sombra exterior
        ctx.shadowColor = 'rgba(201,168,76,0.6)';
        ctx.shadowBlur  = 18;
        ctx.fillStyle   = 'rgba(240,228,190,0.75)';
        ctx.fillText('BIENVENIDO,', cx, textY);
        // texto limpio encima
        ctx.shadowBlur  = 0;
        ctx.fillStyle   = '#EFE0B8';
        ctx.fillText('BIENVENIDO,', cx, textY);

        // ── Nombre: 3 pasadas para máximo glow ──
        ctx.font = `700 ${nameFS}px 'Cinzel Decorative', serif`;

        // Pasada 1 — bloom exterior
        ctx.globalAlpha = gAlpha * 0.35 * pulse;
        ctx.shadowColor = '#FFDD66';
        ctx.shadowBlur  = 60;
        ctx.fillStyle   = '#FFD700';
        nameLines.forEach((line, li) => ctx.fillText(line, cx, textY + nameFS * 1.18 + li * nameFS * 1.15));

        // Pasada 2 — glow medio
        ctx.globalAlpha = gAlpha * 0.65 * pulse;
        ctx.shadowColor = '#F4C542';
        ctx.shadowBlur  = 28;
        ctx.fillStyle   = '#F5E070';
        nameLines.forEach((line, li) => ctx.fillText(line, cx, textY + nameFS * 1.18 + li * nameFS * 1.15));

        // Pasada 3 — texto nítido encima
        ctx.globalAlpha = gAlpha;
        ctx.shadowColor = 'rgba(255,220,80,0.9)';
        ctx.shadowBlur  = 10;
        // gradiente dorado de arriba a abajo
        const tg = ctx.createLinearGradient(
          cx, textY + nameFS * 0.18,
          cx, textY + nameFS * 1.18
        );
        tg.addColorStop(0,    '#FFFDE0');
        tg.addColorStop(0.35, '#F4C542');
        tg.addColorStop(0.7,  '#E8A820');
        tg.addColorStop(1,    '#C9850A');
        ctx.fillStyle = tg;
        nameLines.forEach((line, li) => ctx.fillText(line, cx, textY + nameFS * 1.18 + li * nameFS * 1.15));

        // ── Línea dorada que crece desde el centro ──
        ctx.shadowBlur = 0;
        ctx.font = `700 ${nameFS}px 'Cinzel Decorative', serif`;
        const tw       = Math.max(...nameLines.map(l => ctx.measureText(l).width));
        const frac     = Math.min(1, (elapsed - GREET_MS) / 700);
        const lineY    = textY + nameFS * 1.18 + (nameLines.length - 1) * nameFS * 1.15 + nameFS * 0.22;
        const lineHalf = (tw * 0.54) * frac;
        const lg = ctx.createLinearGradient(cx - lineHalf, lineY, cx + lineHalf, lineY);
        lg.addColorStop(0,   'rgba(201,168,76,0)');
        lg.addColorStop(0.3, 'rgba(244,197,66,0.9)');
        lg.addColorStop(0.5, '#FFE566');
        lg.addColorStop(0.7, 'rgba(244,197,66,0.9)');
        lg.addColorStop(1,   'rgba(201,168,76,0)');
        ctx.globalAlpha = gAlpha * 0.85;
        ctx.strokeStyle = lg;
        ctx.lineWidth   = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx - lineHalf, lineY);
        ctx.lineTo(cx + lineHalf, lineY);
        ctx.stroke();

        ctx.restore();
      }

      // ══ 8. VIGNETTE ══
      const vig = ctx.createRadialGradient(cx, h / 2, h * 0.08, cx, h / 2, w * 0.72);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(0.42, 'rgba(0,0,0,0.04)');
      vig.addColorStop(1, 'rgba(0,0,0,0.96)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      // ══ 9. FADE IN (primeros 280ms) ══
      if (elapsed < 280) {
        ctx.fillStyle = `rgba(0,0,0,${1 - elapsed / 280})`;
        ctx.fillRect(-40, -40, w + 80, h + 80);
      }

      // ══ 10. FADE OUT (últimos 420ms) ══
      if (elapsed > END_MS - 420) {
        const fo = Math.min(1, (elapsed - (END_MS - 420)) / 420);
        ctx.fillStyle = `rgba(0,0,0,${fo})`;
        ctx.fillRect(-40, -40, w + 80, h + 80);
      }

      ctx.restore();
      animationId = requestAnimationFrame(drawFrame);
    }

    // ── Timers HTML ──
    const barsTimeout  = setTimeout(() => {
      if (topBarRef.current)    topBarRef.current.classList.add('open');
      if (bottomBarRef.current) bottomBarRef.current.classList.add('open');
    }, 180);

    const trophyTimeout = setTimeout(() => {
      sfx.playTrophyReveal(0);   // copa aparece completamente visible
    }, 370);

    const titleTimeout = setTimeout(() => {
  if (titleRef.current) titleRef.current.classList.add('show');
  sfx.playShimmer(0);  // ← AGREGA
}, TITLE_MS);

    const endTimeout   = setTimeout(() => {
  cancelAnimationFrame(animationId);
  animationId = null;
  sfx.close(0.2);  // ← AGREGA
  onEnd();
}, END_MS);

    animationId = requestAnimationFrame(drawFrame);

    // ── Audio: sfx maneja toda la cinemática ──
    try { GAME_AUDIO.init(); } catch(e) {}

    return () => {
      cancelAnimationFrame(animationId);
      animationId = null;
      clearTimeout(barsTimeout);
      clearTimeout(trophyTimeout);
      clearTimeout(titleTimeout);
      clearTimeout(endTimeout);
      window.removeEventListener('resize', resize);
      try { GAME_AUDIO.destroy(); } catch(e) {}
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      id="cin-screen"
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Barras cinemáticas — transición más rápida */}
      <div
        ref={topBarRef}
        className="cin-bars-top"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: window.innerWidth < 600 ? '44px' : '80px', background: '#000', zIndex: 3,
          transition: 'transform 0.52s cubic-bezier(.77,0,.18,1)',
        }}
      />
      <div
        ref={bottomBarRef}
        className="cin-bars-bot"
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: window.innerWidth < 600 ? '44px' : '80px', background: '#000', zIndex: 3,
          transition: 'transform 0.52s cubic-bezier(.77,0,.18,1)',
        }}
      />

      <canvas
        ref={canvasRef}
        id="cin-canvas"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      <div
        className="cin-vignette"
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,.85) 100%)',
          pointerEvents: 'none', zIndex: 2,
        }}
      />

      {/* Título overlay — fade más rápido, texto corregido */}
      <div
        ref={titleRef}
        className="cin-title-overlay"
        style={{
          position: 'absolute', bottom: window.innerWidth < 600 ? '55px' : '100px', left: 0, right: 0,
          textAlign: 'center', zIndex: 4,
          opacity: 0, transition: 'opacity .42s ease-out',
        }}
      >
        <div
          style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 'clamp(1.4rem, 5vw, 2.8rem)',
            color: '#E8C97A',
            letterSpacing: '.12em',
            textShadow: '0 0 60px rgba(201,168,76,.9), 0 0 120px rgba(201,168,76,.4)',
          }}
        >
          TEMPLO DEL PROPÓSITO
        </div>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(.6rem, 2vw, .85rem)',
            color: '#C9A84C',
            letterSpacing: '.45em',
            marginTop: '.5rem',
            opacity: '.75',
          }}
        >
          COMPETENCIA EN VIVO
        </div>
      </div>

      {/* Skip */}
      <div
        onClick={onEnd}
        style={{
          position: 'absolute', bottom: '20px', right: '20px', zIndex: 10,
          fontFamily: "'Cinzel', serif", fontSize: '.65rem',
          color: 'rgba(201,168,76,.45)', letterSpacing: '.15em',
          cursor: 'pointer',
          border: '1px solid rgba(201,168,76,.18)',
          padding: '.3rem .7rem',
        }}
      >
        SALTAR ▶
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE CHAR SELECT (selector de personaje)
// ═══════════════════════════════════════════════════════════════
function CharSelect({ onConfirm }) {
  const [gender, setGender] = useState(G.gender || 'm');
  const [variant, setVariant] = useState(G.charVariant || 0);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const variants = CHAR_VARIANTS[gender];
  const currentVariant = variants[variant];

  // Resolución fija del canvas — se escala con CSS
  const CW = 340, CH = 500;

  useEffect(() => {
    const setVH = () =>
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    setVH();
    window.addEventListener('resize', setVH);
    return () => window.removeEventListener('resize', setVH);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let startTime = performance.now();

    function draw(now) {
      const elapsed = now - startTime;
      const t = elapsed * 0.001;
      ctx.clearRect(0, 0, CW, CH);

      // Fondo oscuro atmosférico
      ctx.fillStyle = '#05020C';
      ctx.fillRect(0, 0, CW, CH);

      // Resplandor dorado pulsante desde el suelo
      const pulse = 0.55 + Math.sin(t * 1.7) * 0.25;
      const groundGlow = ctx.createRadialGradient(CW/2, CH*0.92, 0, CW/2, CH*0.92, CW*0.8);
      groundGlow.addColorStop(0, `rgba(201,168,76,${0.45*pulse})`);
      groundGlow.addColorStop(0.35, `rgba(201,168,76,${0.14*pulse})`);
      groundGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = groundGlow;
      ctx.fillRect(0, 0, CW, CH);

      // Aura mística desde arriba (violeta suave)
      const topGlow = ctx.createRadialGradient(CW/2, CH*0.12, 0, CW/2, CH*0.12, CW*0.55);
      topGlow.addColorStop(0, `rgba(110,60,200,${0.10*pulse})`);
      topGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, CW, CH);

      // Partículas flotantes
      const seed = Math.floor(t * 0.3);
      for (let i = 0; i < 12; i++) {
        const px = ((Math.sin(i * 2.4 + seed) * 0.5 + 0.5) * CW * 0.8) + CW * 0.1;
        const phase = (t * 0.08 + i * 0.13) % 1;
        const py = CH - phase * CH * 1.1;
        const alpha = phase < 0.15 ? phase / 0.15 : phase > 0.8 ? (1 - phase) / 0.2 : 0.4;
        ctx.globalAlpha = alpha * 0.55;
        ctx.fillStyle = i % 3 === 0 ? '#E8C97A' : i % 3 === 1 ? '#C9A84C' : '#F5E4A8';
        ctx.beginPath();
        ctx.arc(px, py, 1.2 + Math.sin(i * 1.3 + t) * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const floorY = CH * 0.87;

      // Línea del suelo dorada
      const lineGrad = ctx.createLinearGradient(0, floorY, CW, floorY);
      lineGrad.addColorStop(0,    'rgba(201,168,76,0)');
      lineGrad.addColorStop(0.2,  `rgba(201,168,76,${0.7*pulse})`);
      lineGrad.addColorStop(0.5,  `rgba(232,201,122,${pulse})`);
      lineGrad.addColorStop(0.8,  `rgba(201,168,76,${0.7*pulse})`);
      lineGrad.addColorStop(1,    'rgba(201,168,76,0)');
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(CW, floorY);
      ctx.stroke();

      // Sombra del personaje
      ctx.save();
      ctx.globalAlpha = 0.38 * pulse;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(CW/2, floorY + 6, 46, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Personaje
      drawCSChar(ctx, CW/2, floorY, currentVariant, gender, elapsed, CW, CH);

      // Viñeta
      const vig = ctx.createRadialGradient(CW/2, CH*0.5, CH*0.08, CW/2, CH*0.5, CW*0.8);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(0.6, 'rgba(0,0,0,0.04)');
      vig.addColorStop(1, 'rgba(0,0,0,0.78)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, CW, CH);

      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [gender, variant, currentVariant]);

  const selectGender = (g) => { setGender(g); setVariant(0); };
  const selectVariant = (idx) => setVariant(idx);

  const confirmCharacter = async () => {
    G.gender = gender;
    G.charVariant = variant;
    G.av = variant;
    G.name = currentVariant.name;
    await saveLB();
    await loadWeekQuestions();
    G.lbPrev = await fetchLB();
    G.lbNow = [...G.lbPrev];
    lastLBSnap = [...G.lbPrev];
    onConfirm();
  };

  const isMobile = window.innerWidth < 700;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 20,
      background: '#060308',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      overflowY: isMobile ? 'auto' : 'hidden',
      fontFamily: "'Cinzel', serif",
    }}>

      {/* ══ PANEL PERSONAJE ══ */}
      <div style={{
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        background: 'linear-gradient(160deg, #030210 0%, #07040F 55%, #0A0702 100%)',
        borderRight: isMobile ? 'none' : '1px solid rgba(201,168,76,0.18)',
        borderBottom: isMobile ? '1px solid rgba(201,168,76,0.15)' : 'none',
        ...(isMobile
          ? { width: '100%', paddingTop: '1rem', paddingBottom: 0 }
          : { width: '380px', height: '100vh', overflow: 'hidden' }
        ),
      }}>

        {/* Resplandor de fondo detrás del canvas */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 35%, rgba(201,168,76,0.07) 0%, transparent 65%)',
        }} />

        {/* Nombre + subtítulo del personaje (arriba del canvas) */}
        <div style={{
          position: 'absolute', top: isMobile ? '0.8rem' : '1.4rem',
          left: 0, right: 0, textAlign: 'center', zIndex: 2, padding: '0 1rem',
        }}>
          <div style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: isMobile ? 'clamp(0.85rem, 4.5vw, 1.1rem)' : '1.05rem',
            color: '#F4C542',
            letterSpacing: '.14em',
            textShadow: '0 0 28px rgba(244,197,66,0.65)',
            marginBottom: '0.25rem',
          }}>
            {currentVariant.name}
          </div>
          <div style={{
            fontSize: '0.5rem',
            color: 'rgba(201,168,76,0.5)',
            letterSpacing: '.32em',
            textTransform: 'uppercase',
          }}>
            {currentVariant.sub}
          </div>
        </div>

        {/* Canvas del personaje — grande */}
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          style={{
            display: 'block',
            position: 'relative', zIndex: 1,
            width: isMobile ? `min(${CW}px, 90vw)` : `${CW}px`,
            height: 'auto',
            marginTop: isMobile ? '3.5rem' : '4rem',
          }}
        />
      </div>

      {/* ══ PANEL CONTROLES ══ */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ? '1.2rem 1rem 3rem' : '2rem 1.8rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '.55rem',
        background: 'linear-gradient(180deg, #0A0702 0%, #070504 100%)',
      }}>

        {/* Título */}
        <div style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 'clamp(0.85rem, 4vw, 1.25rem)',
          color: '#E8C97A',
          letterSpacing: '.1em',
          marginBottom: '.1rem',
        }}>ELIGE TU TEMPLARIO</div>

        {/* Separador */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(201,168,76,0.65), rgba(201,168,76,0.1), transparent)', marginBottom: '.3rem' }} />

        {/* Label género */}
        <div style={{ fontSize: '.52rem', letterSpacing: '.28em', color: '#C9A84C' }}>GÉNERO</div>

        {/* Botones género */}
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {[
            { g: 'm', icon: '⚔', label: 'Hombre', activeColor: 'rgba(80,160,90,.9)', inactiveColor: 'rgba(60,120,70,.3)', activeBg: 'linear-gradient(135deg,#0A1A0C,#183020)', inactiveBg: 'linear-gradient(135deg,#0E1A10,#172815)', textColor: '#88C890' },
            { g: 'f', icon: '🏹', label: 'Mujer',  activeColor: 'rgba(220,150,50,.9)', inactiveColor: 'rgba(200,130,40,.35)', activeBg: 'linear-gradient(135deg,#150E06,#261808)', inactiveBg: 'linear-gradient(135deg,#1A1008,#2E1E0A)', textColor: '#E8A84C' },
          ].map(({ g, icon, label, activeColor, inactiveColor, activeBg, inactiveBg, textColor }) => (
            <div
              key={g}
              onClick={() => selectGender(g)}
              style={{
                flex: 1,
                background: gender === g ? activeBg : inactiveBg,
                border: `2px solid ${gender === g ? activeColor : inactiveColor}`,
                borderRadius: '10px',
                padding: '.65rem .4rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all .2s',
                boxShadow: gender === g ? `0 0 18px ${activeColor}55` : 'none',
              }}
            >
              <div style={{ fontSize: '1.3rem', marginBottom: '.25rem' }}>{icon}</div>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: '.62rem', color: textColor }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Label variante */}
        <div style={{ fontSize: '.52rem', letterSpacing: '.28em', color: '#C9A84C', marginTop: '.4rem' }}>ESTILO DE COMBATE</div>

        {/* Lista de variantes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.32rem' }}>
          {variants.map((v, idx) => {
            const sel = variant === idx;
            const weaponIcon = v.weapon === 'sword' ? '⚔' : v.weapon === 'axe' ? '🪓' : v.weapon === 'lance' ? '🗡️' : v.weapon === 'staff' ? '🔮' : v.weapon === 'bow' ? '🏹' : '🔨';
            return (
              <div
                key={idx}
                onClick={() => selectVariant(idx)}
                style={{
                  background: sel ? 'linear-gradient(135deg,#2E2214,#1E1608)' : 'linear-gradient(135deg,#181008,#110C05)',
                  border: `1px solid ${sel ? '#E8C97A' : 'rgba(78,62,38,0.6)'}`,
                  borderRadius: '10px',
                  padding: '.65rem .85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.65rem',
                  transition: 'all .2s',
                  boxShadow: sel ? '0 0 22px rgba(201,168,76,0.22)' : 'none',
                }}
              >
                <span style={{ fontSize: '1.35rem', flexShrink: 0 }}>{weaponIcon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: '.65rem', color: sel ? '#E8C97A' : '#B8A070', marginBottom: '.1rem' }}>{v.name}</div>
                  <div style={{ fontSize: '.54rem', color: '#8A7050' }}>{v.weaponName}</div>
                </div>
                {sel && <div style={{ fontSize: '.75rem', color: '#F4C542', flexShrink: 0 }}>◆</div>}
              </div>
            );
          })}
        </div>

        {/* Botón confirmar */}
        <button
          onClick={confirmCharacter}
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '.78rem',
            letterSpacing: '.18em',
            background: 'linear-gradient(135deg,#8A6020,#C9A84C,#E8C97A,#C9A84C,#8A6020)',
            border: 'none',
            borderRadius: '10px',
            padding: '.9rem 1rem',
            cursor: 'pointer',
            marginTop: '.6rem',
            width: '100%',
            color: '#0A0702',
            fontWeight: 700,
            boxShadow: '0 0 28px rgba(201,168,76,0.28)',
          }}
        >⚔ Confirmar Templario</button>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NUEVA PANTALLA DE MAPA (diseño moderno)
// ═══════════════════════════════════════════════════════════════
const MAP_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;600;700&family=Nunito:wght@400;600;700;800&display=swap');
.tdp-root *{box-sizing:border-box;margin:0;padding:0}
.tdp-root{--gold:#F4C542;--gold2:#FFE580;--gold3:#FFF3A0;--sun:#FF9500;--sun2:#FF6B00;--purple:#7B2FBE;--purple2:#9B4FDE;--teal:#00D4AA;--teal2:#00FFD0;--navy:#050B2A;--navy2:#0A1540;--navy3:#0D1E55;--card1:#0D1A3E;--card2:#12225A;--text:#F0EAD6;--text2:#C8B89A;--text3:#8A7A60;--red:#FF4757;--green:#2ED573;--blue:#70A0FF;background:var(--navy);min-height:100%;overflow-x:hidden}
#tdp-bg{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;contain:strict}
.tdp-sun-core{position:absolute;top:-120px;left:50%;transform:translateX(-50%) translateZ(0);width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(255,180,0,.38) 0%,rgba(255,60,0,.07) 55%,transparent 70%);animation:tdpSunPulse 6s ease-in-out infinite;will-change:opacity}
@keyframes tdpSunPulse{0%,100%{opacity:.6}50%{opacity:.95}}
.tdp-ray{position:absolute;top:0;left:50%;width:2px;height:100vh;transform-origin:top center;background:linear-gradient(to bottom,rgba(255,180,0,.1) 0%,transparent 65%)}
#tdp-stars{position:absolute;inset:0;contain:layout}
.tdp-star{position:absolute;width:1px;height:1px;background:#fff;border-radius:50%;animation:tdpTwinkle var(--d,4s) ease-in-out infinite var(--delay,0s);will-change:opacity}
@keyframes tdpTwinkle{0%,100%{opacity:0}50%{opacity:1}}
.tdp-particle{position:absolute;pointer-events:none;animation:tdpFloatUp var(--dur,9s) ease-in-out infinite var(--del,0s);opacity:0;will-change:transform,opacity}
@keyframes tdpFloatUp{0%{opacity:0;transform:translateY(0) translateZ(0)}25%{opacity:.6}75%{opacity:.25}100%{opacity:0;transform:translateY(-60vh) translateZ(0)}}
#tdp-app{position:relative;z-index:1;max-width:480px;margin:0 auto;height:calc(var(--vh,1vh)*100);display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;padding-bottom:80px;-webkit-overflow-scrolling:touch;contain:layout}
.tdp-topbar{display:flex;align-items:center;padding:12px 16px 8px;gap:10px;position:relative}
.tdp-player-avatar{position:relative;width:52px;height:52px;flex-shrink:0}
.tdp-avatar-ring{width:52px;height:52px;border-radius:50%;background:conic-gradient(var(--gold) var(--pct,70%),rgba(255,255,255,.1) 0);display:flex;align-items:center;justify-content:center}
@keyframes xpBreath{from{stroke-opacity:.15}to{stroke-opacity:.55}}
@keyframes xpTipPulse{from{opacity:.45}to{opacity:.85}}
@keyframes tdpRingRotate{to{filter:hue-rotate(30deg)}}
.tdp-avatar-inner{width:40px;height:40px;border-radius:50%;background:#1A2860;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:14px;font-weight:700;color:var(--gold)}
.tdp-level-badge{position:absolute;bottom:-3px;right:-3px;background:linear-gradient(135deg,var(--sun2),var(--gold));color:#1A0A00;font-family:'Cinzel',serif;font-size:9px;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #050B2A}
.tdp-player-info{flex:1;min-width:0}
.tdp-player-name{font-family:'Cinzel',serif;font-size:13px;font-weight:700;color:var(--text);letter-spacing:.05em;margin-bottom:3px}
.tdp-player-rank{font-family:'Nunito',sans-serif;font-size:10px;color:var(--gold);letter-spacing:.15em;text-transform:uppercase;margin-bottom:5px}
.tdp-xp-bar-wrap{height:5px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden}
.tdp-xp-bar-fill{height:100%;background:linear-gradient(90deg,var(--teal),var(--teal2));border-radius:3px}
.tdp-res-pill{display:flex;align-items:center;gap:4px;background:rgba(10,20,60,.97);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:4px 10px}
.tdp-res-pill .icon{font-size:14px}
.tdp-res-pill .val{font-family:'Cinzel',serif;font-size:11px;font-weight:700;color:var(--gold2)}
.tdp-streak-pill{display:flex;align-items:center;gap:3px;background:rgba(40,15,0,.97);border:1px solid rgba(255,100,0,.4);border-radius:20px;padding:4px 10px;animation:tdpStreakGlow 3s ease-in-out infinite;will-change:box-shadow}
@keyframes tdpStreakGlow{0%,100%{box-shadow:0 0 6px rgba(255,100,0,.15)}50%{box-shadow:0 0 14px rgba(255,100,0,.4)}}
.tdp-streak-pill .val{font-family:'Cinzel',serif;font-size:11px;font-weight:700;color:var(--sun)}
.tdp-hero{position:relative;text-align:center;padding:0 16px 10px;overflow:visible}
.tdp-hero-title{font-family:'Cinzel Decorative',serif;font-size:clamp(.85rem,4vw,1.25rem);letter-spacing:.08em;text-align:center;background:linear-gradient(180deg,var(--gold3) 0%,var(--gold) 40%,var(--sun) 80%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:tdpTitleGlow 4s ease-in-out infinite;line-height:1.2;margin-bottom:4px;will-change:filter}
@keyframes tdpTitleGlow{0%,100%{filter:drop-shadow(0 0 8px rgba(244,197,66,.35))}50%{filter:drop-shadow(0 0 22px rgba(244,197,66,.7))}}
.tdp-hero-sub{font-family:'Cinzel',serif;font-size:.55rem;letter-spacing:.3em;color:var(--text3);text-transform:uppercase;margin-bottom:4px}
.tdp-orn{display:flex;align-items:center;gap:8px;margin:.3rem auto;max-width:300px}
.tdp-orn-line{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(244,197,66,.4),transparent)}
.tdp-orn-gem{width:7px;height:7px;background:var(--gold);transform:rotate(45deg);animation:tdpGemPulse 3s ease-in-out infinite;will-change:transform,opacity}
@keyframes tdpGemPulse{0%,100%{opacity:.6;transform:rotate(45deg) scale(1)}50%{opacity:1;transform:rotate(45deg) scale(1.25)}}
.tdp-orn-sm{width:4px;height:4px;background:rgba(244,197,66,.4);transform:rotate(45deg)}
.tdp-maestro-wrap{position:relative;display:flex;justify-content:center;align-items:flex-end;height:150px;margin:0 auto;overflow:visible;flex-shrink:0}
.tdp-maestro-glow{position:absolute;bottom:0;left:50%;transform:translateX(-50%) translateZ(0);width:160px;height:50px;background:radial-gradient(ellipse,rgba(244,197,66,.32),transparent 70%);animation:tdpMaestroGlow 4s ease-in-out infinite;will-change:opacity}
@keyframes tdpMaestroGlow{0%,100%{opacity:.5}50%{opacity:.9}}
.tdp-maestro-img{position:relative;z-index:2;height:145px;width:auto;margin-top:20px;animation:tdpMaestroFloat 5s ease-in-out infinite;transform-origin:bottom center;will-change:transform}
@keyframes tdpMaestroFloat{0%,100%{transform:translateY(0) translateZ(0)}50%{transform:translateY(-10px) translateZ(0)}}
.tdp-maestro-orb{position:absolute;top:10px;right:30px;z-index:3}
.tdp-orb{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid rgba(255,255,255,.2);animation:tdpOrbFloat 4s ease-in-out infinite;background:rgba(123,47,190,.75);will-change:transform}
@keyframes tdpOrbFloat{0%,100%{transform:translateY(0) translateZ(0)}50%{transform:translateY(-8px) translateZ(0)}}
.tdp-speech-bubble{position:absolute;top:5px;left:50%;transform:translateX(-50%);background:rgba(10,21,64,.98);border:1px solid rgba(244,197,66,.3);border-radius:12px;padding:8px 14px;font-family:'Nunito',sans-serif;font-size:11px;color:var(--text);text-align:center;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.5);animation:tdpSpeechPop .4s ease-out;z-index:10}
.tdp-speech-bubble::after{content:'';position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:7px solid rgba(244,197,66,.3)}
@keyframes tdpSpeechPop{0%{opacity:0;transform:translateX(-50%) scale(.85)}100%{opacity:1;transform:translateX(-50%) scale(1)}}
.tdp-progress-section{margin:4px 16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;flex-shrink:0;contain:layout}
.tdp-prog-card{background:#0D1A3E;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:8px 8px;text-align:center;cursor:pointer;transition:transform .2s;position:relative}
.tdp-prog-card::before{content:'';position:absolute;top:0;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);border-radius:1px}
.tdp-prog-card.gold{border-color:rgba(244,197,66,.25)}
.tdp-prog-card.teal{border-color:rgba(0,212,170,.25)}
.tdp-prog-card.fire{border-color:rgba(255,149,0,.25)}
.tdp-prog-card:active{transform:scale(.97)}
.tdp-prog-icon{font-size:22px;margin-bottom:6px;display:block}
.tdp-prog-val{font-family:'Cinzel',serif;font-size:.85rem;font-weight:700;margin-bottom:3px}
.tdp-prog-lbl{font-family:'Nunito',sans-serif;font-size:.62rem;font-weight:700;color:var(--text2);letter-spacing:.12em;text-transform:uppercase}
.tdp-prog-mini-ring{position:absolute;bottom:-15px;right:-15px;width:55px;height:55px;border-radius:50%;border:2px solid rgba(255,255,255,.04)}
.tdp-prog-card.gold .tdp-prog-val{color:var(--gold)}
.tdp-prog-card.teal .tdp-prog-val{color:var(--teal2)}
.tdp-prog-card.fire .tdp-prog-val{color:var(--sun)}
.tdp-section-header{display:flex;align-items:center;justify-content:space-between;padding:4px 16px 5px;flex-shrink:0}
.tdp-sec-title{font-family:'Cinzel',serif;font-size:.75rem;letter-spacing:.2em;color:var(--gold2);text-transform:uppercase}
.tdp-sec-btn{font-family:'Cinzel',serif;font-size:.58rem;color:var(--teal);letter-spacing:.1em;background:none;border:none;cursor:pointer;text-transform:uppercase;opacity:.8}
.tdp-cards-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:0 16px;flex-shrink:0;contain:layout}
.tdp-mcard{position:relative;background:#12225A;border-radius:14px;padding:10px 10px 9px;cursor:pointer;overflow:hidden;transition:transform .25s,border-color .25s;border:1px solid rgba(255,255,255,.1);will-change:transform}
.tdp-mcard::after{content:'';position:absolute;top:0;left:8%;right:8%;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);pointer-events:none}
.tdp-mcard:active{transform:scale(.97)}
.tdp-mcard.completed{border-color:rgba(46,213,115,.35)}
.tdp-mcard.locked{opacity:.5;cursor:not-allowed}
.tdp-mcard.featured{border-color:rgba(255,149,0,.4)}
.tdp-card-badge{position:absolute;top:9px;right:9px;font-family:'Nunito',sans-serif;font-size:.5rem;font-weight:800;letter-spacing:.05em;padding:2px 6px;border-radius:10px;text-transform:uppercase}
.tdp-badge-done{background:rgba(46,213,115,.18);color:#2ED573;border:1px solid rgba(46,213,115,.35)}
.tdp-badge-new{background:rgba(255,149,0,.2);color:#FF9500;border:1px solid rgba(255,149,0,.4);animation:tdpBadgePulse 2.5s ease-in-out infinite;will-change:box-shadow}
@keyframes tdpBadgePulse{0%,100%{box-shadow:0 0 4px rgba(255,149,0,.25)}50%{box-shadow:0 0 12px rgba(255,149,0,.6)}}
.tdp-badge-locked{background:rgba(255,255,255,.06);color:#8A7A60;border:1px solid rgba(255,255,255,.1)}
.tdp-card-icon-wrap{position:relative;width:38px;height:38px;margin:0 auto 6px}
.tdp-card-icon-bg{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;position:relative;overflow:hidden}
.tdp-card-icon-bg::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.12),transparent);border-radius:14px}
.tdp-card-icon-shine{position:absolute;inset:0;border-radius:14px;background:linear-gradient(135deg,rgba(255,255,255,.15),transparent 50%)}
.tdp-card-icon-glow{display:none}
.tdp-card-name{font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;color:#F0EAD6;text-align:center;letter-spacing:.08em;line-height:1.3;margin-bottom:6px}
.tdp-card-pts{display:flex;align-items:center;justify-content:center;gap:4px;font-family:'Nunito',sans-serif;font-size:.6rem;font-weight:700;color:var(--gold);opacity:.85}
.tdp-card-pts .bolt{color:#FF9500;font-size:.7rem}
.tdp-card-progress{margin-top:8px;height:4px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden}
.tdp-card-progress-fill{height:100%;border-radius:2px;transition:width .4s ease}
.tdp-mcard-glow-ring{display:none}
.tdp-quest-banner{margin:5px 16px;background:rgba(30,10,60,.97);border:1px solid rgba(155,79,222,.4);border-radius:16px;padding:7px 12px;display:flex;align-items:center;gap:12px;position:relative;overflow:hidden;cursor:pointer;transition:border-color .2s;flex-shrink:0}
.tdp-quest-banner::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(123,47,190,.08),transparent);animation:tdpBannerScan 4s linear infinite;will-change:transform}
@keyframes tdpBannerScan{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
.tdp-qb-icon{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#7B2FBE,#9B4FDE);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.tdp-qb-info{flex:1}
.tdp-qb-label{font-family:'Cinzel',serif;font-size:.55rem;letter-spacing:.2em;color:#C084FC;text-transform:uppercase;margin-bottom:3px;text-shadow:0 0 10px rgba(192,132,252,.6)}
.tdp-qb-title{font-family:'Cinzel',serif;font-size:.88rem;font-weight:700;color:#FFFFFF;margin-bottom:5px;line-height:1.35;text-shadow:0 0 18px rgba(155,79,222,.9),0 1px 3px rgba(0,0,0,.9)}
.tdp-qb-prog{display:flex;align-items:center;gap:8px}
.tdp-qb-bar{flex:1;height:5px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden}
.tdp-qb-bar-fill{height:100%;width:40%;background:linear-gradient(90deg,#7B2FBE,#9B4FDE);border-radius:3px}
.tdp-qb-pct{font-family:'Nunito',sans-serif;font-size:.6rem;color:#9B4FDE;font-weight:700}
.tdp-qb-reward{display:flex;flex-direction:column;align-items:center;gap:3px;background:rgba(0,0,0,.35);border-radius:10px;padding:6px 10px;border:1px solid rgba(244,197,66,.2)}
.tdp-qb-reward-val{font-family:'Cinzel',serif;font-size:.88rem;font-weight:700;color:#FFE580;text-shadow:0 0 12px rgba(244,197,66,.8);white-space:nowrap}
.tdp-qb-reward-lbl{font-family:'Nunito',sans-serif;font-size:.58rem;color:#C9A84C;text-transform:uppercase;letter-spacing:.08em;font-weight:700}
.tdp-rank-strip{margin:4px 16px;background:#080E30;border:1px solid rgba(244,197,66,.2);border-radius:14px;overflow:hidden;flex-shrink:0}
.tdp-rank-header{display:flex;align-items:center;justify-content:space-between;padding:7px 14px;border-bottom:1px solid rgba(244,197,66,.07)}
.tdp-rank-title{font-family:'Cinzel',serif;font-size:.65rem;letter-spacing:.2em;color:#FFE580;text-transform:uppercase}
.tdp-live-dot{display:flex;align-items:center;gap:5px;font-family:'Nunito',sans-serif;font-size:.58rem;color:#FCA5A5;letter-spacing:.1em}
.tdp-ldot{width:6px;height:6px;background:#EF4444;border-radius:50%;animation:tdpLdPulse 1.2s ease-in-out infinite;will-change:opacity}
@keyframes tdpLdPulse{0%,100%{opacity:.4}50%{opacity:1}}
.tdp-rank-rows{padding:0 14px}
.tdp-rank-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.03)}
.tdp-rank-row:last-child{border-bottom:none}
.tdp-rank-row.me{background:rgba(244,197,66,.04);margin:0 -14px;padding:9px 14px}
.tdp-rpos{font-family:'Cinzel',serif;font-size:.8rem;font-weight:700;width:22px;text-align:center;flex-shrink:0}
.tdp-rpos.p1{color:#FFD700}
.tdp-rpos.p2{color:#C0C0C0}
.tdp-rpos.p3{color:#CD7F32}
.tdp-rpos.pn{color:#8A7A60}
.tdp-ravatar{width:28px;height:28px;border-radius:50%;background:#0D1E55;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:10px;color:var(--gold);border:1px solid rgba(244,197,66,.2);flex-shrink:0}
.tdp-rname{flex:1;font-family:'Nunito',sans-serif;font-size:.75rem;color:#F0EAD6;font-weight:600}
.tdp-rme-tag{font-family:'Cinzel',serif;font-size:.45rem;background:var(--gold);color:#1A0A00;padding:1px 4px;margin-left:4px;font-weight:700}
.tdp-rpts{font-family:'Cinzel',serif;font-size:.68rem;color:var(--gold)}
.tdp-bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:rgba(5,11,42,.97);border-top:1px solid rgba(244,197,66,.1);display:flex;justify-content:space-between;align-items:center;padding:6px 4px 14px;z-index:100;gap:0}
.tdp-nav-item{display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 6px;border-radius:10px;transition:background .2s;position:relative;flex:1;min-width:0}
.tdp-nav-item.active{background:rgba(244,197,66,.08)}
.tdp-nav-icon{font-size:18px;opacity:.45;transition:opacity .2s,font-size .2s}
.tdp-nav-item.active .tdp-nav-icon{opacity:1;font-size:19px}
.tdp-nav-label{font-family:'Cinzel',serif;font-size:.42rem;letter-spacing:.04em;color:#8A7A60;text-transform:uppercase;transition:color .2s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.tdp-nav-item.active .tdp-nav-label{color:var(--gold)}
.tdp-nav-badge{position:absolute;top:4px;right:12px;background:#FF4757;color:#fff;font-family:'Nunito',sans-serif;font-size:.5rem;font-weight:800;width:15px;height:15px;border-radius:50%;display:flex;align-items:center;justify-content:center}
@keyframes xpFillArc{from{stroke-dashoffset:attr(stroke-dasharray)}to{stroke-dashoffset:0}}
.tdp-reveal{opacity:0;transform:translateY(16px);transition:opacity .4s ease,transform .4s ease}
.tdp-reveal.visible{opacity:1;transform:translateY(0)}
  @keyframes arenaBadgeIn{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}} @keyframes questFadeSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
`;

// ─── Frases del Maestro ───────────────────────────────────────────────────────
const MAESTRO_MSGS = [
  '✨ ¡Hoy es un gran día para crecer, Templario!',
  '🌟 Tu propósito te espera, Templario.',
  '🔥 ¡La constancia es tu superpoder!',
  '💡 Cada misión te acerca a tu mejor versión.',
  '⚡ ¡Suma puntos, construye tu templo!',
  '🧠 El conocimiento es tu arma más poderosa.',
  '🏛️ El Templo te observa y te impulsa.',
  '⚔️ Un Templario actúa aunque tenga miedo.',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRank(lb, name) {
  if (!lb || lb.length === 0) return 1;
  const idx = lb.findIndex(p => p.n === name);
  return idx >= 0 ? idx + 1 : lb.length + 1;
}

function getInitials(name = '') {
  return name.slice(0, 2).toUpperCase() || 'TP';
}

// ─── Componente Principal ─────────────────────────────────────────────────────
function NewMapScreen({ gameState, onNavigate, onEnterChamber, badgeCycle = 0, arenaQuests = [], arenaQuestIdx = 0 }) {
  const {
    name = 'Templario',
    pts = 0,
    streak = 0,
    xp = 0,
    xpMax = 150,
    level = 1,
    playerRank = 0,
    rankPos = 1,
    chambers = {},
    answered = {},
  } = gameState;

  const [bubbleIdx, setBubbleIdx] = useState(0);
  const [rankList, setRankList] = useState(gameState.rankList || []);
  const [activeNav, setActiveNav] = useState('misiones');
  const revealRefs = useRef([]);
  const [compBanner, setCompBanner] = useState(false);
  const [compTime, setCompTime]     = useState({d:0,h:0,m:0,s:0});
  

  // ── Burbuja rotante ──────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      setBubbleIdx(i => (i + 1) % MAESTRO_MSGS.length);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!sb) return;
    const fetchRanking = () => {
      sb.from('templo_players')
        .select('id, char_name, weekly_points, char_variant, player_rank, profiles(templario_name)')
        .order('weekly_points', { ascending: false })
        .limit(10)
        .then(({ data }) => {
          if (data) setRankList(data.map(p => ({
            id: p.id,
            n: p.profiles?.templario_name || p.char_name || 'Templario',
            p: p.weekly_points || 0,
            av: p.char_variant || 0,
            playerRank: p.player_rank || 0,
          })));
        });
    };
    fetchRanking();
    const channel = sb.channel('ranking-realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'templo_players'
      }, fetchRanking)
      .subscribe();
    const poll = setInterval(fetchRanking, 3000);
    return () => { sb.removeChannel(channel); clearInterval(poll); };
  }, []);

  // 🏆 Competition banner
useEffect(() => {
  if (!sb) return;

  let compInterval;

  const fetchComp = () => {
    if (!sb) return;
    sb.from('competition_settings')
      .select('start_date,end_date,is_active')
      .eq('id', 'current')
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.is_active || !data?.end_date) { setCompBanner(false); return; }
        const end = new Date(data.end_date);
        if (end < new Date()) { setCompBanner(false); return; }
        setCompBanner(true);
        if (compInterval) clearInterval(compInterval);
        const tick = () => {
          const diff = Math.max(0, end - new Date());
          setCompTime({
            d: Math.floor(diff / 86400000),
            h: Math.floor((diff % 86400000) / 3600000),
            m: Math.floor((diff % 3600000) / 60000),
            s: Math.floor((diff % 60000) / 1000),
          });
          if (diff === 0) setCompBanner(false);
        };
        tick();
        compInterval = setInterval(tick, 1000);
      });
  };

 fetchComp();

// Realtime: detecta cambios al instante

const channel = sb
  .channel('comp-realtime')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'competition_settings',
    filter: 'id=eq.current'
  }, () => {
    fetchComp(); // re-lee inmediatamente cuando admin guarda
  })
  .subscribe();

// Fallback por si Realtime falla
const pollId = setInterval(fetchComp, 60000);

return () => {
  clearInterval(pollId);
  if (compInterval) clearInterval(compInterval);
  sb.removeChannel(channel);
};
}, []);

  // ── Generar fondo (rayos, estrellas, partículas) ─────────────────────────
  useEffect(() => {
    const raysEl = document.getElementById('tdp-rays');
    const starsEl = document.getElementById('tdp-stars');
    const particlesEl = document.getElementById('tdp-particles');

    if (raysEl && !raysEl.children.length) {
      for (let i = 0; i < 8; i++) {
        const d = document.createElement('div');
        d.className = 'tdp-ray';
        d.style.transform = `rotate(${i * 45}deg)`;
        d.style.opacity = String(0.25 + Math.random() * 0.25);
        raysEl.appendChild(d);
      }
    }
    if (starsEl && !starsEl.children.length) {
      for (let i = 0; i < 18; i++) {
        const s = document.createElement('div');
        s.className = 'tdp-star';
        s.style.cssText = `left:${Math.random()*100}%;top:${5+Math.random()*55}%;--d:${4+Math.random()*6}s;--delay:${Math.random()*7}s;opacity:${0.1+Math.random()*0.25}`;
        starsEl.appendChild(s);
      }
    }
    if (particlesEl && !particlesEl.children.length) {
      const emojis = ['✨','⭐','💫','🔥','🪙'];
      for (let i = 0; i < 5; i++) {
        const p = document.createElement('div');
        p.className = 'tdp-particle';
        p.style.cssText = `left:${10+Math.random()*80}%;bottom:${Math.random()*15}%;font-size:${10+Math.random()*10}px;--dur:${7+Math.random()*8}s;--del:${Math.random()*6}s`;
        p.textContent = emojis[Math.floor(Math.random()*emojis.length)];
        particlesEl.appendChild(p);
      }
    }
  try {
      GAME_AUDIO.init();
      GAME_AUDIO.startEpicAmbientMapMusic();
    } catch(e) {}

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        try { GAME_AUDIO.init(); GAME_AUDIO.startEpicAmbientMapMusic(); } catch(e) {}
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      try { GAME_AUDIO.stopEpicAmbientMapMusic(); } catch(e) {}
    };
  }, []);

  // ── Scroll Reveal ────────────────────────────────────────────────────────
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });

    const els = document.querySelectorAll('.tdp-reveal');
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const xpPercent = Math.min((xp / xpMax) * 100, 100);
const CIRC = 2 * Math.PI * 44;
const xpSvgRef = useRef(null);
useLayoutEffect(() => {
  const svg = xpSvgRef.current;
  if (!svg) return;
  const arcs = svg.querySelectorAll('.xp-arc');
  if (!arcs.length) return;
  arcs.forEach(el => { el.style.strokeDashoffset = String(CIRC); });
  const target = CIRC - (CIRC * xpPercent / 100);
  let raf;
  const outer = requestAnimationFrame(() => {
    const duration = 1500;
    const t0 = performance.now();
    function tick(now) {
      const prog = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      arcs.forEach(el => { el.style.strokeDashoffset = String(CIRC + (target - CIRC) * ease); });
      if (prog < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  });
  return () => { cancelAnimationFrame(outer); cancelAnimationFrame(raf); };
}, [xpPercent]);

const xpStrokeColor = '#F4C542';

const xpArcLen = (2 * Math.PI * 44 * xpPercent / 100).toFixed(1);
const xpTipAngle = (-90 + 360 * xpPercent / 100) * Math.PI / 180;
  const bubbleText = MAESTRO_MSGS[bubbleIdx];

  // ── Card click (feedback al maestro) ────────────────────────────────────
  const [questConfirm, setQuestConfirm] = useState(false);

  const handleCardClick = (chamberId, name, isLocked) => {
    if (isLocked) return;
    setBubbleIdx(MAESTRO_MSGS.findIndex(m => m.includes('Templario')) || 0);
    onEnterChamber(chamberId);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="tdp-root" style={{ position: 'fixed', inset: 0, overflowY: 'auto' }}>
      <style dangerouslySetInnerHTML={{ __html: MAP_STYLES }} />

      {/* BACKGROUND */}
      <div id="tdp-bg">
        <div className="tdp-sun-core" />
        <div id="tdp-rays" />
        <div id="tdp-stars" />
        <div id="tdp-particles" />
      </div>

      <div id="tdp-app">

        {/* ── TOP BAR ── */}
        <div className="tdp-topbar">
          <div className="tdp-player-avatar" style={{ width:'96px', height:'96px', position:'relative', flexShrink:0 }}>
  <svg ref={xpSvgRef} width="96" height="96" style={{ position:'absolute', inset:0, zIndex:3, pointerEvents:'none', overflow:'visible' }}>
    <defs>
      <filter id="xpGlowMain" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.2" result="b1"/>
        <feGaussianBlur stdDeviation="1.1" result="b2"/>
        <feMerge>
          <feMergeNode in="b1"/>
          <feMergeNode in="b2"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="xpTipBloom" x="-500%" y="-500%" width="1100%" height="1100%">
        <feGaussianBlur stdDeviation="4.5" result="bloom"/>
        <feMerge>
          <feMergeNode in="bloom"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="xpTextGlow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="1.8" result="bg"/>
        <feMerge>
          <feMergeNode in="bg"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    <radialGradient id="heroAura" cx="50%" cy="55%" r="50%">
        <stop offset="0%"   stopColor="#4DFFEF" stopOpacity="0.32"/>
        <stop offset="45%"  stopColor="#1A6FFF" stopOpacity="0.14"/>
        <stop offset="100%" stopColor="#000011" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="heroGround" cx="50%" cy="80%" r="50%">
        <stop offset="0%"   stopColor="#4DFFEF" stopOpacity="0.22"/>
        <stop offset="100%" stopColor="#000"    stopOpacity="0"/>
      </radialGradient>
    </defs>

    

    {xpPercent > 2 && (
      <circle className="xp-arc" cx="48" cy="48" r="44"
        fill="none"
        stroke={xpStrokeColor}
        strokeOpacity="0.20"
        strokeWidth="15"
        strokeDasharray={CIRC}
        strokeDashoffset={CIRC}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
      />
    )}

    <circle className="xp-arc" cx="48" cy="48" r="44"
      fill="none"
      stroke={xpStrokeColor}
      strokeWidth="6.5"
      strokeDasharray={CIRC}
      strokeDashoffset={CIRC}
      strokeLinecap="round"
      transform="rotate(-90 48 48)"
      filter="url(#xpGlowMain)"
    />

    {xpPercent > 2 && (
      <circle className="xp-arc" cx="48" cy="48" r="44"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.5"
        strokeDasharray={CIRC}
        strokeDashoffset={CIRC}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
      />
    )}

    {xpPercent > 2 && (
      <circle className="xp-arc" cx="48" cy="48" r="44"
        fill="none"
        stroke={xpStrokeColor}
        strokeOpacity="0.4"
        strokeWidth="9"
        strokeDasharray={CIRC}
        strokeDashoffset={CIRC}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
        style={{ animation: 'xpBreath 2.2s ease-in-out infinite alternate' }}
      />
    )}

    {xpPercent > 3 && (
      <g>
        <circle
          cx={48 + 44 * Math.cos(xpTipAngle)}
          cy={48 + 44 * Math.sin(xpTipAngle)}
          r="8"
          fill={xpStrokeColor}
          opacity="0.55"
          filter="url(#xpTipBloom)"
          style={{ animation:'xpTipPulse 1.1s ease-in-out infinite alternate' }}
        />
        <circle
          cx={48 + 44 * Math.cos(xpTipAngle)}
          cy={48 + 44 * Math.sin(xpTipAngle)}
          r="3.2"
          fill="#FFFFFF"
        />
      </g>
    )}

    <circle cx="48" cy="48" r="48"
      fill="none"
      stroke="rgba(244,197,66,0.12)"
      strokeWidth="1"
      strokeDasharray="8 50"
      strokeLinecap="round"
      style={{ animation:'tdpRingRotate 18s linear infinite', transformOrigin:'48px 48px' }}
    />

  
  </svg>

  <canvas
    id="tdp-profile-char"
    width="115"
    height="115"
    style={{
      width:'88px', height:'88px',
      borderRadius:'50%',
      display:'block',
      position:'absolute',
      top:'4px', left:'4px',
      zIndex:2,
      boxShadow:'0 0 0 2px rgba(77,255,239,0.8), 0 0 14px rgba(77,255,239,0.5), 0 0 20px rgba(244,197,66,0.25), 0 4px 16px rgba(0,0,0,0.8)'
    }}
  />
  <div style={{
    zIndex:4, position:'absolute', bottom:'-4px', right:'-4px',
    background:'linear-gradient(135deg,#FF6B00,#F4C542)',
    color:'#1A0A00', fontFamily:"'Cinzel',serif", fontWeight:700,
    fontSize:'11px', width:'24px', height:'24px', borderRadius:'50%',
    display:'flex', alignItems:'center', justifyContent:'center',
    border:'2px solid #050B2A',
    boxShadow:'0 0 12px rgba(255,149,0,.9), 0 0 24px rgba(255,149,0,.5)'
  }}>{level}</div>
</div>
          <div className="tdp-player-info">
            <div className="tdp-player-name">
  {name} {playerRank > 0 && <span style={{color: getRankInfo(playerRank).color, fontSize:'.75rem'}}>· Rango {playerRank}</span>}
</div>
<div className="tdp-player-rank">
  {(() => {
    const info = getRankInfo(playerRank || 0);
    return playerRank > 0
      ? <span style={{color: info.color}}>{info.emoji} {info.label} · Nv.{level}</span>
      : <span>⚔️ Templario · Nv.{level}</span>;
  })()}
</div>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'3px' }}>
              <div style={{ flex:1, height:'5px', background:'#061509', borderRadius:'3px', overflow:'hidden', border:'1px solid rgba(26,255,96,0.18)', boxShadow:'inset 0 0 6px rgba(0,0,0,0.6)' }}>
                <div style={{
                  height:'100%', width:`${xpPercent}%`,
                  background:'linear-gradient(90deg,#0A8A30,#1AFF60,#90FFB8)',
                  borderRadius:'3px',
                  boxShadow:'0 0 10px rgba(26,255,96,0.9), 0 0 20px rgba(26,255,96,0.45)',
                  transition:'width 0.7s cubic-bezier(0.34,1.56,0.64,1)',
                  position:'relative'
                }}>
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(255,255,255,0.28) 0%,transparent 55%)', borderRadius:'3px' }}/>
                </div>
              </div>
              <span style={{ fontSize:'9px', color:'rgba(26,255,96,0.75)', fontFamily:"'Cinzel',serif", whiteSpace:'nowrap', minWidth:'34px', textAlign:'right', textShadow:'0 0 8px rgba(26,255,96,0.6)' }}>
                {xp}/{xpMax}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
            <div className="tdp-res-pill">
              <span className="icon">🪙</span>
              <span className="val">{pts.toLocaleString()}</span>
            </div>
            <div className="tdp-streak-pill">
              <span style={{ fontSize: '13px' }}>🔥</span>
              <span className="val">{streak} días</span>
            </div>
          </div>
        </div>

        {/* ── HERO ── */}
        <div className="tdp-hero tdp-reveal">
          <div className="tdp-hero-title">100 Templarios Dijeron</div>
          <div className="tdp-orn">
            <div className="tdp-orn-line" />
            <div className="tdp-orn-sm" />
            <div className="tdp-orn-gem" />
            <div className="tdp-orn-sm" />
            <div className="tdp-orn-line" />
          </div>
        </div>

        {/* ── MAESTRO ── */}
        <div className="tdp-maestro-wrap tdp-reveal">
          <div className="tdp-speech-bubble" key={bubbleIdx}>{bubbleText}</div>
          <div className="tdp-maestro-glow" />
          <img
            className="tdp-maestro-img"
            src={maestroImg}
            alt="Maestro Templario"
            style={{ imageRendering: 'auto' }}
          />
          <div className="tdp-maestro-orb">
            <div className="tdp-orb">🌙</div>
          </div>
        </div>

        {/* ── PROGRESS CARDS ── */}
        <div className="tdp-progress-section tdp-reveal">
          <div className="tdp-prog-card gold">
            <span className="tdp-prog-icon">⚡</span>
            <div className="tdp-prog-val">{pts.toLocaleString()}</div>
            <div className="tdp-prog-lbl">Puntos</div>
            <div className="tdp-prog-mini-ring" />
          </div>
          <div className="tdp-prog-card teal">
            <span className="tdp-prog-icon">🏆</span>
            <div className="tdp-prog-val">#{rankPos}</div>
            <div className="tdp-prog-lbl">Ranking</div>
            <div className="tdp-prog-mini-ring" />
          </div>
          <div className="tdp-prog-card fire">
            <span className="tdp-prog-icon">🔥</span>
            <div className="tdp-prog-val">{streak}</div>
            <div className="tdp-prog-lbl">Racha</div>
            <div className="tdp-prog-mini-ring" />
          </div>
        </div>



        {/* ── MISSIONS SECTION ── */}
        <div className="tdp-section-header tdp-reveal">
          <div className="tdp-sec-title">⚔️ Misiones del Templo</div>
          <button className="tdp-sec-btn" onClick={() => onNavigate && onNavigate('/missions')}>VER MISIONES COMPLETADAS →</button>
        </div>

        <div className="tdp-cards-grid tdp-reveal">

          {/* Claridad Absoluta */}
          <div
            className={`tdp-mcard${chambers.c1 ? ' completed' : ''}`}
            onClick={() => !chambers.c1 && handleCardClick('c1', 'Claridad Absoluta', false)}
          >
            <div className="tdp-mcard-glow-ring" />
            {chambers.c1 && <div style={{position:'absolute',inset:0,borderRadius:'inherit',background:'rgba(0,15,0,0.88)',backdropFilter:'blur(3px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:10,gap:'.5rem'}}><div style={{width:'54px',height:'54px',borderRadius:'50%',background:'linear-gradient(135deg,#1AFF60,#0A8A30)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.9rem',boxShadow:'0 0 30px rgba(26,255,96,0.7)'}}>✓</div><div style={{fontFamily:"'Cinzel',serif",fontSize:'.68rem',letterSpacing:'.2em',color:'#2ED573',fontWeight:700,textShadow:'0 0 12px rgba(46,213,115,0.8)'}}>COMPLETADO HOY</div></div>}
            <div className="tdp-card-icon-wrap">
              <div className="tdp-card-icon-bg" style={{ background: 'linear-gradient(135deg,#1A3A1A,#0A2A0A)' }}>
                <span style={{ position: 'relative', zIndex: 1 }}>🕯️</span>
                <div className="tdp-card-icon-shine" />
              </div>
              <div className="tdp-card-icon-glow" style={{ background: 'radial-gradient(circle,rgba(46,213,115,.4),transparent)' }} />
            </div>
            <div className="tdp-card-name">Claridad Absoluta</div>
            <div className="tdp-card-pts"><span className="bolt">⚡</span> +50 PTS</div>
            <div className="tdp-card-progress">
              <div className="tdp-card-progress-fill" style={{ width: chambers.c1 ? '100%' : '0%', background: 'linear-gradient(90deg,#2ED573,#7BF5A4)' }} />
            </div>
          </div>

          {/* Dominio Interior */}
          <div
            className={`tdp-mcard featured${chambers.c2 ? ' completed' : ''}`}
style={{ position: 'relative', overflow: 'hidden' }}
            onClick={() => !chambers.c2 && handleCardClick('c2', 'Dominio Interior', false)}
          >
            <div className="tdp-mcard-glow-ring" />
            {chambers.c2 ? <div style={{position:'absolute',inset:0,borderRadius:'inherit',background:'rgba(0,15,0,0.88)',backdropFilter:'blur(3px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:10,gap:'.5rem'}}><div style={{width:'54px',height:'54px',borderRadius:'50%',background:'linear-gradient(135deg,#1AFF60,#0A8A30)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.9rem',boxShadow:'0 0 30px rgba(26,255,96,0.7)'}}>✓</div><div style={{fontFamily:"'Cinzel',serif",fontSize:'.68rem',letterSpacing:'.2em',color:'#2ED573',fontWeight:700,textShadow:'0 0 12px rgba(46,213,115,0.8)'}}>COMPLETADO HOY</div></div> : <div className="tdp-card-badge tdp-badge-new">Activa</div>}
            <div className="tdp-card-icon-wrap">
              <div className="tdp-card-icon-bg" style={{ background: 'linear-gradient(135deg,#2A1A0A,#1A0A00)' }}>
                <span style={{ position: 'relative', zIndex: 1 }}>🧘</span>
                <div className="tdp-card-icon-shine" />
              </div>
              <div className="tdp-card-icon-glow" style={{ background: 'radial-gradient(circle,rgba(255,149,0,.5),transparent)' }} />
            </div>
            <div className="tdp-card-name">Dominio Interior</div>
            <div className="tdp-card-pts"><span className="bolt">⚡</span> +50 PTS</div>
            <div className="tdp-card-progress">
              <div className="tdp-card-progress-fill" style={{ width: chambers.c2 ? '100%' : '55%', background: 'linear-gradient(90deg,#FF6B00,#F4C542)' }} />
            </div>
          </div>

          {/* Estrategia Mental */}
          <div
            className={`tdp-mcard${chambers.c3 ? ' completed' : ''}`}
            onClick={() => !chambers.c3 && handleCardClick('c3', 'Estrategia Mental', false)}
          >
            <div className="tdp-mcard-glow-ring" />
            {answered.c3 && <div style={{position:'absolute',inset:0,borderRadius:'inherit',background:'rgba(0,15,0,0.88)',backdropFilter:'blur(3px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:10,gap:'.5rem'}}><div style={{width:'54px',height:'54px',borderRadius:'50%',background:'linear-gradient(135deg,#1AFF60,#0A8A30)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.9rem',boxShadow:'0 0 30px rgba(26,255,96,0.7)'}}>✓</div><div style={{fontFamily:"'Cinzel',serif",fontSize:'.68rem',letterSpacing:'.2em',color:'#2ED573',fontWeight:700,textShadow:'0 0 12px rgba(46,213,115,0.8)'}}>COMPLETADO HOY</div></div>}
            <div className="tdp-card-icon-wrap">
              <div className="tdp-card-icon-bg" style={{ background: 'linear-gradient(135deg,#0A1A2A,#051020)' }}>
                <span style={{ position: 'relative', zIndex: 1 }}>🧠</span>
                <div className="tdp-card-icon-shine" />
              </div>
              <div className="tdp-card-icon-glow" style={{ background: 'radial-gradient(circle,rgba(112,160,255,.5),transparent)' }} />
            </div>
            <div className="tdp-card-name">Estrategia Mental</div>
            <div className="tdp-card-pts"><span className="bolt">⚡</span> +50 PTS</div>
            <div className="tdp-card-progress">
              <div className="tdp-card-progress-fill" style={{ width: chambers.c3 ? '100%' : '20%', background: 'linear-gradient(90deg,#70A0FF,#A0C0FF)' }} />
            </div>
          </div>

          {/* Prueba del Consejo */}
          {(() => {
            const correctDone = ['c1', 'c2', 'c3'].filter(k => answered[k]).length;
            const isUnlocked = streak >= 2;
            const isDone = chambers.council;
            return (
              <div
                className={`tdp-mcard${isDone ? ' completed' : !isUnlocked ? ' locked' : ''}`}
                onClick={() => isUnlocked && handleCardClick('council', 'Prueba del Consejo', false)}
              >
                <div className="tdp-mcard-glow-ring" />
                {answered.council ? <div style={{position:'absolute',inset:0,borderRadius:'inherit',background:'rgba(0,15,0,0.88)',backdropFilter:'blur(3px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:10,gap:'.5rem'}}><div style={{width:'54px',height:'54px',borderRadius:'50%',background:'linear-gradient(135deg,#1AFF60,#0A8A30)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.9rem',boxShadow:'0 0 30px rgba(26,255,96,0.7)'}}>✓</div><div style={{fontFamily:"'Cinzel',serif",fontSize:'.68rem',letterSpacing:'.2em',color:'#2ED573',fontWeight:700,textShadow:'0 0 12px rgba(46,213,115,0.8)'}}>COMPLETADO HOY</div></div> : <div className={`tdp-card-badge ${isUnlocked ? 'tdp-badge-new' : 'tdp-badge-locked'}`}>{isUnlocked ? '🔓 Desbloqueada' : '🔒 Bloqueada'}</div>}
                <div className="tdp-card-icon-wrap">
                  <div className="tdp-card-icon-bg" style={{ background: 'linear-gradient(135deg,#1A0A2A,#100820)' }}>
                    <span style={{ position: 'relative', zIndex: 1, opacity: isUnlocked ? 1 : 0.6 }}>⭐</span>
                    <div className="tdp-card-icon-shine" />
                  </div>
                </div>
                <div className="tdp-card-name" style={{ color: isUnlocked ? '#F0EAD6' : '#8A7A60' }}>Prueba del Consejo</div>
                <div className="tdp-card-pts" style={{ opacity: isUnlocked ? 1 : 0.4 }}>
                  <span className="bolt">⚡</span> +100 · ×2
                </div>
                <div className="tdp-card-progress">
                  <div className="tdp-card-progress-fill" style={{ width: isDone ? '100%' : '0%', background: '#7B2FBE' }} />
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── ARENA QUESTS (misiones reales de 100 Templarios) ── */}
        {arenaQuests.length > 0 && (() => {
          const m = arenaQuests[arenaQuestIdx];
          return (
            <div key={arenaQuestIdx} className="tdp-quest-banner"
              onClick={() => setQuestConfirm(true)}
              style={{ cursor: 'pointer', animation: 'questFadeSlide .35s ease forwards' }}
            >
              <div className="tdp-qb-icon">⚔️</div>
              <div className="tdp-qb-info">
                <div className="tdp-qb-label">⚔ Misión · 100 Templarios</div>
                <div className="tdp-qb-title" style={{
                  animation: 'arenaBadgeIn .35s cubic-bezier(.34,1.4,.64,1)'
                }}>{m.title}</div>
              </div>
              <div className="tdp-qb-reward">
                <div className="tdp-qb-reward-val">🪙 {m.coin_reward ?? 0}</div>
                <div className="tdp-qb-reward-lbl">+{m.xp_reward ?? 0} XP</div>
              </div>
            </div>
          );
        })()}

  

        {/* ── COMPETITION BANNER ── */}
{compBanner && (
  <div style={{
    margin: '0 0 14px 0',
    background: 'linear-gradient(135deg,#1a0a00,#2a1500,#1a0a00)',
    border: '1px solid rgba(244,197,66,.6)',
    borderRadius: '16px',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 0 30px rgba(244,197,66,.2), inset 0 1px 0 rgba(244,197,66,.15)',
    animation: 'tdpReveal .5s ease both',
  }}>
    <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>🏆</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily: "'Cinzel Decorative',serif",
        fontSize: '.65rem',
        letterSpacing: '.2em',
        color: '#F4C542',
        textShadow: '0 0 12px rgba(244,197,66,.7)',
        marginBottom: '4px',
      }}>⚔ COMPETENCIA SEMANAL ACTIVA</div>
      <div style={{
        fontFamily: "'Cinzel',serif",
        fontSize: '.72rem',
        color: 'rgba(240,234,214,.7)',
      }}>Acumula puntos y escala el ranking</div>
    </div>
    <div style={{
      display: 'flex',
      gap: '6px',
      flexShrink: 0,
    }}>
      {[
        { v: compTime.d, l: 'D' },
        { v: compTime.h, l: 'H' },
        { v: compTime.m, l: 'M' },
        { v: compTime.s, l: 'S' },
      ].map(({ v, l }) => (
        <div key={l} style={{
          background: 'rgba(0,0,0,.5)',
          border: '1px solid rgba(244,197,66,.35)',
          borderRadius: '8px',
          padding: '4px 7px',
          textAlign: 'center',
          minWidth: '34px',
        }}>
          <div style={{
            fontFamily: "'Cinzel',serif",
            fontSize: '.95rem',
            fontWeight: 700,
            color: '#F4C542',
            textShadow: '0 0 10px rgba(244,197,66,.8)',
            lineHeight: 1,
          }}>{String(v).padStart(2,'0')}</div>
          <div style={{
            fontSize: '.5rem',
            color: 'rgba(244,197,66,.5)',
            letterSpacing: '.1em',
            marginTop: '2px',
          }}>{l}</div>
        </div>
      ))}
    </div>
  </div>
)}

        {/* ── RANKING STRIP ── */}
        <div className="tdp-rank-strip tdp-reveal">
          <div className="tdp-rank-header">
            <div className="tdp-rank-title">🏛️ Ranking del Templo</div>
            <div className="tdp-live-dot"><div className="tdp-ldot" />EN VIVO</div>
          </div>
          <div className="tdp-rank-rows">
            {rankList.slice(0, 3).map((p, idx) => {
              const isMe = p.n === name;
              const posClass = idx === 0 ? 'p1' : idx === 1 ? 'p2' : idx === 2 ? 'p3' : 'pn';
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1;
              return (
                <div key={p.id || idx} className={`tdp-rank-row${isMe ? ' me' : ''}`}>
                  <div className={`tdp-rpos ${posClass}`}>{idx < 3 ? medal : idx + 1}</div>
                  <div className="tdp-ravatar">{getInitials(p.n)}</div>
                  <div className="tdp-rname">
                    {p.n}
                    {isMe && <span className="tdp-rme-tag">TÚ</span>}
                  </div>
                  <div className="tdp-rpts">{p.p.toLocaleString()} pts</div>
                </div>
              );
            })}
          </div>
        </div>

      {questConfirm && (
          <div style={{
            position:'fixed',inset:0,zIndex:9999,
            background:'rgba(3,8,24,0.82)',
            backdropFilter:'blur(6px)',
            display:'flex',alignItems:'center',justifyContent:'center',
          }} onClick={() => setQuestConfirm(false)}>
            <div onClick={e => e.stopPropagation()} style={{
              background:'linear-gradient(135deg,#0D1A3E,#070E2B)',
              border:'1px solid rgba(244,197,66,.45)',
              borderRadius:'20px',
              padding:'2rem 1.8rem',
              maxWidth:'300px',width:'88%',
              textAlign:'center',
              boxShadow:'0 0 60px rgba(244,197,66,.15),0 20px 60px rgba(0,0,0,.8)',
              animation:'podIn .3s cubic-bezier(.34,1.4,.64,1)',
            }}>
              <div style={{fontSize:'2rem',marginBottom:'.5rem'}}>⚔️</div>
              <div style={{
                fontFamily:"'Cinzel Decorative',serif",
                fontSize:'.7rem',letterSpacing:'.2em',
                color:'#F4C542',
                textShadow:'0 0 14px rgba(244,197,66,.6)',
                marginBottom:'.4rem',
              }}>MISIONES DEL TEMPLO</div>
              <div style={{height:'1px',background:'linear-gradient(90deg,transparent,rgba(244,197,66,.4),transparent)',margin:'.6rem 0'}}/>
              <div style={{
                fontFamily:"'Cinzel',serif",
                fontSize:'.78rem',
                color:'rgba(240,234,214,.8)',
                lineHeight:1.6,
                marginBottom:'1.4rem',
              }}>¿Quieres ir a ver<br/>tus misiones activas?</div>
              <div style={{display:'flex',gap:'10px'}}>
                <button onClick={() => setQuestConfirm(false)} style={{
                  flex:1,
                  fontFamily:"'Cinzel',serif",fontSize:'.72rem',letterSpacing:'.1em',
                  background:'transparent',
                  border:'1px solid rgba(244,197,66,.3)',
                  borderRadius:'10px',padding:'.65rem 0',
                  color:'rgba(240,234,214,.55)',cursor:'pointer',
                }}>CANCELAR</button>
                <button onClick={() => { setQuestConfirm(false); onNavigate && onNavigate('/missions'); }} style={{
                  flex:1,
                  fontFamily:"'Cinzel',serif",fontSize:'.72rem',letterSpacing:'.1em',fontWeight:700,
                  background:'linear-gradient(135deg,#8A6020,#C9A84C,#E8C97A,#C9A84C,#8A6020)',
                  border:'none',borderRadius:'10px',padding:'.65rem 0',
                  color:'#070E2B',cursor:'pointer',
                  boxShadow:'0 0 20px rgba(244,197,66,.35)',
                }}>IR AHORA</button>
              </div>
            </div>
          </div>
        )}
        </div>{/* #tdp-app */}


      {/* ── BOTTOM NAV ── */}
      <div className="tdp-bottom-nav">
        <div
          className={`tdp-nav-item${activeNav === 'templo' ? ' active' : ''}`}
          onClick={() => { setActiveNav('templo'); onNavigate && onNavigate('/hub'); }}
        >
          <span className="tdp-nav-icon">🏛️</span>
          <span className="tdp-nav-label">Templo</span>
        </div>
        <div
          className={`tdp-nav-item${activeNav === 'misiones' ? ' active' : ''}`}
          onClick={() => setActiveNav('misiones')}
        >
          <span className="tdp-nav-icon">⚔️</span>
          <span className="tdp-nav-label">La Arena</span>
          {(() => {
            const keys = ['c1','c2','c3','council'];
            const pending = keys.filter(k => !chambers[k]);
            if (!pending.length) return null;
            const icons = { c1:'🕯️', c2:'🧘', c3:'🧠', council:'⭐' };
            const shown = pending[badgeCycle % pending.length];
            return (
              <div className="tdp-nav-badge" key={shown} style={{
                minWidth:'18px', height:'18px', fontSize:'.52rem',
                animation:'arenaBadgeIn .35s cubic-bezier(.34,1.4,.64,1)',
              }}>
                {icons[shown]}
              </div>
            );
          })()}
        </div>
        <div
          className={`tdp-nav-item${activeNav === 'tienda' ? ' active' : ''}`}
          onClick={() => { setActiveNav('tienda'); onNavigate && onNavigate('/store'); }}
        >
          <span className="tdp-nav-icon">🛒</span>
          <span className="tdp-nav-label">Propo-Tienda</span>
        </div>
        <div
          className={`tdp-nav-item${activeNav === 'arsenal' ? ' active' : ''}`}
          onClick={() => { setActiveNav('arsenal'); onNavigate && onNavigate('/library'); }}
        >
          <span className="tdp-nav-icon">🎒</span>
          <span className="tdp-nav-label">Tu Arsenal</span>
        </div>
        <div
          className={`tdp-nav-item${activeNav === 'ranking' ? ' active' : ''}`}
          onClick={() => { setActiveNav('ranking'); onNavigate && onNavigate('/games/templarios-dijeron/ranking'); }}
        >
          <span className="tdp-nav-icon">🏆</span>
          <span className="tdp-nav-label">Ranking</span>
        </div>
        <div
          className={`tdp-nav-item${activeNav === 'perfil' ? ' active' : ''}`}
          onClick={() => { setActiveNav('perfil'); onNavigate && onNavigate('/profile'); }}
        >
          <span className="tdp-nav-icon">🧝</span>
          <span className="tdp-nav-label">Perfil</span>
        </div>
      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE JUEGO (preguntas, podio, etc.)
// ═══════════════════════════════════════════════════════════════
function enterChamber(key) {
  if (G.done[key]) return;
  try { GAME_AUDIO.init(); } catch(e) {}
  if (alreadyPlayedToday(key)) {
    const overlay = document.createElement('div');
overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.75);backdrop-filter:blur(6px)';
overlay.innerHTML = `
  <div style="background:linear-gradient(135deg,#0D1A3E,#070E2B);border:1px solid rgba(244,197,66,.35);border-radius:20px;padding:2rem 1.8rem;max-width:320px;width:90%;text-align:center;box-shadow:0 0 60px rgba(244,197,66,.15),0 20px 60px rgba(0,0,0,.8);animation:podIn .35s cubic-bezier(.34,1.4,.64,1)">
    <div style="font-size:2.5rem;margin-bottom:.6rem">⏳</div>
    <div style="font-family:'Cinzel Decorative',serif;font-size:.9rem;color:#F4C542;letter-spacing:.1em;margin-bottom:.5rem;text-shadow:0 0 20px rgba(244,197,66,.6)">MISIÓN COMPLETADA</div>
    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(244,197,66,.5),transparent);margin:.7rem 0"></div>
    <div style="font-family:'Cinzel',serif;font-size:.8rem;color:rgba(240,234,214,.8);line-height:1.6;margin-bottom:1.2rem">Ya completaste esta misión hoy.<br><span style="color:#FF9500">Vuelve mañana</span> para seguir acumulando poder.</div>
    <div style="font-family:'Cinzel',serif;font-size:.65rem;color:rgba(244,197,66,.45);letter-spacing:.2em;margin-bottom:1.2rem">EL TEMPLO TE ESPERA</div>
    <button onclick="this.closest('div[style*=fixed]').remove()" style="font-family:'Cinzel',serif;font-size:.75rem;letter-spacing:.15em;background:linear-gradient(135deg,#8A6020,#C9A84C,#E8C97A,#C9A84C,#8A6020);border:none;border-radius:8px;padding:.7rem 2rem;color:#070E2B;font-weight:700;cursor:pointer;width:100%">⚔ ENTENDIDO</button>
  </div>
  <style>@keyframes podIn{from{opacity:0;transform:scale(.85) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}</style>
`;
document.body.appendChild(overlay);
overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
    return;
  }
  G.currentKey = key;
  QS[key] = pickQuestion(key);
  window._setScreen('question');
  try {
    const uid = CURRENT_USER?.id;
    if (uid) {
      const today = todayStr();
      const yaJugóHoy = ['c1', 'c2', 'c3', 'council']
        .some(k => G.dailyAttempts?.[k] === today);
      if (!yaJugóHoy) {
        missionsService.trackEvent(uid, 'play_arena_session');
      }
    }
  } catch(_) {} // ← primero renderiza
  setTimeout(() => {            // ← luego escribe al DOM
    buildQuestion(key);
    startTimer(key, 60);
  }, 60);
}

function buildQuestion(key) {
  const q = QS[key];
  const w = document.getElementById('q-wrap');
  const streakMsg = G.streak >= 5 ? '💀 MODO DIOS' : G.streak >= 4 ? '🔥 RACHA ÉPICA' : G.streak >= 3 ? '⚡ EN LLAMAS' : '🔥 EN RACHA';
const comboClass = G.combo >= 2.5 ? 'cx3' : 'cx2';
const combo = G.combo > 1 ? `<div class="combo-strip ${comboClass}"><span class="cs-mult">×${G.combo}</span><span class="cs-msg">${streakMsg} — NO FALLES</span><span class="cs-pts">PUNTOS ×${G.combo}</span></div>` : '';
  w.innerHTML = `<div style="font-size:1.8rem">${q.ico}</div><div class="ttl" style="font-size:1.05rem">${q.ch}</div>${combo}<div style="display:flex;align-items:center;justify-content:space-between;width:100%;flex-wrap:wrap;gap:.5rem"><div class="hud-row"><div class="chip">⚡ <span class="v" id="qp">${G.pts.toLocaleString()}</span></div><div class="chip ${G.streak > 0 ? 'chip-on' : ''}">🔥 <span class="v" id="qs">${G.streak}</span></div><div class="chip"># <span class="v" id="qr">${getRank(G.lbNow)}</span></div></div><div class="t-ring" id="tring"><svg width="66" height="66"><circle class="t-track" cx="33" cy="33" r="27"/><circle class="t-fill" id="tfill" cx="33" cy="33" r="27"/></svg><div class="t-num" id="tnum">15</div></div></div><div class="q-card"><div class="q-scene">${q.scene}</div><div class="divl" style="width:80px"></div><div class="q-main">${q.q}</div></div><div class="opts-grid" id="opts-${key}">${q.opts.map((o, i) => `<button class="opt ${OPC[i]}" onclick="window._answer('${key}',${i})"><span class="opt-letter">${OLET[i]}</span>${o}</button>`).join('')}</div>`;
}

function startTimer(key, secs) {
  G.timeLeft = secs;
  if (G.timer) clearInterval(G.timer);
  G.timer = setInterval(() => {
    G.timeLeft--;
    const fill = document.getElementById('tfill');
    const num = document.getElementById('tnum');
    const ring = document.getElementById('tring');
    if (fill) fill.style.strokeDashoffset = 170 * (1 - G.timeLeft / secs);
    if (num) num.textContent = G.timeLeft;
    if (G.timeLeft <= 10 && ring) ring.classList.add('danger');
    if (G.timeLeft <= 0) {
      clearInterval(G.timer);
      if (!G.ans[key]) timeUp(key);
    }
  }, 1000);
}

async function timeUp(key) {
  G.ans[key] = true;
  G.streak = 0;
  G.combo = 1;
  disableOpts(key, -1, QS[key].ok);
  const earned = 20;
  G.pts += earned;
  addXP(5);
  spawnBurst('wrong', 10);
  showFB(false, earned, '⏰ TIEMPO', 'El templo no espera.', '');
  if (!G.dailyAttempts) G.dailyAttempts = {};
  G.dailyAttempts[key] = todayStr();
  G.lbPrev = [...G.lbNow];
  await upsertPlayer(G.name, G.pts, G.maxStreak, G.correct, G.av, '', G.gender || 'm', G.charVariant || 0, G.dailyAttempts);
  G.lbNow = await fetchLB();
  lastLBSnap = [];
  checkCouncil();
  setTimeout(() => buildPodium(key, earned, false), 1950);
}

async function answer(key, idx) {
  if (G.ans[key]) return;
  G.ans[key] = true;
  if (window._syncChambers) window._syncChambers();
  if (G.timer) clearInterval(G.timer);
  const q = QS[key];
  const correct = idx === q.ok;
  const tBonus = Math.floor(G.timeLeft * 2);
  let earned = 0;
  disableOpts(key, idx, q.ok);
  if (correct) {
    G.streak++;
    if (G.streak > G.maxStreak) G.maxStreak = G.streak;
    G.combo = G.streak >= 5 ? 3 : G.streak >= 4 ? 2.5 : G.streak >= 3 ? 2 : G.streak >= 2 ? 1.5 : 1;
    earned = Math.floor((q.pts + tBonus) * G.combo);
    G.pts += earned;
    G.correct++;
    G.done[key] = true;
    
    if (window._syncChambers) window._syncChambers();
    // ⚔️ Misión: Racha de Fuego
    if (G.done.c1 && G.done.c2 && G.done.c3 && G.done.council) {
      try {
        const uid = CURRENT_USER?.id;
        if (uid) {
          const r1 = await missionsService.trackProgress(uid, 'perfect_session', 1);
          if (r1?.length) showMissionToast('🔥 ¡Racha de Fuego completada! +100XP');
        }
      } catch(_) {}
    }
    addXP(Math.max(30, Math.floor(earned * 0.12)));
    spawnBurst('correct', 28);
  } else {
    G.streak = 0;
    G.combo = 1;
    earned = 20;
    G.pts += 20;
    addXP(8);
    spawnBurst('wrong', 10);
  }
  const sm = correct && G.streak >= 2
  ? G.streak >= 10
    ? `🔥⚡ ¡LEYENDA ABSOLUTA! RACHA DE ${G.streak} — EL TEMPLO TIEMBLA`
    : G.streak >= 7
    ? `🔥🔥 ¡IMPARABLE! Estás en Racha de ${G.streak} — No pares ahora`
    : G.streak >= 5
    ? `⚡ ¡DOMINANDO! Estás en Racha de ${G.streak} — ¿Hasta dónde llegas?`
    : G.streak >= 3
    ? `🔥 ¡Estás en Racha de ${G.streak}! — El Templo te observa`
    : `🔥 ¡Estás en Racha de ${G.streak}! — Sigue así, Templario`
  : '';

  if (!G.answered_qids) G.answered_qids = {};
  if (!G.answered_qids[key]) G.answered_qids[key] = [];
  if (QS[key] && QS[key].id && !G.answered_qids[key].includes(QS[key].id)) {
    G.answered_qids[key].push(QS[key].id);
  }

  if (correct) {
      GAME_AUDIO.playCorrectSound();
      try {
        const uid = CURRENT_USER?.id;
        if (uid) {
  const r = await missionsService.trackProgress(uid, 'arena_correct_answer', 1);
  if (r?.length) showMissionToast('🔥 ¡Racha de Fuego! +XP');
}      } catch(_) {}
    } else {
      GAME_AUDIO.playWrongSound();
      try {
        const uid = CURRENT_USER?.id;
        if (uid) {
  await missionsService.trackProgress(uid, 'arena_correct_answer', 0);
}
      } catch(_) {}
    }
showFB(correct, earned, correct ? '¡CORRECTO!' : 'INCORRECTO', q.wis, sm, !correct);
  G.lbPrev = [...G.lbNow];
  if (!G.dailyAttempts) G.dailyAttempts = {};
  G.dailyAttempts[key] = todayStr();
  await upsertPlayer(G.name, G.pts, G.maxStreak, G.correct, G.av, '', G.gender || 'm', G.charVariant || 0, G.dailyAttempts);
  G.lbNow = await fetchLB();
  lastLBSnap = [];
  checkCouncil();
  setTimeout(() => {
    sessionStorage.setItem('templo_ranking', JSON.stringify(G.lbNow));
    sessionStorage.setItem('templo_from_game', '1');
    sessionStorage.setItem('templo_streak', G.streak);
if (window._navigate) window._navigate('/games/templarios-dijeron/ranking');
  }, 1950);
}

function disableOpts(key, sel, ok) {
  const g = document.getElementById('opts-' + key);
  if (!g) return;
  g.querySelectorAll('.opt').forEach((b, i) => {
    b.disabled = true;
    if (i === ok) b.classList.add('correct');
    else if (i === sel && sel !== ok) b.classList.add('wrong');
    else b.classList.add('dimmed');
  });
}

function showFB(ok, pts, hl, wis, str, consolation = false) {
  const ov = document.getElementById('fbo');
  const h = document.getElementById('fb-h'), p = document.getElementById('fb-p'), s = document.getElementById('fb-s'), w = document.getElementById('fb-w');
  ov.className = ok ? 'fbo-ok' : 'fbo-no';
  ov.querySelectorAll('.smoke-cloud').forEach(el => { el.style.animation='none'; void el.offsetWidth; el.style.animation=''; });
  h.className = 'fb-h ' + (ok ? 'fb-ok' : 'fb-no');
if (ok && hl.includes('👑')) {
  h.innerHTML = `¡CORRECTO! <span style="display:inline-block;margin-left:6px;padding:2px 10px;border-radius:20px;background:linear-gradient(135deg,rgba(10,30,60,0.95),rgba(5,15,40,0.98));border:1px solid rgba(79,195,247,0.8);color:#4fc3f7;font-size:1rem;font-weight:900;font-family:'Cinzel',serif;letter-spacing:1px;animation:vipBadgePulse 2.5s ease-in-out infinite;vertical-align:middle;">👑 +10% VIP</span>`;
} else {
  h.textContent = hl;
}
  if (pts > 0) {
    p.textContent = '+' + pts + ' pts' + (consolation ? ' (consolación)' : '');
    p.style.cssText = consolation ? 'display:block;color:#F97316;font-size:1.1rem' : 'display:block';
  } else p.style.display = 'none';
  if (str) { s.textContent = str; s.style.display = 'block'; } else s.style.display = 'none';
  w.textContent = '"' + wis + '"';
  w.style.display = 'block';
  ov.style.display = 'flex';
  setTimeout(() => ov.style.display = 'none', 1850);
}

function addXP(a) {
  const prevLevel = G.level;
  const prevRank  = G.rank;
  G.xp += a;

  while (G.xp >= getXpMax()) {
    G.xp -= getXpMax();
    G.level++;

    // Al llegar al nivel 20 → sube rango y resetea nivel
    if (G.level > 20) {
      G.level = 1;
      G.xp = 0;
      if (G.rank < 6) G.rank++;
      showRankUpToast(G.rank);
    }
  }

  // Hitos cada N niveles (del admin)
  if (G.level > prevLevel && MILESTONE_CONFIG?.is_active) {
    const n = MILESTONE_CONFIG.every_n_levels || 5;
    if (G.level % n === 0) {
      deliverMilestoneReward(G.level);
    }
  }
  updateXP();
}

function showRankUpToast(rank) {
  const info = getRankInfo(rank);
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:10000;background:linear-gradient(135deg,#0a0020,#1a0040);border:2px solid ${info.color};border-radius:20px;padding:1.2rem 2rem;text-align:center;box-shadow:0 0 60px ${info.color}66;animation:missionToastIn .4s cubic-bezier(.34,1.4,.64,1) both;font-family:'Cinzel',serif;min-width:240px;`;
  t.innerHTML = `
    <div style="font-size:2.2rem;margin-bottom:.4rem">${info.emoji}</div>
    <div style="color:${info.color};font-size:1rem;letter-spacing:.15em;margin-bottom:.2rem;font-weight:700">¡NUEVO RANGO!</div>
    <div style="color:#fff;font-size:.85rem;letter-spacing:.1em">${info.label}</div>
    <div style="color:rgba(255,255,255,.5);font-size:.65rem;margin-top:.4rem">Nivel reiniciado · Mayor desafío</div>
  `;
  document.body.appendChild(t);
  setTimeout(() => { t.style.transition='opacity .5s'; t.style.opacity='0'; setTimeout(()=>t.remove(),500); }, 4000);
}

async function deliverMilestoneReward(level) {
  const xp    = MILESTONE_CONFIG.xp_reward    || 200;
  const coins = MILESTONE_CONFIG.coins_reward  || 500;
  G.pts += coins;
  G.xp  += xp;
  while (G.xp >= XP_MAX) { G.xp -= XP_MAX; G.level++; }
  updateXP();
  if (sb && CURRENT_USER) {
    try {
      await sb.from('user_level_claims').insert({
        user_id:      CURRENT_USER.id,
        level,
        xp_reward:    xp,
        coins_reward: coins,
        claimed_at:   new Date().toISOString(),
      });
    } catch(e) {}
  }
  await saveLB();
  showMilestoneToast(level, coins, xp);
}

function showWeeklyPrizeToast(prize) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.88);
    backdrop-filter:blur(12px);
    animation:fadeInBg .4s ease;
  `;
  overlay.innerHTML = `
    <style>
      @keyframes fadeInBg{from{opacity:0}to{opacity:1}}
      @keyframes prizeCardIn{
        0%{opacity:0;transform:scale(.5) translateY(50px)}
        70%{transform:scale(1.05) translateY(-5px)}
        100%{opacity:1;transform:scale(1) translateY(0)}
      }
      @keyframes prizeRayRotate{to{transform:rotate(360deg)}}
      @keyframes prizePulse{
        0%,100%{box-shadow:0 0 40px rgba(244,197,66,.4),0 0 80px rgba(244,197,66,.1)}
        50%{box-shadow:0 0 80px rgba(244,197,66,.9),0 0 160px rgba(244,197,66,.3)}
      }
      @keyframes prizeNumIn{
        0%{transform:scale(.6);opacity:0}
        70%{transform:scale(1.2)}
        100%{transform:scale(1);opacity:1}
      }
    </style>
    <div style="
      position:relative;
      max-width:320px;width:90%;
      background:linear-gradient(160deg,#0D1A3E,#070E2B 55%,#1A0A2A);
      border:1px solid rgba(244,197,66,.8);
      border-radius:24px;
      padding:2.5rem 2rem 2rem;
      text-align:center;
      animation:prizeCardIn .65s cubic-bezier(.34,1.4,.64,1) both, prizePulse 3s ease-in-out infinite;
      overflow:hidden;
    ">
      <div style="
        position:absolute;top:50%;left:50%;
        width:500px;height:500px;
        transform:translate(-50%,-50%);
        animation:prizeRayRotate 14s linear infinite;
        pointer-events:none;
        background:conic-gradient(
          rgba(244,197,66,0.05) 0deg,transparent 25deg,
          rgba(244,197,66,0.05) 50deg,transparent 75deg,
          rgba(244,197,66,0.05) 100deg,transparent 125deg,
          rgba(244,197,66,0.05) 150deg,transparent 175deg,
          rgba(244,197,66,0.05) 200deg,transparent 225deg,
          rgba(244,197,66,0.05) 250deg,transparent 275deg,
          rgba(244,197,66,0.05) 300deg,transparent 325deg,
          rgba(244,197,66,0.05) 350deg,transparent 360deg
        );
        border-radius:50%;
      "></div>
      <div style="position:absolute;top:0;left:0;right:0;height:1px;
        background:linear-gradient(90deg,transparent,rgba(244,197,66,1),transparent);">
      </div>
      <div style="font-size:3.8rem;margin-bottom:.4rem;
        filter:drop-shadow(0 0 30px rgba(244,197,66,.9));
        animation:prizeNumIn .5s cubic-bezier(.34,1.4,.64,1) .2s both;">
        🏆
      </div>
      <div style="
        font-family:'Cinzel Decorative',serif;
        font-size:.72rem;letter-spacing:.28em;
        color:#F4C542;
        text-shadow:0 0 24px rgba(244,197,66,.9);
        margin-bottom:.25rem;
      ">${prize.label || 'PREMIO SEMANAL'}</div>
      <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(244,197,66,.5),transparent);margin:.7rem 0;"></div>
      <div style="
        font-family:'Cinzel',serif;font-size:.68rem;
        color:rgba(240,234,214,.6);margin-bottom:1.3rem;
        letter-spacing:.06em;line-height:1.6;
      ">${prize.reason || ''}</div>
      <div style="display:flex;justify-content:center;gap:.9rem;margin-bottom:1.6rem;">
        <div style="
          background:rgba(244,197,66,.1);
          border:1px solid rgba(244,197,66,.45);
          border-radius:14px;padding:.9rem 1.3rem;
          animation:prizeNumIn .5s cubic-bezier(.34,1.4,.64,1) .35s both;
        ">
          <div style="font-size:1.5rem;margin-bottom:.2rem;">🪙</div>
          <div style="font-family:'Cinzel',serif;font-weight:900;font-size:1.5rem;
            color:#FFE580;text-shadow:0 0 20px rgba(244,197,66,1);">
            +${(prize.coins||0).toLocaleString()}
          </div>
          <div style="font-size:.52rem;color:rgba(244,197,66,.5);letter-spacing:.2em;margin-top:.2rem;">MONEDAS</div>
        </div>
        <div style="
          background:rgba(123,47,190,.12);
          border:1px solid rgba(155,79,222,.45);
          border-radius:14px;padding:.9rem 1.3rem;
          animation:prizeNumIn .5s cubic-bezier(.34,1.4,.64,1) .45s both;
        ">
          <div style="font-size:1.5rem;margin-bottom:.2rem;">⭐</div>
          <div style="font-family:'Cinzel',serif;font-weight:900;font-size:1.5rem;
            color:#C084FC;text-shadow:0 0 20px rgba(192,132,252,.9);">
            +${(prize.xp||0).toLocaleString()}
          </div>
          <div style="font-size:.52rem;color:rgba(192,132,252,.5);letter-spacing:.2em;margin-top:.2rem;">XP</div>
        </div>
      </div>
      <button onclick="this.closest('[style*=fixed]').remove()" style="
        font-family:'Cinzel',serif;font-size:.78rem;font-weight:700;
        letter-spacing:.2em;
        background:linear-gradient(135deg,#8A6020,#C9A84C,#E8C97A,#C9A84C,#8A6020);
        border:none;border-radius:12px;
        padding:.9rem 0;width:100%;
        color:#070E2B;cursor:pointer;
        box-shadow:0 0 30px rgba(244,197,66,.5);
      ">⚔ RECLAMAR GLORIA</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.style.transition = 'opacity .5s';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    }
  }, 12000);
}

function showMilestoneToast(level, coins, xp) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;background:linear-gradient(135deg,#1a0a00,#2a1500);border:1px solid rgba(244,197,66,.8);border-radius:16px;padding:1rem 1.8rem;text-align:center;box-shadow:0 0 50px rgba(244,197,66,.4);animation:missionToastIn .4s cubic-bezier(.34,1.4,.64,1) both;font-family:'Cinzel',serif;`;
  t.innerHTML = `<div style="font-size:1.6rem;margin-bottom:.3rem">🏆</div><div style="color:#F4C542;font-size:.9rem;letter-spacing:.12em;margin-bottom:.25rem">NIVEL ${level} ALCANZADO</div><div style="color:rgba(240,234,214,.85);font-size:.78rem">+${coins} 🪙 &nbsp;·&nbsp; +${xp} ⭐ XP</div>`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.transition='opacity .4s'; t.style.opacity='0'; setTimeout(()=>t.remove(),450); }, 3500);
}

async function buildPodium(key, earned, correct) {
  const lb = G.lbNow;
  const myNow = getRank(lb);
  const myPrev = G.lbPrev.length ? getRank(G.lbPrev) : myNow;
  const moved = myPrev - myNow;

  window._setScreen('podium');

  setTimeout(async () => {
    // ⚔️ Misión: Top 3 del Templo
    // ⚔️ Misión: Top 10 del Templo
    if (myNow <= 10 && correct) {
      try {
        const uid = (typeof user !== 'undefined' && user?.id) || CURRENT_USER?.id;
        if (uid) {
          const r3 = await missionsService.trackProgress(uid, 'weekly_top10', 1);
          if (r3?.length) showMissionToast('🏅 ¡Misión lista! Ve a /misiones a reclamar');
        }
      } catch(_) {}
    }
      const ttl = document.getElementById('pod-ttl');
    if (ttl) ttl.textContent = correct ? '⬆ RANKING ACTUALIZADO' : 'RANKING ACTUAL';
    const mv = document.getElementById('pod-move');
    if (mv) {
      if (myNow === 1 && correct) mv.innerHTML = `<span style="color:#F4C542;font-size:1.1rem">👑 ¡LÍDER DEL TEMPLO!</span>`;
      else if (moved > 0) mv.innerHTML = `<span style="color:#2ED573;font-size:1rem">▲ ¡Subiste ${moved} posición${moved > 1 ? 'es' : ''}! → #${myNow}</span>`;
      else if (moved < 0) mv.innerHTML = `<span style="color:#FF4757;font-size:.92rem">▼ Bajaste ${Math.abs(moved)} posición${Math.abs(moved) > 1 ? 'es' : ''}. #${myNow}</span>`;
      else mv.innerHTML = `<span style="color:rgba(240,234,214,.6);font-size:.9rem">Posición #${myNow} · ${lb.length} competidores</span>`;
    }
    renderPodStage('pod-stage', lb, 140, 108, 80);
    renderRestRows('pod-rest', lb, 3, 9, myNow, correct);
    renderPodHeroes(lb);
    const we = document.getElementById('pod-wisdom');
    if (we) { we.textContent = '"' + QS[key].wis + '"'; we.style.display = 'block'; }
    const ee = document.getElementById('pod-earned');
    if (ee) ee.textContent = earned > 0 ? `+${earned} pts ganados · posición #${myNow}` : `Sin puntos · posición #${myNow}`;
    const btn = document.getElementById('pod-btn');
    if (btn) {
      const allDone = G.done.c1 && G.done.c2 && G.done.c3 && G.done.council;
      const cRdy = !G.ans.council && ['c1', 'c2', 'c3'].filter(k => G.done[k]).length >= 2;
      if (allDone) { btn.textContent = '🏆 Ver Resultado Final'; btn.onclick = () => showFinal(); }
      else if (cRdy) { btn.textContent = '⚡ Continuar →'; btn.onclick = () => { stopPolls(); window._setScreen('map'); if (window._navigate) window._navigate('/games/templarios-dijeron/ranking'); }; }
else { btn.textContent = 'Continuar →'; btn.onclick = () => { stopPolls(); window._setScreen('map'); if (window._navigate) window._navigate('/games/templarios-dijeron/ranking'); }; }
    }
  }, 80);
}

async function showFinal() {
  stopPolls();
  const lb = await fetchLB();
  const myRank = getRank(lb);
  document.getElementById('final-rank').textContent = '#' + myRank;
  document.getElementById('final-of').textContent = 'de ' + lb.length + ' competidores';
  document.getElementById('final-streak').textContent = G.maxStreak + '🔥';
  document.getElementById('final-correct').textContent = G.correct + '/4';
  const pe = document.getElementById('final-pts');
  if (pe) {
    let c = 0;
    const iv = setInterval(() => {
      c = Math.min(c + Math.ceil(G.pts / 40), G.pts);
      pe.textContent = c.toLocaleString();
      if (c >= G.pts) clearInterval(iv);
    }, 35);
  }
  // ⚔️ Misión: Leyenda Semanal
  if (myRank <= 3) {
    const r2 = await missionsService.trackProgress(CURRENT_USER.id, 'weekly_top3', 1);
    if (r2?.length) showMissionToast('👑 ¡Leyenda Semanal! +200XP');
  }
  window._setScreen('final');
}

function renderPodStage(cid, lb, h1, h2, h3) {
  const el = document.getElementById(cid);
  if (!el) return;
  const slots = [{ d: lb[1], r: 2, h: h2, bc: 'pb2', m: '🥈' }, { d: lb[0], r: 1, h: h1, bc: 'pb1', m: '👑' }, { d: lb[2], r: 3, h: h3, bc: 'pb3', m: '🥉' }];
  el.innerHTML = slots.map(({ d, r, h, bc, m }) => {
    if (!d) return '<div style="flex:1"></div>';
    const isMe = d.n === G.name;
    const av = AV[(d.av || 0) % 10];
    const init = d.n.slice(0, 2).toUpperCase();
    const sz = isMe ? 48 : 40;
    return `<div class="pod pod-${r} ${isMe ? 'pod-me' : ''}" style="animation:slideUp .5s ease ${r === 1 ? '.05s' : r === 2 ? '.2s' : '.35s'} both"><div class="pod-av ${av}" style="width:${sz}px;height:${sz}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:${isMe ? '.9' : '.75'}rem;font-weight:700;flex-shrink:0">${init}</div><div class="pod-name">${d.n.length > 10 ? d.n.slice(0, 9) + '…' : d.n}</div><div class="pod-score">${d.p.toLocaleString()} pts</div><div class="pod-crown">${m}</div><div class="pod-block ${bc}" style="height:${h}px;animation:podRise .7s ease ${r === 1 ? '.05s' : r === 2 ? '.25s' : '.4s'} both">${r}</div></div>`;
  }).join('');
}

function renderRestRows(cid, lb, from, to, myRank, highlight) {
  const el = document.getElementById(cid);
  if (!el) return;
  Object.keys(_heroRAFs).forEach(k => {
    if (k.startsWith('rc-')) { cancelAnimationFrame(_heroRAFs[k]); delete _heroRAFs[k]; }
  });
  el.innerHTML = '';
  const isLiveScreen = cid === 'live-rest';
  const userOutsideTop = isLiveScreen && G.name && myRank > to;
  const effectiveTo = userOutsideTop ? to - 1 : to;
  lb.slice(from, effectiveTo).forEach((p, i) => {
    const rank = from + i + 1;
    const isMe = p.n === G.name;
    const av = AV[(p.av || 0) % 10];
    const init = p.n.slice(0, 2).toUpperCase();
    const pi = G.lbPrev.findIndex(x => x.n === p.n);
    const pr = pi >= 0 ? pi + 1 : lb.length + 1;
    const delta = pr - rank;
    const dh = delta > 0 ? `<span class="rk-delta d-up">▲${delta}</span>` : delta < 0 ? `<span class="rk-delta d-dn">▼${Math.abs(delta)}</span>` : `<span class="rk-delta d-eq">—</span>`;
    const jc = (delta > 0 && highlight) ? 'jumped' : '';
    const row = document.createElement('div');
    row.className = `rk-row ${isMe ? 'is-me' : ''} ${jc}`;
    row.style.cssText = `animation:slideLeft .4s ease ${i * 0.06}s both`;
    if (isLiveScreen) {
      const posSpan = document.createElement('span'); posSpan.className = 'rk-pos'; posSpan.textContent = rank; posSpan.style.cssText = isMe ? 'color:var(--g2)' : '';
      const charWrap = document.createElement('div'); charWrap.style.cssText = 'width:34px;height:34px;flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center';
      const nameSpan = document.createElement('span'); nameSpan.className = 'rk-name'; nameSpan.style.flex = '1'; nameSpan.innerHTML = p.n + (isMe ? `<span class="me-tag">TÚ</span>` : '');
      const ptsSpan = document.createElement('span'); ptsSpan.className = 'rk-pts'; ptsSpan.textContent = p.p.toLocaleString() + ' pts';
      row.appendChild(posSpan); row.appendChild(charWrap); row.appendChild(nameSpan); row.appendChild(ptsSpan);
      if (p.streak > 0) { const strk = document.createElement('span'); strk.style.fontSize = '.72rem'; strk.textContent = '🔥' + p.streak; row.appendChild(strk); }
      row.insertAdjacentHTML('beforeend', dh);
      el.appendChild(row);
      spawnRowChar(charWrap, p, 34);
    } else {
      row.innerHTML = `<span class="rk-pos">${rank}</span><div class="rk-av ${av}" style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:.6rem;font-weight:700;flex-shrink:0">${init}</div><span class="rk-name">${p.n}${isMe ? `<span class="me-tag">TÚ</span>` : ''}</span><span class="rk-pts">${p.p.toLocaleString()} pts</span>${p.streak > 0 ? `<span style="font-size:.72rem">🔥${p.streak}</span>` : ''}${dh}`;
      el.appendChild(row);
    }
  });
  if (userOutsideTop) {
    const me = lb.find(p => p.n === G.name);
    const sep = document.createElement('div'); sep.style.cssText = 'height:1px;background:linear-gradient(90deg,transparent,var(--g),transparent);margin:.15rem 0'; el.appendChild(sep);
    const bar = document.createElement('div'); bar.className = 'rk-row is-me'; bar.style.cssText = 'background:linear-gradient(90deg,rgba(36,24,6,.98),rgba(20,14,4,.98));border:1px solid var(--g);border-left:3px solid var(--g2);box-shadow:0 0 20px rgba(201,168,76,.25);animation:slideLeft .4s ease .3s both;';
    const posSpan = document.createElement('span'); posSpan.className = 'rk-pos'; posSpan.textContent = myRank; posSpan.style.cssText = 'color:var(--g2)';
    const charWrap = document.createElement('div'); charWrap.style.cssText = 'width:34px;height:34px;flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center';
    const nameSpan = document.createElement('span'); nameSpan.className = 'rk-name'; nameSpan.style.flex = '1'; nameSpan.innerHTML = G.name + `<span class="me-tag">TÚ</span>`;
    const ptsSpan = document.createElement('span'); ptsSpan.className = 'rk-pts'; ptsSpan.textContent = G.pts.toLocaleString() + ' pts';
    bar.appendChild(posSpan); bar.appendChild(charWrap); bar.appendChild(nameSpan); bar.appendChild(ptsSpan); el.appendChild(bar);
    spawnRowChar(charWrap, me || { gender: G.gender || 'm', charVariant: G.charVariant || 0 }, 34);
  } else if (!isLiveScreen && myRank > to && G.name) {
    const me = lb.find(p => p.n === G.name);
    if (me) {
      const sep = document.createElement('div'); sep.style.cssText = 'height:1px;background:linear-gradient(90deg,transparent,var(--st3),transparent);margin:.3rem 0'; el.appendChild(sep);
      const bar = document.createElement('div'); bar.className = 'rk-row is-me'; bar.style.cssText = 'animation:slideLeft .4s ease .5s both';
      bar.innerHTML = `<span class="rk-pos">${myRank}</span><div class="rk-av ${AV[G.av % 10]}" style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:.6rem;font-weight:700;flex-shrink:0">${G.name.slice(0, 2)}</div><span class="rk-name">${G.name}<span class="me-tag">TÚ</span></span><span class="rk-pts">${G.pts.toLocaleString()} pts</span>`;
      el.appendChild(bar);
    }
  }
}

function spawnRowChar(container, p, size) {
  const gender = p.gender || 'm';
  const charVariant = (p.charVariant !== undefined && p.charVariant !== null) ? Number(p.charVariant) : 0;
  const safeVariant = Math.min(charVariant, (CHAR_VARIANTS[gender] || CHAR_VARIANTS['m']).length - 1);
  const variant = (CHAR_VARIANTS[gender] || CHAR_VARIANTS['m'])[safeVariant] || CHAR_VARIANTS['m'][0];
  const cvs = document.createElement('canvas');
  const uid = 'rc-' + Math.random().toString(36).slice(2);
  cvs.id = uid;
  cvs.width = size;
  cvs.height = size;
  cvs.style.cssText = `width:${size}px;height:${size}px;display:block;flex-shrink:0`;
  container.appendChild(cvs);
  const t0 = performance.now();
  function draw(now) {
    _heroRAFs[uid] = requestAnimationFrame(draw);
    const c = document.getElementById(uid);
    if (!c) { cancelAnimationFrame(_heroRAFs[uid]); delete _heroRAFs[uid]; return; }
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    drawCSChar(ctx, size / 2, size * 0.92, variant, gender, now - t0, size, size);
  }
  _heroRAFs[uid] = requestAnimationFrame(draw);
}

function renderPodHeroes(lb) {
  renderElitePanel(lb, 'pod-hero');
}

function renderElitePanel(lb, prefix) {
  const RANKS = [
    { id: `${prefix}-1`, rank: 1, badge: '👑', delay: '0s', cls: 'rank1' },
    { id: `${prefix}-2`, rank: 2, badge: '🥈', delay: '.18s', cls: 'rank2' },
    { id: `${prefix}-3`, rank: 3, badge: '🥉', delay: '.34s', cls: 'rank3' }
  ];
  RANKS.forEach(({ id }) => { if (_heroRAFs[id]) { cancelAnimationFrame(_heroRAFs[id]); _heroRAFs[id] = null; } });
  RANKS.forEach(({ id, rank, badge, delay, cls }) => {
    const el = document.getElementById(id);
    if (!el) return;
    const p = lb[rank - 1];
    if (!p) { el.style.display = 'none'; el.innerHTML = ''; return; }
    const gender = p.gender || 'm';
    const charVariant = (p.charVariant !== undefined && p.charVariant !== null) ? Number(p.charVariant) : 0;
    const safeVariant = Math.min(charVariant, (CHAR_VARIANTS[gender] || CHAR_VARIANTS['m']).length - 1);
    const variant = (CHAR_VARIANTS[gender] || CHAR_VARIANTS['m'])[safeVariant] || CHAR_VARIANTS['m'][0];
    const isMobilePanel = id.startsWith('live-hero-m-');
    const CW = isMobilePanel ? 62 : 88, CH = isMobilePanel ? 88 : 124;
    el.className = `live-hero-card ${cls}`;
    const extraStyle = isMobilePanel ? 'flex:1;max-width:110px;min-width:0;' : '';
    el.setAttribute('style', `display:flex;animation-delay:${delay};${extraStyle}`);
    const canvasMargin = isMobilePanel ? ';margin-left:-5px' : '';
    const ptsStyle = isMobilePanel ? 'align-self:flex-end;padding-right:4px' : '';
    el.innerHTML = `<span class="lhc-badge">${badge}</span><canvas id="${id}-cvs" width="${CW}" height="${CH}" style="display:block;width:${CW}px;height:${CH}px;margin-top:.15rem${canvasMargin}"></canvas><div class="lhc-name">${p.n.length > 16 ? p.n.slice(0, 15) + '…' : p.n}</div><div class="lhc-char">${variant.name}</div><div class="lhc-pts" style="${ptsStyle}">${p.p.toLocaleString()} pts</div>`;
    const t0 = performance.now();
    function drawHero(now) {
      _heroRAFs[id] = requestAnimationFrame(drawHero);
      const cvs = document.getElementById(`${id}-cvs`);
      if (!cvs) { cancelAnimationFrame(_heroRAFs[id]); _heroRAFs[id] = null; return; }
      const ctx = cvs.getContext('2d');
      const elapsed = now - t0;
      ctx.clearRect(0, 0, CW, CH);
      ctx.strokeStyle = 'rgba(201,168,76,.15)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(4, CH * .9); ctx.lineTo(CW - 4, CH * .9); ctx.stroke();
      drawCSChar(ctx, CW / 2, CH * 0.88, variant, gender, elapsed, CW, CH);
    }
    _heroRAFs[id] = requestAnimationFrame(drawHero);
  });
}


import { missionsService } from '../../../services/missions.service';

function showMissionToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = "position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:9999;background:linear-gradient(135deg,#1a2a6c,#0D1A3E);border:1px solid rgba(244,197,66,.6);border-radius:14px;padding:.9rem 1.6rem;font-family:'Cinzel',serif;font-size:.85rem;color:#F4C542;text-align:center;box-shadow:0 0 40px rgba(244,197,66,.3);animation:missionToastIn .4s cubic-bezier(.34,1.4,.64,1) both";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.transition='opacity .4s'; t.style.opacity='0'; setTimeout(()=>t.remove(),400); }, 3000);
}

export default function TemplariosDijeron() {
  const MAESTRO_MSGS = [
    '✨ ¡Hoy es un gran día para crecer, Templario!',
    '⚔️ La disciplina construye imperios.',
    '🌟 Cada misión completada te acerca a tu legado.',
    '🧠 El conocimiento es tu arma más poderosa.',
    '🔥 Tu racha habla de tu carácter.',
    '🏛️ El Templo te observa y te impulsa.',
    '💡 Un Templario actúa aunque tenga miedo.',
    '⚡ Pequeños pasos, grandes victorias.',
    '⭐ lidera el podio semanal, deja tu marca en la historia del Templo.',
    '🎁 Obtén premios exclusivos cada semana por tu desempeño. ¡Conviértete en leyenda!'
  ]; 
  
  const [bubbleIdx, setBubbleIdx] = useState(0);
  const bubbleText = MAESTRO_MSGS[bubbleIdx];
  useEffect(() => {
    const iv = setInterval(() => setBubbleIdx(i => (i + 1) % MAESTRO_MSGS.length), 5000);
    return () => clearInterval(iv);
  }, []);
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [currentScreen, setCurrentScreen] = useState('cinematic');
const [lbData, setLbData] = useState([]);
const [doneChambers, setDoneChambers] = useState({...G.done});
const [answeredChambers, setAnsweredChambers] = useState({...G.ans});
useEffect(() => {
  window._setScreen = setCurrentScreen;
window._answer = answer;
window._navigate = navigate;
window._syncChambers = () => { setDoneChambers({...G.done}); setAnsweredChambers({...G.ans}); };
});
const [shake, setShake] = useState(false);
const [showEpicEnd, setShowEpicEnd] = useState(false);
useEffect(() => {
  const all = answeredChambers.c1 && answeredChambers.c2 && answeredChambers.c3 && answeredChambers.council;
  if (all) setTimeout(() => setShowEpicEnd(true), 800);
}, [answeredChambers]);
const [flash, setFlash] = useState(true);
const [compBanner, setCompBanner] = useState(false);
  const [compTime, setCompTime]     = useState({d:0,h:0,m:0,s:0});
  const [badgeCycle, setBadgeCycle] = useState(0);
  const [arenaQuests, setArenaQuests] = useState([]);
  const [arenaQuestIdx, setArenaQuestIdx] = useState(0);
  useEffect(() => {
    if (!arenaQuests.length) return;
    const iv = setInterval(() => setArenaQuestIdx(i => (i + 1) % arenaQuests.length), 3000);
    return () => clearInterval(iv);
  }, [arenaQuests]);

  useEffect(() => {
    const iv = setInterval(() => setBadgeCycle(c => c + 1), 3000);
    return () => clearInterval(iv);
  }, []);
  const didRun = useRef(false);

  // ── Muro: forzar VERTICAL en móvil ──
  useEffect(() => {
    const wall = document.createElement('div');
    wall.id = 'vertical-wall';
    wall.style.cssText = `display:none;position:fixed;inset:0;z-index:99999;background:#030818;flex-direction:column;align-items:center;justify-content:center;gap:20px;text-align:center;padding:30px;`;
    wall.innerHTML = `
      <style>@keyframes rotateHintV{0%,40%{transform:rotate(90deg)}60%,100%{transform:rotate(0deg)}}</style>
      <div style="font-size:64px;animation:rotateHintV 2s ease-in-out infinite;">📱</div>
      <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#c9a84c;text-shadow:0 0 16px rgba(201,168,76,0.6);">Gira tu dispositivo</div>
      <div style="font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;color:rgba(201,168,76,0.5);text-transform:uppercase;line-height:1.8;">
        Esta pantalla solo se visualiza<br>en modo <strong style="color:#c9a84c">vertical</strong><br>⚔ Templo del Propósito ⚔
      </div>
    `;
    document.body.appendChild(wall);

    function checkVertical() {
      const isMobile = window.innerWidth <= 900;
      const isLandscape = window.innerWidth > window.innerHeight;
      wall.style.display = (isMobile && isLandscape) ? 'flex' : 'none';
    }
    checkVertical();
    window.addEventListener('resize', checkVertical);
    window.addEventListener('orientationchange', () => setTimeout(checkVertical, 200));

    return () => {
      wall.remove();
      window.removeEventListener('resize', checkVertical);
    };
  }, []);

useEffect(() => {
  let raf;
  const t0 = performance.now();

  function tryDraw() {
    const cvs = document.getElementById('tdp-profile-char');
    if (!cvs) { raf = requestAnimationFrame(tryDraw); return; }
    const ctx = cvs.getContext('2d');
    const gender = G.gender || 'm';
    const variants = CHAR_VARIANTS[gender] || CHAR_VARIANTS['m'];
    const safeVariant = Math.min(G.charVariant || 0, variants.length - 1);
    const variant = variants[safeVariant] || variants[0];

    function draw(now) {
      raf = requestAnimationFrame(draw);
      const c = document.getElementById('tdp-profile-char');
      if (!c) return;
      const cx = c.getContext('2d');
      cx.clearRect(0, 0, 115, 115);
cx.save();
cx.beginPath();
cx.arc(57, 57, 57, 0, Math.PI * 2);
const bg = cx.createRadialGradient(57, 38, 4, 57, 57, 57);
bg.addColorStop(0, '#1E2F7A');
bg.addColorStop(0.6, '#0D1440');
bg.addColorStop(1, '#050B2A');
cx.fillStyle = bg;
cx.fill();
cx.clip();
drawCSChar(cx, 57, 112, variant, gender, now - t0, 115, 115);
cx.restore();
    }
    raf = requestAnimationFrame(draw);
  }

  raf = requestAnimationFrame(tryDraw);
  return () => cancelAnimationFrame(raf);
}, []);
  
useEffect(() => {
  if (currentScreen !== 'question') return;
  const cvs = document.getElementById('q-particles-canvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  let raf;
  const particles = [];

  function resize() {
    cvs.width = cvs.offsetWidth;
    cvs.height = cvs.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 55; i++) {
    particles.push({
      x: Math.random() * cvs.width,
      y: Math.random() * cvs.height,
      r: Math.random() * 1.6 + 0.3,
      sp: Math.random() * 0.4 + 0.15,
      op: Math.random(),
      dop: (Math.random() * 0.012 + 0.004) * (Math.random() < 0.5 ? 1 : -1),
      gold: Math.random() < 0.6,
    });
  }

  function draw() {
    raf = requestAnimationFrame(draw);
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    particles.forEach(p => {
      p.y -= p.sp;
      p.op += p.dop;
      if (p.op <= 0 || p.op >= 1) p.dop *= -1;
      if (p.y < -4) p.y = cvs.height + 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.gold
        ? `rgba(244,197,66,${p.op * 0.7})`
        : `rgba(180,160,255,${p.op * 0.4})`;
      ctx.fill();
    });
  }
  raf = requestAnimationFrame(draw);
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
}, [currentScreen]);

  useEffect(() => {
    const loadGame = async () => {
      const ok = await initSupabase();
      if (!ok) return;
      await loadMilestoneConfig();

      // Misiones reales de 100 Templarios
      sb.from('missions')
        .select('id, title, coin_reward, xp_reward')
        .eq('is_active', true)
        .eq('platform', 'templo')
        .then(({ data }) => { if (data?.length) setArenaQuests(data); });

      const { data: player } = await sb
        .from('templo_players')
        .select('*')
        .eq('id', CURRENT_USER.id)
        .single();
      if (player && player.char_name) {
        G.name = player.char_name;
        const storeCristales = usePlayerStore.getState().cristales;
G.pts = Math.max(player.points ?? 0, storeCristales);
        G.maxStreak = player.streak ?? 0;
        G.correct = player.correct ?? 0;
        G.level = player.level ?? 1;
G.rank  = player.player_rank ?? 0;
G.xp = player.xp ?? 0;
normalizeLevelRank();
G.gender = player.char_gender || 'm';
        G.charVariant = player.char_variant ?? 0;
        G.av = player.char_variant ?? 0;
        G.dailyAttempts = player.daily_attempts || {};
        const savedStreak = parseInt(sessionStorage.getItem('templo_streak') || '0');
        G.streak = savedStreak;
        await loadWeekQuestions();

        // Cargar preguntas respondidas esta semana
const { data: currentWeekData } = await sb
  .from('templo_questions')
  .select('week_number')
  .eq('active', true)
  .order('week_number', { ascending: false })
  .limit(1)
  .single();
const currentWeek = currentWeekData?.week_number || 1;

if ((player.answered_qids_week || 0) !== currentWeek) {
  G.answered_qids = {};
  G.answered_qids_week = currentWeek;
} else {
  G.answered_qids = player.answered_qids || {};
  G.answered_qids_week = player.answered_qids_week || currentWeek;
}
        
        const today = todayStr();
        ['c1','c2','c3','council'].forEach(k => {
          if (G.dailyAttempts[k] === today) {
            G.ans[k] = true;
            G.done[k] = true;
          }
        });
        setDoneChambers({...G.done});
        setAnsweredChambers({...G.ans});
        if (sessionStorage.getItem('templo_from_game') === '1') {
          sessionStorage.removeItem('templo_from_game');
          setCurrentScreen('map');
        }
        // ⚔️ Misión: Veterano del Templo
        const weekId = `${new Date().getFullYear()}-W${Math.ceil((((new Date() - new Date(new Date().getFullYear(),0,1))/86400000)+((new Date(new Date().getFullYear(),0,1)).getDay()+1))/7)}`;
        const authId = user?.id || CURRENT_USER.id;
        missionsService.registerWeekPlayed(authId, weekId);
        G.lbPrev = await fetchLB();
        G.lbNow = [...G.lbPrev];
        lastLBSnap = [...G.lbPrev];
        setLbData([...G.lbNow]);
        if (window._syncChambers) window._syncChambers();

        // ── PREMIOS PENDIENTES ──
        try {
          const { data: prizeResult } = await sb.rpc('deliver_pending_prizes', {
            p_player_id: CURRENT_USER.id
          });
          if (prizeResult?.ok && prizeResult.prizes?.length > 0) {
            G.pts += prizeResult.total_coins || 0;
            addXP(prizeResult.total_xp || 0);
            prizeResult.prizes.forEach((p, i) => {
              setTimeout(() => showWeeklyPrizeToast(p), 2000 + i * 2000);
            });
          }
        } catch(e) { /* silencioso */ }

        // 🏆 Comp banner
        let compInterval;
        sb.from('competition_settings')
          .select('start_date,end_date,is_active')
          .eq('id', 'current')
          .single()
          .then(({ data }) => {
            if (!data?.is_active || !data?.end_date) return;
            const end = new Date(data.end_date);
            if (end < new Date()) return;
            setCompBanner(true);
            const tick = () => {
              const diff = Math.max(0, end - new Date());
              setCompTime({
                d: Math.floor(diff / 86400000),
                h: Math.floor((diff % 86400000) / 3600000),
                m: Math.floor((diff % 3600000) / 60000),
                s: Math.floor((diff % 60000) / 1000),
              });
              if (diff === 0) setCompBanner(false);
            };
            tick();
            compInterval = setInterval(tick, 1000);
          });
      } else {
        // Sin personaje: cinemática → charselect
      }
    };
    if (!didRun.current) {
      didRun.current = true;
      loadGame();
    }
  }, []);

  const handleCinematicEnd = useCallback(() => {
    if (window._syncChambers) window._syncChambers();
    if (G.name) setCurrentScreen('map');
    else setCurrentScreen('charselect');
  }, []);

  const handleEnterChamber = (chamberId) => {
    enterChamber(chamberId);
  };

useEffect(() => {
  if (!sb) return;

  const eventChannel = sb
    .channel('game-events')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'game_events',
        filter: 'event_type=eq.weekly_reset'
      },
      () => {
        G.dailyAttempts = {};
        G.done = {
          c1: false,
          c2: false,
          c3: false,
          council: false
        };

        G.ans = {};
G.pts = 0;
setLbData([]);

        if (window._syncChambers) {
          window._syncChambers();
          setDoneChambers({ ...G.done });
          setAnsweredChambers({ ...G.ans });
        }

        const toast = document.createElement('div');

        toast.style.cssText =
          'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#F4C542;color:#000;padding:12px 24px;border-radius:8px;font-weight:bold;z-index:9999;font-family:Cinzel;';

        toast.textContent =
          '⚔️ ¡Nueva semana! El Templo se ha reiniciado.';

        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 4000);
      }
    )
    .subscribe();

  return () => {
    sb.removeChannel(eventChannel);
  };
}, []);

  const gameState = {
    name: CURRENT_PROFILE?.templario_name || G.name,
    pts: G.pts,
    streak: G.streak,
    xp: G.xp,
    xpMax: getXpMax(),
    level: G.level,
playerRank: G.rank,
rankPos: getRank(G.lbNow, CURRENT_PROFILE?.templario_name || G.name),
    councilDone: 0,
    chambers: { c1: doneChambers.c1, c2: doneChambers.c2, c3: doneChambers.c3, council: doneChambers.council },
    answered: { c1: answeredChambers.c1, c2: answeredChambers.c2, c3: answeredChambers.c3, council: answeredChambers.council },
    maestroSrc: '/assets/maestro_templario.png',
    bubbleText,
    rankList: lbData,
  };

const QUESTION_CSS = [
  "#q-wrap{color:#F0EAD6;font-family:'Cinzel',serif;position:relative;z-index:1;}",
  "@keyframes titlePulse{0%,100%{text-shadow:0 0 20px rgba(244,197,66,.5)}50%{text-shadow:0 0 50px rgba(244,197,66,1),0 0 100px rgba(244,197,66,.3)}}",
  ".ttl{color:#F4C542;font-weight:700;text-align:center;margin:.4rem 0 .9rem;letter-spacing:.08em;font-size:1.15rem;animation:titlePulse 2.5s ease-in-out infinite;}",
  ".hud-row{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;}",
  "@keyframes chipGlow{0%,100%{box-shadow:0 0 6px rgba(244,197,66,.15)}50%{box-shadow:0 0 16px rgba(244,197,66,.45)}}",
  ".chip{background:rgba(244,197,66,.08);border:1px solid rgba(244,197,66,.35);border-radius:20px;padding:.3rem .8rem;font-size:.78rem;color:#F4C542;font-family:'Cinzel',serif;animation:chipGlow 3s ease-in-out infinite;}",
  ".chip-on{background:rgba(255,100,0,.15);border-color:rgba(255,100,0,.5);color:#FF9500;box-shadow:0 0 14px rgba(255,100,0,.3);}",
  "@keyframes dangerBeat{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.06)}}",
  ".t-ring{position:relative;width:66px;height:66px;flex-shrink:0;}",
  ".t-track{fill:none;stroke:rgba(255,255,255,.06);stroke-width:6;}",
  ".t-fill{fill:none;stroke:#F4C542;stroke-width:6;stroke-dasharray:170;stroke-dashoffset:0;stroke-linecap:round;transform:rotate(-90deg);transform-origin:33px 33px;transition:stroke-dashoffset .9s linear,stroke .4s;}",
  ".t-ring.danger .t-fill{stroke:#FF4444;filter:drop-shadow(0 0 8px rgba(255,68,68,.9));}",
  ".t-ring.danger{animation:dangerBeat .5s ease-in-out infinite;}",
  ".t-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.15rem;font-weight:700;color:#F4C542;font-family:'Cinzel',serif;}",
  ".t-ring.danger .t-num{color:#FF4444;}",
  "@keyframes cardIn{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}",
  ".q-card{background:linear-gradient(135deg,rgba(18,28,72,.97),rgba(8,14,44,.99));border:1px solid rgba(244,197,66,.18);border-radius:16px;padding:1.1rem 1.3rem;margin:.8rem 0;animation:cardIn .4s cubic-bezier(.4,0,.2,1) both;box-shadow:0 8px 40px rgba(0,0,0,.6),inset 0 1px 0 rgba(244,197,66,.08);}",
  ".q-scene{font-size:.65rem;color:rgba(244,197,66,.4);letter-spacing:.25em;text-transform:uppercase;margin-bottom:.4rem;}",
  ".q-ctx{font-size:.83rem;color:rgba(240,234,214,.5);margin-bottom:.7rem;font-family:Georgia,serif;font-style:italic;line-height:1.6;border-left:2px solid rgba(244,197,66,.2);padding-left:.7rem;}",
  ".divl{height:1px;background:linear-gradient(90deg,rgba(244,197,66,.5),transparent);margin:.6rem 0;}",
  ".q-main{font-size:1.05rem;color:#F0EAD6;font-weight:600;line-height:1.55;letter-spacing:.02em;}",
  "@keyframes optIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}",
  ".opts-grid{display:grid;grid-template-columns:1fr 1fr;gap:.65rem;margin-top:.9rem;}",
  ".opt{display:flex;align-items:flex-start;gap:.65rem;background:linear-gradient(135deg,rgba(18,28,72,.92),rgba(10,16,50,.97));border:1px solid rgba(244,197,66,.14);border-radius:12px;padding:.85rem 1rem;cursor:pointer;color:#E8DCC8;font-family:'Cinzel',serif;font-size:.8rem;text-align:left;transition:all .18s cubic-bezier(.4,0,.2,1);line-height:1.45;animation:optIn .35s ease both;box-shadow:0 2px 16px rgba(0,0,0,.35);}",
  ".opt:nth-child(1){animation-delay:.08s}.opt:nth-child(2){animation-delay:.14s}.opt:nth-child(3){animation-delay:.2s}.opt:nth-child(4){animation-delay:.26s}",
  ".opt:hover:not(:disabled){background:linear-gradient(135deg,rgba(244,197,66,.14),rgba(244,197,66,.06));border-color:rgba(244,197,66,.55);transform:translateY(-3px) scale(1.015);box-shadow:0 8px 24px rgba(244,197,66,.18);}",
  ".opt-letter{border-radius:50%;min-width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;flex-shrink:0;margin-top:1px;}",
".opt:nth-child(1) .opt-letter{background:rgba(99,179,237,.25);border:1px solid #63B3ED;color:#63B3ED;}",
".opt:nth-child(2) .opt-letter{background:rgba(154,230,180,.25);border:1px solid #9AE6B4;color:#9AE6B4;}",
".opt:nth-child(3) .opt-letter{background:rgba(252,196,107,.25);border:1px solid #FCC46B;color:#FCC46B;}",
".opt:nth-child(4) .opt-letter{background:rgba(245,101,101,.25);border:1px solid #F56565;color:#F56565;}",
  "@keyframes correctFlash{0%{box-shadow:0 0 0 rgba(46,213,115,0)}40%{box-shadow:0 0 50px rgba(46,213,115,.7)}100%{box-shadow:0 0 8px rgba(46,213,115,.2)}}",
  ".opt.correct{background:linear-gradient(135deg,rgba(46,213,115,.2),rgba(46,213,115,.08)) !important;border-color:#2ED573 !important;animation:correctFlash .7s ease forwards !important;}",
  ".opt.correct .opt-letter{background:#2ED573;color:#000;border-color:#2ED573;box-shadow:0 0 12px rgba(46,213,115,.7);}",
  "@keyframes wrongShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}",
  ".opt.wrong{background:linear-gradient(135deg,rgba(255,71,87,.22),rgba(255,71,87,.08)) !important;border-color:#FF4757 !important;animation:wrongShake .45s ease forwards !important;}",
  ".opt.wrong .opt-letter{background:#FF4757;color:#fff;border-color:#FF4757;}",
  ".opt.dimmed{opacity:.22;transform:scale(.97);}",
  ".opt:disabled{cursor:default;}",
  "@keyframes comboPulse{0%,100%{transform:scaleX(1);box-shadow:0 0 20px currentColor}50%{transform:scaleX(1.02);box-shadow:0 0 45px currentColor}}",
"@keyframes comboShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}",
".combo-strip{display:flex;align-items:center;justify-content:space-between;width:100%;padding:.7rem 1.2rem;border-radius:12px;font-family:'Cinzel',serif;font-weight:700;letter-spacing:.1em;margin:.5rem 0;animation:comboPulse .8s ease-in-out infinite;gap:.5rem;}",
".cs-mult{font-size:2rem;font-weight:900;line-height:1;flex-shrink:0;}",
".cs-msg{font-size:.82rem;letter-spacing:.14em;text-align:center;flex:1;animation:comboShake 1.2s ease-in-out infinite;}",
".cs-pts{font-size:.72rem;letter-spacing:.1em;opacity:.85;flex-shrink:0;}",
".cx2{background:linear-gradient(135deg,rgba(255,149,0,.22),rgba(255,100,0,.08));border:2px solid #FF9500;color:#FF9500;box-shadow:0 0 30px rgba(255,149,0,.35),inset 0 1px 0 rgba(255,200,0,.15);}",
".cx3{background:linear-gradient(135deg,rgba(255,71,87,.28),rgba(200,0,30,.1));border:2px solid #FF4757;color:#FF4757;box-shadow:0 0 40px rgba(255,71,87,.5),inset 0 1px 0 rgba(255,150,150,.1);}",
  ".fb-ok{color:#2ED573;text-shadow:0 0 24px rgba(46,213,115,.9);}",
  ".fb-no{color:#FF4757;text-shadow:0 0 24px rgba(255,71,87,.9);}",
  "@keyframes smokeIn{0%{transform:scale(.08);opacity:0}70%{opacity:1}100%{transform:scale(1);opacity:.82}}",
  ".smoke-cloud{position:absolute;border-radius:50%;animation:smokeIn .55s cubic-bezier(.2,.8,.3,1) both;pointer-events:none;}",
  ".fbo-ok .smoke-cloud{background:rgba(46,213,115,.38);}",
  ".fbo-no .smoke-cloud{background:rgba(210,30,30,.44);}"
].join(" ");

  return (
    <div style={{
  position: 'fixed', inset: 0, overflowY: 'auto', background: '#030818',
      transform: shake ? `translate(${(Math.random()-.5)*14}px,${(Math.random()-.5)*9}px)` : 'none',
    }}>
      <style>{`
        @keyframes csEpicFlash {
          0%   { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        @keyframes starTwinkle {
          0%,100% { opacity:.2; transform:scale(1); }
          50%     { opacity:.9; transform:scale(1.4); }
        }
      `}</style>

      {flash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'radial-gradient(ellipse at center, rgba(201,168,76,.9) 0%, rgba(10,7,2,.97) 65%, #000 100%)',
          pointerEvents: 'none',
          animation: 'csEpicFlash .95s ease forwards',
        }} />
      )}
      

{currentScreen === 'entry' && (
  <div onClick={() => {
    GAME_AUDIO.init();
    GAME_AUDIO.playCinematicSequence();
    setCurrentScreen('cinematic');
  }} style={{
    position: 'fixed', inset: 0, zIndex: 600,
    background: 'radial-gradient(ellipse at center, #0D1440 0%, #030818 70%, #000 100%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', userSelect: 'none',
  }}>
    <div style={{
      fontFamily: "'Cinzel Decorative', serif",
      fontSize: 'clamp(1.2rem,5vw,2.4rem)', color: '#C9A84C',
      letterSpacing: '.15em', textShadow: '0 0 40px rgba(201,168,76,.8)',
      marginBottom: '2rem',
    }}>⭐ 100 TEMPLARIOS DIJERON ⭐</div>
    <div style={{
      fontFamily: "'Cinzel', serif", fontSize: '.75rem', color: '#C9A84C',
      letterSpacing: '.25em', border: '1px solid rgba(201,168,76,.4)',
      padding: '.7rem 2rem',
    }}>⚔ ENTRAR A PARTICIPAR AHORA ⚔</div>
  </div>
)}

{currentScreen === 'question' && (
  <div style={{ position: 'fixed', inset: 0, background: '#040B1E', overflowY: 'auto', zIndex: 100 }}>
    <style dangerouslySetInnerHTML={{ __html: QUESTION_CSS }} />

    {/* Fondo animado */}
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      <canvas id="q-particles-canvas" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(244,197,66,.07) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(112,80,255,.05) 0%, transparent 70%)' }} />
    </div>

    {/* Feedback overlay */}
    <div id="fbo" style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', zIndex: 200, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.7rem', overflow: 'hidden' }}>
      <div className="smoke-cloud" style={{ width:340, height:340, top:'50%', left:'50%', transform:'translate(-50%,-50%)', animationDelay:'0s' }} />
      <div className="smoke-cloud" style={{ width:290, height:290, top:'22%', left:'25%', animationDelay:'.07s' }} />
      <div className="smoke-cloud" style={{ width:270, height:270, top:'35%', left:'52%', animationDelay:'.13s' }} />
      <div className="smoke-cloud" style={{ width:250, height:250, top:'12%', left:'44%', animationDelay:'.19s' }} />
      <div className="smoke-cloud" style={{ width:230, height:230, top:'58%', left:'20%', animationDelay:'.09s' }} />
      <div className="smoke-cloud" style={{ width:210, height:210, top:'54%', left:'58%', animationDelay:'.16s' }} />
      <div id="fb-h" style={{ position:'relative', zIndex:1, fontSize:'2.2rem', fontFamily:'Cinzel,serif', fontWeight:700 }} />
      <div id="fb-p" style={{ position:'relative', zIndex:1, display:'none', color:'#F4C542', fontSize:'1.4rem', fontFamily:'Cinzel,serif' }} />
      <div id="fb-s" style={{ position:'relative', zIndex:1, display:'none', color:'#FF9500', fontSize:'1rem' }} />
      <div id="fb-w" style={{ position:'relative', zIndex:1, display:'none', color:'rgba(240,234,214,.75)', fontSize:'.9rem', fontStyle:'italic', maxWidth:'280px', textAlign:'center', lineHeight:1.5 }} />
    </div>

    {/* Contenido */}
    <div id="q-wrap" style={{ position: 'relative', zIndex: 1, padding: '1.2rem', maxWidth: '500px', margin: '0 auto', paddingBottom: '2rem' }} />
  </div>
)}

      

      {showEpicEnd && (
        <div onClick={() => setShowEpicEnd(false)} style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.82)',backdropFilter:'blur(8px)',animation:'epicBgIn .5s ease'}}>
          <div onClick={e => e.stopPropagation()} style={{position:'relative',maxWidth:'340px',width:'92%',background:'linear-gradient(160deg,#0D1A3E,#070E2B,#1A0A2A)',border:'1px solid rgba(244,197,66,0.6)',borderRadius:'24px',padding:'2.5rem 2rem',textAlign:'center',boxShadow:'0 0 80px rgba(244,197,66,0.35),0 0 160px rgba(123,47,190,0.25),0 30px 80px rgba(0,0,0,0.9)',animation:'epicCardIn .6s cubic-bezier(.34,1.4,.64,1)'}}>
            <div style={{position:'absolute',inset:0,borderRadius:'24px',background:'radial-gradient(ellipse at 50% 0%,rgba(244,197,66,0.12),transparent 70%)',pointerEvents:'none'}}/>
            <div style={{fontSize:'3.2rem',marginBottom:'.5rem',animation:'epicSpin 1.2s cubic-bezier(.34,1.4,.64,1)'}}>🏆</div>
            <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:'1.1rem',background:'linear-gradient(135deg,#FFF3A0,#F4C542,#FF9500)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:'.08em',marginBottom:'.4rem',textShadow:'none',filter:'drop-shadow(0 0 20px rgba(244,197,66,0.8))'}}>TEMPLO CONQUISTADO</div>
            <div style={{height:'1px',background:'linear-gradient(90deg,transparent,rgba(244,197,66,0.6),transparent)',margin:'.8rem 0'}}/>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:'.82rem',color:'rgba(240,234,214,0.9)',lineHeight:1.7,marginBottom:'1.2rem'}}>Has completado las <span style={{color:'#F4C542',fontWeight:700}}>4 pruebas del Templo</span>.<br/>Tu nombre quedará grabado en piedra.</div>
            <div style={{display:'flex',justifyContent:'center',gap:'1.2rem',marginBottom:'1.4rem'}}>
              {['🕯️','🧘','🧠','⭐'].map((ico,i) => (
                <div key={i} style={{width:'42px',height:'42px',borderRadius:'50%',background:'linear-gradient(135deg,#1A2860,#0D1440)',border:'1px solid rgba(244,197,66,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',boxShadow:'0 0 16px rgba(244,197,66,0.3)',animation:`epicIconPop .4s cubic-bezier(.34,1.4,.64,1) ${i*0.1}s both`}}>{ico}</div>
              ))}
            </div>
            <button onClick={() => setShowEpicEnd(false)} style={{fontFamily:"'Cinzel',serif",fontSize:'.75rem',letterSpacing:'.18em',background:'linear-gradient(135deg,#8A6020,#C9A84C,#E8C97A,#C9A84C,#8A6020)',border:'none',borderRadius:'10px',padding:'.8rem 2rem',color:'#070E2B',fontWeight:700,cursor:'pointer',width:'100%',boxShadow:'0 0 24px rgba(244,197,66,0.4)'}}>⚔ GLORIA AL TEMPLO</button>
          </div>
          <style>{`
            @keyframes epicBgIn{from{opacity:0}to{opacity:1}}
            @keyframes epicCardIn{from{opacity:0;transform:scale(.7) translateY(40px)}to{opacity:1;transform:scale(1) translateY(0)}}
            @keyframes epicSpin{from{transform:rotate(-30deg) scale(.4);opacity:0}to{transform:rotate(0deg) scale(1);opacity:1}}
            @keyframes epicIconPop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
          `}</style>
        </div>
      )}

      {currentScreen === 'cinematic' && <CinematicIntro onEnd={handleCinematicEnd} />}
      {currentScreen === 'charselect' && <CharSelect onConfirm={() => setCurrentScreen('map')} />}
      {currentScreen === 'map' && <NewMapScreen gameState={gameState} onNavigate={navigate} onEnterChamber={handleEnterChamber} compBanner={compBanner} compTime={compTime} badgeCycle={badgeCycle} arenaQuests={arenaQuests} arenaQuestIdx={arenaQuestIdx} />}
      {currentScreen === 'podium' && (
  <div style={{
    position: 'fixed', inset: 0,
    background: '#070E2B',
    overflowY: 'auto', zIndex: 100,
    padding: '1rem',
    fontFamily: 'Cinzel, serif', color: 'white'
  }}>
    <div id="pod-ttl" style={{
      textAlign: 'center', color: '#F4C542',
      fontSize: '1rem', letterSpacing: '.15em',
      marginBottom: '.5rem'
    }} />
    <div id="pod-move" style={{
      textAlign: 'center', marginBottom: '1rem'
    }} />
    {/* Héroes top 3 */}
    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
      <div id="pod-hero-2" className="live-hero-card" />
      <div id="pod-hero-1" className="live-hero-card" />
      <div id="pod-hero-3" className="live-hero-card" />
    </div>
    {/* Podio visual */}
    <div id="pod-stage" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '.5rem', marginBottom: '1rem' }} />
    {/* Filas ranking */}
    <div id="pod-rest" style={{ maxWidth: '420px', margin: '0 auto .8rem' }} />
    {/* Sabiduría */}
    <div id="pod-wisdom" style={{
      display: 'none', textAlign: 'center',
      color: 'rgba(240,234,214,.7)', fontStyle: 'italic',
      fontSize: '.85rem', maxWidth: '300px',
      margin: '0 auto .8rem'
    }} />
    {/* Puntos ganados */}
    <div id="pod-earned" style={{
      textAlign: 'center', color: '#F4C542',
      fontSize: '.85rem', marginBottom: '1rem'
    }} />
    {/* Botón continuar — buildPodium lo configura */}
    <div style={{ textAlign: 'center' }}>
      <button id="pod-btn" style={{
        padding: '.8rem 2.5rem',
        background: 'linear-gradient(135deg,#C9A84C,#F4C542)',
        border: 'none', borderRadius: '6px',
        fontFamily: 'Cinzel,serif', fontWeight: 700,
        color: '#070E2B', fontSize: '.9rem',
        cursor: 'pointer', letterSpacing: '.1em'
      }}>Continuar →</button>
    </div>
  </div>
)}

      {currentScreen === 'live' && (
  <div style={{color:'white', textAlign:'center', marginTop:'100px', fontFamily:'Cinzel, serif'}}>
    <h2>📊 Ranking Global (próximamente)</h2>
    <button onClick={() => setCurrentScreen('map')} style={{marginTop:'20px', padding:'10px 20px', background:'#C9A84C', border:'none', cursor:'pointer'}}>Volver al Templo</button>
  </div>
)}
      {currentScreen === 'final' && (
  <div style={{color:'white', textAlign:'center', marginTop:'100px', fontFamily:'Cinzel, serif'}}>
    <h2>🏁 Final del juego (próximamente)</h2>
    <button onClick={() => setCurrentScreen('map')} style={{marginTop:'20px', padding:'10px 20px', background:'#C9A84C', border:'none', cursor:'pointer'}}>Volver al Templo</button>
  </div>
)}

{/* botón de reset eliminado */}

    </div>
  );
}