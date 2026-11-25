"use client";

import { useEffect, useRef } from "react";

// Halftone runner on a running track, same dot look as Downloads/run.jpg, drawn live.
// Each frame: draw a soft scene on a small offscreen canvas (runner in the RED channel,
// track in the GREEN channel), then sample it on a grid and paint one dot per cell,
// sized by brightness. Runner dots use the text color, track dots use the brand red.

const SAMPLE = 140; // offscreen canvas size
const GRID = 68; // dots per row
const STRIDE_S = 0.68; // seconds per full stride
const TRACK_SPEED = 95; // scene units per second the track slides by
const GROUND = 80; // y where the feet land (scene is 100x100)

type P = [number, number];

// angle in degrees from straight down, positive = forward (to the right)
const at = (p: P, len: number, deg: number): P => {
  const r = (deg * Math.PI) / 180;
  return [p[0] + len * Math.sin(r), p[1] + len * Math.cos(r)];
};

function pose(phase: number) {
  // lowest on the stance phase, highest in the flight phase
  const bob = -2 * Math.abs(Math.sin(phase)) + 1;
  const hip: P = [40, 46 + bob];
  const lean = 20;
  // torso stops short; the head floats with a clear gap above it
  const neck = at(hip, 17.5, 180 - lean);
  const shoulder = at(hip, 15.5, 180 - lean);
  const head = at(hip, 32, 180 - lean + 4);

  const leg = (o: number): P[] => {
    const thigh = 14 + 46 * Math.sin(phase + o);
    // knee folds while the leg swings forward, straightens while it pushes back
    const knee = 8 + 92 * Math.max(0, Math.cos(phase + o));
    const k = at(hip, 17.5, thigh);
    const ankle = at(k, 17, thigh - knee);
    // short foot, pointing forward
    return [hip, k, ankle, at(ankle, 4.5, thigh - knee + 95)];
  };
  // arms swing opposite their own-side leg, elbows bent, hands stay below the chin
  const arm = (o: number): P[] => {
    const upper = 2 - 48 * Math.sin(phase + o);
    const e = at(shoulder, 12.5, upper);
    return [shoulder, e, at(e, 11, upper + 82)];
  };

  return { hip, neck, head, near: { leg: leg(0), arm: arm(0) }, far: { leg: leg(Math.PI), arm: arm(Math.PI) } };
}

