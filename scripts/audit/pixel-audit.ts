/**
 * Pixel audit: renders every static page route as a seeded role at 1280x800 and flags visible elements whose
 * computed colour, border radius, font size, font weight or font family is not in the set of values the old LMS
 * itself uses (extracted from docs/design/legacy-styles/*.scss and docs/design/old-lms-shell*).
 *
 * usage: npx tsx scripts/audit/pixel-audit.ts <accounts.json> <out.json> [--role=tpo] [--limit=N]
 * accounts.json: { "<role>": { "uid": "...", "prefixes": ["/tpo"] } }   (uids only, never secrets)
 * env: E2E_AUTH_SECRET (read from .env.local), BASE_URL (default http://localhost:8080)
 */
import { chromium, request as pwRequest, type BrowserContext } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");
const BASE = process.env.BASE_URL || "http://localhost:8080";
const [accountsFile, outFile, ...flags] = process.argv.slice(2);
const only = flags.find((f) => f.startsWith("--role="))?.slice(7);
const limit = Number(flags.find((f) => f.startsWith("--limit="))?.slice(8) || 0);

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  const p = path.join(ROOT, ".env.local");
  if (fs.existsSync(p)) for (const l of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const i = l.indexOf("="); if (i > 0 && !l.startsWith("#")) env[l.slice(0, i)] = l.slice(i + 1).replace(/^["']|["']$/g, "");
  }
  return env;
}
const env = loadEnv();
const SECRET = process.env.E2E_AUTH_SECRET || env.E2E_AUTH_SECRET;
if (!SECRET) throw new Error("E2E_AUTH_SECRET missing");

// ---- allowed value sets from the old LMS styles ----
const legacyDir = path.join(ROOT, "docs/design/legacy-styles");
const legacyFiles = [...fs.readdirSync(legacyDir).filter((f) => f.endsWith(".scss")).map((f) => path.join(legacyDir, f)), path.join(ROOT, "docs/design/old-lms-shell.css"), path.join(ROOT, "docs/design/old-lms-shell-spec.md")];
const colors = new Set<string>(["rgb(255, 255, 255)", "rgb(0, 0, 0)"]);
const radii = new Set<number>([0]);
const sizes = new Set<number>();
for (const f of legacyFiles) {
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    let h = m[1].toLowerCase(); if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    colors.add(`rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})`);
  }
  for (const m of s.matchAll(/border-radius:\s*([^;]+);/g)) for (const n of m[1].matchAll(/(\d+(?:\.\d+)?)px/g)) radii.add(Number(n[1]));
  for (const m of s.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) sizes.add(Number(m[1]));
}
const weights = [400, 500, 600, 650, 700];
const allowed = { colors: [...colors], radii: [...radii], sizes: [...sizes], weights };

// ---- routes ----
function staticRoutes(prefix: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "page.tsx") {
        const rel = path.relative(path.join(ROOT, "src/app"), dir).split(path.sep).filter((s) => !/^\(.*\)$/.test(s));
        if (rel.some((s) => s.includes("["))) continue;
        out.push("/" + rel.join("/"));
      }
    }
  };
  walk(path.join(ROOT, "src/app"));
  return out.filter((r) => r === prefix || r.startsWith(prefix + "/")).sort();
}

