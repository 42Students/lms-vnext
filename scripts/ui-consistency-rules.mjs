// UI consistency rules: one place that defines what "consistent" means.
// Scale values must stay in sync with src/app/globals.css tokens.
export const FONT_SIZE_SCALE_PX = [12, 13, 14, 16, 18, 20, 24, 30, 36, 48, 64];
export const RADIUS_SCALE_PX = [0, 2, 4, 6, 8, 10, 12, 14, 18, 20, 999];
export const FONT_WEIGHTS = [400, 500, 600, 700];
export const LINE_HEIGHT_PX = [16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 48];
export const LINE_HEIGHT_UNITLESS = [1, 1.25, 1.3, 1.4, 1.5, 1.6];
export const LETTER_SPACING = ["-0.02em", "0", "0.2px", "0.05em", "0.08em", "0.16em"];
export const BORDER_WIDTH_PX = [0, 1, 2];
export const OPACITY = [0, 0.1, 0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 1];
export const MIN_BREAKPOINTS_PX = [640, 768, 992, 1280];
export const Z_LITERAL_OK = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // local stacking inside a component
export const MOTION_LITERAL_OK = ["0s", "0ms", "0.01ms"];

const TOKEN_FILES = new Set(["src/app/globals.css", "src/components/ui/branding-color-tokens.ts"]);
const MOTION_FILE = "src/styles/motion.css";
const SHARED_CONTROL_DIR = "src/components/ui/";

export const RULES = {
  "raw-control": "Use the shared Button/Input/Select/Textarea/Table/PageHeader instead of raw <button>/<input>/<select>/<textarea>/<table>/<h1>.",
  "raw-heading": "Use the shared Heading instead of raw <h2>-<h6>.",
  "raw-link": "Use the shared TextLink instead of a raw <a>.",
  "raw-image": "Use the shared Img/Avatar instead of a raw <img>.",
  "link-bare": 'TextLink variant="bare" has no standard look. Use TextLink, ButtonLink, or a real component.',
  "button-bare": 'Button variant="bare" has no standard look. Use primary/secondary/ghost/danger/link/chip/menu-item.',
  "hex-color": "Use a --lms-* color token instead of a hex literal.",
  "color-literal": "Use a --lms-* color token instead of rgb()/hsl()/named colors.",
  "palette-class": "Use a themed color class or --lms token instead of a Tailwind palette color (slate-500, white, black ...).",
  "font-size-off-scale": `Font sizes must be one of ${FONT_SIZE_SCALE_PX.join("/")}px.`,
  "font-family-off": "Use the Inter stack (var(--font-inter)), inherit, or the mono token; no other families.",
  "font-weight-off-scale": `Font weights must be one of ${FONT_WEIGHTS.join("/")}.`,
  "line-height-off-scale": `Line height must be one of ${LINE_HEIGHT_UNITLESS.join("/")} or ${LINE_HEIGHT_PX.join("/")}px.`,
  "letter-spacing-off-scale": `Letter spacing must be one of ${LETTER_SPACING.join("/")} or a named tracking-* class.`,
  "radius-off-scale": `Border radius must be one of ${RADIUS_SCALE_PX.join("/")}px (or 50%).`,
  "border-width-off-scale": `Border width must be one of ${BORDER_WIDTH_PX.join("/")}px.`,
  "opacity-off-scale": `Opacity must be one of ${OPACITY.join("/")}.`,
  "spacing-off-grid": "Padding, margin and gap must be on the 4px grid (plus 2px and 6px).",
  "shadow-literal": "Use a --lms-shadow-*/--lms-elevation-* token (or the named shadow-sm/md/lg/xl), not a shadow literal.",
  "z-index-literal": "Use a --lms-z-* token instead of a numeric z-index.",
  "important": "Do not use !important; fix the cascade or the component API.",
  "breakpoint-off": `Use the named breakpoints (sm/md/lg/xl and max-*), or media queries at ${MIN_BREAKPOINTS_PX.join("/")}px.`,
  "motion-literal": "Use --lms-motion-* durations/easings, not literals.",
  "size-off-grid": "Width, height, offsets and insets must be on the 4px grid (plus 1, 2 and 6px).",
  "focus-style-off": "Use the shared focus-ring / focus-ring-inset / focus-ring-error utility, not custom outline or ring classes.",
  "icon-size-off": "SVG icons must be 12, 14, 16, 18, 20, 24 or 32px.",
  "keyframes-local": "Define @keyframes only in src/styles/motion.css.",
};

