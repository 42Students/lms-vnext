// Pure analysis for the runtime style audit: takes computed-style samples collected in a browser
// and reports every value that is outside the design system. No browser or file access here.
import {
  BORDER_WIDTH_PX, FONT_SIZE_SCALE_PX, FONT_WEIGHTS, LETTER_SPACING, LINE_HEIGHT_PX, LINE_HEIGHT_UNITLESS,
  OPACITY, RADIUS_SCALE_PX, spacingOk,
} from "./ui-consistency-rules.mjs";

const px = (v) => (v.endsWith("px") ? Number(v.slice(0, -2)) : NaN);
const near = (a, b) => Math.abs(a - b) < 0.51;
const inScale = (set, n) => set.some((v) => near(v, n));

/** Parse hex colors out of the token stylesheet into a set of "r,g,b" keys. */
export function tokenRgbSet(css) {
  const set = new Set();
  for (const m of css.matchAll(/#([0-9a-fA-F]{6})\b/g)) {
    const h = m[1];
    set.add([0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(","));
  }
  for (const m of css.matchAll(/#([0-9a-fA-F]{3})\b/g)) set.add([...m[1]].map((c) => parseInt(c + c, 16)).join(","));
  set.add("255,255,255");
  set.add("0,0,0");
  return set;
}

/** "rgb(1, 2, 3)", "rgba(1,2,3,.5)" or "color(srgb 0.1 0.2 0.3 / 0.5)" to "r,g,b" (alpha ignored), or null for transparent. */
export function rgbKey(value) {
  if (!value || value === "transparent") return null;
  let m = /^rgba?\(\s*([0-9.]+)[ ,]+([0-9.]+)[ ,]+([0-9.]+)(?:[ ,/]+([0-9.]+%?))?\s*\)$/.exec(value);
  if (m) {
    if (m[4] !== undefined && Number(m[4].replace("%", "")) === 0) return null;
    return [m[1], m[2], m[3]].map((x) => Math.round(Number(x))).join(",");
  }
  m = /^color\(srgb\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\)$/.exec(value);
  if (m) {
    if (m[4] !== undefined && Number(m[4]) === 0) return null;
    return [m[1], m[2], m[3]].map((x) => Math.round(Number(x) * 255)).join(",");
  }
  return `unparsed:${value}`;
}

const SCALES = {
  fontSize: (v) => inScale(FONT_SIZE_SCALE_PX, px(v)),
  fontWeight: (v) => inScale(FONT_WEIGHTS, Number(v)),
  lineHeight: (v) => v === "normal" || inScale(LINE_HEIGHT_PX, px(v)) || LINE_HEIGHT_UNITLESS.some((u) => near(u * 1, Number(v))),
  letterSpacing: (v) => v === "normal" || LETTER_SPACING.some((s) => (s === "0" ? px(v) === 0 : s.endsWith("px") ? near(parseFloat(s), px(v)) : true)),
  borderRadius: (v) => v.split(" ").every((p) => p.endsWith("%") || inScale(RADIUS_SCALE_PX, px(p)) || px(p) > 500),
  borderWidth: (v) => inScale(BORDER_WIDTH_PX, px(v)),
  opacity: (v) => inScale(OPACITY, Number(v) * 100) || OPACITY.some((o) => near(o, Number(v))),
  spacing: (v) => spacingOk(Math.round(px(v))),
};

export const AUDITED = Object.keys(SCALES).concat(["fontFamily", "color", "boxShadow", "zIndex", "motion"]);

/**
 * samples: [{ route, role, selector, style: { fontSize, fontWeight, ... } }]
 * options: { tokenColors:Set, motionTokens:number[] (ms), shadowTokens:string[] (computed), zTokens:number[] }
 */
export function auditSamples(samples, options) {
  const findings = new Map();
  const add = (kind, value, sample) => {
    const key = `${kind}|${value}`;
    const f = findings.get(key) ?? { kind, value, count: 0, routes: new Set(), examples: [] };
    f.count++;
    f.routes.add(sample.route);
    if (f.examples.length < 3) f.examples.push(`${sample.route} ${sample.selector}`);
    findings.set(key, f);
  };
  for (const s of samples) {
    const st = s.style;
    if (st.fontSize && !SCALES.fontSize(st.fontSize)) add("fontSize", st.fontSize, s);
    if (st.fontWeight && !SCALES.fontWeight(st.fontWeight)) add("fontWeight", st.fontWeight, s);
    if (st.lineHeight && !SCALES.lineHeight(st.lineHeight)) add("lineHeight", st.lineHeight, s);
    if (st.letterSpacing && !SCALES.letterSpacing(st.letterSpacing)) add("letterSpacing", st.letterSpacing, s);
    if (st.borderRadius && !SCALES.borderRadius(st.borderRadius)) add("borderRadius", st.borderRadius, s);
    for (const w of st.borderWidths ?? []) if (px(w) > 0 && !SCALES.borderWidth(w)) add("borderWidth", w, s);
    if (st.opacity && st.opacity !== "1" && !SCALES.opacity(st.opacity)) add("opacity", st.opacity, s);
    for (const sp of st.spacings ?? []) if (!Number.isNaN(px(sp)) && !SCALES.spacing(sp)) add("spacing", sp, s);
    if (st.fontFamily) {
      const first = st.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      if (!/^(Inter|JetBrains Mono|ui-monospace|__Inter|__JetBrains)/i.test(first) && !/^__/.test(first)) add("fontFamily", first, s);
    }
    for (const c of [st.color, st.backgroundColor, ...(st.borderColors ?? [])]) {
      const k = rgbKey(c);
      if (k && !options.tokenColors.has(k)) add("color", k.startsWith("unparsed:") ? k : `rgb(${k})`, s);
    }
    if (st.boxShadow && st.boxShadow !== "none" && !options.shadowTokens.includes(st.boxShadow)) add("boxShadow", st.boxShadow.slice(0, 80), s);
    if (st.zIndex && st.zIndex !== "auto" && Number(st.zIndex) > 9 && !options.zTokens.includes(Number(st.zIndex))) add("zIndex", st.zIndex, s);
    for (const d of st.durations ?? []) {
      const ms = d.endsWith("ms") ? parseFloat(d) : parseFloat(d) * 1000;
      if (ms > 0.02 && !options.motionTokens.some((t) => near(t, ms))) add("motion", d, s);
    }
  }
  return [...findings.values()]
    .map((f) => ({ ...f, routes: [...f.routes] }))
    .sort((a, b) => b.count - a.count);
}

export function summarize(findings) {
  const byKind = {};
  for (const f of findings) byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
  return { distinctOffSystemValues: findings.length, byKind };
}
