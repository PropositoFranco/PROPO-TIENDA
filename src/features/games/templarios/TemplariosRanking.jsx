import React, { useEffect, useState } from "react";
import { supabase } from "../../../services/supabase";
import { useNavigate } from "react-router-dom";
import * as ReactDOM from "react-dom/client";
import { useAuthStore } from '../../../store/useAuthStore';

if (!window.__ReactDOM__) window.__ReactDOM__ = ReactDOM;


/* ══════════════════════════════════════════════════════════
   CSS — identical to original (@ import must be first rule)
══════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital@0;1&display=swap');

*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  width: 100%; height: auto;
  min-height: 100%;
  background: #030b1a;
  overflow-x: hidden;
}
@media (max-width: 767px) and (orientation: portrait) {
  html, body {
    overflow: auto !important;
    height: auto !important;
    min-height: 100vh !important;
  }
}

.templo-root {
  background: #030b1a;
  min-height: 100vh;
  width: 100%;
  color: #e8d5a3;
  font-family: 'Cinzel', Georgia, serif;
  overflow: visible;
  overflow-x: hidden;
  position: relative;
  padding: 0;
  margin: 0;
}
@media (max-width: 767px) and (orientation: portrait) {
  .templo-root {
    overflow: visible !important;
    overflow-x: hidden !important;
    height: auto !important;
  }
}

.stars-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }

.propocoin {
  position: absolute;
  top: -60px;
  pointer-events: none;
  animation: coinFall linear infinite;
  will-change: transform, opacity;
  contain: layout style;
}
.propocoin svg {
  animation: coinSpin linear infinite;
  display: block;
  will-change: transform;
}
@keyframes coinFall {
  0%   { top: -60px; opacity: 0; }
  8%   { opacity: 0.5; }
  88%  { opacity: 0.35; }
  100% { top: 105vh; opacity: 0; }
}
@keyframes coinSpin {
  0%   { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}

.light-ray {
  position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
  width: 900px; height: 600px;
  pointer-events: none; z-index: 0;
  overflow: hidden;
}
.light-ray::before {
  content: '';
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 100%; height: 100%;
  background: radial-gradient(ellipse at top,
    rgba(255,220,80,0.55) 0%,
    rgba(201,168,76,0.35) 15%,
    rgba(120,80,200,0.18) 40%,
    transparent 70%);
  animation: rayPulse 3s ease-in-out infinite;
}
.light-ray::after {
  content: '';
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 60%; height: 80%;
  background: radial-gradient(ellipse at top,
    rgba(255,255,200,0.7) 0%,
    rgba(255,210,60,0.3) 30%,
    transparent 65%);
  animation: rayPulse 3s ease-in-out infinite reverse;
}
@keyframes rayPulse {
  0%,100% { opacity: 0.7; transform: translateX(-50%) scaleX(1) scaleY(1); }
  50%     { opacity: 1;   transform: translateX(-50%) scaleX(1.12) scaleY(1.08); }
}

.light-beams {
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 900px; height: 500px;
  pointer-events: none; z-index: 0;
  animation: beamRotate 8s linear infinite;
  transform-origin: top center;
}
.light-beams::before, .light-beams::after {
  content: '';
  position: absolute; top: 0;
  width: 3px; height: 100%;
  background: linear-gradient(to bottom, rgba(255,220,80,0.5), transparent);
  filter: blur(4px);
}
.light-beams::before { left: calc(50% - 80px); transform: rotate(-18deg); transform-origin: top center; }
.light-beams::after  { left: calc(50% + 80px); transform: rotate(18deg);  transform-origin: top center; }
@keyframes beamRotate {
  0%,100% { opacity: 0.6; }
  50%     { opacity: 1; }
}

.page-content {
  position: relative;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 18px 20px 20px;
  overflow: hidden;
}
.header-row {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 28px;
}

.header-carousel-wrap {
  flex: 1 1 0;
  min-width: 0;
  height: 150px;
  position: relative;
  overflow: hidden;
  margin-top: 8mm;
}
.header-carousel-wrap::before,
.header-carousel-wrap::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  width: 60px;
  z-index: 4;
  pointer-events: none;
}
.header-carousel-wrap::before {
  left: 0;
  background: linear-gradient(to right, #030b1a 0%, transparent 100%);
}
.header-carousel-wrap::after {
  right: 0;
  background: linear-gradient(to left, #030b1a 0%, transparent 100%);
}

.hcf-slide {
  position: absolute;
  top: 50%;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity, width, height, left;
}
.hcf-slide img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
}
.hcf-slide.hcf-center {
  width: 55%; height: 148px;
  left: 22.5%;
  transform: translateY(-50%) scale(1);
  opacity: 1; z-index: 3;
  filter: none;
}
.hcf-slide.hcf-left {
  width: 18%; height: 72px;
  left: -2%;
  transform: translateY(-50%) scale(0.85);
  opacity: 0.28; z-index: 2;
  filter: brightness(0.5);
}
.hcf-slide.hcf-right {
  width: 18%; height: 72px;
  left: 84%;
  transform: translateY(-50%) scale(0.85);
  opacity: 0.28; z-index: 2;
  filter: brightness(0.5);
}
.hcf-slide.hcf-hidden-left {
  width: 12%; height: 54px;
  left: -20%;
  transform: translateY(-50%) scale(0.7);
  opacity: 0; z-index: 1;
}
.hcf-slide.hcf-hidden-right {
  width: 12%; height: 54px;
  left: 110%;
  transform: translateY(-50%) scale(0.7);
  opacity: 0; z-index: 1;
}

.header-title-side {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 220px;
  margin-top: -3.5mm;
}

.star-icon { font-size: 32px; color: #c9a84c; display: block; margin-bottom: 6px; }
.header-area { text-align: center; margin-bottom: 24px; }
.ranking-title {
  font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #c9a84c;
  text-shadow: 0 0 20px rgba(201,168,76,0.5); margin: 0 0 8px; text-transform: uppercase;
}
.live-badge {
  display: inline-flex; align-items: center; gap: 0;
  background: rgba(201,168,76,0.12); border: 1px solid rgba(201,168,76,0.35);
  border-radius: 20px; padding: 4px 14px; font-size: 11px; letter-spacing: 2px;
  color: #c9a84c; text-transform: uppercase;
}
.live-dot {
  width: 7px; height: 7px; background: #e05050; border-radius: 50%;
  animation: pulse-dot 1.2s ease-in-out infinite; flex-shrink: 0;
}
@keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.4;transform:scale(0.8);} }
.subtitle-count {
  margin-top: 8px; font-size: 11px; letter-spacing: 3px;
  text-transform: uppercase;
  font-family: 'Cinzel', serif; font-weight: 700;
  color: #ff4757;
  text-shadow: 0 0 10px rgba(255,71,87,0.8), 0 0 20px rgba(255,71,87,0.4);
  animation: subtitlePulse 1.4s ease-in-out infinite;
  position: relative;
}
.subtitle-count::before {
  content: '⚔';
  margin-right: 6px;
  font-size: 10px;
}
.subtitle-count::after {
  content: '⚔';
  margin-left: 6px;
  font-size: 10px;
}
@keyframes subtitlePulse {
  0%,100% {
    color: #ff4757;
    text-shadow: 0 0 8px rgba(255,71,87,0.7), 0 0 16px rgba(255,71,87,0.3);
    letter-spacing: 3px;
  }
  50% {
    color: #ff6b78;
    text-shadow: 0 0 16px rgba(255,71,87,1), 0 0 32px rgba(255,71,87,0.6), 0 0 48px rgba(255,40,60,0.3);
    letter-spacing: 4px;
  }
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  grid-template-rows: auto auto;
  gap: 20px;
  align-items: start;
}
.podium-section { grid-column: 1 / -1; }
.ranking-list { grid-column: 1; grid-row: 2; margin-top: 0; }
.right-panel { grid-column: 2; grid-row: 2; }

.podium-stage {
  display: flex; align-items: flex-end; justify-content: center;
  gap: 40px; height: 300px; position: relative;
  overflow: visible;
  padding-top: 90px;
  box-sizing: content-box;
}

.podium-player {
  display: flex; flex-direction: column; align-items: center;
  flex: 1; height: 100%;
  justify-content: flex-end;
}

.player-info {
  display: flex; flex-direction: column; align-items: center;
  margin-bottom: 6px; opacity: 1; transition: opacity 0.4s ease;
}
.player-info.visible { opacity: 1; }

.player-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; letter-spacing: 1px;
  margin-bottom: 5px; border: 2px solid; flex-shrink: 0;
}
.player-name {
  font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase;
  text-align: center; margin-bottom: 2px; max-width: 90px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.player-title { font-size: 9px; letter-spacing: 1px; text-transform: uppercase; text-align: center; opacity: 0.85; margin-bottom: 4px; font-style: italic; font-family: 'Crimson Text', serif; }
.player-pts { font-size: 11px; letter-spacing: 1px; margin-bottom: 6px; }

.podium-block {
  width: 100%;
  display: flex; align-items: center; justify-content: center;
  border-top: 3px solid;
  border-left: 1px solid rgba(255,255,255,0.1);
  border-right: 1px solid rgba(255,255,255,0.1);
  font-size: 20px; font-weight: 700; letter-spacing: 2px;
  overflow: hidden;
  height: 0;
  flex-shrink: 0;
}

.place-medal { font-size: 16px; margin-bottom: 3px; display: block; text-align: center; }

.p1 .player-avatar { background: rgba(201,168,76,0.2); border-color: #c9a84c; color: #c9a84c; }
.p1 .player-name { color: #e8d5a3; }
.p1 .player-pts { color: #c9a84c; }
.p1 .podium-block {
  background: linear-gradient(180deg,rgba(201,168,76,0.28) 0%,rgba(201,168,76,0.07) 100%);
  border-top-color: #c9a84c; color: #c9a84c;
}

.p2 .player-avatar { background: rgba(145,166,210,0.2); border-color: #91a6d2; color: #91a6d2; }
.p2 .player-name { color: #d0dff5; }
.p2 .player-pts { color: #91a6d2; }
.p2 .podium-block {
  background: linear-gradient(180deg,rgba(74,127,212,0.22) 0%,rgba(74,127,212,0.06) 100%);
  border-top-color: #91a6d2; color: #91a6d2;
}

.p3 .player-avatar { background: rgba(180,110,60,0.2); border-color: #b46e3c; color: #b46e3c; }
.p3 .player-name { color: #e0c8b0; }
.p3 .player-pts { color: #b46e3c; }
.p3 .podium-block {
  background: linear-gradient(180deg,rgba(180,110,60,0.22) 0%,rgba(180,110,60,0.06) 100%);
  border-top-color: #b46e3c; color: #b46e3c;
}

.rank-row {
  display: flex; align-items: center; padding: 10px 16px;
  border-bottom: 1px solid rgba(201,168,76,0.1); gap: 12px;
  opacity: 0; transform: translateX(-20px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.rank-row.appear { opacity: 1; transform: translateX(0); }
.rank-row:last-child { border-bottom: none; }
.rank-num { width: 22px; text-align: center; font-size: 12px; color: rgba(201,168,76,0.5); flex-shrink: 0; }
.rank-avatar-sm {
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(74,127,212,0.15); border: 1px solid rgba(74,127,212,0.35);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #91a6d2; flex-shrink: 0; letter-spacing: 1px;
}
.rank-info { flex: 1; min-width: 0; }
.rank-name { font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: #e8d5a3; }
.rank-subtitle { font-size: 10px; color: rgba(201,168,76,0.75); letter-spacing: 1px; font-style: italic; }
.rank-pts { font-size: 12px; letter-spacing: 1px; color: #c9a84c; flex-shrink: 0; }
.rank-delta { font-size: 10px; border-radius: 4px; padding: 2px 6px; flex-shrink: 0; letter-spacing: 1px; }
.delta-up { background: rgba(30,120,60,0.2); color: #4db870; border: 1px solid rgba(77,184,112,0.3); }
.delta-down { background: rgba(120,30,30,0.2); color: #e05050; border: 1px solid rgba(224,80,80,0.3); }

.elite-header {
  text-align: center; padding: 13px 10px;
  background: linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(100,60,5,0.22) 100%);
  border-bottom: 1px solid rgba(201,168,76,0.4);
  font-size: 14px; letter-spacing: 7px; color: #ffe87a; text-transform: uppercase;
  text-shadow: 0 0 16px rgba(255,220,60,0.7);
}
.elite-row {
  display: flex; align-items: center; padding: 10px 14px; gap: 10px;
  border-bottom: 1px solid rgba(201,168,76,0.08);
  transition: background 0.3s;
}
.elite-row:last-child { border-bottom: none; }
.elite-section .elite-row:has(.epos-1) {
  padding: 20px 14px;
  background: linear-gradient(135deg, rgba(201,168,76,0.22) 0%, rgba(130,75,5,0.28) 100%);
  border-bottom: 1px solid rgba(255,220,60,0.3);
  animation: goldRowGlow 3s ease-in-out infinite;
}
@keyframes goldRowGlow {
  0%,100% { box-shadow: inset 0 1px 0 rgba(255,240,140,0.2), 0 0 18px rgba(201,168,76,0.18); }
  50%      { box-shadow: inset 0 1px 0 rgba(255,240,140,0.45), 0 0 44px rgba(255,220,60,0.4); }
}
.elite-section .elite-row:has(.epos-2) {
  padding: 13px 14px;
  background: linear-gradient(135deg, rgba(74,127,212,0.1) 0%, rgba(20,50,100,0.15) 100%);
}
.elite-section .elite-row:has(.epos-3) {
  padding: 11px 14px;
}
.elite-pos {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
}
.epos-1 { background: rgba(201,168,76,0.25); color: #c9a84c; border: 1px solid rgba(201,168,76,0.5); }
.epos-2 { background: rgba(74,127,212,0.2); color: #91a6d2; border: 1px solid rgba(145,166,210,0.4); }
.epos-3 { background: rgba(180,110,60,0.2); color: #b46e3c; border: 1px solid rgba(180,110,60,0.4); }
.elite-section .elite-row:has(.epos-1) .elite-char {
  width: 92px !important; height: 124px !important;
}
.elite-info { flex: 1; min-width: 0; }
.elite-name { font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: #e8d5a3; }
.elite-section .elite-row:has(.epos-1) .elite-name {
  font-size: 17px; letter-spacing: 2.5px; color: #ffe87a;
  text-shadow: 0 0 18px rgba(255,220,60,0.8), 0 1px 0 #7a5000;
}
.elite-section .elite-row:has(.epos-2) .elite-name {
  font-size: 14px; color: #c0d4f0;
}
.elite-rank { font-size: 9px; color: rgba(201,168,76,0.75); letter-spacing: 1px; font-style: italic; }
.elite-section .elite-row:has(.epos-1) .elite-rank {
  font-size: 11px; color: rgba(255,220,60,0.72);
}
.elite-pts { font-size: 11px; color: #c9a84c; letter-spacing: 1px; }
.elite-section .elite-row:has(.epos-1) .elite-pts {
  font-size: 17px; font-weight: 900; color: #ffe87a; letter-spacing: 2px;
  text-shadow: 0 0 14px rgba(255,200,40,0.85);
}
.elite-section .elite-row:has(.epos-2) .elite-pts {
  font-size: 13px; color: #91a6d2;
}
.elite-note {
  padding: 12px; font-size: 10px; letter-spacing: 1px;
  color: rgba(201,168,76,0.4); text-align: center; line-height: 1.6; font-style: italic;
}

.rec-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: rgba(201,168,76,0.12);
  border-bottom: 1px solid rgba(201,168,76,0.25);
}
.rec-title { font-size: 11px; letter-spacing: 3px; color: #c9a84c; text-transform: uppercase; }
.rec-timer {
  background: rgba(0,0,0,0.4); border: 1px solid rgba(201,168,76,0.3);
  border-radius: 4px; padding: 3px 8px; font-size: 13px; font-weight: 700;
  color: #c9a84c; letter-spacing: 2px; font-variant-numeric: tabular-nums;
}
.rec-prizes {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
  background: rgba(201,168,76,0.1);
}
.rec-prize { background: rgba(3,15,40,0.9); padding: 10px; text-align: center; }
.rec-prize-icon { font-size: 22px; margin-bottom: 4px; display: block; }
.rec-prize-label { font-size: 9px; letter-spacing: 1.5px; color: rgba(201,168,76,0.5); text-transform: uppercase; }
.rec-podium-row {
  display: flex; justify-content: space-around; align-items: flex-end;
  padding: 14px 8px 18px; gap: 0;
  background: linear-gradient(180deg, rgba(201,168,76,0.05) 0%, rgba(0,0,0,0.18) 100%);
}
.rpos-gold { transform: scale(1.22); transform-origin: bottom center; }
.rpos-gold .rec-pos-badge {
  width: 46px; height: 46px; font-size: 24px;
  background: radial-gradient(circle, rgba(255,220,60,0.35) 0%, rgba(201,168,76,0.15) 100%);
  border: 2px solid #ffe87a;
  box-shadow: 0 0 20px rgba(255,220,60,0.75), 0 0 40px rgba(255,200,40,0.35);
  animation: goldBadgePulse 2s ease-in-out infinite;
}
.rpos-gold .rec-pos-label { color: #ffe87a; font-size: 10px; font-weight: 700; text-shadow: 0 0 10px rgba(255,220,60,0.9); }
.rpos-gold .rec-prize-coins { color: #ffe87a; font-size: 11px; }
.rpos-silver .rec-pos-badge { width: 34px; height: 34px; font-size: 17px; }
.rpos-silver .rec-pos-label { font-size: 8px; }
.rpos-bronze .rec-pos-badge { width: 30px; height: 30px; font-size: 15px; }
.rpos-bronze .rec-pos-label { font-size: 8px; }
@keyframes goldBadgePulse {
  0%,100% { box-shadow: 0 0 14px rgba(255,220,60,0.55), 0 0 28px rgba(255,200,40,0.2); }
  50%      { box-shadow: 0 0 28px rgba(255,220,60,0.95), 0 0 56px rgba(255,200,40,0.5); }
}
.rec-pos { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.rec-pos-badge {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
}
.rec-pos-label { font-size: 9px; letter-spacing: 1px; text-align: center; text-transform: uppercase; }
.rpos-gold .rec-pos-badge { background: rgba(201,168,76,0.2); border: 2px solid #c9a84c; }
.rpos-gold .rec-pos-label { color: #c9a84c; }
.rpos-silver .rec-pos-badge { background: rgba(145,166,210,0.15); border: 2px solid #91a6d2; }
.rpos-silver .rec-pos-label { color: #91a6d2; }
.rpos-bronze .rec-pos-badge { background: rgba(180,110,60,0.15); border: 2px solid #b46e3c; }
.rpos-bronze .rec-pos-label { color: #b46e3c; }

.ads-strip {
  margin-top: 18px;
  text-align: center;
  position: relative;
  z-index: 1;
}
.ads-label {
  font-size: 10px; letter-spacing: 4px; color: rgba(201,168,76,0.35);
  text-transform: uppercase; margin-bottom: 10px;
  animation: rayPulse 3s ease-in-out infinite;
}
.ads-track {
  position: relative; width: 100%; min-height: 80px;
}
.ad-slide {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.9s ease;
  pointer-events: none;
}
.ad-slide.active {
  opacity: 1; pointer-events: auto;
}
.ad-slide img {
  max-width: 100%; max-height: 120px;
  width: auto; height: auto;
  object-fit: contain; display: block; margin: 0 auto;
  filter: drop-shadow(0 0 18px rgba(201,168,76,0.4));
  animation: adFloat 4s ease-in-out infinite;
}
@keyframes adFloat {
  0%,100% { transform: translateY(0px) scale(1); }
  50%      { transform: translateY(-6px) scale(1.02); }
}
.ads-dots {
  display: flex; justify-content: center; gap: 8px; margin-top: 10px;
}
.ad-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(201,168,76,0.25);
  border: 1px solid rgba(201,168,76,0.4);
  transition: background 0.4s;
  cursor: pointer;
}
.ad-dot.active { background: #c9a84c; }

.feat-carousel {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  margin-bottom: 14px;
}
.feat-slide {
  position: absolute;
  top: 50%;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.feat-slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
.feat-slide.fs-active {
  width: 72%; left: 14%; height: 190px;
  transform: translateY(-50%) scale(1); opacity: 1; z-index: 3;
  box-shadow: 0 0 40px rgba(201,168,76,0.45), 0 0 80px rgba(201,168,76,0.2);
  filter: none;
}
.feat-slide.fs-prev {
  width: 28%; left: -7%; height: 120px;
  transform: translateY(-50%) scale(0.85); opacity: 0.45; z-index: 2;
  filter: brightness(0.55);
}
.feat-slide.fs-next {
  width: 28%; left: 79%; height: 120px;
  transform: translateY(-50%) scale(0.85); opacity: 0.45; z-index: 2;
  filter: brightness(0.55);
}
.feat-slide.fs-far-left {
  width: 15%; left: -25%; height: 80px;
  transform: translateY(-50%) scale(0.7); opacity: 0; z-index: 1;
}
.feat-slide.fs-far-right {
  width: 15%; left: 110%; height: 80px;
  transform: translateY(-50%) scale(0.7); opacity: 0; z-index: 1;
}



.coin-bag-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 2px;
}
#bagCanvas { display: block; }

.ranking-list {
  margin-top: 0;
  border-radius: 8px; overflow: visible; background: rgba(3,15,40,0.6);
  border: 1px solid #c9a84c;
  box-shadow:
    0 0 12px rgba(201,168,76,0.25),
    inset 1px 1px 0 rgba(255,230,120,0.55),
    inset -1px -1px 0 rgba(90,60,0,0.7),
    2px 3px 8px rgba(0,0,0,0.6),
    -1px -1px 4px rgba(201,168,76,0.12);
}
.pc-rank-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: linear-gradient(90deg, rgba(201,168,76,0.18) 0%, rgba(100,60,5,0.22) 100%);
  border-bottom: 1px solid rgba(201,168,76,0.35);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #ffe87a;
  text-shadow: 0 0 8px rgba(255,210,60,0.6);
}
.pc-rank-count {
  font-size: 10px;
  color: rgba(201,168,76,0.6);
  font-weight: 400;
  letter-spacing: 1px;
}
.pc-rank-scroll {
  height: 220px;
  overflow-y: auto;
  overflow-x: visible;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(201,168,76,0.4) transparent;
}
.pc-rank-scroll::-webkit-scrollbar { width: 4px; }
.pc-rank-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.4); border-radius: 2px; }
.pc-rank-scroll::-webkit-scrollbar-track { background: transparent; }
.pc-rank-scroll .rank-row {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  gap: 10px;
  border-bottom: 1px solid rgba(201,168,76,0.1);
  opacity: 1 !important;
  transform: none !important;
}
.pc-rank-scroll .rank-row:last-child { border-bottom: none; }
.pc-rank-scroll .rank-num      { font-size: 12px; width: 22px; text-align: center; color: rgba(201,168,76,0.7); flex-shrink: 0; }
.pc-rank-scroll .rank-avatar-sm{ width: 34px; height: 34px; font-size: 10px; flex-shrink: 0; }
.pc-rank-scroll .rank-info     { flex: 1; min-width: 0; }
.pc-rank-scroll .rank-name     { font-size: 12px; letter-spacing: 1px; }
.pc-rank-scroll .rank-subtitle { font-size: 10px; }
.pc-rank-scroll .rank-pts      { font-size: 12px; flex-shrink: 0; }
.pc-rank-scroll .rank-delta    { font-size: 10px; flex-shrink: 0; }
.pc-rank-sep {
  text-align: center;
  padding: 4px 0;
  font-size: 12px;
  color: rgba(201,168,76,0.35);
  letter-spacing: 4px;
  border-top: 1px solid rgba(201,168,76,0.12);
  border-bottom: 1px solid rgba(201,168,76,0.12);
  background: rgba(0,0,0,0.2);
}
.pc-rank-you {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  gap: 10px;
  background: linear-gradient(90deg, rgba(120,60,200,0.25) 0%, rgba(80,20,160,0.35) 100%);
  border-top: 1.5px solid rgba(180,100,255,0.6);
  box-shadow: inset 0 1px 0 rgba(220,160,255,0.2), 0 0 18px rgba(150,60,255,0.25);
  position: relative;
}
.pc-rank-you .you-num  { font-size: 14px !important; width: 24px !important; color: #d480ff !important; font-weight: 700 !important; }
.pc-rank-you .you-avatar {
  width: 36px !important; height: 36px !important; font-size: 10px !important;
  background: linear-gradient(135deg, #7b2ff7, #c060ff) !important;
  border: 1.5px solid rgba(220,160,255,0.8) !important;
  box-shadow: 0 0 10px rgba(180,80,255,0.5) !important;
  color: #fff !important;
}
.pc-rank-you .rank-info { flex: 1; min-width: 0; }
.pc-you-badge {
  position: absolute;
  top: 6px; right: 10px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #d480ff;
  text-transform: uppercase;
  background: rgba(120,30,200,0.4);
  border: 1px solid rgba(180,80,255,0.5);
  border-radius: 4px;
  padding: 2px 6px;
}

.elite-section {
  background: rgba(3,15,40,0.7);
  border-radius: 8px; overflow: hidden; margin-bottom: 16px;
  border: 1px solid #c9a84c;
  box-shadow:
    0 0 14px rgba(201,168,76,0.28),
    inset 1px 1px 0 rgba(255,230,120,0.55),
    inset -1px -1px 0 rgba(90,60,0,0.7),
    2px 3px 8px rgba(0,0,0,0.6),
    -1px -1px 4px rgba(201,168,76,0.12);
}

.recompensas-panel {
  background: rgba(3,15,40,0.8);
  border-radius: 8px; overflow: hidden;
  border: 1px solid #c9a84c;
  box-shadow:
    0 0 14px rgba(201,168,76,0.28),
    inset 1px 1px 0 rgba(255,230,120,0.55),
    inset -1px -1px 0 rgba(90,60,0,0.7),
    2px 3px 8px rgba(0,0,0,0.6),
    -1px -1px 4px rgba(201,168,76,0.12);
}

.podium-label {
  text-align: center;
  font-size: 12px; font-weight: 700; letter-spacing: 5px;
  text-transform: uppercase;
  color: #ffe87a;
  text-shadow:
    0 1px 0 #7a5000,
    0 2px 4px rgba(0,0,0,0.8),
    0 0 12px rgba(255,210,60,0.7);
  margin-bottom: 8mm;
  margin-top: -18px;
  padding: 7px 18px 8px;
  border-radius: 6px;
  background: linear-gradient(180deg,
    rgba(201,168,76,0.18) 0%,
    rgba(100,70,10,0.22) 100%);
  border-top:    1px solid rgba(255,230,100,0.6);
  border-left:   1px solid rgba(255,220,80,0.4);
  border-right:  1px solid rgba(100,70,10,0.5);
  border-bottom: 1px solid rgba(80,50,5,0.7);
  box-shadow:
    0 0 14px rgba(201,168,76,0.3),
    inset 0 1px 0 rgba(255,240,140,0.35),
    inset 0 -1px 0 rgba(60,40,0,0.5),
    0 2px 6px rgba(0,0,0,0.5);
}

.btn-volver {
  display: block; width: calc(100% - 28px); margin: 12px 14px;
  padding: 10px; background: rgba(74,127,212,0.15);
  border: 1px solid rgba(74,127,212,0.45); border-radius: 6px; color: #91a6d2;
  font-size: 11px; letter-spacing: 3px; text-transform: uppercase; text-align: center;
  cursor: pointer; font-family: 'Cinzel', Georgia, serif; transition: background 0.2s;
}
.btn-volver:hover { background: rgba(74,127,212,0.3); }
.btn-inicio {
  display: flex; align-items: center; justify-content: center;
  width: 100%; min-height: 0; margin-top: -6.5mm;
  padding: 0;
  background: transparent;
  border: none; border-radius: 6px;
  cursor: pointer; font-family: 'Cinzel', Georgia, serif;
  box-sizing: border-box;
}
@keyframes btnGlow {
  0%,100% {
    box-shadow:
      0 0 4px  rgba(201,168,76,0.3),
      0 0 10px rgba(201,168,76,0.2),
      inset 0 0 6px rgba(201,168,76,0.05);
    border-color: rgba(201,168,76,0.4);
  }
  50% {
    box-shadow:
      0 0 12px rgba(255,220,60,0.8),
      0 0 28px rgba(201,168,76,0.55),
      0 0 48px rgba(201,168,76,0.25),
      inset 0 0 12px rgba(255,220,60,0.12);
    border-color: rgba(255,220,60,0.95);
  }
}
.btn-inicio img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
  border-radius: 6px;
  transform: translateY(0);
  animation: imgPulse 1.8s ease-in-out infinite;
}
@keyframes imgPulse {
  0%,100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
}
.btn-propotienda img {
  max-width: 100%; max-height: 44px;
  width: auto; height: auto;
  object-fit: contain; display: block;
}

.mobile-vc-wrap,
.mobile-right-col,
.mobile-panels-grid,
.mobile-btns-grid { display: none; }
#mobilePortraitLayout { display: none; }

@media (max-width: 767px) and (orientation: portrait) {
  html, body { overflow: auto !important; height: auto !important; }
  .templo-root { overflow-y: auto !important; overflow-x: hidden !important; height: auto !important; min-height: 100vh; }
  .page-content {
    position: relative !important;
    transform: none !important;
    width: 100% !important;
    height: auto !important;
    top: auto !important; left: auto !important;
    padding: 0 !important;
    overflow: visible !important;
  }
  .header-row  { display: none !important; }
  .main-grid   { display: none !important; }
  #mobilePortraitLayout {
    display: grid !important;
    grid-template-columns: 44% 56%;
    align-items: stretch;
    width: 100%;
    gap: 0;
    padding-bottom: 16px;
  }
  #mp-bag {
    grid-column: 2;
    grid-row: 1;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    padding: 8px 0 2px;
  }
  #mp-bag canvas { width: 52px; height: 58px; }
  #mp-carousel {
    grid-column: 1;
    grid-row: 1 / 3;
    position: relative;
    overflow: hidden;
    border-radius: 0;
    min-height: 110px;
  }
  #mp-carousel .hcf-slide { border-radius: 0 !important; }
  #mp-carousel .hcf-center {
    width: 100% !important;
    height: 100% !important;
    left: 0 !important;
    transform: translateY(-50%) scale(1) !important;
    opacity: 1 !important; z-index: 3 !important; filter: none !important;
  }
  #mp-carousel .hcf-left {
    width: 25% !important; height: 60% !important;
    left: -15% !important;
    transform: translateY(-50%) scale(0.85) !important;
    opacity: 0 !important; z-index: 2 !important;
  }
  #mp-carousel .hcf-right {
    width: 25% !important; height: 60% !important;
    left: 90% !important;
    transform: translateY(-50%) scale(0.85) !important;
    opacity: 0 !important; z-index: 2 !important;
  }
  #mp-carousel .hcf-hidden-left,
  #mp-carousel .hcf-hidden-right { opacity: 0 !important; }
  #mp-title {
    grid-column: 2;
    grid-row: 2;
    text-align: center;
    padding: 4px 8px 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  #mp-title .ranking-title { font-size: 16px; letter-spacing: 3px; margin: 0 0 5px; white-space: nowrap; }
  #mp-title .live-badge { font-size: 9px; display: inline-flex; padding: 3px 10px; }
  #mp-title .subtitle-count {
    display: block !important;
    font-size: 7px !important;
    letter-spacing: 1.5px !important;
    margin-top: 13px !important;
    white-space: nowrap !important;
    animation: subtitlePulse 1.4s ease-in-out infinite !important;
  }
  #mp-title .subtitle-count::before { content: '⚔ '; font-size: 7px; }
  #mp-title .subtitle-count::after  { content: ' ⚔'; font-size: 7px; }
  #mp-podium-label,
  #mp-podium,
  #mp-ranking-wrap,
  #mp-panels,
  #mp-btns { grid-column: 1 / -1; }
  #mp-panels {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 8px 0;
  }
  #golden-circle-bar-mount-mobile {
    margin-left: -8px !important;
    margin-right: -8px !important;
    width: calc(100% + 16px) !important;
  }
  #mp-panels .elite-section        { margin-bottom: 0 !important; }
  #mp-panels .elite-header         { font-size: 10px; letter-spacing: 2px; padding: 8px 12px; }
  #mp-panels .elite-row            { padding: 8px 10px; gap: 10px; align-items: center; }
  #mp-panels .elite-pos            { width: 22px; height: 22px; font-size: 11px; flex-shrink: 0; }
  #mp-panels .elite-char           { width: 78px !important; height: 92px !important; overflow: hidden !important; flex-shrink: 0 !important; position: relative !important; border-radius: 8px; background: transparent !important; }
  #mp-panels .elite-char canvas    { margin: 0; }  #mp-panels .elite-info           { flex: 1; min-width: 0; }
  #mp-panels .elite-name           { font-size: 12px; font-weight: 700; letter-spacing: 1px; }
  #mp-panels .elite-rank           { font-size: 9px; }
  #mp-panels .elite-pts            { font-size: 11px; font-weight: 700; flex-shrink: 0; }
  #mp-panels .elite-note           { font-size: 9px; padding: 8px 12px; line-height: 1.6; }
  #mp-panels .rank-badge-label     { font-size: 8px !important; margin-top: 3px !important; }
  #mp-panels .recompensas-panel    { border-radius: 8px; overflow: visible !important; height: auto !important; }
  #mp-panels .rec-header           { padding: 8px 12px; }
  #mp-panels .rec-title            { font-size: 10px; letter-spacing: 1.5px; }
  #mp-panels .rec-timer            { font-size: 11px; }
  #mp-panels .recompensas-panel { font-size: 11px; overflow: visible !important; height: auto !important; }
  #mp-panels .rec-header    { padding: 5px 8px; }
  #mp-panels .rec-title     { font-size: 9px; letter-spacing: 1.5px; }
  #mp-panels .rec-timer     { font-size: 10px; }
  #mp-panels .rec-podium-row {
    padding: 10px 6px 14px;
    gap: 0;
    justify-content: space-around;
    align-items: flex-end;
    background: linear-gradient(180deg, rgba(201,168,76,0.04) 0%, rgba(0,0,0,0.2) 100%);
  }
  #mp-panels .rpos-gold {
    transform: scale(1.22);
    transform-origin: bottom center;
    position: relative;
  }
  #mp-panels .rpos-gold .rec-pos-badge {
    width: 38px !important; height: 38px !important; font-size: 20px !important;
    background: radial-gradient(circle, rgba(255,220,60,0.35) 0%, rgba(201,168,76,0.15) 100%) !important;
    border: 2px solid #ffe87a !important;
    box-shadow: 0 0 18px rgba(255,220,60,0.7), 0 0 36px rgba(255,200,40,0.3) !important;
    animation: goldBadgePulse 2s ease-in-out infinite;
  }
  #mp-panels .rpos-gold .rec-pos-label {
    color: #ffe87a !important; font-size: 8px !important; font-weight: 700 !important;
    text-shadow: 0 0 8px rgba(255,220,60,0.9);
  }
  #mp-panels .rpos-gold .rec-prize-coins { font-size: 10px !important; color: #ffe87a !important; }
  #mp-panels .rpos-gold .rec-prize-exp   { font-size: 9px !important; }
  #mp-panels .rpos-silver .rec-pos-badge { width: 28px !important; height: 28px !important; font-size: 15px !important; }
  #mp-panels .rpos-silver .rec-pos-label { font-size: 7px !important; }
  #mp-panels .rpos-silver .rec-prize-coins,
  #mp-panels .rpos-silver .rec-prize-exp { font-size: 8px !important; }
  #mp-panels .rpos-bronze .rec-pos-badge { width: 26px !important; height: 26px !important; font-size: 13px !important; }
  #mp-panels .rpos-bronze .rec-pos-label { font-size: 7px !important; }
  #mp-panels .rpos-bronze .rec-prize-coins,
  #mp-panels .rpos-bronze .rec-prize-exp { font-size: 8px !important; }
  @keyframes goldBadgePulse {
    0%,100% { box-shadow: 0 0 12px rgba(255,220,60,0.5), 0 0 24px rgba(255,200,40,0.2); }
    50%      { box-shadow: 0 0 24px rgba(255,220,60,0.9), 0 0 48px rgba(255,200,40,0.5); }
  }
  #mp-panels .rec-consolacion {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 3px !important;
    padding: 6px 6px 8px !important;
    border-top: 1px solid rgba(201,168,76,0.15) !important;
    background: rgba(0,0,0,0.15) !important;
    overflow: visible !important; height: auto !important;
  }
  #mp-panels .rec-con-item {
    display: flex !important; flex-direction: column !important;
    align-items: center !important; justify-content: center !important;
    background: rgba(201,168,76,0.06) !important;
    border: 1px solid rgba(201,168,76,0.2) !important;
    border-radius: 6px !important; padding: 4px 2px !important;
    min-height: 36px !important; text-align: center !important; gap: 1px !important;
  }
  #mp-btns { display: flex; flex-direction: column; gap: 0; padding: 0 8px; }
  #mp-btns > div { display: flex; width: 100%; }
  #mp-btns a { display: block; width: 100%; }
  #mp-btns img { width: 100%; height: auto; display: block; border-radius: 6px; animation: imgPulse 1.8s ease-in-out infinite; }
  #mp-podium-label {
    text-align: center;
    font-size: 12px; font-weight: 700; letter-spacing: 5px;
    text-transform: uppercase; color: #ffe87a;
    text-shadow: 0 1px 0 #7a5000, 0 2px 4px rgba(0,0,0,0.8), 0 0 12px rgba(255,210,60,0.7);
    margin: 10px 8px 0;
    padding: 7px 18px 8px;
    border-radius: 6px;
    background: linear-gradient(180deg, rgba(201,168,76,0.18) 0%, rgba(100,70,10,0.22) 100%);
    border-top: 1px solid rgba(255,230,100,0.6);
    border-left: 1px solid rgba(255,220,80,0.4);
    border-right: 1px solid rgba(100,70,10,0.5);
    border-bottom: 1px solid rgba(80,50,5,0.7);
    box-shadow: 0 0 14px rgba(201,168,76,0.3), inset 0 1px 0 rgba(255,240,140,0.35), 0 2px 6px rgba(0,0,0,0.5);
  }
  #mp-podium { padding: 0 8px; }
  #mp-podium .podium-stage  { height: 200px !important; padding-top: 10px !important; gap: 4px !important; overflow: visible !important; }
  #mp-podium .podium-player { min-width: 0; flex: 1; overflow: visible; }
  #mp-podium .player-info   { gap: 2px !important; padding: 0 2px; }
  #mp-podium .player-avatar { width: 46px !important; height: 46px !important; font-size: 11px !important; overflow: hidden !important; border-radius: 50% !important; flex-shrink: 0 !important; }
  #mp-podium .player-name   { font-size: 8px !important; letter-spacing: 0px !important; max-width: 72px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; margin-bottom: 1px !important; }
  #mp-podium .player-title  { display: none !important; }
  #mp-podium .player-pts    { font-size: 9px !important; margin-bottom: 2px !important; letter-spacing: 0.5px !important; }
  #mp-podium .place-medal   { font-size: 13px !important; margin-bottom: 0 !important; }
  #mp-podium .podium-block  { font-size: 14px !important; border-top-width: 2px !important; }
  #mp-podium .rank-badge-label  { display: none !important; }
  #mp-podium .streak-pod-badge  { display: block !important; font-size: 7px !important; margin-top: 1px !important; }
  #mp-podium .streak-pod-badge span:last-child { font-size: .65rem !important; padding: 1px 5px !important; }
  #mp-podium .tu-pod-badge      { font-size: 7px !important; padding: 2px 8px !important; bottom: 4px !important; letter-spacing: 1.5px !important; }
  #mp-ranking-wrap {
    margin: 8px 8px 0;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #c9a84c;
    box-shadow: 0 0 14px rgba(201,168,76,0.3), inset 1px 1px 0 rgba(255,230,120,0.4);
    background: rgba(3,15,40,0.7);
  }
  #mp-ranking-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 12px;
    background: linear-gradient(90deg, rgba(201,168,76,0.18) 0%, rgba(100,60,5,0.22) 100%);
    border-bottom: 1px solid rgba(201,168,76,0.35);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #ffe87a;
    text-shadow: 0 0 8px rgba(255,210,60,0.6);
  }
  #mp-ranking-count { font-size: 9px; color: rgba(201,168,76,0.6); font-weight: 400; letter-spacing: 1px; }
  #mp-ranking-scroll {
    height: 220px;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: rgba(201,168,76,0.4) transparent;
  }
  #mp-ranking-scroll::-webkit-scrollbar { width: 3px; }
  #mp-ranking-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.4); border-radius: 2px; }
  #mp-ranking-scroll::-webkit-scrollbar-track { background: transparent; }
  #mp-ranking-scroll .rank-row {
    display: flex; align-items: center; padding: 10px 12px; gap: 9px;
    border-bottom: 1px solid rgba(201,168,76,0.1);
    opacity: 1 !important; transform: none !important;
  }
  #mp-ranking-scroll .rank-row:last-child { border-bottom: none; }
  #mp-ranking-scroll .rank-num  { font-size: 11px; width: 20px; text-align: center; color: rgba(201,168,76,0.7); flex-shrink: 0; }
  #mp-ranking-scroll .rank-avatar-sm { width: 32px; height: 32px; font-size: 10px; flex-shrink: 0; }
  #mp-ranking-scroll .rank-info { flex: 1; min-width: 0; }
  #mp-ranking-scroll .rank-name { font-size: 11px; letter-spacing: 1px; }
  #mp-ranking-scroll .rank-subtitle { font-size: 9px; }
  #mp-ranking-scroll .rank-pts  { font-size: 11px; flex-shrink: 0; }
  #mp-ranking-scroll .rank-delta { font-size: 9px; flex-shrink: 0; }
  #mp-ranking-sep {
    text-align: center; padding: 4px 0; font-size: 11px;
    color: rgba(201,168,76,0.35); letter-spacing: 4px;
    border-top: 1px solid rgba(201,168,76,0.12);
    border-bottom: 1px solid rgba(201,168,76,0.12);
    background: rgba(0,0,0,0.2);
  }
  #mp-ranking-you {
    display: flex; align-items: center; padding: 11px 12px; gap: 9px;
    background: linear-gradient(90deg, rgba(120,60,200,0.25) 0%, rgba(80,20,160,0.35) 100%);
    border-top: 1.5px solid rgba(180,100,255,0.6);
    box-shadow: inset 0 1px 0 rgba(220,160,255,0.2), 0 0 18px rgba(150,60,255,0.25);
    position: relative;
  }
  .you-num { font-size: 13px !important; width: 22px !important; color: #d480ff !important; font-weight: 700 !important; }
  .you-avatar {
    width: 34px !important; height: 34px !important; font-size: 9px !important;
    background: linear-gradient(135deg, #7b2ff7, #c060ff) !important;
    border: 1.5px solid rgba(220,160,255,0.8) !important;
    box-shadow: 0 0 10px rgba(180,80,255,0.5) !important;
    color: #fff !important;
  }
  #mp-ranking-you .rank-name { font-size: 11px; color: #e8b0ff; }
  #mp-ranking-you .rank-subtitle { font-size: 9px; color: rgba(200,130,255,0.7); }
  #mp-ranking-you .rank-pts { font-size: 12px; color: #d480ff; font-weight: 700; }
  .you-badge {
    position: absolute; top: 5px; right: 8px;
    font-size: 7px; font-weight: 700; letter-spacing: 1.5px; color: #d480ff;
    text-transform: uppercase; background: rgba(120,30,200,0.4);
    border: 1px solid rgba(180,80,255,0.5); border-radius: 4px; padding: 2px 5px;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .page-content { padding: 8px 8px 8px; }
  .header-carousel-wrap { display: none !important; }
  .header-row { gap: 0; margin-bottom: 8px; justify-content: center; }
  .header-title-side { min-width: 0; margin-top: 0; }
  .coin-bag-wrap     { width: 36px; height: 40px; margin-bottom: 1px; }
  .ranking-title     { font-size: 14px; letter-spacing: 2px; margin-bottom: 3px; }
  .live-badge        { font-size: 8px; padding: 2px 8px; letter-spacing: 1px; }
  .subtitle-count    { font-size: 7px; margin-top: 3px; }
  .main-grid { grid-template-columns: 62px 1fr 138px !important; gap: 5px; align-items: start; }
  .mobile-vc-wrap {
    display: block;
    position: relative;
    width: 62px;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .mvc-slide {
    position: absolute;
    left: 50%;
    border-radius: 5px;
    overflow: hidden;
    transition: all 0.65s cubic-bezier(.4,0,.2,1);
    will-change: transform,opacity,width,height,top;
  }
  .mvc-slide img { width:100%; height:100%; object-fit:cover; display:block; }
  .mvc-center {
    width: 58px; height: 50px;
    top: 50%;
    transform: translate(-50%,-50%) scale(1);
    opacity: 1; z-index: 3; filter: none;
    box-shadow: 0 0 8px rgba(201,168,76,.55);
  }
  .mvc-top {
    width: 38px; height: 32px;
    top: calc(50% - 46px);
    transform: translate(-50%,-50%) scale(.82);
    opacity: .26; z-index: 2; filter: brightness(.5);
  }
  .mvc-bottom {
    width: 38px; height: 32px;
    top: calc(50% + 46px);
    transform: translate(-50%,-50%) scale(.82);
    opacity: .26; z-index: 2; filter: brightness(.5);
  }
  .mvc-hidden-top {
    width: 26px; height: 22px;
    top: calc(50% - 84px);
    transform: translate(-50%,-50%) scale(.65);
    opacity: 0; z-index: 1;
  }
  .mvc-hidden-bottom {
    width: 26px; height: 22px;
    top: calc(50% + 84px);
    transform: translate(-50%,-50%) scale(.65);
    opacity: 0; z-index: 1;
  }
  .podium-stage { height: 120px !important; padding-top: 28px !important; gap: 5px !important; }
  .podium-label  { font-size: 8px; letter-spacing: 2px; padding: 4px 8px; margin-bottom: 2mm; }
  .player-avatar { width: 26px; height: 26px; font-size: 8px; margin-bottom: 2px; border-width: 1px; }
  .player-name   { font-size: 7px; letter-spacing: 1px; max-width: 60px; }
  .player-title  { font-size: 6px; margin-bottom: 2px; }
  .player-pts    { font-size: 7px; margin-bottom: 3px; }
  .place-medal   { font-size: 12px; margin-bottom: 1px; }
  .podium-block  { border-top-width: 2px; font-size: 14px; }
  .ranking-list  { margin-top: 6px; }
  .rank-row      { padding: 5px 6px; gap: 5px; }
  .rank-avatar-sm{ width: 22px; height: 22px; font-size: 7px; }
  .rank-name     { font-size: 8px; letter-spacing: 1px; }
  .rank-subtitle { font-size: 6px; }
  .rank-pts      { font-size: 8px; }
  .rank-delta    { font-size: 7px; padding: 1px 3px; }
  .rank-num      { font-size: 9px; width: 14px; }
  .mobile-right-col { display: flex !important; flex-direction: column; gap: 4px; }
  .mobile-panels-grid { display: grid !important; grid-template-columns: 1fr 1fr; gap: 4px; }
  .elite-section  { margin-bottom: 0 !important; }
  .elite-header   { font-size: 7px; letter-spacing: 1px; padding: 4px 4px; }
  .elite-row      { padding: 4px 5px; gap: 4px; }
  .elite-pos      { width: 14px; height: 14px; font-size: 7px; flex-shrink:0; }
  .elite-name     { font-size: 8px; letter-spacing: .5px; }
  .elite-rank     { font-size: 6px; }
  .elite-pts      { font-size: 7px; }
  .elite-note     { font-size: 6px; padding: 4px; line-height: 1.4; }
  .rec-header     { padding: 4px 6px; }
  .rec-title      { font-size: 7px; letter-spacing: 1px; }
  .rec-timer      { font-size: 9px; padding: 1px 4px; }
  .rec-podium-row { padding: 5px 3px; gap: 2px; }
  .rec-pos-badge  { width: 20px; height: 20px; font-size: 9px; }
  .rec-pos-label  { font-size: 6px; letter-spacing: .3px; }
  .mobile-btns-grid { display: grid !important; grid-template-columns: 1fr 1fr; gap: 4px; }
  .mobile-btns-grid > div { margin: 0 !important; line-height: 0; font-size: 0; padding: 0; }
  .mobile-btns-grid img { width: 100%; height: auto; border-radius: 5px; animation: imgPulse 1.8s ease-in-out infinite; }
}

/* ── PREMIUM PODIUM ── */
.p1 .podium-block { animation: goldPulse 4s ease-in-out infinite; will-change: box-shadow; }
.p2 .podium-block { animation: silverPulse 5s ease-in-out infinite; will-change: box-shadow; }
.p3 .podium-block { animation: bronzePulse 5.5s ease-in-out infinite; will-change: box-shadow; }
@keyframes goldPulse {
  0%,100% { box-shadow: 0 0 16px rgba(201,168,76,0.35); }
  50%      { box-shadow: 0 0 36px rgba(255,220,60,0.7), 0 0 60px rgba(255,200,40,0.2); }
}
@keyframes silverPulse {
  0%,100% { box-shadow: 0 0 10px rgba(145,166,210,0.25); }
  50%      { box-shadow: 0 0 24px rgba(145,166,210,0.55); }
}
@keyframes bronzePulse {
  0%,100% { box-shadow: 0 0 8px rgba(180,110,60,0.2); }
  50%      { box-shadow: 0 0 20px rgba(180,110,60,0.5); }
}
.p1 .player-avatar {
  background: linear-gradient(135deg,#7a5000,#c9a84c,#ffe87a) !important;
  color: #3a2000 !important; font-weight: 900;
  width: 88px !important; height: 88px !important; font-size: 15px !important;
  animation: avatarGlow1 4s ease-in-out infinite;
  border-color: #ffe87a !important;
  will-change: box-shadow, transform;
}
.p2 .player-avatar {
  background: linear-gradient(135deg,#2a3a5a,#6a90c8,#c0d4f0) !important;
  color: #0a1a3a !important; font-weight: 900;
}
.p3 .player-avatar {
  background: linear-gradient(135deg,#5a3010,#b46e3c,#e8a060) !important;
  color: #3a1800 !important; font-weight: 900;
}
@keyframes avatarGlow1 {
  0%,100% { box-shadow: 0 0 0 2px rgba(201,168,76,0.5), 0 0 18px rgba(201,168,76,0.4); transform: scale(1); }
  50%      { box-shadow: 0 0 0 5px rgba(255,220,60,0.85), 0 0 38px rgba(255,200,40,0.75); transform: scale(1.09); }
}
.p1 .player-name { color: #ffe87a !important; text-shadow: 0 0 18px rgba(255,220,60,0.9); max-width: 150px; font-size: 15px !important; letter-spacing: 2px !important; }
.p2 .player-name { 
  color: #c0d4f0 !important; 
  font-size: 13px !important; 
  letter-spacing: 1.5px !important;
  text-shadow: 0 0 14px rgba(145,166,210,0.9), 0 0 28px rgba(145,166,210,0.4) !important;
  max-width: 110px;
}
.p3 .player-name { 
  color: #e8a060 !important; 
  font-size: 13px !important; 
  letter-spacing: 1.5px !important;
  text-shadow: 0 0 14px rgba(180,110,60,0.9), 0 0 28px rgba(180,110,60,0.4) !important;
  max-width: 110px;
}
.p2 .player-pts {
  font-size: 16px !important;
  font-weight: 900 !important;
  color: #91a6d2 !important;
  text-shadow: 0 0 14px rgba(145,166,210,0.9) !important;
  letter-spacing: 2px !important;
}
.p3 .player-pts {
  font-size: 16px !important;
  font-weight: 900 !important;
  color: #e8a060 !important;
  text-shadow: 0 0 14px rgba(180,110,60,0.9) !important;
  letter-spacing: 2px !important;
}
.p1 .player-pts  { font-size: 20px !important; color: #ffe87a !important; font-weight: 900; text-shadow: 0 0 18px rgba(255,200,40,0.95), 0 0 40px rgba(255,180,0,0.45); letter-spacing: 3px !important; }
.p1 .player-info { position: relative; }
.p1 .player-info.visible::after {
  content: '✦  ✦  ✦';
  position: absolute; top: -20px; left: 50%;
  transform: translateX(-50%);
  font-size: 9px; color: #ffe87a; letter-spacing: 5px;
  animation: starsFloat 1.8s ease-in-out infinite;
  text-shadow: 0 0 10px rgba(255,220,60,1);
  white-space: nowrap;
}
@keyframes starsFloat {
  0%,100% { transform: translateX(-50%) translateY(0); opacity: 0.6; }
  50%      { transform: translateX(-50%) translateY(-5px); opacity: 1; }
}
.rank-row { transition: background 0.2s; }
.rank-row:hover { background: rgba(201,168,76,0.06); }
.rec-prize-coins {
  font-size: 9px; font-weight: 800; letter-spacing: 1px;
  color: #c9a84c; margin-top: 3px;
  text-shadow: 0 0 8px rgba(201,168,76,0.6);
}
.rec-prize-exp {
  font-size: 9px; font-weight: 700; letter-spacing: 1px;
  color: #7eb8f7; margin-top: 1px;
  text-shadow: 0 0 8px rgba(126,184,247,0.5);
}
.rec-consolacion {
  padding: 8px 10px 6px;
  border-top: 1px solid rgba(201,168,76,0.18);
  background: rgba(0,0,0,0.2);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}
.rec-con-item {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(201,168,76,0.1), rgba(100,60,5,0.15));
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: 8px; padding: 4px 3px;
  font-size: 8px; letter-spacing: 0.3px; color: rgba(201,168,76,0.85);
  font-family: 'Cinzel', serif; font-weight: 700;
  transition: all 0.2s;
  box-shadow: 0 0 6px rgba(201,168,76,0.08), inset 0 1px 0 rgba(255,230,120,0.12);
  text-align: center; line-height: 1.4; gap: 0px;
}
.rec-con-item:hover {
  background: linear-gradient(135deg, rgba(201,168,76,0.2), rgba(120,70,5,0.25));
  border-color: rgba(201,168,76,0.6);
  box-shadow: 0 0 14px rgba(201,168,76,0.25);
}
@media (max-width: 767px) and (orientation: portrait) {
  #mp-panels .rec-consolacion {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 5px !important;
    padding: 8px 8px 6px !important;
    border-top: 1px solid rgba(201,168,76,0.2) !important;
    background: rgba(0,0,0,0.25) !important;
  }
  #mp-panels .rec-con-item {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    background: linear-gradient(135deg, rgba(201,168,76,0.14), rgba(100,60,5,0.22)) !important;
    border: 1px solid rgba(201,168,76,0.35) !important;
    border-radius: 7px !important;
    padding: 4px 3px !important;
    min-height: 32px !important;
    min-width: 0 !important;
    font-size: 11px !important;
    letter-spacing: 0.3px !important;
    color: rgba(201,168,76,0.95) !important;
    font-family: 'Cinzel', serif !important;
    font-weight: 700 !important;
    text-align: center !important;
    line-height: 1.7 !important;
    gap: 0 !important;
    overflow: hidden !important;
    word-break: break-word !important;
    box-shadow: 0 0 10px rgba(201,168,76,0.15), inset 0 1px 0 rgba(255,230,120,0.2) !important;
  }
    #mp-panels .rec-consolacion {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 5px !important;
    padding: 8px !important;
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
    border-top: 1px solid rgba(201,168,76,0.2) !important;
    background: rgba(0,0,0,0.2) !important;
  }
  #mp-panels .recompensas-panel {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
  }
  #golden-circle-bar-mount-mobile {
    grid-column: 1 / -1 !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  #mp-panels .recompensas-panel > * {
    overflow: visible !important;
  }
}
 .banner-cta {
  position: absolute;
  bottom: 8px; right: 10px;
  background: rgba(3,11,26,0.85);
  color: #c9a84c;
  font-family: 'Cinzel', Georgia, serif;
  font-size: 9px; font-weight: 800;
  letter-spacing: 2px; text-transform: uppercase;
  padding: 5px 14px; border-radius: 20px;
  border: 1px solid rgba(201,168,76,0.7);
  cursor: pointer; z-index: 10;
  opacity: 0; transition: opacity 0.35s;
  pointer-events: none; white-space: nowrap;
  box-shadow: 0 0 12px rgba(201,168,76,0.4), 0 2px 8px rgba(0,0,0,0.6);
  animation: none;
}
.hcf-center .banner-cta,
.mvc-center .banner-cta {
  opacity: 1;
  pointer-events: auto;
  animation: ctaPulse 1.8s ease-in-out infinite;
}
.hcf-center .banner-cta:hover {
  background: #c9a84c;
  color: #030b1a;
  transform: scale(1.06);
}
@keyframes ctaPulse {
  0%,100% { box-shadow: 0 0 6px rgba(201,168,76,0.4), 0 2px 8px rgba(0,0,0,0.6); border-color: rgba(201,168,76,0.5); }
  50%      { box-shadow: 0 0 18px rgba(201,168,76,0.9), 0 0 30px rgba(201,168,76,0.4); border-color: rgba(201,168,76,1); }
}
}
.t1-badge {
  display: block;
  filter: drop-shadow(0 0 8px rgba(201,168,76,0.6));
  animation: imgPulse 2s ease-in-out infinite;
}
@keyframes vipShimmer{0%{background-position:200% center}100%{background-position:0% center}}
@keyframes vipNodePop{0%{transform:translateX(-50%) scale(0.4);opacity:0}70%{transform:translateX(-50%) scale(1.18)}100%{transform:translateX(-50%) scale(1);opacity:1}}
@keyframes vipGoldPulse{0%,100%{box-shadow:0 0 18px rgba(212,175,55,0.5),0 0 40px rgba(212,175,55,0.2)}50%{box-shadow:0 0 38px rgba(212,175,55,1),0 0 80px rgba(212,175,55,0.45)}}
@keyframes vipCrownFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-5px) scale(1.08)}}
@keyframes vipBuyPulse{0%,100%{box-shadow:0 0 22px rgba(212,175,55,0.6),0 0 50px rgba(139,92,246,0.3)}50%{box-shadow:0 0 44px rgba(212,175,55,1),0 0 90px rgba(139,92,246,0.6),0 0 120px rgba(212,175,55,0.2)}}
@keyframes vipBuyShimmer{0%{left:-100%}100%{left:200%}}
@keyframes vipUnlockBurst{0%{transform:scale(0.5);opacity:1}100%{transform:scale(3);opacity:0}}
@keyframes vipDiamondPulse {
  0%,100% { box-shadow: 0 0 0 2px #4fc3f7, 0 0 0 4px rgba(79,195,247,0.4), 0 0 20px rgba(79,195,247,0.3), inset 0 0 12px rgba(79,195,247,0.08); }
  50%      { box-shadow: 0 0 0 2px #b3e5fc, 0 0 0 6px rgba(79,195,247,0.7), 0 0 40px rgba(79,195,247,0.6), 0 0 60px rgba(185,220,255,0.2), inset 0 0 24px rgba(79,195,247,0.18); }
}
@keyframes vipRuneShimmer {
  0%   { background-position: 200% center; }
  100% { background-position: 0% center; }
}
@keyframes vipDiamondSpin {
  0%   { transform: translateX(-50%) rotate(0deg) scale(1); }
  50%  { transform: translateX(-50%) rotate(180deg) scale(1.15); }
  100% { transform: translateX(-50%) rotate(360deg) scale(1); }
}
@keyframes vipCornerGlow {
  0%,100% { opacity: 0.5; }
  50%      { opacity: 1; }
}
@keyframes vipRowAura {
  0%,100% { box-shadow: inset 0 0 30px rgba(79,195,247,0.06), 0 0 12px rgba(79,195,247,0.08); }
  50%      { box-shadow: inset 0 0 60px rgba(79,195,247,0.14), 0 0 28px rgba(79,195,247,0.2); }
}
@keyframes vipBadgePulse {
  0%,100% { box-shadow: 0 0 6px rgba(79,195,247,0.5), 0 0 12px rgba(79,195,247,0.3); }
  50%      { box-shadow: 0 0 14px rgba(79,195,247,1), 0 0 28px rgba(79,195,247,0.6), 0 0 40px rgba(185,220,255,0.3); }
}
@keyframes vipTagFloat {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-2px); }
}
@keyframes propoBtnShimmer {
  0%   { left: -100%; }
  100% { left: 200%; }
}
@keyframes propoModalIn {
  0%   { opacity: 0; transform: scale(0.85) translateY(24px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes propoSunRay {
  0%,100% { opacity: 0.55; transform: translateX(-50%) scaleX(1); }
  50%     { opacity: 1;    transform: translateX(-50%) scaleX(1.14); }
}
@keyframes propoGoldPulse {
  0%,100% { box-shadow: 0 0 20px rgba(201,168,76,0.5), 0 0 50px rgba(201,168,76,0.2); }
  50%     { box-shadow: 0 0 44px rgba(201,168,76,1), 0 0 90px rgba(201,168,76,0.5); }
}
@keyframes propoAquaGlow {
  0%,100% { box-shadow: 0 0 18px rgba(0,200,220,0.5), 0 0 40px rgba(0,180,200,0.2); }
  50%     { box-shadow: 0 0 38px rgba(0,220,240,1), 0 0 80px rgba(0,200,220,0.5); }
}
@keyframes propoCrownFloat {
  0%,100% { transform: translateY(0) rotate(-4deg); filter: drop-shadow(0 0 12px rgba(201,168,76,0.9)); }
  50%     { transform: translateY(-9px) rotate(4deg); filter: drop-shadow(0 0 26px rgba(255,220,60,1)); }
}
@keyframes propoUnlockBtn {
  0%,100% {
    box-shadow: 0 0 14px rgba(201,168,76,0.5), 0 0 30px rgba(0,200,220,0.2);
    border-color: rgba(201,168,76,0.7);
  }
  50% {
    box-shadow: 0 0 34px rgba(201,168,76,1), 0 0 68px rgba(0,200,220,0.5);
    border-color: rgba(255,230,80,1);
  }
}
@keyframes propoRune {
  0%   { background-position: 200% center; }
  100% { background-position: 0% center; }
}
@keyframes propoOverlayIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes propoLockPulse {
  0%,100% {
    box-shadow: 0 0 10px rgba(201,168,76,0.4), 0 0 22px rgba(0,200,220,0.15);
    border-color: rgba(201,168,76,0.55);
  }
  50% {
    box-shadow: 0 0 26px rgba(201,168,76,0.9), 0 0 52px rgba(0,200,220,0.4);
    border-color: rgba(255,230,80,0.95);
  }
}

#mp-panels .elite-section { display: none !important; }
.right-panel .elite-section { display: none !important; }
`;


/* ══════════════════════════════════════════════════════════
   INNER HTML — identical to original (inside templo-root)
══════════════════════════════════════════════════════════ */
const INNER_HTML = `
  <div class="stars-bg" id="starsContainer"></div>

  <div class="page-content">
    <div class="header-row">
      <div class="header-carousel-wrap" id="hcfWrap">
        <div class="hcf-slide" data-idx="0"><img src="https://picsum.photos/seed/templo1/500/200" alt="Anuncio 1"></div>
        <div class="hcf-slide" data-idx="1"><img src="https://picsum.photos/seed/templo2/500/200" alt="Anuncio 2"></div>
        <div class="hcf-slide" data-idx="2"><img src="https://picsum.photos/seed/templo3/500/200" alt="Anuncio 3"></div>
        <div class="hcf-slide" data-idx="3"><img src="https://picsum.photos/seed/templo4/500/200" alt="Anuncio 4"></div>
        <div class="hcf-slide" data-idx="4"><img src="https://picsum.photos/seed/templo5/500/200" alt="Anuncio 5"></div>
      </div>
      <div class="header-title-side">
        <div class="coin-bag-wrap">
          <svg class="t1-badge" width="70" height="78" viewBox="0 0 70 78" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="35" cy="24" r="20" stroke="#c9a84c" stroke-width="1.2" opacity="0.6"/>
            <line x1="35" y1="4" x2="35" y2="1" stroke="#c9a84c" stroke-width="1.2"/>
            <line x1="19" y1="9" x2="17" y2="7" stroke="#c9a84c" stroke-width="1.2"/>
            <line x1="51" y1="9" x2="53" y2="7" stroke="#c9a84c" stroke-width="1.2"/>
            <ellipse cx="35" cy="17" rx="5" ry="6" fill="none" stroke="#c9a84c" stroke-width="1.2"/>
            <path d="M28 18 Q35 14 42 18 L40 23 Q35 21 30 23 Z" fill="none" stroke="#c9a84c" stroke-width="1"/>
            <path d="M26 24 Q35 28 44 24 L46 30 Q35 35 24 30 Z" fill="none" stroke="#c9a84c" stroke-width="1"/>
            <path d="M24 30 Q20 34 22 38 Q35 36 48 38 Q50 34 46 30" fill="none" stroke="#c9a84c" stroke-width="1"/>
            <path d="M20 38 Q18 42 20 44 L50 44 Q52 42 50 38" fill="none" stroke="#c9a84c" stroke-width="1"/>
            <text x="35" y="32" text-anchor="middle" fill="#c9a84c" font-size="6" font-family="serif" letter-spacing="1">T</text>
            <path d="M18 52 L52 52 L54 58 L52 66 L35 72 L18 66 L16 58 Z" fill="none" stroke="#c9a84c" stroke-width="1.2"/>
            <text x="35" y="59" text-anchor="middle" fill="#c9a84c" font-size="5" font-family="serif" letter-spacing="2">TEMPORADA</text>
            <text x="35" y="68" text-anchor="middle" fill="#c9a84c" font-size="10" font-weight="bold" font-family="serif" letter-spacing="2">T1</text>
            <circle cx="35" cy="74" r="1.5" fill="#c9a84c"/>
            <circle cx="14" cy="22" r="1" fill="#c9a84c" opacity="0.5"/>
            <circle cx="56" cy="22" r="1" fill="#c9a84c" opacity="0.5"/>
            <circle cx="14" cy="28" r="0.8" fill="#c9a84c" opacity="0.3"/>
            <circle cx="56" cy="28" r="0.8" fill="#c9a84c" opacity="0.3"/>
          </svg>
          <canvas id="bagCanvas" width="72" height="80"></canvas>
        </div>
        <h1 class="ranking-title">Ranking Gl<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width:0.85em;height:0.85em;vertical-align:-0.12em;display:inline-block;"><circle cx="50" cy="50" r="48" fill="none" stroke="#c9a84c" stroke-width="6"/><circle cx="50" cy="50" r="40" fill="none" stroke="#c9a84c" stroke-width="2" opacity="0.5"/><polygon points="50,18 78,34 78,36 22,36 22,34" fill="#c9a84c"/><rect x="28" y="36" width="8" height="28" fill="#c9a84c"/><rect x="42" y="36" width="8" height="28" fill="#c9a84c"/><rect x="56" y="36" width="8" height="28" fill="#c9a84c"/><rect x="70" y="36" width="8" height="28" fill="#c9a84c"/><rect x="20" y="64" width="60" height="6" fill="#c9a84c"/></svg>bal</h1>
        <div class="live-badge">
          <span class="live-dot"></span>
          Tiempo real · Cada 3s
        </div>
        <p class="subtitle-count">5 Templarios en Competencia</p>
      </div>
    </div>

    <div class="main-grid">
      <div class="podium-section">
        <div class="podium-label">× Elite ×</div>
        <div class="podium-stage">
          <div class="podium-player p2">
            <div class="player-info" id="info2">
              <div class="player-avatar">—</div>
              <div class="player-name">—</div>
              <div class="player-title">—</div>
              <div class="player-pts">— PTS</div>
            </div>
            <div class="podium-block" id="pod2">
              <div style="text-align:center">
                <span class="place-medal" aria-hidden="true">🥈</span>
                <div>2</div>
              </div>
            </div>
          </div>
          <div class="podium-player p1">
            <div class="player-info" id="info1">
              <div class="player-avatar">—</div>
              <div class="player-name">—</div>
              <div class="player-title">—</div>
              <div class="player-pts">— PTS</div>
            </div>
            <div class="podium-block" id="pod1">
              <div style="text-align:center">
                <span class="place-medal" aria-hidden="true">👑</span>
                <div>1</div>
              </div>
            </div>
          </div>
          <div class="podium-player p3">
            <div class="player-info" id="info3">
              <div class="player-avatar">—</div>
              <div class="player-name">—</div>
              <div class="player-title">—</div>
              <div class="player-pts">— PTS</div>
            </div>
            <div class="podium-block" id="pod3">
              <div style="text-align:center">
                <span class="place-medal" aria-hidden="true">🥉</span>
                <div>3</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="ranking-list">
          <div class="pc-rank-header">
            <span>🏆 Ranking Global</span>
            <span class="pc-rank-count">100 jugadores</span>
          </div>
          <div class="pc-rank-scroll" id="pcRankingScroll"></div>
          <div class="pc-rank-sep">· · ·</div>
          <div class="pc-rank-you">
            <span class="rank-num you-num">59</span>
            <div class="rank-avatar-sm you-avatar">TÚ</div>
            <div class="rank-info">
              <div class="rank-name" style="color:#e8b0ff;">Tu nombre</div>
              <div class="rank-subtitle" style="color:rgba(200,130,255,0.7);">Tu rango actual</div>
            </div>
            <span class="rank-pts" style="color:#d480ff;font-weight:700;">0 PTS</span>
            <div class="pc-you-badge">TU POSICIÓN</div>
          </div>
          <div id="golden-circle-bar-mount" data-propopass-trigger="true" style="margin-top:8px;"></div>
        </div>

      <div class="right-panel" style="margin-top:0;">
        <div class="elite-section">
          <div class="elite-header">× Elite ×</div>
          <div class="elite-row">
            <div class="elite-pos epos-1">👑</div>
            <div class="elite-char" style="width:68px;height:96px;overflow:hidden;flex-shrink:0;position:relative;background:transparent;border-radius:8px;"></div>
            <div class="elite-info">
              <div class="elite-name">—</div>
              <div class="elite-rank">—</div>
            </div>
            <div class="elite-pts">— PTS</div>
          </div>
          <div class="elite-row">
            <div class="elite-pos epos-2">🥈</div>
            <div class="elite-char" style="width:60px;height:72px;overflow:hidden;flex-shrink:0;position:relative;"></div>
            <div class="elite-info">
              <div class="elite-name">—</div>
              <div class="elite-rank">—</div>
            </div>
            <div class="elite-pts">— PTS</div>
          </div>
          <div class="elite-row">
            <div class="elite-pos epos-3">🥉</div>
            <div class="elite-char" style="width:60px;height:72px;overflow:hidden;flex-shrink:0;position:relative;"></div>
            <div class="elite-info">
              <div class="elite-name">—</div>
              <div class="elite-rank">—</div>
            </div>
            <div class="elite-pts">— PTS</div>
          </div>
          <div class="elite-note">Ranking global compartido.<br>Cada jugador que completa pruebas<br>aparece aquí en tiempo real.</div>
        </div>

        <div class="recompensas-panel">
          <div class="rec-header">
            <span class="rec-title">⚔ Recompensas</span>
            <span class="rec-timer" id="recTimer">7d 00:00:00</span>
          </div>
          <div class="rec-podium-row" id="recPrizesRow">
  <div class="rec-pos rpos-silver">
    <div class="rec-pos-badge">🥈</div>
    <div class="rec-pos-label">2° LUGAR</div>
    <div class="rec-prize-coins" id="rpc2"></div>
    <div class="rec-prize-exp" id="rpe2"></div>
  </div>
  <div class="rec-pos rpos-gold">
    <div class="rec-pos-badge">👑</div>
    <div class="rec-pos-label">1° LUGAR</div>
    <div class="rec-prize-coins" id="rpc1"></div>
    <div class="rec-prize-exp" id="rpe1"></div>
  </div>
  <div class="rec-pos rpos-bronze">
    <div class="rec-pos-badge">🥉</div>
    <div class="rec-pos-label">3° LUGAR</div>
    <div class="rec-prize-coins" id="rpc3"></div>
    <div class="rec-prize-exp" id="rpe3"></div>
  </div>
</div>
<div class="rec-consolacion" id="recConsolacion">
  <div class="rec-con-item" id="rcc4"><span>Top 4</span><span>—</span></div>
  <div class="rec-con-item" id="rcc5"><span>Top 5</span><span>—</span></div>
  <div class="rec-con-item" id="rcc6"><span>Top 6</span><span>—</span></div>
  <div class="rec-con-item" id="rcc7"><span>Top 7</span><span>—</span></div>
  <div class="rec-con-item" id="rcc8"><span>Top 8</span><span>—</span></div>
  <div class="rec-con-item" id="rcc9"><span>Top 9</span><span>—</span></div>
  <div class="rec-con-item" id="rcc10"><span>Top 10</span><span>—</span></div>
</div>
<div style="text-align:center;font-size:9px;letter-spacing:1.5px;color:rgba(201,168,76,0.35);padding:6px 0 10px;text-transform:uppercase;border-top:1px solid rgba(201,168,76,0.1);">⚔ Templo del Propósito ⚔</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:2mm;margin-top:4px;">
          <div style="line-height:0;font-size:0;padding:0;margin-top:-7mm;"><a href="URL_PROPOTIENDA_AQUI" style="display:block;"><img src="https://i.imgur.com/RCjzrrg.png" alt="Volver a Propotienda" style="width:100%;height:auto;display:block;border-radius:6px;animation:imgPulse 1.8s ease-in-out infinite;"></a></div>
        </div>
      </div>
    </div>

    <!-- LAYOUT MÓVIL PORTRAIT -->
    <div id="mobilePortraitLayout">
      <div id="mp-bag">
        <canvas id="bagCanvasMobile" width="72" height="80"></canvas>
      </div>
      <div id="mp-carousel" class="header-carousel-wrap">
        <div class="hcf-slide" data-idx="0"><img src="https://picsum.photos/seed/templo1/500/200" alt="Anuncio 1"></div>
        <div class="hcf-slide" data-idx="1"><img src="https://picsum.photos/seed/templo2/500/200" alt="Anuncio 2"></div>
        <div class="hcf-slide" data-idx="2"><img src="https://picsum.photos/seed/templo3/500/200" alt="Anuncio 3"></div>
        <div class="hcf-slide" data-idx="3"><img src="https://picsum.photos/seed/templo4/500/200" alt="Anuncio 4"></div>
        <div class="hcf-slide" data-idx="4"><img src="https://picsum.photos/seed/templo5/500/200" alt="Anuncio 5"></div>
      </div>
      <div id="mp-title">
        <h1 class="ranking-title">Ranking Gl<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width:0.85em;height:0.85em;vertical-align:-0.12em;display:inline-block;"><circle cx="50" cy="50" r="48" fill="none" stroke="#c9a84c" stroke-width="6"/><circle cx="50" cy="50" r="40" fill="none" stroke="#c9a84c" stroke-width="2" opacity="0.5"/><polygon points="50,18 78,34 78,36 22,36 22,34" fill="#c9a84c"/><rect x="28" y="36" width="8" height="28" fill="#c9a84c"/><rect x="42" y="36" width="8" height="28" fill="#c9a84c"/><rect x="56" y="36" width="8" height="28" fill="#c9a84c"/><rect x="70" y="36" width="8" height="28" fill="#c9a84c"/><rect x="20" y="64" width="60" height="6" fill="#c9a84c"/></svg>bal</h1>
        <div class="live-badge">
          <span class="live-dot"></span>
          Tiempo real · Cada 3s
        </div>
        <p class="subtitle-count" id="mpSubtitle">5 Templarios en Competencia</p>
      </div>
      <div id="mp-podium-label">× Elite ×</div>
      <div id="mp-podium">
        <div class="podium-stage">
          <div class="podium-player p2">
            <div class="player-info visible">
              <div class="player-avatar">—</div>
              <div class="player-name">—</div>
              <div class="player-title">—</div>
              <div class="player-pts">— PTS</div>
            </div>
            <div class="podium-block" id="mpod2">
              <div style="text-align:center"><span class="place-medal">🥈</span><div>2</div></div>
            </div>
          </div>
          <div class="podium-player p1">
            <div class="player-info visible">
              <div class="player-avatar">—</div>
              <div class="player-name">—</div>
              <div class="player-title">—</div>
              <div class="player-pts">— PTS</div>
            </div>
            <div class="podium-block" id="mpod1">
              <div style="text-align:center"><span class="place-medal">👑</span><div>1</div></div>
            </div>
          </div>
          <div class="podium-player p3">
            <div class="player-info visible">
              <div class="player-avatar">—</div>
              <div class="player-name">—</div>
              <div class="player-title">—</div>
              <div class="player-pts">— PTS</div>
            </div>
            <div class="podium-block" id="mpod3">
              <div style="text-align:center"><span class="place-medal">🥉</span><div>3</div></div>
            </div>
          </div>
        </div>
      </div>
      <div id="mp-ranking-wrap">
        <div id="mp-ranking-header">
          <span>🏆 Ranking Global</span>
          <span id="mp-ranking-count">100 jugadores</span>
        </div>
        <div id="mp-ranking-scroll"></div>
        <div id="mp-ranking-sep"><span>· · ·</span></div>
        <div id="mp-ranking-you">
          <span class="rank-num you-num">59</span>
          <div class="rank-avatar-sm you-avatar">TÚ</div>
          <div class="rank-info">
            <div class="rank-name">Tu nombre</div>
            <div class="rank-subtitle">Tu rango actual</div>
          </div>
          <span class="rank-pts">0 PTS</span>
          <div class="you-badge">TU POSICIÓN</div>
        </div>
      </div>
      <div id="mp-panels">
        <div class="elite-section">
          <div class="elite-header">× Elite ×</div>
          <div class="elite-row">
            <div class="elite-pos epos-1">👑</div>
            <div class="elite-char" style="width:48px;height:58px;overflow:hidden;flex-shrink:0;position:relative;"></div>
            <div class="elite-info"><div class="elite-name">—</div><div class="elite-rank">—</div></div>
            <div class="elite-pts">— PTS</div>
          </div>
          <div class="elite-row">
            <div class="elite-pos epos-2">🥈</div>
            <div class="elite-char" style="width:48px;height:58px;overflow:hidden;flex-shrink:0;position:relative;"></div>
            <div class="elite-info"><div class="elite-name">—</div><div class="elite-rank">—</div></div>
            <div class="elite-pts">— PTS</div>
          </div>
          <div class="elite-row">
            <div class="elite-pos epos-3">🥉</div>
            <div class="elite-char" style="width:48px;height:58px;overflow:hidden;flex-shrink:0;position:relative;"></div>
            <div class="elite-info"><div class="elite-name">—</div><div class="elite-rank">—</div></div>
            <div class="elite-pts">— PTS</div>
          </div>
          <div class="elite-note">Ranking global compartido.<br>Cada jugador que completa pruebas<br>aparece aquí en tiempo real.</div>
        </div>
        <div class="recompensas-panel">
          <div class="rec-header"><span class="rec-title">⚔ Recompensas</span><span class="rec-timer" id="recTimerMobile">7d 00:00:00</span></div>
          <div class="rec-podium-row" id="recPrizesRowMobile">
  <div class="rec-pos rpos-silver">
    <div class="rec-pos-badge">🥈</div>
    <div class="rec-pos-label">2° LUGAR</div>
    <div class="rec-prize-coins" id="rpc2m"></div>
    <div class="rec-prize-exp" id="rpe2m"></div>
  </div>
  <div class="rec-pos rpos-gold">
    <div class="rec-pos-badge">👑</div>
    <div class="rec-pos-label">1° LUGAR</div>
    <div class="rec-prize-coins" id="rpc1m"></div>
    <div class="rec-prize-exp" id="rpe1m"></div>
  </div>
  <div class="rec-pos rpos-bronze">
    <div class="rec-pos-badge">🥉</div>
    <div class="rec-pos-label">3° LUGAR</div>
    <div class="rec-prize-coins" id="rpc3m"></div>
    <div class="rec-prize-exp" id="rpe3m"></div>
  </div>
</div>
<div class="rec-consolacion" id="recConsolacionMobile">
  <div class="rec-con-item" id="rcc4m"><span>Top 4</span><span>—</span></div>
  <div class="rec-con-item" id="rcc5m"><span>Top 5</span><span>—</span></div>
  <div class="rec-con-item" id="rcc6m"><span>Top 6</span><span>—</span></div>
  <div class="rec-con-item" id="rcc7m"><span>Top 7</span><span>—</span></div>
  <div class="rec-con-item" id="rcc8m"><span>Top 8</span><span>—</span></div>
  <div class="rec-con-item" id="rcc9m"><span>Top 9</span><span>—</span></div>
  <div class="rec-con-item" id="rcc10m"><span>Top 10</span><span>—</span></div>
</div>
<div style="text-align:center;font-size:9px;letter-spacing:1.5px;color:rgba(201,168,76,0.35);padding:6px 0 10px;text-transform:uppercase;border-top:1px solid rgba(201,168,76,0.1);">⚔ Templo del Propósito ⚔</div>
        </div>
      </div>
      <div id="golden-circle-bar-mount-mobile" data-propopass-trigger="true" style="grid-column:1/-1;width:100%;margin:0;padding:0;"></div>
      <div id="mp-btns" style="margin-top:8px;">
        <div style="margin-top:calc(10mm - 1.2cm);"><a href="URL_PROPOTIENDA_AQUI"><img src="https://i.imgur.com/RCjzrrg.png" alt="Volver a Propotienda"></a></div>
      </div>
    </div>
  </div>
`;

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
const VIP_LEVELS = [
  { level:1, name:'INICIADO DORADO',     xpRequired:0,    coins:40,  xpBonus:0,   icon:'🟢', color:'#4ade80', description:'Distintivo dorado · Resplandor en perfil' },
  { level:2, name:'RECLUTA DORADO',      xpRequired:250,  coins:20,  xpBonus:20,  icon:'🔵', color:'#38bdf8', description:'Nombre ligeramente brillante' },
  { level:3, name:'FORJADOR DORADO',     xpRequired:500,  coins:40,  xpBonus:40,  icon:'🟣', color:'#a855f7', description:'Marco especial de perfil' },
  { level:4, name:'CONQUISTADOR DORADO', xpRequired:800,  coins:60,  xpBonus:60,  icon:'🟨', color:'#f59e0b', description:'Aura dorada · Ícono exclusivo' },
  { level:5, name:'DOMINANTE DORADO',    xpRequired:1100, coins:80,  xpBonus:80,  icon:'🟥', color:'#ef4444', description:'Nombre dorado animado · Efecto premium' },
  { level:6, name:'CÍRCULO DORADO ABSOLUTO', xpRequired:1400, coins:250, xpBonus:180, icon:'👑', color:'#d4af37', description:'Marco legendario · Distintivo mensual · Herramienta Superior' },
];

const STRIPE_1MES = 'https://buy.stripe.com/5kQ3cv9pJc0ad4ydGMenS0n';
const STRIPE_3MESES = 'https://buy.stripe.com/9B614natN0hs0hM0U0enS0o';

function PropoPassModal({ onClose }) {
  const [hovUno, setHovUno] = React.useState(false);
  const [hovTres, setHovTres] = React.useState(false);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(1,5,18,0.9)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'propoOverlayIn 0.25s ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '430px',
          borderRadius: '22px',
          background: 'linear-gradient(160deg, #04091f 0%, #070d28 45%, #030814 100%)',
          border: '1.5px solid rgba(201,168,76,0.65)',
          boxShadow: '0 0 0 1px rgba(201,168,76,0.08), 0 0 80px rgba(201,168,76,0.18), 0 0 160px rgba(0,180,200,0.08)',
          animation: 'propoModalIn 0.38s cubic-bezier(0.34,1.3,0.64,1) both',
          overflow: 'hidden',
          fontFamily: "'Cinzel', Georgia, serif",
        }}
      >

        {/* Rayo solar de fondo */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            height: '55%',
            background: 'radial-gradient(ellipse at top, rgba(255,210,60,0.26) 0%, rgba(0,200,220,0.1) 38%, transparent 72%)',
            animation: 'propoSunRay 3.2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Destellos de esquinas */}
        {['top:0;left:0', 'top:0;right:0', 'bottom:0;left:0', 'bottom:0;right:0'].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...Object.fromEntries(pos.split(';').map(p => p.split(':'))),
              width: 40,
              height: 40,
              background: `radial-gradient(ellipse at ${i < 2 ? 'top' : 'bottom'} ${i % 2 === 0 ? 'left' : 'right'}, rgba(201,168,76,0.25) 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 10,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.35)',
            color: 'rgba(201,168,76,0.7)',
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(201,168,76,0.28)';
            e.currentTarget.style.color = '#ffe87a';
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.8)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(201,168,76,0.1)';
            e.currentTarget.style.color = 'rgba(201,168,76,0.7)';
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)';
          }}
        >✕</button>

        {/* Cuerpo del modal */}
        <div style={{ padding: '36px 26px 30px', position: 'relative', zIndex: 1 }}>

          {/* Corona + título */}
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{
              fontSize: 48,
              display: 'inline-block',
              animation: 'propoCrownFloat 2.8s ease-in-out infinite',
              marginBottom: 10,
            }}>
              👑
            </div>
            <div style={{
              fontSize: 9,
              letterSpacing: '5px',
              color: 'rgba(201,168,76,0.5)',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              PASE DE ÉLITE DEL TEMPLO
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: '4px',
              textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #f0c040 0%, #c9a84c 35%, #ffe87a 55%, #c9a84c 80%, #f0c040 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'propoRune 3s linear infinite',
              marginBottom: 8,
            }}>
              PROPO-PASS
            </div>
            <div style={{
              fontSize: 11,
              letterSpacing: '2px',
              color: 'rgba(0,210,230,0.7)',
              textTransform: 'uppercase',
            }}>
              ⚔ Desbloquea tu poder VIP ⚔
            </div>
          </div>

          {/* Beneficios en 3 columnas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 24,
          }}>
            {[
              { icon: '⚡', titulo: '+10% XP', sub: 'En todo el ranking' },
              { icon: '🪙', titulo: '+COINS', sub: 'Recompensas extra' },
              { icon: '💎', titulo: 'EFECTO VIP', sub: 'Brillo exclusivo' },
            ].map((b, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 8px',
                  borderRadius: 12,
                  background: 'rgba(201,168,76,0.06)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 5, filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.7))' }}>{b.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 900, color: '#c9a84c', letterSpacing: '1px', marginBottom: 2 }}>{b.titulo}</div>
                <div style={{ fontSize: 9, color: 'rgba(200,185,240,0.45)', letterSpacing: '0.3px' }}>{b.sub}</div>
              </div>
            ))}
          </div>

          {/* Separador */}
          <div style={{
            textAlign: 'center',
            fontSize: 9,
            letterSpacing: '4px',
            color: 'rgba(201,168,76,0.35)',
            marginBottom: 16,
            textTransform: 'uppercase',
          }}>
            ── Elige tu plan ──
          </div>

          {/* Opciones de precio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>

            {/* Opción 1 mes */}
            <button
              onMouseEnter={() => setHovUno(true)}
              onMouseLeave={() => setHovUno(false)}
              onClick={() => window.open(STRIPE_1MES, '_blank')}
              style={{
                position: 'relative',
                width: '100%',
                padding: '16px 20px',
                borderRadius: 14,
                background: hovUno
                  ? 'linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(0,200,220,0.12) 100%)'
                  : 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(0,180,200,0.06) 100%)',
                border: '1.5px solid',
                borderColor: hovUno ? 'rgba(255,230,80,0.9)' : 'rgba(201,168,76,0.45)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                transition: 'all 0.25s ease',
                animation: 'propoLockPulse 2.5s ease-in-out infinite',
                overflow: 'hidden',
                fontFamily: "'Cinzel', Georgia, serif",
              }}
            >
              {/* Shimmer */}
              <div style={{
                position: 'absolute',
                top: 0,
                width: '35%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                animation: 'propoBtnShimmer 2s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '2px',
                  color: '#ffe87a',
                  textTransform: 'uppercase',
                  marginBottom: 3,
                }}>
                  1 MES
                </div>
                <div style={{
                  fontSize: 9,
                  letterSpacing: '1.5px',
                  color: 'rgba(201,168,76,0.55)',
                  textTransform: 'uppercase',
                }}>
                  Acceso completo · 30 días
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#ffe87a',
                  letterSpacing: '1px',
                  textShadow: '0 0 20px rgba(255,220,60,0.8)',
                  lineHeight: 1,
                }}>
                  $9.99
                </div>
                <div style={{
                  fontSize: 8,
                  letterSpacing: '2px',
                  color: 'rgba(201,168,76,0.5)',
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}>
                  USD
                </div>
              </div>
            </button>

            {/* Opción 3 meses */}
            <button
              onMouseEnter={() => setHovTres(true)}
              onMouseLeave={() => setHovTres(false)}
              onClick={() => window.open(STRIPE_3MESES, '_blank')}
              style={{
                position: 'relative',
                width: '100%',
                padding: '16px 20px',
                borderRadius: 14,
                background: hovTres
                  ? 'linear-gradient(135deg, rgba(0,200,220,0.18) 0%, rgba(0,150,200,0.14) 100%)'
                  : 'linear-gradient(135deg, rgba(0,180,200,0.08) 0%, rgba(0,140,180,0.06) 100%)',
                border: '1.5px solid',
                borderColor: hovTres ? 'rgba(0,230,250,0.9)' : 'rgba(0,200,220,0.45)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                transition: 'all 0.25s ease',
                animation: 'propoAquaGlow 2.5s ease-in-out infinite',
                overflow: 'hidden',
                fontFamily: "'Cinzel', Georgia, serif",
              }}
            >
              {/* Badge MEJOR VALOR */}
              <div style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'linear-gradient(135deg, #00c8dc, #0090b0)',
                color: '#001a26',
                fontSize: 7,
                fontWeight: 900,
                letterSpacing: '1.5px',
                padding: '2px 8px',
                borderRadius: 20,
                textTransform: 'uppercase',
                zIndex: 2,
                boxShadow: '0 0 10px rgba(0,200,220,0.6)',
              }}>
                ✦ MEJOR VALOR
              </div>
              {/* Shimmer */}
              <div style={{
                position: 'absolute',
                top: 0,
                width: '35%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(0,230,250,0.12), transparent)',
                animation: 'propoBtnShimmer 2.4s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '2px',
                  color: '#4fc3f7',
                  textTransform: 'uppercase',
                  marginBottom: 3,
                }}>
                  3 MESES
                </div>
                <div style={{
                  fontSize: 9,
                  letterSpacing: '1.5px',
                  color: 'rgba(79,195,247,0.55)',
                  textTransform: 'uppercase',
                }}>
                  Acceso completo · 90 días
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#4fc3f7',
                  letterSpacing: '1px',
                  textShadow: '0 0 20px rgba(0,200,220,0.8)',
                  lineHeight: 1,
                }}>
                  $21.90
                </div>
                <div style={{
                  fontSize: 8,
                  letterSpacing: '2px',
                  color: 'rgba(79,195,247,0.5)',
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}>
                  USD · $7.30/mes
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: 'center',
            fontSize: 8,
            letterSpacing: '2px',
            color: 'rgba(201,168,76,0.3)',
            textTransform: 'uppercase',
            lineHeight: 1.7,
          }}>
            ⚔ Templo del Propósito · Cancela cuando quieras ⚔
          </div>
        </div>
      </div>
    </div>
  );
}

