// NetworkBackground.jsx — Fondo vivo del Templo del Propósito
// Geometría sagrada + runas + rayos dorados + constelaciones templarias
// Sin absolutas, 100% responsive

import { useEffect, useRef } from "react";

export default function NetworkBackground() {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, t = 0;

    // ── Paleta sagrada ──────────────────────────────────────────
    const GOLD   = { r: 212, g: 175, b: 55  };
    const PURPLE = { r: 124, g:  58, b: 237 };
    const SILVER = { r: 192, g: 192, b: 192 };
    const WHITE  = { r: 255, g: 255, b: 255 };

    const rgba = (c, a) => `rgba(${c.r},${c.g},${c.b},${a})`;
    const hex2 = (n) => Math.round(n * 255).toString(16).padStart(2, "0");

    // ── Resize ──────────────────────────────────────────────────
    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Runas templarias (paths SVG simplificados como líneas) ──
    const RUNE_SHAPES = [
      // Cruz de espadas
      (cx, cy, s) => [
        [cx - s, cy, cx + s, cy],
        [cx, cy - s, cx, cy + s],
        [cx - s * 0.6, cy - s * 0.6, cx + s * 0.6, cy + s * 0.6],
        [cx + s * 0.6, cy - s * 0.6, cx - s * 0.6, cy + s * 0.6],
      ],
      // Hexágono (⬡)
      (cx, cy, s) => Array.from({ length: 6 }, (_, i) => {
        const a1 = (i / 6) * Math.PI * 2 - Math.PI / 6;
        const a2 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 6;
        return [cx + Math.cos(a1) * s, cy + Math.sin(a1) * s,
                cx + Math.cos(a2) * s, cy + Math.sin(a2) * s];
      }),
      // Triángulo hacia arriba + hacia abajo (Estrella de David templaria)
      (cx, cy, s) => {
        const lines = [];
        for (let tri = 0; tri < 2; tri++) {
          const off = tri === 0 ? -Math.PI / 2 : Math.PI / 2;
          for (let i = 0; i < 3; i++) {
            const a1 = off + (i / 3) * Math.PI * 2;
            const a2 = off + ((i + 1) / 3) * Math.PI * 2;
            lines.push([cx + Math.cos(a1) * s, cy + Math.sin(a1) * s,
                        cx + Math.cos(a2) * s, cy + Math.sin(a2) * s]);
          }
        }
        return lines;
      },
      // Cruz de Malta simplificada
      (cx, cy, s) => [
        [cx - s, cy - s * 0.25, cx - s * 0.25, cy - s * 0.25],
        [cx - s * 0.25, cy - s * 0.25, cx - s * 0.25, cy - s],
        [cx + s * 0.25, cy - s, cx + s * 0.25, cy - s * 0.25],
        [cx + s * 0.25, cy - s * 0.25, cx + s, cy - s * 0.25],
        [cx + s, cy + s * 0.25, cx + s * 0.25, cy + s * 0.25],
        [cx + s * 0.25, cy + s * 0.25, cx + s * 0.25, cy + s],
        [cx - s * 0.25, cy + s, cx - s * 0.25, cy + s * 0.25],
        [cx - s * 0.25, cy + s * 0.25, cx - s, cy + s * 0.25],
      ],
      // Ojo (elipse + pupila)
      (cx, cy, s) => [
        ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
          const a1 = (i / 8) * Math.PI * 2;
          const a2 = ((i + 1) / 8) * Math.PI * 2;
          return [cx + Math.cos(a1) * s, cy + Math.sin(a1) * s * 0.45,
                  cx + Math.cos(a2) * s, cy + Math.sin(a2) * s * 0.45];
        }),
        [cx - s * 0.22, cy, cx + s * 0.22, cy],
        [cx, cy - s * 0.22, cx, cy + s * 0.22],
      ],
    ];

    // ── Clase Runa ───────────────────────────────────────────────
    class Rune {
      constructor() { this.spawn(); }
      spawn() {
        this.cx     = Math.random() * W;
        this.cy     = Math.random() * H;
        this.size   = (W * 0.018) + Math.random() * (W * 0.022);
        this.angle  = Math.random() * Math.PI * 2;
        this.vAngle = (Math.random() - 0.5) * 0.0008;
        this.alpha  = 0;
        this.targetAlpha = 0.04 + Math.random() * 0.06;
        this.phase  = "fadein"; // fadein | hold | fadeout
        this.holdTime = 300 + Math.random() * 500;
        this.shapeIdx = Math.floor(Math.random() * RUNE_SHAPES.length);
        this.color  = Math.random() > 0.5 ? GOLD : PURPLE;
        this.life   = 0;
        this.pulse  = Math.random() * Math.PI * 2;
      }
      update() {
        this.angle += this.vAngle;
        this.pulse  += 0.012;
        this.life++;
        if (this.phase === "fadein") {
          this.alpha += 0.0008;
          if (this.alpha >= this.targetAlpha) { this.alpha = this.targetAlpha; this.phase = "hold"; }
        } else if (this.phase === "hold") {
          if (this.life > this.holdTime) this.phase = "fadeout";
        } else {
          this.alpha -= 0.0006;
          if (this.alpha <= 0) this.spawn();
        }
      }
      draw() {
        const pulseMult = 1 + Math.sin(this.pulse) * 0.12;
        const s = this.size * pulseMult;
        const lines = RUNE_SHAPES[this.shapeIdx](0, 0, s);
        ctx.save();
        ctx.translate(this.cx, this.cy);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = rgba(this.color, 1);
        ctx.lineWidth   = 0.8;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = rgba(this.color, 0.5);
        lines.forEach(([x1, y1, x2, y2]) => {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        });
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }

    // ── Clase Estrella / nodo ────────────────────────────────────
    class Star {
      constructor(init = false) { this.reset(init); }
      reset(init = false) {
        this.x  = Math.random() * W;
        this.y  = Math.random() * H;
        this.vx = (Math.random() - 0.5) * 0.12;
        this.vy = (Math.random() - 0.5) * 0.12;
        this.r  = 0.5 + Math.random() * 1.8;
        this.pulse  = Math.random() * Math.PI * 2;
        this.pSpeed = 0.006 + Math.random() * 0.01;
        this.bright = Math.random() > 0.82;
        const roll  = Math.random();
        this.color  = roll > 0.6 ? GOLD : roll > 0.35 ? PURPLE : SILVER;
        if (init) this.pulse = Math.random() * Math.PI * 2;
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        this.pulse += this.pSpeed;
        if (this.x < -20) this.x = W + 20;
        if (this.x > W + 20) this.x = -20;
        if (this.y < -20) this.y = H + 20;
        if (this.y > H + 20) this.y = -20;
      }
      draw() {
        const p = 0.4 + Math.sin(this.pulse) * 0.35;
        const r = this.r * (0.8 + Math.sin(this.pulse) * 0.4);
        if (this.bright) {
          const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 5);
          grd.addColorStop(0,   rgba(this.color, p * 1.0));
          grd.addColorStop(0.3, rgba(this.color, p * 0.4));
          grd.addColorStop(1,   rgba(this.color, 0));
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(this.x, this.y, r * 5, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
          // Destellos en cruz
          ctx.globalAlpha = p * 0.6;
          ctx.strokeStyle = rgba(WHITE, 1);
          ctx.lineWidth   = 0.5;
          const cs = r * 6;
          ctx.beginPath();
          ctx.moveTo(this.x - cs, this.y); ctx.lineTo(this.x + cs, this.y);
          ctx.moveTo(this.x, this.y - cs); ctx.lineTo(this.x, this.y + cs);
          ctx.stroke();
          ctx.globalAlpha = p * 0.3;
          const cs2 = r * 4;
          ctx.beginPath();
          ctx.moveTo(this.x - cs2, this.y - cs2); ctx.lineTo(this.x + cs2, this.y + cs2);
          ctx.moveTo(this.x + cs2, this.y - cs2); ctx.lineTo(this.x - cs2, this.y + cs2);
          ctx.stroke();
        }
        ctx.globalAlpha = p * (this.bright ? 1 : 0.55);
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(this.bright ? WHITE : this.color, 1);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // ── Clase Rayo dorado (line de energía) ──────────────────────
    class GoldenRay {
      constructor() { this.spawn(); }
      spawn() {
        // Nace desde un borde aleatorio
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { this.x = Math.random() * W; this.y = -10; }
        else if (edge === 1) { this.x = W + 10; this.y = Math.random() * H; }
        else if (edge === 2) { this.x = Math.random() * W; this.y = H + 10; }
        else { this.x = -10; this.y = Math.random() * H; }
        this.tx = W * 0.2 + Math.random() * W * 0.6;
        this.ty = H * 0.2 + Math.random() * H * 0.6;
        const dx = this.tx - this.x;
        const dy = this.ty - this.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const spd = 0.6 + Math.random() * 0.8;
        this.vx = (dx / len) * spd;
        this.vy = (dy / len) * spd;
        this.trail = [];
        this.maxTrail = 28 + Math.floor(Math.random() * 20);
        this.alpha = 0.0;
        this.alive = true;
        this.width = 0.6 + Math.random() * 0.8;
        this.color = Math.random() > 0.35 ? GOLD : PURPLE;
      }
      update() {
        if (!this.alive) return;
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) this.trail.shift();
        this.x += this.vx; this.y += this.vy;
        this.alpha = Math.min(this.alpha + 0.04, 0.55);
        const dx = this.x - this.tx; const dy = this.y - this.ty;
        if (dx * dx + dy * dy < 100) { this.alive = false; }
        if (this.x < -50 || this.x > W + 50 || this.y < -50 || this.y > H + 50) this.alive = false;
      }
      draw() {
        if (this.trail.length < 2) return;
        for (let i = 1; i < this.trail.length; i++) {
          const t0 = this.trail[i - 1];
          const t1 = this.trail[i];
          const p  = i / this.trail.length;
          ctx.globalAlpha = p * this.alpha;
          ctx.strokeStyle = rgba(this.color, 1);
          ctx.lineWidth   = this.width * p;
          ctx.shadowBlur  = 6;
          ctx.shadowColor = rgba(this.color, 0.6);
          ctx.beginPath();
          ctx.moveTo(t0.x, t0.y);
          ctx.lineTo(t1.x, t1.y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur  = 0;
      }
    }

    // ── Clase Constelación (grupos de nodos conectados) ──────────
    class Constellation {
      constructor() { this.spawn(); }
      spawn() {
        this.cx = W * 0.1 + Math.random() * W * 0.8;
        this.cy = H * 0.1 + Math.random() * H * 0.8;
        const n = 4 + Math.floor(Math.random() * 4);
        const radius = W * 0.04 + Math.random() * W * 0.06;
        this.nodes = Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
          const r = radius * (0.5 + Math.random() * 0.6);
          return {
            ox: Math.cos(a) * r,
            oy: Math.sin(a) * r,
            pulse: Math.random() * Math.PI * 2,
            pSpeed: 0.008 + Math.random() * 0.008,
          };
        });
        this.angle = Math.random() * Math.PI * 2;
        this.vAngle = (Math.random() - 0.5) * 0.0004;
        this.alpha = 0;
        this.targetAlpha = 0.07 + Math.random() * 0.07;
        this.phase = "fadein";
        this.holdTime = 400 + Math.random() * 600;
        this.life = 0;
        this.color = Math.random() > 0.5 ? GOLD : PURPLE;
      }
      update() {
        this.angle += this.vAngle;
        this.life++;
        this.nodes.forEach(nd => nd.pulse += nd.pSpeed);
        if (this.phase === "fadein") {
          this.alpha += 0.0006;
          if (this.alpha >= this.targetAlpha) { this.alpha = this.targetAlpha; this.phase = "hold"; }
        } else if (this.phase === "hold") {
          if (this.life > this.holdTime) this.phase = "fadeout";
        } else {
          this.alpha -= 0.0005;
          if (this.alpha <= 0) this.spawn();
        }
      }
      draw() {
        const cos = Math.cos(this.angle), sin = Math.sin(this.angle);
        const pts = this.nodes.map(nd => ({
          x: this.cx + nd.ox * cos - nd.oy * sin,
          y: this.cy + nd.ox * sin + nd.oy * cos,
          pulse: nd.pulse,
        }));
        // Líneas entre nodos
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            const grd = ctx.createLinearGradient(pts[i].x, pts[i].y, pts[j].x, pts[j].y);
            grd.addColorStop(0, rgba(this.color, this.alpha * 0.9));
            grd.addColorStop(1, rgba(this.color, this.alpha * 0.3));
            ctx.globalAlpha = 1;
            ctx.strokeStyle = grd;
            ctx.lineWidth   = 0.7;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
        // Nodos
        pts.forEach(pt => {
          const pr = 1.5 + Math.sin(pt.pulse) * 0.7;
          const pa = this.alpha * (1.2 + Math.sin(pt.pulse) * 0.4);
          ctx.globalAlpha = Math.min(pa, 1);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pr, 0, Math.PI * 2);
          ctx.fillStyle = rgba(this.color, 1);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
    }

    // ── Clase Onda circular (pulso sagrado) ───────────────────────
    class SacredPulse {
      constructor() { this.spawn(); }
      spawn() {
        this.x     = W * 0.15 + Math.random() * W * 0.7;
        this.y     = H * 0.15 + Math.random() * H * 0.7;
        this.r     = 0;
        this.maxR  = W * 0.06 + Math.random() * W * 0.12;
        this.speed = 0.4 + Math.random() * 0.5;
        this.color = Math.random() > 0.5 ? GOLD : PURPLE;
        this.sides = Math.random() > 0.5 ? 6 : 0; // 6 = hexágono, 0 = círculo
        this.angle = Math.random() * Math.PI * 2;
      }
      update() {
        this.r += this.speed;
        if (this.r >= this.maxR) this.spawn();
      }
      draw() {
        const alpha = (1 - this.r / this.maxR) * 0.18;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = rgba(this.color, 1);
        ctx.lineWidth   = 0.8;
        if (this.sides === 6) {
          ctx.beginPath();
          for (let i = 0; i <= 6; i++) {
            const a = this.angle + (i / 6) * Math.PI * 2;
            const px = this.x + Math.cos(a) * this.r;
            const py = this.y + Math.sin(a) * this.r;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }

    // ── Instancias ───────────────────────────────────────────────
    const starCount  = Math.max(60, Math.floor(W * H / 14000));
    const stars      = Array.from({ length: starCount }, () => new Star(true));
    const runes      = Array.from({ length: 7 },  () => new Rune());
    const consts     = Array.from({ length: 5 },  () => new Constellation());
    const pulses     = Array.from({ length: 4 },  () => new SacredPulse());
    const rays       = [];
    let   nextRay    = 0;

    // ── Loop principal ───────────────────────────────────────────
    const loop = () => {
      t++;
      ctx.clearRect(0, 0, W, H);

      // Spawn rayos ocasionalmente
      if (t > nextRay) {
        rays.push(new GoldenRay());
        nextRay = t + 90 + Math.floor(Math.random() * 160);
      }

      // Actualizar y dibujar
      pulses.forEach(p => { p.update(); p.draw(); });
      consts.forEach(c => { c.update(); c.draw(); });
      runes.forEach(r  => { r.update(); r.draw(); });

      // Rayos
      for (let i = rays.length - 1; i >= 0; i--) {
        rays[i].update();
        rays[i].draw();
        if (!rays[i].alive && rays[i].trail.length === 0) rays.splice(i, 1);
      }

      stars.forEach(s => { s.update(); s.draw(); });

      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.72,
      }}
    />
  );
}