const measure = `(allowed) => {
  const colors = new Set(allowed.colors), radii = new Set(allowed.radii), sizes = new Set(allowed.sizes), weights = new Set(allowed.weights);
  const found = {};
  const add = (kind, value, el, extra) => {
    const k = kind + "|" + value;
    const f = found[k] || (found[k] = { kind, value, count: 0, samples: [] });
    f.count++;
    if (f.samples.length < 3) {
      const cls = (typeof el.className === "string" ? el.className : "").split(/\\s+/).filter(Boolean).slice(0, 3).join(".");
      const txt = (el.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 28);
      f.samples.push(el.tagName.toLowerCase() + (cls ? "." + cls : "") + (txt ? ' "' + txt + '"' : "") + (extra ? " " + extra : ""));
    }
  };
  const parse = (c) => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(",").map((x) => parseFloat(x)); return { rgb: "rgb(" + p[0] + ", " + p[1] + ", " + p[2] + ")", a: p.length > 3 ? p[3] : 1 }; };
  let n = 0;
  for (const el of document.body.querySelectorAll("*")) {
    const tag = el.tagName.toLowerCase();
    if (["script", "style", "noscript", "path", "g", "circle", "rect", "line", "polyline", "use", "defs"].includes(tag)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none" || parseFloat(s.opacity) === 0) continue;
    n++;
    const hasText = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
    if (hasText) {
      const c = parse(s.color); if (c && c.a > 0.5 && !colors.has(c.rgb)) add("text-color", c.rgb, el);
      const fs = parseFloat(s.fontSize); if (!sizes.has(fs)) add("font-size", s.fontSize, el);
      if (!weights.has(Number(s.fontWeight))) add("font-weight", s.fontWeight, el);
      const fam = s.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      if (!/^(Inter|JetBrains Mono|__Inter|__JetBrains)/i.test(fam) && !/Fallback/i.test(fam)) add("font-family", fam, el);
    }
    const bg = parse(s.backgroundColor); if (bg && bg.a >= 0.99 && !colors.has(bg.rgb)) add("bg-color", bg.rgb, el);
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      const w = parseFloat(s["border" + side + "Width"]); if (w > 0 && s["border" + side + "Style"] !== "none") {
        const bc = parse(s["border" + side + "Color"]); if (bc && bc.a > 0.5 && !colors.has(bc.rgb)) add("border-color", bc.rgb, el, side);
      }
    }
    for (const corner of ["TopLeft", "TopRight", "BottomRight", "BottomLeft"]) {
      const v = s["border" + corner + "Radius"].split(" ")[0];
      if (v.endsWith("%")) continue;
      const px = parseFloat(v); if (px > 0 && px < 100 && !radii.has(px)) add("radius", v, el, corner);
    }
  }

  const geo = {};
  const bump = (k, label) => { const g = geo[k] || (geo[k] = {}); g[label] = (g[label] || 0) + 1; };
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs2 = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs2.visibility !== 'hidden' && cs2.display !== 'none'; };
  for (const b of document.body.querySelectorAll('[data-slot=button]')) { if (!vis(b)) continue; const r = b.getBoundingClientRect(), c = getComputedStyle(b); bump('button', b.dataset.variant + ' h' + Math.round(r.height) + ' r' + c.borderTopLeftRadius + ' fs' + c.fontSize + ' fw' + c.fontWeight + ' pl' + c.paddingLeft); }
  for (const i of document.body.querySelectorAll('input,select,textarea')) { if (!vis(i) || ['checkbox','radio','hidden','file','range','color'].includes(i.type)) continue; const r = i.getBoundingClientRect(), c = getComputedStyle(i); bump(i.tagName.toLowerCase(), 'h' + Math.round(r.height) + ' r' + c.borderTopLeftRadius + ' fs' + c.fontSize + ' pl' + c.paddingLeft + ' b' + c.borderTopColor); }
  for (const t of document.body.querySelectorAll('th')) { if (!vis(t)) continue; const c = getComputedStyle(t); bump('th', 'fs' + c.fontSize + ' fw' + c.fontWeight + ' pt' + c.paddingTop + ' pl' + c.paddingLeft + ' bg' + c.backgroundColor + ' c' + c.color); }
  for (const t of document.body.querySelectorAll('td')) { if (!vis(t)) continue; const c = getComputedStyle(t); bump('td', 'fs' + c.fontSize + ' pt' + c.paddingTop + ' pl' + c.paddingLeft + ' bb' + c.borderBottomColor); }
  for (const el of document.body.querySelectorAll('div,section,article,aside')) { if (!vis(el)) continue; const c = getComputedStyle(el); const rad = parseFloat(c.borderTopLeftRadius); if (rad >= 8 && parseFloat(c.borderTopWidth) === 1 && c.backgroundColor === 'rgb(255, 255, 255)') bump('card', 'r' + c.borderTopLeftRadius + ' pad' + c.paddingTop + '/' + c.paddingLeft + ' b' + c.borderTopColor + ' sh' + (c.boxShadow === 'none' ? 'none' : 'shadow')); }
  for (const h of document.body.querySelectorAll('h2,h3')) { if (!vis(h)) continue; const c = getComputedStyle(h); bump(h.tagName.toLowerCase(), 'fs' + c.fontSize + ' fw' + c.fontWeight + ' c' + c.color); }

  const strings = new Set();
  for (const el of document.body.querySelectorAll("h1,h2,h3,button,a,th,label,legend,summary,[role=tab]")) { if (!vis(el)) continue; const t = (el.innerText || "").replace(/\\s+/g, " ").trim(); if (t.length >= 2 && t.length <= 70) strings.add(el.tagName.toLowerCase() + "|" + t); }
  const iw = window.innerWidth;
  const inScroller = (el) => { let p = el.parentElement; while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; const pr = p.getBoundingClientRect(); if ((o === 'auto' || o === 'scroll' || o === 'hidden') && pr.right <= iw + 1) return true; p = p.parentElement; } return false; };
  const offenders = [];
  for (const el of document.body.querySelectorAll('*')) { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue; const c = getComputedStyle(el); if (c.position === 'fixed' || c.visibility === 'hidden' || c.display === 'none') continue; if (r.right > iw + 1 && !inScroller(el)) { const cls = (typeof el.className === 'string' ? el.className : '').split(/s+/).filter(Boolean).slice(0, 2).join('.'); offenders.push(el.tagName.toLowerCase() + (cls ? '.' + cls : '') + ' right=' + Math.round(r.right) + ' w=' + Math.round(r.width)); if (offenders.length >= 4) break; } }
  const taps = [];
  if (iw < 768) for (const el of document.body.querySelectorAll('[data-slot=button], input, select, textarea')) { if (['hidden','checkbox','radio','file'].includes(el.type)) continue; const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue; if (r.height < 44 || r.width < 44) { const c = getComputedStyle(el); if (c.visibility === 'hidden' || c.display === 'none') continue; taps.push(el.tagName.toLowerCase() + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' ' + ((el.innerText || el.getAttribute('aria-label') || el.placeholder || '').trim().slice(0, 18))); } }
  const responsive = { iw, scrollWidth: document.documentElement.scrollWidth, overflowPx: Math.max(0, document.documentElement.scrollWidth - iw), offenders, tapCount: taps.length, tapSamples: taps.slice(0, 4) };
  return { elements: n, title: document.title, violations: Object.values(found), geo, responsive, strings: [...strings].slice(0, 220), text: (document.body.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 140), h1: [...document.querySelectorAll("h1")].map((h) => { const s = getComputedStyle(h); return s.fontSize + "/" + s.fontWeight + "/" + s.color; }) };
}`;

