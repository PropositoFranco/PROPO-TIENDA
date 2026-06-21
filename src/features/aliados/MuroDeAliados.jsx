/**
 * MURO DE ALIADOS — Templo del Propósito
 * Componente React para propotienda.com/aliados
 *
 * USO:
 *   <MuroDeAliados adminMode={false} />
 *   <MuroDeAliados adminMode={true} />   ← panel de edición
 *
 * DATOS: 100% reales desde Supabase (tabla `wall_allies`) vía
 * src/services/aliados.service.js. Nada hardcodeado.
 * Corre wall_allies_setup.sql antes de montar este componente.
 */

import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  getAliados,
  getAliadosAdmin,
  crearAliado,
  actualizarAliado,
  borrarAliado as borrarAliadoDB,
  reordenarAliados,
  getTemplariosRegistrados,
  toggleAliadoActivo,
} from "../../services/aliados.service";
// ⚠ Ajusta esta ruta según dónde coloques este archivo.
// Pensado para vivir en: src/features/aliados/MuroDeAliados.jsx
// con el service en: src/services/aliados.service.js

// ─── FUENTES (pega en tu index.html o _document.jsx) ─────────────────────────
// <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900
//   &family=Cinzel+Decorative:wght@700;900
//   &family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Nunito:wght@400;700;900
//   &display=swap" rel="stylesheet">

// ─── ASSET OFICIAL DE MARCA (brief_maestro § 0 — fuente única de verdad) ──────
const LOGO_TEMPLO_URL =
  "https://hdwzhwuhlrtrmhnecypm.supabase.co/storage/v1/object/public/sorteos-assets/logo-minimalista.png";