// ---------- helpers ----------
const ALLOW_HEX_MARKER = "ui-consistency-allow-hex";
function hasAllowMarker(source, index) {
  const start = source.lastIndexOf("\n", index - 1) + 1;
  const prevStart = source.lastIndexOf("\n", start - 2) + 1;
  const end = source.indexOf("\n", index);
  return source.slice(prevStart, end === -1 ? source.length : end).includes(ALLOW_HEX_MARKER);
}
function lineOf(source, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (source.charCodeAt(i) === 10) line++;
  return line;
}
function blankComments(source, isCss) {
  const keep = (m) => m.replace(/[^\n]/g, " ");
  let out = source.replace(/\/\*[\s\S]*?\*\//g, keep);
  if (!isCss) out = out.replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, p) => p + keep(m.slice(p.length)));
  return out;
}
const num = (s) => Number(s);
const inSet = (set, n) => set.some((v) => Math.abs(v - n) < 1e-9);
const px = (value, unit) => (unit === "rem" ? value * 16 : value);
export const spacingOk = (n) => {
  const a = Math.abs(n);
  return a === 0 || a === 1 || a === 2 || a === 6 || a % 4 === 0;
};
function normEm(v) {
  const m = /^(-?)(\d*\.?\d+)(em|px)?$/.exec(v.trim());
  if (!m) return v;
  const n = Number(m[2]) * (m[1] ? -1 : 1);
  return n === 0 ? "0" : `${n}${m[3] ?? ""}`;
}
const NAMED_COLORS = "white|black|red|blue|green|gray|grey|orange|yellow|purple|pink|silver|maroon|navy|teal|aqua|lime|fuchsia|olive|brown|cyan|magenta|gold|indigo|violet|crimson";
const PALETTE = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_PROPS = "color|background|background-color|border|border-color|border-top|border-right|border-bottom|border-left|border-top-color|border-right-color|border-bottom-color|border-left-color|outline|outline-color|fill|stroke|caret-color|text-decoration-color|accent-color|column-rule";

const camelToKebab = (s) => s.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