function TooltipPortal({ children }) {
  const [el] = React.useState(() => document.createElement('div'));
  React.useEffect(() => {
    el.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;overflow:visible;z-index:999999;pointer-events:none;';
    document.body.appendChild(el);
    return () => document.body.removeChild(el);
  }, []);
  return window.__ReactDOM__.createPortal(children, el);
}

function GoldenCircleBar({ userXP, isVip, onBuyVip }) {
  const [hovNode, setHovNode] = React.useState(null);
  const [hovPos, setHovPos] = React.useState({ x: 0, y: 0 });
  const [buyHov, setBuyHov] = React.useState(false);
  const [barPct, setBarPct] = React.useState(0);

  const currentVipLevel = isVip ? VIP_LEVELS.filter(v => userXP >= v.xpRequired).length : 0;
  const nextLevel = VIP_LEVELS[currentVipLevel] || null;
  const prevXP = currentVipLevel > 0 ? VIP_LEVELS[currentVipLevel - 1]?.xpRequired || 0 : 0;
  const maxXP = nextLevel ? nextLevel.xpRequired : VIP_LEVELS[VIP_LEVELS.length-1].xpRequired;
  const segXP = maxXP - prevXP;
  const curXP = userXP - prevXP;
  const completedPct = ((currentVipLevel - 1) / 5) * 100;
  const segmentPct = currentVipLevel >= 6 ? 100 : (Math.min(curXP / segXP, 1) / 5) * 100;
  const rawPct = currentVipLevel >= 6 ? 100 : Math.min(completedPct + segmentPct, 100);

  React.useEffect(() => {
    const t = setTimeout(() => setBarPct(rawPct), 400);
    return () => clearTimeout(t);
  }, [rawPct]);

  if (!isVip) {
    return (
      <div style={{position:'relative',borderRadius:'20px',overflow:'hidden',background:'linear-gradient(145deg,rgba(212,175,55,0.06) 0%,rgba(8,3,26,0.98) 100%)',border:'1.5px solid rgba(212,175,55,0.35)',padding:'clamp(18px,3vw,28px)',boxShadow:'0 0 0 1px rgba(212,175,55,0.08), 0 20px 60px rgba(212,175,55,0.08)',marginBottom:'8px'}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,transparent 0%,rgba(212,175,55,0.04) 45%,rgba(255,255,255,0.04) 50%,rgba(212,175,55,0.04) 55%,transparent 100%)',backgroundSize:'200% 200%',animation:'vipShimmer 3s ease-in-out infinite',pointerEvents:'none'}}/>
        <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'20px'}}>
          <div style={{fontSize:'28px',animation:'vipCrownFloat 2.5s ease-in-out infinite',filter:'drop-shadow(0 0 14px rgba(212,175,55,0.9))'}}>👑</div>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:'7px',letterSpacing:'4px',color:'rgba(212,175,55,0.5)',marginBottom:'3px'}}>PASE DE ÉLITE MENSUAL</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(14px,2.5vw,18px)',fontWeight:'900',background:'linear-gradient(135deg,#f0c040 0%,#d4af37 40%,#fde68a 60%,#d4af37 100%)',backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',animation:'vipShimmer 3s linear infinite'}}>CÍRCULO DORADO</div>
          </div>
          <div style={{marginLeft:'auto',textAlign:'right'}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:'9px',color:'rgba(200,185,240,0.35)',textDecoration:'line-through',marginBottom:'2px'}}>ANTES $29</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(16px,3vw,22px)',fontWeight:'900',color:'#d4af37',textShadow:'0 0 20px rgba(212,175,55,0.8)'}}>$9.99</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:'7px',letterSpacing:'2px',color:'rgba(212,175,55,0.55)'}}>USD / MES</div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'20px'}}>
          {[{icon:'⚡',label:'MÁS XP',sub:'En cada nivel'},{icon:'🪙',label:'MÁS COINS',sub:'Recompensas extra'},{icon:'✨',label:'ESTATUS VIP',sub:'Efectos exclusivos'}].map((f,i)=>(
            <div key={i} style={{padding:'10px 8px',borderRadius:'12px',background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.18)',textAlign:'center'}}>
              <div style={{fontSize:'18px',marginBottom:'4px',filter:'drop-shadow(0 0 8px rgba(212,175,55,0.6))'}}>{f.icon}</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:'8px',fontWeight:'900',color:'#d4af37',letterSpacing:'1px'}}>{f.label}</div>
              <div style={{fontFamily:"'Raleway',sans-serif",fontSize:'9px',color:'rgba(200,185,240,0.45)',marginTop:'2px'}}>{f.sub}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:'16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px',gap:'4px'}}>
            {VIP_LEVELS.map((v,i)=>(
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',opacity:0.35}}>
                <div style={{width:'clamp(24px,4vw,36px)',height:'clamp(24px,4vw,36px)',borderRadius:'50%',background:'rgba(212,175,55,0.08)',border:'1px solid rgba(212,175,55,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'clamp(11px,2vw,14px)',filter:'grayscale(1)'}}>🔒</div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:'7px',color:'rgba(212,175,55,0.35)',letterSpacing:'0.5px'}}>{v.level}</div>
              </div>
            ))}
          </div>
          <div style={{position:'relative',height:'8px',borderRadius:'8px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(212,175,55,0.18)',overflow:'hidden',marginBottom:'10px'}}>
            <div style={{height:'100%',width:'0%',background:'linear-gradient(90deg,#4c1d95,#7c3aed,#d4af37)',borderRadius:'8px'}}/>
          </div>
        </div>
        <button
          onClick={() => { if (onBuyVip) onBuyVip(); }}
          onMouseEnter={()=>setBuyHov(true)}
          onMouseLeave={()=>setBuyHov(false)}
          style={{position:'relative',width:'100%',padding:'clamp(13px,2.5vw,17px) 0',background:'linear-gradient(135deg,#4c1d95 0%,#7c3aed 30%,#d4af37 60%,#fde68a 75%,#d4af37 100%)',backgroundSize:'200% auto',border:'none',borderRadius:'100px',color:'#0c0a2a',fontFamily:"'Cinzel',serif",fontWeight:'900',fontSize:'clamp(9px,1.5vw,11px)',letterSpacing:'3px',cursor:'pointer',overflow:'hidden',animation:'vipBuyPulse 2s ease-in-out infinite',transform:buyHov?'scale(1.03)':'scale(1)',transition:'transform .3s ease'}}
        >
          <div style={{position:'absolute',top:0,width:'40%',height:'100%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)',animation:'vipBuyShimmer 1.8s ease-in-out infinite'}}/>
          <span style={{position:'relative',zIndex:1}}>👑 UNIRME AL CÍRCULO DORADO 👑</span>
        </button>
        <div style={{textAlign:'center',marginTop:'8px',fontFamily:"'Cinzel',serif",fontSize:'7.5px',letterSpacing:'2px',color:'rgba(212,175,55,0.4)'}}>OFERTA EXCLUSIVA DEL TEMPLO · CANCELA CUANDO QUIERAS</div>
      </div>
    );
  }

  const isMobilePortrait = typeof window !== 'undefined' && window.innerWidth <= 767 && window.innerHeight > window.innerWidth;
  return (
    <div style={{position:'relative',borderRadius: isMobilePortrait ? '0' : '14px',overflow:'visible',background:'linear-gradient(145deg,rgba(212,175,55,0.12) 0%,rgba(139,92,246,0.08) 50%,rgba(8,3,26,0.98) 100%)',border:'1.5px solid rgba(212,175,55,0.55)',padding: isMobilePortrait ? '12px 16px 10px' : '10px 14px 8px',boxShadow:'0 0 0 1px rgba(212,175,55,0.1), 0 0 30px rgba(212,175,55,0.1)',marginBottom:'4px',animation:'vipGoldPulse 3s ease-in-out infinite',width: isMobilePortrait ? '100%' : undefined, boxSizing: isMobilePortrait ? 'border-box' : undefined}}>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,transparent 0%,rgba(212,175,55,0.06) 45%,rgba(255,255,255,0.06) 50%,rgba(212,175,55,0.06) 55%,transparent 100%)',backgroundSize:'200% 200%',animation:'vipShimmer 2.5s ease-in-out infinite',pointerEvents:'none'}}/>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{fontSize:'22px',animation:'vipCrownFloat 2s ease-in-out infinite',filter:'drop-shadow(0 0 12px rgba(212,175,55,1))'}}>👑</div>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:'7px',letterSpacing:'4px',color:'rgba(212,175,55,0.55)',marginBottom:'2px'}}>PASE ACTIVO</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(12px,2vw,15px)',fontWeight:'900',background:'linear-gradient(135deg,#f0c040,#d4af37,#fde68a,#d4af37)',backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',animation:'vipShimmer 2.5s linear infinite'}}>CÍRCULO DORADO</div>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:'7px',letterSpacing:'2px',color:'rgba(212,175,55,0.5)',marginBottom:'2px'}}>NIVEL VIP</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(18px,3vw,24px)',fontWeight:'900',color:'#d4af37',textShadow:'0 0 24px rgba(212,175,55,1)',lineHeight:1}}>{currentVipLevel}</div>
        </div>
      </div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:'clamp(9px,1.5vw,11px)',fontWeight:'900',color:VIP_LEVELS[(currentVipLevel-1)||0]?.color||'#4ade80',letterSpacing:'2px',marginBottom:'6px',textShadow:`0 0 16px ${VIP_LEVELS[(currentVipLevel-1)||0]?.color||'#4ade80'}`}}>
        {VIP_LEVELS[(currentVipLevel-1)||0]?.name || 'INICIADO DORADO'}
      </div>
      <div style={{position:'relative',marginBottom:'6px',overflow:'visible'}}>
        <div style={{position:'relative',height:'8px',borderRadius:'8px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(212,175,55,0.18)',overflow:'hidden',marginBottom:'10px'}}>
          <div style={{position:'absolute',top:0,left:0,height:'100%',borderRadius:'8px',width:`${barPct}%`,background:'linear-gradient(90deg,#4c1d95,#7c3aed 25%,#a855f7 50%,#d4af37 75%,#fde68a 90%,#d4af37 100%)',backgroundSize:'200% auto',animation:'vipShimmer 2s linear infinite',boxShadow:'0 0 14px rgba(212,175,55,0.7), 0 0 28px rgba(139,92,246,0.4)',transition:'width 1.2s cubic-bezier(0.34,1.2,0.64,1)'}}>
            <div style={{position:'absolute',right:'-2px',top:'-4px',bottom:'-4px',width:'14px',background:'radial-gradient(ellipse,rgba(255,255,255,0.95) 0%,transparent 70%)',borderRadius:'50%'}}/>
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginTop:'4px',paddingBottom:'8px',overflow:'visible',position:'relative',zIndex:99999,paddingLeft:'4px',paddingRight:'4px'}}>
          {VIP_LEVELS.map((v,i)=>{
            const unlocked = userXP >= v.xpRequired;
            const isCurrent = currentVipLevel === v.level;
            const isHov = hovNode === i;
            return (
              <div
                key={i}
                onMouseEnter={()=>{ if(window.__hovTimer__) clearTimeout(window.__hovTimer__); setHovNode(i); }}
                onMouseLeave={()=>{ window.__hovTimer__ = setTimeout(()=>setHovNode(null), 150); }}
                onClick={()=>{ if(window.__hovTimer__) clearTimeout(window.__hovTimer__); setHovNode(hovNode===i ? null : i); }}
                style={{position:'relative',flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'5px',cursor:'pointer',animation:`vipNodePop .5s cubic-bezier(0.34,1.56,0.64,1) ${i*.07}s both`,zIndex:isHov?99999:2,overflow:'visible'}}
              >
                <div style={{position:'relative',width:`clamp(${isCurrent?'44px':'36px'},${isCurrent?'7vw':'5.5vw'},${isCurrent?'52px':'44px'})`,height:`clamp(${isCurrent?'44px':'36px'},${isCurrent?'7vw':'5.5vw'},${isCurrent?'52px':'44px'})`,borderRadius:'50%',background:unlocked?`radial-gradient(ellipse at 30% 25%, ${v.color}66 0%, ${v.color}22 50%, transparent 100%)`:'rgba(255,255,255,0.03)',border:`2px solid ${isCurrent?'#fff':unlocked?v.color:'rgba(212,175,55,0.15)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:isCurrent?'22px':'16px',boxShadow:isCurrent?`0 0 30px ${v.color}, 0 0 60px ${v.color}66, 0 0 0 4px rgba(255,255,255,0.12)`:unlocked?`0 0 16px ${v.color}88`:'none',filter:unlocked?'none':'grayscale(0.8) brightness(0.4)',transition:'all .3s ease',animation:isCurrent?'vipGoldPulse 2s ease-in-out infinite':'none'}}>
                  {unlocked ? v.icon : '🔒'}
                  {unlocked && !isCurrent && (
                    <div style={{position:'absolute',top:'-4px',right:'-4px',width:'16px',height:'16px',borderRadius:'50%',background:'linear-gradient(135deg,#22c55e,#16a34a)',border:'2px solid rgba(8,3,26,1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',color:'#fff',fontWeight:900}}>✓</div>
                  )}
                  {isCurrent && (
                    <div style={{position:'absolute',inset:'-8px',borderRadius:'50%',border:`2px solid ${v.color}`,opacity:0.4,animation:'vipUnlockBurst 2s ease-out infinite'}}/>
                  )}
                </div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:'8px',fontWeight:'900',color:unlocked?v.color:'rgba(212,175,55,0.2)',letterSpacing:'0.5px',textShadow:unlocked?`0 0 10px ${v.color}88`:'none'}}>{v.level}</div>
                {isHov && (
                  <div onMouseEnter={()=>{ if(window.__hovTimer__) clearTimeout(window.__hovTimer__); }} onMouseLeave={()=>{ window.__hovTimer__ = setTimeout(()=>setHovNode(null), 150); }} style={{position:'absolute',bottom:'calc(100% + 8px)',left: i<=1 ? '0' : i>=4 ? 'auto' : '50%', right: i>=4 ? '0' : 'auto', transform: i<=1 ? 'none' : i>=4 ? 'none' : 'translateX(-50%)',width:'200px',background:'#0d0920',border:`1.5px solid ${v.color}`,borderRadius:'10px',padding:'14px 16px',zIndex:999999,boxShadow:`0 12px 40px rgba(0,0,0,0.95), 0 0 0 1px rgba(0,0,0,0.8)`,animation:'rewardPop .18s cubic-bezier(0.34,1.4,0.64,1)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px',paddingBottom:'10px',borderBottom:`1px solid ${v.color}44`}}>
                      <div style={{fontSize:'22px',lineHeight:1,flexShrink:0}}>{v.icon}</div>
                      <div style={{fontFamily:"'Cinzel',serif",fontSize:'11px',fontWeight:'900',color:v.color,letterSpacing:'1px',lineHeight:1.2}}>{v.name}</div>
                    </div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:'10px',color:'rgba(220,210,255,0.85)',lineHeight:1.55,marginBottom:'10px'}}>{v.description}</div>
                    {unlocked
                      ? <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}}>
                          <div style={{width:'14px',height:'14px',borderRadius:'50%',background:'#16a34a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',color:'#fff',flexShrink:0}}>✓</div>
                          <span style={{fontFamily:"'Cinzel',serif",fontSize:'9px',letterSpacing:'1.5px',color:'#4ade80',fontWeight:'700'}}>DESBLOQUEADO</span>
                        </div>
                      : <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'8px'}}>
                          <div style={{fontSize:'12px'}}>🔒</div>
                          <span style={{fontFamily:"'Cinzel',serif",fontSize:'9px',letterSpacing:'1px',color:'rgba(212,175,55,0.7)',fontWeight:'700'}}>{v.xpRequired} XP REQUERIDO</span>
                        </div>
                    }
                    {unlocked && (
                      <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                        {v.xpBonus>0&&<div style={{padding:'4px 10px',borderRadius:'6px',background:`${v.color}18`,border:`1px solid ${v.color}66`,fontFamily:"'Cinzel',serif",fontSize:'10px',fontWeight:'700',color:v.color}}>+{v.xpBonus} XP</div>}
                        <div style={{padding:'4px 10px',borderRadius:'6px',background:'rgba(212,175,55,0.12)',border:'1px solid rgba(212,175,55,0.5)',fontFamily:"'Cinzel',serif",fontSize:'10px',fontWeight:'700',color:'#d4af37'}}>🪙 +{v.coins}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {currentVipLevel < 6 && nextLevel && (
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',borderRadius:'10px',background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.15)'}}>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:'8px',color:'rgba(212,175,55,0.55)',letterSpacing:'1.5px'}}>PRÓXIMO</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:'9px',fontWeight:'900',color:nextLevel.color,letterSpacing:'1px'}}>{nextLevel.name}</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:'8px',color:'rgba(200,185,240,0.45)'}}>{nextLevel.xpRequired - userXP} XP</div>
        </div>
      )}
      {currentVipLevel >= 6 && (
        <div style={{textAlign:'center',padding:'8px',fontFamily:"'Cinzel',serif",fontSize:'9px',letterSpacing:'3px',background:'linear-gradient(135deg,rgba(212,175,55,0.15),rgba(139,92,246,0.1))',borderRadius:'10px',border:'1px solid rgba(212,175,55,0.4)',color:'#fde68a',textShadow:'0 0 16px rgba(212,175,55,0.8)'}}>
          ✦ ÉLITE ABSOLUTA DEL TEMPLO ✦
        </div>
      )}
    </div>
  );
}

export default function RankingPropocoins() {
  const navigate = useNavigate();
  const [showPropoPassModal, setShowPropoPassModal] = React.useState(false);



  useEffect(() => {
    if (document.getElementById('__ranking-propocoins-styles__')) return;
    // ── Inject global styles ──
    const styleEl = document.createElement('style');
    styleEl.id = '__ranking-propocoins-styles__';
    styleEl.textContent = CSS;
    document.head.insertBefore(styleEl, document.head.firstChild);

    // ── Viewport meta ──
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    const isPortraitMobile = window.innerWidth <= 767 && window.innerHeight > window.innerWidth;
    viewportMeta.content = isPortraitMobile
      ? 'width=device-width, initial-scale=1.0'
      : 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

    // ── En portrait: forzar scroll en body y html ──
    function enforcePortraitScroll() {
      const isP = window.innerWidth <= 767 && window.innerHeight > window.innerWidth;
      if (isP) {
        document.documentElement.style.overflow = 'auto';
        document.documentElement.style.height = 'auto';
        document.body.style.overflow = 'auto';
        document.body.style.height = 'auto';
        document.body.style.position = 'relative';
      } else {
        document.documentElement.style.overflow = '';
        document.documentElement.style.height = '';
        document.body.style.overflow = '';
        document.body.style.height = '';
      }
    }
    enforcePortraitScroll();
    window.addEventListener('resize', enforcePortraitScroll);
    window.addEventListener('orientationchange', () => setTimeout(enforcePortraitScroll, 300));

        // ── Cargar banners desde Supabase ──
setTimeout(async () => {
  const { data: banners, error } = await supabase
    .from('ranking_banners')
    .select('*')
    .eq('activo', true)
    .order('orden');
 
  console.log('BANNERS:', banners, 'ERROR:', error);
if (!banners?.length) return;
 
  ['hcfWrap', 'mp-carousel'].forEach(wrapId => {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    const slides = wrap.querySelectorAll('.hcf-slide');
    slides.forEach((slide, i) => {
      const b = banners[i % banners.length];
      const img = slide.querySelector('img');
      if (img) {
        img.src = b.imagen_url;
        img.style.objectPosition = b.object_position || '50% 50%';
      }
      slide.style.cursor = 'default';
slide.onclick = null;
if (b.link_url && b.link_url !== '#') {
  let btn = slide.querySelector('.banner-cta');
  if (!btn) {
    btn = document.createElement('button');
    btn.className = 'banner-cta';
    btn.textContent = '→ Ver más';
    slide.appendChild(btn);
  }
  btn.onclick = (e) => { e.stopPropagation(); window.open(b.link_url, '_blank'); };
} else {
  const btn = slide.querySelector('.banner-cta');
  if (btn) btn.remove();
}
    });
  });
}, 100);
 

const starsContainer = document.getElementById('starsContainer');
    if (!starsContainer) return;

    // ── PropoCoin SVG helper ──
    function makeCoinSVG(size) {
      const s = size;
      const r = s / 2;
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 0 ${Math.round(s*0.18)}px rgba(255,200,40,0.85))">
        <defs>
          <radialGradient id="cg${s}" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stop-color="#ffe87a"/>
            <stop offset="45%" stop-color="#c9a030"/>
            <stop offset="100%" stop-color="#7a5000"/>
          </radialGradient>
          <radialGradient id="eg${s}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(255,240,100,0.0)"/>
            <stop offset="75%" stop-color="rgba(201,160,40,0.0)"/>
            <stop offset="100%" stop-color="rgba(180,120,10,0.55)"/>
          </radialGradient>
        </defs>
        <circle cx="${r}" cy="${r}" r="${r}" fill="#7a5000"/>
        <circle cx="${r}" cy="${r}" r="${r*0.88}" fill="url(#cg${s})"/>
        <circle cx="${r}" cy="${r}" r="${r*0.88}" fill="url(#eg${s})"/>
        <circle cx="${r}" cy="${r}" r="${r*0.72}" fill="none" stroke="rgba(255,220,60,0.45)" stroke-width="${r*0.07}"/>
        <g transform="translate(${r*0.28},${r*0.25}) scale(${s/100})">
          <polygon points="22,18 50,4 78,18" fill="rgba(120,70,0,0.55)" stroke="rgba(255,200,50,0.6)" stroke-width="1.2"/>
          <rect x="18" y="18" width="64" height="5" rx="1" fill="rgba(100,60,0,0.5)" stroke="rgba(255,200,50,0.5)" stroke-width="1"/>
          <rect x="22" y="23" width="7" height="22" rx="1.5" fill="rgba(100,60,0,0.5)" stroke="rgba(255,200,50,0.45)" stroke-width="1"/>
          <rect x="34" y="23" width="7" height="22" rx="1.5" fill="rgba(100,60,0,0.5)" stroke="rgba(255,200,50,0.45)" stroke-width="1"/>
          <rect x="46" y="23" width="7" height="22" rx="1.5" fill="rgba(100,60,0,0.5)" stroke="rgba(255,200,50,0.45)" stroke-width="1"/>
          <rect x="58" y="23" width="7" height="22" rx="1.5" fill="rgba(100,60,0,0.5)" stroke="rgba(255,200,50,0.45)" stroke-width="1"/>
          <rect x="16" y="45" width="68" height="5" rx="1" fill="rgba(100,60,0,0.5)" stroke="rgba(255,200,50,0.45)" stroke-width="1"/>
        </g>
        <ellipse cx="${r*0.58}" cy="${r*0.36}" rx="${r*0.22}" ry="${r*0.1}" fill="rgba(255,255,220,0.38)" transform="rotate(-28,${r*0.58},${r*0.36})"/>
      </svg>`;
    }

    // ── Falling coins background ──
    const isMobileLow = window.innerWidth <= 767;
    const COIN_COUNT = isMobileLow ? 2 : 3;
    for (let i = 0; i < COIN_COUNT; i++) {
      const wrap = document.createElement('div');
      wrap.className = 'propocoin';
      const size = isMobileLow ? 12 : Math.round(12 + Math.random() * 10);
      const left = isMobileLow ? (i === 0 ? 20 : 70) : 8 + (i / COIN_COUNT) * 84;
      const duration = isMobileLow ? 22 + i * 11 : 14 + Math.random() * 12;
      const spinDur  = isMobileLow ? 14 : 6 + Math.random() * 6;
      const delay    = isMobileLow ? -(i * 11) : -(Math.random() * duration);
      wrap.style.cssText = `left:${left}%;animation-duration:${duration}s;animation-delay:${delay}s;opacity:${isMobileLow ? '0.3' : '0.45'};`;
      const coinHTML = isMobileLow ? makeCoinSVG(size).replace(`filter:drop-shadow(0 0 ${Math.round(size*0.18)}px rgba(255,200,40,0.85))`, '') : makeCoinSVG(size);
      wrap.innerHTML = `<div style="animation:coinDrift ${duration}s ease-in-out infinite;animation-delay:${delay}s">` + coinHTML + `</div>`;
      wrap.querySelector('svg').style.animationDuration = spinDur + 's';
      if (starsContainer) starsContainer.appendChild(wrap);
    }
    if (!document.getElementById('driftStyle')) {
      const st = document.createElement('style');
      st.id = 'driftStyle';
      st.textContent = `@keyframes coinDrift { 0%,100%{transform:translateX(0);} 50%{transform:translateX(30px);} }`;
      document.head.appendChild(st);
    }

    // ── Podium animation ──
    const _isSmallScreen = window.innerWidth <= 767 || (window.innerHeight <= 500 && window.innerWidth > window.innerHeight);
    const HEIGHTS = _isSmallScreen
      ? { pod1: 72,  pod2: 50,  pod3: 36  }
      : { pod1: 160, pod2: 128, pod3: 108 };
    const RISE_DURATION = 1200;
    const HOLD_DURATION = isMobileLow ? 10000 : 6000;
    const SINK_DURATION = 900;
    const STAGGER = { pod2: 0, pod3: 500, pod1: 1100 };

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function easeInCubic(t) { return t * t * t; }

    function animateHeight(el, from, to, duration, easing, onDone) {
      const start = performance.now();
      function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const e = easing(t);
        el.style.height = (from + (to - from) * e) + 'px';
        if (t < 1) requestAnimationFrame(step);
        else if (onDone) onDone();
      }
      requestAnimationFrame(step);
    }

    // En móvil: subir barras una sola vez y dejarlas fijas
    if (isMobileLow) {
      const mpodIds = ['mpod2', 'mpod3', 'mpod1'];
      const mpodHeights = { mpod1: HEIGHTS.pod1, mpod2: HEIGHTS.pod2, mpod3: HEIGHTS.pod3 };
      mpodIds.forEach((id, i) => {
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) animateHeight(el, 0, mpodHeights[id], RISE_DURATION, easeOutCubic, null);
        }, STAGGER[id.replace('m','')] || i * 500);
      });
    }

    // ── Desktop: subir barras una sola vez y dejarlas fijas ──
    const pods = ['pod2', 'pod3', 'pod1'];
    const infos = ['info2', 'info3', 'info1'];
    pods.forEach((podId, i) => {
      const infoId = infos[i];
      setTimeout(() => {
        const el = document.getElementById(podId);
        const infoEl = document.getElementById(infoId);
        const targetH = HEIGHTS[podId];
        if (el) animateHeight(el, 0, targetH, RISE_DURATION, easeOutCubic, () => { if(infoEl) infoEl.classList.add('visible'); });
      }, STAGGER[podId]);
    });

    // ── Coin bag canvas animation ──
    (function() {
      const cv = document.getElementById('bagCanvas');
      if (!cv) return;
      const ctx = cv.getContext('2d');
      const W = cv.width, H = cv.height;
      const flyCoins = [];
      for (let i = 0; i < 4; i++) {
        flyCoins.push({
          x: W/2 + (Math.random()-0.5)*14,
          y: H*0.35,
          vx: (Math.random()-0.5)*1.8,
          vy: -(1.4 + Math.random()*1.8),
          r: 3 + Math.random()*2,
          phase: Math.random()*Math.PI*2,
          life: Math.random(),
          speed: 0.008 + Math.random()*0.007
        });
      }

      function drawCoin(x, y, r, alpha, angle) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(Math.abs(Math.cos(angle*3)) * 0.6 + 0.4, 1);
        const grd = ctx.createRadialGradient(-r*0.3,-r*0.3,r*0.05, 0,0,r);
        grd.addColorStop(0,'#ffe87a');
        grd.addColorStop(0.5,'#c9a030');
        grd.addColorStop(1,'#7a5000');
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI*2);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, r*0.65, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(255,220,60,0.5)';
        ctx.lineWidth = r*0.12;
        ctx.stroke();
        ctx.restore();
      }

      function drawBag(wobble) {
        const cx = W/2, by = H*0.88;
        const grd = ctx.createRadialGradient(cx-6, by-22, 4, cx, by-18, 26);
        grd.addColorStop(0,'#ffe87a');
        grd.addColorStop(0.45,'#c9a030');
        grd.addColorStop(1,'#5a3800');
        ctx.save();
        ctx.translate(cx, by-20);
        ctx.rotate(Math.sin(wobble)*0.06);
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 26, 0, 0, Math.PI*2);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,200,40,0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, -24, 7, 5, 0, 0, Math.PI*2);
        ctx.fillStyle = '#c9a030';
        ctx.fill();
        ctx.strokeStyle = '#ffe87a';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, -20, 5, 3, 0, 0, Math.PI*2);
        ctx.fillStyle = '#a07020';
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-7, -8, 5, 9, -0.5, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,200,0.18)';
        ctx.fill();
        const cr = 9, cx2 = 3, cy2 = 2;
        ctx.beginPath();
        ctx.arc(cx2, cy2, cr, 0, Math.PI*2);
        ctx.fillStyle = '#7a5000';
        ctx.fill();
        const cg = ctx.createRadialGradient(cx2-cr*0.3, cy2-cr*0.3, cr*0.05, cx2, cy2, cr*0.88);
        cg.addColorStop(0, '#ffe87a');
        cg.addColorStop(0.5, '#c9a030');
        cg.addColorStop(1, '#7a5000');
        ctx.beginPath();
        ctx.arc(cx2, cy2, cr*0.88, 0, Math.PI*2);
        ctx.fillStyle = cg;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx2, cy2, cr*0.72, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(255,220,60,0.55)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.save();
        ctx.translate(cx2, cy2);
        ctx.beginPath();
        ctx.moveTo(-4.5, -4.5); ctx.lineTo(0, -7); ctx.lineTo(4.5, -4.5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(120,70,0,0.75)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,200,50,0.8)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.fillStyle = 'rgba(100,60,0,0.7)';
        ctx.fillRect(-5, -4.5, 10, 1.5);
        [[-3.5,-3,1.5,5],[-1,-3,1.5,5],[1.5,-3,1.5,5]].forEach(([x,y,w,h]) => {
          ctx.fillStyle = 'rgba(100,60,0,0.7)';
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = 'rgba(255,200,50,0.6)';
          ctx.lineWidth = 0.4;
          ctx.strokeRect(x, y, w, h);
        });
        ctx.fillStyle = 'rgba(100,60,0,0.7)';
        ctx.fillRect(-5.5, 2, 11, 1.8);
        ctx.strokeStyle = 'rgba(255,200,50,0.6)';
        ctx.lineWidth = 0.4;
        ctx.strokeRect(-5.5, 2, 11, 1.8);
        ctx.beginPath();
        ctx.ellipse(-cr*0.28, -cr*0.28, cr*0.22, cr*0.1, -0.5, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,200,0.32)';
        ctx.fill();
        ctx.restore();
        ctx.restore();
      }

      let t = 0;
      let _lastBag=0;function frame(now) {
  if(now-_lastBag<50)return void requestAnimationFrame(frame);_lastBag=now;
  ctx.clearRect(0, 0, W, H);
        t += 0.022;
        flyCoins.forEach(c => {
          c.life += c.speed;
          if (c.life >= 1) {
            c.life = 0;
            c.x = W/2 + (Math.random()-0.5)*16;
            c.y = H*0.35;
            c.vx = (Math.random()-0.5)*2.4;
            c.vy = -(1.8 + Math.random()*2.2);
          }
          const progress = c.life;
          const px = c.x + c.vx * progress * 60;
          const py = c.y + c.vy * progress * 60 + 0.5 * 3.5 * Math.pow(progress*60,2) * 0.015;
          const alpha = progress < 0.15 ? progress/0.15 : progress > 0.7 ? (1-progress)/0.3 : 1;
          drawCoin(px, py, c.r, alpha * 0.9, c.phase + t*2);
        });
        drawBag(t);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    })();

    // ── Header coverflow carousel (drag + swipe + auto) ──
    (function() {
      const wrap = document.getElementById('hcfWrap');
      if (!wrap) return;
      const slides = Array.from(wrap.querySelectorAll('.hcf-slide'));
      if (!slides.length) return;
      const total = slides.length;
      let current = 0;
      let autoTimer = null;
      let dragStartX = null;
      let dragging = false;
      const THRESHOLD = 40;

      function getClass(i) {
        const diff = ((i - current) % total + total) % total;
        if (diff === 0)         return 'hcf-center';
        if (diff === 1)         return 'hcf-right';
        if (diff === total - 1) return 'hcf-left';
        if (diff === 2)         return 'hcf-hidden-right';
        return 'hcf-hidden-left';
      }
      function update() { slides.forEach((s, i) => { s.className = 'hcf-slide ' + getClass(i); }); }
      function goTo(idx) { current = ((idx % total) + total) % total; update(); }
      function next() { goTo(current + 1); }
      function prev() { goTo(current - 1); }
      function startAuto() { stopAuto(); autoTimer = setInterval(next, 2800); }
      function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

      wrap.addEventListener('mousedown', e => {
        dragStartX = e.clientX; dragging = true; stopAuto();
        wrap.style.cursor = 'grabbing';
      });
      window.addEventListener('mousemove', e => { if (!dragging) return; });
      window.addEventListener('mouseup', e => {
        if (!dragging) return;
        dragging = false; wrap.style.cursor = '';
        const delta = e.clientX - dragStartX;
        if (Math.abs(delta) >= THRESHOLD) { delta < 0 ? next() : prev(); }
        startAuto();
      });
      wrap.addEventListener('touchstart', e => {
        dragStartX = e.touches[0].clientX; stopAuto();
      }, { passive: true });
      wrap.addEventListener('touchend', e => {
        if (dragStartX === null) return;
        const delta = e.changedTouches[0].clientX - dragStartX;
        dragStartX = null;
        if (Math.abs(delta) >= THRESHOLD) { delta < 0 ? next() : prev(); }
        startAuto();
      });
      wrap.querySelectorAll('img').forEach(img => { img.addEventListener('dragstart', e => e.preventDefault()); });
      update();
      wrap.style.cursor = 'grab';
      startAuto();
    })();

    // ── Mobile portrait layout visibility ──
    (function() {
      const mpl = document.getElementById('mobilePortraitLayout');
      if (!mpl) return;
      function checkMobileOrientation() {
  // Forzamos a que NUNCA se muestre el ranking móvil en desktop
  const isPortrait = false;
  mpl.style.display = isPortrait ? 'grid' : 'none';
}
      checkMobileOrientation();
      window.addEventListener('resize', checkMobileOrientation);
      window.addEventListener('orientationchange', () => setTimeout(checkMobileOrientation, 200));

      // Clone bag canvas animation to mobile version
      const srcCanvas = document.getElementById('bagCanvas');
      const dstCanvas = document.getElementById('bagCanvasMobile');
      if (srcCanvas && dstCanvas) {
        let _lastCopy=0;
        function copyFrame(now) {
          requestAnimationFrame(copyFrame);
          if(now-_lastCopy<100)return;
          _lastCopy=now;
          const ctx = dstCanvas.getContext('2d');
          ctx.clearRect(0, 0, dstCanvas.width, dstCanvas.height);
          ctx.drawImage(srcCanvas, 0, 0);
        }
        requestAnimationFrame(copyFrame);
      }
    })();

    // ── Mobile portrait carousel (#mp-carousel) ──
    (function() {
      const wrap = document.getElementById('mp-carousel');
      if (!wrap) return;
      const slides = Array.from(wrap.querySelectorAll('.hcf-slide'));
      if (!slides.length) return;
      const total = slides.length;
      let current = 0;
      let autoTimer = null;

      function getClass(i) {
        const diff = ((i - current) % total + total) % total;
        if (diff === 0)         return 'hcf-center';
        if (diff === 1)         return 'hcf-right';
        if (diff === total - 1) return 'hcf-left';
        if (diff === 2)         return 'hcf-hidden-right';
        return 'hcf-hidden-left';
      }
      function update() { slides.forEach((s, i) => { s.className = 'hcf-slide ' + getClass(i); }); }
      function next() { current = (current + 1) % total; update(); }
      function startAuto() { stopAuto(); autoTimer = setInterval(next, 2800); }
      function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

      let tStart = null;
      wrap.addEventListener('touchstart', e => { tStart = e.touches[0].clientX; stopAuto(); }, { passive: true });
      wrap.addEventListener('touchend', e => {
        if (tStart === null) return;
        const delta = e.changedTouches[0].clientX - tStart;
        tStart = null;
        if (Math.abs(delta) >= 40) { delta < 0 ? next() : (current = (current - 1 + total) % total, update()); }
        startAuto();
      });
      update();
      startAuto();
    })();

    // ── CHARACTER RENDERING (mismo sistema del juego) ──
    const _rRafs = {};
    const CVR = { m:[
      {name:'Templario de Luz',    weapon:'sword',armor:'#2C2210',accent:'#C9A84C',skin:'#D4956A',cape:'#1A0E06',plume:'#E8C97A',hair:null},
      {name:'Templario de Sombras',weapon:'axe',  armor:'#1A1828',accent:'#6688CC',skin:'#C8856A',cape:'#0C0A1A',plume:'#8899DD',hair:null},
      {name:'Templario de Fuego',  weapon:'lance',armor:'#2C0E08',accent:'#CC4422',skin:'#D4956A',cape:'#1A0600',plume:'#FF6644',hair:null}
    ], f:[
      {name:'Templaria Sagrada',   weapon:'staff',armor:'#241C10',accent:'#E8C97A',skin:'#E8B890',cape:'#180E06',plume:'#F5E4A8',hair:'#8A5020'},
      {name:'Templaria Sombría',   weapon:'bow',  armor:'#1A1430',accent:'#9966DD',skin:'#C8A080',cape:'#100C22',plume:'#BB88FF',hair:'#2A1840'},
      {name:'Templaria Tormenta',  weapon:'mace', armor:'#142018',accent:'#44AA66',skin:'#D4B090',cape:'#0C1610',plume:'#66DD88',hair:'#1A3020'}
    ]};
    function csWpn(ctx,type,s,ac,elapsed){const t=elapsed*.001,wob=Math.sin(t*1.5)*.03;ctx.save();ctx.translate(4*s,28*s);ctx.rotate(wob);if(type==='sword'){ctx.fillStyle='#B0B0A8';ctx.beginPath();ctx.moveTo(-2.5*s,0);ctx.lineTo(2.5*s,0);ctx.lineTo(1*s,52*s);ctx.lineTo(-1*s,52*s);ctx.closePath();ctx.fill();ctx.strokeStyle='#E8E8D8';ctx.lineWidth=.8*s;ctx.beginPath();ctx.moveTo(-1.5*s,2*s);ctx.lineTo(.5*s,50*s);ctx.stroke();ctx.fillStyle='#C9A84C';ctx.beginPath();ctx.roundRect(-9*s,-3.5*s,18*s,5*s,1.5);ctx.fill();ctx.fillStyle=ac;ctx.strokeStyle='#C9A84C';ctx.lineWidth=1*s;ctx.beginPath();ctx.roundRect(-3.5*s,-11*s,7*s,9*s,2);ctx.fill();ctx.stroke();ctx.fillStyle='#F5E4A8';ctx.beginPath();ctx.arc(0,-7.5*s,2*s,0,Math.PI*2);ctx.fill();}else if(type==='axe'){ctx.fillStyle='#6A4E28';ctx.beginPath();ctx.roundRect(-2.5*s,-5*s,5*s,52*s,2);ctx.fill();ctx.strokeStyle='#3A2810';ctx.lineWidth=2.5*s;ctx.globalAlpha=.5;for(let i=0;i<8;i++)ctx.strokeRect(-2*s,(i*5+5)*s,4*s,3.5*s);ctx.globalAlpha=1;ctx.fillStyle='#909088';ctx.beginPath();ctx.moveTo(-14*s,-12*s);ctx.lineTo(3*s,-18*s);ctx.lineTo(5*s,5*s);ctx.lineTo(-14*s,8*s);ctx.closePath();ctx.fill();ctx.strokeStyle='#D0D0C8';ctx.lineWidth=1.2*s;ctx.beginPath();ctx.moveTo(-14*s,-12*s);ctx.lineTo(-14*s,8*s);ctx.stroke();ctx.strokeStyle='#C9A84C';ctx.lineWidth=1*s;ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(-10*s,-9*s);ctx.lineTo(-10*s,5*s);ctx.stroke();ctx.globalAlpha=1;}else if(type==='lance'){ctx.fillStyle='#6A4E28';ctx.beginPath();ctx.roundRect(-2*s,-5*s,4*s,58*s,2);ctx.fill();ctx.fillStyle='#C9A84C';ctx.globalAlpha=.8;[8,20,36].forEach(y=>ctx.fillRect(-3*s,y*s,6*s,2.5*s));ctx.globalAlpha=1;ctx.fillStyle='#B0B0A8';ctx.beginPath();ctx.moveTo(0,-18*s);ctx.lineTo(-5*s,-3*s);ctx.lineTo(5*s,-3*s);ctx.closePath();ctx.fill();ctx.strokeStyle='#E0E0D0';ctx.lineWidth=.8*s;ctx.beginPath();ctx.moveTo(-2*s,-12*s);ctx.lineTo(0,-18*s);ctx.stroke();ctx.fillStyle=ac;ctx.globalAlpha=.7;ctx.beginPath();ctx.moveTo(5*s,-2*s);ctx.lineTo(18*s,5*s);ctx.lineTo(5*s,12*s);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}else if(type==='staff'){ctx.fillStyle='#5A3A18';ctx.beginPath();ctx.roundRect(-2.5*s,-5*s,5*s,55*s,2.5);ctx.fill();ctx.fillStyle='#C9A84C';ctx.globalAlpha=.85;[5,18,32,46].forEach(y=>ctx.fillRect(-4*s,y*s,8*s,2*s));ctx.globalAlpha=1;const og=ctx.createRadialGradient(0,-14*s,0,0,-14*s,11*s);og.addColorStop(0,'#FFF8E0');og.addColorStop(.4,'#E8C97A');og.addColorStop(1,`rgba(201,168,76,${.3+Math.sin(t*3)*.3})`);ctx.fillStyle=og;ctx.beginPath();ctx.arc(0,-14*s,10*s,0,Math.PI*2);ctx.fill();ctx.fillStyle='#FFFFF0';ctx.globalAlpha=.6;ctx.beginPath();ctx.arc(-3.5*s,-17*s,4*s,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle='#C9A84C';ctx.lineWidth=1.5*s;[-30,30,90,150,210,270].forEach(deg=>{const r=deg*Math.PI/180;ctx.beginPath();ctx.moveTo(Math.cos(r)*9*s,-14*s+Math.sin(r)*9*s);ctx.lineTo(Math.cos(r)*14*s,-14*s+Math.sin(r)*14*s);ctx.stroke();});}else if(type==='bow'){ctx.strokeStyle='#8A6030';ctx.lineWidth=4*s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-4*s,0);ctx.quadraticCurveTo(-20*s,25*s,-4*s,50*s);ctx.stroke();ctx.strokeStyle='#C9A84C';ctx.lineWidth=.8*s;ctx.beginPath();ctx.moveTo(-4*s,0);ctx.lineTo(-4*s,50*s);ctx.stroke();ctx.fillStyle='#909088';ctx.beginPath();ctx.roundRect(-1*s,5*s,2*s,40*s,1);ctx.fill();ctx.fillStyle='#C0C0B8';ctx.beginPath();ctx.moveTo(0,3*s);ctx.lineTo(-3*s,10*s);ctx.lineTo(3*s,10*s);ctx.closePath();ctx.fill();ctx.fillStyle=ac;ctx.globalAlpha=.8;ctx.beginPath();ctx.moveTo(0,44*s);ctx.lineTo(-5*s,50*s);ctx.lineTo(0,46*s);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(0,44*s);ctx.lineTo(5*s,50*s);ctx.lineTo(0,46*s);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}else if(type==='mace'){ctx.fillStyle='#6A4E28';ctx.beginPath();ctx.roundRect(-2.5*s,8*s,5*s,45*s,2);ctx.fill();ctx.fillStyle='#909088';ctx.beginPath();ctx.arc(0,4*s,12*s,0,Math.PI*2);ctx.fill();for(let i=0;i<6;i++){const ang=i*(Math.PI/3);ctx.save();ctx.translate(0,4*s);ctx.rotate(ang);ctx.fillStyle='#A0A098';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-5*s,18*s);ctx.lineTo(5*s,18*s);ctx.closePath();ctx.fill();ctx.fillStyle='#C9A84C';ctx.globalAlpha=.4;ctx.beginPath();ctx.moveTo(0,2*s);ctx.lineTo(-2*s,16*s);ctx.lineTo(2*s,16*s);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.restore();}const jg=ctx.createRadialGradient(0,4*s,0,0,4*s,7*s);jg.addColorStop(0,'#FFF8E0');jg.addColorStop(.5,ac);jg.addColorStop(1,ac);ctx.fillStyle=jg;ctx.beginPath();ctx.arc(0,4*s,7*s,0,Math.PI*2);ctx.fill();}ctx.restore();}
    function drawChr(ctx,cx,floorY,v,gender,elapsed,stageW,stageH){const t=elapsed*.001;const availH=stageH||stageW*2.2;const s=Math.min((availH*.82)/145,stageW*.9/60);const breathAmt=Math.sin(t*1.8)*2*s;const capeSway=Math.sin(t*1.4)*6;const armIdle=Math.sin(t*1.6)*4;const legIdle=Math.sin(t*1.8)*2;const weaponBob=Math.sin(t*1.5)*3;ctx.save();ctx.translate(cx,floorY-breathAmt);const a=v.armor,ac=v.accent,sk=v.skin,ca=v.cape,pl=v.plume||'#C9A84C';ctx.save();ctx.translate(-2*s,-85*s);ctx.rotate(capeSway*Math.PI/180);ctx.fillStyle=ca;ctx.globalAlpha=.92;ctx.beginPath();ctx.moveTo(-3*s,0);ctx.quadraticCurveTo(-18*s,20*s,-14*s,55*s);ctx.lineTo(5*s,55*s);ctx.quadraticCurveTo(8*s,20*s,4*s,0);ctx.closePath();ctx.fill();ctx.strokeStyle=ac;ctx.lineWidth=.8*s;ctx.globalAlpha=.35;ctx.beginPath();ctx.moveTo(-3*s,0);ctx.quadraticCurveTo(-18*s,20*s,-14*s,55*s);ctx.stroke();ctx.restore();ctx.save();ctx.translate(-5*s,-45*s);ctx.rotate((legIdle-4)*Math.PI/180);ctx.fillStyle=a;ctx.beginPath();ctx.roundRect(-5.5*s,0,11*s,33*s,3);ctx.fill();ctx.fillStyle=ac;ctx.globalAlpha=.6;ctx.beginPath();ctx.ellipse(0,16*s,7*s,4.5*s,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#0A0702';ctx.beginPath();ctx.roundRect(-6.5*s,28*s,14*s,9*s,2);ctx.fill();ctx.restore();ctx.save();ctx.translate(5*s,-45*s);ctx.rotate((-legIdle+4)*Math.PI/180);ctx.fillStyle=a;ctx.beginPath();ctx.roundRect(-5.5*s,0,11*s,33*s,3);ctx.fill();ctx.fillStyle=ac;ctx.globalAlpha=.6;ctx.beginPath();ctx.ellipse(0,16*s,7*s,4.5*s,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#0A0702';ctx.beginPath();ctx.roundRect(-6.5*s,28*s,14*s,9*s,2);ctx.fill();ctx.restore();ctx.fillStyle='#3A2810';ctx.beginPath();ctx.roundRect(-14*s,-48*s,28*s,5*s,1);ctx.fill();ctx.fillStyle='#C9A84C';ctx.beginPath();ctx.roundRect(-4*s,-49.5*s,8*s,7*s,1);ctx.fill();ctx.fillStyle=a;ctx.beginPath();ctx.roundRect(-14*s,-85*s,28*s,38*s,4);ctx.fill();ctx.fillStyle=ac;ctx.globalAlpha=.55;ctx.beginPath();ctx.roundRect(-12*s,-83*s,24*s,32*s,3);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle='#C9A84C';ctx.lineWidth=.7*s;ctx.globalAlpha=.5;ctx.beginPath();ctx.roundRect(-10*s,-81*s,20*s,26*s,2);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle='#C9A84C';ctx.globalAlpha=.9;ctx.fillRect(-1.8*s,-78*s,3.5*s,18*s);ctx.fillRect(-7*s,-70*s,14*s,3.5*s);ctx.fillStyle='#F5E4A8';ctx.beginPath();ctx.arc(0,-68.5*s,2.5*s,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;[-16,10].forEach((ox)=>{ctx.fillStyle=a;ctx.beginPath();ctx.roundRect(ox*s,-88*s,14*s,10*s,4);ctx.fill();ctx.strokeStyle=ac;ctx.lineWidth=1*s;ctx.globalAlpha=.5;ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle='#C9A84C';ctx.beginPath();ctx.arc((ox+7)*s,-83*s,2*s,0,Math.PI*2);ctx.fill();});ctx.save();ctx.translate(18*s,-83*s);ctx.rotate((armIdle+weaponBob)*Math.PI/180);ctx.fillStyle=a;ctx.beginPath();ctx.roundRect(-5*s,0,10*s,30*s,2.5);ctx.fill();ctx.fillStyle=ac;ctx.globalAlpha=.8;ctx.beginPath();ctx.roundRect(-6*s,25*s,12*s,9*s,2);ctx.fill();ctx.globalAlpha=1;csWpn(ctx,v.weapon,s,ac,elapsed);ctx.restore();ctx.save();ctx.translate(-18*s,-83*s);ctx.rotate((-armIdle)*Math.PI/180);ctx.fillStyle=a;ctx.beginPath();ctx.roundRect(-5*s,0,10*s,30*s,2.5);ctx.fill();ctx.fillStyle=ac;ctx.globalAlpha=.8;ctx.beginPath();ctx.roundRect(-6*s,25*s,12*s,9*s,2);ctx.fill();ctx.globalAlpha=1;if(v.weapon==='sword'){ctx.fillStyle=a;ctx.strokeStyle=ac;ctx.lineWidth=1*s;ctx.globalAlpha=.8;ctx.beginPath();ctx.roundRect(-13*s,2*s,22*s,28*s,3);ctx.fill();ctx.stroke();ctx.fillStyle='#C9A84C';ctx.globalAlpha=.6;ctx.beginPath();ctx.arc(-2*s,16*s,7*s,0,Math.PI*2);ctx.fill();ctx.fillStyle=ac;ctx.globalAlpha=.4;ctx.fillRect(-3.5*s,8*s,3*s,16*s);ctx.fillRect(-9*s,14*s,14*s,3*s);ctx.globalAlpha=1;}ctx.restore();ctx.fillStyle=sk;ctx.beginPath();ctx.roundRect(-5*s,-92*s,10*s,9*s,1);ctx.fill();ctx.fillStyle=a;ctx.beginPath();ctx.roundRect(-7*s,-93*s,14*s,4*s,1);ctx.fill();ctx.fillStyle=a;ctx.beginPath();ctx.roundRect(-13*s,-122*s,26*s,32*s,5);ctx.fill();ctx.fillStyle=ac;ctx.globalAlpha=.65;ctx.beginPath();ctx.roundRect(-11*s,-120*s,22*s,27*s,4);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#0A0702';ctx.beginPath();ctx.roundRect(-9*s,-107*s,18*s,4.5*s,1.5);ctx.fill();const slitGlow=ctx.createLinearGradient(-9*s,-107*s,9*s,-107*s);slitGlow.addColorStop(0,'rgba(201,168,76,0)');slitGlow.addColorStop(.5,`rgba(201,168,76,${.3+Math.sin(t*3)*.15})`);slitGlow.addColorStop(1,'rgba(201,168,76,0)');ctx.fillStyle=slitGlow;ctx.fillRect(-9*s,-107*s,18*s,4.5*s);[-15,9].forEach(ox=>{ctx.fillStyle=a;ctx.beginPath();ctx.roundRect(ox*s,-115*s,6*s,14*s,2);ctx.fill();});if(gender==='m'){ctx.fillStyle='#1C1408';ctx.fillRect(-1.2*s,-102*s,2.5*s,8*s);}ctx.fillStyle=a;ctx.beginPath();ctx.roundRect(-4*s,-125*s,8*s,6*s,1);ctx.fill();ctx.fillStyle=pl;ctx.beginPath();ctx.moveTo(0,-125*s);ctx.lineTo(-4*s,-140*s);ctx.lineTo(4*s,-140*s);ctx.closePath();ctx.fill();ctx.fillStyle='#FFF';ctx.globalAlpha=.25;ctx.beginPath();ctx.moveTo(0,-125*s);ctx.lineTo(-1*s,-140*s);ctx.lineTo(1*s,-140*s);ctx.closePath();ctx.fill();ctx.globalAlpha=1;if(gender==='f'&&v.hair){ctx.fillStyle=v.hair;[-13,7].forEach(ox=>{ctx.beginPath();ctx.roundRect(ox*s,-118*s,5*s,22*s,2);ctx.fill();});}ctx.fillStyle=pl;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(0,-140.5*s,3*s,0,Math.PI*2);ctx.fill();ctx.fillStyle='#FFF';ctx.globalAlpha=.5;ctx.beginPath();ctx.arc(-1*s,-141.5*s,1.2*s,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.restore();}
    function spawnChar(container, cv, cg, size) {
      const g = cg||'m'; const idx = Math.min(cv||0,(CVR[g]||CVR['m']).length-1);
      const variant = (CVR[g]||CVR['m'])[idx]||CVR['m'][0];
      const cvs = document.createElement('canvas'); const uid = 'rrc-'+Math.random().toString(36).slice(2);
      cvs.id=uid; cvs.width=size; cvs.height=size;
      cvs.style.cssText=`width:${size}px;height:${size}px;display:block;flex-shrink:0;`;
      container.appendChild(cvs); const t0=performance.now();
      let lastFrame=0;let _paused=false;
      const _obs=new IntersectionObserver(entries=>{_paused=!entries[0].isIntersecting;},{ threshold:0 });
      _obs.observe(cvs);
      function draw(now){
        _rRafs[uid]=requestAnimationFrame(draw);
        if(_paused||now-lastFrame<100)return;
        lastFrame=now;
        const c=document.getElementById(uid);
        if(!c){cancelAnimationFrame(_rRafs[uid]);delete _rRafs[uid];_obs.disconnect();return;}
        const ctx=c.getContext('2d');
        ctx.clearRect(0,0,size,size);
        drawChr(ctx,size/2,size*.92,variant,g,now-t0,size,size);
      }
      _rRafs[uid]=requestAnimationFrame(draw);
    }

    // ── Chars podio inmediatos ──
    const POD_SIZES_EARLY = [80, 60, 60];
    [
      { sel: '#info1', sz: POD_SIZES_EARLY[0] },
      { sel: '#mp-podium .p1 .player-info', sz: POD_SIZES_EARLY[0] },
      { sel: '#info2', sz: POD_SIZES_EARLY[1] },
      { sel: '#mp-podium .p2 .player-info', sz: POD_SIZES_EARLY[1] },
      { sel: '#info3', sz: POD_SIZES_EARLY[2] },
      { sel: '#mp-podium .p3 .player-info', sz: POD_SIZES_EARLY[2] },
    ].forEach(({ sel, sz }) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const av = el.querySelector('.player-avatar');
      if (av && !av.querySelector('canvas')) {
        av.textContent = '';
        av.style.width = sz + 'px';
        av.style.height = sz + 'px';
        av.style.overflow = 'hidden';
        av.style.borderRadius = '50%';
        av.style.background = 'rgba(0,0,0,0.45)';
        av.style.flexShrink = '0';
        spawnChar(av, 0, 'm', sz);
      }
    });

    // ── Fetch ranking igual que el mapa ──
    (async function() {
  const sbR = supabase;

  // ── Timer desde competition_seasons ──
  const { data: seasons } = await sbR
    .from('competition_settings')
    .select('end_date, prizes')
    .eq('id', 'current')
    .limit(1);
  const endedAt = seasons && seasons[0] && seasons[0].end_date ? new Date(seasons[0].end_date) : null;
  function updateTimer() {
    const timers = [document.getElementById('recTimer'), document.getElementById('recTimerMobile')];
    if (!endedAt) { timers.forEach(t => { if(t) t.textContent = '7d 00:00:00'; }); return; }
    const diff = endedAt - Date.now();
    if (diff <= 0) { timers.forEach(t => { if(t) t.textContent = '¡Fin!'; }); return; }
    const d = Math.floor(diff / 86400000);
    const h = String(Math.floor((diff % 86400000) / 3600000)).padStart(2,'0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0');
    timers.forEach(t => { if(t) t.textContent = `${d}d ${h}:${m}:${s}`; });
  }
  updateTimer();
  setInterval(updateTimer, 1000);

  const prizes = seasons?.[0]?.prizes || {};
function fillPrizes(suffix) {
  [1,2,3].forEach(n => {
    const pr = prizes[String(n)] || {};
    const coins = pr.propocoins || 0;
    const exp   = pr.exp || 0;
    const enabled = pr.enabled ?? true;
    const coinEl = document.getElementById(`rpc${n}${suffix}`);
    const expEl  = document.getElementById(`rpe${n}${suffix}`);
    if (coinEl) coinEl.textContent = enabled && coins > 0 ? `🪙 ${coins} PC` : '';
    if (expEl)  expEl.textContent  = enabled && exp   > 0 ? `✨ ${exp} XP`  : '';
  });
  for (let i = 4; i <= 10; i++) {
    const pr = prizes[String(i)] || {};
    const coins = pr.propocoins || 0;
    const exp   = pr.exp || 0;
    const enabled = pr.enabled ?? true;
    const sfx = suffix === 'm' ? 'm' : '';
    const el = document.getElementById(`rcc${i}${sfx}`);
    if (!el) continue;
    el.innerHTML =
      `<span style="font-size:8px;font-weight:900;letter-spacing:0.5px;color:rgba(255,220,80,${enabled&&(coins>0||exp>0)?'0.9':'0.45'});">Top ${i}</span>`
      + (enabled && coins > 0 ? `<span style="font-size:8px;color:#c9a84c;font-weight:700;">🪙${coins}</span>` : '')
      + (enabled && exp   > 0 ? `<span style="font-size:8px;color:#7eb8f7;font-weight:700;">✨${exp}xp</span>` : '')
      + (!enabled || (!coins && !exp) ? `<span style="font-size:7px;color:rgba(201,168,76,0.3);">—</span>` : '');
  }
}
fillPrizes('');
fillPrizes('m');


  const { data } = await sbR
    .from('templo_players')
    .select('id, char_name, weekly_points, char_variant, char_gender, player_rank, level, streak, is_vip')
    .order('weekly_points', { ascending: false })
    .limit(100);


const all = data || [];

const ids = all.map(p => p.id);
const { data: profilesData } = await sbR
  .from('profiles')
  .select('id, templario_name')
  .in('id', ids);
const profilesMap = {};
(profilesData || []).forEach(p => { profilesMap[p.id] = p.templario_name; });

const total = all.length;

  // ── Actualizar contador ──
  document.querySelectorAll('.pc-rank-count, #mp-ranking-count').forEach(el => {
    el.textContent = total + ' jugadores';
  });
  document.querySelectorAll('.subtitle-count').forEach(el => {
    el.textContent = total + ' Templarios en Competencia';
  });

  // ── Podio top 3 ──
  // ── Podio top 3 con sprite épico ──
  const POD_SIZES = [80, 60, 60]; // p1=oro, p2=plata, p3=bronce
  const podMap = [
    { infoId: 'info1', mpodSel: '#mp-podium .p1 .player-info', place: 0, sz: POD_SIZES[0] },
    { infoId: 'info2', mpodSel: '#mp-podium .p2 .player-info', place: 1, sz: POD_SIZES[1] },
    { infoId: 'info3', mpodSel: '#mp-podium .p3 .player-info', place: 2, sz: POD_SIZES[2] },
  ];
  podMap.forEach(({ infoId, mpodSel, place, sz }) => {
    const p = all[place];
    if (!p) return;
    const pts = p.weekly_points || 0;
    const charKey = (p.char_gender||'m') + (p.char_variant||0);
    const charName = (CVR[p.char_gender||'m']||CVR['m'])[p.char_variant||0]?.name || 'Templario';
    const cv = p.char_variant || 0;
    const cg = p.char_gender || 'm';

    [document.getElementById(infoId), document.querySelector(mpodSel)].forEach(el => {
      if (!el) return;
      el.classList.add('visible');
      const av = el.querySelector('.player-avatar');
      if (av && !av.querySelector('canvas')) {
        av.textContent = '';
        av.style.width  = sz + 'px';
        av.style.height = sz + 'px';
        av.style.overflow = 'hidden';
        av.style.borderRadius = '50%';
        av.style.background = 'rgba(0,0,0,0.45)';
        av.style.flexShrink = '0';
        spawnChar(av, cv, cg, sz);
      }
      const nameEl = el.querySelector('.player-name');
      if (nameEl) {
        nameEl.textContent = profilesMap[p.id] || p.char_name || 'Templario';
        if (p.is_vip) {
          nameEl.style.cssText += `
            background: linear-gradient(135deg,#b3e5fc 0%,#ffffff 30%,#4fc3f7 50%,#e1f5fe 70%,#b3e5fc 100%) !important;
            background-size: 200% auto !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            animation: vipRuneShimmer 3s linear infinite !important;
            font-weight: 900 !important;
          `;
        }
      }
      const titleEl = el.querySelector('.player-title');
      if (titleEl) titleEl.textContent = charName;
      if (p.is_vip) {
        el.style.cssText += `
          position:relative;
          animation: vipRowAura 3s ease-in-out infinite;
        `;
        if (!el.querySelector('.vip-podium-edge')) {
          const edge = document.createElement('div');
          edge.className = 'vip-podium-edge';
          edge.style.cssText = `
            position:absolute;bottom:-2px;left:10%;right:10%;height:1px;
            background: linear-gradient(90deg,
              transparent 0%, rgba(79,195,247,0.3) 10%,
              rgba(185,220,255,0.9) 40%, rgba(79,195,247,1) 50%,
              rgba(185,220,255,0.9) 60%, rgba(79,195,247,0.3) 90%,
              transparent 100%);
            pointer-events:none;z-index:5;
          `;
          el.appendChild(edge);
          ['left','right'].forEach((side, si) => {
            const c = document.createElement('div');
            c.style.cssText = `
              position:absolute;bottom:-2px;${side}:10%;
              width:6px;height:6px;
              border-bottom:2px solid rgba(79,195,247,0.9);
              border-${side}:2px solid rgba(79,195,247,0.9);
              pointer-events:none;z-index:6;
              animation:vipCornerGlow 2.5s ease-in-out infinite;
              animation-delay:${si===0?'0s':'1.25s'};
            `;
            el.appendChild(c);
          });
        }
      }
      const ptsEl = el.querySelector('.player-pts');
      if (ptsEl) {
        ptsEl.textContent = pts + ' PTS';
        const streak = p.streak || 0;
        if (streak >= 2) {
          const sc = streak >= 4 ? '#FF4757' : '#FF9500';
          const existing = el.querySelector('.streak-pod-badge');
          if (!existing) {
            const sb = document.createElement('div');
            sb.className = 'streak-pod-badge';
            sb.style.cssText = `font-size:.6rem;font-weight:800;font-family:'Cinzel',serif;letter-spacing:.1em;color:${sc};margin-top:2px;text-align:center;`;
            sb.innerHTML = `EN RACHA <span style="padding:1px 6px;border-radius:20px;background:${streak>=4?'rgba(255,71,87,.18)':'rgba(255,149,0,.15)'};border:1px solid ${sc};animation:pulse 1.2s infinite;">🔥×${streak}</span>`;
            ptsEl.insertAdjacentElement('afterend', sb);
          }
        }
        if (p?.is_vip && !el.querySelector('.vip-pod-badge')) {
          const vipSb = document.createElement('div');
          vipSb.className = 'vip-pod-badge';
          vipSb.style.cssText = `font-size:.58rem;font-weight:900;font-family:'Cinzel',serif;letter-spacing:.12em;margin-top:3px;text-align:center;padding:1px 8px;border-radius:20px;background:linear-gradient(135deg,rgba(79,195,247,0.15),rgba(10,30,50,0.9));border:1px solid rgba(79,195,247,0.7);color:#4fc3f7;white-space:nowrap;animation:vipBadgePulse 2.5s ease-in-out infinite;`;
          vipSb.textContent = '👑 PROPO-PASS +10%';
          ptsEl.insertAdjacentElement('afterend', vipSb);
        }
      }
      const rn = p.player_rank || 0;
if (!el.querySelector('.rank-badge-label')) {
  const b = document.createElement('div');
  b.className = 'rank-badge-label';
  if (rn > 0) {
    const rc = ['#CD7F32','#A8A8A8','#F4C542','#9B4FDE','#00D4AA','#FF4757'][rn-1];
    const re = ['⚔️','🛡️','🔥','💀','👑','⭐'][rn-1];
    b.style.cssText = `display:inline-flex;align-items:center;gap:3px;background:${rc}22;border:1px solid ${rc};color:${rc};font-size:8px;font-weight:800;letter-spacing:1px;padding:1px 6px;border-radius:20px;margin-top:3px;text-transform:uppercase;box-shadow:0 0 6px ${rc}88;text-shadow:0 0 8px ${rc};`;
    b.textContent = `${re} RANGO ${rn} · NV.${p.level || 1}`;
  } else {
    b.style.cssText = `display:inline-flex;align-items:center;gap:3px;background:rgba(200,185,160,0.08);border:1px solid rgba(200,185,160,0.25);color:rgba(200,185,160,0.55);font-size:8px;font-weight:600;letter-spacing:1px;padding:1px 6px;border-radius:20px;margin-top:3px;`;
    b.textContent = `Nv. ${p.level || 1}`;
  }
  el.appendChild(b);
}
    });
  });

  // ── Elite section ──
  function populateElite(rows, charSize) {
    rows.forEach((row, i) => {
      const p = all[i];
      if (!p) return;
      const cv = p.char_variant || 0;
      const cg = p.char_gender  || 'm';
      const charMeta = (CVR[cg]||CVR['m'])[cv] || CVR['m'][0];
      const charEl = row.querySelector('.elite-char');
if (charEl && !charEl.hasChildNodes()) {
  const renderSz = charSize === 172 ? 80 : 66;
  spawnChar(charEl, cv, cg, renderSz);
  const cvs = charEl.querySelector('canvas');
  if (cvs) {
    cvs.style.position  = 'absolute';
    cvs.style.left      = '50%';
    cvs.style.top       = '50%';
    cvs.style.transform = 'translate(-50%, -42%)';
    cvs.style.margin    = '0';
    cvs.style.width     = renderSz + 'px';
    cvs.style.height    = renderSz + 'px';
  }
}
      const nameEl = row.querySelector('.elite-name');
      if (nameEl) nameEl.textContent = profilesMap[p.id] || p.char_name || 'Templario';  // nombre real del jugador
      const rankEl = row.querySelector('.elite-rank');
if (rankEl) rankEl.textContent = charMeta.name;
const ptsEl  = row.querySelector('.elite-pts');
if (ptsEl)  ptsEl.textContent  = (p.weekly_points || 0) + ' PTS';
const rn = p.player_rank || 0;
if (!row.querySelector('.rank-badge-label')) {
  const info = row.querySelector('.elite-info');
  if (info) {
    const b = document.createElement('div');
    b.className = 'rank-badge-label';
    if (rn > 0) {
      const rc = ['#CD7F32','#A8A8A8','#F4C542','#9B4FDE','#00D4AA','#FF4757'][rn-1];
      const re = ['⚔️','🛡️','🔥','💀','👑','⭐'][rn-1];
      b.style.cssText = `display:inline-flex;align-items:center;gap:3px;background:${rc}22;border:1px solid ${rc};color:${rc};font-size:8px;font-weight:800;letter-spacing:1px;padding:1px 6px;border-radius:20px;margin-top:3px;text-transform:uppercase;box-shadow:0 0 6px ${rc}88;text-shadow:0 0 8px ${rc};`;
      b.textContent = `${re} RANGO ${rn} · NV.${p.level || 1}`;
    } else {
      b.style.cssText = `display:inline-flex;align-items:center;gap:3px;background:rgba(200,185,160,0.08);border:1px solid rgba(200,185,160,0.25);color:rgba(200,185,160,0.55);font-size:8px;font-weight:600;letter-spacing:1px;padding:1px 6px;border-radius:20px;margin-top:3px;`;
      b.textContent = `Nv. ${p.level || 1}`;
    }
    info.appendChild(b);
  }
}
    });
  }
  populateElite(document.querySelectorAll('.right-panel .elite-section .elite-row'), 180);

  populateElite(document.querySelectorAll('#mp-panels .elite-section .elite-row'), 90);

  // ── Identidad por personaje (igual que el juego) ──
  const RANK_CHARS = {
    'm0':{ name:'Templario de Luz',     accent:'#C9A84C', icon:'⚔️' },
    'm1':{ name:'Templario de Sombras', accent:'#6688CC', icon:'🪓' },
    'm2':{ name:'Templario de Fuego',   accent:'#CC4422', icon:'🗡️' },
    'f0':{ name:'Templaria Sagrada',    accent:'#E8C97A', icon:'🔮' },
    'f1':{ name:'Templaria Sombría',    accent:'#9966DD', icon:'🏹' },
    'f2':{ name:'Templaria Tormenta',   accent:'#44AA66', icon:'🔨' },
  };
  function getChar(p) {
    const key = (p.char_gender||'m') + (p.char_variant||0);
    return RANK_CHARS[key] || { name:'Templario', accent:'#1a3a6b', icon:'⚔️' };
  }

  // ── Ranking scroll (pos 4+) ──
  const players = all.slice(3).map((p, i) => ({
    pos: i + 4,
    id: p.id,                          // ← agrega esto
    name: profilesMap[p.id] || p.char_name || 'Templario',
    charInfo: getChar(p),
    cv: p.char_variant || 0,
    cg: p.char_gender || 'm',
    pts: p.weekly_points || 0,
    delta: '—',
playerRank: p.player_rank || 0,
playerLevel: p.level || 1,
rankBadge: p.player_rank > 0 ? ['⚔️','🛡️','🔥','💀','👑','⭐'][p.player_rank-1] : null,
rankColor: ['#CD7F32','#A8A8A8','#F4C542','#9B4FDE','#00D4AA','#FF4757'][Math.max(0,(p.player_rank||1)-1)],
streak: p.streak || 0,
isVip: !!(p.is_vip),
}));

  function buildRow(p) {
  const isVip = p.isVip === true;
  const row = document.createElement('div');
  row.className = 'rank-row';
  row.dataset.uid = p.id;

  if (isVip) {
    row.style.cssText = `
      display:flex;align-items:center;gap:8px;
      position:relative;overflow:visible;
      background: linear-gradient(90deg,
        rgba(79,195,247,0.04) 0%,
        rgba(30,60,90,0.35) 40%,
        rgba(79,195,247,0.06) 100%);
      border-top: 1px solid rgba(79,195,247,0.35);
      border-bottom: 1px solid rgba(79,195,247,0.2);
      animation: vipRowAura 3s ease-in-out infinite;
    `;

    const topEdge = document.createElement('div');
    topEdge.style.cssText = `
      position:absolute;top:0;left:0;right:0;height:1px;
      background: linear-gradient(90deg,
        transparent 0%, rgba(79,195,247,0.2) 10%,
        rgba(185,220,255,0.8) 30%, rgba(79,195,247,1) 50%,
        rgba(185,220,255,0.8) 70%, rgba(79,195,247,0.2) 90%,
        transparent 100%);
      pointer-events:none;z-index:2;
    `;
    row.appendChild(topEdge);

    const bottomEdge = document.createElement('div');
    bottomEdge.style.cssText = `
      position:absolute;bottom:0;left:0;right:0;height:1px;
      background: linear-gradient(90deg,
        transparent 0%, rgba(79,195,247,0.1) 20%,
        rgba(79,195,247,0.5) 50%, rgba(79,195,247,0.1) 80%,
        transparent 100%);
      pointer-events:none;z-index:2;
    `;
    row.appendChild(bottomEdge);

    ['top-left','top-right','bottom-left','bottom-right'].forEach(corner => {
      const c = document.createElement('div');
      const isTop = corner.includes('top');
      const isLeft = corner.includes('left');
      c.style.cssText = `
        position:absolute;
        ${isTop ? 'top:-1px' : 'bottom:-1px'};
        ${isLeft ? 'left:0' : 'right:0'};
        width:8px;height:8px;
        border-${isTop ? 'top' : 'bottom'}:2px solid rgba(79,195,247,0.9);
        border-${isLeft ? 'left' : 'right'}:2px solid rgba(79,195,247,0.9);
        pointer-events:none;z-index:3;
        animation: vipCornerGlow 2.5s ease-in-out infinite;
        animation-delay:${isTop === isLeft ? '0s' : '1.25s'};
      `;
      row.appendChild(c);
    });
  } else {
    row.style.cssText = 'display:flex;align-items:center;gap:8px;';
  }

  const avatarSize = 42;
  const avatarBorderStyle = isVip
    ? `border:2px solid rgba(79,195,247,0.9);box-shadow:0 0 0 1px rgba(79,195,247,0.3),0 0 14px rgba(79,195,247,0.5);animation:vipDiamondPulse 2.5s ease-in-out infinite;`
    : `border:1px solid ${p.charInfo.accent};box-shadow:0 0 8px ${p.charInfo.accent}66;`;

  const namePart = isVip
    ? `<div class="rank-name" style="
        background: linear-gradient(135deg,#b3e5fc 0%,#ffffff 30%,#4fc3f7 50%,#e1f5fe 70%,#b3e5fc 100%);
        background-size:200% auto;
        -webkit-background-clip:text;
        -webkit-text-fill-color:transparent;
        background-clip:text;
        animation:vipRuneShimmer 3s linear infinite;
        font-weight:900;letter-spacing:1.5px;
      ">${p.name}</div>`
    : `<div class="rank-name">${p.name}</div>`;

const vipTag = '';

  row.innerHTML += `
    <span class="rank-num">${p.pos}</span>
    <div class="rank-avatar-sm" style="width:${avatarSize}px;height:${avatarSize}px;flex-shrink:0;border-radius:50%;overflow:hidden;background:rgba(0,0,0,0.5);${avatarBorderStyle}"></div>
    <div class="rank-info" style="flex:1;min-width:0;">
      ${namePart}
      <div class="rank-subtitle">${p.charInfo.name}</div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        ${p.rankBadge
          ? `<div class="rank-badge-label" style="display:inline-flex;align-items:center;gap:3px;background:${p.rankColor}22;border:1px solid ${p.rankColor};color:${p.rankColor};font-size:9px;font-weight:800;letter-spacing:1px;padding:1px 6px;border-radius:20px;margin-top:2px;text-transform:uppercase;box-shadow:0 0 6px ${p.rankColor}88,0 0 12px ${p.rankColor}44;text-shadow:0 0 8px ${p.rankColor};">${p.rankBadge} RANGO ${p.playerRank} · NV.${p.playerLevel}</div>`
          : `<div class="rank-badge-label" style="display:inline-flex;align-items:center;gap:3px;background:rgba(200,185,160,0.08);border:1px solid rgba(200,185,160,0.25);color:rgba(200,185,160,0.55);font-size:9px;font-weight:600;letter-spacing:1px;padding:1px 6px;border-radius:20px;margin-top:2px;">Nv. ${p.playerLevel}</div>`
        }
        ${isVip ? `<div style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;background:rgba(10,30,60,0.9);border:1px solid rgba(79,195,247,0.7);color:#4fc3f7;font-size:8px;font-weight:900;font-family:'Cinzel',serif;letter-spacing:1px;margin-top:2px;white-space:nowrap;animation:vipBadgePulse 2.5s ease-in-out infinite;">&#x1F451; PROPO-PASS +10%</div>` : ''}
      </div>
    </div>
    ${p.streak >= 2
      ? `<div style="display:flex;flex-direction:column;align-items:center;gap:1px;flex-shrink:0;">
           <span style="font-size:.6rem;font-weight:800;font-family:'Cinzel',serif;letter-spacing:.12em;color:${p.streak>=4?'#FF4757':'#FF9500'};">EN RACHA</span>
           <span style="font-size:.82rem;font-weight:900;font-family:'Cinzel',serif;padding:1px 8px;border-radius:20px;background:${p.streak>=4?'rgba(255,71,87,.18)':'rgba(255,149,0,.15)'};border:1px solid ${p.streak>=4?'#FF4757':'#FF9500'};color:${p.streak>=4?'#FF4757':'#FF9500'};letter-spacing:.08em;animation:pulse 1.2s infinite;white-space:nowrap;">🔥×${p.streak}</span>
         </div>`
      : ''
    }
    <span class="rank-pts">${p.pts} PTS</span>
    <span class="rank-delta">${p.delta}</span>
  `;

  const avatarEl = row.querySelector('.rank-avatar-sm');
  if (avatarEl) {
    const _rowObs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !avatarEl._charSpawned) {
        avatarEl._charSpawned = true;
        spawnChar(avatarEl, p.cv, p.cg, avatarSize);
        _rowObs.disconnect();
      }
    }, { threshold: 0, rootMargin: '120px' });
    _rowObs.observe(avatarEl);
  }
  return row;
}

  const pcScroll = document.getElementById('pcRankingScroll');
  if (pcScroll) players.forEach(p => pcScroll.appendChild(buildRow(p)));

  const mpScroll = document.getElementById('mp-ranking-scroll');
  if (mpScroll) players.forEach(p => mpScroll.appendChild(buildRow(p)));
  setTimeout(() => {
      const _authState = useAuthStore.getState();
      const gcbProps = {
        userXP: _authState.profile?.xp || 0,
        isVip: _authState.isVip(),
        onBuyVip: () => {
          if (window.__openPropoPassModal__) {
            window.__openPropoPassModal__();
          } else {
            window.dispatchEvent(new CustomEvent('open-propopass-modal'));
          }
        },
      };
      const mountEl = document.getElementById('golden-circle-bar-mount');
      if (mountEl && window.__ReactDOM__) {
        if (!mountEl._gcbRoot) mountEl._gcbRoot = window.__ReactDOM__.createRoot(mountEl);
        mountEl._gcbRoot.render(React.createElement(GoldenCircleBar, gcbProps));
      }
      const mountElMobile = document.getElementById('golden-circle-bar-mount-mobile');
      if (mountElMobile && window.__ReactDOM__) {
        if (!mountElMobile._gcbRoot) mountElMobile._gcbRoot = window.__ReactDOM__.createRoot(mountElMobile);
        mountElMobile._gcbRoot.render(React.createElement(GoldenCircleBar, gcbProps));
      }
    }, 200);

    window.__openPropoPassModal__ = () => setShowPropoPassModal(true);
    window.addEventListener('open-propopass-modal', window.__openPropoPassModal__);

    // ── Polling podio en tiempo real ──
    let _lastPodiumData = all.slice(0,3).map(p=>p.id+p.weekly_points).join('|');
    const podiumPoll = setInterval(async () => {
      const { data: fresh } = await sbR
        .from('templo_players')
        .select('id, char_name, weekly_points, char_variant, char_gender, player_rank, level, streak, is_vip')
        .order('weekly_points', { ascending: false })
        .limit(3);
      if (!fresh?.length) return;
      const freshKey = fresh.map(p=>p.id+p.weekly_points).join('|');
      if (freshKey === _lastPodiumData) return;
      _lastPodiumData = freshKey;
      const podMap = [
        { infoId: 'info1', mpodSel: '#mp-podium .p1 .player-info', place: 0 },
        { infoId: 'info2', mpodSel: '#mp-podium .p2 .player-info', place: 1 },
        { infoId: 'info3', mpodSel: '#mp-podium .p3 .player-info', place: 2 },
      ];
      podMap.forEach(({ infoId, mpodSel, place }) => {
        const p = fresh[place];
        if (!p) return;
        const charName = (CVR[p.char_gender||'m']||CVR['m'])[p.char_variant||0]?.name || 'Templario';
        const displayName = profilesMap[p.id] || p.char_name || 'Templario';
        const pts = (p.weekly_points || 0) + ' PTS';
        // desktop
        const desktopEl = document.getElementById(infoId);
        if (desktopEl) {
          desktopEl.classList.add('visible');
          const n = desktopEl.querySelector('.player-name'); if(n) n.textContent = displayName;
          const t = desktopEl.querySelector('.player-title'); if(t) t.textContent = charName;
          const pt = desktopEl.querySelector('.player-pts'); if(pt) pt.textContent = pts;
        }
        // móvil
        const mobileEl = document.querySelector(mpodSel);
        if (mobileEl) {
          mobileEl.classList.add('visible');
          const n = mobileEl.querySelector('.player-name'); if(n) n.textContent = displayName;
          const t = mobileEl.querySelector('.player-title'); if(t) t.textContent = charName;
          const pt = mobileEl.querySelector('.player-pts'); if(pt) pt.textContent = pts;
        }
      });
    }, 18000);

    const vipPoll = setInterval(async () => {
  const { data: vipUpdates } = await sbR
    .from('templo_players')
    .select('id, is_vip')
    .eq('is_vip', true);

  if (!vipUpdates?.length) return;

  vipUpdates.forEach(updated => {
    const fakePlayer = players.find(pl => pl.id === updated.id);
    if (!fakePlayer || fakePlayer.isVip) return;
    fakePlayer.isVip = true;
    document.querySelectorAll(`[data-uid="${updated.id}"]`).forEach(existingRow => {
      const newRow = buildRow(fakePlayer);
      existingRow.replaceWith(newRow);
    });
  });
}, 10000);

  // ── TU POSICIÓN real ──
const { data: { user } } = await sbR.auth.getUser();
if (user) {
  const myIdx = all.findIndex(p => p.id === user.id);
  if (myIdx !== -1) {
    const myPlayer = all[myIdx];

    // ── TRACKEO DE MISIONES: Top 1 / Top 3 / Top 10 ──
    const myPos = myIdx + 1;
    try {
      const { missionsService } = await import('../../../services/missions.service');
      if (myPos === 1)       await missionsService.trackProgress(user.id, 'weekly_top1',  1);
      if (myPos === 2)       await missionsService.trackProgress(user.id, 'weekly_top2',  1);
      if (myPos === 3)       await missionsService.trackProgress(user.id, 'weekly_top3',  1);
      if (myPos <= 10)       await missionsService.trackProgress(user.id, 'weekly_top10', 1);
    } catch(e) {
      console.warn('Misión ranking no trackeada:', e);
    }
    // ────────────────────────────────────────────────
    const myChar = getChar(myPlayer);
    const myName = profilesMap[myPlayer.id] || myPlayer.char_name || 'Templario';
    const myPts = myPlayer.weekly_points || 0;

    [
      { num: '.pc-rank-you .you-num', av: '.pc-rank-you .you-avatar', name: '.pc-rank-you .rank-name', pts: '.pc-rank-you .rank-pts', sub: '.pc-rank-you .rank-subtitle', bar: '.pc-rank-you' },
      { num: '#mp-ranking-you .you-num', av: '#mp-ranking-you .you-avatar', name: '#mp-ranking-you .rank-name', pts: '#mp-ranking-you .rank-pts', sub: '#mp-ranking-you .rank-subtitle', bar: '#mp-ranking-you' }
    ].forEach(s => {
      const q = sel => document.querySelector(sel);
      if (q(s.num))  q(s.num).textContent = myPos;
      if (q(s.av)) {
        const av = q(s.av);
        av.textContent = '';
        av.style.cssText += `;width:48px;height:48px;border-radius:50%;overflow:hidden;background:rgba(0,0,0,0.5)!important;border:2px solid ${myChar.accent}!important;box-shadow:0 0 16px ${myChar.accent}99;flex-shrink:0;`;
        spawnChar(av, myPlayer.char_variant||0, myPlayer.char_gender||'m', 48);
      }
      if (q(s.name)) q(s.name).textContent = myName;
      if (q(s.pts))  q(s.pts).textContent  = myPts + ' PTS';
      if (q(s.sub))  q(s.sub).textContent  = myChar.name;

      // ── Racha en la barra TU POSICIÓN ──
      const bar = q(s.bar);
      if (bar && !bar.querySelector('.you-streak-badge')) {
        const myStreak = myPlayer.streak || 0;
        if (myStreak >= 2) {
          const sc = myStreak >= 4 ? '#FF4757' : '#FF9500';
          const sb = document.createElement('div');
          sb.className = 'you-streak-badge';
          sb.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:1px;flex-shrink:0;`;
          sb.innerHTML = `
            <span style="font-size:.55rem;font-weight:800;font-family:'Cinzel',serif;letter-spacing:.12em;color:${sc};">EN RACHA</span>
            <span style="font-size:.75rem;font-weight:900;font-family:'Cinzel',serif;padding:1px 8px;border-radius:20px;background:${myStreak>=4?'rgba(255,71,87,.18)':'rgba(255,149,0,.15)'};border:1px solid ${sc};color:${sc};letter-spacing:.08em;animation:pulse 1.2s infinite;white-space:nowrap;">🔥×${myStreak}</span>
          `;
          const ptsEl = q(s.pts);
          if (ptsEl) ptsEl.parentNode.insertBefore(sb, ptsEl);
        }
      }
    });

    // ── Badge TÚ — inline profesional por zona ──
    const tuStyle = document.createElement('style');
    tuStyle.textContent = `
      .tu-badge {
        display:inline-flex; align-items:center;
        background:linear-gradient(135deg,#9b59b6,#6c3483);
        color:#fff; font-size:7px; font-weight:900;
        letter-spacing:1.8px; padding:2px 8px;
        border-radius:20px; text-transform:uppercase;
        box-shadow:0 0 10px #9b59b688;
        vertical-align:middle; margin-left:6px;
        animation:tuPulse 2s ease-in-out infinite;
        flex-shrink:0;
      }
      .tu-badge-block {
        display:block; width:fit-content;
        background:linear-gradient(135deg,#9b59b6,#6c3483);
        color:#fff; font-size:7px; font-weight:900;
        letter-spacing:1.8px; padding:2px 10px;
        border-radius:20px; text-transform:uppercase;
        box-shadow:0 0 10px #9b59b688;
        margin-top:3px;
        animation:tuPulse 2s ease-in-out infinite;
      }
      @keyframes tuPulse {
        0%,100% { box-shadow:0 0 8px #9b59b688; }
        50%      { box-shadow:0 0 18px #9b59b6cc, 0 0 6px #fff4; }
      }
        @keyframes vipSparkFloat {
  0%   { transform: translateY(0px) scale(1); opacity: 0.9; }
  50%  { transform: translateY(-18px) scale(1.3); opacity: 0.5; }
  100% { transform: translateY(-36px) scale(0.6); opacity: 0; }
}
      .you-badge {
        position:absolute !important;
        right:auto !important;
        left:50% !important;
        transform:translateX(-50%) !important;
        top:4px !important;
        font-size:7px !important;
        letter-spacing:1.5px !important;
        padding:2px 8px !important;
        white-space:nowrap;
      }
      .pc-rank-you, #mp-ranking-you {
        padding-top:18px !important;
      }
    `;
    document.head.appendChild(tuStyle);

    // 1. ELITE — badge debajo del nombre dentro de elite-info
    [
      ...document.querySelectorAll('.right-panel .elite-section .elite-row'),
      ...document.querySelectorAll('#mp-panels .elite-section .elite-row')
    ].forEach((row, i) => {
      const p = all[i];
      if (!p || p.id !== user.id) return;
      if (row.querySelector('.tu-badge-block')) return;
      const info = row.querySelector('.elite-info');
      if (!info) return;
      const b = document.createElement('span');
      b.className = 'tu-badge-block'; b.textContent = 'TÚ';
      info.appendChild(b);
    });

    // 2. RANKING rows — badge removido

    // 3. BANNER TU POSICIÓN — glow del color del personaje o VIP
    const myIsVip = myPlayer.is_vip === true;
    ['.pc-rank-you', '#mp-ranking-you'].forEach(sel => {
      const banner = document.querySelector(sel);
      if (!banner) return;

      if (myIsVip) {
        banner.style.cssText += `
          background: linear-gradient(90deg, rgba(79,195,247,0.12) 0%, rgba(10,40,80,0.55) 40%, rgba(79,195,247,0.1) 100%) !important;
          border-top: 1.5px solid rgba(79,195,247,0.8) !important;
          border-left: 1px solid rgba(79,195,247,0.4) !important;
          border-right: 1px solid rgba(79,195,247,0.4) !important;
          border-bottom: 1px solid rgba(79,195,247,0.2) !important;
          box-shadow: inset 0 0 40px rgba(79,195,247,0.08), 0 0 24px rgba(79,195,247,0.35), 0 0 48px rgba(79,195,247,0.12) !important;
          animation: vipRowAura 3s ease-in-out infinite !important;
          padding-bottom: 32px !important;
        `;

        // Nombre con shimmer VIP
        const nameEl = banner.querySelector('.rank-name');
        if (nameEl) {
          nameEl.style.cssText += `
            background: linear-gradient(135deg,#b3e5fc 0%,#ffffff 30%,#4fc3f7 50%,#e1f5fe 70%,#b3e5fc 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: vipRuneShimmer 3s linear infinite;
            font-weight: 900;
          `;
        }

        // Badge VIP encima
        const badge = banner.querySelector('.you-badge');
        if (badge) {
          badge.style.cssText += `
            background: linear-gradient(135deg,rgba(79,195,247,0.2),rgba(10,30,60,0.95)) !important;
            border: 1px solid rgba(79,195,247,0.8) !important;
            color: #4fc3f7 !important;
            box-shadow: 0 0 12px rgba(79,195,247,0.6) !important;
            letter-spacing: 2px;
          `;
        }

        // Línea superior brillante
        const topEdge = document.createElement('div');
        topEdge.style.cssText = `
          position:absolute;top:0;left:0;right:0;height:1px;
          background: linear-gradient(90deg,
            transparent 0%, rgba(79,195,247,0.2) 10%,
            rgba(185,220,255,0.9) 30%, rgba(79,195,247,1) 50%,
            rgba(185,220,255,0.9) 70%, rgba(79,195,247,0.2) 90%,
            transparent 100%);
          pointer-events:none;z-index:2;
        `;
        banner.appendChild(topEdge);

        // Esquinas VIP
        ['top-left','top-right','bottom-left','bottom-right'].forEach(corner => {
          const c = document.createElement('div');
          const isTop = corner.includes('top');
          const isLeft = corner.includes('left');
          c.style.cssText = `
            position:absolute;
            ${isTop ? 'top:-1px' : 'bottom:-1px'};
            ${isLeft ? 'left:0' : 'right:0'};
            width:8px;height:8px;
            border-${isTop?'top':'bottom'}:2px solid rgba(79,195,247,0.9);
            border-${isLeft?'left':'right'}:2px solid rgba(79,195,247,0.9);
            pointer-events:none;z-index:3;
            animation:vipCornerGlow 2.5s ease-in-out infinite;
            animation-delay:${isTop===isLeft?'0s':'1.25s'};
          `;
          banner.appendChild(c);
        });

        // Badge PROPO-PASS
        if (!banner.querySelector('.vip-you-badge')) {
          const vb = document.createElement('div');
          vb.className = 'vip-you-badge';
          vb.style.cssText = `
            position:absolute;bottom:7px;left:50%;transform:translateX(-50%);
            display:inline-flex;align-items:center;gap:3px;
            padding:2px 10px;border-radius:20px;
            background:rgba(10,30,60,0.9);
            border:1px solid rgba(79,195,247,0.7);
            color:#4fc3f7;font-size:8px;font-weight:900;
            font-family:'Cinzel',serif;letter-spacing:1px;
            white-space:nowrap;
            animation:vipBadgePulse 2.5s ease-in-out infinite;
          `;
          vb.textContent = '👑 PROPO-PASS +10%';
          banner.appendChild(vb);
        }

      } else {
        banner.style.cssText += `border:1px solid ${myChar.accent}!important;box-shadow:0 0 20px ${myChar.accent}55,inset 0 0 12px ${myChar.accent}22!important;`;
        const badge = banner.querySelector('.you-badge');
        if (badge) badge.style.cssText += `background:linear-gradient(135deg,#9b59b6,#6c3483);box-shadow:0 0 12px #9b59b699;letter-spacing:2px;`;
      }
    });

    // 4. PODIO — TÚ overlay absoluto, no desplaza nada
    [
      { podId: 'pod1', mpodId: 'mpod1', place: 0 },
      { podId: 'pod2', mpodId: 'mpod2', place: 1 },
      { podId: 'pod3', mpodId: 'mpod3', place: 2 },
    ].forEach(({ podId, mpodId, place }) => {
      // VIP effect para CUALQUIER VIP en podio
      if (all[place]?.is_vip) {
        [document.getElementById(podId), document.getElementById(mpodId)].forEach(el => {
          if (!el || el.querySelector('.vip-spark')) return;
          el.style.position = 'relative';
          el.style.overflow = 'visible';
          el.style.background = 'linear-gradient(180deg, rgba(79,195,247,0.18) 0%, rgba(10,40,80,0.55) 60%, rgba(79,195,247,0.08) 100%)';
          el.style.borderTop = '3px solid #4fc3f7';
          el.style.boxShadow = '0 0 30px rgba(79,195,247,0.5), 0 0 60px rgba(79,195,247,0.2), inset 0 0 40px rgba(79,195,247,0.08)';
          el.style.animation = 'vipDiamondPulse 2.5s ease-in-out infinite';
          if (!isMobileLow) {
            for (let pi = 0; pi < 6; pi++) {
              const spark = document.createElement('div');
              spark.className = 'vip-spark';
              const left = 10 + Math.random() * 80;
              const dur = 1.8 + Math.random() * 2;
              const delay = Math.random() * 2;
              const size = 3 + Math.random() * 4;
              spark.style.cssText = `position:absolute;left:${left}%;bottom:${10+Math.random()*30}%;width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(circle,#b3e5fc,#4fc3f7);box-shadow:0 0 ${size*2}px #4fc3f7,0 0 ${size*4}px rgba(79,195,247,0.5);pointer-events:none;z-index:5;animation:vipSparkFloat ${dur}s ease-in-out ${delay}s infinite;`;
              el.appendChild(spark);
            }
            ['left','right'].forEach(side => {
              const rune = document.createElement('div');
              rune.style.cssText = `position:absolute;top:6px;${side}:8px;font-size:10px;color:rgba(79,195,247,0.8);pointer-events:none;z-index:5;text-shadow:0 0 8px #4fc3f7;animation:vipCornerGlow 2s ease-in-out infinite;animation-delay:${side==='left'?'0s':'1s'};`;
              rune.textContent = '⬦';
              el.appendChild(rune);
            });
          }
        });
      }
      if (all[place]?.id !== user.id) return;
      [document.getElementById(podId), document.getElementById(mpodId)].forEach(el => {
        if (!el || el.querySelector('.tu-pod-badge')) return;
        // glow morado en la barra sin tocar layout
        el.style.outline = '2px solid #9b59b6';
        el.style.boxShadow = '0 0 24px #9b59b6bb, inset 0 0 16px #9b59b622';
        // badge absolutamente posicionado — no empuja nada
        el.style.position = 'relative';
        el.style.overflow = 'visible';
        // VIP podio effect
        if (all[place]?.is_vip) {
          el.style.background = 'linear-gradient(180deg, rgba(79,195,247,0.18) 0%, rgba(10,40,80,0.55) 60%, rgba(79,195,247,0.08) 100%)';
          el.style.borderTop = '3px solid #4fc3f7';
          el.style.boxShadow = '0 0 30px rgba(79,195,247,0.5), 0 0 60px rgba(79,195,247,0.2), inset 0 0 40px rgba(79,195,247,0.08)';
          el.style.animation = isMobileLow ? 'none' : 'vipDiamondPulse 2.5s ease-in-out infinite';
          if (!isMobileLow) {
            for (let pi = 0; pi < 6; pi++) {
              const spark = document.createElement('div');
              const left = 10 + Math.random() * 80;
              const dur = 1.8 + Math.random() * 2;
              const delay = Math.random() * 2;
              const size = 3 + Math.random() * 4;
              spark.style.cssText = `
                position:absolute;
                left:${left}%;
                bottom:${10 + Math.random()*30}%;
                width:${size}px;height:${size}px;
                border-radius:50%;
                background:radial-gradient(circle, #b3e5fc, #4fc3f7);
                box-shadow:0 0 ${size*2}px #4fc3f7, 0 0 ${size*4}px rgba(79,195,247,0.5);
                pointer-events:none;z-index:5;
                animation:vipSparkFloat ${dur}s ease-in-out ${delay}s infinite;
              `;
              el.appendChild(spark);
            }
            ['top-left','top-right'].forEach(pos => {
              const rune = document.createElement('div');
              const isLeft = pos.includes('left');
              rune.style.cssText = `
                position:absolute;top:6px;
                ${isLeft?'left:8px':'right:8px'};
                font-size:10px;color:rgba(79,195,247,0.8);
                pointer-events:none;z-index:5;
                text-shadow:0 0 8px #4fc3f7;
                animation:vipCornerGlow 2s ease-in-out infinite;
                animation-delay:${isLeft?'0s':'1s'};
              `;
              rune.textContent = isLeft ? '⬦' : '⬦';
              el.appendChild(rune);
            });
          }
        }
        

        const b = document.createElement('div');
        b.className = 'tu-pod-badge';
        b.textContent = '◆ TÚ ◆';
        b.style.cssText = `
          position:absolute;
          bottom:8px; left:50%; transform:translateX(-50%);
          background:linear-gradient(135deg,#9b59b6,#6c3483);
          color:#fff; font-size:9px; font-weight:900;
          letter-spacing:2.5px; padding:3px 14px;
          border-radius:20px; white-space:nowrap;
          box-shadow:0 0 16px #9b59b6cc, 0 2px 8px #0008;
          animation:tuPulse 2s ease-in-out infinite;
          pointer-events:none; z-index:20;
        `;
        el.appendChild(b);
      });
    });

  }
}
  }
)();

    // ── Scale to fit ──
    const DESIGN_WIDTH = 1000;
    const MOBILE_DESIGN_WIDTH = 460;

    function applyScale() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isPortrait = vw <= 767 && vh > vw;
      const isLandscapeMobile = vh <= 500 && vw > vh;
      const root = document.querySelector('.templo-root');
      const content = document.querySelector('.page-content');
      if (!content) return;

      // ── MÓVIL PORTRAIT: layout natural, scrolleable ──
      if (isPortrait) {
        content.removeAttribute('style');
        if (root) {
          root.style.width = '100%';
          root.style.minHeight = '100vh';
          root.style.height = 'auto';
          root.style.overflow = 'visible';
          root.style.overflowX = 'hidden';
        }
        const mpl = document.getElementById('mobilePortraitLayout');
        if (mpl) mpl.style.display = 'none';
        return;
      }

      // ── LANDSCAPE MÓVIL: scale to fit (pantalla chica) ──
      if (isLandscapeMobile) {
        const naturalH = content.scrollHeight || content.offsetHeight;
        if (!naturalH) { setTimeout(applyScale, 80); return; }
        const designW = MOBILE_DESIGN_WIDTH;
        content.style.transform = 'none';
        content.style.width = designW + 'px';
        content.style.height = 'auto';
        content.style.position = 'absolute';
        content.style.top = '0';
        content.style.left = '0';
        const scale = Math.min(vw / designW, vh / naturalH);
        const scaledW = designW * scale;
        const scaledH = naturalH * scale;
        content.style.transformOrigin = 'top left';
        content.style.transform = `scale(${scale})`;
        content.style.top = Math.max(0, (vh - scaledH) / 2) + 'px';
        content.style.left = Math.max(0, (vw - scaledW) / 2) + 'px';
        content.style.height = naturalH + 'px';
        if (root) {
          root.style.width = '100vw';
          root.style.height = '100vh';
          root.style.overflow = 'hidden';
          root.style.overflowX = 'hidden';
        }
        return;
      }

      // ── DESKTOP: solo aplica UNA vez; si ya está configurado, no toca nada ──
      if (content.dataset.desktopReady === '1') return;
      content.dataset.desktopReady = '1';
      content.removeAttribute('style');
      content.style.position = 'relative';
      content.style.width = '100%';
      content.style.maxWidth = DESIGN_WIDTH + 'px';
      content.style.margin = '0 auto';
      content.style.padding = '18px 20px 40px';
      content.style.overflow = 'visible';
      if (root) {
        root.style.width = '100%';
        root.style.minHeight = '100vh';
        root.style.height = 'auto';
        root.style.overflow = 'visible';
        root.style.overflowX = 'hidden';
      }
    }
    requestAnimationFrame(() => requestAnimationFrame(applyScale));
    window.addEventListener('load', applyScale);
    window.addEventListener('resize', applyScale);
    window.addEventListener('orientationchange', () => setTimeout(applyScale, 300));

    // ── Mobile landscape layout init ──
    (function() {
      const _isMobile = (window.innerHeight <= 500 && window.innerWidth > window.innerHeight);
      if (!_isMobile) return;

      const mainGrid = document.querySelector('.main-grid');
      if (!mainGrid) return;
      const podiumSec = mainGrid.querySelector('.podium-section');
      const rightPanel = mainGrid.querySelector('.right-panel');
      if (!podiumSec || !rightPanel) return;

      const mvcWrap = document.createElement('div');
      mvcWrap.id = 'mvcWrap';
      mvcWrap.className = 'mobile-vc-wrap';
      document.querySelectorAll('.hcf-slide img').forEach(img => {
        const slide = document.createElement('div');
        slide.className = 'mvc-slide';
        const im = new Image();
        im.src = img.src; im.alt = img.alt || '';
        slide.appendChild(im);
        mvcWrap.appendChild(slide);
      });

      const eliteEl = rightPanel.querySelector('.elite-section');
      const recompEl = rightPanel.querySelector('.recompensas-panel');
      let btnsDiv = null;
      Array.from(rightPanel.children).forEach(c => {
        if (!c.classList.contains('elite-section') && !c.classList.contains('recompensas-panel')) btnsDiv = c;
      });

      const panelsGrid = document.createElement('div');
      panelsGrid.className = 'mobile-panels-grid';
      panelsGrid.appendChild(eliteEl);
      panelsGrid.appendChild(recompEl);

      const btnsGrid = document.createElement('div');
      btnsGrid.className = 'mobile-btns-grid';
      if (btnsDiv) {
        Array.from(btnsDiv.querySelectorAll(':scope > div')).forEach(b => {
          b.style.cssText = 'margin:0;line-height:0;font-size:0;padding:0;';
          btnsGrid.appendChild(b);
        });
      }

      const rightCol = document.createElement('div');
      rightCol.className = 'mobile-right-col';
      rightCol.appendChild(panelsGrid);
      rightCol.appendChild(btnsGrid);

      mainGrid.innerHTML = '';
      mainGrid.appendChild(mvcWrap);
      mainGrid.appendChild(podiumSec);
      mainGrid.appendChild(rightCol);
      rightCol.style.marginTop = '0';

      const slides = Array.from(mvcWrap.querySelectorAll('.mvc-slide'));
      const total = slides.length;
      let cur = 0;

      function mvcClass(i) {
        const d = ((i - cur) % total + total) % total;
        if (d === 0)         return 'mvc-center';
        if (d === 1)         return 'mvc-bottom';
        if (d === total - 1) return 'mvc-top';
        if (d === 2)         return 'mvc-hidden-bottom';
        return 'mvc-hidden-top';
      }
      function mvcUpdate() { slides.forEach((s, i) => { s.className = 'mvc-slide ' + mvcClass(i); }); }
      function mvcNext() { cur = (cur + 1) % total; mvcUpdate(); }
      mvcUpdate();
      setInterval(mvcNext, 2800);

      function syncHeight() {
        const h = podiumSec.offsetHeight || 220;
        mvcWrap.style.height = h + 'px';
      }
      setTimeout(syncHeight, 120);
      window.addEventListener('resize', syncHeight);
      setTimeout(applyScale, 60);
    })();

    
    // ── Cleanup ──
    return () => {
      styleEl.remove();
      window.removeEventListener('resize', applyScale);
    };
  }, []);

  return (
  <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#030b1a' }}>
    {showPropoPassModal && (
      <PropoPassModal onClose={() => setShowPropoPassModal(false)} />
    )}
    
    <button
      onClick={() => navigate('/games/templarios-dijeron')}
      style={{
        position: 'fixed', top: 16, left: 16, zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(3,11,26,0.85)',
        border: '1px solid rgba(201,168,76,0.4)',
        borderRadius: 8, padding: '7px 14px',
        color: 'rgba(201,168,76,0.85)',
        fontFamily: 'Cinzel, serif', fontSize: 11,
        letterSpacing: 2, cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s',
        textTransform: 'uppercase',
      }}
      onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(201,168,76,0.9)'; e.currentTarget.style.color = '#c9a84c'; }}
      onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(201,168,76,0.4)'; e.currentTarget.style.color = 'rgba(201,168,76,0.85)'; }}
    >
      ← Volver al Juego
    </button>
    <div
      className="templo-root"
      style={{ height: 'auto', minHeight: '100vh', overflow: 'visible' }}
      dangerouslySetInnerHTML={{ __html: INNER_HTML }}
    />
  </div>
);
}