// ─── ESTILOS GLOBALES (inyectados una sola vez) ───────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Nunito:wght@400;700;900&display=swap');

  :root {
    --gold: #D4AF37;
    --gold-bright: #FFE566;
    --gold-dark: #9a7a00;
    --violet: #CC44FF;
    --green: #44FF88;
    --bg: #04020E;
    --bg-card: #080418;
    --text: rgba(255,255,255,0.88);
    --text-dim: rgba(255,255,255,0.45);
    --font-display: 'Cinzel Decorative', serif;
    --font-title: 'Cinzel', serif;
    --font-body: 'Crimson Text', serif;
    --font-ui: 'Nunito', sans-serif;
  }

  .mda-root *, .mda-root *::before, .mda-root *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .mda-root {
    font-family: var(--font-title);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Fondo cósmico ── */
  .mda-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(ellipse 130% 60% at 50% 0%, rgba(30,8,90,0.9) 0%, transparent 55%),
      radial-gradient(ellipse 70% 55% at 5% 50%, rgba(10,4,70,0.55) 0%, transparent 55%),
      radial-gradient(ellipse 70% 55% at 95% 30%, rgba(60,8,100,0.5) 0%, transparent 55%),
      radial-gradient(ellipse 100% 65% at 50% 100%, rgba(4,2,14,0.98) 0%, transparent 60%),
      linear-gradient(180deg, #050215 0%, #0a0530 20%, #080320 55%, #04020e 100%);
    animation: nebulaBreath 18s ease-in-out infinite;
  }
  @keyframes nebulaBreath {
    0%,100% { opacity:.88; }
    50% { opacity:1; }
  }

  .mda-canvas {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }

  /* ── Layout ── */
  .mda-content {
    position: relative;
    z-index: 5;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px 100px;
  }

  /* ── Hero ── */
  .mda-hero {
    text-align: center;
    padding: 72px 20px 56px;
    position: relative;
  }

  .mda-hero-eyebrow {
    font-family: var(--font-title);
    font-size: 9px;
    letter-spacing: 6px;
    color: rgba(212,175,55,0.5);
    text-transform: uppercase;
    margin-bottom: 14px;
  }

  .mda-hero-title {
    font-family: var(--font-display);
    font-size: clamp(30px, 6vw, 62px);
    font-weight: 900;
    line-height: 1.05;
    margin-bottom: 10px;
    background: linear-gradient(135deg, var(--gold-dark) 0%, var(--gold) 35%, #fff8c0 55%, var(--gold) 75%, var(--gold-dark) 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 5s linear infinite;
  }
  @keyframes shimmer {
    0% { background-position: 0% center; }
    100% { background-position: 200% center; }
  }

  .mda-hero-sub {
    font-family: var(--font-body);
    font-size: clamp(15px,2.2vw,19px);
    color: var(--text-dim);
    font-style: italic;
    line-height: 1.65;
    max-width: 560px;
    margin: 0 auto 28px;
  }
  .mda-hero-sub strong { color: rgba(212,175,55,0.85); font-style: normal; }

  /* Ornamento */
  .mda-orn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 0;
  }
  .mda-orn-line {
    width: 100px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.45));
  }
  .mda-orn-line.r { background: linear-gradient(90deg, rgba(212,175,55,0.45), transparent); }
  .mda-orn-diamond { width: 5px; height: 5px; background: var(--gold); transform: rotate(45deg); opacity:.8; }
  .mda-orn-diamond.sm { width:3px; height:3px; opacity:.35; }

  /* ── Contador ── */
  .mda-counter {
    text-align: center;
    padding: 56px 20px 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    position: relative;
  }
  .mda-counter::before {
    content: '';
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 200px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.25), transparent);
  }
  .mda-counter-num {
    font-family: var(--font-display);
    font-size: clamp(72px, 14vw, 130px);
    font-weight: 900;
    line-height: 0.9;
    background: linear-gradient(135deg, var(--gold-dark) 0%, var(--gold-bright) 40%, #fffbe0 55%, var(--gold) 75%, var(--gold-dark) 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
    transition: all 0.6s ease;
    filter: drop-shadow(0 0 30px rgba(212,175,55,0.2));
  }
  .mda-counter-label {
    font-family: var(--font-title);
    font-size: 10px;
    letter-spacing: 6px;
    color: rgba(212,175,55,0.4);
    text-transform: uppercase;
    margin-top: 10px;
    margin-bottom: 6px;
  }
  .mda-counter-sub {
    font-family: var(--font-body);
    font-size: 13px;
    color: rgba(255,255,255,0.28);
    font-style: italic;
  }

  /* ── Manifesto ── */
  .mda-manifesto {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 24px;
    padding: 56px 0 64px;
    max-width: 1040px;
    margin: 0 auto;
  }
  .mda-manifesto-item {
    text-align: center;
    padding: 38px 28px 32px;
    background: linear-gradient(155deg, rgba(18,8,44,0.92) 0%, rgba(8,3,22,0.96) 60%, rgba(14,5,34,0.92) 100%);
    border: 1px solid rgba(212,175,55,0.13);
    border-radius: 6px;
    position: relative;
    overflow: hidden;
    transition: transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
  }
  .mda-manifesto-item::before {
    content: '';
    position: absolute;
    top: 0; left: 15%; right: 15%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent);
    transition: left 0.35s, right 0.35s;
  }
  .mda-manifesto-item::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 70% 50% at 50% 0%, rgba(212,175,55,0.04) 0%, transparent 70%);
    pointer-events: none;
  }
  .mda-manifesto-item:hover {
    transform: translateY(-8px);
    border-color: rgba(212,175,55,0.32);
    box-shadow: 0 24px 64px rgba(212,175,55,0.1), 0 0 0 1px rgba(212,175,55,0.06);
  }
  .mda-manifesto-item:hover::before {
    left: 5%;
    right: 5%;
  }
  .mda-manifesto-icon {
    font-size: 32px;
    margin-bottom: 18px;
    display: block;
    filter: drop-shadow(0 0 10px rgba(212,175,55,0.5));
    position: relative;
    z-index: 1;
  }
  .mda-manifesto-title {
    font-family: var(--font-title);
    font-size: 11px;
    letter-spacing: 3.5px;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 12px;
    position: relative;
    z-index: 1;
  }
  .mda-manifesto-text {
    font-family: var(--font-body);
    font-size: 14.5px;
    color: rgba(255,255,255,0.52);
    font-style: italic;
    line-height: 1.7;
    position: relative;
    z-index: 1;
  }

  /* ── Sección título ── */
  .mda-section-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 36px;
  }
  .mda-section-line {
    flex: 1; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.2));
  }
  .mda-section-line.r { background: linear-gradient(90deg, rgba(212,175,55,0.2), transparent); }
  .mda-section-title {
    font-family: var(--font-title);
    font-size: 10px;
    letter-spacing: 5px;
    color: rgba(212,175,55,0.5);
    text-transform: uppercase;
    white-space: nowrap;
  }

  /* ── Grid de aliados ── */
  .mda-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 28px;
  }

  /* Reveal escalonado al hacer scroll */
  .mda-card-reveal {
    opacity: 0;
    transform: translateY(32px) scale(0.97);
    transition:
      opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .mda-card-reveal.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  /* ── Tarjeta de aliado ── */
  .mda-card {
    position: relative;
    background: linear-gradient(155deg, #0d0924 0%, #070318 50%, #0b0420 100%);
    border-radius: 6px;
    overflow: visible;
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease;
    cursor: default;
  }
  .mda-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 28px 70px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.08);
  }
  .mda-card:hover .mda-card-border { opacity: 1; }
  .mda-card:hover .mda-card-glow {
    opacity: 1;
    background: linear-gradient(90deg, transparent, rgba(255,215,0,0.7), transparent);
  }

  /* Borde dorado animado */
  .mda-card-border {
    position: absolute;
    inset: -1.5px;
    border-radius: 5px;
    background: linear-gradient(145deg,
      rgba(255,215,0,0.85) 0%,
      rgba(212,175,55,0.2) 30%,
      rgba(204,68,255,0.35) 55%,
      rgba(212,175,55,0.2) 75%,
      rgba(255,215,0,0.85) 100%
    );
    background-size: 300% 300%;
    animation: borderFlow 6s ease infinite;
    opacity: 0.4;
    transition: opacity 0.3s;
    z-index: 0;
  }
  @keyframes borderFlow {
    0%,100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  /* Esquinas */
  .mda-corner {
    position: absolute;
    width: 22px; height: 22px;
    z-index: 20;
    pointer-events: none;
  }
  .mda-corner svg { width:100%; height:100%; }
  .mda-c-tl { top: 7px; left: 7px; }
  .mda-c-tr { top: 7px; right: 7px; transform: scaleX(-1); }
  .mda-c-bl { bottom: 7px; left: 7px; transform: scaleY(-1); }
  .mda-c-br { bottom: 7px; right: 7px; transform: scale(-1); }

  .mda-card-inner {
    position: relative;
    z-index: 5;
    padding: 28px 24px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  /* Brillo superior */
  .mda-card-glow {
    position: absolute;
    top: 0; left: 10%; right: 10%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent);
  }

  /* Sello */
  .mda-sello {
    position: absolute;
    top: 14px;
    right: 14px;
    font-family: var(--font-title);
    font-size: 6px;
    letter-spacing: 2px;
    color: rgba(212,175,55,0.6);
    background: rgba(212,175,55,0.06);
    border: 1px solid rgba(212,175,55,0.2);
    border-radius: 20px;
    padding: 3px 8px;
    text-transform: uppercase;
    z-index: 10;
  }

  /* Logo */
  .mda-logo-wrap {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-bottom: 18px;
  }
  .mda-logo-glow {
    position: absolute;
    inset: -12px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.04) 55%, transparent 75%);
    animation: logoGlow 3.5s ease-in-out infinite;
  }
  @keyframes logoGlow {
    0%,100% { opacity:.65; transform:scale(1); }
    50% { opacity:1; transform:scale(1.08); }
  }
  .mda-logo-ring {
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    border: 1px solid rgba(212,175,55,0.25);
  }
  /* ── Modos de presentación del logo ── */

  /* BASE — compartida por los 3 modos */
  .mda-logo-plate {
    width: 76px; height: 76px;
    border-radius: 50%;
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: box-shadow 0.3s ease;
  }

  /* MODO 1: plate_light — pergamino/metal claro (logos oscuros) */
  .mda-logo-plate.mode-plate-light {
    background: radial-gradient(circle at 32% 28%,
      rgba(255,252,240,0.98) 0%,
      rgba(238,228,200,0.95) 38%,
      rgba(196,180,140,0.92) 100%);
    box-shadow:
      0 2px 12px rgba(0,0,0,0.5),
      inset 0 1px 3px rgba(255,255,255,0.85),
      inset 0 -3px 8px rgba(120,95,40,0.4);
  }

  /* MODO 2: plate_dark — carbón/ónice (logos blancos, dorados, neón) */
  .mda-logo-plate.mode-plate-dark {
    background: radial-gradient(circle at 32% 28%,
      rgba(28,18,48,0.98) 0%,
      rgba(14,8,30,0.97) 45%,
      rgba(8,4,20,0.98) 100%);
    box-shadow:
      0 2px 12px rgba(0,0,0,0.7),
      inset 0 1px 2px rgba(212,175,55,0.15),
      inset 0 -2px 6px rgba(0,0,0,0.6),
      0 0 0 1px rgba(212,175,55,0.18);
  }

  /* MODO 3: transparent — sin fondo, directo sobre la card (PNGs con alpha) */
  .mda-logo-plate.mode-transparent {
    background: transparent;
    box-shadow: none;
    overflow: visible;
  }
  .mda-logo-plate.mode-transparent .mda-logo-img {
    filter: drop-shadow(0 2px 12px rgba(212,175,55,0.35))
            drop-shadow(0 0 24px rgba(212,175,55,0.15));
    width: 92%;
    height: 92%;
  }
  .mda-logo-img {
    width: 78%; height: 78%;
    object-fit: contain;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25));
    position: relative;
    transition: transform 0.3s;
  }
  .mda-card:hover .mda-logo-img { transform: scale(1.06); }
  .mda-logo-img.invert {
    filter: invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.25));
  }
  .mda-logo-placeholder {
    width: 76px; height: 76px;
    border-radius: 50%;
    background: rgba(212,175,55,0.06);
    border: 1.5px dashed rgba(212,175,55,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;
    color: rgba(212,175,55,0.55);
    animation: sigiloPulse 2.6s ease-in-out infinite;
  }
  .mda-logo-placeholder svg { width: 30px; height: 30px; }
  @keyframes sigiloPulse {
    0%,100% { opacity:.55; }
    50% { opacity:.95; }
  }

  /* Nombre */
  .mda-card-nombre {
    font-family: var(--font-title);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.9);
    text-align: center;
    margin-bottom: 5px;
  }

  /* Tipo/ciudad */
  .mda-card-meta {
    font-family: var(--font-ui);
    font-size: 9px;
    letter-spacing: 2px;
    color: rgba(204,68,255,0.55);
    text-transform: uppercase;
    text-align: center;
    margin-bottom: 16px;
  }

  /* Separador */
  .mda-card-sep {
    width: 60px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent);
    margin-bottom: 16px;
  }

  /* Frase */
  .mda-card-frase {
    font-family: var(--font-body);
    font-size: 14px;
    font-style: italic;
    color: rgba(255,215,0,0.75);
    text-align: center;
    line-height: 1.65;
    letter-spacing: 0.3px;
    position: relative;
    padding: 0 4px;
  }
  .mda-card-frase::before {
    content: '"';
    font-size: 32px;
    color: rgba(212,175,55,0.15);
    font-family: Georgia, serif;
    position: absolute;
    top: -8px;
    left: -4px;
    line-height: 1;
  }

  /* ── CTA footer ── */
  .mda-cta {
    text-align: center;
    padding: 88px 20px 40px;
    position: relative;
    margin-top: 32px;
  }
  .mda-cta-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 55% at 50% 100%, rgba(30,8,90,0.6) 0%, transparent 65%),
      radial-gradient(ellipse 60% 40% at 50% 50%, rgba(212,175,55,0.04) 0%, transparent 70%);
    pointer-events: none;
  }
  .mda-cta-connector {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 1px; height: 56px;
    background: linear-gradient(180deg, transparent, rgba(212,175,55,0.4));
  }
  .mda-cta-connector::after {
    content: '◆';
    position: absolute;
    bottom: -7px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 7px;
    color: rgba(212,175,55,0.5);
  }
  .mda-cta-label {
    font-family: var(--font-title);
    font-size: 9px;
    letter-spacing: 6px;
    color: rgba(212,175,55,0.4);
    text-transform: uppercase;
    margin-bottom: 16px;
    display: block;
    position: relative;
  }
  .mda-cta-title {
    font-family: var(--font-display);
    font-size: clamp(26px, 5vw, 44px);
    font-weight: 900;
    background: linear-gradient(135deg, var(--gold-dark) 0%, var(--gold) 30%, #fff8c0 50%, var(--gold) 70%, var(--gold-dark) 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
    margin-bottom: 16px;
    position: relative;
  }
  .mda-cta-sub {
    font-family: var(--font-body);
    font-size: 16px;
    color: rgba(255,255,255,0.48);
    font-style: italic;
    line-height: 1.7;
    max-width: 460px;
    margin: 0 auto 36px;
    position: relative;
  }
  .mda-btn-cta {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: linear-gradient(135deg, var(--gold-dark) 0%, var(--gold) 50%, var(--gold-dark) 100%);
    background-size: 200% auto;
    border: none;
    border-radius: 40px;
    padding: 16px 52px;
    font-family: var(--font-title);
    font-size: 11px;
    letter-spacing: 4px;
    color: #04020e;
    font-weight: 900;
    cursor: pointer;
    transition: all 0.35s;
    text-decoration: none;
    text-transform: uppercase;
    position: relative;
    animation: btnPulse 3s ease-in-out infinite;
  }
  .mda-btn-cta::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 43px;
    background: linear-gradient(135deg, rgba(212,175,55,0.5), rgba(204,68,255,0.3), rgba(212,175,55,0.5));
    background-size: 200% auto;
    animation: borderFlow 4s ease infinite;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.35s;
  }
  .mda-btn-cta:hover::before { opacity: 1; }
  @keyframes btnPulse {
    0%,100% { box-shadow: 0 0 24px rgba(212,175,55,0.35), 0 6px 24px rgba(0,0,0,0.5); }
    50% { box-shadow: 0 0 52px rgba(212,175,55,0.65), 0 6px 36px rgba(0,0,0,0.5); }
  }
  .mda-btn-cta:hover { background-position: right center; transform: translateY(-3px) scale(1.02); }

  /* ─────────────────────────────────────────────
     PANEL ADMIN
  ───────────────────────────────────────────── */
  .mda-admin-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 1000;
    background: rgba(4,2,14,0.97);
    border-bottom: 1px solid rgba(212,175,55,0.2);
    padding: 12px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    backdrop-filter: blur(8px);
  }
  .mda-admin-title {
    font-family: var(--font-title);
    font-size: 10px;
    letter-spacing: 4px;
    color: rgba(212,175,55,0.6);
    text-transform: uppercase;
  }
  .mda-admin-actions { display: flex; gap: 10px; align-items: center; }

  .mda-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border-radius: 24px;
    padding: 8px 18px;
    font-family: var(--font-title);
    font-size: 9px;
    letter-spacing: 2px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.22s;
    text-transform: uppercase;
    border: none;
  }
  .mda-btn-gold {
    background: rgba(212,175,55,0.1);
    border: 1px solid rgba(212,175,55,0.35);
    color: rgba(212,175,55,0.9);
  }
  .mda-btn-gold:hover { background: rgba(212,175,55,0.18); border-color: rgba(212,175,55,0.6); }
  .mda-btn-violet {
    background: rgba(204,68,255,0.08);
    border: 1px solid rgba(204,68,255,0.3);
    color: rgba(204,68,255,0.85);
  }
  .mda-btn-violet:hover { background: rgba(204,68,255,0.15); }
  .mda-btn-danger {
    background: rgba(255,80,80,0.08);
    border: 1px solid rgba(255,80,80,0.25);
    color: rgba(255,100,100,0.8);
  }
  .mda-btn-danger:hover { background: rgba(255,80,80,0.15); }
  .mda-btn-green {
    background: rgba(68,255,136,0.08);
    border: 1px solid rgba(68,255,136,0.25);
    color: rgba(68,255,136,0.85);
  }
  .mda-btn-green:hover { background: rgba(68,255,136,0.15); }

  /* Lista de reordenamiento */
  .mda-admin-list {
    background: rgba(8,4,24,0.85);
    border: 1px solid rgba(212,175,55,0.12);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 24px;
  }
  .mda-admin-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 20px;
    border-bottom: 1px solid rgba(212,175,55,0.06);
    transition: background 0.2s;
  }
  .mda-admin-item:last-child { border-bottom: none; }
  .mda-admin-item:hover { background: rgba(212,175,55,0.03); }
  .mda-admin-item-logo {
    width: 40px; height: 40px;
    border-radius: 50%;
    background: radial-gradient(circle at 32% 28%, rgba(255,252,240,0.98) 0%, rgba(238,228,200,0.95) 38%, rgba(196,180,140,0.92) 100%);
    border: 1px solid rgba(212,175,55,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
    color: rgba(212,175,55,0.4);
    overflow: hidden;
    flex-shrink: 0;
    cursor: grab;
  }
  .mda-admin-item-logo.placeholder {
    background: rgba(212,175,55,0.06);
    border: 1px dashed rgba(212,175,55,0.25);
  }
  .mda-admin-item-logo.placeholder svg { width: 16px; height: 16px; opacity: .6; }
  .mda-admin-item-logo img { width:78%; height:78%; object-fit:contain; }
  .mda-admin-item.dragging { opacity: 0.4; }
  .mda-admin-item.drag-over { background: rgba(212,175,55,0.1); border-top: 2px solid var(--gold-bright); }
  .mda-admin-item.oculto { opacity: 0.4; }
  .mda-admin-item.oculto .mda-admin-item-logo { filter: grayscale(1); }
  .mda-admin-item-info { flex: 1; min-width: 0; }
  .mda-admin-item-name {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-title);
    font-size: 11px;
    color: rgba(255,255,255,0.8);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  .mda-oculto-pill {
    font-family: var(--font-ui);
    font-size: 8px;
    letter-spacing: 1px;
    color: rgba(255,140,140,0.8);
    background: rgba(255,80,80,0.1);
    border: 1px solid rgba(255,80,80,0.25);
    border-radius: 10px;
    padding: 1px 6px;
    text-transform: uppercase;
  }
  .mda-btn-eye {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 24px;
    padding: 6px 14px;
    font-size: 13px;
    color: rgba(255,255,255,0.6);
    cursor: pointer;
    transition: all 0.2s;
  }
  .mda-btn-eye:hover { background: rgba(255,255,255,0.08); }
  .mda-btn-eye.activo { color: rgba(68,255,136,0.85); border-color: rgba(68,255,136,0.3); }
  .mda-admin-item-frase {
    font-family: var(--font-body);
    font-size: 11.5px;
    color: var(--text-dim);
    font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mda-admin-item-arrows { display: flex; flex-direction: column; gap: 3px; }
  .mda-arrow-btn {
    background: rgba(212,175,55,0.07);
    border: 1px solid rgba(212,175,55,0.15);
    border-radius: 4px;
    padding: 2px 7px;
    color: rgba(212,175,55,0.6);
    cursor: pointer;
    font-size: 12px;
    line-height: 1.4;
    transition: all 0.2s;
  }
  .mda-arrow-btn:hover { background: rgba(212,175,55,0.15); color: rgba(212,175,55,1); }
  .mda-arrow-btn:disabled { opacity: 0.2; cursor: default; }

  /* Modal */
  .mda-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: rgba(4,2,14,0.92);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

  .mda-modal {
    background: linear-gradient(155deg, #0e0825 0%, #07031a 55%, #0c0420 100%);
    border: 1px solid rgba(212,175,55,0.2);
    border-radius: 6px;
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 32px 28px;
    position: relative;
    animation: modalIn 0.25s cubic-bezier(0.16,1,0.3,1);
  }
  @keyframes modalIn {
    from { transform: scale(0.93) translateY(20px); opacity:0; }
    to { transform: scale(1) translateY(0); opacity:1; }
  }
  .mda-modal-title {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 900;
    color: var(--gold);
    margin-bottom: 24px;
    letter-spacing: 1px;
  }
  .mda-modal-close {
    position: absolute;
    top: 16px; right: 16px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 50%;
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }
  .mda-modal-close:hover { background: rgba(255,80,80,0.1); border-color: rgba(255,80,80,0.3); color: rgba(255,100,100,0.8); }

  /* Formulario */
  .mda-field { margin-bottom: 18px; }
  .mda-label {
    display: block;
    font-family: var(--font-title);
    font-size: 8px;
    letter-spacing: 3px;
    color: rgba(212,175,55,0.55);
    text-transform: uppercase;
    margin-bottom: 7px;
  }
  .mda-input, .mda-textarea {
    width: 100%;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(212,175,55,0.18);
    border-radius: 4px;
    padding: 10px 14px;
    font-family: var(--font-body);
    font-size: 14px;
    color: rgba(255,255,255,0.85);
    outline: none;
    transition: border-color 0.2s;
  }
  .mda-input:focus, .mda-textarea:focus {
    border-color: rgba(212,175,55,0.45);
    background: rgba(212,175,55,0.02);
  }
  .mda-textarea { resize: vertical; min-height: 80px; }

  /* Logo upload */
  .mda-logo-upload {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .mda-logo-preview {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: radial-gradient(circle at 32% 28%, rgba(255,252,240,0.98) 0%, rgba(238,228,200,0.95) 38%, rgba(196,180,140,0.92) 100%);
    border: 1.5px solid rgba(212,175,55,0.3);
    display: flex; align-items: center; justify-content: center;
    color: rgba(212,175,55,0.3);
    font-size: 20px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .mda-logo-preview.empty {
    background: rgba(212,175,55,0.05);
    border: 1.5px dashed rgba(212,175,55,0.2);
  }
  .mda-logo-preview img { width:78%; height:78%; object-fit:contain; }

  /* Selector de modo de logo */
  .mda-logo-mode-selector {
    display: flex;
    gap: 10px;
    margin-top: 14px;
    flex-wrap: wrap;
  }
  .mda-logo-mode-btn {
    flex: 1;
    min-width: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px 8px 10px;
    border-radius: 8px;
    border: 1.5px solid rgba(212,175,55,0.15);
    background: rgba(255,255,255,0.02);
    cursor: pointer;
    transition: all 0.22s ease;
    position: relative;
  }
  .mda-logo-mode-btn:hover {
    border-color: rgba(212,175,55,0.35);
    background: rgba(212,175,55,0.04);
  }
  .mda-logo-mode-btn.active {
    border-color: rgba(212,175,55,0.7);
    background: rgba(212,175,55,0.08);
    box-shadow: 0 0 16px rgba(212,175,55,0.12);
  }
  .mda-logo-mode-btn.active::after {
    content: '✓';
    position: absolute;
    top: 5px; right: 7px;
    font-size: 9px;
    color: var(--gold);
    font-family: var(--font-ui);
  }
  .mda-logo-mode-swatch {
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(212,175,55,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
  .mda-logo-mode-swatch.sw-light {
    background: radial-gradient(circle at 32% 28%, rgba(255,252,240,0.98) 0%, rgba(238,228,200,0.95) 38%, rgba(196,180,140,0.92) 100%);
  }
  .mda-logo-mode-swatch.sw-dark {
    background: radial-gradient(circle at 32% 28%, rgba(28,18,48,0.98) 0%, rgba(14,8,30,0.97) 45%, rgba(8,4,20,0.98) 100%);
    border-color: rgba(212,175,55,0.25);
  }
  .mda-logo-mode-swatch.sw-transparent {
    background: repeating-conic-gradient(rgba(255,255,255,0.07) 0% 25%, transparent 0% 50%) 0 0 / 8px 8px;
    border-color: rgba(255,255,255,0.12);
  }
  .mda-logo-mode-label {
    font-family: var(--font-title);
    font-size: 7.5px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
    text-align: center;
    line-height: 1.3;
  }
  .mda-logo-mode-btn.active .mda-logo-mode-label {
    color: rgba(212,175,55,0.8);
  }

  /* Toggle */
  .mda-toggle-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
  }
  .mda-toggle {
    width: 40px; height: 22px;
    background: rgba(255,255,255,0.07);
    border-radius: 11px;
    border: 1px solid rgba(212,175,55,0.2);
    position: relative;
    cursor: pointer;
    transition: background 0.25s;
    flex-shrink: 0;
  }
  .mda-toggle.on { background: rgba(212,175,55,0.2); border-color: rgba(212,175,55,0.4); }
  .mda-toggle-knob {
    position: absolute;
    top: 3px; left: 3px;
    width: 14px; height: 14px;
    border-radius: 50%;
    background: rgba(212,175,55,0.5);
    transition: transform 0.25s, background 0.25s;
  }
  .mda-toggle.on .mda-toggle-knob { transform: translateX(18px); background: var(--gold); }
  .mda-toggle-label {
    font-family: var(--font-ui);
    font-size: 11px;
    color: var(--text-dim);
  }

  /* Modal footer */
  .mda-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid rgba(212,175,55,0.08);
  }

  /* Admin overlay en card */
  .mda-card-admin-overlay {
    position: absolute;
    inset: 0;
    background: rgba(4,2,14,0.75);
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    opacity: 0;
    transition: opacity 0.2s;
    border-radius: 4px;
    backdrop-filter: blur(2px);
  }
  .mda-card:hover .mda-card-admin-overlay { opacity: 1; }

  /* ═══════════════════════════════════════════════════════════════
     BLOQUE 1 — ESCENARIO DEL HERO: rings orbitales + logo flotante
     (extraído de flyer_multipaginas.html, adaptado a unidades relativas)
  ═══════════════════════════════════════════════════════════════ */
  .mda-hero-stage {
    position: relative;
    width: clamp(180px, 50vw, 340px);
    height: clamp(180px, 50vw, 340px);
    margin: 0 auto clamp(8px, 2vw, 16px);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mda-orbit-ring {
    position: absolute;
    top: 50%; left: 50%;
    border-radius: 50%;
    border: 1px solid rgba(212,175,55,0.14);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .mda-orbit-1 { width: 56%; height: 56%; animation: mdaOrbitSpin 26s linear infinite; }
  .mda-orbit-2 {
    width: 78%; height: 78%;
    border-style: dashed;
    border-color: rgba(204,68,255,0.13);
    animation: mdaOrbitSpin 40s linear infinite reverse;
  }
  .mda-orbit-3 { width: 100%; height: 100%; border-color: rgba(212,175,55,0.08); animation: mdaOrbitSpin 58s linear infinite; }
  @keyframes mdaOrbitSpin { to { transform: translate(-50%,-50%) rotate(360deg); } }

  .mda-orbit-dot {
    position: absolute;
    top: 50%; left: 50%;
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--gold-bright);
    box-shadow: 0 0 9px rgba(255,229,102,0.85);
    animation: mdaOrbitDot 26s linear infinite;
  }
  @keyframes mdaOrbitDot {
    from { transform: translate(-50%,-50%) rotate(0deg) translateX(calc(28% * 2)) rotate(0deg); }
    to   { transform: translate(-50%,-50%) rotate(360deg) translateX(calc(28% * 2)) rotate(-360deg); }
  }

  .mda-hero-logo-wrap {
    position: relative;
    width: clamp(84px, 22vw, 132px);
    height: clamp(84px, 22vw, 132px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }
  .mda-hero-logo-glow {
    position: absolute;
    inset: -26%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212,175,55,0.26) 0%, rgba(204,68,255,0.07) 50%, transparent 72%);
    animation: mdaLogoPulse 3.5s ease-in-out infinite;
  }
  @keyframes mdaLogoPulse {
    0%,100% { opacity:.7; transform:scale(1); }
    50% { opacity:1; transform:scale(1.1); }
  }
  .mda-hero-logo-ring {
    position: absolute;
    inset: -8%;
    border-radius: 50%;
    border: 1px solid rgba(212,175,55,0.32);
  }
  .mda-hero-logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    mix-blend-mode: screen;
    filter: brightness(1.1) drop-shadow(0 0 18px rgba(212,175,55,0.4));
    position: relative;
    z-index: 2;
    animation: mdaLogoFloat 6s ease-in-out infinite;
  }
  @keyframes mdaLogoFloat {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-7%); }
  }

  /* ═══════════════════════════════════════════════════════════════
     BLOQUE 2 — ENTRADA ÉPICA (warpIn / fadeUp)
     Se capa sobre .mda-hero-eyebrow / .mda-hero-title / .mda-hero-sub
     ya existentes — misma especificidad, declarada después, no borra nada.
  ═══════════════════════════════════════════════════════════════ */
  @keyframes mdaWarpIn {
    0%   { letter-spacing: 0.5em; opacity: 0; }
    100% { letter-spacing: normal; opacity: 1; }
  }
  @keyframes mdaFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .mda-hero-eyebrow { animation: mdaFadeUp 0.9s 0.05s both; }
  .mda-hero-title { animation: mdaWarpIn 1.1s 0.25s both, shimmer 5s 1.35s linear infinite; }
  .mda-hero-sub { animation: mdaFadeUp 1s 0.55s both; }
  .mda-orn { animation: mdaFadeUp 1s 0.8s both; }

  /* ═══════════════════════════════════════════════════════════════
     BLOQUE 3 — SECCIÓN "CÓMO FUNCIONA SER PUNTO ALIADO"
     Incluye el ancla visual de $294 USD (valor real de la beca)
  ═══════════════════════════════════════════════════════════════ */
  .mda-cf {
    padding: clamp(40px, 6vw, 64px) 0 clamp(24px, 4vw, 40px);
  }
  .mda-cf-sub {
    text-align: center;
    font-family: var(--font-body);
    font-size: clamp(13px, 1.8vw, 15.5px);
    color: var(--text-dim);
    font-style: italic;
    max-width: 520px;
    margin: -18px auto 36px;
    line-height: 1.6;
  }
  .mda-cf-track {
    position: relative;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: clamp(14px, 2.4vw, 22px);
    max-width: 1100px;
    margin: 0 auto;
  }
  .mda-cf-track::before {
    content: '';
    position: absolute;
    top: clamp(20px, 3vw, 26px);
    left: 8%;
    right: 8%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.35) 15%, rgba(212,175,55,0.35) 85%, transparent);
  }
  .mda-cf-step {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 0 clamp(6px, 1.4vw, 14px);
  }
  .mda-cf-num {
    width: clamp(38px, 6vw, 50px);
    height: clamp(38px, 6vw, 50px);
    margin: 0 auto 16px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #1a1230, #07031a 70%);
    border: 1px solid rgba(212,175,55,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: clamp(14px, 2vw, 17px);
    font-weight: 900;
    color: var(--gold-bright);
    box-shadow: 0 0 0 4px var(--bg), 0 0 16px rgba(212,175,55,0.25);
  }
  .mda-cf-title {
    font-family: var(--font-title);
    font-size: clamp(11.5px, 1.6vw, 13px);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.88);
    margin-bottom: 8px;
  }
  .mda-cf-text {
    font-family: var(--font-body);
    font-size: clamp(12.5px, 1.7vw, 13.5px);
    color: var(--text-dim);
    font-style: italic;
    line-height: 1.55;
  }
  .mda-cf-value-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    padding: 6px 14px;
    border-radius: 30px;
    background: linear-gradient(135deg, rgba(212,175,55,0.16), rgba(204,68,255,0.1));
    border: 1px solid rgba(212,175,55,0.45);
    font-family: var(--font-title);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--gold-bright);
    animation: mdaValuePulse 2.6s ease-in-out infinite;
  }
  @keyframes mdaValuePulse {
    0%,100% { box-shadow: 0 0 0px rgba(212,175,55,0); }
    50% { box-shadow: 0 0 14px rgba(212,175,55,0.35); }
  }

  /* ═══════════════════════════════════════════════════════════════
     BLOQUE 4 — BANDEJA DE IMPACTO EN VIVO
  ═══════════════════════════════════════════════════════════════ */
  .mda-impacto {
    padding: clamp(48px, 7vw, 80px) 0 clamp(8px, 2vw, 16px);
    position: relative;
  }
  .mda-impacto::before {
    content: 'IMPACTO EN VIVO';
    position: absolute;
    top: clamp(12px, 2vw, 20px);
    left: 50%;
    transform: translateX(-50%);
    font-family: var(--font-title);
    font-size: 8px;
    letter-spacing: 6px;
    color: rgba(212,175,55,0.28);
    text-transform: uppercase;
    white-space: nowrap;
  }
  .mda-impacto-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: clamp(16px, 2.8vw, 28px);
    max-width: 980px;
    margin: 0 auto;
  }
  .mda-impacto-card {
    position: relative;
    text-align: center;
    padding: clamp(28px, 4vw, 44px) clamp(16px, 2.5vw, 28px) clamp(22px, 3vw, 32px);
    background: linear-gradient(160deg, rgba(20,10,50,0.9) 0%, rgba(8,3,24,0.95) 60%, rgba(16,6,40,0.9) 100%);
    border: 1px solid rgba(212,175,55,0.2);
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
  }
  .mda-impacto-card:hover {
    transform: translateY(-6px);
    border-color: rgba(212,175,55,0.45);
    box-shadow: 0 20px 60px rgba(212,175,55,0.12), 0 0 0 1px rgba(212,175,55,0.08);
  }
  .mda-impacto-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255,215,0,0.7), rgba(204,68,255,0.4), rgba(255,215,0,0.7), transparent);
    background-size: 200% auto;
    animation: impactoBorderShimmer 3s linear infinite;
  }
  .mda-impacto-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 70%);
    pointer-events: none;
  }
  @keyframes impactoBorderShimmer {
    0% { background-position: 0% center; }
    100% { background-position: 200% center; }
  }
  .mda-impacto-icon {
    font-size: clamp(26px, 4vw, 36px);
    display: block;
    margin-bottom: 14px;
    filter: drop-shadow(0 0 8px rgba(212,175,55,0.4));
  }
  .mda-impacto-num {
    font-family: var(--font-display);
    font-size: clamp(42px, 7.5vw, 68px);
    font-weight: 900;
    line-height: 1;
    background: linear-gradient(135deg, var(--gold-dark) 0%, var(--gold-bright) 45%, #fffbe0 60%, var(--gold) 80%, var(--gold-dark) 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
    margin-bottom: 10px;
    text-shadow: none;
  }
  .mda-impacto-label {
    font-family: var(--font-title);
    font-size: 10px;
    letter-spacing: 3px;
    color: rgba(255,255,255,0.7);
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .mda-impacto-formula {
    font-family: var(--font-body);
    font-size: 12.5px;
    color: rgba(255,255,255,0.38);
    font-style: italic;
    line-height: 1.5;
    border-top: 1px solid rgba(212,175,55,0.08);
    padding-top: 10px;
    margin-top: 4px;
  }
  .mda-impacto-edit {
    width: clamp(110px, 24vw, 140px);
    text-align: center;
    font-family: var(--font-display);
    font-size: clamp(20px, 4vw, 26px);
    font-weight: 900;
    color: var(--gold-bright);
    background: rgba(212,175,55,0.06);
    border: 1px dashed rgba(212,175,55,0.4);
    border-radius: 6px;
    padding: 6px 8px;
    margin-bottom: 10px;
  }
  .mda-impacto-edit-tag {
    display: block;
    font-family: var(--font-ui);
    font-size: 8.5px;
    letter-spacing: 1.5px;
    color: rgba(68,255,136,0.7);
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  /* Responsive — bloques nuevos (no toca el media query original) */
  @media (max-width: 640px) {
    .mda-cf-track { grid-template-columns: 1fr 1fr; row-gap: 28px; }
    .mda-cf-track::before { display: none; }
    .mda-impacto-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 420px) {
    .mda-cf-track { grid-template-columns: 1fr; }
  }

  /* Responsive */
  @media (max-width: 640px) {
    .mda-hero { padding: 52px 16px 40px; }
    .mda-grid { grid-template-columns: 1fr; gap: 16px; }
    .mda-manifesto { grid-template-columns: 1fr; gap: 14px; }
    .mda-content { padding: 0 16px 80px; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }

  /* ── Estado vacío ── */
  .mda-empty-state {
    text-align: center;
    padding: 80px 20px 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  .mda-empty-rings {
    position: relative;
    width: 140px; height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }
  .mda-empty-ring {
    position: absolute;
    top: 50%; left: 50%;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    border: 1px solid rgba(212,175,55,0.12);
  }
  .mda-empty-ring.r1 {
    width: 70px; height: 70px;
    animation: mdaOrbitSpin 20s linear infinite;
    border-style: dashed;
    border-color: rgba(212,175,55,0.18);
  }
  .mda-empty-ring.r2 {
    width: 105px; height: 105px;
    animation: mdaOrbitSpin 34s linear infinite reverse;
  }
  .mda-empty-ring.r3 {
    width: 140px; height: 140px;
    animation: mdaOrbitSpin 52s linear infinite;
    border-color: rgba(204,68,255,0.08);
  }
  .mda-empty-sigil {
    position: relative;
    z-index: 2;
    width: 44px; height: 44px;
    color: rgba(212,175,55,0.3);
    animation: sigiloPulse 3s ease-in-out infinite;
  }
  .mda-empty-sigil svg { width: 100%; height: 100%; }
  .mda-empty-title {
    font-family: var(--font-display);
    font-size: clamp(18px, 3vw, 24px);
    font-weight: 900;
    background: linear-gradient(135deg, var(--gold-dark), var(--gold), var(--gold-dark));
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 5s linear infinite;
  }
  .mda-empty-sub {
    font-family: var(--font-body);
    font-size: clamp(14px, 2vw, 16px);
    font-style: italic;
    color: rgba(255,255,255,0.32);
    line-height: 1.75;
    max-width: 420px;
  }
  .mda-empty-orn {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
    margin-top: 4px;
  }

  /* ── Header del muro de aliados ── */
  .mda-muro-header {
    text-align: center;
    padding: 64px 20px 44px;
    position: relative;
  }
  .mda-muro-header::before {
    content: '';
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 1px; height: 48px;
    background: linear-gradient(180deg, transparent, rgba(212,175,55,0.35));
  }
  .mda-muro-header-orn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
  }
  .mda-muro-header-line {
    width: 80px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.4));
  }
  .mda-muro-header-line.r {
    background: linear-gradient(90deg, rgba(212,175,55,0.4), transparent);
  }
  .mda-muro-header-diamond {
    width: 4px; height: 4px;
    background: rgba(212,175,55,0.5);
    transform: rotate(45deg);
  }
  .mda-muro-header-diamond.lg {
    width: 7px; height: 7px;
    background: var(--gold);
    opacity: 0.85;
    box-shadow: 0 0 8px rgba(212,175,55,0.5);
  }
  .mda-muro-header-label {
    font-family: var(--font-title);
    font-size: 11px;
    letter-spacing: 6px;
    color: rgba(212,175,55,0.6);
    text-transform: uppercase;
    margin-bottom: 14px;
  }
  .mda-muro-header-sub {
    font-family: var(--font-body);
    font-size: clamp(15px, 2.2vw, 18px);
    font-style: italic;
    color: rgba(255,255,255,0.35);
    max-width: 520px;
    margin: 0 auto;
    line-height: 1.7;
  }
`;

// ─── UTILIDADES ───────────────────────────────────────────────────────────────
// uid() ya no se usa para crear aliados — Supabase genera el id real (uuid).
// Se deja por si algún otro bloque del archivo lo necesita en el futuro.
const uid = () => Math.random().toString(36).slice(2, 9);

// BLOQUE 4: hook de conteo animado, reutilizado por la Bandeja de Impacto
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

const CornerSVG = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M2 12 L2 2 L12 2" stroke="rgba(255,215,0,0.6)" strokeWidth="1.5" />
    <circle cx="2" cy="2" r="1.5" fill="rgba(255,215,0,0.6)" />
  </svg>
);

const Ornament = () => (
  <div className="mda-orn">
    <div className="mda-orn-line" />
    <div className="mda-orn-diamond sm" />
    <div className="mda-orn-diamond" />
    <div className="mda-orn-diamond sm" />
    <div className="mda-orn-line r" />
  </div>
);

// Sigilo del Templo — placeholder cuando un aliado aún no tiene logo.
// Nunca iniciales del negocio: siempre la identidad visual de la marca.
const SigiloTemplo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M12 2 L12 22 M4 8 L4 20 M20 8 L20 20 M2 8 L22 8 M3 20 L21 20 M4 8 L4 6 L20 6 L20 8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── COMPONENTE TARJETA ───────────────────────────────────────────────────────
function AliadoCard({ aliado, adminMode, onEdit, onDelete, revealDelay = 0 }) {
  const cardRef = useRef();
  const wrapRef = useRef();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("visible"), revealDelay);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [revealDelay]);

  return (
    <div ref={wrapRef} className="mda-card-reveal">
    <div ref={cardRef} className="mda-card">
      <div className="mda-card-border" />
      <div className="mda-corner mda-c-tl"><CornerSVG /></div>
      <div className="mda-corner mda-c-tr"><CornerSVG /></div>
      <div className="mda-corner mda-c-bl"><CornerSVG /></div>
      <div className="mda-corner mda-c-br"><CornerSVG /></div>

      <div className="mda-sello">⚔ Punto Aliado</div>

      <div className="mda-card-inner">
        <div className="mda-card-glow" />

        {/* Logo */}
        <div className="mda-logo-wrap">
          <div className="mda-logo-glow" />
          <div className="mda-logo-ring" />
          {aliado.logo ? (
            <div className={`mda-logo-plate mode-${(aliado.logoMode || 'plate_light').replace('_','-')}`}>
              <img
                className={`mda-logo-img${aliado.invertirLogo ? " invert" : ""}`}
                src={aliado.logo}
                alt={aliado.nombre}
              />
            </div>
          ) : (
            <div className="mda-logo-placeholder">
              <SigiloTemplo />
            </div>
          )}
        </div>

        {/* Nombre */}
        <div className="mda-card-nombre">{aliado.nombre}</div>

        {/* Meta */}
        {(aliado.tipo || aliado.ciudad) && (
          <div className="mda-card-meta">
            {[aliado.tipo, aliado.ciudad].filter(Boolean).join(" · ")}
          </div>
        )}

        <div className="mda-card-sep" />

        {/* Frase */}
        <div className="mda-card-frase">{aliado.frase}</div>
      </div>

      {/* Overlay admin */}
      {adminMode && (
        <div className="mda-card-admin-overlay">
          <button className="mda-btn mda-btn-gold" onClick={() => onEdit(aliado)}>
            ✎ Editar
          </button>
          <button className="mda-btn mda-btn-danger" onClick={() => onDelete(aliado.id)}>
            ✕ Borrar
          </button>
        </div>
      )}
    </div>
    </div>
  );
}

// ─── MODAL DE EDICIÓN ─────────────────────────────────────────────────────────
function ModalAliado({ aliado, onSave, onClose, saving }) {
  const [form, setForm] = useState(
    aliado
      ? { ...aliado, logoFile: null }
      : { id: null, nombre: "", frase: "", ciudad: "", tipo: "", logo: null, logoFile: null, invertirLogo: false, logoMode: 'plate_light', orden: 9999 }
  );
  const fileRef = useRef();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    // logo = vista previa inmediata (base64). logoFile = archivo real que se
    // sube a Supabase Storage al guardar — el logo final que ve el público
    // siempre es la URL pública del bucket, no el base64.
    reader.onload = (ev) => setForm((f) => ({ ...f, logo: ev.target.result, logoFile: file }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="mda-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mda-modal">
        <button className="mda-modal-close" onClick={onClose}>✕</button>
        <div className="mda-modal-title">
          {aliado ? "✎ Editar Aliado" : "⊕ Nuevo Aliado"}
        </div>

        {/* Logo */}
        <div className="mda-field">
          <label className="mda-label">Logo del negocio</label>
          <div className="mda-logo-upload">
            <div className={`mda-logo-preview${form.logo ? "" : " empty"}`}>
              {form.logo ? (
                <img src={form.logo} alt="" style={{ filter: form.invertirLogo ? "invert(1)" : "none" }} />
              ) : (
                <span style={{ fontSize: 22, color: "rgba(212,175,55,0.3)" }}>◈</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <button className="mda-btn mda-btn-gold" onClick={() => fileRef.current.click()}>
                ↑ Subir imagen
              </button>
              <div className="mda-logo-mode-selector">
                {[
                  { mode: 'plate_light', swClass: 'sw-light', label: 'Fondo\nclaro',     icon: '☀' },
                  { mode: 'plate_dark',  swClass: 'sw-dark',  label: 'Fondo\noscuro',    icon: '◆' },
                  { mode: 'transparent', swClass: 'sw-transparent', label: 'Sin\nfondo', icon: '◈' },
                ].map(({ mode, swClass, label, icon }) => (
                  <button
                    key={mode}
                    className={`mda-logo-mode-btn${form.logoMode === mode ? ' active' : ''}`}
                    onClick={() => set('logoMode', mode)}
                  >
                    <div className={`mda-logo-mode-swatch ${swClass}`}>{icon}</div>
                    <span className="mda-logo-mode-label">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: "none" }} />
        </div>

        {/* Nombre */}
        <div className="mda-field">
          <label className="mda-label">Nombre del negocio *</label>
          <input
            className="mda-input"
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Ej. Café Origen"
          />
        </div>

        {/* Frase */}
        <div className="mda-field">
          <label className="mda-label">Frase épica *</label>
          <textarea
            className="mda-textarea"
            value={form.frase}
            onChange={(e) => set("frase", e.target.value)}
            placeholder="La frase que define la identidad de este lugar..."
          />
        </div>

        {/* Tipo */}
        <div className="mda-field">
          <label className="mda-label">Tipo de negocio</label>
          <input
            className="mda-input"
            value={form.tipo}
            onChange={(e) => set("tipo", e.target.value)}
            placeholder="Ej. Cafetería, Estudio de diseño, Librería…"
          />
        </div>

        {/* Ciudad */}
        <div className="mda-field">
          <label className="mda-label">Ciudad</label>
          <input
            className="mda-input"
            value={form.ciudad}
            onChange={(e) => set("ciudad", e.target.value)}
            placeholder="Ej. Saltillo, Coahuila"
          />
        </div>

        <div className="mda-modal-footer">
          <button className="mda-btn mda-btn-violet" onClick={onClose} disabled={saving}>Cancelar</button>
          <button
            className="mda-btn mda-btn-gold"
            onClick={() => form.nombre.trim() && form.frase.trim() && !saving && onSave(form)}
            style={{ opacity: form.nombre.trim() && form.frase.trim() && !saving ? 1 : 0.4 }}
          >
            {saving ? "⏳ Guardando…" : "✓ Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function MuroDeAliados({ adminMode = false }) {
  const [aliados, setAliados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmarBorrar, setConfirmarBorrar] = useState(null);
  const [panelAdmin, setPanelAdmin] = useState(false);
  const [numVisible, setNumVisible] = useState(0);
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const canvasRef = useRef();
  const styleInjected = useRef(false);

  const adminVisible = adminMode || panelAdmin;

  // BLOQUE 4: Bandeja de Impacto — Templarios = cuenta real de profiles
  // (membership activo), nunca un número manual. Becas/Costales se derivan.
  const [templariosRegistrados, setTemplariosRegistrados] = useState(0);
  const becasActivadas = Math.floor(templariosRegistrados / 6);
  const costalesEnviados = Math.floor(templariosRegistrados / 25);
  const templariosAnim = useCountUp(templariosRegistrados);
  const becasAnim = useCountUp(becasActivadas);
  const costalesAnim = useCountUp(costalesEnviados);

  // Carga real desde Supabase al montar
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        setCargando(true);
        const fetchAliados = adminVisible ? getAliadosAdmin : getAliados;
        const [lista, count] = await Promise.all([
          fetchAliados(),
          getTemplariosRegistrados(),
        ]);
        if (!activo) return;
        setAliados(lista);
        setTemplariosRegistrados(count);
        setErrorCarga(null);
      } catch (err) {
        console.error("[MuroDeAliados] error al cargar:", err);
        if (activo) setErrorCarga("No se pudo cargar el muro. Revisa tu conexión o vuelve a intentar.");
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => { activo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminVisible]);

  // Inyectar CSS una vez
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
  }, []);

  // Canvas de partículas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, stars = [], particles = [], raf;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    const initStars = () => {
      stars = Array.from({ length: 80 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.3 + Math.random() * 1.3,
        a: Math.random(), da: (0.003 + Math.random() * 0.006) * (Math.random() < 0.5 ? 1 : -1),
        minA: 0.05 + Math.random() * 0.1,
      }));
    };

    const initParticles = () => {
      particles = Array.from({ length: 20 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 1 + Math.random() * 2.5,
        vx: (Math.random() - 0.5) * 0.15, vy: -(0.07 + Math.random() * 0.15),
        a: Math.random() * 0.4, da: 0.002 + Math.random() * 0.004,
        col: Math.random() < 0.65 ? "rgba(212,175,55," : "rgba(204,68,255,",
      }));
    };

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      stars.forEach((s) => {
        s.a += s.da;
        if (s.a > 1 || s.a < s.minA) s.da *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.fill();
      });
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        p.a += p.da;
        if (p.a > 0.45) p.da = -Math.abs(p.da);
        if (p.a < 0.02) p.da = Math.abs(p.da);
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.col + p.a + ")";
        ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    };

    resize(); initStars(); initParticles(); tick();
    window.addEventListener("resize", () => { resize(); initStars(); initParticles(); });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  // Contador animado
  useEffect(() => {
    const target = aliados.length;
    let current = 0;
    const step = Math.ceil(target / 30);
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      setNumVisible(current);
      if (current >= target) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [aliados.length]);

  // ─── CRUD real contra Supabase ───────────────────────────────────────────
  const guardarAliado = async (form) => {
    setGuardando(true);
    try {
      const esNuevo = !form.id;
      const guardado = esNuevo ? await crearAliado(form) : await actualizarAliado(form);
      setAliados((prev) => {
        const idx = prev.findIndex((a) => a.id === guardado.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = guardado;
          return next;
        }
        return [...prev, guardado].sort((a, b) => a.orden - b.orden);
      });
      setModalOpen(false);
      setEditando(null);
    } catch (err) {
      console.error("[MuroDeAliados] error al guardar:", err);
      alert("No se pudo guardar el aliado. Intenta de nuevo — revisa la consola para más detalle.");
    } finally {
      setGuardando(false);
    }
  };

  const borrarAliado = async (id) => {
    setConfirmarBorrar(null);
    const respaldo = aliados;
    setAliados((prev) => prev.filter((a) => a.id !== id)); // optimista
    try {
      await borrarAliadoDB(id);
    } catch (err) {
      console.error("[MuroDeAliados] error al borrar:", err);
      setAliados(respaldo); // revierte si falla
      alert("No se pudo eliminar. Se restauró la tarjeta.");
    }
  };

  // Persiste el nuevo orden en segundo plano sin bloquear la UI
  const persistirOrden = useCallback(async (lista) => {
    try {
      await reordenarAliados(lista);
    } catch (err) {
      console.error("[MuroDeAliados] error al guardar el orden:", err);
    }
  }, []);

  const moverAliado = (id, dir) => {
    setAliados((prev) => {
      const arr = [...prev];
      const idx = arr.findIndex((a) => a.id === id);
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      const reordenado = arr.map((a, i) => ({ ...a, orden: i }));
      persistirOrden(reordenado);
      return reordenado;
    });
  };

  // Arrastrar y soltar para acomodo interactivo
  const soltarAliado = (idDestino) => {
    setDragOverId(null);
    if (!dragId || dragId === idDestino) { setDragId(null); return; }
    setAliados((prev) => {
      const arr = [...prev];
      const origenIdx = arr.findIndex((a) => a.id === dragId);
      const destinoIdx = arr.findIndex((a) => a.id === idDestino);
      if (origenIdx < 0 || destinoIdx < 0) return arr;
      const [movido] = arr.splice(origenIdx, 1);
      arr.splice(destinoIdx, 0, movido);
      const reordenado = arr.map((a, i) => ({ ...a, orden: i }));
      persistirOrden(reordenado);
      return reordenado;
    });
    setDragId(null);
  };

  const exportarJSON = () => {
    const json = JSON.stringify(aliados, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aliados.json";
    a.click();
  };

  return (
    <div className="mda-root">
      {/* Fondo */}
      <canvas className="mda-canvas" ref={canvasRef} />
      <div className="mda-bg" />

      {/* Barra admin */}
      {adminVisible && (
        <div className="mda-admin-bar">
          <span className="mda-admin-title">⚔ Admin — Muro de Aliados</span>
          <div className="mda-admin-actions">
            <button className="mda-btn mda-btn-green" onClick={() => { setEditando(null); setModalOpen(true); }}>
              ⊕ Nuevo Aliado
            </button>
            <button className="mda-btn mda-btn-violet" onClick={exportarJSON}>
              ↓ Exportar JSON
            </button>
            {!adminMode && (
              <button className="mda-btn mda-btn-danger" onClick={() => setPanelAdmin(false)}>
                ✕ Salir
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mda-content" style={{ paddingTop: adminVisible ? 64 : 0 }}>

        {/* HERO */}
        <div className="mda-hero">
          {/* BLOQUE 1: escenario — rings orbitales + logo del Templo flotante */}
          <div className="mda-hero-stage">
            <div className="mda-orbit-ring mda-orbit-1" />
            <div className="mda-orbit-ring mda-orbit-2" />
            <div className="mda-orbit-ring mda-orbit-3" />
            <div className="mda-orbit-dot" />
            <div className="mda-hero-logo-wrap">
              <div className="mda-hero-logo-glow" />
              <div className="mda-hero-logo-ring" />
              <img className="mda-hero-logo-img" src={LOGO_TEMPLO_URL} alt="Templo del Propósito" />
            </div>
          </div>
          <div className="mda-hero-eyebrow">Templo del Propósito · Alianza</div>
          <h1 className="mda-hero-title">El Muro de los Aliados</h1>
          <p className="mda-hero-sub">
            Negocios que decidieron que su espacio sirve para algo más que vender.<br />
            <strong>Aquí están los que abrieron su puerta — y cambiaron vidas haciéndolo.</strong>
          </p>
          <Ornament />
        </div>

        {/* BLOQUE 3: CÓMO FUNCIONA SER PUNTO ALIADO */}
        <div className="mda-cf">
          <div className="mda-section-header">
            <div className="mda-section-line" />
            <div className="mda-section-title">⚜ Cómo Funciona Ser Punto Aliado</div>
            <div className="mda-section-line r" />
          </div>
          <p className="mda-cf-sub">
            Esto es lo que vive cada persona que entra por la puerta de uno de estos negocios.
          </p>
          <div className="mda-cf-track">
            <div className="mda-cf-step">
              <div className="mda-cf-num">01</div>
              <div className="mda-cf-title">Escanea el QR</div>
              <div className="mda-cf-text">En el negocio aliado, escaneas el código del Templo. Sin apps que descargar, sin filas.</div>
            </div>
            <div className="mda-cf-step">
              <div className="mda-cf-num">02</div>
              <div className="mda-cf-title">Te registras</div>
              <div className="mda-cf-text">Tu lugar en la comunidad queda asegurado al instante. Ya eres parte del movimiento.</div>
            </div>
            <div className="mda-cf-step">
              <div className="mda-cf-num">03</div>
              <div className="mda-cf-title">Sorteo en vivo</div>
              <div className="mda-cf-text">Cada evento del Punto Aliado tiene su propia ronda. Tú participas automáticamente.</div>
            </div>
            <div className="mda-cf-step">
              <div className="mda-cf-num">04</div>
              <div className="mda-cf-title">Todos ganan algo</div>
              <div className="mda-cf-text">1 persona se lleva la beca completa de 6 meses. El resto, su primer mes por solo $1 USD.</div>
              <div className="mda-cf-value-pill">⚔ Beca: valor real $294 USD</div>
            </div>
          </div>
        </div>

        {/* CONTADOR */}
        <div className="mda-counter">
          <div className="mda-counter-num">{numVisible}</div>
          <div className="mda-counter-label">
            {aliados.length === 1 ? "Negocio ya abrió su puerta" : "Negocios ya abrieron su puerta"}
          </div>
          <div className="mda-counter-sub">Cada uno con su QR, su logo y su frase — aquí, para siempre.</div>
        </div>

        {/* BLOQUE 4: BANDEJA DE IMPACTO EN VIVO — dato real desde Supabase, ya no editable a mano */}
        <div className="mda-impacto">
          <div className="mda-impacto-grid">
            <div className="mda-impacto-card">
              <div className="mda-impacto-num">{templariosAnim}</div>
              <span className="mda-impacto-icon">⚔</span>
              <div className="mda-impacto-label">Templarios registrados</div>
              <div className="mda-impacto-formula">Personas que ya escanearon un QR de la Alianza</div>
            </div>

            <div className="mda-impacto-card">
              <span className="mda-impacto-icon">🎓</span>
              <div className="mda-impacto-num">{becasAnim}</div>
              <div className="mda-impacto-label">Becas activadas</div>
              <div className="mda-impacto-formula">Cada 6 Templarios nuevos, una persona cruza la puerta sin pagar nada</div>
            </div>

            <div className="mda-impacto-card">
              <span className="mda-impacto-icon">🐾</span>
              <div className="mda-impacto-num">{costalesAnim}</div>
              <div className="mda-impacto-label">Costales enviados</div>
              <div className="mda-impacto-formula">Cada 25 Templarios nuevos, un costal de 20kg llega a un refugio</div>
            </div>
          </div>
        </div>

        {/* MANIFESTO */}
        <div className="mda-manifesto">
          {[
            {
              icon: "⚔",
              title: "Propósito en cada espacio",
              text: "Cada negocio en este muro decidió que su puerta sirve para algo más que vender.",
            },
            {
              icon: "🎓",
              title: "El movimiento crece aquí",
              text: "Cada persona que entra, escanea y se registra suma a algo real — becas, causas, comunidad.",
            },
            {
              icon: "🐾",
              title: "Impacto que se puede tocar",
              text: "Cada 25 nuevos Templarios, un costal de comida llega a un refugio. Estos aliados lo hacen posible.",
            },
          ].map((item) => (
            <div className="mda-manifesto-item" key={item.title}>
              <span className="mda-manifesto-icon">{item.icon}</span>
              <div className="mda-manifesto-title">{item.title}</div>
              <div className="mda-manifesto-text">{item.text}</div>
            </div>
          ))}
        </div>

        {/* PANEL DE REORDENAMIENTO (solo admin) — arrastra para acomodar, o usa las flechas */}
        {adminVisible && aliados.length > 0 && (
          <>
            <div className="mda-section-header">
              <div className="mda-section-line" />
              <div className="mda-section-title">⇅ Orden del muro — arrastra para acomodar</div>
              <div className="mda-section-line r" />
            </div>
            <div className="mda-admin-list">
              {aliados.map((a, i) => (
                <div
                  className={`mda-admin-item${dragId === a.id ? " dragging" : ""}${dragOverId === a.id ? " drag-over" : ""}`}
                  key={a.id}
                  draggable
                  onDragStart={() => setDragId(a.id)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverId(a.id); }}
                  onDragLeave={() => setDragOverId((cur) => (cur === a.id ? null : cur))}
                  onDrop={(e) => { e.preventDefault(); soltarAliado(a.id); }}
                  onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                >
                  <div className={`mda-admin-item-logo${a.logo ? "" : " placeholder"}`}>
                    {a.logo ? (
                      <img src={a.logo} alt="" style={{ filter: a.invertirLogo ? "invert(1)" : "none" }} />
                    ) : (
                      <SigiloTemplo />
                    )}
                  </div>
                  <div className="mda-admin-item-info">
                    <div className="mda-admin-item-name">{a.nombre}</div>
                    <div className="mda-admin-item-frase">{a.frase}</div>
                  </div>
                  <div className="mda-admin-item-arrows">
                    <button className="mda-arrow-btn" onClick={() => moverAliado(a.id, -1)} disabled={i === 0}>▲</button>
                    <button className="mda-arrow-btn" onClick={() => moverAliado(a.id, 1)} disabled={i === aliados.length - 1}>▼</button>
                  </div>
                  <button className="mda-btn mda-btn-gold" style={{ padding: "6px 14px" }} onClick={() => { setEditando(a); setModalOpen(true); }}>✎</button>
                  <button className="mda-btn mda-btn-danger" style={{ padding: "6px 14px" }} onClick={() => setConfirmarBorrar(a.id)}>✕</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* GRID DEL MURO */}
        <div className="mda-muro-header">
          <div className="mda-muro-header-orn">
            <div className="mda-muro-header-line" />
            <div className="mda-muro-header-diamond" />
            <div className="mda-muro-header-diamond lg" />
            <div className="mda-muro-header-diamond" />
            <div className="mda-muro-header-line r" />
          </div>
          <div className="mda-muro-header-label">⚜ Los Aliados del Templo</div>
          <div className="mda-muro-header-sub">
            Cada logo en este muro representa un negocio que decidió ser parte de algo más grande.
          </div>
        </div>

        {cargando ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(212,175,55,0.5)", fontFamily: "var(--font-title)", letterSpacing: 2, fontSize: 13 }}>
            ⏳ Abriendo el muro…
          </div>
        ) : errorCarga ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,120,120,0.8)", fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 15 }}>
            {errorCarga}
          </div>
        ) : aliados.length === 0 ? (
          <div className="mda-empty-state">
            <div className="mda-empty-rings">
              <div className="mda-empty-ring r1" />
              <div className="mda-empty-ring r2" />
              <div className="mda-empty-ring r3" />
              <div className="mda-empty-sigil">
                <SigiloTemplo />
              </div>
            </div>
            <div className="mda-empty-title">El primer aliado está por llegar.</div>
            <div className="mda-empty-sub">
              El muro empieza con un negocio que decide que su puerta<br />
              vale para algo más que vender. ¿Cuál será el primero?
            </div>
            <div className="mda-empty-orn">
              <div className="mda-orn-line" style={{ width: 40 }} />
              <div className="mda-orn-diamond sm" />
              <div className="mda-orn-diamond" />
              <div className="mda-orn-diamond sm" />
              <div className="mda-orn-line r" style={{ width: 40 }} />
            </div>
          </div>
        ) : (
          <div className="mda-grid">
            {aliados.map((a, i) => (
              <AliadoCard
                key={a.id}
                aliado={a}
                adminMode={adminVisible}
                onEdit={(al) => { setEditando(al); setModalOpen(true); }}
                onDelete={(id) => setConfirmarBorrar(id)}
                revealDelay={i * 80}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mda-cta">
          <div className="mda-cta-bg" />
          <div className="mda-cta-connector" />
          <span className="mda-cta-label">¿Tu negocio quiere estar aquí?</span>
          <div className="mda-cta-title">Únete al movimiento</div>
          <p className="mda-cta-sub">
            Pon el QR en tu negocio. Da acceso al Templo.<br />
            Tu logo y tu frase se quedan en este muro para siempre.
          </p>
          <a className="mda-btn-cta" href="/contacto">
            ⚔ &nbsp; Quiero ser Aliado
          </a>
        </div>

        {/* Botón secreto admin (solo si no está en adminMode prop) */}
        {!adminMode && (
          <div style={{ textAlign: "center", paddingTop: 20 }}>
            <button
              onClick={() => setPanelAdmin((v) => !v)}
              style={{ background: "none", border: "none", color: "rgba(212,175,55,0.15)", fontSize: 10, cursor: "pointer", fontFamily: "var(--font-title)", letterSpacing: 2 }}
            >
              {panelAdmin ? "✕ cerrar admin" : "· · ·"}
            </button>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modalOpen && (
        <ModalAliado
          aliado={editando}
          onSave={guardarAliado}
          onClose={() => { setModalOpen(false); setEditando(null); }}
          saving={guardando}
        />
      )}

      {/* Confirmar borrar */}
      {confirmarBorrar && (
        <div className="mda-modal-overlay" onClick={(e) => e.target === e.currentTarget && setConfirmarBorrar(null)}>
          <div className="mda-modal" style={{ maxWidth: 360 }}>
            <div className="mda-modal-title" style={{ fontSize: 16 }}>¿Eliminar este aliado?</div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.6)", fontStyle: "italic", lineHeight: 1.6 }}>
              Esta acción no se puede deshacer. El logo y la frase de este negocio desaparecerán del muro.
            </p>
            <div className="mda-modal-footer">
              <button className="mda-btn mda-btn-gold" onClick={() => setConfirmarBorrar(null)}>Cancelar</button>
              <button className="mda-btn mda-btn-danger" onClick={() => borrarAliado(confirmarBorrar)}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
