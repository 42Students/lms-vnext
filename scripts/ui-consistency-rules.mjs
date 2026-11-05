// UI consistency rules: one place that defines what "consistent" means.
// Scale values must stay in sync with src/app/globals.css tokens.
export const FONT_SIZE_SCALE_PX = [12, 13, 14, 16, 18, 20, 24, 30, 36];
export const RADIUS_SCALE_PX = [0, 2, 4, 6, 8, 10, 12, 14, 18, 20, 999];

const TOKEN_FILES = new Set(["src/app/globals.css", "src/components/ui/branding-color-tokens.ts"]);
const SHARED_CONTROL_DIR = "src/components/ui/";

export const RULES = {
  "raw-control": "Use the shared Button/Input/Select/Textarea/DataTable/PageHeader instead of raw <button>/<input>/<select>/<textarea>/<table>/<h1>.",
  "hex-color": "Use a --lms-* color token instead of a hex literal.",
  "font-size-off-scale": `Font sizes must be one of ${FONT_SIZE_SCALE_PX.join("/")}px.`,
  "radius-off-scale": `Border radius must be one of ${RADIUS_SCALE_PX.join("/")}px (or 50%).`,
  "font-family-off": "Use the Inter stack (var(--font-inter)), inherit, or the mono token; no other families.",
};

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

/** Returns [{rule, line, snippet}] for one file. */
export function scanFile(path, rawSource) {
  const isCss = path.endsWith(".css");
  const isCode = /\.(tsx|ts|jsx|js)$/.test(path);
  if (!isCss && !isCode) return [];
  const source = blankComments(rawSource, isCss);
  const found = [];
  const add = (rule, index, snippet) => found.push({ rule, line: lineOf(source, index), snippet: snippet.slice(0, 60) });

  if (path.endsWith(".tsx") && !path.startsWith(SHARED_CONTROL_DIR)) {
    for (const m of source.matchAll(/<(button|input|select|textarea|table|h1)(?=[\s>/])/g)) add("raw-control", m.index, m[0]);
  }

  if (!TOKEN_FILES.has(path)) {
    for (const m of source.matchAll(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
      const before = source.slice(Math.max(0, m.index - 8), m.index);
      if (/(href|to|url|src)=["'{`]*$/.test(before) || /\burl\(\s*["']?$/.test(before)) continue;
      add("hex-color", m.index, m[0]);
    }
  }

  const sizeOk = (n) => FONT_SIZE_SCALE_PX.includes(n);
  const radiusOk = (n) => RADIUS_SCALE_PX.includes(n);
  if (isCss) {
    for (const m of source.matchAll(/font-size:\s*([0-9.]+)px/g)) if (!sizeOk(Number(m[1]))) add("font-size-off-scale", m.index, m[0]);
    for (const m of source.matchAll(/border-radius:\s*([0-9.]+)px(?=\s*[;}!])/g)) if (!radiusOk(Number(m[1]))) add("radius-off-scale", m.index, m[0]);
    for (const m of source.matchAll(/font-family:\s*([^;}]+)/g)) {
      const v = m[1].trim();
      if (!/^(inherit|initial|unset)\b/.test(v) && !/var\(--font-(inter|jetbrains-mono|mono)\)|var\(--lms-font/.test(v)) add("font-family-off", m.index, m[0]);
    }
  } else {
    for (const m of source.matchAll(/text-\[([0-9.]+)px\]/g)) if (!sizeOk(Number(m[1]))) add("font-size-off-scale", m.index, m[0]);
    for (const m of source.matchAll(/rounded(?:-[trbl]{1,2})?-\[([0-9.]+)px\]/g)) if (!radiusOk(Number(m[1]))) add("radius-off-scale", m.index, m[0]);
    for (const m of source.matchAll(/fontSize:\s*([0-9.]+)\b(?!\s*["'])/g)) if (!sizeOk(Number(m[1]))) add("font-size-off-scale", m.index, m[0]);
    for (const m of source.matchAll(/borderRadius:\s*([0-9.]+)\b(?!\s*["'])/g)) if (!radiusOk(Number(m[1]))) add("radius-off-scale", m.index, m[0]);
  }
  return found;
}