// Turn the inside of style={{ ... }} objects into css-like declarations so the css checks apply.
function styleObjectsToCss(source) {
  const out = [];
  let from = 0;
  for (;;) {
    const i = source.indexOf("style={{", from);
    if (i === -1) break;
    let depth = 0, j = i + "style=".length;
    for (; j < source.length; j++) {
      const ch = source[j];
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) break; }
    }
    const body = source.slice(i + "style={{".length, j);
    for (const m of body.matchAll(/([A-Za-z]+)\s*:\s*("[^"]*"|'[^']*'|`[^`]*`|-?[0-9.]+)\s*(?=,|$|\})/g)) {
      let v = m[2];
      if (/^["'`]/.test(v)) v = v.slice(1, -1);
      else v = `${v}${["opacity", "zIndex", "fontWeight", "lineHeight", "flex", "order"].includes(m[1]) ? "" : "px"}`;
      out.push([camelToKebab(m[1]), v, i + m.index]);
    }
    from = j + 1;
  }
  return out;
}

function declarationsOf(source) {
  const decls = [];
  for (const m of source.matchAll(/(?:^|[;{\s"'`])([a-z][a-z-]*)\s*:\s*([^;{}"'`\n]+)/g)) decls.push([m[1], m[2].trim(), m.index + m[0].indexOf(m[1])]);
  return decls;
}

// ---------- scanning ----------
/** Returns [{rule, line, snippet}] for one file. */
export function scanFile(path, rawSource) {
  const isCss = path.endsWith(".css");
  const isTsx = path.endsWith(".tsx");
  const isCode = /\.(tsx|ts|jsx|js)$/.test(path);
  if (!isCss && !isCode) return [];
  if (/\.(test|spec)\.tsx?$/.test(path)) return [];
  const source = blankComments(rawSource, isCss);
  const found = [];
  const add = (rule, index, snippet) => found.push({ rule, line: lineOf(source, index), snippet: String(snippet).replace(/\s+/g, " ").slice(0, 60) });
  const isToken = TOKEN_FILES.has(path);

  // --- raw elements (tsx only, outside the shared ui folder)
  if (isTsx && !path.startsWith(SHARED_CONTROL_DIR)) {
    for (const m of source.matchAll(/<Button\b[^>]*?\bvariant="bare"/g)) add("button-bare", m.index, m[0]);
    for (const m of source.matchAll(/<TextLink\b[^>]*?\bvariant="bare"/g)) add("link-bare", m.index, m[0]);
    for (const m of source.matchAll(/<(button|input|select|textarea|table|h1)(?=[\s>/])/g)) {
      if (m[1] === "input" && /^<input\b[^>]*?\btype=["']hidden["']/.test(source.slice(m.index, m.index + 400))) continue;
      add("raw-control", m.index, m[0]);
    }
    for (const m of source.matchAll(/<h[2-6](?=[\s>/])/g)) add("raw-heading", m.index, m[0]);
    for (const m of source.matchAll(/<a(?=[\s>])/g)) add("raw-link", m.index, m[0]);
    for (const m of source.matchAll(/<img(?=[\s>/])/g)) add("raw-image", m.index, m[0]);
  }

  // --- colors
  if (!isToken) {
    if (!path.endsWith(".ts")) {
    for (const m of source.matchAll(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
      const before = source.slice(Math.max(0, m.index - 8), m.index);
      if (/(href|to|url|src)=["'{`]*$/.test(before) || /\burl\(\s*["']?$/.test(before) || before.endsWith("&")) continue;
      if (hasAllowMarker(rawSource, m.index)) continue;
      add("hex-color", m.index, m[0]);
    }
    for (const m of source.matchAll(/\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch)\(\s*[-0-9.]/g)) {
      if (hasAllowMarker(rawSource, m.index)) continue;
      add("color-literal", m.index, m[0]);
    }
    const colorDecl = new RegExp(`(?:^|[;{\\s"'\`])(${COLOR_PROPS})\\s*:\\s*([^;{}"'\`\\n]+)`, "g");
    for (const m of source.matchAll(colorDecl)) {
      if (new RegExp(`(?:^|[\\s,(])(?:${NAMED_COLORS})(?=[\\s,;)!]|$)`).test(m[2])) add("color-literal", m.index, m[0].trim());
    }
    }
    if (isCode && !isCss) {
      const pal = new RegExp(`(?<![\\w-])(?:[a-z0-9-]+:)*(?:text|bg|border(?:-[xytrblse])?|ring|ring-offset|fill|stroke|from|to|via|divide|outline|decoration|accent|caret|placeholder|shadow)-(?:(?:${PALETTE})-\\d{2,3}|white|black)(?:/\\d+)?(?![\\w-])`, "g");
      for (const m of source.matchAll(pal)) add("palette-class", m.index, m[0]);
    }
  }

  // --- css declarations (real css files, css strings in tsx, and style={{}} objects)
  const decls = [...declarationsOf(source), ...(isCode && !isCss ? styleObjectsToCss(source) : [])];
  for (const [prop, value, at] of decls) {
    const v = value.replace(/\s*!important\s*$/i, "");
    const isVar = /^var\(/.test(v);
    if (/!important/i.test(value)) add("important", at, `${prop}:${value}`);
    switch (prop) {
      case "font-size": {
        if (isVar || /^(inherit|initial|unset)$/.test(v) || v === "100%" || v === "1em") break;
        const m = /^(-?[0-9.]+)(px|rem)$/.exec(v);
        if (m) { if (!inSet(FONT_SIZE_SCALE_PX, px(num(m[1]), m[2]))) add("font-size-off-scale", at, `${prop}:${value}`); }
        else add("font-size-off-scale", at, `${prop}:${value}`);
        break;
      }
      case "font-family": {
        if (!/^(inherit|initial|unset)\b/.test(v) && !/var\(--font-(inter|jetbrains-mono|mono)\)|var\(--lms-font/.test(v)) add("font-family-off", at, `${prop}:${value}`);
        break;
      }
      case "font-weight": {
        if (isVar || /^(normal|bold|inherit|initial|unset)$/.test(v)) break;
        if (!inSet(FONT_WEIGHTS, num(v))) add("font-weight-off-scale", at, `${prop}:${value}`);
        break;
      }
      case "line-height": {
        if (isVar || /^(normal|inherit|initial|unset)$/.test(v)) break;
        const m = /^(-?[0-9.]+)(px|rem)?$/.exec(v);
        if (!m) add("line-height-off-scale", at, `${prop}:${value}`);
        else if (!m[2]) { if (!inSet(LINE_HEIGHT_UNITLESS, num(m[1]))) add("line-height-off-scale", at, `${prop}:${value}`); }
        else if (!inSet(LINE_HEIGHT_PX, px(num(m[1]), m[2]))) add("line-height-off-scale", at, `${prop}:${value}`);
        break;
      }
      case "letter-spacing": {
        if (isVar || /^(normal|inherit|initial|unset)$/.test(v)) break;
        if (!LETTER_SPACING.includes(normEm(v))) add("letter-spacing-off-scale", at, `${prop}:${value}`);
        break;
      }
      case "border-radius": case "border-top-left-radius": case "border-top-right-radius": case "border-bottom-left-radius": case "border-bottom-right-radius":
      case "border-start-start-radius": case "border-start-end-radius": case "border-end-start-radius": case "border-end-end-radius": {
        if (isVar || /^(inherit|initial|unset)$/.test(v)) break;
        for (const m of v.matchAll(/(-?[0-9.]+)(px|rem|%)?/g)) {
          if (m[2] === "%") { if (num(m[1]) !== 50 && num(m[1]) !== 0) add("radius-off-scale", at, `${prop}:${value}`); }
          else if (!inSet(RADIUS_SCALE_PX, px(num(m[1]), m[2]))) add("radius-off-scale", at, `${prop}:${value}`);
        }
        break;
      }
      case "border-width": case "border-top-width": case "border-right-width": case "border-bottom-width": case "border-left-width":
      case "border": case "border-top": case "border-right": case "border-bottom": case "border-left": {
        if (isVar) break;
        const m = /^(-?[0-9.]+)(px)\b/.exec(v);
        if (m && !inSet(BORDER_WIDTH_PX, num(m[1]))) add("border-width-off-scale", at, `${prop}:${value}`);
        break;
      }
      case "opacity": {
        if (isVar || /^(inherit|initial|unset)$/.test(v)) break;
        if (!inSet(OPACITY, num(v))) add("opacity-off-scale", at, `${prop}:${value}`);
        break;
      }
      case "z-index": {
        if (/^var\(--lms-z-/.test(v) || /^(auto|inherit|initial|unset)$/.test(v)) break;
        if (!inSet(Z_LITERAL_OK, num(v))) add("z-index-literal", at, `${prop}:${value}`);
        break;
      }
      case "box-shadow": case "text-shadow": {
        if (/^(none|inherit|initial|unset)$/.test(v) || /^var\(--[a-z-]+\)$/.test(v)) break;
        if (/[0-9]px|[0-9]rem|inset/.test(v) || /^0\b/.test(v)) add("shadow-literal", at, `${prop}:${value}`);
        break;
      }
      case "padding": case "margin": case "gap": case "row-gap": case "column-gap":
      case "padding-top": case "padding-right": case "padding-bottom": case "padding-left": case "padding-inline": case "padding-block":
      case "padding-inline-start": case "padding-inline-end": case "padding-block-start": case "padding-block-end":
      case "margin-top": case "margin-right": case "margin-bottom": case "margin-left": case "margin-inline": case "margin-block":
      case "margin-inline-start": case "margin-inline-end": case "margin-block-start": case "margin-block-end": {
        if (/var\(|calc\(|clamp\(|min\(|max\(|env\(/.test(v)) break;
        for (const m of v.matchAll(/(-?[0-9.]+)(px|rem)\b/g)) {
          if (!spacingOk(px(num(m[1]), m[2]))) { add("spacing-off-grid", at, `${prop}:${value}`); break; }
        }
        break;
      }
      case "transition": case "transition-duration": case "transition-delay": case "animation": case "animation-duration": case "animation-delay": case "transition-timing-function": case "animation-timing-function": {
        const stripped = v.replace(/var\([^)]*\)/g, "");
        let bad = false;
        for (const m of stripped.matchAll(/(?<![\w.-])(-?[0-9.]+m?s)\b/g)) if (!MOTION_LITERAL_OK.includes(m[1])) bad = true;
        if (/\b(ease|ease-in|ease-out|ease-in-out|step-start|step-end)\b|cubic-bezier\(|steps\(/.test(stripped)) bad = true;
        if (bad) add("motion-literal", at, `${prop}:${value}`);
        break;
      }
      default:
    }
  }

  if (isCss) {
    if (path !== MOTION_FILE && !isToken && !path.endsWith(".module.css")) for (const m of source.matchAll(/@keyframes\s+[\w-]+/g)) add("keyframes-local", m.index, m[0]);
    for (const m of source.matchAll(/@media[^{]*\((max|min)-width:\s*([0-9.]+)(px|em|rem)\)/g)) {
      const w = px(num(m[2]), m[3] === "px" ? "px" : "rem");
      const okMin = MIN_BREAKPOINTS_PX.includes(w), okMax = MIN_BREAKPOINTS_PX.map((x) => x - 1).includes(w);
      if (m[1] === "min" ? !okMin : !okMax) add("breakpoint-off", m.index, m[0].slice(0, 60));
    }
  } else if (isCode) {
    const T = (re, fn) => { for (const m of source.matchAll(re)) fn(m); };
    T(/\b(?:[a-z0-9-]+:)*(?:min|max)-\[[0-9.]+(?:px|rem|em)\]:/g, (m) => add("breakpoint-off", m.index, m[0]));
    T(/\btext-\[([0-9.]+)px\]/g, (m) => { if (!inSet(FONT_SIZE_SCALE_PX, num(m[1]))) add("font-size-off-scale", m.index, m[0]); });
    T(/\btext-(?:[6-9]xl)\b/g, (m) => add("font-size-off-scale", m.index, m[0]));
    T(/\brounded(?:-[trbl]{1,2}|-[se]{1,2})?-\[([0-9.]+)(px|rem)\]/g, (m) => { if (!inSet(RADIUS_SCALE_PX, px(num(m[1]), m[2]))) add("radius-off-scale", m.index, m[0]); });
    T(/\brounded(?:-[trbl]{1,2})?-(2xl|3xl|4xl)\b/g, (m) => add("radius-off-scale", m.index, m[0]));
    T(/(?<![\w-])font-\[([0-9]+)\]/g, (m) => { if (!inSet(FONT_WEIGHTS, num(m[1]))) add("font-weight-off-scale", m.index, m[0]); });
    T(/(?<![\w-])font-(thin|extralight|light|extrabold|black)\b/g, (m) => add("font-weight-off-scale", m.index, m[0]));
    T(/(?<![\w-])leading-\[([0-9.]+)(px|rem)?\]/g, (m) => {
      const ok = m[2] ? inSet(LINE_HEIGHT_PX, px(num(m[1]), m[2])) : inSet(LINE_HEIGHT_UNITLESS, num(m[1]));
      if (!ok) add("line-height-off-scale", m.index, m[0]);
    });
    T(/(?<![\w-])leading-(snug|relaxed|loose|3)\b/g, (m) => add("line-height-off-scale", m.index, m[0]));
    T(/(?<![\w-])tracking-\[(-?[0-9.]+(?:px|em))\]/g, (m) => { if (!LETTER_SPACING.includes(normEm(m[1]))) add("letter-spacing-off-scale", m.index, m[0]); });
    T(/(?<![\w-])border(?:-[trblxy])?-\[([0-9.]+)px\]/g, (m) => { if (!inSet(BORDER_WIDTH_PX, num(m[1]))) add("border-width-off-scale", m.index, m[0]); });
    T(/(?<![\w-])border(?:-[trblxy])?-(4|8)\b/g, (m) => add("border-width-off-scale", m.index, m[0]));
    T(/(?<![\w-])opacity-\[([0-9.]+)\]/g, (m) => { if (!inSet(OPACITY, num(m[1]))) add("opacity-off-scale", m.index, m[0]); });
    T(/(?<![\w-])opacity-([0-9]+)\b/g, (m) => { if (!inSet(OPACITY, num(m[1]) / 100)) add("opacity-off-scale", m.index, m[0]); });
    T(/(?<![\w-])-?(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|gap|gap-x|gap-y|space-x|space-y)-\[(-?[0-9.]+)(px|rem)\]/g, (m) => { if (!spacingOk(px(num(m[1]), m[2]))) add("spacing-off-grid", m.index, m[0]); });
    T(/(?<![\w-])-?(?:p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|gap|gap-x|gap-y|space-x|space-y)-(?:2\.5|3\.5)\b/g, (m) => add("spacing-off-grid", m.index, m[0]));
    T(/(?<![\w-])shadow-\[(?!var\()/g, (m) => add("shadow-literal", m.index, m[0]));
    T(/(?<![\w-])shadow-(2xl|inner)\b/g, (m) => add("shadow-literal", m.index, m[0]));
    T(/(?<![\w-])z-(?:\[([0-9-]+)\]|([0-9]+))(?![\w-])/g, (m) => { if (!inSet(Z_LITERAL_OK, num(m[1] ?? m[2]))) add("z-index-literal", m.index, m[0]); });
    T(/(?<![\w-])(?:duration|delay)-(?:\[[0-9.]+m?s\]|[0-9]+)(?![\w-])/g, (m) => add("motion-literal", m.index, m[0]));
    T(/(?<![\w-])ease-(?:in|out|in-out|\[(?!var\()[^\]]+\])(?![\w-])/g, (m) => add("motion-literal", m.index, m[0]));
    T(/(?<![\w-])animate-(?!pulse\b|spin\b|none\b)[a-z[]/g, (m) => add("motion-literal", m.index, m[0]));
    T(/(?<![\w-])(?:[a-z0-9-]+:)*-?(?:w|h|min-w|min-h|max-w|max-h|size|top|left|right|bottom|inset|inset-x|inset-y|basis)-\[(-?[0-9.]+)px\]/g, (m) => { const n = Math.abs(num(m[1])); if (!(n % 4 === 0 || n === 1 || n === 2 || n === 6)) add("size-off-grid", m.index, m[0]); });
    T(/(?<![\w-])(?:[a-z0-9-]+:)*(?:outline(?:-offset)?|ring(?:-offset)?)-(?!none\b|hidden\b)(?:\[|[0-9]|inset\b)[^\s"'`]*/g, (m) => add("focus-style-off", m.index, m[0]));
    T(/(?<![\w-])(?:[a-z0-9-]+:)*text-\[(?:clamp|[0-9.]+(?:vw|vh|rem|em))[^\]]*\]/g, (m) => add("font-size-off-scale", m.index, m[0]));
    for (const m of source.matchAll(/<svg[^>]*?\b(?:width|height)="([0-9.]+)"/g)) { if (![12, 14, 16, 18, 20, 24, 32, 48, 64].includes(num(m[1])) && num(m[1]) < 40) add("icon-size-off", m.index, m[0].slice(0, 40)); }
    T(/(?:^|[\s"'`:])!(?=[a-z]+(?:-[a-z0-9[]|[[]))/g, (m) => add("important", m.index, source.slice(m.index, m.index + 24)));
  }
  return found;
}
