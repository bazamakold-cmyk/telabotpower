"use client";

import { useEffect, useRef } from "react";

export function ParticlePlexus() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = ref.current;
    if (!canvasEl) return;
    const context = canvasEl.getContext("2d");
    if (!context) return;
    const cv: HTMLCanvasElement = canvasEl;
    const c: CanvasRenderingContext2D = context;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const count = 48;
    const pts = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0006,
      vy: (Math.random() - 0.5) * 0.0006,
    }));
    let w = 0;
    let h = 0;
    let raf = 0;

    function resize() {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = w * DPR;
      cv.height = h * DPR;
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function draw() {
      c.clearRect(0, 0, w, h);
      const px = pts.map((p) => ({ x: p.x * w, y: p.y * h }));
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = px[i].x - px[j].x;
          const dy = px[i].y - px[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 120) {
            c.strokeStyle = `rgba(0,255,102,${0.12 * (1 - d / 120)})`;
            c.beginPath();
            c.moveTo(px[i].x, px[i].y);
            c.lineTo(px[j].x, px[j].y);
            c.stroke();
          }
        }
      }
      c.fillStyle = "rgba(0,255,102,0.7)";
      for (const p of px) {
        c.beginPath();
        c.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        c.fill();
      }
    }

    function tick() {
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
      }
      draw();
      raf = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    if (reduced) draw();
    else raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 size-full" />;
}
