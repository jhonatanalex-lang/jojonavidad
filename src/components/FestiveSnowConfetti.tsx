import React, { useEffect, useRef } from 'react';

interface FestiveSnowConfettiProps {
  triggerKey: number;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  kind: 'snow' | 'confetti';
  color: string;
  rotation: number;
  rotationSpeed: number;
  swayPhase: number;
  swaySpeed: number;
  swayAmp: number;
  tiltPhase: number;
  tiltSpeed: number;
  opacity: number;
}

const CONFETTI_COLORS_LIGHT = [
  '#2F4E49', // Matte Pine Teal
  '#D96857', // Warm Coral Terracotta
  '#E5B05E', // Copper Gold
  '#4B7A71', // Frosted Spruce
  '#F2D5A0', // Sugar Cream Gold
];

const CONFETTI_COLORS_DARK = [
  '#F2D5A0', // Warm Cream Gold
  '#DE705E', // Festive Coral
  '#5A9186', // Soft Spruce
  '#FFFBF4', // Sugar Snow
  '#E5B05E', // Copper Gold
];

const DURATION_MS = 3800;

export const FestiveSnowConfetti: React.FC<FestiveSnowConfettiProps> = ({
  triggerKey,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (triggerKey <= 0) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      onComplete?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains('dark');
    const palette = isDark ? CONFETTI_COLORS_DARK : CONFETTI_COLORS_LIGHT;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const count = width < 640 ? 75 : 105;
    const particles: Particle[] = Array.from({ length: count }, (_, i) => {
      const isSnow = i % 2 === 0;
      return {
        x: Math.random() * width,
        y: -20 - Math.random() * Math.min(height * 0.45, 280),
        vx: (Math.random() - 0.5) * 0.6,
        vy: isSnow ? 1.8 + Math.random() * 1.9 : 2.3 + Math.random() * 2.5,
        size: isSnow ? 3.5 + Math.random() * 4.5 : 5 + Math.random() * 5,
        kind: isSnow ? 'snow' : 'confetti',
        color: isSnow
          ? '#FFFFFF'
          : palette[i % palette.length],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.08,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.02 + Math.random() * 0.025,
        swayAmp: isSnow ? 0.8 + Math.random() * 0.9 : 0.6 + Math.random() * 0.8,
        tiltPhase: Math.random() * Math.PI * 2,
        tiltSpeed: 0.06 + Math.random() * 0.08,
        opacity: isSnow ? 0.85 + Math.random() * 0.15 : 0.9,
      };
    });

    const startTime = performance.now();
    let lastTime = startTime;
    let rafId = 0;

    const drawSnowflake = (p: Particle, alpha: number) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;

      // Soft warm-silver ring so white snow stands out crisply on #FAF8F5 alabaster
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(20, 69, 47, 0.22)';
      ctx.shadowBlur = 4;
      ctx.fill();

      ctx.lineWidth = 0.75;
      ctx.strokeStyle = 'rgba(20, 69, 47, 0.16)';
      ctx.stroke();

      ctx.restore();
    };

    const drawConfetti = (p: Particle, alpha: number) => {
      const tiltScale = Math.cos(p.tiltPhase);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(1, Math.max(0.25, Math.abs(tiltScale)));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      const w = p.size * 1.45;
      const h = p.size * 0.75;
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 1.5);
        ctx.fill();
      } else {
        ctx.fillRect(-w / 2, -h / 2, w, h);
      }
      ctx.restore();
    };

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const dt = Math.min((now - lastTime) / 16.67, 2.5);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Gentle fade out in the last 900ms
      const fadeProgress =
        elapsed > DURATION_MS - 900
          ? Math.max(0, 1 - (elapsed - (DURATION_MS - 900)) / 900)
          : 1;

      let anyVisible = false;

      for (const p of particles) {
        p.swayPhase += p.swaySpeed * dt;
        p.tiltPhase += p.tiltSpeed * dt;
        p.rotation += p.rotationSpeed * dt;

        p.x += (p.vx + Math.sin(p.swayPhase) * p.swayAmp) * dt;
        p.y += p.vy * dt;

        if (p.y < height + 30) {
          anyVisible = true;
        }

        const alpha = p.opacity * fadeProgress;
        if (alpha <= 0.01) continue;

        if (p.kind === 'snow') {
          drawSnowflake(p, alpha);
        } else {
          drawConfetti(p, alpha);
        }
      }

      if (elapsed < DURATION_MS && anyVisible) {
        rafId = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, width, height);
        onComplete?.();
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [triggerKey, onComplete]);

  if (triggerKey <= 0) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-50 pointer-events-none"
    />
  );
};