function drawTrack(ctx: CanvasRenderingContext2D, travel: number, runnerX: number) {
  const s = SAMPLE / 100;
  const g = (v: number) => `rgb(0,${v},0)`;
  // track surface: a dim band so it reads as a field of small dots
  ctx.fillStyle = g(70);
  ctx.fillRect(0, (GROUND + 1) * s, SAMPLE, 19 * s);
  // lane lines, spaced wider toward the viewer for a bit of depth
  ctx.strokeStyle = g(255);
  for (const [y, w] of [
    [GROUND + 1, 1.3],
    [GROUND + 7, 1.6],
    [GROUND + 15, 2],
  ] as const) {
    ctx.lineWidth = w * s;
    ctx.beginPath();
    ctx.moveTo(0, y * s);
    ctx.lineTo(SAMPLE, y * s);
    ctx.stroke();
  }
  // slanted lane markers that slide past, so the runner reads as moving forward
  ctx.lineWidth = 2.2 * s;
  ctx.strokeStyle = g(210);
  const gap = 34;
  const off = travel % gap;
  for (let x = -gap - off; x < 100 + gap; x += gap) {
    ctx.beginPath();
    ctx.moveTo((x + 3) * s, (GROUND + 2.5) * s);
    ctx.lineTo(x * s, (GROUND + 5.5) * s);
    ctx.moveTo((x + 10) * s, (GROUND + 9) * s);
    ctx.lineTo((x + 5) * s, (GROUND + 13.5) * s);
    ctx.stroke();
  }
  // contact shadow under the runner (a gap in the track dots)
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse((runnerX + 4) * s, (GROUND + 2.5) * s, 15 * s, 2.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawRunner(ctx: CanvasRenderingContext2D, phase: number) {
  const s = SAMPLE / 100;
  const p = pose(phase);
  const r = (v: number) => `rgb(${v},0,0)`;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const limb = (pts: P[], width: number, shade: number) => {
    ctx.strokeStyle = r(shade);
    ctx.lineWidth = width * s;
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * s, pts[0][1] * s);
    for (const q of pts.slice(1)) ctx.lineTo(q[0] * s, q[1] * s);
    ctx.stroke();
  };

  // far side first and dimmer, for depth like the halftone in the jpeg
  limb(p.far.leg, 7, 140);
  limb(p.far.arm, 5.5, 140);
  limb([p.hip, p.neck], 10, 255);
  limb(p.near.leg, 7.5, 255);
  // head: separate round dot, not joined to the body
  ctx.fillStyle = r(255);
  ctx.beginPath();
  ctx.arc(p.head[0] * s, p.head[1] * s, 6.2 * s, 0, Math.PI * 2);
  ctx.fill();
  limb(p.near.arm, 6, 255);
}

export function RunnerStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const off = document.createElement("canvas");
    off.width = off.height = SAMPLE;
    const octx = off.getContext("2d", { willReadFrequently: true });
    if (!ctx || !octx) return;

    const canBlur = "filter" in octx;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ink = "#172340";
    let red = "#4757b8";
    let size = 0;
    let raf = 0;
    let visible = true;

    const readColors = () => {
      const css = getComputedStyle(document.documentElement);
      ink = css.getPropertyValue("--foreground").trim() || ink;
      red = css.getPropertyValue("--link").trim() || red;
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = canvas.clientWidth;
      canvas.width = canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = (seconds: number) => {
      const phase = ((seconds / STRIDE_S) % 1) * Math.PI * 2;
      octx.globalCompositeOperation = "source-over";
      octx.filter = "none";
      octx.fillStyle = "#000";
      octx.fillRect(0, 0, SAMPLE, SAMPLE);
      if (canBlur) octx.filter = `blur(${SAMPLE * 0.012}px)`;
      drawTrack(octx, seconds * TRACK_SPEED, pose(phase).hip[0]);
      // runner adds into the red channel without wiping the track
      octx.globalCompositeOperation = "lighter";
      drawRunner(octx, phase);
      if (canBlur) octx.filter = "none";
      const data = octx.getImageData(0, 0, SAMPLE, SAMPLE).data;

      ctx.clearRect(0, 0, size, size);
      const cell = size / GRID;
      const runnerDots = new Path2D();
      const trackDots = new Path2D();
      for (let j = 0; j < GRID; j++) {
        const sy = Math.floor(((j + 0.5) / GRID) * SAMPLE);
        for (let i = 0; i < GRID; i++) {
          const sx = Math.floor(((i + 0.5) / GRID) * SAMPLE);
          const k = (sy * SAMPLE + sx) * 4;
          const body = data[k] / 255;
          // fade the track out toward the sides and bottom so it melts into the page
          const u = (i + 0.5) / GRID;
          const v = ((j + 0.5) / GRID) * 100;
          const sideFade = Math.min(1, u / 0.3, (1 - u) / 0.3);
          const bottomFade = Math.min(1, Math.max(0, (100 - v) / 14));
          const track = (data[k + 1] / 255) * sideFade * sideFade * (3 - 2 * sideFade) * bottomFade;
          const isBody = body > 0.08 && body >= track * 0.8;
          const b = isBody ? body : track;
          if (b < 0.08) continue;
          const rad = cell * 0.56 * Math.pow(b, 0.75);
          const x = (i + 0.5) * cell;
          const y = (j + 0.5) * cell;
          const path = isBody ? runnerDots : trackDots;
          path.moveTo(x + rad, y);
          path.arc(x, y, rad, 0, Math.PI * 2);
        }
      }
      ctx.fillStyle = red;
      ctx.fill(trackDots);
      ctx.fillStyle = ink;
      ctx.fill(runnerDots);
    };

    const start = performance.now();
    const tick = (now: number) => {
      render((now - start) / 1000);
      if (visible) raf = requestAnimationFrame(tick);
    };
    const play = () => {
      cancelAnimationFrame(raf);
      if (still) render(STRIDE_S / 6); // one mid-stride pose
      else raf = requestAnimationFrame(tick);
    };

    readColors();
    resize();
    play();

    // follow the light/dark toggle
    const themeObs = new MutationObserver(() => {
      readColors();
      if (still) play();
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const ro = new ResizeObserver(() => {
      resize();
      if (still) play();
    });
    ro.observe(canvas);
    // stop drawing while scrolled away
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) play();
      else cancelAnimationFrame(raf);
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      themeObs.disconnect();
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div className="relative mx-auto aspect-square w-[min(100%,32rem,calc(100svh-10rem))]">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Halftone illustration of a runner sprinting along a running track"
        className="absolute inset-0 size-full"
      />
    </div>
  );
}