async function main() {
  const accounts = JSON.parse(fs.readFileSync(accountsFile, "utf8")) as Record<string, { uid: string; prefixes: string[]; login?: string }>;
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const report: any = { when: new Date().toISOString(), allowedCounts: { colors: colors.size, radii: radii.size, sizes: sizes.size }, routes: {} as any };
  for (const [role, acct] of Object.entries(accounts)) {
    if (only && role !== only) continue;
    const vp = (process.env.VP || "1280x800").split("x").map(Number);
    const ctx: BrowserContext = await browser.newContext({ viewport: { width: vp[0], height: vp[1] } });
    if (acct.login) {
      // real OTP login (privileged roles reject the e2e identity cookie); dev-only test OTP from .env.local, never printed
      const rctx = await pwRequest.newContext({ baseURL: BASE, extraHTTPHeaders: { Origin: BASE } });
      const st: any = await (await rctx.post("/api/auth/login/start", { data: { channel: "PHONE", contact: "+" + acct.login } })).json().catch(() => ({}));
      if (st.attemptId) await rctx.post("/api/auth/login/verify", { data: { attemptId: st.attemptId, code: env.AUTH_TEST_OTP, ...(st.requiresSecondFactor ? { secondCode: env.AUTH_TEST_OTP } : {}) } });
      await ctx.addCookies((await rctx.storageState()).cookies);
      await rctx.dispose();
    } else await ctx.addCookies([
      { name: "lms_e2e_identity", value: acct.uid, url: BASE, httpOnly: true, sameSite: "Lax" },
      { name: "lms_e2e_secret", value: SECRET!, url: BASE, httpOnly: true, sameSite: "Lax" },
    ]);
    try {
      const res = await ctx.request.get(BASE + "/api/auth/memberships");
      const j: any = await res.json().catch(() => ({}));
      const m = (j.memberships || [])[0];
      if (m?.id) await ctx.addCookies([{ name: "lms_membership", value: m.id, url: BASE, httpOnly: true, sameSite: "Lax" }]);
    } catch { /* identity without memberships (superadmin / recruiter) */ }
    let routes = acct.prefixes.flatMap(staticRoutes);
    if (limit) routes = routes.slice(0, limit);
    const page = await ctx.newPage();
    for (const route of routes) {
      const t0 = Date.now();
      try {
        const resp = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 90000 });
        await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
        await page.waitForTimeout(600);
        const url = new URL(page.url()).pathname;
        const status = resp?.status();
        if (/\/login/.test(url) && !route.includes("login")) { report.routes[route] = { role, status, error: "REDIRECTED_TO_LOGIN" }; continue; }
        const m: any = await page.evaluate(`(${measure})(${JSON.stringify(allowed)})`);
        report.routes[route] = { role, status, finalPath: url, ms: Date.now() - t0, ...m };
      } catch (e: any) { report.routes[route] = { role, error: String(e.message || e).slice(0, 120) }; }
      fs.writeFileSync(outFile, JSON.stringify(report));
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(outFile, JSON.stringify(report));
  console.log("done routes:", Object.keys(report.routes).length);
}
main().catch((e) => { console.error(e); process.exit(1); });
