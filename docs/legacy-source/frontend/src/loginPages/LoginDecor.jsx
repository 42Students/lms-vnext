import { useEffect, useRef } from "react";

// Faint coding symbols behind the sign-in card (src/loginPages/Login.js): thin line icons (terminal, code window, chip,
// database, cloud, braces) and a few monospace tokens (=>, &&, f(x)...). Each drifts slowly on its own timing and shifts
// with the mouse by its depth (nearer ones move more), so the page has quiet depth without words.
// Decorative only: aria-hidden, no pointer events, still for prefers-reduced-motion, no mouse effect on touch screens.

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round" };

const ICONS = {
  terminal: (
    <svg viewBox="0 0 48 48" {...S}><rect x="5" y="9" width="38" height="30" rx="3.5" /><path d="M13 19l6 5-6 5M23 30h11" /></svg>
  ),
  window: (
    <svg viewBox="0 0 48 48" {...S}><rect x="5" y="8" width="38" height="32" rx="3.5" /><path d="M5 15h38" /><circle cx="10" cy="11.5" r="0.6" /><circle cx="13" cy="11.5" r="0.6" /><path d="M19 22l-5 5 5 5M29 22l5 5-5 5M26 20l-4 14" /></svg>
  ),
  braces: (
    <svg viewBox="0 0 48 48" {...S}><path d="M18 8c-4 0-5 2-5 5v6c0 3-2 5-4 5 2 0 4 2 4 5v6c0 3 1 5 5 5M30 8c4 0 5 2 5 5v6c0 3 2 5 4 5-2 0-4 2-4 5v6c0 3-1 5-5 5" /></svg>
  ),
  chip: (
    <svg viewBox="0 0 48 48" {...S}><rect x="13" y="13" width="22" height="22" rx="2.5" /><rect x="19" y="19" width="10" height="10" rx="1" /><path d="M19 7v6M24 7v6M29 7v6M19 35v6M24 35v6M29 35v6M7 19h6M7 24h6M7 29h6M35 19h6M35 24h6M35 29h6" /></svg>
  ),
  database: (
    <svg viewBox="0 0 48 48" {...S}><ellipse cx="24" cy="11" rx="14" ry="5" /><path d="M10 11v26c0 2.8 6.3 5 14 5s14-2.2 14-5V11" /><path d="M10 24c0 2.8 6.3 5 14 5s14-2.2 14-5" /></svg>
  ),
  cloud: (
    <svg viewBox="0 0 48 48" {...S}><path d="M14 36h20a8 8 0 0 0 1.2-15.9A11 11 0 0 0 14 18.5 8.8 8.8 0 0 0 14 36z" /><path d="M20 28l4-4 4 4M24 24v8" /></svg>
  ),
  tags: (
    <svg viewBox="0 0 48 48" {...S}><path d="M17 14 7 24l10 10M31 14l10 10-10 10M27 10l-6 28" /></svg>
  ),
};

// x/y in % of the page; size in px (icon box, or font size for tokens); depth = how far it follows the mouse.
// Kept off the middle band where the card sits.
const LAYOUT = [
  { icon: "terminal", x: 10, y: 22, size: 84, depth: 34, rot: -8, tone: "accent", dur: 13 },
  { icon: "braces", x: 22, y: 72, size: 76, depth: 22, rot: 6, tone: "ink", dur: 16, phone: true },
  { token: "=>", x: 6, y: 53, size: 34, depth: 14, rot: 0, tone: "ink", dur: 11 },
  { token: "f(x)", x: 27, y: 15, size: 28, depth: 10, rot: -6, tone: "ink", dur: 14 },
  { token: "&&", x: 15, y: 89, size: 30, depth: 28, rot: 0, tone: "accent", dur: 12 },
  { icon: "chip", x: 4, y: 37, size: 50, depth: 8, rot: 0, tone: "ink", dur: 17 },
  { icon: "window", x: 86, y: 19, size: 92, depth: 26, rot: 5, tone: "ink", dur: 15 },
  { icon: "database", x: 76, y: 76, size: 70, depth: 32, rot: -6, tone: "accent", dur: 12, phone: true },
  { icon: "cloud", x: 92, y: 52, size: 66, depth: 16, rot: 0, tone: "ink", dur: 13 },
  { token: "[ ]", x: 71, y: 9, size: 30, depth: 12, rot: 0, tone: "ink", dur: 17 },
  { icon: "tags", x: 91, y: 86, size: 58, depth: 20, rot: 0, tone: "ink", dur: 14 },
  { token: "//", x: 95, y: 30, size: 30, depth: 9, rot: 0, tone: "accent", dur: 18 }, // clear of the robot beside the card
  { token: "0 1", x: 34, y: 92, size: 24, depth: 18, rot: 0, tone: "ink", dur: 15 },
  { token: "λ", x: 64, y: 93, size: 32, depth: 24, rot: 0, tone: "ink", dur: 13 },
];

export default function LoginDecor() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return undefined;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia?.("(pointer: fine)").matches;
    if (reduce || !fine) return undefined;

    let frame = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    // Ease towards the pointer so the symbols glide rather than jump.
    const step = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.setProperty("--ln2-mx", cx.toFixed(4));
      el.style.setProperty("--ln2-my", cy.toFixed(4));
      frame = Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001 ? window.requestAnimationFrame(step) : 0;
    };
    const onMove = (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2; // -1 .. 1
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!frame) frame = window.requestAnimationFrame(step);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="ln2-decor" aria-hidden="true">
      {/* One soft halo of 42LMS teal behind the card, the same for every college. */}
      <div className="ln2-aurora">
        <span className="ln2-aurora__a" />
        <span className="ln2-aurora__b" />
      </div>
      {LAYOUT.map((s) => (
        <span
          key={s.icon || s.token}
          className={`ln2-decor__item ln2-decor__item--${s.tone}${s.token ? " ln2-decor__item--token" : ""}${s.phone ? " ln2-decor__item--phone" : ""}`}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            "--d": s.depth,
            ...(s.token ? { fontSize: s.size } : { width: s.size, height: s.size }),
          }}
        >
          <span className="ln2-decor__float" style={{ "--rot": `${s.rot}deg`, animationDuration: `${s.dur}s` }}>
            {s.token || ICONS[s.icon]}
          </span>
        </span>
      ))}
    </div>
  );
}
