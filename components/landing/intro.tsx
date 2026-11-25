"use client";

import { useEffect, useRef, useState } from "react";
import { LOGO } from "./intro-paths";
import "./intro.css";

const FLY_AT = 1300;

// [shape, class, delay in s]
const PIECES = [
  [LOGO.body, "rl-intro-r rl-ink", 0.1],
  [LOGO.head, "rl-intro-head rl-ink", 0.25],
  [LOGO.a, "rl-intro-pop rl-ink", 0.38],
  [LOGO.c, "rl-intro-pop rl-ink", 0.43],
  [LOGO.e, "rl-intro-pop rl-ink", 0.48],
  [LOGO.L, "rl-intro-link rl-accent", 0.58],
  [LOGO.I, "rl-intro-link rl-accent", 0.62],
  [LOGO.N, "rl-intro-link rl-accent", 0.66],
  [LOGO.K, "rl-intro-link rl-accent", 0.7],
] as const;

// logo pops in piece by piece, then flies to the header logo
export function Intro() {
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || done) return;
    let flying = false;

    const fly = (fast: boolean) => {
      if (flying) return;
      flying = true;
      el.getAnimations({ subtree: true }).forEach((a) =>
        (a as CSSAnimation).animationName === "rl-fallback" ? a.cancel() : a.finish(),
      );

      const target = [...document.querySelectorAll<HTMLElement>('header img[alt="RaceLink"]')].find((i) => i.offsetWidth > 0);
      const from = stage.current!.getBoundingClientRect();
      const to = target?.getBoundingClientRect();
      const ms = fast ? 400 : 650;

      if (target && to && to.top >= 0) {
        if (!document.documentElement.classList.contains("dark")) el.classList.add("rl-intro-light");
        target.style.visibility = "hidden";
        const s = to.height / from.height;
        stage.current!.animate(
          [{ transform: "none" }, { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${s})` }],
          { duration: ms, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" },
        );
        el.animate([{ backgroundColor: "#172340" }, { backgroundColor: "rgb(23 35 64 / 0)" }], {
          duration: ms * 0.8,
          delay: ms * 0.15,
          easing: "ease-out",
          fill: "forwards",
        }).onfinish = () => {
          target.style.visibility = "";
          setDone(true);
        };
      } else {
        el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: "forwards" }).onfinish = () => setDone(true);
      }
    };

    const first = el.getAnimations({ subtree: true }).find((a) => (a as CSSAnimation).animationName === "rl-r");
    const elapsed = Number(first?.currentTime ?? 0);
    const timer = window.setTimeout(() => fly(false), Math.max(0, FLY_AT - elapsed));

    const skip = () => fly(true);
    const opts = { once: true, passive: true } as const;
    const events = ["pointerdown", "keydown", "wheel", "touchmove"] as const;
    events.forEach((e) => window.addEventListener(e, skip, opts));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, skip));
    };
  }, [done]);

  if (done) return null;

  return (
    <div ref={root} aria-hidden className="rl-intro">
      <div ref={stage} className="rl-intro-stage">
        <svg viewBox="0 0 181 119" className="rl-intro-svg">
          <g fillRule="evenodd">
            {PIECES.map(([d, cls, delay]) => (
              <path key={d} d={d} className={cls} style={{ animationDelay: `${delay}s` }} />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
